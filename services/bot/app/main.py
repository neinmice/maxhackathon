from __future__ import annotations

from contextlib import asynccontextmanager
import base64
import hashlib
import hmac
import json
import logging
from typing import Any
import uuid

from fastapi import Depends, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field

from .catalog import measure_exists
from .config import Settings
from .handlers import BotHandlers, update_hash
from .max_client import MaxApiClient
from .security import LaunchDataError, LaunchIdentity, validate_launch_data
from .store import PostgresStore

logger = logging.getLogger(__name__)


class LaunchDataRequest(BaseModel):
    init_data: str = Field(min_length=1)


class QuizSubmitRequest(BaseModel):
    quiz_version: str = Field(min_length=1, max_length=64)
    answers: dict[str, str]


class NotificationOptInRequest(BaseModel):
    enabled: bool


class ChecklistItemRequest(BaseModel):
    item_key: str = Field(min_length=1, max_length=64)
    completed: bool


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def request_id_for(request: Request) -> str:
    current = getattr(request.state, "request_id", None)
    if isinstance(current, str) and current:
        return current
    generated = uuid.uuid4().hex
    request.state.request_id = generated
    return generated


def error_body(request: Request, code: str, message: str) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id_for(request),
        }
    }


def _error(status_code: int, code: str, message: str) -> ApiError:
    return ApiError(status_code, code, message)


def install_error_handlers(app: FastAPI) -> None:
    @app.middleware("http")
    async def assign_request_id(request: Request, call_next):
        request.state.request_id = uuid.uuid4().hex
        return await call_next(request)

    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(request, exc.code, exc.message),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        code = "http_error"
        message = "Запрос отклонён"
        detail = exc.detail
        if isinstance(detail, dict):
            raw_code = detail.get("code") or detail.get("error", {}).get("code")
            raw_message = detail.get("message") or detail.get("error", {}).get("message")
            if isinstance(raw_code, str) and raw_code:
                code = raw_code
            if isinstance(raw_message, str) and raw_message:
                message = raw_message
        elif isinstance(detail, str) and detail:
            message = detail
        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(request, code, message),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        del exc
        return JSONResponse(
            status_code=422,
            content=error_body(request, "validation_error", "Некорректный запрос"),
        )

    @app.exception_handler(Exception)
    async def unexpected_error_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("unhandled bot error request_id=%s", request_id_for(request))
        return JSONResponse(
            status_code=500,
            content=error_body(request, "internal_error", "Внутренняя ошибка"),
        )


def _certificate_payload(
    *,
    certificate_id: str,
    quiz_version: str,
    score: int,
    issued_at: str,
    signing_secret: str,
) -> str:
    if not signing_secret:
        raise _error(503, "certificate_signing_not_configured", "Сертификаты пока не настроены")
    payload = {
        "certificate_id": certificate_id,
        "quiz_version": quiz_version,
        "score": score,
        "issued_at": issued_at,
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    ).decode("ascii").rstrip("=")
    signature = hmac.new(
        signing_secret.encode("utf-8"),
        encoded.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded}.{signature}"


def create_app(
    *,
    settings: Settings | None = None,
    store: Any | None = None,
    max_client: MaxApiClient | None = None,
) -> FastAPI:
    app_settings = settings or Settings.from_env()
    app_store = store or PostgresStore(app_settings.database_url)
    app_max_client = max_client or MaxApiClient(app_settings)


    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if app_settings.app_env == "production":
            app_store.ensure_schema()
        else:
            try:
                app_store.ensure_schema()
            except Exception:
                logger.warning(
                    "Bot database is unavailable; readiness stays not ready until it connects"
                )
        yield

    app = FastAPI(
        title="ZVERY MAX Bot Service",
        version="0.1.0",
        lifespan=lifespan,
    )
    install_error_handlers(app)
    app.state.settings = app_settings
    app.state.store = app_store
    app.state.max_client = app_max_client
    app.state.handlers = BotHandlers(
        settings=app_settings,
        store=app_store,
        max_client=app_max_client,
    )

    def settings_dependency(request: Request) -> Settings:
        return request.app.state.settings

    def store_dependency(request: Request) -> Any:
        return request.app.state.store

    def identity_dependency(
        request: Request,
        x_max_init_data: str | None = Header(default=None, alias="X-Max-Init-Data"),
    ) -> LaunchIdentity:
        settings = settings_dependency(request)
        if not x_max_init_data:
            raise _error(401, "launch_data_required", "Требуется X-Max-Init-Data")
        try:
            return validate_launch_data(
                x_max_init_data,
                settings.max_bot_token,
                max_age_seconds=settings.max_launch_max_age_seconds,
            )
        except LaunchDataError as exc:
            raise _error(401, "invalid_launch_data", "Некорректные данные запуска") from exc


    @app.get("/health")
    def health(
        request: Request,
        settings: Settings = Depends(settings_dependency),
    ) -> JSONResponse:
        store = store_dependency(request)
        database_ready = bool(store.ping())
        body = {
            "status": "ok" if database_ready else "not_ready",
            "service": "bot",
            "version": "0.1.0",
            "max_configured": bool(settings.max_bot_token),
            "webhook_configured": bool(settings.max_webhook_secret and settings.public_base_url),
            "database_ready": database_ready,
        }
        return JSONResponse(status_code=200 if database_ready else 503, content=body)


    @app.post("/webhooks/max")
    async def receive_max_webhook(
        update: dict[str, Any],
        request: Request,
        x_max_bot_api_secret: str | None = Header(default=None, alias="X-Max-Bot-Api-Secret"),
    ) -> dict[str, Any]:
        settings = settings_dependency(request)
        if not settings.max_webhook_secret:
            raise _error(503, "webhook_not_configured", "MAX_WEBHOOK_SECRET не настроен")
        if not x_max_bot_api_secret or not hmac.compare_digest(
            x_max_bot_api_secret,
            settings.max_webhook_secret,
        ):
            raise _error(401, "invalid_webhook_secret", "Неверный секрет webhook")

        store = store_dependency(request)
        payload_hash = update_hash(update)
        if not store.claim_update(payload_hash):
            return {"ok": True, "duplicate": True}

        # Claim is processing, not processed. A handler error releases it.
        # This is at-least-once handling, not exactly-once delivery to MAX.
        try:
            await request.app.state.handlers.process(update)
        except Exception:
            store.release_update(payload_hash)
            logger.exception("webhook handler failed; claim released for retry")
            raise _error(500, "webhook_processing_failed", "Событие не обработано")
        store.complete_update(payload_hash)
        return {"ok": True}

    @app.post("/api/v1/auth/max/launch-data")
    def verify_launch_data(
        payload: LaunchDataRequest,
        request: Request,
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        settings = settings_dependency(request)
        try:
            identity = validate_launch_data(
                payload.init_data,
                settings.max_bot_token,
                max_age_seconds=settings.max_launch_max_age_seconds,
            )
        except LaunchDataError as exc:
            raise _error(401, "invalid_launch_data", "Некорректные данные запуска") from exc
        store.touch_user(identity.user_id)
        return {
            "user": {
                "id": identity.user_id,
                "first_name": identity.raw_user.get("first_name"),
                "last_name": identity.raw_user.get("last_name"),
                "username": identity.raw_user.get("username"),
            },
            "auth_date": identity.auth_date,
        }

    @app.post("/api/v1/measures/{measure_id}/save")
    def save_measure(
        measure_id: str,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        if not measure_exists(measure_id):
            raise _error(404, "measure_not_found", "Мера не найдена")
        created = store.save_measure(identity.user_id, measure_id)
        return {"measure_id": measure_id, "saved": True, "created": created}

    @app.delete("/api/v1/measures/{measure_id}/save")
    def remove_saved_measure(
        measure_id: str,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        removed = store.remove_saved_measure(identity.user_id, measure_id)
        return {"measure_id": measure_id, "saved": False, "removed": removed}

    @app.get("/api/v1/measures/saved")
    def saved_measures(
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, list[str]]:
        return {"measure_ids": store.list_saved_measures(identity.user_id)}

    @app.get("/api/v1/measures/{measure_id}/checklist")
    def checklist(
        measure_id: str,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        from .catalog import get_measure

        measure = get_measure(measure_id)
        if not measure:
            raise _error(404, "measure_not_found", "Мера не найдена")
        progress = store.get_checklist(identity.user_id, measure_id)
        documents = measure.get("documents", [])
        return {
            "measure_id": measure_id,
            "items": [
                {
                    "key": str(index),
                    "label": label,
                    "completed": bool(progress.get(str(index), False)),
                }
                for index, label in enumerate(documents)
            ],
        }

    @app.post("/api/v1/measures/{measure_id}/checklist")
    def update_checklist(
        measure_id: str,
        payload: ChecklistItemRequest,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        from .catalog import get_measure

        measure = get_measure(measure_id)
        if not measure:
            raise _error(404, "measure_not_found", "Мера не найдена")
        documents = measure.get("documents", [])
        try:
            index = int(payload.item_key)
        except ValueError as exc:
            raise _error(422, "checklist_item_invalid", "Пункт чеклиста не найден") from exc
        if index < 0 or index >= len(documents):
            raise _error(422, "checklist_item_invalid", "Пункт чеклиста не найден")
        completed = store.set_checklist_item(
            identity.user_id,
            measure_id,
            payload.item_key,
            payload.completed,
        )
        return {
            "measure_id": measure_id,
            "item_key": payload.item_key,
            "completed": completed,
        }


    @app.get("/api/v1/notifications/opt-in")
    def notification_opt_in_state(
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        return {"enabled": store.get_notifications(identity.user_id)}

    @app.post("/api/v1/notifications/opt-in")
    def notification_opt_in(
        payload: NotificationOptInRequest,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        enabled = store.set_notifications(identity.user_id, payload.enabled)
        return {"enabled": enabled}


    @app.post("/api/v1/quiz/submit")
    def submit_quiz(
        payload: QuizSubmitRequest,
        request: Request,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        settings = settings_dependency(request)
        if not settings.quiz_answer_key_json:
            raise _error(503, "quiz_not_configured", "Ключ ответов квиза ещё не настроен")
        try:
            answer_key = json.loads(settings.quiz_answer_key_json).get(payload.quiz_version)
        except json.JSONDecodeError as exc:
            raise _error(503, "quiz_config_invalid", "Конфигурация квиза некорректна") from exc
        if not isinstance(answer_key, dict) or not answer_key:
            raise _error(422, "quiz_version_not_found", "Версия квиза не найдена")
        if set(payload.answers) != set(answer_key):
            raise _error(422, "quiz_answers_invalid", "Набор ответов не соответствует квизу")
        if any(not isinstance(value, str) or not value for value in payload.answers.values()):
            raise _error(422, "quiz_answers_invalid", "Набор ответов не соответствует квизу")
        if any(not isinstance(value, str) or not value for value in answer_key.values()):
            raise _error(503, "quiz_config_invalid", "Конфигурация квиза некорректна")

        correct = sum(payload.answers[key] == value for key, value in answer_key.items())
        score = round(correct * 100 / len(answer_key))
        passed = score >= settings.quiz_pass_score
        if passed and not settings.certificate_signing_secret:
            raise _error(
                503,
                "certificate_signing_not_configured",
                "Сертификаты пока не настроены",
            )
        try:
            result = store.record_quiz_attempt(
                user_id=identity.user_id,
                quiz_version=payload.quiz_version,
                score=score,
                passed=passed,
            )
        except Exception as exc:
            raise _error(500, "quiz_store_failed", "Результат квиза не сохранён") from exc
        certificate = None
        if passed:
            certificate_id = result.get("certificate_id")
            issued_at = result.get("issued_at")
            if not certificate_id or not issued_at:
                raise _error(500, "quiz_store_failed", "Результат квиза не сохранён")
            certificate = {
                "certificate_id": certificate_id,
                "title": "Памятный сертификат за прохождение квиза*",
                "disclaimer": (
                    "Сертификат носит информационно-поощрительный характер и не является "
                    "документом государственного образца об образовании или квалификации."
                ),
                "payload": _certificate_payload(
                    certificate_id=certificate_id,
                    quiz_version=payload.quiz_version,
                    score=score,
                    issued_at=issued_at,
                    signing_secret=settings.certificate_signing_secret,
                ),
            }
        return {
            "attempt_id": result["attempt_id"],
            "score": score,
            "passed": passed,
            "pass_score": settings.quiz_pass_score,
            "certificate": certificate,
        }

    return app


app = create_app()

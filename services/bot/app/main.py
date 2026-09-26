from __future__ import annotations

from contextlib import asynccontextmanager
import base64
from datetime import datetime, timezone
import hashlib
import hmac
import json
import logging
from typing import Any

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

from .catalog import measure_exists
from .config import Settings
from .handlers import BotHandlers, update_hash
from .max_client import MaxApiClient
from .security import LaunchDataError, LaunchIdentity, validate_launch_data
from .store import InMemoryStore, PostgresStore

logger = logging.getLogger(__name__)


class LaunchDataRequest(BaseModel):
    init_data: str = Field(min_length=1)


class QuizSubmitRequest(BaseModel):
    quiz_version: str = Field(min_length=1, max_length=64)
    answers: dict[str, str]


class NotificationOptInRequest(BaseModel):
    enabled: bool


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message}},
    )


def _certificate_payload(
    *,
    certificate_id: str,
    quiz_version: str,
    issued_at: str,
    signing_secret: str,
) -> str:
    if not signing_secret:
        raise _error(503, "certificate_signing_not_configured", "Сертификаты пока не настроены")
    payload = {
        "certificate_id": certificate_id,
        "quiz_version": quiz_version,
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
        try:
            app_store.ensure_schema()
        except Exception:
            if app_settings.app_env == "production":
                raise
            logger.warning("Bot database is unavailable; use BOT_STORAGE=memory for local handler tests")
        yield

    app = FastAPI(
        title="ZVERY MAX Bot Service",
        version="0.1.0",
        lifespan=lifespan,
    )
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
            raise _error(401, "invalid_launch_data", str(exc)) from exc

    @app.get("/health")
    def health(settings: Settings = Depends(settings_dependency)) -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "bot",
            "version": "0.1.0",
            "max_configured": bool(settings.max_bot_token),
            "webhook_configured": bool(settings.max_webhook_secret and settings.public_base_url),
        }

    @app.post("/webhooks/max")
    async def receive_max_webhook(
        update: dict[str, Any],
        background_tasks: BackgroundTasks,
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
        if not store.claim_update(update_hash(update)):
            return {"ok": True, "duplicate": True}

        background_tasks.add_task(request.app.state.handlers.process, update)
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
            raise _error(401, "invalid_launch_data", str(exc)) from exc
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

    @app.post("/api/v1/notifications/opt-in")
    def notification_opt_in(
        payload: NotificationOptInRequest,
        identity: LaunchIdentity = Depends(identity_dependency),
        store: Any = Depends(store_dependency),
    ) -> dict[str, Any]:
        store.set_notifications(identity.user_id, payload.enabled)
        return {"enabled": payload.enabled}

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
        if not isinstance(answer_key, dict):
            raise _error(422, "quiz_version_not_found", "Версия квиза не найдена")
        if set(payload.answers) != set(answer_key):
            raise _error(422, "quiz_answers_invalid", "Набор ответов не соответствует квизу")

        correct = sum(payload.answers[key] == str(value) for key, value in answer_key.items())
        score = round(correct * 100 / len(answer_key)) if answer_key else 0
        passed = score >= settings.quiz_pass_score
        if passed and not settings.certificate_signing_secret:
            raise _error(
                503,
                "certificate_signing_not_configured",
                "Сертификаты пока не настроены",
            )
        result = store.record_quiz_attempt(
            user_id=identity.user_id,
            quiz_version=payload.quiz_version,
            score=score,
            passed=passed,
        )
        response: dict[str, Any] = {
            "attempt_id": result["attempt_id"],
            "score": score,
            "passed": passed,
            "certificate": None,
        }
        if passed and result["certificate_id"]:
            response["certificate"] = {
                "certificate_id": result["certificate_id"],
                "payload": _certificate_payload(
                    certificate_id=result["certificate_id"],
                    quiz_version=payload.quiz_version,
                    issued_at=result["issued_at"],
                    signing_secret=settings.certificate_signing_secret,
                ),
            }
        return response

    return app


app = create_app()

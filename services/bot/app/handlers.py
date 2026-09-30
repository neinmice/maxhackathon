from __future__ import annotations

import hashlib
import json
import logging
import re
from typing import Any

from .catalog import measure_exists
from .config import Settings
from .max_client import MaxApiClient

logger = logging.getLogger(__name__)


def _event_type(update: dict[str, Any]) -> str:
    return str(update.get("update_type") or update.get("type") or "")


def _event_body(update: dict[str, Any], event_type: str) -> dict[str, Any]:
    body = update.get(event_type)
    if isinstance(body, dict):
        return body
    return update


def _user_id(body: dict[str, Any]) -> str | None:
    user = body.get("user") or body.get("sender")
    if not user and isinstance(body.get("message"), dict):
        message = body["message"]
        user = message.get("sender") or message.get("user")
    if isinstance(user, dict):
        if user.get("is_bot"):
            return None
        if user.get("user_id") is not None:
            uid = str(user["user_id"])
            return None if uid == "428775011" else uid
        if user.get("id") is not None:
            uid = str(user["id"])
            return None if uid == "428775011" else uid
    if body.get("user_id") is not None:
        uid = str(body["user_id"])
        return None if uid == "428775011" else uid
    return None


def _message_text(body: dict[str, Any]) -> str:
    message = body.get("message") if isinstance(body.get("message"), dict) else body
    message_body = message.get("body") if isinstance(message.get("body"), dict) else message
    return str(message_body.get("text") or "").strip()


def _callback_payload(body: dict[str, Any]) -> str:
    callback = body.get("callback") if isinstance(body.get("callback"), dict) else body
    return str(callback.get("payload") or "").strip()


def _start_payload(body: dict[str, Any]) -> str:
    for key in ("payload", "start_payload", "start_param"):
        value = body.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


_START_PARAM_RE = re.compile(r"^[A-Za-z0-9_-]{1,512}$")
_MEASURE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def start_app_payload(value: str) -> str | None:
    payload = value.strip()
    if not payload or _START_PARAM_RE.fullmatch(payload) is None:
        return None
    if payload == "measure" or payload.startswith("measure_"):
        measure_id = payload.removeprefix("measure_")
        if not measure_id or _MEASURE_ID_RE.fullmatch(measure_id) is None:
            return None
        if not measure_exists(measure_id):
            return None
        return f"measure_{measure_id}"
    if payload in {"home", "quiz", "catalog", "saved", "onboarding"}:
        return payload
    return None


def main_menu(settings: Settings, start_payload: str | None = None) -> list[dict[str, Any]]:
    if not settings.max_bot_username:
        return []
    open_payload = start_payload if start_payload and start_payload.startswith("measure_") else "home"
    open_text = "Открыть меру" if open_payload != "home" else "Открыть ZVERY"
    buttons = [
        [
            {
                "type": "open_app",
                "text": open_text,
                "web_app": settings.max_bot_username,
                "payload": open_payload,
            }
        ],
        [
            {
                "type": "open_app",
                "text": "Пройти квиз",
                "web_app": settings.max_bot_username,
                "payload": "quiz",
            },
            {
                "type": "open_app",
                "text": "Каталог мер",
                "web_app": settings.max_bot_username,
                "payload": "catalog",
            },
        ],
        [
            {
                "type": "open_app",
                "text": "Мои сохранённые",
                "web_app": settings.max_bot_username,
                "payload": "saved",
            }
        ],
    ]
    return [{"type": "inline_keyboard", "payload": {"buttons": buttons}}]


class BotHandlers:
    def __init__(self, *, settings: Settings, store: Any, max_client: MaxApiClient) -> None:
        self.settings = settings
        self.store = store
        self.max_client = max_client

    async def process(self, update: dict[str, Any]) -> None:
        """Handle one claimed update.

        The caller marks the update processed only after this returns.
        A raised error leaves the claim uncommitted so a retry can run.
        Success here is not exactly-once delivery to MAX.
        """
        event_type = _event_type(update)
        body = _event_body(update, event_type)
        user_id = _user_id(body)

        if user_id:
            self.store.touch_user(user_id)

        if event_type == "bot_started" and user_id:
            payload = start_app_payload(_start_payload(body))
            text = (
                "Добро пожаловать в ZVERY — навигатор по мерам поддержки бизнеса. "
                "Выберите действие ниже."
            )
            if payload and payload.startswith("measure_"):
                text = "Откройте карточку меры в Mini App. Квиз и вход не пропускаются."
            elif payload is None and _start_payload(body):
                text = "Ссылка запуска не распознана. Откройте Mini App из меню."
            await self.max_client.send_message(
                user_id=user_id,
                text=text,
                attachments=main_menu(self.settings, payload),
            )
            return

        if event_type == "message_callback" and user_id:
            await self._handle_action(user_id, _callback_payload(body))
            return

        if event_type == "message_created" and user_id:
            text = _message_text(body).lower()
            if text in {"/start", "старт", "меню"}:
                await self.max_client.send_message(
                    user_id=user_id,
                    text="Главное меню ZVERY.",
                    attachments=main_menu(self.settings),
                )
            elif text in {"квиз", "пройти квиз"}:
                await self._handle_action(user_id, "quiz")
            elif text in {"каталог", "меры"}:
                await self._handle_action(user_id, "catalog")
            elif text in {"сохранённые", "сохраненные", "мои сохранённые"}:
                await self._handle_action(user_id, "saved")

    async def _handle_action(self, user_id: str, action: str) -> None:
        text_by_action = {
            "quiz": "Откройте Mini App и перейдите в раздел квиза.",
            "catalog": "Откройте Mini App, чтобы посмотреть каталог мер.",
            "saved": "Откройте Mini App, чтобы посмотреть сохранённые меры.",
        }
        text = text_by_action.get(action, "Откройте Mini App, чтобы продолжить.")
        await self.max_client.send_message(
            user_id=user_id,
            text=text,
            attachments=main_menu(self.settings),
        )


def update_hash(update: dict[str, Any]) -> str:
    raw = json.dumps(update, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

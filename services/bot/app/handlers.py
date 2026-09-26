from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

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
    if isinstance(user, dict) and user.get("user_id") is not None:
        return str(user["user_id"])
    if isinstance(user, dict) and user.get("id") is not None:
        return str(user["id"])
    if body.get("user_id") is not None:
        return str(body["user_id"])
    return None


def _message_text(body: dict[str, Any]) -> str:
    message = body.get("message") if isinstance(body.get("message"), dict) else body
    message_body = message.get("body") if isinstance(message.get("body"), dict) else message
    return str(message_body.get("text") or "").strip()


def _callback_payload(body: dict[str, Any]) -> str:
    callback = body.get("callback") if isinstance(body.get("callback"), dict) else body
    return str(callback.get("payload") or "").strip()


def main_menu(settings: Settings) -> list[dict[str, Any]]:
    if not settings.max_bot_username:
        return []
    buttons = [
        [
            {
                "type": "open_app",
                "text": "Открыть ZVERY",
                "web_app": settings.max_bot_username,
                "payload": "home",
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
        event_type = _event_type(update)
        body = _event_body(update, event_type)
        user_id = _user_id(body)

        if user_id:
            self.store.touch_user(user_id)

        if event_type == "bot_started" and user_id:
            await self.max_client.send_message(
                user_id=user_id,
                text=(
                    "Добро пожаловать в ZVERY — навигатор по мерам поддержки бизнеса. "
                    "Выберите действие ниже."
                ),
                attachments=main_menu(self.settings),
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

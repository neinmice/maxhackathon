from __future__ import annotations

import hashlib
import json
import logging
import re
from typing import Any

from .catalog import get_measure, measure_exists
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


def _extract_web_app_data(body: dict[str, Any], update: dict[str, Any]) -> dict[str, Any] | None:
    message = body.get("message") if isinstance(body.get("message"), dict) else body
    candidates: list[Any] = []

    if isinstance(message, dict):
        wad = message.get("web_app_data")
        if isinstance(wad, dict):
            candidates.append(wad.get("data"))
        elif isinstance(wad, str):
            candidates.append(wad)
        candidates.append(message.get("data"))

    if isinstance(body, dict):
        wad = body.get("web_app_data")
        if isinstance(wad, dict):
            candidates.append(wad.get("data"))
        elif isinstance(wad, str):
            candidates.append(wad)
        candidates.append(body.get("data"))

    if isinstance(update, dict):
        wad = update.get("web_app_data")
        if isinstance(wad, dict):
            candidates.append(wad.get("data"))
        elif isinstance(wad, str):
            candidates.append(wad)

    msg_text = _message_text(body)
    if msg_text and msg_text.startswith("{") and msg_text.endswith("}"):
        candidates.append(msg_text)

    for item in candidates:
        if isinstance(item, dict):
            return item
        if isinstance(item, str) and item.strip():
            try:
                parsed = json.loads(item)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                continue
    return None


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


def _bot_username(settings: Settings) -> str:
    return settings.max_bot_username.strip().removeprefix("@")


def _open_app_button(
    *,
    username: str,
    text: str,
    payload: str,
) -> dict[str, str]:
    return {
        "type": "open_app",
        "text": text,
        "web_app": username,
        "payload": payload,
    }


def main_menu(settings: Settings, start_payload: str | None = None) -> list[dict[str, Any]]:
    username = _bot_username(settings)
    if not username:
        return []
    open_payload = start_payload if start_payload and start_payload.startswith("measure_") else "home"
    open_text = "Открыть меру" if open_payload != "home" else "Открыть ZVERY"
    buttons = [
        [
            _open_app_button(
                username=username,
                text=open_text,
                payload=open_payload,
            )
        ],
        [
            _open_app_button(
                username=username,
                text="Пройти квиз",
                payload="quiz",
            ),
            _open_app_button(
                username=username,
                text="Каталог мер",
                payload="catalog",
            ),
        ],
        [
            _open_app_button(
                username=username,
                text="Мои сохранённые",
                payload="saved",
            )
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

        # Check for WebApp sendData payload (certificate or checklist from Mini App)
        web_app_payload = _extract_web_app_data(body, update)
        if web_app_payload and user_id:
            action = str(web_app_payload.get("action") or "").lower()
            if action in {"certificate", "send_certificate"} or "certificate_id" in web_app_payload:
                await self._handle_certificate(user_id, web_app_payload)
                return
            if action in {"checklist", "send_checklist"} or "measure_id" in web_app_payload:
                await self._handle_checklist(user_id, web_app_payload)
                return

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
            elif text in {"сертификат", "мой сертификат", "/cert", "/certificate"}:
                await self._handle_action(user_id, "cert")
            elif text in {"чеклист", "/checklist"}:
                await self._handle_action(user_id, "saved")

    async def _handle_action(self, user_id: str, action: str) -> None:
        text_by_action = {
            "quiz": "Откройте Mini App и перейдите в раздел квиза.",
            "catalog": "Откройте Mini App, чтобы посмотреть каталог мер.",
            "saved": "Откройте Mini App, чтобы посмотреть сохранённые меры.",
            "cert": "Откройте Mini App, чтобы просмотреть полученный сертификат.",
        }
        text = text_by_action.get(action, "Откройте Mini App, чтобы продолжить.")
        await self.max_client.send_message(
            user_id=user_id,
            text=text,
            attachments=main_menu(self.settings),
        )

    async def _handle_certificate(self, user_id: str, data: dict[str, Any]) -> None:
        cert_id = str(data.get("certificate_id") or "").strip()
        score = data.get("score")
        score_str = f"{score}%" if score is not None else "100%"
        user_name = str(data.get("user_name") or "Предприниматель").strip()
        title = str(data.get("title") or "Памятный сертификат за прохождение квиза*").strip()

        cert_display_id = cert_id[:16] if len(cert_id) >= 16 else cert_id or "VERIFIED-ZVERY"

        text = (
            f"🎉 Поздравляем с успешным прохождением квиза!\n\n"
            f"📜 {title}\n"
            f"👤 Предприниматель: {user_name}\n"
            f"🎯 Результат: {score_str}\n"
            f"🆔 Номер: {cert_display_id}\n"
            f"🔐 Верификация: ZVERY Core (HMAC-SHA256)\n\n"
            f"*Памятный сертификат носит информационно-поощрительный характер "
            f"и подтверждает базовые знания мер господдержки бизнеса."
        )

        username = _bot_username(self.settings)
        buttons = []
        if username:
            buttons.append([
                _open_app_button(
                    username=username,
                    text="Открыть сертификат в ZVERY",
                    payload="quiz",
                )
            ])
            buttons.append([
                _open_app_button(
                    username=username,
                    text="Каталог мер поддержки",
                    payload="catalog",
                )
            ])
        attachments = [{"type": "inline_keyboard", "payload": {"buttons": buttons}}] if buttons else None

        await self.max_client.send_message(
            user_id=user_id,
            text=text,
            attachments=attachments,
        )

    async def _handle_checklist(self, user_id: str, data: dict[str, Any]) -> None:
        measure_id = str(data.get("measure_id") or "").strip()
        measure = get_measure(measure_id) if measure_id else None

        title = (
            str(data.get("title") or "")
            or (measure.get("title") if measure else "")
            or "Мера государственной поддержки"
        )
        operator = (
            str(data.get("operator") or "")
            or (measure.get("operator") if measure else "")
        )
        amount = str(data.get("amount") or "")
        deadline = (
            str(data.get("deadline") or "")
            or (measure.get("deadline") if measure else "")
        )

        items = data.get("items")
        checked_keys: set[str] = set()
        doc_list: list[str] = []

        if isinstance(items, list) and items:
            for item in items:
                if isinstance(item, dict):
                    doc_list.append(str(item.get("title") or item.get("label") or ""))
                    if item.get("completed"):
                        checked_keys.add(str(item.get("key", len(doc_list) - 1)))
                elif isinstance(item, str):
                    doc_list.append(item)
        elif measure:
            doc_list = measure.get("documents", [])
            saved_progress = self.store.get_checklist(user_id, measure_id)
            checked_keys = {k for k, v in saved_progress.items() if v}

        if not doc_list:
            doc_list = ["Документы уточняются оператором"]

        completed_count = len(checked_keys)
        total_count = len(doc_list)

        lines = [
            "📋 Чеклист документов для подачи заявки",
            f"📌 Мера: {title}",
        ]
        if operator and operator != "Оператор не указан":
            lines.append(f"🏛 Оператор: {operator}")
        if amount and amount != "Сумма не указана":
            lines.append(f"💰 Сумма: {amount}")
        if deadline and deadline != "срок не указан":
            lines.append(f"⏰ Срок подачи: {deadline}")

        lines.append(f"\nСтатус готовности: {completed_count} из {total_count}")

        for idx, doc in enumerate(doc_list):
            is_done = str(idx) in checked_keys
            icon = "✅" if is_done else "⬜"
            lines.append(f"{icon} {idx + 1}. {doc}")

        lines.append(
            "\n💡 Совет: соберите все отмеченные документы заранее. "
            "Отслеживать статус можно прямо в приложении ZVERY."
        )

        text = "\n".join(lines)

        username = _bot_username(self.settings)
        buttons = []
        if username:
            open_payload = f"measure_{measure_id}" if measure_id and measure_exists(measure_id) else "catalog"
            buttons.append([
                _open_app_button(
                    username=username,
                    text="Открыть меру в ZVERY",
                    payload=open_payload,
                )
            ])
            buttons.append([
                _open_app_button(
                    username=username,
                    text="Мои сохранённые",
                    payload="saved",
                )
            ])
        attachments = [{"type": "inline_keyboard", "payload": {"buttons": buttons}}] if buttons else None

        await self.max_client.send_message(
            user_id=user_id,
            text=text,
            attachments=attachments,
        )


def update_hash(update: dict[str, Any]) -> str:
    raw = json.dumps(update, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

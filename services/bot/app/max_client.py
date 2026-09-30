from __future__ import annotations

import logging
from pathlib import Path
import ssl
from typing import Any

import httpx

from .config import Settings

logger = logging.getLogger(__name__)

_CERTS_DIR = Path(__file__).resolve().parent / "certs"


def _build_ssl_context(custom_ca_path: str | None = None) -> ssl.SSLContext | bool | str:
    if custom_ca_path:
        return custom_ca_path

    try:
        ctx = ssl.create_default_context()
        loaded = False
        for cert_name in ("russian_trusted_root_ca.pem", "russian_trusted_sub_ca.pem"):
            cert_file = _CERTS_DIR / cert_name
            if cert_file.is_file():
                ctx.load_verify_locations(cafile=str(cert_file))
                loaded = True
        if loaded:
            return ctx
    except Exception as exc:
        logger.warning("Failed to initialize bundled Russian CA certificates: %s", exc)
    return True


class MaxApiClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._ssl_context = _build_ssl_context(self.settings.max_ca_bundle_path)

    @property
    def configured(self) -> bool:
        return bool(self.settings.max_bot_token)

    async def send_message(
        self,
        *,
        user_id: str,
        text: str,
        attachments: list[dict[str, Any]] | None = None,
    ) -> None:
        if not self.configured:
            logger.warning("MAX_BOT_TOKEN is not configured; outgoing message suppressed")
            return
        if str(user_id) == "428775011":
            logger.warning("Attempted to send message to bot's own user_id %s; suppressed", user_id)
            return

        body: dict[str, Any] = {"text": text}
        if attachments:
            body["attachments"] = attachments
        headers = {"Authorization": self.settings.max_bot_token}
        verify: Any = self._ssl_context
        async with httpx.AsyncClient(base_url=self.settings.max_api_base_url, verify=verify, timeout=10) as client:
            response = await client.post(
                "/messages",
                params={"user_id": user_id},
                headers=headers,
                json=body,
            )
            response.raise_for_status()

    async def register_webhook(self) -> dict[str, Any]:
        if not self.configured:
            raise RuntimeError("MAX_BOT_TOKEN is required")
        if not self.settings.max_webhook_secret:
            raise RuntimeError("MAX_WEBHOOK_SECRET is required")

        verify: Any = self._ssl_context
        async with httpx.AsyncClient(base_url=self.settings.max_api_base_url, verify=verify, timeout=15) as client:
            response = await client.post(
                "/subscriptions",
                headers={"Authorization": self.settings.max_bot_token},
                json={
                    "url": self.settings.webhook_url,
                    "update_types": ["bot_started", "message_created", "message_callback"],
                    "secret": self.settings.max_webhook_secret,
                },
            )
            response.raise_for_status()
            return response.json()


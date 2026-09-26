from __future__ import annotations

import logging
from typing import Any

import httpx

from .config import Settings

logger = logging.getLogger(__name__)


class MaxApiClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

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

        body: dict[str, Any] = {"text": text}
        if attachments:
            body["attachments"] = attachments
        headers = {"Authorization": self.settings.max_bot_token}
        verify: bool | str = self.settings.max_ca_bundle_path or True
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

        verify: bool | str = self.settings.max_ca_bundle_path or True
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

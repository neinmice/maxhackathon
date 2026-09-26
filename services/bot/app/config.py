from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_env: str
    database_url: str
    max_bot_token: str
    max_api_base_url: str
    max_webhook_secret: str
    max_bot_username: str
    public_base_url: str
    max_launch_max_age_seconds: int
    quiz_answer_key_json: str
    quiz_pass_score: int
    certificate_signing_secret: str
    max_ca_bundle_path: str | None

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            app_env=os.getenv("APP_ENV", "development"),
            database_url=os.getenv(
                "DATABASE_URL",
                "postgresql://navigator:navigator@localhost:5432/navigator",
            ),
            max_bot_token=os.getenv("MAX_BOT_TOKEN", ""),
            max_api_base_url=os.getenv("MAX_API_BASE_URL", "https://platform-api2.max.ru").rstrip("/"),
            max_webhook_secret=os.getenv("MAX_WEBHOOK_SECRET", ""),
            max_bot_username=os.getenv("MAX_BOT_USERNAME", ""),
            public_base_url=os.getenv("PUBLIC_BASE_URL", "").rstrip("/"),
            max_launch_max_age_seconds=int(os.getenv("MAX_LAUNCH_MAX_AGE_SECONDS", "3600")),
            quiz_answer_key_json=os.getenv("QUIZ_ANSWER_KEY_JSON", ""),
            quiz_pass_score=int(os.getenv("QUIZ_PASS_SCORE", "70")),
            certificate_signing_secret=os.getenv("CERTIFICATE_SIGNING_SECRET", ""),
            max_ca_bundle_path=os.getenv("MAX_CA_BUNDLE_PATH") or None,
        )

    @property
    def webhook_url(self) -> str:
        if not self.public_base_url:
            raise ValueError("PUBLIC_BASE_URL is required to register a MAX webhook")
        return f"{self.public_base_url}/webhooks/max"

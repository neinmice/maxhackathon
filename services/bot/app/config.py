from __future__ import annotations

from dataclasses import dataclass
import os


_PLACEHOLDER_SECRETS = frozenset(
    {
        "navigator",
        "replace-in-secret-store",
        "replace-with-bot-username",
        "replace-with-a-random-32-byte-secret",
        "replace-with-a-separate-random-32-byte-secret",
        "change_me_postgres_password",
        "change_me_max_bot_token",
        "change_me_max_bot_username",
        "change_me_max_webhook_secret",
        "change_me_certificate_signing_secret",
        "change_db_password",
        "получить-в-кабинете-max",
        "публичный_username_бота",
        "случайный-секрет-минимум-32-байта",
        "отдельный-случайный-секрет-минимум-32-байта",
        "changeme",
        "change-me",
        "secret",
        "password",
        "test-token",
        "webhook-secret",
        "certificate-secret",
    }
)

_PRODUCTION_SECRET_FIELDS = (
    "database_url",
    "max_bot_token",
    "max_webhook_secret",
    "max_bot_username",
    "certificate_signing_secret",
)


class ProductionConfigError(RuntimeError):
    """Raised when production is pointed at an empty or template secret."""


_EMBEDDED_TEMPLATE_MARKERS = (
    "change_me",
    "change-me",
    "changeme",
    "change_db_password",
    "replace-in-secret-store",
    "replace-with-",
    "navigator:navigator@",
)


def _is_placeholder(value: str) -> bool:
    normalized = value.strip().lower()
    if not normalized:
        return True
    if normalized in _PLACEHOLDER_SECRETS:
        return True
    if normalized.startswith("change_me") or normalized.startswith("replace-"):
        return True
    return any(marker in normalized for marker in _EMBEDDED_TEMPLATE_MARKERS)


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

    def __post_init__(self) -> None:
        if self.app_env != "production":
            return
        rejected = [
            name
            for name in _PRODUCTION_SECRET_FIELDS
            if _is_placeholder(getattr(self, name))
        ]
        if rejected:
            names = ", ".join(rejected)
            raise ProductionConfigError(
                "production rejects empty or template secrets: " + names
            )

    @classmethod
    def from_env(cls) -> "Settings":
        settings = cls(
            app_env=os.getenv("APP_ENV", "development"),
            database_url=os.getenv(
                "DATABASE_URL",
                "postgresql://navigator:navigator@localhost:5432/navigator",
            ),
            max_bot_token=os.getenv("MAX_BOT_TOKEN", ""),
            max_api_base_url=os.getenv(
                "MAX_API_BASE_URL",
                "https://platform-api2.max.ru",
            ).rstrip("/"),
            max_webhook_secret=os.getenv("MAX_WEBHOOK_SECRET", ""),
            max_bot_username=os.getenv("MAX_BOT_USERNAME", ""),
            public_base_url=os.getenv("PUBLIC_BASE_URL", "").rstrip("/"),
            max_launch_max_age_seconds=int(
                os.getenv("MAX_LAUNCH_MAX_AGE_SECONDS", "3600")
            ),
            quiz_answer_key_json=os.getenv("QUIZ_ANSWER_KEY_JSON", ""),
            quiz_pass_score=int(os.getenv("QUIZ_PASS_SCORE", "70")),
            certificate_signing_secret=os.getenv("CERTIFICATE_SIGNING_SECRET", ""),
            max_ca_bundle_path=os.getenv("MAX_CA_BUNDLE_PATH") or None,
        )
        if settings.app_env == "production" and _is_placeholder(
            os.getenv("POSTGRES_PASSWORD", "")
        ):
            raise ProductionConfigError(
                "production rejects empty or template secrets: POSTGRES_PASSWORD"
            )
        return settings

    @property
    def webhook_url(self) -> str:
        if not self.public_base_url:
            raise ValueError("PUBLIC_BASE_URL is required to register a MAX webhook")
        return f"{self.public_base_url}/webhooks/max"

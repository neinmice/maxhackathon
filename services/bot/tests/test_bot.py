from datetime import datetime, timezone
import hashlib
import hmac
import json

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.security import validate_launch_data
from app.store import InMemoryStore


TOKEN = "test-token"


class FakeMaxClient:
    configured = True

    def __init__(self) -> None:
        self.messages: list[dict] = []

    async def send_message(self, **message: object) -> None:
        self.messages.append(message)


def settings(**overrides: str) -> Settings:
    values = {
        "app_env": "test",
        "database_url": "unused",
        "max_bot_token": TOKEN,
        "max_api_base_url": "https://example.invalid",
        "max_webhook_secret": "webhook-secret",
        "max_bot_username": "zverybot",
        "public_base_url": "https://zverybot.example",
        "max_launch_max_age_seconds": 3600,
        "quiz_answer_key_json": json.dumps({"v1": {"q1": "a", "q2": "b"}}),
        "quiz_pass_score": 50,
        "certificate_signing_secret": "certificate-secret",
        "max_ca_bundle_path": None,
    }
    values.update(overrides)
    return Settings(**values)


def make_init_data(user_id: str = "772026") -> str:
    auth_date = int(datetime.now(timezone.utc).timestamp())
    user = json.dumps({"id": int(user_id), "first_name": "Test"}, separators=(",", ":"))
    values = {
        "auth_date": str(auth_date),
        "query_id": "query",
        "user": user,
    }
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(values.items()))
    secret = hmac.new(b"WebAppData", TOKEN.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    return "&".join(f"{key}={value}" for key, value in values.items()) + f"&hash={digest}"


def test_launch_data_is_verified() -> None:
    identity = validate_launch_data(
        make_init_data(),
        TOKEN,
        max_age_seconds=3600,
    )
    assert identity.user_id == "772026"


def test_webhook_checks_secret_and_deduplicates() -> None:
    store = InMemoryStore()
    max_client = FakeMaxClient()
    app = create_app(settings=settings(), store=store, max_client=max_client)
    client = TestClient(app)
    update = {
        "update_type": "bot_started",
        "bot_started": {"user": {"user_id": "772026"}},
    }

    unauthorized = client.post("/webhooks/max", json=update)
    assert unauthorized.status_code == 401

    headers = {"X-Max-Bot-Api-Secret": "webhook-secret"}
    first = client.post("/webhooks/max", json=update, headers=headers)
    second = client.post("/webhooks/max", json=update, headers=headers)
    assert first.status_code == 200
    assert first.json() == {"ok": True}
    assert second.json() == {"ok": True, "duplicate": True}
    assert len(max_client.messages) == 1


def test_save_and_quiz_require_verified_launch_data() -> None:
    store = InMemoryStore()
    app = create_app(settings=settings(), store=store)
    client = TestClient(app)
    headers = {"X-Max-Init-Data": make_init_data()}

    saved = client.post(
        "/api/v1/measures/demo-kazan-support-001/save",
        headers=headers,
    )
    assert saved.status_code == 200
    assert saved.json()["saved"] is True

    quiz = client.post(
        "/api/v1/quiz/submit",
        headers=headers,
        json={"quiz_version": "v1", "answers": {"q1": "a", "q2": "b"}},
    )
    assert quiz.status_code == 200
    assert quiz.json()["passed"] is True
    assert quiz.json()["certificate"]["payload"]

import asyncio
from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import json
import os
from urllib.parse import quote
import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import ProductionConfigError, Settings
from app.handlers import update_hash
from app.main import _certificate_payload, create_app
from app.reminders import reminder_due_at, run_once
from app.security import LaunchDataError, validate_launch_data
from app.store import UPDATE_PROCESSING_STALE, UPDATE_RETENTION, InMemoryStore, PostgresStore


TOKEN = "test-token"


class FakeMaxClient:
    configured = True

    def __init__(self) -> None:
        self.messages: list[dict] = []
        self.fail_times = 0

    async def send_message(self, **message: object) -> None:
        if self.fail_times:
            self.fail_times -= 1
            raise RuntimeError("delivery failed")
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
        "reminder_poll_seconds": 60,
        "reminder_lead_days": 1,
    }
    values.update(overrides)
    return Settings(**values)


def make_init_data(
    user_id: str = "772026",
    *,
    auth_date: int | None = None,
    user: str | None = None,
    extra: dict[str, str] | None = None,
    omit: set[str] | None = None,
) -> str:
    if auth_date is None:
        auth_date = int(datetime.now(timezone.utc).timestamp())
    if user is None:
        user = json.dumps(
            {"id": int(user_id), "first_name": "Test"},
            separators=(",", ":"),
        )
    values = {
        "auth_date": str(auth_date),
        "query_id": "query",
        "user": user,
    }
    if extra:
        values.update(extra)
    if omit:
        for key in omit:
            values.pop(key, None)
    data_check_string = "\n".join(
        f"{key}={value}" for key, value in sorted(values.items())
    )
    secret = hmac.new(b"WebAppData", TOKEN.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    encoded = "&".join(
        f"{quote(key, safe='')}={quote(value, safe='')}"
        for key, value in values.items()
    )
    return f"{encoded}&hash={digest}"


def test_launch_data_is_verified() -> None:
    identity = validate_launch_data(
        make_init_data(),
        TOKEN,
        max_age_seconds=3600,
    )
    assert identity.user_id == "772026"


def test_launch_data_rejects_bad_signature() -> None:
    signed = make_init_data()
    broken = signed.replace("hash=", "hash=0", 1)
    with pytest.raises(LaunchDataError, match="signature"):
        validate_launch_data(broken, TOKEN, max_age_seconds=3600)


def test_launch_data_requires_exactly_one_hash() -> None:
    signed = make_init_data()
    with pytest.raises(LaunchDataError, match="hash"):
        validate_launch_data(signed.split("&hash=")[0], TOKEN, max_age_seconds=3600)
    with pytest.raises(LaunchDataError, match="duplicate"):
        validate_launch_data(signed + "&hash=abc", TOKEN, max_age_seconds=3600)


def test_launch_data_rejects_duplicate_parameters() -> None:
    signed = make_init_data()
    with pytest.raises(LaunchDataError, match="duplicate"):
        validate_launch_data(signed + "&query_id=other", TOKEN, max_age_seconds=3600)


def test_launch_data_malformed_query_is_launch_error() -> None:
    with pytest.raises(LaunchDataError, match="malformed"):
        validate_launch_data("noequals", TOKEN, max_age_seconds=3600)
    with pytest.raises(LaunchDataError, match="malformed"):
        validate_launch_data("a=1&b", TOKEN, max_age_seconds=3600)


def test_launch_data_rejects_broken_user_and_auth_date() -> None:
    broken_user = make_init_data(user="{")
    with pytest.raises(LaunchDataError, match="user or auth_date"):
        validate_launch_data(broken_user, TOKEN, max_age_seconds=3600)
    missing_auth = make_init_data(omit={"auth_date"})
    with pytest.raises(LaunchDataError, match="user or auth_date"):
        validate_launch_data(missing_auth, TOKEN, max_age_seconds=3600)
    bad_auth = make_init_data(extra={"auth_date": "soon"})
    with pytest.raises(LaunchDataError, match="user or auth_date"):
        validate_launch_data(bad_auth, TOKEN, max_age_seconds=3600)


def test_launch_data_rejects_expired_and_future_auth_date() -> None:
    now = datetime.now(timezone.utc)
    expired = int((now - timedelta(hours=2)).timestamp())
    with pytest.raises(LaunchDataError, match="expired"):
        validate_launch_data(
            make_init_data(auth_date=expired),
            TOKEN,
            max_age_seconds=3600,
            now=now,
        )
    future = int((now + timedelta(minutes=5)).timestamp())
    with pytest.raises(LaunchDataError, match="future"):
        validate_launch_data(
            make_init_data(auth_date=future),
            TOKEN,
            max_age_seconds=3600,
            now=now,
        )


def test_malformed_launch_data_returns_401_without_raw_payload() -> None:
    app = create_app(settings=settings(), store=InMemoryStore())
    client = TestClient(app, raise_server_exceptions=False)
    raw = "not-a-query"
    response = client.post("/api/v1/auth/max/launch-data", json={"init_data": raw})
    assert response.status_code == 401
    body = response.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "request_id"}
    assert body["error"]["code"] == "invalid_launch_data"
    assert raw not in response.text
    assert "detail" not in body


def test_production_settings_reject_template_secrets(monkeypatch) -> None:
    with pytest.raises(ProductionConfigError):
        settings(
            app_env="production",
            max_bot_token="CHANGE_ME_MAX_BOT_TOKEN",
        )
    with pytest.raises(ProductionConfigError):
        settings(app_env="production", max_webhook_secret="")
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://navigator:CHANGE_ME_POSTGRES_PASSWORD@db:5432/navigator",
    )
    monkeypatch.setenv("MAX_BOT_TOKEN", "real-bot-token-value")
    monkeypatch.setenv("MAX_WEBHOOK_SECRET", "real-webhook-secret-value")
    monkeypatch.setenv("MAX_BOT_USERNAME", "zverybot")
    monkeypatch.setenv("CERTIFICATE_SIGNING_SECRET", "real-certificate-secret")
    monkeypatch.setenv("POSTGRES_PASSWORD", "CHANGE_ME_POSTGRES_PASSWORD")
    with pytest.raises(ProductionConfigError, match="database_url"):
        Settings.from_env()
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://navigator:real-db-password-value@db:5432/navigator",
    )
    with pytest.raises(ProductionConfigError, match="POSTGRES_PASSWORD"):
        Settings.from_env()
    monkeypatch.setenv("POSTGRES_PASSWORD", "real-db-password-value")
    loaded = Settings.from_env()
    assert loaded.app_env == "production"
    assert loaded.max_bot_token == "real-bot-token-value"


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
    assert set(unauthorized.json()) == {"error"}
    assert unauthorized.json()["error"]["code"] == "invalid_webhook_secret"
    assert "detail" not in unauthorized.json()

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
        "/api/v1/measures/demo-kazan-agro-001/save",
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

    missing = client.post("/api/v1/measures/demo-kazan-agro-001/save")
    assert missing.status_code == 401
    assert missing.json()["error"]["code"] == "launch_data_required"
    assert "detail" not in missing.json()

    invalid = client.post(
        "/api/v1/quiz/submit",
        json={"quiz_version": "v1"},
        headers=headers,
    )
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "validation_error"
    assert "detail" not in invalid.json()


def test_startapp_measure_payload_opens_known_measure_only() -> None:
    from app.handlers import main_menu, start_app_payload

    assert start_app_payload("measure_demo-kazan-agro-001") == (
        "measure_demo-kazan-agro-001"
    )
    assert start_app_payload("measure") is None
    assert start_app_payload("measure_") is None
    assert start_app_payload("measure_missing-id") is None
    assert start_app_payload("measure demo") is None
    assert start_app_payload("a" * 513) is None
    menu = main_menu(settings(), "measure_demo-kazan-agro-001")
    button = menu[0]["payload"]["buttons"][0][0]
    assert button["payload"] == "measure_demo-kazan-agro-001"
    assert button["text"] == "Открыть меру"
    home = main_menu(settings(), None)
    assert home[0]["payload"]["buttons"][0][0]["payload"] == "home"


def test_main_menu_normalizes_public_bot_username() -> None:
    from app.handlers import main_menu

    menu = main_menu(settings(max_bot_username="@t826_hakaton_max_bot"))
    buttons = menu[0]["payload"]["buttons"]
    assert buttons[0][0]["type"] == "open_app"
    assert buttons[0][0]["web_app"] == "t826_hakaton_max_bot"
    assert buttons[1][0]["payload"] == "quiz"
    assert buttons[1][1]["payload"] == "catalog"
    assert buttons[2][0]["payload"] == "saved"


def test_bot_started_unknown_measure_does_not_open_first_record() -> None:
    max_client = FakeMaxClient()
    app = create_app(
        settings=settings(),
        store=InMemoryStore(),
        max_client=max_client,
    )
    client = TestClient(app)
    update = {
        "update_type": "bot_started",
        "bot_started": {
            "user": {"user_id": "772026"},
            "payload": "measure_missing-id",
        },
    }
    response = client.post(
        "/webhooks/max",
        json=update,
        headers={"X-Max-Bot-Api-Secret": "webhook-secret"},
    )
    assert response.status_code == 200
    assert len(max_client.messages) == 1
    text = max_client.messages[0]["text"]
    assert "demo-kazan-agro-001" not in text
    attachments = max_client.messages[0]["attachments"]
    button = attachments[0]["payload"]["buttons"][0][0]
    assert button["payload"] == "home"


def test_save_unknown_measure_returns_404_envelope() -> None:
    app = create_app(settings=settings(), store=InMemoryStore())
    client = TestClient(app)
    response = client.post(
        "/api/v1/measures/missing-measure/save",
        headers={"X-Max-Init-Data": make_init_data()},
    )
    assert response.status_code == 404
    body = response.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "request_id"}
    assert body["error"]["code"] == "measure_not_found"
    assert body["error"]["request_id"]
    assert "detail" not in body
    assert "demo-kazan-agro-001" not in response.text


def test_checklist_requires_launch_data_and_persists_item() -> None:
    app = create_app(settings=settings(), store=InMemoryStore())
    client = TestClient(app)
    headers = {"X-Max-Init-Data": make_init_data()}

    unauthorized = client.get("/api/v1/measures/demo-kazan-agro-001/checklist")
    assert unauthorized.status_code == 401

    initial = client.get(
        "/api/v1/measures/demo-kazan-agro-001/checklist",
        headers=headers,
    )
    assert initial.status_code == 200
    assert initial.json()["items"][0]["completed"] is False

    updated = client.post(
        "/api/v1/measures/demo-kazan-agro-001/checklist",
        headers=headers,
        json={"item_key": "0", "completed": True},
    )
    assert updated.status_code == 200
    assert updated.json()["completed"] is True

    loaded = client.get(
        "/api/v1/measures/demo-kazan-agro-001/checklist",
        headers=headers,
    )
    assert loaded.json()["items"][0]["completed"] is True


def test_reminder_is_one_time_and_requires_opt_in(monkeypatch) -> None:
    from app import reminders

    measure = {
        "id": "demo-kazan-agro-001",
        "title": "Демо-мера",
        "deadline": "2026-10-01",
        "documents": ["one", "two"],
    }
    monkeypatch.setattr(reminders, "get_measure", lambda measure_id: measure)
    store = InMemoryStore()
    store.save_measure("772026", measure["id"])
    store.set_notifications("772026", True)
    max_client = FakeMaxClient()
    current = reminder_due_at(datetime(2026, 10, 1).date()).astimezone(timezone.utc)

    assert asyncio.run(
        run_once(
            settings=settings(),
            store=store,
            max_client=max_client,
            now=current,
        )
    ) == 1
    assert len(max_client.messages) == 1
    assert asyncio.run(
        run_once(
            settings=settings(),
            store=store,
            max_client=max_client,
            now=current + timedelta(minutes=5),
        )
    ) == 0


def test_reminder_retries_after_delivery_failure(monkeypatch) -> None:
    from app import reminders

    measure = {
        "id": "demo-kazan-agro-001",
        "title": "Демо-мера",
        "deadline": "2026-10-01",
        "documents": ["one"],
    }
    monkeypatch.setattr(reminders, "get_measure", lambda measure_id: measure)
    store = InMemoryStore()
    store.set_notifications("772026", True)
    store.set_checklist_item("772026", measure["id"], "0", False)
    max_client = FakeMaxClient()
    max_client.fail_times = 1
    current = reminder_due_at(datetime(2026, 10, 1).date()).astimezone(timezone.utc)

    assert asyncio.run(
        run_once(
            settings=settings(),
            store=store,
            max_client=max_client,
            now=current,
        )
    ) == 0
    assert asyncio.run(
        run_once(
            settings=settings(),
            store=store,
            max_client=max_client,
            now=current + timedelta(minutes=1),
        )
    ) == 1


def _decode_certificate(token: str) -> tuple[dict, str, str]:
    encoded, signature = token.split(".", 1)
    padded = encoded + "=" * (-len(encoded) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
    return payload, encoded, signature


def test_quiz_server_is_only_score_source_and_hmac_breaks() -> None:
    store = InMemoryStore()
    app = create_app(settings=settings(quiz_pass_score=70), store=store)
    client = TestClient(app)
    headers = {"X-Max-Init-Data": make_init_data()}

    passed = client.post(
        "/api/v1/quiz/submit",
        headers=headers,
        json={"quiz_version": "v1", "answers": {"q1": "a", "q2": "b"}},
    )
    assert passed.status_code == 200
    body = passed.json()
    assert body["score"] == 100
    assert body["passed"] is True
    assert body["pass_score"] == 70
    certificate = body["certificate"]
    assert certificate["title"] == "Памятный сертификат за прохождение квиза*"
    assert "государственного образца" in certificate["disclaimer"]
    payload, encoded, signature = _decode_certificate(certificate["payload"])
    assert payload["score"] == 100
    assert payload["certificate_id"] == certificate["certificate_id"]
    assert "first_name" not in payload
    assert "user" not in payload
    expected = hmac.new(
        b"certificate-secret",
        encoded.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    assert signature == expected
    tampered = encoded[:-1] + ("A" if encoded[-1] != "A" else "B")
    broken = hmac.new(
        b"certificate-secret",
        tampered.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    assert broken != signature
    assert store.attempts[0]["user_id"] == "772026"
    assert store.attempts[0]["certificate_id"] == certificate["certificate_id"]

    failed = client.post(
        "/api/v1/quiz/submit",
        headers=headers,
        json={"quiz_version": "v1", "answers": {"q1": "b", "q2": "b"}},
    )
    assert failed.status_code == 200
    assert failed.json()["score"] == 50
    assert failed.json()["passed"] is False
    assert failed.json()["certificate"] is None

    for answers in (
        {"q1": "a"},
        {"q1": "a", "q2": "b", "q3": "c"},
        {"q1": "a", "q9": "b"},
        {"q1": "", "q2": "b"},
    ):
        rejected = client.post(
            "/api/v1/quiz/submit",
            headers=headers,
            json={"quiz_version": "v1", "answers": answers},
        )
        assert rejected.status_code == 422
        assert rejected.json()["error"]["code"] == "quiz_answers_invalid"
        assert "certificate" not in rejected.json()

    unknown = client.post(
        "/api/v1/quiz/submit",
        headers=headers,
        json={"quiz_version": "missing", "answers": {"q1": "a", "q2": "b"}},
    )
    assert unknown.status_code == 422
    assert unknown.json()["error"]["code"] == "quiz_version_not_found"


def test_quiz_store_error_does_not_issue_certificate() -> None:
    class BrokenStore(InMemoryStore):
        def record_quiz_attempt(self, **kwargs: object) -> dict:
            raise RuntimeError("disk full")

    app = create_app(settings=settings(), store=BrokenStore())
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/api/v1/quiz/submit",
        headers={"X-Max-Init-Data": make_init_data()},
        json={"quiz_version": "v1", "answers": {"q1": "a", "q2": "b"}},
    )
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "quiz_store_failed"
    assert "certificate" not in response.json()


def test_notification_consent_is_global_and_defaults_off() -> None:
    store = InMemoryStore()
    app = create_app(settings=settings(), store=store)
    client = TestClient(app)
    headers = {"X-Max-Init-Data": make_init_data()}

    initial = client.get("/api/v1/notifications/opt-in", headers=headers)
    assert initial.status_code == 200
    assert initial.json() == {"enabled": False}

    enabled = client.post(
        "/api/v1/notifications/opt-in",
        headers=headers,
        json={"enabled": True},
    )
    assert enabled.json() == {"enabled": True}
    again = client.get("/api/v1/notifications/opt-in", headers=headers)
    assert again.json() == {"enabled": True}

    disabled = client.post(
        "/api/v1/notifications/opt-in",
        headers=headers,
        json={"enabled": False},
    )
    assert disabled.json() == {"enabled": False}
    assert store.get_notifications("772026") is False


def test_webhook_failure_releases_claim_and_retry_runs_once() -> None:
    store = InMemoryStore()
    max_client = FakeMaxClient()
    max_client.fail_times = 1
    app = create_app(settings=settings(), store=store, max_client=max_client)
    client = TestClient(app, raise_server_exceptions=False)
    update = {
        "update_type": "bot_started",
        "bot_started": {"user": {"user_id": "772026"}},
    }
    headers = {"X-Max-Bot-Api-Secret": "webhook-secret"}

    failed = client.post("/webhooks/max", json=update, headers=headers)
    assert failed.status_code == 500
    assert failed.json()["error"]["code"] == "webhook_processing_failed"
    assert max_client.messages == []
    assert update_hash(update) not in store.updates

    retried = client.post("/webhooks/max", json=update, headers=headers)
    assert retried.status_code == 200
    assert retried.json() == {"ok": True}
    duplicate = client.post("/webhooks/max", json=update, headers=headers)
    assert duplicate.json() == {"ok": True, "duplicate": True}
    assert len(max_client.messages) == 1


def test_concurrent_claim_runs_only_once() -> None:
    store = InMemoryStore()
    payload_hash = "same-update"
    assert store.claim_update(payload_hash) is True
    assert store.claim_update(payload_hash) is False
    store.complete_update(payload_hash)
    assert store.claim_update(payload_hash) is False


def test_stale_processing_claim_can_be_recovered() -> None:
    now = datetime(2026, 9, 27, tzinfo=timezone.utc)
    store = InMemoryStore(
        processing_stale=UPDATE_PROCESSING_STALE,
        retention=UPDATE_RETENTION,
        clock=lambda: now,
    )
    payload_hash = "stuck"
    assert store.claim_update(payload_hash) is True
    store.updates[payload_hash]["updated_at"] = now - UPDATE_PROCESSING_STALE - timedelta(seconds=1)
    assert store.claim_update(payload_hash) is True
    store.complete_update(payload_hash)
    store.updates[payload_hash]["updated_at"] = now - UPDATE_RETENTION - timedelta(seconds=1)
    assert store.claim_update(payload_hash) is True


def test_health_is_not_ready_without_database() -> None:
    store = InMemoryStore()
    store.available = False
    app = create_app(settings=settings(), store=store)
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"
    assert response.json()["database_ready"] is False


def test_certificate_payload_hmac_changes_with_payload() -> None:
    first = _certificate_payload(
        certificate_id="cert-1",
        quiz_version="v1",
        score=100,
        issued_at="2026-09-27T00:00:00+00:00",
        signing_secret="certificate-secret",
    )
    second = _certificate_payload(
        certificate_id="cert-1",
        quiz_version="v1",
        score=40,
        issued_at="2026-09-27T00:00:00+00:00",
        signing_secret="certificate-secret",
    )
    assert first.split(".", 1)[1] != second.split(".", 1)[1]


def test_postgres_store_roundtrip_when_local_database_exists() -> None:
    admin_url = os.getenv(
        "MAXHACKATHON_TEST_ADMIN_URL",
        "postgresql://postgres@127.0.0.1:5432/postgres",
    )
    database_name = f"maxhackathon_e_{uuid.uuid4().hex[:12]}"
    try:
        import psycopg
    except ImportError:
        pytest.skip("psycopg is not installed")
    try:
        admin = psycopg.connect(admin_url, autocommit=True)
    except Exception as exc:
        pytest.skip(f"local postgres is not usable without a password: {exc}")
    admin.execute(f'CREATE DATABASE "{database_name}"')
    store_url = admin_url.rsplit("/", 1)[0] + "/" + database_name
    store = PostgresStore(
        store_url,
        processing_stale=timedelta(seconds=1),
        retention=timedelta(seconds=2),
    )
    try:
        store.ensure_schema()
        assert store.ping() is True
        assert store.get_notifications("user-1") is False
        assert store.set_notifications("user-1", True) is True
        assert store.get_notifications("user-1") is True
        assert store.set_notifications("user-1", False) is False
        recorded = store.record_quiz_attempt(
            user_id="user-1",
            quiz_version="v1",
            score=100,
            passed=True,
        )
        assert recorded["certificate_id"]
        with store._connect() as connection:
            row = connection.execute(
                """
                SELECT certificates.user_id, quiz_attempts.passed
                FROM certificates
                JOIN quiz_attempts ON quiz_attempts.attempt_id = certificates.attempt_id
                WHERE certificates.certificate_id = %s
                """,
                (recorded["certificate_id"],),
            ).fetchone()
        assert row["user_id"] == "user-1"
        assert row["passed"] is True
        payload_hash = "pg-update"
        assert store.claim_update(payload_hash) is True
        assert store.claim_update(payload_hash) is False
        store.release_update(payload_hash)
        assert store.claim_update(payload_hash) is True
        store.complete_update(payload_hash)
        assert store.claim_update(payload_hash) is False
        with store._connect() as connection:
            connection.execute(
                """
                UPDATE processed_updates
                SET updated_at = NOW() - INTERVAL '1 day'
                WHERE payload_hash = %s
                """,
                (payload_hash,),
            )
        assert store.claim_update(payload_hash) is True
        restarted = PostgresStore(store_url)
        assert restarted.get_notifications("user-1") is False
        assert restarted.ping() is True
    finally:
        admin.execute(f'DROP DATABASE "{database_name}" WITH (FORCE)')
        admin.close()


def test_webhook_handles_certificate_send_data() -> None:
    max_client = FakeMaxClient()
    app = create_app(settings=settings(), store=InMemoryStore(), max_client=max_client)
    client = TestClient(app)
    cert_payload = {
        "action": "certificate",
        "certificate_id": "cert-2026-abcdef-12345678",
        "score": 100,
        "title": "Памятный сертификат за прохождение квиза*",
        "user_name": "Станислав",
    }
    update = {
        "update_type": "message_created",
        "message_created": {
            "message": {
                "sender": {"user_id": "772026"},
                "web_app_data": {"data": json.dumps(cert_payload)},
            }
        },
    }
    response = client.post(
        "/webhooks/max",
        json=update,
        headers={"X-Max-Bot-Api-Secret": "webhook-secret"},
    )
    assert response.status_code == 200
    assert len(max_client.messages) == 1
    msg = max_client.messages[0]
    assert msg["user_id"] == "772026"
    assert "Поздравляем с успешным прохождением квиза" in msg["text"]
    assert "Станислав" in msg["text"]
    assert "100%" in msg["text"]
    assert "cert-2026-abcdef" in msg["text"]
    buttons = msg["attachments"][0]["payload"]["buttons"]
    assert buttons[0][0]["payload"] == "quiz"


def test_webhook_handles_checklist_send_data() -> None:
    max_client = FakeMaxClient()
    app = create_app(settings=settings(), store=InMemoryStore(), max_client=max_client)
    client = TestClient(app)
    checklist_payload = {
        "action": "checklist",
        "measure_id": "demo-kazan-agro-001",
        "title": "Агростартап в Республике Татарстан",
        "operator": "Минсельхозпрод РТ",
        "amount": "до 5 млн ₽",
        "deadline": "до 1 ноября",
        "items": [
            {"key": "0", "title": "Паспорт гражданина РФ", "completed": True},
            {"key": "1", "title": "Бизнес-план КФХ", "completed": False},
        ],
    }
    update = {
        "update_type": "message_created",
        "message_created": {
            "message": {
                "sender": {"user_id": "772026"},
                "web_app_data": {"data": json.dumps(checklist_payload)},
            }
        },
    }
    response = client.post(
        "/webhooks/max",
        json=update,
        headers={"X-Max-Bot-Api-Secret": "webhook-secret"},
    )
    assert response.status_code == 200
    assert len(max_client.messages) == 1
    msg = max_client.messages[0]
    assert msg["user_id"] == "772026"
    assert "Чеклист документов" in msg["text"]
    assert "Агростартап" in msg["text"]
    assert "✅ 1. Паспорт гражданина РФ" in msg["text"]
    assert "⬜ 2. Бизнес-план КФХ" in msg["text"]
    assert "1 из 2" in msg["text"]
    buttons = msg["attachments"][0]["payload"]["buttons"]
    assert buttons[0][0]["payload"] == "measure_demo-kazan-agro-001"


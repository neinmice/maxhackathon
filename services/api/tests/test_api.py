from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_recommendations_are_deterministic_and_mark_model_data() -> None:
    payload = {"region": "kazan", "role": "ip", "tax_mode": "usn6", "sector": "agro", "goal": "support"}
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 200
    assert response.json()["items"][0]["data_status"] == "MODEL DATA"


def _assert_error_envelope(body: dict, code: str) -> None:
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "request_id"}
    assert body["error"]["code"] == code
    assert body["error"]["request_id"]
    assert "detail" not in body


def test_missing_measure_uses_error_envelope() -> None:
    response = client.get("/api/v1/measures/missing")
    assert response.status_code == 404
    _assert_error_envelope(response.json(), "measure_not_found")


def test_validation_error_uses_error_envelope() -> None:
    response = client.post("/api/v1/recommendations", json={})
    assert response.status_code == 422
    _assert_error_envelope(response.json(), "validation_error")


def test_client_request_id_header_is_not_trusted(monkeypatch) -> None:
    def explode() -> list[dict]:
        raise RuntimeError("secret-db-dsn")

    monkeypatch.setattr("app.main.load_catalog", explode)
    response = client.get(
        "/api/v1/catalog/filters",
        headers={"X-Request-ID": "client-supplied"},
    )
    assert response.status_code == 500
    body = response.json()
    _assert_error_envelope(body, "internal_error")
    assert body["error"]["request_id"] != "client-supplied"
    assert "secret-db-dsn" not in response.text
    assert "detail" not in body

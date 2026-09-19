from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_recommendations_are_deterministic_and_mark_model_data() -> None:
    payload = {"region": "kazan", "role": "ip", "tax_mode": "usn6", "sector": "food", "goal": "support"}
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 200
    assert response.json()["items"][0]["data_status"] == "MODEL DATA"

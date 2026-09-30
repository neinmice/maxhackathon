from __future__ import annotations

import json
from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from app.main import ApiError, CATALOG_PATH, app, validate_catalog

client = TestClient(app, raise_server_exceptions=False)


def _assert_error_envelope(body: dict, code: str) -> None:
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "request_id"}
    assert body["error"]["code"] == code
    assert body["error"]["message"]
    assert body["error"]["request_id"]
    assert "detail" not in body


def _catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def _base_record() -> dict:
    return deepcopy(_catalog()[0])


def test_catalog_file_matches_model_snapshot() -> None:
    payload = _catalog()
    validate_catalog(payload)
    expected_sectors = ["agro", "it", "services"]
    assert sorted({item["sector"] for item in payload}) == expected_sectors
    assert len({item["id"] for item in payload}) == len(payload) == 9
    expected_regions = {
        "demo-kazan-agro-001": "kazan",
        "demo-kazan-services-001": "kazan",
        "demo-kazan-it-001": "kazan",
        "demo-moscow-agro-001": "moscow",
        "demo-moscow-services-001": "moscow",
        "demo-moscow-it-001": "moscow",
        "demo-spb-agro-001": "spb",
        "demo-spb-services-001": "spb",
        "demo-spb-it-001": "spb",
    }
    assert [item["id"] for item in payload] == list(expected_regions)
    for record in payload:
        assert record["region"] == expected_regions[record["id"]]
        assert record["data_status"] == "MODEL DATA"
        assert record["freshness_status"] == "model"
        assert record["source_name"] == "MODEL DATA"
        assert record["source_url"].startswith("https://example.invalid/")
        assert record["deadline"] is None
        text = json.dumps(record, ensure_ascii=False).lower()
        assert "примерочные данные" in record["eligibility"].lower()
        assert "не официальная мера" in record["eligibility"].lower()
        assert "проверено" not in text
        assert "amount" not in record
        assert "amount_description" not in record
        assert "sum" not in record
        assert record["data_status"] != "CONFIRMED"
    assert {item["region"] for item in payload} == {"kazan", "moscow", "spb"}


@pytest.mark.parametrize(
    ("mutate",),
    [
        (lambda item: item.update(id="saved"),),
        (lambda item: item.update(id="Demo"),),
        (lambda item: item.update(region="tatarstan"),),
        (lambda item: item.update(roles=["ip", "ip"]),),
        (lambda item: item.update(roles=["ip"], tax_modes=["npd"]),),
        (lambda item: item.update(tax_modes=["usn6", "patent"]),),
        (lambda item: item.update(goal="Start"),),
        (lambda item: item.update(documents=[]),),
        (lambda item: item.update(deadline="soon"),),
        (lambda item: item.update(last_checked="19.09.2026"),),
        (lambda item: item.update(source_url="example.invalid/model-data"),),
        (lambda item: item.update(data_status="VERIFIED"),),
        (lambda item: item.update(data_status="CONFIRMED"),),
        (lambda item: item.update(freshness_status="fresh"),),
    ],
)
def test_catalog_schema_rejects_invalid_record(mutate) -> None:
    record = _base_record()
    mutate(record)
    with pytest.raises(ApiError) as caught:
        validate_catalog([record])
    assert caught.value.status_code == 500
    assert caught.value.code == "catalog_invalid"
    assert caught.value.message == "Каталог недоступен"
    assert record["id"] not in caught.value.message


def test_catalog_schema_rejects_duplicate_ids() -> None:
    record = _base_record()
    with pytest.raises(ApiError) as caught:
        validate_catalog([record, deepcopy(record)])
    assert caught.value.code == "catalog_invalid"


def test_measures_collection_equals_catalog_file() -> None:
    response = client.get("/api/v1/measures")
    assert response.status_code == 200
    assert response.json() == _catalog()
    assert isinstance(response.json(), list)


def test_filters_expose_gaps_and_closed_tax_enum() -> None:
    response = client.get("/api/v1/catalog/filters")
    assert response.status_code == 200
    body = response.json()
    assert body["regions"] == ["kazan", "moscow", "spb"]
    assert body["goals"] == ["support"]
    assert body["sectors"] == ["agro", "it", "services"]
    assert body["tax_modes"] == ["none", "usn6"]
    assert body["accepted_tax_modes"] == ["ausn", "none", "npd", "osno", "usn15", "usn6"]
    assert body["content_gaps"] == []
    assert body["catalog_version"] == "demo-2026-09-19"


def test_unknown_measure_is_not_replaced_by_first_record() -> None:
    missing = client.get("/api/v1/measures/missing-measure")
    assert missing.status_code == 404
    _assert_error_envelope(missing.json(), "measure_not_found")
    assert "demo-kazan-agro-001" not in missing.text
    assert missing.json() != _catalog()[0]


def test_api_saved_path_is_unknown_measure_id() -> None:
    response = client.get("/api/v1/measures/saved")
    assert response.status_code == 404
    _assert_error_envelope(response.json(), "measure_not_found")
    assert "demo-kazan-agro-001" not in response.text
    assert "measure_ids" not in response.json()


def test_npd_does_not_return_none_record() -> None:
    response = client.post(
        "/api/v1/recommendations",
        json={"region": "kazan", "role": "self_employed", "tax_mode": "npd"},
    )
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["catalog_version"] == "demo-2026-09-19"
    assert "demo-kazan-agro-001" not in response.text


def test_ausn_does_not_return_usn6_record() -> None:
    response = client.post(
        "/api/v1/recommendations",
        json={"region": "kazan", "role": "ip", "tax_mode": "ausn"},
    )
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert "demo-kazan-agro-001" not in response.text


def test_unknown_goal_is_validation_error_not_empty_items() -> None:
    response = client.post(
        "/api/v1/recommendations",
        json={"region": "kazan", "role": "ip", "tax_mode": "usn6", "goal": "start"},
    )
    assert response.status_code == 422
    _assert_error_envelope(response.json(), "validation_error")
    assert "items" not in response.json()


def test_unknown_sector_is_validation_error() -> None:
    response = client.post(
        "/api/v1/recommendations",
        json={"region": "kazan", "role": "ip", "tax_mode": "usn6", "sector": "retail"},
    )
    assert response.status_code == 422
    _assert_error_envelope(response.json(), "validation_error")


def test_known_goal_keeps_record_and_omitted_goal_does_not_filter_it_out() -> None:
    matched = client.post(
        "/api/v1/recommendations",
        json={
            "region": "kazan",
            "role": "ip",
            "tax_mode": "usn6",
            "goal": "support",
        },
    )
    assert matched.status_code == 200
    assert len(matched.json()["items"]) == 3
    assert {item["id"] for item in matched.json()["items"]} == {
        "demo-kazan-agro-001",
        "demo-kazan-services-001",
        "demo-kazan-it-001",
    }

    omitted = client.post(
        "/api/v1/recommendations",
        json={"region": "kazan", "role": "ip", "tax_mode": "usn6"},
    )
    assert omitted.status_code == 200
    assert omitted.json()["items"][0]["id"] == "demo-kazan-agro-001"


def test_sector_equality_filter_uses_catalog_order() -> None:
    matched = client.post(
        "/api/v1/recommendations",
        json={
            "region": "spb",
            "role": "ip",
            "tax_mode": "usn6",
            "sector": "it",
        },
    )
    assert matched.status_code == 200
    assert matched.json()["items"][0]["id"] == "demo-spb-it-001"
    assert len(matched.json()["items"]) == 1


def test_invalid_catalog_returns_catalog_invalid_without_exception_text(tmp_path, monkeypatch) -> None:
    broken = tmp_path / "measures.json"
    broken.write_text("{", encoding="utf-8")
    monkeypatch.setattr("app.main.CATALOG_PATH", broken)
    response = client.get("/api/v1/measures")
    assert response.status_code == 500
    _assert_error_envelope(response.json(), "catalog_invalid")
    assert response.json()["error"]["message"] == "Каталог недоступен"
    assert "Expecting" not in response.text
    assert "JSONDecodeError" not in response.text
    assert "Traceback" not in response.text

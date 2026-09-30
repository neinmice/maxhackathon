from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]

API_ROUTES = {
    ("GET", "/health"),
    ("GET", "/api/v1/catalog/filters"),
    ("GET", "/api/v1/measures"),
    ("GET", "/api/v1/measures/{measure_id}"),
    ("POST", "/api/v1/recommendations"),
}
BOT_ROUTES = {
    ("GET", "/health"),
    ("POST", "/webhooks/max"),
    ("POST", "/api/v1/auth/max/launch-data"),
    ("POST", "/api/v1/measures/{measure_id}/save"),
    ("DELETE", "/api/v1/measures/{measure_id}/save"),
    ("GET", "/api/v1/measures/saved"),
    ("GET", "/api/v1/measures/{measure_id}/checklist"),
    ("POST", "/api/v1/measures/{measure_id}/checklist"),
    ("POST", "/api/v1/quiz/submit"),
    ("GET", "/api/v1/notifications/opt-in"),
    ("POST", "/api/v1/notifications/opt-in"),
}
CONTRACT_ROUTES = API_ROUTES | BOT_ROUTES

DECORATOR = re.compile(
    r"@(?:app)\.(get|post|delete|put|patch)\(\s*[\"']([^\"']+)[\"']",
    re.IGNORECASE,
)


def _decorator_routes(relative: str) -> set[tuple[str, str]]:
    text = (REPO / relative).read_text(encoding="utf-8")
    return {(match.group(1).upper(), match.group(2)) for match in DECORATOR.finditer(text)}


def _openapi_routes(text: str) -> set[tuple[str, str]]:
    routes: set[tuple[str, str]] = set()
    current: str | None = None
    in_paths = False
    for raw in text.splitlines():
        if raw.startswith("paths:"):
            in_paths = True
            continue
        if in_paths and raw.startswith("components:"):
            break
        if not in_paths:
            continue
        if raw.startswith("  /") and raw.rstrip().endswith(":"):
            current = raw.strip()[:-1]
            continue
        method = raw.strip()
        if current and method in {"get:", "post:", "delete:", "put:", "patch:"} and raw.startswith("    "):
            routes.add((method[:-1].upper(), current))
    return routes


def _data_api_routes(text: str) -> set[tuple[str, str]]:
    methods = re.findall(r"(?m)^  - method:\s*([A-Z]+)\n    path:\s*(\S+)", text)
    return {(method, path) for method, path in methods}


def test_route_lists_match_across_contract_files() -> None:
    openapi = (REPO / "openapi.yaml").read_text(encoding="utf-8")
    data_api = (REPO / "DATA-API.yaml").read_text(encoding="utf-8")
    contract = (REPO / "docs" / "API_CONTRACT.md").read_text(encoding="utf-8")
    api_routes = _decorator_routes("services/api/app/main.py")
    bot_routes = _decorator_routes("services/bot/app/main.py")

    assert api_routes == API_ROUTES
    assert bot_routes == BOT_ROUTES
    assert _openapi_routes(openapi) == CONTRACT_ROUTES
    assert _data_api_routes(data_api) == CONTRACT_ROUTES
    for method, path in CONTRACT_ROUTES:
        assert path in contract
        assert method in contract or path == "/health"

    assert "api_base_url: http://127.0.0.1:8000" in data_api
    assert "bot_base_url: http://127.0.0.1:8001" in data_api
    assert "/bot/health" not in data_api
    assert "http://127.0.0.1:8000" in openapi
    assert "http://127.0.0.1:8001" in openapi
    for text in (openapi, data_api):
        assert "/api/v2" not in text
        assert "saved-measures" not in text
    contract_routes = "\n".join(
        line
        for line in contract.splitlines()
        if re.search(r"\b(GET|POST|DELETE|PUT|PATCH)\b", line)
    )
    assert "/api/v2" not in contract_routes
    assert "saved-measures" not in contract_routes


def test_client_tax_mode_is_closed_union() -> None:
    types_text = (REPO / "apps/miniapp/src/types/api.ts").read_text(encoding="utf-8")
    assert "export type TaxMode = 'npd' | 'usn6' | 'usn15' | 'ausn' | 'osno' | 'none';" in types_text
    assert "TaxMode | string" not in types_text
    assert "| string" not in types_text
    assert "VERIFIED" not in types_text
    assert "goals:" in types_text
    assert "accepted_tax_modes:" in types_text
    assert "content_gaps:" in types_text
    assert "catalog_version:" in types_text


def test_production_modules_do_not_read_second_catalog() -> None:
    for relative in (
        "apps/miniapp/src/App.tsx",
        "apps/miniapp/src/store.tsx",
    ):
        text = (REPO / relative).read_text(encoding="utf-8")
        assert "GRANTS" not in text
        assert "GRANT_FILTERS" not in text
        assert "FIXTURE_MEASURES" not in text
    sheet = (REPO / "apps/miniapp/src/components/MeasureDetailSheet.tsx").read_text(encoding="utf-8")
    assert "ПРОВЕРЕНО" not in sheet
    fixtures = (REPO / "apps/miniapp/src/api/fixtures.ts").read_text(encoding="utf-8")
    assert "FIXTURE_MEASURES: MeasureRecord[] = []" in fixtures
    assert "kazan-loan-start-002" not in fixtures
    assert "moscow-subsidies" not in fixtures

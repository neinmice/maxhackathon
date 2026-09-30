from pathlib import Path
import json
import logging
import re
from datetime import datetime
from typing import Any, Literal
from urllib.parse import urlparse
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

app = FastAPI(title="ZVERY Business Navigator API", version="0.1.0")
CATALOG_PATH = Path(__file__).resolve().parents[3] / "data" / "catalog" / "measures.json"
CATALOG_VERSION = "demo-2026-09-19"

REGIONS = ("kazan", "moscow", "spb")
ROLES = frozenset({"ip", "self_employed", "llc"})
TAX_MODES = ("npd", "usn6", "usn15", "ausn", "osno", "none")
TAX_MODE_SET = frozenset(TAX_MODES)
RESERVED_IDS = frozenset({"saved", "save", "filters", "recommendations"})
FRESHNESS_STATUSES = frozenset({"fresh", "reviewed", "model"})
DATA_STATUSES = frozenset({"MODEL DATA", "CONFIRMED"})
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TOKEN_RE = re.compile(r"^[a-z0-9_]+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
REQUIRED_MEASURE_FIELDS = (
    "id",
    "title",
    "operator",
    "region",
    "roles",
    "tax_modes",
    "sector",
    "goal",
    "eligibility",
    "documents",
    "deadline",
    "source_name",
    "source_url",
    "last_checked",
    "freshness_status",
    "data_status",
    "disclaimer",
)

TaxMode = Literal["npd", "usn6", "usn15", "ausn", "osno", "none"]


class RecommendationRequest(BaseModel):
    region: Literal["kazan", "moscow", "spb"]
    role: Literal["ip", "self_employed", "llc"]
    tax_mode: TaxMode
    sector: str | None = None
    goal: str | None = None


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def request_id_for(request: Request) -> str:
    current = getattr(request.state, "request_id", None)
    if isinstance(current, str) and current:
        return current
    generated = uuid.uuid4().hex
    request.state.request_id = generated
    return generated


def error_body(request: Request, code: str, message: str) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id_for(request),
        }
    }


@app.middleware("http")
async def assign_request_id(request: Request, call_next):
    request.state.request_id = uuid.uuid4().hex
    return await call_next(request)


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(request, exc.code, exc.message),
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    code = "http_error"
    message = "Запрос отклонён"
    detail = exc.detail
    if isinstance(detail, dict):
        raw_code = detail.get("code") or detail.get("error", {}).get("code")
        raw_message = detail.get("message") or detail.get("error", {}).get("message")
        if isinstance(raw_code, str) and raw_code:
            code = raw_code
        if isinstance(raw_message, str) and raw_message:
            message = raw_message
    elif isinstance(detail, str) and detail:
        message = detail
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(request, code, message),
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    del exc
    return JSONResponse(
        status_code=422,
        content=error_body(request, "validation_error", "Некорректный запрос"),
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled api error request_id=%s", request_id_for(request))
    return JSONResponse(
        status_code=500,
        content=error_body(request, "internal_error", "Внутренняя ошибка"),
    )


def _invalid_catalog() -> None:
    raise ApiError(500, "catalog_invalid", "Каталог недоступен")


def _require_text(value: object) -> None:
    if not isinstance(value, str) or not value.strip():
        _invalid_catalog()


def _require_date(value: object, *, allow_null: bool) -> None:
    if allow_null and value is None:
        return
    if not isinstance(value, str) or DATE_RE.fullmatch(value) is None:
        _invalid_catalog()
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        _invalid_catalog()


def _require_token(value: object) -> str:
    if not isinstance(value, str) or TOKEN_RE.fullmatch(value) is None:
        _invalid_catalog()
    return value


def _require_unique_enums(value: object, allowed: frozenset[str]) -> list[str]:
    if not isinstance(value, list) or not value:
        _invalid_catalog()
    if any(not isinstance(item, str) for item in value):
        _invalid_catalog()
    if len(value) != len(set(value)):
        _invalid_catalog()
    if any(item not in allowed for item in value):
        _invalid_catalog()
    return value


def _source_hostname(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        _invalid_catalog()
    parsed = urlparse(value)
    hostname = parsed.hostname
    if parsed.scheme not in {"http", "https"} or not hostname:
        _invalid_catalog()
    return hostname.lower()


def validate_catalog(payload: object) -> None:
    if not isinstance(payload, list):
        _invalid_catalog()
    seen_ids: set[str] = set()
    for item in payload:
        if not isinstance(item, dict):
            _invalid_catalog()
        if any(field not in item for field in REQUIRED_MEASURE_FIELDS):
            _invalid_catalog()
        measure_id = item["id"]
        if not isinstance(measure_id, str) or ID_RE.fullmatch(measure_id) is None:
            _invalid_catalog()
        if measure_id in RESERVED_IDS or measure_id in seen_ids:
            _invalid_catalog()
        seen_ids.add(measure_id)
        for field in ("title", "operator", "eligibility", "disclaimer", "source_name"):
            _require_text(item[field])
        if item["region"] not in REGIONS:
            _invalid_catalog()
        roles = _require_unique_enums(item["roles"], ROLES)
        tax_modes = _require_unique_enums(item["tax_modes"], TAX_MODE_SET)
        if "npd" in tax_modes and "self_employed" not in roles:
            _invalid_catalog()
        _require_token(item["sector"])
        _require_token(item["goal"])
        documents = item["documents"]
        if not isinstance(documents, list) or not documents:
            _invalid_catalog()
        if any(not isinstance(document, str) or not document.strip() for document in documents):
            _invalid_catalog()
        _require_date(item["deadline"], allow_null=True)
        _require_date(item["last_checked"], allow_null=False)
        hostname = _source_hostname(item["source_url"])
        freshness = item["freshness_status"]
        data_status = item["data_status"]
        source_name = item["source_name"]
        if freshness not in FRESHNESS_STATUSES or data_status not in DATA_STATUSES:
            _invalid_catalog()
        invalid_host = hostname == "example.invalid" or hostname.endswith(".invalid")
        if data_status == "MODEL DATA":
            if freshness != "model" or source_name != "MODEL DATA" or not invalid_host:
                _invalid_catalog()
        elif invalid_host or freshness == "model" or source_name == "MODEL DATA":
            _invalid_catalog()


def load_catalog() -> list[dict]:
    try:
        payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        logger.exception("catalog file is unreadable")
        raise ApiError(500, "catalog_invalid", "Каталог недоступен") from None
    try:
        validate_catalog(payload)
    except ApiError:
        raise
    except Exception:
        logger.exception("catalog validation failed")
        raise ApiError(500, "catalog_invalid", "Каталог недоступен") from None
    return payload


def _reject_unknown_filter(value: str | None, allowed: set[str]) -> None:
    if value is None:
        return
    if value not in allowed:
        raise ApiError(422, "validation_error", "Некорректный запрос")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/v1/catalog/filters")
def filters() -> dict[str, Any]:
    records = load_catalog()
    present_regions = {item["region"] for item in records}
    return {
        "regions": list(REGIONS),
        "roles": sorted({role for item in records for role in item["roles"]}),
        "tax_modes": sorted({mode for item in records for mode in item["tax_modes"]}),
        "sectors": sorted({item["sector"] for item in records}),
        "goals": sorted({item["goal"] for item in records}),
        "accepted_tax_modes": sorted(TAX_MODES),
        "content_gaps": sorted(region for region in REGIONS if region not in present_regions),
        "catalog_version": CATALOG_VERSION,
    }


@app.get("/api/v1/measures")
def measures() -> list[dict]:
    return load_catalog()


@app.get("/api/v1/measures/{measure_id}")
def measure(measure_id: str) -> dict:
    for item in load_catalog():
        if item["id"] == measure_id:
            return item
    raise ApiError(404, "measure_not_found", "Мера не найдена")


@app.post("/api/v1/recommendations")
def recommendations(request: RecommendationRequest) -> dict:
    records = load_catalog()
    _reject_unknown_filter(request.sector, {item["sector"] for item in records})
    _reject_unknown_filter(request.goal, {item["goal"] for item in records})
    items = []
    for item in records:
        if item["region"] != request.region:
            continue
        if request.role not in item["roles"] or request.tax_mode not in item["tax_modes"]:
            continue
        if request.sector is not None and item["sector"] != request.sector:
            continue
        if request.goal is not None and item["goal"] != request.goal:
            continue
        items.append({"id": item["id"], "title": item["title"], "data_status": item["data_status"]})
    return {"items": items, "catalog_version": CATALOG_VERSION}

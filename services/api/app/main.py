from pathlib import Path
import json
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="ZVERY Business Navigator API", version="0.1.0")
CATALOG_PATH = Path(__file__).resolve().parents[3] / "data" / "catalog" / "measures.json"


class RecommendationRequest(BaseModel):
    region: Literal["kazan", "moscow", "spb"]
    role: Literal["ip", "self_employed", "llc"]
    tax_mode: str = Field(min_length=1)
    sector: str | None = None
    goal: str | None = None


def load_catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/v1/catalog/filters")
def filters() -> dict[str, list[str]]:
    records = load_catalog()
    return {
        "regions": ["kazan", "moscow", "spb"],
        "roles": sorted({r for item in records for r in item["roles"]}),
        "tax_modes": sorted({m for item in records for m in item["tax_modes"]}),
        "sectors": sorted({item["sector"] for item in records}),
    }


@app.post("/api/v1/recommendations")
def recommendations(request: RecommendationRequest) -> dict:
    items = []
    for item in load_catalog():
        if item["region"] != request.region:
            continue
        if request.role not in item["roles"] or request.tax_mode not in item["tax_modes"]:
            continue
        if request.sector and item["sector"] != request.sector:
            continue
        if request.goal and item["goal"] != request.goal:
            continue
        items.append({"id": item["id"], "title": item["title"], "data_status": item["data_status"]})
    return {"items": items, "catalog_version": "demo-2026-09-19"}


@app.get("/api/v1/measures/{measure_id}")
def measure(measure_id: str) -> dict:
    for item in load_catalog():
        if item["id"] == measure_id:
            return item
    raise HTTPException(status_code=404, detail={"code": "measure_not_found"})

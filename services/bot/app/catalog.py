from __future__ import annotations

import json
from pathlib import Path


CATALOG_PATH = Path(__file__).resolve().parents[3] / "data" / "catalog" / "measures.json"


def measure_exists(measure_id: str) -> bool:
    records = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return any(item["id"] == measure_id for item in records)

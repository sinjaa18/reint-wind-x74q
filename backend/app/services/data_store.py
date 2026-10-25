from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"


def read_json(filename: str, default: Any = None) -> Any:
    path = DATA_DIR / filename
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_analysis_data() -> tuple[list[dict], list[dict], dict | None]:
    actuals = read_json("actuals.json", [])
    forecasts = read_json("forecasts.json", [])
    manifest = read_json("manifest.json")
    return actuals, forecasts, manifest

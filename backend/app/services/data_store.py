from __future__ import annotations

import json
from pathlib import Path
from typing import Any

def _resolve_data_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parents[2] / "data" / "processed",
        Path.cwd() / "backend" / "data" / "processed",
        Path.cwd() / "data" / "processed",
    ]
    for candidate in candidates:
        if candidate.exists() and (candidate / "actuals.json").exists():
            return candidate
    return candidates[0]


DATA_DIR = _resolve_data_dir()


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

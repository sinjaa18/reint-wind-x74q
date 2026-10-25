from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services.analysis import calculate_metrics, parse_datetime, select_forecast_for_interval
from app.services.data_store import load_analysis_data

app = FastAPI(title="REint Wind Forecast Intelligence API", version="0.1.0")
_allowed_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

UTC = timezone.utc
START = datetime(2026, 1, 1, tzinfo=UTC)
END = datetime(2026, 2, 1, tzinfo=UTC)


def _float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def metadata() -> dict[str, Any]:
    actuals, forecasts, manifest = load_analysis_data()
    return {
        "month": "2026-01",
        "expectedIntervals": 1488,
        "dataLoaded": bool(actuals and forecasts),
        "actualRows": len(actuals),
        "forecastRows": len(forecasts),
        "manifest": manifest,
        "sources": ["Elexon FUELHH (fuelType=WIND)", "Elexon WINDFOR"],
        "defaultCutoff": "12:00 Europe/London on the previous day",
    }


@app.get("/api/analysis")
def analysis(cutoff: str = Query(default="12:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")) -> dict[str, Any]:
    actuals, forecasts, manifest = load_analysis_data()
    if not actuals or not forecasts:
        raise HTTPException(status_code=503, detail="January data is not loaded. Run `python -m scripts.fetch_january_data` from the backend directory first.")
    try:
        cutoff_time = time.fromisoformat(cutoff)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Cutoff must use HH:MM format") from exc

    actual_map: dict[datetime, float] = {}
    for row in actuals:
        try:
            instant = parse_datetime(row["startTime"])
            value = _float_or_none(row.get("generation", row.get("actualGeneration")))
            if START <= instant < END and value is not None:
                # The ingestion step already resolves any duplicate/revised actual records.
                actual_map[instant] = value
        except (KeyError, ValueError, TypeError):
            continue

    observations = []
    current = START
    while current < END:
        chosen = select_forecast_for_interval(current, forecasts, cutoff_time)
        actual = actual_map.get(current)
        forecast_value = _float_or_none(chosen.get("generation")) if chosen else None
        error = forecast_value - actual if forecast_value is not None and actual is not None else None
        observations.append({
            "startTime": current.isoformat().replace("+00:00", "Z"),
            "forecastPublishTime": chosen.get("publishTime") if chosen else None,
            "forecastGeneration": forecast_value,
            "actualGeneration": actual,
            "error": round(error, 3) if error is not None else None,
        })
        current += timedelta(minutes=30)

    metrics = calculate_metrics(observations)
    metrics["expectedIntervals"] = len(observations)
    metrics["actualIntervals"] = sum(row["actualGeneration"] is not None for row in observations)
    metrics["forecastIntervals"] = sum(row["forecastGeneration"] is not None for row in observations)
    metrics["matchedIntervals"] = metrics["sampleSize"]
    metrics["coveragePercent"] = round(metrics["sampleSize"] / len(observations) * 100, 2) if observations else 0
    return {"month": "2026-01", "cutoff": cutoff, "metrics": metrics, "observations": observations, "dataManifest": manifest}

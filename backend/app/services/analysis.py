from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from math import sqrt
from typing import Any
from zoneinfo import ZoneInfo

UTC = timezone.utc
UK = ZoneInfo("Europe/London")


def parse_datetime(value: str | datetime) -> datetime:
    """Parse an ISO datetime. Naive source timestamps are rejected intentionally."""
    if isinstance(value, datetime):
        dt = value
    else:
        cleaned = value.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
    if dt.tzinfo is None:
        raise ValueError(f"Timestamp must include a timezone: {value!r}")
    return dt.astimezone(UTC)


def decision_cutoff(delivery_time: str | datetime, cutoff: time = time(12, 0)) -> datetime:
    """Return the day-before cutoff in UTC, computed in the UK business timezone."""
    delivery = parse_datetime(delivery_time).astimezone(UK)
    cutoff_local = datetime.combine(delivery.date() - timedelta(days=1), cutoff, tzinfo=UK)
    return cutoff_local.astimezone(UTC)


def select_forecast_for_interval(
    delivery_time: str | datetime,
    forecasts: list[dict[str, Any]] | dict[str | datetime, list[dict[str, Any]]],
    cutoff: time = time(12, 0),
) -> dict[str, Any] | None:
    """Choose the latest forecast for this delivery time published on/before cutoff."""
    delivery_utc = parse_datetime(delivery_time)
    deadline = decision_cutoff(delivery_utc, cutoff)

    if isinstance(forecasts, dict):
        candidates = forecasts.get(delivery_utc) or forecasts.get(delivery_utc.isoformat().replace("+00:00", "Z"), [])
    else:
        candidates = [
            row for row in forecasts
            if parse_datetime(row.get("startTime", "")) == delivery_utc
        ]

    eligible = []
    for row in candidates:
        try:
            published = parse_datetime(row["publishTime"])
            generation = row.get("generation")
            if generation is None or published > deadline:
                continue
            eligible.append((published, row))
        except (KeyError, TypeError, ValueError):
            continue
    if not eligible:
        return None
    return max(eligible, key=lambda item: item[0])[1]


def calculate_metrics(observations: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute metrics only for matched, numeric forecast/actual pairs."""
    pairs = []
    for row in observations:
        forecast, actual = row.get("forecastGeneration"), row.get("actualGeneration")
        if forecast is None or actual is None:
            continue
        try:
            f, a = float(forecast), float(actual)
        except (TypeError, ValueError):
            continue
        pairs.append((f, a))
    n = len(pairs)
    if n == 0:
        return {"sampleSize": 0, "mae": None, "rmse": None, "bias": None, "wape": None}
    errors = [f - a for f, a in pairs]
    mae = sum(abs(e) for e in errors) / n
    rmse = sqrt(sum(e * e for e in errors) / n)
    bias = sum(errors) / n
    actual_sum = sum(a for _, a in pairs)
    wape = sum(abs(e) for e in errors) / actual_sum * 100 if actual_sum != 0 else None
    return {
        "sampleSize": n,
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "bias": round(bias, 3),
        "wape": round(wape, 3) if wape is not None else None,
    }

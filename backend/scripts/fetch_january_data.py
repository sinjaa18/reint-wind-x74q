from __future__ import annotations

import json
import sys
import time as time_module
from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import httpx

API_BASE = "https://data.elexon.co.uk/bmrs/api/v1"
ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
UTC = timezone.utc
UK = ZoneInfo("Europe/London")
MONTH_START = datetime(2026, 1, 1, tzinfo=UTC)
MONTH_END = datetime(2026, 2, 1, tzinfo=UTC)  # exclusive
FORECAST_PUBLISH_START = datetime(2025, 12, 31, tzinfo=UTC)
FORECAST_PUBLISH_END = datetime(2026, 2, 1, tzinfo=UTC)  # includes all January 31 publications (exclusive of Feb 1)


class ElexonFetchError(RuntimeError):
    pass


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        return None
    return dt.astimezone(UTC)


def unwrap_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        rows = payload.get("data")
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
    raise ElexonFetchError(f"Unexpected Elexon response shape: {type(payload).__name__}")


def request_rows(client: httpx.Client, path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    url = f"{API_BASE}/{path}"
    for attempt in range(4):
        try:
            response = client.get(url, params=params)
            if response.status_code == 429 or response.status_code >= 500:
                if attempt < 3:
                    time_module.sleep(1.5 * (attempt + 1))
                    continue
            response.raise_for_status()
            return unwrap_rows(response.json())
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            if attempt == 3:
                raise ElexonFetchError(f"Network request failed after retries: {url} ({exc})") from exc
            time_module.sleep(1.5 * (attempt + 1))
        except httpx.HTTPStatusError as exc:
            raise ElexonFetchError(f"Elexon returned HTTP {exc.response.status_code}: {exc.response.text[:500]}") from exc
        except ValueError as exc:
            raise ElexonFetchError(f"Elexon returned non-JSON data for {url}") from exc
    raise ElexonFetchError(f"Unable to retrieve {url}")


def day_range(start: datetime, end: datetime):
    current = start
    while current < end:
        following = current + timedelta(days=1)
        yield current, min(following, end)
        current = following


def fetch_actuals(client: httpx.Client) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    total = (date(2026, 2, 1) - date(2026, 1, 1)).days
    for i in range(total):
        day = date(2026, 1, 1) + timedelta(days=i)
        batch = request_rows(client, "datasets/FUELHH/stream", {
            "settlementDateFrom": day.isoformat(),
            "settlementDateTo": day.isoformat(),
            "fuelType": "WIND",
        })
        rows.extend(batch)
        print(f"FUELHH {day}: {len(batch)} rows")
    return rows


def fetch_forecasts(client: httpx.Client) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for start, end in day_range(FORECAST_PUBLISH_START, FORECAST_PUBLISH_END):
        batch = request_rows(client, "datasets/WINDFOR/stream", {
            "publishDateTimeFrom": start.isoformat().replace("+00:00", "Z"),
            "publishDateTimeTo": end.isoformat().replace("+00:00", "Z"),
        })
        rows.extend(batch)
        print(f"WINDFOR publish window {start.date()}: {len(batch)} rows")
    return rows


def normalize_actuals(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    candidates: dict[datetime, dict[str, Any]] = {}
    invalid = 0
    wrong_fuel = 0
    for row in rows:
        if str(row.get("fuelType", "")).upper() != "WIND":
            wrong_fuel += 1
            continue
        start = parse_dt(row.get("startTime"))
        if start is None:
            # If Elexon omits startTime, reconstruct the interval from settlement date/period.
            # January is GMT in Europe/London; period 1 starts at local midnight.
            try:
                settlement_date = date.fromisoformat(row["settlementDate"])
                period = int(row["settlementPeriod"])
                local_start = datetime.combine(settlement_date, time.min, tzinfo=UK) + timedelta(minutes=30 * (period - 1))
                start = local_start.astimezone(UTC)
            except (KeyError, TypeError, ValueError):
                invalid += 1
                continue
        generation = row.get("generation")
        try:
            generation = float(generation) if generation is not None else None
        except (TypeError, ValueError):
            generation = None
        if generation is None or not (MONTH_START <= start < MONTH_END):
            if generation is None:
                invalid += 1
            continue
        published = parse_dt(row.get("publishTime")) or datetime.min.replace(tzinfo=UTC)
        normalized = {
            "startTime": start.isoformat().replace("+00:00", "Z"),
            "generation": generation,
            "fuelType": "WIND",
            "publishTime": published.isoformat().replace("+00:00", "Z") if published.year > 1 else None,
            "settlementDate": row.get("settlementDate"),
            "settlementPeriod": row.get("settlementPeriod"),
        }
        previous = candidates.get(start)
        previous_time = parse_dt(previous.get("publishTime")) if previous else None
        # Retain the last-published actual when an interval appears more than once.
        if previous is None or (published and (previous_time is None or published >= previous_time)):
            candidates[start] = normalized
    result = [candidates[key] for key in sorted(candidates)]
    return result, {"invalidOrMissingValues": invalid, "nonWindRowsExcluded": wrong_fuel, "uniqueIntervals": len(result)}


def normalize_forecasts(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    unique: dict[tuple[datetime, datetime], dict[str, Any]] = {}
    invalid = 0
    outside_delivery_month = 0
    for row in rows:
        start, published = parse_dt(row.get("startTime")), parse_dt(row.get("publishTime"))
        try:
            generation = float(row["generation"]) if row.get("generation") is not None else None
        except (TypeError, ValueError):
            generation = None
        if start is None or published is None or generation is None:
            invalid += 1
            continue
        if not (MONTH_START <= start < MONTH_END):
            outside_delivery_month += 1
            continue
        item = {
            "startTime": start.isoformat().replace("+00:00", "Z"),
            "publishTime": published.isoformat().replace("+00:00", "Z"),
            "generation": generation,
        }
        unique[(start, published)] = item
    result = [unique[key] for key in sorted(unique)]
    return result, {"invalidRows": invalid, "outsideJanuaryDeliveryWindow": outside_delivery_month, "uniqueStartPublishPairs": len(result)}


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(value, file, indent=2, ensure_ascii=False)


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    headers = {"Accept": "application/json", "User-Agent": "reint-wind-forecast-challenge/0.1"}
    try:
        with httpx.Client(timeout=40.0, headers=headers) as client:
            actual_raw = fetch_actuals(client)
            forecast_raw = fetch_forecasts(client)
    except ElexonFetchError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        print("Check your network and retry. No placeholder data will be written.", file=sys.stderr)
        return 1

    actuals, actual_quality = normalize_actuals(actual_raw)
    forecasts, forecast_quality = normalize_forecasts(forecast_raw)
    write_json(RAW_DIR / "FUELHH_january_2026.json", actual_raw)
    write_json(RAW_DIR / "WINDFOR_publish_dec31_to_jan30_2026.json", forecast_raw)
    write_json(PROCESSED_DIR / "actuals.json", actuals)
    write_json(PROCESSED_DIR / "forecasts.json", forecasts)

    expected_half_hourly = int((MONTH_END - MONTH_START).total_seconds() // 1800)
    expected_hourly = 31 * 24  # 744 hourly intervals
    actual_starts = {parse_dt(row["startTime"]) for row in actuals}
    forecast_starts = {parse_dt(row["startTime"]) for row in forecasts}
    manifest = {
        "generatedAtUtc": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "deliveryWindow": {"from": MONTH_START.isoformat().replace("+00:00", "Z"), "toExclusive": MONTH_END.isoformat().replace("+00:00", "Z")},
        "forecastPublishWindow": {"from": FORECAST_PUBLISH_START.isoformat().replace("+00:00", "Z"), "toExclusive": FORECAST_PUBLISH_END.isoformat().replace("+00:00", "Z")},
        "decisionCutoffDefault": "12:00 Europe/London on the previous calendar day (assumption)",
        "resolutionNote": "Elexon WINDFOR forecasts are natively published on an hourly cadence (at :00). The nominal 1,488 calendar intervals are half-hourly (:00 and :30), of which all 744 hourly delivery intervals have forecast coverage, and the 744 half-hourly (:30) intervals have no forecast published by Elexon.",
        "expectedHalfHourlyIntervals": expected_half_hourly,
        "expectedHourlyIntervals": expected_hourly,
        "actuals": {
            "rowsFetched": len(actual_raw),
            **actual_quality,
            "missingIntervals": expected_half_hourly - len(actual_starts),
            "coveragePercent": round(len(actual_starts) / expected_half_hourly * 100, 2),
        },
        "forecasts": {
            "rowsFetched": len(forecast_raw),
            **forecast_quality,
            "deliveryIntervalsCovered": len(forecast_starts),
            "deliveryIntervalsWithoutAnyForecast": expected_half_hourly - len(forecast_starts),
            "hourlyCoveragePercent": round(len(forecast_starts) / expected_hourly * 100, 2),
            "halfHourlyCoveragePercent": round(len(forecast_starts) / expected_half_hourly * 100, 2),
        },
        "sourceEndpoints": {
            "actuals": f"{API_BASE}/datasets/FUELHH/stream",
            "forecasts": f"{API_BASE}/datasets/WINDFOR/stream",
        },
        "attribution": "Contains BMRS data © Elexon Limited copyright and database right",
    }
    write_json(PROCESSED_DIR / "manifest.json", manifest)
    print("\nDATA QUALITY SUMMARY")
    print(json.dumps(manifest, indent=2))
    print(f"\nWrote processed files to {PROCESSED_DIR}")
    if not actuals or not forecasts:
        print("WARNING: one or both datasets are empty. Inspect source responses before continuing.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

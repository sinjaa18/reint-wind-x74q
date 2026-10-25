from datetime import time

import pytest

from app.services.analysis import calculate_metrics, decision_cutoff, select_forecast_for_interval


def test_selects_latest_forecast_published_before_cutoff():
    forecasts = [
        {"startTime": "2026-01-15T12:00:00Z", "publishTime": "2026-01-14T08:30:00Z", "generation": 12000},
        {"startTime": "2026-01-15T12:00:00Z", "publishTime": "2026-01-14T10:00:00Z", "generation": 11500},
        {"startTime": "2026-01-15T12:00:00Z", "publishTime": "2026-01-14T12:30:00Z", "generation": 10800},
    ]
    selected = select_forecast_for_interval("2026-01-15T12:00:00Z", forecasts, time(12, 0))
    # January uses GMT in London, so the 12:30Z publication is after the noon cutoff.
    assert selected is not None
    assert selected["generation"] == 11500


def test_no_forecast_available_returns_none():
    rows = [{"startTime": "2026-01-15T12:00:00Z", "publishTime": "2026-01-14T12:01:00Z", "generation": 100}]
    assert select_forecast_for_interval("2026-01-15T12:00:00Z", rows, time(12, 0)) is None


def test_decision_cutoff_is_day_before_in_utc_for_january():
    assert decision_cutoff("2026-01-15T12:00:00Z", time(12, 0)).isoformat() == "2026-01-14T12:00:00+00:00"


def test_metrics_known_values():
    rows = [
        {"forecastGeneration": 110, "actualGeneration": 100},
        {"forecastGeneration": 80, "actualGeneration": 100},
    ]
    result = calculate_metrics(rows)
    assert result["sampleSize"] == 2
    assert result["mae"] == 15.0
    assert result["rmse"] == pytest.approx(15.811, abs=0.001)
    assert result["bias"] == -5.0
    assert result["wape"] == 15.0


def test_metrics_empty_dataset_are_null_not_zero():
    result = calculate_metrics([])
    assert result == {"sampleSize": 0, "mae": None, "rmse": None, "bias": None, "wape": None}


def test_wape_undefined_when_actual_sum_is_zero():
    result = calculate_metrics([{"forecastGeneration": 10, "actualGeneration": 0}])
    assert result["wape"] is None


def test_missing_forecast_intervals_excluded_from_metrics_without_distortion():
    observations = [
        {"startTime": "2026-01-01T00:00:00Z", "forecastGeneration": 1000.0, "actualGeneration": 900.0, "error": 100.0},
        {"startTime": "2026-01-01T00:30:00Z", "forecastGeneration": None, "actualGeneration": 920.0, "error": None},
        {"startTime": "2026-01-01T01:00:00Z", "forecastGeneration": 1100.0, "actualGeneration": 1200.0, "error": -100.0},
        {"startTime": "2026-01-01T01:30:00Z", "forecastGeneration": None, "actualGeneration": 1180.0, "error": None},
    ]
    result = calculate_metrics(observations)
    assert result["sampleSize"] == 2
    assert result["mae"] == 100.0
    assert result["rmse"] == 100.0
    assert result["bias"] == 0.0
    assert result["wape"] == pytest.approx(100.0 * 200.0 / 2100.0, abs=0.001)


def test_forecast_selection_with_varying_cutoffs():
    forecasts = [
        {"startTime": "2026-01-10T14:00:00Z", "publishTime": "2026-01-09T06:00:00Z", "generation": 5000},
        {"startTime": "2026-01-10T14:00:00Z", "publishTime": "2026-01-09T11:00:00Z", "generation": 5500},
        {"startTime": "2026-01-10T14:00:00Z", "publishTime": "2026-01-09T16:00:00Z", "generation": 6000},
    ]
    # Cutoff at 08:00 selects 06:00 publication (5000)
    fc_8 = select_forecast_for_interval("2026-01-10T14:00:00Z", forecasts, time(8, 0))
    assert fc_8 is not None and fc_8["generation"] == 5000

    # Cutoff at 12:00 selects 11:00 publication (5500)
    fc_12 = select_forecast_for_interval("2026-01-10T14:00:00Z", forecasts, time(12, 0))
    assert fc_12 is not None and fc_12["generation"] == 5500

    # Cutoff at 17:00 selects 16:00 publication (6000)
    fc_17 = select_forecast_for_interval("2026-01-10T14:00:00Z", forecasts, time(17, 0))
    assert fc_17 is not None and fc_17["generation"] == 6000

    # Cutoff before any publication returns None
    fc_early = select_forecast_for_interval("2026-01-10T14:00:00Z", forecasts, time(5, 0))
    assert fc_early is None

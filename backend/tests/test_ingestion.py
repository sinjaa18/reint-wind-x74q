from scripts.fetch_january_data import normalize_actuals, normalize_forecasts


def test_actual_normalization_filters_to_wind_and_deduplicates():
    rows = [
        {"fuelType": "WIND", "startTime": "2026-01-01T00:00:00Z", "publishTime": "2026-01-01T01:00:00Z", "generation": 10},
        {"fuelType": "WIND", "startTime": "2026-01-01T00:00:00Z", "publishTime": "2026-01-01T02:00:00Z", "generation": 11},
        {"fuelType": "GAS", "startTime": "2026-01-01T00:30:00Z", "publishTime": "2026-01-01T02:00:00Z", "generation": 20},
    ]
    normalized, report = normalize_actuals(rows)
    assert len(normalized) == 1
    assert normalized[0]["generation"] == 11
    assert report["nonWindRowsExcluded"] == 1


def test_forecast_normalization_retains_publish_time_and_deduplicates():
    rows = [
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T08:30:00Z", "generation": 120},
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T08:30:00Z", "generation": 121},
        {"startTime": "2026-02-01T00:00:00Z", "publishTime": "2026-01-31T08:30:00Z", "generation": 100},
    ]
    normalized, report = normalize_forecasts(rows)
    assert len(normalized) == 1
    assert normalized[0]["generation"] == 121
    assert normalized[0]["publishTime"] == "2026-01-01T08:30:00Z"
    assert report["outsideJanuaryDeliveryWindow"] == 1

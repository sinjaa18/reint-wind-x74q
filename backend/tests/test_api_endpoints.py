from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    # Unprefixed alias for deployment resilience
    resp_alias = client.get("/health")
    assert resp_alias.status_code == 200
    assert resp_alias.json() == {"status": "ok"}


def test_meta_endpoint():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-01"
    assert data["expectedIntervals"] == 1488
    assert data["dataLoaded"] is True
    assert data["actualRows"] == 1488
    assert data["forecastRows"] > 17000

    resp_alias = client.get("/meta")
    assert resp_alias.status_code == 200
    assert resp_alias.json()["month"] == "2026-01"


def test_analysis_endpoint_and_cutoff_variation():
    # 12:00 cutoff
    r12 = client.get("/api/analysis?cutoff=12:00")
    assert r12.status_code == 200
    d12 = r12.json()
    assert d12["month"] == "2026-01"
    assert d12["cutoff"] == "12:00"
    m12 = d12["metrics"]
    assert m12["matchedIntervals"] == 744
    assert m12["mae"] is not None
    assert m12["rmse"] is not None
    assert m12["bias"] is not None
    assert m12["wape"] is not None

    # 08:00 cutoff
    r08 = client.get("/api/analysis?cutoff=08:00")
    assert r08.status_code == 200
    d08 = r08.json()
    m08 = d08["metrics"]
    assert m08["matchedIntervals"] == 744

    # Changing cutoff affects metrics
    assert m12["mae"] != m08["mae"]


def test_analysis_invalid_cutoff():
    resp = client.get("/api/analysis?cutoff=invalid")
    assert resp.status_code == 422


def test_serverless_entry_point():
    from api.index import app as serverless_app
    assert serverless_app.title == "REint Wind Forecast Intelligence API"

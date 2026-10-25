# REint Wind Forecast Intelligence

A pilot dashboard for comparing UK national wind-generation forecasts with actual wind generation for January 2026, using only Elexon's `FUELHH` and `WINDFOR` datasets.

> **Implementation status:** local MVP code is in place: data ingestion, forecast-selection logic, FastAPI endpoints, React dashboard, CSV export, tests, and Docker Compose. Run the ingestion script and inspect its data-quality report before relying on any analysis. No sample or fabricated data is included.

## Scope

- Show the forecast publication available by a configurable day-ahead decision cutoff.
- Compare that forecast with actual wind generation for the same delivery interval.
- Quantify MAE, RMSE, signed bias, WAPE, matched intervals, and coverage.
- Inspect a daily generation chart and error chart, then export interval-level CSV data.

The initial default cutoff is **12:00 Europe/London on the day before delivery**. The challenge does not specify an exact cutoff, so this is an explicit, configurable demonstration assumption—not a claim about a market rule.

## Repository layout

- `backend/app/`: FastAPI application and analysis services.
- `backend/scripts/fetch_january_data.py`: downloads January 2026 actuals and the relevant historical forecast publications from Elexon.
- `backend/tests/`: tests for forecast selection and metrics.
- `backend/data/raw/`: downloaded source snapshots (generated locally; not committed by default).
- `backend/data/processed/`: normalized records and data-quality manifest.
- `frontend/`: React + TypeScript + Vite frontend.
- `docs/assumptions.md`: business and data assumptions.
- `docker-compose.yml`: local development containers.

## Requirements

- Python 3.11+
- Node.js 20+
- Docker Desktop / Docker Engine (optional for running locally without containers)

## 1. Fetch data

From the repository root:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.fetch_january_data
```

The script uses the documented Elexon Insights API base URL `https://data.elexon.co.uk/bmrs/api/v1`. It saves raw snapshots, normalized JSON files, and a manifest with coverage and missing-interval counts. API availability and source coverage must be verified when running the script.

## 2. Start the backend

From `backend/` with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the interactive API docs and `http://localhost:8000/api/health` for the health check.

## 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## 4. Tests

From `backend/`:

```bash
pytest
```

## Data and methodology notes

- `FUELHH` is queried by settlement date and filtered to `fuelType=WIND`.
- `WINDFOR` is queried by its publication-time window, preserving `publishTime` for historical decision reconstruction.
- Delivery timestamps are normalized to UTC; the business cutoff is calculated in `Europe/London`.
- For each delivery interval, eligible forecasts must have `publishTime <= cutoff`; the latest eligible publication is selected.
- Forecast error is defined as forecast minus actual. Positive values indicate overforecast; negative values indicate underforecast.
- The app reports metric sample size and missing coverage rather than filling missing source values with invented data.

## Deployment

Deployment URLs will be added after the app is built and verified. Do not publish this README with placeholder URLs.

## AI tools disclosure

AI tools were used to assist with planning, implementation scaffolding, and code review. All generated code and results must be reviewed and tested before submission.

## Source attribution

Contains BMRS data © Elexon Limited copyright and database right. Source: [Elexon Insights API](https://bmrs.elexon.co.uk/api-documentation).

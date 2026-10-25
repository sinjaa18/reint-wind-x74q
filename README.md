# REint Wind Forecast Intelligence

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![CI](https://github.com/sinjaa18/reint-wind-x74q/actions/workflows/ci.yml/badge.svg)](https://github.com/sinjaa18/reint-wind-x74q/actions/workflows/ci.yml)

A full-stack evaluation application comparing Great Britain national wind generation forecasts against actual settlement outturn for **January 2026**, built with genuine **Elexon BMRS** open energy market datasets (`FUELHH` and `WINDFOR`).

---

## Deliverables & Links

- **Live Deployed Application**: [https://reint-wind-forecast-lyart.vercel.app](https://reint-wind-forecast-lyart.vercel.app)
- **Public GitHub Repository**: [https://github.com/sinjaa18/reint-wind-x74q](https://github.com/sinjaa18/reint-wind-x74q)
- **Production API Endpoints**:
  - Health check: `https://reint-wind-forecast-lyart.vercel.app/api/health`
  - Metadata: `https://reint-wind-forecast-lyart.vercel.app/api/meta`
  - Analysis (12:00 Cutoff): `https://reint-wind-forecast-lyart.vercel.app/api/analysis?cutoff=12:00`
  - Analysis (08:00 Cutoff): `https://reint-wind-forecast-lyart.vercel.app/api/analysis?cutoff=08:00`
- **Video Demonstration**: Complete 9-minute script and recording checklist at [`docs/demo_script.md`](docs/demo_script.md).

---

## Overview & Evaluation Context

In the Great Britain electricity market, suppliers and procurement teams contract electricity prior to day-ahead gate closure. Evaluation of wind generation forecast accuracy depends critically on which forecast was available when trading decisions were made.

### Decision Cutoff Assumption
Rather than taking the last forecast published prior to delivery (which incorporates post-trading updates), this application evaluates the forecast available as of a configured **day-ahead decision cutoff**.
- **Configured Assumption**: 12:00 Europe/London on the calendar day prior to delivery is used as the default evaluation baseline. This cutoff is a configurable backtest assumption, not an officially mandated statutory market deadline specified by the assignment.
- **Configurability**: The interface and API support testing alternative cutoffs (such as 08:00, 10:00, 14:00, or 16:00 UK time) to measure the impact of decision timing on forecast error.

---

## Elexon Datasets & Resolution Audit

The platform evaluates two official Elexon BMRS streams for the period 1 January 2026 00:00 UTC through 31 January 2026 23:59 UTC:

### 1. Actual Generation: `FUELHH`
- **Stream**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
- **Filter**: `fuelType=WIND`
- **Cadence**: 30-minute settlement periods (48 periods per calendar day).
- **Dataset Total**: **1,488 half-hourly observations** (100% complete for January 2026).

### 2. Day-Ahead Forecast: `WINDFOR`
- **Stream**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
- **Publish Window Queried**: `2025-12-31T00:00:00Z` through `2026-02-01T00:00:00Z` to ensure complete coverage of day-ahead forecasts for all January delivery points.
- **Cadence**: Native **1-hour resolution** (delivery timestamps at `:00`). Elexon's `WINDFOR` stream publishes forecasts strictly on an hourly cadence; it does not publish half-hourly (`:30`) forecast records.
- **Dataset Total**: **18,688 raw records** normalized into **17,904 unique `(startTime, publishTime)` pairs**, providing day-ahead coverage for all **744 hourly delivery intervals**.

### Resolution Handling & Data Discipline
- The month comprises 1,488 nominal half-hourly settlement intervals: 744 on the hour (`:00`) and 744 on the half-hour (`:30`).
- Because `WINDFOR` does not publish `:30` forecasts, exactly 744 delivery intervals have eligible forecasts.
- **No Synthetic Fabrication**: No synthetic, linear, or interpolated values are generated for the 744 unforecasted `:30` half-hours. In the dashboard and data tables, hourly points are evaluated as matched pairs, while alternating `:30` intervals are transparently identified as unforecasted.
- Metrics are calculated strictly across genuine matched intervals without statistical distortion.

---

## Evaluation Metrics & Verified Findings

### Metric Definitions
- **Signed Error**: $\text{Error}_i = \text{Forecast}_i - \text{Actual}_i$ (positive indicates overforecasting; negative indicates underforecasting).
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |\text{Forecast}_i - \text{Actual}_i|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (\text{Forecast}_i - \text{Actual}_i)^2}$$
- **Signed Bias**:
  $$\text{Bias} = \frac{1}{n} \sum_{i=1}^{n} (\text{Forecast}_i - \text{Actual}_i)$$
- **Weighted Absolute Percentage Error (WAPE)**:
  $$\text{WAPE} = \frac{\sum_{i=1}^{n} |\text{Forecast}_i - \text{Actual}_i|}{\sum_{i=1}^{n} \text{Actual}_i} \times 100\%$$
- **Hourly Forecast Coverage**: Ratio of matched hourly delivery intervals to total hourly intervals in the period ($744 / 744 = 100\%$).

### Verified January 2026 Results

| Metric | 08:00 UK Cutoff | 12:00 UK Cutoff (Default) | Variance |
| :--- | :---: | :---: | :--- |
| **MAE** | 2,127.48 MW | **2,002.91 MW** | -124.57 MW (lower error with noon cutoff) |
| **RMSE** | 2,606.07 MW | **2,470.08 MW** | -135.99 MW |
| **Signed Bias** | +1,851.53 MW | **+1,805.86 MW** | Persistent positive overforecast bias |
| **WAPE** | 18.37% | **17.30%** | -1.07% |
| **Matched Intervals** | 744 / 744 | **744 / 744** | 100% of available hourly forecast intervals |

Key observation: Wind generation in Great Britain exhibited a consistent positive bias throughout January 2026 across both cutoffs, with forecasts systematically exceeding actual outturn. Delaying the decision cutoff from 08:00 to 12:00 UK time improved MAE by 124.57 MW by incorporating newer forecast runs.

---

## Architecture & Repository Structure

The project is structured as a decoupled full-stack application:
- **Backend**: Python 3.12 with FastAPI for REST endpoints, timezone arithmetic (`Europe/London` to UTC), $O(1)$ dictionary-indexed forecast lookup, and metric calculation.
- **Frontend**: React 18 with TypeScript 5.7 and Vite 6, using Recharts for interactive generation and error visualizations, date navigation, cutoff selection, interval detail tables, and CSV export.
- **Serverless Bridge**: `api/index.py` ASGI entry point for Vercel deployment.
- **Data Packaging**: Normalized datasets are committed under `backend/data/processed/`, enabling zero-dependency runtime execution without requiring external database connections or external API calls during startup.

```text
reint-wind-forecast/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI (backend tests + frontend build)
├── .gitignore                        # Git exclusion rules
├── docker-compose.yml                # Multi-container local orchestration
├── pyproject.toml                    # Root pytest configuration
├── requirements.txt                  # Root dependencies for Vercel Python runtime
├── vercel.json                       # Vercel deployment and routing configuration
├── api/
│   ├── index.py                      # Vercel serverless ASGI entry point
│   └── requirements.txt              # Serverless function dependencies
├── backend/
│   ├── Dockerfile                    # Container image definition (Python 3.12-slim)
│   ├── pyproject.toml                # Backend pytest configuration
│   ├── requirements.txt              # Backend dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI application, route handlers, and CORS
│   │   └── services/
│   │       ├── analysis.py           # Cutoff logic, O(1) indexed lookup, and metrics
│   │       └── data_store.py         # Resilient multi-path dataset loader
│   ├── data/
│   │   └── processed/                # Normalized January 2026 datasets
│   │       ├── actuals.json          # 1,488 normalized outturns
│   │       ├── forecasts.json        # 17,904 normalized forecasts
│   │       └── manifest.json         # Dataset provenance and audit metadata
│   ├── scripts/
│   │   └── fetch_january_data.py     # Live Elexon API ingestion and normalization
│   └── tests/
│       ├── test_analysis.py          # Unit tests for cutoff and metric calculations
│       ├── test_api_endpoints.py     # FastAPI TestClient integration tests
│       └── test_ingestion.py         # Normalization and deduplication tests
├── docs/
│   ├── assumptions.md                # Detailed operational assumptions and audit trail
│   └── demo_script.md                # 9-minute presentation and technical review script
└── frontend/
    ├── package.json                  # React, TypeScript, and Vite dependencies
    ├── tsconfig.json                 # TypeScript strict configuration
    ├── vite.config.ts                # Vite dev server and proxy configuration
    └── src/
        ├── App.tsx                   # Main dashboard layout and state management
        ├── api.ts                    # REST client with AbortController support
        ├── types.ts                  # TypeScript interfaces and data contracts
        ├── style.css                 # Dark theme design system
        ├── components/
        │   ├── Controls.tsx          # Cutoff selector and date navigation
        │   ├── CoverageBanner.tsx    # Resolution audit and coverage explanation
        │   ├── ErrorChart.tsx        # Signed error distribution bar chart
        │   ├── GenerationChart.tsx   # Forecast vs actual generation line chart
        │   ├── IntervalTable.tsx     # Settlement interval detail table and CSV export
        │   └── KpiCards.tsx          # Key performance indicator cards
        └── utils/
            └── formatters.ts         # Numeric and timestamp formatters
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.11+ (Python 3.12 recommended)
- Node.js 20+ (with npm)
- Git

### 1. Clone & Set Up Python Backend

```bash
git clone https://github.com/sinjaa18/reint-wind-x74q.git
cd reint-wind-forecast

# Create and activate virtual environment in backend
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run all 15 backend tests
pytest -v
```

### 2. Start the Backend API

From `backend/`:
```bash
uvicorn app.main:app --reload --port 8000
```
- API Health: `http://localhost:8000/api/health`
- API Metadata: `http://localhost:8000/api/meta`
- API Analysis: `http://localhost:8000/api/analysis?cutoff=12:00`
- Interactive API Docs: `http://localhost:8000/docs`

### 3. Start the Frontend Dashboard

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running with Docker Compose

A multi-container setup is provided using Docker Compose:

```bash
docker compose up --build
```

- Backend API: `http://localhost:8000`
- Frontend Dashboard: `http://localhost:5173`

---

## Testing & Quality Assurance

### Backend Unit & Integration Tests (15 tests)
```bash
# Run from repository root:
pytest backend/tests -v

# Or run from backend directory:
cd backend && pytest -v
```
Test suite covers:
- Forecast selection with strict decision cutoff enforcement (`publishTime <= cutoff`).
- Day-ahead cutoff calculation across London civil time boundaries.
- Metric calculation accuracy (MAE, RMSE, Bias, WAPE, and null-on-zero WAPE handling).
- Non-distortion of metrics when encountering unforecasted `:30` intervals.
- FastAPI endpoints (`/api/health`, `/api/meta`, `/api/analysis`) and unprefixed route aliases.
- Serverless entry point import resolution (`api/index.py`).
- Ingestion deduplication and fuel-type filtering (`fuelType=WIND`).

### Frontend Typechecking & Production Build
```bash
cd frontend
npm test          # Runs TypeScript strict typecheck (tsc -b)
npm run build     # Generates production bundle with Vite
```

---

## Deployment Architecture

The production application is deployed on **Vercel**:
- **Static Assets**: Vite compiles the React SPA into `frontend/dist/`, served directly by Vercel's global CDN.
- **Serverless API**: Requests matching `/api/*` route to `api/index.py`, executing FastAPI within Vercel's Python runtime.
- **Self-Contained Data**: The normalized January 2026 datasets are bundled with the serverless function, requiring no external database or external network access during runtime.

---

## AI Tools Disclosure

In accordance with hiring challenge submission requirements:
- **Tools Used**: Google Antigravity AI coding assistant powered by Gemini.
- **Role in Development**: AI tools assisted with environment setup, boilerplate scaffolding, styling refinements, algorithmic $O(1)$ indexing optimization, test ideation, and initial documentation drafting.
- **Engineering Review**: All business logic, timezone calculations, Elexon BMRS ingestion parameters, resolution audit determinations, and test assertions were reviewed, verified, and validated against genuine market data.

---

## Data Attribution & Limitations

- **Attribution**: Contains Balancing Mechanism Reporting Service (BMRS) data © Elexon Limited copyright and database right. Data retrieved via the official [Elexon Insights API](https://bmrs.elexon.co.uk/api-documentation).
- **Known Limitations**:
  1. The evaluation is limited to the single calendar month of January 2026.
  2. Great Britain operates on GMT (UTC+0) during January; evaluating summer months would involve British Summer Time (BST, UTC+1) transitions.
  3. `WINDFOR` publishes on an hourly cadence, whereas `FUELHH` publishes on a half-hourly cadence. The alternating half-hours are unforecasted in the source data and are presented without synthetic interpolation.

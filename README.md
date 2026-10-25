# REint Wind Forecast Intelligence Platform

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)

---

### Challenge Deliverables & Verified Links

- **Live Deployed Application**: [https://reint-wind-forecast-lyart.vercel.app](https://reint-wind-forecast-lyart.vercel.app)
- **Public GitHub Repository**: [https://github.com/sinjaa18/reint-wind-x74q](https://github.com/sinjaa18/reint-wind-x74q)
- **Production API Endpoints**:
  - Health Check: `https://reint-wind-forecast-lyart.vercel.app/api/health`
  - Metadata: `https://reint-wind-forecast-lyart.vercel.app/api/meta`
  - Analysis (12:00 Cutoff): `https://reint-wind-forecast-lyart.vercel.app/api/analysis?cutoff=12:00`
  - Analysis (08:00 Cutoff): `https://reint-wind-forecast-lyart.vercel.app/api/analysis?cutoff=08:00`
- **Video Walkthrough Demonstration**: Complete 9-minute two-part recording script and presenter checklist at [`docs/demo_script.md`](docs/demo_script.md) (pending YouTube recording upload).

---

An executive intelligence platform for comparing UK national wind-generation forecasts against actual settlement outturn for **January 2026**, built exclusively with verified **Elexon BMRS** open energy datasets (`FUELHH` and `WINDFOR`).

Designed specifically for day-ahead power procurement desks and energy risk analysts, this application reconstructs the exact operational forecast available prior to commercial gate closure, evaluating forecast accuracy without hindsight distortion or synthetic data fabrication.

---

## Executive Summary & Business Problem

In the Great Britain electricity market, energy suppliers and procurement teams must contract electricity in the day-ahead wholesale market (EPEX SPOT / Nord Pool) prior to gate closure. Wind generation is highly volatile:
- **Overforecasting ($Forecast > Actual$)**: The procurement desk expects high wind volumes and under-procures thermal/flexible power. In settlement, the utility is "short" and exposed to expensive System Buy Price (SBP) imbalance cash-out charges.
- **Underforecasting ($Forecast < Actual$)**: The desk over-procures conventional contracts. In settlement, excess generation is "spilled" into the market at the System Sell Price (SSP), risking severe margin erosion.

### Core Value Proposition
Commercial backtests often cheat by taking the "latest forecast" without regard to when it was actually published. **REint Wind Forecast Intelligence** strictly filters forecasts by **publication timestamp (`publishTime <= cutoff`)**, allowing energy traders and risk managers to evaluate forecast performance at actual decision milestones (08:00, 10:00, 12:00, 14:00, etc.).

---

## Live Dashboard Architecture & User Experience

```text
+--------------------------------------------------------------------------------------------------------+
| [R] REINT ENERGY INTELLIGENCE   Wind Forecast Intelligence Platform        [LIVE BACKTEST] [JAN 2026]  |
+--------------------------------------------------------------------------------------------------------+
| Delivery Date: [ 2026-01-01 ]  | Decision Cutoff: [ 12:00 UK Time (D-1) ] | [↻ Refresh Analysis]       |
+--------------------------------------------------------------------------------------------------------+
| (i) DATA RESOLUTION AUDIT & COVERAGE NOTICE                                                            |
|     Actuals (FUELHH): 1,488 / 1,488 half-hours (100% complete)                                         |
|     Forecasts (WINDFOR): 744 / 744 hourly delivery points (100% hourly match, :30 unforecasted)        |
+--------------------------------------------------------------------------------------------------------+
|  MAE: 2,002.9 MW   |  RMSE: 2,470.1 MW  |  BIAS: +1,805.9 MW |  WAPE: 17.30%  |  COVERAGE: 744 / 744   |
|  Average Miss      |  Penalizes Spikes  |  Overforecasting   |  Error Ratio   |  100% Hourly Matched   |
+--------------------------------------------------------------------------------------------------------+
| HALF-HOURLY GENERATION: FORECAST VS ACTUAL OUTTURN (MW)                                                |
| [Line Chart: 30-min Actual Outturn vs Day-Ahead Forecast at Cutoff with London timestamp tooltips]     |
+--------------------------------------------------------------------------------------------------------+
| ERROR PROFILE: SIGNED FORECAST ERROR BY SETTLEMENT INTERVAL                                            |
| [Bar Chart: Overforecast (Coral +MW) vs Underforecast (Cyan -MW) around 0 reference baseline]          |
+--------------------------------------------------------------------------------------------------------+
| SETTLEMENT INTERVAL DETAIL TABLE (Europe/London Timestamps)                       [Export CSV]         |
| Delivery (UK)   | Published (UK)   | Forecast (MW) | Actual (MW) | Signed Error (MW) | Status          |
| 01 Jan 00:00    | 31 Dec 10:30     | 14,210.0 MW   | 13,105.0 MW | +1,105.0 MW       | Matched Pair    |
| 01 Jan 00:30    | No eligible fc   | —             | 13,420.0 MW | —                 | Unmatched (:30) |
+--------------------------------------------------------------------------------------------------------+
```

---

## Verified January 2026 Backtest Findings

The application was evaluated across the full month of January 2026 using real Elexon data:

| Metric | 08:00 Cutoff (Early Morning) | 12:00 Cutoff (Day-Ahead Standard) | Commercial Significance |
| :--- | :---: | :---: | :--- |
| **MAE** | 2,127.48 MW | **2,002.91 MW** | **124.57 MW accuracy gain** from 4-hour forecast updates |
| **RMSE** | 2,606.07 MW | **2,470.08 MW** | Substantial reduction in extreme imbalance risk |
| **Signed Bias** | +1,851.53 MW | **+1,805.86 MW** | **Persistent overforecast bias** in GB transmission wind |
| **WAPE** | 18.37% | **17.30%** | Overall volumetric forecast error relative to actuals |
| **Matched Intervals** | 744 / 744 | **744 / 744** | 100% coverage of all hourly delivery periods |

---

## Data Sources & Resolution Discipline

### 1. Actual Outturn Generation: Elexon `FUELHH`
- **Stream**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
- **Filtering**: `fuelType=WIND`
- **Resolution**: **30-minute settlement periods** (Period 1 to 48 per day).
- **January 2026 Total**: **1,488 half-hourly intervals** (100% complete, 0 missing).

### 2. Wind Generation Forecast: Elexon `WINDFOR`
- **Stream**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
- **Historical Depth**: Queried by publication window (`2025-12-31T00:00:00Z` to `2026-02-01T00:00:00Z`).
- **Resolution**: **1-hour cadence** (`:00` minutes only). Elexon publishes forecasts covering 49 hourly periods from 21:00 (D) through 21:00 (D+2).
- **January 2026 Total**: **18,688 raw rows** normalized into **17,904 unique `(startTime, publishTime)` pairs**, covering all **744 hourly delivery intervals**.

### 3. Resolution Transparency vs Fabrication
- The 1,488 nominal calendar intervals in January 2026 comprise 744 hourly intervals (`:00`) and 744 half-hourly intervals (`:30`).
- Because `WINDFOR` does not publish half-hourly records, exactly 744 intervals have forecast records.
- **Strict Data Discipline**: In accordance with commercial trading rules, **no synthetic, linear, or interpolated values are fabricated**. Half-hourly intervals are explicitly presented in the UI and interval tables as unmatched (`:30`), and metrics are computed strictly across genuine matched pairs.

---

## Mathematical Metric Definitions

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |F_i - A_i|$$
   Measures average miss magnitude in Megawatts (MW).

2. **Root Mean Squared Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (F_i - A_i)^2}$$
   Heavily penalizes extreme forecast errors that cause large grid imbalance charges.

3. **Signed Forecast Bias**:
   $$\text{Bias} = \frac{1}{n} \sum_{i=1}^{n} (F_i - A_i)$$
   Positive indicates overforecasting ($F > A$); negative indicates underforecasting ($F < A$).

4. **Weighted Absolute Percentage Error (WAPE)**:
   $$\text{WAPE} = \frac{\sum_{i=1}^{n} |F_i - A_i|}{\sum_{i=1}^{n} A_i} \times 100\%$$
   Scale-independent volumetric error percentage. Undefined if $\sum A_i = 0$.

5. **Decision Cutoff Methodology**:
   For delivery interval $T$ on calendar day $D$, the decision deadline in UK civil time (`Europe/London`) is:
   $$\text{Deadline} = \text{combine}(D - 1\text{ day}, \text{CutoffTime}, \text{tz}=\text{"Europe/London"})$$
   Converted to UTC instant $T_{\text{cutoff}}$. Eligible forecast records must satisfy:
   $$R.\text{publishTime} \le T_{\text{cutoff}} \quad \text{and} \quad R.\text{startTime} = T$$
   The eligible forecast with the latest `publishTime` is selected.

---

## Repository Structure

```text
reint-wind-forecast/
├── .dockerignore                     # Docker build exclusion rules
├── .gitignore                        # Git exclusion rules (venv, node_modules, raw data)
├── docker-compose.yml                # Multi-container orchestration
├── Procfile                          # Heroku / containerless runner
├── render.yaml                       # Render blueprint definition
├── requirements.txt                  # Root Python requirements for serverless deployment
├── vercel.json                       # Vercel deployment configuration
├── api/
│   └── index.py                      # Vercel Serverless ASGI entry point
├── backend/
│   ├── Dockerfile                    # Production Python 3.12-slim image
│   ├── Procfile                      # Backend-specific procfile
│   ├── pyproject.toml                # Pytest configuration
│   ├── requirements.txt              # Backend dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI REST API & CORS middleware
│   │   └── services/
│   │       ├── analysis.py           # Cutoff logic, O(1) indexed lookup, metrics
│   │       └── data_store.py         # JSON storage loader
│   ├── data/
│   │   ├── processed/                # Committed historical dataset (2.5 MB)
│   │   │   ├── actuals.json          # 1,488 normalized outturns
│   │   │   ├── forecasts.json        # 17,904 normalized forecasts
│   │   │   └── manifest.json         # Complete audit trail & resolution metadata
│   │   └── raw/                      # Ignored raw Elexon API dumps
│   ├── scripts/
│   │   └── fetch_january_data.py     # Live Elexon API extraction & normalization
│   └── tests/
│       ├── test_analysis.py          # Metric calculations & cutoff unit tests
│       ├── test_api_endpoints.py     # FastAPI TestClient integration suite
│       └── test_ingestion.py         # Deduplication & fuel-filtering tests
├── docs/
│   ├── assumptions.md                # Detailed operational & methodology assumptions
│   └── demo_script.md                # 9-minute executive & technical video script
└── frontend/
    ├── Dockerfile                    # Node.js development container
    ├── package.json                  # React 18, Recharts, Vite dependencies
    ├── tsconfig.json                 # TypeScript strict configuration (ES2022)
    ├── vite.config.ts                # Vite build configuration
    └── src/
        ├── App.tsx                   # Main dashboard layout & state management
        ├── api.ts                    # Dedicated API client with AbortController
        ├── types.ts                  # TypeScript data contracts & interfaces
        ├── style.css                 # Glassmorphic dark design system
        ├── components/
        │   ├── Controls.tsx          # Date navigation & cutoff selector
        │   ├── CoverageBanner.tsx    # Source resolution & data audit banner
        │   ├── ErrorChart.tsx        # Signed error visualization (Over/Under)
        │   ├── GenerationChart.tsx   # Forecast vs actual line chart
        │   ├── IntervalTable.tsx     # Settlement detail table & CSV export
        │   └── KpiCards.tsx          # Executive metric cards
        └── utils/
            └── formatters.ts         # Megawatts, percentages, and London time formatters
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.11+ (Python 3.12 recommended)
- Node.js 20+ (with npm)
- Git

### 1. Clone & Set Up Python Backend

```bash
# Clone the repository
git clone <REPO_URL>
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
pytest
```

### 2. Start the Backend API

From `backend/`:
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`
- Metadata Endpoint: `http://localhost:8000/api/meta`
- Analysis Endpoint: `http://localhost:8000/api/analysis?cutoff=12:00`

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

A multi-container setup is pre-configured with volume mounts and internal networking:

```bash
# Start backend on :8000 and frontend on :5173
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

---

## Testing & Quality Assurance

### Backend Unit & Integration Tests (15 tests)
```bash
cd backend
pytest -v
```
Verified test coverage includes:
- Forecast selection with strict decision cutoff enforcement.
- Day-ahead cutoff calculation across London civil time boundaries.
- Metric precision (MAE, RMSE, Bias, WAPE, and null-on-zero WAPE handling).
- Non-distortion of metrics when encountering unforecasted `:30` intervals.
- Full FastAPI integration suite for `/api/health`, `/api/meta`, and `/api/analysis`.
- Elexon stream deduplication and fuelType filtering (`fuelType=WIND`).
- Serverless entry point resolution (`api/index.py`).

### Frontend Typechecking & Production Build
```bash
cd frontend
npm test          # Runs TypeScript strict typecheck (tsc -b)
npm run build     # Compiles production bundle with Vite
```

---

## Deployment Architecture

The application is engineered for zero-friction cloud deployment:

### Recommended: Vercel (Frontend & Serverless API)
The repository contains a native `vercel.json` and `api/index.py` ASGI bridge.
1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. Vercel automatically detects the build command (`cd frontend && npm install && npm run build`) and publishes `frontend/dist`.
3. Requests to `/api/*` are handled by the Python serverless function at `api/index.py`.
4. The committed `backend/data/processed` dataset is bundled directly into the function, requiring no external database or external network access during runtime.

### Alternative: Dual Deployment (Vercel + Render/Heroku)
- **Backend on Render / Heroku**: Use the included `render.yaml` or `backend/Procfile`. Set `CORS_ORIGINS` to the frontend URL.
- **Frontend on Vercel**: Set `VITE_API_BASE_URL` to the public backend HTTPS URL.

---

## AI Tools Disclosure

In accordance with hiring challenge submission guidelines, AI assistance was utilized transparently during development:
- **Tools**: Google DeepMind Antigravity AI coding assistant powered by Gemini 3.8 Flash.
- **Scope of Use**: Pair-programming for Windows environment diagnosis, initial boilerplate scaffolding, Recharts styling refinement, algorithmic $O(1)$ indexing optimization, and drafting test coverage cases.
- **Engineering Governance**: All code logic, timezone arithmetic, Elexon BMRS API parameters, data audit calculations, and technical documentation were thoroughly inspected, tested, and validated against genuine live market data.

---

## Data Attribution & Licensing

Contains Balancing Mechanism Reporting Service (BMRS) data © Elexon Limited copyright and database right.
Data retrieved via the official [Elexon Insights API](https://bmrs.elexon.co.uk/api-documentation).
Licensed under the [MIT License](LICENSE).

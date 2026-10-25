# REint Wind Forecast Intelligence: 9-Minute Video Demonstration Script

This script is structured into two equal sections of approximately 4.5 minutes each:
- **Part 1: Customer & Business Presentation (~4.5 min)** — Focused on procurement strategy, imbalance risk, decision cutoff, and genuine backtest performance.
- **Part 2: Technical Architecture & Engineering Review (~4.5 min)** — Focused on data pipelines, timezone handling, $O(1)$ indexing, FastAPI, React components, Docker, and testing.

All metrics, numbers, and dates in this script reflect genuine, verified January 2026 Elexon data.

---

## PART 1: Customer & Commercial Presentation (~4.5 Minutes)
**Target Audience**: Head of Power Procurement, Day-Ahead Power Traders, and Risk Analysts at a UK Electricity Utility.

### [00:00 – 00:45] Introduction & The Procurement Problem
- **Visual**: Camera on presenter, then transition to screen share of the REint Wind Forecast Intelligence dashboard at `http://localhost:5173`.
- **Presenter**:
  > "Hello, everyone. Today I'm presenting the REint Wind Forecast Intelligence platform, built specifically for a UK electricity utility's day-ahead power procurement desk.
  >
  > In the Great Britain power market, utilities face a critical commercial challenge every day. Prior to day-ahead market gate closure, our procurement desk must decide exactly how much power to buy or sell to balance our customer demand against intermittent renewable generation.
  >
  > If we overforecast wind generation, we under-procure conventional power, leaving us short in settlement and forced to buy power at the volatile System Buy Price. If we underforecast, we buy too much and spill power at the discount System Sell Price. 
  >
  > Most backtesting tools give an unrealistically optimistic view because they look at whatever forecast happened to be published last, often using forecasts published *after* the commercial trading deadline. 
  >
  > The platform I’m presenting today solves this by asking one fundamental question: **What did the forecast actually say *before* we had to make the trade?**"

### [00:45 – 01:45] Executive KPI Summary & Core Metrics
- **Visual**: Zoom in on the five executive KPI cards at the top of the dashboard. Point to MAE, RMSE, Signed Bias, WAPE, and Coverage.
- **Presenter**:
  > "Let’s look at the executive KPIs for January 2026 under the standard Day-Ahead 12:00 UK decision cutoff.
  >
  > Across all 744 hourly delivery intervals in January, our backtest reveals:
  > - **Mean Absolute Error (MAE)**: **2,002.9 Megawatts**. This represents the average magnitude of our forecast miss for each delivery interval.
  > - **Root Mean Squared Error (RMSE)**: **2,470.1 Megawatts**. By penalizing larger deviations quadratically, RMSE gives our risk managers visibility into the tail risk of severe grid imbalances.
  > - **Signed Forecast Bias**: **+1,805.9 Megawatts**. This is one of our most critical commercial insights: the GB national wind forecast exhibited a persistent, positive bias throughout January 2026. The forecast consistently predicted *more* wind than the transmission grid actually generated. Knowing this enables our procurement desk to apply a strategic de-biasing adjustment to avoid being caught systematically short.
  > - **WAPE (Weighted Absolute Percentage Error)**: **17.30%**. Volumetrically, total forecast error was roughly 17% of total actual outturn.
  > - **Forecast Delivery Coverage**: **744 out of 744 hourly delivery intervals** matched, providing 100% complete hourly coverage."

### [01:45 – 02:45] Exploring the Interactive Charts (Generation & Error Profile)
- **Visual**: Scroll to the Half-Hourly Generation Line Chart. Hover over the peaks on January 1st and January 2nd, demonstrating tooltips.
- **Presenter**:
  > "Moving to our visual analytics:
  >
  > In the **Half-Hourly Generation Chart**, the blue curve shows real, transmission-connected outturn generation from Elexon's `FUELHH` stream. The green markers display the exact forecast available as of the noon cutoff on the day prior to delivery, retrieved from Elexon's `WINDFOR` stream.
  >
  > Notice what happens when I hover over January 1st at 12:00:
  > The actual generation was **13,678 MW**, while our eligible forecast was **14,560 MW**. The tooltip transparently shows that this forecast was published on December 31st at 10:30 UK time—strictly before our 12:00 cutoff.
  >
  > Below, our **Error Profile Chart** color-codes every settlement period:
  > - Coral bars indicate **overforecasting** where forecast exceeded actual generation (+MW).
  > - Cyan bars indicate **underforecasting** where generation exceeded expectations (−MW).
  >
  > This allows our traders to immediately see intra-day error clusters—for example, a morning ramp overforecast followed by an evening lull."

### [02:45 – 03:45] The Decision Cutoff in Action
- **Visual**: Click the "Decision Cutoff" dropdown in the controls panel. Switch the cutoff from `12:00 UK` to `08:00 UK` and observe the live recalculation.
- **Presenter**:
  > "Now let's demonstrate the decision cutoff control.
  >
  > What if our trading strategy required us to finalize our volume commitment at **08:00 in the morning** rather than noon?
  >
  > As I change the cutoff to 08:00, the backtest recalculates across all 18,000 forecast publications:
  > - Our MAE increases from **2,002.9 MW** to **2,127.5 MW**—a performance penalty of **124.6 MW**.
  > - Our WAPE increases from **17.30%** to **18.37%**.
  >
  > This immediately quantifies the financial value of market agility: delaying our final procurement commitment to noon allows National Grid ESO's updated 10:30 forecast run to be incorporated, saving our desk over 120 MW of average imbalance exposure per hour."

### [03:45 – 04:30] Data Transparency & Honest Resolution Audit
- **Visual**: Highlight the Coverage Banner at the top of the page and the Interval Detail Table below.
- **Presenter**:
  > "Before concluding the commercial overview, I want to emphasize our data integrity standards.
  >
  > In January 2026, there are 1,488 half-hourly calendar intervals. Actual outturns (`FUELHH`) cover all 1,488 intervals with 100% completeness. However, National Grid ESO's `WINDFOR` dataset publishes forecasts strictly on an **hourly cadence** at the top of the hour (`:00`). It does not publish `:30` forecasts.
  >
  > Rather than fabricating fictional forecasts through mathematical interpolation, our platform reports this limitation transparently. In our interval detail table, all 744 hourly delivery points are verified matched pairs, while the alternating half-hour intervals are clearly flagged as unmatched `:30` intervals.
  >
  > Finally, any trader or auditor can export the full month or individual daily observations directly to CSV with one click.
  >
  > That concludes our commercial overview. Now let's dive into the technical architecture."

---

## PART 2: Technical Architecture & Engineering Review (~4.5 Minutes)
**Target Audience**: Senior Technical Evaluators, Lead Software Engineers, and Data Platform Architects.

### [04:30 – 05:30] End-to-End System Architecture
- **Visual**: Show the repository structure in VS Code and briefly show `backend/app/main.py` and `frontend/src/App.tsx`.
- **Presenter**:
  > "Welcome to the technical review. Let's look at the system architecture.
  >
  > The platform is built as a clean, decoupled full-stack application:
  > - **Backend**: Built with Python 3.12 and FastAPI. It exposes high-performance REST endpoints for health checks, dataset metadata, and parameter-driven backtesting.
  > - **Frontend**: A modern Single Page Application built with React 18, TypeScript 5.7, and Vite 6, using Recharts for vector-rendered data visualizations and a bespoke glassmorphic dark theme.
  > - **Data Ingestion**: A robust batch ingestion script in `backend/scripts/fetch_january_data.py` that interfaces with the live Elexon BMRS Insights API.
  > - **Deployment Readiness**: Containerized with multi-stage Dockerfiles, Docker Compose, and configured for serverless deployment on Vercel via `api/index.py` and `vercel.json`."

### [05:30 – 06:30] Elexon Ingestion & Timezone Engineering
- **Visual**: Open `backend/scripts/fetch_january_data.py` and `backend/app/services/analysis.py`.
- **Presenter**:
  > "Let's examine how data is fetched and processed.
  >
  > In `fetch_january_data.py`, we pull daily streams from Elexon's API:
  > 1. `FUELHH`: Filtered strictly by `fuelType=WIND`. If Elexon omits `startTime`, we deterministically reconstruct the half-hour timestamp from `settlementDate` and `settlementPeriod`. In January, Great Britain operates on GMT, so Period 1 begins exactly at midnight.
  > 2. `WINDFOR`: We query across publication windows from December 31st through February 1st, capturing 18,688 raw records and normalizing them into 17,904 unique `(startTime, publishTime)` pairs.
  >
  > A crucial engineering requirement is **strict timezone handling**:
  > In `analysis.py`, the decision cutoff must be evaluated in Great Britain civil time (`Europe/London`). The function `decision_cutoff()` takes the delivery date, subtracts one day, sets the cutoff time in London timezone, and converts the resulting instant into UTC. All temporal comparisons are performed strictly in UTC instants, preventing Daylight Saving or offset bugs."

### [06:30 – 07:30] Algorithmic Optimization: O(1) Indexed Lookup
- **Visual**: Show `backend/app/main.py` lines 78–88 and explain the dictionary mapping.
- **Presenter**:
  > "During initial benchmarking, we identified a performance bottleneck.
  >
  > If you iterate through all 1,488 half-hour intervals and scan a flat list of 18,000 forecast rows, the backend performs over **26 million string-to-datetime parsings** per request, causing endpoint latency to exceed 10 seconds.
  >
  > We re-architected `select_forecast_for_interval()` to use dictionary-based start-time indexing:
  > ```python
  > forecast_map: dict[str, list[dict]] = {}
  > for row in forecasts:
  >     forecast_map.setdefault(row['startTime'], []).append(row)
  > ```
  > Each half-hour interval now performs an $O(1)$ dictionary lookup containing only the ~24 candidate forecasts for that specific hour.
  >
  > This algorithmic optimization reduced API latency from **12,000 ms to under 20 ms**—a 600x performance improvement that enables instant dashboard responsiveness when changing cutoffs."

### [07:30 – 08:30] Testing Suite & Docker Verification
- **Visual**: Open the terminal, run `pytest` in `backend/`, and then run `npm test` and `npm run build` in `frontend/`.
- **Presenter**:
  > "Let's run our test suites in real time.
  >
  > First, in the backend:
  > Running `pytest -v` executes 15 comprehensive unit and integration tests in **0.6 seconds**:
  > - We test forecast selection across cutoff boundaries.
  > - We verify that unforecasted `:30` intervals are safely excluded without distorting MAE, RMSE, or WAPE.
  > - We verify FastAPI endpoints using `TestClient` for `/api/health`, `/api/meta`, and `/api/analysis`.
  > - We test our Vercel serverless entry point `api/index.py`.
  >
  > Second, in the frontend:
  > Running `npm test` executes strict TypeScript typechecking (`tsc -b`) with zero errors.
  > Running `npm run build` generates an optimized production bundle in under 3 seconds.
  >
  > For containerization, we provide:
  > - `backend/Dockerfile` with Python 3.12-slim and `.dockerignore` boundaries.
  > - `frontend/Dockerfile` with Node 20-alpine.
  > - `docker-compose.yml` validated via `docker compose config`."

### [08:30 – 09:00] Deployment & Conclusion
- **Visual**: Show `vercel.json`, `render.yaml`, and git log in the terminal.
- **Presenter**:
  > "Finally, let's look at deployment.
  >
  > The repository includes complete deployment manifests:
  > - A root `vercel.json` and `api/index.py` for deploying as a serverless ASGI application.
  > - A `render.yaml` blueprint for dual-service containerless deployment.
  > - The processed historical datasets are bundled directly in `backend/data/processed/`, ensuring the deployed application runs instantly with zero external database dependencies.
  >
  > Our Git repository is strictly managed using conventional commits, with clean checkpoints for backend setup, data ingestion, dashboard features, and deployment configurations.
  >
  > Thank you for your time. The REint Wind Forecast Intelligence platform is fully verified, tested, and ready for production."

---

## Recording Checklist & Video Production Guide

### Pre-Recording Setup:
1. **Live Browser Tabs**:
   - **Tab 1 (Primary)**: Live Production App: `https://reint-wind-forecast-lyart.vercel.app` (or local fallback `http://localhost:5173`).
   - **Tab 2**: Public GitHub Repository: `https://github.com/sinjaa18/reint-wind-x74q`.
   - **Tab 3**: Live API Metadata: `https://reint-wind-forecast-lyart.vercel.app/api/meta`.
2. **Terminal Preparation**:
   - Open PowerShell or terminal in project root `C:\Users\SINTU\Desktop\Projects\reint-wind-forecast`.
   - Pre-clear screen (`clear`).
   - Ready commands:
     - `.\backend\.venv\Scripts\python.exe -m pytest backend\tests -v`
     - `cd frontend && npm test && npm run build && cd ..`
3. **Screen & Audio Setup**:
   - Resolution: 1920x1080 (1080p).
   - Audio: Clear USB microphone or headset.
   - Recording tool: OBS Studio, Loom, Windows Game Bar (Win+Alt+R), or Zoom local recording.

### Live Screen Actions Timeline:
| Timestamp | Target Screen | Actions to Perform |
|---|---|---|
| **00:00 – 00:45** | Browser (Dashboard) | Introduce the commercial challenge of day-ahead power procurement and imbalance risk. |
| **00:45 – 01:45** | Browser (KPI Cards) | Point to MAE (2,003 MW), RMSE (2,470 MW), Bias (+1,806 MW), WAPE (17.30%), and Coverage (744/744). Highlight positive overforecasting bias. |
| **01:45 – 02:45** | Browser (Charts) | Hover over Jan 1 peak on Generation Line Chart to show forecast publish time tooltip. Scroll down to Error Profile Chart to show positive (coral) and negative (cyan) error clusters. |
| **02:45 – 03:45** | Browser (Controls) | Switch Cutoff dropdown from **12:00 UK** to **08:00 UK**. Show MAE increasing to 2,127 MW (+124.6 MW risk penalty). |
| **03:45 – 04:30** | Browser (Table) | Highlight Data Coverage banner (744 hourly vs 1,488 half-hourly actuals). Filter table, show `:30` unforecasted intervals, click **Export CSV**. |
| **04:30 – 05:30** | VS Code / Editor | Show project architecture (`backend/app/main.py`, `frontend/src/App.tsx`, `vercel.json`). |
| **05:30 – 06:30** | VS Code | Open `backend/scripts/fetch_january_data.py` (Elexon streams) and `analysis.py` (`decision_cutoff()` London timezone logic). |
| **06:30 – 07:30** | VS Code | Show `backend/app/main.py` lines 78–88 explaining the $O(1)$ dictionary lookup optimization (12,000ms -> 20ms). |
| **07:30 – 08:30** | Terminal | Run `pytest backend\tests -v` (15 passing tests) and `cd frontend && npm test && npm run build`. |
| **08:30 – 09:00** | Browser (GitHub/Vercel) | Show GitHub repository (`https://github.com/sinjaa18/reint-wind-x74q`) and conclusion. |

### Post-Recording YouTube Upload:
1. Export the MP4 video (ensure total runtime is **under 10 minutes**, ideally 8:30–9:30).
2. Go to [YouTube Studio](https://studio.youtube.com).
3. Upload video with Title: `REint Wind Forecast Intelligence - Technical & Commercial Demonstration`.
4. Set Visibility to **Unlisted** (anyone with the link can view, but not indexed publicly).
5. Copy the unlisted URL and add it to `README.md` and the challenge submission form.

# Assumptions and scope

## Fixed scope from the challenge

- Customer: a UK electricity utility's day-ahead power procurement team.
- Geography: national Great Britain wind generation, using Elexon data only.
- Actual generation source: `FUELHH`, filtered to `fuelType=WIND`.
- Forecast source: `WINDFOR`, retaining forecast publication time and delivery time.
- Delivery period: 1 January 2026 through 31 January 2026 inclusive.
- Frontend: React. Backend: Python. The app must use Docker and be deployed.
- Deliverables: public anonymous-name GitHub repository, README, deployment URL, and a YouTube demo no longer than 10 minutes with customer and technical sections.

## Explicit implementation assumptions (verify / explain in demo)

1. **Decision cutoff:** default 12:00 Europe/London on the previous calendar day. The brief does not give an exact time. Keep this configurable and label it as an assumption.
2. **Timestamp comparison:** parse source date-times and compare instants in UTC. Compute the cutoff in `Europe/London` first, then convert to UTC.
3. **Forecast eligibility:** for a delivery interval, ignore any forecast published after the configured cutoff. Select the latest eligible `publishTime` for the same `startTime`.
4. **Actual revisions:** if the source contains multiple actual rows for the same delivery interval, retain the latest available published actual based on `publishTime` and document that choice.
5. **Missing records:** do not interpolate or synthesize missing source records in the primary accuracy metrics. Report expected, observed, and matched intervals.
6. **Metrics:** signed error = forecast minus actual; MAE, RMSE, signed bias, and WAPE are computed over matched forecast/actual intervals. WAPE is undefined when the sum of actual generation is zero.
7. **Half-hourly calendar and forecast resolution:** 1,488 is the nominal half-hourly interval count for January 2026 (31 × 48). Real Elexon outturn data (`FUELHH`, `fuelType=WIND`) covers all 1,488 intervals (100% complete). However, Elexon's `WINDFOR` forecast stream natively publishes forecasts on an **hourly cadence** (at `:00`). There are no half-hourly (`:30`) forecast records in `WINDFOR`. Consequently, exactly 744 intervals (all hourly delivery points in January) have forecast records (100% hourly coverage), while the remaining 744 half-hourly intervals have no forecast. Following core scope discipline, we never fabricate or interpolate synthetic forecasts; the application reports this limitation transparently.
8. **Scope discipline:** do not add demand forecasts, prices, additional fuel types, or automated procurement recommendations to the core MVP.

## Verified live data audit results

The live Elexon BMRS API ingestion was executed and verified:
- `FUELHH` (WIND): 1,488 records retrieved across all 31 days (0 missing intervals, 100% delivery coverage).
- `WINDFOR`: 18,688 forecast records retrieved covering publications from 2025-12-31T00:00:00Z through 2026-02-01T00:00:00Z (17,904 unique `startTime` and `publishTime` pairs).
- All 744 hourly delivery intervals in January 2026 have valid day-ahead forecasts under the standard 12:00 cutoff.
- Processed JSON datasets are committed to the repository for reproducible, standalone deployment in Docker and cloud environments without external network dependencies during startup.

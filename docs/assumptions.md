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
7. **Half-hourly calendar:** 1,488 is the nominal interval count for January 2026 (31 × 48). It is a comparison baseline, not a guarantee of source completeness.
8. **Scope discipline:** do not add demand forecasts, prices, additional fuel types, or automated procurement recommendations to the core MVP.

## Known limitation

The execution environment used to create this scaffold could not resolve external DNS to call the live Elexon API. The ingestion script is built against the current published parameter definitions, but a local run with network access is required to verify live response availability and actual returned record coverage. No live API results are claimed in this repository.

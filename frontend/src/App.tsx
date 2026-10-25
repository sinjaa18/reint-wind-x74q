import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAnalysis, fetchMetadata } from './api';
import { Controls } from './components/Controls';
import { CoverageBanner } from './components/CoverageBanner';
import { ErrorChart } from './components/ErrorChart';
import { GenerationChart } from './components/GenerationChart';
import { IntervalTable } from './components/IntervalTable';
import { KpiCards } from './components/KpiCards';
import type { AnalysisResponse, MetaResponse } from './types';
import { dateKey } from './utils/formatters';

export default function App() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [cutoff, setCutoff] = useState('12:00');
  const [selectedDate, setSelectedDate] = useState('2026-01-01');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback((cutoffTime: string) => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchMetadata(controller.signal).catch(() => null),
      fetchAnalysis(cutoffTime, controller.signal),
    ])
      .then(([metaData, analysisData]) => {
        if (metaData) setMeta(metaData);
        setAnalysis(analysisData);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to connect to backend service.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const abort = loadData(cutoff);
    return () => {
      abort();
    };
  }, [cutoff, loadData]);

  const allObservations = useMemo(() => analysis?.observations ?? [], [analysis]);

  const dayRows = useMemo(() => {
    return allObservations.filter((row) => dateKey(row.startTime) === selectedDate);
  }, [allObservations, selectedDate]);

  const metrics = analysis?.metrics;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">R</div>
        <div>
          <p className="eyebrow">REINT ENERGY INTELLIGENCE</p>
          <h1>Wind Forecast Intelligence Platform</h1>
        </div>
        <div className="topbar-meta">
          <span className="badge-live">LIVE BACKTEST</span>
          <span className="period">JANUARY 2026</span>
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">DAY-AHEAD PROCUREMENT & SETTLEMENT RISK · GREAT BRITAIN</p>
        <h2>
          Know what the forecast said
          <br />
          before the decision.
        </h2>
        <p className="summary">
          Auditable day-ahead wind power evaluation for GB electricity procurement. Every forecast is selected strictly
          by publication timestamp on or before the trading cutoff, matched against verified Elexon settlement outturns.
        </p>
      </section>

      <Controls
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cutoff={cutoff}
        onCutoffChange={setCutoff}
        loading={loading}
        onRefresh={() => loadData(cutoff)}
      />

      {error && (
        <div className="notice warning" role="alert">
          <div className="notice-icon">⚠️</div>
          <div>
            <strong>Backend Service Unavailable:</strong>
            <span> {error}</span>
          </div>
        </div>
      )}

      {loading && !analysis && (
        <div className="notice" role="status">
          <div className="notice-icon">⏳</div>
          <div>
            <strong>Connecting to Analysis Engine…</strong>
            <span>Evaluating Elexon FUELHH outturns and WINDFOR day-ahead forecast streams.</span>
          </div>
        </div>
      )}

      <CoverageBanner manifest={analysis?.dataManifest ?? meta?.manifest} matchedCount={metrics?.sampleSize ?? 0} />

      <KpiCards metrics={metrics} hourlyTotal={744} />

      <GenerationChart
        observations={dayRows}
        selectedDate={selectedDate}
        loading={loading}
      />

      <ErrorChart observations={dayRows} />

      <IntervalTable
        observations={dayRows}
        allMonthObservations={allObservations}
        selectedDate={selectedDate}
      />

      <footer className="footer">
        <div className="footer-sources">
          <span>Sources: Elexon BMRS datasets <code>FUELHH (fuelType=WIND)</code> and <code>WINDFOR</code></span>
          <span>Contains BMRS data © Elexon Limited copyright and database right</span>
        </div>
        <div className="footer-cutoffs">
          <span>Active Cutoff: {cutoff} Europe/London (D−1)</span>
          <span>Verified Evaluation Period: 2026-01-01 to 2026-01-31</span>
        </div>
      </footer>
    </main>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

type Observation = {
  startTime: string;
  forecastPublishTime: string | null;
  forecastGeneration: number | null;
  actualGeneration: number | null;
  error: number | null;
};
type Metrics = {
  sampleSize: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  wape: number | null;
  expectedIntervals: number;
  actualIntervals: number;
  forecastIntervals: number;
  matchedIntervals: number;
  coveragePercent: number;
};
type Analysis = { month: string; cutoff: string; metrics: Metrics; observations: Observation[] };
type Meta = {
  month: string;
  expectedIntervals: number;
  dataLoaded: boolean;
  actualRows: number;
  forecastRows: number;
  defaultCutoff: string;
};

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
const fmt = (value: number | null, digits = 1) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const mw = (value: number | null) => value == null ? '—' : `${fmt(value)} MW`;
const dateKey = (iso: string) => { const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso)); const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''; return `${part('year')}-${part('month')}-${part('day')}`; };
const intervalLabel = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const fullTime = (iso: string | null) => iso ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : 'No eligible forecast';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try { const body = await response.json(); message = body.detail ?? message; } catch { /* response may not be JSON */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [cutoff, setCutoff] = useState('12:00');
  const [selectedDate, setSelectedDate] = useState('2026-01-01');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getJson<Meta>('/api/meta').then(setMeta).catch(() => setMeta(null)); }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    getJson<Analysis>(`/api/analysis?cutoff=${encodeURIComponent(cutoff)}`)
      .then((data) => { if (!cancelled) setAnalysis(data); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load analysis.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cutoff]);

  const dayRows = useMemo(() => (analysis?.observations ?? []).filter((row) => dateKey(row.startTime) === selectedDate), [analysis, selectedDate]);
  const exportCsv = () => {
    const headers = ['startTimeUTC', 'forecastPublishTimeUTC', 'forecastGenerationMW', 'actualGenerationMW', 'errorForecastMinusActualMW'];
    const lines = [headers.join(','), ...dayRows.map((r) => [r.startTime, r.forecastPublishTime ?? '', r.forecastGeneration ?? '', r.actualGeneration ?? '', r.error ?? ''].map((x) => `"${String(x).replaceAll('"', '""')}"`).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `wind-forecast-${selectedDate}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const m = analysis?.metrics;
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">R</div>
        <div><p className="eyebrow">ENERGY INTELLIGENCE</p><h1>Wind forecast intelligence</h1></div>
        <span className="period">JAN 2026</span>
      </header>
      <section className="intro">
        <p className="eyebrow">DAY-AHEAD PROCUREMENT · GREAT BRITAIN</p>
        <h2>Know what the forecast said<br />before the decision.</h2>
        <p className="summary">Compare the wind generation forecast available at decision time with actual generation. Every selected forecast preserves its publication timestamp.</p>
      </section>
      <section className="controls">
        <label>Delivery date<input type="date" min="2026-01-01" max="2026-01-31" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></label>
        <label>Decision cutoff (UK time)<select value={cutoff} onChange={(e) => setCutoff(e.target.value)}>{['08:00','10:00','12:00','16:00','18:00','20:00','23:00'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <div className="scope-label"><span>Analysis scope</span><strong>National wind · 30-minute intervals</strong></div>
      </section>
      {error && <div className="notice warning"><strong>Analysis unavailable</strong><span>{error}. Run the data-ingestion script from the backend directory and make sure FastAPI is running.</span></div>}
      {loading && !analysis && <div className="notice"><strong>Loading analysis…</strong><span>Connecting to the Python API.</span></div>}
      {meta && !meta.dataLoaded && !error && <div className="notice"><strong>Data ingestion is the first milestone.</strong><span>No results are fabricated. Load January 2026 Elexon data to populate the charts.</span></div>}
      <section className="kpis">
        <MetricCard label="Mean absolute error" value={mw(m?.mae ?? null)} note="Average size of misses" />
        <MetricCard label="Forecast bias" value={mw(m?.bias ?? null)} note="Positive = overforecast" />
        <MetricCard label="Root mean squared error" value={mw(m?.rmse ?? null)} note="Penalizes larger misses" />
        <MetricCard label="Matched intervals" value={m ? `${m.matchedIntervals.toLocaleString()} / ${m.expectedIntervals.toLocaleString()}` : '—'} note={m ? `${fmt(m.coveragePercent, 2)}% coverage` : 'Usable forecast + actual pairs'} />
      </section>
      <section className="panel">
        <div className="panel-head"><div><p className="eyebrow">HALF-HOURLY GENERATION</p><h3>Forecast vs actual</h3></div><span className="tag">MW · {selectedDate}</span></div>
        <div className="chart-wrap">
          {dayRows.length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={dayRows} margin={{ top: 10, right: 14, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#27374b" strokeDasharray="3 3" />
            <XAxis dataKey="startTime" tickFormatter={intervalLabel} minTickGap={32} tick={{ fill: '#8798b0', fontSize: 10 }} />
            <YAxis width={58} tick={{ fill: '#8798b0', fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString('en-GB')} />
            <Tooltip labelFormatter={(v) => fullTime(String(v))} formatter={(v) => [`${fmt(Number(v))} MW`]} contentStyle={{ background: '#101a29', border: '1px solid #34445a', borderRadius: 8, color: '#e9eef8' }} />
            <Legend />
            <Line type="monotone" dataKey="forecastGeneration" name="Forecast at cutoff" stroke="#a6f2d1" strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="actualGeneration" name="Actual generation" stroke="#8caeff" strokeWidth={2} dot={false} connectNulls={false} />
          </LineChart></ResponsiveContainer> : <div className="empty-chart"><div className="chart-icon">↗</div><strong>{loading ? 'Loading data…' : 'No intervals available for this date'}</strong><span>The chart will use only observations returned by the Elexon ingestion pipeline.</span></div>}
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><div><p className="eyebrow">ERROR PROFILE</p><h3>Forecast error by interval</h3></div><span className="tag">Forecast − actual</span></div>
        <div className="chart-wrap short-chart">
          {dayRows.some((r) => r.error != null) ? <ResponsiveContainer width="100%" height="100%"><BarChart data={dayRows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#27374b" strokeDasharray="3 3" />
            <XAxis dataKey="startTime" tickFormatter={intervalLabel} minTickGap={32} tick={{ fill: '#8798b0', fontSize: 10 }} />
            <YAxis width={58} tick={{ fill: '#8798b0', fontSize: 10 }} />
            <ReferenceLine y={0} stroke="#65768e" />
            <Tooltip labelFormatter={(v) => fullTime(String(v))} formatter={(v) => [`${fmt(Number(v))} MW`, 'Error']} contentStyle={{ background: '#101a29', border: '1px solid #34445a', borderRadius: 8, color: '#e9eef8' }} />
            <Bar dataKey="error" name="Forecast − actual" fill="#f4b86a" maxBarSize={14} />
          </BarChart></ResponsiveContainer> : <div className="empty-chart compact"><strong>No matched intervals to plot</strong><span>Missing observations are not treated as zero errors.</span></div>}
        </div>
      </section>
      <section className="panel table-panel">
        <div className="panel-head"><div><p className="eyebrow">AUDITABLE OBSERVATIONS</p><h3>Interval detail</h3><p className="muted">{dayRows.length} half-hour intervals · timestamps displayed in Europe/London</p></div><button className="secondary-button" onClick={exportCsv} disabled={!dayRows.length}>Export CSV</button></div>
        <div className="table-scroll"><table><thead><tr><th>Delivery interval</th><th>Forecast published</th><th>Forecast (MW)</th><th>Actual (MW)</th><th>Error (MW)</th></tr></thead><tbody>
          {dayRows.map((row) => <tr key={row.startTime}><td>{fullTime(row.startTime)}</td><td>{fullTime(row.forecastPublishTime)}</td><td>{fmt(row.forecastGeneration)}</td><td>{fmt(row.actualGeneration)}</td><td className={row.error == null ? '' : row.error > 0 ? 'positive' : row.error < 0 ? 'negative' : ''}>{fmt(row.error)}</td></tr>)}
          {!dayRows.length && <tr><td colSpan={5} className="no-data">No data available. Check ingestion output and the API status.</td></tr>}
        </tbody></table></div>
      </section>
      <footer><span>Source: Elexon BMRS · FUELHH + WINDFOR</span><span>Default cutoff assumption: 12:00 UK time on the previous day</span></footer>
    </main>
  );
}

import React from 'react';
import type { Metrics } from '../types';
import { mw, pct } from '../utils/formatters';

interface KpiCardsProps {
  metrics: Metrics | null | undefined;
  hourlyTotal?: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics, hourlyTotal = 744 }) => {
  const biasValue = metrics?.bias;
  let biasColorClass = '';
  let biasAnnotation = 'Zero bias';
  if (biasValue != null) {
    if (biasValue > 0) {
      biasColorClass = 'kpi-over';
      biasAnnotation = '+ Overforecasting (+MW)';
    } else if (biasValue < 0) {
      biasColorClass = 'kpi-under';
      biasAnnotation = '− Underforecasting (−MW)';
    }
  }

  const hourlyCoveragePct = metrics ? Math.round((metrics.matchedIntervals / hourlyTotal) * 100) : null;

  return (
    <section className="kpis" aria-label="Executive Key Performance Indicators">
      <article className="kpi" tabIndex={0} aria-label={`Mean Absolute Error: ${mw(metrics?.mae)}`}>
        <div className="kpi-header">
          <span className="kpi-label">Mean Absolute Error (MAE)</span>
          <span className="kpi-pill">Magnitude</span>
        </div>
        <strong className="kpi-value">{mw(metrics?.mae)}</strong>
        <small className="kpi-note">Average magnitude of forecast misses across matched intervals</small>
      </article>

      <article className="kpi" tabIndex={0} aria-label={`Root Mean Squared Error: ${mw(metrics?.rmse)}`}>
        <div className="kpi-header">
          <span className="kpi-label">Root Mean Squared Error</span>
          <span className="kpi-pill">Volatility</span>
        </div>
        <strong className="kpi-value">{mw(metrics?.rmse)}</strong>
        <small className="kpi-note">Quadratic loss penalizing severe forecast deviations</small>
      </article>

      <article className={`kpi ${biasColorClass}`} tabIndex={0} aria-label={`Signed Forecast Bias: ${mw(metrics?.bias)}`}>
        <div className="kpi-header">
          <span className="kpi-label">Signed Forecast Bias</span>
          <span className={`kpi-pill ${biasColorClass ? 'pill-active' : ''}`}>Directional</span>
        </div>
        <strong className="kpi-value">
          {biasValue != null && biasValue > 0 ? `+${mw(biasValue)}` : mw(biasValue)}
        </strong>
        <small className="kpi-note">{biasAnnotation}</small>
      </article>

      <article className="kpi" tabIndex={0} aria-label={`Weighted Absolute Percentage Error: ${pct(metrics?.wape)}`}>
        <div className="kpi-header">
          <span className="kpi-label">WAPE Error Ratio</span>
          <span className="kpi-pill">Normalized</span>
        </div>
        <strong className="kpi-value">{pct(metrics?.wape)}</strong>
        <small className="kpi-note">Total absolute error divided by total actual wind outturn</small>
      </article>

      <article className="kpi kpi-highlight" tabIndex={0} aria-label={`Data Coverage: ${metrics ? `${metrics.matchedIntervals} of ${hourlyTotal} hourly intervals` : 'No data'}`}>
        <div className="kpi-header">
          <span className="kpi-label">Forecast Delivery Coverage</span>
          <span className="kpi-pill pill-success">Elexon Stream</span>
        </div>
        <strong className="kpi-value">
          {metrics ? `${metrics.matchedIntervals.toLocaleString()} / ${hourlyTotal.toLocaleString()}` : '—'}
        </strong>
        <small className="kpi-note">
          {hourlyCoveragePct != null
            ? `${hourlyCoveragePct}% of hourly delivery intervals (744/744 native)`
            : 'Usable forecast + actual observation pairs'}
        </small>
      </article>
    </section>
  );
};

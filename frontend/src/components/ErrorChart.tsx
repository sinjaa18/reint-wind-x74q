import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Observation } from '../types';
import { fmt, fullTime, intervalLabel } from '../utils/formatters';

interface ErrorChartProps {
  observations: Observation[];
}

export const ErrorChart: React.FC<ErrorChartProps> = ({ observations }) => {
  const matched = observations.filter((r) => r.error != null);
  const hasMatched = matched.length > 0;

  return (
    <section className="panel" aria-labelledby="error-chart-heading">
      <div className="panel-head">
        <div>
          <p className="eyebrow">ERROR PROFILE</p>
          <h3 id="error-chart-heading">Signed Forecast Error by Delivery Interval</h3>
          <p className="muted">
            Signed error = Forecast − Actual MW (Coral: Overforecasting, Cyan: Underforecasting)
          </p>
        </div>
        <div className="error-legend-badges">
          <span className="badge-legend badge-over">
            <span className="badge-swatch swatch-over" /> Overforecast (+MW)
          </span>
          <span className="badge-legend badge-under">
            <span className="badge-swatch swatch-under" /> Underforecast (−MW)
          </span>
        </div>
      </div>

      <div className="chart-wrap short-chart" style={{ height: 260 }}>
        {hasMatched ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={observations}
              margin={{ top: 10, right: 18, bottom: 6, left: 10 }}
            >
              <CartesianGrid stroke="#223145" strokeDasharray="3 3" />
              <XAxis
                dataKey="startTime"
                tickFormatter={intervalLabel}
                minTickGap={28}
                tick={{ fill: '#8da2be', fontSize: 11 }}
                stroke="#2a3d56"
              />
              <YAxis
                width={65}
                tick={{ fill: '#8da2be', fontSize: 11 }}
                stroke="#2a3d56"
                unit=" MW"
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as Observation;
                  if (item.error == null) return null;
                  const isOver = item.error > 0;
                  return (
                    <div className="chart-tooltip">
                      <div className="tooltip-title">{fullTime(item.startTime)}</div>
                      <div className="tooltip-row">
                        <span className={`dot ${isOver ? 'dot-over' : 'dot-under'}`} />
                        <span className="label">
                          {isOver ? 'Overforecast Error:' : 'Underforecast Error:'}
                        </span>
                        <strong className={`value ${isOver ? 'text-over' : 'text-under'}`}>
                          {item.error > 0 ? `+${fmt(item.error)}` : fmt(item.error)} MW
                        </strong>
                      </div>
                      <div className="tooltip-sub">
                        Forecast: {fmt(item.forecastGeneration)} MW | Actual: {fmt(item.actualGeneration)} MW
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="error" maxBarSize={16} radius={[2, 2, 0, 0]}>
                {observations.map((entry, index) => {
                  const errorVal = entry.error ?? 0;
                  const color = errorVal > 0 ? '#fb7185' : '#38bdf8';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart compact">
            <strong>No matched forecast/actual pairs to plot for this date</strong>
            <span>
              Unmatched intervals (:30 half-hourly) are omitted and not treated as zero errors.
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

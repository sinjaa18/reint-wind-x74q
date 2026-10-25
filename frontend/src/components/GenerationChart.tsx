import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Observation } from '../types';
import { fmt, fullTime, intervalLabel } from '../utils/formatters';

interface GenerationChartProps {
  observations: Observation[];
  selectedDate: string;
  loading: boolean;
}

export const GenerationChart: React.FC<GenerationChartProps> = ({
  observations,
  selectedDate,
  loading,
}) => {
  const hasData = observations.length > 0;

  return (
    <section className="panel" aria-labelledby="gen-chart-heading">
      <div className="panel-head">
        <div>
          <p className="eyebrow">HALF-HOURLY GENERATION</p>
          <h3 id="gen-chart-heading">Forecast vs Actual Generation</h3>
          <p className="muted">
            Transmission-connected wind outturn (`FUELHH`) vs eligible day-ahead forecast (`WINDFOR`)
          </p>
        </div>
        <div className="tag-group">
          <span className="tag">MW Outturn</span>
          <span className="tag tag-highlight">{selectedDate}</span>
        </div>
      </div>

      <div className="chart-wrap" style={{ height: 340 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={observations}
              margin={{ top: 12, right: 18, bottom: 6, left: 10 }}
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
                tickFormatter={(v: number) => v.toLocaleString('en-GB')}
                stroke="#2a3d56"
                unit=" MW"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as Observation;
                  return (
                    <div className="chart-tooltip">
                      <div className="tooltip-title">{fullTime(item.startTime)}</div>
                      <div className="tooltip-row">
                        <span className="dot dot-actual" />
                        <span className="label">Actual Outturn:</span>
                        <strong className="value">{fmt(item.actualGeneration)} MW</strong>
                      </div>
                      <div className="tooltip-row">
                        <span className="dot dot-forecast" />
                        <span className="label">Forecast at Cutoff:</span>
                        <strong className="value">
                          {item.forecastGeneration != null ? `${fmt(item.forecastGeneration)} MW` : 'No forecast published'}
                        </strong>
                      </div>
                      {item.forecastPublishTime && (
                        <div className="tooltip-sub">
                          Published: {fullTime(item.forecastPublishTime)}
                        </div>
                      )}
                      {item.forecastGeneration == null && (
                        <div className="tooltip-sub tooltip-missing">
                          (WINDFOR stream is hourly; :30 intervals have no forecast)
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10 }}
              />
              <Line
                type="monotone"
                dataKey="actualGeneration"
                name="Actual Generation"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecastGeneration"
                name="Forecast at Cutoff"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">
            <div className="chart-icon">📈</div>
            <strong>{loading ? 'Retrieving Elexon observations…' : 'No observations found for this date'}</strong>
            <span>Verified observations from FUELHH and WINDFOR will appear here.</span>
          </div>
        )}
      </div>
    </section>
  );
};

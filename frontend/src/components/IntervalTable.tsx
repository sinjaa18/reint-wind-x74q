import React, { useState } from 'react';
import type { Observation } from '../types';
import { fmt, fullTime } from '../utils/formatters';

interface IntervalTableProps {
  observations: Observation[];
  allMonthObservations: Observation[];
  selectedDate: string;
}

export const IntervalTable: React.FC<IntervalTableProps> = ({
  observations,
  allMonthObservations,
  selectedDate,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'matched' | 'unmatched'>('all');

  const filtered = observations.filter((row) => {
    if (filterMode === 'matched') return row.error != null;
    if (filterMode === 'unmatched') return row.error == null;
    return true;
  });

  const exportCsv = (dataset: Observation[], filename: string) => {
    const headers = [
      'deliveryTimeUK',
      'deliveryTimeUTC',
      'forecastPublishTimeUK',
      'forecastPublishTimeUTC',
      'forecastGenerationMW',
      'actualGenerationMW',
      'signedErrorMW',
      'status',
    ];

    const lines = [
      headers.join(','),
      ...dataset.map((r) => {
        const status = r.error != null ? 'MATCHED' : r.forecastGeneration == null ? 'MISSING_FORECAST_HOURLY' : 'MISSING_ACTUAL';
        return [
          fullTime(r.startTime),
          r.startTime,
          r.forecastPublishTime ? fullTime(r.forecastPublishTime) : 'N/A',
          r.forecastPublishTime ?? '',
          r.forecastGeneration ?? '',
          r.actualGeneration ?? '',
          r.error ?? '',
          status,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      }),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel table-panel" aria-labelledby="table-heading">
      <div className="panel-head">
        <div>
          <p className="eyebrow">AUDITABLE OBSERVATIONS</p>
          <h3 id="table-heading">Settlement Interval Detail Table</h3>
          <p className="muted">
            {filtered.length} half-hour intervals shown for {selectedDate} (Timestamps in Europe/London)
          </p>
        </div>
        <div className="table-actions">
          <div className="filter-pills" role="radiogroup" aria-label="Filter intervals">
            <button
              type="button"
              className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All ({observations.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filterMode === 'matched' ? 'active' : ''}`}
              onClick={() => setFilterMode('matched')}
            >
              Matched ({observations.filter((r) => r.error != null).length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filterMode === 'unmatched' ? 'active' : ''}`}
              onClick={() => setFilterMode('unmatched')}
            >
              Unmatched ({observations.filter((r) => r.error == null).length})
            </button>
          </div>

          <div className="export-buttons">
            <button
              type="button"
              className="secondary-button"
              onClick={() => exportCsv(filtered, `wind-forecast-${selectedDate}.csv`)}
              disabled={!filtered.length}
            >
              Export Day CSV
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => exportCsv(allMonthObservations, `wind-forecast-january-2026-full.csv`)}
              disabled={!allMonthObservations.length}
            >
              Export Full Month CSV ({allMonthObservations.length})
            </button>
          </div>
        </div>
      </div>

      <div className="table-scroll" tabIndex={0} aria-label="Interval observation data table">
        <table>
          <thead>
            <tr>
              <th scope="col">Delivery Interval (UK)</th>
              <th scope="col">Forecast Published (UK)</th>
              <th scope="col" className="text-right">Forecast (MW)</th>
              <th scope="col" className="text-right">Actual Outturn (MW)</th>
              <th scope="col" className="text-right">Signed Error (MW)</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const isMatched = row.error != null;
              const errorClass = row.error == null ? '' : row.error > 0 ? 'text-over' : row.error < 0 ? 'text-under' : '';
              return (
                <tr key={row.startTime}>
                  <td>
                    <strong>{fullTime(row.startTime)}</strong>
                    <span className="utc-sub">{row.startTime}</span>
                  </td>
                  <td>
                    {row.forecastPublishTime ? (
                      <>
                        <span>{fullTime(row.forecastPublishTime)}</span>
                        <span className="utc-sub">{row.forecastPublishTime}</span>
                      </>
                    ) : (
                      <span className="no-forecast-tag">No eligible forecast</span>
                    )}
                  </td>
                  <td className="text-right">{fmt(row.forecastGeneration)}</td>
                  <td className="text-right">{fmt(row.actualGeneration)}</td>
                  <td className={`text-right ${errorClass}`}>
                    {row.error != null ? (row.error > 0 ? `+${fmt(row.error)}` : fmt(row.error)) : '—'}
                  </td>
                  <td>
                    {isMatched ? (
                      <span className="status-badge badge-matched">Matched Pair</span>
                    ) : (
                      <span className="status-badge badge-missing">Unmatched (:30 Interval)</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="no-data">
                  No observation intervals match the current filter selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

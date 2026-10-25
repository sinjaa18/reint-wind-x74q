import React from 'react';

interface ControlsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  cutoff: string;
  onCutoffChange: (cutoff: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

const CUTOFF_OPTIONS = [
  { value: '08:00', label: '08:00 UK (Early Morning Procurement)' },
  { value: '10:00', label: '10:00 UK (Pre-Gate Procurement)' },
  { value: '12:00', label: '12:00 UK (Standard Day-Ahead Cutoff)' },
  { value: '14:00', label: '14:00 UK (Afternoon Gate Closure)' },
  { value: '16:00', label: '16:00 UK (Late Afternoon Revision)' },
  { value: '18:00', label: '18:00 UK (Evening Balancing Window)' },
  { value: '20:00', label: '20:00 UK (Night Revision)' },
  { value: '23:00', label: '23:00 UK (Final Pre-Midnight Outturn)' },
];

export const Controls: React.FC<ControlsProps> = ({
  selectedDate,
  onDateChange,
  cutoff,
  onCutoffChange,
  loading,
  onRefresh,
}) => {
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setUTCDate(current.getUTCDate() - 1);
    const prev = current.toISOString().slice(0, 10);
    if (prev >= '2026-01-01') {
      onDateChange(prev);
    }
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setUTCDate(current.getUTCDate() + 1);
    const next = current.toISOString().slice(0, 10);
    if (next <= '2026-01-31') {
      onDateChange(next);
    }
  };

  return (
    <section className="controls" aria-label="Forecast Evaluation Controls">
      <div className="control-group">
        <label htmlFor="delivery-date-input">
          Delivery Date (January 2026)
        </label>
        <div className="date-nav">
          <button
            type="button"
            className="date-nav-btn"
            onClick={handlePrevDay}
            disabled={selectedDate <= '2026-01-01'}
            aria-label="Previous day"
          >
            ◀
          </button>
          <input
            id="delivery-date-input"
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="date-nav-btn"
            onClick={handleNextDay}
            disabled={selectedDate >= '2026-01-31'}
            aria-label="Next day"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="decision-cutoff-select">
          Decision Cutoff (Europe/London, Day-Ahead)
        </label>
        <select
          id="decision-cutoff-select"
          value={cutoff}
          onChange={(e) => onCutoffChange(e.target.value)}
          disabled={loading}
        >
          {CUTOFF_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-actions">
        <button
          type="button"
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh forecast evaluation"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Analysis'}
        </button>
      </div>

      <div className="scope-label">
        <span>Analysis Scope</span>
        <strong>GB National Wind · 30-Min Intervals</strong>
      </div>
    </section>
  );
};

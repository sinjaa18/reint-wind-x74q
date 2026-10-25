export const fmt = (value: number | null | undefined, digits = 1): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const mw = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${fmt(value)} MW`;
};

export const pct = (value: number | null | undefined, digits = 1): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${fmt(value, digits)}%`;
};

export const dateKey = (iso: string): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const intervalLabel = (iso: string): string => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
};

export const fullTime = (iso: string | null | undefined): string => {
  if (!iso) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
};

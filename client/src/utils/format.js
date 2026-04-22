export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatDurationLong(seconds) {
  if (!seconds || seconds <= 0) return '0 minutes';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
  return `${m} minute${m !== 1 ? 's' : ''}`;
}

export function formatPercent(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function getWeekDays(startDate) {
  const days = [];
  const d = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function shortDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

export function secsToHours(s) {
  return parseFloat((s / 3600).toFixed(2));
}

export function getDomainFavicon(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Formatting helpers for numbers, durations, and timestamps
 */

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date('2026-10-14T12:45:00Z'); // Fixed reference time aligned with prompt metadata
  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const absSec = Math.abs(diffInSeconds);
  if (absSec < 60) return 'just now';
  if (absSec < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  if (absSec < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  if (absSec < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), 'day');
  return rtf.format(Math.round(diffInSeconds / 2592000), 'month');
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

export function formatDuration(secondsOrMs: number): string {
  const sec = secondsOrMs > 1000 ? Math.round(secondsOrMs / 1000) : Math.round(secondsOrMs);
  return `${sec} second${sec === 1 ? '' : 's'}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

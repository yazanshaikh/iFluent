/**
 * Format a UTC ISO timestamp in Philippines time (Asia/Manila, UTC+8).
 * Shown under the Jordan time so Filipino teachers see their local time.
 * (Manila is 5 hours ahead of Jordan.)
 */
export function fmtManila(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  });
}

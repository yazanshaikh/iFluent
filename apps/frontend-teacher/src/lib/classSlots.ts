/** Group class times are shown in Jordan time. */

export function formatClassTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Amman',
  });
}

/**
 * Group class times are picked as a day plus a time slot, in Jordan time.
 * Slots run 9:00 AM → 1:00 AM; 12:00–1:00 AM belong to the night of the
 * chosen day, so they are sent with the next calendar date.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export const CLASS_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 23; h++) slots.push(`${pad(h)}:00`, `${pad(h)}:30`);
  slots.push('00:00', '00:30', '01:00');
  return slots;
})();

export const isNightSlot = (slot: string) => Number(slot.slice(0, 2)) < 9;

export interface ClassTime {
  day:  string; // YYYY-MM-DD, the evening the class belongs to
  slot: string; // HH:mm
}

/** Today's date in Jordan (before 2 AM it still counts as the previous evening). */
export function jordanToday(): { day: string; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get('hour') % 24;
  const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day') - (hour < 2 ? 1 : 0)));
  return { day: date.toISOString().slice(0, 10), minute: (hour < 2 ? 24 * 60 : 0) + hour * 60 + get('minute') };
}

export const slotMinute = (slot: string) =>
  (isNightSlot(slot) ? 24 * 60 : 0) + Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3, 5));

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD HH:mm:00" in Jordan time for the API. */
export const toApiTime = ({ day, slot }: ClassTime) =>
  `${isNightSlot(slot) ? addDays(day, 1) : day} ${slot}:00`;

/** Back from a stored ISO time. */
export function fromIso(iso: string): ClassTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const slot = `${pad(get('hour') % 24)}:${pad(get('minute'))}`;
  const day  = `${get('year')}-${pad(get('month'))}-${pad(get('day'))}`;
  return { day: isNightSlot(slot) ? addDays(day, -1) : day, slot };
}

export function formatSlot(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

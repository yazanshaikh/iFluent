/**
 * Booking calendar shared by the session and assessment booking screens.
 *
 * Booking runs 09:00 → 01:00 Jordan time. Slots after midnight are listed
 * under the evening they follow, so they are sent with the next calendar date.
 * The backend enforces the same hours and window.
 */

const BOOKING_DAYS = 14;
const FIRST_DAYTIME_HOUR = 9;
const MIN_LEAD_MINUTES = 15;

const pad = (n: number) => String(n).padStart(2, '0');

export const BOOKING_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = FIRST_DAYTIME_HOUR; h <= 23; h++) {
    slots.push(`${pad(h)}:00`, `${pad(h)}:30`);
  }
  slots.push('00:00', '00:30', '01:00');
  return slots;
})();

export const AFTER_MIDNIGHT_NOTE =
  'المواعيد من 12:00 ص إلى 1:00 ص تقع بعد منتصف ليل اليوم المحدد.';

const slotHour = (slot: string) => Number(slot.split(':')[0]);

export const isAfterMidnight = (slot: string) => slotHour(slot) < FIRST_DAYTIME_HOUR;

function jordanNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'), month: get('month'), day: get('day'),
    hour: get('hour') % 24, minute: get('minute'),
  };
}

/** Before 2 AM it is still the previous evening's booking day. */
export function getBookingDays(): Date[] {
  const now = jordanNow();
  const first = now.day - (now.hour < 2 ? 1 : 0);
  return Array.from({ length: BOOKING_DAYS }, (_, i) => new Date(now.year, now.month - 1, first + i));
}

/** Today's remaining slots: at least 15 minutes from now. */
export function getTodaySlots(): string[] {
  const now = jordanNow();
  const nowMinute = (now.hour < 2 ? 24 * 60 : 0) + now.hour * 60 + now.minute;
  return BOOKING_SLOTS.filter((slot) => {
    const [h, m] = slot.split(':').map(Number);
    const slotMinute = (isAfterMidnight(slot) ? 24 * 60 : 0) + h * 60 + m;
    return slotMinute > nowMinute + MIN_LEAD_MINUTES;
  });
}

/** "YYYY-MM-DD HH:MM:00" in Jordan time, as the booking API expects. */
export function toScheduledAt(day: Date, slot: string): string {
  const date = new Date(day.getFullYear(), day.getMonth(), day.getDate() + (isAfterMidnight(slot) ? 1 : 0));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${slot}:00`;
}

/** "13:30" → "1:30 م" */
export function formatSlot12h(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'ص' : 'م'}`;
}

const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** "2026-11-15T18:00:00Z" → "الأحد 15 نوفمبر — 9:00 م" (Jordan time) */
export function formatJordanDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const weekday = new Date(Date.UTC(get('year'), get('month') - 1, get('day'))).getUTCDay();
  return `${AR_DAYS[weekday]} ${get('day')} ${AR_MONTHS[get('month') - 1]} — ${formatSlot12h(`${get('hour') % 24}:${pad(get('minute'))}`)}`;
}

/** The Jordan calendar date of an ISO time, "YYYY-MM-DD". */
export function jordanDayKey(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return `${get('year')}-${pad(get('month'))}-${pad(get('day'))}`;
}

/** "2026-11-12" → "الخميس 12 نوفمبر" */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${AR_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${AR_MONTHS[m - 1]}`;
}

/**
 * Validate + normalise a phone number to strict E.164 (e.g. +9627xxxxxxxx).
 * Returns null if the number is not a valid international format — so we never
 * hit Firebase (and waste SMS) with junk input. Shared by the phone + verify
 * (resend) screens so both apply the exact same validation.
 */
export function toE164(input: string): string | null {
  let s = (input || '').replace(/[\s\-()]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);   // 00962… → +962…
  if (!s.startsWith('+')) {
    s = '+962' + s.replace(/^0/, '');             // local 07… → +9627…
  }
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;  // E.164: + then 8–15 digits
}

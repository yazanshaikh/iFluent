/**
 * "Package ending soon" — why the backend flagged a student's package.
 * Each key is set only when that measure triggered the flag
 * (thresholds live in backend Subscription::NEAR_END_*).
 */
export interface EndingSoonReason {
  /** Lessons left (0 = none left). */
  lessons_left: number | null;
  /** Calendar days until the end date; negative = the end date has passed. */
  days_left: number | null;
}

function lessonsLabel(n: number): string {
  if (n <= 0) return 'لم تتبقَّ حصص';
  if (n === 1) return 'تبقّت حصة واحدة';
  if (n === 2) return 'تبقّت حصتان';
  if (n <= 10) return `تبقّت ${n} حصص`;
  return `تبقّت ${n} حصة`;
}

function daysLabel(n: number): string {
  if (n < 0) return 'انتهت مدة الباقة';
  if (n === 0) return 'تنتهي اليوم';
  if (n === 1) return 'تنتهي غداً';
  if (n === 2) return 'تنتهي خلال يومين';
  if (n <= 10) return `تنتهي خلال ${n} أيام`;
  return `تنتهي خلال ${n} يوماً`;
}

/** The reasons as short phrases, e.g. ["تبقّت حصتان", "تنتهي خلال 5 أيام"]. */
export function endingSoonReasons(r: EndingSoonReason | null | undefined): string[] {
  if (!r) return [];
  const out: string[] = [];
  if (r.lessons_left !== null && r.lessons_left !== undefined) out.push(lessonsLabel(r.lessons_left));
  if (r.days_left !== null && r.days_left !== undefined) out.push(daysLabel(r.days_left));
  return out;
}

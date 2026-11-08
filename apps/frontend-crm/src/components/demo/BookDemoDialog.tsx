import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/api/leads';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ChevronLeft, Loader2 } from 'lucide-react';

/* ── Time slots 9:00 AM → 12:00 AM (midnight), every 30 min ──
   Each slot is identified by MINUTES from midnight (540 … 1440). Using minutes
   (not a 0–24 hour) avoids the old bug where the midnight slot collapsed to
   hour 0 and was therefore always treated as "past" today. 1440 = 24:00 = the
   midnight that ENDS the day (booked as 00:00 the next day). */
const SLOT_START_MIN = 9 * 60;    // 9:00 AM
const SLOT_END_MIN   = 24 * 60;   // 12:00 AM (midnight), inclusive
const SLOT_STEP_MIN  = 30;        // half-hour gaps

const TIME_SLOTS = Array.from(
  { length: Math.floor((SLOT_END_MIN - SLOT_START_MIN) / SLOT_STEP_MIN) + 1 },
  (_, i) => {
    const min    = SLOT_START_MIN + i * SLOT_STEP_MIN;  // 540 … 1440
    const h24    = Math.floor(min / 60) % 24;           // 9 … 23, then 0 at 1440
    const mm     = min % 60;
    const h12    = h24 % 12 === 0 ? 12 : h24 % 12;
    const period = h24 < 12 ? 'ص' : 'م';
    return { min, label: `${h12}:${String(mm).padStart(2, '0')} ${period}` };
  },
);

/**
 * أقل مهلة قبل بداية الحصة تسمح بالحجز من الـ CRM.
 *
 * كان 30 دقيقة، وهذا منع الـ CC من حجز موعد قريب حتى لو كان المعلم جاهزاً.
 * الآن 5 دقائق فقط — تكفي لأن الباك-إند يشترط `after:now`، فحجز موعد مرّ
 * للتو يُرفض بـ 422. المواعيد المعروضة في الجدول لم تتغيّر.
 */
const MIN_BOOKING_LEAD_MIN = 5;

/**
 * YYYY-MM-DD بالتوقيت المحلي.
 *
 * لا تستخدم toISOString() لهذا: هي تُحوِّل إلى UTC، فبين منتصف الليل و‑3 صباحاً
 * بتوقيت الأردن يكون تاريخ UTC هو اليوم السابق — وكانت النتيجة أن "اليوم" يُرسل
 * بتاريخ الأمس، فيرفضه الباك‑إند بـ "must be a date after now".
 */
function localDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** هل الـ slot ما زال قابلاً للحجز؟ */
function isSlotAvailable(min: number, dateMode: 'today' | 'tomorrow' | 'custom'): boolean {
  if (dateMode !== 'today') return true;
  const now = new Date();
  return min >= now.getHours() * 60 + now.getMinutes() + MIN_BOOKING_LEAD_MIN;
}

/**
 * Book an assessment (demo) session for a lead — date/time → notes → success.
 * Shared by the lead profile and the Trial Bookings page.
 */
export function BookDemoDialog({
  leadId, open, onClose, onBooked,
}: {
  leadId:    number;
  open:      boolean;
  onClose:   () => void;
  onBooked?: () => void;
}) {
  const qc = useQueryClient();
  const [bookStep,       setBookStep]       = useState<1 | 2 | 'success'>(1);
  const [bookDateMode,   setBookDateMode]   = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [bookCustomDate, setBookCustomDate] = useState('');
  const [bookMin,        setBookMin]        = useState<number | null>(null);
  const [bookNotes,      setBookNotes]      = useState('');
  const [bookError,      setBookError]      = useState('');

  /* ── Book demo ── */
  const [bookApiError, setBookApiError] = useState<string | null>(null);
  const bookMutation = useMutation({
    mutationFn: (payload: { scheduled_at: string; notes?: string }) =>
      leadsApi.bookDemo(leadId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-demo-requests', leadId] });
      qc.invalidateQueries({ queryKey: ['demo-bookings'] });
      onBooked?.();
      setBookApiError(null);
      setBookStep('success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
        ?.response?.data;
      if (msg?.errors) {
        const firstErr = Object.values(msg.errors).flat()[0];
        setBookApiError(firstErr ?? 'حدث خطأ أثناء الحجز');
      } else {
        setBookApiError(msg?.message ?? 'حدث خطأ أثناء الحجز، حاول مرة أخرى');
      }
    },
  });

  const resetBooking = () => {
    onClose();
    setTimeout(() => {
      setBookStep(1);
      setBookDateMode('today');
      setBookCustomDate('');
      setBookMin(null);
      setBookNotes('');
      setBookError('');
      setBookApiError(null);
    }, 200);
  };

  const handleNext1 = () => {
    if (bookDateMode === 'custom' && !bookCustomDate) { setBookError('الرجاء اختيار تاريخ أولاً'); return; }
    if (bookMin === null) { setBookError('الرجاء اختيار وقت للحصة'); return; }
    if (!isSlotAvailable(bookMin, bookDateMode)) {
      setBookError('هذا الوقت انتهى — اختر وقتاً لاحقاً أو تاريخاً آخر');
      setBookMin(null);
      return;
    }
    setBookError('');
    setBookApiError(null);
    setBookStep(2);
  };

  const handleBookSubmit = () => {
    if (bookMin === null) return;
    const todayStr    = localDateStr(new Date());
    const tomorrowD   = new Date(); tomorrowD.setDate(tomorrowD.getDate() + 1);
    const tomorrowStr = localDateStr(tomorrowD);
    const dateStr     = bookDateMode === 'today' ? todayStr
                      : bookDateMode === 'tomorrow' ? tomorrowStr
                      : bookCustomDate;
    // Build the local datetime from minutes-since-midnight. 1440 (midnight that
    // ENDS the day) rolls over to 00:00 of the next day.
    const dayOffset = Math.floor(bookMin / 1440);
    const h = Math.floor((bookMin % 1440) / 60);
    const m = bookMin % 60;
    const dt = new Date(`${dateStr}T00:00:00`);
    dt.setDate(dt.getDate() + dayOffset);
    dt.setHours(h, m, 0, 0);
    bookMutation.mutate({ scheduled_at: dt.toISOString(), notes: bookNotes || undefined });
  };

  /* ── Booking date helpers ── */
  const bookToday    = new Date();
  const bookTomorrow = new Date(bookToday); bookTomorrow.setDate(bookToday.getDate() + 1);
  const fmtDate      = (d: Date) =>
    d.toLocaleDateString('ar-JO', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetBooking(); }}>
        <DialogContent className="max-w-md" dir="rtl">

          {/* Progress bar */}
          {bookStep !== 'success' && (
            <div className="flex gap-1.5 -mt-1 mb-1">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                    bookStep === s                                           ? 'bg-amber-400' :
                    typeof bookStep === 'number' && s < (bookStep as number) ? 'bg-amber-600' :
                    'bg-border'
                  }`}
                />
              ))}
            </div>
          )}

          {/* ── Step 1: Date + Time ── */}
          {bookStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>متى تريد الحصة؟ 📅</DialogTitle>
                <DialogDescription>اختر اليوم والوقت المناسب للحصة التقييمية</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 overflow-y-auto max-h-[55vh] pr-0.5">
                {/* Date selection */}
                <div className="space-y-2">
                  <Label>اليوم</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['today', 'tomorrow', 'custom'] as const).map((mode) => {
                      const label = mode === 'today' ? 'اليوم' : mode === 'tomorrow' ? 'غداً' : 'تاريخ آخر';
                      const sub   = mode === 'today' ? fmtDate(bookToday) : mode === 'tomorrow' ? fmtDate(bookTomorrow) : null;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => { setBookDateMode(mode); setBookMin(null); setBookError(''); }}
                          className={`rounded-xl border-2 px-2 py-2.5 text-sm font-semibold transition-all text-center ${
                            bookDateMode === mode
                              ? 'border-amber-400 border-b-amber-600 border-b-[3px] bg-amber-50 dark:bg-amber-950/30 text-foreground'
                              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {label}
                          {sub && (
                            <span className="block text-[10px] font-normal mt-0.5 text-muted-foreground">
                              {sub}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {bookDateMode === 'custom' && (
                    <Input
                      type="date" dir="ltr"
                      min={localDateStr(new Date())}
                      value={bookCustomDate}
                      onChange={(e) => { setBookCustomDate(e.target.value); setBookError(''); }}
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Time slots */}
                <div className="space-y-2">
                  <Label>الوقت</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const available = isSlotAvailable(slot.min, bookDateMode);
                      return (
                        <button
                          key={slot.min}
                          type="button"
                          disabled={!available}
                          onClick={() => { setBookMin(slot.min); setBookError(''); }}
                          className={`rounded-xl border-2 py-2 text-sm font-medium transition-all ${
                            !available
                              ? 'border-border/40 bg-muted/20 text-muted-foreground/30 cursor-not-allowed line-through'
                              : bookMin === slot.min
                              ? 'border-amber-400 border-b-amber-600 border-b-[3px] bg-amber-50 dark:bg-amber-950/30 text-foreground font-bold'
                              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                  {bookError && (
                    <p className="text-xs text-destructive">{bookError}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetBooking}>إلغاء</Button>
                <Button onClick={handleNext1} className="gap-1">
                  التالي
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── Step 2: Notes ── */}
          {bookStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>ملاحظات للمعلم 📝</DialogTitle>
                <DialogDescription>أي معلومات تساعد في تحضير الحصة التقييمية (اختياري)</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Textarea
                  autoFocus
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="مثال: العميل مستوى متوسط — يريد التركيز على المحادثة..."
                  rows={4}
                />
                {bookApiError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {bookApiError}
                  </p>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                <Button variant="ghost" onClick={() => setBookStep(1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  رجوع
                </Button>
                <Button onClick={handleBookSubmit} disabled={bookMutation.isPending}>
                  {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
                  ✓ تأكيد الحجز
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── Success screen ── */}
          {bookStep === 'success' && (
            <div className="text-center py-6 space-y-4">
              <p className="text-6xl">🎉</p>
              <div>
                <h3 className="text-xl font-bold">تم الحجز بنجاح!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  سيتلقى المعلم إشعاراً بموعد الحصة التقييمية
                </p>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {([
                  ['✓', 'تم الإرسال'],
                  ['⚡', 'بانتظار تأكيد المعلم'],
                  ['📅', 'الموعد محجوز'],
                ] as const).map(([ico, lbl]) => (
                  <span
                    key={lbl}
                    className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full border text-muted-foreground"
                  >
                    {ico} {lbl}
                  </span>
                ))}
              </div>
              <Button onClick={resetBooking} className="mt-2">
                حسناً 👍
              </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>
  );
}

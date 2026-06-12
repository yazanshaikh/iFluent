import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useQuery, useMutation, useQueryClient,
} from '@tanstack/react-query';
import { leadsApi, type LeadStatus, type UpdateLeadPayload, type Remark } from '@/api/leads';
import { staffApi } from '@/api/staff';
import { checkoutApi, lessonsApi, type InvoiceCreatedResponse } from '@/api/checkout';
import { invoiceFullUrl } from '@/lib/appUrl';
import { useAuthStore } from '@/stores/authStore';
import { STATUS_LABELS, STATUS_VARIANT } from './Leads';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label }    from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowRight, Loader2, Phone, Mail, Calendar, MessageSquarePlus, User, ChevronDown, ChevronLeft, Gem,
  Pencil, Check, X, CalendarClock, UserRoundCog, ShoppingCart, Copy, ExternalLink, UserCheck,
  TrendingUp, BookOpen, Clock, Award,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const ROLE_LABELS: Record<string, string> = { cc: 'CC', ss: 'LP', super_admin: 'مدير' };

// ─── Course stages & lessons ───────────────────────────────────────────────────
const STAGES = [
  { label: 'مرحلة التأسيس',              count: 36 },
  { label: 'مرحلة البناء',                count: 36 },
  { label: 'مرحلة الفهم والتوسع',         count: 60 },
  { label: 'مرحلة الطلاقة',               count: 60 },
  { label: 'مرحلة الطلاقة — فري توكينج',  count: 60 },
] as const;

interface LessonItem { global: number; local: number; stage: number; }

const ALL_LESSONS: LessonItem[] = (() => {
  const out: LessonItem[] = [];
  let g = 1;
  STAGES.forEach((s, si) => {
    for (let l = 1; l <= s.count; l++) out.push({ global: g++, local: l, stage: si });
  });
  return out;
})();

/* ── Demo session status display ── */
const SESSION_STATUS_LABEL: Record<string, string> = {
  // SessionRequest statuses
  pending:   'بانتظار المعلم',
  confirmed: 'مؤكدة',
  rejected:  'مرفوضة',
  cancelled: 'ملغاة',
  expired:   'منتهية',
  // Session statuses (from linked session)
  waiting:   'بانتظار التنفيذ',
  active:    'نشطة الآن',
  completed: 'مكتملة',
};
const SESSION_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning'> = {
  pending:   'secondary',
  confirmed: 'success',
  rejected:  'destructive',
  cancelled: 'outline',
  expired:   'warning',
  waiting:   'secondary',
  active:    'success',
  completed: 'outline',
};

/** Returns detailed label based on attendance_status when session is completed */
function getSessionLabel(status: string, attendanceStatus?: string | null): string {
  if (status === 'completed' || (status === 'expired' && attendanceStatus)) {
    if (attendanceStatus === 'attended')       return '✅ مكتملة';
    if (attendanceStatus === 'absent')         return '😔 غاب الطالب';
    if (attendanceStatus === 'teacher_absent') return '🚫 غاب المعلم';
  }
  return SESSION_STATUS_LABEL[status] ?? status;
}

function getSessionVariant(status: string, attendanceStatus?: string | null): 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning' {
  if (attendanceStatus === 'attended')       return 'success';
  if (attendanceStatus === 'absent')         return 'warning';
  if (attendanceStatus === 'teacher_absent') return 'destructive';
  return SESSION_STATUS_VARIANT[status] ?? 'outline';
}

function RemarksHistory({ remarks, open, onToggle }: { remarks: Remark[]; open: boolean; onToggle: () => void }) {

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <MessageSquarePlus className="h-4 w-4" />
          سجل الملاحظات
          {remarks.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
              {remarks.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="divide-y">
          {remarks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد ملاحظات بعد</p>
          ) : (
            remarks.map((r) => (
              <div key={r.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{r.staff?.name ?? '—'}</span>
                    {r.staff?.role && (
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-mono">
                        {ROLE_LABELS[r.staff.role] ?? r.staff.role.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{r.created_at}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** الحالات التي يختارها الموظف يدوياً — open_sea وsubscriber تتغير نظامياً */
const SELECTABLE_STATUSES: LeadStatus[] = ['new', 'in_progress', 'interested', 'not_interested', 'postponed'];

/* ── Time slots 9 AM → 12 AM (16 slots × 4 cols) ── */
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour   = i + 9;                           // 9 … 24 (00)
  const display = hour === 24 ? 0 : hour;
  const h      = display === 0 ? 12 : display > 12 ? display - 12 : display;
  const period = display < 12 ? 'ص' : 'م';
  return { hour: hour === 24 ? 0 : hour, label: `${h}:00 ${period}` };
});

/** هل الـ slot ما زال قابلاً للحجز؟ (30 دقيقة على الأقل من الآن) */
function isSlotAvailable(hour: number, dateMode: 'today' | 'tomorrow' | 'custom'): boolean {
  if (dateMode !== 'today') return true;
  const now = new Date();
  return hour * 60 >= now.getHours() * 60 + now.getMinutes() + 30;
}

export default function LeadProfilePage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const leadId    = Number(id);
  const user      = useAuthStore((s) => s.user);
  const isAdmin   = user?.role === 'super_admin';

  const [remarkBody,   setRemarkBody]   = useState('');
  const [historyOpen,  setHistoryOpen]  = useState(false);
  const [nameEditing,  setNameEditing]  = useState(false);
  const [nameDraft,    setNameDraft]    = useState('');
  const [ageEditing,   setAgeEditing]   = useState(false);
  const [ageDraft,     setAgeDraft]     = useState('');
  const [statusDraft,  setStatusDraft]  = useState<LeadStatus | null>(null);
  const [statusError,  setStatusError]  = useState<string | null>(null);
  const [remarkError,  setRemarkError]  = useState<string | null>(null);

  /* ── Purchase Course modal state ── */
  const [purchaseOpen,        setPurchaseOpen]        = useState(false);
  const [purchaseLessonsFrom, setPurchaseLessonsFrom] = useState<number | null>(null);
  const [purchaseLessonsTo,   setPurchaseLessonsTo]   = useState<number | null>(null);
  const [purchaseActualPrice, setPurchaseActualPrice] = useState('');
  const [purchaseResult,      setPurchaseResult]      = useState<InvoiceCreatedResponse | null>(null);
  const [purchaseError,       setPurchaseError]       = useState('');
  const [purchaseCopied,      setPurchaseCopied]      = useState(false);

  const [bookingOpen,    setBookingOpen]    = useState(false);
  const [bookStep,       setBookStep]       = useState<1 | 2 | 'success'>(1);
  const [bookDateMode,   setBookDateMode]   = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [bookCustomDate, setBookCustomDate] = useState('');
  const [bookHour,       setBookHour]       = useState<number | null>(null);
  const [bookNotes,      setBookNotes]      = useState('');
  const [bookError,      setBookError]      = useState('');

  /* ── Fetch lead ── */
  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['lead', leadId],
    queryFn:  () => leadsApi.get(leadId),
    enabled:  !!leadId,
  });

  /* ── Fetch demo session history ── */
  const { data: demoHistory } = useQuery({
    queryKey: ['lead-demo-requests', leadId],
    queryFn:  () => leadsApi.getDemoRequests(leadId),
    enabled:  !!leadId,
    staleTime: 30_000,
  });

  /* ── Student progress (same data the student sees in their app) ── */
  const { data: progress } = useQuery({
    queryKey: ['lead-progress', leadId],
    queryFn:  () => leadsApi.getProgress(leadId),
    enabled:  !!leadId,
    staleTime: 30_000,
  });

  /* ── Price per lesson (from site settings) ── */
  const { data: pricePerLesson = 5 } = useQuery({
    queryKey: ['price-per-lesson'],
    queryFn:  checkoutApi.getPricePerLesson,
    staleTime: 300_000,
  });

  /* ── Lesson selector helpers ── */
  const selectedLessonsCount =
    purchaseLessonsFrom !== null && purchaseLessonsTo !== null
      ? purchaseLessonsTo - purchaseLessonsFrom + 1
      : purchaseLessonsFrom !== null ? 1 : 0;

  const isLessonInRange = (g: number) => {
    if (purchaseLessonsFrom === null) return false;
    const to = purchaseLessonsTo ?? purchaseLessonsFrom;
    return g >= purchaseLessonsFrom && g <= to;
  };

  const handleLessonClick = (g: number) => {
    if (purchaseLessonsFrom === null) {
      setPurchaseLessonsFrom(g);
      setPurchaseLessonsTo(null);
      setPurchaseActualPrice('');
    } else if (purchaseLessonsTo === null) {
      if (g === purchaseLessonsFrom) {
        setPurchaseLessonsFrom(null);
      } else if (g > purchaseLessonsFrom) {
        setPurchaseLessonsTo(g);
        const count = g - purchaseLessonsFrom + 1;
        setPurchaseActualPrice(String(count * pricePerLesson));
      } else {
        setPurchaseLessonsFrom(g);
      }
    } else {
      setPurchaseLessonsFrom(g);
      setPurchaseLessonsTo(null);
      setPurchaseActualPrice('');
    }
  };

  /* ── Purchase course mutation ── */
  const purchaseMutation = useMutation({
    mutationFn: () =>
      checkoutApi.purchaseCourse(leadId, {
        lessons_count:   selectedLessonsCount,
        amount_paid:     Number(purchaseActualPrice) || selectedLessonsCount * pricePerLesson,
        // global lesson numbers match DB IDs (lessons seeded sequentially 1-252)
        from_lesson_id:  purchaseLessonsFrom,
        to_lesson_id:    purchaseLessonsTo ?? purchaseLessonsFrom,
      }),
    onSuccess: (data) => {
      setPurchaseResult(data);
      setPurchaseError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPurchaseError(msg || 'حدث خطأ أثناء توليد الفاتورة.');
    },
  });

  const handlePurchaseOpen = () => {
    setPurchaseOpen(true);
    setPurchaseLessonsFrom(null);
    setPurchaseLessonsTo(null);
    setPurchaseActualPrice('');
    setPurchaseResult(null);
    setPurchaseError('');
    setPurchaseCopied(false);
  };

  const handleCopyAlias = (alias: string) => {
    navigator.clipboard.writeText(alias);
    setPurchaseCopied(true);
    setTimeout(() => setPurchaseCopied(false), 2000);
  };

  /* ── Update status ── */
  const statusMutation = useMutation({
    mutationFn: (status: LeadStatus) => leadsApi.update(leadId, { status } as UpdateLeadPayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setStatusDraft(null);
      setStatusError(null);
    },
    onError: () => setStatusError('فشل تحديث الحالة'),
  });

  /* ── Edit name ── */
  const nameMutation = useMutation({
    mutationFn: (name: string) => leadsApi.update(leadId, { name } as UpdateLeadPayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      setNameEditing(false);
    },
  });

  const handleNameSave = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === lead?.name) { setNameEditing(false); return; }
    nameMutation.mutate(trimmed);
  };

  /* ── Edit age ── */
  const ageMutation = useMutation({
    mutationFn: (age: number | null) => leadsApi.update(leadId, { age } as UpdateLeadPayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      setAgeEditing(false);
    },
  });

  const handleAgeSave = () => {
    const val = ageDraft.trim();
    const parsed = val ? Number(val) : null;
    if (val && (isNaN(parsed!) || parsed! < 5 || parsed! > 100)) return;
    if (parsed === (lead?.age ?? null)) { setAgeEditing(false); return; }
    ageMutation.mutate(parsed);
  };

  /* ── Toggle Small Treasury ── */
  const treasuryMutation = useMutation({
    mutationFn: () => leadsApi.toggleSmallTreasure(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['small-treasury'] });
    },
  });

  /* ── Assign lead (admin only) ── */
  const [assignDraft,  setAssignDraft]  = useState<string>('');
  const [assignError,  setAssignError]  = useState<string | null>(null);

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn:  staffApi.list,
    staleTime: 60_000,
    enabled:  isAdmin,
  });

  const assignMutation = useMutation({
    mutationFn: (staffId: number) => leadsApi.assign(leadId, staffId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['new-leads'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setAssignDraft('');
      setAssignError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAssignError(msg ?? 'فشل التعيين');
    },
  });

  const recallMutation = useMutation({
    mutationFn: () => leadsApi.recall(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['new-leads'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setAssignError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAssignError(msg ?? 'فشل السحب');
    },
  });

  /* ── Add remark ── */
  const remarkMutation = useMutation({
    mutationFn: (content: string) => leadsApi.addRemark(leadId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      setRemarkBody('');
      setRemarkError(null);
      setHistoryOpen(true);
    },
    onError: () => setRemarkError('فشل إضافة الملاحظة'),
  });

  /* ── Book demo ── */
  const [bookApiError, setBookApiError] = useState<string | null>(null);
  const bookMutation = useMutation({
    mutationFn: (payload: { scheduled_at: string; notes?: string }) =>
      leadsApi.bookDemo(leadId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-demo-requests', leadId] });
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

  const cancelDemoMutation = useMutation({
    mutationFn: (sessionId: number) => leadsApi.cancelDemo(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-demo-requests', leadId] });
    },
  });

  const [cancelSubOpen,   setCancelSubOpen]   = useState(false);
  const [cancelSubReason, setCancelSubReason] = useState('');

  const cancelSubMutation = useMutation({
    mutationFn: ({ subId, reason }: { subId: number; reason: string }) =>
      leadsApi.cancelSubscription(subId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-demo-requests', leadId] });
      setCancelSubOpen(false);
      setCancelSubReason('');
    },
    onError: (err: any) => alert(err?.response?.data?.message ?? 'تعذر إلغاء الاشتراك'),
  });

  const [changeLessonTarget, setChangeLessonTarget] = useState<number | null>(null);
  const [selectedLessonId,   setSelectedLessonId]   = useState<number | null>(null);

  // Fetch assessment lessons for the picker (only when needed)
  const { data: assessmentLessons = [] } = useQuery({
    queryKey: ['assessment-lessons-crm'],
    queryFn:  () =>
      import('@/api/client').then(m =>
        m.default.get<{ data: { id: number; title: string }[] }>('/crm/assessment-lessons')
          .then(r => r.data.data)
      ),
    enabled:  changeLessonTarget !== null,
    staleTime: 5 * 60_000,
  });

  const changeLessonMutation = useMutation({
    mutationFn: ({ id, lessonId }: { id: number; lessonId: number }) =>
      leadsApi.changeDemoLesson(id, lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-demo-requests', leadId] });
      setChangeLessonTarget(null);
      setSelectedLessonId(null);
    },
    onError: (err: any) => alert(err?.response?.data?.message ?? 'تعذر تغيير الدرس'),
  });

  const resetBooking = () => {
    setBookingOpen(false);
    setTimeout(() => {
      setBookStep(1);
      setBookDateMode('today');
      setBookCustomDate('');
      setBookHour(null);
      setBookNotes('');
      setBookError('');
      setBookApiError(null);
    }, 200);
  };

  const handleNext1 = () => {
    if (bookDateMode === 'custom' && !bookCustomDate) { setBookError('الرجاء اختيار تاريخ أولاً'); return; }
    if (bookHour === null) { setBookError('الرجاء اختيار وقت للحصة'); return; }
    if (!isSlotAvailable(bookHour, bookDateMode)) {
      setBookError('هذا الوقت انتهى — اختر وقتاً لاحقاً أو تاريخاً آخر');
      setBookHour(null);
      return;
    }
    setBookError('');
    setBookApiError(null);
    setBookStep(2);
  };

  const handleBookSubmit = () => {
    if (bookHour === null) return;
    const todayStr    = new Date().toISOString().split('T')[0];
    const tomorrowD   = new Date(); tomorrowD.setDate(tomorrowD.getDate() + 1);
    const tomorrowStr = tomorrowD.toISOString().split('T')[0];
    const dateStr     = bookDateMode === 'today' ? todayStr
                      : bookDateMode === 'tomorrow' ? tomorrowStr
                      : bookCustomDate;
    const dt = new Date(`${dateStr}T${String(bookHour).padStart(2, '0')}:00:00`);
    bookMutation.mutate({ scheduled_at: dt.toISOString(), notes: bookNotes || undefined });
  };

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkBody.trim()) { setRemarkError('الملاحظة لا يمكن أن تكون فارغة'); return; }
    remarkMutation.mutate(remarkBody.trim());
  };

  const handleStatusSave = () => {
    if (!statusDraft || statusDraft === lead?.status) return;
    statusMutation.mutate(statusDraft);
  };

  /* ── Loading / Error ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground">
        <Loader2 className="animate-spin h-6 w-6 ml-2" />
        جارٍ التحميل...
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-3">
        <p className="text-destructive font-medium">لم يتم العثور على العميل</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          العودة للقائمة
        </Button>
      </div>
    );
  }

  const currentStatus = statusDraft ?? lead.status;
  const remarks       = lead.remarks ?? [];

  /* ── Active booking guard ── */
  const activeBooking = demoHistory?.requests.find(
    (r) =>
      (r.status === 'pending' || r.status === 'confirmed') &&
      new Date(r.scheduled_at) > new Date(),
  );
  const bookingBlocked = !!activeBooking;

  /* ── Booking date helpers ── */
  const bookToday    = new Date();
  const bookTomorrow = new Date(bookToday); bookTomorrow.setDate(bookToday.getDate() + 1);
  const fmtDate      = (d: Date) =>
    d.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <>
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 -mr-2">
        <ArrowRight className="h-4 w-4" />
        العودة للقائمة
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            {/* الاسم */}
            {nameEditing ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') setNameEditing(false);
                  }}
                  className="h-8 text-base font-bold w-44"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={handleNameSave} disabled={nameMutation.isPending}>
                  {nameMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setNameEditing(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h1 className="text-xl font-bold">{lead.name}</h1>
                <Button
                  size="icon" variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                  onClick={() => { setNameDraft(lead.name); setNameEditing(true); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* العمر — بجانب الاسم */}
            {ageEditing ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Input
                  autoFocus
                  type="number" min={5} max={100} dir="ltr"
                  value={ageDraft}
                  onChange={(e) => setAgeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAgeSave();
                    if (e.key === 'Escape') setAgeEditing(false);
                  }}
                  placeholder="العمر"
                  className="h-7 text-sm w-24"
                />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" onClick={handleAgeSave} disabled={ageMutation.isPending}>
                  {ageMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => setAgeEditing(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group mt-0.5">
                <span className="text-sm text-muted-foreground">
                  {lead.age ? `${lead.age} سنة` : <span className="text-xs text-muted-foreground/60">العمر غير محدد</span>}
                </span>
                <Button
                  size="icon" variant="ghost"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                  onClick={() => { setAgeDraft(lead.age ? String(lead.age) : ''); setAgeEditing(true); }}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-0.5">
              أُضيف {new Date(lead.created_at).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {lead.status === 'subscriber' ? (
            <div className="flex items-center gap-2">
            {/* Cancel subscription — admin only */}
            {isAdmin && lead.active_subscription && (
              <Button
                size="sm" variant="outline"
                className="text-destructive hover:text-destructive border-red-300 text-xs h-7 px-2"
                onClick={() => { setCancelSubOpen(true); setCancelSubReason(''); }}
              >
                إلغاء الاشتراك
              </Button>
            )}
            <div className="relative group">
              <button
                className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 hover:bg-emerald-100 transition-colors cursor-pointer dark:bg-emerald-950/30 dark:border-emerald-800"
                onClick={() => {}} // triggers group-hover tooltip
              >
                <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="text-sm leading-tight text-right">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">مشتري ◂</span>
                  {lead.converted_by && (
                    <span className="text-emerald-600/80 dark:text-emerald-500 mr-1.5">
                      — بواسطة <span className="font-medium">{lead.converted_by.name}</span>
                    </span>
                  )}
                </div>
              </button>

              {/* Purchase details dropdown */}
              {lead.active_subscription && (
                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block w-72 rounded-xl border bg-white shadow-lg p-4 text-right dark:bg-zinc-900 dark:border-zinc-700">
                  <p className="text-xs font-bold text-emerald-700 mb-3 border-b pb-2">تفاصيل الاشتراك</p>
                  <div className="space-y-2 text-sm">
                    {lead.active_subscription.activated_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الشراء</span>
                        <span className="font-medium">
                          {new Date(lead.active_subscription.activated_at).toLocaleDateString('ar-JO', {
                            day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Amman',
                          })}
                        </span>
                      </div>
                    )}
                    {lead.active_subscription.from_lesson && lead.active_subscription.to_lesson && (
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground shrink-0">الكورس</span>
                        <span className="font-medium">
                          درس {lead.active_subscription.from_lesson.id}
                          <span className="text-muted-foreground mx-1">→</span>
                          درس {lead.active_subscription.to_lesson.id}
                        </span>
                      </div>
                    )}
                    {lead.active_subscription.lessons_count && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">عدد الدروس</span>
                        <span className="font-medium">{lead.active_subscription.lessons_count} درس</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 mt-1">
                      <span className="text-muted-foreground">المبلغ المدفوع</span>
                      <span className="font-bold text-emerald-700">{lead.active_subscription.amount_paid} د.أ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          ) : (
            <Badge variant={STATUS_VARIANT[lead.status]} className="text-sm px-3 py-1">
              {STATUS_LABELS[lead.status]}
            </Badge>
          )}
          <Button
            size="sm"
            variant="default"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            onClick={handlePurchaseOpen}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Purchase Course
          </Button>
          <Button
            size="sm"
            variant={lead.is_small_treasure ? 'default' : 'outline'}
            className={
              lead.is_small_treasure
                ? 'gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0'
                : 'gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50'
            }
            disabled={treasuryMutation.isPending}
            onClick={() => treasuryMutation.mutate()}
            title={lead.is_small_treasure ? 'إزالة من Small Treasury' : 'إضافة لـ Small Treasury'}
          >
            {treasuryMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Gem className="h-3.5 w-3.5" />}
            {lead.is_small_treasure ? 'محمية' : 'Small Treasury'}
          </Button>
        </div>
      </div>

      {/* Student progress — mirrors what the student sees in their app */}
      {progress?.has_account && progress.summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              تقدّم الطالب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall % bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-sky-700">{progress.summary.overall_pct}%</span>
                <span className="text-xs text-muted-foreground">التقدم الكلي</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${progress.summary.overall_pct}%` }} />
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-card p-2.5 text-center">
                <BookOpen className="h-4 w-4 mx-auto mb-1 text-sky-600" />
                <div className="text-sm font-extrabold">{progress.summary.completed_lessons}/{progress.summary.total_lessons}</div>
                <div className="text-[10px] text-muted-foreground">دروس مكتملة</div>
              </div>
              <div className="rounded-lg border bg-card p-2.5 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <div className="text-sm font-extrabold">{String(progress.summary.learning_minutes).slice(0, 4)}</div>
                <div className="text-[10px] text-muted-foreground">دقيقة تعلّم</div>
              </div>
              <div className="rounded-lg border bg-card p-2.5 text-center">
                <Award className="h-4 w-4 mx-auto mb-1 text-violet-600" />
                <div className="text-sm font-extrabold">{progress.summary.earned_badges}/{progress.summary.total_badges}</div>
                <div className="text-[10px] text-muted-foreground">إنجازات</div>
              </div>
            </div>

            {/* Absences */}
            <div className="flex items-center justify-between text-xs border-t pt-2">
              <span className="font-bold text-destructive">{progress.summary.absent_sessions}</span>
              <span className="text-muted-foreground">دروس تغيّب عنها الطالب</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">معلومات التواصل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span dir="ltr" className="text-sm">{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span dir="ltr" className="text-sm">{lead.email}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              آخر تحديث: {new Date(lead.updated_at).toLocaleDateString('ar-SA')}
            </span>
          </div>
          {lead.notes && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Demo Session */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            حصة تقييم المستوى
            {demoHistory && demoHistory.requests.length > 0 && (
              <span className="mr-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
                {demoHistory.requests.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Book button */}
          <div className="space-y-2">
            <Button
              size="sm"
              className="gap-2"
              disabled={bookingBlocked}
              onClick={() => setBookingOpen(true)}
            >
              <CalendarClock className="h-4 w-4" />
              حجز حصة تقييمية
            </Button>
            {bookingBlocked && activeBooking && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                <span className="shrink-0 mt-px">⚠️</span>
                <span>
                  يوجد حجز نشط بتاريخ{' '}
                  <span className="font-semibold">
                    {new Date(activeBooking.scheduled_at).toLocaleDateString('ar-SA', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                    {' — '}
                    {new Date(activeBooking.scheduled_at).toLocaleTimeString('ar-SA', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {' '}— لا يمكن حجز حصة جديدة حتى يبدأ موعدها أو تُلغى.
                </span>
              </p>
            )}
          </div>

          {/* Session history log */}
          {demoHistory && demoHistory.requests.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">سجل الحصص التقييمية</p>
              {demoHistory.requests.map((req) => {
                const d = new Date(req.scheduled_at);
                const isPending  = req.status === 'pending';
                const isExpired  = req.status === 'expired';
                const isConfirmed = req.status === 'confirmed';
                const isDone     = ['completed','expired','cancelled'].includes(req.status);
                const attendanceStatus = req.attendance?.attendance_status ?? null;
                const showAttendance = isDone && req.attendance;
                return (
                  <div
                    key={req.id}
                    className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-2"
                  >
                    {/* Row: date + status + cancel */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-snug">
                          {d.toLocaleDateString('ar-SA', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          <span className="text-muted-foreground font-normal mx-1">—</span>
                          {d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {req.teacher?.name && (
                          <p className="text-xs text-muted-foreground">
                            المعلم: {req.teacher.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={getSessionVariant(req.status, attendanceStatus)}
                          className="text-xs"
                        >
                          {getSessionLabel(req.status, attendanceStatus)}
                        </Badge>
                        {isPending && (
                          <>
                            <Button
                              size="sm" variant="outline"
                              className="text-blue-600 hover:text-blue-700 border-blue-300 text-xs h-6 px-2"
                              onClick={() => { setChangeLessonTarget(req.id); setSelectedLessonId(null); }}
                            >
                              تغيير الدرس
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="text-destructive hover:text-destructive text-xs h-6 px-2"
                              disabled={cancelDemoMutation.isPending}
                              onClick={() => cancelDemoMutation.mutate(req.id)}
                            >
                              {cancelDemoMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : 'إلغاء'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Change lesson inline panel */}
                    {changeLessonTarget === req.id && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-medium">اختر درس التقييم:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {assessmentLessons.length === 0 ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : assessmentLessons.map((l: any) => (
                            <button
                              key={l.id}
                              onClick={() => setSelectedLessonId(l.id)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                selectedLessonId === l.id
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-background border-input hover:border-blue-400'
                              }`}
                            >
                              {l.title}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!selectedLessonId || changeLessonMutation.isPending}
                            onClick={() => changeLessonMutation.mutate({ id: req.id, lessonId: selectedLessonId! })}
                          >
                            {changeLessonMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'حفظ'}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setChangeLessonTarget(null)}>
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Attendance chips — expired or confirmed sessions with session data */}
                    {showAttendance && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground ml-0.5">الحضور:</span>
                        {/* Teacher */}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                          req.attendance!.teacher_joined
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
                            : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                        }`}>
                          {req.attendance!.teacher_joined ? '✓' : '✗'} المعلم
                        </span>
                        {/* Student */}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                          req.attendance!.student_joined
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
                            : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                        }`}>
                          {req.attendance!.student_joined ? '✓' : '✗'} الطالب
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لم يتم حجز حصة تقييم بعد</p>
          )}
        </CardContent>
      </Card>

      {/* ── Assignment Card — admin only ── */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserRoundCog className="h-4 w-4" />
              التعيين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Current assignment */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">معيّنة لـ:</span>
              {lead.assigned_to ? (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-xs">
                    {ROLE_LABELS[lead.assigned_to.role] ?? lead.assigned_to.role.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{lead.assigned_to.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">غير معيّنة — في قائمة المدير</span>
              )}
            </div>

            <Separator />

            {/* Reassign select */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">إعادة التعيين لموظف</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={assignDraft}
                  onValueChange={setAssignDraft}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر موظفاً..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList
                      .filter((s) => s.role === 'cc' || s.role === 'ss')
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <span>{s.name}</span>
                          <span className="mr-1.5 text-muted-foreground text-xs font-mono">
                            ({s.role === 'ss' ? 'LP' : 'CC'})
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!assignDraft || assignMutation.isPending || String(lead.assigned_to?.id) === assignDraft}
                  onClick={() => assignMutation.mutate(Number(assignDraft))}
                >
                  {assignMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : 'تعيين'}
                </Button>
              </div>
            </div>

            {/* Recall to admin pool */}
            {lead.assigned_to && (
              <Button
                size="sm" variant="outline"
                className="text-muted-foreground text-xs"
                disabled={recallMutation.isPending}
                onClick={() => recallMutation.mutate()}
              >
                {recallMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
                  : null}
                سحب للقائمة غير المعيّنة
              </Button>
            )}

            {assignError && (
              <p className="text-xs text-destructive">{assignError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Update Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تحديث الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select
              value={currentStatus}
              onValueChange={(v) => setStatusDraft(v as LeadStatus)}
            >
              <SelectTrigger className="max-w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              disabled={
                statusMutation.isPending ||
                currentStatus === lead.status ||
                !statusDraft
              }
              onClick={handleStatusSave}
            >
              {statusMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : 'حفظ'}
            </Button>
          </div>
          {statusError && (
            <p className="text-sm text-destructive mt-2">{statusError}</p>
          )}
        </CardContent>
      </Card>

      {/* Remarks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            الملاحظات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add remark form */}
          <form onSubmit={handleAddRemark} className="space-y-2">
            <Label htmlFor="remark-body">إضافة ملاحظة</Label>
            <Textarea
              id="remark-body"
              value={remarkBody}
              onChange={(e) => setRemarkBody(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              rows={3}
            />
            {remarkError && (
              <p className="text-sm text-destructive">{remarkError}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={remarkMutation.isPending}>
                {remarkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
                إضافة الملاحظة
              </Button>
            </div>
          </form>

          {/* Collapsible history */}
          <RemarksHistory
            remarks={remarks}
            open={historyOpen}
            onToggle={() => setHistoryOpen((o) => !o)}
          />
        </CardContent>
      </Card>
    </div>

    {/* ── Booking Modal ── */}
    <Dialog open={bookingOpen} onOpenChange={(o) => { if (!o) resetBooking(); }}>
      <DialogContent className="max-w-md">

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
                        onClick={() => { setBookDateMode(mode); setBookHour(null); setBookError(''); }}
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
                    min={new Date().toISOString().split('T')[0]}
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
                    const available = isSlotAvailable(slot.hour, bookDateMode);
                    return (
                      <button
                        key={slot.hour}
                        type="button"
                        disabled={!available}
                        onClick={() => { setBookHour(slot.hour); setBookError(''); }}
                        className={`rounded-xl border-2 py-2 text-sm font-medium transition-all ${
                          !available
                            ? 'border-border/40 bg-muted/20 text-muted-foreground/30 cursor-not-allowed line-through'
                            : bookHour === slot.hour
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

    {/* ── Purchase Course Modal ── */}
    <Dialog open={purchaseOpen} onOpenChange={(o) => { if (!o) { setPurchaseOpen(false); setPurchaseResult(null); } }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            شراء كورس — {lead.name}
          </DialogTitle>
        </DialogHeader>

        {!purchaseResult ? (
          <>
            {/* ── Lesson selector ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>اختر نطاق الدروس</Label>
                <span className="text-xs text-muted-foreground">
                  {purchaseLessonsFrom === null
                    ? 'انقر على درس لتحديد البداية'
                    : purchaseLessonsTo === null
                    ? `من الدرس ${purchaseLessonsFrom} — انقر على نهاية النطاق`
                    : `الدرس ${purchaseLessonsFrom} ← ${purchaseLessonsTo} (${selectedLessonsCount} درس)`}
                </span>
              </div>

              {/* Stage + lesson tree */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-64">
                  {STAGES.map((stage, si) => {
                    const stageLessons = ALL_LESSONS.filter((l) => l.stage === si);
                    const stageStart   = stageLessons[0].global;
                    const stageEnd     = stageLessons[stageLessons.length - 1].global;
                    const stageActive  = purchaseLessonsFrom !== null &&
                      stageStart <= (purchaseLessonsTo ?? purchaseLessonsFrom) &&
                      stageEnd   >= purchaseLessonsFrom;

                    return (
                      <div key={si}>
                        {/* Stage header */}
                        <div className={`px-3 py-1.5 text-xs font-semibold flex items-center justify-between border-b
                          ${stageActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-muted/60 text-muted-foreground'}`}>
                          <span>{stage.label}</span>
                          <span className="font-mono opacity-60">{stageStart}–{stageEnd}</span>
                        </div>
                        {/* Lessons grid */}
                        <div className="grid grid-cols-6 gap-px bg-border p-px">
                          {stageLessons.map((lesson) => {
                            const sel = isLessonInRange(lesson.global);
                            const isFrom = lesson.global === purchaseLessonsFrom;
                            const isTo   = lesson.global === purchaseLessonsTo;
                            return (
                              <button
                                key={lesson.global}
                                type="button"
                                onClick={() => handleLessonClick(lesson.global)}
                                className={`py-1.5 text-xs font-mono transition-colors
                                  ${sel
                                    ? isFrom || isTo
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : 'bg-background hover:bg-muted text-muted-foreground'}`}
                                title={`الدرس ${lesson.global}`}
                              >
                                {lesson.global}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Price bar ── */}
            {selectedLessonsCount > 0 && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedLessonsCount} درس × {pricePerLesson} د.أ
                  </span>
                  <span className="font-bold text-emerald-700">
                    = {selectedLessonsCount * pricePerLesson} د.أ
                  </span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">السعر الفعلي (دينار) — قابل للتعديل</Label>
                  <Input
                    type="number"
                    min={0}
                    dir="ltr"
                    value={purchaseActualPrice}
                    onChange={(e) => setPurchaseActualPrice(e.target.value)}
                    placeholder={String(selectedLessonsCount * pricePerLesson)}
                  />
                </div>
              </div>
            )}

            {purchaseError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {purchaseError}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setPurchaseOpen(false)}>إلغاء</Button>
              <Button
                onClick={() => purchaseMutation.mutate()}
                disabled={
                  purchaseMutation.isPending ||
                  selectedLessonsCount === 0 ||
                  purchaseLessonsTo === null ||
                  !purchaseActualPrice
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {purchaseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
                تأكيد وتوليد الفاتورة
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ── Invoice generated ── */
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center space-y-1">
              <p className="text-emerald-700 font-semibold">تم توليد الفاتورة بنجاح</p>
              <p className="text-sm text-muted-foreground">
                {purchaseResult.lessons_count} درس ({purchaseResult.months_count} شهر) — {purchaseResult.amount_paid} دينار
              </p>
            </div>

            {/* Payment account + copy */}
            <div className="space-y-2">
              <p className="text-sm font-medium">حساب الدفع عبر CliQ:</p>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/40">
                <span className="flex-1 font-mono font-bold text-base">
                  {purchaseResult.payment_account.alias}
                </span>
                <span className="text-xs text-muted-foreground">{purchaseResult.payment_account.cliq_name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopyAlias(purchaseResult!.payment_account.alias)}
                  title="نسخ الاسم المستعار"
                >
                  {purchaseCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Invoice URL */}
            <div className="space-y-1">
              <p className="text-sm font-medium">رابط الفاتورة للعميل:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 break-all">
                  {invoiceFullUrl(purchaseResult.invoice_url)}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => navigator.clipboard.writeText(invoiceFullUrl(purchaseResult!.invoice_url))}
                  title="نسخ الرابط"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <a
                  href={purchaseResult.invoice_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent"
                  title="فتح الفاتورة"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => { setPurchaseOpen(false); setPurchaseResult(null); }}>
                إغلاق
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* ── Cancel Subscription Dialog (admin only) ── */}
    <Dialog open={cancelSubOpen} onOpenChange={setCancelSubOpen}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-destructive">إلغاء الاشتراك</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            سيتم إلغاء الاشتراك النشط وإعادة الطالب إلى حالة "قيد التنفيذ".
            سيتم حفظ السبب في ملاحظات الليدة.
          </p>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">سبب الإلغاء <span className="text-destructive">*</span></Label>
            <Textarea
              id="cancel-reason"
              value={cancelSubReason}
              onChange={e => setCancelSubReason(e.target.value)}
              placeholder="اكتب سبب إلغاء الاشتراك..."
              rows={3}
              className="text-right"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 justify-start">
          <Button
            variant="destructive"
            disabled={cancelSubReason.trim().length < 5 || cancelSubMutation.isPending}
            onClick={() => {
              if (!lead.active_subscription) return;
              cancelSubMutation.mutate({ subId: lead.active_subscription.id, reason: cancelSubReason.trim() });
            }}
          >
            {cancelSubMutation.isPending ? 'جاري الإلغاء…' : 'تأكيد الإلغاء'}
          </Button>
          <Button variant="outline" onClick={() => setCancelSubOpen(false)}>
            تراجع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

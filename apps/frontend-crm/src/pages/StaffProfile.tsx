import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { staffApi, type TeacherBooking } from '@/api/staff';
import { leadsApi, type Lead } from '@/api/leads';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowRight, Loader2, User, Briefcase, Phone, CalendarDays, Undo2, Gem, Star, CalendarClock,
} from 'lucide-react';

/* ── Role labels ── */
const ROLE_LABELS: Record<string, string> = {
  cc:      'CC — مبيعات',
  ss:      'LP — متابعة',
  teacher: 'مدرّس',
};
const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  cc:      'default',
  ss:      'secondary',
  teacher: 'outline',
};

/* ══════════════════════════ Recall Row ══════════════════════════════════ */
interface RecallRowProps {
  lead:     Lead;
  onRecall: (id: number) => void;
  pending:  boolean;
}

function RecallRow({ lead, onRecall, pending }: RecallRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 group">
      {/* Avatar placeholder */}
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate flex items-center gap-1.5">
          {lead.name}
          {lead.is_small_treasure && <Gem className="h-3 w-3 text-amber-500 shrink-0" />}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <Phone className="h-3 w-3 shrink-0" />
          <span dir="ltr" className="font-mono">{lead.phone}</span>
          <span>·</span>
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>
            {new Date(lead.created_at).toLocaleDateString('ar-JO', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Recall button */}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:border-destructive/40"
        disabled={pending}
        onClick={() => onRecall(lead.id)}
      >
        {pending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Undo2 className="h-3 w-3" />}
        سحب
      </Button>
    </div>
  );
}

/* ══════════════════════════ Star Rating Display ══════════════════════════ */
function StarRating({ rating }: { rating: number | null | undefined }) {
  if (rating == null) {
    return <span className="text-sm text-muted-foreground">لا يوجد تقييم بعد</span>;
  }
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= filled ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="text-sm font-medium mr-1">{rating}/5</span>
    </div>
  );
}

/* ══════════════════════════ Main Page ════════════════════════════════════ */
export default function StaffProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const user     = useAuthStore((s) => s.user);
  const staffId  = Number(id);

  const [resetDialogOpen,    setResetDialogOpen]    = useState(false);
  const [commissionInput,    setCommissionInput]    = useState('');
  const [commissionEditing,  setCommissionEditing]  = useState(false);

  /* ── Auth guard — admin only (hooks first) ── */
  const isAdmin = user?.role === 'super_admin';

  /* ── Fetch staff profile ── */
  const {
    data:      staff,
    isLoading: staffLoading,
    isError:   staffError,
  } = useQuery({
    queryKey: ['staff-member', staffId],
    queryFn:  () => staffApi.get(staffId),
    enabled:  isAdmin && !!staffId,
  });

  /* ── Fetch new leads for this staff member (cc/ss only) ── */
  const isTeacher = staff?.role === 'teacher';

  /* ── Fetch upcoming demo bookings for teacher ── */
  const {
    data:      demoBookings,
    isLoading: demoLoading,
  } = useQuery({
    queryKey: ['teacher-demo-bookings', staffId],
    queryFn:  () => staffApi.teacherDemoBookings(staffId),
    enabled:  isAdmin && !!staffId && isTeacher,
    staleTime: 30_000,
  });

  const {
    data:      leadsData,
    isLoading: leadsLoading,
    isError:   leadsError,
  } = useQuery({
    queryKey: ['staff-new-leads', staffId],
    queryFn:  () => leadsApi.list({
      status:      'new',
      assigned_to: staffId,
      per_page:    100,
    }),
    enabled: isAdmin && !!staffId && !isTeacher,
    staleTime: 20_000,
  });

  /* ── Recall mutation ── */
  const recallMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.recall(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-new-leads', staffId] });
      qc.invalidateQueries({ queryKey: ['new-leads'] });
    },
  });

  /* ── Reset sessions mutation ── */
  const resetMutation = useMutation({
    mutationFn: () => staffApi.resetSessions(staffId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-member', staffId] });
      setResetDialogOpen(false);
    },
  });

  /* ── Reset balance mutation ── */
  const resetBalanceMutation = useMutation({
    mutationFn: () => staffApi.resetBalance(staffId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-member', staffId] }),
  });

  /* ── Update commission mutation ── */
  const commissionMutation = useMutation({
    mutationFn: (rate: number) => staffApi.updateCommissionRate(staffId, rate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-member', staffId] });
      setCommissionEditing(false);
      setCommissionInput('');
    },
  });

  /* ── Guard: admin only ── */
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  /* ── Loading ── */
  if (staffLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin ml-2" />
        جارٍ التحميل...
      </div>
    );
  }

  /* ── Error ── */
  if (staffError || !staff) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-3">
        <p className="text-destructive font-medium">لم يتم العثور على الموظف</p>
        <Button variant="outline" onClick={() => navigate('/employees')}>
          العودة لقائمة الموظفين
        </Button>
      </div>
    );
  }

  const leads      = leadsData?.data ?? [];
  const freshCount = leads.length;

  /* ── Shared header card ── */
  const headerCard = (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {staff?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{staff?.name ?? '—'}</h1>
              {/* Teacher code badge */}
              {staff?.teacher_profile?.teacher_code && (
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md select-all">
                  {staff.teacher_profile.teacher_code}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground" dir="ltr">{staff?.email ?? '—'}</p>
          </div>

          {staff?.role && (
            <Badge variant={ROLE_VARIANT[staff.role] ?? 'secondary'} className="text-sm px-3 py-1">
              {ROLE_LABELS[staff.role] ?? staff.role}
            </Badge>
          )}
        </div>

        <Separator className="my-4" />

        {/* Join date */}
        <div className="text-sm text-center">
          <p className="text-sm font-medium">
            {staff?.created_at
              ? new Date(staff.created_at).toLocaleDateString('ar-JO', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : '—'}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">تاريخ الانضمام</p>
        </div>
      </CardContent>
    </Card>
  );

  /* ══════════ Teacher branch ══════════════════════════════════════════════ */
  if (isTeacher) {
    const tp = staff.teacher_profile;

    return (
      <div className="p-6 space-y-6 max-w-2xl">

        {/* Back */}
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate('/employees')}
          className="gap-1 -mr-2"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لقائمة الموظفين
        </Button>

        {headerCard}

        {/* Teacher stats card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">إحصائيات المدرّس</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {tp?.sessions_count ?? 0}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">عدد الحصص</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">
                  {tp?.absences_count ?? 0}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">غيابات المعلم</p>
              </div>
              <div className="text-center">
                <StarRating rating={tp?.avg_rating} />
                <p className="text-muted-foreground text-xs mt-1">متوسط التقييم</p>
              </div>
            </div>

            {isAdmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">تصفير عداد الحصص</p>
                    {tp?.sessions_count_reset_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        آخر تصفير:{' '}
                        {new Date(tp.sessions_count_reset_at).toLocaleDateString('ar-JO', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setResetDialogOpen(true)}
                  >
                    تصفير العداد
                  </Button>
                </div>

                {/* ── Commission Rate ── */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">عمولة الحصة</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        الحالية:{' '}
                        <span className="font-semibold text-primary">
                          {tp?.commission_rate ?? '0'} د.أ / حصة
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCommissionInput(String(tp?.commission_rate ?? ''));
                        setCommissionEditing(true);
                      }}
                    >
                      تعديل العمولة
                    </Button>
                  </div>

                  {commissionEditing && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-muted/40 rounded-lg">
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={commissionInput}
                        onChange={(e) => setCommissionInput(e.target.value)}
                        placeholder="مثال: 5"
                        className="w-32 text-left"
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground">د.أ / حصة</span>
                      <Button
                        size="sm"
                        disabled={!commissionInput || commissionMutation.isPending}
                        onClick={() => {
                          const rate = parseFloat(commissionInput);
                          if (!isNaN(rate) && rate >= 0) commissionMutation.mutate(rate);
                        }}
                      >
                        {commissionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'حفظ'}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { setCommissionEditing(false); setCommissionInput(''); }}
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Balance & Rating Card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">المالية والتقييم</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Balance */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {Number(tp?.balance ?? 0).toFixed(2)} د.أ
                </p>
                {tp?.balance_reset_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    آخر تصفير: {new Date(tp.balance_reset_at).toLocaleDateString('ar-JO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    disabled={resetBalanceMutation.isPending}
                    onClick={() => resetBalanceMutation.mutate()}
                  >
                    {resetBalanceMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'تصفير الرصيد'}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Rating */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تقييم الطلاب</p>
                <div className="mt-1">
                  <StarRating rating={tp?.avg_rating} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">تقييم الطلاب فقط</p>
                <p className="text-xs text-muted-foreground mt-0.5">⭐ من 5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Bookings Card */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              الحصص التقييمية المحجوزة
              {demoBookings && demoBookings.total > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
                  {demoBookings.total}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">

            {/* Notice: pending teacher app */}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
              <span className="shrink-0">⚠️</span>
              <span>ستكون هذه البيانات فعّالة بالكامل بعد إطلاق تطبيق المعلم لقبول الحصص</span>
            </p>

            {demoLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                جارٍ التحميل...
              </div>
            ) : !demoBookings || demoBookings.total === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-1">
                <p className="text-2xl">📅</p>
                <p className="text-sm">لا توجد حصص تقييمية محجوزة حالياً</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demoBookings.bookings.map((booking: TeacherBooking) => {
                  const d = new Date(booking.scheduled_at);
                  return (
                    <div
                      key={booking.id}
                      className="rounded-lg border bg-muted/20 px-3 py-2.5 flex items-center gap-3"
                    >
                      {/* Lead info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {booking.lead?.name ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                          {booking.lead?.phone ?? ''}
                        </p>
                      </div>

                      {/* Date + time */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">
                          {d.toLocaleDateString('ar-JO', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Status badge */}
                      <Badge
                        variant={booking.status === 'confirmed' ? 'success' : 'secondary'}
                        className="text-xs shrink-0"
                      >
                        {booking.status === 'confirmed' ? 'مؤكدة' : 'بانتظار القبول'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirm dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تصفير عداد الحصص</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من تصفير عداد حصص {staff.name}؟ لا يمكن التراجع عن هذا الإجراء.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 flex-row-reverse">
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
                disabled={resetMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                نعم، صفّر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  /* ══════════ CC / LP branch (original behavior) ═══════════════════════ */
  return (
    <div className="p-6 space-y-6 max-w-2xl">

      {/* Back */}
      <Button
        variant="ghost" size="sm"
        onClick={() => navigate('/employees')}
        className="gap-1 -mr-2"
      >
        <ArrowRight className="h-4 w-4" />
        العودة لقائمة الموظفين
      </Button>

      {/* Staff header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {staff?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{staff?.name ?? '—'}</h1>
              <p className="text-sm text-muted-foreground" dir="ltr">{staff?.email ?? '—'}</p>
            </div>

            {staff?.role && (
              <Badge variant={ROLE_VARIANT[staff.role] ?? 'secondary'} className="text-sm px-3 py-1">
                {ROLE_LABELS[staff.role] ?? staff.role}
              </Badge>
            )}
          </div>

          <Separator className="my-4" />

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{freshCount}</p>
              <p className="text-muted-foreground text-xs mt-0.5">ليد جديد (غير مصنّف)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{staff?.leads_count ?? '—'}</p>
              <p className="text-muted-foreground text-xs mt-0.5">إجمالي الليدات</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {staff?.created_at
                  ? new Date(staff.created_at).toLocaleDateString('ar-JO', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">تاريخ الانضمام</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fresh leads */}
      <Card>
        <CardHeader className="pb-0 flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            الليدات الجديدة (غير المصنّفة)
          </CardTitle>
          {freshCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
              {freshCount}
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {leadsLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin ml-2" />
              جارٍ التحميل...
            </div>
          ) : leadsError ? (
            <p className="text-center py-10 text-destructive text-sm">
              حدث خطأ أثناء جلب الليدات
            </p>
          ) : freshCount === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-1">
              <p className="text-3xl">✅</p>
              <p className="text-sm font-medium">لا توجد ليدات جديدة غير مصنّفة</p>
              <p className="text-xs">جميع ليدات الموظف تم التواصل معها</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                اضغط <span className="font-medium text-foreground">سحب</span> لاسترداد الليد وإعادتها لقائمة New Lead
              </p>
              <div>
                {leads.map((lead) => (
                  <RecallRow
                    key={lead.id}
                    lead={lead}
                    onRecall={(lid) => recallMutation.mutate(lid)}
                    pending={recallMutation.isPending && recallMutation.variables === lead.id}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

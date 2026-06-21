import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paidStudentsApi, type PaidStudentsFilters } from '@/api/paidStudents';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck, Phone, Calendar, Loader2, Search, X, ChevronRight,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUB_STATUS_LABEL: Record<string, string> = {
  active:           'نشط',
  pending_approval: 'بانتظار الموافقة',
  expired:          'منتهي',
  cancelled:        'ملغى',
};

const SUB_STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive' | 'outline'> = {
  active:           'success',
  pending_approval: 'warning',
  expired:          'outline',
  cancelled:        'destructive',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-JO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaidStudentsPage() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const isAdmin  = user?.role === 'super_admin';

  // Filter state
  const [phone,     setPhone]     = useState('');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [page,      setPage]      = useState(1);

  // Applied filters (only sent on search)
  const [applied, setApplied] = useState<PaidStudentsFilters>({ page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['paid-students', applied],
    queryFn:  () => paidStudentsApi.list(applied),
    staleTime: 30_000,
  });

  const handleSearch = () => {
    const filters: PaidStudentsFilters = { page: 1 };
    if (phone.trim())    filters.phone     = phone.trim();
    if (dateFrom)        filters.date_from = dateFrom;
    if (dateTo)          filters.date_to   = dateTo;
    setPage(1);
    setApplied(filters);
  };

  const handleReset = () => {
    setPhone('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setApplied({ page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setApplied((prev) => ({ ...prev, page: newPage }));
  };

  const students = data?.data ?? [];
  const meta     = data?.meta;
  const hasFilters = !!phone || !!dateFrom || !!dateTo;

  return (
    <div className="p-6 space-y-6 max-w-4xl" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <UserCheck className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">Paid Students</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'جميع الطلاب المشتركين في المنصة' : 'الطلاب الذين اشتركوا عبرك'}
          </p>
        </div>
        {meta && (
          <Badge variant="secondary" className="font-mono mr-auto">
            {meta.total} طالب
          </Badge>
        )}
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone search */}
            <div className="space-y-1">
              <Label className="text-xs">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="07xxxxxxxx"
                  className="pr-8"
                />
              </div>
            </div>

            {/* Date from */}
            <div className="space-y-1">
              <Label className="text-xs">تاريخ الاشتراك — من</Label>
              <Input
                type="date"
                dir="ltr"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date to */}
            <div className="space-y-1">
              <Label className="text-xs">تاريخ الاشتراك — إلى</Label>
              <Input
                type="date"
                dir="ltr"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button onClick={handleSearch} className="gap-1.5">
              <Search className="h-4 w-4" />
              بحث
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={handleReset} className="gap-1.5 text-muted-foreground">
                <X className="h-4 w-4" />
                إلغاء الفلتر
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Results ── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            {hasFilters ? 'لا توجد نتائج تطابق البحث' : 'لا يوجد طلاب مشتركون بعد'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card
              key={s.id}
              className="hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/leads/${s.id}`)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4 flex-wrap">

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <UserCheck className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p dir="ltr" className="text-xs text-muted-foreground">{s.phone}</p>
                    </div>
                  </div>

                  {/* Subscription info */}
                  {s.subscription ? (
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="text-center">
                        <p className="font-bold text-base text-emerald-700">
                          {s.subscription.amount_paid} د.أ
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.subscription.lessons_count
                            ? `${s.subscription.lessons_count} درس`
                            : `${s.subscription.months_count} شهر`}
                        </p>
                      </div>

                      <Badge variant={SUB_STATUS_VARIANT[s.subscription.status] ?? 'outline'}>
                        {SUB_STATUS_LABEL[s.subscription.status] ?? s.subscription.status}
                      </Badge>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>تفعيل: {fmt(s.subscription.activated_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>انتهاء: {fmt(s.subscription.expires_at)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">لا يوجد اشتراك</span>
                  )}

                  {/* CC name — admin only */}
                  {isAdmin && s.assigned_to && (
                    <div className="text-xs text-muted-foreground border-r pr-3">
                      <p className="text-[10px] uppercase tracking-wide">CC</p>
                      <p className="font-medium">{s.assigned_to.name}</p>
                    </div>
                  )}

                  {/* Converted date */}
                  <div className="text-xs text-muted-foreground text-left shrink-0">
                    <p className="text-[10px] uppercase tracking-wide">اشتراك</p>
                    <p>{fmt(s.converted_at)}</p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline" size="sm"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {meta.last_page}</span>
          <Button
            variant="outline" size="sm"
            disabled={page === meta.last_page}
            onClick={() => handlePageChange(page + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}

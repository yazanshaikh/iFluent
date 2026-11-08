import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancellationRequestsApi } from '@/api/cancellationRequests';
import {
  RequestFilters, EMPTY_FILTERS, toParams, type RequestFilterValues,
} from '@/components/cancellation/RequestFilters';
import { CancellationRequestCard } from '@/components/cancellation/CancellationRequestCard';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Admin opens on the requests still waiting for a decision
const ADMIN_DEFAULTS: RequestFilterValues = { ...EMPTY_FILTERS, status: 'pending' };

/** Admin: cancellation requests raised by LP staff. */
export default function CancellationRequestsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const qc   = useQueryClient();

  const [filters, setFilters] = useState<RequestFilterValues>(ADMIN_DEFAULTS);
  const [page,    setPage]    = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cancellation-requests', filters, page],
    queryFn:  () => cancellationRequestsApi.list({ ...toParams(filters), page }),
    enabled:  role === 'super_admin',
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-cancellation-requests'] });
    qc.invalidateQueries({ queryKey: ['paid-students'] });
  };
  const onError = (err: any) => alert(err?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى');

  const approve = useMutation({ mutationFn: cancellationRequestsApi.approve, onSuccess: refresh, onError });
  const reject  = useMutation({ mutationFn: (id: number) => cancellationRequestsApi.reject(id), onSuccess: refresh, onError });

  if (role && role !== 'super_admin') return <Navigate to="/my-requests" replace />;

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const busyId = (approve.isPending && approve.variables) || (reject.isPending && reject.variables) || null;

  return (
    <div className="p-6 space-y-6 max-w-4xl" dir="rtl">
      <div className="flex items-center gap-3">
        <Ban className="h-6 w-6 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Cancellation Requests</h1>
          <p className="text-sm text-muted-foreground">طلبات مرفوعة من فريق LP — القبول يلغي الاشتراك، الرفض يتركه كما هو</p>
        </div>
        {data && data.pending_count > 0 && (
          <Badge variant="warning" className="mr-auto">{data.pending_count} قيد المراجعة</Badge>
        )}
      </div>

      <RequestFilters
        value={filters}
        defaults={ADMIN_DEFAULTS}
        onApply={(f) => { setFilters(f); setPage(1); }}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">لا توجد طلبات</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((req) => (
            <CancellationRequestCard
              key={req.id}
              req={req}
              showRequester
              actions={req.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    className={cn('h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white')}
                    disabled={busyId === req.id}
                    onClick={() => {
                      if (confirm(`قبول الطلب سيلغي اشتراك ${req.student.name ?? 'الطالب'} ويصفّر رصيد الحصص. متأكد؟`)) {
                        approve.mutate(req.id);
                      }
                    }}
                  >
                    <Check className="h-3.5 w-3.5" /> قبول
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-7 gap-1 text-destructive hover:text-destructive border-red-300"
                    disabled={busyId === req.id}
                    onClick={() => { if (confirm('رفض الطلب؟ الاشتراك سيبقى كما هو.')) reject.mutate(req.id); }}
                  >
                    <X className="h-3.5 w-3.5" /> رفض
                  </Button>
                </>
              )}
            />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>السابق</Button>
          <span className="text-sm text-muted-foreground">{page} / {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>التالي</Button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancellationRequestsApi } from '@/api/cancellationRequests';
import { CancellationRequestCard } from '@/components/cancellation/CancellationRequestCard';
import {
  RequestFilters, EMPTY_FILTERS, toParams, type RequestFilterValues,
} from '@/components/cancellation/RequestFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, Loader2, Undo2 } from 'lucide-react';

/** LP: the cancellation requests I raised, their status, and withdrawing a pending one. */
export default function MyRequestsPage() {
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState<RequestFilterValues>(EMPTY_FILTERS);

  const { data, isLoading } = useQuery({
    queryKey: ['my-cancellation-requests', filters, page],
    queryFn:  () => cancellationRequestsApi.mine({ ...toParams(filters), page }),
    staleTime: 15_000,
  });

  const qc = useQueryClient();
  const withdraw = useMutation({
    mutationFn: cancellationRequestsApi.withdraw,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-cancellation-requests'] });
      qc.invalidateQueries({ queryKey: ['paid-students'] });
      qc.invalidateQueries({ queryKey: ['lead'] });
    },
    onError: (err: any) => alert(err?.response?.data?.message ?? 'تعذر إلغاء الطلب'),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6 max-w-4xl" dir="rtl">
      <div className="flex items-center gap-3">
        <Inbox className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Cancellation Requests</h1>
          <p className="text-sm text-muted-foreground">طلبات إلغاء الاشتراك التي أرسلتها وحالتها</p>
        </div>
        {meta && <Badge variant="secondary" className="font-mono mr-auto">{meta.total} طلب</Badge>}
      </div>

      <RequestFilters value={filters} onApply={(f) => { setFilters(f); setPage(1); }} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            {filters === EMPTY_FILTERS
              ? 'لم ترسل أي طلب بعد — يمكنك طلب إلغاء اشتراك من داخل بروفايل الطالب'
              : 'لا توجد طلبات تطابق البحث'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((req) => (
            <CancellationRequestCard
              key={req.id}
              req={req}
              actions={req.status === 'pending' && (
                <Button
                  size="sm" variant="outline"
                  className="h-7 gap-1 text-muted-foreground"
                  disabled={withdraw.isPending && withdraw.variables === req.id}
                  onClick={() => {
                    if (confirm(`إلغاء طلب إلغاء اشتراك ${req.student.name ?? 'الطالب'}؟ الاشتراك سيبقى كما هو.`)) {
                      withdraw.mutate(req.id);
                    }
                  }}
                >
                  {withdraw.isPending && withdraw.variables === req.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Undo2 className="h-3.5 w-3.5" />}
                  إلغاء الطلب
                </Button>
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

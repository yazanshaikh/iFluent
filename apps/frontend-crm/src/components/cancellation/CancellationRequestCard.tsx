import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, UserCheck, User } from 'lucide-react';
import {
  CANCEL_STATUS_LABEL, CANCEL_STATUS_VARIANT, type CancellationRequest,
} from '@/api/cancellationRequests';

const ROLE_LABEL: Record<string, string> = { cc: 'CC', ss: 'LP', super_admin: 'مدير' };

export function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-JO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** One cancellation request — shared by the admin list and the staff "الطلبات" page. */
export function CancellationRequestCard({
  req, showRequester = false, actions,
}: {
  req: CancellationRequest;
  showRequester?: boolean;
  actions?: ReactNode;
}) {
  const sub = req.subscription;

  return (
    <Card>
      <CardContent className="py-4 px-4 space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          {/* Student */}
          <div className="flex items-center gap-3 flex-1 min-w-[180px]">
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <UserCheck className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{req.student.name ?? '—'}</p>
              <p dir="ltr" className="text-xs text-muted-foreground text-right">{req.student.phone}</p>
            </div>
          </div>

          {/* Subscription */}
          {sub && (
            <div className="text-sm text-center">
              <p className="font-bold text-emerald-700">{sub.amount_paid} د.أ</p>
              <p className="text-xs text-muted-foreground">
                {sub.package ? `${sub.package} — ` : ''}
                {sub.lessons_count ? `${sub.lessons_count} درس` : `${sub.months_count} شهر`}
              </p>
            </div>
          )}

          <Badge variant={CANCEL_STATUS_VARIANT[req.status]} className="shrink-0">
            {CANCEL_STATUS_LABEL[req.status]}
          </Badge>
        </div>

        {/* Reason */}
        <div className="rounded-md bg-muted/50 border px-3 py-2 text-sm">
          <span className="text-xs text-muted-foreground block mb-0.5">سبب الإلغاء</span>
          <p className="whitespace-pre-wrap break-words">{req.reason}</p>
        </div>

        {req.review_note && (
          <p className="text-xs text-muted-foreground">ملاحظة الإدارة: {req.review_note}</p>
        )}

        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          {showRequester && req.requested_by && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              مقدّم الطلب: <span className="font-medium text-foreground">{req.requested_by.name}</span>
              {ROLE_LABEL[req.requested_by.role] && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ROLE_LABEL[req.requested_by.role]}</Badge>
              )}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            تاريخ الطلب: {fmtDateTime(req.created_at)}
          </span>
          {req.reviewed_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              تمت المراجعة: {fmtDateTime(req.reviewed_at)}
              {req.reviewed_by ? ` — ${req.reviewed_by.name}` : ''}
            </span>
          )}
          {actions && <div className="flex gap-2 mr-auto">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

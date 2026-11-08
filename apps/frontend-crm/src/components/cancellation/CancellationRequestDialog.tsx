import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancellationRequestsApi } from '@/api/cancellationRequests';
import { Button }   from '@/components/ui/button';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/** LP: ask the admin to cancel one of their students' subscriptions (with a reason). */
export function CancellationRequestDialog({
  open, onClose, subscriptionId, studentName, summary, onSent,
}: {
  open:           boolean;
  onClose:        () => void;
  subscriptionId: number;
  studentName:    string;
  summary?:       string;
  onSent?:        () => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => { if (open) { setReason(''); setError(null); } }, [open]);

  const mutation = useMutation({
    mutationFn: () => cancellationRequestsApi.create(subscriptionId, reason.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paid-students'] });
      qc.invalidateQueries({ queryKey: ['my-cancellation-requests'] });
      onSent?.();
      onClose();
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message ?? 'تعذر إرسال الطلب، حاول مرة أخرى'),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-destructive">طلب إلغاء الاشتراك</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            سيتم إرسال الطلب للإدارة للمراجعة — الاشتراك لن يُلغى إلا بعد موافقة المدير.
            يمكنك متابعة حالة الطلب من قسم "Cancellation Requests".
          </p>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-semibold">{studentName}</p>
            {summary && <p className="text-xs text-muted-foreground mt-1">{summary}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel-request-reason">
              سبب الإلغاء <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-request-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب طلب إلغاء الاشتراك (5 أحرف على الأقل)..."
              rows={3}
              maxLength={500}
              className="text-right"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="flex gap-2 justify-start">
          <Button
            variant="destructive"
            disabled={reason.trim().length < 5 || mutation.isPending}
            onClick={() => { setError(null); mutation.mutate(); }}
          >
            {mutation.isPending ? 'جاري الإرسال…' : 'إرسال الطلب'}
          </Button>
          <Button variant="outline" onClick={onClose}>تراجع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

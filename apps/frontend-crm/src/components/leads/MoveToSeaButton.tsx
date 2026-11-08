import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, type Lead } from '@/api/leads';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Waves } from 'lucide-react';

/**
 * Red "ترحيل" button on a lead untouched for 5+ days. Leads are no longer moved
 * to the Open Sea automatically — this asks for confirmation, then moves it.
 */
export function MoveToSeaButton({
  lead, onMoved, size = 'sm',
}: {
  lead:     Pick<Lead, 'id' | 'name'>;
  onMoved?: () => void;
  size?:    'sm' | 'xs';
}) {
  const qc = useQueryClient();
  const [open,  setOpen]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => leadsApi.moveToSea(lead.id),
    onSuccess: () => {
      ['leads', 'new-leads', 'open-sea', 'small-treasury'].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      );
      qc.invalidateQueries({ queryKey: ['lead', lead.id] });
      setOpen(false);
      onMoved?.();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'تعذّر ترحيل الليدة'),
  });

  return (
    <>
      <Button
        type="button"
        size="sm"
        className={
          'bg-red-600 hover:bg-red-700 text-white gap-1 ' +
          (size === 'xs' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs')
        }
        onClick={(e) => { e.stopPropagation(); setError(null); setOpen(true); }}
        title="مرّ على الليدة 5 أيام بدون أي تحديث"
      >
        <Waves className="h-3 w-3" />
        ترحيل
      </Button>

      <Dialog open={open} onOpenChange={(o) => !mutation.isPending && setOpen(o)}>
        <DialogContent className="max-w-sm" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-right">ترحيل الليدة للبحر المفتوح</DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من ترحيل <strong>{lead.name}</strong> إلى الأوبن سي؟
              ستُزال من الموظف وتصبح متاحة للجميع.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <DialogFooter className="flex gap-2 justify-start">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              نعم، رحّلها
            </Button>
            <Button variant="outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              لا
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

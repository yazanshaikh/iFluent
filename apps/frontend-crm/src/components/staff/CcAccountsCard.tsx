import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, type CcSales } from '@/api/staff';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { HandCoins, Loader2, RotateCcw } from 'lucide-react';

const money = (v: number) => `${v.toLocaleString()} د.أ`;

/** Amount input + add button. */
function AmountForm({
  placeholder, label, isPending, onSubmit,
}: {
  placeholder: string;
  label: string;
  isPending: boolean;
  onSubmit: (amount: number, done: () => void) => void;
}) {
  const [value, setValue] = useState('');
  const amount = parseFloat(value);
  const valid  = !isNaN(amount) && amount > 0;

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number" min={0} step="0.01" dir="ltr"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-left"
      />
      <Button
        className="shrink-0"
        disabled={!valid || isPending}
        onClick={() => onSubmit(amount, () => setValue(''))}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
        {label}
      </Button>
    </div>
  );
}

/** Admin: what a CC is due this month, and their refunds. */
export function CcAccountsCard({
  staffId, staffName, sales,
}: {
  staffId:   number;
  staffName: string;
  sales?:    CcSales;
}) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['cc-sales', staffId] });
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };
  const onError = (e: any) => alert(e?.response?.data?.message ?? 'تعذّر تنفيذ العملية، يرجى المحاولة مرة أخرى.');

  const addDue       = useMutation({ mutationFn: (a: number) => staffApi.addDue(staffId, a), onSuccess: refresh, onError });
  const addRefund    = useMutation({ mutationFn: (a: number) => staffApi.addRefund(staffId, a), onSuccess: refresh, onError });
  const resetDue     = useMutation({ mutationFn: () => staffApi.resetDue(staffId), onSuccess: refresh, onError });
  const resetRefunds = useMutation({ mutationFn: () => staffApi.resetRefunds(staffId), onSuccess: refresh, onError });

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Monthly due */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-rose-600" />
              <p className="text-sm font-semibold">المبلغ المستحق للشهر</p>
            </div>
            <p className="text-2xl font-bold text-rose-600">{money(sales?.due ?? 0)}</p>
          </div>
          <AmountForm
            placeholder="أدخل المبلغ"
            label="إضافة"
            isPending={addDue.isPending}
            onSubmit={(a, done) => addDue.mutate(a, { onSuccess: done })}
          />
          <Button
            variant="outline" size="sm"
            disabled={resetDue.isPending || !sales?.due}
            onClick={() => {
              if (window.confirm(`تصفير المبلغ المستحق لـ ${staffName}؟ لا يمكن التراجع عن هذا الإجراء.`)) resetDue.mutate();
            }}
          >
            تصفير المستحق
          </Button>
        </div>

        <Separator />

        {/* Refunds */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold">عداد الاسترداد (Refund)</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/30 px-2 py-3 text-center">
              <p className="text-2xl font-bold">{sales?.refund_count ?? 0}</p>
              <p className="text-muted-foreground text-xs mt-0.5">عدد عمليات الاسترداد</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-2 py-3 text-center">
              <p className="text-2xl font-bold">{money(sales?.refund_amount ?? 0)}</p>
              <p className="text-muted-foreground text-xs mt-0.5">إجمالي المبلغ المسترد</p>
            </div>
          </div>
          <AmountForm
            placeholder="أدخل مبلغ الاسترداد"
            label="تسجيل استرداد"
            isPending={addRefund.isPending}
            onSubmit={(a, done) => addRefund.mutate(a, { onSuccess: done })}
          />
          <p className="text-xs text-muted-foreground">يُخصم مبلغ الاسترداد من إجمالي مبيعات الموظف.</p>
          <Button
            variant="outline" size="sm"
            disabled={resetRefunds.isPending || !sales?.refund_count}
            onClick={() => {
              if (window.confirm(`تصفير عداد الاسترداد لـ ${staffName}؟ لن يتغير إجمالي المبيعات.`)) resetRefunds.mutate();
            }}
          >
            تصفير عداد الاسترداد
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

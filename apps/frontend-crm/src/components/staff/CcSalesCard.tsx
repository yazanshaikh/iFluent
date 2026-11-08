import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, CalendarDays, Loader2 } from 'lucide-react';
import type { CcSales } from '@/api/staff';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** A CC's sales since the counter last started. `onReset` shows the admin's reset button. */
export function CcSalesCard({
  sales, isLoading, onReset, resetting,
}: {
  sales?:     CcSales;
  isLoading:  boolean;
  onReset?:   () => void;
  resetting?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          عداد المبيعات
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isLoading || !sales ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 dark:bg-emerald-950/30 dark:border-emerald-800">
              <div>
                <p className="text-sm font-semibold">إجمالي المبيعات</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  عدد المبيعات المعتمدة: {sales.count}
                </p>
                {!!sales.refunds_deducted && (
                  <p className="text-xs text-muted-foreground">
                    مخصوم منها استرداد بقيمة {sales.refunds_deducted.toLocaleString()} د.أ
                  </p>
                )}
              </div>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                {sales.amount.toLocaleString()} د.أ
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">تاريخ البداية:</span>
                <span className="font-medium">{fmtDate(sales.since)}</span>
              </div>
              {onReset && (
                <Button variant="destructive" size="sm" disabled={resetting} onClick={onReset}>
                  {resetting && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />}
                  تصفير العداد
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Phone, Search, X } from 'lucide-react';
import type { CancellationStatus } from '@/api/cancellationRequests';

export interface RequestFilterValues {
  status: CancellationStatus | 'all';
  phone:  string;
}

export const EMPTY_FILTERS: RequestFilterValues = { status: 'all', phone: '' };

const STATUS_OPTIONS: { value: RequestFilterValues['status']; label: string }[] = [
  { value: 'all',      label: 'كل الحالات' },
  { value: 'pending',  label: 'قيد المراجعة' },
  { value: 'approved', label: 'مقبولة' },
  { value: 'rejected', label: 'مرفوضة' },
];

/** Query params for the API from the applied filter values. */
export function toParams(f: RequestFilterValues) {
  return {
    status:    f.status === 'all' ? undefined : f.status,
    phone:     f.phone.trim() || undefined,
  };
}

/**
 * Phone / status filters for the cancellation-request lists
 * (staff "الطلبات" page and the admin page). The phone applies on "بحث";
 * the status applies immediately.
 */
export function RequestFilters({
  value, onApply, defaults = EMPTY_FILTERS,
}: {
  value:     RequestFilterValues;
  onApply:   (v: RequestFilterValues) => void;
  defaults?: RequestFilterValues;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const set = (patch: Partial<RequestFilterValues>) => setDraft((d) => ({ ...d, ...patch }));
  const isDefault =
    value.status === defaults.status && !value.phone;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div className="space-y-1">
            <Label className="text-xs">رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                dir="ltr"
                value={draft.phone}
                onChange={(e) => set({ phone: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && onApply(draft)}
                placeholder="07xxxxxxxx"
                className="pr-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">الحالة</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => {
                const next = { ...draft, status: v as RequestFilterValues['status'] };
                setDraft(next);
                onApply(next);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button onClick={() => onApply(draft)} className="gap-1.5">
            <Search className="h-4 w-4" />
            بحث
          </Button>
          {!isDefault && (
            <Button variant="ghost" onClick={() => onApply(defaults)} className="gap-1.5 text-muted-foreground">
              <X className="h-4 w-4" />
              إلغاء الفلتر
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

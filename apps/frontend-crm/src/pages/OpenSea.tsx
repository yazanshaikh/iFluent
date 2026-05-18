import { useState }       from 'react';
import { useNavigate }    from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { openSeaApi, type OpenSeaLead } from '@/api/openSea';
import { staffApi }        from '@/api/staff';
import { useAuthStore }    from '@/stores/authStore';
import { useOpenSeaStore } from '@/stores/openSeaStore';
import { STATUS_LABELS, STATUS_VARIANT } from './Leads';

import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, CalendarRange, Anchor, UserRoundCog, Waves, X, Gem } from 'lucide-react';

const PER_PAGE = 10;

/* ── آخر ملاحظة: النص + التاريخ ── */
function LastRemarkCell({ lead }: { lead: OpenSeaLead }) {
  const sorted = (lead.remarks ?? []).slice().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const remark = sorted[0];

  if (!remark) {
    return <span className="text-muted-foreground text-xs italic">لا توجد ملاحظات</span>;
  }

  const preview = remark.content.length > 55
    ? `${remark.content.slice(0, 55)}…`
    : remark.content;

  return (
    <div className="space-y-0.5 max-w-[220px]">
      <p className="text-sm leading-snug">{preview}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(remark.created_at).toLocaleDateString('ar-SA', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
        {remark.staff?.name ? ` · ${remark.staff.name}` : ''}
      </p>
    </div>
  );
}

/* ══════════════════════════ Re-assign Dialog ═════════════════════════════ */
function ReassignDialog() {
  const qc = useQueryClient();
  const { reassignTarget, setReassignTarget } = useOpenSeaStore();
  const [selectedStaff, setSelectedStaff] = useState('');

  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn:  staffApi.list,
    staleTime: 60_000,
    enabled:  !!reassignTarget,
  });

  const mutation = useMutation({
    mutationFn: () => openSeaApi.assign(reassignTarget!.id, Number(selectedStaff)),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['open-sea'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setReassignTarget(null);
      setSelectedStaff('');
    },
  });

  if (!reassignTarget) return null;

  const apiError = (mutation.error as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message ?? (mutation.error ? 'حدث خطأ' : null);

  return (
    <Dialog open onOpenChange={(o) => !o && setReassignTarget(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundCog className="h-5 w-5 text-primary" />
            إعادة التعيين
          </DialogTitle>
          <DialogDescription>
            اختر موظفاً لتعيين <strong>{reassignTarget.name}</strong> إليه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>الموظف المسؤول</Label>
          {staffLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل...
            </div>
          ) : (
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظفاً..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    <span className="mr-1.5 text-muted-foreground text-xs">
                      ({s.role.toUpperCase()})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {apiError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {apiError}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setReassignTarget(null)}
            disabled={mutation.isPending}>إلغاء</Button>
          <Button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedStaff}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
            تعيين
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════ Column Definitions ═══════════════════════════ */
interface SelectionProps {
  selectedIds:  Set<number>;
  toggleId:     (id: number) => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  toggleAll:    () => void;
}

function useOpenSeaColumns(
  isAdmin: boolean,
  sel: SelectionProps,
): ColumnDef<OpenSeaLead, unknown>[] {
  const navigate = useNavigate();
  const { setReassignTarget } = useOpenSeaStore();

  return [
    /* ── Checkbox column ── */
    {
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          checked={sel.isAllSelected}
          ref={(el) => { if (el) el.indeterminate = sel.isSomeSelected; }}
          onChange={sel.toggleAll}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer accent-primary rounded"
          aria-label="تحديد الكل"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={sel.selectedIds.has(row.original.id)}
          onChange={() => sel.toggleId(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer accent-primary rounded"
          aria-label="تحديد"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="الاسم" />,
      cell: ({ row }) => (
        <button
          type="button"
          className="flex items-center gap-1.5 font-medium hover:underline hover:text-primary transition-colors text-right"
          onClick={(e) => { e.stopPropagation(); navigate(`/leads/${row.original.id}`); }}
        >
          {row.original.name}
          {row.original.is_small_treasure && (
            <Gem className="h-3 w-3 text-amber-500 shrink-0" />
          )}
        </button>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'رقم الجوال',
      enableSorting: false,
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground text-xs font-mono">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} label="الحالة" />,
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'last_remark',
      header: 'آخر ملاحظة',
      enableSorting: false,
      cell: ({ row }) => <LastRemarkCell lead={row.original} />,
    },
    {
      accessorKey: 'moved_to_open_sea_at',
      header: ({ column }) => <SortableHeader column={column} label="دخل البحر" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.moved_to_open_sea_at).toLocaleDateString('ar-SA', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    /* عمود إعادة التعيين — للمدير فقط */
    ...(isAdmin
      ? [{
          id: 'actions',
          header: '',
          enableSorting: false,
          cell: ({ row }: { row: { original: OpenSeaLead } }) => (
            <div onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="secondary" className="h-7 text-xs gap-1"
                onClick={() => setReassignTarget(row.original)}>
                <UserRoundCog className="h-3 w-3" />
                تعيين
              </Button>
            </div>
          ),
        } satisfies ColumnDef<OpenSeaLead, unknown>]
      : []),
  ];
}

/* ══════════════════════════ Main Page ════════════════════════════════════ */
export default function OpenSeaPage() {
  const qc      = useQueryClient();
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'super_admin';

  /* ── Filters ── */
  const [phone,    setPhone]    = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page,     setPage]     = useState(1);

  /* ── Multi-select ── */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const hasFilters = !!(phone || dateFrom || dateTo);

  const clearFilters = () => {
    setPhone(''); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['open-sea', page, phone, dateFrom, dateTo],
    queryFn:  () => openSeaApi.list({
      page,
      per_page:  PER_PAGE,
      phone:     phone    || undefined,
      date_from: dateFrom || undefined,
      date_to:   dateTo   || undefined,
    }),
    staleTime: 30_000,
  });

  const leads = data?.data ?? [];

  /* ── Selection helpers ── */
  const isAllSelected  = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const isSomeSelected = leads.some((l) => selectedIds.has(l.id)) && !isAllSelected;

  const toggleId = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => {
      if (isAllSelected) {
        const next = new Set(prev);
        leads.forEach((l) => next.delete(l.id));
        return next;
      }
      const next = new Set(prev);
      leads.forEach((l) => next.add(l.id));
      return next;
    });

  /* ── Bulk pull mutation ── */
  const bulkPullMutation = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map((id) => openSeaApi.pull(id))),
    onSuccess: async () => {
      setSelectedIds(new Set());
      await qc.invalidateQueries({ queryKey: ['open-sea'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleBulkPull = () => {
    if (selectedIds.size === 0) return;
    bulkPullMutation.mutate([...selectedIds]);
  };

  const sel: SelectionProps = { selectedIds, toggleId, isAllSelected, isSomeSelected, toggleAll };
  const columns = useOpenSeaColumns(isAdmin, sel);

  return (
    <>
      <ReassignDialog />

      <div className="p-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Waves className="h-6 w-6 text-blue-500" />
              Open Sea
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              العملاء الذين لم يتحولوا خلال 5 أيام — بانتظار إعادة التعيين
            </p>
          </div>
          {data && (
            <span className="text-3xl font-bold text-blue-600 self-center">
              {data.total}
              <span className="text-sm font-normal text-muted-foreground mr-1">ليد</span>
            </span>
          )}
        </div>

        {/* ── Filters row ── */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            خيارات البحث
          </p>

          <div className="flex flex-wrap gap-4 items-end">
            {/* 1 — Phone search */}
            <div className="space-y-1.5 flex-1 min-w-[180px]">
              <Label className="flex items-center gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" />
                رقم الجوال
              </Label>
              <Input
                dir="ltr"
                placeholder="+962 5x xxx xxxx"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPage(1); }}
                className="h-9 font-mono text-sm"
              />
            </div>

            {/* 2 — Date range */}
            <div className="space-y-1.5 flex-1 min-w-[280px]">
              <Label className="flex items-center gap-1.5 text-xs">
                <CalendarRange className="h-3.5 w-3.5" />
                فلتر التاريخ (دخول البحر)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span className="text-muted-foreground text-xs shrink-0">—</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* Clear */}
            {hasFilters && (
              <Button
                variant="ghost" size="sm"
                onClick={clearFilters}
                className="h-9 text-muted-foreground gap-1.5 self-end"
              >
                <X className="h-3.5 w-3.5" />
                مسح
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-0 flex-row items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">عملاء البحر المفتوح</CardTitle>

            <div className="flex items-center gap-3">
              {/* Bulk pull action — يظهر عند تحديد ليدات */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-primary font-medium">
                    {selectedIds.size} محدد
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    disabled={bulkPullMutation.isPending}
                    onClick={handleBulkPull}
                  >
                    {bulkPullMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Anchor className="h-3.5 w-3.5" />}
                    سحب ({selectedIds.size})
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="إلغاء التحديد"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {data && (
                <p className="text-xs text-muted-foreground shrink-0">
                  {PER_PAGE} لكل صفحة · {data.total} إجمالي
                </p>
              )}
            </div>
          </CardHeader>

          {/* Pull error */}
          {bulkPullMutation.isError && (
            <div className="px-6 pb-0">
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(bulkPullMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? 'حدث خطأ أثناء السحب'}
              </p>
            </div>
          )}

          <CardContent className="pt-4">
            <DataTable
              columns={columns}
              data={leads}
              isLoading={isLoading}
              isError={isError}
              emptyState={
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <p className="text-4xl">🌊</p>
                  <p className="font-medium">
                    {hasFilters
                      ? 'لا توجد نتائج للفلاتر المحددة'
                      : 'البحر هادئ — لا يوجد عملاء في الانتظار'}
                  </p>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  )}
                </div>
              }
            />

            {/* Pagination */}
            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  صفحة {data.current_page} من {data.last_page}
                  {' '}·{' '}
                  {data.total} نتيجة
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}>
                    السابق
                  </Button>

                  {Array.from({ length: data.last_page }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === data.last_page ||
                                   Math.abs(n - page) <= 1)
                    .reduce<(number | '…')[]>((acc, n, i, arr) => {
                      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === '…' ? (
                        <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button
                          key={n} size="sm"
                          variant={page === n ? 'default' : 'outline'}
                          className="h-8 w-8 p-0"
                          onClick={() => setPage(n as number)}
                        >
                          {n}
                        </Button>
                      ),
                    )}

                  <Button variant="outline" size="sm"
                    disabled={page === data.last_page}
                    onClick={() => setPage((p) => p + 1)}>
                    التالي
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  );
}

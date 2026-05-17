import { useState } from 'react';
import { useNavigate }    from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

import { leadsApi, type Lead, type LeadStatus, POOL_STATUSES } from '@/api/leads';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronLeft, Filter, Gem } from 'lucide-react';

/* ─────────────────────────── Status helpers ────────────────────────────── */
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new:            'جديد',
  in_progress:    'قيد التنفيذ',
  interested:     'مهتم',
  not_interested: 'غير مهتم',
  postponed:      'تأجيل',
  open_sea:       'البحر المفتوح',
  subscriber:     'مشترك',
};

export const STATUS_VARIANT: Record<
  LeadStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  new:            'outline',
  in_progress:    'default',
  interested:     'success',
  not_interested: 'destructive',
  postponed:      'secondary',
  open_sea:       'warning',
  subscriber:     'success',
};

/** الحالات المسموح بفلترتها داخل Lead Pool */
const POOL_FILTER_STATUSES: LeadStatus[] = ['in_progress', 'interested', 'not_interested', 'postponed', 'subscriber'];


/* ─────────────────────────── Column Definitions ────────────────────────── */
function useLeadColumns(onView: (lead: Lead) => void): ColumnDef<Lead, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="الاسم" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 font-medium">
          {row.original.name}
          {row.original.is_small_treasure && (
            <Gem className="h-3 w-3 text-amber-500 shrink-0" />
          )}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'رقم الجوال',
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground">{row.original.phone}</span>
      ),
      enableSorting: false,
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
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} label="تاريخ الإضافة" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.created_at).toLocaleDateString('ar-SA')}
        </span>
      ),
    },
    {
      id: 'view',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(row.original); }}
          className="p-1 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ),
      enableSorting: false,
    },
  ];
}

/* ─────────────────────────── Main Page ─────────────────────────────────── */
export default function LeadsPage() {
  const navigate = useNavigate();
  const [search,  setSearch]  = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page,         setPage]         = useState(1);

  /*
   * Lead Pool يعرض حالتين فقط: working + subscriber
   * 'all'  → أرسل المصفوفة كاملة  ['working', 'subscriber']
   * غيرها  → أرسل الحالة المختارة
   * الهدف: لا تظهر أبداً ليدات new / assigned / open_sea هنا
   */
  const apiStatus = statusFilter === 'all' ? POOL_STATUSES : statusFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads', page, search, statusFilter],
    queryFn:  () => leadsApi.list({ page, search, status: apiStatus }),
    staleTime: 30_000,
  });

  const columns = useLeadColumns((lead) => navigate(`/leads/${lead.id}`));
  const leads   = data?.data ?? [];

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Pool</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data ? `${data.total} عميل محتمل` : ' '}
          </p>
        </div>
      </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو الرقم..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-9"
            />
          </div>

          {/* Status filter — pool statuses only */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v as LeadStatus | 'all'); setPage(1); }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {POOL_FILTER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
                className="text-muted-foreground text-xs"
              >
                مسح الفلاتر ✕
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">قائمة العملاء</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DataTable
              columns={columns}
              data={leads}
              isLoading={isLoading}
              isError={isError}
              onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
              emptyState={
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <p className="text-3xl">📋</p>
                  <p>
                    {search || statusFilter !== 'all'
                      ? 'لا توجد نتائج للفلاتر المحددة'
                      : 'لا توجد ليدات في الـ Pool — الليدات تنتقل هنا بعد بدء العمل عليها'}
                  </p>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}>
                    السابق
                  </Button>
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
  );
}

import { useState } from 'react';
import { useNavigate }    from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

import { leadsApi, type Lead, type LeadStatus, POOL_STATUSES } from '@/api/leads';
import { MoveToSeaButton } from '@/components/leads/MoveToSeaButton';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronLeft, Filter, Gem, X } from 'lucide-react';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { useDebounced } from '@/hooks/useDebounced';

/* ─────────────────────────── Status helpers ────────────────────────────── */
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new:            'جديد',
  no_answer:      'مارد',
  interested:     'مهتم',
  not_interested: 'غير مهتم',
  postponed:      'تأجيل',
  trial_session:  'حصة تجريبية',
  open_sea:       'البحر المفتوح',
  subscriber:     'مشترك',
};

/** English labels — used on the English list pages (Lead Pool, Open Sea). */
export const STATUS_LABELS_EN: Record<LeadStatus, string> = {
  new:            'New',
  no_answer:      'No answer',
  interested:     'Interested',
  not_interested: 'Not interested',
  postponed:      'Postponed',
  trial_session:  'Trial session',
  open_sea:       'Open Sea',
  subscriber:     'Subscribed',
};

export const STATUS_VARIANT: Record<
  LeadStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  new:            'outline',
  no_answer:      'default',
  interested:     'success',
  not_interested: 'destructive',
  postponed:      'secondary',
  trial_session:  'warning',
  open_sea:       'warning',
  subscriber:     'success',
};

/** الحالات المسموح بفلترتها داخل Lead Pool */
// Subscribed students don't stay in the Lead Pool
const POOL_FILTER_STATUSES: LeadStatus[] = ['no_answer', 'interested', 'not_interested', 'postponed', 'trial_session'];


/* ─────────────────────────── Column Definitions ────────────────────────── */
function useLeadColumns(onView: (lead: Lead) => void): ColumnDef<Lead, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
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
      header: 'Phone',
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground">{row.original.phone}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {STATUS_LABELS_EN[row.original.status]}
          </Badge>
          {/* Stale 5+ days → manual transfer to the Open Sea */}
          {row.original.needs_transfer && <MoveToSeaButton lead={row.original} size="xs" />}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} label="Added on" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs" dir="ltr">
          {new Date(row.original.created_at).toLocaleDateString('en-GB')}
        </span>
      ),
    },
    {
      accessorKey: 'demo_session',
      header: 'Trial session',
      enableSorting: false,
      cell: ({ row }) => row.original.demo_session?.scheduled_at ? (
        <span className="text-xs text-primary font-medium" dir="ltr">
          {new Date(row.original.demo_session.scheduled_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short',
          })}
          {' '}
          {new Date(row.original.demo_session.scheduled_at).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
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
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [page,         setPage]         = useState(1);

  const hasFilters = search || statusFilter !== 'all' || dateFrom || dateTo;
  const debouncedSearch = useDebounced(search.trim());

  /*
   * Lead Pool يعرض حالتين فقط: working + subscriber
   * 'all'  → أرسل المصفوفة كاملة  ['working', 'subscriber']
   * غيرها  → أرسل الحالة المختارة
   * الهدف: لا تظهر أبداً ليدات new / assigned / open_sea هنا
   */
  const apiStatus = statusFilter === 'all' ? POOL_STATUSES : statusFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads', page, debouncedSearch, statusFilter, dateFrom, dateTo],
    queryFn:  () => leadsApi.list({
      page,
      search:    debouncedSearch || undefined,
      status:    apiStatus,
      date_from: dateFrom || undefined,
      date_to:   dateTo || undefined,
      exclude_subscribed: 1,
    }),
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
          <p className="text-muted-foreground text-sm mt-0.5" dir="ltr">
            {data ? `${data.total} leads` : ' '}
          </p>
        </div>
      </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone…"
              dir="auto"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-9"
            />
          </div>

          {/* Status + date filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

            {/* Status filter — pool statuses only */}
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v as LeadStatus | 'all'); setPage(1); }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {POOL_FILTER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS_EN[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range — the date the lead was added */}
            <DateRangeFilter
              from={dateFrom}
              to={dateTo}
              onFrom={(v) => { setDateFrom(v); setPage(1); }}
              onTo={(v) => { setDateTo(v); setPage(1); }}
              onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            />

            {/* Clear all filters */}
            {hasFilters && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(1); }}
                className="text-muted-foreground text-xs gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">Leads</CardTitle>
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
                    {hasFilters
                      ? 'No leads match these filters'
                      : 'No leads in the pool yet — leads move here once work on them starts'}
                  </p>
                </div>
              }
            />

            {/* Pagination */}
            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground" dir="ltr">
                  Page {data.current_page} of {data.last_page}
                  {' '}·{' '}
                  {data.total} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm"
                    disabled={page === data.last_page}
                    onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}

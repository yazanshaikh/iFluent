import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { leadsApi, type DemoBooking } from '@/api/leads';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Badge }   from '@/components/ui/badge';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, CalendarClock, ChevronLeft, X, Loader2, CalendarPlus } from 'lucide-react';
import { BookDemoDialog } from '@/components/demo/BookDemoDialog';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { useDebounced } from '@/hooks/useDebounced';

/* ── Status helpers ─────────────────────────────────────────────────────────── */
// Support both SessionRequest statuses AND Session statuses
const STATUS_LABEL: Record<string, string> = {
  pending:   'قيد الانتظار',
  confirmed: 'مؤكدة',
  rejected:  'مرفوضة',
  cancelled: 'ملغاة',
  expired:   'منتهية',
  waiting:   'قيد الانتظار',
  active:    'جارية الآن',
  completed: 'مكتملة',
};

function getStatusLabel(status: string, attendanceStatus?: string | null): string {
  if (status === 'completed' || attendanceStatus) {
    if (attendanceStatus === 'attended')       return '✅ مكتملة';
    if (attendanceStatus === 'absent')         return '😔 غياب الطالب';
    if (attendanceStatus === 'teacher_absent') return '🚫 غياب المعلم';
  }
  return STATUS_LABEL[status] ?? status;
}

function getStatusVariant(status: string, attendanceStatus?: string | null): 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning' {
  if (attendanceStatus === 'attended')       return 'success';
  if (attendanceStatus === 'absent')         return 'warning';
  if (attendanceStatus === 'teacher_absent') return 'destructive';
  return STATUS_VARIANT[status] ?? 'outline';
}

/** الحالات الظاهرة في فلتر الصفحة فقط */
const FILTER_STATUSES = ['pending', 'cancelled', 'expired'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning'> = {
  // SessionRequest statuses
  pending:   'secondary',
  confirmed: 'success',
  rejected:  'destructive',
  cancelled: 'outline',
  expired:   'warning',
  // Session statuses
  waiting:    'secondary',
  active:     'success',
  completed:  'warning',  // ← Yellow/warning for completed
};

const ROLE_LABEL: Record<string, string> = {
  cc: 'CC', ss: 'LP', super_admin: 'مدير النظام',
};

// Arabic month and day names with the Latin digits used across the CRM
const AR_LOCALE = 'ar-JO-u-nu-latn';

/* ── Columns ────────────────────────────────────────────────────────────────── */
interface RowActions {
  onCancel:   (b: DemoBooking) => void;
  onBook:     (b: DemoBooking) => void;
  cancelingId: number | null;
}

function useColumns(showStaff: boolean, actions: RowActions | null): ColumnDef<DemoBooking, unknown>[] {
  const navigate = useNavigate();

  const cols: ColumnDef<DemoBooking, unknown>[] = [
    {
      accessorKey: 'lead',
      header: ({ column }) => <SortableHeader column={column} label="العميل" />,
      cell: ({ row }) => row.original.lead ? (
        <div>
          <p className="font-medium">{row.original.lead.name}</p>
          <p dir="ltr" className="text-xs text-muted-foreground">{row.original.lead.phone}</p>
        </div>
      ) : <span className="text-muted-foreground text-xs">—</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'scheduled_at',
      header: ({ column }) => <SortableHeader column={column} label="موعد الحصة" />,
      cell: ({ row }) => {
        const d = new Date(row.original.scheduled_at);
        return (
          <div className="text-sm">
            <p className="font-medium">
              {d.toLocaleDateString(AR_LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-muted-foreground">
              {d.toLocaleTimeString(AR_LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} label="الحالة" />,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <Badge className="whitespace-nowrap" variant={getStatusVariant(s.status, (s as any).attendance_status)}>
            {getStatusLabel(s.status, (s as any).attendance_status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} label="تاريخ الحجز" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString(AR_LOCALE)}
        </span>
      ),
    },
  ];

  // Admin / LP extra column — show assigned CC
  if (showStaff) {
    cols.splice(1, 0, {
      id: 'assigned_to',
      header: 'الموظف',
      enableSorting: false,
      cell: ({ row }) => row.original.assigned_to ? (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs font-mono">
            {ROLE_LABEL[row.original.assigned_to.role] ?? row.original.assigned_to.role.toUpperCase()}
          </Badge>
          <span className="text-sm">{row.original.assigned_to.name}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">غير معيّن</span>
      ),
    });
  }

  // Actions column — cancel / book (admin + LP) + open lead profile
  cols.push({
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const booking = row.original;
      const isActive = booking.status === 'pending' || booking.status === 'confirmed';
      return (
        <div className="flex items-center justify-end gap-1.5">
          {actions && booking.status === 'pending' && (
            <Button
              size="sm" variant="outline"
              className="text-destructive hover:text-destructive border-red-300 text-xs h-7 px-2"
              disabled={actions.cancelingId === booking.id}
              onClick={(e) => { e.stopPropagation(); actions.onCancel(booking); }}
            >
              {actions.cancelingId === booking.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : 'إلغاء الحصة'}
            </Button>
          )}
          {actions && booking.lead && !isActive && (
            <Button
              size="sm" variant="outline"
              className="text-xs h-7 px-2 gap-1"
              onClick={(e) => { e.stopPropagation(); actions.onBook(booking); }}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              حجز حصة
            </Button>
          )}
          {booking.lead && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/leads/${booking.lead!.id}`); }}
              className="p-1 hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    },
  });

  return cols;
}

/* ── Page ───────────────────────────────────────────────────────────────────── */
export default function TrialBookingsPage() {
  const user    = useAuthStore((s) => s.user);
  // Admin and LP (ss) see every booking + the employee column
  const seesAll = user?.role === 'super_admin' || user?.role === 'ss';

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<DemoBooking['status'] | 'all'>('all');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [page,         setPage]         = useState(1);

  const hasFilters = search || statusFilter !== 'all' || dateFrom || dateTo;
  const debouncedSearch = useDebounced(search.trim());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['demo-bookings', page, debouncedSearch, statusFilter, dateFrom, dateTo],
    queryFn: () => leadsApi.listDemoBookings({
      page,
      search:    debouncedSearch || undefined,
      status:    statusFilter !== 'all' ? statusFilter : undefined,
      date_from: dateFrom || undefined,
      date_to:   dateTo   || undefined,
    }),
    staleTime: 30_000,
  });

  // Admin + LP can cancel / book trial sessions straight from this page
  const qc = useQueryClient();
  const [bookLeadId, setBookLeadId] = useState<number | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (id: number) => leadsApi.cancelDemo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['demo-bookings'] }),
    onError: (err: any) => alert(err?.response?.data?.message ?? 'تعذر إلغاء الحصة'),
  });

  const columns = useColumns(seesAll, seesAll ? {
    cancelingId: cancelMutation.isPending ? (cancelMutation.variables ?? null) : null,
    onCancel: (b) => {
      if (confirm(`هل تريد إلغاء الحصة التقييمية الخاصة بـ ${b.lead?.name ?? 'هذا العميل'}؟`)) cancelMutation.mutate(b.id);
    },
    onBook: (b) => b.lead && setBookLeadId(b.lead.id),
  } : null);
  const bookings = data?.data ?? [];

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6" />
            Trial Bookings
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data ? `عدد الحصص التقييمية: ${data.total}` : ' '}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو رقم الهاتف…"
            dir="auto"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pr-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as DemoBooking['status'] | 'all'); setPage(1); }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {FILTER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range — session date */}
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFrom={(v) => { setDateFrom(v); setPage(1); }}
            onTo={(v) => { setDateTo(v); setPage(1); }}
            onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
          />

          {hasFilters && (
            <Button
              variant="ghost" size="sm"
              onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-muted-foreground text-xs gap-1"
            >
              <X className="h-3.5 w-3.5" />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold">الحصص التقييمية المحجوزة</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={bookings}
            isLoading={isLoading}
            isError={isError}
            emptyState={
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <p className="text-3xl">📅</p>
                <p>
                  {hasFilters
                    ? 'لا توجد حصص مطابقة لهذه الفلاتر'
                    : 'لا توجد حصص تقييمية محجوزة حتى الآن'}
                </p>
              </div>
            }
          />

          {/* Pagination */}
          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                صفحة {data.current_page} من {data.last_page} · {data.total} نتيجة
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

      {bookLeadId !== null && (
        <BookDemoDialog
          leadId={bookLeadId}
          open
          onClose={() => setBookLeadId(null)}
        />
      )}
    </div>
  );
}

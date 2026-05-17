import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { leadsApi, type Lead } from '@/api/leads';
import { useAuthStore } from '@/stores/authStore';
import { STATUS_LABELS, STATUS_VARIANT } from './Leads';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Badge }   from '@/components/ui/badge';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Gem, X } from 'lucide-react';

const PER_PAGE = 20;

export default function SmallTreasuryPage() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const user      = useAuthStore((s) => s.user);
  const isAdmin   = user?.role === 'super_admin';

  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['small-treasury', page, search],
    queryFn: () => leadsApi.list({
      is_small_treasure: 1,
      page,
      per_page: PER_PAGE,
      search:   search || undefined,
    }),
    staleTime: 30_000,
  });

  /* ── Remove from treasury ── */
  const removeMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.toggleSmallTreasure(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['small-treasury'] });
      qc.invalidateQueries({ queryKey: ['lead'] });
    },
  });

  const columns: ColumnDef<Lead, unknown>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="الاسم" />,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium hover:underline hover:text-primary transition-colors text-right"
          onClick={(e) => { e.stopPropagation(); navigate(`/leads/${row.original.id}`); }}
        >
          {row.original.name}
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
      header: 'الحالة',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    /* عمود الموظف — للمدير فقط */
    ...(isAdmin ? [{
      id: 'assigned',
      header: 'الموظف',
      enableSorting: false,
      cell: ({ row }: { row: { original: Lead } }) => {
        const staff = (row.original as Lead & { assigned_to?: { id: number; name: string } | null }).assigned_to;
        return (
          <span className="text-xs text-muted-foreground">
            {typeof staff === 'object' && staff?.name ? staff.name : '—'}
          </span>
        );
      },
    } satisfies ColumnDef<Lead, unknown>] : []),
    {
      id: 'remove',
      header: '',
      enableSorting: false,
      cell: ({ row }: { row: { original: Lead } }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={removeMutation.isPending && removeMutation.variables === row.original.id}
            onClick={() => removeMutation.mutate(row.original.id)}
            title="إزالة من Small Treasury"
          >
            {removeMutation.isPending && removeMutation.variables === row.original.id
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <X className="h-3 w-3" />}
            إزالة
          </Button>
        </div>
      ),
    },
  ];

  const leads = data?.data ?? [];

  return (
    <div className="p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gem className="h-6 w-6 text-amber-500" />
            Small Treasury
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            ليدات محمية من الانتقال للبحر المفتوح — سقف {isAdmin ? 'كل موظف' : 'حسابك'} 30 ليدة
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2 self-center">
            <span className="text-3xl font-bold text-amber-500">{data.total}</span>
            <span className="text-sm text-muted-foreground">ليدة</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث بالاسم أو الرقم..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pr-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0 flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gem className="h-4 w-4 text-amber-500" />
            قائمة الليدات المحمية
          </CardTitle>
          {data && (
            <p className="text-xs text-muted-foreground">
              {PER_PAGE} لكل صفحة · {data.total} إجمالي
            </p>
          )}
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
                <p className="text-4xl">💎</p>
                <p className="font-medium">لا توجد ليدات في Small Treasury</p>
                <p className="text-xs">أضف ليدات مهمة من داخل بروفايل الليدة لحمايتها من البحر المفتوح</p>
              </div>
            }
          />

          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                صفحة {data.current_page} من {data.last_page} · {data.total} نتيجة
              </p>
              <div className="flex items-center gap-2">
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ColumnDef } from '@tanstack/react-table';

import { leadsApi, type Lead, type CreateLeadPayload } from '@/api/leads';
import { staffApi }   from '@/api/staff';
import { useAuthStore } from '@/stores/authStore';

import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, UserRoundCog, Gem, Plus } from 'lucide-react';

const PER_PAGE = 10;

/* ══════════════════════════ Add Lead Dialog ══════════════════════════════ */
const leadSchema = z.object({
  name:   z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone:  z.string().min(7, 'رقم الجوال غير صحيح'),
  source: z.string().optional(),
  age:    z.string().optional(),
});
type LeadFormData = z.infer<typeof leadSchema>;

type ConflictType = 'own' | 'open_sea' | 'other_staff' | 'admin_pool' | null;
interface ConflictInfo { type: ConflictType; message: string; leadId?: number }

function AddLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>({
    resolver:      zodResolver(leadSchema),
    defaultValues: { name: '', phone: '', source: '', age: '' },
  });
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['new-leads'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      reset();
      setConflict(null);
      onClose();
    },
    onError: (err: unknown) => {
      const res = (err as { response?: { data?: { message?: string; conflict?: string; lead_id?: number } } })
        ?.response?.data;
      if (res?.conflict) {
        setConflict({ type: res.conflict as ConflictType, message: res.message ?? '', leadId: res.lead_id });
      } else {
        setConflict(null);
      }
    },
  });

  const onSubmit = handleSubmit((data) => {
    setConflict(null);
    mutation.mutate({
      name:   data.name,
      phone:  data.phone,
      source: data.source || undefined,
      age:    data.age ? Number(data.age) : undefined,
    });
  });

  /* conflict-specific actions */
  const conflictAction = conflict?.type === 'own' && conflict.leadId
    ? { label: 'فتح البروفايل', onClick: () => { onClose(); navigate(`/leads/${conflict.leadId}`); } }
    : conflict?.type === 'open_sea'
    ? { label: 'الذهاب للبحر المفتوح', onClick: () => { onClose(); navigate('/open-sea'); } }
    : null;

  const genericError = mutation.error && !conflict
    ? ((mutation.error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'حدث خطأ أثناء الإضافة')
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setConflict(null); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
          <DialogDescription>أدخل بيانات العميل المحتمل — سيظهر هنا في قائمة New Lead</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="al-name">الاسم <span className="text-destructive">*</span></Label>
              <Input id="al-name" placeholder="محمد أحمد" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="al-phone">رقم الجوال <span className="text-destructive">*</span></Label>
              <Input id="al-phone" dir="ltr" placeholder="+966 5x xxx xxxx" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="al-source">المصدر (اختياري)</Label>
              <Input id="al-source" placeholder="إنستغرام، واتساب…" {...register('source')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="al-age">العمر (اختياري)</Label>
              <Input id="al-age" type="number" min={5} max={100} placeholder="25" dir="ltr" {...register('age')} />
            </div>
          </div>

          {/* Conflict banner */}
          {conflict && (
            <div className={`rounded-md px-3 py-2.5 text-sm flex items-start justify-between gap-3 ${
              conflict.type === 'other_staff'
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300'
            }`}>
              <span>{conflict.message}</span>
              {conflictAction && (
                <button
                  type="button"
                  onClick={conflictAction.onClick}
                  className="shrink-0 underline text-xs font-semibold whitespace-nowrap"
                >
                  {conflictAction.label}
                </button>
              )}
            </div>
          )}

          {genericError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{genericError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending || conflict?.type === 'other_staff'}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              إضافة العميل
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════ Assign Dialog ════════════════════════════════ */
interface AssignDialogProps {
  lead:      Lead;
  onClose:   () => void;
}

function AssignDialog({ lead, onClose }: AssignDialogProps) {
  const qc = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState('');

  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn:  staffApi.list,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (staffId: number) => leadsApi.assign(lead.id, staffId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['new-leads'] });
      onClose();
    },
  });

  const apiError = (mutation.error as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message ?? (mutation.error ? 'حدث خطأ' : null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundCog className="h-5 w-5 text-primary" />
            تعيين ليد جديد
          </DialogTitle>
          <DialogDescription>
            اختر موظفاً لتعيين <strong>{lead.name}</strong> إليه
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
                      ({s.role === 'ss' ? 'LP' : s.role.toUpperCase()})
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
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button
            onClick={() => mutation.mutate(Number(selectedStaff))}
            disabled={mutation.isPending || !selectedStaff}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
            تعيين
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════ Main Page ════════════════════════════════════ */
export default function NewLeadsPage() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'super_admin';
  const navigate = useNavigate();

  const [page,         setPage]         = useState(1);
  const [addOpen,      setAddOpen]      = useState(false);
  const [assignTarget, setAssignTarget] = useState<Lead | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['new-leads', page, isAdmin],
    queryFn: () => leadsApi.list({
      status:     'new',
      page,
      per_page:   PER_PAGE,
      // Admin → فقط غير المعيّنة | موظف → الـ backend يفلتر تلقائياً بـ assigned_to=me
      ...(isAdmin ? { unassigned: 1 as const } : {}),
    }),
    staleTime: 30_000,
  });

  /* ── Columns ── */
  const columns: ColumnDef<Lead, unknown>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="الاسم" />,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium hover:underline hover:text-primary transition-colors text-right"
          onClick={(e) => { e.stopPropagation(); navigate(`/leads/${row.original.id}`); }}
          className="flex items-center gap-1.5 font-medium hover:underline hover:text-primary transition-colors text-right"
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
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} label="تاريخ الإضافة" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.created_at).toLocaleDateString('ar-JO', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      accessorKey: 'demo_session',
      header: 'موعد الحصة',
      enableSorting: false,
      cell: ({ row }) => row.original.demo_session?.scheduled_at ? (
        <span className="text-xs text-primary font-medium">
          {new Date(row.original.demo_session.scheduled_at).toLocaleDateString('ar-JO', {
            day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Amman',
          })}
          {' '}
          {new Date(row.original.demo_session.scheduled_at).toLocaleTimeString('ar-JO', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Amman',
          })}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    /* عمود الإجراءات — يظهر للمدير فقط */
    ...(isAdmin
      ? [{
          id: 'actions',
          header: '',
          enableSorting: false,
          cell: ({ row }: { row: { original: Lead } }) => (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => setAssignTarget(row.original)}
              >
                <UserRoundCog className="h-3 w-3" />
                تعيين
              </Button>
            </div>
          ),
        } satisfies ColumnDef<Lead, unknown>]
      : []),
  ];

  const leads = data?.data ?? [];

  return (
    <>
      <AddLeadDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Assign dialog — admin only */}
      {assignTarget && (
        <AssignDialog lead={assignTarget} onClose={() => setAssignTarget(null)} />
      )}

      <div className="p-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-emerald-500" />
              الليدات الجديدة
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isAdmin
                ? 'ليدات جديدة بدون تواصل — وزّعها على الموظفين'
                : 'الليدات الجديدة المعيّنة لك — ابدأ التواصل وسجّل الحالة'}
            </p>
          </div>
          <div className="flex items-center gap-3 self-center">
            {data && (
              <span className="text-3xl font-bold text-emerald-600">
                {data.total}
                <span className="text-sm font-normal text-muted-foreground mr-1">ليد</span>
              </span>
            )}
            <Button className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              إضافة عميل
            </Button>
          </div>
        </div>

        {/* Info banner للموظف */}
        {!isAdmin && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            💡 بعد تسجيل الحالة (تم التواصل، مهتم…) ينتقل الليد تلقائياً إلى{' '}
            <strong>Lead Pool</strong> مرتّباً حسب الحالة.
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-0 flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">قائمة الليدات الجديدة</CardTitle>
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
              onRowClick={(row) => navigate(`/leads/${row.id}`)}
              emptyState={
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <p className="text-4xl">✅</p>
                  <p className="font-medium">
                    {isAdmin
                      ? 'لا توجد ليدات جديدة في الانتظار — أحسنتم!'
                      : 'لا توجد ليدات جديدة معيّنة لك حالياً'}
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}>
                    السابق
                  </Button>

                  {Array.from({ length: data.last_page }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === data.last_page || Math.abs(n - page) <= 1)
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

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Presentation, Trash2, Users } from 'lucide-react';
import { groupClassesApi, type GroupClassPayload, type GroupClassRow, type GroupClassStatus } from '@/api/groupClasses';
import { lessonsApi } from '@/api/checkout';
import { teachersApi } from '@/api/teachers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClassFields, EMPTY_DRAFT, draftComplete, type ClassDraft } from '@/components/groupClasses/ClassFields';
import { fromIso, toApiTime } from '@/components/groupClasses/classTime';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<GroupClassStatus, string> = {
  scheduled: 'Scheduled',
  active:    'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_VARIANT: Record<GroupClassStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  active:    'default',
  completed: 'outline',
  cancelled: 'destructive',
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Amman',
  });

type ApiError = { response?: { data?: { message?: string; errors?: Record<string, string | string[]> } } };

const apiMessage = (error: unknown) =>
  (error as ApiError)?.response?.data?.message ?? 'Something went wrong. Please try again.';

const toPayload = (draft: ClassDraft): GroupClassPayload => ({
  teacher_id:   Number(draft.teacher_id),
  lesson_id:    Number(draft.lesson_id),
  scheduled_at: toApiTime(draft.time!),
  max_seats:    Number(draft.max_seats),
});

/** Admin: schedule group classes. The assigned teacher starts them from the teacher app. */
export default function GroupClassesPage() {
  const queryClient = useQueryClient();
  const [page, setPage]             = useState(1);
  // Upcoming = scheduled / live; Ended = completed or cancelled, with filters
  const [view, setView]             = useState<'upcoming' | 'ended'>('upcoming');
  const [endedStatus, setEndedStatus] = useState<'' | 'completed' | 'cancelled'>('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [rowError, setRowError]     = useState('');
  const [viewing, setViewing]       = useState<GroupClassRow | null>(null);

  // Create: any number of rows, saved together
  const [createOpen, setCreateOpen] = useState(false);
  const [drafts, setDrafts]         = useState<ClassDraft[]>([EMPTY_DRAFT]);
  const [rowErrors, setRowErrors]   = useState<Record<number, string>>({});
  const [createError, setCreateError] = useState('');

  // Edit one class
  const [editing, setEditing]       = useState<GroupClassRow | null>(null);
  const [editDraft, setEditDraft]   = useState<ClassDraft>(EMPTY_DRAFT);
  const [editError, setEditError]   = useState('');

  const formOpen = createOpen || editing !== null;

  const { data, isLoading } = useQuery({
    queryKey: ['group-classes', view, page, endedStatus, dateFrom, dateTo],
    queryFn:  () => groupClassesApi.list({
      page,
      scope: view,
      ...(view === 'ended' && endedStatus ? { status: endedStatus } : {}),
      ...(view === 'ended' && dateFrom ? { date_from: dateFrom } : {}),
      ...(view === 'ended' && dateTo ? { date_to: dateTo } : {}),
    }),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn:  teachersApi.list,
    enabled:  formOpen,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-all'],
    queryFn:  lessonsApi.getAll,
    enabled:  formOpen,
    staleTime: 10 * 60_000,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['group-class-students', viewing?.id],
    queryFn:  () => groupClassesApi.students(viewing!.id),
    enabled:  viewing !== null,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['group-classes'] });

  const createMutation = useMutation({
    mutationFn: () => groupClassesApi.createMany(drafts.map(toPayload)),
    onSuccess: () => {
      setCreateOpen(false);
      refresh();
    },
    onError: (error) => {
      const errors = (error as ApiError)?.response?.data?.errors ?? {};
      const byRow: Record<number, string> = {};
      Object.entries(errors).forEach(([key, value]) => {
        // Batch rules come back as { "0": "..." }, field rules as { "classes.0.lesson_id": [...] }
        const index = Number(key.match(/^(?:classes\.)?(\d+)/)?.[1]);
        if (!Number.isNaN(index)) byRow[index] ??= Array.isArray(value) ? value[0] : value;
      });
      setRowErrors(byRow);
      setCreateError(Object.keys(byRow).length ? '' : apiMessage(error));
    },
  });

  const editMutation = useMutation({
    mutationFn: () => groupClassesApi.update(editing!.id, toPayload(editDraft)),
    onSuccess:  () => { setEditing(null); refresh(); },
    onError:    (error) => setEditError(apiMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => groupClassesApi.cancel(id),
    onSuccess:  () => { setRowError(''); refresh(); },
    onError:    (error) => setRowError(apiMessage(error)),
  });

  const openCreate = () => {
    setDrafts([EMPTY_DRAFT]);
    setRowErrors({});
    setCreateError('');
    setCreateOpen(true);
  };

  const openEdit = (row: GroupClassRow) => {
    setEditDraft({
      teacher_id: String(row.teacher?.id ?? ''),
      lesson_id:  String(row.lesson?.id ?? ''),
      time:       fromIso(row.scheduled_at),
      max_seats:  String(row.max_seats),
    });
    setEditError('');
    setEditing(row);
  };

  const updateDraft = (index: number, draft: ClassDraft) => {
    setDrafts((current) => current.map((d, i) => (i === index ? draft : d)));
    setRowErrors((current) => { const { [index]: _, ...rest } = current; return rest; });
  };

  // Rows shift when one is removed, so stale per-row errors are dropped.
  const removeDraft = (index: number) => {
    setDrafts((current) => current.filter((_, i) => i !== index));
    setRowErrors({});
  };

  const handleCancel = (row: GroupClassRow) => {
    const message = row.registered_count > 0
      ? `Cancel "${row.title}"? ${row.registered_count} registered student(s) will get their credit back.`
      : `Cancel "${row.title}"?`;
    if (window.confirm(message)) cancelMutation.mutate(row.id);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl" dir="ltr">
      <div className="flex items-center gap-3">
        <Presentation className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Group Classes</h1>
          <p className="text-sm text-muted-foreground">Schedule classes for students on a group subscription.</p>
        </div>
        <Button className="ml-auto" onClick={openCreate}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          New Classes
        </Button>
      </div>

      <div className="flex gap-1 border-b">
        {([['upcoming', 'Upcoming'], ['ended', 'Ended']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setView(key); setPage(1); }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
              view === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'ended' && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-0.5">
            <span className="block text-[11px] font-medium text-muted-foreground">Status</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={endedStatus}
              onChange={(e) => { setEndedStatus(e.target.value as typeof endedStatus); setPage(1); }}
            >
              <option value="">All</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFrom={(v) => { setDateFrom(v); setPage(1); }}
            onTo={(v) => { setDateTo(v); setPage(1); }}
            onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
          />
          {(endedStatus || dateFrom || dateTo) && (
            <Button
              variant="ghost" size="sm" className="text-muted-foreground"
              onClick={() => { setEndedStatus(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {rowError && <p className="text-sm text-destructive">{rowError}</p>}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.data.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            {view === 'upcoming'
              ? 'No upcoming group classes.'
              : endedStatus || dateFrom || dateTo ? 'No ended classes match these filters.' : 'No ended classes yet.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.data.map((row) => (
            <Card key={row.id}>
              <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{row.title}</p>
                    <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {row.lesson?.title ?? 'No lesson'} · {row.teacher?.name ?? 'No teacher'}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatTime(row.scheduled_at)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewing(row)}>
                  <Users className="h-4 w-4 mr-2" />
                  {row.registered_count} / {row.max_seats}
                </Button>
                {row.status === 'scheduled' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={cancelMutation.isPending}
                      onClick={() => handleCancel(row)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          {data.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {data.last_page}</span>
              <Button variant="outline" size="icon" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Create: any number of classes ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="ltr">
          <DialogHeader><DialogTitle>New Group Classes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div key={index} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Class {index + 1}</span>
                  {drafts.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeDraft(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <ClassFields
                  value={draft}
                  onChange={(value) => updateDraft(index, value)}
                  lessons={lessons}
                  teachers={teachers}
                  error={rowErrors[index]}
                />
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDrafts((current) => [...current, { ...EMPTY_DRAFT, max_seats: current[current.length - 1].max_seats }])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Class
            </Button>

            {createError && <p className="text-sm text-destructive">{createError}</p>}

            <Button
              className="w-full"
              disabled={!drafts.every(draftComplete) || createMutation.isPending}
              onClick={() => { setCreateError(''); setRowErrors({}); createMutation.mutate(); }}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create {drafts.length > 1 ? `${drafts.length} Classes` : 'Class'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit one class ── */}
      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-2xl" dir="ltr">
          <DialogHeader><DialogTitle>Edit Group Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {editing && editing.registered_count > 0 && (
              <p className="text-xs text-muted-foreground">
                {editing.registered_count} student(s) registered: the lesson can no longer change, and seats can't go below that number.
              </p>
            )}
            <ClassFields value={editDraft} onChange={setEditDraft} lessons={lessons} teachers={teachers} error={editError} />
            <Button
              className="w-full"
              disabled={!draftComplete(editDraft) || editMutation.isPending}
              onClick={() => { setEditError(''); editMutation.mutate(); }}
            >
              {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewing !== null} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="max-w-sm" dir="ltr">
          <DialogHeader><DialogTitle>Registered Students</DialogTitle></DialogHeader>
          {loadingStudents ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : students.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No students registered yet.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((student) => (
                <li key={student.student_id} className="flex items-center justify-between text-sm">
                  <span>{student.name ?? '—'}</span>
                  {student.joined && <Badge variant="secondary">Joined</Badge>}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

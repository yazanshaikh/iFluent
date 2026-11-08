import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teachersApi, type TeacherStudent } from '@/api/teachers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Loader2, Plus, UserMinus, ChevronLeft } from 'lucide-react';

/**
 * "طلاب المعلم" — the subscribed students this teacher is responsible for.
 * Admin + LP can add (from students with no teacher yet) and remove.
 */
export function TeacherStudentsCard({
  teacherId, teacherName, teacherActive, canEdit,
}: {
  teacherId:     number;
  teacherName:   string;
  teacherActive: boolean;
  canEdit:       boolean;
}) {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const [pick,  setPick]  = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn:  () => teachersApi.students(teacherId),
  });

  // Students with no teacher yet — only fetched when the dropdown can be used
  const { data: unassigned = [], isLoading: unassignedLoading } = useQuery({
    queryKey: ['unassigned-students'],
    queryFn:  teachersApi.unassigned,
    enabled:  canEdit && teacherActive,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['teacher-students', teacherId] });
    qc.invalidateQueries({ queryKey: ['unassigned-students'] });
    qc.invalidateQueries({ queryKey: ['teachers'] });
    qc.invalidateQueries({ queryKey: ['lead'] });
  };
  const onError = (e: any) => setError(e?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى');

  const assign = useMutation({
    mutationFn: (studentId: number) => teachersApi.assign(teacherId, studentId),
    onSuccess: () => { setPick(''); setError(null); refresh(); },
    onError,
  });

  const unassign = useMutation({
    mutationFn: (studentId: number) => teachersApi.unassign(teacherId, studentId),
    onSuccess: () => { setError(null); refresh(); },
    onError,
  });

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          طلاب المعلم
          <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
            {students.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">

        {/* Add a student (only students with no teacher yet are offered) */}
        {canEdit && (
          teacherActive ? (
            <div className="flex items-center gap-2">
              <Select value={pick} onValueChange={setPick} disabled={assign.isPending}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={unassignedLoading ? 'جارٍ التحميل…' : 'اختر طالباً لإضافته…'} />
                </SelectTrigger>
                <SelectContent>
                  {unassigned.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      كل الطلاب المشتركين معيّنون لمعلمين
                    </div>
                  ) : unassigned.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                      {s.phone && <span className="text-muted-foreground text-xs">{' — '}<bdi dir="ltr">{s.phone}</bdi></span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-1.5 shrink-0"
                disabled={!pick || assign.isPending}
                onClick={() => assign.mutate(Number(pick))}
              >
                {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                إضافة
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              المعلم معطّل — لا يمكن إضافة طلاب جدد له.
            </p>
          )
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}

        {/* Assigned students */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            لا يوجد طلاب مع هذا المعلم بعد
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {students.map((s: TeacherStudent) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  className="flex-1 min-w-0 text-right group disabled:cursor-default"
                  disabled={!s.lead_id}
                  onClick={() => s.lead_id && navigate(`/leads/${s.lead_id}`)}
                >
                  <p className="text-sm font-medium truncate group-hover:text-primary">
                    {s.name}
                  </p>
                  {s.phone && (
                    <p className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: 'right' }}>{s.phone}</p>
                  )}
                </button>

                {s.subscription ? (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.subscription.lessons_count
                      ? `${s.subscription.lessons_count} درس`
                      : `${s.subscription.months_count} شهر`}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-[10px] shrink-0">الاشتراك غير نشط</Badge>
                )}

                {s.lp && (
                  <Badge variant="success" className="text-[10px] shrink-0">LP: {s.lp.name}</Badge>
                )}

                {canEdit && (
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    disabled={unassign.isPending && unassign.variables === s.id}
                    title="حذف الطالب من عند المعلم"
                    onClick={() => {
                      if (confirm(`حذف ${s.name} من عند ${teacherName}؟ سيرجع لقائمة الطلاب بدون معلم.`)) {
                        unassign.mutate(s.id);
                      }
                    }}
                  >
                    {unassign.isPending && unassign.variables === s.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <UserMinus className="h-3.5 w-3.5" />}
                  </Button>
                )}

                {s.lead_id && <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

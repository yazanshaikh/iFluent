import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '@/api/teachers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, GraduationCap, Loader2, Users } from 'lucide-react';

/** LP: all teachers → open one to manage the students assigned to them. */
export default function TeachersPage() {
  const navigate = useNavigate();
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn:  teachersApi.list,
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl" dir="rtl">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-sm text-muted-foreground">افتح المعلم لإدارة الطلاب المسؤول عنهم</p>
        </div>
        <Badge variant="secondary" className="font-mono mr-auto">{teachers.length} معلم</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">لا يوجد معلمون</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {teachers.map((t) => (
            <Card
              key={t.id}
              className="hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/teachers/${t.id}`)}
            >
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">{t.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  {t.teacher_code && (
                    <p className="text-xs font-mono text-muted-foreground">{t.teacher_code}</p>
                  )}
                </div>
                {!t.is_active && <Badge variant="outline">معطّل</Badge>}
                <Badge variant={t.students_count ? 'success' : 'secondary'} className="gap-1">
                  <Users className="h-3 w-3" />
                  {t.students_count} طالب
                </Badge>
                <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

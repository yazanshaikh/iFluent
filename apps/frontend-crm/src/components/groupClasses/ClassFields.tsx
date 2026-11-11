import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LessonOption } from '@/api/checkout';
import type { TeacherListItem } from '@/api/teachers';
import { ClassTimePicker } from './ClassTimePicker';
import type { ClassTime } from './classTime';

export interface ClassDraft {
  teacher_id: string;
  lesson_id:  string;
  time:       ClassTime | null;
  max_seats:  string;
}

export const EMPTY_DRAFT: ClassDraft = { teacher_id: '', lesson_id: '', time: null, max_seats: '20' };

export const draftComplete = (d: ClassDraft) =>
  !!d.teacher_id && !!d.lesson_id && !!d.time && Number(d.max_seats) >= 2;

const SELECT_CLASS = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

/** Lesson, teacher, time and seats for one class. */
export function ClassFields({ value, onChange, lessons, teachers, error }: {
  value:    ClassDraft;
  onChange: (value: ClassDraft) => void;
  lessons:  LessonOption[];
  teachers: TeacherListItem[];
  error?:   string;
}) {
  const set = <K extends keyof ClassDraft>(key: K, v: ClassDraft[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Lesson</Label>
          <select className={SELECT_CLASS} value={value.lesson_id} onChange={(e) => set('lesson_id', e.target.value)}>
            <option value="">Select a lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>{lesson.id}. {lesson.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Teacher</Label>
          <select className={SELECT_CLASS} value={value.teacher_id} onChange={(e) => set('teacher_id', e.target.value)}>
            <option value="">Select a teacher</option>
            {teachers.filter((t) => t.is_active).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Seats</Label>
          <Input type="number" min={2} max={200} value={value.max_seats} onChange={(e) => set('max_seats', e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Date and time (Jordan)</Label>
          <ClassTimePicker value={value.time} onChange={(time) => set('time', time)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

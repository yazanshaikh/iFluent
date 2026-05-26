import client from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Level {
  id:             number;
  code:           string;           // A1, A2, B1, B2, FT
  name:           string;           // Arabic name
  name_en:        string;
  order:          number;
  total_units:    number;
  total_lessons:  number;
  units:          Unit[];
}

export interface UnitEnrollment {
  status:       'active' | 'completed' | string;
  enrolled_at:  string | null;
  completed_at: string | null;
  expires_at:   string | null;
}

export interface Unit {
  id:           number;
  level_id:     number;
  name:         string;
  name_en:      string | null;
  order:        number;
  lesson_count: number;
  has_end_test: boolean;
  is_active:    boolean;
  enrollment:   UnitEnrollment | null;  // null means not enrolled
  lessons:      Lesson[];
}

export interface Lesson {
  id:              number;
  title:           string;
  order:           number;
  is_active:       boolean;
  is_locked:       boolean;        // gating: true until previous lesson passed
  nearpod_url:     string | null;
  is_assessment:   boolean;
}

export interface StudentProgress {
  lesson_id:        number;
  lesson_title:     string | null;
  best_score:       number | null;
  passed:           boolean;
  total_attempts:   number;
  lesson_completed: boolean;
  completed_at:     string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const levelsApi = {
  /** Full curriculum roadmap (all levels + units, locked status included) */
  listLevels: () =>
    client
      .get<{ data: Level[] }>('/student/levels')
      .then((r) => r.data.data),

  /** Only the units this student is enrolled in, with their lessons */
  myUnits: () =>
    client
      .get<{ data: Unit[] }>('/student/my-units')
      .then((r) => r.data.data),

  /** Single lesson detail */
  getLesson: (lessonId: number) =>
    client
      .get<{ data: Lesson }>(`/student/lessons/${lessonId}`)
      .then((r) => r.data.data),

  /** Student quiz for a lesson */
  getQuiz: (lessonId: number) =>
    client
      .get(`/student/lessons/${lessonId}/quiz`)
      .then((r) => r.data),

  /** Submit quiz answers */
  submitQuiz: (lessonId: number, answers: Record<number, string>) =>
    client
      .post(`/student/lessons/${lessonId}/quiz/submit`, { answers })
      .then((r) => r.data),

  /** Overall student progress */
  getProgress: () =>
    client
      .get<{ progress: StudentProgress[] }>('/student/progress')
      .then((r) => r.data.progress ?? []),
};

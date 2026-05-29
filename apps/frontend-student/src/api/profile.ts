import client from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  name:              string;
  phone:             string;
  timezone:          string | null;
  lesson_credits:    number;
  completed_lessons: number;
  passed_quizzes:    number;
  enrolled_units:    number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const profileApi = {
  /** GET /student/profile — returns the full profile including lesson_credits */
  get: (): Promise<Profile> =>
    client
      .get<{ profile: Profile }>('/student/profile')
      .then((r) => r.data.profile),
};

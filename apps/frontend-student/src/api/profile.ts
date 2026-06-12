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

export interface ProgressSummary {
  overall_pct:       number;
  completed_lessons: number;
  total_lessons:     number;
  learning_minutes:  number;
  passed_quizzes:    number;
  full_mark_quizzes: number;
  earned_badges:     number;
  total_badges:      number;
  achievements:      { id: number; earned: boolean }[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const profileApi = {
  /** GET /student/profile — returns the full profile including lesson_credits */
  get: (): Promise<Profile> =>
    client
      .get<{ profile: Profile }>('/student/profile')
      .then((r) => r.data.profile),

  /** GET /student/progress-summary — overall %, stats, achievement flags */
  progress: (): Promise<ProgressSummary> =>
    client
      .get<ProgressSummary>('/student/progress-summary')
      .then((r) => r.data),

  /** POST /student/device-token — save Expo push token for reminders */
  updateDeviceToken: (token: string): Promise<void> =>
    client
      .post('/student/device-token', { fcm_token: token })
      .then(() => undefined),

  /** POST /student/device-token with null — clear token to stop notifications */
  clearDeviceToken: (): Promise<void> =>
    client
      .post('/student/device-token', { fcm_token: '' })
      .then(() => undefined),
};

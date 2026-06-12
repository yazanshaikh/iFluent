import client from './client';

export interface TeacherAvailabilitySlot {
  day_of_week: number;   // 0 = Sunday … 6 = Saturday
  day_name:    string;
  start_time:  string;   // "HH:MM"
  end_time:    string;   // "HH:MM"
}

export interface TeacherProfile {
  teacher: {
    teacher_code:        string;
    name:                string | null;
    bio:                 string | null;
    specialization:      string | null;
    profile_photo:       string | null;
    avg_rating:          number | null;
    total_ratings:       number;
    sessions_completed:  number;
  };
  availability: TeacherAvailabilitySlot[];
}

export const teachersApi = {
  /** Public teacher profile + weekly availability, looked up by teacher code */
  getProfile: (teacherCode: string) =>
    client
      .get<TeacherProfile>(`/student/teachers/${encodeURIComponent(teacherCode)}`)
      .then((r) => r.data),
};

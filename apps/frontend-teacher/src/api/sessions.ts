import client from './client';

export interface TeacherSession {
  id:                number;
  status:            string;
  attendance_status: 'attended' | 'absent' | 'teacher_absent' | null;
  scheduled_at:      string | null;
  started_at:     string | null;
  ended_at:       string | null;
  daily_room_url: string | null;
  nearpod_pin:    string | null;
  student: {
    id:   number;
    name: string;
    age:  number | null;
  } | null;
  lesson: {
    id:             number;
    title:          string;
    order:          number | null;
    nearpod_url:        string | null;
    nearpod_lesson_id:  string | null;
    is_assessment:  boolean;
    level: {
      code: string;
      name: string;
    } | null;
    unit: {
      id:    number;
      name:  string;
      level: { code: string; name: string } | null;
    } | null;
  } | null;
  teacher: { id: number; name: string } | null;
}

export interface SessionStartError {
  message: string;
  reason?: 'too_early' | 'too_late';
  details?: string;
  can_start_at?: string;
  minutes_until_allowed?: number;
  deadline_was?: string;
  minutes_late?: number;
}

export const sessionsApi = {
  upcoming: () =>
    client
      .get<{ data: TeacherSession[] }>('/teacher/sessions')
      .then((r) => r.data.data),

  get: (id: number) =>
    client.get<{ data: TeacherSession }>(`/teacher/sessions/${id}`).then((r) => r.data.data),

  start: (id: number, nearpodPin: string) =>
    client.post<{ data: { daily_room_url: string; status: string } }>(`/teacher/sessions/${id}/start`, { nearpod_pin: nearpodPin })
      .then((r) => r.data.data),

  setNearpodPin: (id: number, pin: string) =>
    client.patch(`/teacher/sessions/${id}/pin`, { nearpod_pin: pin }).then((r) => r.data),

  release: (id: number) =>
    client.post(`/teacher/sessions/${id}/release`).then((r) => r.data),

  end: (id: number) =>
    client.post(`/teacher/sessions/${id}/end`).then((r) => r.data),

  classroomUrl: (id: number) =>
    client.get<{ daily_room_url: string; nearpod_pin: string | null }>(`/teacher/sessions/${id}/classroom-url`)
      .then((r) => r.data),

  getRaisedHands: (id: number) =>
    client.get<{ raised: boolean; data: { student_name: string; raised_at: string } | null }>(
      `/teacher/sessions/${id}/raised-hands`
    ).then((r) => r.data),
};

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
    nearpod_url:    string | null;
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

export const sessionsApi = {
  upcoming: () =>
    client
      .get<{ data: TeacherSession[] }>('/teacher/sessions')
      .then((r) => r.data.data),

  get: (id: number) =>
    client.get<{ data: TeacherSession }>(`/teacher/sessions/${id}`).then((r) => r.data.data),

  start: (id: number) =>
    client.post<{ status: string; daily_room_url: string }>(`/teacher/sessions/${id}/start`).then((r) => r.data),

  setNearpodPin: (id: number, pin: string) =>
    client.patch(`/teacher/sessions/${id}/pin`, { nearpod_pin: pin }).then((r) => r.data),

  release: (id: number) =>
    client.post(`/teacher/sessions/${id}/release`).then((r) => r.data),

  end: (id: number, attendanceStatus: 'attended' | 'absent' | 'teacher_absent') =>
    client.post(`/teacher/sessions/${id}/end`, { attendance_status: attendanceStatus }).then((r) => r.data),
};

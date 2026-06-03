import client from './client';

export interface TeacherSession {
  id:           number;
  status:       string;
  scheduled_at: string | null;
  started_at:   string | null;
  ended_at:     string | null;
  daily_room_url: string | null;
  nearpod_pin:  string | null;
  student:      { id: number; name: string } | null;
  lesson:       { id: number; title: string; nearpod_url: string | null } | null;
  teacher:      { id: number; name: string } | null;
}

export const sessionsApi = {
  upcoming: () =>
    client
      .get<{ data: TeacherSession[] }>('/teacher/sessions')
      .then((r) => r.data.data),

  get: (id: number) =>
    client.get<TeacherSession>(`/teacher/sessions/${id}`).then((r) => r.data),

  start: (id: number) =>
    client.post<{ status: string; daily_room_url: string }>(`/teacher/sessions/${id}/start`).then((r) => r.data),

  setNearpodPin: (id: number, pin: string) =>
    client.post(`/teacher/sessions/${id}/nearpod-pin`, { nearpod_pin: pin }).then((r) => r.data),

  end: (id: number, attendanceStatus: 'attended' | 'absent' | 'teacher_absent') =>
    client.post(`/teacher/sessions/${id}/end`, { attendance_status: attendanceStatus }).then((r) => r.data),
};

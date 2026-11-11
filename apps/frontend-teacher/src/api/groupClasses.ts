import client from './client';

export interface TeacherGroupClass {
  id:               number;
  title:            string;
  description:      string | null;
  status:           'scheduled' | 'active' | 'completed' | 'cancelled';
  scheduled_at:     string;
  max_seats:        number;
  registered_count: number;
  available_seats:  number;
  lesson: {
    id:          number;
    title:       string;
    order:       number | null;
    nearpod_url: string | null;
    level:       { code: string; name: string } | null;
  } | null;
  nearpod_pin:      string | null;
  daily_room_url:   string | null;
}

export interface RegisteredStudent {
  student_id: number;
  name:       string | null;
  joined:     boolean;
}

export const groupClassesApi = {
  list: () =>
    client.get<{ data: TeacherGroupClass[] }>('/teacher/group-classes').then((r) => r.data.data),

  get: (id: number) =>
    client
      .get<{ class: TeacherGroupClass; registered: RegisteredStudent[] }>(`/teacher/group-classes/${id}`)
      .then((r) => r.data),

  /** Needs the Nearpod PIN; same 15-minute window as individual lessons. */
  start: (id: number, nearpodPin: string) =>
    client
      .post<{ daily_room_url: string }>(`/teacher/group-classes/${id}/start`, { nearpod_pin: nearpodPin })
      .then((r) => r.data),

  setNearpodPin: (id: number, pin: string) =>
    client.patch(`/teacher/group-classes/${id}/pin`, { nearpod_pin: pin }).then((r) => r.data),

  /** The live room with the teacher's owner token (mute controls). */
  room: (id: number) =>
    client.get<{ daily_room_url: string }>(`/teacher/group-classes/${id}/room`).then((r) => r.data),

  end: (id: number) => client.post(`/teacher/group-classes/${id}/end`).then((r) => r.data),

  cancel: (id: number) => client.post(`/teacher/group-classes/${id}/cancel`).then((r) => r.data),
};

import client from './client';

export interface GroupClassItem {
  id:               number;
  title:            string;
  description:      string | null;
  status:           'scheduled' | 'active' | 'completed' | 'cancelled';
  scheduled_at:     string;
  teacher:          { name: string | null; code?: string | null };
  lesson:           { id: number; title: string; description: string | null; activity_url: string | null; pdf_url?: string | null } | null;
  lesson_number:    number | null;
  max_seats:        number;
  registered_count: number;
  available_seats:  number;
  is_registered:    boolean;
  is_full:          boolean;
  is_next:          boolean;
  /** Not registered, seats left, and more than 5 minutes before the start. */
  registration_open: boolean;
  /** Registered and more than 30 minutes before the start. */
  can_leave:        boolean;
  /** The class ended and the student attended it. */
  activity_unlocked: boolean;
  /** Only on «mine»: the class ended and the student had joined it. */
  attended?:        boolean;
}

export interface GroupClassList {
  data:        GroupClassItem[];
  next_lesson: { id: number; title: string } | null;
  credits:     number;
}

export const groupClassesApi = {
  list: () => client.get<GroupClassList>('/student/group-classes').then((r) => r.data),

  /** Every class the student registered for, upcoming and past. */
  mine: () =>
    client.get<{ data: GroupClassItem[] }>('/student/group-classes/mine').then((r) => r.data.data),

  get: (id: number) =>
    client.get<{ class: GroupClassItem }>(`/student/group-classes/${id}`).then((r) => r.data.class),

  register: (id: number) =>
    client.post<{ message: string }>(`/student/group-classes/${id}/register`).then((r) => r.data),

  leave: (id: number) =>
    client.post<{ message: string }>(`/student/group-classes/${id}/leave`).then((r) => r.data),

  join: (id: number) =>
    client
      .get<{ daily_room_url: string; nearpod_pin: string; nearpod_url: string }>(`/student/group-classes/${id}/join`)
      .then((r) => r.data),
};

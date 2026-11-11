import client from './client';

export type GroupClassStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface GroupClassRow {
  id:               number;
  title:            string;
  description:      string | null;
  status:           GroupClassStatus;
  scheduled_at:     string;
  max_seats:        number;
  registered_count: number;
  teacher:          { id: number; name: string } | null;
  lesson:           { id: number; title: string } | null;
}

export interface GroupClassStudent {
  student_id:    number;
  name:          string | null;
  registered_at: string | null;
  joined:        boolean;
}

export interface GroupClassPayload {
  teacher_id:   number;
  lesson_id:    number;
  /** Jordan local time, "YYYY-MM-DD HH:mm:00" */
  scheduled_at: string;
  max_seats:    number;
}

export const groupClassesApi = {
  /** Upcoming = scheduled or live; ended = completed or cancelled (filterable). */
  list: (params: {
    page:       number;
    scope:      'upcoming' | 'ended';
    status?:    'completed' | 'cancelled';
    date_from?: string;
    date_to?:   string;
  }) =>
    client
      .get<{ data: GroupClassRow[]; current_page: number; last_page: number; total: number }>('/admin/group-classes', { params })
      .then((r) => r.data),

  students: (id: number) =>
    client
      .get<{ registered: GroupClassStudent[] }>(`/admin/group-classes/${id}`)
      .then((r) => r.data.registered),

  /** All or none; on failure `errors` maps each failing row index to its reason. */
  createMany: (classes: GroupClassPayload[]) =>
    client.post<{ created: number }>('/admin/group-classes', { classes }).then((r) => r.data),

  update: (id: number, payload: GroupClassPayload) =>
    client.put(`/admin/group-classes/${id}`, payload).then((r) => r.data),

  cancel: (id: number) =>
    client.post<{ message: string }>(`/admin/group-classes/${id}/cancel`).then((r) => r.data),
};

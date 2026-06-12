import client from './client';

export interface SessionRequest {
  id:                   number;
  type:                 'demo' | 'core' | 'private' | 'group';
  status:               string;
  scheduled_at:         string | null;
  teacher_gender_pref:  'male' | 'female' | null;
  note:                 string | null;
  student: {
    id:   number;
    name: string;
    age:  number | null;
  } | null;
  lesson: {
    id:             number;
    title:          string;
    order:          number;
    is_assessment:  boolean;
    nearpod_url:    string | null;
    level: {
      code: string;
      name: string;
    } | null;
  } | null;
}

export const requestsApi = {
  list: (type: string) =>
    client
      .get<{ data: SessionRequest[] }>('/teacher/requests', { params: type ? { type } : {} })
      .then((r) => r.data.data ?? []),

  show: (id: number) =>
    client
      .get<{ data: SessionRequest }>(`/teacher/requests/${id}`)
      .then((r) => r.data.data),

  accept: (id: number, nearpodPin?: string) =>
    client.post(`/teacher/requests/${id}/accept`, { nearpod_pin: nearpodPin ?? null }).then((r) => r.data),

  reject: (id: number, reason?: string) =>
    client.post(`/teacher/requests/${id}/reject`, { reason }).then((r) => r.data),
};

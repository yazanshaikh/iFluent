import client from './client';

export interface SessionRequest {
  id:           number;
  type:         'demo' | 'core' | 'private' | 'group';
  status:       string;
  scheduled_at: string | null;
  student:      { id: number; name: string } | null;
  lesson:       { id: number; title: string } | null;
  session_id:   number | null;
}

export const requestsApi = {
  /** GET /teacher/requests?type=demo|core — pending requests for teacher */
  list: (type: string) => {
    const params: Record<string, string> = {};
    if (type === 'demo')    params.type = 'demo';
    if (type === 'core')    params.type = 'core';
    if (type === 'private') params.type = 'private';
    if (type === 'group')   params.type = 'group';
    return client
      .get<{ data: SessionRequest[] }>('/teacher/requests', { params })
      .then((r) => r.data.data ?? []);
  },

  accept: (id: number) =>
    client.post(`/teacher/requests/${id}/accept`).then((r) => r.data),

  reject: (id: number, reason?: string) =>
    client.post(`/teacher/requests/${id}/reject`, { reason }).then((r) => r.data),
};

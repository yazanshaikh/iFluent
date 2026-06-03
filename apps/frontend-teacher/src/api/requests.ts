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

const TYPE_ENDPOINT: Record<string, string> = {
  demo:    'demo',
  core:    'core',
  private: 'private',
  group:   'group',
};

export const requestsApi = {
  list: (type: string) =>
    client
      .get<{ data: SessionRequest[] }>(`/teacher/requests?type=${TYPE_ENDPOINT[type] ?? type}`)
      .then((r) => r.data.data),

  accept: (id: number) =>
    client.post(`/teacher/requests/${id}/accept`).then((r) => r.data),

  reject: (id: number, reason?: string) =>
    client.post(`/teacher/requests/${id}/reject`, { reason }).then((r) => r.data),
};

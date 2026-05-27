import api from './client';

export type MessageTarget = 'all' | 'subscribers' | 'non_subscribers';

export interface AdminMessage {
  id:               number;
  title:            string;
  body:             string;
  target:           MessageTarget;
  sent_by:          string;
  recipients_count: number;
  created_at:       string;
}

export const messagesApi = {
  list: () =>
    api.get<{ messages: AdminMessage[] }>('/admin/messages')
      .then((r) => r.data.messages),

  send: (payload: { title: string; body: string; target: MessageTarget }) =>
    api.post<{ message: string; id: number; recipients_count: number }>(
      '/admin/messages',
      payload,
    ).then((r) => r.data),
};

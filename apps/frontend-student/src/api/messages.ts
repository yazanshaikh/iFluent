import client from './client';

export interface StudentMessage {
  id:         number;
  title:      string;
  body:       string;
  read_at:    string | null;
  created_at: string;
}

export const studentMessagesApi = {
  list: () =>
    client
      .get<{ messages: StudentMessage[]; unread: number }>('/student/messages')
      .then((r) => r.data),

  unreadCount: () =>
    client
      .get<{ unread: number }>('/student/messages/unread-count')
      .then((r) => r.data.unread ?? 0),

  markRead: (id: number) =>
    client.post(`/student/messages/${id}/read`).then((r) => r.data),
};

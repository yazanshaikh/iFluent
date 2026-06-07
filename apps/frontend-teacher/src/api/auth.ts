import client from './client';

export interface TeacherUser {
  id:               number;
  name:             string;
  email:            string;
  role:             string;
  teacher_code?:    string;
  balance?:         number;
  commission_rate?: number;
  avg_rating?:      number | null;
  sessions_count?:  number;
  absences_count?:  number;
}

export interface LoginResponse {
  token: string;
  user:  TeacherUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    client
      .post<LoginResponse>('/teacher/auth/login', { email, password })
      .then((r) => r.data),

  logout: () =>
    client.post('/teacher/auth/logout').then((r) => r.data),

  me: () =>
    client.get<TeacherUser>('/teacher/auth/me').then((r) => r.data),
};

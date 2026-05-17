import api from './client';

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface AuthUser {
  id:    number;
  name:  string;
  email: string;
  role:  'crm_agent' | 'super_admin';
}

export interface LoginResponse {
  token: string;
  user:  AuthUser;
}

// baseURL = VITE_API_URL = http://...8000/api/v1
// ← المسارات هنا بدون /api/v1 لأنها موجودة في baseURL
export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/crm/auth/login', payload).then((r) => r.data),

  logout: () =>
    api.post('/crm/auth/logout').then((r) => r.data),

  me: () =>
    api.get<AuthUser>('/crm/auth/me').then((r) => r.data),
};

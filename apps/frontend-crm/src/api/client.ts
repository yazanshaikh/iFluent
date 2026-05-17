import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
// ↑ آمن: authStore يستورد فقط "import type" من auth.ts (يُحذف في runtime)
//   ← لا يوجد circular dependency حقيقي في وقت التشغيل

// VITE_API_URL = http://192.168.0.104:8000/api/v1 (يشمل /api/v1)
// مسارات الـ endpoints في auth.ts و leads.ts تبدأ بـ /auth/... و /crm/... (بدون /api/v1)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  // withCredentials غير مطلوب مع Bearer token — تفعيله يُلزم Laravel بـ
  // Access-Control-Allow-Credentials: true + origin محددة (لا wildcard) → CORS failure
  headers: {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
  },
});

/* ── Request: أضف Bearer token من Zustand (single source of truth) ── */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response: logout تلقائي عند 401 (token منتهي أو محذوف من Laravel) ── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.replace('/login');
    }
    return Promise.reject(err);
  },
);

export default api;

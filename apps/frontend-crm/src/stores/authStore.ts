import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/api/auth';

interface AuthState {
  token:    string | null;
  user:     AuthUser | null;
  isAuth:   boolean;

  setAuth:  (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:  null,
      user:   null,
      isAuth: false,

      setAuth: (token, user) => {
        // Zustand persist يتولى حفظ الـ token في localStorage تلقائياً
        // لا نحتاج localStorage.setItem يدوي (كان يخزن مرتين)
        set({ token, user, isAuth: true });
      },

      clearAuth: () => {
        // Zustand persist يحذف الـ state من localStorage تلقائياً عند set
        set({ token: null, user: null, isAuth: false });
      },
    }),
    {
      name:    'ifluent-crm-auth',
      partialize: (s) => ({ token: s.token, user: s.user, isAuth: s.isAuth }),
    },
  ),
);

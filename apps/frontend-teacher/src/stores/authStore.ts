import { create } from 'zustand';
import { storage } from '@/utils/storage';
import type { TeacherUser } from '@/api/auth';

interface AuthState {
  token:    string | null;
  user:     TeacherUser | null;
  hydrated: boolean;
  setAuth:   (token: string, user: TeacherUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:    null,
  user:     null,
  hydrated: false,

  setAuth: async (token, user) => {
    await storage.setItem('teacher_token', token);
    await storage.setItem('teacher_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await storage.removeItem('teacher_token');
    await storage.removeItem('teacher_user');
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const token = await storage.getItem('teacher_token');
      const raw   = await storage.getItem('teacher_user');
      const user  = raw ? (JSON.parse(raw) as TeacherUser) : null;
      set({ token, user, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

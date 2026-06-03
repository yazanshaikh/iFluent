import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { TeacherUser } from '@/api/auth';

interface AuthState {
  token:    string | null;
  user:     TeacherUser | null;
  hydrated: boolean;
  setAuth:    (token: string, user: TeacherUser) => Promise<void>;
  clearAuth:  () => Promise<void>;
  hydrate:    () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:    null,
  user:     null,
  hydrated: false,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('teacher_token', token);
    await SecureStore.setItemAsync('teacher_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('teacher_token');
    await SecureStore.deleteItemAsync('teacher_user');
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('teacher_token');
    const raw   = await SecureStore.getItemAsync('teacher_user');
    const user  = raw ? (JSON.parse(raw) as TeacherUser) : null;
    set({ token, user, hydrated: true });
  },
}));

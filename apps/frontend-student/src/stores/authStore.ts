/**
 * Auth store — persists token + user to SecureStore.
 * confirmationResult lives in memory only (not serializable).
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { AuthUser } from '@/api/auth';

interface AuthState {
  token:    string | null;
  user:     AuthUser | null;
  hydrated: boolean;

  /** Firebase ConfirmationResult — held in memory between phone & verify screens */
  confirmationResult: FirebaseAuthTypes.ConfirmationResult | null;

  // Actions
  setAuth:                 (token: string, user: AuthUser) => Promise<void>;
  clearAuth:               () => Promise<void>;
  hydrate:                 () => Promise<void>;
  setConfirmationResult:   (cr: FirebaseAuthTypes.ConfirmationResult) => void;
  clearConfirmationResult: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:              null,
  user:               null,
  hydrated:           false,
  confirmationResult: null,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('student_token', token);
    await SecureStore.setItemAsync('student_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('student_token');
    await SecureStore.deleteItemAsync('student_user');
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('student_token');
    const raw   = await SecureStore.getItemAsync('student_user');
    const user  = raw ? (JSON.parse(raw) as AuthUser) : null;
    set({ token, user, hydrated: true });
  },

  setConfirmationResult:   (cr) => set({ confirmationResult: cr }),
  clearConfirmationResult: ()   => set({ confirmationResult: null }),
}));

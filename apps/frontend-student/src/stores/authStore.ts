/**
 * Auth store — persists token + user to SecureStore.
 * confirmationResult lives in memory only (not serializable).
 */
import { create } from 'zustand';
import { storage } from '@/utils/storage';
import type { OtpConfirmation } from '@/services/firebaseAuth';
import type { AuthUser } from '@/api/auth';

interface AuthState {
  token:    string | null;
  user:     AuthUser | null;
  hydrated: boolean;

  /** Firebase ConfirmationResult — held in memory between phone & verify screens */
  confirmationResult: OtpConfirmation | null;

  // Actions
  setAuth:                 (token: string, user: AuthUser) => Promise<void>;
  clearAuth:               () => Promise<void>;
  hydrate:                 () => Promise<void>;
  setConfirmationResult:   (cr: OtpConfirmation) => void;
  clearConfirmationResult: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:              null,
  user:               null,
  hydrated:           false,
  confirmationResult: null,

  setAuth: async (token, user) => {
    await storage.setItem('student_token', token);
    await storage.setItem('student_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await storage.removeItem('student_token');
    await storage.removeItem('student_user');
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const token = await storage.getItem('student_token');
    const raw   = await storage.getItem('student_user');
    const user  = raw ? (JSON.parse(raw) as AuthUser) : null;
    console.log(`[AUTH] Hydrated: userId=${user?.id ?? 'none'}`);
    set({ token, user, hydrated: true });
  },

  setConfirmationResult:   (cr) => set({ confirmationResult: cr }),
  clearConfirmationResult: ()   => set({ confirmationResult: null }),
}));

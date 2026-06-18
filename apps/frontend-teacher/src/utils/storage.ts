/**
 * Secure storage — NATIVE implementation (iOS / Android).
 *
 * Metro resolves this file on native and `storage.web.ts` on web, so callers
 * keep importing `@/utils/storage` unchanged. Native behaviour is identical to
 * before (expo-secure-store); the previous in-file web branch now lives in the
 * separate web implementation — no native code path changed.
 */
import * as SecureStore from 'expo-secure-store';

export const storage = {
  getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

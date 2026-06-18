/**
 * Secure storage — NATIVE implementation (iOS / Android) via expo-secure-store.
 *
 * Metro resolves this on native and `storage.web.ts` on web, so callers import
 * `@/utils/storage` once and get the right backend per platform. Native uses the
 * Keychain/Keystore exactly as before.
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

/**
 * Secure storage — WEB / DESKTOP implementation.
 *
 * Metro picks this file on web (Electron reuses the web build). Uses
 * localStorage; `expo-secure-store` is never imported into the web bundle.
 * NOTE: localStorage is NOT encrypted — acceptable for web sessions, but it is
 * a weaker guarantee than the native Keychain/Keystore.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

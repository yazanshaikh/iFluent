/**
 * Secure storage — WEB / DESKTOP implementation (localStorage).
 *
 * Metro picks this on web (Electron reuses the web build). expo-secure-store is
 * never imported into the web bundle. NOTE: localStorage is not encrypted — a
 * weaker guarantee than the native Keychain/Keystore, acceptable for web sessions.
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

/**
 * Axios client for the iFluent Student App.
 * Base URL is injected from EXPO_PUBLIC_API_URL (set in .env).
 * Auth token is read from SecureStore and attached on every request.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://192.168.0.104:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept:         'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Auth Token Injection ─────────────────────────────────────────────────────

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('student_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Global Error Handling ────────────────────────────────────────────────────

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear local storage; app will redirect to auth
      await SecureStore.deleteItemAsync('student_token');
      await SecureStore.deleteItemAsync('student_user');
    }
    return Promise.reject(error);
  },
);

export default client;

/**
 * Fix PDF URLs that were stored with localhost:PORT in the database.
 * Replaces the host with the actual API server host so the URL works
 * on real devices and EAS builds.
 *
 * e.g. http://localhost:8000/storage/lessons/x.pdf
 *   → http://192.168.0.106:8000/storage/lessons/x.pdf
 */
export function fixStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const apiBase  = BASE_URL.replace(/\/api\/v1\/?$/, ''); // strip /api/v1
    const parsed   = new URL(url);
    const isLocal  = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (!isLocal) return url; // already a real URL, leave as-is
    const apiParsed = new URL(apiBase);
    parsed.hostname = apiParsed.hostname;
    parsed.port     = apiParsed.port;
    parsed.protocol = apiParsed.protocol;
    return parsed.toString();
  } catch {
    return url;
  }
}

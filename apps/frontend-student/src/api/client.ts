/**
 * Axios client for the iFluent Student App.
 * Base URL is injected from EXPO_PUBLIC_API_URL (set in .env).
 * Auth token is read from SecureStore and attached on every request.
 */
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '@/utils/storage';

// Web/Desktop runs in a browser on the same machine as the backend → localhost
// (immune to the dev machine's DHCP IP changing). Native (phone) keeps using the
// configured LAN IP / tunnel it can actually reach.
const BASE_URL =
  Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_API_URL_WEB ?? 'http://localhost:8000/api/v1')
    : ((Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
       process.env.EXPO_PUBLIC_API_URL ??
       'http://192.168.0.101:8000/api/v1');

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
  const token = await storage.getItem('student_token');
  const path = config.url ? config.url.split('/').slice(-2).join('/') : 'unknown';
  console.log(`[API-CLIENT] ${config.method?.toUpperCase()} ${path} - hasToken: ${!!token}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Global Error Handling ────────────────────────────────────────────────────

client.interceptors.response.use(
  (res) => {
    const path = res.config.url ? res.config.url.split('/').slice(-2).join('/') : 'unknown';
    console.log(`[API-CLIENT] ✓ ${res.config.method?.toUpperCase()} ${path} => ${res.status}`);
    return res;
  },
  async (error) => {
    const path = error.config?.url ? error.config.url.split('/').slice(-2).join('/') : 'unknown';
    const status = error.response?.status ?? 'unknown';
    // Expected business/validation errors (4xx) → quiet log, NOT console.error
    // (console.error triggers the red LogBox overlay in React Native).
    // The error still rejects below so the calling code shows its own alert.
    const numericStatus = typeof status === 'number' ? status : 0;
    const isExpectedClientError = numericStatus >= 400 && numericStatus < 500;
    const logLine = `[API-CLIENT] ✗ ${error.config?.method?.toUpperCase()} ${path} => ${status}`;
    if (isExpectedClientError) {
      console.log(logLine); // handled gracefully by caller
    } else {
      console.error(logLine); // real failure (5xx / network / timeout)
    }
    if (error.response?.status === 401) {
      // Token expired — clear local storage; app will redirect to auth
      await storage.removeItem('student_token');
      await storage.removeItem('student_user');
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

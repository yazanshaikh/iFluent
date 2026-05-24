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

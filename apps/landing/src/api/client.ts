import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15_000,
});

// ── Auth token injection ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = Platform.OS === 'web'
      ? localStorage.getItem('auth_token')
      : await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// ── Response error normaliser ─────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'حدث خطأ غير متوقع';
    return Promise.reject(new Error(message));
  }
);

export const saveToken = async (token: string) => {
  if (Platform.OS === 'web') localStorage.setItem('auth_token', token);
  else await SecureStore.setItemAsync('auth_token', token);
};

export const clearToken = async () => {
  if (Platform.OS === 'web') localStorage.removeItem('auth_token');
  else await SecureStore.deleteItemAsync('auth_token');
};

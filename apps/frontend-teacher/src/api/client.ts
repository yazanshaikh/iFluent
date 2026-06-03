import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'http://192.168.0.106:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept:         'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('teacher_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('teacher_token');
      await SecureStore.deleteItemAsync('teacher_user');
    }
    return Promise.reject(error);
  },
);

export default client;

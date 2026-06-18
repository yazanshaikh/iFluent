import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '@/utils/storage';

// Web/Desktop runs in a browser on the same machine as the backend, so it uses
// localhost (immune to the dev machine's DHCP IP changing). Native (phone) keeps
// using EXPO_PUBLIC_API_URL — a LAN IP or tunnel the device can reach.
const BASE_URL =
  Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_API_URL_WEB ?? 'http://localhost:8000/api/v1')
    : (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.101:8000/api/v1');

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept:         'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

client.interceptors.request.use(async (config) => {
  const token = await storage.getItem('teacher_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem('teacher_token');
      await storage.removeItem('teacher_user');
    }
    return Promise.reject(error);
  },
);

export default client;

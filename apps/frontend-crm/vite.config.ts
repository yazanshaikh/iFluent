import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// الـ proxy لا يعمل مع baseURL مطلق في Axios (Axios يرسل مباشرة للسيرفر).
// نستخدم Direct URL من VITE_API_URL. CORS يُعالَج من جهة Laravel.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3100,
  },
});

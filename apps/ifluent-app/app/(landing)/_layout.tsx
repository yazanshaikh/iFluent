import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useEffect } from 'react';

// ── Inject Tajawal Arabic font (web only) ─────────────────────────────────────
function useTajawalFont() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.getElementById('tajawal-font')) return;

    // Preconnect
    const pre1 = document.createElement('link');
    pre1.rel  = 'preconnect';
    pre1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pre1);

    const pre2 = document.createElement('link');
    pre2.rel        = 'preconnect';
    pre2.href       = 'https://fonts.gstatic.com';
    (pre2 as any).crossOrigin = 'anonymous';
    document.head.appendChild(pre2);

    // Font stylesheet
    const link    = document.createElement('link');
    link.id       = 'tajawal-font';
    link.rel      = 'stylesheet';
    link.href     = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap';
    document.head.appendChild(link);

    // Apply globally
    const style = document.createElement('style');
    style.textContent = `
      * { font-family: 'Tajawal', system-ui, -apple-system, sans-serif; }
      html { scroll-behavior: smooth; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-thumb { background: #FFC107; border-radius: 3px; }
      ::-webkit-scrollbar-track { background: #f1f5f9; }
    `;
    document.head.appendChild(style);
  }, []);
}

export default function LandingLayout() {
  useTajawalFont();
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

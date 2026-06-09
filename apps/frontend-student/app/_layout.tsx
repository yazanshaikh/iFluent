/**
 * Root layout — hydrates auth store then redirects to
 * (auth)/phone or (tabs)/levels based on login state.
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/Sidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:       2,
      staleTime:   60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    // ⚠️ CRITICAL: Ensure auth store is hydrated before any child components render
    // This prevents Reverb from trying to connect before userId is loaded
    if (!hydrated) {
      console.log('[ROOT] Hydrating auth store...');
      hydrate().then(() => {
        console.log('[ROOT] Auth store hydrated, children can now render');
      }).catch((err) => {
        console.error('[ROOT] Hydration failed:', err instanceof Error ? err.message : 'unknown');
      });
    }
  }, [hydrate, hydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
          <Sidebar />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Root index — redirect based on auth state once store is hydrated.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { token, hydrated } = useAuthStore();

  if (!hydrated) {
    // Silent yellow screen — matches the levels header so the transition is seamless.
    // No spinner: SecureStore hydration is <300ms on a normal device.
    return <View style={{ flex: 1, backgroundColor: '#FFB300' }} />;
  }

  if (token) {
    return <Redirect href="/(tabs)/levels" />;
  }

  return <Redirect href="/welcome" />;
}

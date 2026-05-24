/**
 * Root index — redirect based on auth state once store is hydrated.
 */
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { token, hydrated } = useAuthStore();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)/levels" />;
  }

  return <Redirect href="/(auth)/phone" />;
}

import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { C } from '@/theme';

export default function Index() {
  const { token, hydrated } = useAuthStore();

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: C.sky }} />;
  }

  return token
    ? <Redirect href="/(tabs)/requests" />
    : <Redirect href="/(auth)/login" />;
}

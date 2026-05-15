/**
 * apps/ifluent-app — Root Layout
 *
 * هذا التطبيق في طور التحول إلى apps/frontend-student.
 * الـ Landing Page والـ Admin انتقلا إلى apps/landing.
 *
 * Routes المتوقعة لاحقاً:
 *   (auth)/    ← OTP login للطالب
 *   (student)/ ← شاشات الطالب (حصص، تقدم، ملف)
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

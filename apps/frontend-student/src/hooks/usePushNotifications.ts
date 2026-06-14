/**
 * Push notification registration for Expo Push (used for session reminders).
 *
 * - Requests permission on first call (only asks once; after that uses stored state).
 * - Fetches the Expo push token and saves it to the backend via POST /student/device-token.
 * - Clears the token when the user disables notifications in Settings.
 *
 * NOTE: Expo push tokens are only available on real devices (not simulators/emulators).
 *       The hook fails silently on unsupported environments.
 */
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore    from 'expo-secure-store';
import Constants           from 'expo-constants';
import { Platform }        from 'react-native';
import { profileApi }      from '@/api/profile';

// EAS project id — REQUIRED by getExpoPushTokenAsync (esp. in standalone builds).
const EAS_PROJECT_ID =
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
  ((Constants as any).easConfig?.projectId as string | undefined);

const STORED_TOKEN_KEY = 'expo_push_token';

// Configure how incoming notifications are handled while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

/**
 * Register for push notifications and save the token to the backend.
 * Call once at app startup (e.g., in _layout.tsx).
 */
export async function registerForPushNotifications(): Promise<void> {
  // Physical device only
  if (Platform.OS === 'web') return;

  try {
    // Check / request permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const { status: asked } = await Notifications.requestPermissionsAsync();
      status = asked;
    }
    if (status !== 'granted') return;

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name:      'Session Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });
    }

    // Get Expo push token (projectId is mandatory for standalone builds)
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
    );
    if (!token) return;

    // Avoid redundant API calls if the token hasn't changed
    const stored = await SecureStore.getItemAsync(STORED_TOKEN_KEY).catch(() => null);
    if (stored === token) return;

    await profileApi.updateDeviceToken(token);
    await SecureStore.setItemAsync(STORED_TOKEN_KEY, token).catch(() => {});
  } catch {
    // Silent — push is best-effort, never block the user
  }
}

/**
 * Clear the token from the backend (user disabled notifications).
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await profileApi.clearDeviceToken();
    await SecureStore.deleteItemAsync(STORED_TOKEN_KEY).catch(() => {});
  } catch { /* silent */ }
}

/**
 * Hook: registers for push on mount. Put in the root layout so it runs once
 * after the user is authenticated.
 */
export function usePushNotifications(): void {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    registerForPushNotifications();
  }, []);
}

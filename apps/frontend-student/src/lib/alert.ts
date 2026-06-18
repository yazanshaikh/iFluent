/**
 * appAlert — NATIVE: a thin pass-through to React Native's Alert.alert.
 *
 * Drop-in replacement for Alert.alert(title, message, buttons). On web, Metro
 * resolves `alert.web.ts` (Alert.alert is a no-op on react-native-web, which
 * silently broke every confirmation/error dialog). Same signature → call sites
 * change only the function name.
 */
import { Alert, type AlertButton } from 'react-native';

export function appAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  Alert.alert(title, message, buttons);
}

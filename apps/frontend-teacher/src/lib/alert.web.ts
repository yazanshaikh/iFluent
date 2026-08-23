/**
 * appAlert — WEB / DESKTOP implementation.
 *
 * react-native-web's Alert.alert is a no-op, so confirmations (and the actions
 * inside them) never fire and error messages never show. This maps the
 * Alert.alert signature onto the browser's native dialogs:
 *   • 0–1 buttons → window.alert (then runs the single button's onPress)
 *   • 2+ buttons  → window.confirm (OK = the non-cancel button, Cancel = cancel)
 */
interface AlertButton {
  text?: string;
  onPress?: (() => void) | null;
  style?: 'default' | 'cancel' | 'destructive';
}

export function appAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (typeof window === 'undefined') return;

  const text = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }

  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  const cancelBtn  = buttons.find((b) => b.style === 'cancel');
  const confirmBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];

  if (window.confirm(text)) confirmBtn?.onPress?.();
  else cancelBtn?.onPress?.();
}

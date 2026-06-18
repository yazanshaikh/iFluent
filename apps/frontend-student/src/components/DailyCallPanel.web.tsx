/**
 * Daily call panel — WEB / DESKTOP implementation.
 *
 * Metro resolves this on web instead of `DailyCallPanel.tsx`, so the RN Daily
 * SDK (and react-native-webrtc) never enter the web bundle. A Daily room URL
 * renders Daily's prebuilt call UI directly when embedded in an <iframe> — this
 * is simpler and more robust than daily-js createFrame (which crashed with
 * "Cannot read properties of null (reading 'postMessage')"). The backend's
 * room URL already carries the meeting token (?t=…).
 *
 * Same export + props ({ roomUrl }) as the native panel.
 */
import { View, StyleSheet } from 'react-native';

interface Props {
  roomUrl: string;
}

export function DailyCallPanel({ roomUrl }: Props) {
  if (!roomUrl) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <iframe
        src={roomUrl}
        title="iFluent video call"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', borderRadius: 12 }}
        allow="camera; microphone; autoplay; display-capture; fullscreen; speaker-selection"
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a', borderRadius: 12, overflow: 'hidden' },
});

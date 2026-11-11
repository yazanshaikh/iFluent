/**
 * Group call — WEB / DESKTOP. Daily's prebuilt UI already shows every
 * participant in a grid, and gives the owner (teacher's ?t= token) per-person
 * and mute-all controls. Same props as the native panel.
 */
import { View, StyleSheet } from 'react-native';

interface Props {
  roomUrl:    string;
  userName?:  string;
  moderator?: boolean;
}

export function GroupCallPanel({ roomUrl }: Props) {
  if (!roomUrl) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <iframe
        src={roomUrl}
        title="iFluent group class"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="camera; microphone; autoplay; display-capture; fullscreen; speaker-selection"
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a', overflow: 'hidden' },
});

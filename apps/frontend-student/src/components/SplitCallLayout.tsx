/**
 * Live-session split layout (always side-by-side, like the wireframe):
 *   • RIGHT  → the video call (Daily) in a narrower column.
 *   • LEFT   → the lesson content (Nearpod) fills the rest.
 *
 * The divider is PROPORTIONAL (a fraction of the screen width), so the split
 * keeps its ratio and never breaks when the window/screen grows or shrinks — it
 * just takes its proportional size. Dragging the divider is an optional way for
 * the student to rebalance it; the layout works fine without touching it.
 *
 * The session screen forces landscape on phones, so this side-by-side layout
 * always has room (a phone in portrait would be too cramped for two panes).
 */
import { ReactNode, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, useWindowDimensions } from 'react-native';

// Call (right) column as a fraction of total width.
const DEFAULT_FRACTION = 0.34;
const MIN_FRACTION = 0.22;
const MAX_FRACTION = 0.55;

export function SplitCallLayout({ call, content }: { call: ReactNode; content: ReactNode }) {
  const { width } = useWindowDimensions();

  const [fraction, setFraction] = useState(DEFAULT_FRACTION);
  const fractionRef = useRef(fraction);
  const startRef    = useRef(fraction);
  const widthRef    = useRef(width);

  fractionRef.current = fraction;
  widthRef.current    = width;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => { startRef.current = fractionRef.current; },
      onPanResponderMove: (_, g) => {
        // Call sits on the RIGHT → dragging the divider left (negative dx) grows it.
        const deltaF = -g.dx / Math.max(widthRef.current, 1);
        const next   = Math.max(MIN_FRACTION, Math.min(MAX_FRACTION, startRef.current + deltaF));
        setFraction(next);
      },
    }),
  ).current;

  // Proportional width — recomputed every render, so resizing just rescales it.
  const callWidth = Math.round(width * fraction);

  // row-reverse + direction:'ltr' → the call (1st child) lands on the visual
  // RIGHT regardless of the app's RTL direction; content fills the left.
  return (
    <View style={styles.row}>
      <View style={{ width: callWidth }}>{call}</View>

      <View style={styles.handle} {...responder.panHandlers}>
        <View style={styles.pill} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row-reverse', direction: 'ltr' },
  handle: {
    width: 16,
    alignSelf: 'stretch',
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
    zIndex: 20,
  },
  pill: { width: 4, height: 34, borderRadius: 2, backgroundColor: '#475569' },
});

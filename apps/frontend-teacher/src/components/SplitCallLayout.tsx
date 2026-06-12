/**
 * Responsive split layout for the live classroom.
 *  - Landscape / wide screens: video call on the RIGHT, content fills the left,
 *    draggable vertical divider.
 *  - Portrait / narrow phones: call on TOP, content below, draggable horizontal
 *    divider.
 */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, useWindowDimensions } from 'react-native';

const MIN = 120;
const PORTRAIT_DEFAULT = 220;

export function SplitCallLayout({ call, content }: { call: ReactNode; content: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const landscape   = width > height;
  const axis        = landscape ? width : height;
  const maxSize     = Math.round(axis * 0.6);
  const defaultSize = landscape ? Math.min(Math.round(width * 0.42), maxSize) : PORTRAIT_DEFAULT;

  const [size, setSize] = useState(defaultSize);
  const sizeRef      = useRef(size);
  const startRef     = useRef(0);
  const landscapeRef = useRef(landscape);
  const maxRef       = useRef(maxSize);

  landscapeRef.current = landscape;
  maxRef.current       = maxSize;

  useEffect(() => {
    const next = Math.max(MIN, Math.min(maxSize, defaultSize));
    sizeRef.current = next;
    setSize(next);
  }, [landscape, maxSize, defaultSize]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => { startRef.current = sizeRef.current; },
      onPanResponderMove: (_, g) => {
        const delta = landscapeRef.current ? -g.dx : g.dy;
        const next  = Math.max(MIN, Math.min(maxRef.current, startRef.current + delta));
        sizeRef.current = next;
        setSize(next);
      },
    })
  ).current;

  if (landscape) {
    return (
      <View style={[st.row, { direction: 'ltr' }]}>
        <View style={{ flex: 1, minWidth: 0 }}>{content}</View>
        <View style={st.vHandle} {...responder.panHandlers}>
          <View style={st.vPill} />
        </View>
        <View style={{ width: size }}>{call}</View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: size }}>{call}</View>
      <View style={st.hHandle} {...responder.panHandlers}>
        <View style={st.hPill} />
        <Text style={st.hint}>Drag to resize</Text>
        <View style={st.hPill} />
      </View>
      <View style={{ flex: 1 }}>{content}</View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  vHandle: {
    width: 16, alignSelf: 'stretch',
    backgroundColor: '#1e293b',
    justifyContent: 'center', alignItems: 'center',
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#334155',
    zIndex: 20,
  },
  vPill: { width: 4, height: 34, borderRadius: 2, backgroundColor: '#475569' },
  hHandle: {
    height: 26,
    backgroundColor: '#1e293b',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#334155',
    zIndex: 20,
  },
  hPill: { width: 30, height: 4, borderRadius: 2, backgroundColor: '#475569' },
  hint:  { fontSize: 10, color: '#64748b', fontWeight: '600', letterSpacing: 0.5 },
});

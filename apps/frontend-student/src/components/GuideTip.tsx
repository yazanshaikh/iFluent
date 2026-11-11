/** Small guide bubble with an arrow pointing at the thing it explains. */
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

const NAVY = '#1A2980';

interface Props {
  text:       string;
  onDismiss:  () => void;
  arrow:      'up' | 'down';
  /** Puts the arrow over cell `index` of `of` equal cells, e.g. one tab of four. */
  arrowSlot?: { index: number; of: number };
  /** Or an exact distance from the bubble's left edge. */
  arrowLeft?: number;
  style?:     StyleProp<ViewStyle>;
}

export function GuideTip({ text, onDismiss, arrow, arrowSlot, arrowLeft, style }: Props) {
  const triangle = <View style={arrow === 'up' ? S.arrowUp : S.arrowDown} />;

  const arrowRow = arrowLeft !== undefined ? (
    <View style={{ marginLeft: arrowLeft - 9, alignSelf: 'flex-start' }}>{triangle}</View>
  ) : (
    <View style={S.slots}>
      {Array.from({ length: arrowSlot?.of ?? 1 }, (_, i) => (
        <View key={i} style={S.slot}>{i === (arrowSlot?.index ?? 0) ? triangle : null}</View>
      ))}
    </View>
  );

  return (
    <View style={style} pointerEvents="box-none">
      {arrow === 'up' && arrowRow}
      <View style={S.bubble}>
        <Text style={S.text}>{text}</Text>
        <TouchableOpacity onPress={onDismiss} style={S.btn} activeOpacity={0.8} accessibilityRole="button">
          <Text style={S.btnTxt}>حسناً</Text>
        </TouchableOpacity>
      </View>
      {arrow === 'down' && arrowRow}
    </View>
  );
}

const S = StyleSheet.create({
  bubble: {
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  text:   { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  btn:    { backgroundColor: '#FFB300', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 },
  btnTxt: { color: NAVY, fontSize: 13, fontWeight: '800' },
  slots:  { flexDirection: 'row' },
  slot:   { flex: 1, alignItems: 'center' },
  arrowDown: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: NAVY,
  },
  arrowUp: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: NAVY,
  },
});

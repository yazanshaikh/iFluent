/**
 * Centers screen content in a column capped at CONTENT_MAX_WIDTH.
 *
 * On phones it fills the width (with a comfortable side gutter); on tablets and
 * laptop/web it stops growing and sits centered — so the mobile UI never
 * stretches edge-to-edge on a big screen. Wrap the NON-full-bleed content of a
 * screen (everything except things like a full-width banner/header).
 */
import { ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { CONTENT_MAX_WIDTH } from '@/lib/responsive';

export function ResponsiveContainer({
  children,
  style,
  gutter = 20,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gutter?: number;
}) {
  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: gutter,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

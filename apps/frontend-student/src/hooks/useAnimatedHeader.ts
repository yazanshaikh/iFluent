/**
 * useAnimatedHeader
 *
 * Measures the header height, tracks scroll direction, and returns:
 *   - onHeaderLayout  → attach to the Animated.View header's onLayout
 *   - onScroll        → attach to the ScrollView's onScroll (+ scrollEventThrottle={16})
 *   - headerStyle     → spread onto the Animated.View header as style
 *   - headerHeight    → use as paddingTop in the ScrollView's contentContainerStyle
 *
 * Options:
 *   - animateTabBar (default: true) — set to FALSE in stack screens so the
 *     tab bar isn't accidentally hidden when the user scrolls on a detail page
 *     and then navigates back to the tabs.
 */
import { useRef, useState, useCallback } from 'react';
import {
  Animated, Platform,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { tabBarScrollAnim } from '@/animations';

export const TAB_BAR_H = Platform.OS === 'ios' ? 82 : 62;

const SCROLL_THRESHOLD = 5;   // px — debounce micro-jitter
const MIN_SCROLL_Y     = 60;  // px — don't hide until scrolled past this

interface Options {
  /** Whether to drive the global tabBarScrollAnim (default: true).
   *  Pass false on stack screens that don't show the tab bar. */
  animateTabBar?: boolean;
}

export function useAnimatedHeader({ animateTabBar = true }: Options = {}) {
  const [headerHeight, setHeaderHeight] = useState(0);

  // -1 = fully hidden, 0 = fully visible
  const headerAnim = useRef(new Animated.Value(0)).current;
  const lastY      = useRef(0);
  const hidden     = useRef(false);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  const animate = useCallback((toHide: boolean) => {
    if (hidden.current === toHide) return;
    hidden.current = toHide;

    const springs: Animated.CompositeAnimation[] = [
      Animated.spring(headerAnim, {
        toValue: toHide ? -1 : 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 240,
        overshootClamping: true,
      }),
    ];

    if (animateTabBar) {
      springs.push(
        Animated.spring(tabBarScrollAnim, {
          toValue: toHide ? TAB_BAR_H : 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 240,
          overshootClamping: true,
        }),
      );
    }

    Animated.parallel(springs).start();
  // headerAnim / tabBarScrollAnim are stable refs — animateTabBar is captured at mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateTabBar]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y  = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;

      if (y < MIN_SCROLL_Y)              { animate(false); return; }
      if (Math.abs(dy) < SCROLL_THRESHOLD) return;

      animate(dy > 0); // down → hide, up → show
    },
    [animate],
  );

  const headerStyle = {
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange:  [-1, 0],
          outputRange: [-(headerHeight || 130), 0],
        }),
      },
    ],
  };

  return { headerHeight, onHeaderLayout, onScroll, headerStyle };
}

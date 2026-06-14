/**
 * Responsive sizing for the student app — phones, tablets, and laptop/web.
 *
 * Strategy:
 *  • Sizes scale proportionally to screen WIDTH against a phone baseline (375dp),
 *    but the scale factor is CLAMPED so tablets/laptops don't blow everything up.
 *  • Content lives in a centered column capped at CONTENT_MAX_WIDTH — so on a
 *    tablet or laptop the UI is a comfortable centered strip instead of stretched
 *    edge-to-edge (the standard way a mobile UI presents on large screens).
 *  • `useResponsive()` re-renders on rotation / window resize (web, foldables).
 *
 * Usage:
 *   const { rf, s, isTablet, contentMaxWidth } = useResponsive();
 *   <Text style={{ fontSize: rf(16) }} />            // responsive font
 *   <View style={{ padding: s(20), maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }} />
 */
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

// Phone baseline (iPhone 11 / common Android logical width).
const BASE_WIDTH = 375;

// Past this width we stop growing sizes — keeps fonts/spacing comfortable on
// tablets & laptops instead of cartoonishly large.
const SCALE_CAP_WIDTH = 480;

// Breakpoints in dp (logical px).
export const BREAKPOINTS = { tablet: 600, laptop: 1024 } as const;

// Centered content column width on large screens.
export const CONTENT_MAX_WIDTH = 520;

export type DeviceClass = 'phone' | 'tablet' | 'laptop';

export function deviceClassFor(width: number): DeviceClass {
  if (width >= BREAKPOINTS.laptop) return 'laptop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'phone';
}

/** Linear scale vs. the phone baseline, clamped at SCALE_CAP_WIDTH. */
export function scaleSize(size: number, width: number): number {
  const effective = Math.min(width, SCALE_CAP_WIDTH);
  return Math.round((size * effective) / BASE_WIDTH);
}

/**
 * Moderate scale — blends the linear scale toward the original size by `factor`
 * (0 = no scaling, 1 = full linear). Good for fonts, where full scaling is too
 * aggressive. Default 0.5.
 */
export function moderateScale(size: number, width: number, factor = 0.5): number {
  return Math.round(size + (scaleSize(size, width) - size) * factor);
}

// Static helpers (snapshot width) — handy inside StyleSheet.create at module load.
const initialWidth = Dimensions.get('window').width;
/** Responsive font (static snapshot). Prefer useResponsive().rf in components. */
export const rf = (size: number) => moderateScale(size, initialWidth, 0.5);
/** Responsive size/spacing (static snapshot). */
export const s = (size: number) => scaleSize(size, initialWidth);

/**
 * Reactive hook — updates on rotation / window resize. Returns width-bound
 * helpers plus device-class flags and the content max width.
 */
export function useResponsive() {
  const [window, setWindow] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window: w }) => setWindow(w));
    return () => sub.remove();
  }, []);

  const width  = window.width;
  const height = window.height;
  const cls    = deviceClassFor(width);

  return {
    width,
    height,
    deviceClass: cls,
    isPhone:  cls === 'phone',
    isTablet: cls === 'tablet',
    isLaptop: cls === 'laptop',
    isLargeScreen: width >= BREAKPOINTS.tablet,
    isLandscape: width > height,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    /** responsive font */
    rf: (size: number) => moderateScale(size, width, 0.5),
    /** responsive size/spacing */
    s:  (size: number) => scaleSize(size, width),
    /** moderate scale with custom factor */
    ms: (size: number, factor = 0.5) => moderateScale(size, width, factor),
  };
}

import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '../constants/layout';

export type Screen = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile  = width < Breakpoints.tablet;
  const isTablet  = width >= Breakpoints.tablet && width < Breakpoints.desktop;
  const isDesktop = width >= Breakpoints.desktop;
  const isWide    = width >= Breakpoints.wide;

  const screen: Screen = isWide
    ? 'wide'
    : isDesktop
    ? 'desktop'
    : isTablet
    ? 'tablet'
    : 'mobile';

  /**
   * Pick a value based on current screen size.
   * Usage: rv({ mobile: 16, tablet: 24, desktop: 32 })
   */
  function rv<T>(values: { mobile: T; tablet?: T; desktop?: T; wide?: T }): T {
    if (isWide    && values.wide    !== undefined) return values.wide;
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    if (isTablet  && values.tablet  !== undefined) return values.tablet;
    return values.mobile;
  }

  return { width, height, isMobile, isTablet, isDesktop, isWide, screen, rv };
}

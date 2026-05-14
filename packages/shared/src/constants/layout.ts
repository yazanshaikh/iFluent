/**
 * iFluent Layout Tokens — Breakpoints, Spacing, Radius, Shadow
 */

// ── Breakpoints ──────────────────────────────────────────────────────────────
export const Breakpoints = {
  mobile:  0,     // < 640
  tablet:  640,   // 640 – 1024
  desktop: 1024,  // > 1024
  wide:    1280,  // > 1280
};

// ── Spacing scale (4px base) ─────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
};

// ── Max content width ─────────────────────────────────────────────────────────
export const MAX_WIDTH = 1200;
export const NAVBAR_HEIGHT = 72;

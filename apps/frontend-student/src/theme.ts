/**
 * iFluent Student — Shared Design System
 * Yellow / Navy brand palette + reusable style tokens.
 */

// ── Palette ───────────────────────────────────────────────────────────────────
export const C = {
  yellow:    '#FFB300',
  amber:     '#FF8F00',
  navy:      '#1A2980',
  navyMid:   '#26367B',
  navyLight: '#3A4FAD',
  white:     '#FFFFFF',
  cream:     '#FFF8E1',
  inputBg:   '#FFFDE7',
  border:    '#FFE082',
  grayLight: '#F5F5F5',
  gray:      '#9E9E9E',
  grayMid:   '#6B7280',
  grayDark:  '#374151',
  success:   '#22C55E',
  warning:   '#F59E0B',
  error:     '#EF4444',
  info:      '#3B82F6',
} as const;

// ── Level colour map ──────────────────────────────────────────────────────────
export const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#8B5CF6',
  B2: '#F59E0B',
  FT: '#EF4444',
};

// ── Shared style tokens ───────────────────────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  navy: {
    shadowColor: C.navy,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  amber: {
    shadowColor: C.amber,
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

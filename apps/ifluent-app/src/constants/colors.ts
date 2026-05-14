/**
 * iFluent Design System — Color Tokens
 * Theme: Yellow ✦ White ✦ Navy  (Duolingo-inspired, iFluent brand)
 */
export const Colors = {
  // ── Brand Yellow ───────────────────────────────────────────────────────────
  yellow:        '#FFC107',   // Main mascot yellow
  yellowDark:    '#F59E0B',   // Pressed / shadow
  yellowDeep:    '#D97706',   // Darkest yellow for borders
  yellowLight:   '#FFF8DC',   // Pale yellow fill
  yellowSoft:    '#FFFBEB',   // Background tint

  // ── Brand Navy ─────────────────────────────────────────────────────────────
  navy:          '#1E3A8A',   // Primary text / headphones color
  navyDark:      '#0F2460',   // Deeper navy
  navyLight:     '#2563EB',   // Interactive blue
  navyMid:       '#3B5FBD',   // Mid navy

  // ── Neutrals ───────────────────────────────────────────────────────────────
  white:         '#FFFFFF',
  black:         '#000000',
  background:    '#FFFFFF',
  backgroundWarm:'#FFFBEB',   // Warm white for sections
  backgroundGray:'#F8FAFC',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
  borderLight:   '#F1F5F9',
  borderYellow:  '#FDE68A',   // Yellow-tinted border

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:   '#1E293B',   // Near-black
  textSecondary: '#475569',   // Slate 600
  textMuted:     '#94A3B8',   // Slate 400
  textOnDark:    '#FFFFFF',
  textOnYellow:  '#1E3A8A',   // Navy on yellow backgrounds
  textNavy:      '#1E3A8A',

  // ── Status ─────────────────────────────────────────────────────────────────
  success:       '#10B981',
  successLight:  '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  error:         '#EF4444',
  errorLight:    '#FEE2E2',
  info:          '#3B82F6',
  infoLight:     '#DBEAFE',

  // ── Level Colors ───────────────────────────────────────────────────────────
  level1:        '#6366F1',   // Foundation — Indigo
  level2:        '#3B82F6',   // Construction — Blue
  level3:        '#10B981',   // Expansion — Emerald
  level4:        '#F59E0B',   // Fluency — Amber
  level5:        '#8B5CF6',   // Mastery — Violet

  // ── Legacy aliases (keeps old imports working) ─────────────────────────────
  primary:       '#1E3A8A',
  primaryLight:  '#2563EB',
  primaryDark:   '#0F2460',
  accent:        '#FFC107',
  accentLight:   '#FDE68A',
  accentDark:    '#F59E0B',
  heroGradient:  ['#FFFBEB', '#FFF8DC', '#FFFFFF'] as const,
  cardGradient:  ['#FFFBEB', '#FFFFFF'] as const,
  accentGradient:['#FFC107', '#F59E0B'] as const,
};

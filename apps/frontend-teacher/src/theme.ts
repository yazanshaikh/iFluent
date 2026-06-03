/**
 * iFluent Teacher — Design System
 * Sky-blue palette (mirrors student app structure).
 */

export const C = {
  // Primary — sky blue
  sky:       '#0EA5E9',
  skyMid:    '#0284C7',
  skyDark:   '#0369A1',
  skyLight:  '#BAE6FD',

  // Neutral
  white:     '#FFFFFF',
  cream:     '#F0F9FF',
  inputBg:   '#E0F2FE',
  border:    '#BAE6FD',
  grayLight: '#F5F5F5',
  gray:      '#9E9E9E',
  grayMid:   '#6B7280',
  grayDark:  '#374151',

  // Semantic
  success:   '#22C55E',
  warning:   '#F59E0B',
  error:     '#EF4444',
  info:      '#3B82F6',
} as const;

export const shadow = {
  sm: {
    shadowColor:  '#0EA5E9',
    shadowOpacity: 0.08,
    shadowRadius:  8,
    shadowOffset:  { width: 0, height: 2 },
    elevation:     3,
    // web fallback
    boxShadow: '0 2px 8px rgba(14,165,233,0.08)',
  },
  md: {
    shadowColor:  '#0284C7',
    shadowOpacity: 0.14,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     6,
    boxShadow: '0 4px 16px rgba(2,132,199,0.14)',
  },
} as const;

export const STATUS_COLOR: Record<string, string> = {
  pending:   C.warning,
  confirmed: C.sky,
  active:    C.success,
  completed: C.gray,
  cancelled: C.error,
  rejected:  C.error,
  waiting:   C.warning,
};

export const STATUS_LABEL: Record<string, string> = {
  pending:   'بانتظار القبول',
  confirmed: 'مقبولة',
  active:    'نشطة الآن',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
  rejected:  'مرفوضة',
  waiting:   'قريباً',
};

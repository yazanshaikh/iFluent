/**
 * iFluent Typography — Font sizes & weights
 * Arabic-first (RTL), supports English too.
 */
export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
  '5xl': 60,
};

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight:  1.25,
  normal: 1.5,
  loose:  1.75,
};

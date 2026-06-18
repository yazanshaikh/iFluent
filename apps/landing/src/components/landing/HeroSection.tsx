import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Image, Animated, Dimensions,
} from 'react-native';
import { Colors } from '@ifluent/shared';
import { Spacing, NAVBAR_HEIGHT, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { useResponsive } from '@ifluent/shared';
import { HERO_CTA_LABEL, type SiteSettings } from '@/src/api/public';
import { useScrollTo } from '@ifluent/shared';

interface HeroSectionProps {
  settings: SiteSettings;
  onCtaPrimary?: () => void;
  onCtaSecondary?: () => void;
}

export function HeroSection({ settings, onCtaPrimary, onCtaSecondary }: HeroSectionProps) {
  const { isMobile, isTablet, rv } = useResponsive();
  const scrollCtx = useScrollTo();

  // Floating animation for mascot
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scrollTo = (id: string) => scrollCtx(id);

  const titleSize = rv({ mobile: FontSize['3xl'], tablet: FontSize['4xl'], desktop: 52 });

  return (
    <View style={styles.section}>
      {/* ── Yellow blob top-right decoration ── */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <View style={[
        styles.inner,
        { flexDirection: isMobile ? 'column' : 'row-reverse' },
        // On web, Navbar is fixed so we need paddingTop. On native it's in normal flow.
        { paddingTop: Platform.OS === 'web' ? NAVBAR_HEIGHT + (isMobile ? 32 : 56) : (isMobile ? 24 : 48) },
      ]}>

        {/* ── LEFT: Text content ── */}
        <View style={[styles.textCol, isMobile && styles.textColMobile]}>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>🏆</Text>
            <Text style={styles.badgeText}>منصة تعليم الإنجليزية رقم 1</Text>
          </View>

          {/* Main title */}
          <Text style={[styles.title, { fontSize: titleSize }]}>
            {settings.hero_title ?? 'تعلّم الإنجليزية\nمع أفضل المعلمين'}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { fontSize: rv({ mobile: FontSize.base, desktop: FontSize.lg }) }]}>
          {settings.hero_subtitle ?? 'حصص خاصة مباشرة تفاعلية مع معلمين عرب واجانب في أي وقت، من أي مكان.'}
          </Text>

          {/* Stats cards — professional design */}
          <View style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.label} style={[styles.statCard, { borderTopColor: s.accent }]}>
                {/* Coloured icon circle */}
                <View style={[styles.statIconCircle, { backgroundColor: s.iconBg }]}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                </View>
                {/* Value + label */}
                <Text style={[styles.statValue, { color: s.accent }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* CTA Buttons */}
          <View style={[styles.ctaRow, isMobile && styles.ctaRowMobile]}>
            {/* Primary — 3D Yellow */}
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={onCtaPrimary ?? (() => scrollTo('contact'))}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaPrimaryText}>
                {settings.hero_cta_text ?? HERO_CTA_LABEL} 🎯
              </Text>
            </TouchableOpacity>

            {/* Secondary — outline */}
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={onCtaSecondary ?? (() => scrollTo('how'))}
              activeOpacity={0.75}
            >
              <Text style={styles.ctaSecondaryText}>▶ شاهد كيف يعمل</Text>
            </TouchableOpacity>
          </View>

          {/* Trust line */}
          <Text style={styles.trustLine}>
            ✓ مجاني للبدء &nbsp;&nbsp; ✓ بدون إلزام &nbsp;&nbsp; ✓ استجابة خلال 24 ساعة
          </Text>
        </View>

        {/* ── RIGHT: Mascot image ── */}
        <View style={[styles.imageCol, isMobile && styles.imageColMobile]}>
          {/* Shadow under image */}
          <View style={styles.imageShadow} />

          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <Image
              source={require('../../../assets/images/mascot-hero.jpeg')}
              style={[
                styles.mascotImage,
                {
                  width:  rv({ mobile: 320, tablet: 380, desktop: 480 }),
                  height: rv({ mobile: 220, tablet: 260, desktop: 320 }),
                },
              ]}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Floating badges — desktop/tablet only. On mobile the image is
              full-width and these negatively-offset cards get clipped by the
              section's overflow and overlap other content, so we hide them. */}
          {!isMobile && (
            <>
              <View style={styles.floatBadge1}>
                <Text style={styles.floatBadgeEmoji}>⭐</Text>
                <View>
                  <Text style={styles.floatBadgeTitle}>98% رضا الطلاب</Text>
                  <Text style={styles.floatBadgeSub}>تقييمات ابطالنا</Text>
                </View>
              </View>

              <View style={styles.floatBadge2}>
                <Text style={styles.floatBadgeEmoji}>🎓</Text>
                <View>
                  <Text style={styles.floatBadgeTitle}>+500 طالب</Text>
                  <Text style={styles.floatBadgeSub}>ينضمون كل شهر</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Wave divider */}
      <View style={styles.waveDivider} />
    </View>
  );
}

const STATS = [
  { emoji: '⭐', value: '98%',  label: 'رضا الطلاب',  accent: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)' },
  { emoji: '👨‍🏫', value: '+50', label: 'معلم معتمد',  accent: '#6366F1', iconBg: 'rgba(99,102,241,0.12)' },
  { emoji: '🌍', value: '24/7', label: 'متاح دائماً', accent: '#10B981', iconBg: 'rgba(16,185,129,0.12)' },
];

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    overflow:        'hidden',
    position:        'relative' as any,
    paddingBottom:   Spacing['2xl'],
  },

  // Decorative blobs
  blobTopRight: {
    position:        'absolute' as any,
    width:           500,
    height:          500,
    borderRadius:    250,
    backgroundColor: Colors.yellowLight,
    top:             -150,
    right:           -150,
    opacity:         0.6,
  },
  blobBottomLeft: {
    position:        'absolute' as any,
    width:           300,
    height:          300,
    borderRadius:    150,
    backgroundColor: '#EFF6FF',
    bottom:          -100,
    left:            -80,
    opacity:         0.7,
  },

  inner: {
    maxWidth:          MAX_WIDTH,
    alignSelf:         'center',
    width:             '100%',
    paddingHorizontal: Spacing.xl,
    paddingBottom:     Spacing['2xl'],
    alignItems:        'center',
    gap:               Spacing['2xl'],
  },

  // Text side
  textCol: {
    flex:       1,
    alignItems: 'flex-end',
    maxWidth:   560,
  },
  textColMobile: {
    alignItems: 'center',
    maxWidth:   '100%',
    width:      '100%',
  },

  badge: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    gap:               Spacing.xs,
    backgroundColor:   Colors.yellowLight,
    borderWidth:       1.5,
    borderColor:       Colors.borderYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical:   6,
    borderRadius:      50,
    marginBottom:      Spacing.lg,
  },
  badgeEmoji: { fontSize: FontSize.base },
  badgeText: {
    color:      Colors.navy,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    writingDirection: 'rtl' as any,
  },

  title: {
    color:        Colors.navy,
    fontWeight:   FontWeight.extrabold,
    textAlign:    'right',
    lineHeight:   undefined,
    marginBottom: Spacing.lg,
    letterSpacing: -1,
    writingDirection: 'rtl' as any,
  },

  subtitle: {
    color:        Colors.textSecondary,
    textAlign:    'right',
    lineHeight:   28,
    marginBottom: Spacing.xl,
    writingDirection: 'rtl' as any,
  },

  statsRow: {
    flexDirection:  'row-reverse',
    gap:            Spacing.sm,
    marginBottom:   Spacing.xl,
    flexWrap:       'wrap' as any,
    justifyContent: 'flex-start',
  },

  // ── Professional stat cards ──
  statCard: {
    alignItems:      'center',
    backgroundColor: Colors.white,
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    borderTopWidth:  4,              // coloured accent bar on top
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    minWidth:        82,
    gap:             4,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.07)' } as any,
      default: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius:  10,
        elevation:     4,
      },
    }),
  },
  statIconCircle: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   2,
  },
  statEmoji: { fontSize: FontSize.xl },
  statValue: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.extrabold,
    textAlign:  'center',
  },
  statLabel: {
    color:    Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    writingDirection: 'rtl' as any,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
  },

  // CTA buttons
  ctaRow: {
    flexDirection: 'row-reverse',
    gap:           Spacing.md,
    marginBottom:  Spacing.lg,
    flexWrap:      'wrap' as any,
  },
  ctaRowMobile: {
    flexDirection: 'column',
    width:         '100%',
  },

  // Primary CTA — extra prominent (long label + strong depth)
  ctaPrimary: {
    backgroundColor:   Colors.yellow,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical:   Spacing.md + 6,
    borderRadius:      22,
    borderBottomWidth: 5,
    borderBottomColor: Colors.yellowDeep,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.35)',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 32px rgba(255,193,7,0.55), 0 2px 0 rgba(180,130,0,0.35)',
      } as any,
      default: {
        shadowColor:   Colors.yellow,
        shadowOffset:  { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius:  16,
        elevation:     12,
      },
    }),
  },
  ctaPrimaryText: {
    color:      Colors.navy,
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.extrabold,
    textAlign:  'center',
    lineHeight: 26,
    writingDirection: 'rtl' as any,
  },

  // Secondary outline button
  ctaSecondary: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderRadius:      20,
    borderWidth:       2,
    borderColor:       Colors.navy,
    borderBottomWidth: 4,
    borderBottomColor: Colors.navyDark,
  },
  ctaSecondaryText: {
    color:      Colors.navy,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },

  trustLine: {
    color:    Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    writingDirection: 'rtl' as any,
  },

  // Image side
  imageCol: {
    flex:     1,
    maxWidth: 520,
    position: 'relative' as any,
    alignItems: 'center',
  },
  imageColMobile: {
    width: '100%',
    maxWidth: '100%',
  },
  imageShadow: {
    position:        'absolute' as any,
    bottom:          -10,
    left:            '10%',
    right:           '10%',
    height:          40,
    backgroundColor: Colors.yellow,
    opacity:         0.2,
    borderRadius:    100,
    ...Platform.select({
      web: { filter: 'blur(20px)' } as any,
    }),
  },
  mascotImage: {
    borderRadius: 28,
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(30,58,138,0.12)' } as any,
      default: {
        shadowColor:   Colors.navy,
        shadowOffset:  { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius:  40,
        elevation:     10,
      },
    }),
  },

  // Floating badge cards
  floatBadge1: {
    position:          'absolute' as any,
    bottom:            16,
    left:              -16,
    backgroundColor:   Colors.white,
    borderRadius:      16,
    padding:           Spacing.sm,
    flexDirection:     'row-reverse',
    alignItems:        'center',
    gap:               Spacing.xs,
    borderWidth:       1,
    borderColor:       Colors.borderYellow,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } as any,
      default: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius:  12,
        elevation:     5,
      },
    }),
  },
  floatBadge2: {
    position:          'absolute' as any,
    top:               16,
    right:             -16,
    backgroundColor:   Colors.white,
    borderRadius:      16,
    padding:           Spacing.sm,
    flexDirection:     'row-reverse',
    alignItems:        'center',
    gap:               Spacing.xs,
    borderWidth:       1,
    borderColor:       Colors.borderYellow,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } as any,
      default: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius:  12,
        elevation:     5,
      },
    }),
  },
  floatBadgeEmoji: { fontSize: FontSize.xl },
  floatBadgeTitle: {
    color:      Colors.navy,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign:  'right',
  },
  floatBadgeSub: {
    color:    Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },

  // Wave divider at bottom
  waveDivider: {
    height:          32,
    backgroundColor: Colors.backgroundWarm,
    borderTopLeftRadius:  40,
    borderTopRightRadius: 40,
  },
});

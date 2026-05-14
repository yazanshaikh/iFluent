/**
 * HowItWorksSection — Steps + promo row: square mascot ad + copy (no full-bleed BG image).
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, Platform, Pressable,
} from 'react-native';
import { Colors } from '@ifluent/shared';
import { Spacing, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { useResponsive } from '@ifluent/shared';

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01', icon: '📋', title: 'سجّل حسابك مجاناً',
    desc: ' انشئ حساب على المنصة واحجز حصة تقييم مستوى مجانية من خلال المنصة او التطبيق',
    checks: [ 'حصة لتحديد المستوى', 'مسار تعليمي مخصص فوراً'],
    accent: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', iconBg: 'rgba(99,102,241,0.12)',
  },
  {
    num: '02', icon: '👩‍🏫', title: 'اختر معلمك',
    desc: 'تصفح معلمينا المعتمدين، اقرأ تقييماتهم، وشاهد جداولهم — ثم احجز موعدك بنقرة.',
    checks: [' معلمين عرب واجانب',  'حجز فوري بنقرة واحدة'],
    accent: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', iconBg: 'rgba(245,158,11,0.12)',
  },
  {
    num: '03', icon: '🏆', title: 'تعلّم وتقدّم',
    desc: 'احضر حصصك التفاعلية من خلال التطبيق، اختر وقت الحصة المناسب ، أكمل الكويزات، سجّل ملاحظاتك — وتابع رحلتك حتى الإتقان.',
    checks: ['حصص حية مع المعلم', 'اختبارات وتقييمات مستمرة', 'تتبع التقدم لحظة بلحظة'],
    accent: '#10B981', bg: '#F0FDF4', border: '#BBF7D0', iconBg: 'rgba(16,185,129,0.12)',
  },
];

// ── Section ───────────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const { isMobile, rv } = useResponsive();

  return (
    <View style={styles.section} nativeID="how">

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrowDot}>◆</Text>
          <Text style={styles.eyebrow}>3 خطوات فقط</Text>
        </View>
        <Text style={[styles.title, { fontSize: rv({ mobile: FontSize['2xl'], desktop: 38 }) }]}>
          كيف يعمل iFluent؟
        </Text>
        <Text style={styles.subtitle}>
          من التسجيل حتى الطلاقة — الطريق أسهل مما تتخيل
        </Text>
      </View>

      {/* ── Steps row ── */}
      <View style={[styles.stepsRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.num}>
            <StepCard step={step} />
            {!isMobile && idx < STEPS.length - 1 && (
              <View style={styles.connector}>
                <View style={[styles.connectorLine, { backgroundColor: step.accent + '50' }]} />
                <Text style={[styles.connectorArrow, { color: step.accent }]}>›</Text>
              </View>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* ── Promo: square ad + copy (same pattern mobile/desktop) ── */}
      <View style={[styles.promoOuter, isMobile && styles.promoOuterMobile]}>
        <View style={styles.panelShadow}>
          <View style={[styles.promoCard, isMobile && styles.promoCardMobile]}>
            <View style={[styles.promoRow, isMobile && styles.promoRowMobile]}>
              <View style={[styles.adSquare, isMobile && styles.adSquareMobile]}>
                <Image
                  source={require('@/assets/images/mascot-class.jpeg')}
                  style={styles.adSquareImg}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.promoCopy, isMobile && styles.promoCopyMobile]}>
                <View style={[styles.infoBubble, isMobile && styles.infoBubbleMobile]}>
                  <View style={styles.infoIconCircle}>
                    <Text style={styles.infoIcon}>🌐</Text>
                  </View>
                  <Text style={styles.infoTitle}>كل شيء عبر الإنترنت</Text>
                  <Text style={styles.infoDesc}>
                    {isMobile
                      ? 'لا تحتاج للتنقل — فقط هاتفك أو كمبيوترك وإنترنت. تعلّم من أي مكان!'
                      : `لا تحتاج للتنقل — فقط هاتفك أو كمبيوترك وإنترنت.${'\n'}تعلّم من غرفتك، مكتبك، أو أينما كنت!`}
                  </Text>
                  <View style={styles.statsRow}>
                    {[['🌍','متاح عالمياً'],['⏰','24 / 7'],['📱','iOS & Android']].map(([e,l]) => (
                      <View key={String(l)} style={styles.statChip}>
                        <Text style={styles.statEmoji}>{String(e)}</Text>
                        <Text style={styles.statLabel}>{String(l)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ step }: { step: typeof STEPS[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.card,
        {
          backgroundColor: step.bg,
          borderColor:     step.border,
          borderTopColor:  step.accent,
        },
        Platform.OS === 'web' && hovered
          ? { transform: [{ translateY: -6 }] as any, boxShadow: `0 12px 32px ${step.accent}30` }
          : Platform.OS === 'web'
          ? { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }
          : {
              shadowColor:   step.accent,
              shadowOffset:  { width: 0, height: hovered ? 8 : 2 },
              shadowOpacity: hovered ? 0.25 : 0.10,
              shadowRadius:  hovered ? 16 : 6,
              elevation:     hovered ? 8 : 2,
            },
      ] as any}
    >
      {/* Watermark */}
      <Text style={[styles.watermark, { color: step.accent }]}>{step.num}</Text>

      {/* Step label */}
      <Text style={[styles.stepLabel, { color: step.accent }]}>الخطوة {step.num}</Text>

      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: step.iconBg, borderColor: step.border }]}>
        <Text style={styles.iconEmoji}>{step.icon}</Text>
      </View>

      <Text style={[styles.cardTitle, { color: step.accent }]}>{step.title}</Text>
      <Text style={styles.cardDesc}>{step.desc}</Text>

      {/* Checks */}
      <View style={styles.checkList}>
        {step.checks.map((c) => (
          <View key={c} style={styles.checkRow}>
            <View style={[styles.checkBox, { borderColor: step.accent, backgroundColor: step.accent + '18' }]}>
              <Text style={[styles.checkTick, { color: step.accent }]}>✓</Text>
            </View>
            <Text style={styles.checkText}>{c}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Section
  section: {
    paddingVertical:   Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor:   Colors.backgroundWarm,
    alignItems:        'center',
  },

  // ── Header
  header: { alignItems: 'center', marginBottom: Spacing['3xl'], maxWidth: 680 },
  eyebrowRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    gap: Spacing.xs, marginBottom: Spacing.sm,
  },
  eyebrowDot: { color: Colors.yellowDark, fontSize: 8 },
  eyebrow: {
    color: Colors.yellowDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    letterSpacing: 2, textTransform: 'uppercase' as any,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  title: {
    color: Colors.navy, fontWeight: FontWeight.extrabold,
    textAlign: 'center', marginBottom: Spacing.md, letterSpacing: -0.5,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  subtitle: {
    color: Colors.textSecondary, fontSize: FontSize.base,
    textAlign: 'center', lineHeight: 26,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Steps row
  stepsRow: {
    maxWidth: MAX_WIDTH, width: '100%',
    gap: Spacing.md, alignItems: 'stretch',
    justifyContent: 'center', marginBottom: Spacing['3xl'],
    flexWrap: 'wrap' as any,
  },

  // Connector
  connector: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', width: 32, gap: 2 },
  connectorLine:  { width: 1, height: 24, borderRadius: 1 },
  connectorArrow: { fontSize: 24, fontWeight: FontWeight.bold, marginTop: -4 },

  // ── Step card
  card: {
    flex: 1, minWidth: 260, maxWidth: 340,
    borderRadius: 22, borderWidth: 1.5, borderTopWidth: 4,
    padding: Spacing.lg, alignItems: 'flex-end',
    overflow: 'hidden', position: 'relative' as any,
    ...Platform.select({ web: { transition: 'transform 0.22s ease, box-shadow 0.22s ease' } as any }),
  },
  watermark: {
    position: 'absolute' as any, bottom: -20, left: -4,
    fontSize: 90, fontWeight: FontWeight.extrabold,
    opacity: 0.06, lineHeight: 90, letterSpacing: -4,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif", userSelect: 'none', pointerEvents: 'none' } as any }),
  },
  stepLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    letterSpacing: 2, textAlign: 'right', marginBottom: Spacing.sm, zIndex: 1,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, zIndex: 1,
  },
  iconEmoji: { fontSize: FontSize.xl },
  cardTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold,
    textAlign: 'right', marginBottom: Spacing.xs, zIndex: 1,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  cardDesc: {
    color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 20,
    textAlign: 'right', marginBottom: Spacing.md, zIndex: 1,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  // alignSelf: 'stretch' overrides the parent's alignItems:'flex-end'
  // so the list always takes full card width (fixes mobile invisible text)
  checkList: { gap: 8, alignSelf: 'stretch', zIndex: 1 },
  checkRow:  { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, width: '100%' },
  checkBox:  {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkTick: { fontSize: 10, fontWeight: FontWeight.extrabold, lineHeight: 12 },
  checkText: {
    color: Colors.textSecondary, fontSize: FontSize.xs,
    flex: 1, flexShrink: 1,        // flex:1 for space + flexShrink so text wraps not disappears
    textAlign: 'right',
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Promo row (square ad + copy) ─────────────────────────────────────────

  promoOuter: {
    maxWidth: MAX_WIDTH,
    width:    '100%',
  },
  promoOuterMobile: {
    alignItems: 'center',
  },

  panelShadow: {
    width: '100%',
    borderRadius: 32,
    ...Platform.select({
      web: { boxShadow: '0 12px 48px rgba(30,58,138,0.13)' } as any,
      default: {
        shadowColor: Colors.navy, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12, shadowRadius: 28, elevation: 8,
      },
    }),
  },

  promoCard: {
    borderRadius:    32,
    overflow:        'hidden',
    backgroundColor: Colors.white,
    borderWidth:     1,
    borderColor:     Colors.borderYellow,
    paddingVertical:   Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  promoCardMobile: {
    paddingVertical:   Spacing.lg,
    paddingHorizontal: Spacing.md,
  },

  promoRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing.xl,
    flexWrap:          'wrap' as any,
  },
  promoRowMobile: {
    flexDirection: 'column',
    gap:           Spacing.lg,
  },

  /** Fixed square “banner” — not a full-width background */
  adSquare: {
    width:          280,
    aspectRatio:    1,
    borderRadius:   20,
    overflow:       'hidden',
    backgroundColor: Colors.white,
    flexShrink:     0,
    ...Platform.select({
      web: { boxShadow: '0 6px 24px rgba(30,58,138,0.10)' } as any,
      default: {
        shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
      },
    }),
  },
  adSquareMobile: {
    width:         '72%',
    maxWidth:      280,
    alignSelf:     'center',
  },
  adSquareImg: {
    width:  '100%',
    height: '100%',
  },

  promoCopy: {
    flex:            1,
    minWidth:        260,
    alignItems:      'flex-end',
    justifyContent:  'center',
  },
  promoCopyMobile: {
    width:      '100%',
    minWidth:   0,
    alignItems: 'center',
  },

  infoBubble: {
    backgroundColor: Colors.white,
    borderRadius:    24,
    borderWidth:     1.5,
    borderColor:     Colors.borderYellow,
    borderTopWidth:  4,
    borderTopColor:  Colors.yellowDark,
    padding:         Spacing.xl,
    alignItems:      'flex-end',
    width:           '100%',
    maxWidth:        420,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(245,158,11,0.10)',
      } as any,
      default: {
        shadowColor:   '#f59e0b',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius:  14,
        elevation:     4,
      },
    }),
  },
  infoBubbleMobile: {
    maxWidth: '100%',
  },

  // ── Info content (shared mobile/desktop) ──────────────────────────────────
  infoIconCircle: {
    width: 52, height: 52, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.borderYellow,
    backgroundColor: 'rgba(245,158,11,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  infoIcon: { fontSize: FontSize.xl },
  infoTitle: {
    color: Colors.navy, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold,
    textAlign: 'right', marginBottom: Spacing.sm,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  infoDesc: {
    color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 24,
    textAlign: 'right', marginBottom: Spacing.lg,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  statsRow: { flexDirection: 'row-reverse', gap: Spacing.sm, flexWrap: 'wrap' as any },
  statChip: {
    backgroundColor: Colors.white,
    borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 2,
    ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as any }),
  },
  statEmoji: { fontSize: FontSize.base },
  statLabel: {
    color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center',
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

});

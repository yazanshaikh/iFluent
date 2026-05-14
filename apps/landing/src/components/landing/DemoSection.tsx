import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Colors } from '@ifluent/shared';
import { Spacing, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { useResponsive } from '@ifluent/shared';
import type { SiteSettings } from '@/api/public';

export interface DemoSectionProps {
  settings:    SiteSettings;
  onCtaPress?: () => void;
}

const PERKS = [
  { icon: '🎯', text: 'حصة تقييم مجانية 100%' },
  { icon: '⚡', text: 'رد خلال ساعة واحدة'     },
  { icon: '🎓', text: 'مستشار تعليمي متخصص'    },
  { icon: '📱', text: 'عبر التطبيق أو الويب'   },
];

export function DemoSection({ settings: _s, onCtaPress }: DemoSectionProps) {
  const { isMobile, rv } = useResponsive();

  return (
    <View style={styles.section}>
      <View style={styles.topWave} />

      <View style={[styles.inner, { flexDirection: isMobile ? 'column' : 'row-reverse' }]}>

        {/* صورة */}
        <View style={[styles.imgWrap, isMobile && { width: '100%', maxWidth: '100%' }]}>
          <Image
            source={require('@/assets/images/mascot-session.jpeg')}
            style={[styles.img, { height: rv({ mobile: 240, tablet: 300, desktop: 400 }) }]}
            resizeMode="cover"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeStars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.badgeTxt}>+500 طالب راضٍ</Text>
          </View>
        </View>

        {/* محتوى */}
        <View style={[styles.info, isMobile && { width: '100%', maxWidth: '100%' }]}>

          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowDot}>◆</Text>
            <Text style={styles.eyebrow}>ابدأ رحلتك</Text>
          </View>

          <Text style={[styles.title, { fontSize: rv({ mobile: FontSize['2xl'], desktop: 36 }) }]}>
            احجز حصة تقييم{'\n'}مستواك مجاناً 🎯
          </Text>

          <Text style={styles.desc}>
            في حصة واحدة نحدد مستواك الحقيقي ونرسم لك خطة تعليمية مخصصة مع أفضل معلم يناسبك.
          </Text>

          <View style={styles.perks}>
            {PERKS.map(p => (
              <View key={p.text} style={styles.perkRow}>
                <View style={styles.perkIcon}><Text style={styles.perkEmoji}>{p.icon}</Text></View>
                <Text style={styles.perkTxt}>{p.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cta} onPress={onCtaPress} activeOpacity={0.85}>
            <Text style={styles.ctaTxt}>احجز حصتك المجانية الآن 🚀</Text>
          </TouchableOpacity>

          <Text style={styles.trust}>✓ مجاني تماماً &nbsp; ✓ بدون إلزام &nbsp; ✓ رد سريع</Text>
        </View>

      </View>
    </View>
  );
}

const F = Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }) ?? {};
const R = { writingDirection: 'rtl' as any };

const styles = StyleSheet.create({
  section: { backgroundColor: Colors.backgroundWarm, paddingBottom: Spacing['4xl'], overflow: 'hidden' },
  topWave: {
    height: 60, backgroundColor: Colors.white,
    borderBottomLeftRadius: 60, borderBottomRightRadius: 60, marginBottom: Spacing['2xl'],
  },
  inner: {
    maxWidth: MAX_WIDTH, alignSelf: 'center', width: '100%',
    paddingHorizontal: Spacing.xl, gap: Spacing['2xl'], alignItems: 'center',
  },

  imgWrap: { flex: 1, maxWidth: 480, position: 'relative' as any, minWidth: 280 },
  img: {
    width: '100%', borderRadius: 28,
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(30,58,138,0.13)' } as any,
      default: { shadowColor: Colors.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 8 },
    }),
  },
  badge: {
    position: 'absolute' as any, bottom: 20, left: -16,
    backgroundColor: Colors.yellow, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', borderBottomWidth: 3, borderBottomColor: Colors.yellowDeep,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(255,193,7,0.45)' } as any }),
  },
  badgeStars: { fontSize: FontSize.base },
  badgeTxt: { color: Colors.navy, fontSize: FontSize.xs, fontWeight: FontWeight.bold, ...F, ...R },

  info: { flex: 1, maxWidth: 520, alignItems: 'flex-end', minWidth: 280 },

  eyebrowRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  eyebrowDot: { color: Colors.yellowDark, fontSize: 8 },
  eyebrow: { color: Colors.yellowDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 2, textTransform: 'uppercase' as any, ...F, ...R },

  title: { color: Colors.navy, fontWeight: FontWeight.extrabold, textAlign: 'right', marginBottom: Spacing.md, letterSpacing: -0.5, ...F, ...R },
  desc:  { color: Colors.textSecondary, fontSize: FontSize.base, textAlign: 'right', lineHeight: 26, marginBottom: Spacing.xl, ...F, ...R },

  perks: { gap: Spacing.md, marginBottom: Spacing.xl, width: '100%' },
  perkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  perkIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.yellowLight, borderWidth: 1, borderColor: Colors.borderYellow,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  perkEmoji: { fontSize: FontSize.lg },
  perkTxt: { color: Colors.navy, fontSize: FontSize.base, fontWeight: FontWeight.semibold, flex: 1, textAlign: 'right', ...F, ...R },

  cta: {
    backgroundColor: Colors.yellow, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 2,
    borderRadius: 22, borderBottomWidth: 4, borderBottomColor: Colors.yellowDeep,
    alignSelf: 'flex-end', marginBottom: Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(255,193,7,0.50)' } as any,
      default: { shadowColor: Colors.yellow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 10 },
    }),
  },
  ctaTxt: { color: Colors.navy, fontSize: FontSize.md, fontWeight: FontWeight.extrabold, ...F, ...R },
  trust:  { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right', ...F, ...R },
});

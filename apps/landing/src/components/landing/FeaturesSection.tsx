/**
 * FeaturesSection — Light modern cards matching page theme (yellow/white/navy)
 * Design: white cards, colored top-border accent, soft icon circles,
 * watermark number, hover lift + color glow.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import { Colors } from '@ifluent/shared';
import { Spacing, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { useResponsive } from '@ifluent/shared';

type FeatureDef = {
  num: string; icon: string; title: string; desc: string;
  accent: string; bg: string; border: string; iconBg: string;
  /** Translucent “glass” card + blur on web */
  glass?: boolean;
};

const FEATURES: FeatureDef[] = [
  { num:'01', icon:'🎯', title:'تعلّم موجّه ومخصص',
    desc:'مسار تعليمي مصمم خصيصاً لك بناءً على مستواك وأهدافك.',
    accent:'#6366F1', bg:'#EEF2FF', border:'#C7D2FE', iconBg:'rgba(99,102,241,0.12)' },
  { num:'02', icon:'👨‍🏫', title:'معلمون معتمدون',
    desc:'نخبة معلمين متخصصين  معلمين عرب واجانب.',
    accent:'#10B981', bg:'#F0FDF4', border:'#BBF7D0', iconBg:'rgba(16,185,129,0.12)' },
  { num:'03', icon:'📹', title:'حصص فردية تفاعلية',
    desc:'جلسات خاصة مع معلمك: أنشطة مباشرة وتمارين تفاعلية تناسب مستواك.',
    accent:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE', iconBg:'rgba(59,130,246,0.12)' },
  { num:'04', icon:'🧠', title:'كويزات ذكية',
    desc:'اختبر معلوماتك بعد كل درس للتاكد من تثبيت معلومات الدرس  ',
    accent:'#F59E0B', bg:'#FFFBEB', border:'#FDE68A', iconBg:'rgba(245,158,11,0.12)' },
  { num:'05', icon:'📝', title:'دفتر ملاحظاتي',
    desc:'سجّل أهم ما تعلمته — منظم، مثبّت، وسهل الوصول دائماً.',
    accent:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE', iconBg:'rgba(139,92,246,0.12)' },
  { num:'06', icon:'📊', title:'تتبع تقدمك لحظياً',
    desc:'لوحة تحكم واضحة لإتمام المستويات ودرجاتك التفصيلية.',
    accent:'#14B8A6', bg:'#F0FDFA', border:'#99F6E4', iconBg:'rgba(20,184,166,0.12)' },
  { num:'07', icon:'🔔', title:'تذكيرات ذكية',
    desc:'لن تنسى أي حصة — إشعار على هاتفك قبل موعدك مباشرة.',
    accent:'#EF4444', bg:'#FFF1F2', border:'#FECDD3', iconBg:'rgba(239,68,68,0.12)' },
  { num:'08', icon:'⭐', title:' قسم اشراف وقسم استشاري خاص للطلاب ',
    desc:' متابعة الطلاب من خلال مشرفين عرب وقسم استشاري مجانا متاح لطلاب منصة اي فلوينت   .',
    accent:'#FFC107',
    bg:'rgba(255, 251, 235, 0.42)', border:'rgba(253, 230, 138, 0.65)', iconBg:'rgba(255,193,7,0.14)',
    glass: true },
];

export function FeaturesSection() {
  const { isMobile, isTablet, rv } = useResponsive();

  return (
    <View style={styles.section} nativeID="features">

      {/* ── Header + mascot split ── */}
      <View style={[styles.topRow, isMobile && styles.topRowMobile]}>
        <View style={[styles.mascotWrap, isMobile && styles.mascotWrapMobile]}>
          <Image
            source={require('../../../assets/images/mascot-kid.jpeg')}
            style={styles.mascotImage}
            resizeMode="cover"
          />
          <View style={styles.mascotFloat}>
            <Text style={styles.mascotFloatText}>🎉 ممتاز! أكملت الدرس!</Text>
          </View>
        </View>

        <View style={[styles.headerText, isMobile && styles.headerTextMobile]}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowDot}>◆</Text>
            <Text style={styles.eyebrow}>لماذا iFluent؟</Text>
          </View>
          <Text style={[styles.title, { fontSize: rv({ mobile: FontSize['2xl'], desktop: 38 }) }]}>
            كل ما تحتاجه{'\n'}في مكان واحد
          </Text>
          <Text style={styles.subtitle}>
            منصة متكاملة  صُممت لتجعل تعلم الإنجليزية تجربة ممتعة، فعّالة، وقابلة للقياس.
          </Text>
          <View style={styles.quickStats}>
            {[['🏆','98%','رضا الطلاب'], ['📚','5','مستويات'], ['👨‍🏫','+50','معلم']].map(([e,v,l]) => (
              <View key={String(l)} style={styles.statChip}>
                <Text style={styles.statChipEmoji}>{String(e)}</Text>
                <Text style={styles.statChipValue}>{String(v)}</Text>
                <Text style={styles.statChipLabel}>{String(l)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Cards grid ── */}
      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <FeatureCard
            key={f.num}
            f={f}
            width={isMobile ? '100%' : isTablet ? '47%' : '23%'}
          />
        ))}
      </View>
    </View>
  );
}

function FeatureCard({ f, width }: { f: FeatureDef; width: any }) {
  const [hovered, setHovered] = useState(false);
  const glass = !!f.glass;

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.card,
        { width, backgroundColor: f.bg, borderColor: f.border, borderTopColor: f.accent },
        glass && styles.cardGlass,
        Platform.OS === 'web' && hovered
          ? {
              transform: [{ translateY: -6 }] as any,
              boxShadow: glass
                ? '0 12px 28px rgba(255,193,7,0.22)'
                : `0 12px 32px ${f.accent}30`,
            }
          : Platform.OS === 'web'
          ? {
              boxShadow: glass
                ? '0 2px 14px rgba(255,193,7,0.12)'
                : '0 2px 10px rgba(0,0,0,0.06)',
            }
          : {
              shadowColor:   f.accent,
              shadowOffset:  { width: 0, height: hovered ? 8 : 2 },
              shadowOpacity: glass ? (hovered ? 0.18 : 0.08) : hovered ? 0.25 : 0.10,
              shadowRadius:  hovered ? 16 : 6,
              elevation:     hovered ? 8 : 2,
            },
      ] as any}
    >
      {/* Watermark number */}
      <Text style={[styles.watermark, { color: f.accent }]}>{f.num}</Text>

      {/* Accent top border already via borderTopColor */}

      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: f.iconBg, borderColor: f.border }]}>
        <Text style={styles.icon}>{f.icon}</Text>
      </View>

      <Text style={[styles.cardTitle, { color: f.accent }]}>{f.title}</Text>
      <Text style={styles.cardDesc}>{f.desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical:   Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor:   Colors.white,
    alignItems:        'center',
  },

  // Top split
  topRow: {
    flexDirection:  'row-reverse',
    alignItems:     'center',
    maxWidth:       MAX_WIDTH,
    width:          '100%',
    gap:            Spacing['3xl'],
    marginBottom:   Spacing['3xl'],
  },
  topRowMobile: { flexDirection: 'column', gap: Spacing.xl },

  mascotWrap: { flex: 1, maxWidth: 440, position: 'relative' as any },
  mascotWrapMobile: { maxWidth: '100%', width: '100%' },
  mascotImage: {
    width: '100%', height: 280, borderRadius: 28,
    ...Platform.select({ web: { boxShadow: '0 8px 32px rgba(30,58,138,0.10)' } as any }),
  },
  mascotFloat: {
    position: 'absolute' as any, bottom: -16, right: 16,
    backgroundColor: Colors.yellow, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 3, borderBottomColor: Colors.yellowDeep,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(255,193,7,0.4)' } as any }),
  },
  mascotFloatText: {
    color: Colors.navy, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  headerText:       { flex: 1, alignItems: 'flex-end' },
  headerTextMobile: { alignItems: 'center', width: '100%' },
  eyebrowRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  eyebrowDot: { color: Colors.yellowDark, fontSize: 8 },
  eyebrow: {
    color: Colors.yellowDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    letterSpacing: 2, textTransform: 'uppercase' as any,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  title: {
    color: Colors.navy, fontWeight: FontWeight.extrabold,
    textAlign: 'right', marginBottom: Spacing.md, letterSpacing: -0.5,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  subtitle: {
    color: Colors.textSecondary, fontSize: FontSize.base, textAlign: 'right',
    lineHeight: 26, marginBottom: Spacing.xl,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  quickStats: { flexDirection: 'row-reverse', gap: Spacing.sm, flexWrap: 'wrap' as any },
  statChip: {
    backgroundColor: Colors.backgroundGray, borderRadius: 16,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, minWidth: 70,
  },
  statChipEmoji: { fontSize: FontSize.lg, marginBottom: 2 },
  statChipValue: { color: Colors.navy, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  statChipLabel: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Grid ──
  grid: {
    flexDirection: 'row', flexWrap: 'wrap' as any,
    justifyContent: 'center', gap: Spacing.md,
    maxWidth: MAX_WIDTH, width: '100%',
  },

  // ── Card ──
  card: {
    borderRadius:    22,
    borderWidth:     1.5,
    borderTopWidth:  4,             // thick top accent bar
    padding:         Spacing.lg,
    alignItems:      'flex-end',
    overflow:        'hidden',
    position:        'relative' as any,
    ...Platform.select({
      web: { transition: 'transform 0.22s ease, box-shadow 0.22s ease' } as any,
    }),
  },
  /** Frosted / translucent card (e.g. «تقييمات شفافة») */
  cardGlass: Platform.select({
    web: {
      backdropFilter:       'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    } as any,
    default: {},
  }),

  // Watermark
  watermark: {
    position:   'absolute' as any,
    bottom:     -20,
    left:       -4,
    fontSize:   90,
    fontWeight: FontWeight.extrabold,
    opacity:    0.06,
    lineHeight: 90,
    letterSpacing: -4,
    ...Platform.select({
      web: { fontFamily: "'Tajawal', sans-serif", userSelect: 'none', pointerEvents: 'none' } as any,
    }),
  },

  // Icon
  iconCircle: {
    width: 52, height: 52, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, zIndex: 1,
  },
  icon: { fontSize: FontSize.xl },

  cardTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold,
    textAlign: 'right', marginBottom: Spacing.xs, zIndex: 1,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  cardDesc: {
    color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 20,
    textAlign: 'right', zIndex: 1,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
});

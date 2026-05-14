/**
 * LevelsSection — Modern Minimalist Learning Path Cards
 *
 * Design language:
 *  • Mesh-gradient dark cards (multi-layer LinearGradient blobs)
 *  • 3D Isometric icon illustration per level
 *  • Hover: card lifts + glow shadow in card's accent color
 *  • Watermark level number (huge, near-invisible) in corner
 *  • Arabic Tajawal font (injected in _layout)
 *  • Custom checkmark rows (no plain bullets)
 *  • No badge labels
 *  • Horizontal snap carousel
 */

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Pressable, NativeSyntheticEvent, NativeScrollEvent,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/colors';
import { Spacing, MAX_WIDTH } from '@/src/constants/layout';
import { FontSize, FontWeight } from '@/src/constants/typography';
import { useResponsive } from '@/src/hooks/useResponsive';

// ── Level definitions ──────────────────────────────────────────────────────────
const LEVELS = [
  {
    number:  1,
    name:    'الأساس',
    nameEn:  'Foundation',
    tagline: 'رحلتك تبدأ من هنا',
    // Isometric icon concept: seedling growing from ground
    isoTopFace:    '#1D1545',
    isoRightFace:  '#130E32',
    isoLeftFace:   '#241C5A',
    isoEmoji:      '🌱',
    isoLabel:      'GROW',
    // Mesh gradient layers
    gradBase:  ['#0A0718', '#140D2E', '#0D1235'] as const,
    meshColor1: 'rgba(109, 40, 217, 0.40)',  // violet blob
    meshColor2: 'rgba(37, 99, 235, 0.25)',   // blue blob
    // Accent
    accent:  '#A78BFA',
    glow:    'rgba(139, 92, 246, 0.65)',
    border:  'rgba(167, 139, 250, 0.20)',
    borderHover: 'rgba(167, 139, 250, 0.50)',
    checkColor: '#A78BFA',
    skills: [
      'الأبجدية والنطق الصحيح',
      'جمل أساسية وتعريف النفس',
      'الاستماع وفهم المحادثة',
    ],
    desc: 'نقطة البداية لكل متعلم — الحروف، المفردات الأساسية، وبناء الثقة في النطق.',
  },
  {
    number:  2,
    name:    ' البناء',
    nameEn:  'Construction',
    tagline: 'ابنِ قواعدك خطوة بخطوة،ابدا بصناعة الجمل',
    isoTopFace:    '#0A1A40',
    isoRightFace:  '#061228',
    isoLeftFace:   '#0E2452',
    isoEmoji:      '⚙️',
    isoLabel:      'BUILD',
    gradBase:  ['#050C1F', '#0A1835', '#061428'] as const,
    meshColor1: 'rgba(2, 132, 199, 0.38)',    // sky blue blob
    meshColor2: 'rgba(99, 102, 241, 0.22)',   // indigo blob
    accent:  '#38BDF8',
    glow:    'rgba(56, 189, 248, 0.65)',
    border:  'rgba(56, 189, 248, 0.20)',
    borderHover: 'rgba(56, 189, 248, 0.50)',
    checkColor: '#38BDF8',
    skills: [
      'تكوين جمل صحيحة نحوياً',
      'محادثة يومية بسيطة',
      'قراءة وفهم نصوص قصيرة',
    ],
    desc: 'بناء القواعد اللغوية بشكل صحيح — حتى تتحدث بثقة ووضوح.',
  },
  {
    number:  3,
    name:    'الفهم والتوسع',
    nameEn:  'Expansion',
    tagline: 'وسّع آفاقك — لا حدود للتعلم',
    isoTopFace:    '#041F18',
    isoRightFace:  '#021410',
    isoLeftFace:   '#062A22',
    isoEmoji:      '🚀',
    isoLabel:      'EXPAND',
    gradBase:  ['#021410', '#04201A', '#031A14'] as const,
    meshColor1: 'rgba(5, 150, 105, 0.38)',   // emerald blob
    meshColor2: 'rgba(6, 182, 212, 0.22)',   // cyan blob
    accent:  '#34D399',
    glow:    'rgba(52, 211, 153, 0.65)',
    border:  'rgba(52, 211, 153, 0.20)',
    borderHover: 'rgba(52, 211, 153, 0.50)',
    checkColor: '#34D399',
    skills: [
      'مفردات متقدمة — 500+ كلمة',
      'مناقشة مواضيع متنوعة',
      'الكتابة الوصفية والتعبير',
      'الاستماع الفعّال للمتحدثين الأصليين',
    ],
    desc: 'توسيع المخزون اللغوي والانطلاق نحو محادثات حقيقية وطبيعية.',
  },
  {
    number:  4,
    name:    'الطلاقة والثقة',
    nameEn:  'Fluency',
    tagline: 'تحدّث بطلاقة — كالناطق الأصلي',
    isoTopFace:    '#1F1200',
    isoRightFace:  '#140C00',
    isoLeftFace:   '#2A1A00',
    isoEmoji:      '💬',
    isoLabel:      'SPEAK',
    gradBase:  ['#130B00', '#1F1200', '#170E00'] as const,
    meshColor1: 'rgba(217, 119, 6, 0.40)',   // amber blob
    meshColor2: 'rgba(239, 68, 68, 0.18)',   // red tint
    accent:  '#FCD34D',
    glow:    'rgba(252, 211, 77, 0.65)',
    border:  'rgba(252, 211, 77, 0.20)',
    borderHover: 'rgba(252, 211, 77, 0.50)',
    checkColor: '#FCD34D',
    skills: [
      'محادثة تلقائية وطبيعية',
      'تعابير اصطلاحية وعامية',
      'ثقة في التحدث ',
      'الكتابة الإبداعية والإقناعية',
    ],
    desc: 'التحدث بشكل تلقائي دون التوقف للتفكير — الطلاقة الحقيقية.',
  },
  {
    number:  5,
    name:    'الإتقان',
    nameEn:  'Mastery',
    tagline: 'بلغة المحترفين..ضع بصمتك الخاصة',
    isoTopFace:    '#150830',
    isoRightFace:  '#0D0520',
    isoLeftFace:   '#1C0A40',
    isoEmoji:      '👑',
    isoLabel:      'MASTER',
    gradBase:  ['#0B041C', '#150828', '#0D0620'] as const,
    meshColor1: 'rgba(147, 51, 234, 0.42)',  // purple blob
    meshColor2: 'rgba(236, 72, 153, 0.22)',  // pink tint
    accent:  '#C084FC',
    glow:    'rgba(192, 132, 252, 0.65)',
    border:  'rgba(192, 132, 252, 0.20)',
    borderHover: 'rgba(192, 132, 252, 0.50)',
    checkColor: '#C084FC',
    skills: [
      'اللغة الأكاديمية والبحثية',
      'العروض المهنية والتقديمية',
      'الكتابة المتقدمة والأدبية',
      'تحليل النصوص ونقدها',
    ],
    desc: 'إتقان اللغة بمستوى شبه ناطق أصلي — في الكتابة والكلام والتفكير ممارسة اللكنة الاجنبية',
  },
];

// ── Layout constants ───────────────────────────────────────────────────────────
const CARD_W   = 308;
const CARD_H   = 460;
const CARD_GAP = 18;

// ── Main section ──────────────────────────────────────────────────────────────
export function LevelsSection() {
  const { isMobile, rv } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x   = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (CARD_W + CARD_GAP));
    setActiveIdx(Math.max(0, Math.min(idx, LEVELS.length - 1)));
  };

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * (CARD_W + CARD_GAP), animated: true });
    setActiveIdx(idx);
  };

  return (
    <View style={styles.section} nativeID="levels">

      {/* ── Section background blobs ── */}
      <View style={[styles.sectionBlob, styles.sectionBlobTR]} />
      <View style={[styles.sectionBlob, styles.sectionBlobBL]} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowDot}>◆</Text>
          <Text style={styles.eyebrowText}>المسار التعليمي</Text>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: rv({ mobile: FontSize['2xl'], desktop: 38 }) }]}>
          5 مستويات من الصفر إلى الإتقان
        </Text>
        <Text style={styles.sectionSub}>
          اسحب واستكشف كل مستوى — كل بطاقة تحكي قصة رحلة
        </Text>
      </View>

      {/* ── Mobile: swipeable carousel ── */}
      {isMobile && (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={CARD_W + CARD_GAP}
            snapToAlignment="center"
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.carouselContent, { paddingHorizontal: Spacing.xl }]}
          >
            {LEVELS.map((level, idx) => (
              <LevelCard key={level.number} level={level} isActive={activeIdx === idx} />
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {LEVELS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
                <View style={[
                  styles.dot,
                  i === activeIdx
                    ? [styles.dotActive, { backgroundColor: LEVELS[i].accent }]
                    : styles.dotInactive,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* ── Desktop: arrow-only navigation, one card at a time ── */}
      {!isMobile && (
        <View style={styles.desktopNav}>
          {/* Left arrow (next level — RTL so left = higher number) */}
          <ArrowBtn
            dir="←"
            color={LEVELS[activeIdx].accent}
            onPress={() => goTo(Math.min(activeIdx + 1, LEVELS.length - 1))}
            disabled={activeIdx === LEVELS.length - 1}
          />

          {/* Single card clip container */}
          <View style={styles.desktopCardClip}>
            <ScrollView
              ref={scrollRef}
              horizontal
              scrollEnabled={false}         // arrows only — no mouse/touch drag
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + CARD_GAP}
              snapToAlignment="start"
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.desktopCarouselContent}
            >
              {LEVELS.map((level, idx) => (
                <LevelCard key={level.number} level={level} isActive={activeIdx === idx} />
              ))}
            </ScrollView>
          </View>

          {/* Right arrow (previous level) */}
          <ArrowBtn
            dir="→"
            color={LEVELS[activeIdx].accent}
            onPress={() => goTo(Math.max(activeIdx - 1, 0))}
            disabled={activeIdx === 0}
          />
        </View>
      )}

      {/* Desktop counter + dots */}
      {!isMobile && (
        <View style={styles.desktopCounter}>
          {LEVELS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
              <View style={[
                styles.dot,
                i === activeIdx
                  ? [styles.dotActive, { backgroundColor: LEVELS[i].accent }]
                  : styles.dotInactive,
              ]} />
            </TouchableOpacity>
          ))}
          <Text style={styles.arrowCounter}>
            <Text style={{ color: LEVELS[activeIdx].accent, fontWeight: FontWeight.extrabold }}>
              {String(activeIdx + 1).padStart(2, '0')}
            </Text>
            <Text style={{ color: Colors.textMuted }}> / 05</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Single Level Card ─────────────────────────────────────────────────────────
function LevelCard({
  level,
  isActive,
}: {
  level: typeof LEVELS[0];
  isActive: boolean;
}) {
  // hover state (web only)
  const [hovered, setHovered] = useState(false);

  const cardStyle = [
    styles.cardOuter,
    isActive && styles.cardOuterActive,
    // Web hover — translate up + glow
    Platform.OS === 'web' && hovered
      ? {
          transform:  [{ translateY: -10 }] as any,
          boxShadow:  `0 24px 60px ${level.glow}, 0 0 0 1px ${level.borderHover}`,
        }
      : Platform.OS === 'web'
      ? { boxShadow: `0 8px 30px ${level.glow.replace('0.65', '0.30')}, 0 0 0 1px ${level.border}` }
      : {
          shadowColor:   level.accent,
          shadowOffset:  { width: 0, height: isActive ? 16 : 6 },
          shadowOpacity: isActive ? 0.4 : 0.2,
          shadowRadius:  isActive ? 32 : 12,
          elevation:     isActive ? 14 : 5,
        },
  ];

  return (
    <Pressable
      style={cardStyle as any}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {/* ── Mesh gradient base ── */}
      <LinearGradient
        colors={level.gradBase}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.cardGrad}
      >
        {/* ── Mesh blob 1 ── */}
        <View style={[styles.meshBlob, styles.meshBlob1, { backgroundColor: level.meshColor1 }]} />
        {/* ── Mesh blob 2 ── */}
        <View style={[styles.meshBlob, styles.meshBlob2, { backgroundColor: level.meshColor2 }]} />

        {/* ── Watermark number ── */}
        <Text style={[styles.watermark, { color: level.accent }]}>
          {String(level.number).padStart(2, '0')}
        </Text>

        {/* ── Content ── */}
        <View style={styles.cardContent}>

          {/* Top row: iso icon + en label */}
          <View style={styles.cardTopRow}>
            <IsometricIcon
              emoji={level.isoEmoji}
              accent={level.accent}
              topFace={level.isoTopFace}
              rightFace={level.isoRightFace}
              leftFace={level.isoLeftFace}
              glow={level.glow}
            />
            <View style={[styles.isoLabelPill, { borderColor: level.border, backgroundColor: level.border }]}>
              <Text style={[styles.isoLabelText, { color: level.accent }]}>{level.isoLabel}</Text>
            </View>
          </View>

          {/* Divider line */}
          <View style={[styles.accentLine, { backgroundColor: level.accent }]} />

          {/* Level number + name */}
          <Text style={[styles.cardLevelNum, { color: level.accent }]}>
            Level {level.number}
          </Text>
          <Text style={styles.cardName}>{level.name}</Text>
          <Text style={styles.cardNameEn}>{level.nameEn}</Text>
          <Text style={[styles.cardTagline, { color: level.accent }]}>
            « {level.tagline} »
          </Text>

          {/* Skills with checkmarks */}
          <View style={styles.skillsBlock}>
            {level.skills.map((skill) => (
              <SkillRow key={skill} text={skill} color={level.checkColor} />
            ))}
          </View>

          {/* Description */}
          <View style={[styles.descBlock, { borderTopColor: level.border }]}>
            <Text style={styles.descText} numberOfLines={2}>{level.desc}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ── Isometric 3D Icon ─────────────────────────────────────────────────────────
function IsometricIcon({
  emoji, accent, topFace, rightFace, leftFace, glow,
}: {
  emoji: string; accent: string; topFace: string;
  rightFace: string; leftFace: string; glow: string;
}) {
  return (
    <View style={styles.isoWrap}>
      {/* Glow aura */}
      <View style={[styles.isoGlow, { backgroundColor: glow }]} />

      {/* Isometric cube body */}
      <View style={styles.isoCube}>
        {/* Top face */}
        <View style={[styles.isoFaceTop, { backgroundColor: topFace, borderColor: accent + '30' }]} />
        {/* Left face */}
        <View style={[styles.isoFaceLeft, { backgroundColor: leftFace, borderColor: accent + '20' }]} />
        {/* Right face */}
        <View style={[styles.isoFaceRight, { backgroundColor: rightFace, borderColor: accent + '20' }]} />
        {/* Emoji on top face */}
        <Text style={styles.isoEmoji}>{emoji}</Text>
      </View>

      {/* Accent ring */}
      <View style={[styles.isoRing, { borderColor: accent + '40' }]} />
    </View>
  );
}

// ── Skill row with custom checkmark ──────────────────────────────────────────
function SkillRow({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.skillRow}>
      {/* Custom checkmark */}
      <View style={[styles.checkmark, { borderColor: color, backgroundColor: color + '18' }]}>
        <Text style={[styles.checkmarkIcon, { color }]}>✓</Text>
      </View>
      <Text style={styles.skillText}>{text}</Text>
    </View>
  );
}

// ── Arrow button ──────────────────────────────────────────────────────────────
function ArrowBtn({
  dir, color, onPress, disabled,
}: {
  dir: string; color: string; onPress: () => void; disabled: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.arrowBtn,
        { borderColor: disabled ? Colors.border : color + '60' },
        disabled && { opacity: 0.35 },
        Platform.OS === 'web' && !disabled
          ? { boxShadow: `0 0 12px ${color}50` } as any
          : undefined,
      ]}
    >
      <Text style={[styles.arrowBtnText, { color: disabled ? Colors.textMuted : color }]}>
        {dir}
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Section ──
  section: {
    paddingTop:      Spacing['4xl'],
    paddingBottom:   Spacing['3xl'],
    backgroundColor: Colors.backgroundWarm,   // Yellow-warm — matches rest of page
    alignItems:      'center',
    overflow:        'hidden',
    position:        'relative' as any,
  },
  sectionBlob: {
    position:      'absolute' as any,
    borderRadius:  9999,
    opacity:       0.08,
  },
  sectionBlobTR: {
    width:  600,
    height: 600,
    top:    -220,
    right:  -200,
    backgroundColor: Colors.yellow,           // Soft yellow blob
  },
  sectionBlobBL: {
    width:  500,
    height: 500,
    bottom: -220,
    left:   -200,
    backgroundColor: Colors.navy,             // Soft navy blob
  },

  // ── Header ──
  header: {
    alignItems:        'center',
    marginBottom:      Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    maxWidth:          700,
    zIndex:            2,
  },
  eyebrowPill: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    gap:               Spacing.xs,
    backgroundColor:   Colors.yellowLight,
    borderWidth:       1,
    borderColor:       Colors.borderYellow,
    borderRadius:      50,
    paddingHorizontal: Spacing.md,
    paddingVertical:   6,
    marginBottom:      Spacing.md,
  },
  eyebrowDot: {
    color:    Colors.yellowDark,
    fontSize: 8,
  },
  eyebrowText: {
    color:         Colors.yellowDark,
    fontSize:      FontSize.sm,
    fontWeight:    FontWeight.semibold,
    letterSpacing: 2,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  sectionTitle: {
    color:        Colors.navy,
    fontWeight:   FontWeight.extrabold,
    textAlign:    'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  sectionSub: {
    color:     Colors.textSecondary,
    fontSize:  FontSize.base,
    textAlign: 'center',
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Mobile carousel content ──
  carouselContent: {
    paddingVertical: Spacing.xl,
    gap:             CARD_GAP,
    alignItems:      'center',
  },

  // ── Desktop nav row: arrow | card | arrow ──
  desktopNav: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xl,
    marginBottom:  Spacing.md,
    zIndex:        2,
  },
  desktopCardClip: {
    width:    CARD_W,
    height:   CARD_H + Spacing.xl * 2,
    ...Platform.select({ web: { overflow: 'hidden' } as any }),
  },
  desktopCarouselContent: {
    gap:             CARD_GAP,
    alignItems:      'center',
    paddingVertical: Spacing.xl,
  },
  desktopCounter: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    zIndex:        2,
  },

  // ── Card outer (hover wrapper) ──
  cardOuter: {
    width:        CARD_W,
    height:       CARD_H,
    borderRadius: 28,
    overflow:     'hidden',
    transform:    [{ scale: 0.96 }],
    ...Platform.select({
      web: { transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease' } as any,
    }),
  },
  cardOuterActive: {
    transform: [{ scale: 1 }],
  },
  cardGrad: {
    flex:     1,
    padding:  Spacing.xl,
    overflow: 'hidden',
    position: 'relative' as any,
  },

  // ── Mesh blobs (fake radial gradient) ──
  meshBlob: {
    position:     'absolute' as any,
    borderRadius: 9999,
    ...Platform.select({
      web: { filter: 'blur(60px)' } as any,
    }),
  },
  meshBlob1: {
    width:  220,
    height: 220,
    top:    -60,
    right:  -60,
  },
  meshBlob2: {
    width:  200,
    height: 200,
    bottom: 20,
    left:   -80,
  },

  // ── Watermark number ──
  watermark: {
    position:      'absolute' as any,
    bottom:        -30,
    right:         -10,
    fontSize:      148,
    fontWeight:    FontWeight.extrabold,
    opacity:       0.055,
    lineHeight:    148,
    letterSpacing: -8,
    ...Platform.select({
      web: {
        fontFamily:    "'Tajawal', sans-serif",
        userSelect:    'none',
        pointerEvents: 'none',
      } as any,
    }),
  },

  // ── Card content ──
  cardContent: {
    flex:    1,
    zIndex:  2,
  },
  cardTopRow: {
    flexDirection:  'row-reverse',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.md,
  },
  isoLabelPill: {
    borderWidth:       1,
    borderRadius:      6,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
    marginTop:         4,
  },
  isoLabelText: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    letterSpacing: 1.5,
  },
  accentLine: {
    height:       2,
    width:        40,
    borderRadius: 1,
    marginBottom: Spacing.md,
    alignSelf:    'flex-end',
  },
  cardLevelNum: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    letterSpacing: 2,
    textAlign:     'right',
    marginBottom:  4,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
  },
  cardName: {
    color:        '#FFFFFF',
    fontSize:     FontSize['2xl'],
    fontWeight:   FontWeight.extrabold,
    textAlign:    'right',
    marginBottom: 2,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },
  cardNameEn: {
    color:        'rgba(255,255,255,0.40)',
    fontSize:     FontSize.sm,
    fontWeight:   FontWeight.semibold,
    textAlign:    'right',
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  cardTagline: {
    fontSize:     FontSize.xs,
    fontStyle:    'italic' as any,
    textAlign:    'right',
    marginBottom: Spacing.md,
    opacity:      0.85,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Skills ──
  skillsBlock: {
    gap:          6,
    marginBottom: Spacing.md,
  },
  skillRow: {
    flexDirection: 'row-reverse',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  checkmark: {
    width:          20,
    height:         20,
    borderRadius:   6,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  checkmarkIcon: {
    fontSize:   10,
    fontWeight: FontWeight.extrabold,
    lineHeight: 12,
  },
  skillText: {
    color:     'rgba(255,255,255,0.75)',
    fontSize:  FontSize.xs,
    flex:      1,
    textAlign: 'right',
    lineHeight: 18,
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Description ──
  descBlock: {
    borderTopWidth: 1,
    paddingTop:     Spacing.sm,
    marginTop:      'auto' as any,
  },
  descText: {
    color:      'rgba(255,255,255,0.40)',
    fontSize:   FontSize.xs,
    lineHeight: 18,
    textAlign:  'right',
    ...Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }),
    writingDirection: 'rtl' as any,
  },

  // ── Isometric Icon ──
  isoWrap: {
    width:    76,
    height:   76,
    position: 'relative' as any,
    alignItems:     'center',
    justifyContent: 'center',
  },
  isoGlow: {
    position:     'absolute' as any,
    width:        56,
    height:       56,
    borderRadius: 28,
    opacity:      0.30,
    ...Platform.select({
      web: { filter: 'blur(16px)' } as any,
    }),
  },
  isoCube: {
    width:    60,
    height:   60,
    position: 'relative' as any,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   16,
    ...Platform.select({
      web: {
        transform:  'rotateX(8deg) rotateY(-8deg)',
        transformStyle: 'preserve-3d',
      } as any,
    }),
  },
  isoFaceTop: {
    position:     'absolute' as any,
    width:        56,
    height:       56,
    borderRadius: 14,
    borderWidth:  1,
    top:          0,
    left:         2,
  },
  isoFaceLeft: {
    position:      'absolute' as any,
    width:         8,
    height:        56,
    bottom:        -4,
    left:          2,
    borderRadius:  4,
    borderWidth:   1,
    transform:     [{ skewY: '-30deg' }],
  },
  isoFaceRight: {
    position:      'absolute' as any,
    width:         56,
    height:        8,
    bottom:        -4,
    left:          2,
    borderRadius:  4,
    borderWidth:   1,
    transform:     [{ skewX: '-30deg' }],
  },
  isoEmoji: {
    fontSize:  30,
    zIndex:    3,
    position: 'relative' as any,
    ...Platform.select({ web: { userSelect: 'none' } as any }),
  },
  isoRing: {
    position:     'absolute' as any,
    width:        72,
    height:       72,
    borderRadius: 36,
    borderWidth:  1,
    top:          2,
    left:         2,
    opacity:      0.6,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection:  'row',
    gap:            8,
    marginTop:      Spacing.lg,
    alignItems:     'center',
    zIndex:         2,
  },
  dot:         { height: 6, borderRadius: 3 },
  dotActive:   { width: 28 },
  dotInactive: { width: 6, backgroundColor: Colors.border },

  // ── Arrows ──
  arrowRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.xl,
    marginTop:      Spacing.xl,
    zIndex:         2,
  },
  arrowBtn: {
    width:          44,
    height:         44,
    borderRadius:   22,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    ...Platform.select({
      web: { transition: 'box-shadow 0.2s' } as any,
    }),
  },
  arrowBtnText: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  arrowCounter: {
    fontSize:  FontSize.md,
    minWidth:  60,
    textAlign: 'center',
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
});

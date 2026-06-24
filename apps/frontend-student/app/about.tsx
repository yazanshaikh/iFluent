/**
 * About screen — premium minimal design.
 * Wheel: scrollable tall cards (icon + text together).
 * Pure React Native Animated — zero Reanimated, zero Gesture Handler.
 */
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, Animated, Dimensions,
} from 'react-native';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow } from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: 'layers-outline'      as const, label: 'مستويات بتناسبك',  sub: 'من الصفر لحد ما تِتقنها صح!' },
  { icon: 'videocam-outline'    as const, label: 'حصص لايف مباشرة',  sub: 'مع معلمين خبراء بالوقت اللي بريحك' },
  { icon: 'help-circle-outline' as const, label: 'كويزات تفاعلية',   sub: 'بتتحداك وتطوّر مستواك كل مرة' },
  { icon: 'journal-outline'     as const, label: 'دفتر ملاحظاتك',    sub: 'كل أفكارك بمكان واحد جوّا التطبيق' },
  { icon: 'trending-up-outline' as const, label: 'متابعة شخصية',     sub: 'مشرفك بيوجهك ومعكفوق خريطة المسار  خطوة بخطوة' },
];

// ─── Wheel geometry ────────────────────────────────────────────────────────────
//
//  Each scroll slot = one tall narrow card (icon + label + sub).
//  VIS_H = 3 × ITEM_H  →  shows active card + one above + one below.
//  PAD_V = ITEM_H       →  first / last card stays centred at scroll limits.
//
const N      = FEATURES.length;                    // 5
const ITEM_H = 130;                                // slot height — tall enough for text
const CWIDTH = Dimensions.get('window').width - 32; // fills content area (16px page padding × 2)
const VIS_H  = ITEM_H * 3;                        // 390 — visible strip height
const PAD_V  = ITEM_H;                             // 130 — scroll top/bottom padding

// ─── WheelItem — the card that scrolls ────────────────────────────────────────

interface WheelItemProps {
  feature: (typeof FEATURES)[0];
  index:   number;
  scrollY: Animated.Value;
  active:  number;
}

function WheelItem({ feature, index, scrollY, active }: WheelItemProps) {
  const isActive = index === active;
  const H = ITEM_H;
  const i = index;

  // Items ±1.5 slots from centre fade to invisible — depth illusion via interpolate
  const scale = scrollY.interpolate({
    inputRange:  [(i-1.5)*H, (i-1)*H, i*H, (i+1)*H, (i+1.5)*H],
    outputRange: [    0.42,     0.72, 1.06,    0.72,      0.42],
    extrapolate: 'clamp',
  });

  const opacity = scrollY.interpolate({
    inputRange:  [(i-1.5)*H, (i-1)*H, i*H, (i+1)*H, (i+1.5)*H],
    outputRange: [     0.0,     0.42,  1.0,     0.42,       0.0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.itemSlot, { transform: [{ scale }], opacity }]}>
      <View style={[styles.featureCard, isActive && styles.featureCardActive]}>

        {/* Icon */}
        <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
          <Ionicons
            name={feature.icon}
            size={22}
            color={isActive ? C.amber : 'rgba(130, 110, 60, 0.38)'}
          />
        </View>

        {/* Label */}
        <Text
          style={[styles.cardLabel, { color: isActive ? C.navy : C.gray }]}
          numberOfLines={1}
        >
          {feature.label}
        </Text>

        {/* Sub */}
        <Text
          style={[styles.cardSub, { color: isActive ? C.grayMid : C.gray }]}
          numberOfLines={2}
        >
          {feature.sub}
        </Text>

      </View>
    </Animated.View>
  );
}

// ─── FeatureWheel ─────────────────────────────────────────────────────────────

function FeatureWheel({ onScrollToggle }: { onScrollToggle: (enabled: boolean) => void }) {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const scrollY   = useRef(new Animated.Value(0)).current;

  const onWheelScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (e: any) => {
        const idx = Math.max(0, Math.min(N - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActive(idx);
        }
      },
    },
  );

  const syncActive = (y: number) => {
    const idx = Math.max(0, Math.min(N - 1, Math.round(y / ITEM_H)));
    activeRef.current = idx;
    setActive(idx);
  };

  return (
    <View style={styles.wheelSection}>

      {/* Scrollable cards */}
      <ScrollView
        scrollEventThrottle={16}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        style={{ width: CWIDTH, height: VIS_H }}
        contentContainerStyle={{ paddingVertical: PAD_V }}
        onScroll={onWheelScroll}
        onScrollBeginDrag={() => onScrollToggle(false)}
        onScrollEndDrag={(e)  => { onScrollToggle(true);  syncActive(e.nativeEvent.contentOffset.y); }}
        onMomentumScrollEnd={(e) => { onScrollToggle(true); syncActive(e.nativeEvent.contentOffset.y); }}
      >
        {FEATURES.map((f, i) => (
          <WheelItem key={i} feature={f} index={i} scrollY={scrollY} active={active} />
        ))}
      </ScrollView>

      {/* Position dots */}
      <View style={styles.dotsRow}>
        {FEATURES.map((_, i) => (
          <View key={i} style={[styles.pip, i === active ? styles.pipActive : styles.pipInactive]} />
        ))}
      </View>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const [scrollEnabled, setScrollEnabled] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.hdot, { width: 80, height: 80, top: -22, right: -22 }]} />
        <View style={[styles.hdot, { width: 38, height: 38, bottom: 10, left: 16 }]} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <View style={styles.logoArea}>
          <Text style={styles.appName}>iFluent</Text>
        </View>
      </Animated.View>

      {/* ── Page scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* Description card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            صاحبك وموجّهك بكل خطوة لِتـِقْلب إنجليزيتك مية بالمية!
          </Text>
          <Text style={styles.desc}>
            منصة تفاعلية صممنالكم إياها مخصوص عشان تكسر حاجز الخوف وتتحدّث بثقة وطلاقة.
            مش بس مناهج عملية، معك مستشارين تعليميين بتابعوا معك أول بأول خطوة بخطوة
            لتوصل لهدفك. مع iFluent.. فرعك بالنجاح ماله حدود!
          </Text>
        </View>

        {/* Features wheel */}
        <Text style={styles.sectionLabel}>مميزات المنصة</Text>
        <FeatureWheel onScrollToggle={setScrollEnabled} />

        {/* Vision card */}
        <Text style={styles.sectionLabel}>رؤية المنصة</Text>
        <View style={[styles.card, styles.visionCard]}>
          <View style={styles.visionTop}>
            <View style={styles.visionIcon}>
              <Ionicons name="telescope-outline" size={18} color={C.amber} />
            </View>
            <Text style={styles.visionTitle}>رؤيتنا</Text>
          </View>
          <Text style={styles.visionText}>
            أن نصبح المنصة الرائدة في تمكين الأفراد من إتقان اللغة الإنجليزية كأداة
            حية للتواصل والنجاح، متجاوزين أساليب التلقين التقليدية. نهدف إلى إعادة
            تعريف مفهوم التعليم الذكي والمستمر لفتح آفاق عالمية وفرص لا حدود لها
            لكل متعلم.
          </Text>
        </View>

        {/* Contact */}
        <Text style={styles.sectionLabel}>تواصل معنا</Text>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('mailto:ifluent0@gmail.com')}
          activeOpacity={0.75}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="mail" size={17} color={C.amber} />
          </View>
          <Text style={styles.contactLabel}>ifluent0@gmail.com</Text>
          <Ionicons name="open-outline" size={13} color={C.gray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('https://ifluent.app')}
          activeOpacity={0.75}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="globe" size={17} color={C.info} />
          </View>
          <Text style={styles.contactLabel}>www.ifluent.app</Text>
          <Ionicons name="open-outline" size={13} color={C.gray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('https://wa.me/962780105274')}
          activeOpacity={0.75}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
          </View>
          <Text style={styles.contactLabel}>0780105274</Text>
          <Ionicons name="open-outline" size={13} color={C.gray} />
        </TouchableOpacity>

        <Text style={styles.copyright}>© 2025 iFluent. جميع الحقوق محفوظة.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22, paddingBottom: 28,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    overflow: 'hidden',
    shadowColor: C.amber, shadowOpacity: 0.28,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  hdot:    { position: 'absolute', borderRadius: 999, backgroundColor: C.white, opacity: 0.18 },
  backBtn: {
    alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 10, padding: 7, marginBottom: 14,
  },
  logoArea: { alignItems: 'flex-end', marginBottom: 4 },
  appName:  { fontSize: 22, fontWeight: '900', color: C.navy },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: C.gray,
    textAlign: 'right', marginBottom: 12, marginTop: 20,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', ...shadow.sm,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '800', color: C.navy,
    textAlign: 'right', padding: 16, paddingBottom: 8,
  },
  desc: {
    fontSize: 14, color: C.grayMid, lineHeight: 22,
    textAlign: 'right', paddingHorizontal: 16, paddingBottom: 16,
  },

  // ── Vision card ───────────────────────────────────────────────────────────
  visionCard: { padding: 18 },
  visionTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 9, marginBottom: 12,
  },
  visionTitle: { fontSize: 14, fontWeight: '900', color: C.navy },
  visionIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center', alignItems: 'center',
  },
  visionText: {
    fontSize: 13, fontWeight: '500', color: C.grayDark,
    textAlign: 'right', lineHeight: 22,
  },

  // ── Wheel ─────────────────────────────────────────────────────────────────
  wheelSection: { alignItems: 'center', paddingVertical: 8 },

  // One slot — sized to match ITEM_H; Animated scale/opacity applied here
  itemSlot: {
    height:         ITEM_H,
    width:          CWIDTH,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // The card — wide rectangle, no border, background only on active
  featureCard: {
    width:          CWIDTH - 8,   // 4 px breathing room each side
    height:         ITEM_H - 10,
    borderRadius:   20,
    backgroundColor: 'transparent',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingHorizontal: 20,
  },

  // Active card — white bg + soft golden shadow (zero border)
  featureCardActive: {
    backgroundColor: C.white,
    shadowColor:     C.amber,
    shadowOpacity:   0.28,
    shadowRadius:    18,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       7,
  },

  // Icon circle inside card
  iconCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(200, 185, 140, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconCircleActive: { backgroundColor: '#FFF8E1' },

  // Card text
  cardLabel: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  cardSub:   { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 16 },

  // Dot indicators
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6, marginTop: 14,
  },
  pip:         { height: 6, borderRadius: 3 },
  pipActive:   { width: 20, backgroundColor: C.navy },
  pipInactive: { width: 6,  backgroundColor: '#D1D5DB' },

  // ── Contact rows ──────────────────────────────────────────────────────────
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    backgroundColor: C.white, borderRadius: 16,
    marginBottom: 8, ...shadow.sm,
  },
  contactIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: {
    flex: 1, fontSize: 14, fontWeight: '600', color: C.navy, textAlign: 'right',
  },

  copyright: { fontSize: 11, color: C.gray, textAlign: 'center', marginTop: 20 },
});

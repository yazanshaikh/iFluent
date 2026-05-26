/**
 * Progress screen — overall progress, level breakdown, achievements.
 * Design-complete with static data — API wiring pending lessons module.
 * Brand theme: Yellow header / Navy / Cream.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow } from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

// ─── Static mock data (replace with API later) ────────────────────────────────

const OVERALL_PCT = 0;

const buildStats = (earnedCount: number) => [
  { icon: 'timer-outline' as const, color: C.amber, label: 'وقت التعلم',    value: '0',                       unit: 'دقيقة' },
  { icon: 'book'          as const, color: C.info,  label: 'دروس مكتملة',   value: '0/0',                     unit: ''      },
  { icon: 'medal'         as const, color: C.amber, label: 'بطاقات مكتسبة', value: String(earnedCount),        unit: 'بطاقة' },
];

const LEVELS = [
  { code: 'A1', name: 'المستوى 1', pct: 0, unlocked: true,  lockMsg: '' },
  { code: 'A2', name: 'المستوى 2', pct: 0, unlocked: false, lockMsg: 'أكمل 80% من المستوى السابق لفتح هذا المستوى' },
  { code: 'B1', name: 'المستوى 3', pct: 0, unlocked: false, lockMsg: 'أكمل 80% من المستوى السابق لفتح هذا المستوى' },
  { code: 'B2', name: 'المستوى 4', pct: 0, unlocked: false, lockMsg: 'أكمل 80% من المستوى السابق لفتح هذا المستوى' },
  { code: 'FT', name: 'المستوى المتقدم', pct: 0, unlocked: false, lockMsg: 'أكمل 80% من المستوى السابق لفتح هذا المستوى' },
];

const LEVEL_BAR_COLORS: Record<string, string> = {
  A1: '#22C55E',   // أخضر  — مبتدئ
  A2: '#3B82F6',   // أزرق  — أساسي
  B1: '#8B5CF6',   // بنفسجي — متوسط
  B2: '#F59E0B',   // ذهبي  — فوق المتوسط
  FT: '#EF4444',   // أحمر  — متقدم
};

interface Achievement {
  id:        number;
  icon:      keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg:    string;
  title:     string;
  desc:      string;
  earned:    boolean;
  note?:     string;   // optional condition shown as a disclaimer
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1, earned: false,
    icon: 'school',    iconColor: C.amber,     iconBg: '#FEF3C7',
    title: 'أول درس',
    desc:  'أكملت أول درس! بداية رائعة في رحلتك التعليمية 🎉',
  },
  {
    id: 2, earned: false,
    icon: 'flame',     iconColor: '#EF4444',   iconBg: '#FEE2E2',
    title: 'أيام متتالية 3',
    desc:  'حافظ على التعلم 3 أيام متواصلة واستمر 🔥',
  },
  {
    id: 3, earned: false,
    icon: 'timer',     iconColor: C.info,      iconBg: '#DBEAFE',
    title: 'دقيقة تعلم 30',
    desc:  'قضيت 30 دقيقة في التعلم! بداية قوية ⏱️',
  },
  {
    id: 4, earned: false,
    icon: 'star',      iconColor: '#8B5CF6',   iconBg: '#EDE9FE',
    title: 'دروس مكتملة 10',
    desc:  'أنهيت 10 دروس! تقدم رائع 📚',
  },
  {
    id: 5, earned: false,
    icon: 'trophy',    iconColor: C.amber,     iconBg: '#FEF3C7',
    title: 'درس مكتمل 20',
    desc:  'أنهيت 20 درساً! أنت نجم التعلم 🏅',
  },
  {
    id: 6, earned: false,
    icon: 'hourglass', iconColor: C.info,      iconBg: '#DBEAFE',
    title: 'ساعة تعلم',
    desc:  'تعلمت ساعة كاملة! استمر في الإنجاز ⌛',
  },
  {
    id: 7, earned: false,
    icon: 'checkmark-circle', iconColor: C.success, iconBg: '#DCFCE7',
    title: '3 كويزات فل مارك',
    desc:  'حققت علامة كاملة في 3 كويزات متتالية! أنت متميز 💯',
  },
  {
    id: 9, earned: false,
    icon: 'layers',    iconColor: C.navyLight, iconBg: '#E0E7FF',
    title: 'فتح جميع المستويات',
    desc:  'تم فتح جميع المستويات! إنجاز مميز 🏆',
  },
  {
    id: 10, earned: false,
    icon: 'ribbon',    iconColor: C.success,   iconBg: '#DCFCE7',
    title: 'إكمال جميع الدروس',
    desc:  'أكملت جميع الدروس! أنت قدوة في المثابرة 🎓',
  },
  {
    id: 11, earned: false,
    icon: 'person-add', iconColor: C.info,     iconBg: '#DBEAFE',
    title: 'أول طالب أحضرته',
    desc:  'أحضرت طالباً وانضم لعائلة iFluent! حصل على ٣ دروس مجانا🤝',
    note:  'يُشترط تسجيل الطالب عبر مستشارك أو مشرفك التعليمي',
  },
  {
    id: 12, earned: false,
    icon: 'people',    iconColor: '#7C3AED',   iconBg: '#EDE9FE',
    title: '3 طلاب أحضرتهم',
    desc:  'أحضرت 3 طلاب! أنت سفير iFluent الحقيقي احصل على ٣ دروس لكل طالب اشترك + هدايا قيمة🌟',
    note:  'يُشترط تسجيل الطلاب عبر مستشارك أو مشرفك التعليمي',
  },
  {
    id: 13, earned: false,
    icon: 'people-circle', iconColor: C.amber, iconBg: '#FEF3C7',
    title: '5 طلاب أحضرتهم',
    desc:  ' أنت نجم المجتمع التعليمي احصل على ٣ دروس لكل طالب + مبالغ مادية🏆',
    note:  'يُشترط تسجيل الطلاب عبر مستشارك أو مشرفك التعليمي',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatItem {
  icon:  keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
  unit:  string;
}

function StatCard({ icon, color, label, value, unit }: StatItem) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={sc.value}>{value}</Text>
      {unit ? <Text style={sc.unit}>{unit}</Text> : null}
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: C.white, borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 3,
    ...shadow.sm,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  value: { fontSize: 18, fontWeight: '900', color: C.navy },
  unit:  { fontSize: 10, fontWeight: '600', color: C.gray, marginTop: -2 },
  label: { fontSize: 10, fontWeight: '700', color: C.grayMid, textAlign: 'center' },
});

function LevelCard({ code, name, pct, unlocked, lockMsg }: typeof LEVELS[0]) {
  const barColor = LEVEL_BAR_COLORS[code] ?? C.info;
  return (
    <View style={[lc.card, !unlocked && lc.cardLocked]}>
      {/* ── Top row: [code badge] [name] [pct / lock] ── */}
      <View style={lc.top}>
        {/* Colored code badge */}
        <View style={[lc.codeBadge, { backgroundColor: barColor }]}>
          <Text style={lc.codeTxt}>{code}</Text>
        </View>
        {/* Level name */}
        <Text style={[lc.name, !unlocked && lc.nameMuted]} numberOfLines={1}>
          {name}
        </Text>
        {/* Percentage or lock icon */}
        {unlocked ? (
          <Text style={[lc.pct, { color: barColor }]}>{pct}%</Text>
        ) : (
          <View style={lc.lockWrap}>
            <Ionicons name="lock-closed" size={13} color={C.gray} />
          </View>
        )}
      </View>
      {/* ── Progress bar ── */}
      <View style={lc.track}>
        <View style={[lc.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
      {!unlocked && lockMsg ? (
        <Text style={lc.lockMsg}>{lockMsg}</Text>
      ) : null}
    </View>
  );
}

const lc = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 16,
    padding: 16, marginBottom: 10,
    ...shadow.sm,
  },
  cardLocked: { opacity: 0.65 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  codeBadge: {
    width: 44, height: 44, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  codeTxt:  { fontSize: 12, fontWeight: '900', color: C.white },
  name:     { flex: 1, fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'right' },
  nameMuted:{ color: C.gray },
  pct:      { fontSize: 18, fontWeight: '900', flexShrink: 0 },
  lockWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  track: {
    height: 8, backgroundColor: '#EBEBEB',
    borderRadius: 4, overflow: 'hidden',
  },
  fill:  { height: 8, borderRadius: 4 },
  lockMsg: {
    fontSize: 11, color: C.gray, textAlign: 'right',
    marginTop: 8, fontWeight: '500',
  },
});

function AchievementCard({ item }: { item: Achievement }) {
  return (
    <View style={[ac.card, item.earned && ac.cardEarned]}>
      <View style={[ac.iconWrap, { backgroundColor: item.earned ? item.iconBg : '#F3F4F6' }]}>
        <Ionicons
          name={item.icon}
          size={22}
          color={item.earned ? item.iconColor : C.gray}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ac.title, !item.earned && ac.muted]}>{item.title}</Text>
        <Text style={[ac.desc,  !item.earned && ac.muted]} numberOfLines={2}>{item.desc}</Text>
        {item.note && (
          <View style={ac.noteRow}>
            <Ionicons name="information-circle" size={11} color={C.info} />
            <Text style={ac.note}>{item.note}</Text>
          </View>
        )}
      </View>
      <View style={[ac.badge, item.earned ? ac.badgeEarned : ac.badgeLocked]}>
        <Ionicons
          name={item.earned ? 'checkmark' : 'lock-closed'}
          size={13}
          color={item.earned ? C.white : C.gray}
        />
      </View>
    </View>
  );
}

const ac = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
    ...shadow.sm,
  },
  cardEarned: {
    borderColor: C.amber,
    backgroundColor: '#FFFBEB',
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 14, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 3,
  },
  desc: {
    fontSize: 12, color: C.grayMid,
    textAlign: 'right', lineHeight: 17,
  },
  muted: { color: C.gray },
  noteRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, marginTop: 5,
  },
  note: {
    flex: 1, fontSize: 10, color: C.info,
    textAlign: 'right', lineHeight: 14, fontWeight: '600',
  },
  badge: {
    width: 28, height: 28, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  badgeEarned: { backgroundColor: C.success },
  badgeLocked: { backgroundColor: '#E5E7EB' },
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [achievOpen, setAchievOpen] = useState(true);
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned).length;
  const STATS = buildStats(earnedCount);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 80, height: 80, top: -22, right: -22 }]} />
        <View style={[styles.dot, { width: 40, height: 40, bottom: 10, left: 14 }]} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Ionicons name="trending-up" size={22} color={C.navy} />
          <Text style={styles.headerTitle}>التقدم</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Overall progress card ─────────────────────────────────────── */}
        <View style={styles.overallCard}>
          {/* Trophy watermark — barely visible */}
          <Ionicons name="trophy" size={110} color={C.amber} style={styles.overallTrophyBg} />
          <View style={styles.overallTop}>
            <Text style={styles.overallPct}>{OVERALL_PCT}%</Text>
            <Text style={styles.overallLbl}>التقدم الكلي</Text>
          </View>
          <View style={styles.overallTrack}>
            <View style={[styles.overallFill, { width: `${OVERALL_PCT}%` as any }]} />
          </View>
        </View>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* ── Level progress ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>تقدم المستويات</Text>
        {LEVELS.map((lv) => (
          <LevelCard key={lv.code} {...lv} />
        ))}

        {/* ── Achievements ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setAchievOpen((v) => !v)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={achievOpen ? 'chevron-up' : 'chevron-down'}
            size={16} color={C.navy}
          />
          <Text style={styles.sectionLabel2}>
            بطاقات الإنجازات
            <Text style={styles.sectionCount}> · {earnedCount}/{ACHIEVEMENTS.length}</Text>
          </Text>
        </TouchableOpacity>

        {achievOpen && (
          <View>
            {ACHIEVEMENTS.map((item) => (
              <AchievementCard key={item.id} item={item} />
            ))}
          </View>
        )}

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
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: C.amber, shadowOpacity: 0.28,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  dot: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: C.white, opacity: 0.18,
  },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 10, padding: 7, marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.navy },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 24 },

  // ── Overall card ──────────────────────────────────────────────────────────
  overallCard: {
    backgroundColor: '#FFFBEB', borderRadius: 20,
    padding: 20, marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#FDE68A',
    ...shadow.sm,
  },
  overallTrophyBg: {
    position: 'absolute',
    right: -14, bottom: -18,
    opacity: 0.10,
  },
  overallTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 14,
  },
  overallPct: { fontSize: 38, fontWeight: '900', color: C.navy, lineHeight: 40 },
  overallLbl: { fontSize: 14, fontWeight: '800', color: C.navyMid },
  overallTrack: {
    height: 10, backgroundColor: 'rgba(26,41,128,0.10)',
    borderRadius: 5, overflow: 'hidden',
  },
  overallFill: { height: 10, backgroundColor: C.amber, borderRadius: 5 },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  // ── Section labels ────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 8,
    marginBottom: 10, marginTop: 8,
  },
  sectionLabel2: {
    fontSize: 13, fontWeight: '800', color: C.navy,
  },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: C.gray,
  },
});

/**
 * Progress screen — overall progress, level breakdown, achievements.
 * Design-complete with static data — API wiring pending lessons module.
 * Brand theme: Yellow header / Navy / Cream.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profile';
import { C, shadow } from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

// ─── Achievement catalog — `earned` comes from the API by id ──────────────────
interface Achievement {
  id:        number;
  icon:      keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg:    string;
  title:     string;
  desc:      string;
}

const CATALOG: Achievement[] = [
  { id: 1,  icon: 'school',           iconColor: C.amber,     iconBg: '#FEF3C7', title: 'أول درس',        desc: 'أكملت أول درس! بداية رائعة في رحلتك التعليمية 🎉' },
  { id: 2,  icon: 'book',             iconColor: C.info,      iconBg: '#DBEAFE', title: '5 دروس',         desc: 'أنهيت 5 دروس! انطلاقة قوية 📖' },
  { id: 3,  icon: 'star',             iconColor: '#8B5CF6',   iconBg: '#EDE9FE', title: '10 دروس',        desc: 'أنهيت 10 دروس! تقدم رائع 📚' },
  { id: 4,  icon: 'trophy',           iconColor: C.amber,     iconBg: '#FEF3C7', title: '20 درساً',       desc: 'أنهيت 20 درساً! أنت نجم التعلم 🏅' },
  { id: 5,  icon: 'pie-chart',        iconColor: '#10B981',   iconBg: '#DCFCE7', title: 'نصف البرنامج',   desc: 'وصلت لمنتصف برنامجك! الطريق واضح 🚀' },
  { id: 6,  icon: 'medal',            iconColor: C.amber,     iconBg: '#FEF3C7', title: '50 درساً',       desc: 'أنهيت 50 درساً! إنجاز كبير 🥇' },
  { id: 7,  icon: 'flame',            iconColor: '#EF4444',   iconBg: '#FEE2E2', title: '100 درس',        desc: 'أنهيت 100 درس! أنت أسطورة 🔥' },
  { id: 8,  icon: 'ribbon',           iconColor: C.success,   iconBg: '#DCFCE7', title: 'إكمال البرنامج', desc: 'أكملت برنامجك كاملاً! أنت قدوة 🎓' },
  { id: 9,  icon: 'timer',            iconColor: C.info,      iconBg: '#DBEAFE', title: '30 دقيقة تعلم',  desc: 'قضيت 30 دقيقة في التعلم! بداية قوية ⏱️' },
  { id: 10, icon: 'hourglass',        iconColor: C.info,      iconBg: '#DBEAFE', title: 'ساعة تعلم',      desc: 'تعلمت ساعة كاملة! استمر في الإنجاز ⌛' },
  { id: 11, icon: 'alarm',            iconColor: '#7C3AED',   iconBg: '#EDE9FE', title: '5 ساعات تعلم',   desc: 'تعلمت 5 ساعات! مثابرة حقيقية 💪' },
  { id: 12, icon: 'checkmark-circle', iconColor: C.success,   iconBg: '#DCFCE7', title: '3 كويزات فل مارك', desc: 'حققت علامة كاملة في 3 كويزات! أنت متميز 💯' },
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

function AchievementCard({ item, earned }: { item: Achievement; earned: boolean }) {
  return (
    <View style={[ac.card, earned && ac.cardEarned]}>
      <View style={[ac.iconWrap, { backgroundColor: earned ? item.iconBg : '#F3F4F6' }]}>
        <Ionicons
          name={item.icon}
          size={22}
          color={earned ? item.iconColor : C.gray}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ac.title, !earned && ac.muted]}>{item.title}</Text>
        <Text style={[ac.desc,  !earned && ac.muted]} numberOfLines={2}>{item.desc}</Text>
      </View>
      <View style={[ac.badge, earned ? ac.badgeEarned : ac.badgeLocked]}>
        <Ionicons
          name={earned ? 'checkmark' : 'lock-closed'}
          size={13}
          color={earned ? C.white : C.gray}
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

function fmtLearning(mins: number): { value: string; unit: string } {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return { value: m > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${h}`, unit: m > 0 ? 'ساعة' : 'ساعة' };
  }
  return { value: String(Math.round(mins)), unit: 'دقيقة' };
}

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [achievOpen, setAchievOpen] = useState(true);
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const { data, isLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn:  () => profileApi.progress(),
    staleTime: 30_000,
  });

  // Map of achievement id → earned flag from the API
  const earnedMap = new Map((data?.achievements ?? []).map((a) => [a.id, a.earned]));
  const earnedCount = data?.earned_badges ?? 0;

  const OVERALL_PCT = data?.overall_pct ?? 0;
  const learning    = fmtLearning(data?.learning_minutes ?? 0);

  const STATS = [
    { icon: 'timer-outline' as const, color: C.amber, label: 'وقت التعلم',
      value: learning.value, unit: learning.unit },
    { icon: 'book' as const, color: C.info, label: 'دروس مكتملة',
      value: `${data?.completed_lessons ?? 0}/${data?.total_lessons ?? 0}`, unit: '' },
    { icon: 'medal' as const, color: C.amber, label: 'بطاقات مكتسبة',
      value: String(earnedCount), unit: 'بطاقة' },
  ];

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.amber} />
      </View>
    );
  }

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
            <Text style={styles.sectionCount}> · {earnedCount}/{CATALOG.length}</Text>
          </Text>
        </TouchableOpacity>

        {achievOpen && (
          <View>
            {CATALOG.map((item) => (
              <AchievementCard key={item.id} item={item} earned={earnedMap.get(item.id) ?? false} />
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

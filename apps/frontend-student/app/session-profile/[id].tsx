/**
 * Session Profile — بروفايل الحصة
 *
 * Layout:
 *  ┌─────────────────────────────┐
 *  │  LinearGradient hero        │  ← lesson title + meta
 *  ├─────────────────────────────┤
 *  │  Card: نشاط ما قبل الحصة   │
 *  │  Card: الحصة الحية          │
 *  │  Card: الكويز               │
 *  └─────────────────────────────┘
 *  FAB ↘ PDF download
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { sessionsApi, type SessionProfile } from '@/api/sessions';
import { fixStorageUrl } from '@/api/client';
import { C, shadow } from '@/theme';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const G_TOP    = '#6D28D9';   // deep purple
const G_BOTTOM = '#1A2980';   // navy
const PURPLE   = '#7C3AED';
const ACCENT   = '#A78BFA';   // light purple for text on gradient
const CARD_BG  = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

const STATUS_META: Record<string, { label: string; color: string; emoji: string }> = {
  waiting:   { label: 'قريباً',       color: '#F59E0B', emoji: '⏳' },
  active:    { label: 'نشطة الآن',   color: '#22C55E', emoji: '🟢' },
  completed: { label: 'مكتملة',       color: '#6B7280', emoji: '✅' },
  cancelled: { label: 'ملغاة',        color: '#EF4444', emoji: '❌' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill badge shown on the gradient hero */
function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: '#fff', emoji: '' };
  return (
    <View style={[pillStyles.wrap, { borderColor: meta.color + '88' }]}>
      <Text style={pillStyles.emoji}>{meta.emoji}</Text>
      <Text style={[pillStyles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}
const pillStyles = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.12)' },
  emoji: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700' },
});

/** White frosted section card */
function Card({
  icon, title, locked, lockedMsg, accent, children,
}: {
  icon: string; title: string; accent?: string;
  locked?: boolean; lockedMsg?: string;
  children?: React.ReactNode;
}) {
  const iconColor = locked ? C.gray : (accent ?? PURPLE);
  return (
    <View style={[cardStyles.wrap, locked && { opacity: 0.58 }]}>
      {/* left accent bar */}
      {!locked && <View style={[cardStyles.bar, { backgroundColor: accent ?? PURPLE }]} />}
      <View style={cardStyles.inner}>
        <View style={cardStyles.header}>
          <View style={[cardStyles.iconWrap, locked && { shadowOpacity: 0 }]}>
            <Ionicons
              name={icon as any}
              size={22}
              color={locked ? C.gray : (accent ?? PURPLE)}
            />
          </View>
          <Text style={[cardStyles.title, locked && { color: C.gray }]}>{title}</Text>
          {locked && (
            <View style={cardStyles.lockBubble}>
              <Ionicons name="lock-closed" size={11} color={C.gray} />
            </View>
          )}
        </View>
        {locked
          ? <Text style={cardStyles.lockedMsg}>{lockedMsg}</Text>
          : children}
      </View>
    </View>
  );
}
const cardStyles = StyleSheet.create({
  wrap:       { backgroundColor: CARD_BG, borderRadius: 20, flexDirection: 'row', overflow: 'hidden', ...shadow.sm },
  bar:        { width: 4 },
  inner:      { flex: 1, padding: 18 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap:   { justifyContent: 'center', alignItems: 'center', shadowColor: PURPLE, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  title:      { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },
  lockBubble: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  lockedMsg:  { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 20 },
});

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SessionProfileScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);

  const { data, isLoading, isError, refetch } = useQuery<SessionProfile>({
    queryKey:  ['session-profile', sessionId],
    queryFn:   () => sessionsApi.getProfile(sessionId),
    staleTime: 30_000,
  });

  // Loading
  if (isLoading) {
    return (
      <LinearGradient colors={[G_TOP, G_BOTTOM]} style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  // Error
  if (isError || !data) {
    return (
      <LinearGradient colors={[G_TOP, G_BOTTOM]} style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={52} color="#fff" />
        <Text style={styles.errTxt}>تعذّر تحميل بيانات الحصة</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const lesson      = data.lesson;
  const isActive    = data.status === 'active';
  const isWaiting   = data.status === 'waiting';
  const isCompleted = data.status === 'completed';

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F0FF' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ════════════════════════════════════════════════════════
            GRADIENT HERO
        ════════════════════════════════════════════════════════ */}
        <LinearGradient
          colors={[G_TOP, G_BOTTOM]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          {/* ── Row: back + status ── */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <StatusPill status={data.status} />
          </View>

          {/* ── Label: حصة اليوم — centered, light-blue glow ── */}
          <View style={styles.subWrap}>
            <Text style={styles.heroSub}>حصة اليوم رح تكون عن</Text>
          </View>

          {/* ── Lesson title ── */}
          <Text style={styles.heroTitle} numberOfLines={3}>
            {lesson.title ?? ''}
          </Text>

          {/* Unit · Level */}
          {lesson.unit && (
            <Text style={styles.heroMeta}>
              {lesson.unit.name}
              {lesson.level ? `  ·  ${lesson.level.name}` : ''}
            </Text>
          )}

          {/* Teacher only */}
          {data.teacher?.name && (
            <View style={styles.metaStrip}>
              <View style={styles.metaItem}>
                <Ionicons name="person-circle-outline" size={14} color={ACCENT} />
                <Text style={styles.metaItemTxt}>{data.teacher.name}</Text>
              </View>
            </View>
          )}

          {/* Decorative circles — pointerEvents none so they don't block touches */}
          <View style={styles.deco1} pointerEvents="none" />
          <View style={styles.deco2} pointerEvents="none" />
        </LinearGradient>

        {/* ════════════════════════════════════════════════════════
            CARDS
        ════════════════════════════════════════════════════════ */}
        <View style={styles.cards}>

          {/* نشاط ما قبل الحصة */}
          <Card
            icon="clipboard-outline"
            title="نشاط ما قبل الحصة"
            locked
            lockedMsg="هذه الميزة ستكون متاحة قريباً 🚀"
          />

          {/* الحصة الحية */}
          <Card icon="videocam-outline" title="الحصة الحية" accent="#22C55E">
            {isActive ? (
              <TouchableOpacity
                style={styles.joinBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/session/[id]', params: { id: String(data.id) } })}
              >
                <Ionicons name="videocam" size={18} color="#fff" />
                <Text style={styles.joinTxt}>دخول الفصل الآن 🎉</Text>
              </TouchableOpacity>
            ) : isWaiting ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>⏳</Text>
                <Text style={[styles.stateTitle, { color: '#F59E0B' }]}>الحصة لم تبدأ بعد</Text>
                <Text style={styles.stateSub}>ستُفعَّل تلقائياً عند بدء المعلم</Text>
              </View>
            ) : isCompleted ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>🎓</Text>
                <Text style={[styles.stateTitle, { color: '#22C55E' }]}>أحسنت! الحصة مكتملة</Text>
              </View>
            ) : (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>😔</Text>
                <Text style={[styles.stateTitle, { color: C.error }]}>تم إلغاء الحصة</Text>
              </View>
            )}
          </Card>

          {/* الكويز */}
          <Card
            icon="help-circle-outline"
            title="كويز ما بعد الدرس"
            accent={PURPLE}
            locked={!data.quiz_unlocked}
            lockedMsg={
              isCompleted
                ? 'الكويز سيُفتح بعد ١٠ دقائق من انتهاء الحصة ⏱️'
                : 'الكويز يُفتح فقط بعد إتمام الحصة 🔐'
            }
          >
            <TouchableOpacity
              style={styles.quizBtn}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: String(lesson.id) } })}
            >
              <Ionicons name="help-circle" size={18} color="#fff" />
              <Text style={styles.quizTxt}>ابدأ الكويز 🚀</Text>
            </TouchableOpacity>
          </Card>

          {/* ── PDF — تحت الكويز، على اليمين ── */}
          {fixStorageUrl(lesson.pdf_url) && (
            <View style={styles.pdfRow}>
              <TouchableOpacity
                style={styles.pdfBtn}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(fixStorageUrl(lesson.pdf_url)!)}
              >
                <Ionicons name="document-text" size={18} color={PURPLE} />
                <Text style={styles.pdfBtnTxt}>تحميل مادة الدرس</Text>
                <Ionicons name="download-outline" size={15} color={PURPLE} />
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  errTxt:   { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  retryBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  subWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(147, 210, 255, 0.15)',
    borderRadius: 22,
    paddingHorizontal: 20, paddingVertical: 9,
    marginBottom: 14,
    // glow — iOS
    shadowColor: '#93D2FF',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    // glow — Android
    elevation: 12,
  },
  heroSub: {
    fontSize: 18,
    color: '#E0F4FF',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
    fontFamily: Platform.select({ ios: 'Al Nile', android: 'serif' }),
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'right', lineHeight: 28, marginBottom: 6 },
  heroMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'right', marginBottom: 14 },

  metaStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'flex-end' },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItemTxt: { fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: '500' },

  // decorative blurred circles
  deco1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40, left: -50,
  },
  deco2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 10, left: 30,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  cards: { padding: 16, gap: 14, marginTop: -16 },

  // ── Buttons ───────────────────────────────────────────────────────────────
  joinBtn:  { backgroundColor: '#22C55E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  joinTxt:  { color: '#fff', fontSize: 15, fontWeight: '800' },

  stateBox:  { alignItems: 'center', paddingVertical: 8, gap: 6 },
  stateEmoji:{ fontSize: 34 },
  stateTitle:{ fontSize: 15, fontWeight: '700' },
  stateSub:  { fontSize: 12, color: C.grayMid, textAlign: 'center' },

  quizBtn: { backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  quizTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // ── PDF ───────────────────────────────────────────────────────────────────
  pdfRow: { alignItems: 'flex-end' },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDE9FF',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: '#C4B5FD',
  },
  pdfBtnTxt: { fontSize: 13, fontWeight: '700', color: PURPLE },
});

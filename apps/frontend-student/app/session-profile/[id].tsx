/**
 * Session Profile — بروفايل الحصة
 * Template: purple background · fun lesson title · PDF chip top-right
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sessionsApi, type SessionProfile } from '@/api/sessions';
import { C, shadow } from '@/theme';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#F0EBFF';   // light purple background
const PURPLE  = '#7C3AED';   // accent purple
const CARD_BG = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

const STATUS_LABEL: Record<string, string> = {
  waiting:   '⏳ قريباً',
  active:    '🟢 نشطة الآن',
  completed: '✅ مكتملة',
  cancelled: '❌ ملغاة',
};
const STATUS_COLOR: Record<string, string> = {
  waiting:   C.warning,
  active:    C.success,
  completed: C.gray,
  cancelled: C.error,
};

// ─── Section card ─────────────────────────────────────────────────────────────

function Card({
  icon, title, locked, lockedMsg, children,
}: {
  icon: string; title: string;
  locked?: boolean; lockedMsg?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.cardRow}>
        <Ionicons name={icon as any} size={19} color={locked ? C.gray : PURPLE} style={{ marginRight: 8 }} />
        <Text style={[styles.cardTitle, locked && { color: C.gray }]}>{title}</Text>
        {locked && (
          <View style={styles.lockChip}>
            <Ionicons name="lock-closed" size={11} color={C.gray} />
          </View>
        )}
      </View>
      {locked
        ? <Text style={styles.lockedMsg}>{lockedMsg}</Text>
        : children}
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionProfileScreen() {
  const router    = useRouter();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);

  const { data, isLoading, isError, refetch } = useQuery<SessionProfile>({
    queryKey: ['session-profile', sessionId],
    queryFn:  () => sessionsApi.getProfile(sessionId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: BG }]}>
        <Stack.Screen options={{ title: 'تفاصيل الحصة', headerBackTitle: 'حصصي' }} />
        <ActivityIndicator size="large" color={PURPLE} />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: BG }]}>
        <Stack.Screen options={{ title: 'تفاصيل الحصة', headerBackTitle: 'حصصي' }} />
        <Ionicons name="alert-circle-outline" size={48} color={C.error} />
        <Text style={styles.errTxt}>تعذّر تحميل بيانات الحصة</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const lesson      = data.lesson;
  const isActive    = data.status === 'active';
  const isWaiting   = data.status === 'waiting';
  const isCompleted = data.status === 'completed';
  const statusColor = STATUS_COLOR[data.status] ?? C.gray;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'حصصي',
          headerStyle:      { backgroundColor: PURPLE },
          headerTintColor:  '#fff',
          headerTransparent: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════════════════════════════════
            HERO — lesson title + PDF chip
        ══════════════════════════════════════════════════════════════ */}
        <View style={styles.hero}>

          {/* Status badge — top right */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusTxt, { color: statusColor }]}>
              {STATUS_LABEL[data.status] ?? data.status}
            </Text>
          </View>

          {/* Fun title */}
          <Text style={styles.heroSub}>حصة اليوم رح تكون عن ✨</Text>
          <Text style={styles.heroTitle}>{lesson.title ?? 'حصة فردية'}</Text>

          {/* Unit / Level */}
          {lesson.unit && (
            <Text style={styles.heroMeta}>
              {lesson.unit.name}
              {lesson.level ? `  ·  ${lesson.level.name}` : ''}
            </Text>
          )}

          {/* Divider */}
          <View style={styles.heroDivider} />

          {/* Date + Teacher */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={PURPLE} />
            <Text style={styles.infoTxt}>{fmtDate(data.scheduled_at)}</Text>
          </View>
          {data.teacher?.name && (
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={14} color={PURPLE} />
              <Text style={styles.infoTxt}>مع {data.teacher.name}</Text>
            </View>
          )}

          {/* PDF chip — bottom of hero */}
          {lesson.pdf_url ? (
            <TouchableOpacity
              style={styles.pdfChip}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(lesson.pdf_url!)}
            >
              <Ionicons name="document-text" size={15} color={PURPLE} />
              <Text style={styles.pdfChipTxt}>مادة الدرس PDF</Text>
              <Ionicons name="open-outline" size={13} color={PURPLE} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.pdfChip, { opacity: 0.4 }]}>
              <Ionicons name="document-text-outline" size={15} color={C.gray} />
              <Text style={[styles.pdfChipTxt, { color: C.gray }]}>لا يوجد PDF بعد</Text>
            </View>
          )}
        </View>

        {/* ──────────────────────────────────────────────────────────────
            نشاط ما قبل الحصة
        ────────────────────────────────────────────────────────────── */}
        <Card
          icon="clipboard-outline"
          title="نشاط ما قبل الحصة"
          locked
          lockedMsg="هذه الميزة ستكون متاحة قريباً 🚀"
        />

        {/* ──────────────────────────────────────────────────────────────
            الحصة الحية
        ────────────────────────────────────────────────────────────── */}
        <Card icon="videocam-outline" title="الحصة الحية">
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
              <Text style={[styles.stateTitle, { color: C.warning }]}>الحصة لم تبدأ بعد</Text>
              <Text style={styles.stateSub}>ستُفعَّل تلقائياً عند بدء المعلم</Text>
            </View>
          ) : isCompleted ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateEmoji}>🎓</Text>
              <Text style={[styles.stateTitle, { color: C.success }]}>الحصة مكتملة</Text>
            </View>
          ) : (
            <View style={styles.stateBox}>
              <Text style={styles.stateEmoji}>😔</Text>
              <Text style={[styles.stateTitle, { color: C.error }]}>تم إلغاء الحصة</Text>
            </View>
          )}
        </Card>

        {/* ──────────────────────────────────────────────────────────────
            كويز
        ────────────────────────────────────────────────────────────── */}
        <Card
          icon="help-circle-outline"
          title="كويز ما بعد الدرس"
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

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:   { padding: 16, paddingBottom: 48, gap: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errTxt:   { fontSize: 16, color: C.grayDark, fontWeight: '600', textAlign: 'center' },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: PURPLE, borderRadius: 12 },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 20,
    ...shadow.sm,
  },
  pdfChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FF',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginTop: 14,
    borderWidth: 1, borderColor: '#D8D0FF',
  },
  pdfChipTxt: { fontSize: 13, fontWeight: '700', color: PURPLE },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 16,
    position: 'absolute', top: 20, right: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 12, fontWeight: '700' },

  heroSub:   { fontSize: 13, color: PURPLE, fontWeight: '600', textAlign: 'right', marginBottom: 4 },
  heroTitle: {
    fontSize: 24, fontWeight: '900', color: C.navy,
    textAlign: 'right', lineHeight: 34, marginBottom: 6,
  },
  heroMeta:    { fontSize: 13, color: C.grayMid, textAlign: 'right', marginBottom: 4 },
  heroDivider: { height: 1, backgroundColor: '#F3EFFF', marginVertical: 14 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoTxt:     { fontSize: 13, color: C.grayMid, flex: 1, textAlign: 'right' },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card:      { backgroundColor: CARD_BG, borderRadius: 18, padding: 18, ...shadow.sm },
  cardLocked: { opacity: 0.6 },
  cardRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },
  lockChip:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  lockedMsg: { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 20 },

  // ── Session states ────────────────────────────────────────────────────────
  joinBtn:  { backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  joinTxt:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  stateBox: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  stateEmoji: { fontSize: 32 },
  stateTitle: { fontSize: 15, fontWeight: '700' },
  stateSub:   { fontSize: 12, color: C.grayMid, textAlign: 'center' },

  // ── Quiz ──────────────────────────────────────────────────────────────────
  quizBtn: { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  quizTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

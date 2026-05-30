/**
 * Session Profile Screen — بروفايل الحصة
 *
 * Sections (top to bottom):
 *  1. Header: lesson title, unit, level, teacher, scheduled time
 *  2. Pre-session activity (disabled — coming soon)
 *  3. Session button: enter live room if active, else greyed out
 *  4. Post-lesson quiz: locked until completed + 10 min both joined
 *  5. PDF material: opens in external browser via Linking
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
import { C, shadow, LEVEL_COLORS } from '@/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'long',
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

const STATUS_LABEL: Record<string, string> = {
  waiting:   'قريباً',
  active:    'نشطة الآن',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const STATUS_COLOR: Record<string, string> = {
  waiting:   C.warning,
  active:    C.success,
  completed: C.gray,
  cancelled: C.error,
};

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon, title, locked, lockedMsg, children,
}: {
  icon: string;
  title: string;
  locked?: boolean;
  lockedMsg?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.cardHeader}>
        <Ionicons
          name={icon as any}
          size={20}
          color={locked ? C.gray : C.navy}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.cardTitle, locked && styles.cardTitleLocked]}>{title}</Text>
        {locked && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={C.gray} />
          </View>
        )}
      </View>
      {locked ? (
        <Text style={styles.lockedMsg}>{lockedMsg}</Text>
      ) : (
        children
      )}
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

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: 'بروفايل الحصة', headerBackTitle: 'حصصي' }} />
        <ActivityIndicator size="large" color={C.navy} />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: 'بروفايل الحصة', headerBackTitle: 'حصصي' }} />
        <Ionicons name="alert-circle-outline" size={48} color={C.error} />
        <Text style={styles.errorText}>تعذّر تحميل بيانات الحصة</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const lesson      = data.lesson;
  const levelColor  = LEVEL_COLORS[lesson.level?.code ?? ''] ?? C.navyLight;
  const isActive    = data.status === 'active';
  const isWaiting   = data.status === 'waiting';
  const isCompleted = data.status === 'completed';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'بروفايل الحصة',
          headerBackTitle: 'حصصي',
          headerStyle: { backgroundColor: C.navy },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── 1. Header ────────────────────────────────────────────────────── */}
        <View style={[styles.heroCard, { borderTopColor: levelColor }]}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[data.status] + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[data.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLOR[data.status] }]}>
              {STATUS_LABEL[data.status] ?? data.status}
            </Text>
          </View>

          <Text style={styles.lessonTitle}>{lesson.title ?? 'حصة'}</Text>

          {lesson.unit && (
            <Text style={styles.unitText}>
              {lesson.unit.name}{lesson.level ? `  ·  ${lesson.level.name}` : ''}
            </Text>
          )}

          <View style={styles.heroDivider} />

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={C.grayMid} />
            <Text style={styles.metaText}>{fmt(data.scheduled_at)}</Text>
          </View>

          {data.teacher?.name && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={15} color={C.grayMid} />
              <Text style={styles.metaText}>مع {data.teacher.name}</Text>
            </View>
          )}
        </View>

        {/* ─── 2. Pre-session (coming soon) ────────────────────────────────── */}
        <SectionCard
          icon="clipboard-outline"
          title="نشاط ما قبل الحصة"
          locked
          lockedMsg="هذه الميزة ستكون متاحة قريباً"
        />

        {/* ─── 3. الحصة الحية ──────────────────────────────────────────────── */}
        <SectionCard icon="videocam-outline" title="الحصة الحية">
          {isActive ? (
            <TouchableOpacity
              style={styles.joinBtn}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: String(data.id) } })}
            >
              <Ionicons name="videocam" size={18} color="#fff" />
              <Text style={styles.joinBtnTxt}>دخول الفصل الآن</Text>
            </TouchableOpacity>
          ) : isWaiting ? (
            <View style={styles.sessionState}>
              <Ionicons name="time-outline" size={32} color={C.warning} />
              <Text style={[styles.sessionStateTitle, { color: C.warning }]}>الحصة لم تبدأ بعد</Text>
              <Text style={styles.sessionStateSub}>ستُفعَّل تلقائياً عند بدء المعلم للحصة</Text>
            </View>
          ) : isCompleted ? (
            <View style={styles.sessionState}>
              <Ionicons name="checkmark-circle" size={32} color={C.success} />
              <Text style={[styles.sessionStateTitle, { color: C.success }]}>الحصة مكتملة</Text>
            </View>
          ) : (
            <View style={styles.sessionState}>
              <Ionicons name="close-circle-outline" size={32} color={C.error} />
              <Text style={[styles.sessionStateTitle, { color: C.error }]}>تم إلغاء الحصة</Text>
            </View>
          )}
        </SectionCard>

        {/* ─── 4. كويز ─────────────────────────────────────────────────────── */}
        <SectionCard
          icon="help-circle-outline"
          title="كويز ما بعد الدرس"
          locked={!data.quiz_unlocked}
          lockedMsg={isCompleted
            ? 'الكويز سيُفتح بعد ١٠ دقائق من انتهاء الحصة'
            : 'الكويز يُفتح فقط بعد إتمام الحصة'}
        >
          <TouchableOpacity
            style={styles.quizBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: String(lesson.id) } })}
          >
            <Ionicons name="help-circle" size={18} color="#fff" />
            <Text style={styles.quizBtnTxt}>ابدأ الكويز</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ─── 5. PDF ───────────────────────────────────────────────────────── */}
        <SectionCard icon="document-text-outline" title="مادة الدرس (PDF)">
          {lesson.pdf_url ? (
            <View style={styles.pdfBox}>
              <View style={styles.pdfIcon}>
                <Ionicons name="document-text" size={36} color={C.navy} />
              </View>
              <Text style={styles.pdfTitle} numberOfLines={2}>{lesson.title}</Text>
              <Text style={styles.pdfSub}>اضغط لفتح الملف في المتصفح</Text>

              <TouchableOpacity
                style={styles.pdfOpenBtn}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(lesson.pdf_url!)}
              >
                <Ionicons name="open-outline" size={17} color="#fff" />
                <Text style={styles.pdfOpenTxt}>فتح وتحميل PDF</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noPdf}>
              <Ionicons name="document-outline" size={32} color={C.gray} />
              <Text style={styles.noPdfText}>لم يُرفق ملف PDF لهذه الحصة بعد</Text>
            </View>
          )}
        </SectionCard>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:  { padding: 16, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', gap: 12 },
  errorText: { fontSize: 16, color: C.grayDark, fontWeight: '600', textAlign: 'center' },
  retryBtn:  { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.navy, borderRadius: 12 },
  retryTxt:  { color: '#fff', fontWeight: '700', fontSize: 14 },

  heroCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderTopWidth: 4, ...shadow.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusText:  { fontSize: 12, fontWeight: '700' },
  lessonTitle: { fontSize: 22, fontWeight: '800', color: C.navy, textAlign: 'right', lineHeight: 32, marginBottom: 4 },
  unitText:    { fontSize: 13, color: C.grayMid, textAlign: 'right', marginBottom: 4 },
  heroDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText:    { fontSize: 13, color: C.grayMid, flex: 1, textAlign: 'right' },

  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 18, ...shadow.sm },
  cardLocked:      { opacity: 0.65 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle:       { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },
  cardTitleLocked: { color: C.grayMid },
  lockBadge:       { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  lockedMsg:       { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 20 },

  joinBtn:    { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  joinBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  sessionState:      { alignItems: 'center', padding: 12, gap: 8 },
  sessionStateTitle: { fontSize: 15, fontWeight: '700' },
  sessionStateSub:   { fontSize: 12, color: C.grayMid, textAlign: 'center', lineHeight: 18 },

  quizBtn:    { backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  quizBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  pdfBox:     { alignItems: 'center', gap: 10 },
  pdfIcon:    { width: 72, height: 72, borderRadius: 16, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', ...shadow.sm },
  pdfTitle:   { fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'center', lineHeight: 22 },
  pdfSub:     { fontSize: 12, color: C.grayMid },
  pdfOpenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 32, borderRadius: 14, backgroundColor: C.navy, marginTop: 4 },
  pdfOpenTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  noPdf:     { alignItems: 'center', gap: 8, padding: 12 },
  noPdfText: { fontSize: 13, color: C.grayMid, textAlign: 'center' },
});

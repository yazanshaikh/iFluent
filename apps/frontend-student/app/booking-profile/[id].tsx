/**
 * Booking Profile — بروفايل الحجز (قبل قبول المعلم)
 * Same template as session-profile: purple · fun title · PDF chip
 * Auto-redirects to session-profile once teacher creates the session.
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sessionsApi, type BookingProfile } from '@/api/sessions';
import { C, shadow } from '@/theme';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
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
  pending:   '⏳ بانتظار القبول',
  confirmed: '✅ مؤكدة',
  expired:   '😔 لم يتم القبول',
  rejected:  '❌ مرفوضة',
  cancelled: '❌ ملغاة',
};
const STATUS_COLOR: Record<string, string> = {
  pending:   C.warning,
  confirmed: C.success,
  expired:   C.gray,
  rejected:  C.error,
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

export default function BookingProfileScreen() {
  const router    = useRouter();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);

  const { data, isLoading, isError, refetch } = useQuery<BookingProfile>({
    queryKey: ['booking-profile', bookingId],
    queryFn:  () => sessionsApi.getBookingProfile(bookingId),
    staleTime: 15_000,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return (s === 'pending' || s === 'confirmed') ? 15_000 : false;
    },
  });

  // Auto-redirect once session is created
  useEffect(() => {
    if (data?.session_id) {
      router.replace({ pathname: '/session-profile/[id]', params: { id: String(data.session_id) } });
    }
  }, [data?.session_id]);

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
        <Text style={styles.errTxt}>تعذّر تحميل بيانات الحجز</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const lesson      = data.lesson;
  const isPending   = data.status === 'pending' || data.status === 'confirmed';
  const statusColor = STATUS_COLOR[data.status] ?? C.gray;
  const statusLabel = STATUS_LABEL[data.status] ?? data.status;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'حصصي',
          headerStyle:     { backgroundColor: PURPLE },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════ */}
        <View style={styles.hero}>

          {/* Status badge — top right */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            {isPending && <ActivityIndicator size="small" color={statusColor} style={{ marginLeft: 2 }} />}
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {/* Fun title */}
          <Text style={styles.heroSub}>حصة اليوم رح تكون عن ✨</Text>
          <Text style={styles.heroTitle}>{lesson?.title ?? 'حصة فردية'}</Text>

          {lesson?.unit && (
            <Text style={styles.heroMeta}>
              {lesson.unit.name}
              {lesson.level ? `  ·  ${lesson.level.name}` : ''}
            </Text>
          )}

          <View style={styles.heroDivider} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={PURPLE} />
            <Text style={styles.infoTxt}>{fmtDate(data.scheduled_at)}</Text>
          </View>

          {data.teacher?.name ? (
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={14} color={PURPLE} />
              <Text style={styles.infoTxt}>مع {data.teacher.name}</Text>
            </View>
          ) : isPending ? (
            <View style={styles.infoRow}>
              <Ionicons name="hourglass-outline" size={14} color={C.warning} />
              <Text style={[styles.infoTxt, { color: C.warning }]}>جاري تعيين المعلم…</Text>
            </View>
          ) : null}

          {/* PDF chip — bottom of hero */}
          {lesson?.pdf_url ? (
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
        <Card
          icon="videocam-outline"
          title="الحصة الحية"
          locked
          lockedMsg={
            isPending
              ? 'ستُفعَّل تلقائياً بمجرد قبول المعلم 🎯'
              : 'لم تُعقد هذه الحصة'
          }
        />

        {/* ──────────────────────────────────────────────────────────────
            كويز
        ────────────────────────────────────────────────────────────── */}
        <Card
          icon="help-circle-outline"
          title="كويز ما بعد الدرس"
          locked
          lockedMsg="الكويز يُفتح فقط بعد إتمام الحصة 🔐"
        />

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

  hero: { backgroundColor: CARD_BG, borderRadius: 24, padding: 20, ...shadow.sm },

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
    flexDirection: 'row', alignItems: 'center', gap: 5,
    position: 'absolute', top: 20, right: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 11, fontWeight: '700' },

  heroSub:   { fontSize: 13, color: PURPLE, fontWeight: '600', textAlign: 'right', marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: C.navy, textAlign: 'right', lineHeight: 34, marginBottom: 6 },
  heroMeta:  { fontSize: 13, color: C.grayMid, textAlign: 'right', marginBottom: 4 },
  heroDivider: { height: 1, backgroundColor: '#F3EFFF', marginVertical: 14 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoTxt:   { fontSize: 13, color: C.grayMid, flex: 1, textAlign: 'right' },

  card:      { backgroundColor: CARD_BG, borderRadius: 18, padding: 18, ...shadow.sm },
  cardLocked: { opacity: 0.6 },
  cardRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },
  lockChip:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  lockedMsg: { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 20 },
});

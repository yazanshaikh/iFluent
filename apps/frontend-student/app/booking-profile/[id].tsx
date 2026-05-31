/**
 * Booking Profile — بروفايل الحجز (قبل قبول المعلم)
 * Same gradient template as session-profile.
 * Auto-redirects to session-profile once session is created.
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sessionsApi, type BookingProfile } from '@/api/sessions';
import { fixStorageUrl } from '@/api/client';
import { C, shadow } from '@/theme';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const G_TOP   = '#6D28D9';
const G_BOTTOM = '#1A2980';
const PURPLE  = '#7C3AED';
const ACCENT  = '#A78BFA';
const CARD_BG = '#FFFFFF';

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
  pending:   { label: 'بانتظار القبول', color: '#F59E0B', emoji: '⏳' },
  confirmed: { label: 'مؤكدة',          color: '#22C55E', emoji: '✅' },
  expired:   { label: 'لم يتم القبول',  color: '#6B7280', emoji: '😔' },
  rejected:  { label: 'مرفوضة',         color: '#EF4444', emoji: '❌' },
  cancelled: { label: 'ملغاة',          color: '#EF4444', emoji: '❌' },
};

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status, isPending }: { status: string; isPending: boolean }) {
  const meta = STATUS_META[status] ?? { label: status, color: '#fff', emoji: '' };
  return (
    <View style={[pillSt.wrap, { borderColor: meta.color + '88' }]}>
      {isPending && <ActivityIndicator size="small" color={meta.color} style={{ marginRight: 2 }} />}
      <Text style={pillSt.emoji}>{meta.emoji}</Text>
      <Text style={[pillSt.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}
const pillSt = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.12)' },
  emoji: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700' },
});

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({
  icon, title, locked, lockedMsg,
}: {
  icon: string; title: string;
  locked?: boolean; lockedMsg?: string;
}) {
  return (
    <View style={[cardSt.wrap, locked && { opacity: 0.58 }]}>
      {!locked && <View style={[cardSt.bar, { backgroundColor: PURPLE }]} />}
      <View style={cardSt.inner}>
        <View style={cardSt.header}>
          <View style={[cardSt.iconWrap, locked && { shadowOpacity: 0 }]}>
            <Ionicons
              name={icon as any}
              size={22}
              color={locked ? C.gray : PURPLE}
            />
          </View>
          <Text style={[cardSt.title, locked && { color: C.gray }]}>{title}</Text>
          {locked && (
            <View style={cardSt.lockBubble}>
              <Ionicons name="lock-closed" size={11} color={C.gray} />
            </View>
          )}
        </View>
        <Text style={cardSt.lockedMsg}>{lockedMsg}</Text>
      </View>
    </View>
  );
}
const cardSt = StyleSheet.create({
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
export default function BookingProfileScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);

  const { data, isLoading, isError, refetch } = useQuery<BookingProfile>({
    queryKey: ['booking-profile', bookingId],
    queryFn:  () => sessionsApi.getBookingProfile(bookingId),
    staleTime: 15_000,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
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
      <LinearGradient colors={[G_TOP, G_BOTTOM]} style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  if (isError || !data) {
    return (
      <LinearGradient colors={[G_TOP, G_BOTTOM]} style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={52} color="#fff" />
        <Text style={styles.errTxt}>تعذّر تحميل بيانات الحجز</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const lesson    = data.lesson;
  const isPending = data.status === 'pending' || data.status === 'confirmed';

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F0FF' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ════════════════════════════════════════════════════════
            GRADIENT HERO
        ════════════════════════════════════════════════════════ */}
        <LinearGradient
          colors={[G_TOP, G_BOTTOM]}
          start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          {/* ── Row: back + status ── */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <StatusPill status={data.status} isPending={isPending} />
          </View>

          {/* ── Label ── */}
          <View style={styles.subWrap}>
            <Text style={styles.heroSub}>حصة اليوم رح تكون عن</Text>
          </View>

          <Text style={styles.heroTitle} numberOfLines={3}>
            {lesson?.title ?? ''}
          </Text>

          {lesson?.unit && (
            <Text style={styles.heroMeta}>
              {lesson.unit.name}
              {lesson.level ? `  ·  ${lesson.level.name}` : ''}
            </Text>
          )}

          {data.teacher?.name && (
            <View style={styles.metaStrip}>
              <View style={styles.metaItem}>
                <Ionicons name="person-circle-outline" size={14} color={ACCENT} />
                <Text style={styles.metaItemTxt}>{data.teacher.name}</Text>
              </View>
            </View>
          )}

          <View style={styles.deco1} pointerEvents="none" />
          <View style={styles.deco2} pointerEvents="none" />
        </LinearGradient>

        {/* ════════════════════════════════════════════════════════
            CARDS
        ════════════════════════════════════════════════════════ */}
        <View style={styles.cards}>
          <Card
            icon="clipboard-outline"
            title="نشاط ما قبل الحصة"
            locked
            lockedMsg="هذه الميزة ستكون متاحة قريباً 🚀"
          />
          <Card
            icon="videocam-outline"
            title="الحصة الحية"
            locked
            lockedMsg={isPending ? 'ستُفعَّل تلقائياً بمجرد قبول المعلم 🎯' : 'لم تُعقد هذه الحصة'}
          />
          <Card
            icon="help-circle-outline"
            title="كويز ما بعد الدرس"
            locked
            lockedMsg="الكويز يُفتح فقط بعد إتمام الحصة 🔐"
          />

          {/* ── PDF — تحت الكويز، على اليمين ── */}
          {fixStorageUrl(lesson?.pdf_url) && (
            <View style={styles.pdfRow}>
              <TouchableOpacity
                style={styles.pdfBtn}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(fixStorageUrl(lesson!.pdf_url)!)}
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

  hero: {
    paddingHorizontal: 20, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
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
    shadowColor: '#93D2FF',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  heroSub: {
    fontSize: 18, color: '#E0F4FF', fontWeight: '800',
    textAlign: 'center', letterSpacing: 0.4,
    fontFamily: Platform.select({ ios: 'Al Nile', android: 'serif' }),
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'right', lineHeight: 28, marginBottom: 6 },
  heroMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'right', marginBottom: 14 },
  metaStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'flex-end' },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItemTxt: { fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: '500' },

  deco1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, left: -50 },
  deco2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: 30 },

  cards: { padding: 16, gap: 14, marginTop: -16 },

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

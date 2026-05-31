/**
 * Booking Profile — بروفايل الحجز (قبل قبول المعلم)
 * Auto-redirects to session-profile once session is created.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sessionsApi, type BookingProfile } from '@/api/sessions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fixStorageUrl } from '@/api/client';
import { C, shadow } from '@/theme';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const G_TOP    = '#6D28D9';
const G_BOTTOM = '#1A2980';
const PURPLE   = '#7C3AED';
const ACCENT   = '#A78BFA';
const CARD_BG  = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: 'بانتظار القبول', color: '#F59E0B', emoji: '⏳' },
  confirmed: { label: 'مؤكدة',          color: '#22C55E', emoji: '✅' },
  expired:   { label: 'لم يتم القبول',  color: '#9CA3AF', emoji: '😔' },
  rejected:  { label: 'مرفوضة',         color: '#EF4444', emoji: '❌' },
  cancelled: { label: 'ملغاة',          color: '#EF4444', emoji: '❌' },
};

// ─── Section card ─────────────────────────────────────────────────────────────
function Card({ icon, title, locked, lockedMsg }: {
  icon: string; title: string; locked?: boolean; lockedMsg?: string;
}) {
  return (
    <View style={[cardSt.wrap, locked && { opacity: 0.55 }]}>
      {!locked && <View style={[cardSt.bar]} />}
      <View style={cardSt.inner}>
        <View style={cardSt.header}>
          <View style={[cardSt.iconWrap, locked && { shadowOpacity: 0 }]}>
            <Ionicons name={icon as any} size={21} color={locked ? C.gray : PURPLE} />
          </View>
          <Text style={[cardSt.title, locked && { color: C.gray }]}>{title}</Text>
          {locked && (
            <View style={cardSt.lockBubble}>
              <Ionicons name="lock-closed" size={11} color={C.gray} />
            </View>
          )}
        </View>
        {locked && <Text style={cardSt.lockedMsg}>{lockedMsg}</Text>}
      </View>
    </View>
  );
}
const cardSt = StyleSheet.create({
  wrap:       { backgroundColor: CARD_BG, borderRadius: 20, flexDirection: 'row', overflow: 'hidden', ...shadow.sm },
  bar:        { width: 4, backgroundColor: PURPLE },
  inner:      { flex: 1, padding: 18 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconWrap:   { justifyContent: 'center', alignItems: 'center', shadowColor: PURPLE, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  title:      { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },
  lockBubble: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  lockedMsg:  { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 20 },
});

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingProfileScreen() {
  const router    = useRouter();
  const qc        = useQueryClient();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);

  const cancelMutation = useMutation({
    mutationFn: () => sessionsApi.cancelBooking(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-profile', bookingId] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.back();
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إلغاء الحجز. يرجى المحاولة مرة أخرى.'),
  });

  const handleCancel = () => {
    Alert.alert(
      'إلغاء الحجز',
      'هل أنت متأكد من إلغاء هذا الحجز؟',
      [
        { text: 'تراجع', style: 'cancel' },
        { text: 'إلغاء الحجز', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ],
    );
  };

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

  const lesson       = data.lesson;
  const isAssessment = lesson?.is_assessment ?? false;
  const pdfUrl       = !isAssessment ? fixStorageUrl(lesson?.pdf_url) : null;
  const isPending    = data.status === 'pending' || data.status === 'confirmed';
  const meta         = STATUS_META[data.status] ?? { label: data.status, color: '#fff', emoji: '' };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F0FF' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ════════════════ HERO ════════════════ */}
        <LinearGradient
          colors={[G_TOP, G_BOTTOM]}
          start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          {/* Decorative blobs */}
          <View style={styles.blob1} pointerEvents="none" />
          <View style={styles.blob2} pointerEvents="none" />

          {/* Top row: back ← · status pill */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Status pill */}
            <View style={[styles.statusPill, { borderColor: meta.color + '66' }]}>
              {isPending && (
                <ActivityIndicator size="small" color={meta.color} style={{ marginLeft: 4 }} />
              )}
              <Text style={styles.statusEmoji}>{meta.emoji}</Text>
              <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Sub-label badge + title — hidden for assessment sessions */}
          {!isAssessment && (
            <>
              <LinearGradient
                colors={['rgba(109,40,217,0.55)', 'rgba(26,41,128,0.2)']}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                style={styles.subBadge}
              >
                <Text style={styles.subLabel}>حصة اليوم رح تكون عن</Text>
              </LinearGradient>

              {lesson?.title ? (
                <Text style={styles.lessonTitle} numberOfLines={3}>{lesson.title}</Text>
              ) : (
                <Text style={styles.lessonTitleFallback}>
                  {isPending ? 'سيتم تحديد الدرس عند قبول المعلم' : '—'}
                </Text>
              )}

              {lesson?.unit && (
                <Text style={styles.lessonMeta}>
                  {lesson.unit.name}
                  {lesson.level ? `  ·  ${lesson.level.name}` : ''}
                </Text>
              )}
            </>
          )}

          {/* Assessment label */}
          {isAssessment && (
            <Text style={styles.assessmentLabel}>🎯 حصة تقييمية</Text>
          )}

          {/* Teacher */}
          {data.teacher?.name && (
            <View style={styles.teacherRow}>
              <Ionicons name="person-circle-outline" size={14} color={ACCENT} />
              <Text style={styles.teacherTxt}>{data.teacher.name}</Text>
            </View>
          )}

          {/* PDF download button — inside hero, bottom */}
          {pdfUrl ? (
            <TouchableOpacity
              style={styles.pdfBtn}
              activeOpacity={0.82}
              onPress={() => Linking.openURL(pdfUrl)}
            >
              <Ionicons name="document-text" size={16} color={PURPLE} />
              <Text style={styles.pdfBtnTxt}>تحميل مادة الدرس</Text>
              <Ionicons name="download-outline" size={14} color={PURPLE} />
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        {/* ════════════════ CARDS ════════════════ */}
        <View style={styles.cards}>
          <Card
            icon="videocam-outline"
            title="الحصة المباشرة"
            locked
            lockedMsg={isPending
              ? 'ستُفعَّل تلقائياً بمجرد قبول المعلم'
              : 'لم تُعقد هذه الحصة'}
          />
          <Card
            icon="help-circle-outline"
            title="نشاط ما بعد الدرس"
            locked
            lockedMsg="النشاط يُفتح فقط بعد إتمام الحصة "
          />

          {/* زر الإلغاء — فقط لما status = pending (قبل قبول المعلم) */}
          {data.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={styles.cancelTxt}>إلغاء الحجز</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* رسالة توضيحية لما المعلم وافق */}
          {data.status === 'confirmed' && (
            <View style={styles.confirmedNote}>
              <Ionicons name="lock-closed-outline" size={15} color="#6B7280" />
              <Text style={styles.confirmedNoteTxt}>
                لا يمكن إلغاء الحجز بعد موافقة المعلم
              </Text>
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
  errTxt:   { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
  },

  blob1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, left: -60, zIndex: 0 },
  blob2: { position: 'absolute', width: 130, height: 130, borderRadius: 65,  backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10,  left: 20,  zIndex: 0 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    zIndex: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusEmoji: { fontSize: 13 },
  statusLabel: { fontSize: 12, fontWeight: '700' },

  subBadge: {
    alignSelf: 'center',
    borderRadius: 22,
    paddingHorizontal: 20, paddingVertical: 9,
    marginBottom: 12,
    shadowColor: '#6D28D9',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    zIndex: 1,
  },
  subLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E0F4FF',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: 'Al Nile', android: 'serif' }),
  },

  lessonTitle: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    textAlign: 'right', lineHeight: 32, marginBottom: 6,
    zIndex: 1,
  },
  lessonTitleFallback: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'right', fontStyle: 'italic', marginBottom: 6,
    zIndex: 1,
  },
  lessonMeta: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    textAlign: 'right', marginBottom: 10, zIndex: 1,
  },
  assessmentLabel: {
    fontSize: 18, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginTop: 8, marginBottom: 6,
    letterSpacing: 0.3,
  },
  teacherRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, justifyContent: 'flex-end',
    marginBottom: 16, zIndex: 1,
  },
  teacherTxt: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.12,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 1,
  },
  pdfBtnTxt: { fontSize: 13, fontWeight: '700', color: PURPLE },

  // ── Cards ─────────────────────────────────────────────────────────────────
  cards: { padding: 16, gap: 14, marginTop: -12 },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  confirmedNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
  },
  confirmedNoteTxt: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
});

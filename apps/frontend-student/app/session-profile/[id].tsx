/**
 * Session Profile — بروفايل الحصة
 *
 * Layout:
 * ┌─────────────────────────────┐
 * │  LinearGradient hero        │  ← lesson title + meta
 * ├─────────────────────────────┤
 *
 * │  Card: الحصة المباشرة          │
 * │  Card: الكويز               │
 * └─────────────────────────────┘
 * FAB ↘ PDF download
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking, Platform,
  Modal, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { sessionsApi, type SessionProfile } from '@/api/sessions';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore }  from '@/stores/authStore';
import { getEcho, disconnectEcho } from '@/lib/echo';
import { fixStorageUrl } from '@/api/client';
import { TeacherAvailabilityModal } from '@/components/TeacherAvailabilityModal';
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
  waiting:   { label: 'قريباً',         color: '#F59E0B', emoji: '⏳' },
  active:    { label: 'نشطة الآن',     color: '#22C55E', emoji: '🟢' },
  completed: { label: 'مكتملة',         color: '#6B7280', emoji: '✅' },
  cancelled: { label: 'ملغاة',          color: '#EF4444', emoji: '❌' },
};

function getStatusMeta(status: string, attendance: string | null) {
  if (status === 'completed') {
    if (attendance === 'teacher_absent')
      return { label: 'لم يحضر المعلم', color: '#EF4444', emoji: '😔' };
    if (attendance === 'absent')
      return { label: 'لم تحضر',        color: '#F59E0B', emoji: '😔' };
    return { label: 'مكتملة',           color: '#6B7280', emoji: '✅' };
  }
  return STATUS_META[status] ?? { label: status, color: '#fff', emoji: '' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill badge shown on the gradient hero */
function StatusPill({ status, attendance }: { status: string; attendance: string | null }) {
  const meta = getStatusMeta(status, attendance);
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

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 36 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? '#F59E0B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({
  visible, teacherName, sessionId,
  onClose, onSubmitted,
}: {
  visible: boolean;
  teacherName: string;
  sessionId: number;
  onClose: () => void;
  onSubmitted: (stars: number) => void;
}) {
  const [stars, setStars] = useState(0);
  const [notes, setNotes] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => sessionsApi.rateSession(sessionId, stars, notes.trim() || undefined),
    onSuccess: () => {
      onSubmitted(stars);
      setStars(0);
      setNotes('');
    },
    onError: (e: any) => {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر إرسال التقييم');
    },
  });

  const LABELS: Record<number, string> = {
    1: 'سيء جداً 😞',
    2: 'سيء 😕',
    3: 'مقبول 😐',
    4: 'جيد 🙂',
    5: 'ممتاز 🌟',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ratingStyles.overlay}>
        <View style={ratingStyles.sheet}>
          {/* Handle */}
          <View style={ratingStyles.handle} />

          <Text style={ratingStyles.emoji}>⭐</Text>
          <Text style={ratingStyles.title}>قيّم المعلم</Text>
          <Text style={ratingStyles.sub}>
            كيف كانت تجربتك مع <Text style={{ fontWeight: '900', color: PURPLE }}>{teacherName}</Text>؟
          </Text>

          {/* Stars */}
          <StarRating value={stars} onChange={setStars} size={44} />

          {stars > 0 && (
            <Text style={ratingStyles.starLabel}>{LABELS[stars]}</Text>
          )}

          {/* Notes */}
          <TextInput
            style={ratingStyles.notesInput}
            placeholder="ملاحظات إضافية (اختياري)"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlign="right"
            textAlignVertical="top"
          />

          {/* Buttons */}
          <View style={ratingStyles.btnRow}>
            <TouchableOpacity style={ratingStyles.skipBtn} onPress={onClose}>
              <Text style={ratingStyles.skipTxt}>لاحقاً</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ratingStyles.submitBtn, (stars === 0 || isPending) && { opacity: 0.5 }]}
              onPress={() => mutate()}
              disabled={stars === 0 || isPending}
            >
              {isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={ratingStyles.submitTxt}>إرسال التقييم</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SessionProfileScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const qc        = useQueryClient();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const token     = useAuthStore((s) => s.token);
  const userId    = useAuthStore((s) => s.user?.id);
  const hydrated  = useAuthStore((s) => s.hydrated);

  console.log(`[SESSION-PROFILE] Mounted: sessionId=${sessionId}`);

  // Real-time override from WebSocket (while query is stale)
  const [rtData, setRtData] = useState<Partial<SessionProfile> | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [availVisible, setAvailVisible] = useState(false);
  const ratingShownRef = useRef(false); // prevent showing twice

  // ── Real-time: subscribe to session events via Reverb ─────────────────────
  useEffect(() => {
    // CRITICAL GUARD 1: Wait for auth hydration (data loading)
    if (!hydrated) {
      console.log('[SESSION-PROFILE] ⏳ Reverb: waiting for auth hydration...');
      return;  // ← EXIT if not hydrated
    }

    // CRITICAL GUARD 2: Verify both token AND userId exist
    if (!token || !userId) {
      console.log(`[SESSION-PROFILE] ❌ Reverb: blocked (token=${!!token}, userId=${!!userId})`);
      return;  // ← EXIT if credentials missing
    }

    // NOW SAFE: All guards passed, proceed with Reverb connection
    console.log(`[SESSION-PROFILE] 🔌 Connecting to Reverb: student.${userId}`);

    const cleanupFns: (() => void)[] = [];

    try {
      // getEcho is now synchronous — native WebSocket, no native modules
      const echo    = getEcho(token);
      const channel = echo.private(`student.${userId}`);

      const unsubActivated = channel.listen('.session.activated', (e: any) => {
        if (e.session_id === sessionId) {
          setRtData({ status: e.status || 'active' });
          qc.invalidateQueries({ queryKey: ['session-profile', sessionId] });
        }
      });

      const unsubEnded = channel.listen('.session.ended', (e: any) => {
        if (e.session_id === sessionId) {
          setRtData({
            status:            e.status || 'completed',
            attendance_status: e.attendance_status,
            ended_at:          e.ended_at,
            lesson:            e.lesson,
          });
          qc.invalidateQueries({ queryKey: ['session-profile', sessionId] });
          if (e.attendance_status === 'attended' && !ratingShownRef.current) {
            ratingShownRef.current = true;
            setTimeout(() => setShowRating(true), 1000);
          }
        }
      });

      if (typeof unsubActivated === 'function') cleanupFns.push(unsubActivated);
      if (typeof unsubEnded     === 'function') cleanupFns.push(unsubEnded);
    } catch (err) {
      // Non-critical — app works via polling even without real-time
      console.warn('[SESSION-PROFILE] Reverb unavailable:', err instanceof Error ? err.message : 'unknown');
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [hydrated, token, userId, sessionId, qc]);

  const { data: rawData, isLoading, isError, refetch } = useQuery<SessionProfile>({
    queryKey:     ['session-profile', sessionId],
    queryFn:      async () => {
      console.log(`[SESSION-PROFILE] API: getProfile(${sessionId})`);
      return sessionsApi.getProfile(sessionId);
    },
    staleTime:    0,
    // Poll while waiting OR after session ends
    // - While waiting (status='waiting'): poll every 10s
    // - While active (status='active'): don't poll (WebSocket handles it)
    // - After completed (status='completed'): poll once to get final lesson
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === 'waiting')   return 10_000; // waiting for teacher
      if (status === 'active')    return 5_000;  // ✅ poll while active — catch when teacher ends
      if (status === 'completed') return 3_000;  // just ended — get final data
      return false;
    },
  });

  // Merge real-time override with query data
  const data = rawData ? { ...rawData, ...(rtData ?? {}) } : rawData;

  // When session ends → invalidate sessions list so it updates immediately
  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = data?.status;
    if (prev === 'active' && curr === 'completed') {
      // Session just ended — refresh the sessions tab list
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    }
    prevStatusRef.current = curr;
  }, [data?.status, qc]);

  // Auto-show rating modal: attended + not rated + not shown yet
  useEffect(() => {
    if (
      data?.status === 'completed' &&
      data?.attendance_status === 'attended' &&
      data?.rating?.rated === false &&
      !ratingShownRef.current
    ) {
      ratingShownRef.current = true;
      setTimeout(() => setShowRating(true), 800);
    }
    // If already rated, sync state
    if (data?.rating?.rated) {
      setAlreadyRated(true);
    }
  }, [data?.status, data?.attendance_status, data?.rating?.rated]);

  console.log(`[SESSION-PROFILE] Render: loading=${isLoading} error=${isError} status=${data?.status ?? 'none'} rtOverride=${!!rtData}`);

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

  const lesson       = data.lesson;
  const isAssessment = lesson?.is_assessment ?? false;
  const isActive          = data.status === 'active';
  const isWaiting         = data.status === 'waiting';
  const isCompleted       = data.status === 'completed';
  const isTeacherAbsent   = isCompleted && data.attendance_status === 'teacher_absent';
  const isStudentAbsent   = isCompleted && data.attendance_status === 'absent';
  const isProperlyDone    = isCompleted && data.attendance_status === 'attended';

  // "5 minutes before" — show countdown when close to session time
  const minsUntil = data.scheduled_at
    ? (new Date(data.scheduled_at).getTime() - Date.now()) / 60000
    : null;
  const isWithin5Min = isWaiting && minsUntil !== null && minsUntil <= 5 && minsUntil > -30;

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
            <StatusPill status={data.status} attendance={data.attendance_status ?? null} />
          </View>

          {/* Assessment label OR regular lesson title+PDF */}
          {isAssessment ? (
            <Text style={styles.assessmentLabel}>🎯 حصة تقييمية</Text>
          ) : (
            <>
              <LinearGradient
                colors={['rgba(109,40,217,0.55)', 'rgba(26,41,128,0.25)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.subWrap}
              >
                <Text style={styles.heroSub}>حصة اليوم رح تكون عن</Text>
              </LinearGradient>

              <Text style={styles.heroTitle} numberOfLines={3}>
                {lesson.title ?? ''}
              </Text>

              {lesson.unit && (
                <Text style={styles.heroMeta}>
                  {lesson.unit.name}
                  {lesson.level ? `  ·  ${lesson.level.name}` : ''}
                </Text>
              )}
            </>
          )}

          {/* Teacher card */}
          {data.teacher?.name && (
            <View style={styles.teacherCard}>
              <View style={styles.teacherAvatar}>
                <Ionicons name="person" size={22} color={PURPLE} />
              </View>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{data.teacher.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {data.teacher.teacher_code && (
                    <View style={styles.teacherCodeBadge}>
                      <Text style={styles.teacherCodeTxt}>{data.teacher.teacher_code}</Text>
                    </View>
                  )}
                  {/* ✅ Teacher avg rating */}
                  {data.teacher.avg_rating != null && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text style={styles.ratingBadgeTxt}>
                        {data.teacher.avg_rating.toFixed(1)}
                        <Text style={{ fontSize: 9, color: '#A78BFA' }}> ({data.teacher.total_ratings})</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* المواعيد المتاحة للمعلم */}
          {data.teacher?.teacher_code && (
            <TouchableOpacity
              style={styles.availBtn}
              activeOpacity={0.85}
              onPress={() => setAvailVisible(true)}
            >
              <Ionicons name="chevron-back" size={16} color={PURPLE} />
              <Text style={styles.availBtnTxt}>المواعيد المتاحة للمعلم</Text>
              <Ionicons name="calendar-outline" size={16} color={PURPLE} />
            </TouchableOpacity>
          )}

          {/* PDF — only for regular lessons */}
          {!isAssessment && fixStorageUrl(lesson.pdf_url) && (
            <TouchableOpacity
              style={styles.pdfBtn}
              activeOpacity={0.82}
              onPress={() => Linking.openURL(fixStorageUrl(lesson.pdf_url)!)}
            >
              <Ionicons name="document-text" size={16} color={PURPLE} />
              <Text style={styles.pdfBtnTxt}>تحميل مادة الدرس</Text>
              <Ionicons name="download-outline" size={14} color={PURPLE} />
            </TouchableOpacity>
          )}

          {/* Decorative circles — pointerEvents none so they don't block touches */}
          <View style={styles.deco1} pointerEvents="none" />
          <View style={styles.deco2} pointerEvents="none" />
        </LinearGradient>

        {/* ════════════════════════════════════════════════════════
            CARDS
        ════════════════════════════════════════════════════════ */}
        <View style={styles.cards}>


          {/* الحصة المباشرة */}
          <Card icon="videocam-outline" title="الحصة المباشرة" accent="#22C55E">
            {isActive ? (
              <TouchableOpacity
                style={styles.joinBtn}
                activeOpacity={0.85}
                onPress={() => {
                  console.log(`[SESSION-PROFILE] JOIN: sessionId=${data.id}`);
                  router.push({ pathname: '/session/[id]', params: { id: String(data.id) } });
                }}
              >
                <Ionicons name="videocam" size={18} color="#fff" />
                <Text style={styles.joinTxt}>دخول الفصل الآن 🎉</Text>
              </TouchableOpacity>
            ) : isWaiting && isWithin5Min ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>🔔</Text>
                <Text style={[styles.stateTitle, { color: '#7C3AED' }]}>الحصة على وشك البدء!</Text>
                <Text style={styles.stateSub}>انتظر المعلم، ستظهر زر الدخول تلقائياً</Text>
              </View>
            ) : isWaiting ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>⏳</Text>
                <Text style={[styles.stateTitle, { color: '#F59E0B' }]}>الحصة لم تبدأ بعد</Text>
                <Text style={styles.stateSub}>ستُفعَّل تلقائياً عند بدء المعلم</Text>
              </View>
            ) : isTeacherAbsent ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>😔</Text>
                <Text style={[styles.stateTitle, { color: '#EF4444' }]}>لم يحضر المعلم</Text>
                <Text style={styles.stateSub}>سيتم التواصل معك من الإدارة</Text>
              </View>
            ) : isStudentAbsent ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>📚</Text>
                <Text style={[styles.stateTitle, { color: '#F59E0B' }]}>لم تحضر الحصة</Text>
                <Text style={styles.stateSub}>يمكنك حجز حصة جديدة من الرئيسية</Text>
              </View>
            ) : isProperlyDone ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>🎓</Text>
                <Text style={[styles.stateTitle, { color: '#22C55E' }]}>أحسنت! الحصة مكتملة</Text>
                {/* ✅ Rating button */}
                {alreadyRated || data.rating?.rated ? (
                  <View style={styles.ratedRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratedTxt}>
                      قيّمت المعلم بـ {data.rating?.stars ?? '?'} نجوم ⭐
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.rateBtn}
                    onPress={() => setShowRating(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="star-outline" size={16} color="#fff" />
                    <Text style={styles.rateBtnTxt}>قيّم المعلم</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : isCompleted ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>✅</Text>
                <Text style={[styles.stateTitle, { color: '#6B7280' }]}>الحصة منتهية</Text>
              </View>
            ) : (
              <View style={styles.stateBox}>
                <Text style={styles.stateEmoji}>😔</Text>
                <Text style={[styles.stateTitle, { color: C.error }]}>تم إلغاء الحصة</Text>
              </View>
            )}
          </Card>

          {/* النشاط التفاعلي (Wordwall) — only when the lesson has an activity link */}
          {lesson.activity_url ? (
            <Card
              icon="game-controller-outline"
              title="النشاط التفاعلي"
              accent="#22C55E"
              locked={!data.quiz_unlocked}
              lockedMsg="النشاط يُفتح بعد إتمام الحصة 🔐"
            >
              <TouchableOpacity
                style={styles.activityBtn}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/activity/[id]',
                  params: { id: String(lesson.id), url: lesson.activity_url!, title: lesson.title },
                })}
              >
                <Ionicons name="game-controller" size={18} color="#fff" />
                <Text style={styles.quizTxt}>افتح النشاط</Text>
              </TouchableOpacity>
            </Card>
          ) : null}


        </View>
      </ScrollView>

      {/* ✅ Rating Modal */}
      <RatingModal
        visible={showRating}
        teacherName={data.teacher?.name ?? 'المعلم'}
        sessionId={sessionId}
        onClose={() => setShowRating(false)}
        onSubmitted={(stars) => {
          setShowRating(false);
          setAlreadyRated(true);
          qc.invalidateQueries({ queryKey: ['session-profile', sessionId] });
        }}
      />

      {/* Teacher availability popup */}
      <TeacherAvailabilityModal
        visible={availVisible}
        teacherCode={data.teacher?.teacher_code ?? null}
        teacherName={data.teacher?.name}
        onClose={() => setAvailVisible(false)}
      />
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
    borderRadius: 22,
    paddingHorizontal: 20, paddingVertical: 9,
    marginBottom: 14,
    shadowColor: '#6D28D9',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
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
  heroTitle:       { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'right', lineHeight: 28, marginBottom: 6 },
  assessmentLabel: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 8, marginBottom: 6, letterSpacing: 0.3 },
  heroMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'right', marginBottom: 14 },

  metaStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'flex-end' },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItemTxt: { fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: '500' },

  // Teacher card on hero
  teacherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    alignSelf: 'flex-end', marginTop: 10,
  },
  availBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    alignSelf: 'flex-end', marginTop: 10,
  },
  availBtnTxt: { fontSize: 13, fontWeight: '800', color: '#7C3AED' },
  teacherAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  teacherInfo:  { alignItems: 'flex-end', gap: 4 },
  teacherName:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  teacherCodeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  teacherCodeTxt: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

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
  activityBtn: { backgroundColor: '#22C55E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  quizTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // ── PDF ───────────────────────────────────────────────────────────────────
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, marginTop: 14,
    shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pdfBtnTxt: { fontSize: 13, fontWeight: '700', color: PURPLE },

  // ── Teacher Rating Badge ────────────────────────────────────────────────
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  ratingBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

  // ── Rate Button ─────────────────────────────────────────────────────────
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#F59E0B',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, marginTop: 10, alignSelf: 'center',
  },
  rateBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  ratedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, alignSelf: 'center',
  },
  ratedTxt: { fontSize: 12, color: '#F59E0B', fontWeight: '700' },
});

// ─── Rating Modal Styles ──────────────────────────────────────────────────────
const ratingStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
    alignItems: 'center', gap: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', marginBottom: 4,
  },
  emoji: { fontSize: 44 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  sub:   { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  starLabel: {
    fontSize: 15, fontWeight: '700', color: '#F59E0B',
    marginTop: 4,
  },
  notesInput: {
    width: '100%', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, padding: 14, fontSize: 14,
    color: '#111', minHeight: 80, marginTop: 4,
    backgroundColor: '#F9FAFB',
  },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
  skipBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  skipTxt: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F59E0B', alignItems: 'center',
  },
  submitTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

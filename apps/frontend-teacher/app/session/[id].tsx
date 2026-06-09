/**
 * Session Profile — بروفايل الحصة
 * Same design as request profile but for an already-accepted session.
 * Teacher can: view lesson/student info, open Nearpod, set PIN, then start.
 */
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sessionsApi, type TeacherSession, type SessionStartError } from '@/api/sessions';
import { C, shadow } from '@/theme';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={C.sky} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

export default function SessionDetailScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const qc        = useQueryClient();
  const sessionId = Number(id);
  const [pin, setPin]           = useState('');
  const [confirming, setConfirming] = useState(false); // inline PIN confirm
  const [startError, setStartError] = useState<SessionStartError | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const { data: session, isLoading } = useQuery<TeacherSession>({
    queryKey: ['session', sessionId],
    queryFn:  () => sessionsApi.get(sessionId),
    staleTime: 15_000,
  });

  // ⏱️ Countdown timer — update every second
  // Window: من (scheduled_at - 15 min) إلى (scheduled_at + 15 min)
  useEffect(() => {
    if (!session?.scheduled_at) return;

    const updateCountdown = () => {
      const now = Date.now();
      const scheduled = new Date(session.scheduled_at).getTime();
      const fifteenMinBefore = scheduled - 15 * 60 * 1000;
      const fifteenMinAfter = scheduled + 15 * 60 * 1000;

      // لما نكون قبل الموعد بأكثر من 15 دقيقة
      if (now < fifteenMinBefore) {
        const minsUntil = Math.ceil((fifteenMinBefore - now) / 60000);
        setCountdown(minsUntil);
      }
      // لما نكون داخل الـ window (من -15 min إلى +15 min)
      else if (now >= fifteenMinBefore && now <= fifteenMinAfter) {
        setCountdown(null); // ✅ يقدر يفعل
      }
      // لما نكون بعد الموعد بأكثر من 15 دقيقة
      else {
        setCountdown(-1); // -1 = too late
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session?.scheduled_at]);

  // Pre-fill PIN if already saved
  useEffect(() => {
    if (session?.nearpod_pin && !pin) setPin(session.nearpod_pin);
  }, [session?.nearpod_pin]);

  // Save Nearpod PIN
  const pinMutation = useMutation({
    mutationFn: (p: string) => sessionsApi.setNearpodPin(sessionId, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
    onError:   (e: any) => Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر حفظ PIN'),
  });

  // Release session back to pool
  const releaseMutation = useMutation({
    mutationFn: () => sessionsApi.release(sessionId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['requests'] });
      router.back();
    },
    onError: (e: any) =>
      Alert.alert('تعذر إلغاء السحب', e?.response?.data?.message ?? 'حدث خطأ'),
  });

  const handleRelease = () => releaseMutation.mutate();

  // Start session — sends PIN, activates, returns room URL with teacher token
  const startMutation = useMutation({
    mutationFn: (nearpodPin: string) => sessionsApi.start(sessionId, nearpodPin),
    onSuccess:  (data) => {
      setStartError(null);
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      // Pass the signed room URL (with ?t=token) so classroom opens it directly
      router.push({
        pathname: '/classroom/[id]',
        params: { id: String(sessionId), roomUrl: data?.daily_room_url ?? '' },
      });
    },
    onError: (e: any) => {
      const errData = e?.response?.data;
      if (errData?.reason === 'too_early' || errData?.reason === 'too_late') {
        setStartError(errData);
        setConfirming(false);
      } else {
        Alert.alert('خطأ', errData?.message ?? 'تعذر بدء الحصة');
      }
    },
  });

  const handleStart = () => {
    if (!pin.trim()) return; // PIN required — button disabled anyway
    setConfirming(true);     // show inline confirmation
  };

  const openNearpod = () => {
    const lessonId = session?.lesson?.nearpod_lesson_id;
    const url = lessonId
      ? `https://nearpod.com/login?redirect=https://nearpod.com/presentation?pin=${lessonId}`
      : (session?.lesson?.nearpod_url ?? 'https://nearpod.com');
    Linking.openURL(url).catch(() => Alert.alert('خطأ', 'تعذر فتح Nearpod'));
  };

  if (isLoading || !session) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={C.sky} size="large" />
      </View>
    );
  }

  const lesson     = session.lesson;
  const student    = session.student;
  const level      = lesson?.level ?? lesson?.unit?.level ?? null;
  const levelCode  = level?.code ?? '';
  const lessonNum  = lesson?.order != null ? `درس ${lesson.order}` : '';
  const isActive   = session.status === 'active';
  const canStart   = session.status === 'waiting' || session.status === 'confirmed';

  // إلغاء السحب: مسموح فقط لحالة waiting وقبل 30 دقيقة من الموعد
  const canRelease = session.status === 'waiting' && (() => {
    if (!session.scheduled_at) return false;
    const minsUntil = (new Date(session.scheduled_at).getTime() - Date.now()) / 60000;
    return minsUntil > 30;
  })();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>

        {/* ── Header ── */}
        <LinearGradient
          colors={[C.sky, C.skyDark]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.headerTitle}>بروفايل الحصة</Text>
            {(levelCode || lessonNum) && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeTxt}>
                  {[levelCode, lessonNum].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Lesson card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الحصة</Text>
            <View style={styles.card}>
              <InfoRow icon="book-outline"   label="اسم الحصة" value={lesson?.title ?? '—'} />
              <InfoRow icon="calendar-outline" label="الموعد"  value={fmt(session.scheduled_at)} />
              {level && (
                <InfoRow
                  icon="layers-outline"
                  label="المستوى"
                  value={`${level.code} — ${level.name}`}
                />
              )}
              {lesson?.order != null && (
                <InfoRow icon="list-outline" label="رقم الدرس" value={`${lesson.order}`} />
              )}
            </View>
          </View>

          {/* ── Student card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الطالب</Text>
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="الاسم" value={student?.name ?? '—'} />
              {student?.age != null && (
                <InfoRow icon="calendar-outline" label="العمر" value={`${student.age} سنة`} />
              )}
            </View>
          </View>

          {/* ── Nearpod ── */}
          {(canStart || isActive) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearpod</Text>
              <View style={styles.card}>
                <Text style={styles.nearpodHint}>
                  افتح Nearpod لإنشاء الحصة والحصول على رقم PIN، ثم أدخله هنا وابدأ الحصة.
                </Text>

                {/* Open Nearpod */}
                <Pressable style={({ pressed }) => [styles.nearpodBtn, pressed && { opacity: 0.8 }]} onPress={openNearpod}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.nearpodBtnGrad}
                  >
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={styles.nearpodBtnTxt}>فتح في Nearpod</Text>
                  </LinearGradient>
                </Pressable>

                {/* PIN input */}
                <View style={styles.pinRow}>
                  <Ionicons name="keypad-outline" size={18} color={C.grayMid} />
                  <TextInput
                    style={styles.pinInput}
                    placeholder="أدخل رقم PIN من Nearpod"
                    placeholderTextColor={C.grayMid}
                    value={pin}
                    onChangeText={setPin}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textAlign="right"
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.pinSaveBtn,
                      (!pin.trim() || pinMutation.isPending) && { opacity: 0.5 },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => pin.trim() && pinMutation.mutate(pin.trim())}
                    disabled={!pin.trim() || pinMutation.isPending}
                  >
                    {pinMutation.isPending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.pinSaveTxt}>حفظ</Text>
                    }
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ── Inline PIN Confirm ── */}
          {confirming && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>تأكيد PIN</Text>
              <Text style={styles.confirmMsg}>
                لقد أدخلت الكود:{'\n'}
                <Text style={styles.confirmPin}>{pin.trim()}</Text>
                {'\n\n'}هل تتأكد أنه الكود الخاص بهذه الحصة؟
              </Text>
              <View style={styles.confirmBtns}>
                <Pressable
                  style={styles.confirmCancel}
                  onPress={() => setConfirming(false)}
                >
                  <Text style={styles.confirmCancelTxt}>تراجع</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmOk, startMutation.isPending && { opacity: 0.6 }]}
                  onPress={() => { setConfirming(false); startMutation.mutate(pin.trim()); }}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.confirmOkTxt}>نعم، ابدأ</Text>
                  }
                </Pressable>
              </View>
            </View>
          )}

          {/* ── CTA ── */}
          {isActive ? (
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: '/classroom/[id]', params: { id: String(sessionId) } })}
            >
              <LinearGradient colors={['#16a34a', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                <Ionicons name="videocam" size={22} color="#fff" />
                <Text style={styles.ctaTxt}>العودة للفصل الافتراضي</Text>
              </LinearGradient>
            </Pressable>
          ) : canStart ? (
            <>
              {/* ⏱️ Countdown warning if too early */}
              {countdown && countdown > 0 && (
                <View style={styles.countdownBox}>
                  <Ionicons name="time-outline" size={20} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countdownTitle}>فتح بعد {countdown} دقيقة</Text>
                    <Text style={styles.countdownMsg}>
                      ممكن تفعيل الحصة قبل موعدها بـ 15 دقيقة فقط
                    </Text>
                  </View>
                </View>
              )}

              {/* ❌ Too late warning */}
              {countdown === -1 && (
                <View style={[styles.errorBox, styles.errorBoxLate]}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.errorTitle, styles.errorTitleLate]}>
                      انتهى وقت تفعيل الحصة
                    </Text>
                    <Text style={[styles.errorMsg, styles.errorMsgLate]}>
                      يمكن تفعيل الحصة حتى 15 دقيقة بعد الموعد فقط
                    </Text>
                  </View>
                </View>
              )}

              {/* ❌ Timing error message (if too_early or too_late from API) */}
              {startError && (
                <View style={[styles.errorBox, startError.reason === 'too_late' && styles.errorBoxLate]}>
                  <Ionicons
                    name={startError.reason === 'too_early' ? 'time-outline' : 'alert-circle'}
                    size={18}
                    color={startError.reason === 'too_late' ? '#DC2626' : '#D97706'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.errorTitle, startError.reason === 'too_late' && styles.errorTitleLate]}>
                      {startError.message}
                    </Text>
                    {startError.details && (
                      <Text style={[styles.errorMsg, startError.reason === 'too_late' && styles.errorMsgLate]}>
                        {startError.details}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.ctaBtn,
                  (startMutation.isPending || !pin.trim() || countdown !== null) && { opacity: 0.5 },
                  pressed && countdown === null && { opacity: 0.8 }
                ]}
                onPress={handleStart}
                disabled={startMutation.isPending || !pin.trim() || countdown !== null}
              >
                <LinearGradient colors={[C.sky, C.skyDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                  {startMutation.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="play-circle" size={22} color="#fff" />
                        <Text style={styles.ctaTxt}>
                          {countdown && countdown > 0 ? `فتح بعد ${countdown}م` : 'بدء الحصة'}
                        </Text>
                      </>
                  }
                </LinearGradient>
              </Pressable>
            </>
          ) : null}

          {/* إلغاء السحب */}
          {canRelease && (
            <Pressable
              style={({ pressed }) => [
                styles.releaseBtn,
                pressed && { opacity: 0.7 },
                releaseMutation.isPending && { opacity: 0.5 },
              ]}
              onPress={handleRelease}
              disabled={releaseMutation.isPending}
            >
              {releaseMutation.isPending
                ? <ActivityIndicator color={C.error} />
                : <>
                    <Ionicons name="arrow-undo-outline" size={18} color={C.error} />
                    <Text style={styles.releaseTxt}>إلغاء السحب</Text>
                  </>
              }
            </Pressable>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF' },

  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 18, paddingBottom: 20, gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  headerTitle:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerBadge:    { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  headerBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  scroll:       { padding: 16 },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: C.grayMid, textAlign: 'right', marginBottom: 8, marginRight: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 14, ...shadow.sm },

  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 11, color: C.grayMid, fontWeight: '600', textAlign: 'right' },
  infoValue: { fontSize: 15, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginTop: 1 },

  nearpodHint:    { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 20 },
  nearpodBtn:     { borderRadius: 14, overflow: 'hidden' },
  nearpodBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  nearpodBtnTxt:  { fontSize: 15, fontWeight: '800', color: '#fff' },

  pinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0F9FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1.5, borderColor: C.skyLight,
  },
  pinInput:   { flex: 1, fontSize: 16, fontWeight: '700', color: C.skyDark, paddingVertical: 10 },
  pinSaveBtn: { backgroundColor: C.sky, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, minWidth: 52, alignItems: 'center' },
  pinSaveTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  ctaBtn:  { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  ctaTxt:  { color: '#fff', fontSize: 17, fontWeight: '900' },

  confirmBox: {
    backgroundColor: '#FFF7ED', borderRadius: 18, padding: 18, marginTop: 8,
    borderWidth: 1.5, borderColor: '#FED7AA',
  },
  confirmTitle:  { fontSize: 15, fontWeight: '900', color: '#92400E', textAlign: 'right', marginBottom: 8 },
  confirmMsg:    { fontSize: 13, color: '#78350F', textAlign: 'right', lineHeight: 22, marginBottom: 16 },
  confirmPin:    { fontSize: 18, fontWeight: '900', color: '#B45309', letterSpacing: 2 },
  confirmBtns:   { flexDirection: 'row', gap: 10 },
  confirmCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  confirmCancelTxt: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  confirmOk: {
    flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: C.sky,
  },
  confirmOkTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  releaseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.error + '66',
    backgroundColor: '#FFF5F5',
  },
  releaseTxt: { fontSize: 15, fontWeight: '700', color: C.error },

  countdownBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#FCD34D',
  },
  countdownTitle: { fontSize: 14, fontWeight: '900', color: '#92400E' },
  countdownMsg: { fontSize: 12, color: '#B45309', marginTop: 2 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#FCD34D',
  },
  errorBoxLate: {
    backgroundColor: '#FEE2E2', borderColor: '#FECACA',
  },
  errorTitle: { fontSize: 14, fontWeight: '900', color: '#92400E' },
  errorTitleLate: { color: '#991B1B' },
  errorMsg: { fontSize: 12, color: '#B45309', marginTop: 2 },
  errorMsgLate: { color: '#7F1D1D' },
});

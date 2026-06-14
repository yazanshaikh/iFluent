/**
 * Session Profile — Session Profile
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
import { fmtManila } from '@/lib/time';
import DemoEvaluationModal from '@/components/DemoEvaluationModal';
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
  return new Date(iso).toLocaleString('en-US', {
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
  const [evalVisible, setEvalVisible] = useState(false);

  const { data: session, isLoading } = useQuery<TeacherSession>({
    queryKey: ['session', sessionId],
    queryFn:  () => sessionsApi.get(sessionId),
    staleTime: 15_000,
  });

  // Countdown timer — update every second
  // Window: (scheduled_at - 15 min) to (scheduled_at + 15 min)
  useEffect(() => {
    if (!session?.scheduled_at) return;
    const scheduledAt = session.scheduled_at; // narrowed to string for the closure

    const updateCountdown = () => {
      const now = Date.now();
      const scheduled = new Date(scheduledAt).getTime();
      const fifteenMinBefore = scheduled - 15 * 60 * 1000;
      const fifteenMinAfter = scheduled + 15 * 60 * 1000;

      // more than 15 min before the scheduled time
      if (now < fifteenMinBefore) {
        const minsUntil = Math.ceil((fifteenMinBefore - now) / 60000);
        setCountdown(minsUntil);
      }
      // inside the window (-15 min to +15 min)
      else if (now >= fifteenMinBefore && now <= fifteenMinAfter) {
        setCountdown(null); // can activate
      }
      // more than 15 min after the scheduled time
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
    onError:   (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Could not save PIN'),
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
      Alert.alert('Could not release', e?.response?.data?.message ?? 'An error occurred'),
  });

  const handleRelease = () => releaseMutation.mutate();

  // End the meeting & close the session
  const endMutation = useMutation({
    mutationFn: () => sessionsApi.end(sessionId),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      if (session?.lesson?.is_assessment && !session?.evaluation_submitted_at) {
        setEvalVisible(true); // assessment → collect evaluation before leaving
      } else {
        router.replace('/(tabs)/sessions');
      }
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? 'Could not end the session';
      if (Platform.OS === 'web') (window as any).alert(msg);
      else Alert.alert('Error', msg);
    },
  });

  const handleEnd = () => {
    const doEnd = () => endMutation.mutate();
    // Alert.alert is a no-op on web — use window.confirm there.
    if (Platform.OS === 'web') {
      if ((window as any).confirm('Do you want to end the meeting and close the session now?')) doEnd();
    } else {
      Alert.alert('End Session', 'Do you want to end the meeting and close the session now?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: doEnd },
      ]);
    }
  };

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
        Alert.alert('Error', errData?.message ?? 'Could not start the session');
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
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Nearpod'));
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
  const lessonNum  = lesson?.order != null ? `Lesson ${lesson.order}` : '';
  const isActive      = session.status === 'active';
  const canStart      = session.status === 'waiting' || session.status === 'confirmed';
  const needsEval     = session.status === 'completed'
    && session.lesson?.is_assessment
    && !session.evaluation_submitted_at;

  // Release: only allowed in waiting status, 30+ min before the time
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
            <Text style={styles.headerTitle}>Session Profile</Text>
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
            <Text style={styles.sectionTitle}>Session Info</Text>
            <View style={styles.card}>
              <InfoRow icon="book-outline"   label="Session Name" value={lesson?.title ?? '—'} />
              <InfoRow
                icon="calendar-outline"
                label="Time"
                value={`${fmt(session.scheduled_at)}${session.scheduled_at ? `\n🇵🇭 ${fmtManila(session.scheduled_at)} (Manila)` : ''}`}
              />
              {level && (
                <InfoRow
                  icon="layers-outline"
                  label="Level"
                  value={`${level.code} — ${level.name}`}
                />
              )}
              {lesson?.order != null && (
                <InfoRow icon="list-outline" label="Lesson No." value={`${lesson.order}`} />
              )}
            </View>
          </View>

          {/* ── Student card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Student Info</Text>
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Name" value={student?.name ?? '—'} />
              {student?.age != null && (
                <InfoRow icon="calendar-outline" label="Age" value={`${student.age} yrs`} />
              )}
            </View>
          </View>

          {/* ── Nearpod ── */}
          {(canStart || isActive) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearpod</Text>
              <View style={styles.card}>
                <Text style={styles.nearpodHint}>
                  Open Nearpod to create the session and get the PIN, then enter it here and start the session.
                </Text>

                {/* Open Nearpod */}
                <Pressable style={({ pressed }) => [styles.nearpodBtn, pressed && { opacity: 0.8 }]} onPress={openNearpod}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.nearpodBtnGrad}
                  >
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={styles.nearpodBtnTxt}>Open in Nearpod</Text>
                  </LinearGradient>
                </Pressable>

                {/* PIN input */}
                <View style={styles.pinRow}>
                  <Ionicons name="keypad-outline" size={18} color={C.grayMid} />
                  <TextInput
                    style={styles.pinInput}
                    placeholder="Enter the PIN from Nearpod"
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
                      : <Text style={styles.pinSaveTxt}>Save</Text>
                    }
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ── Inline PIN Confirm ── */}
          {confirming && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Confirm PIN</Text>
              <Text style={styles.confirmMsg}>
                You entered the code:{'\n'}
                <Text style={styles.confirmPin}>{pin.trim()}</Text>
                {'\n\n'}Are you sure this is the code for this session?
              </Text>
              <View style={styles.confirmBtns}>
                <Pressable
                  style={styles.confirmCancel}
                  onPress={() => setConfirming(false)}
                >
                  <Text style={styles.confirmCancelTxt}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmOk, startMutation.isPending && { opacity: 0.6 }]}
                  onPress={() => { setConfirming(false); startMutation.mutate(pin.trim()); }}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.confirmOkTxt}>Yes, start</Text>
                  }
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Pending evaluation (assessment session completed) ── */}
          {needsEval && (
            <View style={styles.evalBanner}>
              <Ionicons name="clipboard-outline" size={22} color="#0369a1" />
              <View style={{ flex: 1 }}>
                <Text style={styles.evalBannerTitle}>Evaluation Required</Text>
                <Text style={styles.evalBannerTxt}>
                  Please fill in the assessment session report so it is saved to the student's notes in the CRM.
                </Text>
              </View>
            </View>
          )}

          {needsEval && (
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setEvalVisible(true)}
            >
              <LinearGradient colors={['#0369a1', '#0284c7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                <Ionicons name="create-outline" size={22} color="#fff" />
                <Text style={styles.ctaTxt}>Fill Session Evaluation</Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* ── CTA ── */}
          {isActive ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push({ pathname: '/classroom/[id]', params: { id: String(sessionId) } })}
              >
                <LinearGradient colors={['#16a34a', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                  <Ionicons name="videocam" size={22} color="#fff" />
                  <Text style={styles.ctaTxt}>Back to Virtual Classroom</Text>
                </LinearGradient>
              </Pressable>

              {/* End meeting & close session */}
              <Pressable
                style={({ pressed }) => [
                  styles.endBtn,
                  pressed && { opacity: 0.85 },
                  endMutation.isPending && { opacity: 0.6 },
                ]}
                onPress={handleEnd}
                disabled={endMutation.isPending}
              >
                {endMutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="stop-circle" size={22} color="#fff" />
                      <Text style={styles.endTxt}>End Session</Text>
                    </>
                }
              </Pressable>
            </>
          ) : canStart ? (
            <>
              {/* ⏱️ Countdown warning if too early */}
              {countdown && countdown > 0 && (
                <View style={styles.countdownBox}>
                  <Ionicons name="time-outline" size={20} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countdownTitle}>Opens in {countdown} min</Text>
                    <Text style={styles.countdownMsg}>
                      You can activate the session only 15 minutes before its time
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
                      Session activation time has passed
                    </Text>
                    <Text style={[styles.errorMsg, styles.errorMsgLate]}>
                      The session can be activated up to 15 minutes after its time
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
                          {countdown && countdown > 0 ? `Opens in ${countdown}m` : 'Start Session'}
                        </Text>
                      </>
                  }
                </LinearGradient>
              </Pressable>
            </>
          ) : null}

          {/* Release */}
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
                    <Text style={styles.releaseTxt}>Release</Text>
                  </>
              }
            </Pressable>
          )}

        </ScrollView>
      </View>

      <DemoEvaluationModal
        visible={evalVisible}
        sessionId={sessionId}
        studentName={session.student?.name}
        onSuccess={() => {
          setEvalVisible(false);
          qc.invalidateQueries({ queryKey: ['session', sessionId] });
          qc.invalidateQueries({ queryKey: ['sessions'] });
        }}
      />
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

  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 12, paddingVertical: 16, borderRadius: 18,
    backgroundColor: C.error,
  },
  endTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },

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

  evalBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#E0F2FE', borderRadius: 16, padding: 14,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#BAE6FD',
  },
  evalBannerTitle: { fontSize: 14, fontWeight: '900', color: '#0369a1', textAlign: 'right' },
  evalBannerTxt:   { fontSize: 12, color: '#0284c7', textAlign: 'right', marginTop: 4, lineHeight: 18 },
});

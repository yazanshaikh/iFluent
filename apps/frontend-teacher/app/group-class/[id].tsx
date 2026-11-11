/**
 * Group Class Profile — same flow and rules as the individual Session Profile:
 * open the lesson in Nearpod, enter the PIN, start within 15 minutes of the
 * time. The difference: the registered students (count and names) are listed.
 */
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupClassesApi } from '@/api/groupClasses';
import type { SessionStartError } from '@/api/sessions';
import { fmtManila } from '@/lib/time';
import { C, shadow } from '@/theme';
import { appAlert } from '@/lib/alert';

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

export default function GroupClassProfileScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const classId = Number(id);
  const [pin, setPin]               = useState('');
  const [confirming, setConfirming] = useState(false);
  const [startError, setStartError] = useState<SessionStartError | null>(null);
  const [countdown, setCountdown]   = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-group-class', classId],
    queryFn:  () => groupClassesApi.get(classId),
    refetchInterval: 15_000,
  });
  const item     = data?.class;
  const students = data?.registered ?? [];

  // Activation window: 15 minutes before to 15 minutes after the class time
  useEffect(() => {
    if (!item?.scheduled_at) return;
    const scheduled = new Date(item.scheduled_at).getTime();
    const update = () => {
      const now = Date.now();
      if (now < scheduled - 15 * 60_000) setCountdown(Math.ceil((scheduled - 15 * 60_000 - now) / 60_000));
      else if (now <= scheduled + 15 * 60_000) setCountdown(null);
      else setCountdown(-1);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [item?.scheduled_at]);

  useEffect(() => {
    if (item?.nearpod_pin && !pin) setPin(item.nearpod_pin);
  }, [item?.nearpod_pin]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['teacher-group-class', classId] });
    qc.invalidateQueries({ queryKey: ['teacher-group-classes'] });
  };

  const pinMutation = useMutation({
    mutationFn: (p: string) => groupClassesApi.setNearpodPin(classId, p),
    onSuccess:  refresh,
    onError:    (e: any) => appAlert('Error', e?.response?.data?.message ?? 'Could not save PIN'),
  });

  const startMutation = useMutation({
    mutationFn: (nearpodPin: string) => groupClassesApi.start(classId, nearpodPin),
    onSuccess:  (result) => {
      setStartError(null);
      refresh();
      router.push({ pathname: '/group-classroom/[id]', params: { id: String(classId), roomUrl: result.daily_room_url } });
    },
    onError: (e: any) => {
      const err = e?.response?.data;
      if (err?.reason === 'too_early' || err?.reason === 'too_late') {
        setStartError(err);
        setConfirming(false);
      } else {
        appAlert('Error', err?.message ?? 'Could not start the class');
      }
    },
  });

  const endMutation = useMutation({
    mutationFn: () => groupClassesApi.end(classId),
    onSuccess:  () => { refresh(); router.replace('/(tabs)/group-classes'); },
    onError:    (e: any) => appAlert('Error', e?.response?.data?.message ?? 'Could not end the class'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => groupClassesApi.cancel(classId),
    onSuccess:  refresh,
    onError:    (e: any) => appAlert('Error', e?.response?.data?.message ?? 'Could not cancel the class'),
  });

  const handleEnd = () =>
    appAlert('End Class', 'Do you want to end the meeting and close the class for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => endMutation.mutate() },
    ]);

  const handleCancel = () =>
    appAlert('Cancel Class', 'Registered students will get their credit back.', [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel class', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);

  if (isLoading || !item) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={C.sky} size="large" />
      </View>
    );
  }

  const lesson    = item.lesson;
  const level     = lesson?.level ?? null;
  const lessonNum = lesson?.order != null ? `Lesson ${lesson.order}` : '';
  const isActive  = item.status === 'active';
  const canStart  = item.status === 'scheduled';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>

        <LinearGradient colors={[C.sky, C.skyDark]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/group-classes'))}
          >
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.headerTitle}>Group Class Profile</Text>
            {(level || lessonNum) && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeTxt}>
                  {[level?.code, lessonNum].filter(Boolean).join('  ·  ')}
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Info</Text>
            <View style={styles.card}>
              <InfoRow icon="book-outline" label="Session Name" value={lesson?.title ?? item.title} />
              <InfoRow
                icon="calendar-outline"
                label="Time"
                value={`${fmt(item.scheduled_at)}\n🇵🇭 ${fmtManila(item.scheduled_at)} (Manila)`}
              />
              {level && <InfoRow icon="layers-outline" label="Level" value={`${level.code} — ${level.name}`} />}
              {lesson?.order != null && <InfoRow icon="list-outline" label="Lesson No." value={`${lesson.order}`} />}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Students ({item.registered_count} / {item.max_seats})</Text>
            <View style={styles.card}>
              {students.length === 0 && <Text style={styles.emptyTxt}>No students registered yet.</Text>}
              {students.map((student) => (
                <View key={student.student_id} style={styles.studentRow}>
                  {student.joined && <Text style={styles.joinedTag}>Joined</Text>}
                  <Text style={styles.studentName}>{student.name ?? '—'}</Text>
                  <Ionicons name="person-outline" size={16} color={C.sky} />
                </View>
              ))}
            </View>
          </View>

          {(canStart || isActive) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearpod</Text>
              <View style={styles.card}>
                <Text style={styles.nearpodHint}>
                  Browse the lessons, open the one you're teaching in Nearpod, launch it to get the PIN, then enter it here and start the class.
                </Text>
                <Pressable style={({ pressed }) => [styles.nearpodBtn, pressed && { opacity: 0.8 }]} onPress={() => router.push('/lessons')}>
                  <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nearpodBtnGrad}>
                    <Ionicons name="library-outline" size={18} color="#fff" />
                    <Text style={styles.nearpodBtnTxt}>Browse Lessons</Text>
                  </LinearGradient>
                </Pressable>
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
                      : <Text style={styles.pinSaveTxt}>Save</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {confirming && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Confirm PIN</Text>
              <Text style={styles.confirmMsg}>
                You entered the code:{'\n'}
                <Text style={styles.confirmPin}>{pin.trim()}</Text>
                {'\n\n'}Are you sure this is the code for this class?
              </Text>
              <View style={styles.confirmBtns}>
                <Pressable style={styles.confirmCancel} onPress={() => setConfirming(false)}>
                  <Text style={styles.confirmCancelTxt}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmOk, startMutation.isPending && { opacity: 0.6 }]}
                  onPress={() => { setConfirming(false); startMutation.mutate(pin.trim()); }}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.confirmOkTxt}>Yes, start</Text>}
                </Pressable>
              </View>
            </View>
          )}

          {isActive ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push({ pathname: '/group-classroom/[id]', params: { id: String(classId) } })}
              >
                <LinearGradient colors={['#16a34a', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                  <Ionicons name="videocam" size={22} color="#fff" />
                  <Text style={styles.ctaTxt}>Back to Virtual Classroom</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.85 }, endMutation.isPending && { opacity: 0.6 }]}
                onPress={handleEnd}
                disabled={endMutation.isPending}
              >
                {endMutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="stop-circle" size={22} color="#fff" />
                      <Text style={styles.endTxt}>End Class</Text>
                    </>}
              </Pressable>
            </>
          ) : canStart ? (
            <>
              {countdown !== null && countdown > 0 && (
                <View style={styles.countdownBox}>
                  <Ionicons name="time-outline" size={20} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countdownTitle}>Opens in {countdown} min</Text>
                    <Text style={styles.countdownMsg}>You can activate the class only 15 minutes before its time</Text>
                  </View>
                </View>
              )}

              {countdown === -1 && (
                <View style={[styles.errorBox, styles.errorBoxLate]}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.errorTitle, styles.errorTitleLate]}>Class activation time has passed</Text>
                    <Text style={[styles.errorMsg, styles.errorMsgLate]}>The class can be activated up to 15 minutes after its time</Text>
                  </View>
                </View>
              )}

              {startError && (
                <View style={[styles.errorBox, startError.reason === 'too_late' && styles.errorBoxLate]}>
                  <Ionicons
                    name={startError.reason === 'too_early' ? 'time-outline' : 'alert-circle'}
                    size={18}
                    color={startError.reason === 'too_late' ? '#DC2626' : '#D97706'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.errorTitle, startError.reason === 'too_late' && styles.errorTitleLate]}>{startError.message}</Text>
                    {startError.details && (
                      <Text style={[styles.errorMsg, startError.reason === 'too_late' && styles.errorMsgLate]}>{startError.details}</Text>
                    )}
                  </View>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.ctaBtn,
                  (startMutation.isPending || !pin.trim() || countdown !== null) && { opacity: 0.5 },
                  pressed && countdown === null && { opacity: 0.8 },
                ]}
                onPress={() => pin.trim() && setConfirming(true)}
                disabled={startMutation.isPending || !pin.trim() || countdown !== null}
              >
                <LinearGradient colors={[C.sky, C.skyDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                  {startMutation.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="play-circle" size={22} color="#fff" />
                        <Text style={styles.ctaTxt}>
                          {countdown && countdown > 0 ? `Opens in ${countdown}m` : 'Start Class'}
                        </Text>
                      </>}
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.releaseBtn, pressed && { opacity: 0.7 }, cancelMutation.isPending && { opacity: 0.5 }]}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? <ActivityIndicator color={C.error} />
                  : <>
                      <Ionicons name="close-circle-outline" size={18} color={C.error} />
                      <Text style={styles.releaseTxt}>Cancel Class</Text>
                    </>}
              </Pressable>
            </>
          ) : (
            <Text style={[styles.emptyTxt, { textAlign: 'center', marginTop: 8 }]}>
              {item.status === 'cancelled' ? 'This class was cancelled.' : 'This class has ended.'}
            </Text>
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

  studentRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  studentName: { fontSize: 14, fontWeight: '700', color: C.skyDark, textAlign: 'right', flex: 1 },
  joinedTag:   { fontSize: 11, fontWeight: '800', color: C.success },
  emptyTxt:    { fontSize: 13, color: C.grayMid, textAlign: 'right' },
});

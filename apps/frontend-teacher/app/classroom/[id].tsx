/**
 * Virtual Classroom — الفصل الافتراضي
 *
 * Layout (split-screen):
 *   ┌─────────────────────────────┐
 *   │  Daily.co WebView      55%  │ ← video/audio
 *   ├─────────────────────────────┤
 *   │  Nearpod WebView       45%  │ ← lesson content
 *   └─────────────────────────────┘
 *
 * Controls overlay (top):
 *   ← Back | PIN badge | End Session
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
  StatusBar, BackHandler, TextInput, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { sessionsApi } from '@/api/sessions';
import { C } from '@/theme';

// Attendance options when ending a session
type Attendance = 'attended' | 'absent' | 'teacher_absent';

const ATTENDANCE_OPTIONS: { key: Attendance; label: string; emoji: string; color: string }[] = [
  { key: 'attended',       label: 'حضر الطالب',    emoji: '✅', color: C.success },
  { key: 'absent',         label: 'غاب الطالب',    emoji: '😔', color: C.warning },
  { key: 'teacher_absent', label: 'غاب المعلم',    emoji: '🙋', color: C.error },
];

export default function ClassroomScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);

  const [divider,     setDivider]     = useState(0.55);
  const [pinVisible,  setPinVisible]  = useState(false);
  const [pinInput,    setPinInput]    = useState('');
  const [endModal,    setEndModal]    = useState(false);
  const [attendance,  setAttendance]  = useState<Attendance>('attended');

  // Fetch session data
  const { data: session, isLoading } = useQuery({
    queryKey:       ['session', sessionId],
    queryFn:        () => sessionsApi.get(sessionId),
    refetchInterval: 30_000,
    staleTime:       15_000,
  });

  // Update Nearpod PIN
  const pinMutation = useMutation({
    mutationFn: (pin: string) => sessionsApi.setNearpodPin(sessionId, pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      setPinVisible(false);
      setPinInput('');
    },
    onError: (e: any) => Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر تحديث الـ PIN'),
  });

  // End session
  const endMutation = useMutation({
    mutationFn: () => sessionsApi.end(sessionId, attendance),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      setEndModal(false);
      router.replace('/(tabs)/sessions');
    },
    onError: (e: any) => Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر إنهاء الحصة'),
  });

  // Android back-button guard
  const handleLeave = useCallback(() => {
    Alert.alert(
      'مغادرة الفصل',
      'الحصة لا تزال نشطة. هل تريد مغادرة الفصل؟ يمكنك العودة في أي وقت.',
      [
        { text: 'ابقَ', style: 'cancel' },
        { text: 'مغادرة', style: 'destructive', onPress: () => router.back() },
      ],
    );
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleLeave);
    return () => sub.remove();
  }, [handleLeave]);

  if (isLoading || !session) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.sky} />
        <Text style={styles.loadingTxt}>جاري تحميل الفصل…</Text>
      </View>
    );
  }

  if (!session.daily_room_url) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={52} color={C.error} />
        <Text style={styles.loadingTxt}>رابط الغرفة غير متاح</Text>
        <TouchableOpacity style={styles.backBtnPlain} onPress={() => router.back()}>
          <Text style={{ color: C.sky, fontWeight: '700' }}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pin = session.nearpod_pin;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Top Control Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        {/* Back */}
        <TouchableOpacity style={styles.topBtn} onPress={handleLeave}>
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Session info */}
        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {session.lesson?.title ?? 'الفصل الافتراضي'}
          </Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.topRight}>
          {/* PIN button */}
          <TouchableOpacity
            style={[styles.topBtn, pin && styles.topBtnActive]}
            onPress={() => setPinVisible(true)}
          >
            <Ionicons name="key-outline" size={18} color="#fff" />
            {pin && <Text style={styles.pinDot}>{pin}</Text>}
          </TouchableOpacity>

          {/* End session */}
          <TouchableOpacity
            style={[styles.topBtn, { backgroundColor: C.error + '33' }]}
            onPress={() => setEndModal(true)}
          >
            <Ionicons name="stop-circle-outline" size={18} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Split Screen ── */}
      {/* Section A: Daily.co */}
      <View style={[styles.videoPane, { flex: divider }]}>
        <WebView
          source={{ uri: session.daily_room_url }}
          style={StyleSheet.absoluteFillObject}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          mediaCapturePermissionGrantType="grant"
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFillObject, styles.webLoading]}>
              <ActivityIndicator color={C.sky} />
            </View>
          )}
        />
        {/* Divider handle */}
        <TouchableOpacity
          style={styles.dividerHandle}
          onPress={() => setDivider((d) => (d > 0.5 ? 0.4 : 0.65))}
          activeOpacity={0.9}
        >
          <View style={styles.dividerBar} />
        </TouchableOpacity>
      </View>

      {/* Section B: Nearpod */}
      <View style={[styles.nearpodPane, { flex: 1 - divider }]}>
        {session.lesson?.nearpod_url ? (
          <WebView
            source={{ uri: session.lesson.nearpod_url }}
            style={StyleSheet.absoluteFillObject}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            startInLoadingState
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFillObject, styles.webLoading, { backgroundColor: '#faf5ff' }]}>
                <ActivityIndicator color="#8b5cf6" />
                <Text style={{ color: '#8b5cf6', marginTop: 10, fontSize: 13 }}>جاري تحميل الدرس…</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.noNearpod}>
            <Ionicons name="easel-outline" size={36} color="#d1d5db" />
            <Text style={styles.noNearpodTxt}>لا يوجد رابط Nearpod لهذا الدرس</Text>
          </View>
        )}

        {/* PIN overlay */}
        {pin && (
          <View style={styles.pinOverlay}>
            <Text style={styles.pinOverlayLabel}>PIN</Text>
            <Text style={styles.pinOverlayCode}>{pin}</Text>
          </View>
        )}
      </View>

      {/* ── PIN Modal ── */}
      <Modal visible={pinVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔑 أدخل Nearpod PIN</Text>
            <Text style={styles.modalSub}>الـ PIN يُمكّن الطلاب من الانضمام للدرس التفاعلي</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={(v) => setPinInput(v.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              maxLength={10}
              textAlign="center"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setPinVisible(false); setPinInput(''); }}>
                <Text style={styles.modalCancelTxt}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!pinInput.trim() || pinMutation.isPending) && { opacity: 0.5 }]}
                disabled={!pinInput.trim() || pinMutation.isPending}
                onPress={() => pinMutation.mutate(pinInput.trim())}
              >
                {pinMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmTxt}>حفظ</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── End Session Modal ── */}
      <Modal visible={endModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إنهاء الحصة</Text>
            <Text style={styles.modalSub}>حدد حالة الحضور قبل الإنهاء</Text>

            <View style={styles.attendanceOptions}>
              {ATTENDANCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.attendanceOpt,
                    attendance === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '15' },
                  ]}
                  onPress={() => setAttendance(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.attendanceEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.attendanceLabel, attendance === opt.key && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEndModal(false)}>
                <Text style={styles.modalCancelTxt}>تراجع</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalEnd, endMutation.isPending && { opacity: 0.5 }]}
                disabled={endMutation.isPending}
                onPress={() => endMutation.mutate()}
              >
                {endMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalEndTxt}>إنهاء الحصة</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', gap: 14 },
  loadingTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backBtnPlain: { marginTop: 8, padding: 10 },

  // ── Top Bar ──────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: '#111827',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10, gap: 8,
  },
  topBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  topBtnActive: { backgroundColor: C.sky + '44' },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  liveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  liveTxt:   { color: C.success, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  topRight:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  pinDot:    { position: 'absolute', top: -2, right: -2, backgroundColor: C.sky, borderRadius: 6, paddingHorizontal: 3, fontSize: 7, color: '#fff', fontWeight: '800' },

  // ── Split Screen ──────────────────────────────────────────────────────────
  videoPane:   { position: 'relative', backgroundColor: '#000' },
  nearpodPane: { position: 'relative', backgroundColor: '#faf5ff' },
  webLoading:  { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },

  dividerHandle: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  dividerBar: { width: 48, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },

  noNearpod:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  noNearpodTxt: { color: '#9ca3af', fontSize: 13, textAlign: 'center' },

  pinOverlay: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  pinOverlayLabel: { color: '#e9d5ff', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  pinOverlayCode:  { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 3 },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'right' },
  modalSub:   { fontSize: 13, color: '#6b7280', textAlign: 'right' },
  pinInput: {
    borderWidth: 2, borderColor: C.border, borderRadius: 16,
    padding: 14, fontSize: 28, fontWeight: '900', color: '#111',
    backgroundColor: C.inputBg, letterSpacing: 8, marginTop: 4,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  modalCancelTxt:  { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  modalConfirm: {
    flex: 2, padding: 14, borderRadius: 14,
    backgroundColor: C.sky, alignItems: 'center',
  },
  modalConfirmTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  attendanceOptions: { gap: 10, marginTop: 4 },
  attendanceOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 2, borderColor: '#e5e7eb',
  },
  attendanceEmoji: { fontSize: 22 },
  attendanceLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  modalEnd: {
    flex: 2, padding: 14, borderRadius: 14,
    backgroundColor: C.error, alignItems: 'center',
  },
  modalEndTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

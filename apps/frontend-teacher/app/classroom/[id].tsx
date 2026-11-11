/**
 * Virtual Classroom — Teacher
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │  Daily.co  (fixed top)      │  ← resizable via drag handle
 *   │  [═══════ drag ═══════]     │
 *   │─────────────────────────────│
 *   │                             │
 *   │       Nearpod               │  ← fills remaining, teacher controls slides
 *   │                             │
 *   └─────────────────────────────┘
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar,
  BackHandler, TextInput, Modal,
  Platform,
} from 'react-native';
import { WebViewUniversal } from '@/components/WebViewUniversal';
import { DailyCallPanel } from '@/components/DailyCallPanel';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lockCurrent, unlock as unlockOrientation } from '@/lib/screenOrientation';
import { sessionsApi } from '@/api/sessions';
import DemoEvaluationModal from '@/components/DemoEvaluationModal';
import { C } from '@/theme';
import { appAlert } from '@/lib/alert';



export default function ClassroomScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const qc         = useQueryClient();
  const { id, roomUrl: paramRoomUrl } = useLocalSearchParams<{ id: string; roomUrl?: string }>();
  const sessionId  = Number(id);

  const [pinVisible,        setPinVisible]        = useState(false);
  const [pinInput,          setPinInput]          = useState('');
  const [signedRoomUrl,     setSignedRoomUrl]     = useState<string | null>(paramRoomUrl ?? null);
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [handNotif,         setHandNotif]         = useState<{ name: string; at: string } | null>(null);
  const [evalVisible,       setEvalVisible]       = useState(false);
  const handNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  // ── Fetch session ──────────────────────────────────────────────────────────
  const { data: session, isLoading } = useQuery({
    queryKey:        ['session', sessionId],
    queryFn:         () => sessionsApi.get(sessionId),
    // Poll every 30s normally, every 10s when active (catch auto-expiry)
    refetchInterval: (q) => q.state.data?.status === 'active' ? 10_000 : 30_000,
    staleTime:       5_000,
  });

  // ── Auto-navigate when session ends externally (auto-expiry) ──────────────
  const prevSessionStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const curr = session?.status;
    const prev = prevSessionStatus.current;
    if (prev === 'active' && curr === 'completed') {
      // Session was closed externally (auto-expiry or from another tab)
      qc.invalidateQueries({ queryKey: ['sessions'] });
      router.replace('/(tabs)/sessions');
    }
    prevSessionStatus.current = curr;
  }, [session?.status, router, qc]);

  // ── Update PIN ─────────────────────────────────────────────────────────────
  const pinMutation = useMutation({
    mutationFn: (pin: string) => sessionsApi.setNearpodPin(sessionId, pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      setPinVisible(false);
      setPinInput('');
    },
    onError: (e: any) => appAlert('Error', e?.response?.data?.message ?? 'Could not update the PIN'),
  });

  // ── Fetch signed URL ───────────────────────────────────────────────────────
  useEffect(() => {
    if (signedRoomUrl || session?.status !== 'active') return;
    sessionsApi.classroomUrl(sessionId)
      .then((d) => setSignedRoomUrl(d.daily_room_url))
      .catch(() => {});
  }, [sessionId, session?.status, signedRoomUrl]);

  // ── Poll raised hands every 5s ─────────────────────────────────────────────
  useEffect(() => {
    if (session?.status !== 'active') return;

    const poll = async () => {
      try {
        const res = await sessionsApi.getRaisedHands(sessionId);
        if (res.raised && res.data) {
          // Only show if it's a new raise (within last 60s)
          setHandNotif({ name: res.data.student_name, at: res.data.raised_at });
          // Auto-dismiss after 10s
          if (handNotifTimer.current) clearTimeout(handNotifTimer.current);
          handNotifTimer.current = setTimeout(() => setHandNotif(null), 10_000);
        }
      } catch { /* ignore */ }
    };

    poll();
    const interval = setInterval(poll, 5_000);
    return () => {
      clearInterval(interval);
      if (handNotifTimer.current) clearTimeout(handNotifTimer.current);
    };
  }, [session?.status, sessionId]);

  // ── End session — attendance determined automatically by server ───────────
  const navigateAfterSession = useCallback(async () => {
    if (orientationLocked) await unlockOrientation().catch(() => {});
    router.replace('/(tabs)/sessions');
  }, [orientationLocked, router]);

  const endMutation = useMutation({
    mutationFn: () => sessionsApi.end(sessionId),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      const isAssessment = session?.lesson?.is_assessment;
      if (isAssessment && !session?.evaluation_submitted_at) {
        setEvalVisible(true);
      } else {
        await navigateAfterSession();
      }
    },
    onError: (e: any) => appAlert('Error', e?.response?.data?.message ?? 'Could not end the session'),
  });

  // ── Orientation lock (Web: Screen Orientation API / Mobile: stub) ─────────
  const toggleOrientationLock = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        if (orientationLocked) {
          // @ts-ignore
          await document.exitFullscreen?.();
          // @ts-ignore
          await screen.orientation?.unlock?.();
          setOrientationLocked(false);
        } else {
          // Enter fullscreen first (required by screen.orientation.lock)
          // @ts-ignore
          await document.documentElement?.requestFullscreen?.();
          // @ts-ignore
          await screen.orientation?.lock?.('landscape');
          setOrientationLocked(true);
        }
      } catch {
        // Browser may deny — just toggle state visually
        setOrientationLocked((v) => !v);
      }
    } else {
      if (orientationLocked) {
        await unlockOrientation();
        setOrientationLocked(false);
      } else {
        await lockCurrent();
        setOrientationLocked(true);
      }
    }
  }, [orientationLocked]);

  useEffect(() => () => { unlockOrientation().catch(() => {}); }, []);

  // ── Back guard ─────────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    const doLeave = async () => {
      if (orientationLocked) await unlockOrientation().catch(() => {});
      router.back();
    };
    if (Platform.OS === 'web') {
      if ((window as any).confirm('The session is still active. Leave the classroom?')) doLeave();
    } else {
      appAlert('Leave Classroom', 'The session is still active. Leave the classroom?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: doLeave },
      ]);
    }
    return true;
  }, [router, orientationLocked]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleLeave);
    return () => sub.remove();
  }, [handleLeave]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading || !session) {
    return (
      <View style={S.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.sky} />
      </View>
    );
  }

  const dailyUrl = signedRoomUrl || paramRoomUrl || session.daily_room_url;
  const pin      = session.nearpod_pin;


  if (!dailyUrl) {
    return (
      <View style={S.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={52} color={C.error} />
        <Text style={{ color: '#fff', marginTop: 12 }}>Room link unavailable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, padding: 12 }}>
          <Text style={{ color: C.sky, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      {/* ── Raised Hand Notification ─────────────────────────────────────────── */}
      {handNotif && (
        <TouchableOpacity
          style={S.handNotif}
          onPress={() => setHandNotif(null)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 22 }}>✋</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.handNotifTxt}>{handNotif.name} raised their hand</Text>
            <Text style={S.handNotifSub}>Tap to dismiss</Text>
          </View>
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <View style={[S.topBar, { paddingTop: insets.top + 2 }]}>
        <TouchableOpacity style={S.topBtn} onPress={handleLeave}>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={S.topCenter}>
          <View style={S.titleRow}>
            <Text style={S.topTitle} numberOfLines={1}>
              {session.lesson?.title ?? 'Virtual Classroom'}
            </Text>
            <TouchableOpacity style={S.pinChip} onPress={() => setPinVisible(true)}>
              <Ionicons name="key-outline" size={12} color="#fff" />
              <Text style={S.pinChipTxt}>{pin ? pin.toUpperCase() : 'Set PIN'}</Text>
            </TouchableOpacity>
          </View>
          <View style={S.liveBadge}>
            <View style={S.liveDot} />
            <Text style={S.liveTxt}>LIVE</Text>
          </View>
        </View>

        <View style={S.topRight}>
          {/* Orientation lock */}
          <TouchableOpacity
            style={[S.topBtn, orientationLocked && S.topBtnOn]}
            onPress={toggleOrientationLock}
          >
            <Ionicons
              name={orientationLocked ? 'lock-closed-outline' : 'lock-open-outline'}
              size={17}
              color={orientationLocked ? '#FCD34D' : '#fff'}
            />
          </TouchableOpacity>

          {/* End */}
          <TouchableOpacity
            style={[S.topBtn, S.topBtnEnd, endMutation.isPending && { opacity: 0.5 }]}
            disabled={endMutation.isPending}
            onPress={() => {
              const doEnd = () => endMutation.mutate();
              if (Platform.OS === 'web') {
                // Alert doesn't work on web
                if ((window as any).confirm('End the session now?')) doEnd();
              } else {
                appAlert('End Session', 'End the session now?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'End', style: 'destructive', onPress: doEnd },
                ]);
              }
            }}
          >
            {endMutation.isPending
              ? <ActivityIndicator size="small" color={C.error} />
              : <Ionicons name="stop-circle-outline" size={17} color={C.error} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Video only — the teacher runs Nearpod in its own tab */}
      <View style={{ flex: 1 }}>
        {Platform.OS === 'web' ? (
          <WebViewUniversal
            key={`daily-teacher-${sessionId}`}
            uri={dailyUrl}
            style={StyleSheet.absoluteFillObject}
            loadingColor={C.sky}
            mediaCapturePermissionGrantType="grant"
          />
        ) : (
          <DailyCallPanel roomUrl={dailyUrl} />
        )}
      </View>

      {/* ── PIN Modal ───────────────────────────────────────────────────────── */}
      <Modal visible={pinVisible} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>🔑 Nearpod PIN</Text>
            <Text style={S.modalSub}>Open the lesson in Nearpod then enter the PIN to send it to the student</Text>
            <TextInput
              style={S.pinInput}
              value={pinInput}
              onChangeText={(v) => setPinInput(v.toUpperCase())}
              placeholder="XAFI3"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              maxLength={10}
              textAlign="center"
              autoFocus
            />
            <View style={S.modalActions}>
              <TouchableOpacity style={S.btnCancel} onPress={() => { setPinVisible(false); setPinInput(''); }}>
                <Text style={S.btnCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.btnConfirm, (!pinInput.trim() || pinMutation.isPending) && { opacity: 0.5 }]}
                disabled={!pinInput.trim() || pinMutation.isPending}
                onPress={() => pinMutation.mutate(pinInput.trim())}
              >
                {pinMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={S.btnConfirmTxt}>Save & send to student</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Demo evaluation — required after assessment sessions */}
      <DemoEvaluationModal
        visible={evalVisible}
        sessionId={sessionId}
        studentName={session.student?.name}
        onSuccess={async () => {
          setEvalVisible(false);
          qc.invalidateQueries({ queryKey: ['sessions'] });
          qc.invalidateQueries({ queryKey: ['session', sessionId] });
          await navigateAfterSession();
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', gap: 14 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12, paddingBottom: 8, gap: 8,
    zIndex: 10,
  },
  topBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  topBtnOn: {
    backgroundColor: 'rgba(252,211,77,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(252,211,77,0.5)',
  },
  topBtnPin:  { backgroundColor: C.sky + '33', borderWidth: 1, borderColor: C.sky + '66' },
  topBtnEnd:  { backgroundColor: C.error + '22', borderWidth: 1, borderColor: C.error + '44' },
  topCenter:  { flex: 1, alignItems: 'center' },
  topTitle:   { color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  pinChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pinChipTxt: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  topRight:   { flexDirection: 'row', gap: 7, alignItems: 'center' },
  liveBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  liveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  liveTxt:    { color: C.success, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  pinBubble:  {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: C.sky, borderRadius: 7,
    paddingHorizontal: 4, paddingVertical: 1, maxWidth: 64,
  },
  pinBubbleTxt: { fontSize: 7, color: '#fff', fontWeight: '800' },


  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, gap: 12,
  },
  modalTitle:   { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'right' },
  modalSub:     { fontSize: 13, color: '#6b7280', textAlign: 'right', lineHeight: 20 },
  pinInput: {
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 16,
    padding: 14, fontSize: 28, fontWeight: '900', color: '#111',
    backgroundColor: '#f9fafb', letterSpacing: 8, marginTop: 4,
  },
  modalActions:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: {
    flex: 1, padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  btnCancelTxt:   { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  btnConfirm:     { flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.sky, alignItems: 'center' },
  btnConfirmTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnEnd:         { flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.error, alignItems: 'center' },
  attendanceOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb',
  },

  // Raised hand notification
  handNotif: {
    position: 'absolute', top: 70, left: 12, right: 12,
    backgroundColor: '#ea580c',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
  handNotifTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  handNotifSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  // Nearpod open button

});

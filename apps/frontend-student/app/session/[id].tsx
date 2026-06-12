/**
 * Session Room — Student Classroom
 *
 * Responsive in-app split (SplitCallLayout):
 *   - Landscape/wide: Daily call on the RIGHT, Nearpod fills the left.
 *   - Portrait phone:  Daily call on TOP, Nearpod below.
 *   Divider is draggable either way.
 *
 * The video call uses @daily-co/react-native-daily-js (native WebRTC) — not a
 * WebView/browser — so camera & mic publish reliably and mute is toggleable.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, AppState,
  StatusBar, BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lockCurrent, unlock as unlockOrientation } from '@/lib/screenOrientation';
import { DailyCallPanel } from '@/components/DailyCallPanel';
import { SplitCallLayout } from '@/components/SplitCallLayout';
import { sessionsApi, type JoinSessionResponse } from '@/api/sessions';

const POLL_WAITING_MS = 5_000;

// ─── Waiting overlay ──────────────────────────────────────────────────────────
function WaitingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <View style={S.waitingOverlay}>
      <ActivityIndicator size="large" color="#10b981" style={{ marginBottom: 20 }} />
      <Text style={S.waitingTitle}>في انتظار المعلم…</Text>
      <Text style={S.waitingSub}>ستدخل الحصة تلقائياً عند بدئها</Text>
      <TouchableOpacity style={S.cancelBtn} onPress={onCancel}>
        <Text style={S.cancelTxt}>إلغاء</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Nearpod side ─────────────────────────────────────────────────────────────
function NearpodPanel({ sessionId, url, pin }: { sessionId: number; url: string | null; pin?: string | null }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {url ? (
        <WebView
          key={`nearpod-${sessionId}`}
          source={{ uri: url }}
          style={StyleSheet.absoluteFillObject}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={() => true}
          startInLoadingState
          renderLoading={() => (
            <View style={[S.webLoading, { backgroundColor: '#f5f3ff' }]}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={{ color: '#7c3aed', marginTop: 12 }}>جاري تحميل الدرس…</Text>
            </View>
          )}
        />
      ) : (
        <View style={S.noNearpod}>
          <Ionicons name="easel-outline" size={44} color="#d1d5db" />
          <Text style={S.noNearpodTxt}>انتظر المعلم لبدء الدرس</Text>
          {pin && (
            <>
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>PIN الدرس:</Text>
              <Text style={S.pinLarge}>{pin.toUpperCase()}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SessionRoomScreen() {
  const router    = useRouter();
  const qc        = useQueryClient();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);

  const [roomData,          setRoomData]          = useState<JoinSessionResponse | null>(null);
  const [joined,            setJoined]            = useState(false);
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [handRaised,        setHandRaised]        = useState(false);
  const [raisingHand,       setRaisingHand]       = useState(false);

  const appState = useRef(AppState.currentState);

  // ── Polling — stop once joined ─────────────────────────────────────────────
  const { data, error } = useQuery<JoinSessionResponse>({
    queryKey:             ['session-join', sessionId],
    queryFn:              () => sessionsApi.joinSession(sessionId),
    refetchInterval:      joined ? false : POLL_WAITING_MS,
    refetchOnWindowFocus: false,
    refetchOnMount:       !joined,
    retry: (count, err: any) => {
      const s = err?.response?.status;
      return s === 422 || s === 425 ? true : count < 3;
    },
    retryDelay: POLL_WAITING_MS,
  });

  // Set room data ONCE
  useEffect(() => {
    if (data?.daily_room_url && data?.nearpod_pin && !joined) {
      setRoomData(data);
      setJoined(true);
    }
  }, [data, joined]);

  // ── Orientation lock toggle ────────────────────────────────────────────────
  const toggleOrientationLock = useCallback(async () => {
    if (orientationLocked) {
      await unlockOrientation();
      setOrientationLocked(false);
    } else {
      await lockCurrent();
      setOrientationLocked(true);
    }
  }, [orientationLocked]);

  useEffect(() => () => { unlockOrientation().catch(() => {}); }, []);

  // ── Raise Hand ────────────────────────────────────────────────────────────
  const handleRaiseHand = useCallback(async () => {
    if (!roomData || raisingHand) return;
    setRaisingHand(true);
    try {
      await sessionsApi.raiseHand(sessionId);
      setHandRaised(true);
      setTimeout(() => setHandRaised(false), 30_000);
    } catch { /* silent */ } finally {
      setRaisingHand(false);
    }
  }, [roomData, raisingHand, sessionId]);

  // ── Back guard ─────────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    Alert.alert('مغادرة الحصة', 'هل تريد مغادرة الحصة؟ يمكنك العودة في أي وقت.', [
      { text: 'ابقَ', style: 'cancel' },
      { text: 'مغادرة', style: 'destructive', onPress: async () => {
        if (orientationLocked) await unlockOrientation().catch(() => {});
        qc.invalidateQueries({ queryKey: ['sessions'] });
        router.back();
      }},
    ]);
    return true;
  }, [router, qc, orientationLocked]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleLeave);
    return () => sub.remove();
  }, [handleLeave]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { appState.current = s; });
    return () => sub.remove();
  }, []);

  const httpStatus = (error as any)?.response?.status;
  const isEnded    = httpStatus === 422 && roomData !== null;

  // Student ALWAYS joins via the student PIN URL — never the lesson's (teacher)
  // nearpod_url, which would open Nearpod with teacher controls.
  const nearpodUrl = roomData?.nearpod_pin
    ? `https://nearpod.com/student/?pin=${roomData.nearpod_pin.toUpperCase()}`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={[S.topBar, { paddingTop: insets.top + 2 }]}>
        <TouchableOpacity onPress={handleLeave} style={S.topBtn}>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={S.topTitle} numberOfLines={1}>
            {roomData?.lesson?.title ?? 'الحصة الحية'}
          </Text>
          {roomData?.teacher?.name && (
            <Text style={S.topSub}>مع {roomData.teacher.name}</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {joined && (
            <TouchableOpacity
              style={[S.topBtn, handRaised && S.topBtnHandOn]}
              onPress={handRaised ? () => setHandRaised(false) : handleRaiseHand}
              disabled={raisingHand}
            >
              <Text style={{ fontSize: 16 }}>{handRaised ? '✋' : '🖐'}</Text>
            </TouchableOpacity>
          )}

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

          {joined && (
            <View style={S.liveBadge}>
              <View style={S.liveDot} />
              <Text style={S.liveTxt}>LIVE</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Waiting ───────────────────────────────────────────────────────── */}
      {!joined && (
        <WaitingOverlay onCancel={() => {
          qc.invalidateQueries({ queryKey: ['sessions'] });
          router.back();
        }} />
      )}

      {/* ── Session ended ─────────────────────────────────────────────────── */}
      {isEnded && (
        <View style={S.endedBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text style={S.endedTxt}>انتهت الحصة</Text>
          <TouchableOpacity onPress={async () => {
            if (orientationLocked) await unlockOrientation().catch(() => {});
            router.back();
          }}>
            <Text style={S.endedAction}>العودة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── In session — responsive split ─────────────────────────────────── */}
      {joined && roomData && !isEnded && (
        <SplitCallLayout
          call={<DailyCallPanel roomUrl={roomData.daily_room_url} />}
          content={<NearpodPanel sessionId={sessionId} url={nearpodUrl} pin={roomData.nearpod_pin} />}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
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
  topBtnHandOn: {
    backgroundColor: 'rgba(251,146,60,0.3)',
    borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.7)',
  },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topSub:   { color: '#6b7280', fontSize: 11, marginTop: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ef4444', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  noNearpod: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f9fafb', padding: 32,
  },
  noNearpodTxt: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 14 },
  pinLarge:     { fontSize: 40, fontWeight: '900', color: '#7c3aed', letterSpacing: 8, marginTop: 8 },

  webLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111827',
  },

  waitingOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111827', padding: 32,
  },
  waitingTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  waitingSub:   { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  cancelBtn: {
    marginTop: 32, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#374151',
  },
  cancelTxt: { color: '#6b7280', fontSize: 15, fontWeight: '600' },

  endedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#f0fdf4',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#bbf7d0',
  },
  endedTxt:    { color: '#065f46', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right' },
  endedAction: { color: '#10b981', fontSize: 14, fontWeight: '700' },
});

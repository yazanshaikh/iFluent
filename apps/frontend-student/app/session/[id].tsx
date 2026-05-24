/**
 * Session Room — Split-screen live classroom.
 *
 * Layout:
 *   ┌────────────────────────────────┐
 *   │  Daily.co Video (WebView)  55% │  ← teacher + student video/audio
 *   ├────────────────────────────────┤
 *   │  Nearpod (WebView)         45% │  ← interactive lesson content
 *   └────────────────────────────────┘
 *
 * Architecture:
 * - Daily.co room URL is loaded in a WebView (prebuilt UI = no native SDK needed
 *   for Expo Go development; swap to @daily-co/react-native-daily-js for EAS builds).
 * - Nearpod is loaded in a second WebView using the lesson's nearpod_url.
 * - The Nearpod PIN is displayed so the student can self-enter it if needed.
 * - The app polls `/student/sessions/{id}/join` every 5 s while waiting,
 *   then opens the room as soon as the teacher sets the PIN and activates.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, AppState, Platform,
  StatusBar, BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sessionsApi, type JoinSessionResponse } from '@/api/sessions';

// ─── Status polling intervals ─────────────────────────────────────────────────
const POLL_WAITING_MS  = 5_000;   // poll every 5 s while session is not yet active
const POLL_ACTIVE_MS   = 30_000;  // poll every 30 s once inside the room

// ─── Nearpod PIN overlay (shown at top of Nearpod WebView) ───────────────────
function PinBadge({ pin }: { pin: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <View style={styles.pinBadge}>
      <Text style={styles.pinLabel}>Nearpod PIN</Text>
      <Text style={styles.pinCode}>{pin}</Text>
      <TouchableOpacity style={styles.pinClose} onPress={() => setVisible(false)}>
        <Ionicons name="close" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Waiting overlay ──────────────────────────────────────────────────────────
function WaitingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <View style={styles.waitingOverlay}>
      <ActivityIndicator size="large" color="#10b981" style={{ marginBottom: 20 }} />
      <Text style={styles.waitingTitle}>في انتظار المعلم…</Text>
      <Text style={styles.waitingSub}>ستدخل الحصة تلقائياً عند بدئها</Text>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>إلغاء</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SessionRoomScreen() {
  const router   = useRouter();
  const qc       = useQueryClient();
  const { id }   = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);

  const [roomData, setRoomData]   = useState<JoinSessionResponse | null>(null);
  const [joined,   setJoined]     = useState(false);
  const [divider,  setDivider]    = useState(0.55); // fraction of height for video
  const appState = useRef(AppState.currentState);

  // ── Polling: join endpoint ──────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useQuery<JoinSessionResponse>({
    queryKey:       ['session-join', sessionId],
    queryFn:        () => sessionsApi.joinSession(sessionId),
    refetchInterval: joined ? POLL_ACTIVE_MS : POLL_WAITING_MS,
    retry: (count, err: any) => {
      // 422 (not active yet) and 425 (PIN not set) are expected; keep polling
      const status = err?.response?.status;
      return status === 422 || status === 425 ? true : count < 3;
    },
    retryDelay: POLL_WAITING_MS,
  });

  // Once we have a valid room (daily_room_url + nearpod_pin), mark as joined
  useEffect(() => {
    if (data?.daily_room_url && data?.nearpod_pin) {
      setRoomData(data);
      setJoined(true);
    }
  }, [data]);

  // ── Back-button guard ───────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    Alert.alert(
      'مغادرة الحصة',
      'هل تريد مغادرة الحصة؟ يمكنك العودة في أي وقت طالما الحصة نشطة.',
      [
        { text: 'ابقَ', style: 'cancel' },
        {
          text: 'مغادرة',
          style: 'destructive',
          onPress: () => {
            qc.invalidateQueries({ queryKey: ['sessions'] });
            router.back();
          },
        },
      ],
    );
    return true; // prevent default back on Android
  }, [router, qc]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleLeave);
    return () => sub.remove();
  }, [handleLeave]);

  // ── AppState: keep screen awake (would use expo-keep-awake in full build) ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // ── Error state (session completed/cancelled) ───────────────────────────────
  const httpStatus = (error as any)?.response?.status;
  const isEnded    = httpStatus === 422 && roomData !== null; // was active, now ended

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ─── Header bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeave} style={styles.topBarBtn}>
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {roomData?.lesson?.title ?? 'الحصة الحية'}
          </Text>
          <Text style={styles.topBarSub}>
            {roomData?.teacher?.name ? `مع ${roomData.teacher.name}` : ''}
          </Text>
        </View>
        {/* Live badge */}
        {joined && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ─── Waiting overlay ─────────────────────────────────────────────────── */}
      {!joined && (
        <WaitingOverlay onCancel={() => {
          qc.invalidateQueries({ queryKey: ['sessions'] });
          router.back();
        }} />
      )}

      {/* ─── Session ended banner ─────────────────────────────────────────────── */}
      {isEnded && (
        <View style={styles.endedBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.endedText}>انتهت الحصة</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.endedAction}>العودة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Split-screen ─────────────────────────────────────────────────────── */}
      {joined && roomData && !isEnded && (
        <View style={{ flex: 1 }}>

          {/* ── TOP: Daily.co video room ──────────────────────────────────────── */}
          <View style={[styles.videoPane, { flex: divider }]}>
            <WebView
              source={{ uri: roomData.daily_room_url }}
              style={StyleSheet.absoluteFillObject}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              // Microphone and camera permissions
              mediaCapturePermissionGrantType="grant"
              allowsAirPlayForMediaPlayback
              // Allow getUserMedia (required by Daily.co)
              onShouldStartLoadWithRequest={() => true}
              startInLoadingState
              renderLoading={() => (
                <View style={[StyleSheet.absoluteFillObject, styles.webviewLoading]}>
                  <ActivityIndicator size="large" color="#10b981" />
                </View>
              )}
            />

            {/* Divider drag handle */}
            <TouchableOpacity
              style={styles.dividerHandle}
              onPress={() =>
                setDivider((d) => (d > 0.5 ? 0.4 : 0.6))
              }
              activeOpacity={0.9}
            >
              <View style={styles.dividerBar} />
            </TouchableOpacity>
          </View>

          {/* ── BOTTOM: Nearpod WebView ─────────────────────────────────────── */}
          <View style={[styles.nearpodPane, { flex: 1 - divider }]}>
            {roomData.nearpod_url ? (
              <>
                <WebView
                  source={{ uri: roomData.nearpod_url }}
                  style={StyleSheet.absoluteFillObject}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={[StyleSheet.absoluteFillObject, styles.webviewLoading, { backgroundColor: '#faf5ff' }]}>
                      <ActivityIndicator size="large" color="#8b5cf6" />
                      <Text style={styles.nearpodLoadingText}>جاري تحميل الدرس…</Text>
                    </View>
                  )}
                />
                {/* PIN overlay */}
                {roomData.nearpod_pin && <PinBadge pin={roomData.nearpod_pin} />}
              </>
            ) : (
              // Nearpod URL not set yet — show PIN only
              <View style={styles.noNearpod}>
                <Ionicons name="easel-outline" size={40} color="#d1d5db" />
                <Text style={styles.noNearpodTitle}>انتظر المعلم</Text>
                {roomData.nearpod_pin && (
                  <>
                    <Text style={styles.noNearpodSub}>PIN الدرس:</Text>
                    <Text style={styles.pinLarge}>{roomData.nearpod_pin}</Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  topBar: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
  },
  topBarBtn:   { padding: 6 },
  topBarTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  topBarSub:   { color: '#9ca3af', fontSize: 11, marginTop: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ef4444', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Waiting
  waitingOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111827', padding: 32,
  },
  waitingTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  waitingSub:   { color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  cancelBtn: {
    marginTop: 32, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#374151',
  },
  cancelText: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },

  // Ended
  endedBanner: {
    backgroundColor: '#f0fdf4', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#bbf7d0',
  },
  endedText:   { color: '#065f46', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  endedAction: { color: '#10b981', fontSize: 14, fontWeight: '700' },

  // Panes
  videoPane: {
    backgroundColor: '#000',
    position: 'relative',
  },
  nearpodPane: {
    backgroundColor: '#faf5ff',
    position: 'relative',
  },
  webviewLoading: {
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111827',
  },

  // Divider
  dividerHandle: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 20, justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  dividerBar: {
    width: 48, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // PIN badge
  pinBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    zIndex: 20,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  pinLabel: { color: '#e9d5ff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  pinCode:  { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  pinClose: { marginLeft: 4 },

  // No Nearpod
  noNearpod: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noNearpodTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  noNearpodSub:   { fontSize: 13, color: '#6b7280', marginTop: 8 },
  pinLarge: { fontSize: 36, fontWeight: '900', color: '#7c3aed', letterSpacing: 6, marginTop: 8 },
  nearpodLoadingText: { color: '#8b5cf6', marginTop: 12, fontSize: 14 },
});

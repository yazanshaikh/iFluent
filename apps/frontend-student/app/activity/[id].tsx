/**
 * Lesson Activity — opens the lesson's interactive activity (Wordwall, etc.)
 * inside a WebView. The activity URL is stored per-lesson in the DB and passed
 * here as a param (already fetched on the lesson screen).
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/theme';

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url, title } = useLocalSearchParams<{ id: string; url?: string; title?: string }>();
  const [loading, setLoading] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Ionicons name="game-controller" size={20} color={C.navy} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title ?? 'نشاط الدرس'}
          </Text>
        </View>
      </View>

      {/* ── Activity ────────────────────────────────────────────────────────── */}
      {url ? (
        <View style={{ flex: 1, backgroundColor: C.white }}>
          <WebView
            source={{ uri: url }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
            startInLoadingState
            onLoadEnd={() => setLoading(false)}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={C.success} />
              </View>
            )}
          />
          {loading && (
            <View style={styles.loading} pointerEvents="none">
              <ActivityIndicator size="large" color={C.success} />
              <Text style={styles.loadingTxt}>جاري تحميل النشاط…</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="game-controller-outline" size={48} color={C.gray} />
          <Text style={styles.emptyTxt}>لا يتوفّر نشاط لهذا الدرس بعد.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: C.yellow,
    paddingHorizontal: 18, paddingBottom: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    gap: 10,
  },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10, padding: 7,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.navy, flexShrink: 1 },

  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.white, gap: 12,
  },
  loadingTxt: { color: C.success, fontWeight: '700', fontSize: 13 },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 14,
  },
  emptyTxt: { fontSize: 15, fontWeight: '600', color: C.grayMid, textAlign: 'center' },
});

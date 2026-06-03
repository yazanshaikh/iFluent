/**
 * Upcoming Sessions — حصصي
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { sessionsApi, type TeacherSession } from '@/api/sessions';
import { C, shadow, STATUS_COLOR, STATUS_LABEL } from '@/theme';

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

function SessionCard({ session, onPress }: { session: TeacherSession; onPress: () => void }) {
  const color   = STATUS_COLOR[session.status] ?? C.gray;
  const isActive = session.status === 'active';
  const isAccepted = session.status === 'confirmed' || session.status === 'waiting';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: isActive ? C.success : C.sky }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <View style={[styles.badgeDot, { backgroundColor: color }]} />
            <Text style={[styles.badgeTxt, { color }]}>{STATUS_LABEL[session.status] ?? session.status}</Text>
          </View>
          <Text style={styles.cardTime}>{fmt(session.scheduled_at)}</Text>
        </View>

        <Text style={styles.studentName}>{session.student?.name ?? 'طالب'}</Text>

        {session.lesson?.title && (
          <View style={styles.metaRow}>
            <Ionicons name="book-outline" size={13} color={C.grayMid} />
            <Text style={styles.metaTxt} numberOfLines={1}>{session.lesson.title}</Text>
          </View>
        )}

        {/* CTA */}
        <View style={styles.cta}>
          {isActive ? (
            <LinearGradient colors={[C.success, '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
              <Ionicons name="videocam" size={15} color="#fff" />
              <Text style={styles.ctaTxt}>العودة للفصل</Text>
            </LinearGradient>
          ) : isAccepted ? (
            <LinearGradient colors={[C.sky, C.skyDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
              <Ionicons name="play-circle-outline" size={15} color="#fff" />
              <Text style={styles.ctaTxt}>بدء الحصة</Text>
            </LinearGradient>
          ) : (
            <View style={styles.ctaPlain}>
              <Ionicons name="eye-outline" size={15} color={C.grayMid} />
              <Text style={styles.ctaPlainTxt}>عرض التفاصيل</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey:  ['sessions'],
    queryFn:   sessionsApi.upcoming,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const active   = data.filter((s) => s.status === 'active');
  const upcoming = data.filter((s) => ['confirmed','waiting'].includes(s.status));
  const past     = data.filter((s) => ['completed','cancelled'].includes(s.status));

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>حصصي</Text>
        <Text style={styles.headerSub}>{data.length} حصة</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.sky} />}
      >
        {isLoading ? (
          <ActivityIndicator color={C.sky} style={{ marginTop: 40 }} />
        ) : data.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={52} color={C.skyLight} />
            <Text style={styles.emptyTxt}>لا توجد حصص قادمة</Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.section}>🟢 نشطة الآن</Text>
                {active.map((s) => (
                  <SessionCard key={s.id} session={s}
                    onPress={() => router.push({ pathname: '/classroom/[id]', params: { id: String(s.id) } })} />
                ))}
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <Text style={styles.section}>⏰ القادمة</Text>
                {upcoming.map((s) => (
                  <SessionCard key={s.id} session={s}
                    onPress={() => router.push({ pathname: '/session/[id]', params: { id: String(s.id) } })} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.section}>✅ المنتهية</Text>
                {past.map((s) => (
                  <SessionCard key={s.id} session={s}
                    onPress={() => router.push({ pathname: '/session/[id]', params: { id: String(s.id) } })} />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  section: { fontSize: 13, fontWeight: '700', color: C.grayDark, textAlign: 'right', marginTop: 8 },

  card: { backgroundColor: '#fff', borderRadius: 18, flexDirection: 'row', overflow: 'hidden', ...shadow.sm },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  cardTime: { fontSize: 11, color: C.grayMid },
  studentName: { fontSize: 16, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 },
  metaTxt: { fontSize: 12, color: C.grayMid, flex: 1, textAlign: 'right' },
  cta:      { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  ctaGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11 },
  ctaTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  ctaPlain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: C.grayLight },
  ctaPlainTxt: { fontSize: 13, color: C.grayMid, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 12, marginTop: 60 },
  emptyTxt: { fontSize: 14, color: C.grayMid, fontWeight: '600' },
});

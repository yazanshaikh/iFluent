/**
 * Sessions tab — active, upcoming and past sessions.
 * Tapping an active session opens the classroom (session room).
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { sessionsApi, type SessionListItem } from '@/api/sessions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  waiting:   'قريباً',
  active:    'نشطة الآن ●',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const STATUS_COLOR: Record<string, string> = {
  waiting:   '#f59e0b',
  active:    '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    day:    'numeric',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onJoin }: { session: SessionListItem; onJoin: () => void }) {
  const isActive = session.status === 'active';

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Status pill */}
      <View style={styles.cardTop}>
        <View style={[styles.pill, { backgroundColor: STATUS_COLOR[session.status] + '20' }]}>
          <Text style={[styles.pillText, { color: STATUS_COLOR[session.status] }]}>
            {STATUS_LABEL[session.status] ?? session.status}
          </Text>
        </View>
        <Text style={styles.cardDate}>{fmt(session.scheduled_at ?? session.started_at)}</Text>
      </View>

      {/* Lesson & teacher */}
      <Text style={styles.cardLesson}>{session.lesson?.title ?? 'حصة'}</Text>
      <Text style={styles.cardLevel}>
        {session.lesson?.level?.name}
        {session.lesson?.unit ? ` · ${session.lesson.unit.name}` : ''}
      </Text>
      <View style={styles.cardRow}>
        <Ionicons name="person-outline" size={13} color="#9ca3af" />
        <Text style={styles.cardTeacher}>{session.teacher?.name}</Text>
      </View>

      {/* Join button for active sessions */}
      {isActive && (
        <TouchableOpacity style={styles.joinBtn} onPress={onJoin} activeOpacity={0.85}>
          <Ionicons name="videocam" size={16} color="#fff" />
          <Text style={styles.joinBtnText}>دخول الفصل الآن</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsScreen() {
  const router = useRouter();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sessions'],
    queryFn:  () => sessionsApi.listSessions(),
    refetchInterval: 15_000, // poll every 15s to catch newly-activated sessions
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const sessions    = data ?? [];
  const active      = sessions.filter((s) => s.status === 'active');
  const upcoming    = sessions.filter((s) => s.status === 'waiting');
  const past        = sessions.filter((s) => ['completed', 'cancelled'].includes(s.status));

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حصصي</Text>
        <Text style={styles.headerSub}>جميع الجلسات الخاصة بك</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#10b981" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active sessions — shown prominently */}
        {active.length > 0 && (
          <>
            <Text style={styles.section}>🟢 نشطة الآن</Text>
            {active.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onJoin={() => router.push({ pathname: '/session/[id]', params: { id: String(s.id) } })}
              />
            ))}
          </>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.section}>⏰ القادمة</Text>
            {upcoming.map((s) => (
              <SessionCard key={s.id} session={s} onJoin={() => {}} />
            ))}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={styles.section}>السابقة</Text>
            {past.map((s) => (
              <SessionCard key={s.id} session={s} onJoin={() => {}} />
            ))}
          </>
        )}

        {sessions.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="videocam-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد حصص بعد</Text>
            <Text style={styles.emptySub}>
              ستظهر حصصك هنا بعد أن يقوم معلمك بإنشاء الجلسة
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#10b981',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: '#d1fae5', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 32 },
  section: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, textAlign: 'right' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#6b7280' },
  cardLesson: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'right', marginBottom: 4 },
  cardLevel:  { fontSize: 13, color: '#6b7280', textAlign: 'right', marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  cardTeacher: { fontSize: 12, color: '#9ca3af' },
  joinBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  joinBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: '#9ca3af', marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});

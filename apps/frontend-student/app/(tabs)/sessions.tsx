/**
 * Sessions tab — active, upcoming and past sessions.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sessionsApi, type SessionListItem } from '@/api/sessions';
import { C, shadow }          from '@/theme';
import { useAnimatedHeader }  from '@/hooks/useAnimatedHeader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  waiting:   'قريباً',
  active:    'نشطة الآن',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const STATUS_COLOR: Record<string, string> = {
  waiting:   C.warning,
  active:    C.success,
  completed: C.gray,
  cancelled: C.error,
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

// ─── Active hero card ─────────────────────────────────────────────────────────

function ActiveCard({ session, onJoin }: { session: SessionListItem; onJoin: () => void }) {
  return (
    <View style={styles.activeCard}>
      {/* Pulsing dot + label */}
      <View style={styles.activeTop}>
        <View style={styles.liveDot} />
        <Text style={styles.liveLabel}>🟢 نشطة الآن</Text>
        <Text style={styles.activeDate}>{fmt(session.started_at)}</Text>
      </View>

      <Text style={styles.activeLesson} numberOfLines={2}>
        {session.lesson?.title ?? 'حصة'}
      </Text>

      {session.lesson?.unit && (
        <Text style={styles.activeLevel}>
          {session.lesson.level?.name}  ·  {session.lesson.unit.name}
        </Text>
      )}

      <View style={styles.teacherRow}>
        <View style={styles.teacherAvatar}>
          <Text style={styles.teacherInitial}>
            {(session.teacher?.name ?? 'م').charAt(0)}
          </Text>
        </View>
        <Text style={styles.teacherName}>{session.teacher?.name}</Text>
      </View>

      <TouchableOpacity style={styles.joinBtn} onPress={onJoin} activeOpacity={0.85}>
        <Ionicons name="videocam" size={18} color={C.navy} />
        <Text style={styles.joinBtnTxt}>دخول الفصل الآن</Text>
        <Ionicons name="arrow-back" size={16} color={C.navy} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Regular session card ─────────────────────────────────────────────────────

function SessionCard({ session }: { session: SessionListItem }) {
  const color  = STATUS_COLOR[session.status] ?? C.gray;
  const isWait = session.status === 'waiting';

  return (
    <View style={[styles.card, isWait && styles.cardWaiting]}>
      <View style={styles.cardLeft}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.pill, { backgroundColor: color + '20' }]}>
            <Text style={[styles.pillTxt, { color }]}>{STATUS_LABEL[session.status] ?? session.status}</Text>
          </View>
          <Text style={styles.cardDate}>{fmt(session.scheduled_at ?? session.started_at)}</Text>
        </View>
        <Text style={styles.cardLesson} numberOfLines={1}>
          {session.lesson?.title ?? 'حصة'}
        </Text>
        {session.teacher?.name && (
          <View style={styles.cardTeacherRow}>
            <Ionicons name="person-outline" size={12} color={C.gray} />
            <Text style={styles.cardTeacher}>{session.teacher.name}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsScreen() {
  const router      = useRouter();
  const insets      = useSafeAreaInsets();

  const { headerHeight, onHeaderLayout, onScroll, headerStyle } = useAnimatedHeader();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sessions'],
    queryFn:  () => sessionsApi.listSessions(),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <ActivityIndicator size="large" color={C.yellow} />
      </View>
    );
  }

  const sessions = data ?? [];
  const active   = sessions.filter((s) => s.status === 'active');
  const upcoming = sessions.filter((s) => s.status === 'waiting');
  const past     = sessions.filter((s) => ['completed', 'cancelled'].includes(s.status));

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header (absolute, animates on scroll) ───────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 14 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 90, height: 90, top: -25, left: -25 }]} />
        <View style={[styles.dot, { width: 40, height: 40, bottom: 8, right: 30 }]} />

        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>حصصي</Text>
            <Text style={styles.headerSub}>جلساتك مع المعلم</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <View style={styles.countPill}>
              <Ionicons name="videocam" size={14} color={C.navy} />
              <Text style={styles.countTxt}>{sessions.length} جلسة</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── Content (padded so it starts below the header) ────────────────── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={C.yellow}
            colors={[C.yellow]}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* Active sessions — hero cards */}
        {active.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>🔴 نشطة الآن</Text>
            {active.map((s) => (
              <ActiveCard
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
            <Text style={styles.sectionLabel}>⏰ القادمة</Text>
            {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>السابقة</Text>
            {past.map((s) => <SessionCard key={s.id} session={s} />)}
          </>
        )}

        {/* Empty */}
        {sessions.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="videocam-outline" size={36} color={C.yellow} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد حصص بعد</Text>
            <Text style={styles.emptySub}>
              ستظهر حصصك هنا بعد أن يقوم معلمك بإنشاء الجلسة
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    shadowColor: C.amber,
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.18,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: C.navy },
  headerSub:   { fontSize: 12, color: C.navyMid, marginTop: 2, fontWeight: '600' },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.42)',
    justifyContent: 'center', alignItems: 'center',
  },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countTxt: { fontSize: 13, fontWeight: '800', color: C.navy },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 10, marginTop: 4,
  },

  // ── Active hero card ──────────────────────────────────────────────────────
  activeCard: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    ...shadow.navy,
  },
  activeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  liveDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  liveLabel: { fontSize: 12, fontWeight: '800', color: C.success, flex: 1 },
  activeDate:  { fontSize: 11, color: 'rgba(255,255,255,0.55)' },

  activeLesson: {
    fontSize: 18, fontWeight: '900', color: C.white,
    textAlign: 'right', marginBottom: 6,
  },
  activeLevel: {
    fontSize: 12, color: 'rgba(255,255,255,0.65)',
    textAlign: 'right', marginBottom: 14,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  teacherAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.yellow,
    justifyContent: 'center', alignItems: 'center',
  },
  teacherInitial: { fontSize: 13, fontWeight: '900', color: C.navy },
  teacherName:    { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  joinBtn: {
    backgroundColor: C.yellow,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  joinBtnTxt: { fontSize: 15, fontWeight: '900', color: C.navy },

  // ── Regular session card ───────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardWaiting: {
    borderWidth: 1.5,
    borderColor: C.border,
  },
  cardLeft: {
    width: 4,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillTxt: { fontSize: 11, fontWeight: '800' },
  cardDate:   { fontSize: 11, color: C.gray },
  cardLesson: { fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'right', marginBottom: 6 },
  cardTeacherRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, justifyContent: 'flex-end',
  },
  cardTeacher: { fontSize: 12, color: C.gray },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 40, alignItems: 'center', ...shadow.sm,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'center' },
  emptySub:   {
    fontSize: 13, color: C.gray, marginTop: 8,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 20,
  },
});

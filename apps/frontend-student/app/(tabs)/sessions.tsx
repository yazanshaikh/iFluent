/**
 * Sessions tab — حصصي.
 * Filter: القادمة (active + waiting) | المكتملة (completed + cancelled).
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sessionsApi, type SessionListItem, type SessionRequest } from '@/api/sessions';
import { C, shadow }          from '@/theme';
import { useAnimatedHeader }  from '@/hooks/useAnimatedHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'upcoming' | 'done';

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
      <View style={[styles.statusBar, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.pill, { backgroundColor: color + '20' }]}>
            <Text style={[styles.pillTxt, { color }]}>
              {STATUS_LABEL[session.status] ?? session.status}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {fmt(session.scheduled_at ?? session.started_at)}
          </Text>
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

// ─── Booking request card (pending — no teacher yet) ─────────────────────────

function BookingRequestCard({ req }: { req: SessionRequest }) {
  const isPending   = req.status === 'pending';
  const isConfirmed = req.status === 'confirmed';
  const color = isPending ? C.warning : isConfirmed ? C.success : C.gray;
  const label = isPending ? 'في الانتظار' : isConfirmed ? 'مؤكدة' : req.status;

  return (
    <View style={[styles.card, styles.cardWaiting]}>
      <View style={[styles.statusBar, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.pill, { backgroundColor: color + '22' }]}>
            <Text style={[styles.pillTxt, { color }]}>{label}</Text>
          </View>
          <Text style={styles.cardDate}>{fmt(req.scheduled_at)}</Text>
        </View>
        <Text style={styles.cardLesson} numberOfLines={1}>
          {req.lesson?.title ?? (req.type === 'private' ? 'حصة خاصة' : 'حصة فردية')}
        </Text>
        {req.teacher?.name ? (
          <View style={styles.cardTeacherRow}>
            <Ionicons name="person-outline" size={12} color={C.gray} />
            <Text style={styles.cardTeacher}>{req.teacher.name}</Text>
          </View>
        ) : (
          <View style={styles.cardTeacherRow}>
            <Ionicons name="hourglass-outline" size={12} color={C.warning} />
            <Text style={[styles.cardTeacher, { color: C.warning }]}>
              بانتظار قبول معلم
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Filter pills ─────────────────────────────────────────────────────────────

function FilterPills({
  value,
  onChange,
  upcomingCount,
  doneCount,
}: {
  value:         Filter;
  onChange:      (v: Filter) => void;
  upcomingCount: number;
  doneCount:     number;
}) {
  return (
    <View style={styles.pillsRow}>
      <TouchableOpacity
        style={[styles.filterPill, value === 'upcoming' && styles.filterPillActive]}
        onPress={() => onChange('upcoming')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="time-outline"
          size={14}
          color={value === 'upcoming' ? C.navy : C.navyMid}
        />
        <Text style={[styles.filterPillTxt, value === 'upcoming' && styles.filterPillTxtActive]}>
          القادمة
        </Text>
        {upcomingCount > 0 && (
          <View style={[styles.filterBadge, value === 'upcoming' && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeTxt, value === 'upcoming' && styles.filterBadgeTxtActive]}>
              {upcomingCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterPill, value === 'done' && styles.filterPillActive]}
        onPress={() => onChange('done')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={14}
          color={value === 'done' ? C.navy : C.navyMid}
        />
        <Text style={[styles.filterPillTxt, value === 'done' && styles.filterPillTxtActive]}>
          المكتملة
        </Text>
        {doneCount > 0 && (
          <View style={[styles.filterBadge, value === 'done' && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeTxt, value === 'done' && styles.filterBadgeTxtActive]}>
              {doneCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsScreen() {
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const { headerHeight, onHeaderLayout, onScroll, headerStyle } = useAnimatedHeader();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sessions'],
    queryFn:  () => sessionsApi.listSessions(),
    refetchInterval: 15_000,
  });

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn:  () => sessionsApi.listBookings(),
    refetchInterval: 15_000,
  });

  const sessions = data ?? [];
  const bookings = (bookingsData ?? []) as SessionRequest[];

  const active   = sessions.filter((s) => s.status === 'active');
  const upcoming = sessions.filter((s) => s.status === 'waiting');
  const past     = sessions.filter((s) => ['completed', 'cancelled'].includes(s.status));

  // Pending/confirmed requests that don't have a session yet
  const pendingRequests = bookings.filter(
    (b) => ['pending', 'confirmed'].includes(b.status) && !b.session_id,
  );
  // Done requests (rejected, cancelled, expired)
  const doneRequests = bookings.filter(
    (b) => ['rejected', 'cancelled', 'expired'].includes(b.status),
  );

  const upcomingCount = active.length + upcoming.length + pendingRequests.length;
  const doneCount     = past.length + doneRequests.length;

  const handleRefresh = () => { refetch(); refetchBookings(); };

  const hasUpcoming = active.length + upcoming.length + pendingRequests.length > 0;
  const hasDone     = past.length + doneRequests.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ───────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 14 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 90, height: 90, top: -25, left: -25 }]} />
        <View style={[styles.dot, { width: 40, height: 40, bottom: 8, right: 30 }]} />

        {/* Title row */}
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>حصصي</Text>
            <Text style={styles.headerSub}>جلساتك مع المعلم</Text>
          </View>
          <View style={styles.countPill}>
            <Ionicons name="videocam" size={14} color={C.navy} />
            <Text style={styles.countTxt}>{sessions.length} جلسة</Text>
          </View>
        </View>

        {/* Filter pills — always shown */}
        <FilterPills
          value={filter}
          onChange={setFilter}
          upcomingCount={upcomingCount}
          doneCount={doneCount}
        />
      </Animated.View>

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={C.yellow}
            colors={[C.yellow]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.bodySpinner}>
            <ActivityIndicator size="large" color={C.yellow} />
          </View>

        ) : filter === 'upcoming' && !hasUpcoming ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="time-outline" size={36} color={C.yellow} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد حصص قادمة</Text>
            <Text style={styles.emptySub}>ستظهر حصصك القادمة هنا فور الحجز</Text>
          </View>

        ) : filter === 'done' && !hasDone ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="checkmark-done-outline" size={36} color={C.yellow} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد حصص مكتملة</Text>
            <Text style={styles.emptySub}>حصصك المنتهية ستظهر هنا بعد اكتمالها</Text>
          </View>

        ) : (
          <>
            {filter === 'upcoming' && (
              <>
                {/* Pending booking requests — appear immediately after booking */}
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>⏳ بانتظار التأكيد</Text>
                    {pendingRequests.map((r) => (
                      <BookingRequestCard key={`req-${r.id}`} req={r} />
                    ))}
                  </>
                )}

                {/* Active now */}
                {active.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>🔴 نشطة الآن</Text>
                    {active.map((s) => (
                      <ActiveCard
                        key={s.id}
                        session={s}
                        onJoin={() =>
                          router.push({ pathname: '/session/[id]', params: { id: String(s.id) } })
                        }
                      />
                    ))}
                  </>
                )}

                {/* Confirmed sessions */}
                {upcoming.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>⏰ المجدولة</Text>
                    {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
                  </>
                )}
              </>
            )}

            {filter === 'done' && (
              <>
                {past.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>✅ المكتملة والملغاة</Text>
                    {past.map((s) => <SessionCard key={s.id} session={s} />)}
                  </>
                )}
                {doneRequests.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 8 }]}>طلبات مرفوضة / منتهية</Text>
                    {doneRequests.map((r) => (
                      <BookingRequestCard key={`req-${r.id}`} req={r} />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 16,
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
    marginBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: C.navy },
  headerSub:   { fontSize: 12, color: C.navyMid, marginTop: 2, fontWeight: '600' },
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

  // ── Filter pills ─────────────────────────────────────────────────────────────
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  filterPillActive: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterPillTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.navyMid,
  },
  filterPillTxtActive: {
    color: C.navy,
    fontWeight: '900',
  },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(26,41,128,0.15)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: C.navy,
  },
  filterBadgeTxt: {
    fontSize: 10, fontWeight: '800', color: C.navyMid,
  },
  filterBadgeTxtActive: {
    color: C.yellow,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 10, marginTop: 4,
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  bodySpinner: {
    marginTop: 80,
    alignItems: 'center',
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
  statusBar: {
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
  cardLesson: {
    fontSize: 15, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 6,
  },
  cardTeacherRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, justifyContent: 'flex-end',
  },
  cardTeacher: { fontSize: 12, color: C.gray },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 40, alignItems: 'center', ...shadow.sm,
    marginTop: 16,
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

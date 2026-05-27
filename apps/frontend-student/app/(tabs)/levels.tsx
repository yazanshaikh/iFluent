/**
 * Levels tab — student's enrolled units + full curriculum roadmap.
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
import { levelsApi, type Unit, type Level } from '@/api/levels';
import { studentMessagesApi } from '@/api/messages';
import { C, LEVEL_COLORS, shadow } from '@/theme';
import { useSidebarStore }        from '@/stores/sidebarStore';
import { useAnimatedHeader }      from '@/hooks/useAnimatedHeader';

// ─── Unit card ────────────────────────────────────────────────────────────────

function UnitCard({ unit, onPress }: { unit: Unit; onPress: () => void }) {
  const isLocked = !unit.enrollment;
  const isDone   = unit.enrollment?.status === 'completed';
  const pct      = isDone ? 100 : unit.enrollment ? 35 : 0;

  return (
    <TouchableOpacity
      style={[styles.unitCard, isLocked && styles.unitCardLocked]}
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.82}
    >
      {/* Yellow accent bar */}
      <View style={[styles.unitAccent, isLocked && styles.unitAccentLocked]} />

      <View style={styles.unitBody}>
        {/* Top row */}
        <View style={styles.unitTop}>
          <Text style={[styles.unitName, isLocked && styles.textMuted]} numberOfLines={1}>
            {unit.name}
          </Text>
          {isLocked ? (
            <Ionicons name="lock-closed" size={15} color={C.border} />
          ) : isDone ? (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark" size={11} color={C.white} />
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeTxt}>نشطة</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <Text style={styles.unitMeta}>
          {unit.lesson_count} درس{unit.has_end_test ? ' · اختبار وحدة' : ''}
        </Text>

        {/* Progress bar */}
        {!isLocked && (
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        )}
      </View>

      {!isLocked && (
        <Ionicons name="chevron-back" size={18} color={C.navy} style={{ marginLeft: -4 }} />
      )}
    </TouchableOpacity>
  );
}

// ─── Level roadmap row ────────────────────────────────────────────────────────

function LevelRow({ level }: { level: Level }) {
  const color = LEVEL_COLORS[level.code] ?? C.navy;
  return (
    <View style={styles.levelRow}>
      <View style={[styles.levelBadge, { backgroundColor: color }]}>
        <Text style={styles.levelBadgeTxt}>{level.code}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.levelName}>{level.name}</Text>
        <Text style={styles.levelMeta}>
          {level.total_units} وحدة · {level.total_lessons} درس
        </Text>
      </View>
      <View style={[styles.levelDot, { backgroundColor: color + '22' }]}>
        <Text style={[styles.levelDotTxt, { color }]}>{level.total_units}</Text>
      </View>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LevelsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const openSidebar = useSidebarStore((s) => s.open);
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } = useAnimatedHeader();

  const { data: myUnits,   isLoading: loadingUnits,  refetch, isFetching } = useQuery({
    queryKey: ['my-units'],
    queryFn:  levelsApi.myUnits,
  });

  const { data: allLevels, isLoading: loadingLevels } = useQuery({
    queryKey: ['all-levels'],
    queryFn:  levelsApi.listLevels,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ['messages-unread'],
    queryFn:  studentMessagesApi.unreadCount,
    refetchInterval: 60_000,   // poll every 60 s
  });

  const isLoading = loadingUnits || loadingLevels;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <ActivityIndicator size="large" color={C.yellow} />
      </View>
    );
  }

  const enrolled   = myUnits ?? [];
  const hasEnrolled = enrolled.length > 0;
  const doneCount  = enrolled.filter((u) => u.enrollment?.status === 'completed').length;
  const pct        = enrolled.length > 0 ? Math.round((doneCount / enrolled.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header (absolute, animates on scroll) ───────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        {/* Decorative circles */}
        <View style={[styles.dot, { width: 90, height: 90, top: -24, left: -24 }]} />
        <View style={[styles.dot, { width: 44, height: 44, bottom: 12, right: 16 }]} />

        {/* ── Row 1: bell (left) + hamburger (right) ─────────────────────── */}
        <View style={styles.hTopRow}>
          {/* Bell — navigates to messages */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push('/messages')}
          >
            <Ionicons name="notifications" size={22} color={C.navy} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeTxt}>
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Hamburger */}
          <TouchableOpacity style={styles.menuBtn} onPress={openSidebar}>
            <Ionicons name="menu" size={22} color={C.navy} />
          </TouchableOpacity>
        </View>

        {/* ── Row 2: title ──────────────────────────────────────────────── */}
        <Text style={styles.headerTitle}>الرئيسية</Text>

        {/* ── Row 3: progress label + count ─────────────────────────────── */}
        <View style={styles.hMidRow}>
          <Text style={styles.progressSub}>
            {enrolled.length > 0
              ? `${doneCount}/${enrolled.length} وحدة · ${pct}%`
              : 'سجّل للبدء'}
          </Text>
          <Text style={styles.progressLbl}>التقدم الكلي</Text>
        </View>

        {/* ── Row 4: slim progress bar ───────────────────────────────────── */}
        <View style={styles.hProgressTrack}>
          <View style={[styles.hProgressFill, { width: `${pct}%` as any }]} />
        </View>
      </Animated.View>

      {/* ── Scrollable content (padded so it starts below the header) ─────── */}
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

        {/* My enrolled units */}
        <Text style={styles.sectionLabel}>📚 وحداتي المفعّلة</Text>

        {hasEnrolled ? (
          enrolled.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onPress={() =>
                router.push({ pathname: '/unit/[id]', params: { id: String(unit.id) } })
              }
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="school-outline" size={36} color={C.yellow} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد وحدات مفعّلة بعد</Text>
            <Text style={styles.emptySub}>
              بمجرد اشتراكك وموافقة الإدارة ستظهر وحداتك هنا
            </Text>
          </View>
        )}

        {/* Full curriculum roadmap */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>🗺️ خريطة المسار الكاملة</Text>

        {(allLevels ?? []).map((level) => (
          <View key={level.id} style={styles.levelCard}>
            <LevelRow level={level} />
          </View>
        ))}

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
    paddingBottom: 16,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    ...shadow.amber,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.15,
  },

  // Row 1 — bell + hamburger
  hTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.42)',
    justifyContent: 'center', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -4, right: -4,
    minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: C.yellow,
  },
  bellBadgeTxt: { fontSize: 9, fontWeight: '900', color: C.white },

  // Row 2 — title
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right', marginBottom: 10 },

  // Row 3 — progress label + count
  hMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLbl: { fontSize: 12, fontWeight: '800', color: C.navy },
  progressSub: { fontSize: 11, fontWeight: '600', color: C.navyMid },

  // Row 3 — slim horizontal progress bar
  hProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hProgressFill: {
    height: 6,
    backgroundColor: C.navy,
    borderRadius: 3,
  },

  // ── Scroll / sections ────────────────────────────────────────────────────────
  scroll:       { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.navy,
    textAlign: 'right',
    marginBottom: 10,
    marginTop: 4,
  },

  // ── Unit card ────────────────────────────────────────────────────────────────
  unitCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow.md,
  },
  unitCardLocked: { opacity: 0.52 },
  unitAccent:       { width: 5, alignSelf: 'stretch', backgroundColor: C.yellow },
  unitAccentLocked: { backgroundColor: '#E5E7EB' },
  unitBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  unitTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  unitName: { fontSize: 15, fontWeight: '800', color: C.navy, flex: 1, marginRight: 8, textAlign: 'right' },
  unitMeta: { fontSize: 12, color: C.gray, marginBottom: 8, textAlign: 'right' },
  textMuted: { color: C.gray },

  doneBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.success,
    justifyContent: 'center', alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: C.yellow + '25',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.yellow,
  },
  activeBadgeTxt: { fontSize: 10, fontWeight: '800', color: C.amber },

  progressBg: {
    height: 5, backgroundColor: '#F3F4F6', borderRadius: 3,
  },
  progressFill: {
    height: 5, borderRadius: 3, backgroundColor: C.yellow,
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    marginBottom: 16,
    ...shadow.sm,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: C.gray, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  // ── Roadmap ───────────────────────────────────────────────────────────────────
  levelCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 8,
    ...shadow.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  levelBadge: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  levelBadgeTxt: { fontSize: 13, fontWeight: '900', color: C.white },
  levelName:     { fontSize: 14, fontWeight: '800', color: C.navy, textAlign: 'right' },
  levelMeta:     { fontSize: 11, color: C.gray, marginTop: 2, textAlign: 'right' },
  levelDot: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  levelDotTxt: { fontSize: 14, fontWeight: '900' },
});

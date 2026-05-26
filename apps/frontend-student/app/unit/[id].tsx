/**
 * Unit detail — shows all lessons for a unit with linear gating.
 * Brand theme: Navy header / Yellow accents / Cream background.
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '@/api/client';
import type { Unit, Lesson, StudentProgress } from '@/api/levels';
import { C, shadow }         from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

export default function UnitDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', id],
    queryFn: () =>
      client
        .get<{ data: Unit[] }>('/student/my-units')
        .then((r) => r.data.data.find((u) => u.id === Number(id)) ?? null),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () =>
      client
        .get<{ progress: StudentProgress[] }>('/student/progress')
        .then((r) => r.data.progress ?? []),
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <ActivityIndicator size="large" color={C.yellow} />
      </View>
    );
  }

  if (!unit) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <Ionicons name="alert-circle-outline" size={40} color={C.gray} />
        <Text style={{ color: C.gray, marginTop: 12, fontWeight: '600' }}>
          الوحدة غير موجودة أو غير مفعّلة
        </Text>
      </View>
    );
  }

  const lessons: Lesson[] = unit.lessons ?? [];
  const passedIds = new Set(
    progress
      .filter((p) => p.lesson_completed)
      .map((p) => p.lesson_id),
  );

  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    return passedIds.has(lessons[index - 1].id);
  };

  const pct = lessons.length > 0 ? Math.round((passedIds.size / lessons.length) * 100) : 0;
  const allDone = passedIds.size >= lessons.length && lessons.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Navy header ──────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        {/* Decorative dots */}
        <View style={[styles.dot, { width: 80, height: 80, top: -20, right: -20 }]} />
        <View style={[styles.dot, { width: 40, height: 40, bottom: 10, left: 10 }]} />

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={2}>{unit.name}</Text>
        <Text style={styles.headerSub}>
          {lessons.length} درس · {passedIds.size} مكتمل
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressPct}>{pct}% مكتمل</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* Lessons list */}
        {lessons.map((lesson, idx) => {
          const unlocked = isUnlocked(idx);
          const passed   = passedIds.has(lesson.id);
          const prog     = progress.find((p) => p.lesson_id === lesson.id);

          return (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonCard, !unlocked && styles.lessonLocked]}
              onPress={
                unlocked
                  ? () => router.push({ pathname: '/lesson/[id]', params: { id: String(lesson.id) } })
                  : undefined
              }
              activeOpacity={unlocked ? 0.82 : 1}
            >
              {/* Number / status bubble */}
              <View style={[
                styles.bubble,
                passed && styles.bubblePassed,
                !unlocked && styles.bubbleLocked,
              ]}>
                {!unlocked
                  ? <Ionicons name="lock-closed" size={13} color={C.gray} />
                  : passed
                  ? <Ionicons name="checkmark" size={15} color={C.white} />
                  : <Text style={styles.bubbleTxt}>{idx + 1}</Text>
                }
              </View>

              {/* Lesson info */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.lessonTitle, !unlocked && styles.textMuted]} numberOfLines={2}>
                  {lesson.title}
                </Text>
                {prog?.best_score !== null && prog?.best_score !== undefined && (
                  <View style={styles.scoreRow}>
                    <Ionicons name="trophy" size={11} color={C.yellow} />
                    <Text style={styles.scoreText}>{prog.best_score}%</Text>
                  </View>
                )}
              </View>

              {/* Right icon */}
              {unlocked && (
                <View style={[styles.actionIcon, passed && styles.actionIconDone]}>
                  <Ionicons
                    name={passed ? 'refresh' : 'play'}
                    size={16}
                    color={passed ? C.success : C.yellow}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* End-of-unit test */}
        {unit.has_end_test && (
          <TouchableOpacity
            style={[styles.testCard, !allDone && styles.testLocked]}
            activeOpacity={allDone ? 0.82 : 1}
            disabled={!allDone}
          >
            <View style={[styles.testIcon, allDone && styles.testIconActive]}>
              <Ionicons
                name="ribbon"
                size={22}
                color={allDone ? C.navy : C.gray}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.testTitle, !allDone && styles.textMuted]}>
                اختبار نهاية الوحدة
              </Text>
              <Text style={styles.testSub}>
                {allDone
                  ? '✅ يمكنك إجراء الاختبار الآن'
                  : `أكمل جميع الدروس لفتح الاختبار`}
              </Text>
            </View>
            {allDone && <Ionicons name="chevron-back" size={18} color={C.amber} />}
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: C.amber,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.18,
  },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    padding: 7,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '900', color: C.navy,
    textAlign: 'right', marginBottom: 4,
  },
  headerSub: {
    fontSize: 13, color: C.navyMid, fontWeight: '600',
    textAlign: 'right', marginBottom: 14,
  },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: C.navy, borderRadius: 3 },
  progressPct: {
    fontSize: 11, fontWeight: '700', color: C.navyMid,
    textAlign: 'right', marginTop: 5,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 32 },

  // ── Lesson card ───────────────────────────────────────────────────────────
  lessonCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    ...shadow.sm,
  },
  lessonLocked: { opacity: 0.50 },

  bubble: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.navy,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  bubblePassed: { backgroundColor: C.success },
  bubbleLocked: { backgroundColor: '#E5E7EB' },
  bubbleTxt:    { fontSize: 14, fontWeight: '900', color: C.white },

  lessonTitle: {
    fontSize: 14, fontWeight: '700', color: C.navy, textAlign: 'right',
  },
  textMuted: { color: C.gray },
  scoreRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 },
  scoreText: { fontSize: 12, fontWeight: '700', color: C.amber },

  actionIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  actionIconDone: { backgroundColor: '#DCFCE7' },

  // ── End-of-unit test ──────────────────────────────────────────────────────
  testCard: {
    backgroundColor: C.inputBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    marginTop: 8,
    ...shadow.sm,
  },
  testLocked: { opacity: 0.50 },
  testIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  testIconActive: { backgroundColor: C.yellow },
  testTitle: { fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'right' },
  testSub:   { fontSize: 12, color: C.grayMid, marginTop: 3, textAlign: 'right' },
});

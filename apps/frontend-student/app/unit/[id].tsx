/**
 * Unit detail — shows all 12 lessons for a unit with linear gating.
 * Lesson N+1 is locked until lesson N quiz is passed at ≥ 60%.
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import client from '@/api/client';
import type { Unit, Lesson, StudentProgress } from '@/api/levels';

export default function UnitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch enrolled units and find this one (with its lessons)
  const { data: unit, isLoading: unitLoading } = useQuery({
    queryKey: ['unit', id],
    queryFn:  () =>
      client
        .get<{ data: Unit[] }>('/student/my-units')
        .then((r) => r.data.data.find((u) => u.id === Number(id)) ?? null),
  });

  // Fetch student progress to determine which lessons are unlocked
  const { data: progress = [] } = useQuery({
    queryKey: ['progress'],
    queryFn:  () =>
      client
        .get<{ data: StudentProgress[] }>('/student/progress')
        .then((r) => r.data.data),
  });

  if (unitLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!unit) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#6b7280' }}>الوحدة غير موجودة أو غير مفعّلة</Text>
      </View>
    );
  }

  const lessons: Lesson[] = unit.lessons ?? [];
  const isDone = unit.enrollment?.status === 'completed';

  // Build a set of passed lesson IDs (score >= 60)
  const passedIds = new Set(
    progress
      .filter((p) => p.quiz_score !== null && p.quiz_score >= 60)
      .map((p) => p.lesson_id),
  );

  // Lesson N is unlocked if: it's the first OR the previous lesson is passed
  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    return passedIds.has(lessons[index - 1].id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: unit.name,
          headerBackTitle: 'رجوع',
          headerStyle: { backgroundColor: '#10b981' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Unit header */}
        <View style={styles.unitHeader}>
          <Text style={styles.unitName}>{unit.name}</Text>
          <Text style={styles.unitMeta}>
            {lessons.length} درس · {passedIds.size} مكتمل
          </Text>
          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[styles.progressFill, { width: `${(passedIds.size / Math.max(lessons.length, 1)) * 100}%` }]}
            />
          </View>
        </View>

        {/* Lessons list */}
        {lessons.map((lesson, idx) => {
          const unlocked = isUnlocked(idx);
          const passed   = passedIds.has(lesson.id);
          const prog     = progress.find((p) => p.lesson_id === lesson.id);

          return (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonCard, !unlocked && styles.lessonLocked]}
              onPress={unlocked ? () => router.push({ pathname: '/lesson/[id]', params: { id: String(lesson.id) } }) : undefined}
              activeOpacity={unlocked ? 0.8 : 1}
            >
              {/* Lesson number bubble */}
              <View style={[styles.bubble, passed && styles.bubblePassed, !unlocked && styles.bubbleLocked]}>
                {!unlocked
                  ? <Ionicons name="lock-closed" size={14} color="#9ca3af" />
                  : passed
                  ? <Ionicons name="checkmark" size={16} color="#fff" />
                  : <Text style={styles.bubbleText}>{idx + 1}</Text>
                }
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.lessonTitle, !unlocked && { color: '#9ca3af' }]}>
                  {lesson.title}
                </Text>
                {prog?.quiz_score !== undefined && prog.quiz_score !== null && (
                  <Text style={styles.lessonScore}>
                    درجة الاختبار: {prog.quiz_score}%
                  </Text>
                )}
              </View>

              {unlocked && (
                <Ionicons
                  name={passed ? 'refresh-outline' : 'play-circle-outline'}
                  size={22}
                  color={passed ? '#10b981' : '#3b82f6'}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Unit end test (shown after all lessons passed) */}
        {unit.has_end_test && (
          <View style={[
            styles.testCard,
            lessons.length > 0 && passedIds.size < lessons.length && styles.testLocked,
          ]}>
            <Ionicons
              name="ribbon-outline"
              size={24}
              color={passedIds.size >= lessons.length ? '#f59e0b' : '#d1d5db'}
            />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.testTitle}>اختبار نهاية الوحدة</Text>
              <Text style={styles.testSub}>
                {passedIds.size >= lessons.length
                  ? 'يمكنك الآن إجراء الاختبار'
                  : `أكمل جميع الدروس لفتح الاختبار`}
              </Text>
            </View>
            {passedIds.size >= lessons.length && (
              <Ionicons name="chevron-forward" size={18} color="#f59e0b" />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },

  unitHeader: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  unitName: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right' },
  unitMeta: { fontSize: 13, color: '#6b7280', textAlign: 'right', marginTop: 4, marginBottom: 12 },
  progressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#10b981', borderRadius: 3 },

  lessonCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  lessonLocked: { opacity: 0.55 },
  bubble: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  bubblePassed: { backgroundColor: '#10b981' },
  bubbleLocked: { backgroundColor: '#f3f4f6' },
  bubbleText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right' },
  lessonScore: { fontSize: 12, color: '#10b981', marginTop: 2, textAlign: 'right' },

  testCard: {
    backgroundColor: '#fffbeb', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fde68a', marginTop: 8,
  },
  testLocked: { opacity: 0.5 },
  testTitle: { fontSize: 15, fontWeight: '700', color: '#92400e', textAlign: 'right' },
  testSub:   { fontSize: 12, color: '#b45309', marginTop: 3, textAlign: 'right' },
});

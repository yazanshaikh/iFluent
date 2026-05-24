/**
 * Levels tab — shows the student's enrolled units, grouped by level.
 * Locked levels appear as dimmed cards with a lock icon.
 */
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { levelsApi, type Unit } from '@/api/levels';

// ─── Level colour map ─────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  A1: '#10b981',
  A2: '#3b82f6',
  B1: '#8b5cf6',
  B2: '#f59e0b',
  FT: '#ef4444',
};

// ─── Unit card ────────────────────────────────────────────────────────────────

function UnitCard({ unit, onPress }: { unit: Unit; onPress: () => void }) {
  const isLocked  = !unit.enrollment;
  const isDone    = unit.enrollment?.status === 'completed';
  const color     = LEVEL_COLORS[unit.level_id?.toString()] ?? '#10b981';

  return (
    <TouchableOpacity
      style={[styles.unitCard, isLocked && styles.unitCardLocked]}
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.8}
    >
      {/* Left accent */}
      <View style={[styles.unitAccent, { backgroundColor: isLocked ? '#e5e7eb' : color }]} />

      <View style={styles.unitBody}>
        <View style={styles.unitTop}>
          <Text style={[styles.unitName, isLocked && styles.textMuted]}>
            {unit.name}
          </Text>
          {isLocked ? (
            <Ionicons name="lock-closed" size={16} color="#d1d5db" />
          ) : isDone ? (
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          ) : null}
        </View>
        <Text style={styles.unitMeta}>
          {unit.lesson_count} درس
          {unit.has_end_test ? ' · اختبار وحدة' : ''}
        </Text>
        {!isLocked && (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${isDone ? 100 : 30}%`, backgroundColor: color },
              ]}
            />
          </View>
        )}
      </View>

      {!isLocked && (
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LevelsScreen() {
  const router = useRouter();

  const { data: myUnits, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['my-units'],
    queryFn:  levelsApi.myUnits,
  });

  const { data: allLevels } = useQuery({
    queryKey: ['all-levels'],
    queryFn:  levelsApi.listLevels,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Group enrolled units by level name
  const enrolledByLevel: Record<string, Unit[]> = {};
  (myUnits ?? []).forEach((unit) => {
    const key = unit.name; // grouping by first word (level name)
    if (!enrolledByLevel[key]) enrolledByLevel[key] = [];
    enrolledByLevel[key].push(unit);
  });

  const hasEnrolled = (myUnits?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>مستوياتي</Text>
          <Text style={styles.headerSub}>مسار التعلم الخاص بك</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{myUnits?.length ?? 0} وحدة</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#10b981" />}
        showsVerticalScrollIndicator={false}
      >
        {hasEnrolled ? (
          myUnits?.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onPress={() => router.push({ pathname: '/unit/[id]', params: { id: String(unit.id) } })}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="school-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد وحدات مفعّلة</Text>
            <Text style={styles.emptySub}>
              بمجرد اشتراكك وموافقة الإدارة، ستظهر وحداتك هنا
            </Text>
          </View>
        )}

        {/* All levels roadmap */}
        <Text style={styles.sectionTitle}>خريطة المسار الكاملة</Text>
        {(allLevels ?? []).map((level) => (
          <View key={level.id} style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[level.code] ?? '#10b981' }]}>
              <Text style={styles.levelBadgeText}>{level.code}</Text>
            </View>
            <View>
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelMeta}>
                {level.total_units} وحدات · {level.total_lessons} درس
              </Text>
            </View>
          </View>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: '#d1fae5', marginTop: 2 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  scroll: { padding: 16, paddingBottom: 32 },

  unitCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unitCardLocked: { opacity: 0.55 },
  unitAccent: { width: 5, alignSelf: 'stretch' },
  unitBody: { flex: 1, padding: 14 },
  unitTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  unitName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  unitMeta: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  progressBarBg: { height: 4, backgroundColor: '#f3f4f6', borderRadius: 2 },
  progressBarFill: { height: 4, borderRadius: 2 },
  textMuted: { color: '#9ca3af' },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: '#9ca3af', marginTop: 8, textAlign: 'center', lineHeight: 20 },

  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#374151',
    marginTop: 8, marginBottom: 12, textAlign: 'right',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  levelBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  levelBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  levelName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  levelMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});

/** The teacher's group classes. The admin schedules them from the CRM. */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupClassesApi } from '@/api/groupClasses';
import { formatClassTime } from '@/lib/classSlots';
import { C, shadow, STATUS_COLOR } from '@/theme';

const STATUS_TEXT = { scheduled: 'Scheduled', active: 'Live', completed: 'Completed', cancelled: 'Cancelled' } as const;

export default function GroupClassesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['teacher-group-classes'],
    queryFn:  groupClassesApi.list,
  });

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitle}>Group Classes</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={C.sky} />
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.sky} />}
        >
          {data.length === 0 && <Text style={s.empty}>No group classes assigned to you yet.</Text>}
          {data.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.card}
              onPress={() => router.push({ pathname: '/group-class/[id]', params: { id: String(item.id) } })}
              activeOpacity={0.85}
            >
              <View style={s.cardTop}>
                <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                <Text style={[s.status, { color: item.status === 'scheduled' ? C.sky : STATUS_COLOR[item.status] ?? C.gray }]}>
                  {STATUS_TEXT[item.status]}
                </Text>
              </View>
              <Text style={s.meta}>{item.lesson?.title ?? 'No lesson'}</Text>
              <Text style={s.meta}>{formatClassTime(item.scheduled_at)}</Text>
              <Text style={s.meta}>{item.registered_count} / {item.max_seats} students</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.sky, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.white },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: C.grayMid, padding: 32, fontWeight: '600' },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, gap: 4, ...shadow.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: C.grayDark },
  status: { fontSize: 12, fontWeight: '800' },
  meta: { fontSize: 13, color: C.grayMid },
});

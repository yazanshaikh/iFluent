/**
 * Requests Center — مركز الطلبات
 * Tabs: Demo | Core | Private | Group
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { requestsApi, type SessionRequest } from '@/api/requests';
import { C, shadow, STATUS_COLOR, STATUS_LABEL } from '@/theme';

type Tab = 'demo' | 'core' | 'private' | 'group';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'demo',    label: 'تقييمية',  icon: 'star-outline' },
  { key: 'core',    label: 'أساسية',   icon: 'book-outline' },
  { key: 'private', label: 'خاصة',     icon: 'person-outline' },
  { key: 'group',   label: 'جماعية',   icon: 'people-outline' },
];

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

function RequestCard({ req, onAccept, onReject }: {
  req: SessionRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  const statusColor = STATUS_COLOR[req.status] ?? C.gray;
  const isPending   = req.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusTxt, { color: statusColor }]}>
              {STATUS_LABEL[req.status] ?? req.status}
            </Text>
          </View>
          <Text style={styles.cardTime}>{fmt(req.scheduled_at)}</Text>
        </View>

        {/* Student */}
        <Text style={styles.cardStudent}>{req.student?.name ?? 'طالب'}</Text>

        {/* Lesson */}
        {req.lesson?.title && (
          <View style={styles.cardMeta}>
            <Ionicons name="book-outline" size={13} color={C.grayMid} />
            <Text style={styles.cardMetaTxt}>{req.lesson.title}</Text>
          </View>
        )}

        {/* Actions — only for pending */}
        {isPending && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={16} color={C.error} />
              <Text style={styles.rejectTxt}>رفض</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
              <LinearGradient colors={[C.sky, C.skyDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptGrad}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.acceptTxt}>قبول</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function RequestsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const [tab, setTab] = useState<Tab>('demo');

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey:  ['requests', tab],
    queryFn:   () => requestsApi.list(tab),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => requestsApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (e: any) => Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر قبول الطلب'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => requestsApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
    onError: (e: any) => Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر رفض الطلب'),
  });

  const handleReject = (id: number) => {
    Alert.alert('رفض الطلب', 'هل تريد رفض هذا الطلب؟', [
      { text: 'تراجع', style: 'cancel' },
      { text: 'رفض', style: 'destructive', onPress: () => rejectMutation.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      {/* Header */}
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>مركز الطلبات</Text>
        <Text style={styles.headerSub}>{data.length} طلب معلق</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={t.icon as any}
              size={15}
              color={tab === t.key ? C.sky : C.grayMid}
            />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.sky} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={C.sky} style={{ marginTop: 40 }} />
        ) : data.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="inbox-outline" size={52} color={C.skyLight} />
            <Text style={styles.emptyTxt}>لا توجد طلبات في هذه الفئة</Text>
          </View>
        ) : (
          data.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onAccept={() => acceptMutation.mutate(req.id)}
              onReject={() => handleReject(req.id)}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 2 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 4,
    ...shadow.sm,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12,
  },
  tabItemActive:  { backgroundColor: C.cream },
  tabLabel:       { fontSize: 12, fontWeight: '600', color: C.grayMid },
  tabLabelActive: { color: C.sky, fontWeight: '800' },

  scroll: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 18,
    flexDirection: 'row', overflow: 'hidden',
    ...shadow.sm,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },

  cardTime:    { fontSize: 11, color: C.grayMid },
  cardStudent: { fontSize: 16, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginBottom: 6 },

  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 },
  cardMetaTxt: { fontSize: 12, color: C.grayMid },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.error + '55',
  },
  rejectTxt:  { fontSize: 14, fontWeight: '700', color: C.error },
  acceptBtn:  { flex: 2, borderRadius: 12, overflow: 'hidden' },
  acceptGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  acceptTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },

  empty: { alignItems: 'center', gap: 12, marginTop: 60 },
  emptyTxt: { fontSize: 14, color: C.grayMid, fontWeight: '600' },
});

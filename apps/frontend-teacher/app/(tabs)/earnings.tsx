/**
 * Earnings — Earnings
 */
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { earningsApi, type EarningEntry } from '@/api/earnings';
import { useAuthStore } from '@/stores/authStore';
import { C, shadow } from '@/theme';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Amman',
  });
}

const TYPE_LABEL: Record<string, string> = {
  demo:    'Assessment',
  core:    'Core',
  private: 'Private',
  group:   'Group',
};

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn:  earningsApi.list,
    staleTime: 60_000,
  });

  const total   = data?.total_balance   ?? user?.balance ?? 0;
  const monthly = data?.monthly_balance ?? 0;
  const history = data?.history ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      {/* Header */}
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Earnings</Text>

        <View style={styles.balanceWrap}>
          <View style={styles.balanceCard}>
            <Ionicons name="wallet" size={24} color={C.sky} />
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmt}>{total} JOD</Text>
          </View>
          <View style={styles.balanceCard}>
            <Ionicons name="calendar" size={24} color={C.sky} />
            <Text style={styles.balanceLabel}>This Month</Text>
            <Text style={styles.balanceAmt}>{monthly} JOD</Text>
          </View>
        </View>
      </LinearGradient>

      {/* History */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Earnings History</Text>

        {isLoading ? (
          <ActivityIndicator color={C.sky} style={{ marginTop: 40 }} />
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={52} color={C.skyLight} />
            <Text style={styles.emptyTxt}>No earnings yet</Text>
          </View>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryDate}>{fmt(entry.credited_at)}</Text>
                <Text style={styles.entryStudent}>{entry.student_name ?? '—'}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeTxt}>{TYPE_LABEL[entry.session_type] ?? entry.session_type}</Text>
                </View>
              </View>
              <Text style={styles.entryAmt}>+{entry.amount} JOD</Text>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right', marginBottom: 20 },
  balanceWrap: { flexDirection: 'row', gap: 12 },
  balanceCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20,
    padding: 18, alignItems: 'center', gap: 6, ...shadow.sm,
  },
  balanceLabel: { fontSize: 12, color: C.grayMid, fontWeight: '600' },
  balanceAmt:   { fontSize: 22, fontWeight: '900', color: C.skyDark },

  scroll:       { padding: 16, gap: 10, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.grayDark, textAlign: 'right', marginBottom: 8 },

  entryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...shadow.sm,
  },
  entryLeft:    { gap: 4 },
  entryDate:    { fontSize: 12, color: C.grayMid },
  entryStudent: { fontSize: 15, fontWeight: '700', color: C.grayDark },
  typeBadge:    { backgroundColor: C.cream, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  typeTxt:      { fontSize: 11, color: C.sky, fontWeight: '600' },
  entryAmt:     { fontSize: 18, fontWeight: '900', color: C.success },

  empty:    { alignItems: 'center', gap: 12, marginTop: 60 },
  emptyTxt: { fontSize: 14, color: C.grayMid, fontWeight: '600' },
});

/**
 * Profile — حسابي
 */
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { C, shadow } from '@/theme';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={18} color={C.sky} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const storeUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Fetch fresh profile on every visit — picks up commission changes from CRM
  const { data: freshProfile } = useQuery({
    queryKey:  ['teacher-me'],
    queryFn:   authApi.me,
    staleTime: 30_000,
  });

  // Merge: fresh data takes priority over cached store
  const user = freshProfile
    ? { ...storeUser, ...freshProfile }
    : storeUser;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد الخروج من حسابك؟', [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          try { await authApi.logout(); } catch {}
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      {/* Header */}
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={44} color={C.sky} />
        </View>
        <Text style={styles.name}>{user?.name ?? 'المعلم'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        {user?.teacher_code && (
          <View style={styles.codeBadge}>
            <Text style={styles.codeTxt}>كود المعلم: {user.teacher_code}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero stats row */}
        <View style={styles.statsRow}>
          {/* Balance */}
          <View style={[styles.statCard, styles.statCardBalance]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>{Number(user?.balance ?? 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>الرصيد (د.أ)</Text>
          </View>

          {/* Rating */}
          <View style={[styles.statCard, styles.statCardRating]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>
              {user?.avg_rating ? user.avg_rating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>تقييم الطلاب</Text>
            {user?.avg_rating && (
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map((i) => (
                  <Text key={i} style={{ fontSize: 10, color: i <= Math.round(user.avg_rating!) ? '#f59e0b' : '#d1d5db' }}>★</Text>
                ))}
              </View>
            )}
          </View>

          {/* Sessions */}
          <View style={[styles.statCard, styles.statCardSessions]}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statValue}>{user?.sessions_count ?? 0}</Text>
            <Text style={styles.statLabel}>الحصص المكتملة</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>بيانات الحساب</Text>
          {user?.email && (
            <InfoRow icon="mail-outline" label="البريد الإلكتروني" value={user.email} />
          )}
          {user?.teacher_code && (
            <InfoRow icon="id-card-outline" label="كود المعلم" value={user.teacher_code} />
          )}
          <InfoRow
            icon="cash-outline"
            label="نسبة العمولة"
            value={user?.commission_rate ? `${user.commission_rate} د.أ / حصة` : '—'}
          />
          <InfoRow
            icon="wallet-outline"
            label="الرصيد الحالي"
            value={`${Number(user?.balance ?? 0).toFixed(2)} د.أ`}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={styles.logoutTxt}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center', paddingBottom: 32,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, ...shadow.md,
  },
  name:      { fontSize: 22, fontWeight: '900', color: '#fff' },
  email:     { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  codeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 10,
  },
  codeTxt: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  scroll: { padding: 16, gap: 14 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 4,
    shadowColor: C.sky, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  statCardBalance: { borderTopWidth: 3, borderTopColor: '#22C55E' },
  statCardRating:  { borderTopWidth: 3, borderTopColor: '#F59E0B' },
  statCardSessions:{ borderTopWidth: 3, borderTopColor: C.sky },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: '900', color: C.grayDark },
  statLabel: { fontSize: 10, color: C.grayMid, textAlign: 'center' },
  starsRow:  { flexDirection: 'row', gap: 1, marginTop: 2 },
  card:   { backgroundColor: '#fff', borderRadius: 20, padding: 20, ...shadow.sm },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginBottom: 16 },

  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon:  { width: 38, height: 38, borderRadius: 12, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center' },
  infoText:  { flex: 1, alignItems: 'flex-end' },
  infoLabel: { fontSize: 11, color: C.grayMid },
  infoValue: { fontSize: 14, fontWeight: '700', color: C.grayDark, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#FFF5F5', borderWidth: 1.5, borderColor: '#FCA5A5',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: C.error },
});

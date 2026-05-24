/**
 * Profile tab — student info, logout.
 */
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import client from '@/api/client';

interface Profile {
  id:    number;
  name:  string;
  phone: string;
}

export default function ProfileScreen() {
  const router    = useRouter();
  const { user, clearAuth } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => client.get<{ data: Profile }>('/student/profile').then((r) => r.data.data),
  });

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          try { await authApi.logout(); } catch { /* ignore */ }
          await clearAuth();
          router.replace('/(auth)/phone');
        },
      },
    ]);
  };

  const displayName  = profile?.name ?? user?.name ?? '…';
  const displayPhone = profile?.phone ?? user?.phone ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ملفي الشخصي</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.phone}>{displayPhone}</Text>
      </View>

      {/* Info cards */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={20} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>الاسم الكامل</Text>
            <Text style={styles.rowValue}>{displayName}</Text>
          </View>
        </View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#f3f4f6' }]}>
          <Ionicons name="call-outline" size={20} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>رقم الهاتف</Text>
            <Text style={styles.rowValue}>{displayPhone}</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <Text style={styles.version}>iFluent Student v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#10b981',
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name:  { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 12 },
  phone: { fontSize: 14, color: '#6b7280', marginTop: 4, letterSpacing: 1 },

  section: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16,
  },
  rowLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: '600', color: '#111827', textAlign: 'right' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#fecaca',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },

  version: { fontSize: 11, color: '#d1d5db', textAlign: 'center', marginTop: 24 },
});

/**
 * Settings screen — app preferences + logout.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Switch, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { authApi }      from '@/api/auth';
import { registerForPushNotifications, unregisterPushNotifications } from '@/hooks/usePushNotifications';
import { C, shadow }          from '@/theme';
import { useAnimatedHeader }  from '@/hooks/useAnimatedHeader';

// ─── Row ────────────────────────────────────────────────────────────────────

function SettingRow({
  icon, iconBg, iconColor, label, value, onPress, last = false,
  rightEl,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string; iconColor: string;
  label: string; value?: string;
  onPress?: () => void; last?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress && !rightEl}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {rightEl ?? (onPress && <Ionicons name="chevron-back" size={15} color={C.gray} />)}
    </TouchableOpacity>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const [notifOn,    setNotifOn]    = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleNotifToggle = async (value: boolean) => {
    setNotifOn(value);
    if (value) {
      await registerForPushNotifications();
    } else {
      await unregisterPushNotifications();
    }
  };
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try { await authApi.logout(); } catch { /* ignore */ }
            await clearAuth();
            router.replace('/(auth)/phone');
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 70, height: 70, top: -18, right: -18 }]} />
        <View style={[styles.dot, { width: 36, height: 36, bottom: 8, left: 14 }]} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات ⚙️</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* Account info */}
        <Text style={styles.sectionLabel}>الحساب</Text>
        <View style={styles.card}>
          <SettingRow
            icon="person"      iconBg={C.cream}    iconColor={C.amber}
            label="الاسم الكامل"  value={user?.name}
          />
          <SettingRow
            icon="call"        iconBg="#EFF6FF"    iconColor={C.info}
            label="رقم الهاتف"   value={user?.phone}
            last
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>التفضيلات</Text>
        <View style={styles.card}>
          <SettingRow
            icon="notifications" iconBg="#FEF3C7" iconColor={C.amber}
            label="الإشعارات"
            value="تذكير قبل الحصة بـ 10 دقائق"
            rightEl={
              <Switch
                value={notifOn}
                onValueChange={handleNotifToggle}
                trackColor={{ false: '#E5E7EB', true: C.yellow }}
                thumbColor={C.white}
              />
            }
          />
          <SettingRow
            icon="language"    iconBg="#F0FDF4"    iconColor={C.success}
            label="اللغة"       value="العربية"
            rightEl={
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>قريباً</Text>
              </View>
            }
            last
          />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>الحساب</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.80}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#FEF2F2' }]}>
              {loggingOut
                ? <ActivityIndicator size="small" color={C.error} />
                : <Ionicons name="log-out-outline" size={18} color={C.error} />
              }
            </View>
            <Text style={styles.logoutLabel}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionTxt}>الإصدار 1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: C.amber, shadowOpacity: 0.28,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  dot: { position: 'absolute', borderRadius: 999, backgroundColor: C.white, opacity: 0.18 },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.40)', borderRadius: 10,
    padding: 7, marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right' },

  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: C.gray,
    textAlign: 'right', marginBottom: 8, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.white, borderRadius: 20,
    overflow: 'hidden', ...shadow.sm,
  },
  dangerCard: { borderWidth: 1.5, borderColor: '#FECACA' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowIcon:   { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowLabel:  { fontSize: 14, fontWeight: '700', color: C.navy, textAlign: 'right' },
  rowValue:  { fontSize: 13, color: C.gray, marginTop: 2, textAlign: 'right' },

  logoutRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, gap: 12,
  },
  logoutLabel: { flex: 1, fontSize: 15, fontWeight: '800', color: C.error, textAlign: 'right' },

  versionTxt: {
    fontSize: 12, color: C.gray, fontWeight: '500',
    textAlign: 'center', marginTop: 20,
  },

  comingSoonBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  comingSoonText: {
    fontSize: 11, fontWeight: '700',
    color: '#B45309', letterSpacing: 0.3,
  },
});

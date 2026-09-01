/**
 * Settings screen — app preferences + logout.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Switch, Animated, Linking,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { authApi }      from '@/api/auth';
import { profileApi }   from '@/api/profile';
import { registerForPushNotifications, unregisterPushNotifications } from '@/hooks/usePushNotifications';
import { C, shadow }          from '@/theme';
import { EvalBookingModal }  from '@/components/EvalBookingModal';
import { isIapSupported }    from '@/services/iap';
import { useAnimatedHeader }  from '@/hooks/useAnimatedHeader';

// Support contacts — same details shown on the landing page footer.
const SUPPORT_EMAIL = 'ifluent0@gmail.com';
const SUPPORT_PHONE = '0780105274';

/** 0780105274 → https://wa.me/962780105274 */
function toWhatsAppUrl(phone: string): string {
  let digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `962${digits.slice(1)}`;
  else if (!digits.startsWith('962')) digits = `962${digits}`;
  return `https://wa.me/${digits}`;
}

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

// ─── Account deletion request modal ──────────────────────────────────────────

function DeleteAccountModal({
  visible, onClose, onSubmit, submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      appAlert('سبب مطلوب', 'يرجى كتابة سبب حذف الحساب (3 أحرف على الأقل).');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={del.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />

          <View style={[del.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={del.header}>
              <View style={del.headerIcon}>
                <Ionicons name="trash-outline" size={28} color={C.error} />
              </View>
              <Text style={del.headerTitle}>طلب حذف الحساب</Text>
              <Text style={del.headerSub}>أخبرنا عن سبب رغبتك في حذف حسابك</Text>
            </View>

            <ScrollView
              contentContainerStyle={del.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={del.label}>سبب حذف الحساب</Text>
              <View style={del.inputWrap}>
                <TextInput
                  style={del.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="...اكتب سبب طلبك هنا"
                  placeholderTextColor={C.gray}
                  multiline
                  textAlign="right"
                  textAlignVertical="top"
                  maxLength={1000}
                  autoFocus
                  editable={!submitting}
                />
              </View>

              <View style={del.btnRow}>
                <TouchableOpacity
                  style={del.cancelBtn}
                  onPress={handleClose}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Text style={del.cancelTxt}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[del.submitBtn, (reason.trim().length < 3 || submitting) && del.submitBtnOff]}
                  onPress={handleSubmit}
                  disabled={reason.trim().length < 3 || submitting}
                  activeOpacity={0.85}
                >
                  {submitting
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <Text style={del.submitTxt}>إرسال الطلب</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const [notifOn,    setNotifOn]    = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

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

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      appAlert('تعذر الفتح', 'لم نتمكن من فتح التطبيق المطلوب. حاول لاحقاً.'),
    );
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try { await authApi.logout(); } catch { /* ignore */ }
    await clearAuth();
    router.replace('/(auth)/phone');
  };

  const handleLogout = () => {
    // appAlert maps to Alert.alert on native and window.confirm on web.
    appAlert(
      'تسجيل الخروج',
      'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: doLogout },
      ],
    );
  };

  const handleDeleteRequest = async (reason: string) => {
    setSubmittingDelete(true);
    try {
      await profileApi.requestAccountDeletion(reason);
      setDeleteModalVisible(false);
      appAlert(
        'تم إرسال الطلب',
        'رح يتم مراجعة طلبك من قبل فريق الدعم وسيتم التواصل معك قريباً.',
      );
    } catch {
      appAlert('تعذر الإرسال', 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى لاحقاً.');
    } finally {
      setSubmittingDelete(false);
    }
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

        {/* Paid assessment — in-app purchase (iOS only; Android has no billing yet) */}
        {isIapSupported && (
          <>
            <Text style={styles.sectionLabel}>الحصص التقييمية</Text>
            <View style={styles.card}>
              <SettingRow
                icon="calendar" iconBg="#FEF3C7" iconColor={C.amber}
                label="احجز حصة تقييمية"
                value="1.99 د.أ"
                onPress={() => setBookingVisible(true)}
                last
              />
            </View>
          </>
        )}

        {/* Policies */}
        <Text style={styles.sectionLabel}>الخصوصية والسياسات</Text>
        <View style={styles.card}>
          <SettingRow
            icon="shield-checkmark" iconBg="#EEF2FF" iconColor={C.navyLight}
            label="سياسة الخصوصية"
            value="سياسة المنصة وحماية البيانات"
            onPress={() => router.push('/policies')}
            last
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>تواصل مع الدعم الفني أو لحذف الحساب</Text>
        <View style={styles.card}>
          <SettingRow
            icon="mail" iconBg="#EFF6FF" iconColor={C.info}
            label="البريد الإلكتروني"
            value={SUPPORT_EMAIL}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
          />
          <SettingRow
            icon="logo-whatsapp" iconBg="#F0FDF4" iconColor={C.success}
            label="واتساب"
            value={SUPPORT_PHONE}
            onPress={() => openLink(toWhatsAppUrl(SUPPORT_PHONE))}
            last
          />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>الحساب</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity
            style={[styles.logoutRow, styles.rowBorder]}
            onPress={() => setDeleteModalVisible(true)}
            activeOpacity={0.80}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={18} color={C.error} />
            </View>
            <Text style={styles.logoutLabel}>طلب حذف الحساب</Text>
          </TouchableOpacity>
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

        <EvalBookingModal
          visible={bookingVisible}
          onClose={() => setBookingVisible(false)}
          paid
        />
        <View style={{ height: 32 }} />
      </ScrollView>

      <DeleteAccountModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onSubmit={handleDeleteRequest}
        submitting={submittingDelete}
      />
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

const del = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#FEF2F2', alignItems: 'center',
    paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#FECACA',
  },
  headerIcon: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.error, marginBottom: 4 },
  headerSub:   { fontSize: 13, color: C.gray, textAlign: 'center' },

  body: { padding: 20 },
  label: {
    fontSize: 14, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 16,
    backgroundColor: '#FFFBFB', marginBottom: 24, minHeight: 120,
  },
  input: {
    padding: 14, fontSize: 15, color: C.navy, minHeight: 120,
  },

  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 15,
    backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '800', color: C.grayMid },
  submitBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 15,
    backgroundColor: C.error, alignItems: 'center',
  },
  submitBtnOff: { opacity: 0.45 },
  submitTxt: { fontSize: 15, fontWeight: '800', color: C.white },
});

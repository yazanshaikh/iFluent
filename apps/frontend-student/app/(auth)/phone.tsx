/**
 * Auth Step 1 — Phone entry with Firebase Phone Auth
 *
 * Login flow:
 *   1. Enter phone → check backend (exists?)
 *   2a. Exists    → Firebase signInWithPhoneNumber → store confirmationResult → go to verify
 *   2b. Not found → show error + "Register" button
 *
 * Register flow:
 *   1. Enter name + phone → POST /auth/register → backend creates Lead+User
 *   2. Navigate back to login with phone pre-filled
 */
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

const SECRET_CODE = '221133'; // bypass code — no SMS needed

// ── Brand palette ──────────────────────────────────────────────────────────
const C = {
  yellow:  '#FFB300',
  amber:   '#FF8F00',
  navy:    '#1A2980',
  navyMid: '#26367B',
  white:   '#FFFFFF',
  cream:   '#FFF8E1',
  inputBg: '#FFFDE7',
  border:  '#FFE082',
  gray:    '#9E9E9E',
  red:     '#EF4444',
} as const;

type Mode = 'login' | 'register';

export default function PhoneScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const setConfirmationResult = useAuthStore((s) => s.setConfirmationResult);

  const [mode,       setMode]       = useState<Mode>('login');
  const [phone,      setPhone]      = useState('');
  const [name,       setName]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [notFound,   setNotFound]   = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const switchMode = (m: Mode) => {
    setMode(m);
    setName('');
    setNotFound(false);
    setShowSecret(false);
    setSecretCode('');
  };

  // ── SECRET CODE LOGIN (bypass SMS) ─────────────────────────────────────
  const handleSecretLogin = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (cleaned.length < 9) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم الهاتف أولاً');
      return;
    }
    if (secretCode.trim() !== SECRET_CODE) {
      Alert.alert('خطأ', 'الرقم السري غير صحيح');
      return;
    }

    setLoading(true);
    try {
      const { exists } = await authApi.checkPhone(cleaned);
      if (!exists) {
        setNotFound(true);
        setShowSecret(false);
        return;
      }
      // Call backend directly with secret token — skip Firebase OTP
      const { token, user } = await authApi.secretLogin(cleaned, SECRET_CODE);
      await useAuthStore.getState().setAuth(token, user);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر تسجيل الدخول.';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (cleaned.length < 9) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    setNotFound(false);
    try {
      // Step 1: check backend
      const { exists } = await authApi.checkPhone(cleaned);

      if (!exists) {
        setNotFound(true);
        return;
      }

      // Step 2: trigger Firebase Phone Auth
      // Phone must be in E.164 format e.g. +962791234567
      const e164 = cleaned.startsWith('+') ? cleaned : `+962${cleaned.replace(/^0/, '')}`;
      const confirmation = await auth().signInWithPhoneNumber(e164);

      setConfirmationResult(confirmation);
      router.push({ pathname: '/(auth)/verify', params: { phone: cleaned } });

    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'تعذر الاتصال. حاول مجدداً.';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ───────────────────────────────────────────────────────────
  const handleRegister = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (!name.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسمك الكامل');
      return;
    }
    if (cleaned.length < 9) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    try {
      await authApi.register(name.trim(), cleaned);
      Alert.alert(
        '✅ تم التسجيل',
        'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول.',
        [{ text: 'حسناً', onPress: () => { switchMode('login'); setPhone(cleaned); } }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر التسجيل. ربما الرقم مسجل بالفعل.';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Yellow header ─────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={[styles.dot, { top: insets.top + 14, left: 24, width: 50, height: 50 }]} />
          <View style={[styles.dot, { top: insets.top + 60, right: 20, width: 28, height: 28 }]} />
          <View style={[styles.dot, { bottom: 16, left: 44, width: 18, height: 18 }]} />
          <View style={[styles.dot, { bottom: 10, right: 52, width: 12, height: 12 }]} />
          <Text style={styles.brandTitle}>iFluent</Text>
          <Text style={styles.brandSub}>رحلتك في تعلم الإنجليزية 🌟</Text>
        </View>

        {/* ── Mascot ────────────────────────────────────────────────────── */}
        <View style={styles.mascotWrap}>
          <Image
            source={require('../../assets/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        {/* ── Mode toggle ───────────────────────────────────────────────── */}
        <View style={styles.toggleWrap}>
          <View style={styles.toggleBar}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleTxt, mode === 'login' && styles.toggleTxtActive]}>
                🔑  لدي حساب
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]}
              onPress={() => switchMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleTxt, isRegister && styles.toggleTxtActive]}>
                ✨  طالب جديد
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Form card ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRegister ? 'أنشئ حسابك الآن 🎉' : 'أهلاً بعودتك! 👋'}
          </Text>
          <Text style={styles.cardSub}>
            {isRegister
              ? 'أدخل بياناتك للتسجيل في iFluent'
              : 'أدخل رقم هاتفك لاستقبال رمز التحقق'}
          </Text>

          {/* Name — register only */}
          {isRegister && (
            <>
              <Text style={styles.fieldLabel}>الاسم الكامل</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="مثال: أحمد محمد"
                textContentType="name"
                returnKeyType="next"
                placeholderTextColor={C.gray}
                autoFocus
              />
            </>
          )}

          {/* Phone */}
          <Text style={[styles.fieldLabel, isRegister && { marginTop: 14 }]}>
            رقم الهاتف
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputPhone}
              value={phone}
              onChangeText={(v) => { setPhone(v); setNotFound(false); }}
              placeholder="07xxxxxxxx"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              maxLength={15}
              placeholderTextColor={C.gray}
              autoFocus={!isRegister}
            />
            <View style={styles.flagBox}>
              <Text style={styles.flagEmoji}>🇯🇴</Text>
            </View>
          </View>

          {/* "Not found" error — login mode */}
          {notFound && (
            <View style={styles.notFoundBox}>
              <Text style={styles.notFoundTxt}>
                ⚠️ هذا الرقم غير مسجل في النظام
              </Text>
              <TouchableOpacity onPress={() => switchMode('register')}>
                <Text style={styles.notFoundLink}>إنشاء حساب جديد ←</Text>
              </TouchableOpacity>
            </View>
          )}

          {!notFound && (
            <Text style={styles.hint}>
              {isRegister
                ? '📋 سيتم إرسال رمز التحقق لهذا الرقم بعد التسجيل'
                : '📱 سيصلك رمز التحقق عبر SMS'}
            </Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, isRegister && styles.btnRegister, loading && styles.btnOff]}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnTxt}>
                  {isRegister ? 'إنشاء الحساب ✨' : 'إرسال رمز التحقق 🔑'}
                </Text>
            }
          </TouchableOpacity>

          {/* ── Secret code login — login mode only ── */}
          {!isRegister && (
            <>
              <TouchableOpacity
                onPress={() => { setShowSecret(!showSecret); setSecretCode(''); }}
                style={styles.secretToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.secretToggleTxt}>تسجيل الدخول برقم السري</Text>
              </TouchableOpacity>

              {showSecret && (
                <View style={styles.secretBox}>
                  <TextInput
                    style={styles.secretInput}
                    value={secretCode}
                    onChangeText={setSecretCode}
                    placeholder="أدخل الرقم السري"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    placeholderTextColor={C.gray}
                    textAlign="center"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.secretBtn, loading && styles.btnOff]}
                    onPress={handleSecretLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator color={C.white} size="small" />
                      : <Text style={styles.secretBtnTxt}>دخول</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <Text style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
          بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 22,
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
    overflow: 'hidden',
    shadowColor: C.amber,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    gap: 4,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.22,
  },
  brandTitle: { fontSize: 34, fontWeight: '900', color: C.navy, letterSpacing: 1.5 },
  brandSub:   { fontSize: 15, color: C.navyMid },

  mascotWrap: { alignItems: 'center', marginTop: 8, marginBottom: -8 },
  mascot:     { width: 220, height: 220 },

  toggleWrap: { paddingHorizontal: 20, marginTop: 18, marginBottom: 16 },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: C.navy,
    shadowColor: C.navy,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  toggleTxt:       { fontSize: 14, fontWeight: '700', color: C.gray },
  toggleTxtActive: { color: C.white },

  card: {
    backgroundColor: C.white,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 26,
    shadowColor: C.navy,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: C.navy, textAlign: 'right', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.gray, textAlign: 'right', lineHeight: 20, marginBottom: 20 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.navy, textAlign: 'right', marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: C.navy,
    textAlign: 'right',
    backgroundColor: C.inputBg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.inputBg,
    overflow: 'hidden',
  },
  inputPhone: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 20,
    color: C.navy,
    letterSpacing: 1.5,
    textAlign: 'left',
  },
  flagBox: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderLeftWidth: 1.5,
    borderLeftColor: C.border,
  },
  flagEmoji: { fontSize: 22 },

  notFoundBox: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  notFoundTxt:  { fontSize: 13, color: C.red, fontWeight: '600', textAlign: 'center' },
  notFoundLink: { fontSize: 14, color: C.navy, fontWeight: '800', textDecorationLine: 'underline' },

  hint: { fontSize: 12, color: C.gray, textAlign: 'right', marginTop: 8 },

  btn: {
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 22,
    shadowColor: C.navy,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  btnRegister: { backgroundColor: C.yellow, shadowColor: C.amber },
  btnOff:      { opacity: 0.55 },
  btnTxt:      { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  footer: { textAlign: 'center', fontSize: 11, color: C.gray, marginTop: 22, paddingHorizontal: 36 },

  secretToggle: { marginTop: 14, alignItems: 'center' },
  secretToggleTxt: { fontSize: 12, color: C.gray, textDecorationLine: 'underline' },

  secretBox: {
    marginTop: 12, flexDirection: 'row',
    alignItems: 'center', gap: 10,
  },
  secretInput: {
    flex: 1,
    borderWidth: 2, borderColor: C.border,
    borderRadius: 14, paddingVertical: 12,
    fontSize: 22, fontWeight: '800', color: C.navy,
    backgroundColor: C.inputBg, letterSpacing: 8,
  },
  secretBtn: {
    backgroundColor: C.navy,
    borderRadius: 14, paddingVertical: 13,
    paddingHorizontal: 22,
  },
  secretBtnTxt: { color: C.white, fontSize: 14, fontWeight: '800' },
});

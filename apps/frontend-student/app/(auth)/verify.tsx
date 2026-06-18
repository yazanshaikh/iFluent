/**
 * Auth Step 2 — OTP Verification via Firebase
 *
 * Flow:
 *   1. User enters 6-digit code from Firebase SMS
 *   2. confirmationResult.confirm(code)  ← from Zustand store
 *   3. currentUser.getIdToken()
 *   4. POST /auth/firebase-verify  { id_token }  → Sanctum token
 *   5. setAuth → navigate to app
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmOtp, sendOtp } from '@/services/firebaseAuth';
import { authApi } from '@/api/auth';
import { toE164 } from '@/lib/phone';
import { useAuthStore } from '@/stores/authStore';

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
} as const;

function splitCode(code = ''): string[] {
  const d = Array(6).fill('');
  for (let i = 0; i < Math.min(code.length, 6); i++) d[i] = code[i];
  return d;
}

export default function VerifyScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const confirmationResult    = useAuthStore((s) => s.confirmationResult);
  const clearConfirmationResult = useAuthStore((s) => s.clearConfirmationResult);
  const setAuth               = useAuthStore((s) => s.setAuth);

  const [digits,   setDigits]   = useState<string[]>(() => splitCode());
  const [loading,  setLoading]  = useState(false);
  const [resend,   setResend]   = useState(60);
  const [resending, setResending] = useState(false);

  const boxRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setResend(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // ── OTP box input ──────────────────────────────────────────────────────
  const handleChange = (val: string, idx: number) => {
    const nums = val.replace(/\D/g, '');
    if (nums.length > 1) {
      const d = Array(6).fill('');
      for (let i = 0; i < 6 && i < nums.length; i++) d[i] = nums[i];
      setDigits(d);
      boxRefs.current[Math.min(nums.length - 1, 5)]?.focus();
      return;
    }
    const d = [...digits];
    d[idx] = nums;
    setDigits(d);
    if (nums && idx < 5) boxRefs.current[idx + 1]?.focus();
  };

  const handleKey = (e: { nativeEvent: { key: string } }, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      const d = [...digits];
      d[idx - 1] = '';
      setDigits(d);
      boxRefs.current[idx - 1]?.focus();
    }
  };

  const otp = digits.join('');

  // ── Verify ────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (otp.length !== 6) {
      appAlert('تنبيه', 'أكمل إدخال الرمز المكوّن من 6 أرقام');
      return;
    }
    if (!confirmationResult) {
      appAlert('خطأ', 'انتهت جلسة التحقق. ارجع وأدخل رقمك مجدداً.');
      router.back();
      return;
    }

    setLoading(true);
    try {
      // Confirm the OTP and get the Firebase ID token (platform-agnostic).
      const idToken = await confirmOtp(confirmationResult, otp);

      // Exchange with Laravel for a Sanctum token.
      const res = await authApi.firebaseVerify(idToken);

      clearConfirmationResult();
      await setAuth(res.token, res.user);
      router.replace('/(tabs)/levels');

    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? (err?.code === 'auth/invalid-verification-code' ? 'رمز التحقق غير صحيح' : null)
        ?? err?.message
        ?? 'حدث خطأ. حاول مجدداً.';
      appAlert('خطأ', msg);
      setDigits(Array(6).fill(''));
      boxRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend via Firebase ───────────────────────────────────────────────
  // Same protections as the first send:
  //   ① 60s UI debounce (countdown) + in-flight guard → blocks rapid taps.
  //   ② request-otp gate → SHARES the same 3/hour-per-phone counter, so
  //      (first send + resends) together can't exceed the limit.
  //   ③ signInWithPhoneNumber → re-runs the SAME human/device verifier
  //      (Play Integrity / reCAPTCHA). Resend never bypasses it.
  const handleResend = async () => {
    if (resend > 0 || resending || !phone) return;

    const e164 = toE164(phone);
    if (!e164) {
      appAlert('خطأ', 'رقم الهاتف غير صالح.');
      return;
    }

    setResending(true);
    try {
      // ② shared rate-limit counter (throws 429 when the cap is reached)
      await authApi.requestOtp(phone);

      // ③ same verifier as the initial send
      const newConfirmation = await sendOtp(e164);
      useAuthStore.getState().setConfirmationResult(newConfirmation);

      setResend(60);
      setDigits(Array(6).fill(''));
      setTimeout(() => boxRefs.current[0]?.focus(), 80);
      appAlert('✅ تم', 'تم إعادة إرسال الرمز');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        appAlert(
          'محاولات كثيرة ⏳',
          err?.response?.data?.message ?? 'لقد طلبت الرمز عدة مرات. حاول لاحقاً.',
        );
        // Keep the button locked even past the 60s so they wait out the window.
        setResend(60);
      } else {
        appAlert('خطأ', err?.response?.data?.message ?? err?.message ?? 'تعذر إعادة الإرسال.');
      }
    } finally {
      setResending(false);
    }
  };

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
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.dot, { top: insets.top + 14, right: 28, width: 40, height: 40 }]} />
          <View style={[styles.dot, { top: insets.top + 55, left: 22, width: 24, height: 24 }]} />
          <View style={[styles.dot, { bottom: 28, right: 52, width: 16, height: 16 }]} />

          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backTxt}>→  رجوع</Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/mascot-verify.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        {/* ── Title ────────────────────────────────────────────────────── */}
        <View style={styles.titleArea}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>🔐 التحقق عبر رسالة sms  </Text>
          </View>
          <Text style={styles.title}>أدخل رمز التحقق</Text>
          <Text style={styles.sub}>
            أرسل إليك  رمزاً مكوّناً من 6 أرقام {'\n'}
            <Text style={styles.phoneNum}>{phone}</Text>
          </Text>
        </View>

        {/* ── OTP Card ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>رمز التحقق</Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={el => { boxRefs.current[i] = el; }}
                style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                value={d}
                onChangeText={v => handleChange(v, i)}
                onKeyPress={e => handleKey(e, i)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                autoFocus={i === 0}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.resendRow}
            onPress={handleResend}
            disabled={resend > 0 || resending}
          >
            {resending ? (
              <ActivityIndicator color={C.navy} size="small" />
            ) : (
              <Text style={[styles.resendTxt, resend > 0 && styles.resendOff]}>
                {resend > 0
                  ? `⏱️  إعادة الإرسال بعد ${resend} ثانية`
                  : '🔄  إعادة إرسال الرمز'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTxt}>
              🔥 الرمز مرسل مباشرةً   — يصل خلال ثوانٍ
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, (loading || otp.length < 6) && styles.btnOff]}
            onPress={handleVerify}
            disabled={loading || otp.length < 6}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnTxt}>تحقق والدخول ✅</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
    overflow: 'hidden',
    shadowColor: C.amber,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dot: { position: 'absolute', borderRadius: 999, backgroundColor: C.white, opacity: 0.22 },
  backBtn: {
    position: 'absolute',
    right: 18,
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backTxt: { fontSize: 14, color: C.navy, fontWeight: '700' },
  mascot:  { width: 130, height: 130 },

  titleArea: { alignItems: 'center', marginTop: 24, marginBottom: 18, paddingHorizontal: 28, gap: 8 },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8EAF6',
    borderWidth: 1.5,
    borderColor: '#C5CAE9',
  },
  badgeTxt:   { fontSize: 13, fontWeight: '700', color: C.navy },
  title:      { fontSize: 24, fontWeight: '900', color: C.navy },
  sub:        { fontSize: 14, color: C.gray, textAlign: 'center', lineHeight: 22 },
  phoneNum:   { color: C.navy, fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  card: {
    backgroundColor: C.white,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 28,
    shadowColor: C.navy,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.navy, textAlign: 'right', marginBottom: 14 },

  otpRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  otpBox: {
    width: 44,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.inputBg,
    fontSize: 26,
    fontWeight: '800',
    color: C.navy,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: C.yellow,
    shadowColor: C.amber,
    shadowOpacity: 0.30,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  resendRow:  { alignItems: 'center', paddingVertical: 12 },
  resendTxt:  { fontSize: 14, color: C.navy, fontWeight: '700' },
  resendOff:  { color: C.gray },

  infoBox: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#E8EAF6',
    borderWidth: 1,
    borderColor: '#C5CAE9',
  },
  infoTxt: { fontSize: 13, color: C.navy, textAlign: 'center', fontWeight: '600' },

  btn: {
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: C.navy,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  btnOff: { opacity: 0.40 },
  btnTxt: { color: C.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});

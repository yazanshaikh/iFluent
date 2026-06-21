/**
 * Welcome / Landing screen — shown to unauthenticated visitors.
 *
 * Sections:
 *   Hero     → iFluent logo + slogan + CTA
 *   How      → 3 quick steps ("كيف يعمل")
 *   About    → short "عنّا" blurb
 *
 * Actions:
 *   "ابدأ الآن" → modal form (name + phone) → POST /public/leads → CRM
 *   WhatsApp    → wa.me/962780105274
 *   Login link  → /(auth)/phone
 */
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '@/api/client';
import { C, shadow } from '@/theme';

// ─── Config ───────────────────────────────────────────────────────────────────
// API base URL comes from the shared axios client (env-driven, single source).

const WHATSAPP = 'https://wa.me/962780105274';

// ─── How-it-works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    icon: 'person-add-outline' as const,
    color: '#22C55E',
    title: 'سجّل بياناتك',
    sub:   'أدخل اسمك ورقم هاتفك وسيتواصل معك فريقنا',
  },
  {
    icon: 'calendar-outline' as const,
    color: '#3B82F6',
    title: 'احجز حصتك',
    sub:   'اختر موعداً مناسباً مع أحد معلمينا المتخصصين',
  },
  {
    icon: 'trophy-outline' as const,
    color: C.amber,
    title: 'تعلّم وتقدّم',
    sub:   'أكمل الأنشطة والاختبارات وارتقِ بمستواك',
  },
];

// ─── Animated pulsing circle ──────────────────────────────────────────────────

function PulseCircle() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.pulseOuter, { transform: [{ scale }] }]}>
      <View style={styles.pulseInner}>
        <Text style={styles.logoEmoji}>🎓</Text>
      </View>
    </Animated.View>
  );
}

// ─── Lead Form Modal ──────────────────────────────────────────────────────────

function LeadModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const reset = () => {
    setName(''); setPhone(''); setDone(false); setError(null);
    onClose();
  };

  const submit = async () => {
    setError(null);
    if (!name.trim())  { setError('الاسم مطلوب');        return; }
    if (!phone.trim()) { setError('رقم الهاتف مطلوب');   return; }

    setLoading(true);
    try {
      await client.post('/public/leads', {
        name:  name.trim(),
        phone: phone.trim(),
      });
      setDone(true);
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {done ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <View style={styles.doneWrap}>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark-circle" size={56} color={C.success} />
              </View>
              <Text style={styles.doneTitle}>تم إرسال طلبك! 🎉</Text>
              <Text style={styles.doneSub}>
                سيتواصل معك فريق iFluent قريباً على الرقم المُدخل.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={reset}>
                <Text style={styles.doneBtnTxt}>حسناً</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ───────────────────────────────────────────────────────── */
            <>
              <Text style={styles.modalTitle}>ابدأ رحلتك معنا</Text>
              <Text style={styles.modalSub}>أدخل بياناتك وسنتواصل معك خلال 24 ساعة</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLbl}>الاسم الكامل</Text>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: أحمد محمد"
                  placeholderTextColor={C.gray}
                  value={name}
                  onChangeText={setName}
                  textAlign="right"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLbl}>رقم الهاتف</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+962 7X XXX XXXX"
                  placeholderTextColor={C.gray}
                  value={phone}
                  onChangeText={setPhone}
                  textAlign="right"
                  keyboardType="phone-pad"
                />
              </View>

              {error && (
                <View style={styles.errBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={C.error} />
                  <Text style={styles.errTxt}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={submit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={C.navy} />
                  : <Text style={styles.submitTxt}>أرسل الطلب</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={reset} style={{ marginTop: 12 }}>
                <Text style={styles.cancelTxt}>إلغاء</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Decorative background circles */}
          <View style={[styles.heroDot, { width: 180, height: 180, top: -50, left: -60 }]} />
          <View style={[styles.heroDot, { width: 100, height: 100, bottom: 20, right: -20 }]} />

          <PulseCircle />

          <Text style={styles.heroTitle}>iFluent</Text>
          <Text style={styles.heroSlogan}>تعلّم الإنجليزية بثقة واحترافية</Text>
          <Text style={styles.heroDesc}>
            منهج متكامل · معلمون متخصصون · أنشطة تفاعلية
          </Text>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(auth)/phone')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaTxt}>ابدأ الآن</Text>
            <Ionicons name="arrow-back" size={18} color={C.navy} />
          </TouchableOpacity>
        </View>

        {/* ── How it works ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>كيف يعمل؟</Text>

          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={[styles.stepIconWrap, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={22} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
              <View style={[styles.stepNum, { backgroundColor: s.color + '22' }]}>
                <Text style={[styles.stepNumTxt, { color: s.color }]}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── About ───────────────────────────────────────────────────────────── */}
        <View style={[styles.section, styles.aboutCard]}>
          <Text style={styles.sectionTitle}>عنّا</Text>
          <Text style={styles.aboutTxt}>
            iFluent منصة تعليمية أردنية متخصصة في تعليم اللغة الإنجليزية.
            نقدم دروساً فردية مباشرة عبر الإنترنت مع معلمين مؤهلين، وأنشطة
            تفاعلية قبل كل حصة واختبارات بعدها لضمان تقدمك الفعلي.
          </Text>
        </View>

        {/* ── WhatsApp ────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.waBtn}
          onPress={() => Linking.openURL(WHATSAPP)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.waTxt}>تواصل معنا على واتساب</Text>
        </TouchableOpacity>

        {/* ── Login link ──────────────────────────────────────────────────────── */}
        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>لديك حساب بالفعل؟</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/phone')}>
            <Text style={styles.loginLink}>سجّل دخولك</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      <LeadModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 0 },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: C.yellow,
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    ...shadow.amber,
  },
  heroDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Pulsing icon
  pulseOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  pulseInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center',
  },
  logoEmoji: { fontSize: 36 },

  heroTitle:  { fontSize: 34, fontWeight: '900', color: C.navy, marginBottom: 6 },
  heroSlogan: { fontSize: 18, fontWeight: '800', color: C.navy, marginBottom: 8, textAlign: 'center' },
  heroDesc:   { fontSize: 13, color: C.navyMid, textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    ...shadow.navy,
  },
  ctaTxt: { fontSize: 17, fontWeight: '900', color: C.navy },

  // ── Sections ─────────────────────────────────────────────────────────────────
  section:      { padding: 20, paddingBottom: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.navy,
    textAlign: 'right',
    marginBottom: 14,
  },

  // ── Step cards ────────────────────────────────────────────────────────────────
  stepCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...shadow.sm,
  },
  stepIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  stepTitle: { fontSize: 14, fontWeight: '800', color: C.navy, textAlign: 'right' },
  stepSub:   { fontSize: 12, color: C.gray, textAlign: 'right', marginTop: 3, lineHeight: 18 },
  stepNum: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumTxt: { fontSize: 14, fontWeight: '900' },

  // ── About card ────────────────────────────────────────────────────────────────
  aboutCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    ...shadow.sm,
  },
  aboutTxt: {
    fontSize: 13,
    color: C.grayDark,
    lineHeight: 22,
    textAlign: 'right',
  },

  // ── WhatsApp ──────────────────────────────────────────────────────────────────
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 18,
    ...shadow.sm,
  },
  waTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // ── Login link ────────────────────────────────────────────────────────────────
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  loginHint: { fontSize: 13, color: C.gray },
  loginLink: { fontSize: 13, fontWeight: '800', color: C.navy },

  // ── Modal ─────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.navy, textAlign: 'right', marginBottom: 4 },
  modalSub:   { fontSize: 13, color: C.gray, textAlign: 'right', marginBottom: 20 },

  field:    { marginBottom: 14 },
  fieldLbl: { fontSize: 12, fontWeight: '700', color: C.navy, textAlign: 'right', marginBottom: 6 },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.navy,
  },

  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errTxt: { fontSize: 13, color: C.error, flex: 1, textAlign: 'right' },

  submitBtn: {
    backgroundColor: C.yellow,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow.amber,
  },
  submitTxt: { fontSize: 16, fontWeight: '900', color: C.navy },
  cancelTxt: { fontSize: 13, color: C.gray, textAlign: 'center' },

  // ── Done state ────────────────────────────────────────────────────────────────
  doneWrap: { alignItems: 'center', paddingVertical: 16 },
  doneIcon: { marginBottom: 16 },
  doneTitle: { fontSize: 20, fontWeight: '900', color: C.navy, marginBottom: 8 },
  doneSub:   { fontSize: 13, color: C.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  doneBtn: {
    backgroundColor: C.yellow,
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 12,
    ...shadow.amber,
  },
  doneBtnTxt: { fontSize: 15, fontWeight: '900', color: C.navy },
});

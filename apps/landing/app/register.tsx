/**
 * سجّل الآن وتواصل مع مستشارك التعليمي — /register
 *
 * Standalone page (own shareable URL, linked from the Navbar). Collects just
 * name + phone + المرحلة الدراسية and posts to POST /public/leads, which lands
 * the visitor in the CRM's New Leads with the stage attached as a remark.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors, Spacing, FontSize, FontWeight, useResponsive } from '@ifluent/shared';
import { submitRegistration, STAGES } from '@/src/api/register';

const FONT = Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }) ?? {};
const RTL  = { writingDirection: 'rtl' as any };

const PAGE_TITLE = 'سجّل الآن وتواصل مع مستشارك التعليمي';

export default function RegisterScreen() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<string | null>(null);
  const [errors,  setErrors]  = useState<{ name?: string; phone?: string; stage?: string; api?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = 'يرجى إدخال الاسم';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) e.phone = 'يرجى إدخال رقم هاتف صحيح';
    if (!stage) e.stage = 'يرجى اختيار المرحلة الدراسية';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      await submitRegistration({ name: name.trim(), phone: phone.trim(), stage: stage! });
      setDone(true);
    } catch (err: any) {
      setErrors({ api: err?.message ?? 'تعذر إرسال الطلب، حاول مجدداً.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{PAGE_TITLE} | iFluent</title>
        <meta name="description" content="سجّل بياناتك وسيتواصل معك مستشار iFluent التعليمي لبناء خطتك لتعلّم الإنجليزية." />
      </Head>

      <View style={styles.page}>
        {/* ── Light header: logo → home ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoRow} onPress={() => router.push('/')} activeOpacity={0.8}>
            <Image source={require('../assets/images/icon.png')} style={styles.logoImg} />
            <Text style={styles.logoText}>
              <Text style={styles.logoI}>i</Text>
              <Text style={styles.logoFluent}>Fluent</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7}>
            <Text style={styles.backLink}>العودة للرئيسية ←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            {done ? (
              /* ── Success ── */
              <View style={styles.successWrap}>
                <View style={styles.successCircle}><Text style={styles.successMark}>✓</Text></View>
                <Text style={styles.successTitle}>تم استلام طلبك بنجاح!</Text>
                <Text style={styles.successSub}>
                  سيتواصل معك مستشارك التعليمي قريباً{'\n'}لبناء خطتك الخاصة لتعلّم الإنجليزية 🎯
                </Text>
                <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/')} activeOpacity={0.85}>
                  <Text style={styles.submitTxt}>العودة للرئيسية</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{PAGE_TITLE}</Text>
                <Text style={styles.sub}>
                  اترك بياناتك وسيتواصل معك مستشارنا التعليمي لمساعدتك في اختيار الخطة الأنسب
                </Text>

                {/* الاسم */}
                <Text style={styles.fieldLabel}>الاسم</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="اسمك الكامل"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  textAlign="right"
                />
                {errors.name ? <Text style={styles.errTxt}>{errors.name}</Text> : null}

                {/* الهاتف */}
                <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>رقم الهاتف (واتساب)</Text>
                <TextInput
                  style={[styles.input, styles.phoneInput, errors.phone && styles.inputError]}
                  placeholder="+962 7X XXX XXXX"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textAlign="left"
                />
                {errors.phone ? <Text style={styles.errTxt}>{errors.phone}</Text> : null}

                {/* المرحلة الدراسية */}
                <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>المرحلة الدراسية</Text>
                <View style={styles.stagesWrap}>
                  {STAGES.map((s) => {
                    const active = stage === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.stagePill, active && styles.stagePillActive]}
                        onPress={() => { setStage(s); setErrors((p) => ({ ...p, stage: undefined })); }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.stageTxt, active && styles.stageTxtActive]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.stage ? <Text style={styles.errTxt}>{errors.stage}</Text> : null}

                {errors.api ? (
                  <View style={styles.apiErrBox}><Text style={styles.apiErrTxt}>{errors.api}</Text></View>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={submit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.navy} />
                    : <Text style={styles.submitTxt}>إرسال الطلب</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.backgroundGray, minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined },

  // Header
  header: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    backgroundColor:   Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow:   { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  logoImg:   { width: 36, height: 36, borderRadius: 8 },
  logoText:  { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, ...FONT },
  logoI:     { color: Colors.yellowDark },
  logoFluent:{ color: Colors.navy },
  backLink:  { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, ...FONT, ...RTL },

  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius:    28,
    width:           '100%',
    maxWidth:        520,
    padding:         Spacing.xl,
    ...Platform.select({
      web:     { boxShadow: '0 24px 80px rgba(15,36,96,0.14), 0 0 0 1px rgba(255,193,7,0.15)' } as any,
      default: { shadowColor: Colors.navy, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 12 },
    }),
  },
  cardMobile: { padding: Spacing.lg },

  title: {
    color: Colors.navy, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold,
    textAlign: 'center', marginBottom: Spacing.xs, lineHeight: 34,
    ...FONT, ...RTL,
  },
  sub: {
    color: Colors.textSecondary, fontSize: FontSize.sm,
    textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22,
    ...FONT, ...RTL,
  },

  fieldLabel: {
    color: Colors.navy, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    textAlign: 'right', marginBottom: Spacing.sm,
    ...FONT, ...RTL,
  },
  input: {
    borderWidth:       1.5,
    borderColor:       Colors.border,
    borderRadius:      14,
    paddingVertical:   Platform.OS === 'ios' ? 14 : 11,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.base,
    color:             Colors.navy,
    backgroundColor:   Colors.backgroundGray,
    ...Platform.select({ web: { outlineStyle: 'none', ...FONT } as any }),
  },
  phoneInput: { ...Platform.select({ web: { direction: 'ltr' } as any }) },
  inputError: { borderColor: '#EF4444' },
  errTxt: { color: '#EF4444', fontSize: FontSize.xs, textAlign: 'right', marginTop: 4, ...FONT, ...RTL },

  // Stage pills
  stagesWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  stagePill: {
    borderWidth:       1.5,
    borderColor:       Colors.border,
    borderRadius:      999,
    paddingVertical:   9,
    paddingHorizontal: 18,
    backgroundColor:   Colors.backgroundGray,
  },
  stagePillActive: { backgroundColor: Colors.yellow, borderColor: Colors.yellowDark },
  stageTxt:        { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, ...FONT },
  stageTxtActive:  { color: Colors.navy, fontWeight: FontWeight.extrabold },

  apiErrBox: {
    marginTop: Spacing.lg, backgroundColor: '#FEE2E2', borderRadius: 12, padding: Spacing.md,
  },
  apiErrTxt: { color: '#B91C1C', fontSize: FontSize.sm, textAlign: 'center', ...FONT, ...RTL },

  submitBtn: {
    marginTop:       Spacing.xl,
    backgroundColor: Colors.yellow,
    borderRadius:    16,
    paddingVertical: 15,
    alignItems:      'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  submitTxt: { color: Colors.navy, fontSize: FontSize.base, fontWeight: FontWeight.extrabold, ...FONT },

  // Success
  successWrap:   { alignItems: 'center', paddingVertical: Spacing.lg },
  successCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  successMark:  { fontSize: 34, color: '#16A34A', fontWeight: FontWeight.extrabold },
  successTitle: { color: Colors.navy, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, textAlign: 'center', marginBottom: Spacing.sm, ...FONT, ...RTL },
  successSub:   { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 24, ...FONT, ...RTL },
});

/**
 * How To Use screen — step-by-step guide for students.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow }         from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

const STEPS = [
  {
    num: '01',
    icon: 'phone-portrait' as const,
    iconBg: C.navy,
    iconColor: C.yellow,
    title: 'سجّل دخولك',
    desc: 'أدخل رقم هاتفك وتحقق منه عبر رمز OTP الذي يصلك برسالة SMS.',
  },
  {
    num: '02',
    icon: 'layers' as const,
    iconBg: '#3B82F6',
    iconColor: C.white,
    title: 'شاهد وحداتك',
    desc: 'في شاشة الرئيسية ستجد الوحدات المفعّلة لك من الإدارة. كل وحدة تحتوي على دروس متسلسلة.',
  },
  {
    num: '03',
    icon: 'calendar' as const,
    iconBg: '#10B981',
    iconColor: C.white,
    title: 'احجز حصة مع معلمك',
    desc: 'ادخل على أي درس واضغط "احجز حصة". اختر التاريخ والوقت وسيقوم المعلم بتأكيد الحجز.',
  },
  {
    num: '04',
    icon: 'videocam' as const,
    iconBg: C.error,
    iconColor: C.white,
    title: 'انضم للحصة المباشرة',
    desc: 'عندما تبدأ الحصة ستجدها في تبويب "حصصي" بأيقونة حمراء "نشطة الآن". اضغط عليها للدخول.',
  },
  {
    num: '05',
    icon: 'help-circle' as const,
    iconBg: '#8B5CF6',
    iconColor: C.white,
    title: 'أجرِ الاختبار وتقدّم',
    desc: 'بعد كل درس أجرِ اختباراً قصيراً. النجاح بـ 60% أو أعلى يفتح لك الدرس التالي تلقائياً.',
  },
  {
    num: '06',
    icon: 'journal' as const,
    iconBg: C.amber,
    iconColor: C.white,
    title: 'دوّن ملاحظاتك',
    desc: 'استخدم تبويب "ملاحظاتي" لحفظ أي معلومة مهمة تتعلمها خلال الحصص.',
  },
];

export default function HowToUseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 80, height: 80, top: -22, left: -22 }]} />
        <View style={[styles.dot, { width: 40, height: 40, bottom: 8, right: 20 }]} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>طريقة الاستخدام 📖</Text>
        <Text style={styles.headerSub}>دليلك خطوة بخطوة</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {STEPS.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>

            {/* Left: connector line + number */}
            <View style={styles.stepLeft}>
              <View style={[styles.stepCircle, { backgroundColor: step.iconBg }]}>
                <Ionicons name={step.icon} size={18} color={step.iconColor} />
              </View>
              {idx < STEPS.length - 1 && <View style={styles.connector} />}
            </View>

            {/* Right: card */}
            <View style={[styles.stepCard, idx === STEPS.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>

          </View>
        ))}

        {/* Final tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={22} color={C.amber} />
          <Text style={styles.tipText}>
            💡 إذا واجهت أي مشكلة تواصل معنا عبر شاشة "عنا" في القائمة الجانبية.
          </Text>
        </View>

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
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    overflow: 'hidden',
    shadowColor: C.amber, shadowOpacity: 0.28,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  dot: { position: 'absolute', borderRadius: 999, backgroundColor: C.white, opacity: 0.18 },
  backBtn: {
    alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 10, padding: 7, marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right' },
  headerSub:   { fontSize: 12, color: C.navyMid, fontWeight: '600', textAlign: 'right', marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 24 },

  // Step row layout: icon column + card column
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 0,
  },

  // Left side: icon + vertical line
  stepLeft: { alignItems: 'center', width: 44 },
  stepCircle: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
    ...shadow.sm,
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: C.border,
    marginVertical: 4,
    minHeight: 16,
  },

  // Right side card
  stepCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...shadow.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepTitle: { fontSize: 15, fontWeight: '800', color: C.navy, flex: 1, textAlign: 'right' },
  stepNum:   { fontSize: 11, fontWeight: '900', color: C.border, marginLeft: 8 },
  stepDesc:  { fontSize: 13, color: C.grayMid, lineHeight: 20, textAlign: 'right' },

  // Tip card
  tipCard: {
    backgroundColor: C.inputBg,
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1.5, borderColor: C.border,
    marginTop: 8,
    ...shadow.sm,
  },
  tipText: { flex: 1, fontSize: 14, color: C.navy, lineHeight: 22, textAlign: 'right', fontWeight: '600' },
});

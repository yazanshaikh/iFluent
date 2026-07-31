/**
 * سياسات المنصة — in-app page (replaces the old policies PDF link).
 * Content is a verbatim copy of the policies document — do not reword,
 * add or drop anything.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow } from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

type Block =
  | { kind: 'sub';   title: string }
  | { kind: 'items'; items: string[] }
  | { kind: 'note';  text: string }
  | { kind: 'para';  text: string };

const SECTIONS: { title: string; blocks: Block[] }[] = [
  {
    title: 'أولاً: سياسة الاسترداد',
    blocks: [
      { kind: 'sub', title: 'قبل بدء البرنامج' },
      { kind: 'items', items: ['يحق للطالب طلب استرداد كامل المبلغ المدفوع.'] },
      { kind: 'sub', title: 'بعد بدء البرنامج' },
      { kind: 'items', items: [
        'يتم احتساب الحصص المستخدمة وفق سعر الحصة الفردي.',
        'يتم استرداد المبلغ المتبقي.',
        'يمكن تقديم طلب الاسترداد خلال فترة الاشتراك الفعالة.',
        'لا يشمل الاسترداد الاشتراكات المنتهية أو المستهلكة بالكامل.',
        'قد يتم خصم رسوم بوابات الدفع (إن وجدت).',
        'تستغرق معالجة طلب الاسترداد من 3 إلى 14 يوم عمل.',
      ] },
    ],
  },
  {
    title: 'ثانياً: سياسة الحضور والغياب وإعادة الجدولة',
    blocks: [
      { kind: 'sub', title: 'سياسة الطالب' },
      { kind: 'items', items: [
        'يمكن إلغاء أو تأجيل الحصة قبل ساعتين على الأقل دون خصم.',
        'إذا تم الإلغاء قبل أقل من ساعتين تعتبر الحصة مستهلكة.',
        'عدم الحضور دون إشعار مسبق يعني استهلاك الحصة بالكامل.',
        'التأخر لا يمدد وقت الحصة.',
        'يمكن للإدارة النظر في الحالات الطارئة المثبتة.',
      ] },
      { kind: 'sub', title: 'سياسة المعلم' },
      { kind: 'items', items: [
        'يجب إبلاغ المنصة قبل 4 ساعات على الأقل عند الاعتذار.',
        'في حال الغياب دون إشعار يتم توفير حصة تعويضية للطالب مع اتخاذ إجراء إداري.',
        'تكرار الغياب قد يؤدي إلى إنهاء التعاقد.',
      ] },
    ],
  },
  {
    title: 'ثالثاً: سياسة تغيير المعلم',
    blocks: [
      { kind: 'items', items: [
        'يحق للطالب طلب تغيير المعلم في أي وقت.',
        'تقوم iFluent بترشيح معلم مناسب.',
        'يتم نقل بيانات ومستوى الطالب للمعلم الجديد.',
        'مدة التنفيذ من 24 إلى 72 ساعة.',
        'قد تتم مراجعة الطلبات المتكررة غير المبررة.',
      ] },
    ],
  },
  {
    title: 'رابعاً: سياسة الخصوصية',
    blocks: [
      { kind: 'note', text: 'آخر تحديث: 9 يوليو 2026' },
      { kind: 'sub', title: 'البيانات التي نجمعها' },
      { kind: 'items', items: ['الاسم', 'رقم الهاتف'] },
      { kind: 'sub', title: 'استخدام البيانات' },
      { kind: 'items', items: [
        'إنشاء الحساب.',
        'التحقق عبر رمز OTP.',
        'تقديم الخدمة.',
        'تحسين تجربة الاستخدام.',
        'التواصل مع المستخدم عند الحاجة.',
      ] },
      { kind: 'sub', title: 'مشاركة البيانات' },
      { kind: 'items', items: [
        'لا يتم بيع أو تأجير أو مشاركة البيانات إلا عند الضرورة لتقديم الخدمة أو إذا تطلب القانون ذلك.',
      ] },
      { kind: 'sub', title: 'حماية البيانات' },
      { kind: 'items', items: ['تطبيق إجراءات أمنية مناسبة لحماية البيانات.'] },
      { kind: 'sub', title: 'الاحتفاظ بالبيانات' },
      { kind: 'items', items: [
        'يتم الاحتفاظ بالبيانات طالما كان الحساب فعالاً أو حسب ما يفرضه القانون.',
      ] },
      { kind: 'sub', title: 'حقوق المستخدم' },
      { kind: 'items', items: [
        'طلب الوصول إلى البيانات.',
        'تعديل البيانات.',
        'حذف البيانات.',
        'التواصل مع الدعم.',
      ] },
      { kind: 'sub', title: 'خدمات الجهات الخارجية' },
      { kind: 'items', items: ['Firebase Authentication للتحقق من تسجيل الدخول ورقم الهاتف.'] },
      { kind: 'sub', title: 'تحديث السياسة' },
      { kind: 'items', items: ['قد يتم تحديث هذه السياسة مع نشر تاريخ آخر تحديث.'] },
    ],
  },
  {
    title: 'خامساً: الموافقة',
    blocks: [
      { kind: 'para', text: 'بإتمام عملية الدفع، يقر العميل بأنه اطلع ووافق على جميع سياسات منصة iFluent، وتعتبر جزءاً من الاتفاق بين المنصة والعميل.' },
    ],
  },
];

export default function PoliciesScreen() {
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
        <View style={[styles.dot, { width: 70, height: 70, top: -18, right: -18 }]} />
        <View style={[styles.dot, { width: 36, height: 36, bottom: 8, left: 14 }]} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سياسة المنصة وحماية البيانات 📄</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.docTitle}>سياسات منصة iFluent</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.blocks.map((block, bi) => {
              if (block.kind === 'sub') {
                return <Text key={bi} style={styles.subTitle}>{block.title}</Text>;
              }
              if (block.kind === 'note') {
                return (
                  <View key={bi} style={styles.noteBox}>
                    <Text style={styles.noteTxt}>{block.text}</Text>
                  </View>
                );
              }
              if (block.kind === 'para') {
                return <Text key={bi} style={styles.para}>{block.text}</Text>;
              }
              return (
                <View key={bi} style={styles.itemsWrap}>
                  {block.items.map((item) => (
                    <View key={item} style={styles.itemRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.itemTxt}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}

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
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.navy, textAlign: 'right' },

  scroll: { padding: 16, paddingBottom: 32 },

  docTitle: {
    fontSize: 18, fontWeight: '900', color: C.navy,
    textAlign: 'center', marginTop: 8, marginBottom: 16,
  },

  card: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 16, marginBottom: 14, ...shadow.sm,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '900', color: C.navy,
    textAlign: 'right', marginBottom: 10,
  },
  subTitle: {
    fontSize: 13, fontWeight: '800', color: C.amber,
    textAlign: 'right', marginTop: 12, marginBottom: 8,
  },

  itemsWrap: { gap: 8 },
  itemRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8 },
  bullet:  { fontSize: 14, lineHeight: 24, color: C.yellow, fontWeight: '900' },
  itemTxt: {
    flex: 1, fontSize: 13, lineHeight: 24,
    color: C.grayDark, textAlign: 'right',
  },

  para: { fontSize: 13, lineHeight: 24, color: C.grayDark, textAlign: 'right' },

  noteBox: {
    alignSelf: 'flex-end',
    backgroundColor: C.cream, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 4,
  },
  noteTxt: { fontSize: 12, fontWeight: '800', color: C.navy, textAlign: 'right' },
});

/**
 * سياسات منصة iFluent — /policies
 *
 * Standalone page replacing the previously-linked PDF, so the policies are
 * readable in-page (and indexable / linkable). Content is a verbatim copy of
 * the source policies document — do not reword, add or drop anything.
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors, Spacing, FontSize, FontWeight, useResponsive } from '@ifluent/shared';

const FONT = Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }) ?? {};
const RTL  = { writingDirection: 'rtl' as any };

const PAGE_TITLE = 'سياسة المنصة وحماية البيانات';

/** Verbatim content of the policies document. */
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
  const { isMobile } = useResponsive();

  return (
    <>
      <Head>
        <title>{PAGE_TITLE} | iFluent</title>
        <meta name="description" content="سياسات منصة iFluent: الاسترداد، الحضور والغياب، تغيير المعلم، وسياسة الخصوصية وحماية البيانات." />
      </Head>

      <View style={styles.page}>
        {/* ── Header ── */}
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
            <Text style={styles.title}>سياسات منصة iFluent</Text>

            {SECTIONS.map((section, si) => (
              <View key={section.title} style={si > 0 ? styles.sectionSpaced : undefined}>
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
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
  },

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
  logoRow:    { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  logoImg:    { width: 36, height: 36, borderRadius: 8 },
  logoText:   { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, ...FONT },
  logoI:      { color: Colors.yellowDark },
  logoFluent: { color: Colors.navy },
  backLink:   { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, ...FONT, ...RTL },

  scroll: { flexGrow: 1, alignItems: 'center', padding: Spacing.xl },

  card: {
    backgroundColor: Colors.white,
    borderRadius:    28,
    width:           '100%',
    maxWidth:        760,
    padding:         Spacing.xl,
    ...Platform.select({
      web:     { boxShadow: '0 24px 80px rgba(15,36,96,0.14), 0 0 0 1px rgba(255,193,7,0.15)' } as any,
      default: { shadowColor: Colors.navy, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 12 },
    }),
  },
  cardMobile: { padding: Spacing.lg },

  title: {
    color: Colors.navy, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold,
    textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 34,
    ...FONT, ...RTL,
  },

  sectionSpaced: {
    marginTop:      Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop:     Spacing.xl,
  },
  sectionTitle: {
    color: Colors.navy, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold,
    textAlign: 'right', marginBottom: Spacing.md,
    ...FONT, ...RTL,
  },
  subTitle: {
    color: Colors.yellowDark, fontSize: FontSize.base, fontWeight: FontWeight.bold,
    textAlign: 'right', marginTop: Spacing.md, marginBottom: Spacing.sm,
    ...FONT, ...RTL,
  },

  itemsWrap: { gap: 8 },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems:    'flex-start',
    gap:           8,
  },
  bullet:  { color: Colors.yellowDark, fontSize: FontSize.base, lineHeight: 26, ...FONT },
  itemTxt: {
    flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 26,
    textAlign: 'right', ...FONT, ...RTL,
  },

  para: {
    color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 26,
    textAlign: 'right', ...FONT, ...RTL,
  },

  noteBox: {
    backgroundColor: Colors.yellowSoft,
    borderRadius:    12,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignSelf:       'flex-end',
    marginBottom:    Spacing.xs,
  },
  noteTxt: {
    color: Colors.navy, fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
    textAlign: 'right', ...FONT, ...RTL,
  },
});

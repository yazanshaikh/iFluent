/**
 * About screen — app info and contact.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow }         from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

const FEATURES = [
  { icon: 'layers',       color: '#3B82F6', label: 'مستويات تعليمية متدرجة من A1 إلى FT' },
  { icon: 'videocam',     color: '#10B981', label: 'حصص مباشرة مع معلمين متخصصين بالاوقات المناسبة لك' },
  { icon: 'help-circle',  color: '#8B5CF6', label: 'اختبارات تفاعلية  ' },
  { icon: 'journal',      color: C.amber,   label: 'دفتر ملاحظات شخصي داخل التطبيق' },
  { icon: 'trending-up',  color: C.info,    label: 'متابعة من قبل مشرف او مشرفة خاص  وشريط تقدم داخل التطبيق لمتابعة تقدمك' },
];

export default function AboutScreen() {
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
        <View style={[styles.dot, { width: 80, height: 80, top: -22, right: -22 }]} />
        <View style={[styles.dot, { width: 38, height: 38, bottom: 10, left: 16 }]} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        {/* App name */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>iFluent</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>عن التطبيق</Text>
          <Text style={styles.desc}>
          رفيقك الذكي في رحلة إتقان اللغة الإنجليزية. منصة تفاعلية متكاملة مصممة خصيصاً لتمكينك من التحدث بطلاقة وثقة، من خلال مناهج عملية، ومتابعة مستمرة من مستشارين تعليميين مخصصين لدعمك خطوة بخطوة حتى تصل إلى هدفك.
​iFluent .. بوابتك لفرص لا حدود لها.
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionLabel}>مميزات التطبيق</Text>
        {FEATURES.map((f, idx) => (
          <View key={idx} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
              <Ionicons name={f.icon as any} size={18} color={f.color} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}

        {/* Contact */}
        <Text style={styles.sectionLabel}>تواصل معنا</Text>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('mailto:ifluent0@gmail.com')}
          activeOpacity={0.75}
        >
          <View style={[styles.featureIcon, { backgroundColor: C.cream }]}>
            <Ionicons name="mail" size={18} color={C.amber} />
          </View>
          <Text style={styles.featureLabel}>ifluent0@gmail.com</Text>
          <Ionicons name="open-outline" size={14} color={C.gray} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('https://ifluent.io')}
          activeOpacity={0.75}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="globe" size={18} color={C.info} />
          </View>
          <Text style={styles.featureLabel}>www.ifluent.io</Text>
          <Ionicons name="open-outline" size={14} color={C.gray} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('whatsapp://send?phone=962790000000')}
          activeOpacity={0.75}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </View>
          <Text style={styles.featureLabel}>+962 79 000 0000</Text>
          <Ionicons name="open-outline" size={14} color={C.gray} />
        </TouchableOpacity>

        <Text style={styles.copyright}>© 2025 iFluent. جميع الحقوق محفوظة.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22, paddingBottom: 28,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    overflow: 'hidden',
    shadowColor: C.amber, shadowOpacity: 0.28,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  dot: { position: 'absolute', borderRadius: 999, backgroundColor: C.white, opacity: 0.18 },
  backBtn: {
    alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 10, padding: 7, marginBottom: 14,
  },
  logoArea: { alignItems: 'flex-end', marginBottom: 4 },
  appName:  { fontSize: 22, fontWeight: '900', color: C.navy },

  scroll: { padding: 16, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: C.gray,
    textAlign: 'right', marginBottom: 8, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  card: {
    backgroundColor: C.white, borderRadius: 20,
    overflow: 'hidden', ...shadow.sm,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '800', color: C.navy,
    textAlign: 'right', padding: 16, paddingBottom: 8,
  },
  desc: {
    fontSize: 14, color: C.grayMid, lineHeight: 22,
    textAlign: 'right', paddingHorizontal: 16, paddingBottom: 16,
  },

  featureCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    backgroundColor: C.white, borderRadius: 16,
    marginBottom: 8, ...shadow.sm,
  },
  featureIcon:   { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureLabel:  { flex: 1, fontSize: 14, fontWeight: '600', color: C.navy, textAlign: 'right' },

  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    backgroundColor: C.white, borderRadius: 16,
    marginBottom: 8, ...shadow.sm,
  },

  copyright: {
    fontSize: 11, color: C.gray,
    textAlign: 'center', marginTop: 20,
  },
});

/**
 * Lesson detail — lesson info, quiz result, book a session.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
  StyleSheet, ActivityIndicator, Modal,
  Platform, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { levelsApi, type StudentProgress } from '@/api/levels';
import { sessionsApi } from '@/api/sessions';
import { C, shadow }         from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

// ─── Book Session Modal ────────────────────────────────────────────────────────

interface BookModalProps {
  lessonId: number;
  visible:  boolean;
  onClose:  () => void;
}

function BookSessionModal({ lessonId, visible, onClose }: BookModalProps) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('');
  const [teacherCode, setTeacherCode] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const dt = new Date(`${date}T${time || '10:00'}:00+03:00`);
      return sessionsApi.book({
        lesson_id:    lessonId,
        scheduled_at: dt.toISOString(),
        teacher_code: teacherCode.trim() || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      onClose();
      appAlert('تم الحجز ✅', 'طلب حجز الحصة أُرسل إلى المعلم. ستُعلَم عند التأكيد.');
    },
    onError: (err: any) => {
      appAlert('خطأ', err?.response?.data?.message ?? 'تعذر الحجز. حاول مجدداً.');
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.white }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Modal header */}
        <View style={[modal.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={20} color={C.navy} />
          </TouchableOpacity>
          <Text style={modal.title}>📅 حجز حصة</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={modal.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <Text style={modal.label}>تاريخ الحصة</Text>
          <TextInput
            style={modal.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={C.gray}
          />

          <Text style={modal.label}>الوقت (توقيت الأردن)</Text>
          <TextInput
            style={modal.input}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM  (مثال: 17:00)"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={C.gray}
          />

          <Text style={modal.label}>
            كود المعلم{' '}
            <Text style={{ color: C.gray, fontWeight: '400' }}>(اختياري)</Text>
          </Text>
          <TextInput
            style={modal.input}
            value={teacherCode}
            onChangeText={setTeacherCode}
            placeholder="اتركه فارغاً لتعيين معلم عشوائي"
            autoCapitalize="characters"
            placeholderTextColor={C.gray}
          />
          <Text style={modal.hint}>إدخال كود معلم محدد يحوّل الطلب إلى حصة خاصة</Text>

          <TouchableOpacity
            style={[modal.btn, (!date || isPending) && modal.btnOff]}
            onPress={() => mutate()}
            disabled={isPending || !date}
            activeOpacity={0.85}
          >
            {isPending
              ? <ActivityIndicator color={C.navy} />
              : <>
                  <Ionicons name="checkmark-circle" size={18} color={C.navy} />
                  <Text style={modal.btnText}>إرسال طلب الحجز</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const [bookVisible, setBookVisible] = useState(false);
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn:  () => levelsApi.getLesson(Number(id)),
  });

  const { data: progress = [] } = useQuery<StudentProgress[]>({
    queryKey: ['progress'],
    queryFn:  levelsApi.getProgress,
  });

  const myProgress = progress.find((p) => p.lesson_id === Number(id));
  const passed     = myProgress?.passed === true;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <ActivityIndicator size="large" color={C.yellow} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <Text style={{ color: C.gray, fontWeight: '600' }}>الدرس غير موجود</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 70, height: 70, top: -18, right: -18 }]} />
        <View style={[styles.dot, { width: 35, height: 35, bottom: 8, left: 16 }]} />

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={3}>{lesson.title}</Text>

        {/* Pass badge if graded */}
        {myProgress?.best_score !== null && myProgress?.best_score !== undefined && (
          <View style={[styles.gradeChip, passed ? styles.gradePass : styles.gradeFail]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={passed ? C.success : C.error}
            />
            <Text style={[styles.gradeChipTxt, { color: passed ? C.success : C.error }]}>
              {passed ? 'اجتزت الاختبار' : 'لم تجتز'} — {myProgress.best_score}%
            </Text>
          </View>
        )}
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {/* Book session */}
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => setBookVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.bookIcon}>
            <Ionicons name="calendar" size={22} color={C.yellow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookTitle}>احجز حصة مع معلمك</Text>
            <Text style={styles.bookSub}>اختر وقتاً مناسباً وانتظر التأكيد</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={C.navy} />
        </TouchableOpacity>

        {/* Quiz section */}
        <View style={styles.quizCard}>
          <View style={styles.quizTop}>
            <View style={styles.quizIconWrap}>
              <Ionicons name="help-circle" size={22} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quizTitle}>اختبار الدرس</Text>
              <Text style={styles.quizSub}>
                {passed
                  ? 'أحسنت! يمكنك المراجعة أو الانتقال للدرس التالي.'
                  : 'اجتز بنسبة 60% أو أعلى لفتح الدرس التالي.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.quizBtn, passed && styles.quizBtnReview]}
            onPress={() => router.push({ pathname: '/quiz/[lessonId]', params: { lessonId: String(id) } })}
            activeOpacity={0.85}
          >
            <Ionicons
              name={passed ? 'refresh' : 'pencil'}
              size={16}
              color={passed ? C.navy : C.white}
            />
            <Text style={[styles.quizBtnTxt, passed && { color: C.navy }]}>
              {passed ? 'مراجعة الاختبار' : 'ابدأ الاختبار الآن'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity (Wordwall) — only when a link is set for this lesson */}
        {lesson.activity_url ? (
          <TouchableOpacity
            style={styles.activityCard}
            onPress={() => router.push({
              pathname: '/activity/[id]',
              params: { id: String(id), url: lesson.activity_url!, title: lesson.title },
            })}
            activeOpacity={0.85}
          >
            <View style={styles.activityIconWrap}>
              <Ionicons name="game-controller" size={22} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>نشاط الدرس</Text>
              <Text style={styles.activitySub}>تمرين تفاعلي ممتع لترسيخ ما تعلّمته</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color={C.navy} />
          </TouchableOpacity>
        ) : null}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={C.info} />
          <Text style={styles.infoTxt}>
            الدرس يُقدَّم مع معلمك عبر منصة Nearpod التفاعلية خلال الحصة الحية.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <BookSessionModal
        lessonId={Number(id)}
        visible={bookVisible}
        onClose={() => setBookVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: C.amber,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.18,
  },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    padding: 7,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20, fontWeight: '900', color: C.navy,
    textAlign: 'right', marginBottom: 12, lineHeight: 28,
  },
  gradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-end',
  },
  gradePass: { backgroundColor: '#DCFCE7' },
  gradeFail: { backgroundColor: '#FEF2F2' },
  gradeChipTxt: { fontSize: 12, fontWeight: '700' },

  // ── Content ───────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 32 },

  // ── Book button ───────────────────────────────────────────────────────────
  bookBtn: {
    backgroundColor: C.navy,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    ...shadow.navy,
  },
  bookIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,179,0,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  bookTitle: { fontSize: 15, fontWeight: '800', color: C.white, textAlign: 'right' },
  bookSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'right' },

  // ── Quiz card ─────────────────────────────────────────────────────────────
  quizCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    ...shadow.sm,
  },
  quizTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  quizIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.navyMid,
    justifyContent: 'center', alignItems: 'center',
  },
  quizTitle: { fontSize: 16, fontWeight: '900', color: C.navy, textAlign: 'right' },
  quizSub:   { fontSize: 12, color: C.gray, marginTop: 4, textAlign: 'right', lineHeight: 18 },
  quizBtn: {
    backgroundColor: C.navy,
    borderRadius: 12, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  quizBtnReview: {
    backgroundColor: C.cream,
    borderWidth: 1.5, borderColor: C.border,
  },
  quizBtnTxt: { fontSize: 14, fontWeight: '800', color: C.white },

  // ── Activity card ─────────────────────────────────────────────────────────
  activityCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#A7F3D0',
    ...shadow.sm,
  },
  activityIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.success,
    justifyContent: 'center', alignItems: 'center',
  },
  activityTitle: { fontSize: 16, fontWeight: '900', color: C.navy, textAlign: 'right' },
  activitySub:   { fontSize: 12, color: C.gray, marginTop: 3, textAlign: 'right', lineHeight: 18 },

  // ── Info card ─────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoTxt: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 20, textAlign: 'right' },
});

const modal = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    backgroundColor: C.white,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '900', color: C.navy },
  body:  { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 13, fontWeight: '700', color: C.navy,
    marginBottom: 8, textAlign: 'right',
  },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15,
    color: C.navy, textAlign: 'right', backgroundColor: C.cream, marginBottom: 16,
  },
  hint: { fontSize: 12, color: C.gray, marginTop: -8, marginBottom: 20, textAlign: 'right' },
  btn: {
    backgroundColor: C.yellow, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    ...shadow.amber,
  },
  btnOff: { opacity: 0.50 },
  btnText: { color: C.navy, fontSize: 16, fontWeight: '900' },
});

/**
 * Lesson detail — shows lesson info, quiz result, and lets student book a session.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal,
  Platform, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { levelsApi } from '@/api/levels';
import { sessionsApi } from '@/api/sessions';

// ─── Book Session Modal ────────────────────────────────────────────────────────

interface BookModalProps {
  lessonId: number;
  visible:  boolean;
  onClose:  () => void;
}

function BookSessionModal({ lessonId, visible, onClose }: BookModalProps) {
  const qc = useQueryClient();
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('');
  const [teacherCode, setTeacherCode] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const dt = new Date(`${date}T${time || '10:00'}:00+03:00`); // Jordan time
      return sessionsApi.book({
        lesson_id:        lessonId,
        requested_at_utc: dt.toISOString(),
        teacher_code:     teacherCode.trim() || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      onClose();
      Alert.alert('تم الحجز ✓', 'طلب حجز الحصة أُرسل إلى المعلم. ستُعلَم عند التأكيد.');
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذر الحجز. حاول مجدداً.');
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={modal.title}>حجز حصة</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={modal.body}>
          {/* Date */}
          <Text style={modal.label}>تاريخ الحصة</Text>
          <TextInput
            style={modal.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor="#9ca3af"
          />

          {/* Time */}
          <Text style={modal.label}>الوقت (توقيت الأردن)</Text>
          <TextInput
            style={modal.input}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM  (مثال: 17:00)"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor="#9ca3af"
          />

          {/* Teacher code (optional) */}
          <Text style={modal.label}>
            كود المعلم <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(اختياري)</Text>
          </Text>
          <TextInput
            style={modal.input}
            value={teacherCode}
            onChangeText={setTeacherCode}
            placeholder="اتركه فارغاً لتعيين معلم عشوائي"
            autoCapitalize="characters"
            placeholderTextColor="#9ca3af"
          />
          <Text style={modal.hint}>
            إدخال كود معلم محدد يحوّل الطلب إلى حصة خاصة
          </Text>

          <TouchableOpacity
            style={[modal.btn, isPending && { opacity: 0.6 }]}
            onPress={() => mutate()}
            disabled={isPending || !date}
          >
            {isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={modal.btnText}>إرسال طلب الحجز</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bookVisible, setBookVisible] = useState(false);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn:  () => levelsApi.getLesson(Number(id)),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress'],
    queryFn:  () =>
      import('@/api/client').then((m) =>
        m.default
          .get<{ data: { lesson_id: number; quiz_score: number | null; completed_at: string | null }[] }>(
            '/student/progress',
          )
          .then((r) => r.data.data),
      ),
  });

  const myProgress = progress.find((p) => p.lesson_id === Number(id));
  const passed     = (myProgress?.quiz_score ?? -1) >= 60;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  }

  if (!lesson) {
    return <View style={styles.centered}><Text style={{ color: '#6b7280' }}>الدرس غير موجود</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Stack.Screen
        options={{
          headerShown:     true,
          headerTitle:     lesson.title,
          headerBackTitle: 'رجوع',
          headerStyle:     { backgroundColor: '#10b981' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Lesson header card */}
        <View style={styles.card}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>

          {/* Quiz result badge */}
          {myProgress?.quiz_score !== null && myProgress?.quiz_score !== undefined && (
            <View style={[styles.scoreBadge, passed ? styles.scorePassed : styles.scoreFailed]}>
              <Ionicons
                name={passed ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={passed ? '#10b981' : '#ef4444'}
              />
              <Text style={[styles.scoreText, { color: passed ? '#10b981' : '#ef4444' }]}>
                {passed ? 'اجتزت الاختبار' : 'لم تجتز الاختبار'} — {myProgress.quiz_score}%
              </Text>
            </View>
          )}

          {/* Book session button */}
          <TouchableOpacity style={styles.bookBtn} onPress={() => setBookVisible(true)} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.bookBtnText}>احجز حصة لهذا الدرس</Text>
          </TouchableOpacity>
        </View>

        {/* Quiz section */}
        <View style={styles.quizCard}>
          <View style={styles.quizHeader}>
            <Ionicons name="help-circle-outline" size={22} color="#8b5cf6" />
            <Text style={styles.quizTitle}>اختبار الدرس</Text>
          </View>
          <Text style={styles.quizSub}>
            {passed
              ? 'أحسنت! يمكنك المراجعة أو الانتقال للدرس التالي.'
              : 'اجتز الاختبار بدرجة 60% أو أعلى لفتح الدرس التالي.'}
          </Text>
          <TouchableOpacity
            style={[styles.quizBtn, passed && styles.quizBtnReview]}
            onPress={() => router.push({ pathname: '/quiz/[lessonId]', params: { lessonId: String(id) } })}
            activeOpacity={0.85}
          >
            <Ionicons
              name={passed ? 'refresh-outline' : 'pencil-outline'}
              size={16}
              color={passed ? '#8b5cf6' : '#fff'}
            />
            <Text style={[styles.quizBtnText, passed && { color: '#8b5cf6' }]}>
              {passed ? 'مراجعة الاختبار' : 'ابدأ الاختبار'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info block */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            الدرس يُقدَّم مباشرة مع معلمك عبر منصة Nearpod التفاعلية داخل الحصة الحية.
          </Text>
        </View>
      </ScrollView>

      {/* Book modal */}
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
  scroll: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  lessonTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right', marginBottom: 14 },

  scoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    justifyContent: 'flex-end', marginBottom: 14,
  },
  scorePassed: { backgroundColor: '#f0fdf4' },
  scoreFailed: { backgroundColor: '#fef2f2' },
  scoreText: { fontSize: 13, fontWeight: '700' },

  bookBtn: {
    backgroundColor: '#10b981', borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  quizCard: {
    backgroundColor: '#faf5ff', borderRadius: 18, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#e9d5ff',
  },
  quizHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'flex-end' },
  quizTitle:   { fontSize: 16, fontWeight: '800', color: '#7c3aed' },
  quizSub:     { fontSize: 13, color: '#6b7280', textAlign: 'right', lineHeight: 20, marginBottom: 14 },
  quizBtn: {
    backgroundColor: '#8b5cf6', borderRadius: 12,
    paddingVertical: 12, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  quizBtnReview: { backgroundColor: '#f3e8ff' },
  quizBtnText:   { color: '#fff', fontSize: 14, fontWeight: '700' },

  infoCard: {
    backgroundColor: '#eff6ff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 20, textAlign: 'right' },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  body:  { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'right' },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 16,
    color: '#111827', textAlign: 'right', backgroundColor: '#f9fafb', marginBottom: 16,
  },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: -8, marginBottom: 20, textAlign: 'right' },
  btn: {
    backgroundColor: '#10b981', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

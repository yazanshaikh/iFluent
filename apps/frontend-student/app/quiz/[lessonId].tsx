/**
 * Quiz screen — shows questions, tracks answers, submits and shows score.
 * Pass mark: 60%. Triggers celebration on ≥ 80%.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { levelsApi } from '@/api/levels';

interface Question {
  id:             number;
  question:       string;
  options:        string[];
  correct_answer: string; // returned only after submission
}

interface QuizData {
  quiz_id:   number;
  questions: Question[];
}

interface QuizResult {
  score:      number;
  passed:     boolean;
  total:      number;
  correct:    number;
}

export default function QuizScreen() {
  const router    = useRouter();
  const qc        = useQueryClient();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [answers,  setAnswers]  = useState<Record<number, string>>({});
  const [result,   setResult]   = useState<QuizResult | null>(null);
  const [revealed, setRevealed] = useState<Record<number, string>>({}); // correct answers post-submit

  const { data: quiz, isLoading } = useQuery<QuizData>({
    queryKey: ['quiz', lessonId],
    queryFn:  () => levelsApi.getQuiz(Number(lessonId)),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => levelsApi.submitQuiz(Number(lessonId), answers),
    onSuccess: (data: any) => {
      setResult(data);
      // Mark correct answers for display
      const correctMap: Record<number, string> = {};
      (data.questions ?? []).forEach((q: Question) => {
        correctMap[q.id] = q.correct_answer;
      });
      setRevealed(correctMap);
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذر تسليم الاختبار');
    },
  });

  const handleSubmit = () => {
    const total = quiz?.questions.length ?? 0;
    if (Object.keys(answers).length < total) {
      Alert.alert('تنبيه', 'الرجاء الإجابة على جميع الأسئلة');
      return;
    }
    Alert.alert('تسليم الاختبار', 'هل أنت مستعد؟', [
      { text: 'مراجعة', style: 'cancel' },
      { text: 'تسليم', onPress: () => submit() },
    ]);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  }

  const questions = quiz?.questions ?? [];
  const answered  = Object.keys(answers).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Stack.Screen
        options={{
          headerShown:      true,
          headerTitle:      'اختبار الدرس',
          headerBackTitle:  'رجوع',
          headerStyle:      { backgroundColor: '#8b5cf6' },
          headerTintColor:  '#fff',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />

      {/* Result banner */}
      {result && (
        <View style={[
          styles.resultBanner,
          result.passed ? styles.resultPass : styles.resultFail,
        ]}>
          <Ionicons
            name={result.passed ? 'trophy-outline' : 'close-circle-outline'}
            size={28}
            color={result.passed ? '#10b981' : '#ef4444'}
          />
          <View style={{ marginHorizontal: 12, flex: 1 }}>
            <Text style={styles.resultScore}>{result.score}%</Text>
            <Text style={styles.resultLabel}>
              {result.passed
                ? `ممتاز! أجبت صحيحاً على ${result.correct} من ${result.total}`
                : `تحتاج 60% للنجاح — أجبت على ${result.correct} من ${result.total}`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress indicator */}
        {!result && (
          <View style={styles.progress}>
            <Text style={styles.progressText}>{answered} / {questions.length} سؤال</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${(answered / Math.max(questions.length, 1)) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Questions */}
        {questions.map((q, idx) => {
          const selected  = answers[q.id];
          const correct   = revealed[q.id];

          return (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionNum}>السؤال {idx + 1}</Text>
              <Text style={styles.questionText}>{q.question}</Text>

              {q.options.map((opt) => {
                const isSelected = selected === opt;
                const isCorrect  = correct && opt === correct;
                const isWrong    = correct && isSelected && opt !== correct;

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.option,
                      isSelected && !correct && styles.optionSelected,
                      isCorrect  && styles.optionCorrect,
                      isWrong    && styles.optionWrong,
                    ]}
                    onPress={() => !result && setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    disabled={!!result}
                    activeOpacity={result ? 1 : 0.75}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && !correct && { color: '#3b82f6' },
                      isCorrect  && { color: '#10b981', fontWeight: '700' },
                      isWrong    && { color: '#ef4444' },
                    ]}>
                      {opt}
                    </Text>
                    {isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
                    {isWrong   && <Ionicons name="close-circle"     size={18} color="#ef4444" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Submit / retry */}
        {!result ? (
          <TouchableOpacity
            style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>تسليم الاختبار</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={styles.retryRow}>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: '#8b5cf6' }]}
              onPress={() => { setAnswers({}); setResult(null); setRevealed({}); }}
            >
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.retryText}>إعادة الاختبار</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: '#10b981' }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.retryText}>العودة للدرس</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },

  resultBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  resultPass: { backgroundColor: '#f0fdf4' },
  resultFail: { backgroundColor: '#fef2f2' },
  resultScore: { fontSize: 28, fontWeight: '900', color: '#111827' },
  resultLabel: { fontSize: 13, color: '#6b7280', marginTop: 2, textAlign: 'right' },

  progress: { marginBottom: 16 },
  progressText: { fontSize: 13, color: '#6b7280', textAlign: 'right', marginBottom: 6 },
  progressBg: { height: 5, backgroundColor: '#e5e7eb', borderRadius: 3 },
  progressFill: { height: 5, backgroundColor: '#8b5cf6', borderRadius: 3 },

  questionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  questionNum:  { fontSize: 11, fontWeight: '700', color: '#8b5cf6', textAlign: 'right', marginBottom: 6, textTransform: 'uppercase' },
  questionText: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'right', marginBottom: 14, lineHeight: 24 },

  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  optionSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  optionCorrect:  { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  optionWrong:    { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  optionText: { fontSize: 14, color: '#374151', textAlign: 'right', flex: 1 },

  submitBtn: {
    backgroundColor: '#8b5cf6', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  retryRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  retryBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

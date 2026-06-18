/**
 * Quiz screen — questions, answers, submit, score.
 * Pass mark: 60%. Brand theme: Navy/Yellow.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
  StyleSheet, ActivityIndicator, 
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { levelsApi } from '@/api/levels';
import { C, shadow }         from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

interface Question {
  id:             number;
  question:       string;
  options:        string[];
  correct_answer: string;
}

interface QuizData {
  quiz_id:   number;
  questions: Question[];
}

interface QuizResult {
  score:   number;
  passed:  boolean;
  total:   number;
  correct: number;
}

export default function QuizScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const [answers,  setAnswers]  = useState<Record<number, string>>({});
  const [result,   setResult]   = useState<QuizResult | null>(null);
  const [revealed, setRevealed] = useState<Record<number, string>>({});

  const { data: quiz, isLoading } = useQuery<QuizData>({
    queryKey: ['quiz', lessonId],
    queryFn:  () => levelsApi.getQuiz(Number(lessonId)),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => levelsApi.submitQuiz(Number(lessonId), answers),
    onSuccess: (data: any) => {
      setResult(data);
      const correctMap: Record<number, string> = {};
      (data.questions ?? []).forEach((q: Question) => {
        correctMap[q.id] = q.correct_answer;
      });
      setRevealed(correctMap);
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
    onError: (err: any) => {
      appAlert('خطأ', err?.response?.data?.message ?? 'تعذر تسليم الاختبار');
    },
  });

  const handleSubmit = () => {
    const total = quiz?.questions.length ?? 0;
    if (Object.keys(answers).length < total) {
      appAlert('تنبيه', 'الرجاء الإجابة على جميع الأسئلة');
      return;
    }
    appAlert('تسليم الاختبار', 'هل أنت مستعد للتسليم؟', [
      { text: 'مراجعة', style: 'cancel' },
      { text: 'تسليم ✅', onPress: () => submit() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.cream }]}>
        <ActivityIndicator size="large" color={C.yellow} />
      </View>
    );
  }

  const questions = quiz?.questions ?? [];
  const answered  = Object.keys(answers).length;
  const pct       = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 70, height: 70, top: -20, right: -20 }]} />
        <View style={[styles.dot, { width: 36, height: 36, bottom: 8, left: 14 }]} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>اختبار الدرس 📝</Text>

        {/* Progress */}
        {!result && (
          <>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressTxt}>{answered} / {questions.length} سؤال</Text>
          </>
        )}
      </Animated.View>

      {/* ── Content area (starts below animated header) ────────────────────── */}
      <View style={{ flex: 1, paddingTop: headerHeight }}>

        {/* ── Result banner ────────────────────────────────────────────────── */}
        {result && (
          <View style={[styles.resultBanner, result.passed ? styles.resultPass : styles.resultFail]}>
            <View style={[styles.resultIcon, result.passed ? styles.resultIconPass : styles.resultIconFail]}>
              <Ionicons
                name={result.passed ? 'trophy' : 'refresh'}
                size={24}
                color={result.passed ? C.yellow : C.white}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultScore, { color: result.passed ? C.navy : C.white }]}>
                {result.score}%
              </Text>
              <Text style={[styles.resultLabel, { color: result.passed ? C.navyMid : 'rgba(255,255,255,0.8)' }]}>
                {result.passed
                  ? `ممتاز! ${result.correct} إجابة صحيحة من ${result.total}`
                  : `${result.correct} صحيحة من ${result.total} — تحتاج 60% للنجاح`}
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >

        {/* Questions */}
        {questions.map((q, idx) => {
          const selected = answers[q.id];
          const correct  = revealed[q.id];

          return (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumBadge}>
                  <Text style={styles.questionNumTxt}>{idx + 1}</Text>
                </View>
                <Text style={styles.questionLabel}>السؤال {idx + 1}</Text>
              </View>
              <Text style={styles.questionText}>{q.question}</Text>

              {q.options.map((opt) => {
                const isSelected = selected === opt;
                const isCorrect  = !!correct && opt === correct;
                const isWrong    = !!correct && isSelected && opt !== correct;

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.option,
                      isSelected && !correct && styles.optionSelected,
                      isCorrect  && styles.optionCorrect,
                      isWrong    && styles.optionWrong,
                    ]}
                    onPress={() => !result && setAnswers((p) => ({ ...p, [q.id]: opt }))}
                    disabled={!!result}
                    activeOpacity={result ? 1 : 0.75}
                  >
                    {/* Bullet */}
                    <View style={[
                      styles.optionBullet,
                      isSelected && !correct && styles.optionBulletSelected,
                      isCorrect  && styles.optionBulletCorrect,
                      isWrong    && styles.optionBulletWrong,
                    ]}>
                      {isCorrect
                        ? <Ionicons name="checkmark" size={12} color={C.white} />
                        : isWrong
                        ? <Ionicons name="close" size={12} color={C.white} />
                        : null
                      }
                    </View>

                    <Text style={[
                      styles.optionText,
                      isSelected && !correct && { color: C.navy, fontWeight: '700' },
                      isCorrect  && { color: C.success, fontWeight: '700' },
                      isWrong    && { color: C.error },
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Submit / retry */}
        {!result ? (
          <TouchableOpacity
            style={[styles.submitBtn, (isPending || answered < questions.length) && styles.submitBtnOff]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending
              ? <ActivityIndicator color={C.navy} />
              : <>
                  <Ionicons name="checkmark-circle" size={20} color={C.navy} />
                  <Text style={styles.submitTxt}>تسليم الاختبار</Text>
                </>
            }
          </TouchableOpacity>
        ) : (
          <View style={styles.retryRow}>
            <TouchableOpacity
              style={[styles.retryBtn, styles.retryBtnSecondary]}
              onPress={() => { setAnswers({}); setResult(null); setRevealed({}); }}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color={C.navy} />
              <Text style={[styles.retryTxt, { color: C.navy }]}>إعادة المحاولة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward" size={16} color={C.navy} />
              <Text style={styles.retryTxt}>العودة للدرس</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.navy,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: C.navy,
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.08,
  },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 7,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.white, textAlign: 'right', marginBottom: 14 },
  progressBg:  { height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 5, backgroundColor: C.yellow, borderRadius: 3 },
  progressTxt: { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'right', fontWeight: '600' },

  // ── Result banner ─────────────────────────────────────────────────────────
  resultBanner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  resultPass: { backgroundColor: C.yellow },
  resultFail: { backgroundColor: C.navy },
  resultIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  resultIconPass: { backgroundColor: C.navy },
  resultIconFail: { backgroundColor: 'rgba(255,255,255,0.15)' },
  resultScore: { fontSize: 30, fontWeight: '900' },
  resultLabel: { fontSize: 13, marginTop: 2 },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16, paddingBottom: 32 },

  // ── Question card ─────────────────────────────────────────────────────────
  questionCard: {
    backgroundColor: C.white,
    borderRadius: 18, padding: 18,
    marginBottom: 14, ...shadow.sm,
  },
  questionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 8, marginBottom: 10,
  },
  questionNumBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.navy,
    justifyContent: 'center', alignItems: 'center',
  },
  questionNumTxt: { fontSize: 12, fontWeight: '900', color: C.white },
  questionLabel:  { fontSize: 11, fontWeight: '800', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  questionText:   { fontSize: 16, fontWeight: '700', color: C.navy, textAlign: 'right', lineHeight: 26, marginBottom: 14 },

  // ── Options ───────────────────────────────────────────────────────────────
  option: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8,
    backgroundColor: C.grayLight, gap: 10,
  },
  optionSelected: { borderColor: C.navy, backgroundColor: C.cream },
  optionCorrect:  { borderColor: C.success, backgroundColor: '#DCFCE7' },
  optionWrong:    { borderColor: C.error,   backgroundColor: '#FEF2F2' },
  optionText: { flex: 1, fontSize: 14, color: C.grayDark, textAlign: 'right' },

  optionBullet: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  optionBulletSelected: { borderColor: C.navy,    backgroundColor: C.navy },
  optionBulletCorrect:  { borderColor: C.success, backgroundColor: C.success },
  optionBulletWrong:    { borderColor: C.error,   backgroundColor: C.error },

  // ── Submit ────────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: C.yellow, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
    marginTop: 4, flexDirection: 'row', justifyContent: 'center', gap: 8,
    ...shadow.amber,
  },
  submitBtnOff: { opacity: 0.50 },
  submitTxt:    { color: C.navy, fontSize: 16, fontWeight: '900' },

  retryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  retryBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7,
    backgroundColor: C.yellow, ...shadow.amber,
  },
  retryBtnSecondary: {
    backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
  },
  retryTxt: { fontSize: 14, fontWeight: '800', color: C.navy },
});

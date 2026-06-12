import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { sessionsApi, type DemoEvaluationPayload } from '@/api/sessions';
import { C } from '@/theme';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

interface Props {
  visible:    boolean;
  sessionId:  number;
  studentName?: string | null;
  onSuccess:  () => void;
}

function Field({
  label, value, onChangeText, placeholder, minHeight = 90,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; minHeight?: number;
}) {
  return (
    <View style={S.field}>
      <Text style={S.label}>{label}</Text>
      <TextInput
        style={[S.input, { minHeight }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline
        textAlignVertical="top"
        textAlign="right"
      />
    </View>
  );
}

export default function DemoEvaluationModal({ visible, sessionId, studentName, onSuccess }: Props) {
  const [evaluationQuestions, setEvaluationQuestions] = useState('');
  const [studentLevel,        setStudentLevel]        = useState<typeof LEVELS[number] | null>(null);
  const [strengths,           setStrengths]           = useState('');
  const [weaknesses,          setWeaknesses]          = useState('');
  const [generalNotes,        setGeneralNotes]        = useState('');
  const [error,               setError]               = useState('');

  const mutation = useMutation({
    mutationFn: (payload: DemoEvaluationPayload) =>
      sessionsApi.submitEvaluation(sessionId, payload),
    onSuccess: () => {
      setError('');
      onSuccess();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? 'Could not save the evaluation. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!studentLevel) {
      setError('Please select the student level (A1–B2).');
      return;
    }
    if (!evaluationQuestions.trim() || !strengths.trim() || !weaknesses.trim() || !generalNotes.trim()) {
      setError('Please fill in all fields before submitting.');
      return;
    }
    setError('');
    mutation.mutate({
      evaluation_questions: evaluationQuestions.trim(),
      student_level:        studentLevel,
      strengths:            strengths.trim(),
      weaknesses:           weaknesses.trim(),
      general_notes:        generalNotes.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={S.container}>
          <View style={S.header}>
            <Ionicons name="clipboard-outline" size={24} color={C.sky} />
            <View style={{ flex: 1 }}>
              <Text style={S.title}>Assessment Session Evaluation</Text>
              {studentName && (
                <Text style={S.subtitle}>Student: {studentName}</Text>
              )}
            </View>
          </View>

          <Text style={S.hint}>
            Please complete the evaluation — it will be saved automatically to the student's notes in the CRM.
          </Text>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={S.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={S.field}>
              <Text style={S.label}>Student Level</Text>
              <View style={S.levelRow}>
                {LEVELS.map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[S.levelChip, studentLevel === lvl && S.levelChipOn]}
                    onPress={() => setStudentLevel(lvl)}
                  >
                    <Text style={[S.levelTxt, studentLevel === lvl && S.levelTxtOn]}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Field
              label="Post-session assessment questions"
              value={evaluationQuestions}
              onChangeText={setEvaluationQuestions}
              placeholder="Write the assessment questions you asked after the session..."
              minHeight={100}
            />
            <Field
              label="Student comprehension speed / strengths"
              value={strengths}
              onChangeText={setStrengths}
              placeholder="e.g. quick to understand, clear pronunciation, confident..."
            />
            <Field
              label="Student weaknesses"
              value={weaknesses}
              onChangeText={setWeaknesses}
              placeholder="e.g. needs grammar practice, limited vocabulary..."
            />
            <Field
              label="General notes"
              value={generalNotes}
              onChangeText={setGeneralNotes}
              placeholder="Any additional notes for the sales team..."
            />

            {error ? (
              <View style={S.errorBox}>
                <Text style={S.errorTxt}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <TouchableOpacity
            style={[S.submitBtn, mutation.isPending && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={S.submitTxt}>Save evaluation & send to CRM</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
  },
  title:    { fontSize: 20, fontWeight: '900', color: C.skyDark, textAlign: 'right' },
  subtitle: { fontSize: 13, color: C.grayMid, textAlign: 'right', marginTop: 2 },
  hint: {
    fontSize: 12, color: '#0369a1', textAlign: 'right',
    paddingHorizontal: 20, paddingBottom: 12, lineHeight: 18,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 4 },
  field:  { marginBottom: 14 },
  label:  { fontSize: 13, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e0f2fe',
    padding: 14, fontSize: 14, color: '#111', lineHeight: 22,
  },
  levelRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  levelChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0f2fe',
  },
  levelChipOn: { backgroundColor: C.sky, borderColor: C.sky },
  levelTxt:    { fontSize: 15, fontWeight: '800', color: C.grayMid },
  levelTxtOn:  { color: '#fff' },
  errorBox: {
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA', marginTop: 4,
  },
  errorTxt: { fontSize: 13, color: '#991B1B', textAlign: 'right' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.sky, marginHorizontal: 20, marginBottom: 28,
    paddingVertical: 16, borderRadius: 16,
  },
  submitTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
});

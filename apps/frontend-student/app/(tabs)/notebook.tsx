/**
 * Notebook tab — student personal notes.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import client from '@/api/client';

interface NoteEntry {
  id:         number;
  content:    string;
  created_at: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Asia/Amman',
  });
}

export default function NotebookScreen() {
  const qc      = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notebook'],
    queryFn:  () => client.get<{ data: NoteEntry[] }>('/student/notebook').then((r) => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: (content: string) =>
      client.post('/student/notebook', { content }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notebook'] });
      setDraft('');
    },
    onError: () => Alert.alert('خطأ', 'تعذر حفظ الملاحظة'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      client.delete(`/student/notebook/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notebook'] }),
    onError:   () => Alert.alert('خطأ', 'تعذر حذف الملاحظة'),
  });

  const handleAdd = () => {
    if (!draft.trim()) return;
    addMutation.mutate(draft.trim());
  };

  const handleDelete = (id: number) => {
    Alert.alert('حذف الملاحظة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>دفتر الملاحظات</Text>
        <Text style={styles.headerSub}>سجّل ما تتعلمه</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#10b981" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {(data ?? []).length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="journal-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>لا توجد ملاحظات بعد</Text>
                <Text style={styles.emptySub}>أضف أولى ملاحظاتك أدناه</Text>
              </View>
            )}
            {(data ?? []).map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteContent}>{note.content}</Text>
                <View style={styles.noteFooter}>
                  <Text style={styles.noteDate}>{fmt(note.created_at)}</Text>
                  <TouchableOpacity onPress={() => handleDelete(note.id)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Add note input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="أضف ملاحظة جديدة..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            textAlign="right"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            onPress={handleAdd}
            disabled={!draft.trim() || addMutation.isPending}
          >
            {addMutation.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#10b981',
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: '#d1fae5', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySub:   { fontSize: 13, color: '#9ca3af', marginTop: 8 },
  noteCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  noteContent: { fontSize: 15, color: '#111827', lineHeight: 22, textAlign: 'right' },
  noteFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  noteDate:    { fontSize: 11, color: '#9ca3af' },
  inputBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  input: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#e5e7eb', paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#111827', maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#10b981', borderRadius: 10,
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});

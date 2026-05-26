/**
 * Notebook tab — student personal notes with categories.
 * Purple accent / Navy text / Cream background.
 * Notes persisted on backend DB — synced across all devices.
 */
import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '@/api/client';
import { C, shadow } from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

// ─── Purple notebook accent ───────────────────────────────────────────────────
const P       = '#7C3AED';
const P_LIGHT = '#EDE9FE';
const TAB_H   = Platform.OS === 'ios' ? 82 : 62;

// ─── Categories ───────────────────────────────────────────────────────────────
interface Category { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }

const CATEGORIES: Category[] = [
  { key: 'all',          label: 'الكل',    icon: 'checkmark-done-circle' },
  { key: 'general',      label: 'عام',     icon: 'document-text'         },
  { key: 'grammar',      label: 'قواعد',   icon: 'text'                  },
  { key: 'examples',     label: 'أمثلة',   icon: 'bulb'                  },
  { key: 'observations', label: 'ملاحظات', icon: 'bookmark'              },
];

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  general:      { bg: P_LIGHT,   color: P         },
  grammar:      { bg: '#FEF3C7', color: '#D97706' },
  examples:     { bg: '#DCFCE7', color: '#16A34A' },
  observations: { bg: '#DBEAFE', color: '#2563EB' },
};

const catOf  = (key: string) => CATEGORIES.find((c) => c.key === key);
const catLabel = (key: string) => catOf(key)?.label ?? 'عام';
const catIcon  = (key: string) => (catOf(key)?.icon ?? 'document-text') as keyof typeof Ionicons.glyphMap;

// ─── Types ────────────────────────────────────────────────────────────────────
interface NoteEntry {
  id:         number;
  content:    string;
  category:   string;
  created_at: string;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ─── Note card ────────────────────────────────────────────────────────────────
function NoteCard({
  note, onEdit, onDelete, deleting,
}: {
  note: NoteEntry; onEdit: () => void;
  onDelete: () => void; deleting: boolean;
}) {
  const cs   = CAT_STYLE[note.category] ?? { bg: P_LIGHT, color: P };
  const icon = catIcon(note.category);
  return (
    <View style={nc.card}>
      <View style={nc.topRow}>
        <View style={[nc.catChip, { backgroundColor: cs.bg }]}>
          <Ionicons name={icon} size={13} color={cs.color} />
          <Text style={[nc.catTxt, { color: cs.color }]}>{catLabel(note.category)}</Text>
        </View>
        <View style={nc.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={C.gray} />
          <Text style={nc.dateTxt}>{fmtDate(note.created_at)}</Text>
        </View>
      </View>

      <Text style={nc.content}>{note.content}</Text>

      <View style={nc.actions}>
        <TouchableOpacity style={nc.deleteBtn} onPress={onDelete} disabled={deleting}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          {deleting
            ? <ActivityIndicator size="small" color={C.error} />
            : <Ionicons name="trash" size={18} color={C.error} />}
        </TouchableOpacity>
        <TouchableOpacity style={nc.editBtn} onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="pencil" size={18} color={C.info} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const nc = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 18,
    padding: 16, marginBottom: 12, ...shadow.sm,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  catTxt:  { fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateTxt: { fontSize: 12, color: C.gray, fontWeight: '500' },
  content: {
    fontSize: 15, color: C.navy, lineHeight: 23,
    textAlign: 'right', marginBottom: 12,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 10 },
  editBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center',
  },
});

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function NoteModal({
  visible, editing, onClose, onSave, saving,
}: {
  visible:  boolean;
  editing:  NoteEntry | null;
  onClose:  () => void;
  onSave:   (content: string, category: string) => void;
  saving:   boolean;
}) {
  const insets = useSafeAreaInsets();
  const [content,  setContent]  = useState(editing?.content  ?? '');
  const [category, setCategory] = useState(editing?.category ?? 'general');

  // Reset when modal opens/editing changes
  useMemo(() => {
    setContent(editing?.content   ?? '');
    setCategory(editing?.category ?? 'general');
  }, [editing, visible]);

  const isEdit = !!editing;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={md.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

          <View style={[md.sheet, { paddingBottom: insets.bottom + 8 }]}>
            {/* Purple header */}
            <View style={md.header}>
              <View style={md.headerIcon}>
                <Ionicons name="create" size={28} color={P} />
              </View>
              <Text style={md.headerTitle}>
                {isEdit ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة'}
              </Text>
              <Text style={md.headerSub}>اكتب ملاحظتك وصنّفها لتنظيم أفضل</Text>
            </View>

            {/* Scrollable body — stays above keyboard */}
            <ScrollView
              contentContainerStyle={md.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Content input */}
              <Text style={md.label}>الملاحظة</Text>
              <View style={md.inputWrap}>
                <TextInput
                  style={md.input}
                  value={content}
                  onChangeText={setContent}
                  placeholder="...اكتب ملاحظتك هنا"
                  placeholderTextColor={C.gray}
                  multiline
                  textAlign="right"
                  textAlignVertical="top"
                  maxLength={600}
                  autoFocus
                />
              </View>

              {/* Category picker */}
              <Text style={md.label}>التصنيف</Text>
              <View style={md.catRow}>
                {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => {
                  const active = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[md.catChip, active && md.catChipActive]}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={cat.icon} size={13} color={active ? C.white : C.grayMid} />
                      <Text style={[md.catTxt, active && md.catTxtActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Buttons */}
              <View style={md.btnRow}>
                <TouchableOpacity style={md.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                  <Text style={md.cancelTxt}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[md.saveBtn, (!content.trim() || saving) && md.saveBtnOff]}
                  onPress={() => content.trim() && onSave(content.trim(), category)}
                  disabled={!content.trim() || saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <>
                        <Ionicons name="save" size={16} color={C.white} />
                        <Text style={md.saveTxt}>حفظ</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const md = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: P, alignItems: 'center',
    paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20,
  },
  headerIcon: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.white, marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  body: { padding: 20 },
  label: {
    fontSize: 14, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1.5, borderColor: P_LIGHT, borderRadius: 16,
    backgroundColor: '#FAFAFF', marginBottom: 18, minHeight: 110,
  },
  input: {
    padding: 14, fontSize: 15, color: C.navy, minHeight: 110,
  },

  catRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginBottom: 24, justifyContent: 'flex-end',
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent',
  },
  catChipActive: { backgroundColor: P, borderColor: P },
  catTxt:        { fontSize: 12, fontWeight: '700', color: C.grayMid },
  catTxtActive:  { color: C.white },

  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 15,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: C.grayDark },
  saveBtn: {
    flex: 2, borderRadius: 14, paddingVertical: 15,
    backgroundColor: P, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  saveBtnOff: { opacity: 0.50 },
  saveTxt: { fontSize: 15, fontWeight: '900', color: C.white },
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotebookScreen() {
  const qc     = useQueryClient();
  const insets = useSafeAreaInsets();
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } = useAnimatedHeader();

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote,  setEditingNote]  = useState<NoteEntry | null>(null);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

  // ── Queries & mutations ──────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['notebook'],
    queryFn:  () => client.get<{ data: NoteEntry[] }>('/student/notebook').then((r) => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: ({ content, category }: { content: string; category: string }) =>
      client.post('/student/notebook', { content, category }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notebook'] }); setModalVisible(false); },
    onError:   () => Alert.alert('خطأ', 'تعذر حفظ الملاحظة'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content, category }: { id: number; content: string; category: string }) =>
      client.patch(`/student/notebook/${id}`, { content, category }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notebook'] }); setModalVisible(false); setEditingNote(null); },
    onError:   () => Alert.alert('خطأ', 'تعذر تعديل الملاحظة'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/student/notebook/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notebook'] }); setDeletingId(null); },
    onError:   () => { Alert.alert('خطأ', 'تعذر حذف الملاحظة'); setDeletingId(null); },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditingNote(null); setModalVisible(true); };
  const openEdit = (note: NoteEntry) => { setEditingNote(note); setModalVisible(true); };

  const handleSave = (content: string, category: string) => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, content, category });
    } else {
      addMutation.mutate({ content, category });
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('حذف الملاحظة', 'هل أنت متأكد من الحذف؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => { setDeletingId(id); deleteMutation.mutate(id); } },
    ]);
  };

  // ── Filtered notes ────────────────────────────────────────────────────────
  const notes = data ?? [];
  const filtered = useMemo(() => {
    let result = notes;
    if (activeFilter !== 'all') result = result.filter((n) => n.category === activeFilter);
    if (search.trim())          result = result.filter((n) => n.content.includes(search.trim()));
    return result;
  }, [notes, activeFilter, search]);

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Purple curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 12 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 80, height: 80, top: -22, right: -22 }]} />

        <View style={styles.headerContent}>
          <View style={styles.countPill}>
            <Ionicons name="journal" size={14} color={P} />
            <Text style={styles.countTxt}>{notes.length}</Text>
          </View>
          <View style={styles.titleRow}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="create" size={20} color={P} />
            </View>
            <Text style={styles.headerTitle}>دفتر الملاحظات</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>سجّل ما تتعلمه</Text>
      </Animated.View>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={P} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: headerHeight, paddingBottom: TAB_H + 80 }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Search ───────────────────────────────────────────────────── */}
          <View style={styles.searchCard}>
            <Ionicons name="search" size={18} color={P} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="...البحث في الملاحظات"
              placeholderTextColor={C.gray}
              textAlign="right"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={C.gray} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Filter chips ─────────────────────────────────────────────── */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>تصفية حسب التصنيف</Text>
            <View style={styles.chipsRow}>
              {CATEGORIES.map((cat) => {
                const active = activeFilter === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setActiveFilter(cat.key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={cat.icon} size={14} color={active ? C.white : C.grayMid} />
                    <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Notes list ───────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="journal-outline" size={36} color={P} />
              </View>
              <Text style={styles.emptyTitle}>
                {notes.length === 0 ? 'لا توجد ملاحظات بعد' : 'لا توجد نتائج'}
              </Text>
              <Text style={styles.emptySub}>
                {notes.length === 0 ? 'اضغط + لإضافة أولى ملاحظاتك ✍️' : 'جرّب تغيير الفلتر أو كلمة البحث'}
              </Text>
            </View>
          ) : (
            filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onDelete={() => handleDelete(note.id)}
                deleting={deletingId === note.id && deleteMutation.isPending}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + TAB_H + 16 }]}>
        <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={30} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <NoteModal
        visible={modalVisible}
        editing={editingNote}
        onClose={() => { setModalVisible(false); setEditingNote(null); }}
        onSave={handleSave}
        saving={isSaving}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: P,
    paddingHorizontal: 22, paddingBottom: 22,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: P, shadowOpacity: 0.30,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  dot: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: C.white, opacity: 0.12,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.white },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: '600', textAlign: 'right' },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  countTxt: { fontSize: 15, fontWeight: '900', color: C.white },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { padding: 16 },

  // ── Search ────────────────────────────────────────────────────────────────
  searchCard: {
    backgroundColor: C.white, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    gap: 10, marginBottom: 12, ...shadow.sm,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: C.navy,
  },

  // ── Filter ────────────────────────────────────────────────────────────────
  filterCard: {
    backgroundColor: C.white, borderRadius: 16,
    padding: 16, marginBottom: 16, ...shadow.sm,
  },
  filterLabel: {
    fontSize: 14, fontWeight: '800', color: C.navy,
    textAlign: 'right', marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, justifyContent: 'flex-end',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  chipActive:    { backgroundColor: P },
  chipTxt:       { fontSize: 13, fontWeight: '700', color: C.grayMid },
  chipTxtActive: { color: C.white },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 40, alignItems: 'center', ...shadow.sm,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: P_LIGHT,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: C.gray, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fabWrap: {
    position: 'absolute', left: 0, right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: P,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: P, shadowOpacity: 0.40,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});

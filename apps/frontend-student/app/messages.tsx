/**
 * Messages screen — read-only admin messages for the student.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated, Modal, RefreshControl, Linking, 
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentMessagesApi, type StudentMessage } from '@/api/messages';
import { C, shadow } from '@/theme';
import { useAnimatedHeader } from '@/hooks/useAnimatedHeader';

// ─── Message card ─────────────────────────────────────────────────────────────

function MessageCard({
  msg,
  onPress,
}: {
  msg: StudentMessage;
  onPress: () => void;
}) {
  const isUnread = !msg.read_at;
  const date = new Date(msg.created_at).toLocaleDateString('ar-JO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Unread dot */}
      {isUnread && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.cardIcon, isUnread && styles.cardIconUnread]}>
        <Ionicons
          name="mail"
          size={20}
          color={isUnread ? C.navy : C.gray}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, !isUnread && styles.textRead]} numberOfLines={1}>
          {msg.title}
        </Text>
        <Text style={styles.cardPreview} numberOfLines={2}>
          {msg.body}
        </Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>

      <Ionicons name="chevron-back" size={16} color={C.border} />
    </TouchableOpacity>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function MessageModal({
  msg,
  onClose,
}: {
  msg: StudentMessage | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!msg) return null;

  const date = new Date(msg.created_at).toLocaleDateString('ar-JO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Modal
      visible={!!msg}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { paddingBottom: insets.bottom + 16 }]}>
        {/* Modal header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={18} color={C.navy} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>رسالة من الإدارة</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.modalBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Yellow accent strip */}
          <View style={styles.modalAccent} />

          <Text style={styles.modalTitle}>{msg.title}</Text>
          <Text style={styles.modalDate}>{date}</Text>

          <View style={styles.modalDivider} />

          <Text style={styles.modalBody2}>{msg.body}</Text>

          {/* Generic link an admin attached to the message. Deliberately NOT
              labelled or iconed as a payment action: App Review treats any
              "pay / invoice" call-to-action as directing users to purchase
              outside the app (Guideline 3.1.1). */}
          {!!msg.link && (
            <TouchableOpacity
              style={styles.linkBtn}
              activeOpacity={0.85}
              onPress={() =>
                Linking.openURL(msg.link!).catch(() =>
                  appAlert('تعذّر الفتح', 'لم نتمكن من فتح الرابط. حاول لاحقاً.'),
                )
              }
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={styles.linkBtnTxt}>فتح الرابط</Text>
            </TouchableOpacity>
          )}

          {/* Read-only notice */}
          <View style={styles.readOnlyNote}>
            <Ionicons name="information-circle-outline" size={14} color={C.gray} />
            <Text style={styles.readOnlyTxt}>هذه الرسالة للقراءة فقط ولا يمكن الرد عليها</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const [selected, setSelected] = useState<StudentMessage | null>(null);
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } =
    useAnimatedHeader({ animateTabBar: false });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['student-messages'],
    queryFn:  studentMessagesApi.list,
  });

  const messages = data?.messages ?? [];

  const { mutate: markRead } = useMutation({
    mutationFn: (id: number) => studentMessagesApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-messages'] });
      qc.invalidateQueries({ queryKey: ['messages-unread'] });
    },
  });

  const openMessage = (msg: StudentMessage) => {
    setSelected(msg);
    if (!msg.read_at) markRead(msg.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={[styles.dot, { width: 80, height: 80, top: -22, right: -22 }]} />
        <View style={[styles.dot, { width: 38, height: 38, bottom: 12, left: 16 }]} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward" size={20} color={C.navy} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>رسائل الإدارة</Text>
        {(data?.unread ?? 0) > 0 && (
          <Text style={styles.headerSub}>{data!.unread} رسالة غير مقروءة</Text>
        )}
      </Animated.View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.yellow} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.yellow} />}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="mail-outline" size={36} color={C.yellow} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد رسائل بعد</Text>
              <Text style={styles.emptySub}>
                ستظهر هنا رسائل الإدارة عند إرسالها
              </Text>
            </View>
          ) : (
            messages.map((msg) => (
              <MessageCard key={msg.id} msg={msg} onPress={() => openMessage(msg)} />
            ))
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <MessageModal msg={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: C.amber,
    shadowOpacity: 0.28, shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  dot: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: C.white, opacity: 0.18,
  },
  backBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10, padding: 7, marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right', marginBottom: 2,
  },
  headerSub: {
    fontSize: 12, fontWeight: '700', color: C.navyMid, textAlign: 'right',
  },

  // List
  scroll: { padding: 16, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.sm,
  },
  cardUnread: {
    borderWidth: 1.5,
    borderColor: C.yellow,
  },
  unreadDot: {
    position: 'absolute',
    top: 12, left: 12,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.yellow,
  },
  cardIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  cardIconUnread: { backgroundColor: C.yellow + '22' },
  cardTitle: {
    fontSize: 14, fontWeight: '800', color: C.navy, textAlign: 'right', marginBottom: 3,
  },
  textRead: { fontWeight: '600', color: C.gray },
  cardPreview: {
    fontSize: 12, color: C.gray, textAlign: 'right', lineHeight: 17, marginBottom: 4,
  },
  cardDate: { fontSize: 11, color: C.border, textAlign: 'right' },

  // Empty
  emptyWrap: {
    alignItems: 'center', paddingVertical: 60,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...shadow.sm,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.navy, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.gray, textAlign: 'center' },

  // Modal
  modalRoot: {
    flex: 1, backgroundColor: C.white,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalClose: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.navy },
  modalBody: { padding: 20 },
  modalAccent: {
    height: 4, backgroundColor: C.yellow,
    borderRadius: 2, marginBottom: 20,
    alignSelf: 'flex-end', width: 40,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '900', color: C.navy,
    textAlign: 'right', marginBottom: 8, lineHeight: 28,
  },
  modalDate: { fontSize: 12, color: C.gray, textAlign: 'right', marginBottom: 16 },
  modalDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },
  modalBody2: {
    fontSize: 15, color: C.navy, textAlign: 'right',
    lineHeight: 26, fontWeight: '400',
  },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20,
    backgroundColor: C.navy, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18,
  },
  linkBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  readOnlyNote: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: 28,
    backgroundColor: '#F9FAFB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  readOnlyTxt: { fontSize: 12, color: C.gray, flex: 1, textAlign: 'right' },
});

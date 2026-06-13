/**
 * Requests Center — Requests Center
 * Tabs: Demo | Core | Private | Group
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestsApi, type SessionRequest } from '@/api/requests';
import { fmtManila } from '@/lib/time';
import { C, shadow } from '@/theme';

type Tab = 'demo' | 'core' | 'private' | 'group';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'demo',    label: 'Assessment',  icon: 'star-outline' },
  { key: 'core',    label: 'Core',   icon: 'book-outline' },
  { key: 'private', label: 'Private',     icon: 'person-outline' },
  { key: 'group',   label: 'Group',   icon: 'people-outline' },
];

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

function RequestCard({ req, onAccept, accepting }: {
  req:       SessionRequest;
  onAccept:  () => void;
  accepting: boolean;
}) {
  const levelCode  = req.lesson?.level?.code ?? '';
  const lessonNum  = req.lesson?.order != null ? `Lesson ${req.lesson.order}` : '';
  const lessonMeta = [levelCode, lessonNum].filter(Boolean).join('  ·  ');

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: C.sky }]} />
      <View style={styles.cardBody}>

        {/* Time */}
        <Text style={styles.cardTime}>{fmt(req.scheduled_at)}</Text>
        {req.scheduled_at && (
          <Text style={styles.cardTimePH}>🇵🇭 {fmtManila(req.scheduled_at)} (Manila)</Text>
        )}

        {/* Student name + gender pref */}
        <View style={styles.studentRow}>
          <Text style={styles.cardStudent}>{req.student?.name ?? 'Student'}</Text>
          {req.teacher_gender_pref && (
            <View style={[styles.genderBadge,
              req.teacher_gender_pref === 'male' ? styles.genderBadgeMale : styles.genderBadgeFemale
            ]}>
              <Text style={styles.genderBadgeTxt}>
                {req.teacher_gender_pref === 'male' ? '👨 Male' : '👩 Female'}
              </Text>
            </View>
          )}
        </View>

        {/* Lesson */}
        {req.lesson?.title && (
          <View style={styles.cardMeta}>
            <Ionicons name="book-outline" size={13} color={C.grayMid} />
            <Text style={styles.cardMetaTxt} numberOfLines={1}>{req.lesson.title}</Text>
            {lessonMeta ? (
              <View style={styles.lessonBadge}>
                <Text style={styles.lessonBadgeTxt}>{lessonMeta}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Student note */}
        {req.note ? (
          <View style={styles.noteBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.skyDark} />
            <Text style={styles.noteTxt}>{req.note}</Text>
          </View>
        ) : null}

        {/* Accept button */}
        <TouchableOpacity
          style={[styles.acceptBtn, accepting && { opacity: 0.6 }]}
          onPress={onAccept}
          disabled={accepting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[C.sky, C.skyDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.acceptGrad}
          >
            {accepting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
                  <Text style={styles.acceptTxt}>Claim Session</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
}

export default function RequestsScreen() {
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const [tab, setTab] = useState<Tab>('core');

  // Fetch ALL requests once — filter client-side per tab + count badges
  const { data: allData = [], isLoading, refetch, isFetching } = useQuery({
    queryKey:  ['requests', 'all'],
    queryFn:   () => requestsApi.list(''),   // no type filter → backend returns all
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const data   = allData.filter((r) => r.type === tab);
  const counts = {
    demo:    allData.filter((r) => r.type === 'demo').length,
    core:    allData.filter((r) => r.type === 'core').length,
    private: allData.filter((r) => r.type === 'private').length,
    group:   allData.filter((r) => r.type === 'group').length,
  };

  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const acceptMutation = useMutation({
    mutationFn: (id: number) => requestsApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setAcceptingId(null);
    },
    onError: (e: any) => {
      setAcceptingId(null);
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not claim the request');
    },
  });

  const handleAccept = (id: number) => {
    setAcceptingId(id);
    acceptMutation.mutate(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      {/* Header */}
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Requests Center</Text>
        <Text style={styles.headerSub}>{allData.length} pending requests</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const cnt = counts[t.key];
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={t.icon as any}
                size={15}
                color={tab === t.key ? C.sky : C.grayMid}
              />
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {cnt > 0 && (
                <View style={[styles.tabBadge, tab === t.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeTxt, tab === t.key && styles.tabBadgeTxtActive]}>
                    {cnt}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.sky} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={C.sky} style={{ marginTop: 40 }} />
        ) : data.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={52} color={C.skyLight} />
            <Text style={styles.emptyTxt}>No requests in this category</Text>
          </View>
        ) : (
          data.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onAccept={() => handleAccept(req.id)}
              accepting={acceptingId === req.id}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 2 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 4,
    ...shadow.sm,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
    paddingVertical: 9, borderRadius: 12,
  },
  tabItemActive:  { backgroundColor: C.cream },
  tabLabel:       { fontSize: 12, fontWeight: '600', color: C.grayMid },
  tabLabelActive: { color: C.sky, fontWeight: '800' },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: C.grayLight,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: C.sky },
  tabBadgeTxt:    { fontSize: 9, fontWeight: '800', color: C.grayMid },
  tabBadgeTxtActive: { color: '#fff' },

  scroll: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 18,
    flexDirection: 'row', overflow: 'hidden',
    ...shadow.sm,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },

  cardTime:    { fontSize: 11, color: C.grayMid },
  cardTimePH:  { fontSize: 10, color: C.sky, fontWeight: '700', marginTop: 1 },
  studentRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 6 },
  cardStudent: { fontSize: 16, fontWeight: '800', color: C.skyDark, textAlign: 'right' },
  genderBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  genderBadgeMale:   { backgroundColor: '#EFF6FF' },
  genderBadgeFemale: { backgroundColor: '#FDF2F8' },
  genderBadgeTxt:    { fontSize: 11, fontWeight: '700', color: C.skyDark },

  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 },
  cardMetaTxt: { fontSize: 12, color: C.grayMid },

  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: C.sky + '12',
    borderRadius: 10, padding: 9, marginBottom: 10,
    borderWidth: 1, borderColor: C.sky + '26',
  },
  noteTxt: {
    flex: 1, fontSize: 12, color: C.skyDark, fontWeight: '600',
    textAlign: 'right', lineHeight: 18,
  },
  lessonBadge: {
    backgroundColor: C.sky + '18', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, marginRight: 4,
  },
  lessonBadgeTxt: { fontSize: 10, fontWeight: '700', color: C.skyDark },

  acceptBtn:  { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  acceptGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 11,
  },
  acceptTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  empty: { alignItems: 'center', gap: 12, marginTop: 60 },
  emptyTxt: { fontSize: 14, color: C.grayMid, fontWeight: '600' },
});

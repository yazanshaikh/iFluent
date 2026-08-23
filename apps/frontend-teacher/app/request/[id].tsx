/**
 * Request Profile — Request Profile
 * Teacher sees lesson details + student info, enters Nearpod PIN, then activates.
 */
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { requestsApi } from '@/api/requests';
import { C, shadow } from '@/theme';
import { appAlert } from '@/lib/alert';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={C.sky} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function RequestProfileScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const qc       = useQueryClient();
  const [pin, setPin] = useState('');

  const { data: req, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn:  () => requestsApi.show(Number(id)),
    enabled:  !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: () => requestsApi.accept(Number(id), pin.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      appAlert('Activated', 'Request accepted and session activated for the student.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: any) =>
      appAlert('Error', e?.response?.data?.message ?? 'Could not activate the session'),
  });

  const handleActivate = () => {
    appAlert(
      'Activate Session',
      'Are you sure you want to activate this session for the student?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: () => acceptMutation.mutate() },
      ],
    );
  };

  const browseLessons = () => router.push('/lessons');

  if (isLoading || !req) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.sky} size="large" />
      </View>
    );
  }

  const lesson  = req.lesson;
  const student = req.student;
  const levelCode = lesson?.level?.code ?? '';
  const lessonNum = lesson?.order ? `Lesson ${lesson.order}` : '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
        {/* ── Header ── */}
        <LinearGradient
          colors={[C.sky, C.skyDark]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.headerTitle}>Request Profile</Text>
            {levelCode || lessonNum ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeTxt}>
                  {[levelCode, lessonNum].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Lesson card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Info</Text>
            <View style={styles.card}>
              <InfoRow
                icon="book-outline"
                label="Session Name"
                value={lesson?.title ?? '—'}
              />
              {lesson?.level && (
                <InfoRow
                  icon="layers-outline"
                  label="Level"
                  value={`${lesson.level.code} — ${lesson.level.name}`}
                />
              )}
              {lesson?.order != null && (
                <InfoRow
                  icon="list-outline"
                  label="Lesson No."
                  value={`${lesson.order}`}
                />
              )}
            </View>
          </View>

          {/* ── Student card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Student Info</Text>
            <View style={styles.card}>
              <InfoRow
                icon="person-outline"
                label="Name"
                value={student?.name ?? '—'}
              />
              {student?.age != null && (
                <InfoRow
                  icon="calendar-outline"
                  label="Age"
                  value={`${student.age} yrs`}
                />
              )}
            </View>
          </View>

          {/* ── Nearpod section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearpod</Text>
            <View style={styles.card}>
              <Text style={styles.nearpodHint}>
                Browse the lessons, open the one you're teaching in Nearpod, launch it to get the PIN, then enter it here to activate the session.
              </Text>

              {/* Browse lessons button */}
              <TouchableOpacity style={styles.nearpodBtn} onPress={browseLessons} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.nearpodBtnGrad}
                >
                  <Ionicons name="library-outline" size={18} color="#fff" />
                  <Text style={styles.nearpodBtnTxt}>Browse Lessons</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* PIN input */}
              <View style={styles.pinRow}>
                <Ionicons name="keypad-outline" size={18} color={C.grayMid} />
                <TextInput
                  style={styles.pinInput}
                  placeholder="Enter the PIN from Nearpod"
                  placeholderTextColor={C.grayMid}
                  value={pin}
                  onChangeText={setPin}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                />
              </View>
            </View>
          </View>

          {/* ── Activate button ── */}
          <TouchableOpacity
            style={[styles.activateBtn, acceptMutation.isPending && { opacity: 0.6 }]}
            onPress={handleActivate}
            activeOpacity={0.85}
            disabled={acceptMutation.isPending}
          >
            <LinearGradient
              colors={[C.sky, C.skyDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.activateBtnGrad}
            >
              {acceptMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.activateBtnTxt}>Activate Session for Student</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  headerBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  scroll: { padding: 16, gap: 0 },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: C.grayMid,
    textAlign: 'right', marginBottom: 8, marginRight: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 16, gap: 14, ...shadow.sm,
  },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 11, color: C.grayMid, fontWeight: '600', textAlign: 'right' },
  infoValue: { fontSize: 15, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginTop: 1 },

  nearpodHint: {
    fontSize: 13, color: C.grayMid, textAlign: 'right',
    lineHeight: 20,
  },
  nearpodBtn: { borderRadius: 14, overflow: 'hidden' },
  nearpodBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 13,
  },
  nearpodBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },

  pinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0F9FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1.5, borderColor: C.skyLight,
  },
  pinInput: {
    flex: 1, fontSize: 16, fontWeight: '700',
    color: C.skyDark, paddingVertical: 10,
  },

  activateBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  activateBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 18,
  },
  activateBtnTxt: { fontSize: 17, fontWeight: '900', color: '#fff' },
});

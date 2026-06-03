/**
 * Session Details Screen
 * Shows full session info + Start Session button
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sessionsApi } from '@/api/sessions';
import { C, shadow, STATUS_COLOR, STATUS_LABEL } from '@/theme';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: C.cream }]}>
        <Ionicons name={icon as any} size={18} color={C.sky} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Amman',
  });
}

export default function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn:  () => sessionsApi.get(sessionId),
    staleTime: 15_000,
  });

  const startMutation = useMutation({
    mutationFn: () => sessionsApi.start(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      // Navigate to classroom
      router.push({ pathname: '/classroom/[id]', params: { id: String(sessionId) } });
    },
    onError: (e: any) =>
      Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر بدء الحصة'),
  });

  const handleStart = () => {
    Alert.alert(
      'بدء الحصة',
      'سيتم إنشاء غرفة Daily.co وتحويل الحصة للحالة النشطة. هل تريد المتابعة؟',
      [
        { text: 'تراجع', style: 'cancel' },
        { text: 'ابدأ الحصة', onPress: () => startMutation.mutate() },
      ],
    );
  };

  if (isLoading || !session) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.sky} />
      </View>
    );
  }

  const statusColor = STATUS_COLOR[session.status] ?? C.gray;
  const isActive    = session.status === 'active';
  const canStart    = session.status === 'confirmed' || session.status === 'waiting';

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.statusBadge, { borderColor: statusColor + '66' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusTxt, { color: statusColor }]}>
            {STATUS_LABEL[session.status] ?? session.status}
          </Text>
        </View>
        <Text style={styles.studentName}>{session.student?.name ?? 'طالب'}</Text>
        {session.lesson?.title && (
          <Text style={styles.lessonName}>{session.lesson.title}</Text>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تفاصيل الحصة</Text>
          <InfoRow icon="calendar-outline"    label="الموعد"     value={fmt(session.scheduled_at)} />
          <InfoRow icon="person-outline"      label="الطالب"     value={session.student?.name ?? '—'} />
          <InfoRow icon="book-outline"        label="الدرس"      value={session.lesson?.title ?? '—'} />
          {session.started_at && (
            <InfoRow icon="play-circle-outline" label="بدأت"     value={fmt(session.started_at)} />
          )}
          {session.ended_at && (
            <InfoRow icon="stop-circle-outline" label="انتهت"    value={fmt(session.ended_at)} />
          )}
          {session.nearpod_pin && (
            <InfoRow icon="key-outline"         label="Nearpod PIN" value={session.nearpod_pin} />
          )}
          {session.daily_room_url && (
            <InfoRow icon="link-outline"        label="Daily Room"  value="متاح" />
          )}
        </View>

        {/* CTA */}
        {isActive && (
          <TouchableOpacity
            style={styles.classroomBtn}
            onPress={() => router.push({ pathname: '/classroom/[id]', params: { id: String(sessionId) } })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[C.success, '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.ctaTxt}>العودة للفصل الافتراضي</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {canStart && (
          <TouchableOpacity
            style={[styles.classroomBtn, startMutation.isPending && { opacity: 0.6 }]}
            onPress={handleStart}
            disabled={startMutation.isPending}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[C.sky, C.skyDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
              {startMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text style={styles.ctaTxt}>بدء الحصة</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF' },

  header: {
    paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    position: 'relative',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-start', marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end', borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    position: 'absolute', top: 20, right: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 12, fontWeight: '700' },
  studentName: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'right' },
  lessonName:  { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 4 },

  scroll: { padding: 16, gap: 14 },

  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 20, ...shadow.sm },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginBottom: 16 },

  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon:  { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoText:  { flex: 1, alignItems: 'flex-end' },
  infoLabel: { fontSize: 11, color: C.grayMid },
  infoValue: { fontSize: 14, fontWeight: '700', color: C.grayDark, marginTop: 2 },

  classroomBtn: { borderRadius: 16, overflow: 'hidden' },
  ctaGrad:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaTxt:       { color: '#fff', fontSize: 16, fontWeight: '800' },
});

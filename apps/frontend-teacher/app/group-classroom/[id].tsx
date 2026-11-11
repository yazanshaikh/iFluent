/**
 * Group Virtual Classroom — teacher. Same split as the individual classroom
 * (video call + Nearpod control), with the group grid and mute controls.
 */
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupClassesApi } from '@/api/groupClasses';
import { GroupCallPanel } from '@/components/GroupCallPanel';
import { SplitCallLayout } from '@/components/SplitCallLayout';
import { useAuthStore } from '@/stores/authStore';
import { appAlert } from '@/lib/alert';
import { C } from '@/theme';

function NearpodControl({ nearpodUrl, pin }: { nearpodUrl: string; pin?: string | null }) {
  const open = () => (Platform.OS === 'web'
    ? window.open(nearpodUrl, '_blank', 'noopener,noreferrer')
    : Linking.openURL(nearpodUrl));

  return (
    <View style={S.nearpod}>
      <Text style={{ fontSize: 32 }}>📚</Text>
      <Text style={S.nearpodTitle}>Nearpod</Text>
      <Text style={S.nearpodHint}>
        Nearpod does not allow embedding in the app.{'\n'}Open it in a new tab to control the lesson.
      </Text>
      <TouchableOpacity style={S.nearpodBtn} onPress={open}>
        <Ionicons name="open-outline" size={18} color="#fff" />
        <Text style={S.nearpodBtnTxt}>Open Nearpod in a new tab</Text>
      </TouchableOpacity>
      {pin && (
        <View style={S.pinBox}>
          <Text style={S.pinLabel}>Class PIN:</Text>
          <Text style={S.pin}>{pin}</Text>
          <Text style={S.pinNote}>Students use this PIN to join</Text>
        </View>
      )}
    </View>
  );
}

export default function GroupClassroomScreen() {
  const { id, roomUrl: paramRoomUrl } = useLocalSearchParams<{ id: string; roomUrl?: string }>();
  const classId = Number(id);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const teacherName = useAuthStore((state) => state.user?.name);

  const { data } = useQuery({
    queryKey: ['teacher-group-class', classId],
    queryFn:  () => groupClassesApi.get(classId),
  });

  // The owner link (mute controls) — reuse the one from Start when present.
  const { data: room, isError } = useQuery({
    queryKey: ['teacher-group-room', classId],
    queryFn:  () => groupClassesApi.room(classId),
    enabled:  !paramRoomUrl,
    retry: false,
  });

  const end = useMutation({
    mutationFn: () => groupClassesApi.end(classId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['teacher-group-class', classId] });
      qc.invalidateQueries({ queryKey: ['teacher-group-classes'] });
      router.replace('/(tabs)/group-classes');
    },
    onError: (e: any) => appAlert('Error', e?.response?.data?.message ?? 'Could not end the class'),
  });

  const confirmEnd = () =>
    appAlert('End Class', 'Do you want to end the meeting and close the class for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => end.mutate() },
    ]);

  const roomUrl    = paramRoomUrl || room?.daily_room_url;
  const item       = data?.class;
  const nearpodUrl = item?.lesson?.nearpod_url ?? 'https://nearpod.com/my-library';

  if (!roomUrl) {
    return (
      <View style={S.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        {isError ? (
          <>
            <Ionicons name="alert-circle-outline" size={52} color={C.error} />
            <Text style={{ color: '#fff', marginTop: 12 }}>Room link unavailable</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, padding: 12 }}>
              <Text style={{ color: C.sky, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>
          </>
        ) : <ActivityIndicator size="large" color={C.sky} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[S.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={S.topBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(`/group-class/${classId}`))}
        >
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={S.topCenter}>
          <Text style={S.topTitle} numberOfLines={1}>{item?.lesson?.title ?? item?.title ?? 'Group Class'}</Text>
          <View style={S.liveBadge}>
            <View style={S.liveDot} />
            <Text style={S.liveTxt}>LIVE · {item?.registered_count ?? 0} students</Text>
          </View>
        </View>
        <TouchableOpacity style={S.endBtn} onPress={confirmEnd} disabled={end.isPending}>
          {end.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.endTxt}>End</Text>}
        </TouchableOpacity>
      </View>

      <SplitCallLayout
        call={<GroupCallPanel roomUrl={roomUrl} userName={teacherName} moderator />}
        content={<NearpodControl nearpodUrl={nearpodUrl} pin={item?.nearpod_pin} />}
      />
    </View>
  );
}

const S = StyleSheet.create({
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: '#0f172a',
  },
  topBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  topCenter: { flex: 1, alignItems: 'center', gap: 2 },
  topTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  liveTxt: { color: '#fca5a5', fontSize: 11, fontWeight: '800' },
  endBtn: { backgroundColor: C.error, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, minWidth: 56, alignItems: 'center' },
  endTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  nearpod: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
  nearpodTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  nearpodHint: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  nearpodBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  nearpodBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  pinBox: { alignItems: 'center', gap: 4, backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 14, padding: 14 },
  pinLabel: { color: '#94a3b8', fontSize: 12 },
  pin: { color: '#7c3aed', fontSize: 28, fontWeight: '900', letterSpacing: 6 },
  pinNote: { color: '#64748b', fontSize: 11 },
});

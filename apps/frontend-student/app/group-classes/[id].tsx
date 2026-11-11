/** Group class profile: details, seats, register / leave, and the live room. */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { fixStorageUrl } from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupClassesApi } from '@/api/groupClasses';
import { GroupCallPanel } from '@/components/GroupCallPanel';
import { SplitCallLayout } from '@/components/SplitCallLayout';
import { WebViewUniversal } from '@/components/WebViewUniversal';
import { profileApi } from '@/api/profile';
import { appAlert } from '@/lib/alert';
import { formatJordanDateTime } from '@/lib/bookingSlots';
import { C, shadow } from '@/theme';

const PURPLE = '#7C3AED';

const errorMessage = (e: any) => e?.response?.data?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى';

export default function GroupClassProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = Number(id);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [nearpod, setNearpod] = useState<{ url: string; pin: string } | null>(null);
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: profileApi.get });

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ['group-class', classId],
    queryFn:  () => groupClassesApi.get(classId),
    refetchInterval: 10_000,
    retry: false,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-class', classId] });
    qc.invalidateQueries({ queryKey: ['group-classes'] });
    qc.invalidateQueries({ queryKey: ['group-classes-mine'] });
    qc.invalidateQueries({ queryKey: ['profile'] });
  };

  // The class ending removes it from the student's list, which closes the room.
  const ended = isError && roomUrl !== null;
  useEffect(() => {
    if (!ended) return;
    setRoomUrl(null);
    refresh();
    if (router.canGoBack()) router.back(); else router.replace('/group-classes');
  }, [ended]);

  const register = useMutation({
    mutationFn: () => groupClassesApi.register(classId),
    onSuccess:  refresh,
    onError:    (e) => appAlert('خطأ', errorMessage(e)),
  });

  const leave = useMutation({
    mutationFn: () => groupClassesApi.leave(classId),
    onSuccess:  refresh,
    onError:    (e) => appAlert('خطأ', errorMessage(e)),
  });

  const join = useMutation({
    mutationFn: () => groupClassesApi.join(classId),
    onSuccess:  (data) => {
      setNearpod({ url: data.nearpod_url, pin: data.nearpod_pin });
      setRoomUrl(data.daily_room_url);
    },
    onError:    (e) => appAlert('خطأ', errorMessage(e)),
  });

  const confirmLeave = () =>
    appAlert('إلغاء التسجيل', 'سيتم إلغاء تسجيلك وإعادة الحصة إلى رصيدك.', [
      { text: 'تراجع', style: 'cancel' },
      { text: 'تأكيد', style: 'destructive', onPress: () => leave.mutate() },
    ]);

  if (roomUrl) {
    return (
      <View style={[s.room, { paddingTop: insets.top }]}>
        {/* Same as individual lessons: the call beside the student's Nearpod */}
        {nearpod && (
          <View style={s.pinChip}>
            <Text style={s.pinChipTxt}>رمز Nearpod: {nearpod.pin.toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <SplitCallLayout
            call={<GroupCallPanel roomUrl={roomUrl} userName={profile?.name} />}
            content={nearpod
              ? <WebViewUniversal key={`nearpod-group-${classId}`} uri={nearpod.url} loadingColor="#7c3aed" />
              : <View style={{ flex: 1, backgroundColor: '#fff' }} />}
          />
        </View>
        <TouchableOpacity
          style={[s.leaveRoom, { marginBottom: insets.bottom + 12 }]}
          onPress={() => setRoomUrl(null)}
          activeOpacity={0.85}
        >
          <Text style={s.leaveRoomTxt}>مغادرة الحصة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const busy = register.isPending || leave.isPending || join.isPending;

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/group-classes'))}
          hitSlop={12}
        >
          <Ionicons name="chevron-forward" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>تفاصيل الحصة</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={C.navy} />
      ) : isError || !item ? (
        <Text style={s.empty}>{errorMessage(error)}</Text>
      ) : (
        <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 24 }]}>
          <View style={s.card}>
            {item.lesson_number !== null && <Text style={s.lessonNo}>الدرس {item.lesson_number}</Text>}
            <Text style={s.lessonTitle}>{item.lesson?.title ?? item.title}</Text>
            {!!item.lesson && item.title !== item.lesson.title && <Text style={s.title}>{item.title}</Text>}
            {!!(item.description ?? item.lesson?.description) && (
              <Text style={s.description}>{item.description ?? item.lesson?.description}</Text>
            )}
            {!!fixStorageUrl(item.lesson?.pdf_url) && (
              <TouchableOpacity
                style={s.pdfBtn}
                activeOpacity={0.82}
                onPress={() => Linking.openURL(fixStorageUrl(item.lesson?.pdf_url)!)}
              >
                <Ionicons name="document-text" size={16} color={PURPLE} />
                <Text style={s.pdfTxt}>تحميل مادة الدرس</Text>
                <Ionicons name="download-outline" size={14} color={PURPLE} />
              </TouchableOpacity>
            )}
          </View>

          <View style={s.card}>
            <Row icon="time-outline" label="الموعد" value={formatJordanDateTime(item.scheduled_at)} />
            <Row icon="person-outline" label="المعلم" value={item.teacher.name ?? '—'} />
            {!!item.teacher.code && (
              <Row icon="id-card-outline" label="رقم تعريف المعلم" value={item.teacher.code} />
            )}
            <Row icon="people-outline" label="الطلاب المسجلون" value={`${item.registered_count} من ${item.max_seats}`} />
          </View>

          {item.status === 'completed' || item.status === 'cancelled' ? (
            <>
              <Text style={s.note}>
                {item.status === 'cancelled' ? 'أُلغيت هذه الحصة.' : 'انتهت هذه الحصة.'}
              </Text>
              {item.status === 'completed' && item.is_registered && !!item.lesson?.activity_url && (
                <View style={s.card}>
                  <Text style={s.lessonTitle}>النشاط التفاعلي</Text>
                  {item.activity_unlocked ? (
                    <TouchableOpacity
                      style={s.activityBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push({
                        pathname: '/activity/[id]',
                        params: { id: String(item.lesson!.id), url: item.lesson!.activity_url!, title: item.lesson!.title },
                      })}
                    >
                      <Ionicons name="game-controller" size={18} color={C.white} />
                      <Text style={s.activityTxt}>افتح النشاط</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={s.note}>النشاط يُفتح بعد حضور الحصة 🔐</Text>
                  )}
                </View>
              )}
            </>
          ) : item.status === 'active' && item.is_registered ? (
            <TouchableOpacity style={s.primary} disabled={busy} onPress={() => join.mutate()} activeOpacity={0.85}>
              {join.isPending ? <ActivityIndicator color={C.navy} /> : <Text style={s.primaryTxt}>دخول الحصة</Text>}
            </TouchableOpacity>
          ) : item.is_registered ? (
            <>
              <View style={s.registered}>
                <Ionicons name="checkmark-circle" size={20} color="#15803D" />
                <Text style={s.registeredTxt}>أنت مسجل في هذه الحصة</Text>
              </View>
              {item.can_leave ? (
                <TouchableOpacity style={s.secondary} disabled={busy} onPress={confirmLeave} activeOpacity={0.85}>
                  <Text style={s.secondaryTxt}>إلغاء التسجيل</Text>
                </TouchableOpacity>
              ) : (
                <Text style={s.note}>لا يمكن إلغاء التسجيل قبل أقل من نصف ساعة من موعد الحصة.</Text>
              )}
            </>
          ) : !item.registration_open && !item.is_full ? (
            <Text style={s.note}>انتهى موعد التسجيل في هذه الحصة. يُغلق التسجيل قبل ٥ دقائق من موعدها.</Text>
          ) : (
            <>
              <TouchableOpacity
                style={[s.primary, item.is_full && s.disabled]}
                disabled={busy || item.is_full}
                onPress={() => register.mutate()}
                activeOpacity={0.85}
              >
                {register.isPending
                  ? <ActivityIndicator color={C.navy} />
                  : <Text style={s.primaryTxt}>{item.is_full ? 'اكتملت المقاعد' : 'تسجيل'}</Text>}
              </TouchableOpacity>
              <Text style={s.note}>سيتم خصم حصة واحدة من رصيدك عند التسجيل.</Text>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowValue}>{value}</Text>
      <View style={s.rowLabelWrap}>
        <Text style={s.rowLabel}>{label}</Text>
        <Ionicons name={icon} size={16} color={C.grayMid} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  room: { flex: 1, backgroundColor: '#000' },
  pinChip: { alignSelf: 'center', backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginVertical: 6 },
  pinChipTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  leaveRoom: { backgroundColor: C.error, marginHorizontal: 16, marginTop: 12, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  leaveRoomTxt: { color: C.white, fontSize: 15, fontWeight: '900' },
  header: {
    backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.white },
  empty: { fontSize: 14, color: C.grayMid, fontWeight: '600', textAlign: 'center', padding: 32 },
  body: { padding: 16, gap: 12 },
  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 8, ...shadow.sm },
  lessonNo: { fontSize: 12, fontWeight: '700', color: C.grayMid, textAlign: 'right' },
  lessonTitle: { fontSize: 18, fontWeight: '900', color: C.navy, textAlign: 'right' },
  title: { fontSize: 14, fontWeight: '700', color: C.grayDark, textAlign: 'right' },
  description: { fontSize: 13, color: C.grayMid, textAlign: 'right', lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 3 },
  rowLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 13, color: C.grayMid, fontWeight: '700' },
  rowValue: { flex: 1, fontSize: 13, color: C.navy, fontWeight: '800', textAlign: 'left' },
  primary: { backgroundColor: C.yellow, borderRadius: 16, paddingVertical: 15, alignItems: 'center', ...shadow.amber },
  primaryTxt: { fontSize: 16, fontWeight: '900', color: C.navy },
  disabled: { opacity: 0.45 },
  secondary: { borderWidth: 1.5, borderColor: C.error, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  secondaryTxt: { fontSize: 15, fontWeight: '800', color: C.error },
  registered: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderRadius: 14, padding: 12,
  },
  registeredTxt: { fontSize: 14, fontWeight: '800', color: '#15803D' },
  activityBtn: {
    backgroundColor: '#22C55E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 14,
  },
  activityTxt: { color: C.white, fontSize: 15, fontWeight: '900' },
  pdfBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, alignSelf: 'flex-end',
    backgroundColor: '#F5F3FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4,
  },
  pdfTxt: { fontSize: 13, fontWeight: '700', color: PURPLE },
  note: { fontSize: 12, color: C.grayMid, fontWeight: '600', textAlign: 'center' },
});

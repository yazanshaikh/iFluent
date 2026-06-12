/**
 * Popup showing a teacher's weekly availability, fetched by teacher code.
 * Used from the session-profile teacher card.
 */
import {
  Modal, View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { teachersApi } from '@/api/teachers';
import { AvailabilityList } from './AvailabilityList';
import { C, shadow } from '@/theme';

interface Props {
  visible:     boolean;
  teacherCode: string | null;
  teacherName?: string | null;
  onClose:     () => void;
}

export function TeacherAvailabilityModal({ visible, teacherCode, teacherName, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-availability', teacherCode],
    queryFn:  () => teachersApi.getProfile(teacherCode!),
    enabled:  visible && !!teacherCode,
    staleTime: 60_000,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={C.navy} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={s.title}>المواعيد المتاحة</Text>
            {teacherName ? <Text style={s.sub}>{teacherName}</Text> : null}
          </View>
          <Ionicons name="calendar" size={22} color={C.amber} />
        </View>

        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
          {isLoading ? (
            <View style={s.center}><ActivityIndicator size="large" color={C.amber} /></View>
          ) : isError ? (
            <Text style={s.errTxt}>تعذّر جلب مواعيد المعلم.</Text>
          ) : (
            <AvailabilityList slots={data?.availability ?? []} />
          )}
        </ScrollView>

        <Text style={s.note}>هذه المواعيد للمعلومة فقط — يمكنك الحجز في أي وقت متاح.</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10, ...shadow.navy,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '900', color: C.navy },
  sub:   { fontSize: 13, fontWeight: '700', color: C.grayMid, marginTop: 2 },
  center: { paddingVertical: 30, alignItems: 'center' },
  errTxt: { fontSize: 14, color: C.error, textAlign: 'center', paddingVertical: 20, fontWeight: '600' },
  note: { fontSize: 11, color: C.gray, textAlign: 'center', marginTop: 14, lineHeight: 16 },
});

/**
 * Group classes on the student's plan, in lesson order.
 * The next lesson to book is shown above the list (guidance only: any class
 * on the plan can be booked). The list can be filtered by teacher code and by a
 * date range within the next two months.
 */
import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupClassesApi, type GroupClassItem } from '@/api/groupClasses';
import { formatJordanDateTime, jordanDayKey } from '@/lib/bookingSlots';
import { DateRangeField } from '@/components/DateRangeField';

/** Today and the last day of the two-month filter window, Jordan dates. */
function filterWindow(): { min: string; max: string } {
  const min = jordanDayKey(new Date().toISOString());
  const [y, m, d] = min.split('-').map(Number);
  return { min, max: new Date(Date.UTC(y, m - 1 + 2, d)).toISOString().slice(0, 10) };
}
import { C, shadow } from '@/theme';

function ClassCard({ item, onPress }: { item: GroupClassItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.card, item.is_registered && s.cardRegistered]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.badges}>
        {item.is_registered && <Text style={[s.badge, s.badgeDone]}>✓ مسجل</Text>}
        {item.status === 'active' && <Text style={[s.badge, s.badgeLive]}>جارية الآن</Text>}
        {item.is_full && !item.is_registered && <Text style={[s.badge, s.badgeFull]}>مكتملة</Text>}
      </View>
      {item.lesson_number !== null && <Text style={s.lessonNo}>الدرس {item.lesson_number}</Text>}
      <Text style={s.lessonTitle}>{item.lesson?.title ?? item.title}</Text>
      <View style={s.row}>
        <Text style={s.meta}>{formatJordanDateTime(item.scheduled_at)}</Text>
        <Ionicons name="time-outline" size={15} color={C.grayMid} />
      </View>
      <View style={s.row}>
        <Text style={s.meta}>{item.teacher.name ?? '—'}</Text>
        <Ionicons name="person-outline" size={15} color={C.grayMid} />
      </View>
      <View style={s.row}>
        <Text style={s.meta}>{item.registered_count} من {item.max_seats} طالب مسجل</Text>
        <Ionicons name="people-outline" size={15} color={C.grayMid} />
      </View>
    </TouchableOpacity>
  );
}

export default function GroupClassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['group-classes'],
    queryFn:  groupClassesApi.list,
  });

  const [code, setCode]   = useState('');
  const [range, setRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const limits = useMemo(filterWindow, []);

  const classes = data?.data ?? [];
  const next    = data?.next_lesson ?? null;
  const nextHasClass = !!next && classes.some((c) => c.lesson?.id === next.id && !c.is_registered);

  const term  = code.trim().toUpperCase();
  const shown = classes.filter((c) => {
    const day = jordanDayKey(c.scheduled_at);
    return (!term || (c.teacher.code ?? '').toUpperCase().includes(term))
      && (!range.from || day >= range.from)
      && (!range.to || day <= range.to);
  });

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/levels'))}
          hitSlop={12}
        >
          <Ionicons name="chevron-forward" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>الحصص الجماعية</Text>
        <View style={s.credits}>
          <Ionicons name="bookmark" size={12} color={C.navy} />
          <Text style={s.creditsTxt}>{data?.credits ?? 0}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={C.navy} />
      ) : isError ? (
        <Text style={s.empty}>
          {(error as any)?.response?.data?.message ?? 'تعذر تحميل الحصص. يرجى المحاولة مرة أخرى.'}
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.navy} />}
        >
          {next && (
            <View style={s.next}>
              <Text style={s.nextLabel}>درسك القادم</Text>
              <Text style={s.nextTitle}>{next.title}</Text>
              {!nextHasClass && <Text style={s.nextNote}>لم تُجدول له حصة متاحة بعد.</Text>}
            </View>
          )}

          {classes.length > 0 && (
            <View style={s.filters}>
              <View style={s.codeBox}>
                <Ionicons name="search" size={16} color={C.gray} />
                <TextInput
                  style={s.codeInput}
                  value={code}
                  onChangeText={setCode}
                  placeholder="ابحث برقم تعريف المعلم"
                  placeholderTextColor={C.gray}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  textAlign="right"
                />
                {!!code && (
                  <TouchableOpacity onPress={() => setCode('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={C.gray} />
                  </TouchableOpacity>
                )}
              </View>
              <DateRangeField
                from={range.from}
                to={range.to}
                minDay={limits.min}
                maxDay={limits.max}
                onChange={setRange}
              />
            </View>
          )}

          {classes.length === 0 ? (
            <Text style={s.empty}>لا توجد حصص جماعية مجدولة حالياً ضمن خطتك الدراسية.</Text>
          ) : shown.length === 0 ? (
            <Text style={s.empty}>لا توجد حصص مطابقة لهذا الفلتر.</Text>
          ) : shown.map((item) => (
            <ClassCard
              key={item.id}
              item={item}
              onPress={() => router.push({ pathname: '/group-classes/[id]', params: { id: String(item.id) } })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.white },
  credits: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.yellow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  creditsTxt: { fontSize: 13, fontWeight: '900', color: C.navy },
  list: { padding: 16, gap: 12 },
  next: { backgroundColor: C.navy, borderRadius: 16, padding: 14, gap: 4 },
  nextLabel: { fontSize: 12, fontWeight: '700', color: C.yellow, textAlign: 'right' },
  nextTitle: { fontSize: 17, fontWeight: '900', color: C.white, textAlign: 'right' },
  nextNote: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  filters: { gap: 8 },
  codeBox: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: C.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12, height: 46,
  },
  codeInput: { flex: 1, fontSize: 14, fontWeight: '700', color: C.navy },
  empty: { fontSize: 14, color: C.grayMid, fontWeight: '600', textAlign: 'center', padding: 32, lineHeight: 22 },
  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 14, gap: 6,
    borderWidth: 1.5, borderColor: 'transparent', ...shadow.sm,
  },
  cardRegistered: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  badges: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  badge: {
    fontSize: 11, fontWeight: '800', borderRadius: 8, overflow: 'hidden',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeDone: { backgroundColor: '#DCFCE7', color: '#15803D' },
  badgeLive: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  badgeFull: { backgroundColor: C.grayLight, color: C.grayMid },
  lessonNo: { fontSize: 12, fontWeight: '700', color: C.grayMid, textAlign: 'right' },
  lessonTitle: { fontSize: 16, fontWeight: '900', color: C.navy, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, color: C.grayDark, fontWeight: '600' },
});

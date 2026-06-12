/**
 * Presentational list of a teacher's weekly availability, grouped by day.
 * Used in the session-profile popup and inside the booking modal.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/theme';
import type { TeacherAvailabilitySlot } from '@/api/teachers';

const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Backend stores time as "HH:MM:SS" — show only "HH:MM"
const hm = (t: string) => (t || '').slice(0, 5);

export function AvailabilityList({ slots }: { slots: TeacherAvailabilitySlot[] }) {
  if (!slots || slots.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="calendar-outline" size={34} color={C.gray} />
        <Text style={s.emptyTxt}>لا يوجد موعد متاح لهذا المعلم.</Text>
      </View>
    );
  }

  // group by day_of_week (keep order Sun→Sat)
  const byDay = new Map<number, TeacherAvailabilitySlot[]>();
  slots.forEach((slot) => {
    const arr = byDay.get(slot.day_of_week) ?? [];
    arr.push(slot);
    byDay.set(slot.day_of_week, arr);
  });
  const days = [...byDay.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <View style={{ gap: 10 }}>
      {days.map(([day, ranges]) => (
        <View key={day} style={s.dayRow}>
          <View style={s.rangesWrap}>
            {ranges
              .slice()
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((r, i) => (
                <View key={i} style={s.rangeChip}>
                  <Text style={s.rangeTxt}>{hm(r.start_time)} — {hm(r.end_time)}</Text>
                </View>
              ))}
          </View>
          <View style={s.dayBadge}>
            <Text style={s.dayTxt}>{AR_DAYS[day]}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  emptyTxt: { fontSize: 13, color: C.grayMid, fontWeight: '600', textAlign: 'center' },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    justifyContent: 'space-between',
  },
  dayBadge: {
    backgroundColor: '#EDE9FE', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, minWidth: 64, alignItems: 'center',
  },
  dayTxt: { fontSize: 13, fontWeight: '900', color: '#6D28D9' },

  rangesWrap: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' },
  rangeChip: {
    backgroundColor: '#F5F3FF', borderRadius: 9,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  rangeTxt: { fontSize: 12.5, fontWeight: '800', color: '#5B21B6' },
});

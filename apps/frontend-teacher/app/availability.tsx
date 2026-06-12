/**
 * Teacher Availability — Availability
 * Teacher publishes a recurring WEEKLY schedule (day + from→to).
 * Display-only for students (does not restrict booking).
 * Edit freely, then press Save to persist (replaces the whole schedule).
 */
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { availabilityApi, type NewSlot } from '@/api/availability';
import { C, shadow } from '@/theme';

const AR_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time options 06:00 … 23:30 (30-min steps)
const TIMES = (() => {
  const out: string[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let h = 6; h <= 23; h++) { out.push(`${pad(h)}:00`); out.push(`${pad(h)}:30`); }
  return out;
})();

function TimeRow({ label, value, onPick }: {
  label: string; value: string | null; onPick: (t: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.smallLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>
        {TIMES.map((t) => {
          const active = value === t;
          return (
            <Pressable key={t} onPress={() => onPick(t)} style={[styles.timeChip, active && styles.timeChipOn]}>
              <Text style={[styles.timeChipTxt, active && styles.timeChipTxtOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function AvailabilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const [slots, setSlots] = useState<NewSlot[]>([]);
  const [day,   setDay]   = useState<number | null>(null);
  const [from,  setFrom]  = useState<string | null>(null);
  const [to,    setTo]    = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-availability'],
    queryFn:  availabilityApi.list,
    staleTime: 30_000,
  });

  // Seed local editing state once data arrives.
  // Backend returns times as "HH:MM:SS"; normalise to "HH:MM" so they match the
  // pickers and pass the H:i validation when saved again.
  useEffect(() => {
    if (data) {
      setSlots(data.map((s) => ({
        day_of_week: s.day_of_week,
        start_time:  s.start_time.slice(0, 5),
        end_time:    s.end_time.slice(0, 5),
      })));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => availabilityApi.save(slots),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-availability'] });
      const msg = 'Availability saved successfully.';
      if (Platform.OS === 'web') (window as any).alert(msg);
      else Alert.alert('Saved', msg);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? 'Could not save availability.';
      if (Platform.OS === 'web') (window as any).alert(msg);
      else Alert.alert('Error', msg);
    },
  });

  const canAdd = day !== null && from !== null && to !== null && from < to;

  const addSlot = () => {
    if (!canAdd) return;
    setSlots((prev) => [...prev, { day_of_week: day!, start_time: from!, end_time: to! }]
      .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
    setFrom(null); setTo(null);
  };

  const removeSlot = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={[C.sky, C.skyDark]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>Availability</Text>
          <Text style={styles.headerSub}>Shown to students as info about your available times</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={C.sky} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>

          {/* Add slot */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Slot</Text>

            <Text style={styles.smallLabel}>Day</Text>
            <View style={styles.daysWrap}>
              {AR_DAYS.map((d, i) => {
                const active = day === i;
                return (
                  <Pressable key={i} onPress={() => setDay(i)} style={[styles.dayChip, active && styles.dayChipOn]}>
                    <Text style={[styles.dayChipTxt, active && styles.dayChipTxtOn]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 12 }} />
            <TimeRow label="From" value={from} onPick={setFrom} />
            <View style={{ height: 10 }} />
            <TimeRow label="To" value={to} onPick={setTo} />

            {from && to && from >= to && (
              <Text style={styles.warn}>End time must be after start time.</Text>
            )}

            <Pressable
              style={[styles.addBtn, !canAdd && { opacity: 0.45 }]}
              onPress={addSlot}
              disabled={!canAdd}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.addBtnTxt}>Add Slot</Text>
            </Pressable>
          </View>

          {/* Current slots */}
          <Text style={styles.sectionTitle}>Current Slots</Text>
          {slots.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={C.gray} />
              <Text style={styles.emptyTxt}>No slots added yet.</Text>
            </View>
          ) : (
            slots.map((s, i) => (
              <View key={`${s.day_of_week}-${s.start_time}-${i}`} style={styles.slotRow}>
                <Pressable onPress={() => removeSlot(i)} style={styles.delBtn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={C.error} />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.slotDay}>{AR_DAYS[s.day_of_week]}</Text>
                  <Text style={styles.slotTime}>{s.start_time} — {s.end_time}</Text>
                </View>
                <Ionicons name="time-outline" size={18} color={C.sky} />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Save */}
      {!isLoading && (
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saveMutation.isPending && { opacity: 0.6 }]}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveTxt}>Save Schedule</Text>
                </>
            }
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 18, paddingBottom: 20, gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 },

  scroll: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, ...shadow.sm, marginBottom: 18 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: C.skyDark, textAlign: 'right', marginBottom: 12 },
  smallLabel: { fontSize: 12, fontWeight: '800', color: C.grayMid, textAlign: 'right', marginBottom: 8 },

  daysWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#F0F9FF', borderWidth: 1.5, borderColor: C.skyLight,
  },
  dayChipOn: { backgroundColor: C.sky, borderColor: C.sky },
  dayChipTxt: { fontSize: 13, fontWeight: '700', color: C.skyDark },
  dayChipTxtOn: { color: '#fff' },

  timeChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F0F9FF', borderWidth: 1.5, borderColor: C.skyLight,
  },
  timeChipOn: { backgroundColor: C.skyDark, borderColor: C.skyDark },
  timeChipTxt: { fontSize: 13, fontWeight: '800', color: C.skyDark },
  timeChipTxtOn: { color: '#fff' },

  warn: { fontSize: 12, color: C.error, textAlign: 'right', marginTop: 10, fontWeight: '600' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.sky, borderRadius: 14, paddingVertical: 13, marginTop: 16,
  },
  addBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.grayMid, textAlign: 'right', marginBottom: 10, marginRight: 4 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: C.grayMid },

  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, ...shadow.sm,
  },
  delBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center',
  },
  slotDay:  { fontSize: 15, fontWeight: '900', color: C.skyDark },
  slotTime: { fontSize: 13, fontWeight: '700', color: C.grayMid, marginTop: 2 },

  saveBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.sky, borderRadius: 16, paddingVertical: 16,
  },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});

/**
 * «من» / «إلى» date fields that open a small month calendar in a centred pop-up.
 * Days outside [minDay, maxDay] are disabled, and «إلى» can't be before «من».
 * Values are Jordan calendar dates, "YYYY-MM-DD".
 */
import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDayKey } from '@/lib/bookingSlots';
import { C, shadow } from '@/theme';

const WEEK = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const pad = (n: number) => String(n).padStart(2, '0');
const DISABLED = '#D1D5DB';
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

interface Props {
  from:     string | null;
  to:       string | null;
  minDay:   string;
  maxDay:   string;
  onChange: (range: { from: string | null; to: string | null }) => void;
}

export function DateRangeField({ from, to, minDay, maxDay, onChange }: Props) {
  const [editing, setEditing] = useState<'from' | 'to' | null>(null);
  const [month, setMonth]     = useState(minDay.slice(0, 7));

  const open = (field: 'from' | 'to') => {
    setMonth(((field === 'from' ? from : to) ?? from ?? minDay).slice(0, 7));
    setEditing(field);
  };

  const pick = (day: string) => {
    if (editing === 'from') onChange({ from: day, to: to && to < day ? null : to });
    else onChange({ from, to: day });
    setEditing(null);
  };

  const [y, m] = month.split('-').map(Number);
  const lead   = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells  = [...Array(lead).fill(null), ...Array.from({ length }, (_, i) => keyOf(y, m, i + 1))];
  const lower  = editing === 'to' && from ? from : minDay;
  const nextMonthStart = (() => {
    const d = new Date(Date.UTC(y, m, 1));
    return keyOf(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  })();
  const canNext = nextMonthStart <= maxDay;
  const canPrev = month > minDay.slice(0, 7);

  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };

  const Field = ({ field, label, value }: { field: 'from' | 'to'; label: string; value: string | null }) => (
    <TouchableOpacity style={[s.field, value && s.fieldSet]} onPress={() => open(field)} activeOpacity={0.8}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <Text style={[s.fieldValue, !value && s.placeholder]} numberOfLines={1}>
          {value ? formatDayKey(value) : 'اختر التاريخ'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={value ? C.navy : C.gray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={s.row}>
        <Field field="from" label="من" value={from} />
        <Field field="to" label="إلى" value={to} />
        {(from || to) && (
          <TouchableOpacity style={s.clear} onPress={() => onChange({ from: null, to: null })} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={C.gray} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={s.center}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setEditing(null)} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>{editing === 'from' ? 'من تاريخ' : 'إلى تاريخ'}</Text>

          <View style={s.monthRow}>
            <TouchableOpacity onPress={() => shift(1)} disabled={!canNext} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={canNext ? C.navy : DISABLED} />
            </TouchableOpacity>
            <Text style={s.monthTxt}>{MONTHS[m - 1]} {y}</Text>
            <TouchableOpacity onPress={() => shift(-1)} disabled={!canPrev} hitSlop={10}>
              <Ionicons name="chevron-forward" size={22} color={canPrev ? C.navy : DISABLED} />
            </TouchableOpacity>
          </View>

          <View style={s.grid}>
            {WEEK.map((w) => <Text key={w} style={s.weekday}>{w}</Text>)}
            {cells.map((cell, i) => {
              if (!cell) return <View key={`blank-${i}`} style={s.cell} />;
              const disabled = cell < lower || cell > maxDay;
              const chosen   = cell === from || cell === to;
              const inside   = !!from && !!to && cell > from && cell < to;
              return (
                <TouchableOpacity
                  key={cell}
                  style={[s.cell, inside && s.cellInside, chosen && s.cellChosen]}
                  disabled={disabled}
                  onPress={() => pick(cell)}
                >
                  <Text style={[s.dayTxt, disabled && s.dayOff, chosen && s.dayChosen]}>{Number(cell.slice(8))}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  field: {
    flex: 1, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 8, gap: 2,
  },
  fieldSet: { borderColor: C.navy },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.grayMid, textAlign: 'right' },
  fieldRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  fieldValue: { flex: 1, fontSize: 13, fontWeight: '800', color: C.navy, textAlign: 'right' },
  placeholder: { color: C.gray, fontWeight: '600' },
  clear: { paddingHorizontal: 2 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    width: '100%', maxWidth: 300, backgroundColor: C.white,
    borderRadius: 20, padding: 14, gap: 8, ...shadow.md,
  },
  sheetTitle: { fontSize: 14, fontWeight: '900', color: C.navy, textAlign: 'center' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 },
  monthTxt: { fontSize: 13, fontWeight: '800', color: C.navy },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 9, fontWeight: '700', color: C.grayMid, paddingBottom: 4 },
  cell: { width: `${100 / 7}%`, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  cellInside: { backgroundColor: C.cream },
  cellChosen: { backgroundColor: C.navy },
  dayTxt: { fontSize: 13, fontWeight: '700', color: C.navy },
  dayOff: { color: DISABLED },
  dayChosen: { color: C.white },
});

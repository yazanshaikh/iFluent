/**
 * Bottom-sheet modal for booking a teaching session.
 * Student picks a day + time slot → request goes to the teacher pool.
 *
 * Differences from EvalBookingModal:
 *  - Uses authenticated student endpoint (POST /student/bookings)
 *  - No name field (student already registered)
 *  - Deduplication handled by backend (no SecureStore cache needed)
 */
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons }          from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sessionsApi }       from '@/api/sessions';
import { C, shadow }         from '@/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const AR_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const AR_MONTHS = [
  'يناير','فبراير','مارس','إبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

// 09:00 → 23:30 every 30 min + 00:00 midnight
const ALL_SLOTS = (() => {
  const slots: string[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let h = 9; h <= 23; h++) {
    slots.push(`${pad(h)}:00`);
    slots.push(`${pad(h)}:30`);
  }
  slots.push('00:00');
  return slots;
})();

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible:  boolean;
  credits:  number;   // remaining lesson credits — shown as reminder
  onClose:  () => void;
  onBooked: () => void; // called after successful booking so parent can refresh
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionBookingModal({ visible, credits, onClose, onBooked }: Props) {
  const insets = useSafeAreaInsets();

  const [dayIdx,       setDayIdx]       = useState(0);
  const [slot,         setSlot]         = useState<string | null>(null);
  const [teacherCode,  setTeacherCode]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    }), [],
  );

  // Filter past slots when today is selected
  const availableSlots = useMemo(() => {
    if (dayIdx !== 0) return ALL_SLOTS;
    const now    = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    return ALL_SLOTS.filter((s) => {
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m > curMin;
    });
  }, [dayIdx]);

  const effectiveSlot = slot && availableSlots.includes(slot) ? slot : null;

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleSubmit = async () => {
    if (!effectiveSlot) return;

    const d            = days[dayIdx];
    const scheduled_at = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${effectiveSlot}:00`;

    setLoading(true);
    try {
      const trimCode = teacherCode.trim();
      await sessionsApi.book({
        scheduled_at,
        ...(trimCode ? { teacher_code: trimCode } : {}),
      });
      setDone(true);
      onBooked();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDayIdx(0);
    setSlot(null);
    setTeacherCode('');
    setDone(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.kav}
      >
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={C.navy} />
            </TouchableOpacity>
            <Text style={s.sheetTitle}>احجز حصة تعليمية</Text>
            {/* Credit badge */}
            <View style={s.creditBadge}>
              <Ionicons name="bookmark" size={12} color={C.navy} />
              <Text style={s.creditBadgeTxt}>{credits}</Text>
            </View>
          </View>

          {done ? (
            /* ── Success ────────────────────────────────────────────────────── */
            <View style={s.centeredWrap}>
              <View style={[s.iconCircle, { backgroundColor: C.success }]}>
                <Ionicons name="checkmark" size={42} color={C.white} />
              </View>
              <Text style={s.successTitle}>تم إرسال طلب الحجز!</Text>
              <Text style={s.successSub}>
                سيصلك تأكيد من المعلم قريباً. ستجد الحصة في تبويب حصصي.
              </Text>
              <TouchableOpacity style={s.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={s.doneBtnTxt}>حسناً</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Booking form ────────────────────────────────────────────────── */
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Info note */}
              <View style={s.infoBox}>
                <Ionicons name="information-circle" size={16} color={C.navyLight} />
                <Text style={s.infoTxt}>
                  سيُرسَل طلبك لأول معلم متاح. يمكنك تتبع حالة الحصة من تبويب حصصي.
                </Text>
              </View>

              {/* Day picker */}
              <Text style={s.label}>اختر اليوم</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.daysRow}
              >
                {days.map((d, i) => {
                  const active = dayIdx === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.dayPill, active && s.dayPillActive]}
                      onPress={() => { setDayIdx(i); setSlot(null); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.dayPillName, active && s.dayPillTxtActive]}>
                        {i === 0 ? 'اليوم' : AR_DAYS[d.getDay()]}
                      </Text>
                      <Text style={[s.dayPillNum, active && s.dayPillTxtActive]}>
                        {d.getDate()}
                      </Text>
                      <Text style={[s.dayPillMonth, active && s.dayPillMonthActive]}>
                        {AR_MONTHS[d.getMonth()]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time picker */}
              <Text style={[s.label, { marginTop: 20 }]}>اختر الوقت</Text>
              {availableSlots.length === 0 ? (
                <View style={s.noSlotsBox}>
                  <Ionicons name="time-outline" size={22} color={C.gray} />
                  <Text style={s.noSlotsTxt}>لا توجد أوقات متاحة اليوم — اختر يوماً آخر</Text>
                </View>
              ) : (
                <View style={s.slotsGrid}>
                  {availableSlots.map((sl) => {
                    const active = effectiveSlot === sl;
                    return (
                      <TouchableOpacity
                        key={sl}
                        style={[s.slotPill, active && s.slotPillActive]}
                        onPress={() => setSlot(sl)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.slotTxt, active && s.slotTxtActive]}>{sl}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Optional: specific teacher code */}
              <Text style={[s.label, { marginTop: 20 }]}>
                رقم تعريف المعلم
                <Text style={s.optionalTag}> (اختياري)</Text>
              </Text>
              <TextInput
                style={s.teacherInput}
                value={teacherCode}
                onChangeText={setTeacherCode}
                placeholder="اتركه فارغاً لأي معلم متاح"
                placeholderTextColor={s.teacherInput.color as string}
                textAlign="right"
                autoCapitalize="none"
                returnKeyType="done"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, !effectiveSlot && s.submitBtnOff]}
                onPress={handleSubmit}
                disabled={loading || !effectiveSlot}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={C.navy} />
                ) : (
                  <>
                    <Ionicons name="school-outline" size={19} color={C.navy} />
                    <Text style={s.submitTxt}>تأكيد الحجز</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  kav:   { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10,
    maxHeight: '90%',
    ...shadow.navy,
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, marginBottom: 14,
  },

  // Header
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: C.navy },
  creditBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.yellow, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  creditBadgeTxt: { fontSize: 13, fontWeight: '900', color: C.navy },

  // Info note
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 20,
  },
  infoTxt: { flex: 1, fontSize: 12, color: C.navyLight, fontWeight: '600', lineHeight: 18, textAlign: 'right' },

  // Section label
  label: { fontSize: 13, fontWeight: '800', color: C.navy, textAlign: 'right', marginBottom: 12 },

  // Days
  daysRow: { gap: 8, paddingHorizontal: 2, flexDirection: 'row' },
  dayPill: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.cream, minWidth: 62,
  },
  dayPillActive:      { backgroundColor: C.navy, borderColor: C.navy },
  dayPillName:        { fontSize: 10, fontWeight: '700', color: C.grayMid, marginBottom: 2 },
  dayPillNum:         { fontSize: 20, fontWeight: '900', color: C.navy, lineHeight: 24 },
  dayPillMonth:       { fontSize: 9, fontWeight: '600', color: C.gray, marginTop: 2 },
  dayPillTxtActive:   { color: C.white },
  dayPillMonthActive: { color: 'rgba(255,255,255,0.65)' },

  // Slots
  noSlotsBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.grayLight, borderRadius: 14, padding: 14, justifyContent: 'center',
  },
  noSlotsTxt:     { fontSize: 13, color: C.gray, fontWeight: '600' },
  slotsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: {
    width: '22.5%', alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cream,
  },
  slotPillActive: { backgroundColor: C.navy, borderColor: C.navy },
  slotTxt:        { fontSize: 13, fontWeight: '800', color: C.navy, letterSpacing: 0.3 },
  slotTxtActive:  { color: C.white },

  // Optional tag
  optionalTag: { fontSize: 11, fontWeight: '500', color: C.gray },

  // Teacher code input
  teacherInput: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 13,
    fontSize: 14,
    fontWeight: '600',
    color: C.navy,
    marginBottom: 4,
  },

  // Submit
  submitBtn: {
    backgroundColor: C.yellow, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, marginTop: 20, marginBottom: 8, ...shadow.amber,
  },
  submitBtnOff: { opacity: 0.45 },
  submitTxt: { fontSize: 16, fontWeight: '900', color: C.navy },

  // Success
  centeredWrap: { alignItems: 'center', paddingVertical: 32 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, ...shadow.md,
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: C.navy, marginBottom: 10 },
  successSub: {
    fontSize: 14, color: C.grayMid, textAlign: 'center',
    lineHeight: 22, marginBottom: 28, paddingHorizontal: 10,
  },
  doneBtn: { backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16 },
  doneBtnTxt: { fontSize: 15, fontWeight: '900', color: C.white },
});

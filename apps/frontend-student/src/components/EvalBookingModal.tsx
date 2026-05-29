/**
 * Bottom-sheet modal for booking a free evaluation session.
 *
 * States:
 *  - Form      : pick day + time slot + name → submit
 *  - AlreadyBooked : student has an active booking (stored in SecureStore)
 *                    → blocked until scheduled_at passes
 *  - Success   : shown immediately after a new booking is submitted
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import { Ionicons }              from '@expo/vector-icons';
import { useSafeAreaInsets }     from 'react-native-safe-area-context';
import { useAuthStore }          from '@/stores/authStore';
import { leadsApi }              from '@/api/leads';
import { C, shadow }             from '@/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_KEY = 'eval_booking_at';   // "YYYY-MM-DD HH:MM:00"

const AR_DAYS = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت',
];
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// 09:00 → 23:30 every 30 min, then 00:00 (midnight)
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseStoredDate(val: string): Date {
  // "2026-06-01 14:00:00"
  const [datePart, timePart] = val.split(' ');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, m]     = timePart.split(':').map(Number);
  return new Date(y, mo - 1, d, h, m);
}

function formatBookingLabel(val: string): string {
  const date = parseStoredDate(val);
  const pad  = (n: number) => String(n).padStart(2, '0');
  return (
    `${AR_DAYS[date.getDay()]} ${date.getDate()} ${AR_MONTHS[date.getMonth()]}` +
    ` — الساعة ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvalBookingModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);

  // Form state
  const [dayIdx,  setDayIdx]  = useState(0);
  const [slot,    setSlot]    = useState<string | null>(null);
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  // Existing booking (from SecureStore) — non-null while session hasn't happened yet
  const [existingBooking, setExistingBooking] = useState<string | null>(null);

  // On modal open: check backend for active booking (source of truth).
  // SecureStore is only a fast local cache — CRM cancellations won't update it,
  // so we always verify with the server and sync the cache accordingly.
  useEffect(() => {
    if (!visible || !user?.phone) return;

    leadsApi.checkBookingStatus(user.phone)
      .then(({ has_active_booking, scheduled_at }) => {
        if (has_active_booking && scheduled_at) {
          // Backend confirms active booking — normalise to "YYYY-MM-DD HH:MM:00"
          const iso = scheduled_at.replace('T', ' ').replace(/\+.*$/, '').slice(0, 19);
          SecureStore.setItemAsync(STORE_KEY, iso);
          setExistingBooking(iso);
        } else {
          // No active booking on server (new / cancelled) — clear local cache
          SecureStore.deleteItemAsync(STORE_KEY);
          setExistingBooking(null);
        }
      })
      .catch(() => {
        // Network error — fall back to SecureStore cache
        SecureStore.getItemAsync(STORE_KEY).then((val) => {
          if (val && parseStoredDate(val) > new Date()) {
            setExistingBooking(val);
          } else {
            SecureStore.deleteItemAsync(STORE_KEY);
            setExistingBooking(null);
          }
        });
      });
  }, [visible]);

  // 7 calendar days starting from today
  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    }), [],
  );

  // For "today", filter out slots whose time has already passed.
  // Midnight '00:00' (totalMin = 0) is always < current time so it's
  // automatically excluded for today — available for future days only.
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

  const handleDaySelect = useCallback((idx: number) => setDayIdx(idx), []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleSubmit = async () => {
    if (!effectiveSlot) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('', 'الرجاء إدخال اسمك الكامل');
      return;
    }

    const d            = days[dayIdx];
    const scheduled_at = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${effectiveSlot}:00`;

    setLoading(true);
    try {
      await leadsApi.bookEval({ name: trimmedName, phone: user?.phone ?? '', scheduled_at });
      await SecureStore.setItemAsync(STORE_KEY, scheduled_at);
      setDone(true);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDayIdx(0);
    setSlot(null);
    setName('');
    setDone(false);
    onClose();
  };

  const canSubmit = !!effectiveSlot && name.trim().length > 0;

  // ── Which screen to render ─────────────────────────────────────────────────
  const screen: 'booked' | 'success' | 'form' =
    existingBooking ? 'booked' :
    done            ? 'success' :
                      'form';

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
            <Text style={s.sheetTitle}>احجز حصتك التقييمية</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* ── Already-booked state ─────────────────────────────────────────── */}
          {screen === 'booked' && (
            <View style={s.centeredWrap}>
              <View style={[s.iconCircle, { backgroundColor: C.amber + '18' }]}>
                <Ionicons name="calendar" size={40} color={C.amber} />
              </View>
              <Text style={s.bookedTitle}>لديك حجز مجدول بالفعل</Text>
              <View style={s.bookedDateBox}>
                <Text style={s.bookedDateTxt}>
                  {formatBookingLabel(existingBooking!)}
                </Text>
              </View>
              <Text style={s.bookedSub}>
                يمكنك الحجز من جديد بعد انتهاء حصتك التقييمية
              </Text>
              <TouchableOpacity style={s.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={s.doneBtnTxt}>حسناً</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Success state ────────────────────────────────────────────────── */}
          {screen === 'success' && (
            <View style={s.centeredWrap}>
              <View style={[s.iconCircle, { backgroundColor: C.success }]}>
                <Ionicons name="checkmark" size={42} color={C.white} />
              </View>
              <Text style={s.successTitle}>تم إرسال طلبك!</Text>
              <Text style={s.successSub}>
                سيتواصل معك فريقنا لتأكيد موعد حصتك التقييمية
              </Text>
              <TouchableOpacity style={s.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={s.doneBtnTxt}>حسناً، شكراً</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Booking form ─────────────────────────────────────────────────── */}
          {screen === 'form' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                      onPress={() => handleDaySelect(i)}
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

              {/* Name input */}
              <Text style={[s.label, { marginTop: 20 }]}>اسمك الكامل</Text>
              <TextInput
                style={s.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor={C.gray}
                textAlign="right"
                returnKeyType="done"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, !canSubmit && s.submitBtnOff]}
                onPress={handleSubmit}
                disabled={loading || !canSubmit}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={C.navy} />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={19} color={C.navy} />
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10,
    maxHeight: '88%',
    ...shadow.navy,
  },
  handle: {
    alignSelf: 'center',
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 22,
  },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: C.navy, textAlign: 'center' },

  // Shared centered layout (booked + success)
  centeredWrap: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, ...shadow.md,
  },

  // Already-booked state
  bookedTitle: { fontSize: 18, fontWeight: '900', color: C.navy, marginBottom: 14 },
  bookedDateBox: {
    backgroundColor: C.cream, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 20, paddingVertical: 12,
    marginBottom: 14,
  },
  bookedDateTxt: { fontSize: 15, fontWeight: '800', color: C.amber, textAlign: 'center' },
  bookedSub: {
    fontSize: 13, color: C.grayMid, textAlign: 'center',
    lineHeight: 20, marginBottom: 28,
  },

  // Success state
  successTitle: { fontSize: 22, fontWeight: '900', color: C.navy, marginBottom: 10 },
  successSub: {
    fontSize: 14, color: C.grayMid, textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },

  // Shared close/done button
  doneBtn: {
    backgroundColor: C.navy, paddingHorizontal: 36,
    paddingVertical: 14, borderRadius: 16,
  },
  doneBtnTxt: { fontSize: 15, fontWeight: '900', color: C.white },

  // Section label
  label: { fontSize: 13, fontWeight: '800', color: C.navy, textAlign: 'right', marginBottom: 12 },

  // Day pills
  daysRow: { gap: 8, paddingHorizontal: 2, flexDirection: 'row' },
  dayPill: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.cream, minWidth: 62,
  },
  dayPillActive:    { backgroundColor: C.navy, borderColor: C.navy },
  dayPillName:      { fontSize: 10, fontWeight: '700', color: C.grayMid, marginBottom: 2 },
  dayPillNum:       { fontSize: 20, fontWeight: '900', color: C.navy, lineHeight: 24 },
  dayPillMonth:     { fontSize: 9, fontWeight: '600', color: C.gray, marginTop: 2 },
  dayPillTxtActive: { color: C.white },
  dayPillMonthActive: { color: 'rgba(255,255,255,0.65)' },

  // Time slots grid (4 columns)
  noSlotsBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.grayLight, borderRadius: 14, padding: 14, justifyContent: 'center',
  },
  noSlotsTxt: { fontSize: 13, color: C.gray, fontWeight: '600', textAlign: 'center' },
  slotsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: {
    width: '22.5%', alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cream,
  },
  slotPillActive: { backgroundColor: C.yellow, borderColor: C.yellow },
  slotTxt:        { fontSize: 13, fontWeight: '800', color: C.navy, letterSpacing: 0.3 },
  slotTxtActive:  { color: C.navy },

  // Name input
  nameInput: {
    backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    padding: 14, fontSize: 15, fontWeight: '600', color: C.navy, marginBottom: 20,
  },

  // Submit button
  submitBtn: {
    backgroundColor: C.yellow, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, marginBottom: 8, ...shadow.amber,
  },
  submitBtnOff: { opacity: 0.45 },
  submitTxt: { fontSize: 16, fontWeight: '900', color: C.navy },
});

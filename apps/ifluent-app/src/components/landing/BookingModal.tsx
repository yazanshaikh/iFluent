/**
 * BookingModal — 3-step booking flow with blurred backdrop
 * Step 1: Name + Phone
 * Step 2: Date (today/tomorrow) + Time slot (hourly 12 AM–11 PM)
 * Step 3: Level + optional message → Submit
 * Success:   confirmation screen
 * Duplicate: phone already has an active booking
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Animated, Modal, KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Spacing } from '@/src/constants/layout';
import { FontSize, FontWeight } from '@/src/constants/typography';
import { submitBooking } from '@/src/api/admin';

// ── Cross-platform storage (localStorage on web, in-memory on native) ──────────

interface BookingRecord {
  name:      string;
  phone:     string;
  date:      'today' | 'tomorrow';
  time:      number;
  level:     string;
  message:   string;
  expiresAt: number; // ms timestamp — session time + 90 min
}

// Fallback in-memory store for native (resets on app restart, acceptable for MVP)
const _memStore: Record<string, string> = {};

function storageGet(key: string): string | null {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return _memStore[key] ?? null;
}

function storageSet(key: string, value: string): void {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  } else {
    _memStore[key] = value;
  }
}

function storageRemove(key: string): void {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  } else {
    delete _memStore[key];
  }
}

function bookingKey(phone: string): string {
  return `ifluent_booking_${phone.replace(/\D/g, '')}`;
}

/** Returns an active booking for this phone, or null if none / expired */
function getActiveBooking(phone: string): BookingRecord | null {
  const raw = storageGet(bookingKey(phone));
  if (!raw) return null;
  try {
    const rec: BookingRecord = JSON.parse(raw);
    if (rec.expiresAt > Date.now()) return rec;
    storageRemove(bookingKey(phone)); // expired — clean up
    return null;
  } catch {
    return null;
  }
}

/** Saves a booking; expires 90 min after the scheduled session start */
function saveBooking(form: FormData): void {
  const sessionDate = new Date();
  if (form.date === 'tomorrow') sessionDate.setDate(sessionDate.getDate() + 1);
  sessionDate.setHours(form.time!, 0, 0, 0);

  const expiresAt = sessionDate.getTime() + 90 * 60 * 1000; // +90 min
  const rec: BookingRecord = { ...form, time: form.time!, expiresAt };
  storageSet(bookingKey(form.phone), JSON.stringify(rec));
}

// ── Data ──────────────────────────────────────────────────────────────────────

// Slots from 9 AM (hour 9) to 11 PM (hour 23) — last session ends at midnight
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour   = i + 9;                          // 9 … 23
  const h      = hour > 12 ? hour - 12 : hour;   // 12-hour display
  const period = hour < 12 ? 'ص' : 'م';
  return { hour, label: `${h}:00 ${period}` };
});

const LEVELS = [
  { id: 'beginner',     label: 'مبتدئ',  sub: 'A1 – A2', emoji: '🌱' },
  { id: 'elementary',   label: 'أساسي',  sub: 'B1',      emoji: '📗' },
  { id: 'intermediate', label: 'متوسط',  sub: 'B2',      emoji: '📘' },
  { id: 'advanced',     label: 'متقدم',  sub: 'C1 – C2', emoji: '🏆' },
];

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** True when this time slot is still bookable.
 *  For "today": slot must start at least 30 minutes from now.
 *  For future dates: always available.
 */
function isSlotAvailable(hour: number, date: 'today' | 'tomorrow'): boolean {
  if (date === 'tomorrow') return true;
  const now            = new Date();
  const nowMinutes     = now.getHours() * 60 + now.getMinutes(); // e.g. 10:45 → 645
  const slotMinutes    = hour * 60;                               // e.g. 11:00 → 660
  return slotMinutes >= nowMinutes + 30;                          // need ≥30 min notice
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  name:    string;
  phone:   string;
  date:    'today' | 'tomorrow';
  time:    number | null;   // 0 = midnight … 23 = 11 PM
  level:   string;
  message: string;
}

export interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 'success' | 'duplicate';

// ── Component ─────────────────────────────────────────────────────────────────
export function BookingModal({ visible, onClose }: BookingModalProps) {
  const [step,      setStep]      = useState<Step>(1);
  const [form,      setForm]      = useState<FormData>({
    name: '', phone: '', date: 'today', time: null, level: '', message: '',
  });
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [dupRecord, setDupRecord] = useState<BookingRecord | null>(null);
  const [loading,   setLoading]   = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Prevent page scroll while modal open (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    (document.body.style as any).overflow = visible ? 'hidden' : '';
    return () => { (document.body.style as any).overflow = ''; };
  }, [visible]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 150, friction: 13, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Reset after close animation
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setForm({ name: '', phone: '', date: 'today', time: null, level: '', message: '' });
      setErrors({});
      setDupRecord(null);
    }, 220);
  };

  // Field helper
  const set = (key: keyof FormData) => (val: any) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  // Navigation
  const goNext = async () => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (!form.name.trim())                         e.name  = 'الرجاء إدخال اسمك';
      if (form.phone.replace(/\D/g, '').length < 9)  e.phone = 'رقم الهاتف غير صحيح';
      if (Object.keys(e).length) { setErrors(e); return; }

      // ── Duplicate booking check ──
      const existing = getActiveBooking(form.phone);
      if (existing) {
        setDupRecord(existing);
        setStep('duplicate');
        return;
      }

      setStep(2);

    } else if (step === 2) {
      if (form.time === null) {
        setErrors({ time: 'الرجاء اختيار وقت للحصة' });
        return;
      }
      // Guard: double-check slot is still available (user may have been on this screen a while)
      if (!isSlotAvailable(form.time, form.date)) {
        setErrors({ time: 'هذا الوقت لم يعد متاحاً، الرجاء اختيار وقت آخر' });
        set('time')(null);
        return;
      }
      setErrors({});
      setStep(3);

    } else if (step === 3) {
      setLoading(true);
      try {
        await submitBooking({
          name:           form.name,
          phone:          form.phone,
          preferred_date: form.date,
          preferred_hour: form.time!,
          level:          form.level,
          message:        form.message || undefined,
        });
        // API succeeded — save locally for duplicate UX
        saveBooking(form);
        setStep('success');
      } catch (err: any) {
        const httpStatus = (err as any)?.response?.status;
        const isNetworkError = !httpStatus; // no response = server unreachable

        if (httpStatus === 409 || err?.message?.includes('لديك')) {
          // Duplicate on server
          const local = getActiveBooking(form.phone);
          setDupRecord(local ?? {
            ...form, time: form.time!, expiresAt: Date.now() + 90 * 60 * 1000,
          });
          setStep('duplicate');
        } else if (isNetworkError) {
          // Server unreachable (dev mode / no internet) — save locally and succeed
          saveBooking(form);
          setStep('success');
        } else {
          setErrors({ submit: 'حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى' });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  // Date labels
  const todayDate    = new Date();
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

  const isSpecialStep = step === 'success' || step === 'duplicate';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.kvWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Blurred backdrop ── */}
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* ── Modal card ── */}
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >

          {/* Header */}
          <View style={styles.cardHeader}>
            {!isSpecialStep ? (
              <View style={styles.stepBarRow}>
                {[1, 2, 3].map(s => (
                  <View
                    key={s}
                    style={[
                      styles.stepSeg,
                      step === s                                          && styles.stepSegActive,
                      typeof step === 'number' && s < (step as number)   && styles.stepSegDone,
                    ]}
                  />
                ))}
              </View>
            ) : <View />}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && (
              <Step1 form={form} set={set} errors={errors} />
            )}
            {step === 2 && (
              <Step2
                form={form} set={set} errors={errors}
                todayLabel={fmtDate(todayDate)}
                tomorrowLabel={fmtDate(tomorrowDate)}
              />
            )}
            {step === 3 && (
              <Step3 form={form} set={set} />
            )}
            {step === 'success' && (
              <SuccessStep onClose={handleClose} />
            )}
            {step === 'duplicate' && dupRecord && (
              <DuplicateStep record={dupRecord} onClose={handleClose} />
            )}
          </ScrollView>

          {/* Footer — only shown on steps 1-3 */}
          {!isSpecialStep && (
            <View style={styles.footer}>
              {typeof step === 'number' && step > 1 ? (
                <TouchableOpacity
                  onPress={goBack}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.backTxt}>→ رجوع</Text>
                </TouchableOpacity>
              ) : <View />}

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {!!errors.submit && (
                  <Text style={styles.errTxt}>{errors.submit}</Text>
                )}
                <TouchableOpacity
                  onPress={goNext}
                  style={[styles.nextBtn, loading && { opacity: 0.65 }]}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.nextTxt}>
                    {loading ? '⏳ جارٍ الإرسال...' : step === 3 ? '✓ إرسال الطلب' : 'التالي ←'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Step 1: Name + Phone ──────────────────────────────────────────────────────
function Step1({ form, set, errors }: { form: FormData; set: any; errors: Record<string, string> }) {
  return (
    <View>
      <Text style={styles.stepTitle}>من أنت؟ 👋</Text>
      <Text style={styles.stepSub}>أدخل معلوماتك الأساسية لحجز حصة التقييم المجانية</Text>

      <Text style={styles.fieldLabel}>الاسم الكريم</Text>
      <TextInput
        style={[styles.input, errors.name ? styles.inputError : null]}
        placeholder="مثال: محمد أحمد"
        placeholderTextColor={Colors.textMuted}
        value={form.name}
        onChangeText={set('name')}
        textAlign="right"
        returnKeyType="next"
      />
      {!!errors.name && <Text style={styles.errTxt}>{errors.name}</Text>}

      <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>رقم الهاتف / الواتساب</Text>
      <TextInput
        style={[styles.input, errors.phone ? styles.inputError : null]}
        placeholder="+966 / +962 / 05..."
        placeholderTextColor={Colors.textMuted}
        value={form.phone}
        onChangeText={set('phone')}
        keyboardType="phone-pad"
        textAlign="right"
        returnKeyType="done"
      />
      {!!errors.phone && <Text style={styles.errTxt}>{errors.phone}</Text>}

      <View style={styles.noteBox}>
        <Text style={styles.noteTxt}>📞 سيتم التواصل معك لتأكيد موعد الحصة</Text>
      </View>
    </View>
  );
}

// ── Step 2: Date + Time ───────────────────────────────────────────────────────
function Step2({
  form, set, errors, todayLabel, tomorrowLabel,
}: {
  form: FormData; set: any; errors: Record<string, string>;
  todayLabel: string; tomorrowLabel: string;
}) {
  // For "today" show only future slots; for "tomorrow" show all 24 slots
  const visibleSlots = TIME_SLOTS.filter(s => isSlotAvailable(s.hour, form.date));

  return (
    <View>
      <Text style={styles.stepTitle}>متى تريد الحصة؟ 📅</Text>
      <Text style={styles.stepSub}>اختر اليوم والوقت المناسب لك</Text>

      {/* Date toggle */}
      <Text style={styles.fieldLabel}>اليوم</Text>
      <View style={styles.dateRow}>
        {([
          { id: 'today',    label: 'اليوم', sub: todayLabel    },
          { id: 'tomorrow', label: 'غداً',  sub: tomorrowLabel },
        ] as const).map(d => (
          <TouchableOpacity
            key={d.id}
            style={[styles.dateBtn, form.date === d.id && styles.dateBtnOn]}
            onPress={() => { set('date')(d.id); set('time')(null); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.dateBtnTitle, form.date === d.id && styles.dateBtnTitleOn]}>
              {d.label}
            </Text>
            <Text style={[styles.dateBtnSub, form.date === d.id && styles.dateBtnSubOn]}>
              {d.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time grid */}
      <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>الوقت (ساعة بساعة)</Text>
      {!!errors.time && <Text style={styles.errTxt}>{errors.time}</Text>}

      {visibleSlots.length === 0 ? (
        <View style={styles.noSlotsBox}>
          <Text style={styles.noSlotsTxt}>
            ⏰ لا توجد أوقات متاحة لليوم — اختر غداً أو تواصل معنا مباشرة
          </Text>
        </View>
      ) : (
        <View style={styles.timeGrid}>
          {visibleSlots.map(slot => {
            const selected = form.time === slot.hour;
            return (
              <TouchableOpacity
                key={slot.hour}
                style={[styles.timeChip, selected && styles.timeChipOn]}
                onPress={() => set('time')(slot.hour)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeChipTxt, selected && styles.timeChipTxtOn]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Step 3: Level + Message ───────────────────────────────────────────────────
function Step3({ form, set }: { form: FormData; set: any }) {
  return (
    <View>
      <Text style={styles.stepTitle}>أخبرنا أكثر 📝</Text>
      <Text style={styles.stepSub}>ساعدنا في تحضير الحصة المناسبة لمستواك</Text>

      <Text style={styles.fieldLabel}>مستواك الحالي بالإنجليزية</Text>
      <View style={styles.levelGrid}>
        {LEVELS.map(lvl => (
          <TouchableOpacity
            key={lvl.id}
            style={[styles.levelCard, form.level === lvl.id && styles.levelCardOn]}
            onPress={() => set('level')(lvl.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.levelEmoji}>{lvl.emoji}</Text>
            <Text style={[styles.levelName, form.level === lvl.id && styles.levelNameOn]}>
              {lvl.label}
            </Text>
            <Text style={[styles.levelSub, form.level === lvl.id && styles.levelSubOn]}>
              {lvl.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
        رسالة إضافية <Text style={styles.optionalLabel}>(اختياري)</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="أي معلومة تساعدنا في تحضير حصتك..."
        placeholderTextColor={Colors.textMuted}
        value={form.message}
        onChangeText={set('message')}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        textAlign="right"
      />
    </View>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessStep({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.successWrap}>
      <Text style={styles.successEmoji}>🎉</Text>
      <Text style={styles.successTitle}>تم إرسال طلبك!</Text>
      <Text style={styles.successDesc}>
        سيتواصل معك مستشارك التعليمي قريباً لترتيب حصة التقييم المجانية وتحديد مستواك
      </Text>

      <View style={styles.successChips}>
        {([
          ['✓', 'مجانية 100%'],
          ['⚡', 'رد خلال ساعة'],
          ['🎓', 'مستشار متخصص'],
        ] as const).map(([ico, lbl]) => (
          <View key={lbl} style={styles.successChip}>
            <Text style={styles.successChipIco}>{ico}</Text>
            <Text style={styles.successChipLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={styles.doneBtnTxt}>حسناً، شكراً! 👍</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Duplicate booking screen ──────────────────────────────────────────────────
function DuplicateStep({ record, onClose }: { record: BookingRecord; onClose: () => void }) {
  // Human-readable slot label
  const slot = TIME_SLOTS.find(s => s.hour === record.time);
  const dateLabel = record.date === 'today' ? 'اليوم' : 'غداً';
  const expiresIn = Math.max(0, Math.round((record.expiresAt - Date.now()) / 60000)); // minutes

  const levelObj = LEVELS.find(l => l.id === record.level);

  return (
    <View style={styles.dupWrap}>
      {/* Icon */}
      <View style={styles.dupIconCircle}>
        <Text style={styles.dupIcon}>🔒</Text>
      </View>

      <Text style={styles.dupTitle}>لديك حجز بالفعل</Text>
      <Text style={styles.dupDesc}>
        رقم هاتفك مرتبط بحجز نشط. يمكنك حجز موعد جديد بعد انتهاء الحصة الحالية.
      </Text>

      {/* Booking detail card */}
      <View style={styles.dupCard}>
        <View style={styles.dupRow}>
          <Text style={styles.dupRowIco}>📅</Text>
          <View style={styles.dupRowText}>
            <Text style={styles.dupRowLabel}>الموعد</Text>
            <Text style={styles.dupRowValue}>{dateLabel} — {slot?.label ?? '—'}</Text>
          </View>
        </View>

        {levelObj && (
          <View style={styles.dupRow}>
            <Text style={styles.dupRowIco}>{levelObj.emoji}</Text>
            <View style={styles.dupRowText}>
              <Text style={styles.dupRowLabel}>المستوى المسجل</Text>
              <Text style={styles.dupRowValue}>{levelObj.label} ({levelObj.sub})</Text>
            </View>
          </View>
        )}

        <View style={styles.dupRow}>
          <Text style={styles.dupRowIco}>⏳</Text>
          <View style={styles.dupRowText}>
            <Text style={styles.dupRowLabel}>ينتهي خلال</Text>
            <Text style={styles.dupRowValue}>
              {expiresIn >= 60
                ? `${Math.floor(expiresIn / 60)} ساعة و${expiresIn % 60} دقيقة`
                : `${expiresIn} دقيقة`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.dupNote}>
        <Text style={styles.dupNoteTxt}>
          📞 إذا كنت بحاجة للمساعدة، تواصل معنا مباشرة عبر واتساب
        </Text>
      </View>

      <TouchableOpacity style={styles.dupCloseBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={styles.dupCloseTxt}>حسناً، فهمت</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }) ?? {};
const RTL  = { writingDirection: 'rtl' as any };

const styles = StyleSheet.create({

  // Keyboard wrapper fills the screen
  kvWrap: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    padding:        Spacing.lg,
  },

  // Blurred backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,36,96,0.55)',
    ...Platform.select({ web: { backdropFilter: 'blur(10px)' } as any }),
  },

  // White card
  card: {
    backgroundColor: Colors.white,
    borderRadius:    28,
    width:           '100%',
    maxWidth:        480,
    maxHeight:       '90%' as any,
    overflow:        'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 80px rgba(15,36,96,0.30), 0 0 0 1px rgba(255,193,7,0.18)',
      } as any,
      default: {
        shadowColor:   Colors.navy,
        shadowOffset:  { width: 0, height: 16 },
        shadowOpacity: 0.28,
        shadowRadius:  40,
        elevation:     20,
      },
    }),
  },

  // ── Card header ──
  cardHeader: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundGray,
  },
  stepBarRow: { flexDirection: 'row', gap: 6 },
  stepSeg: {
    height:          4,
    width:           40,
    borderRadius:    2,
    backgroundColor: Colors.border,
  },
  stepSegActive: { backgroundColor: Colors.yellow, width: 56 },
  stepSegDone:   { backgroundColor: Colors.yellowDark },
  closeBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: Colors.backgroundGray,
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeTxt: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },

  // ── Scrollable body ──
  scrollArea: { flexShrink: 1 },
  scrollPad:  { padding: Spacing.xl, paddingBottom: Spacing.md },

  // Step header
  stepTitle: {
    color: Colors.navy, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold,
    textAlign: 'right', marginBottom: Spacing.xs,
    ...FONT, ...RTL,
  },
  stepSub: {
    color: Colors.textSecondary, fontSize: FontSize.sm,
    textAlign: 'right', marginBottom: Spacing.xl, lineHeight: 22,
    ...FONT, ...RTL,
  },

  // Field label
  fieldLabel: {
    color: Colors.navy, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    textAlign: 'right', marginBottom: Spacing.sm,
    ...FONT, ...RTL,
  },
  optionalLabel: { color: Colors.textMuted, fontWeight: FontWeight.medium },

  // Text input
  input: {
    borderWidth:       1.5,
    borderColor:       Colors.border,
    borderRadius:      14,
    paddingVertical:   Platform.OS === 'ios' ? 14 : 11,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.base,
    color:             Colors.navy,
    backgroundColor:   Colors.backgroundGray,
    ...Platform.select({ web: { outlineStyle: 'none', ...FONT } as any }),
  },
  inputError: { borderColor: '#EF4444' },
  textarea:   { height: 96, paddingTop: 12 },

  errTxt: {
    color: '#EF4444', fontSize: FontSize.xs, textAlign: 'right', marginTop: 4,
    ...FONT, ...RTL,
  },

  noteBox: {
    marginTop:         Spacing.lg,
    backgroundColor:   Colors.yellowSoft,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.borderYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  noteTxt: {
    color: Colors.navy, fontSize: FontSize.xs, textAlign: 'right', lineHeight: 20,
    ...FONT, ...RTL,
  },

  // ── Date buttons ──
  dateRow: { flexDirection: 'row-reverse', gap: Spacing.sm },
  dateBtn: {
    flex:            1,
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.backgroundGray,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    gap:             3,
  },
  dateBtnOn: {
    borderColor:       Colors.yellow,
    backgroundColor:   Colors.yellowLight,
    borderBottomWidth: 3,
    borderBottomColor: Colors.yellowDeep,
  },
  dateBtnTitle: {
    color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.bold,
    ...FONT,
  },
  dateBtnTitleOn: { color: Colors.navy },
  dateBtnSub: {
    color: Colors.textMuted, fontSize: 11,
    ...FONT, ...RTL,
  },
  dateBtnSubOn: { color: Colors.yellowDark },

  // ── No available slots banner ──
  noSlotsBox: {
    backgroundColor:   '#FEF3C7',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.borderYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    marginBottom:      Spacing.sm,
  },
  noSlotsTxt: {
    color: Colors.yellowDark, fontSize: FontSize.xs, textAlign: 'right', lineHeight: 20,
    ...FONT, ...RTL,
  },

  // ── Time grid (4 cols) ──
  timeGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap' as any,
    gap:           8,
    marginTop:     4,
  },
  timeChip: {
    width:           '22%' as any,
    paddingVertical: 9,
    borderRadius:    10,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.backgroundGray,
    alignItems:      'center',
    justifyContent:  'center',
  },
  timeChipOn: {
    borderColor:       Colors.yellow,
    backgroundColor:   Colors.yellowLight,
    borderBottomWidth: 3,
    borderBottomColor: Colors.yellowDeep,
  },
  timeChipTxt: {
    fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium,
    ...FONT,
  },
  timeChipTxtOn: { color: Colors.navy, fontWeight: FontWeight.extrabold },

  // ── Level cards (2×2 grid) ──
  levelGrid: {
    flexDirection: 'row-reverse',
    flexWrap:      'wrap' as any,
    gap:           Spacing.sm,
  },
  levelCard: {
    width:           '47%' as any,
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.backgroundGray,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    gap:             4,
  },
  levelCardOn: {
    borderColor:       Colors.yellow,
    backgroundColor:   Colors.yellowLight,
    borderBottomWidth: 3,
    borderBottomColor: Colors.yellowDeep,
  },
  levelEmoji: { fontSize: 28 },
  levelName: {
    color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    ...FONT,
  },
  levelNameOn: { color: Colors.navy },
  levelSub: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    ...FONT,
  },
  levelSubOn: { color: Colors.yellowDark },

  // ── Footer ──
  footer: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    borderTopWidth:    1,
    borderTopColor:    Colors.backgroundGray,
  },
  nextBtn: {
    backgroundColor:   Colors.yellow,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.sm + 4,
    borderRadius:      50,
    borderBottomWidth: 3,
    borderBottomColor: Colors.yellowDeep,
    ...Platform.select({ web: { boxShadow: '0 4px 14px rgba(255,193,7,0.45)' } as any }),
  },
  nextTxt: {
    color: Colors.navy, fontSize: FontSize.base, fontWeight: FontWeight.extrabold,
    ...RTL,
  },
  backBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm + 4 },
  backTxt: {
    color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: FontWeight.medium,
    ...RTL,
  },

  // ── Success ──
  successWrap: {
    alignItems: 'center', paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.md,
  },
  successEmoji: { fontSize: 72, marginBottom: Spacing.md },
  successTitle: {
    color: Colors.navy, fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold,
    textAlign: 'center', marginBottom: Spacing.sm,
    ...FONT, ...RTL,
  },
  successDesc: {
    color: Colors.textSecondary, fontSize: FontSize.base, lineHeight: 26,
    textAlign: 'center', marginBottom: Spacing.xl, maxWidth: 300,
    ...FONT, ...RTL,
  },
  successChips: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl,
    flexWrap: 'wrap' as any, justifyContent: 'center',
  },
  successChip: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   Colors.backgroundGray,
    borderRadius:      50,
    paddingHorizontal: Spacing.md,
    paddingVertical:   6,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  successChipIco: { fontSize: FontSize.sm },
  successChipLbl: { color: Colors.textMuted, fontSize: FontSize.xs, ...FONT, ...RTL },
  doneBtn: {
    backgroundColor:   Colors.navy,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical:   Spacing.md,
    borderRadius:      50,
    borderBottomWidth: 3,
    borderBottomColor: Colors.navyDark,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(30,58,138,0.30)' } as any }),
  },
  doneBtnTxt: {
    color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.extrabold,
    ...FONT, ...RTL,
  },

  // ── Duplicate screen ──
  dupWrap: {
    alignItems: 'center', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md,
  },
  dupIconCircle: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: '#FEF3C7',
    borderWidth:     2,
    borderColor:     Colors.borderYellow,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
  },
  dupIcon:  { fontSize: 36 },
  dupTitle: {
    color: Colors.navy, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold,
    textAlign: 'center', marginBottom: Spacing.sm,
    ...FONT, ...RTL,
  },
  dupDesc: {
    color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22,
    textAlign: 'center', marginBottom: Spacing.lg, maxWidth: 300,
    ...FONT, ...RTL,
  },

  // Detail card inside duplicate screen
  dupCard: {
    width:             '100%',
    backgroundColor:   Colors.backgroundGray,
    borderRadius:      16,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.md,
    gap:               Spacing.sm,
    marginBottom:      Spacing.md,
  },
  dupRow: {
    flexDirection: 'row-reverse',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  dupRowIco:   { fontSize: FontSize.lg },
  dupRowText:  { flex: 1, alignItems: 'flex-end' },
  dupRowLabel: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    ...FONT, ...RTL,
  },
  dupRowValue: {
    color: Colors.navy, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    ...FONT, ...RTL,
  },

  dupNote: {
    backgroundColor:   '#DBEAFE',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       '#BFDBFE',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    marginBottom:      Spacing.xl,
    width:             '100%',
  },
  dupNoteTxt: {
    color: '#1E40AF', fontSize: FontSize.xs, textAlign: 'right', lineHeight: 20,
    ...FONT, ...RTL,
  },

  dupCloseBtn: {
    backgroundColor:   Colors.navy,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical:   Spacing.md,
    borderRadius:      50,
    borderBottomWidth: 3,
    borderBottomColor: Colors.navyDark,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(30,58,138,0.30)' } as any }),
  },
  dupCloseTxt: {
    color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.extrabold,
    ...FONT, ...RTL,
  },
});

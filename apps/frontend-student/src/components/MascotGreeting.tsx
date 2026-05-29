/**
 * MascotGreeting — shown once per session for subscribed students.
 *
 * Lifecycle is managed by the PARENT (LevelsScreen):
 *   - Parent mounts this component once when data is ready
 *   - Component slides in, waits 30 s, slides back out, then calls onHide
 *   - Parent unmounts it via onHide and never shows it again this session
 */
import React, { useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { C, shadow } from '@/theme';

// ── Content ───────────────────────────────────────────────────────────────────

const MESSAGES = [
  'خليك متابع تقدمك جوا التطبيق علشان انت فلوينت 💪',
  'لا تنسا تسجل ملاحظاتك او الكلمات الجديدة في سجل الملاحظات',
  'الفرص الكبيرة بتيجي للي جاهز إلها، وضبط اللغة هو أول خطوة لترفع برستيجك.. شد حيلك اليوم',
  'كل درس بتخلصه اليوم بـ iFluent، بيقربك خطوة من أحلامك الكبيرة. لا توقف هسا 🚀',
  'ما في شي بيجي بالساهل، واللغة بدها نفس طويل.. إنت قدها يا بطل، ادخل وكمل طريقك! 💪',
  'تطوير نفسك هو أحسن قرار بتاخده بيومك.. ادخل كمل طريقك وصير فلوينت',
  'كل دقيقة بتقضيها هون هي استثمار ببرستيجك وثقتك.. يلا نبلش الصح 👑',
  'خطوة صغيرة كل يوم بتعمل فرق كبير.. يلا ناخد خطوة جديدة مع iFluent هسا',
  'عارف شو أحسن وقت لتبلش تطور لغتك وتصير فلوينت؟ هسا بالذات! ادخل وشوف الكورسات ⏰',
  'كم درس خلصت لهسا؟.. يلا علشان نخلي الانجليزي لعبتنا',
  'نورت مكانك، يلا نطور لغتنا ونثبت وجودنا',
  'يا هلا بطلنا! راحت عقدة الإنجليزي من اليوم وطالع، الانجليزي لعبتنا',
  'يا أهلاً وسهلاً! نورت عائلتك، يلا نبلش ونصير فلوينت؟ 🚀',
  'كل دقيقة بتقضيها هون هي استثمار ببرستيجك وثقتك.. يلا نبلش الصح 👑',
];

const BOTS = [
  require('../../assets/mascot.png'),
  require('../../assets/mascot-verify.png'),
  require('../../assets/mascot.png'),
];

const SHOW_DURATION = 30_000;
const SLIDE_MS      = 400;
const FADE_MS       = 260;
const BOT_W         = 120;
const SCREEN_W      = Dimensions.get('window').width;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onHide: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MascotGreeting({ onHide }: Props) {
  const slideX      = useRef(new Animated.Value(-(BOT_W + 60))).current;
  const bubbleAnim  = useRef(new Animated.Value(0)).current;
  const wholeOpacity = useRef(new Animated.Value(1)).current;
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    [],
  );
  const botImg = useMemo(
    () => BOTS[Math.floor(Math.random() * BOTS.length)],
    [],
  );

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Fade the whole container (image + bubble) then slide out
    Animated.sequence([
      Animated.timing(wholeOpacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
      Animated.timing(slideX,       { toValue: -(BOT_W + 60), duration: SLIDE_MS, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  useEffect(() => {
    // Slide in → fade bubble in → wait → slide out
    Animated.sequence([
      Animated.timing(slideX, {
        toValue: 0, duration: SLIDE_MS, useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: 1, duration: FADE_MS, useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(dismiss, SHOW_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Animated.View
      style={[s.container, { transform: [{ translateX: slideX }], opacity: wholeOpacity }]}
    >
      {/* Dialog bubble — glowing golden border */}
      <Animated.View style={[s.bubbleWrap, { opacity: bubbleAnim }]}>
        <View style={s.glowRing}>
          <View style={s.bubble}>
            <Text style={s.msg}>{message}</Text>
            {/* Tail pointing down-left toward bot */}
            <View style={s.tailBorder} />
            <View style={s.tailInner} />
          </View>
        </View>

        {/* Tap to dismiss */}
        <TouchableOpacity style={s.closeBtn} onPress={dismiss} hitSlop={10}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bot image */}
      <Image source={botImg} style={s.bot} resizeMode="contain" />
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    width: SCREEN_W * 0.74,
    alignItems: 'flex-start',
    zIndex: 99,
  },

  bot: {
    width: BOT_W,
    height: BOT_W * 1.4,
    marginLeft: 6,
  },

  bubbleWrap: {
    marginLeft: 10,
    marginBottom: 4,
    maxWidth: SCREEN_W * 0.60,
    alignSelf: 'flex-start',
  },

  // Outer ring — golden glow
  glowRing: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 205, 50, 0.90)',
    backgroundColor: '#FFFFFF',
    shadowColor:   '#FFD700',
    shadowOpacity: 1,
    shadowRadius:  18,
    shadowOffset:  { width: 0, height: 0 },
    elevation: 12,
  },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 16,
  },

  msg: {
    fontSize: 13,
    fontWeight: '700',
    color: C.navy,
    textAlign: 'right',
    lineHeight: 21,
  },

  // Triangle tail: border layer (golden)
  tailBorder: {
    position: 'absolute',
    bottom: -13,
    left: 16,
    width: 0, height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 13,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 205, 50, 0.90)',
  },
  // Inner white fill
  tailInner: {
    position: 'absolute',
    bottom: -10,
    left: 18,
    width: 0, height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },

  closeBtn: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.navy,
    justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: {
    fontSize: 10, color: '#fff', fontWeight: '900', lineHeight: 12,
  },
});

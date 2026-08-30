/**
 * Profile tab — student info + logout.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Animated,
  Modal, Image, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage }            from '@/utils/storage';
import { useAuthStore }    from '@/stores/authStore';
import { useAvatarStore }  from '@/stores/avatarStore';
import { authApi }         from '@/api/auth';
import client              from '@/api/client';
import { levelsApi, type Unit } from '@/api/levels';
import { profileApi } from '@/api/profile';
import { C, shadow }          from '@/theme';
import { useAnimatedHeader }  from '@/hooks/useAnimatedHeader';
import { useState, useEffect } from 'react';

const LOCAL_NAME_KEY = 'student_local_name';

// ─── Preset avatars (static requires — Metro needs explicit paths) ────────────
const AVATARS = [
  { id: 1, src: require('../../assets/av1.png') },
  { id: 2, src: require('../../assets/av2.png') },
  { id: 3, src: require('../../assets/av3.png') },
  { id: 4, src: require('../../assets/av4.png') },
  { id: 5, src: require('../../assets/av5.png') },
  { id: 6, src: require('../../assets/av6.png') },
  { id: 7, src: require('../../assets/av7.png') },
  { id: 8, src: require('../../assets/av8.png') },
];

interface Profile {
  name:              string;
  phone:             string;
  timezone:          string | null;
  completed_lessons: number;
  passed_quizzes:    number;
  enrolled_units:    number;
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={C.yellow} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Extra space below the yellow header for the avatar circle overlap
const AVATAR_OVERLAP = 52;

export default function ProfileScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [loggingOut, setLoggingOut]           = useState(false);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [nameSheetOpen,   setNameSheetOpen]   = useState(false);
  const [localName,       setLocalName]       = useState<string | null>(null);
  const [draftName,       setDraftName]       = useState('');
  const { selectedAvatar, setAvatar }         = useAvatarStore();
  const { user, clearAuth } = useAuthStore();

  // Load locally-saved name on mount
  useEffect(() => {
    storage.getItem(LOCAL_NAME_KEY).then((v) => {
      if (v) setLocalName(v);
    });
  }, []);

  const { headerHeight, onHeaderLayout, onScroll, headerStyle } = useAnimatedHeader();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => client.get<{ profile: Profile }>('/student/profile').then((r) => r.data.profile ?? null),
  });

  // Local name takes priority → server name → auth store name
  const displayName  = localName ?? profile?.name ?? user?.name ?? '…';
  const displayPhone = profile?.phone ?? user?.phone ?? '';
  const initial      = displayName.trim().charAt(0).toUpperCase() || '?';

  // Progress data — reuses cached data from levels tab (no extra network call)
  const { data: myUnits = [] } = useQuery<Unit[]>({
    queryKey: ['my-units'],
    queryFn:  levelsApi.myUnits,
    staleTime: Infinity,
  });
  // Overall progress — single source of truth (same number as the التقدم screen)
  const { data: progressSummary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn:  profileApi.progress,
    staleTime: 30_000,
  });
  const overallPct       = progressSummary?.overall_pct ?? 0;
  const completedLessons = progressSummary?.completed_lessons ?? 0;
  const learningMins     = Math.round(progressSummary?.learning_minutes ?? 0);
  const earnedBadges     = progressSummary?.earned_badges ?? 0;
  const totalBadges      = progressSummary?.total_badges ?? 0;
  const badgePct         = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;

  const openNameSheet = () => {
    setDraftName(displayName === '…' ? '' : displayName);
    setNameSheetOpen(true);
  };

  const saveLocalName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      appAlert('', 'الرجاء إدخال اسم صحيح');
      return;
    }
    await storage.setItem(LOCAL_NAME_KEY, trimmed);
    setLocalName(trimmed);
    setNameSheetOpen(false);
  };

  const chooseAvatar = (id: number) => {
    setAvatar(id);
    setAvatarSheetOpen(false);
  };

  const deleteAvatar = () => {
    setAvatar(null);
    setAvatarSheetOpen(false);
  };

  const handleLogout = () => {
    appAlert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await authApi.logout(); } catch { /* ignore */ }
          await clearAuth();
          router.replace('/(auth)/phone');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header with avatar (absolute, animates on scroll) ── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 14 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        {/* Dots are clipped inside their own layer — avatar can overflow freely */}
        <View style={styles.dotsLayer} pointerEvents="none">
          <View style={[styles.dot, { width: 100, height: 100, top: -30, right: -30 }]} />
          <View style={[styles.dot, { width: 45,  height: 45,  bottom: 60, left: 10 }]} />
        </View>

        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>ملفي الشخصي</Text>
          <View style={styles.headerBadge}>
            <Ionicons name="star" size={12} color={C.navy} />
            <Text style={styles.headerBadgeTxt}>طالب</Text>
          </View>
        </View>

        {/* Avatar — extends below header without being clipped */}
        <View style={styles.avatarOuter}>
          {selectedAvatar ? (
            <Image
              source={AVATARS.find((a) => a.id === selectedAvatar)!.src}
              style={styles.avatarImage}
            />
          ) : isLoading ? (
            <ActivityIndicator color={C.yellow} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
          {/* Edit button */}
          <TouchableOpacity
            style={styles.editAvatarBtn}
            onPress={() => setAvatarSheetOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="pencil" size={12} color={C.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + AVATAR_OVERLAP }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Name + phone under avatar */}
        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{displayName}</Text>
          <TouchableOpacity
            style={styles.nameEditBtn}
            onPress={openNameSheet}
            hitSlop={10}
            activeOpacity={0.75}
          >
            <Ionicons name="pencil" size={14} color={C.navy} />
          </TouchableOpacity>
        </View>
        <Text style={styles.profilePhone}>{displayPhone}</Text>

        {/* ── Info card ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.cardTitle}>معلوماتي</Text>
          <InfoRow
            icon="person"
            label="الاسم الكامل"
            value={displayName}
          />
          <InfoRow
            icon="call"
            label="رقم الهاتف"
            value={displayPhone}
            last
          />
        </View>

        {/* ── Progress card — trophy design ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.card, styles.progressCard, { marginTop: 14 }]}
          onPress={() => router.push('/progress')}
          activeOpacity={0.85}
        >
          <Ionicons name="trophy" size={88} color={C.amber} style={styles.progressCardTrophy} />
          <View style={styles.progressCardTop}>
            <Text style={styles.progressCardPct}>{overallPct}%</Text>
            <Text style={styles.progressCardLbl}>التقدم الكلي</Text>
          </View>
          <View style={styles.progressCardTrack}>
            <View style={[styles.progressCardFill, { width: `${overallPct}%` as any }]} />
          </View>
          <View style={styles.progressCardFooter}>
            <Text style={styles.progressCardHint}>اضغط لعرض تفاصيل تقدمك</Text>
            <Ionicons name="chevron-back" size={14} color={C.navyMid} />
          </View>
        </TouchableOpacity>

        {/* ── Points / Gamification ─────────────────────────────────────── */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <View style={styles.ptHeader}>
            <View style={styles.starPill}>
              <Ionicons name="star" size={11} color={C.amber} />
              <Text style={styles.starPillTxt}>مبتدئ</Text>
            </View>
            <Text style={styles.ptTitle}>نقاطي المكتسبة</Text>
          </View>

          {/* Points circle + next-level bar */}
          <View style={styles.pointsMain}>
            <View style={styles.pointsCircle}>
              <Ionicons name="star" size={18} color={C.amber} />
              <Text style={styles.pointsNum}>{earnedBadges}</Text>
              <Text style={styles.pointsUnit}>نقطة</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toNextTxt}>اتطلع على صفحة التقدم لتتعرف على الانجازات المطلوبة لكسب نقاط الانجاز</Text>
              <View style={styles.pointsTrack}>
                <View style={[styles.pointsFill, { width: `${badgePct}%` as any }]} />
              </View>
              <Text style={styles.nextLevelHint}>ادعُ أصدقاءك للانضمام واجمع نقاطاً ومكافآت تعليمية</Text>
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.qStatsRow}>
            <View style={styles.qStat}>
              <View style={[styles.qStatIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="book-outline" size={15} color={C.info} />
              </View>
              <Text style={styles.qStatNum}>{completedLessons}</Text>
              <Text style={styles.qStatLbl}>درس</Text>
            </View>
            <View style={styles.qDivider} />
            <View style={styles.qStat}>
              <View style={[styles.qStatIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="timer-outline" size={15} color={C.amber} />
              </View>
              <Text style={styles.qStatNum}>{learningMins}</Text>
              <Text style={styles.qStatLbl}>دقيقة</Text>
            </View>
            <View style={styles.qDivider} />
            <View style={styles.qStat}>
              <View style={[styles.qStatIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="medal-outline" size={15} color="#8B5CF6" />
              </View>
              <Text style={styles.qStatNum}>{earnedBadges}</Text>
              <Text style={styles.qStatLbl}>إنجاز</Text>
            </View>
          </View>
        </View>

        {/* ── App info card ──────────────────────────────────────────────── */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.cardTitle}>التطبيق</Text>
          <View style={[styles.infoRow, styles.infoRowDivider]}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="information-circle" size={18} color={C.yellow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>الإصدار</Text>
              <Text style={styles.infoValue}>iFluent Student v1.0</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="shield-checkmark" size={18} color={C.yellow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>الحالة</Text>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillTxt}>نشط</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Logout button ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator color={C.error} size="small" />
            : <Ionicons name="log-out-outline" size={20} color={C.error} />
          }
          <Text style={styles.logoutTxt}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
      {/* ── Name edit bottom sheet ───────────────────────────────────── */}
      <Modal
        visible={nameSheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setNameSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setNameSheetOpen(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.nameSheetKav}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setNameSheetOpen(false)}
              >
                <Ionicons name="close" size={18} color={C.navy} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>تعديل الاسم</Text>
            </View>

            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="أدخل اسمك الكامل"
              placeholderTextColor={C.gray}
              textAlign="right"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveLocalName}
            />

            <TouchableOpacity
              style={[styles.nameSaveBtn, !draftName.trim() && styles.nameSaveBtnOff]}
              onPress={saveLocalName}
              disabled={!draftName.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color={C.navy} />
              <Text style={styles.nameSaveTxt}>حفظ الاسم</Text>
            </TouchableOpacity>

            {localName && (
              <TouchableOpacity
                style={styles.nameResetBtn}
                onPress={async () => {
                  await storage.removeItem(LOCAL_NAME_KEY);
                  setLocalName(null);
                  setNameSheetOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.nameResetTxt}>إعادة تعيين للاسم الأصلي</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Avatar picker bottom sheet ────────────────────────────────── */}
      <Modal
        visible={avatarSheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAvatarSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setAvatarSheetOpen(false)}
        >
          <View
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setAvatarSheetOpen(false)}
              >
                <Ionicons name="close" size={18} color={C.navy} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>اختر صورة شخصية</Text>
            </View>

            {/* Avatar grid — 4 × 2 */}
            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => {
                const isActive = selectedAvatar === av.id;
                return (
                  <TouchableOpacity
                    key={av.id}
                    style={[styles.avatarGridItem, isActive && styles.avatarGridItemActive]}
                    onPress={() => chooseAvatar(av.id)}
                    activeOpacity={0.8}
                  >
                    <Image source={av.src} style={styles.avatarGridImg} />
                    {isActive && (
                      <View style={styles.avatarGridCheck}>
                        <Ionicons name="checkmark" size={14} color={C.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Delete / reset */}
            <TouchableOpacity
              style={[styles.sheetDeleteBtn, !selectedAvatar && styles.sheetOptionDisabled]}
              onPress={deleteAvatar}
              activeOpacity={selectedAvatar ? 0.75 : 1}
              disabled={!selectedAvatar}
            >
              <Ionicons name="close-circle-outline" size={18} color={C.error} />
              <Text style={styles.sheetDeleteTxt}>إزالة الصورة الحالية</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 68,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    // NO overflow:hidden — lets the avatar circle show fully below the header
    shadowColor: C.amber,
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  // Dots clipped inside their own layer so they don't spill outside the header curve
  dotsLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.18,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.navy },
  menuBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.42)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  headerBadgeTxt: { fontSize: 12, fontWeight: '800', color: C.navy },

  // Avatar centered, overlapping header bottom
  avatarOuter: {
    position: 'absolute',
    bottom: -44,
    alignSelf: 'center',
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: C.navy,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: C.cream,
    ...shadow.navy,
  },
  avatarImage: {
    width: '100%', height: '100%', borderRadius: 46, resizeMode: 'cover',
  },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: C.yellow },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.amber,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: C.cream,
  },

  // ── Profile name/phone (below avatar) ────────────────────────────────────
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  profileName: {
    fontSize: 22, fontWeight: '900', color: C.navy,
    textAlign: 'center',
  },
  nameEditBtn: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: C.cream,
    borderWidth: 1.5, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  profilePhone: {
    fontSize: 14, color: C.gray, textAlign: 'center',
    marginTop: 4, letterSpacing: 1,
  },

  // ── Name edit sheet ───────────────────────────────────────────────────────
  nameSheetKav: { justifyContent: 'flex-end' },
  nameInput: {
    backgroundColor: C.inputBg,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    padding: 14, fontSize: 16, fontWeight: '600', color: C.navy,
    marginBottom: 14,
  },
  nameSaveBtn: {
    backgroundColor: C.yellow, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, marginBottom: 10,
    ...shadow.amber,
  },
  nameSaveBtnOff: { opacity: 0.4 },
  nameSaveTxt: { fontSize: 15, fontWeight: '900', color: C.navy },
  nameResetBtn: { alignItems: 'center', paddingVertical: 8 },
  nameResetTxt: { fontSize: 13, color: C.gray, fontWeight: '600' },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardTitle: {
    fontSize: 12, fontWeight: '800', color: C.gray,
    textAlign: 'right',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  infoRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: C.gray, marginBottom: 3, textAlign: 'right' },
  infoValue: { fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },

  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-end',
  },
  activeDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  activePillTxt: { fontSize: 12, fontWeight: '700', color: C.success },

  // ── Progress card (trophy design) ─────────────────────────────────────────
  progressCard: {
    backgroundColor: '#FFFBEB',
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#FDE68A',
  },
  progressCardTrophy: {
    position: 'absolute', right: -14, top: -8, opacity: 0.10,
  },
  progressCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', padding: 16, paddingBottom: 12,
  },
  progressCardPct:  { fontSize: 32, fontWeight: '900', color: C.navy },
  progressCardLbl:  { fontSize: 13, fontWeight: '800', color: C.navyMid },
  progressCardTrack: {
    height: 8, backgroundColor: 'rgba(26,41,128,0.10)',
    marginHorizontal: 16, borderRadius: 4, overflow: 'hidden',
  },
  progressCardFill:   { height: 8, backgroundColor: C.amber, borderRadius: 4 },
  progressCardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', padding: 16, paddingTop: 10, gap: 4,
  },
  progressCardHint: { fontSize: 12, color: C.navyMid, fontWeight: '600' },

  // ── Points / Gamification card ────────────────────────────────────────────
  ptHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  ptTitle: {
    fontSize: 12, fontWeight: '800', color: C.gray,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  starPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  starPillTxt: { fontSize: 11, fontWeight: '800', color: C.amber },

  pointsMain: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, gap: 16,
  },
  pointsCircle: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: '#FFFBEB',
    borderWidth: 2.5, borderColor: '#FDE68A',
    justifyContent: 'center', alignItems: 'center',
    gap: 0, flexShrink: 0,
  },
  pointsNum:  { fontSize: 20, fontWeight: '900', color: C.navy, lineHeight: 24 },
  pointsUnit: { fontSize: 9,  fontWeight: '700', color: C.gray, lineHeight: 12 },

  toNextTxt:     { fontSize: 11, fontWeight: '700', color: C.navyMid, textAlign: 'right', marginBottom: 6 },
  pointsTrack:   { height: 7, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  pointsFill:    { height: 7, backgroundColor: C.amber, borderRadius: 4 },
  nextLevelHint: { fontSize: 11, color: C.gray, textAlign: 'right', fontWeight: '500' },

  qStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  qStat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  qStatIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  qStatNum: { fontSize: 16, fontWeight: '900', color: C.navy },
  qStatLbl: { fontSize: 10, fontWeight: '600', color: C.gray },
  qDivider: { width: 1, height: 44, backgroundColor: '#F3F4F6' },

  // ── Avatar bottom sheet ───────────────────────────────────────────────────
  sheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: C.navy },
  sheetCloseBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  // Avatar grid
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  avatarGridItem: {
    width: '23%', aspectRatio: 1,
    borderRadius: 999,
    marginBottom: 12,
    borderWidth: 3, borderColor: 'transparent',
  },
  avatarGridItemActive: {
    borderColor: C.amber,
  },
  avatarGridImg: {
    width: '100%', height: '100%',
    borderRadius: 999, resizeMode: 'cover',
  },
  avatarGridCheck: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.amber,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.white,
  },

  // Delete button
  sheetDeleteBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  sheetDeleteTxt: {
    fontSize: 14, fontWeight: '700', color: C.error,
  },
  sheetOptionDisabled: { opacity: 0.35 },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: C.white,
    marginTop: 14, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#FECACA',
    ...shadow.sm,
  },
  logoutTxt: { fontSize: 16, fontWeight: '800', color: C.error },
});

/**
 * Levels tab — main home screen for logged-in students.
 *
 * Renders one of two states depending on lesson_credits:
 *   State B (credits = 0)  → encouragement / no-credits UI
 *   State C (credits > 0)  → credits widget + enrolled units + roadmap
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Linking,
  
} from 'react-native';
import { appAlert } from '@/lib/alert';
import { useRouter, type Router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { levelsApi, type Unit, type Level } from '@/api/levels';
import { profileApi }          from '@/api/profile';
import { studentMessagesApi }  from '@/api/messages';
import { C, LEVEL_COLORS, shadow } from '@/theme';
import { useSidebarStore }        from '@/stores/sidebarStore';
import { useAnimatedHeader }      from '@/hooks/useAnimatedHeader';
import { EvalBookingModal }        from '@/components/EvalBookingModal';
import { SessionBookingModal }    from '@/components/SessionBookingModal';
import { MascotGreeting }         from '@/components/MascotGreeting';

const WHATSAPP = 'https://wa.me/962780105274';

// ─── Unit card ────────────────────────────────────────────────────────────────

function UnitCard({ unit, onPress }: { unit: Unit; onPress: () => void }) {
  const isLocked = !unit.enrollment;
  const isDone   = unit.enrollment?.status === 'completed';
  const pct      = isDone ? 100 : unit.enrollment ? 35 : 0;

  return (
    <TouchableOpacity
      style={[styles.unitCard, isLocked && styles.unitCardLocked]}
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.82}
    >
      <View style={[styles.unitAccent, isLocked && styles.unitAccentLocked]} />

      <View style={styles.unitBody}>
        <View style={styles.unitTop}>
          <Text style={[styles.unitName, isLocked && styles.textMuted]} numberOfLines={1}>
            {unit.name}
          </Text>
          {isLocked ? (
            <Ionicons name="lock-closed" size={15} color={C.border} />
          ) : isDone ? (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark" size={11} color={C.white} />
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeTxt}>نشطة</Text>
            </View>
          )}
        </View>

        <Text style={styles.unitMeta}>
          {unit.lesson_count} درس{unit.has_end_test ? ' · اختبار وحدة' : ''}
        </Text>

        {!isLocked && (
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        )}
      </View>

      {!isLocked && (
        <Ionicons name="chevron-back" size={18} color={C.navy} style={{ marginLeft: -4 }} />
      )}
    </TouchableOpacity>
  );
}

// ─── Level roadmap row ────────────────────────────────────────────────────────

function LevelRow({ level }: { level: Level }) {
  const color = LEVEL_COLORS[level.code] ?? C.navy;
  return (
    <View style={styles.levelRow}>
      <View style={[styles.levelBadge, { backgroundColor: color }]}>
        <Text style={styles.levelBadgeTxt}>{level.code}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.levelName}>{level.name}</Text>
        <Text style={styles.levelMeta}>
          {level.total_units} وحدة · {level.total_lessons} درس
        </Text>
      </View>
      <View style={[styles.levelDot, { backgroundColor: color + '22' }]}>
        <Text style={[styles.levelDotTxt, { color }]}>{level.total_units}</Text>
      </View>
    </View>
  );
}

// ─── Premium shortcut cards ───────────────────────────────────────────────────

/** Card 1 — Navy gradient · "خذ فكرة عنّا" */
function AboutCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.scWrapper} onPress={onPress} activeOpacity={0.86}>
      <LinearGradient
        colors={['#1A2980', '#2D3DA8', '#26367B']}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        style={styles.scCard}
      >
        {/* Decorative soft circles */}
        <View style={[styles.scCircle, { width: 90, height: 90, top: -28, right: -22, opacity: 0.13 }]} />
        <View style={[styles.scCircle, { width: 46, height: 46, bottom: -14, left: 14, opacity: 0.10 }]} />

        {/* Icon pill */}
        <View style={styles.scIconPillNavy}>
          <Feather name="compass" size={22} color={C.yellow} />
        </View>

        {/* Text */}
        <Text style={styles.scLabelLight}>خذ فكرة عنّا</Text>
        <Text style={styles.scSubLight}>من نحن · رؤيتنا</Text>

        {/* Arrow hint */}
        <View style={styles.scArrowWrap}>
          <Ionicons name="arrow-back" size={13} color="rgba(255,255,255,0.40)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/** Card 2 — Gold gradient · "اعرف طريق الطلاقة" */
function HowCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.scWrapper} onPress={onPress} activeOpacity={0.86}>
      <LinearGradient
        colors={['#FFD54F', '#FFB300', '#FFA000']}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        style={styles.scCard}
      >
        {/* Decorative soft circles */}
        <View style={[styles.scCircleDark, { width: 90, height: 90, top: -28, right: -22, opacity: 0.09 }]} />
        <View style={[styles.scCircleDark, { width: 46, height: 46, bottom: -14, left: 14, opacity: 0.07 }]} />

        {/* Icon pill */}
        <View style={styles.scIconPillGold}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={23} color={C.navy} />
        </View>

        {/* Text */}
        <Text style={styles.scLabelDark}> خطواتك نحو الطلاقة </Text>
        <Text style={styles.scSubDark}>كيف تبدأ رحلتك</Text>

        {/* Arrow hint */}
        <View style={styles.scArrowWrap}>
          <Ionicons name="arrow-back" size={13} color="rgba(26,41,128,0.35)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── No-credits body (State B) ────────────────────────────────────────────────

function NoCreditsBody({ allLevels, router, onBook }: { allLevels: Level[]; router: Router; onBook: () => void }) {
  return (
    <>
      {/* Encouragement card */}
      <View style={styles.noCredCard}>
        <View style={styles.noCredIconWrap}>
          <Text style={{ fontSize: 44 }}>🌟</Text>
        </View>
        <Text style={styles.noCredTitle}>رحلتك تبدأ هنا!</Text>
        <Text style={styles.noCredSub}>
          اشترك الآن واحصل على حصصك للبدء في تعلّم الإنجليزية مع معلمين
          متخصصين. تواصل معنا على واتساب لمعرفة الباقات المتاحة.
        </Text>

        <TouchableOpacity
          style={styles.waBtn}
          onPress={() => Linking.openURL(WHATSAPP)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.waBtnTxt}>تواصل معنا الآن</Text>
        </TouchableOpacity>
      </View>

      {/* Premium shortcut cards */}
      <Text style={styles.sectionLabel}>اكتشف المزيد</Text>
      <View style={styles.shortcutsRow}>
        <AboutCard onPress={() => router.push('/about' as any)} />
        <HowCard   onPress={() => router.push('/how-to-use' as any)} />
      </View>

      {/* Evaluation session booking */}
      <TouchableOpacity
        style={styles.evalBtn}
        onPress={onBook}
        activeOpacity={0.85}
      >
        <View style={styles.evalBtnIcon}>
          <Ionicons name="calendar-outline" size={22} color={C.yellow} />
        </View>
        <Text style={styles.evalBtnTitle}>احجز حصة تقييمية</Text>
      </TouchableOpacity>

      {/* Roadmap preview (read-only) */}
      <Text style={[styles.sectionLabel, { marginTop: 4 }]}>🗺️ خريطة المسار</Text>
      {allLevels.map((level) => (
        <View key={level.id} style={styles.levelCard}>
          <LevelRow level={level} />
        </View>
      ))}

      <View style={{ height: 20 }} />
    </>
  );
}

// ─── Credits body (State C) ───────────────────────────────────────────────────

function CreditsBody({
  credits,
  myUnits,
  router,
  onBook,
  onBookSession,
}: {
  credits:       number;
  myUnits:       Unit[];
  router:        ReturnType<typeof useRouter>;
  onBook:        () => void;
  onBookSession: () => void;
}) {
  const doneCount = myUnits.filter((u) => u.enrollment?.status === 'completed').length;

  return (
    <>
      {/* Credits widget */}
      <View style={styles.credWidget}>
        <View style={styles.credLeft}>
          <Text style={styles.credCount}>{credits}</Text>
          <Text style={styles.credLabel}>رصيد الحصص المتبقية</Text>
        </View>
        <View style={styles.credDivider} />
        <View style={styles.credRight}>
          <Ionicons name="school-outline" size={18} color={C.navy} />
          <Text style={styles.credDone}>مكتمل منها {doneCount}</Text>
        </View>
      </View>

      {/* Book individual session */}
      <TouchableOpacity
        style={styles.bookSessionBtn}
        onPress={onBookSession}
        activeOpacity={0.85}
      >
        <View style={styles.bookSessionIcon}>
          <Ionicons name="person-outline" size={22} color={C.white} />
        </View>
        <Text style={styles.bookSessionTxt}>احجز حصة فردية</Text>
        <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      {/* Book group session — coming soon */}
      <TouchableOpacity
        style={[styles.bookSessionBtn, styles.bookGroupBtn]}
        onPress={() => appAlert('قريباً 🚧', 'هذه الميزة غير متاحة حالياً، ترقّب إطلاقها قريباً!')}
        activeOpacity={0.85}
      >
        <View style={[styles.bookSessionIcon, styles.bookGroupIcon]}>
          <Ionicons name="people-outline" size={22} color={C.navy} />
        </View>
        <Text style={[styles.bookSessionTxt, styles.bookGroupTxt]}>احجز حصة جماعية</Text>
        <Ionicons name="chevron-back" size={18} color="rgba(26,41,128,0.45)" />
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LevelsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const openSidebar = useSidebarStore((s) => s.open);
  const { headerHeight, onHeaderLayout, onScroll, headerStyle } = useAnimatedHeader();

  const [bookingVisible,        setBookingVisible]        = useState(false);
  const [sessionBookingVisible, setSessionBookingVisible] = useState(false);
  const [mascotVisible,         setMascotVisible]         = useState(false);
  const mascotLaunchedRef = useRef(false);

  const { data: profile, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn:  profileApi.get,
  });

  const { data: myUnits,   isLoading: loadingUnits,  refetch, isFetching } = useQuery({
    queryKey: ['my-units'],
    queryFn:  levelsApi.myUnits,
  });

  const { data: allLevels, isLoading: loadingLevels } = useQuery({
    queryKey: ['all-levels'],
    queryFn:  levelsApi.listLevels,
  });

  // Overall progress — single source of truth (same as التقدم & حسابي screens)
  const { data: progressSummary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn:  profileApi.progress,
    staleTime: 30_000,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ['messages-unread'],
    queryFn:  studentMessagesApi.unreadCount,
    refetchInterval: 60_000,
  });

  // Never block the entire screen — header renders immediately.
  // Body shows an inline spinner until all queries resolve.
  const isBodyLoading = loadingProfile || loadingUnits || loadingLevels;

  const credits    = profile?.lesson_credits ?? 0;
  const units      = myUnits   ?? [];
  const levels     = allLevels ?? [];
  const hasCredits = credits > 0;

  // Show mascot greeting once per session when subscribed student's data loads
  useEffect(() => {
    if (hasCredits && !isBodyLoading && !mascotLaunchedRef.current) {
      mascotLaunchedRef.current = true;
      setMascotVisible(true);
    }
  }, [hasCredits, isBodyLoading]);

  // Progress stats (only relevant for State C) — lesson-based, shared source
  const completedLessons = progressSummary?.completed_lessons ?? 0;
  const totalLessons     = progressSummary?.total_lessons ?? 0;
  const pct              = progressSummary?.overall_pct ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Yellow curved header ───────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}
        onLayout={onHeaderLayout}
      >
        {/* Decorative circles */}
        <View style={[styles.dot, { width: 90, height: 90, top: -24, left: -24 }]} />
        <View style={[styles.dot, { width: 44, height: 44, bottom: 12, right: 16 }]} />

        {/* Row 1: bell + hamburger */}
        <View style={styles.hTopRow}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/messages')}>
            <Ionicons name="notifications" size={22} color={C.navy} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeTxt}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={openSidebar}>
            <Ionicons name="menu" size={22} color={C.navy} />
          </TouchableOpacity>
        </View>

        {/* Row 2: title + credit counter pill */}
        <View style={styles.hTitleRow}>
          {/* Credit counter — only visible when subscribed */}
          {!isBodyLoading && hasCredits ? (
            <View style={styles.creditPill}>
              <Ionicons name="bookmark" size={13} color={C.navy} />
              <Text style={styles.creditPillNum}>{credits}</Text>
              <Text style={styles.creditPillLbl}>حصة</Text>
            </View>
          ) : <View style={{ width: 72 }} />}
          <Text style={styles.headerTitle}>الرئيسية</Text>
        </View>

        {!isBodyLoading && (hasCredits ? (
          /* State C — show progress stats (only when units enrolled) */
          units.length > 0 ? (
            <>
              <View style={styles.hMidRow}>
                <Text style={styles.progressSub}>{completedLessons}/{totalLessons} درس · {pct}%</Text>
                <Text style={styles.progressLbl}>التقدم الكلي</Text>
              </View>
              <View style={styles.hProgressTrack}>
                <View style={[styles.hProgressFill, { width: `${pct}%` as any }]} />
              </View>
            </>
          ) : null
        ) : (
          /* State B — show friendly prompt */
          <Text style={styles.noCredHeader}>اشترك وابدأ رحلتك الآن 🚀</Text>
        ))}
      </Animated.View>

      {/* ── Scrollable content ─────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => { refetch(); refetchProfile(); }}
            tintColor={C.yellow}
            colors={[C.yellow]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isBodyLoading ? (
          <View style={styles.bodySpinner}>
            <ActivityIndicator size="large" color={C.yellow} />
          </View>
        ) : hasCredits ? (
          <CreditsBody
            credits={credits}
            myUnits={units}
            router={router}
            onBook={() => setBookingVisible(true)}
            onBookSession={() => setSessionBookingVisible(true)}
          />
        ) : (
          <NoCreditsBody allLevels={levels} router={router} onBook={() => setBookingVisible(true)} />
        )}
      </ScrollView>

      {/* Mascot greeting — mounted once, unmounted after animation via onHide */}
      {mascotVisible && <MascotGreeting onHide={() => setMascotVisible(false)} />}

      <EvalBookingModal
        visible={bookingVisible}
        onClose={() => setBookingVisible(false)}
      />
      <SessionBookingModal
        visible={sessionBookingVisible}
        credits={credits}
        onClose={() => setSessionBookingVisible(false)}
        onBooked={() => { refetch(); refetchProfile(); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Body loading (inline — header always visible) ───────────────────────────
  bodySpinner: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: C.yellow,
    paddingHorizontal: 22,
    paddingBottom: 16,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    ...shadow.amber,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.15,
  },
  hTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.42)',
    justifyContent: 'center', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -4, right: -4,
    minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: C.yellow,
  },
  bellBadgeTxt: { fontSize: 9, fontWeight: '900', color: C.white },
  hTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: C.navy },
  // Credit counter pill — always visible in header when subscribed
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  creditPillNum: { fontSize: 16, fontWeight: '900', color: C.yellow, lineHeight: 20 },
  creditPillLbl: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  // State C — progress row
  hMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLbl: { fontSize: 12, fontWeight: '800', color: C.navy },
  progressSub: { fontSize: 11, fontWeight: '600', color: C.navyMid },
  hProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hProgressFill: {
    height: 6,
    backgroundColor: C.navy,
    borderRadius: 3,
  },

  // State B — header text
  noCredHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: C.navyMid,
    textAlign: 'right',
    marginBottom: 4,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll:       { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.navy,
    textAlign: 'right',
    marginBottom: 10,
    marginTop: 4,
  },

  // ── Premium shortcut cards (State B) ─────────────────────────────────────────
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scWrapper: {
    flex: 1,
    borderRadius: 20,
    // Shadow applied on the wrapper so it shows under the gradient
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  scCard: {
    borderRadius: 20,
    padding: 16,
    paddingBottom: 18,
    minHeight: 148,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  // Decorative circles
  scCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
  },
  scCircleDark: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#000',
  },
  // Icon pill — navy card
  scIconPillNavy: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  // Icon pill — gold card
  scIconPillGold: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(26,41,128,0.10)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,41,128,0.10)',
  },
  scLabelLight: {
    fontSize: 13, fontWeight: '900', color: C.white,
    textAlign: 'right', marginBottom: 4,
  },
  scLabelDark: {
    fontSize: 13, fontWeight: '900', color: C.navy,
    textAlign: 'right', marginBottom: 4,
  },
  scSubLight: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'right',
  },
  scSubDark: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(26,41,128,0.55)',
    textAlign: 'right',
  },
  scArrowWrap: {
    position: 'absolute',
    bottom: 14, left: 14,
  },

  // ── Credits widget (State C) ──────────────────────────────────────────────────
  credWidget: {
    backgroundColor: C.white,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 18,
    gap: 12,
    ...shadow.md,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  credLeft: { alignItems: 'center' },
  credCount: { fontSize: 28, fontWeight: '900', color: C.amber, lineHeight: 30 },
  credLabel: { fontSize: 9, fontWeight: '700', color: C.navy, marginTop: 2, textAlign: 'center' },
  credDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
  },
  credRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  credDone: { fontSize: 13, fontWeight: '700', color: C.navy },

  // ── Book session standalone button ────────────────────────────────────────────
  bookSessionBtn: {
    backgroundColor: C.navy,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 14,
    gap: 12,
    ...shadow.navy,
  },
  bookSessionIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  bookSessionTxt: {
    flex: 1,
    fontSize: 16, fontWeight: '900', color: C.white, textAlign: 'right',
  },
  bookGroupBtn: {
    backgroundColor: C.yellow,
    ...shadow.amber,
  },
  bookGroupIcon: {
    backgroundColor: 'rgba(26,41,128,0.10)',
  },
  bookGroupTxt: {
    color: C.navy,
  },

  // ── No-credits card (State B) ─────────────────────────────────────────────────
  noCredCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    ...shadow.md,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  noCredIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  noCredTitle: { fontSize: 18, fontWeight: '900', color: C.navy, marginBottom: 10 },
  noCredSub:   {
    fontSize: 13,
    color: C.grayMid,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  waBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // ── Unit card ────────────────────────────────────────────────────────────────
  unitCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow.md,
  },
  unitCardLocked: { opacity: 0.52 },
  unitAccent:       { width: 5, alignSelf: 'stretch', backgroundColor: C.yellow },
  unitAccentLocked: { backgroundColor: '#E5E7EB' },
  unitBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  unitTop:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  unitName: { fontSize: 15, fontWeight: '800', color: C.navy, flex: 1, marginRight: 8, textAlign: 'right' },
  unitMeta: { fontSize: 12, color: C.gray, marginBottom: 8, textAlign: 'right' },
  textMuted: { color: C.gray },
  doneBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.success,
    justifyContent: 'center', alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: C.yellow + '25',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.yellow,
  },
  activeBadgeTxt: { fontSize: 10, fontWeight: '800', color: C.amber },
  progressBg:   { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3 },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: C.yellow },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    marginBottom: 16,
    ...shadow.sm,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.navy, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: C.gray, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  // ── Evaluation booking button ─────────────────────────────────────────────────
  evalBtn: {
    backgroundColor: C.navy,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 14,
    gap: 12,
    ...shadow.md,
  },
  evalBtnIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  evalBtnTitle: {
    flex: 1,
    fontSize: 15, fontWeight: '900', color: C.white, textAlign: 'right',
  },

  // ── Roadmap ───────────────────────────────────────────────────────────────────
  levelCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 8,
    ...shadow.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  levelBadge: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  levelBadgeTxt: { fontSize: 13, fontWeight: '900', color: C.white },
  levelName:     { fontSize: 14, fontWeight: '800', color: C.navy, textAlign: 'right' },
  levelMeta:     { fontSize: 11, color: C.gray, marginTop: 2, textAlign: 'right' },
  levelDot: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  levelDotTxt: { fontSize: 14, fontWeight: '900' },
});

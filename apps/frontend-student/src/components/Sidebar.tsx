/**
 * Sidebar — Left-side sliding drawer.
 * Triggered by the hamburger menu in each tab header.
 * Brand theme: Yellow header / Navy text / Cream background.
 */
import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Modal, Dimensions, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore }    from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAvatarStore }  from '@/stores/avatarStore';
import { C, shadow }       from '@/theme';
import client              from '@/api/client';
import type { StudentProgress, Unit } from '@/api/levels';

// Same preset avatars as profile screen (static requires)
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

const SIDEBAR_W = Math.min(Dimensions.get('window').width * 0.82, 320);

// ─── Sidebar item ─────────────────────────────────────────────────────────────

interface ItemProps {
  icon:    keyof typeof Ionicons.glyphMap;
  iconBg:  string;
  iconColor: string;
  label:   string;
  badge?:  string;
  onPress: () => void;
}

function SidebarItem({ icon, iconBg, iconColor, label, badge, onPress }: ItemProps) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-back" size={15} color={C.gray} style={{ marginLeft: -4 }} />
    </TouchableOpacity>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOpen, close }     = useSidebarStore();
  const user                  = useAuthStore((s) => s.user);
  const { selectedAvatar }    = useAvatarStore();

  // Animation — starts off the LEFT edge, springs to 0
  const slideAnim   = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_W,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => close());
  };

  // Live profile from DB (shared cache with profile tab — no extra network request)
  const { data: profile } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn:  () => client.get<{ profile: Profile }>('/student/profile').then((r) => r.data.profile ?? null),
    enabled:  isOpen,
  });

  // Progress data
  const { data: myUnits }  = useQuery<Unit[]>({
    queryKey: ['my-units'],
    queryFn:  () => client.get<{ data: Unit[] }>('/student/my-units').then((r) => r.data.data),
    enabled:  isOpen,
  });
  const { data: progress } = useQuery<StudentProgress[]>({
    queryKey: ['progress'],
    queryFn:  () => client.get<{ progress: StudentProgress[] }>('/student/progress').then((r) => r.data.progress ?? []),
    enabled:  isOpen,
  });

  const totalLessons = myUnits?.reduce((sum, u) => sum + u.lesson_count, 0) ?? 0;
  const doneLessons  = (progress ?? []).filter((p) => p.lesson_completed).length;
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  // Prefer DB values; fall back to what was stored at login
  const displayName = profile?.name ?? user?.name ?? 'الطالب';
  const initial     = displayName.trim().charAt(0).toUpperCase() || '?';

  const navigate = (path: string) => {
    handleClose();
    // Small delay so sidebar closes before navigation
    setTimeout(() => router.push(path as any), 250);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Dark overlay — absoluteFill, behind the panel */}
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} activeOpacity={1} />
        </Animated.View>

        {/* Sidebar panel slides in from the LEFT */}
        <Animated.View
          style={[
            styles.panel,
            { paddingBottom: insets.bottom + 16, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* ── User header ──────────────────────────────────────────────── */}
          <View style={[styles.panelHeader, { paddingTop: insets.top + 18 }]}>
            {/* Decorative dots — mirrored for left-side panel */}
            <View style={[styles.dot, { width: 80, height: 80, top: -20, right: -20 }]} />
            <View style={[styles.dot, { width: 44, height: 44, bottom: 12, left: 10 }]} />

            {/* Close button — aligned to right edge (toward content area) */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={18} color={C.navy} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatar}>
              {selectedAvatar ? (
                <Image
                  source={AVATARS.find((a) => a.id === selectedAvatar)!.src}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
            </View>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          </View>

          {/* ── Items ────────────────────────────────────────────────────── */}
          <ScrollView
            contentContainerStyle={styles.itemsContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Mini overall progress card ───────────────────────────── */}
            <TouchableOpacity
              style={styles.progressCard}
              onPress={() => navigate('/progress')}
              activeOpacity={0.85}
            >
              <Ionicons name="trophy" size={72} color={C.amber} style={styles.trophyBg} />
              <View style={styles.pcardTop}>
                <Text style={styles.pcardPct}>{pct}%</Text>
                <Text style={styles.pcardLbl}>التقدم الكلي</Text>
              </View>
              <View style={styles.pcardTrack}>
                <View style={[styles.pcardFill, { width: `${pct}%` as any }]} />
              </View>
            </TouchableOpacity>

            <SidebarItem
              icon="trending-up"
              iconBg="#EFF6FF"
              iconColor={C.info}
              label="التقدم"
              onPress={() => navigate('/progress')}
            />
            <SidebarItem
              icon="settings"
              iconBg={C.cream}
              iconColor={C.amber}
              label="الإعدادات"
              onPress={() => navigate('/settings')}
            />
            <SidebarItem
              icon="information-circle"
              iconBg="#F0FDF4"
              iconColor={C.success}
              label="عنا"
              onPress={() => navigate('/about')}
            />
            <SidebarItem
              icon="book"
              iconBg="#FAF5FF"
              iconColor="#7C3AED"
              label="طريقة الاستخدام"
              onPress={() => navigate('/how-to-use')}
            />

            {/* Version */}
            <Text style={styles.version}>iFluent Student v1.0</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  // Panel
  panel: {
    width: SIDEBAR_W,
    backgroundColor: C.cream,
    ...shadow.navy,
  },

  // Panel header — right corner curves toward content area
  panelHeader: {
    backgroundColor: C.yellow,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'flex-end',
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.white,
    opacity: 0.18,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 10,
    padding: 7,
    marginBottom: 12,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.navy,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImg:     { width: '100%', height: '100%', borderRadius: 30, resizeMode: 'cover' },
  avatarInitial: { fontSize: 24, fontWeight: '900', color: C.yellow },
  userName: { fontSize: 17, fontWeight: '900', color: C.navy, textAlign: 'right' },

  // Items
  itemsContainer: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 8,
    ...shadow.sm,
  },
  itemIcon: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy, textAlign: 'right' },
  badge: {
    backgroundColor: C.navy,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeTxt: { fontSize: 12, fontWeight: '900', color: C.yellow },

  // ── Mini progress card ───────────────────────────────────────────────────
  progressCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#FDE68A',
    ...shadow.sm,
  },
  trophyBg: {
    position: 'absolute',
    right: -10, bottom: -16,
    opacity: 0.10,
  },
  pcardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  pcardPct: { fontSize: 28, fontWeight: '900', color: C.navy },
  pcardLbl: { fontSize: 12, fontWeight: '800', color: C.navyMid },
  pcardTrack: {
    height: 8, backgroundColor: 'rgba(26,41,128,0.10)',
    borderRadius: 4, overflow: 'hidden',
  },
  pcardFill: { height: 8, backgroundColor: C.amber, borderRadius: 4 },

  version: {
    fontSize: 11, color: C.gray,
    textAlign: 'center', marginTop: 20,
  },
});

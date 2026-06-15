/**
 * Lessons directory — teachers browse levels (A1, A2, B1, …), expand a level to
 * see its lesson numbers, and tap a number to open that lesson in Nearpod. They
 * launch it there to get the session PIN, then return and enter it in the app.
 *
 * Replaces the old "open the session's Nearpod link directly" flow, which gave
 * teachers admin-level access to a lesson's content.
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NEARPOD_LESSONS } from '@/data/nearpodLessons';
import { C, shadow } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LessonsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<string | null>(NEARPOD_LESSONS[0]?.code ?? null);

  const toggle = (code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === code ? null : code));
  };

  const openLesson = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open the lesson link. Please try again.'),
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <LinearGradient
        colors={[C.sky, C.skyDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>Lessons</Text>
          <Text style={styles.headerSub}>Open a lesson in Nearpod to get its code</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {NEARPOD_LESSONS.map((level) => {
          const expanded = open === level.code;
          return (
            <View key={level.code} style={styles.levelCard}>
              {/* Level header (accordion toggle) */}
              <TouchableOpacity
                style={styles.levelHeader}
                onPress={() => toggle(level.code)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={expanded ? 'chevron-down' : 'chevron-back'}
                  size={18}
                  color={C.skyDark}
                />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.levelTitle}>Level {level.code}</Text>
                  <Text style={styles.levelCount}>{level.lessons.length} lessons</Text>
                </View>
              </TouchableOpacity>

              {/* Lesson number grid */}
              {expanded && (
                <View style={styles.grid}>
                  {level.lessons.map((url, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.numBtn}
                      onPress={() => openLesson(url)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.numTxt}>{i + 1}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.footer}>
          Open the lesson in Nearpod, launch it in Live Participation mode, copy the
          code, then enter it back in the app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 40 },

  levelCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadow.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  levelTitle: { fontSize: 16, fontWeight: '800', color: C.grayDark },
  levelCount: { fontSize: 12, color: C.grayMid, marginTop: 2 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  numBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  numTxt: { fontSize: 16, fontWeight: '800', color: C.skyDark },

  footer: {
    fontSize: 12, color: C.grayMid, textAlign: 'center',
    marginTop: 8, lineHeight: 20, paddingHorizontal: 12,
  },
});

/**
 * Main tab layout — Navy/Yellow brand tab bar.
 * Tabs: Levels | Sessions | Notebook | Profile
 *
 * The tab bar is wrapped in an Animated.View driven by `tabBarScrollAnim`
 * so it hides in sync with each screen's animated header on scroll.
 */
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Platform, StyleSheet } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/stores/authStore';
import { C } from '@/theme';
import { tabBarScrollAnim } from '@/animations';

const TAB_BAR_STYLE = StyleSheet.create({
  bar: {
    backgroundColor: C.navy,
    borderTopWidth:  0,
    height:          Platform.OS === 'ios' ? 82 : 62,
    paddingBottom:   Platform.OS === 'ios' ? 22 : 6,
    paddingTop:      6,
    shadowColor:     C.navy,
    shadowOpacity:   0.35,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: -4 },
    elevation:       14,
  },
});

export default function TabsLayout() {
  const { token, hydrated } = useAuthStore();

  if (hydrated && !token) {
    return <Redirect href="/(auth)/phone" />;
  }

  return (
    <Tabs
      tabBar={(props) => (
        <Animated.View style={{ transform: [{ translateY: tabBarScrollAnim }] }}>
          <BottomTabBar {...props} />
        </Animated.View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.yellow,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
        tabBarStyle:      TAB_BAR_STYLE.bar,
        tabBarLabelStyle: {
          fontSize:      10,
          fontWeight:    '700',
          letterSpacing: 0.2,
          marginTop:     -2,
        },
      }}
    >
      <Tabs.Screen
        name="levels"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'حصصي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="videocam" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notebook"
        options={{
          title: 'ملاحظاتي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="journal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'ملفي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

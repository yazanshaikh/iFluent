/**
 * Blocks the app with a maintenance screen when the backend flag is on. Polls
 * /maintenance so it recovers automatically once maintenance is turned off.
 *
 * Only an EXPLICIT maintenance=true blocks — loading / network errors do not
 * (those aren't maintenance). The teacher app is English, so it shows a fixed
 * English message rather than the (Arabic) admin message.
 */
import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { maintenanceApi } from '@/api/maintenance';
import { C } from '@/theme';

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  const { data, refetch, isRefetching } = useQuery({
    queryKey:        ['maintenance'],
    queryFn:         maintenanceApi.status,
    refetchInterval: 30_000,
    retry:           false,
    staleTime:       0,
  });

  if (!data?.maintenance) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="construct" size={30} color={C.sky} />
      </View>
      <Text style={styles.title}>Under Maintenance</Text>
      <Text style={styles.message}>
        We're doing some quick maintenance to improve the app. We'll be back shortly.
      </Text>

      <TouchableOpacity style={styles.btn} onPress={() => refetch()} activeOpacity={0.85}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.btnTxt}>{isRefetching ? 'Checking…' : 'Try again'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.inputBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title:   { fontSize: 22, fontWeight: '900', color: C.skyDark },
  message: {
    fontSize: 15, color: C.grayMid, textAlign: 'center',
    lineHeight: 24, marginTop: 6, marginBottom: 26,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.sky, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

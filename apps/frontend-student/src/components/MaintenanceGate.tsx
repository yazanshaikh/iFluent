/**
 * Blocks the whole app with a friendly maintenance screen when the backend flag
 * is on. Polls /maintenance so the app recovers automatically once maintenance
 * is turned off (and kicks in within the interval when it's turned on).
 *
 * Only an EXPLICIT maintenance=true blocks. Loading or network errors do NOT
 * block (those aren't maintenance — the app's own error handling applies).
 */
import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
    refetchInterval: 30_000,    // recover automatically when it's turned off
    retry:           false,     // network errors must NOT trigger the screen
    staleTime:       0,
  });

  if (!data?.maintenance) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image
        source={require('../../assets/mascot.png')}
        style={styles.mascot}
        resizeMode="contain"
      />
      <View style={styles.iconWrap}>
        <Ionicons name="construct" size={26} color={C.amber} />
      </View>
      <Text style={styles.title}>نقوم بالصيانة</Text>
      <Text style={styles.message}>{data.message}</Text>

      <TouchableOpacity style={styles.btn} onPress={() => refetch()} activeOpacity={0.85}>
        <Ionicons name="refresh" size={18} color={C.white} />
        <Text style={styles.btnTxt}>{isRefetching ? 'جارٍ التحقق…' : 'إعادة المحاولة'}</Text>
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
    gap: 6,
  },
  mascot: { width: 160, height: 160, marginBottom: 4 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title:   { fontSize: 22, fontWeight: '900', color: C.navy },
  message: {
    fontSize: 15, color: C.grayMid, textAlign: 'center',
    lineHeight: 24, marginTop: 4, marginBottom: 24,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.navy, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  btnTxt: { color: C.white, fontSize: 15, fontWeight: '800' },
});

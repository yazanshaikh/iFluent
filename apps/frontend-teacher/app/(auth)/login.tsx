/**
 * Teacher Login Screen
 * Email + Password authentication (accounts created by Super Admin only)
 */
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { C, shadow } from '@/theme';
import { appAlert } from '@/lib/alert';

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      appAlert('Notice', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email.trim(), password);
      await setAuth(token, user);
      router.replace('/(tabs)/requests');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid credentials. Check your email and password.';
      appAlert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient Header ── */}
        <LinearGradient
          colors={[C.sky, C.skyDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 40 }]}
        >
          <View style={styles.logoWrap}>
            <Ionicons name="school" size={48} color="#fff" />
          </View>
          <Text style={styles.brand}>iFluent</Text>
          <Text style={styles.brandSub}>Teachers Portal</Text>

          {/* Decorative circles */}
          <View style={[styles.blob, { top: -30, right: -30, width: 120, height: 120 }]} pointerEvents="none" />
          <View style={[styles.blob, { bottom: -20, left: -20, width: 80, height: 80 }]} pointerEvents="none" />
        </LinearGradient>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In 👋</Text>
          <Text style={styles.cardSub}>Enter your account details to continue</Text>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={C.grayMid} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="teacher@ifluent.io"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor={C.gray}
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.grayMid} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              autoComplete="password"
              placeholderTextColor={C.gray}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.grayMid} />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.sky, C.skyDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.btnTxt}>Sign In</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.note}>
            Teacher accounts are created exclusively by the administration
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: 48,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  logoWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  brand:    { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  brandSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 28,
    padding: 28,
    ...shadow.md,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.skyDark, textAlign: 'right', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.gray, textAlign: 'right', marginBottom: 24 },

  label: { fontSize: 13, fontWeight: '700', color: C.grayDark, textAlign: 'right', marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: C.border,
    borderRadius: 16, backgroundColor: C.inputBg,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, paddingVertical: 13,
    fontSize: 15, color: C.grayDark,
    textAlign: 'left',
  },
  eyeBtn: { padding: 6 },

  btn: { marginTop: 28, borderRadius: 16, overflow: 'hidden' },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  note: {
    fontSize: 11, color: C.gray,
    textAlign: 'center', marginTop: 16, lineHeight: 18,
  },
});

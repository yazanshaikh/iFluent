/**
 * Admin Login — super_admin only.
 * Uses the existing CRM auth endpoint POST /crm/auth/login.
 * Rejects any role other than super_admin.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import { Spacing } from '@/src/constants/layout';
import { FontSize, FontWeight } from '@/src/constants/typography';
import { adminLogin } from '@/src/api/admin';

export default function AdminLoginScreen() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim())    { setError('أدخل البريد الإلكتروني'); return; }
    if (!password.trim()) { setError('أدخل كلمة المرور');       return; }

    setLoading(true);
    try {
      await adminLogin(email.trim(), password);
      router.replace('/(admin)/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <View style={styles.card}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>⚙️</Text>
          </View>

          <Text style={styles.title}>لوحة التحكم</Text>
          <Text style={styles.sub}>تسجيل دخول المدير</Text>

          {/* Email */}
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={[styles.input, !!error && styles.inputErr]}
            placeholder="admin@ifluent.io"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={v => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
            returnKeyType="next"
            editable={!loading}
          />

          {/* Password */}
          <Text style={[styles.label, { marginTop: Spacing.md }]}>كلمة المرور</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput, !!error && styles.inputErr]}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              secureTextEntry={!showPass}
              textAlign="right"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass(s => !s)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errBox}>
              <Text style={styles.errTxt}>⚠️ {error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.65 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.btnTxt}>
              {loading ? '⏳ جارٍ التحقق...' : 'دخول ←'}
            </Text>
          </TouchableOpacity>

          {/* Back to site */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/(landing)')}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkTxt}>← العودة إلى الموقع</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const FONT = Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }) ?? {};
const RTL  = { writingDirection: 'rtl' as any };

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#F0F4FF',
  },
  scroll: {
    flexGrow:       1,
    justifyContent: 'center',
    alignItems:     'center',
    padding:        Spacing.xl,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius:    28,
    width:           '100%',
    maxWidth:        420,
    padding:         Spacing['2xl'],
    alignItems:      'stretch',
    ...Platform.select({
      web: {
        boxShadow: '0 16px 60px rgba(30,58,138,0.14), 0 0 0 1px rgba(99,102,241,0.08)',
      } as any,
      default: {
        shadowColor:   Colors.navy,
        shadowOffset:  { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius:  32,
        elevation:     16,
      },
    }),
  },

  logoWrap: {
    alignSelf:       'center',
    width:           72,
    height:          72,
    borderRadius:    20,
    backgroundColor: Colors.yellowLight,
    borderWidth:     2,
    borderColor:     Colors.borderYellow,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.lg,
  },
  logoText: { fontSize: 36 },

  title: {
    color:        Colors.navy,
    fontSize:     FontSize['2xl'],
    fontWeight:   FontWeight.extrabold,
    textAlign:    'center',
    marginBottom: 4,
    ...FONT, ...RTL,
  },
  sub: {
    color:        Colors.textSecondary,
    fontSize:     FontSize.sm,
    textAlign:    'center',
    marginBottom: Spacing.xl,
    ...FONT, ...RTL,
  },

  label: {
    color:        Colors.navy,
    fontSize:     FontSize.sm,
    fontWeight:   FontWeight.semibold,
    textAlign:    'right',
    marginBottom: Spacing.xs,
    ...FONT, ...RTL,
  },

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
  inputErr: { borderColor: '#EF4444' },

  passRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  passInput: { flex: 1 },
  eyeBtn:   { padding: Spacing.xs },
  eyeIcon:  { fontSize: FontSize.lg },

  errBox: {
    marginTop:         Spacing.md,
    backgroundColor:   '#FEF2F2',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       '#FCA5A5',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  errTxt: {
    color:     '#DC2626',
    fontSize:  FontSize.sm,
    textAlign: 'right',
    ...FONT, ...RTL,
  },

  btn: {
    marginTop:         Spacing.xl,
    backgroundColor:   Colors.yellow,
    paddingVertical:   Spacing.md + 2,
    borderRadius:      50,
    borderBottomWidth: 4,
    borderBottomColor: Colors.yellowDeep,
    alignItems:        'center',
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(255,193,7,0.50)' } as any,
      default: {
        shadowColor:   Colors.yellow,
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius:  14,
        elevation:     10,
      },
    }),
  },
  btnTxt: {
    color:      Colors.navy,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.extrabold,
    ...FONT, ...RTL,
  },

  backLink: {
    marginTop:  Spacing.lg,
    alignItems: 'center',
  },
  backLinkTxt: {
    color:    Colors.textMuted,
    fontSize: FontSize.sm,
    ...FONT,
  },
});

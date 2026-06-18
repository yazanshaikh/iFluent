/**
 * Admin Dashboard — Edit landing page settings.
 * Requires super_admin token in storage.
 * Loads from GET /admin/settings, saves via PATCH /admin/settings.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@ifluent/shared';
import { Spacing, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { adminLogout, adminMe, getAdminSettings, patchAdminSettings } from '@/src/api/admin';
import type { AdminSettings, SettingsPatch } from '@/src/api/admin';

// ── Field definitions (what the admin sees) ───────────────────────────────────

interface FieldDef {
  key:         string;
  label:       string;
  placeholder: string;
  multiline?:  boolean;
  keyboardType?: 'default' | 'email-address' | 'url' | 'phone-pad';
}

const SECTIONS: { title: string; emoji: string; fields: FieldDef[] }[] = [
  {
    title: 'عام',
    emoji: '🏢',
    fields: [
      { key: 'platform_name', label: 'اسم المنصة',       placeholder: 'iFluent' },
    ],
  },
  {
    title: 'الصفحة الرئيسية',
    emoji: '🏠',
    fields: [
      { key: 'hero_title',    label: 'العنوان الرئيسي',  placeholder: 'تعلّم الإنجليزية...', multiline: true },
      { key: 'hero_subtitle', label: 'العنوان الفرعي',   placeholder: 'حصص خاصة...', multiline: true },
      { key: 'hero_cta_text', label: 'نص زر الحجز',      placeholder: 'احجز حصة تقييم مجانية' },
    ],
  },
  {
    title: 'التواصل',
    emoji: '📞',
    fields: [
      { key: 'contact_phone',    label: 'رقم الهاتف',         placeholder: '+962 7 0000 0000', keyboardType: 'phone-pad' },
      { key: 'contact_whatsapp', label: 'واتساب',              placeholder: '+962 7 0000 0000', keyboardType: 'phone-pad' },
      { key: 'contact_email',    label: 'البريد الإلكتروني',  placeholder: 'info@ifluent.io',  keyboardType: 'email-address' },
    ],
  },
  {
    title: 'حسابات التواصل الاجتماعي',
    emoji: '📱',
    fields: [
      { key: 'social_instagram', label: 'إنستغرام', placeholder: 'https://instagram.com/...', keyboardType: 'url' },
      { key: 'social_facebook',  label: 'فيسبوك',   placeholder: 'https://facebook.com/...', keyboardType: 'url' },
      { key: 'social_snapchat',  label: 'سناب شات', placeholder: 'https://snapchat.com/add/...', keyboardType: 'url' },
      { key: 'social_tiktok',    label: 'تيك توك',  placeholder: 'https://tiktok.com/...',   keyboardType: 'url' },
    ],
  },
  {
    title: 'روابط التطبيق',
    emoji: '📲',
    fields: [
      { key: 'app_store_url',    label: 'رابط App Store',   placeholder: 'https://apps.apple.com/...', keyboardType: 'url' },
      { key: 'google_play_url',  label: 'رابط Google Play', placeholder: 'https://play.google.com/...', keyboardType: 'url' },
      { key: 'desktop_mac_url',     label: 'رابط تحميل نسخة Mac',     placeholder: 'https://.../iFluent.dmg', keyboardType: 'url' },
      { key: 'desktop_windows_url', label: 'رابط تحميل نسخة Windows', placeholder: 'https://.../iFluent-Setup.exe', keyboardType: 'url' },
    ],
  },
  {
    title: 'الفوتر',
    emoji: '📄',
    fields: [
      { key: 'footer_text', label: 'نص الفوتر', placeholder: '© 2026 iFluent. جميع الحقوق محفوظة.', multiline: true },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();

  const [adminName,  setAdminName]  = useState('');
  const [rawSettings, setRawSettings] = useState<AdminSettings>({});
  // Local editable flat map: key → current text value
  const [draft,      setDraft]      = useState<Record<string, string>>({});
  const [pageState,  setPageState]  = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  // ── Load on mount ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setPageState('loading');
    try {
      // Verify token is still valid
      const me = await adminMe();
      if (me.role !== 'super_admin') {
        router.replace('/(admin)/login');
        return;
      }
      setAdminName(me.name);

      const grouped = await getAdminSettings();
      setRawSettings(grouped);

      // Flatten grouped → { key: value }
      const flat: Record<string, string> = {};
      Object.values(grouped).forEach(section =>
        Object.entries(section).forEach(([k, v]) => {
          flat[k] = (v.value as string) ?? '';
        })
      );
      setDraft(flat);
      setPageState('ready');
    } catch {
      // Token expired or network error → go to login
      router.replace('/(admin)/login');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Only send keys that exist in our SECTIONS (text fields)
      const patch: SettingsPatch = {};
      SECTIONS.forEach(sec =>
        sec.fields.forEach(f => {
          patch[f.key] = draft[f.key] ?? null;
        })
      );
      await patchAdminSettings(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert('فشل الحفظ: ' + (err?.message ?? 'خطأ غير معروف'));
      } else {
        Alert.alert('فشل الحفظ', err?.message ?? 'خطأ غير معروف');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await adminLogout();
    router.replace('/(admin)/login');
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={Colors.yellow} />
        <Text style={styles.loadingTxt}>جارٍ التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Fixed header ── */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>⚙️ لوحة التحكم</Text>
            <Text style={styles.headerSub}>مرحباً، {adminName}</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, (saving || saved) && { opacity: saved ? 1 : 0.7 }]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={styles.saveBtnTxt}>
                {saving ? '⏳' : saved ? '✅ تم الحفظ' : '💾 حفظ'}
              </Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutTxt}>خروج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {SECTIONS.map(sec => (
          <View key={sec.title} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{sec.emoji}</Text>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
            </View>

            {/* Fields */}
            {sec.fields.map(f => (
              <View key={f.key} style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={[styles.input, f.multiline && styles.textarea]}
                  value={draft[f.key] ?? ''}
                  onChangeText={v => setDraft(d => ({ ...d, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  keyboardType={f.keyboardType ?? 'default'}
                  multiline={f.multiline}
                  numberOfLines={f.multiline ? 3 : 1}
                  textAlignVertical={f.multiline ? 'top' : undefined}
                />
              </View>
            ))}
          </View>
        ))}

        {/* Bottom save button (convenience) */}
        <TouchableOpacity
          style={[styles.saveBtnBottom, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveBtnBottomTxt}>
            {saving ? '⏳ جارٍ الحفظ...' : saved ? '✅ تم الحفظ بنجاح!' : '💾 حفظ جميع التغييرات'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = Platform.select({ web: { fontFamily: "'Tajawal', sans-serif" } as any }) ?? {};
const RTL  = { writingDirection: 'rtl' as any };

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0F4FF' },

  centerWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#F0F4FF',
  },
  loadingTxt: {
    color: Colors.textSecondary, fontSize: FontSize.base,
    ...FONT, ...RTL,
  },

  // ── Header ──
  header: {
    backgroundColor:  Colors.navy,
    paddingTop:       Platform.OS === 'ios' ? 50 : (Platform.OS === 'web' ? 0 : 32),
    paddingBottom:    Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(15,36,96,0.30)' } as any,
      default: {
        shadowColor:   Colors.navy,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius:  12,
        elevation:     8,
      },
    }),
  },
  headerInner: {
    maxWidth:       MAX_WIDTH,
    alignSelf:      'center',
    width:          '100%',
    flexDirection:  'row-reverse',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap' as any,
    gap:            Spacing.sm,
  },
  headerTitle: {
    color:      Colors.white,
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.extrabold,
    textAlign:  'right',
    ...FONT, ...RTL,
  },
  headerSub: {
    color:    Colors.yellowLight,
    fontSize: FontSize.xs,
    textAlign: 'right',
    ...FONT, ...RTL,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },

  saveBtn: {
    backgroundColor:   Colors.yellow,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs + 2,
    borderRadius:      50,
    borderBottomWidth: 3,
    borderBottomColor: Colors.yellowDeep,
  },
  saveBtnTxt: {
    color:      Colors.navy,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.extrabold,
    ...FONT,
  },

  logoutBtn: {
    backgroundColor:   'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs + 2,
    borderRadius:      50,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.25)',
  },
  logoutTxt: {
    color:    Colors.white,
    fontSize: FontSize.sm,
    ...FONT,
  },

  // ── Scroll ──
  scroll:  { flex: 1 },
  content: {
    maxWidth:          MAX_WIDTH,
    alignSelf:         'center',
    width:             '100%',
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.xl,
    gap:               Spacing.lg,
  },

  // ── Section card ──
  section: {
    backgroundColor: Colors.white,
    borderRadius:    20,
    padding:         Spacing.lg,
    gap:             Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 2px 16px rgba(15,36,96,0.07)' } as any,
      default: {
        shadowColor:   Colors.navy,
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius:  10,
        elevation:     4,
      },
    }),
  },
  sectionHeader: {
    flexDirection:  'row-reverse',
    alignItems:     'center',
    gap:            Spacing.xs,
    paddingBottom:  Spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.backgroundGray,
    marginBottom:   Spacing.xs,
  },
  sectionEmoji: { fontSize: FontSize.xl },
  sectionTitle: {
    color:      Colors.navy,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.extrabold,
    ...FONT, ...RTL,
  },

  // ── Fields ──
  fieldWrap: { gap: 6 },
  fieldLabel: {
    color:      Colors.navy,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign:  'right',
    ...FONT, ...RTL,
  },
  input: {
    borderWidth:       1.5,
    borderColor:       Colors.border,
    borderRadius:      12,
    paddingVertical:   Platform.OS === 'ios' ? 13 : 10,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.base,
    color:             Colors.navy,
    backgroundColor:   Colors.backgroundGray,
    ...Platform.select({ web: { outlineStyle: 'none', ...FONT } as any }),
  },
  textarea: { height: 80, paddingTop: 10, textAlignVertical: 'top' },

  // ── Bottom save ──
  saveBtnBottom: {
    backgroundColor:   Colors.navy,
    paddingVertical:   Spacing.md + 2,
    borderRadius:      22,
    borderBottomWidth: 4,
    borderBottomColor: Colors.navyDark,
    alignItems:        'center',
    marginTop:         Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(30,58,138,0.30)' } as any,
      default: {
        shadowColor:   Colors.navy,
        shadowOffset:  { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius:  16,
        elevation:     10,
      },
    }),
  },
  saveBtnBottomTxt: {
    color:      Colors.white,
    fontSize:   FontSize.base,
    fontWeight: FontWeight.extrabold,
    ...FONT, ...RTL,
  },
});

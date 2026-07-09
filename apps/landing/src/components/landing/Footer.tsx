import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Platform, Image, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Asset } from 'expo-asset';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Colors } from '@ifluent/shared';
import { Spacing, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { useResponsive } from '@ifluent/shared';
import type { SiteSettings } from '@ifluent/shared';

interface FooterProps { settings: SiteSettings }

const QUICK_LINKS = [
  { label: 'المستويات الخمسة', id: 'levels'   },
  { label: 'مميزات المنصة',    id: 'features' },
  { label: 'كيف يعمل',        id: 'how'      },
];

// Platform policies PDF — bundled INTO the app (committed in assets), so it is
// served same-origin and never depends on a backend URL / device IP.
const POLICIES_PDF = require('../../../assets/legal/ifluent-policies.pdf');

export function Footer({ settings }: FooterProps) {
  const { isMobile } = useResponsive();
  const router    = useRouter();
  const tapCount  = useRef(0);
  const tapTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5 quick taps on copyright → admin login (hidden easter-egg entry)
  const handleCopyrightTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      router.push('/(admin)/login');
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
  };

  const openUrl = (url: string | null | undefined) => {
    if (!url) return;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => {});
  };

  // Open the bundled policies PDF (same-origin asset — no backend dependency).
  const openPolicies = () => openUrl(Asset.fromModule(POLICIES_PDF).uri);

  const scrollTo = (id: string) => {
    if (Platform.OS === 'web') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasAppStore      = !!settings.app_store_url;
  const hasGooglePlay    = !!settings.google_play_url;
  const hasDesktopMac     = !!settings.desktop_mac_url;
  const hasDesktopWindows = !!settings.desktop_windows_url;
  const phone         = settings.contact_phone?.trim();
  const dialUrl       = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;

  const callPhone = () => {
    if (!dialUrl) return;
    if (Platform.OS === 'web') window.location.href = dialUrl;
    else Linking.openURL(dialUrl).catch(() => {});
  };

  return (
    <View style={styles.footer}>
      {/* ── Top wave ── */}
      <View style={styles.topWave} />

      {/* ── Main content ── */}
      <View style={[styles.inner, isMobile && styles.innerMobile]}>

        {/* Brand column */}
        <View style={[styles.brandCol, isMobile && styles.colMobile]}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.logoImg}
            />
            <Text style={styles.logoText}>
              <Text style={styles.logoI}>i</Text>
              <Text style={styles.logoFluent}>Fluent</Text>
            </Text>
          </View>

          <Text style={styles.tagline}>
          منصة متكاملة لتعليم الإنجليزية{'\n'} مع أفضل المعلمين المحترفين اجانب وعرب
          </Text>

          {/* Platform policies — opens the PDF directly */}
          <TouchableOpacity onPress={openPolicies} activeOpacity={0.7}>
            <Text style={styles.policyLink}>سياسة المنصة وحماية البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* Quick links + phone (navy area) */}
        <View style={[styles.linksCol, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>روابط سريعة</Text>
          {QUICK_LINKS.map((l) => (
            <TouchableOpacity key={l.id} onPress={() => scrollTo(l.id)} style={styles.linkRow} activeOpacity={0.7}>
              <Text style={styles.linkArrow}>←</Text>
              <Text style={styles.linkText}>{l.label}</Text>
            </TouchableOpacity>
          ))}
          {phone ? (
            <TouchableOpacity onPress={callPhone} activeOpacity={0.75} style={styles.phoneBlockLinks}>
              <Text style={styles.phoneLabel}>اتصل بنا</Text>
              <Text style={styles.phoneNumber}>{phone}</Text>
              <Text style={styles.phoneHint}>الرد خلال 24 ساعة</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* App download */}
        <View style={[styles.appCol, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>حمّل التطبيق</Text>
          <Text style={styles.comingSoon}>قريباً على المتاجر 🚀</Text>

          {/* App Store */}
          <TouchableOpacity
            style={[styles.storeBtn, !hasAppStore && styles.storeBtnDisabled]}
            onPress={() => openUrl(settings.app_store_url)}
            disabled={!hasAppStore}
            activeOpacity={hasAppStore ? 0.8 : 1}
          >
            <Text style={styles.storeBtnIcon}>🍎</Text>
            <View style={styles.storeBtnText}>
              <Text style={styles.storeBtnSub}>Download on the</Text>
              <Text style={styles.storeBtnName}>App Store</Text>
            </View>
            {!hasAppStore && <View style={styles.comingBadge}><Text style={styles.comingBadgeText}>قريباً</Text></View>}
          </TouchableOpacity>

          {/* Google Play */}
          <TouchableOpacity
            style={[styles.storeBtn, !hasGooglePlay && styles.storeBtnDisabled]}
            onPress={() => openUrl(settings.google_play_url)}
            disabled={!hasGooglePlay}
            activeOpacity={hasGooglePlay ? 0.8 : 1}
          >
            <Text style={styles.storeBtnIcon}>▶</Text>
            <View style={styles.storeBtnText}>
              <Text style={styles.storeBtnSub}>Get it on</Text>
              <Text style={styles.storeBtnName}>Google Play</Text>
            </View>
            {!hasGooglePlay && <View style={styles.comingBadge}><Text style={styles.comingBadgeText}>قريباً</Text></View>}
          </TouchableOpacity>

          {/* Desktop apps */}
          <Text style={styles.socialHeading}>نسخة سطح المكتب</Text>

          <TouchableOpacity
            style={[styles.storeBtn, !hasDesktopMac && styles.storeBtnDisabled]}
            onPress={() => openUrl(settings.desktop_mac_url)}
            disabled={!hasDesktopMac}
            activeOpacity={hasDesktopMac ? 0.8 : 1}
          >
            <FontAwesome5 name="apple" brand size={20} color={Colors.white} />
            <View style={styles.storeBtnText}>
              <Text style={styles.storeBtnSub}>Download for</Text>
              <Text style={styles.storeBtnName}>macOS</Text>
            </View>
            {!hasDesktopMac && <View style={styles.comingBadge}><Text style={styles.comingBadgeText}>قريباً</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.storeBtn, !hasDesktopWindows && styles.storeBtnDisabled]}
            onPress={() => openUrl(settings.desktop_windows_url)}
            disabled={!hasDesktopWindows}
            activeOpacity={hasDesktopWindows ? 0.8 : 1}
          >
            <FontAwesome5 name="windows" brand size={20} color={Colors.white} />
            <View style={styles.storeBtnText}>
              <Text style={styles.storeBtnSub}>Download for</Text>
              <Text style={styles.storeBtnName}>Windows</Text>
            </View>
            {!hasDesktopWindows && <View style={styles.comingBadge}><Text style={styles.comingBadgeText}>قريباً</Text></View>}
          </TouchableOpacity>

          {/* Social */}
          <Text style={styles.socialHeading}>تابعنا</Text>
          <View style={styles.socialRow}>
            <SocialIcon brand="snapchat"  url={settings.social_snapchat ?? null} onPress={openUrl} />
            <SocialIcon brand="instagram" url={settings.social_instagram ?? null} onPress={openUrl} />
            <SocialIcon brand="facebook"  url={settings.social_facebook  ?? null} onPress={openUrl} />
          </View>
        </View>
      </View>

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInner}>
          <View style={styles.bottomRight}>
            <TouchableOpacity onPress={handleCopyrightTap} activeOpacity={1}>
              <Text style={styles.copyright}>
                {settings.footer_text ?? `© ${new Date().getFullYear()} iFluent — جميع الحقوق محفوظة`}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.madeBadge}>
            <Text style={styles.madeText}>صُنع بـ ❤️ للعالم العربي</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const SOCIAL_BRAND = {
  snapchat:  { label: 'Snapchat',  icon: 'snapchat' as const,  bg: '#FFFC00', fg: '#000000' },
  instagram: { label: 'Instagram', icon: 'instagram' as const, bg: '#E4405F', fg: '#FFFFFF' },
  facebook:  { label: 'Facebook',  icon: 'facebook-f' as const, bg: '#1877F2', fg: '#FFFFFF' },
};

function SocialIcon({
  brand, url, onPress,
}: {
  brand:   keyof typeof SOCIAL_BRAND;
  url:     string | null;
  onPress: (url: string) => void;
}) {
  const b       = SOCIAL_BRAND[brand];
  const hasLink = !!url;

  return (
    <Pressable
      style={[styles.socialSoonBtn, { backgroundColor: b.bg }, !hasLink && { opacity: 0.55 }]}
      onPress={() => hasLink && onPress(url!)}
      accessibilityRole="button"
      accessibilityLabel={b.label}
    >
      <FontAwesome5 name={b.icon} brand size={21} color={b.fg} />
      {!hasLink && (
        <View style={styles.socialSoonBadge}>
          <Text style={styles.socialSoonBadgeText}>قريباً</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Colors.navy,
    overflow:        'hidden',
  },
  topWave: {
    height:                 40,
    backgroundColor:        Colors.backgroundWarm,
    borderBottomLeftRadius:  40,
    borderBottomRightRadius: 40,
    marginBottom:           Spacing['2xl'],
  },
  inner: {
    flexDirection:     'row-reverse',
    flexWrap:          'wrap' as any,
    maxWidth:          MAX_WIDTH,
    alignSelf:         'center',
    width:             '100%',
    paddingHorizontal: Spacing.xl,
    gap:               Spacing['2xl'],
    paddingBottom:     Spacing['2xl'],
  },
  innerMobile: { flexDirection: 'column' },
  // `flex: 2/1` on the columns below is for proportional WIDTHS in the desktop
  // row-reverse layout. On mobile the layout becomes a column, so those same
  // values get reinterpreted as proportional HEIGHTS — combined with RN Web's
  // `min-height: 0` reset on flex items, columns get flex-shrunk below their
  // real content height and overflow visibly into whatever comes next. Reset
  // flex sizing to content-based on mobile.
  colMobile:   { width: '100%', flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },

  // Brand
  brandCol: { flex: 2, minWidth: 220, alignItems: 'flex-end' },
  logoRow: {
    flexDirection:  'row-reverse',
    alignItems:     'center',
    gap:            Spacing.sm,
    marginBottom:   Spacing.md,
  },
  logoImg: {
    width:        40,
    height:       40,
    borderRadius: 12,
    borderWidth:  2,
    borderColor:  Colors.yellow,
  },
  logoText:   { fontSize: FontSize.xl },
  logoI:      { color: Colors.yellow,   fontWeight: FontWeight.extrabold, fontSize: FontSize.xl },
  logoFluent: { color: Colors.white,    fontWeight: FontWeight.extrabold, fontSize: FontSize.xl },
  tagline: {
    color:        'rgba(255,255,255,0.6)',
    fontSize:     FontSize.sm,
    lineHeight:   22,
    textAlign:    'right',
    marginBottom: Spacing.sm,
    writingDirection: 'rtl' as any,
  },
  policyLink: {
    color:            Colors.yellow,
    fontSize:         FontSize.sm,
    fontWeight:       FontWeight.semibold,
    textAlign:        'right',
    marginBottom:     Spacing.xl,
    textDecorationLine: 'underline',
    writingDirection: 'rtl' as any,
  },
  // Links
  linksCol: { flex: 1, minWidth: 160, alignItems: 'flex-end' },
  colTitle: {
    color:        Colors.yellow,
    fontSize:     FontSize.base,
    fontWeight:   FontWeight.bold,
    marginBottom: Spacing.md,
    textAlign:    'right',
    writingDirection: 'rtl' as any,
  },
  linkRow: {
    flexDirection:  'row-reverse',
    alignItems:     'center',
    gap:            Spacing.xs,
    marginBottom:   Spacing.sm,
  },
  linkArrow: { color: Colors.yellow, fontSize: FontSize.sm },
  linkText: {
    color:    'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    textAlign: 'right',
    writingDirection: 'rtl' as any,
  },
  phoneBlockLinks: {
    alignSelf:      'stretch',
    alignItems:     'flex-end',
    marginTop:      Spacing.lg,
    paddingTop:     Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  phoneLabel: {
    color:            'rgba(255,255,255,0.45)',
    fontSize:         FontSize.xs,
    fontWeight:       FontWeight.semibold,
    marginBottom:     4,
    textAlign:        'right',
    writingDirection: 'rtl' as any,
  },

  // App col
  appCol:     { flex: 1, minWidth: 180, alignItems: 'flex-end' },
  comingSoon: {
    color:        'rgba(255,255,255,0.5)',
    fontSize:     FontSize.xs,
    textAlign:    'right',
    marginBottom: Spacing.md,
    writingDirection: 'rtl' as any,
  },
  storeBtn: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    gap:               Spacing.sm,
    backgroundColor:   'rgba(255,255,255,0.08)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.15)',
    borderRadius:      16,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    marginBottom:      Spacing.sm,
    maxWidth:          200,
    width:             '100%',
    position:          'relative' as any,
  },
  storeBtnDisabled: { opacity: 0.35 },
  storeBtnIcon: { fontSize: FontSize.xl, color: Colors.white },
  storeBtnText: { flex: 1, alignItems: 'flex-end' },
  storeBtnSub: {
    color:    'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  storeBtnName: {
    color:      Colors.white,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  comingBadge: {
    backgroundColor:   Colors.yellow,
    borderRadius:      6,
    paddingHorizontal: 4,
    paddingVertical:   2,
  },
  comingBadgeText: {
    color:      Colors.navy,
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  socialHeading: {
    color:            Colors.yellow,
    fontSize:       FontSize.sm,
    fontWeight:     FontWeight.bold,
    textAlign:      'right',
    marginTop:      Spacing.lg,
    marginBottom:   Spacing.sm,
    writingDirection: 'rtl' as any,
  },
  socialRow: {
    flexDirection: 'row-reverse',
    gap:           Spacing.sm,
    alignItems:    'center',
    flexWrap:      'wrap' as any,
    marginBottom:  Spacing.xs,
  },
  socialSoonBtn: {
    width:           46,
    height:          46,
    borderRadius:    23,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.22)',
    position:        'relative' as any,
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(0,0,0,0.25)' } as any,
      default: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius:  6,
        elevation:     4,
      },
    }),
  },
  socialSoonBadge: {
    position:          'absolute' as any,
    top:               -5,
    left:              -4,
    backgroundColor:   Colors.navy,
    borderRadius:      6,
    paddingHorizontal: 4,
    paddingVertical:   1,
    borderWidth:       1,
    borderColor:       'rgba(255,193,7,0.35)',
  },
  socialSoonBadgeText: {
    fontSize:   7,
    color:      Colors.yellow,
    fontWeight: FontWeight.bold,
  },

  // Bottom
  bottomBar: {
    borderTopWidth:  1,
    borderTopColor:  'rgba(255,255,255,0.07)',
    paddingVertical: Spacing.lg,
  },
  bottomInner: {
    flexDirection:     'row-reverse',
    justifyContent:    'space-between',
    alignItems:        'center',
    maxWidth:          MAX_WIDTH,
    alignSelf:         'center',
    width:             '100%',
    paddingHorizontal: Spacing.xl,
    flexWrap:          'wrap' as any,
    gap:               Spacing.md,
  },
  bottomRight: {
    alignItems:     'flex-end',
    gap:            Spacing.sm,
    maxWidth:       '100%',
  },
  copyright: {
    color:    'rgba(255,255,255,0.45)',
    fontSize: FontSize.xs,
    textAlign: 'right',
    writingDirection: 'rtl' as any,
  },
  phoneNumber: {
    color:         Colors.yellow,
    fontSize:      FontSize.base,
    fontWeight:    FontWeight.bold,
    textAlign:     'right',
    writingDirection: 'rtl' as any,
  },
  phoneHint: {
    color:         'rgba(255,255,255,0.55)',
    fontSize:      FontSize.xs,
    textAlign:     'right',
    marginTop:     2,
    writingDirection: 'rtl' as any,
  },
  madeBadge: {
    backgroundColor:   'rgba(255,193,7,0.12)',
    borderRadius:      50,
    paddingHorizontal: Spacing.md,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       'rgba(255,193,7,0.25)',
  },
  madeText: {
    color:    Colors.yellow,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});

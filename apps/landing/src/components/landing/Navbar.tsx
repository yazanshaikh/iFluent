import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Pressable, Platform, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@ifluent/shared';
import { useScrollTo } from '@ifluent/shared';
import { Spacing, NAVBAR_HEIGHT, MAX_WIDTH } from '@ifluent/shared';
import { FontSize, FontWeight } from '@ifluent/shared';
import { useResponsive } from '@ifluent/shared';

const NAV_LINKS = [
  { label: 'المراحل',    id: 'levels'   },
  { label: 'المميزات',  id: 'features' },
  { label: 'كيف يعمل', id: 'how'      },
];

interface NavbarProps {
  platformName?: string;
  onCtaPress?:   () => void;
}

export function Navbar({ platformName = 'iFluent', onCtaPress }: NavbarProps) {
  const { isMobile } = useResponsive();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const menuAnim  = useRef(new Animated.Value(0)).current;
  const scrollCtx = useScrollTo();

  // ── Safe area: pushes Navbar below status bar / notch on native ──
  const insets   = useSafeAreaInsets();
  const safeTop  = Platform.OS !== 'web' ? insets.top : 0;

  // ── Scroll shadow (web only) ──
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ── Burger animation ──
  useEffect(() => {
    Animated.spring(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      useNativeDriver: false,
      tension: 120,
      friction: 10,
    }).start();
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    scrollCtx(id);
  };

  return (
    <View style={[
      styles.wrapper,
      scrolled ? styles.wrapperScrolled : styles.wrapperFlat,
      // On native: push content below status bar / notch
      safeTop > 0 && { paddingTop: safeTop },
    ]}>
      <View style={styles.inner}>

        {/* ── Logo ── */}
        <TouchableOpacity
          style={styles.logoWrap}
          onPress={() => Platform.OS === 'web' && window.scrollTo({ top: 0, behavior: 'smooth' })}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 8 }}
        >
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.logoImg}
          />
          <Text style={styles.logoText}>
            <Text style={styles.logoI}>i</Text>
            <Text style={styles.logoFluent}>Fluent</Text>
          </Text>
        </TouchableOpacity>

        {/* ── Desktop nav links ── */}
        {!isMobile && (
          <View style={styles.links}>
            {NAV_LINKS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => scrollTo(l.id)}
                style={({ hovered }: any) => [styles.linkBtn, hovered && styles.linkBtnHover]}
              >
                {({ hovered }: any) => (
                  <Text style={[styles.linkText, hovered && styles.linkTextHover]}>
                    {l.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* ── CTA (desktop) or Burger (mobile) ── */}
        {!isMobile ? (
          <TouchableOpacity
            style={styles.cta}
            onPress={onCtaPress ?? (() => scrollTo('contact'))}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>احجز حصتك مجاناً ✦</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.burger}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Animated.View style={[
              styles.bar,
              { transform: [
                { rotate: menuAnim.interpolate({ inputRange: [0,1], outputRange: ['0deg','45deg'] }) },
                { translateY: menuAnim.interpolate({ inputRange: [0,1], outputRange: [0, 8] }) },
              ]},
            ]} />
            <Animated.View style={[
              styles.bar,
              { opacity: menuAnim.interpolate({ inputRange: [0,1], outputRange: [1, 0] }) },
            ]} />
            <Animated.View style={[
              styles.bar,
              { transform: [
                { rotate: menuAnim.interpolate({ inputRange: [0,1], outputRange: ['0deg','-45deg'] }) },
                { translateY: menuAnim.interpolate({ inputRange: [0,1], outputRange: [0, -8] }) },
              ]},
            ]} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Mobile dropdown menu ── */}
      {isMobile && (
        <Animated.View style={[
          styles.mobileMenu,
          {
            opacity:   menuAnim,
            maxHeight: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 480] }),
          },
        ]}>
          {NAV_LINKS.map((l) => (
            <TouchableOpacity
              key={l.id}
              onPress={() => scrollTo(l.id)}
              style={styles.mobileLink}
              activeOpacity={0.7}
            >
              <Text style={styles.mobileLinkText}>{l.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.mobileDivider} />
          <TouchableOpacity
            style={styles.mobileCta}
            onPress={() => {
              setMenuOpen(false);
              onCtaPress ? onCtaPress() : scrollTo('contact');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.mobileCtaText}>احجز حصتك مجاناً ✦</Text>
          </TouchableOpacity>
          {/* bottom breathing room so last item isn't cramped */}
          <View style={{ height: Spacing.sm }} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex:          100,
    backgroundColor: Colors.white,
    ...Platform.select({
      web: { position: 'fixed' as any, top: 0, left: 0, right: 0 },
    }),
  },
  wrapperFlat: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderYellow,
  },
  wrapperScrolled: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderYellow,
    ...Platform.select({
      web: { boxShadow: '0 2px 20px rgba(255,193,7,0.18)' } as any,
      default: {
        shadowColor:   Colors.yellow,
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius:  12,
        elevation:     6,
      },
    }),
  },

  inner: {
    flexDirection:     'row-reverse',
    alignItems:        'center',
    justifyContent:    'space-between',
    height:            NAVBAR_HEIGHT,
    paddingHorizontal: Spacing.xl,
    maxWidth:          MAX_WIDTH,
    alignSelf:         'center',
    width:             '100%',
  },

  // ── Logo ──
  logoWrap: {
    flexDirection: 'row-reverse',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  logoImg: {
    width:        36,
    height:       36,
    borderRadius: 10,
  },
  logoText: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.5,
  },
  logoI:      { color: Colors.yellow, fontWeight: FontWeight.extrabold },
  logoFluent: { color: Colors.navy,   fontWeight: FontWeight.extrabold },

  // ── Desktop links ──
  links: {
    flexDirection: 'row-reverse',
    gap:           Spacing.xs,
  },
  linkBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      50,
  },
  linkBtnHover:    { backgroundColor: Colors.yellowSoft },
  linkText: {
    color:      Colors.textSecondary,
    fontSize:   FontSize.base,
    fontWeight: FontWeight.medium,
    writingDirection: 'rtl' as any,
  },
  linkTextHover:   { color: Colors.navy, fontWeight: FontWeight.semibold },

  // ── CTA button (desktop) — prominent ──
  cta: {
    backgroundColor:   Colors.yellow,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderRadius:      50,
    borderBottomWidth: 4,
    borderBottomColor: Colors.yellowDeep,
    ...Platform.select({
      web: { boxShadow: '0 6px 22px rgba(255,193,7,0.55)' } as any,
      default: {
        shadowColor:   Colors.yellow,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius:  12,
        elevation:     6,
      },
    }),
  },
  ctaText: {
    color:      Colors.navy,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.extrabold,
    writingDirection: 'rtl' as any,
  },

  // ── Burger (mobile) ──
  // Larger touch area via hitSlop prop, visual size stays compact
  burger: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    borderRadius:   12,
  },
  bar: {
    width:           26,
    height:          3,
    backgroundColor: Colors.navy,
    borderRadius:    2,
  },

  // ── Mobile dropdown ──
  mobileMenu: {
    overflow:        'hidden',
    backgroundColor: Colors.white,
    borderTopWidth:  1,
    borderTopColor:  Colors.borderYellow,
  },
  mobileLink: {
    paddingVertical:   Spacing.md + 4,   // ~20px — easy to tap
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundGray,
  },
  mobileLinkText: {
    color:            Colors.navy,
    fontSize:         FontSize.md,
    fontWeight:       FontWeight.semibold,
    textAlign:        'right',
    writingDirection: 'rtl' as any,
  },
  mobileDivider: {
    height:           8,
    backgroundColor:  Colors.backgroundGray,
  },
  mobileCta: {
    backgroundColor:   Colors.yellow,
    marginHorizontal:  Spacing.xl,
    marginTop:         Spacing.md,
    paddingVertical:   Spacing.md + 2,
    borderRadius:      50,
    alignItems:        'center',
    borderBottomWidth: 3,
    borderBottomColor: Colors.yellowDeep,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(255,193,7,0.35)' } as any,
      default: {
        shadowColor:   Colors.yellow,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius:  10,
        elevation:     5,
      },
    }),
  },
  mobileCtaText: {
    color:      Colors.navy,
    fontSize:   FontSize.base,
    fontWeight: FontWeight.extrabold,
    writingDirection: 'rtl' as any,
  },
});

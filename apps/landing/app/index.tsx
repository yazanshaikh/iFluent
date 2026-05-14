import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { fetchSiteSettings, DEFAULT_SETTINGS } from '@/src/api/public';
import type { SiteSettings }    from '@ifluent/shared';
import { Colors }               from '@ifluent/shared';
import { Navbar }            from '@/src/components/landing/Navbar';
import { HeroSection }       from '@/src/components/landing/HeroSection';
import { LevelsSection }     from '@/src/components/landing/LevelsSection';
import { FeaturesSection }   from '@/src/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/src/components/landing/HowItWorksSection';
import { DemoSection }       from '@/src/components/landing/DemoSection';
import { Footer }            from '@/src/components/landing/Footer';
import { BookingModal }      from '@/src/components/landing/BookingModal';
import { ScrollContext }     from '@ifluent/shared';

export default function LandingPage() {
  const [settings, setSettings]       = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [showBooking, setShowBooking]  = useState(false);

  // ── Native scroll support ──────────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionY      = useRef<Record<string, number>>({});

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  /** Works on both web (scrollIntoView) and native (ScrollView.scrollTo) */
  const scrollToSection = (id: string) => {
    if (Platform.OS === 'web') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const y = sectionY.current[id] ?? 0;
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }
  };

  /** Called by each section View's onLayout to track its Y position on native */
  const registerSection = (id: string) => (e: any) => {
    sectionY.current[id] = e.nativeEvent.layout.y;
  };

  const openBooking = () => setShowBooking(true);

  return (
    <ScrollContext.Provider value={scrollToSection}>
      <View style={styles.root}>

        {/* Navbar — fixed on web, normal flow on native */}
        <Navbar platformName={settings.platform_name} onCtaPress={openBooking} />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View nativeID="hero"     onLayout={registerSection('hero')}>
            <HeroSection settings={settings} onCtaPrimary={openBooking} />
          </View>
          <View nativeID="levels"   onLayout={registerSection('levels')}>
            <LevelsSection />
          </View>
          <View nativeID="features" onLayout={registerSection('features')}>
            <FeaturesSection />
          </View>
          <View nativeID="how"      onLayout={registerSection('how')}>
            <HowItWorksSection />
          </View>
          <View nativeID="contact"  onLayout={registerSection('contact')}>
            <DemoSection settings={settings} onCtaPress={openBooking} />
          </View>
          <Footer settings={settings} />
        </ScrollView>

        {/* Booking modal — rendered above everything at root level */}
        <BookingModal visible={showBooking} onClose={() => setShowBooking(false)} />

      </View>
    </ScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.white },
  scroll:  { flex: 1 },
  content: { flexGrow: 1 },
});

// screens/vendor/profile/AboutUsScreen.js
// REDESIGNED — "Elevate" visual language, matching this app's own
// BusinessProfileScreen.js / BankDetailsScreen.js (hero + corner grid +
// rounded bottom corners, shared theme tokens, section-card language).
//
// UI ONLY. This is a static informational screen — no data fetching, no
// state. All behaviour is preserved exactly: same back navigation, same
// Linking.openURL(c.url) calls with the same URLs, same content.
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  purple: T.purple, purpleL: T.purpleLight,
  whatsapp: T.whatsapp,
};

const STATS = [
  { value: '500+', label: 'Vendors', icon: 'storefront-outline', color: C.g700, bg: C.g50 },
  { value: '150+', label: 'Cities',  icon: 'location-outline',   color: C.blue,  bg: C.blueL },
  { value: '5K+',  label: 'Vehicles', icon: 'car-outline',       color: C.amber, bg: C.amberL },
  { value: '24/7', label: 'Support',  icon: 'headset-outline',   color: C.purple, bg: C.purpleL },
];

const FEATURES = [
  {
    icon: 'car-multiple',
    label: 'Wide Fleet Network',
    desc: 'Access thousands of vehicles across 150+ cities in India.',
    color: C.g700, bg: C.g50,
  },
  {
    icon: 'shield-check-outline',
    label: 'Verified Vendors',
    desc: 'All vendors are thoroughly verified for customer safety.',
    color: C.blue, bg: C.blueL,
  },
  {
    icon: 'cash-multiple',
    label: 'Best Prices',
    desc: 'Competitive pricing with transparent and fair billing.',
    color: C.amber, bg: C.amberL,
  },
  {
    icon: 'headset',
    label: '24/7 Support',
    desc: 'Round-the-clock customer support for all your needs.',
    color: C.purple, bg: C.purpleL,
  },
];

const CONTACTS = [
  { icon: 'call',         color: C.g700,  bg: C.g50,   label: '+91-9737965551',   url: 'tel:+919737965551' },
  { icon: 'mail',         color: C.blue,  bg: C.blueL, label: 'book@transrentals.in', url: 'mailto:book@transrentals.in' },
  { icon: 'logo-whatsapp', color: C.whatsapp, bg: 'rgba(37,211,102,0.10)', label: 'WhatsApp Support', url: 'https://wa.me/919737965551' },
  { icon: 'globe',        color: C.purple, bg: C.purpleL, label: 'www.transrentals.in', url: 'https://transrentals.in' },
];

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

export default function AboutUsScreen({ navigation }) {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setInitializing(false), 350);
    return () => clearTimeout(t);
  }, []);

  if (initializing) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />

        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: rs(16) }}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons name="truck-fast" size={rs(26)} color={C.g400} />
              </View>
              <Text style={styles.heroTitle}>TransRentals</Text>
              <Text style={styles.heroSub}>Your Trusted Rental Partner</Text>
            </View>

            <View style={styles.statsStrip}>
              {STATS.map((s, i) => (
                <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statDivider]}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.scroll}>
          <View style={[styles.section, cardShadow]}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIconBox, { backgroundColor: C.g50 }]}>
                <MaterialCommunityIcons name="information-outline" size={rs(18)} color={C.g700} />
              </View>
              <Bone w={110} h={15} />
            </View>
            <Bone w="100%" h={11} style={{ marginTop: 12 }} />
            <Bone w="90%" h={11} style={{ marginTop: 8 }} />
            <Bone w="60%" h={11} style={{ marginTop: 8 }} />
          </View>

          <View style={[styles.section, cardShadow]}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIconBox, { backgroundColor: C.purpleL }]}>
                <MaterialCommunityIcons name="star-outline" size={rs(18)} color={C.purple} />
              </View>
              <Bone w={120} h={15} />
            </View>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.featureRow, i < 1 && styles.featureBorder]}>
                <Bone w={rs(46)} h={rs(46)} r={rs(14)} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Bone w={130} h={13} />
                  <Bone w="80%" h={11} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO — static sibling so it can never be clipped by the
          ScrollView's own viewport ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <SafeAreaView edges={['top']} style={{ paddingHorizontal: rs(16) }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Hero body */}
          <View style={styles.heroBody}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="truck-fast" size={rs(26)} color={C.g400} />
            </View>
            <Text style={styles.heroTitle}>TransRentals</Text>
            <Text style={styles.heroSub}>Your Trusted Rental Partner</Text>
          </View>

          {/* Stats Strip */}
          <View style={styles.statsStrip}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statDivider]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── WHO WE ARE ── */}
        <View style={[styles.section, cardShadow]}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="information-outline" size={rs(18)} color={C.g700} />
            </View>
            <Text style={styles.sectionTitle}>Who We Are</Text>
          </View>
          <Text style={styles.aboutText}>
            TransRentals is India's leading vehicle rental marketplace connecting customers with verified rental providers. We offer a wide range of vehicles — cars, bikes, buses, trucks and more — across major cities.
          </Text>
          <Text style={[styles.aboutText, { marginBottom: 0 }]}>
            Our platform makes it easy for vendors to manage their fleet, receive bookings, and grow their rental business while providing customers the best rental experience.
          </Text>
        </View>

        {/* ── WHY CHOOSE US ── */}
        <View style={[styles.section, cardShadow]}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: C.purpleL }]}>
              <MaterialCommunityIcons name="star-outline" size={rs(18)} color={C.purple} />
            </View>
            <Text style={styles.sectionTitle}>Why Choose Us</Text>
          </View>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
              <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
                <MaterialCommunityIcons name={f.icon} size={rs(22)} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── OUR MISSION ── */}
        <LinearGradient
          colors={[C.g900, C.g800]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.missionCard, cardShadow]}
        >
          <CornerGrid style={styles.missionDots} corner="top-right" lineColor="rgba(255,255,255,0.3)" cellSize={14} />
          <View style={styles.missionIconWrap}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={rs(30)} color={C.g400} />
          </View>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To revolutionize the vehicle rental industry by providing a seamless, transparent, and technology-driven platform that benefits both customers and vendors.
          </Text>
        </LinearGradient>

        {/* ── CONTACT ── */}
        <View style={[styles.section, cardShadow]}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: C.blueL }]}>
              <Ionicons name="chatbubbles-outline" size={rs(17)} color={C.blue} />
            </View>
            <Text style={styles.sectionTitle}>Get in Touch</Text>
          </View>
          {CONTACTS.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactRow, i < CONTACTS.length - 1 && styles.contactBorder]}
              onPress={() => Linking.openURL(c.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIconBox, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={rs(19)} color={c.color} />
              </View>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Ionicons name="chevron-forward" size={rs(17)} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 TransRentals. All rights reserved.</Text>
        </View>

        <View style={{ height: rs(32) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Hero ── */
  hero: {
    paddingBottom: rs(12),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 0, marginBottom: rs(4),
  },
  backBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: {
    alignItems: 'center', marginBottom: rs(14),
  },
  heroIconWrap: {
    width: rs(60), height: rs(60), borderRadius: rs(30),
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: rs(10),
  },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rs(26), fontWeight: '800', color: '#fff',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rs(13), color: 'rgba(255,255,255,0.65)', marginTop: rs(4),
  },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: rs(16), paddingVertical: rs(14),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1, alignItems: 'center',
  },
  statDivider: {
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontFamily: DISPLAY, fontSize: rs(20), fontWeight: '800', color: C.g400,
  },
  statLabel: {
    fontSize: rs(11), color: 'rgba(255,255,255,0.6)',
    fontWeight: '600', marginTop: rs(2),
  },

  scroll: { padding: rs(16), paddingTop: rs(10) },

  /* ── Section cards ── */
  section: {
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: T.glassBorder,
    overflow: 'hidden', marginBottom: rs(16),
    padding: rs(16),
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    marginBottom: rs(4),
  },
  sectionIconBox: {
    width: rs(34), height: rs(34), borderRadius: rs(11),
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: DISPLAY, fontSize: rs(15), fontWeight: '700', color: C.text,
  },

  aboutText: {
    fontSize: rs(14), color: C.sub, lineHeight: rs(22),
    marginTop: rs(12),
  },

  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: rs(14), gap: rs(14),
  },
  featureBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  featureIconBox: {
    width: rs(46), height: rs(46), borderRadius: rs(14),
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: {
    fontSize: rs(14), fontWeight: '700', color: C.text,
  },
  featureDesc: {
    fontSize: rs(12), color: C.sub, marginTop: rs(2), lineHeight: rs(17),
  },

  missionCard: {
    borderRadius: rs(20), padding: rs(24), marginBottom: rs(16),
    alignItems: 'center', overflow: 'hidden',
  },
  missionDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  missionIconWrap: {
    width: rs(60), height: rs(60), borderRadius: rs(30),
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  missionTitle: {
    fontFamily: DISPLAY, fontSize: rs(18), fontWeight: '800', color: '#fff',
    marginTop: rs(12), marginBottom: rs(10),
  },
  missionText: {
    fontSize: rs(13), color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: rs(20),
  },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: rs(14), gap: rs(14),
  },
  contactBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  contactIconBox: {
    width: rs(42), height: rs(42), borderRadius: rs(13),
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: {
    flex: 1, fontSize: rs(14), fontWeight: '600', color: C.text,
  },

  footer: {
    alignItems: 'center', paddingVertical: rs(8),
  },
  footerText: {
    fontSize: rs(12), color: C.muted, marginBottom: rs(3),
  },
});

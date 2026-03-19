import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  purple: '#7C3AED', purpleL: '#F5F3FF',
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
  { icon: 'logo-whatsapp', color: '#25D366', bg: '#F0FFF4', label: 'WhatsApp Support', url: 'https://wa.me/919737965551' },
  { icon: 'globe',        color: C.purple, bg: C.purpleL, label: 'www.transrentals.in', url: 'https://transrentals.in' },
];

export default function AboutUsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HEADER ── */}
      <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={styles.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="truck-fast" size={34} color={C.g400} />
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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── WHO WE ARE ── */}
        <Text style={styles.sectionLabel}>Who We Are</Text>
        <View style={styles.card}>
          <Text style={styles.aboutText}>
            TransRentals is India's leading vehicle rental marketplace connecting customers with verified rental providers. We offer a wide range of vehicles — cars, bikes, buses, trucks and more — across major cities.
          </Text>
          <Text style={[styles.aboutText, { marginBottom: 0 }]}>
            Our platform makes it easy for vendors to manage their fleet, receive bookings, and grow their rental business while providing customers the best rental experience.
          </Text>
        </View>

        {/* ── WHY CHOOSE US ── */}
        <Text style={styles.sectionLabel}>Why Choose Us</Text>
        <View style={styles.card}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
              <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
                <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
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
          colors={[C.g900, '#064E3B']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.missionCard}
        >
          <MaterialCommunityIcons name="rocket-launch-outline" size={36} color={C.g400} />
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To revolutionize the vehicle rental industry by providing a seamless, transparent, and technology-driven platform that benefits both customers and vendors.
          </Text>
        </LinearGradient>

        {/* ── CONTACT ── */}
        <Text style={styles.sectionLabel}>Get in Touch</Text>
        <View style={styles.card}>
          {CONTACTS.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactRow, i < CONTACTS.length - 1 && styles.contactBorder]}
              onPress={() => Linking.openURL(c.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIconBox, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 TransRentals. All rights reserved.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGrad: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    alignItems: 'center', marginBottom: 24,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4,
  },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1, alignItems: 'center',
  },
  statDivider: {
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: 20, fontWeight: '800', color: C.g400,
  },
  statLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    fontWeight: '600', marginTop: 2,
  },

  scroll: { padding: 16 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: C.sub,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 8, marginLeft: 2,
  },

  card: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  aboutText: {
    fontSize: 14, color: C.sub, lineHeight: 22,
    padding: 16, paddingBottom: 8,
  },

  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  featureBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  featureIconBox: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14, fontWeight: '700', color: C.text,
  },
  featureDesc: {
    fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 17,
  },

  missionCard: {
    borderRadius: 16, padding: 24, marginBottom: 16,
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: 18, fontWeight: '800', color: '#fff',
    marginTop: 12, marginBottom: 10,
  },
  missionText: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 20,
  },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  contactBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  contactIconBox: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: {
    flex: 1, fontSize: 14, fontWeight: '600', color: C.text,
  },

  footer: {
    alignItems: 'center', paddingVertical: 8,
  },
  footerText: {
    fontSize: 12, color: C.muted, marginBottom: 3,
  },
});

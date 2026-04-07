import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getDriverAppVersion } from '../api/client';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', blue: '#3B82F6', purple: '#9333EA',
  warn: '#F59E0B',
};

const STATS = [
  { icon: 'car-sport-outline',     color: C.primary,  bg: '#F0FDF4', value: '500+',  label: 'Drivers' },
  { icon: 'location-outline',      color: C.blue,     bg: '#EFF6FF', value: '50+',   label: 'Cities' },
  { icon: 'checkmark-circle-outline', color: '#9333EA', bg: '#F5F3FF', value: '10K+', label: 'Trips Done' },
  { icon: 'star-outline',          color: C.warn,     bg: '#FFFBEB', value: '4.8★',  label: 'Avg Rating' },
];

const FEATURES = [
  { icon: 'flash-outline',         color: C.primary,  bg: '#F0FDF4', title: 'Instant Bookings',     desc: 'Get booking requests instantly from customers across India.' },
  { icon: 'wallet-outline',        color: '#9333EA',  bg: '#F5F3FF', title: 'Transparent Earnings',  desc: 'See your driver batta clearly before accepting any booking.' },
  { icon: 'shield-checkmark-outline', color: C.blue,  bg: '#EFF6FF', title: 'Verified Platform',    desc: 'All customers are verified. Safe and trusted environment.' },
  { icon: 'headset-outline',       color: C.warn,     bg: '#FFFBEB', title: '24/7 Support',          desc: 'Our support team is always available to help you.' },
  { icon: 'car-outline',           color: '#EA580C',  bg: '#FFF7ED', title: 'Multi-Service',         desc: 'Chauffeur, Bus, Luxury, Truck, Packers, Equipment & more.' },
  { icon: 'trending-up-outline',   color: C.primary,  bg: '#F0FDF4', title: 'Grow Your Business',   desc: 'Expand your reach and grow income with TransRentals.' },
];

export default function AboutScreen({ navigation }) {
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    getDriverAppVersion()
      .then(res => { if (res.data?.latestVersion) setAppVersion(res.data.latestVersion); })
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About TransRentals</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo + Tagline */}
        <View style={styles.heroCard}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={38} color={C.primary} />
          </View>
          <Text style={styles.brandName}>TransRentals</Text>
          <Text style={styles.tagline}>India's Trusted Vehicle Rental & Logistics Platform</Text>
          <View style={styles.websiteRow}>
            <Ionicons name="globe-outline" size={14} color={C.primary} />
            <TouchableOpacity onPress={() => Linking.openURL('https://transrentals.in')}>
              <Text style={styles.websiteLink}>https://transrentals.in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Our Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Ionicons name="flag-outline" size={22} color={C.primary} style={{ marginBottom: 10 }} />
            <Text style={styles.missionText}>
              TransRentals connects professional drivers and vehicle owners with customers across India.
              We are building a reliable, transparent, and technology-driven platform that empowers drivers
              to grow their income while delivering excellent travel experiences to customers.
            </Text>
          </View>
        </View>

        {/* Why TransRentals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why TransRentals?</Text>
          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <View key={f.title} style={[styles.featureRow, i === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services We Offer</Text>
          <View style={styles.servicesCard}>
            {[
              { icon: 'car-outline',       color: C.blue,    label: 'Chauffeur Service' },
              { icon: 'bus-outline',        color: '#D97706', label: 'Bus Rental' },
              { icon: 'car-sport-outline',  color: '#9333EA', label: 'Luxury Car Rental' },
              { icon: 'construct-outline',  color: '#EA580C', label: 'Truck / Transport' },
              { icon: 'cube-outline',       color: C.primary, label: 'Packers & Movers' },
              { icon: 'hammer-outline',     color: C.blue,    label: 'Equipment Rental' },
              { icon: 'bicycle-outline',    color: '#10B981', label: 'Bike Rental' },
              { icon: 'briefcase-outline',  color: '#7C3AED', label: 'B2B Services' },
            ].map((s, i, arr) => (
              <View key={s.label} style={[styles.serviceRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.serviceIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={15} color={s.color} />
                </View>
                <Text style={styles.serviceLabel}>{s.label}</Text>
                <Ionicons name="checkmark-circle" size={16} color={C.primary} />
              </View>
            ))}
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionCard}>
          <View style={styles.versionRow}>
            <Ionicons name="phone-portrait-outline" size={16} color={C.sub} />
            <Text style={styles.versionText}>TransRentals Driver App</Text>
          </View>
          <Text style={styles.versionNum}>Version {appVersion}</Text>
          <Text style={styles.versionCopy}>© 2024 TransRentals. All rights reserved.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 18, fontWeight: '800', color: '#fff' },

  heroCard:   { margin: 16, backgroundColor: C.card, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  logoBox:    { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  brandName:  { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 6 },
  tagline:    { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  websiteLink:{ fontSize: 13, color: C.primary, fontWeight: '700' },

  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  statCard:   { flex: 1, minWidth: '44%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statIcon:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue:  { fontSize: 20, fontWeight: '900' },
  statLabel:  { fontSize: 11, color: C.sub, fontWeight: '600' },

  section:      { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },

  missionCard:  { backgroundColor: C.card, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  missionText:  { fontSize: 14, color: C.sub, lineHeight: 22, textAlign: 'center' },

  featuresCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  featureRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  featureIcon:  { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  featureText:  { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  featureDesc:  { fontSize: 12, color: C.sub, lineHeight: 18 },

  servicesCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  serviceRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  serviceIcon:  { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },

  versionCard:  { margin: 16, backgroundColor: C.card, borderRadius: 16, padding: 20, alignItems: 'center', gap: 4 },
  versionRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  versionText:  { fontSize: 13, fontWeight: '700', color: C.sub },
  versionNum:   { fontSize: 12, color: C.sub },
  versionCopy:  { fontSize: 11, color: '#94A3B8', marginTop: 4 },
});

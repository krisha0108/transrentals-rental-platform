import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BRAND = {
  primary: '#22C55E',
  blue: '#3B82F6',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
};

export default function AboutUsScreen({ navigation }) {
  const features = [
    {
      icon: 'car-sport',
      title: 'Wide Fleet Network',
      description: 'Access thousands of vehicles across 150+ cities in India',
    },
    {
      icon: 'shield-checkmark',
      title: 'Verified Vendors',
      description: 'All vendors are thoroughly verified for your safety',
    },
    {
      icon: 'cash',
      title: 'Best Prices',
      description: 'Competitive pricing with transparent billing',
    },
    {
      icon: 'people',
      title: '24/7 Support',
      description: 'Round-the-clock customer support for your needs',
    },
  ];

  const stats = [
    { value: '500+', label: 'Vendors' },
    { value: '150+', label: 'Cities' },
    { value: '5000+', label: 'Vehicles' },
    { value: '24/7', label: 'Support' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BRAND.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo & Title */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="car-sport" size={48} color={BRAND.primary} />
          </View>
          <Text style={styles.appName}>TransRentals</Text>
          <Text style={styles.tagline}>Your Trusted Rental Partner</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who We Are</Text>
          <Text style={styles.aboutText}>
            TransRentals is India's leading vehicle rental marketplace connecting customers with
            verified rental providers. We offer a wide range of vehicles from cars, bikes, buses
            to commercial vehicles across major cities.
          </Text>
          <Text style={styles.aboutText}>
            Our platform makes it easy for vendors to manage their fleet, receive bookings, and
            grow their rental business while providing customers with the best rental experience.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Us</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${BRAND.blue}15` }]}>
                <Ionicons name={feature.icon} size={24} color={BRAND.blue} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Mission */}
        <View style={styles.missionCard}>
          <Ionicons name="rocket" size={32} color={BRAND.primary} />
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To revolutionize the vehicle rental industry by providing a seamless, transparent,
            and technology-driven platform that benefits both customers and vendors.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('tel:+919737965551')}
          >
            <Ionicons name="call" size={20} color={BRAND.primary} />
            <Text style={styles.contactBtnText}>+91-9737965551</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:book@transrentals.in')}
          >
            <Ionicons name="mail" size={20} color={BRAND.blue} />
            <Text style={styles.contactBtnText}>book@transrentals.in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('https://wa.me/919737965551')}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactBtnText}>WhatsApp Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('https://transrentals.in')}
          >
            <Ionicons name="globe" size={20} color={BRAND.blue} />
            <Text style={styles.contactBtnText}>www.transrentals.in</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 TransRentals. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
  },

  scrollContent: {
    padding: 16,
  },

  logoSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: BRAND.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${BRAND.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.ink,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: BRAND.subText,
  },

  section: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: BRAND.text,
    lineHeight: 22,
    marginBottom: 12,
  },

  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: BRAND.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: BRAND.subText,
    fontWeight: '600',
  },

  featureCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.ink,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: BRAND.subText,
    lineHeight: 18,
  },

  missionCard: {
    backgroundColor: `${BRAND.primary}10`,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${BRAND.primary}30`,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.ink,
    marginTop: 12,
    marginBottom: 8,
  },
  missionText: {
    fontSize: 14,
    color: BRAND.text,
    textAlign: 'center',
    lineHeight: 22,
  },

  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: 12,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: BRAND.subText,
    marginBottom: 4,
  },
});

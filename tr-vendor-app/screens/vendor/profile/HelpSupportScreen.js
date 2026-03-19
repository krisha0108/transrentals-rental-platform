import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, StatusBar, Animated,
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
  green: '#25D366',
};

const FAQ_DATA = [
  {
    question: 'How do I add my vehicles?',
    answer: 'Go to Fleet → Add Vehicle and fill in the vehicle details. Upload clear photos and all required documents for faster approval.',
    icon: 'car-outline',
  },
  {
    question: 'How long does approval take?',
    answer: 'Document verification typically takes 24-48 hours. Service and location requests are reviewed within 1-2 business days.',
    icon: 'time-outline',
  },
  {
    question: 'How do I receive bookings?',
    answer: "Once approved, you'll receive booking notifications. You can view and respond to bookings in the Bookings section.",
    icon: 'calendar-outline',
  },
  {
    question: 'What are the commission charges?',
    answer: 'Commission charges vary by service type and location. Please check your vendor agreement or contact support for details.',
    icon: 'cash-outline',
  },
  {
    question: 'How do I update my bank details?',
    answer: 'Go to Profile → Bank Details to add or update your bank account information for receiving payments.',
    icon: 'card-outline',
  },
  {
    question: 'Can I operate in multiple cities?',
    answer: 'Yes! Go to Locations and request approval for additional cities where you want to operate.',
    icon: 'location-outline',
  },
];

const CONTACT_OPTIONS = [
  {
    icon: 'call',
    mcIcon: 'phone',
    label: 'Call Us',
    value: '+91-9737965551',
    action: () => Linking.openURL('tel:+919737965551'),
    color: C.g700,
    bg: C.g50,
  },
  {
    icon: 'mail',
    mcIcon: 'email-outline',
    label: 'Email Us',
    value: 'book@transrentals.in',
    action: () => Linking.openURL('mailto:book@transrentals.in'),
    color: C.blue,
    bg: C.blueL,
  },
  {
    icon: 'logo-whatsapp',
    mcIcon: 'whatsapp',
    label: 'WhatsApp',
    value: '+91-9737965551',
    action: () => Linking.openURL('https://wa.me/919737965551'),
    color: C.green,
    bg: '#F0FFF4',
  },
];

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

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
            <View style={{ flex: 1 }} />
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="headset" size={32} color={C.g400} />
            </View>
            <Text style={styles.heroTitle}>Help & Support</Text>
            <Text style={styles.heroSub}>We're here to help you 24/7</Text>
          </View>

          {/* Support Hours Strip */}
          <View style={styles.hoursStrip}>
            <Ionicons name="time-outline" size={16} color={C.g400} />
            <Text style={styles.hoursText}>Mon–Sun · Round the Clock · 24/7 Support</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── GET IN TOUCH ── */}
        <Text style={styles.sectionLabel}>Get in Touch</Text>
        <View style={styles.card}>
          {CONTACT_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactRow, i < CONTACT_OPTIONS.length - 1 && styles.contactBorder]}
              onPress={opt.action}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIconBox, { backgroundColor: opt.bg }]}>
                <Ionicons name={opt.icon} size={22} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{opt.label}</Text>
                <Text style={styles.contactValue}>{opt.value}</Text>
              </View>
              <View style={[styles.contactArrow, { backgroundColor: opt.bg }]}>
                <Ionicons name="chevron-forward" size={16} color={opt.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FAQs ── */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQ_DATA.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqRow, i < FAQ_DATA.length - 1 && styles.faqBorder]}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              activeOpacity={0.8}
            >
              <View style={styles.faqTop}>
                <View style={styles.faqIconBox}>
                  <Ionicons name={faq.icon} size={18} color={C.g600} />
                </View>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={C.muted}
                />
              </View>
              {expandedFaq === i && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── INFO BANNER ── */}
        <LinearGradient
          colors={[C.g900, '#064E3B']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.infoBanner}
        >
          <MaterialCommunityIcons name="shield-check-outline" size={28} color={C.g400} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.infoTitle}>Dedicated Vendor Support</Text>
            <Text style={styles.infoText}>Our support team is always ready to assist vendors grow their business on TransRentals.</Text>
          </View>
        </LinearGradient>

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  hoursStrip: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
    gap: 6,
  },
  hoursText: {
    fontSize: 12, color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
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

  /* Contact */
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  contactBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  contactIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 14, fontWeight: '700', color: C.text,
  },
  contactValue: {
    fontSize: 13, color: C.sub, marginTop: 2,
  },
  contactArrow: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  /* FAQ */
  faqRow: {
    padding: 16,
  },
  faqBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  faqTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  faqIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1, fontSize: 14, fontWeight: '600', color: C.text,
  },
  faqAnswer: {
    fontSize: 13, color: C.sub, lineHeight: 20,
    marginTop: 12, marginLeft: 46,
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 18, marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14, fontWeight: '700', color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18,
  },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', blue: '#3B82F6', purple: '#9333EA',
  warn: '#F59E0B', danger: '#EF4444', green: '#25D366',
};

const FAQS = [
  {
    icon: 'checkmark-circle-outline',
    color: C.primary,
    q: 'How do I accept a booking?',
    a: 'Go to "Available Bookings" from the Dashboard. You will see all open bookings. Tap "Accept" on any booking. Once accepted, assign your vehicle to confirm the booking.',
  },
  {
    icon: 'lock-closed-outline',
    color: C.blue,
    q: 'How does OTP verification work?',
    a: 'After you assign your vehicle, an OTP is automatically sent to the customer\'s phone. At pickup, ask the customer to share their OTP. Enter it in the app to start the trip.',
  },
  {
    icon: 'wallet-outline',
    color: '#9333EA',
    q: 'When and how do I get paid?',
    a: 'Your Driver Batta is shown on every booking before you accept. Payments are processed after trip completion. Contact your vendor or TransRentals support for payment cycle details.',
  },
  {
    icon: 'person-outline',
    color: C.warn,
    q: 'What if the customer is not responding?',
    a: 'Call the customer directly from the Booking Detail screen. If no response after pickup time, contact TransRentals support at +91 97379 65551 for assistance.',
  },
  {
    icon: 'car-outline',
    color: '#EA580C',
    q: 'How do I update my vehicle details?',
    a: 'Go to the Fleet tab from the bottom navigation. Tap on your vehicle and select "Edit". Update registration number, insurance, RC, and fitness documents.',
  },
  {
    icon: 'close-circle-outline',
    color: C.danger,
    q: 'Can I cancel an accepted booking?',
    a: 'Cancellations after acceptance affect your rating. For emergencies, contact TransRentals support immediately at +91 97379 65551 or support@transrentals.in.',
  },
  {
    icon: 'star-outline',
    color: C.warn,
    q: 'How does the rating system work?',
    a: 'After every completed trip, customers rate your service (1–5 stars). Maintaining 4.5+ gives you priority for new bookings. Be professional and punctual.',
  },
  {
    icon: 'document-text-outline',
    color: C.blue,
    q: 'What documents do I need to keep updated?',
    a: 'Keep RC, Insurance, Fitness Certificate, and Permit updated in the Fleet section. You will receive alerts when documents are about to expire.',
  },
  {
    icon: 'git-branch-outline',
    color: C.primary,
    q: 'Vendor Direct vs Available Bookings?',
    a: '"Available Bookings" are customer-posted and open to all drivers. "Vendor Direct" bookings are assigned directly by your vendor. Both appear in My Bookings tab.',
  },
  {
    icon: 'warning-outline',
    color: C.danger,
    q: 'How do I report an incident during a trip?',
    a: 'Go to Fleet → Your Vehicle → Incidents tab and log the incident. For urgent matters, call our support line at +91 97379 65551. Always ensure customer safety first.',
  },
];

function FaqItem({ item, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.faqItem, !isLast && styles.faqItemBorder]}>
      <TouchableOpacity
        style={styles.faqRow}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.7}
      >
        <View style={[styles.faqIconBox, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon} size={16} color={item.color} />
        </View>
        <Text style={styles.faqQ}>{item.q}</Text>
        <View style={[styles.chevronBox, open && styles.chevronBoxOpen]}>
          <Ionicons name="chevron-down-outline" size={15} color={open ? C.primary : C.sub} />
        </View>
      </TouchableOpacity>
      {open && (
        <View style={styles.faqAnswerBox}>
          <View style={[styles.faqAnswerLine, { backgroundColor: item.color }]} />
          <Text style={styles.faqA}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

export default function SupportScreen({ navigation }) {
  const call     = () => Linking.openURL('tel:+919737965551');
  const email    = () => Linking.openURL('mailto:support@transrentals.in?subject=Driver App Support');
  const whatsapp = () => Linking.openURL('https://wa.me/919737965551?text=Hi%2C%20I%20need%20help%20with%20the%20TransRentals%20Driver%20App');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <LinearGradient
        colors={['#043927', '#065F46', '#16A34A']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSub}>We're always here to help you</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Ionicons name="headset-outline" size={24} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Contact Us ── */}
        <Text style={styles.sectionLabel}>Contact Us</Text>

        {/* Call + WhatsApp row */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactTile} onPress={call} activeOpacity={0.8}>
            <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.contactTileInner}>
              <View style={[styles.contactTileIcon, { backgroundColor: C.primary + '20' }]}>
                <Ionicons name="call-outline" size={24} color={C.primary} />
              </View>
              <Text style={[styles.contactTileLabel, { color: C.primary }]}>Call Us</Text>
              <Text style={styles.contactTileValue}>+91 97379 65551</Text>
              <View style={styles.contactTileArrow}>
                <Ionicons name="arrow-forward-outline" size={13} color={C.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactTile} onPress={whatsapp} activeOpacity={0.8}>
            <LinearGradient colors={['#F0FFF4', '#DCFCE7']} style={styles.contactTileInner}>
              <View style={[styles.contactTileIcon, { backgroundColor: C.green + '20' }]}>
                <Ionicons name="logo-whatsapp" size={24} color={C.green} />
              </View>
              <Text style={[styles.contactTileLabel, { color: C.green }]}>WhatsApp</Text>
              <Text style={styles.contactTileValue}>Chat with us</Text>
              <View style={styles.contactTileArrow}>
                <Ionicons name="arrow-forward-outline" size={13} color={C.green} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Email card */}
        <TouchableOpacity style={styles.emailCard} onPress={email} activeOpacity={0.8}>
          <View style={styles.emailIconBox}>
            <Ionicons name="mail-outline" size={22} color={C.blue} />
          </View>
          <View style={styles.emailText}>
            <Text style={styles.emailLabel}>Email Support</Text>
            <Text style={styles.emailValue}>support@transrentals.in</Text>
          </View>
          <View style={styles.emailArrow}>
            <Ionicons name="arrow-forward-outline" size={16} color={C.blue} />
          </View>
        </TouchableOpacity>

        {/* ── Support Hours ── */}
        <View style={styles.hoursCard}>
          <View style={styles.hoursLeft}>
            <View style={styles.hoursIconBox}>
              <Ionicons name="time-outline" size={20} color={C.warn} />
            </View>
            <View>
              <Text style={styles.hoursTitle}>Support Hours</Text>
              <Text style={styles.hoursTime}>Mon – Sun · 8:00 AM to 10:00 PM</Text>
            </View>
          </View>
          <View style={styles.hoursTag}>
            <View style={styles.hoursTagDot} />
            <Text style={styles.hoursTagText}>Available</Text>
          </View>
        </View>

        {/* ── FAQs ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Frequently Asked Questions</Text>

        <View style={styles.faqCard}>
          {FAQS.map((item, i) => (
            <FaqItem key={i} item={item} isLast={i === FAQS.length - 1} />
          ))}
        </View>

        {/* ── Still need help banner ── */}
        <LinearGradient
          colors={['#064E3B', '#16A34A']}
          style={styles.banner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Ionicons name="headset-outline" size={32} color="rgba(255,255,255,0.25)" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Still need help?</Text>
            <Text style={styles.bannerSub}>Our team is ready to assist you anytime</Text>
          </View>
          <TouchableOpacity style={styles.bannerBtn} onPress={call} activeOpacity={0.85}>
            <Ionicons name="call-outline" size={15} color={C.primary} />
            <Text style={styles.bannerBtnText}>Call Now</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Header
  header:       { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  headerNav:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerIconBox:{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Contact tiles
  contactRow:       { flexDirection: 'row', gap: 12, marginBottom: 12 },
  contactTile:      { flex: 1, borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  contactTileInner: { padding: 16, gap: 4 },
  contactTileIcon:  { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  contactTileLabel: { fontSize: 15, fontWeight: '800' },
  contactTileValue: { fontSize: 11, color: C.sub, fontWeight: '600' },
  contactTileArrow: { marginTop: 8, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },

  // Email card
  emailCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, borderLeftWidth: 4, borderLeftColor: C.blue },
  emailIconBox:{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.blue + '15', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  emailText:   { flex: 1 },
  emailLabel:  { fontSize: 13, fontWeight: '800', color: C.blue, marginBottom: 3 },
  emailValue:  { fontSize: 12, color: C.sub, fontWeight: '500' },
  emailArrow:  { width: 34, height: 34, borderRadius: 10, backgroundColor: C.blue + '12', justifyContent: 'center', alignItems: 'center' },

  // Hours
  hoursCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  hoursLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hoursIconBox:{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center' },
  hoursTitle:  { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  hoursTime:   { fontSize: 12, color: C.sub },
  hoursTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  hoursTagDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  hoursTagText:{ fontSize: 11, fontWeight: '700', color: C.primary },

  // FAQ
  faqCard:       { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 20 },
  faqItem:       {},
  faqItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  faqRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  faqIconBox:    { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  faqQ:          { flex: 1, fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 20 },
  chevronBox:    { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  chevronBoxOpen:{ backgroundColor: '#F0FDF4' },
  faqAnswerBox:  { flexDirection: 'row', paddingLeft: 14, paddingRight: 14, paddingBottom: 14, gap: 10 },
  faqAnswerLine: { width: 3, borderRadius: 2, alignSelf: 'stretch', opacity: 0.5 },
  faqA:          { flex: 1, fontSize: 13, color: C.sub, lineHeight: 21 },

  // Banner
  banner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18, marginBottom: 4 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  bannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  bannerBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  bannerBtnText:{ fontSize: 13, fontWeight: '800', color: C.primary },
});

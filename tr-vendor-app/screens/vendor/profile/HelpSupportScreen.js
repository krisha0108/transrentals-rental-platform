import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, StatusBar, Animated,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet } from '../../api/client';

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
    question: 'How do I get my vendor account approved?',
    answer: 'After registration, upload all required documents (PAN Card, Address Proof) in the Documents section. Once uploaded, your application will be reviewed within 1-2 business days. You will receive a notification once approved.',
    icon: 'shield-checkmark-outline',
  },
  {
    question: 'How do I add my vehicles?',
    answer: 'Once your account and service requests are approved, go to Fleet → Add Vehicle. Upload clear photos and all required documents for faster approval.',
    icon: 'car-outline',
  },
  {
    question: 'How do I request to offer a new service?',
    answer: 'Go to Services from the dashboard, select the service you want to offer, provide your experience details, and submit the request. Admin will review and approve.',
    icon: 'grid-outline',
  },
  {
    question: 'How long does approval take?',
    answer: 'Document verification typically takes 24-48 hours. Service and location requests are reviewed within 1-2 business days.',
    icon: 'time-outline',
  },
  {
    question: 'When will I receive my payouts?',
    answer: 'Payouts are processed weekly on Mondays. Ensure your bank details are correctly added and a cancelled cheque is uploaded for verification. Minimum payout amount is ₹500.',
    icon: 'cash-outline',
  },
  {
    question: 'How do I update my bank details?',
    answer: 'Go to Profile → Bank Details to add or update your bank account information for receiving payments.',
    icon: 'card-outline',
  },
  {
    question: 'How do I handle booking cancellations?',
    answer: 'Cancellation policies are set by TransRentals. For vendor-side cancellations, please contact support. Customer cancellations are handled automatically with refunds as per the policy.',
    icon: 'close-circle-outline',
  },
  {
    question: 'Can I operate in multiple cities?',
    answer: 'Yes! Go to Locations and request approval for additional cities where you want to operate.',
    icon: 'location-outline',
  },
];

const TICKET_CATEGORIES = [
  { value: 'account',    label: 'Account & Profile' },
  { value: 'documents',  label: 'Documents & Verification' },
  { value: 'bookings',   label: 'Bookings & Orders' },
  { value: 'payments',   label: 'Payments & Payouts' },
  { value: 'fleet',      label: 'Fleet & Vehicles' },
  { value: 'technical',  label: 'Technical Issue' },
  { value: 'other',      label: 'Other' },
];

const RESOURCES = [
  { label: 'Vendor Guidelines',  sub: 'Best practices for vendors',     icon: 'book-outline',       color: C.blue,   bg: C.blueL },
  { label: 'Pricing Guide',      sub: 'How to set competitive prices',  icon: 'pricetag-outline',   color: '#7C3AED', bg: '#F3E8FF' },
  { label: 'Terms & Conditions', sub: 'Vendor partnership agreement',   icon: 'document-text-outline', color: C.g700, bg: C.g50 },
  { label: 'Privacy Policy',     sub: 'How we handle your data',        icon: 'lock-closed-outline', color: C.amber, bg: C.amberL },
];

// Default fallbacks — overwritten on mount from /public/contact-settings
// so an admin can update support contact info without an app release.
const DEFAULT_CONTACT = {
  contactEmail: 'book@transrentals.in',
  contactPhone: '+91-9737965551',
};

// Strip non-digits and any leading 91 so we can build a clean tel/wa URL
// from whatever format the admin saved in the DB.
const toDigits = (s) => String(s || '').replace(/\D/g, '').replace(/^91/, '');

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contact, setContact] = useState(DEFAULT_CONTACT);

  // Ticket form state
  const [ticket, setTicket] = useState({ category: '', subject: '', message: '' });
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet('/public/contact-settings');
        const data = res?.data || {};
        setContact({
          contactEmail: data.contactEmail || DEFAULT_CONTACT.contactEmail,
          contactPhone: data.contactPhone || DEFAULT_CONTACT.contactPhone,
        });
      } catch {
        // keep defaults — endpoint is best-effort
      }
    })();
  }, []);

  const phoneDigits = toDigits(contact.contactPhone);
  const CONTACT_OPTIONS = [
    { icon: 'call',          label: 'Call Us',   value: contact.contactPhone, action: () => Linking.openURL(`tel:+91${phoneDigits}`),   color: C.g700, bg: C.g50 },
    { icon: 'mail',          label: 'Email Us',  value: contact.contactEmail, action: () => Linking.openURL(`mailto:${contact.contactEmail}`), color: C.blue, bg: C.blueL },
    { icon: 'logo-whatsapp', label: 'WhatsApp',  value: contact.contactPhone, action: () => Linking.openURL(`https://wa.me/91${phoneDigits}`), color: C.green, bg: '#F0FFF4' },
  ];

  const selectedCategoryLabel = TICKET_CATEGORIES.find(c => c.value === ticket.category)?.label;

  const submitTicket = async () => {
    setSubmitError('');
    if (!ticket.category || !ticket.subject.trim() || !ticket.message.trim()) {
      setSubmitError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      // Matches the web — submission is a placeholder until a support-ticket
      // backend endpoint exists. Once that ships, replace this with an
      // apiPost('/vendor/support/tickets', ticket) call.
      await new Promise(r => setTimeout(r, 900));
      setSubmitted(true);
      setTicket({ category: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (e) {
      setSubmitError('Could not submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* ── RAISE TICKET ── */}
        <Text style={styles.sectionLabel}>Raise a Ticket</Text>
        <View style={styles.card}>
          <View style={{ padding: 16, gap: 12 }}>
            {submitted && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                <Text style={styles.successText}>Ticket submitted! We will get back within 24 hours.</Text>
              </View>
            )}
            {!!submitError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            )}

            <View>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                onPress={() => setCategoryPickerOpen(true)}
                style={styles.selectBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectTxt, !selectedCategoryLabel && { color: C.muted }]}>
                  {selectedCategoryLabel || 'Select category'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                value={ticket.subject}
                onChangeText={(v) => setTicket((p) => ({ ...p, subject: v }))}
                placeholder="Brief description of your issue"
                placeholderTextColor={C.muted}
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                value={ticket.message}
                onChangeText={(v) => setTicket((p) => ({ ...p, message: v }))}
                placeholder="Please describe your issue in detail..."
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={5}
                style={[styles.input, styles.textarea]}
              />
            </View>

            <View style={styles.submitRow}>
              <View style={styles.responseHint}>
                <Ionicons name="time-outline" size={13} color={C.muted} />
                <Text style={styles.responseHintTxt}>Response within 24 hours</Text>
              </View>
              <TouchableOpacity
                onPress={submitTicket}
                disabled={submitting}
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={15} color="#fff" />
                )}
                <Text style={styles.submitBtnTxt}>{submitting ? 'Submitting…' : 'Submit Ticket'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── HELPFUL RESOURCES ── */}
        <Text style={styles.sectionLabel}>Helpful Resources</Text>
        <View style={styles.card}>
          {RESOURCES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.contactRow, i < RESOURCES.length - 1 && styles.contactBorder]}
              activeOpacity={0.7}
              onPress={() => {/* placeholder — wire to actual docs URLs when available */}}
            >
              <View style={[styles.contactIconBox, { backgroundColor: r.bg }]}>
                <Ionicons name={r.icon} size={20} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{r.label}</Text>
                <Text style={styles.contactValue}>{r.sub}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={C.muted} />
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

      {/* Category picker — bottom-sheet style modal */}
      <Modal
        visible={categoryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCategoryPickerOpen(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            {TICKET_CATEGORIES.map((cat) => {
              const selected = cat.value === ticket.category;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => {
                    setTicket((p) => ({ ...p, category: cat.value }));
                    setCategoryPickerOpen(false);
                  }}
                  style={[styles.modalRow, selected && styles.modalRowActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalRowTxt, selected && { color: C.g700, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                  {selected && <Ionicons name="checkmark-circle" size={18} color={C.g600} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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

  /* Ticket form */
  label: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 6, letterSpacing: 0.2 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  selectTxt: { fontSize: 14, color: C.text, fontWeight: '600' },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: C.text,
  },
  textarea: { minHeight: 100, paddingTop: 10, textAlignVertical: 'top' },
  submitRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 4, gap: 8, flexWrap: 'wrap',
  },
  responseHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  responseHintTxt: { fontSize: 11, color: C.muted, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.g700, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10,
  },
  submitBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  successText: { flex: 1, fontSize: 12, color: '#15803D', fontWeight: '600', lineHeight: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: '#B91C1C', fontWeight: '600', lineHeight: 16 },

  /* Category picker modal */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24,
  },
  modalHandle: {
    alignSelf: 'center', width: 38, height: 4, borderRadius: 2,
    backgroundColor: '#CBD5E1', marginBottom: 12,
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 6, marginLeft: 4 },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 10, borderRadius: 10,
  },
  modalRowActive: { backgroundColor: C.g50 },
  modalRowTxt: { fontSize: 14, color: C.text, fontWeight: '500' },
});

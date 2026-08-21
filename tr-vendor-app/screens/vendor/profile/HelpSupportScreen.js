// screens/vendor/profile/HelpSupportScreen.js
// REDESIGNED — "Elevate" visual language, structurally matching
// screens/travel-agent/support/HelpAssistantScreen.js's gradient hero (with
// AnimatedOrb ambient motion) and this app's own VendorDocumentsScreen.js /
// BankDetailsScreen.js card + modal conventions.
//
// UI ONLY. All behaviour is preserved exactly: same GET (/public/contact-settings)
// call, same contact/FAQ/ticket-category data, same ticket submit placeholder
// flow, same tel:/mailto:/wa.me deep links, same category-picker modal logic.
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, StatusBar,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet } from '../../api/client';
import { SC as T, G, rs, rf, GUT, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

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
  green: T.whatsapp,
  red: T.red, redL: T.redLight,
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
  { label: 'Pricing Guide',      sub: 'How to set competitive prices',  icon: 'pricetag-outline',   color: C.purple, bg: C.purpleL },
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO — static sibling so it can never be clipped by the
          ScrollView's own viewport ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="headset" size={rs(30)} color={C.g400} />
            </View>
            <Text style={styles.heroTitle}>Help & Support</Text>
            <Text style={styles.heroSub}>We're here to help you 24/7</Text>
          </View>

          <View style={styles.hoursStrip}>
            <Ionicons name="time-outline" size={rs(14)} color={C.g400} />
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
        <View style={[styles.card, cardShadow]}>
          {CONTACT_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactRow, i < CONTACT_OPTIONS.length - 1 && styles.contactBorder]}
              onPress={opt.action}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIconBox, { backgroundColor: opt.bg }]}>
                <Ionicons name={opt.icon} size={rs(20)} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{opt.label}</Text>
                <Text style={styles.contactValue}>{opt.value}</Text>
              </View>
              <View style={[styles.contactArrow, { backgroundColor: opt.bg }]}>
                <Ionicons name="chevron-forward" size={rs(15)} color={opt.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FAQs ── */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={[styles.card, cardShadow]}>
          {FAQ_DATA.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqRow, i < FAQ_DATA.length - 1 && styles.faqBorder]}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              activeOpacity={0.8}
            >
              <View style={styles.faqTop}>
                <View style={styles.faqIconBox}>
                  <Ionicons name={faq.icon} size={rs(17)} color={C.g600} />
                </View>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={rs(17)}
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
        <View style={[styles.card, cardShadow]}>
          <View style={styles.ticketFormBody}>
            {submitted && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={rs(17)} color={C.g700} />
                <Text style={styles.successText}>Ticket submitted! We will get back within 24 hours.</Text>
              </View>
            )}
            {!!submitError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={rs(17)} color={C.red} />
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
                <Ionicons name="chevron-down" size={rs(17)} color={C.muted} />
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
                <Ionicons name="time-outline" size={rs(12)} color={C.muted} />
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
                  <Ionicons name="send" size={rs(14)} color="#fff" />
                )}
                <Text style={styles.submitBtnTxt}>{submitting ? 'Submitting…' : 'Submit Ticket'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── HELPFUL RESOURCES ── */}
        <Text style={styles.sectionLabel}>Helpful Resources</Text>
        <View style={[styles.card, cardShadow]}>
          {RESOURCES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.contactRow, i < RESOURCES.length - 1 && styles.contactBorder]}
              activeOpacity={0.7}
              onPress={() => {/* placeholder — wire to actual docs URLs when available */}}
            >
              <View style={[styles.contactIconBox, { backgroundColor: r.bg }]}>
                <Ionicons name={r.icon} size={rs(18)} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{r.label}</Text>
                <Text style={styles.contactValue}>{r.sub}</Text>
              </View>
              <Ionicons name="open-outline" size={rs(15)} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── INFO BANNER ── */}
        <LinearGradient
          colors={[C.g900, C.g800]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.infoBanner}
        >
          <MaterialCommunityIcons name="shield-check-outline" size={rs(26)} color={C.g400} />
          <View style={{ flex: 1, marginLeft: rs(14) }}>
            <Text style={styles.infoTitle}>Dedicated Vendor Support</Text>
            <Text style={styles.infoText}>Our support team is always ready to assist vendors grow their business on TransRentals.</Text>
          </View>
        </LinearGradient>

        <View style={{ height: rs(32) }} />
      </ScrollView>

      {/* Category picker — bottom-sheet modal */}
      <Modal
        visible={categoryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCategoryPickerOpen(false)}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
            <ScrollView bounces={false} contentContainerStyle={styles.modalScroll}>
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
                    {selected && <Ionicons name="checkmark-circle" size={rs(17)} color={C.g600} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: 0,
    paddingBottom: rs(20),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute', top: -rs(50), right: -rs(30),
    width: rs(160), height: rs(160), borderRadius: rs(80),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(40), left: -rs(30),
    width: rs(130), height: rs(130), borderRadius: rs(65),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: rs(8),
    marginBottom: rs(18),
  },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: {
    alignItems: 'center',
    marginBottom: rs(18),
  },
  heroIconWrap: {
    width: rs(66), height: rs(66), borderRadius: rs(33),
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: rs(14),
  },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(21), fontWeight: '800', color: '#fff',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: rf(13), color: 'rgba(255,255,255,0.65)',
    marginTop: rs(4),
  },
  hoursStrip: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, paddingVertical: rs(8), paddingHorizontal: rs(16),
    gap: rs(6), alignSelf: 'center',
  },
  hoursText: {
    fontSize: rf(11.5), color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },

  scroll: { padding: GUT, paddingTop: rs(18) },

  sectionLabel: {
    fontSize: rf(12.5), fontWeight: '700', color: C.sub,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: rs(10), marginTop: rs(8), marginLeft: rs(2),
  },

  card: {
    backgroundColor: C.card, borderRadius: rs(18),
    borderWidth: 1, borderColor: T.glassBorder,
    overflow: 'hidden', marginBottom: rs(16),
  },

  /* Contact */
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: rs(16), gap: rs(14),
  },
  contactBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  contactIconBox: {
    width: rs(46), height: rs(46), borderRadius: rs(13),
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: {
    fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', color: C.text,
  },
  contactValue: {
    fontSize: rf(12.5), color: C.sub, marginTop: rs(2),
  },
  contactArrow: {
    width: rs(30), height: rs(30), borderRadius: rs(10),
    alignItems: 'center', justifyContent: 'center',
  },

  /* FAQ */
  faqRow: {
    padding: rs(16),
  },
  faqBorder: {
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  faqTop: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
  },
  faqIconBox: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1, fontSize: rf(13.5), fontWeight: '600', color: C.text,
  },
  faqAnswer: {
    fontSize: rf(12.5), color: C.sub, lineHeight: rs(19),
    marginTop: rs(12), marginLeft: rs(44),
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: rs(18), padding: rs(18), marginBottom: rs(8),
  },
  infoTitle: {
    fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', color: '#fff',
    marginBottom: rs(4),
  },
  infoText: {
    fontSize: rf(11.5), color: 'rgba(255,255,255,0.7)', lineHeight: rs(17),
  },

  /* Ticket form */
  ticketFormBody: { padding: rs(16), gap: rs(12) },
  label: { fontSize: rf(11.5), fontWeight: '700', color: C.sub, marginBottom: rs(6), letterSpacing: 0.2 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border,
    borderRadius: rs(10), paddingHorizontal: rs(12), paddingVertical: rs(12),
  },
  selectTxt: { fontSize: rf(14), color: C.text, fontWeight: '600' },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border,
    borderRadius: rs(10), paddingHorizontal: rs(12), paddingVertical: rs(10),
    fontSize: rf(14), color: C.text,
  },
  textarea: { minHeight: rs(100), paddingTop: rs(10), textAlignVertical: 'top' },
  submitRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: rs(4), gap: rs(8), flexWrap: 'wrap',
  },
  responseHint: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  responseHintTxt: { fontSize: rf(10.5), color: C.muted, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: C.g700, paddingHorizontal: rs(16), paddingVertical: rs(11), borderRadius: rs(10),
  },
  submitBtnTxt: { color: '#fff', fontSize: rf(13), fontWeight: '800', letterSpacing: 0.2 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g400,
    paddingHorizontal: rs(12), paddingVertical: rs(10), borderRadius: rs(10),
  },
  successText: { flex: 1, fontSize: rf(11.5), color: C.g700, fontWeight: '600', lineHeight: rs(16) },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: C.redL, borderWidth: 1, borderColor: C.red,
    paddingHorizontal: rs(12), paddingVertical: rs(10), borderRadius: rs(10),
  },
  errorText: { flex: 1, fontSize: rf(11.5), color: C.red, fontWeight: '600', lineHeight: rs(16) },

  /* Category picker modal — modalOverlay(scrim) → modalContent(capped
     height, overflow hidden, SHEET_RADIUS) → handle → single ScrollView. */
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.card,
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '80%', overflow: 'hidden',
  },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle: { width: rs(38), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },
  modalScroll: { paddingHorizontal: GUT, paddingTop: rs(10), paddingBottom: rs(24) },
  modalTitle: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: C.text, marginBottom: rs(6), marginLeft: rs(4) },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: rs(13), paddingHorizontal: rs(10), borderRadius: rs(10),
  },
  modalRowActive: { backgroundColor: C.g50 },
  modalRowTxt: { fontSize: rf(14), color: C.text, fontWeight: '500' },
});

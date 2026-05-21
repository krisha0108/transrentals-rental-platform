// Vendor onboarding / reference guide.
// Mirrors the web /vendor/get-started page. Visible to *all* vendors —
// content adapts based on approval status:
//   - Pending vendor:   "Set Up Your Vendor Account" with progress + step CTAs
//   - Approved vendor:  "How TransRentals Works" reference guide
//
// Content sections (top to bottom on mobile):
//   1. Hero with title, subtitle, progress ring (pending) or verified pill
//   2. Verification Steps card with 3 step rows
//   3. Quick Links list
//   4. Location guide (4 steps)
//   5. Service guide (5 steps)
//   6. "What Unlocks After Approval" feature grid (12 items)
//   7. Help & Support CTA

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorProfile } from '../../api/client';

const C = {
  g950: '#011C16', g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399', g300: '#6EE7B7',
  g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  violet: '#7C3AED', violetL: '#F3E8FF',
  amber: '#D97706', amberL: '#FFFBEB',
  pink: '#EC4899', pinkL: '#FCE7F3',
  orange: '#F97316', orangeL: '#FFF7ED',
  indigo: '#6366F1', indigoL: '#EEF2FF',
};

const QUICK_LINKS = [
  { icon: 'document-text-outline',   label: 'My Documents',     route: 'VendorDocuments', color: C.blue,   bg: C.blueL },
  { icon: 'location-outline',        label: 'Request Location', route: 'VendorLocations', color: C.violet, bg: C.violetL },
  { icon: 'grid-outline',            label: 'Request Service',  route: 'VendorServices',  color: C.g700,   bg: C.g50 },
  { icon: 'car-outline',             label: 'Fleet Management', route: 'FleetListScreen', color: C.orange, bg: C.orangeL },
  { icon: 'people-outline',          label: 'Staff & Drivers',  route: 'StaffListScreen', color: C.pink,   bg: C.pinkL },
  { icon: 'help-circle-outline',     label: 'Help & Support',   route: 'HelpSupportScreen', color: C.amber, bg: C.amberL },
];

const LOCATION_STEPS = [
  { icon: 'search-outline',    color: C.blue,   title: 'Open Location Request', desc: 'Go to Locations in the dashboard to start a request.' },
  { icon: 'location-outline',  color: C.violet, title: 'Search & Select Cities', desc: 'Search by city name and pick all areas you operate or plan to.' },
  { icon: 'send-outline',      color: C.indigo, title: 'Submit the Request',     desc: "Admin reviews in 24–48 hrs. You'll get a notification on approval." },
  { icon: 'thumbs-up-outline', color: C.g600,   title: 'Go Live in That City',   desc: 'Customers from approved cities can find and book you instantly.' },
];

const SERVICE_STEPS = [
  { icon: 'book-outline',     color: C.g600,   title: 'Open Service Request',   desc: 'Go to Services in the dashboard to start a service request.' },
  { icon: 'search-outline',   color: '#0D9488', title: 'Pick Your Services',     desc: 'Bike, Self-Drive, Car, Bus, Packers, Truck, Equipment, Luxury — pick all that apply.' },
  { icon: 'business-outline', color: '#0891B2', title: 'Add Fleet & Experience', desc: 'Fleet size, years in business, certifications. More detail = faster approval.' },
  { icon: 'send-outline',     color: C.blue,    title: 'Submit & Wait',          desc: 'Admin reviews within 24–48 hrs and notifies you.' },
  { icon: 'flash-outline',    color: C.violet,  title: 'Start Getting Requests', desc: 'Customers searching in your city see your listing and send quote requests.' },
];

const FEATURES = [
  { emoji: '📥', title: 'Quote Requests',     desc: 'Receive and respond to customer trip requests with pricing.' },
  { emoji: '📅', title: 'Bookings',           desc: 'Accept and manage all confirmed bookings end-to-end.' },
  { emoji: '🚗', title: 'Fleet Management',   desc: 'Add vehicles, set availability, upload documents.' },
  { emoji: '👥', title: 'Staff & Drivers',    desc: 'Add drivers, track attendance, run payroll.' },
  { emoji: '💰', title: 'Earnings & Payouts', desc: 'Track revenue and receive payouts directly to your bank.' },
  { emoji: '🤝', title: 'P2P Marketplace',    desc: 'Share excess capacity and bookings with other vendors.' },
  { emoji: '🗺️', title: 'Wander Tours',       desc: 'Create and sell curated travel packages to tourists.' },
  { emoji: '🏢', title: 'B2B Corporate',      desc: 'Handle bulk corporate travel and long-term contracts.' },
  { emoji: '📊', title: 'Analytics',          desc: 'Revenue trends, booking stats, and performance insights.' },
  { emoji: '💬', title: 'Customer Chats',     desc: 'Communicate directly with customers from the dashboard.' },
  { emoji: '🔗', title: 'Booking Links',      desc: 'Generate sharable links to take direct bookings anywhere.' },
  { emoji: '🌐', title: 'Social Network',     desc: 'Connect with vendors, share posts, grow your brand.' },
];

// Progress ring built without SVG — two layered circles with a clipped arc
// via a rotation trick. Keeps the screen dependency-light.
function ProgressRing({ pct }) {
  const size = 92;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: 'rgba(255,255,255,0.15)',
      }} />
      {/* Filled portion — approximated using SVG-less inline arc proxy: a
          rotated semi-transparent overlay. Visual approximation, not perfect.
          For ≥50% the visual matches well enough on small ring sizes. */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: 'transparent',
        borderTopColor: C.g300, borderRightColor: pct >= 50 ? C.g300 : 'transparent',
        transform: [{ rotate: `${(pct / 100) * 360 - 90}deg` }],
      }} />
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{pct}%</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>DONE</Text>
    </View>
  );
}

export default function GetStartedScreen({ navigation }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getVendorProfile();
        setVendor(res?.data || null);
      } catch {
        // best-effort — still show the static guide content
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isApproved = vendor?.status === 'APPROVED';
  const docsDone   = (vendor?.documentsCount ?? vendor?.documents?.length ?? 0) > 0;
  const locsDone   = (vendor?.locationRequestsCount ?? 0) > 0;
  const svcsDone   = (vendor?.serviceRequestsCount ?? 0) > 0;
  const doneCount  = [docsDone, locsDone, svcsDone].filter(Boolean).length;
  const pct        = isApproved ? 100 : Math.round((doneCount / 3) * 100);

  const steps = [
    {
      n: 1, icon: 'document-text', color: C.blue,
      title: 'Upload Documents',  sub: 'PAN, address proof, business docs',
      done: docsDone || isApproved,
      active: !docsDone && !isApproved,
      route: 'VendorDocuments',
      cta: docsDone ? 'View Documents' : 'Upload Now',
    },
    {
      n: 2, icon: 'location', color: C.violet,
      title: 'Request Locations', sub: 'Cities where you operate',
      done: locsDone || isApproved,
      active: docsDone && !locsDone && !isApproved,
      route: 'VendorLocations',
      cta: locsDone ? 'View Requests' : 'Request Now',
    },
    {
      n: 3, icon: 'construct', color: C.g600,
      title: 'Request Services',  sub: 'Bike, car, trucks & more',
      done: svcsDone || isApproved,
      active: locsDone && !svcsDone && !isApproved,
      route: 'VendorServices',
      cta: svcsDone ? 'View Requests' : 'Request Now',
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.g600} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      {/* ── HERO ── */}
      <LinearGradient colors={[C.g950, C.g900, C.g800]} style={s.hero}>
        <SafeAreaView edges={['top']}>
          <View style={s.heroTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.heroPill}>
              <Ionicons name="sparkles" size={11} color={C.g300} />
              <Text style={s.heroPillTxt}>{isApproved ? 'Reference Guide' : 'Getting Started'}</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          <View style={s.heroBody}>
            <Text style={s.heroTitle}>
              {isApproved ? 'How TransRentals Works' : 'Set Up Your Vendor Account'}
            </Text>
            <Text style={s.heroSub}>
              {isApproved
                ? 'A complete reference for managing services, fleet, bookings and more.'
                : 'Complete 3 quick steps to get verified and start receiving booking requests.'}
            </Text>

            {!isApproved ? (
              <View style={s.heroProgressRow}>
                <ProgressRing pct={pct} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={s.progressLabel}>{doneCount} of 3 steps complete</Text>
                  <View style={s.stepPills}>
                    {steps.map((st) => (
                      <View
                        key={st.n}
                        style={[
                          s.stepPill,
                          st.done && s.stepPillDone,
                          st.active && s.stepPillActive,
                        ]}
                      >
                        {st.done ? (
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        ) : (
                          <Text style={s.stepPillNum}>{st.n}</Text>
                        )}
                        <Text
                          style={[
                            s.stepPillTxt,
                            st.done && s.stepPillTxtDone,
                            st.active && { color: '#fff' },
                          ]}
                          numberOfLines={1}
                        >
                          {st.title.split(' ')[1] || st.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={C.g300} />
                <Text style={s.verifiedTxt}>Account Verified & Active</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── VERIFICATION STEPS ── */}
        <View style={s.sectionHead}>
          <Ionicons name="shield-checkmark" size={16} color={C.g700} />
          <Text style={s.sectionTitle}>
            {isApproved ? 'Verification Complete' : 'Verification Steps'}
          </Text>
          {isApproved && <Ionicons name="checkmark-circle" size={16} color={C.g500} style={{ marginLeft: 'auto' }} />}
        </View>
        <View style={s.card}>
          {steps.map((step, i) => (
            <View key={step.n}>
              <View
                style={[
                  s.stepRow,
                  step.done   && s.stepRowDone,
                  step.active && s.stepRowActive,
                ]}
              >
                <View style={[s.stepIcon, { backgroundColor: step.color }]}>
                  {step.done ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Ionicons name={step.icon} size={18} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.stepTitle, step.done && { color: C.g700 }]}>{step.title}</Text>
                    {step.active && (
                      <View style={s.nextBadge}>
                        <Text style={s.nextBadgeTxt}>NEXT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.stepSub}>{step.sub}</Text>
                </View>
                <TouchableOpacity
                  style={[s.stepCta, step.done && s.stepCtaDone]}
                  onPress={() => navigation.navigate(step.route)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.stepCtaTxt, step.done && { color: C.g700 }]}>{step.cta}</Text>
                  <Ionicons name="chevron-forward" size={13} color={step.done ? C.g700 : '#fff'} />
                </TouchableOpacity>
              </View>
              {i < steps.length - 1 && <View style={s.connector} />}
            </View>
          ))}

          {!isApproved && doneCount === 3 && (
            <View style={s.reviewNotice}>
              <Ionicons name="time-outline" size={14} color={C.amber} />
              <Text style={s.reviewNoticeTxt}>
                <Text style={{ fontWeight: '800' }}>Under review.</Text> Approval usually takes 1–2 business days.
              </Text>
            </View>
          )}
        </View>

        {/* ── QUICK LINKS ── */}
        <View style={s.sectionHead}>
          <Ionicons name="flash" size={16} color={C.g700} />
          <Text style={s.sectionTitle}>Quick Links</Text>
        </View>
        <View style={s.card}>
          {QUICK_LINKS.map((link, i) => (
            <TouchableOpacity
              key={link.label}
              style={[s.linkRow, i < QUICK_LINKS.length - 1 && s.linkBorder]}
              onPress={() => navigation.navigate(link.route)}
              activeOpacity={0.7}
            >
              <View style={[s.linkIcon, { backgroundColor: link.bg }]}>
                <Ionicons name={link.icon} size={16} color={link.color} />
              </View>
              <Text style={s.linkLabel}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── HOW TO REQUEST LOCATIONS ── */}
        <View style={s.sectionHead}>
          <View style={[s.sectionIcon, { backgroundColor: C.blue }]}>
            <Ionicons name="location" size={11} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>Request Locations</Text>
            <Text style={s.sectionSub}>How to get city access</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('VendorLocations')}
            style={s.openLink}
            activeOpacity={0.8}
          >
            <Text style={[s.openLinkTxt, { color: C.blue }]}>Open</Text>
            <Ionicons name="arrow-forward" size={10} color={C.blue} />
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {LOCATION_STEPS.map((step, i) => (
            <View key={step.title} style={s.guideRow}>
              <View style={s.guideLeft}>
                <View style={[s.guideIcon, { backgroundColor: step.color }]}>
                  <Ionicons name={step.icon} size={14} color="#fff" />
                </View>
                {i < LOCATION_STEPS.length - 1 && <View style={s.guideConnector} />}
              </View>
              <View style={{ flex: 1, paddingBottom: i === LOCATION_STEPS.length - 1 ? 0 : 16 }}>
                <Text style={s.guideStep}>STEP {i + 1}</Text>
                <Text style={s.guideTitle}>{step.title}</Text>
                <Text style={s.guideDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
          <View style={[s.tip, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
            <Ionicons name="information-circle" size={14} color={C.blue} />
            <Text style={[s.tipTxt, { color: '#1E40AF' }]}>
              <Text style={{ fontWeight: '800' }}>Tip:</Text> Request multiple cities at once where you have fleet ready.
            </Text>
          </View>
        </View>

        {/* ── HOW TO REQUEST SERVICES ── */}
        <View style={s.sectionHead}>
          <View style={[s.sectionIcon, { backgroundColor: C.g600 }]}>
            <Ionicons name="construct" size={11} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>Request Services</Text>
            <Text style={s.sectionSub}>How to get service approval</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('VendorServices')}
            style={s.openLink}
            activeOpacity={0.8}
          >
            <Text style={[s.openLinkTxt, { color: C.g700 }]}>Open</Text>
            <Ionicons name="arrow-forward" size={10} color={C.g700} />
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {SERVICE_STEPS.map((step, i) => (
            <View key={step.title} style={s.guideRow}>
              <View style={s.guideLeft}>
                <View style={[s.guideIcon, { backgroundColor: step.color }]}>
                  <Ionicons name={step.icon} size={14} color="#fff" />
                </View>
                {i < SERVICE_STEPS.length - 1 && <View style={s.guideConnector} />}
              </View>
              <View style={{ flex: 1, paddingBottom: i === SERVICE_STEPS.length - 1 ? 0 : 16 }}>
                <Text style={s.guideStep}>STEP {i + 1}</Text>
                <Text style={s.guideTitle}>{step.title}</Text>
                <Text style={s.guideDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
          <View style={[s.tip, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <Ionicons name="information-circle" size={14} color={C.g600} />
            <Text style={[s.tipTxt, { color: '#065F46' }]}>
              <Text style={{ fontWeight: '800' }}>Tip:</Text> Only request services you can fulfill right away. Quick responders rank higher.
            </Text>
          </View>
        </View>

        {/* ── WHAT UNLOCKS AFTER APPROVAL ── */}
        <View style={s.sectionHead}>
          <View style={[s.sectionIcon, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="star" size={11} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>What Unlocks After Approval</Text>
            <Text style={s.sectionSub}>Everything you get once verified</Text>
          </View>
          {isApproved && (
            <View style={s.unlockedPill}>
              <Text style={s.unlockedPillTxt}>ALL UNLOCKED</Text>
            </View>
          )}
        </View>
        <View style={s.featuresGrid}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={[
                s.featureCard,
                isApproved ? { borderColor: C.g100, backgroundColor: C.g50 } : null,
              ]}
            >
              <View style={s.featureLockWrap}>
                {isApproved ? (
                  <Ionicons name="checkmark-circle" size={13} color={C.g500} />
                ) : (
                  <Ionicons name="lock-closed" size={11} color={C.muted} />
                )}
              </View>
              <Text style={s.featureEmoji}>{f.emoji}</Text>
              <Text style={[s.featureTitle, isApproved && { color: '#065F46' }]}>{f.title}</Text>
              <Text style={s.featureDesc} numberOfLines={3}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── HELP CTA ── */}
        <View style={s.helpCard}>
          <View style={s.helpIconBox}>
            <Ionicons name="help-circle" size={26} color="#fff" />
          </View>
          <Text style={s.helpTitle}>Need help getting started?</Text>
          <Text style={s.helpSub}>Our support team responds within a few hours on business days.</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HelpSupportScreen')}
            style={s.helpBtn}
            activeOpacity={0.85}
          >
            <Text style={s.helpBtnTxt}>Contact Support</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  /* Hero */
  hero: { paddingHorizontal: 16, paddingBottom: 22 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  heroPillTxt: { color: C.g300, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  heroBody: { paddingTop: 10 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.4, lineHeight: 30 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19, marginTop: 6 },
  heroProgressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  stepPills: { gap: 6 },
  stepPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999,
  },
  stepPillDone:   { backgroundColor: 'rgba(52,211,153,0.18)', borderColor: 'rgba(52,211,153,0.4)' },
  stepPillActive: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' },
  stepPillNum: { color: '#fff', fontSize: 10, fontWeight: '900', width: 12, textAlign: 'center' },
  stepPillTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700' },
  stepPillTxtDone: { color: C.g300, textDecorationLine: 'line-through' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
  },
  verifiedTxt: { color: C.g300, fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  /* Scroll */
  scroll: { padding: 16 },

  /* Section headers */
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4, paddingHorizontal: 2 },
  sectionIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  sectionSub: { fontSize: 11, color: C.muted, fontWeight: '600' },

  /* Cards */
  card: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },

  /* Verification step rows */
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, padding: 12,
  },
  stepRowDone:   { backgroundColor: C.g50, borderColor: C.g100 },
  stepRowActive: { backgroundColor: C.blueL, borderColor: '#BFDBFE' },
  stepIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  stepSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  nextBadge: { backgroundColor: C.blue, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  nextBadgeTxt: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  stepCta: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.g700, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  stepCtaDone: { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  stepCtaTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  connector: { width: 2, height: 8, backgroundColor: C.border, marginLeft: 24, marginVertical: 2 },
  reviewNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: C.amberL, borderWidth: 1, borderColor: '#FCD34D',
    padding: 10, borderRadius: 10, marginTop: 10,
  },
  reviewNoticeTxt: { flex: 1, fontSize: 11, color: '#92400E', lineHeight: 16 },

  /* Quick links */
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4, gap: 12 },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  linkIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  openLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100, marginLeft: 'auto' },
  openLinkTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  /* Guide steps */
  guideRow: { flexDirection: 'row', gap: 12 },
  guideLeft: { alignItems: 'center' },
  guideIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guideConnector: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 4 },
  guideStep: { fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 1 },
  guideTitle: { fontSize: 12, fontWeight: '800', color: C.text, marginTop: 1 },
  guideDesc: { fontSize: 11, color: C.sub, lineHeight: 16, marginTop: 2 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 6 },
  tipTxt: { flex: 1, fontSize: 11, lineHeight: 16 },

  /* Features grid */
  unlockedPill: { backgroundColor: C.g100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginLeft: 'auto' },
  unlockedPillTxt: { color: C.g700, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  featureCard: {
    width: '48%',
    padding: 14, borderRadius: 14, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  featureLockWrap: { position: 'absolute', top: 8, right: 8 },
  featureEmoji: { fontSize: 26, marginBottom: 6 },
  featureTitle: { fontSize: 11, fontWeight: '800', color: C.text, textAlign: 'center' },
  featureDesc: { fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 14, marginTop: 3 },

  /* Help card */
  helpCard: {
    backgroundColor: C.blueL, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  helpIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  helpTitle: { fontSize: 14, fontWeight: '800', color: '#1E3A8A', marginBottom: 3 },
  helpSub: { fontSize: 12, color: '#3B82F6', textAlign: 'center', lineHeight: 17, marginBottom: 14 },
  helpBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12 },
  helpBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
});

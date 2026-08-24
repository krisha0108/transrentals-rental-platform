import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorProfile, getBaseURL } from '../../api/client';
import { SC as T, G, rs, shade, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50:  T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
  orange: T.orange, orangeL: T.orangeL,
  indigo: T.indigo, indigoL: T.indigoLight,
  teal: T.emerald, tealL: T.tintEmerald,
};

export default function BusinessProfileScreen({ navigation }) {
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile]       = useState(null);
  const [baseURL, setBaseURL]       = useState('');

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

  useEffect(() => {
    getBaseURL().then(url => setBaseURL(url));
  }, []);

  const getFullImageURL = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (!baseURL) return null;
    return `${baseURL}${url}`;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getVendorProfile();
      setProfile(data);
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const logoUrl = getFullImageURL(profile?.logo);
  const initials = (profile?.businessName || 'B').charAt(0).toUpperCase();

  // ── Info Card Row ──
  const InfoRow = ({ icon, label, value, color = C.g700, bg = C.g50, last = false }) => {
    if (!value) return null;
    return (
      <View style={[st.infoRow, last && { borderBottomWidth: 0 }]}>
        <View style={[st.infoIconBox, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={17} color={color} />
        </View>
        <View style={st.infoContent}>
          <Text style={st.infoLabel}>{label}</Text>
          <Text style={st.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.heroLoading}>
          <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16 }}>
            <View style={st.heroNav}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={st.heroMid}>
                <View style={st.heroBadge}>
                  <MaterialCommunityIcons name="domain" size={11} color={C.g400} />
                  <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
                </View>
                <Text style={st.heroTitle}>Business Profile</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={st.loaderTxt}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER — static sibling so it can never be clipped by the
          ScrollView's own viewport (the bug fixed elsewhere this session) ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
        <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16 }}>
          {/* Top nav */}
          <View style={st.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={st.heroMid}>
              <View style={st.heroBadge}>
                <MaterialCommunityIcons name="domain" size={11} color={C.g400} />
                <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
              </View>
              <Text style={st.heroTitle}>Business Profile</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Logo + Name */}
          <View style={st.heroBody}>
            {logoUrl ? (
              <View style={st.logoWrap}>
                <Image source={{ uri: logoUrl }} style={st.logo} resizeMode="cover" />
              </View>
            ) : (
              <LinearGradient colors={[C.g600, C.g500]} style={st.logoPlaceholder}>
                <Text style={st.logoInitial}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={st.heroTextBox}>
              <Text style={st.heroName}>{profile?.businessName || '—'}</Text>
              {profile?.businessType && (
                <View style={st.typeChip}>
                  <MaterialCommunityIcons name="briefcase-outline" size={11} color={C.g400} />
                  <Text style={st.typeChipTxt}>{profile.businessType}</Text>
                </View>
              )}
              {profile?.gstNumber && (
                <Text style={st.gstTxt}>GST: {profile.gstNumber}</Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={st.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {/* ── CONTACT INFO ── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <View style={[st.sectionIconBox, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="account-circle-outline" size={18} color={C.g700} />
            </View>
            <Text style={st.sectionTitle}>Contact Information</Text>
          </View>
          <InfoRow icon="account-outline"   label="Owner Name" value={profile?.ownerName} color={C.g700}   bg={C.g50} />
          <InfoRow icon="email-outline"     label="Email"      value={profile?.email}     color={C.blue}   bg={C.blueL} />
          <InfoRow icon="phone-outline"     label="Phone"      value={profile?.phone}     color={C.g700}   bg={C.g50} last />
        </View>

        {/* ── BUSINESS DETAILS ── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <View style={[st.sectionIconBox, { backgroundColor: C.indigoL }]}>
              <MaterialCommunityIcons name="office-building-outline" size={18} color={C.indigo} />
            </View>
            <Text style={st.sectionTitle}>Business Details</Text>
          </View>
          <InfoRow icon="file-document-outline" label="GST Number" value={profile?.gstNumber} color={C.indigo}  bg={C.indigoL} />
          <InfoRow icon="card-account-details-outline" label="PAN Number" value={profile?.panNumber} color={C.purple} bg={C.purpleL} last />
        </View>

        {/* ── ADDRESS ── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <View style={[st.sectionIconBox, { backgroundColor: C.orangeL }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={C.orange} />
            </View>
            <Text style={st.sectionTitle}>Business Address</Text>
          </View>

          {profile?.address && (
            <View style={[st.infoRow]}>
              <View style={[st.infoIconBox, { backgroundColor: C.orangeL }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={17} color={C.orange} />
              </View>
              <View style={st.infoContent}>
                <Text style={st.infoLabel}>Address</Text>
                <Text style={st.infoValue}>{profile.address}</Text>
              </View>
            </View>
          )}

          {/* City + Pincode chips */}
          {(profile?.city || profile?.pincode) && (
            <View style={st.chipRow}>
              {profile?.city && (
                <View style={[st.chip, { backgroundColor: C.tealL, borderColor: C.teal + '30' }]}>
                  <MaterialCommunityIcons name="city-variant-outline" size={13} color={C.teal} />
                  <View>
                    <Text style={[st.chipLabel, { color: C.teal }]}>City</Text>
                    <Text style={[st.chipValue, { color: C.teal }]}>{profile.city}</Text>
                  </View>
                </View>
              )}
              {profile?.pincode && (
                <View style={[st.chip, { backgroundColor: C.blueL, borderColor: C.blue + '30' }]}>
                  <MaterialCommunityIcons name="numeric" size={13} color={C.blue} />
                  <View>
                    <Text style={[st.chipLabel, { color: C.blue }]}>Pincode</Text>
                    <Text style={[st.chipValue, { color: C.blue }]}>{profile.pincode}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          <InfoRow icon="map-outline" label="State" value={profile?.state} color={C.orange} bg={C.orangeL} last />
        </View>

        {/* ── ADDITIONAL INFO ── */}
        {(profile?.website || profile?.description) && (
          <View style={st.section}>
            <View style={st.sectionHead}>
              <View style={[st.sectionIconBox, { backgroundColor: C.amberL }]}>
                <MaterialCommunityIcons name="information-outline" size={18} color={C.amber} />
              </View>
              <Text style={st.sectionTitle}>Additional Information</Text>
            </View>
            <InfoRow icon="web" label="Website" value={profile?.website} color={C.blue} bg={C.blueL} />
            {profile?.description && (
              <View style={[st.infoRow, { borderBottomWidth: 0 }]}>
                <View style={[st.infoIconBox, { backgroundColor: C.amberL }]}>
                  <MaterialCommunityIcons name="text" size={17} color={C.amber} />
                </View>
                <View style={st.infoContent}>
                  <Text style={st.infoLabel}>Description</Text>
                  <Text style={[st.infoValue, { lineHeight: 22 }]}>{profile.description}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 20 },

  /* ── Hero ── */
  hero: {
    paddingBottom: rs(22),
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
    overflow: 'hidden',
  },
  heroLoading: {
    paddingBottom: rs(18),
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute', top: -rs(50), right: -rs(40), width: rs(180), height: rs(180),
    borderRadius: rs(90), backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbB: {
    position: 'absolute', top: rs(10), left: -rs(55), width: rs(140), height: rs(140),
    borderRadius: rs(70), backgroundColor: 'rgba(46,158,119,0.14)',
  },

  heroNav: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6, marginBottom: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 2,
  },
  heroMid:      { flex: 1 },
  heroBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(82, 231, 122, 0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 5,
    borderWidth: 1, borderColor: 'rgba(82, 231, 122, 0.35)',
  },
  heroBadgeTxt: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700', color: '#52e77a' },
  heroTitle:    { fontFamily: DISPLAY, fontSize: 24, fontWeight: '800', color: '#fff' },

  /* Logo + name */
  heroBody:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoWrap:        {
    width: 76, height: 76, borderRadius: 20,
    overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  logo:            { width: 76, height: 76 },
  logoPlaceholder: {
    width: 76, height: 76, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoInitial:     { fontFamily: DISPLAY, fontSize: 30, fontWeight: '800', color: '#fff' },
  heroTextBox:     { flex: 1 },
  heroName:        { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 6 },
  typeChip:        {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 5,
  },
  typeChipTxt:     { fontSize: 11, fontWeight: '600', color: C.g400 },
  gstTxt:          { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  /* ── Sections ── */
  section: {
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 14,
    borderRadius: rs(18), borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: shade(C.card, -1.5),
  },
  sectionIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: C.text },

  /* Info Row */
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
    flexShrink: 0,
  },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue:   { fontFamily: DISPLAY, fontSize: 14, fontWeight: '600', color: C.text },

  /* City + Pincode chips */
  chipRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  chipLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  chipValue: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },

  /* Loader */
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loaderTxt:  { fontSize: 14, color: C.muted },
});

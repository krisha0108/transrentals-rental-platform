import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getVendorProfile, logoutVendor, uploadVendorLogo, getBaseURL } from '../../api/client';
import { showConfirm, showError, showSuccess } from '../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g300: '#6EE7B7', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

const MENU_SECTIONS = [
  {
    section: 'Account',
    icon: 'account-circle-outline',
    items: [
      { name: 'Business Profile',  icon: 'briefcase',    mcIcon: 'domain',               route: 'BusinessProfileScreen', color: C.g700,   bg: C.g50 },
      { name: 'Documents',         icon: 'file-text',    mcIcon: 'file-document-outline', route: 'VendorDocuments',       color: C.blue,   bg: C.blueL },
      { name: 'Bank Details',      icon: 'credit-card',  mcIcon: 'bank-outline',          route: 'BankDetailsScreen',     color: C.indigo, bg: C.indigoL },
    ],
  },
  {
    section: 'Services',
    icon: 'view-grid-outline',
    items: [
      { name: 'My Services',  icon: 'layers',   mcIcon: 'car-multiple',  route: 'VendorServices',   color: C.purple, bg: C.purpleL },
      { name: 'My Locations', icon: 'map-pin',  mcIcon: 'map-marker-outline', route: 'VendorLocations',  color: C.orange, bg: C.orangeL },
    ],
  },
  {
    section: 'Support',
    icon: 'headset',
    items: [
      { name: 'Help & Support', icon: 'help-circle', mcIcon: 'help-circle-outline', route: 'HelpSupportScreen', color: C.amber, bg: C.amberL },
      { name: 'About Us',       icon: 'info',        mcIcon: 'information-outline',  route: 'AboutUsScreen',    color: C.g700,  bg: C.g50 },
    ],
  },
];

const STATUS_META = {
  APPROVED:           { label: 'Verified',         color: C.g700,   bg: C.g50,    icon: 'check-circle',           mcIcon: 'check-decagram' },
  DOCUMENTS_PENDING:  { label: 'Docs Pending',      color: C.amber,  bg: C.amberL, icon: 'alert-circle',           mcIcon: 'file-clock-outline' },
  PENDING:            { label: 'Pending Review',    color: C.amber,  bg: C.amberL, icon: 'clock',                  mcIcon: 'timer-sand' },
  UNDER_REVIEW:       { label: 'Under Review',      color: C.blue,   bg: C.blueL,  icon: 'eye',                    mcIcon: 'magnify-scan' },
  REJECTED:           { label: 'Rejected',          color: C.red,    bg: C.redL,   icon: 'x-circle',               mcIcon: 'close-circle-outline' },
};

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile]     = useState(null);
  const [baseURL, setBaseURL]     = useState('');

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
      console.log('Profile fetch error:', e);
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

  const handleUpdateProfileImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024 });
      if (result.didCancel) return;
      if (result.errorCode) { showError(result.errorMessage || 'Failed to pick image'); return; }
      const asset = result.assets?.[0];
      if (!asset?.uri) { showError('No image selected'); return; }
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { showError('Image size must be less than 5MB'); return; }

      setUploading(true);
      const formData = new FormData();
      const fileUri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
      formData.append('logo', { uri: fileUri, type: asset.type || 'image/jpeg', name: asset.fileName || `logo-${Date.now()}.jpg` });
      const response = await uploadVendorLogo(formData);
      if (response.success) {
        setProfile({ ...profile, logo: response.logo });
        showSuccess('Profile image updated!');
      }
    } catch (e) {
      showError(e?.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', async () => {
      try {
        await logoutVendor();
        navigation.reset({ index: 0, routes: [{ name: 'VendorLoginScreen' }] });
      } catch (e) { console.log('Logout error:', e); }
    }, { confirmText: 'Logout', destructive: true });
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroSkeleton}>
          <View style={st.heroTopRow}>
            <Text style={st.heroTitle}>My Profile</Text>
          </View>
        </LinearGradient>
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={st.loaderTxt}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusKey = profile?.status || 'PENDING';
  const statusMeta = STATUS_META[statusKey] || STATUS_META.PENDING;
  const logoUrl = getFullImageURL(profile?.logo);
  const initials = (profile?.businessName || 'V').charAt(0).toUpperCase();

  const stats = [
    { value: profile?.fleetsCount || 0,              label: 'Vehicles',  icon: 'car-multiple',       color: C.g700,   bg: C.g50 },
    { value: profile?.approvedServicesCount || 0,    label: 'Services',  icon: 'view-grid',           color: C.blue,   bg: C.blueL },
    { value: profile?.approvedLocationsCount || 0,   label: 'Locations', icon: 'map-marker-outline',  color: C.orange, bg: C.orangeL },
    { value: profile?.rating?.toFixed(1) || '--',    label: 'Rating',    icon: 'star',                color: C.amber,  bg: C.amberL },
  ];

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >

        {/* ── HERO ── */}
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
          {/* Decorative blobs */}
          <View style={[st.blob, { width: 200, height: 200, top: -80, right: -60, opacity: 0.07 }]} />
          <View style={[st.blob, { width: 100, height: 100, top: 20, left: -30, opacity: 0.05 }]} />
          <View style={[st.blob, { width: 60,  height: 60,  bottom: 10, right: 80, opacity: 0.04 }]} />

          {/* Top row */}
          <View style={st.heroTopRow}>
            <View>
              <View style={st.heroBadge}>
                <MaterialCommunityIcons name="store-check" size={11} color={C.g400} />
                <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
              </View>
              <Text style={st.heroTitle}>My Profile</Text>
            </View>
            <TouchableOpacity style={st.settingsBtn} onPress={() => navigation.navigate('BusinessProfileScreen')}>
              <Icon name="settings" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          {/* Avatar + Info */}
          <View style={st.heroBody}>
            {/* Avatar */}
            <TouchableOpacity style={st.avatarWrap} onPress={handleUpdateProfileImage} disabled={uploading}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={st.avatar} />
              ) : (
                <LinearGradient colors={[C.g600, C.g500]} style={st.avatarPlaceholder}>
                  <Text style={st.avatarInitial}>{initials}</Text>
                </LinearGradient>
              )}
              <LinearGradient colors={[C.g600, C.g500]} style={st.cameraBadge}>
                {uploading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="camera" size={12} color="#fff" />
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Name & Status */}
            <View style={st.heroInfo}>
              <Text style={st.heroName} numberOfLines={1}>{profile?.businessName || 'Business Name'}</Text>
              <Text style={st.heroOwner} numberOfLines={1}>{profile?.ownerName || 'Owner Name'}</Text>

              {/* Status pill */}
              <View style={[st.statusPill, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialCommunityIcons name={statusMeta.mcIcon} size={12} color={statusMeta.color === C.g700 ? C.g400 : '#fff'} />
                <Text style={[st.statusTxt, { color: statusMeta.color === C.g700 ? C.g400 : '#fff' }]}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact strip */}
          <View style={st.contactStrip}>
            <View style={st.contactItem}>
              <Icon name="mail" size={12} color="rgba(255,255,255,0.5)" />
              <Text style={st.contactTxt} numberOfLines={1}>{profile?.email || '—'}</Text>
            </View>
            <View style={st.contactDot} />
            <View style={st.contactItem}>
              <Icon name="phone" size={12} color="rgba(255,255,255,0.5)" />
              <Text style={st.contactTxt}>{profile?.phone || '—'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── STATS ── */}
        <View style={st.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={st.statCard}>
              <View style={[st.statIconBox, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={st.statValue}>{s.value}</Text>
              <Text style={st.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── MENU SECTIONS ── */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={st.section}>
            {/* Section header */}
            <View style={st.sectionHead}>
              <MaterialCommunityIcons name={section.icon} size={14} color={C.g600} />
              <Text style={st.sectionTitle}>{section.section}</Text>
            </View>

            <View style={st.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[st.menuRow, ii < section.items.length - 1 && st.menuRowBorder]}
                  onPress={() => item.route && navigation.navigate(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={[st.menuIconBox, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.mcIcon} size={18} color={item.color} />
                  </View>
                  <Text style={st.menuLabel}>{item.name}</Text>
                  <View style={st.menuArrow}>
                    <Icon name="chevron-right" size={16} color={C.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={['#FEE2E2', '#FECACA']} style={st.logoutGrad}>
            <View style={st.logoutIconBox}>
              <Icon name="log-out" size={18} color={C.red} />
            </View>
            <Text style={st.logoutTxt}>Logout</Text>
            <Icon name="chevron-right" size={16} color={C.red} style={{ marginLeft: 'auto' }} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── VERSION ── */}
        <View style={st.versionRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color={C.g500} />
          <Text style={st.versionTxt}>TransRentals Vendor · v2.8</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  heroSkeleton: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  blob: {
    position: 'absolute', borderRadius: 999, backgroundColor: '#fff',
  },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6,
  },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.g400 },
  heroTitle:    { fontSize: 26, fontWeight: '800', color: '#fff' },
  settingsBtn:  {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 4,
  },

  /* Avatar */
  heroBody:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 80, height: 80, borderRadius: 22, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)' },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.g800,
  },

  /* Info */
  heroInfo:  { flex: 1 },
  heroName:  { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroOwner: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1,
  },
  statusTxt: { fontSize: 11, fontWeight: '700' },

  /* Contact strip */
  contactStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 8,
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  contactTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500', flex: 1 },
  contactDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },

  /* ── Stats Grid ── */
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 16, gap: 10,
  },
  statCard: {
    width: '22%', flex: 1,
    backgroundColor: C.card, borderRadius: 16,
    alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 3 },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textAlign: 'center' },

  /* ── Sections ── */
  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.g700, textTransform: 'uppercase', letterSpacing: 0.5 },

  menuCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconBox:   {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  menuArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },

  /* ── Logout ── */
  logoutBtn:  { marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  logoutGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  logoutIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#FECACA', alignItems: 'center', justifyContent: 'center',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: C.red },

  /* ── Version ── */
  versionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20,
  },
  versionTxt: { fontSize: 12, color: C.muted, fontWeight: '500' },

  /* ── Loader ── */
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loaderTxt:  { fontSize: 14, color: C.muted },
});

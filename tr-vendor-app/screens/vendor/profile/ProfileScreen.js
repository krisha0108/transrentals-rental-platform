import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Platform, StatusBar, Modal, Animated, Easing,
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
    section: 'Finance',
    icon: 'wallet-outline',
    items: [
      { name: 'Earnings',   icon: 'trending-up', mcIcon: 'cash-multiple',     route: 'EarningsScreen', color: C.g700,   bg: C.g50 },
      { name: 'Financials', icon: 'bar-chart-2', mcIcon: 'chart-box-outline', route: 'Financials',     color: C.indigo, bg: C.indigoL },
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
  const [showCardModal, setShowCardModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

  useEffect(() => {
    getBaseURL().then(url => setBaseURL(url));
  }, []);

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 1 : 0,
      duration: 600,
      easing: Easing.bezier(0.4, 0.2, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isFlipped, flipAnim]);

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
              {profile?.vid && (
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10.5, marginTop: 3, fontWeight: '600', letterSpacing: 0.1 }}>ID: {profile.vid}</Text>
              )}

              {/* Status pill + View Card button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 }}>
                <View style={[st.statusPill, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialCommunityIcons name={statusMeta.mcIcon} size={11} color={statusMeta.color === C.g700 ? C.g400 : '#fff'} />
                  <Text style={[st.statusTxt, { color: statusMeta.color === C.g700 ? C.g400 : '#fff', fontSize: 10.5 }]}>
                    {statusMeta.label}
                  </Text>
                </View>

                {profile && (
                  <TouchableOpacity
                    onPress={() => { setIsFlipped(false); setShowCardModal(true); }}
                    activeOpacity={0.7}
                    style={[st.statusPill, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)', borderWidth: 1.2 }]}>
                    <Text style={{ fontSize: 11 }}>🎫</Text>
                    <Text style={[st.statusTxt, { color: '#fff' }]}>Card</Text>
                  </TouchableOpacity>
                )}
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

        {/* ── GET STARTED CTA — visible to all vendors right above Logout
            so it stays one tap from anywhere in the app ── */}
        <TouchableOpacity
          style={st.getStartedBtn}
          onPress={() => navigation.navigate('GetStartedScreen')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[C.blueL, '#DBEAFE']} style={st.getStartedGrad}>
            <View style={st.getStartedIconBox}>
              <MaterialCommunityIcons name="compass-outline" size={20} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.getStartedTxt}>Get Started</Text>
              <Text style={st.getStartedSub}>Setup guide & feature tour</Text>
            </View>
            <Icon name="chevron-right" size={18} color={C.blue} />
          </LinearGradient>
        </TouchableOpacity>

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

      {/* ── FLIP CARD MODAL ── */}
      {showCardModal && (
        <Modal transparent visible={showCardModal} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCardModal(false)} />

            <View style={{ width: '100%', maxWidth: 320 }}>
              <View style={{ height: 420 }}>
                <Animated.View
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: [
                      { perspective: 1000 },
                      {
                        rotateY: flipAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setIsFlipped(!isFlipped)}
                    style={{ width: '100%', height: '100%' }}
                  >
                  {/* FRONT */}
                  <LinearGradient
                    colors={['#064E3B', '#065F46', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: 24,
                      paddingHorizontal: 18,
                      paddingVertical: 16,
                      justifyContent: 'space-between',
                      opacity: isFlipped ? 0 : 1,
                    }}
                  >
                    {/* Top section */}
                    <View style={{ gap: 16 }}>
                      {/* Header bar */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1.2, borderBottomColor: 'rgba(255,255,255,0.15)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.8 }}>TRANSRENTALS</Text>
                        {profile?.status === 'APPROVED' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3.5, backgroundColor: 'rgba(34, 197, 94, 0.25)', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 10, borderWidth: 0.8, borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                            <View style={{ width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: '#22c55e' }} />
                            <Text style={{ fontSize: 7.5, fontWeight: '800', color: '#22c55e', letterSpacing: 0.6 }}>VERIFIED</Text>
                          </View>
                        )}
                      </View>

                      {/* Center hero - Icon */}
                      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 95, height: 95 }}>
                          {/* Glow circles */}
                          <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1.8, borderColor: 'rgba(82, 231, 122, 0.3)' }} />
                          <View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 1.2, borderColor: 'rgba(82, 231, 122, 0.2)' }} />
                          {/* Shield */}
                          <View style={{ width: 65, height: 65, borderRadius: 14, backgroundColor: 'rgba(82, 231, 122, 0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(82, 231, 122, 0.4)', shadowColor: 'rgba(82, 231, 122, 0.5)', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 7 }}>
                            <MaterialCommunityIcons name="shield-check" size={33} color="#52e77a" />
                          </View>
                        </View>

                        {/* Text */}
                        <View style={{ alignItems: 'center', gap: 7 }}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.4 }}>TRANSRENTALS</Text>
                          <View style={{ alignItems: 'center', gap: 0 }}>
                            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.8, lineHeight: 24 }}>TRUSTED</Text>
                            <Text style={{ fontSize: 22, fontWeight: '900', color: '#52e77a', textAlign: 'center', letterSpacing: 0.8, lineHeight: 24 }}>VENDOR</Text>
                          </View>
                          <View style={{ width: 32, height: 1.2, backgroundColor: 'rgba(82, 231, 122, 0.6)', marginTop: 2 }} />
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 0.2, marginTop: 3 }}>{profile?.businessName}</Text>
                          {profile?.vid && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, borderWidth: 0.8, borderColor: 'rgba(82, 231, 122, 0.3)', marginTop: 5 }}>
                              <Text style={{ fontSize: 10, fontWeight: '900', color: '#52e77a', letterSpacing: 1.3 }}>{profile.vid.toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Bottom section */}
                    <View style={{ alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1.2, borderTopColor: 'rgba(255,255,255,0.15)' }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>Tap to flip</Text>
                      <View style={{ flexDirection: 'row', gap: 2.5 }}>
                        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(82, 231, 122, 0.6)' }} />
                        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(82, 231, 122, 0.4)' }} />
                        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(82, 231, 122, 0.2)' }} />
                      </View>
                    </View>
                  </LinearGradient>

                  {/* BACK */}
                  <LinearGradient
                    colors={['#064E3B', '#0a3d31']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: 24,
                      paddingHorizontal: 15,
                      paddingVertical: 14,
                      justifyContent: 'space-between',
                      opacity: isFlipped ? 1 : 0,
                      transform: [{ rotateY: '180deg' }],
                    }}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1.2, borderBottomColor: 'rgba(255,255,255,0.12)', marginBottom: 12 }}>
                        <Text style={{ fontSize: 7.5, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.8 }}>TRANSRENTALS</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: profile?.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.18)' : profile?.status === 'PENDING' ? 'rgba(234, 179, 8, 0.18)' : 'rgba(239, 68, 68, 0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: profile?.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.35)' : profile?.status === 'PENDING' ? 'rgba(234, 179, 8, 0.35)' : 'rgba(239, 68, 68, 0.35)', shadowColor: profile?.status === 'APPROVED' ? '#22c55e' : '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }}>
                          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: profile?.status === 'APPROVED' ? '#22c55e' : profile?.status === 'PENDING' ? '#eab308' : '#ef4444', shadowColor: profile?.status === 'APPROVED' ? '#22c55e' : '#ef4444', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2 }} />
                          <Text style={{ fontSize: 9, fontWeight: '800', color: profile?.status === 'APPROVED' ? '#22c55e' : profile?.status === 'PENDING' ? '#eab308' : '#ef4444', letterSpacing: 0.8 }}>{profile?.status}</Text>
                        </View>
                      </View>

                      {/* Profile strip */}
                      <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 11, paddingHorizontal: 1, borderBottomWidth: 1.2, borderBottomColor: 'rgba(255,255,255,0.12)', marginBottom: 12, backgroundColor: 'rgba(6, 95, 70, 0.25)', borderRadius: 8 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'linear-gradient(135deg, #1FC77A 0%, #16a457 100%)', justifyContent: 'center', alignItems: 'center', shadowColor: '#1FC77A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 }}>
                          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{profile?.businessName?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 }}>{profile?.businessName}</Text>
                          <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{profile?.ownerName}</Text>
                          {profile?.vid && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(82, 231, 122, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.2, borderColor: 'rgba(82, 231, 122, 0.3)', alignSelf: 'flex-start', shadowColor: 'rgba(82, 231, 122, 0.2)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3 }}>
                              <MaterialCommunityIcons name="shield-check" size={10} color="#52e77a" />
                              <Text style={{ fontSize: 10, fontWeight: '900', color: '#52e77a', letterSpacing: 1.2 }}>{profile.vid.toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Details */}
                      <View style={{ gap: 7 }}>
                        {profile?.gstNumber && (
                          <>
                            <View style={{ backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                              <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>GST NO</Text>
                              <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff', letterSpacing: 0.2 }}>{profile.gstNumber}</Text>
                            </View>
                          </>
                        )}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ flex: 1, backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                            <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>PHONE</Text>
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff' }}>{profile?.phone}</Text>
                          </View>
                          {(profile?.city || profile?.state) && (
                            <View style={{ flex: 1, backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                              <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>LOCATION</Text>
                              <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff' }}>{[profile?.city, profile?.state].filter(Boolean).join(', ')}</Text>
                            </View>
                          )}
                        </View>
                        {profile?.email && (
                          <View style={{ backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                            <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>EMAIL</Text>
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff', numberOfLines: 1 }}>{profile.email}</Text>
                          </View>
                        )}
                        {profile?.businessType && (
                          <View style={{ backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                            <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>BUSINESS TYPE</Text>
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff' }}>{profile.businessType}</Text>
                          </View>
                        )}
                      </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 1, borderTopWidth: 1.2, borderTopColor: 'rgba(255,255,255,0.12)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: profile?.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: profile?.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(234, 179, 8, 0.25)' }}>
                        {profile?.status === 'APPROVED' ? (
                          <MaterialCommunityIcons name="check-circle-outline" size={12} color="#22c55e" />
                        ) : (
                          <MaterialCommunityIcons name="clock-outline" size={12} color="#eab308" />
                        )}
                        <Text style={{ fontSize: 10, fontWeight: '700', color: profile?.status === 'APPROVED' ? '#22c55e' : '#eab308', letterSpacing: 0.3 }}>{profile?.status === 'APPROVED' ? 'Verified Vendor' : 'Pending Approval'}</Text>
                      </View>
                      {profile?.createdAt && (
                        <Text style={{ fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>Since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</Text>
                      )}
                    </View>
                    </View>
                  </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <TouchableOpacity onPress={() => setShowCardModal(false)} style={{ marginTop: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 12 }}>Close</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCardModal(false)} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  heroSkeleton: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20,
  },
  blob: {
    position: 'absolute', borderRadius: 999, backgroundColor: '#fff',
  },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 2,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(82, 231, 122, 0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 11, paddingVertical: 5.5, borderRadius: 22, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(82, 231, 122, 0.35)', shadowColor: 'rgba(82, 231, 122, 0.3)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  heroBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#52e77a', letterSpacing: 0.4 },
  heroTitle:    { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  settingsBtn:  {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5,
  },

  /* Avatar */
  heroBody:    { flexDirection: 'row', alignItems: 'flex-start', gap: 15, marginBottom: 16 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 80, height: 80, borderRadius: 22, borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6,
  },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: -5, right: -5,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: C.g800,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3,
  },

  /* Info */
  heroInfo:  { flex: 1, justifyContent: 'flex-start' },
  heroName:  { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 2, letterSpacing: 0.2 },
  heroOwner: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8, fontWeight: '600', letterSpacing: 0.1 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1.1,
  },
  statusTxt: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.15 },

  /* Contact strip */
  contactStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, paddingHorizontal: 15, paddingVertical: 11,
    borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.18)', gap: 9,
    marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5,
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  contactTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', flex: 1, letterSpacing: 0.1 },
  contactDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.3)' },

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

  /* ── Get Started CTA ── */
  getStartedBtn:    { marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  getStartedGrad:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  getStartedIconBox:{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  getStartedTxt:    { fontSize: 14, fontWeight: '800', color: '#1E3A8A' },
  getStartedSub:    { fontSize: 11, color: C.blue, marginTop: 2, fontWeight: '600' },

  /* ── Logout ── */
  logoutBtn:  { marginHorizontal: 16, marginTop: 10, borderRadius: 16, overflow: 'hidden' },
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

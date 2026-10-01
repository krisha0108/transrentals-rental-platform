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
import { getVendorProfile, logoutVendor, uploadVendorLogo, getBaseURL } from '../../api/client';
import { showConfirm, showError } from '../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import { pickCroppedImage } from '../_shared/pickCroppedImage';
import HeroWorldMap from '../_shared/heroWorldMap';

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
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

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
      { name: 'Fleet',        icon: 'truck',    mcIcon: 'garage-variant', route: 'FleetListScreen', color: C.blue,   bg: C.blueL },
      { name: 'Staff',        icon: 'users',    mcIcon: 'account-group-outline', route: 'StaffListScreen', color: C.indigo, bg: C.indigoL },
      { name: 'Reviews',      icon: 'star',     mcIcon: 'star-outline',  route: 'VendorReviews',    color: C.amber,  bg: C.amberL },
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
      const asset = await pickCroppedImage({ circle: true, size: 600 });
      if (!asset) return; // user cancelled the picker or crop screen
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { showError('Image size must be less than 5MB'); return; }

      setUploading(true);
      const formData = new FormData();
      const fileUri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
      formData.append('logo', { uri: fileUri, type: asset.type || 'image/jpeg', name: asset.fileName || `logo-${Date.now()}.jpg` });
      const response = await uploadVendorLogo(formData);
      if (response.success) {
        setProfile({ ...profile, logo: response.logo });
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
      <View style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />

        <View style={st.hero}>
          <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.heroTop}>
            <HeroWorldMap />
            <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16 }}>
              <View style={st.heroTopbar}>
                <View style={st.heroBadge}>
                  <MaterialCommunityIcons name="store-check" size={11} color="#fff" />
                  <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
                </View>
                <View style={st.settingsBtn} />
              </View>

              <View style={st.heroRow}>
                <Bone w={rs(56)} h={rs(56)} r={rs(17)} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                <View style={st.heroInfo}>
                  <Bone w={140} h={16} style={{ backgroundColor: 'rgba(255,255,255,0.22)', marginBottom: 6 }} />
                  <Bone w={100} h={12} style={{ backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 8 }} />
                  <Bone w={80} h={16} r={20} style={{ backgroundColor: 'rgba(255,255,255,0.16)' }} />
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View style={st.heroStatic}>
            <Bone w={160} h={11} style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
          </View>
        </View>

        <View style={st.scrollContent}>
          <View style={st.statsRail}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[st.stat, i !== 3 && st.statDivider]}>
                <Bone w={24} h={24} r={8} style={{ marginBottom: 5 }} />
                <Bone w={26} h={13} style={{ marginBottom: 4 }} />
                <Bone w={40} h={8} />
              </View>
            ))}
          </View>

          {[3, 4, 2, 2].map((rowCount, si) => (
            <View key={si} style={st.section}>
              <Bone w={90} h={11} style={{ marginBottom: 10 }} />
              <View style={st.groupCard}>
                {Array.from({ length: rowCount }).map((_, ii) => (
                  <View key={ii} style={[st.menuRow, ii !== rowCount - 1 && st.menuRowDivider]}>
                    <Bone w={34} h={34} r={10} />
                    <Bone w={120} h={13} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
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
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Header / hero — a single card, edge-to-edge at the top.
          Gradient top (badge, gear, avatar, name, status/rating) + a
          static solid-color panel underneath (VID/email/phone/Card). No
          floating orbs, no separate cover-band + ID-card pieces. ── */}
      <View style={st.hero}>
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.heroTop}>
          <HeroWorldMap />
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16 }}>
            <View style={st.heroTopbar}>
              <View style={st.heroBadge}>
                <MaterialCommunityIcons name="store-check" size={11} color="#fff" />
                <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
              </View>
              <TouchableOpacity style={st.settingsBtn} onPress={() => navigation.navigate('BusinessProfileScreen')}>
                <Icon name="settings" size={15} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            </View>

            <View style={st.heroRow}>
              <TouchableOpacity style={st.avatarWrap} onPress={handleUpdateProfileImage} disabled={uploading}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={st.avatar} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={[C.g600, C.g500]} style={st.avatarPlaceholder}>
                    <Text style={st.avatarInitial}>{initials}</Text>
                  </LinearGradient>
                )}
                <LinearGradient colors={[T.gold, T.goldLight]} style={st.cameraBadge}>
                  {uploading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Icon name="camera" size={9} color="#fff" />
                  }
                </LinearGradient>
              </TouchableOpacity>

              <View style={st.heroInfo}>
                <Text style={st.heroName} numberOfLines={1}>{profile?.businessName || 'Business Name'}</Text>
                <Text style={st.heroOwner} numberOfLines={1}>{profile?.ownerName || 'Owner Name'}</Text>
                <View style={st.heroPills}>
                  <View style={st.pill}>
                    <MaterialCommunityIcons name={statusMeta.mcIcon} size={10} color="#fff" />
                    <Text style={st.pillTxt}>{statusMeta.label}</Text>
                  </View>
                  {profile?.rating != null && (
                    <View style={[st.pill, st.pillRating]}>
                      <MaterialCommunityIcons name="star" size={10} color={T.goldLight} />
                      <Text style={[st.pillTxt, { color: T.goldLight }]}>{profile.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={st.heroStatic}>
          {profile?.vid && (
            <>
              <Text style={st.heroStaticTxt}>ID <Text style={st.heroStaticBold}>{profile.vid}</Text></Text>
              <Text style={st.heroStaticSep}>•</Text>
            </>
          )}
          <Text style={st.heroStaticTxt} numberOfLines={1}>{profile?.email || '—'}</Text>
          <Text style={st.heroStaticSep}>•</Text>
          <Text style={st.heroStaticTxt}>{profile?.phone || '—'}</Text>
          {profile && (
            <TouchableOpacity
              onPress={() => { setIsFlipped(false); setShowCardModal(true); }}
              activeOpacity={0.7}
              style={st.cardFlipBtn}>
              <Text style={st.cardFlipBtnEmoji}>🎫</Text>
              <Text style={st.cardFlipBtnTxt}>Card</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >

        {/* ── STATS — one compact rail with dividers, same data as before ── */}
        <View style={st.statsRail}>
          {stats.map((s, i) => (
            <View key={i} style={[st.stat, i !== stats.length - 1 && st.statDivider]}>
              <View style={[st.statIconBox, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} size={13} color={s.color} />
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

            <View style={st.groupCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[st.menuRow, ii !== section.items.length - 1 && st.menuRowDivider]}
                  onPress={() => item.route && navigation.navigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={[st.menuRowIconBox, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.mcIcon} size={17} color={item.color} />
                  </View>
                  <Text style={st.menuRowLabel} numberOfLines={1}>{item.name}</Text>
                  <Icon name="chevron-right" size={17} color={C.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── GET STARTED CTA — visible to all vendors right above Logout
            so it stays one tap from anywhere in the app ── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <MaterialCommunityIcons name="compass-outline" size={14} color={C.g600} />
            <Text style={st.sectionTitle}>Next Step</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('GetStartedScreen')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[C.g700, C.g900]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.getStartedCard}>
              <View style={st.getStartedIconCircle}>
                <MaterialCommunityIcons name="compass-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.getStartedTxt}>Get Started</Text>
                <Text style={st.getStartedSub}>Setup guide & feature tour</Text>
              </View>
              <LinearGradient colors={[T.gold, T.goldLight]} style={st.getStartedPill}>
                <Text style={st.getStartedPillTxt}>Continue</Text>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={st.logoutCard} onPress={handleLogout} activeOpacity={0.8}>
          <View style={st.logoutIconBox}>
            <Icon name="log-out" size={16} color={C.red} />
          </View>
          <Text style={st.logoutTxt}>Logout</Text>
          <Icon name="chevron-right" size={16} color={C.red} style={{ marginLeft: 'auto' }} />
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
          <View style={{ flex: 1, backgroundColor: T.scrim, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
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
                          <Text style={{ fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.4 }}>TRANSRENTALS</Text>
                          <View style={{ alignItems: 'center', gap: 0 }}>
                            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.8, lineHeight: 24 }}>TRUSTED</Text>
                            <Text style={{ fontSize: 22, fontWeight: '900', color: '#52e77a', textAlign: 'center', letterSpacing: 0.8, lineHeight: 24 }}>VENDOR</Text>
                          </View>
                          <View style={{ width: 32, height: 1.2, backgroundColor: 'rgba(82, 231, 122, 0.6)', marginTop: 2 }} />
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 0.2, marginTop: 3 }}>{profile?.businessName}</Text>
                          {profile?.vid && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, borderWidth: 0.8, borderColor: 'rgba(82, 231, 122, 0.3)', marginTop: 5 }}>
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#52e77a', letterSpacing: 1.3 }}>{profile.vid.toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Bottom section */}
                    <View style={{ alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1.2, borderTopColor: 'rgba(255,255,255,0.15)' }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>Tap to flip</Text>
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
                          <Text style={{ fontSize: 10, fontWeight: '800', color: profile?.status === 'APPROVED' ? '#22c55e' : profile?.status === 'PENDING' ? '#eab308' : '#ef4444', letterSpacing: 0.8 }}>{profile?.status}</Text>
                        </View>
                      </View>

                      {/* Profile strip */}
                      <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 11, paddingHorizontal: 1, borderBottomWidth: 1.2, borderBottomColor: 'rgba(255,255,255,0.12)', marginBottom: 12, backgroundColor: 'rgba(6, 95, 70, 0.25)', borderRadius: 8 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'linear-gradient(135deg, #1FC77A 0%, #16a457 100%)', justifyContent: 'center', alignItems: 'center', shadowColor: '#1FC77A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 }}>
                          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{profile?.businessName?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 }}>{profile?.businessName}</Text>
                          <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{profile?.ownerName}</Text>
                          {profile?.vid && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(82, 231, 122, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.2, borderColor: 'rgba(82, 231, 122, 0.3)', alignSelf: 'flex-start', shadowColor: 'rgba(82, 231, 122, 0.2)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3 }}>
                              <MaterialCommunityIcons name="shield-check" size={10} color="#52e77a" />
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#52e77a', letterSpacing: 1.2 }}>{profile.vid.toUpperCase()}</Text>
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
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff', letterSpacing: 0.2 }}>{profile.gstNumber}</Text>
                            </View>
                          </>
                        )}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ flex: 1, backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                            <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>PHONE</Text>
                            <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff' }}>{profile?.phone}</Text>
                          </View>
                          {(profile?.city || profile?.state) && (
                            <View style={{ flex: 1, backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                              <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>LOCATION</Text>
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff' }}>{[profile?.city, profile?.state].filter(Boolean).join(', ')}</Text>
                            </View>
                          )}
                        </View>
                        {profile?.email && (
                          <View style={{ backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                            <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>EMAIL</Text>
                            <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff', numberOfLines: 1 }}>{profile.email}</Text>
                          </View>
                        )}
                        {profile?.businessType && (
                          <View style={{ backgroundColor: 'rgba(82, 231, 122, 0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderLeftWidth: 2.5, borderLeftColor: '#52e77a' }}>
                            <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#52e77a', letterSpacing: 1.1, marginBottom: 3 }}>BUSINESS TYPE</Text>
                            <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff' }}>{profile.businessType}</Text>
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
                        <Text style={{ fontSize: 11, fontWeight: '700', color: profile?.status === 'APPROVED' ? '#22c55e' : '#eab308', letterSpacing: 0.3 }}>{profile?.status === 'APPROVED' ? 'Verified Vendor' : 'Pending Approval'}</Text>
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
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 }}>Close</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCardModal(false)} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 14, paddingBottom: 20 },

  /* ── Header / hero — edge-to-edge, not a floating margined card.
      hero-top: the gradient part (badge, gear, avatar, name, pills).
      hero-static: a flat, non-gradient, non-animated panel underneath it
      (VID/email/phone/Card) — only its bottom corners are rounded. ── */
  hero: { marginBottom: 14 },
  heroTop: {
    paddingHorizontal: 16, paddingBottom: 22, paddingTop: 8,
    overflow: 'hidden',
  },
  heroTopbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 6, paddingBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  heroBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.3, textTransform: 'uppercase' },
  settingsBtn:  {
    width: 30, height: 30, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: rs(56), height: rs(56), borderRadius: rs(17), borderWidth: 2, borderColor: T.gold },
  avatarPlaceholder: {
    width: rs(56), height: rs(56), borderRadius: rs(17),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.gold,
  },
  avatarInitial: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '900', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 19, height: 19, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.forest,
  },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700', color: '#fff' },
  heroOwner: { fontSize: 13, color: 'rgba(255,255,255,0.62)', marginTop: 2, fontWeight: '600' },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pillRating: { backgroundColor: 'rgba(221,163,63,0.2)' },
  pillTxt: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },

  heroStatic: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    backgroundColor: T.forestDark, paddingHorizontal: 18, paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  heroStaticTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  heroStaticBold: { color: 'rgba(255,255,255,0.85)', fontWeight: '800' },
  heroStaticSep:  { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
  cardFlipBtn: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14, paddingHorizontal: 9, paddingVertical: 4,
  },
  cardFlipBtnEmoji: { fontSize: 11 },
  cardFlipBtnTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  /* ── Stats rail — one card, thin dividers, compact ── */
  statsRail: {
    flexDirection: 'row',
    marginHorizontal: 16, backgroundColor: C.card, borderRadius: rs(18),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  statDivider: { borderRightWidth: 1, borderRightColor: C.border },
  statIconBox: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 5,
  },
  statValue: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 1 },
  statLabel: { fontSize: 8.5, color: C.muted, fontWeight: '600', textAlign: 'center' },

  /* ── Sections ── */
  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.g700, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* ── Action grid (replaces the bordered menu list) ── */
  /* ── Menu sections — one grouped card per section, rows + chevron ── */
  groupCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  menuRowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuRowIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  menuRowLabel: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, fontWeight: '700', color: C.text },

  /* ── Get Started CTA ── */
  getStartedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: rs(16), padding: 14,
  },
  getStartedIconCircle: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  getStartedTxt:    { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '800', color: '#fff' },
  getStartedSub:    { fontSize: 11.5, color: 'rgba(255,255,255,0.68)', marginTop: 2, fontWeight: '600' },
  getStartedPill:   {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, flexShrink: 0,
  },
  getStartedPillTxt: { fontSize: 12, fontWeight: '800', color: '#3a2a06' },

  /* ── Logout ── */
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 10, padding: 13,
    backgroundColor: C.redL, borderRadius: rs(16),
  },
  logoutIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#FECACA', alignItems: 'center', justifyContent: 'center',
  },
  logoutTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: C.red },

  /* ── Version ── */
  versionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20,
  },
  versionTxt: { fontSize: 13, color: C.muted, fontWeight: '500' },
});

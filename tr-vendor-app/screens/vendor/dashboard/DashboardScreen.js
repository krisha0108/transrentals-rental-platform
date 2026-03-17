import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getVendorProfile, getVendorBookings, getVendorEarnings, getBaseURL } from '../../api/client';
import { NotifBadgeContext } from '../../../contexts/NotifBadgeContext';

// Current vendor app version — must match versionName in android/app/build.gradle
const APP_VERSION = '3.0.9';

const { width: W } = Dimensions.get('window');

const G = {
  // Greens
  g900: '#052e16',
  g800: '#14532d',
  g700: '#15803d',
  g600: '#16a34a',
  g500: '#22c55e',
  g400: '#4ade80',
  g300: '#86efac',
  g200: '#bbf7d0',
  g100: '#dcfce7',
  g50: '#f0fdf4',
  // Neutrals
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#0A0F1E',
  textMid: '#374151',
  muted: '#6B7280',
  border: '#E8EDF2',
  // Accents
  blue: '#2563EB',
  blueL: '#EFF6FF',
  orange: '#F59E0B',
  orangeL: '#FFFBEB',
  purple: '#7C3AED',
  purpleL: '#F5F3FF',
  red: '#DC2626',
  redL: '#FEF2F2',
  cyan: '#0891B2',
  cyanL: '#ECFEFF',
  pink: '#DB2777',
  pinkL: '#FDF2F8',
  indigo: '#4F46E5',
  indigoL: '#EEF2FF',
  teal: '#0D9488',
  tealL: '#F0FDFA',
  amber: '#D97706',
  amberL: '#FFFBEB',
};

const VENDOR_STATUS = {
  PENDING: 'PENDING',
  DOCUMENTS_PENDING: 'DOCUMENTS_PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  SUSPENDED: 'SUSPENDED',
};

const SERVICE_IDS = {
  BIKE: 'SVC_1',
  SELF_DRIVE: 'SVC_2',
  BUS: 'SVC_3',
  TRANSPORTER: 'SVC_4',
  CAR_RENTAL: 'SVC_5',
  PACKERS: 'SVC_6',
  EQUIPMENT: 'SVC_7',
  LUXURY: 'SVC_8',
};

// ─── Avatar Initials ───────────────────────────────────────────────────────
function AvatarInitials({ name, size = 44 }) {
  const initials = (name || 'V')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  return (
    <View style={[avStyle.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[avStyle.txt, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}
const avStyle = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  txt: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
});

// ─── Shimmer Skeleton ──────────────────────────────────────────────────────
function SkeletonBox({ w, h, radius = 8, style }) {
  return <View style={[{ width: w, height: h, borderRadius: radius, backgroundColor: '#E8EDF2' }, style]} />;
}

export default function DashboardScreen({ navigation }) {
  const { unreadCount } = React.useContext(NotifBadgeContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [profile, setProfile] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const vendorStr = await AsyncStorage.getItem('vendor');
      if (vendorStr) setVendor(JSON.parse(vendorStr));

      const profileData = await getVendorProfile();
      if (profileData) {
        setProfile(profileData);
        await AsyncStorage.setItem('vendor', JSON.stringify(profileData));
        setVendor(profileData);
      }

      if (profileData?.status === 'APPROVED') {
        try {
          const earningsRes = await getVendorEarnings();
          if (earningsRes?.success) {
            setEarnings(earningsRes.earnings);
            setBookingsData(earningsRes.bookings);
          }
        } catch (_) { }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const checkForUpdate = useCallback(async () => {
    try {
      const base = await getBaseURL();
      const res = await axios.get(`${base}/api/vendor/app-version`, { timeout: 8000 });
      if (res.data?.success) {
        const { latestVersion, forceUpdate, updateMessage, playStoreUrl } = res.data;
        if (latestVersion && latestVersion !== APP_VERSION) {
          setUpdateInfo({ latestVersion, forceUpdate, updateMessage, playStoreUrl });
          setShowUpdateModal(true);
        }
      }
    } catch (e) {
      // silently fail — update check is non-critical
      console.log('[UpdateCheck] failed:', e?.message);
    }
  }, []);

  useEffect(() => { checkForUpdate(); }, [checkForUpdate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const vendorStatus = profile?.status || vendor?.status || VENDOR_STATUS.PENDING;
  const isApproved = vendorStatus === VENDOR_STATUS.APPROVED;
  const approvedSvcIds = profile?.approvedServiceIds || [];
  const hasService = (id) => approvedSvcIds.includes(id);
  const businessName = profile?.businessName || vendor?.businessName || 'Vendor';

  const formatCurrency = (v) => {
    if (!v || v === 0) return '0';
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return String(Math.round(v));
  };

  // ── Status config ──────────────────────────────────────────────────────
  const STATUS_CFG = {
    [VENDOR_STATUS.APPROVED]: { bg: G.g100, border: G.g300, text: G.g800, dot: G.g600, label: 'Approved' },
    [VENDOR_STATUS.DOCUMENTS_PENDING]: { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', dot: G.amber, label: 'Docs Pending' },
    [VENDOR_STATUS.UNDER_REVIEW]: { bg: G.blueL, border: '#93C5FD', text: '#1E40AF', dot: G.blue, label: 'Under Review' },
    [VENDOR_STATUS.PENDING]: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: G.orange, label: 'Pending' },
    [VENDOR_STATUS.REJECTED]: { bg: G.redL, border: '#FCA5A5', text: '#991B1B', dot: G.red, label: 'Rejected' },
    [VENDOR_STATUS.BLOCKED]: { bg: G.redL, border: '#FCA5A5', text: '#991B1B', dot: G.red, label: 'Blocked' },
    [VENDOR_STATUS.SUSPENDED]: { bg: G.redL, border: '#FCA5A5', text: '#991B1B', dot: G.red, label: 'Suspended' },
  };
  const sCfg = STATUS_CFG[vendorStatus] || STATUS_CFG[VENDOR_STATUS.PENDING];

  // ── Steps ──────────────────────────────────────────────────────────────
  const steps = [
    { id: 1, name: 'Registered', status: 'completed' },
    {
      id: 2, name: 'Documents',
      status: vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING ? 'current'
        : vendorStatus === VENDOR_STATUS.PENDING ? 'pending' : 'completed',
    },
    {
      id: 3, name: 'Review',
      status: vendorStatus === VENDOR_STATUS.UNDER_REVIEW ? 'current'
        : [VENDOR_STATUS.APPROVED, VENDOR_STATUS.REJECTED].includes(vendorStatus) ? 'completed' : 'pending',
    },
    {
      id: 4, name: 'Approval',
      status: vendorStatus === VENDOR_STATUS.APPROVED ? 'completed'
        : vendorStatus === VENDOR_STATUS.REJECTED ? 'rejected' : 'pending',
    },
  ];

  // ── Stats (approved) ───────────────────────────────────────────────────
  const statCards = [
    { label: "Today's\nBookings", value: bookingsData?.today ?? 0, icon: 'calendar', iconLib: 'feather', color: G.g600, bg: G.g50, route: null },
    { label: 'Active\nBookings', value: bookingsData?.active ?? 0, icon: 'zap', iconLib: 'feather', color: G.blue, bg: G.blueL, route: 'BookingsListScreen' },
    { label: 'Fleet\nVehicles', value: profile?.fleetsCount ?? 0, icon: 'truck', iconLib: 'feather', color: G.purple, bg: G.purpleL, route: 'FleetListScreen' },
    { label: 'Your\nRating', value: profile?.rating?.toFixed(1) ?? '5.0', icon: 'star', iconLib: 'feather', color: G.amber, bg: G.amberL, route: null },
  ];

  // ── Quick actions (horizontal) ─────────────────────────────────────────
  const quickActions = [
    { label: 'Add Vehicle', icon: 'plus-circle', lib: 'feather', color: G.blue, bg: G.blueL, route: 'AddVehicleScreen' },
    { label: 'Add Staff', icon: 'user-plus', lib: 'feather', color: G.purple, bg: G.purpleL, route: 'AddStaffScreen' },
    { label: 'Documents', icon: 'folder', lib: 'feather', color: G.g600, bg: G.g50, route: 'VendorDocuments' },
    { label: 'Services', icon: 'layers', lib: 'feather', color: G.red, bg: G.redL, route: 'VendorServices' },
    { label: 'Locations', icon: 'map-pin', lib: 'feather', color: G.indigo, bg: G.indigoL, route: 'VendorLocations' },
    { label: 'Direct Booking', icon: 'book-open', lib: 'feather', color: G.orange, bg: G.orangeL, route: 'DirectBookings' },
    { label: 'Booking Links', icon: 'link-2', lib: 'feather', color: G.indigo, bg: G.indigoL, route: 'BookingLinks' },
    { label: 'Financials', icon: 'bar-chart-2', lib: 'feather', color: G.purple, bg: G.purpleL, route: 'Financials' },
    { label: 'P2P Market', icon: 'swap-horizontal', lib: 'mci', color: G.teal, bg: G.tealL, route: 'P2PDashboard' },
    { label: 'My Earnings', icon: 'trending-up', lib: 'feather', color: G.g600, bg: G.g50, route: 'EarningsScreen' },
  ];

  // ── Services ───────────────────────────────────────────────────────────
  const SERVICE_MODULES = [
    { id: SERVICE_IDS.BIKE, name: 'Bike Rentals', icon: 'motorbike', color: G.amber, route: 'BikeHomeScreen' },
    { id: SERVICE_IDS.SELF_DRIVE, name: 'Self-Drive Cars', icon: 'car-side', color: G.blue, route: 'SelfDriveHomeScreen' },
    { id: SERVICE_IDS.CAR_RENTAL, name: 'Car Rental', icon: 'car', color: G.g600, route: 'CarRentalHomeScreen' },
    { id: SERVICE_IDS.LUXURY, name: 'Luxury Cars', icon: 'car-sports', color: G.purple, route: 'LuxuryHomeScreen' },
    { id: SERVICE_IDS.BUS, name: 'Bus & Tempo', icon: 'bus', color: G.pink, route: 'BusHomeScreen' },
    { id: SERVICE_IDS.TRANSPORTER, name: 'Transporter', icon: 'truck-delivery', color: G.red, route: 'TruckHomeScreen' },
    { id: SERVICE_IDS.PACKERS, name: 'Packers & Movers', icon: 'package-variant', color: G.cyan, route: 'PackersHomeScreen' },
    { id: SERVICE_IDS.EQUIPMENT, name: 'Equipment Rental', icon: 'hammer-wrench', color: G.indigo, route: 'EquipmentHomeScreen' },
  ];
  const approvedServices = SERVICE_MODULES.filter((m) => hasService(m.id));

  // ── Manage grid ────────────────────────────────────────────────────────
  const manageItems = [
    { label: 'Fleet', sub: `${profile?.fleetsCount ?? 0} vehicles`, icon: 'truck', lib: 'feather', color: G.blue, bg: G.blueL, route: 'FleetListScreen' },
    { label: 'Staff', sub: 'Manage team', icon: 'users', lib: 'feather', color: G.purple, bg: G.purpleL, route: 'StaffListScreen' },
    { label: 'Chats', sub: 'Messages', icon: 'message-circle', lib: 'feather', color: G.g600, bg: G.g50, route: 'ChatListScreen' },
    { label: 'Settings', sub: 'Profile', icon: 'settings', lib: 'feather', color: G.amber, bg: G.amberL, route: 'ProfileScreen' },
    { label: 'Direct', sub: 'Bookings', icon: 'book-open', lib: 'feather', color: G.orange, bg: G.orangeL, route: 'DirectBookings' },
    { label: 'Booking Links', sub: 'Share links', icon: 'link-2', lib: 'feather', color: G.indigo, bg: G.indigoL, route: 'BookingLinks' },
    { label: 'Financials', sub: 'P&L reports', icon: 'bar-chart-2', lib: 'feather', color: G.purple, bg: G.purpleL, route: 'Financials' },
    { label: 'P2P Market', sub: 'Trade fleet', icon: 'swap-horizontal', lib: 'mci', color: G.teal, bg: G.tealL, route: 'P2PDashboard' },
    { label: 'Social', sub: 'Vendor Network', icon: 'users', lib: 'feather', color: '#7C3AED', bg: '#F5F3FF', route: 'SocialFeed' },
    { label: 'B2B', sub: 'Corporate', icon: 'domain', lib: 'mci', color: G.indigo, bg: G.indigoL, route: 'B2BDashboard' },
  ];

  // ── Pending quick actions ──────────────────────────────────────────────
  const pendingActions = [
    { name: 'Complete Profile', desc: 'Add business details', icon: 'building', color: G.blue, bg: G.blueL, route: 'ProfileScreen' },
    { name: 'Upload Documents', desc: 'GST, PAN & more', icon: 'file-text', color: G.purple, bg: G.purpleL, route: 'VendorDocuments' },
    { name: 'Request Services', desc: 'Select services you offer', icon: 'layers', color: G.g600, bg: G.g50, route: 'VendorServices' },
    { name: 'Request Locations', desc: 'Cities you operate in', icon: 'map-pin', color: G.orange, bg: G.orangeL, route: 'VendorLocations' },
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: G.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={G.g900} />
        <LinearGradient colors={['#052e16', '#14532d', '#166534', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sk.header}>
          <View style={{ gap: 8 }}>
            <SkeletonBox w={160} h={20} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <SkeletonBox w={100} h={14} radius={5} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>
          <SkeletonBox w={44} h={44} radius={22} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <SkeletonBox w="100%" h={160} radius={20} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonBox w={(W - 42) / 2} h={90} radius={16} />
            <SkeletonBox w={(W - 42) / 2} h={90} radius={16} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonBox w={(W - 42) / 2} h={90} radius={16} />
            <SkeletonBox w={(W - 42) / 2} h={90} radius={16} />
          </View>
          <SkeletonBox w="100%" h={130} radius={16} />
          <SkeletonBox w="100%" h={130} radius={16} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={G.g800} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.g600]} tintColor={G.g600} />
        }
      >
        {/* ══════════════════════════════════════════════════════════════
            HERO HEADER — deep green gradient
        ══════════════════════════════════════════════════════════════ */}
        <LinearGradient
          colors={['#052e16', '#14532d', '#166534', '#15803d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Top row */}
          <SafeAreaView edges={['top']}>
            <View style={s.heroTop}>
              <View style={s.heroLeft}>
                <AvatarInitials name={businessName} size={48} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={s.heroGreeting}>Good day 👋</Text>
                  <Text style={s.heroName} numberOfLines={1}>{businessName}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={s.notifBtn}
                onPress={() => navigation.navigate('NotificationsScreen')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {unreadCount > 0 && (
                  <View style={s.notifBadge}>
                    <Text style={s.notifBadgeText}>
                      {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Status pill */}
            <View style={[s.statusPill, { backgroundColor: sCfg.bg, borderColor: sCfg.border }]}>
              <View style={[s.statusDot, { backgroundColor: sCfg.dot }]} />
              <Text style={[s.statusLabel, { color: sCfg.text }]}>{sCfg.label}</Text>
              {!isApproved && (
                <Text style={[s.statusSub, { color: sCfg.text }]}>  ·  Complete setup to start receiving bookings</Text>
              )}
            </View>
          </SafeAreaView>

          {/* ── Earnings hero (approved only) ─────────────────────── */}
          {isApproved && (
            <TouchableOpacity
              style={s.earningsHero}
              onPress={() => navigation.navigate('EarningsScreen')}
              activeOpacity={0.88}
            >
              <View style={s.earningsTopRow}>
                <View>
                  <Text style={s.earningsLbl}>This Month's Earnings</Text>
                  <Text style={s.earningsAmt}>₹{formatCurrency(earnings?.thisMonth || 0)}</Text>
                </View>
                <View style={[
                  s.growthBadge,
                  { backgroundColor: (earnings?.growth ?? 0) >= 0 ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.2)' }
                ]}>
                  <Icon
                    name={(earnings?.growth ?? 0) >= 0 ? 'trending-up' : 'trending-down'}
                    size={13}
                    color={(earnings?.growth ?? 0) >= 0 ? G.g400 : '#FCA5A5'}
                  />
                  <Text style={[s.growthTxt, { color: (earnings?.growth ?? 0) >= 0 ? G.g400 : '#FCA5A5' }]}>
                    {Math.abs(earnings?.growth ?? 0)}%
                  </Text>
                </View>
              </View>

              <View style={s.earningsStatsRow}>
                {[
                  { v: `₹${formatCurrency(earnings?.today || 0)}`, l: 'Today' },
                  { v: `₹${formatCurrency(earnings?.pendingPayout || 0)}`, l: 'Pending' },
                  { v: String(bookingsData?.completed || 0), l: 'Completed' },
                ].map((st, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.earningsDiv} />}
                    <View style={s.earningStat}>
                      <Text style={s.earningStatV}>{st.v}</Text>
                      <Text style={s.earningStatL}>{st.l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>

              <View style={s.earningsCTA}>
                <Text style={s.earningsCTATxt}>View Detailed Earnings</Text>
                <Icon name="arrow-right" size={15} color={G.g300} />
              </View>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={s.body}>

          {/* ══════════════════════════════════════════════════════════
              NON-APPROVED: Approval progress
          ══════════════════════════════════════════════════════════ */}
          {!isApproved && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>Approval Progress</Text>
                <View style={[s.pill, { backgroundColor: G.g50, borderColor: G.g200 }]}>
                  <Text style={[s.pillTxt, { color: G.g700 }]}>
                    Step {steps.filter(st => st.status === 'completed').length} / {steps.length}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={s.progressTrack}>
                <View style={[s.progressFill, {
                  width: `${(steps.filter(st => st.status === 'completed').length / steps.length) * 100}%`
                }]} />
              </View>

              {/* Steps */}
              <View style={s.stepsRow}>
                {steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <View style={s.stepCol}>
                      <View style={[
                        s.stepCircle,
                        step.status === 'completed' && { backgroundColor: G.g600, borderColor: G.g600 },
                        step.status === 'current' && { backgroundColor: G.blue, borderColor: G.blue },
                        step.status === 'rejected' && { backgroundColor: G.red, borderColor: G.red },
                        step.status === 'pending' && { backgroundColor: G.bg, borderColor: G.border },
                      ]}>
                        {step.status === 'completed' ? <Icon name="check" size={13} color="#fff" />
                          : step.status === 'current' ? <Icon name="clock" size={13} color="#fff" />
                            : step.status === 'rejected' ? <Icon name="x" size={13} color="#fff" />
                              : <Text style={s.stepNum}>{step.id}</Text>}
                      </View>
                      <Text style={[s.stepLbl, step.status === 'current' && { color: G.blue, fontWeight: '700' }]}>
                        {step.name}
                      </Text>
                    </View>
                    {idx < steps.length - 1 && (
                      <View style={[s.stepLine, step.status === 'completed' && { backgroundColor: G.g500 }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {/* Status banners */}
              {vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING && (
                <TouchableOpacity
                  style={s.alertBanner}
                  onPress={() => navigation.navigate('VendorDocuments')}
                  activeOpacity={0.8}
                >
                  <View style={[s.alertIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Icon name="alert-triangle" size={16} color={G.amber} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[s.alertTitle, { color: '#92400E' }]}>Documents Required</Text>
                    <Text style={[s.alertSub, { color: '#B45309' }]}>Upload GST, PAN & business docs to proceed</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={G.amber} />
                </TouchableOpacity>
              )}
              {vendorStatus === VENDOR_STATUS.UNDER_REVIEW && (
                <View style={s.alertBanner}>
                  <View style={[s.alertIcon, { backgroundColor: G.blueL }]}>
                    <Icon name="clock" size={16} color={G.blue} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[s.alertTitle, { color: '#1E40AF' }]}>Under Review</Text>
                    <Text style={[s.alertSub, { color: '#2563EB' }]}>Usually takes 1–2 business days</Text>
                  </View>
                </View>
              )}
              {vendorStatus === VENDOR_STATUS.REJECTED && (
                <View style={s.alertBanner}>
                  <View style={[s.alertIcon, { backgroundColor: G.redL }]}>
                    <Icon name="x-circle" size={16} color={G.red} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[s.alertTitle, { color: '#991B1B' }]}>Application Rejected</Text>
                    <Text style={[s.alertSub, { color: '#B91C1C' }]}>
                      {profile?.rejectionReason || 'Contact support for more information'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════
              APPROVED: Stats 2×2 grid
          ══════════════════════════════════════════════════════════ */}
          {isApproved && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Overview</Text>
              </View>
              <View style={s.statsGrid}>
                {statCards.map((st, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.statCard, { borderLeftColor: st.color, borderLeftWidth: 3 }]}
                    onPress={() => st.route && navigation.navigate(st.route)}
                    activeOpacity={st.route ? 0.75 : 1}
                  >
                    <View style={[s.statIconWrap, { backgroundColor: st.bg }]}>
                      <Icon name={st.icon} size={18} color={st.color} />
                    </View>
                    <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                    <Text style={s.statLabel}>{st.label}</Text>
                    {st.route && (
                      <View style={s.statArrow}>
                        <Icon name="arrow-up-right" size={11} color={G.muted} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              NON-APPROVED: Pending quick actions
          ══════════════════════════════════════════════════════════ */}
          {!isApproved && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Complete Setup</Text>
              </View>
              <View style={s.statsGrid}>
                {pendingActions.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.statCard, { borderLeftColor: a.color, borderLeftWidth: 3 }]}
                    onPress={() => navigation.navigate(a.route)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.statIconWrap, { backgroundColor: a.bg }]}>
                      <Icon name={a.icon} size={18} color={a.color} />
                    </View>
                    <Text style={[s.statName, { color: G.text }]}>{a.name}</Text>
                    <Text style={s.statLabel}>{a.desc}</Text>
                    <View style={s.statArrow}>
                      <Icon name="arrow-up-right" size={11} color={G.muted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              APPROVED: Quick Actions horizontal pill row
          ══════════════════════════════════════════════════════════ */}
          {isApproved && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Quick Actions</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.qaScroll}
                contentContainerStyle={s.qaScrollContent}
              >
                {quickActions.map((qa, i) => {
                  const QIcon = qa.lib === 'mci' ? MaterialCommunityIcons : Icon;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={s.qaBtn}
                      onPress={() => navigation.navigate(qa.route)}
                      activeOpacity={0.75}
                    >
                      <View style={[s.qaIconWrap, { backgroundColor: qa.bg }]}>
                        <QIcon name={qa.icon} size={20} color={qa.color} />
                      </View>
                      <Text style={s.qaLabel}>{qa.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              APPROVED: Services 2-col grid
          ══════════════════════════════════════════════════════════ */}
          {isApproved && approvedServices.length > 0 && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Your Services</Text>
                <View style={[s.countBadge, { backgroundColor: G.g50, borderColor: G.g200 }]}>
                  <Text style={[s.countTxt, { color: G.g700 }]}>{approvedServices.length}</Text>
                </View>
              </View>
              <View style={s.servicesGrid}>
                {approvedServices.map((svc, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.svcCard}
                    onPress={() => navigation.navigate(svc.route)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.svcIconBox, { backgroundColor: svc.color + '18' }]}>
                      <MaterialCommunityIcons name={svc.icon} size={26} color={svc.color} />
                    </View>
                    <Text style={s.svcName} numberOfLines={2}>{svc.name}</Text>
                    <View style={[s.svcArrow, { backgroundColor: svc.color + '14' }]}>
                      <Icon name="chevron-right" size={13} color={svc.color} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              APPROVED: Manage 2×4 grid
          ══════════════════════════════════════════════════════════ */}
          {isApproved && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Manage</Text>
              </View>
              <View style={s.manageGrid}>
                {manageItems.map((m, i) => {
                  const MIcon = m.lib === 'mci' ? MaterialCommunityIcons : Icon;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={s.manageCard}
                      onPress={() => navigation.navigate(m.route)}
                      activeOpacity={0.75}
                    >
                      <View style={[s.manageIconWrap, { backgroundColor: m.bg }]}>
                        <MIcon name={m.icon} size={18} color={m.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={s.manageLbl}>{m.label}</Text>
                        <Text style={s.manageSub}>{m.sub}</Text>
                      </View>
                      <Icon name="chevron-right" size={15} color={G.muted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              NON-APPROVED: Getting Started Guide
          ══════════════════════════════════════════════════════════ */}
          {!isApproved && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Getting Started</Text>
              </View>
              <View style={s.card}>
                {[
                  { step: 1, title: 'Complete Your Profile', desc: 'Add your business name, logo & details.' },
                  { step: 2, title: 'Upload Documents', desc: 'GST, PAN, and business registration.' },
                  { step: 3, title: 'Request Services & Locations', desc: 'Select what you offer and where.' },
                  { step: 4, title: 'Add Your Fleet', desc: 'Once approved, add vehicles with photos.' },
                ].map((item, idx, arr) => (
                  <View key={item.step}>
                    <View style={s.guideRow}>
                      <View style={s.guideNumWrap}>
                        <Text style={s.guideNumTxt}>{item.step}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={s.guideTitle}>{item.title}</Text>
                        <Text style={s.guideDesc}>{item.desc}</Text>
                      </View>
                      <Icon name="check-circle" size={18} color={
                        steps[item.step - 1]?.status === 'completed' ? G.g500 : G.border
                      } />
                    </View>
                    {idx < arr.length - 1 && <View style={s.guideDivider} />}
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════
          APP UPDATE MODAL
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!updateInfo?.forceUpdate) setShowUpdateModal(false);
        }}
      >
        <View style={s.updateOverlay}>
          <View style={s.updateCard}>
            {/* Close button — only if not force update */}
            {!updateInfo?.forceUpdate && (
              <TouchableOpacity style={s.updateCloseBtn} onPress={() => setShowUpdateModal(false)} activeOpacity={0.7}>
                <Icon name="x" size={18} color={G.muted} />
              </TouchableOpacity>
            )}

            {/* Top gradient banner with icon */}
            <LinearGradient colors={[G.g900, G.g800, G.g700]} style={s.updateBanner}>
              <View style={s.updateIconRing}>
                <Ionicons name="arrow-up-circle" size={40} color="#fff" />
              </View>
              <Text style={s.updateBannerTag}>New Update Available</Text>
            </LinearGradient>

            {/* Content */}
            <View style={s.updateBody}>
              <Text style={s.updateTitle}>Version {updateInfo?.latestVersion}</Text>
              <Text style={s.updateMsg}>
                {updateInfo?.updateMessage || 'A new version is available with improvements and bug fixes.'}
              </Text>

              {/* Update now button */}
              <TouchableOpacity
                style={s.updateBtnWrap}
                activeOpacity={0.85}
                onPress={() => {
                  if (updateInfo?.playStoreUrl) Linking.openURL(updateInfo.playStoreUrl);
                }}
              >
                <LinearGradient colors={[G.g800, G.g500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.updateBtn}>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={s.updateBtnTxt}>Update Now</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Skip — only if not force update */}
              {!updateInfo?.forceUpdate && (
                <TouchableOpacity style={s.skipBtn} onPress={() => setShowUpdateModal(false)} activeOpacity={0.7}>
                  <Text style={s.skipBtnTxt}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const CARD_W = (W - 48) / 2;

const sk = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24,
  },
});

const s = StyleSheet.create({
  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 14,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  heroGreeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  notifBtn: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2, borderColor: G.g800,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 18,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  statusSub: { fontSize: 11, fontWeight: '400', opacity: 0.75 },

  // ── Earnings hero ──────────────────────────────────────────────────────
  earningsHero: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    padding: 18,
  },
  earningsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  earningsLbl: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 5, letterSpacing: 0.3 },
  earningsAmt: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  growthTxt: { fontSize: 12, fontWeight: '700' },
  earningsStatsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 14, marginBottom: 14 },
  earningsDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8 },
  earningStat: { flex: 1, alignItems: 'center' },
  earningStatV: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  earningStatL: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  earningsCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  earningsCTATxt: { fontSize: 13, fontWeight: '700', color: G.g300 },

  // ── Body ──────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ── Section headers ────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 12, marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: G.text, letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, borderWidth: 1,
  },
  countTxt: { fontSize: 11, fontWeight: '800' },

  // ── Generic card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: G.surface, borderRadius: 18, padding: 16,
    marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: G.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: G.text },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  pillTxt: { fontSize: 11, fontWeight: '700' },

  // ── Progress bar ──────────────────────────────────────────────────────
  progressTrack: { height: 5, backgroundColor: G.border, borderRadius: 3, marginBottom: 18, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: G.g500, borderRadius: 3 },

  // ── Steps ─────────────────────────────────────────────────────────────
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepCol: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 6,
  },
  stepNum: { fontSize: 13, fontWeight: '700', color: G.muted },
  stepLbl: { fontSize: 10, color: G.muted, fontWeight: '600', textAlign: 'center' },
  stepLine: { flex: 0.5, height: 2, backgroundColor: G.border, marginBottom: 26 },

  // ── Alert banner ──────────────────────────────────────────────────────
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.bg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: G.border,
  },
  alertIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  alertSub: { fontSize: 11, opacity: 0.8 },

  // ── Stats grid (2×2) ──────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  statCard: {
    width: CARD_W,
    backgroundColor: G.surface, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: G.border,
    position: 'relative',
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
  statName: { fontSize: 14, fontWeight: '700', color: G.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: G.muted, fontWeight: '500', lineHeight: 15 },
  statArrow: { position: 'absolute', top: 12, right: 12 },

  // ── Quick actions ─────────────────────────────────────────────────────
  qaScroll: { marginHorizontal: -16, marginBottom: 18 },
  qaScrollContent: { paddingHorizontal: 16, gap: 12 },
  qaBtn: { alignItems: 'center', width: 70 },
  qaIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  qaLabel: { fontSize: 10, color: G.textMid, fontWeight: '600', textAlign: 'center', lineHeight: 13 },

  // ── Services 2-col grid ───────────────────────────────────────────────
  servicesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  svcCard: {
    width: CARD_W,
    backgroundColor: G.surface, borderRadius: 16, padding: 14,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: G.border,
    position: 'relative',
  },
  svcIconBox: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  svcName: { fontSize: 13, fontWeight: '700', color: G.text, lineHeight: 18, flex: 1 },
  svcArrow: { position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // ── Manage list (2-col) ───────────────────────────────────────────────
  manageGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  manageCard: {
    width: CARD_W,
    backgroundColor: G.surface, borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
    borderWidth: 1, borderColor: G.border,
  },
  manageIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  manageLbl: { fontSize: 13, fontWeight: '700', color: G.text },
  manageSub: { fontSize: 10, color: G.muted, marginTop: 1 },

  // ── Update modal ───────────────────────────────────────────────────────
  updateOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  updateCard: {
    width: '100%', backgroundColor: G.surface,
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 32, elevation: 20,
  },
  updateCloseBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  updateBanner: {
    paddingTop: 36, paddingBottom: 28, alignItems: 'center', gap: 10,
  },
  updateIconRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  updateBannerTag: {
    fontSize: 12, fontWeight: '700', color: G.g300,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  updateBody: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  updateTitle: { fontSize: 22, fontWeight: '900', color: G.text, letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  updateMsg: { fontSize: 14, color: G.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  updateBtnWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 16 },
  updateBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipBtnTxt: { fontSize: 14, color: G.muted, fontWeight: '600' },

  // ── Getting started guide ─────────────────────────────────────────────
  guideRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  guideNumWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: G.g600, alignItems: 'center', justifyContent: 'center',
  },
  guideNumTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  guideTitle: { fontSize: 14, fontWeight: '700', color: G.text },
  guideDesc: { fontSize: 12, color: G.muted, marginTop: 2, lineHeight: 17 },
  guideDivider: { height: 1, backgroundColor: G.border, marginLeft: 44 },
});

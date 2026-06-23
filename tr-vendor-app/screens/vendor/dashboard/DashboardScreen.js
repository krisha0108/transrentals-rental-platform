import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, StatusBar, Modal, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getVendorProfile, getVendorBookings, getVendorEarnings, getBaseURL, getSessionToken, apiPatch } from '../../api/client';
import { fetchInquiries } from '../../api/inquiriesApi';
import { showConfirm, showSuccess, showError } from '../../../services/alertService';
import { NotifBadgeContext } from '../../../contexts/NotifBadgeContext';
import DeviceInfo from 'react-native-device-info';
import AppEvents, { EVT_NEW_QUOTE, EVT_QUOTE_SENT } from '../../../utils/AppEvents';
const { width: W } = Dimensions.get('window');

// ── Design tokens ──────────────────────────────────────────────
const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50:  '#ECFDF5',
  bg:     '#F1F5F9',
  card:   '#FFFFFF',
  border: '#E2E8F0',
  text:   '#0F172A',
  sub:    '#475569',
  muted:  '#94A3B8',
  blue:    '#2563EB', blueL:   '#EFF6FF',
  purple:  '#7C3AED', purpleL: '#F5F3FF',
  amber:   '#D97706', amberL:  '#FFFBEB',
  red:     '#DC2626', redL:    '#FEF2F2',
  orange:  '#EA580C', orangeL: '#FFF7ED',
  indigo:  '#4F46E5', indigoL: '#EEF2FF',
  teal:    '#0D9488', tealL:   '#F0FDFA',
  pink:    '#DB2777', pinkL:   '#FDF2F8',
  cyan:    '#0891B2', cyanL:   '#ECFEFF',
};

const VENDOR_STATUS = {
  PENDING: 'PENDING', DOCUMENTS_PENDING: 'DOCUMENTS_PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW', APPROVED: 'APPROVED',
  REJECTED: 'REJECTED', BLOCKED: 'BLOCKED', SUSPENDED: 'SUSPENDED',
};
const SERVICE_IDS = {
  BIKE: 'SVC_1', SELF_DRIVE: 'SVC_2', BUS: 'SVC_3',
  TRANSPORTER: 'SVC_4', CAR_RENTAL: 'SVC_5',
  PACKERS: 'SVC_6', EQUIPMENT: 'SVC_7', LUXURY: 'SVC_8',
};

const SVC_ID_TO_SERVICE = {
  SVC_1: 'bike', SVC_2: 'self-drive', SVC_3: 'bus',
  SVC_4: 'truck', SVC_5: 'car', SVC_6: 'packers', SVC_7: 'equipment', SVC_8: 'luxury',
};
const SVC_META = {
  bike:         { name: 'Bike Rental',  icon: 'motorbike',       color: C.amber  },
  'self-drive': { name: 'Self Drive',   icon: 'car-side',        color: C.cyan   },
  bus:          { name: 'Bus Rental',   icon: 'bus',             color: C.pink   },
  truck:        { name: 'Truck',        icon: 'truck-delivery',  color: C.orange },
  car:          { name: 'Car Rental',   icon: 'car',             color: C.g600   },
  packers:      { name: 'Packers',      icon: 'package-variant', color: C.purple },
  equipment:    { name: 'Equipment',    icon: 'crane',           color: C.indigo },
  luxury:       { name: 'Luxury Car',   icon: 'car-sports',      color: C.blue   },
};
const DETAIL_SCREEN_MAP = {
  bike: 'BikeBookingDetail', 'self-drive': 'SelfDriveBookingDetail',
  bus: 'BusBookingDetail',   truck: 'TruckBookingDetail',
  car: 'CarRentalBookingDetail', packers: 'PackersBookingDetail',
  equipment: 'EquipmentBookingDetail', luxury: 'LuxuryBookingDetail',
};
const BOOKINGS_SCREEN_MAP = {
  bike: 'BikeBookings', 'self-drive': 'SelfDriveBookings',
  bus: 'BusBookings',   truck: 'TruckBookings',
  car: 'CarRentalBookings', packers: 'PackersBookings',
  equipment: 'EquipmentBookings', luxury: 'LuxuryBookings',
};
// Inquiry "Send Quote" → each service's existing quote-submission screen
// (these screens hold the full per-service quote form). Car has no quote
// form — it's an accept-flow handled inline.
const SEND_QUOTE_SCREEN = {
  bike: 'BikeSendQuote', 'self-drive': 'SelfDriveSendQuote',
  bus: 'BusSendQuote',   truck: 'TruckSendQuote',
  luxury: 'LuxurySendQuote', packers: 'PackersSendQuote',
  equipment: 'EquipmentSendQuote',
};
// Tapping an inquiry card → that service's full detail screen.
// (car is a booking, others are quote requests — different param names.)
const INQUIRY_DETAIL_SCREEN = {
  bike: 'BikeQuoteRequestDetail', 'self-drive': 'SelfDriveQuoteRequestDetail',
  bus: 'BusQuoteRequestDetail',   truck: 'TruckQuoteRequestDetail',
  luxury: 'LuxuryQuoteRequestDetail', packers: 'PackersQuoteRequestDetail',
  equipment: 'EquipmentQuoteRequestDetail',
};

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 40, onPress }) {
  const letters = (name || 'V').split(' ').slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '').join('');
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[av.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[av.txt, { fontSize: size * 0.38 }]}>{letters}</Text>
    </TouchableOpacity>
  );
}
const av = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  txt:  { color: '#fff', fontWeight: '900', letterSpacing: 0.5 },
});

// ── Skeleton bone ──────────────────────────────────────────────
const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// ── Icon helper ────────────────────────────────────────────────
function Ico({ lib, name, size, color }) {
  if (lib === 'ion') return <Ionicons name={name} size={size} color={color} />;
  if (lib === 'mci') return <MaterialCommunityIcons name={name} size={size} color={color} />;
  return <Icon name={name} size={size} color={color} />;
}

// ── Status config ──────────────────────────────────────────────
const STATUS_CONFIG = {
  APPROVED:          { color: '#fff',    bg: 'rgba(255,255,255,0.22)', dot: '#34D399', label: 'Active'      },
  DOCUMENTS_PENDING: { color: '#FCD34D', bg: 'rgba(252,211,77,0.2)',  dot: '#FCD34D', label: 'Docs Pending' },
  UNDER_REVIEW:      { color: '#93C5FD', bg: 'rgba(147,197,253,0.2)', dot: '#93C5FD', label: 'In Review'    },
  PENDING:           { color: '#FCD34D', bg: 'rgba(252,211,77,0.2)',  dot: '#FCD34D', label: 'Pending'      },
  REJECTED:          { color: '#FCA5A5', bg: 'rgba(252,165,165,0.2)', dot: '#FCA5A5', label: 'Rejected'     },
  BLOCKED:           { color: '#FCA5A5', bg: 'rgba(252,165,165,0.2)', dot: '#FCA5A5', label: 'Blocked'      },
  SUSPENDED:         { color: '#FCA5A5', bg: 'rgba(252,165,165,0.2)', dot: '#FCA5A5', label: 'Suspended'    },
};

export default function DashboardScreen({ navigation }) {
  const { unreadCount, refreshBadge } = React.useContext(NotifBadgeContext);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [vendor, setVendor]             = useState(null);
  const [profile, setProfile]           = useState(null);
  const [earnings, setEarnings]         = useState(null);
  const [bookingsData, setBookingsData]       = useState(null);
  const [inquiries, setInquiries]             = useState([]);
  const [inquiriesTotal, setInquiriesTotal]   = useState(0);
  const [todayQuoteCounts, setTodayQuoteCounts] = useState({});
  const [updateInfo, setUpdateInfo]           = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const fetchQuoteCounts = useCallback(async () => {
    try {
      const [base, token] = await Promise.all([getBaseURL(), getSessionToken()]);
      const res = await axios.get(`${base}/api/vendor/dashboard/quote-counts`, {
        timeout: 8000,
        headers: token ? { 'X-Session-Token': token } : {},
      });
      if (res.data?.success) setTodayQuoteCounts(res.data.counts || {});
    } catch (_) {}
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const str = await AsyncStorage.getItem('vendor');
      if (str) setVendor(JSON.parse(str));
      const p = await getVendorProfile();
      if (p) { setProfile(p); await AsyncStorage.setItem('vendor', JSON.stringify(p)); setVendor(p); }
      if (p?.status === 'APPROVED') {
        try {
          const er = await getVendorEarnings();
          if (er?.success) { setEarnings(er.earnings); setBookingsData(er.bookings); }
        } catch (_) {}
        fetchQuoteCounts();
        // Pull open inquiries only for this vendor's approved services
        const slugs = (p.approvedServiceIds || []).map(id => SVC_ID_TO_SERVICE[id]).filter(Boolean);
        fetchInquiries(slugs, { limit: 5 })
          .then(({ items }) => {
            const openItems = items.filter(x => !x.quoted);   // only not-yet-quoted
            setInquiries(openItems);
            setInquiriesTotal(openItems.length);
          })
          .catch(() => {});
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [fetchQuoteCounts]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // New quote request arrived (FCM) → +1
  useEffect(() => {
    const handler = ({ serviceType }) => {
      if (!serviceType) return;
      setTodayQuoteCounts(prev => ({
        ...prev,
        [serviceType]: (prev[serviceType] || 0) + 1,
      }));
    };
    AppEvents.on(EVT_NEW_QUOTE, handler);
    return () => AppEvents.off(EVT_NEW_QUOTE, handler);
  }, []);

  // Vendor submitted a quote → -1 (no longer needs action)
  useEffect(() => {
    const handler = ({ serviceType }) => {
      if (!serviceType) return;
      setTodayQuoteCounts(prev => ({
        ...prev,
        [serviceType]: Math.max(0, (prev[serviceType] || 0) - 1),
      }));
    };
    AppEvents.on(EVT_QUOTE_SENT, handler);
    return () => AppEvents.off(EVT_QUOTE_SENT, handler);
  }, []);

  const isVersionLower = (current, latest) => {
    const c = current.split('.').map(Number);
    const l = latest.split('.').map(Number);
    const len = Math.max(c.length, l.length);
    for (let i = 0; i < len; i++) {
      const cv = c[i] || 0;
      const lv = l[i] || 0;
      if (cv < lv) return true;
      if (cv > lv) return false;
    }
    return false;
  };

  const checkForUpdate = useCallback(async () => {
    try {
      const base = await getBaseURL();
      const res  = await axios.get(`${base}/api/vendor/app-version`, { timeout: 8000 });
      if (res.data?.success) {
        const { latestVersion, forceUpdate, updateMessage, playStoreUrl } = res.data;
        const currentVersion = DeviceInfo.getVersion();
        if (latestVersion && isVersionLower(currentVersion, latestVersion)) {
          setUpdateInfo({ latestVersion, forceUpdate, updateMessage, playStoreUrl });
          setShowUpdateModal(true);
        }
      }
    } catch (e) { /* update check is non-critical */ }
  }, []);

  useEffect(() => { checkForUpdate(); }, [checkForUpdate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshBadge()]);
    setRefreshing(false);
  }, [fetchData, refreshBadge]);

  // Inquiry card action: car = inline accept, everything else = open the
  // service's full quote form pre-loaded with this request.
  const handleInquiryAction = useCallback((q) => {
    if (q.accept) {
      showConfirm(
        'Accept booking?',
        `Accept this ${q.title} request from ${q.customer}?`,
        async () => {
          try {
            const res = await apiPatch(`/vendor/car-bookings/${q.rawId}`, { action: 'accept' });
            if (res.data?.success) {
              showSuccess('Booking accepted! Check it under your bookings.');
              setInquiries(prev => prev.filter(x => x.id !== q.id));
              setInquiriesTotal(t => Math.max(0, t - 1));
            } else {
              showError(res.data?.error || 'Could not accept this booking.');
            }
          } catch (e) {
            showError(e?.response?.data?.error || 'Could not accept this booking.');
          }
        },
        { confirmText: 'Accept' },
      );
      return;
    }
    const screen = SEND_QUOTE_SCREEN[q.service];
    if (screen) navigation.navigate(screen, { requestId: q.rawId });
    else navigation.navigate('AllInquiries');
  }, [navigation]);

  // Tap a card → open its full detail screen.
  const openInquiryDetail = useCallback((q) => {
    if (q.service === 'car') {
      navigation.navigate('CarRentalBookingDetail', { bookingId: q.rawId, serviceType: 'car' });
      return;
    }
    const screen = INQUIRY_DETAIL_SCREEN[q.service];
    if (screen) navigation.navigate(screen, { requestId: q.rawId });
  }, [navigation]);

  const vendorStatus   = profile?.status || vendor?.status || VENDOR_STATUS.PENDING;
  const isApproved     = vendorStatus === VENDOR_STATUS.APPROVED;
  const approvedSvcIds = profile?.approvedServiceIds || [];
  const hasService     = id => approvedSvcIds.includes(id);
  const bizName        = profile?.businessName || vendor?.businessName || 'Vendor';
  const stCfg          = STATUS_CONFIG[vendorStatus] || STATUS_CONFIG.PENDING;

  const fmt = v => {
    if (!v || v === 0) return '₹0';
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${Math.round(v)}`;
  };

  const fmtDate = d => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  };

  const steps = [
    { id: 1, name: 'Registered', done: true, current: false },
    { id: 2, name: 'Documents',
      done:    ![VENDOR_STATUS.PENDING, VENDOR_STATUS.DOCUMENTS_PENDING].includes(vendorStatus),
      current: vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING },
    { id: 3, name: 'Review',
      done:    [VENDOR_STATUS.APPROVED, VENDOR_STATUS.REJECTED].includes(vendorStatus),
      current: vendorStatus === VENDOR_STATUS.UNDER_REVIEW },
    { id: 4, name: 'Live',
      done:    vendorStatus === VENDOR_STATUS.APPROVED,
      current: false },
  ];
  const doneCount = steps.filter(s => s.done).length;

  // Fixed icons — use only well-supported MCI / Ionicons names
  const quickActions = [
    { label: 'Add Vehicle',  icon: 'car-outline',          lib: 'ion', color: C.blue,   route: 'AddVehicleScreen' },
    { label: 'Add Staff',    icon: 'people-outline',        lib: 'ion', color: C.purple, route: 'AddStaffScreen' },
    { label: 'Direct Book',  icon: 'book-outline',          lib: 'ion', color: C.orange, route: 'DirectBookings' },
    { label: 'Links',        icon: 'link-outline',          lib: 'ion', color: C.teal,   route: 'BookingLinks' },
    { label: 'P2P Market',   icon: 'swap-horizontal-outline',lib:'ion', color: C.cyan,   route: 'P2PDashboard' },
    { label: 'B2B',          icon: 'briefcase-outline',      lib: 'ion', color: C.indigo, route: 'B2BDashboard' },
    { label: 'Social',       icon: 'newspaper-outline',      lib: 'ion', color: C.pink,   route: 'SocialFeed' },
    { label: 'Tracking',     icon: 'navigate-outline',       lib: 'ion', color: C.red,    route: 'VendorTracking' },
  ];

  const SERVICES = [
    { id: SERVICE_IDS.BIKE,        name: 'Bike Rentals',     icon: 'motorbike',       color: C.amber,  route: 'BikeHomeScreen' },
    { id: SERVICE_IDS.SELF_DRIVE,  name: 'Self-Drive Cars',  icon: 'car-side',        color: C.blue,   route: 'SelfDriveHomeScreen' },
    { id: SERVICE_IDS.CAR_RENTAL,  name: 'Car Rental',       icon: 'car',             color: C.g600,   route: 'CarRentalHomeScreen' },
    { id: SERVICE_IDS.LUXURY,      name: 'Luxury Cars',      icon: 'car-sports',      color: C.purple, route: 'LuxuryHomeScreen' },
    { id: SERVICE_IDS.BUS,         name: 'Bus & Tempo',      icon: 'bus',             color: C.pink,   route: 'BusHomeScreen' },
    { id: SERVICE_IDS.TRANSPORTER, name: 'Transporter',      icon: 'truck-delivery',  color: C.red,    route: 'TruckHomeScreen' },
    { id: SERVICE_IDS.PACKERS,     name: 'Packers & Movers', icon: 'package-variant', color: C.cyan,   route: 'PackersHomeScreen' },
    { id: SERVICE_IDS.EQUIPMENT,   name: 'Equipment',        icon: 'hammer-wrench',   color: C.indigo, route: 'EquipmentHomeScreen' },
  ];
  const myServices = SERVICES.filter(s => hasService(s.id));

  // Manage — 2-column grid (no more giant single card)
  const manageItems = [
    { label: 'Fleet',          sub: `${profile?.fleetsCount ?? 0} vehicles`, icon: 'car-outline',             lib: 'ion', color: C.blue,   route: 'FleetListScreen' },
    { label: 'Staff',          sub: 'Manage team',                           icon: 'people-outline',           lib: 'ion', color: C.purple, route: 'StaffListScreen' },
{ label: 'Direct Booking', sub: 'Walk-ins',                              icon: 'book-outline',             lib: 'ion', color: C.orange, route: 'DirectBookings' },
    { label: 'Booking Links',  sub: 'Share & track',                         icon: 'link-outline',             lib: 'ion', color: C.indigo, route: 'BookingLinks' },
    { label: 'Financials',     sub: 'P&L reports',                           icon: 'bar-chart-outline',        lib: 'ion', color: C.purple, route: 'Financials' },
    { label: 'Earnings',       sub: 'Revenue & payouts',                     icon: 'trending-up-outline',      lib: 'ion', color: C.g600,   route: 'EarningsScreen' },
    { label: 'P2P Market',     sub: 'Trade fleet',                           icon: 'swap-horizontal-outline',  lib: 'ion', color: C.teal,   route: 'P2PDashboard' },
    { label: 'B2B',            sub: 'Marketplace',                           icon: 'briefcase-outline',        lib: 'ion', color: C.cyan,   route: 'B2BDashboard' },
    { label: 'Live Tracking',  sub: 'Driver GPS',                            icon: 'navigate-outline',         lib: 'ion', color: C.red,    route: 'VendorTracking' },
  ];

  const pendingActions = [
    { name: 'Complete Profile',  desc: 'Business details',  icon: 'person-outline',         lib: 'ion', color: C.blue,   route: 'ProfileScreen' },
    { name: 'Upload Documents',  desc: 'GST, PAN & more',   icon: 'document-text-outline',  lib: 'ion', color: C.purple, route: 'VendorDocuments' },
    { name: 'Choose Services',   desc: 'What you offer',    icon: 'grid-outline',            lib: 'ion', color: C.g600,   route: 'VendorServices' },
    { name: 'Add Locations',     desc: 'Cities you serve',  icon: 'location-outline',        lib: 'ion', color: C.orange, route: 'VendorLocations' },
  ];

  const growth   = earnings?.growth ?? 0;
  const positive = growth >= 0;

  // Header: show the revenue card only once the vendor is actually earning
  // (≥ ₹5K this month). Until then the header is action-focused — what a
  // vendor opens the app for: new inquiries + bookings to act on.
  const showEarnings = (earnings?.thisMonth || 0) >= 5000;
  const headerStats = [
    { label: 'Inquiries', value: inquiriesTotal,               icon: 'mail-unread-outline',    route: 'AllInquiries', hot: inquiriesTotal > 0 },
    { label: 'Ongoing',   value: bookingsData?.active ?? 0,    icon: 'flash-outline',          route: 'AllBookings', params: { initialTab: 'ongoing' } },
    { label: 'Completed', value: bookingsData?.completed ?? 0, icon: 'checkmark-done-outline', route: 'AllBookings', params: { initialTab: 'completed' } },
  ];

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />

        {/* Header skeleton — matches real header layout */}
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={sk.hero}>
          <SafeAreaView>
            {/* Top bar: avatar + name/greeting + bell */}
            <View style={sk.topRow}>
              {/* Avatar */}
              <View style={sk.avatarCircle} />
              {/* Name block */}
              <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
                <Bone w={60} h={9} r={4} />
                <Bone w={150} h={14} r={5} />
                <Bone w={58} h={18} r={9} style={{ marginTop: 2 }} />
              </View>
              {/* Bell button */}
              <View style={sk.iconCircle} />
            </View>

            {/* Earnings card skeleton */}
            <View style={sk.earningsCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                <View style={{ gap: 6 }}>
                  <Bone w={80} h={9} r={4} />
                  <Bone w={130} h={30} r={6} />
                </View>
                <Bone w={52} h={22} r={11} />
              </View>
              {/* Mini strip */}
              <View style={sk.miniStripSk}>
                {[0,1,2,3].map(i => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={sk.vLine} />}
                    <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                      <Bone w={36} h={11} r={4} />
                      <Bone w={28} h={8} r={3} />
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Body skeleton */}
        <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 22 }}>
          {/* Quick actions */}
          <View style={{ gap: 10 }}>
            <Bone w={110} h={13} r={5} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 6 }}>
              {[0,1,2,3,4,5,6,7].map(i => (
                <View key={i} style={[sk.qaItem, { width: QA_W }]}>
                  <Bone w={56} h={56} r={28} style={{ marginBottom: 6 }} />
                  <Bone w={QA_W - 12} h={9} r={3} />
                </View>
              ))}
            </View>
          </View>

          {/* Manage grid */}
          <View style={{ gap: 10 }}>
            <Bone w={70} h={13} r={5} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[0,1,2,3,4,5,6,7].map(i => (
                <View key={i} style={sk.manageCard}>
                  <Bone w={40} h={40} r={12} style={{ marginBottom: 10 }} />
                  <Bone w={CARD_W - 40} h={12} r={4} style={{ marginBottom: 5 }} />
                  <Bone w={CARD_W - 56} h={9} r={3} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[C.g500]} tintColor={C.g400} progressBackgroundColor="#fff" />
        }
      >
        {/* ══════════════════════════════════════════
            HEADER — Emerald Green
        ══════════════════════════════════════════ */}
        <LinearGradient
          colors={[C.g900, '#064E3B', C.g700]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Decorative circles */}
          <View style={s.deco1} />
          <View style={s.deco2} />

          <SafeAreaView>
            {/* Top bar */}
            <View style={s.topBar}>
              <View style={s.topLeft}>
                <Avatar name={bizName} size={40} onPress={() => navigation.navigate('ProfileScreen')} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={s.greeting}>Good day 👋</Text>
                  <Text style={s.bizName} numberOfLines={1}>{bizName}</Text>
                  {profile?.vid && <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>ID: {profile.vid}</Text>}
                  {/* Status pill — sits below name, no overlap */}
                  <View style={[s.statusPill, { backgroundColor: stCfg.bg, borderColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', marginTop: 4 }]}>
                    <View style={[s.statusDot, { backgroundColor: stCfg.dot }]} />
                    <Text style={[s.statusTxt, { color: stCfg.color }]}>{stCfg.label}</Text>
                  </View>
                </View>
              </View>
              <View style={s.topRight}>
                {/* Bell only — profile is the avatar on the left */}
                <TouchableOpacity style={s.iconBtn}
                  onPress={() => navigation.navigate('NotificationsScreen')} activeOpacity={0.75}>
                  <Ionicons name="notifications-outline" size={16} color="rgba(255,255,255,0.9)" />
                  {unreadCount > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Action stats (approved, revenue still ramping) — vendor's
                first-glance: inquiries to quote + bookings to run. */}
            {isApproved && !showEarnings && (
              <View style={s.statRow}>
                {headerStats.map((st, i) => (
                  <TouchableOpacity key={i} style={s.statCard} activeOpacity={0.8}
                    onPress={() => navigation.navigate(st.route, st.params)}>
                    <View style={s.statTop}>
                      <Ionicons name={st.icon} size={15} color="rgba(255,255,255,0.85)" />
                      {st.hot && <View style={s.statHotDot} />}
                    </View>
                    <Text style={s.statVal}>{st.value}</Text>
                    <Text style={s.statLbl}>{st.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Earnings (approved, ₹5K+ this month) */}
            {isApproved && showEarnings && (
              <TouchableOpacity onPress={() => navigation.navigate('EarningsScreen')}
                activeOpacity={0.88} style={s.earningsCard}>
                <View style={s.earningsTop}>
                  <View>
                    <Text style={s.earningsLbl}>THIS MONTH</Text>
                    <Text style={s.earningsAmt}>{fmt(earnings?.thisMonth || 0)}</Text>
                  </View>
                  <View style={[s.growthPill, {
                    backgroundColor: positive ? 'rgba(52,211,153,0.2)' : 'rgba(252,165,165,0.2)',
                  }]}>
                    <Ionicons name={positive ? 'trending-up-outline' : 'trending-down-outline'}
                      size={13} color={positive ? C.g400 : '#FCA5A5'} />
                    <Text style={[s.growthTxt, { color: positive ? C.g400 : '#FCA5A5' }]}>
                      {Math.abs(growth)}%
                    </Text>
                  </View>
                </View>
                <View style={s.miniStrip}>
                  {[
                    { v: fmt(earnings?.today || 0),        l: 'Today' },
                    { v: fmt(earnings?.pendingPayout || 0), l: 'Pending' },
                    { v: `${bookingsData?.completed || 0}`, l: 'Trips' },
                    { v: 'Details →',                       l: 'Earnings', accent: true },
                  ].map((m, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View style={s.vLine} />}
                      <View style={s.miniCell}>
                        <Text style={[s.miniVal, m.accent && { color: C.g400, fontSize: 13 }]}>{m.v}</Text>
                        <Text style={s.miniLbl}>{m.l}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </TouchableOpacity>
            )}

            {/* Progress (pending) */}
            {!isApproved && (
              <View style={s.progressBlock}>
                <View style={s.progressHeader}>
                  <Text style={s.progressTitle}>Complete setup to go live</Text>
                  <Text style={s.progressCount}>{doneCount}/{steps.length} done</Text>
                </View>
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { width: `${(doneCount / steps.length) * 100}%` }]} />
                </View>
                <View style={s.stepRow}>
                  {steps.map((st, i) => (
                    <React.Fragment key={st.id}>
                      <View style={[s.stepDot, st.done && s.stepDotDone, st.current && s.stepDotActive]}>
                        {st.done
                          ? <Ionicons name="checkmark" size={9} color="#fff" />
                          : <Text style={[s.stepNum, st.current && { color: '#fff' }]}>{st.id}</Text>}
                      </View>
                      {i < steps.length - 1 && (
                        <View style={[s.stepLine, st.done && { backgroundColor: C.g400 }]} />
                      )}
                    </React.Fragment>
                  ))}
                  <Text style={s.stepCurrent}>
                    {steps.find(st => st.current)?.name || (doneCount === steps.length ? 'All done!' : steps[doneCount]?.name)}
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>

        {/* ══════════════════════════════════════════
            BODY
        ══════════════════════════════════════════ */}
        <View style={s.body}>

          {/* ── New Inquiries ───────────────────────────────────────
              Sits first so vendors see action items "at first sight".
              Live data: open quote-requests across the vendor's approved
              services, merged + newest-first (see api/inquiriesApi). */}
          {isApproved && inquiries.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>New Inquiries</Text>
                <View style={s.inqCountPill}>
                  <View style={s.inqLiveDot} />
                  <Text style={s.inqCountTxt}>{inquiriesTotal} new</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {inquiries.map((q) => {
                  const meta = SVC_META[q.service] || { icon: 'help-circle', color: C.muted };
                  return (
                    <TouchableOpacity key={q.id} style={s.inqCard} activeOpacity={0.85}
                      onPress={() => openInquiryDetail(q)}>
                      {/* Top: service + summary + time/urgency */}
                      <View style={s.inqTop}>
                        <View style={[s.inqIconBox, { backgroundColor: meta.color + '14' }]}>
                          <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.inqTitle} numberOfLines={1}>{q.title}</Text>
                          {!!q.sub && <Text style={s.inqSub} numberOfLines={1}>{q.sub}</Text>}
                        </View>
                        {q.urgent ? (
                          <View style={s.inqUrgent}>
                            <Ionicons name="time-outline" size={10} color={C.red} />
                            <Text style={s.inqUrgentTxt}>{q.expiry}</Text>
                          </View>
                        ) : (
                          <Text style={s.inqAgo}>{q.ago}</Text>
                        )}
                      </View>

                      {/* Bottom: customer + action */}
                      <View style={s.inqBottom}>
                        <View style={s.inqCustomer}>
                          <View style={s.inqAvatar}>
                            <Text style={s.inqAvatarTxt}>{q.customer.charAt(0)}</Text>
                          </View>
                          <Text style={s.inqCustomerTxt} numberOfLines={1}>{q.customer}</Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.85}
                          style={[s.inqBtn, q.accept && { backgroundColor: C.blue }]}
                          onPress={() => handleInquiryAction(q)}>
                          <Ionicons name={q.accept ? 'checkmark-circle-outline' : 'pricetag-outline'} size={13} color="#fff" />
                          <Text style={s.inqBtnTxt}>{q.accept ? 'Accept' : 'Send Quote'}</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={s.inqViewAll} activeOpacity={0.7}
                onPress={() => navigation.navigate('AllInquiries')}>
                <Text style={s.inqViewAllTxt}>View all inquiries</Text>
                <Ionicons name="arrow-forward" size={13} color={C.g700} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Pending setup ─────────────────────────── */}
          {!isApproved && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Complete Setup</Text>
              <View style={s.pendingGrid}>
                {pendingActions.map((a, i) => (
                  <TouchableOpacity key={i} style={s.pendingCard}
                    onPress={() => navigation.navigate(a.route)} activeOpacity={0.75}>
                    <View style={[s.pendingIconBox, { backgroundColor: a.color + '15' }]}>
                      <Ico lib={a.lib} name={a.icon} size={18} color={a.color} />
                    </View>
                    <Text style={s.pendingName}>{a.name}</Text>
                    <Text style={s.pendingDesc}>{a.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING && (
                <TouchableOpacity style={[s.alertRow, { backgroundColor: C.amberL, borderColor: '#FDE68A' }]}
                  onPress={() => navigation.navigate('VendorDocuments')} activeOpacity={0.8}>
                  <Ionicons name="warning-outline" size={15} color={C.amber} />
                  <Text style={[s.alertTxt, { color: '#92400E', flex: 1, marginLeft: 9 }]}>Upload documents to continue</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.amber} />
                </TouchableOpacity>
              )}
              {vendorStatus === VENDOR_STATUS.UNDER_REVIEW && (
                <View style={[s.alertRow, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
                  <Ionicons name="time-outline" size={15} color={C.blue} />
                  <Text style={[s.alertTxt, { color: C.blue, flex: 1, marginLeft: 9 }]}>Under review · 1–2 business days</Text>
                </View>
              )}
              {vendorStatus === VENDOR_STATUS.REJECTED && (
                <View style={[s.alertRow, { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                  <Ionicons name="close-circle-outline" size={15} color={C.red} />
                  <Text style={[s.alertTxt, { color: C.red, flex: 1, marginLeft: 9 }]}>
                    {profile?.rejectionReason || 'Application rejected — contact support'}
                  </Text>
                </View>
              )}
              {/* Getting started */}
              <View style={s.guideCard}>
                <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Getting Started</Text>
                {[
                  { n: 1, t: 'Complete your profile',       d: 'Business name, logo and contact info' },
                  { n: 2, t: 'Upload documents',             d: 'GST certificate, PAN card and more' },
                  { n: 3, t: 'Request services & locations', d: 'Choose what you offer and where' },
                  { n: 4, t: 'Add your fleet',               d: 'Vehicles and photos once approved' },
                ].map((item, idx, arr) => (
                  <View key={item.n}>
                    <View style={s.guideRow}>
                      <View style={[s.guideNum,
                        steps[item.n-1]?.done    && { backgroundColor: C.g600 },
                        steps[item.n-1]?.current && { backgroundColor: C.blue },
                      ]}>
                        {steps[item.n-1]?.done
                          ? <Ionicons name="checkmark" size={11} color="#fff" />
                          : <Text style={s.guideNumTxt}>{item.n}</Text>}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.guideTitle}>{item.t}</Text>
                        <Text style={s.guideDesc}>{item.d}</Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View style={s.guideLine} />}
                  </View>
                ))}
              </View>
            </View>
          )}


          {/* ── Quick Actions ─────────────────────────── */}
          {/* Visible to pending vendors too — write actions inside each
              destination screen are gated by VerificationGate, so they
              can browse the app without being trapped on the onboarding
              card. */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Quick Actions</Text>
              {!isApproved && (
                <View style={s.previewPill}>
                  <Ionicons name="eye-outline" size={11} color={C.amber} />
                  <Text style={s.previewPillTxt}>Preview</Text>
                </View>
              )}
            </View>
            <View style={s.qaRow}>
              {quickActions.map((qa, i) => (
                <TouchableOpacity key={i} style={s.qaItem}
                  onPress={() => navigation.navigate(qa.route)} activeOpacity={0.7}>
                  <View style={[s.qaCircle, { backgroundColor: qa.color + '14' }]}>
                    <Ico lib={qa.lib} name={qa.icon} size={26} color={qa.color} />
                  </View>
                  <Text style={s.qaLabel} numberOfLines={2}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Your Services ─────────────────────────── */}
          {isApproved && myServices.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Your Services</Text>
                <View style={s.countPill}>
                  <Text style={s.countPillTxt}>{myServices.length} active</Text>
                </View>
              </View>
              <View style={s.svcGrid}>
                {myServices.map((svc, i) => {
                  const svcKey = SVC_ID_TO_SERVICE[svc.id];
                  const todayCount = todayQuoteCounts[svcKey] || 0;
                  return (
                    <TouchableOpacity key={i} style={s.svcCard}
                      onPress={() => navigation.navigate(svc.route)} activeOpacity={0.75}>
                      <View style={{ marginRight: 10 }}>
                        <View style={[s.svcIconBox, { backgroundColor: svc.color + '14' }]}>
                          <MaterialCommunityIcons name={svc.icon} size={22} color={svc.color} />
                        </View>
                        {todayCount > 0 && (
                          <View style={[s.svcCountDot, { backgroundColor: svc.color }]}>
                            <Text style={s.svcCountDotTxt}>{todayCount > 99 ? '99+' : todayCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.svcName} numberOfLines={2}>{svc.name}</Text>
                      <Ionicons name="chevron-forward" size={13} color={C.muted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Manage — 2-column grid ────────────────── */}
          {/* Visible to pending vendors too. Browsing is free; write
              actions inside each destination screen are gated. */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Manage</Text>
              {!isApproved && (
                <View style={s.previewPill}>
                  <Ionicons name="eye-outline" size={11} color={C.amber} />
                  <Text style={s.previewPillTxt}>Preview</Text>
                </View>
              )}
            </View>
            <View style={s.manageGrid}>
              {manageItems.map((m, i) => (
                <TouchableOpacity key={i} style={s.manageCard}
                  onPress={() => navigation.navigate(m.route)} activeOpacity={0.75}>
                  <View style={[s.manageIconBox, { backgroundColor: m.color + '14' }]}>
                    <Ico lib={m.lib} name={m.icon} size={20} color={m.color} />
                  </View>
                  <Text style={s.manageLabel}>{m.label}</Text>
                  <Text style={s.manageSub}>{m.sub}</Text>
                  <Ionicons name="chevron-forward" size={12} color={C.muted} style={s.manageArrow} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Community / Social ───────────────────── */}
          {/* Visible to pending vendors too — browsing the feed/messages
              is allowed; posting / sending is gated inside each screen. */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Community</Text>
              {!isApproved && (
                <View style={s.previewPill}>
                  <Ionicons name="eye-outline" size={11} color={C.amber} />
                  <Text style={s.previewPillTxt}>Preview</Text>
                </View>
              )}
            </View>
            <View style={s.manageGrid}>
                {[
                  { label: 'Social Feed',  sub: 'Posts & updates',  icon: 'newspaper-outline',     lib: 'ion', color: C.pink,   route: 'SocialFeed' },
                  { label: 'Messages',     sub: 'Vendor chats',     icon: 'chatbubbles-outline',   lib: 'ion', color: C.blue,   route: 'SocialMessagesScreen' },
                ].map((m, i) => (
                  <TouchableOpacity key={i} style={s.manageCard}
                    onPress={() => navigation.navigate(m.route)} activeOpacity={0.75}>
                    <View style={[s.manageIconBox, { backgroundColor: m.color + '14' }]}>
                      <Ico lib={m.lib} name={m.icon} size={20} color={m.color} />
                    </View>
                    <Text style={s.manageLabel}>{m.label}</Text>
                    <Text style={s.manageSub}>{m.sub}</Text>
                    <Ionicons name="chevron-forward" size={12} color={C.muted} style={s.manageArrow} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* UPDATE MODAL */}
      <Modal visible={showUpdateModal} transparent animationType="slide" statusBarTranslucent
        onRequestClose={() => { if (!updateInfo?.forceUpdate) setShowUpdateModal(false); }}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            {!updateInfo?.forceUpdate && (
              <TouchableOpacity style={s.modalClose} onPress={() => setShowUpdateModal(false)}>
                <Ionicons name="close" size={20} color={C.sub} />
              </TouchableOpacity>
            )}
            <View style={s.modalIconWrap}>
              <LinearGradient colors={[C.g900, C.g600]} style={s.modalIconGrad}>
                <Ionicons name="rocket-outline" size={30} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.modalTitle}>Update Available</Text>
            <Text style={s.modalVersion}>Version {updateInfo?.latestVersion}</Text>
            <Text style={s.modalMsg}>
              {updateInfo?.updateMessage || 'A new version is available with improvements and bug fixes.'}
            </Text>
            <TouchableOpacity activeOpacity={0.85}
              onPress={() => { if (updateInfo?.playStoreUrl) Linking.openURL(updateInfo.playStoreUrl); }}>
              <LinearGradient colors={[C.g900, C.g600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.modalBtn}>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={s.modalBtnTxt}>Update Now</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!updateInfo?.forceUpdate && (
              <TouchableOpacity style={s.modalSkip} onPress={() => setShowUpdateModal(false)}>
                <Text style={s.modalSkipTxt}>Not now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  hero:   { paddingHorizontal: 16, paddingBottom: 24, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, marginBottom: 18 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)',
  },
  iconCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
  },
  miniStripSk: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.13)', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 10,
  },
  vLine: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 6 },
  metricCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 11,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  qaItem:     { alignItems: 'center' },
  manageCard: { width: CARD_W, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
});

const CARD_W = (W - 32 - 10) / 2;   // 2-col grid with 10 gap
const QA_W   = (W - 32 - 18) / 4;   // 4 per row (16+16 padding, 3 gaps of 6 → 8 actions = balanced 4+4)

const s = StyleSheet.create({

  // ── Header ───────────────────────────────────────────────────
  hero: { paddingHorizontal: 16, paddingBottom: 14, overflow: 'hidden' },
  deco1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(52,211,153,0.07)', top: -60, right: -40,
  },
  deco2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(16,185,129,0.05)', bottom: 0, left: W * 0.35,
  },
  topBar:   { flexDirection: 'row', alignItems: 'center', paddingTop: 8, marginBottom: 12 },
  topLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greeting: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.3 },
  bizName:  { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginTop: 2 },

  // Status pill — white text + white border so it's always visible on green
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '700' },

  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#022C22',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { fontSize: 7, fontWeight: '900', color: '#fff' },

  // ── Earnings card ──────────────────────────────────────────
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
  },
  earningsTop: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginBottom: 12,
  },
  earningsLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 },
  earningsAmt: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  growthPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  growthTxt:   { fontSize: 13, fontWeight: '800' },
  miniStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.13)', borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 10,
  },
  vLine:    { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 6 },
  miniCell: { flex: 1, alignItems: 'center' },
  miniVal:  { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  miniLbl:  { fontSize: 9.5, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  // ── Header action stat cards (shown until revenue ≥ ₹5K) ────
  statRow:    { flexDirection: 'row', gap: 8 },
  statCard:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  statTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, minHeight: 15 },
  statHotDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FCA5A5' },
  statVal:    { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statLbl:    { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  // ── Progress (pending) ──────────────────────────────────────
  progressBlock:  { marginBottom: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  progressCount:  { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  progressBarBg:  { height: 4, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 2, marginBottom: 12 },
  progressBarFill:{ height: 4, backgroundColor: '#34D399', borderRadius: 2 },
  stepRow:    { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: '#059669', borderColor: '#059669' },
  stepDotActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  stepNum:       { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
  stepLine:      { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.12)', maxWidth: 28 },
  stepCurrent:   { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginLeft: 10 },

  // ── Body ────────────────────────────────────────────────────
  body: { paddingHorizontal: 16, paddingTop: 18 },

  // ── Section ─────────────────────────────────────────────────
  section:      { marginBottom: 22 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.text, letterSpacing: -0.2, marginBottom: 10 },
  countPill:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  countPillTxt: { fontSize: 10, fontWeight: '700', color: C.g700 },
  // "Preview" badge — sits next to Quick Actions / Manage section titles
  // for pending vendors so they know they can look but not act.
  previewPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: C.amberL, borderWidth: 1, borderColor: '#FDE68A' },
  previewPillTxt: { fontSize: 10, fontWeight: '800', color: C.amber, letterSpacing: 0.3 },

  // ── Metrics ──────────────────────────────────────────────────
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  metricCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  metricIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricVal:  { fontSize: 18, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginBottom: 2 },
  metricLbl:  { fontSize: 9,  fontWeight: '700', color: C.sub },
  metricUnit: { fontSize: 8.5,fontWeight: '500', color: C.muted },

  // ── New Inquiries (mockup) ────────────────────────────────────
  inqCountPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: C.redL, borderWidth: 1, borderColor: '#FECACA' },
  inqLiveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  inqCountTxt:  { fontSize: 10, fontWeight: '800', color: C.red },
  inqCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  inqTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inqIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inqTitle:   { fontSize: 13, fontWeight: '800', color: C.text },
  inqSub:     { fontSize: 11, color: C.sub, marginTop: 2 },
  inqAgo:     { fontSize: 10, color: C.muted, fontWeight: '600' },
  inqUrgent:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.redL, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  inqUrgentTxt: { fontSize: 9, fontWeight: '800', color: C.red },
  inqBottom:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  inqCustomer:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  inqAvatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  inqAvatarTxt:   { fontSize: 11, fontWeight: '800', color: C.g700 },
  inqCustomerTxt: { fontSize: 12, fontWeight: '600', color: C.text, flex: 1 },
  inqBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  inqBtnTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },
  inqViewAll:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 11, borderRadius: 12, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  inqViewAllTxt: { fontSize: 12, fontWeight: '800', color: C.g700 },

  // ── Quick Actions ─────────────────────────────────────────────
  qaRow:    { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 6 },
  qaItem:   { width: QA_W, alignItems: 'center' },
  qaCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  // fixed 2-line height so 1-word and 2-word labels keep every cell aligned
  qaLabel:  { fontSize: 9, fontWeight: '700', color: C.sub, textAlign: 'center', lineHeight: 12, height: 24 },

  // ── Services ──────────────────────────────────────────────────
  svcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  svcCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: 14, padding: 13,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  svcIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  svcName:    { flex: 1, fontSize: 11.5, fontWeight: '700', color: C.text, marginLeft: 9, lineHeight: 15 },
  svcCountDot: {
    position: 'absolute', top: -5, right: -5,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: C.card,
  },
  svcCountDotTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // ── Manage — 2-column grid (NO single giant card) ─────────────
  manageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  manageCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  manageIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  manageLabel:   { fontSize: 12.5, fontWeight: '800', color: C.text, marginBottom: 2 },
  manageSub:     { fontSize: 10, color: C.muted, lineHeight: 14 },
  manageArrow:   { position: 'absolute', bottom: 12, right: 12 },

  // ── Pending setup ─────────────────────────────────────────────
  pendingGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  pendingCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  pendingIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  pendingName:    { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 3 },
  pendingDesc:    { fontSize: 10, color: C.muted },

  // ── Alert ─────────────────────────────────────────────────────
  alertRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12,
  },
  alertTxt: { fontSize: 12, fontWeight: '600' },

  // ── Getting started ───────────────────────────────────────────
  guideCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  guideRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  guideNum:    { width: 26, height: 26, borderRadius: 13, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  guideNumTxt: { fontSize: 11, fontWeight: '800', color: C.sub },
  guideTitle:  { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  guideDesc:   { fontSize: 11, color: C.muted, lineHeight: 15 },
  guideLine:   { height: 1, backgroundColor: C.border, marginLeft: 38 },

  // ── Update modal ──────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, alignItems: 'center',
  },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 20 },
  modalClose:    { position: 'absolute', top: 20, right: 20 },
  modalIconWrap: { marginBottom: 16 },
  modalIconGrad: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalTitle:    { fontSize: 22, fontWeight: '900', color: C.text, marginBottom: 4 },
  modalVersion:  { fontSize: 13, color: C.sub, marginBottom: 12 },
  modalMsg:      { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, paddingHorizontal: 36, borderRadius: 14,
  },
  modalBtnTxt:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalSkip:    { marginTop: 14 },
  modalSkipTxt: { fontSize: 13, color: C.muted, fontWeight: '600' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, StatusBar, Modal, Linking,
  Animated, Easing, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import Svg, { Circle } from 'react-native-svg';
import { getVendorProfile, getVendorBookings, getVendorEarnings, getVendorFinancials, getBaseURL, getSessionToken, apiPatch } from '../../api/client';
import { fetchInquiries } from '../../api/inquiriesApi';
import { showConfirm, showSuccess, showError } from '../../../services/alertService';
import { NotifBadgeContext } from '../../../contexts/NotifBadgeContext';
import DeviceInfo from 'react-native-device-info';
import AppEvents, { EVT_NEW_QUOTE, EVT_QUOTE_SENT } from '../../../utils/AppEvents';
import { SC as T, G, rs, rf, shade, cardShadow, rowShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import SheetHandle from '../_shared/SheetHandle';
import CornerGrid from '../_shared/CornerGrid';
const { width: W } = Dimensions.get('window');

// Fixed top bar's gradient (not in the shared theme file).
const G_HERO_TOP = [T.forestDark, T.forest];

// ── Design tokens ──────────────────────────────────────────────
// Same key names the screen already uses everywhere below — only the values
// now come from the shared "Elevate" theme (../_shared/theme) instead of
// hardcoded hex, so every C.xxx reference in this file repaints for free.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50:  T.tintEmerald,
  bg:     T.bg,
  card:   T.card,
  border: T.border,
  text:   T.ink,
  sub:    T.text,
  muted:  T.subText,
  blue:    T.blue,   blueL:   T.blueLight,
  purple:  T.purple, purpleL: T.purpleLight,
  amber:   T.amber,  amberL:  T.amberLight,
  red:     T.red,    redL:    T.redLight,
  orange:  T.orange, orangeL: T.orangeL,
  indigo:  T.indigo, indigoL: T.indigoLight,
  teal:    T.oceanLight,       tealL: T.tintOcean,
  pink:    T.rose,             pinkL: T.tintRose,
  cyan:    shade(T.ocean, 25), cyanL: T.tintOcean,
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

// ── Section heading (kicker + title, optional right slot) ────────
function SectionHeading({ kicker, title, right }) {
  return (
    <View style={s.headingRow}>
      <View>
        {!!kicker && <Text style={s.headingKicker}>{kicker}</Text>}
        <Text style={s.headingTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function PreviewPill() {
  return (
    <View style={s.previewPill}>
      <Ionicons name="eye-outline" size={11} color={C.amber} />
      <Text style={s.previewPillTxt}>Preview</Text>
    </View>
  );
}

// ── Circular progress ring (SVG dasharray/dashoffset technique) ──
function Ring({ pct = 0, size = 116, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke="rgba(20,56,46,0.08)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={cx} cy={cy} r={r} stroke={C.g600} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        rotation="-90" origin={`${cx}, ${cy}`}
      />
    </Svg>
  );
}

// ── Collection ring card — real collected/pending/total split from
// getVendorFinancials(), with a bottom strip of the vendor's own
// ongoing/completed/inquiries counts (same numbers the header stat row
// already shows — no invented data). ─────────────────────────────
function CollectionRingCard({
  pct, collected, total, pending, delta, positive,
  ongoing, completed, inquiries: inqCount,
  onPressRing, onPressDelta, onPressOngoing, onPressCompleted, onPressInquiries,
}) {
  return (
    <View style={[s.crCard]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPressRing} style={s.crTop}>
        <View style={s.crRingWrap}>
          <Ring pct={pct} />
          <View style={s.crRingCenter}>
            <Text style={s.crRingPct}>{pct}</Text>
            <Text style={s.crRingPctLbl}>PERCENT</Text>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.crKicker}>COLLECTION</Text>
          {delta != null && (
            <TouchableOpacity onPress={onPressDelta} activeOpacity={0.8}
              style={[s.crDeltaPill, { backgroundColor: positive ? 'rgba(52,211,153,0.15)' : 'rgba(220,38,38,0.1)' }]}>
              <Ionicons name={positive ? 'trending-up-outline' : 'trending-down-outline'} size={12} color={positive ? C.g600 : C.red} />
              <Text style={[s.crDeltaTxt, { color: positive ? C.g600 : C.red }]}>{delta}</Text>
            </TouchableOpacity>
          )}
          <Text style={s.crAmt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{collected}</Text>
          <Text style={s.crSub}>of {total} billed</Text>
        </View>
      </TouchableOpacity>

      <View style={s.crLegend}>
        <View style={s.crLegendItem}>
          <View style={[s.crLegendDot, { backgroundColor: C.g600 }]} />
          <Text style={s.crLegendLbl}>Received</Text>
          <Text style={s.crLegendVal}>{collected}</Text>
        </View>
        <View style={s.crLegendItem}>
          <View style={[s.crLegendDot, { backgroundColor: T.gold }]} />
          <Text style={s.crLegendLbl}>Pending</Text>
          <Text style={s.crLegendVal}>{pending}</Text>
        </View>
      </View>

      <View style={s.crRule} />

      <View style={s.crStrip}>
        <TouchableOpacity style={s.crStripCell} activeOpacity={0.75} onPress={onPressOngoing}>
          <Text style={s.crStripVal}>{ongoing}</Text>
          <Text style={s.crStripLbl}>Ongoing</Text>
        </TouchableOpacity>
        <View style={s.crStripDiv} />
        <TouchableOpacity style={s.crStripCell} activeOpacity={0.75} onPress={onPressCompleted}>
          <Text style={s.crStripVal}>{completed}</Text>
          <Text style={s.crStripLbl}>Completed</Text>
        </TouchableOpacity>
        <View style={s.crStripDiv} />
        <TouchableOpacity style={s.crStripCell} activeOpacity={0.75} onPress={onPressInquiries}>
          <Text style={s.crStripVal}>{inqCount}</Text>
          <Text style={s.crStripLbl}>Inquiries</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// ── Bento tile (Quick Actions) — big feature tile / side stack / row-of-5.
// Verbatim port of travel-agent's BentoTile: circular icon chip top, label
// (+ hint on the big tile) pinned to the bottom via the tile's own
// justifyContent:'space-between' — that split IS the design, not a bug.
function BentoTile({ w, h, grad, icon, lib = 'ion', label, hint, big, sm, onPress }) {
  const onGrad = !!grad;
  const fg = onGrad ? '#fff' : C.text;
  const chipBg = onGrad ? 'rgba(255,255,255,0.2)' : T.tintEmerald;
  const iconColor = onGrad ? '#fff' : C.g700;
  const labelStyle = big ? s.bentoLabelBig : sm ? s.bentoLabelSm : s.bentoLabel;
  const dims = { width: w, height: h };
  const inner = (
    <>
      <View style={[s.bentoChip, big && s.bentoChipBig, { backgroundColor: chipBg }]}>
        <Ico lib={lib} name={icon} size={big ? rf(24) : rf(19)} color={iconColor} />
      </View>
      <View>
        <Text style={[labelStyle, sm && { textAlign: 'center' }, { color: fg }]} numberOfLines={big ? 1 : 2}>
          {label}
        </Text>
        {!!hint && (
          <Text style={[s.bentoHint, { color: onGrad ? 'rgba(255,255,255,0.78)' : C.muted }]} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
    </>
  );
  if (onGrad) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[cardShadow, dims]}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.bentoTile, sm && s.bentoTileSm, dims]}>
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[cardShadow, s.bentoTile, s.bentoGlass, sm && s.bentoTileSm, dims]}>
      {inner}
    </TouchableOpacity>
  );
}

// ── Priority card (Action center — horizontal-scroll) ────────────
function PriorityCard({ tone, icon, title, desc, onPress }) {
  const grad = tone === 'gold' ? G.gold : tone === 'ocean' ? G.ocean : G.emerald;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={s.priorityCard}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.priorityBar} />
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.priorityIcon}>
        <Ionicons name={icon} size={18} color="#fff" />
      </LinearGradient>
      <Text style={s.priorityTitle} numberOfLines={1}>{title}</Text>
      <Text style={s.priorityDesc} numberOfLines={2}>{desc}</Text>
      <View style={s.priorityCta}>
        <Text style={s.priorityCtaTxt}>Resolve now</Text>
        <Ionicons name="arrow-forward" size={12} color={C.g700} />
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { unreadCount, refreshBadge } = React.useContext(NotifBadgeContext);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [vendor, setVendor]             = useState(null);
  const [profile, setProfile]           = useState(null);
  const [earnings, setEarnings]         = useState(null);
  const [financials, setFinancials]     = useState(null);
  const [bookingsData, setBookingsData]       = useState(null);
  const [inquiries, setInquiries]             = useState([]);
  const [inquiriesTotal, setInquiriesTotal]   = useState(0);
  const [todayQuoteCounts, setTodayQuoteCounts] = useState({});
  const [updateInfo, setUpdateInfo]           = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchOpen, setSearchOpen]           = useState(false);

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
        // Real collected/pending/total split for the collection ring — same
        // endpoint FinancialsScreen already uses, just also fetched here now.
        try {
          const fin = await getVendorFinancials();
          if (fin?.success !== false) setFinancials(fin?.summary || fin || null);
        } catch (_) {}
        fetchQuoteCounts();
        // Pull open inquiries only for this vendor's approved services
        const slugs = (p.approvedServiceIds || []).map(id => SVC_ID_TO_SERVICE[id]).filter(Boolean);
        fetchInquiries(slugs, { limit: 5 })
          .then(({ items }) => {
            // `limit` above is per-service (each approved service is fetched
            // separately and merged), so a vendor with several approved
            // services could get well over 5 items here — cap what the
            // Dashboard preview actually renders to 5, newest-first (already
            // sorted by fetchInquiries). `inquiriesTotal` stays the real
            // count so the "N new" pill / header stat isn't misleading.
            const openItems = items.filter(x => !x.quoted);   // only not-yet-quoted
            setInquiries(openItems.slice(0, 5));
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
  const quickActions = React.useMemo(() => [
    { label: 'Add Vehicle',  icon: 'car-outline',          lib: 'ion', color: C.blue,   route: 'AddVehicleScreen' },
    { label: 'Add Staff',    icon: 'people-outline',        lib: 'ion', color: C.purple, route: 'AddStaffScreen' },
    { label: 'Direct Book',  icon: 'book-outline',          lib: 'ion', color: C.orange, route: 'DirectBookings' },
    { label: 'Links',        icon: 'link-outline',          lib: 'ion', color: C.teal,   route: 'BookingLinks' },
    { label: 'P2P Market',   icon: 'swap-horizontal-outline',lib:'ion', color: C.cyan,   route: 'P2PDashboard' },
    { label: 'B2B',          icon: 'briefcase-outline',      lib: 'ion', color: C.indigo, route: 'B2BDashboard' },
    { label: 'Social',       icon: 'newspaper-outline',      lib: 'ion', color: C.pink,   route: 'SocialFeed' },
    { label: 'Tracking',     icon: 'navigate-outline',       lib: 'ion', color: C.red,    route: 'VendorTracking' },
  ], []);

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

  const growth   = earnings?.growth ?? 0;
  const positive = growth >= 0;

  // Manage — 2-column grid (no more giant single card)
  const manageItems = React.useMemo(() => [
    { label: 'Fleet',          sub: `${profile?.fleetsCount ?? 0} vehicles`, icon: 'car-outline',             lib: 'ion', color: C.blue,   route: 'FleetListScreen', value: String(profile?.fleetsCount ?? 0) },
    { label: 'Staff',          sub: 'Manage team',                           icon: 'people-outline',           lib: 'ion', color: C.purple, route: 'StaffListScreen' },
    { label: 'Direct Booking', sub: 'Walk-ins',                              icon: 'book-outline',             lib: 'ion', color: C.orange, route: 'DirectBookings' },
    { label: 'Booking Links',  sub: 'Share & track',                         icon: 'link-outline',             lib: 'ion', color: C.indigo, route: 'BookingLinks' },
    { label: 'Financials',     sub: 'P&L reports',                           icon: 'bar-chart-outline',        lib: 'ion', color: C.purple, route: 'Financials' },
    { label: 'Earnings',       sub: 'Revenue & payouts',                     icon: 'trending-up-outline',      lib: 'ion', color: C.g600,   route: 'EarningsScreen', value: earnings ? `${positive ? '+' : '-'}${Math.abs(growth)}%` : null },
    { label: 'P2P Market',     sub: 'Trade fleet',                           icon: 'swap-horizontal-outline',  lib: 'ion', color: C.teal,   route: 'P2PDashboard' },
    { label: 'B2B',            sub: 'Marketplace',                           icon: 'briefcase-outline',        lib: 'ion', color: C.cyan,   route: 'B2BDashboard' },
    { label: 'Live Tracking',  sub: 'Driver GPS',                            icon: 'navigate-outline',         lib: 'ion', color: C.red,    route: 'VendorTracking' },
  ], [profile, earnings, growth, positive]);

  const pendingActions = [
    { name: 'Complete Profile',  desc: 'Business details',  icon: 'person-outline',         lib: 'ion', color: C.blue,   grad: [C.blue,   shade(C.blue, -20)],   route: 'ProfileScreen' },
    { name: 'Upload Documents',  desc: 'GST, PAN & more',   icon: 'document-text-outline',  lib: 'ion', color: C.purple, grad: [C.purple, shade(C.purple, -20)], route: 'VendorDocuments' },
    { name: 'Choose Services',   desc: 'What you offer',    icon: 'grid-outline',            lib: 'ion', color: C.g600,   grad: [C.g600,   shade(C.g600, -20)],   route: 'VendorServices' },
    { name: 'Add Locations',     desc: 'Cities you serve',  icon: 'location-outline',        lib: 'ion', color: C.orange, grad: [C.orange, shade(C.orange, -20)], route: 'VendorLocations' },
  ];

  // Header: show the revenue card only once the vendor is actually earning
  // (≥ ₹5K this month). Until then the header is action-focused — what a
  // vendor opens the app for: new inquiries + bookings to act on.
  const showEarnings = (earnings?.thisMonth || 0) >= 5000;

  // Real collected/pending/total split (getVendorFinancials) for the
  // collection-ring "Business snapshot" card.
  const totalRevenue     = financials?.totalRevenue ?? 0;
  const collectedRevenue = financials?.totalCollected ?? 0;
  const pendingRevenue   = financials?.totalPending ?? 0;
  const collectionPct    = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;

  // Action center — same conditions that already drive the pending-setup
  // alert rows, just surfaced as priority cards instead.
  const docsPending = vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING;

  // ── Search — live filter over what's actually loaded on this screen
  // (services, manage shortcuts, quick actions, the open inquiries already
  // fetched) rather than a fake/placeholder search. ─────────────────
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    myServices.forEach(svc => {
      if (svc.name.toLowerCase().includes(q)) {
        out.push({ key: `svc-${svc.id}`, label: svc.name, sub: 'Service', icon: svc.icon, lib: 'mci', color: svc.color, onPress: () => navigation.navigate(svc.route) });
      }
    });
    manageItems.forEach((m, i) => {
      if (m.label.toLowerCase().includes(q)) {
        out.push({ key: `mng-${i}`, label: m.label, sub: m.sub, icon: m.icon, lib: m.lib, color: m.color, onPress: () => navigation.navigate(m.route) });
      }
    });
    quickActions.forEach((qa, i) => {
      if (qa.label.toLowerCase().includes(q)) {
        out.push({ key: `qa-${i}`, label: qa.label, sub: 'Quick action', icon: qa.icon, lib: qa.lib, color: qa.color, onPress: () => navigation.navigate(qa.route) });
      }
    });
    inquiries.forEach(inq => {
      if (inq.title?.toLowerCase().includes(q) || inq.customer?.toLowerCase().includes(q)) {
        const meta = SVC_META[inq.service] || {};
        out.push({ key: `inq-${inq.id}`, label: inq.customer, sub: inq.title, icon: meta.icon || 'help-circle', lib: 'mci', color: meta.color || C.muted, onPress: () => openInquiryDetail(inq) });
      }
    });
    return out.slice(0, 8);
  }, [searchQuery, myServices, manageItems, quickActions, inquiries, navigation, openInquiryDetail]);

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />

        {/* Header skeleton — matches real header layout (just the fixed
            top bar; the earnings card is a body panel now, not part of
            the header gradient) */}
        <LinearGradient colors={G_HERO_TOP} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={sk.hero}>
          <CornerGrid style={s.deco1} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            {/* Top bar: avatar + name/ID + search & bell */}
            <View style={sk.topRow}>
              {/* Avatar */}
              <View style={sk.avatarCircle} />
              {/* Name block */}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Bone w={150} h={17} r={5} />
                <Bone w={90} h={13} r={4} style={{ marginTop: 6 }} />
              </View>
              {/* Search + bell buttons */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={sk.iconCircle} />
                <View style={sk.iconCircle} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Body skeleton */}
        <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 22 }}>
          {/* Earnings card — now a body panel, matches real layout */}
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

          {/* Quick Actions — matches the real bento layout (big tile +
              side stack, then a row of 5) */}
          <View style={{ gap: 10 }}>
            <Bone w={110} h={13} r={5} />
            <View style={{ flexDirection: 'row', gap: BENTO_GAP }}>
              <Bone w={BENTO_BIG_W} h={BENTO_BIG_H} r={rs(22)} />
              <View style={{ width: BENTO_SIDE_W, gap: BENTO_GAP }}>
                <Bone w={BENTO_SIDE_W} h={BENTO_ROW_H} r={rs(22)} />
                <Bone w={BENTO_SIDE_W} h={BENTO_ROW_H} r={rs(22)} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: BENTO_GAP }}>
              {[0,1,2,3,4].map(i => (
                <Bone key={i} w={BENTO_5W} h={rs(92)} r={rs(22)} />
              ))}
            </View>
          </View>

          {/* Your Services — row-style cards (icon left, name right) */}
          <View style={{ gap: 10 }}>
            <Bone w={110} h={13} r={5} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[0,1,2,3].map(i => (
                <View key={i} style={{
                  width: CARD_W, flexDirection: 'row', alignItems: 'center',
                  backgroundColor: C.card, borderRadius: rs(18), padding: 13,
                  borderWidth: 1, borderColor: C.border,
                }}>
                  <Bone w={36} h={36} r={10} />
                  <Bone w={CARD_W - 80} h={13} r={4} style={{ marginLeft: 9 }} />
                </View>
              ))}
            </View>
          </View>

          {/* Stay in the loop — column-style cards (icon top, label + sub) */}
          <View style={{ gap: 10 }}>
            <Bone w={130} h={13} r={5} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[0,1].map(i => (
                <View key={i} style={sk.manageCard}>
                  <Bone w={38} h={38} r={13} style={{ marginBottom: 10 }} />
                  <Bone w={80} h={13} r={4} style={{ marginBottom: 4 }} />
                  <Bone w={100} h={11} r={3} />
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

      {/* ══════════════════════════════════════════
          FIXED TOP BAR — pinned above the scroll, like travel-agent's header
      ══════════════════════════════════════════ */}
      <LinearGradient colors={G_HERO_TOP} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[s.heroTop, { paddingBottom: searchOpen ? rs(12) : rs(8) }]}>
        <CornerGrid style={s.deco1} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={[s.topBar, { marginBottom: searchOpen ? 16 : 8 }]}>
            <View style={s.topLeft}>
              <Avatar name={bizName} size={40} onPress={() => navigation.navigate('ProfileScreen')} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={s.bizName} numberOfLines={1}>{bizName}</Text>
                {profile?.vid && <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>ID: {profile.vid}</Text>}
              </View>
            </View>
            <View style={s.topRight}>
              <TouchableOpacity style={s.iconBtn}
                onPress={() => {
                  setSearchOpen(v => !v);
                  if (searchOpen) setSearchQuery('');
                }} activeOpacity={0.75}>
                <Ionicons name={searchOpen ? 'close' : 'search-outline'} size={16} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
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

          {/* ── Search — live filter over services / manage shortcuts /
              quick actions / open inquiries already loaded on this screen.
              Toggled open/closed via the search icon next to the bell. */}
          {searchOpen && (
            <View style={s.heroSearchBar}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={s.heroSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search services, manage, inquiries..."
                placeholderTextColor="rgba(255,255,255,0.55)"
                returnKeyType="search"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* ── Search results dropdown — anchored right under the fixed
          header's search field, above the scrolling content. ── */}
      {searchQuery.length > 0 && (
        <View style={s.searchResults}>
          {searchResults.length === 0 ? (
            <Text style={s.searchEmptyTxt}>No matches for "{searchQuery}"</Text>
          ) : searchResults.map((r, i) => (
            <TouchableOpacity key={r.key} activeOpacity={0.75}
              style={[s.searchRow, i < searchResults.length - 1 && s.searchRowDivider]}
              onPress={() => { setSearchQuery(''); r.onPress(); }}>
              <View style={[s.searchRowIcon, { backgroundColor: r.color + '14' }]}>
                <Ico lib={r.lib} name={r.icon} size={16} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.searchRowLabel} numberOfLines={1}>{r.label}</Text>
                {!!r.sub && <Text style={s.searchRowSub} numberOfLines={1}>{r.sub}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[C.g500]} tintColor={C.g400} progressBackgroundColor="#fff" />
        }
      >
        {/* ══════════════════════════════════════════
            PANEL — no longer part of the header gradient; blends into the
            body. Earnings/progress render as their own light cards below.
            Only rendered when one of them actually has something to show.
        ══════════════════════════════════════════ */}
        {((isApproved && showEarnings) || !isApproved) && (
        <View style={s.heroRevPanel}>

          {/* Earnings (approved, ₹5K+ this month) */}
          {isApproved && showEarnings && (
            <TouchableOpacity onPress={() => navigation.navigate('EarningsScreen')}
              activeOpacity={0.88} style={s.earningsCardWrap}>
              <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.earningsCard}>
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
                        <Text style={[s.miniVal, m.accent && { color: C.g400, fontSize: 14 }]}>{m.v}</Text>
                        <Text style={s.miniLbl}>{m.l}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </LinearGradient>
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
        </View>
        )}

        {/* ══════════════════════════════════════════
            BODY
        ══════════════════════════════════════════ */}
        <View style={s.body}>

          {/* ── Business snapshot — real collected/pending/total ring ── */}
          {isApproved && (
            <View style={s.section}>
              <SectionHeading kicker="Today" title="Business snapshot" />
              <CollectionRingCard
                pct={collectionPct}
                collected={fmt(collectedRevenue)}
                total={fmt(totalRevenue)}
                pending={fmt(pendingRevenue)}
                delta={earnings ? `${positive ? '+' : '-'}${Math.abs(growth)}%` : null}
                positive={positive}
                ongoing={bookingsData?.active ?? 0}
                completed={bookingsData?.completed ?? 0}
                inquiries={inquiriesTotal}
                onPressRing={() => navigation.navigate('Financials')}
                onPressDelta={() => navigation.navigate('EarningsScreen')}
                onPressOngoing={() => navigation.navigate('AllBookings', { initialTab: 'ongoing' })}
                onPressCompleted={() => navigation.navigate('AllBookings', { initialTab: 'completed' })}
                onPressInquiries={() => navigation.navigate('AllInquiries')}
              />
            </View>
          )}

          {/* ── New Inquiries ───────────────────────────────────────
              Sits first so vendors see action items "at first sight".
              Live data: open quote-requests across the vendor's approved
              services, merged + newest-first (see api/inquiriesApi). */}
          {isApproved && inquiries.length > 0 && (
            <View style={s.section}>
              <SectionHeading kicker="Today" title="New Inquiries" right={(
                <View style={s.inqCountPill}>
                  <View style={s.inqLiveDot} />
                  <Text style={s.inqCountTxt}>{inquiriesTotal} new</Text>
                </View>
              )} />

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
                            <Text style={s.inqAvatarTxt}>{q.customer?.charAt(0) || '?'}</Text>
                          </View>
                          <Text style={s.inqCustomerTxt} numberOfLines={1}>{q.customer || 'Customer'}</Text>
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

          {/* ── Action center (priority, resolve-now items) ─────── */}
          {!isApproved && docsPending && (
            <View style={s.section}>
              <SectionHeading kicker="Priority" title="Action center" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
                <PriorityCard tone="gold" icon="document-text-outline" title="Upload documents"
                  desc="GST, PAN & more to complete verification"
                  onPress={() => navigation.navigate('VendorDocuments')} />
              </ScrollView>
            </View>
          )}

          {/* ── Pending setup ─────────────────────────── */}
          {!isApproved && (
            <View style={s.section}>
              <SectionHeading kicker="Get ready" title="Complete setup" />
              <View style={{ gap: 10, marginBottom: 12 }}>
                {pendingActions.map((a, i) => (
                  <TouchableOpacity key={i} style={s.setupRow}
                    onPress={() => navigation.navigate(a.route)} activeOpacity={0.85}>
                    <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.setupAccent} />
                    <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.setupIcon}>
                      <Ico lib={a.lib} name={a.icon} size={18} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.setupName} numberOfLines={1}>{a.name}</Text>
                      <Text style={s.setupDesc} numberOfLines={1}>
                        <Text style={s.setupStepInline}>Step {i + 1}</Text>{'  ·  ' + a.desc}
                      </Text>
                    </View>
                    <View style={s.setupStart}>
                      <Text style={s.setupStartTxt}>Start</Text>
                      <Ionicons name="arrow-forward" size={12} color={C.g700} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
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
                <SectionHeading kicker="Journey" title="Getting Started" />
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


          {/* ── Quick Actions (bento: big feature + side stack + row of 5) ── */}
          {/* Visible to pending vendors too — write actions inside each
              destination screen are gated by VerificationGate, so they
              can browse the app without being trapped on the onboarding
              card. */}
          <View style={s.section}>
            <SectionHeading kicker="Toolkit" title="Quick Actions" right={!isApproved ? <PreviewPill /> : null} />

            <View style={{ flexDirection: 'row', gap: BENTO_GAP }}>
              <BentoTile big w={BENTO_BIG_W} h={BENTO_BIG_H} grad={G.hero}
                icon={quickActions[0].icon} lib={quickActions[0].lib} label={quickActions[0].label}
                hint="Get started fast" onPress={() => navigation.navigate(quickActions[0].route)} />
              <View style={{ width: BENTO_SIDE_W, gap: BENTO_GAP }}>
                <BentoTile w={BENTO_SIDE_W} h={BENTO_ROW_H}
                  icon={quickActions[1].icon} lib={quickActions[1].lib} label={quickActions[1].label}
                  onPress={() => navigation.navigate(quickActions[1].route)} />
                <BentoTile w={BENTO_SIDE_W} h={BENTO_ROW_H} grad={[quickActions[2].color, shade(quickActions[2].color, -20)]}
                  icon={quickActions[2].icon} lib={quickActions[2].lib} label={quickActions[2].label}
                  onPress={() => navigation.navigate(quickActions[2].route)} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: BENTO_GAP, marginTop: BENTO_GAP }}>
              {quickActions.slice(3).map((qa, i) => (
                <BentoTile key={i} sm w={BENTO_5W} h={rs(92)}
                  grad={i % 2 === 0 ? [qa.color, shade(qa.color, -20)] : null}
                  icon={qa.icon} lib={qa.lib} label={qa.label}
                  onPress={() => navigation.navigate(qa.route)} />
              ))}
            </View>
          </View>

          {/* ── Your Services ─────────────────────────── */}
          {isApproved && myServices.length > 0 && (
            <View style={s.section}>
              <SectionHeading kicker="Operate" title="Your Services" right={(
                <View style={s.countPill}>
                  <Text style={s.countPillTxt}>{myServices.length} active</Text>
                </View>
              )} />
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

          {/* ── Community / Social ───────────────────── */}
          {/* Visible to pending vendors too — browsing the feed/messages
              is allowed; posting / sending is gated inside each screen. */}
          <View style={s.section}>
            <SectionHeading kicker="Community" title="Stay in the loop" right={!isApproved ? <PreviewPill /> : null} />
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
            <SheetHandle />
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
  hero:   { paddingHorizontal: 16, paddingBottom: 8, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, marginBottom: 8 },
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
  manageCard: { width: CARD_W, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
});

const CARD_W = (W - 32 - 10) / 2;   // 2-col grid with 10 gap

// Bento (Quick Actions) — big feature tile + 2-tile side stack (8 vendor
// quick actions total) + 5-across bottom row.
const BENTO_GAP  = 10;
const BENTO_FULLW = W - 32;
const BENTO_BIG_W  = Math.round(BENTO_FULLW * 0.62);
const BENTO_SIDE_W = BENTO_FULLW - BENTO_BIG_W - BENTO_GAP;
const BENTO_ROW_H  = rs(104);
const BENTO_BIG_H  = BENTO_ROW_H * 2 + BENTO_GAP;
const BENTO_5W     = Math.floor((BENTO_FULLW - BENTO_GAP * 4) / 5);

const s = StyleSheet.create({

  // ── Header (fixed top bar only — the panel below it is a plain,
  // non-gradient section that blends into the body) ────
  hero: { paddingHorizontal: 16, paddingBottom: 14, overflow: 'hidden' },
  heroTop: {
    paddingHorizontal: 16, paddingBottom: rs(12), overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  heroRevPanel: {
    backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: rs(14), paddingBottom: rs(2),
  },
  deco1: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar:   { flexDirection: 'row', alignItems: 'center', paddingTop: 12, marginBottom: 16 },
  topLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bizName:  { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginTop: 2 },

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

  // ── Earnings card — now its own dark accent card on the light body
  // (used to be translucent-on-gradient; the gradient panel is gone) ────
  earningsCardWrap: { borderRadius: rs(18), ...cardShadow },
  earningsCard: {
    borderRadius: rs(18), padding: 16, overflow: 'hidden',
  },
  earningsTop: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginBottom: 12,
  },
  earningsLbl: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 },
  earningsAmt: { fontFamily: DISPLAY, fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  growthPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  growthTxt:   { fontSize: 14, fontWeight: '800' },
  miniStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.13)', borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 10,
  },
  vLine:    { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 6 },
  miniCell: { flex: 1, alignItems: 'center' },
  miniVal:  { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  miniLbl:  { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  // ── Progress (pending) — now a light card on the body ──────
  progressBlock: {
    backgroundColor: C.card, borderRadius: rs(18), padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 2, ...cardShadow,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle:  { fontSize: 14, color: C.text, fontWeight: '700' },
  progressCount:  { fontSize: 13, color: C.muted, fontWeight: '600' },
  progressBarBg:  { height: 4, backgroundColor: C.bg, borderRadius: 2, marginBottom: 12 },
  progressBarFill:{ height: 4, backgroundColor: C.g500, borderRadius: 2 },
  stepRow:    { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.bg,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: C.g600, borderColor: C.g600 },
  stepDotActive: { backgroundColor: C.blue, borderColor: C.blue },
  stepNum:       { fontSize: 11, fontWeight: '800', color: C.muted },
  stepLine:      { flex: 1, height: 1.5, backgroundColor: C.border, maxWidth: 28 },
  stepCurrent:   { fontSize: 12, color: C.muted, fontWeight: '600', marginLeft: 10 },

  // ── Body ────────────────────────────────────────────────────
  body: { paddingHorizontal: 16, paddingTop: 18 },

  // ── Search — lives inside the header (glass field on the gradient,
  // same treatment as the search box on the Bookings screen's hero)
  // instead of floating as a separate card below it.
  heroSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: rs(12), paddingHorizontal: 14, height: 38,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', marginBottom: 10,
  },
  heroSearchInput: { flex: 1, fontSize: 13.5, color: '#fff', fontWeight: '600', padding: 0 },
  // Results dropdown — docked right under the fixed header's search field,
  // above the scrolling content (not inside s.body, so needs its own margins).
  searchResults: {
    backgroundColor: C.card, borderRadius: rs(15), marginHorizontal: 16, marginTop: 10,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...cardShadow,
  },
  searchEmptyTxt: { fontSize: 14, color: C.muted, textAlign: 'center', paddingVertical: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  searchRowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  searchRowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchRowLabel: { fontSize: 13.5, fontWeight: '700', color: C.text },
  searchRowSub: { fontSize: 12.5, color: C.muted, marginTop: 1 },

  // ── Section ─────────────────────────────────────────────────
  section:      { marginBottom: 22 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2, marginBottom: 10 },
  // SectionHeading — kicker (small caps label) + serif title, TA's convention.
  headingRow:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  headingKicker:  { fontSize: 12, fontWeight: '800', color: C.g600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  headingTitle:   { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  // ── Collection ring card (Business snapshot) ──────────────────
  crCard: {
    backgroundColor: C.card, borderRadius: rs(22), padding: rs(16),
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...cardShadow,
  },
  crTop: { flexDirection: 'row', alignItems: 'center' },
  crRingWrap: { width: 116, height: 116, alignItems: 'center', justifyContent: 'center' },
  crRingCenter: { position: 'absolute', alignItems: 'center' },
  crRingPct: { fontFamily: DISPLAY, fontSize: rf(26), fontWeight: '800', color: C.text },
  crRingPctLbl: { fontSize: 8, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  crKicker: { fontSize: 12, fontWeight: '800', color: C.muted, letterSpacing: 1, marginBottom: 4 },
  crDeltaPill: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginBottom: 4 },
  crDeltaTxt: { fontSize: 12, fontWeight: '800' },
  crAmt: { fontFamily: DISPLAY, fontSize: rf(24), fontWeight: '800', color: C.text },
  crSub: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  crLegend: { flexDirection: 'row', gap: 18, marginTop: 14 },
  crLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  crLegendLbl: { fontSize: 12.5, color: C.muted, fontWeight: '600' },
  crLegendVal: { fontSize: 12.5, color: C.text, fontWeight: '800' },
  crRule: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  crStrip: { flexDirection: 'row', alignItems: 'center' },
  crStripCell: { flex: 1, alignItems: 'center' },
  crStripVal: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: C.text },
  crStripLbl: { fontSize: 11.5, color: C.muted, fontWeight: '600', marginTop: 1 },
  crStripDiv: { width: 1, height: 24, backgroundColor: C.border },

  // ── Bento tiles (Quick Actions) ────────────────────────────────
  // flex-start (not space-between) so the label sits right under the icon
  // chip instead of being stretched toward the tile's bottom edge; overflow
  // hidden so long labels never visually spill past the rounded corners.
  // Icon chip pinned top, label(+hint) pinned bottom via space-between —
  // fills the tile height by design (travel-agent's own bento layout).
  bentoTile: { borderRadius: rs(22), padding: rs(12), justifyContent: 'space-between', overflow: 'hidden' },
  bentoTileSm: { alignItems: 'center', justifyContent: 'center', gap: rs(7), padding: rs(9) },
  bentoGlass: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  bentoChip: { width: rs(36), height: rs(36), borderRadius: rs(18), alignItems: 'center', justifyContent: 'center' },
  bentoChipBig: { width: rs(46), height: rs(46), borderRadius: rs(23) },
  bentoLabel: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '600' },
  bentoLabelSm: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: '600' },
  bentoLabelBig: { fontFamily: DISPLAY, fontSize: rf(21), fontWeight: '600', letterSpacing: -0.3 },
  bentoHint: { fontFamily: DISPLAY, fontSize: rf(11.5), marginTop: rs(2), fontWeight: '500' },

  // ── Priority cards (Action center) ─────────────────────────────
  priorityCard: {
    width: rs(200), backgroundColor: C.card, borderRadius: rs(18), padding: rs(14),
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...cardShadow,
  },
  priorityBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  priorityIcon: { width: rs(38), height: rs(38), borderRadius: rs(13), alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 10 },
  priorityTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 3 },
  priorityDesc: { fontSize: 12.5, color: C.muted, lineHeight: 14, marginBottom: 10 },
  priorityCta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  priorityCtaTxt: { fontSize: 13, fontWeight: '800', color: C.g700 },

  // ── Setup list rows (Pending setup, list not grid) ─────────────
  setupRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: rs(16), padding: rs(12), paddingLeft: rs(16),
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...rowShadow,
  },
  setupAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4 },
  setupIcon: { width: rs(40), height: rs(40), borderRadius: rs(13), alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  setupName: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2 },
  setupDesc: { fontSize: 12.5, color: C.muted },
  setupStepInline: { fontSize: 12.5, color: C.g700, fontWeight: '800' },
  setupStart: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginLeft: 8 },
  setupStartTxt: { fontSize: 13, fontWeight: '800', color: C.g700 },

  countPill:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  countPillTxt: { fontSize: 12, fontWeight: '700', color: C.g700 },
  // "Preview" badge — sits next to Quick Actions / Manage section titles
  // for pending vendors so they know they can look but not act.
  previewPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: C.amberL, borderWidth: 1, borderColor: '#FDE68A' },
  previewPillTxt: { fontSize: 12, fontWeight: '800', color: C.amber, letterSpacing: 0.3 },

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
  metricLbl:  { fontSize: 11,  fontWeight: '700', color: C.sub },
  metricUnit: { fontSize: 8.5,fontWeight: '500', color: C.muted },

  // ── New Inquiries (mockup) ────────────────────────────────────
  inqCountPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: C.redL, borderWidth: 1, borderColor: '#FECACA' },
  inqLiveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  inqCountTxt:  { fontSize: 12, fontWeight: '800', color: C.red },
  inqCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: 13,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  inqTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inqIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inqTitle:   { fontSize: 14, fontWeight: '800', color: C.text },
  inqSub:     { fontSize: 13, color: C.sub, marginTop: 2 },
  inqAgo:     { fontSize: 12, color: C.muted, fontWeight: '600' },
  inqUrgent:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.redL, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  inqUrgentTxt: { fontSize: 11, fontWeight: '800', color: C.red },
  inqBottom:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  inqCustomer:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  inqAvatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  inqAvatarTxt:   { fontSize: 13, fontWeight: '800', color: C.g700 },
  inqCustomerTxt: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1 },
  inqBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  inqBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  inqViewAll:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 11, borderRadius: 12, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  inqViewAllTxt: { fontSize: 14, fontWeight: '800', color: C.g700 },


  // ── Services ──────────────────────────────────────────────────
  svcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  svcCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: rs(18), padding: 13,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
    ...rowShadow,
  },
  svcIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  svcName:    { flex: 1, fontSize: 13.5, fontWeight: '700', color: C.text, marginLeft: 9, lineHeight: 15 },
  svcCountDot: {
    position: 'absolute', top: -5, right: -5,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: C.card,
  },
  svcCountDotTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // ── Manage — 2-column grid (NO single giant card) ─────────────
  manageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  manageCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: rs(18), padding: 14,
    overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    ...rowShadow,
  },
  manageTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  manageIconBox: { width: rs(38), height: rs(38), borderRadius: rs(13), alignItems: 'center', justifyContent: 'center' },
  managePill:    { minWidth: 30, height: rs(24), paddingHorizontal: rs(8), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  managePillTxt: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: '800' },
  manageChev:    { width: rs(24), height: rs(24), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  manageLabel:   { fontSize: 13.5, fontWeight: '800', color: C.text, marginBottom: 2 },
  manageSub:     { fontSize: 12, color: C.muted, lineHeight: 14 },

  // Still used by the (unchanged) Community grid's plain chevron-in-corner tiles.
  manageArrow:   { position: 'absolute', bottom: 12, right: 12 },

  // ── Pending setup ─────────────────────────────────────────────
  pendingGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  pendingCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: rs(18), padding: 14,
    borderWidth: 1, borderColor: C.border,
    ...rowShadow,
  },
  pendingIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  pendingName:    { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 3 },
  pendingDesc:    { fontSize: 12, color: C.muted },

  // ── Alert ─────────────────────────────────────────────────────
  alertRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12,
  },
  alertTxt: { fontSize: 14, fontWeight: '600' },

  // ── Getting started ───────────────────────────────────────────
  guideCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: 16,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  guideRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  guideNum:    { width: 26, height: 26, borderRadius: 13, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  guideNumTxt: { fontSize: 13, fontWeight: '800', color: C.sub },
  guideTitle:  { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  guideDesc:   { fontSize: 13, color: C.muted, lineHeight: 15 },
  guideLine:   { height: 1, backgroundColor: C.border, marginLeft: 38 },

  // ── Update modal ──────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    padding: 24, paddingBottom: 40, alignItems: 'center',
  },
  modalClose:    { position: 'absolute', top: 20, right: 20 },
  modalIconWrap: { marginBottom: 16 },
  modalIconGrad: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalTitle:    { fontFamily: DISPLAY, fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 },
  modalVersion:  { fontSize: 14, color: C.sub, marginBottom: 12 },
  modalMsg:      { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, paddingHorizontal: 36, borderRadius: 14,
  },
  modalBtnTxt:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalSkip:    { marginTop: 14 },
  modalSkipTxt: { fontSize: 14, color: C.muted, fontWeight: '600' },
});

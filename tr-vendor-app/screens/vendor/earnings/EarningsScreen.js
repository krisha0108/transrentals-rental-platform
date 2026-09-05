import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { apiGet, getVendorEarningsDebug, getVendorFinancials } from '../../api/client';
import { SC as T, G, rs, rf, shade, cardShadow, rowShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const { width: W } = Dimensions.get('window');

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
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
  blue:   T.blue,   blueL: T.blueLight,
  purple: T.purple, purpleL: T.purpleLight,
  amber:  T.amber,  amberL:  T.amberLight,
  red:    T.red,    redL:    T.redLight,
  orange: T.orange, orangeL: T.orangeL,
  cyan:   shade(T.ocean, 25), cyanL: T.tintOcean,
  pink:   T.rose,             pinkL: T.tintRose,
  indigo: T.indigo, indigoL: T.indigoLight,
};

const SERVICE_CONFIG = {
  bike:         { icon: 'bike',            color: C.blue,   label: 'Bike'       },
  'self-drive': { icon: 'car',             color: C.g600,   label: 'Self Drive' },
  'car-rental': { icon: 'car-side',        color: C.red,    label: 'Car Rental' },
  bus:          { icon: 'bus',             color: C.amber,  label: 'Bus'        },
  truck:        { icon: 'truck',           color: C.purple, label: 'Truck'      },
  packers:      { icon: 'package-variant', color: C.cyan,   label: 'Packers'   },
  equipment:    { icon: 'crane',           color: C.pink,   label: 'Equipment'  },
  luxury:       { icon: 'car-sports',      color: C.indigo, label: 'Luxury'    },
};

const BOOKING_DETAIL_SCREEN = {
  bike: 'BikeBookingDetail', 'self-drive': 'SelfDriveBookingDetail',
  'car-rental': 'CarRentalBookingDetail', bus: 'BusBookingDetail',
  truck: 'TruckBookingDetail', packers: 'PackersBookingDetail',
  equipment: 'EquipmentBookingDetail', luxury: 'LuxuryBookingDetail',
};

// ── Helpers ───────────────────────────────────────────────────
const fmt = v => `${Math.round(v || 0).toLocaleString('en-IN')}`;
const fmtShort = v => {
  if (!v || v === 0) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
};

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  const today = new Date();
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yest.toDateString())  return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getServiceConfig(service) {
  return SERVICE_CONFIG[service] || { icon: 'briefcase', color: C.muted, label: 'Service' };
}

// ── Skeleton bone ──────────────────────────────────────────────
const Bone = ({ w, h, r = 6, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

export default function EarningsScreen({ navigation, route }) {
  const { serviceType } = route?.params || {};
  const [loading, setLoading]             = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [selectedService, setSelectedService] = useState(
    serviceType && SERVICE_CONFIG[serviceType] ? serviceType : 'all'
  );
  const [earnings, setEarnings] = useState({
    total: 0, today: 0, thisMonth: 0, lastMonth: 0, growth: 0, pendingPayout: 0,
  });
  const [bookingsData, setBookingsData] = useState({ total: 0, completed: 0, active: 0, today: 0 });
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [bookingsList, setBookingsList]         = useState([]);
  const [financials, setFinancials]             = useState(null);

  const fetchEarnings = useCallback(async (showFilterLoader = false) => {
    try {
      if (showFilterLoader) setFilterLoading(true);
      try { await getVendorEarningsDebug(); } catch (_) {}
      const params   = selectedService !== 'all' ? `?service=${selectedService}` : '';
      const response = await apiGet(`/vendor/earnings${params}`);
      if (response.data?.success) {
        setEarnings(response.data.earnings || {});
        setBookingsData(response.data.bookings || {});
        setServiceBreakdown(response.data.serviceBreakdown || []);
        setBookingsList(response.data.bookingsList || []);
      }
      // Real collected/pending/total split for the Collection Progress card
      // — same endpoint the Dashboard's ring card already uses.
      try {
        const fin = await getVendorFinancials();
        if (fin?.success !== false) setFinancials(fin?.summary || fin || null);
      } catch (_) {}
    } catch (e) {
      console.log('[EarningsScreen]', e);
    } finally {
      setLoading(false); setRefreshing(false); setFilterLoading(false);
    }
  }, [selectedService]);

  useEffect(() => {
    if (loading) fetchEarnings(false);
    else         fetchEarnings(true);
    // Only re-run when the service filter changes — `loading` is read as a
    // one-time snapshot to pick the loader style, not a re-trigger, and
    // `fetchEarnings` already changes identity in lockstep with `selectedService`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService]);

  const onRefresh = () => { setRefreshing(true); fetchEarnings(false); };

  const handleCardPress = item => {
    const screen = BOOKING_DETAIL_SCREEN[item.service];
    if (screen) navigation.navigate(screen, { bookingId: item.id });
  };

  const positive = (earnings.growth ?? 0) >= 0;

  // Real collected/pending/total split (getVendorFinancials) for the
  // Collection Progress bar.
  const totalRevenue     = financials?.totalRevenue ?? 0;
  const collectedRevenue = financials?.totalCollected ?? 0;
  const pendingRevenue   = financials?.totalPending ?? 0;
  const collectionPct    = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;

  // Avg. booking value — both numbers already fetched, just a ratio.
  const avgBooking = bookingsData.total > 0 ? earnings.total / bookingsData.total : 0;

  // This-month vs last-month bars, scaled against whichever is larger.
  const trendMax = Math.max(earnings.thisMonth || 0, earnings.lastMonth || 0, 1);

  // ── Filter chip ───────────────────────────────────────────────
  const FilterChip = ({ service, label, icon, color, count, isAll }) => {
    const active = selectedService === service;
    return (
      <TouchableOpacity
        style={[s.chip, active && { backgroundColor: isAll ? C.g800 : color, borderColor: isAll ? C.g800 : color }]}
        onPress={() => setSelectedService(service)}
        activeOpacity={0.75}
      >
        {isAll
          ? <Ionicons name="grid-outline" size={14} color={active ? '#fff' : C.sub} />
          : <MaterialCommunityIcons name={icon} size={14} color={active ? '#fff' : color} />
        }
        <Text style={[s.chipTxt, active && { color: '#fff' }]}>{label}</Text>
        <View style={[s.chipCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={[s.chipCountTxt, active && { color: '#fff' }]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Booking card ──────────────────────────────────────────────
  // Flat rows inside one merged card — first/last row get the card's own
  // rounded corners + top/bottom border, middle rows share a bottom divider,
  // so the whole list reads as a single card instead of one box per booking.
  const renderBookingCard = ({ item, index }) => {
    const cfg         = getServiceConfig(item.service);
    const isCompleted = item.status === 'COMPLETED';
    const hasScreen   = !!BOOKING_DETAIL_SCREEN[item.service];
    const isFirst     = index === 0;
    const isLast      = index === bookingsList.length - 1;
    const meta = [item.customerName, item.location].filter(Boolean).join(' · ') || formatDate(item.date);

    return (
      <TouchableOpacity
        style={[s.flatRow, isFirst && s.flatRowFirst, isLast && s.flatRowLast, !isLast && s.flatRowDivider]}
        onPress={() => handleCardPress(item)} activeOpacity={hasScreen ? 0.75 : 1}>
        <View style={[s.flatRowIcon, { backgroundColor: cfg.color }]}>
          <MaterialCommunityIcons name={cfg.icon} size={15} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.flatRowNum} numberOfLines={1}>#{item.bookingNumber}</Text>
          <Text style={s.flatRowMeta} numberOfLines={1}>{meta}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.flatRowAmt}>₹{fmt(item.amount)}</Text>
          <View style={[s.flatRowPill, { backgroundColor: isCompleted ? C.g50 : C.amberL }]}>
            <Text style={[s.flatRowPillTxt, { color: isCompleted ? C.g700 : C.amber }]}>
              {isCompleted ? 'Done' : 'Active'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView>
            <View style={s.headerRow}>
              <View style={s.backCircleSk} />
              <Bone w={120} h={16} r={6} style={{ marginLeft: 12 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
          {/* This-month revenue card skeleton — matches the real gradient card */}
          <LinearGradient colors={G.hero} style={s.earningsCard}>
            <View style={{ gap: 8, marginBottom: 12 }}>
              <Bone w={90} h={10} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <Bone w={180} h={36} r={8} style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
            </View>
            <View style={s.heroStatsRow}>
              {[0,1,2,3].map(i => (
                <View key={i} style={s.heroStatSk}>
                  <Bone w={50} h={14} r={5} style={{ marginBottom: 5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <Bone w={36} h={10} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                </View>
              ))}
            </View>
          </LinearGradient>
          {/* Collection progress skeleton */}
          <View style={{ backgroundColor: C.card, borderRadius: rs(18), padding: rs(16), borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bone w={30} h={30} r={10} />
                <Bone w={120} h={12} r={4} />
              </View>
              <Bone w={44} h={22} r={12} />
            </View>
            <Bone w="100%" h={8} r={4} style={{ marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <Bone w={90} h={11} r={4} />
              <Bone w={90} h={11} r={4} />
            </View>
          </View>

          {/* This month vs last month skeleton */}
          <View style={{ backgroundColor: C.card, borderRadius: rs(18), padding: rs(16), borderWidth: 1, borderColor: C.border }}>
            <Bone w={160} h={12} r={4} style={{ marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {[0,1].map(i => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Bone w={40} h={11} r={4} style={{ marginBottom: 6 }} />
                  <Bone w="60%" h={60} r={8} />
                  <Bone w={60} h={9} r={4} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
          </View>

          {/* Bookings / Avg. booking summary skeleton */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[0,1].map(i => (
              <View key={i} style={{ flex: 1, backgroundColor: C.card, borderRadius: rs(14), padding: 12, borderWidth: 1, borderColor: C.border, gap: 8 }}>
                <Bone w={28} h={28} r={9} />
                <Bone w={50} h={16} r={4} />
                <Bone w={60} h={9} r={4} />
              </View>
            ))}
          </View>

          {/* Filter chips skeleton */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[80,70,90,70].map((w, i) => <Bone key={i} w={w} h={34} r={17} />)}
          </View>
          {/* Rows — flat list skeleton, same merged-card shape as the real list */}
          <View>
            {[0,1,2,3].map(i => (
              <View key={i} style={[s.flatRow, i === 0 && s.flatRowFirst, i === 3 && s.flatRowLast, i !== 3 && s.flatRowDivider]}>
                <Bone w={32} h={32} r={10} />
                <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
                  <Bone w={W * 0.28} h={11} r={4} />
                  <Bone w={W * 0.4} h={9} r={4} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Bone w={50} h={12} r={4} />
                  <Bone w={40} h={14} r={7} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── List header component (everything above the sticky filters) ───
  const ListHeaderTop = () => (
    <>
      {/* This month revenue — moved out of the header into the body */}
      <View style={s.earningsCardWrap}>
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.earningsCard}>
          <View style={s.earningsTop}>
            <View>
              <Text style={s.heroLbl}>THIS MONTH</Text>
              <Text style={s.heroAmt}>₹{fmt(earnings.thisMonth)}</Text>
            </View>
            {earnings.growth !== 0 && (
              <View style={s.growthRow}>
                <Ionicons
                  name={positive ? 'trending-up-outline' : 'trending-down-outline'}
                  size={14} color={positive ? C.g400 : '#FCA5A5'}
                />
                <Text style={[s.growthTxt, { color: positive ? C.g400 : '#FCA5A5' }]}>
                  {positive ? '+' : ''}{earnings.growth?.toFixed(1)}% vs last month
                </Text>
              </View>
            )}
          </View>

          {/* Hero stat strip */}
          <View style={s.heroStats}>
            {[
              { label: 'Today',    value: fmtShort(earnings.today)         },
              { label: 'Pending',  value: fmtShort(earnings.pendingPayout) },
              { label: 'Trips',    value: `${bookingsData.completed}`      },
              { label: 'Active',   value: `${bookingsData.active}`         },
            ].map((st, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={s.heroStatDiv} />}
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{st.value}</Text>
                  <Text style={s.heroStatLbl}>{st.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* Collection progress — real collected/pending/total split
          (getVendorFinancials) */}
      {totalRevenue > 0 && (
        <View style={s.collCard}>
          <View style={s.collTop}>
            <View style={s.collTitleRow}>
              <View style={s.collIconBox}>
                <Ionicons name="pie-chart-outline" size={16} color={C.g700} />
              </View>
              <Text style={s.collTitle}>Collection progress</Text>
            </View>
            <View style={s.collPctPill}>
              <Text style={s.collPctTxt}>{collectionPct}%</Text>
            </View>
          </View>
          <View style={s.collBarBg}>
            <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.collBarFill, { width: `${collectionPct}%` }]} />
          </View>
          <View style={s.collStatsRow}>
            <View style={s.collStatItem}>
              <View style={[s.collDot, { backgroundColor: C.g600 }]} />
              <Text style={s.collStatLbl}>Collected</Text>
              <Text style={s.collStatVal}>₹{fmt(collectedRevenue)}</Text>
            </View>
            <View style={s.collStatItem}>
              <View style={[s.collDot, { backgroundColor: T.gold }]} />
              <Text style={s.collStatLbl}>Pending</Text>
              <Text style={s.collStatVal}>₹{fmt(pendingRevenue)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* This month vs last month — 2 real data points, not a fabricated trend */}
      {(earnings.thisMonth > 0 || earnings.lastMonth > 0) && (
        <View style={s.trendCard}>
          <Text style={s.trendTitle}>This month vs last month</Text>
          <View style={s.trendBars}>
            <View style={s.trendBarCol}>
              <Text style={s.trendBarVal}>{fmtShort(earnings.lastMonth)}</Text>
              <View style={s.trendBarTrack}>
                <View style={[s.trendBarFill, { height: `${(earnings.lastMonth / trendMax) * 100}%`, backgroundColor: T.tintEmerald }]} />
              </View>
              <Text style={s.trendBarLbl}>Last month</Text>
            </View>
            <View style={s.trendBarCol}>
              <Text style={s.trendBarVal}>{fmtShort(earnings.thisMonth)}</Text>
              <View style={s.trendBarTrack}>
                <LinearGradient colors={G.emerald} style={[s.trendBarFill, { height: `${(earnings.thisMonth / trendMax) * 100}%` }]} />
              </View>
              <Text style={s.trendBarLbl}>This month</Text>
            </View>
          </View>
        </View>
      )}

      {/* Bookings + avg. booking value — both derived from already-fetched numbers */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderLeftColor: C.blue }]}>
          <View style={[s.summaryIconBox, { backgroundColor: C.blueL }]}>
            <Ionicons name="calendar-outline" size={15} color={C.blue} />
          </View>
          <Text style={s.summaryVal}>{bookingsData.total}</Text>
          <Text style={s.summaryLbl}>Bookings</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: C.purple }]}>
          <View style={[s.summaryIconBox, { backgroundColor: C.purpleL }]}>
            <Ionicons name="pricetag-outline" size={15} color={C.purple} />
          </View>
          <Text style={s.summaryVal}>₹{fmt(avgBooking)}</Text>
          <Text style={s.summaryLbl}>Avg. booking</Text>
        </View>
      </View>
    </>
  );

  // ── Filter chips — becomes sticky once it scrolls up to the header ──
  const showFilters = serviceBreakdown.length > 0 || (serviceType && SERVICE_CONFIG[serviceType]);
  const FiltersBar = () => (
    <View style={s.filtersWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
        <FilterChip service="all" label="All" isAll count={bookingsData.total} />
        {serviceBreakdown.map(item => {
          const cfg = getServiceConfig(item.service);
          return (
            <FilterChip key={item.service}
              service={item.service} label={cfg.label}
              icon={cfg.icon} color={cfg.color} count={item.bookings} />
          );
        })}
        {/* Show chip for the navigated-from service even if it has no earnings data */}
        {serviceType && SERVICE_CONFIG[serviceType] && !serviceBreakdown.find(sb => sb.service === serviceType) && (
          (() => {
            const cfg = getServiceConfig(serviceType);
            return (
              <FilterChip key={serviceType}
                service={serviceType} label={cfg.label}
                icon={cfg.icon} color={cfg.color} count={0} />
            );
          })()
        )}
      </ScrollView>
    </View>
  );

  // ── Section label ────────────────────────────────────────────────
  const SectionRow = () => (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>
        {selectedService === 'all' ? 'All Bookings' : `${getServiceConfig(selectedService).label} Bookings`}
      </Text>
      <View style={s.countBadge}>
        <Text style={s.countBadgeTxt}>{bookingsList.length}</Text>
      </View>
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────
  const EmptyState = () => (
    <View style={s.emptyWrap}>
      <LinearGradient colors={[C.g50, C.g100]} style={s.emptyCircle}>
        <Ionicons name="receipt-outline" size={40} color={C.g600} />
      </LinearGradient>
      <Text style={s.emptyTitle}>No bookings found</Text>
      <Text style={s.emptyBody}>
        {selectedService === 'all'
          ? "You don't have any bookings yet."
          : `No bookings found for ${getServiceConfig(selectedService).label}.`}
      </Text>
    </View>
  );

  // ── Combined list data — filters (index 0 of data, sticky) + section
  // label + booking rows (or the empty state), so the filter chips can
  // pin below the header once scrolled up to it. ──────────────────
  const listData = [];
  if (showFilters) listData.push({ __kind: 'filters' });
  listData.push({ __kind: 'sectionRow' });
  if (bookingsList.length === 0) listData.push({ __kind: 'empty' });
  else bookingsList.forEach((b, i) => listData.push({ ...b, __kind: 'booking', __idx: i }));

  const stickyIndices = showFilters ? [1] : []; // index 0 = ListHeaderComponent

  const renderRow = ({ item }) => {
    if (item.__kind === 'filters')    return <FiltersBar />;
    if (item.__kind === 'sectionRow') return <SectionRow />;
    if (item.__kind === 'empty')      return <EmptyState />;
    return renderBookingCard({ item, index: item.__idx });
  };

  const rowKeyExtractor = (item) => (item.__kind === 'booking' ? item.id : item.__kind);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ──────────────────────────────────────── */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView>
          {/* Top bar */}
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Earnings</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Bookings list ────────────────────────────────────── */}
      {filterLoading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
          <ListHeaderTop />
          {showFilters && <FiltersBar />}
          <SectionRow />
          <View>
            {[0,1,2,3].map(i => (
              <View key={i} style={[s.flatRow, i === 0 && s.flatRowFirst, i === 3 && s.flatRowLast, i !== 3 && s.flatRowDivider]}>
                <Bone w={32} h={32} r={10} />
                <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
                  <Bone w={W * 0.28} h={11} r={4} />
                  <Bone w={W * 0.4} h={9} r={4} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Bone w={50} h={12} r={4} />
                  <Bone w={40} h={14} r={7} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderRow}
          keyExtractor={rowKeyExtractor}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={stickyIndices}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.g500]} tintColor={C.g400} progressBackgroundColor="#fff" />
          }
          ListHeaderComponent={<ListHeaderTop />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Hero ──────────────────────────────────────────────────────
  hero: { paddingHorizontal: 16, paddingBottom: 12, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow:    { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  backCircleSk: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginLeft: 12 },

  heroLbl:  { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  heroAmt:  { fontFamily: DISPLAY, fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1.2, marginBottom: 6 },
  growthRow:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  growthTxt:{ fontSize: 13, fontWeight: '700' },

  /* This-month revenue card — moved out of the header into the body */
  earningsCardWrap: { marginHorizontal: 16, marginTop: 16, borderRadius: rs(18), ...cardShadow },
  earningsCard: { borderRadius: rs(18), padding: 16, overflow: 'hidden' },
  earningsTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },

  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  heroStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 6 },
  heroStat:    { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroStatLbl: { fontSize: 10,  fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  heroStatsRow:{ flexDirection: 'row', marginTop: 16, gap: 8 },
  heroStatSk:  { flex: 1, alignItems: 'center' },

  // ── Collection progress card ────────────────────────────────
  collCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(16),
    marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  collTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  collTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  collIconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  collTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  collPctPill: { backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  collPctTxt: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: '800', color: C.g700 },
  collBarBg: { height: 8, backgroundColor: C.g50, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  collBarFill: { height: 8, borderRadius: 4 },
  collStatsRow: { flexDirection: 'row', gap: 24 },
  collStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  collDot: { width: 7, height: 7, borderRadius: 3.5 },
  collStatLbl: { fontSize: 12, color: C.muted, fontWeight: '600' },
  collStatVal: { fontSize: 12, color: C.text, fontWeight: '800' },

  // ── Trend card (this month vs last month) ───────────────────
  trendCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(16),
    marginHorizontal: 16, marginTop: 12,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  trendTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 14 },
  trendBars: { flexDirection: 'row', gap: 24, height: 100, alignItems: 'flex-end' },
  trendBarCol: { flex: 1, alignItems: 'center' },
  trendBarVal: { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 6 },
  trendBarTrack: { width: '60%', height: 60, justifyContent: 'flex-end' },
  trendBarFill: { width: '100%', borderRadius: 8, minHeight: 4 },
  trendBarLbl: { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 6 },

  // ── Summary row ──────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: rs(14), padding: 12,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3,
    ...rowShadow,
  },
  summaryIconBox: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  summaryVal: { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: '800', color: C.text },
  summaryLbl: { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 2 },

  // ── Filter chips ─────────────────────────────────────────────
  filtersWrap:  { backgroundColor: C.bg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  filtersScroll:{ gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
  },
  chipTxt:      { fontSize: 13, fontWeight: '700', color: C.sub },
  chipCount:    { backgroundColor: C.border, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10, minWidth: 22, alignItems: 'center' },
  chipCountTxt: { fontSize: 11, fontWeight: '800', color: C.sub },

  // ── Section row ───────────────────────────────────────────────
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  countBadge:   { backgroundColor: C.g50, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: C.g100 },
  countBadgeTxt:{ fontSize: 12, fontWeight: '800', color: C.g700 },

  // ── List ─────────────────────────────────────────────────────
  listContent: { paddingBottom: 100 },

  // ── Booking rows — flat rows merged into one card ───────────────
  flatRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, marginHorizontal: 16,
    paddingVertical: 11, paddingHorizontal: 12,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border,
  },
  flatRowFirst: {
    borderTopWidth: 1, borderTopLeftRadius: rs(16), borderTopRightRadius: rs(16), marginTop: 4,
  },
  flatRowLast: {
    borderBottomWidth: 1, borderBottomLeftRadius: rs(16), borderBottomRightRadius: rs(16),
    ...rowShadow,
  },
  flatRowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  flatRowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flatRowNum:  { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  flatRowMeta: { fontSize: 11.5, color: C.muted, fontWeight: '500', marginTop: 2 },
  flatRowAmt:  { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '800', color: C.text },
  flatRowPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  flatRowPillTxt: { fontSize: 10, fontWeight: '700' },

  // ── Empty ─────────────────────────────────────────────────────
  emptyWrap:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyCircle:{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptyBody:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
});

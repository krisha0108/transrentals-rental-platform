import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, StatusBar, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { apiGet, getVendorEarningsDebug } from '../../api/client';

const { width: W } = Dimensions.get('window');

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
  blue:   '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  amber:  '#D97706', amberL:  '#FFFBEB',
  red:    '#DC2626', redL:    '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
  cyan:   '#0891B2', cyanL:   '#ECFEFF',
  pink:   '#DB2777', pinkL:   '#FDF2F8',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
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
    } catch (e) {
      console.log('[EarningsScreen]', e);
    } finally {
      setLoading(false); setRefreshing(false); setFilterLoading(false);
    }
  }, [selectedService]);

  useEffect(() => {
    if (loading) fetchEarnings(false);
    else         fetchEarnings(true);
  }, [selectedService]);

  const onRefresh = () => { setRefreshing(true); fetchEarnings(false); };

  const handleCardPress = item => {
    const screen = BOOKING_DETAIL_SCREEN[item.service];
    if (screen) navigation.navigate(screen, { bookingId: item.id });
  };

  const positive = (earnings.growth ?? 0) >= 0;

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
  const renderBookingCard = ({ item }) => {
    const cfg         = getServiceConfig(item.service);
    const isCompleted = item.status === 'COMPLETED';
    const hasScreen   = !!BOOKING_DETAIL_SCREEN[item.service];

    return (
      <TouchableOpacity style={s.bookCard} onPress={() => handleCardPress(item)}
        activeOpacity={hasScreen ? 0.75 : 1}>
        {/* Left accent */}
        <View style={[s.bookAccent, { backgroundColor: cfg.color }]} />

        <View style={{ flex: 1, paddingLeft: 14 }}>
          {/* Top row */}
          <View style={s.bookTop}>
            <View style={[s.bookIconBox, { backgroundColor: cfg.color + '14' }]}>
              <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.bookNum}>#{item.bookingNumber}</Text>
              <Text style={s.bookSvc}>{cfg.label}</Text>
            </View>
            {/* Status */}
            <View style={[s.statusPill,
              { backgroundColor: isCompleted ? C.g50 : C.amberL,
                borderColor: isCompleted ? C.g100 : '#FDE68A' }]}>
              <View style={[s.statusDot,
                { backgroundColor: isCompleted ? C.g600 : C.amber }]} />
              <Text style={[s.statusTxt,
                { color: isCompleted ? C.g700 : C.amber }]}>
                {isCompleted ? 'Done' : 'Active'}
              </Text>
            </View>
          </View>

          {/* Info row */}
          <View style={s.bookInfo}>
            {item.customerName ? (
              <View style={s.bookInfoItem}>
                <Ionicons name="person-outline" size={12} color={C.muted} />
                <Text style={s.bookInfoTxt} numberOfLines={1}>{item.customerName}</Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={s.bookInfoItem}>
                <Ionicons name="location-outline" size={12} color={C.muted} />
                <Text style={s.bookInfoTxt} numberOfLines={1}>{item.location}</Text>
              </View>
            ) : null}
            <View style={s.bookInfoItem}>
              <Ionicons name="calendar-outline" size={12} color={C.muted} />
              <Text style={s.bookInfoTxt}>{formatDate(item.date)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={s.bookFooter}>
            <View>
              <Text style={s.bookAmtLbl}>AMOUNT</Text>
              <Text style={[s.bookAmt, { color: cfg.color }]}>₹{fmt(item.amount)}</Text>
            </View>
            {hasScreen && (
              <TouchableOpacity
                style={[s.bookDetailBtn, { backgroundColor: cfg.color + '12', borderColor: cfg.color + '30' }]}
                onPress={() => handleCardPress(item)} activeOpacity={0.75}>
                <Text style={[s.bookDetailTxt, { color: cfg.color }]}>Details</Text>
                <Ionicons name="chevron-forward" size={13} color={cfg.color} />
              </TouchableOpacity>
            )}
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
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.hero}>
          <View style={s.deco1} />
          <SafeAreaView>
            <View style={s.headerRow}>
              <View style={s.backCircleSk} />
              <Bone w={120} h={16} r={6} style={{ marginLeft: 12 }} />
            </View>
            <View style={{ marginTop: 16, gap: 8 }}>
              <Bone w={90} h={10} r={4} />
              <Bone w={180} h={36} r={8} />
              <Bone w={100} h={10} r={4} />
            </View>
            <View style={s.heroStatsRow}>
              {[0,1,2,3].map(i => (
                <View key={i} style={s.heroStatSk}>
                  <Bone w={50} h={14} r={5} style={{ marginBottom: 5 }} />
                  <Bone w={36} h={10} r={4} />
                </View>
              ))}
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
          {/* Filter chips skeleton */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[80,70,90,70].map((w, i) => <Bone key={i} w={w} h={34} r={17} />)}
          </View>
          {/* Cards */}
          {[0,1,2,3].map(i => (
            <View key={i} style={[s.bookCard, { paddingLeft: 18 }]}>
              <View style={[s.bookAccent, { backgroundColor: C.border }]} />
              <View style={{ flex: 1, paddingLeft: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Bone w={38} h={38} r={10} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Bone w={W * 0.3} h={12} r={5} />
                    <Bone w={W * 0.2} h={9} r={4} />
                  </View>
                  <Bone w={56} h={22} r={11} />
                </View>
                <Bone w={W * 0.6} h={9} r={4} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Bone w={70} h={18} r={5} />
                  <Bone w={72} h={30} r={10} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── List header component ─────────────────────────────────────
  const ListHeader = () => (
    <>
      {/* Filter chips */}
      {(serviceBreakdown.length > 0 || (serviceType && SERVICE_CONFIG[serviceType])) && (
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
            {serviceType && SERVICE_CONFIG[serviceType] && !serviceBreakdown.find(s => s.service === serviceType) && (
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
      )}

      {/* Section label */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>
          {selectedService === 'all' ? 'All Bookings' : `${getServiceConfig(selectedService).label} Bookings`}
        </Text>
        <View style={s.countBadge}>
          <Text style={s.countBadgeTxt}>{bookingsList.length}</Text>
        </View>
      </View>
    </>
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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ──────────────────────────────────────── */}
      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.deco1} />
        <View style={s.deco2} />
        <SafeAreaView>
          {/* Top bar */}
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Earnings</Text>
          </View>

          {/* Big earnings amount */}
          <View style={s.heroBody}>
            <Text style={s.heroLbl}>THIS MONTH</Text>
            <Text style={s.heroAmt}>₹{fmt(earnings.thisMonth)}</Text>
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
        </SafeAreaView>
      </LinearGradient>

      {/* ── Bookings list ────────────────────────────────────── */}
      {filterLoading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
          <ListHeader />
          {[0,1,2,3].map(i => (
            <View key={i} style={[s.bookCard, { overflow: 'hidden' }]}>
              <View style={[s.bookAccent, { backgroundColor: C.border }]} />
              <View style={{ flex: 1, paddingLeft: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Bone w={38} h={38} r={10} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Bone w={W * 0.35} h={12} r={5} />
                    <Bone w={W * 0.22} h={9} r={4} />
                  </View>
                  <Bone w={54} h={22} r={11} />
                </View>
                <Bone w={W * 0.55} h={9} r={4} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Bone w={64} h={18} r={5} />
                  <Bone w={70} h={30} r={10} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={bookingsList}
          renderItem={renderBookingCard}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.g500]} tintColor={C.g400} progressBackgroundColor="#fff" />
          }
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Hero ──────────────────────────────────────────────────────
  hero: { paddingHorizontal: 16, paddingBottom: 24, overflow: 'hidden' },
  deco1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(52,211,153,0.07)', top: -60, right: -40,
  },
  deco2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(16,185,129,0.05)', bottom: -20, left: W * 0.4,
  },
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginLeft: 12 },

  heroBody: { marginTop: 18, marginBottom: 16 },
  heroLbl:  { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  heroAmt:  { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 6 },
  growthRow:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  growthTxt:{ fontSize: 12, fontWeight: '700' },

  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  heroStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 6 },
  heroStat:    { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroStatLbl: { fontSize: 9,  fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  heroStatsRow:{ flexDirection: 'row', marginTop: 16, gap: 8 },
  heroStatSk:  { flex: 1, alignItems: 'center' },

  // ── Filter chips ─────────────────────────────────────────────
  filtersWrap:  { paddingVertical: 14 },
  filtersScroll:{ gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
  },
  chipTxt:      { fontSize: 12, fontWeight: '700', color: C.sub },
  chipCount:    { backgroundColor: C.border, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10, minWidth: 22, alignItems: 'center' },
  chipCountTxt: { fontSize: 10, fontWeight: '800', color: C.sub },

  // ── Section row ───────────────────────────────────────────────
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  countBadge:   { backgroundColor: C.g50, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: C.g100 },
  countBadgeTxt:{ fontSize: 11, fontWeight: '800', color: C.g700 },

  // ── List ─────────────────────────────────────────────────────
  listContent: { paddingBottom: 100 },

  // ── Booking card ──────────────────────────────────────────────
  bookCard: {
    flexDirection: 'row',
    backgroundColor: C.card, borderRadius: 14,
    marginHorizontal: 16, marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, paddingRight: 14,
  },
  bookAccent: { width: 4, borderRadius: 2, marginLeft: 0 },
  bookTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bookIconBox:{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookNum:    { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  bookSvc:    { fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  statusDot:  { width: 5, height: 5, borderRadius: 3 },
  statusTxt:  { fontSize: 10, fontWeight: '700' },
  bookInfo:   { gap: 6, marginBottom: 12 },
  bookInfoItem:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookInfoTxt: { fontSize: 12, color: C.sub, fontWeight: '500', flex: 1 },
  bookFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookAmtLbl: { fontSize: 8.5, color: C.muted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  bookAmt:    { fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  bookDetailBtn:{
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1,
  },
  bookDetailTxt:{ fontSize: 12, fontWeight: '700' },

  // ── Empty ─────────────────────────────────────────────────────
  emptyWrap:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyCircle:{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptyBody:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
});

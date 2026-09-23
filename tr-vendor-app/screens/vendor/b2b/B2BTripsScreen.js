import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getB2BTrips } from '../../api/client';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: T.oceanLight, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight, amberDark: shade(T.amber, -15),
  red: T.red, redBg: T.redLight, redDark: shade(T.red, -15),
  blue: T.blue, blueBg: T.blueLight,
  purple: T.purple, purpleBg: T.tintPlum,
  // No dedicated cyan token in the shared palette — oceanLight/tintOcean is the
  // closest hue family (cool teal-blue) and keeps the pre-existing near-duplicate
  // relationship with blue/blueBg (originally #06B6D4/#ECFEFF vs #3B82F6/#EFF6FF).
  cyan: T.oceanLight, cyanBg: T.tintOcean,
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: C.amber, bg: C.amberBg, textColor: '#92400E',
    dot: C.amber, accent: C.amber,
    icon: 'clock', actionLabel: 'Start Journey', actionColor: C.cyan, actionText: '#fff',
  },
  DRIVER_ARRIVED: {
    label: 'Driver Arrived',
    color: C.cyan, bg: C.cyanBg, textColor: '#155E75',
    dot: C.cyan, accent: C.cyan,
    icon: 'map-pin', actionLabel: 'Verify OTP', actionColor: C.blue, actionText: '#fff',
  },
  STARTED: {
    label: 'In Progress',
    color: C.blue, bg: C.blueBg, textColor: '#1E40AF',
    dot: C.blue, accent: C.blue,
    icon: 'play-circle', actionLabel: 'End Trip', actionColor: C.purple, actionText: '#fff',
  },
  COMPLETED: {
    label: 'Completed',
    color: C.g500, bg: C.g100, textColor: '#065F46',
    dot: C.g500, accent: C.g500,
    icon: 'check-circle', actionLabel: null,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: C.red, bg: C.redBg, textColor: '#7F1D1D',
    dot: C.red, accent: C.red,
    icon: 'x-circle', actionLabel: null,
  },
};

const ACTIVE_STATUSES = ['PENDING', 'DRIVER_ARRIVED', 'STARTED'];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const SERVICE_FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'car-rental',  label: 'Car' },
  { key: 'self-drive',  label: 'Self Drive' },
  { key: 'bus',         label: 'Bus' },
  { key: 'luxury',      label: 'Luxury' },
  { key: 'bike',        label: 'Bike' },
];

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function normalizeServiceType(st) {
  const s = (st || '').toLowerCase().replace(/[\s_]/g, '-');
  if (s.includes('self')) return 'self-drive';
  if (s.includes('luxury')) return 'luxury';
  if (s.includes('bus')) return 'bus';
  if (s.includes('bike')) return 'bike';
  if (s.includes('car') || s.includes('rental') || s.includes('chauffeur')) return 'car-rental';
  return s;
}

export default function B2BTripsScreen({ navigation, route }) {
  const initService = normalizeServiceType(route?.params?.serviceFilter || '');
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState(
    SERVICE_FILTERS.some(f => f.key === initService) ? initService : 'all'
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(C.g950);
    }, [])
  );

  const fetchTrips = useCallback(async () => {
    try {
      const res = await getB2BTrips(null, { limit: 100 });
      const allTrips = res.trips || [];
      setTrips(allTrips);

      const active = allTrips.filter(t => ACTIVE_STATUSES.includes(t.status)).length;
      const pending = allTrips.filter(t => t.status === 'PENDING').length;
      const completed = allTrips.filter(t => t.status === 'COMPLETED').length;
      setStats({ active, pending, completed });
    } catch (e) {
      console.error('Failed to fetch B2B trips:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrips();
    }, [fetchTrips])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const filteredTrips = trips.filter(t => {
    // Status filter
    if (selectedFilter === 'active' && !ACTIVE_STATUSES.includes(t.status)) return false;
    if (selectedFilter === 'completed' && t.status !== 'COMPLETED') return false;
    // Service type filter
    if (serviceFilter !== 'all') {
      const tService = normalizeServiceType(t.booking?.serviceType || '');
      if (tService !== serviceFilter) return false;
    }
    return true;
  });

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  const renderTrip = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || {
      label: item.status, color: C.muted, bg: '#F1F5F9', textColor: C.sub,
      dot: C.muted, accent: C.muted, icon: 'help-circle', actionLabel: null,
    };
    const pickup = item.pickupLocation || item.booking?.pickupLocation || '';
    const drop = item.dropLocation || item.booking?.dropLocation || '';
    const isSelfDrive = (item.booking?.serviceType || '').toLowerCase().replace(/\s/g, '-') === 'self-drive';

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('B2BTripDetail', { tripCode: item.tripCode })}
      >
        {/* Left accent bar */}
        <View style={[s.cardAccent, { backgroundColor: sc.accent }]} />

        <View style={s.cardContent}>
          {/* Top row */}
          <View style={s.cardTop}>
            <Text style={s.tripCode}>{item.tripCode}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
                <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
                <Text style={[s.statusChipText, { color: sc.textColor }]}>{sc.label}</Text>
              </View>
            </View>
          </View>
          <Text style={s.tripDate}>{fmt(item.scheduledDate)}{item.scheduledTime ? ` · ${item.scheduledTime}` : ''}</Text>

          {/* Vehicle row */}
          {item.vehicleName && (
            <View style={s.infoRow}>
              <MCI name="truck-outline" size={15} color={C.muted} />
              <Text style={s.infoText} numberOfLines={1}>
                {item.vehicleName}{item.vehicleNumber ? ` · ${item.vehicleNumber}` : ''}
              </Text>
            </View>
          )}

          {/* Driver row */}
          {item.driverName && (
            <View style={s.infoRow}>
              <MCI name="account-outline" size={15} color={C.muted} />
              <Text style={s.infoText}>
                {item.driverName}{item.driverPhone ? ` · ${item.driverPhone}` : ''}
              </Text>
            </View>
          )}

          {/* Route row */}
          {(pickup || drop) && (
            <View style={s.routeRow}>
              <View style={[s.routeDot, { backgroundColor: C.g500 }]} />
              <View style={s.routeLine} />
              <MCI name="truck-outline" size={13} color={C.sub} />
              <View style={s.routeLine} />
              <View style={[s.routeDot, { backgroundColor: C.red }]} />
              <Text style={s.routeText} numberOfLines={1} flex={1}>
                {pickup || 'N/A'} → {drop || 'N/A'}
              </Text>
            </View>
          )}

          {/* Booking company row */}
          {item.booking && (
            <View style={s.bookingRow}>
              <View style={s.bookingInfo}>
                <MCI name="domain" size={13} color={C.muted} />
                <Text style={s.bookingText} numberOfLines={1}>
                  {item.booking.companyName || 'N/A'} · {item.booking.bookingNumber}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={C.g600} />
            </View>
          )}

          {/* Action button — only for self-drive (car rental driver manages via trip link) */}
          {sc.actionLabel && isSelfDrive && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: sc.actionColor }]}
              onPress={() => navigation.navigate('B2BTripDetail', { tripCode: item.tripCode })}
              activeOpacity={0.85}
            >
              <Text style={[s.actionBtnText, { color: sc.actionText }]}>{sc.actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const HeaderBlock = (
    <>
      {/* Gradient Header */}
      <LinearGradient colors={G.hero} style={s.header}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={s.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>B2B Trips</Text>
              <Text style={s.headerSub}>Manage your assigned corporate trips</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Stats strip — moved out of the header into the body */}
      <View style={s.statsStrip}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{loading ? '—' : stats.active}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{loading ? '—' : stats.pending}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{loading ? '—' : stats.completed}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Status filter tabs */}
      <View style={s.tabs}>
        {statusFilters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.tab, selectedFilter === f.key && s.tabActive]}
            onPress={() => setSelectedFilter(f.key)}
          >
            <Text style={[s.tabText, selectedFilter === f.key && s.tabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Service type filter row */}
      <View style={s.serviceBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.serviceBarContent}
        >
          {SERVICE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.serviceTab, serviceFilter === f.key && s.serviceTabActive]}
              onPress={() => setServiceFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[s.serviceTabText, serviceFilter === f.key && s.serviceTabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        {HeaderBlock}
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={s.card}>
              <View style={s.cardAccent} />
              <View style={s.cardContent}>
                <View style={s.cardTop}>
                  <Bone w={90} h={15} />
                  <Bone w={80} h={20} r={20} />
                </View>
                <Bone w={120} h={12} style={{ marginBottom: 10 }} />
                <View style={s.infoRow}>
                  <Bone w={15} h={15} r={4} />
                  <Bone w={150} h={13} />
                </View>
                <View style={[s.routeRow, { marginTop: 2 }]}>
                  <Bone w={8} h={8} r={4} />
                  <View style={{ flex: 1 }} />
                  <Bone w={8} h={8} r={4} />
                </View>
                <View style={s.bookingRow}>
                  <Bone w={140} h={12} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      {HeaderBlock}

      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => String(item.id || item.tripCode)}
        renderItem={renderTrip}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <MCI name="truck-outline" size={56} color={C.muted} />
              <Text style={s.emptyTitle}>No trips found</Text>
              <Text style={s.emptySub}>
                {selectedFilter === 'active'
                  ? 'No active trips at the moment'
                  : selectedFilter === 'completed'
                    ? 'No completed trips yet'
                    : 'Trips appear here once your quotes are confirmed'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View style={{ padding: 24 }}>
              <ActivityIndicator color={C.g600} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    paddingBottom: 8, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: C.surface,
    borderRadius: rs(14), paddingVertical: 12,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text, fontFamily: DISPLAY },
  statLabel: { fontSize: 12, color: C.muted, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  // Status filter tabs
  tabs: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg },
  tabActive: { backgroundColor: C.g700 },
  tabText: { fontSize: 14, fontWeight: '600', color: C.sub },
  tabTextActive: { color: '#fff' },

  // Service type filter
  serviceBar: {
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  serviceBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  serviceTab: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  serviceTabActive: { backgroundColor: C.blue + '15', borderColor: C.blue },
  serviceTabText: { fontSize: 12, fontWeight: '600', color: C.sub },
  serviceTabTextActive: { color: C.blue },

  // List
  list: { padding: 16, paddingBottom: 40 },

  // Trip card
  card: {
    backgroundColor: C.surface, borderRadius: rs(16), borderWidth: 1, borderColor: C.border,
    marginBottom: 12,
    ...cardShadow,
    flexDirection: 'row', overflow: 'hidden',
  },
  cardAccent: { width: 4, borderTopLeftRadius: rs(16), borderBottomLeftRadius: rs(16) },
  cardContent: { flex: 1, padding: 14 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  tripCode: { fontSize: 15, fontWeight: '800', color: C.text, fontFamily: DISPLAY },
  tripDate: { fontSize: 13, color: C.muted, marginBottom: 10 },

  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusChipText: { fontSize: 12, fontWeight: '700' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: C.sub, flex: 1 },

  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8,
    gap: 5, marginBottom: 8,
  },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { flex: 1, height: 1, backgroundColor: C.border },
  routeText: { fontSize: 13, color: C.sub, flex: 3, marginLeft: 6 },

  bookingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4,
  },
  bookingInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  bookingText: { fontSize: 13, color: C.muted, flex: 1 },

  actionBtn: {
    marginTop: 10, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  emptySub: { fontSize: 14, color: C.sub, textAlign: 'center', paddingHorizontal: 32 },
});

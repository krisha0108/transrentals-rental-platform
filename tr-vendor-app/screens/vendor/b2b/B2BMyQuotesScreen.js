import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getB2BMyQuotes } from '../../api/client';
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
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight,
  purple: T.purple, purpleBg: T.tintPlum,
};

const STATUS_CONFIG = {
  SUBMITTED:    { label: 'Submitted',    bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  UNDER_REVIEW: { label: 'Under Review', bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  CONFIRMED:    { label: 'Confirmed',    bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  REJECTED:     { label: 'Rejected',     bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  WITHDRAWN:    { label: 'Withdrawn',    bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

const SERVICE_ICONS = {
  'CAR': 'car',
  'BUS': 'bus',
  'TRUCK': 'truck',
  'BIKE': 'motorbike',
  'EQUIPMENT': 'excavator',
  'PACKERS': 'package-variant-closed',
  'LUXURY': 'car-sports',
  'CHAUFFEUR': 'steering',
  'SELF_DRIVE': 'car-key',
};

const FILTERS = [
  { key: 'ALL',          label: 'All' },
  { key: 'SUBMITTED',    label: 'Submitted' },
  { key: 'CONFIRMED',    label: 'Confirmed' },
  { key: 'REJECTED',     label: 'Rejected' },
  { key: 'WITHDRAWN',    label: 'Withdrawn' },
];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const fmtPrice = (n) => (n || 0).toLocaleString('en-IN');

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function parseNotes(notes) {
  if (!notes) return null;
  try { return typeof notes === 'string' ? JSON.parse(notes) : notes; }
  catch { return null; }
}

export default function B2BMyQuotesScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [allQuotes, setAllQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(C.g950);
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor(C.bg);
      };
    }, [])
  );

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await getB2BMyQuotes(null, {});
      setAllQuotes(res.quotes || []);
    } catch (e) {
      console.error('Failed to fetch B2B quotes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  }, [fetchQuotes]);

  const getCount = (key) => {
    if (key === 'ALL') return allQuotes.length;
    return allQuotes.filter(q => q.status === key).length;
  };

  const filtered = activeFilter === 'ALL'
    ? allQuotes
    : allQuotes.filter(q => q.status === activeFilter);

  const renderQuote = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, bg: '#F1F5F9', text: C.sub, dot: C.muted };
    const booking = item.b2bBooking || item.booking || {};
    const perVehicle = item.totalPrice && (item.vehicleCount || 1)
      ? Math.round(item.totalPrice / (item.vehicleCount || 1))
      : 0;
    const serviceKey = (booking.serviceType || '').toUpperCase().replace(/\s/g, '_');
    const mciIcon = SERVICE_ICONS[serviceKey] || 'car';
    const bookingId = item.bookingId || booking.id;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('B2BBookingDetail', { bookingId })}
      >
        {/* Left accent bar */}
        <View style={[s.accentBar, { backgroundColor: sc.dot }]} />

        <View style={s.cardInner}>
          {/* Card Header Row */}
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderLeft}>
              <Text style={s.quoteNum}>#{item.quoteNumber || item.id?.slice(0, 8)}</Text>
              {/* Status chip */}
              <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
                <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
                <Text style={[s.statusChipText, { color: sc.text }]}>{sc.label}</Text>
              </View>
            </View>
          </View>

          {/* Booking ID only — customer details hidden from vendor */}
          {booking.bookingNumber ? (
            <View style={s.companyRow}>
              <Text style={s.bookingNumSmall}>Booking #{booking.bookingNumber}</Text>
            </View>
          ) : null}

          {/* Service type badge */}
          {booking.serviceType ? (
            <View style={s.serviceRow}>
              <View style={s.serviceBadge}>
                <MCI name={mciIcon} size={12} color={C.g700} />
                <Text style={s.serviceBadgeText}>{booking.serviceType}</Text>
              </View>
            </View>
          ) : null}

          {/* Route Row */}
          {(booking.fromCity || booking.pickupLocation || booking.toCity || booking.dropLocation) ? (
            <View style={s.routeRow}>
              <View style={s.routeDotGreen} />
              <Text style={s.routeCityText} numberOfLines={1}>
                {booking.fromCity || booking.pickupLocation || '—'}
              </Text>
              <View style={s.routeDash} />
              <Icon name="arrow-right" size={12} color={C.muted} />
              <View style={s.routeDash} />
              <View style={s.routeDotRed} />
              <Text style={s.routeCityText} numberOfLines={1}>
                {booking.toCity || booking.dropLocation || booking.fromCity || booking.pickupLocation || '—'}
              </Text>
            </View>
          ) : null}

          {/* Pricing Row */}
          <View style={s.pricingRow}>
            <View>
              <Text style={s.pricingLabel}>Total Quote</Text>
              <Text style={s.pricingTotal}>₹{fmtPrice(item.totalPrice)}</Text>
            </View>
            {perVehicle > 0 ? (
              <View style={s.pricingRight}>
                <Text style={s.pricingLabel}>Per Vehicle</Text>
                <Text style={s.pricingPerVeh}>₹{fmtPrice(perVehicle)}</Text>
              </View>
            ) : null}
          </View>

          {/* Info Row: date, vehicle count, trip type */}
          <View style={s.infoRow}>
            {booking.scheduledDate ? (
              <View style={s.infoChip}>
                <Icon name="calendar" size={11} color={C.sub} />
                <Text style={s.infoChipText}>{fmt(booking.scheduledDate)}</Text>
              </View>
            ) : null}
            {(item.vehicleCount || item.quoteVehicles?.length) ? (
              <View style={s.infoChip}>
                <MCI name="car-multiple" size={11} color={C.sub} />
                <Text style={s.infoChipText}>{item.vehicleCount || item.quoteVehicles?.length} vehicles</Text>
              </View>
            ) : null}
            {booking.tripType ? (
              <View style={s.infoChip}>
                <Icon name="navigation" size={11} color={C.sub} />
                <Text style={s.infoChipText}>{booking.tripType}</Text>
              </View>
            ) : null}
          </View>

          {/* View full details link */}
          <View style={s.viewDetailsRow}>
            <Text style={s.viewDetailsText}>View Booking & Quote Details</Text>
            <Icon name="arrow-right" size={13} color={C.g700} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      {/* Gradient Header */}
      <LinearGradient colors={G.hero} style={s.header}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>My B2B Quotes</Text>
            <Text style={s.headerSub}>Track your submitted quotes</Text>
          </View>
          <View style={{ width: 36 }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsContentOuter} contentContainerStyle={s.tabsContent}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            const count = getCount(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text numberOfLines={1} style={[s.tabText, isActive && s.tabTextActive]}>{f.label}</Text>
                <View style={[s.tabBadge, isActive && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeText, isActive && s.tabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={s.list}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={s.card}>
              <View style={s.accentBar} />
              <View style={s.cardInner}>
                <View style={s.cardHeaderRow}>
                  <Bone w={70} h={13} />
                  <Bone w={90} h={20} r={20} />
                </View>
                <Bone w={140} h={11} style={{ marginTop: 8 }} />
                <Bone w={110} h={20} r={20} style={{ marginTop: 8 }} />
                <View style={[s.routeRowSkeleton, { marginTop: 10 }]}>
                  <Bone w={70} h={12} />
                  <View style={{ flex: 1 }} />
                  <Bone w={70} h={12} />
                </View>
                <View style={s.pricingRow}>
                  <View>
                    <Bone w={70} h={10} style={{ marginBottom: 4 }} />
                    <Bone w={90} h={20} />
                  </View>
                </View>
                <View style={s.infoRow}>
                  <Bone w={80} h={22} r={8} />
                  <Bone w={90} h={22} r={8} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderQuote}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} colors={[C.g600]} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <MCI name="file-document-outline" size={56} color={C.muted} />
              <Text style={s.emptyTitle}>No quotes yet</Text>
              <Text style={s.emptySub}>
                {activeFilter === 'ALL'
                  ? 'Submit quotes on open bookings to see them here'
                  : `No ${activeFilter.toLowerCase()} quotes found`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', fontFamily: DISPLAY },
  headerSub: { fontSize: 13, color: C.g300, marginTop: 2 },

  // Filter Tabs
  tabsWrap: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabsContentOuter: { flexGrow: 0, flexShrink: 0, height: 62 },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: C.bg, gap: 6,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: C.g700, backgroundColor: C.g50 },
  tabText: { fontSize: 14, fontWeight: '600', color: C.sub },
  tabTextActive: { color: C.g700 },
  tabBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.border,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: C.g100 },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: C.sub },
  tabBadgeTextActive: { color: C.g800 },

  // List
  list: { padding: 16, paddingBottom: 48 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: rs(16), marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
    flexDirection: 'row', overflow: 'hidden',
  },
  accentBar: { width: 4, borderTopLeftRadius: rs(16), borderBottomLeftRadius: rs(16) },
  cardInner: { flex: 1, padding: 14 },

  // Card Header
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  quoteNum: { fontSize: 14, fontWeight: '800', color: C.g800, fontVariant: ['tabular-nums'], fontFamily: DISPLAY },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 12, fontWeight: '700' },

  // Company
  companyRow: { marginTop: 8 },
  companyName: { fontSize: 15, fontWeight: '700', color: C.text },
  bookingNumSmall: { fontSize: 12, color: C.muted, marginTop: 2 },

  // Service Badge
  serviceRow: { marginTop: 8 },
  serviceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  serviceBadgeText: { fontSize: 12, fontWeight: '600', color: C.g700 },

  // Route Row
  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginTop: 10,
  },
  routeRowSkeleton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 2 },
  routeDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500, flexShrink: 0 },
  routeDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, flexShrink: 0 },
  routeDash: { flex: 1, height: 1, backgroundColor: C.border },
  routeCityText: { fontSize: 13, fontWeight: '600', color: C.text, flexShrink: 1, maxWidth: '35%' },

  // Pricing
  pricingRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  pricingLabel: { fontSize: 12, color: C.muted, marginBottom: 2 },
  pricingTotal: { fontSize: 20, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  pricingRight: { alignItems: 'flex-end' },
  pricingPerVeh: { fontSize: 14, fontWeight: '600', color: C.sub },

  // Info Row
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  infoChipText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // View Details
  viewDetailsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  viewDetailsText: { fontSize: 13, fontWeight: '600', color: C.g700, flex: 1 },

  // Expanded Section
  expandedSection: { marginTop: 10 },
  expandDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  expandRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  expandLabel: { fontSize: 13, color: C.muted, width: 120 },
  expandVal: { fontSize: 14, color: C.text, fontWeight: '500' },
  pillSection: { marginTop: 8 },
  pillSectionLabel: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  greenPill: { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  greenPillText: { fontSize: 12, color: C.g700, fontWeight: '600' },
  redPill: { backgroundColor: C.redBg, borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  redPillText: { fontSize: 12, color: C.red, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 16, fontFamily: DISPLAY },
  emptySub: { fontSize: 14, color: C.sub, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getEarnings, getBookingById } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#043927', mid: '#065F46', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6', purple: '#8B5CF6',
};

const PERIODS = [
  { key: 'today', label: 'Today'    },
  { key: 'week',  label: 'Week'     },
  { key: 'month', label: 'Month'    },
  { key: 'all',   label: 'All Time' },
];

// ─── Animated Bar ─────────────────────────────────────────────────────────────
const BAR_H = 80;

function AnimatedBar({ value, max, isToday, index, label }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = max > 0 ? Math.max(0.035, value / max) : 0.035;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: pct * BAR_H,
      delay: index * 55,
      useNativeDriver: false,
      tension: 80,
      friction: 9,
    }).start();
  }, [value, max]);

  const barColor  = isToday ? C.primary : '#86EFAC';
  const textColor = isToday ? C.primary : C.sub;

  return (
    <View style={barStyles.col}>
      {value > 0 && (
        <Text style={[barStyles.val, { color: textColor }]}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </Text>
      )}
      <View style={barStyles.track}>
        <Animated.View
          style={[
            barStyles.fill,
            {
              height: anim,
              backgroundColor: barColor,
              shadowColor: isToday ? C.primary : 'transparent',
              shadowOpacity: 0.5,
              shadowRadius: 4,
              elevation: isToday ? 3 : 0,
            },
          ]}
        />
      </View>
      {isToday && <View style={barStyles.todayDot} />}
      <Text style={[barStyles.dayLabel, isToday && { color: C.primary, fontWeight: '800' }]}>
        {label}
      </Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  col:       { flex: 1, alignItems: 'center', gap: 4 },
  val:       { fontSize: 9, fontWeight: '700', height: 12 },
  track:     { width: 12, height: BAR_H, backgroundColor: '#E2EAF4', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  fill:      { borderRadius: 6 },
  todayDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary },
  dayLabel:  { fontSize: 10, color: C.sub, fontWeight: '600' },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, value, label, valueColor }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.statNum, { color: valueColor || C.text }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Trip Row ─────────────────────────────────────────────────────────────────
function TripRow({ trip, onPress }) {
  const hasEarning  = !trip.isVendorAssigned && trip.earnings > 0;
  const accentColor = hasEarning ? C.primary : C.blue;

  return (
    <TouchableOpacity style={styles.tripRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.tripAccent, { backgroundColor: accentColor }]} />

      <View style={{ flex: 1, paddingHorizontal: 13, paddingVertical: 13 }}>

        {/* Row 1: route + earning */}
        <View style={styles.tripTopRow}>
          <View style={[styles.tripIconBox, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name="car" size={14} color={accentColor} />
          </View>
          <Text style={styles.tripRoute} numberOfLines={1}>
            {trip.pickupCity || '—'}{trip.dropCity ? ` → ${trip.dropCity}` : ''}
          </Text>
          {hasEarning ? (
            <Text style={styles.tripEarning}>₹{trip.earnings.toLocaleString('en-IN')}</Text>
          ) : (
            <View style={styles.salaryBadge}>
              <Text style={styles.salaryBadgeText}>Salary</Text>
            </View>
          )}
        </View>

        {/* Row 2: booking ID + date */}
        <View style={styles.tripChipsRow}>
          {trip.bookingNumber && (
            <View style={styles.tripChip}>
              <Ionicons name="receipt-outline" size={9} color={C.sub} />
              <Text style={styles.tripChipText}>#{trip.bookingNumber}</Text>
            </View>
          )}
          <View style={styles.tripChip}>
            <Ionicons name="calendar-outline" size={9} color={C.sub} />
            <Text style={styles.tripChipText}>
              {moment(trip.completedAt || trip.pickupDate).format('DD MMM YYYY')}
            </Text>
          </View>
          {trip.carCategoryName && (
            <View style={styles.tripChip}>
              <Ionicons name="car-sport-outline" size={9} color={C.sub} />
              <Text style={styles.tripChipText}>{trip.carCategoryName}</Text>
            </View>
          )}
        </View>

        {/* Row 3: rating */}
        {trip.driverRating > 0 && (
          <View style={styles.tripRatingRow}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name={s <= trip.driverRating ? 'star' : 'star-outline'} size={10} color="#F59E0B" />
            ))}
            {trip.driverReview ? (
              <Text style={styles.tripReview} numberOfLines={1}>"{trip.driverReview}"</Text>
            ) : null}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={14} color={C.border} style={{ marginRight: 10 }} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EarningsScreen({ navigation }) {
  const [period, setPeriod]       = useState('month');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening]     = useState(null);

  async function openTrip(trip) {
    if (opening) return;
    setOpening(trip.id);
    try {
      const res = await getBookingById(trip.id, trip.source || 'chauffeur');
      if (res.data?.booking) {
        navigation.navigate('BookingDetail', { booking: res.data.booking });
      } else {
        Alert.alert('Not found', 'Could not load booking details.');
      }
    } catch {
      Alert.alert('Error', 'Failed to load booking details.');
    }
    setOpening(null);
  }

  const load = useCallback(async () => {
    try {
      const res = await getEarnings(period);
      setData(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [period]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  // Last 7 days bar data
  const last7 = (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = moment().subtract(6 - i, 'days');
      const total = (data?.history || [])
        .filter(t => !t.isVendorAssigned && moment(t.completedAt).isSame(d, 'day'))
        .reduce((s, t) => s + (t.earnings || 0), 0);
      return { label: d.format('dd')[0], total, isToday: d.isSame(moment(), 'day') };
    });
    return days;
  })();
  const barMax = Math.max(...last7.map(d => d.total), 1);

  const totalEarnings = data?.earnings?.total   || 0;
  const tripCount     = data?.earnings?.trips    || 0;
  const avgRating     = data?.earnings?.avgRating || 0;
  const avgPerTrip    = tripCount > 0 ? Math.round(totalEarnings / tripCount) : 0;
  const periodLabel   = PERIODS.find(p => p.key === period)?.label || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[C.dark, C.mid, C.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSub}>Track your</Text>
            <Text style={styles.headerTitle}>Earnings</Text>
          </View>
          <TouchableOpacity
            style={styles.histBtn}
            onPress={() => navigation.navigate('TripHistory')}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.histBtnText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Period tabs inside header */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => { setPeriod(p.key); setLoading(true); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <>
            {/* ── Hero Earnings Card ── */}
            <LinearGradient
              colors={['#022C22', '#064E3B', '#065F46']}
              style={styles.heroCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {/* Decorative circle */}
              <View style={styles.heroBubble} />

              <Text style={styles.heroLabel}>Your Earnings · {periodLabel}</Text>
              <Text style={styles.heroAmount}>
                ₹{totalEarnings.toLocaleString('en-IN')}
              </Text>

              {data?.history?.some(t => t.isVendorAssigned) && (
                <View style={styles.heroNote}>
                  <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.heroNoteText}>Vendor-assigned trips counted separately</Text>
                </View>
              )}

              <View style={styles.heroSep} />

              {/* Stats row */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNum}>{tripCount}</Text>
                  <Text style={styles.heroStatLabel}>Trips</Text>
                </View>
                <View style={styles.heroStatDiv} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNum}>
                    ₹{avgPerTrip.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.heroStatLabel}>Per Trip</Text>
                </View>
                {avgRating > 0 && (
                  <>
                    <View style={styles.heroStatDiv} />
                    <View style={styles.heroStat}>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={13} color="#FCD34D" />
                        <Text style={styles.heroStatNum}>{avgRating}</Text>
                      </View>
                      <Text style={styles.heroStatLabel}>Rating</Text>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>

            {/* ── 7-Day Bar Chart ── */}
            <View style={styles.chartCard}>
              <View style={styles.chartHead}>
                <View style={styles.chartTitleRow}>
                  <View style={styles.chartTitleDot} />
                  <Text style={styles.chartTitle}>Last 7 Days</Text>
                </View>
                <Text style={styles.chartTotal}>
                  ₹{last7.reduce((s, d) => s + d.total, 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.chartBars}>
                {last7.map((d, i) => (
                  <AnimatedBar
                    key={i}
                    value={d.total}
                    max={barMax}
                    isToday={d.isToday}
                    index={i}
                    label={d.label}
                  />
                ))}
              </View>
            </View>

            {/* ── Stats Grid ── */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="car"
                iconBg="#EFF6FF"
                iconColor={C.blue}
                value={data?.stats?.totalTrips || 0}
                label="Total Trips"
                valueColor={C.blue}
              />
              <StatCard
                icon="checkmark-circle"
                iconBg="#F0FDF4"
                iconColor={C.success}
                value={data?.stats?.completedTrips || 0}
                label="Completed"
                valueColor={C.success}
              />
              <StatCard
                icon="navigate"
                iconBg="#FFFBEB"
                iconColor={C.warn}
                value={data?.stats?.activeTrips || 0}
                label="Active"
                valueColor={C.warn}
              />
              <StatCard
                icon="trending-up"
                iconBg="#F5F3FF"
                iconColor={C.purple}
                value={`₹${avgPerTrip.toLocaleString('en-IN')}`}
                label="Avg / Trip"
                valueColor={C.purple}
              />
            </View>

            {/* ── Recent Trips ── */}
            {data?.history?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Recent Trips</Text>
                  {data.history.length > 5 && (
                    <TouchableOpacity onPress={() => navigation.navigate('TripHistory')} activeOpacity={0.7}>
                      <Text style={styles.seeAll}>See all →</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.tripList}>
                  {data.history.slice(0, 5).map(trip => (
                    <TripRow key={trip.id} trip={trip} onPress={() => openTrip(trip)} />
                  ))}
                </View>
              </View>
            )}

            {/* ── Empty ── */}
            {!loading && tripCount === 0 && (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="wallet-outline" size={36} color={C.primary} />
                </View>
                <Text style={styles.emptyTitle}>No earnings yet</Text>
                <Text style={styles.emptySub}>Complete trips to see your earnings here</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  scroll:    { flex: 1 },
  loaderBox: { paddingVertical: 80, alignItems: 'center' },

  // Header
  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  headerTitle:{ fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 1 },
  histBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  histBtnText:{ fontSize: 12, color: '#fff', fontWeight: '700' },

  // Period tabs
  periodRow:       { flexDirection: 'row', gap: 7 },
  periodBtn:       { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  periodBtnActive: { backgroundColor: '#fff' },
  periodText:      { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  periodTextActive:{ color: C.dark },

  // Hero card
  heroCard:   { marginHorizontal: 14, marginTop: 14, borderRadius: 24, padding: 24, overflow: 'hidden' },
  heroBubble: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40 },
  heroLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 6 },
  heroAmount: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 4 },
  heroNote:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  heroNoteText: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  heroSep:    { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 16 },
  heroStats:  { flexDirection: 'row', alignItems: 'center' },
  heroStat:   { flex: 1, alignItems: 'center' },
  heroStatNum:{ fontSize: 20, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroStatDiv:{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },

  // Chart
  chartCard:    { marginHorizontal: 14, marginTop: 12, backgroundColor: C.card, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  chartHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 7 },
  chartTitleDot:{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  chartTitle:   { fontSize: 13, fontWeight: '800', color: C.text },
  chartTotal:   { fontSize: 14, fontWeight: '800', color: C.primary },
  chartBars:    { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },

  // Stats grid
  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14, marginTop: 12 },
  statCard:   { width: '47%', backgroundColor: C.card, borderRadius: 18, padding: 16, alignItems: 'flex-start', gap: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIcon:   { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statNum:    { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:  { fontSize: 11, color: C.sub, fontWeight: '600' },

  // Recent trips
  section:     { paddingHorizontal: 14, marginTop: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:{ fontSize: 15, fontWeight: '800', color: C.text },
  seeAll:      { fontSize: 12, color: C.primary, fontWeight: '700' },
  tripList:    { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },

  tripRow:      { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  tripAccent:   { width: 3, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  tripTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  tripIconBox:  { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  tripRoute:    { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  tripChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 5 },
  tripChip:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tripChipText: { fontSize: 10, color: C.sub, fontWeight: '500' },
  tripRatingRow:{ flexDirection: 'row', alignItems: 'center', gap: 2 },
  tripReview:   { flex: 1, fontSize: 10, color: C.sub, fontStyle: 'italic', marginLeft: 4 },
  tripEarning:  { fontSize: 14, fontWeight: '900', color: C.success, flexShrink: 0 },
  salaryBadge:  { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  salaryBadgeText: { fontSize: 10, fontWeight: '800', color: C.blue },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 40, paddingBottom: 20, gap: 10 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 13, color: C.sub, textAlign: 'center', maxWidth: 220 },
});

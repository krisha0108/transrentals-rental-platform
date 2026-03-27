import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, SectionList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getEarnings, getBookingById } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#043927', mid: '#065F46', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', blue: '#3B82F6',
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons key={s} name={s <= rating ? 'star' : 'star-outline'} size={11} color="#F59E0B" />
      ))}
    </View>
  );
}

// ─── Trip Card ────────────────────────────────────────────────────────────────
function TripCard({ trip, onPress }) {
  const hasEarning  = !trip.isVendorAssigned && trip.earnings > 0;
  const accentColor = hasEarning ? C.primary : C.blue;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.cardInner}>

        {/* Row 1: icon + route + amount */}
        <View style={styles.cardTop}>
          <View style={[styles.cardIcon, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name="car" size={16} color={accentColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardRoute} numberOfLines={1}>
              {trip.pickupCity || '—'}{trip.dropCity ? ` → ${trip.dropCity}` : ''}
            </Text>
            <Text style={styles.cardNum}>{trip.bookingNumber}</Text>
          </View>
          {hasEarning ? (
            <Text style={styles.cardEarning}>₹{trip.earnings.toLocaleString('en-IN')}</Text>
          ) : (
            <View style={styles.salaryBadge}>
              <Ionicons name="business-outline" size={10} color={C.blue} />
              <Text style={styles.salaryText}>Salary</Text>
            </View>
          )}
        </View>

        {/* Row 2: chips */}
        <View style={styles.chipsRow}>
          {trip.completedAt && (
            <View style={styles.chip}>
              <Ionicons name="checkmark-circle-outline" size={10} color={C.success} />
              <Text style={[styles.chipText, { color: C.success }]}>
                {moment(trip.completedAt).format('DD MMM · h:mm a')}
              </Text>
            </View>
          )}
          {trip.carCategoryName && (
            <View style={styles.chip}>
              <Ionicons name="car-sport-outline" size={10} color={C.sub} />
              <Text style={styles.chipText}>{trip.carCategoryName}</Text>
            </View>
          )}
          {trip.serviceType && trip.serviceType !== 'Chauffeur' && (
            <View style={styles.chip}>
              <Ionicons name="briefcase-outline" size={10} color={C.sub} />
              <Text style={styles.chipText}>{trip.serviceType}</Text>
            </View>
          )}
        </View>

        {/* Row 3: rating + review */}
        {trip.driverRating > 0 && (
          <View style={styles.ratingRow}>
            <Stars rating={trip.driverRating} />
            {trip.driverReview ? (
              <Text style={styles.reviewText} numberOfLines={1}>"{trip.driverReview}"</Text>
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Month Section Header ─────────────────────────────────────────────────────
function MonthHeader({ title, count, total }) {
  return (
    <View style={styles.monthRow}>
      <View style={styles.monthLeft}>
        <Text style={styles.monthTitle}>{title}</Text>
        <View style={styles.monthPill}>
          <Text style={styles.monthPillText}>{count} trip{count !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      {total > 0 && <Text style={styles.monthTotal}>₹{total.toLocaleString('en-IN')}</Text>}
    </View>
  );
}

// ─── Group by month ───────────────────────────────────────────────────────────
function groupByMonth(trips) {
  const map = {};
  trips.forEach(t => {
    const key = moment(t.completedAt || t.pickupDate).format('MMMM YYYY');
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });
  return Object.entries(map).map(([title, items]) => ({
    title,
    data:  items,
    count: items.length,
    total: items.filter(t => !t.isVendorAssigned).reduce((s, t) => s + (t.earnings || 0), 0),
  }));
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TripHistoryScreen({ navigation }) {
  const [sections,      setSections]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [totalEarned,   setTotalEarned]   = useState(0);
  const [totalTrips,    setTotalTrips]    = useState(0);
  const [completedTrips,setCompletedTrips]= useState(0);
  const [bestMonth,     setBestMonth]     = useState(null);
  const [opening,       setOpening]       = useState(null); // bookingId currently loading

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
      const res     = await getEarnings('all');
      const history = res.data?.history || [];
      const grouped = groupByMonth(history);
      setSections(grouped);
      setTotalTrips(history.length);
      setCompletedTrips(history.filter(t => t.completedAt).length);

      const earned = history.filter(t => !t.isVendorAssigned).reduce((s, t) => s + (t.earnings || 0), 0);
      setTotalEarned(earned);

      // Best month
      const best = grouped.reduce((a, b) => (b.total > (a?.total ?? 0) ? b : a), null);
      if (best && best.total > 0) setBestMonth(best);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.dark, C.mid, C.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.bubble} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trip History</Text>
            {totalTrips > 0 && (
              <Text style={styles.headerSub}>
                {totalTrips} trips · ₹{totalEarned.toLocaleString('en-IN')} total earned
              </Text>
            )}
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{totalTrips}</Text>
          </View>
        </View>

        {/* Quick stats */}
        {totalTrips > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                ₹{totalTrips > 0 ? Math.round(totalEarned / totalTrips).toLocaleString('en-IN') : 0}
              </Text>
              <Text style={styles.statLabel}>Avg / Trip</Text>
            </View>
            {bestMonth && (
              <>
                <View style={styles.statSep} />
                <View style={styles.statBox}>
                  <Text style={styles.statNum} numberOfLines={1}>
                    ₹{bestMonth.total.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.statLabel}>Best Month</Text>
                </View>
              </>
            )}
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={36} color={C.primary} />
          </View>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Completed trips will appear here</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => openTrip(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <MonthHeader title={section.title} count={section.count} total={section.total} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:     { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 18, overflow: 'hidden' },
  bubble:     { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  countPill:  { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  countPillText:{ fontSize: 14, fontWeight: '800', color: '#fff' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 14 },
  statBox:  { flex: 1, alignItems: 'center' },
  statNum:  { fontSize: 16, fontWeight: '900', color: '#fff' },
  statLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statSep:  { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  list: { paddingHorizontal: 14, paddingBottom: 32, paddingTop: 4 },

  // Month header
  monthRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingTop: 18 },
  monthLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  monthPill:  { backgroundColor: C.primary + '18', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  monthPillText: { fontSize: 10, fontWeight: '800', color: C.primary },
  monthTotal: { fontSize: 14, fontWeight: '900', color: C.success },

  // Trip card
  card:       { flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, marginBottom: 9, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardAccent: { width: 4, flexShrink: 0 },
  cardInner:  { flex: 1, padding: 13 },

  cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon:   { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardRoute:  { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  cardNum:    { fontSize: 10, color: C.sub, fontWeight: '500' },
  cardEarning:{ fontSize: 16, fontWeight: '900', color: C.success },

  salaryBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  salaryText: { fontSize: 10, fontWeight: '800', color: C.blue },

  chipsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  chipText:   { fontSize: 10, color: C.sub, fontWeight: '500' },

  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewText: { flex: 1, fontSize: 11, color: C.sub, fontStyle: 'italic' },

  // Empty
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 13, color: C.sub },
});

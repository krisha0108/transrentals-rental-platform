import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAvailableBookings, acceptBooking } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6',
};

const TRIP_FILTERS = [
  { key: 'ALL',        label: 'All',        icon: 'apps-outline' },
  { key: 'LOCAL',      label: 'Local',      icon: 'navigate-circle-outline' },
  { key: 'OUTSTATION', label: 'Outstation', icon: 'arrow-forward-circle-outline' },
  { key: 'AIRPORT',    label: 'Airport',    icon: 'airplane-outline' },
  { key: 'ROUND_TRIP', label: 'Round Trip', icon: 'repeat-outline' },
];

const SORT_OPTIONS = [
  { key: 'date',     label: 'Soonest First',    icon: 'calendar-outline' },
  { key: 'earnings', label: 'Highest Earning',  icon: 'trending-up-outline' },
];

const DATE_PERIODS = [
  { key: 'TODAY',      label: 'Today',      icon: 'today-outline' },
  { key: 'YESTERDAY',  label: 'Yesterday',  icon: 'chevron-back-circle-outline' },
  { key: 'THIS_MONTH', label: 'This Month', icon: 'calendar-clear-outline' },
  { key: 'LAST_MONTH', label: 'Last Month', icon: 'calendar-outline' },
  { key: 'ALL',        label: 'All',        icon: 'albums-outline' },
];

function isInPeriod(dateStr, period) {
  if (!dateStr) return period === 'ALL';
  const d = moment(dateStr);
  const now = moment();
  if (period === 'TODAY')      return d.isSame(now, 'day');
  if (period === 'YESTERDAY')  return d.isSame(moment().subtract(1, 'day'), 'day');
  if (period === 'THIS_MONTH') return d.isSame(now, 'month');
  if (period === 'LAST_MONTH') return d.isSame(moment().subtract(1, 'month'), 'month');
  return true; // ALL
}

const TRIP_LABELS = {
  LOCAL: 'Local', OUTSTATION: 'Outstation',
  AIRPORT: 'Airport', ROUND_TRIP: 'Round Trip',
};

const TRIP_COLORS = {
  LOCAL:      { color: C.primary,  bg: '#F0FDF4' },
  OUTSTATION: { color: C.blue,     bg: '#EFF6FF' },
  AIRPORT:    { color: '#7C3AED',  bg: '#F5F3FF' },
  ROUND_TRIP: { color: '#EA580C',  bg: '#FFF7ED' },
};

// ── Pulsing NEW dot ───────────────────────────────────────────────────────────
function NewBadge() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.35, duration: 550, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 550, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.newBadge}>
      <Animated.View style={[styles.newDot, { transform: [{ scale: anim }] }]} />
      <Text style={styles.newBadgeText}>NEW</Text>
    </View>
  );
}

// ── Compact Booking Card ───────────────────────────────────────────────────────
function BookingCard({ item, onViewDetail, onQuickAccept }) {
  const tripC    = TRIP_COLORS[item.tripType] || TRIP_COLORS.LOCAL;
  const isNew = item.broadcastedAt && (new Date() - new Date(item.broadcastedAt)) < 15 * 60 * 1000;
  const isExpired = (() => {
    if (!item.pickupDate) return false;
    const dateStr = moment(item.pickupDate).format('YYYY-MM-DD');
    const timeStr = item.pickupTime || '23:59';
    const pickupMoment = moment(`${dateStr} ${timeStr}`, ['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD h:mm A']);
    return pickupMoment.isBefore(moment());
  })();

  // Build a compact meta string
  const meta = [
    item.pickupDate && moment(item.pickupDate).format('DD MMM'),
    item.pickupTime,
    item.carCategoryName,
    item.estimatedDistance > 0 && `${item.estimatedDistance} km`,
    item.localPackageHours && `${item.localPackageHours}h/${item.localPackageKm}km`,
  ].filter(Boolean);

  return (
    <View style={[styles.card, isExpired && styles.cardExpired]}>

      {/* ── Row 1: Type pill + booking# ── */}
      <View style={styles.cardRow1}>
        <View style={[styles.tripPill, { backgroundColor: tripC.bg }]}>
          <Text style={[styles.tripPillText, { color: tripC.color }]}>
            {TRIP_LABELS[item.tripType] || item.tripType}
          </Text>
        </View>

        <View style={styles.row1Right}>
          {isNew && !isExpired && <NewBadge />}
          {isExpired && (
            <View style={styles.expiredPill}>
              <Ionicons name="time-outline" size={10} color={C.danger} />
              <Text style={styles.expiredPillText}>Date Passed</Text>
            </View>
          )}
          <Text style={styles.bookNum}>#{item.bookingNumber}</Text>
        </View>
      </View>

      {/* ── Row 2: Route (compact single-line) ── */}
      <View style={styles.routeRow}>
        <View style={styles.routeDotGreen} />
        <Text style={styles.routeCity} numberOfLines={1}>
          {item.pickupCity || '—'}
        </Text>
        <Ionicons name="arrow-forward" size={12} color={C.sub} style={styles.routeArrow} />
        {item.dropCity ? (
          <>
            <View style={styles.routeDotRed} />
            <Text style={styles.routeCity} numberOfLines={1}>
              {item.dropCity}
            </Text>
          </>
        ) : (
          <Text style={styles.routeSub}>Local / No drop</Text>
        )}
      </View>

      {/* ── Row 3: Meta info ── */}
      {meta.length > 0 && (
        <View style={styles.metaRow}>
          {meta.map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.metaDot} />}
              <Text style={styles.metaText}>{m}</Text>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* ── Row 4: Footer — earnings + actions ── */}
      <View style={styles.footer}>
        <View>
          {item.grandTotal > 0 && (
            <Text style={styles.bookingValueText}>
              Booking ₹{item.grandTotal.toLocaleString('en-IN')}
            </Text>
          )}
          {item.driverBatta > 0 ? (
            <>
              <Text style={styles.earningsLabel}>Your Earning</Text>
              <Text style={[styles.earningsAmt, isExpired && { color: C.sub }]}>
                ₹{item.driverBatta.toLocaleString('en-IN')}
              </Text>
            </>
          ) : (
            <Text style={styles.earningsLabel}>—</Text>
          )}
        </View>

        <View style={styles.footerBtns}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => onViewDetail(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.detailBtnText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptBtn, isExpired && styles.acceptBtnDisabled]}
            onPress={() => !isExpired && onQuickAccept(item)}
            activeOpacity={0.85}
            disabled={isExpired}
          >
            <Ionicons
              name={isExpired ? 'close' : 'checkmark'}
              size={14}
              color="#fff"
            />
            <Text style={styles.acceptBtnText}>
              {isExpired ? 'Expired' : 'Accept'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Accept Confirmation Modal ──────────────────────────────────────────────────
function AcceptModal({ booking, visible, onConfirm, onCancel, loading }) {
  if (!booking) return null;
  const tripC = TRIP_COLORS[booking.tripType] || TRIP_COLORS.LOCAL;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: tripC.bg }]}>
              <Ionicons name="checkmark-circle" size={28} color={tripC.color} />
            </View>
            <Text style={styles.modalTitle}>Confirm Acceptance</Text>
            <Text style={styles.modalSubtitle}>Please review before accepting this booking</Text>
          </View>

          {/* Summary */}
          <View style={styles.modalSummary}>
            {[
              { icon: 'receipt-outline',  label: 'Booking',  value: booking.bookingNumber },
              { icon: 'location-outline', label: 'Route',    value: booking.dropCity ? `${booking.pickupCity} → ${booking.dropCity}` : booking.pickupCity },
              { icon: 'calendar-outline', label: 'Pickup',   value: `${moment(booking.pickupDate).format('DD MMM YYYY')}${booking.pickupTime ? `, ${booking.pickupTime}` : ''}` },
              { icon: 'car-outline',      label: 'Vehicle',  value: booking.carCategoryName || '—' },
            ].map((r, i, arr) => (
              <View key={r.label} style={[styles.modalRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.modalRowIcon}>
                  <Ionicons name={r.icon} size={15} color={C.primary} />
                </View>
                <Text style={styles.modalRowLabel}>{r.label}</Text>
                <Text style={styles.modalRowValue} numberOfLines={1}>{r.value}</Text>
              </View>
            ))}

            {booking.driverBatta > 0 && (
              <LinearGradient colors={['#064E3B', '#16A34A']} style={styles.modalEarnings} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View>
                  <Text style={styles.modalEarningsLabel}>Your Earning (Driver Batta)</Text>
                  <Text style={styles.modalEarningsAmt}>₹{booking.driverBatta.toLocaleString('en-IN')}</Text>
                </View>
                <Ionicons name="wallet" size={26} color="rgba(255,255,255,0.4)" />
              </LinearGradient>
            )}
          </View>

          {/* Warning */}
          <View style={styles.modalWarning}>
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text style={styles.modalWarningText}>
              Once accepted, you must assign your vehicle and complete this trip. Make sure you are available on{' '}
              <Text style={{ fontWeight: '800' }}>{moment(booking.pickupDate).format('DD MMM YYYY')}</Text>.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, loading && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
                    <Text style={styles.modalConfirmText}>Yes, Accept Booking</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AvailableBookingsScreen({ navigation }) {
  const [allBookings, setAllBookings]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [tripFilter, setTripFilter]     = useState('ALL');
  const [datePeriod, setDatePeriod]     = useState('TODAY');
  const [sort, setSort]                 = useState('date');
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [accepting, setAccepting]       = useState(false);
  const autoRefreshRef                  = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getAvailableBookings('all');
      setAllBookings(res.data.bookings || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => load(true), 30000);
    return () => clearInterval(autoRefreshRef.current);
  }, [load]);

  // Filter + sort
  const periodFiltered = allBookings.filter(b =>
    isInPeriod(b.broadcastedAt || b.createdAt, datePeriod)
  );

  const bookings = (() => {
    let list = tripFilter === 'ALL'
      ? periodFiltered
      : periodFiltered.filter(b => (b.tripType?.toUpperCase()) === tripFilter);
    return [...list].sort((a, b) => {
      if (sort === 'earnings') return (b.driverBatta || 0) - (a.driverBatta || 0);
      return new Date(a.pickupDate) - new Date(b.pickupDate);
    });
  })();

  const counts = TRIP_FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'ALL'
      ? periodFiltered.length
      : periodFiltered.filter(b => (b.tripType?.toUpperCase()) === f.key).length;
    return acc;
  }, {});

  const breakdown = TRIP_FILTERS
    .filter(f => f.key !== 'ALL' && counts[f.key] > 0)
    .map(f => `${counts[f.key]} ${f.label}`)
    .join(' · ');

  async function confirmAccept() {
    if (!acceptTarget) return;
    setAccepting(true);
    try {
      const res = await acceptBooking(acceptTarget.id);
      if (res.data.success) {
        setAcceptTarget(null);
        setAllBookings(prev => prev.filter(b => b.id !== acceptTarget.id));
        navigation.navigate('AssignVehicle', { booking: res.data.booking });
      }
    } catch (err) {
      setAcceptTarget(null);
      const errMsg = err.response?.data?.error || err.message || 'Could not accept. This booking may have been taken.';
      setTimeout(() => { alert(errMsg); }, 300);
    }
    setAccepting(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Available Bookings</Text>
            {breakdown ? <Text style={styles.headerSub}>{breakdown}</Text> : null}
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{allBookings.length}</Text>
          </View>
        </View>

        {/* Sort row */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortBtn, sort === s.key && styles.sortBtnActive]}
              onPress={() => setSort(s.key)}
            >
              <Ionicons name={s.icon} size={12} color={sort === s.key ? '#fff' : 'rgba(255,255,255,0.65)'} />
              <Text style={[styles.sortBtnText, sort === s.key && styles.sortBtnTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date period filter row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePeriodScroll}>
          {DATE_PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.datePeriodBtn, datePeriod === p.key && styles.datePeriodBtnActive]}
              onPress={() => setDatePeriod(p.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={p.icon} size={11} color={datePeriod === p.key ? '#fff' : 'rgba(255,255,255,0.6)'} />
              <Text style={[styles.datePeriodText, datePeriod === p.key && styles.datePeriodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ── Trip type filter chips ── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TRIP_FILTERS.filter(f => f.key === 'ALL' || counts[f.key] > 0).map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, tripFilter === f.key && styles.filterChipActive]}
              onPress={() => setTripFilter(f.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={f.icon} size={12} color={tripFilter === f.key ? '#fff' : C.sub} />
              <Text style={[styles.filterChipText, tripFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              {counts[f.key] > 0 && (
                <View style={[styles.filterCount, tripFilter === f.key && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, tripFilter === f.key && styles.filterCountTextActive]}>
                    {counts[f.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loaderBox}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              onViewDetail={b => navigation.navigate('BookingDetail', { booking: b, isAvailable: true })}
              onQuickAccept={b => setAcceptTarget(b)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={38} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {tripFilter !== 'ALL' ? `No ${TRIP_LABELS[tripFilter]} bookings` : 'No bookings available'}
              </Text>
              <Text style={styles.emptyText}>
                {datePeriod !== 'ALL'
                  ? `No bookings for ${DATE_PERIODS.find(p => p.key === datePeriod)?.label}. Try a different period.`
                  : 'Pull down to refresh or check back soon'}
              </Text>
              {tripFilter !== 'ALL' && (
                <TouchableOpacity style={styles.emptyAction} onPress={() => setTripFilter('ALL')}>
                  <Text style={styles.emptyActionText}>Show All</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* ── Accept Confirmation Modal ── */}
      <AcceptModal
        booking={acceptTarget}
        visible={!!acceptTarget}
        onConfirm={confirmAccept}
        onCancel={() => !accepting && setAcceptTarget(null)}
        loading={accepting}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:      { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  headerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  countPill:   { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 5 },
  countPillText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  sortRow:     { flexDirection: 'row', gap: 6 },
  sortBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  sortBtnActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  sortBtnText:    { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  sortBtnTextActive: { color: '#fff', fontWeight: '800' },
  datePeriodScroll:      { paddingHorizontal: 2, paddingTop: 8, gap: 6, flexDirection: 'row' },
  datePeriodBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  datePeriodBtnActive:   { backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  datePeriodText:        { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  datePeriodTextActive:  { color: '#fff', fontWeight: '800' },

  // Filter bar
  filterBar:    { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 9, gap: 7 },
  filterChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  filterChipActive: { backgroundColor: C.dark, borderColor: C.dark },
  filterChipText:   { fontSize: 12, fontWeight: '700', color: C.sub },
  filterChipTextActive: { color: '#fff' },
  filterCount:      { backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  filterCountActive:    { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText:      { fontSize: 10, fontWeight: '800', color: C.sub },
  filterCountTextActive:{ color: '#fff' },

  list: { padding: 12, gap: 10 },

  // Card — compact
  card:        { backgroundColor: C.card, borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardExpired: { opacity: 0.55 },

  // Row 1
  cardRow1:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  tripPill:     { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  tripPillText: { fontSize: 11, fontWeight: '800' },
  row1Right:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bookNum:      { fontSize: 11, color: C.sub, fontWeight: '600' },

  // NEW badge
  newBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  newDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  newBadgeText: { fontSize: 9, color: C.primary, fontWeight: '800' },

  // Expired badge
  expiredPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  expiredPillText: { fontSize: 9, color: C.danger, fontWeight: '800' },

  // Route
  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  routeDotGreen:{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary, flexShrink: 0 },
  routeDotRed:  { width: 9, height: 9, borderRadius: 2, backgroundColor: C.danger, flexShrink: 0 },
  routeArrow:   { marginHorizontal: 2 },
  routeCity:    { fontSize: 14, fontWeight: '800', color: C.text, flexShrink: 1 },
  routeSub:     { fontSize: 12, color: C.sub, fontStyle: 'italic' },

  // Meta
  metaRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 10 },
  metaDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: C.border, marginHorizontal: 6 },
  metaText: { fontSize: 11, color: C.sub, fontWeight: '500' },

  // Footer
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  bookingValueText: { fontSize: 10, color: C.sub, fontWeight: '600', marginBottom: 2 },
  earningsLabel: { fontSize: 9, color: C.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  earningsAmt:   { fontSize: 18, fontWeight: '900', color: C.success },
  footerBtns:  { flexDirection: 'row', gap: 7 },
  detailBtn:   { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
  detailBtnText: { fontSize: 12, color: C.text, fontWeight: '700' },
  acceptBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  acceptBtnDisabled: { backgroundColor: '#94A3B8' },
  acceptBtnText: { fontSize: 12, color: '#fff', fontWeight: '800' },

  // Empty
  empty:       { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon:   { width: 76, height: 76, borderRadius: 38, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  emptyTitle:  { fontSize: 16, fontWeight: '800', color: C.text },
  emptyText:   { fontSize: 13, color: C.sub, textAlign: 'center' },
  emptyAction: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 },
  emptyActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 30 },
  modalHandle:    { width: 38, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 6 },
  modalHeader:    { alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18 },
  modalHeaderIcon:{ width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  modalTitle:     { fontSize: 19, fontWeight: '800', color: C.text, marginBottom: 3 },
  modalSubtitle:  { fontSize: 13, color: C.sub, textAlign: 'center' },
  modalSummary:   { marginHorizontal: 16, backgroundColor: C.bg, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  modalRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  modalRowIcon:   { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  modalRowLabel:  { fontSize: 11, color: C.sub, fontWeight: '600', width: 68 },
  modalRowValue:  { flex: 1, fontSize: 13, color: C.text, fontWeight: '700', textAlign: 'right' },
  modalEarnings:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  modalEarningsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 3 },
  modalEarningsAmt:   { fontSize: 26, fontWeight: '900', color: '#fff' },
  modalWarning:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 14 },
  modalWarningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  modalActions:   { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  modalCancelText:{ fontSize: 14, fontWeight: '700', color: C.text },
  modalConfirmBtn:{ flex: 2, height: 50, borderRadius: 14, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  modalConfirmText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

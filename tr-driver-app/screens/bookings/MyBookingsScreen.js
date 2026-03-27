import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
  ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMyBookings } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
};

const PAGE_SIZE = 15;

// ── Service types ────────────────────────────────────────────────────────────

const SERVICES = [
  { key: 'all',       label: 'All',        icon: 'apps-outline' },
  { key: 'chauffeur', label: 'Chauffeur',   icon: 'car-outline' },
  { key: 'bus',       label: 'Bus',         icon: 'bus-outline' },
  { key: 'luxury',    label: 'Luxury',      icon: 'car-sport-outline' },
  { key: 'truck',     label: 'Truck',       icon: 'construct-outline' },
  { key: 'packers',   label: 'Packers',     icon: 'cube-outline' },
  { key: 'equipment', label: 'Equipment',   icon: 'build-outline' },
  { key: 'b2b',       label: 'B2B',         icon: 'briefcase-outline' },
  { key: 'direct',    label: 'Direct',      icon: 'clipboard-outline' },
];

const SVC_STYLE = {
  chauffeur: { color: '#3B82F6', bg: '#EFF6FF' },
  bus:       { color: '#D97706', bg: '#FEF3C7' },
  luxury:    { color: '#9333EA', bg: '#FDF4FF' },
  truck:     { color: '#EA580C', bg: '#FFF7ED' },
  packers:   { color: '#15803D', bg: '#F0FDF4' },
  equipment: { color: '#0369A1', bg: '#F0F9FF' },
  b2b:       { color: '#7C3AED', bg: '#F5F3FF' },
  direct:    { color: '#16A34A', bg: '#F0FDF4' },
};

// ── Status helpers ────────────────────────────────────────────────────────────

function getStatusConfig(status) {
  const m = {
    ACCEPTED:         { color: '#16A34A', bg: '#F0FDF4', label: 'Accepted' },
    DRIVER_ASSIGNED:  { color: '#16A34A', bg: '#F0FDF4', label: 'Assigned' },
    CONFIRMED:        { color: '#16A34A', bg: '#F0FDF4', label: 'Confirmed' },
    VEHICLE_ASSIGNED: { color: '#16A34A', bg: '#F0FDF4', label: 'Vehicle Assigned' },
    IN_PROGRESS:      { color: '#EA580C', bg: '#FFF7ED', label: 'In Progress' },
    STARTED:          { color: '#EA580C', bg: '#FFF7ED', label: 'Started' },
    DRIVER_ARRIVED:   { color: '#EA580C', bg: '#FFF7ED', label: 'Arrived' },
    LOADING:          { color: '#EA580C', bg: '#FFF7ED', label: 'Loading' },
    IN_TRANSIT:       { color: '#EA580C', bg: '#FFF7ED', label: 'In Transit' },
    COMPLETED:        { color: '#6366F1', bg: '#F5F3FF', label: 'Completed' },
    confirmed:        { color: '#16A34A', bg: '#F0FDF4', label: 'Confirmed' },
    assigned:         { color: '#16A34A', bg: '#F0FDF4', label: 'Assigned' },
    vehicle_assigned: { color: '#16A34A', bg: '#F0FDF4', label: 'Vehicle Assigned' },
    in_progress:      { color: '#EA580C', bg: '#FFF7ED', label: 'In Progress' },
    completed:        { color: '#6366F1', bg: '#F5F3FF', label: 'Completed' },
    inquiry:          { color: '#64748B', bg: '#F8FAFC', label: 'Inquiry' },
  };
  return m[status] || { color: '#64748B', bg: '#F8FAFC', label: status?.replace(/_/g, ' ') || '—' };
}

function isActiveStatus(s) {
  return ['ACCEPTED','DRIVER_ASSIGNED','IN_PROGRESS','CONFIRMED','VEHICLE_ASSIGNED',
    'TEAM_ASSIGNED','LOADING','IN_TRANSIT','UNLOADING','PACKING','UNPACKING',
    'STARTED','DRIVER_ARRIVED','DELIVERED','IN_USE',
    'confirmed','assigned','vehicle_assigned','in_progress'].includes(s);
}

// ── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({ item, navigation }) {
  const sc = getStatusConfig(item.status);
  const svc = SVC_STYLE[item.source] || SVC_STYLE.direct;
  // Only show direct earnings for personal trips — vendor-assigned ('direct') pays salary separately
  const isVendorAssigned = item.source === 'direct';
  const personalEarnings = isVendorAssigned ? null : (item.earnings ?? item.driverBatta);

  function handlePress() {
    const otpSources = ['chauffeur', 'bus', 'luxury'];
    const truckActiveStatuses = ['VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING'];
    const packersActiveStatuses = ['TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'];
    const equipmentActiveStatuses = ['CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED'];
    const b2bActiveStatuses = ['PENDING', 'DRIVER_ARRIVED', 'STARTED'];
    if (['IN_PROGRESS', 'STARTED'].includes(item.status) && otpSources.includes(item.source)) {
      navigation.navigate('ActiveTrip', { booking: item });
    } else if (item.source === 'truck' && truckActiveStatuses.includes(item.status)) {
      navigation.navigate('ActiveTrip', { booking: item });
    } else if (item.source === 'packers' && packersActiveStatuses.includes(item.status)) {
      navigation.navigate('ActiveTrip', { booking: item });
    } else if (item.source === 'equipment' && equipmentActiveStatuses.includes(item.status)) {
      navigation.navigate('ActiveTrip', { booking: item });
    } else if (item.source === 'b2b' && b2bActiveStatuses.includes(item.status)) {
      navigation.navigate('ActiveTrip', { booking: item });
    } else {
      navigation.navigate('BookingDetail', { booking: item });
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      {/* Status accent bar */}
      <View style={[styles.cardBar, { backgroundColor: sc.color }]} />

      <View style={styles.cardInner}>
        {/* Row 1: number + service badge + status */}
        <View style={styles.cardTop}>
          <View style={[styles.svcIcon, { backgroundColor: svc.bg }]}>
            <Ionicons
              name={SERVICES.find(s => s.key === item.source)?.icon || 'car-outline'}
              size={16}
              color={svc.color}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.numRow}>
              <Text style={styles.bookNum}>{item.bookingNumber}</Text>
              <View style={[styles.svcPill, { backgroundColor: svc.bg }]}>
                <Text style={[styles.svcPillText, { color: svc.color }]}>{item.serviceType}</Text>
              </View>
              {isVendorAssigned && (
                <View style={styles.vendorPill}>
                  <Text style={styles.vendorPillText}>Vendor</Text>
                </View>
              )}
            </View>
            <Text style={styles.route} numberOfLines={1}>
              {item.pickupCity || '—'}{item.dropCity ? ` → ${item.dropCity}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusPillText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Row 2: meta chips */}
        <View style={styles.metaRow}>
          {item.pickupDate && (
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={11} color={C.sub} />
              <Text style={styles.chipText}>{moment(item.pickupDate).format('DD MMM YYYY')}</Text>
            </View>
          )}
          {item.pickupDate && (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={11} color={C.sub} />
              <Text style={styles.chipText}>{moment(item.pickupDate).format('h:mm A')}</Text>
            </View>
          )}
          {(item.carCategoryName || item.serviceLabel) && (
            <View style={styles.chip}>
              <Ionicons name="information-circle-outline" size={11} color={C.sub} />
              <Text style={styles.chipText} numberOfLines={1}>{item.carCategoryName || item.serviceLabel}</Text>
            </View>
          )}
          {personalEarnings > 0 && (
            <View style={[styles.chip, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="wallet-outline" size={11} color={C.primary} />
              <Text style={[styles.chipText, { color: C.primary, fontWeight: '700' }]}>
                ₹{personalEarnings.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          {isVendorAssigned && (
            <View style={[styles.chip, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="business-outline" size={11} color="#3B82F6" />
              <Text style={[styles.chipText, { color: '#3B82F6', fontWeight: '600' }]}>Vendor Salary</Text>
            </View>
          )}
        </View>

        {/* Active trip bar */}
        {isActiveStatus(item.status) && (
          <View style={styles.activeBar}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBarText}>
              {['chauffeur','bus','luxury'].includes(item.source) && item.status === 'IN_PROGRESS'
                ? 'Trip in progress — tap to manage'
                : ['chauffeur','bus','luxury'].includes(item.source) && ['DRIVER_ASSIGNED','VEHICLE_ASSIGNED'].includes(item.status)
                ? 'Vehicle assigned — enter OTP to start'
                : 'Trip assigned — tap for details'}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={C.success} />
          </View>
        )}

        {/* Rating */}
        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={12} color="#F59E0B" />
            ))}
            {item.review && (
              <Text style={styles.reviewText} numberOfLines={1}> "{item.review}"</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Footer loader ─────────────────────────────────────────────────────────────

function ListFooter({ loading, hasMore }) {
  if (loading) return <ActivityIndicator size="small" color={C.primary} style={{ paddingVertical: 16 }} />;
  if (!hasMore) return (
    <Text style={styles.endText}>— End of list —</Text>
  );
  return null;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MyBookingsScreen({ navigation }) {
  const [tab, setTab] = useState('active');
  const [cache, setCache] = useState({ active: null, completed: null, all: null });
  const [counts, setCounts] = useState({ active: 0, completed: 0, all: 0 });
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef(null);

  // ── Load all tabs in parallel for counts + cache current tab ───────────────
  const loadAll = useCallback(async () => {
    try {
      const [activeRes, completedRes, allRes] = await Promise.all([
        getMyBookings('active').catch(() => ({ data: { bookings: [] } })),
        getMyBookings('completed').catch(() => ({ data: { bookings: [] } })),
        getMyBookings('all').catch(() => ({ data: { bookings: [] } })),
      ]);
      const active = activeRes.data.bookings || [];
      const completed = completedRes.data.bookings || [];
      const all = allRes.data.bookings || [];
      setCache({ active, completed, all });
      setCounts({ active: active.length, completed: completed.length, all: all.length });
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setPage(1);
    loadAll();
  }, [loadAll]));

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const data = cache[tab] || [];
    const q = search.trim().toLowerCase();
    return data.filter(b => {
      const matchService = serviceFilter === 'all' || b.source === serviceFilter;
      const matchSearch = !q ||
        (b.bookingNumber || '').toLowerCase().includes(q) ||
        (b.pickupCity || '').toLowerCase().includes(q) ||
        (b.dropCity || '').toLowerCase().includes(q) ||
        (b.customerName || '').toLowerCase().includes(q);
      return matchService && matchSearch;
    });
  }, [cache, tab, search, serviceFilter]);

  // Visible slice for infinite scroll
  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = visible.length < filtered.length;

  function handleEndReached() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPage(p => p + 1);
      setLoadingMore(false);
    }, 300);
  }

  function handleTabChange(key) {
    setTab(key);
    setPage(1);
    setSearch('');
    setServiceFilter('all');
  }

  const TABS = [
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'all',       label: 'All' },
  ];

  // ── Available services in current data (only show chips that exist) ─────────
  const availableServices = useMemo(() => {
    const data = cache[tab] || [];
    const present = new Set(data.map(b => b.source));
    return SERVICES.filter(s => s.key === 'all' || present.has(s.key));
  }, [cache, tab]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>Manage</Text>
            <Text style={styles.headerTitle}>My Bookings</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AvailableBookings')}
            style={styles.findBtn}
          >
            <Ionicons name="search" size={15} color="#fff" />
            <Text style={styles.findBtnText}>Find New</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar inside header */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.sub} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search booking, city, customer..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={t => { setSearch(t); setPage(1); }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => handleTabChange(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {counts[t.key] > 0 && (
              <View style={[styles.tabCount, tab === t.key && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, tab === t.key && styles.tabCountTextActive]}>
                  {counts[t.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Service filter chips ── */}
      {availableServices.length > 2 && (
        <View style={styles.chipBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {availableServices.map(s => {
              const svc = SVC_STYLE[s.key];
              const active = serviceFilter === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.svcChip,
                    active && { backgroundColor: svc?.color || C.primary, borderColor: svc?.color || C.primary },
                  ]}
                  onPress={() => { setServiceFilter(s.key); setPage(1); }}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={s.icon}
                    size={13}
                    color={active ? '#fff' : (svc?.color || C.sub)}
                  />
                  <Text style={[styles.svcChipText, active && { color: '#fff' }, !active && svc && { color: svc.color }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Results summary ── */}
      {!loading && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {filtered.length === 0
              ? 'No bookings found'
              : `${filtered.length} booking${filtered.length !== 1 ? 's' : ''}${
                  (() => {
                    // Only count earnings from personal trips (not vendor-assigned 'direct' bookings)
                    const total = filtered.reduce((s, b) => {
                      if (b.source === 'direct') return s;
                      return s + (b.earnings || b.driverBatta || 0);
                    }, 0);
                    return total > 0 ? ` · ₹${total.toLocaleString('en-IN')} earned` : '';
                  })()
                }`
            }
          </Text>
          {(search || serviceFilter !== 'all') && (
            <TouchableOpacity onPress={() => { setSearch(''); setServiceFilter('all'); setPage(1); }}>
              <Text style={styles.clearFilter}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => `${item.source}-${item.id}`}
          renderItem={({ item }) => <BookingCard item={item} navigation={navigation} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setPage(1); loadAll(); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<ListFooter loading={loadingMore} hasMore={hasMore} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="car-outline" size={38} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {search || serviceFilter !== 'all' ? 'No matching bookings' : `No ${tab} bookings`}
              </Text>
              <Text style={styles.emptyText}>
                {search || serviceFilter !== 'all'
                  ? 'Try clearing your search or filters'
                  : tab === 'active'
                  ? 'No trips assigned right now'
                  : 'No completed trips yet'}
              </Text>
              {tab === 'active' && !search && serviceFilter === 'all' && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('AvailableBookings')}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={styles.emptyActionText}>Browse Available Bookings</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  findBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  findBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, fontWeight: '500', padding: 0 },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: C.card,
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: C.bg,
  },
  tabActive: { backgroundColor: C.dark },
  tabText: { fontSize: 13, fontWeight: '700', color: C.sub },
  tabTextActive: { color: '#fff' },
  tabCount: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: C.border, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: C.sub },
  tabCountTextActive: { color: '#fff' },

  // Service chips
  chipBar: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chipScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  svcChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card,
  },
  svcChipText: { fontSize: 12, fontWeight: '700', color: C.sub },

  // Summary bar
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  summaryText: { fontSize: 12, color: C.sub, fontWeight: '500' },
  clearFilter: { fontSize: 12, color: C.primary, fontWeight: '700' },

  // List
  list: { padding: 16, gap: 10 },
  endText: { textAlign: 'center', fontSize: 12, color: C.sub, paddingVertical: 16 },

  // Card
  card: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: 16,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardBar: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  svcIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 },
  bookNum: { fontSize: 11, color: C.sub, fontWeight: '700' },
  svcPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  svcPillText: { fontSize: 10, fontWeight: '700' },
  vendorPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vendorPillText: { fontSize: 10, color: '#2563EB', fontWeight: '700' },
  route: { fontSize: 15, fontWeight: '700', color: C.text },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, marginLeft: 6, flexShrink: 0 },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  chipText: { fontSize: 11, color: C.sub },
  activeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  activeBarText: { flex: 1, fontSize: 11, color: C.success, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  reviewText: { fontSize: 11, color: C.sub, flex: 1 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptyText: { fontSize: 14, color: C.sub, textAlign: 'center' },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 10, marginTop: 6,
  },
  emptyActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

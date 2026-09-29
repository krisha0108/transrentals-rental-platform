import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getB2BOpenBookings } from '../../api/client';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: T.oceanLight, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight, red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight, purple: T.purple, purpleBg: T.tintPlum,
};

const STATUS_CONFIG = {
  OPEN_FOR_QUOTES:  { label: 'Open for Quotes',  bg: '#D1FAE5', text: '#065F46' },
  QUOTES_RECEIVED:  { label: 'Quotes Received',  bg: '#FEF3C7', text: '#92400E' },
  SUPER_QUOTE_SENT: { label: 'Super Quote Sent', bg: '#E0E7FF', text: '#3730A3' },
  CONFIRMED:        { label: 'Confirmed',         bg: '#DBEAFE', text: '#1E40AF' },
  IN_PROGRESS:      { label: 'In Progress',       bg: C.g100,    text: '#065F46' },
  COMPLETED:        { label: 'Completed',          bg: '#F1F5F9', text: '#475569' },
  CANCELLED:        { label: 'Cancelled',          bg: '#FEE2E2', text: '#991B1B' },
};

const SERVICE_ICON = {
  CAR:        { icon: 'car',            color: C.blue,   bg: C.blueBg   },
  BUS:        { icon: 'bus',            color: C.amber,  bg: C.amberBg  },
  BIKE:       { icon: 'motorbike',      color: C.g500,   bg: C.g50      },
  TRUCK:      { icon: 'truck',          color: C.purple, bg: C.purpleBg },
  LUXURY:     { icon: 'star',           color: '#EAB308',bg: '#FEFCE8'  },
  SELF_DRIVE: { icon: 'steering',       color: '#14B8A6',bg: '#F0FDFA'  },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const PAGE_SIZE = 15;

export default function B2BOpenBookingsScreen({ navigation }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [serviceFilter, setServiceFilter]   = useState('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const loadBookings = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      const res = await getB2BOpenBookings({ page: pageNum, limit: PAGE_SIZE });
      const items = res.bookings || res.data || [];
      const total = res.pagination?.total || items.length;

      if (isRefresh || pageNum === 1) {
        setAllBookings(items);
      } else {
        setAllBookings(prev => [...prev, ...items]);
      }
      setHasMore(pageNum * PAGE_SIZE < total);
      setPage(pageNum);
    } catch (e) {
      console.error('B2BOpenBookings fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadBookings(1);
  }, [loadBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings(1, true);
  }, [loadBookings]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    loadBookings(page + 1);
  }, [hasMore, loadingMore, loading, page, loadBookings]);

  const filteredBookings = allBookings.filter(b => {
    const myQuote = b.vendorQuotes?.[0];
    // Service type filter
    if (serviceFilter !== 'all') {
      const sType = (b.serviceType || '').toLowerCase().replace(/\s/g, '-');
      if (sType !== serviceFilter) return false;
    }
    // Status filter
    if (selectedFilter === 'all')          return true;
    if (selectedFilter === 'yet_to_quote') return !myQuote;
    if (selectedFilter === 'submitted')    return ['SUBMITTED', 'UNDER_REVIEW'].includes(myQuote?.status);
    if (selectedFilter === 'confirmed')    return myQuote?.status === 'CONFIRMED';
    if (selectedFilter === 'rejected')     return ['REJECTED', 'WITHDRAWN'].includes(myQuote?.status);
    return true;
  });

  const serviceFilters = [
    { key: 'all',        label: 'All Services', icon: 'apps',        mci: true,  color: C.g700,   bg: C.g50    },
    { key: 'car',        label: 'Car Rental',   icon: 'car',         mci: true,  color: C.blue,   bg: C.blueBg },
    { key: 'self-drive', label: 'Self Drive',   icon: 'steering',    mci: true,  color: '#14B8A6',bg: '#F0FDFA'},
    { key: 'bus',        label: 'Bus',          icon: 'bus',         mci: true,  color: C.amber,  bg: C.amberBg},
    { key: 'luxury',     label: 'Luxury Car',   icon: 'star',        mci: true,  color: '#EAB308',bg: '#FEFCE8'},
    { key: 'bike',       label: 'Bike',         icon: 'motorbike',   mci: true,  color: C.g500,   bg: C.g50   },
  ];

  const filterCounts = {
    all:          allBookings.length,
    yet_to_quote: allBookings.filter(b => !b.vendorQuotes?.length).length,
    submitted:    allBookings.filter(b => ['SUBMITTED', 'UNDER_REVIEW'].includes(b.vendorQuotes?.[0]?.status)).length,
    confirmed:    allBookings.filter(b => b.vendorQuotes?.[0]?.status === 'CONFIRMED').length,
    rejected:     allBookings.filter(b => ['REJECTED', 'WITHDRAWN'].includes(b.vendorQuotes?.[0]?.status)).length,
  };

  const filters = [
    { key: 'all',          label: 'All'          },
    { key: 'yet_to_quote', label: 'To Quote'     },
    { key: 'submitted',    label: 'Submitted'    },
    { key: 'confirmed',    label: 'Confirmed'    },
    { key: 'rejected',     label: 'Not Selected' },
  ];

  const renderBooking = useCallback(({ item, index }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, bg: '#F1F5F9', text: C.sub };
    const hasQuoted = !!(item.vendorQuotes?.length > 0 || item.hasQuoted);
    const svcKey = (item.serviceType || '').toUpperCase().replace(/[\s-]/g, '_');
    const svc = SERVICE_ICON[svcKey] || { icon: 'briefcase', color: C.sub, bg: '#F1F5F9' };

    return (
      <View style={[s.card, index === 0 && { marginTop: 14 }]}>
        {/* Card top row */}
        <View style={s.cardTopRow}>
          {/* Service icon + type */}
          <View style={[s.svcBox, { backgroundColor: svc.bg }]}>
            <MCI name={svc.icon} size={18} color={svc.color} />
          </View>
          <View style={s.cardTopMid}>
            <Text style={s.bookingNum}>#{item.bookingNumber}</Text>
            <Text style={[s.companyName, { color: svc.color, fontWeight: '600' }]} numberOfLines={1}>
              {item.serviceType || 'B2B Booking'}
            </Text>
            {item.vehicleCategory ? (
              <Text style={s.vehicleCategoryText} numberOfLines={1}>
                {item.vehicleCategory}
              </Text>
            ) : null}
          </View>
          <View style={s.cardTopRight}>
            <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[s.statusPillText, { color: sc.text }]}>{sc.label}</Text>
            </View>
            {hasQuoted && (
              <View style={s.quotedChip}>
                <Icon name="check" size={10} color={C.g600} />
                <Text style={s.quotedChipText}>Quoted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Route row */}
        <View style={s.routeRow}>
          <View style={s.routeDot} />
          <View style={s.routeLine} />
          <MCI name="briefcase" size={14} color={C.sub} />
          <View style={s.routeLine} />
          <View style={[s.routeDot, { backgroundColor: C.red }]} />
          <View style={s.routeCities}>
            <Text style={s.routeCity} numberOfLines={1}>
              {item.pickupLocation || 'N/A'}
            </Text>
            <Text style={s.routeCity} numberOfLines={1}>
              {item.dropLocation || item.pickupLocation || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Info chips */}
        <View style={s.chipsRow}>
          <View style={s.chip}>
            <Icon name="calendar" size={12} color={C.sub} />
            <Text style={s.chipText}>{fmt(item.scheduledDate)}</Text>
          </View>
          <View style={s.chip}>
            <Icon name="truck" size={12} color={C.sub} />
            <Text style={s.chipText}>{item.vehiclesRequired || 0} vehicles</Text>
          </View>
          {item.tripType && (
            <View style={s.chip}>
              <Icon name="navigation" size={12} color={C.sub} />
              <Text style={s.chipText}>{item.tripType}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.cardFooter}>
          <TouchableOpacity
            style={hasQuoted ? s.btnGreen : s.btnBlue}
            onPress={() => navigation.navigate('B2BBookingDetail', { bookingId: item.id, booking: item })}
            activeOpacity={0.7}
          >
            <Text style={hasQuoted ? s.btnGreenText : s.btnBlueText}>
              {hasQuoted ? 'View Details' : 'Submit Quote'}
            </Text>
            <Icon name="arrow-right" size={14} color={hasQuoted ? C.g700 : C.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => navigation.navigate('ChatScreen', { bookingId: item.id, customerName: 'B2B Manager', bookingNumber: item.bookingNumber, serviceType: item.serviceType })}
            activeOpacity={0.7}
          >
            <Icon name="message-circle" size={16} color={C.sub} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [navigation]);

  const activeServiceFilter = serviceFilters.find(f => f.key === serviceFilter);
  const isServiceFiltered = serviceFilter !== 'all';

  const ListHeader = (
    <View style={s.stickyHeaderWrap} renderToHardwareTextureAndroid>
      {/* Header gradient */}
      <LinearGradient colors={G.hero} style={s.headerGrad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Open Requests</Text>
              <Text style={s.headerSub}>Corporate bookings available for quoting</Text>
            </View>
            <TouchableOpacity style={s.headerBtn} onPress={() => setFilterModalOpen(true)} activeOpacity={0.8}>
              <Icon name="filter" size={18} color={isServiceFiltered ? C.g400 : 'rgba(255,255,255,0.7)'} />
              {isServiceFiltered && <View style={s.filterBadge} />}
            </TouchableOpacity>
          </View>
          {/* Active filter pill */}
          {isServiceFiltered && (
            <View style={s.activeFilterRow}>
              <View style={s.activeFilterPill}>
                <MCI name={activeServiceFilter?.icon} size={13} color={activeServiceFilter?.color} />
                <Text style={[s.activeFilterText, { color: activeServiceFilter?.color }]}>
                  {activeServiceFilter?.label}
                </Text>
                <TouchableOpacity onPress={() => setServiceFilter('all')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="x" size={12} color={activeServiceFilter?.color} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Status filter tabs */}
      <View style={s.tabsBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsBarOuter} contentContainerStyle={s.tabsBar}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.tab, selectedFilter === f.key && s.tabActive]}
              onPress={() => setSelectedFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text numberOfLines={1} style={[s.tabText, selectedFilter === f.key && s.tabTextActive]}>
                {f.label}
              </Text>
              <View style={[s.tabPill, selectedFilter === f.key && s.tabPillActive]}>
                <Text style={[s.tabPillText, selectedFilter === f.key && s.tabPillTextActive]}>
                  {filterCounts[f.key]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

    </View>
  );

  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g950} />
        <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {ListHeader}
          {[0, 1, 2].map((i) => (
            <View key={i} style={s.card}>
              <View style={s.cardTopRow}>
                <Bone w={38} h={38} r={10} />
                <View style={s.cardTopMid}>
                  <Bone w={70} h={11} style={{ marginBottom: 4 }} />
                  <Bone w={130} h={14} />
                </View>
                <Bone w={80} h={18} r={8} />
              </View>
              <View style={{ marginHorizontal: 14, marginBottom: 10 }}>
                <Bone w="100%" h={36} r={10} />
              </View>
              <View style={s.chipsRow}>
                <Bone w={70} h={22} r={8} />
                <Bone w={80} h={22} r={8} />
              </View>
              <View style={s.cardFooter}>
                <Bone h={36} r={10} style={{ flex: 1 }} />
                <Bone w={36} h={36} r={10} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      {/* Service Filter Modal */}
      <Modal
        visible={filterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setFilterModalOpen(false)}>
          <View style={s.filterSheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Filter by Service</Text>
              <TouchableOpacity onPress={() => setFilterModalOpen(false)}>
                <Icon name="x" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>
            <View style={s.sheetGrid}>
              {serviceFilters.map(f => {
                const isActive = serviceFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[s.sheetOption, isActive && { borderColor: f.color, backgroundColor: f.bg }]}
                    onPress={() => { setServiceFilter(f.key); setFilterModalOpen(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[s.sheetOptionIcon, { backgroundColor: isActive ? f.color + '22' : C.bg }]}>
                      <MCI name={f.icon} size={22} color={isActive ? f.color : C.muted} />
                    </View>
                    <Text style={[s.sheetOptionText, isActive && { color: f.color, fontWeight: '700' }]}>
                      {f.label}
                    </Text>
                    {isActive && <View style={[s.sheetOptionDot, { backgroundColor: f.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBooking}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyBox}>
              <MCI name="briefcase-search" size={48} color={C.muted} />
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySub}>
                {selectedFilter === 'quoted'
                  ? "You haven't submitted any quotes yet"
                  : 'Check back later for new B2B bookings'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && !refreshing
            ? <ActivityIndicator style={s.loadMore} color={C.g600} />
            : loadingMore
              ? <ActivityIndicator style={s.loadMore} color={C.g600} />
              : <View style={{ height: 40 }} />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  stickyHeaderWrap: { backgroundColor: C.bg, elevation: 8, zIndex: 10, shadowColor: 'transparent' },
  headerGrad: {
    paddingBottom: 16, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingTop: 12, paddingBottom: 4,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: DISPLAY },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },

  /* Filter tabs */
  tabsBarWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabsBarOuter: { flexGrow: 0, flexShrink: 0, height: 60 },
  tabsBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, gap: 6, backgroundColor: C.bg,
  },
  tabActive: { borderBottomWidth: 0, backgroundColor: C.g50 },
  tabText: { fontSize: 14, fontWeight: '600', color: C.sub },
  tabTextActive: { color: C.g700, fontWeight: '700' },
  tabPill: {
    minWidth: 20, height: 18, borderRadius: 9,
    backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  tabPillActive: { backgroundColor: C.g100 },
  tabPillText: { fontSize: 11, fontWeight: '700', color: C.sub },
  tabPillTextActive: { color: C.g700 },

  /* Active filter pill in header */
  activeFilterRow: { alignItems: 'center', paddingBottom: 10 },
  activeFilterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  activeFilterText: { fontSize: 13, fontWeight: '700' },

  /* Filter badge dot */
  filterBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.g400, borderWidth: 1.5, borderColor: C.g950,
  },

  /* Service filter modal */
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  filterSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  sheetGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 16, gap: 12,
  },
  sheetOption: {
    width: '46%', flexGrow: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border,
    padding: 14,
  },
  sheetOptionIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetOptionText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.sub },
  sheetOptionDot: { width: 8, height: 8, borderRadius: 4 },

  /* List */
  listContent: { paddingBottom: 20 },

  /* Card */
  card: {
    backgroundColor: C.surface, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    marginHorizontal: 14, marginBottom: 12, overflow: 'hidden',
    ...cardShadow,
  },

  /* Card top row */
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 10,
  },
  svcBox: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTopMid: { flex: 1 },
  bookingNum: { fontSize: 12, fontWeight: '700', color: C.muted, fontVariant: ['tabular-nums'] },
  companyName: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 1, fontFamily: DISPLAY },
  vehicleCategoryText: { fontSize: 13, color: C.sub, marginTop: 2 },
  cardTopRight: { alignItems: 'flex-end', gap: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  quotedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.g50, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  quotedChipText: { fontSize: 11, fontWeight: '700', color: C.g600 },

  /* Route row */
  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 10,
    marginHorizontal: 14, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 10, gap: 4,
  },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500 },
  routeLine: { flex: 1, height: 1, backgroundColor: C.border },
  routeCities: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
    top: 20,
  },
  routeCity: { fontSize: 11, color: C.sub, fontWeight: '500', maxWidth: '45%' },

  /* Chips */
  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 14, paddingBottom: 10, gap: 6,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  /* Footer */
  cardFooter: {
    paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: '#F8FAFC',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  chatBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  btnGreen: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.g50, borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: C.g100,
  },
  btnGreenText: { fontSize: 14, fontWeight: '700', color: C.g700 },
  btnBlue: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.blueBg, borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  btnBlueText: { fontSize: 14, fontWeight: '700', color: C.blue },

  /* Empty */
  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 14, fontFamily: DISPLAY },
  emptySub: { fontSize: 14, color: C.sub, marginTop: 6, textAlign: 'center', lineHeight: 19 },

  /* Load more */
  loadMore: { paddingVertical: 24 },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation,
  Platform, UIManager, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';
import { SC as T, G, rs, shade, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight,
  blue: T.blue, blueL: T.blueLight,
  red: T.red,
  indigo: T.indigo,
  cyan: shade(T.ocean, 25),
  ivory: T.ivory, sand: T.sand, glassBorder: T.glassBorder,
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { label: 'Payment Pending',   color: C.amber  },
  PAYMENT_VERIFIED: { label: 'Payment Verified',  color: C.g600   },
  BROADCASTED:      { label: 'Open',              color: C.blue   },
  PENDING_VENDOR:   { label: 'Pending',           color: C.amber  },
  ACCEPTED:         { label: 'Accepted',          color: C.g600   },
  CONFIRMED:        { label: 'Confirmed',         color: C.g600   },
  READY_FOR_PICKUP: { label: 'Ready for Pickup',  color: C.cyan   },
  IN_PROGRESS:      { label: 'In Progress',       color: C.indigo },
  COMPLETED:        { label: 'Completed',         color: C.g700   },
  CANCELLED:        { label: 'Cancelled',         color: C.red    },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

/* ── Expanded info row ─────────────────────────────────────────────────── */
const ERow = ({ iconName, label, value }) => (
  <View style={styles.eRow}>
    <View style={styles.eIconWrap}>
      <Icon name={iconName} size={10} color={C.sub} />
    </View>
    <Text style={styles.eLabel}>{label}</Text>
    <Text style={styles.eVal}>{value}</Text>
  </View>
);

/* ── Illustrated empty state ──────────────────────────────────────────── */
const EmptyState = ({ filtered, selectedFilter, onClearSearch }) => (
  <View style={styles.emptyCardWrap}>
    <View style={styles.emptyArt}>
      <View style={styles.emptyArtCardBack} />
      <View style={styles.emptyArtCard}>
        <MaterialCommunityIcons name={filtered ? 'magnify' : 'bus'} size={rs(40)} color={C.g400} />
      </View>
      <View style={styles.emptyArtDot} />
      <View style={styles.emptyArtTag}>
        <Text style={styles.emptyArtTagTxt}>
          {filtered ? 'NO MATCH' : (selectedFilter === 'completed' ? 'DONE' : 'ACTIVE')}
        </Text>
      </View>
    </View>

    <Text style={styles.emptyTitle}>
      {filtered
        ? 'No matches found'
        : (selectedFilter === 'completed' ? 'No completed bookings' : 'No active bookings')}
    </Text>
    <Text style={styles.emptyBody}>
      {filtered
        ? 'Try a different name, booking number or city.'
        : (selectedFilter === 'completed'
            ? 'Completed trips will appear here'
            : 'Your current bus rental bookings will appear here')}
    </Text>

    {filtered && (
      <TouchableOpacity style={styles.emptyCtaWrap} onPress={onClearSearch} activeOpacity={0.9}>
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyCta}>
          <Icon name="x" size={14} color="#fff" />
          <Text style={styles.emptyCtaText}>Clear Search</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function BusBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter,  setShowDateFilter]  = useState(false);
  const [selectedFilter,  setSelectedFilter]  = useState('active');
  const [expandedId,      setExpandedId]      = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const {
    data: allBookings, loading, refreshing, hasMore,
    loadMore, refresh, initialLoad, applyDateFilter, dateFilter,
  } = useInfiniteScroll(getBookings, { service: 'bus', type: filter });

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const tabFiltered = selectedFilter === 'completed'
    ? allBookings.filter(b => b.status === 'COMPLETED')
    : allBookings.filter(b => b.status !== 'COMPLETED');
  const q = searchQuery.trim().toLowerCase();
  const bookings = q
    ? tabFiltered.filter(b =>
        (b.bookingNumber || '').toLowerCase().includes(q) ||
        (b.customerName  || '').toLowerCase().includes(q) ||
        (b.pickupCity    || '').toLowerCase().includes(q) ||
        (b.dropCity      || '').toLowerCase().includes(q)
      )
    : tabFiltered;

  const activeCount    = allBookings.filter(b => b.status !== 'COMPLETED').length;
  const completedCount = allBookings.filter(b => b.status === 'COMPLETED').length;

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  /* ── Booking card ──────────────────────────────────────────────────────── */
  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.card}>
        {/* Tonal accent rail — stretches to the card's full height, including
            the expanded section, because the parent row uses default stretch. */}
        <LinearGradient
          colors={[sc.color, shade(sc.color, -20)]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.cardRail}
        />

        <View style={styles.cardInner}>
          {/* Tappable top area → BookingDetail */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BusBookingDetail', { bookingId: item.id, serviceType: 'bus' })}
          >
            {/* Top stripe: icon box + booking number + status */}
            <View style={styles.cardTopStripe}>
              <LinearGradient colors={[C.g600, C.g700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
                <MaterialCommunityIcons name="bus" size={rs(13)} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.bookingNum} numberOfLines={1}>#{item.bookingNumber}</Text>
                  {!!item.totalDays && (
                    <View style={styles.daysChip}>
                      <Text style={styles.daysChipText}>{item.totalDays}d rental</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${sc.color}18` }]}>
                <Text style={[styles.statusText, { color: sc.color }]} numberOfLines={1}>{sc.label}</Text>
              </View>
            </View>

            {/* Primary name */}
            <Text style={styles.cardName} numberOfLines={1}>{item.customerName}</Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="map-pin" size={10} color={C.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.locationName || item.pickupCity || 'N/A'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="calendar" size={10} color={C.muted} />
                <Text style={styles.metaText}>
                  {fmt(item.pickupDate)}
                  {item.pickupTime ? `  ${item.pickupTime.slice(0, 5)}` : ''}
                </Text>
              </View>
              {!!item.vehicleName && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="bus" size={10} color={C.muted} />
                  <Text style={[styles.metaText, { fontWeight: '700' }]} numberOfLines={1}>
                    {item.vehicleName}
                  </Text>
                </View>
              )}
            </View>

            {/* Footer: amount + expand toggle */}
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.amtLabel}>Total Amount</Text>
                <Text style={styles.amtValue}>
                  ₹{(item.grandTotal || item.totalAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.footerRight}>
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={[styles.expandCircle, isExpanded && styles.expandCircleActive]}>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color={isExpanded ? '#fff' : C.sub}
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.arrowCircle}>
                  <Icon name="arrow-right" size={12} color={C.g700} />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded section */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              <View style={styles.expandDivider} />
              {item.pickupAddress && (
                <ERow iconName="map-pin" label="Pickup Addr." value={item.pickupAddress} />
              )}
              {item.dropDate && (
                <ERow
                  iconName="calendar"
                  label="Drop Date"
                  value={`${fmt(item.dropDate)}${item.dropTime ? `  ${item.dropTime.slice(0, 5)}` : ''}`}
                />
              )}
              {item.customerNotes && (
                <View style={[styles.eRow, { alignItems: 'flex-start' }]}>
                  <View style={styles.eIconWrap}>
                    <Icon name="file-text" size={10} color={C.sub} />
                  </View>
                  <Text style={styles.eLabel}>Notes</Text>
                  <Text style={[styles.eVal, { flex: 1 }]}>{item.customerNotes}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={() => navigation.navigate('BusBookingDetail', { bookingId: item.id, serviceType: 'bus' })}
              >
                <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                <Icon name="arrow-right" size={12} color={C.g700} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const isFiltered = q.length > 0;

  /* ── Render ── */
  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Hero header */}
      <LinearGradient colors={G.hero} style={styles.header}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Icon name="arrow-left" size={17} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerEyebrow}>BUS RENTALS</Text>
              <Text style={styles.bigTitle}>Bookings</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setSearchOpen(v => !v); if (searchOpen) setSearchQuery(''); }}
              style={[styles.dateCircle, cardShadow, { marginRight: 10 }]}
              activeOpacity={0.85}
            >
              <Icon name={searchOpen ? 'x' : 'search'} size={17} color={C.g700} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDateFilter(true)}
              style={[styles.dateCircle, cardShadow]}
              activeOpacity={0.85}
            >
              <Icon name="calendar" size={17} color={C.g700} />
              {dateFilter.start && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>

          <View style={{ height: searchOpen ? rs(28) : 0 }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating search — tucks into the hero's bottom curve */}
      {searchOpen && (
      <View style={styles.searchBarWrap}>
        <View style={styles.searchCard}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, booking #, city…"
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={15} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      )}

      {/* Fixed filter pills — kept OUTSIDE the FlatList so switching tabs
          doesn't reset scroll position. */}
      <View style={[styles.filtersFixed, !searchOpen && { paddingTop: rs(6) }]}>
        {[
          { key: 'active',    label: 'Active',    count: activeCount,    icon: 'activity'      },
          { key: 'completed', label: 'Completed', count: completedCount, icon: 'check-circle'  },
        ].map(tab => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSelectedFilter(tab.key)}
              activeOpacity={0.85}
            >
              <Icon name={tab.icon} size={13} color={isActive ? '#fff' : C.sub} />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{tab.label}</Text>
              <View style={[styles.chipBadge, isActive && styles.chipBadgeActive]}>
                <Text style={[styles.chipBadgeText, isActive && styles.chipBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {(loading || refreshing) && allBookings.length === 0 ? (
        <View style={styles.listContent}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.card}>
              <View style={[styles.cardRail, { backgroundColor: '#DDE4EE' }]} />
              <View style={styles.cardInner}>
                <View style={styles.cardTopStripe}>
                  <Bone w={rs(26)} h={rs(26)} r={rs(8)} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Bone w={90} h={13} />
                  </View>
                  <Bone w={70} h={20} r={999} />
                </View>
                <Bone w={130} h={14} style={{ marginBottom: 6 }} />
                <View style={styles.metaRow}>
                  <Bone w={80} h={11} />
                  <Bone w={90} h={11} />
                </View>
                <View style={styles.cardFooter}>
                  <View>
                    <Bone w={70} h={10} style={{ marginBottom: 4 }} />
                    <Bone w={90} h={18} />
                  </View>
                  <Bone w={26} h={26} r={13} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g600]} />
          }
          ListFooterComponent={
            loading && hasMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={C.g600} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              filtered={isFiltered}
              selectedFilter={selectedFilter}
              onClearSearch={() => setSearchQuery('')}
            />
          }
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={(st, e, t) => applyDateFilter(st, e, t)}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },

  /* Hero header */
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(6),
  },
  headerSafe: { paddingHorizontal: 16 },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(12), marginBottom: rs(6) },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  dateCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: C.ivory,
    justifyContent: 'center', alignItems: 'center',
  },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: C.g600, borderWidth: 1.5, borderColor: C.ivory,
  },
  headerEyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1.2, fontFamily: DISPLAY, marginBottom: 2 },
  bigTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
  bigSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: '600', marginTop: 3, fontFamily: DISPLAY },

  /* Floating search */
  searchBarWrap: { marginHorizontal: 16, marginTop: -rs(24) },
  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: C.card, borderRadius: rs(15),
    paddingHorizontal: 14, height: rs(46),
    borderWidth: 1, borderColor: C.glassBorder,
    ...cardShadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },

  /* Filter pills */
  filtersFixed: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: rs(14), paddingBottom: rs(10),
  },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.g700, borderColor: C.g700 },
  chipText:       { fontSize: 14, fontWeight: '700', color: C.sub, fontFamily: DISPLAY },
  chipTextActive: { color: '#fff' },
  chipBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  chipBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipBadgeText:       { fontSize: 12, fontWeight: '700', color: C.g700 },
  chipBadgeTextActive: { color: '#fff' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardRail: { width: 3 },
  cardInner: { flex: 1, padding: 11, minWidth: 0 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconBox: {
    width: rs(26), height: rs(26), borderRadius: rs(8),
    justifyContent: 'center', alignItems: 'center',
  },
  cardTopLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookingNum:   { fontSize: 13.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  daysChip: {
    backgroundColor: C.g50, paddingHorizontal: 7, paddingVertical: 1.5,
    borderRadius: 7, borderWidth: 1, borderColor: C.g100,
  },
  daysChipText: { fontSize: 11, color: C.g700, fontWeight: '600' },
  statusPill:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText:  { fontSize: 10.5, fontWeight: '700' },

  cardName: { fontSize: 14.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY, marginBottom: 4 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 7 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11.5, color: C.sub, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 9,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  amtLabel: { fontSize: 11, color: C.muted, marginBottom: 1 },
  amtValue: { fontSize: 15, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expandCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  expandCircleActive: { backgroundColor: C.g700, borderColor: C.g700 },
  arrowCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Expanded */
  expandedSection: { paddingTop: 3 },
  expandDivider:   { height: 1, backgroundColor: C.border, marginBottom: 9, marginTop: 6 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  eIconWrap: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  eLabel: { fontSize: 12, color: C.muted, width: 72 },
  eVal:   { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  viewDetailsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    marginTop: 9, paddingVertical: 8, borderRadius: 9,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  viewDetailsBtnText: { fontSize: 12.5, fontWeight: '700', color: C.g700 },

  /* Elaborate empty state */
  emptyCardWrap: {
    alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: 20, paddingVertical: rs(30),
    marginTop: rs(10),
  },
  emptyArt: {
    width: rs(140), height: rs(112), marginBottom: rs(16),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(12), right: rs(20),
    width: rs(88), height: rs(64), borderRadius: rs(14),
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(88), height: rs(78), borderRadius: rs(16),
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(4), right: rs(16),
    width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: C.g400,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(8), left: rs(4),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g50,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontSize: 8.5, fontWeight: '700', color: C.g700, letterSpacing: 0.6, fontFamily: DISPLAY },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, fontFamily: DISPLAY, textAlign: 'center' },
  emptyBody: {
    fontSize: 14, color: C.muted, textAlign: 'center',
    lineHeight: 19, maxWidth: rs(260),
  },
  emptyCtaWrap: { marginTop: rs(16) },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: rs(14),
  },
  emptyCtaText: { fontSize: 13.5, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
});

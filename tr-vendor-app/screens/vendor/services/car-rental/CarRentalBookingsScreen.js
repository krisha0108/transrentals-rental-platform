import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Animated, LayoutAnimation, Platform, UIManager, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Feather';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:   { label: 'Payment Pending',  color: C.amber,  bg: C.amberL  },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: C.amber,  bg: C.amberL  },
  ADVANCE_PAID:      { label: 'Advance Paid',      color: C.g600,   bg: C.g50     },
  PAYMENT_VERIFIED:  { label: 'Payment Verified',  color: C.g600,   bg: C.g50     },
  BROADCASTED:       { label: 'Open',              color: C.blue,   bg: C.blueL   },
  PENDING_VENDOR:    { label: 'Pending',           color: C.amber,  bg: C.amberL  },
  ACCEPTED:          { label: 'Accepted',          color: C.g600,   bg: C.g50     },
  DRIVER_ASSIGNED:   { label: 'Driver Assigned',   color: C.blue,   bg: C.blueL   },
  IN_PROGRESS:       { label: 'In Progress',       color: C.purple, bg: C.purpleL },
  COMPLETED:         { label: 'Completed',         color: C.g700,   bg: C.g100    },
  CANCELLED:         { label: 'Cancelled',         color: C.red,    bg: C.redL    },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.skCard, { opacity: anim }]}>
      <View style={s.skRow}>
        <View style={[s.skBox, { width: 90, height: 16 }]} />
        <View style={[s.skBox, { width: 70, height: 22, borderRadius: 11 }]} />
      </View>
      <View style={[s.skBox, { width: '75%', height: 13, marginTop: 14 }]} />
      <View style={[s.skBox, { width: '55%', height: 13, marginTop: 8 }]} />
      <View style={[s.skBox, { width: '65%', height: 13, marginTop: 8 }]} />
      <View style={[s.skBox, { width: '40%', height: 18, marginTop: 14 }]} />
    </Animated.View>
  );
}

const COMPLETED_STATUSES = ['COMPLETED', 'CANCELLED'];

export default function CarRentalBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter,  setShowDateFilter]  = useState(false);
  const [expandedId,      setExpandedId]      = useState(null);
  const [selectedFilter,  setSelectedFilter]  = useState('all');

  const { data: allBookings, loading, refreshing, hasMore, loadMore, refresh, initialLoad, applyDateFilter, dateFilter } =
    useInfiniteScroll(getBookings, { service: 'car', type: filter });

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const bookings = selectedFilter === 'all'
    ? allBookings
    : selectedFilter === 'completed'
      ? allBookings.filter(b => COMPLETED_STATUSES.includes(b.status))
      : allBookings.filter(b => !COMPLETED_STATUSES.includes(b.status));

  const activeCount    = allBookings.filter(b => !COMPLETED_STATUSES.includes(b.status)).length;
  const completedCount = allBookings.filter(b => COMPLETED_STATUSES.includes(b.status)).length;

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted, bg: C.bg };
    const isExpanded = expandedId === item.id;
    return (
      <View style={s.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CarRentalBookingDetail', { bookingId: item.id, serviceType: 'car' })}
        >
          <LinearGradient colors={[C.g700, C.g500]} style={s.cardAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          {/* Card top */}
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              <Text style={s.num}>#{item.bookingNumber}</Text>
              {item.tripType && (
                <View style={s.tripChip}>
                  <Text style={s.tripChipText}>{item.tripType.replace(/_/g, ' ')}</Text>
                </View>
              )}
            </View>
            <View style={[s.badge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Card body */}
          <View style={s.body}>
            <View style={s.row}>
              <Icon name="user" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>{item.customerName}</Text>
            </View>
            <View style={s.routeRow}>
              <View style={s.routeStop}>
                <View style={[s.dot, { backgroundColor: C.g500 }]} />
                <Text style={s.routeCity} numberOfLines={1}>{item.pickupCity || '--'}</Text>
              </View>
              <View style={s.routeLine} />
              <View style={s.routeStop}>
                <View style={[s.dot, { backgroundColor: C.red }]} />
                <Text style={s.routeCity} numberOfLines={1}>{item.dropCity || 'Local'}</Text>
              </View>
            </View>
            <View style={s.row}>
              <Icon name="calendar" size={14} color={C.muted} />
              <Text style={s.rowText}>
                {fmt(item.pickupDate)}{item.pickupTime ? `  ${item.pickupTime.slice(0, 5)}` : ''}
              </Text>
            </View>
          </View>

          {/* Card footer */}
          <View style={s.footer}>
            <View>
              <Text style={s.amtLabel}>Total Amount</Text>
              <Text style={s.amt}>₹{(item.grandTotal || item.totalAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.footerRight}>
              <TouchableOpacity
                style={s.expandBtn}
                onPress={() => toggleExpand(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[s.expandCircle, isExpanded && s.expandCircleActive]}>
                  <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={isExpanded ? '#fff' : C.sub} />
                </View>
              </TouchableOpacity>
              <View style={s.arrowCircle}>
                <Icon name="arrow-right" size={14} color={C.g700} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded section */}
        {isExpanded && (
          <View style={s.expanded}>
            <View style={s.expandDivider} />
            {item.vehicleName && (
              <View style={s.eRow}>
                <Icon name="truck" size={13} color={C.muted} />
                <Text style={s.eLabel}>Vehicle</Text>
                <Text style={s.eVal}>{item.vehicleName}</Text>
              </View>
            )}
            {item.pickupAddress && (
              <View style={s.eRow}>
                <Icon name="map-pin" size={13} color={C.g500} />
                <Text style={s.eLabel}>Pickup Addr.</Text>
                <Text style={s.eVal}>{item.pickupAddress}</Text>
              </View>
            )}
            {item.dropAddress && (
              <View style={s.eRow}>
                <Icon name="map-pin" size={13} color={C.red} />
                <Text style={s.eLabel}>Drop Addr.</Text>
                <Text style={s.eVal}>{item.dropAddress}</Text>
              </View>
            )}
            {item.returnDate && (
              <View style={s.eRow}>
                <Icon name="calendar" size={13} color={C.muted} />
                <Text style={s.eLabel}>Return</Text>
                <Text style={s.eVal}>{fmt(item.returnDate)}</Text>
              </View>
            )}
            {item.totalDays && (
              <View style={s.eRow}>
                <Icon name="clock" size={13} color={C.muted} />
                <Text style={s.eLabel}>Duration</Text>
                <Text style={s.eVal}>{item.totalDays} days</Text>
              </View>
            )}
            {item.driverName && (
              <View style={s.eRow}>
                <Icon name="user-check" size={13} color={C.g600} />
                <Text style={s.eLabel}>Driver</Text>
                <Text style={[s.eVal, { color: C.g700 }]}>{item.driverName}</Text>
              </View>
            )}
            {item.customerNotes && (
              <View style={[s.eRow, { alignItems: 'flex-start' }]}>
                <Icon name="file-text" size={13} color={C.muted} />
                <Text style={s.eLabel}>Notes</Text>
                <Text style={[s.eVal, { flex: 1 }]}>{item.customerNotes}</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.viewBtn}
              onPress={() => navigation.navigate('CarRentalBookingDetail', { bookingId: item.id, serviceType: 'car' })}
            >
              <Text style={s.viewBtnText}>View Full Details</Text>
              <Icon name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      {/* Gradient Header */}
      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.decCircle1} />
        <View style={s.decCircle2} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Ionicons name="car" size={18} color="rgba(255,255,255,0.8)" style={{ marginBottom: 2 }} />
          <Text style={s.headerTitle}>Car Rental Bookings</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDateFilter(true)} style={s.filterBtn}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={dateFilter.start ? C.g400 : 'rgba(255,255,255,0.8)'}
          />
          {dateFilter.start && <View style={s.filterDot} />}
        </TouchableOpacity>
      </LinearGradient>

      {/* Active / All / Completed tabs */}
      <View style={s.tabBar}>
        {[
          { key: 'all',       label: 'All',       count: allBookings.length, icon: 'list'         },
          { key: 'active',    label: 'Active',    count: activeCount,        icon: 'activity'     },
          { key: 'completed', label: 'Done',      count: completedCount,     icon: 'check-circle' },
        ].map(tab => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabPill, isActive && s.tabPillActive]}
              onPress={() => setSelectedFilter(tab.key)}
            >
              <Icon name={tab.icon} size={13} color={isActive ? '#fff' : C.muted} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
              <View style={[s.tabBadge, isActive && s.tabBadgeActive]}>
                <Text style={[s.tabBadgeText, isActive && s.tabBadgeTextActive]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && allBookings.length === 0 ? (
        <View style={s.skeletonWrap}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={bookings}
          showsVerticalScrollIndicator={false}
          renderItem={renderBooking}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g600]} tintColor={C.g600} />
          }
          ListFooterComponent={
            loading && hasMore ? (
              <View style={s.skeletonWrap}>
                <SkeletonCard />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="car-outline" size={40} color={C.g400} />
              </View>
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySub}>Car rental bookings will appear here</Text>
            </View>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  skeletonWrap: { padding: 16, gap: 12 },
  skCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  skRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skBox: { backgroundColor: '#E2E8F0', borderRadius: 8, height: 14 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    right: 20,
  },
  decCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.g400,
  },

  /* List */
  list: { padding: 16, gap: 12, backgroundColor: C.bg },

  /* Tabs */
  tabBar: {
    flexDirection: 'row', backgroundColor: C.card,
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  tabPillActive:      { backgroundColor: C.g700, borderColor: C.g700 },
  tabLabel:           { fontSize: 12, fontWeight: '600', color: C.muted },
  tabLabelActive:     { color: '#fff' },
  tabBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
  },
  tabBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:       { fontSize: 10, fontWeight: '700', color: C.g700 },
  tabBadgeTextActive: { color: '#fff' },

  /* Card */
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardAccentBar: { height: 4, width: '100%' },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  num: { fontSize: 15, fontWeight: '700', color: C.text },
  tripChip: {
    backgroundColor: C.g50,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.g100,
  },
  tripChipText: { fontSize: 11, color: C.g700, fontWeight: '600', textTransform: 'capitalize' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  body: { paddingHorizontal: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { fontSize: 13, color: C.sub, flex: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1 },
  routeLine: { width: 24, height: 1, backgroundColor: C.border, marginHorizontal: 2 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  amtLabel: { fontSize: 11, color: C.muted, marginBottom: 1 },
  amt: { fontSize: 17, fontWeight: '800', color: C.g700 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandBtn: {},
  expandCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  expandCircleActive: { backgroundColor: C.g700, borderColor: C.g700 },
  arrowCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
  },

  /* Expanded */
  expanded: { paddingHorizontal: 14, paddingBottom: 14 },
  expandDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5 },
  eLabel: { fontSize: 12, color: C.muted, width: 80 },
  eVal: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.g700,
  },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* Empty */
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, gap: 12 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.g100,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.muted },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  subtext: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  brand: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: C.orange },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: C.orange },
  ADVANCE_PAID: { label: 'Advance Paid', color: C.green },
  PAYMENT_VERIFIED: { label: 'Payment Verified', color: C.green },
  BROADCASTED: { label: 'Open', color: C.brand },
  PENDING_VENDOR: { label: 'Pending', color: C.orange },
  ACCEPTED: { label: 'Accepted', color: C.green },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: C.brand },
  IN_PROGRESS: { label: 'In Progress', color: C.purple },
  COMPLETED: { label: 'Completed', color: '#059669' },
  CANCELLED: { label: 'Cancelled', color: C.red },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
};

export default function BusBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const {
    data: bookings,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    initialLoad,
    applyDateFilter,
    dateFilter,
  } = useInfiniteScroll(getBookings, {
    service: 'bus',
    type: filter,
  });

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const renderBooking = ({ item }) => {
    const statusConf = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.card}>
        {/* ── Collapsed header (always visible) ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BusBookingDetail', {
            bookingId: item.id,
            serviceType: 'bus',
          })}
          onLongPress={() => toggleExpand(item.id)}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
              {item.tripType && (
                <Text style={styles.tripTypeChip}>{item.tripType.replace(/_/g, ' ')}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConf.color + '20' }]}>
              <Text style={[styles.statusText, { color: statusConf.color }]}>
                {statusConf.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            {/* Customer + passengers */}
            <View style={styles.infoRow}>
              <Icon name="user" size={14} color={C.muted} />
              <Text style={styles.infoText} numberOfLines={1}>{item.customerName}</Text>
              {item.passengers ? (
                <View style={styles.passengerChip}>
                  <Icon name="users" size={11} color={C.brand} />
                  <Text style={styles.passengerText}>{item.passengers} pax</Text>
                </View>
              ) : null}
            </View>

            {/* Route */}
            <View style={styles.routeRow}>
              <View style={styles.routeStop}>
                <View style={[styles.routeDot, { backgroundColor: C.green }]} />
                <Text style={styles.routeCity} numberOfLines={1}>{item.pickupCity || '--'}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeStop}>
                <View style={[styles.routeDot, { backgroundColor: C.red }]} />
                <Text style={styles.routeCity} numberOfLines={1}>{item.dropCity || 'Local'}</Text>
              </View>
            </View>

            {/* Date + vehicle */}
            <View style={styles.infoRowSpaced}>
              <View style={styles.infoRow}>
                <Icon name="calendar" size={14} color={C.muted} />
                <Text style={styles.infoText}>
                  {formatDate(item.pickupDate)}
                  {item.pickupTime ? `  ${formatTime(item.pickupTime)}` : ''}
                </Text>
              </View>
              {item.vehicleCategory && (
                <View style={styles.infoRow}>
                  <Icon name="truck" size={14} color={C.muted} />
                  <Text style={[styles.infoText, { color: C.subtext }]} numberOfLines={1}>
                    {item.vehicleCategory}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.footerRight}>
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => toggleExpand(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
              </TouchableOpacity>
              <Icon name="chevron-right" size={18} color={C.brand} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Expanded extra details ── */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandDivider} />

            {item.vehicleName && (
              <View style={styles.expandRow}>
                <Icon name="truck" size={13} color={C.muted} />
                <Text style={styles.expandLabel}>Vehicle</Text>
                <Text style={styles.expandValue}>{item.vehicleName}</Text>
              </View>
            )}

            {item.pickupAddress && (
              <View style={styles.expandRow}>
                <Icon name="map-pin" size={13} color={C.green} />
                <Text style={styles.expandLabel}>Pickup Addr.</Text>
                <Text style={styles.expandValue}>{item.pickupAddress}</Text>
              </View>
            )}

            {item.dropAddress && (
              <View style={styles.expandRow}>
                <Icon name="map-pin" size={13} color={C.red} />
                <Text style={styles.expandLabel}>Drop Addr.</Text>
                <Text style={styles.expandValue}>{item.dropAddress}</Text>
              </View>
            )}

            {item.returnDate && (
              <View style={styles.expandRow}>
                <Icon name="calendar" size={13} color={C.muted} />
                <Text style={styles.expandLabel}>Return</Text>
                <Text style={styles.expandValue}>
                  {formatDate(item.returnDate)}
                  {item.returnTime ? `  ${formatTime(item.returnTime)}` : ''}
                </Text>
              </View>
            )}

            {item.tripDays && (
              <View style={styles.expandRow}>
                <Icon name="clock" size={13} color={C.muted} />
                <Text style={styles.expandLabel}>Duration</Text>
                <Text style={styles.expandValue}>{item.tripDays} days</Text>
              </View>
            )}

            {item.routeDetails && (
              <View style={styles.expandRow}>
                <Icon name="navigation" size={13} color={C.muted} />
                <Text style={styles.expandLabel}>Route</Text>
                <Text style={styles.expandValue}>{item.routeDetails}</Text>
              </View>
            )}

            {item.customerNotes && (
              <View style={[styles.expandRow, { alignItems: 'flex-start' }]}>
                <Icon name="file-text" size={13} color={C.muted} />
                <Text style={styles.expandLabel}>Notes</Text>
                <Text style={[styles.expandValue, { flex: 1 }]}>{item.customerNotes}</Text>
              </View>
            )}

            {item.driverName && (
              <View style={styles.expandRow}>
                <Icon name="user-check" size={13} color={C.green} />
                <Text style={styles.expandLabel}>Driver</Text>
                <Text style={[styles.expandValue, { color: C.green }]}>{item.driverName}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.openDetailBtn}
              onPress={() => navigation.navigate('BusBookingDetail', {
                bookingId: item.id,
                serviceType: 'bus',
              })}
            >
              <Text style={styles.openDetailText}>View Full Details</Text>
              <Icon name="arrow-right" size={14} color={C.brand} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Bookings</Text>
        <TouchableOpacity
          onPress={() => setShowDateFilter(true)}
          style={styles.filterButton}
        >
          <Icon name="calendar" size={20} color={dateFilter.start ? C.brand : C.muted} />
          {dateFilter.start && <View style={styles.activeFilterDot} />}
        </TouchableOpacity>
      </View>

      {loading && bookings.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.brand]} />
          }
          ListFooterComponent={loading && hasMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={C.brand} />
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="inbox" size={48} color={C.muted} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySubtext}>Bus bookings will appear here</Text>
            </View>
          }
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={(start, end, filterType) => applyDateFilter(start, end, filterType)}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text },
  filterButton: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  activeFilterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.brand,
  },
  list: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bookingNumber: { fontSize: 15, fontWeight: '700', color: C.text },
  tripTypeChip: {
    fontSize: 11, color: C.brand,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardBody: { paddingHorizontal: 14, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoRowSpaced: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoText: { fontSize: 13, color: C.subtext, flex: 1 },
  passengerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
  },
  passengerText: { fontSize: 11, color: C.brand, fontWeight: '600' },

  // Route visual
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1 },
  routeLine: { width: 24, height: 1, backgroundColor: C.border, marginHorizontal: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  amountLabel: { fontSize: 11, color: C.muted, marginBottom: 1 },
  amount: { fontSize: 17, fontWeight: '800', color: C.brand },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expandBtn: { padding: 4 },

  // Expanded section
  expandedSection: { paddingHorizontal: 14, paddingBottom: 14 },
  expandDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
  },
  expandLabel: { fontSize: 12, color: C.muted, width: 76 },
  expandValue: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  openDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  openDetailText: { fontSize: 13, fontWeight: '700', color: C.brand },

  // Empty state
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  emptySubtext: { fontSize: 13, color: C.muted },
});

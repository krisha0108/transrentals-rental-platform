import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

export default function PackersBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    data: bookings,
    loading,
    refreshing,
    hasMore,
    dateFilter,
    loadMore,
    refresh,
    initialLoad,
    applyDateFilter,
  } = useInfiniteScroll(getBookings, {
    service: 'packers',
    pageSize: 20,
  });

  useEffect(() => {
    initialLoad();
  }, []);

  const handleDateFilterApply = (startDate, endDate) => {
    applyDateFilter(startDate, endDate);
  };

  const hasActiveFilter = dateFilter.start || dateFilter.end;

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_PAYMENT: { label: 'Payment Pending', color: C.orange },
      PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: C.orange },
      ADVANCE_PAID: { label: 'Advance Paid', color: C.green },
      CONFIRMED: { label: 'Confirmed', color: C.green },
      BROADCASTED: { label: 'Broadcasted', color: C.blue },
      PENDING_VENDOR: { label: 'Pending', color: C.orange },
      ACCEPTED: { label: 'Accepted', color: C.green },
      VEHICLE_ASSIGNED: { label: 'Team Assigned', color: C.blue },
      TEAM_ASSIGNED: { label: 'Team Assigned', color: C.blue },
      PACKING: { label: 'Packing', color: '#9333EA' },
      LOADING: { label: 'Loading', color: '#9333EA' },
      IN_TRANSIT: { label: 'In Transit', color: '#9333EA' },
      UNLOADING: { label: 'Unloading', color: '#9333EA' },
      UNPACKING: { label: 'Unpacking', color: '#9333EA' },
      IN_PROGRESS: { label: 'In Progress', color: '#9333EA' },
      COMPLETED: { label: 'Completed', color: '#059669' },
      CANCELLED: { label: 'Cancelled', color: C.red },
    };
    return statusConfig[status] || { label: status, color: C.muted };
  };

  const renderBooking = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PackersBookingDetail', {
          bookingId: item.id,
          serviceType: 'packers',
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="user" size={16} color={C.muted} />
            <Text style={styles.infoText}>{item.customerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="map-pin" size={16} color={C.muted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.pickupCity} → {item.dropCity || 'Local'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color={C.muted} />
            <Text style={styles.infoText}>
              {new Date(item.scheduledDate).toLocaleDateString('en-IN')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>₹{item.grandTotal || item.totalAmount}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={C.muted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Packers & Movers Bookings</Text>
        <TouchableOpacity
          onPress={() => setShowDateFilter(true)}
          style={styles.filterButton}
        >
          {hasActiveFilter && <View style={styles.activeFilterDot} />}
          <Icon name="calendar" size={22} color={C.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.brand]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (loading && bookings.length > 0) {
            return (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={C.brand} />
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="inbox" size={48} color={C.muted} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : null
        }
      />

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={handleDateFilterApply}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: C.brand,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: C.muted,
    marginTop: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.brand,
    zIndex: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

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

export default function LuxuryBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter, setShowDateFilter] = useState(false);

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
    clearDateFilter,
  } = useInfiniteScroll(getBookings, {
    service: 'luxury',
    type: filter,
  });

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_PAYMENT: { label: 'Payment Pending', color: C.orange },
      PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: C.orange },
      ADVANCE_PAID: { label: 'Advance Paid', color: C.green },
      CONFIRMED: { label: 'Confirmed', color: C.green },
      DRIVER_ASSIGNED: { label: 'Driver Assigned', color: C.green },
      IN_PROGRESS: { label: 'In Progress', color: '#8B5CF6' },
      COMPLETED: { label: 'Completed', color: '#059669' },
      CANCELLED: { label: 'Cancelled', color: C.red },
    };
    return statusConfig[status] || { label: status, color: C.muted };
  };

  const handleItemPress = (item) => {
    // Navigate to booking detail (only bookings are shown now)
    navigation.navigate('LuxuryBookingDetail', {
      bookingId: item.id,
      serviceType: 'luxury',
    });
  };

  const renderBooking = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleItemPress(item)}
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
              {new Date(item.pickupDate).toLocaleDateString('en-IN')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>
                ₹{item.totalAmount ? item.totalAmount.toLocaleString('en-IN') : '0'}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={C.muted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luxury Bookings</Text>
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
              <Text style={styles.emptyText}>No bookings found</Text>
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
  },
});

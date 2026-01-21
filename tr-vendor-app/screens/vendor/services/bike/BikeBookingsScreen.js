import React, { useState, useEffect, useCallback } from 'react';
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

export default function BikeBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('active'); // 'active' or 'completed'

  const fetchBookings = useCallback(async () => {
    try {
      const response = await getBookings('bike', filter);
      if (response.success) {
        setAllBookings(response.bookings || []);
        filterBookings(response.bookings || [], selectedFilter);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, selectedFilter]);

  const filterBookings = (bookingsList, filterType) => {
    if (filterType === 'completed') {
      setBookings(bookingsList.filter(b => b.status === 'COMPLETED'));
    } else {
      // Active - all non-completed bookings
      setBookings(bookingsList.filter(b => b.status !== 'COMPLETED'));
    }
  };

  const handleFilterChange = (filterType) => {
    setSelectedFilter(filterType);
    filterBookings(allBookings, filterType);
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_PAYMENT: { label: 'Payment Pending', color: C.orange },
      PAYMENT_VERIFIED: { label: 'Payment Verified', color: C.green },
      BROADCASTED: { label: 'Broadcasted', color: C.blue },
      PENDING_VENDOR: { label: 'Pending', color: C.orange },
      ACCEPTED: { label: 'Accepted', color: C.green },
      CONFIRMED: { label: 'Confirmed', color: C.green },
      READY_FOR_PICKUP: { label: 'Ready for Pickup', color: '#0891B2' },
      IN_PROGRESS: { label: 'In Progress', color: '#8B5CF6' },
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
        onPress={() => navigation.navigate('BikeBookingDetail', {
          bookingId: item.id,
          serviceType: 'bike',
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
              {item.locationName || item.pickupCity || 'N/A'}
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
        <Text style={styles.headerTitle}>Bike Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'active' && styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange('active')}
        >
          <Icon
            name="activity"
            size={16}
            color={selectedFilter === 'active' ? '#fff' : C.muted}
          />
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === 'active' && styles.filterTabTextActive,
            ]}
          >
            Active
          </Text>
          <View style={[
            styles.filterBadge,
            selectedFilter === 'active' && styles.filterBadgeActive,
          ]}>
            <Text style={[
              styles.filterBadgeText,
              selectedFilter === 'active' && styles.filterBadgeTextActive,
            ]}>
              {allBookings.filter(b => b.status !== 'COMPLETED').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange('completed')}
        >
          <Icon
            name="check-circle"
            size={16}
            color={selectedFilter === 'completed' ? '#fff' : C.muted}
          />
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Completed
          </Text>
          <View style={[
            styles.filterBadge,
            selectedFilter === 'completed' && styles.filterBadgeActive,
          ]}>
            <Text style={[
              styles.filterBadgeText,
              selectedFilter === 'completed' && styles.filterBadgeTextActive,
            ]}>
              {allBookings.filter(b => b.status === 'COMPLETED').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="inbox" size={48} color={C.muted} />
            <Text style={styles.emptyText}>
              {selectedFilter === 'completed' ? 'No completed bookings' : 'No active bookings'}
            </Text>
          </View>
        }
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
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterTabActive: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.muted,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
  },
  filterBadgeTextActive: {
    color: '#fff',
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
});

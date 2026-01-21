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

export default function CarRentalBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await getBookings('car', filter);
      if (response.success) {
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

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
      BROADCASTED: { label: 'Broadcasted', color: C.blue },
      PENDING_VENDOR: { label: 'Pending', color: C.orange },
      ACCEPTED: { label: 'Accepted', color: C.green },
      DRIVER_ASSIGNED: { label: 'Driver Assigned', color: C.blue },
      IN_PROGRESS: { label: 'In Progress', color: C.green },
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
        onPress={() => navigation.navigate('CarRentalBookingDetail', {
          bookingId: item.id,
          serviceType: 'car',
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
        <Text style={styles.headerTitle}>Car Rental Bookings</Text>
        <View style={{ width: 40 }} />
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
            <Text style={styles.emptyText}>No bookings found</Text>
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

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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getBookings } from '../../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

export default function CarRentalCompletedTodayScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      // Fetch all bookings and filter completed ones from today
      const response = await getBookings('car', null);
      if (response.success) {
        const allBookings = response.bookings || [];
        const today = new Date().toDateString();

        // Filter only completed bookings from today
        const completedToday = allBookings.filter(booking => {
          if (booking.status !== 'COMPLETED') return false;

          // Check if completed today using tripEndedAt (car rental specific field)
          const completedDate = booking.tripEndedAt || booking.updatedAt;
          if (!completedDate) return false;

          return new Date(completedDate).toDateString() === today;
        });

        // Sort by completion time (most recent first)
        completedToday.sort((a, b) => {
          const dateA = new Date(a.tripEndedAt || a.updatedAt);
          const dateB = new Date(b.tripEndedAt || b.updatedAt);
          return dateB - dateA;
        });

        setBookings(completedToday);
      }
    } catch (error) {
      console.error('Failed to fetch completed bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderBooking = ({ item }) => {
    const completedTime = formatTime(item.tripEndedAt || item.updatedAt);
    const pickupDate = formatDate(item.pickupDate);
    const dropDate = formatDate(item.dropDate || item.returnDate);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CarRentalBookingDetail', {
          bookingId: item.id,
          serviceType: 'car',
        })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={C.green} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          </View>
          <View style={styles.timeBox}>
            <Icon name="clock" size={12} color={C.purple} />
            <Text style={styles.completedTime}>{completedTime}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Customer Info */}
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={18} color={C.muted} />
            <Text style={styles.infoText}>{item.customerName}</Text>
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.locationBox}>
              <Icon name="circle" size={10} color={C.green} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.pickupCity}
              </Text>
            </View>
            <Icon name="arrow-right" size={14} color={C.muted} />
            <View style={styles.locationBox}>
              <Icon name="circle" size={10} color={C.red} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.dropCity || 'Local'}
              </Text>
            </View>
          </View>

          {/* Trip Duration */}
          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color={C.muted} />
            <Text style={styles.infoText}>
              {pickupDate} - {dropDate}
            </Text>
          </View>

          {/* Driver Info (if available) */}
          {item.driverName && (
            <View style={styles.driverBox}>
              <Ionicons name="person" size={14} color={C.blue} />
              <Text style={styles.driverText}>Driver: {item.driverName}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Footer - Amount */}
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
        <ActivityIndicator size="large" color={C.purple} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Completed Today</Text>
          <Text style={styles.headerSubtitle}>
            {bookings.length} trip{bookings.length !== 1 ? 's' : ''} completed
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Date Banner */}
      <View style={styles.dateBanner}>
        <Ionicons name="calendar-outline" size={18} color={C.purple} />
        <Text style={styles.dateBannerText}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.purple]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color={C.muted} />
            <Text style={styles.emptyTitle}>No Trips Completed Today</Text>
            <Text style={styles.emptyText}>
              Completed trips will appear here when they are finished
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  dateBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.purple,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bookingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.green,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedTime: {
    fontSize: 12,
    fontWeight: '600',
    color: C.purple,
  },
  cardBody: {
    gap: 10,
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
    borderRadius: 10,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    flex: 1,
  },
  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  driverText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.blue,
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
    color: C.purple,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

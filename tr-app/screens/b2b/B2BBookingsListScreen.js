import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Dimensions, Platform,} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { b2bService } from '../services';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'OPEN_FOR_QUOTES', label: 'Open' },
  { value: 'QUOTES_RECEIVED', label: 'Quoted' },
  { value: 'SUPER_QUOTE_SENT', label: 'Quote Sent' },
  { value: 'TRIPS_CREATED', label: 'Trips' },
  { value: 'IN_PROGRESS', label: 'Active' },
  { value: 'COMPLETED', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SERVICES = [
  { value: 'all', label: 'All', icon: 'layers', color: '#6366F1' },
  { value: 'car', label: 'Car', icon: 'truck', color: '#3B82F6' },
  { value: 'bus', label: 'Bus', icon: 'navigation', color: '#F59E0B' },
  { value: 'self-drive', label: 'Self-Drive', icon: 'key', color: '#10B981' },
  { value: 'luxury', label: 'Luxury', icon: 'star', color: '#A855F7' },
];

const STATUS_COLORS = {
  OPEN_FOR_QUOTES: '#F59E0B', QUOTES_RECEIVED: '#3B82F6', SUPER_QUOTE_SENT: '#8B5CF6',
  CONFIRMED: '#10B981', TRIPS_CREATED: '#06B6D4', IN_PROGRESS: '#F97316',
  COMPLETED: '#22C55E', INVOICED: '#6366F1', PAID: '#059669', CANCELLED: '#EF4444', DROPPED: '#EF4444',
};

export default function B2BBookingsListScreen({ navigation, route }) {
  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState(route?.params?.filterStatus || 'all');
  const [serviceFilter, setServiceFilter] = useState(route?.params?.filterService || 'all');

  const loadBookings = useCallback(async () => {
    try {
      const params = {};
      if (activeFilter !== 'all') params.status = activeFilter;
      if (serviceFilter !== 'all') params.serviceType = serviceFilter;
      const res = await b2bService.getBookings(params);
      setBookings(res?.bookings || []);
    } catch (err) {
      console.log('Load bookings error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, serviceFilter]);

  useEffect(() => { setLoading(true); loadBookings(); }, [loadBookings]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderBooking = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || '#999';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('B2BBookingDetail', { bookingId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.bookingNum}>{item.bookingNumber}</Text>
            <Text style={styles.serviceType}>{item.serviceType?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Icon name="map-pin" size={scale(14)} color="#22C55E" />
            <Text style={styles.detailText} numberOfLines={1}>{item.pickupLocation}</Text>
          </View>
          {item.dropLocation && (
            <View style={styles.detailRow}>
              <Icon name="map-pin" size={scale(14)} color="#EF4444" />
              <Text style={styles.detailText} numberOfLines={1}>{item.dropLocation}</Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <View style={styles.detailRow}>
              <Icon name="calendar" size={scale(13)} color="#666" />
              <Text style={styles.footerText}>{formatDate(item.scheduledDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="truck" size={scale(13)} color="#666" />
              <Text style={styles.footerText}>{item.vehiclesRequired} vehicle(s)</Text>
            </View>
            {item.finalAmount > 0 && (
              <Text style={styles.amount}>Rs. {item.finalAmount?.toLocaleString('en-IN')}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B2B Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('B2BCreateBooking')}>
          <Icon name="plus-circle" size={scale(24)} color="#22C55E" />
        </TouchableOpacity>
      </View>

      {/* Service Filter */}
      <View style={styles.serviceFilterContainer}>
        <FlatList
          data={SERVICES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = serviceFilter === item.value;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.serviceTab,
                  isActive && { backgroundColor: item.color, borderColor: item.color },
                ]}
                onPress={() => { setServiceFilter(item.value); setLoading(true); }}
              >
                <Icon name={item.icon} size={scale(13)} color={isActive ? '#fff' : item.color} />
                <Text style={[styles.serviceTabText, isActive && styles.serviceTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          data={STATUSES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === item.value && styles.filterTabActive]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} colors={['#22C55E']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={scale(50)} color="#ddd" />
              <Text style={styles.emptyText}>No bookings found</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('B2BCreateBooking')}>
                <Text style={styles.emptyBtnText}>Create Booking</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
   paddingBottom: scale(20),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(18), fontWeight: '700', color: '#1A1A1A' },
  serviceFilterContainer: { backgroundColor: '#fff', paddingVertical: scale(10), borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  serviceTab: {
    flexDirection: 'row', alignItems: 'center', gap: scale(5),
    paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20),
    marginHorizontal: scale(4), backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  serviceTabText: { fontSize: scale(12), fontWeight: '600', color: '#555' },
  serviceTabTextActive: { color: '#fff' },
  filterContainer: { backgroundColor: '#fff', paddingVertical: scale(10), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterList: { paddingHorizontal: scale(12) },
  filterTab: {
    paddingHorizontal: scale(16), paddingVertical: scale(8), borderRadius: scale(20),
    marginHorizontal: scale(4), backgroundColor: '#F3F4F6',
  },
  filterTabActive: { backgroundColor: '#22C55E' },
  filterText: { fontSize: scale(12), fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: scale(16), paddingBottom: scale(100) },
  card: {
    backgroundColor: '#fff', borderRadius: scale(14), padding: scale(14),
    marginBottom: scale(12), elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(10) },
  bookingNum: { fontSize: scale(15), fontWeight: '700', color: '#1A1A1A' },
  serviceType: { fontSize: scale(11), color: '#666', marginTop: scale(2), fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(10),
    paddingVertical: scale(4), borderRadius: scale(20), gap: scale(4),
  },
  statusDot: { width: scale(6), height: scale(6), borderRadius: scale(3) },
  statusText: { fontSize: scale(10), fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { gap: scale(6) },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  detailText: { fontSize: scale(13), color: '#444', flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scale(6), paddingTop: scale(8), borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  footerText: { fontSize: scale(11), color: '#888' },
  amount: { fontSize: scale(14), fontWeight: '700', color: '#22C55E' },
  emptyContainer: { alignItems: 'center', paddingTop: scale(80) },
  emptyText: { fontSize: scale(15), color: '#999', marginTop: scale(12) },
  emptyBtn: { marginTop: scale(16), backgroundColor: '#22C55E', paddingHorizontal: scale(24), paddingVertical: scale(10), borderRadius: scale(10) },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: scale(13) },
});

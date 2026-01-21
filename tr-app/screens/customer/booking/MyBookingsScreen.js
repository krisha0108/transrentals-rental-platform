// screens/customer/booking/MyBookingsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const DARK_GREEN = '#0B6E4F';
const BG = '#F5F7F6';

// Service types with icons and colors
const SERVICES = [
  { key: 'all', label: 'All', icon: 'apps', color: GREEN },
  { key: 'luxury', label: 'Luxury Car', icon: 'diamond', color: '#F59E0B' },
  { key: 'self-drive', label: 'Self Drive', icon: 'car-sport', color: '#3498db' },
  { key: 'bike', label: 'Bike', icon: 'bicycle', color: '#e74c3c' },
  { key: 'bus', label: 'Bus', icon: 'bus', color: '#9b59b6' },
  { key: 'truck', label: 'Truck', icon: 'truck', iconLib: 'MaterialCommunityIcons', color: '#f39c12' },
  { key: 'tempo', label: 'Tempo', icon: 'van-shuttle', iconLib: 'MaterialCommunityIcons', color: '#1abc9c' },
  { key: 'car', label: 'Car Rental', icon: 'car', color: '#34495e' },
];

// Status filters
const STATUSES = [
  { key: 'all', label: 'All', color: '#666' },
  { key: 'pending', label: 'Pending', color: '#f39c12' },
  { key: 'confirmed', label: 'Confirmed', color: GREEN },
  { key: 'in_progress', label: 'In Progress', color: '#3498db' },
  { key: 'completed', label: 'Completed', color: '#27ae60' },
  { key: 'cancelled', label: 'Cancelled', color: '#e74c3c' },
];

const MyBookingsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [customerId, setCustomerId] = useState(null);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [customerPhone, setCustomerPhone] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  // Load customer data on mount
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const customerData = await AsyncStorage.getItem('customer');
        if (customerData) {
          const customer = JSON.parse(customerData);
          setCustomerId(customer.id);
          setCustomerEmail(customer.email);
          setCustomerPhone(customer.phone);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
        setLoading(false);
      }
    };
    loadCustomer();
  }, []);

  const fetchAllBookings = useCallback(async () => {
    if (!customerId && !customerPhone && !customerEmail) return;

    setLoading(true);
    try {
      // Use the unified customer bookings endpoint
      const identifier = customerPhone || customerEmail;
      const response = await api.get(`/customer/bookings?identifier=${identifier}&customer_id=${customerId || ''}&status=All`);

      if (response.data?.success && response.data?.bookings) {
        const transformed = response.data.bookings.map(b => {
          let serviceIcon = 'car';
          let serviceColor = '#34495e';

          // Map unified service types to UI icons/colors
          switch (b.service_type) {
            case 'bike':
              serviceIcon = 'bicycle';
              serviceColor = '#e74c3c';
              break;
            case 'car':
              serviceIcon = 'car-sport';
              serviceColor = '#3498db';
              break;
            case 'luxury':
              serviceIcon = 'diamond';
              serviceColor = '#F59E0B';
              break;
            case 'bus':
              serviceIcon = 'bus';
              serviceColor = '#9b59b6';
              break;
            case 'truck':
              serviceIcon = 'truck';
              serviceColor = '#f39c12';
              break;
            case 'chauffeur':
              serviceIcon = 'car';
              serviceColor = '#34495e';
              break;
            case 'packers':
              serviceIcon = 'vignette';
              serviceColor = '#1abc9c';
              break;
            case 'equipment':
              serviceIcon = 'construct';
              serviceColor = '#7f8c8d';
              break;
            default:
              serviceIcon = 'apps';
              serviceColor = GREEN;
          }

          return {
            ...b,
            id: b.id,
            serviceType: b.service_type === 'car' ? 'self-drive' : (b.service_type === 'chauffeur' ? 'car' : b.service_type),
            serviceName: b.service_name,
            serviceIcon,
            serviceColor,
            displayName: b.vehicle_name || b.service_name || 'Rental',
            displayDate: b.journey_datetime,
            displayLocation: b.location_name,
            grandTotal: b.total_amount,
            status: b.status,
          };
        });

        setAllBookings(transformed);

        // Calculate stats
        const activeCount = transformed.filter(b =>
          ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'BROADCASTED', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'ONGOING'].includes(b.status?.toUpperCase())
        ).length;

        const completedCount = transformed.filter(b =>
          ['COMPLETED'].includes(b.status?.toUpperCase())
        ).length;

        setStats({
          total: transformed.length,
          active: activeCount,
          completed: completedCount,
        });
      } else {
        setAllBookings([]);
        setStats({ total: 0, active: 0, completed: 0 });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to empty state
      setAllBookings([]);
      setStats({ total: 0, active: 0, completed: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, customerPhone, customerEmail]);

  // Refresh on focus - fetch bookings when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (customerId && (customerPhone || customerEmail)) {
        fetchAllBookings();
      }
    }, [customerId, customerPhone, customerEmail, fetchAllBookings])
  );

  // Filter bookings when filters change
  useEffect(() => {
    let filtered = [...allBookings];

    // Filter by service
    if (selectedService !== 'all') {
      filtered = filtered.filter(b => b.serviceType === selectedService);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      const statusMap = {
        pending: ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'BROADCASTED', 'PENDING_VENDOR'],
        confirmed: ['ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP'],
        in_progress: ['IN_PROGRESS'],
        completed: ['COMPLETED'],
        cancelled: ['CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED'],
      };
      const targetStatuses = statusMap[selectedStatus] || [];
      filtered = filtered.filter(b => targetStatuses.includes(b.status?.toUpperCase()));
    }

    setFilteredBookings(filtered);
  }, [allBookings, selectedService, selectedStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllBookings();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusStyle = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    if (['COMPLETED'].includes(upperStatus)) {
      return { bg: '#e8f5e9', text: '#27ae60', label: 'Completed' };
    }
    if (['IN_PROGRESS'].includes(upperStatus)) {
      return { bg: '#e3f2fd', text: '#2196f3', label: 'In Progress' };
    }
    if (['ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP'].includes(upperStatus)) {
      return { bg: '#e0f2f1', text: GREEN, label: 'Confirmed' };
    }
    if (['PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'BROADCASTED', 'PENDING_VENDOR'].includes(upperStatus)) {
      return { bg: '#fff3e0', text: '#f57c00', label: 'Pending' };
    }
    if (['CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED'].includes(upperStatus)) {
      return { bg: '#ffebee', text: '#e53935', label: 'Cancelled' };
    }
    return { bg: '#f5f5f5', text: '#666', label: status || 'Unknown' };
  };

  const handleBookingPress = (booking) => {
    if (booking.serviceType === 'self-drive') {
      navigation.navigate('SelfDriveBookingDetail', { bookingId: booking.id });
    } else if (booking.serviceType === 'bike') {
      navigation.navigate('BikeBookingDetail', { bookingId: booking.id });
    } else if (booking.serviceType === 'luxury') {
      // Check if it's a quote request or actual booking
      if (booking.is_quote_request) {
        // Navigate to quote detail screen where customer can view and accept quotes
        navigation.navigate('LuxuryQuoteDetail', { requestId: booking.id });
      } else {
        // Navigate to booking detail screen
        navigation.navigate('LuxuryBookingDetail', { bookingId: booking.id });
      }
    } else if (booking.serviceType === 'bus') {
      if (booking.is_quote_request) {
        navigation.navigate('BusQuoteRequestDetail', { requestId: booking.id });
      } else {
        navigation.navigate('BusBookingDetail', { bookingId: booking.id });
      }
    } else if (booking.serviceType === 'truck') {
      if (booking.is_quote_request) {
        navigation.navigate('TruckQuoteRequestDetail', { requestId: booking.id });
      } else {
        navigation.navigate('TruckBookingDetail', { bookingId: booking.id });
      }
    } else if (booking.serviceType === 'packers') {
      if (booking.is_quote_request) {
        navigation.navigate('PackersQuoteRequestDetail', { requestId: booking.id });
      } else {
        navigation.navigate('PackersBookingDetail', { bookingId: booking.id });
      }
    } else if (booking.serviceType === 'equipment') {
      if (booking.is_quote_request) {
        navigation.navigate('EquipmentQuoteRequestDetail', { requestId: booking.id });
      } else {
        navigation.navigate('EquipmentBookingDetail', { bookingId: booking.id });
      }
    } else if (booking.serviceType === 'car') {
      navigation.navigate('BookingDetail', {
        bookingId: booking.bookingNumber || booking.id,
        bookingType: 'car'
      });
    } else {
      navigation.navigate('BookingDetail', { bookingId: booking.id });
    }
  };

  const renderServiceIcon = (iconName, iconLib, color, size = 18) => {
    if (iconLib === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    }
    return <Ionicons name={iconName} size={size} color={color} />;
  };

  const renderBookingCard = (booking, index) => {
    const statusStyle = getStatusStyle(booking.status);

    return (
      <TouchableOpacity
        key={`${booking.id}-${index}`}
        style={styles.bookingCard}
        activeOpacity={0.9}
        onPress={() => handleBookingPress(booking)}
      >
        {/* Service Badge */}
        <View style={[styles.serviceBadge, { backgroundColor: booking.serviceColor }]}>
          {renderServiceIcon(booking.serviceIcon, null, '#fff', 14)}
          <Text style={styles.serviceBadgeText}>{booking.serviceName}</Text>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Left - Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: `${booking.serviceColor}15` }]}>
            {renderServiceIcon(booking.serviceIcon, null, booking.serviceColor, 28)}
          </View>

          {/* Middle - Details */}
          <View style={styles.cardDetails}>
            <Text style={styles.bookingName} numberOfLines={1}>
              {booking.displayName}
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="receipt-outline" size={13} color="#888" />
              <Text style={styles.infoText}>#{booking.bookingNumber || booking.id?.slice(-8)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={13} color="#888" />
              <Text style={styles.infoText}>{formatDate(booking.displayDate)}</Text>
            </View>

            {booking.displayLocation && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={13} color="#888" />
                <Text style={styles.infoText} numberOfLines={1}>{booking.displayLocation}</Text>
              </View>
            )}
          </View>

          {/* Right - Status & Arrow */}
          <View style={styles.cardRight}>
            <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={18} color={GREEN} />
            </View>
          </View>
        </View>

        {/* Bottom Strip */}
        <View style={styles.cardStrip}>
          <View style={styles.stripItem}>
            <Text style={styles.stripLabel}>Total</Text>
            <Text style={styles.stripValue}>₹{booking.grandTotal || booking.total_amount || '-'}</Text>
          </View>
          {booking.totalDays && (
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>Duration</Text>
              <Text style={styles.stripValue}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
            </View>
          )}
          {booking.vendor && (
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>Vendor</Text>
              <Text style={styles.stripValue} numberOfLines={1}>{booking.vendor.name || 'Assigned'}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="car-outline" size={60} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No Bookings Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedService !== 'all' || selectedStatus !== 'all'
          ? 'Try changing the filters to see more bookings'
          : 'Your rental bookings will appear here'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="search-outline" size={18} color="#fff" />
        <Text style={styles.exploreBtnText}>Explore Rentals</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[GREEN, DARK_GREEN]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>All your rentals in one place</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        {loading ? (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statLabel}>Loading...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMiddle]}>
              <Text style={styles.statNumber}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Service Filter */}
      {!loading && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Service Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {SERVICES.map((service) => {
              const isActive = selectedService === service.key;
              return (
                <TouchableOpacity
                  key={service.key}
                  style={[
                    styles.serviceChip,
                    isActive && { backgroundColor: service.color, borderColor: service.color },
                  ]}
                  onPress={() => setSelectedService(service.key)}
                >
                  {renderServiceIcon(
                    service.icon,
                    service.iconLib,
                    isActive ? '#fff' : service.color,
                    16
                  )}
                  <Text style={[styles.serviceChipText, isActive && { color: '#fff' }]}>
                    {service.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Status Filter */}
      {!loading && (
        <View style={styles.statusFilterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {STATUSES.map((status) => {
              const isActive = selectedStatus === status.key;
            return (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusFilterChip,
                  isActive && { backgroundColor: status.color, borderColor: status.color },
                ]}
                onPress={() => setSelectedStatus(status.key)}
              >
                <View style={[styles.statusDot, { backgroundColor: isActive ? '#fff' : status.color }]} />
                <Text style={[styles.statusFilterText, isActive && { color: '#fff' }]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      )}

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        contentContainerStyle={styles.bookingsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredBookings.length} Booking{filteredBookings.length !== 1 ? 's' : ''} Found
            </Text>
            {filteredBookings.map((booking, index) => renderBookingCard(booking, index))}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statCardMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Filters
  filterSection: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  serviceChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  // Status Filter
  statusFilterSection: {
    paddingBottom: 12,
  },
  statusFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  // Bookings List
  bookingsList: {
    flex: 1,
  },
  bookingsContent: {
    padding: 16,
    paddingTop: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 12,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomRightRadius: 12,
    gap: 5,
  },
  serviceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 14,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card Strip
  cardStrip: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stripItem: {
    flex: 1,
  },
  stripLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  stripValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

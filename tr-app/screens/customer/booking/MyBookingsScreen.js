// screens/customer/booking/MyBookingsScreen.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api, { BASE_URL } from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';
import { useTravelAgent } from '../../../utils/isTravelAgent';

// Service types with icons and colors
const SERVICES = [
  { key: 'all', label: 'All', icon: 'apps', color: TEAL },
  { key: 'bulk', label: 'Bulk Event', icon: 'party-popper', iconLib: 'MaterialCommunityIcons', color: '#7C3AED' },
  { key: 'luxury', label: 'Luxury Car', icon: 'diamond', color: '#F59E0B' },
  { key: 'self-drive', label: 'Self Drive', icon: 'car-sport', color: '#3498db' },
  { key: 'bike', label: 'Bike', icon: 'bicycle', color: '#e74c3c' },
  { key: 'bus', label: 'Bus', icon: 'bus', color: '#9b59b6' },
  { key: 'truck', label: 'Truck', icon: 'truck', iconLib: 'MaterialCommunityIcons', color: '#f39c12' },
  { key: 'equipment', label: 'Equipment', icon: 'construct', iconLib: 'Ionicons', color: '#7f8c8d' },
  { key: 'packers', label: 'Packers', icon: 'package-variant-closed', iconLib: 'MaterialCommunityIcons', color: '#1abc9c' },
  { key: 'tempo', label: 'Tempo', icon: 'van-utility', iconLib: 'MaterialCommunityIcons', color: '#16a085' },
  { key: 'car', label: 'Car Rental', icon: 'car', color: '#34495e' },
];

// Status filters
const STATUSES = [
  { key: 'all', label: 'All', color: '#666' },
  { key: 'pending', label: 'Pending', color: '#f39c12' },
  { key: 'confirmed', label: 'Confirmed', color: TEAL },
  { key: 'in_progress', label: 'In Progress', color: '#3498db' },
  { key: 'completed', label: 'Completed', color: '#27ae60' },
  { key: 'cancelled', label: 'Cancelled', color: '#e74c3c' },
  { key: 'dropped', label: 'Dropped', color: '#e74c3c' },
];

const MyBookingsScreen = ({route}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState(null);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(route?.params?.filter || 'all');
  const [customerId, setCustomerId] = useState(null);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [customerPhone, setCustomerPhone] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [filterVisible, setFilterVisible] = useState(false);
  const [tempService, setTempService] = useState('all');
  const [tempStatus, setTempStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [showExpiredQuotesOnly, setShowExpiredQuotesOnly] = useState(false);
  const [tempExpiredOnly, setTempExpiredOnly] = useState(false);

  // Phase 7 — TA detection for "Company Bookings" entry banner
  const { isTravelAgent, customer: taCustomer } = useTravelAgent();
  const agencyName = taCustomer?.agencyName || taCustomer?.linkedTravelAgentName || '';

  // Update filter when navigating with new params
  useEffect(() => {
    if (route?.params?.filter) {
      setSelectedStatus(route.params.filter);
      setTempStatus(route.params.filter);
    }
  }, [route?.params?.filter, route?.params?.timestamp]);

  const activeFilterCount = (selectedService !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (showExpiredQuotesOnly ? 1 : 0);

  const openFilter = () => {
    setTempService(selectedService);
    setTempStatus(selectedStatus);
    setTempExpiredOnly(showExpiredQuotesOnly);
    setFilterVisible(true);
  };

  const applyFilters = () => {
    setSelectedService(tempService);
    setSelectedStatus(tempStatus);
    setShowExpiredQuotesOnly(tempExpiredOnly);
    setFilterVisible(false);
  };

  const resetFilters = () => {
    setTempService('all');
    setTempStatus('all');
    setTempExpiredOnly(false);
  };

  const clearAllFilters = () => {
    setSelectedService('all');
    setSelectedStatus('all');
    setShowExpiredQuotesOnly(false);
  };

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('light');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

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
          setAllBookings([]);
        }
      } catch (error) {
        console.log('Error loading customer:', error);
        setAllBookings([]);
      }
    };
    loadCustomer();
  }, []);

  // Fetch bookings once customer data is available
  useEffect(() => {
    if (customerId && (customerPhone || customerEmail)) {
      fetchAllBookings();
    }
  }, [customerId, customerPhone, customerEmail]);

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
          let iconLib = 'Ionicons';

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
              iconLib = 'MaterialCommunityIcons';
              break;
            case 'tempo':
              serviceIcon = 'van-utility';
              serviceColor = '#1abc9c';
              iconLib = 'MaterialCommunityIcons';
              break;
            case 'chauffeur':
              serviceIcon = 'car';
              serviceColor = '#34495e';
              break;
            case 'packers':
              serviceIcon = 'package-variant-closed';
              serviceColor = '#1abc9c';
              iconLib = 'MaterialCommunityIcons';
              break;
            case 'equipment':
              serviceIcon = 'toolbox';
              serviceColor = '#7f8c8d';
              iconLib = 'MaterialCommunityIcons';
              break;
            case 'bulk':
              // Multi-day event booking — purple accent, party-popper icon.
              serviceIcon = 'party-popper';
              serviceColor = '#7C3AED';
              iconLib = 'MaterialCommunityIcons';
              break;
            default:
              serviceIcon = 'apps';
              serviceColor = TEAL;
          }

          return {
            ...b,
            id: b.id,
            bookingNumber: b.booking_number || null,
            serviceType: b.service_type === 'car' ? 'self-drive' : (b.service_type === 'chauffeur' ? 'car' : b.service_type),
            serviceName: b.service_name,
            serviceIcon,
            serviceColor,
            iconLib,
            displayName: b.vehicle_name || b.service_name || 'Rental',
            displayDate: b.journey_datetime,
            displayLocation: b.location_name,
            grandTotal: b.total_amount,
            vehicleImage: b.vehicle_image || null,
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
      console.log('Error fetching bookings:', error);
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

  // Filter bookings - useMemo so it's always in sync (no frame delay)
  const filteredBookings = useMemo(() => {
    if (!allBookings) return [];
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
        dropped: ['DROPPED'],
      };
      const targetStatuses = statusMap[selectedStatus] || [];
      filtered = filtered.filter(b => targetStatuses.includes(b.status?.toUpperCase()));
    }

    // Filter by expired quotes
    if (showExpiredQuotesOnly) {
      filtered = filtered.filter(b => b.is_quote_request && b.all_quotes_expired);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(b =>
        b.displayName?.toLowerCase().includes(q) ||
        b.bookingNumber?.toLowerCase().includes(q) ||
        b.serviceName?.toLowerCase().includes(q) ||
        b.displayLocation?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [allBookings, selectedService, selectedStatus, showExpiredQuotesOnly, searchQuery]);

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
      return { bg: TEAL_LIGHT, text: TEAL_MID, label: 'Confirmed' };
    }
    if (['PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'BROADCASTED', 'PENDING_VENDOR'].includes(upperStatus)) {
      return { bg: '#fff3e0', text: '#f57c00', label: 'Pending' };
    }
    if (['CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED'].includes(upperStatus)) {
      return { bg: '#ffebee', text: '#e53935', label: 'Cancelled' };
    }
    if (['DROPPED'].includes(upperStatus)) {
      return { bg: '#ffebee', text: '#e53935', label: 'Dropped' };
    }
    return { bg: '#f5f5f5', text: '#666', label: status || 'Unknown' };
  };

  const handleBookingPress = (booking) => {
    if (booking.serviceType === 'self-drive') {
      if (booking.is_quote_request) {
        navigation.navigate('SelfDriveQuoteRequestDetail', { requestId: booking.id });
      } else {
        navigation.navigate('SelfDriveBookingDetail', { bookingId: booking.id });
      }
    } else if (booking.serviceType === 'bike') {
      if (booking.is_quote_request) {
        navigation.navigate('BikeQuoteRequestDetail', { requestId: booking.id });
      } else {
        navigation.navigate('BikeBookingDetail', { bookingId: booking.id });
      }
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
    } else if (booking.serviceType === 'bulk') {
      navigation.navigate('BulkBookingDetail', { bookingId: booking.id });
    } else {
      navigation.navigate('BookingDetail', { bookingId: booking.id });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
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
        {/* Top Row — Service Badge + Quote Count */}
        <View style={styles.cardTopRow}>
          <View style={[styles.serviceBadge, { backgroundColor: booking.serviceColor }]}>
            {renderServiceIcon(booking.serviceIcon, booking.iconLib, '#fff', 14)}
            <Text style={styles.serviceBadgeText}>{booking.serviceName}</Text>
          </View>
          {booking.is_quote_request && booking.quote_count > 0 && (
            <View style={styles.quoteBadge}>
              <Ionicons name="document-text" size={wp('3%')} color={TEAL_MID} />
              <Text style={styles.quoteBadgeText}>
                {booking.quote_count} {booking.quote_count === 1 ? 'Quote' : 'Quotes'}
              </Text>
            </View>
          )}
          {booking.is_quote_request && (!booking.quote_count || booking.quote_count === 0) && (
            <View style={[styles.quoteBadge, styles.quoteBadgeWaiting]}>
              <Ionicons name="time-outline" size={wp('3%')} color="#f57c00" />
              <Text style={[styles.quoteBadgeText, { color: '#f57c00' }]}>Awaiting Quotes</Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Left - Vehicle Image or Icon Circle */}
          {booking.vehicleImage ? (
            <View style={styles.vehicleImageWrap}>
              <Image
                source={{ uri: getImageUrl(booking.vehicleImage) }}
                style={styles.vehicleImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: `${booking.serviceColor}15` }]}>
              {renderServiceIcon(booking.serviceIcon, booking.iconLib, booking.serviceColor, 28)}
            </View>
          )}

          {/* Middle - Details */}
          <View style={styles.cardDetails}>
            <Text style={styles.bookingName} numberOfLines={1}>
              {booking.displayName}
            </Text>

            {booking.grandTotal && !(booking.is_quote_request && !booking.grandTotal) ? (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={13} color="#888" />
                <Text style={styles.infoText}>₹{Number(booking.grandTotal).toLocaleString('en-IN')}</Text>
              </View>
            ) : booking.bookingNumber ? (
              <View style={styles.infoRow}>
                <Ionicons name="receipt-outline" size={13} color="#888" />
                <Text style={styles.infoText}>#{booking.bookingNumber}</Text>
              </View>
            ) : null}

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
              <Ionicons name="chevron-forward" size={18} color={TEAL} />
            </View>
          </View>
        </View>

        {/* Bottom Strip */}
        <View style={styles.cardStrip}>
          {(booking.grandTotal || booking.total_amount) ? (
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>Total</Text>
              <Text style={styles.stripValue}>₹{Number(booking.grandTotal || booking.total_amount).toLocaleString('en-IN')}</Text>
            </View>
          ) : null}
          {booking.totalDays > 0 && (
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
        <Ionicons name={searchQuery.trim() ? 'search-outline' : 'car-outline'} size={wp('12%')} color={TEAL} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'No Results Found' : 'No Bookings Found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery.trim()
          ? `No bookings match "${searchQuery.trim()}"`
          : selectedService !== 'all' || selectedStatus !== 'all'
          ? 'Try changing the filters to see more bookings'
          : 'Your rental bookings will appear here'}
      </Text>
      {searchQuery.trim() ? (
        <TouchableOpacity style={styles.exploreBtn} onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle-outline" size={18} color="#fff" />
          <Text style={styles.exploreBtnText}>Clear Search</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="search-outline" size={18} color="#fff" />
          <Text style={styles.exploreBtnText}>Explore Rentals</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={[styles.decoCircle, { width: wp('35%'), height: wp('35%'), top: -wp('10%'), right: -wp('5%') }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { width: wp('25%'), height: wp('25%'), bottom: -wp('8%'), left: -wp('8%') }]} pointerEvents="none" />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>All your rentals in one place</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.headerIconBtn, searchVisible && styles.headerIconBtnActive]}
              onPress={() => {
                setSearchVisible(v => !v);
                if (searchVisible) setSearchQuery('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={searchVisible ? 'close' : 'search-outline'} size={wp('4.5%')} color="#fff" />
              {searchQuery.length > 0 && !searchVisible && (
                <View style={styles.filterBadge}>
                  <View style={styles.filterBadgeDot} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconBtn, activeFilterCount > 0 && styles.headerIconBtnActive]}
              onPress={openFilter}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={wp('4.5%')} color="#fff" />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={wp('4.5%')} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        {(loading || allBookings === null) ? (
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
        </SafeAreaView>
      </LinearGradient>

      {/* Search Bar */}
      {searchVisible && (
        <View style={[styles.searchBarWrap, searchFocused && styles.searchBarWrapFocused]}>
          <Ionicons name="search-outline" size={wp('4.5%')} color={searchFocused ? TEAL : TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by vehicle, booking #, location..."
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={wp('4.5%')} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Active Filter Chips */}
      {!loading && activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {selectedService !== 'all' && (() => {
            const svc = SERVICES.find(s => s.key === selectedService);
            return (
              <View style={[styles.activeChip, { borderColor: `${svc?.color}40` }]}>
                {renderServiceIcon(svc?.icon, svc?.iconLib, svc?.color, wp('3.2%'))}
                <Text style={[styles.activeChipText, { color: svc?.color }]}>{svc?.label}</Text>
                <TouchableOpacity onPress={() => setSelectedService('all')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={wp('3.8%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
            );
          })()}
          {selectedStatus !== 'all' && (() => {
            const sts = STATUSES.find(s => s.key === selectedStatus);
            return (
              <View style={[styles.activeChip, { borderColor: `${sts?.color}40` }]}>
                <View style={[styles.activeChipDot, { backgroundColor: sts?.color }]} />
                <Text style={[styles.activeChipText, { color: sts?.color }]}>{sts?.label}</Text>
                <TouchableOpacity onPress={() => setSelectedStatus('all')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={wp('3.8%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
            );
          })()}
          {showExpiredQuotesOnly && (
            <View style={[styles.activeChip, { borderColor: '#FECACA' }]}>
              <Ionicons name="close-circle-outline" size={wp('3.2%')} color="#EF4444" />
              <Text style={[styles.activeChipText, { color: '#EF4444' }]}>Expired Quotes</Text>
              <TouchableOpacity onPress={() => setShowExpiredQuotesOnly(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={wp('3.8%')} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Phase 7 — Travel-Agent banner: cross-link to company bookings list. */}
      {isTravelAgent && (
        <TouchableOpacity
          style={styles.taBanner}
          onPress={() => navigation.navigate('B2BBookingsList')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#4F46E5', '#059669']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.taBannerInner}
          >
            <View style={styles.taBannerIcon}>
              <Ionicons name="briefcase" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.taBannerTitle} numberOfLines={1}>
                Company Bookings {agencyName ? `· ${agencyName}` : ''}
              </Text>
              <Text style={styles.taBannerSub} numberOfLines={1}>
                B2B requests submitted as a travel agent
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        contentContainerStyle={styles.bookingsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
      >
        {(loading || allBookings === null) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={TEAL} />
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
      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setFilterVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.modalHandleWrap}>
              <View style={styles.modalHandle} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="options" size={wp('5%')} color={TEAL_MID} />
                <Text style={styles.modalTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Ionicons name="refresh-outline" size={wp('3.5%')} color={TEAL} />
                <Text style={styles.resetText}>Reset All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Service Type Section */}
              <Text style={styles.sectionTitle}>Service Type</Text>
              <View style={styles.serviceGrid}>
                {SERVICES.map((service) => {
                  const isActive = tempService === service.key;
                  return (
                    <TouchableOpacity
                      key={service.key}
                      style={[
                        styles.serviceGridItem,
                        isActive && { borderColor: service.color, backgroundColor: `${service.color}08` },
                      ]}
                      onPress={() => setTempService(service.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.serviceGridIcon,
                        { backgroundColor: isActive ? service.color : `${service.color}15` },
                      ]}>
                        {renderServiceIcon(service.icon, service.iconLib, isActive ? '#fff' : service.color, wp('4%'))}
                      </View>
                      <Text style={[
                        styles.serviceGridLabel,
                        isActive && { color: service.color, fontWeight: '700' },
                      ]} numberOfLines={1}>
                        {service.label}
                      </Text>
                      {isActive && (
                        <View style={[styles.checkCircle, { backgroundColor: service.color }]}>
                          <Ionicons name="checkmark" size={wp('2.2%')} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Status Section */}
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusGrid}>
                {STATUSES.map((status) => {
                  const isActive = tempStatus === status.key;
                  return (
                    <TouchableOpacity
                      key={status.key}
                      style={[
                        styles.statusGridItem,
                        isActive && { backgroundColor: status.color, borderColor: status.color },
                      ]}
                      onPress={() => setTempStatus(status.key)}
                      activeOpacity={0.7}
                    >
                      {isActive ? (
                        <Ionicons name="checkmark-circle" size={wp('3.5%')} color="#fff" />
                      ) : (
                        <View style={[styles.statusGridDot, { backgroundColor: status.color }]} />
                      )}
                      <Text style={[
                        styles.statusGridText,
                        isActive && { color: '#fff', fontWeight: '700' },
                      ]}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Expired Quotes Toggle */}
              <Text style={styles.sectionTitle}>Quote Status</Text>
              <TouchableOpacity
                style={[styles.expiredToggleRow, tempExpiredOnly && styles.expiredToggleRowActive]}
                onPress={() => setTempExpiredOnly(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.expiredToggleIcon, tempExpiredOnly && styles.expiredToggleIconActive]}>
                  <Ionicons name="close-circle-outline" size={wp('4.5%')} color={tempExpiredOnly ? '#fff' : '#EF4444'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.expiredToggleLabel, tempExpiredOnly && { color: '#991B1B' }]}>Expired Quotes Only</Text>
                  <Text style={styles.expiredToggleDesc}>Show requests where all quotes have expired</Text>
                </View>
                <View style={[styles.expiredToggleCheck, tempExpiredOnly && styles.expiredToggleCheckActive]}>
                  {tempExpiredOnly && <Ionicons name="checkmark" size={wp('3%')} color="#fff" />}
                </View>
              </TouchableOpacity>

              <View style={{ height: hp('2%') }} />
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity style={styles.applyBtnWrap} onPress={applyFilters} activeOpacity={0.85}>
              <LinearGradient
                colors={[TEAL_DEEP, TEAL_MID, '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtn}
              >
                <Ionicons name="checkmark-circle-outline" size={wp('5%')} color="#fff" />
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Decorative circles
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Header
  header: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2.5%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  headerIconBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: hp('2%'),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('1%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  statCardMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statNumber: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.2%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filter Badge & Active Chips
  filterBadge: {
    position: 'absolute',
    top: -wp('0.8%'),
    right: -wp('0.8%'),
    width: wp('4.2%'),
    height: wp('4.2%'),
    borderRadius: wp('2.1%'),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: TEAL_MID,
  },
  filterBadgeText: {
    fontSize: wp('2.2%'),
    fontWeight: '800',
    color: '#fff',
  },
  filterBadgeDot: {
    width: wp('1.8%'),
    height: wp('1.8%'),
    borderRadius: wp('1%'),
    backgroundColor: '#fff',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    gap: wp('2%'),
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('5%'),
    borderWidth: 1.5,
    gap: wp('1.2%'),
    ...SHADOW_SM,
  },
  activeChipDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
  },
  activeChipText: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
  },
  clearBtn: {
    marginLeft: 'auto',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
  },
  clearBtnText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#EF4444',
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    paddingBottom: Platform.OS === 'ios' ? hp('3.5%') : hp('2%'),
    maxHeight: hp('72%'),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: -4 }, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  modalHandleWrap: {
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  modalHandle: {
    width: wp('10%'),
    height: hp('0.45%'),
    borderRadius: wp('1%'),
    backgroundColor: '#D1D5DB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  modalTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('2%'),
    backgroundColor: TEAL_LIGHT,
  },
  resetText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  sectionTitle: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    paddingHorizontal: wp('5%'),
    marginTop: hp('2%'),
    marginBottom: hp('1.2%'),
    letterSpacing: 0.2,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp('4%'),
    gap: wp('2.5%'),
  },
  serviceGridItem: {
    width: wp('27%'),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2.5%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    gap: wp('2%'),
  },
  serviceGridIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceGridLabel: {
    fontSize: wp('2.6%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    flex: 1,
  },
  checkCircle: {
    width: wp('4%'),
    height: wp('4%'),
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp('4%'),
    gap: wp('2.5%'),
  },
  statusGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.9%'),
    borderRadius: wp('5%'),
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    gap: wp('1.5%'),
  },
  statusGridDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
  },
  statusGridText: {
    fontSize: wp('2.9%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  applyBtnWrap: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('1%'),
  },
  applyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('1.6%'),
    borderRadius: wp('3.5%'),
    gap: wp('2%'),
  },
  applyBtnText: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  expiredToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: wp('3%'),
    padding: wp('3.5%'),
    marginHorizontal: wp('4%'),
    marginTop: wp('2%'),
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: wp('3%'),
  },
  expiredToggleRowActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  expiredToggleIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredToggleIconActive: {
    backgroundColor: '#EF4444',
  },
  expiredToggleLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#374151',
  },
  expiredToggleDesc: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    marginTop: 2,
  },
  expiredToggleCheck: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredToggleCheckActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },

  // Bookings List
  // Phase 7 — TA banner styles (sits between filter chips and bookings list).
  taBanner: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1%'),
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  taBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.3%'),
    gap: wp('2.5%'),
  },
  taBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taBannerTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  taBannerSub: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },

  bookingsList: {
    flex: 1,
  },
  bookingsContent: {
    padding: wp('4%'),
    paddingTop: hp('0.8%'),
  },
  resultsCount: {
    fontSize: wp('3.1%'),
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: hp('1.2%'),
  },

  // Booking Card
  bookingCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderBottomRightRadius: wp('3%'),
    gap: wp('1.2%'),
  },
  serviceBadgeText: {
    color: '#fff',
    fontSize: wp('2.6%'),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  quoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderBottomLeftRadius: wp('3%'),
    gap: wp('1%'),
  },
  quoteBadgeWaiting: {
    backgroundColor: '#FFF3E0',
  },
  quoteBadgeText: {
    fontSize: wp('2.5%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  cardContent: {
    flexDirection: 'row',
    padding: wp('3.5%'),
    alignItems: 'center',
  },
  iconCircle: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImageWrap: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  cardDetails: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  bookingName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.3%'),
    gap: wp('1.5%'),
  },
  infoText: {
    fontSize: wp('2.9%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: hp('1%'),
  },
  statusChip: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('2%'),
  },
  statusText: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
  },
  arrowCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card Strip
  cardStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3.5%'),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stripItem: {
    flex: 1,
  },
  stripLabel: {
    fontSize: wp('2.4%'),
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stripValue: {
    fontSize: wp('3.1%'),
    color: TEXT_PRIMARY,
    fontWeight: '700',
    marginTop: hp('0.2%'),
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
  },
  loadingText: {
    marginTop: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: TEXT_MUTED,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
    paddingHorizontal: wp('10%'),
  },
  emptyIconWrap: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  emptySubtitle: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: hp('0.8%'),
    lineHeight: wp('5%'),
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_MID,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.6%'),
    borderRadius: wp('3%'),
    marginTop: hp('2.5%'),
    gap: wp('2%'),
    ...SHADOW_MD,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: wp('3.6%'),
    fontWeight: '700',
  },
  // Search Bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.2%'),
    marginBottom: hp('0.5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: Platform.OS === 'ios' ? hp('2.2%') : hp('1.7%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: wp('2.5%'),
    ...SHADOW_SM,
  },
  searchBarWrapFocused: {
    borderColor: TEAL,
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
    paddingVertical: 0,
  },
});

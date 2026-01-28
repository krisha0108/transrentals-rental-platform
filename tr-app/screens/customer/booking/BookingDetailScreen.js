// BookingDetails_redesign_light.js
// Redesigned BookingDetails screen (Light premium look)
// NOTE: I kept ALL existing logic, state names and functions intact. Only UI and styles were reworked.

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Pressable,
  SafeAreaView,
  Share,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import api, { BASE_URL, IMAGE_BASE_URL } from '../../api';

const { width } = Dimensions.get('window');

const BookingDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, bookingType } = route.params; // bookingType can be 'bike' for bike bookings

  // ---------- LOGIC (UNCHANGED) ----------
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [priceSort, setPriceSort] = useState('default');
  const [sortedQuotations, setSortedQuotations] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const mapTripType = (code) => {
    switch (code) {
      case '1': return 'Oneway';
      case '2': return 'Airport';
      case '3': return 'Roundtrip';
      default: return null;
    }
  };

  const mapBikeDuration = (code) => {
    switch (code) {
      case '1': return 'Hourly';
      case '2': return 'Daily';
      case '3': return 'Weekly';
      case '4': return 'Monthly';
      default: return null;
    }
  };

  const mapBikeType = (code) => {
    switch (code) {
      case '1': return 'Sport Bike';
      case '2': return 'Scooter';
      case '3': return 'Cruiser';
      case '4': return 'Street / Naked';
      case '5': return 'Adventure Tourer';
      case '6': return 'Dirt Bike';
      default: return null;
    }
  };

  const mapVehicleType = (code) => {
    switch (code) {
      case '1': return 'Hatchback';
      case '2': return 'Sedan';
      case '3': return 'SUV';
      case '4': return 'MUV';
      default: return null;
    }
  };

  const mapCarType = (code) => {
    switch (code) {
      case '1': return 'Hatchback';
      case '2': return 'Sedan';
      case '3': return 'MUV';
      case '4': return 'SUV';
      case '5': return 'Luxury';
      default: return null;
    }
  };

  const mapFuelType = (code) => {
    switch (code) {
      case '1': return 'Diesel';
      case '2': return 'Petrol';
      case '3': return 'Electric';
      case '4': return 'CNG';
      default: return null;
    }
  };

  const mapTransmission = (code) => {
    switch (code) {
      case '1': return 'Automatic';
      case '2': return 'Manual';
      default: return null;
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const confirmedQuote = quotations.find(q => q.payment_status === 'advance_done');

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      let data;

      // Use different API based on booking type
      if (bookingType === 'car') {
        // Car rental booking - use new API
        response = await api.get(`/car-rental/bookings/${bookingId}`);
        data = response.data;

        console.log('✅ Car Rental Booking data:', data);

        if (data.success && data.booking) {
          const carBooking = data.booking;
          setBooking({
            id: carBooking.id,
            booking_id: carBooking.bookingNumber,
            service_name: 'Car Rental',
            service_type: 'car',
            location_name: carBooking.pickupCity,
            destination: carBooking.dropCity || '',
            journey_date: carBooking.pickupDate,
            journey_time: carBooking.pickupTime,
            return_date: carBooking.returnDate,
            customer_name: carBooking.customerName,
            customer_email: carBooking.customerEmail,
            customer_phone: carBooking.customerPhone,
            vehicle_name: carBooking.carCategoryName,
            car_type: carBooking.carCategory,
            grand_total: carBooking.grandTotal,
            total_amount: carBooking.grandTotal,
            status: carBooking.status,
            payment_status: carBooking.paymentStatus,
            paid_amount: carBooking.paidAmount,
            transaction_id: carBooking.transactionId,
            vendor: carBooking.vendor,
            acceptedVendorId: carBooking.acceptedVendorId,
            tripStartOtp: carBooking.tripStartOtp,
            driverName: carBooking.driverName,
            driverPhone: carBooking.driverPhone,
            vehicleNumber: carBooking.vehicleNumber,
            vehicleModel: carBooking.vehicleModel,
            created_at: carBooking.createdAt,
            updated_at: carBooking.updatedAt,
          });
          setQuotations([]);
          setAssignedVehicle(carBooking.vehicleModel || carBooking.carCategoryName);
          setAssignedDriver(carBooking.driverName ? { name: carBooking.driverName, phone: carBooking.driverPhone } : null);
        } else {
          console.warn('⚠️ Car rental fetch failed:', data.error || data.message);
        }
      } else if (bookingType === 'bike') {
        // Bike booking - use new API
        response = await api.get(`/bike-bookings/${bookingId}`);
        data = response.data;

        console.log('✅ Bike Booking data:', data);

        if (data.success && data.booking) {
          // Map bike booking data to the format expected by UI
          const bikeBooking = data.booking;
          setBooking({
            id: bikeBooking.id,
            booking_id: bikeBooking.bookingNumber,
            service_name: 'Bike Rental',
            service_type: 'bike',
            location_name: bikeBooking.locationName || bikeBooking.location?.name,
            destination: bikeBooking.destination || '',
            journey_date: bikeBooking.pickupDate,
            journey_time: bikeBooking.pickupTime,
            return_date: bikeBooking.dropDate,
            return_time: bikeBooking.dropTime,
            customer_name: bikeBooking.customerName,
            customer_email: bikeBooking.customerEmail,
            customer_phone: bikeBooking.customerPhone,
            vehicle_name: bikeBooking.vehicleName || bikeBooking.assignedVehicle,
            vehicle_brand: bikeBooking.vehicleBrand,
            vehicle_category: bikeBooking.vehicleCategory,
            duration: bikeBooking.totalDays,
            daily_rate: bikeBooking.dailyRate,
            total_amount: bikeBooking.totalAmount,
            gst_amount: bikeBooking.gstAmount,
            security_deposit: bikeBooking.securityDeposit,
            grand_total: bikeBooking.grandTotal,
            status: bikeBooking.status,
            payment_status: bikeBooking.paymentStatus,
            payment_method: bikeBooking.paymentMethod,
            paid_amount: bikeBooking.paidAmount,
            transaction_id: bikeBooking.transactionId,
            customer_notes: bikeBooking.customerNotes,
            vendor_notes: bikeBooking.vendorNotes,
            vendor: bikeBooking.vendor,
            assigned_vendor: bikeBooking.assignedVendor,
            created_at: bikeBooking.createdAt,
            updated_at: bikeBooking.updatedAt,
            // Bike specific
            helmets_required: bikeBooking.helmetsRequired,
            addons: bikeBooking.addons,
          });
          setQuotations([]); // Bike bookings don't have quotations in the same way
          setAssignedVehicle(bikeBooking.assignedVehicle || bikeBooking.vehicleName || null);
          setAssignedDriver(null);
        } else {
          console.warn('⚠️ Bike booking fetch failed:', data.error || data.message);
        }
      } else {
        // Regular booking - use unified API
        response = await api.get(`/customer-booking-detail/${bookingId}`);
        data = response.data;

        console.log('✅ Booking data:', data);

        if (data.success) {
          // Check if this is a quote request or booking that needs redirection to specific screen
          if (data.type && data.redirectTo) {
            console.log(`🔄 Redirecting to ${data.redirectTo} screen for type: ${data.type}`);

            // Navigate to the appropriate screen based on type
            if (data.redirectTo === 'BusQuoteRequestDetail') {
              navigation.replace('BusQuoteRequestDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'BusBookingDetail') {
              navigation.replace('BusBookingDetail', { bookingId: bookingId });
              return;
            } else if (data.redirectTo === 'TruckQuoteRequestDetail') {
              navigation.replace('TruckQuoteRequestDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'TruckBookingDetail') {
              navigation.replace('TruckBookingDetail', { bookingId: bookingId });
              return;
            } else if (data.redirectTo === 'EquipmentQuoteRequestDetail') {
              navigation.replace('EquipmentQuoteRequestDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'EquipmentBookingDetail') {
              navigation.replace('EquipmentBookingDetail', { bookingId: bookingId });
              return;
            } else if (data.redirectTo === 'PackersQuoteRequestDetail') {
              navigation.replace('PackersQuoteRequestDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'PackersBookingDetail') {
              navigation.replace('PackersBookingDetail', { bookingId: bookingId });
              return;
            } else if (data.redirectTo === 'LuxuryQuoteRequestDetail') {
              navigation.replace('LuxuryQuoteDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'LuxuryBookingDetail') {
              navigation.replace('LuxuryBookingDetail', { bookingId: bookingId });
              return;
            }
          }

          // Regular booking - fallback (for old bookings or unsupported types)
          setBooking(data.booking);
          setQuotations(data.quotations || []);
          setAssignedVehicle(data.assigned_vehicle || null);
          setAssignedDriver(data.assigned_driver || null);
        } else {
          console.warn('⚠️ Booking fetch success=false:', data.message);
        }
      }
    } catch (err) {
      console.log('❌ Booking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bookingId, bookingType]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [bookingId, bookingType]);

  useEffect(() => {
    setSortedQuotations(quotations);
  }, [quotations]);

  useEffect(() => {
    if (!quotations) return;
    let sorted = [...quotations];
    if (priceSort === 'low_to_high') {
      sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (priceSort === 'high_to_low') {
      sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }
    setSortedQuotations(sorted);
  }, [priceSort, quotations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCallDriver = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('No Contact', 'Driver phone number not available');
      return;
    }
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone dialer not available');
        }
      })
      .catch((err) => {
        console.log('Error calling driver:', err);
        Alert.alert('Error', 'Failed to open phone dialer');
      });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${BASE_URL}/live/booking/${bookingId}`;
      const message = `Check out this booking on TransRentals: ${shareUrl}`;
      await Share.share({
        message: message,
        url: shareUrl,
        title: 'TransRentals Booking'
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CustomerDashboard');
    }
  };

  // ---------- UI HELPERS (UNCHANGED) ----------
  const parseFirstImage = (quote) => {
    let firstImage = require('../../../assets/logp-1.png');

    try {
      const images = JSON.parse(quote?.service_images || '[]');
      if (images.length > 0) {
        let firstImagePath = images[0].replace(/\\/g, '/');
        if (!firstImagePath.startsWith('http')) {
          firstImagePath = `${IMAGE_BASE_URL}/${firstImagePath}`;
        }
        firstImage = { uri: firstImagePath };
      }
    } catch (e) {
      // keep default
    }

    return firstImage;
  };

  const handleImageError = () => {
    // fallback handled by parseFirstImage default asset
  };

  // ---------- CARD RENDER (STRUCTURE PRESERVED, LOOK CHANGED) ----------
  const renderQuoteCard = (quote, index) => {
    const firstImage = parseFirstImage(quote);
    const isSelected = confirmedQuote && confirmedQuote.id === quote.id;

    return (
      <Pressable
        key={quote.id ?? index}
        onPress={() => navigation.navigate('ViewQuote', { quoteId: quote.id })}
        style={({ pressed }) => [
          redesignStyles.quoteCard,
          isSelected && redesignStyles.quoteCardSelected,
          pressed && redesignStyles.quoteCardPressed,
        ]}
      >
        <Image source={firstImage} style={redesignStyles.quoteImage} resizeMode="contain" onError={handleImageError} />

        <View style={redesignStyles.quoteContent}>
          <View style={redesignStyles.qTop}>
            <Text style={redesignStyles.qTitle} numberOfLines={2}>{quote?.service_name ?? 'Service Name'}</Text>

            <View style={redesignStyles.qPriceWrap}>
              <Text style={redesignStyles.qPrice}>₹{quote?.price ?? '0'}</Text>
              <Text style={redesignStyles.qPriceLabel}>All inclusive</Text>
            </View>
          </View>

          <Text style={redesignStyles.qVendor} numberOfLines={1}>{quote?.vendor?.name ?? 'Vendor Name'}</Text>

          <View style={redesignStyles.qTagsRow}>
            {quote?.vehicle_type && (
              <View style={redesignStyles.qTagPill}>
                <Ionicons name="car-sport" size={12} color="#0B6E4F" />
                <Text style={redesignStyles.qTagText}>{truncateText(quote.vehicle_type, 14)}</Text>
              </View>
            )}

            <View style={redesignStyles.qTagPill}>
              <Ionicons name="time" size={12} color="#0B6E4F" />
              <Text style={redesignStyles.qTagText}>Instant</Text>
            </View>

            <View style={redesignStyles.qTagPill}>
              <Ionicons name="shield-checkmark" size={12} color="#0B6E4F" />
              <Text style={redesignStyles.qTagText}>Verified</Text>
            </View>
          </View>

          <View style={redesignStyles.qFooter}>
            <Text style={redesignStyles.qBenefit}>Free cancellation · 24/7 support</Text>


          </View>
        </View>

        {isSelected && (
          <View style={redesignStyles.selectedRibbon}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={redesignStyles.selectedRibbonText}>SELECTED</Text>
          </View>
        )}
      </Pressable>
    );
  };

  // ---------- LOADING / EMPTY STATE ----------
  if (loading && !booking) {
    return (
      <SafeAreaView style={redesignStyles.container}>
        <View style={redesignStyles.headerTop}>
          <TouchableOpacity onPress={handleBackPress} style={redesignStyles.headerLeftTop}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={redesignStyles.headerTitle}>Loading Booking...</Text>
          <View style={redesignStyles.headerRightTop} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#0B6E4F" />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking && !loading) {
    return (
      <SafeAreaView style={redesignStyles.container}>
        <View style={redesignStyles.headerTop}>
          <TouchableOpacity onPress={handleBackPress} style={redesignStyles.headerLeftTop}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={redesignStyles.headerTitle}>Booking Details</Text>

          <View style={redesignStyles.headerRightTop} />
        </View>

        <ScrollView
          contentContainerStyle={redesignStyles.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B6E4F']} />}
        >
          <View style={redesignStyles.emptyWrap}>
            <View style={redesignStyles.emptyCircle}>
              <Ionicons name="document-text" size={56} color="#DDEFEA" />
            </View>
            <Text style={redesignStyles.emptyTitle}>Booking Not Found</Text>
            <Text style={redesignStyles.emptyDesc}>We could not find the booking you are looking for. It may have been removed.</Text>

            <TouchableOpacity style={redesignStyles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color="#0B6E4F" />
              <Text style={redesignStyles.refreshBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const getFriendlyStatus = (status, paymentStatus) => {
    const upperStatus = status?.toUpperCase() || '';
    const upperPayment = paymentStatus?.toUpperCase() || '';

    if (upperStatus === 'PENDING_PAYMENT' && (upperPayment === 'PARTIAL' || upperPayment === 'SUBMITTED' || upperPayment === 'PENDING_VERIFICATION')) {
      return 'Payment Verification Pending';
    }
    if (upperStatus === 'PENDING_PAYMENT') return 'Pending Payment';
    if (upperStatus === 'PENDING_VENDOR' || upperStatus === 'BROADCASTED') return 'Finding Best Vendor';
    if (upperStatus === 'ACCEPTED') return 'Vendor Confirmed, Assigning Driver';
    if (upperStatus === 'DRIVER_ASSIGNED') return 'Driver Assigned';
    if (upperStatus === 'IN_PROGRESS') return 'Trip Started';
    if (upperStatus === 'COMPLETED') return 'Completed';
    if (upperStatus === 'CANCELLED') return 'Cancelled';
    return status || 'Pending';
  };

  // ---------- MAIN RENDER ----------
  return (
    <SafeAreaView style={redesignStyles.container}>
      {/* Top header with subtle gradient */}
      <LinearGradient colors={["#FFFFFF", "#F4FCF8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={redesignStyles.headerTop}>
        <TouchableOpacity onPress={handleBackPress} style={redesignStyles.headerLeftTop}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={redesignStyles.headerCenterTop}>
          <Text style={redesignStyles.headerTitle}>Booking Details</Text>
          <Text style={redesignStyles.headerSub}>
            {booking?.service_name || 'Service'}
            {bookingType === 'car' ? ` · ${getFriendlyStatus(booking?.status, booking?.payment_status)}` : ` · ${sortedQuotations.length} quotes`}
          </Text>
        </View>

        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity style={redesignStyles.headerRightTop} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#0B6E4F" />
          </TouchableOpacity>
          <TouchableOpacity style={redesignStyles.headerRightTop} onPress={handleShare}>
            <Ionicons name="share-social" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={redesignStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B6E4F']} />}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Booking summary card */}
        <View style={redesignStyles.summaryCardWrap}>



          <View style={redesignStyles.summaryCard}>
            <View style={redesignStyles.iconWrap}>
              <Ionicons name="car-sport-outline" size={22} color="#3d4241ff" />
            </View>

            <View style={redesignStyles.routeContainer}>
              {/* Pickup and Destination Row */}
              <View style={redesignStyles.routeRow}>
                <View style={redesignStyles.routeItem}>
                  <Text style={redesignStyles.label}>Pickup</Text>
                  <Text style={redesignStyles.value} numberOfLines={1}>
                    {booking?.location_name || 'Pickup location'}
                  </Text>
                </View>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#10B981"
                  style={{ marginHorizontal: 12 }}
                />

                <View style={redesignStyles.routeItem}>
                  <Text style={redesignStyles.label}>Destination</Text>
                  <Text style={redesignStyles.value} numberOfLines={1}>
                    {booking?.destination || 'Destination'}
                  </Text>
                </View>
              </View>

              {/* Date and Time Row */}
              <View style={redesignStyles.metaRow}>
                <View style={redesignStyles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text style={redesignStyles.metaText}>
                    {booking
                      ? new Date(booking.journey_datetime).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                      : '-'}
                  </Text>
                </View>

                <View style={redesignStyles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={redesignStyles.metaText}>
                    {booking
                      ? new Date(booking.journey_datetime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                      : '-'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Assigned vehicle & driver (only for ongoing) */}
        {booking?.status === 'Ongoing' && (assignedVehicle || assignedDriver) && (
          <View style={redesignStyles.assignedCardWrap}>
            <View style={redesignStyles.assignedCardHeader}>
              <Text style={redesignStyles.assignedTitle}>Your assigned ride</Text>
              <View style={redesignStyles.assignedStatusPill}>
                <Ionicons name="time" size={12} color="#0F172A" />
                <Text style={redesignStyles.assignedStatusText}>Ongoing</Text>
              </View>
            </View>

            {/* Log to debug */}
            {console.log('🚗 Assigned Vehicle Data:', assignedVehicle)}
            {console.log('🧍 Assigned Driver Data:', assignedDriver)}

            {/* 👉 Combined row layout */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                backgroundColor: '#F9FAFB',
                borderRadius: 10,
                padding: 12,
                marginTop: 6,
              }}
            >
              {/* Vehicle Info */}
              {(assignedVehicle || booking?.vehicleModel || booking?.vehicleNumber) && (
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="car-sport" size={18} color="#0B6E4F" />
                    <Text style={redesignStyles.assignedLabel}>Vehicle</Text>

                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#0B6E4F',
                      marginLeft: 6,
                    }}
                  >
                    {typeof assignedVehicle === 'string'
                      ? assignedVehicle
                      : (assignedVehicle?.vehicle_name || assignedVehicle?.model || booking?.vehicleModel || booking?.vehicle_name || 'Vehicle')}
                  </Text>
                  {(() => {
                    const vehicleType = assignedVehicle?.vehicle_type || booking?.car_type;
                    return vehicleType && vehicleType !== '-' && vehicleType !== '' ? (
                      <Text style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
                        Type: {vehicleType}
                      </Text>
                    ) : null;
                  })()}

                  {(() => {
                    const regNo = assignedVehicle?.reg_no || booking?.vehicleNumber;
                    return regNo && regNo !== '-' && regNo !== '' ? (
                      <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                        Reg No: {regNo}
                      </Text>
                    ) : null;
                  })()}
                </View>
              )}

              {/* Divider */}
              <View
                style={{
                  width: 1,
                  backgroundColor: '#E2E8F0',
                  marginHorizontal: 8,
                }}
              />

              {/* Driver Info */}
              {assignedDriver && (
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    <Ionicons name="person-circle" size={18} color="#0B6E4F" />
                    <Text style={redesignStyles.assignedLabel}>Driver</Text>

                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#0B6E4F',
                      marginLeft: 6,
                    }}
                  >
                    {assignedDriver.name || assignedDriver.full_name || booking?.driverName || 'Driver'}
                  </Text>
                  {(assignedDriver.phone || booking?.driverPhone) && (
                    <TouchableOpacity
                      onPress={() => handleCallDriver(assignedDriver.phone || booking?.driverPhone)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 4,
                        backgroundColor: '#F1F5F9',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Ionicons name="call" size={12} color="#0B6E4F" />
                      <Text style={{ color: '#0B6E4F', fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
                        {assignedDriver.phone || booking?.driverPhone}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
        {/* Assigned vehicle & driver (only for ongoing) */}
        {/* VEHICLE / SERVICE DETAILS */}
        {booking && (
          <View style={redesignStyles.detailsSectionWrap}>

            {/* A. Core service pills */}
            <View style={redesignStyles.pillRow}>
              {booking.service_name ? (
                <View style={redesignStyles.pill}>
                  <Ionicons name="briefcase-outline" size={13} color="#0B6E4F" />
                  <Text style={redesignStyles.pillText}>{booking.service_name}</Text>
                </View>
              ) : null}

              {booking.trip_type ? (
                <View style={redesignStyles.pillSecondary}>
                  <Ionicons name="navigate-outline" size={12} color="#0F172A" />
                  <Text style={redesignStyles.pillSecondaryText}>
                    {mapTripType(booking.trip_type)}
                  </Text>
                </View>
              ) : null}

              {booking.location_type ? (
                <View style={redesignStyles.pillSecondary}>
                  <Ionicons name="location-outline" size={12} color="#0F172A" />
                  <Text style={redesignStyles.pillSecondaryText}>
                    {booking.location_type === '1' ? 'Outstation' : 'Local'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* B. Car / Cab details - Hide for car rentals as it's already shown above in assigned vehicle section */}
            {bookingType !== 'car' && (booking.vehicle_type || booking.car_type || booking.total_passangers || booking.fuel_type || booking.transmission) ? (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={redesignStyles.detailsIcon}>
                    <Ionicons name="car-sport" size={16} color="#0B6E4F" />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Vehicle details</Text>
                </View>

                <View style={redesignStyles.detailsGrid}>
                  {(() => {
                    const vehicleType = mapVehicleType(booking?.vehicle_type) || mapCarType(booking?.car_type);
                    return vehicleType ? (
                      <View style={redesignStyles.detailsItem}>
                        <Text style={redesignStyles.detailsLabel}>Type</Text>
                        <Text style={redesignStyles.detailsValue}>{vehicleType}</Text>
                      </View>
                    ) : null;
                  })()}

                  {booking?.total_passangers && (
                    <View style={redesignStyles.detailsItem}>
                      <Text style={redesignStyles.detailsLabel}>Passengers</Text>
                      <Text style={redesignStyles.detailsValue}>{booking.total_passangers}</Text>
                    </View>
                  )}

                  {(() => {
                    const fuelType = mapFuelType(booking?.fuel_type);
                    return fuelType ? (
                      <View style={redesignStyles.detailsItem}>
                        <Text style={redesignStyles.detailsLabel}>Fuel</Text>
                        <Text style={redesignStyles.detailsValue}>{fuelType}</Text>
                      </View>
                    ) : null;
                  })()}

                  {(() => {
                    const transmission = mapTransmission(booking?.transmission);
                    return transmission ? (
                      <View style={redesignStyles.detailsItem}>
                        <Text style={redesignStyles.detailsLabel}>Transmission</Text>
                        <Text style={redesignStyles.detailsValue}>{transmission}</Text>
                      </View>
                    ) : null;
                  })()}

                  {booking?.is_doorstep_delivery === '1' && (
                    <View style={redesignStyles.detailsItemFull}>
                      <Ionicons name="home-outline" size={14} color="#0B6E4F" />
                      <Text style={redesignStyles.detailsValue}>Doorstep delivery</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* A. Customer Info */}
            <View style={redesignStyles.detailsCard}>
              <View style={redesignStyles.detailsHeader}>
                <View style={redesignStyles.detailsIcon}>
                  <Ionicons name="person-outline" size={16} color="#0B6E4F" />
                </View>
                <Text style={redesignStyles.detailsTitle}>Customer Details</Text>
              </View>
              <View style={redesignStyles.detailsGrid}>
                <View style={redesignStyles.detailsItem}>
                  <Text style={redesignStyles.detailsLabel}>Name</Text>
                  <Text style={redesignStyles.detailsValue}>{booking?.customer_name}</Text>
                </View>
                <View style={redesignStyles.detailsItem}>
                  <Text style={redesignStyles.detailsLabel}>Contact</Text>
                  <Text style={redesignStyles.detailsValue}>{booking?.customer_phone}</Text>
                </View>
                {booking?.customer_email && (
                  <View style={redesignStyles.detailsItemFull}>
                    <Text style={redesignStyles.detailsLabel}>Email: </Text>
                    <Text style={redesignStyles.detailsValue}>{booking.customer_email}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* B. Specific Details based on service */}
            {booking?.vehicle_name && (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={redesignStyles.detailsIcon}>
                    <Ionicons name="car-outline" size={16} color="#0B6E4F" />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Vehicle Preference</Text>
                </View>
                <View style={redesignStyles.detailsGrid}>
                  <View style={redesignStyles.detailsItem}>
                    <Text style={redesignStyles.detailsLabel}>Category</Text>
                    <Text style={redesignStyles.detailsValue}>{booking.vehicle_name}</Text>
                  </View>
                  {booking.car_type && (
                    <View style={redesignStyles.detailsItem}>
                      <Text style={redesignStyles.detailsLabel}>Segment</Text>
                      <Text style={redesignStyles.detailsValue}>{booking.car_type}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* C. Bike rentals */}
            {(booking.bike_type || booking.bike_duration) ? (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#ECF3FF' }]}>
                    <Ionicons name="bicycle-outline" size={16} color="#2B50AA" />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Bike rental</Text>
                </View>

                <View style={redesignStyles.detailsGrid}>
                  {booking.bike_type && (
                    <View style={redesignStyles.detailsItem}>
                      <Text style={redesignStyles.detailsLabel}>Bike type</Text>
                      <Text style={redesignStyles.detailsValue}>{mapBikeType(booking.bike_type)}</Text>
                    </View>
                  )}
                  {booking.bike_duration && (
                    <View style={redesignStyles.detailsItem}>
                      <Text style={redesignStyles.detailsLabel}>Duration</Text>
                      <Text style={redesignStyles.detailsValue}>{mapBikeDuration(booking.bike_duration)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* D. Airport booking */}
            {booking.booking_type && (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#FFF3E7' }]}>
                    <Ionicons name="airplane-outline" size={16} color="#C05621" />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Airport transfer</Text>
                </View>
                <Text style={redesignStyles.detailsDesc}>
                  {booking.booking_type === '1' ? 'Drop to airport' : 'Pick up from airport'}
                </Text>
              </View>
            )}

            {/* E. Cargo / Truck */}
            {(booking?.truck_type || booking?.weight_val || booking?.commercial_good_type || booking?.personal_good_type) ? (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#FDE2E4' }]}>
                    <Ionicons name="cube-outline" size={16} color="#B91C1C" />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Load / Logistics</Text>
                </View>
                <View style={redesignStyles.detailsGrid}>
                  {booking?.truck_type && (
                    <View style={redesignStyles.detailsItem}>
                      <Text style={redesignStyles.detailsLabel}>Truck type</Text>
                      <Text style={redesignStyles.detailsValue}>{booking.truck_type}</Text>
                    </View>
                  )}
                  {booking?.weight_val && (
                    <View style={redesignStyles.detailsItem}>
                      <Text style={redesignStyles.detailsLabel}>Weight</Text>
                      <Text style={redesignStyles.detailsValue}>
                        {booking.weight_val} {booking.weight === '1' ? 'KG' : booking.weight === '2' ? 'TON' : ''}
                      </Text>
                    </View>
                  )}
                  {booking?.job_location && (
                    <View style={redesignStyles.detailsItemFull}>
                      <Ionicons name="pin-outline" size={14} color="#0F172A" />
                      <Text style={redesignStyles.detailsValue}>{booking.job_location}</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* F. Shifting */}
            {booking?.shifting_type && (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#E0ECFF' }]}>
                    <Ionicons name="home-outline" size={16} color="#1D4ED8" />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Shifting</Text>
                </View>
                <Text style={redesignStyles.detailsDesc}>{booking.shifting_type}</Text>
                {booking.home_shifting && (
                  <Text style={redesignStyles.detailsDescMuted}>Home: {booking.home_shifting}</Text>
                )}
                {booking.office_shifting && (
                  <Text style={redesignStyles.detailsDescMuted}>Office: {booking.office_shifting}</Text>
                )}
                {booking.vehicle_shifting && (
                  <Text style={redesignStyles.detailsDescMuted}>Vehicle: {booking.vehicle_shifting}</Text>
                )}
              </View>
            )}
            {/* Car Rental Specific Views */}
            {bookingType === 'car' && booking && (
              <View style={redesignStyles.carFlowContainer}>
                {/* 1. Payment Verification Card */}
                {getFriendlyStatus(booking?.status, booking?.payment_status) === 'Payment Verification Pending' && (
                  <View style={[redesignStyles.statusCard, { backgroundColor: '#FFF9EB', borderColor: '#FFE4A1' }]}>
                    <View style={redesignStyles.statusIconCircle}>
                      <Ionicons name="time-outline" size={24} color="#B45309" />
                    </View>
                    <View style={redesignStyles.statusTextWrap}>
                      <Text style={[redesignStyles.statusTitle, { color: '#B45309' }]}>Payment Verification Pending</Text>
                      <Text style={redesignStyles.statusDesc}>We have received your payment details. Admin is currently verifying the transaction. Once verified, we will start assigning a vendor for your trip.</Text>
                    </View>
                  </View>
                )}

                {/* 2. Driver Info Card */}
                {booking?.driverName && (
                  <View style={redesignStyles.assignedCardWrap}>
                    <View style={redesignStyles.assignedCardHeader}>
                      <Text style={redesignStyles.assignedTitle}>Your Driver Details</Text>
                      <View style={[redesignStyles.assignedStatusPill, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="checkmark-circle" size={12} color="#059669" />
                        <Text style={[redesignStyles.assignedStatusText, { color: '#059669' }]}>Assigned</Text>
                      </View>
                    </View>

                    <View style={redesignStyles.driverRow}>
                      <View style={redesignStyles.driverAvatar}>
                        <Ionicons name="person" size={30} color="#64748B" />
                      </View>
                      <View style={redesignStyles.driverDetails}>
                        <Text style={redesignStyles.driverName}>{booking.driverName}</Text>
                        <Text style={redesignStyles.driverPhone}>📞 {booking.driverPhone}</Text>
                      </View>
                      <TouchableOpacity
                        style={redesignStyles.callBtn}
                        onPress={() => { /* Handle Call */ }}
                      >
                        <Ionicons name="call" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View style={redesignStyles.vehicleDetailsRow}>
                      <View style={redesignStyles.vehicleItem}>
                        <Text style={redesignStyles.vLabel}>Vehicle Model</Text>
                        <Text style={redesignStyles.vValue}>{booking.vehicleModel}</Text>
                      </View>
                      <View style={redesignStyles.vehicleItem}>
                        <Text style={redesignStyles.vLabel}>Vehicle Number</Text>
                        <Text style={redesignStyles.vValue}>{booking.vehicleNumber}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 3. OTP Section */}
                {booking?.status === 'DRIVER_ASSIGNED' && (
                  <View style={redesignStyles.otpCard}>
                    <LinearGradient
                      colors={['#0B6E4F', '#059669']}
                      style={redesignStyles.otpGradient}
                    >
                      <Text style={redesignStyles.otpLabel}>TRIP START OTP</Text>
                      <Text style={redesignStyles.otpCode}>{booking.tripStartOtp || '----'}</Text>
                      <Text style={redesignStyles.otpInfo}>Share this OTP with the driver to start your trip</Text>
                    </LinearGradient>
                  </View>
                )}

                {/* 4. Timeline View */}
                <View style={redesignStyles.timelineCard}>
                  <Text style={redesignStyles.timelineTitle}>Trip Progress</Text>
                  <View style={redesignStyles.timeline}>
                    <View style={redesignStyles.timelineItem}>
                      <View style={[redesignStyles.timelineDot, { backgroundColor: '#059669' }]} />
                      <View style={redesignStyles.timelineLine} />
                      <Text style={redesignStyles.timelineText}>Booking Received</Text>
                    </View>
                    <View style={redesignStyles.timelineItem}>
                      <View style={[redesignStyles.timelineDot, (booking?.payment_status === 'PAID' || booking?.payment_status === 'PARTIAL') ? { backgroundColor: '#059669' } : {}]} />
                      <View style={redesignStyles.timelineLine} />
                      <Text style={redesignStyles.timelineText}>Payment Verified</Text>
                    </View>
                    <View style={redesignStyles.timelineItem}>
                      <View style={[redesignStyles.timelineDot, booking?.acceptedVendorId ? { backgroundColor: '#059669' } : {}]} />
                      <View style={redesignStyles.timelineLine} />
                      <Text style={redesignStyles.timelineText}>Vendor Confirmed</Text>
                    </View>
                    <View style={redesignStyles.timelineItem}>
                      <View style={[redesignStyles.timelineDot, booking?.driverName ? { backgroundColor: '#059669' } : {}]} />
                      <Text style={redesignStyles.timelineText}>Driver Assigned</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Quotes header with sort - Hidden for Car Rental */}
            {bookingType !== 'car' && (
              <View style={redesignStyles.quotesHeader}>
                <View>
                  <Text style={redesignStyles.quotesTitle}>Available Quotes</Text>
                  <Text style={redesignStyles.quotesSub}>
                    {confirmedQuote ? 'You selected a quote' : 'Compare and choose the best quote'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={redesignStyles.sortBox}
                  onPress={() => setPriceSort(prev => (prev === 'low_to_high' ? 'high_to_low' : 'low_to_high'))}
                >
                  <Ionicons
                    name={priceSort === 'low_to_high' ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color="#16A34A"
                  />
                  <Text style={redesignStyles.sortText}>
                    {priceSort === 'low_to_high' ? 'Low to High' : 'High to Low'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}


            {/* body - Hidden for Car Rental if already booked */}
            <View style={redesignStyles.bodyWrap}>
              {loading ? (
                <View style={redesignStyles.skeletonList}>
                  {[1, 2].map((_, i) => (
                    <View key={i} style={redesignStyles.skelCard}>
                      <ShimmerPlaceHolder style={redesignStyles.skelImage} autoRun />
                      <View style={redesignStyles.skelRight}>
                        <ShimmerPlaceHolder style={[redesignStyles.skelLine, { width: '70%' }]} autoRun />
                        <ShimmerPlaceHolder style={[redesignStyles.skelLine, { width: '50%' }]} autoRun />
                        <ShimmerPlaceHolder style={[redesignStyles.skelLine, { width: '40%' }]} autoRun />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (bookingType !== 'car' && quotations.length === 0) ? (
                <View style={redesignStyles.emptyQuotes}>
                  <Image source={require('../../../assets/NoQuotes.png')} style={redesignStyles.emptyImage} />
                  <Text style={redesignStyles.emptyTitleText}>No Quotes Yet</Text>
                  <Text style={redesignStyles.emptySubText}>Vendors haven't sent any quotes for your journey yet.</Text>
                  <TouchableOpacity style={redesignStyles.refreshBtn} onPress={onRefresh}>
                    <Ionicons name="refresh" size={16} color="#0B6E4F" />
                    <Text style={redesignStyles.refreshBtnText}>Refresh Quotes</Text>
                  </TouchableOpacity>
                </View>
              ) : bookingType !== 'car' ? (
                <View style={redesignStyles.quotesList}>
                  {sortedQuotations
                    .filter(q => {
                      if (!confirmedQuote) return true;
                      return q.id === confirmedQuote.id;
                    })
                    .map((q, idx) => renderQuoteCard(q, idx))}
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom - redesigned */}

    </SafeAreaView>
  );
};

// ---------- REDESIGNED STYLES ----------
const redesignStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F9',
  },

  // Header
  headerTop: {
    height: Platform.OS === 'ios' ? 96 : 86,
    paddingTop: Platform.OS === 'ios' ? 36 : 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  headerLeftTop: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterTop: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  headerRightTop: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: { flex: 1 },

  // Summary card
  summaryCardWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  summaryLeft: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0B6E4F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  summaryMiddle: { flex: 1, paddingLeft: 6 },
  pickupLabel: { fontSize: 10, color: '#64748B', fontWeight: '800', letterSpacing: 0.6 },
  pickupValue: { fontSize: 15, color: '#0F172A', fontWeight: '800', marginTop: 4 },
  destLabel: { fontSize: 10, color: '#64748B', fontWeight: '800', letterSpacing: 0.6 },
  // destValue: { fontSize: 15, color: '#0F172A', fontWeight: '800', marginTop: 4 },

  summaryRight: { width: 56, alignItems: 'flex-end' },
  editBtn: { backgroundColor: '#F0FDF4', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#DCFCE7' },

  // summaryCardWrap: {
  //   marginVertical: 10,
  //   paddingHorizontal: 16,
  // },

  // summaryCard: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-start',
  //   backgroundColor: '#fff',
  //   borderRadius: 16,
  //   padding: 14,
  //   shadowColor: '#000',
  //   shadowOpacity: 0.08,
  //   shadowOffset: { width: 0, height: 3 },
  //   shadowRadius: 6,
  //   elevation: 4,
  // },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  routeContainer: {
    flex: 1,
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  routeItem: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },

  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    marginTop: 2,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },


  // Quotes header
  quotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
  },
  quotesTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  quotesSub: { color: '#64748B', fontSize: 13, marginTop: 4 },
  sortBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  sortText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
  },

  picker: { flex: 1, marginLeft: 8 },

  bodyWrap: { marginTop: 10, paddingHorizontal: 16 },

  // Skeletons
  skeletonList: { gap: 12 },
  skelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    padding: 12,
    elevation: 2,
  },
  skelImage: { width: 94, height: 94, borderRadius: 10, marginRight: 12 },
  skelRight: { flex: 1 },
  skelLine: { height: 12, borderRadius: 8, marginBottom: 10 },

  // Empty quotes
  emptyQuotes: { alignItems: 'center', paddingVertical: 36 },
  emptyImage: { width: 140, height: 140, resizeMode: 'contain', marginBottom: 12 },
  emptyTitleText: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  emptySubText: { textAlign: 'center', color: '#64748B', marginTop: 8, marginBottom: 12 },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  refreshBtnText: { marginLeft: 8, color: '#0B6E4F', fontWeight: '800' },

  // Quote card redesigned
  quotesList: { marginTop: 6, paddingBottom: 8 },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    position: 'relative',
  },
  quoteCardPressed: { opacity: 0.95 },
  quoteCardSelected: { borderWidth: 2, borderColor: '#0B6E4F' },
  quoteImage: { width: 80, height: 80, borderTopLeftRadius: 14, borderBottomLeftRadius: 14, marginTop: 30, marginLeft: 10 },
  quoteContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  qTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', flex: 1, marginRight: 8 },
  qPriceWrap: { alignItems: 'flex-end' },
  qPrice: { fontSize: 16, fontWeight: '900', color: '#0B6E4F' },
  qPriceLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  qVendor: { marginTop: 6, color: '#64748B', fontWeight: '700' },
  qTagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  qTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FEF7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E6F6EA',
  },
  qTagText: { marginLeft: 6, fontSize: 11, color: '#0B6E4F', fontWeight: '800' },
  qFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qBenefit: { color: '#64748B', fontSize: 12 },
  qAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  qActionPrimary: { backgroundColor: '#0B6E4F' },
  qActionSelected: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#0B6E4F' },
  qActionText: { color: '#fff', fontWeight: '800', marginRight: 8 },
  qActionTextSelected: { color: '#0B6E4F' },

  selectedRibbon: { position: 'absolute', top: 10, right: 10, backgroundColor: '#0B6E4F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  selectedRibbonText: { color: '#fff', marginLeft: 6, fontSize: 11, fontWeight: '900' },

  // Sticky bottom
  stickyWrap: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center' },
  sticky: {
    width: width - 32,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  stickyMain: { fontWeight: '900', color: '#0F172A' },
  stickySub: { color: '#64748B', fontSize: 12 },
  stickyBtn: { backgroundColor: '#0B6E4F', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  stickyBtnText: { color: '#fff', fontWeight: '900' },
  summaryMiddleRow: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationItem: {
    flex: 1,
  },
  pickupLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  pickupValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  destLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'right',
  },
  destValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },
  assignedCardWrap: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  assignedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assignedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  assignedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2F3EC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  assignedStatusText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assignedLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
    fontWeight: 800,
    marginLeft: 5,
  },
  assignedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignedSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailsSectionWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  pillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  pillSecondaryText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
    gap: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsIcon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsDesc: {
    fontSize: 12,
    color: '#475569',
  },
  detailsDescMuted: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  detailsItem: {
    width: '47%',
    gap: 2,
  },
  detailsItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailsValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },

  // Car Rental Flow Styles
  carFlowContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 16,
  },
  statusCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  driverPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vehicleItem: {
    flex: 1,
  },
  vLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  vValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  otpCard: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  otpGradient: {
    padding: 20,
    alignItems: 'center',
  },
  otpLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  otpCode: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginVertical: 10,
  },
  otpInfo: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 12,
    bottom: 0,
    width: 2,
    backgroundColor: '#F1F5F9',
  },
  timelineText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

});

export default BookingDetails;

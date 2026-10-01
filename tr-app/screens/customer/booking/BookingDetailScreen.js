// BookingDetails — God Level Redesign
// Dark teal gradient header, glass cards, responsive sizing (wp/hp), premium typography
// NOTE: ALL existing logic, state names and functions are 100% intact. Only UI and styles were reworked.

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api, { BASE_URL, IMAGE_BASE_URL } from '../../api';
import chatService from '../../services/chatService';
import RefundStatusCard from '../../../components/RefundStatusCard';
import CancelBookingAction, { formatCancelDate } from '../../../components/CancelBookingAction';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

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
  const [chatLoading, setChatLoading] = useState(false);
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

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }
      return () => {
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF', true);
        }
      };
    }, [])
  );

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

        console.log('Car Rental Booking data:', data);

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
            acceptedDriverId: carBooking.acceptedDriverId,
            acceptedStaffId: carBooking.acceptedStaffId,
            vehicleNumber: carBooking.vehicleNumber,
            vehicleModel: carBooking.vehicleModel,
            created_at: carBooking.createdAt,
            updated_at: carBooking.updatedAt,
            dropReason: carBooking.dropReason,
            intermediateStops: carBooking.intermediateStops || [],
            trip_type: carBooking.tripType,
            baseFare: carBooking.baseFare,
            perKmRate: carBooking.perKmRate,
            chargeableKm: carBooking.chargeableKm,
            kmCharges: carBooking.kmCharges,
            driverBatta: carBooking.driverBatta,
            nightCharges: carBooking.nightCharges,
            tollCharges: carBooking.tollCharges,
            gst_amount: carBooking.gstAmount,
            advanceAmount: carBooking.advanceAmount,
            totalDays: carBooking.totalDays,
          });
          setQuotations([]);
          setAssignedVehicle(carBooking.vehicleModel || carBooking.carCategoryName);
          setAssignedDriver(carBooking.driverName ? { name: carBooking.driverName, phone: carBooking.driverPhone } : null);
        } else {
          console.warn('Car rental fetch failed:', data.error || data.message);
        }
      } else if (bookingType === 'bike') {
        // Bike booking - use new API
        response = await api.get(`/bike-bookings/${bookingId}`);
        data = response.data;

        console.log('Bike Booking data:', data);

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
          console.warn('Bike booking fetch failed:', data.error || data.message);
        }
      } else {
        // Regular booking - use unified API
        response = await api.get(`/customer-booking-detail/${bookingId}`);
        data = response.data;

        console.log('Booking data:', data);

        if (data.success) {
          // Check if this is a quote request or booking that needs redirection to specific screen
          if (data.type && data.redirectTo) {
            console.log(`Redirecting to ${data.redirectTo} screen for type: ${data.type}`);

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
            } else if (data.redirectTo === 'BikeBookingDetail') {
              navigation.replace('BikeBookingDetail', { bookingId: bookingId });
              return;
            } else if (data.redirectTo === 'BikeQuoteRequestDetail') {
              navigation.replace('BikeQuoteRequestDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'CarBookingDetail') {
              navigation.replace('SelfDriveBookingDetail', { bookingId: bookingId });
              return;
            } else if (data.redirectTo === 'SelfDriveQuoteRequestDetail') {
              navigation.replace('SelfDriveQuoteRequestDetail', { requestId: bookingId });
              return;
            } else if (data.redirectTo === 'ChauffeurBookingDetail') {
              // For now, handle chauffeur bookings in the current screen
              setBooking(data.booking);
              return;
            }
          }

          // Regular booking - fallback (for old bookings or unsupported types)
          setBooking(data.booking);
          setQuotations(data.quotations || []);
          setAssignedVehicle(data.assigned_vehicle || null);
          setAssignedDriver(data.assigned_driver || null);
        } else {
          console.warn('Booking fetch success=false:', data.message);
        }
      }
    } catch (err) {
      console.log('Booking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();

      const autoRefreshInterval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => clearInterval(autoRefreshInterval);
    }, [bookingId, bookingType])
  );

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

  const handleDriverChat = async () => {
    if (!booking?.id || (!booking?.acceptedDriverId && !booking?.acceptedStaffId)) {
      Alert.alert('Chat unavailable', 'Driver not yet assigned to this booking.');
      return;
    }
    try {
      setChatLoading(true);
      const result = await chatService.startDriverConversation(
        booking.id,
        booking.acceptedDriverId || null,
        booking.acceptedStaffId || null,
      );
      if (result?.conversation) {
        navigation.navigate('DriverChat', {
          conversationId: result.conversation.id,
          driverName: booking.driverName || 'Driver',
          bookingId: booking.id,
          bookingNumber: booking.booking_id || booking.bookingNumber || null,
          bookingType: booking.service_type || 'car',
        });
      }
    } catch (e) {
      console.log('Driver chat error:', e);
      Alert.alert('Error', 'Could not open chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
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
              <Text style={redesignStyles.qPrice}>{'\u20B9'}{quote?.price ?? '0'}</Text>
              <Text style={redesignStyles.qPriceLabel}>All inclusive</Text>
            </View>
          </View>

          <Text style={redesignStyles.qVendor} numberOfLines={1}>{quote?.vendor?.name ?? 'Vendor Name'}</Text>

          <View style={redesignStyles.qTagsRow}>
            {quote?.vehicle_type && (
              <View style={redesignStyles.qTagPill}>
                <Ionicons name="car-sport" size={wp('3%')} color={TEAL_MID} />
                <Text style={redesignStyles.qTagText}>{truncateText(quote.vehicle_type, 14)}</Text>
              </View>
            )}

            <View style={redesignStyles.qTagPill}>
              <Ionicons name="time" size={wp('3%')} color={TEAL_MID} />
              <Text style={redesignStyles.qTagText}>Instant</Text>
            </View>

            <View style={redesignStyles.qTagPill}>
              <Ionicons name="shield-checkmark" size={wp('3%')} color={TEAL_MID} />
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
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={redesignStyles.headerGrad}>
          <View style={[redesignStyles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
          <View style={[redesignStyles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} />
          <View style={redesignStyles.headerRow}>
            <TouchableOpacity onPress={handleBackPress} style={redesignStyles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={redesignStyles.headerTitle}>Loading...</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={{ color: TEXT_SECONDARY, marginTop: hp('1.5%'), fontSize: wp('3.5%'), fontWeight: '500' }}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking && !loading) {
    return (
      <SafeAreaView style={redesignStyles.container}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={redesignStyles.headerGrad}>
          <View style={[redesignStyles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
          <View style={[redesignStyles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} />
          <View style={redesignStyles.headerRow}>
            <TouchableOpacity onPress={handleBackPress} style={redesignStyles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={redesignStyles.headerTitle}>Booking Details</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={redesignStyles.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}
        >
          <View style={redesignStyles.emptyWrap}>
            <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={redesignStyles.emptyCircle}>
              <Ionicons name="document-text" size={wp('12%')} color={TEAL_MID} />
            </LinearGradient>
            <Text style={redesignStyles.emptyTitle}>Booking Not Found</Text>
            <Text style={redesignStyles.emptyDesc}>We could not find the booking you are looking for. It may have been removed.</Text>

            <TouchableOpacity style={redesignStyles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color={TEAL_MID} />
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
    if (upperStatus === 'DROPPED') return 'Dropped';
    return status || 'Pending';
  };

  // ---------- MAIN RENDER ----------
  return (
    <SafeAreaView style={redesignStyles.container}>
      <ScrollView
        style={redesignStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}
        contentContainerStyle={{ paddingBottom: hp('18%') }}
      >
        {/* Dark teal gradient header with glass summary card */}
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={redesignStyles.headerGrad}>
          {/* Decorative circles */}
          <View style={[redesignStyles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
          <View style={[redesignStyles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} />
          <View style={[redesignStyles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} />

          {/* Header row */}
          <View style={redesignStyles.headerRow}>
            <TouchableOpacity onPress={handleBackPress} style={redesignStyles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={redesignStyles.headerCenter}>
              <Text style={redesignStyles.headerTitle}>Booking Details</Text>
              <Text style={redesignStyles.headerSub}>
                {booking?.service_name || 'Service'}
                {bookingType === 'car' ? ` \u00B7 ${getFriendlyStatus(booking?.status, booking?.payment_status)}` : ` \u00B7 ${sortedQuotations.length} quotes`}
              </Text>
              {booking?.booking_id && (
                <Text style={{ fontSize: wp('2.8%'), color: 'rgba(255,255,255,0.75)', marginTop: hp('0.3%'), fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  ID: {booking.booking_id}
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: wp('2%') }}>
              <TouchableOpacity style={redesignStyles.headerActionBtn} onPress={onRefresh}>
                <Ionicons name="refresh" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={redesignStyles.headerActionBtn} onPress={handleShare}>
                <Ionicons name="share-social" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Glass summary card inside gradient */}
          <View style={redesignStyles.glassCard}>
            {/* Route row */}
            {(() => {
              const stops = (booking?.intermediateStops || []).filter(s => s.cityText);
              if (stops.length > 0) {
                // Multi-stop vertical timeline route display
                const allPoints = [
                  { label: 'Pickup', city: booking?.location_name || 'Pickup', type: 'pickup' },
                  ...stops.map((s, i) => ({ label: `Stop ${i + 1}`, city: s.cityText, type: 'stop' })),
                  { label: 'Destination', city: booking?.destination || booking?.location_name || 'Drop', type: 'drop' },
                ];
                return (
                  <View style={{ marginBottom: hp('0.5%') }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp('1%') }}>
                      <Ionicons name="navigate" size={wp('3.5%')} color="rgba(255,255,255,0.8)" />
                      <Text style={[redesignStyles.glassLabel, { marginLeft: wp('1.5%'), marginBottom: 0 }]}>
                        Route ({allPoints.length - 2} stop{allPoints.length - 2 !== 1 ? 's' : ''})
                      </Text>
                    </View>
                    {allPoints.map((point, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {/* Timeline dots and line */}
                        <View style={{ alignItems: 'center', width: wp('6%') }}>
                          <View style={{
                            width: point.type === 'stop' ? wp('2.5%') : wp('3%'),
                            height: point.type === 'stop' ? wp('2.5%') : wp('3%'),
                            borderRadius: wp('1.5%'),
                            backgroundColor: point.type === 'pickup' ? '#10B981' : point.type === 'drop' ? '#EF4444' : 'rgba(255,255,255,0.6)',
                            borderWidth: point.type === 'stop' ? 2 : 0,
                            borderColor: 'rgba(255,255,255,0.8)',
                          }} />
                          {i < allPoints.length - 1 && (
                            <View style={{
                              width: 2,
                              height: hp('2.5%'),
                              backgroundColor: 'rgba(255,255,255,0.25)',
                              marginVertical: hp('0.2%'),
                            }} />
                          )}
                        </View>
                        {/* Location text */}
                        <View style={{ flex: 1, marginLeft: wp('2%'), paddingBottom: i < allPoints.length - 1 ? hp('0.8%') : 0 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: wp('2.5%'), fontWeight: '500' }}>
                            {point.label}
                          </Text>
                          <Text style={{ color: '#fff', fontSize: wp('3.2%'), fontWeight: '700' }} numberOfLines={1}>
                            {point.city}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              }
              // Simple 2-point route
              return (
                <View style={redesignStyles.routeRow}>
                  <View style={redesignStyles.routeItem}>
                    <Text style={redesignStyles.glassLabel}>Pickup</Text>
                    <Text style={redesignStyles.glassValue} numberOfLines={1}>
                      {booking?.location_name || 'Pickup location'}
                    </Text>
                  </View>
                  <View style={redesignStyles.routeArrow}>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </View>
                  <View style={[redesignStyles.routeItem, { alignItems: 'flex-end' }]}>
                    <Text style={redesignStyles.glassLabel}>Destination</Text>
                    <Text style={[redesignStyles.glassValue, { textAlign: 'right' }]} numberOfLines={1}>
                      {booking?.destination || 'Destination'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Date and time chips */}
            <View style={redesignStyles.metaRow}>
              <View style={redesignStyles.metaChip}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={redesignStyles.metaChipText}>
                  {booking
                    ? (() => {
                        const raw = booking.journey_date || booking.journey_datetime;
                        if (!raw) return '-';
                        // Handle YYYY-MM-DD by appending T00:00:00 for RN Android compatibility
                        const dateStr = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T00:00:00' : raw;
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });
                      })()
                    : '-'}
                </Text>
              </View>

              <View style={redesignStyles.metaChip}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={redesignStyles.metaChipText}>
                  {booking
                    ? (() => {
                        if (booking.journey_time) return booking.journey_time;
                        const raw = booking.journey_datetime;
                        if (!raw) return '-';
                        const d = new Date(raw);
                        return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                      })()
                    : '-'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Drop Reason Banner */}
        {booking?.status === 'DROPPED' && booking?.dropReason && (
          <View style={{ backgroundColor: '#FEE2E2', padding: wp('4%'), borderRadius: wp('3%'), margin: wp('4%'), marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
            <Ionicons name="information-circle" size={wp('5.5%')} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: wp('3.5%'), fontWeight: '700', color: '#991B1B', marginBottom: hp('0.3%') }}>Booking Dropped</Text>
              <Text style={{ fontSize: wp('3%'), color: '#B91C1C', lineHeight: wp('4.5%') }}>{booking.dropReason}</Text>
            </View>
          </View>
        )}

        {/* Refund progress for a cancelled car-with-driver booking */}
        {bookingType === 'car' && booking?.id && ['CANCELLED', 'REFUNDED'].includes(String(booking.status).toUpperCase()) && (
          <RefundStatusCard source="chauffeur_bookings" bookingId={booking.id} />
        )}

        {/* Assigned vehicle & driver (only for ongoing) */}
        {booking?.status === 'Ongoing' && (assignedVehicle || assignedDriver) && (
          <View style={redesignStyles.assignedCardWrap}>
            <View style={redesignStyles.assignedCardHeader}>
              <Text style={redesignStyles.assignedTitle}>Your assigned ride</Text>
              <View style={redesignStyles.assignedStatusPill}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL, marginRight: wp('1%') }} />
                <Text style={redesignStyles.assignedStatusText}>Ongoing</Text>
              </View>
            </View>

            {/* Combined row layout */}
            <View style={redesignStyles.assignedContentRow}>
              {/* Vehicle Info */}
              {(assignedVehicle || booking?.vehicleModel || booking?.vehicleNumber) && (
                <View style={{ flex: 1, marginRight: wp('2.5%') }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp('0.5%') }}>
                    <View style={redesignStyles.assignedIconCircle}>
                      <Ionicons name="car-sport" size={wp('4%')} color={TEAL_MID} />
                    </View>
                    <Text style={redesignStyles.assignedLabel}>Vehicle</Text>
                  </View>
                  <Text style={redesignStyles.assignedValue}>
                    {typeof assignedVehicle === 'string'
                      ? assignedVehicle
                      : (assignedVehicle?.vehicle_name || assignedVehicle?.model || booking?.vehicleModel || booking?.vehicle_name || 'Vehicle')}
                  </Text>
                  {(() => {
                    const vehicleType = assignedVehicle?.vehicle_type || booking?.car_type;
                    return vehicleType && vehicleType !== '-' && vehicleType !== '' ? (
                      <Text style={{ color: TEXT_SECONDARY, fontSize: wp('3%'), marginTop: 2 }}>
                        Type: {vehicleType}
                      </Text>
                    ) : null;
                  })()}
                  {(() => {
                    const regNo = assignedVehicle?.reg_no || booking?.vehicleNumber;
                    return regNo && regNo !== '-' && regNo !== '' ? (
                      <Text style={{ color: TEXT_MUTED, fontSize: wp('3%'), marginTop: 2 }}>
                        Reg No: {regNo}
                      </Text>
                    ) : null;
                  })()}
                </View>
              )}

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: '#E5E7EB', alignSelf: 'stretch', marginHorizontal: wp('2%') }} />

              {/* Driver Info */}
              {assignedDriver && (
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp('0.5%') }}>
                    <View style={[redesignStyles.assignedIconCircle, { backgroundColor: '#EDE9FE' }]}>
                      <Ionicons name="person" size={wp('4%')} color="#7C3AED" />
                    </View>
                    <Text style={redesignStyles.assignedLabel}>Driver</Text>
                  </View>
                  <Text style={redesignStyles.assignedValue}>
                    {assignedDriver.name || assignedDriver.full_name || booking?.driverName || 'Driver'}
                  </Text>
                  {(assignedDriver.phone || booking?.driverPhone) && (
                    <TouchableOpacity
                      onPress={() => handleCallDriver(assignedDriver.phone || booking?.driverPhone)}
                      style={redesignStyles.callPillBtn}
                    >
                      <Ionicons name="call" size={wp('3%')} color={TEAL_MID} />
                      <Text style={{ color: TEAL_MID, fontSize: wp('3%'), marginLeft: wp('1%'), fontWeight: '600' }}>
                        {assignedDriver.phone || booking?.driverPhone}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* VEHICLE / SERVICE DETAILS */}
        {booking && (
          <View style={redesignStyles.detailsSectionWrap}>

            {/* A. Core service pills */}
            <View style={redesignStyles.pillRow}>
              {booking.service_name ? (
                <View style={redesignStyles.pill}>
                  <Ionicons name="briefcase-outline" size={wp('3.2%')} color={TEAL_MID} />
                  <Text style={redesignStyles.pillText}>{booking.service_name}</Text>
                </View>
              ) : null}

              {booking.trip_type ? (
                <View style={redesignStyles.pillSecondary}>
                  <Ionicons name="navigate-outline" size={wp('3%')} color={TEXT_PRIMARY} />
                  <Text style={redesignStyles.pillSecondaryText}>
                    {mapTripType(booking.trip_type)}
                  </Text>
                </View>
              ) : null}

              {booking.location_type ? (
                <View style={redesignStyles.pillSecondary}>
                  <Ionicons name="location-outline" size={wp('3%')} color={TEXT_PRIMARY} />
                  <Text style={redesignStyles.pillSecondaryText}>
                    {booking.location_type === '1' ? 'Outstation' : 'Local'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Multi-Stop Route Card */}
            {(() => {
              const stops = (booking?.intermediateStops || []).filter(s => s.cityText);
              if (stops.length === 0) return null;
              const allPoints = [
                { label: 'Pickup', city: booking?.location_name || 'Pickup', type: 'pickup' },
                ...stops.map((s, i) => ({ label: `Stop ${i + 1}`, city: s.cityText, type: 'stop' })),
                { label: 'Destination', city: booking?.destination || 'Drop', type: 'drop' },
              ];
              return (
                <View style={redesignStyles.detailsCard}>
                  <View style={redesignStyles.detailsHeader}>
                    <View style={[redesignStyles.detailsIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="git-branch-outline" size={wp('4%')} color="#2563EB" />
                    </View>
                    <Text style={redesignStyles.detailsTitle}>
                      Route ({stops.length} stop{stops.length !== 1 ? 's' : ''})
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: wp('2%'), paddingVertical: hp('0.5%') }}>
                    {allPoints.map((point, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ alignItems: 'center', width: wp('7%') }}>
                          <View style={{
                            width: point.type === 'stop' ? wp('3%') : wp('3.5%'),
                            height: point.type === 'stop' ? wp('3%') : wp('3.5%'),
                            borderRadius: wp('2%'),
                            backgroundColor: point.type === 'pickup' ? TEAL : point.type === 'drop' ? '#EF4444' : '#F59E0B',
                          }} />
                          {i < allPoints.length - 1 && (
                            <View style={{
                              width: 2,
                              flex: 1,
                              minHeight: hp('3%'),
                              backgroundColor: '#E5E7EB',
                              marginVertical: hp('0.3%'),
                            }} />
                          )}
                        </View>
                        <View style={{ flex: 1, marginLeft: wp('2.5%'), paddingBottom: i < allPoints.length - 1 ? hp('1%') : 0 }}>
                          <Text style={{ color: TEXT_MUTED, fontSize: wp('2.8%'), fontWeight: '500' }}>{point.label}</Text>
                          <Text style={{ color: TEXT_PRIMARY, fontSize: wp('3.5%'), fontWeight: '600', marginTop: hp('0.2%') }}>
                            {point.city}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* B. Car / Cab details - Hide for car rentals */}
            {bookingType !== 'car' && (booking.vehicle_type || booking.car_type || booking.total_passangers || booking.fuel_type || booking.transmission) ? (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={redesignStyles.detailsIcon}>
                    <Ionicons name="car-sport" size={wp('4%')} color={TEAL_MID} />
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
                      <Ionicons name="home-outline" size={wp('3.5%')} color={TEAL_MID} />
                      <Text style={redesignStyles.detailsValue}>Doorstep delivery</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* Specific Details based on service */}
            {booking?.vehicle_name && (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="car-outline" size={wp('4%')} color="#B45309" />
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
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="bicycle-outline" size={wp('4%')} color="#2563EB" />
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
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="airplane-outline" size={wp('4%')} color="#C2410C" />
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
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="cube-outline" size={wp('4%')} color="#DC2626" />
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
                      <Ionicons name="pin-outline" size={wp('3.5%')} color={TEXT_PRIMARY} />
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
                  <View style={[redesignStyles.detailsIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="home-outline" size={wp('4%')} color="#1D4ED8" />
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

            {/* Car Rental — Pricing & Payment Summary */}
            {bookingType === 'car' && booking && (booking.grand_total || booking.total_amount) && (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={redesignStyles.detailsIcon}>
                    <Ionicons name="receipt-outline" size={wp('4%')} color={TEAL_MID} />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Fare Breakdown</Text>
                </View>

                {/* Fare rows */}
                {booking.chargeableKm > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Distance ({booking.chargeableKm} km{booking.perKmRate ? ` × ₹${booking.perKmRate}/km` : ''})</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₹{(booking.kmCharges || booking.baseFare || 0).toLocaleString()}</Text>
                  </View>
                )}
                {booking.driverBatta > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Driver allowance{booking.totalDays ? ` (${booking.totalDays}d)` : ''}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₹{booking.driverBatta.toLocaleString()}</Text>
                  </View>
                )}
                {booking.nightCharges > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Night charges</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₹{booking.nightCharges.toLocaleString()}</Text>
                  </View>
                )}
                {booking.tollCharges > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Toll charges</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₹{booking.tollCharges.toLocaleString()}</Text>
                  </View>
                )}
                {booking.gst_amount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>GST</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₹{booking.gst_amount.toLocaleString()}</Text>
                  </View>
                )}

                {/* Total */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Total Amount</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: TEAL_MID }}>₹{(booking.grand_total || booking.total_amount || 0).toLocaleString()}</Text>
                </View>

                {/* Payment Status */}
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Paid (Advance)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>₹{(booking.paid_amount || booking.advanceAmount || 0).toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Remaining</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>
                      ₹{Math.max(0, (booking.grand_total || booking.total_amount || 0) - (booking.paid_amount || booking.advanceAmount || 0)).toLocaleString()}
                    </Text>
                  </View>
                  {booking.transaction_id && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>Transaction ID</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>{booking.transaction_id}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Car Rental — Return Date & Time */}
            {bookingType === 'car' && booking?.return_date && (
              <View style={redesignStyles.detailsCard}>
                <View style={redesignStyles.detailsHeader}>
                  <View style={redesignStyles.detailsIcon}>
                    <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_MID} />
                  </View>
                  <Text style={redesignStyles.detailsTitle}>Return Details</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Ionicons name="return-down-back-outline" size={16} color="#64748B" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>
                    {(() => {
                      const raw = booking.return_date;
                      const dateStr = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T00:00:00' : raw;
                      const d = new Date(dateStr);
                      return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </Text>
                </View>
              </View>
            )}

            {/* Car Rental Specific Views */}
            {bookingType === 'car' && booking && (
              <View style={redesignStyles.carFlowContainer}>
                {/* 1. Payment Verification Card */}
                {getFriendlyStatus(booking?.status, booking?.payment_status) === 'Payment Verification Pending' && (
                  <View style={redesignStyles.statusCard}>
                    <View style={redesignStyles.statusIconCircle}>
                      <Ionicons name="time-outline" size={wp('6%')} color="#B45309" />
                    </View>
                    <View style={redesignStyles.statusTextWrap}>
                      <Text style={[redesignStyles.statusTitle, { color: '#B45309' }]}>Payment Verification Pending</Text>
                      <Text style={redesignStyles.statusDesc}>We have received your payment details. Admin is currently verifying the transaction. Once verified, we will start assigning a vendor for your trip.</Text>
                    </View>
                  </View>
                )}

                {/* 2. Driver Info Card */}
                {booking?.driverName && (
                  <View style={redesignStyles.driverCard}>
                    <View style={redesignStyles.assignedCardHeader}>
                      <Text style={redesignStyles.assignedTitle}>Your Driver Details</Text>
                      <View style={[redesignStyles.assignedStatusPill, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="checkmark-circle" size={wp('3%')} color="#059669" />
                        <Text style={[redesignStyles.assignedStatusText, { color: '#059669' }]}>Assigned</Text>
                      </View>
                    </View>

                    <View style={redesignStyles.driverRow}>
                      <View style={redesignStyles.driverAvatar}>
                        <Ionicons name="person" size={wp('7%')} color="#64748B" />
                      </View>
                      <View style={redesignStyles.driverDetails}>
                        <Text style={redesignStyles.driverName}>{booking.driverName}</Text>
                        <Text style={redesignStyles.driverPhone}>{booking.driverPhone}</Text>
                      </View>
                      <TouchableOpacity
                        style={redesignStyles.callBtn}
                        onPress={() => handleCallDriver(booking.driverPhone)}
                      >
                        <LinearGradient colors={[TEAL_MID, '#059669']} style={redesignStyles.callBtnGradient}>
                          <Ionicons name="call" size={wp('5%')} color="#fff" />
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[redesignStyles.callBtn, { marginLeft: wp('2%') }]}
                        onPress={handleDriverChat}
                        disabled={chatLoading}
                      >
                        <LinearGradient colors={['#0D7377', '#14A085']} style={redesignStyles.callBtnGradient}>
                          {chatLoading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="chatbubble-ellipses" size={wp('5%')} color="#fff" />
                          }
                        </LinearGradient>
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
                      colors={[TEAL_DEEP, '#059669']}
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
                  {(() => {
                    const isDropped = booking?.status?.toUpperCase() === 'DROPPED';
                    const paymentDone = ['PAID', 'PARTIAL', 'SUBMITTED'].includes(booking?.payment_status);
                    const vendorDone = !!booking?.acceptedVendorId;
                    const driverDone = !!booking?.driverName;

                    let droppedAfterStep = 0;
                    if (driverDone) droppedAfterStep = 3;
                    else if (vendorDone) droppedAfterStep = 2;
                    else if (paymentDone) droppedAfterStep = 1;

                    const steps = [
                      { label: 'Booking Received', done: true },
                      { label: 'Payment Verified', done: paymentDone },
                      { label: 'Vendor Confirmed', done: vendorDone },
                      { label: 'Driver Assigned', done: driverDone },
                    ];

                    const timelineItems = [];
                    for (let i = 0; i < steps.length; i++) {
                      const step = steps[i];
                      const isAfterDrop = isDropped && i > droppedAfterStep;
                      timelineItems.push({
                        label: step.label,
                        dotColor: isAfterDrop ? '#D1D5DB' : (step.done ? '#059669' : '#E2E8F0'),
                        textColor: isAfterDrop ? '#9CA3AF' : '#475569',
                        showCheck: step.done && !isAfterDrop,
                        hasLine: true,
                      });
                      if (isDropped && i === droppedAfterStep) {
                        timelineItems.push({
                          label: 'Booking Dropped',
                          subLabel: booking?.dropReason || null,
                          dotColor: '#DC2626',
                          textColor: '#DC2626',
                          showCheck: false,
                          isDroppedMarker: true,
                          hasLine: true,
                        });
                      }
                    }
                    if (timelineItems.length > 0) {
                      timelineItems[timelineItems.length - 1].hasLine = false;
                    }

                    return (
                      <View style={redesignStyles.timeline}>
                        {timelineItems.map((item, idx) => (
                          <View key={idx} style={redesignStyles.timelineItem}>
                            <View style={[redesignStyles.timelineDot, { backgroundColor: item.dotColor }]}>
                              {item.showCheck && <Ionicons name="checkmark" size={wp('2.5%')} color="#FFF" />}
                              {item.isDroppedMarker && <Ionicons name="close" size={wp('2.5%')} color="#FFF" />}
                            </View>
                            {item.hasLine && <View style={redesignStyles.timelineLine} />}
                            <View style={{ flex: 1 }}>
                              <Text style={[redesignStyles.timelineText, { color: item.textColor }, item.isDroppedMarker && { fontWeight: '700', fontSize: 14 }]}>{item.label}</Text>
                              {item.subLabel ? <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Reason: {item.subLabel}</Text> : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })()}
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
                    size={wp('4.2%')}
                    color={TEAL}
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
                    <Ionicons name="refresh" size={16} color={TEAL_MID} />
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

        {/* ── Rate Your Experience ── */}
        {bookingType === 'car' && booking && booking.status === 'COMPLETED' && (
          booking.rating ? (
            <View style={redesignStyles.ratedCard}>
              <View style={redesignStyles.ratedHeader}>
                <Ionicons name="checkmark-circle" size={wp('5%')} color={TEAL_MID} />
                <Text style={redesignStyles.ratedTitle}>Your Rating</Text>
              </View>
              <View style={redesignStyles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons key={s} name={s <= booking.rating ? 'star' : 'star-outline'} size={wp('6%')} color="#FFB800" />
                ))}
              </View>
              {booking.review ? <Text style={redesignStyles.ratedReview}>"{booking.review}"</Text> : null}
            </View>
          ) : (
            <TouchableOpacity
              style={redesignStyles.rateBtn}
              onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: bookingType })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={redesignStyles.rateBtnGrad}>
                <Ionicons name="star" size={wp('5%')} color="#FFB800" />
                <Text style={redesignStyles.rateBtnText}>Rate Your Experience</Text>
                <Ionicons name="chevron-forward" size={wp('5%')} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )
        )}

        {/* Car with driver can be cancelled until the trip starts (same statuses the API accepts) */}
        {bookingType === 'car' && booking?.id &&
          ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'].includes(String(booking.status).toUpperCase()) && (
          <CancelBookingAction
            path={`/car-rental/bookings/${booking.id}`}
            booking={{
              title: booking.vehicle_name || 'Car with driver',
              number: booking.booking_id,
              when: formatCancelDate(booking.journey_date),
              paid: booking.paid_amount || 0,
            }}
            onDone={fetchData}
            style={{ marginBottom: hp('3%') }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- REDESIGNED STYLES (GOD LEVEL) ----------
const redesignStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Gradient Header
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: wp('5%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: wp('4%'),
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  headerActionBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Glass summary card
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassLabel: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  glassValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: hp('0.3%'),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
  },
  routeItem: {
    flex: 1,
  },
  routeArrow: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp('2%'),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('5%'),
    gap: wp('1.5%'),
  },
  metaChipText: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  scroll: { flex: 1 },

  // Assigned vehicle/driver card
  assignedCardWrap: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  assignedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  assignedTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  assignedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: 999,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.4%'),
  },
  assignedStatusText: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  assignedContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginTop: hp('0.5%'),
  },
  assignedIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
  },
  assignedLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  assignedValue: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginLeft: wp('1.5%'),
  },
  callPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('2%'),
    alignSelf: 'flex-start',
  },

  // Details section
  detailsSectionWrap: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    gap: hp('1.2%'),
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 999,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    gap: wp('1.5%'),
  },
  pillText: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  pillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    gap: wp('1.2%'),
  },
  pillSecondaryText: {
    fontSize: wp('2.8%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },

  // Detail cards
  detailsCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    gap: hp('0.8%'),
    ...SHADOW_SM,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  detailsIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailsDesc: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('11.5%'),
  },
  detailsDescMuted: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: 2,
    marginLeft: wp('11.5%'),
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
    marginTop: hp('0.3%'),
    marginLeft: wp('11.5%'),
  },
  detailsItem: {
    width: '46%',
    gap: 2,
  },
  detailsItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  detailsLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  detailsValue: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },

  // Car Rental Flow
  carFlowContainer: {
    gap: hp('1.5%'),
  },
  statusCard: {
    flexDirection: 'row',
    padding: wp('4%'),
    borderRadius: wp('4%'),
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: wp('3%'),
    ...SHADOW_SM,
  },
  statusIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    marginBottom: hp('0.4%'),
  },
  statusDesc: {
    fontSize: wp('3%'),
    lineHeight: wp('4.5%'),
    color: TEXT_SECONDARY,
  },

  // Driver card
  driverCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.8%'),
    backgroundColor: '#F8FAFC',
    padding: wp('3%'),
    borderRadius: wp('3%'),
  },
  driverAvatar: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  driverName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  driverPhone: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  callBtn: {
    borderRadius: wp('6%'),
    overflow: 'hidden',
  },
  callBtnGradient: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    marginTop: hp('1.2%'),
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vehicleItem: {
    flex: 1,
  },
  vLabel: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  vValue: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: 2,
  },

  // OTP Card
  otpCard: {
    borderRadius: wp('4%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  otpGradient: {
    padding: wp('5%'),
    alignItems: 'center',
  },
  otpLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: wp('3%'),
    fontWeight: '700',
    letterSpacing: 2,
  },
  otpCode: {
    color: '#fff',
    fontSize: wp('11%'),
    fontWeight: '900',
    letterSpacing: 8,
    marginVertical: hp('1%'),
  },
  otpInfo: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: wp('2.8%'),
    textAlign: 'center',
  },

  // Timeline
  timelineCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  timelineTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
  },
  timeline: {
    paddingLeft: wp('1%'),
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    paddingBottom: hp('2.5%'),
  },
  timelineDot: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#E2E8F0',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    left: wp('2.3%'),
    top: wp('5%'),
    bottom: 0,
    width: 2.5,
    backgroundColor: '#E5E7EB',
  },
  timelineText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },

  // Quotes section
  quotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  quotesTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  quotesSub: {
    color: TEXT_SECONDARY,
    fontSize: wp('3.2%'),
    marginTop: hp('0.3%'),
  },
  sortBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('2.5%'),
    gap: wp('1.5%'),
  },
  sortText: {
    color: TEAL_MID,
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  bodyWrap: { marginTop: hp('1%') },

  // Skeletons
  skeletonList: { gap: hp('1.2%') },
  skelCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.2%'),
    alignItems: 'center',
    padding: wp('3%'),
    ...SHADOW_SM,
  },
  skelImage: { width: wp('24%'), height: wp('24%'), borderRadius: wp('3%'), marginRight: wp('3%') },
  skelRight: { flex: 1 },
  skelLine: { height: hp('1.4%'), borderRadius: wp('2%'), marginBottom: hp('1%') },

  // Empty quotes
  emptyQuotes: { alignItems: 'center', paddingVertical: hp('4%') },
  emptyImage: { width: wp('35%'), height: wp('35%'), resizeMode: 'contain', marginBottom: hp('1.5%') },
  emptyTitleText: { fontSize: wp('4.2%'), fontWeight: '800', color: TEXT_PRIMARY },
  emptySubText: { textAlign: 'center', color: TEXT_SECONDARY, marginTop: hp('1%'), marginBottom: hp('1.5%'), fontSize: wp('3.2%'), paddingHorizontal: wp('5%') },

  // Empty state
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingHorizontal: wp('8%') },
  emptyCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: { fontSize: wp('4.5%'), fontWeight: '800', color: TEXT_PRIMARY, marginBottom: hp('0.8%') },
  emptyDesc: { textAlign: 'center', color: TEXT_SECONDARY, fontSize: wp('3.3%'), lineHeight: wp('5%'), marginBottom: hp('2%') },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  refreshBtnText: { marginLeft: wp('2%'), color: TEAL_MID, fontWeight: '700', fontSize: wp('3.3%') },

  // Quote cards
  quotesList: { marginTop: hp('0.5%'), paddingBottom: hp('1%') },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
    position: 'relative',
    ...SHADOW_MD,
  },
  quoteCardPressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  quoteCardSelected: { borderWidth: 2, borderColor: TEAL_MID },
  quoteImage: { width: wp('22%'), height: wp('22%'), borderTopLeftRadius: wp('4%'), borderBottomLeftRadius: wp('4%'), marginTop: wp('7%'), marginLeft: wp('2.5%') },
  quoteContent: { flex: 1, padding: wp('3%'), justifyContent: 'space-between' },
  qTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qTitle: { fontSize: wp('3.5%'), fontWeight: '800', color: TEXT_PRIMARY, flex: 1, marginRight: wp('2%') },
  qPriceWrap: { alignItems: 'flex-end' },
  qPrice: { fontSize: wp('4%'), fontWeight: '900', color: TEAL_MID },
  qPriceLabel: { fontSize: wp('2.6%'), color: TEXT_MUTED, marginTop: 2 },
  qVendor: { marginTop: hp('0.5%'), color: TEXT_SECONDARY, fontWeight: '700', fontSize: wp('3.2%') },
  qTagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: hp('0.8%'), gap: wp('2%') },
  qTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: wp('1%'),
  },
  qTagText: { fontSize: wp('2.6%'), color: TEAL_MID, fontWeight: '700' },
  qFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: hp('0.5%') },
  qBenefit: { color: TEXT_SECONDARY, fontSize: wp('2.8%') },

  selectedRibbon: {
    position: 'absolute',
    top: wp('2.5%'),
    right: wp('2.5%'),
    backgroundColor: TEAL_MID,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedRibbonText: { color: '#fff', marginLeft: wp('1.5%'), fontSize: wp('2.6%'), fontWeight: '900' },
  rateBtn: { marginHorizontal: wp('4%'), marginBottom: hp('1.5%'), borderRadius: wp('3%'), overflow: 'hidden' },
  rateBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp('2%'), paddingHorizontal: wp('4%'), gap: wp('2%') },
  rateBtnText: { color: '#fff', fontSize: wp('4%'), fontWeight: '700', flex: 1, textAlign: 'center' },
  ratedCard: { marginHorizontal: wp('4%'), marginBottom: hp('1.5%'), borderRadius: wp('3%'), backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', padding: wp('4%'), alignItems: 'center' },
  ratedHeader: { flexDirection: 'row', alignItems: 'center', gap: wp('2%'), marginBottom: hp('1%') },
  ratedTitle: { fontSize: wp('4%'), fontWeight: '700', color: '#0F172A' },
  starsRow: { flexDirection: 'row', gap: wp('1%'), marginBottom: hp('0.5%') },
  ratedReview: { fontSize: wp('3.5%'), color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: hp('0.5%') },
});

export default BookingDetails;

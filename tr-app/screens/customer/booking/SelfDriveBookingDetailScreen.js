import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const SelfDriveBookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, [])
  );

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookingDetails();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchBookingDetails();
      }, 30000);

      return () => clearInterval(interval);
    }, [bookingId])
  );

  const fetchBookingDetails = async () => {
    try {
      setError(null);
      const response = await api.get(`/self-drive-bookings/${bookingId}`);

      if (response.data.success && response.data.booking) {
        setBooking(response.data.booking);
      } else {
        setError('Failed to load booking details');
      }
    } catch (err) {
      console.log('Error fetching booking:', err?.message || 'Unknown error');
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load booking details';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookingDetails();
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.patch(`/self-drive-bookings/${bookingId}`, {
                action: 'cancel',
                reason: 'Cancelled by customer',
              });
              if (response.data.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                fetchBookingDetails();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  // Parse array data from API (handles both string and array formats)
  const parseListData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(item => item && item.trim());
    if (typeof data === 'string') {
      if (data.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) return parsed.filter(item => item && item.trim());
        } catch (e) {}
      }
      return data.split(/\n|,/).map(item => item.trim()).filter(item => item && item !== '');
    }
    return [];
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

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return '#f39c12';
      case 'PAYMENT_SUBMITTED':
        return '#3498db';
      case 'PAYMENT_VERIFIED':
        return '#27ae60';
      case 'BROADCASTED':
      case 'PENDING_VENDOR':
        return '#9b59b6';
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'READY_FOR_PICKUP':
        return TEAL;
      case 'IN_PROGRESS':
        return '#2980b9';
      case 'COMPLETED':
        return '#27ae60';
      case 'CANCELLED':
      case 'REJECTED':
      case 'DROPPED':
        return '#e74c3c';
      case 'EXPIRED':
      case 'REFUNDED':
        return '#95a5a6';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Awaiting Payment';
      case 'PAYMENT_SUBMITTED':
        return 'Verifying Payment';
      case 'PAYMENT_VERIFIED':
        return 'Payment Verified';
      case 'BROADCASTED':
        return 'Finding Vendors';
      case 'PENDING_VENDOR':
        return 'Awaiting Vendor';
      case 'ACCEPTED':
        return 'Vendor Assigned';
      case 'CONFIRMED':
        return 'Booking Confirmed';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      case 'IN_PROGRESS':
        return 'Ride In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REJECTED':
        return 'Rejected';
      case 'EXPIRED':
        return 'Expired';
      case 'REFUNDED':
        return 'Refunded';
      case 'DROPPED':
        return 'Dropped';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.loadingHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGradient}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Booking Details</Text>
              <View style={{ width: wp('10%') }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={wp('12%')} color="#e74c3c" />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchBookingDetails}>
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const canCancel = booking && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'IN_PROGRESS'].includes(booking.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGradient}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Booking Details</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate('BookingChat', {
                  bookingId: booking?.id,
                  bookingNumber: booking?.bookingNumber,
                  vendorName: booking?.acceptedVendor?.businessName || booking?.assignedVendor?.businessName || 'Vendor'
                })}
              >
                <Ionicons name="chatbubble-outline" size={wp('5%')} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
                <Ionicons name="refresh" size={wp('4.8%')} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{getStatusLabel(booking.status)}</Text>
          </View>
          <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>
          <Text style={styles.bookingDate}>
            Booked on {formatDate(booking.createdAt)}
          </Text>
        </View>

        {/* Drop Reason Banner */}
        {booking.status === 'DROPPED' && booking.dropReason && (
          <View style={{ backgroundColor: '#FEE2E2', padding: wp('4%'), borderRadius: wp('3%'), marginBottom: hp('1.5%'), flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
            <Ionicons name="information-circle" size={wp('5.5%')} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: wp('3.5%'), fontWeight: '700', color: '#991B1B', marginBottom: hp('0.3%') }}>Booking Dropped</Text>
              <Text style={{ fontSize: wp('3%'), color: '#B91C1C', lineHeight: wp('4.5%') }}>{booking.dropReason}</Text>
            </View>
          </View>
        )}

        {/* Vehicle Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <Ionicons name="car-sport" size={wp('5%')} color={TEAL} />
            </View>
            <Text style={styles.cardTitle}>Vehicle Details</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleBrand}>{booking.brand}</Text>
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            <View style={styles.specsRow}>
              {booking.transmission && (
                <View style={styles.specBadge}>
                  <Ionicons name="cog" size={wp('3.5%')} color={TEAL} />
                  <Text style={styles.specBadgeText}>{booking.transmission}</Text>
                </View>
              )}
              {booking.fuelType && (
                <View style={styles.specBadge}>
                  <Ionicons name="water" size={wp('3.5%')} color={TEAL} />
                  <Text style={styles.specBadgeText}>{booking.fuelType}</Text>
                </View>
              )}
              {booking.seats && (
                <View style={styles.specBadge}>
                  <Ionicons name="people" size={wp('3.5%')} color={TEAL} />
                  <Text style={styles.specBadgeText}>{booking.seats} Seats</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="calendar-outline" size={wp('5%')} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: TEAL }]} />
              <View style={styles.tripInfo}>
                <Text style={styles.tripLabel}>PICKUP</Text>
                <Text style={styles.tripDate}>{formatDate(booking.pickupDate)}</Text>
                <Text style={styles.tripTime}>{formatTime(booking.pickupTime)}</Text>
              </View>
            </View>
            <View style={styles.tripLine} />
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: '#e74c3c' }]} />
              <View style={styles.tripInfo}>
                <Text style={styles.tripLabel}>DROP</Text>
                <Text style={styles.tripDate}>{formatDate(booking.dropDate)}</Text>
                <Text style={styles.tripTime}>{formatTime(booking.dropTime)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={[styles.locationIconCircle]}>
              <Ionicons name="location" size={wp('4%')} color={TEAL} />
            </View>
            <Text style={styles.locationText}>{booking.locationName || booking.location?.name || booking.pickupAddress}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={wp('4%')} color={TEAL} />
            <Text style={styles.durationText}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''} Rental</Text>
          </View>
        </View>

        {/* KM Limit Info */}
        {(booking.kmLimitPerDay > 0 || booking.extraKmRate > 0) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="speedometer-outline" size={wp('5%')} color="#F97316" />
              </View>
              <Text style={styles.cardTitle}>KM Limit</Text>
            </View>
            {booking.kmLimitPerDay > 0 && (
              <View style={styles.kmRow}>
                <Text style={styles.kmLabel}>Daily KM Limit</Text>
                <Text style={styles.kmValue}>{booking.kmLimitPerDay} km/day</Text>
              </View>
            )}
            {booking.extraKmRate > 0 && (
              <View style={styles.kmRow}>
                <Text style={styles.kmLabel}>Extra KM Charge</Text>
                <Text style={styles.kmValue}>{'\u20B9'}{booking.extraKmRate}/km</Text>
              </View>
            )}
          </View>
        )}

        {/* View Quote Details Button */}
        {booking.quote && (
          <TouchableOpacity
            style={styles.viewQuoteDetailsBtn}
            onPress={() => setQuoteDetailsVisible(true)}
          >
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.viewQuoteGradient}>
              <Ionicons name="document-text-outline" size={wp('5.5%')} color="#FFF" />
              <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
              <Ionicons name="chevron-forward" size={wp('5%')} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Price Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="pricetag-outline" size={wp('5%')} color={TEAL} />
            </View>
            <Text style={styles.cardTitle}>Price Breakdown</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Daily Rate x {booking.totalDays}</Text>
            <Text style={styles.priceValue}>{'\u20B9'}{booking.dailyRate * booking.totalDays}</Text>
          </View>

          {booking.securityDeposit > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Security Deposit (Refundable)</Text>
              <Text style={styles.priceValue}>{'\u20B9'}{booking.securityDeposit}</Text>
            </View>
          )}

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{'\u20B9'}{booking.grandTotal}</Text>
          </View>

          {booking.paidAmount > 0 && (
            <View style={styles.paidRow}>
              <Ionicons name="checkmark-circle" size={wp('4.5%')} color={TEAL} />
              <Text style={styles.paidText}>{'\u20B9'}{booking.paidAmount} Paid</Text>
            </View>
          )}
        </View>

        {/* Advance Payment Card - Show when payment is pending */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <View style={styles.advanceCard}>
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.advanceHeader}>
              <Ionicons name="wallet-outline" size={wp('5.5%')} color="#fff" />
              <Text style={styles.advanceHeaderText}>Advance Payment Required</Text>
            </LinearGradient>
            <View style={styles.advanceBody}>
              <View style={styles.advanceAmountRow}>
                <Text style={styles.advanceLabel}>Advance ({booking.advancePercentage || 30}%)</Text>
                <Text style={styles.advanceAmount}>{'\u20B9'}{booking.advanceAmount}</Text>
              </View>
              <Text style={styles.advanceNote}>
                Pay advance to confirm your booking. Balance amount of {'\u20B9'}{booking.grandTotal - booking.advanceAmount} to be paid at pickup.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PaymentScreen', {
                  bookingId: booking.id,
                  bookingType: 'self-drive',
                  amount: booking.advanceAmount
                })}
              >
                <LinearGradient colors={[TEAL, '#059669']} style={styles.payNowBtn}>
                  <Ionicons name="card-outline" size={wp('4.5%')} color="#fff" />
                  <Text style={styles.payNowBtnText}>Pay {'\u20B9'}{booking.advanceAmount} Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Verification Pending Card */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <View style={styles.verificationCard}>
            <View style={styles.verificationIconWrap}>
              <Ionicons name="hourglass-outline" size={wp('7%')} color="#f39c12" />
            </View>
            <View style={styles.verificationContent}>
              <Text style={styles.verificationTitle}>Payment Verification Pending</Text>
              <Text style={styles.verificationText}>
                Your payment of {'\u20B9'}{booking.advanceAmount || booking.paidAmount} has been submitted. Our team is verifying it. You'll be notified once confirmed.
              </Text>
            </View>
          </View>
        )}

        {/* Payment Verified - Finding Vendor */}
        {(booking.status === 'PAYMENT_VERIFIED' || booking.status === 'BROADCASTED') && (
          <View style={styles.findingVendorCard}>
            <View style={styles.findingVendorIconWrap}>
              <Ionicons name="search-outline" size={wp('7%')} color="#3498db" />
            </View>
            <View style={styles.findingVendorContent}>
              <Text style={styles.findingVendorTitle}>Finding Best Vendor</Text>
              <Text style={styles.findingVendorText}>
                Payment verified! We're connecting you with the best vendor for your booking.
              </Text>
            </View>
          </View>
        )}

        {/* OTP Card - Show when vendor requests trip start */}
        {booking.tripStartOtp && !booking.tripOtpVerified && (
          <View style={styles.otpCard}>
            <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.otpHeader}>
              <Ionicons name="key-outline" size={wp('5.5%')} color="#fff" />
              <Text style={styles.otpHeaderText}>Trip Start OTP</Text>
            </LinearGradient>
            <View style={styles.otpBody}>
              <Text style={styles.otpInstruction}>
                Share this OTP with the vendor to start your trip
              </Text>
              <View style={styles.otpCodeContainer}>
                <Text style={styles.otpCode}>{booking.tripStartOtp}</Text>
              </View>
              <Text style={styles.otpNote}>
                Do not share this OTP until you have verified the vehicle and are ready to start.
              </Text>
            </View>
          </View>
        )}

        {/* Trip Started Confirmation */}
        {booking.tripOtpVerified && booking.status === 'IN_PROGRESS' && (
          <View style={styles.tripStartedCard}>
            <View style={styles.tripStartedIconCircle}>
              <Ionicons name="checkmark-circle" size={wp('6%')} color={TEAL} />
            </View>
            <View style={styles.tripStartedInfo}>
              <Text style={styles.tripStartedTitle}>Trip Started</Text>
              <Text style={styles.tripStartedText}>
                Your ride is in progress. Enjoy your trip!
              </Text>
            </View>
          </View>
        )}

        {/* Vendor Details (if assigned) */}
        {booking.vendor && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="storefront-outline" size={wp('5%')} color="#EC4899" />
              </View>
              <Text style={styles.cardTitle}>Vendor Details</Text>
            </View>

            <View style={styles.vendorInfoRow}>
              <Text style={styles.vendorName}>{booking.vendor.name || booking.vendor.businessName}</Text>
              {booking.vendor.rating > 0 && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={wp('3.8%')} color="#f39c12" />
                  <Text style={styles.ratingText}>{booking.vendor.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {booking.vendor.phone && (
              <TouchableOpacity
                onPress={() => handleCall(booking.vendor.phone)}
              >
                <LinearGradient colors={[TEAL, '#059669']} style={styles.callBtn}>
                  <Ionicons name="call" size={wp('4.5%')} color="#fff" />
                  <Text style={styles.callBtnText}>Call Vendor</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Customer Notes */}
        {booking.customerNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text-outline" size={wp('5%')} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Your Notes</Text>
            </View>
            <Text style={styles.notesText}>{booking.customerNotes}</Text>
          </View>
        )}

        {/* Vendor Notes */}
        {booking.vendorNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={wp('5%')} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Vendor Notes</Text>
            </View>
            <Text style={styles.notesText}>{booking.vendorNotes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Review & Invoice for completed bookings — temporarily disabled, will redesign invoice format */}
          {/* {booking.status === 'COMPLETED' && (
            <>
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={() => navigation.navigate('InvoiceScreen', { booking, bookingType: 'self-drive' })}
              >
                <Ionicons name="receipt-outline" size={wp('5%')} color={TEAL} />
                <Text style={styles.invoiceBtnText}>View Invoice</Text>
              </TouchableOpacity>
            </>
          )} */}

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelBooking}>
              <Ionicons name="close-circle-outline" size={wp('5%')} color="#e74c3c" />
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.supportBtn}
            onPress={() => Linking.openURL('tel:+919737965551')}
          >
            <Ionicons name="headset-outline" size={wp('5%')} color={TEAL} />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* ── Rate Your Experience ── */}
        {booking && booking.status === 'COMPLETED' && (
          booking.rating ? (
            <View style={styles.ratedCard}>
              <View style={styles.ratedHeader}>
                <Ionicons name="checkmark-circle" size={wp('5%')} color={TEAL_MID} />
                <Text style={styles.ratedTitle}>Your Rating</Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons key={s} name={s <= booking.rating ? 'star' : 'star-outline'} size={wp('6%')} color="#FFB800" />
                ))}
              </View>
              {booking.review ? <Text style={styles.ratedReview}>"{booking.review}"</Text> : null}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: 'self-drive' })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.rateBtnGrad}>
                <Ionicons name="star" size={wp('5%')} color="#FFB800" />
                <Text style={styles.rateBtnText}>Rate Your Experience</Text>
                <Ionicons name="chevron-forward" size={wp('5%')} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )
        )}

        <View style={{ height: hp('5%') }} />
      </ScrollView>

      {/* Quote Details Modal */}
      {booking && booking.quote && (
        <Modal
          visible={quoteDetailsVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setQuoteDetailsVisible(false)}
        >
          <SafeAreaView style={styles.quoteModalContainer}>
            {/* Modal Header */}
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.quoteModalHeaderGrad}>
              <View style={styles.quoteModalHeaderRow}>
                <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.backBtn}>
                  <Ionicons name="close" size={wp('6%')} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.quoteModalTitle}>Quote Details</Text>
                <View style={{ width: wp('10%') }} />
              </View>
            </LinearGradient>

            <ScrollView style={styles.quoteModalContent} showsVerticalScrollIndicator={false}>
              {/* Tabs */}
              <View style={styles.quoteTabs}>
                {['overview', 'inclusions', 'exclusions', 'terms'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.quoteTab, detailsTab === tab && styles.quoteTabActive]}
                    onPress={() => setDetailsTab(tab)}
                  >
                    <Text style={[styles.quoteTabText, detailsTab === tab && styles.quoteTabTextActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.quoteTabContent}>
                {/* Overview Tab */}
                {detailsTab === 'overview' && (
                  <View>
                    {/* Vendor Info */}
                    {booking.vendor && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL_LIGHT }]}>
                            <Ionicons name="business-outline" size={wp('4.5%')} color={TEAL} />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Vendor Information</Text>
                        </View>
                        <View style={styles.quoteListCard}>
                          <View style={styles.quoteOverviewRow}>
                            <Text style={styles.quoteOverviewLabel}>Vendor</Text>
                            <Text style={styles.quoteOverviewValue}>{booking.vendor.name || booking.vendor.businessName}</Text>
                          </View>
                          {booking.vendor.rating > 0 && (
                            <View style={styles.quoteOverviewRow}>
                              <Text style={styles.quoteOverviewLabel}>Rating</Text>
                              <Text style={styles.quoteOverviewValue}>{booking.vendor.rating.toFixed(1)} ★</Text>
                            </View>
                          )}
                          {booking.vendor.city && (
                            <View style={styles.quoteOverviewRow}>
                              <Text style={styles.quoteOverviewLabel}>City</Text>
                              <Text style={styles.quoteOverviewValue}>{booking.vendor.city}{booking.vendor.state ? `, ${booking.vendor.state}` : ''}</Text>
                            </View>
                          )}
                          {booking.vendor.phone && (
                            <View style={[styles.quoteOverviewRow, { borderBottomWidth: 0 }]}>
                              <Text style={styles.quoteOverviewLabel}>Phone</Text>
                              <Text style={styles.quoteOverviewValue}>{booking.vendor.phone}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Vehicle Features */}
                    {(() => {
                      const features = parseListData(booking.quote.vehicleFeatures);
                      return features.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL_LIGHT }]}>
                              <Ionicons name="car-sport" size={wp('4.5%')} color={TEAL} />
                            </View>
                            <Text style={styles.quoteSectionTitle}>Vehicle Features</Text>
                          </View>
                          <View style={styles.quoteListCard}>
                            {features.map((item, idx) => (
                              <View key={idx} style={[styles.quoteFeatureItem, idx === features.length - 1 && styles.quoteFeatureItemLast]}>
                                <Ionicons name="checkmark-circle" size={wp('4%')} color={TEAL} />
                                <Text style={styles.quoteFeatureText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Quote Overview Card */}
                    <View style={styles.quoteSection}>
                      <View style={styles.quoteSectionHeader}>
                        <View style={[styles.quoteSectionIcon, { backgroundColor: '#EDE9FE' }]}>
                          <Ionicons name="receipt-outline" size={wp('4.5%')} color="#7C3AED" />
                        </View>
                        <Text style={styles.quoteSectionTitle}>Quote Summary</Text>
                      </View>
                      <View style={styles.quoteListCard}>
                        <View style={styles.quoteOverviewRow}>
                          <Text style={styles.quoteOverviewLabel}>Vehicle</Text>
                          <Text style={styles.quoteOverviewValue}>{booking.quote.vehicleName}</Text>
                        </View>
                        {booking.quote.vehicleBrand && (
                          <View style={styles.quoteOverviewRow}>
                            <Text style={styles.quoteOverviewLabel}>Brand</Text>
                            <Text style={styles.quoteOverviewValue}>{booking.quote.vehicleBrand}</Text>
                          </View>
                        )}
                        {booking.quote.registrationNumber && (
                          <View style={styles.quoteOverviewRow}>
                            <Text style={styles.quoteOverviewLabel}>Reg. Number</Text>
                            <Text style={styles.quoteOverviewValue}>{booking.quote.registrationNumber}</Text>
                          </View>
                        )}
                        <View style={styles.quoteOverviewRow}>
                          <Text style={styles.quoteOverviewLabel}>Daily Rate</Text>
                          <Text style={styles.quoteOverviewValue}>{'\u20B9'}{booking.quote.dailyRate}</Text>
                        </View>
                        <View style={styles.quoteOverviewRow}>
                          <Text style={styles.quoteOverviewLabel}>KM Limit/Day</Text>
                          <Text style={styles.quoteOverviewValue}>{booking.quote.kmLimitPerDay} km</Text>
                        </View>
                        <View style={styles.quoteOverviewRow}>
                          <Text style={styles.quoteOverviewLabel}>Extra KM Rate</Text>
                          <Text style={styles.quoteOverviewValue}>{'\u20B9'}{booking.quote.extraKmRate}/km</Text>
                        </View>
                        <View style={styles.quoteOverviewRow}>
                          <Text style={styles.quoteOverviewLabel}>Security Deposit</Text>
                          <Text style={styles.quoteOverviewValue}>{'\u20B9'}{booking.quote.securityDeposit}</Text>
                        </View>
                        <View style={[styles.quoteOverviewRow, { borderBottomWidth: 0 }]}>
                          <Text style={[styles.quoteOverviewLabel, { fontWeight: '700', color: TEXT_PRIMARY }]}>Grand Total</Text>
                          <Text style={[styles.quoteOverviewValue, { color: TEAL, fontSize: wp('4.2%') }]}>{'\u20B9'}{booking.quote.grandTotal}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Vendor Message */}
                    {booking.quote.vendorMessage && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteVendorMessage}>
                          <View style={styles.quoteMessageHeader}>
                            <Ionicons name="chatbox-outline" size={wp('4.5%')} color={TEAL} />
                            <Text style={styles.quoteMessageTitle}>Message from Vendor</Text>
                          </View>
                          <Text style={styles.quoteMessageText}>{booking.quote.vendorMessage}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Inclusions Tab */}
                {detailsTab === 'inclusions' && (
                  <View style={styles.quoteSection}>
                    <View style={styles.quoteSectionHeader}>
                      <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL_LIGHT }]}>
                        <Ionicons name="checkmark-done-circle" size={wp('4.5%')} color={TEAL} />
                      </View>
                      <Text style={styles.quoteSectionTitle}>What's Included</Text>
                    </View>
                    {(() => {
                      const inclusions = parseListData(booking.quote.inclusions);
                      return inclusions.length > 0 ? (
                        <View style={styles.quoteListCard}>
                          {inclusions.map((item, idx) => (
                            <View key={idx} style={[styles.quoteListItem, idx === inclusions.length - 1 && styles.quoteListItemLast]}>
                              <View style={styles.quoteListBullet}>
                                <Ionicons name="checkmark" size={wp('4.5%')} color={TEAL} />
                              </View>
                              <Text style={styles.quoteListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={wp('10%')} color={TEXT_MUTED} />
                          <Text style={styles.quoteEmptyText}>No inclusions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Exclusions Tab */}
                {detailsTab === 'exclusions' && (
                  <View style={styles.quoteSection}>
                    <View style={styles.quoteSectionHeader}>
                      <View style={[styles.quoteSectionIcon, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="close-circle" size={wp('4.5%')} color="#DC2626" />
                      </View>
                      <Text style={styles.quoteSectionTitle}>What's Not Included</Text>
                    </View>
                    {(() => {
                      const exclusions = parseListData(booking.quote.exclusions);
                      return exclusions.length > 0 ? (
                        <View style={styles.quoteListCard}>
                          {exclusions.map((item, idx) => (
                            <View key={idx} style={[styles.quoteListItem, idx === exclusions.length - 1 && styles.quoteListItemLast]}>
                              <View style={[styles.quoteListBullet, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="close" size={wp('4.5%')} color="#DC2626" />
                              </View>
                              <Text style={styles.quoteListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={wp('10%')} color={TEXT_MUTED} />
                          <Text style={styles.quoteEmptyText}>No exclusions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Terms Tab */}
                {detailsTab === 'terms' && (
                  <View style={styles.quoteSection}>
                    <View style={styles.quoteSectionHeader}>
                      <View style={[styles.quoteSectionIcon, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="document-text" size={wp('4.5%')} color="#2563EB" />
                      </View>
                      <Text style={styles.quoteSectionTitle}>Terms & Conditions</Text>
                    </View>
                    {(() => {
                      const terms = parseListData(booking.quote.termsConditions);
                      if (terms.length > 1) {
                        return (
                          <View style={styles.quoteListCard}>
                            {terms.map((item, idx) => (
                              <View key={idx} style={[styles.quoteListItem, idx === terms.length - 1 && styles.quoteListItemLast]}>
                                <View style={[styles.quoteListBullet, { backgroundColor: TEAL_LIGHT }]}>
                                  <Text style={styles.quoteTermsNumber}>{idx + 1}</Text>
                                </View>
                                <Text style={styles.quoteListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      if (terms.length === 1 || booking.quote.termsConditions) {
                        return (
                          <View style={styles.quoteListCard}>
                            <Text style={styles.quoteTermsText}>
                              {terms[0] || booking.quote.termsConditions}
                            </Text>
                          </View>
                        );
                      }
                      return (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={wp('10%')} color={TEXT_MUTED} />
                          <Text style={styles.quoteEmptyText}>No terms specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>

              <View style={{ height: hp('5%') }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Loading ───────────────────────── */
  loadingHeader: {
    height: hp('15%'),
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('1.5%'),
    color: TEXT_SECONDARY,
    fontSize: wp('3.5%'),
    fontWeight: '500',
  },

  /* ── Decorative Circles ───────────────────────── */
  decorCircle1: {
    position: 'absolute',
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -wp('15%'),
    right: -wp('10%'),
  },
  decorCircle2: {
    position: 'absolute',
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -wp('5%'),
    left: -wp('8%'),
  },
  decorCircle3: {
    position: 'absolute',
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: hp('3%'),
    left: wp('30%'),
  },

  /* ── Header ───────────────────────── */
  headerGradient: {
    paddingBottom: hp('2%'),
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1%'),
    paddingBottom: hp('0.5%'),
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: wp('3%'),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  headerActionBtn: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('4.75%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Content ───────────────────────── */
  content: {
    flex: 1,
    padding: wp('4%'),
  },

  /* ── Error ───────────────────────── */
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  errorIconCircle: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  errorTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  errorText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
  },
  retryBtn: {
    marginTop: hp('2.5%'),
    paddingHorizontal: wp('10%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.8%'),
  },

  /* ── Status Card ───────────────────────── */
  statusCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('5%'),
    alignItems: 'center',
    marginBottom: hp('1.8%'),
    ...SHADOW_SM,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('5%'),
  },
  statusDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    marginRight: wp('2%'),
  },
  statusText: {
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
  bookingNumber: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('1.2%'),
  },
  bookingDate: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    marginTop: hp('0.4%'),
  },

  /* ── Cards ───────────────────────── */
  card: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.8%'),
    ...SHADOW_SM,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.8%'),
  },
  cardIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: wp('3%'),
  },

  /* ── Vehicle ───────────────────────── */
  vehicleInfo: {
    alignItems: 'flex-start',
  },
  vehicleBrand: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  vehicleName: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('0.4%'),
    marginBottom: hp('1.2%'),
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('3%'),
    gap: wp('1%'),
  },
  specBadgeText: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
  },

  /* ── Trip Details ───────────────────────── */
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.8%'),
  },
  tripPoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripDot: {
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
    marginTop: hp('0.5%'),
    marginRight: wp('2.5%'),
  },
  tripInfo: {},
  tripLabel: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripDate: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: hp('0.2%'),
  },
  tripTime: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.1%'),
  },
  tripLine: {
    width: wp('8%'),
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: wp('2%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('3%'),
    marginTop: hp('1.5%'),
  },
  durationText: {
    color: TEAL_MID,
    fontWeight: '600',
    fontSize: wp('3.2%'),
    marginLeft: wp('1.5%'),
  },

  /* ── KM Limit ───────────────────────── */
  kmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
    paddingVertical: hp('0.5%'),
  },
  kmLabel: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
  },
  kmValue: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  /* ── View Quote Details Button ───────────────────────── */
  viewQuoteDetailsBtn: {
    marginBottom: hp('1.8%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  viewQuoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('5%'),
  },
  viewQuoteDetailsText: {
    color: '#FFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    marginLeft: wp('2.5%'),
    marginRight: wp('1.5%'),
  },

  /* ── Price ───────────────────────── */
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
    paddingVertical: hp('0.3%'),
  },
  priceLabel: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: hp('1.5%'),
    marginTop: hp('0.5%'),
  },
  totalLabel: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEAL,
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1.5%'),
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    borderRadius: wp('3%'),
  },
  paidText: {
    color: TEAL_MID,
    fontWeight: '700',
    marginLeft: wp('2%'),
    fontSize: wp('3.5%'),
  },

  /* ── Advance Payment Card ───────────────────────── */
  advanceCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.8%'),
    ...SHADOW_MD,
  },
  advanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  advanceHeaderText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
    marginLeft: wp('2.5%'),
  },
  advanceBody: {
    padding: wp('4%'),
  },
  advanceAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  advanceLabel: {
    fontSize: wp('3.8%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  advanceAmount: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: TEAL,
  },
  advanceNote: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    lineHeight: wp('4.8%'),
    marginBottom: hp('2%'),
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  payNowBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
  },

  /* ── OTP Card ───────────────────────── */
  otpCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.8%'),
    ...SHADOW_MD,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  otpHeaderText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
    marginLeft: wp('2.5%'),
  },
  otpBody: {
    padding: wp('4%'),
    alignItems: 'center',
  },
  otpInstruction: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  otpCodeContainer: {
    backgroundColor: '#F0F9FF',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    marginBottom: hp('1.5%'),
  },
  otpCode: {
    fontSize: wp('8%'),
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 8,
  },
  otpNote: {
    fontSize: wp('3%'),
    color: '#e74c3c',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  /* ── Trip Started Card ───────────────────────── */
  tripStartedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.8%'),
    borderWidth: 1.5,
    borderColor: TEAL_LIGHT,
    ...SHADOW_SM,
  },
  tripStartedIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripStartedInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  tripStartedTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  tripStartedText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },

  /* ── Vendor ───────────────────────── */
  vendorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  vendorName: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    gap: wp('1%'),
  },
  ratingText: {
    fontSize: wp('3.5%'),
    color: '#D97706',
    fontWeight: '700',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  callBtnText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  /* ── Notes ───────────────────────── */
  notesText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },

  /* ── Actions ───────────────────────── */
  actions: {
    marginTop: hp('1%'),
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_LIGHT,
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  invoiceBtnText: {
    color: TEAL_MID,
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    color: '#e74c3c',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: TEAL,
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  supportBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  /* ── Payment Verification Card ───────────────────────── */
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.8%'),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...SHADOW_SM,
  },
  verificationIconWrap: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationContent: {
    flex: 1,
    marginLeft: wp('3.5%'),
  },
  verificationTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#D97706',
    marginBottom: hp('0.4%'),
  },
  verificationText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.8%'),
  },

  /* ── Finding Vendor Card ───────────────────────── */
  findingVendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.8%'),
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    ...SHADOW_SM,
  },
  findingVendorIconWrap: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  findingVendorContent: {
    flex: 1,
    marginLeft: wp('3.5%'),
  },
  findingVendorTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: hp('0.4%'),
  },
  findingVendorText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.8%'),
  },

  /* ── Quote Details Modal ───────────────────────── */
  quoteModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  quoteModalHeaderGrad: {
    paddingTop: Platform.OS === 'android' ? hp('1.5%') : hp('0.5%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    overflow: 'hidden',
  },
  quoteModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteModalTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#FFF',
  },
  quoteModalContent: {
    flex: 1,
  },
  quoteTabs: {
    flexDirection: 'row',
    backgroundColor: CARD,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...SHADOW_SM,
  },
  quoteTab: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  quoteTabActive: {
    borderBottomColor: TEAL,
  },
  quoteTabText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  quoteTabTextActive: {
    color: TEAL_MID,
  },
  quoteTabContent: {
    padding: wp('4%'),
  },
  quoteSection: {
    marginBottom: hp('2.5%'),
  },
  quoteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  quoteSectionIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteSectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
  },
  quoteFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  quoteFeatureItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  quoteFeatureText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
    flex: 1,
    lineHeight: wp('5.5%'),
    paddingTop: 1,
  },
  quoteListCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  quoteListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('2%'),
    paddingBottom: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  quoteListItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  quoteListBullet: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('3.75%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    marginTop: hp('0.3%'),
  },
  quoteListText: {
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.8%'),
    flex: 1,
    paddingTop: hp('0.4%'),
  },
  quoteOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quoteOverviewLabel: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
  },
  quoteOverviewValue: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  quoteVendorMessage: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  quoteMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  quoteMessageTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginLeft: wp('2%'),
  },
  quoteMessageText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },
  quoteTermsText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },
  quoteTermsNumber: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  quoteEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  quoteEmptyText: {
    fontSize: wp('3.5%'),
    color: TEXT_MUTED,
    marginTop: hp('1%'),
  },
  rateBtn: { marginHorizontal: wp('4%'), marginBottom: hp('1.5%'), borderRadius: wp('3%'), overflow: 'hidden' },
  rateBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp('2%'), paddingHorizontal: wp('4%'), gap: wp('2%') },
  rateBtnText: { color: '#fff', fontSize: wp('4%'), fontWeight: '700', flex: 1, textAlign: 'center' },
  ratedCard: { marginHorizontal: wp('4%'), marginBottom: hp('1.5%'), borderRadius: wp('3%'), backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', padding: wp('4%'), alignItems: 'center' },
  ratedHeader: { flexDirection: 'row', alignItems: 'center', gap: wp('2%'), marginBottom: hp('1%') },
  ratedTitle: { fontSize: wp('4%'), fontWeight: '700', color: '#0F172A' },
  starsRow: { flexDirection: 'row', gap: wp('1%'), marginBottom: hp('0.5%') },
  ratedReview: { fontSize: wp('3.5%'), color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: hp('0.5%') },
});

export default SelfDriveBookingDetailScreen;

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api, { BASE_URL, IMAGE_BASE_URL } from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const BikeBookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

  /* ── StatusBar management ────────────────── */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(TEAL_DEEP);
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') StatusBar.setBackgroundColor('#ffffff');
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
      const response = await api.get(`/bike-bookings/${bookingId}`);

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
              const response = await api.patch(`/bike-bookings/${bookingId}`, {
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

    // If already an array, return it
    if (Array.isArray(data)) {
      return data.filter(item => item && item.trim());
    }

    // If it's a string that looks like JSON array, parse it
    if (typeof data === 'string') {
      // Try to parse as JSON first
      if (data.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => item && item.trim());
          }
        } catch (e) {
          // If JSON parsing fails, continue to split method
        }
      }

      // Split by newlines or commas
      return data
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(item => item && item !== '');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'time-outline';
      case 'PAYMENT_SUBMITTED':
        return 'card-outline';
      case 'PAYMENT_VERIFIED':
        return 'checkmark-circle-outline';
      case 'BROADCASTED':
      case 'PENDING_VENDOR':
        return 'radio-outline';
      case 'ACCEPTED':
      case 'CONFIRMED':
        return 'checkmark-done-outline';
      case 'READY_FOR_PICKUP':
        return 'bicycle-outline';
      case 'IN_PROGRESS':
        return 'navigate-outline';
      case 'COMPLETED':
        return 'trophy-outline';
      case 'CANCELLED':
      case 'REJECTED':
        return 'close-circle-outline';
      case 'DROPPED':
        return 'arrow-down-circle-outline';
      case 'EXPIRED':
      case 'REFUNDED':
        return 'alert-circle-outline';
      default:
        return 'ellipse-outline';
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

  /* ── Loading State ───────────────────────── */
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.loadingGradient}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /* ── Error State ─────────────────────────── */
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.header}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Booking Details</Text>
            </View>
            <View style={{ width: wp('10%') }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={wp('12%')} color="#e74c3c" />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBookingDetails}>
            <LinearGradient colors={[TEAL, '#059669']} style={styles.retryBtnGradient}>
              <Ionicons name="refresh" size={wp('4.5%')} color="#fff" />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = booking && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'IN_PROGRESS'].includes(booking.status);
  const statusColor = getStatusColor(booking.status);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* ── Gradient Header ─────────────────── */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Booking Details</Text>
            <Text style={styles.headerSubtitle}>#{booking.bookingNumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate('BookingChat', {
                bookingId: booking?.id,
                bookingNumber: booking?.bookingNumber,
                vendorName: booking?.acceptedVendor?.businessName || booking?.assignedVendor?.businessName || 'Vendor'
              })}
            >
              <Ionicons name="chatbubble-outline" size={wp('4.5%')} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={wp('4.5%')} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Badge inside header */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
            <Ionicons name={getStatusIcon(booking.status)} size={wp('4%')} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(booking.status)}</Text>
          </View>
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={wp('3.2%')} color="rgba(255,255,255,0.8)" />
            <Text style={styles.datePillText}>{formatDate(booking.createdAt)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
      >
        {/* ── Drop Reason Banner ─────────────── */}
        {booking.status === 'DROPPED' && booking.dropReason && (
          <View style={{ backgroundColor: '#FEE2E2', padding: wp('4%'), borderRadius: wp('3%'), marginBottom: hp('1.5%'), flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
            <Ionicons name="information-circle" size={wp('5.5%')} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: wp('3.5%'), fontWeight: '700', color: '#991B1B', marginBottom: hp('0.3%') }}>Booking Dropped</Text>
              <Text style={{ fontSize: wp('3%'), color: '#B91C1C', lineHeight: wp('4.5%') }}>{booking.dropReason}</Text>
            </View>
          </View>
        )}

        {/* ── Vehicle Card ──────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <Ionicons name="bicycle" size={wp('5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.cardTitle}>Vehicle Details</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleBrand}>{booking.vehicleBrand}</Text>
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            {booking.vehicleCategory && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{booking.vehicleCategory}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Trip Details ──────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="calendar-outline" size={wp('5%')} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripPoint}>
              <View style={styles.tripDotWrap}>
                <View style={[styles.tripDot, { backgroundColor: TEAL }]} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripLabel}>PICKUP</Text>
                <Text style={styles.tripDate}>{formatDate(booking.pickupDate)}</Text>
                <Text style={styles.tripTime}>{formatTime(booking.pickupTime)}</Text>
              </View>
            </View>
            <View style={styles.tripLine}>
              <View style={styles.tripLineDash} />
            </View>
            <View style={styles.tripPoint}>
              <View style={styles.tripDotWrap}>
                <View style={[styles.tripDot, { backgroundColor: '#EF4444' }]} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripLabel}>DROP</Text>
                <Text style={styles.tripDate}>{formatDate(booking.dropDate)}</Text>
                <Text style={styles.tripTime}>{formatTime(booking.dropTime)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={[styles.miniIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="location" size={wp('3.5%')} color="#D97706" />
            </View>
            <Text style={styles.locationText}>{booking.locationName}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={wp('3.5%')} color={TEAL_MID} />
            <Text style={styles.durationText}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''} Rental</Text>
          </View>
        </View>

        {/* ── Price Breakdown ───────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="pricetag-outline" size={wp('5%')} color="#D97706" />
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

        {/* ── Quote Details Button ──────────── */}
        {booking.quote && (
          <TouchableOpacity
            style={styles.viewQuoteDetailsBtn}
            onPress={() => setQuoteDetailsVisible(true)}
          >
            <View style={[styles.miniIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <Ionicons name="document-text-outline" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEAL} />
          </TouchableOpacity>
        )}

        {/* ── Advance Payment Card ──────────── */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <View style={styles.advanceCard}>
            <LinearGradient colors={[TEAL_MID, TEAL_DEEP]} style={styles.advanceHeader}>
              <Ionicons name="wallet-outline" size={wp('5%')} color="#fff" />
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
                style={styles.payNowBtn}
                onPress={() => navigation.navigate('PaymentScreen', {
                  bookingId: booking.id,
                  bookingType: 'bike',
                  amount: booking.advanceAmount
                })}
              >
                <LinearGradient colors={[TEAL, '#059669']} style={styles.payNowBtnGradient}>
                  <Ionicons name="card-outline" size={wp('4.5%')} color="#fff" />
                  <Text style={styles.payNowBtnText}>Pay {'\u20B9'}{booking.advanceAmount} Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── OTP Card ─────────────────────── */}
        {booking.tripStartOtp &&
         !booking.tripOtpVerified &&
         (booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
          <View style={styles.otpCard}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.otpHeader}>
              <Ionicons name="key-outline" size={wp('5%')} color="#fff" />
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

        {/* ── Trip Started Confirmation ─────── */}
        {booking.tripOtpVerified && booking.status === 'IN_PROGRESS' && (
          <View style={styles.tripStartedCard}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <Ionicons name="checkmark-circle" size={wp('5.5%')} color={TEAL} />
            </View>
            <View style={styles.tripStartedInfo}>
              <Text style={styles.tripStartedTitle}>Trip Started</Text>
              <Text style={styles.tripStartedText}>
                Your ride is in progress. Enjoy your trip!
              </Text>
            </View>
          </View>
        )}

        {/* ── Vendor Details ───────────────── */}
        {booking.vendor && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="storefront-outline" size={wp('5%')} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Vendor Details</Text>
            </View>

            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{booking.vendor.name}</Text>
              {booking.vendor.rating > 0 && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={wp('3.5%')} color="#F59E0B" />
                  <Text style={styles.ratingText}>{booking.vendor.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {booking.vendor.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleCall(booking.vendor.phone)}
              >
                <LinearGradient colors={[TEAL, '#059669']} style={styles.callBtnGradient}>
                  <Ionicons name="call" size={wp('4%')} color="#fff" />
                  <Text style={styles.callBtnText}>Call Vendor</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Customer Notes ───────────────── */}
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

        {/* ── Vendor Notes ─────────────────── */}
        {booking.vendorNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={wp('5%')} color="#6366F1" />
              </View>
              <Text style={styles.cardTitle}>Vendor Notes</Text>
            </View>
            <Text style={styles.notesText}>{booking.vendorNotes}</Text>
          </View>
        )}

        {/* ── Action Buttons ───────────────── */}
        <View style={styles.actions}>
          {/* Review & Invoice for completed bookings — temporarily disabled, will redesign invoice format */}
          {/* {booking.status === 'COMPLETED' && (
            <>
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={() => navigation.navigate('InvoiceScreen', { booking, bookingType: 'bike' })}
              >
                <Ionicons name="receipt-outline" size={wp('4.5%')} color={TEAL_MID} />
                <Text style={styles.invoiceBtnText}>View Invoice</Text>
              </TouchableOpacity>
            </>
          )} */}

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelBooking}>
              <Ionicons name="close-circle-outline" size={wp('4.5%')} color="#EF4444" />
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.supportBtn}
            onPress={() => Linking.openURL('tel:+919737965551')}
          >
            <Ionicons name="headset-outline" size={wp('4.5%')} color={TEAL_MID} />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: hp('5%') }} />
      </ScrollView>

      {/* ── Quote Details Modal ─────────────── */}
      {booking && booking.quote && (
        <Modal
          visible={quoteDetailsVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setQuoteDetailsVisible(false)}
        >
          <SafeAreaView style={styles.quoteModalContainer}>
            {/* Modal Header */}
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.quoteModalHeader}>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
              <View style={styles.quoteModalHeaderRow}>
                <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.quoteCloseBtn}>
                  <Ionicons name="close" size={wp('6%')} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.quoteModalTitle}>Quote Details</Text>
                <View style={{ width: wp('10%') }} />
              </View>
            </LinearGradient>

            <ScrollView style={styles.quoteModalContent} showsVerticalScrollIndicator={false}>
              {/* Tabs */}
              <View style={styles.quoteTabs}>
                <TouchableOpacity
                  style={[styles.quoteTab, detailsTab === 'overview' && styles.quoteTabActive]}
                  onPress={() => setDetailsTab('overview')}
                >
                  <Text style={[styles.quoteTabText, detailsTab === 'overview' && styles.quoteTabTextActive]}>
                    Overview
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quoteTab, detailsTab === 'inclusions' && styles.quoteTabActive]}
                  onPress={() => setDetailsTab('inclusions')}
                >
                  <Text style={[styles.quoteTabText, detailsTab === 'inclusions' && styles.quoteTabTextActive]}>
                    Inclusions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quoteTab, detailsTab === 'exclusions' && styles.quoteTabActive]}
                  onPress={() => setDetailsTab('exclusions')}
                >
                  <Text style={[styles.quoteTabText, detailsTab === 'exclusions' && styles.quoteTabTextActive]}>
                    Exclusions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quoteTab, detailsTab === 'terms' && styles.quoteTabActive]}
                  onPress={() => setDetailsTab('terms')}
                >
                  <Text style={[styles.quoteTabText, detailsTab === 'terms' && styles.quoteTabTextActive]}>
                    Terms
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={styles.quoteTabContent}>
                {/* Overview Tab */}
                {detailsTab === 'overview' && (
                  <View>
                    {/* Vendor Info */}
                    {booking.vendor && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                            <Ionicons name="business-outline" size={wp('4.5%')} color={TEAL} />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Vendor Information</Text>
                        </View>
                        <View style={styles.quoteListCard}>
                          <View style={styles.quoteFeatureItem}>
                            <Ionicons name="storefront-outline" size={wp('4%')} color={TEAL} />
                            <Text style={styles.quoteFeatureText}>{booking.vendor.name}</Text>
                          </View>
                          {booking.vendor.rating > 0 && (
                            <View style={styles.quoteFeatureItem}>
                              <Ionicons name="star-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>{booking.vendor.rating.toFixed(1)} ★ Rating</Text>
                            </View>
                          )}
                          {booking.vendor.phone && (
                            <View style={[styles.quoteFeatureItem, styles.quoteFeatureItemLast]}>
                              <Ionicons name="call-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>{booking.vendor.phone}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Vehicle Images */}
                    {(() => {
                      let vehicleImages = [];
                      if (booking.quote.vehicleImages) {
                        try {
                          // Try to parse as JSON array
                          vehicleImages = typeof booking.quote.vehicleImages === 'string'
                            ? JSON.parse(booking.quote.vehicleImages)
                            : booking.quote.vehicleImages;

                          // Ensure it's an array
                          if (!Array.isArray(vehicleImages)) {
                            vehicleImages = [];
                          }
                        } catch (e) {
                          // If JSON parse fails, try as comma-separated string
                          if (typeof booking.quote.vehicleImages === 'string') {
                            vehicleImages = booking.quote.vehicleImages.split(',').map(s => s.trim()).filter(Boolean);
                          }
                        }
                      }

                      return vehicleImages.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                              <Ionicons name="images" size={wp('4.5%')} color={TEAL_MID} />
                            </View>
                            <Text style={styles.quoteSectionTitle}>Vehicle Images</Text>
                          </View>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.quoteImageScroll}
                          >
                            {vehicleImages.map((img, idx) => {
                              // Construct image URL - same logic as ViewQuoteScreen
                              let imageUrl = img;
                              if (!img.startsWith('http') && !img.startsWith('data:')) {
                                const cleanPath = img.replace(/\\/g, '/').replace(/^\/+/, '');

                                // If path already starts with 'uploads/', just prepend BASE_URL
                                if (cleanPath.startsWith('uploads/')) {
                                  imageUrl = `${BASE_URL}/${cleanPath}`;
                                } else if (cleanPath.startsWith('storage/')) {
                                  imageUrl = `${BASE_URL}/${cleanPath}`;
                                } else {
                                  // Otherwise, use IMAGE_BASE_URL (which already has /uploads)
                                  imageUrl = `${IMAGE_BASE_URL}/${cleanPath}`;
                                }
                              }

                              return (
                                <View key={idx} style={styles.quoteImageContainer}>
                                  <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.quoteImage}
                                    resizeMode="cover"
                                  />
                                </View>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })()}

                    {/* Vehicle Features */}
                    {(() => {
                      const features = parseListData(booking.quote.vehicleFeatures);
                      return features.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                              <Ionicons name="checkmark-circle" size={wp('4.5%')} color={TEAL_MID} />
                            </View>
                            <Text style={styles.quoteSectionTitle}>Vehicle Features</Text>
                          </View>
                          <View style={styles.quoteListCard}>
                            {features.map((feature, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.quoteFeatureItem,
                                  idx === features.length - 1 && styles.quoteFeatureItemLast,
                                ]}
                              >
                                <Ionicons name="checkmark-circle" size={wp('4%')} color={TEAL} />
                                <Text style={styles.quoteFeatureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Additional Info */}
                    <View style={styles.quoteSection}>
                      <View style={styles.quoteSectionHeader}>
                        <View style={[styles.cardIconCircle, { backgroundColor: '#EEF2FF' }]}>
                          <Ionicons name="information-circle-outline" size={wp('4.5%')} color="#6366F1" />
                        </View>
                        <Text style={styles.quoteSectionTitle}>Additional Information</Text>
                      </View>
                      <View style={styles.quoteInfoCard}>
                        {booking.quote.registrationNumber && (
                          <View style={styles.quoteInfoRow}>
                            <View style={[styles.miniIconCircle, { backgroundColor: '#F3F4F6' }]}>
                              <Ionicons name="card-outline" size={wp('3.5%')} color={TEXT_SECONDARY} />
                            </View>
                            <Text style={styles.quoteInfoText}>
                              Registration: {booking.quote.registrationNumber}
                            </Text>
                          </View>
                        )}
                        {booking.quote.helmetsIncluded !== undefined && (
                          <View style={styles.quoteInfoRow}>
                            <View style={[styles.miniIconCircle, { backgroundColor: booking.quote.helmetsIncluded ? TEAL_LIGHT : '#FEE2E2' }]}>
                              <Ionicons
                                name={booking.quote.helmetsIncluded ? 'checkmark-circle' : 'close-circle'}
                                size={wp('3.5%')}
                                color={booking.quote.helmetsIncluded ? TEAL : '#EF4444'}
                              />
                            </View>
                            <Text style={styles.quoteInfoText}>
                              Helmets {booking.quote.helmetsIncluded ? 'Included' : 'Not Included'}
                            </Text>
                          </View>
                        )}
                        {booking.quote.kmLimitPerDay > 0 && (
                          <View style={styles.quoteInfoRow}>
                            <View style={[styles.miniIconCircle, { backgroundColor: '#F3F4F6' }]}>
                              <Ionicons name="speedometer-outline" size={wp('3.5%')} color={TEXT_SECONDARY} />
                            </View>
                            <Text style={styles.quoteInfoText}>
                              {booking.quote.kmLimitPerDay} KM per day limit
                            </Text>
                          </View>
                        )}
                        {booking.quote.extraKmCharge > 0 && (
                          <View style={styles.quoteInfoRow}>
                            <View style={[styles.miniIconCircle, { backgroundColor: '#F3F4F6' }]}>
                              <Ionicons name="cash-outline" size={wp('3.5%')} color={TEXT_SECONDARY} />
                            </View>
                            <Text style={styles.quoteInfoText}>
                              {'\u20B9'}{booking.quote.extraKmCharge} per extra KM
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Vendor Message */}
                      {booking.quote.vendorMessage && (
                        <View style={styles.quoteVendorMessage}>
                          <View style={styles.quoteMessageHeader}>
                            <Ionicons name="chatbox-outline" size={wp('4%')} color={TEAL} />
                            <Text style={styles.quoteMessageTitle}>Message from Vendor</Text>
                          </View>
                          <Text style={styles.quoteMessageText}>{booking.quote.vendorMessage}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Inclusions Tab */}
                {detailsTab === 'inclusions' && (
                  <View style={styles.quoteSection}>
                    <View style={styles.quoteSectionHeader}>
                      <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                        <Ionicons name="checkmark-done-circle" size={wp('4.5%')} color={TEAL_MID} />
                      </View>
                      <Text style={styles.quoteSectionTitle}>What's Included</Text>
                    </View>
                    {(() => {
                      const inclusions = parseListData(booking.quote.inclusions);
                      return inclusions.length > 0 ? (
                        <View style={styles.quoteListCard}>
                          {inclusions.map((item, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.quoteListItem,
                                idx === inclusions.length - 1 && styles.quoteListItemLast,
                              ]}
                            >
                              <View style={styles.quoteListBullet}>
                                <Ionicons name="checkmark" size={wp('4%')} color={TEAL} />
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
                      <View style={[styles.cardIconCircle, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="close-circle" size={wp('4.5%')} color="#EF4444" />
                      </View>
                      <Text style={styles.quoteSectionTitle}>What's Not Included</Text>
                    </View>
                    {(() => {
                      const exclusions = parseListData(booking.quote.exclusions);
                      return exclusions.length > 0 ? (
                        <View style={styles.quoteListCard}>
                          {exclusions.map((item, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.quoteListItem,
                                idx === exclusions.length - 1 && styles.quoteListItemLast,
                              ]}
                            >
                              <View style={[styles.quoteListBullet, styles.quoteExclusionBullet]}>
                                <Ionicons name="close" size={wp('4%')} color="#EF4444" />
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
                      <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                        <Ionicons name="document-text" size={wp('4.5%')} color={TEAL_MID} />
                      </View>
                      <Text style={styles.quoteSectionTitle}>Terms & Conditions</Text>
                    </View>
                    {(() => {
                      const terms = parseListData(booking.quote.termsConditions);

                      // If we got an array with multiple items, show as bullet points
                      if (terms.length > 1) {
                        return (
                          <View style={styles.quoteListCard}>
                            {terms.map((item, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.quoteListItem,
                                  idx === terms.length - 1 && styles.quoteListItemLast,
                                ]}
                              >
                                <View style={styles.quoteTermsBullet}>
                                  <Text style={styles.quoteTermsNumber}>{idx + 1}</Text>
                                </View>
                                <Text style={styles.quoteListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      }

                      // If single item or plain text, show as paragraph
                      if (terms.length === 1 || booking.quote.termsConditions) {
                        return (
                          <View style={styles.quoteTermsCard}>
                            <Text style={styles.quoteTermsText}>
                              {terms.length === 1 ? terms[0] : booking.quote.termsConditions}
                            </Text>
                          </View>
                        );
                      }

                      // No terms
                      return (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={wp('10%')} color={TEXT_MUTED} />
                          <Text style={styles.quoteEmptyText}>No terms and conditions specified</Text>
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
    </SafeAreaView>
  );
};

/* ═══════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Loading ──────────────────────────────── */
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingText: {
    marginTop: hp('2%'),
    color: 'rgba(255,255,255,0.85)',
    fontSize: wp('3.5%'),
    fontWeight: '500',
  },

  /* ── Decorative Circles ───────────────────── */
  decorCircle1: {
    position: 'absolute',
    width: wp('60%'),
    height: wp('60%'),
    borderRadius: wp('30%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -wp('20%'),
    right: -wp('15%'),
  },
  decorCircle2: {
    position: 'absolute',
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -wp('10%'),
    left: -wp('10%'),
  },

  /* ── Header ───────────────────────────────── */
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || hp('4%') : hp('1%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
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
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  headerActionBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Status Row (inside header) ───────────── */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('1.5%'),
    paddingHorizontal: wp('1%'),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.2%'),
    marginLeft: wp('1.5%'),
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('4%'),
  },
  datePillText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: wp('2.8%'),
    fontWeight: '500',
    marginLeft: wp('1.5%'),
  },

  /* ── Error State ──────────────────────────── */
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  errorIconCircle: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  errorTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  errorText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    marginTop: hp('1%'),
    textAlign: 'center',
    lineHeight: wp('5%'),
  },
  retryBtn: {
    marginTop: hp('2.5%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  retryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.5%'),
    marginLeft: wp('2%'),
  },

  /* ── Content / ScrollView ─────────────────── */
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: wp('4%'),
  },

  /* ── Cards (shared) ───────────────────────── */
  card: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  cardIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: wp('3%'),
  },

  /* ── Vehicle ──────────────────────────────── */
  vehicleInfo: {
    alignItems: 'flex-start',
    paddingLeft: wp('1%'),
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
    marginTop: hp('0.3%'),
  },
  categoryBadge: {
    marginTop: hp('1%'),
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('3%'),
  },
  categoryText: {
    color: TEAL_MID,
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  /* ── Trip Details ─────────────────────────── */
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  tripPoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripDotWrap: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.4%'),
    marginRight: wp('2.5%'),
  },
  tripDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
  },
  tripInfo: {},
  tripLabel: {
    fontSize: wp('2.5%'),
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
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('1%'),
  },
  tripLineDash: {
    width: wp('6%'),
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationText: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
    flex: 1,
    fontWeight: '500',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('3%'),
    marginTop: hp('1.2%'),
  },
  durationText: {
    color: TEAL_MID,
    fontWeight: '600',
    fontSize: wp('3%'),
    marginLeft: wp('1.5%'),
  },

  /* ── Price ────────────────────────────────── */
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
    paddingVertical: hp('0.3%'),
  },
  priceLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: wp('3.3%'),
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
    marginTop: hp('1.2%'),
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    borderRadius: wp('3%'),
  },
  paidText: {
    color: TEAL_MID,
    fontWeight: '600',
    marginLeft: wp('2%'),
    fontSize: wp('3.3%'),
  },

  /* ── Advance Payment Card ─────────────────── */
  advanceCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
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
    fontSize: wp('3.8%'),
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
    marginBottom: hp('1.2%'),
  },
  advanceLabel: {
    fontSize: wp('3.5%'),
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
    marginBottom: hp('1.5%'),
  },
  payNowBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  payNowBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
  },
  payNowBtnText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    marginLeft: wp('2%'),
  },

  /* ── OTP Card ─────────────────────────────── */
  otpCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
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
    fontSize: wp('3.8%'),
    fontWeight: '700',
    marginLeft: wp('2.5%'),
  },
  otpBody: {
    padding: wp('4%'),
    alignItems: 'center',
  },
  otpInstruction: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('2%'),
    lineHeight: wp('5%'),
  },
  otpCodeContainer: {
    backgroundColor: '#EFF6FF',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    marginBottom: hp('1.5%'),
  },
  otpCode: {
    fontSize: wp('8%'),
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: wp('2%'),
  },
  otpNote: {
    fontSize: wp('2.8%'),
    color: '#EF4444',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: wp('4%'),
  },

  /* ── Trip Started Card ────────────────────── */
  tripStartedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  tripStartedInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  tripStartedTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  tripStartedText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },

  /* ── Vendor ───────────────────────────────── */
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
  },
  vendorName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  ratingText: {
    color: '#D97706',
    fontWeight: '700',
    marginLeft: wp('1%'),
    fontSize: wp('3.2%'),
  },
  callBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  callBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
  },
  callBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: wp('2%'),
    fontSize: wp('3.5%'),
  },

  /* ── Notes ────────────────────────────────── */
  notesText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
    paddingLeft: wp('1%'),
  },

  /* ── Actions ──────────────────────────────── */
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
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  invoiceBtnText: {
    color: TEAL_MID,
    fontWeight: '700',
    marginLeft: wp('2%'),
    fontSize: wp('3.5%'),
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: wp('2%'),
    fontSize: wp('3.5%'),
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    ...SHADOW_SM,
  },
  supportBtnText: {
    color: TEAL_MID,
    fontWeight: '600',
    marginLeft: wp('2%'),
    fontSize: wp('3.5%'),
  },

  /* ── View Quote Details Button ────────────── */
  viewQuoteDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  viewQuoteDetailsText: {
    color: TEAL_MID,
    fontSize: wp('3.5%'),
    fontWeight: '700',
    marginLeft: wp('2.5%'),
    marginRight: wp('1.5%'),
  },

  /* ══════════════════════════════════════════
     Quote Details Modal Styles
     ══════════════════════════════════════════ */
  quoteModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  quoteModalHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || hp('4%') : hp('1%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    overflow: 'hidden',
  },
  quoteModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteCloseBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#fff',
  },
  quoteModalContent: {
    flex: 1,
  },

  /* ── Tabs ──────────────────────────────────── */
  quoteTabs: {
    flexDirection: 'row',
    backgroundColor: CARD,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  quoteTabTextActive: {
    color: TEAL_MID,
  },

  /* ── Tab Content ──────────────────────────── */
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
  quoteSectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: wp('3%'),
  },

  /* ── Features ─────────────────────────────── */
  quoteFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.2%'),
    paddingBottom: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  quoteFeatureItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  quoteFeatureText: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
    flex: 1,
    lineHeight: wp('5%'),
    paddingTop: hp('0.1%'),
  },

  /* ── Info Card ────────────────────────────── */
  quoteInfoCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  quoteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  quoteInfoText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('2.5%'),
    flex: 1,
  },

  /* ── Vendor Message ───────────────────────── */
  quoteVendorMessage: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  quoteMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  quoteMessageTitle: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginLeft: wp('2%'),
  },
  quoteMessageText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },

  /* ── List Card (Inclusions/Exclusions) ────── */
  quoteListCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  quoteListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1.5%'),
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
    marginTop: hp('0.2%'),
  },
  quoteExclusionBullet: {
    backgroundColor: '#FEE2E2',
  },
  quoteListText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.2%'),
    flex: 1,
    paddingTop: hp('0.3%'),
  },

  /* ── Terms Card ───────────────────────────── */
  quoteTermsCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  quoteTermsText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.2%'),
  },
  quoteTermsBullet: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  quoteTermsNumber: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL_MID,
  },

  /* ── Empty State ──────────────────────────── */
  quoteEmptyState: {
    backgroundColor: CARD,
    padding: wp('10%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  quoteEmptyText: {
    fontSize: wp('3.3%'),
    color: TEXT_MUTED,
    marginTop: hp('1.2%'),
  },

  /* ── Vehicle Images ───────────────────────── */
  quoteImageScroll: {
    marginTop: hp('1%'),
  },
  quoteImageContainer: {
    marginRight: wp('3%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOW_SM,
  },
  quoteImage: {
    width: wp('70%'),
    height: hp('25%'),
    borderRadius: wp('3%'),
  },
});

export default BikeBookingDetailScreen;

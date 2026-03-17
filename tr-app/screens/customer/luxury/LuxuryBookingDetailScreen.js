import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Payment Pending',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: 'wallet-outline',
    description: 'Please pay the advance amount to confirm your booking',
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'time-outline',
    description: 'Your payment is being verified. We will confirm shortly.',
  },
  ADVANCE_PAID: {
    label: 'Advance Paid',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'checkmark-circle',
    description: 'Your advance payment is received. Booking confirmed!',
  },
  CONFIRMED: {
    label: 'Booking Confirmed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'checkmark-circle',
    description: 'Your booking is confirmed. Driver will be assigned soon.',
  },
  DRIVER_ASSIGNED: {
    label: 'Driver Assigned',
    color: '#6366F1',
    bgColor: '#E0E7FF',
    icon: 'person',
    description: 'Your driver is ready. Share the OTP when driver asks.',
  },
  IN_PROGRESS: {
    label: 'Trip in Progress',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'car',
    description: 'Enjoy your luxurious journey!',
  },
  COMPLETED: {
    label: 'Trip Completed',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'checkmark-circle',
    description: 'Thank you for choosing our premium service',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'close-circle',
    description: 'This booking has been cancelled',
  },
  DROPPED: {
    label: 'Dropped',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'arrow-down-circle',
    description: 'This booking was dropped by the system',
  },
};

const TRIP_TYPE_LABELS = {
  local: 'Local',
  outstation: 'Outstation',
  airport: 'Airport Transfer',
};

export default function LuxuryBookingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [booking, setBooking] = useState(null);

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

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

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/customer/luxury-bookings/${bookingId}`);
      if (response.data.success) {
        setBooking(response.data.booking);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load booking details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching luxury booking details:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookingDetails();
  };

  const handleCallVendor = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleCallDriver = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handlePayment = () => {
    navigation.navigate('PaymentScreen', {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      bookingType: 'luxury',
      amount: booking.advanceAmount,
    });
  };

  const handleViewInvoice = () => {
    // Get base URL from api config (handles dev/prod automatically)
    const baseURL = api.defaults.baseURL;
    const invoiceUrl = `${baseURL}/luxury-bookings/${booking.id}/invoice`;
    Linking.openURL(invoiceUrl).catch(err => {
      Alert.alert('Error', 'Failed to open invoice');
      console.error('Failed to open invoice:', err);
    });
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={{ color: TEXT_SECONDARY, marginTop: hp('1.5%'), fontSize: wp('3.5%'), fontWeight: '500' }}>
            Loading booking details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Booking Details</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}>
          <View style={{ alignItems: 'center', paddingHorizontal: wp('8%') }}>
            <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.emptyCircle}>
              <Ionicons name="car" size={wp('12%')} color={TEAL_MID} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Booking Not Found</Text>
            <Text style={styles.emptyDesc}>We couldn't find this booking. It may have been removed.</Text>
            <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={16} color={TEAL_MID} />
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Booking Details</Text>
            <Text style={styles.headerSub}>Luxury · #{booking.bookingNumber}</Text>
          </View>
          <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Glass summary card */}
        <View style={styles.glassCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.glassLabel}>STATUS</Text>
              <Text style={styles.glassValue}>{statusConfig.label}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.color }]}>
              <Ionicons name={statusConfig.icon} size={14} color="#FFF" />
              <Text style={styles.statusPillText}>{statusConfig.label}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaChipText}>{formatDate(booking.pickupDate)}</Text>
            </View>
            {booking.pickupTime && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaChipText}>{booking.pickupTime}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusMsgCard}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusConfig.color + '15' }]}>
            <Ionicons name={statusConfig.icon} size={wp('6%')} color={statusConfig.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <Text style={styles.statusDescription}>{statusConfig.description}</Text>
          </View>
        </View>

        {/* Payment Pending - Show Pay Now Button */}
        {booking.status === 'PENDING_PAYMENT' && (
          <TouchableOpacity style={styles.payNowBtnWrap} onPress={handlePayment}>
            <LinearGradient colors={[TEAL_MID, '#047857']} style={styles.payNowBtnGrad}>
              <Ionicons name="wallet" size={22} color="#FFF" />
              <Text style={styles.payNowText}>Pay Advance Amount - {formatCurrency(booking.advanceAmount)}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* View Invoice Button — temporarily disabled, will redesign invoice format */}
        {/* {['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <TouchableOpacity style={styles.invoiceBtn} onPress={handleViewInvoice}>
            <Ionicons name="document-text-outline" size={22} color={TEAL_MID} />
            <Text style={styles.invoiceBtnText}>View Invoice</Text>
            <Ionicons name="arrow-forward" size={20} color={TEAL_MID} />
          </TouchableOpacity>
        )} */}

        {/* Trip OTP - Show only when status is READY_FOR_PICKUP or IN_PROGRESS and OTP not verified */}
        {booking.tripStartOtp &&
          !booking.tripOtpVerified &&
          (booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
            <View style={styles.otpCard}>
              <View style={styles.detailsHeader}>
                <View style={[styles.detailsIcon, { backgroundColor: TEAL_LIGHT }]}>
                  <Ionicons name="key" size={wp('4.5%')} color={TEAL_MID} />
                </View>
                <Text style={styles.detailsTitle}>Trip Start OTP</Text>
              </View>
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Share this OTP with driver at pickup:</Text>
                <View style={styles.otpBox}>
                  <Text style={styles.otpText}>{booking.tripStartOtp}</Text>
                </View>
                <Text style={styles.otpHint}>Driver will verify this OTP before trip starts</Text>
              </View>
            </View>
          )}

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

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="car" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Trip Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trip Type</Text>
            <Text style={styles.detailValue}>{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</Text>
          </View>

          {booking.occasion && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Occasion</Text>
              <Text style={styles.detailValue}>{booking.occasion}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Category</Text>
            <Text style={styles.detailValue}>{booking.carCategoryName || booking.carCategory}</Text>
          </View>

          {booking.vehicleName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{booking.vehicleName}</Text>
            </View>
          )}

          {booking.vehicleNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle Number</Text>
              <Text style={[styles.detailValue, { fontWeight: '700' }]}>{booking.vehicleNumber}</Text>
            </View>
          )}

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationText}>{booking.pickupCity}</Text>
                {booking.pickupAddress && (
                  <Text style={styles.locationAddress}>{booking.pickupAddress}</Text>
                )}
              </View>
            </View>

            {booking.dropCity && (
              <>
                <View style={styles.locationLine} />
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationLabel}>Drop Location</Text>
                    <Text style={styles.locationText}>{booking.dropCity}</Text>
                    {booking.dropAddress && (
                      <Text style={styles.locationAddress}>{booking.dropAddress}</Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDate(booking.pickupDate)} | {booking.pickupTime || '10:00 AM'}
            </Text>
          </View>

          {booking.returnDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Return Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking.returnDate)}</Text>
            </View>
          )}

          {booking.tripDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Duration</Text>
              <Text style={styles.detailValue}>{booking.tripDays} Day{booking.tripDays > 1 ? 's' : ''}</Text>
            </View>
          )}

          {booking.tripHours > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Package</Text>
              <Text style={styles.detailValue}>{booking.tripHours} Hours</Text>
            </View>
          )}
        </View>

        {/* Driver Details */}
        {booking.driverName && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsIcon}>
                <Ionicons name="person" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.detailsTitle}>Driver Details</Text>
            </View>

            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={wp('7%')} color={TEAL_MID} />
              </View>
              <View style={{ flex: 1, marginLeft: wp('3%') }}>
                <Text style={styles.driverName}>{booking.driverName}</Text>
                {booking.driverPhone && (
                  <TouchableOpacity
                    style={styles.driverPhoneRow}
                    onPress={() => handleCallDriver(booking.driverPhone)}
                  >
                    <Ionicons name="call" size={14} color={TEAL} />
                    <Text style={styles.driverPhone}>{booking.driverPhone}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {booking.driverPhone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCallDriver(booking.driverPhone)}
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Vendor Details */}
        {booking.vendor && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsIcon}>
                <Ionicons name="business" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.detailsTitle}>Vendor Details</Text>
            </View>

            <View style={styles.vendorInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vendorName}>{booking.vendor.businessName}</Text>
                {booking.vendor.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{booking.vendor.rating.toFixed(1)} ★</Text>
                  </View>
                )}
              </View>
              {booking.vendor.phone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCallVendor(booking.vendor.phone)}
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Quote Details */}
        {booking.quote && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsIcon}>
                <Ionicons name="document-text" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.detailsTitle}>Quote Details</Text>
            </View>

            <View style={styles.quoteInfo}>
              <Text style={styles.quoteLabel}>Quote Number</Text>
              <Text style={styles.quoteValue}>#{booking.quote.quoteNumber}</Text>
            </View>

            {booking.quote.inclusions && booking.quote.inclusions.length > 0 && (
              <View style={styles.inclusionsBox}>
                <Text style={styles.inclusionsTitle}>Inclusions:</Text>
                {booking.quote.inclusions.map((item, index) => (
                  <View key={index} style={styles.inclusionRow}>
                    <Ionicons name="checkmark-circle" size={16} color={TEAL} />
                    <Text style={styles.inclusionText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {booking.quote.exclusions && booking.quote.exclusions.length > 0 && (
              <View style={styles.exclusionsBox}>
                <Text style={styles.exclusionsTitle}>Exclusions:</Text>
                {booking.quote.exclusions.map((item, index) => (
                  <View key={index} style={styles.exclusionRow}>
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={styles.exclusionText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {booking.quote.vendorMessage && (
              <View style={styles.messageBox}>
                <Ionicons name="chatbubble" size={16} color={TEAL} />
                <Text style={styles.messageText}>{booking.quote.vendorMessage}</Text>
              </View>
            )}
          </View>
        )}

        {/* Decoration Details */}
        {booking.needDecoration && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={[styles.detailsIcon, { backgroundColor: '#FCE7F3' }]}>
                <MaterialCommunityIcons name="flower" size={wp('4.5%')} color="#DB2777" />
              </View>
              <Text style={styles.detailsTitle}>Decoration</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{booking.decorationType || 'Premium'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Charges</Text>
              <Text style={styles.detailValue}>{formatCurrency(booking.decorationCharges)}</Text>
            </View>
          </View>
        )}

        {/* Requirements */}
        {booking.requirements && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsIcon}>
                <Ionicons name="list" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.detailsTitle}>Special Requirements</Text>
            </View>
            <Text style={styles.requirementsText}>{booking.requirements}</Text>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="wallet" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Payment Details</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Amount</Text>
            <Text style={styles.priceValue}>{formatCurrency(booking.baseAmount)}</Text>
          </View>

          {booking.chauffeurCharges > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Chauffeur Charges</Text>
              <Text style={styles.priceValue}>{formatCurrency(booking.chauffeurCharges)}</Text>
            </View>
          )}

          {booking.decorationCharges > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Decoration Charges</Text>
              <Text style={styles.priceValue}>{formatCurrency(booking.decorationCharges)}</Text>
            </View>
          )}

          {booking.gstAmount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>{formatCurrency(booking.gstAmount)}</Text>
            </View>
          )}

          <View style={styles.separator} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.grandTotal)}</Text>
          </View>

          <View style={styles.advanceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.advanceLabel}>
                Advance Amount ({booking.advancePercent}%)
              </Text>
              <Text style={styles.advanceValue}>{formatCurrency(booking.advanceAmount)}</Text>
            </View>
            {booking.advancePaid > 0 && (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={16} color={TEAL} />
                <Text style={styles.paidText}>Paid</Text>
              </View>
            )}
          </View>

          {booking.balanceAmount > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Amount</Text>
              <Text style={styles.balanceValue}>{formatCurrency(booking.balanceAmount)}</Text>
            </View>
          )}
        </View>

        {/* Quote Details Button - Show if quote exists */}
        {booking.quote && (
          <TouchableOpacity
            style={styles.viewQuoteDetailsBtn}
            onPress={() => setQuoteDetailsVisible(true)}
          >
            <Ionicons name="document-text-outline" size={22} color={TEAL_MID} />
            <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
            <Ionicons name="chevron-forward" size={20} color={TEAL_MID} />
          </TouchableOpacity>
        )}

        {/* Booking Timeline */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="time" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Booking Info</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked On</Text>
            <Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text>
          </View>
        </View>

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
              <View style={[styles.decoCircle, { top: -20, right: -15, width: 80, height: 80 }]} pointerEvents="none" />
              <View style={[styles.decoCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} pointerEvents="none" />
              <View style={styles.quoteModalHeaderRow}>
                <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.backBtn}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Quote Details</Text>
                  <Text style={styles.headerSub}>#{booking.quote.quoteNumber}</Text>
                </View>
                <View style={{ width: wp('9%') }} />
              </View>
            </LinearGradient>

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

            <ScrollView style={styles.quoteModalContent} showsVerticalScrollIndicator={false}>
              {/* Tab Content */}
              <View style={styles.quoteTabContent}>
                {/* Overview Tab */}
                {detailsTab === 'overview' && (
                  <View>
                    {/* Vehicle Features */}
                    {(() => {
                      const features = parseListData(booking.quote.vehicleFeatures);
                      return features.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <Ionicons name="checkmark-circle" size={22} color={TEAL} />
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
                                <Ionicons name="checkmark-circle" size={16} color={TEAL} />
                                <Text style={styles.quoteFeatureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Vendor Info */}
                    {booking.vendor && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <Ionicons name="business-outline" size={22} color={TEAL} />
                          <Text style={styles.quoteSectionTitle}>Vendor Information</Text>
                        </View>
                        <View style={styles.quoteInfoCard}>
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="storefront-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>{booking.vendor.businessName}</Text>
                          </View>
                          {booking.vendor.rating > 0 && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="star-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>{booking.vendor.rating.toFixed(1)} ★ Rating</Text>
                            </View>
                          )}
                          {booking.vendor.city && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="location-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>{booking.vendor.city}{booking.vendor.state ? `, ${booking.vendor.state}` : ''}</Text>
                            </View>
                          )}
                          {booking.vendor.phone && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="call-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>{booking.vendor.phone}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Vehicle & Chauffeur Details */}
                    <View style={styles.quoteSection}>
                      <View style={styles.quoteSectionHeader}>
                        <Ionicons name="information-circle-outline" size={22} color={TEAL} />
                        <Text style={styles.quoteSectionTitle}>Additional Information</Text>
                      </View>
                      <View style={styles.quoteInfoCard}>
                        {booking.quote.vehicleName && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="car-sport-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>Vehicle: {booking.quote.vehicleName}</Text>
                          </View>
                        )}
                        {booking.quote.vehicleModel && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="car-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>
                              Model: {booking.quote.vehicleModel}
                            </Text>
                          </View>
                        )}
                        {!!booking.quote.vehicleYear && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="calendar-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>
                              Year: {booking.quote.vehicleYear}
                            </Text>
                          </View>
                        )}
                        {booking.quote.vehicleNumber && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="card-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>
                              Registration: {booking.quote.vehicleNumber}
                            </Text>
                          </View>
                        )}
                        {booking.quote.driverName && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="person-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>
                              Chauffeur: {booking.quote.driverName}
                            </Text>
                          </View>
                        )}
                        {booking.quote.driverPhone && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="call-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>
                              Phone: {booking.quote.driverPhone}
                            </Text>
                          </View>
                        )}
                        {booking.quote.driverExperience > 0 && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="ribbon-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteInfoText}>
                              Experience: {booking.quote.driverExperience} years
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Vendor Message */}
                      {booking.quote.vendorMessage && (
                        <View style={styles.quoteVendorMessage}>
                          <View style={styles.quoteMessageHeader}>
                            <Ionicons name="chatbox-outline" size={18} color={TEAL} />
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
                      <Ionicons name="checkmark-done-circle" size={22} color={TEAL} />
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
                                <Ionicons name="checkmark" size={18} color={TEAL} />
                              </View>
                              <Text style={styles.quoteListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
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
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
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
                                <Ionicons name="close" size={18} color="#EF4444" />
                              </View>
                              <Text style={styles.quoteListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
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
                      <Ionicons name="document-text" size={22} color={TEAL} />
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
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Gradient Header
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: hp('2%'),
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
    marginBottom: hp('1.5%'),
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

  // Glass card
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 999,
    gap: wp('1.5%'),
  },
  statusPillText: {
    color: '#FFF',
    fontSize: wp('2.8%'),
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginTop: hp('1.2%'),
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

  // Empty state
  emptyCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  emptyDesc: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    fontSize: wp('3.3%'),
    lineHeight: wp('5%'),
    marginBottom: hp('2%'),
  },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: wp('2%'),
  },
  goBackBtnText: {
    color: TEAL_MID,
    fontWeight: '700',
    fontSize: wp('3.3%'),
  },

  // Content
  content: {
    flex: 1,
  },

  // Status message card
  statusMsgCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    gap: wp('3%'),
    ...SHADOW_SM,
  },
  statusIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    marginBottom: hp('0.3%'),
  },
  statusDescription: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.5%'),
  },

  // Pay Now Button
  payNowBtnWrap: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  payNowBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  payNowText: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#FFF',
  },

  // Invoice Button
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: TEAL_LIGHT,
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  invoiceBtnText: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEAL_MID,
    textAlign: 'center',
  },

  // OTP Card
  otpCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    ...SHADOW_SM,
  },
  otpContainer: {
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('1.5%'),
  },
  otpBox: {
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('2%'),
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: TEAL,
    borderStyle: 'dashed',
  },
  otpText: {
    fontSize: wp('8%'),
    fontWeight: '800',
    color: TEAL_MID,
    letterSpacing: 8,
  },
  otpHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('1.2%'),
    textAlign: 'center',
  },

  // Details card
  detailsCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.5%'),
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
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Location
  locationSection: {
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: hp('0.5%'),
  },
  locationDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    marginRight: wp('3%'),
    marginTop: hp('0.5%'),
  },
  locationLine: {
    width: 2,
    height: hp('2.5%'),
    backgroundColor: '#E5E7EB',
    marginLeft: wp('1%'),
    marginVertical: hp('0.3%'),
  },
  locationLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  locationText: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp('1.5%'),
  },

  // Driver Info
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  driverPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  driverPhone: {
    fontSize: wp('3.2%'),
    color: TEAL,
    fontWeight: '600',
  },
  callBtn: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL_MID,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Vendor Info
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  ratingText: {
    fontSize: wp('3%'),
    color: '#F59E0B',
    fontWeight: '600',
  },

  // Quote Info
  quoteInfo: {
    marginBottom: hp('1.5%'),
  },
  quoteLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginBottom: hp('0.3%'),
    fontWeight: '500',
  },
  quoteValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  inclusionsBox: {
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
  },
  inclusionsTitle: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginBottom: hp('0.8%'),
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('0.5%'),
  },
  inclusionText: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    flex: 1,
  },
  exclusionsBox: {
    backgroundColor: '#FEE2E2',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
  },
  exclusionsTitle: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: hp('0.8%'),
  },
  exclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('0.5%'),
  },
  exclusionText: {
    fontSize: wp('3%'),
    color: '#991B1B',
    flex: 1,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2%'),
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    borderRadius: wp('3%'),
  },
  messageText: {
    flex: 1,
    fontSize: wp('3%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('4.5%'),
  },
  requirementsText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5%'),
  },

  // Payment
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
  },
  priceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  totalLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  advanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    borderRadius: wp('3%'),
    marginTop: hp('1.2%'),
    marginBottom: hp('0.8%'),
  },
  advanceLabel: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    marginBottom: hp('0.3%'),
  },
  advanceValue: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: '#ECFDF5',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: 999,
  },
  paidText: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp('0.5%'),
  },
  balanceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  balanceValue: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#EF4444',
  },

  // View Quote Details Button
  viewQuoteDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingVertical: hp('1.6%'),
    borderRadius: wp('3%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    ...SHADOW_SM,
  },
  viewQuoteDetailsText: {
    color: TEAL_MID,
    fontSize: wp('3.5%'),
    fontWeight: '600',
    marginLeft: wp('2.5%'),
    marginRight: wp('1.5%'),
  },

  // ========== Quote Details Modal Styles ==========
  quoteModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  quoteModalHeaderGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: hp('2%'),
    overflow: 'hidden',
  },
  quoteModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteModalContent: {
    flex: 1,
  },

  // Tabs
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
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    borderBottomWidth: 2,
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

  // Tab Content
  quoteTabContent: {
    padding: wp('4%'),
  },
  quoteSection: {
    marginBottom: hp('2%'),
  },
  quoteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  quoteSectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
  },

  // Features
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
    paddingTop: 1,
  },

  // Info Card
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
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('2.5%'),
    flex: 1,
  },

  // Vendor Message
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
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginLeft: wp('2%'),
  },
  quoteMessageText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },

  // List Card (Inclusions/Exclusions)
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
    marginTop: 2,
  },
  quoteExclusionBullet: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  quoteListText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.2%'),
    flex: 1,
    paddingTop: 3,
  },

  // Terms Card
  quoteTermsCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  quoteTermsText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
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

  // Empty State
  quoteEmptyState: {
    backgroundColor: CARD,
    padding: wp('10%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  quoteEmptyText: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    marginTop: hp('1.2%'),
  },
});

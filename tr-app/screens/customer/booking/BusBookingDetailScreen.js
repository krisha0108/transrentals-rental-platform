import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: '#F59E0B', icon: 'time-outline' },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  ADVANCE_PAID: { label: 'Advance Paid', color: '#10B981', icon: 'checkmark-done-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-done-circle' },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: '#8B5CF6', icon: 'bus-outline' },
  IN_PROGRESS: { label: 'Trip In Progress', color: '#F59E0B', icon: 'navigate-circle-outline' },
  COMPLETED: { label: 'Completed', color: '#10B981', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
  DROPPED: { label: 'Dropped', color: '#EF4444', icon: 'arrow-down-circle-outline' },
};

export default function BusBookingDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('light');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchBookingDetails();

      const interval = setInterval(() => {
        fetchBookingDetails(true);
      }, 30000);

      return () => clearInterval(interval);
    }, [bookingId])
  );

  const fetchBookingDetails = async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const response = await api.get(`/bus-bookings/${bookingId}`);
      if (response.data.success) {
        setBooking(response.data.booking);
      }
    } catch (error) {
      console.log('Error fetching bus booking:', error);
      if (!isBackground) {
        Alert.alert('Error', 'Failed to load booking details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookingDetails();
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

  const handleCallVendor = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('No Contact', 'Vendor phone number not available');
      return;
    }
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) => {
      console.log('Error calling vendor:', err);
      Alert.alert('Error', 'Failed to open phone dialer');
    });
  };

  const handlePayment = () => {
    navigation.navigate('PaymentScreen', {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      bookingType: 'bus',
      amount: booking.advanceAmount,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.loadingGradient}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <SafeAreaView edges={['top']} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: 'transparent' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={wp('5.5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Bus Booking</Text>
            <Text style={styles.headerSub}>{booking.bookingNumber}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('BookingChat', {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              vendorName: booking.vendor?.businessName || booking.vendorName || 'Vendor'
            })}
          >
            <Ionicons name="chatbubble-outline" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={wp('4.5%')} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusConfig.color + '18' }]}>
            <Ionicons name={statusConfig.icon} size={wp('6%')} color={statusConfig.color} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Payment Pending - Show Pay Now Button */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <TouchableOpacity style={styles.payNowBtn} onPress={handlePayment}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.payNowGradient}>
              <Ionicons name="wallet" size={wp('5.5%')} color="#FFFFFF" />
              <Text style={styles.payNowText}>
                Pay Advance Amount - ₹{booking.advanceAmount?.toLocaleString('en-IN')}
              </Text>
              <Ionicons name="arrow-forward" size={wp('5%')} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Payment Submitted - Verification Pending */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <View style={styles.paymentVerificationCard}>
            <View style={styles.verificationIconContainer}>
              <View style={styles.verificationIconBg}>
                <Ionicons name="hourglass-outline" size={wp('8%')} color="#3B82F6" />
              </View>
              <View style={styles.pulseDot} />
            </View>

            <Text style={styles.verificationTitle}>Payment Verification in Progress</Text>
            <Text style={styles.verificationSubtitle}>
              Your payment has been submitted successfully
            </Text>

            <View style={styles.verificationInfoBox}>
              <View style={styles.verificationInfoRow}>
                <View style={[styles.verInfoIcon, { backgroundColor: '#10B98118' }]}>
                  <Ionicons name="checkmark-circle" size={wp('4%')} color="#10B981" />
                </View>
                <Text style={styles.verificationInfoText}>
                  Payment received and being verified
                </Text>
              </View>
              <View style={styles.verificationInfoRow}>
                <View style={[styles.verInfoIcon, { backgroundColor: '#F59E0B18' }]}>
                  <Ionicons name="time-outline" size={wp('4%')} color="#F59E0B" />
                </View>
                <Text style={styles.verificationInfoText}>
                  Usually takes 15-30 minutes
                </Text>
              </View>
              <View style={styles.verificationInfoRow}>
                <View style={[styles.verInfoIcon, { backgroundColor: '#3B82F618' }]}>
                  <Ionicons name="notifications-outline" size={wp('4%')} color="#3B82F6" />
                </View>
                <Text style={styles.verificationInfoText}>
                  You'll be notified once confirmed
                </Text>
              </View>
            </View>

            <View style={styles.verificationFooter}>
              <Ionicons name="shield-checkmark" size={wp('4%')} color={TEXT_MUTED} />
              <Text style={styles.verificationFooterText}>
                Our team is verifying your payment details
              </Text>
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL + '18' }]}>
              <MaterialCommunityIcons name="bus" size={wp('5%')} color={TEAL} />
            </View>
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: TEAL }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tripLabel}>Pickup</Text>
                <Text style={styles.tripValue}>{booking.pickupCity}</Text>
                {booking.pickupAddress && (
                  <Text style={styles.tripAddress}>{booking.pickupAddress}</Text>
                )}
              </View>
            </View>

            {booking.dropCity && (
              <>
                <View style={styles.tripLine} />
                <View style={styles.tripPoint}>
                  <View style={[styles.tripDot, { backgroundColor: '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripLabel}>Drop</Text>
                    <Text style={styles.tripValue}>{booking.dropCity}</Text>
                    {booking.dropAddress && (
                      <Text style={styles.tripAddress}>{booking.dropAddress}</Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trip Type</Text>
            <Text style={styles.detailValue}>
              {booking.tripType?.charAt(0).toUpperCase() + booking.tripType?.slice(1)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers</Text>
            <Text style={styles.detailValue}>{booking.passengers} people</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup Date</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              • {booking.pickupTime || 'TBD'}
            </Text>
          </View>

          {booking.returnDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Return Date</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.returnDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                • {booking.returnTime || 'TBD'}
              </Text>
            </View>
          )}

          {booking.tripDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Duration</Text>
              <Text style={styles.detailValue}>{booking.tripDays} days</Text>
            </View>
          )}
        </View>

        {/* Vehicle & Driver Details */}
        {(booking.vehicleNumber || booking.driverName) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#8B5CF618' }]}>
                <Ionicons name="bus-outline" size={wp('5%')} color="#8B5CF6" />
              </View>
              <Text style={styles.cardTitle}>Vehicle & Driver Details</Text>
            </View>

            {booking.vehicleName && (
              <View style={styles.vehicleBox}>
                <View style={[styles.vehicleIconCircle]}>
                  <MaterialCommunityIcons name="bus" size={wp('7%')} color={TEAL} />
                </View>
                <View style={{ flex: 1, marginLeft: wp('3%') }}>
                  <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
                  {booking.vehicleCategory && (
                    <Text style={styles.vehicleCategory}>{booking.vehicleCategory}</Text>
                  )}
                  {booking.vehicleNumber && (
                    <Text style={styles.vehicleNumber}>
                      Reg: {booking.vehicleNumber}
                    </Text>
                  )}
                  {booking.vehicleModel && (
                    <Text style={styles.vehicleModel}>Model: {booking.vehicleModel}</Text>
                  )}
                </View>
              </View>
            )}

            {booking.driverName && (
              <>
                <View style={styles.divider} />
                <View style={styles.driverBox}>
                  <View style={styles.driverAvatarCircle}>
                    <Ionicons name="person" size={wp('5.5%')} color={TEAL} />
                  </View>
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.driverName}>{booking.driverName}</Text>
                    <Text style={styles.driverLabel}>Driver</Text>
                    {booking.driverPhone && (
                      <TouchableOpacity
                        onPress={() => handleCallDriver(booking.driverPhone)}
                        style={styles.callBtn}
                      >
                        <Ionicons name="call" size={wp('3.5%')} color={TEAL} />
                        <Text style={styles.callBtnText}>{booking.driverPhone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Trip OTP (only show when ready for pickup or in progress and OTP not verified) */}
        {booking.tripStartOtp &&
         !booking.tripOtpVerified &&
         (booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="key-outline" size={wp('5%')} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Trip Start OTP</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Share this OTP with driver to start trip</Text>
              <Text style={styles.otpValue}>{booking.tripStartOtp}</Text>
            </View>
          </View>
        )}

        {/* Vendor Details */}
        {booking.vendor && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#3B82F618' }]}>
                <Ionicons name="business-outline" size={wp('5%')} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Vendor Details</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{booking.vendor.name}</Text>
            </View>

            {booking.vendor.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact</Text>
                <TouchableOpacity
                  onPress={() => handleCallVendor(booking.vendor.phone)}
                  style={styles.callBtnInline}
                >
                  <Ionicons name="call" size={wp('3.5%')} color={TEAL} />
                  <Text style={[styles.detailValue, { color: TEAL, marginLeft: wp('1.5%') }]}>
                    {booking.vendor.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {booking.vendor.rating > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rating</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={wp('4%')} color="#F59E0B" />
                  <Text style={[styles.detailValue, { marginLeft: wp('1%') }]}>
                    {booking.vendor.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL + '18' }]}>
              <Ionicons name="wallet-outline" size={wp('5%')} color={TEAL} />
            </View>
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          {booking.baseAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base Amount</Text>
              <Text style={styles.detailValue}>₹{booking.baseAmount?.toLocaleString()}</Text>
            </View>
          )}

          {booking.gstAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GST</Text>
              <Text style={styles.detailValue}>₹{booking.gstAmount?.toLocaleString()}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { marginTop: hp('1%') }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{booking.totalAmount?.toLocaleString()}</Text>
          </View>

          {booking.advanceAmount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Advance Amount</Text>
                <Text style={[styles.detailValue, { color: TEAL }]}>
                  ₹{booking.advanceAmount?.toLocaleString()}
                </Text>
              </View>

              {booking.balanceAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance Due</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    ₹{booking.balanceAmount?.toLocaleString()}
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor:
                    booking.paymentStatus === 'PAID' || booking.advancePaid
                      ? TEAL + '15'
                      : '#F59E0B15',
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  {
                    color:
                      booking.paymentStatus === 'PAID' || booking.advancePaid ? TEAL : '#F59E0B',
                  },
                ]}
              >
                {booking.advancePaid ? 'Advance Paid' : booking.paymentStatus || 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quote Details Button - Show if quote details exist */}
        {booking.quote && (
          <TouchableOpacity
            style={styles.viewQuoteDetailsBtn}
            onPress={() => setQuoteDetailsVisible(true)}
          >
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.viewQuoteGradient}>
              <Ionicons name="document-text-outline" size={wp('5.5%')} color="#FFFFFF" />
              <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
              <Ionicons name="chevron-forward" size={wp('5%')} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Trip Timeline (if trip started/completed) */}
        {(booking.tripStartedAt || booking.tripEndedAt) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#6366F118' }]}>
                <Ionicons name="time-outline" size={wp('5%')} color="#6366F1" />
              </View>
              <Text style={styles.cardTitle}>Trip Timeline</Text>
            </View>

            {booking.tripStartedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trip Started</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.tripStartedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {booking.tripEndedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trip Ended</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.tripEndedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>
        )}

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
              onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: 'bus' })}
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

        <View style={{ height: hp('3%') }} />
      </ScrollView>

      {/* Quote Details Modal */}
      {booking && booking.quote && (
        <Modal
          visible={quoteDetailsVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setQuoteDetailsVisible(false)}
        >
          <SafeAreaView style={styles.quoteModalContainer} edges={['bottom']}>
            {/* Header */}
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.quoteModalHeader}>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
              <SafeAreaView edges={['top']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, backgroundColor: 'transparent' }}>
                <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.quoteCloseBtn}>
                  <Ionicons name="close" size={wp('6.5%')} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.quoteModalTitle}>Quote Details</Text>
                <View style={{ width: wp('10%') }} />
              </SafeAreaView>
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
                          <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL_LIGHT }]}>
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
                            <View style={styles.quoteFeatureItem}>
                              <Ionicons name="call-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>{booking.vendor.phone}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Bus / Vehicle Info Card */}
                    {(booking.quote.vehicleName || booking.quote.vehicleCategory || booking.quote.seats) && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL + '18' }]}>
                            <MaterialCommunityIcons name="bus" size={wp('5%')} color={TEAL} />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Vehicle Info</Text>
                        </View>
                        <View style={styles.quoteListCard}>
                          {booking.quote.vehicleName ? (
                            <View style={[styles.quoteFeatureItem]}>
                              <Ionicons name="bus-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>{booking.quote.vehicleName}</Text>
                            </View>
                          ) : null}
                          {booking.quote.vehicleCategory ? (
                            <View style={[styles.quoteFeatureItem]}>
                              <Ionicons name="layers-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>Category: {booking.quote.vehicleCategory}</Text>
                            </View>
                          ) : null}
                          {booking.quote.seats ? (
                            <View style={[styles.quoteFeatureItem]}>
                              <Ionicons name="people-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>{booking.quote.seats} Seats</Text>
                            </View>
                          ) : null}
                          {booking.quote.vehicleNumber ? (
                            <View style={[styles.quoteFeatureItem]}>
                              <Ionicons name="card-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>Reg: {booking.quote.vehicleNumber}</Text>
                            </View>
                          ) : null}
                          {booking.quote.vehicleModel ? (
                            <View style={[styles.quoteFeatureItem, styles.quoteFeatureItemLast]}>
                              <Ionicons name="build-outline" size={wp('4%')} color={TEAL} />
                              <Text style={styles.quoteFeatureText}>Model: {booking.quote.vehicleModel}{booking.quote.vehicleYear ? ` (${booking.quote.vehicleYear})` : ''}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                    {/* Vehicle Features */}
                    {(() => {
                      const features = parseListData(booking.quote.vehicleFeatures);
                      return features.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <View style={[styles.quoteSectionIcon, { backgroundColor: '#F59E0B18' }]}>
                              <Ionicons name="star-outline" size={wp('5%')} color="#F59E0B" />
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

                    {/* Driver Details */}
                    {(booking.quote.driverName || booking.quote.driverPhone || booking.quote.driverExperience) && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.quoteSectionIcon, { backgroundColor: '#3B82F618' }]}>
                            <Ionicons name="person-circle-outline" size={wp('5%')} color="#3B82F6" />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Driver Details</Text>
                        </View>
                        <View style={styles.quoteListCard}>
                          {booking.quote.driverName ? (
                            <View style={[styles.quoteFeatureItem]}>
                              <Ionicons name="person-outline" size={wp('4%')} color="#3B82F6" />
                              <Text style={styles.quoteFeatureText}>{booking.quote.driverName}</Text>
                            </View>
                          ) : null}
                          {booking.quote.driverPhone ? (
                            <View style={[styles.quoteFeatureItem]}>
                              <Ionicons name="call-outline" size={wp('4%')} color="#3B82F6" />
                              <Text style={styles.quoteFeatureText}>{booking.quote.driverPhone}</Text>
                            </View>
                          ) : null}
                          {booking.quote.driverExperience ? (
                            <View style={[styles.quoteFeatureItem, styles.quoteFeatureItemLast]}>
                              <Ionicons name="ribbon-outline" size={wp('4%')} color="#3B82F6" />
                              <Text style={styles.quoteFeatureText}>{booking.quote.driverExperience} yrs experience</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                    {/* Fare Breakdown */}
                    {(booking.quote.baseAmount > 0 || booking.quote.perKmRate > 0 || booking.quote.perDayRate > 0) && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.quoteSectionIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="wallet-outline" size={wp('5%')} color={TEAL} />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Fare Breakdown</Text>
                        </View>
                        <View style={styles.quoteListCard}>
                          {booking.quote.baseAmount > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Base Amount</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.baseAmount?.toLocaleString('en-IN')}</Text>
                            </View>
                          )}
                          {booking.quote.perKmRate > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Per KM Rate</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.perKmRate}/km</Text>
                            </View>
                          )}
                          {booking.quote.perDayRate > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Per Day Rate</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.perDayRate}/day</Text>
                            </View>
                          )}
                          {booking.quote.includedKm > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Included KM</Text>
                              <Text style={styles.quoteFareValue}>{booking.quote.includedKm} km</Text>
                            </View>
                          )}
                          {booking.quote.includedHours > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Included Hours</Text>
                              <Text style={styles.quoteFareValue}>{booking.quote.includedHours} hrs</Text>
                            </View>
                          )}
                          {booking.quote.driverAllowance > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Driver Allowance</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.driverAllowance}</Text>
                            </View>
                          )}
                          {booking.quote.nightHaltCharges > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Night Halt</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.nightHaltCharges}</Text>
                            </View>
                          )}
                          {booking.quote.tollEstimate > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Toll (Est.)</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.tollEstimate}</Text>
                            </View>
                          )}
                          {booking.quote.permitCharges > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Permit Charges</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.permitCharges}</Text>
                            </View>
                          )}
                          {booking.quote.extraKmRate > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>Extra KM Rate</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.extraKmRate}/km</Text>
                            </View>
                          )}
                          {booking.quote.gstAmount > 0 && (
                            <View style={styles.quoteFareRow}>
                              <Text style={styles.quoteFareLabel}>GST</Text>
                              <Text style={styles.quoteFareValue}>₹{booking.quote.gstAmount?.toLocaleString('en-IN')}</Text>
                            </View>
                          )}
                          <View style={[styles.quoteFareRow, styles.quoteFareTotalRow]}>
                            <Text style={styles.quoteFareTotalLabel}>Total Amount</Text>
                            <Text style={styles.quoteFareTotalValue}>₹{booking.quote.totalAmount?.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Vendor Message */}
                    {booking.quote.vendorMessage && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteVendorMessage}>
                          <View style={styles.quoteMessageHeader}>
                            <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL + '18' }]}>
                              <Ionicons name="chatbox-outline" size={wp('4%')} color={TEAL} />
                            </View>
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
                      <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL + '18' }]}>
                        <Ionicons name="checkmark-done-circle" size={wp('5%')} color={TEAL} />
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
                      <View style={[styles.quoteSectionIcon, { backgroundColor: '#EF444418' }]}>
                        <Ionicons name="close-circle" size={wp('5%')} color="#EF4444" />
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
                                <Ionicons name="close" size={wp('4.5%')} color="#EF4444" />
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
                      <View style={[styles.quoteSectionIcon, { backgroundColor: TEAL + '18' }]}>
                        <Ionicons name="document-text" size={wp('5%')} color={TEAL} />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingText: {
    marginTop: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  errorText: {
    fontSize: wp('4%'),
    color: '#EF4444',
    textAlign: 'center',
    marginTop: hp('40%'),
  },

  // Decorative circles
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
    bottom: -wp('8%'),
    left: -wp('5%'),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? hp('0.5%') : hp('1%'),
    paddingBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.2%'),
  },
  refreshBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
  },

  // Content
  content: {
    flex: 1,
  },

  // Status Card
  statusCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    padding: wp('4%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  statusIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('10%'),
    gap: wp('1.5%'),
  },
  statusText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2.5%'),
  },
  cardIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Trip details
  tripRow: {
    marginBottom: hp('1.5%'),
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
  },
  tripDot: {
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
    marginTop: hp('0.5%'),
  },
  tripLine: {
    width: 2,
    height: hp('2.5%'),
    backgroundColor: '#E5E7EB',
    marginLeft: wp('1.2%'),
    marginVertical: hp('0.5%'),
  },
  tripLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: hp('0.3%'),
  },
  tripValue: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  tripAddress: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp('1.5%'),
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: hp('0.8%'),
    gap: wp('2%'),
  },
  detailLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  detailValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    flex: 1.5,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  totalLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEAL,
  },

  // Vehicle box
  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    borderRadius: wp('3%'),
  },
  vehicleIconCircle: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  vehicleCategory: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },
  vehicleNumber: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
    marginTop: hp('0.5%'),
  },
  vehicleModel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },

  // Driver box
  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarCircle: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  driverLabel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.8%'),
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('2%'),
    alignSelf: 'flex-start',
    gap: wp('1%'),
  },
  callBtnText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEAL,
  },
  callBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // OTP
  otpBox: {
    backgroundColor: '#FEF3C7',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: wp('3%'),
    color: '#92400E',
    marginBottom: hp('1%'),
  },
  otpValue: {
    fontSize: wp('8%'),
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: wp('2%'),
  },

  // Payment badge
  paymentBadge: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('10%'),
  },
  paymentBadgeText: {
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  // Pay Now Button
  payNowBtn: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  payNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    gap: wp('2%'),
  },
  payNowText: {
    flex: 1,
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Payment Verification Card
  paymentVerificationCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    padding: wp('4%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    ...SHADOW_MD,
  },
  verificationIconContainer: {
    position: 'relative',
    marginBottom: hp('2%'),
  },
  verificationIconBg: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  pulseDot: {
    position: 'absolute',
    top: -hp('0.5%'),
    right: -wp('1%'),
    width: wp('4%'),
    height: wp('4%'),
    borderRadius: wp('2%'),
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: CARD,
  },
  verificationTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('2.5%'),
    textAlign: 'center',
  },
  verificationInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    gap: hp('1.5%'),
    marginBottom: hp('2%'),
  },
  verificationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  verInfoIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationInfoText: {
    flex: 1,
    fontSize: wp('3.3%'),
    color: '#475569',
    fontWeight: '500',
  },
  verificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    width: '100%',
    justifyContent: 'center',
  },
  verificationFooterText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },

  // View Quote Details Button
  viewQuoteDetailsBtn: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  viewQuoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('5%'),
    overflow: 'hidden',
  },
  viewQuoteDetailsText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '600',
    marginLeft: wp('2.5%'),
    marginRight: wp('1.5%'),
    flex: 1,
  },

  // ========== Quote Details Modal Styles ==========
  quoteModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  quoteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? hp('0.5%') : hp('1%'),
    paddingBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  quoteCloseBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quoteModalContent: {
    flex: 1,
  },

  // Tabs
  quoteTabs: {
    flexDirection: 'row',
    backgroundColor: CARD,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quoteTab: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  quoteTabActive: {
    borderBottomColor: TEAL,
  },
  quoteTabText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  quoteTabTextActive: {
    color: TEAL,
  },

  // Tab Content
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
    marginRight: wp('2.5%'),
  },
  quoteSectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Features
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
    paddingTop: hp('0.1%'),
  },

  // Vendor Message
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
    color: TEAL,
  },
  quoteMessageText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },

  // List Card (Inclusions/Exclusions)
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
  quoteExclusionBullet: {
    backgroundColor: '#FEE2E2',
  },
  quoteListText: {
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.5%'),
    flex: 1,
    paddingTop: hp('0.4%'),
  },

  // Terms Card
  quoteTermsCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  quoteTermsText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
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
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEAL,
  },

  // Fare Breakdown Rows
  quoteFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.9%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quoteFareLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
  },
  quoteFareValue: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  quoteFareTotalRow: {
    borderBottomWidth: 0,
    marginTop: hp('0.5%'),
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quoteFareTotalLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  quoteFareTotalValue: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEAL,
  },

  // Empty State
  quoteEmptyState: {
    backgroundColor: CARD,
    padding: wp('10%'),
    borderRadius: wp('3.5%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  quoteEmptyText: {
    fontSize: wp('3.5%'),
    color: TEXT_MUTED,
    marginTop: hp('1.5%'),
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

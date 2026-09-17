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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: '#F59E0B', icon: 'time-outline' },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  ADVANCE_PAID: { label: 'Advance Paid', color: '#10B981', icon: 'checkmark-done-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-done-circle' },
  TEAM_ASSIGNED: { label: 'Team Assigned', color: '#8B5CF6', icon: 'people-outline' },
  PACKING: { label: 'Packing', color: '#14B8A6', icon: 'cube-outline' },
  LOADING: { label: 'Loading', color: '#06B6D4', icon: 'archive-outline' },
  IN_TRANSIT: { label: 'In Transit', color: '#8B5CF6', icon: 'navigate-circle-outline' },
  UNLOADING: { label: 'Unloading', color: '#3B82F6', icon: 'archive-outline' },
  UNPACKING: { label: 'Unpacking', color: '#14B8A6', icon: 'cube-outline' },
  COMPLETED: { label: 'Completed', color: '#10B981', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
  DROPPED: { label: 'Dropped', color: '#EF4444', icon: 'arrow-down-circle-outline' },
};

export default function PackersBookingDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

  // StatusBar management
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
      const response = await api.get(`/packers-bookings/${bookingId}`);
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
      bookingType: 'packers',
      amount: booking.advanceAmount,
    });
  };

  // ── Loading State ──
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Loading...</Text>
              <View style={{ width: wp('9%') }} />
            </View>
          </SafeAreaView>
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

  // ── Not Found State ──
  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Packers Booking</Text>
              <View style={{ width: wp('9%') }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="document-text" size={wp('12%')} color={TEAL_MID} />
          </View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: wp('4.2%'), fontWeight: '700', marginTop: hp('2%') }}>
            Booking Not Found
          </Text>
          <Text style={{ color: TEXT_SECONDARY, fontSize: wp('3.2%'), marginTop: hp('0.5%') }}>
            We could not find this booking
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  // ── Main Render ──
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Gradient Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        {/* Decorative circles */}
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />

        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Packers Booking</Text>
            <Text style={styles.headerSub}>{booking.bookingNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: wp('2%') }}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate('BookingChat', {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                vendorName: booking.vendor?.businessName || booking.vendorName || 'Vendor'
              })}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp('4%') }}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusConfig.color + '15' }]}>
            <Ionicons name={statusConfig.icon} size={wp('6%')} color={statusConfig.color} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '12' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Payment Pending - Show Pay Now Button */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <TouchableOpacity style={styles.payNowBtn} onPress={handlePayment}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.payNowGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="wallet" size={wp('5.5%')} color="#FFF" />
              <Text style={styles.payNowText}>
                Pay Advance Amount - {'\u20B9'}{booking.advanceAmount?.toLocaleString('en-IN')}
              </Text>
              <Ionicons name="arrow-forward" size={wp('5%')} color="#FFF" />
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
                <Ionicons name="checkmark-circle" size={wp('4.5%')} color="#10B981" />
                <Text style={styles.verificationInfoText}>
                  Payment received and being verified
                </Text>
              </View>
              <View style={styles.verificationInfoRow}>
                <Ionicons name="time-outline" size={wp('4.5%')} color="#F59E0B" />
                <Text style={styles.verificationInfoText}>
                  Usually takes 15-30 minutes
                </Text>
              </View>
              <View style={styles.verificationInfoRow}>
                <Ionicons name="notifications-outline" size={wp('4.5%')} color="#3B82F6" />
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

        {/* Moving Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <MaterialCommunityIcons name="package-variant" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.cardTitle}>Moving Details</Text>
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
                {booking.pickupFloor != null && (
                  <Text style={styles.tripAddress}>Floor: {booking.pickupFloor}</Text>
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
                    {booking.dropFloor != null && (
                      <Text style={styles.tripAddress}>Floor: {booking.dropFloor}</Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type</Text>
            <Text style={styles.detailValue}>
              {booking.serviceType?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shifting Type</Text>
            <Text style={styles.detailValue}>
              {booking.shiftingType?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              {booking.scheduledTime ? `\u2022 ${booking.scheduledTime}` : ''}
            </Text>
          </View>

          {booking.teamSize > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Team Size</Text>
              <Text style={styles.detailValue}>{booking.teamSize} members</Text>
            </View>
          )}
        </View>

        {/* Vehicle & Team Details */}
        {(booking.vehicleNumbers || booking.teamLeaderName) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="truck" size={wp('4.5%')} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Vehicle & Team Details</Text>
            </View>

            {booking.vehicleNumbers && (
              <View style={styles.vehicleBox}>
                <View style={[styles.vehicleIconCircle]}>
                  <MaterialCommunityIcons name="truck" size={wp('6%')} color={TEAL_MID} />
                </View>
                <View style={{ flex: 1, marginLeft: wp('3%') }}>
                  <Text style={styles.vehicleName}>Vehicle</Text>
                  <Text style={styles.vehicleNumber}>{booking.vehicleNumbers}</Text>
                </View>
              </View>
            )}

            {booking.teamLeaderName && (
              <>
                <View style={styles.divider} />
                <View style={styles.driverBox}>
                  <View style={styles.driverAvatarCircle}>
                    <Ionicons name="person" size={wp('5%')} color={TEAL_MID} />
                  </View>
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.driverName}>{booking.teamLeaderName}</Text>
                    <Text style={styles.driverLabel}>Team Leader</Text>
                    {booking.teamLeaderPhone && (
                      <TouchableOpacity
                        onPress={() => handleCallDriver(booking.teamLeaderPhone)}
                        style={styles.callBtn}
                      >
                        <Ionicons name="call" size={wp('3.2%')} color={TEAL} />
                        <Text style={styles.callBtnText}>{booking.teamLeaderPhone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Packing OTP - Only when sent by driver & status is before packing starts */}
        {booking.packingOtp && booking.packingOtpSent && ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'].includes(booking.status) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons name="key-outline" size={wp('4.5%')} color="#0D9488" />
              </View>
              <Text style={styles.cardTitle}>Packing Start OTP</Text>
            </View>
            <View style={[styles.otpBox, { backgroundColor: '#CCFBF1' }]}>
              <Text style={[styles.otpLabel, { color: '#115E59' }]}>Share this with the team to start packing</Text>
              <Text style={[styles.otpValue, { color: '#0D9488' }]}>{booking.packingOtp}</Text>
            </View>
          </View>
        )}

        {/* Loading OTP - Only when sent by driver & status is packing/loading */}
        {booking.loadingOtp && booking.loadingOtpSent && ['PACKING', 'LOADING'].includes(booking.status) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#CFFAFE' }]}>
                <Ionicons name="key-outline" size={wp('4.5%')} color="#0891B2" />
              </View>
              <Text style={styles.cardTitle}>Loading OTP</Text>
            </View>
            <View style={[styles.otpBox, { backgroundColor: '#CFFAFE' }]}>
              <Text style={[styles.otpLabel, { color: '#155E75' }]}>Share this to verify loading completion</Text>
              <Text style={[styles.otpValue, { color: '#0891B2' }]}>{booking.loadingOtp}</Text>
            </View>
          </View>
        )}

        {/* Delivery OTP - Only when sent by driver & status is in transit/unloading/unpacking */}
        {booking.deliveryOtp && booking.deliveryOtpSent && ['IN_TRANSIT', 'UNLOADING', 'UNPACKING'].includes(booking.status) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="key-outline" size={wp('4.5%')} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Delivery Completion OTP</Text>
            </View>
            <View style={[styles.otpBox, { backgroundColor: '#EDE9FE' }]}>
              <Text style={[styles.otpLabel, { color: '#5B21B6' }]}>Share this to confirm delivery completion</Text>
              <Text style={[styles.otpValue, { color: '#7C3AED' }]}>{booking.deliveryOtp}</Text>
            </View>
          </View>
        )}

        {/* Vendor Details */}
        {booking.vendor && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="business-outline" size={wp('4.5%')} color="#2563EB" />
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
                  <Ionicons name="call" size={wp('3.2%')} color={TEAL} />
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
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <Ionicons name="wallet-outline" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          {booking.packingCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Packing Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.packingCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.loadingCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Loading Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.loadingCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.transportCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transport Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.transportCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.unloadingCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unloading Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.unloadingCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.unpackingCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unpacking Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.unpackingCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.storageCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Storage Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.storageCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.insuranceCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Insurance Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.insuranceCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.materialCharges > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Material Charges</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.materialCharges?.toLocaleString('en-IN')}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { marginTop: hp('1%') }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{'\u20B9'}{booking.totalAmount?.toLocaleString('en-IN')}</Text>
          </View>

          {booking.advancePaid > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Advance Paid</Text>
                <Text style={[styles.detailValue, { color: TEAL }]}>
                  - {'\u20B9'}{booking.advancePaid?.toLocaleString('en-IN')}
                </Text>
              </View>

              {booking.balanceAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance Due</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {'\u20B9'}{booking.balanceAmount?.toLocaleString('en-IN')}
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
            <LinearGradient
              colors={[TEAL_DEEP, TEAL_MID]}
              style={styles.viewQuoteBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="document-text-outline" size={wp('5%')} color="#FFF" />
              <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
              <Ionicons name="chevron-forward" size={wp('5%')} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Moving Timeline */}
        {(booking.packingStartedAt || booking.loadingStartedAt || booking.transitStartedAt || booking.unloadingStartedAt || booking.completedAt) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time-outline" size={wp('4.5%')} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Moving Timeline</Text>
            </View>

            {booking.packingStartedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Packing Started</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.packingStartedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {booking.loadingStartedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loading Started</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.loadingStartedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {booking.transitStartedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>In Transit</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.transitStartedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {booking.unloadingStartedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unloading Started</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.unloadingStartedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {booking.completedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Completed</Text>
                <Text style={styles.detailValue}>
                  {new Date(booking.completedAt).toLocaleDateString('en-IN', {
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
              onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: 'packers' })}
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

        <View style={{ height: hp('2.5%') }} />
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
            <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.quoteModalHeaderGrad}>
              <View style={[styles.decoCircle, { top: -20, right: -15, width: 80, height: 80 }]} pointerEvents="none" />
              <View style={[styles.decoCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} pointerEvents="none" />
              <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
                <View style={styles.quoteModalHeaderRow}>
                  <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.backBtn}>
                    <Ionicons name="close" size={22} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.quoteModalTitle}>Quote Details</Text>
                  <View style={{ width: wp('9%') }} />
                </View>
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
                          <View style={[styles.quoteSectionIconCircle, { backgroundColor: TEAL_LIGHT }]}>
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

                    {/* Service Information */}
                    {(booking.quote.vehicleType || booking.quote.teamSize || booking.quote.estimatedDuration) && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.quoteSectionIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                            <Ionicons name="cube-outline" size={wp('4.5%')} color={TEAL_MID} />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Service Information</Text>
                        </View>
                        <View style={styles.quoteInfoCard}>
                          {booking.quote.vehicleType && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="car-outline" size={wp('4.5%')} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Vehicle Type: {booking.quote.vehicleType}</Text>
                            </View>
                          )}
                          {booking.quote.teamSize > 0 && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="people-outline" size={wp('4.5%')} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Team Size: {booking.quote.teamSize} members</Text>
                            </View>
                          )}
                          {booking.quote.estimatedDuration && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="time-outline" size={wp('4.5%')} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Est. Duration: {booking.quote.estimatedDuration}</Text>
                            </View>
                          )}
                          {booking.quote.packingMaterials && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="archive-outline" size={wp('4.5%')} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Packing Materials: {booking.quote.packingMaterials}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Inclusions Tab */}
                {detailsTab === 'inclusions' && (
                  <View style={styles.quoteSection}>
                    <View style={styles.quoteSectionHeader}>
                      <View style={[styles.quoteSectionIconCircle, { backgroundColor: TEAL_LIGHT }]}>
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
                      <View style={[styles.quoteSectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="close-circle" size={wp('4.5%')} color="#DC2626" />
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
                                <Ionicons name="close" size={wp('4%')} color="#DC2626" />
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
                      <View style={[styles.quoteSectionIconCircle, { backgroundColor: TEAL_LIGHT }]}>
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
}

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Gradient Header ──
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? hp('1%') : hp('1%'),
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

  // ── Content ──
  content: {
    flex: 1,
  },

  // ── Empty / Not Found ──
  emptyIconWrap: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Status Card ──
  statusCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
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
    borderRadius: 999,
    gap: wp('2%'),
  },
  statusDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
  },
  statusText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  // ── Card ──
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

  // ── Trip ──
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
    marginLeft: wp('1.3%'),
    marginVertical: hp('0.5%'),
  },
  tripLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: hp('0.2%'),
    letterSpacing: 0.5,
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

  // ── Detail Rows ──
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp('1.5%'),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.7%'),
  },
  detailLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: wp('3.3%'),
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
    fontWeight: '700',
    color: TEAL,
  },

  // ── Vehicle ──
  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    padding: wp('3.5%'),
    borderRadius: wp('3%'),
  },
  vehicleIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(6,78,59,0.1)',
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
    marginTop: hp('0.2%'),
  },
  vehicleNumber: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
    marginTop: hp('0.4%'),
  },
  vehicleModel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
  },

  // ── Driver ──
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
    marginTop: hp('0.2%'),
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.7%'),
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
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

  // ── OTP ──
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
    fontWeight: '500',
  },
  otpValue: {
    fontSize: wp('8%'),
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 8,
  },

  // ── Payment Badge ──
  paymentBadge: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.4%'),
    borderRadius: 999,
  },
  paymentBadgeText: {
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  // ── Pay Now ──
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
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },

  // ── Payment Verification ──
  paymentVerificationCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    padding: wp('6%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    ...SHADOW_MD,
  },
  verificationIconContainer: {
    position: 'relative',
    marginBottom: hp('2%'),
  },
  verificationIconBg: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  pulseDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: wp('4%'),
    height: wp('4%'),
    borderRadius: wp('2%'),
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: CARD,
  },
  verificationTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.7%'),
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

  // ── View Quote Details Button ──
  viewQuoteDetailsBtn: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  viewQuoteBtnGradient: {
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
    flex: 1,
    textAlign: 'center',
  },

  // ══════════ Quote Details Modal Styles ══════════
  quoteModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  quoteModalHeaderGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? hp('1%') : hp('1%'),
    paddingBottom: wp('4%'),
    overflow: 'hidden',
  },
  quoteModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFF',
  },
  quoteModalContent: {
    flex: 1,
  },

  // ── Tabs ──
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

  // ── Tab Content ──
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
  quoteSectionIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteSectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
  },

  // ── Features ──
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
    lineHeight: wp('5.2%'),
    paddingTop: 1,
  },

  // ── Info Card ──
  quoteInfoCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  quoteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  quoteInfoText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('2.5%'),
    flex: 1,
  },

  // ── Vendor Message ──
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
    marginLeft: wp('2%'),
  },
  quoteMessageText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },

  // ── List Card (Inclusions/Exclusions) ──
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
    backgroundColor: TEAL + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    marginTop: hp('0.2%'),
  },
  quoteExclusionBullet: {
    backgroundColor: '#FEE2E2',
  },
  quoteListText: {
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.5%'),
    flex: 1,
    paddingTop: hp('0.3%'),
  },

  // ── Terms Card ──
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
    backgroundColor: TEAL + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  quoteTermsNumber: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
  },

  // ── Empty State ──
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

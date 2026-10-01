// EquipmentBookingDetailScreen — Premium Teal Gradient Redesign
// Dark teal gradient header, glass cards, responsive sizing (wp/hp), premium typography
// NOTE: ALL existing logic, state names and functions are 100% intact. Only UI and styles were reworked.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import Modal from '../../../components/SafeModal';
import BookingStatusHero from '../../../components/BookingStatusHero';
import RefundStatusCard from '../../../components/RefundStatusCard';
import CancelBookingAction, { formatCancelDate } from '../../../components/CancelBookingAction';
import SwipeTabsView from '../../../components/SwipeTabsView';
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
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  ADVANCE_PAID: { label: 'Advance Paid', color: '#10B981', icon: 'checkmark-done-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-done-circle' },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: '#8B5CF6', icon: 'bus-outline' },
  IN_PROGRESS: { label: 'Trip In Progress', color: '#F59E0B', icon: 'navigate-circle-outline' },
  COMPLETED: { label: 'Completed', color: '#10B981', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
  DROPPED: { label: 'Dropped', color: '#EF4444', icon: 'arrow-down-circle-outline' },
};

const DETAILS_TABS = ['overview', 'inclusions', 'exclusions', 'terms'];

// "12 Oct 2026 · 10:30 am", or '' when the value is missing or not a date.
const formatBookingDateTime = (value, time) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (time) return `${day} · ${time}`;
  const hasClock = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasClock
    ? `${day} · ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    : day;
};

export default function EquipmentBookingDetailScreen() {
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
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(TEAL_DEEP);
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') StatusBar.setBackgroundColor('#ffffff');
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
      const response = await api.get(`/equipment-bookings/${bookingId}`);
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
      bookingType: 'equipment',
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

  // ===================== LOADING STATE =====================
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

  // ===================== NOT FOUND STATE =====================
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
            <Text style={styles.headerTitle}>Equipment Booking</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
          <Ionicons name="alert-circle-outline" size={wp('12%')} color={TEXT_MUTED} />
          <Text style={{ color: TEXT_PRIMARY, fontSize: wp('4%'), fontWeight: '600', marginTop: hp('1.5%') }}>
            Booking not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <SafeAreaView style={styles.container}>
      {/* ===================== GRADIENT HEADER ===================== */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: 10, left: '40%', width: 40, height: 40 }]} pointerEvents="none" />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: wp('3%') }}>
            <Text style={styles.headerTitle}>Equipment Booking</Text>
            <Text style={styles.headerSub}>{booking.bookingNumber}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('BookingChat', {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              vendorName: booking.vendor?.businessName || booking.vendorName || 'Vendor'
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerActionBtn, { marginLeft: wp('2%') }]} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Glass Status Badge inside header */}
        <View style={styles.glassCard}>
          <View style={styles.glassMetaRow}>
            <View style={styles.glassMetaItem}>
              <Ionicons name="construct-outline" size={wp('3.5%')} color="rgba(255,255,255,0.6)" />
              <Text style={styles.glassMetaText}>Equipment Rental</Text>
            </View>
            {!!formatBookingDateTime(booking.pickupDate || booking.startDate) && (
              <View style={styles.glassMetaItem}>
                <Ionicons name="calendar-outline" size={wp('3.5%')} color="rgba(255,255,255,0.6)" />
                <Text style={styles.glassMetaText}>
                  {formatBookingDateTime(booking.pickupDate || booking.startDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================== STATUS SUMMARY ===================== */}
        <BookingStatusHero
          statusConfig={statusConfig}
          status={booking.status}
          totalAmount={booking.totalAmount}
          advanceAmount={booking.advanceAmount}
          advancePaid={booking.advancePaid}
          paymentStatus={booking.paymentStatus}
        />
        {/* Refund progress for a cancelled booking (renders nothing otherwise) */}
        {['CANCELLED', 'REFUNDED'].includes(String(booking.status).toUpperCase()) && (
          <RefundStatusCard source="equipment_bookings" bookingId={booking.id} />
        )}

        {/* ===================== PAY NOW BUTTON ===================== */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <TouchableOpacity style={styles.payNowBtn} onPress={handlePayment}>
            <LinearGradient
              colors={[TEAL, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payNowGradient}
            >
              <Ionicons name="wallet" size={22} color="#FFF" />
              <Text style={styles.payNowText}>
                Pay Advance Amount - {'\u20B9'}{booking.advanceAmount?.toLocaleString('en-IN')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ===================== PAYMENT VERIFICATION ===================== */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <View style={styles.paymentVerificationCard}>
            <View style={styles.verificationIconContainer}>
              <View style={styles.verificationIconBg}>
                <Ionicons name="hourglass-outline" size={32} color="#3B82F6" />
              </View>
              <View style={styles.pulseDot} />
            </View>

            <Text style={styles.verificationTitle}>Payment Verification in Progress</Text>
            <Text style={styles.verificationSubtitle}>
              Your payment has been submitted successfully
            </Text>

            <View style={styles.verificationInfoBox}>
              <View style={styles.verificationInfoRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.verificationInfoText}>
                  Payment received and being verified
                </Text>
              </View>
              <View style={styles.verificationInfoRow}>
                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                <Text style={styles.verificationInfoText}>
                  Usually takes 15-30 minutes
                </Text>
              </View>
              <View style={styles.verificationInfoRow}>
                <Ionicons name="notifications-outline" size={18} color="#3B82F6" />
                <Text style={styles.verificationInfoText}>
                  You'll be notified once confirmed
                </Text>
              </View>
            </View>

            <View style={styles.verificationFooter}>
              <Ionicons name="shield-checkmark" size={16} color={TEXT_SECONDARY} />
              <Text style={styles.verificationFooterText}>
                Our team is verifying your payment details
              </Text>
            </View>
          </View>
        )}

        {/* Drop Reason Banner */}
        {booking.status === 'DROPPED' && booking.dropReason && (
          <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="information-circle" size={22} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#991B1B', marginBottom: 2 }}>Booking Dropped</Text>
              <Text style={{ fontSize: 12, color: '#B91C1C', lineHeight: 18 }}>{booking.dropReason}</Text>
            </View>
          </View>
        )}

        {/* ===================== RENTAL DETAILS CARD ===================== */}
        {(() => {
          // The equipment API returns delivery*/startDate/endDate; older
          // payloads used pickup*/pickupDate/returnDate. Read either.
          const siteCity = booking.pickupCity || booking.deliveryCity;
          const siteAddress = booking.pickupAddress || booking.deliveryAddress;
          const start = formatBookingDateTime(booking.pickupDate || booking.startDate, booking.pickupTime);
          const end = formatBookingDateTime(booking.returnDate || booking.endDate, booking.returnTime);
          const days = booking.rentalDays || booking.tripDays;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                  <MaterialCommunityIcons name="crane" size={18} color={TEAL_MID} />
                </View>
                <Text style={styles.cardTitle}>Rental Details</Text>
              </View>

              {(!!siteCity || !!siteAddress) && (
                <View style={styles.siteBox}>
                  <View style={styles.siteIcon}>
                    <Ionicons name="location" size={wp('4.2%')} color={TEAL_MID} />
                  </View>
                  <View style={styles.siteText}>
                    <Text style={styles.tripLabel}>Delivery Site</Text>
                    {!!siteCity && <Text style={styles.tripValue}>{siteCity}</Text>}
                    {!!siteAddress && <Text style={styles.tripAddress}>{siteAddress}</Text>}
                  </View>
                </View>
              )}

              {(!!start || !!end) && (
                <View style={styles.dateStrip}>
                  <View style={styles.dateCell}>
                    <Text style={styles.dateCaption}>Start</Text>
                    <Text style={styles.dateValue}>{start || 'To be confirmed'}</Text>
                  </View>
                  <View style={styles.dateArrow}>
                    <Ionicons name="arrow-forward" size={wp('4%')} color={TEXT_MUTED} />
                  </View>
                  <View style={[styles.dateCell, styles.dateCellEnd]}>
                    <Text style={styles.dateCaption}>End</Text>
                    <Text style={[styles.dateValue, styles.dateValueEnd]}>{end || 'To be confirmed'}</Text>
                  </View>
                </View>
              )}

              {!!booking.equipmentCategory && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{booking.equipmentCategory}</Text>
                </View>
              )}

              {!!booking.equipmentType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{booking.equipmentType}</Text>
                </View>
              )}

              {booking.quantity > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>
                    {booking.quantity} {booking.quantity === 1 ? 'unit' : 'units'}
                  </Text>
                </View>
              )}

              {days > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {days} {days === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* ===================== VEHICLE & DRIVER DETAILS ===================== */}
        {(booking.vehicleNumber || booking.driverName) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="bus-outline" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Vehicle & Driver Details</Text>
            </View>

            {booking.vehicleName && (
              <View style={styles.vehicleBox}>
                <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT, width: wp('12%'), height: wp('12%'), borderRadius: wp('6%') }]}>
                  <MaterialCommunityIcons name="bus" size={26} color={TEAL_MID} />
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
                  <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT, width: wp('11%'), height: wp('11%'), borderRadius: wp('5.5%') }]}>
                    <Ionicons name="person" size={22} color={TEAL_MID} />
                  </View>
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.driverName}>{booking.driverName}</Text>
                    <Text style={styles.driverLabel}>Driver</Text>
                    {booking.driverPhone && (
                      <TouchableOpacity
                        onPress={() => handleCallDriver(booking.driverPhone)}
                        style={styles.callBtn}
                      >
                        <Ionicons name="call" size={14} color={TEAL} />
                        <Text style={styles.callBtnText}>{booking.driverPhone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* ===================== DELIVERY OTP ===================== */}
        {booking.deliveryOtp && !booking.deliveredAt2 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="key-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Delivery OTP</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Share this OTP at equipment delivery</Text>
              <Text style={styles.otpValue}>{booking.deliveryOtp}</Text>
            </View>
          </View>
        )}

        {/* ===================== RETURN OTP ===================== */}
        {booking.returnOtp && booking.status !== 'COMPLETED' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="key-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Return OTP</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Share this OTP at equipment return</Text>
              <Text style={styles.otpValue}>{booking.returnOtp}</Text>
            </View>
          </View>
        )}

        {/* ===================== VENDOR DETAILS ===================== */}
        {booking.vendor && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="business-outline" size={18} color="#4F46E5" />
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
                  <Ionicons name="call" size={14} color={TEAL} />
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
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={[styles.detailValue, { marginLeft: wp('1%') }]}>
                    {booking.vendor.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ===================== PAYMENT DETAILS ===================== */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
              <Ionicons name="wallet-outline" size={18} color={TEAL_MID} />
            </View>
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          {booking.baseAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base Amount</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.baseAmount?.toLocaleString()}</Text>
            </View>
          )}

          {booking.gstAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GST</Text>
              <Text style={styles.detailValue}>{'\u20B9'}{booking.gstAmount?.toLocaleString()}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { marginTop: hp('1%') }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{'\u20B9'}{booking.totalAmount?.toLocaleString()}</Text>
          </View>

          {booking.advanceAmount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Advance Amount</Text>
                <Text style={[styles.detailValue, { color: TEAL }]}>
                  {'\u20B9'}{booking.advanceAmount?.toLocaleString()}
                </Text>
              </View>

              {booking.balanceAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance Due</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {'\u20B9'}{booking.balanceAmount?.toLocaleString()}
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

        {/* ===================== VIEW QUOTE DETAILS BUTTON ===================== */}
        {booking.quote && (
          <TouchableOpacity
            style={styles.viewQuoteDetailsBtn}
            onPress={() => setQuoteDetailsVisible(true)}
          >
            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT, width: wp('9%'), height: wp('9%'), borderRadius: wp('4.5%') }]}>
              <Ionicons name="document-text-outline" size={18} color={TEAL_MID} />
            </View>
            <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
            <Ionicons name="chevron-forward" size={20} color={TEAL} />
          </TouchableOpacity>
        )}

        {/* ===================== TRIP TIMELINE ===================== */}
        {(booking.tripStartedAt || booking.tripEndedAt) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time-outline" size={18} color="#D97706" />
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
              onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: 'equipment' })}
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

        {/* Customer can cancel until the job starts (same statuses the API accepts) */}
        {["PENDING_PAYMENT","ADVANCE_PAID","CONFIRMED"].includes(booking.status) && (
          <CancelBookingAction
            path={`/equipment-bookings/${booking.id}`}
            booking={{
              title: booking.equipmentName || booking.equipmentType || 'Equipment rental',
              number: booking.bookingNumber,
              when: formatCancelDate((booking.startDate || booking.pickupDate)),
              paid: booking.advancePaid || 0,
            }}
            onDone={() => fetchBookingDetails(true)}
          />
        )}

        <View style={{ height: hp('3%') }} />
      </ScrollView>

      {/* ===================== QUOTE DETAILS MODAL ===================== */}
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
              <View style={[styles.decoCircle, { top: -20, right: -15, width: 70, height: 70 }]} pointerEvents="none" />
              <View style={[styles.decoCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} pointerEvents="none" />
              <View style={styles.quoteModalHeaderRow}>
                <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.backBtn}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.quoteModalTitle}>Quote Details</Text>
                <View style={{ width: wp('9%') }} />
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
              <SwipeTabsView style={styles.quoteTabContent} tabs={DETAILS_TABS} activeTab={detailsTab} onChange={setDetailsTab}>
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

                    {/* Specifications */}
                    {(() => {
                      const specs = parseListData(booking.quote.specifications);
                      return specs.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                              <Ionicons name="construct-outline" size={18} color={TEAL} />
                            </View>
                            <Text style={styles.quoteSectionTitle}>Specifications</Text>
                          </View>
                          <View style={styles.quoteListCard}>
                            {specs.map((spec, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.quoteFeatureItem,
                                  idx === specs.length - 1 && styles.quoteFeatureItemLast,
                                ]}
                              >
                                <Ionicons name="checkmark-circle" size={16} color={TEAL} />
                                <Text style={styles.quoteFeatureText}>{spec}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Equipment Details */}
                    {(booking.quote.equipmentName || booking.quote.equipmentModel || booking.quote.equipmentYear || booking.quote.dailyRate || booking.quote.securityDeposit || booking.quote.operatorCharges || booking.quote.notes) && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteSectionHeader}>
                          <View style={[styles.cardIconCircle, { backgroundColor: '#E0E7FF' }]}>
                            <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
                          </View>
                          <Text style={styles.quoteSectionTitle}>Equipment Details</Text>
                        </View>
                        <View style={styles.quoteInfoCard}>
                          {booking.quote.equipmentName && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="build-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Equipment: {booking.quote.equipmentName}</Text>
                            </View>
                          )}
                          {booking.quote.equipmentModel && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="layers-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Model: {booking.quote.equipmentModel}</Text>
                            </View>
                          )}
                          {booking.quote.equipmentYear > 0 && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="calendar-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Year: {booking.quote.equipmentYear}</Text>
                            </View>
                          )}
                          {booking.quote.dailyRate > 0 && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="cash-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Daily Rate: ₹{booking.quote.dailyRate}</Text>
                            </View>
                          )}
                          {booking.quote.operatorCharges > 0 && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="person-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Operator Charges: ₹{booking.quote.operatorCharges}</Text>
                            </View>
                          )}
                          {booking.quote.securityDeposit > 0 && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="shield-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>Security Deposit: ₹{booking.quote.securityDeposit}</Text>
                            </View>
                          )}
                          {booking.quote.notes && (
                            <View style={styles.quoteInfoRow}>
                              <Ionicons name="document-text-outline" size={20} color={TEXT_SECONDARY} />
                              <Text style={styles.quoteInfoText}>{booking.quote.notes}</Text>
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
                      <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                        <Ionicons name="checkmark-done-circle" size={18} color={TEAL} />
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
                      <View style={[styles.cardIconCircle, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
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
                      <View style={[styles.cardIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                        <Ionicons name="document-text" size={18} color={TEAL} />
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
                      if (terms.length === 1) {
                        return (
                          <View style={styles.quoteTermsCard}>
                            <Text style={styles.quoteTermsText}>
                              {terms[0]}
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
              </SwipeTabsView>

              <View style={{ height: hp('5%') }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // -------- Gradient Header --------
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
    marginBottom: wp('3%'),
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
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

  // -------- Glass Card in Header --------
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  statusDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    marginRight: wp('2%'),
  },
  glassStatusLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  glassMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('4%'),
  },
  glassMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  glassMetaText: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // -------- Content --------
  content: {
    flex: 1,
  },

  // -------- Cards --------
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
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // -------- Trip Details --------
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
    backgroundColor: '#E2E8F0',
    marginLeft: wp('1.2%'),
    marginVertical: hp('0.5%'),
  },
  tripLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: hp('0.3%'),
    letterSpacing: 0.5,
  },
  tripValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  tripAddress: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },

  // -------- Detail Rows --------
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp('1.5%'),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
  },
  // The label takes the free width so Android never measures it tight and
  // clips its last letter ("Quantit").
  detailLabel: {
    flex: 1,
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginRight: wp('3%'),
  },
  detailValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    flexShrink: 1,
    textAlign: 'right',
  },
  siteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginBottom: hp('1.2%'),
  },
  siteIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  siteText: {
    flex: 1,
  },
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('0.8%'),
  },
  dateCell: {
    flex: 1,
  },
  dateCellEnd: {
    alignItems: 'flex-end',
  },
  dateArrow: {
    paddingHorizontal: wp('2%'),
  },
  dateCaption: {
    fontSize: wp('2.7%'),
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '700',
    marginTop: 2,
  },
  dateValueEnd: {
    textAlign: 'right',
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

  // -------- Vehicle & Driver --------
  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT + '40',
    padding: wp('3%'),
    borderRadius: wp('3%'),
  },
  vehicleName: {
    fontSize: wp('3.5%'),
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
  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    fontSize: wp('3.5%'),
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

  // -------- OTP --------
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
    letterSpacing: 8,
  },

  // -------- Payment Badge --------
  paymentBadge: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 999,
  },
  paymentBadgeText: {
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  // -------- Pay Now --------
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

  // -------- Payment Verification --------
  paymentVerificationCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    padding: wp('6%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    ...SHADOW_SM,
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
    borderColor: '#fff',
  },
  verificationTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.7%'),
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('2.5%'),
    textAlign: 'center',
  },
  verificationInfoBox: {
    width: '100%',
    backgroundColor: BG,
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
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
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

  // -------- View Quote Details Button --------
  viewQuoteDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    ...SHADOW_SM,
  },
  viewQuoteDetailsText: {
    color: TEAL_MID,
    fontSize: wp('3.5%'),
    fontWeight: '700',
    flex: 1,
    marginLeft: wp('2.5%'),
  },

  // ========== Quote Details Modal Styles ==========
  quoteModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  quoteModalHeaderGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
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
    gap: wp('2.5%'),
  },
  quoteSectionTitle: {
    fontSize: wp('4%'),
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
    borderBottomColor: '#F3F4F6',
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
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  quoteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  quoteInfoText: {
    fontSize: wp('3.3%'),
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
    marginBottom: hp('1.2%'),
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
    lineHeight: wp('5.5%'),
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
    marginBottom: hp('2%'),
    paddingBottom: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.5%'),
    flex: 1,
    paddingTop: hp('0.4%'),
  },

  // Terms Card
  quoteTermsCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  quoteTermsText: {
    fontSize: wp('3.3%'),
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
    fontSize: wp('3.2%'),
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
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: hp('26%'),
  },
  quoteEmptyText: {
    fontSize: wp('3.3%'),
    color: TEXT_MUTED,
    marginTop: hp('1.5%'),
    textAlign: 'center',
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

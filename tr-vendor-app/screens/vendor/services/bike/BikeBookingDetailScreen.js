import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, TextInput,
  StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showError, showConfirm, showSuccess } from '../../../../services/alertService';
import {
  getBookingById, acceptBooking, rejectBooking,
  generateTripOtp, verifyTripOtp, completeBooking,
} from '../../../api/client';

const { width: W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
  teal: '#0D9488', tealL: '#F0FDFA',
  cyan: '#0891B2', cyanL: '#ECFEFF',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { color: '#D97706', bg: '#FFFBEB', label: 'Awaiting Payment',  icon: 'time-outline'         },
  PAYMENT_VERIFIED: { color: '#059669', bg: '#ECFDF5', label: 'Payment Verified',  icon: 'checkmark-circle'     },
  PENDING_VENDOR:   { color: '#EA580C', bg: '#FFF7ED', label: 'Pending',           icon: 'hourglass-outline'    },
  BROADCASTED:      { color: '#2563EB', bg: '#EFF6FF', label: 'Open',              icon: 'radio-outline'        },
  ACCEPTED:         { color: '#059669', bg: '#ECFDF5', label: 'Accepted',          icon: 'checkmark-circle'     },
  CONFIRMED:        { color: '#047857', bg: '#D1FAE5', label: 'Confirmed',         icon: 'shield-checkmark'     },
  READY_FOR_PICKUP: { color: '#0891B2', bg: '#ECFEFF', label: 'Ready for Pickup',  icon: 'bicycle-outline'      },
  IN_PROGRESS:      { color: '#7C3AED', bg: '#F5F3FF', label: 'In Progress',       icon: 'navigate-circle'      },
  COMPLETED:        { color: '#047857', bg: '#D1FAE5', label: 'Completed',         icon: 'trophy-outline'       },
  CANCELLED:        { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled',         icon: 'close-circle'         },
};

export default function BikeBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};

  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking,       setBooking]       = useState(null);
  const [otpInput,      setOtpInput]      = useState('');
  const [otpLoading,    setOtpLoading]    = useState(false);
  const [otpError,      setOtpError]      = useState(null);
  const [otpSuccess,    setOtpSuccess]    = useState(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('bike', bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[BikeBookingDetail] Error:', error);
      showError('Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
  }, [fetchBooking]);

  const handleAccept = async () => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
      try {
        setActionLoading(true);
        await acceptBooking('bike', bookingId);
        await fetchBooking();
        showSuccess('Booking accepted successfully');
      } catch (error) {
        showError(error?.response?.data?.error || 'Failed to accept booking');
      } finally { setActionLoading(false); }
    }, { confirmText: 'Accept' });
  };

  const handleReject = async () => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
      try {
        setActionLoading(true);
        await rejectBooking('bike', bookingId, 'Vendor rejected');
        await fetchBooking();
        showSuccess('Booking rejected');
      } catch (error) {
        showError(error?.response?.data?.error || 'Failed to reject booking');
      } finally { setActionLoading(false); }
    }, { confirmText: 'Reject', destructive: true });
  };

  const handleCall      = (phone) => { if (phone) Linking.openURL(`tel:${phone}`); };
  const handleWhatsApp  = (phone) => {
    if (phone) Linking.openURL(`whatsapp://send?phone=${phone.replace(/\D/g, '')}`);
  };
  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId:     booking.id,
      customerName:  booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType:   'bike',
    });
  };

  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true); setOtpError(null); setOtpSuccess(null);
    try {
      await generateTripOtp('bike', booking.id);
      setOtpSuccess('OTP sent to customer successfully!');
      showSuccess('OTP sent to customer successfully!');
      await fetchBooking();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to generate OTP';
      setOtpError(msg); showError(msg);
    } finally { setOtpLoading(false); }
  };

  const handleStartTrip = async () => {
    if (!booking || !otpInput) { showError('Please enter OTP'); return; }
    if (otpInput.length !== 6) { showError('Please enter a valid 6-digit OTP'); return; }
    setOtpLoading(true); setOtpError(null);
    try {
      await verifyTripOtp('bike', booking.id, otpInput, 'start');
      setOtpSuccess('Trip started successfully!');
      showSuccess('Trip started successfully!');
      setOtpInput('');
      await fetchBooking();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to verify OTP';
      setOtpError(msg); showError(msg);
    } finally { setOtpLoading(false); }
  };

  const handleEndTrip = async () => {
    if (!booking) return;
    showConfirm('End Trip', 'Are you sure you want to complete this trip?', async () => {
      setOtpLoading(true); setOtpError(null);
      try {
        await completeBooking('bike', booking.id);
        setOtpSuccess('Trip completed successfully!');
        showSuccess('Trip completed successfully!');
        await fetchBooking();
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to complete trip';
        setOtpError(msg); showError(msg);
      } finally { setOtpLoading(false); }
    }, { confirmText: 'Complete' });
  };

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const canAccept = () => ['PENDING_VENDOR', 'BROADCASTED'].includes(booking?.status);
  const canReject = () => ['PENDING_VENDOR', 'BROADCASTED'].includes(booking?.status);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
                <Text style={s.heroTitle}>Booking Detail</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={s.centeredTxt}>Loading booking...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
                <Text style={s.heroTitle}>Booking Detail</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={56} color={C.muted} />
          <Text style={s.centeredTxt}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const showTripControl =
    booking.status === 'ACCEPTED' ||
    booking.status === 'CONFIRMED' ||
    booking.status === 'READY_FOR_PICKUP' ||
    booking.status === 'IN_PROGRESS' ||
    (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero Header ══════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.deco1} />
        <View style={s.deco2} />

        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
            <Text style={s.heroTitle}>Booking Detail</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Booking summary card in header */}
        <View style={s.heroCard}>
          <View style={s.heroCardTop}>
            <View>
              <Text style={s.heroLabel}>BOOKING #</Text>
              <Text style={s.heroNumber}>{booking.bookingNumber || String(booking.id).slice(-8)}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.color + '22', borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <View style={s.heroMeta}>
            <View style={s.heroMetaItem}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.heroMetaTxt}>Created {formatDate(booking.createdAt)}</Text>
            </View>
            {booking.totalDays > 0 && (
              <View style={s.heroMetaItem}>
                <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.4)" />
                <Text style={s.heroMetaTxt}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* ══ Body ═════════════════════════════════════════════════════════════ */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />
        }
      >
        {/* Payment Verified Banner */}
        {booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking && (
          <View style={s.alertBanner}>
            <View style={[s.alertIconBox, { backgroundColor: C.g100 }]}>
              <Ionicons name="checkmark-circle" size={22} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>Advance Payment Received!</Text>
              <Text style={s.alertDesc}>
                Prepare the bike and generate OTP when customer arrives for pickup.
              </Text>
            </View>
          </View>
        )}

        {/* ── Customer Card ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.blueL }]}>
              <Ionicons name="person" size={15} color={C.blue} />
            </View>
            <Text style={s.cardTitle}>Customer</Text>
          </View>

          <View style={s.customerRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>
                {(booking.customerName || 'C')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{booking.customerName || 'Customer'}</Text>
              {booking.customerEmail ? (
                <Text style={s.customerEmail} numberOfLines={1}>{booking.customerEmail}</Text>
              ) : null}
            </View>
          </View>

          {/* Contact buttons */}
          <View style={s.contactRow}>
            {booking.customerPhone ? (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                onPress={() => handleCall(booking.customerPhone)}
              >
                <Ionicons name="call" size={15} color={C.g700} />
                <Text style={[s.contactTxt, { color: C.g700 }]}>Call</Text>
              </TouchableOpacity>
            ) : null}
            {booking.customerPhone ? (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                onPress={() => handleWhatsApp(booking.customerPhone)}
              >
                <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                <Text style={[s.contactTxt, { color: '#16A34A' }]}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[s.contactBtn, { flex: 1, backgroundColor: C.purpleL, borderColor: C.purple + '25' }]}
              onPress={handleChat}
            >
              <Ionicons name="chatbubble" size={15} color={C.purple} />
              <Text style={[s.contactTxt, { color: C.purple }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Vehicle & Trip Card ───────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.amberL }]}>
              <MaterialCommunityIcons name="motorbike" size={15} color={C.amber} />
            </View>
            <Text style={s.cardTitle}>Vehicle & Trip</Text>
          </View>

          {/* Vehicle box */}
          <View style={s.vehicleBox}>
            <View style={s.vehicleIconWrap}>
              <MaterialCommunityIcons name="motorbike" size={34} color={C.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleName} numberOfLines={2}>
                {booking.requestedVehicleName || booking.vehicleName || 'Bike'}
              </Text>
              {(booking.requestedBrand || booking.vehicleCategory) ? (
                <Text style={s.vehicleSub}>{booking.requestedBrand || booking.vehicleCategory}</Text>
              ) : null}
              {booking.acceptedVehicleName ? (
                <View style={s.assignedBadge}>
                  <Ionicons name="checkmark-circle" size={11} color={C.g600} />
                  <Text style={s.assignedTxt}>Assigned: {booking.acceptedVehicleName}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Location + Duration */}
          <View style={s.tripMetaRow}>
            <View style={s.tripMetaItem}>
              <View style={[s.tripMetaIcon, { backgroundColor: C.indigoL }]}>
                <Ionicons name="location" size={14} color={C.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tripMetaLabel}>Location</Text>
                <Text style={s.tripMetaValue} numberOfLines={1}>
                  {booking.locationName || booking.pickupCity || 'Not specified'}
                </Text>
              </View>
            </View>
            {booking.totalDays ? (
              <View style={s.tripMetaItem}>
                <View style={[s.tripMetaIcon, { backgroundColor: C.purpleL }]}>
                  <Ionicons name="calendar" size={14} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tripMetaLabel}>Duration</Text>
                  <Text style={s.tripMetaValue}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Pickup / Dropoff dates */}
          <View style={s.dateRow}>
            <View style={[s.dateBox, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
              <View style={[s.dateDot, { backgroundColor: C.blue }]} />
              <Text style={[s.dateLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={s.dateVal}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime ? <Text style={s.dateTime}>{formatTime(booking.pickupTime)}</Text> : null}
            </View>
            {booking.dropDate ? (
              <View style={[s.dateBox, { backgroundColor: C.redL, borderColor: C.red + '25' }]}>
                <View style={[s.dateDot, { backgroundColor: C.red }]} />
                <Text style={[s.dateLabel, { color: C.red }]}>DROP-OFF</Text>
                <Text style={s.dateVal}>{formatDate(booking.dropDate)}</Text>
                {booking.dropTime ? <Text style={s.dateTime}>{formatTime(booking.dropTime)}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Payment Summary ───────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.indigoL }]}>
              <Ionicons name="card" size={15} color={C.indigo} />
            </View>
            <Text style={s.cardTitle}>Payment Summary</Text>
          </View>

          <View style={s.payList}>
            {booking.dailyRate ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Daily Rate</Text>
                <Text style={s.payVal}>₹{booking.dailyRate.toLocaleString()}</Text>
              </View>
            ) : null}
            {booking.totalDays ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Days</Text>
                <Text style={s.payVal}>{booking.totalDays}</Text>
              </View>
            ) : null}
            <View style={s.payRow}>
              <Text style={s.payLabel}>Subtotal</Text>
              <Text style={s.payVal}>₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}</Text>
            </View>
            {booking.securityDeposit > 0 ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Security Deposit</Text>
                <Text style={s.payVal}>₹{booking.securityDeposit.toLocaleString()}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Grand Total</Text>
            <Text style={s.totalVal}>₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString()}</Text>
          </View>

          {(booking.advancePaid || booking.paidAmount) > 0 ? (
            <View style={s.payList}>
              <View style={s.payRow}>
                <Text style={[s.payLabel, { color: C.g600 }]}>Advance Paid</Text>
                <Text style={[s.payVal, { color: C.g600, fontWeight: '700' }]}>
                  ₹{(booking.advancePaid || booking.paidAmount || 0).toLocaleString()}
                </Text>
              </View>
              <View style={s.payRow}>
                <Text style={[s.payLabel, { color: C.amber }]}>Balance Due</Text>
                <Text style={[s.payVal, { color: C.amber, fontWeight: '700' }]}>
                  ₹{((booking.totalAmount || 0) - (booking.advancePaid || booking.paidAmount || 0)).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Trip Control ─────────────────────────────────────────────── */}
        {showTripControl && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.purpleL }]}>
                <Ionicons name="key" size={15} color={C.purple} />
              </View>
              <Text style={s.cardTitle}>Trip Control</Text>
            </View>

            {otpError ? (
              <View style={[s.msgBox, { backgroundColor: C.redL, borderColor: C.red + '30' }]}>
                <Ionicons name="alert-circle" size={15} color={C.red} />
                <Text style={[s.msgTxt, { color: C.red }]}>{otpError}</Text>
              </View>
            ) : null}
            {otpSuccess ? (
              <View style={[s.msgBox, { backgroundColor: C.g50, borderColor: C.g400 + '50' }]}>
                <Ionicons name="checkmark-circle" size={15} color={C.g600} />
                <Text style={[s.msgTxt, { color: C.g700 }]}>{otpSuccess}</Text>
              </View>
            ) : null}

            {/* Generate OTP */}
            {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' ||
              (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
              <View>
                <Text style={s.tripDesc}>
                  {booking.status === 'PAYMENT_VERIFIED'
                    ? 'Advance payment received. Generate OTP when customer arrives for pickup.'
                    : 'When customer arrives, generate OTP to start the trip.'}
                </Text>
                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: C.purple }]}
                  onPress={handleGenerateOtp}
                  disabled={otpLoading}
                >
                  {otpLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<>
                        <Ionicons name="send" size={17} color="#fff" />
                        <Text style={s.ctaTxt}>Generate & Send OTP to Customer</Text>
                      </>)}
                </TouchableOpacity>
              </View>
            )}

            {/* Enter OTP to start */}
            {booking.status === 'READY_FOR_PICKUP' && (
              <View>
                <View style={[s.infoAlert, { backgroundColor: C.blueL, borderColor: C.blue + '20' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={C.blue} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoAlertTitle, { color: C.blue }]}>OTP sent to customer!</Text>
                    <Text style={s.infoAlertDesc}>Ask customer for the OTP shown on their booking page.</Text>
                  </View>
                </View>

                <Text style={s.otpLbl}>Enter OTP from Customer</Text>
                <View style={[s.otpInputWrap, otpInput.length === 6 && { borderColor: C.purple }]}>
                  <Icon name="key" size={17} color={otpInput.length === 6 ? C.purple : C.muted} />
                  <TextInput
                    style={s.otpInput}
                    value={otpInput}
                    onChangeText={(t) => setOtpInput(t.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    placeholderTextColor={C.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {otpInput.length === 6 && (
                    <Ionicons name="checkmark-circle" size={20} color={C.purple} />
                  )}
                </View>

                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: otpInput.length === 6 ? C.g600 : C.muted }]}
                  onPress={handleStartTrip}
                  disabled={otpLoading || otpInput.length !== 6}
                >
                  {otpLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<>
                        <Ionicons name="play-circle" size={17} color="#fff" />
                        <Text style={s.ctaTxt}>Verify OTP & Start Trip</Text>
                      </>)}
                </TouchableOpacity>

                <TouchableOpacity style={s.ctaBtnOutline} onPress={handleGenerateOtp} disabled={otpLoading}>
                  <Icon name="refresh-cw" size={15} color={C.purple} />
                  <Text style={[s.ctaTxt, { color: C.purple }]}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* End trip */}
            {booking.status === 'IN_PROGRESS' && (
              <View>
                <View style={[s.infoAlert, { backgroundColor: C.purpleL, borderColor: C.purple + '20' }]}>
                  <MaterialCommunityIcons name="motorbike" size={20} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoAlertTitle, { color: C.purple }]}>Trip In Progress</Text>
                    <Text style={s.infoAlertDesc}>When customer returns the bike, complete the trip below.</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: C.red }]}
                  onPress={handleEndTrip}
                  disabled={otpLoading}
                >
                  {otpLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<>
                        <Ionicons name="stop-circle" size={17} color="#fff" />
                        <Text style={s.ctaTxt}>End Trip & Complete Booking</Text>
                      </>)}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Completed ────────────────────────────────────────────────── */}
        {booking.status === 'COMPLETED' && (
          <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g400 + '50' }]}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <LinearGradient colors={[C.g800, C.g500]} style={s.trophyRing}>
                <Ionicons name="trophy" size={36} color="#fff" />
              </LinearGradient>
              <Text style={s.completedTitle}>Trip Completed!</Text>
              <Text style={s.completedDesc}>This booking has been successfully completed.</Text>
            </View>
          </View>
        )}

        {/* ── Customer Notes ────────────────────────────────────────────── */}
        {booking.customerNotes ? (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.amberL }]}>
                <Ionicons name="chatbox-ellipses" size={15} color={C.amber} />
              </View>
              <Text style={s.cardTitle}>Customer Notes</Text>
            </View>
            <View style={s.notesBox}>
              <Text style={s.notesTxt}>{booking.customerNotes}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ══ Action Bar ═══════════════════════════════════════════════════════ */}
      {(canAccept() || canReject()) && (
        <View style={s.actionBar}>
          {canReject() && (
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={actionLoading}>
              <Ionicons name="close-circle" size={18} color={C.red} />
              <Text style={s.rejectTxt}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity style={s.acceptBtn} onPress={handleAccept} disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : (<>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={s.acceptTxt}>Accept Booking</Text>
                  </>)}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  centeredTxt: { fontSize: 14, color: C.muted },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: { paddingHorizontal: 16, paddingBottom: 20, overflow: 'hidden' },
  deco1: {
    position: 'absolute', width: W * 0.55, height: W * 0.55,
    borderRadius: W * 0.275, backgroundColor: 'rgba(52,211,153,0.06)',
    top: -W * 0.18, right: -W * 0.1,
  },
  deco2: {
    position: 'absolute', width: W * 0.32, height: W * 0.32,
    borderRadius: W * 0.16, backgroundColor: 'rgba(16,185,129,0.05)',
    bottom: 0, left: W * 0.38,
  },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 16 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  heroCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  heroCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  heroLabel:  { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroNumber: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroMeta:     { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  // ── Alert banner ──────────────────────────────────────────────────────────
  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.g50, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: C.g400 + '50',
  },
  alertIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertTitle:   { fontSize: 14, fontWeight: '700', color: C.g700, marginBottom: 3 },
  alertDesc:    { fontSize: 12, color: C.sub, lineHeight: 17 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  // ── Customer ──────────────────────────────────────────────────────────────
  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue + '20' },
  avatarTxt:     { fontSize: 18, fontWeight: '800', color: C.blue },
  customerName:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerEmail: { fontSize: 12, color: C.muted },

  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  contactTxt: { fontSize: 12, fontWeight: '700' },

  // ── Vehicle ───────────────────────────────────────────────────────────────
  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, backgroundColor: C.amberL,
    borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.amber + '22',
  },
  vehicleIconWrap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.amber + '28' },
  vehicleName:     { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
  vehicleSub:      { fontSize: 12, color: C.sub },
  assignedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7, alignSelf: 'flex-start', backgroundColor: C.g100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  assignedTxt:     { fontSize: 11, fontWeight: '600', color: C.g700 },

  tripMetaRow:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  tripMetaItem:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripMetaIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tripMetaLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tripMetaValue: { fontSize: 13, fontWeight: '700', color: C.text },

  dateRow:  { flexDirection: 'row', gap: 10 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  dateDot:  { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dateLabel:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  dateVal:  { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateTime: { fontSize: 11, color: C.sub, fontWeight: '500' },

  // ── Payment ───────────────────────────────────────────────────────────────
  payList: { gap: 10, marginBottom: 12 },
  payRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel:{ fontSize: 13, color: C.sub },
  payVal:  { fontSize: 13, fontWeight: '600', color: C.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.g50, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.g100, marginBottom: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.g800 },
  totalVal:   { fontSize: 24, fontWeight: '900', color: C.g700 },

  // ── Trip Control ──────────────────────────────────────────────────────────
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  msgTxt: { fontSize: 12, fontWeight: '500', flex: 1 },
  tripDesc: { fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 19 },

  infoAlert:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  infoAlertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  infoAlertDesc:  { fontSize: 12, color: C.sub, lineHeight: 16 },

  otpLbl: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  otpInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 2, borderColor: C.border, borderRadius: 14, backgroundColor: C.bg, marginBottom: 14 },
  otpInput: { flex: 1, fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center', color: C.text },

  ctaBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 10 },
  ctaBtnOutline:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, marginBottom: 10, borderWidth: 2, borderColor: C.purple, backgroundColor: 'transparent' },
  ctaTxt:       { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Completed ─────────────────────────────────────────────────────────────
  trophyRing:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completedTitle: { fontSize: 20, fontWeight: '800', color: C.g700, marginBottom: 6 },
  completedDesc:  { fontSize: 13, color: C.sub, textAlign: 'center' },

  // ── Notes ─────────────────────────────────────────────────────────────────
  notesBox: { padding: 12, backgroundColor: C.amberL, borderRadius: 12, borderWidth: 1, borderColor: C.amber + '22' },
  notesTxt: { fontSize: 13, color: C.text, lineHeight: 20 },

  // ── Action Bar ────────────────────────────────────────────────────────────
  actionBar: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 }, elevation: 10,
  },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: C.red, backgroundColor: C.redL },
  rejectTxt: { fontSize: 14, fontWeight: '700', color: C.red },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 14, backgroundColor: C.g600 },
  acceptTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

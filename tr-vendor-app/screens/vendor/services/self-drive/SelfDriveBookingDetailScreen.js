import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { showError, showConfirm, showInfo, showSuccess } from '../../../../services/alertService';
import {
  getBookingById,
  acceptBooking,
  rejectBooking,
  generateTripOtp,
  verifyTripOtp,
  completeBooking,
} from '../../../api/client';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g500: '#059669', g400: '#34D399',
  g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  green: '#059669', greenL: '#ECFDF5', greenD: '#065F46',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  teal: '#0D9488', tealL: '#F0FDFA',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { color: C.amber, bg: C.amberL, label: 'Awaiting Payment', icon: 'hourglass-outline' },
  PAYMENT_VERIFIED: { color: C.green, bg: C.greenL, label: 'Payment Verified', icon: 'checkmark-circle' },
  PENDING_VENDOR: { color: C.amber, bg: C.amberL, label: 'Pending', icon: 'hourglass-outline' },
  BROADCASTED: { color: C.blue, bg: C.blueL, label: 'Open', icon: 'radio-outline' },
  ACCEPTED: { color: C.g700, bg: C.g50, label: 'Accepted', icon: 'checkmark-circle' },
  CONFIRMED: { color: C.green, bg: C.greenL, label: 'Confirmed', icon: 'checkmark-circle' },
  READY_FOR_PICKUP: { color: C.teal, bg: C.tealL, label: 'Ready for Pickup', icon: 'car-outline' },
  IN_PROGRESS: { color: C.purple, bg: C.purpleL, label: 'In Progress', icon: 'car-sport-outline' },
  COMPLETED: { color: C.muted, bg: C.bg, label: 'Completed', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { color: C.red, bg: C.redL, label: 'Cancelled', icon: 'close-circle-outline' },
};

export default function SelfDriveBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  // OTP States
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpSuccess, setOtpSuccess] = useState(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('self-drive', bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[SelfDriveBookingDetail] Error:', error);
      showError('Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
  }, [fetchBooking]);

  const handleAccept = async () => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
          try {
            setActionLoading(true);
            await acceptBooking('self-drive', bookingId);
            await fetchBooking();
            showSuccess('Booking accepted successfully');
          } catch (error) {
            showError(error?.response?.data?.error || 'Failed to accept booking');
          } finally {
            setActionLoading(false);
          }
        }, { confirmText: 'Accept' });
  };

  const handleReject = async () => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
          try {
            setActionLoading(true);
            await rejectBooking('self-drive', bookingId, 'Vendor rejected');
            await fetchBooking();
            showSuccess('Booking rejected');
          } catch (error) {
            showError(error?.response?.data?.error || 'Failed to reject booking');
          } finally {
            setActionLoading(false);
          }
        }, { confirmText: 'Reject', destructive: true });
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = (phone) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
    }
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId: booking.id,
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType: 'self-drive',
    });
  };

  // Generate OTP for trip start
  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const data = await generateTripOtp('self-drive', booking.id);
      setOtpSuccess('OTP sent to customer successfully!');
      showSuccess('OTP sent to customer successfully!');
      // Update booking status
      await fetchBooking();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to generate OTP';
      setOtpError(errorMsg);
      showError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and start trip
  const handleStartTrip = async () => {
    if (!booking || !otpInput) {
      showError('Please enter OTP');
      return;
    }
    if (otpInput.length !== 6) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const data = await verifyTripOtp('self-drive', booking.id, otpInput, 'start');
      setOtpSuccess('Trip started successfully!');
      showSuccess('Trip started successfully!');
      setOtpInput('');
      await fetchBooking();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to verify OTP';
      setOtpError(errorMsg);
      showError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // End trip
  const handleEndTrip = async () => {
    if (!booking) return;

    showConfirm('End Trip', 'Are you sure you want to complete this trip?', async () => {
            setOtpLoading(true);
            setOtpError(null);

            try {
              await completeBooking('self-drive', booking.id);
              setOtpSuccess('Trip completed successfully!');
              showSuccess('Trip completed successfully!');
              await fetchBooking();
            } catch (err) {
              const errorMsg = err?.response?.data?.error || err?.message || 'Failed to complete trip';
              setOtpError(errorMsg);
              showError(errorMsg);
            } finally {
              setOtpLoading(false);
            }
          }, { confirmText: 'Complete' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_PAYMENT;
  };

  const canAccept = () => {
    const acceptableStatuses = ['PENDING_VENDOR', 'BROADCASTED'];
    return acceptableStatuses.includes(booking?.status);
  };

  const canReject = () => {
    const rejectableStatuses = ['PENDING_VENDOR', 'BROADCASTED'];
    return rejectableStatuses.includes(booking?.status);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient
          colors={[C.g900, C.g800, C.g700]}
          style={styles.gradientHeader}
        >
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Booking Details</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient
          colors={[C.g900, C.g800, C.g700]}
          style={styles.gradientHeader}
        >
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Booking Details</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={C.muted} />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Gradient Header */}
      <LinearGradient
        colors={[C.g900, C.g800, C.g700]}
        style={styles.gradientHeader}
      >
        {/* Decorative Circles */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            {/* Back Button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Center: icon + booking number */}
            <View style={styles.headerCenter}>
              <View style={styles.headerIconRow}>
                <MaterialCommunityIcons name="car-side" size={18} color={C.g400} />
                <Text style={styles.headerTitle} numberOfLines={1}>
                  #{booking.bookingNumber || booking.id}
                </Text>
              </View>
              <Text style={styles.headerSubtitle}>Self Drive</Text>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]} numberOfLines={1}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g500} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { borderLeftColor: statusConfig.color }]}>
          <Ionicons name={statusConfig.icon} size={26} color={statusConfig.color} />
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <Text style={styles.statusDate}>
              Created on {formatDate(booking.createdAt)}
            </Text>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="person-circle-outline" size={22} color={C.g700} />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>

          <View style={styles.customerGrid}>
            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: C.blueL }]}>
                <Ionicons name="person" size={20} color={C.blue} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{booking.customerName || 'Customer'}</Text>
              </View>
            </View>

            {booking.customerEmail && (
              <View style={[styles.infoBox, styles.infoBoxFull]}>
                <View style={[styles.infoIconBox, { backgroundColor: C.purpleL }]}>
                  <Ionicons name="mail" size={20} color={C.purple} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {booking.customerEmail}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: C.purpleL }]}
              onPress={handleChat}
            >
              <Ionicons name="chatbubble" size={20} color={C.purple} />
              <Text style={[styles.quickActionText, { color: C.purple }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle & Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="car-side" size={22} color={C.g700} />
            <Text style={styles.cardTitle}>Vehicle & Trip Details</Text>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleBox}>
            <LinearGradient
              colors={[C.g50, C.g100]}
              style={styles.vehicleIconWrap}
            >
              <MaterialCommunityIcons name="car-side" size={32} color={C.g700} />
            </LinearGradient>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {booking.requestedVehicleName || booking.vehicleName || 'Self-Drive Car'}
              </Text>
              {(booking.requestedBrand || booking.vehicleCategory) && (
                <Text style={styles.vehicleDetails}>
                  {booking.requestedBrand || booking.vehicleCategory}
                </Text>
              )}
              {booking.acceptedVehicleName && (
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedText}>
                    Assigned: {booking.acceptedVehicleName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location & Duration */}
          <View style={styles.tripInfoGrid}>
            <View style={styles.tripInfoItem}>
              <Ionicons name="location" size={18} color={C.muted} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.tripInfoLabel}>Location</Text>
                <Text style={styles.tripInfoValue}>
                  {booking.locationName || booking.pickupCity || 'Not specified'}
                </Text>
              </View>
            </View>

            {booking.totalDays && (
              <View style={styles.tripInfoItem}>
                <Ionicons name="calendar" size={18} color={C.muted} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.tripInfoLabel}>Duration</Text>
                  <Text style={styles.tripInfoValue}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Pickup & Drop Dates */}
          <View style={styles.dateGrid}>
            <View style={[styles.dateBox, { backgroundColor: C.blueL }]}>
              <Text style={[styles.dateBoxLabel, { color: C.g700 }]}>PICKUP</Text>
              <Text style={styles.dateBoxDate}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime && (
                <Text style={styles.dateBoxTime}>{formatTime(booking.pickupTime)}</Text>
              )}
            </View>

            {(booking.dropDate || booking.returnDate) && (
              <View style={[styles.dateBox, { backgroundColor: C.redL }]}>
                <Text style={[styles.dateBoxLabel, { color: C.red }]}>DROP-OFF</Text>
                <Text style={styles.dateBoxDate}>{formatDate(booking.dropDate || booking.returnDate)}</Text>
                {(booking.dropTime || booking.returnTime) && (
                  <Text style={styles.dateBoxTime}>{formatTime(booking.dropTime || booking.returnTime)}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="card-outline" size={22} color={C.g700} />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>

          <View style={styles.paymentDetails}>
            {booking.dailyRate && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Daily Rate</Text>
                <Text style={styles.paymentValue}>₹{booking.dailyRate.toLocaleString()}</Text>
              </View>
            )}

            {booking.totalDays && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Days</Text>
                <Text style={styles.paymentValue}>{booking.totalDays}</Text>
              </View>
            )}

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue}>
                ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
              </Text>
            </View>

            {booking.securityDeposit > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Security Deposit</Text>
                <Text style={styles.paymentValue}>
                  ₹{booking.securityDeposit.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.paymentDivider} />

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabelBold}>Grand Total</Text>
              <Text style={styles.paymentValueTotal}>
                ₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString()}
              </Text>
            </View>

            {(booking.advancePaid || booking.paidAmount || booking.advanceAmount) > 0 && (
              <>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: C.green }]}>Advance Paid</Text>
                  <Text style={[styles.paymentValue, { color: C.green }]}>
                    ₹{(booking.advancePaid || booking.paidAmount || booking.advanceAmount || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: C.amber }]}>Balance Due</Text>
                  <Text style={[styles.paymentValue, { color: C.amber }]}>
                    ₹{(
                      (booking.grandTotal || booking.totalAmount || 0) -
                      (booking.advancePaid || booking.paidAmount || booking.advanceAmount || 0)
                    ).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Verified Info Card */}
        {booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking && (
          <View style={[styles.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="checkmark-circle" size={22} color={C.g700} />
              <Text style={[styles.cardTitle, { color: C.g700 }]}>Advance Payment Received!</Text>
            </View>
            <Text style={[styles.tripControlDesc, { color: C.g700 }]}>
              Customer has paid the advance amount. You can now generate OTP to start the trip when the customer arrives.
            </Text>
          </View>
        )}

        {/* Trip Control - OTP Section */}
        {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS' || (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="key-outline" size={22} color={C.g700} />
              <Text style={styles.cardTitle}>Trip Control</Text>
            </View>

            {/* Error/Success Messages */}
            {otpError && (
              <View style={[styles.messageBox, { backgroundColor: C.redL, borderColor: '#FCA5A5' }]}>
                <Text style={[styles.messageText, { color: C.red }]}>{otpError}</Text>
              </View>
            )}
            {otpSuccess && (
              <View style={[styles.messageBox, { backgroundColor: C.greenL, borderColor: '#6EE7B7' }]}>
                <Text style={[styles.messageText, { color: C.green }]}>{otpSuccess}</Text>
              </View>
            )}

            {/* For ACCEPTED/CONFIRMED/PAYMENT_VERIFIED - Generate OTP */}
            {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
              <View>
                <Text style={styles.tripControlDesc}>
                  When customer arrives for pickup, generate OTP to start the trip.
                </Text>
                <TouchableOpacity
                  style={[styles.otpButton, { backgroundColor: C.g700 }]}
                  onPress={handleGenerateOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#fff" />
                      <Text style={styles.otpButtonText}>Generate & Send OTP to Customer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* For READY_FOR_PICKUP - Enter OTP */}
            {booking.status === 'READY_FOR_PICKUP' && (
              <View>
                <View style={styles.otpSentBox}>
                  <Ionicons name="checkmark-circle" size={20} color={C.g700} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otpSentTitle}>OTP sent to customer!</Text>
                    <Text style={styles.otpSentDesc}>
                      Ask customer to check their booking page for OTP and tell you.
                    </Text>
                  </View>
                </View>

                <View style={styles.otpInputSection}>
                  <Text style={styles.otpInputLabel}>Enter OTP from Customer</Text>
                  <View style={styles.otpInputWrapper}>
                    <Icon name="key" size={20} color={C.muted} />
                    <TextInput
                      style={styles.otpInput}
                      value={otpInput}
                      onChangeText={(text) => setOtpInput(text.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.otpButton,
                    { backgroundColor: otpInput.length === 6 ? C.green : C.muted },
                  ]}
                  onPress={handleStartTrip}
                  disabled={otpLoading || otpInput.length !== 6}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="play-circle" size={20} color="#fff" />
                      <Text style={styles.otpButtonText}>Verify OTP & Start Trip</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.otpButton, styles.otpButtonOutline]}
                  onPress={handleGenerateOtp}
                  disabled={otpLoading}
                >
                  <Icon name="refresh-cw" size={18} color={C.g700} />
                  <Text style={[styles.otpButtonText, { color: C.g700 }]}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* For IN_PROGRESS - End Trip */}
            {booking.status === 'IN_PROGRESS' && (
              <View>
                <View style={[styles.otpSentBox, { backgroundColor: C.purpleL, borderColor: '#C084FC' }]}>
                  <Ionicons name="car" size={20} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.otpSentTitle, { color: C.purple }]}>Trip is in progress</Text>
                    <Text style={styles.otpSentDesc}>
                      When customer returns the vehicle, click below to complete the trip.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.otpButton, { backgroundColor: C.red }]}
                  onPress={handleEndTrip}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="stop-circle" size={20} color="#fff" />
                      <Text style={styles.otpButtonText}>End Trip & Complete Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Completed Status */}
        {booking.status === 'COMPLETED' && (
          <View style={[styles.card, { backgroundColor: C.greenL, borderColor: C.green }]}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Ionicons name="checkmark-circle" size={48} color={C.green} />
              <Text style={[styles.cardTitle, { marginTop: 12, color: C.green }]}>Trip Completed!</Text>
              <Text style={[styles.tripControlDesc, { textAlign: 'center', marginTop: 8 }]}>
                This booking has been successfully completed.
              </Text>
            </View>
          </View>
        )}

        {/* Customer Notes */}
        {booking.customerNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="chatbox-ellipses-outline" size={22} color={C.amber} />
              <Text style={styles.cardTitle}>Customer Notes</Text>
            </View>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{booking.customerNotes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      {(canAccept() || canReject()) && (
        <View style={styles.actionBar}>
          {canReject() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle" size={20} color={C.red} />
              <Text style={[styles.actionBtnText, { color: C.red }]}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                    Accept Booking
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: C.muted,
    marginTop: 12,
  },

  // Gradient Header
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: -40,
    right: -20,
    borderRadius: 60,
    backgroundColor: '#fff',
    opacity: 0.06,
  },
  decoCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    bottom: -20,
    left: 10,
    borderRadius: 40,
    backgroundColor: '#fff',
    opacity: 0.05,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: 120,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 12,
    color: C.muted,
  },

  // Cards
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },

  // Customer Grid
  customerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBoxFull: {
    minWidth: '100%',
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Vehicle Box
  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: C.bg,
    borderRadius: 12,
    marginBottom: 16,
  },
  vehicleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 13,
    color: C.muted,
  },
  assignedBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.g50,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  assignedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.g700,
  },

  // Trip Info Grid
  tripInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tripInfoItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripInfoLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  tripInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },

  // Date Grid
  dateGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  dateBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dateBoxDate: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  dateBoxTime: {
    fontSize: 13,
    color: C.muted,
  },

  // Payment
  paymentDetails: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: C.muted,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  paymentLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  paymentValueTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: C.g700,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },

  // Notes
  notesBox: {
    padding: 14,
    backgroundColor: C.amberL,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: C.redL,
    borderColor: C.red,
  },
  acceptBtn: {
    backgroundColor: C.g700,
    borderColor: C.g700,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Trip Control / OTP
  messageBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tripControlDesc: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  otpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  otpButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: C.g700,
  },
  otpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  otpSentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: C.g50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.g100,
    marginBottom: 16,
  },
  otpSentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.g700,
    marginBottom: 4,
  },
  otpSentDesc: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 16,
  },
  otpInputSection: {
    marginBottom: 16,
  },
  otpInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: C.g400,
    borderRadius: 12,
    backgroundColor: C.card,
  },
  otpInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: C.text,
  },
});

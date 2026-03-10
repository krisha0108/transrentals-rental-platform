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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { import { showError, showConfirm, showError, showInfo, showSuccess } from '../../../services/alertService';
  getBookingById,
  acceptBooking,
  rejectBooking,
  generateTripOtp,
  verifyTripOtp,
  completeBooking,
} from '../../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#22C55E',
  blue: '#3B82F6',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#22C55E',
  emerald: '#10B981',
  indigo: '#6366F1',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { color: C.amber, bg: '#FEF3C7', label: 'Awaiting Payment' },
  PAYMENT_VERIFIED: { color: C.green, bg: '#D1FAE5', label: 'Payment Verified' },
  PENDING_VENDOR: { color: C.orange, bg: '#FEF3C7', label: 'Pending' },
  BROADCASTED: { color: C.blue, bg: '#DBEAFE', label: 'Open' },
  ACCEPTED: { color: C.green, bg: '#DCFCE7', label: 'Accepted' },
  CONFIRMED: { color: C.emerald, bg: '#D1FAE5', label: 'Confirmed' },
  READY_FOR_PICKUP: { color: '#0891B2', bg: '#CFFAFE', label: 'Ready for Pickup' },
  IN_PROGRESS: { color: C.purple, bg: '#F3E8FF', label: 'In Progress' },
  COMPLETED: { color: C.muted, bg: '#F3F4F6', label: 'Completed' },
  CANCELLED: { color: C.red, bg: '#FEE2E2', label: 'Cancelled' },
};

export default function BikeBookingDetailScreen({ route, navigation }) {
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
            await acceptBooking('bike', bookingId);
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
            await rejectBooking('bike', bookingId, 'Vendor rejected');
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
      serviceType: 'bike',
    });
  };

  // Generate OTP for trip start
  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const data = await generateTripOtp('bike', booking.id);
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
      const data = await verifyTripOtp('bike', booking.id, otpInput, 'start');
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
              await completeBooking('bike', booking.id);
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={C.muted} />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking #{booking.bookingNumber || booking.id}</Text>
          <Text style={styles.headerSubtitle}>Bike Rental</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <View style={styles.statusContent}>
            <Icon name="check-circle" size={24} color={statusConfig.color} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
              <Text style={styles.statusDate}>
                Created on {formatDate(booking.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Received Info Card — shown for quote-based bookings after customer pays */}
        {booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking && (
          <View style={[styles.card, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={24} color={C.green} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.green, marginBottom: 4 }}>
                  Advance Payment Received!
                </Text>
                <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>
                  Customer has paid the advance. Prepare the bike and generate OTP when customer arrives for pickup.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Customer Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="person-circle-outline" size={22} color={C.blue} />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>

          <View style={styles.customerGrid}>
            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="person" size={20} color={C.blue} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{booking.customerName || 'Customer'}</Text>
              </View>
            </View>

            {booking.customerEmail && (
              <View style={[styles.infoBox, styles.infoBoxFull]}>
                <View style={[styles.infoIconBox, { backgroundColor: '#F3E8FF' }]}>
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
              style={[styles.quickActionBtn, { backgroundColor: '#F3E8FF' }]}
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
            <MaterialCommunityIcons name="motorbike" size={22} color={C.emerald} />
            <Text style={styles.cardTitle}>Vehicle & Trip Details</Text>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleBox}>
            <View style={styles.vehicleIconWrap}>
              <MaterialCommunityIcons name="motorbike" size={32} color={C.emerald} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {booking.requestedVehicleName || booking.vehicleName || 'Bike'}
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
            <View style={[styles.dateBox, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.dateBoxLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={styles.dateBoxDate}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime && (
                <Text style={styles.dateBoxTime}>{formatTime(booking.pickupTime)}</Text>
              )}
            </View>

            {booking.dropDate && (
              <View style={[styles.dateBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.dateBoxLabel, { color: C.red }]}>DROP-OFF</Text>
                <Text style={styles.dateBoxDate}>{formatDate(booking.dropDate)}</Text>
                {booking.dropTime && (
                  <Text style={styles.dateBoxTime}>{formatTime(booking.dropTime)}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="card-outline" size={22} color={C.indigo} />
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

            {(booking.advancePaid || booking.paidAmount) > 0 && (
              <>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: C.green }]}>Advance Paid</Text>
                  <Text style={[styles.paymentValue, { color: C.green }]}>
                    ₹{(booking.advancePaid || booking.paidAmount || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: C.amber }]}>Balance Due</Text>
                  <Text style={[styles.paymentValue, { color: C.amber }]}>
                    ₹{(
                      (booking.totalAmount || 0) -
                      (booking.advancePaid || booking.paidAmount || 0)
                    ).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Trip Control - OTP Section */}
        {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS' || (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="key-outline" size={22} color={C.purple} />
              <Text style={styles.cardTitle}>Trip Control</Text>
            </View>

            {/* Error/Success Messages */}
            {otpError && (
              <View style={[styles.messageBox, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                <Text style={[styles.messageText, { color: C.red }]}>{otpError}</Text>
              </View>
            )}
            {otpSuccess && (
              <View style={[styles.messageBox, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}>
                <Text style={[styles.messageText, { color: C.green }]}>{otpSuccess}</Text>
              </View>
            )}

            {/* For ACCEPTED/CONFIRMED/PAYMENT_VERIFIED(own) - Generate OTP */}
            {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
              <View>
                <Text style={styles.tripControlDesc}>
                  {booking.status === 'PAYMENT_VERIFIED'
                    ? 'Advance payment received. When customer arrives for pickup, generate OTP to start the trip.'
                    : 'When customer arrives for pickup, generate OTP to start the trip.'}
                </Text>
                <TouchableOpacity
                  style={[styles.otpButton, { backgroundColor: C.purple }]}
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
                  <Ionicons name="checkmark-circle" size={20} color={C.blue} />
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
                  <Icon name="refresh-cw" size={18} color={C.purple} />
                  <Text style={[styles.otpButtonText, { color: C.purple }]}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* For IN_PROGRESS - End Trip */}
            {booking.status === 'IN_PROGRESS' && (
              <View>
                <View style={[styles.otpSentBox, { backgroundColor: '#F3E8FF', borderColor: '#C084FC' }]}>
                  <Ionicons name="bicycle" size={20} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.otpSentTitle, { color: C.purple }]}>Trip is in progress</Text>
                    <Text style={styles.otpSentDesc}>
                      When customer returns the bike, click below to complete the trip.
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
          <View style={[styles.card, { backgroundColor: '#D1FAE5', borderColor: C.green }]}>
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
              <Ionicons name="chatbox-ellipses-outline" size={22} color={C.orange} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  card: {
    backgroundColor: C.surface,
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
    backgroundColor: '#D1FAE5',
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
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  assignedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.green,
  },
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
    color: C.emerald,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  notesBox: {
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: C.surface,
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
    backgroundColor: C.surface,
    borderColor: '#FEE2E2',
  },
  acceptBtn: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Trip Control Styles
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
    borderColor: C.purple,
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
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginBottom: 16,
  },
  otpSentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.blue,
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
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.surface,
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

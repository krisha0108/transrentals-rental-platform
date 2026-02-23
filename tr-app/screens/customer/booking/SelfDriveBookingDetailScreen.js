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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

const SelfDriveBookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
        return GREEN;
      case 'IN_PROGRESS':
        return '#2980b9';
      case 'COMPLETED':
        return '#27ae60';
      case 'CANCELLED':
      case 'REJECTED':
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
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBookingDetails}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = booking && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'IN_PROGRESS'].includes(booking.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate('BookingChat', {
            bookingId: booking?.id,
            bookingNumber: booking?.bookingNumber,
            vendorName: booking?.acceptedVendor?.businessName || booking?.assignedVendor?.businessName || 'Vendor'
          })}
        >
          <Ionicons name="chatbubble-outline" size={22} color={GREEN} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(booking.status)}</Text>
          </View>
          <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>
          <Text style={styles.bookingDate}>
            Booked on {formatDate(booking.createdAt)}
          </Text>
        </View>

        {/* Vehicle Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-sport" size={22} color={GREEN} />
            <Text style={styles.cardTitle}>Vehicle Details</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleBrand}>{booking.brand}</Text>
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            <View style={styles.specsRow}>
              {booking.transmission && (
                <View style={styles.specBadge}>
                  <Ionicons name="cog" size={14} color={GREEN} />
                  <Text style={styles.specBadgeText}>{booking.transmission}</Text>
                </View>
              )}
              {booking.fuelType && (
                <View style={styles.specBadge}>
                  <Ionicons name="water" size={14} color={GREEN} />
                  <Text style={styles.specBadgeText}>{booking.fuelType}</Text>
                </View>
              )}
              {booking.seats && (
                <View style={styles.specBadge}>
                  <Ionicons name="people" size={14} color={GREEN} />
                  <Text style={styles.specBadgeText}>{booking.seats} Seats</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={22} color={GREEN} />
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: GREEN }]} />
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
            <Ionicons name="location" size={18} color="#666" />
            <Text style={styles.locationText}>{booking.locationName || booking.location?.name || booking.pickupAddress}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={GREEN} />
            <Text style={styles.durationText}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''} Rental</Text>
          </View>
        </View>

        {/* KM Limit Info */}
        {(booking.kmLimitPerDay || booking.extraKmRate) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="speedometer-outline" size={22} color={GREEN} />
              <Text style={styles.cardTitle}>KM Limit</Text>
            </View>
            {booking.kmLimitPerDay && (
              <View style={styles.kmRow}>
                <Text style={styles.kmLabel}>Daily KM Limit</Text>
                <Text style={styles.kmValue}>{booking.kmLimitPerDay} km/day</Text>
              </View>
            )}
            {booking.extraKmRate && (
              <View style={styles.kmRow}>
                <Text style={styles.kmLabel}>Extra KM Charge</Text>
                <Text style={styles.kmValue}>₹{booking.extraKmRate}/km</Text>
              </View>
            )}
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag-outline" size={22} color={GREEN} />
            <Text style={styles.cardTitle}>Price Breakdown</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Daily Rate x {booking.totalDays}</Text>
            <Text style={styles.priceValue}>₹{booking.dailyRate * booking.totalDays}</Text>
          </View>

          {booking.securityDeposit > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Security Deposit (Refundable)</Text>
              <Text style={styles.priceValue}>₹{booking.securityDeposit}</Text>
            </View>
          )}

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{booking.grandTotal}</Text>
          </View>

          {booking.paidAmount > 0 && (
            <View style={styles.paidRow}>
              <Ionicons name="checkmark-circle" size={18} color={GREEN} />
              <Text style={styles.paidText}>₹{booking.paidAmount} Paid</Text>
            </View>
          )}
        </View>

        {/* Advance Payment Card - Show when payment is pending */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <View style={styles.advanceCard}>
            <View style={styles.advanceHeader}>
              <Ionicons name="wallet-outline" size={22} color="#fff" />
              <Text style={styles.advanceHeaderText}>Advance Payment Required</Text>
            </View>
            <View style={styles.advanceBody}>
              <View style={styles.advanceAmountRow}>
                <Text style={styles.advanceLabel}>Advance ({booking.advancePercentage || 30}%)</Text>
                <Text style={styles.advanceAmount}>₹{booking.advanceAmount}</Text>
              </View>
              <Text style={styles.advanceNote}>
                Pay advance to confirm your booking. Balance amount of ₹{booking.grandTotal - booking.advanceAmount} to be paid at pickup.
              </Text>
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={() => navigation.navigate('PaymentScreen', {
                  bookingId: booking.id,
                  bookingType: 'self-drive',
                  amount: booking.advanceAmount
                })}
              >
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={styles.payNowBtnText}>Pay ₹{booking.advanceAmount} Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Verification Pending Card */}
        {booking.status === 'PAYMENT_SUBMITTED' && (
          <View style={styles.verificationCard}>
            <View style={styles.verificationIconWrap}>
              <Ionicons name="hourglass-outline" size={32} color="#f39c12" />
            </View>
            <View style={styles.verificationContent}>
              <Text style={styles.verificationTitle}>Payment Verification Pending</Text>
              <Text style={styles.verificationText}>
                Your payment of ₹{booking.advanceAmount || booking.paidAmount} has been submitted. Our team is verifying it. You'll be notified once confirmed.
              </Text>
            </View>
          </View>
        )}

        {/* Payment Verified - Finding Vendor */}
        {(booking.status === 'PAYMENT_VERIFIED' || booking.status === 'BROADCASTED') && (
          <View style={styles.findingVendorCard}>
            <View style={styles.findingVendorIconWrap}>
              <Ionicons name="search-outline" size={32} color="#3498db" />
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
            <View style={styles.otpHeader}>
              <Ionicons name="key-outline" size={22} color="#fff" />
              <Text style={styles.otpHeaderText}>Trip Start OTP</Text>
            </View>
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
            <Ionicons name="checkmark-circle" size={24} color={GREEN} />
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
              <Ionicons name="storefront-outline" size={22} color={GREEN} />
              <Text style={styles.cardTitle}>Vendor Details</Text>
            </View>

            <View style={styles.vendorInfoRow}>
              <Text style={styles.vendorName}>{booking.vendor.name || booking.vendor.businessName}</Text>
              {booking.vendor.rating && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#f39c12" />
                  <Text style={styles.ratingText}>{booking.vendor.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {booking.vendor.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleCall(booking.vendor.phone)}
              >
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.callBtnText}>Call Vendor</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Customer Notes */}
        {booking.customerNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={22} color={GREEN} />
              <Text style={styles.cardTitle}>Your Notes</Text>
            </View>
            <Text style={styles.notesText}>{booking.customerNotes}</Text>
          </View>
        )}

        {/* Vendor Notes */}
        {booking.vendorNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={GREEN} />
              <Text style={styles.cardTitle}>Vendor Notes</Text>
            </View>
            <Text style={styles.notesText}>{booking.vendorNotes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Review & Invoice for completed bookings */}
          {booking.status === 'COMPLETED' && (
            <>
              {!booking.rating && (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: 'self-drive' })}
                >
                  <Ionicons name="star-outline" size={20} color="#FFB800" />
                  <Text style={styles.reviewBtnText}>Rate & Review</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={() => navigation.navigate('InvoiceScreen', { booking, bookingType: 'self-drive' })}
              >
                <Ionicons name="receipt-outline" size={20} color={GREEN} />
                <Text style={styles.invoiceBtnText}>View Invoice</Text>
              </TouchableOpacity>
            </>
          )}

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelBooking}>
              <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.supportBtn}
            onPress={() => Linking.openURL('tel:+919737965551')}
          >
            <Ionicons name="headset-outline" size={20} color={GREEN} />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: GREEN,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bookingNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  bookingDate: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },

  // Vehicle
  vehicleInfo: {
    alignItems: 'flex-start',
  },
  vehicleBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  specBadgeText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '500',
  },

  // Trip Details
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tripPoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 10,
  },
  tripInfo: {},
  tripLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  tripTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  tripLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  durationText: {
    color: GREEN,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },

  // KM Limit
  kmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kmLabel: {
    fontSize: 14,
    color: '#666',
  },
  kmValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(9,179,104,0.1)',
    padding: 10,
    borderRadius: 10,
  },
  paidText: {
    color: GREEN,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Advance Payment Card
  advanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GREEN,
  },
  advanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  advanceHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  advanceBody: {
    padding: 16,
  },
  advanceAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  advanceLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  advanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: GREEN,
  },
  advanceNote: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
    marginBottom: 16,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payNowBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // OTP Card
  otpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  otpHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  otpBody: {
    padding: 16,
    alignItems: 'center',
  },
  otpInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpCodeContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  otpCode: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3498db',
    letterSpacing: 8,
  },
  otpNote: {
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Trip Started Card
  tripStartedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GREEN,
  },
  tripStartedInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tripStartedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  tripStartedText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  // Vendor
  vendorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Notes
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Actions
  actions: {
    marginTop: 8,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FFB800',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewBtnText: {
    color: '#B8860B',
    fontWeight: '600',
    marginLeft: 8,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    borderWidth: 1,
    borderColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  invoiceBtnText: {
    color: GREEN,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdecea',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  cancelBtnText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN,
    gap: 8,
  },
  supportBtnText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
  },

  // Payment Verification Card
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  verificationIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationContent: {
    flex: 1,
    marginLeft: 14,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f39c12',
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // Finding Vendor Card
  findingVendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  findingVendorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  findingVendorContent: {
    flex: 1,
    marginLeft: 14,
  },
  findingVendorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3498db',
    marginBottom: 4,
  },
  findingVendorText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default SelfDriveBookingDetailScreen;

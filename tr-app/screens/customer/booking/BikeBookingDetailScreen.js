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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import api, { BASE_URL } from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookingDetails();
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
            <Ionicons name="bicycle" size={22} color={GREEN} />
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
            <Text style={styles.locationText}>{booking.locationName}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={GREEN} />
            <Text style={styles.durationText}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''} Rental</Text>
          </View>
        </View>

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

        {/* Quote Details Button - Show if quote details exist */}
        {booking.quote && (
          <TouchableOpacity
            style={styles.viewQuoteDetailsBtn}
            onPress={() => setQuoteDetailsVisible(true)}
          >
            <Ionicons name="document-text-outline" size={22} color={GREEN} />
            <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
            <Ionicons name="chevron-forward" size={20} color={GREEN} />
          </TouchableOpacity>
        )}

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
                  bookingType: 'bike',
                  amount: booking.advanceAmount
                })}
              >
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={styles.payNowBtnText}>Pay ₹{booking.advanceAmount} Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* OTP Card - Show only when vendor is ready to start trip and has sent OTP */}
        {booking.tripStartOtp &&
         !booking.tripOtpVerified &&
         (booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
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

            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{booking.vendor.name}</Text>
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
                  onPress={() => navigation.navigate('ReviewScreen', { booking, bookingType: 'bike' })}
                >
                  <Ionicons name="star-outline" size={20} color="#FFB800" />
                  <Text style={styles.reviewBtnText}>Rate & Review</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={() => navigation.navigate('InvoiceScreen', { booking, bookingType: 'bike' })}
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
            onPress={() => Linking.openURL('tel:+918800302030')}
          >
            <Ionicons name="headset-outline" size={20} color={GREEN} />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
            {/* Header */}
            <View style={styles.quoteModalHeader}>
              <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)} style={styles.quoteCloseBtn}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.quoteModalTitle}>Quote Details</Text>
              <View style={{ width: 40 }} />
            </View>

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
                    {/* Vehicle Features */}
                    {(() => {
                      const features = parseListData(booking.quote.vehicleFeatures);
                      return features.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <Ionicons name="checkmark-circle" size={22} color={GREEN} />
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
                                <Ionicons name="checkmark-circle" size={16} color={GREEN} />
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
                        <Ionicons name="information-circle-outline" size={22} color={GREEN} />
                        <Text style={styles.quoteSectionTitle}>Additional Information</Text>
                      </View>
                      <View style={styles.quoteInfoCard}>
                        {booking.quote.registrationNumber && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="card-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              Registration: {booking.quote.registrationNumber}
                            </Text>
                          </View>
                        )}
                        {booking.quote.helmetsIncluded !== undefined && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons
                              name={booking.quote.helmetsIncluded ? 'checkmark-circle' : 'close-circle'}
                              size={20}
                              color={booking.quote.helmetsIncluded ? GREEN : '#e74c3c'}
                            />
                            <Text style={styles.quoteInfoText}>
                              Helmets {booking.quote.helmetsIncluded ? 'Included' : 'Not Included'}
                            </Text>
                          </View>
                        )}
                        {booking.quote.kmLimitPerDay && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="speedometer-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              {booking.quote.kmLimitPerDay} KM per day limit
                            </Text>
                          </View>
                        )}
                        {booking.quote.extraKmCharge && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="cash-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              ₹{booking.quote.extraKmCharge} per extra KM
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Vendor Message */}
                      {booking.quote.vendorMessage && (
                        <View style={styles.quoteVendorMessage}>
                          <View style={styles.quoteMessageHeader}>
                            <Ionicons name="chatbox-outline" size={18} color={GREEN} />
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
                      <Ionicons name="checkmark-done-circle" size={22} color={GREEN} />
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
                                <Ionicons name="checkmark" size={18} color={GREEN} />
                              </View>
                              <Text style={styles.quoteListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color="#ccc" />
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
                      <Ionicons name="close-circle" size={22} color="#e74c3c" />
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
                                <Ionicons name="close" size={18} color="#e74c3c" />
                              </View>
                              <Text style={styles.quoteListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.quoteEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color="#ccc" />
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
                      <Ionicons name="document-text" size={22} color={GREEN} />
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
                          <Ionicons name="document-text-outline" size={40} color="#ccc" />
                          <Text style={styles.quoteEmptyText}>No terms and conditions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
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
  },
  categoryBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(9,179,104,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '600',
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
  },
  payNowBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
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
  vendorInfo: {
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
  },
  ratingText: {
    color: '#f39c12',
    fontWeight: '600',
    marginLeft: 4,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelBtnText: {
    color: '#e74c3c',
    fontWeight: '600',
    marginLeft: 8,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
  },
  supportBtnText: {
    color: GREEN,
    fontWeight: '600',
    marginLeft: 8,
  },

  // View Quote Details Button
  viewQuoteDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  viewQuoteDetailsText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
    marginRight: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quoteCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  quoteModalContent: {
    flex: 1,
  },

  // Tabs
  quoteTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quoteTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  quoteTabActive: {
    borderBottomColor: GREEN,
  },
  quoteTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  quoteTabTextActive: {
    color: GREEN,
  },

  // Tab Content
  quoteTabContent: {
    padding: 16,
  },
  quoteSection: {
    marginBottom: 20,
  },
  quoteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },

  // Features
  quoteFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  quoteFeatureItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  quoteFeatureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    paddingTop: 1,
  },

  // Info Card
  quoteInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  quoteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },

  // Vendor Message
  quoteVendorMessage: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  quoteMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteMessageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 8,
  },
  quoteMessageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  // List Card (Inclusions/Exclusions)
  quoteListCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  quoteListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  quoteListItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  quoteListBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  quoteExclusionBullet: {
    backgroundColor: 'rgba(231,76,60,0.1)',
  },
  quoteListText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
    paddingTop: 3,
  },

  // Terms Card
  quoteTermsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  quoteTermsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  quoteTermsBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quoteTermsNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },

  // Empty State
  quoteEmptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 14,
    alignItems: 'center',
  },
  quoteEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});

export default BikeBookingDetailScreen;

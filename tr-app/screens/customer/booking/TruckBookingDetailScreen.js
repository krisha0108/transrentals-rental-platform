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
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../api';

const GREEN = '#09B368';
const BRAND_TEAL = '#0B6E4F';
const BG = '#F5F5F7';

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: '#F59E0B', icon: 'time-outline' },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  ADVANCE_PAID: { label: 'Advance Paid', color: '#10B981', icon: 'checkmark-done-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-done-circle' },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: '#8B5CF6', icon: 'bus-outline' },
  IN_PROGRESS: { label: 'Trip In Progress', color: '#F59E0B', icon: 'navigate-circle-outline' },
  COMPLETED: { label: 'Completed', color: '#10B981', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
};

export default function TruckBookingDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

  useEffect(() => {
    fetchBookingDetails();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBookingDetails(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchBookingDetails = async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const response = await api.get(`/truck-bookings/${bookingId}`);
      if (response.data.success) {
        setBooking(response.data.booking);
      }
    } catch (error) {
      console.log('Error fetching truck booking:', error);
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
      bookingType: 'truck',
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
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Truck Booking</Text>
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
          <Ionicons name="chatbubble-outline" size={22} color={BRAND_TEAL} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={BRAND_TEAL} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Payment Pending - Show Pay Now Button */}
        {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount > 0 && (
          <TouchableOpacity style={styles.payNowBtn} onPress={handlePayment}>
            <Ionicons name="wallet" size={22} color="#000" />
            <Text style={styles.payNowText}>
              Pay Advance Amount - ₹{booking.advanceAmount?.toLocaleString('en-IN')}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </TouchableOpacity>
        )}

        {/* Payment Submitted - Verification Pending */}
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
              <Ionicons name="shield-checkmark" size={16} color="#64748B" />
              <Text style={styles.verificationFooterText}>
                Our team is verifying your payment details
              </Text>
            </View>
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bus" size={20} color={BRAND_TEAL} />
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: GREEN }]} />
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
              <Ionicons name="bus-outline" size={20} color={BRAND_TEAL} />
              <Text style={styles.cardTitle}>Vehicle & Driver Details</Text>
            </View>

            {booking.vehicleName && (
              <View style={styles.vehicleBox}>
                <MaterialCommunityIcons name="bus" size={32} color={BRAND_TEAL} />
                <View style={{ flex: 1, marginLeft: 12 }}>
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
                  <Ionicons name="person-circle-outline" size={40} color={BRAND_TEAL} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.driverName}>{booking.driverName}</Text>
                    <Text style={styles.driverLabel}>Driver</Text>
                    {booking.driverPhone && (
                      <TouchableOpacity
                        onPress={() => handleCallDriver(booking.driverPhone)}
                        style={styles.callBtn}
                      >
                        <Ionicons name="call" size={14} color={GREEN} />
                        <Text style={styles.callBtnText}>{booking.driverPhone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Trip OTP (if available) - Only show when READY_FOR_PICKUP or IN_PROGRESS and not verified */}
        {booking.tripStartOtp &&
         !booking.tripOtpVerified &&
         (booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="key-outline" size={20} color={BRAND_TEAL} />
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
              <Ionicons name="business-outline" size={20} color={BRAND_TEAL} />
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
                  <Ionicons name="call" size={14} color={GREEN} />
                  <Text style={[styles.detailValue, { color: GREEN, marginLeft: 6 }]}>
                    {booking.vendor.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {booking.vendor.rating && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rating</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={[styles.detailValue, { marginLeft: 4 }]}>
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
            <Ionicons name="wallet-outline" size={20} color={BRAND_TEAL} />
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

          <View style={[styles.detailRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{booking.totalAmount?.toLocaleString()}</Text>
          </View>

          {booking.advanceAmount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Advance Amount</Text>
                <Text style={[styles.detailValue, { color: GREEN }]}>
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
                      ? GREEN + '15'
                      : '#F59E0B15',
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  {
                    color:
                      booking.paymentStatus === 'PAID' || booking.advancePaid ? GREEN : '#F59E0B',
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
            <Ionicons name="document-text-outline" size={22} color={GREEN} />
            <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
            <Ionicons name="chevron-forward" size={20} color={GREEN} />
          </TouchableOpacity>
        )}

        {/* Trip Timeline (if trip started/completed) */}
        {(booking.tripStartedAt || booking.tripEndedAt) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color={BRAND_TEAL} />
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

        {/* Rating & Review (if completed) */}
        {booking.status === 'COMPLETED' && (booking.rating || !booking.rating) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-outline" size={20} color={BRAND_TEAL} />
              <Text style={styles.cardTitle}>Rating & Review</Text>
            </View>

            {booking.rating ? (
              <>
                <View style={styles.ratingBox}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= booking.rating ? 'star' : 'star-outline'}
                        size={24}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>{booking.rating.toFixed(1)}</Text>
                </View>
                {booking.review && (
                  <View style={styles.reviewBox}>
                    <Text style={styles.reviewText}>{booking.review}</Text>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity style={styles.rateBtn}>
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.rateBtnText}>Rate this trip</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
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
                    {/* Vehicle Details */}
                    {(() => {
                      const vehicleDetails = parseListData(booking.quote.vehicleDetails);
                      return vehicleDetails.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <MaterialCommunityIcons name="truck" size={22} color={GREEN} />
                            <Text style={styles.quoteSectionTitle}>Vehicle Details</Text>
                          </View>
                          <View style={styles.quoteListCard}>
                            {vehicleDetails.map((detail, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.quoteFeatureItem,
                                  idx === vehicleDetails.length - 1 && styles.quoteFeatureItemLast,
                                ]}
                              >
                                <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                                <Text style={styles.quoteFeatureText}>{detail}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Driver Details */}
                    {(() => {
                      const driverDetails = parseListData(booking.quote.driverDetails);
                      return driverDetails.length > 0 && (
                        <View style={styles.quoteSection}>
                          <View style={styles.quoteSectionHeader}>
                            <Ionicons name="person-circle-outline" size={22} color={GREEN} />
                            <Text style={styles.quoteSectionTitle}>Driver Details</Text>
                          </View>
                          <View style={styles.quoteListCard}>
                            {driverDetails.map((detail, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.quoteFeatureItem,
                                  idx === driverDetails.length - 1 && styles.quoteFeatureItemLast,
                                ]}
                              >
                                <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                                <Text style={styles.quoteFeatureText}>{detail}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Vendor Message */}
                    {booking.quote.vendorMessage && (
                      <View style={styles.quoteSection}>
                        <View style={styles.quoteVendorMessage}>
                          <View style={styles.quoteMessageHeader}>
                            <Ionicons name="chatbox-outline" size={18} color={GREEN} />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  tripRow: {
    marginBottom: 12,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tripDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  tripLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 5,
    marginVertical: 4,
  },
  tripLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  tripValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  tripAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  vehicleNumber: {
    fontSize: 12,
    color: BRAND_TEAL,
    fontWeight: '600',
    marginTop: 4,
  },
  vehicleModel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  driverLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  callBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 8,
  },
  otpValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 8,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reviewBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  reviewText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  rateBtn: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
  },
  rateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCD34D',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  payNowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  paymentVerificationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  verificationIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  verificationIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#fff',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  verificationInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  verificationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verificationInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  verificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
    justifyContent: 'center',
  },
  verificationFooterText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
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
    marginHorizontal: 16,
    marginTop: 12,
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

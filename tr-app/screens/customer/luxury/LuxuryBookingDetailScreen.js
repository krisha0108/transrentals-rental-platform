import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../api';

// Light Mode Colors
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const GREEN = '#09B368';
const BG = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E5E7EB';

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AMBER]} />
        }
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
              <Text style={styles.statusDescription}>{statusConfig.description}</Text>
            </View>
          </View>

          <View style={styles.bookingNumberRow}>
            <MaterialCommunityIcons name="crown" size={20} color={AMBER} />
            <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>
          </View>
        </View>

        {/* Payment Pending - Show Pay Now Button */}
        {booking.status === 'PENDING_PAYMENT' && (
          <TouchableOpacity style={styles.payNowBtn} onPress={handlePayment}>
            <Ionicons name="wallet" size={22} color="#000" />
            <Text style={styles.payNowText}>Pay Advance Amount - {formatCurrency(booking.advanceAmount)}</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </TouchableOpacity>
        )}

        {/* View Invoice Button - Show after advance is paid */}
        {['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <TouchableOpacity style={styles.invoiceBtn} onPress={handleViewInvoice}>
            <Ionicons name="document-text-outline" size={22} color={AMBER_DARK} />
            <Text style={styles.invoiceBtnText}>View Invoice</Text>
            <Ionicons name="arrow-forward" size={20} color={AMBER_DARK} />
          </TouchableOpacity>
        )}

        {/* Trip OTP - Show only when status is READY_FOR_PICKUP or IN_PROGRESS and OTP not verified */}
        {booking.tripStartOtp &&
          !booking.tripOtpVerified &&
          (booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="key" size={20} color={AMBER} />
                <Text style={styles.cardTitle}>Trip Start OTP</Text>
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

        {/* Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={20} color={AMBER} />
            <Text style={styles.cardTitle}>Trip Details</Text>
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

          <View style={styles.separator} />

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: GREEN }]} />
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

          <View style={styles.separator} />

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

          {booking.tripHours && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Package</Text>
              <Text style={styles.detailValue}>{booking.tripHours} Hours</Text>
            </View>
          )}
        </View>

        {/* Driver Details */}
        {booking.driverName && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color={AMBER} />
              <Text style={styles.cardTitle}>Driver Details</Text>
            </View>

            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={32} color={AMBER} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.driverName}>{booking.driverName}</Text>
                {booking.driverPhone && (
                  <TouchableOpacity
                    style={styles.driverPhoneRow}
                    onPress={() => handleCallDriver(booking.driverPhone)}
                  >
                    <Ionicons name="call" size={16} color={GREEN} />
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
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="business" size={20} color={AMBER} />
              <Text style={styles.cardTitle}>Vendor Details</Text>
            </View>

            <View style={styles.vendorInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vendorName}>{booking.vendor.businessName}</Text>
                {booking.vendor.rating && (
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
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color={AMBER} />
              <Text style={styles.cardTitle}>Quote Details</Text>
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
                    <Ionicons name="checkmark-circle" size={16} color={GREEN} />
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
                <Ionicons name="chatbubble" size={16} color={AMBER} />
                <Text style={styles.messageText}>{booking.quote.vendorMessage}</Text>
              </View>
            )}
          </View>
        )}

        {/* Decoration Details */}
        {booking.needDecoration && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="flower" size={20} color={AMBER} />
              <Text style={styles.cardTitle}>Decoration</Text>
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
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={20} color={AMBER} />
              <Text style={styles.cardTitle}>Special Requirements</Text>
            </View>
            <Text style={styles.requirementsText}>{booking.requirements}</Text>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={20} color={AMBER} />
            <Text style={styles.cardTitle}>Payment Details</Text>
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
                <Ionicons name="checkmark-circle" size={16} color={GREEN} />
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
            <Ionicons name="document-text-outline" size={22} color={AMBER} />
            <Text style={styles.viewQuoteDetailsText}>View Quote Details</Text>
            <Ionicons name="chevron-forward" size={20} color={AMBER} />
          </TouchableOpacity>
        )}

        {/* Booking Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={20} color={AMBER} />
            <Text style={styles.cardTitle}>Booking Info</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked On</Text>
            <Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text>
          </View>
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
                <Ionicons name="close" size={28} color={TEXT_PRIMARY} />
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
                            <Ionicons name="checkmark-circle" size={22} color={AMBER} />
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
                                <Ionicons name="checkmark-circle" size={16} color={AMBER} />
                                <Text style={styles.quoteFeatureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Vehicle & Chauffeur Details */}
                    <View style={styles.quoteSection}>
                      <View style={styles.quoteSectionHeader}>
                        <Ionicons name="information-circle-outline" size={22} color={AMBER} />
                        <Text style={styles.quoteSectionTitle}>Additional Information</Text>
                      </View>
                      <View style={styles.quoteInfoCard}>
                        {booking.quote.vehicleModel && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="car-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              Model: {booking.quote.vehicleModel}
                            </Text>
                          </View>
                        )}
                        {booking.quote.vehicleYear && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              Year: {booking.quote.vehicleYear}
                            </Text>
                          </View>
                        )}
                        {booking.quote.vehicleNumber && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="card-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              Registration: {booking.quote.vehicleNumber}
                            </Text>
                          </View>
                        )}
                        {booking.quote.driverName && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="person-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              Chauffeur: {booking.quote.driverName}
                            </Text>
                          </View>
                        )}
                        {booking.quote.driverPhone && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="call-outline" size={20} color="#666" />
                            <Text style={styles.quoteInfoText}>
                              Phone: {booking.quote.driverPhone}
                            </Text>
                          </View>
                        )}
                        {booking.quote.driverExperience && (
                          <View style={styles.quoteInfoRow}>
                            <Ionicons name="ribbon-outline" size={20} color="#666" />
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
                            <Ionicons name="chatbox-outline" size={18} color={AMBER} />
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
                      <Ionicons name="checkmark-done-circle" size={22} color={AMBER} />
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
                                <Ionicons name="checkmark" size={18} color={AMBER} />
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
                      <Ionicons name="document-text" size={22} color={AMBER} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: 12,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  bookingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AMBER,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  payNowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AMBER_LIGHT,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: 8,
  },
  invoiceBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AMBER_DARK,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  otpContainer: {
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 12,
  },
  otpBox: {
    backgroundColor: AMBER_LIGHT,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AMBER,
    borderStyle: 'dashed',
  },
  otpText: {
    fontSize: 32,
    fontWeight: '800',
    color: AMBER_DARK,
    letterSpacing: 8,
  },
  otpHint: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 12,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 16,
  },
  locationSection: {
    marginVertical: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: BORDER_COLOR,
    marginLeft: 5,
    marginVertical: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  locationAddress: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AMBER_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  driverPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverPhone: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  quoteInfo: {
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  inclusionsBox: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  inclusionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  inclusionText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
  },
  exclusionsBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  exclusionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  exclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  exclusionText: {
    fontSize: 13,
    color: '#991B1B',
    flex: 1,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: AMBER_LIGHT,
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  requirementsText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: AMBER,
  },
  advanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AMBER_LIGHT,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  advanceLabel: {
    fontSize: 13,
    color: AMBER_DARK,
    marginBottom: 4,
  },
  advanceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: AMBER_DARK,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  paidText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },

  // View Quote Details Button
  viewQuoteDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1.5,
    borderColor: AMBER,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  viewQuoteDetailsText: {
    color: AMBER,
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
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
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
    color: TEXT_PRIMARY,
  },
  quoteModalContent: {
    flex: 1,
  },

  // Tabs
  quoteTabs: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  quoteTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  quoteTabActive: {
    borderBottomColor: AMBER,
  },
  quoteTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  quoteTabTextActive: {
    color: AMBER,
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
    color: TEXT_PRIMARY,
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
    color: TEXT_PRIMARY,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    paddingTop: 1,
  },

  // Info Card
  quoteInfoCard: {
    backgroundColor: CARD_BG,
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
    backgroundColor: CARD_BG,
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
    color: AMBER,
    marginLeft: 8,
  },
  quoteMessageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  // List Card (Inclusions/Exclusions)
  quoteListCard: {
    backgroundColor: CARD_BG,
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
    backgroundColor: AMBER_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  quoteExclusionBullet: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  quoteListText: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    lineHeight: 22,
    flex: 1,
    paddingTop: 3,
  },

  // Terms Card
  quoteTermsCard: {
    backgroundColor: CARD_BG,
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
    backgroundColor: AMBER_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quoteTermsNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: AMBER_DARK,
  },

  // Empty State
  quoteEmptyState: {
    backgroundColor: CARD_BG,
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

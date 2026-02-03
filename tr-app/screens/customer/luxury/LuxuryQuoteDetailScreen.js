import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api';

const { width, height } = Dimensions.get('window');

// Light Mode Colors
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const LUXURY_GOLD = '#D4AF37';
const BG = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E5E7EB';
const GREEN = '#09B368';

export default function LuxuryQuoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [acceptingQuote, setAcceptingQuote] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [successAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const customer = JSON.parse(data);
        setCustomerData(customer);
        await fetchQuoteRequestDetails(customer);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const fetchQuoteRequestDetails = async (customer) => {
    try {
      const response = await api.get(`/customer/luxury-quote-requests/${requestId}`, {
        params: {
          customer_id: customer?.id,
          email: customer?.email,
          phone: customer?.phone,
        },
      });

      if (response.data.success) {
        setQuoteRequest(response.data.quoteRequest);
      } else {
        console.error('API returned success:false', response.data);
        Alert.alert('Error', response.data.message || 'Failed to load quote details');
      }
    } catch (error) {
      console.error('Error fetching quote request details:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load quote details';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (customerData) {
      await fetchQuoteRequestDetails(customerData);
    }
    setRefreshing(false);
  };

  const openAcceptModal = (quote) => {
    setSelectedQuote(quote);
    setShowAcceptModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const closeAcceptModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAcceptModal(false);
      setSelectedQuote(null);
    });
  };

  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    try {
      setAcceptingQuote(selectedQuote.id);
      const response = await api.post(`/customer/luxury-quote-requests/${requestId}/accept`, {
        quoteId: selectedQuote.id,
      });

      if (response.data.success) {
        const bookingId = response.data.booking?.id;
        const bookingNumber = response.data.booking?.bookingNumber;
        const advanceAmount = response.data.booking?.advanceAmount;
        const grandTotal = response.data.booking?.grandTotal;

        closeAcceptModal();

        // Store success data
        setSuccessData({
          bookingId,
          bookingNumber,
          advanceAmount,
          grandTotal,
        });

        // Show success modal with animation
        setTimeout(() => {
          setShowSuccessModal(true);
          Animated.spring(successAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }, 300);

        // Reload quote details
        if (customerData) {
          await fetchQuoteRequestDetails(customerData);
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to accept quote');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept quote';
      Alert.alert('Error', errorMessage);
    } finally {
      setAcceptingQuote(null);
    }
  };

  const handleCallVendor = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const closeSuccessModal = () => {
    Animated.timing(successAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      setSuccessData(null);
    });
  };

  const handleViewBooking = () => {
    closeSuccessModal();
    setTimeout(() => {
      if (successData?.bookingId) {
        navigation.navigate('LuxuryBookingDetail', { bookingId: successData.bookingId });
      } else {
        navigation.navigate('MyLuxuryBookings');
      }
    }, 300);
  };

  const handlePayNow = () => {
    closeSuccessModal();
    setTimeout(() => {
      if (successData?.bookingId && successData?.bookingNumber && successData?.advanceAmount) {
        navigation.navigate('PaymentScreen', {
          bookingId: successData.bookingId,
          bookingNumber: successData.bookingNumber,
          bookingType: 'luxury',
          amount: successData.advanceAmount,
        });
      } else {
        navigation.navigate('MyLuxuryBookings');
      }
    }, 300);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={styles.loadingText}>Loading quote details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quoteRequest) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={TEXT_SECONDARY} />
          <Text style={styles.errorText}>Quote request not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasQuotes = quoteRequest.quotes && quoteRequest.quotes.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quote Details</Text>
          <Text style={styles.headerSubtitle}>{quoteRequest.requestNumber}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AMBER]}
            tintColor={AMBER}
          />
        }
      >
        {/* Request Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[AMBER, AMBER_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <MaterialCommunityIcons name="crown" size={32} color={AMBER} style={styles.crownIcon} />
            <Text style={styles.summaryTitle}>{quoteRequest.vehicleCategoryName || quoteRequest.vehicleCategory}</Text>
            <Text style={styles.summarySubtitle}>{quoteRequest.tripType.toUpperCase()}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="location" size={18} color={TEXT_PRIMARY} />
                <Text style={styles.summaryItemText}>{quoteRequest.pickupCity}</Text>
              </View>
              {quoteRequest.dropCity && (
                <>
                  <Ionicons name="arrow-forward" size={16} color={TEXT_SECONDARY} />
                  <View style={styles.summaryItem}>
                    <Ionicons name="location" size={18} color={TEXT_PRIMARY} />
                    <Text style={styles.summaryItemText}>{quoteRequest.dropCity}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={18} color={TEXT_PRIMARY} />
                <Text style={styles.summaryItemText}>{formatDate(quoteRequest.pickupDate)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={18} color={TEXT_PRIMARY} />
                <Text style={styles.summaryItemText}>{quoteRequest.pickupTime}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow icon="car-sports" label="Vehicle Category" value={quoteRequest.vehicleCategoryName} />
            {quoteRequest.specificModel && (
              <DetailRow icon="car-luxury" label="Preferred Model" value={quoteRequest.specificModel} />
            )}
            <DetailRow icon="account-group" label="Passengers" value={`${quoteRequest.passengers} persons`} />
            {quoteRequest.occasion && (
              <DetailRow icon="calendar-star" label="Occasion" value={quoteRequest.occasion} />
            )}
            {quoteRequest.tripDays > 1 && (
              <DetailRow icon="calendar-range" label="Trip Duration" value={`${quoteRequest.tripDays} days`} />
            )}
            {quoteRequest.packageType && (
              <DetailRow icon="package-variant" label="Package" value={quoteRequest.packageType} />
            )}
            {quoteRequest.needDecoration && (
              <DetailRow
                icon="flower"
                label="Decoration"
                value={quoteRequest.decorationType || 'Required'}
                valueColor={GREEN}
              />
            )}
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <View style={styles.detailsCard}>
            <View style={styles.addressBlock}>
              <View style={styles.addressHeader}>
                <Ionicons name="location" size={18} color={GREEN} />
                <Text style={styles.addressLabel}>Pickup</Text>
              </View>
              <Text style={styles.addressText}>{quoteRequest.pickupAddress || quoteRequest.pickupCity}</Text>
            </View>

            {quoteRequest.dropAddress && (
              <View style={[styles.addressBlock, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
                <View style={styles.addressHeader}>
                  <Ionicons name="location" size={18} color={AMBER} />
                  <Text style={styles.addressLabel}>Drop</Text>
                </View>
                <Text style={styles.addressText}>{quoteRequest.dropAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Special Requirements */}
        {quoteRequest.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requirements</Text>
            <View style={styles.detailsCard}>
              <Text style={styles.requirementsText}>{quoteRequest.requirements}</Text>
            </View>
          </View>
        )}

        {/* Vendor Quotes */}
        <View style={styles.section}>
          <View style={styles.quotesHeader}>
            <Text style={styles.sectionTitle}>Vendor Quotes</Text>
            {hasQuotes && (
              <View style={styles.quotesCountBadge}>
                <Text style={styles.quotesCountText}>{quoteRequest.quotes.length}</Text>
              </View>
            )}
          </View>

          {!hasQuotes ? (
            <View style={styles.noQuotesContainer}>
              <View style={styles.noQuotesIconCircle}>
                <MaterialCommunityIcons name="receipt-text-outline" size={60} color={LUXURY_GOLD} />
              </View>
              <Text style={styles.noQuotesTitle}>No Quotations Yet</Text>
              <Text style={styles.noQuotesMessage}>
                Your request has been sent to vendors. They will review and send you competitive quotes soon.
              </Text>
              <View style={styles.noQuotesInfoBox}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                <Text style={styles.noQuotesInfoText}>
                  Usually within 24-48 hours
                </Text>
              </View>
              <Text style={styles.noQuotesPullRefresh}>Pull down to refresh</Text>
            </View>
          ) : (
            quoteRequest.quotes.map((quote, index) => (
              <View key={quote.id} style={styles.quoteCard}>
                {/* Vendor Header */}
                <TouchableOpacity
                  style={styles.quoteHeader}
                  onPress={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vendorInfo}>
                    {quote.vendor?.logo ? (
                      <Image source={{ uri: quote.vendor.logo }} style={styles.vendorImage} />
                    ) : (
                      <View style={[styles.vendorImage, styles.vendorPlaceholder]}>
                        <MaterialCommunityIcons name="store" size={20} color={AMBER} />
                      </View>
                    )}
                    <View style={styles.vendorDetails}>
                      <Text style={styles.vendorName}>{quote.vendor?.businessName || 'Vendor'}</Text>
                      <View style={styles.vendorMeta}>
                        {quote.vendor?.rating && (
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color={AMBER} />
                            <Text style={styles.ratingText}>{quote.vendor.rating.toFixed(1)}</Text>
                          </View>
                        )}
                        <Text style={styles.vendorCity}>
                          {quote.vendor?.city || quote.vendor?.state || ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.quotePriceContainer}>
                    <Text style={styles.quotePrice}>{formatCurrency(quote.totalAmount)}</Text>
                    <Ionicons
                      name={expandedQuote === quote.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={TEXT_SECONDARY}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Quote Details */}
                {expandedQuote === quote.id && (
                  <View style={styles.quoteExpanded}>
                    {/* Vehicle Details */}
                    <View style={styles.quoteSection}>
                      <Text style={styles.quoteSectionTitle}>Vehicle Details</Text>
                      <DetailRow icon="car" label="Vehicle" value={quote.vehicleName} small />
                      {quote.vehicleModel && (
                        <DetailRow icon="information" label="Model" value={quote.vehicleModel} small />
                      )}
                      {quote.vehicleNumber && (
                        <DetailRow icon="numeric" label="Number" value={quote.vehicleNumber} small />
                      )}
                      {quote.vehicleYear && (
                        <DetailRow icon="calendar" label="Year" value={quote.vehicleYear.toString()} small />
                      )}
                    </View>

                    {/* Driver Details */}
                    {quote.driverName && (
                      <View style={styles.quoteSection}>
                        <Text style={styles.quoteSectionTitle}>Chauffeur Details</Text>
                        <DetailRow icon="account" label="Name" value={quote.driverName} small />
                        {quote.driverPhone && (
                          <DetailRow icon="phone" label="Phone" value={quote.driverPhone} small />
                        )}
                        {quote.driverExperience && (
                          <DetailRow
                            icon="certificate"
                            label="Experience"
                            value={`${quote.driverExperience} years`}
                            small
                          />
                        )}
                      </View>
                    )}

                    {/* Pricing Breakdown */}
                    <View style={styles.quoteSection}>
                      <Text style={styles.quoteSectionTitle}>Pricing Breakdown</Text>
                      <PriceRow label="Base Amount" value={quote.baseAmount} />
                      {quote.chauffeurCharges > 0 && (
                        <PriceRow label="Chauffeur Charges" value={quote.chauffeurCharges} />
                      )}
                      {quote.decorationCharges > 0 && (
                        <PriceRow label="Decoration Charges" value={quote.decorationCharges} />
                      )}
                      {quote.fuelCharges > 0 && (
                        <PriceRow label="Fuel Charges" value={quote.fuelCharges} />
                      )}
                      {quote.tollEstimate > 0 && (
                        <PriceRow label="Toll (Est.)" value={quote.tollEstimate} />
                      )}
                      {quote.parkingEstimate > 0 && (
                        <PriceRow label="Parking (Est.)" value={quote.parkingEstimate} />
                      )}
                      {quote.nightHaltCharges > 0 && (
                        <PriceRow label="Night Halt" value={quote.nightHaltCharges} />
                      )}
                      {quote.gstAmount > 0 && (
                        <PriceRow label="GST" value={quote.gstAmount} />
                      )}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>{formatCurrency(quote.totalAmount)}</Text>
                      </View>
                      {quote.advanceAmount && (
                        <View style={styles.advanceRow}>
                          <Text style={styles.advanceLabel}>Advance to Pay</Text>
                          <Text style={styles.advanceValue}>{formatCurrency(quote.advanceAmount)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Rates */}
                    {(quote.perKmRate || quote.perHourRate) && (
                      <View style={styles.quoteSection}>
                        <Text style={styles.quoteSectionTitle}>Additional Rates</Text>
                        {quote.perKmRate && (
                          <DetailRow icon="road" label="Per KM Rate" value={formatCurrency(quote.perKmRate)} small />
                        )}
                        {quote.perHourRate && (
                          <DetailRow icon="clock" label="Per Hour Rate" value={formatCurrency(quote.perHourRate)} small />
                        )}
                        {quote.extraKmRate && (
                          <DetailRow icon="plus" label="Extra KM" value={formatCurrency(quote.extraKmRate)} small />
                        )}
                        {quote.extraHourRate && (
                          <DetailRow icon="plus" label="Extra Hour" value={formatCurrency(quote.extraHourRate)} small />
                        )}
                      </View>
                    )}

                    {/* Vendor Message */}
                    {quote.vendorMessage && (
                      <View style={styles.quoteSection}>
                        <Text style={styles.quoteSectionTitle}>Vendor Message</Text>
                        <Text style={styles.notesText}>{quote.vendorMessage}</Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.quoteActions}>
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => handleCallVendor(quote.vendor?.phone)}
                      >
                        <Ionicons name="call" size={18} color={GREEN} />
                        <Text style={styles.callBtnText}>Call Vendor</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => openAcceptModal(quote)}
                        disabled={acceptingQuote === quote.id}
                      >
                        <LinearGradient
                          colors={[AMBER, AMBER_DARK]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.acceptGradient}
                        >
                          {acceptingQuote === quote.id ? (
                            <ActivityIndicator size="small" color={BG} />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="check-circle" size={18} color={BG} />
                              <Text style={styles.acceptBtnText}>Accept Quote</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Luxurious Accept Quote Modal */}
      <Modal
        visible={showAcceptModal}
        transparent
        animationType="fade"
        onRequestClose={closeAcceptModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <LinearGradient
              colors={['#FFF', AMBER_LIGHT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              {/* Crown Icon */}
              <View style={styles.modalIconContainer}>
                <LinearGradient
                  colors={[AMBER, AMBER_DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIconBg}
                >
                  <MaterialCommunityIcons name="crown" size={48} color="#FFF" />
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>Accept This Quote?</Text>
              <Text style={styles.modalSubtitle}>Confirm your luxury booking</Text>

              {/* Quote Summary */}
              {selectedQuote && (
                <View style={styles.modalQuoteCard}>
                  {/* Vendor */}
                  <View style={styles.modalRow}>
                    <View style={styles.modalRowLeft}>
                      <MaterialCommunityIcons name="store" size={18} color={TEXT_SECONDARY} />
                      <Text style={styles.modalLabel}>Vendor</Text>
                    </View>
                    <Text style={styles.modalValue}>{selectedQuote.vendor?.businessName || 'Vendor'}</Text>
                  </View>

                  {/* Vehicle */}
                  <View style={styles.modalRow}>
                    <View style={styles.modalRowLeft}>
                      <MaterialCommunityIcons name="car-luxury" size={18} color={TEXT_SECONDARY} />
                      <Text style={styles.modalLabel}>Vehicle</Text>
                    </View>
                    <Text style={styles.modalValue}>{selectedQuote.vehicleName}</Text>
                  </View>

                  {/* Total Amount */}
                  <View style={[styles.modalRow, styles.modalTotalRow]}>
                    <View style={styles.modalRowLeft}>
                      <MaterialCommunityIcons name="cash" size={20} color={AMBER} />
                      <Text style={styles.modalTotalLabel}>Total Amount</Text>
                    </View>
                    <Text style={styles.modalTotalValue}>
                      {formatCurrency(selectedQuote.totalAmount)}
                    </Text>
                  </View>

                  {/* Advance Amount */}
                  {selectedQuote.advanceAmount > 0 && (
                    <View style={styles.modalAdvanceRow}>
                      <Ionicons name="information-circle" size={16} color={GREEN} />
                      <Text style={styles.modalAdvanceText}>
                        Pay {formatCurrency(selectedQuote.advanceAmount)} advance to confirm
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={closeAcceptModal}
                  disabled={acceptingQuote === selectedQuote?.id}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={confirmAcceptQuote}
                  disabled={acceptingQuote === selectedQuote?.id}
                >
                  <LinearGradient
                    colors={[AMBER, AMBER_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalConfirmGradient}
                  >
                    {acceptingQuote === selectedQuote?.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                        <Text style={styles.modalConfirmText}>Confirm Booking</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModalContent,
              {
                transform: [
                  {
                    scale: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
                opacity: successAnimation,
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FEF3C7', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.successGradient}
            >
              {/* Success Icon with Animation */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIconOuter}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.successIconBg}
                  >
                    <MaterialCommunityIcons name="check-circle" size={64} color="#FFF" />
                  </LinearGradient>
                </View>
                {/* Confetti/Sparkles */}
                <View style={styles.sparkleContainer}>
                  <MaterialCommunityIcons name="star-four-points" size={20} color={AMBER} style={styles.sparkle1} />
                  <MaterialCommunityIcons name="star-four-points" size={16} color="#10B981" style={styles.sparkle2} />
                  <MaterialCommunityIcons name="star-four-points" size={18} color={AMBER_DARK} style={styles.sparkle3} />
                </View>
              </View>

              {/* Success Message */}
              <Text style={styles.successTitle}>Booking Confirmed!</Text>
              <Text style={styles.successSubtitle}>Your luxury car rental has been successfully booked</Text>

              {/* Booking Details Card */}
              {successData && (
                <View style={styles.successDetailsCard}>
                  <View style={styles.successDetailRow}>
                    <View style={styles.successDetailLeft}>
                      <MaterialCommunityIcons name="ticket-confirmation" size={20} color={AMBER} />
                      <Text style={styles.successDetailLabel}>Booking ID</Text>
                    </View>
                    <Text style={styles.successDetailValue}>{successData.bookingNumber}</Text>
                  </View>

                  <View style={styles.successDivider} />

                  <View style={styles.successDetailRow}>
                    <View style={styles.successDetailLeft}>
                      <MaterialCommunityIcons name="cash-multiple" size={20} color={GREEN} />
                      <Text style={styles.successDetailLabel}>Total Amount</Text>
                    </View>
                    <Text style={styles.successTotalValue}>
                      ₹{successData.grandTotal?.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.successAdvanceBox}>
                    <View style={styles.successAdvanceHeader}>
                      <Ionicons name="wallet" size={18} color={AMBER_DARK} />
                      <Text style={styles.successAdvanceTitle}>Advance Payment Required</Text>
                    </View>
                    <Text style={styles.successAdvanceAmount}>
                      ₹{successData.advanceAmount?.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.successAdvanceHint}>
                      Pay now to confirm your booking
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.successActions}>
                <TouchableOpacity
                  style={styles.successViewBtn}
                  onPress={handleViewBooking}
                >
                  <Ionicons name="document-text-outline" size={20} color={AMBER_DARK} />
                  <Text style={styles.successViewText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.successPayBtn}
                  onPress={handlePayNow}
                >
                  <LinearGradient
                    colors={[AMBER, AMBER_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.successPayGradient}
                  >
                    <MaterialCommunityIcons name="credit-card" size={20} color="#FFF" />
                    <Text style={styles.successPayText}>Pay Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper Components
const DetailRow = ({ icon, label, value, valueColor, small }) => (
  <View style={[styles.detailRow, small && styles.detailRowSmall]}>
    <View style={styles.detailLabel}>
      <MaterialCommunityIcons name={icon} size={small ? 14 : 16} color={TEXT_SECONDARY} />
      <Text style={[styles.detailLabelText, small && styles.detailLabelTextSmall]}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }, small && styles.detailValueSmall]}>
      {value}
    </Text>
  </View>
);

const PriceRow = ({ label, value }) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>{label}</Text>
    <Text style={styles.priceValue}>₹{value.toLocaleString('en-IN')}</Text>
  </View>
);

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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
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
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AMBER,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 20,
    alignItems: 'center',
  },
  crownIcon: {
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: AMBER,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryItemText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRowSmall: {
    marginBottom: 8,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabelText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  detailLabelTextSmall: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  detailValueSmall: {
    fontSize: 13,
  },
  addressBlock: {
    marginBottom: 0,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  requirementsText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  quotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quotesCountBadge: {
    backgroundColor: AMBER + '30',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotesCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: AMBER,
  },
  noQuotesCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noQuotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 16,
  },
  noQuotesText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
  },
  noQuotesContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noQuotesIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noQuotesMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  noQuotesInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  noQuotesInfoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  noQuotesPullRefresh: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    fontStyle: 'italic',
  },
  quoteCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  vendorPlaceholder: {
    backgroundColor: AMBER + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  vendorCity: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  quotePriceContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: AMBER,
  },
  quoteExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    paddingTop: 12,
  },
  quoteSection: {
    marginBottom: 16,
  },
  quoteSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: AMBER,
  },
  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AMBER + '30',
  },
  advanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  advanceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: GREEN,
  },
  notesText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN + '20',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN + '50',
    gap: 6,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
  },
  acceptBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BG,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalGradient: {
    padding: 24,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalQuoteCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    maxWidth: '50%',
    textAlign: 'right',
  },
  modalTotalRow: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: AMBER + '30',
    marginBottom: 0,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modalTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AMBER,
  },
  modalAdvanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GREEN + '30',
  },
  modalAdvanceText: {
    fontSize: 13,
    color: GREEN,
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalConfirmGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },

  // Success Modal Styles
  successModalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  successGradient: {
    padding: 24,
    alignItems: 'center',
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  successIconBg: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: 140,
    height: 140,
    left: -10,
    top: -10,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 0,
    opacity: 0.8,
  },
  sparkle2: {
    position: 'absolute',
    top: 40,
    left: -5,
    opacity: 0.6,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    opacity: 0.7,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  successDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  successDetailLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  successDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  successTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: GREEN,
  },
  successAdvanceBox: {
    marginTop: 16,
    backgroundColor: AMBER_LIGHT,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: AMBER,
    borderStyle: 'dashed',
  },
  successAdvanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  successAdvanceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AMBER_DARK,
  },
  successAdvanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: AMBER_DARK,
    marginBottom: 4,
  },
  successAdvanceHint: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successViewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AMBER,
  },
  successViewText: {
    fontSize: 15,
    fontWeight: '700',
    color: AMBER_DARK,
  },
  successPayBtn: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  successPayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  successPayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});

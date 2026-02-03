import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../api';

const GREEN = '#09B368';
const BRAND_TEAL = '#0B6E4F';
const BG = '#F5F5F7';

const STATUS_CONFIG = {
  PENDING: { label: 'Awaiting Quotes', color: '#F59E0B', icon: 'time-outline' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: '#3B82F6', icon: 'mail-outline' },
  ACCEPTED: { label: 'Quote Accepted', color: '#10B981', icon: 'checkmark-circle' },
  EXPIRED: { label: 'Expired', color: '#EF4444', icon: 'close-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', icon: 'close-circle' },
};

export default function TruckQuoteRequestDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { requestId } = route.params;

  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingQuote, setAcceptingQuote] = useState(null);

  // Confirmation Modal State
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [acceptError, setAcceptError] = useState(null);
  const [acceptSuccess, setAcceptSuccess] = useState(null);

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [detailsTab, setDetailsTab] = useState('overview'); // overview, inclusions, exclusions, terms

  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [requestId])
  );

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/truck-quote-requests/${requestId}`);
      if (response.data.success && response.data.quoteRequest) {
        const requestData = response.data.quoteRequest;
        setRequest(requestData);
        setQuotes(requestData.quotes || []);

        // If quote already accepted and booking created, redirect to booking detail
        if (requestData.status === 'ACCEPTED' && requestData.bookingId) {
          navigation.replace('TruckBookingDetail', { bookingId: requestData.bookingId });
        }
      }
    } catch (err) {
      console.log('Error fetching request:', err);
      if (!refreshing) {
        Alert.alert('Error', 'Failed to load request details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequestDetails();
  };

  // Show quote details modal
  const handleViewQuoteDetails = (quote) => {
    setViewingQuote(quote);
    setDetailsTab('overview');
    setQuoteDetailsVisible(true);
  };

  // Close quote details modal
  const handleCloseQuoteDetails = () => {
    setQuoteDetailsVisible(false);
    setViewingQuote(null);
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

  // Show confirmation modal
  const handleAcceptQuote = (quote) => {
    setSelectedQuote(quote);
    setAcceptError(null);
    setAcceptSuccess(null);
    setConfirmModalVisible(true);
  };

  // Confirm and process quote acceptance
  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    setAcceptingQuote(selectedQuote.id);
    setAcceptError(null);

    try {
      const response = await api.patch(`/truck-quote-requests/${requestId}`, {
        action: 'accept_quote',
        quoteId: selectedQuote.id,
      });

      if (response.data?.success && response.data?.booking) {
        setAcceptSuccess({
          bookingId: response.data.booking.id,
          bookingNumber: response.data.booking.bookingNumber,
        });
      } else {
        setAcceptError(response.data?.message || 'Failed to accept quote. Please try again.');
      }
    } catch (err) {
      console.log('Error accepting quote:', err);

      let errorMessage = 'Something went wrong. Please try again.';
      if (err.response) {
        errorMessage = err.response.data?.message ||
                      err.response.data?.error ||
                      `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setAcceptError(errorMessage);
    } finally {
      setAcceptingQuote(null);
    }
  };

  // Close modal and navigate if success
  const handleModalClose = () => {
    const successData = acceptSuccess;
    const quoteData = selectedQuote;

    setConfirmModalVisible(false);
    setSelectedQuote(null);
    setAcceptError(null);
    setAcceptSuccess(null);

    if (successData && successData.bookingId) {
      const advanceAmount = quoteData?.advanceAmount ||
                           Math.round((quoteData?.totalAmount || 0) * 0.25);

      navigation.replace('PaymentScreen', {
        bookingId: successData.bookingId,
        bookingNumber: successData.bookingNumber,
        bookingType: 'truck',
        amount: advanceAmount,
      });
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading quote request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
          <Text style={styles.errorText}>Quote request not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote Request Details</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {/* Request Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconCircle, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon} size={32} color={statusConfig.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.requestNumber}>#{request.requestNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                <Text style={styles.statusText}>{statusConfig.label}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.statusMessage}>
            {request.status === 'PENDING' &&
              'Your quote request is being sent to verified truck rental vendors. You will receive quotes within 24-48 hours.'}
            {request.status === 'QUOTES_RECEIVED' &&
              `You have received ${quotes.length} quote${quotes.length > 1 ? 's' : ''}. Review and accept the best one!`}
            {request.status === 'ACCEPTED' &&
              'Your quote has been accepted and booking is created. Check booking details for further information.'}
            {request.status === 'EXPIRED' &&
              'This quote request has expired. Please create a new request.'}
          </Text>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trip Type</Text>
            <Text style={styles.detailValue}>
              {request.tripType?.charAt(0).toUpperCase() + request.tripType?.slice(1).replace('-', ' ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Category</Text>
            <Text style={styles.detailValue}>{request.vehicleCategoryName || request.vehicleCategory}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers</Text>
            <Text style={styles.detailValue}>{request.passengers} people</Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: GREEN }]} />
              <View>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{request.pickupCity || request.pickupAddress}</Text>
              </View>
            </View>
            {request.dropCity && (
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: '#e74c3c' }]} />
                <View>
                  <Text style={styles.locationLabel}>Drop</Text>
                  <Text style={styles.locationText}>{request.dropCity || request.dropAddress}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup Date</Text>
            <Text style={styles.detailValue}>
              {formatDate(request.pickupDate)} | {request.pickupTime || '10:00 AM'}
            </Text>
          </View>

          {request.returnDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Return Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(request.returnDate)} | {request.returnTime || '10:00 AM'}
              </Text>
            </View>
          )}

          {request.tripDays && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Duration</Text>
              <Text style={styles.detailValue}>{request.tripDays} day{request.tripDays > 1 ? 's' : ''}</Text>
            </View>
          )}

          {request.requirements && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Requirements</Text>
              <Text style={styles.detailValue}>{request.requirements}</Text>
            </View>
          )}
        </View>

        {/* Quotes Received */}
        {quotes.length > 0 ? (
          <View style={styles.quotesSection}>
            <Text style={styles.sectionTitle}>
              Quotes Received ({quotes.length})
            </Text>

            {quotes.map((quote) => (
              <View key={quote.id} style={styles.quoteCard}>
                <View style={styles.quoteHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendorName}>{quote.vendor?.businessName || 'Vendor'}</Text>
                    {quote.vendor?.rating && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {quote.vendor.rating.toFixed(1)} ({quote.vendor.totalRatings || 0} reviews)
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Total</Text>
                    <Text style={styles.priceValue}>₹{quote.totalAmount?.toLocaleString('en-IN') || '0'}</Text>
                  </View>
                </View>

                <View style={styles.quoteDetails}>
                  {quote.vehicleName && (
                    <View style={styles.quoteDetailRow}>
                      <Ionicons name="bus-outline" size={16} color="#666" />
                      <Text style={styles.quoteDetailText}>{quote.vehicleName}</Text>
                    </View>
                  )}
                  {quote.inclusions && (
                    <View style={styles.quoteDetailRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={GREEN} />
                      <Text style={styles.quoteDetailText}>{quote.inclusions}</Text>
                    </View>
                  )}
                  {quote.validTill && (
                    <View style={styles.quoteDetailRow}>
                      <Ionicons name="time-outline" size={16} color="#F59E0B" />
                      <Text style={styles.quoteDetailText}>Valid till {formatDate(quote.validTill)}</Text>
                    </View>
                  )}
                </View>

                {/* View Full Details Button */}
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => handleViewQuoteDetails(quote)}
                >
                  <Ionicons name="information-circle-outline" size={18} color={GREEN} />
                  <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={GREEN} />
                </TouchableOpacity>

                {quote.status === 'SENT' || quote.status === 'VIEWED' ? (
                  <TouchableOpacity
                    style={[styles.acceptBtn, acceptingQuote === quote.id && styles.acceptBtnDisabled]}
                    onPress={() => handleAcceptQuote(quote)}
                    disabled={acceptingQuote === quote.id}
                  >
                    {acceptingQuote === quote.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.acceptBtnText}>Accept Quote</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                ) : quote.status === 'ACCEPTED' ? (
                  <View style={styles.acceptedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                    <Text style={styles.acceptedText}>Accepted</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noQuotesCard}>
            <Ionicons name="mail-outline" size={60} color="#ddd" />
            <Text style={styles.noQuotesTitle}>No Quotes Yet</Text>
            <Text style={styles.noQuotesText}>
              Vendors are reviewing your request. You'll be notified when quotes arrive.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Accept Quote Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Success State */}
            {acceptSuccess ? (
              <View style={styles.modalContent}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={70} color={GREEN} />
                </View>
                <Text style={styles.modalTitle}>Booking Confirmed!</Text>
                <Text style={styles.successBookingNumber}>
                  #{acceptSuccess.bookingNumber}
                </Text>
                <Text style={styles.modalMessage}>
                  Your truck booking has been created successfully. Please proceed to payment to confirm your booking.
                </Text>
                <TouchableOpacity
                  style={styles.successBtn}
                  onPress={handleModalClose}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.successBtnText}>Proceed to Payment</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              /* Confirmation / Error State */
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {acceptError ? 'Oops!' : 'Confirm Booking'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleModalClose}
                    style={styles.modalCloseBtn}
                    disabled={!!acceptingQuote}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Error Display */}
                {acceptError && (
                  <View style={styles.errorContainerModal}>
                    <View style={styles.errorIconWrap}>
                      <Ionicons name="alert-circle" size={50} color="#e74c3c" />
                    </View>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorMessage}>{acceptError}</Text>
                    <View style={styles.errorActions}>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={confirmAcceptQuote}
                        disabled={!!acceptingQuote}
                      >
                        {acceptingQuote ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="refresh" size={18} color="#fff" />
                            <Text style={styles.retryBtnText}>Try Again</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.checkBookingsBtn}
                        onPress={() => {
                          setConfirmModalVisible(false);
                          navigation.navigate('TruckBookingsScreen');
                        }}
                      >
                        <Ionicons name="list" size={18} color={GREEN} />
                        <Text style={styles.checkBookingsBtnText}>Check My Bookings</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.errorHint}>
                      If the booking was created, you'll find it in your bookings list.
                    </Text>
                  </View>
                )}

                {/* Quote Details - Only show if no error */}
                {!acceptError && selectedQuote && (
                  <>
                    <View style={styles.confirmQuoteCard}>
                      <View style={styles.confirmVendorRow}>
                        <View style={styles.confirmVendorAvatar}>
                          <Ionicons name="car" size={24} color={GREEN} />
                        </View>
                        <View style={styles.confirmVendorInfo}>
                          <Text style={styles.confirmVendorName}>
                            {selectedQuote.vendor?.businessName || 'Vendor'}
                          </Text>
                          {selectedQuote.vendor?.rating && (
                            <View style={styles.confirmRating}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.confirmRatingText}>
                                {selectedQuote.vendor.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {selectedQuote.vehicleName && (
                        <View style={styles.confirmDetailRow}>
                          <Ionicons name="car-outline" size={16} color="#666" />
                          <Text style={styles.confirmDetailText}>{selectedQuote.vehicleName}</Text>
                        </View>
                      )}

                      {selectedQuote.inclusions && (
                        <View style={styles.confirmDetailRow}>
                          <Ionicons name="checkmark-circle-outline" size={16} color={GREEN} />
                          <Text style={styles.confirmDetailText}>{selectedQuote.inclusions}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.confirmPriceCard}>
                      <Text style={styles.confirmPriceLabel}>Total Amount</Text>
                      <Text style={styles.confirmPriceValue}>
                        ₹{selectedQuote.totalAmount?.toLocaleString('en-IN') || '0'}
                      </Text>
                      <View style={styles.advancePaymentHighlight}>
                        <Ionicons name="wallet-outline" size={18} color={GREEN} />
                        <Text style={styles.advancePaymentText}>
                          Pay ₹{(selectedQuote.advanceAmount || Math.round(selectedQuote.totalAmount * 0.25))?.toLocaleString('en-IN')} advance to confirm
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.confirmBtn, acceptingQuote && styles.confirmBtnDisabled]}
                      onPress={confirmAcceptQuote}
                      disabled={!!acceptingQuote}
                    >
                      {acceptingQuote ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={[styles.confirmBtnText, { marginLeft: 8 }]}>Processing...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.confirmBtnText}>Confirm & Continue</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Quote Details Modal with Tabs */}
      <Modal
        visible={quoteDetailsVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseQuoteDetails}
      >
        <SafeAreaView style={styles.detailsModalContainer}>
          {/* Header */}
          <View style={styles.detailsHeader}>
            <TouchableOpacity onPress={handleCloseQuoteDetails} style={styles.detailsCloseBtn}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.detailsHeaderTitle}>Quote Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {viewingQuote && (
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              {/* Vendor Header */}
              <View style={styles.detailsVendorCard}>
                <View style={styles.detailsVendorRow}>
                  <View style={styles.detailsVendorAvatar}>
                    <Ionicons name="business" size={28} color={GREEN} />
                  </View>
                  <View style={styles.detailsVendorInfo}>
                    <Text style={styles.detailsVendorName}>
                      {viewingQuote.vendors?.businessName || viewingQuote.vendor?.businessName || 'Vendor'}
                    </Text>
                    {(viewingQuote.vendors?.rating || viewingQuote.vendor?.rating) && (
                      <View style={styles.detailsRating}>
                        <Ionicons name="star" size={16} color="#f39c12" />
                        <Text style={styles.detailsRatingText}>
                          {(viewingQuote.vendors?.rating || viewingQuote.vendor?.rating).toFixed(1)} Rating
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {viewingQuote.quoteNumber && (
                  <Text style={styles.detailsQuoteNumber}>#{viewingQuote.quoteNumber}</Text>
                )}
              </View>

              {/* Tabs */}
              <View style={styles.detailsTabs}>
                <TouchableOpacity
                  style={[styles.detailsTab, detailsTab === 'overview' && styles.detailsTabActive]}
                  onPress={() => setDetailsTab('overview')}
                >
                  <Text style={[styles.detailsTabText, detailsTab === 'overview' && styles.detailsTabTextActive]}>
                    Overview
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailsTab, detailsTab === 'inclusions' && styles.detailsTabActive]}
                  onPress={() => setDetailsTab('inclusions')}
                >
                  <Text style={[styles.detailsTabText, detailsTab === 'inclusions' && styles.detailsTabTextActive]}>
                    Inclusions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailsTab, detailsTab === 'exclusions' && styles.detailsTabActive]}
                  onPress={() => setDetailsTab('exclusions')}
                >
                  <Text style={[styles.detailsTabText, detailsTab === 'exclusions' && styles.detailsTabTextActive]}>
                    Exclusions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailsTab, detailsTab === 'terms' && styles.detailsTabActive]}
                  onPress={() => setDetailsTab('terms')}
                >
                  <Text style={[styles.detailsTabText, detailsTab === 'terms' && styles.detailsTabTextActive]}>
                    Terms
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={styles.detailsTabContent}>
                {/* Overview Tab */}
                {detailsTab === 'overview' && (
                  <View>
                    {/* Vehicle Info */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <Ionicons name="car-outline" size={22} color={GREEN} />
                        <Text style={styles.detailsSectionTitle}>Vehicle Details</Text>
                      </View>
                      <View style={styles.detailsVehicleCard}>
                        <Text style={styles.detailsVehicleName}>{viewingQuote.vehicleName || 'Truck'}</Text>
                        {(viewingQuote.vehicleNumber || viewingQuote.vehicle_number) && (
                          <View style={styles.detailsRegRow}>
                            <Ionicons name="card-outline" size={16} color="#666" />
                            <Text style={styles.detailsRegNumber}>
                              {viewingQuote.vehicleNumber || viewingQuote.vehicle_number}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.driverName || viewingQuote.driver_name) && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="person-outline" size={18} color="#666" />
                            <Text style={styles.detailsInfoText}>
                              Driver: {viewingQuote.driverName || viewingQuote.driver_name}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.driverPhone || viewingQuote.driver_phone) && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="call-outline" size={18} color="#666" />
                            <Text style={styles.detailsInfoText}>
                              {viewingQuote.driverPhone || viewingQuote.driver_phone}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Pricing Details */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <Ionicons name="cash-outline" size={22} color={GREEN} />
                        <Text style={styles.detailsSectionTitle}>Pricing Breakdown</Text>
                      </View>
                      <View style={styles.detailsPricingCard}>
                        {(viewingQuote.baseAmount || viewingQuote.base_amount) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>Base Amount</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.baseAmount || viewingQuote.base_amount)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.loadingCharges || viewingQuote.loading_charges) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>Loading Charges</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.loadingCharges || viewingQuote.loading_charges)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.unloadingCharges || viewingQuote.unloading_charges) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>Unloading Charges</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.unloadingCharges || viewingQuote.unloading_charges)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.labourCharges || viewingQuote.labour_charges) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>
                              Labour Charges{' '}
                              {(viewingQuote.labourCount || viewingQuote.labour_count)
                                ? `(${viewingQuote.labourCount || viewingQuote.labour_count} workers)`
                                : ''}
                            </Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.labourCharges || viewingQuote.labour_charges)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.packagingCharges || viewingQuote.packaging_charges) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>Packaging Charges</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.packagingCharges || viewingQuote.packaging_charges)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.insuranceCharges || viewingQuote.insurance_charges) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>Insurance Charges</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.insuranceCharges || viewingQuote.insurance_charges)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.tollEstimate || viewingQuote.toll_estimate || viewingQuote.tollCharges || viewingQuote.toll_charges) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>Toll Charges (Estimate)</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.tollEstimate || viewingQuote.toll_estimate || viewingQuote.tollCharges || viewingQuote.toll_charges)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.gstAmount || viewingQuote.gst_amount) > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>GST (18%)</Text>
                            <Text style={styles.detailsPriceValue}>
                              ₹{(viewingQuote.gstAmount || viewingQuote.gst_amount)?.toLocaleString('en-IN') || '0'}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.detailsPriceRow, styles.detailsTotalRow]}>
                          <Text style={styles.detailsTotalLabel}>Total Amount</Text>
                          <Text style={styles.detailsTotalValue}>₹{viewingQuote.totalAmount?.toLocaleString('en-IN') || '0'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Additional Info */}
                    {(viewingQuote.validTill || viewingQuote.notes || viewingQuote.vendorMessage) && (
                      <View style={styles.detailsSection}>
                        <View style={styles.detailsSectionHeader}>
                          <Ionicons name="information-circle-outline" size={22} color={GREEN} />
                          <Text style={styles.detailsSectionTitle}>Additional Information</Text>
                        </View>
                        <View style={styles.detailsInfoCard}>
                          {viewingQuote.validTill && (
                            <View style={styles.detailsInfoRow}>
                              <Ionicons name="time-outline" size={20} color="#666" />
                              <Text style={styles.detailsInfoText}>
                                Valid till {formatDate(viewingQuote.validTill)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Vendor Message */}
                        {(viewingQuote.vendorMessage || viewingQuote.notes) && (
                          <View style={styles.detailsVendorMessage}>
                            <View style={styles.detailsMessageHeader}>
                              <Ionicons name="chatbox-outline" size={18} color={GREEN} />
                              <Text style={styles.detailsMessageTitle}>Message from Vendor</Text>
                            </View>
                            <Text style={styles.detailsMessageText}>
                              {viewingQuote.vendorMessage || viewingQuote.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Inclusions Tab */}
                {detailsTab === 'inclusions' && (
                  <View style={styles.detailsSection}>
                    <View style={styles.detailsSectionHeader}>
                      <Ionicons name="checkmark-done-circle" size={22} color={GREEN} />
                      <Text style={styles.detailsSectionTitle}>What's Included</Text>
                    </View>
                    {(() => {
                      const inclusions = parseListData(viewingQuote.inclusions);
                      return inclusions.length > 0 ? (
                        <View style={styles.detailsListCard}>
                          {inclusions.map((item, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.detailsListItem,
                                idx === inclusions.length - 1 && styles.detailsListItemLast,
                              ]}
                            >
                              <View style={styles.detailsListBullet}>
                                <Ionicons name="checkmark" size={18} color={GREEN} />
                              </View>
                              <Text style={styles.detailsListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.detailsEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color="#ccc" />
                          <Text style={styles.detailsEmptyText}>No inclusions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Exclusions Tab */}
                {detailsTab === 'exclusions' && (
                  <View style={styles.detailsSection}>
                    <View style={styles.detailsSectionHeader}>
                      <Ionicons name="close-circle" size={22} color="#e74c3c" />
                      <Text style={styles.detailsSectionTitle}>What's Not Included</Text>
                    </View>
                    {(() => {
                      const exclusions = parseListData(viewingQuote.exclusions);
                      return exclusions.length > 0 ? (
                        <View style={styles.detailsListCard}>
                          {exclusions.map((item, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.detailsListItem,
                                idx === exclusions.length - 1 && styles.detailsListItemLast,
                              ]}
                            >
                              <View style={[styles.detailsListBullet, styles.detailsExclusionBullet]}>
                                <Ionicons name="close" size={18} color="#e74c3c" />
                              </View>
                              <Text style={styles.detailsListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.detailsEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color="#ccc" />
                          <Text style={styles.detailsEmptyText}>No exclusions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Terms Tab */}
                {detailsTab === 'terms' && (
                  <View style={styles.detailsSection}>
                    <View style={styles.detailsSectionHeader}>
                      <Ionicons name="document-text" size={22} color={GREEN} />
                      <Text style={styles.detailsSectionTitle}>Terms & Conditions</Text>
                    </View>
                    {(() => {
                      const terms = parseListData(viewingQuote.termsConditions || viewingQuote.terms);

                      // If we got an array with multiple items, show as bullet points
                      if (terms.length > 1) {
                        return (
                          <View style={styles.detailsListCard}>
                            {terms.map((item, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.detailsListItem,
                                  idx === terms.length - 1 && styles.detailsListItemLast,
                                ]}
                              >
                                <View style={styles.detailsTermsBullet}>
                                  <Text style={styles.detailsTermsNumber}>{idx + 1}</Text>
                                </View>
                                <Text style={styles.detailsListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      }

                      // If single item or plain text, show as paragraph
                      if (terms.length === 1 || viewingQuote.termsConditions || viewingQuote.terms) {
                        return (
                          <View style={styles.detailsTermsCard}>
                            <Text style={styles.detailsTermsText}>
                              {terms.length === 1 ? terms[0] : (viewingQuote.termsConditions || viewingQuote.terms)}
                            </Text>
                          </View>
                        );
                      }

                      // No terms
                      return (
                        <View style={styles.detailsEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color="#ccc" />
                          <Text style={styles.detailsEmptyText}>No terms and conditions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>

              {/* Bottom Actions */}
              <View style={styles.detailsActions}>
                {request.status !== 'ACCEPTED' && viewingQuote.status !== 'ACCEPTED' && (
                  <TouchableOpacity
                    style={styles.detailsAcceptBtn}
                    onPress={() => {
                      handleCloseQuoteDetails();
                      handleAcceptQuote(viewingQuote);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.detailsAcceptBtnText}>Accept This Quote</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
    fontWeight: '700',
    color: '#333',
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
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  locationSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 4,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  quotesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  quoteDetails: {
    marginBottom: 12,
  },
  quoteDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  quoteDetailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  acceptBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  acceptBtnDisabled: {
    backgroundColor: '#ccc',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GREEN + '20',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  acceptedText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
  },
  noQuotesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  noQuotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  noQuotesText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 16,
  },

  // Success State
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successBookingNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
    textAlign: 'center',
    marginTop: 8,
  },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
  },
  successBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Error State
  errorContainerModal: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  errorIconWrap: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
  },
  errorActions: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkBookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  checkBookingsBtnText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },

  // Confirm Quote Card
  confirmQuoteCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  confirmVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmVendorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(9,179,104,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmVendorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  confirmVendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  confirmRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmRatingText: {
    fontSize: 13,
    color: '#f39c12',
    fontWeight: '600',
    marginLeft: 4,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  confirmDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  // Price Card
  confirmPriceCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  confirmPriceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confirmPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  advancePaymentHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    marginTop: 12,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 8,
  },
  advancePaymentText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
    flex: 1,
  },

  // Confirm Button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // View Details Button
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,179,104,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
  },
  viewDetailsBtnText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  // Quote Details Modal Styles
  detailsModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailsCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailsVendorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailsVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsVendorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(9,179,104,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsVendorInfo: {
    flex: 1,
  },
  detailsVendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsRatingText: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '600',
  },
  detailsQuoteNumber: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },

  // Tabs
  detailsTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailsTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsTabActive: {
    backgroundColor: GREEN,
  },
  detailsTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  detailsTabTextActive: {
    color: '#fff',
  },

  // Tab Content
  detailsTabContent: {
    marginBottom: 20,
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  // Vehicle Card
  detailsVehicleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailsVehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  detailsRegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  detailsRegNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  detailsInfoText: {
    fontSize: 14,
    color: '#666',
  },

  // Pricing Card
  detailsPricingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsPriceLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailsPriceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  detailsTotalRow: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  detailsTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  detailsTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },

  // Info Card
  detailsInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailsVendorMessage: {
    backgroundColor: 'rgba(9,179,104,0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  detailsMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailsMessageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  detailsMessageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // List Card (for Inclusions, Exclusions, Terms)
  detailsListCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailsListItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  detailsListItemLast: {
    borderBottomWidth: 0,
  },
  detailsListBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(9,179,104,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsExclusionBullet: {
    backgroundColor: 'rgba(231,76,60,0.15)',
  },
  detailsListText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  detailsTermsBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsTermsNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  detailsTermsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailsTermsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  detailsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  detailsEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },

  // Bottom Actions
  detailsActions: {
    padding: 16,
    paddingBottom: 20,
  },
  detailsAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  detailsAcceptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

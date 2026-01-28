import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import api from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

export default function BikeQuoteRequestDetailScreen() {
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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [requestId])
  );

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/bike-quote-requests/${requestId}`);
      if (response.data.success && response.data.request) {
        const requestData = response.data.request;
        setRequest(requestData);
        // Quotes are returned as a separate array in the API response
        setQuotes(response.data.quotes || []);

        // If quote already accepted and booking created, redirect to booking detail
        if (requestData.status === 'ACCEPTED' && requestData.bookingId) {
          // Replace current screen with booking detail to prevent going back
          navigation.replace('BikeBookingDetail', { bookingId: requestData.bookingId });
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

  // Show confirmation modal
  const handleAcceptQuote = (quote) => {
    setSelectedQuote(quote);
    setAcceptError(null);
    setAcceptSuccess(null);
    setConfirmModalVisible(true);
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

  // Confirm and process quote acceptance
  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    setAcceptingQuote(selectedQuote.id);
    setAcceptError(null);

    try {
      // Call the correct API endpoint
      const response = await api.post('/customer/accept-quote', {
        serviceType: 'bike',
        quoteRequestId: requestId,
        quoteId: selectedQuote.id,
      });

      if (response.data?.success) {
        // Validate response has required data
        if (!response.data.bookingId) {
          throw new Error('Booking was created but ID is missing. Please check your bookings.');
        }
        setAcceptSuccess({
          bookingId: response.data.bookingId,
          bookingNumber: response.data.bookingNumber || 'N/A',
        });
      } else {
        setAcceptError(response.data?.message || 'Failed to accept quote. Please try again.');
      }
    } catch (err) {
      console.log('Error accepting quote:', err);

      // Parse error message properly
      let errorMessage = 'Something went wrong. Please try again.';

      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.message ||
                      err.response.data?.error ||
                      `Server error (${err.response.status})`;
      } else if (err.request) {
        // Network error
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

    // Reset states first
    setConfirmModalVisible(false);
    const quoteData = selectedQuote; // Save quote data before resetting
    setSelectedQuote(null);
    setAcceptError(null);
    setAcceptSuccess(null);

    // Navigate after state reset
    if (successData && successData.bookingId) {
      // Navigate to Payment Screen with advance amount
      navigation.replace('PaymentScreen', {
        bookingId: successData.bookingId,
        bookingNumber: successData.bookingNumber,
        bookingType: 'bike',
        amount: quoteData?.advanceAmount || 0,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#f39c12';
      case 'QUOTES_RECEIVED':
        return '#3498db';
      case 'ACCEPTED':
        return GREEN;
      case 'EXPIRED':
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Awaiting Quotes';
      case 'QUOTES_RECEIVED':
        return 'Quotes Received';
      case 'ACCEPTED':
        return 'Quote Accepted';
      case 'EXPIRED':
        return 'Expired';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote Request</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
          <Text style={styles.errorText}>Request not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRequestDetails}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // quotes is now a separate state variable set from API response
  const hasQuotes = quotes.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote Request</Text>
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
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
          </View>
          <Text style={styles.requestNumber}>#{request.requestNumber}</Text>
          <Text style={styles.requestDate}>
            Requested on {formatDate(request.createdAt)}
          </Text>
        </View>

        {/* Vehicle Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle" size={22} color={GREEN} />
            <Text style={styles.cardTitle}>Vehicle Request</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleBrand}>{request.vehicleBrand || 'Any Brand'}</Text>
            <Text style={styles.vehicleName}>
              {request.vehicleModelName || request.vehicleCategoryName || 'Any Bike'}
            </Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={22} color={GREEN} />
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripItem}>
              <Text style={styles.tripLabel}>PICKUP</Text>
              <Text style={styles.tripValue}>{formatDate(request.pickupDate)}</Text>
              <Text style={styles.tripTime}>{request.pickupTime || '10:00 AM'}</Text>
            </View>
            <View style={styles.tripArrow}>
              <Ionicons name="arrow-forward" size={20} color="#ccc" />
            </View>
            <View style={styles.tripItem}>
              <Text style={styles.tripLabel}>DROP</Text>
              <Text style={styles.tripValue}>{formatDate(request.dropDate)}</Text>
              <Text style={styles.tripTime}>{request.dropTime || '10:00 AM'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={GREEN} />
            <Text style={styles.locationText}>{request.locationName}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={GREEN} />
            <Text style={styles.durationText}>
              {request.totalDays} Day{request.totalDays > 1 ? 's' : ''} Rental
            </Text>
          </View>
        </View>

        {/* Quotes Section */}
        <View style={styles.quotesSection}>
          <View style={styles.quotesHeader}>
            <Text style={styles.quotesTitle}>
              {hasQuotes ? `${quotes.length} Quote${quotes.length > 1 ? 's' : ''} Received` : 'Awaiting Quotes'}
            </Text>
            {!hasQuotes && (
              <Text style={styles.quotesSubtitle}>
                Vendors will send you quotes within 24-48 hours
              </Text>
            )}
          </View>

          {hasQuotes ? (
            <View style={styles.quotesList}>
              {quotes.map((quote, idx) => (
                <View key={quote.id} style={styles.quoteCard}>
                  {/* Best Deal Badge */}
                  {idx === 0 && (
                    <View style={styles.bestDealBadge}>
                      <Ionicons name="star" size={12} color="#fff" />
                      <Text style={styles.bestDealText}>Best Price</Text>
                    </View>
                  )}

                  {/* Vendor Info */}
                  <View style={styles.quoteVendor}>
                    <View style={styles.vendorAvatar}>
                      <Ionicons name="storefront" size={20} color={GREEN} />
                    </View>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>
                        {quote.vendor?.businessName || 'Vendor'}
                      </Text>
                      {quote.vendor?.rating && (
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#f39c12" />
                          <Text style={styles.ratingText}>{quote.vendor.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Vehicle Offered */}
                  <View style={styles.quoteVehicle}>
                    <Text style={styles.quoteVehicleName}>{quote.vehicleName}</Text>
                  </View>

                  {/* Price */}
                  <View style={styles.quotePricing}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Daily Rate</Text>
                      <Text style={styles.priceValue}>₹{quote.dailyRate}/day</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>
                        {request.totalDays} Day{request.totalDays > 1 ? 's' : ''} Total
                      </Text>
                      <Text style={styles.totalPrice}>₹{quote.grandTotal}</Text>
                    </View>
                    {quote.advanceAmount > 0 && (
                      <View style={[styles.priceRow, styles.advanceRow]}>
                        <Text style={styles.advanceLabel}>Advance Payment ({quote.advancePercent || 30}%)</Text>
                        <Text style={styles.advanceValue}>₹{quote.advanceAmount}</Text>
                      </View>
                    )}
                    {quote.securityDeposit > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Security Deposit</Text>
                        <Text style={styles.priceValue}>₹{quote.securityDeposit}</Text>
                      </View>
                    )}
                  </View>

                  {/* Valid Till */}
                  {quote.validTill && (
                    <Text style={styles.validTill}>
                      Valid till {formatDate(quote.validTill)}
                    </Text>
                  )}

                  {/* View Details Button */}
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => handleViewQuoteDetails(quote)}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={GREEN} />
                    <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={GREEN} />
                  </TouchableOpacity>

                  {/* Accept Button */}
                  {request.status !== 'ACCEPTED' && quote.status !== 'ACCEPTED' && (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptQuote(quote)}
                      disabled={acceptingQuote === quote.id}
                    >
                      {acceptingQuote === quote.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.acceptBtnText}>Accept & Book</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {quote.status === 'ACCEPTED' && (
                    <View style={styles.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                      <Text style={styles.acceptedText}>Accepted</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : request.status === 'QUOTES_RECEIVED' ? (
            <View style={styles.noQuotes}>
              <Ionicons name="time-outline" size={50} color="#e74c3c" />
              <Text style={styles.noQuotesText}>Quotes Expired or Withdrawn</Text>
              <Text style={styles.noQuotesSubtext}>
                The quotes you received have expired or been withdrawn by the vendors.
                Please submit a new request.
              </Text>
              <TouchableOpacity
                style={styles.newRequestBtn}
                onPress={() => navigation.navigate('BikeRentalScreen')}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.newRequestBtnText}>Submit New Request</Text>
              </TouchableOpacity>
            </View>
          ) : request.status === 'QUOTE_ACCEPTED' || request.status === 'BOOKING_CONFIRMED' ? (
            <View style={styles.noQuotes}>
              <Ionicons name="checkmark-circle" size={50} color={GREEN} />
              <Text style={styles.noQuotesText}>Quote Already Accepted</Text>
              <Text style={styles.noQuotesSubtext}>
                You have already accepted a quote for this request.
                Check your bookings for details.
              </Text>
              <TouchableOpacity
                style={styles.viewBookingsBtn}
                onPress={() => navigation.navigate('MyBikeBookings')}
              >
                <Ionicons name="list" size={20} color="#fff" />
                <Text style={styles.newRequestBtnText}>View Bookings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noQuotes}>
              <Ionicons name="hourglass-outline" size={50} color="#ddd" />
              <Text style={styles.noQuotesText}>Waiting for vendor quotes...</Text>
              <Text style={styles.noQuotesSubtext}>
                Pull down to refresh
              </Text>
            </View>
          )}
        </View>

        {/* Customer Notes */}
        {request.customerNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={22} color={GREEN} />
              <Text style={styles.cardTitle}>Your Notes</Text>
            </View>
            <Text style={styles.notesText}>{request.customerNotes}</Text>
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
                  Your booking has been created successfully. Please proceed to payment to confirm your booking.
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
                  <View style={styles.errorContainer}>
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
                          navigation.navigate('MyBikeBookings');
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
                          <Ionicons name="storefront" size={24} color={GREEN} />
                        </View>
                        <View style={styles.confirmVendorInfo}>
                          <Text style={styles.confirmVendorName}>
                            {selectedQuote.vendor?.businessName || 'Vendor'}
                          </Text>
                          {selectedQuote.vendor?.rating && (
                            <View style={styles.confirmRating}>
                              <Ionicons name="star" size={14} color="#f39c12" />
                              <Text style={styles.confirmRatingText}>
                                {selectedQuote.vendor.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.confirmVehicle}>
                        <Ionicons name="bicycle" size={20} color="#666" />
                        <Text style={styles.confirmVehicleName}>
                          {selectedQuote.vehicleName}
                        </Text>
                      </View>

                      <View style={styles.confirmPriceSection}>
                        <View style={styles.confirmPriceRow}>
                          <Text style={styles.confirmPriceLabel}>Daily Rate</Text>
                          <Text style={styles.confirmPriceValue}>
                            ₹{selectedQuote.dailyRate}/day
                          </Text>
                        </View>
                        <View style={styles.confirmPriceRow}>
                          <Text style={styles.confirmPriceLabel}>
                            {request?.totalDays || 1} Day{(request?.totalDays || 1) > 1 ? 's' : ''} Total
                          </Text>
                          <Text style={styles.confirmTotal}>₹{selectedQuote.grandTotal}</Text>
                        </View>
                        {selectedQuote.advanceAmount > 0 && (
                          <View style={styles.confirmAdvanceRow}>
                            <View style={styles.confirmAdvanceLabel}>
                              <Ionicons name="wallet-outline" size={16} color={GREEN} />
                              <Text style={styles.confirmAdvanceLabelText}>
                                Advance ({selectedQuote.advancePercent || 30}%)
                              </Text>
                            </View>
                            <Text style={styles.confirmAdvanceValue}>
                              ₹{selectedQuote.advanceAmount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.confirmNote}>
                      By accepting, you agree to pay the advance amount to confirm your booking.
                    </Text>

                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        style={styles.cancelModalBtn}
                        onPress={handleModalClose}
                        disabled={!!acceptingQuote}
                      >
                        <Text style={styles.cancelModalBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.confirmBtn,
                          !!acceptingQuote && styles.confirmBtnDisabled,
                        ]}
                        onPress={confirmAcceptQuote}
                        disabled={!!acceptingQuote}
                      >
                        {acceptingQuote ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.confirmBtnText}>Accept & Book</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Quote Details Modal */}
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
                    <Ionicons name="storefront" size={28} color={GREEN} />
                  </View>
                  <View style={styles.detailsVendorInfo}>
                    <Text style={styles.detailsVendorName}>
                      {viewingQuote.vendor?.businessName || 'Vendor'}
                    </Text>
                    {viewingQuote.vendor?.rating && (
                      <View style={styles.detailsRating}>
                        <Ionicons name="star" size={16} color="#f39c12" />
                        <Text style={styles.detailsRatingText}>
                          {viewingQuote.vendor.rating.toFixed(1)} Rating
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
                        <Ionicons name="bicycle" size={22} color={GREEN} />
                        <Text style={styles.detailsSectionTitle}>Vehicle Details</Text>
                      </View>
                      <View style={styles.detailsVehicleCard}>
                        <Text style={styles.detailsVehicleName}>{viewingQuote.vehicleName}</Text>
                        {viewingQuote.vehicleBrand && (
                          <Text style={styles.detailsVehicleBrand}>{viewingQuote.vehicleBrand}</Text>
                        )}
                        {viewingQuote.registrationNumber && (
                          <View style={styles.detailsRegRow}>
                            <Ionicons name="card-outline" size={16} color="#666" />
                            <Text style={styles.detailsRegNumber}>{viewingQuote.registrationNumber}</Text>
                          </View>
                        )}
                      </View>

                      {/* Vehicle Features */}
                      {(() => {
                        const features = parseListData(viewingQuote.vehicleFeatures);
                        return features.length > 0 && (
                          <View style={styles.detailsFeaturesContainer}>
                            <Text style={styles.detailsFeaturesTitle}>Features</Text>
                            <View style={styles.detailsFeaturesList}>
                              {features.map((feature, idx) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.detailsFeatureItem,
                                    idx === features.length - 1 && styles.detailsFeatureItemLast,
                                  ]}
                                >
                                  <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                                  <Text style={styles.detailsFeatureText}>{feature}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      })()}
                    </View>

                    {/* Pricing Details */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <Ionicons name="cash-outline" size={22} color={GREEN} />
                        <Text style={styles.detailsSectionTitle}>Pricing Breakdown</Text>
                      </View>
                      <View style={styles.detailsPricingCard}>
                        <View style={styles.detailsPriceRow}>
                          <Text style={styles.detailsPriceLabel}>Daily Rate</Text>
                          <Text style={styles.detailsPriceValue}>₹{viewingQuote.dailyRate}</Text>
                        </View>
                        <View style={styles.detailsPriceRow}>
                          <Text style={styles.detailsPriceLabel}>
                            Total ({request?.totalDays || 1} days)
                          </Text>
                          <Text style={styles.detailsPriceValue}>₹{viewingQuote.totalAmount}</Text>
                        </View>
                        {viewingQuote.gstAmount > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <Text style={styles.detailsPriceLabel}>GST</Text>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.gstAmount}</Text>
                          </View>
                        )}
                        <View style={[styles.detailsPriceRow, styles.detailsTotalRow]}>
                          <Text style={styles.detailsTotalLabel}>Grand Total</Text>
                          <Text style={styles.detailsTotalValue}>₹{viewingQuote.grandTotal}</Text>
                        </View>
                        {viewingQuote.advanceAmount > 0 && (
                          <View style={styles.detailsAdvanceCard}>
                            <View style={styles.detailsAdvanceHeader}>
                              <Ionicons name="wallet-outline" size={18} color={GREEN} />
                              <Text style={styles.detailsAdvanceLabel}>
                                Advance Payment ({viewingQuote.advancePercent || 30}%)
                              </Text>
                            </View>
                            <Text style={styles.detailsAdvanceAmount}>₹{viewingQuote.advanceAmount}</Text>
                          </View>
                        )}
                        {viewingQuote.securityDeposit > 0 && (
                          <View style={styles.detailsDepositRow}>
                            <View style={styles.detailsDepositLabel}>
                              <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
                              <Text style={styles.detailsDepositText}>Security Deposit (Refundable)</Text>
                            </View>
                            <Text style={styles.detailsDepositAmount}>₹{viewingQuote.securityDeposit}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Additional Info */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <Ionicons name="information-circle-outline" size={22} color={GREEN} />
                        <Text style={styles.detailsSectionTitle}>Additional Information</Text>
                      </View>
                      <View style={styles.detailsInfoCard}>
                        {viewingQuote.helmetsIncluded !== undefined && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons
                              name={viewingQuote.helmetsIncluded ? 'checkmark-circle' : 'close-circle'}
                              size={20}
                              color={viewingQuote.helmetsIncluded ? GREEN : '#e74c3c'}
                            />
                            <Text style={styles.detailsInfoText}>
                              Helmets {viewingQuote.helmetsIncluded ? 'Included' : 'Not Included'}
                            </Text>
                          </View>
                        )}
                        {viewingQuote.kmLimitPerDay && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="speedometer-outline" size={20} color="#666" />
                            <Text style={styles.detailsInfoText}>
                              {viewingQuote.kmLimitPerDay} KM per day limit
                            </Text>
                          </View>
                        )}
                        {viewingQuote.extraKmCharge && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="cash-outline" size={20} color="#666" />
                            <Text style={styles.detailsInfoText}>
                              ₹{viewingQuote.extraKmCharge} per extra KM
                            </Text>
                          </View>
                        )}
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
                      {viewingQuote.vendorMessage && (
                        <View style={styles.detailsVendorMessage}>
                          <View style={styles.detailsMessageHeader}>
                            <Ionicons name="chatbox-outline" size={18} color={GREEN} />
                            <Text style={styles.detailsMessageTitle}>Message from Vendor</Text>
                          </View>
                          <Text style={styles.detailsMessageText}>
                            {typeof viewingQuote.vendorMessage === 'string'
                              ? viewingQuote.vendorMessage
                              : JSON.stringify(viewingQuote.vendorMessage)}
                          </Text>
                        </View>
                      )}
                    </View>
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
                      const terms = parseListData(viewingQuote.termsConditions);

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
                      if (terms.length === 1 || viewingQuote.termsConditions) {
                        return (
                          <View style={styles.detailsTermsCard}>
                            <Text style={styles.detailsTermsText}>
                              {terms.length === 1 ? terms[0] : viewingQuote.termsConditions}
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
                      setTimeout(() => handleAcceptQuote(viewingQuote), 300);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.detailsAcceptBtnText}>Accept & Book This Quote</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 40 }} />
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
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
  requestNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  requestDate: {
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },

  // Vehicle
  vehicleInfo: {},
  vehicleBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },

  // Trip
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tripItem: {
    flex: 1,
  },
  tripLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  tripTime: {
    fontSize: 12,
    color: '#666',
  },
  tripArrow: {
    paddingHorizontal: 10,
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

  // Quotes Section
  quotesSection: {
    marginBottom: 16,
  },
  quotesHeader: {
    marginBottom: 12,
  },
  quotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  quotesSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  quotesList: {},
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  bestDealBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestDealText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Vendor
  quoteVendor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    marginLeft: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: '#f39c12',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Quote Vehicle
  quoteVehicle: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  quoteVehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  // Quote Pricing
  quotePricing: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  advanceLabel: {
    fontSize: 13,
    color: '#999',
  },
  advanceValue: {
    fontSize: 13,
    color: '#666',
  },
  validTill: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  // Accept Button
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  acceptedText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
  },

  // No Quotes
  noQuotes: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  noQuotesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  noQuotesSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  newRequestBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewBookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  advanceRow: {
    backgroundColor: 'rgba(9,179,104,0.08)',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: 8,
  },

  // Notes
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // ========== Confirmation Modal Styles ==========
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
  },
  successBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Error State
  errorContainer: {
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
    marginRight: 6,
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
    marginLeft: 6,
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
  confirmVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  confirmVehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  confirmPriceSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
  },
  confirmPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confirmPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  confirmPriceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  confirmTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  confirmAdvanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    marginTop: 8,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  confirmAdvanceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmAdvanceLabelText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
  },
  confirmAdvanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  confirmNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
  },
  cancelModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 6,
  },
  cancelModalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 6,
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
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(9,179,104,0.2)',
  },
  viewDetailsBtnText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 6,
  },

  // ========== Quote Details Modal Styles ==========
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
  },

  // Vendor Card
  detailsVendorCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsVendorInfo: {
    marginLeft: 14,
    flex: 1,
  },
  detailsVendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailsRatingText: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsQuoteNumber: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  // Tabs
  detailsTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailsTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  detailsTabActive: {
    borderBottomColor: GREEN,
  },
  detailsTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  detailsTabTextActive: {
    color: GREEN,
  },

  // Tab Content
  detailsTabContent: {
    padding: 16,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },

  // Vehicle Card
  detailsVehicleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  detailsVehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  detailsVehicleBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailsRegNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },

  // Features
  detailsFeaturesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  detailsFeaturesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
  },
  detailsFeaturesList: {},
  detailsFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  detailsFeatureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    paddingTop: 1,
  },
  detailsFeatureItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  // Pricing Card
  detailsPricingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  detailsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailsPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailsPriceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  detailsTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  detailsTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
  },
  detailsAdvanceCard: {
    backgroundColor: 'rgba(9,179,104,0.08)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailsAdvanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailsAdvanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
    marginLeft: 6,
  },
  detailsAdvanceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  detailsDepositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
  },
  detailsDepositLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsDepositText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  detailsDepositAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },

  // Info Card
  detailsInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },

  // Vendor Message
  detailsVendorMessage: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  detailsMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsMessageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 8,
  },
  detailsMessageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  // List Card (Inclusions/Exclusions)
  detailsListCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  detailsListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailsListBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  detailsExclusionBullet: {
    backgroundColor: 'rgba(231,76,60,0.1)',
  },
  detailsListText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
    paddingTop: 3,
  },
  detailsListItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  // Terms Card
  detailsTermsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  detailsTermsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  detailsTermsBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsTermsNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },

  // Empty State
  detailsEmptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 14,
    alignItems: 'center',
  },
  detailsEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },

  // Bottom Actions
  detailsActions: {
    padding: 16,
  },
  detailsAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsAcceptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

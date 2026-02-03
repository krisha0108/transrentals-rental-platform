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

export default function BusQuoteRequestDetailScreen() {
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

  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [requestId])
  );

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/bus-quote-requests/${requestId}`);
      console.log('📦 Bus Quote Request Response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        // API returns 'quoteRequest' not 'request'
        const requestData = response.data.quoteRequest || response.data.request;

        if (requestData) {
          setRequest(requestData);
          setQuotes(requestData.quotes || response.data.quotes || []);

          // If quote already accepted and booking created, redirect to booking detail
          if (requestData.status === 'QUOTE_ACCEPTED' && requestData.bookingId) {
            navigation.replace('BusBookingDetail', { bookingId: requestData.bookingId });
          }
        } else {
          console.log('❌ No request data in response');
          Alert.alert('Error', 'No data found for this request');
        }
      } else {
        console.log('❌ API returned success=false:', response.data);
        Alert.alert('Error', response.data.error || 'Failed to load request details');
      }
    } catch (err) {
      console.log('❌ Error fetching request:', err);
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

  // Confirm and process quote acceptance
  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    setAcceptingQuote(selectedQuote.id);
    setAcceptError(null);

    try {
      const response = await api.post('/customer/accept-quote', {
        serviceType: 'bus',
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

    // Reset states first
    setConfirmModalVisible(false);
    const quoteData = selectedQuote; // Save quote data before resetting
    setSelectedQuote(null);
    setAcceptError(null);
    setAcceptSuccess(null);

    // Navigate after state reset
    if (successData && successData.bookingId) {
      // Navigate to Payment Screen with advance amount (not total amount)
      const advanceAmount = quoteData?.advanceAmount ||
                           (quoteData?.totalAmount * (quoteData?.advancePercent || 30) / 100) ||
                           0;

      navigation.replace('PaymentScreen', {
        bookingId: successData.bookingId,
        bookingNumber: successData.bookingNumber,
        bookingType: 'bus',
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
              'Your quote request is being sent to verified bus rental vendors. You will receive quotes within 24-48 hours.'}
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
                          {quote.vendor.rating.toFixed(1)} ({quote.vendor.totalReviews || 0} reviews)
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
          <View style={styles.noQuotesContainer}>
            <View style={styles.noQuotesIconCircle}>
              <Ionicons name="receipt-outline" size={60} color={GREEN} />
            </View>
            <Text style={styles.noQuotesTitle}>No Quotations Yet</Text>
            <Text style={styles.noQuotesMessage}>
              Your request has been sent to vendors. They will review and send you competitive quotes soon.
            </Text>
            <View style={styles.noQuotesInfoBox}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.noQuotesInfoText}>
                Usually within 24-48 hours
              </Text>
            </View>
            <Text style={styles.noQuotesPullRefresh}>Pull down to refresh</Text>
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
                  Your bus booking has been created successfully. Please proceed to payment to confirm your booking.
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
                          navigation.navigate('BusBookingsScreen');
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
                          <Ionicons name="bus" size={24} color={GREEN} />
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

                      {selectedQuote.vehicleName && (
                        <View style={styles.confirmVehicle}>
                          <Ionicons name="bus-outline" size={20} color="#666" />
                          <Text style={styles.confirmVehicleName}>
                            {selectedQuote.vehicleName}
                          </Text>
                        </View>
                      )}

                      <View style={styles.confirmPriceSection}>
                        <View style={styles.confirmPriceRow}>
                          <Text style={styles.confirmPriceLabel}>Total Amount</Text>
                          <Text style={styles.confirmPriceValue}>₹{selectedQuote.totalAmount?.toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Advance Payment - Highlighted */}
                        {(selectedQuote.advanceAmount > 0 || selectedQuote.advancePercent > 0) && (
                          <View style={styles.confirmAdvanceRow}>
                            <View style={styles.confirmAdvanceLabel}>
                              <Ionicons name="wallet-outline" size={16} color={GREEN} />
                              <Text style={styles.confirmAdvanceLabelText}>
                                Advance Payment ({selectedQuote.advancePercent || 30}%)
                              </Text>
                            </View>
                            <Text style={styles.confirmAdvanceValue}>
                              ₹{(selectedQuote.advanceAmount ||
                                 (selectedQuote.totalAmount * (selectedQuote.advancePercent || 30) / 100))?.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        )}

                        {selectedQuote.inclusions && (
                          <View style={styles.inclusionsBox}>
                            <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                            <Text style={styles.inclusionsText}>{selectedQuote.inclusions}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.confirmNote}>
                      By accepting, you agree to pay the advance amount to confirm your booking. Remaining balance will be paid later.
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
  noQuotesContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginVertical: 10,
  },
  noQuotesIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F9F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noQuotesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 10,
    marginBottom: 12,
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
  confirmVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
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
    gap: 6,
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
  inclusionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  inclusionsText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
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
    gap: 12,
  },
  cancelModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 12,
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
});

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

export default function SelfDriveQuoteRequestDetailScreen() {
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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [requestId])
  );

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/self-drive-quote-requests/${requestId}`);
      if (response.data.success && response.data.request) {
        const requestData = response.data.request;
        setRequest(requestData);
        setQuotes(response.data.quotes || []);

        // If quote already accepted and booking created, redirect to booking detail
        if (requestData.status === 'ACCEPTED' && requestData.bookingId) {
          navigation.replace('SelfDriveBookingDetail', { bookingId: requestData.bookingId });
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

  // Confirm and process quote acceptance
  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    setAcceptingQuote(selectedQuote.id);
    setAcceptError(null);

    try {
      const response = await api.post('/customer/accept-quote', {
        serviceType: 'self-drive',
        quoteRequestId: requestId,
        quoteId: selectedQuote.id,
      });

      if (response.data?.success) {
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
      // Navigate to Payment Screen with advance amount
      navigation.replace('PaymentScreen', {
        bookingId: successData.bookingId,
        bookingNumber: successData.bookingNumber,
        bookingType: 'self-drive',
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
            <Ionicons name="car-sport" size={22} color={GREEN} />
            <Text style={styles.cardTitle}>Vehicle Request</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleBrand}>{request.vehicleBrand || 'Any Brand'}</Text>
            <Text style={styles.vehicleName}>
              {request.vehicleModelName || request.vehicleCategoryName || 'Any Car'}
            </Text>
          </View>
          <View style={styles.specsRow}>
            {request.transmission && (
              <View style={styles.specBadge}>
                <Ionicons name="cog" size={14} color={GREEN} />
                <Text style={styles.specBadgeText}>{request.transmission}</Text>
              </View>
            )}
            {request.fuelType && (
              <View style={styles.specBadge}>
                <Ionicons name="water" size={14} color={GREEN} />
                <Text style={styles.specBadgeText}>{request.fuelType}</Text>
              </View>
            )}
            {request.minSeats && (
              <View style={styles.specBadge}>
                <Ionicons name="people" size={14} color={GREEN} />
                <Text style={styles.specBadgeText}>{request.minSeats} Seats</Text>
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
                    <Ionicons name="car-sport" size={18} color="#666" />
                    <Text style={styles.quoteVehicleName}>{quote.vehicleName}</Text>
                    {quote.transmission && (
                      <Text style={styles.quoteVehicleSpec}> | {quote.transmission}</Text>
                    )}
                  </View>

                  {/* Price */}
                  <View style={styles.quotePricing}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Daily Rate</Text>
                      <Text style={styles.priceValue}>₹{quote.dailyRate}/day</Text>
                    </View>
                    {quote.kmLimitPerDay && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>KM Limit</Text>
                        <Text style={styles.priceValue}>{quote.kmLimitPerDay} km/day</Text>
                      </View>
                    )}
                    {quote.extraKmRate && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Extra KM</Text>
                        <Text style={styles.priceValue}>₹{quote.extraKmRate}/km</Text>
                      </View>
                    )}
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
                onPress={() => navigation.navigate('SelfDriveScreen')}
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
                onPress={() => navigation.navigate('MySelfDriveBookings')}
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
                <Text style={styles.modalTitle}>Booking Created!</Text>
                <Text style={styles.successBookingNumber}>
                  #{acceptSuccess.bookingNumber}
                </Text>
                <Text style={styles.modalMessage}>
                  Your booking has been created successfully. Pay advance to confirm your booking.
                </Text>
                <TouchableOpacity
                  style={styles.successBtn}
                  onPress={handleModalClose}
                >
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
                  <View style={styles.errorDisplayContainer}>
                    <View style={styles.errorIconWrap}>
                      <Ionicons name="alert-circle" size={50} color="#e74c3c" />
                    </View>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorMessage}>{acceptError}</Text>
                    <View style={styles.errorActions}>
                      <TouchableOpacity
                        style={styles.retryBtnModal}
                        onPress={confirmAcceptQuote}
                        disabled={!!acceptingQuote}
                      >
                        {acceptingQuote ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="refresh" size={18} color="#fff" />
                            <Text style={styles.retryBtnTextModal}>Try Again</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.checkBookingsBtn}
                        onPress={() => {
                          setConfirmModalVisible(false);
                          navigation.navigate('MySelfDriveBookings');
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
                        <Ionicons name="car-sport" size={20} color="#666" />
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
  vehicleInfo: {
    marginBottom: 12,
  },
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
    gap: 4,
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
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#f39c12',
    fontWeight: '600',
  },

  // Quote Vehicle
  quoteVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  quoteVehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  quoteVehicleSpec: {
    fontSize: 13,
    color: '#666',
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
  advanceRow: {
    backgroundColor: 'rgba(9,179,104,0.08)',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: 8,
  },
  advanceLabel: {
    fontSize: 13,
    color: GREEN,
    fontWeight: '500',
  },
  advanceValue: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
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
    gap: 8,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
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
    gap: 8,
  },
  newRequestBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    gap: 8,
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
    gap: 8,
  },
  successBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Error State
  errorDisplayContainer: {
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
  retryBtnModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    gap: 6,
  },
  retryBtnTextModal: {
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
    gap: 6,
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
    gap: 4,
  },
  confirmRatingText: {
    fontSize: 13,
    color: '#f39c12',
    fontWeight: '600',
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

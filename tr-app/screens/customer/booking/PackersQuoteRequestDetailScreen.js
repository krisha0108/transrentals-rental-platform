import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, Modal, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const STATUS_CONFIG = {
  PENDING: { label: 'Awaiting Quotes', color: '#F59E0B', icon: 'time-outline' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: '#3B82F6', icon: 'mail-outline' },
  ACCEPTED: { label: 'Quote Accepted', color: '#10B981', icon: 'checkmark-circle' },
  EXPIRED: { label: 'Expired', color: '#EF4444', icon: 'close-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', icon: 'close-circle' },
};

export default function PackersQuoteRequestDetailScreen() {
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
  const [detailsTab, setDetailsTab] = useState('overview'); // overview, charges, terms

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(TEAL_DEEP, true);
      return () => {
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') StatusBar.setBackgroundColor('#FFFFFF', true);
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [requestId])
  );

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/packers-quote-requests/${requestId}`);
      if (response.data.success && response.data.quoteRequest) {
        const requestData = response.data.quoteRequest;
        setRequest(requestData);
        setQuotes(requestData.quotes || []);

        // If quote already accepted and booking created, redirect to booking detail
        if (requestData.status === 'ACCEPTED' && requestData.bookingId) {
          navigation.replace('PackersBookingDetail', { bookingId: requestData.bookingId });
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
      const response = await api.patch(`/packers-quote-requests/${requestId}`, {
        action: 'accept_quote',
        quoteId: selectedQuote.id,
      });

      if (response.data?.success && response.data?.booking) {
        setAcceptSuccess({
          bookingId: response.data.booking.id,
          bookingNumber: response.data.booking.bookingNumber,
          advanceAmount: response.data.booking.advanceAmount,
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
      navigation.replace('PaymentScreen', {
        bookingId: successData.bookingId,
        bookingNumber: successData.bookingNumber,
        bookingType: 'packers',
        amount: successData.advanceAmount || Math.round((quoteData?.totalAmount || 0) * 0.3),
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

  // Parse list data (handles JSON array, comma-separated, newline-separated)
  const parseListData = (data) => {
    if (!data) return [];

    try {
      // Try parsing as JSON array
      if (typeof data === 'string' && (data.startsWith('[') || data.startsWith('{'))) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (typeof parsed === 'object') return Object.values(parsed).filter(Boolean);
      }
    } catch (e) {
      // Not JSON, continue to other parsing methods
    }

    // If already an array, return it
    if (Array.isArray(data)) return data.filter(Boolean);

    // Try splitting by newlines, commas, or bullet points
    if (typeof data === 'string') {
      // Remove common bullet characters and split
      const cleaned = data
        .replace(/^[\s•\-\*\+➤►→]+/gm, '') // Remove bullet points at start of lines
        .trim();

      // Split by newlines first (most common)
      if (cleaned.includes('\n')) {
        return cleaned.split('\n').map(s => s.trim()).filter(Boolean);
      }

      // Split by commas if multiple commas present
      if (cleaned.split(',').length > 1) {
        return cleaned.split(',').map(s => s.trim()).filter(Boolean);
      }

      // If single item, return as array
      return [cleaned];
    }

    return [];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Quote Request</Text>
            </View>
            <View style={{ width: wp('10%') }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading quote request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Quote Request</Text>
            </View>
            <View style={{ width: wp('10%') }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={48} color={TEAL} />
          </View>
          <Text style={styles.errorTitle}>Quote request not found</Text>
          <Text style={styles.errorSubText}>The request may have been removed or is unavailable.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quote Request</Text>
            <Text style={styles.headerSub}>Packers & Movers · #{request.requestNumber}</Text>
          </View>
          <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.glassCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.glassLabel}>STATUS</Text>
              <Text style={styles.glassValue}>{statusConfig.label}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.color }]}>
              <Ionicons name={statusConfig.icon} size={14} color="#FFF" />
              <Text style={styles.statusPillText}>{statusConfig.label}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaChipText}>{formatDate(request.pickupDate)}</Text>
            </View>
            {request.pickupTime && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaChipText}>{request.pickupTime}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
      >
        {/* Status Message */}
        <View style={styles.statusMessageCard}>
          <Ionicons
            name={request.status === 'PENDING' ? 'information-circle' : request.status === 'QUOTES_RECEIVED' ? 'mail' : request.status === 'ACCEPTED' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={statusConfig.color}
          />
          <Text style={styles.statusMessage}>
            {request.status === 'PENDING' &&
              'Your quote request is being sent to verified packers & movers vendors. You will receive quotes within 24-48 hours.'}
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
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="map-outline" size={18} color={TEAL_MID} />
            </View>
            <Text style={styles.cardTitle}>Trip Details</Text>
          </View>

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
              <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{request.pickupCity || request.pickupAddress}</Text>
              </View>
            </View>
            {request.dropCity && (
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
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

          {request.tripDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Duration</Text>
              <Text style={styles.detailValue}>{request.tripDays} day{request.tripDays > 1 ? 's' : ''}</Text>
            </View>
          )}

          {request.requirements && (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Special Requirements</Text>
              <Text style={styles.detailValue}>{request.requirements}</Text>
            </View>
          )}
        </View>

        {/* Quotes Received */}
        {quotes.length > 0 ? (
          <View style={styles.quotesSection}>
            <View style={styles.quotesSectionHeader}>
              <View style={styles.cardIconCircle}>
                <Ionicons name="document-text-outline" size={18} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>
                Quotes Received ({quotes.length})
              </Text>
            </View>

            {quotes.map((quote) => (
              <View key={quote.id} style={styles.quoteCard}>
                <View style={styles.quoteHeader}>
                  <View style={styles.vendorAvatarCircle}>
                    <Ionicons name="cube" size={22} color={TEAL_MID} />
                  </View>
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.vendorName}>{quote.vendors?.businessName || 'Vendor'}</Text>
                    {quote.vendors?.rating > 0 && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {quote.vendors.rating.toFixed(1)} ({quote.vendors.totalReviews || 0} reviews)
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
                      <Ionicons name="bus-outline" size={16} color={TEXT_SECONDARY} />
                      <Text style={styles.quoteDetailText}>{quote.vehicleName}</Text>
                    </View>
                  )}
                  {quote.inclusions && (
                    <View style={styles.quoteDetailRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={TEAL} />
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

                {/* View Details Button */}
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => handleViewQuoteDetails(quote)}
                >
                  <Ionicons name="information-circle-outline" size={18} color={TEAL_MID} />
                  <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={TEAL_MID} />
                </TouchableOpacity>

                {quote.status === 'SENT' || quote.status === 'VIEWED' ? (
                  <TouchableOpacity
                    style={[styles.acceptBtn, acceptingQuote === quote.id && styles.acceptBtnDisabled]}
                    onPress={() => handleAcceptQuote(quote)}
                    disabled={acceptingQuote === quote.id}
                  >
                    <LinearGradient
                      colors={acceptingQuote === quote.id ? ['#9CA3AF', '#9CA3AF'] : [TEAL_MID, '#047857']}
                      style={styles.acceptBtnGrad}
                    >
                      {acceptingQuote === quote.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.acceptBtnText}>Accept Quote</Text>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : quote.status === 'ACCEPTED' ? (
                  <View style={styles.acceptedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={TEAL_MID} />
                    <Text style={styles.acceptedText}>Accepted</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noQuotesContainer}>
            <View style={styles.noQuotesIconCircle}>
              <Ionicons name="receipt-outline" size={wp('12%')} color={TEAL} />
            </View>
            <Text style={styles.noQuotesTitle}>No Quotations Yet</Text>
            <Text style={styles.noQuotesMessage}>
              Your request has been sent to vendors. They will review and send you competitive quotes soon.
            </Text>
            <View style={styles.noQuotesInfoBox}>
              <Ionicons name="time-outline" size={20} color={TEXT_SECONDARY} />
              <Text style={styles.noQuotesInfoText}>
                Usually within 24-48 hours
              </Text>
            </View>
            <Text style={styles.noQuotesPullRefresh}>Pull down to refresh</Text>
          </View>
        )}

        <View style={{ height: hp('5%') }} />
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
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark-circle" size={wp('14%')} color={TEAL} />
                  </View>
                </View>
                <Text style={styles.modalTitle}>Booking Confirmed!</Text>
                <Text style={styles.successBookingNumber}>
                  #{acceptSuccess.bookingNumber}
                </Text>
                <Text style={styles.modalMessage}>
                  Your packers & movers booking has been created successfully. Please proceed to payment to confirm your booking.
                </Text>
                <TouchableOpacity style={styles.successBtn} onPress={handleModalClose}>
                  <LinearGradient colors={[TEAL_MID, '#047857']} style={styles.successBtnGrad}>
                    <Ionicons name="wallet-outline" size={20} color="#fff" />
                    <Text style={styles.successBtnText}>Proceed to Payment</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
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
                    <Ionicons name="close" size={22} color={TEXT_SECONDARY} />
                  </TouchableOpacity>
                </View>

                {/* Error Display */}
                {acceptError && (
                  <View style={styles.errorContainerModal}>
                    <View style={styles.errorIconWrap}>
                      <Ionicons name="alert-circle" size={wp('12%')} color="#EF4444" />
                    </View>
                    <Text style={styles.errorModalTitle}>Something went wrong</Text>
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
                          navigation.navigate('PackersBookingsScreen');
                        }}
                      >
                        <Ionicons name="list" size={18} color={TEAL_MID} />
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
                          <Ionicons name="cube" size={wp('5.5%')} color={TEAL_MID} />
                        </View>
                        <View style={styles.confirmVendorInfo}>
                          <Text style={styles.confirmVendorName}>
                            {selectedQuote.vendors?.businessName || 'Vendor'}
                          </Text>
                          {selectedQuote.vendors?.rating > 0 && (
                            <View style={styles.confirmRating}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.confirmRatingText}>
                                {selectedQuote.vendors.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {selectedQuote.vehicleName && (
                        <View style={styles.confirmDetailRow}>
                          <Ionicons name="car-outline" size={16} color={TEXT_SECONDARY} />
                          <Text style={styles.confirmDetailText}>{selectedQuote.vehicleName}</Text>
                        </View>
                      )}

                      {selectedQuote.inclusions && (
                        <View style={styles.confirmDetailRow}>
                          <Ionicons name="checkmark-circle-outline" size={16} color={TEAL} />
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
                        <Ionicons name="wallet-outline" size={18} color={TEAL_MID} />
                        <Text style={styles.advancePaymentText}>
                          Pay ₹{(selectedQuote.advanceAmount || Math.round(selectedQuote.totalAmount * 0.3))?.toLocaleString('en-IN')} advance to confirm
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.confirmBtn, acceptingQuote && styles.confirmBtnDisabled]}
                      onPress={confirmAcceptQuote}
                      disabled={!!acceptingQuote}
                    >
                      <LinearGradient
                        colors={acceptingQuote ? ['#9CA3AF', '#9CA3AF'] : [TEAL_MID, '#047857']}
                        style={styles.confirmBtnGrad}
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
                      </LinearGradient>
                    </TouchableOpacity>
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
        <SafeAreaView style={styles.detailsModalContainer} edges={['bottom']}>
          {/* Header */}
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.detailsHeaderGrad}>
            <View style={[styles.decoCircle, { top: -20, right: -15, width: 70, height: 70 }]} pointerEvents="none" />
            <View style={[styles.decoCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} pointerEvents="none" />
            <View style={styles.detailsHeaderRow}>
              <TouchableOpacity onPress={handleCloseQuoteDetails} style={styles.detailsCloseBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.detailsHeaderTitle}>Quote Details</Text>
              <View style={{ width: wp('10%') }} />
            </View>
          </LinearGradient>

          {viewingQuote && (
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              {/* Vendor Header */}
              <View style={styles.detailsVendorCard}>
                <View style={styles.detailsVendorRow}>
                  <View style={styles.detailsVendorAvatar}>
                    <Ionicons name="cube" size={wp('6%')} color={TEAL_MID} />
                  </View>
                  <View style={styles.detailsVendorInfo}>
                    <Text style={styles.detailsVendorName}>
                      {viewingQuote.vendors?.businessName || 'Vendor'}
                    </Text>
                    {viewingQuote.vendors?.rating > 0 && (
                      <View style={styles.detailsRating}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.detailsRatingText}>
                          {viewingQuote.vendors.rating.toFixed(1)} Rating
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
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
                  style={[styles.detailsTab, detailsTab === 'charges' && styles.detailsTabActive]}
                  onPress={() => setDetailsTab('charges')}
                >
                  <Text style={[styles.detailsTabText, detailsTab === 'charges' && styles.detailsTabTextActive]}>
                    Charges
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
                    {/* Service Info */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <View style={styles.sectionIconCircle}>
                          <Ionicons name="cube-outline" size={18} color={TEAL_MID} />
                        </View>
                        <Text style={styles.detailsSectionTitle}>Service Details</Text>
                      </View>
                      <View style={styles.detailsInfoCard}>
                        {viewingQuote.vehicleName && (
                          <View style={styles.detailsInfoRow}>
                            <Text style={styles.detailsInfoLabel}>Vehicle Type</Text>
                            <Text style={styles.detailsInfoValue}>{viewingQuote.vehicleName}</Text>
                          </View>
                        )}
                        {viewingQuote.teamSize > 0 && (
                          <View style={styles.detailsInfoRow}>
                            <Text style={styles.detailsInfoLabel}>Team Size</Text>
                            <Text style={styles.detailsInfoValue}>{viewingQuote.teamSize} members</Text>
                          </View>
                        )}
                        {viewingQuote.estimatedTime && (
                          <View style={styles.detailsInfoRow}>
                            <Text style={styles.detailsInfoLabel}>Estimated Time</Text>
                            <Text style={styles.detailsInfoValue}>{viewingQuote.estimatedTime}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Inclusions */}
                    {viewingQuote.inclusions && (() => {
                      const inclusions = parseListData(viewingQuote.inclusions);
                      return inclusions.length > 0 && (
                        <View style={styles.detailsSection}>
                          <View style={styles.detailsSectionHeader}>
                            <View style={[styles.sectionIconCircle, { backgroundColor: TEAL_LIGHT }]}>
                              <Ionicons name="checkmark-circle" size={18} color={TEAL_MID} />
                            </View>
                            <Text style={styles.detailsSectionTitle}>What's Included</Text>
                          </View>
                          <View style={styles.detailsListContainer}>
                            {inclusions.map((item, idx) => (
                              <View key={idx} style={styles.detailsListItem}>
                                <View style={styles.detailsCheckIcon}>
                                  <Ionicons name="checkmark" size={14} color="#fff" />
                                </View>
                                <Text style={styles.detailsListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Exclusions */}
                    {viewingQuote.exclusions && (() => {
                      const exclusions = parseListData(viewingQuote.exclusions);
                      return exclusions.length > 0 && (
                        <View style={styles.detailsSection}>
                          <View style={styles.detailsSectionHeader}>
                            <View style={[styles.sectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                              <Ionicons name="close-circle" size={18} color="#EF4444" />
                            </View>
                            <Text style={styles.detailsSectionTitle}>What's Excluded</Text>
                          </View>
                          <View style={styles.detailsListContainer}>
                            {exclusions.map((item, idx) => (
                              <View key={idx} style={styles.detailsListItem}>
                                <View style={styles.detailsCloseIcon}>
                                  <Ionicons name="close" size={14} color="#fff" />
                                </View>
                                <Text style={styles.detailsListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Valid Till */}
                    {viewingQuote.validTill && (
                      <View style={styles.detailsValidCard}>
                        <Ionicons name="time-outline" size={20} color="#F59E0B" />
                        <Text style={styles.detailsValidText}>
                          Valid until {formatDate(viewingQuote.validTill)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Charges Tab */}
                {detailsTab === 'charges' && (
                  <View>
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <View style={styles.sectionIconCircle}>
                          <Ionicons name="cash-outline" size={18} color={TEAL_MID} />
                        </View>
                        <Text style={styles.detailsSectionTitle}>Detailed Charges</Text>
                      </View>
                      <View style={styles.detailsPricingCard}>
                        {viewingQuote.packingCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="cube-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Packing Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.packingCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.loadingCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="arrow-up-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Loading Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.loadingCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.transportCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="car-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Transport Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.transportCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.unloadingCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="arrow-down-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Unloading Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.unloadingCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.unpackingCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="expand-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Unpacking Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.unpackingCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.storageCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="file-tray-stacked-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Storage Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.storageCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.insuranceCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="shield-checkmark-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Insurance Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.insuranceCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.materialCharges > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="layers-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>Material Charges</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.materialCharges?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {viewingQuote.gstAmount > 0 && (
                          <View style={styles.detailsPriceRow}>
                            <View style={styles.detailsPriceLeft}>
                              <Ionicons name="receipt-outline" size={16} color={TEXT_SECONDARY} />
                              <Text style={styles.detailsPriceLabel}>GST (18%)</Text>
                            </View>
                            <Text style={styles.detailsPriceValue}>₹{viewingQuote.gstAmount?.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        <View style={[styles.detailsPriceRow, styles.detailsTotalRow]}>
                          <View style={styles.detailsPriceLeft}>
                            <Ionicons name="calculator-outline" size={18} color={TEAL_MID} />
                            <Text style={styles.detailsTotalLabel}>Total Amount</Text>
                          </View>
                          <Text style={styles.detailsTotalValue}>₹{viewingQuote.totalAmount?.toLocaleString('en-IN')}</Text>
                        </View>
                      </View>

                      {/* Advance Payment Info */}
                      <View style={styles.detailsAdvanceCard}>
                        <View style={styles.detailsAdvanceHeader}>
                          <Ionicons name="wallet-outline" size={20} color={TEAL_MID} />
                          <Text style={styles.detailsAdvanceLabel}>Advance Payment (30%)</Text>
                        </View>
                        <Text style={styles.detailsAdvanceValue}>
                          ₹{(viewingQuote.advanceAmount || Math.round(viewingQuote.totalAmount * 0.3))?.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.detailsAdvanceNote}>
                          Pay 30% advance to confirm your booking. Balance amount payable after service completion.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Terms Tab */}
                {detailsTab === 'terms' && (
                  <View>
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <View style={[styles.sectionIconCircle, { backgroundColor: '#DBEAFE' }]}>
                          <Ionicons name="document-text" size={18} color="#3B82F6" />
                        </View>
                        <Text style={styles.detailsSectionTitle}>Terms & Conditions</Text>
                      </View>
                      {(() => {
                        const terms = viewingQuote.termsAndConditions
                          ? parseListData(viewingQuote.termsAndConditions)
                          : [
                              'Payment: 30% advance at booking, balance after service completion',
                              'Cancellation: Free cancellation up to 24 hours before service',
                              'Insurance: Basic transit insurance included',
                              'Liability: Vendor responsible for any damage during packing/moving',
                              'Extra charges may apply for heavy items or difficult access'
                            ];

                        return (
                          <View style={styles.detailsListContainer}>
                            {terms.map((item, idx) => (
                              <View key={idx} style={styles.detailsListItem}>
                                <View style={styles.detailsInfoIcon}>
                                  <Ionicons name="information" size={14} color="#fff" />
                                </View>
                                <Text style={styles.detailsListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      })()}
                    </View>

                    {viewingQuote.notes && (() => {
                      const notes = parseListData(viewingQuote.notes);
                      return (
                        <View style={styles.detailsSection}>
                          <View style={styles.detailsSectionHeader}>
                            <View style={[styles.sectionIconCircle, { backgroundColor: '#EDE9FE' }]}>
                              <Ionicons name="chatbox" size={18} color="#8B5CF6" />
                            </View>
                            <Text style={styles.detailsSectionTitle}>Vendor Notes</Text>
                          </View>
                          <View style={styles.detailsListContainer}>
                            {notes.map((item, idx) => (
                              <View key={idx} style={styles.detailsListItem}>
                                <View style={styles.detailsNoteIcon}>
                                  <Ionicons name="chatbox-ellipses" size={14} color="#fff" />
                                </View>
                                <Text style={styles.detailsListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>

              {/* Accept Button at Bottom */}
              {(viewingQuote.status === 'SENT' || viewingQuote.status === 'VIEWED') && (
                <View style={styles.detailsFooter}>
                  <TouchableOpacity
                    style={styles.detailsAcceptBtn}
                    onPress={() => {
                      handleCloseQuoteDetails();
                      setTimeout(() => handleAcceptQuote(viewingQuote), 300);
                    }}
                  >
                    <LinearGradient colors={[TEAL_MID, '#047857']} style={styles.detailsAcceptBtnGrad}>
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                      <Text style={styles.detailsAcceptBtnText}>Accept & Book This Quote</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: hp('5%') }} />
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

  /* ── Gradient Header ── */
  headerGrad: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('1%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
  },
  headerActionBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: hp('0.3%'),
  },
  glassValue: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#FFF',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('4%'),
    gap: wp('1.5%'),
  },
  statusPillText: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#FFF',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: hp('1.2%'),
    gap: wp('3%'),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('3%'),
    gap: wp('1.5%'),
  },
  metaChipText: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  /* ── Loading & Error ── */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('1.5%'),
    color: TEXT_SECONDARY,
    fontSize: wp('3.5%'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('10%'),
  },
  errorIconCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  errorTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  errorSubText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
  },
  backButton: {
    marginTop: hp('2.5%'),
    backgroundColor: TEAL_MID,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.5%'),
  },

  /* ── Content ── */
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
  },

  /* ── Status Message Card ── */
  statusMessageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    gap: wp('3%'),
    ...SHADOW_SM,
  },
  statusMessage: {
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
    flex: 1,
  },

  /* ── Cards ── */
  card: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4.5%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2.5%'),
  },
  cardIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: wp('3.4%'),
    color: TEXT_MUTED,
    flex: 1,
  },
  detailValue: {
    fontSize: wp('3.4%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  locationSection: {
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: hp('0.5%'),
  },
  locationDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    marginRight: wp('3%'),
    marginTop: hp('0.5%'),
  },
  locationLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginBottom: hp('0.2%'),
  },
  locationText: {
    fontSize: wp('3.4%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },

  /* ── Quotes Section ── */
  quotesSection: {
    marginBottom: hp('1.5%'),
  },
  quotesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: wp('2.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  quoteCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  vendorAvatarCircle: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  ratingText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginBottom: hp('0.2%'),
  },
  priceValue: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  quoteDetails: {
    marginBottom: hp('1.2%'),
    paddingTop: hp('0.5%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quoteDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginVertical: hp('0.4%'),
  },
  quoteDetailText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL_MID,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  viewDetailsBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.4%'),
    fontWeight: '700',
  },
  acceptBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  acceptBtnDisabled: {
    opacity: 0.7,
  },
  acceptBtnGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('5%'),
    gap: wp('2%'),
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
  acceptedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.4%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  acceptedText: {
    color: TEAL_MID,
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  /* ── No Quotes ── */
  noQuotesContainer: {
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    padding: wp('10%'),
    alignItems: 'center',
    marginVertical: hp('1%'),
    ...SHADOW_SM,
  },
  noQuotesIconCircle: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  noQuotesTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  noQuotesMessage: {
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5.2%'),
    paddingHorizontal: wp('2%'),
    marginBottom: hp('2%'),
  },
  noQuotesInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('5%'),
    marginTop: hp('1%'),
  },
  noQuotesInfoText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('2%'),
    fontWeight: '500',
  },
  noQuotesPullRefresh: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('1.5%'),
    fontStyle: 'italic',
  },

  /* ── Confirmation Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  modalContainer: {
    backgroundColor: CARD,
    borderRadius: wp('6%'),
    width: '100%',
    maxWidth: wp('92%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  modalContent: {
    padding: wp('6%'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  modalCloseBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginVertical: hp('1.5%'),
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  successIconCircle: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBookingNumber: {
    fontSize: wp('4.2%'),
    fontWeight: '600',
    color: TEAL_MID,
    textAlign: 'center',
    marginTop: hp('0.8%'),
  },
  successBtn: {
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginTop: hp('2%'),
  },
  successBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    gap: wp('2%'),
  },
  successBtnText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },
  errorContainerModal: {
    alignItems: 'center',
    paddingVertical: hp('1%'),
  },
  errorIconWrap: {
    marginBottom: hp('1.5%'),
  },
  errorModalTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  errorMessage: {
    fontSize: wp('3.4%'),
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    backgroundColor: '#FEF2F2',
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    width: '100%',
  },
  errorActions: {
    flexDirection: 'row',
    marginBottom: hp('1.2%'),
    gap: wp('3%'),
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    flex: 1,
    gap: wp('2%'),
  },
  retryBtnText: {
    color: '#fff',
    fontSize: wp('3.4%'),
    fontWeight: '600',
  },
  checkBookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL_MID,
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    flex: 1,
    gap: wp('2%'),
  },
  checkBookingsBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.4%'),
    fontWeight: '600',
  },
  errorHint: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },
  confirmQuoteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  confirmVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  confirmVendorAvatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmVendorInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  confirmVendorName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  confirmRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.3%'),
  },
  confirmRatingText: {
    fontSize: wp('3.2%'),
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.8%'),
    gap: wp('2%'),
  },
  confirmDetailText: {
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  confirmPriceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  confirmPriceLabel: {
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.3%'),
  },
  confirmPriceValue: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  advancePaymentHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    marginTop: hp('1.2%'),
    marginHorizontal: wp('-4%'),
    marginBottom: wp('-4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderBottomLeftRadius: wp('4%'),
    borderBottomRightRadius: wp('4%'),
    gap: wp('2%'),
  },
  advancePaymentText: {
    fontSize: wp('3.4%'),
    color: TEAL_MID,
    fontWeight: '600',
    flex: 1,
  },
  confirmBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.6%'),
    gap: wp('2%'),
  },
  confirmBtnText: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#fff',
  },

  /* ── Quote Details Modal ── */
  detailsModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  detailsHeaderGrad: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('1%'),
    paddingBottom: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    overflow: 'hidden',
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsCloseBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsHeaderTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFF',
  },
  detailsContent: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
  },
  detailsVendorCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4.5%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsVendorAvatar: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  detailsVendorInfo: {
    flex: 1,
  },
  detailsVendorName: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  detailsRatingText: {
    fontSize: wp('3.4%'),
    color: '#F59E0B',
    fontWeight: '600',
  },

  /* ── Tabs ── */
  detailsTabs: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    padding: wp('1%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsTab: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    borderRadius: wp('2.5%'),
  },
  detailsTabActive: {
    backgroundColor: TEAL_MID,
  },
  detailsTabText: {
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  detailsTabTextActive: {
    color: '#fff',
  },
  detailsTabContent: {
    flex: 1,
  },
  detailsSection: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.5%'),
  },
  sectionIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSectionTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailsInfoCard: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsInfoLabel: {
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
  },
  detailsInfoValue: {
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  detailsTextCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  detailsText: {
    fontSize: wp('3.4%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.2%'),
  },
  detailsValidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: hp('0.8%'),
    gap: wp('2.5%'),
  },
  detailsValidText: {
    fontSize: wp('3.4%'),
    color: '#F59E0B',
    fontWeight: '600',
    flex: 1,
  },

  /* ── Pricing ── */
  detailsPricingCard: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsPriceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    flex: 1,
  },
  detailsPriceLabel: {
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
  },
  detailsPriceValue: {
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  detailsTotalRow: {
    borderBottomWidth: 0,
    paddingTop: hp('1.5%'),
    marginTop: hp('0.8%'),
    borderTopWidth: 2,
    borderTopColor: TEAL_MID + '40',
  },
  detailsTotalLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailsTotalValue: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  detailsAdvanceCard: {
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: hp('1.5%'),
  },
  detailsAdvanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('0.8%'),
  },
  detailsAdvanceLabel: {
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  detailsAdvanceValue: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginBottom: hp('0.8%'),
  },
  detailsAdvanceNote: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.5%'),
  },

  /* ── Footer Accept ── */
  detailsFooter: {
    paddingVertical: hp('1.5%'),
  },
  detailsAcceptBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  detailsAcceptBtnGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('6%'),
    gap: wp('2.5%'),
  },
  detailsAcceptBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
  },

  /* ── List Items ── */
  detailsListContainer: {
    gap: hp('1.2%'),
  },
  detailsListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
  },
  detailsCheckIcon: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: TEAL_MID,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.2%'),
  },
  detailsCloseIcon: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.2%'),
  },
  detailsInfoIcon: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.2%'),
  },
  detailsNoteIcon: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.2%'),
  },
  detailsListText: {
    flex: 1,
    fontSize: wp('3.4%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.2%'),
  },
});

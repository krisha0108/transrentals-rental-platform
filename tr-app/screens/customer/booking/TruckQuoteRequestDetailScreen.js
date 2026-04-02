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
  StatusBar,
  Platform,
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

  // Re-request state
  const [reRequestCount, setReRequestCount] = useState(0);
  const [reRequesting, setReRequesting] = useState(false);
  const [reRequestModal, setReRequestModal] = useState(null); // null | 'confirm' | 'limit' | 'success' | 'error'
  const [reRequestError, setReRequestError] = useState('');

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [detailsTab, setDetailsTab] = useState('overview'); // overview, inclusions, exclusions, terms

  // StatusBar management
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
      const response = await api.get(`/truck-quote-requests/${requestId}`);
      if (response.data.success && response.data.quoteRequest) {
        const requestData = response.data.quoteRequest;
        setRequest(requestData);
        setQuotes(requestData.quotes || []);

        // Fetch re-request count
        try {
          const rcRes = await api.get(`/customer/re-request-quotes?serviceType=truck&requestId=${requestId}`);
          if (rcRes.data.success) setReRequestCount(rcRes.data.reRequestCount || 0);
        } catch {}

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
        bookingType: 'truck',
        amount: successData.advanceAmount || Math.round((quoteData?.totalAmount || 0) * 0.3),
      });
    }
  };

  const handleReRequest = () => {
    if (3 - reRequestCount <= 0) {
      setReRequestModal('limit');
      return;
    }
    setReRequestModal('confirm');
  };

  const confirmReRequest = async () => {
    setReRequesting(true);
    try {
      const response = await api.post('/customer/re-request-quotes', {
        serviceType: 'truck',
        requestId,
      });
      if (response.data.success) {
        setReRequestModal('success');
        fetchRequestDetails();
      } else {
        setReRequestError(response.data.message || 'Failed to re-request quotes');
        setReRequestModal('error');
      }
    } catch (err) {
      setReRequestError('Failed to re-request quotes. Please try again.');
      setReRequestModal('error');
    } finally {
      setReRequesting(false);
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
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={{ color: TEXT_SECONDARY, marginTop: hp('1.5%'), fontSize: wp('3.5%'), fontWeight: '500' }}>
            Loading quote request...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quote Request</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}>
          <View style={{ alignItems: 'center', paddingHorizontal: wp('8%') }}>
            <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.emptyCircle}>
              <Ionicons name="document-text" size={wp('12%')} color={TEAL_MID} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Quote Request Not Found</Text>
            <Text style={styles.emptyDesc}>We couldn't find this quote request. It may have been removed.</Text>
            <TouchableOpacity style={styles.refreshBtnStyle} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={16} color={TEAL_MID} />
              <Text style={styles.refreshBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const allQuotesExpired = quotes.length > 0 && quotes.every(q => {
    if (q.status === 'EXPIRED') return true;
    if (!q.validTill) return false;
    return new Date(q.validTill).getTime() < Date.now();
  });
  const reRequestsRemaining = 3 - reRequestCount;
  const bookingDateInFuture = request.pickupDate && new Date(request.pickupDate) > new Date();
  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerSub}>Truck · #{request.requestNumber}</Text>
          </View>
          <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Glass summary card */}
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
        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsCardHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="document-text" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsCardTitle}>Trip Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type</Text>
            <Text style={styles.detailValue}>
              {request.serviceType?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Truck'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Category</Text>
            <Text style={styles.detailValue}>{request.vehicleCategoryName || request.vehicle_category || request.vehicleCategory || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goods Type</Text>
            <Text style={styles.detailValue}>{request.goodsType || '-'}</Text>
          </View>

          {request.estimatedWeight > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Weight</Text>
              <Text style={styles.detailValue}>{request.estimatedWeight} kg</Text>
            </View>
          )}

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              <View>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{request.pickupCity || request.pickupAddress || '-'}</Text>
              </View>
            </View>
            {(request.dropCity || request.dropAddress) && (
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
              {formatDate(request.pickupDate)}
            </Text>
          </View>

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

            {quotes.map((quote) => {
              const isQuoteExpired = quote.status === 'EXPIRED' || (quote.validTill && new Date(quote.validTill).getTime() < Date.now());
              return (
                <View key={quote.id} style={[styles.quoteCard, isQuoteExpired && styles.quoteCardExpired]}>
                  {isQuoteExpired && (
                    <View style={styles.expiredTopBanner}>
                      <Ionicons name="close-circle" size={13} color="#FFF" />
                      <Text style={styles.expiredTopBannerText}>Quote Expired</Text>
                    </View>
                  )}
                  <View style={styles.quoteHeader}>
                    <View style={styles.vendorAvatarCircle}>
                      <Ionicons name="car-outline" size={wp('5%')} color={TEAL_MID} />
                    </View>
                    <View style={{ flex: 1, marginLeft: wp('3%') }}>
                      <Text style={styles.vendorName}>{quote.vendorName || quote.vendors?.businessName || quote.vendor?.businessName || 'Vendor'}</Text>
                      {(quote.vendorRating || quote.vendors?.rating || quote.vendor?.rating) > 0 && (
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.ratingText}>
                            {(quote.vendorRating || quote.vendors?.rating || quote.vendor?.rating)?.toFixed(1)} ({quote.vendors?.totalRatings || quote.vendor?.totalRatings || 0} reviews)
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceWrap}>
                      <Text style={styles.priceLabel}>Total</Text>
                      <Text style={styles.priceValue}>₹{quote.totalAmount?.toLocaleString('en-IN') || '0'}</Text>
                    </View>
                  </View>

                  <View style={styles.quoteDetails}>
                    {quote.vehicleName && (
                      <View style={styles.quoteDetailRow}>
                        <Ionicons name="car-outline" size={16} color={TEXT_SECONDARY} />
                        <Text style={styles.quoteDetailText}>{quote.vehicleName}</Text>
                      </View>
                    )}
                    {quote.inclusions && (
                      <View style={styles.quoteDetailRow}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={TEAL} />
                        <Text style={styles.quoteDetailText}>
                          {parseListData(quote.inclusions).join(', ') || quote.inclusions}
                        </Text>
                      </View>
                    )}
                    {quote.validTill && (
                      <View style={styles.quoteDetailRow}>
                        <Ionicons name="time-outline" size={16} color={isQuoteExpired ? '#EF4444' : '#F59E0B'} />
                        <Text style={[styles.quoteDetailText, isQuoteExpired && { color: '#EF4444' }]}>
                          {isQuoteExpired ? `Expired on ${formatDate(quote.validTill)}` : `Valid till ${formatDate(quote.validTill)}`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* View Full Details Button */}
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => handleViewQuoteDetails(quote)}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={TEAL_MID} />
                    <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={TEAL_MID} />
                  </TouchableOpacity>

                  {!isQuoteExpired && (quote.status === 'SENT' || quote.status === 'VIEWED') ? (
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
              );
            })}

            {/* Date Passed — Cannot Re-request */}
            {allQuotesExpired && !bookingDateInFuture && request.status !== 'ACCEPTED' && (
              <View style={styles.datePastBanner}>
                <View style={styles.reRequestContent}>
                  <Ionicons name="close-circle-outline" size={wp('8%')} color="#6B7280" />
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.datePastTitle}>Booking Date Passed</Text>
                    <Text style={styles.datePastDesc}>
                      All quotes have expired and your pickup date
                      {request.pickupDate ? ` (${formatDate(request.pickupDate)})` : ''} has already passed. Re-requesting is no longer possible.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.newRequestBtn}
                  onPress={() => navigation.navigate('TruckBooking')}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#374151" />
                  <Text style={styles.newRequestBtnText}>Create a New Request</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Re-request Banner */}
            {allQuotesExpired && bookingDateInFuture && request.status !== 'ACCEPTED' && (
              <View style={styles.reRequestBanner}>
                <View style={styles.reRequestContent}>
                  <Ionicons name="refresh-circle-outline" size={wp('8%')} color="#EF4444" />
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.reRequestTitle}>All Quotes Expired</Text>
                    <Text style={styles.reRequestDesc}>
                      {reRequestsRemaining > 0
                        ? `Re-request quotes from vendors (${reRequestsRemaining} attempt${reRequestsRemaining > 1 ? 's' : ''} left)`
                        : 'Maximum re-request limit reached (3/3)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.reRequestDots}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={[styles.dot, i < reRequestCount ? styles.dotFilled : styles.dotEmpty]} />
                  ))}
                </View>
                {reRequestsRemaining > 0 && (
                  <TouchableOpacity
                    style={styles.reRequestBtn}
                    onPress={handleReRequest}
                    disabled={reRequesting}
                  >
                    <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.reRequestBtnGrad}>
                      {reRequesting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="refresh" size={18} color="#fff" />
                          <Text style={styles.reRequestBtnText}>Re-request Quotes</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
                  <Ionicons name="checkmark-circle" size={70} color={TEAL} />
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
                    <Ionicons name="close" size={24} color={TEXT_SECONDARY} />
                  </TouchableOpacity>
                </View>

                {/* Error Display */}
                {acceptError && (
                  <View style={styles.errorContainerModal}>
                    <View style={styles.errorIconWrap}>
                      <Ionicons name="alert-circle" size={50} color="#DC2626" />
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
                          <Ionicons name="car" size={24} color={TEAL_MID} />
                        </View>
                        <View style={styles.confirmVendorInfo}>
                          <Text style={styles.confirmVendorName}>
                            {selectedQuote.vendorName || selectedQuote.vendors?.businessName || selectedQuote.vendor?.businessName || 'Vendor'}
                          </Text>
                          {(selectedQuote.vendorRating || selectedQuote.vendors?.rating || selectedQuote.vendor?.rating) > 0 && (
                            <View style={styles.confirmRating}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.confirmRatingText}>
                                {(selectedQuote.vendorRating || selectedQuote.vendors?.rating || selectedQuote.vendor?.rating)?.toFixed(1)}
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
                          <Text style={styles.confirmDetailText}>
                            {parseListData(selectedQuote.inclusions).join(', ') || selectedQuote.inclusions}
                          </Text>
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
          {/* Gradient Header */}
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.detailsModalHeader}>
            <View style={[styles.decoCircle, { top: -20, right: -10, width: 80, height: 80 }]} pointerEvents="none" />
            <View style={[styles.decoCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} pointerEvents="none" />
            <View style={styles.detailsModalHeaderRow}>
              <TouchableOpacity onPress={handleCloseQuoteDetails} style={styles.detailsCloseBtn}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.detailsHeaderTitle}>Quote Details</Text>
              <View style={{ width: wp('9%') }} />
            </View>
          </LinearGradient>

          {viewingQuote && (
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              {/* Vendor Header */}
              <View style={styles.detailsVendorCard}>
                <View style={styles.detailsVendorRow}>
                  <View style={styles.detailsVendorAvatar}>
                    <Ionicons name="business" size={wp('6%')} color={TEAL_MID} />
                  </View>
                  <View style={styles.detailsVendorInfo}>
                    <Text style={styles.detailsVendorName}>
                      {viewingQuote.vendorName || viewingQuote.vendors?.businessName || viewingQuote.vendor?.businessName || 'Vendor'}
                    </Text>
                    {(viewingQuote.vendorRating || viewingQuote.vendors?.rating || viewingQuote.vendor?.rating) > 0 && (
                      <View style={styles.detailsRating}>
                        <Ionicons name="star" size={16} color="#f39c12" />
                        <Text style={styles.detailsRatingText}>
                          {(viewingQuote.vendorRating || viewingQuote.vendors?.rating || viewingQuote.vendor?.rating)?.toFixed(1)} Rating
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
                        <Ionicons name="car-outline" size={22} color={TEAL_MID} />
                        <Text style={styles.detailsSectionTitle}>Vehicle Details</Text>
                      </View>
                      <View style={styles.detailsVehicleCard}>
                        <Text style={styles.detailsVehicleName}>{viewingQuote.vehicleName || 'Truck'}</Text>
                        {(viewingQuote.vehicleNumber || viewingQuote.vehicle_number) && (
                          <View style={styles.detailsRegRow}>
                            <Ionicons name="card-outline" size={16} color={TEXT_SECONDARY} />
                            <Text style={styles.detailsRegNumber}>
                              {viewingQuote.vehicleNumber || viewingQuote.vehicle_number}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.driverName || viewingQuote.driver_name) && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="person-outline" size={18} color={TEXT_SECONDARY} />
                            <Text style={styles.detailsInfoText}>
                              Driver: {viewingQuote.driverName || viewingQuote.driver_name}
                            </Text>
                          </View>
                        )}
                        {(viewingQuote.driverPhone || viewingQuote.driver_phone) && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="call-outline" size={18} color={TEXT_SECONDARY} />
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
                        <Ionicons name="cash-outline" size={22} color={TEAL_MID} />
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
                          <Ionicons name="information-circle-outline" size={22} color={TEAL_MID} />
                          <Text style={styles.detailsSectionTitle}>Additional Information</Text>
                        </View>
                        <View style={styles.detailsInfoCard}>
                          {viewingQuote.validTill && (
                            <View style={styles.detailsInfoRow}>
                              <Ionicons name="time-outline" size={20} color={TEXT_SECONDARY} />
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
                              <Ionicons name="chatbox-outline" size={18} color={TEAL_MID} />
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
                      <Ionicons name="checkmark-done-circle" size={22} color={TEAL_MID} />
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
                                <Ionicons name="checkmark" size={18} color={TEAL_MID} />
                              </View>
                              <Text style={styles.detailsListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.detailsEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
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
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
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
                      <Ionicons name="document-text" size={22} color={TEAL_MID} />
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
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
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
                    <LinearGradient
                      colors={[TEAL_MID, '#047857']}
                      style={styles.detailsAcceptBtnGrad}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.detailsAcceptBtnText}>Accept This Quote</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Re-request Custom Modal */}
      <Modal
        visible={reRequestModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !reRequesting && setReRequestModal(null)}
      >
        <View style={styles.reReqOverlay}>
          <View style={styles.reReqCard}>
            {reRequestModal === 'confirm' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.reReqIconBg}>
                    <Ionicons name="refresh" size={wp('8%')} color="#D97706" />
                  </LinearGradient>
                </View>
                <Text style={styles.reReqTitle}>Re-request Quotes?</Text>
                <Text style={styles.reReqSubtitle}>Vendors will be notified to send fresh quotes for your request.</Text>
                <View style={styles.reReqAttemptsBox}>
                  <View style={styles.reReqDots}>
                    {[1, 2, 3].map(i => (
                      <View key={i} style={[styles.reReqDot, i <= reRequestCount ? styles.reReqDotUsed : styles.reReqDotFree]} />
                    ))}
                  </View>
                  <Text style={styles.reReqAttemptsText}>{3 - reRequestCount} of 3 attempts remaining</Text>
                </View>
                <View style={styles.reReqActions}>
                  <TouchableOpacity style={styles.reReqCancelBtn} onPress={() => setReRequestModal(null)} disabled={reRequesting}>
                    <Text style={styles.reReqCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reReqConfirmBtn} onPress={confirmReRequest} disabled={reRequesting}>
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.reReqConfirmGrad}>
                      {reRequesting ? <ActivityIndicator size="small" color="#FFF" /> : (
                        <>
                          <Ionicons name="refresh" size={16} color="#FFF" />
                          <Text style={styles.reReqConfirmText}>Re-request</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {reRequestModal === 'limit' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.reReqIconBg}>
                    <Ionicons name="ban" size={wp('8%')} color="#EF4444" />
                  </LinearGradient>
                </View>
                <Text style={styles.reReqTitle}>Limit Reached</Text>
                <Text style={styles.reReqSubtitle}>You've used all 3 re-request attempts for this request. Please create a new request.</Text>
                <View style={styles.reReqDots}>
                  {[1, 2, 3].map(i => <View key={i} style={[styles.reReqDot, styles.reReqDotUsed]} />)}
                </View>
                <TouchableOpacity style={styles.reReqCloseBtn} onPress={() => setReRequestModal(null)}>
                  <Text style={styles.reReqCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
            {reRequestModal === 'success' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.reReqIconBg}>
                    <Ionicons name="checkmark-circle" size={wp('8%')} color="#059669" />
                  </LinearGradient>
                </View>
                <Text style={[styles.reReqTitle, { color: '#059669' }]}>Request Re-opened!</Text>
                <Text style={styles.reReqSubtitle}>Vendors have been notified and will send fresh quotes within 48 hours.</Text>
                <TouchableOpacity style={[styles.reReqCloseBtn, { backgroundColor: '#059669' }]} onPress={() => setReRequestModal(null)}>
                  <Text style={[styles.reReqCloseBtnText, { color: '#FFF' }]}>Done</Text>
                </TouchableOpacity>
              </>
            )}
            {reRequestModal === 'error' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.reReqIconBg}>
                    <Ionicons name="alert-circle" size={wp('8%')} color="#EF4444" />
                  </LinearGradient>
                </View>
                <Text style={[styles.reReqTitle, { color: '#EF4444' }]}>Request Failed</Text>
                <Text style={styles.reReqSubtitle}>{reRequestError}</Text>
                <TouchableOpacity style={[styles.reReqCloseBtn, { backgroundColor: '#EF4444' }]} onPress={() => setReRequestModal(null)}>
                  <Text style={[styles.reReqCloseBtnText, { color: '#FFF' }]}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Gradient Header
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: hp('2%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  headerActionBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Glass card
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassLabel: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  glassValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: hp('0.3%'),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 999,
    gap: wp('1.5%'),
  },
  statusPillText: {
    color: '#FFF',
    fontSize: wp('2.8%'),
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginTop: hp('1.2%'),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('5%'),
    gap: wp('1.5%'),
  },
  metaChipText: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  // Empty state
  emptyCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: { fontSize: wp('4.5%'), fontWeight: '800', color: TEXT_PRIMARY, marginBottom: hp('0.8%') },
  emptyDesc: { textAlign: 'center', color: TEXT_SECONDARY, fontSize: wp('3.3%'), lineHeight: wp('5%'), marginBottom: hp('2%') },
  refreshBtnStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: wp('2%'),
  },
  refreshBtnText: { color: TEAL_MID, fontWeight: '700', fontSize: wp('3.3%') },

  // Scroll content
  content: { flex: 1 },

  // Details card (Trip Details)
  detailsCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.5%'),
  },
  detailsIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCardTitle: {
    fontSize: wp('3.8%'),
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
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Location
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
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  locationText: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },

  // Quotes section
  quotesSection: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.2%'),
  },
  quoteCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_MD,
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
    fontSize: wp('3.5%'),
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
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  priceWrap: { alignItems: 'flex-end' },
  priceLabel: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  quoteDetails: {
    marginBottom: hp('1.2%'),
    paddingTop: hp('1%'),
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
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },

  // View Details Button
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
    gap: wp('1.5%'),
  },
  viewDetailsBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.2%'),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  // Accept button
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
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: wp('3.3%'),
    fontWeight: '700',
  },
  acceptedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  acceptedText: {
    color: TEAL_MID,
    fontSize: wp('3.3%'),
    fontWeight: '700',
  },

  // No quotes
  noQuotesContainer: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('8%'),
    alignItems: 'center',
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
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
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1%'),
  },
  noQuotesMessage: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('2%'),
  },
  noQuotesInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('5%'),
    gap: wp('2%'),
  },
  noQuotesInfoText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  noQuotesPullRefresh: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('1.5%'),
    fontStyle: 'italic',
  },

  // Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  modalContainer: {
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  modalContent: {
    padding: wp('5%'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
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
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginVertical: hp('1.5%'),
  },

  // Success
  successIconContainer: {
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  successBookingNumber: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEAL_MID,
    textAlign: 'center',
    marginTop: hp('0.8%'),
  },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_MID,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    marginTop: hp('2%'),
    gap: wp('2%'),
  },
  successBtnText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  // Error Modal
  errorContainerModal: {
    alignItems: 'center',
    paddingVertical: hp('1%'),
  },
  errorIconWrap: {
    marginBottom: hp('1.5%'),
  },
  errorTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  errorMessage: {
    fontSize: wp('3.2%'),
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    backgroundColor: '#FEF2F2',
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    width: '100%',
    overflow: 'hidden',
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
    backgroundColor: '#DC2626',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    flex: 1,
    gap: wp('2%'),
  },
  retryBtnText: {
    color: '#fff',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },
  checkBookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL_MID,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('3%'),
    flex: 1,
    gap: wp('2%'),
  },
  checkBookingsBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },
  errorHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },

  // Confirm modal
  confirmQuoteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
  },
  confirmVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
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
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  confirmRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.3%'),
  },
  confirmRatingText: {
    fontSize: wp('3%'),
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
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  confirmPriceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
  },
  confirmPriceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.3%'),
  },
  confirmPriceValue: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
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
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    fontWeight: '600',
    flex: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_MID,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#fff',
  },

  // Quote Details Modal
  detailsModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  detailsModalHeader: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  detailsModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsCloseBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsHeaderTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  detailsContent: {
    flex: 1,
    padding: wp('4%'),
  },
  detailsVendorCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  detailsVendorAvatar: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  detailsVendorInfo: {
    flex: 1,
  },
  detailsVendorName: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  detailsRatingText: {
    fontSize: wp('3.2%'),
    color: '#f39c12',
    fontWeight: '600',
  },
  detailsQuoteNumber: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },

  // Tabs
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
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsTabActive: {
    backgroundColor: TEAL_MID,
  },
  detailsTabText: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  detailsTabTextActive: {
    color: '#fff',
  },

  // Tab Content
  detailsTabContent: {
    marginBottom: hp('2%'),
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
    marginBottom: hp('1.5%'),
    gap: wp('2.5%'),
  },
  detailsSectionTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Vehicle Card
  detailsVehicleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  detailsVehicleName: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  detailsRegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginTop: hp('0.8%'),
  },
  detailsRegNumber: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginTop: hp('0.8%'),
  },
  detailsInfoText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },

  // Pricing Card
  detailsPricingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  detailsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
  },
  detailsPriceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  detailsPriceValue: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  detailsTotalRow: {
    paddingTop: hp('1.2%'),
    marginTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailsTotalLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailsTotalValue: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },

  // Info Card
  detailsInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  detailsVendorMessage: {
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: hp('1.2%'),
  },
  detailsMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('0.8%'),
  },
  detailsMessageTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  detailsMessageText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },

  // List Card (for Inclusions, Exclusions, Terms)
  detailsListCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  detailsListItem: {
    flexDirection: 'row',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsListItemLast: {
    borderBottomWidth: 0,
  },
  detailsListBullet: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  detailsExclusionBullet: {
    backgroundColor: 'rgba(231,76,60,0.15)',
  },
  detailsListText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    flex: 1,
    lineHeight: wp('5%'),
  },
  detailsTermsBullet: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_MID,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  detailsTermsNumber: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#fff',
  },
  detailsTermsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  detailsTermsText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },
  detailsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  detailsEmptyText: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    marginTop: hp('1.2%'),
  },

  // Bottom Actions in Details Modal
  detailsActions: {
    padding: wp('4%'),
    paddingBottom: hp('2.5%'),
  },
  detailsAcceptBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  detailsAcceptBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  detailsAcceptBtnText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },

  // Re-request & Expired
  reRequestBanner: { backgroundColor: '#FEF2F2', borderRadius: wp('3%'), padding: wp('4%'), marginTop: wp('3%'), borderWidth: 1, borderColor: '#FECACA' },
  reRequestContent: { flexDirection: 'row', alignItems: 'center', marginBottom: wp('3%') },
  reRequestTitle: { fontSize: wp('4%'), fontWeight: '700', color: '#991B1B' },
  reRequestDesc: { fontSize: wp('3.2%'), color: '#DC2626', marginTop: 2 },
  reRequestDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: wp('3%'), gap: wp('2%') },
  dot: { width: wp('2.5%'), height: wp('2.5%'), borderRadius: wp('1.25%') },
  dotFilled: { backgroundColor: '#EF4444' },
  dotEmpty: { backgroundColor: '#FECACA' },
  reRequestBtn: { borderRadius: wp('2.5%'), overflow: 'hidden' },
  reRequestBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp('1.5%'), gap: wp('2%') },
  reRequestBtnText: { color: '#fff', fontSize: wp('3.8%'), fontWeight: '700' },
  expiredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: wp('2%'), padding: wp('2%'), marginTop: wp('2%'), gap: wp('1.5%') },
  expiredText: { color: '#EF4444', fontSize: wp('3.5%'), fontWeight: '600' },
  quoteCardExpired: { borderWidth: 1, borderColor: '#FCA5A5', opacity: 0.85 },
  expiredTopBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: hp('0.6%'), gap: wp('1.5%') },
  expiredTopBannerText: { color: '#FFF', fontSize: wp('3%'), fontWeight: '700', letterSpacing: 0.3 },
  datePastBanner: { backgroundColor: '#F9FAFB', borderRadius: wp('3%'), padding: wp('4%'), marginTop: wp('3%'), borderWidth: 1, borderColor: '#D1D5DB' },
  datePastTitle: { fontSize: wp('4%'), fontWeight: '700', color: '#374151' },
  datePastDesc: { fontSize: wp('3.2%'), color: '#6B7280', marginTop: 2, lineHeight: wp('4.8%') },
  newRequestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: wp('3%'), paddingVertical: hp('1.5%'), borderRadius: wp('2.5%'), backgroundColor: '#E5E7EB', gap: wp('2%') },
  newRequestBtnText: { color: '#374151', fontSize: wp('3.8%'), fontWeight: '700' },

  // Re-request Modal
  reReqOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  reReqCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: wp('5%'),
    padding: wp('6%'),
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  reReqIconWrap: { marginBottom: hp('2%') },
  reReqIconBg: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  reReqTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: hp('0.8%'),
  },
  reReqSubtitle: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('2.5%'),
  },
  reReqAttemptsBox: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  reReqDots: { flexDirection: 'row', gap: wp('2%'), marginBottom: hp('0.8%') },
  reReqDot: { width: wp('3%'), height: wp('3%'), borderRadius: wp('1.5%') },
  reReqDotFree: { backgroundColor: '#FDE68A' },
  reReqDotUsed: { backgroundColor: '#EF4444' },
  reReqAttemptsText: { fontSize: wp('3%'), color: '#92400E', fontWeight: '600' },
  reReqActions: { flexDirection: 'row', gap: wp('3%'), width: '100%' },
  reReqCancelBtn: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  reReqCancelText: { fontSize: wp('3.5%'), fontWeight: '700', color: TEXT_SECONDARY },
  reReqConfirmBtn: {
    flex: 1,
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  reReqConfirmGrad: {
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  reReqConfirmText: { fontSize: wp('3.5%'), fontWeight: '700', color: '#FFF' },
  reReqCloseBtn: {
    width: '100%',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  reReqCloseBtnText: { fontSize: wp('3.5%'), fontWeight: '700', color: TEXT_SECONDARY },
});

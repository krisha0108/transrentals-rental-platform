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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const STATUS_CONFIG = {
  PENDING: { label: 'Awaiting Quotes', color: '#F59E0B', icon: 'time-outline' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: '#3B82F6', icon: 'mail-outline' },
  ACCEPTED: { label: 'Quote Accepted', color: '#10B981', icon: 'checkmark-circle' },
  EXPIRED: { label: 'Expired', color: '#EF4444', icon: 'close-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', icon: 'close-circle' },
};

export default function EquipmentQuoteRequestDetailScreen() {
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

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }
      return () => {
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF', true);
        }
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
      const response = await api.get(`/equipment-quote-requests/${requestId}`);
      if (response.data.success && response.data.quoteRequest) {
        const requestData = response.data.quoteRequest;
        setRequest(requestData);
        setQuotes(requestData.equipment_quotes || requestData.quotes || []);

        // If quote already accepted and booking created, redirect to booking detail
        if (requestData.status === 'ACCEPTED' && requestData.bookingId) {
          navigation.replace('EquipmentBookingDetail', { bookingId: requestData.bookingId });
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
      const response = await api.patch(`/equipment-quote-requests/${requestId}`, {
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
        bookingType: 'equipment',
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
            <Text style={styles.headerSub}>Equipment · #{request.requestNumber}</Text>
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
        {/* Status Message Card */}
        <View style={styles.statusMsgCard}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusConfig.color + '15' }]}>
            <Ionicons name={statusConfig.icon} size={wp('6%')} color={statusConfig.color} />
          </View>
          <Text style={styles.statusMessage}>
            {request.status === 'PENDING' &&
              'Your quote request is being sent to verified equipment rental vendors. You will receive quotes within 24-48 hours.'}
            {request.status === 'QUOTES_RECEIVED' &&
              `You have received ${quotes.length} quote${quotes.length > 1 ? 's' : ''}. Review and accept the best one!`}
            {request.status === 'ACCEPTED' &&
              'Your quote has been accepted and booking is created. Check booking details for further information.'}
            {request.status === 'EXPIRED' &&
              'This quote request has expired. Please create a new request.'}
          </Text>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="document-text" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Trip Details</Text>
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

          {request.tripDays > 0 && (
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
                  <View style={styles.vendorAvatarCircle}>
                    <Ionicons name="construct" size={wp('5%')} color={TEAL_MID} />
                  </View>
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.vendorName}>{(quote.vendors || quote.vendor)?.businessName || 'Vendor'}</Text>
                    {(quote.vendors || quote.vendor)?.rating > 0 && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {(quote.vendors || quote.vendor).rating.toFixed(1)} ({(quote.vendors || quote.vendor).totalReviews || 0} reviews)
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
                  Your equipment rental booking has been created successfully. Please proceed to payment to confirm your booking.
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
                          navigation.navigate('EquipmentBookingsScreen');
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
                          <Ionicons name="construct" size={24} color={TEAL_MID} />
                        </View>
                        <View style={styles.confirmVendorInfo}>
                          <Text style={styles.confirmVendorName}>
                            {(selectedQuote.vendors || selectedQuote.vendor)?.businessName || 'Vendor'}
                          </Text>
                          {(selectedQuote.vendors || selectedQuote.vendor)?.rating > 0 && (
                            <View style={styles.confirmRating}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.confirmRatingText}>
                                {(selectedQuote.vendors || selectedQuote.vendor).rating.toFixed(1)}
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
  contentPadding: { padding: wp('4%') },

  // Status message card
  statusMsgCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    gap: wp('3%'),
    ...SHADOW_SM,
  },
  statusIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusMessage: {
    flex: 1,
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.8%'),
  },

  // Details card
  detailsCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    ...SHADOW_SM,
  },
  detailsHeader: {
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
  detailsTitle: {
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

  // Modal
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
});

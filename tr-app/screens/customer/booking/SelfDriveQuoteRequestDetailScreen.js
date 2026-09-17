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
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api, { BASE_URL, IMAGE_BASE_URL } from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const STATUS_CONFIG = {
  PENDING: { label: 'Awaiting Quotes', color: '#F59E0B', icon: 'time-outline' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: '#3B82F6', icon: 'mail-outline' },
  ACCEPTED: { label: 'Quote Accepted', color: '#10B981', icon: 'checkmark-circle' },
  EXPIRED: { label: 'Expired', color: '#EF4444', icon: 'close-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', icon: 'close-circle' },
};

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

  // Re-request state
  const [reRequestCount, setReRequestCount] = useState(0);
  const [reRequesting, setReRequesting] = useState(false);
  const [reRequestModal, setReRequestModal] = useState(null); // null | 'confirm' | 'limit' | 'success' | 'error'
  const [reRequestError, setReRequestError] = useState('');

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [detailsTab, setDetailsTab] = useState('overview'); // overview, inclusions, exclusions, terms

  // Image Viewer Modal State
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewingImages, setViewingImages] = useState([]);

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('light');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

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
        // Quotes are returned as a separate array in the API response
        setQuotes(response.data.quotes || []);

        // Fetch re-request count
        try {
          const rcRes = await api.get(`/customer/re-request-quotes?serviceType=self-drive&requestId=${requestId}`);
          if (rcRes.data.success) setReRequestCount(rcRes.data.reRequestCount || 0);
        } catch {}

        // If quote already accepted and booking created, redirect to booking detail
        if (requestData.status === 'ACCEPTED' && requestData.bookingId) {
          // Replace current screen with booking detail to prevent going back
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
        serviceType: 'self-drive',
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
        bookingType: 'self-drive',
        amount: quoteData?.advanceAmount || 0,
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
        serviceType: 'self-drive',
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
            Loading request details...
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
            <Text style={styles.emptyTitle}>Request not found</Text>
            <Text style={styles.emptyDesc}>We couldn't find this quote request. It may have been removed.</Text>
            <TouchableOpacity style={styles.refreshBtnStyle} onPress={fetchRequestDetails}>
              <Ionicons name="refresh" size={16} color={TEAL_MID} />
              <Text style={styles.refreshBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // quotes is now a separate state variable set from API response
  const hasQuotes = quotes.length > 0;
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
            <Text style={styles.headerSub}>Self-Drive · #{request.requestNumber}</Text>
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
              <Text style={styles.metaChipText}>{formatDate(request.createdAt)}</Text>
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
        {/* Vehicle Request Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="car-sport" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Vehicle Request</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleBrand}>{request.vehicleBrand || 'Any Brand'}</Text>
            <Text style={styles.vehicleName}>
              {request.vehicleModelName || request.vehicleCategoryName || 'Any Bike'}
            </Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="calendar-outline" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Trip Details</Text>
          </View>

          <View style={styles.tripRow}>
            <View style={styles.tripItem}>
              <Text style={styles.tripLabel}>PICKUP</Text>
              <Text style={styles.tripValue}>{formatDate(request.pickupDate)}</Text>
              <Text style={styles.tripTime}>{request.pickupTime || '10:00 AM'}</Text>
            </View>
            <View style={styles.tripArrow}>
              <Ionicons name="arrow-forward" size={20} color={TEXT_MUTED} />
            </View>
            <View style={styles.tripItem}>
              <Text style={styles.tripLabel}>DROP</Text>
              <Text style={styles.tripValue}>{formatDate(request.dropDate)}</Text>
              <Text style={styles.tripTime}>{request.dropTime || '10:00 AM'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={TEAL} />
            <Text style={styles.locationText}>{request.locationName}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={TEAL_MID} />
            <Text style={styles.durationText}>
              {request.totalDays} Day{request.totalDays > 1 ? 's' : ''} Rental
            </Text>
          </View>

          {request.isDeliveryRequested && (
            <View style={styles.deliveryBadge}>
              <Ionicons name="car-outline" size={16} color="#F59E0B" />
              <Text style={styles.deliveryBadgeText}>Home Delivery Requested</Text>
            </View>
          )}
        </View>

        {/* Quotes Section */}
        <View style={styles.quotesSection}>
          <Text style={styles.sectionTitle}>
            {hasQuotes ? `${quotes.length} Quote${quotes.length > 1 ? 's' : ''} Received` : 'Awaiting Quotes'}
          </Text>
          {!hasQuotes && (
            <Text style={styles.quotesSubtitle}>
              Vendors will send you quotes within 24-48 hours
            </Text>
          )}

          {hasQuotes ? (
            <>
            <View>
              {quotes.map((quote, idx) => {
                const isQuoteExpired = quote.status === 'EXPIRED' || (quote.validTill && new Date(quote.validTill).getTime() < Date.now());
                return (
                <View key={quote.id} style={[styles.quoteCard, isQuoteExpired && styles.quoteCardExpired]}>
                  {isQuoteExpired && (
                    <View style={styles.expiredTopBanner}>
                      <Ionicons name="close-circle" size={13} color="#FFF" />
                      <Text style={styles.expiredTopBannerText}>Quote Expired</Text>
                    </View>
                  )}
                  {/* Best Deal Badge */}
                  {idx === 0 && !isQuoteExpired && (
                    <View style={styles.bestDealBadge}>
                      <Ionicons name="star" size={12} color="#fff" />
                      <Text style={styles.bestDealText}>Best Price</Text>
                    </View>
                  )}

                  {/* Vendor Info */}
                  <View style={styles.quoteVendor}>
                    <View style={styles.vendorAvatarCircle}>
                      <Ionicons name="storefront" size={wp('5%')} color={TEAL_MID} />
                    </View>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>
                        {quote.vendor?.businessName || 'Vendor'}
                      </Text>
                      {quote.vendor?.rating > 0 && (
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.ratingText}>{quote.vendor.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Vehicle Offered */}
                  <View style={styles.quoteVehicle}>
                    <Text style={styles.quoteVehicleName}>{quote.vehicleName}</Text>

                    {/* Vehicle Images */}
                    {quote.vehicleImages && (() => {
                      try {
                        const images = typeof quote.vehicleImages === 'string'
                          ? JSON.parse(quote.vehicleImages)
                          : quote.vehicleImages;

                        if (Array.isArray(images) && images.length > 0) {
                          return (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={styles.vehicleImagesContainer}
                            >
                              {images.map((imageUrl, imgIdx) => {
                                // Construct proper image URL
                                let finalImageUrl = imageUrl;
                                if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                                  // Relative path - add base URL
                                  const cleanPath = imageUrl.replace(/\\/g, '/').replace(/^\/+/, '');
                                  finalImageUrl = `${BASE_URL}/${cleanPath}`;
                                }

                                return (
                                  <Image
                                    key={imgIdx}
                                    source={{ uri: finalImageUrl }}
                                    style={styles.vehicleImage}
                                    resizeMode="cover"
                                  />
                                );
                              })}
                            </ScrollView>
                          );
                        }
                      } catch (e) {
                        console.log('Error parsing vehicle images:', e);
                      }
                      return null;
                    })()}
                  </View>

                  {/* Price */}
                  <View style={styles.quotePricing}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>
                        Total Price ({request.totalDays} Day{request.totalDays > 1 ? 's' : ''})
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
                    {(() => {
                      const isUnlimited = quote.unlimitedKm === true || quote.kmLimitPerDay === 0 || quote.kmLimitPerDay === null;
                      const hasKm = isUnlimited || (quote.kmLimitPerDay != null && quote.kmLimitPerDay > 0);
                      if (!hasKm) return null;
                      return (
                        <View style={styles.priceRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('1.5%') }}>
                            <Ionicons name="speedometer-outline" size={13} color={isUnlimited ? TEAL_MID : TEXT_SECONDARY} />
                            <Text style={styles.priceLabel}>KM Limit</Text>
                          </View>
                          <Text style={[styles.priceValue, isUnlimited && { color: TEAL_MID, fontWeight: '700' }]}>
                            {isUnlimited ? 'Unlimited' : `${quote.kmLimitPerDay}/day`}
                          </Text>
                        </View>
                      );
                    })()}
                    {!(quote.unlimitedKm === true || quote.kmLimitPerDay === 0 || quote.kmLimitPerDay === null) && quote.extraKmRate > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Extra KM Rate</Text>
                        <Text style={styles.priceValue}>₹{quote.extraKmRate}/km</Text>
                      </View>
                    )}
                  </View>

                  {/* Valid Till */}
                  {quote.validTill && (
                    <Text style={[styles.validTill, isQuoteExpired && { color: '#EF4444' }]}>
                      {isQuoteExpired ? `Expired on ${formatDate(quote.validTill)}` : `Valid till ${formatDate(quote.validTill)}`}
                    </Text>
                  )}

                  {/* View Details Button */}
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => handleViewQuoteDetails(quote)}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={TEAL_MID} />
                    <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={TEAL_MID} />
                  </TouchableOpacity>

                  {/* Accept Button */}
                  {!isQuoteExpired && request.status !== 'ACCEPTED' && quote.status !== 'ACCEPTED' && (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptQuote(quote)}
                      disabled={acceptingQuote === quote.id}
                    >
                      <LinearGradient
                        colors={acceptingQuote === quote.id ? ['#9CA3AF', '#9CA3AF'] : [TEAL_MID, '#047857']}
                        style={styles.acceptBtnGrad}
                      >
                        {acceptingQuote === quote.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.acceptBtnText}>Accept & Book</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {quote.status === 'ACCEPTED' && (
                    <View style={styles.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={TEAL_MID} />
                      <Text style={styles.acceptedText}>Accepted</Text>
                    </View>
                  )}
                </View>
                );
              })}
            </View>

            {/* Date Passed — Cannot Re-request */}
            {allQuotesExpired && !bookingDateInFuture && request.status !== 'ACCEPTED' && (
              <View style={styles.datePastBanner}>
                <Ionicons name="calendar-outline" size={wp('8%')} color="#6B7280" />
                <Text style={styles.datePastTitle}>Booking Date Passed</Text>
                <Text style={styles.datePastDesc}>
                  The pickup date for this request has already passed. Please create a new request for your travel needs.
                </Text>
                <TouchableOpacity style={styles.datePastNewBtn} onPress={() => navigation.navigate('SelfDriveScreen')}>
                  <Text style={styles.datePastNewBtnText}>Create New Request</Text>
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
            </>
          ) : request.status === 'QUOTES_RECEIVED' ? (
            <View style={styles.noQuotesCard}>
              <Ionicons name="time-outline" size={wp('12%')} color="#EF4444" />
              <Text style={styles.noQuotesText}>Quotes Expired or Withdrawn</Text>
              <Text style={styles.noQuotesSubtext}>
                The quotes you received have expired or been withdrawn by the vendors.
                Please submit a new request.
              </Text>
              <TouchableOpacity
                style={styles.newRequestBtn}
                onPress={() => navigation.navigate('BikeRentalScreen')}
              >
                <LinearGradient colors={[TEAL_MID, '#047857']} style={styles.newRequestBtnGrad}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.newRequestBtnText}>Submit New Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : request.status === 'QUOTE_ACCEPTED' || request.status === 'BOOKING_CONFIRMED' ? (
            <View style={styles.noQuotesCard}>
              <Ionicons name="checkmark-circle" size={wp('12%')} color={TEAL} />
              <Text style={styles.noQuotesText}>Quote Already Accepted</Text>
              <Text style={styles.noQuotesSubtext}>
                You have already accepted a quote for this request.
                Check your bookings for details.
              </Text>
              <TouchableOpacity
                style={styles.newRequestBtn}
                onPress={() => navigation.navigate('MyBikeBookings')}
              >
                <LinearGradient colors={[TEAL_MID, '#047857']} style={styles.newRequestBtnGrad}>
                  <Ionicons name="list" size={20} color="#fff" />
                  <Text style={styles.newRequestBtnText}>View Bookings</Text>
                </LinearGradient>
              </TouchableOpacity>
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
        </View>

        {/* Customer Notes */}
        {request.customerNotes && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsIcon}>
                <Ionicons name="document-text-outline" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.detailsTitle}>Your Notes</Text>
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
                  <Ionicons name="checkmark-circle" size={70} color={TEAL} />
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
                          navigation.navigate('MyBikeBookings');
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
                          <Ionicons name="storefront" size={24} color={TEAL_MID} />
                        </View>
                        <View style={styles.confirmVendorInfo}>
                          <Text style={styles.confirmVendorName}>
                            {selectedQuote.vendor?.businessName || 'Vendor'}
                          </Text>
                          {selectedQuote.vendor?.rating > 0 && (
                            <View style={styles.confirmRating}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.confirmRatingText}>
                                {selectedQuote.vendor.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.confirmVehicle}>
                        <Ionicons name="car-sport" size={20} color={TEXT_SECONDARY} />
                        <Text style={styles.confirmVehicleName}>
                          {selectedQuote.vehicleName}
                        </Text>
                      </View>

                      <View style={styles.confirmPriceSection}>
                        <View style={styles.confirmPriceRow}>
                          <Text style={styles.confirmPriceLabel}>
                            Total Price ({request?.totalDays || 1} Day{(request?.totalDays || 1) > 1 ? 's' : ''})
                          </Text>
                          <Text style={styles.confirmTotal}>₹{selectedQuote.grandTotal}</Text>
                        </View>
                        {selectedQuote.advanceAmount > 0 && (
                          <View style={styles.confirmAdvanceRow}>
                            <View style={styles.confirmAdvanceLabel}>
                              <Ionicons name="wallet-outline" size={16} color={TEAL_MID} />
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
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.detailsModalHeader}>
            <View style={[styles.decoCircle, { top: -20, right: -15, width: 70, height: 70 }]} pointerEvents="none" />
            <View style={[styles.decoCircle, { bottom: -10, left: -10, width: 45, height: 45 }]} pointerEvents="none" />
            <View style={styles.detailsModalHeaderRow}>
              <TouchableOpacity onPress={handleCloseQuoteDetails} style={styles.backBtn}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.detailsModalHeaderTitle}>Quote Details</Text>
              <View style={{ width: wp('9%') }} />
            </View>
          </LinearGradient>

          {viewingQuote && (
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              {/* Vendor Header */}
              <View style={styles.detailsVendorCard}>
                <View style={styles.detailsVendorRow}>
                  <View style={styles.detailsVendorAvatar}>
                    <Ionicons name="storefront" size={wp('6%')} color={TEAL_MID} />
                  </View>
                  <View style={styles.detailsVendorInfo}>
                    <Text style={styles.detailsVendorName}>
                      {viewingQuote.vendor?.businessName || 'Vendor'}
                    </Text>
                    {viewingQuote.vendor?.rating > 0 && (
                      <View style={styles.detailsRating}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
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
                    {/* Vehicle Images */}
                    {(() => {
                      console.log('🖼️ Vehicle Images Debug:', viewingQuote?.vehicleImages);
                      console.log('🖼️ Vehicle Images Type:', typeof viewingQuote?.vehicleImages);

                      let vehicleImages = [];
                      if (viewingQuote?.vehicleImages) {
                        try {
                          // Try to parse as JSON array
                          vehicleImages = typeof viewingQuote.vehicleImages === 'string'
                            ? JSON.parse(viewingQuote.vehicleImages)
                            : viewingQuote.vehicleImages;

                          // Ensure it's an array
                          if (!Array.isArray(vehicleImages)) {
                            vehicleImages = [];
                          }

                          console.log('✅ Parsed vehicle images:', vehicleImages);
                        } catch (e) {
                          console.log('⚠️ JSON parse failed, trying comma-separated:', e.message);
                          // If JSON parse fails, try as comma-separated string
                          if (typeof viewingQuote.vehicleImages === 'string') {
                            vehicleImages = viewingQuote.vehicleImages.split(',').map(s => s.trim()).filter(Boolean);
                            console.log('✅ Split vehicle images:', vehicleImages);
                          }
                        }
                      } else {
                        console.log('❌ No vehicleImages found in quote');
                      }

                      console.log('🖼️ Final vehicleImages array length:', vehicleImages.length);

                      return vehicleImages.length > 0 && (
                        <View style={styles.detailsSection}>
                          <View style={styles.detailsSectionHeader}>
                            <View style={styles.detailsSectionIcon}>
                              <Ionicons name="images" size={wp('4%')} color={TEAL_MID} />
                            </View>
                            <Text style={styles.detailsSectionTitle}>Vehicle Images</Text>
                          </View>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.detailsImageScroll}
                          >
                            {vehicleImages.map((img, idx) => {
                              // Construct image URL
                              let imageUrl = img;
                              if (!img.startsWith('http') && !img.startsWith('data:')) {
                                const cleanPath = img.replace(/\\/g, '/').replace(/^\/+/, '');

                                // If path already starts with 'uploads/', just prepend BASE_URL
                                if (cleanPath.startsWith('uploads/')) {
                                  imageUrl = `${BASE_URL}/${cleanPath}`;
                                } else if (cleanPath.startsWith('storage/')) {
                                  imageUrl = `${BASE_URL}/${cleanPath}`;
                                } else {
                                  // Otherwise, use IMAGE_BASE_URL (which already has /uploads)
                                  imageUrl = `${IMAGE_BASE_URL}/${cleanPath}`;
                                }
                              }

                              console.log(`🖼️ Image ${idx + 1} URL:`, imageUrl);

                              return (
                                <TouchableOpacity
                                  key={idx}
                                  style={styles.detailsImageContainer}
                                  onPress={() => {
                                    setViewingImages(vehicleImages);
                                    setSelectedImageIndex(idx);
                                    setImageViewerVisible(true);
                                  }}
                                >
                                  <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.detailsImage}
                                    resizeMode="cover"
                                    onError={(e) => console.log(`❌ Image ${idx + 1} failed to load:`, e.nativeEvent.error)}
                                    onLoad={() => console.log(`✅ Image ${idx + 1} loaded successfully`)}
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })()}

                    {/* Vehicle Info */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailsSectionHeader}>
                        <View style={styles.detailsSectionIcon}>
                          <Ionicons name="car-sport" size={wp('4%')} color={TEAL_MID} />
                        </View>
                        <Text style={styles.detailsSectionTitle}>Vehicle Details</Text>
                      </View>
                      <View style={styles.detailsVehicleCard}>
                        <Text style={styles.detailsVehicleName}>{viewingQuote.vehicleName}</Text>
                        {viewingQuote.vehicleBrand && (
                          <Text style={styles.detailsVehicleBrand}>{viewingQuote.vehicleBrand}</Text>
                        )}
                        {viewingQuote.registrationNumber && (
                          <View style={styles.detailsRegRow}>
                            <Ionicons name="card-outline" size={16} color={TEXT_SECONDARY} />
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
                                  <Ionicons name="checkmark-circle" size={16} color={TEAL} />
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
                        <View style={styles.detailsSectionIcon}>
                          <Ionicons name="cash-outline" size={wp('4%')} color={TEAL_MID} />
                        </View>
                        <Text style={styles.detailsSectionTitle}>Pricing Breakdown</Text>
                      </View>
                      <View style={styles.detailsPricingCard}>
                        <View style={styles.detailsPriceRow}>
                          <Text style={styles.detailsPriceLabel}>
                            Rental ({request?.totalDays || 1} days)
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
                              <Ionicons name="wallet-outline" size={18} color={TEAL_MID} />
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
                              <Ionicons name="shield-checkmark-outline" size={16} color={TEXT_SECONDARY} />
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
                        <View style={styles.detailsSectionIcon}>
                          <Ionicons name="information-circle-outline" size={wp('4%')} color={TEAL_MID} />
                        </View>
                        <Text style={styles.detailsSectionTitle}>Additional Information</Text>
                      </View>
                      <View style={styles.detailsInfoCard}>
                        {viewingQuote.helmetsIncluded !== undefined && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons
                              name={viewingQuote.helmetsIncluded ? 'checkmark-circle' : 'close-circle'}
                              size={20}
                              color={viewingQuote.helmetsIncluded ? TEAL : '#EF4444'}
                            />
                            <Text style={styles.detailsInfoText}>
                              Helmets {viewingQuote.helmetsIncluded ? 'Included' : 'Not Included'}
                            </Text>
                          </View>
                        )}
                        {(() => {
                          const isUnlimited = viewingQuote.unlimitedKm === true || viewingQuote.kmLimitPerDay === 0 || viewingQuote.kmLimitPerDay === null;
                          const hasKm = isUnlimited || (viewingQuote.kmLimitPerDay != null && viewingQuote.kmLimitPerDay > 0);
                          if (!hasKm) return null;
                          return (
                            <View style={styles.detailsInfoRow}>
                              <Ionicons name="speedometer-outline" size={20} color={isUnlimited ? TEAL_MID : TEXT_SECONDARY} />
                              <Text style={[styles.detailsInfoText, isUnlimited && { color: TEAL_MID, fontWeight: '700' }]}>
                                {isUnlimited ? 'Unlimited KM' : `${viewingQuote.kmLimitPerDay} KM per day limit`}
                              </Text>
                            </View>
                          );
                        })()}
                        {viewingQuote.extraKmRate > 0 && (
                          <View style={styles.detailsInfoRow}>
                            <Ionicons name="cash-outline" size={20} color={TEXT_SECONDARY} />
                            <Text style={styles.detailsInfoText}>
                              ₹{viewingQuote.extraKmRate} per extra KM
                            </Text>
                          </View>
                        )}
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
                      {viewingQuote.vendorMessage && (
                        <View style={styles.detailsVendorMessage}>
                          <View style={styles.detailsMessageHeader}>
                            <Ionicons name="chatbox-outline" size={18} color={TEAL_MID} />
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
                      <View style={styles.detailsSectionIcon}>
                        <Ionicons name="checkmark-done-circle" size={wp('4%')} color={TEAL_MID} />
                      </View>
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
                                <Ionicons name="checkmark" size={18} color={TEAL} />
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
                      <View style={styles.detailsSectionIcon}>
                        <Ionicons name="close-circle" size={wp('4%')} color="#EF4444" />
                      </View>
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
                                <Ionicons name="close" size={18} color="#EF4444" />
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
                      <View style={styles.detailsSectionIcon}>
                        <Ionicons name="document-text" size={wp('4%')} color={TEAL_MID} />
                      </View>
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
                {(() => {
                  const isViewingQuoteExpired = viewingQuote.status === 'EXPIRED' || (viewingQuote.validTill && new Date(viewingQuote.validTill).getTime() < Date.now());
                  
                  if (isViewingQuoteExpired) {
                    return (
                      <View style={[styles.detailsAcceptBtnGrad, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' }]}>
                         <Ionicons name="alert-circle" size={22} color="#DC2626" />
                         <Text style={[styles.detailsAcceptBtnText, { color: '#DC2626', marginLeft: 8 }]}>This Quote has Expired</Text>
                      </View>
                    );
                  }

                  return request.status !== 'ACCEPTED' && viewingQuote.status !== 'ACCEPTED' && (
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
                  );
                })()}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageViewerScroll}
            contentContainerStyle={{ width: Dimensions.get('window').width * viewingImages.length }}
            scrollEnabled={true}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setSelectedImageIndex(index);
            }}
            contentOffset={{ x: selectedImageIndex * Dimensions.get('window').width, y: 0 }}
          >
            {viewingImages.map((img, idx) => {
              let imageUrl = img;
              if (!img.startsWith('http') && !img.startsWith('data:')) {
                const cleanPath = img.replace(/\\/g, '/').replace(/^\/+/, '');
                if (cleanPath.startsWith('uploads/')) {
                  imageUrl = `${BASE_URL}/${cleanPath}`;
                } else if (cleanPath.startsWith('storage/')) {
                  imageUrl = `${BASE_URL}/${cleanPath}`;
                } else {
                  imageUrl = `${IMAGE_BASE_URL}/${cleanPath}`;
                }
              }

              return (
                <View key={idx} style={styles.imageViewerPage}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.imageViewerImage}
                    resizeMode="contain"
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.imageViewerCounter}>
            <Text style={styles.imageViewerCounterText}>
              {selectedImageIndex + 1} / {viewingImages.length}
            </Text>
          </View>
        </View>
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
    paddingTop: Platform.OS === 'android' ? hp('1%') : hp('1%'),
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

  // Vehicle
  vehicleInfo: {
    marginTop: hp('0.5%'),
  },
  vehicleBrand: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  vehicleName: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('0.3%'),
  },

  // Trip
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  tripItem: {
    flex: 1,
  },
  tripLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: hp('0.3%'),
  },
  tripTime: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
  },
  tripArrow: {
    paddingHorizontal: wp('3%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('2%'),
    fontWeight: '500',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('5%'),
    marginTop: hp('1.2%'),
    gap: wp('1.5%'),
  },
  durationText: {
    color: TEAL_MID,
    fontWeight: '600',
    fontSize: wp('3%'),
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('5%'),
    marginTop: hp('0.8%'),
    gap: wp('1.5%'),
  },
  deliveryBadgeText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: wp('3%'),
  },

  // Quotes Section
  quotesSection: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
  },
  quotesSubtitle: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginBottom: hp('1%'),
  },
  quoteCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    position: 'relative',
    ...SHADOW_MD,
  },
  bestDealBadge: {
    position: 'absolute',
    top: wp('3%'),
    right: wp('3%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('5%'),
    gap: wp('1%'),
    zIndex: 1,
  },
  bestDealText: {
    color: '#fff',
    fontSize: wp('2.6%'),
    fontWeight: '700',
  },

  // Vendor
  quoteVendor: {
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
  vendorInfo: {
    marginLeft: wp('3%'),
    flex: 1,
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

  // Quote Vehicle
  quoteVehicle: {
    backgroundColor: '#F9FAFB',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
  },
  quoteVehicleName: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
  },
  vehicleImagesContainer: {
    marginTop: hp('0.8%'),
    marginHorizontal: wp('-3%'),
    paddingHorizontal: wp('3%'),
  },
  vehicleImage: {
    width: wp('28%'),
    height: hp('10%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
    backgroundColor: '#E5E7EB',
  },

  // Quote Pricing
  quotePricing: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: hp('1.2%'),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('0.6%'),
  },
  priceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  advanceLabel: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  advanceValue: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '700',
  },
  advanceRow: {
    backgroundColor: TEAL_LIGHT,
    marginHorizontal: wp('-3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    marginTop: hp('0.8%'),
    borderRadius: wp('2%'),
  },
  validTill: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.8%'),
    textAlign: 'center',
  },

  // View Details Button
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    marginTop: hp('1%'),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: wp('1.5%'),
  },
  viewDetailsBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  // Accept Button
  acceptBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    marginTop: hp('1%'),
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
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
  acceptedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    marginTop: hp('1%'),
    gap: wp('2%'),
  },
  acceptedText: {
    color: TEAL_MID,
    fontSize: wp('3.3%'),
    fontWeight: '700',
  },

  // No Quotes (expired/accepted states)
  noQuotesCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('8%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  noQuotesText: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('1.5%'),
  },
  noQuotesSubtext: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
    textAlign: 'center',
    paddingHorizontal: wp('2%'),
    lineHeight: wp('4.8%'),
  },
  newRequestBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    marginTop: hp('2%'),
  },
  newRequestBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  newRequestBtnText: {
    color: '#fff',
    fontSize: wp('3.2%'),
    fontWeight: '700',
  },

  // No Quotes (pending state)
  noQuotesContainer: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('8%'),
    alignItems: 'center',
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

  // Notes
  notesText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },

  // ========== Confirmation Modal Styles ==========
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

  // Success State
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

  // Error State
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

  // Confirm Quote Card
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
  confirmVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    padding: wp('3%'),
    borderRadius: wp('2.5%'),
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  confirmVehicleName: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  confirmPriceSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: hp('1.2%'),
  },
  confirmPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('0.8%'),
  },
  confirmPriceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  confirmTotal: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  confirmAdvanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    marginTop: hp('0.8%'),
    marginHorizontal: wp('-4%'),
    marginBottom: wp('-4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderBottomLeftRadius: wp('4%'),
    borderBottomRightRadius: wp('4%'),
  },
  confirmAdvanceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  confirmAdvanceLabelText: {
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  confirmAdvanceValue: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  confirmNote: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: wp('4.5%'),
    marginBottom: hp('2%'),
  },
  confirmActions: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  cancelModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
  },
  cancelModalBtnText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_MID,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: '#fff',
  },

  // ========== Quote Details Modal Styles ==========
  detailsModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  detailsModalHeader: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? hp('1%') : hp('1%'),
    paddingBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  detailsModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsModalHeaderTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  detailsContent: {
    flex: 1,
  },

  // Vendor Card
  detailsVendorCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('4%'),
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
  },
  detailsVendorInfo: {
    marginLeft: wp('3.5%'),
    flex: 1,
  },
  detailsVendorName: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.3%'),
    gap: wp('1%'),
  },
  detailsRatingText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  detailsQuoteNumber: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },

  // Tabs
  detailsTabs: {
    flexDirection: 'row',
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    borderRadius: wp('3%'),
    paddingHorizontal: wp('1%'),
    paddingTop: hp('0.5%'),
    ...SHADOW_SM,
  },
  detailsTab: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  detailsTabActive: {
    borderBottomColor: TEAL,
  },
  detailsTabText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  detailsTabTextActive: {
    color: TEAL_MID,
  },

  // Tab Content
  detailsTabContent: {
    padding: wp('4%'),
  },
  detailsSection: {
    marginBottom: hp('2%'),
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: wp('2.5%'),
  },
  detailsSectionIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSectionTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Vehicle Card in details
  detailsVehicleCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  detailsVehicleName: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  detailsVehicleBrand: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.8%'),
  },
  detailsRegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    alignSelf: 'flex-start',
    gap: wp('1.5%'),
  },
  detailsRegNumber: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },

  // Features
  detailsFeaturesContainer: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  detailsFeaturesTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.2%'),
  },
  detailsFeaturesList: {},
  detailsFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.2%'),
    paddingBottom: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsFeatureText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('2.5%'),
    flex: 1,
    lineHeight: wp('5%'),
    paddingTop: 1,
  },
  detailsFeatureItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  // Pricing Card
  detailsPricingCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  detailsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  detailsPriceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  detailsPriceValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  detailsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: hp('1.2%'),
    marginTop: hp('0.5%'),
    marginBottom: hp('1.2%'),
  },
  detailsTotalLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailsTotalValue: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  detailsAdvanceCard: {
    backgroundColor: TEAL_LIGHT,
    padding: wp('3.5%'),
    borderRadius: wp('2.5%'),
    marginBottom: hp('1%'),
  },
  detailsAdvanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
    gap: wp('1.5%'),
  },
  detailsAdvanceLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  detailsAdvanceAmount: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  detailsDepositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: wp('3%'),
    borderRadius: wp('2.5%'),
  },
  detailsDepositLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  detailsDepositText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
  },
  detailsDepositAmount: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Info Card
  detailsInfoCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: wp('2.5%'),
  },
  detailsInfoText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },

  // Vendor Message
  detailsVendorMessage: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  detailsMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
    gap: wp('2%'),
  },
  detailsMessageTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  detailsMessageText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },

  // List Card (Inclusions/Exclusions)
  detailsListCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  detailsListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsListBullet: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('3.75%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    marginTop: hp('0.2%'),
  },
  detailsExclusionBullet: {
    backgroundColor: '#FEF2F2',
  },
  detailsListText: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5%'),
    flex: 1,
    paddingTop: hp('0.3%'),
  },
  detailsListItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  // Terms Card
  detailsTermsCard: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderRadius: wp('3.5%'),
    ...SHADOW_SM,
  },
  detailsTermsText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },
  detailsTermsBullet: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  detailsTermsNumber: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL_MID,
  },

  // Empty State
  detailsEmptyState: {
    backgroundColor: CARD,
    padding: wp('8%'),
    borderRadius: wp('3.5%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  detailsEmptyText: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    marginTop: hp('1.2%'),
  },

  // Bottom Actions
  detailsActions: {
    paddingHorizontal: wp('4%'),
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
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  detailsAcceptBtnText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  // Vehicle Images in details
  detailsImageScroll: {
    marginTop: hp('1%'),
  },
  detailsImageContainer: {
    marginRight: wp('3%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsImage: {
    width: wp('65%'),
    height: hp('22%'),
    borderRadius: wp('3%'),
  },

  // Image Viewer Modal
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: hp('6%'),
    right: wp('5%'),
    zIndex: 10,
    padding: wp('2.5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: wp('6%'),
  },
  imageViewerScroll: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  imageViewerPage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  imageViewerCounter: {
    position: 'absolute',
    bottom: hp('6%'),
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('5%'),
  },
  imageViewerCounterText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },

  // Re-request & Expired
  reRequestBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: wp('3%'),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reRequestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp('3%'),
  },
  reRequestTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#991B1B',
  },
  reRequestDesc: {
    fontSize: wp('3.2%'),
    color: '#DC2626',
    marginTop: 2,
  },
  reRequestDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: wp('3%'),
    gap: wp('2%'),
  },
  dot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
  },
  dotFilled: { backgroundColor: '#EF4444' },
  dotEmpty: { backgroundColor: '#FECACA' },
  reRequestBtn: {
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
  },
  reRequestBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    gap: wp('2%'),
  },
  reRequestBtnText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: wp('2%'),
    padding: wp('2%'),
    marginTop: wp('2%'),
    gap: wp('1.5%'),
  },
  expiredText: {
    color: '#EF4444',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
  quoteCardExpired: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  expiredTopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderTopLeftRadius: wp('3%'),
    borderTopRightRadius: wp('3%'),
    marginHorizontal: -wp('4%'),
    marginTop: -wp('4%'),
    marginBottom: wp('2%'),
    gap: wp('1.5%'),
  },
  expiredTopBannerText: {
    color: '#FFF',
    fontSize: wp('3%'),
    fontWeight: '700',
  },
  datePastBanner: {
    backgroundColor: '#F3F4F6',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: wp('3%'),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    gap: wp('2%'),
  },
  datePastTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#374151',
    marginTop: wp('1%'),
  },
  datePastDesc: {
    fontSize: wp('3.2%'),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: wp('4.5%'),
  },
  datePastNewBtn: {
    backgroundColor: '#6B7280',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('6%'),
    marginTop: wp('1%'),
  },
  datePastNewBtnText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },

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

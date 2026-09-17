import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Modal,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width, height } = Dimensions.get('window');

const STATUS_CONFIG = {
  PENDING: { label: 'Awaiting Quotes', color: '#F59E0B', icon: 'time-outline' },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: '#3B82F6', icon: 'mail-outline' },
  ACCEPTED: { label: 'Quote Accepted', color: '#10B981', icon: 'checkmark-circle' },
  EXPIRED: { label: 'Expired', color: '#EF4444', icon: 'close-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', icon: 'close-circle' },
};

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

  // Quote Details Modal State
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [detailsTab, setDetailsTab] = useState('overview');

  // Re-request state
  const [reRequestCount, setReRequestCount] = useState(0);
  const [reRequesting, setReRequesting] = useState(false);
  const [reRequestModal, setReRequestModal] = useState(null); // null | 'confirm' | 'limit' | 'success' | 'error'
  const [reRequestError, setReRequestError] = useState('');

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('light');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

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

        // Fetch re-request count
        try {
          const rcRes = await api.get(`/customer/re-request-quotes?serviceType=luxury&requestId=${requestId}`);
          if (rcRes.data.success) setReRequestCount(rcRes.data.reRequestCount || 0);
        } catch {}
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
      console.error('Server response data:', JSON.stringify(error.response?.data));
      console.error('Server status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept quote';
      Alert.alert('Error', errorMessage);
    } finally {
      setAcceptingQuote(null);
    }
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

  const handleReRequest = () => {
    const remaining = 3 - reRequestCount;
    if (remaining <= 0) {
      setReRequestModal('limit');
      return;
    }
    setReRequestModal('confirm');
  };

  const confirmReRequest = async () => {
    setReRequesting(true);
    try {
      const response = await api.post('/customer/re-request-quotes', {
        serviceType: 'luxury',
        requestId,
        customerId: customerData?.id,
      });
      if (response.data.success) {
        setReRequestModal('success');
        if (customerData) fetchQuoteRequestDetails(customerData);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `\u20B9${amount.toLocaleString('en-IN')}`;
  };

  const parseListData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(item => item && item.trim());
    if (typeof data === 'string') {
      if (data.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) return parsed.filter(item => item && item.trim());
        } catch (e) {}
      }
      return data.split(/\n|,/).map(item => item.trim()).filter(item => item && item !== '');
    }
    return [];
  };

  const handleViewQuoteDetails = (quote) => {
    setViewingQuote(quote);
    setDetailsTab('overview');
    setQuoteDetailsVisible(true);
  };

  const handleCloseQuoteDetails = () => {
    setQuoteDetailsVisible(false);
    setViewingQuote(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={{ width: wp('9%') }} />
          </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={{ color: TEXT_SECONDARY, marginTop: hp('1.5%'), fontSize: wp('3.5%'), fontWeight: '500' }}>
            Loading quote details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quoteRequest) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quote Request</Text>
            <View style={{ width: wp('9%') }} />
          </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />}>
          <View style={{ alignItems: 'center', paddingHorizontal: wp('8%') }}>
            <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.emptyCircle}>
              <MaterialCommunityIcons name="alert-circle-outline" size={wp('12%')} color={TEAL_MID} />
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

  const hasQuotes = quoteRequest.quotes && quoteRequest.quotes.length > 0;
  const allQuotesExpired = hasQuotes && quoteRequest.quotes.every(q => {
    if (!q.validUntil && !q.validTill) return q.status === 'EXPIRED';
    const validDate = q.validUntil || q.validTill;
    return new Date(validDate).getTime() < Date.now();
  });
  const reRequestsRemaining = 3 - reRequestCount;
  const bookingDateInFuture = quoteRequest.pickupDate && new Date(quoteRequest.pickupDate) > new Date();
  const statusConfig = STATUS_CONFIG[quoteRequest.status] || STATUS_CONFIG.PENDING;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quote Request</Text>
            <Text style={styles.headerSub}>Luxury · #{quoteRequest.requestNumber}</Text>
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
              <Text style={styles.metaChipText}>{formatDate(quoteRequest.pickupDate)}</Text>
            </View>
            {quoteRequest.pickupTime && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaChipText}>{quoteRequest.pickupTime}</Text>
              </View>
            )}
          </View>
        </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TEAL]}
            tintColor={TEAL}
          />
        }
      >
        {/* Request Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconRow}>
            <View style={styles.crownCircle}>
              <MaterialCommunityIcons name="crown" size={wp('6%')} color={TEAL_MID} />
            </View>
          </View>
          <Text style={styles.summaryTitle}>{quoteRequest.vehicleCategoryName || quoteRequest.vehicleCategory}</Text>
          <View style={styles.summaryTripBadge}>
            <Text style={styles.summaryTripText}>{quoteRequest.tripType.toUpperCase()}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="location" size={16} color={TEAL} />
              <Text style={styles.summaryItemText}>{quoteRequest.pickupCity}</Text>
            </View>
            {quoteRequest.dropCity && (
              <>
                <Ionicons name="arrow-forward" size={14} color={TEXT_MUTED} />
                <View style={styles.summaryItem}>
                  <Ionicons name="location" size={16} color="#EF4444" />
                  <Text style={styles.summaryItemText}>{quoteRequest.dropCity}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <MaterialCommunityIcons name="car-sports" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Trip Details</Text>
          </View>

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
              valueColor={TEAL}
            />
          )}
        </View>

        {/* Addresses */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons name="location" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.detailsTitle}>Addresses</Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{quoteRequest.pickupAddress || quoteRequest.pickupCity}</Text>
              </View>
            </View>

            {quoteRequest.dropAddress && (
              <View style={[styles.locationRow, { marginTop: hp('1%'), paddingTop: hp('1%'), borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
                <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>Drop</Text>
                  <Text style={styles.locationText}>{quoteRequest.dropAddress}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Special Requirements */}
        {quoteRequest.requirements && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsIcon}>
                <Ionicons name="document-text" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.detailsTitle}>Special Requirements</Text>
            </View>
            <Text style={styles.requirementsText}>{quoteRequest.requirements}</Text>
          </View>
        )}

        {/* Vendor Quotes */}
        <View style={styles.quotesSection}>
          <View style={styles.quotesHeaderRow}>
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
                <MaterialCommunityIcons name="crown" size={wp('12%')} color={TEAL} />
              </View>
              <Text style={styles.noQuotesTitle}>No Quotations Yet</Text>
              <Text style={styles.noQuotesMessage}>
                Your request has been sent to vendors. They will review and send you competitive quotes soon.
              </Text>
              <View style={styles.noQuotesInfoBox}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={TEXT_SECONDARY} />
                <Text style={styles.noQuotesInfoText}>
                  Usually within 24-48 hours
                </Text>
              </View>
              <Text style={styles.noQuotesPullRefresh}>Pull down to refresh</Text>
            </View>
          ) : (
            quoteRequest.quotes.map((quote, index) => {
              const isQuoteExpired = quote.status === 'EXPIRED' || (quote.validTill && new Date(quote.validTill).getTime() < Date.now()) || (quote.validUntil && new Date(quote.validUntil).getTime() < Date.now());
              return (
              <View key={quote.id} style={[styles.quoteCard, isQuoteExpired && styles.quoteCardExpired]}>
                {/* Expired Strip */}
                {isQuoteExpired && (
                  <View style={styles.expiredTopBanner}>
                    <Ionicons name="close-circle" size={13} color="#FFF" />
                    <Text style={styles.expiredTopBannerText}>Quote Expired</Text>
                  </View>
                )}
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
                      <View style={styles.vendorAvatarCircle}>
                        <MaterialCommunityIcons name="store" size={wp('5%')} color={TEAL_MID} />
                      </View>
                    )}
                    <View style={styles.vendorDetails}>
                      <Text style={styles.vendorName}>{quote.vendor?.businessName || 'Vendor'}</Text>
                      <View style={styles.vendorMeta}>
                        {quote.vendor?.rating > 0 && (
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
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
                    <Text style={styles.priceLabel}>Total</Text>
                    <Text style={styles.quotePrice}>{formatCurrency(quote.totalAmount)}</Text>
                    <Ionicons
                      name={expandedQuote === quote.id ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={TEXT_MUTED}
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
                      {!!quote.vehicleYear && (
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
                        {quote.driverExperience > 0 && (
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
                      {quote.advanceAmount > 0 && (
                        <View style={styles.advanceRow}>
                          <Text style={styles.advanceLabel}>Advance to Pay</Text>
                          <Text style={styles.advanceValue}>{formatCurrency(quote.advanceAmount)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Rates */}
                    {(quote.perKmRate > 0 || quote.perHourRate > 0) && (
                      <View style={styles.quoteSection}>
                        <Text style={styles.quoteSectionTitle}>Additional Rates</Text>
                        {quote.perKmRate > 0 && (
                          <DetailRow icon="road" label="Per KM Rate" value={formatCurrency(quote.perKmRate)} small />
                        )}
                        {quote.perHourRate > 0 && (
                          <DetailRow icon="clock" label="Per Hour Rate" value={formatCurrency(quote.perHourRate)} small />
                        )}
                        {quote.extraKmRate > 0 && (
                          <DetailRow icon="plus" label="Extra KM" value={formatCurrency(quote.extraKmRate)} small />
                        )}
                        {quote.extraHourRate > 0 && (
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

                    {/* View Full Details Button */}
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => handleViewQuoteDetails(quote)}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={TEAL_MID} />
                      <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                      <Ionicons name="chevron-forward" size={16} color={TEAL_MID} />
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    {isQuoteExpired ? (
                      <View style={styles.quoteActions}>
                        <View style={[styles.acceptGradient, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8 }]}>
                           <Ionicons name="alert-circle" size={18} color="#DC2626" />
                           <Text style={[styles.acceptBtnText, { color: '#DC2626', marginLeft: 8 }]}>This Quote has Expired</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.quoteActions}>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => navigation.navigate('BookingChat', {
                            bookingId: requestId,
                            bookingNumber: quoteRequest?.requestNumber,
                            vendorName: quote.vendor?.businessName || 'Vendor',
                            bookingType: 'luxury',
                          })}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color={TEAL_MID} />
                          <Text style={styles.callBtnText}>Chat Vendor</Text>
                        </TouchableOpacity>

                        {quoteRequest.status !== 'ACCEPTED' && (
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => openAcceptModal(quote)}
                            disabled={acceptingQuote === quote.id}
                          >
                            <LinearGradient
                              colors={[TEAL_MID, '#047857']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.acceptGradient}
                            >
                              {acceptingQuote === quote.id ? (
                                <ActivityIndicator size="small" color="#FFF" />
                              ) : (
                                <>
                                  <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
                                  <Text style={styles.acceptBtnText}>Accept Quote</Text>
                                </>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
            })
          )}

          {/* Date Passed — Cannot Re-request */}
          {allQuotesExpired && !bookingDateInFuture && quoteRequest.status !== 'ACCEPTED' && (
            <View style={styles.datePastBanner}>
              <View style={styles.reRequestContent}>
                <Ionicons name="close-circle-outline" size={wp('8%')} color="#6B7280" />
                <View style={{ flex: 1, marginLeft: wp('3%') }}>
                  <Text style={styles.datePastTitle}>Booking Date Passed</Text>
                  <Text style={styles.datePastDesc}>
                    All quotes have expired and your pickup date
                    {quoteRequest.pickupDate
                      ? ` (${new Date(quoteRequest.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`
                      : ''
                    } has already passed. Re-requesting is no longer possible.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.newRequestBtn}
                onPress={() => navigation.navigate('LuxuryFleet')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#374151" />
                <Text style={styles.newRequestBtnText}>Create a New Request</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Re-request Banner */}
          {allQuotesExpired && bookingDateInFuture && quoteRequest.status !== 'ACCEPTED' && (
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Re-Request Modal */}
      <Modal
        visible={reRequestModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !reRequesting && setReRequestModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reReqModalCard}>

            {/* CONFIRM STATE */}
            {reRequestModal === 'confirm' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.reReqIconBg}>
                    <MaterialCommunityIcons name="refresh" size={wp('8%')} color="#D97706" />
                  </LinearGradient>
                </View>
                <Text style={styles.reReqTitle}>Re-request Quotes?</Text>
                <Text style={styles.reReqSubtitle}>
                  Vendors will be notified to send fresh quotes for your request.
                </Text>
                {/* Attempts indicator */}
                <View style={styles.reReqAttemptsBox}>
                  <View style={styles.reReqDots}>
                    {[1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[styles.reReqDot, i <= reRequestCount ? styles.reReqDotUsed : styles.reReqDotFree]}
                      />
                    ))}
                  </View>
                  <Text style={styles.reReqAttemptsText}>
                    {3 - reRequestCount} of 3 attempts remaining
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setReRequestModal(null)}
                    disabled={reRequesting}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reReqConfirmBtn}
                    onPress={confirmReRequest}
                    disabled={reRequesting}
                  >
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.reReqConfirmGradient}>
                      {reRequesting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="refresh" size={16} color="#FFF" />
                          <Text style={styles.reReqConfirmText}>Re-request</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* LIMIT REACHED STATE */}
            {reRequestModal === 'limit' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.reReqIconBg}>
                    <Ionicons name="ban" size={wp('8%')} color="#EF4444" />
                  </LinearGradient>
                </View>
                <Text style={styles.reReqTitle}>Limit Reached</Text>
                <Text style={styles.reReqSubtitle}>
                  You've used all 3 re-request attempts for this quote request. Please create a new request.
                </Text>
                <View style={styles.reReqDots}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={[styles.reReqDot, styles.reReqDotUsed]} />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.reReqCloseBtn}
                  onPress={() => setReRequestModal(null)}
                >
                  <Text style={styles.reReqCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

            {/* SUCCESS STATE */}
            {reRequestModal === 'success' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.reReqIconBg}>
                    <Ionicons name="checkmark-circle" size={wp('8%')} color="#059669" />
                  </LinearGradient>
                </View>
                <Text style={[styles.reReqTitle, { color: '#059669' }]}>Request Re-opened!</Text>
                <Text style={styles.reReqSubtitle}>
                  Vendors have been notified and will send fresh quotes within 48 hours.
                </Text>
                <TouchableOpacity
                  style={[styles.reReqCloseBtn, { backgroundColor: '#059669' }]}
                  onPress={() => setReRequestModal(null)}
                >
                  <Text style={[styles.reReqCloseBtnText, { color: '#FFF' }]}>Done</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ERROR STATE */}
            {reRequestModal === 'error' && (
              <>
                <View style={styles.reReqIconWrap}>
                  <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.reReqIconBg}>
                    <Ionicons name="alert-circle" size={wp('8%')} color="#EF4444" />
                  </LinearGradient>
                </View>
                <Text style={[styles.reReqTitle, { color: '#EF4444' }]}>Request Failed</Text>
                <Text style={styles.reReqSubtitle}>{reRequestError}</Text>
                <TouchableOpacity
                  style={[styles.reReqCloseBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => setReRequestModal(null)}
                >
                  <Text style={[styles.reReqCloseBtnText, { color: '#FFF' }]}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>

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
              colors={['#FFF', TEAL_LIGHT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              {/* Crown Icon */}
              <View style={styles.modalIconContainer}>
                <LinearGradient
                  colors={[TEAL_MID, '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIconBg}
                >
                  <MaterialCommunityIcons name="crown" size={wp('10%')} color="#FFF" />
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
                      <MaterialCommunityIcons name="cash" size={20} color={TEAL} />
                      <Text style={styles.modalTotalLabel}>Total Amount</Text>
                    </View>
                    <Text style={styles.modalTotalValue}>
                      {formatCurrency(selectedQuote.totalAmount)}
                    </Text>
                  </View>

                  {/* Advance Amount */}
                  {selectedQuote.advanceAmount > 0 && (
                    <View style={styles.modalAdvanceRow}>
                      <Ionicons name="information-circle" size={16} color={TEAL} />
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
                    colors={[TEAL_MID, '#047857']}
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
              colors={['#FFFFFF', TEAL_LIGHT, '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.successGradient}
            >
              {/* Success Icon with Animation */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIconOuter}>
                  <LinearGradient
                    colors={[TEAL, '#059669']}
                    style={styles.successIconBg}
                  >
                    <MaterialCommunityIcons name="check-circle" size={wp('14%')} color="#FFF" />
                  </LinearGradient>
                </View>
                {/* Confetti/Sparkles */}
                <View style={styles.sparkleContainer}>
                  <MaterialCommunityIcons name="star-four-points" size={20} color={TEAL} style={styles.sparkle1} />
                  <MaterialCommunityIcons name="star-four-points" size={16} color={TEAL_MID} style={styles.sparkle2} />
                  <MaterialCommunityIcons name="star-four-points" size={18} color="#047857" style={styles.sparkle3} />
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
                      <MaterialCommunityIcons name="ticket-confirmation" size={20} color={TEAL} />
                      <Text style={styles.successDetailLabel}>Booking ID</Text>
                    </View>
                    <Text style={styles.successDetailValue}>{successData.bookingNumber}</Text>
                  </View>

                  <View style={styles.successDivider} />

                  <View style={styles.successDetailRow}>
                    <View style={styles.successDetailLeft}>
                      <MaterialCommunityIcons name="cash-multiple" size={20} color={TEAL} />
                      <Text style={styles.successDetailLabel}>Total Amount</Text>
                    </View>
                    <Text style={styles.successTotalValue}>
                      {'\u20B9'}{successData.grandTotal?.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.successAdvanceBox}>
                    <View style={styles.successAdvanceHeader}>
                      <Ionicons name="wallet" size={18} color={TEAL_MID} />
                      <Text style={styles.successAdvanceTitle}>Advance Payment Required</Text>
                    </View>
                    <Text style={styles.successAdvanceAmount}>
                      {'\u20B9'}{successData.advanceAmount?.toLocaleString('en-IN')}
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
                  <Ionicons name="document-text-outline" size={20} color={TEAL_MID} />
                  <Text style={styles.successViewText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.successPayBtn}
                  onPress={handlePayNow}
                >
                  <LinearGradient
                    colors={[TEAL_MID, '#047857']}
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
      {/* Quote Details Modal */}
      <Modal
        visible={quoteDetailsVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseQuoteDetails}
      >
        <SafeAreaView style={styles.qdModalContainer} edges={['bottom']}>
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.qdModalHeader}>
            <View style={[styles.decoCircle, { top: -20, right: -10, width: 80, height: 80 }]} pointerEvents="none" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={styles.qdModalHeaderRow}>
              <TouchableOpacity onPress={handleCloseQuoteDetails} style={styles.backBtn}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Quote Details</Text>
              <View style={{ width: wp('9%') }} />
            </View>
            </SafeAreaView>
          </LinearGradient>

          {viewingQuote && (
            <ScrollView style={{ flex: 1, backgroundColor: BG }} showsVerticalScrollIndicator={false}>
              {/* Vendor Header */}
              <View style={styles.qdVendorCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.vendorAvatarCircle}>
                    <MaterialCommunityIcons name="store" size={wp('5%')} color={TEAL_MID} />
                  </View>
                  <View style={{ flex: 1, marginLeft: wp('3%') }}>
                    <Text style={styles.vendorName}>{viewingQuote.vendor?.businessName || 'Vendor'}</Text>
                    {viewingQuote.vendor?.rating > 0 && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{viewingQuote.vendor.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.quotePrice}>{formatCurrency(viewingQuote.totalAmount)}</Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.qdTabs}>
                {['overview', 'inclusions', 'exclusions', 'terms'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.qdTab, detailsTab === tab && styles.qdTabActive]}
                    onPress={() => setDetailsTab(tab)}
                  >
                    <Text style={[styles.qdTabText, detailsTab === tab && styles.qdTabTextActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content */}
              <View style={{ padding: wp('4%') }}>
                {/* Overview Tab */}
                {detailsTab === 'overview' && (
                  <View>
                    {/* Vehicle Details */}
                    <View style={styles.qdSection}>
                      <View style={styles.qdSectionHeader}>
                        <Ionicons name="car-outline" size={22} color={TEAL_MID} />
                        <Text style={styles.qdSectionTitle}>Vehicle Details</Text>
                      </View>
                      <View style={styles.qdCard}>
                        {viewingQuote.vehicleName && (
                          <DetailRow icon="car" label="Vehicle" value={viewingQuote.vehicleName} small />
                        )}
                        {viewingQuote.vehicleModel && (
                          <DetailRow icon="information" label="Model" value={viewingQuote.vehicleModel} small />
                        )}
                        {viewingQuote.vehicleNumber && (
                          <DetailRow icon="numeric" label="Number" value={viewingQuote.vehicleNumber} small />
                        )}
                        {!!viewingQuote.vehicleYear && (
                          <DetailRow icon="calendar" label="Year" value={viewingQuote.vehicleYear.toString()} small />
                        )}
                      </View>
                    </View>

                    {/* Chauffeur Details */}
                    {viewingQuote.driverName && (
                      <View style={styles.qdSection}>
                        <View style={styles.qdSectionHeader}>
                          <Ionicons name="person-outline" size={22} color={TEAL_MID} />
                          <Text style={styles.qdSectionTitle}>Chauffeur Details</Text>
                        </View>
                        <View style={styles.qdCard}>
                          <DetailRow icon="account" label="Name" value={viewingQuote.driverName} small />
                          {viewingQuote.driverPhone && (
                            <DetailRow icon="phone" label="Phone" value={viewingQuote.driverPhone} small />
                          )}
                          {viewingQuote.driverExperience > 0 && (
                            <DetailRow icon="certificate" label="Experience" value={`${viewingQuote.driverExperience} years`} small />
                          )}
                        </View>
                      </View>
                    )}

                    {/* Pricing Breakdown */}
                    <View style={styles.qdSection}>
                      <View style={styles.qdSectionHeader}>
                        <Ionicons name="cash-outline" size={22} color={TEAL_MID} />
                        <Text style={styles.qdSectionTitle}>Pricing Breakdown</Text>
                      </View>
                      <View style={styles.qdCard}>
                        {viewingQuote.baseAmount > 0 && <PriceRow label="Base Amount" value={viewingQuote.baseAmount} />}
                        {viewingQuote.chauffeurCharges > 0 && <PriceRow label="Chauffeur Charges" value={viewingQuote.chauffeurCharges} />}
                        {viewingQuote.decorationCharges > 0 && <PriceRow label="Decoration Charges" value={viewingQuote.decorationCharges} />}
                        {viewingQuote.fuelCharges > 0 && <PriceRow label="Fuel Charges" value={viewingQuote.fuelCharges} />}
                        {viewingQuote.tollEstimate > 0 && <PriceRow label="Toll (Est.)" value={viewingQuote.tollEstimate} />}
                        {viewingQuote.parkingEstimate > 0 && <PriceRow label="Parking (Est.)" value={viewingQuote.parkingEstimate} />}
                        {viewingQuote.nightHaltCharges > 0 && <PriceRow label="Night Halt" value={viewingQuote.nightHaltCharges} />}
                        {viewingQuote.gstAmount > 0 && <PriceRow label="GST" value={viewingQuote.gstAmount} />}
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Total Amount</Text>
                          <Text style={styles.totalValue}>{formatCurrency(viewingQuote.totalAmount)}</Text>
                        </View>
                        {viewingQuote.advanceAmount > 0 && (
                          <View style={styles.advanceRow}>
                            <Text style={styles.advanceLabel}>Advance to Pay</Text>
                            <Text style={styles.advanceValue}>{formatCurrency(viewingQuote.advanceAmount)}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Vendor Message */}
                    {viewingQuote.vendorMessage && (
                      <View style={styles.qdSection}>
                        <View style={styles.qdSectionHeader}>
                          <Ionicons name="chatbox-outline" size={22} color={TEAL_MID} />
                          <Text style={styles.qdSectionTitle}>Vendor Message</Text>
                        </View>
                        <View style={styles.qdCard}>
                          <Text style={styles.qdMessageText}>{viewingQuote.vendorMessage}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Inclusions Tab */}
                {detailsTab === 'inclusions' && (
                  <View style={styles.qdSection}>
                    <View style={styles.qdSectionHeader}>
                      <Ionicons name="checkmark-done-circle" size={22} color={TEAL_MID} />
                      <Text style={styles.qdSectionTitle}>What's Included</Text>
                    </View>
                    {(() => {
                      const inclusions = parseListData(viewingQuote.inclusions);
                      return inclusions.length > 0 ? (
                        <View style={styles.qdCard}>
                          {inclusions.map((item, idx) => (
                            <View key={idx} style={[styles.qdListItem, idx === inclusions.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                              <View style={styles.qdListBullet}>
                                <Ionicons name="checkmark" size={18} color={TEAL_MID} />
                              </View>
                              <Text style={styles.qdListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.qdEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
                          <Text style={styles.qdEmptyText}>No inclusions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Exclusions Tab */}
                {detailsTab === 'exclusions' && (
                  <View style={styles.qdSection}>
                    <View style={styles.qdSectionHeader}>
                      <Ionicons name="close-circle" size={22} color="#e74c3c" />
                      <Text style={styles.qdSectionTitle}>What's Not Included</Text>
                    </View>
                    {(() => {
                      const exclusions = parseListData(viewingQuote.exclusions);
                      return exclusions.length > 0 ? (
                        <View style={styles.qdCard}>
                          {exclusions.map((item, idx) => (
                            <View key={idx} style={[styles.qdListItem, idx === exclusions.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                              <View style={[styles.qdListBullet, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="close" size={18} color="#e74c3c" />
                              </View>
                              <Text style={styles.qdListText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.qdEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
                          <Text style={styles.qdEmptyText}>No exclusions specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Terms Tab */}
                {detailsTab === 'terms' && (
                  <View style={styles.qdSection}>
                    <View style={styles.qdSectionHeader}>
                      <Ionicons name="document-text" size={22} color={TEAL_MID} />
                      <Text style={styles.qdSectionTitle}>Terms & Conditions</Text>
                    </View>
                    {(() => {
                      const terms = parseListData(viewingQuote.termsConditions || viewingQuote.terms);
                      if (terms.length > 1) {
                        return (
                          <View style={styles.qdCard}>
                            {terms.map((item, idx) => (
                              <View key={idx} style={[styles.qdListItem, idx === terms.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                                <View style={[styles.qdListBullet, { backgroundColor: TEAL_LIGHT }]}>
                                  <Text style={{ fontSize: wp('3%'), fontWeight: '700', color: TEAL_MID }}>{idx + 1}</Text>
                                </View>
                                <Text style={styles.qdListText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      if (terms.length === 1 || viewingQuote.termsConditions || viewingQuote.terms) {
                        return (
                          <View style={styles.qdCard}>
                            <Text style={styles.qdMessageText}>
                              {terms.length === 1 ? terms[0] : (viewingQuote.termsConditions || viewingQuote.terms)}
                            </Text>
                          </View>
                        );
                      }
                      return (
                        <View style={styles.qdEmptyState}>
                          <Ionicons name="document-text-outline" size={40} color={TEXT_MUTED} />
                          <Text style={styles.qdEmptyText}>No terms specified</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>

              {/* Bottom Accept Button */}
              {quoteRequest?.status !== 'ACCEPTED' && viewingQuote.status !== 'ACCEPTED' && (
                <View style={{ paddingHorizontal: wp('4%'), paddingBottom: hp('4%') }}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => {
                      handleCloseQuoteDetails();
                      openAcceptModal(viewingQuote);
                    }}
                  >
                    <LinearGradient
                      colors={[TEAL_MID, '#047857']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.acceptGradient}
                    >
                      <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
                      <Text style={styles.acceptBtnText}>Accept This Quote</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Helper Components
const DetailRow = ({ icon, label, value, valueColor, small }) => (
  <View style={[styles.detailRow, small && styles.detailRowSmall]}>
    <View style={styles.detailLabelWrap}>
      <MaterialCommunityIcons name={icon} size={small ? 14 : 16} color={TEXT_SECONDARY} />
      <Text style={[styles.detailLabelText, small && styles.detailLabelTextSmall]}>{label}</Text>
    </View>
    <Text style={[styles.detailValueText, valueColor && { color: valueColor }, small && styles.detailValueSmall]}>
      {value}
    </Text>
  </View>
);

const PriceRow = ({ label, value }) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceLabelText}>{label}</Text>
    <Text style={styles.priceValueText}>{'\u20B9'}{value.toLocaleString('en-IN')}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Gradient Header
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1%'),
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
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
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  emptyDesc: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    fontSize: wp('3.3%'),
    lineHeight: wp('5%'),
    marginBottom: hp('2%'),
  },
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
  refreshBtnText: {
    color: TEAL_MID,
    fontWeight: '700',
    fontSize: wp('3.3%'),
  },

  // Scroll content
  content: {
    flex: 1,
  },

  // Summary card
  summaryCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('5%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  summaryIconRow: {
    marginBottom: hp('1%'),
  },
  crownCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
    textAlign: 'center',
  },
  summaryTripBadge: {
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  summaryTripText: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('3%'),
    marginTop: hp('0.5%'),
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  summaryItemText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRowSmall: {
    paddingVertical: hp('0.7%'),
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    flex: 1,
  },
  detailLabelText: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  detailLabelTextSmall: {
    fontSize: wp('3%'),
  },
  detailValueText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  detailValueSmall: {
    fontSize: wp('3%'),
  },

  // Location
  locationSection: {
    paddingVertical: hp('0.5%'),
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

  requirementsText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
  },

  // Quotes section
  quotesSection: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
  },
  quotesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  quotesCountBadge: {
    backgroundColor: TEAL + '25',
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotesCountText: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL_MID,
  },

  // No quotes
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

  // Quote card
  quoteCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4%'),
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorImage: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    marginRight: wp('3%'),
  },
  vendorAvatarCircle: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
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
  vendorCity: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
  },
  quotePriceContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  priceLabel: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  quotePrice: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  quoteExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: wp('4%'),
    paddingTop: wp('3%'),
  },
  quoteSection: {
    marginBottom: hp('1.5%'),
  },
  quoteSectionTitle: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL_MID,
    marginBottom: hp('1%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('0.6%'),
  },
  priceLabelText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
  },
  priceValueText: {
    fontSize: wp('3%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: hp('1.2%'),
    marginTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('0.8%'),
    paddingTop: hp('0.8%'),
    borderTopWidth: 1,
    borderTopColor: TEAL + '30',
  },
  advanceLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEAL,
  },
  advanceValue: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEAL,
  },
  notesText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.5%'),
  },
  quoteActions: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginTop: hp('0.5%'),
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: TEAL + '40',
    gap: wp('1.5%'),
  },
  callBtnText: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  acceptBtn: {
    flex: 1,
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    gap: wp('1.5%'),
  },
  acceptBtnText: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: '#FFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: wp('5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  modalGradient: {
    padding: wp('5%'),
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  modalIconBg: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: TEAL_MID,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  modalTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: hp('0.3%'),
  },
  modalSubtitle: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('2.5%'),
  },
  modalQuoteCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    flex: 1,
  },
  modalLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  modalValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    maxWidth: '50%',
    textAlign: 'right',
  },
  modalTotalRow: {
    paddingTop: hp('1.2%'),
    marginTop: hp('0.5%'),
    borderTopWidth: 2,
    borderTopColor: TEAL + '30',
    marginBottom: 0,
  },
  modalTotalLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modalTotalValue: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  modalAdvanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    marginTop: hp('1.2%'),
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: TEAL + '30',
  },
  modalAdvanceText: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: TEAL_MID,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  modalConfirmGradient: {
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  modalConfirmText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#FFF',
  },

  // Success Modal Styles
  successModalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: wp('5%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  successGradient: {
    padding: wp('5%'),
    alignItems: 'center',
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: hp('2%'),
  },
  successIconOuter: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('14%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('2%'),
  },
  successIconBg: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: wp('32%'),
    height: wp('32%'),
    left: -wp('2%'),
    top: -wp('2%'),
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
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    lineHeight: wp('5%'),
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  successDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    flex: 1,
  },
  successDetailLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  successDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: hp('1%'),
  },
  successTotalValue: {
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: TEAL,
  },
  successAdvanceBox: {
    marginTop: hp('1.5%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 2,
    borderColor: TEAL,
    borderStyle: 'dashed',
  },
  successAdvanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('0.8%'),
  },
  successAdvanceTitle: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  successAdvanceAmount: {
    fontSize: wp('6.5%'),
    fontWeight: '800',
    color: TEAL_MID,
    marginBottom: hp('0.3%'),
  },
  successAdvanceHint: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  successActions: {
    flexDirection: 'row',
    gap: wp('3%'),
    width: '100%',
  },
  successViewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    backgroundColor: '#FFF',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: TEAL,
  },
  successViewText: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  successPayBtn: {
    flex: 1.5,
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: TEAL_MID,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  successPayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    paddingVertical: hp('1.8%'),
  },
  successPayText: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: '#FFF',
  },

  // --- View Full Details Button ---
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.3%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL + '15',
    borderWidth: 1,
    borderColor: TEAL + '35',
    gap: wp('1.5%'),
  },
  viewDetailsBtnText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEAL_MID,
  },

  // --- Quote Details Modal ---
  qdModalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  qdModalHeader: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  qdModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qdVendorCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    padding: wp('4%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  qdTabs: {
    flexDirection: 'row',
    backgroundColor: CARD,
    marginTop: hp('1.5%'),
    paddingHorizontal: wp('2%'),
    paddingTop: hp('0.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qdTab: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  qdTabActive: {
    borderBottomColor: TEAL,
  },
  qdTabText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  qdTabTextActive: {
    color: TEAL,
  },
  qdSection: {
    marginBottom: hp('2%'),
  },
  qdSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
    gap: wp('2%'),
  },
  qdSectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  qdCard: {
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  qdListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  qdListBullet: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('3.75%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    marginTop: hp('0.2%'),
  },
  qdListText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    lineHeight: wp('5.5%'),
    flex: 1,
    paddingTop: hp('0.3%'),
  },
  qdMessageText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5.5%'),
  },
  qdEmptyState: {
    backgroundColor: CARD,
    padding: wp('10%'),
    borderRadius: wp('3.5%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  qdEmptyText: {
    fontSize: wp('3.5%'),
    color: TEXT_MUTED,
    marginTop: hp('1.5%'),
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
  datePastBanner: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginTop: wp('3%'),
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  datePastTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#374151',
  },
  datePastDesc: {
    fontSize: wp('3.2%'),
    color: '#6B7280',
    marginTop: 2,
    lineHeight: wp('4.8%'),
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#E5E7EB',
    gap: wp('2%'),
  },
  newRequestBtnText: {
    color: '#374151',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },
  quoteCardExpired: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    opacity: 0.85,
  },
  expiredTopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: hp('0.6%'),
    gap: wp('1.5%'),
  },
  expiredTopBannerText: {
    color: '#FFF',
    fontSize: wp('3%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // --- Re-Request Modal ---
  reReqModalCard: {
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
  reReqIconWrap: {
    marginBottom: hp('2%'),
  },
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
  reReqDots: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('0.8%'),
  },
  reReqDot: {
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
  },
  reReqDotFree: {
    backgroundColor: '#FDE68A',
  },
  reReqDotUsed: {
    backgroundColor: '#EF4444',
  },
  reReqAttemptsText: {
    fontSize: wp('3%'),
    color: '#92400E',
    fontWeight: '600',
  },
  reReqConfirmBtn: {
    flex: 1,
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  reReqConfirmGradient: {
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  reReqConfirmText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#FFF',
  },
  reReqCloseBtn: {
    width: '100%',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  reReqCloseBtnText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },

  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: wp('2%'),
    padding: wp('2%'),
    gap: wp('1.5%'),
  },
  expiredText: {
    color: '#EF4444',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
});

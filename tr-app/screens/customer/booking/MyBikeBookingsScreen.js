import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width } = Dimensions.get('window');

/* ── Tab config ───────────────────────────── */
const TABS = [
  { key: 'quotes', label: 'Quote Requests', icon: 'document-text-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'bicycle-outline' },
];

export default function MyBikeBookingsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('quotes');
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ── StatusBar management ─────────────── */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, [])
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const customerData = await AsyncStorage.getItem('customer');
      const customer = customerData ? JSON.parse(customerData) : {};

      console.log('\u{1F4F1} Fetching with params:', {
        customerId,
        phone: customer.phone,
        email: customer.email,
      });

      // Fetch quote requests
      const quoteRes = await api.get('/bike-quote-requests', {
        params: { customerId, phone: customer.phone, email: customer.email }
      });
      if (quoteRes.data.success) {
        setQuoteRequests(quoteRes.data.requests || []);
      }

      // Fetch bookings
      const bookingRes = await api.get('/bike-bookings', {
        params: { customerId, phone: customer.phone, email: customer.email }
      });
      console.log('\u{1F6B4} Bike Bookings Response:', bookingRes.data);
      console.log('\u{1F6B4} Bookings Array:', bookingRes.data.bookings);
      console.log('\u{1F6B4} Bookings Count:', bookingRes.data.bookings?.length || 0);
      if (bookingRes.data.success) {
        setBookings(bookingRes.data.bookings || []);
      }
    } catch (err) {
      console.log('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
      case 'CONFIRMED':
        return TEAL;
      case 'COMPLETED':
        return '#27ae60';
      case 'CANCELLED':
      case 'EXPIRED':
      case 'DROPPED':
        return '#e74c3c';
      case 'PENDING_PAYMENT':
        return '#f39c12';
      case 'BROADCASTED':
        return '#9b59b6';
      case 'IN_PROGRESS':
        return '#2980b9';
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
      case 'PENDING_PAYMENT':
        return 'Payment Pending';
      case 'BROADCASTED':
        return 'Finding Vendors';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'EXPIRED':
        return 'Expired';
      case 'DROPPED':
        return 'Dropped';
      default:
        return status;
    }
  };

  /* ── Gradient Header Component ────────── */
  const renderHeader = () => (
    <LinearGradient
      colors={[TEAL_DEEP, TEAL_MID, '#047857']}
      style={styles.headerGrad}
    >
      <View style={[styles.decoCircle, { top: -30, right: -20, width: wp('25%'), height: wp('25%') }]} pointerEvents="none" />
      <View style={[styles.decoCircle, { bottom: -15, left: -15, width: wp('15%'), height: wp('15%') }]} pointerEvents="none" />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bike Rentals</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
          <Ionicons name="refresh" size={wp('4.5%')} color="#FFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  /* ── Quote Request Card ───────────────── */
  const renderQuoteRequestCard = (request) => (
    <TouchableOpacity
      key={request.id}
      style={styles.card}
      onPress={() => navigation.navigate('BikeQuoteRequestDetail', { requestId: request.id })}
      activeOpacity={0.7}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: getStatusColor(request.status) }]} />

      <View style={styles.cardInner}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="bicycle" size={wp('5.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.requestNumber}>#{request.requestNumber}</Text>
              <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {getStatusLabel(request.status)}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleBrand}>{request.vehicleBrand || 'Any Brand'}</Text>
            <Text style={styles.vehicleName}>{request.vehicleModelName || request.vehicleCategoryName || 'Any Bike'}</Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={styles.locationDotWrap}>
                <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Location</Text>
                <Text style={styles.locationText} numberOfLines={1}>{request.locationName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripDurationRow}>
            <View style={styles.tripDurationIconCircle}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.tripDurationText}>
              {request.totalDays} Day{request.totalDays > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEXT_MUTED} />
              <View style={styles.dateItemContent}>
                <Text style={styles.dateLabel}>Pickup</Text>
                <Text style={styles.dateValue}>{formatDate(request.pickupDate)}</Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEXT_MUTED} />
              <View style={styles.dateItemContent}>
                <Text style={styles.dateLabel}>Drop</Text>
                <Text style={styles.dateValue}>{formatDate(request.dropDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quotes Section */}
        {request.quotes && request.quotes.length > 0 && (
          <View style={styles.quotesSection}>
            <View style={styles.quotesIconCircle}>
              <Ionicons name="chatbubbles-outline" size={wp('4%')} color={TEAL} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quotesTitle}>
                {request.quotes.length} Quote{request.quotes.length > 1 ? 's' : ''} Received
              </Text>
              <View style={styles.quotesList}>
                {request.quotes.slice(0, 2).map((quote) => (
                  <View key={quote.id} style={styles.quoteItem}>
                    <View style={styles.quoteVendor}>
                      <Text style={styles.quoteVendorName}>{quote.vendor?.businessName || 'Vendor'}</Text>
                      {quote.vendor?.rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={wp('2.8%')} color="#f39c12" />
                          <Text style={styles.ratingText}>{quote.vendor.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.quotePrice}>{'\u20B9'}{quote.grandTotal}</Text>
                  </View>
                ))}
                {request.quotes.length > 2 && (
                  <Text style={styles.moreQuotes}>+{request.quotes.length - 2} more</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEAL} />
          </View>
        )}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <View style={styles.viewDetailsArrow}>
            <Ionicons name="chevron-forward" size={wp('3.5%')} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ── Booking Card ─────────────────────── */
  const renderBookingCard = (booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.card}
      onPress={() => navigation.navigate('BikeBookingDetail', { bookingId: booking.id })}
      activeOpacity={0.7}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: getStatusColor(booking.status) }]} />

      <View style={styles.cardInner}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="bicycle" size={wp('5.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.requestNumber}>#{booking.bookingNumber}</Text>
              <Text style={styles.dateText}>{formatDate(booking.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {getStatusLabel(booking.status)}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleBrand}>{booking.vehicleBrand || ''}</Text>
            <Text style={styles.vehicleName}>{booking.vehicleName || 'Bike'}</Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={styles.locationDotWrap}>
                <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Location</Text>
                <Text style={styles.locationText} numberOfLines={1}>{booking.locationName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripDurationRow}>
            <View style={styles.tripDurationIconCircle}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.tripDurationText}>
              {booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEXT_MUTED} />
              <View style={styles.dateItemContent}>
                <Text style={styles.dateLabel}>Pickup</Text>
                <Text style={styles.dateValue}>{formatDate(booking.pickupDate)}</Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEXT_MUTED} />
              <View style={styles.dateItemContent}>
                <Text style={styles.dateLabel}>Drop</Text>
                <Text style={styles.dateValue}>{formatDate(booking.dropDate)}</Text>
              </View>
            </View>
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>
              <Text style={styles.priceCurrency}>{'\u20B9'}</Text>
              {booking.grandTotal}
            </Text>
          </View>

          {/* Vendor Row */}
          {booking.vendor && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="storefront-outline" size={wp('3.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.infoRowText}>{booking.vendor.name}</Text>
            </View>
          )}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <View style={styles.viewDetailsArrow}>
            <Ionicons name="chevron-forward" size={wp('3.5%')} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ── Empty State ──────────────────────── */
  const renderEmpty = (type) => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={[TEAL_LIGHT, '#A7F3D0']}
        style={styles.emptyIconCircle}
      >
        <View style={styles.emptyIconInner}>
          <Ionicons
            name={type === 'quotes' ? 'document-text-outline' : 'bicycle-outline'}
            size={wp('10%')}
            color={TEAL}
          />
        </View>
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {type === 'quotes' ? 'No Quote Requests' : 'No Bookings Yet'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'quotes'
          ? 'Your bike rental requests will appear here'
          : 'Your confirmed bike bookings will appear here'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtnWrap}
        onPress={() => navigation.navigate('BikeRentalScreen')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[TEAL_MID, TEAL_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.exploreBtn}
        >
          <Ionicons name="bicycle-outline" size={wp('4.5%')} color="#FFF" />
          <Text style={styles.exploreBtnText}>Explore Bikes</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  /* ── Loading State ────────────────────── */
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />
        <LinearGradient
          colors={[TEAL_DEEP, TEAL_MID, '#047857']}
          style={styles.headerGrad}
        >
          <View style={[styles.decoCircle, { top: -30, right: -20, width: wp('25%'), height: wp('25%') }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: wp('15%'), height: wp('15%') }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Bike Rentals</Text>
            <View style={styles.headerIconBtn} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Main Render ──────────────────────── */
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {renderHeader()}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.key === 'quotes' ? quoteRequests.length : bookings.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={wp('4.2%')}
                color={isActive ? '#FFF' : TEXT_SECONDARY}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />
        }
      >
        {activeTab === 'quotes' ? (
          quoteRequests.length > 0 ? (
            quoteRequests.map(renderQuoteRequestCard)
          ) : (
            renderEmpty('quotes')
          )
        ) : (
          bookings.length > 0 ? (
            bookings.map(renderBookingCard)
          ) : (
            renderEmpty('bookings')
          )
        )}
        <View style={{ height: hp('5%') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════ */
const styles = StyleSheet.create({
  /* ── Container ───────────────────────── */
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Header Gradient ─────────────────── */
  headerGrad: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('1%'),
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  headerIconBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Loading ─────────────────────────── */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('1.5%'),
    color: TEXT_SECONDARY,
    fontSize: wp('3.5%'),
    fontWeight: '500',
  },

  /* ── Tabs ─────────────────────────────── */
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.8%'),
    paddingBottom: hp('0.8%'),
    gap: wp('2.5%'),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.3%'),
    borderRadius: wp('3%'),
    backgroundColor: CARD,
    gap: wp('1.5%'),
    ...SHADOW_SM,
  },
  tabActive: {
    backgroundColor: TEAL_MID,
  },
  tabText: {
    fontSize: wp('3.1%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  tabTextActive: {
    color: '#FFF',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('3%'),
    minWidth: wp('5.5%'),
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  tabBadgeTextActive: {
    color: '#FFF',
  },

  /* ── Content ─────────────────────────── */
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
  },

  /* ── Card ─────────────────────────────── */
  card: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.8%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  cardAccent: {
    width: wp('1.2%'),
    borderTopLeftRadius: wp('4%'),
    borderBottomLeftRadius: wp('4%'),
  },
  cardInner: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('3.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  iconCircle: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestNumber: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateText: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },

  /* ── Status Badge ────────────────────── */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('4%'),
    gap: wp('1.2%'),
  },
  statusDot: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    borderRadius: wp('0.75%'),
  },
  statusText: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
  },

  /* ── Card Body ───────────────────────── */
  cardBody: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.5%'),
  },
  vehicleRow: {
    marginBottom: hp('0.8%'),
  },
  vehicleBrand: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleName: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('0.2%'),
  },

  /* ── Location ────────────────────────── */
  locationSection: {
    marginBottom: hp('1.2%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDotWrap: {
    width: wp('5%'),
    alignItems: 'center',
    paddingTop: hp('0.5%'),
  },
  locationDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
  },
  locationInfo: {
    flex: 1,
    marginLeft: wp('2%'),
  },
  locationLabel: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  locationText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    marginTop: hp('0.2%'),
    fontWeight: '500',
  },

  /* ── Trip Duration Row ─────────────────── */
  tripDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.2%'),
  },
  tripDurationIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDurationText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  /* ── Date Row ────────────────────────── */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2.5%'),
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  dateItemContent: {
    flex: 1,
  },
  dateDivider: {
    width: 1,
    height: hp('3%'),
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp('3%'),
  },
  dateLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: hp('0.1%'),
  },

  /* ── Price Row ───────────────────────── */
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('1%'),
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEAL_DEEP,
  },
  priceCurrency: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },

  /* ── Info Rows (Vendor) ────────────────── */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginTop: hp('1%'),
  },
  infoIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRowText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },

  /* ── Quotes Section ──────────────────── */
  quotesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('3.5%'),
    marginHorizontal: wp('3.5%'),
    marginBottom: hp('1%'),
    borderRadius: wp('2.5%'),
    gap: wp('2%'),
  },
  quotesIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotesTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_DEEP,
    marginBottom: hp('0.5%'),
  },
  quotesList: {},
  quoteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('2%'),
    marginBottom: hp('0.4%'),
  },
  quoteVendor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  quoteVendorName: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: wp('1.5%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('1.5%'),
    gap: wp('0.5%'),
  },
  ratingText: {
    fontSize: wp('2.6%'),
    color: '#f39c12',
    fontWeight: '600',
  },
  quotePrice: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEAL_DEEP,
  },
  moreQuotes: {
    textAlign: 'center',
    color: TEAL,
    fontSize: wp('2.8%'),
    fontWeight: '600',
    marginTop: hp('0.3%'),
  },

  /* ── Card Footer ─────────────────────── */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: wp('2%'),
  },
  viewDetailsText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEAL,
  },
  viewDetailsArrow: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Empty State ─────────────────────── */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
  },
  emptyIconCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconInner: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('2.5%'),
  },
  emptyText: {
    fontSize: wp('3.3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.8%'),
    textAlign: 'center',
    paddingHorizontal: wp('10%'),
    lineHeight: wp('5%'),
  },
  exploreBtnWrap: {
    marginTop: hp('3%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('1.6%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  exploreBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: wp('3.5%'),
    letterSpacing: 0.3,
  },
});

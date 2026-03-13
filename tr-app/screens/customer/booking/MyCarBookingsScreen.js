import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import bookingService from '../../services/bookingService';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../../theme';

/* ── Shadow constants ─────────────────────── */
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 5 },
});

/* ── Tab config ───────────────────────────── */
const TABS = [
  { key: 'quotes', label: 'Quote Requests', icon: 'document-text-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'car-outline' },
];

export default function MyCarBookingsScreen() {
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

  /* ── Fetch data on focus ──────────────── */
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const response = await bookingService.getChauffeurBookings();
      if (response.success || response.bookings || response.quoteRequests) {
        setQuoteRequests(response.quoteRequests || []);
        setBookings(response.bookings || []);
      }
    } catch (err) {
      console.log('Error fetching car bookings:', err);
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
      case 'PENDING': return '#f39c12';
      case 'QUOTES_RECEIVED': return '#3498db';
      case 'ACCEPTED':
      case 'CONFIRMED': return TEAL;
      case 'COMPLETED': return '#27ae60';
      case 'CANCELLED':
      case 'EXPIRED':
      case 'DROPPED': return '#e74c3c';
      case 'PENDING_PAYMENT': return '#f39c12';
      case 'IN_PROGRESS': return '#2980b9';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Awaiting Quotes';
      case 'QUOTES_RECEIVED': return 'Quotes Received';
      case 'ACCEPTED': return 'Quote Accepted';
      case 'PENDING_PAYMENT': return 'Payment Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      case 'DROPPED': return 'Dropped';
      default: return status;
    }
  };

  const getTripTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'local': return 'map-marker-radius';
      case 'outstation': return 'road-variant';
      case 'airport': return 'airplane';
      default: return 'car';
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
        <Text style={styles.headerTitle}>My Car Rentals</Text>
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
      onPress={() => navigation.navigate('CarQuoteRequestDetail', { requestId: request.id })}
      activeOpacity={0.7}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: getStatusColor(request.status) }]} />

      <View style={styles.cardInner}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={getTripTypeIcon(request.tripType)} size={wp('5.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.requestNumber}>#{request.requestNumber || request.id}</Text>
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
          <View style={styles.tripTypeRow}>
            <View style={styles.tripTypeBadge}>
              <Text style={styles.tripTypeBadgeText}>{request.tripType?.toUpperCase() || 'LOCAL'}</Text>
            </View>
            <Text style={styles.vehicleCategory}>{request.vehicleCategory || 'Sedan'}</Text>
          </View>

          {request.withAC !== undefined && (
            <View style={styles.acRow}>
              <MaterialCommunityIcons
                name={request.withAC ? 'snowflake' : 'fan'}
                size={wp('4%')}
                color={request.withAC ? '#3498db' : TEXT_SECONDARY}
              />
              <Text style={styles.acText}>{request.withAC ? 'With AC' : 'Non-AC'}</Text>
            </View>
          )}

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={styles.locationDotWrap}>
                <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {request.pickupCity || request.pickupAddress || 'N/A'}
                </Text>
              </View>
            </View>
            {request.dropCity && (
              <>
                <View style={styles.locationConnector} />
                <View style={styles.locationRow}>
                  <View style={styles.locationDotWrap}>
                    <View style={[styles.locationDot, { backgroundColor: '#e74c3c' }]} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Drop</Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {request.dropCity || request.dropAddress}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={wp('3.5%')} color={TEXT_MUTED} />
              <View style={styles.dateItemContent}>
                <Text style={styles.dateLabel}>Date</Text>
                <Text style={styles.dateValue}>{formatDate(request.pickupDate)}</Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Ionicons name="time-outline" size={wp('3.5%')} color={TEXT_MUTED} />
              <View style={styles.dateItemContent}>
                <Text style={styles.dateLabel}>Time</Text>
                <Text style={styles.dateValue}>{request.pickupTime || '--:--'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quotes Received Section */}
        {request.quotes && request.quotes.length > 0 && (
          <View style={styles.quotesSection}>
            <View style={styles.quotesIconCircle}>
              <Ionicons name="chatbubbles-outline" size={wp('4%')} color={TEAL} />
            </View>
            <Text style={styles.quotesTitle}>
              {request.quotes.length} Quote{request.quotes.length > 1 ? 's' : ''} Received
            </Text>
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
      onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id, bookingType: 'car' })}
      activeOpacity={0.7}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: getStatusColor(booking.status) }]} />

      <View style={styles.cardInner}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={getTripTypeIcon(booking.tripType)} size={wp('5.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.requestNumber}>#{booking.bookingNumber || booking.id}</Text>
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
          <View style={styles.tripTypeRow}>
            <View style={styles.tripTypeBadge}>
              <Text style={styles.tripTypeBadgeText}>{booking.tripType?.toUpperCase() || 'LOCAL'}</Text>
            </View>
            <Text style={styles.vehicleCategory}>{booking.vehicleCategory || 'Sedan'}</Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={styles.locationDotWrap}>
                <View style={[styles.locationDot, { backgroundColor: TEAL }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {booking.pickupCity || booking.pickupAddress || 'N/A'}
                </Text>
              </View>
            </View>
            {booking.dropCity && (
              <>
                <View style={styles.locationConnector} />
                <View style={styles.locationRow}>
                  <View style={styles.locationDotWrap}>
                    <View style={[styles.locationDot, { backgroundColor: '#e74c3c' }]} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Drop</Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {booking.dropCity || booking.dropAddress}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>
              <Text style={styles.priceCurrency}>₹</Text>
              {booking.totalAmount || booking.grandTotal || 0}
            </Text>
          </View>

          {/* Driver Row */}
          {booking.driver && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <MaterialCommunityIcons name="account-tie" size={wp('3.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.infoRowText}>{booking.driver.name || 'Driver Assigned'}</Text>
            </View>
          )}

          {/* Vendor Row */}
          {booking.vendor && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="storefront-outline" size={wp('3.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.infoRowText}>{booking.vendor.businessName || booking.vendor.name}</Text>
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
            name={type === 'quotes' ? 'document-text-outline' : 'car-outline'}
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
          ? 'Your car rental requests will appear here'
          : 'Your confirmed car bookings will appear here'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtnWrap}
        onPress={() => navigation.navigate('CarRentalScreen')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[TEAL_MID, TEAL_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.exploreBtn}
        >
          <Ionicons name="car-sport-outline" size={wp('4.5%')} color="#FFF" />
          <Text style={styles.exploreBtnText}>Book a Car</Text>
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
            <Text style={styles.headerTitle}>My Car Rentals</Text>
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
          quoteRequests.length > 0 ? quoteRequests.map(renderQuoteRequestCard) : renderEmpty('quotes')
        ) : (
          bookings.length > 0 ? bookings.map(renderBookingCard) : renderEmpty('bookings')
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
  tripTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: wp('3%'),
  },
  tripTypeBadge: {
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('2%'),
  },
  tripTypeBadgeText: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
    color: TEAL_MID,
    letterSpacing: 0.5,
  },
  vehicleCategory: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  acRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.2%'),
  },
  acText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
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
  locationConnector: {
    width: 2,
    height: hp('1.5%'),
    backgroundColor: '#D1D5DB',
    marginLeft: wp('2.3%'),
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

  /* ── Quotes Section ──────────────────── */
  quotesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingVertical: hp('1%'),
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
    flex: 1,
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_DEEP,
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

  /* ── Info Rows (Driver / Vendor) ─────── */
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

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import bookingService from '../../services/bookingService';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const TABS = [
  { key: 'quotes', label: 'Quote Requests', icon: 'document-text-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'car-sport' },
];

export default function MyLuxuryBookingsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('quotes');
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const customerData = await AsyncStorage.getItem('customer');
      const customer = customerData ? JSON.parse(customerData) : null;

      // Fetch both quote requests and bookings in parallel
      const [quotesRes, bookingsRes] = await Promise.all([
        api.get('/customer/luxury-quote-requests', {
          params: {
            customer_id: customer?.id,
            email: customer?.email,
            phone: customer?.phone,
          },
        }).catch(() => ({ data: { requests: [] } })),
        bookingService.getLuxuryBookings().catch(() => ({ bookings: [] })),
      ]);

      setQuoteRequests(quotesRes.data?.requests || []);
      setBookings(bookingsRes.bookings || []);
    } catch (err) {
      console.log('Error fetching luxury bookings:', err);
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

  const renderHeader = () => (
    <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
      <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
      <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
      <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Luxury Bookings</Text>
          <Text style={styles.headerSub}>Premium Car Rentals</Text>
        </View>
        <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar inside header */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={wp('4%')}
              color={activeTab === tab.key ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                {tab.key === 'quotes' ? quoteRequests.length : bookings.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );

  const renderQuoteRequestCard = (request) => (
    <TouchableOpacity
      key={request.id}
      style={styles.card}
      onPress={() => navigation.navigate('LuxuryQuoteDetail', { requestId: request.id })}
      activeOpacity={0.7}
    >
      <View style={styles.luxuryBadge}>
        <MaterialCommunityIcons name="crown" size={12} color="#fff" />
        <Text style={styles.luxuryBadgeText}>LUXURY</Text>
      </View>

      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="car-sports" size={wp('5.5%')} color={TEAL_MID} />
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

      <View style={styles.cardBody}>
        <View style={styles.serviceRow}>
          <Text style={styles.vehicleCategory}>{request.vehicleCategory || 'Luxury Car'}</Text>
          {request.serviceType && (
            <View style={styles.serviceTypeBadge}>
              <Text style={styles.serviceTypeBadgeText}>{request.serviceType?.replace('-', ' ').toUpperCase()}</Text>
            </View>
          )}
        </View>

        {request.withChauffeur && (
          <View style={styles.chauffeurRow}>
            <MaterialCommunityIcons name="account-tie" size={wp('4%')} color={TEAL_MID} />
            <Text style={styles.chauffeurText}>With Chauffeur</Text>
          </View>
        )}

        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText} numberOfLines={1}>
              {request.pickupCity || request.pickupAddress || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Date</Text>
            <Text style={styles.dateValue}>{formatDate(request.pickupDate)}</Text>
          </View>
          {request.tripType && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Type</Text>
              <Text style={styles.dateValue}>{request.tripType}</Text>
            </View>
          )}
        </View>

        {request.occasionType && (
          <View style={styles.occasionRow}>
            <MaterialCommunityIcons name="party-popper" size={wp('4%')} color="#e74c3c" />
            <Text style={styles.occasionText}>{request.occasionType}</Text>
          </View>
        )}
      </View>

      {request.quotes && request.quotes.length > 0 && (
        <View style={styles.quotesSection}>
          <View style={styles.quotesHeader}>
            <Text style={styles.quotesTitle}>
              {request.quotes.length} Quote{request.quotes.length > 1 ? 's' : ''} Received
            </Text>
            <Ionicons name="chevron-forward" size={18} color={TEAL_MID} />
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={TEAL_MID} />
      </View>
    </TouchableOpacity>
  );

  const renderBookingCard = (booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.card}
      onPress={() => navigation.navigate('LuxuryBookingDetail', { bookingId: booking.id })}
      activeOpacity={0.7}
    >
      <View style={styles.luxuryBadge}>
        <MaterialCommunityIcons name="crown" size={12} color="#fff" />
        <Text style={styles.luxuryBadgeText}>LUXURY</Text>
      </View>

      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="car-sports" size={wp('5.5%')} color={TEAL_MID} />
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

      <View style={styles.cardBody}>
        <View style={styles.serviceRow}>
          <Text style={styles.vehicleCategory}>{booking.vehicleCategory || 'Luxury Car'}</Text>
          {booking.vehicleName && (
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Total Amount</Text>
          <Text style={styles.priceValue}>{'\u20B9'}{booking.totalAmount || booking.grandTotal || 0}</Text>
        </View>

        {booking.vendor && (
          <View style={styles.vendorRow}>
            <View style={styles.vendorIconCircle}>
              <Ionicons name="storefront-outline" size={wp('3.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.vendorName}>{booking.vendor.businessName || booking.vendor.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={TEAL_MID} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = (type) => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.emptyCircle}>
        <MaterialCommunityIcons
          name={type === 'quotes' ? 'file-document-outline' : 'car-sports'}
          size={wp('12%')}
          color={TEAL_MID}
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {type === 'quotes' ? 'No Quote Requests' : 'No Bookings Yet'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'quotes'
          ? 'Your luxury car requests will appear here'
          : 'Your confirmed luxury bookings will appear here'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('LuxuryScreen')}
      >
        <LinearGradient colors={[TEAL_MID, '#047857']} style={styles.exploreBtnGrad}>
          <MaterialCommunityIcons name="crown" size={wp('4%')} color="#FFF" />
          <Text style={styles.exploreBtnText}>Explore Luxury Cars</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Luxury Bookings</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp('3.5%'),
    padding: wp('1%'),
    gap: wp('1%'),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    gap: wp('1.5%'),
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('3%'),
    minWidth: wp('5.5%'),
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: hp('1.5%'),
    color: TEXT_SECONDARY,
    fontSize: wp('3.5%'),
    fontWeight: '500',
  },

  // Cards
  card: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  luxuryBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_MID,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderBottomLeftRadius: wp('3%'),
    gap: wp('1%'),
    zIndex: 1,
  },
  luxuryBadgeText: {
    fontSize: wp('2.4%'),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4%'),
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
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 999,
    gap: wp('1.5%'),
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
  cardBody: {
    padding: wp('4%'),
  },
  serviceRow: {
    marginBottom: hp('1%'),
  },
  vehicleCategory: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  vehicleName: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  serviceTypeBadge: {
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('2%'),
    marginTop: hp('0.8%'),
    alignSelf: 'flex-start',
  },
  serviceTypeBadgeText: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
    color: TEAL_MID,
    letterSpacing: 0.3,
  },
  chauffeurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  chauffeurText: {
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  locationSection: {
    marginBottom: hp('1%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  locationDot: {
    width: wp('2.2%'),
    height: wp('2.2%'),
    borderRadius: wp('1.1%'),
    backgroundColor: TEAL,
  },
  locationText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    flex: 1,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    padding: wp('3%'),
    borderRadius: wp('2.5%'),
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: hp('0.2%'),
  },
  occasionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginTop: hp('1%'),
  },
  occasionText: {
    fontSize: wp('3.2%'),
    color: '#e74c3c',
    fontWeight: '600',
  },
  quotesSection: {
    backgroundColor: TEAL_LIGHT,
    padding: wp('3%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('1%'),
    borderRadius: wp('2.5%'),
  },
  quotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotesTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('1%'),
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: TEAL_MID,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginTop: hp('1.2%'),
  },
  vendorIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: wp('1%'),
  },
  viewDetailsText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEAL_MID,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
    paddingHorizontal: wp('8%'),
  },
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
  emptyText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('2.5%'),
  },
  exploreBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  exploreBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
});

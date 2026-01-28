import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const customerData = await AsyncStorage.getItem('customer');
      const customer = customerData ? JSON.parse(customerData) : {};

      console.log('📱 Fetching with params:', {
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
      console.log('🚴 Bike Bookings Response:', bookingRes.data);
      console.log('🚴 Bookings Array:', bookingRes.data.bookings);
      console.log('🚴 Bookings Count:', bookingRes.data.bookings?.length || 0);
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
        return GREEN;
      case 'COMPLETED':
        return '#27ae60';
      case 'CANCELLED':
      case 'EXPIRED':
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
      default:
        return status;
    }
  };

  const renderQuoteRequestCard = (request) => (
    <TouchableOpacity
      key={request.id}
      style={styles.card}
      onPress={() => navigation.navigate('BikeQuoteRequestDetail', { requestId: request.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="bicycle" size={24} color={GREEN} />
          </View>
          <View>
            <Text style={styles.requestNumber}>#{request.requestNumber}</Text>
            <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.vehicleRow}>
          <Text style={styles.vehicleBrand}>{request.vehicleBrand || 'Any Brand'}</Text>
          <Text style={styles.vehicleName}>{request.vehicleModelName || request.vehicleCategoryName || 'Any Bike'}</Text>
        </View>

        <View style={styles.tripRow}>
          <View style={styles.tripItem}>
            <Ionicons name="location" size={16} color={GREEN} />
            <Text style={styles.tripText}>{request.locationName}</Text>
          </View>
          <View style={styles.tripItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.tripText}>{request.totalDays} Day{request.totalDays > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Pickup</Text>
            <Text style={styles.dateValue}>{formatDate(request.pickupDate)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#ccc" />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Drop</Text>
            <Text style={styles.dateValue}>{formatDate(request.dropDate)}</Text>
          </View>
        </View>
      </View>

      {/* Quotes Section */}
      {request.quotes && request.quotes.length > 0 && (
        <View style={styles.quotesSection}>
          <View style={styles.quotesHeader}>
            <Text style={styles.quotesTitle}>
              {request.quotes.length} Quote{request.quotes.length > 1 ? 's' : ''} Received
            </Text>
            <Ionicons name="chevron-forward" size={20} color={GREEN} />
          </View>
          <View style={styles.quotesList}>
            {request.quotes.slice(0, 2).map((quote, idx) => (
              <View key={quote.id} style={styles.quoteItem}>
                <View style={styles.quoteVendor}>
                  <Text style={styles.quoteVendorName}>{quote.vendor?.businessName || 'Vendor'}</Text>
                  {quote.vendor?.rating && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#f39c12" />
                      <Text style={styles.ratingText}>{quote.vendor.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quotePrice}>₹{quote.grandTotal}</Text>
              </View>
            ))}
            {request.quotes.length > 2 && (
              <Text style={styles.moreQuotes}>+{request.quotes.length - 2} more</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={18} color={GREEN} />
      </View>
    </TouchableOpacity>
  );

  const renderBookingCard = (booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.card}
      onPress={() => navigation.navigate('BikeBookingDetail', { bookingId: booking.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="bicycle" size={24} color={GREEN} />
          </View>
          <View>
            <Text style={styles.requestNumber}>#{booking.bookingNumber}</Text>
            <Text style={styles.dateText}>{formatDate(booking.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.vehicleRow}>
          <Text style={styles.vehicleBrand}>{booking.vehicleBrand || ''}</Text>
          <Text style={styles.vehicleName}>{booking.vehicleName || 'Bike'}</Text>
        </View>

        <View style={styles.tripRow}>
          <View style={styles.tripItem}>
            <Ionicons name="location" size={16} color={GREEN} />
            <Text style={styles.tripText}>{booking.locationName}</Text>
          </View>
          <View style={styles.tripItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.tripText}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Pickup</Text>
            <Text style={styles.dateValue}>{formatDate(booking.pickupDate)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#ccc" />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Drop</Text>
            <Text style={styles.dateValue}>{formatDate(booking.dropDate)}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Total Amount</Text>
          <Text style={styles.priceValue}>₹{booking.grandTotal}</Text>
        </View>

        {booking.vendor && (
          <View style={styles.vendorRow}>
            <Ionicons name="storefront-outline" size={16} color="#666" />
            <Text style={styles.vendorName}>{booking.vendor.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={18} color={GREEN} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = (type) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === 'quotes' ? 'document-text-outline' : 'bicycle-outline'}
        size={80}
        color="#ddd"
      />
      <Text style={styles.emptyTitle}>
        {type === 'quotes' ? 'No Quote Requests' : 'No Bookings Yet'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'quotes'
          ? 'Your bike rental requests will appear here'
          : 'Your confirmed bike bookings will appear here'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('BikeRentalScreen')}
      >
        <Text style={styles.exploreBtnText}>Explore Bikes</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bike Rentals</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? GREEN : '#666'}
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
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
        <View style={{ height: 40 }} />
      </ScrollView>
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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(9,179,104,0.1)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: GREEN,
  },
  tabBadge: {
    backgroundColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: GREEN,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  cardBody: {
    padding: 16,
  },
  vehicleRow: {
    marginBottom: 12,
  },
  vehicleBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
  tripRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripText: {
    fontSize: 14,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  vendorName: {
    fontSize: 14,
    color: '#333',
  },

  // Quotes Section
  quotesSection: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
  },
  quotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quotesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
  },
  quotesList: {},
  quoteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  quoteVendor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quoteVendorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#f39c12',
    fontWeight: '600',
  },
  quotePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  moreQuotes: {
    textAlign: 'center',
    color: GREEN,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

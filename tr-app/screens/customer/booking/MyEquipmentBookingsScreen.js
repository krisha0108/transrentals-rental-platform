import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import bookingService from '../../services/bookingService';

const GREEN = '#09B368';
const BG = '#F5F5F7';

const TABS = [
  { key: 'quotes', label: 'Quote Requests', icon: 'document-text-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'hammer-wrench' },
];

export default function MyEquipmentBookingsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('quotes');
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const response = await bookingService.getEquipmentBookings();
      if (response.success || response.bookings || response.quoteRequests) {
        setQuoteRequests(response.quoteRequests || []);
        setBookings(response.bookings || []);
      }
    } catch (err) {
      console.log('Error fetching equipment bookings:', err);
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
      case 'CONFIRMED': return GREEN;
      case 'COMPLETED': return '#27ae60';
      case 'CANCELLED':
      case 'EXPIRED': return '#e74c3c';
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
      default: return status;
    }
  };

  const renderQuoteRequestCard = (request) => (
    <TouchableOpacity
      key={request.id}
      style={styles.card}
      onPress={() => navigation.navigate('EquipmentQuoteRequestDetail', { requestId: request.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="hammer-wrench" size={24} color={GREEN} />
          </View>
          <View>
            <Text style={styles.requestNumber}>#{request.requestNumber || request.id}</Text>
            <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.equipmentRow}>
          <Text style={styles.equipmentType}>{request.equipmentType || 'Equipment'}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{request.equipmentCategory || 'General'}</Text>
          </View>
        </View>

        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.durationText}>
            {request.rentalDays || request.rentalDuration} days
          </Text>
          {request.needOperator && (
            <View style={styles.operatorBadge}>
              <MaterialCommunityIcons name="account-hard-hat" size={14} color="#fff" />
              <Text style={styles.operatorText}>With Operator</Text>
            </View>
          )}
        </View>

        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={GREEN} />
            <Text style={styles.locationText} numberOfLines={1}>
              {request.deliveryCity || request.deliveryAddress || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.dateRowSimple}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.dateValue}>Start: {formatDate(request.startDate)}</Text>
        </View>
      </View>

      {request.quotes && request.quotes.length > 0 && (
        <View style={styles.quotesSection}>
          <View style={styles.quotesHeader}>
            <Text style={styles.quotesTitle}>
              {request.quotes.length} Quote{request.quotes.length > 1 ? 's' : ''} Received
            </Text>
            <Ionicons name="chevron-forward" size={20} color={GREEN} />
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
      onPress={() => navigation.navigate('EquipmentBookingDetail', { bookingId: booking.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="hammer-wrench" size={24} color={GREEN} />
          </View>
          <View>
            <Text style={styles.requestNumber}>#{booking.bookingNumber || booking.id}</Text>
            <Text style={styles.dateText}>{formatDate(booking.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.equipmentRow}>
          <Text style={styles.equipmentType}>{booking.equipmentType || 'Equipment'}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{booking.equipmentCategory || 'General'}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Total Amount</Text>
          <Text style={styles.priceValue}>₹{booking.totalAmount || booking.grandTotal || 0}</Text>
        </View>

        {booking.vendor && (
          <View style={styles.vendorRow}>
            <Ionicons name="storefront-outline" size={16} color="#666" />
            <Text style={styles.vendorName}>{booking.vendor.businessName || booking.vendor.name}</Text>
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
      <MaterialCommunityIcons
        name={type === 'quotes' ? 'file-document-outline' : 'hammer-wrench'}
        size={80}
        color="#ddd"
      />
      <Text style={styles.emptyTitle}>
        {type === 'quotes' ? 'No Quote Requests' : 'No Bookings Yet'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'quotes'
          ? 'Your equipment rental requests will appear here'
          : 'Your confirmed equipment rentals will appear here'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('EquipmentScreen')}
      >
        <Text style={styles.exploreBtnText}>Rent Equipment</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Equipment Rentals</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.icon === 'hammer-wrench' ? (
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? GREEN : '#666'}
              />
            ) : (
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? GREEN : '#666'}
              />
            )}
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {activeTab === 'quotes' ? (
          quoteRequests.length > 0 ? quoteRequests.map(renderQuoteRequestCard) : renderEmpty('quotes')
        ) : (
          bookings.length > 0 ? bookings.map(renderBookingCard) : renderEmpty('bookings')
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 4, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 6 },
  tabActive: { backgroundColor: 'rgba(9,179,104,0.1)' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: GREEN },
  tabBadge: { backgroundColor: '#ddd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabBadgeActive: { backgroundColor: GREEN },
  tabBadgeText: { fontSize: 12, fontWeight: '700', color: '#666' },
  tabBadgeTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(9,179,104,0.1)', justifyContent: 'center', alignItems: 'center' },
  requestNumber: { fontSize: 16, fontWeight: '700', color: '#333' },
  dateText: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 16 },
  equipmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  equipmentType: { fontSize: 18, fontWeight: '700', color: '#333' },
  categoryBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  durationText: { fontSize: 14, color: '#666' },
  operatorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f39c12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  operatorText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  locationSection: { marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 14, color: '#333', flex: 1 },
  dateRowSimple: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateValue: { fontSize: 14, color: '#333' },
  quotesSection: { backgroundColor: '#f8f8f8', padding: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 10 },
  quotesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotesTitle: { fontSize: 14, fontWeight: '700', color: GREEN },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  priceLabel: { fontSize: 14, color: '#666' },
  priceValue: { fontSize: 20, fontWeight: '700', color: GREEN },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  vendorName: { fontSize: 14, color: '#333' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', gap: 4 },
  viewDetailsText: { fontSize: 14, fontWeight: '600', color: GREEN },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  exploreBtn: { marginTop: 20, backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  exploreBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

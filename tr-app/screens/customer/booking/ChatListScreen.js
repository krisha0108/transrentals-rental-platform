import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

const GREEN = '#09B368';
const BRAND_TEAL = '#0B6E4F';
const BG = '#F5F5F7';

const SERVICE_ICONS = {
  bus: 'bus',
  truck: 'truck',
  equipment: 'hammer',
  packers: 'package-variant-closed',
  bike: 'motorbike',
  car: 'car',
};

const SERVICE_COLORS = {
  bus: '#3B82F6',
  truck: '#F59E0B',
  equipment: '#8B5CF6',
  packers: '#10B981',
  bike: '#EF4444',
  car: '#06B6D4',
};

const STATUS_COLORS = {
  PENDING_PAYMENT: '#F59E0B',
  PAYMENT_SUBMITTED: '#3B82F6',
  ADVANCE_PAID: '#10B981',
  CONFIRMED: '#10B981',
  VEHICLE_ASSIGNED: '#8B5CF6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#64748B',
  CANCELLED: '#EF4444',
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadCustomerData();
      fetchBookings();

      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchBookings, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        setCustomerData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const customer = await AsyncStorage.getItem('customer');
      if (!customer) {
        setLoading(false);
        return;
      }

      const customerObj = JSON.parse(customer);
      const response = await api.get('/customer/all-booking-chats', {
        params: {
          email: customerObj.email,
          customer_id: customerObj.id,
        },
      });

      if (response.data.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderBookingItem = ({ item }) => {
    const serviceIcon = SERVICE_ICONS[item.type] || 'help-circle';
    const serviceColor = SERVICE_COLORS[item.type] || '#64748B';
    const statusColor = STATUS_COLORS[item.status] || '#64748B';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingChat', {
          bookingId: item.id,
          bookingNumber: item.bookingNumber,
          vendorName: item.vendor?.name || 'Vendor',
        })}
        activeOpacity={0.7}
      >
        {/* Service Icon */}
        <View style={[styles.serviceIcon, { backgroundColor: serviceColor + '15' }]}>
          <MaterialCommunityIcons name={serviceIcon} size={24} color={serviceColor} />
        </View>

        {/* Content */}
        <View style={styles.bookingContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName} numberOfLines={1}>
                {item.vendor?.name || 'Vendor'}
              </Text>
              <Text style={styles.bookingNumber} numberOfLines={1}>
                {item.bookingNumber}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>

          {/* Route Info */}
          <View style={styles.routeRow}>
            <Ionicons name="location" size={12} color="#64748B" />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.pickupCity}
              {item.dropCity && ` → ${item.dropCity}`}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
              {item.status.replace(/_/g, ' ')}
            </Text>
          </View>

          {/* Last Message */}
          {item.lastMessage ? (
            <View style={styles.messageRow}>
              <Ionicons
                name={item.lastMessageSender === 'vendor' ? 'arrow-down' : 'arrow-up'}
                size={12}
                color={item.lastMessageSender === 'vendor' ? GREEN : '#64748B'}
              />
              <Text
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
              <Text style={styles.timeAgo}>{getTimeAgo(item.lastMessageTime)}</Text>
            </View>
          ) : (
            <View style={styles.messageRow}>
              <Ionicons name="chatbubble-outline" size={12} color="#94A3B8" />
              <Text style={styles.noMessage}>No messages yet</Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="chat-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results Found' : 'No Chats Yet'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No conversations found for "${searchQuery}"`
          : 'Start chatting with vendors from your booking details.\nConversations will appear here once messages are sent.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseBtnText}>Browse Services</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Filter bookings: only show those with messages and match search query
  const filteredBookings = bookings.filter((booking) => {
    // Only show bookings with at least one message
    const hasMessages = booking.lastMessage && booking.lastMessage.trim() !== '';
    if (!hasMessages) return false;

    // Apply search filter if query exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchesVendor = booking.vendor?.name?.toLowerCase().includes(query);
      const matchesBookingNumber = booking.bookingNumber?.toLowerCase().includes(query);
      const matchesCity = booking.pickupCity?.toLowerCase().includes(query) ||
                          booking.dropCity?.toLowerCase().includes(query);
      return matchesVendor || matchesBookingNumber || matchesCity;
    }

    return true;
  });

  // Calculate total unread
  const totalUnread = filteredBookings.reduce((sum, b) => sum + (b.unreadCount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vendor, booking, or city..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[GREEN]}
            tintColor={GREEN}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingContent: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  bookingNumber: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  routeText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
  },
  unreadMessage: {
    color: '#0F172A',
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 11,
    color: '#94A3B8',
  },
  noMessage: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  browseBtn: {
    marginTop: 24,
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

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
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../../theme';

const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  android: {
    elevation: 2,
  },
});

const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
});

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
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }

      loadCustomerData();
      fetchBookings();

      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchBookings, 10000);
      return () => {
        clearInterval(interval);
        StatusBar.setBarStyle('light-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#0A6B3F', true);
        }
      };
    }, [])
  );

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        setCustomerData(JSON.parse(data));
      }
    } catch (error) {
      console.log('Error loading customer data:', error);
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
      console.log('Error fetching bookings:', error);
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
          bookingType: item.type,
        })}
        activeOpacity={0.7}
      >
        {/* Service Icon */}
        <View style={[styles.serviceIcon, { backgroundColor: serviceColor + '15' }]}>
          <MaterialCommunityIcons name={serviceIcon} size={wp('5.5%')} color={serviceColor} />
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
            <Ionicons name="location" size={wp('3%')} color={TEXT_SECONDARY} />
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
                size={wp('3%')}
                color={item.lastMessageSender === 'vendor' ? TEAL : TEXT_SECONDARY}
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
              <Ionicons name="chatbubble-outline" size={wp('3%')} color={TEXT_MUTED} />
              <Text style={styles.noMessage}>No messages yet</Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={wp('5%')} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="chat-outline" size={wp('10%')} color={TEAL} />
      </View>
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
          <LinearGradient
            colors={[TEAL_DEEP, TEAL_MID, '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.browseBtnGradient}
          >
            <Ionicons name="compass-outline" size={wp('4.5%')} color="#FFFFFF" />
            <Text style={styles.browseBtnText}>Browse Services</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        {/* Gradient Header */}
        <LinearGradient
          colors={[TEAL_DEEP, TEAL_MID, '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerDecoCircle1} />
          <View style={styles.headerDecoCircle2} />
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Chats</Text>
              <Text style={styles.headerSubtitle}>Your conversations</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinnerWrap}>
            <ActivityIndicator size="large" color={TEAL} />
          </View>
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerDecoCircle1} />
        <View style={styles.headerDecoCircle2} />
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Chats</Text>
            <Text style={styles.headerSubtitle}>Your conversations</Text>
          </View>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={wp('5%')} color={TEXT_SECONDARY} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vendor, booking, or city..."
          placeholderTextColor={TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={wp('5%')} color={TEXT_SECONDARY} />
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
            colors={[TEAL]}
            tintColor={TEAL}
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

  // --- Header ---
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || hp('4%') : hp('5.5%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  headerDecoCircle1: {
    position: 'absolute',
    top: -hp('4%'),
    right: -wp('8%'),
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDecoCircle2: {
    position: 'absolute',
    bottom: -hp('3%'),
    left: -wp('10%'),
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: wp('6.5%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: wp('3%'),
    minWidth: wp('6.5%'),
    height: wp('6.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: '700',
  },

  // --- Search ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('1%'),
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    ...SHADOW_SM,
  },
  searchIcon: {
    marginRight: wp('2%'),
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('1.5%'),
  },
  clearButton: {
    padding: wp('1%'),
  },

  // --- Loading ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingSpinnerWrap: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  loadingText: {
    marginTop: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  // --- List ---
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('0.5%'),
    paddingBottom: hp('12%'),
  },

  // --- Booking Card ---
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    padding: wp('3.5%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  serviceIcon: {
    width: wp('12.5%'),
    height: wp('12.5%'),
    borderRadius: wp('6.25%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  bookingContent: {
    flex: 1,
    gap: hp('0.4%'),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  bookingNumber: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: wp('2.5%'),
    minWidth: wp('5.5%'),
    height: wp('5.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1.5%'),
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: wp('2.8%'),
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    marginTop: hp('0.2%'),
  },
  routeText: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    flex: 1,
  },
  statusDot: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    borderRadius: wp('0.75%'),
    marginLeft: wp('1%'),
  },
  statusText: {
    fontSize: wp('2.6%'),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    marginTop: hp('0.4%'),
  },
  lastMessage: {
    flex: 1,
    fontSize: wp('3.1%'),
    color: TEXT_SECONDARY,
  },
  unreadMessage: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
  },
  noMessage: {
    flex: 1,
    fontSize: wp('3.1%'),
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },

  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp('12%'),
  },
  emptyIconCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  emptyTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: hp('2%'),
  },
  emptyText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    marginTop: hp('1%'),
    textAlign: 'center',
    lineHeight: hp('2.5%'),
    paddingHorizontal: wp('10%'),
  },
  browseBtn: {
    marginTop: hp('3%'),
    borderRadius: wp('7%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  browseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('1.6%'),
    borderRadius: wp('7%'),
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
});

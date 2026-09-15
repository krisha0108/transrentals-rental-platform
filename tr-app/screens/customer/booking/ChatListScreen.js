import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import chatService from '../../services/chatService';
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
  b2b: 'office-building',
};

const SERVICE_COLORS = {
  bus: '#3B82F6',
  truck: '#F59E0B',
  equipment: '#8B5CF6',
  packers: '#10B981',
  bike: '#EF4444',
  car: '#06B6D4',
  b2b: '#22C55E',
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
  OPEN_FOR_QUOTES: '#F59E0B',
  QUOTES_RECEIVED: '#3B82F6',
  SUPER_QUOTE_SENT: '#8B5CF6',
  TRIPS_CREATED: '#06B6D4',
  INVOICED: '#6366F1',
  PAID: '#059669',
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMode, setChatMode] = useState('vendor');
  const [driverConversations, setDriverConversations] = useState([]);
  const [driverTotalUnread, setDriverTotalUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }

      fetchBookings();

      const interval = setInterval(fetchBookings, 10000);
      return () => {
        clearInterval(interval);
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF', true);
        }
      };
    }, [])
  );

  // Normalize booking type: chauffeur/luxury → 'car' for icon/navigation fallback
  const normalizeType = (t) => {
    if (!t) return 'car';
    const lower = t.toLowerCase();
    if (lower === 'chauffeur' || lower === 'luxury') return 'car';
    return lower;
  };

  const fetchBookings = async () => {
    try {
      const data = await chatService.getCustomerConversations();
      if (data.success && Array.isArray(data.conversations)) {
        // Transform conversations into booking-like objects for the grouping logic
        const mapped = data.conversations
          .filter((c) => c.bookingId && c.participant?.id)
          .map((c) => ({
            id: c.bookingId,
            bookingNumber: c.bookingNumber || c.bookingId?.slice(-8),
            type: normalizeType(c.bookingType),
            rawType: c.bookingType,  // keep original for navigation
            vendor: {
              id: c.participant.id,
              name: c.participant.name,
              phone: c.participant.phone,
            },
            lastMessage: c.lastMessage?.content || null,
            lastMessageTime: c.lastMessageAt || null,
            lastMessageSender: c.lastMessage?.senderType || null,
            unreadCount: c.unreadCount || 0,
            conversationId: c.id,
            pickupCity: '',
            dropCity: '',
            status: '',
          }));
        setBookings(mapped);
      }
    } catch (error) {
      console.log('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDriverConversations = useCallback(async () => {
    try {
      const data = await chatService.getDriverConversations();
      if (data?.conversations) {
        setDriverConversations(data.conversations);
        setDriverTotalUnread(data.totalUnread || 0);
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDriverConversations();
      const driverInterval = setInterval(fetchDriverConversations, 10000);
      return () => clearInterval(driverInterval);
    }, [fetchDriverConversations])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    fetchDriverConversations();
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

  // Group bookings by vendor, keeping only those with messages
  const vendorGroups = useMemo(() => {
    const withMessages = bookings.filter(
      (b) => b.vendor?.id && b.lastMessage && b.lastMessage.trim() !== ''
    );

    const map = {};
    withMessages.forEach((b) => {
      const vid = b.vendor.id;
      if (!map[vid]) {
        map[vid] = {
          vendorId: vid,
          vendorName: b.vendor.name,
          vendorPhone: b.vendor.phone,
          bookings: [],
          totalUnread: 0,
          lastMessageTime: null,
          lastMessage: null,
          lastMessageSender: null,
          serviceTypes: new Set(),
        };
      }
      map[vid].bookings.push(b);
      map[vid].totalUnread += b.unreadCount || 0;
      map[vid].serviceTypes.add(b.type);

      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      const curTime = map[vid].lastMessageTime ? new Date(map[vid].lastMessageTime).getTime() : 0;
      if (bTime > curTime) {
        map[vid].lastMessage = b.lastMessage;
        map[vid].lastMessageTime = b.lastMessageTime;
        map[vid].lastMessageSender = b.lastMessageSender;
      }
    });

    // Sort each group's bookings by lastMessageTime desc
    Object.values(map).forEach((g) => {
      g.bookings.sort((a, b) => {
        const aT = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const bT = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return bT - aT;
      });
    });

    // Apply search filter
    let groups = Object.values(map);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      groups = groups.filter(
        (g) =>
          g.vendorName?.toLowerCase().includes(q) ||
          g.bookings.some(
            (b) =>
              b.bookingNumber?.toLowerCase().includes(q) ||
              b.pickupCity?.toLowerCase().includes(q) ||
              b.dropCity?.toLowerCase().includes(q)
          )
      );
    }

    // Sort groups by latest message time
    groups.sort((a, b) => {
      const aT = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bT = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return bT - aT;
    });

    return groups;
  }, [bookings, searchQuery]);

  const openVendorChat = (group) => {
    const topBooking = group.bookings[0];
    navigation.navigate('BookingChat', {
      bookingId: topBooking.id,
      bookingNumber: topBooking.bookingNumber,
      vendorName: group.vendorName,
      bookingType: topBooking.rawType || topBooking.type,
      vendorBookings: group.bookings,
    });
  };

  const renderVendorItem = ({ item: group }) => {
    // Determine dominant service type for icon/color
    const primaryType = group.bookings[0]?.type || 'car';
    const serviceIcon = SERVICE_ICONS[primaryType] || 'help-circle';
    const serviceColor = SERVICE_COLORS[primaryType] || '#64748B';

    // If multiple service types exist, show a generic office icon
    const hasMultipleTypes = group.serviceTypes.size > 1;

    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => openVendorChat(group)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.vendorAvatar, { backgroundColor: serviceColor + '18' }]}>
          {hasMultipleTypes ? (
            <MaterialCommunityIcons name="store" size={wp('5.5%')} color={serviceColor} />
          ) : (
            <MaterialCommunityIcons name={serviceIcon} size={wp('5.5%')} color={serviceColor} />
          )}
        </View>

        {/* Content */}
        <View style={styles.vendorContent}>
          {/* Top row */}
          <View style={styles.topRow}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {group.vendorName}
            </Text>
            <View style={styles.rightMeta}>
              {group.totalUnread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{group.totalUnread}</Text>
                </View>
              )}
              <Text style={styles.timeAgo}>{getTimeAgo(group.lastMessageTime)}</Text>
            </View>
          </View>

          {/* Booking count + types */}
          <View style={styles.bookingMetaRow}>
            <View style={styles.bookingCountPill}>
              <Ionicons name="briefcase-outline" size={wp('2.8%')} color={TEAL} />
              <Text style={styles.bookingCountText}>
                {group.bookings.length} {group.bookings.length === 1 ? 'booking' : 'bookings'}
              </Text>
            </View>
            {Array.from(group.serviceTypes).map((type) => (
              <View
                key={type}
                style={[styles.typeChip, { backgroundColor: (SERVICE_COLORS[type] || '#64748B') + '18' }]}
              >
                <MaterialCommunityIcons
                  name={SERVICE_ICONS[type] || 'help-circle'}
                  size={wp('2.8%')}
                  color={SERVICE_COLORS[type] || '#64748B'}
                />
              </View>
            ))}
          </View>

          {/* Last message */}
          <View style={styles.lastMsgRow}>
            {group.lastMessageSender === 'vendor' ? (
              <Ionicons name="arrow-down" size={wp('3%')} color={TEAL} />
            ) : (
              <Ionicons name="arrow-up" size={wp('3%')} color={TEXT_MUTED} />
            )}
            <Text
              style={[styles.lastMessage, group.totalUnread > 0 && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {group.lastMessage}
            </Text>
          </View>
        </View>

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

  const renderDriverItem = ({ item }) => {
    const driverName = item.driver?.name || 'Driver';
    const initial = driverName.charAt(0).toUpperCase();
    const lastMsg = item.lastMessage?.content || 'No messages yet';
    const time = item.lastMessageAt ? getTimeAgo(item.lastMessageAt) : '';
    const unread = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => navigation.navigate('DriverChat', { conversationId: item.id, driverName, bookingId: item.bookingId || null, bookingType: item.bookingType || 'chauffeur' })}
        activeOpacity={0.7}
      >
        <View style={[styles.vendorAvatar, { backgroundColor: '#16A34A18' }]}>
          <Text style={styles.driverAvatarText}>{initial}</Text>
        </View>
        <View style={styles.vendorContent}>
          <View style={styles.topRow}>
            <Text style={[styles.vendorName, unread > 0 && { fontWeight: '800' }]} numberOfLines={1}>
              {driverName}
            </Text>
            <View style={styles.rightMeta}>
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
              <Text style={styles.timeAgo}>{time}</Text>
            </View>
          </View>
          <View style={styles.bookingMetaRow}>
            <View style={[styles.bookingCountPill, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="car-outline" size={wp('2.8%')} color="#16A34A" />
              <Text style={[styles.bookingCountText, { color: '#16A34A' }]}>Chauffeur</Text>
            </View>
          </View>
          <View style={styles.lastMsgRow}>
            {item.lastMessage?.senderType === 'driver' ? (
              <Ionicons name="arrow-down" size={wp('3%')} color="#16A34A" />
            ) : (
              <Ionicons name="arrow-up" size={wp('3%')} color={TEXT_MUTED} />
            )}
            <Text style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage?.senderType === 'customer' ? 'You: ' : ''}{lastMsg}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={wp('5%')} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  const renderDriverEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="car-outline" size={wp('10%')} color={TEAL} />
      </View>
      <Text style={styles.emptyTitle}>No Driver Chats Yet</Text>
      <Text style={styles.emptyText}>
        Driver chats appear after your chauffeur booking is assigned to a driver.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
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

  const totalUnread = vendorGroups.reduce((s, g) => s + g.totalUnread, 0);
  const combinedUnread = totalUnread + driverTotalUnread;

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
          {combinedUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{combinedUnread}</Text>
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

      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, chatMode === 'vendor' && styles.modeTabActive]}
          onPress={() => setChatMode('vendor')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={wp('4%')}
            color={chatMode === 'vendor' ? '#fff' : TEAL}
          />
          <Text style={[styles.modeTabText, chatMode === 'vendor' && styles.modeTabTextActive]}>
            Vendor Chats
          </Text>
          {totalUnread > 0 && chatMode !== 'vendor' && (
            <View style={styles.modeTabBadge}>
              <Text style={styles.modeTabBadgeText}>{totalUnread > 9 ? '9+' : totalUnread}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, chatMode === 'driver' && styles.modeTabActive]}
          onPress={() => setChatMode('driver')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="car-outline"
            size={wp('4%')}
            color={chatMode === 'driver' ? '#fff' : TEAL}
          />
          <Text style={[styles.modeTabText, chatMode === 'driver' && styles.modeTabTextActive]}>
            Driver Chats
          </Text>
          {driverTotalUnread > 0 && chatMode !== 'driver' && (
            <View style={styles.modeTabBadge}>
              <Text style={styles.modeTabBadgeText}>{driverTotalUnread > 9 ? '9+' : driverTotalUnread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {chatMode === 'vendor' ? (
        <FlatList
          data={vendorGroups}
          keyExtractor={(item) => item.vendorId}
          renderItem={renderVendorItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={driverConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderDriverItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderDriverEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
      android: { elevation: 4 },
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

  // --- Vendor Card ---
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    padding: wp('3.5%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  vendorAvatar: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    flexShrink: 0,
  },
  vendorContent: {
    flex: 1,
    gap: hp('0.45%'),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: wp('3.9%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    flex: 1,
    marginRight: wp('2%'),
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
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
  timeAgo: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    flexWrap: 'wrap',
  },
  bookingCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.2%'),
  },
  bookingCountText: {
    fontSize: wp('2.7%'),
    color: TEAL,
    fontWeight: '600',
  },
  typeChip: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    marginTop: hp('0.2%'),
  },
  lastMessage: {
    flex: 1,
    fontSize: wp('3.1%'),
    color: TEXT_SECONDARY,
  },
  lastMessageUnread: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
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

  // --- Mode Tabs ---
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    marginBottom: hp('0.5%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    padding: wp('1%'),
    gap: wp('1%'),
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
  },
  modeTabActive: {
    backgroundColor: TEAL,
    ...SHADOW_SM,
  },
  modeTabText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEAL,
  },
  modeTabTextActive: {
    color: '#fff',
  },
  modeTabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: wp('2%'),
    minWidth: wp('4.5%'),
    height: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
  },
  modeTabBadgeText: {
    color: '#fff',
    fontSize: wp('2.5%'),
    fontWeight: '800',
  },

  // --- Driver Avatar Text ---
  driverAvatarText: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: '#16A34A',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiGet } from '../../api/client';

const C = {
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E6EDF5',
  brand: '#22C55E',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
};

export default function ChatListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = useCallback(async () => {
    try {
      const response = await apiGet('/vendor/chats');
      console.log('[ChatList] API Response:', response.data);
      console.log('[ChatList] Chats:', response.data?.chats);
      setChats(response.data?.chats || []);
    } catch (error) {
      console.log('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, [fetchChats]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-IN', { weekday: 'short' });
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getBookingTypeBadge = (bookingType) => {
    console.log('[ChatList] Booking Type:', bookingType);
    const types = {
      bike: { label: 'Bike Rental', color: C.orange, bg: '#FEF3C7' },
      car: { label: 'Self Drive', color: C.blue, bg: '#DBEAFE' },
      bus: { label: 'Bus Rental', color: C.purple, bg: '#F3E8FF' },
      truck: { label: 'Truck Rental', color: C.red, bg: '#FEE2E2' },
      luxury: { label: 'Luxury Car', color: '#8B5CF6', bg: '#F3E8FF' },
      chauffeur: { label: 'Car Rental', color: '#10B981', bg: '#D1FAE5' },
      packers: { label: 'Packers', color: '#F59E0B', bg: '#FEF3C7' },
      equipment: { label: 'Equipment', color: '#EF4444', bg: '#FEE2E2' },
    };
    return types[bookingType?.toLowerCase()] || { label: 'Other', color: C.muted, bg: '#F3F4F6' };
  };

  const filteredChats = chats.filter((chat) => {
    const matchesFilter = filter === 'all' || (filter === 'unread' && chat.unreadCount > 0);
    const matchesSearch = !searchQuery ||
      chat.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = chats.filter(c => c.unreadCount > 0).length;

  const renderChatItem = ({ item }) => {
    const bookingBadge = getBookingTypeBadge(item.bookingType);
    const isUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.chatItem, isUnread && styles.chatItemUnread]}
        onPress={() => navigation.navigate('ChatScreen', {
          bookingId: item.bookingId,
          customerName: item.customerName,
          bookingNumber: item.bookingNumber,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.customerAvatar ? (
            <Image source={{ uri: item.customerAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: bookingBadge.bg }]}>
              <Text style={[styles.avatarText, { color: bookingBadge.color }]}>
                {item.customerName?.charAt(0)?.toUpperCase() || 'C'}
              </Text>
            </View>
          )}
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          )}
          <View style={[styles.onlineDot, item.isOnline && styles.onlineDotActive]} />
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.customerName, isUnread && styles.customerNameUnread]} numberOfLines={1}>
              {item.customerName || 'Customer'}
            </Text>
            <Text style={[styles.chatTime, isUnread && styles.chatTimeUnread]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.bookingBadge, { backgroundColor: bookingBadge.bg }]}>
              <Text style={[styles.bookingBadgeText, { color: bookingBadge.color }]}>
                {bookingBadge.label}
              </Text>
            </View>
            <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
          </View>

          <View style={styles.lastMessageRow}>
            {item.lastSenderType === 'VENDOR' && (
              <Ionicons name="checkmark-done" size={14} color={C.brand} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
        </View>

        <Icon name="chevron-right" size={18} color={isUnread ? C.brand : C.muted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Messages</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.searchToggle}>
            <Ionicons name="search" size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={C.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or booking..."
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All Chats ({chats.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={56} color={C.brand} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Results Found' : filter === 'unread' ? 'No Unread Messages' : 'No Chats Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try searching with a different name or booking number'
              : filter === 'unread'
              ? 'All caught up! No new messages to read'
              : 'Your customer conversations will appear here once you receive bookings'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.bookingId?.toString() || item.id?.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.brand}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
  },
  headerBadge: {
    marginLeft: 8,
    backgroundColor: C.brand,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  searchToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: C.bg,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#DCFCE7',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.muted,
  },
  filterTabTextActive: {
    color: '#166534',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Chat Item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chatItemUnread: {
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: C.surface,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.surface,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: C.surface,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
    borderWidth: 2,
    borderColor: C.surface,
  },
  onlineDotActive: {
    backgroundColor: C.brand,
  },

  // Chat Content
  chatContent: {
    flex: 1,
    marginRight: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  customerNameUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  chatTime: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '500',
  },
  chatTimeUnread: {
    color: '#166534',
    fontWeight: '600',
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  bookingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookingNumber: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '600',
  },

  // Last Message
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: C.muted,
    flex: 1,
  },
  lastMessageUnread: {
    color: C.text,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});

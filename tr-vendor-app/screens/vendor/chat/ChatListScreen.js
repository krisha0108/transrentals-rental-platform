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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiGet } from '../../api/client';

const C = {
  bg: '#F0F4F8',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#22C55E',
  brandLight: '#DCFCE7',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
};

const SERVICE_TYPES = [
  { key: 'all',       label: 'All',        icon: 'grid',           color: C.brand,   bg: C.brandLight },
  { key: 'bike',      label: 'Bike',       icon: 'activity',       color: C.orange,  bg: '#FEF3C7' },
  { key: 'chauffeur', label: 'Car Rental', icon: 'map-pin',        color: '#10B981', bg: '#D1FAE5' },
  { key: 'self-drive',label: 'Self Drive', icon: 'navigation',     color: C.blue,    bg: '#DBEAFE' },
  { key: 'bus',       label: 'Bus',        icon: 'users',          color: C.purple,  bg: '#F3E8FF' },
  { key: 'truck',     label: 'Truck',      icon: 'package',        color: C.red,     bg: '#FEE2E2' },
  { key: 'luxury',    label: 'Luxury',     icon: 'star',           color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'packers',   label: 'Packers',    icon: 'box',            color: C.orange,  bg: '#FEF3C7' },
  { key: 'equipment', label: 'Equipment',  icon: 'tool',           color: C.red,     bg: '#FEE2E2' },
];

const SERVICE_MAP = {
  bike:       { label: 'Bike Rental',  color: C.orange,  bg: '#FEF3C7' },
  car:        { label: 'Self Drive',   color: C.blue,    bg: '#DBEAFE' },
  'self-drive':{ label: 'Self Drive',  color: C.blue,    bg: '#DBEAFE' },
  bus:        { label: 'Bus Rental',   color: C.purple,  bg: '#F3E8FF' },
  truck:      { label: 'Truck Rental', color: C.red,     bg: '#FEE2E2' },
  luxury:     { label: 'Luxury Car',   color: '#8B5CF6', bg: '#EDE9FE' },
  chauffeur:  { label: 'Car Rental',   color: '#10B981', bg: '#D1FAE5' },
  packers:    { label: 'Packers',      color: C.orange,  bg: '#FEF3C7' },
  equipment:  { label: 'Equipment',    color: C.red,     bg: '#FEE2E2' },
};

export default function ChatListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = useCallback(async () => {
    try {
      const response = await apiGet('/vendor/chats');
      const rawChats = response.data?.chats || [];
      const seen = new Set();
      const uniqueChats = rawChats.filter((chat) => {
        const key = chat.bookingId || chat.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setChats(uniqueChats);
    } catch (error) {
      console.log('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, [fetchChats]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-IN', { weekday: 'short' });
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const filteredChats = chats.filter((chat) => {
    if (unreadOnly && !chat.unreadCount) return false;
    if (serviceFilter !== 'all' && chat.bookingType?.toLowerCase() !== serviceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const serviceLabel = (SERVICE_MAP[chat.bookingType?.toLowerCase()]?.label || '').toLowerCase();
      return (
        chat.customerName?.toLowerCase().includes(q) ||
        chat.bookingNumber?.toLowerCase().includes(q) ||
        serviceLabel.includes(q)
      );
    }
    return true;
  });

  const unreadCount = chats.filter(c => c.unreadCount > 0).length;

  // Count per service type for badges on filter chips
  const serviceCounts = chats.reduce((acc, c) => {
    const k = c.bookingType?.toLowerCase() || 'other';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const renderChatItem = ({ item }) => {
    const badge = SERVICE_MAP[item.bookingType?.toLowerCase()] || { label: 'Other', color: C.muted, bg: '#F1F5F9' };
    const isUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.chatItem, isUnread && styles.chatItemUnread]}
        onPress={() => navigation.navigate('ChatScreen', {
          bookingId: item.bookingId,
          customerName: item.customerName,
          bookingNumber: item.bookingNumber,
          serviceType: item.bookingType,
        })}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {item.customerAvatar ? (
            <Image source={{ uri: item.customerAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: badge.bg }]}>
              <Text style={[styles.avatarText, { color: badge.color }]}>
                {item.customerName?.charAt(0)?.toUpperCase() || 'C'}
              </Text>
            </View>
          )}
          {isUnread && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadDotText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.rowBetween}>
            <Text style={[styles.customerName, isUnread && styles.bold]} numberOfLines={1}>
              {item.customerName || 'Customer'}
            </Text>
            <Text style={[styles.timeText, isUnread && styles.timeUnread]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.rowAligned}>
            <View style={[styles.servicePill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.servicePillText, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={styles.bookingNo} numberOfLines={1}>#{item.bookingNumber}</Text>
          </View>

          <View style={styles.rowAligned}>
            {item.lastSenderType === 'VENDOR' && (
              <Ionicons name="checkmark-done" size={14} color={isUnread ? C.brand : C.muted} style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.lastMsg, isUnread && styles.lastMsgUnread]} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
        </View>

        <Icon name="chevron-right" size={16} color={isUnread ? C.brand : '#CBD5E1'} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSub}>
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.unreadToggle, unreadOnly && styles.unreadToggleActive]}
            onPress={() => setUnreadOnly(!unreadOnly)}
          >
            <Ionicons name="mail-unread-outline" size={18} color={unreadOnly ? '#fff' : C.muted} />
            {unreadCount > 0 && (
              <View style={styles.unreadToggleBadge}>
                <Text style={styles.unreadToggleBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, booking, service..."
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Service Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {SERVICE_TYPES.map((s) => {
            const isActive = serviceFilter === s.key;
            const count = s.key === 'all' ? chats.length : (serviceCounts[s.key] || 0);
            if (s.key !== 'all' && count === 0) return null;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.chip, isActive && { backgroundColor: s.bg, borderColor: s.color }]}
                onPress={() => setServiceFilter(s.key)}
                activeOpacity={0.7}
              >
                <Icon name={s.icon} size={13} color={isActive ? s.color : C.muted} />
                <Text style={[styles.chipText, isActive && { color: s.color, fontWeight: '700' }]}>
                  {s.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.chipCount, isActive && { backgroundColor: s.color }]}>
                    <Text style={[styles.chipCountText, isActive && { color: '#fff' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {filteredChats.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCircle}>
            <Ionicons name="chatbubbles-outline" size={48} color={C.brand} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Results Found' : unreadOnly ? 'No Unread Messages' : serviceFilter !== 'all' ? 'No Chats Here' : 'No Chats Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try a different name, booking number, or service'
              : unreadOnly
              ? 'All caught up! Check "All" to see previous chats'
              : 'Your customer conversations will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.bookingId?.toString() || item.id?.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  headerSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  unreadToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  unreadToggleActive: { backgroundColor: C.brand, borderColor: C.brand },
  unreadToggleBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadToggleBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },

  // Filter Chips
  chipsContainer: { paddingHorizontal: 16, gap: 8, paddingBottom: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipCountText: { fontSize: 10, fontWeight: '700', color: C.muted },

  // List
  listContent: { padding: 14, paddingBottom: 100 },

  // Chat Item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chatItemUnread: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },

  // Avatar
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  unreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.surface,
  },
  unreadDotText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  // Content
  chatContent: { flex: 1, marginRight: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowAligned: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  customerName: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1, marginRight: 6 },
  bold: { fontWeight: '700' },
  timeText: { fontSize: 11, color: C.muted },
  timeUnread: { color: '#15803D', fontWeight: '600' },
  servicePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  servicePillText: { fontSize: 11, fontWeight: '700' },
  bookingNo: { fontSize: 12, color: C.muted, flex: 1 },
  lastMsg: { fontSize: 13, color: C.muted, flex: 1 },
  lastMsgUnread: { color: C.text, fontWeight: '500' },

  // Empty
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21, maxWidth: 260 },
});

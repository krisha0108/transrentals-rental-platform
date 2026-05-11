import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getDriverChatList } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#043927', bg: '#F0F4F8', card: '#FFFFFF',
  border: '#E2EAF4', text: '#0F172A', sub: '#64748B',
};

const SVC_LABEL = {
  chauffeur: 'Chauffeur', bus: 'Bus', truck: 'Truck',
  packers: 'Packers', equipment: 'Equipment', luxury: 'Luxury', b2b: 'B2B',
};
const SVC_COLOR = {
  chauffeur: { bg: '#EFF6FF', text: '#1D4ED8' },
  bus:       { bg: '#FEF3C7', text: '#D97706' },
  truck:     { bg: '#FFF7ED', text: '#EA580C' },
  packers:   { bg: '#F0FDF4', text: '#16A34A' },
  equipment: { bg: '#F0F9FF', text: '#0369A1' },
  luxury:    { bg: '#FDF4FF', text: '#9333EA' },
  b2b:       { bg: '#F5F3FF', text: '#7C3AED' },
};

function timeAgo(dateStr) {
  return moment(dateStr).fromNow();
}

function ConversationItem({ item, onPress }) {
  const name = item.customer?.name || 'Customer';
  const initial = name.charAt(0).toUpperCase();
  const lastMsg = item.lastMessage?.content || 'No messages yet';
  const time = item.lastMessageAt ? timeAgo(item.lastMessageAt) : '';
  const unread = item.unreadCount || 0;
  const svcLabel = SVC_LABEL[item.bookingType] || item.bookingType || 'Booking';
  const svcStyle = SVC_COLOR[item.bookingType] || { bg: '#F1F5F9', text: '#64748B' };
  const shortId = item.bookingNumber || (item.bookingId ? item.bookingId.slice(-8).toUpperCase() : null);
  const isSentByDriver = item.lastMessage?.senderType === 'driver';

  return (
    <TouchableOpacity style={styles.convItem} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <LinearGradient colors={['#16A34A', '#065F46']} style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
        {unread > 0 && (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Main content */}
      <View style={styles.convContent}>
        <View style={styles.convRow}>
          <Text style={[styles.convName, unread > 0 && styles.convNameBold]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.convTime}>{time}</Text>
        </View>

        <View style={styles.convRow}>
          <Text style={[styles.convMsg, unread > 0 && styles.convMsgBold]} numberOfLines={1}>
            {isSentByDriver ? <Text style={styles.youLabel}>You: </Text> : null}{lastMsg}
          </Text>
        </View>

        {/* Service + booking ID */}
        <View style={styles.metaRow}>
          <View style={[styles.svcChip, { backgroundColor: svcStyle.bg }]}>
            <Text style={[styles.svcChipText, { color: svcStyle.text }]}>{svcLabel}</Text>
          </View>
          {shortId && (
            <Text style={styles.bookingIdText}>#{shortId}</Text>
          )}
        </View>
      </View>

    </TouchableOpacity>
  );
}

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getDriverChatList();
      if (res.data?.success) setConversations(res.data.conversations || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 10000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = search.trim()
    ? conversations.filter(c => {
        const q = search.toLowerCase();
        return (
          c.customer?.name?.toLowerCase().includes(q) ||
          c.bookingId?.toLowerCase().includes(q) ||
          (SVC_LABEL[c.bookingType] || c.bookingType || '').toLowerCase().includes(q)
        );
      })
    : conversations;

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={15} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, booking ID, service..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              onPress={() => navigation.navigate('DriverChat', {
                conversationId: item.id,
                customerName: item.customer?.name || 'Customer',
                bookingId: item.bookingId,
                bookingType: item.bookingType,
                bookingNumber: item.bookingNumber,
              })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.emptyIconBg}>
                <Ionicons name="chatbubble-ellipses-outline" size={44} color={C.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>{search ? 'No results found' : 'No conversations yet'}</Text>
              <Text style={styles.emptySub}>
                {search
                  ? 'Try a different search term'
                  : 'When you accept a booking and start chatting with a customer, it will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  searchWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text, padding: 0 },

  list: { paddingTop: 8, paddingBottom: 16 },
  emptyContainer: { flex: 1 },

  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, marginHorizontal: 14, marginVertical: 4,
    borderRadius: 16, padding: 14,
    shadowColor: '#1E293B', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },

  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  avatarBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    borderWidth: 2, borderColor: '#fff',
  },
  avatarBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },

  convContent: { flex: 1, minWidth: 0 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convName: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1, marginRight: 6 },
  convNameBold: { fontWeight: '800' },
  convTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500', flexShrink: 0 },
  convMsg: { fontSize: 13, color: '#94A3B8', flex: 1 },
  convMsgBold: { fontWeight: '600', color: '#475569' },
  youLabel: { color: '#16A34A', fontWeight: '600' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  svcChip: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2.5 },
  svcChipText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  bookingIdText: { fontSize: 10, fontWeight: '600', color: '#94A3B8', letterSpacing: 0.5 },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  emptyIconBg: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getDriverChatList } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', bg: '#F0F4F8', card: '#FFFFFF',
  border: '#E2EAF4', text: '#0F172A', sub: '#64748B',
  danger: '#EF4444',
};

function ConversationItem({ item, onPress }) {
  const name = item.customer?.name || 'Customer';
  const initial = name.charAt(0).toUpperCase();
  const lastMsg = item.lastMessage?.content || 'No messages yet';
  const time = item.lastMessageAt ? moment(item.lastMessageAt).fromNow() : '';
  const unread = item.unreadCount || 0;

  return (
    <TouchableOpacity style={styles.convItem} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      {/* Content */}
      <View style={styles.convContent}>
        <View style={styles.convHeader}>
          <Text style={styles.convName} numberOfLines={1}>{name}</Text>
          <Text style={styles.convTime}>{time}</Text>
        </View>
        <View style={styles.convMeta}>
          <Text style={[styles.convMsg, unread > 0 && styles.convMsgUnread]} numberOfLines={1}>
            {item.lastMessage?.senderType === 'driver' ? 'You: ' : ''}{lastMsg}
          </Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
        <View style={styles.bookingChip}>
          <Ionicons name="car-outline" size={10} color={C.sub} />
          <Text style={styles.bookingChipText}>
            {item.bookingType === 'chauffeur' ? 'Chauffeur' : item.bookingType} • {item.bookingId?.slice(0, 8) || '—'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getDriverChatList();
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 10000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            item={item}
            onPress={() => navigation.navigate('DriverChat', { conversationId: item.id, customerName: item.customer?.name || 'Customer' })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>
              When you accept a booking and start chatting with a customer, it will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#043927', paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  list: { paddingVertical: 8 },
  emptyContainer: { flex: 1 },

  convItem: {
    flexDirection: 'row', backgroundColor: C.card,
    marginHorizontal: 16, marginVertical: 4, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    alignItems: 'center', gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: C.primary },
  convContent: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  convTime: { fontSize: 11, color: C.sub, fontWeight: '500', marginLeft: 8 },
  convMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  convMsg: { fontSize: 13, color: C.sub, flex: 1 },
  convMsgUnread: { fontWeight: '600', color: C.text },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  bookingChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingChipText: { fontSize: 11, color: C.sub, fontWeight: '500' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 20 },
});

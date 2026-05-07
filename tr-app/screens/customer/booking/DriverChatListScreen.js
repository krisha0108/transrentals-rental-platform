import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import chatService from '../../services/chatService';
import { TEAL_DEEP, TEAL, TEAL_LIGHT } from '../../../theme';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function DriverChatListScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getDriverConversations();
      if (data?.conversations) setConversations(data.conversations);
    } catch (e) {
      console.log('Driver chat list error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadConversations();
    pollRef.current = setInterval(loadConversations, 10000);
    return () => clearInterval(pollRef.current);
  }, [loadConversations]));

  const renderItem = ({ item }) => {
    const driverName = item.driver?.name || 'Driver';
    const initial = driverName.charAt(0).toUpperCase();
    const lastMsg = item.lastMessage?.content || 'No messages yet';
    const time = item.lastMessageAt ? timeAgo(item.lastMessageAt) : '';
    const unread = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('DriverChat', { conversationId: item.id, driverName })}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.name, unread > 0 && styles.nameUnread]} numberOfLines={1}>{driverName}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.lastMsg, unread > 0 && styles.lastMsgUnread]} numberOfLines={1}>
              {item.lastMessage?.senderType === 'customer' ? 'You: ' : ''}{lastMsg}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
          <Text style={styles.type}>Chauffeur booking</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Chats</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} />}
          contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : { paddingVertical: 8 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="car-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No driver chats yet</Text>
              <Text style={styles.emptySub}>Driver chats appear after your booking is accepted by a driver.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0D7377', paddingHorizontal: 16, paddingVertical: 14,
  },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  item: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginVertical: 4, borderRadius: 14, padding: 14, alignItems: 'center', gap: 12, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#16A34A' },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginLeft: 8 },
  lastMsg: { fontSize: 13, color: '#94A3B8', flex: 1 },
  lastMsgUnread: { fontWeight: '600', color: '#0F172A' },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  type: { fontSize: 11, color: '#CBD5E1', fontWeight: '500' },
  emptyContainer: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8, marginTop: 16, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image, TextInput, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet } from '../../api/client';
import { ListSkeleton } from '../../../components/SkeletonLoader';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  orange: '#EA580C', orangeL: '#FFF7ED',
};

const SERVICE_TYPES = [
  { key: 'all',        label: 'All',        icon: 'car-multiple',    color: C.g700,   bg: C.g50 },
  { key: 'bike',       label: 'Bike',       icon: 'motorbike',       color: C.orange, bg: C.orangeL },
  { key: 'chauffeur',  label: 'Car Rental', icon: 'car-side',        color: C.g700,   bg: C.g50 },
  { key: 'self-drive', label: 'Self Drive', icon: 'car',             color: C.blue,   bg: C.blueL },
  { key: 'bus',        label: 'Bus',        icon: 'bus',             color: C.amber,  bg: C.amberL },
  { key: 'truck',      label: 'Truck',      icon: 'truck-delivery',  color: C.purple, bg: C.purpleL },
  { key: 'luxury',     label: 'Luxury',     icon: 'car-sports',      color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'packers',    label: 'Packers',    icon: 'package-variant', color: C.orange, bg: C.orangeL },
  { key: 'equipment',  label: 'Equipment',  icon: 'crane',           color: C.red,    bg: C.redL },
];

const SERVICE_MAP = {
  bike:        { label: 'Bike Rental',  color: C.orange, bg: C.orangeL },
  car:         { label: 'Self Drive',   color: C.blue,   bg: C.blueL },
  'self-drive':{ label: 'Self Drive',   color: C.blue,   bg: C.blueL },
  bus:         { label: 'Bus Rental',   color: C.amber,  bg: C.amberL },
  truck:       { label: 'Truck Rental', color: C.purple, bg: C.purpleL },
  luxury:      { label: 'Luxury Car',   color: '#8B5CF6', bg: '#EDE9FE' },
  chauffeur:   { label: 'Car Rental',   color: C.g700,   bg: C.g50 },
  packers:     { label: 'Packers',      color: C.orange, bg: C.orangeL },
  equipment:   { label: 'Equipment',    color: C.red,    bg: C.redL },
};

export default function ChatListScreen({ navigation }) {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [chats, setChats]             = useState([]);
  const [unreadOnly, setUnreadOnly]   = useState(false);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

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

  const unreadCount   = chats.filter(c => c.unreadCount > 0).length;
  const serviceCounts = chats.reduce((acc, c) => {
    const k = c.bookingType?.toLowerCase() || 'other';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const renderChatItem = ({ item }) => {
    const badge   = SERVICE_MAP[item.bookingType?.toLowerCase()] || { label: 'Other', color: C.muted, bg: C.bg };
    const isUnread = item.unreadCount > 0;
    const initials = item.customerName?.charAt(0)?.toUpperCase() || 'C';

    return (
      <TouchableOpacity
        style={[st.chatCard, isUnread && st.chatCardUnread]}
        onPress={() => navigation.navigate('ChatScreen', {
          bookingId: item.bookingId,
          customerName: item.customerName,
          bookingNumber: item.bookingNumber,
          serviceType: item.bookingType,
        })}
        activeOpacity={0.78}
      >
        {/* Unread left bar */}
        {isUnread && <View style={st.unreadBar} />}

        {/* Avatar */}
        <View style={st.avatarWrap}>
          {item.customerAvatar ? (
            <Image source={{ uri: item.customerAvatar }} style={st.avatar} />
          ) : (
            <LinearGradient colors={[badge.color + 'EE', badge.color + '99']} style={st.avatarCircle}>
              <Text style={st.avatarInitial}>{initials}</Text>
            </LinearGradient>
          )}
          {isUnread && (
            <View style={st.unreadBadge}>
              <Text style={st.unreadBadgeTxt}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={st.chatMeta}>
          {/* Row 1: name + time */}
          <View style={st.chatRow}>
            <Text style={[st.chatName, isUnread && { fontWeight: '800', color: C.text }]} numberOfLines={1}>
              {item.customerName || 'Customer'}
            </Text>
            <Text style={[st.chatTime, isUnread && { color: C.g600, fontWeight: '700' }]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          {/* Row 2: service pill + booking no */}
          <View style={st.chatRow2}>
            <View style={[st.svcPill, { backgroundColor: badge.bg }]}>
              <Text style={[st.svcPillTxt, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={st.bookingNo} numberOfLines={1}>#{item.bookingNumber}</Text>
          </View>

          {/* Row 3: last message */}
          <View style={st.chatRow3}>
            {item.lastSenderType === 'VENDOR' && (
              <Ionicons name="checkmark-done" size={13} color={isUnread ? C.g600 : C.muted} style={{ marginRight: 3 }} />
            )}
            <Text style={[st.lastMsg, isUnread && { color: C.text, fontWeight: '600' }]} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
          <View style={st.heroTopSimple}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={st.heroTitle}>Messages</Text>
            <View style={{ width: 38 }} />
          </View>
        </LinearGradient>
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
        <View style={[st.deco, { width: 160, height: 160, top: -60, right: -40, opacity: 0.07 }]} />
        <View style={[st.deco, { width: 70, height: 70, top: 8, right: 100, opacity: 0.04 }]} />

        <View style={st.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={st.heroMid}>
            <View style={st.heroBadge}>
              <MaterialCommunityIcons name="chat-processing" size={11} color={C.g400} />
              <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
            </View>
            <Text style={st.heroTitle}>Messages</Text>
            <Text style={st.heroSub}>
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[st.unreadToggle, unreadOnly && st.unreadToggleActive]}
            onPress={() => setUnreadOnly(!unreadOnly)}
          >
            <Ionicons name="mail-unread-outline" size={18} color={unreadOnly ? C.g900 : 'rgba(255,255,255,0.8)'} />
            {unreadCount > 0 && (
              <View style={st.unreadToggleDot}>
                <Text style={st.unreadToggleDotTxt}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar inside hero */}
        <View style={st.searchBar}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            style={st.searchInput}
            placeholder="Search name, booking, service..."
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── SERVICE FILTER CHIPS ── */}
      <View style={st.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterScroll}>
          {SERVICE_TYPES.map((s) => {
            const isActive = serviceFilter === s.key;
            const count = s.key === 'all' ? chats.length : (serviceCounts[s.key] || 0);
            if (s.key !== 'all' && count === 0) return null;
            return (
              <TouchableOpacity
                key={s.key}
                style={[st.filterChip, isActive && { backgroundColor: s.bg, borderColor: s.color }]}
                onPress={() => setServiceFilter(s.key)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={s.icon} size={13} color={isActive ? s.color : C.muted} />
                <Text style={[st.filterChipTxt, isActive && { color: s.color }]}>{s.label}</Text>
                {count > 0 && (
                  <View style={[st.filterChipBadge, isActive && { backgroundColor: s.color }]}>
                    <Text style={[st.filterChipBadgeTxt, isActive && { color: '#fff' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── LIST ── */}
      {filteredChats.length === 0 ? (
        <View style={st.empty}>
          <View style={st.emptyIcon}>
            <MaterialCommunityIcons name="chat-processing-outline" size={40} color={C.g500} />
          </View>
          <Text style={st.emptyTitle}>
            {searchQuery ? 'No Results Found' : unreadOnly ? 'No Unread Messages' : serviceFilter !== 'all' ? 'No Chats Here' : 'No Chats Yet'}
          </Text>
          <Text style={st.emptyMsg}>
            {searchQuery
              ? 'Try a different name, booking, or service'
              : unreadOnly
              ? 'All caught up! Tap the mail icon to see all chats'
              : 'Your customer conversations will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.bookingId?.toString() || item.id?.toString()}
          contentContainerStyle={st.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Hero */
  hero:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, overflow: 'hidden' },
  heroLoading: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  heroTopSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  heroMid: { flex: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 5 },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.g400 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  unreadToggle: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 2 },
  unreadToggleActive: { backgroundColor: '#fff' },
  unreadToggleDot: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.red, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: C.g800 },
  unreadToggleDotTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },

  /* Search */
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  /* Filter chips */
  filterWrap:   { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  filterChipTxt:   { fontSize: 12, fontWeight: '700', color: C.muted },
  filterChipBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterChipBadgeTxt: { fontSize: 10, fontWeight: '800', color: C.muted },

  /* List */
  listContent: { padding: 14, paddingBottom: 100, gap: 10 },

  /* Chat card */
  chatCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    overflow: 'hidden',
  },
  chatCardUnread: { borderColor: C.g100, backgroundColor: C.g50 },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.g500, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },

  /* Avatar */
  avatarWrap:    { marginRight: 12, position: 'relative' },
  avatar:        { width: 52, height: 52, borderRadius: 26 },
  avatarCircle:  { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: '#fff' },
  unreadBadge:   { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: C.card },
  unreadBadgeTxt:{ fontSize: 9, fontWeight: '800', color: '#fff' },

  /* Chat content */
  chatMeta: { flex: 1, gap: 3 },
  chatRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatRow2: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatRow3: { flexDirection: 'row', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 6 },
  chatTime: { fontSize: 11, color: C.muted, fontWeight: '500' },
  svcPill:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  svcPillTxt: { fontSize: 10, fontWeight: '700' },
  bookingNo:  { fontSize: 11, color: C.muted, flex: 1 },
  lastMsg:    { fontSize: 13, color: C.muted, flex: 1 },

  /* Empty */
  empty:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: C.g100 },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  emptyMsg:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
});

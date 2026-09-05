import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
  orange: T.orange, orangeL: T.orangeL,
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
  const [searchOpen, setSearchOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

  const fetchChats = useCallback(async () => {
    try {
      const response = await apiGet('/vendor/chats');
      setChats(response.data?.chats || []);
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

  // Group chats by customerId → one entry per customer
  const customerGroups = useMemo(() => {
    const map = {};
    chats.forEach((chat) => {
      const cid = chat.customerId || `guest-${chat.bookingId}`;
      if (!map[cid]) {
        map[cid] = {
          customerId: cid,
          customerName: chat.customerName,
          customerAvatar: chat.customerAvatar,
          bookings: [],
          totalUnread: 0,
          lastMessageAt: null,
          lastMessage: null,
          lastSenderType: null,
          serviceTypes: new Set(),
        };
      }
      map[cid].bookings.push(chat);
      map[cid].totalUnread += chat.unreadCount || 0;
      map[cid].serviceTypes.add((chat.bookingType || '').toLowerCase());

      const t = chat.lastMessageAt ? new Date(chat.lastMessageAt).getTime() : 0;
      const cur = map[cid].lastMessageAt ? new Date(map[cid].lastMessageAt).getTime() : 0;
      if (t > cur) {
        map[cid].lastMessage = chat.lastMessage;
        map[cid].lastMessageAt = chat.lastMessageAt;
        map[cid].lastSenderType = chat.lastSenderType;
      }
    });

    // Sort each group's bookings newest first
    Object.values(map).forEach((g) => {
      g.bookings.sort((a, b) => {
        const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bT - aT;
      });
    });

    return Object.values(map);
  }, [chats]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    let groups = customerGroups;

    if (unreadOnly) {
      groups = groups.filter((g) => g.totalUnread > 0);
    }

    if (serviceFilter !== 'all') {
      groups = groups.filter((g) =>
        g.bookings.some((b) => (b.bookingType || '').toLowerCase() === serviceFilter)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      groups = groups.filter((g) => {
        const svcLabels = Array.from(g.serviceTypes).map(
          (t) => (SERVICE_MAP[t]?.label || '').toLowerCase()
        );
        return (
          g.customerName?.toLowerCase().includes(q) ||
          g.bookings.some((b) => b.bookingNumber?.toLowerCase().includes(q)) ||
          svcLabels.some((l) => l.includes(q))
        );
      });
    }

    // Sort by latest message
    return groups.sort((a, b) => {
      const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bT - aT;
    });
  }, [customerGroups, unreadOnly, serviceFilter, searchQuery]);

  const unreadCount = customerGroups.filter((g) => g.totalUnread > 0).length;

  // Count groups per service type for filter badge
  const serviceCounts = useMemo(() => {
    const acc = {};
    chats.forEach((c) => {
      const k = (c.bookingType || '').toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
    });
    return acc;
  }, [chats]);

  const openCustomerChat = (group) => {
    const topBooking = group.bookings[0];
    navigation.navigate('ChatScreen', {
      bookingId: topBooking.bookingId,
      customerName: group.customerName,
      bookingNumber: topBooking.bookingNumber,
      serviceType: topBooking.bookingType,
      customerAvatar: group.customerAvatar || null,
      customerBookings: group.bookings,  // all bookings for this customer
    });
  };

  const renderCustomerGroup = ({ item: group }) => {
    const isUnread = group.totalUnread > 0;
    const initials = group.customerName?.charAt(0)?.toUpperCase() || 'C';
    // Pick primary service type color from first booking
    const primaryType = group.bookings[0]?.bookingType?.toLowerCase() || 'chauffeur';
    const badge = SERVICE_MAP[primaryType] || { label: 'Other', color: C.muted, bg: C.bg };

    return (
      <TouchableOpacity
        style={[st.chatCard, isUnread && st.chatCardUnread]}
        onPress={() => openCustomerChat(group)}
        activeOpacity={0.78}
      >
        {isUnread && <View style={st.unreadBar} />}

        {/* Avatar */}
        <View style={st.avatarWrap}>
          {group.customerAvatar ? (
            <Image source={{ uri: group.customerAvatar }} style={st.avatar} />
          ) : (
            <LinearGradient colors={[badge.color + 'EE', badge.color + '99']} style={st.avatarCircle}>
              <Text style={st.avatarInitial}>{initials}</Text>
            </LinearGradient>
          )}
          {isUnread && (
            <View style={st.unreadBadge}>
              <Text style={st.unreadBadgeTxt}>{group.totalUnread > 9 ? '9+' : group.totalUnread}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={st.chatMeta}>
          {/* Row 1: name + time */}
          <View style={st.chatRow}>
            <Text style={[st.chatName, isUnread && { fontWeight: '800', color: C.text }]} numberOfLines={1}>
              {group.customerName || 'Customer'}
            </Text>
            <Text style={[st.chatTime, isUnread && { color: C.g600, fontWeight: '700' }]}>
              {formatTime(group.lastMessageAt)}
            </Text>
          </View>

          {/* Row 2: booking count pill + service type chips */}
          <View style={st.chatRow2}>
            <View style={st.bookingCountPill}>
              <MaterialCommunityIcons name="briefcase-outline" size={10} color={C.g700} />
              <Text style={st.bookingCountTxt}>
                {group.bookings.length} {group.bookings.length === 1 ? 'booking' : 'bookings'}
              </Text>
            </View>
            {Array.from(group.serviceTypes).slice(0, 3).map((type) => {
              const s = SERVICE_MAP[type] || { label: type, color: C.muted, bg: C.bg };
              return (
                <View key={type} style={[st.svcPill, { backgroundColor: s.bg }]}>
                  <Text style={[st.svcPillTxt, { color: s.color }]}>{s.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Row 3: last message */}
          <View style={st.chatRow3}>
            {group.lastSenderType === 'VENDOR' && (
              <Ionicons name="checkmark-done" size={13} color={isUnread ? C.g600 : C.muted} style={{ marginRight: 3 }} />
            )}
            <Text style={[st.lastMsg, isUnread && { color: C.text, fontWeight: '600' }]} numberOfLines={1}>
              {group.lastMessage || 'No messages yet'}
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
        <LinearGradient colors={G.hero} style={st.heroLoading}>
          <CornerGrid style={st.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <View style={st.heroTopSimple}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={st.heroTitle}>Messages</Text>
            <View style={{ width: 38 }} />
          </View>
        </LinearGradient>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: rs(16), padding: 14, borderWidth: 1, borderColor: C.border }}>
              <Bone w={52} h={52} r={16} style={{ marginRight: 12 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Bone w={120} h={13} r={4} />
                  <Bone w={40} h={10} r={4} />
                </View>
                <Bone w={90} h={18} r={9} />
                <Bone w="60%" h={11} r={4} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
        <CornerGrid style={st.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <View style={st.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={st.heroMid}>
            <Text style={st.heroTitle}>Messages</Text>
            <Text style={st.heroSub}>
              {customerGroups.length} customer{customerGroups.length !== 1 ? 's' : ''}{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={st.unreadToggle}
            onPress={() => {
              setSearchOpen(v => !v);
              if (searchOpen) setSearchQuery('');
            }}
          >
            <Ionicons name={searchOpen ? 'close' : 'search'} size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
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

        {/* Search bar — toggled open/closed via the search icon above */}
        {searchOpen && (
          <View style={st.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={st.searchInput}
              placeholder="Search customer, booking, service..."
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        )}
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
      {filteredGroups.length === 0 ? (
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
          data={filteredGroups}
          renderItem={renderCustomerGroup}
          keyExtractor={(item) => item.customerId}
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

  hero:        {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  heroLoading: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  heroTopSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  heroMid: { flex: 1 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  unreadToggle: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 2 },
  unreadToggleActive: { backgroundColor: '#fff' },
  unreadToggleDot: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.red, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: C.g800 },
  unreadToggleDotTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: '#fff', padding: 0, fontWeight: '600' },

  filterWrap:   { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  filterChipTxt:   { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', color: C.muted },
  filterChipBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterChipBadgeTxt: { fontSize: 11, fontWeight: '800', color: C.muted },

  listContent: { padding: 14, paddingBottom: 120, gap: 10 },

  chatCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(16), padding: 14,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
    overflow: 'hidden',
  },
  chatCardUnread: { borderColor: C.g100, backgroundColor: C.g50 },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.g500, borderTopLeftRadius: rs(16), borderBottomLeftRadius: rs(16) },

  avatarWrap:    { marginRight: 12, position: 'relative' },
  avatar:        { width: 52, height: 52, borderRadius: 16 },
  avatarCircle:  { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff' },
  unreadBadge:   { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: C.card },
  unreadBadgeTxt:{ fontSize: 10, fontWeight: '800', color: '#fff' },

  chatMeta: { flex: 1, gap: 4 },
  chatRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatRow2: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  chatRow3: { flexDirection: 'row', alignItems: 'center' },
  chatName: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 6 },
  chatTime: { fontSize: 12, color: C.muted, fontWeight: '600' },

  bookingCountPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.g50, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.g100 },
  bookingCountTxt: { fontSize: 11, fontWeight: '700', color: C.g700 },

  svcPill:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  svcPillTxt: { fontSize: 11, fontWeight: '700' },
  lastMsg:    { fontSize: 14, color: C.muted, flex: 1 },

  empty:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: C.g100 },
  emptyTitle:{ fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  emptyMsg:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
});

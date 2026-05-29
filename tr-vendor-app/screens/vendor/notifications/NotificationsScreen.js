import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getVendorNotifications, markVendorNotificationsRead } from '../../api/client';
import { NotifBadgeContext } from '../../../contexts/NotifBadgeContext';
import { ListSkeleton } from '../../../components/SkeletonLoader';

const { width: W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50:  '#ECFDF5',
  bg:     '#F1F5F9',
  card:   '#FFFFFF',
  border: '#E2E8F0',
  text:   '#0F172A',
  sub:    '#475569',
  muted:  '#94A3B8',
  blue:   '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  amber:  '#D97706', amberL:  '#FFFBEB',
  red:    '#DC2626', redL:    '#FEF2F2',
};

// WhatsApp-style avatar palette — name hashes into one of these so the same
// contact always gets the same color across notifications.
const AVATAR_PALETTE = [
  '#0EA5A4', // teal
  '#10B981', // emerald (matches brand)
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#EF4444', // red
  '#14B8A6', // teal-bright
  '#6366F1', // indigo
];

function avatarColorFor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// ── Notification type config ───────────────────────────────────
const NOTIF_CONFIG = {
  quote_request:             { icon: 'file-text',    color: C.purple, bg: C.purpleL },
  chat:                      { icon: 'message-square', color: C.g600, bg: C.g50    },
  new_message:               { icon: 'message-square', color: C.g600, bg: C.g50    },
  direct_booking_inquiry:    { icon: 'inbox',         color: C.blue,   bg: C.blueL  },
  booking_new:               { icon: 'calendar',      color: C.blue,   bg: C.blueL  },
  booking_accepted:          { icon: 'check-circle',  color: C.g600,   bg: C.g50    },
  booking_confirmed:         { icon: 'check-circle',  color: C.g600,   bg: C.g50    },
  booking_assigned:          { icon: 'calendar',      color: C.blue,   bg: C.blueL  },
  booking_cancelled:         { icon: 'x-circle',      color: C.red,    bg: C.redL   },
  booking_rejected:          { icon: 'x-circle',      color: C.red,    bg: C.redL   },
  quote_accepted:            { icon: 'check-circle',  color: C.g600,   bg: C.g50    },
  payment_received:          { icon: 'credit-card',   color: C.g600,   bg: C.g50    },
  advance_paid:              { icon: 'credit-card',   color: C.g600,   bg: C.g50    },
  payment:                   { icon: 'credit-card',   color: C.g600,   bg: C.g50    },
  trip_started:              { icon: 'navigation',    color: C.blue,   bg: C.blueL  },
  trip_complete:             { icon: 'flag',          color: C.g600,   bg: C.g50    },
  trip_completed:            { icon: 'flag',          color: C.g600,   bg: C.g50    },
  document_approved:         { icon: 'file',          color: C.g600,   bg: C.g50    },
  document_rejected:         { icon: 'file',          color: C.red,    bg: C.redL   },
  document:                  { icon: 'file',          color: C.amber,  bg: C.amberL },
  location_approved:         { icon: 'map-pin',       color: C.g600,   bg: C.g50    },
  location_rejected:         { icon: 'map-pin',       color: C.red,    bg: C.redL   },
  service_approved:          { icon: 'shield',        color: C.g600,   bg: C.g50    },
  service_rejected:          { icon: 'shield',        color: C.red,    bg: C.redL   },
  approval:                  { icon: 'shield',        color: C.g600,   bg: C.g50    },
  p2p_booking_accepted:      { icon: 'users',         color: C.blue,   bg: C.blueL  },
  p2p_deal_confirmed:        { icon: 'users',         color: C.g600,   bg: C.g50    },
  p2p_trip_started:          { icon: 'navigation',    color: C.blue,   bg: C.blueL  },
  p2p_trip_completed:        { icon: 'flag',          color: C.g600,   bg: C.g50    },
  p2p_vehicle_requested:     { icon: 'truck',         color: C.purple, bg: C.purpleL},
  p2p_request_accepted:      { icon: 'check-circle',  color: C.g600,   bg: C.g50    },
  p2p_request_rejected:      { icon: 'x-circle',      color: C.red,    bg: C.redL   },
  p2p_transaction_created:   { icon: 'users',         color: C.blue,   bg: C.blueL  },
  p2p_transaction_cancelled: { icon: 'x-circle',      color: C.red,    bg: C.redL   },
  p2p_new_booking_posted:    { icon: 'plus-circle',   color: C.blue,   bg: C.blueL  },
  p2p_posting_cancelled:     { icon: 'x-circle',      color: C.red,    bg: C.redL   },
  p2p_rating_received:       { icon: 'star',          color: C.amber,  bg: C.amberL },
  p2p_new_comment:           { icon: 'message-circle',color: C.blue,   bg: C.blueL  },
  general:                   { icon: 'bell',          color: C.blue,   bg: C.blueL  },
};

const QUOTE_SCREEN_MAP = {
  bike: 'BikeQuoteRequestDetail', bus: 'BusQuoteRequestDetail',
  truck: 'TruckQuoteRequestDetail', luxury: 'LuxuryQuoteRequestDetail',
  packers: 'PackersQuoteRequestDetail', equipment: 'EquipmentQuoteRequestDetail',
  'self-drive': 'SelfDriveQuoteRequestDetail',
};
const BOOKING_DETAIL_SCREEN_MAP = {
  bike: 'BikeBookingDetail', car: 'CarRentalBookingDetail',
  'chauffeur-service': 'CarRentalBookingDetail', 'self-drive': 'SelfDriveBookingDetail',
  bus: 'BusBookingDetail', 'bus-rental': 'BusBookingDetail',
  truck: 'TruckBookingDetail', 'truck-rental': 'TruckBookingDetail',
  luxury: 'LuxuryBookingDetail', 'luxury-car-rental': 'LuxuryBookingDetail',
  packers: 'PackersBookingDetail', 'packers-and-movers': 'PackersBookingDetail',
  equipment: 'EquipmentBookingDetail', 'equipment-rental': 'EquipmentBookingDetail',
};

// ── Helpers ───────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now   = new Date();
  const diffMs    = now - date;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getGroup(dateStr) {
  if (!dateStr) return 'Earlier';
  const date    = new Date(dateStr);
  const now     = new Date();
  const diffMs  = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return 'This Week';
  return 'Earlier';
}

// Group + inject section headers
function buildListData(notifications) {
  const groups = {};
  const ORDER  = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  notifications.forEach(n => {
    const g = getGroup(n.createdAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  });
  const result = [];
  ORDER.forEach(g => {
    if (groups[g]?.length) {
      result.push({ type: 'header', id: `hdr_${g}`, label: g, count: groups[g].length });
      groups[g].forEach(n => result.push({ type: 'item', ...n }));
    }
  });
  return result;
}

// ── Skeleton bone ──────────────────────────────────────────────
const Bone = ({ w, h, r = 6 }) => (
  <View style={{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }} />
);

export default function NotificationsScreen({ navigation }) {
  const { refreshBadge } = React.useContext(NotifBadgeContext);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await getVendorNotifications();
      setNotifications(response?.notifications || []);
    } catch (e) {
      console.log('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchNotifications(); setRefreshing(false);
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(async (item) => {
    if (!item.read) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      markVendorNotificationsRead([item.id]).catch(() => {});
      refreshBadge();
    }
    const { type, serviceType, requestId, bookingId } = item;
    if (type === 'quote_request' && serviceType && requestId) {
      if (serviceType === 'car') navigation.navigate('CarRentalBookingDetail', { bookingId: requestId });
      else { const s = QUOTE_SCREEN_MAP[serviceType]; if (s) navigation.navigate(s, { requestId }); }
      return;
    }
    if (['payment_received','advance_paid','booking_confirmed','booking_assigned',
         'booking_new','booking_accepted','quote_accepted','trip_started',
         'trip_complete','trip_completed'].includes(type) && serviceType && bookingId) {
      const s = BOOKING_DETAIL_SCREEN_MAP[serviceType];
      if (s) navigation.navigate(s, { bookingId });
      return;
    }
    if ((type === 'chat' || type === 'new_message') && bookingId) {
      navigation.navigate('ChatScreen', { bookingId });
      return;
    }
    if (type === 'direct_booking_inquiry' && bookingId) {
      navigation.navigate('DirectBookingDetail', { bookingId }); return;
    }
    if (type?.startsWith('p2p_')) { navigation.navigate('P2PActivityScreen'); return; }
    if (type === 'document_approved' || type === 'document_rejected') { navigation.navigate('VendorDocuments'); return; }
    if (type === 'location_approved' || type === 'location_rejected') { navigation.navigate('VendorLocations'); return; }
    if (type === 'service_approved' || type === 'service_rejected')   { navigation.navigate('VendorServices'); return; }
  }, [navigation, refreshBadge]);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markVendorNotificationsRead(null).catch(() => {});
    refreshBadge();
  }, [refreshBadge]);

  const hasUnread   = notifications.some(n => n.read === false);
  const unreadCount = notifications.filter(n => n.read === false).length;
  const listData    = buildListData(notifications);

  // ── Render item ────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={s.groupHeader}>
          <Text style={s.groupLabel}>{item.label}</Text>
          <View style={s.groupLine} />
        </View>
      );
    }

    const cfg      = NOTIF_CONFIG[item.type] || NOTIF_CONFIG.general;
    const isUnread = item.read === false;
    const isChat   = item.type === 'chat' || item.type === 'new_message';

    // Older saved chat notifications had a "💬 " emoji prefix on the title;
    // strip defensively so the avatar+name render cleanly either way.
    const cleanTitle = isChat ? (item.title || '').replace(/^💬\s*/, '').trim() : item.title;
    const initial    = isChat && cleanTitle ? cleanTitle.charAt(0).toUpperCase() : '';
    const avatarBg   = isChat ? avatarColorFor(cleanTitle) : null;

    return (
      <TouchableOpacity
        style={[s.card, isUnread && (isChat ? s.cardUnreadChat : s.cardUnread)]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.75}
      >
        {/* Unread left accent bar — only for non-chat (chat uses bolder title + green time) */}
        {isUnread && !isChat && <View style={[s.accentBar, { backgroundColor: cfg.color }]} />}

        {/* Avatar (chat) — WhatsApp-style; or icon (everything else) */}
        {isChat ? (
          <View style={[s.avatar, { backgroundColor: avatarBg }]}>
            <Text style={s.avatarTxt}>{initial || '?'}</Text>
          </View>
        ) : (
          <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={19} color={cfg.color} />
          </View>
        )}

        <View style={s.content}>
          <View style={s.cardTop}>
            <Text
              style={[isChat ? s.chatName : s.title, isUnread && (isChat ? s.chatNameUnread : s.titleUnread)]}
              numberOfLines={1}
            >
              {cleanTitle || (isChat ? 'New message' : 'Notification')}
            </Text>
            <Text style={[s.time, isUnread && (isChat ? s.timeChatUnread : s.timeUnread)]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <Text
            style={[s.body, isChat && s.bodyChat, isChat && isUnread && s.bodyChatUnread]}
            numberOfLines={2}
          >
            {item.body || item.message}
          </Text>
        </View>

        {/* Unread pill — WhatsApp-style green dot on the right for chats */}
        {isUnread && isChat && <View style={[s.unreadDot, { backgroundColor: C.g500 }]} />}
      </TouchableOpacity>
    );
  };

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.heroSk}>
          <SafeAreaView>
            <View style={s.headerRow}>
              <View style={s.backCircleSk} />
              <Bone w={130} h={16} r={6} />
              <Bone w={72} h={14} r={5} />
            </View>
            <Bone w={160} h={10} r={4} style={{ marginTop: 4 }} />
          </SafeAreaView>
        </LinearGradient>
        <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 10 }}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={s.cardSk}>
              <Bone w={44} h={44} r={12} />
              <View style={{ flex: 1, marginLeft: 12, gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Bone w={W * 0.45} h={12} r={5} />
                  <Bone w={44} h={10} r={4} />
                </View>
                <Bone w={W * 0.65} h={10} r={4} />
                <Bone w={W * 0.5} h={10} r={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Header ───────────────────────────────────────────── */}
      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        {/* Deco blob */}
        <View style={s.blob} />
        <SafeAreaView>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={s.headerSub}>{unreadCount} unread</Text>
              )}
            </View>
            {hasUnread && (
              <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.8}>
                <Ionicons name="checkmark-done-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={s.markAllTxt}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── List / Empty ─────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <View style={s.emptyWrap}>
          <LinearGradient colors={[C.g50, C.g100]} style={s.emptyCircle}>
            <Ionicons name="notifications-off-outline" size={44} color={C.g600} />
          </LinearGradient>
          <Text style={s.emptyTitle}>All caught up!</Text>
          <Text style={s.emptyBody}>New notifications will appear here when there's activity on your account.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.g500]} tintColor={C.g400} progressBackgroundColor="#fff" />
          }
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Header ──────────────────────────────────────────────────
  hero:    { paddingHorizontal: 16, paddingBottom: 20, overflow: 'hidden' },
  heroSk:  { paddingHorizontal: 16, paddingBottom: 20 },
  blob: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(52,211,153,0.07)', top: -50, right: -30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  backCircleSk: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 1 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  markAllTxt: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  // ── Group header ─────────────────────────────────────────────
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4,
  },
  groupLabel: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 0.5, marginRight: 10 },
  groupLine:  { flex: 1, height: 1, backgroundColor: C.border },

  // ── Notification card ─────────────────────────────────────────
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#F8FAFF',
    borderColor: '#BFDBFE',
    shadowOpacity: 0.08, elevation: 3,
  },
  // Chat unread — keep card clean white (WhatsApp style) but lift slightly
  cardUnreadChat: {
    shadowOpacity: 0.09, elevation: 3,
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3.5,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  // Chat avatar (WhatsApp-style round, no badge)
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarTxt: {
    color: '#fff', fontSize: 19, fontWeight: '700', letterSpacing: -0.3,
  },
  content:  { flex: 1, minWidth: 0 },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  title:    { fontSize: 13.5, fontWeight: '600', color: C.sub, flex: 1, marginRight: 8 },
  titleUnread: { color: C.text, fontWeight: '700' },
  // Chat name — bigger, like WhatsApp contact name in a chat row
  chatName: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1, marginRight: 8 },
  chatNameUnread: { fontWeight: '700' },
  time:     { fontSize: 10.5, color: C.muted, fontWeight: '500', flexShrink: 0 },
  timeUnread: { color: C.blue, fontWeight: '700' },
  // Chat time — turns brand-green for unread (matches WhatsApp's green tint)
  timeChatUnread: { color: C.g600, fontWeight: '700', fontSize: 11 },
  body:     { fontSize: 12.5, color: C.muted, lineHeight: 18 },
  // Chat body — message preview is the content, so it gets more weight
  bodyChat: { fontSize: 13.5, color: C.sub, lineHeight: 18 },
  bodyChatUnread: { color: C.text, fontWeight: '500' },
  // Right-side unread pill for chat (WhatsApp shows a green dot/badge)
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    marginLeft: 10, flexShrink: 0,
  },

  // ── List ─────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },

  // ── Empty ────────────────────────────────────────────────────
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 10 },
  emptyBody:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },

  // ── Skeleton ─────────────────────────────────────────────────
  cardSk: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
});

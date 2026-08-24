// screens/vendor/notifications/NotificationsScreen.js
// Redesigned to match the travel-agent side notifications screen exactly:
// gradient header, pill filter tabs with icons, date-grouped sections,
// type-color left-border on unread cards, delete + clear-all, polished
// empty state per filter.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  getVendorNotifications, markVendorNotificationsRead, deleteVendorNotifications,
} from '../../api/client';
import { showConfirm, showError } from '../../../services/alertService';
import { NotifBadgeContext } from '../../../contexts/NotifBadgeContext';
import { SC as T, G, rs } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg:     T.bg, card: T.card, border: T.border,
  text:   T.ink, sub: T.text, muted: T.subText,
  blue:   T.blue, blueL: T.blueLight,
  purple: T.purple, purpleL: T.tintPlum,
  amber:  T.amber, amberL: T.amberLight,
  red:    T.red, redL: T.redLight,
  sand:   T.tintSand, shadow: T.shadow,
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

// ── Notification type config — icon + accent colors per type ────
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

// Vendor has far more granular types than travel-agent's 5 buckets, so each
// type is grouped into one of these broader filter categories (used for both
// the pill tabs and the small badge label on each card).
const CATEGORY_OF = {
  quote_request: 'quote',
  chat: 'chat', new_message: 'chat',
  direct_booking_inquiry: 'booking', booking_new: 'booking', booking_accepted: 'booking',
  booking_confirmed: 'booking', booking_assigned: 'booking', booking_cancelled: 'booking',
  booking_rejected: 'booking', quote_accepted: 'booking',
  trip_started: 'booking', trip_complete: 'booking', trip_completed: 'booking',
  payment_received: 'payment', advance_paid: 'payment', payment: 'payment',
  document_approved: 'updates', document_rejected: 'updates', document: 'updates',
  location_approved: 'updates', location_rejected: 'updates',
  service_approved: 'updates', service_rejected: 'updates', approval: 'updates',
  p2p_booking_accepted: 'updates', p2p_deal_confirmed: 'updates', p2p_trip_started: 'updates',
  p2p_trip_completed: 'updates', p2p_vehicle_requested: 'updates', p2p_request_accepted: 'updates',
  p2p_request_rejected: 'updates', p2p_transaction_created: 'updates', p2p_transaction_cancelled: 'updates',
  p2p_new_booking_posted: 'updates', p2p_posting_cancelled: 'updates', p2p_rating_received: 'updates',
  p2p_new_comment: 'updates',
  general: 'updates',
};
const CATEGORY_LABEL = {
  quote: 'Quote', booking: 'Booking', payment: 'Payment', chat: 'Chat', updates: 'Update',
};

const FILTERS = [
  { key: 'all',     label: 'All',      icon: 'apps' },
  { key: 'unread',  label: 'Unread',   icon: 'mail-unread' },
  { key: 'quote',   label: 'Quotes',   icon: 'document-text' },
  { key: 'booking', label: 'Bookings', icon: 'calendar' },
  { key: 'payment', label: 'Payments', icon: 'cash' },
  { key: 'chat',    label: 'Chat',     icon: 'chatbubble-ellipses' },
  { key: 'updates', label: 'Updates',  icon: 'information-circle' },
];

const EMPTY_MAP = {
  all:     { icon: 'notifications-off-outline', title: 'No notifications',  body: "When something happens, you'll see it here." },
  unread:  { icon: 'checkmark-done-circle',      title: 'All caught up! 🎉', body: "You've read everything. Nice work." },
  quote:   { icon: 'document-text-outline',      title: 'No quote activity', body: 'New quote requests will show up here.' },
  booking: { icon: 'calendar-outline',           title: 'No booking events', body: 'Booking updates and trip status will appear here.' },
  payment: { icon: 'cash-outline',               title: 'No payment alerts', body: 'Payments and advances will appear here.' },
  chat:    { icon: 'chatbubbles-outline',        title: 'No chat messages',  body: 'New messages from customers will appear here.' },
  updates: { icon: 'information-circle-outline', title: 'No updates',       body: 'Approvals and account updates will appear here.' },
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
const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];

export default function NotificationsScreen({ navigation }) {
  const { refreshBadge } = React.useContext(NotifBadgeContext);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await getVendorNotifications();
      setNotifications(response?.notifications || []);
    } catch (e) {
      console.log('Error fetching notifications:', e);
      setError('Failed to load notifications');
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

  const unreadCount = notifications.filter(n => n.read === false).length;

  const handleMarkAllRead = useCallback(() => {
    showConfirm('Mark all as read?', `${unreadCount} unread notifications will be marked as read.`, async () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      markVendorNotificationsRead(null).catch(() => {});
      refreshBadge();
    }, { confirmText: 'Mark all' });
  }, [refreshBadge, unreadCount]);

  const deleteOne = useCallback(async (item) => {
    setNotifications(prev => prev.filter(n => n.id !== item.id));
    if (!item.read) refreshBadge();
    try {
      await deleteVendorNotifications([item.id]);
    } catch (e) {
      fetchNotifications();
      showError('Failed to delete notification');
    }
  }, [refreshBadge, fetchNotifications]);

  const clearAll = useCallback(() => {
    if (notifications.length === 0) return;
    showConfirm(
      'Clear all notifications?',
      'This will delete every notification in your inbox. This cannot be undone.',
      async () => {
        try {
          await deleteVendorNotifications(notifications.map(n => n.id));
          setNotifications([]);
          refreshBadge();
        } catch (e) {
          showError('Failed to clear notifications');
        }
      },
      { confirmText: 'Clear all', destructive: true }
    );
  }, [notifications, refreshBadge]);

  // ── Filter (client-side — the whole list is already loaded) ──
  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => n.read === false);
    return notifications.filter(n => (CATEGORY_OF[n.type] || 'updates') === filter);
  }, [notifications, filter]);

  // ── Group into day-bucket sections ──
  const sections = useMemo(() => {
    const groups = {};
    filtered.forEach(n => {
      const g = getGroup(n.createdAt);
      if (!groups[g]) groups[g] = [];
      groups[g].push(n);
    });
    return GROUP_ORDER.filter(g => groups[g]?.length).map(g => ({ title: g, data: groups[g] }));
  }, [filtered]);

  // ── Render item ────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <NotifCard item={item} onPress={() => handleNotificationPress(item)} onDelete={() => deleteOne(item)} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Gradient header ──────────────────────────────────── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <AnimatedOrb style={s.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={s.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 12 }}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Notifications</Text>
              <Text style={s.headerSub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
            </View>
            <TouchableOpacity
              style={[s.iconBtn, unreadCount === 0 && { opacity: 0.4 }]}
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="checkmark-done" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.iconBtn, notifications.length === 0 && { opacity: 0.4 }]}
              onPress={clearAll}
              disabled={notifications.length === 0}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterChip, active && s.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={f.icon} size={12} color={active ? C.g700 : 'rgba(255,255,255,0.85)'} />
                  <Text style={[s.filterText, active && s.filterTextActive]}>{f.label}</Text>
                  {f.key === 'unread' && unreadCount > 0 && (
                    <View style={[s.filterBadge, active && { backgroundColor: C.g600 }]}>
                      <Text style={[s.filterBadgeText, active && { color: '#fff' }]}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {error && (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchNotifications}>
            <Text style={s.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List / Empty ─────────────────────────────────────── */}
      {loading ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.g600} /></View>
      ) : sections.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id?.toString()}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeaderWrap}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.g500]} tintColor={C.g400} progressBackgroundColor="#fff" />
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

// ── Notification card ──────────────────────────────────────────
function NotifCard({ item, onPress, onDelete }) {
  const cfg      = NOTIF_CONFIG[item.type] || NOTIF_CONFIG.general;
  const category = CATEGORY_OF[item.type] || 'updates';
  const isUnread = item.read === false;
  const isChat   = item.type === 'chat' || item.type === 'new_message';

  // Older saved chat notifications had a "💬 " emoji prefix on the title;
  // strip defensively so the avatar+name render cleanly either way.
  const cleanTitle = isChat ? (item.title || '').replace(/^💬\s*/, '').trim() : item.title;
  const initial    = isChat && cleanTitle ? cleanTitle.charAt(0).toUpperCase() : '';
  const avatarBg   = isChat ? avatarColorFor(cleanTitle) : null;

  return (
    <TouchableOpacity
      style={[s.card, isUnread && { borderLeftWidth: 4, borderLeftColor: cfg.color, backgroundColor: '#FCFAF4' }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isChat ? (
        <View style={[s.avatar, { backgroundColor: avatarBg }]}>
          <Text style={s.avatarTxt}>{initial || '?'}</Text>
          {isUnread && <View style={[s.unreadDot, { backgroundColor: C.g500 }]} />}
        </View>
      ) : (
        <View style={[s.typeIcon, { backgroundColor: cfg.bg }]}>
          <Icon name={cfg.icon} size={18} color={cfg.color} />
          {isUnread && <View style={[s.unreadDot, { backgroundColor: cfg.color }]} />}
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.cardTopLine}>
          <View style={[s.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.typeBadgeText, { color: cfg.color }]}>{CATEGORY_LABEL[category]}</Text>
          </View>
          <Text style={s.cardTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={[s.cardTitle, isUnread && { fontWeight: '800' }]} numberOfLines={1}>
          {cleanTitle || (isChat ? 'New message' : 'Notification')}
        </Text>
        {!!(item.body || item.message) && (
          <Text style={s.cardBody} numberOfLines={2}>{item.body || item.message}</Text>
        )}
      </View>

      <TouchableOpacity onPress={onDelete} style={s.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={16} color={C.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function EmptyState({ filter }) {
  const m = EMPTY_MAP[filter] || EMPTY_MAP.all;
  return (
    <View style={s.empty}>
      <View style={s.emptyIconBox}>
        <Ionicons name={m.icon} size={36} color={C.g600} />
      </View>
      <Text style={s.emptyTitle}>{m.title}</Text>
      <Text style={s.emptyBody}>{m.body}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Header ──────────────────────────────────────────────────
  hero: {
    paddingBottom: rs(16), overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  orbA: {
    position: 'absolute', top: -50, right: -40, width: 190, height: 190,
    borderRadius: 95, backgroundColor: 'rgba(201,154,63,0.10)',
  },
  orbB: {
    position: 'absolute', top: 30, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: 'rgba(46,158,119,0.14)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingHorizontal: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSub:   { fontFamily: DISPLAY, fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 2 },

  // Filter pills
  filtersRow: { paddingHorizontal: 8, paddingTop: 12, gap: 6, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterText: { fontFamily: DISPLAY, fontSize: 12, color: '#fff', fontWeight: '700' },
  filterTextActive: { color: C.g700, fontWeight: '700' },
  filterBadge: {
    minWidth: 18, height: 16, paddingHorizontal: 5, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontFamily: DISPLAY, color: '#fff', fontSize: 10, fontWeight: '700' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 14, padding: 10, backgroundColor: C.redL, borderRadius: rs(10),
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: '700', fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── List ─────────────────────────────────────────────────────
  listContent: { padding: 14, paddingTop: 10, paddingBottom: 100 },

  // Section header
  sectionHeaderWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, paddingTop: 12, paddingBottom: 8,
  },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: '800', color: C.muted, letterSpacing: 0.7, textTransform: 'uppercase' },
  sectionCount: { fontFamily: DISPLAY, fontSize: 11, color: C.muted, fontWeight: '700' },

  // ── Notification card ─────────────────────────────────────────
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.card, borderRadius: rs(16), padding: 12,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 10, paddingLeft: 12,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  typeIcon: { position: 'relative', width: 38, height: 38, borderRadius: rs(13), alignItems: 'center', justifyContent: 'center' },
  // Chat avatar (WhatsApp-style round, no badge)
  avatar: {
    position: 'relative', width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: DISPLAY, color: '#fff', fontSize: 15, fontWeight: '800' },
  unreadDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FCFAF4' },
  cardTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  cardTime: { fontFamily: DISPLAY, fontSize: 10.5, color: C.muted, fontWeight: '700', marginLeft: 'auto' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 13.5, color: C.text, fontWeight: '700', marginTop: 4 },
  cardBody: { fontFamily: DISPLAY, fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 17 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sand,
  },

  // ── Empty ────────────────────────────────────────────────────
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(28,107,82,0.12)',
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text, textAlign: 'center' },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.muted, marginTop: 8, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getDriverNotifications,
  getDriverBookingNotifications,
  markDriverBookingNotificationsRead,
  getBookingById,
} from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#043927', mid: '#065F46', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6',
};

// ─── Service icon map ──────────────────────────────────────────────────────────
const SVC = {
  car:       { icon: 'car-outline',          bg: '#F0FDF4', color: '#16A34A' },
  bus:       { icon: 'bus-outline',           bg: '#FEF9C3', color: '#CA8A04' },
  truck:     { icon: 'construct-outline',     bg: '#FFF7ED', color: '#EA580C' },
  luxury:    { icon: 'diamond-outline',       bg: '#FDF4FF', color: '#9333EA' },
  equipment: { icon: 'hammer-outline',        bg: '#F0F9FF', color: '#0369A1' },
  packers:   { icon: 'cube-outline',          bg: '#F0FDF4', color: '#15803D' },
  b2b:       { icon: 'briefcase-outline',     bg: '#F5F3FF', color: '#7C3AED' },
  default:   { icon: 'notifications-outline', bg: '#F0FDF4', color: C.primary },
};
function svc(type) { return SVC[type?.toLowerCase()] || SVC.default; }

// ─── Group notifications by date ──────────────────────────────────────────────
function groupByDate(items) {
  const today     = moment().startOf('day');
  const yesterday = moment().subtract(1, 'day').startOf('day');
  const groups    = { Today: [], Yesterday: [], Earlier: [] };

  items.forEach(n => {
    const d = moment(n.createdAt);
    if (d.isSameOrAfter(today))     groups.Today.push(n);
    else if (d.isSameOrAfter(yesterday)) groups.Yesterday.push(n);
    else                            groups.Earlier.push(n);
  });

  return [
    groups.Today.length     && { title: 'Today',     data: groups.Today },
    groups.Yesterday.length && { title: 'Yesterday', data: groups.Yesterday },
    groups.Earlier.length   && { title: 'Earlier',   data: groups.Earlier },
  ].filter(Boolean);
}

// ─── Date Group Header ────────────────────────────────────────────────────────
function DateHeader({ title, count }) {
  return (
    <View style={styles.dateHeader}>
      <View style={styles.dateHeaderLine} />
      <View style={styles.dateHeaderPill}>
        <Text style={styles.dateHeaderText}>{title}</Text>
        {count > 0 && <View style={styles.dateHeaderDot} />}
        <Text style={styles.dateHeaderCount}>{count}</Text>
      </View>
      <View style={styles.dateHeaderLine} />
    </View>
  );
}

// ─── Booking Notification Card ────────────────────────────────────────────────
function BookingCard({ item, onPress }) {
  const sc      = svc(item.serviceType);
  const isUnread = !item.read;
  const tappable = !!item.bookingId;

  return (
    <TouchableOpacity
      style={[styles.notifCard, isUnread && styles.notifCardUnread]}
      onPress={tappable ? onPress : undefined}
      activeOpacity={tappable ? 0.75 : 1}
    >
      {isUnread && <View style={styles.unreadAccent} />}

      <View style={[styles.notifIconWrap, { backgroundColor: sc.bg }]}>
        <Ionicons name={sc.icon} size={20} color={sc.color} />
        {isUnread && <View style={styles.unreadBadge} />}
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, isUnread && { color: C.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notifTime}>{moment(item.createdAt).fromNow()}</Text>
        </View>

        {item.body ? (
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        ) : null}

        {item.bookingNumber ? (
          <View style={styles.bookingPill}>
            <Ionicons name="receipt-outline" size={10} color={sc.color} />
            <Text style={[styles.bookingPillText, { color: sc.color }]}>
              #{item.bookingNumber}
            </Text>
            {tappable && (
              <Ionicons name="chevron-forward" size={10} color={sc.color} style={{ marginLeft: 2 }} />
            )}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Document Alert Card ──────────────────────────────────────────────────────
function AlertCard({ item }) {
  const isUrgent   = item.urgent;
  const accentColor = isUrgent ? C.danger : C.warn;
  const bgColor     = isUrgent ? '#FFF5F5' : '#FFFBEB';
  const iconName    = isUrgent ? 'warning' : 'alert-circle-outline';

  return (
    <View style={[styles.alertCard, { backgroundColor: bgColor }]}>
      <View style={[styles.alertAccent, { backgroundColor: accentColor }]} />
      <View style={[styles.alertIconWrap, { backgroundColor: isUrgent ? '#FEE2E2' : '#FEF3C7' }]}>
        <Ionicons name={iconName} size={20} color={accentColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.alertTitle, { color: isUrgent ? '#991B1B' : '#92400E' }]}>
          {item.title}
        </Text>
        <Text style={[styles.alertMsg, { color: isUrgent ? '#B91C1C' : '#B45309' }]}>
          {item.message}
        </Text>
        <View style={[styles.alertPill, { backgroundColor: accentColor + '22' }]}>
          <Ionicons name="time-outline" size={10} color={accentColor} />
          <Text style={[styles.alertPillText, { color: accentColor }]}>
            {isUrgent ? 'Action required' : 'Renew soon'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const [tab, setTab]           = useState('bookings');
  const [alerts, setAlerts]     = useState([]);
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening]   = useState(null);

  function serviceTypeToSource(serviceType) {
    const map = {
      chauffeur: 'chauffeur', bus: 'bus', luxury: 'luxury', truck: 'truck',
      'packers & movers': 'packers', packers: 'packers',
      equipment: 'equipment', 'b2b trip': 'b2b', b2b: 'b2b',
      'direct booking': 'direct', direct: 'direct',
    };
    return map[(serviceType || '').toLowerCase()] || 'chauffeur';
  }

  async function openBooking(item) {
    if (opening || !item.bookingId) return;
    setOpening(item.id);
    try {
      const source = serviceTypeToSource(item.serviceType);
      const res = await getBookingById(item.bookingId, source);
      if (res.data?.booking) {
        navigation.navigate('BookingDetail', { booking: res.data.booking });
      } else {
        Alert.alert('Not found', 'Could not load booking details.');
      }
    } catch {
      Alert.alert('Error', 'Failed to load booking details.');
    }
    setOpening(null);
  }

  // Tab indicator animation
  const tabAnim = useRef(new Animated.Value(0)).current;
  function switchTab(t) {
    setTab(t);
    Animated.spring(tabAnim, {
      toValue: t === 'bookings' ? 0 : 1,
      useNativeDriver: false,
      tension: 80, friction: 12,
    }).start();
  }

  const load = useCallback(async () => {
    try {
      const [alertRes, notifRes] = await Promise.all([
        getDriverNotifications(),
        getDriverBookingNotifications(),
      ]);
      setAlerts(alertRes.data?.alerts || []);
      const list = notifRes.data?.notifications || [];
      setNotifs(list);

      // Auto-mark unread as read
      const unread = list.filter(n => !n.read).map(n => n.id);
      if (unread.length > 0) {
        markDriverBookingNotificationsRead(unread).catch(() => {});
        setNotifs(list.map(n => ({ ...n, read: true })));
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifs.filter(n => !n.read).length;
  const urgentCount = alerts.filter(a => a.urgent).length;

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '52%'],
  });

  // Flatten grouped notifications for FlatList
  const grouped = groupByDate(notifs);
  const flatData = grouped.flatMap(g => [
    { _type: 'header', title: g.title, count: g.data.length },
    ...g.data.map(n => ({ _type: 'item', ...n })),
  ]);

  // Separate urgent and warning alerts
  const urgentAlerts  = alerts.filter(a => a.urgent);
  const warningAlerts = alerts.filter(a => !a.urgent);
  const alertsFlat = [
    ...(urgentAlerts.length  ? [{ _type: 'sectionHead', title: 'Action Required', color: C.danger, count: urgentAlerts.length }, ...urgentAlerts.map(a => ({ _type: 'alert', ...a }))] : []),
    ...(warningAlerts.length ? [{ _type: 'sectionHead', title: 'Expiring Soon',   color: C.warn,   count: warningAlerts.length }, ...warningAlerts.map(a => ({ _type: 'alert', ...a }))] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[C.dark, C.mid, C.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              {urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}
            </Text>
          </View>
          {(unreadCount + urgentCount) > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount + urgentCount}</Text>
            </View>
          )}
        </View>

        {/* ── Animated Tab Pills ── */}
        <View style={styles.tabWrap}>
          <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('bookings')} activeOpacity={0.8}>
            <Ionicons name="car-outline" size={13} color={tab === 'bookings' ? C.dark : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, tab === 'bookings' && styles.tabTextActive]}>
              Bookings{unreadCount > 0 ? `  ${unreadCount}` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('documents')} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={13} color={tab === 'documents' ? C.dark : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, tab === 'documents' && styles.tabTextActive]}>
              Documents{urgentCount > 0 ? `  ${urgentCount}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : tab === 'bookings' ? (
        flatData.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            iconBg="#EFF6FF"
            iconColor={C.blue}
            title="No notifications yet"
            sub="Booking assignments will appear here"
          />
        ) : (
          <FlatList
            data={flatData}
            keyExtractor={(item, i) => item.id || `h-${i}`}
            renderItem={({ item }) => {
              if (item._type === 'header') return <DateHeader title={item.title} count={item.count} />;
              return <BookingCard item={item} onPress={() => openBooking(item)} />;
            }}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : alertsFlat.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          iconBg="#F0FDF4"
          iconColor={C.success}
          title="All documents valid"
          sub="No expiries in the next 90 days"
        />
      ) : (
        <FlatList
          data={alertsFlat}
          keyExtractor={(item, i) => `a-${i}`}
          renderItem={({ item }) => {
            if (item._type === 'sectionHead') {
              return (
                <View style={[styles.alertSectionHead, { borderLeftColor: item.color }]}>
                  <View style={[styles.alertSectionDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.alertSectionTitle, { color: item.color }]}>{item.title}</Text>
                  <View style={[styles.alertSectionPill, { backgroundColor: item.color + '18' }]}>
                    <Text style={[styles.alertSectionCount, { color: item.color }]}>{item.count}</Text>
                  </View>
                </View>
              );
            }
            return <AlertCard item={item} />;
          }}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, iconBg, iconColor, title, sub }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={36} color={iconColor} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:     { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, overflow: 'hidden' },
  bubble1:    { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40 },
  bubble2:    { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  headerBadge:{ backgroundColor: '#EF4444', borderRadius: 12, minWidth: 26, height: 26, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  headerBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // Tabs
  tabWrap:      { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 3, position: 'relative', height: 42 },
  tabIndicator: { position: 'absolute', top: 3, width: '46%', height: 36, backgroundColor: '#fff', borderRadius: 11 },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
  tabText:      { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  tabTextActive:{ color: C.dark },

  list: { padding: 14, paddingBottom: 32 },

  // Date group header
  dateHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 6 },
  dateHeaderLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateHeaderPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10, borderWidth: 1, borderColor: C.border },
  dateHeaderText: { fontSize: 11, fontWeight: '700', color: C.sub },
  dateHeaderDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },
  dateHeaderCount:{ fontSize: 11, fontWeight: '700', color: C.primary },

  // Booking notification
  notifCard:       { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  notifCardUnread: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  unreadAccent:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.primary },
  notifIconWrap:   { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0, position: 'relative' },
  unreadBadge:     { position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, borderWidth: 2, borderColor: '#F0FDF4' },
  notifTitleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  notifTitle:      { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  notifTime:       { fontSize: 10, color: C.sub, flexShrink: 0 },
  notifBody:       { fontSize: 12, color: C.sub, lineHeight: 17, marginBottom: 7 },
  bookingPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  bookingPillText: { fontSize: 10, fontWeight: '700' },

  // Alert section head
  alertSectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6, paddingLeft: 4 },
  alertSectionDot:   { width: 8, height: 8, borderRadius: 4 },
  alertSectionTitle: { flex: 1, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  alertSectionPill:  { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  alertSectionCount: { fontSize: 11, fontWeight: '800' },

  // Alert card
  alertCard:    { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, padding: 14, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  alertAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  alertIconWrap:{ width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginLeft: 8 },
  alertTitle:   { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  alertMsg:     { fontSize: 12, lineHeight: 17, marginBottom: 7 },
  alertPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  alertPillText:{ fontSize: 10, fontWeight: '700' },

  // Empty
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 13, color: C.sub, textAlign: 'center', maxWidth: 240 },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableBookings, getMyBookings, getDriverNotifications, getEarnings, getDriverChatList } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  indigo: '#6366F1', blue: '#3B82F6', purple: '#9333EA',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function statusColor(status) {
  const m = {
    ACCEPTED: C.success, DRIVER_ASSIGNED: C.success, confirmed: C.success, assigned: C.success,
    IN_PROGRESS: '#EA580C', in_progress: '#EA580C', STARTED: '#EA580C',
    COMPLETED: C.indigo, completed: C.indigo,
    BROADCASTED: C.sub,
  };
  return m[status] || C.sub;
}

function statusLabel(status) {
  const m = {
    ACCEPTED: 'Accepted', DRIVER_ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed', BROADCASTED: 'New', confirmed: 'Confirmed',
    in_progress: 'In Progress', assigned: 'Assigned', completed: 'Completed',
    STARTED: 'Started',
  };
  return m[status] || status?.replace(/_/g, ' ') || '—';
}

function isInProgress(status) {
  return ['IN_PROGRESS', 'STARTED', 'in_progress'].includes(status);
}

// ─── Active Trip Pulse Banner ────────────────────────────────────────────────

function ActiveTripBanner({ booking, onPress }) {
  const pulse = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.activeTripWrap}>
      <LinearGradient colors={['#064E3B', '#059669']} style={styles.activeTripCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={styles.activeTripLeft}>
          <Animated.View style={[styles.activePulseDot, { transform: [{ scale: pulse }] }]} />
          <View>
            <Text style={styles.activeTripLabel}>Trip in Progress</Text>
            <Text style={styles.activeTripRoute} numberOfLines={1}>
              {booking.pickupCity || '—'}{booking.dropCity ? ` → ${booking.dropCity}` : ''}
            </Text>
            {booking.pickupDate && (
              <Text style={styles.activeTripTime}>{moment(booking.pickupDate).format('DD MMM, h:mm A')}</Text>
            )}
          </View>
        </View>
        <View style={styles.activeTripCta}>
          <Text style={styles.activeTripCtaText}>Manage</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Booking Card ────────────────────────────────────────────────────────────

function BookingCard({ booking, onPress, isAvailable }) {
  const sc = statusColor(isAvailable ? 'BROADCASTED' : booking.status);
  const earnings = booking.earnings ?? booking.driverBatta ?? booking.grandTotal;
  const isVendorAssigned = booking.source === 'direct';

  return (
    <TouchableOpacity style={styles.bCard} onPress={onPress} activeOpacity={0.85}>
      {/* Left color strip */}
      <View style={[styles.bStrip, { backgroundColor: sc }]} />

      <View style={styles.bBody}>
        {/* Header row */}
        <View style={styles.bHead}>
          <View style={{ flex: 1 }}>
            <View style={styles.bNumRow}>
              <Text style={styles.bNum}>{booking.bookingNumber}</Text>
              {isVendorAssigned && (
                <View style={styles.vendorAssignPill}>
                  <Ionicons name="business-outline" size={9} color="#2563EB" />
                  <Text style={styles.vendorAssignText}>Vendor Assigned</Text>
                </View>
              )}
            </View>
            <Text style={styles.bRoute} numberOfLines={1}>
              {booking.pickupCity || '—'}{booking.dropCity ? ` → ${booking.dropCity}` : ''}
            </Text>
          </View>
          <View style={[styles.bStatus, { backgroundColor: sc + '18' }]}>
            <Text style={[styles.bStatusText, { color: sc }]}>
              {statusLabel(isAvailable ? 'BROADCASTED' : booking.status)}
            </Text>
          </View>
        </View>

        {/* Meta chips */}
        <View style={styles.bMeta}>
          {booking.pickupDate && (
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={11} color={C.sub} />
              <Text style={styles.chipText}>{moment(booking.pickupDate).format('DD MMM, h:mm A')}</Text>
            </View>
          )}
          {(booking.carCategoryName || booking.serviceType || booking.tripType) && (
            <View style={styles.chip}>
              <Ionicons name="car-outline" size={11} color={C.sub} />
              <Text style={styles.chipText} numberOfLines={1}>{booking.carCategoryName || booking.serviceType || booking.tripType}</Text>
            </View>
          )}
          {earnings > 0 && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Ionicons name="wallet-outline" size={11} color={C.primary} />
              <Text style={[styles.chipText, { color: C.primary, fontWeight: '700' }]}>₹{earnings.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>

        {isAvailable && (
          <View style={styles.acceptRow}>
            <Text style={styles.acceptText}>Tap to view & accept</Text>
            <Ionicons name="arrow-forward" size={12} color={C.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHead({ title, count, onSeeAll }) {
  return (
    <View style={styles.secHead}>
      <View style={styles.secHeadLeft}>
        <Text style={styles.secTitle}>{title}</Text>
        {count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const { driver } = useAuth();
  const [activeBookings, setActiveBookings] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [driverId, setDriverId] = useState(null);

  const isVendorStaff = driver?.userType === 'vendor_staff';

  // Load driver ID from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('driver_id').then(id => {
      if (id) setDriverId(id);
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [myRes, notifRes, earningsRes, availRes, chatRes] = await Promise.all([
        getMyBookings('active').catch(() => ({ data: { bookings: [] } })),
        getDriverNotifications().catch(() => ({ data: { alerts: [] } })),
        getEarnings('month').catch(() => ({ data: { stats: null, earnings: null } })),
        getAvailableBookings().catch(() => ({ data: { bookings: [] } })),
        getDriverChatList().catch(() => ({ data: { conversations: [] } })),
      ]);
      setActiveBookings(myRes.data.bookings || []);
      setAlerts(notifRes.data.alerts || []);
      setStats(earningsRes.data.stats || null);
      setMonthEarnings(earningsRes.data.earnings?.total || 0);
      setAvailableBookings(availRes.data.bookings || []);
      const totalUnread = (chatRes.data.conversations || []).reduce((s, c) => s + (c.unreadCount || 0), 0);
      setChatUnread(totalUnread);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const urgentAlerts = alerts.filter(a => a.urgent);
  const firstName = driver?.name?.split(' ')[0] || 'Driver';
  const activeTrip = activeBookings.find(b => isInProgress(b.status));
  const avgRating = driver?.averageRating || driver?.rating || null;
  const totalTrips = stats?.totalTrips || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.primary} colors={[C.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <LinearGradient
          colors={['#043927', '#065F46', '#16A34A']}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Top row: greeting + bell */}
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetSub}>{timeGreeting()}</Text>
              <Text style={styles.greetName}>{firstName} 👋</Text>
              {driverId && (
                <View style={styles.driverIdBadge}>
                  <Ionicons name="shield" size={12} color="#0EA5E9" />
                  <Text style={styles.driverIdText}>{driverId}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
              <View style={styles.bellCircle}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
              </View>
              {urgentAlerts.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{urgentAlerts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Vendor badge (if vendor staff) */}
          {isVendorStaff && driver?.vendorName && (
            <View style={styles.vendorBadge}>
              <View style={styles.vendorBadgeIcon}>
                <Ionicons name="business" size={12} color="#16A34A" />
              </View>
              <Text style={styles.vendorBadgeText}>{driver.vendorName}</Text>
              <View style={styles.vendorBadgeDot} />
              <Text style={styles.vendorBadgeRole}>Staff Driver</Text>
            </View>
          )}

          {/* Earnings + Rating cards */}
          <View style={styles.statsCards}>
            <View style={styles.statsCard}>
              <View style={styles.statsCardIcon}>
                <Ionicons name="wallet" size={16} color="#16A34A" />
              </View>
              <Text style={styles.statsCardNum}>₹{monthEarnings.toLocaleString('en-IN')}</Text>
              <Text style={styles.statsCardLabel}>This Month</Text>
            </View>

            <View style={styles.statsCardDivider} />

            <View style={styles.statsCard}>
              <View style={[styles.statsCardIcon, { backgroundColor: '#FEF9C3' }]}>
                <Ionicons name="star" size={16} color="#D97706" />
              </View>
              <Text style={styles.statsCardNum}>{avgRating ? avgRating.toFixed(1) : '—'}</Text>
              <Text style={styles.statsCardLabel}>Avg Rating</Text>
            </View>

            <View style={styles.statsCardDivider} />

            <View style={styles.statsCard}>
              <View style={[styles.statsCardIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="car" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.statsCardNum}>{totalTrips}</Text>
              <Text style={styles.statsCardLabel}>Total Trips</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── DOCUMENT ALERT STRIP ── */}
        {urgentAlerts.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.alertStrip}>
            <View style={styles.alertStripIcon}>
              <Ionicons name="warning" size={16} color="#D97706" />
            </View>
            <Text style={styles.alertStripText} numberOfLines={1}>{urgentAlerts[0].message}</Text>
            <Ionicons name="chevron-forward" size={14} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* ── ACTIVE TRIP BANNER ── */}
        {activeTrip && (
          <View style={styles.pad}>
            <ActiveTripBanner
              booking={activeTrip}
              onPress={() => navigation.navigate('ActiveTrip', { booking: activeTrip })}
            />
          </View>
        )}

        {/* ── STATS STRIP ── */}
        {stats && (
          <View style={styles.statStrip}>
            <View style={styles.statPill}>
              <Text style={styles.statPillNum}>{stats.totalTrips || 0}</Text>
              <Text style={styles.statPillLabel}>Total</Text>
            </View>
            <View style={styles.statPillLine} />
            <View style={styles.statPill}>
              <Text style={[styles.statPillNum, { color: C.success }]}>{stats.completedTrips || 0}</Text>
              <Text style={styles.statPillLabel}>Completed</Text>
            </View>
            <View style={styles.statPillLine} />
            <View style={styles.statPill}>
              <Text style={[styles.statPillNum, { color: C.warn }]}>{stats.activeTrips || 0}</Text>
              <Text style={styles.statPillLabel}>Active</Text>
            </View>
          </View>
        )}

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.quickGrid}>
          {[
            { icon: 'search', label: 'Find Trips',   bg: '#F0FDF4', color: C.primary,   onPress: () => navigation.navigate('AvailableBookings') },
            { icon: 'car-sport', label: 'My Fleet',  bg: '#EFF6FF', color: C.blue,      onPress: () => navigation.navigate('Fleet') },
            { icon: 'wallet',  label: 'Earnings',    bg: '#FDF4FF', color: C.purple,    onPress: () => navigation.navigate('Earnings') },
            { icon: 'time',    label: 'History',     bg: '#FFF7ED', color: C.warn,      onPress: () => navigation.navigate('TripHistory') },
          ].map(q => (
            <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={q.onPress} activeOpacity={0.8}>
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── AVAILABLE BOOKINGS ── */}
        <View style={styles.section}>
          <SectionHead
            title="Available Bookings"
            count={availableBookings.length}
            onSeeAll={availableBookings.length > 0 ? () => navigation.navigate('AvailableBookings') : null}
          />
          {availableBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No new bookings right now</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          ) : (
            availableBookings.slice(0, 3).map(b => (
              <BookingCard
                key={b.id}
                booking={{ ...b, status: 'BROADCASTED' }}
                isAvailable
                onPress={() => navigation.navigate('BookingDetail', { booking: b, isAvailable: true })}
              />
            ))
          )}
        </View>

        {/* ── ACTIVE / ASSIGNED TRIPS ── */}
        <View style={styles.section}>
          <SectionHead
            title={isVendorStaff ? 'Active & Assigned Trips' : 'Active Trips'}
            count={activeBookings.length}
            onSeeAll={() => navigation.navigate('Bookings')}
          />
          {activeBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="car-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No active trips</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => navigation.navigate('AvailableBookings')}
              >
                <Ionicons name="add-circle-outline" size={15} color={C.primary} />
                <Text style={styles.emptyActionText}>Browse available bookings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeBookings.slice(0, 3).map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onPress={() => {
                  if (b.source === 'direct') navigation.navigate('BookingDetail', { booking: b, isDirect: true });
                  else if (isInProgress(b.status)) navigation.navigate('ActiveTrip', { booking: b });
                  else navigation.navigate('BookingDetail', { booking: b });
                }}
              />
            ))
          )}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Floating chat button */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => navigation.navigate('ChatList')}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
        {chatUnread > 0 && (
          <View style={styles.chatFabBadge}>
            <Text style={styles.chatFabBadgeText}>{chatUnread > 9 ? '9+' : chatUnread}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loaderScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Header
  header: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14,
  },
  greetSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  greetName: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2 },
  driverIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  driverIdText: { fontSize: 12, fontWeight: '700', color: '#0EA5E9', letterSpacing: 0.5 },
  bellBtn: { position: 'relative', marginTop: 4 },
  bellCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#065F46',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Vendor badge
  vendorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  vendorBadgeIcon: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  vendorBadgeText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  vendorBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
  vendorBadgeRole: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  // Stats cards in header
  statsCards: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 8,
  },
  statsCard: { flex: 1, alignItems: 'center', gap: 6 },
  statsCardIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  statsCardNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statsCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  statsCardDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },

  // ── Alert strip
  alertStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  alertStripIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center',
  },
  alertStripText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '500' },

  // ── Active trip banner
  pad: { paddingHorizontal: 16, paddingTop: 14 },
  activeTripWrap: { borderRadius: 18, overflow: 'hidden' },
  activeTripCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 18,
  },
  activeTripLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  activePulseDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4ADE80', shadowColor: '#4ADE80', shadowOpacity: 0.8, shadowRadius: 6,
  },
  activeTripLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 3 },
  activeTripRoute: { fontSize: 16, fontWeight: '800', color: '#fff', maxWidth: 200 },
  activeTripTime: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  activeTripCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  activeTripCtaText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  // ── Stats strip
  statStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.card, borderRadius: 14, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statPill: { flex: 1, alignItems: 'center', gap: 3 },
  statPillNum: { fontSize: 20, fontWeight: '800', color: C.text },
  statPillLabel: { fontSize: 11, color: C.sub, fontWeight: '600' },
  statPillLine: { width: 1, height: 30, backgroundColor: C.border },

  // ── Quick actions
  quickGrid: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, marginTop: 14,
  },
  quickBtn: {
    flex: 1, backgroundColor: C.card, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  quickIcon: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: C.text },

  // ── Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  countBadge: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '700' },

  // ── Empty state
  emptyCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 4 },
  emptySubText: { fontSize: 12, color: C.sub },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  emptyActionText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  // ── Booking card
  bCard: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: 16,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  bStrip: { width: 4 },
  bBody: { flex: 1, padding: 14 },
  bHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bNumRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  bNum: { fontSize: 11, color: C.sub, fontWeight: '700' },
  vendorAssignPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFF6FF', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  vendorAssignText: { fontSize: 9, color: '#2563EB', fontWeight: '700' },
  bRoute: { fontSize: 15, fontWeight: '700', color: C.text },
  bStatus: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, marginLeft: 8, flexShrink: 0 },
  bStatusText: { fontSize: 10, fontWeight: '800' },
  bMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  chipGreen: { backgroundColor: '#F0FDF4' },
  chipText: { fontSize: 11, color: C.sub },
  acceptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  acceptText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Floating chat button
  chatFab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
  chatFabBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  chatFabBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});

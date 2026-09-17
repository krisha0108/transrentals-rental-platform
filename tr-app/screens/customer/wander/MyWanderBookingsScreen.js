/**
 * MyWanderBookingsScreen.js
 * Customer's wander quote requests & bookings
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wanderService from '../../services/wanderService';

const TEAL = '#09B368';
const BG = '#F5F7FA';

const TABS = [
  { key: 'quotes', label: 'Quote Requests' },
  { key: 'bookings', label: 'Bookings' },
];

const QUOTE_STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7' },
  QUOTED:    { label: 'Quoted',    color: '#3B82F6', bg: '#EFF6FF' },
  ACCEPTED:  { label: 'Accepted',  color: TEAL,      bg: '#E8F8F2' },
  COMPLETED: { label: 'Done',      color: '#6B7280', bg: '#F3F4F6' },
  DROPPED:   { label: 'Dropped',   color: '#EF4444', bg: '#FEF2F2' },
};

const BOOKING_STATUS_CONFIG = {
  PAYMENT_PENDING: { label: 'Pay Pending', color: '#F59E0B', bg: '#FEF3C7' },
  CONFIRMED:       { label: 'Confirmed',   color: TEAL,      bg: '#E8F8F2' },
  STARTED:         { label: 'Ongoing',     color: '#3B82F6', bg: '#EFF6FF' },
  COMPLETED:       { label: 'Completed',   color: '#6B7280', bg: '#F3F4F6' },
  DROPPED:         { label: 'Dropped',     color: '#EF4444', bg: '#FEF2F2' },
  CANCELLED:       { label: 'Cancelled',   color: '#EF4444', bg: '#FEF2F2' },
};

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return str; }
}

// ─── Quote Request Card ────────────────────────────────────────────────────
function QuoteCard({ item, onPress }) {
  const statusCfg = QUOTE_STATUS_CONFIG[item.status] || QUOTE_STATUS_CONFIG.PENDING;
  const vendor = item.listing?.vendor;
  const hasQuotes = item.quotes?.length > 0;
  const lowestQuote = hasQuotes
    ? Math.min(...item.quotes.map(q => q.amount || Infinity))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reqNum}>#{item.requestId}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.listing?.title || 'Tour Request'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>{formatDate(item.travelDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="users" size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>{item.groupSize || 1} pax</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="map-pin" size={12} color="#9CA3AF" />
          <Text style={styles.metaText} numberOfLines={1}>{item.listing?.mainLocation?.name || item.pickupLocation || '—'}</Text>
        </View>
      </View>

      {/* Quotes received */}
      {hasQuotes && (
        <View style={styles.quotesReceived}>
          <Ionicons name="pricetag" size={13} color={TEAL} />
          <Text style={styles.quotesText}>
            {item.quotes.length} quote{item.quotes.length > 1 ? 's' : ''} received
            {lowestQuote !== Infinity ? ` · From ₹${lowestQuote.toLocaleString('en-IN')}` : ''}
          </Text>
        </View>
      )}

      {vendor?.phone && item.status === 'QUOTED' && (
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${vendor.phone}`)}
        >
          <Icon name="phone" size={13} color={TEAL} />
          <Text style={styles.callBtnText}>Call Vendor</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Booking Card ──────────────────────────────────────────────────────────
function BookingCard({ item, onPress }) {
  const statusCfg = BOOKING_STATUS_CONFIG[item.status] || BOOKING_STATUS_CONFIG.CONFIRMED;
  const isOngoing = item.status === 'STARTED';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {isOngoing && <View style={styles.ongoingStrip} />}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reqNum}>#{item.bookingId}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.quoteRequest?.listing?.title || 'Tour Booking'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>{formatDate(item.travelDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="users" size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>{item.groupSize || 1} pax</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>₹{item.amount?.toLocaleString('en-IN') || '—'}</Text>
        </View>
      </View>

      {/* Guide info */}
      {item.guideAssigned && (
        <View style={styles.guideCard}>
          <Ionicons name="person-circle-outline" size={16} color={TEAL} />
          <Text style={styles.guideText}>Guide: {item.guideAssigned}</Text>
          {item.guidePhone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.guidePhone}`)}>
              <Icon name="phone-call" size={14} color={TEAL} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Advance payment note */}
      {item.status === 'CONFIRMED' && !item.advancePaid && (
        <View style={styles.payNote}>
          <Icon name="alert-circle" size={13} color="#F59E0B" />
          <Text style={styles.payNoteText}>Advance payment pending</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function MyWanderBookingsScreen() {
  const navigation = useNavigation();

  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const raw = await AsyncStorage.getItem('customer');
      if (!raw) { setIsLoading(false); return; }
      const c = JSON.parse(raw);
      setCustomerId(c.id);

      const [qRes, bRes] = await Promise.allSettled([
        wanderService.getMyQuoteRequests(c.id),
        wanderService.getMyBookings(c.id),
      ]);

      if (qRes.status === 'fulfilled') setQuotes(qRes.value?.requests || qRes.value?.quoteRequests || []);
      if (bRes.status === 'fulfilled') setBookings(bRes.value?.bookings || []);
    } catch (e) {
      console.log('MyWander load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

  const data = activeTab === 'quotes' ? quotes : bookings;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>My Wander Trips</Text>
          <Text style={styles.headerSub}>Quotes & bookings</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('WanderScreen')}
          style={styles.browsBtn}
        >
          <Text style={styles.browsBtnText}>Browse Tours</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'quotes' && quotes.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{quotes.length}</Text>
              </View>
            )}
            {tab.key === 'bookings' && bookings.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{bookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={TEAL} />}
          renderItem={({ item }) =>
            activeTab === 'quotes'
              ? <QuoteCard item={item} onPress={() => navigation.navigate('WanderQuoteDetail', {
                  requestId: item.id,
                  requestTitle: item.listing?.title || item.requestId,
                })} />
              : <BookingCard item={item} onPress={() => navigation.navigate('WanderQuoteDetail', {
                  requestId: item.quoteRequest?.id || item.quoteRequestId,
                  requestTitle: item.quoteRequest?.listing?.title || item.bookingId,
                })} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name={activeTab === 'quotes' ? 'chatbubble-outline' : 'map-outline'} size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'quotes' ? 'No quote requests yet' : 'No bookings yet'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'quotes'
                  ? 'Browse tours and send a quote request to get started'
                  : 'Your confirmed tour bookings will appear here'}
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('WanderScreen')}
              >
                <Icon name="compass" size={15} color="#fff" />
                <Text style={styles.browseBtnText}>Explore Tours</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  browsBtn: {
    backgroundColor: '#E8F8F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  browsBtnText: { fontSize: 12, fontWeight: '700', color: TEAL },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: TEAL },
  tabText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { color: TEAL, fontWeight: '700' },
  tabBadge: {
    backgroundColor: TEAL,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Loading
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // List
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  ongoingStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reqNum: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', lineHeight: 20, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  quotesReceived: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#E8F8F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quotesText: { fontSize: 13, color: TEAL, fontWeight: '600' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  callBtnText: { fontSize: 13, color: TEAL, fontWeight: '600' },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#E8F8F2',
    borderRadius: 8,
    padding: 10,
  },
  guideText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },
  payNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  payNoteText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 24,
  },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

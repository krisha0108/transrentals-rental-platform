import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getDirectBookings } from '../../api/client';
import DateFilterModal from '../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#3B82F6', green: '#10B981',
  orange: '#F59E0B', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
  emerald: '#059669',
};

const STATUS_CONFIG = {
  inquiry:     { label: 'Inquiry',     color: C.orange },
  confirmed:   { label: 'Confirmed',   color: C.brand  },
  in_progress: { label: 'In Progress', color: C.purple },
  completed:   { label: 'Completed',   color: C.emerald },
  rejected:    { label: 'Rejected',    color: C.red    },
  cancelled:   { label: 'Cancelled',   color: C.muted  },
};

const PAYMENT_CONFIG = {
  pending:     { label: 'Due',         color: C.orange },
  partial:     { label: 'Partial',     color: C.amber  },
  collected:   { label: 'Paid',        color: C.green  },
  link_sent:   { label: 'Link Sent',   color: C.brand  },
  paid_online: { label: 'Paid Online', color: C.green  },
  waived:      { label: 'Waived',      color: C.muted  },
};

const SERVICE_LABELS = {
  'car-with-driver': 'Car w/ Driver',
  'self-drive': 'Self-Drive',
  bike: 'Bike',
  bus: 'Bus & Tempo',
  luxury: 'Luxury',
  transporter: 'Transporter',
  'packers-movers': 'Packers',
  equipment: 'Equipment',
  general: 'General',
};

const STATUS_TABS = [
  { key: 'all',         label: 'All'        },
  { key: 'inquiry',     label: 'Inquiries'  },
  { key: 'confirmed',   label: 'Confirmed'  },
  { key: 'in_progress', label: 'Active'     },
  { key: 'completed',   label: 'Completed'  },
];

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function DirectBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null, type: null });
  const [expandedId, setExpandedId] = useState(null);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search.trim()) params.search = search.trim();
      if (dateFilter.start) params.startDate = dateFilter.start;
      if (dateFilter.end) params.endDate = dateFilter.end;
      const res = await getDirectBookings(params);
      setBookings(res.bookings || res.data || []);
    } catch (err) {
      console.error('[DirectBookings] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search, dateFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const onTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedId(null);
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };
    const pc = PAYMENT_CONFIG[item.paymentStatus] || { label: '', color: C.muted };
    const svcLabel = SERVICE_LABELS[item.serviceType] || item.serviceType || '';
    const isExpanded = expandedId === item.id;

    return (
      <View style={s.card}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('DirectBookingDetail', { bookingId: item.id })}>
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              <Text style={s.num}>#{item.bookingNumber}</Text>
              {svcLabel ? <Text style={s.chip}>{svcLabel}</Text> : null}
            </View>
            <View style={[s.badge, { backgroundColor: sc.color + '20' }]}>
              <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          <View style={s.body}>
            <View style={s.row}>
              <Icon name="user" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>{item.customerName}</Text>
            </View>
            <View style={s.row}>
              <Icon name="phone" size={14} color={C.muted} />
              <Text style={s.rowText}>{item.customerPhone}</Text>
            </View>
            {(item.pickupLocation || item.dropLocation) && (
              <View style={s.routeRow}>
                <View style={s.routeStop}>
                  <View style={[s.dot, { backgroundColor: C.green }]} />
                  <Text style={s.routeCity} numberOfLines={1}>{item.pickupLocation || '--'}</Text>
                </View>
                {item.dropLocation ? (
                  <>
                    <View style={s.routeLine} />
                    <View style={s.routeStop}>
                      <View style={[s.dot, { backgroundColor: C.red }]} />
                      <Text style={s.routeCity} numberOfLines={1}>{item.dropLocation}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            )}
            <View style={s.row}>
              <Icon name="calendar" size={14} color={C.muted} />
              <Text style={s.rowText}>
                {fmt(item.pickupDate)}
                {item.returnDate ? `  →  ${fmt(item.returnDate)}` : ''}
              </Text>
            </View>
          </View>

          <View style={s.footer}>
            <View>
              <Text style={s.amtLabel}>Total Amount</Text>
              <Text style={s.amt}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.footerRight}>
              {item.paymentStatus && item.paymentStatus !== 'collected' && item.paymentStatus !== 'paid_online' && item.status !== 'cancelled' && item.status !== 'rejected' && (
                <View style={[s.payBadge, { backgroundColor: pc.color + '20' }]}>
                  <Text style={[s.payBadgeText, { color: pc.color }]}>{pc.label}</Text>
                </View>
              )}
              <TouchableOpacity style={s.expandBtn} onPress={() => toggleExpand(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
              </TouchableOpacity>
              <Icon name="chevron-right" size={18} color={C.brand} />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.expanded}>
            <View style={s.expandDivider} />
            {item.vehicleType ? <View style={s.eRow}><Icon name="truck" size={13} color={C.muted} /><Text style={s.eLabel}>Vehicle</Text><Text style={s.eVal}>{item.vehicleType}</Text></View> : null}
            {item.bookingSource ? <View style={s.eRow}><Icon name="link" size={13} color={C.purple} /><Text style={s.eLabel}>Source</Text><Text style={[s.eVal, { color: C.purple }]}>{item.bookingSource === 'shared_form' ? 'Booking Form' : 'Manual'}</Text></View> : null}
            {item.paidAmount > 0 ? <View style={s.eRow}><Icon name="credit-card" size={13} color={C.green} /><Text style={s.eLabel}>Paid</Text><Text style={[s.eVal, { color: C.green }]}>₹{item.paidAmount.toLocaleString('en-IN')}</Text></View> : null}
            {item.notes ? <View style={[s.eRow, { alignItems: 'flex-start' }]}><Icon name="file-text" size={13} color={C.muted} /><Text style={s.eLabel}>Notes</Text><Text style={[s.eVal, { flex: 1 }]} numberOfLines={3}>{item.notes}</Text></View> : null}
            <TouchableOpacity style={s.viewBtn} onPress={() => navigation.navigate('DirectBookingDetail', { bookingId: item.id })}>
              <Text style={s.viewBtnText}>View Full Details</Text>
              <Icon name="arrow-right" size={14} color={C.brand} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Direct Bookings</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => setShowSearch(v => !v)} style={s.headerIconBtn}>
            <Icon name="search" size={20} color={showSearch ? C.brand : C.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDateFilter(true)} style={s.headerIconBtn}>
            <Icon name="calendar" size={20} color={dateFilter.start ? C.brand : C.muted} />
            {dateFilter.start && <View style={s.filterDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddDirectBooking')} style={s.addBtn}>
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={s.searchBar}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, phone, or booking #"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
            autoFocus
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="x" size={16} color={C.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Status tabs */}
      <View style={s.tabsContainer}>
        <FlatList
          data={STATUS_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={t => t.key}
          contentContainerStyle={s.tabsContent}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => onTabChange(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Bookings list */}
      {loading && bookings.length === 0 ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.brand} /></View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(true)} colors={[C.brand]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="inbox" size={48} color={C.muted} />
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySub}>Direct bookings will appear here</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddDirectBooking')}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Add First Booking</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={(start, end, type) => {
          setDateFilter({ start, end, type });
          setShowDateFilter(false);
        }}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },

  // Tabs
  tabsContainer: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#fff' },

  // List
  list: { padding: 16, gap: 12 },

  // Card
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  num: { fontSize: 15, fontWeight: '700', color: C.text },
  chip: { fontSize: 11, color: C.brand, backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  body: { paddingHorizontal: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { fontSize: 13, color: C.subtext, flex: 1 },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1 },
  routeLine: { width: 24, height: 1, backgroundColor: C.border, marginHorizontal: 2 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border },
  amtLabel: { fontSize: 11, color: C.muted, marginBottom: 1 },
  amt: { fontSize: 17, fontWeight: '800', color: C.brand },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  payBadgeText: { fontSize: 10, fontWeight: '700' },
  expandBtn: { padding: 4 },

  // Expanded
  expanded: { paddingHorizontal: 14, paddingBottom: 14 },
  expandDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5 },
  eLabel: { fontSize: 12, color: C.muted, width: 76 },
  eVal: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: '#EFF6FF' },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: C.brand },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  emptySub: { fontSize: 13, color: C.muted },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: C.brand, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

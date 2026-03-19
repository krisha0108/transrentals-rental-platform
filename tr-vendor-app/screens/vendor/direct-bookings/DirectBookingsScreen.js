import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, LayoutAnimation, Platform, UIManager,
  TextInput, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDirectBookings } from '../../api/client';
import DateFilterModal from '../../../components/DateFilterModal';
import { ListSkeleton } from '../../../components/SkeletonLoader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#064E3B', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g300: '#6EE7B7', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F0FDF9', surface: '#FFFFFF',
  text: '#1E293B', subtext: '#475569', muted: '#94A3B8', border: '#D1FAE5',
  blue: '#3B82F6', indigo: '#6366F1', purple: '#8B5CF6',
  amber: '#F59E0B', orange: '#F97316', red: '#EF4444', teal: '#14B8A6',
};

const STATUS_CONFIG = {
  inquiry:     { label: 'Inquiry',     color: C.amber  },
  confirmed:   { label: 'Confirmed',   color: C.blue   },
  in_progress: { label: 'Active',      color: C.purple },
  completed:   { label: 'Completed',   color: C.g600   },
  rejected:    { label: 'Rejected',    color: C.red    },
  cancelled:   { label: 'Cancelled',   color: C.muted  },
};

const PAYMENT_CONFIG = {
  pending:     { label: 'Due',         color: C.amber  },
  partial:     { label: 'Partial',     color: C.orange },
  collected:   { label: 'Paid',        color: C.g600   },
  link_sent:   { label: 'Link Sent',   color: C.blue   },
  paid_online: { label: 'Paid Online', color: C.g600   },
  waived:      { label: 'Waived',      color: C.muted  },
};

const SERVICE_ICONS = {
  'car-with-driver': { icon: 'car',              color: C.blue   },
  'self-drive':      { icon: 'car-side',         color: C.purple },
  bike:              { icon: 'motorbike',         color: C.amber  },
  bus:               { icon: 'bus',              color: C.teal   },
  luxury:            { icon: 'car-sports',        color: '#EAB308'},
  transporter:       { icon: 'truck',             color: C.orange },
  'packers-movers':  { icon: 'package-variant',   color: C.indigo },
  equipment:         { icon: 'wrench',            color: C.red    },
  general:           { icon: 'clipboard-text',    color: C.muted  },
};

const SERVICE_LABELS = {
  'car-with-driver': 'Car w/ Driver', 'self-drive': 'Self-Drive',
  bike: 'Bike', bus: 'Bus & Tempo', luxury: 'Luxury',
  transporter: 'Transporter', 'packers-movers': 'Packers',
  equipment: 'Equipment', general: 'General',
};

const STATUS_TABS = [
  { key: 'all',         label: 'All'       },
  { key: 'inquiry',     label: 'Inquiries' },
  { key: 'confirmed',   label: 'Confirmed' },
  { key: 'in_progress', label: 'Active'    },
  { key: 'completed',   label: 'Completed' },
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

  const total         = bookings.length;
  const activeCount   = bookings.filter(b => b.status === 'in_progress').length;
  const confirmedCount= bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue  = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);

  const ListHeader = () => (
    <>
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.grad}>
        <SafeAreaView edges={['top']}>
          <View style={s.gradTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.gradTitle}>Direct Bookings</Text>
              <Text style={s.gradSub}>Walk-in & offline bookings</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSearch(v => !v)} style={s.hBtn}>
              <Icon name="search" size={20} color={showSearch ? C.g300 : 'rgba(255,255,255,0.75)'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDateFilter(true)} style={s.hBtn}>
              <Icon name="calendar" size={20} color={dateFilter.start ? C.g300 : 'rgba(255,255,255,0.75)'} />
              {dateFilter.start && <View style={s.filterDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AddDirectBooking')} style={s.addBtn}>
              <Icon name="plus" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={s.statsStrip}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{total}</Text>
              <Text style={s.statLbl}>Total</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: C.g400 }]}>{activeCount}</Text>
              <Text style={s.statLbl}>Active</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: '#93C5FD' }]}>{confirmedCount}</Text>
              <Text style={s.statLbl}>Confirmed</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: '#86EFAC' }]}>
                ₹{totalRevenue > 9999 ? `${(totalRevenue / 1000).toFixed(1)}K` : totalRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={s.statLbl}>Collected</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Search */}
      {showSearch && (
        <View style={s.searchBar}>
          <Icon name="search" size={16} color={C.g600} />
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

      {/* Tabs */}
      <View style={s.tabsWrap}>
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

      {/* Active date filter bar */}
      {dateFilter.start && (
        <View style={s.dateBar}>
          <Icon name="calendar" size={13} color={C.g700} />
          <Text style={s.dateBarText}>
            {fmt(dateFilter.start)}{dateFilter.end ? `  →  ${fmt(dateFilter.end)}` : ''}
          </Text>
          <TouchableOpacity onPress={() => setDateFilter({ start: null, end: null, type: null })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="x" size={13} color={C.g700} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };
    const pc = PAYMENT_CONFIG[item.paymentStatus] || { label: '', color: C.muted };
    const svcMeta = SERVICE_ICONS[item.serviceType] || { icon: 'clipboard-text', color: C.muted };
    const svcLabel = SERVICE_LABELS[item.serviceType] || item.serviceType || '';
    const isExpanded = expandedId === item.id;
    const isPaid = ['collected', 'paid_online'].includes(item.paymentStatus);
    const isTerminal = ['cancelled', 'rejected'].includes(item.status);

    return (
      <View style={s.card}>
        <View style={[s.cardAccent, { backgroundColor: sc.color }]} />
        <View style={s.cardInner}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('DirectBookingDetail', { bookingId: item.id })}>
            {/* Top */}
            <View style={s.cardTop}>
              <View style={[s.svcIcon, { backgroundColor: svcMeta.color + '18' }]}>
                <MaterialCommunityIcons name={svcMeta.icon} size={20} color={svcMeta.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.bookingNum}>#{item.bookingNumber}</Text>
                {svcLabel ? <Text style={[s.svcLabel, { color: svcMeta.color }]}>{svcLabel}</Text> : null}
              </View>
              <View style={[s.statusPill, { backgroundColor: sc.color + '18' }]}>
                <View style={[s.statusDot, { backgroundColor: sc.color }]} />
                <Text style={[s.statusPillText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>

            {/* Customer + route */}
            <View style={s.cardBody}>
              <View style={s.infoRow}>
                <Icon name="user" size={13} color={C.g600} />
                <Text style={s.infoText} numberOfLines={1}>{item.customerName}</Text>
              </View>
              <View style={s.infoRow}>
                <Icon name="phone" size={13} color={C.muted} />
                <Text style={s.infoText}>{item.customerPhone}</Text>
              </View>

              {(item.pickupLocation || item.dropLocation) && (
                <View style={s.routeBox}>
                  {item.pickupLocation ? (
                    <View style={s.routeRow}>
                      <View style={[s.routeDot, { backgroundColor: C.g500 }]} />
                      <Text style={s.routeText} numberOfLines={1}>{item.pickupLocation}</Text>
                    </View>
                  ) : null}
                  {item.pickupLocation && item.dropLocation && <View style={s.routeConnector} />}
                  {item.dropLocation ? (
                    <View style={s.routeRow}>
                      <View style={[s.routeDot, { backgroundColor: C.red }]} />
                      <Text style={s.routeText} numberOfLines={1}>{item.dropLocation}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={s.infoRow}>
                <Icon name="calendar" size={13} color={C.muted} />
                <Text style={s.infoText}>
                  {fmt(item.pickupDate)}{item.returnDate ? `  →  ${fmt(item.returnDate)}` : ''}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={s.cardFooter}>
              <View>
                <Text style={s.amtLbl}>TOTAL</Text>
                <Text style={s.amtVal}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={s.footerRight}>
                {isPaid ? (
                  <View style={s.paidChip}>
                    <Icon name="check-circle" size={11} color={C.g600} />
                    <Text style={[s.chipTxt, { color: C.g600 }]}>Paid</Text>
                  </View>
                ) : !isTerminal && item.paymentStatus ? (
                  <View style={[s.payChip, { backgroundColor: pc.color + '18' }]}>
                    <Text style={[s.chipTxt, { color: pc.color }]}>{pc.label}</Text>
                  </View>
                ) : null}
                <TouchableOpacity style={s.expandBtn} onPress={() => toggleExpand(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
                </TouchableOpacity>
                <View style={s.arrowCircle}>
                  <Icon name="chevron-right" size={15} color={C.g600} />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded */}
          {isExpanded && (
            <View style={s.expanded}>
              <View style={s.expandDivider} />
              {item.vehicleType ? (
                <View style={s.eRow}>
                  <MaterialCommunityIcons name="car" size={14} color={C.muted} />
                  <Text style={s.eLabel}>Vehicle</Text>
                  <Text style={s.eVal}>{item.vehicleType}</Text>
                </View>
              ) : null}
              {item.bookingSource ? (
                <View style={s.eRow}>
                  <Icon name="link" size={13} color={C.purple} />
                  <Text style={s.eLabel}>Source</Text>
                  <Text style={[s.eVal, { color: C.purple }]}>{item.bookingSource === 'shared_form' ? 'Booking Form' : 'Manual'}</Text>
                </View>
              ) : null}
              {item.paidAmount > 0 ? (
                <View style={s.eRow}>
                  <Icon name="credit-card" size={13} color={C.g600} />
                  <Text style={s.eLabel}>Paid</Text>
                  <Text style={[s.eVal, { color: C.g600 }]}>₹{item.paidAmount.toLocaleString('en-IN')}</Text>
                </View>
              ) : null}
              {item.notes ? (
                <View style={[s.eRow, { alignItems: 'flex-start' }]}>
                  <Icon name="file-text" size={13} color={C.muted} />
                  <Text style={s.eLabel}>Notes</Text>
                  <Text style={[s.eVal, { flex: 1 }]} numberOfLines={3}>{item.notes}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={s.viewBtn} onPress={() => navigation.navigate('DirectBookingDetail', { bookingId: item.id })}>
                <Text style={s.viewBtnTxt}>View Full Details</Text>
                <Icon name="arrow-right" size={14} color={C.g700} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        ListHeaderComponent={<ListHeader />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBookings(true)}
            colors={[C.g600]}
            tintColor={C.g600}
            progressViewOffset={10}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 8 }}>
              <ListSkeleton count={4} />
            </View>
          ) : (
            <View style={s.emptyWrap}>
              <LinearGradient colors={[C.g100, C.g50]} style={s.emptyIconWrap}>
                <MaterialCommunityIcons name="book-open-variant" size={44} color={C.g600} />
              </LinearGradient>
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySub}>Direct bookings will appear here</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddDirectBooking')}>
                <LinearGradient colors={[C.g700, C.g600]} style={s.emptyBtnGrad}>
                  <Icon name="plus" size={16} color="#fff" />
                  <Text style={s.emptyBtnTxt}>Add First Booking</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        }
      />

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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Gradient header ── */
  grad: { paddingBottom: 18 },
  gradTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  gradTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  gradSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.g400, borderWidth: 1.5, borderColor: C.g900 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  /* Stats strip */
  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statItem: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 10 },

  /* Search */
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },

  /* Tabs */
  tabsWrap: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g100 },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  tabTextActive: { color: '#fff' },

  /* Date filter bar */
  dateBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.g50, borderBottomWidth: 1, borderBottomColor: C.g100 },
  dateBarText: { flex: 1, fontSize: 12, color: C.g700, fontWeight: '600' },

  /* List */
  list: { paddingBottom: 30, gap: 12 },

  /* Card */
  card: { marginHorizontal: 14, backgroundColor: C.surface, borderRadius: 18, flexDirection: 'row', overflow: 'hidden', shadowColor: C.g900, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: C.border },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 12 },
  svcIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  bookingNum: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  svcLabel: { fontSize: 11, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  cardBody: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { fontSize: 13, color: C.subtext, flex: 1 },

  routeBox: { backgroundColor: C.g50, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 4, marginVertical: 2, borderWidth: 1, borderColor: C.g100 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1 },
  routeConnector: { width: 1, height: 8, backgroundColor: C.border, marginLeft: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  amtLbl: { fontSize: 9, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  amtVal: { fontSize: 19, fontWeight: '800', color: C.g700, letterSpacing: -0.5 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paidChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: C.g100 },
  payChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  chipTxt: { fontSize: 10, fontWeight: '700' },
  expandBtn: { padding: 4 },
  arrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.g100 },

  /* Expanded */
  expanded: {},
  expandDivider: { height: 1, backgroundColor: C.border, marginTop: 4, marginBottom: 10 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  eLabel: { fontSize: 12, color: C.muted, width: 66 },
  eVal: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g100 },
  viewBtnTxt: { fontSize: 13, fontWeight: '700', color: C.g700 },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 8 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

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
import { useVerificationGate, VerificationBanner } from '../../../components/VerificationGate';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: shade(T.emerald, 20), g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, subtext: T.text, muted: T.subText, border: T.border,
  blue: T.blue, indigo: T.indigo, purple: T.purple,
  amber: T.amber, orange: T.orange, red: T.red, teal: T.ocean,
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
  // Verification gate — pending vendors can browse direct bookings; adding
  // a new booking requires verification.
  const { status: vendorStatus, gate, LockGateModal } = useVerificationGate(navigation);
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

  const FixedHero = () => (
    <LinearGradient colors={G.hero} style={s.grad}>
      <AnimatedOrb style={s.deco1} />
      <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
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
          <TouchableOpacity onPress={gate(() => navigation.navigate('AddDirectBooking'), 'create direct bookings')} style={s.addBtn}>
            <Icon name={vendorStatus === 'APPROVED' ? 'plus' : 'lock'} size={22} color="#fff" />
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
  );

  const ListHeader = () => (
    <>
      <VerificationBanner status={vendorStatus} navigation={navigation} />

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
            {/* Top stripe: service icon + booking # + status — compact, agent-card density */}
            <View style={s.cardTopStripe}>
              <View style={[s.svcIcon, { backgroundColor: svcMeta.color + '18' }]}>
                <MaterialCommunityIcons name={svcMeta.icon} size={rs(15)} color={svcMeta.color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                {svcLabel ? <Text style={[s.svcLabel, { color: svcMeta.color }]} numberOfLines={1}>{svcLabel.toUpperCase()}</Text> : null}
                <Text style={s.bookingNum} numberOfLines={1}>#{item.bookingNumber}</Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: sc.color + '18' }]}>
                <Text style={[s.statusPillText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>

            {/* Customer */}
            <Text style={s.cardName} numberOfLines={1}>{item.customerName}</Text>
            <Text style={s.cardPhone} numberOfLines={1}>{item.customerPhone}</Text>

            {/* Meta row: date range + route, single-line icons like agent cards */}
            <View style={s.cardMetaRow}>
              <View style={s.metaItem}>
                <Icon name="calendar" size={rs(11)} color={C.muted} />
                <Text style={s.metaText}>
                  {fmt(item.pickupDate)}{item.returnDate ? `  →  ${fmt(item.returnDate)}` : ''}
                </Text>
              </View>
              {(item.pickupLocation || item.dropLocation) && (
                <View style={s.metaItem}>
                  <Icon name="map-pin" size={rs(11)} color={C.muted} />
                  <Text style={s.metaText} numberOfLines={1}>
                    {item.pickupLocation || '—'}{item.dropLocation ? `  →  ${item.dropLocation}` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Money row */}
            <View style={s.moneyBlock}>
              <Text style={s.amtVal}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
              <View style={s.footerRight}>
                {isPaid ? (
                  <View style={s.paidChip}>
                    <Icon name="check-circle" size={10} color={C.g600} />
                    <Text style={[s.chipTxt, { color: C.g600 }]}>Paid</Text>
                  </View>
                ) : !isTerminal && item.paymentStatus ? (
                  <View style={[s.payChip, { backgroundColor: pc.color + '18' }]}>
                    <Text style={[s.chipTxt, { color: pc.color }]}>{pc.label}</Text>
                  </View>
                ) : null}
                <TouchableOpacity style={s.expandBtn} onPress={() => toggleExpand(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={C.muted} />
                </TouchableOpacity>
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
      <FixedHero />
      <ListHeader />
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
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
              <View style={s.emptyIconWrap}>
                <MaterialCommunityIcons name="book-open-variant" size={44} color={C.g600} />
              </View>
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySub}>Direct bookings will appear here</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={gate(() => navigation.navigate('AddDirectBooking'), 'create direct bookings')}>
                <LinearGradient colors={G.emerald} style={s.emptyBtnGrad}>
                  <Icon name={vendorStatus === 'APPROVED' ? 'plus' : 'lock'} size={16} color="#fff" />
                  <Text style={s.emptyBtnTxt}>Add First Booking</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {LockGateModal}

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
  grad: { paddingBottom: rs(18), overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  deco1: {
    position: 'absolute', width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  deco2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.045)', bottom: -10, left: 40,
  },
  gradTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  gradTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  gradSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.g400, borderWidth: 1.5, borderColor: C.g900 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  /* Stats strip */
  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statItem: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  statNum: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 10 },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    paddingHorizontal: 14, height: rs(46),
    backgroundColor: C.surface, borderRadius: rs(15),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },

  /* Tabs */
  tabsWrap: { backgroundColor: C.bg },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, ...cardShadow },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabText: { fontSize: 13, fontWeight: '700', color: C.subtext },
  tabTextActive: { color: '#fff' },

  /* Date filter bar */
  dateBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.g50, borderBottomWidth: 1, borderBottomColor: C.g100 },
  dateBarText: { flex: 1, fontSize: 12, color: C.g700, fontWeight: '700' },

  /* List */
  list: { paddingTop: 12, paddingBottom: 30, gap: 12 },

  /* Card — compact, agent-side density */
  card: {
    marginHorizontal: 14, backgroundColor: C.surface, borderRadius: rs(14), flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardAccent: { width: 3 },
  cardInner: { flex: 1, padding: 10 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 },
  svcIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  svcLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
  bookingNum: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '800', color: C.text, marginTop: 1 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  cardName: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '700', color: C.text },
  cardPhone: { fontSize: 11.5, color: C.muted, marginTop: 1, fontWeight: '600' },

  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 7, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { fontSize: 11, color: C.subtext, fontWeight: '600' },

  moneyBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  amtVal: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.g700, letterSpacing: -0.3 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paidChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: C.g100 },
  payChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipTxt: { fontSize: 9.5, fontWeight: '700' },
  expandBtn: { padding: 4 },

  /* Expanded */
  expanded: {},
  expandDivider: { height: 1, backgroundColor: C.border, marginTop: 4, marginBottom: 10 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  eLabel: { fontSize: 12, color: C.muted, width: 66 },
  eVal: { fontSize: 13, color: C.text, fontWeight: '700', flex: 1 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: rs(10), backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g100 },
  viewBtnTxt: { fontSize: 13, fontWeight: '700', color: C.g700 },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 8 },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyBtn: { marginTop: 16, borderRadius: rs(14), overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
});

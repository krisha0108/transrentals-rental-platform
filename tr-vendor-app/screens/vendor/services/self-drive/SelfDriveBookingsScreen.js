import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g500: '#059669', g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  green: '#059669', greenL: '#ECFDF5',
  amber: '#D97706', amberL: '#FFFBEB',
  orange: '#EA580C', orangeL: '#FFF7ED',
  red: '#DC2626', redL: '#FEF2F2',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  teal: '#0D9488', tealL: '#F0FDFA',
};

const STATUS_CFG = {
  PENDING_PAYMENT:  { label: 'Payment Pending',  bg: C.amberL,   text: C.amber   },
  PAYMENT_VERIFIED: { label: 'Payment Verified', bg: C.greenL,   text: C.green   },
  BROADCASTED:      { label: 'Open',             bg: C.g50,      text: C.g700    },
  PENDING_VENDOR:   { label: 'Pending',          bg: C.amberL,   text: C.amber   },
  ACCEPTED:         { label: 'Accepted',         bg: C.greenL,   text: C.green   },
  CONFIRMED:        { label: 'Confirmed',        bg: C.greenL,   text: C.green   },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', bg: C.tealL,    text: C.teal    },
  IN_PROGRESS:      { label: 'In Progress',      bg: C.purpleL,  text: C.purple  },
  COMPLETED:        { label: 'Completed',        bg: C.g50,      text: C.g700    },
  CANCELLED:        { label: 'Cancelled',        bg: C.redL,     text: C.red     },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';
const fmtAmt = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0';

export default function SelfDriveBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: allBookings, loading, refreshing, hasMore, loadMore, refresh, initialLoad, applyDateFilter, dateFilter } =
    useInfiniteScroll(getBookings, { service: 'self-drive', type: filter });

  useEffect(() => { initialLoad(); }, []);

  const tabFiltered = selectedFilter === 'completed'
    ? allBookings.filter(b => b.status === 'COMPLETED')
    : allBookings.filter(b => b.status !== 'COMPLETED');
  const q = searchQuery.trim().toLowerCase();
  const bookings = q
    ? tabFiltered.filter(b =>
        (b.bookingNumber || '').toLowerCase().includes(q) ||
        (b.customerName  || '').toLowerCase().includes(q) ||
        (b.pickupCity    || '').toLowerCase().includes(q) ||
        (b.dropCity      || '').toLowerCase().includes(q)
      )
    : tabFiltered;

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CFG[item.status] || { label: item.status, bg: C.border, text: C.muted };
    const isExpanded = expandedId === item.id;
    return (
      <View style={s.card}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('SelfDriveBookingDetail', { bookingId: item.id, serviceType: 'self-drive' })}>
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              <View style={s.numIconBox}>
                <MaterialCommunityIcons name="car" size={16} color={C.g700} />
              </View>
              <View>
                <Text style={s.num}>#{item.bookingNumber}</Text>
                {item.totalDays && <Text style={s.tripChip}>{item.totalDays}d self-drive</Text>}
              </View>
            </View>
            <View style={[s.badge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badgeText, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>

          <View style={s.cardBody}>
            {item.customerName && (
              <View style={s.infoRow}>
                <View style={[s.infoIcon, { backgroundColor: C.g50 }]}>
                  <Icon name="user" size={11} color={C.g700} />
                </View>
                <Text style={s.infoText} numberOfLines={1}>{item.customerName}</Text>
              </View>
            )}
            {(item.locationName || item.pickupCity) && (
              <View style={s.infoRow}>
                <View style={[s.infoIcon, { backgroundColor: C.greenL }]}>
                  <Icon name="map-pin" size={11} color={C.green} />
                </View>
                <Text style={s.infoText} numberOfLines={1}>{item.locationName || item.pickupCity}</Text>
              </View>
            )}
            <View style={s.infoRow}>
              <View style={[s.infoIcon, { backgroundColor: C.indigoL }]}>
                <Icon name="calendar" size={11} color={C.indigo} />
              </View>
              <Text style={s.infoText}>{fmt(item.pickupDate)}{item.pickupTime ? `  ${item.pickupTime.slice(0, 5)}` : ''}</Text>
            </View>
            {item.vehicleName && (
              <View style={s.infoRow}>
                <View style={[s.infoIcon, { backgroundColor: C.amberL }]}>
                  <Icon name="key" size={11} color={C.amber} />
                </View>
                <Text style={[s.infoText, { color: C.sub }]} numberOfLines={1}>{item.vehicleName}</Text>
              </View>
            )}
          </View>

          <View style={s.cardFooter}>
            <View>
              <Text style={s.amtLabel}>Total Amount</Text>
              <Text style={s.amt}>{fmtAmt(item.grandTotal || item.totalAmount)}</Text>
            </View>
            <View style={s.footerRight}>
              <TouchableOpacity style={s.expandBtn} onPress={() => toggleExpand(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
              </TouchableOpacity>
              <View style={s.detailBtn}>
                <Text style={s.detailBtnText}>Details</Text>
                <Icon name="chevron-right" size={12} color={C.g700} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.expanded}>
            <View style={s.expandDivider} />
            {item.vehicleBrand && <View style={s.eRow}><Text style={s.eLabel}>Brand</Text><Text style={s.eVal}>{item.vehicleBrand}</Text></View>}
            {item.pickupAddress && <View style={s.eRow}><Text style={s.eLabel}>Pickup Addr.</Text><Text style={s.eVal}>{item.pickupAddress}</Text></View>}
            {item.dropDate && <View style={s.eRow}><Text style={s.eLabel}>Drop Date</Text><Text style={s.eVal}>{fmt(item.dropDate)}{item.dropTime ? `  ${item.dropTime.slice(0, 5)}` : ''}</Text></View>}
            {item.securityDeposit > 0 && <View style={s.eRow}><Text style={s.eLabel}>Security Dep.</Text><Text style={s.eVal}>{fmtAmt(item.securityDeposit)}</Text></View>}
            {item.dailyRate && <View style={s.eRow}><Text style={s.eLabel}>Daily Rate</Text><Text style={s.eVal}>₹{item.dailyRate}/day</Text></View>}
            {item.assignedVehicleName && <View style={s.eRow}><Text style={s.eLabel}>Assigned Car</Text><Text style={[s.eVal, { color: C.g700 }]}>{item.assignedVehicleName}</Text></View>}
            {item.customerNotes && <View style={[s.eRow, { alignItems: 'flex-start' }]}><Text style={s.eLabel}>Notes</Text><Text style={[s.eVal, { flex: 1 }]}>{item.customerNotes}</Text></View>}
            <TouchableOpacity
              style={s.viewBtn}
              onPress={() => navigation.navigate('SelfDriveBookingDetail', { bookingId: item.id, serviceType: 'self-drive' })}
            >
              <Text style={s.viewBtnText}>View Full Details</Text>
              <Icon name="arrow-right" size={14} color={C.g700} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.header}>
        <View style={[s.deco, { width: 140, height: 140, top: -50, right: -30, opacity: 0.07 }]} />
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerMid}>
            <MaterialCommunityIcons name="car" size={18} color={C.g400} />
            <Text style={s.headerTitle}>Self Drive Bookings</Text>
          </View>
          <TouchableOpacity onPress={() => setShowDateFilter(true)} style={s.filterIconBtn}>
            <Icon name="calendar" size={18} color={dateFilter.start ? '#FFD700' : 'rgba(255,255,255,0.8)'} />
            {dateFilter.start && <View style={s.filterActiveDot} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabs}>
        {[
          { key: 'active', label: 'Active', icon: 'activity', count: allBookings.filter(b => b.status !== 'COMPLETED').length },
          { key: 'completed', label: 'Completed', icon: 'check-circle', count: allBookings.filter(b => b.status === 'COMPLETED').length },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.tab, selectedFilter === f.key && s.tabActive]}
            onPress={() => setSelectedFilter(f.key)}
          >
            <Icon name={f.icon} size={14} color={selectedFilter === f.key ? '#fff' : C.muted} />
            <Text style={[s.tabText, selectedFilter === f.key && s.tabTextActive]}>{f.label}</Text>
            <View style={[s.tabBadge, selectedFilter === f.key && s.tabBadgeActive]}>
              <Text style={[s.tabBadgeText, selectedFilter === f.key && s.tabBadgeTextActive]}>{f.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Icon name="search" size={16} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, booking #, city…"
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={15} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && allBookings.length === 0 ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={s.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, bookings.length === 0 && { flex: 1 }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g500]} tintColor={C.g500} />}
          ListFooterComponent={loading && hasMore ? <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color={C.g500} /></View> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <MaterialCommunityIcons name="car" size={36} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>{selectedFilter === 'completed' ? 'No completed bookings' : 'No active bookings'}</Text>
              <Text style={s.emptySub}>Pull down to refresh</Text>
            </View>
          }
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={(st, e, t) => applyDateFilter(st, e, t)}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </SafeAreaView>
  );
}

const C2 = { g400: '#34D399' };

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerMid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  filterIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterActiveDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', borderWidth: 1.5, borderColor: C.g900 },

  // Tabs
  tabs: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#fff' },
  tabBadge: { minWidth: 22, height: 22, backgroundColor: '#fff', borderRadius: 11, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: C.g700 },
  tabBadgeTextActive: { color: '#fff' },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: C.muted },

  // Card
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  numIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2 },
  tripChip: { fontSize: 10, color: C.g700, backgroundColor: C.g50, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, fontWeight: '600', alignSelf: 'flex-start' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  cardBody: { paddingHorizontal: 14, gap: 8, paddingBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border },
  amtLabel: { fontSize: 10, color: C.muted, marginBottom: 1 },
  amt: { fontSize: 17, fontWeight: '800', color: C.g700 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expandBtn: { padding: 4 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailBtnText: { fontSize: 11, fontWeight: '700', color: C.g700 },

  // Expanded
  expanded: { paddingHorizontal: 14, paddingBottom: 14, backgroundColor: C.bg },
  expandDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  eRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  eLabel: { fontSize: 11, color: C.muted, width: 80, fontWeight: '600' },
  eVal: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: C.g700 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 72 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.muted },

  /* Search */
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
});

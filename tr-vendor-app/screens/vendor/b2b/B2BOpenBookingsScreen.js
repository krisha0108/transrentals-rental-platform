import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getB2BOpenBookings } from '../../api/client';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#6366F1',
  green: '#10B981', orange: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
};

const STATUS_CONFIG = {
  OPEN_FOR_QUOTES: { label: 'Open', color: C.green },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: C.blue },
  VENDOR_ASSIGNED: { label: 'Assigned', color: C.purple },
  CONFIRMED: { label: 'Confirmed', color: '#059669' },
  IN_PROGRESS: { label: 'In Progress', color: C.purple },
  COMPLETED: { label: 'Completed', color: '#059669' },
  CANCELLED: { label: 'Cancelled', color: C.red },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BOpenBookingsScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: allBookings, loading, refreshing, hasMore, loadMore, refresh, initialLoad } =
    useInfiniteScroll(getB2BOpenBookings, {});

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const bookings = selectedFilter === 'all'
    ? allBookings
    : selectedFilter === 'open'
      ? allBookings.filter(b => b.status === 'OPEN_FOR_QUOTES')
      : allBookings.filter(b => b.vendorQuotes?.length > 0);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };
    const hasQuoted = item.vendorQuotes?.length > 0;
    const isExpanded = expandedId === item.id;

    return (
      <View style={s.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('B2BBookingDetail', { bookingId: item.id })}
        >
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              <Text style={s.num}>#{item.bookingNumber}</Text>
              {hasQuoted && (
                <View style={[s.quotedChip]}>
                  <Icon name="check" size={10} color={C.green} />
                  <Text style={s.quotedText}>Quoted</Text>
                </View>
              )}
            </View>
            <View style={[s.badge, { backgroundColor: sc.color + '20' }]}>
              <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          <View style={s.body}>
            <View style={s.row}>
              <Icon name="briefcase" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>
                {item.companyName || item.customer?.companyName || item.customer?.name || 'N/A'}
              </Text>
            </View>
            <View style={s.row}>
              <Icon name="layers" size={14} color={C.muted} />
              <Text style={s.rowText}>{item.serviceType || 'N/A'} · {item.vehiclesRequired || 0} vehicles</Text>
            </View>
            <View style={s.row}>
              <Icon name="map-pin" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>
                {item.pickupLocation || 'N/A'} → {item.dropLocation || 'N/A'}
              </Text>
            </View>
            <View style={s.row}>
              <Icon name="calendar" size={14} color={C.muted} />
              <Text style={s.rowText}>{fmt(item.scheduledDate)}{item.scheduledTime ? ` ${item.scheduledTime}` : ''}</Text>
            </View>
          </View>

          <View style={s.footer}>
            <View>
              <Text style={s.quotesCount}>{item._count?.vendorQuotes || 0} quotes · {item._count?.trips || 0} trips</Text>
            </View>
            <View style={s.footerRight}>
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
            {item.tripType && (
              <View style={s.eRow}><Icon name="navigation" size={13} color={C.muted} /><Text style={s.eLabel}>Trip Type</Text><Text style={s.eVal}>{item.tripType}</Text></View>
            )}
            {item.notes && (
              <View style={[s.eRow, { alignItems: 'flex-start' }]}><Icon name="file-text" size={13} color={C.muted} /><Text style={s.eLabel}>Notes</Text><Text style={[s.eVal, { flex: 1 }]}>{item.notes}</Text></View>
            )}
            <TouchableOpacity style={s.viewBtn} onPress={() => navigation.navigate('B2BBookingDetail', { bookingId: item.id })}>
              <Text style={s.viewBtnText}>{hasQuoted ? 'View Quote' : 'Submit Quote'}</Text>
              <Icon name="arrow-right" size={14} color={C.brand} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'quoted', label: 'Quoted' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>B2B Open Bookings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.tabs}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[s.tab, selectedFilter === f.key && s.tabActive]} onPress={() => setSelectedFilter(f.key)}>
            <Text style={[s.tabText, selectedFilter === f.key && s.tabTextActive]}>{f.label}</Text>
            <View style={[s.tabBadge, selectedFilter === f.key && s.tabBadgeActive]}>
              <Text style={[s.tabBadgeText, selectedFilter === f.key && s.tabBadgeTextActive]}>
                {f.key === 'all' ? allBookings.length : f.key === 'open' ? allBookings.filter(b => b.status === 'OPEN_FOR_QUOTES').length : allBookings.filter(b => b.vendorQuotes?.length > 0).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.brand} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <Icon name="inbox" size={48} color={C.muted} />
              <Text style={s.emptyText}>No open bookings</Text>
              <Text style={s.emptySubtext}>Check back later for new B2B bookings</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && !refreshing ? <ActivityIndicator style={{ padding: 20 }} color={C.brand} /> : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: C.surface },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, gap: 6 },
  tabActive: { backgroundColor: C.brand },
  tabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  tabTextActive: { color: '#fff' },
  tabBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: C.subtext },
  tabBadgeTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  num: { fontSize: 14, fontWeight: '700', color: C.brand },
  quotedChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.green + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  quotedText: { fontSize: 10, fontWeight: '700', color: C.green },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { marginTop: 10, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 13, color: C.subtext, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  quotesCount: { fontSize: 12, color: C.muted },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandBtn: { padding: 4 },
  expanded: { marginTop: 4 },
  expandDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eLabel: { fontSize: 12, color: C.muted, width: 70 },
  eVal: { fontSize: 13, color: C.text, fontWeight: '500' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, backgroundColor: C.brand + '10', borderRadius: 10 },
  viewBtnText: { fontSize: 14, fontWeight: '600', color: C.brand },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: C.subtext, marginTop: 4 },
});

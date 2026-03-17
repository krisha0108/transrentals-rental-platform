import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getB2BMyQuotes } from '../../api/client';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#6366F1',
  green: '#10B981', orange: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
};

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', color: C.orange },
  UNDER_REVIEW: { label: 'Under Review', color: C.blue },
  CONFIRMED: { label: 'Confirmed', color: C.green },
  REJECTED: { label: 'Rejected', color: C.red },
  WITHDRAWN: { label: 'Withdrawn', color: C.muted },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BMyQuotesScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const { data: allQuotes, loading, refreshing, hasMore, loadMore, refresh, initialLoad } =
    useInfiniteScroll(getB2BMyQuotes, {});

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const quotes = selectedFilter === 'all'
    ? allQuotes
    : allQuotes.filter(q => q.status === selectedFilter.toUpperCase());

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const renderQuote = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('B2BQuoteDetail', { quoteId: item.id })}
      >
        <View style={s.cardTop}>
          <Text style={s.num}>#{item.quoteNumber}</Text>
          <View style={[s.badge, { backgroundColor: sc.color + '20' }]}>
            <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {item.booking && (
          <View style={s.body}>
            <View style={s.row}>
              <Icon name="hash" size={14} color={C.muted} />
              <Text style={s.rowText}>Booking: {item.booking.bookingNumber}</Text>
            </View>
            <View style={s.row}>
              <Icon name="briefcase" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>{item.booking.companyName || 'N/A'}</Text>
            </View>
            <View style={s.row}>
              <Icon name="layers" size={14} color={C.muted} />
              <Text style={s.rowText}>{item.booking.serviceType} · {item.vehicleCount || item.quoteVehicles?.length || 0} vehicles</Text>
            </View>
            <View style={s.row}>
              <Icon name="map-pin" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>
                {item.booking.pickupLocation || 'N/A'} → {item.booking.dropLocation || 'N/A'}
              </Text>
            </View>
          </View>
        )}

        <View style={s.footer}>
          <View>
            <Text style={s.price}>₹{(item.totalPrice || 0).toLocaleString('en-IN')}</Text>
            <Text style={s.dateText}>{fmt(item.createdAt)}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={C.brand} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My B2B Quotes</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.tabs}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[s.tab, selectedFilter === f.key && s.tabActive]} onPress={() => setSelectedFilter(f.key)}>
            <Text style={[s.tabText, selectedFilter === f.key && s.tabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuote}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.brand} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <Icon name="file-text" size={48} color={C.muted} />
              <Text style={s.emptyText}>No quotes yet</Text>
              <Text style={s.emptySubtext}>Submit quotes on open bookings to see them here</Text>
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
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg },
  tabActive: { backgroundColor: C.brand },
  tabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: { fontSize: 14, fontWeight: '700', color: C.brand },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { marginTop: 10, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 13, color: C.subtext, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 16, fontWeight: '700', color: C.text },
  dateText: { fontSize: 11, color: C.muted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: C.subtext, marginTop: 4 },
});

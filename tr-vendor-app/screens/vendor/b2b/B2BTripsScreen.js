import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getB2BTrips } from '../../api/client';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#6366F1',
  green: '#10B981', orange: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6', cyan: '#0891B2',
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: C.orange, icon: 'clock' },
  DRIVER_ARRIVED: { label: 'Driver Arrived', color: C.cyan, icon: 'map-pin' },
  STARTED: { label: 'In Progress', color: C.blue, icon: 'play-circle' },
  COMPLETED: { label: 'Completed', color: C.green, icon: 'check-circle' },
  CANCELLED: { label: 'Cancelled', color: C.red, icon: 'x-circle' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BTripsScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const { data: allTrips, loading, refreshing, hasMore, loadMore, refresh, initialLoad } =
    useInfiniteScroll(getB2BTrips, {});

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const trips = selectedFilter === 'all'
    ? allTrips
    : allTrips.filter(t => {
      if (selectedFilter === 'active') return ['PENDING', 'DRIVER_ARRIVED', 'STARTED'].includes(t.status);
      if (selectedFilter === 'completed') return t.status === 'COMPLETED';
      return true;
    });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  const renderTrip = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted, icon: 'help-circle' };

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('B2BTripDetail', { tripCode: item.tripCode })}
      >
        <View style={s.cardTop}>
          <View style={s.cardTopLeft}>
            <View style={[s.statusDot, { backgroundColor: sc.color }]} />
            <Text style={s.tripCode}>{item.tripCode}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: sc.color + '20' }]}>
            <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={s.body}>
          {item.vehicleName && (
            <View style={s.row}>
              <Icon name="truck" size={14} color={C.muted} />
              <Text style={s.rowText}>{item.vehicleName} {item.vehicleNumber ? `(${item.vehicleNumber})` : ''}</Text>
            </View>
          )}
          {item.driverName && (
            <View style={s.row}>
              <Icon name="user" size={14} color={C.muted} />
              <Text style={s.rowText}>{item.driverName} {item.driverPhone ? `· ${item.driverPhone}` : ''}</Text>
            </View>
          )}
          {(item.booking?.pickupLocation || item.pickupLocation) && (
            <View style={s.row}>
              <Icon name="map-pin" size={14} color={C.muted} />
              <Text style={s.rowText} numberOfLines={1}>
                {item.pickupLocation || item.booking?.pickupLocation || 'N/A'} → {item.dropLocation || item.booking?.dropLocation || 'N/A'}
              </Text>
            </View>
          )}
          <View style={s.row}>
            <Icon name="calendar" size={14} color={C.muted} />
            <Text style={s.rowText}>{fmt(item.scheduledDate)}{item.scheduledTime ? ` · ${item.scheduledTime}` : ''}</Text>
          </View>
        </View>

        {item.booking && (
          <View style={s.footer}>
            <Text style={s.bookingRef}>
              {item.booking.companyName || ''} · {item.booking.bookingNumber}
            </Text>
            <Icon name="chevron-right" size={18} color={C.brand} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>B2B Trips</Text>
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
        data={trips}
        keyExtractor={(item) => item.id || item.tripCode}
        renderItem={renderTrip}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.brand} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <Icon name="truck" size={48} color={C.muted} />
              <Text style={s.emptyText}>No trips yet</Text>
              <Text style={s.emptySubtext}>Trips will appear here once your quotes are confirmed</Text>
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
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tripCode: { fontSize: 14, fontWeight: '700', color: C.brand },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { marginTop: 10, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 13, color: C.subtext, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  bookingRef: { fontSize: 12, color: C.muted },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: C.subtext, marginTop: 4, textAlign: 'center' },
});

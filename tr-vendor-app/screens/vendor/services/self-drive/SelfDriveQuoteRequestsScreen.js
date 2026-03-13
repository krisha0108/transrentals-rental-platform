import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequests } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g500: '#059669', g400: '#34D399',
  g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  green: '#059669', greenL: '#ECFDF5',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  blue: '#2563EB', blueL: '#EFF6FF',
};

const STATUS_COLORS = {
  PENDING:         '#F59E0B',
  QUOTES_RECEIVED: '#2563EB',
  QUOTE_ACCEPTED:  '#10B981',
  BOOKING_CONFIRMED:'#10B981',
  CANCELLED:       '#EF4444',
  EXPIRED:         '#6B7280',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const vehicleTypeLabel = (t) =>
  t === '1' || t === 1 ? 'Hatchback' :
  t === '2' || t === 2 ? 'Sedan' :
  t === '3' || t === 3 ? 'MUV' :
  t === '4' || t === 4 ? 'SUV' :
  t === '5' || t === 5 ? 'Luxury' : t;

const getStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':         return 'time-outline';
    case 'QUOTES_RECEIVED': return 'document-text';
    case 'QUOTE_ACCEPTED':  return 'checkmark-circle';
    case 'BOOKING_CONFIRMED': return 'checkmark-done-circle';
    case 'CANCELLED':       return 'close-circle';
    case 'EXPIRED':         return 'alert-circle';
    default:                return 'help-circle-outline';
  }
};

export default function SelfDriveQuoteRequestsScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const { data: requests, loading, refreshing, hasMore, loadMore, refresh, initialLoad, applyDateFilter, dateFilter, clearDateFilter } =
    useInfiniteScroll(getQuoteRequests, { service: 'self-drive' });

  useEffect(() => {
    console.log('🚀 [SelfDriveRequests] Component mounted, loading initial data...');
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = useMemo(() => {
    const validRequests = requests.filter(req => {
      const status = req.status?.toUpperCase();
      return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
    });
    if (statusFilter === 'ALL') return validRequests;
    return validRequests.filter(req => req.status?.toUpperCase() === statusFilter);
  }, [requests, statusFilter]);

  const statusCounts = useMemo(() => {
    const validRequests = requests.filter(req => {
      const status = req.status?.toUpperCase();
      return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
    });
    const counts = { ALL: validRequests.length, PENDING: 0, QUOTES_RECEIVED: 0, CANCELLED: 0, EXPIRED: 0 };
    validRequests.forEach(req => {
      const status = req.status?.toUpperCase();
      if (counts.hasOwnProperty(status)) counts[status]++;
    });
    return counts;
  }, [requests]);

  const FILTER_OPTIONS = [
    { key: 'ALL',             label: 'All',             icon: 'apps',         color: '#6B7280' },
    { key: 'PENDING',         label: 'Pending',         icon: 'time-outline', color: STATUS_COLORS.PENDING },
    { key: 'QUOTES_RECEIVED', label: 'Quotes Received', icon: 'document-text',color: STATUS_COLORS.QUOTES_RECEIVED },
    { key: 'CANCELLED',       label: 'Cancelled',       icon: 'close-circle', color: STATUS_COLORS.CANCELLED },
    { key: 'EXPIRED',         label: 'Expired',         icon: 'alert-circle', color: STATUS_COLORS.EXPIRED },
  ];

  const renderRequestCard = ({ item }) => {
    const status = item.status?.toUpperCase() || 'PENDING';
    const statusColor = STATUS_COLORS[status] || '#6B7280';
    const customerName = item.customerName || item.customer_name || 'Customer';
    const pickupLocation = item.locationName || item.location?.name || item.pickupLocation || item.pickup_location || item.pickupCity || 'N/A';
    const dropLocation = item.dropLocation || item.drop_location || item.dropCity;
    const pickupDate = item.pickupDate || item.pickup_date || item.startDate;
    const returnDate = item.returnDate || item.return_date || item.endDate;
    const vehicleModelName = item.vehicleModelName || item.vehicle_model_name;
    const vehicleBrand = item.vehicleBrand || item.vehicle_brand;
    const vehicleType = item.vehicleType || item.vehicle_type;
    const vehicleCategoryName = item.vehicleCategoryName || item.vehicle_category_name;
    const vehicleDisplay = vehicleModelName || vehicleTypeLabel(vehicleType) || vehicleCategoryName;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => {
          const requestId = item.id || item._id;
          navigation.navigate('SelfDriveQuoteRequestDetail', { requestId });
        }}
        activeOpacity={0.8}
      >
        {/* Top */}
        <View style={s.cardTop}>
          <View style={s.cardTopLeft}>
            <View style={s.cardIconBox}>
              <MaterialCommunityIcons name="car" size={18} color={C.g700} />
            </View>
            <View>
              <Text style={s.reqNum}>#{item.requestNumber || item.request_number || (item.id || item._id)?.toString().slice(-8) || 'N/A'}</Text>
              <Text style={s.reqDate}>{fmtDate(item.createdAt || item.created_at)}</Text>
            </View>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Ionicons name={getStatusIcon(status)} size={12} color={statusColor} />
            <Text style={[s.statusText, { color: statusColor }]}>{status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Info */}
        <View style={s.cardBody}>
          <View style={s.infoRow}>
            <Ionicons name="person-circle-outline" size={16} color={C.muted} />
            <Text style={s.infoText} numberOfLines={1}>{customerName}</Text>
          </View>

          <View style={s.routeRow}>
            <Ionicons name="location" size={14} color={C.green} />
            <Text style={s.routeText} numberOfLines={1}>{pickupLocation}</Text>
            {dropLocation && (
              <>
                <Icon name="arrow-right" size={12} color={C.muted} style={{ marginHorizontal: 4 }} />
                <Ionicons name="location" size={14} color={C.red} />
                <Text style={s.routeText} numberOfLines={1}>{dropLocation}</Text>
              </>
            )}
          </View>

          {(pickupDate || returnDate) && (
            <View style={s.infoRow}>
              <Ionicons name="calendar-outline" size={15} color={C.muted} />
              <Text style={s.infoText}>
                {fmtDate(pickupDate)}{returnDate ? ` → ${fmtDate(returnDate)}` : ''}
              </Text>
            </View>
          )}

          {(vehicleDisplay || vehicleBrand) && (
            <View style={s.vehicleRow}>
              <MaterialCommunityIcons name="car" size={15} color={C.muted} />
              <View style={s.vehicleInfo}>
                {vehicleDisplay && <Text style={s.vehicleModel}>{vehicleDisplay}</Text>}
                {vehicleBrand && <Text style={s.vehicleBrand}>{vehicleBrand}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.cardFooter}>
          <Text style={s.tapHint}>Tap to respond</Text>
          <View style={s.footerArrow}>
            <Icon name="chevron-right" size={14} color={C.g700} />
          </View>
        </View>
      </TouchableOpacity>
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
            <Ionicons name="mail-unread-outline" size={18} color={C.g400} />
            <View>
              <Text style={s.headerTitle}>Quote Requests</Text>
              <Text style={s.headerSub}>Self Drive</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowDateFilter(true)} style={s.filterIconBtn}>
            <Icon name="calendar" size={18} color={dateFilter.start ? '#FFD700' : 'rgba(255,255,255,0.8)'} />
            {dateFilter.start && <View style={s.filterActiveDot} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Chips */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterContent}>
          {FILTER_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                s.filterChip,
                statusFilter === f.key && { borderColor: f.color, backgroundColor: f.color + '15' },
              ]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={f.icon} size={13} color={statusFilter === f.key ? f.color : C.muted} />
              <Text style={[s.filterChipText, statusFilter === f.key && { color: f.color, fontWeight: '700' }]}>
                {f.label}
              </Text>
              <View style={[s.filterCount, statusFilter === f.key && { backgroundColor: f.color }]}>
                <Text style={[s.filterCountText, statusFilter === f.key && { color: '#fff' }]}>
                  {statusCounts[f.key] || 0}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading && filteredRequests.length === 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.skeletonWrap} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={s.skeletonCard}>
              <View style={s.skeletonRow}>
                <View style={s.skeletonCircle} />
                <View style={s.skeletonBlock} />
                <View style={[s.skeletonBlock, { width: 70, flex: 0 }]} />
              </View>
              <View style={s.skeletonLine} />
              <View style={[s.skeletonLine, { width: '80%' }]} />
              <View style={[s.skeletonLine, { width: '55%' }]} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderRequestCard}
          contentContainerStyle={[s.list, filteredRequests.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g500]} tintColor={C.g500} />}
          ListFooterComponent={loading && hasMore ? <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color={C.g500} /></View> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="clipboard-outline" size={36} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>No Quote Requests</Text>
              <Text style={s.emptySub}>New quote requests from customers will appear here</Text>
            </View>
          }
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={(start, end, filterType) => applyDateFilter(start, end, filterType)}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerMid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  filterIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterActiveDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', borderWidth: 1.5, borderColor: C.g900 },

  // Filter
  filterBar: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  filterChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  filterCount: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.border, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontSize: 10, fontWeight: '700', color: C.muted },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  reqNum: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 1 },
  reqDate: { fontSize: 11, color: C.muted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },

  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  cardBody: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  routeText: { fontSize: 13, color: C.sub, flex: 1, maxWidth: 110 },
  vehicleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  vehicleInfo: { flex: 1 },
  vehicleModel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 1 },
  vehicleBrand: { fontSize: 11, color: C.muted },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  tapHint: { fontSize: 11, color: C.muted, fontWeight: '600' },
  footerArrow: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },

  // Skeleton
  skeletonWrap: { padding: 16, paddingBottom: 100 },
  skeletonCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  skeletonCircle: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.border },
  skeletonBlock: { flex: 1, height: 14, backgroundColor: C.border, borderRadius: 7 },
  skeletonLine: { height: 11, backgroundColor: C.border, borderRadius: 6, width: '100%', marginBottom: 8 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 72 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 32 },
});

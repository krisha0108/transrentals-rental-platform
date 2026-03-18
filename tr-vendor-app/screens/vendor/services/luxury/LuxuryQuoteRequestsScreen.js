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
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB',
  blue: '#2563EB', blueL: '#EFF6FF',
  red: '#DC2626', redL: '#FEF2F2',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
  purple: '#7C3AED', purpleL: '#EDE9FE',
};

const STATUS_META = {
  ALL:             { label: 'All',       color: C.sub,   bg: '#F1F5F9', icon: 'apps-outline' },
  PENDING:         { label: 'Pending',   color: C.amber, bg: C.amberL, icon: 'time-outline' },
  QUOTES_RECEIVED: { label: 'Quoted',    color: C.blue,  bg: C.blueL,  icon: 'document-text-outline' },
  CANCELLED:       { label: 'Cancelled', color: C.red,   bg: C.redL,   icon: 'close-circle-outline' },
  EXPIRED:         { label: 'Expired',   color: C.muted, bg: '#F8FAFC', icon: 'alert-circle-outline' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function LuxuryQuoteRequestsScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    data: requests, loading, refreshing, hasMore,
    loadMore, refresh, initialLoad, applyDateFilter, dateFilter,
    clearDateFilter,
  } = useInfiniteScroll(getQuoteRequests, { service: 'luxury' });

  useEffect(() => {
    console.log('🚀 [LuxuryRequests] Component mounted, loading initial data...');
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Filter requests based on selected status
  const filteredRequests = useMemo(() => {
    // Filter out accepted/confirmed requests - they should only appear in bookings
    const validRequests = requests.filter(req => {
      const status = req.status?.toUpperCase();
      return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
    });

    if (statusFilter === 'ALL') {
      return validRequests;
    }
    return validRequests.filter(req => req.status?.toUpperCase() === statusFilter);
  }, [requests, statusFilter]);

  // Get count for each status
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

  const getStatusMeta = (status) => {
    const key = status?.toUpperCase();
    return STATUS_META[key] || { label: status, color: C.muted, bg: '#F8FAFC', icon: 'help-circle-outline' };
  };

  const renderRequestCard = ({ item }) => {
    const status = item.status?.toUpperCase() || 'PENDING';
    const meta = getStatusMeta(status);
    const customerName = item.customerName || item.customer_name || 'Customer';
    const pickupLocation = item.pickupLocation || item.pickup_location || item.pickupCity || 'N/A';
    const dropLocation = item.dropLocation || item.drop_location || item.dropCity || item.destination;
    const pickupDate = item.pickupDate || item.pickup_date || item.startDate;
    const returnDate = item.returnDate || item.return_date || item.endDate;
    const bookingType = item.bookingType || item.booking_type;
    const packageType = item.packageType || item.package_type;
    const vehicleModelName = item.vehicleModelName || item.vehicle_model_name || item.specificModel || item.specific_model;
    const vehicleBrand = item.vehicleBrand || item.vehicle_brand;
    const vehicleCategoryName = item.vehicleCategoryName || item.vehicle_category_name ||
                                item.vehicleCategory || item.chauffeur_vehicle_categories?.name ||
                                item.chauffeur_vehicle_categories;
    const requestNumber = item.requestNumber || item.request_number || (item.id || item._id)?.toString().slice(-8);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          const requestId = item.id || item._id;
          console.log('🖱️ [LuxuryRequests] Card clicked:', { requestId, itemId: item.id, item_Id: item._id });
          navigation.navigate('LuxuryQuoteRequestDetail', { requestId });
        }}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="car-sports" size={18} color={C.g700} />
            </View>
            <Text style={styles.requestNum}>#{requestNumber}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={12} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color={C.muted} />
          <Text style={styles.infoText}>{customerName}</Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={C.g600} />
          <Text style={styles.locationText} numberOfLines={1}>{pickupLocation}</Text>
          {dropLocation ? (
            <>
              <Icon name="arrow-right" size={12} color={C.muted} />
              <Ionicons name="location" size={14} color={C.red} />
              <Text style={styles.locationText} numberOfLines={1}>{dropLocation}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={C.muted} />
          <Text style={styles.infoText}>
            {formatDate(pickupDate)}{returnDate ? ` – ${formatDate(returnDate)}` : ''}
          </Text>
        </View>

        {/* Booking Type & Package */}
        {(bookingType || packageType) && (
          <View style={styles.badgeRow}>
            {bookingType && (
              <View style={styles.bookingTypeBadge}>
                <Ionicons name="timer-outline" size={11} color={C.blue} />
                <Text style={styles.bookingTypeText}>{bookingType}</Text>
              </View>
            )}
            {packageType && (
              <View style={styles.packageBadge}>
                <Ionicons name="cube-outline" size={11} color={C.purple} />
                <Text style={styles.packageText}>{packageType}</Text>
              </View>
            )}
          </View>
        )}

        {/* Vehicle Information */}
        {(vehicleModelName || vehicleBrand || vehicleCategoryName) ? (
          <View style={styles.vehicleBox}>
            <View style={styles.vehicleIconCircle}>
              <MaterialCommunityIcons name="car-sports" size={22} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleModel} numberOfLines={1}>
                {vehicleModelName || vehicleBrand || 'Luxury Vehicle'}
              </Text>
              <View style={styles.vehicleMeta}>
                {vehicleBrand && vehicleModelName && (
                  <Text style={styles.vehicleBrand}>{vehicleBrand}</Text>
                )}
                {vehicleCategoryName && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{vehicleCategoryName}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={12} color={C.muted} />
            <Text style={styles.footerText}>{formatDate(item.createdAt || item.created_at)}</Text>
          </View>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View</Text>
            <Icon name="arrow-right" size={12} color={C.g600} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="clipboard-outline" size={36} color={C.g500} />
      </View>
      <Text style={styles.emptyTitle}>No Quote Requests</Text>
      <Text style={styles.emptySubtitle}>New luxury car requests from customers will appear here</Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={{ padding: 16 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.card, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ width: 120, height: 16, backgroundColor: '#E2E8F0', borderRadius: 8 }} />
            <View style={{ width: 70, height: 22, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
          </View>
          <View style={{ width: '70%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
          <View style={{ width: '90%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
          <View style={{ width: '55%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6 }} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Quote Requests</Text>
              <Text style={styles.headerSub}>Luxury Cars</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDateFilter(true)}
              style={[styles.backBtn, dateFilter.start && styles.backBtnActive]}
            >
              <Icon name="calendar" size={18} color="#fff" />
              {dateFilter.start ? <View style={styles.filterDot} /> : null}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const active = statusFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                onPress={() => setStatusFilter(key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && { color: meta.color, fontWeight: '700' }]}>
                  {meta.label}
                </Text>
                <View style={[styles.chipCount, active && { backgroundColor: meta.color }]}>
                  <Text style={[styles.chipCountText, active && { color: '#fff' }]}>
                    {statusCounts[key] || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && filteredRequests.length === 0 ? renderSkeleton() : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g500]} tintColor={C.g500} />
          }
          ListFooterComponent={loading && hasMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={C.g500} />
            </View>
          ) : null}
          ListEmptyComponent={renderEmpty}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  headerGrad: {},
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  backBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7, borderRadius: 4, backgroundColor: C.amber,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  filterBar: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: C.sub },
  chipCount: {
    backgroundColor: C.border, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center',
  },
  chipCountText: { fontSize: 10, fontWeight: '700', color: C.sub },

  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
  },
  requestNum: { fontSize: 15, fontWeight: '700', color: C.text },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '600' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  locationText: { fontSize: 13, color: C.sub, flex: 1 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  bookingTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.blueL, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  bookingTypeText: { fontSize: 11, fontWeight: '600', color: C.blue },
  packageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  packageText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },

  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.g50, borderRadius: 10,
    padding: 10, marginVertical: 6,
    borderWidth: 1, borderColor: C.g100,
  },
  vehicleIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
  },
  vehicleModel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 },
  vehicleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  vehicleBrand: { fontSize: 11, fontWeight: '500', color: C.g700 },
  categoryBadge: {
    backgroundColor: C.g600, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  categoryBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: C.muted },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: C.g100,
  },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: C.g700 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
});

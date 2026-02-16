import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequests } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  QUOTES_RECEIVED: '#3B82F6',
  QUOTE_ACCEPTED: '#10B981',
  BOOKING_CONFIRMED: '#10B981',
  CANCELLED: '#EF4444',
  EXPIRED: '#6B7280',
};

export default function BikeQuoteRequestsScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    data: allRequests,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    initialLoad,
    applyDateFilter,
    dateFilter,
    clearDateFilter,
  } = useInfiniteScroll(getQuoteRequests, {
    service: 'bike',
  });

  useEffect(() => {
    console.log('🚀 [BikeRequests] Component mounted, loading initial data...');
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Filter out accepted/confirmed requests - they should only appear in bookings
  const requests = useMemo(() => {
    return allRequests.filter(req => {
      const status = req.status?.toUpperCase();
      return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
    });
  }, [allRequests]);

  // Filter requests based on selected status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'ALL') {
      return requests;
    }
    return requests.filter(req => req.status?.toUpperCase() === statusFilter);
  }, [requests, statusFilter]);

  // Get count for each status
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: requests.length,
      PENDING: 0,
      QUOTES_RECEIVED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    requests.forEach(req => {
      const status = req.status?.toUpperCase();
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    return counts;
  }, [requests]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'time-outline';
      case 'QUOTES_RECEIVED':
        return 'document-text';
      case 'QUOTE_ACCEPTED':
        return 'checkmark-circle';
      case 'BOOKING_CONFIRMED':
        return 'checkmark-done-circle';
      case 'CANCELLED':
        return 'close-circle';
      case 'EXPIRED':
        return 'alert-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const renderRequestCard = ({ item }) => {
    const status = item.status?.toUpperCase() || 'PENDING';
    const statusColor = STATUS_COLORS[status] || '#6B7280';

    const customerName = item.customerName || item.customer_name || 'Customer';
    const pickupLocation = item.pickupLocation || item.pickup_location || item.pickupCity || item.locationName || 'N/A';
    const dropLocation = item.dropLocation || item.drop_location || item.dropCity;
    const pickupDate = item.pickupDate || item.pickup_date || item.startDate;
    const returnDate = item.returnDate || item.return_date || item.endDate;

    // Extract vehicle information
    const vehicleModelName = item.vehicleModelName || item.vehicle_model_name;
    const vehicleBrand = item.vehicleBrand || item.vehicle_brand;
    const vehicleCategoryName = item.vehicleCategoryName || item.vehicle_category_name ||
                                item.vehicleCategory || item.chauffeur_vehicle_categories?.name ||
                                item.chauffeur_vehicle_categories;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          const requestId = item.id || item._id;
          console.log('🖱️ [BikeRequests] Card clicked:', {
            requestId,
            itemId: item.id,
            item_Id: item._id,
            fullItem: JSON.stringify(item, null, 2)
          });
          navigation.navigate('BikeQuoteRequestDetail', { requestId });
        }}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="motorbike" size={24} color={GREEN} />
            <Text style={styles.requestNumber}>
              #{item.requestNumber || item.request_number || (item.id || item._id)?.toString().slice(-8) || 'N/A'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name={getStatusIcon(status)} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.infoRow}>
          <Ionicons name="person-circle-outline" size={18} color="#64748B" />
          <Text style={styles.infoText}>{customerName}</Text>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={16} color={GREEN} />
            <Text style={styles.locationText} numberOfLines={1}>
              {pickupLocation}
            </Text>
          </View>
          {dropLocation && (
            <>
              <Icon name="arrow-right" size={14} color="#94A3B8" />
              <View style={styles.locationItem}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {dropLocation}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Date Range */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>
            {formatDate(pickupDate)}
            {returnDate && ` - ${formatDate(returnDate)}`}
          </Text>
        </View>

        {/* Vehicle Information - Enhanced Display */}
        {(vehicleModelName || vehicleBrand || vehicleCategoryName) && (
          <View style={styles.vehicleSection}>
            <View style={styles.vehicleIconWrapper}>
              <MaterialCommunityIcons name="motorbike" size={24} color="#22C55E" />
            </View>
            <View style={styles.vehicleDetails}>
              {/* Model Name - Primary */}
              {vehicleModelName ? (
                <Text style={styles.vehicleModel} numberOfLines={1}>
                  {vehicleModelName}
                </Text>
              ) : vehicleBrand ? (
                <Text style={styles.vehicleModel} numberOfLines={1}>
                  {vehicleBrand}
                </Text>
              ) : null}

              {/* Brand & Category - Secondary */}
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
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.dateText}>
              Requested: {formatDate(item.createdAt || item.created_at)}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Quote Requests</Text>
      <Text style={styles.emptySubtitle}>
        New quote requests from customers will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quote Requests</Text>
          <Text style={styles.headerSubtitle}>Bike Rental</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowDateFilter(true)}
          style={styles.filterButton}
        >
          <Icon name="calendar" size={20} color={dateFilter.start ? GREEN : '#64748B'} />
          {dateFilter.start && <View style={styles.activeFilterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'ALL', label: 'All', icon: 'apps', color: '#6B7280' },
          { key: 'PENDING', label: 'Pending', icon: 'time-outline', color: STATUS_COLORS.PENDING },
          { key: 'QUOTES_RECEIVED', label: 'Quotes Received', icon: 'document-text', color: STATUS_COLORS.QUOTES_RECEIVED },
          { key: 'CANCELLED', label: 'Cancelled', icon: 'close-circle', color: STATUS_COLORS.CANCELLED },
          { key: 'EXPIRED', label: 'Expired', icon: 'alert-circle', color: STATUS_COLORS.EXPIRED },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              statusFilter === filter.key && styles.filterChipActive,
              statusFilter === filter.key && { borderColor: filter.color, backgroundColor: `${filter.color}15` },
            ]}
            onPress={() => setStatusFilter(filter.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon}
              size={14}
              color={statusFilter === filter.key ? filter.color : '#64748B'}
            />
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter.key && { color: filter.color, fontWeight: '700' },
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterCount,
                statusFilter === filter.key && { backgroundColor: filter.color },
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  statusFilter === filter.key && styles.filterCountTextActive,
                ]}
              >
                {statusCounts[filter.key] || 0}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading && allRequests.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderRequestCard}
          contentContainerStyle={[styles.listContent, filteredRequests.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[GREEN]} />
          }
          ListFooterComponent={loading && hasMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          ) : null}
          ListEmptyComponent={renderEmptyState}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requestNumber: { fontSize: 16, fontWeight: '700', color: DARK },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: { fontSize: 14, color: '#334155', flex: 1 },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: { fontSize: 13, color: '#475569', flex: 1 },

  // Vehicle Information Styles
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  vehicleIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  vehicleBrand: {
    fontSize: 13,
    fontWeight: '500',
    color: '#166534',
  },
  categoryBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#64748B' },

  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    minHeight: 200,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: DARK, marginTop: 12 },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Filter Chips
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 56,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    marginRight: 8,
    height: 32,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterCount: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterCountTextActive: {
    color: '#fff',
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
});

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function EquipmentQuoteRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRequests = useCallback(async () => {
    try {
      const response = await getQuoteRequests('equipment');
      const allRequests = response.quoteRequests || response.requests || response.data || [];
      // Filter out accepted/confirmed requests - they should only appear in bookings
      const filteredRequests = allRequests.filter(req => {
        const status = req.status?.toUpperCase();
        return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
      });
      setRequests(filteredRequests);
    } catch (error) {
      console.error('Error fetching quote requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

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
    const pickupLocation = item.pickupLocation || item.pickup_location || item.pickupCity || 'N/A';
    const dropLocation = item.dropLocation || item.drop_location || item.dropCity;
    const pickupDate = item.pickupDate || item.pickup_date || item.startDate;
    const returnDate = item.returnDate || item.return_date || item.endDate;
    const equipmentType = item.equipmentType || item.equipment_type || item.vehicleType;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EquipmentQuoteRequestDetail', {
          requestId: item.id || item._id
        })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="hammer-wrench" size={24} color={GREEN} />
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

        {/* Bike Type */}
        {equipmentType && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="hammer-wrench" size={16} color="#64748B" />
            <Text style={styles.infoText}>{equipmentType}</Text>
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
      <Ionicons name="clipboard-outline" size={64} color="#CBD5E1" />
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
          <Text style={styles.headerSubtitle}>Equipment Rental</Text>
        </View>
        <View style={{ width: 40 }} />
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
      {loading ? (
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
  listContent: { padding: 16, paddingBottom: 40 },

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
});

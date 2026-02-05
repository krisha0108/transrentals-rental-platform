import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getVendorQuotes } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  SENT: '#3B82F6',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  EXPIRED: '#6B7280',
  WITHDRAWN: '#9CA3AF',
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function PackersMyQuotesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    data: quotes,
    loading,
    refreshing,
    hasMore,
    dateFilter,
    loadMore,
    refresh,
    initialLoad,
    applyDateFilter,
  } = useInfiniteScroll(getVendorQuotes, {
    service: 'packers',
    pageSize: 20,
  });

  useEffect(() => {
    initialLoad();
  }, []);

  const handleDateFilterApply = (startDate, endDate) => {
    applyDateFilter(startDate, endDate);
  };

  const hasActiveFilter = dateFilter.start || dateFilter.end;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'checkmark-circle';
      case 'REJECTED':
        return 'close-circle';
      case 'EXPIRED':
        return 'time';
      case 'PENDING':
      case 'SENT':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  const renderQuoteCard = ({ item }) => {
    const status = item.status || 'PENDING';
    const statusColor = STATUS_COLORS[status] || '#6B7280';

    // Handle nested data structure
    const request = item.request || {};
    const customerName = request.customerName || item.customerName || 'Customer';
    const pickupCity = request.pickupCity || item.pickupCity || 'Location';
    const dropCity = request.dropCity || item.dropCity;
    const totalAmount = item.grandTotal || item.totalAmount || item.quotedAmount || 0;
    const validTill = item.validTill || item.validUntil;
    const requestNumber = request.requestNumber || item.requestNumber;

    return (
      <TouchableOpacity
        style={styles.quoteCard}
        onPress={() => navigation.navigate('PackersQuoteDetail', {
          quoteId: item.id || item._id
        })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteNumber}>
              #{item.quoteNumber || (item.id || item._id)?.toString().slice(-8) || 'N/A'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <Ionicons name={getStatusIcon(status)} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.quoteAmount}>{formatCurrency(totalAmount)}</Text>
        </View>

        {/* Request Reference */}
        {requestNumber && (
          <View style={styles.requestRefRow}>
            <Ionicons name="document-text-outline" size={14} color="#94A3B8" />
            <Text style={styles.requestRefText}>Request #{requestNumber}</Text>
          </View>
        )}

        {/* Customer Info */}
        <View style={styles.customerRow}>
          <Ionicons name="person-circle-outline" size={18} color="#64748B" />
          <Text style={styles.customerName} numberOfLines={1}>
            {customerName}
          </Text>
        </View>

        {/* Vehicle Info */}
        {(item.vehicleName || item.packersType) && (
          <View style={styles.vehicleRow}>
            <Ionicons name="cube" size={16} color="#64748B" />
            <Text style={styles.vehicleText} numberOfLines={1}>
              {item.vehicleName || item.packersType}
              {item.vehicleBrand ? ` (${item.vehicleBrand})` : ''}
            </Text>
          </View>
        )}

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routeItem}>
            <Ionicons name="location" size={16} color={GREEN} />
            <Text style={styles.routeText} numberOfLines={1}>
              {pickupCity}
            </Text>
          </View>
          {dropCity && (
            <>
              <Icon name="arrow-right" size={14} color="#94A3B8" />
              <View style={styles.routeItem}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <Text style={styles.routeText} numberOfLines={1}>
                  {dropCity}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.dateText}>
              Sent: {formatDate(item.createdAt || item.created_at)}
            </Text>
          </View>
          {validTill && (
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.dateText}>
                Valid: {formatDate(validTill)}
              </Text>
            </View>
          )}
        </View>

        {/* Action hint */}
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>Tap to view details</Text>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Quotes Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all'
          ? "You haven't sent any quotes yet"
          : `No ${activeTab} quotes`}
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
          <Text style={styles.headerTitle}>My Quotes</Text>
          <Text style={styles.headerSubtitle}>Packers & Movers</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowDateFilter(true)}
          style={styles.filterButton}
        >
          {hasActiveFilter && <View style={styles.activeFilterDot} />}
          <Icon name="calendar" size={22} color={DARK} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.id && styles.tabActive]}
              onPress={() => setActiveTab(item.id)}
            >
              <Text style={[styles.tabText, activeTab === item.id && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderQuoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[GREEN]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (loading && quotes.length > 0) {
              return (
                <View style={styles.footer}>
                  <ActivityIndicator size="small" color={GREEN} />
                </View>
              );
            }
            return null;
          }}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={handleDateFilterApply}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

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

  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tabsList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BG,
    marginRight: 8
  },
  tabActive: { backgroundColor: GREEN },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },

  quoteCard: {
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
    alignItems: 'flex-start',
    marginBottom: 12
  },
  quoteInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  quoteNumber: { fontSize: 14, fontWeight: '700', color: DARK },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  quoteAmount: { fontSize: 18, fontWeight: '700', color: GREEN, marginLeft: 8 },

  requestRefRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  requestRefText: { fontSize: 12, color: '#94A3B8' },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  customerName: { fontSize: 14, color: '#334155', flex: 1 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  vehicleText: { fontSize: 13, color: '#475569', flex: 1 },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  routeText: { fontSize: 13, color: '#475569', flex: 1 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#64748B' },

  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionHintText: { fontSize: 12, color: '#94A3B8' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center' },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
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
    zIndex: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

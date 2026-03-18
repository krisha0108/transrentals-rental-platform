import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8', blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB', red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED', indigo: '#4F46E5', indigoL: '#EEF2FF',
  teal: '#0D9488', tealL: '#F0FDFA', pink: '#DB2777', pinkL: '#FDF2F8',
  cyan: '#0891B2', cyanL: '#ECFEFF',
};

const STATUS_COLORS = {
  PENDING:   { color: C.amber,  bg: C.amberL },
  SENT:      { color: C.amber,  bg: C.amberL },
  ACCEPTED:  { color: C.g600,   bg: C.g50    },
  REJECTED:  { color: C.red,    bg: C.redL   },
  EXPIRED:   { color: C.muted,  bg: '#F8FAFC'},
  WITHDRAWN: { color: C.muted,  bg: '#F8FAFC'},
};

const TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

const getStatusIcon = (status) => {
  switch (status) {
    case 'ACCEPTED':  return 'checkmark-circle';
    case 'REJECTED':  return 'close-circle';
    case 'EXPIRED':   return 'time';
    case 'PENDING':
    case 'SENT':      return 'hourglass';
    default:          return 'help-circle';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
};

export default function BusMyQuotesScreen({ navigation }) {
  const [activeTab, setActiveTab]       = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    data: quotes, loading, refreshing, hasMore,
    loadMore, refresh, initialLoad, applyDateFilter, dateFilter,
  } = useInfiniteScroll(getVendorQuotes, {
    service: 'bus',
    type: activeTab !== 'all' ? activeTab.toUpperCase() : null,
    filterKey: 'status',
  });

  useEffect(() => { initialLoad(); }, [initialLoad, activeTab]);

  const renderQuoteCard = ({ item }) => {
    const status      = item.status || 'PENDING';
    const sc          = STATUS_COLORS[status] || { color: C.muted, bg: '#F8FAFC' };
    const request     = item.request || {};
    const customerName   = request.customerName  || item.customerName  || 'Customer';
    const pickupCity     = request.pickupCity    || item.pickupCity    || 'Location';
    const dropCity       = request.dropCity      || item.dropCity;
    const totalAmount    = item.grandTotal || item.totalAmount || item.quotedAmount || 0;
    const validTill      = item.validTill  || item.validUntil;
    const requestNumber  = request.requestNumber || item.requestNumber;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BusQuoteDetail', { quoteId: item.id || item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.quoteNumber}>
                #{item.quoteNumber || (item.id || item._id)?.toString().slice(-8) || 'N/A'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Ionicons name={getStatusIcon(status)} size={12} color={sc.color} />
                <Text style={[styles.statusText, { color: sc.color }]}>{status}</Text>
              </View>
            </View>
            <Text style={styles.quoteAmount}>{formatCurrency(totalAmount)}</Text>
          </View>

          {requestNumber && (
            <View style={styles.refRow}>
              <Ionicons name="document-text-outline" size={13} color={C.muted} />
              <Text style={styles.refText}>Request #{requestNumber}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={14} color={C.g700} />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>{customerName}</Text>
          </View>

          {(item.vehicleName || item.busType) && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="bus" size={14} color={C.g700} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.vehicleName || item.busType}
                {item.vehicleBrand ? ` · ${item.vehicleBrand}` : ''}
              </Text>
            </View>
          )}

          <View style={styles.routeRow}>
            <View style={styles.routePin}>
              <View style={[styles.pinDot, { backgroundColor: C.g500 }]} />
              <Text style={styles.routeCity} numberOfLines={1}>{pickupCity}</Text>
            </View>
            {dropCity && (
              <>
                <Icon name="arrow-right" size={12} color={C.muted} style={{ marginHorizontal: 4 }} />
                <View style={styles.routePin}>
                  <View style={[styles.pinDot, { backgroundColor: C.red }]} />
                  <Text style={styles.routeCity} numberOfLines={1}>{dropCity}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.footerDates}>
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={11} color={C.muted} />
                <Text style={styles.dateText}>Sent: {formatDate(item.createdAt || item.created_at)}</Text>
              </View>
              {validTill && (
                <View style={styles.dateChip}>
                  <Ionicons name="time-outline" size={11} color={C.muted} />
                  <Text style={styles.dateText}>Valid: {formatDate(validTill)}</Text>
                </View>
              )}
            </View>
            <View style={styles.arrowCircle}>
              <Icon name="chevron-right" size={14} color={C.g700} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="clipboard-outline" size={44} color={C.g400} />
      </View>
      <Text style={styles.emptyTitle}>No Quotes Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all' ? "You haven't sent any quotes yet" : `No ${activeTab} quotes`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Quotes</Text>
          <Text style={styles.headerSubtitle}>Bus & Tempo</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDateFilter(true)} style={styles.filterBtn}>
          <Icon name="calendar" size={20} color="#fff" />
          {dateFilter.start && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabPill, activeTab === tab.id && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && quotes.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderQuoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g600]} />
          }
          ListFooterComponent={
            loading && hasMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={C.g600} />
              </View>
            ) : null
          }
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
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.g400,
  },

  tabBar: {
    flexDirection: 'row', backgroundColor: C.card,
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabPill: {
    flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: 'center',
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  tabPillActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabLabel:      { fontSize: 13, fontWeight: '600', color: C.sub },
  tabLabelActive: { color: '#fff' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardAccent: { height: 4, backgroundColor: C.g600 },
  cardInner: { padding: 16 },

  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  quoteNumber: { fontSize: 15, fontWeight: '700', color: C.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  quoteAmount: { fontSize: 18, fontWeight: '800', color: C.g700 },

  refRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  refText: { fontSize: 12, color: C.muted },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
  },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },

  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  routePin: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  pinDot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 13, color: C.sub, flex: 1 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerDates: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: C.muted },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
  },

  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center' },
});

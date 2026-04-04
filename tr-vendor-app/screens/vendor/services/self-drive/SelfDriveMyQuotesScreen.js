import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes, withdrawQuote } from '../../../api/client';
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
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const STATUS_CFG = {
  PENDING:   { label: 'Pending',   bg: C.amberL,   text: C.amber,  icon: 'hourglass'     },
  SENT:      { label: 'Sent',      bg: C.blueL,    text: C.blue,   icon: 'send'          },
  ACCEPTED:  { label: 'Accepted',  bg: C.greenL,   text: C.green,  icon: 'checkmark-circle' },
  REJECTED:  { label: 'Rejected',  bg: C.redL,     text: C.red,    icon: 'close-circle'  },
  EXPIRED:   { label: 'Expired',   bg: '#F1F5F9',  text: '#6B7280', icon: 'time'         },
  WITHDRAWN: { label: 'Withdrawn', bg: '#F1F5F9',  text: '#9CA3AF', icon: 'close'        },
};

const TABS = [
  { id: 'all',      label: 'All'              },
  { id: 'active',   label: 'Active'            },
  { id: 'accepted', label: 'Accepted'          },
  { id: 'expired',  label: 'Expired/Rejected'  },
];

// Map tab id → status param sent to API
const TAB_STATUS_MAP = {
  active:   'SENT,VIEWED',
  accepted: 'ACCEPTED',
  expired:  'EXPIRED,REJECTED,WITHDRAWN',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
const fmtAmt  = (v) => v ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v) : '₹0';

export default function SelfDriveMyQuotesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [withdrawingId, setWithdrawingId]   = useState(null);

  const { data: quotes, loading, refreshing, hasMore, loadMore, refresh, initialLoad, applyDateFilter, dateFilter, clearDateFilter } =
    useInfiniteScroll(getVendorQuotes, {
      service: 'self-drive',
      type: TAB_STATUS_MAP[activeTab] || null,
      filterKey: 'status',
    });

  useEffect(() => { initialLoad(); }, [initialLoad, activeTab]);

  const handleWithdraw = (quote) => {
    Alert.alert(
      'Withdraw Quote',
      'Are you sure you want to withdraw this quote? The customer will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              setWithdrawingId(quote.id);
              await withdrawQuote('self-drive', quote.id);
              refresh();
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to withdraw quote');
            } finally {
              setWithdrawingId(null);
            }
          },
        },
      ],
    );
  };

  const renderQuoteCard = ({ item }) => {
    const status = item.status || 'PENDING';
    const sc = STATUS_CFG[status] || { label: status, bg: C.border, text: C.muted, icon: 'help-circle-outline' };
    const request = item.request || {};
    const customerName = request.customerName || item.customerName || 'Customer';
    const pickupCity = request.pickupCity || item.pickupCity || 'Location';
    const dropCity = request.dropCity || item.dropCity;
    const totalAmount = item.grandTotal || item.totalAmount || item.quotedAmount || 0;
    const validTill = item.validTill || item.validUntil;
    const requestNumber = request.requestNumber || item.requestNumber;

    const isActive   = ['SENT', 'VIEWED'].includes(status);
    const canReQuote = status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(request.status);

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('SelfDriveQuoteDetail', { quoteId: item.id || item._id })}
        activeOpacity={0.8}
      >
        {/* Top: number + status + amount */}
        <View style={s.cardTop}>
          <View style={s.cardTopLeft}>
            <View style={s.quoteIconBox}>
              <Ionicons name="document-text" size={16} color={C.g700} />
            </View>
            <View>
              <Text style={s.quoteNum}>#{item.quoteNumber || (item.id || item._id)?.toString().slice(-8) || 'N/A'}</Text>
              {requestNumber && <Text style={s.reqRef}>Req #{requestNumber}</Text>}
            </View>
          </View>
          <View style={s.cardTopRight}>
            <Text style={s.amt}>{fmtAmt(totalAmount)}</Text>
            <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
              <Ionicons name={sc.icon} size={11} color={sc.text} />
              <Text style={[s.statusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>
        </View>

        {/* Info rows */}
        <View style={s.cardBody}>
          <View style={s.infoRow}>
            <Ionicons name="person-circle-outline" size={16} color={C.muted} />
            <Text style={s.infoText} numberOfLines={1}>{customerName}</Text>
          </View>

          {(item.vehicleName || item.selfDriveType) && (
            <View style={s.infoRow}>
              <MaterialCommunityIcons name="car" size={15} color={C.muted} />
              <Text style={s.infoText} numberOfLines={1}>
                {item.vehicleName || item.selfDriveType}{item.vehicleBrand ? ` (${item.vehicleBrand})` : ''}
              </Text>
            </View>
          )}

          <View style={s.routeRow}>
            <Ionicons name="location" size={14} color={C.green} />
            <Text style={s.routeText} numberOfLines={1}>{pickupCity}</Text>
            {dropCity && (
              <>
                <Icon name="arrow-right" size={12} color={C.muted} style={{ marginHorizontal: 4 }} />
                <Ionicons name="location" size={14} color={C.red} />
                <Text style={s.routeText} numberOfLines={1}>{dropCity}</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.cardFooter}>
          <View style={s.footerLeft}>
            <Ionicons name="calendar-outline" size={13} color={C.muted} />
            <Text style={s.footerDate}>Sent: {fmtDate(item.createdAt || item.created_at)}</Text>
          </View>
          {validTill && (
            <View style={s.footerLeft}>
              <Ionicons name="time-outline" size={13} color={C.muted} />
              <Text style={s.footerDate}>Valid: {fmtDate(validTill)}</Text>
            </View>
          )}
          <View style={s.footerArrow}>
            <Icon name="chevron-right" size={14} color={C.g700} />
          </View>
        </View>

        {/* Action buttons */}
        {(isActive || canReQuote) && (
          <View style={s.cardActions}>
            {isActive && (
              <TouchableOpacity
                style={s.withdrawBtn}
                onPress={(e) => { e.stopPropagation?.(); handleWithdraw(item); }}
                disabled={withdrawingId === item.id}
                activeOpacity={0.7}
              >
                {withdrawingId === item.id ? (
                  <ActivityIndicator size="small" color={C.red} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={14} color={C.red} />
                    <Text style={s.withdrawBtnText}>Withdraw</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canReQuote && (
              <TouchableOpacity
                style={s.freshQuoteBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  navigation.navigate('SelfDriveSendQuote', {
                    requestId: request.id || item.requestId,
                    prefillQuoteId: item.id,
                  });
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={14} color={C.g700} />
                <Text style={s.freshQuoteBtnText}>Send Fresh Quote</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
            <Ionicons name="document-text-outline" size={18} color={C.g400} />
            <View>
              <Text style={s.headerTitle}>My Quotes</Text>
              <Text style={s.headerSub}>Self Drive</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowDateFilter(true)} style={s.filterIconBtn}>
            <Icon name="calendar" size={18} color={dateFilter.start ? '#FFD700' : 'rgba(255,255,255,0.8)'} />
            {dateFilter.start && <View style={s.filterActiveDot} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tab, activeTab === tab.id && s.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && quotes.length === 0 ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={s.loadingText}>Loading quotes...</Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderQuoteCard}
          contentContainerStyle={[s.list, quotes.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g500]} tintColor={C.g500} />}
          ListFooterComponent={loading && hasMore ? <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color={C.g500} /></View> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="document-text-outline" size={36} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>No Quotes Found</Text>
              <Text style={s.emptySub}>
                {activeTab === 'all'      ? "You haven't sent any quotes yet"
                 : activeTab === 'active'   ? 'No active quotes'
                 : activeTab === 'accepted' ? 'No accepted quotes'
                 : 'No expired or rejected quotes'}
              </Text>
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

  // Tabs
  tabsBar: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabText: { fontSize: 13, fontWeight: '600', color: C.sub },
  tabTextActive: { color: '#fff' },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: C.muted },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  quoteIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  quoteNum: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2 },
  reqRef: { fontSize: 11, color: C.muted },
  cardTopRight: { alignItems: 'flex-end', gap: 6 },
  amt: { fontSize: 17, fontWeight: '800', color: C.g700 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },

  cardBody: { paddingHorizontal: 14, paddingBottom: 10, gap: 7 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  routeText: { fontSize: 13, color: C.sub, flex: 1, maxWidth: 120 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  footerDate: { fontSize: 11, color: C.muted },
  footerArrow: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },

  /* Card action buttons */
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.redL,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  withdrawBtnText: { fontSize: 13, fontWeight: '600', color: C.red },
  freshQuoteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g100,
  },
  freshQuoteBtnText: { fontSize: 13, fontWeight: '600', color: C.g700 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 72 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },
});

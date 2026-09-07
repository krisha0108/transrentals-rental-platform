import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes, withdrawQuote } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';
import { SC as T, G, rs, shade, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border, glassBorder: T.glassBorder,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight, gold: T.gold, goldLight: T.goldLight,
  red: T.red, redL: T.redLight,
};

const STATUS_COLORS = {
  PENDING:   { color: C.amber,  bg: C.amberL },
  SENT:      { color: C.amber,  bg: C.amberL },
  ACCEPTED:  { color: C.g600,   bg: C.g50    },
  REJECTED:  { color: C.red,    bg: C.redL   },
  EXPIRED:   { color: C.muted,  bg: '#F8FAFC'},
  WITHDRAWN: { color: C.muted,  bg: '#F8FAFC'},
};

// Accent-rail gradients — purely decorative, one per status, echoing
// STATUS_COLORS so the card edge gives an instant read before the eye
// even reaches the status pill.
const STATUS_RAIL = {
  PENDING:   [C.goldLight, C.gold],
  SENT:      [C.goldLight, C.gold],
  ACCEPTED:  [C.g500, C.g700],
  REJECTED:  [C.red, shade(C.red, -25)],
  EXPIRED:   ['#C7CDC9', C.muted],
  WITHDRAWN: ['#C7CDC9', C.muted],
};

const TABS = [
  { id: 'all',      label: 'All',              icon: 'sparkles-outline' },
  { id: 'active',   label: 'Active',           icon: 'hourglass-outline' },
  { id: 'accepted', label: 'Accepted',         icon: 'checkmark-circle-outline' },
  { id: 'expired',  label: 'Expired/Rejected', icon: 'close-circle-outline' },
];

// Map tab id → status param sent to API
const TAB_STATUS_MAP = {
  active:   'SENT,VIEWED',
  accepted: 'ACCEPTED',
  expired:  'EXPIRED,REJECTED,WITHDRAWN',
};

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

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
};

export default function PackersMyQuotesScreen({ navigation }) {
  const [activeTab, setActiveTab]           = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [withdrawingId, setWithdrawingId]   = useState(null);

  const {
    data: quotes, loading, refreshing, hasMore,
    loadMore, refresh, initialLoad, applyDateFilter, dateFilter,
    clearDateFilter,
  } = useInfiniteScroll(getVendorQuotes, {
    service: 'packers',
    pageSize: 20,
    type: TAB_STATUS_MAP[activeTab] || null,
    filterKey: 'status',
  });

  useEffect(() => { initialLoad(); }, [activeTab, initialLoad]);

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
              await withdrawQuote('packers', quote.id);
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

  /* ── Quote card ──────────────────────────────────────────── */
  const renderQuoteCard = ({ item }) => {
    const status      = item.status || 'PENDING';
    const sc          = STATUS_COLORS[status] || { color: C.muted, bg: '#F8FAFC' };
    const rail        = STATUS_RAIL[status] || ['#C7CDC9', C.muted];
    const request     = item.request || {};
    const customerName   = request.customerName  || item.customerName  || 'Customer';
    const pickupCity     = request.pickupCity    || item.pickupCity    || 'Location';
    const dropCity       = request.dropCity      || item.dropCity;
    const totalAmount    = item.grandTotal || item.totalAmount || item.quotedAmount || 0;
    const validTill      = item.validTill  || item.validUntil;
    const requestNumber  = request.requestNumber || item.requestNumber;

    const isActive   = ['SENT', 'VIEWED'].includes(status);
    const canReQuote = status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(request.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PackersQuoteDetail', { quoteId: item.id || item._id })}
        activeOpacity={0.88}
      >
        {/* Status-tinted top edge — reads before the eye reaches the pill */}
        <LinearGradient colors={rail} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ticketTopStrip} />

        {/* ── Upper stub ── */}
        <View style={styles.ticketUpper}>
          <View style={styles.cardTopRow}>
            <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
              <Ionicons name="cube" size={rs(13)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.quoteNumber} numberOfLines={1}>
                #{item.quoteNumber || (item.id || item._id)?.toString().slice(-8) || 'N/A'}
              </Text>
              {!!requestNumber && (
                <Text style={styles.refText} numberOfLines={1}>Request #{requestNumber}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Ionicons name={getStatusIcon(status)} size={rs(10)} color={sc.color} />
              <Text style={[styles.statusText, { color: sc.color }]}>{status}</Text>
            </View>
          </View>

          {/* Customer — primary title */}
          <Text style={styles.cardName} numberOfLines={1}>{customerName}</Text>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routePin}>
              <View style={[styles.pinDot, { backgroundColor: C.g500 }]} />
              <Text style={styles.routeCity} numberOfLines={1}>{pickupCity}</Text>
            </View>
            {!!dropCity && (
              <>
                <Ionicons name="arrow-forward" size={rs(11)} color={C.muted} style={{ marginHorizontal: rs(4) }} />
                <View style={styles.routePin}>
                  <View style={[styles.pinDot, { backgroundColor: C.red }]} />
                  <Text style={styles.routeCity} numberOfLines={1}>{dropCity}</Text>
                </View>
              </>
            )}
          </View>

          {/* Meta row — vehicle/truck + sent date */}
          <View style={styles.cardMetaRow}>
            {(!!item.vehicleName || !!item.packersType) && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="truck-moving" size={rs(12)} color={C.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.vehicleName || item.packersType}{item.vehicleBrand ? ` · ${item.vehicleBrand}` : ''}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={rs(11)} color={C.muted} />
              <Text style={styles.metaText}>Sent {formatDate(item.createdAt || item.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* ── Perforation — torn-ticket edge ── */}
        <View style={styles.perforationRow}>
          <View style={styles.notchLeft} />
          <View style={styles.dashLine} />
          <View style={styles.notchRight} />
        </View>

        {/* ── Lower stub ── */}
        <View style={styles.ticketLower}>
          <View style={styles.moneyTopRow}>
            <View style={styles.moneyIcoWrap}>
              <Ionicons name="pricetag" size={rs(11)} color={C.g700} />
            </View>
            <Text style={styles.quoteAmount} numberOfLines={1}>{formatCurrency(totalAmount)}</Text>
            {!!validTill && (
              <View style={styles.validPill}>
                <Ionicons name="time-outline" size={rs(9)} color={C.amber} />
                <Text style={styles.validPillText} numberOfLines={1}>Valid {formatDate(validTill)}</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          {(isActive || canReQuote) && (
            <View style={styles.cardActions}>
              {isActive && (
                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={(e) => { e.stopPropagation?.(); handleWithdraw(item); }}
                  disabled={withdrawingId === item.id}
                  activeOpacity={0.7}
                >
                  {withdrawingId === item.id ? (
                    <ActivityIndicator size="small" color={C.red} />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={rs(12)} color={C.red} />
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {canReQuote && (
                <TouchableOpacity
                  style={styles.freshQuoteBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    navigation.navigate('PackersSendQuote', {
                      requestId: request.id || item.requestId,
                      prefillQuoteId: item.id,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={rs(12)} color={C.g700} />
                  <Text style={styles.freshQuoteBtnText}>Send Fresh Quote</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Empty state ─────────────────────────────────────────── */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtCardBack} />
        <View style={styles.emptyArtCard}>
          <Ionicons name="clipboard-outline" size={rs(40)} color={C.g500} />
        </View>
        <View style={styles.emptyArtDot} />
        <View style={styles.emptyArtTag}>
          <Text style={styles.emptyArtTagTxt}>QUOTES</Text>
        </View>
      </View>
      <Text style={styles.emptyTitle}>No Quotes Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all'      ? "You haven't sent any quotes yet"
         : activeTab === 'active'   ? 'No active quotes'
         : activeTab === 'accepted' ? 'No accepted quotes'
         : 'No expired or rejected quotes'}
      </Text>
    </View>
  );

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Hero header */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: rs(16) }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.headerEyebrow}>SUBMITTED QUOTES</Text>
              <Text style={styles.headerTitle}>My Quotes</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDateFilter(true)}
              style={styles.filterBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="calendar-outline" size={rs(19)} color="#fff" />
              {!!dateFilter.start && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Floating tab pills — tucks into the hero's bottom curve, kept
          outside the FlatList so switching tabs never resets scroll. */}
      <View style={styles.tabFloatWrap}>
        <View style={styles.tabCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabPill, active && styles.tabPillActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={tab.icon} size={rs(13)} color={active ? '#fff' : C.sub} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      {(loading || refreshing) && quotes.length === 0 ? (
        <View style={styles.listContent}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.card}>
              <View style={[styles.ticketTopStrip, { backgroundColor: '#DDE4EE' }]} />
              <View style={styles.ticketUpper}>
                <View style={styles.cardTopRow}>
                  <Bone w={rs(26)} h={rs(26)} r={rs(8)} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Bone w={100} h={13} />
                  </View>
                  <Bone w={70} h={18} r={999} />
                </View>
                <Bone w={130} h={14} style={{ marginTop: 8, marginBottom: 8 }} />
                <View style={styles.routeRow}>
                  <Bone w={70} h={11} />
                  <Bone w={16} h={11} style={{ marginHorizontal: rs(4) }} />
                  <Bone w={70} h={11} />
                </View>
              </View>
              <View style={styles.perforationRow}>
                <View style={styles.notchLeft} />
                <View style={styles.dashLine} />
                <View style={styles.notchRight} />
              </View>
              <View style={styles.ticketLower}>
                <View style={styles.moneyTopRow}>
                  <View style={styles.moneyIcoWrap} />
                  <Bone w={90} h={16} style={{ marginLeft: 6 }} />
                </View>
              </View>
            </View>
          ))}
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
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g600]} tintColor={C.g600} />
          }
          ListFooterComponent={
            loading && hasMore ? (
              <View style={{ paddingVertical: rs(20) }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  /* Hero header */
  header: {
    paddingBottom: rs(8),
    overflow: 'hidden',
    borderBottomLeftRadius: rs(24),
    borderBottomRightRadius: rs(24),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(10) },
  titleWrap: { alignItems: 'center', justifyContent: 'center', minHeight: rs(40) },
  backBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterDot: {
    position: 'absolute', top: rs(8), right: rs(8),
    width: rs(8), height: rs(8), borderRadius: rs(4),
    backgroundColor: C.g400,
  },
  headerEyebrow: {
    fontFamily: DISPLAY,
    fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '700',
    letterSpacing: 1.2, marginBottom: 2,
  },
  headerTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  /* Floating tab pills */
  tabFloatWrap: { marginHorizontal: rs(16), marginTop: rs(14) },
  tabCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingVertical: rs(8),
    ...cardShadow,
  },
  tabScroll: { paddingHorizontal: rs(8), paddingRight: rs(16), gap: rs(8), flexDirection: 'row', alignItems: 'center' },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5), flexShrink: 0,
    paddingVertical: rs(8), paddingHorizontal: rs(14), borderRadius: rs(20),
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  tabPillActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabLabel: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '600', color: C.sub, flexShrink: 0 },
  tabLabelActive: { color: '#fff' },

  listContent: { padding: rs(16), paddingTop: rs(16), paddingBottom: rs(40) },

  /* Card — ticket / boarding-pass silhouette */
  card: {
    backgroundColor: C.card,
    borderRadius: rs(14),
    marginBottom: rs(14),
    borderWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
    ...cardShadow,
  },
  ticketTopStrip: { height: rs(3), width: '100%' },
  ticketUpper: { padding: rs(11), paddingBottom: rs(9) },
  ticketLower: { padding: rs(11), paddingTop: rs(9) },

  /* Perforation row — two bg-colored "notches" clipped by the card's
     overflow:hidden create the classic torn-ticket cutout illusion. */
  perforationRow: { height: rs(2), justifyContent: 'center' },
  dashLine: {
    marginHorizontal: rs(16),
    borderTopWidth: 1, borderColor: C.border, borderStyle: 'dashed',
  },
  notchLeft: {
    position: 'absolute', left: -rs(9), top: -rs(8),
    width: rs(18), height: rs(18), borderRadius: rs(9),
    backgroundColor: C.bg,
  },
  notchRight: {
    position: 'absolute', right: -rs(9), top: -rs(8),
    width: rs(18), height: rs(18), borderRadius: rs(9),
    backgroundColor: C.bg,
  },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(6) },
  iconBox: {
    width: rs(26), height: rs(26), borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
  },
  quoteNumber: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '700', color: C.text },
  refText: { fontFamily: DISPLAY, fontSize: 11, color: C.muted, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(7), paddingVertical: rs(2.5),
    borderRadius: rs(8), gap: rs(3),
  },
  statusText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: '700' },

  cardName: { fontFamily: DISPLAY, fontSize: 14.5, color: C.text, letterSpacing: 0.1, marginBottom: rs(4) },

  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(6) },
  routePin: { flexDirection: 'row', alignItems: 'center', gap: rs(4), flex: 1 },
  pinDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  routeCity: { fontFamily: DISPLAY, fontSize: 12.5, color: C.sub, flex: 1 },

  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: rs(7) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  metaText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.sub, fontWeight: '600' },

  /* Money row */
  moneyTopRow: { flexDirection: 'row', alignItems: 'center', gap: rs(7) },
  moneyIcoWrap: {
    width: rs(22), height: rs(22), borderRadius: rs(7),
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
  },
  quoteAmount: { fontFamily: DISPLAY, fontSize: 16.5, fontWeight: '800', color: C.g700, flexShrink: 1 },
  validPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    paddingHorizontal: rs(7), paddingVertical: rs(2.5), borderRadius: rs(8),
    backgroundColor: C.amberL, marginLeft: 'auto',
  },
  validPillText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: '700', color: C.amber },

  /* Card action buttons */
  cardActions: {
    flexDirection: 'row',
    gap: rs(7),
    marginTop: rs(7),
    paddingTop: rs(7),
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    paddingVertical: rs(6.5),
    borderRadius: rs(9),
    backgroundColor: C.redL,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  withdrawBtnText: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: '600', color: C.red },
  freshQuoteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    paddingVertical: rs(6.5),
    borderRadius: rs(9),
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g100,
  },
  freshQuoteBtnText: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: '600', color: C.g700 },

  /* Empty state */
  emptyState: { alignItems: 'center', paddingVertical: rs(50), paddingHorizontal: rs(24) },
  emptyArt: {
    width: rs(150), height: rs(114), marginBottom: rs(18),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(12), right: rs(22),
    width: rs(92), height: rs(66), borderRadius: rs(14),
    backgroundColor: C.g100, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(92), height: rs(80), borderRadius: rs(16),
    backgroundColor: '#F1F6F3', borderWidth: 1, borderColor: C.g100,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(4), right: rs(18),
    width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.g500,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(8), left: rs(4),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g100,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: 8.5, fontWeight: '700', color: C.g700, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontFamily: DISPLAY, fontSize: 14, color: C.muted, textAlign: 'center' },
});

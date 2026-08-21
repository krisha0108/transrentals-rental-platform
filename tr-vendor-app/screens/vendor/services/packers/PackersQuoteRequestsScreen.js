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
import { SC as T, G, TONES, rs, rf, GUT, cardShadow, shade } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex. Spread T first so the
// new TA-pattern styles (ink/forest/emeraldDeep/glassBorder/tintEmerald/…)
// are also available under their canonical names.
const C = {
  ...T,
  g900: T.forestDark, g800: T.forest, g700: T.emerald600, g600: T.emerald600,
  g500: T.emerald500, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight,
  blue: T.blue, blueL: T.blueLight,
  red: T.red, redL: T.redLight,
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

export default function PackersQuoteRequestsScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    data: requests, loading, refreshing, hasMore,
    dateFilter, loadMore, refresh, initialLoad, applyDateFilter,
  } = useInfiniteScroll(getQuoteRequests, {
    service: 'packers',
    pageSize: 20,
  });

  useEffect(() => {
    initialLoad();
  }, []);

  // Filter requests based on selected status
  const filteredRequests = useMemo(() => {
    const filtered = requests.filter(req => {
      const status = req.status?.toUpperCase();
      return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
    });

    if (statusFilter === 'ALL') {
      return filtered;
    }
    return filtered.filter(req => req.status?.toUpperCase() === statusFilter);
  }, [requests, statusFilter]);

  // Get count for each status
  const statusCounts = useMemo(() => {
    const filtered = requests.filter(req => {
      const status = req.status?.toUpperCase();
      return status !== 'QUOTE_ACCEPTED' && status !== 'BOOKING_CONFIRMED';
    });

    const counts = { ALL: filtered.length, PENDING: 0, QUOTES_RECEIVED: 0, CANCELLED: 0, EXPIRED: 0 };
    filtered.forEach(req => {
      const status = req.status?.toUpperCase();
      if (counts.hasOwnProperty(status)) counts[status]++;
    });
    return counts;
  }, [requests]);

  const handleDateFilterApply = (startDate, endDate) => {
    applyDateFilter(startDate, endDate);
  };

  const hasActiveFilter = dateFilter.start || dateFilter.end;

  const getStatusMeta = (status) => {
    const key = status?.toUpperCase();
    return STATUS_META[key] || { label: status, color: C.muted, bg: '#F8FAFC', icon: 'help-circle-outline' };
  };

  // Derived only — no new state. Powers the richer empty-state copy.
  const isFiltered = statusFilter !== 'ALL' || hasActiveFilter;

  const renderRequestCard = ({ item }) => {
    const status = item.status?.toUpperCase() || 'PENDING';
    const meta = getStatusMeta(status);
    const customerName = item.customerName || item.customer_name || 'Customer';
    const fromAddress = item.fromAddress || item.from_address || item.pickupLocation || item.pickup_location || item.pickupCity || 'N/A';
    const toAddress = item.toAddress || item.to_address || item.dropLocation || item.drop_location || item.dropCity;
    const movingDate = item.movingDate || item.moving_date || item.pickupDate || item.pickup_date || item.startDate;
    const shiftingType = item.shiftingType || item.shifting_type;
    const specificType = item.specificType || item.specific_type;
    const requestNumber = item.requestNumber || item.request_number || (item.id || item._id)?.toString().slice(-8);
    const railColors = [meta.color, shade(meta.color, -18)];

    return (
      <TouchableOpacity
        style={[styles.card, cardShadow]}
        onPress={() => {
          const requestId = item.id || item._id;
          console.log('🖱️ [PackersRequests] Card clicked:', { requestId, itemId: item.id, item_Id: item._id });
          navigation.navigate('PackersQuoteRequestDetail', { requestId });
        }}
        activeOpacity={0.85}
      >
        {/* Tonal accent rail — quick status recognition down the card edge */}
        <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cardRail} />

        <View style={styles.cardInner}>
          {/* Top: move icon + request number + status */}
          <View style={styles.cardTopStripe}>
            <LinearGradient colors={TONES.plum.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
              <MaterialCommunityIcons name="package-variant" size={rs(13)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.typeLabel}>PACKERS REQUEST</Text>
              <Text style={styles.requestNum} numberOfLines={1}>#{requestNumber}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={rs(10)} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Customer */}
          <Text style={styles.cardName} numberOfLines={1}>{customerName}</Text>

          {/* Route */}
          <View style={styles.metaItem}>
            <Ionicons name="location" size={rs(10.5)} color={C.emeraldDeep} />
            <Text style={styles.metaText} numberOfLines={1}>{fromAddress}</Text>
            {toAddress ? (
              <>
                <Icon name="arrow-right" size={rs(10)} color={C.muted} />
                <Ionicons name="location" size={rs(10.5)} color={C.red} />
                <Text style={styles.metaText} numberOfLines={1}>{toAddress}</Text>
              </>
            ) : null}
          </View>

          {/* Moving date */}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={rs(10.5)} color={C.muted} />
            <Text style={styles.metaText}>{formatDate(movingDate)}</Text>
          </View>

          {/* Move-type section */}
          {(shiftingType || specificType) ? (
            <View style={styles.moveBox}>
              <MaterialCommunityIcons
                name={shiftingType?.toLowerCase() === 'office' ? 'office-building' : 'home'}
                size={rs(15)}
                color={C.plum}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                {shiftingType ? (
                  <Text style={styles.moveType} numberOfLines={1}>
                    {shiftingType.charAt(0).toUpperCase() + shiftingType.slice(1)} Shifting
                  </Text>
                ) : null}
                {specificType ? (
                  <View style={styles.specificBadge}>
                    <Text style={styles.specificBadgeText}>{specificType}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <Ionicons name="time-outline" size={rs(10)} color={C.muted} />
              <Text style={styles.footerText}>{formatDate(item.createdAt || item.created_at)}</Text>
            </View>
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>View</Text>
              <Icon name="arrow-right" size={rs(10)} color={C.emeraldDeep} />
            </View>
          </View>

          {/* Quote action buttons */}
          <View style={styles.quoteActions}>
            {!item.hasQuoted ? (
              <TouchableOpacity
                style={styles.sendQuoteBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  navigation.navigate('PackersSendQuote', { requestId: item.id || item._id });
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="send-outline" size={rs(12)} color="#fff" />
                <Text style={styles.sendQuoteBtnText}>Send Quote</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.viewQuoteBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    navigation.navigate('PackersQuoteDetail', { quoteId: item.myQuote?.id });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={rs(12)} color={C.g700} />
                  <Text style={styles.viewQuoteBtnText}>View Your Quote</Text>
                </TouchableOpacity>
                {item.myQuote?.status === 'EXPIRED' && status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.resubmitBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      navigation.navigate('PackersSendQuote', {
                        requestId: item.id || item._id,
                        prefillQuoteId: item.myQuote?.id,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={rs(12)} color="#fff" />
                    <Text style={styles.resubmitBtnText}>Resubmit Quote</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.empty, styles.emptyCardWrap]}>
      {/* Illustrated inbox composition */}
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtCardBack} />
        <View style={styles.emptyArtCard}>
          <Ionicons name={isFiltered ? 'search' : 'cube-outline'} size={rs(40)} color={C.g500} />
        </View>
        <View style={styles.emptyArtDot} />
        <View style={styles.emptyArtTag}>
          <Text style={styles.emptyArtTagTxt}>{isFiltered ? 'NO MATCH' : 'INBOX'}</Text>
        </View>
      </View>

      <Text style={styles.emptyTitle}>{isFiltered ? 'No Matching Requests' : 'No Quote Requests'}</Text>
      <Text style={styles.emptySubtitle}>
        {isFiltered
          ? 'Try a different status tab or clear the date filter.'
          : 'New packers requests from customers will appear here'}
      </Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={{ padding: rs(16) }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.card, { marginBottom: rs(12), flexDirection: 'column' }]}>
          <View style={{ padding: rs(14) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ width: 120, height: 16, backgroundColor: '#E2E8F0', borderRadius: 8 }} />
              <View style={{ width: 70, height: 22, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
            </View>
            <View style={{ width: '70%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
            <View style={{ width: '90%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
            <View style={{ width: '55%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ── */}
      <LinearGradient colors={G.hero} style={styles.headerGrad}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => setShowDateFilter(true)}
              style={[styles.filterCircle, hasActiveFilter && styles.filterCircleActive]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="calendar" size={rs(18)} color="#fff" />
              {hasActiveFilter ? <View style={styles.filterDot} /> : null}
            </TouchableOpacity>
          </View>

          <Text style={styles.headerEyebrow}>REQUEST INBOX</Text>
          <Text style={styles.bigTitle}>Quote Requests</Text>
          <Text style={styles.bigSub}>Packers &amp; Movers enquiries waiting for your response.</Text>

          {/* spacer so the floating summary card can tuck into the curve */}
          <View style={{ height: rs(28) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating summary — tucks into the hero's bottom curve */}
      <View style={styles.summaryWrap}>
        <View style={[styles.summaryCard, cardShadow]}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIco, { backgroundColor: C.tintEmerald }]}>
              <Ionicons name="albums-outline" size={rs(14)} color={C.emeraldDeep} />
            </View>
            <View style={{ minWidth: 0 }}>
              <Text style={styles.summaryLabel}>TOTAL</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{statusCounts.ALL}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View style={[styles.summaryIco, { backgroundColor: C.amberL }]}>
              <Ionicons name="time-outline" size={rs(14)} color={C.amber} />
            </View>
            <View style={{ minWidth: 0 }}>
              <Text style={styles.summaryLabel}>PENDING</Text>
              <Text style={[styles.summaryValue, { color: C.amber }]} numberOfLines={1}>{statusCounts.PENDING}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View style={[styles.summaryIco, { backgroundColor: C.blueL }]}>
              <Ionicons name="document-text-outline" size={rs(14)} color={C.blue} />
            </View>
            <View style={{ minWidth: 0 }}>
              <Text style={styles.summaryLabel}>QUOTED</Text>
              <Text style={[styles.summaryValue, { color: C.blue }]} numberOfLines={1}>{statusCounts.QUOTES_RECEIVED}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Fixed status filter chips — kept OUTSIDE the FlatList so tapping a
          filter doesn't reset the horizontal scroll position. */}
      <View style={styles.filtersFixed}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const active = statusFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
                onPress={() => setStatusFilter(key)}
                activeOpacity={0.8}
              >
                <Ionicons name={meta.icon} size={rs(13)} color={active ? '#fff' : meta.color} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{meta.label}</Text>
                <View style={[styles.chipCount, !active && { backgroundColor: meta.bg }, active && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, !active && { color: meta.color }, active && styles.chipCountTextActive]}>
                    {statusCounts[key] || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? renderSkeleton() : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => (item.id || item._id)?.toString() || Math.random().toString()}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g500]} tintColor={C.g500} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (loading && filteredRequests.length > 0) {
              return (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={C.g500} />
                </View>
              );
            }
            return null;
          }}
          ListEmptyComponent={renderEmpty}
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={handleDateFilterApply}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Hero header ──
  headerGrad: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
  },
  orbA: {
    position: 'absolute', top: -rs(50), right: -rs(30),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(4), marginBottom: rs(10) },
  backCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterCircleActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterDot: {
    position: 'absolute', top: rs(7), right: rs(7),
    width: rs(7), height: rs(7), borderRadius: rs(4), backgroundColor: C.amber,
  },
  headerEyebrow: {
    fontSize: rf(10), color: 'rgba(255,255,255,0.65)', fontWeight: '700',
    letterSpacing: 1.2, fontFamily: DISPLAY, marginBottom: rs(2),
  },
  bigTitle: { fontFamily: DISPLAY, fontSize: rf(26), color: '#fff', letterSpacing: 0.2, fontWeight: '700' },
  bigSub: { fontFamily: DISPLAY, fontSize: rf(12), color: 'rgba(255,255,255,0.72)', fontWeight: '600', marginTop: rs(4) },

  // Floating summary card — tucks into the hero's bottom curve.
  summaryWrap: { marginHorizontal: GUT, marginTop: -rs(24) },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(18),
    paddingHorizontal: rs(12), paddingVertical: rs(13),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(8), minWidth: 0 },
  summaryIco: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: 'center', justifyContent: 'center',
  },
  summaryLabel: { fontFamily: DISPLAY, fontSize: rf(8.5), color: C.muted, fontWeight: 'bold', letterSpacing: 0.6 },
  summaryValue: { fontFamily: DISPLAY, fontSize: rf(15), color: C.emeraldDeep, marginTop: rs(1), fontWeight: '700' },
  summaryDivider: { width: 1, height: rs(28), backgroundColor: C.border, marginHorizontal: rs(6) },

  // Fixed filter chips
  filtersFixed: { flexShrink: 0, marginTop: rs(6) },
  filterScroll: { paddingHorizontal: GUT, paddingVertical: rs(10), gap: rs(8) },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    paddingHorizontal: rs(13), paddingVertical: rs(8),
    borderRadius: 999, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
  },
  chipText: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: '600', color: C.sub },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  chipCount: {
    backgroundColor: C.border, borderRadius: rs(8),
    paddingHorizontal: rs(6), paddingVertical: rs(1), minWidth: rs(20), alignItems: 'center',
  },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  chipCountText: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '700', color: C.sub },
  chipCountTextActive: { color: '#fff' },

  listContent: { paddingHorizontal: GUT, paddingTop: rs(4), paddingBottom: rs(100) },

  // ── Card ──
  card: {
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.glassBorder,
    marginBottom: rs(10),
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardRail: { width: rs(3) },
  cardInner: { flex: 1, padding: rs(10), minWidth: 0 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(6) },
  iconBox: {
    width: rs(26), height: rs(26), borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: { fontFamily: DISPLAY, fontSize: rf(8), fontWeight: '700', letterSpacing: 0.8, color: C.plum },
  requestNum: {
    fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: '700', color: C.text,
    marginTop: rs(1), fontVariant: ['tabular-nums'],
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: 999,
  },
  statusText: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: '700' },

  cardName: { fontFamily: DISPLAY, fontSize: rf(14), color: C.ink, fontWeight: '700', marginBottom: rs(4) },

  metaItem: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginBottom: rs(5) },
  metaText: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.sub, flexShrink: 1 },

  moveBox: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: C.tintPlum, borderRadius: rs(9),
    padding: rs(8), marginVertical: rs(3),
    borderWidth: 1, borderColor: C.plumLight,
  },
  moveType: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: '700', color: C.text },
  specificBadge: {
    backgroundColor: C.plum, paddingHorizontal: rs(6), paddingVertical: rs(2),
    borderRadius: rs(6), alignSelf: 'flex-start', marginTop: rs(1),
  },
  specificBadgeText: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: rs(6), paddingTop: rs(6), borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  footerText: { fontFamily: DISPLAY, fontSize: rf(9.5), color: C.muted },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.g50, paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderRadius: rs(7), borderWidth: 1, borderColor: C.g100,
  },
  viewBtnText: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: '700', color: C.g700 },

  quoteActions: {
    flexDirection: 'row',
    gap: rs(6),
    marginTop: rs(7),
    paddingTop: rs(7),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sendQuoteBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingVertical: rs(7), borderRadius: rs(9),
    backgroundColor: C.amber,
  },
  sendQuoteBtnText: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: '700', color: '#fff' },
  viewQuoteBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingVertical: rs(7), borderRadius: rs(9),
    backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#D1FAE5',
  },
  viewQuoteBtnText: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: '600', color: C.g700 },
  resubmitBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingVertical: rs(7), borderRadius: rs(9),
    backgroundColor: '#EA580C',
  },
  resubmitBtnText: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: '700', color: '#fff' },

  // ── Empty state ──
  empty: { alignItems: 'center', paddingVertical: rs(30) },
  emptyCardWrap: {
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: rs(20), marginHorizontal: GUT, marginTop: rs(18),
  },
  emptyArt: {
    width: rs(150), height: rs(120), marginBottom: rs(18),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(14), right: rs(24),
    width: rs(96), height: rs(70), borderRadius: rs(14),
    backgroundColor: C.tintEmerald, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(96), height: rs(84), borderRadius: rs(16),
    backgroundColor: '#F1F6F3', borderWidth: 1, borderColor: C.tintEmerald,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(6), right: rs(20),
    width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.emerald,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(10), left: rs(6),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.tintEmerald,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: C.emeraldDeep, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '700', color: C.text, textAlign: 'center' },
  emptySubtitle: {
    fontFamily: DISPLAY, fontSize: rf(12.5), color: C.muted, textAlign: 'center',
    lineHeight: rf(19), marginTop: rs(8), fontWeight: '600', maxWidth: rs(280),
  },
});

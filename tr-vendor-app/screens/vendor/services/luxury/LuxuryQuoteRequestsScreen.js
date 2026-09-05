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
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

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
  purple: T.purple, purpleL: T.purpleLight,
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
    data: allRequests, loading, refreshing, hasMore,
    loadMore, refresh, initialLoad, applyDateFilter, dateFilter,
    clearDateFilter,
  } = useInfiniteScroll(getQuoteRequests, { service: 'luxury' });

  useEffect(() => {
    console.log('🚀 [LuxuryRequests] Component mounted, loading initial data...');
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
    if (statusFilter === 'ALL') return requests;
    return requests.filter(req => req.status?.toUpperCase() === statusFilter);
  }, [requests, statusFilter]);

  // Get count for each status
  const statusCounts = useMemo(() => {
    const counts = { ALL: requests.length, PENDING: 0, QUOTES_RECEIVED: 0, CANCELLED: 0, EXPIRED: 0 };
    requests.forEach(req => {
      const status = req.status?.toUpperCase();
      if (counts.hasOwnProperty(status)) counts[status]++;
    });
    return counts;
  }, [requests]);

  const getStatusMeta = (status) => {
    const key = status?.toUpperCase();
    return STATUS_META[key] || { label: status, color: C.muted, bg: '#F8FAFC', icon: 'help-circle-outline' };
  };

  // Derived only — no new state. Powers the richer empty-state copy.
  const isFiltered = statusFilter !== 'ALL' || !!dateFilter.start;

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
    const railColors = [meta.color, shade(meta.color, -18)];

    return (
      <TouchableOpacity
        style={[styles.card, cardShadow]}
        onPress={() => {
          const requestId = item.id || item._id;
          console.log('🖱️ [LuxuryRequests] Card clicked:', { requestId, itemId: item.id, item_Id: item._id });
          navigation.navigate('LuxuryQuoteRequestDetail', { requestId });
        }}
        activeOpacity={0.85}
      >
        {/* Tonal accent rail — quick status recognition down the card edge */}
        <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cardRail} />

        <View style={styles.cardInner}>
          {/* Top: vehicle-type icon + request number + status */}
          <View style={styles.cardTopStripe}>
            <LinearGradient colors={TONES.amber.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.luxuryIconBox}>
              <MaterialCommunityIcons name="car-sports" size={rs(13)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.typeLabel}>LUXURY REQUEST</Text>
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
            <Text style={styles.metaText} numberOfLines={1}>{pickupLocation}</Text>
            {dropLocation ? (
              <>
                <Icon name="arrow-right" size={rs(10)} color={C.muted} />
                <Ionicons name="location" size={rs(10.5)} color={C.red} />
                <Text style={styles.metaText} numberOfLines={1}>{dropLocation}</Text>
              </>
            ) : null}
          </View>

          {/* Dates */}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={rs(10.5)} color={C.muted} />
            <Text style={styles.metaText}>
              {formatDate(pickupDate)}{returnDate ? ` – ${formatDate(returnDate)}` : ''}
            </Text>
          </View>

          {/* Booking Type & Package */}
          {(bookingType || packageType) && (
            <View style={styles.badgeRow}>
              {bookingType && (
                <View style={styles.bookingTypeBadge}>
                  <Ionicons name="timer-outline" size={rs(10)} color={C.blue} />
                  <Text style={styles.bookingTypeText}>{bookingType}</Text>
                </View>
              )}
              {packageType && (
                <View style={styles.packageBadge}>
                  <Ionicons name="cube-outline" size={rs(10)} color={C.purple} />
                  <Text style={styles.packageText}>{packageType}</Text>
                </View>
              )}
            </View>
          )}

          {/* Vehicle Information */}
          {(vehicleModelName || vehicleBrand || vehicleCategoryName) ? (
            <View style={styles.vehicleBox}>
              <MaterialCommunityIcons name="car-sports" size={rs(15)} color={C.amber} />
              <View style={{ flex: 1, minWidth: 0 }}>
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
                  navigation.navigate('LuxurySendQuote', { requestId: item.id || item._id });
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
                    navigation.navigate('LuxuryQuoteDetail', { quoteId: item.myQuote?.id });
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
                      navigation.navigate('LuxurySendQuote', {
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
          <Ionicons name={isFiltered ? 'search' : 'clipboard-outline'} size={rs(40)} color={C.g500} />
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
          : 'New luxury car requests from customers will appear here'}
      </Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={{ padding: rs(16) }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <View style={[styles.cardRail, { backgroundColor: '#DDE4EE' }]} />
          <View style={styles.cardInner}>
            <View style={styles.cardTopStripe}>
              <Bone w={rs(26)} h={rs(26)} r={rs(8)} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Bone w={90} h={9} r={3} />
                <Bone w={70} h={12} r={4} />
              </View>
              <Bone w={70} h={20} r={999} />
            </View>
            <Bone w={130} h={13} r={4} style={{ marginBottom: 8 }} />
            <Bone w="80%" h={10} r={3} style={{ marginBottom: 6 }} />
            <Bone w="55%" h={10} r={3} style={{ marginBottom: 8 }} />
            <View style={[styles.vehicleBox, { backgroundColor: '#EEF2F1' }]}>
              <Bone w={rs(15)} h={rs(15)} r={4} />
              <View style={{ flex: 1, gap: 4 }}>
                <Bone w={100} h={11} r={4} />
                <Bone w={70} h={9} r={3} />
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Bone w={80} h={10} r={3} />
              <Bone w={50} h={20} r={rs(7)} />
            </View>
            <Bone w="100%" h={rs(30)} r={rs(9)} style={{ marginTop: rs(8) }} />
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
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.headerEyebrow}>REQUEST INBOX</Text>
              <Text style={styles.headerTitle}>Quote Requests</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDateFilter(true)}
              style={[styles.filterCircle, dateFilter.start && styles.filterCircleActive]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="calendar" size={rs(18)} color="#fff" />
              {dateFilter.start ? <View style={styles.filterDot} /> : null}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Summary — Total/Pending/Quoted counts, in the body now */}
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
      {(loading || refreshing) && allRequests.length === 0 ? renderSkeleton() : (
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

  // ── Hero header ──
  headerGrad: {
    paddingBottom: rs(8),
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(10) },
  titleWrap: { alignItems: 'center', justifyContent: 'center', minHeight: rs(40) },
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
  headerTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  // Summary card — lives in the body now, below the compact header.
  summaryWrap: { marginHorizontal: GUT, marginTop: rs(14) },
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
  luxuryIconBox: {
    width: rs(26), height: rs(26), borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: { fontFamily: DISPLAY, fontSize: rf(8), fontWeight: '700', letterSpacing: 0.8, color: C.amber },
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

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(5), flexWrap: 'wrap' },
  bookingTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.blueL, paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: rs(6),
  },
  bookingTypeText: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: '700', color: C.blue },
  packageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.purpleL, paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: rs(6),
  },
  packageText: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: '700', color: C.purple },

  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: C.amberL, borderRadius: rs(9),
    padding: rs(8), marginVertical: rs(3),
    borderWidth: 1, borderColor: '#FDE68A',
  },
  vehicleModel: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: '700', color: C.text },
  vehicleMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(6), flexWrap: 'wrap', marginTop: rs(2) },
  vehicleBrand: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: '600', color: C.emeraldDeep },
  categoryBadge: {
    backgroundColor: C.g600, paddingHorizontal: rs(6), paddingVertical: rs(1), borderRadius: rs(6),
  },
  categoryBadgeText: { fontFamily: DISPLAY, fontSize: rf(8), fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

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

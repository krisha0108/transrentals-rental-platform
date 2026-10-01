import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorReviews } from '../../api/client';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const PAGE_SIZE = 20;
const LONG_REVIEW = 160;

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, purple: T.purple, amber: T.amber, orange: T.orange,
  indigo: T.indigo, pink: T.rose, cyan: T.oceanLight,
  star: T.gold, red: T.red, redL: T.redL,
};

// review.source → icon/colour for the service badge + filter chip
const SVC_META = {
  bike:         { name: 'Bike',        icon: 'motorbike',       color: C.amber },
  'self-drive': { name: 'Self Drive',  icon: 'car-side',        color: C.cyan },
  car:          { name: 'Car Rental',  icon: 'car',             color: C.g600 },
  luxury:       { name: 'Luxury',      icon: 'car-sports',      color: C.blue },
  bus:          { name: 'Bus',         icon: 'bus',             color: C.pink },
  truck:        { name: 'Transporter', icon: 'truck-delivery',  color: C.orange },
  packers:      { name: 'Packers',     icon: 'package-variant', color: C.purple },
  equipment:    { name: 'Equipment',   icon: 'crane',           color: C.indigo },
  wander:       { name: 'Wander',      icon: 'map-marker-path', color: C.g700 },
};

const svcMeta = (source, label) =>
  SVC_META[source] || { name: label || source || 'Service', icon: 'star-circle-outline', color: C.muted };

const fmtDate = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const diff = Date.now() - dt.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (diff >= 0 && diff < 60 * 60 * 1000) return 'Just now';
    if (diff >= 0 && diff < day) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    if (diff >= 0 && diff < 7 * day) {
      const n = Math.floor(diff / day);
      return n === 1 ? 'Yesterday' : `${n} days ago`;
    }
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

function Stars({ value = 0, size = 14, color = C.star }) {
  // round to the nearest half star
  const v = Math.round(Number(value || 0) * 2) / 2;
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const name = v >= i ? 'star' : v >= i - 0.5 ? 'star-half-full' : 'star-outline';
        return <MaterialCommunityIcons key={i} name={name} size={size} color={color} />;
      })}
    </View>
  );
}

function ReviewCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const meta = svcMeta(item.source, item.serviceLabel);
  const text = (item.review || '').trim();
  const isLong = text.length > LONG_REVIEW;
  const subs = Object.entries(item.subRatings || {}).filter(([, v]) => Number(v) > 0);
  const when = fmtDate(item.reviewedAt || item.tripDate);

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{(item.customerName || 'C').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.customerTxt} numberOfLines={1}>{item.customerName || 'Customer'}</Text>
          <View style={s.starRow}>
            <Stars value={item.rating} size={14} />
            {!!when && <Text style={s.dateTxt}>{when}</Text>}
          </View>
        </View>
        <View style={s.ratingPill}>
          <Text style={s.ratingPillTxt}>{Number(item.rating || 0).toFixed(1)}</Text>
        </View>
      </View>

      <View style={s.badgeRow}>
        <View style={[s.svcBadge, { backgroundColor: meta.color + '14' }]}>
          <MaterialCommunityIcons name={meta.icon} size={12} color={meta.color} />
          <Text style={[s.svcBadgeTxt, { color: meta.color }]} numberOfLines={1}>{item.serviceLabel || meta.name}</Text>
        </View>
        {!!item.bookingNumber && (
          <View style={s.bookingBadge}>
            <MaterialCommunityIcons name="pound" size={11} color={C.muted} />
            <Text style={s.bookingBadgeTxt} numberOfLines={1}>{item.bookingNumber}</Text>
          </View>
        )}
      </View>

      {text ? (
        <View style={{ marginTop: 10 }}>
          <Text style={s.reviewTxt}>{isLong && !expanded ? `${text.slice(0, LONG_REVIEW).trimEnd()}…` : text}</Text>
          {isLong && (
            <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={s.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={s.noText}>Rated without a written review</Text>
      )}

      {subs.length > 0 && (
        <View style={s.subWrap}>
          {subs.map(([label, v]) => (
            <View key={label} style={s.subPill}>
              <Text style={s.subLabel} numberOfLines={1}>{label}</Text>
              <MaterialCommunityIcons name="star" size={11} color={C.star} />
              <Text style={s.subValue}>{Number(v).toFixed(Number.isInteger(Number(v)) ? 0 : 1)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ReviewsScreen({ navigation }) {
  const [reviews, setReviews]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState(null);
  const [rating, setRating]         = useState(null);   // null = all
  const [service, setService]       = useState(null);   // null = all
  const [services, setServices]     = useState([]);     // [{ source, label }] seen so far

  const reqId = useRef(0);
  const loadingMoreRef = useRef(false);

  const rememberServices = useCallback((list) => {
    setServices(prev => {
      const map = new Map(prev.map(x => [x.source, x]));
      list.forEach(r => {
        if (r?.source && !map.has(r.source)) map.set(r.source, { source: r.source, label: r.serviceLabel });
      });
      return map.size === prev.length ? prev : Array.from(map.values());
    });
  }, []);

  const load = useCallback(async (pageNum = 1) => {
    const id = ++reqId.current;
    try {
      const data = await getVendorReviews({
        page: pageNum, limit: PAGE_SIZE,
        rating: rating || undefined, service: service || undefined,
      });
      if (id !== reqId.current) return;
      if (data?.success === false) throw new Error(data?.error || 'Could not load reviews');
      const list = Array.isArray(data?.reviews) ? data.reviews : [];
      setReviews(prev => (pageNum === 1 ? list : [...prev, ...list]));
      if (data?.summary) setSummary(data.summary);
      setPage(Number(data?.page) || pageNum);
      setTotalPages(Number(data?.totalPages) || 1);
      rememberServices(list);
      setError(null);
    } catch (e) {
      if (id !== reqId.current) return;
      if (pageNum === 1) {
        setError(e?.response?.data?.error || e?.message || 'Could not load reviews');
      }
    } finally {
      if (id === reqId.current) {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }, [rating, service, rememberServices]);

  // (Re)load from page 1 whenever a filter changes
  useEffect(() => {
    setLoading(true);
    setReviews([]);
    load(1);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (loading || refreshing || loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    load(page + 1);
  }, [loading, refreshing, page, totalPages, load]);

  const retry = () => {
    setError(null);
    setLoading(true);
    load(1);
  };

  const total   = Number(summary?.total || 0);
  const average = Number(summary?.average || 0);
  const dist    = summary?.distribution || {};
  const maxBucket = Math.max(1, ...[1, 2, 3, 4, 5].map(k => Number(dist[k] || dist[String(k)] || 0)));

  const renderHeader = () => (
    <View>
      {/* Summary card */}
      <View style={s.summaryCard}>
        {summary ? (
          <View style={s.summaryRow}>
            <View style={s.summaryLeft}>
              <Text style={s.avgNum}>{average.toFixed(1)}</Text>
              <Stars value={average} size={16} />
              <Text style={s.basedOn}>Based on {total} review{total === 1 ? '' : 's'}</Text>
            </View>
            <View style={s.summaryRight}>
              {[5, 4, 3, 2, 1].map(k => {
                const n = Number(dist[k] || dist[String(k)] || 0);
                return (
                  <View key={k} style={s.barRow}>
                    <Text style={s.barLabel}>{k}</Text>
                    <MaterialCommunityIcons name="star" size={11} color={C.star} />
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${(n / maxBucket) * 100}%` }]} />
                    </View>
                    <Text style={s.barCount}>{n}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={s.summaryRow}>
            <View style={[s.summaryLeft, { gap: 8 }]}>
              <Bone w={60} h={34} r={6} />
              <Bone w={80} h={12} r={4} />
              <Bone w={90} h={10} r={4} />
            </View>
            <View style={[s.summaryRight, { gap: 8 }]}>
              {[0, 1, 2, 3, 4].map(i => <Bone key={i} w="100%" h={8} r={4} />)}
            </View>
          </View>
        )}
      </View>

      {/* Rating chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
        {[null, 5, 4, 3, 2, 1].map(k => {
          const active = rating === k;
          return (
            <TouchableOpacity key={String(k)} activeOpacity={0.8}
              style={[s.chip, active && s.chipActive]} onPress={() => setRating(k)}>
              {k != null && <MaterialCommunityIcons name="star" size={13} color={active ? '#fff' : C.star} />}
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{k == null ? 'All' : String(k)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Service chips (only services this vendor actually has reviews for) */}
      {services.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chipsRow, { paddingTop: 0 }]}>
          {[null, ...services].map(svc => {
            const key = svc ? svc.source : null;
            const active = service === key;
            const meta = svc ? svcMeta(svc.source, svc.label) : null;
            return (
              <TouchableOpacity key={key || 'all'} activeOpacity={0.8}
                style={[s.chip, active && s.chipActive]} onPress={() => setService(key)}>
                {meta && <MaterialCommunityIcons name={meta.icon} size={13} color={active ? '#fff' : meta.color} />}
                <Text numberOfLines={1} style={[s.chipTxt, active && s.chipTxtActive]}>
                  {svc ? (svc.label || meta.name) : 'All services'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.card}>
              <View style={s.cardTop}>
                <Bone w={36} h={36} r={18} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Bone w={120} h={12} r={4} />
                  <Bone w={80} h={10} r={4} />
                </View>
              </View>
              <Bone w="90%" h={10} r={4} style={{ marginTop: 14 }} />
              <Bone w="70%" h={10} r={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={28} color={C.red} />
          </View>
          <Text style={s.emptyTitle}>Couldn't load reviews</Text>
          <Text style={s.emptySub}>{String(error)}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={retry} activeOpacity={0.8}>
            <Ionicons name="refresh" size={15} color="#fff" />
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const filtered = rating != null || service != null;
    return (
      <View style={s.empty}>
        <View style={s.emptyIcon}>
          <MaterialCommunityIcons name="star-outline" size={28} color={C.muted} />
        </View>
        <Text style={s.emptyTitle}>{filtered ? 'No matching reviews' : 'No reviews yet'}</Text>
        <Text style={s.emptySub}>
          {filtered
            ? 'Try a different rating or service filter.'
            : 'Reviews appear here after customers rate completed trips.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Header */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Reviews</Text>
              <Text style={s.headerSub}>What customers say about your trips</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={loading || error ? [] : reviews}
        keyExtractor={(item, i) => `${item.source || 'r'}:${item.id ?? i}`}
        renderItem={({ item }) => <ReviewCard item={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ marginVertical: 16 }} color={C.g500} />
            : <View style={{ height: 40 }} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g400} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // Header
  hero: { paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 2 },

  body: { paddingHorizontal: 16, paddingTop: 14 },

  // Summary
  summaryCard: { backgroundColor: C.card, borderRadius: rs(18), padding: 16, borderWidth: 1, borderColor: C.border, ...cardShadow },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: rs(96), gap: 4 },
  avgNum:      { fontFamily: DISPLAY, fontSize: 40, fontWeight: '800', color: C.text, letterSpacing: -1 },
  basedOn:     { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  summaryRight:{ flex: 1, gap: 5 },
  barRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barLabel:    { fontSize: 11.5, fontWeight: '800', color: C.sub, width: 9, textAlign: 'right' },
  barTrack:    { flex: 1, height: 7, borderRadius: 4, backgroundColor: C.bg, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 4, backgroundColor: C.star },
  barCount:    { fontSize: 11, fontWeight: '700', color: C.muted, minWidth: 22, textAlign: 'right' },

  // Chips
  chipsRow:  { paddingVertical: 12, gap: 8, alignItems: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive:{ backgroundColor: C.g700, borderColor: C.g700 },
  chipTxt:   { fontSize: 13, fontWeight: '700', color: C.sub },
  chipTxtActive: { color: '#fff' },

  // Review card
  card: { backgroundColor: C.card, borderRadius: rs(18), padding: 13, borderWidth: 1, borderColor: C.border, ...cardShadow },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt:   { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.g700 },
  customerTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  starRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  dateTxt:     { fontSize: 11, color: C.muted, fontWeight: '600' },
  ratingPill:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: rs(8), backgroundColor: T.tintGold },
  ratingPillTxt: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '800', color: C.amber },

  badgeRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  svcBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: rs(8) },
  svcBadgeTxt: { fontSize: 11, fontWeight: '800' },
  bookingBadge:{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: rs(8), backgroundColor: C.bg },
  bookingBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.sub },

  reviewTxt:   { fontSize: 13.5, lineHeight: 20, color: C.text },
  readMore:    { fontSize: 12.5, fontWeight: '800', color: C.g700, marginTop: 4 },
  noText:      { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 10 },

  subWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  subPill:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  subLabel:    { fontSize: 11, fontWeight: '700', color: C.sub, marginRight: 2, maxWidth: 140 },
  subValue:    { fontSize: 11, fontWeight: '800', color: C.text },

  // Empty / error
  empty:      { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20, gap: 6 },
  emptyIcon:  { width: rs(60), height: rs(60), borderRadius: rs(30), backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6, ...cardShadow },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center' },
  retryBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: C.g700 },
  retryTxt:   { fontSize: 13.5, fontWeight: '800', color: '#fff' },
});

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorProfile, apiPatch } from '../../api/client';
import { fetchInquiries } from '../../api/inquiriesApi';
import { showConfirm, showSuccess, showError } from '../../../services/alertService';
import { SC as T, G, rs, cardShadow, rowShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50:  T.tintEmerald,
  bg:     T.bg, card: T.card, border: T.border,
  text:   T.ink, sub: T.text, muted: T.subText,
  blue:    T.blue, purple: T.purple, amber: T.amber,
  red:     T.red, redL: T.redLight, orange: T.orange,
  indigo:  T.indigo, teal: T.ocean, pink: T.rose, cyan: T.oceanLight,
};

const SVC_META = {
  bike:         { name: 'Bike',       icon: 'motorbike',       color: C.amber  },
  'self-drive': { name: 'Self Drive', icon: 'car-side',        color: C.cyan   },
  bus:          { name: 'Bus',        icon: 'bus',             color: C.pink   },
  truck:        { name: 'Truck',      icon: 'truck-delivery',  color: C.orange },
  car:          { name: 'Car',        icon: 'car',             color: C.g600   },
  packers:      { name: 'Packers',    icon: 'package-variant', color: C.purple },
  equipment:    { name: 'Equipment',  icon: 'crane',           color: C.indigo },
  luxury:       { name: 'Luxury',     icon: 'car-sports',      color: C.blue   },
};

// DB service IDs → app slugs (DB slugs are 'bike-rental' etc., so we map
// from the stable SVC_n ids exactly like DashboardScreen does).
const SVC_ID_TO_SERVICE = {
  SVC_1: 'bike', SVC_2: 'self-drive', SVC_3: 'bus', SVC_4: 'truck',
  SVC_5: 'car', SVC_6: 'packers', SVC_7: 'equipment', SVC_8: 'luxury',
};

// "Send Quote" → each service's existing quote-submission screen.
const SEND_QUOTE_SCREEN = {
  bike: 'BikeSendQuote', 'self-drive': 'SelfDriveSendQuote',
  bus: 'BusSendQuote',   truck: 'TruckSendQuote',
  luxury: 'LuxurySendQuote', packers: 'PackersSendQuote',
  equipment: 'EquipmentSendQuote',
};
// Tap routing depends on lifecycle stage:
//   booking exists  → booking detail (OTP / trip)
//   quoted, no book → quote detail (view / withdraw)
//   neither (new)   → request detail (send quote)
const INQUIRY_DETAIL_SCREEN = {
  bike: 'BikeQuoteRequestDetail', 'self-drive': 'SelfDriveQuoteRequestDetail',
  bus: 'BusQuoteRequestDetail',   truck: 'TruckQuoteRequestDetail',
  luxury: 'LuxuryQuoteRequestDetail', packers: 'PackersQuoteRequestDetail',
  equipment: 'EquipmentQuoteRequestDetail',
};
const QUOTE_DETAIL_SCREEN = {
  bike: 'BikeQuoteDetail', 'self-drive': 'SelfDriveQuoteDetail',
  bus: 'BusQuoteDetail',   truck: 'TruckQuoteDetail',
  luxury: 'LuxuryQuoteDetail', packers: 'PackersQuoteDetail',
  equipment: 'EquipmentQuoteDetail',
};
const BOOKING_DETAIL_SCREEN = {
  bike: 'BikeBookingDetail', 'self-drive': 'SelfDriveBookingDetail',
  bus: 'BusBookingDetail',   truck: 'TruckBookingDetail',
  car: 'CarRentalBookingDetail', packers: 'PackersBookingDetail',
  equipment: 'EquipmentBookingDetail', luxury: 'LuxuryBookingDetail',
};

// ── Breathing halo (empty state) — pulsing outer ring + a gently rocking
// icon, same idiom as travel-agent's Leads empty state. ──────────────────
function BreathingHalo({ icon }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const rock  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = (val, duration) => Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const p = loop(pulse, 1400); const r = loop(rock, 1600);
    p.start(); r.start();
    return () => { p.stop(); r.stop(); };
  }, [pulse, rock]);
  const scale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const rotate  = rock.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] });
  return (
    <Animated.View style={[s.halo, { transform: [{ scale }], opacity }]}>
      <View style={s.haloRing}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name={icon} size={30} color={C.g700} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export default function AllInquiriesScreen({ navigation }) {
  const [slugs, setSlugs]           = useState(null);  // null = profile not loaded yet
  const [data, setData]             = useState({ new: null, quoted: null });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]               = useState('new');   // 'new' | 'quoted'
  const [svcFilter, setSvcFilter]   = useState('all');

  // Load approved-service slugs from profile once.
  useEffect(() => {
    getVendorProfile()
      .then(p => {
        const s = (p?.approvedServiceIds || []).map(id => SVC_ID_TO_SERVICE[id]).filter(Boolean);
        setSlugs(s);
      })
      .catch(() => setSlugs([]));
  }, []);

  const loadAll = useCallback(async (s) => {
    if (!s || s.length === 0) {
      setData({ new: { items: [], total: 0 }, quoted: { items: [], total: 0 } });
      setLoading(false);
      return;
    }
    try {
      // "Quoted" = everything I've submitted: still-open quotes (quoted)
      // + accepted ones that became bookings (won), newest first.
      const [open, quoted, won] = await Promise.all([
        fetchInquiries(s, { type: 'open',   limit: 20 }),
        fetchInquiries(s, { type: 'quoted', limit: 20 }),
        fetchInquiries(s, { type: 'won',    limit: 20 }),
      ]);
      // Trust the per-item `quoted` flag (real data), not the fetch type —
      // some endpoints ignore unsupported types and return open requests.
      const newItems = open.items.filter(x => !x.quoted);
      const seen = new Set();
      const submitted = [...quoted.items, ...won.items]
        .filter(x => x.quoted && !seen.has(x.id) && seen.add(x.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setData({
        new:    { items: newItems,  total: newItems.length },
        quoted: { items: submitted, total: submitted.length },
      });
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Load on first focus (after slugs resolve) and refresh on every return.
  useFocusEffect(useCallback(() => {
    if (slugs) loadAll(slugs);
  }, [slugs, loadAll]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll(slugs || []);
    setRefreshing(false);
  }, [slugs, loadAll]);

  // Send Quote → service screen · Accept (car) → inline PATCH.
  const handleAction = useCallback((q) => {
    if (q.accept) {
      showConfirm(
        'Accept booking?',
        `Accept this ${q.title} request from ${q.customer}?`,
        async () => {
          try {
            const res = await apiPatch(`/vendor/car-bookings/${q.rawId}`, { action: 'accept' });
            if (res.data?.success) {
              showSuccess('Booking accepted! Check it under your bookings.');
              setData(prev => prev.new
                ? { ...prev, new: { items: prev.new.items.filter(x => x.id !== q.id), total: Math.max(0, prev.new.total - 1) } }
                : prev);
            } else {
              showError(res.data?.error || 'Could not accept this booking.');
            }
          } catch (e) {
            showError(e?.response?.data?.error || 'Could not accept this booking.');
          }
        },
        { confirmText: 'Accept' },
      );
      return;
    }
    const screen = SEND_QUOTE_SCREEN[q.service];
    if (screen) navigation.navigate(screen, { requestId: q.rawId });
  }, [navigation]);

  // Tap a card → jump straight to the right stage (no intermediate hop):
  //   accepted (booking) → booking detail · quoted → quote detail · new → request detail
  const openDetail = useCallback((q) => {
    // Car is an accept-flow booking from the start.
    if (q.service === 'car') {
      navigation.navigate('CarRentalBookingDetail', { bookingId: q.bookingId || q.rawId, serviceType: 'car' });
      return;
    }
    if (q.bookingId) {
      const screen = BOOKING_DETAIL_SCREEN[q.service];
      if (screen) { navigation.navigate(screen, { bookingId: q.bookingId, serviceType: q.service }); return; }
    }
    if (q.quoteId) {
      const screen = QUOTE_DETAIL_SCREEN[q.service];
      if (screen) { navigation.navigate(screen, { quoteId: q.quoteId }); return; }
    }
    const reqScreen = INQUIRY_DETAIL_SCREEN[q.service];
    if (reqScreen) navigation.navigate(reqScreen, { requestId: q.rawId });
  }, [navigation]);

  const newCount    = data.new?.total ?? 0;
  const quotedCount = data.quoted?.total ?? 0;
  const urgentCount = (data.new?.items || []).filter(x => x.urgent).length;
  const tabItems    = data[tab]?.items || [];

  // Filter chips reflect services that actually have inquiries (either tab).
  const serviceFilters = useMemo(() => {
    const present = new Set();
    (data.new?.items || []).forEach(q => present.add(q.service));
    (data.quoted?.items || []).forEach(q => present.add(q.service));
    return ['all', ...present];
  }, [data]);

  const list = useMemo(
    () => tabItems.filter(q => svcFilter === 'all' || q.service === svcFilter),
    [tabItems, svcFilter],
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Header ── */}
      <LinearGradient colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Inquiries</Text>
              <Text style={s.headerSub}>Across all your services</Text>
            </View>
          </View>

          {/* New / Quoted toggle — counts live in the pills, urgent shows as
              a small dot on "New" so nothing from the old stat row is lost. */}
          <View style={s.toggle}>
            {[
              { key: 'new',    label: 'New',    count: newCount },
              { key: 'quoted', label: 'Quoted', count: quotedCount },
            ].map(t => {
              const active = tab === t.key;
              return (
                <TouchableOpacity key={t.key} activeOpacity={0.8}
                  style={[s.toggleBtn, active && s.toggleBtnActive]}
                  onPress={() => setTab(t.key)}>
                  <Text style={[s.toggleTxt, active && s.toggleTxtActive]}>{t.label}</Text>
                  <View style={[s.togglePill, active && s.togglePillActive]}>
                    <Text style={[s.togglePillTxt, active && s.togglePillTxtActive]}>{t.count}</Text>
                  </View>
                  {t.key === 'new' && urgentCount > 0 && (
                    <View style={s.urgentDot}>
                      <Text style={s.urgentDotTxt}>{urgentCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Service filter chips ── */}
      {serviceFilters.length > 1 && (
        <View style={s.chipsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsRow}>
            {serviceFilters.map(f => {
              const active = svcFilter === f;
              const meta = SVC_META[f];
              return (
                <TouchableOpacity key={f} activeOpacity={0.8}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setSvcFilter(f)}>
                  {meta && (
                    <MaterialCommunityIcons name={meta.icon} size={13}
                      color={active ? '#fff' : meta.color} />
                  )}
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>
                    {f === 'all' ? 'All' : meta?.name || f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={s.body}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={s.card}>
              <View style={s.cardTop}>
                <Bone w={32} h={32} r={11} />
                <View style={{ flex: 1, marginLeft: 10, gap: 5 }}>
                  <Bone w={120} h={12} r={4} />
                  <Bone w={150} h={10} r={4} />
                </View>
                <Bone w={40} h={10} r={4} />
              </View>
              <View style={s.cardBottom}>
                <Bone w={70} h={20} r={10} />
                <View style={{ flex: 1 }} />
                <Bone w={90} h={26} r={13} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.g500]} tintColor={C.g400} />
          }
        >
          {list.length === 0 ? (
            <View style={s.empty}>
              <BreathingHalo icon="mail-open-outline" />
              <Text style={s.emptyTitle}>No {tab === 'new' ? 'new' : 'quoted'} inquiries</Text>
              <Text style={s.emptySub}>
                {tab === 'new' ? 'New requests will show up here.' : 'Quotes you send will appear here.'}
              </Text>
            </View>
          ) : (
            list.map(q => {
              const meta = SVC_META[q.service] || { name: q.service, icon: 'help-circle', color: C.muted };
              const isUrgent  = !q.quoted && q.urgent;
              const isAccepted = q.quoted && q.bookingId;
              return (
                <TouchableOpacity key={q.id} style={s.card} activeOpacity={0.85}
                  onPress={() => openDetail(q)}>
                  {/* Identity row — avatar + customer + service/title */}
                  <View style={s.cardTop}>
                    <View style={[s.avatar, isUrgent && { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                      <Text style={[s.avatarTxt, isUrgent && { color: C.red }]}>{q.customer?.charAt(0) || '?'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.customerTxt} numberOfLines={1}>{q.customer || 'Customer'}</Text>
                      <View style={s.cardMetaRow}>
                        <MaterialCommunityIcons name={meta.icon} size={11} color={meta.color} />
                        <Text style={s.cardTitle} numberOfLines={1}>
                          {q.title}{!!q.sub && ` · ${q.sub}`}
                        </Text>
                      </View>
                    </View>
                    {isUrgent ? (
                      <View style={s.urgent}>
                        <Ionicons name="time-outline" size={10} color={C.red} />
                        <Text style={s.urgentTxt}>{q.expiry}</Text>
                      </View>
                    ) : (
                      <Text style={s.ago}>{q.ago}</Text>
                    )}
                  </View>

                  {/* Chip footer — status chip + amount chip + action button */}
                  <View style={s.cardBottom}>
                    <View style={[s.statusChip,
                      isAccepted ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
                        : q.quoted ? { backgroundColor: C.g50, borderColor: C.g100 }
                        : { backgroundColor: C.amberL, borderColor: '#FDE68A' }]}>
                      <Ionicons
                        name={isAccepted ? 'checkmark-done-circle' : q.quoted ? 'checkmark-circle' : 'ellipse'}
                        size={12} color={isAccepted ? C.blue : q.quoted ? C.g600 : C.amber} />
                      <Text style={[s.statusChipTxt, { color: isAccepted ? C.blue : q.quoted ? C.g700 : C.amber }]}>
                        {isAccepted ? 'Accepted' : q.quoted ? 'Quoted' : 'New'}
                      </Text>
                    </View>
                    {!!q.myQuote && (
                      <View style={s.amtChip}>
                        <Text style={s.amtChipTxt}>{q.myQuote}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    {!q.quoted && (
                      <TouchableOpacity activeOpacity={0.85}
                        style={[s.btn, q.accept && { backgroundColor: C.blue }]}
                        onPress={() => handleAction(q)}>
                        <Ionicons name={q.accept ? 'checkmark-circle-outline' : 'pricetag-outline'} size={13} color="#fff" />
                        <Text style={s.btnTxt}>{q.accept ? 'Accept' : 'Send Quote'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Header
  hero:        { paddingHorizontal: 16, paddingBottom: 14, overflow: 'hidden', borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 1 },

  // Toggle
  toggle:          { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 4, gap: 4 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  toggleBtnActive: { backgroundColor: C.g700 },
  toggleTxt:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  toggleTxtActive: { color: '#fff' },
  togglePill:      { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  togglePillActive:{ backgroundColor: 'rgba(255,255,255,0.22)' },
  togglePillTxt:   { fontSize: 11, fontWeight: '800', color: '#fff' },
  togglePillTxtActive: { color: '#fff' },
  urgentDot:       { minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  urgentDotTxt:    { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Chips
  chipsWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chipsRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive:{ backgroundColor: C.g700, borderColor: C.g700 },
  chipTxt:   { fontSize: 13, fontWeight: '700', color: C.sub },
  chipTxtActive: { color: '#fff' },

  // List
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  card: {
    backgroundColor: C.card, borderRadius: rs(18), padding: 13,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'center' },
  cardMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardTitle:    { fontSize: 12.5, color: C.sub, fontWeight: '600', flexShrink: 1 },
  ago:       { fontSize: 11, color: C.muted, fontWeight: '600' },
  urgent:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.redL, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  urgentTxt: { fontSize: 10, fontWeight: '800', color: C.red },

  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  avatar:      { width: 32, height: 32, borderRadius: 11, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt:   { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.g700 },
  customerTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },

  btn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: rs(10) },
  btnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  statusChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusChipTxt: { fontSize: 11.5, fontWeight: '800' },
  amtChip:       { backgroundColor: C.g50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  amtChipTxt:    { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: '800', color: C.g700 },

  // Empty / loading
  empty:      { alignItems: 'center', paddingTop: 60, gap: 6 },
  halo:       { width: rs(90), height: rs(90), borderRadius: rs(45), backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  haloRing:   { width: rs(64), height: rs(64), borderRadius: rs(32), backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center' },
});

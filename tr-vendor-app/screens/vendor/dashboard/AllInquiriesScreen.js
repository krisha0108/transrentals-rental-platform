import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorProfile, apiPatch } from '../../api/client';
import { fetchInquiries } from '../../api/inquiriesApi';
import { showConfirm, showSuccess, showError } from '../../../services/alertService';

// ── Design tokens (matches DashboardScreen) ────────────────────
const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50:  '#ECFDF5',
  bg:     '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text:   '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue:    '#2563EB', purple: '#7C3AED', amber: '#D97706',
  red:     '#DC2626', redL: '#FEF2F2', orange: '#EA580C',
  indigo:  '#4F46E5', teal: '#0D9488', pink: '#DB2777', cyan: '#0891B2',
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
      <LinearGradient colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
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

          {/* New / Quoted toggle */}
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
        <View style={s.empty}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={[s.emptySub, { marginTop: 12 }]}>Loading inquiries…</Text>
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
              <View style={s.emptyIcon}>
                <Ionicons name="mail-open-outline" size={28} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>No {tab === 'new' ? 'new' : 'quoted'} inquiries</Text>
              <Text style={s.emptySub}>
                {tab === 'new' ? 'New requests will show up here.' : 'Quotes you send will appear here.'}
              </Text>
            </View>
          ) : (
            list.map(q => {
              const meta = SVC_META[q.service] || { name: q.service, icon: 'help-circle', color: C.muted };
              return (
                <TouchableOpacity key={q.id} style={s.card} activeOpacity={0.85}
                  onPress={() => openDetail(q)}>
                  {/* Top */}
                  <View style={s.cardTop}>
                    <View style={[s.iconBox, { backgroundColor: meta.color + '14' }]}>
                      <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle} numberOfLines={1}>{q.title}</Text>
                      {!!q.sub && <Text style={s.cardSub} numberOfLines={1}>{q.sub}</Text>}
                    </View>
                    {!q.quoted && q.urgent ? (
                      <View style={s.urgent}>
                        <Ionicons name="time-outline" size={10} color={C.red} />
                        <Text style={s.urgentTxt}>{q.expiry}</Text>
                      </View>
                    ) : (
                      <Text style={s.ago}>{q.ago}</Text>
                    )}
                  </View>

                  {/* Bottom */}
                  <View style={s.cardBottom}>
                    <View style={s.customer}>
                      <View style={s.avatar}>
                        <Text style={s.avatarTxt}>{q.customer?.charAt(0) || '?'}</Text>
                      </View>
                      <Text style={s.customerTxt} numberOfLines={1}>{q.customer || 'Customer'}</Text>
                    </View>

                    {q.quoted ? (
                      q.bookingId ? (
                        <View style={s.acceptedTag}>
                          <Ionicons name="checkmark-done-circle" size={13} color={C.blue} />
                          <Text style={s.acceptedTagTxt}>Accepted</Text>
                        </View>
                      ) : (
                        <View style={s.quotedTag}>
                          <Ionicons name="checkmark-circle" size={13} color={C.g600} />
                          <Text style={s.quotedTagTxt}>{q.myQuote ? `Quoted ${q.myQuote}` : 'Quoted'}</Text>
                        </View>
                      )
                    ) : (
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
  hero:        { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 18 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 2 },

  // Toggle
  toggle:          { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 4, gap: 4 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleTxt:       { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  toggleTxtActive: { color: C.g800 },
  togglePill:      { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  togglePillActive:{ backgroundColor: C.g100 },
  togglePillTxt:   { fontSize: 10, fontWeight: '800', color: '#fff' },
  togglePillTxtActive: { color: C.g700 },

  // Chips
  chipsWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chipsRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive:{ backgroundColor: C.g600, borderColor: C.g600 },
  chipTxt:   { fontSize: 12, fontWeight: '700', color: C.sub },
  chipTxtActive: { color: '#fff' },

  // List
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  cardSub:   { fontSize: 11, color: C.sub, marginTop: 2 },
  ago:       { fontSize: 10, color: C.muted, fontWeight: '600' },
  urgent:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.redL, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  urgentTxt: { fontSize: 9, fontWeight: '800', color: C.red },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  customer:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt:   { fontSize: 11, fontWeight: '800', color: C.g700 },
  customerTxt: { fontSize: 12, fontWeight: '600', color: C.text, flex: 1 },

  btn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },

  quotedTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.g50, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.g100 },
  quotedTagTxt: { fontSize: 11, fontWeight: '800', color: C.g700 },
  acceptedTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  acceptedTagTxt: { fontSize: 11, fontWeight: '800', color: C.blue },

  // Empty / loading
  empty:      { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyIcon:  { width: 60, height: 60, borderRadius: 30, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 12, color: C.muted, textAlign: 'center' },
});

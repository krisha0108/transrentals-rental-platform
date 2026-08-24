import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getBookings, getVendorProfile } from '../../api/client';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50:  T.tintEmerald,
  bg:     T.bg, card: T.card, border: T.border,
  text:   T.ink, sub: T.text, muted: T.subText,
  blue:    T.blue,   blueL:   T.blueLight,
  amber:   T.amber,  amberL:  T.amberLight,
  red:     T.red,    redL:    T.redLight,
  orange:  T.orange, orangeL: T.orangeL,
  indigo:  T.indigo, indigoL: T.indigoLight,
  purple:  T.purple, purpleL: T.purpleLight,
  pink:    T.rose,             pinkL: T.tintRose,
  teal:    T.oceanLight,       tealL: T.tintOcean,
  cyan:    shade(T.ocean, 25), cyanL: T.tintOcean,
};

// service config keyed by app id. apiService → getBookings; detail/st → BookingDetail nav
const SERVICES = {
  bike:         { id: 'bike',        name: 'Bike',        icon: 'motorbike',       color: C.blue,   apiService: 'bike',       detail: 'BikeBookingDetail',       st: 'bike' },
  'self-drive': { id: 'self-drive',  name: 'Self Drive',  icon: 'car-side',        color: C.cyan,   apiService: 'self-drive', detail: 'SelfDriveBookingDetail',  st: 'self-drive' },
  car:          { id: 'car',         name: 'Car Rental',  icon: 'car',             color: C.teal,   apiService: 'car',        detail: 'CarRentalBookingDetail',  st: 'car' },
  bus:          { id: 'bus',         name: 'Bus',         icon: 'bus',             color: C.amber,  apiService: 'bus',        detail: 'BusBookingDetail',        st: 'bus' },
  truck:        { id: 'truck',       name: 'Transporter', icon: 'truck-delivery',  color: C.orange, apiService: 'truck',      detail: 'TruckBookingDetail',      st: 'truck' },
  luxury:       { id: 'luxury',      name: 'Luxury',      icon: 'car-sports',      color: C.indigo, apiService: 'luxury',     detail: 'LuxuryBookingDetail',     st: 'luxury' },
  packers:      { id: 'packers',     name: 'Packers',     icon: 'package-variant', color: C.pink,   apiService: 'packers',    detail: 'PackersBookingDetail',    st: 'packers' },
  equipment:    { id: 'equipment',   name: 'Equipment',   icon: 'crane',           color: C.purple, apiService: 'equipment',  detail: 'EquipmentBookingDetail',  st: 'equipment' },
};
const SVC_ID_TO_KEY = {
  SVC_1: 'bike', SVC_2: 'self-drive', SVC_3: 'bus', SVC_4: 'truck',
  SVC_5: 'car', SVC_6: 'packers', SVC_7: 'equipment', SVC_8: 'luxury',
};

const STATUS_META = {
  COMPLETED:        { label: 'Completed',    color: C.g600 },
  IN_PROGRESS:      { label: 'In Progress',  color: C.purple },
  IN_TRANSIT:       { label: 'In Transit',   color: C.purple },
  LOADING:          { label: 'Loading',      color: C.purple },
  UNLOADING:        { label: 'Unloading',    color: C.purple },
  READY_FOR_PICKUP: { label: 'Ready',        color: C.blue },
  ACCEPTED:         { label: 'Accepted',     color: C.amber },
  CONFIRMED:        { label: 'Confirmed',    color: C.amber },
  DRIVER_ASSIGNED:  { label: 'Driver Set',   color: C.amber },
  VEHICLE_ASSIGNED: { label: 'Vehicle Set',  color: C.amber },
  ADVANCE_PAID:     { label: 'Advance Paid', color: C.amber },
  CANCELLED:        { label: 'Cancelled',    color: C.red },
};

const isCompleted = (s) => s === 'COMPLETED';
const isActive    = (s) => s !== 'COMPLETED' && s !== 'CANCELLED';

const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  catch { return ''; }
};
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

function normalize(svc, b) {
  return {
    id: b.id,
    service: svc.id,
    bookingNumber: b.bookingNumber || '',
    customer: b.customerName || 'Customer',
    status: b.status,
    date: b.pickupDate || b.startDate || b.scheduledDate || b.createdAt,
    location: b.locationName || [b.pickupCity, b.dropCity].filter(Boolean).join(' → ') || '',
    amount: b.grandTotal ?? b.totalAmount ?? b.amount ?? 0,
  };
}

// Illustrated empty state — layered card shapes + rotated tag, matching the
// motif used across the rest of this session's Elevate redesign.
function EmptyState({ icon, title, sub, tag }) {
  return (
    <View style={st.empty}>
      <View style={st.emptyArt}>
        <View style={st.emptyArtCardBack} />
        <View style={st.emptyArtCard}>
          <Ionicons name={icon} size={rs(36)} color={C.g600} />
        </View>
        <View style={st.emptyArtDot} />
        {!!tag && (
          <View style={st.emptyArtTag}>
            <Text style={st.emptyArtTagTxt}>{tag}</Text>
          </View>
        )}
      </View>
      <Text style={st.emptyTitle}>{title}</Text>
      <Text style={st.emptySub}>{sub}</Text>
    </View>
  );
}

export default function BookingsListScreen({ navigation, route }) {
  const [approvedIds, setApprovedIds] = useState(null);   // null = profile not loaded
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedSvc, setSelectedSvc] = useState('all');
  const [status, setStatus]           = useState(route?.params?.initialStatus === 'completed' ? 'completed' : 'active');
  const [query, setQuery]             = useState('');

  const approvedServices = useMemo(
    () => (approvedIds || []).map(id => SERVICES[SVC_ID_TO_KEY[id]]).filter(Boolean),
    [approvedIds],
  );

  const loadBookings = useCallback(async (svcs) => {
    if (!svcs || svcs.length === 0) { setBookings([]); setLoading(false); setRefreshing(false); return; }
    const results = await Promise.allSettled(
      svcs.map(async (svc) => {
        const res = await getBookings(svc.apiService, { limit: 100 });
        return (res?.bookings || []).map(b => normalize(svc, b));
      })
    );
    const merged = [];
    results.forEach(r => { if (r.status === 'fulfilled') merged.push(...r.value); });
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    setBookings(merged);
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Load profile once → set approved services + sensible default selection.
  // (Bookings themselves are loaded by the focus effect below once approved
  // services are known, and reloaded on every tab refocus.)
  useEffect(() => {
    getVendorProfile()
      .then(p => {
        const ids  = p?.approvedServiceIds || [];
        const svcs = ids.map(id => SERVICES[SVC_ID_TO_KEY[id]]).filter(Boolean);
        setSelectedSvc(svcs.length === 2 ? svcs[0].id : 'all');   // 2 → tabs default first
        setApprovedIds(ids);
      })
      .catch(() => { setApprovedIds([]); setLoading(false); });
  }, []);

  useFocusEffect(useCallback(() => {
    if (approvedIds !== null) loadBookings(approvedServices);
  }, [approvedIds, approvedServices, loadBookings]));

  const onRefresh = useCallback(() => { setRefreshing(true); loadBookings(approvedServices); }, [approvedServices, loadBookings]);

  const svcScoped = useMemo(
    () => bookings.filter(b => selectedSvc === 'all' || b.service === selectedSvc),
    [bookings, selectedSvc],
  );
  const activeCount    = useMemo(() => svcScoped.filter(b => isActive(b.status)).length, [svcScoped]);
  const completedCount = useMemo(() => svcScoped.filter(b => isCompleted(b.status)).length, [svcScoped]);
  const svcActiveCount = (id) => bookings.filter(b => b.service === id && isActive(b.status)).length;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => svcScoped.filter(b => {
    const statusOk = status === 'completed' ? isCompleted(b.status) : isActive(b.status);
    const qOk = !q || b.customer?.toLowerCase().includes(q) || b.bookingNumber?.toLowerCase().includes(q);
    return statusOk && qOk;
  }), [svcScoped, status, q]);

  const count = approvedServices.length;

  const openDetail = (b) => {
    const svc = SERVICES[b.service];
    if (svc) navigation.navigate(svc.detail, { bookingId: b.id, serviceType: svc.st });
  };

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Green hero header ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
        <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16 }}>
          <View style={st.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={st.heroTitle}>Bookings</Text>
              <Text style={st.heroSub}>
                {loading ? 'Loading…' : `${bookings.length} bookings · ${count} service${count !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <TouchableOpacity style={st.refreshBtn} onPress={onRefresh} activeOpacity={0.75}>
              <Icon name="refresh-cw" size={17} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
          {/* spacer so the floating search card can tuck into the curve */}
          <View style={{ height: rs(26) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating search — tucks into the hero's bottom curve */}
      <View style={st.searchWrap}>
        <View style={st.searchCard}>
          <Icon name="search" size={15} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={st.searchInput}
            placeholder="Search customer or booking #"
            placeholderTextColor={C.muted}
            value={query} onChangeText={setQuery}
            returnKeyType="search" autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={15} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Fixed filters — kept OUTSIDE the scrollable list so switching tabs
          doesn't reset scroll position. */}
      <View style={st.filtersFixed}>
        {/* ── Service selector (adaptive by count) ── */}
        {count === 2 && (
          <View style={st.tabsWrap}>
            {approvedServices.map(svc => {
              const on = selectedSvc === svc.id;
              return (
                <TouchableOpacity key={svc.id} style={[st.tab, on && st.tabOn]} activeOpacity={0.8}
                  onPress={() => setSelectedSvc(svc.id)}>
                  <MaterialCommunityIcons name={svc.icon} size={16} color={on ? svc.color : C.muted} />
                  <Text style={[st.tabTxt, on && st.tabTxtOn]}>{svc.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {count >= 3 && (
          <View style={st.cardsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.cardsRow}>
              {[{ id: 'all', name: 'All', icon: 'view-grid', color: C.g700 }, ...approvedServices].map(svc => {
                const on  = selectedSvc === svc.id;
                const cnt = svc.id === 'all' ? bookings.filter(b => isActive(b.status)).length : svcActiveCount(svc.id);
                return (
                  <TouchableOpacity key={svc.id} style={[st.svcCard, on && st.svcCardOn]} activeOpacity={0.85}
                    onPress={() => setSelectedSvc(svc.id)}>
                    <View style={[st.svcCardIcon, { backgroundColor: on ? 'rgba(255,255,255,0.22)' : svc.color + '14' }]}>
                      <MaterialCommunityIcons name={svc.icon} size={20} color={on ? '#fff' : svc.color} />
                    </View>
                    <Text style={[st.svcCardName, on && { color: '#fff' }]} numberOfLines={1}>{svc.name}</Text>
                    <Text style={[st.svcCardCnt, on && { color: 'rgba(255,255,255,0.85)' }]}>{cnt} active</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Active / Completed filter ── */}
        <View style={st.statusWrap}>
          {[
            { key: 'active',    label: 'Active',    count: activeCount },
            { key: 'completed', label: 'Completed', count: completedCount },
          ].map(t => {
            const on = status === t.key;
            return (
              <TouchableOpacity key={t.key} style={[st.statusBtn, on && st.statusBtnOn]} activeOpacity={0.8}
                onPress={() => setStatus(t.key)}>
                <Text style={[st.statusTxt, on && st.statusTxtOn]}>{t.label}</Text>
                <View style={[st.statusPill, on && st.statusPillOn]}>
                  <Text style={[st.statusPillTxt, on && st.statusPillTxtOn]}>{t.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={st.empty}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={[st.emptySub, { marginTop: 12 }]}>Loading bookings…</Text>
        </View>
      ) : count === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No approved services yet"
          sub="Bookings appear once your services go live."
          tag="PENDING"
        />
      ) : (
        <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={status === 'completed' ? 'checkmark-done-outline' : 'time-outline'}
              title={`No ${status} bookings`}
              sub={q ? `Nothing matches "${query}"` : (status === 'active' ? 'Active bookings will show up here.' : 'Completed trips will appear here.')}
              tag={status === 'completed' ? 'DONE' : 'ACTIVE'}
            />
          ) : (
            filtered.map(b => {
              const svc = SERVICES[b.service] || { name: b.service, icon: 'cube', color: C.muted };
              const sm  = STATUS_META[b.status] || { label: b.status, color: C.muted };
              return (
                <TouchableOpacity key={`${b.service}:${b.id}`} style={[st.card, st.cardShadow]} activeOpacity={0.85}
                  onPress={() => openDetail(b)}>
                  {/* Tonal accent rail — instant service recognition down the card edge */}
                  <View style={[st.cardRail, { backgroundColor: svc.color }]} />

                  <View style={st.cardInner}>
                    {/* Top: service icon + booking number + status */}
                    <View style={st.cardTopStripe}>
                      <View style={[st.typeIconBox, { backgroundColor: svc.color + '18' }]}>
                        <MaterialCommunityIcons name={svc.icon} size={17} color={svc.color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[st.typeLabel, { color: svc.color }]} numberOfLines={1}>{svc.name.toUpperCase()}</Text>
                        {!!b.bookingNumber && <Text style={st.bookingNumber} numberOfLines={1}>{b.bookingNumber}</Text>}
                      </View>
                      <View style={[st.statusPillCard, { backgroundColor: sm.color + '18' }]}>
                        <Text style={[st.statusPillCardTxt, { color: sm.color }]}>{sm.label}</Text>
                      </View>
                    </View>

                    {/* Customer */}
                    <View style={st.customerRow}>
                      <View style={st.avatar}><Text style={st.avatarTxt}>{b.customer?.charAt(0) || '?'}</Text></View>
                      <Text style={st.cardName} numberOfLines={1}>{b.customer || 'Customer'}</Text>
                    </View>

                    {/* Meta row */}
                    <View style={st.cardMetaRow}>
                      {!!b.date && (
                        <View style={st.metaItem}>
                          <Icon name="calendar" size={11} color={C.muted} />
                          <Text style={st.metaText}>{fmtDate(b.date)}</Text>
                        </View>
                      )}
                      {!!b.location && (
                        <View style={st.metaItem}>
                          <Icon name="map-pin" size={11} color={C.muted} />
                          <Text style={st.metaText} numberOfLines={1}>{b.location}</Text>
                        </View>
                      )}
                    </View>

                    {/* Money row */}
                    {b.amount > 0 && (
                      <View style={st.moneyBlock}>
                        <Text style={st.moneyTotal}>{money(b.amount)}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  cardShadow: { ...cardShadow },

  // ── Green hero header ──
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
    overflow: 'hidden',
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
  heroTop:   { flexDirection: 'row', alignItems: 'center', paddingTop: rs(4) },
  heroTitle: { fontFamily: DISPLAY, fontSize: 24, color: '#fff', letterSpacing: -0.2 },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.62)', fontWeight: '600', marginTop: 2 },
  refreshBtn:{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center' },

  // Floating search card — tucks into the hero's bottom curve.
  searchWrap: { marginHorizontal: 16, marginTop: -rs(22) },
  searchCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(15),
    paddingHorizontal: 14, height: rs(44),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0, fontWeight: '600' },

  filtersFixed: { flexShrink: 0 },

  // 2-service tabs
  tabsWrap: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  tab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: rs(12), backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabOn:    { backgroundColor: C.g50, borderColor: C.g500 },
  tabTxt:   { fontSize: 13, fontWeight: '700', color: C.muted },
  tabTxtOn: { color: C.text },

  // 3+ service cards (filter)
  cardsWrap: { paddingTop: 12 },
  cardsRow:  { paddingHorizontal: 16, gap: 10 },
  svcCard:   { width: 96, padding: 11, borderRadius: rs(14), backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'flex-start', ...cardShadow },
  svcCardOn: { backgroundColor: C.g600, borderColor: C.g600 },
  svcCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  svcCardName: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '800', color: C.text },
  svcCardCnt:  { fontSize: 10, fontWeight: '600', color: C.muted, marginTop: 2 },

  // Active / Completed
  statusWrap:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  statusBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, borderRadius: rs(12), backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  statusBtnOn:   { backgroundColor: C.g900, borderColor: C.g900 },
  statusTxt:     { fontSize: 13, fontWeight: '800', color: C.sub },
  statusTxtOn:   { color: '#fff' },
  statusPill:    { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  statusPillOn:  { backgroundColor: 'rgba(255,255,255,0.22)' },
  statusPillTxt: { fontSize: 10, fontWeight: '800', color: C.sub },
  statusPillTxtOn: { color: '#fff' },

  body: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },

  // ── Card ──
  card: {
    backgroundColor: C.card,
    borderRadius: rs(18),
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardRail: { width: 4 },
  cardInner: { flex: 1, padding: 12, minWidth: 0 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  typeIconBox: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
  bookingNumber: { fontFamily: DISPLAY, fontSize: 11.5, color: C.sub, fontWeight: '700', marginTop: 1 },
  statusPillCard: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusPillCardTxt: { fontSize: 9.5, fontWeight: '800' },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar:      { width: 28, height: 28, borderRadius: 10, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt:   { fontSize: 12, fontWeight: '800', color: C.g700 },
  cardName:    { fontFamily: DISPLAY, fontSize: 16, color: C.text, flex: 1 },

  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { fontSize: 11, color: C.sub, fontWeight: '600' },

  moneyBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  moneyTotal: { fontFamily: DISPLAY, fontSize: 18, color: C.g700 },

  // ── Empty ──
  empty:      { alignItems: 'center', paddingTop: 56, paddingHorizontal: 30 },
  emptyArt: {
    width: rs(140), height: rs(112), marginBottom: rs(16),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(12), right: rs(20),
    width: rs(88), height: rs(64), borderRadius: rs(14),
    backgroundColor: C.g100, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(88), height: rs(78), borderRadius: rs(16),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.g100,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(4), right: rs(16),
    width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: C.g500,
    borderWidth: rs(3), borderColor: C.bg,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(8), left: rs(4),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g100,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontSize: 8.5, fontWeight: '800', color: C.g700, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, color: C.text, textTransform: 'capitalize', textAlign: 'center' },
  emptySub:   { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 4 },
});

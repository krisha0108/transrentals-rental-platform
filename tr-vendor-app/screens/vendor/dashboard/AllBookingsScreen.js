import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorEarnings } from '../../api/client';
import { SC as T, G, rs, rf, cardShadow } from '../_shared/theme';
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
  blue:    T.blue, purple: T.purple, amber: T.amber, orange: T.orange,
  indigo:  T.indigo, pink: T.rose, cyan: T.oceanLight,
};

// service tag (from earnings.bookingsList) → icon/color + detail screen
const SVC_META = {
  bike:         { name: 'Bike',       icon: 'motorbike',       color: C.amber,  screen: 'BikeBookingDetail',       st: 'bike' },
  'self-drive': { name: 'Self Drive', icon: 'car-side',        color: C.cyan,   screen: 'SelfDriveBookingDetail',  st: 'self-drive' },
  'car-rental': { name: 'Car Rental', icon: 'car',             color: C.g600,   screen: 'CarRentalBookingDetail',  st: 'car' },
  bus:          { name: 'Bus',        icon: 'bus',             color: C.pink,   screen: 'BusBookingDetail',        st: 'bus' },
  truck:        { name: 'Transporter',icon: 'truck-delivery',  color: C.orange, screen: 'TruckBookingDetail',      st: 'truck' },
  packers:      { name: 'Packers',    icon: 'package-variant', color: C.purple, screen: 'PackersBookingDetail',    st: 'packers' },
  equipment:    { name: 'Equipment',  icon: 'crane',           color: C.indigo, screen: 'EquipmentBookingDetail',  st: 'equipment' },
  luxury:       { name: 'Luxury',     icon: 'car-sports',      color: C.blue,   screen: 'LuxuryBookingDetail',     st: 'luxury' },
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
};

const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  catch { return ''; }
};
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function AllBookingsScreen({ navigation, route }) {
  const [list, setList]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]               = useState(route?.params?.initialTab === 'completed' ? 'completed' : 'ongoing');
  const [svcFilter, setSvcFilter]   = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await getVendorEarnings();
      setList(Array.isArray(data?.bookingsList) ? data.bookingsList : []);
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const tabItems = useMemo(() => list.filter(b =>
    tab === 'completed' ? b.status === 'COMPLETED' : b.status !== 'COMPLETED'
  ), [list, tab]);

  const ongoingCount   = useMemo(() => list.filter(b => b.status !== 'COMPLETED').length, [list]);
  const completedCount = useMemo(() => list.filter(b => b.status === 'COMPLETED').length, [list]);

  const serviceFilters = useMemo(() => {
    const present = new Set();
    tabItems.forEach(b => present.add(b.service));
    return ['all', ...present];
  }, [tabItems]);

  const filtered = useMemo(
    () => tabItems.filter(b => svcFilter === 'all' || b.service === svcFilter),
    [tabItems, svcFilter],
  );

  const openDetail = (b) => {
    const meta = SVC_META[b.service];
    if (meta?.screen) navigation.navigate(meta.screen, { bookingId: b.id, serviceType: meta.st });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Header */}
      <LinearGradient colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Bookings</Text>
              <Text style={s.headerSub}>Across all your services</Text>
            </View>
          </View>

          <View style={s.toggle}>
            {[
              { key: 'ongoing',   label: 'Ongoing',   count: ongoingCount },
              { key: 'completed', label: 'Completed', count: completedCount },
            ].map(t => {
              const active = tab === t.key;
              return (
                <TouchableOpacity key={t.key} activeOpacity={0.8}
                  style={[s.toggleBtn, active && s.toggleBtnActive]} onPress={() => setTab(t.key)}>
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

      {/* Service filter chips */}
      {serviceFilters.length > 1 && (
        <View style={s.chipsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRowOuter} contentContainerStyle={s.chipsRow}>
            {serviceFilters.map(f => {
              const active = svcFilter === f;
              const meta = SVC_META[f];
              return (
                <TouchableOpacity key={f} activeOpacity={0.8}
                  style={[s.chip, active && s.chipActive]} onPress={() => setSvcFilter(f)}>
                  {meta && <MaterialCommunityIcons name={meta.icon} size={13} color={active ? '#fff' : meta.color} />}
                  <Text numberOfLines={1} style={[s.chipTxt, active && s.chipTxtActive]}>{f === 'all' ? 'All' : meta?.name || f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={s.body}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={s.card}>
              <View style={s.cardTop}>
                <Bone w={40} h={40} r={12} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Bone w={140} h={12} r={4} />
                  <Bone w={90} h={10} r={4} />
                </View>
                <Bone w={60} h={20} r={10} />
              </View>
              <View style={s.cardBottom}>
                <View style={s.customer}>
                  <Bone w={26} h={26} r={13} />
                  <Bone w={90} h={11} r={4} />
                </View>
                <Bone w={60} h={11} r={4} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g400} />}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="cube-outline" size={28} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>No {tab} bookings</Text>
              <Text style={s.emptySub}>
                {tab === 'ongoing' ? 'Active bookings will show up here.' : 'Completed trips will appear here.'}
              </Text>
            </View>
          ) : (
            filtered.map((b) => {
              const meta = SVC_META[b.service] || { name: b.serviceName || b.service, icon: 'cube', color: C.muted };
              const sm   = STATUS_META[b.status] || { label: b.status, color: C.muted };
              return (
                <TouchableOpacity key={`${b.service}:${b.id}`} style={s.card} activeOpacity={0.85}
                  onPress={() => openDetail(b)}>
                  <View style={s.cardTop}>
                    <View style={[s.iconBox, { backgroundColor: meta.color + '14' }]}>
                      <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle} numberOfLines={1}>{meta.name}{b.bookingNumber ? ` · ${b.bookingNumber}` : ''}</Text>
                      {!!b.location && <Text style={s.cardSub} numberOfLines={1}>{b.location}</Text>}
                    </View>
                    <View style={[s.statusPill, { backgroundColor: sm.color + '14' }]}>
                      <Text style={[s.statusTxt, { color: sm.color }]}>{sm.label}</Text>
                    </View>
                  </View>
                  <View style={s.cardBottom}>
                    <View style={s.customer}>
                      <View style={s.avatar}><Text style={s.avatarTxt}>{(b.customerName || 'C').charAt(0)}</Text></View>
                      <Text style={s.customerTxt} numberOfLines={1}>{b.customerName || 'Customer'}</Text>
                    </View>
                    <View style={s.metaRight}>
                      {!!b.date && <Text style={s.dateTxt}>{fmtDate(b.date)}</Text>}
                      {b.amount > 0 && <Text style={s.amountTxt}>{money(b.amount)}</Text>}
                    </View>
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
  hero: { paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 18 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 2 },

  toggle:          { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 4, gap: 4 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  toggleBtnActive: { backgroundColor: C.g700 },
  toggleTxt:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  toggleTxtActive: { color: '#fff' },
  togglePill:      { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  togglePillActive:{ backgroundColor: 'rgba(255,255,255,0.22)' },
  togglePillTxt:   { fontSize: 11, fontWeight: '800', color: '#fff' },
  togglePillTxtActive: { color: '#fff' },

  chipsWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chipsRowOuter: { flexGrow: 0, flexShrink: 0, height: 62 },
  chipsRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive:{ backgroundColor: C.g700, borderColor: C.g700 },
  chipTxt:   { fontSize: 13, fontWeight: '700', color: C.sub },
  chipTxtActive: { color: '#fff' },

  body: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  card: {
    backgroundColor: C.card, borderRadius: rs(18), padding: 13, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  cardSub:   { fontSize: 12, color: C.sub, marginTop: 2 },
  statusPill:{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: rs(8) },
  statusTxt: { fontSize: 10.5, fontWeight: '800' },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  customer:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt:   { fontFamily: DISPLAY, fontSize: 12, fontWeight: '800', color: C.g700 },
  customerTxt: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '800', color: C.text, flex: 1 },
  metaRight:   { alignItems: 'flex-end' },
  dateTxt:     { fontSize: 11, color: C.muted, fontWeight: '600' },
  amountTxt:   { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.g700, marginTop: 1 },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyIcon:  { width: rs(60), height: rs(60), borderRadius: rs(30), backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6, ...cardShadow },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text, textTransform: 'capitalize' },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center' },
});

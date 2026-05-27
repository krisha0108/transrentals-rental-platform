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

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB',   blueL: '#EFF6FF',
  amber: '#D97706',  amberL: '#FFFBEB',
  red: '#DC2626',    redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  pink: '#DB2777',   pinkL: '#FDF2F8',
  teal: '#0D9488',   tealL: '#F0FDFA',
  cyan: '#0891B2',   cyanL: '#ECFEFF',
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
    const qOk = !q || b.customer.toLowerCase().includes(q) || b.bookingNumber.toLowerCase().includes(q);
    return statusOk && qOk;
  }), [svcScoped, status, q]);

  const count = approvedServices.length;

  const openDetail = (b) => {
    const svc = SERVICES[b.service];
    if (svc) navigation.navigate(svc.detail, { bookingId: b.id, serviceType: svc.st });
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
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

        {/* Search */}
        <View style={st.searchBox}>
          <Icon name="search" size={15} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
          <TextInput
            style={st.searchInput}
            placeholder="Search customer or booking #"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query} onChangeText={setQuery}
            returnKeyType="search" autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={15} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

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

      {/* ── List ── */}
      {loading ? (
        <View style={st.empty}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={[st.emptySub, { marginTop: 12 }]}>Loading bookings…</Text>
        </View>
      ) : count === 0 ? (
        <View style={st.empty}>
          <View style={st.emptyIcon}><Ionicons name="cube-outline" size={28} color={C.muted} /></View>
          <Text style={st.emptyTitle}>No approved services yet</Text>
          <Text style={st.emptySub}>Bookings appear once your services go live.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}>
          {filtered.length === 0 ? (
            <View style={st.empty}>
              <View style={st.emptyIcon}><Ionicons name={status === 'completed' ? 'checkmark-done-outline' : 'time-outline'} size={28} color={C.muted} /></View>
              <Text style={st.emptyTitle}>No {status} bookings</Text>
              <Text style={st.emptySub}>{q ? `Nothing matches "${query}"` : (status === 'active' ? 'Active bookings will show up here.' : 'Completed trips will appear here.')}</Text>
            </View>
          ) : (
            filtered.map(b => {
              const svc = SERVICES[b.service] || { name: b.service, icon: 'cube', color: C.muted };
              const sm  = STATUS_META[b.status] || { label: b.status, color: C.muted };
              return (
                <TouchableOpacity key={`${b.service}:${b.id}`} style={st.card} activeOpacity={0.85}
                  onPress={() => openDetail(b)}>
                  <View style={st.cardTop}>
                    <View style={[st.cardIcon, { backgroundColor: svc.color + '14' }]}>
                      <MaterialCommunityIcons name={svc.icon} size={20} color={svc.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.cardTitle} numberOfLines={1}>{svc.name}{b.bookingNumber ? ` · ${b.bookingNumber}` : ''}</Text>
                      {!!b.location && <Text style={st.cardSub} numberOfLines={1}>{b.location}</Text>}
                    </View>
                    <View style={[st.badge, { backgroundColor: sm.color + '14' }]}>
                      <Text style={[st.badgeTxt, { color: sm.color }]}>{sm.label}</Text>
                    </View>
                  </View>
                  <View style={st.cardBottom}>
                    <View style={st.customer}>
                      <View style={st.avatar}><Text style={st.avatarTxt}>{b.customer.charAt(0)}</Text></View>
                      <Text style={st.customerTxt} numberOfLines={1}>{b.customer}</Text>
                    </View>
                    <View style={st.metaRight}>
                      {!!b.date && <Text style={st.dateTxt}>{fmtDate(b.date)}</Text>}
                      {b.amount > 0 && <Text style={st.amountTxt}>{money(b.amount)}</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  hero:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  heroTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  refreshBtn:{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  // 2-service tabs
  tabsWrap: { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  tabOn:    { backgroundColor: C.g50, borderColor: C.g500 },
  tabTxt:   { fontSize: 13, fontWeight: '700', color: C.muted },
  tabTxtOn: { color: C.text },

  // 3+ service cards (filter)
  cardsWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  cardsRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  svcCard:   { width: 96, padding: 11, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'flex-start' },
  svcCardOn: { backgroundColor: C.g600, borderColor: C.g600 },
  svcCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  svcCardName: { fontSize: 12, fontWeight: '800', color: C.text },
  svcCardCnt:  { fontSize: 10, fontWeight: '600', color: C.muted, marginTop: 2 },

  // Active / Completed
  statusWrap:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  statusBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 9, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  statusBtnOn:   { backgroundColor: C.g900, borderColor: C.g900 },
  statusTxt:     { fontSize: 13, fontWeight: '800', color: C.sub },
  statusTxtOn:   { color: '#fff' },
  statusPill:    { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  statusPillOn:  { backgroundColor: 'rgba(255,255,255,0.22)' },
  statusPillTxt: { fontSize: 10, fontWeight: '800', color: C.sub },
  statusPillTxtOn: { color: '#fff' },

  body: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  card: { backgroundColor: C.card, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 12.5, fontWeight: '800', color: C.text },
  cardSub:   { fontSize: 11, color: C.sub, marginTop: 2 },
  badge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTxt:  { fontSize: 9.5, fontWeight: '800' },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  customer:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt:   { fontSize: 11, fontWeight: '800', color: C.g700 },
  customerTxt: { fontSize: 12, fontWeight: '600', color: C.text, flex: 1 },
  metaRight:   { alignItems: 'flex-end' },
  dateTxt:     { fontSize: 10, color: C.muted, fontWeight: '600' },
  amountTxt:   { fontSize: 13, fontWeight: '800', color: C.g700, marginTop: 1 },

  empty:      { alignItems: 'center', paddingTop: 70, gap: 6 },
  emptyIcon:  { width: 60, height: 60, borderRadius: 30, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.text, textTransform: 'capitalize' },
  emptySub:   { fontSize: 12, color: C.muted, textAlign: 'center', paddingHorizontal: 30 },
});

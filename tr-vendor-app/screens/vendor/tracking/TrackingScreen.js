import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, TextInput, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, getBaseURL } from '../../api/client';
import LiveMap from './LiveMap';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
};

const POLL_MS = 12000;
const SCREEN_H = Dimensions.get('window').height;

const STATUS_META = {
  moving:  { label: 'Moving',  color: C.g600,  dot: C.g500,  bg: C.g50 },
  idle:    { label: 'Idle',    color: C.amber, dot: C.amber, bg: C.amberL },
  offline: { label: 'Offline', color: C.muted, dot: C.muted, bg: C.bg },
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function timeAgo(d) {
  if (!d) return 'never';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TrackingScreen({ navigation }) {
  const [drivers, setDrivers]       = useState([]);
  const [stats, setStats]           = useState({ total: 0, sharing: 0, moving: 0, idle: 0, offline: 0, onTrip: 0 });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive]         = useState(true);
  const [filter, setFilter]         = useState('all');   // all | onTrip | moving | idle | offline
  const [query, setQuery]           = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [satellite, setSatellite]     = useState(false);
  const [baseURL, setBaseURL]         = useState('');

  useEffect(() => { getBaseURL().then(u => setBaseURL(u || '')).catch(() => {}); }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiGet('/vendor/tracking/live');
      const data = res?.data || {};
      if (data.success) {
        setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
        if (data.stats) setStats(data.stats);
      }
    } catch (_) { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  // Load on focus; auto-poll while live AND focused; stop polling on blur.
  useFocusEffect(useCallback(() => {
    load();
    let id = null;
    if (isLive) id = setInterval(load, POLL_MS);
    return () => { if (id) clearInterval(id); };
  }, [load, isLive]));

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => drivers.filter(d => {
    const fOk =
      filter === 'all'    ? true :
      filter === 'onTrip' ? !!d.currentTrip :
      d.status === filter;
    const qOk = !q || d.name?.toLowerCase().includes(q) || (d.phone || '').includes(q);
    return fOk && qOk;
  }), [drivers, filter, q]);

  // Markers for the in-app Leaflet map (only drivers with a known fix).
  // Each marker carries name + photo so it renders as a driver avatar.
  const fullPhoto = (p) => (p ? (p.startsWith('http') ? p : `${baseURL}${p}`) : '');
  const markers = useMemo(() => filtered.filter(d => d.location).map(d => ({
    lat: d.location.lat,
    lng: d.location.lng,
    status: d.status,
    name: d.name,
    photo: fullPhoto(d.profilePhoto),
    label: `${d.name || 'Driver'} · ${(STATUS_META[d.status] || {}).label || ''}`,
  })), [filtered, baseURL]);

  const openMaps = (loc) => {
    if (!loc) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`).catch(() => {});
  };
  const call = (phone) => { if (phone) Linking.openURL(`tel:${phone}`).catch(() => {}); };

  const FILTERS = [
    { key: 'all',     label: 'All',     count: stats.total },
    { key: 'onTrip',  label: 'On Trip', count: stats.onTrip },
    { key: 'moving',  label: 'Moving',  count: stats.moving },
    { key: 'idle',    label: 'Idle',    count: stats.idle },
    { key: 'offline', label: 'Offline', count: stats.offline },
  ];

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
              <Text style={s.headerEyebrow}>FLEET TRACKING</Text>
              <Text style={s.headerTitle}>Live Tracking</Text>
              <Text style={s.headerSub}>{stats.sharing} of {stats.total} drivers sharing location</Text>
            </View>
            <TouchableOpacity style={[s.backBtn, { marginRight: 8 }]} activeOpacity={0.75}
              onPress={() => { setSearchOpen(v => !v); if (searchOpen) setQuery(''); }}>
              <Ionicons name={searchOpen ? 'close' : 'search'} size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.liveBtn, isLive && s.liveBtnOn]} activeOpacity={0.8} onPress={() => setIsLive(v => !v)}>
              <View style={[s.liveDot, { backgroundColor: isLive ? C.g400 : C.muted }]} />
              <Text style={s.liveTxt}>{isLive ? 'Live' : 'Paused'}</Text>
            </TouchableOpacity>
          </View>

          {/* Stat strip */}
          <View style={s.statRow}>
            {[
              { v: stats.onTrip,  l: 'On Trip', c: C.g400, icon: 'car-sport-outline' },
              { v: stats.moving,  l: 'Moving',  c: C.g400, icon: 'speedometer-outline' },
              { v: stats.idle,    l: 'Idle',    c: '#FCD34D', icon: 'pause-circle-outline' },
              { v: stats.offline, l: 'Offline', c: 'rgba(255,255,255,0.6)', icon: 'cloud-offline-outline' },
            ].map((m, i) => (
              <View key={i} style={s.statBox}>
                <Ionicons name={m.icon} size={14} color={m.c} style={{ marginBottom: 3 }} />
                <Text style={[s.statVal, { color: m.c }]}>{m.v}</Text>
                <Text style={s.statLbl}>{m.l}</Text>
              </View>
            ))}
          </View>

          {/* Search */}
          {searchOpen && (
          <View style={s.searchBox}>
            <Icon name="search" size={15} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search driver or phone"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={15} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Filter chips */}
      <View style={s.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRowOuter} contentContainerStyle={s.chipsRow}>
          {FILTERS.map(f => {
            const on = filter === f.key;
            return (
              <TouchableOpacity key={f.key} style={[s.chip, on && s.chipOn]} activeOpacity={0.8} onPress={() => setFilter(f.key)}>
                <Text numberOfLines={1} style={[s.chipTxt, on && s.chipTxtOn]}>{f.label}</Text>
                <View style={[s.chipPill, on && s.chipPillOn]}>
                  <Text style={[s.chipPillTxt, on && s.chipPillTxtOn]}>{f.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Live map — always visible; markers follow the active filter */}
      {loading ? (
        <View style={[s.mapWrap, s.mapSkeleton, { height: mapExpanded ? Math.round(SCREEN_H * 0.62) : 230 }]}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={28} color={C.border} />
        </View>
      ) : (
        <View style={[s.mapWrap, { height: mapExpanded ? Math.round(SCREEN_H * 0.62) : 230 }]}>
          <LiveMap markers={markers} satellite={satellite} style={{ flex: 1 }} />
          <View style={s.mapCtrls}>
            <TouchableOpacity style={s.mapBtn} activeOpacity={0.85} onPress={() => setSatellite(v => !v)}>
              <Ionicons name={satellite ? 'map-outline' : 'globe-outline'} size={18} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.mapBtn} activeOpacity={0.85} onPress={() => setMapExpanded(v => !v)}>
              <Ionicons name={mapExpanded ? 'contract-outline' : 'expand-outline'} size={18} color={C.text} />
            </TouchableOpacity>
          </View>
          {markers.length === 0 && (
            <View style={s.mapEmpty} pointerEvents="none">
              <Ionicons name="location-outline" size={13} color={C.muted} />
              <Text style={s.mapEmptyTxt}>No live locations in this view</Text>
            </View>
          )}
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={s.body}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.card}>
              <View style={s.cardTop}>
                <Bone w={40} h={40} r={20} />
                <View style={{ flex: 1 }}>
                  <Bone w={120} h={13} style={{ marginBottom: 6 }} />
                  <Bone w={70} h={10} />
                </View>
              </View>
              <View style={[s.locRow, { marginTop: 11 }]}>
                <Bone w={150} h={11} />
              </View>
              <View style={s.actions}>
                <Bone w="100%" h={34} r={10} style={{ flex: 1 }} />
                <Bone w="100%" h={34} r={10} style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><Ionicons name="navigate-outline" size={28} color={C.muted} /></View>
              <Text style={s.emptyTitle}>No drivers</Text>
              <Text style={s.emptySub}>{q ? `Nothing matches "${query}"` : 'No drivers in this view yet.'}</Text>
            </View>
          ) : (
            filtered.map(d => {
              const sm = STATUS_META[d.status] || STATUS_META.offline;
              return (
                <View key={d.id} style={s.card}>
                  <View style={s.cardTop}>
                    <View style={s.avatar}><Text style={s.avatarTxt}>{(d.name || 'D').charAt(0)}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name} numberOfLines={1}>{d.name || 'Driver'}</Text>
                      <View style={s.statusRow}>
                        <View style={[s.statusDot, { backgroundColor: sm.dot }]} />
                        <Text style={[s.statusTxt, { color: sm.color }]}>{sm.label}</Text>
                        {d.status === 'moving' && d.speed > 0 && <Text style={s.speedTxt}>· {d.speed} km/h</Text>}
                      </View>
                    </View>
                    {d.currentTrip && (
                      <View style={s.tripPill}>
                        <Ionicons name="car-outline" size={11} color={C.blue} />
                        <Text style={s.tripPillTxt}>On Trip</Text>
                      </View>
                    )}
                  </View>

                  {/* Location */}
                  <View style={s.locRow}>
                    <Ionicons name="location-outline" size={13} color={C.muted} />
                    <Text style={s.locTxt} numberOfLines={1}>
                      {d.location ? `${d.location.lat.toFixed(4)}, ${d.location.lng.toFixed(4)}` : 'No location shared'}
                    </Text>
                    <Text style={s.locTime}>{d.location ? timeAgo(d.location.updatedAt) : ''}</Text>
                  </View>

                  {/* Current trip detail */}
                  {d.currentTrip && (
                    <View style={s.tripBox}>
                      <Text style={s.tripCust} numberOfLines={1}>{d.currentTrip.customer || 'Customer'}{d.currentTrip.bookingNumber ? ` · ${d.currentTrip.bookingNumber}` : ''}</Text>
                      {(d.currentTrip.from || d.currentTrip.to) && (
                        <Text style={s.tripRoute} numberOfLines={1}>{[d.currentTrip.from, d.currentTrip.to].filter(Boolean).join('  →  ')}</Text>
                      )}
                      {d.vehicle && <Text style={s.tripVeh} numberOfLines={1}>{[d.vehicle.name, d.vehicle.number].filter(Boolean).join(' · ')}</Text>}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={s.actions}>
                    <TouchableOpacity style={[s.actBtn, !d.location && s.actBtnDisabled]} activeOpacity={0.85}
                      disabled={!d.location} onPress={() => openMaps(d.location)}>
                      <Ionicons name="map-outline" size={14} color={d.location ? '#fff' : C.muted} />
                      <Text style={[s.actBtnTxt, !d.location && { color: C.muted }]}>Open in Maps</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actBtn, s.callBtn]} activeOpacity={0.85} onPress={() => call(d.phone)}>
                      <Ionicons name="call-outline" size={14} color={C.g700} />
                      <Text style={[s.actBtnTxt, { color: C.g700 }]}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
  hero:        {
    paddingHorizontal: 16, paddingBottom: 14, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 16 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1.2, fontFamily: DISPLAY, marginBottom: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3, fontFamily: DISPLAY },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 2 },
  liveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  liveBtnOn:   { borderColor: 'rgba(52,211,153,0.5)' },
  liveDot:     { width: 7, height: 7, borderRadius: 4 },
  liveTxt:     { fontSize: 12, fontWeight: '800', color: '#fff' },

  statRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: rs(14), padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', marginBottom: 2, fontFamily: DISPLAY },
  statLbl: { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.3 },

  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  mapWrap:  { borderBottomWidth: 1, borderBottomColor: C.border, position: 'relative' },
  mapSkeleton: { backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center' },
  mapCtrls: { position: 'absolute', top: 10, right: 10, gap: 8 },
  mapBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...cardShadow },
  mapEmpty:    { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mapEmptyTxt: { fontSize: 12, fontWeight: '700', color: C.sub },

  chipsWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chipsRowOuter: { flexGrow: 0, flexShrink: 0, height: 62 },
  chipsRow:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipOn:    { backgroundColor: C.g600, borderColor: C.g600 },
  chipTxt:   { fontSize: 13, fontWeight: '700', color: C.sub },
  chipTxtOn: { color: '#fff' },
  chipPill:    { minWidth: 18, paddingHorizontal: 5, height: 16, borderRadius: 8, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  chipPillOn:  { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipPillTxt: { fontSize: 10.5, fontWeight: '800', color: C.sub },
  chipPillTxtOn: { color: '#fff' },

  body: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  card:    { backgroundColor: C.card, borderRadius: rs(14), padding: 13, borderWidth: 1, borderColor: C.border, ...cardShadow },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  name:    { fontSize: 14, fontWeight: '800', color: C.text, fontFamily: DISPLAY },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 12, fontWeight: '700' },
  speedTxt:  { fontSize: 12, color: C.muted, fontWeight: '600' },
  tripPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blueL, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tripPillTxt: { fontSize: 10.5, fontWeight: '800', color: C.blue },

  locRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11 },
  locTxt:  { flex: 1, fontSize: 13, color: C.sub, fontWeight: '600' },
  locTime: { fontSize: 11, color: C.muted, fontWeight: '600' },

  tripBox:  { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: C.bg, gap: 3 },
  tripCust: { fontSize: 13, fontWeight: '700', color: C.text },
  tripRoute:{ fontSize: 12, color: C.sub },
  tripVeh:  { fontSize: 12, color: C.muted },

  actions:  { flexDirection: 'row', gap: 8, marginTop: 12 },
  actBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.g600, paddingVertical: 9, borderRadius: 10 },
  actBtnDisabled: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  callBtn:  { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  actBtnTxt:{ fontSize: 13.5, fontWeight: '800', color: '#fff' },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyIcon:  { width: 60, height: 60, borderRadius: 30, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.text, fontFamily: DISPLAY },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 30 },
});

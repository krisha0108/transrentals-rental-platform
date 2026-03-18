import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getBookings } from '../../api/client';

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

const SERVICES = [
  {
    id: 'bike', name: 'Bike Rental', sub: 'Two-wheeler rentals',
    icon: 'motorbike', color: C.blue, lightBg: C.blueL,
    screen: 'BikeBookings', apiService: 'bike',
    gradColors: ['#1D4ED8', '#2563EB'],
  },
  {
    id: 'car', name: 'Car Rental', sub: 'Chauffeur-driven cars',
    icon: 'car', color: C.teal, lightBg: C.tealL,
    screen: 'CarRentalBookings', apiService: 'car',
    gradColors: ['#0F766E', '#0D9488'],
  },
  {
    id: 'bus', name: 'Bus Rental', sub: 'Group transport',
    icon: 'bus', color: C.amber, lightBg: C.amberL,
    screen: 'BusBookings', apiService: 'bus',
    gradColors: ['#B45309', '#D97706'],
  },
  {
    id: 'truck', name: 'Truck Rental', sub: 'Heavy transport',
    icon: 'truck-delivery', color: C.orange, lightBg: C.orangeL,
    screen: 'TruckBookings', apiService: 'truck',
    gradColors: ['#C2410C', '#EA580C'],
  },
  {
    id: 'luxury', name: 'Luxury Car', sub: 'Premium vehicles',
    icon: 'car-sports', color: C.indigo, lightBg: C.indigoL,
    screen: 'LuxuryBookings', apiService: 'luxury',
    gradColors: ['#4338CA', '#4F46E5'],
  },
  {
    id: 'packers', name: 'Packers & Movers', sub: 'Moving services',
    icon: 'package-variant', color: C.pink, lightBg: C.pinkL,
    screen: 'PackersBookings', apiService: 'packers',
    gradColors: ['#BE185D', '#DB2777'],
  },
  {
    id: 'equipment', name: 'Equipment', sub: 'Heavy machinery',
    icon: 'crane', color: C.purple, lightBg: C.purpleL,
    screen: 'EquipmentBookings', apiService: 'equipment',
    gradColors: ['#6D28D9', '#7C3AED'],
  },
  {
    id: 'self-drive', name: 'Self Drive', sub: 'DIY car rentals',
    icon: 'car-side', color: C.cyan, lightBg: C.cyanL,
    screen: 'SelfDriveBookings', apiService: 'self-drive',
    gradColors: ['#0E7490', '#0891B2'],
  },
  {
    id: 'direct', name: 'Direct Bookings', sub: 'Your own customers',
    icon: 'book-plus-outline', color: C.g700, lightBg: C.g50,
    screen: 'DirectBookings', apiService: null,
    gradColors: [C.g800, C.g600],
  },
];

const COMPLETED_STATUSES = ['COMPLETED', 'CANCELLED'];

export default function BookingsListScreen({ navigation }) {
  const [counts, setCounts]         = useState({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = useCallback(async () => {
    const results = await Promise.allSettled(
      SERVICES.filter(s => s.apiService).map(async (s) => {
        try {
          const res  = await getBookings(s.apiService, { limit: 200 });
          const list = res?.bookings || [];
          return {
            id: s.id,
            total:     res?.pagination?.total ?? list.length,
            active:    list.filter(b => !COMPLETED_STATUSES.includes(b.status)).length,
            completed: list.filter(b => b.status === 'COMPLETED').length,
          };
        } catch {
          return { id: s.id, total: 0, active: 0, completed: 0 };
        }
      })
    );
    const map = {};
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) map[r.value.id] = r.value;
    });
    setCounts(map);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  const onRefresh = () => { setRefreshing(true); fetchCounts(); };

  const totalBookings     = Object.values(counts).reduce((s, c) => s + (c.total     || 0), 0);
  const activeBookings    = Object.values(counts).reduce((s, c) => s + (c.active    || 0), 0);
  const completedBookings = Object.values(counts).reduce((s, c) => s + (c.completed || 0), 0);
  const completionRate    = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

  // Services that have active bookings right now
  const activeServices = SERVICES.filter(s => (counts[s.id]?.active ?? 0) > 0);

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ─────────────── HERO HEADER ─────────────── */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
        <View style={[st.deco, { width: 200, height: 200, top: -80, right: -60, opacity: 0.07 }]} />
        <View style={[st.deco, { width: 100, height: 100, top: 20,  right: 120, opacity: 0.04 }]} />
        <View style={[st.deco, { width: 60,  height: 60,  bottom: -20, left: 40, opacity: 0.05 }]} />

        <View style={st.heroTop}>
          <View style={st.heroTitleWrap}>
            <View style={st.heroBadge}>
              <Ionicons name="calendar" size={13} color={C.g400} />
              <Text style={st.heroBadgeTxt}>Bookings Hub</Text>
            </View>
            <Text style={st.heroTitle}>All Bookings</Text>
            <Text style={st.heroSub}>
              {loading ? 'Loading your data...' : `${totalBookings} bookings across ${SERVICES.length} services`}
            </Text>
          </View>
          <TouchableOpacity style={st.refreshBtn} onPress={onRefresh}>
            <Icon name="refresh-cw" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={st.statsRow}>
          {[
            { label: 'Total',     value: loading ? '—' : String(totalBookings),     icon: 'layers',       color: C.g400 },
            { label: 'Active',    value: loading ? '—' : String(activeBookings),    icon: 'activity',     color: '#FCD34D' },
            { label: 'Completed', value: loading ? '—' : String(completedBookings), icon: 'check-circle', color: '#6EE7B7' },
            { label: 'Services',  value: String(SERVICES.length),                   icon: 'grid',         color: '#93C5FD' },
          ].map((stat, i) => (
            <View key={i} style={st.statBox}>
              <Icon name={stat.icon} size={14} color={stat.color} style={{ marginBottom: 6 }} />
              <Text style={st.statVal}>{stat.value}</Text>
              <Text style={st.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
        }
      >

        {/* ─────────────── SECTION: ACTIVE NOW ─────────────── */}
        {!loading && activeServices.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHead}>
              <View style={st.sectionHeadLeft}>
                <View style={st.activePulse} />
                <Text style={st.sectionTitle}>Active Now</Text>
              </View>
              <Text style={st.sectionSub}>{activeServices.length} service{activeServices.length > 1 ? 's' : ''} running</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.activeScroll}>
              {activeServices.map(svc => (
                <TouchableOpacity
                  key={svc.id}
                  style={st.activeCard}
                  onPress={() => navigation.navigate(svc.screen)}
                  activeOpacity={0.8}
                >
                  <View style={[st.activeCardAccent, { backgroundColor: svc.color }]} />
                  <LinearGradient colors={svc.gradColors} style={st.activeIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <MaterialCommunityIcons name={svc.icon} size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={st.activeCardName} numberOfLines={2}>{svc.name}</Text>
                  <View style={st.activeCountRow}>
                    <View style={st.activeDot} />
                    <Text style={st.activeCountTxt}>{counts[svc.id]?.active} active</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─────────────── SECTION: PERFORMANCE ─────────────── */}
        {!loading && totalBookings > 0 && (
          <View style={st.section}>
            <View style={st.sectionHead}>
              <View style={st.sectionHeadLeft}>
                <Icon name="trending-up" size={15} color={C.g700} />
                <Text style={st.sectionTitle}>Performance</Text>
              </View>
            </View>

            <View style={st.perfCard}>
              <View style={st.perfTop}>
                <View>
                  <Text style={st.perfLabel}>Completion Rate</Text>
                  <Text style={st.perfSub}>{completedBookings} of {totalBookings} bookings completed</Text>
                </View>
                <Text style={st.perfPct}>{completionRate}%</Text>
              </View>

              {/* Progress bar */}
              <View style={st.progressTrack}>
                <View style={[st.progressFill, { width: `${completionRate}%` }]} />
              </View>

              {/* Mini breakdown */}
              <View style={st.perfBreakdown}>
                <View style={st.perfStat}>
                  <View style={[st.perfDot, { backgroundColor: '#FCD34D' }]} />
                  <Text style={st.perfStatTxt}>{activeBookings} active</Text>
                </View>
                <View style={st.perfStat}>
                  <View style={[st.perfDot, { backgroundColor: C.g500 }]} />
                  <Text style={st.perfStatTxt}>{completedBookings} completed</Text>
                </View>
                <View style={st.perfStat}>
                  <View style={[st.perfDot, { backgroundColor: C.muted }]} />
                  <Text style={st.perfStatTxt}>{totalBookings - activeBookings - completedBookings} other</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─────────────── SECTION: ALL SERVICES ─────────────── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <View style={st.sectionHeadLeft}>
              <Icon name="grid" size={15} color={C.g700} />
              <Text style={st.sectionTitle}>All Services</Text>
            </View>
            <View style={st.countPill}>
              <Text style={st.countPillTxt}>{SERVICES.length}</Text>
            </View>
          </View>

          <View style={st.listCard}>
            {SERVICES.map((svc, idx) => {
              const c     = counts[svc.id];
              const total  = c?.total  ?? 0;
              const active = c?.active ?? 0;
              const isLast = idx === SERVICES.length - 1;

              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[st.listRow, !isLast && st.listRowBorder]}
                  onPress={() => navigation.navigate(svc.screen)}
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <LinearGradient colors={svc.gradColors} style={st.listIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <MaterialCommunityIcons name={svc.icon} size={20} color="#fff" />
                  </LinearGradient>

                  {/* Text */}
                  <View style={st.listText}>
                    <Text style={st.listName}>{svc.name}</Text>
                    <View style={st.listMeta}>
                      <Text style={st.listSub}>{svc.sub}</Text>
                      {active > 0 && (
                        <>
                          <Text style={st.listMetaDot}>·</Text>
                          <View style={st.listActiveDot} />
                          <Text style={st.listActiveTxt}>{active} active</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Right: count + chevron */}
                  <View style={st.listRight}>
                    {loading && !c ? (
                      <ActivityIndicator size="small" color={C.muted} />
                    ) : (
                      <View style={[st.listCountChip, { backgroundColor: svc.lightBg }]}>
                        <Text style={[st.listCount, { color: svc.color }]}>{total}</Text>
                      </View>
                    )}
                    <Icon name="chevron-right" size={16} color={C.muted} style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  /* ─── Hero ─── */
  hero: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  heroTitleWrap: { flex: 1 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8,
  },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.g400 },
  heroTitle:    { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox:   { flex: 1, alignItems: 'center' },
  statVal:   { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.3 },

  /* ─── Section wrapper ─── */
  section:       { marginBottom: 20 },
  sectionHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeadLeft:{ flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.text },
  sectionSub:    { fontSize: 12, color: C.muted },

  /* Active pulse dot */
  activePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.g500 },

  /* ─── Active Now cards (horizontal) ─── */
  activeScroll: { gap: 10, paddingBottom: 2 },
  activeCard: {
    width: 120,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  activeCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  activeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  activeCardName: { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 16, marginBottom: 8 },
  activeCountRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: C.g500 },
  activeCountTxt: { fontSize: 11, fontWeight: '700', color: C.g600 },

  /* ─── Performance card ─── */
  perfCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  perfTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  perfLabel: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 3 },
  perfSub:   { fontSize: 12, color: C.muted },
  perfPct:   { fontSize: 28, fontWeight: '900', color: C.g700, letterSpacing: -1 },

  progressTrack: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  progressFill:  { height: '100%', backgroundColor: C.g500, borderRadius: 4 },

  perfBreakdown: { flexDirection: 'row', gap: 16 },
  perfStat:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perfDot:       { width: 8, height: 8, borderRadius: 4 },
  perfStatTxt:   { fontSize: 12, color: C.sub, fontWeight: '500' },

  /* ─── All Services list ─── */
  countPill: {
    backgroundColor: C.g700, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countPillTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  listCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 13,
  },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },

  listIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

  listText:  { flex: 1 },
  listName:  { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  listMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  listSub:   { fontSize: 12, color: C.muted },
  listMetaDot:   { fontSize: 12, color: C.muted },
  listActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.g500 },
  listActiveTxt: { fontSize: 12, fontWeight: '600', color: C.g600 },

  listRight: { flexDirection: 'row', alignItems: 'center' },
  listCountChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  listCount: { fontSize: 13, fontWeight: '800' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getP2PStats, getP2PMyPostings, getP2PTransactions } from '../../api/client';
import { useVerificationGate, VerificationBanner } from '../../../components/VerificationGate';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

const SW = Dimensions.get('window').width;

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald, g300: shade(T.emerald, 20),
  g200: shade(T.emerald, 35), g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText,
  border: T.border,
  amber: T.amber, amberBg: T.amberLight,
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight,
  purple: T.purple, purpleBg: T.tintPlum,
};

const STATUS_COLORS = {
  ACTIVE:      '#10B981', PENDING:     '#F59E0B', CONFIRMED:   '#3B82F6',
  IN_PROGRESS: '#6366F1', COMPLETED:   '#10B981', CANCELLED:   '#EF4444',
};

export default function P2PDashboardScreen({ navigation }) {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  // Verification gate — Post* actions are write-actions and gated; browse
  // actions stay open so pending vendors can explore the marketplace.
  const { status: vendorStatus, gate, LockGateModal } = useVerificationGate(navigation);
  const [stats, setStats]             = useState(null);
  const [recentTx, setRecentTx]       = useState([]);
  const [activePostings, setActivePostings] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, txRes, postingsRes] = await Promise.all([
        getP2PStats().catch(() => null),
        getP2PTransactions({ limit: 5 }).catch(() => ({ transactions: [] })),
        getP2PMyPostings({ status: 'ACTIVE', limit: 4 }).catch(() => ({ vehicles: [], bookings: [] })),
      ]);
      setStats(statsRes?.stats || statsRes);
      setRecentTx(txRes?.transactions || []);
      const v = (postingsRes?.vehiclePostings || postingsRes?.vehicles || []).map(p => ({ ...p, _type: 'vehicle' }));
      const b = (postingsRes?.bookingPostings || postingsRes?.bookings || []).map(p => ({ ...p, _type: 'booking' }));
      setActivePostings([...v, ...b].slice(0, 4));
    } catch (e) { console.log('[P2P] fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const earnings = stats?.totalEarnings ? Number(stats.totalEarnings) : 0;
  const deals    = stats?.completedTransactions || stats?.completedDeals || 0;
  const posts    = stats?.activePostings || 0;
  const rating   = (stats?.averageRating || stats?.rating) ? Number(stats.averageRating || stats.rating).toFixed(1) : '—';

  const fmtEarnings = earnings >= 100000
    ? '₹' + (earnings / 100000).toFixed(1) + 'L'
    : earnings >= 1000
    ? '₹' + (earnings / 1000).toFixed(1) + 'K'
    : '₹' + earnings.toLocaleString('en-IN');

  const HeaderBlock = () => (
    <LinearGradient colors={G.hero} style={s.header}>
      {/* Decorative orbs */}
      <AnimatedOrb style={s.decCircleLg} />
      <AnimatedOrb style={s.decCircleMd} delay={1200} dx={-10} dy={8} />

      <SafeAreaView edges={['top']}>
        {/* Top nav row */}
        <View style={s.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBtn} activeOpacity={0.7}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.navCenter}>
            <Text style={s.navTitle}>P2P Marketplace</Text>
            <Text style={s.navSub}>Vendor-to-Vendor Network</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={s.navBtn} activeOpacity={0.7}>
            <Icon name="refresh-cw" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Earnings hero card */}
        <View style={s.heroCard}>
          <View style={s.heroIconCircle}>
            <MCI name="cash-multiple" size={26} color={C.g400} />
          </View>
          <View style={s.heroContent}>
            <Text style={s.heroLabel}>TOTAL EARNINGS</Text>
            <Text style={s.heroAmount}>{fmtEarnings}</Text>
            <View style={s.heroChipsRow}>
              <View style={s.heroChip}>
                <Text style={s.heroChipText}>Deals: {deals}</Text>
              </View>
              <View style={[s.heroChip, { marginLeft: 6 }]}>
                <Text style={s.heroChipText}>Active: {posts}</Text>
              </View>
            </View>
          </View>
          <View style={s.heroRatingBadge}>
            <MCI name="star" size={14} color={C.amber} />
            <Text style={s.heroRatingText}>{rating}</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />
      <HeaderBlock />
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.g600} />
        <Text style={s.loadingText}>Loading P2P data...</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      <HeaderBlock />

      <VerificationBanner status={vendorStatus} navigation={navigation} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Stats Strip (single card, 4 items) ── */}
        <View style={s.statsCard}>
          {[
            { val: fmtEarnings, lbl: 'Earnings',    color: C.g600 },
            { val: deals,       lbl: 'Deals Done',  color: C.blue },
            { val: posts,       lbl: 'Active Posts', color: C.purple },
            { val: rating,      lbl: 'Rating',       color: C.amber },
          ].map((st, i, arr) => (
            <View key={st.lbl} style={s.statItem}>
              <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
              {i < arr.length - 1 && <View style={s.statDivider} />}
            </View>
          ))}
        </View>

        {/* ── Quick Actions (2×2 pastel grid) ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            {[
              { label: 'Post Vehicle',   sub: 'Share idle vehicle',     icon: 'truck',                  mci: true,  pastel: '#E8FDF5', iconBg: C.g50,      iconColor: C.g600,   screen: 'PostVehicleScreen',   locked: true, lockLabel: 'post vehicles to the marketplace' },
              { label: 'Share Booking',  sub: 'Sub-contract a trip',    icon: 'share-variant',          mci: true,  pastel: '#F3EEFF', iconBg: '#EDE9FE',   iconColor: C.purple, screen: 'PostBookingScreen',   locked: true, lockLabel: 'share bookings with other vendors' },
              { label: 'Find Vehicles',  sub: 'Rent from vendors',      icon: 'magnify',                mci: true,  pastel: '#EFF6FF', iconBg: '#DBEAFE',   iconColor: C.blue,   screen: 'BrowseVehiclesScreen' },
              { label: 'Find Bookings',  sub: 'Accept load requests',   icon: 'text-box-search-outline', mci: true, pastel: '#FFFBEB', iconBg: '#FEF3C7',   iconColor: C.amber,  screen: 'BrowseBookingsScreen' },
            ].map(a => (
              <TouchableOpacity
                key={a.label}
                style={[s.actionCard, { backgroundColor: a.pastel }]}
                activeOpacity={0.85}
                onPress={a.locked ? gate(() => navigation.navigate(a.screen), a.lockLabel) : () => navigation.navigate(a.screen)}
              >
                <View style={[s.actionIconBox, { backgroundColor: a.iconBg }]}>
                  <MCI name={a.icon} size={24} color={a.iconColor} />
                </View>
                <Text style={[s.actionLabel, { color: a.iconColor }]}>{a.label}</Text>
                <Text style={s.actionSub}>{a.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Manage (white cards, subtle) ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Manage</Text>
          <View style={s.manageCard}>
            {[
              { label: 'My Postings', sub: `${posts} active listings`,  icon: 'format-list-bulleted', iconBg: C.g50,      iconColor: C.g700,   screen: 'MyPostingsScreen' },
              { label: 'My Activity', sub: `${deals} deals completed`,  icon: 'swap-horizontal',      iconBg: '#EDE9FE',   iconColor: C.purple, screen: 'P2PActivityScreen' },
            ].map((m, i, arr) => (
              <TouchableOpacity
                key={m.label}
                style={[s.manageRow, i < arr.length - 1 && s.manageRowBorder]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(m.screen)}
              >
                <View style={[s.manageIconBox, { backgroundColor: m.iconBg }]}>
                  <MCI name={m.icon} size={20} color={m.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.manageLabel}>{m.label}</Text>
                  <Text style={s.manageSub}>{m.sub}</Text>
                </View>
                <Icon name="chevron-right" size={18} color={C.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        {recentTx.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentTx.map(tx => {
              const sc = STATUS_COLORS[tx.tripStatus] || C.amber;
              return (
                <View key={tx.id} style={s.txCard}>
                  <View style={[s.txBar, { backgroundColor: sc }]} />
                  <View style={s.txContent}>
                    <View style={s.txTop}>
                      <Text style={s.txNum}>{tx.transactionNumber || 'TXN'}</Text>
                      <View style={[s.txBadge, { backgroundColor: sc + '18' }]}>
                        <View style={[s.txBadgeDot, { backgroundColor: sc }]} />
                        <Text style={[s.txBadgeText, { color: sc }]}>
                          {tx.tripStatus?.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <View style={s.txRouteRow}>
                      <View style={[s.txRouteDot, { backgroundColor: C.g500 }]} />
                      <Text style={s.txRouteCity} numberOfLines={1}>{tx.fromCity || '-'}</Text>
                      <View style={s.txRouteLine} />
                      <View style={[s.txRouteDot, { backgroundColor: C.red }]} />
                      <Text style={s.txRouteCity} numberOfLines={1}>{tx.toCity || '-'}</Text>
                    </View>
                    <View style={s.txBottom}>
                      <Text style={s.txVehicle}>{tx.vehicleName || '-'}</Text>
                      <Text style={s.txAmt}>₹{Number(tx.agreedAmount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Active Postings (horizontal scroll) ── */}
        {activePostings.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Active Postings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyPostingsScreen')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
              {activePostings.map(p => {
                const isV = p._type === 'vehicle';
                const tc  = isV ? C.blue   : C.purple;
                const tbg = isV ? '#EFF6FF' : '#F5F3FF';
                return (
                  <View key={p.id} style={s.postCard}>
                    <View style={s.postTop}>
                      <View style={[s.postTypeBadge, { backgroundColor: tbg }]}>
                        <MCI name={isV ? 'truck' : 'package-variant'} size={10} color={tc} />
                        <Text style={[s.postTypeText, { color: tc }]}>{isV ? 'VEHICLE' : 'BOOKING'}</Text>
                      </View>
                      <Text style={s.postNum} numberOfLines={1}>{p.postingNumber || ''}</Text>
                    </View>
                    <View style={s.postRouteRow}>
                      <View style={[s.postRouteDot, { backgroundColor: C.g500 }]} />
                      <Text style={s.postRouteCity} numberOfLines={1}>{p.fromCity || '-'}</Text>
                      <View style={s.postRouteLine} />
                      <View style={[s.postRouteDot, { backgroundColor: C.red }]} />
                      <Text style={s.postRouteCity} numberOfLines={1}>{p.toCity || '-'}</Text>
                    </View>
                    <View style={[s.postStatusChip, { backgroundColor: C.g50 }]}>
                      <View style={[s.postStatusDot, { backgroundColor: C.g500 }]} />
                      <Text style={[s.postStatusText, { color: C.g700 }]}>{p.status || 'ACTIVE'}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── How P2P Works ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How It Works</Text>
          {[
            { n: '1', icon: 'plus-circle',   mci: false, label: 'Post',    desc: 'Share your vehicle or sub-contract a booking', pastel: C.g50,      color: C.g600 },
            { n: '2', icon: 'account-group', mci: true,  label: 'Connect', desc: 'Other vendors discover and respond',            pastel: '#EFF6FF',  color: C.blue },
            { n: '3', icon: 'navigation',    mci: false, label: 'Execute', desc: 'Coordinate and complete the trip together',     pastel: '#F5F3FF',  color: C.purple },
            { n: '4', icon: 'trending-up',   mci: false, label: 'Earn',    desc: 'Payment settled securely on completion',        pastel: '#FFFBEB',  color: C.amber },
          ].map((h, i, arr) => (
            <View key={h.n} style={s.howRow}>
              {/* Left: step number + connector */}
              <View style={s.howLeft}>
                <View style={[s.howNumBadge, { backgroundColor: h.pastel }]}>
                  <Text style={[s.howNumText, { color: h.color }]}>{h.n}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.howConnector} />}
              </View>
              {/* Right: icon + text */}
              <View style={[s.howIconBox, { backgroundColor: h.pastel }]}>
                {h.mci
                  ? <MCI name={h.icon} size={18} color={h.color} />
                  : <Icon name={h.icon} size={18} color={h.color} />
                }
              </View>
              <View style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                <Text style={s.howLabel}>{h.label}</Text>
                <Text style={s.howDesc}>{h.desc}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
      {LockGateModal}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: C.muted, fontWeight: '600' },

  // Header
  header: { paddingBottom: 0, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  decCircleLg: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(16,185,129,0.06)', top: -60, right: -60,
  },
  decCircleMd: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(6,214,160,0.05)', bottom: -20, left: -20,
  },

  // Nav
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  navCenter: { flex: 1, marginHorizontal: 10, alignItems: 'center' },
  navTitle:  { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff' },
  navSub:    { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Earnings Hero Card
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: rs(20), padding: 20,
    marginHorizontal: 16, marginTop: 4, marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  heroIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(52,211,153,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  heroContent: { flex: 1 },
  heroLabel:   { fontSize: 10, color: C.g300, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heroAmount:  { fontFamily: DISPLAY, fontSize: 32, fontWeight: '900', color: C.g300, marginTop: 2, letterSpacing: -0.5 },
  heroChipsRow:{ flexDirection: 'row', marginTop: 6 },
  heroChip: {
    backgroundColor: 'rgba(110,231,183,0.15)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(110,231,183,0.25)',
  },
  heroChipText: { fontSize: 10, color: C.g300, fontWeight: '700' },
  heroRatingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    marginLeft: 10,
  },
  heroRatingText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#FCD34D', marginLeft: 2 },

  // Section
  section:     { paddingHorizontal: 16, marginTop: 22 },
  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:{ fontFamily: DISPLAY, fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  seeAll:      { fontSize: 13, color: C.g600, fontWeight: '700' },

  // Stats strip — single white card
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: rs(18), marginHorizontal: 16, marginTop: 16,
    paddingVertical: 16,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statItem:   { flex: 1, alignItems: 'center', position: 'relative' },
  statVal:    { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:    { fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 3 },
  statDivider:{ position: 'absolute', right: 0, top: '15%', width: 1, height: '70%', backgroundColor: C.border },

  // Quick Actions — 2x2 pastel grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: (SW - 42) / 2, borderRadius: rs(18), padding: 16,
    ...cardShadow,
  },
  actionIconBox:{ width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800' },
  actionSub:   { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 15 },

  // Manage — single white card with rows
  manageCard: {
    backgroundColor: C.surface, borderRadius: rs(18),
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  manageRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  manageRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  manageIconBox:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  manageLabel:     { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  manageSub:       { fontSize: 11, color: C.muted, marginTop: 2 },

  // Transactions
  txCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.surface, borderRadius: rs(14), marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  txBar:    { width: 4, alignSelf: 'stretch' },
  txContent:{ flex: 1, padding: 14 },
  txTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  txNum:    { fontSize: 12, fontWeight: '700', color: C.text, fontFamily: 'monospace' },
  txBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  txBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  txBadgeText:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  txRouteRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  txRouteDot:  { width: 7, height: 7, borderRadius: 4 },
  txRouteCity: { fontSize: 12, fontWeight: '700', color: C.sub, marginHorizontal: 6, maxWidth: SW * 0.22 },
  txRouteLine: { flex: 1, height: 1, backgroundColor: C.border },
  txBottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txVehicle:   { fontSize: 11, color: C.muted },
  txAmt:       { fontFamily: DISPLAY, fontSize: 15, fontWeight: '900', color: C.g700 },

  // Active Postings
  postCard: {
    width: SW * 0.65, backgroundColor: C.surface, borderRadius: rs(16), padding: 14,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  postTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  postTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  postTypeText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  postNum:       { fontSize: 10, color: C.muted, fontFamily: 'monospace', maxWidth: SW * 0.3 },
  postRouteRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postRouteDot:  { width: 7, height: 7, borderRadius: 4 },
  postRouteCity: { fontSize: 12, fontWeight: '700', color: C.sub, marginHorizontal: 6, maxWidth: SW * 0.2 },
  postRouteLine: { flex: 1, height: 1, backgroundColor: C.border },
  postStatusChip:{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  postStatusDot: { width: 6, height: 6, borderRadius: 3 },
  postStatusText:{ fontSize: 10, fontWeight: '700' },

  // How It Works — open rows, no card box
  howRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 0,
  },
  howLeft: { alignItems: 'center', width: 32 },
  howNumBadge: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  howNumText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '900' },
  howConnector: { width: 2, flex: 1, minHeight: 20, backgroundColor: C.border, marginTop: 4 },
  howIconBox:  { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  howLabel:    { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text, marginTop: 4 },
  howDesc:     { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 16 },
});

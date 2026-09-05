import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getB2BStats, getB2BMyQuotes } from '../../api/client';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: T.oceanLight, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight, amberDark: shade(T.amber, -15),
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight,
  purple: T.purple, purpleBg: T.tintPlum,
};

const QUOTE_STATUS = {
  SUBMITTED:    { label: 'Submitted',    bg: '#FEF3C7', text: '#92400E', dot: C.amber  },
  UNDER_REVIEW: { label: 'Under Review', bg: '#DBEAFE', text: '#1E40AF', dot: C.blue   },
  CONFIRMED:    { label: 'Confirmed',    bg: C.g100,    text: '#065F46', dot: C.g500   },
  REJECTED:     { label: 'Rejected',     bg: '#FEE2E2', text: '#991B1B', dot: C.red    },
  WITHDRAWN:    { label: 'Withdrawn',    bg: '#F1F5F9', text: '#475569', dot: C.muted  },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';
const fmtPrice = (n) => (n || 0).toLocaleString('en-IN');

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

export default function B2BDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // Custom tab bar is position:absolute — calculate its height manually
  // Container: paddingTop(8) + paddingBottom(ios:24/android:12) + inner paddingVertical(8+8) + item height(~44)
  const tabBarHeight = Platform.OS === 'ios'
    ? insets.bottom + 88
    : 96;
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [stats, setStats]               = useState({ openBookings: 0, myQuotes: 0, activeTrips: 0 });
  const [recentQuotes, setRecentQuotes] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, quotesRes] = await Promise.all([
        getB2BStats(),
        getB2BMyQuotes(null, { limit: 4 }),
      ]);
      setStats(statsData || { openBookings: 0, myQuotes: 0, activeTrips: 0 });
      setRecentQuotes(quotesRes.quotes || []);
    } catch (e) {
      console.error('B2B Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(C.g950);
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      {/* ── Fixed header (does not scroll) ── */}
      <LinearGradient colors={G.hero} style={[s.headerGrad, { paddingTop: insets.top + 12 }]}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} activeOpacity={0.8}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>B2B Module</Text>
            <Text style={s.headerSub}>Corporate Bookings &amp; Quotes</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: tabBarHeight + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Body content ── */}
        {loading ? (
          <>
            {/* Stats strip skeleton — separate cards, one per stat */}
            <View style={[s.statsStrip, s.statsStripBody]}>
              {[0, 1].map((i) => (
                <View key={i} style={s.stripCard}>
                  <Bone w={32} h={32} r={10} />
                  <View style={{ flex: 1 }}>
                    <Bone w={30} h={16} r={4} style={{ marginBottom: 4 }} />
                    <Bone w={80} h={11} r={3} />
                  </View>
                </View>
              ))}
            </View>

            {/* Quick Actions skeleton */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Quick Actions</Text>
              <View style={s.actionsGrid}>
                {[0, 1].map((i) => (
                  <View key={i} style={s.actionCard}>
                    <Bone w={42} h={42} r={12} />
                    <View style={s.actionText}>
                      <Bone w={110} h={13} style={{ marginBottom: 6 }} />
                      <Bone w={140} h={11} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent Quotes skeleton */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Recent Quotes</Text>
              <View style={s.card}>
                {[0, 1].map((i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.divider} />}
                    <View style={s.quoteRow}>
                      <Bone w={8} h={8} r={4} />
                      <View style={s.quoteBody}>
                        <View style={s.quoteTopRow}>
                          <Bone w={70} h={12} />
                          <Bone w={60} h={13} />
                        </View>
                        <View style={s.quoteBotRow}>
                          <Bone w={100} h={11} />
                          <Bone w={64} h={16} r={6} />
                        </View>
                        <Bone w={80} h={10} />
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Stats strip — separate cards, one per stat */}
            <View style={[s.statsStrip, s.statsStripBody]}>
              {[
                { label: 'Open Requests', value: stats.openBookings, icon: 'briefcase-outline',     route: 'B2BOpenBookings', color: C.blue,   bg: C.blueBg   },
                { label: 'My Quotes',     value: stats.myQuotes,     icon: 'file-document-outline', route: 'B2BMyQuotes',     color: C.purple, bg: C.purpleBg },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.stripCard}
                  onPress={() => navigation.navigate(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={[s.stripIconBox, { backgroundColor: item.bg }]}>
                    <MCI name={item.icon} size={16} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.stripValue}>{item.value}</Text>
                    <Text style={s.stripLabel}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Quick Actions</Text>
              <View style={s.actionsGrid}>
                {[
                  { title: 'Open Requests', sub: 'Browse & submit quotes', icon: 'briefcase-search',          iconColor: C.blue,   iconBg: C.blueBg,   border: C.blue,   count: stats.openBookings, route: 'B2BOpenBookings' },
                  { title: 'My Quotes',     sub: 'Track your submissions', icon: 'file-document-edit-outline', iconColor: C.purple, iconBg: C.purpleBg, border: C.purple, count: stats.myQuotes,     route: 'B2BMyQuotes'     },
                ].map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.actionCard, { borderLeftColor: a.border }]}
                    onPress={() => navigation.navigate(a.route)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.actionIconBox, { backgroundColor: a.iconBg }]}>
                      <MCI name={a.icon} size={22} color={a.iconColor} />
                    </View>
                    <View style={s.actionText}>
                      <Text style={s.actionTitle}>{a.title}</Text>
                      <Text style={s.actionSub}>{a.sub}</Text>
                    </View>
                    {a.count > 0 && (
                      <View style={[s.actionBadge, { backgroundColor: a.iconBg }]}>
                        <Text style={[s.actionBadgeText, { color: a.iconColor }]}>{a.count}</Text>
                      </View>
                    )}
                    <Icon name="chevron-right" size={16} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Quotes */}
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>Recent Quotes</Text>
                {recentQuotes.length > 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate('B2BMyQuotes')} activeOpacity={0.7}>
                    <Text style={s.viewAll}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {recentQuotes.length === 0 ? (
                <View style={s.emptyCard}>
                  <MCI name="file-search-outline" size={34} color={C.muted} />
                  <Text style={s.emptyTitle}>No quotes yet</Text>
                  <Text style={s.emptySub}>Browse open requests and submit your first quote</Text>
                  <TouchableOpacity
                    style={s.emptyBtn}
                    onPress={() => navigation.navigate('B2BOpenBookings')}
                    activeOpacity={0.8}
                  >
                    <Text style={s.emptyBtnText}>Browse Open Requests</Text>
                    <Icon name="arrow-right" size={14} color={C.g700} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.card}>
                  {recentQuotes.map((quote, i) => {
                    const sc = QUOTE_STATUS[quote.status] || { label: quote.status, bg: '#F1F5F9', text: C.sub, dot: C.muted };
                    const booking = quote.b2bBooking || quote.booking || {};
                    return (
                      <React.Fragment key={quote.id || i}>
                        {i > 0 && <View style={s.divider} />}
                        <TouchableOpacity
                          style={s.quoteRow}
                          onPress={() => navigation.navigate('B2BBookingDetail', { bookingId: quote.bookingId || booking.id })}
                          activeOpacity={0.75}
                        >
                          <View style={[s.quoteDot, { backgroundColor: sc.dot }]} />
                          <View style={s.quoteBody}>
                            <View style={s.quoteTopRow}>
                              <Text style={s.quoteNum}>#{quote.quoteNumber || quote.id?.slice(0, 8)}</Text>
                              <Text style={s.quotePrice}>₹{fmtPrice(quote.totalPrice)}</Text>
                            </View>
                            <View style={s.quoteBotRow}>
                              <Text style={s.quoteCompany} numberOfLines={1}>
                                Booking #{booking.bookingNumber || booking.id?.slice(0, 8)}
                              </Text>
                              <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
                                <Text style={[s.statusChipText, { color: sc.text }]}>{sc.label}</Text>
                              </View>
                            </View>
                            <Text style={s.quoteDate}>{fmt(quote.createdAt)}</Text>
                          </View>
                          <Icon name="chevron-right" size={15} color={C.muted} />
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
            </View>

            {/* How It Works */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>How It Works</Text>
              <View style={s.card}>
                {[
                  { num: '1', title: 'Browse Bookings',     desc: 'Find open corporate bookings and submit your quote with vehicles & pricing', color: C.blue   },
                  { num: '2', title: 'Quote Gets Reviewed', desc: 'Manager reviews all vendor quotes and creates a super quote for the company', color: C.purple },
                  { num: '3', title: 'Get Confirmed',       desc: 'If your quote is selected, trips are auto-assigned to your account',         color: C.amber  },
                  { num: '4', title: 'Manage Trips',        desc: 'Manage your assigned trips directly from the app in real time',               color: C.g600   },
                ].map((step, i, arr) => (
                  <View key={i} style={[s.howRow, i === arr.length - 1 && { paddingBottom: 16 }]}>
                    <View style={s.howLeft}>
                      <View style={[s.howNumBox, { backgroundColor: step.color + '18', borderColor: step.color + '50' }]}>
                        <Text style={[s.howNumText, { color: step.color }]}>{step.num}</Text>
                      </View>
                      {i < arr.length - 1 && <View style={s.howLine} />}
                    </View>
                    <View style={[s.howContent, i < arr.length - 1 && { paddingBottom: 18 }]}>
                      <Text style={s.howTitle}>{step.title}</Text>
                      <Text style={s.howDesc}>{step.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: {},

  /* Header */
  headerGrad: {
    paddingHorizontal: 16, paddingBottom: 8,
    overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: DISPLAY },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  statsStrip: { flexDirection: 'row', gap: 10 },
  statsStripBody: { paddingHorizontal: 16, paddingTop: 16 },
  stripCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border, ...cardShadow,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  stripIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  stripValue: { color: C.text, fontSize: 16, fontWeight: '800', fontFamily: DISPLAY },
  stripLabel: { color: C.muted, fontSize: 11, marginTop: 1 },

  /* Section */
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  viewAll: { fontSize: 14, fontWeight: '600', color: C.g600 },

  /* Card */
  card: {
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  /* Actions */
  actionsGrid: { gap: 10 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3,
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
    ...cardShadow,
  },
  actionIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  actionSub: { fontSize: 13, color: C.muted, marginTop: 1 },
  actionBadge: { minWidth: 28, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  actionBadgeText: { fontSize: 13, fontWeight: '800' },

  /* Quotes */
  quoteRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  quoteDot: { width: 8, height: 8, borderRadius: 4 },
  quoteBody: { flex: 1 },
  quoteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  quoteNum: { fontSize: 13, fontWeight: '700', color: C.text },
  quotePrice: { fontSize: 14, fontWeight: '800', color: C.g600, fontFamily: DISPLAY },
  quoteBotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  quoteCompany: { fontSize: 13, color: C.sub, flex: 1, marginRight: 8 },
  statusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  quoteDate: { fontSize: 11, color: C.muted },

  /* Empty */
  emptyCard: {
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 4, fontFamily: DISPLAY },
  emptySub: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.g50, borderRadius: 20, marginTop: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: C.g300,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: C.g700 },

  /* How It Works */
  howRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
  howLeft: { alignItems: 'center', width: 36, marginRight: 12 },
  howNumBox: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  howNumText: { fontSize: 14, fontWeight: '800' },
  howLine: { width: 1.5, height: 24, backgroundColor: C.border, marginTop: 4 },
  howContent: { flex: 1, paddingBottom: 8 },
  howTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3, fontFamily: DISPLAY },
  howDesc: { fontSize: 13, color: C.sub, lineHeight: 18 },

});

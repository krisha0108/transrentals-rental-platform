import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getB2BStats, getB2BMyQuotes } from '../../api/client';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

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
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />

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

        {/* Stats strip */}
        <View style={s.statsStrip}>
          {[
            { label: 'Open Requests', value: stats.openBookings, icon: 'briefcase-outline',     route: 'B2BOpenBookings' },
            { label: 'My Quotes',     value: stats.myQuotes,     icon: 'file-document-outline', route: 'B2BMyQuotes'     },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={s.stripDiv} />}
              <TouchableOpacity
                style={s.stripItem}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.7}
              >
                <MCI name={item.icon} size={15} color="rgba(255,255,255,0.55)" style={{ marginBottom: 4 }} />
                <Text style={s.stripValue}>{loading ? '—' : item.value}</Text>
                <Text style={s.stripLabel}>{item.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
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
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={C.g600} />
            <Text style={s.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
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
  headerGrad: { paddingHorizontal: 16, paddingBottom: 20 },
  deco1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -30, right: -30,
  },
  deco2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: 0, left: -20,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: DISPLAY },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: rs(14),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stripDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  stripValue: { color: '#fff', fontSize: 22, fontWeight: '800', fontFamily: DISPLAY },
  stripLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 2, textAlign: 'center' },

  /* Section */
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  viewAll: { fontSize: 13, fontWeight: '600', color: C.g600 },

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
  actionSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  actionBadge: { minWidth: 28, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  actionBadgeText: { fontSize: 12, fontWeight: '800' },

  /* Quotes */
  quoteRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  quoteDot: { width: 8, height: 8, borderRadius: 4 },
  quoteBody: { flex: 1 },
  quoteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  quoteNum: { fontSize: 12, fontWeight: '700', color: C.text },
  quotePrice: { fontSize: 13, fontWeight: '800', color: C.g600, fontFamily: DISPLAY },
  quoteBotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  quoteCompany: { fontSize: 12, color: C.sub, flex: 1, marginRight: 8 },
  statusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusChipText: { fontSize: 9, fontWeight: '700' },
  quoteDate: { fontSize: 10, color: C.muted },

  /* Empty */
  emptyCard: {
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 4, fontFamily: DISPLAY },
  emptySub: { fontSize: 12, color: C.sub, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.g50, borderRadius: 20, marginTop: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: C.g300,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: C.g700 },

  /* How It Works */
  howRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
  howLeft: { alignItems: 'center', width: 36, marginRight: 12 },
  howNumBox: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  howNumText: { fontSize: 13, fontWeight: '800' },
  howLine: { width: 1.5, height: 24, backgroundColor: C.border, marginTop: 4 },
  howContent: { flex: 1, paddingBottom: 8 },
  howTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3, fontFamily: DISPLAY },
  howDesc: { fontSize: 12, color: C.sub, lineHeight: 18 },

  /* Loading */
  loadingWrap: { alignItems: 'center', paddingTop: 80, gap: 10 },
  loadingText: { fontSize: 13, color: C.muted },
});

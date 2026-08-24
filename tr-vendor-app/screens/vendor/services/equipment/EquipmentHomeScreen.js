import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBookingsByService, getVendorQuotes, getQuoteRequests } from '../../../api/client';
import { SC as T, G, rs, shade, cardShadow, alpha } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';

const { width: W } = Dimensions.get('window');
const CARD_W  = (W - 32 - 10) / 2;
const CHART_W = W - 32 - 32;

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight, amberM: shade(T.amber, 25),
  blue: T.blue, blueL: T.blueLight,
  purple: T.purple,
  orange: T.orange, orangeL: T.orangeL,
  red: T.red, redL: T.redLight,
  indigo: T.indigo, indigoL: T.indigoLight,
};

const STATUS_CFG = {
  IN_PROGRESS:      { label: 'Active',     bg: C.orangeL,  text: C.orange },
  CONFIRMED:        { label: 'Confirmed',  bg: C.g50,      text: C.g700   },
  ACCEPTED:         { label: 'Accepted',   bg: C.g50,      text: C.g700   },
  READY_FOR_PICKUP: { label: 'Ready',      bg: C.indigoL,  text: C.indigo },
  COMPLETED:        { label: 'Completed',  bg: C.blueL,    text: C.blue   },
  CANCELLED:        { label: 'Cancelled',  bg: C.redL,     text: C.red    },
  PENDING:          { label: 'Pending',    bg: C.amberL,   text: C.amber  },
  PENDING_VENDOR:   { label: 'Pending',    bg: C.amberL,   text: C.amber  },
  BROADCASTED:      { label: 'Open',       bg: C.blueL,    text: C.blue   },
};

const SERVICE_TYPE = 'equipment';
const SERVICE_NAME = 'Equipment Rental';
const SERVICE_ICON = 'hammer-wrench';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const fmtAmt = (v) => {
  if (!v) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '--';
const fmtTime = (t) => (t ? t.slice(0, 5) : '');

const computeChart = (bookings, period) => {
  const now = new Date();
  if (period === 'weekly') {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data   = [0, 0, 0, 0, 0, 0, 0];
    const todayDow    = now.getDay();
    const daysFromMon = todayDow === 0 ? 6 : todayDow - 1;
    const weekStart   = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMon);
    weekStart.setHours(0, 0, 0, 0);
    bookings.forEach(b => {
      const d = new Date(b.pickupDate || b.createdAt);
      if (d >= weekStart && d <= now) {
        const dow = d.getDay();
        data[dow === 0 ? 6 : dow - 1] += 1;
      }
    });
    return { labels, data };
  }
  if (period === 'monthly') {
    const labels     = ['W1', 'W2', 'W3', 'W4'];
    const data       = [0, 0, 0, 0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    bookings.forEach(b => {
      const d = new Date(b.pickupDate || b.createdAt);
      if (d >= monthStart && d <= now) {
        data[Math.min(3, Math.floor((d.getDate() - 1) / 7))] += 1;
      }
    });
    return { labels, data };
  }
  const MN   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = new Array(12).fill(0);
  bookings.forEach(b => {
    const d = new Date(b.pickupDate || b.createdAt);
    if (d.getFullYear() === now.getFullYear()) data[d.getMonth()] += 1;
  });
  const cm     = now.getMonth();
  const sliced = data.slice(0, Math.max(1, cm + 1));
  return { labels: MN.slice(0, sliced.length), data: sliced };
};

export default function EquipmentHomeScreen({ navigation }) {
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [period,      setPeriod]      = useState('weekly');
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState({
    quoteRequests: 0, myQuotes: 0, bookings: 0, activeTrips: 0, earnings: 0,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bookingRes, quoteReqRes, quotesRes] = await Promise.all([
        getBookingsByService(SERVICE_TYPE, { limit: 200 }).catch(() => ({ bookings: [] })),
        getQuoteRequests(SERVICE_TYPE, { limit: 1 }).catch(() => ({ requests: [], pagination: { total: 0 } })),
        getVendorQuotes(SERVICE_TYPE, { limit: 1 }).catch(() => ({ quotes: [], stats: {}, pagination: { total: 0 } })),
      ]);
      const bookings = bookingRes?.bookings || [];
      setAllBookings(bookings);
      const activeTrips   = bookings.filter(b => b.status === 'IN_PROGRESS').length;
      const totalBookings = bookings.filter(b =>
        ['ACCEPTED','CONFIRMED','IN_PROGRESS','COMPLETED','READY_FOR_PICKUP','PAYMENT_VERIFIED'].includes(b.status)
      ).length;
      const earnings = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((s, b) => s + (b.grandTotal || b.totalAmount || 0), 0);
      const openRequests  = quoteReqRes?.pagination?.total ?? quoteReqRes?.requests?.length ?? 0;
      const myQuotesCount = quotesRes?.stats?.total ?? quotesRes?.pagination?.total ?? quotesRes?.quotes?.length ?? 0;
      setStats({ quoteRequests: openRequests, myQuotes: myQuotesCount, bookings: totalBookings, activeTrips, earnings });
    } catch (e) {
      console.error('EquipmentHome fetchData error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const chartData = useMemo(() => computeChart(allBookings, period), [allBookings, period]);
  const allZero       = useMemo(() => chartData.data.every(v => v === 0), [chartData]);
  const safeChartData = useMemo(() => {
    const d = chartData.data;
    return allZero ? d.map((_, i) => i === 0 ? 0.001 : 0) : d;
  }, [chartData, allZero]);

  const now = new Date();
  const dayOfWeek     = now.getDay();
  const daysFromMon   = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - daysFromMon);
  thisWeekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekEarnings = useMemo(() =>
    allBookings
      .filter(b => ['COMPLETED','IN_PROGRESS'].includes(b.status) && new Date(b.pickupDate || b.createdAt) >= thisWeekStart)
      .reduce((s, b) => s + (b.totalAmount || b.price || 0), 0),
  [allBookings]);

  const lastWeekEarnings = useMemo(() =>
    allBookings
      .filter(b => {
        const d = new Date(b.pickupDate || b.createdAt);
        return ['COMPLETED','IN_PROGRESS'].includes(b.status) && d >= lastWeekStart && d < thisWeekStart;
      })
      .reduce((s, b) => s + (b.totalAmount || b.price || 0), 0),
  [allBookings]);

  const weekGrowth   = lastWeekEarnings > 0 ? ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings * 100).toFixed(0) : null;
  const weekPositive = Number(weekGrowth) >= 0;

  const recentBookings = useMemo(() =>
    [...allBookings]
      .sort((a, b) => new Date(b.createdAt || b.pickupDate) - new Date(a.createdAt || a.pickupDate))
      .slice(0, 3),
  [allBookings]);

  const upcomingBookings = useMemo(() =>
    allBookings
      .filter(b => ['CONFIRMED','ACCEPTED','READY_FOR_PICKUP','PAYMENT_VERIFIED'].includes(b.status) && new Date(b.pickupDate) > now)
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
      .slice(0, 2),
  [allBookings]);

  const activeTrips = useMemo(() => allBookings.filter(b => b.status === 'IN_PROGRESS'), [allBookings]);

  const manageItems = [
    { label: 'My Quotes',    sub: `${stats.myQuotes} sent`,     icon: 'document-text-outline', color: C.blue,   route: 'EquipmentMyQuotes',  params: undefined },
    { label: 'All Bookings', sub: `${stats.bookings} bookings`, icon: 'calendar-outline',      color: C.g600,   route: 'EquipmentBookings',  params: { serviceType: SERVICE_TYPE, serviceName: SERVICE_NAME, serviceIcon: SERVICE_ICON } },
    { label: 'Templates',    sub: 'Quote templates',            icon: 'copy-outline',          color: C.purple, route: 'EquipmentTemplates', params: undefined },
    { label: 'Earnings',     sub: fmtAmt(stats.earnings),       icon: 'trending-up-outline',   color: C.orange, route: 'EarningsScreen',     params: { serviceType: SERVICE_TYPE, serviceName: SERVICE_NAME } },
  ];

  const miniData = [
    { v: String(stats.bookings),    l: 'Bookings', icon: 'calendar-outline' },
    { v: String(stats.activeTrips), l: 'Active',   icon: 'flash-outline' },
    { v: fmtAmt(stats.earnings),    l: 'Earned',   icon: 'cash-outline' },
    { v: 'View All →',              l: 'Requests', accent: true, icon: 'arrow-forward-circle-outline' },
  ];

  const totalForPeriod = useMemo(() => Math.round(chartData.data.reduce((a, b) => a + b, 0)), [chartData]);
  const periodLabel    = period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'this year';

  const chartConfig = {
    backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff',
    backgroundGradientFromOpacity: 0, backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color:      (o = 1) => alpha(C.g600, o),
    labelColor: ()      => C.muted,
    barPercentage: 0.55,
    propsForBackgroundLines: { stroke: C.border, strokeWidth: 0.6, strokeDasharray: '3,3' },
    fillShadowGradient: C.g600, fillShadowGradientOpacity: 1,
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <SafeAreaView>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, marginBottom: 16 }}>
              <Bone w={34} h={34} r={10} />
              <View style={{ flex: 1, marginLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bone w={20} h={20} r={4} />
                <Bone w={120} h={16} r={5} />
              </View>
            </View>
            <View style={{ marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
              <Bone w={120} h={10} r={4} style={{ marginBottom: 8 }} />
              <Bone w={60} h={32} r={6} style={{ marginBottom: 16 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={{ alignItems: 'center', gap: 5 }}>
                    <Bone w={44} h={13} r={4} />
                    <Bone w={36} h={9} r={3} />
                  </View>
                ))}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ width: (W - 32 - 30) / 4, backgroundColor: C.card, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6 }}>
                <Bone w={32} h={32} r={8} />
                <Bone w={36} h={14} r={4} />
                <Bone w={28} h={9} r={3} />
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <Bone w={100} h={13} r={5} />
              <Bone w={80} h={24} r={12} />
            </View>
            <Bone w="100%" h={140} r={8} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ width: (W - 32 - 10) / 2, backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 8 }}>
                <Bone w={40} h={40} r={12} />
                <Bone w={80} h={13} r={4} />
                <Bone w={60} h={9} r={3} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <AnimatedOrb style={s.deco1} /><AnimatedOrb style={s.deco2} delay={900} dx={-12} dy={10} />
        <SafeAreaView>
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <View style={s.titleWrap}>
              <Text style={s.headerEyebrow}>EQUIPMENT RENTALS</Text>
              <View style={s.titleRow}>
                <MaterialCommunityIcons name={SERVICE_ICON} size={20} color={C.amber} />
                <Text style={s.headerTitle}>{SERVICE_NAME}</Text>
              </View>
            </View>
            <View style={{ width: 34 }} />
          </View>

          <TouchableOpacity style={s.quoteCard} onPress={() => navigation.navigate('EquipmentQuoteRequests')} activeOpacity={0.88}>
            <View style={s.quoteTop}>
              <View>
                <Text style={s.quoteLbl}>QUOTE REQUESTS</Text>
                <Text style={s.quoteNum}>{stats.quoteRequests}</Text>
              </View>
              <View style={s.pendingPill}>
                <View style={s.pendingDot} />
                <Text style={s.pendingTxt}>Pending</Text>
              </View>
            </View>
            <View style={s.miniStrip}>
              {miniData.map((m, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.vLine} />}
                  <View style={s.miniCell}>
                    <Ionicons
                      name={m.icon}
                      size={13}
                      color={m.accent ? C.g400 : 'rgba(255,255,255,0.55)'}
                      style={{ marginBottom: 3 }}
                    />
                    <Text style={[s.miniVal, m.accent && { color: C.g400, fontSize: 11 }]}>{m.v}</Text>
                    <Text style={s.miniLbl}>{m.l}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g500} />}
      >
        <View style={s.body}>

          {stats.quoteRequests > 0 && (
            <TouchableOpacity style={s.tipCard} onPress={() => navigation.navigate('EquipmentQuoteRequests')} activeOpacity={0.8}>
              <View style={s.tipIconWrap}>
                <Ionicons name="flash" size={18} color={C.amber} />
              </View>
              <Text style={s.tipText}>
                <Text style={s.tipBold}>{stats.quoteRequests} quote request{stats.quoteRequests > 1 ? 's' : ''} pending</Text>
                {' '}— respond quickly to win bookings!
              </Text>
              <Icon name="chevron-right" size={15} color={C.amber} />
            </TouchableOpacity>
          )}

          {activeTrips.length > 0 && (
            <TouchableOpacity
              style={s.activeCard}
              onPress={() => navigation.navigate('EquipmentBookings', { serviceType: SERVICE_TYPE, serviceName: SERVICE_NAME, serviceIcon: SERVICE_ICON })}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[C.orange, '#C2410C']} style={s.activeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={s.activeLiveDot} />
                <View style={s.activeLiveDotPulse} />
                <View style={{ flex: 1, marginLeft: 28 }}>
                  <Text style={s.activeTitle}>{activeTrips.length} Trip{activeTrips.length > 1 ? 's' : ''} In Progress</Text>
                  <Text style={s.activeSub}>Tap to view active bookings</Text>
                </View>
                <View style={s.activeCountBadge}>
                  <Text style={s.activeCountNum}>{activeTrips.length}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <Text style={s.sectionTitle}>This Week</Text>
          <View style={s.perfRow}>
            <View style={s.perfCard}>
              <Text style={s.perfLbl}>THIS WEEK</Text>
              <Text style={s.perfAmt}>{fmtAmt(thisWeekEarnings)}</Text>
              {weekGrowth !== null && (
                <View style={[s.growthRow, { marginTop: 6 }]}>
                  <Ionicons
                    name={weekPositive ? 'trending-up-outline' : 'trending-down-outline'}
                    size={13} color={weekPositive ? C.g500 : C.red}
                  />
                  <Text style={[s.growthTxt, { color: weekPositive ? C.g500 : C.red }]}>
                    {weekPositive ? '+' : ''}{weekGrowth}% vs last week
                  </Text>
                </View>
              )}
            </View>
            <View style={[s.perfCard, { backgroundColor: C.g50, borderColor: C.g100 }]}>
              <Text style={[s.perfLbl, { color: C.g600 }]}>LAST WEEK</Text>
              <Text style={[s.perfAmt, { color: C.g700 }]}>{fmtAmt(lastWeekEarnings)}</Text>
              <Text style={s.perfSub}>Comparison period</Text>
            </View>
          </View>

          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <View>
                <Text style={s.chartTitle}>Booking Activity</Text>
                <Text style={s.chartSub}>
                  {totalForPeriod} booking{totalForPeriod !== 1 ? 's' : ''} {periodLabel}
                </Text>
              </View>
              <View style={s.periodRow}>
                {[['weekly','W'], ['monthly','M'], ['yearly','Y']].map(([p, lbl]) => (
                  <TouchableOpacity
                    key={p}
                    style={[s.periodBtn, period === p && s.periodBtnActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <BarChart
              data={{ labels: chartData.labels, datasets: [{ data: safeChartData }] }}
              width={CHART_W}
              height={170}
              chartConfig={chartConfig}
              withInnerLines={true}
              withOuterLines={false}
              showValuesOnTopOfBars={!allZero}
              fromZero={true}
              style={{ borderRadius: 10, marginLeft: -10, marginTop: 14 }}
              formatYLabel={v => {
                if (allZero) return '';
                const n = Math.round(Number(v));
                return n > 0 ? String(n) : '';
              }}
            />
          </View>

          {upcomingBookings.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Upcoming Bookings</Text>
              {upcomingBookings.map(b => {
                const sc = STATUS_CFG[b.status] || { label: b.status, bg: C.border, text: C.muted };
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={s.bookingCard}
                    onPress={() => navigation.navigate('EquipmentBookingDetail', { bookingId: b.id, serviceType: SERVICE_TYPE })}
                    activeOpacity={0.8}
                  >
                    <View style={s.bookingLeft}>
                      <View style={[s.bookingDateBox, { backgroundColor: C.indigoL }]}>
                        <Text style={[s.bookingDateDay, { color: C.indigo }]}>{new Date(b.pickupDate).getDate()}</Text>
                        <Text style={[s.bookingDateMon, { color: C.indigo }]}>{new Date(b.pickupDate).toLocaleDateString('en-IN', { month: 'short' })}</Text>
                      </View>
                    </View>
                    <View style={s.bookingMid}>
                      <Text style={s.bookingName} numberOfLines={1}>{b.customerName || `#${b.bookingNumber}`}</Text>
                      <Text style={s.bookingTime}>{fmtDate(b.pickupDate)}{b.pickupTime ? ` · ${fmtTime(b.pickupTime)}` : ''}</Text>
                      {b.vehicleName && <Text style={s.bookingVehicle} numberOfLines={1}>{b.vehicleName}</Text>}
                    </View>
                    <View style={s.bookingRight}>
                      <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
                        <Text style={[s.statusChipTxt, { color: sc.text }]}>{sc.label}</Text>
                      </View>
                      {b.totalAmount > 0 && <Text style={s.bookingAmt}>{fmtAmt(b.totalAmount)}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {recentBookings.length > 0 && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recent Bookings</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EquipmentBookings', { serviceType: SERVICE_TYPE, serviceName: SERVICE_NAME, serviceIcon: SERVICE_ICON })}>
                  <Text style={s.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {recentBookings.map(b => {
                const sc = STATUS_CFG[b.status] || { label: b.status, bg: C.border, text: C.muted };
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={s.bookingCard}
                    onPress={() => navigation.navigate('EquipmentBookingDetail', { bookingId: b.id, serviceType: SERVICE_TYPE })}
                    activeOpacity={0.8}
                  >
                    <View style={s.bookingLeft}>
                      <View style={[s.bookingDateBox, { backgroundColor: C.g50 }]}>
                        <Text style={[s.bookingDateDay, { color: C.g700 }]}>{new Date(b.pickupDate || b.createdAt).getDate()}</Text>
                        <Text style={[s.bookingDateMon, { color: C.g700 }]}>{new Date(b.pickupDate || b.createdAt).toLocaleDateString('en-IN', { month: 'short' })}</Text>
                      </View>
                    </View>
                    <View style={s.bookingMid}>
                      <Text style={s.bookingName} numberOfLines={1}>{b.customerName || `#${b.bookingNumber}`}</Text>
                      <Text style={s.bookingTime}>{fmtDate(b.pickupDate)}{b.pickupTime ? ` · ${fmtTime(b.pickupTime)}` : ''}</Text>
                      {b.vehicleName && <Text style={s.bookingVehicle} numberOfLines={1}>{b.vehicleName}</Text>}
                    </View>
                    <View style={s.bookingRight}>
                      <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
                        <Text style={[s.statusChipTxt, { color: sc.text }]}>{sc.label}</Text>
                      </View>
                      {b.totalAmount > 0 && <Text style={s.bookingAmt}>{fmtAmt(b.totalAmount)}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <Text style={[s.sectionTitle, { marginTop: 4 }]}>Manage</Text>
          <View style={s.manageGrid}>
            {manageItems.map((m, i) => (
              <TouchableOpacity key={i} style={s.manageCard} onPress={() => navigation.navigate(m.route, m.params)} activeOpacity={0.75}>
                <View style={[s.manageIconBox, { backgroundColor: m.color + '14' }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <Text style={s.manageLabel}>{m.label}</Text>
                <Text style={s.manageSub}>{m.sub}</Text>
                <Ionicons name="chevron-forward" size={12} color={C.muted} style={s.manageArrow} />
              </TouchableOpacity>
            ))}
          </View>

        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  hero: {
    paddingHorizontal: 16, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  deco1: { position: 'absolute', top: -46, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)' },
  deco2: { position: 'absolute', bottom: -40, left: -34, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.045)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 18 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { alignItems: 'center' },
  headerEyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1.2, fontFamily: DISPLAY, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2, fontFamily: DISPLAY },
  quoteCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: rs(16), padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  quoteTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  quoteLbl: { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  quoteNum: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1, fontFamily: DISPLAY },
  pendingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(217,119,6,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(217,119,6,0.35)' },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },
  pendingTxt: { fontSize: 10, fontWeight: '700', color: C.amber },
  miniStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.13)', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10 },
  vLine: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 6 },
  miniCell: { flex: 1, alignItems: 'center' },
  miniVal: { fontSize: 12, fontWeight: '800', color: '#fff', marginBottom: 1, fontFamily: DISPLAY },
  miniLbl: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.38)' },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.text, letterSpacing: -0.2, marginBottom: 10, marginTop: 18, fontFamily: DISPLAY },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
  seeAll: { fontSize: 12, fontWeight: '600', color: C.g600 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.amberM, borderRadius: rs(14), padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  tipIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.amberL, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 17 },
  tipBold: { fontWeight: '700' },
  activeCard: { borderRadius: rs(16), overflow: 'hidden', marginTop: 10 },
  activeGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  activeLiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', position: 'absolute', left: 18 },
  activeLiveDotPulse: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', position: 'absolute', left: 13 },
  activeTitle: { fontSize: 15, fontWeight: '800', color: '#fff', fontFamily: DISPLAY },
  activeSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  activeCountBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  activeCountNum: { fontSize: 18, fontWeight: '900', color: '#fff', fontFamily: DISPLAY },
  perfRow: { flexDirection: 'row', gap: 10 },
  perfCard: { flex: 1, backgroundColor: C.card, borderRadius: rs(14), padding: 14, borderWidth: 1, borderColor: C.border, ...cardShadow },
  perfLbl: { fontSize: 8, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 6 },
  perfAmt: { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: -0.5, fontFamily: DISPLAY },
  perfSub: { fontSize: 10, color: C.muted, marginTop: 6 },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  growthTxt: { fontSize: 11, fontWeight: '700' },
  chartCard: { backgroundColor: C.card, borderRadius: rs(16), padding: 16, borderWidth: 1, borderColor: C.border, ...cardShadow, marginTop: 18 },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chartTitle: { fontSize: 13, fontWeight: '800', color: C.text, letterSpacing: -0.2, fontFamily: DISPLAY },
  chartSub: { fontSize: 11, color: C.muted, marginTop: 3 },
  periodRow: { flexDirection: 'row', gap: 3, backgroundColor: C.bg, borderRadius: 20, padding: 3 },
  periodBtn: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 16 },
  periodBtnActive: { backgroundColor: C.g900 },
  periodTxt: { fontSize: 11, fontWeight: '700', color: C.muted },
  periodTxtActive: { color: '#fff' },
  bookingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: rs(14), padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border, ...cardShadow },
  bookingLeft: { marginRight: 12 },
  bookingDateBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookingDateDay: { fontSize: 16, fontWeight: '900', lineHeight: 20 },
  bookingDateMon: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  bookingMid: { flex: 1 },
  bookingName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2, fontFamily: DISPLAY },
  bookingTime: { fontSize: 11, color: C.sub },
  bookingVehicle: { fontSize: 10, color: C.muted, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusChipTxt: { fontSize: 10, fontWeight: '700' },
  bookingAmt: { fontSize: 13, fontWeight: '800', color: C.g600, fontFamily: DISPLAY },
  manageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  manageCard: { width: CARD_W, backgroundColor: C.card, borderRadius: rs(14), padding: 14, ...cardShadow, borderWidth: 1, borderColor: C.border },
  manageIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  manageLabel: { fontSize: 12.5, fontWeight: '800', color: C.text, marginBottom: 2, fontFamily: DISPLAY },
  manageSub: { fontSize: 10, color: C.muted, lineHeight: 14 },
  manageArrow: { position: 'absolute', bottom: 12, right: 12 },
});

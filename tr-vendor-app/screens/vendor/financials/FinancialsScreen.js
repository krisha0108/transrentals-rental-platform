import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorFinancials } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

const { width: SW } = Dimensions.get('window');

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, subtext: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight,
  red: T.red, redBg: T.redLight,
  blue: T.blue, purple: T.purple, indigo: T.indigo, teal: T.teal,
};

const EXPENSE_CATEGORIES = {
  fuel:           { label: 'Fuel',           icon: 'gas-station',      color: '#F59E0B', bg: '#FEF3C7' },
  driver_payment: { label: 'Driver Payment', icon: 'account',          color: '#3B82F6', bg: '#DBEAFE' },
  toll:           { label: 'Toll',           icon: 'road-variant',     color: '#8B5CF6', bg: '#F3E8FF' },
  parking:        { label: 'Parking',        icon: 'parking',          color: '#06B6D4', bg: '#CFFAFE' },
  maintenance:    { label: 'Maintenance',    icon: 'wrench',           color: '#EF4444', bg: '#FEE2E2' },
  cleaning:       { label: 'Cleaning',       icon: 'broom',            color: '#10B981', bg: '#D1FAE5' },
  other:          { label: 'Other',          icon: 'dots-horizontal',  color: '#64748B', bg: '#F1F5F9' },
};

const SERVICE_META = {
  'car-with-driver': { icon: 'car',            color: '#3B82F6', label: 'Car' },
  'self-drive':      { icon: 'car-side',       color: '#8B5CF6', label: 'Self-Drive' },
  bike:              { icon: 'motorbike',       color: '#F59E0B', label: 'Bike' },
  bus:               { icon: 'bus',             color: '#10B981', label: 'Bus' },
  luxury:            { icon: 'car-sports',      color: '#EAB308', label: 'Luxury' },
  transporter:       { icon: 'truck',           color: '#64748B', label: 'Truck' },
  'packers-movers':  { icon: 'package-variant', color: '#0EA5E9', label: 'Packers' },
  equipment:         { icon: 'wrench',          color: '#EF4444', label: 'Equipment' },
  general:           { icon: 'clipboard-text',  color: '#6B7280', label: 'General' },
};

// Maps each booking's serviceType to its per-service detail screen — a
// booking can come from any of several tables (direct, bike, bus, ...),
// so it can't always be opened via the generic DirectBookingDetail screen.
const BOOKING_DETAIL_SCREEN = {
  direct:            'DirectBookingDetail',
  bike:              'BikeBookingDetail',
  'self-drive':      'SelfDriveBookingDetail',
  'car-with-driver': 'CarRentalBookingDetail',
  bus:               'BusBookingDetail',
  transporter:       'TruckBookingDetail',
  'packers-movers':  'PackersBookingDetail',
  equipment:         'EquipmentBookingDetail',
  luxury:            'LuxuryBookingDetail',
};

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const short = d.toLocaleDateString('en-IN', { month: 'short' });
    const year = String(d.getFullYear()).slice(-2);
    months.push({ val, short, year, full: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) });
  }
  return months;
}

/* ─── Circular ring progress ─────────────────────────────── */
function RingProgress({ pct = 0, size = 64, stroke = 7, color = C.g500, bg = C.g100, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  // Pure RN approach — fake ring using View borders
  const angle = (Math.min(pct, 100) / 100) * 360;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: bg,
      }} />
      {/* Fill — using LinearGradient + clip trick */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: 'transparent',
        borderTopColor: angle >= 0 ? color : 'transparent',
        borderRightColor: angle >= 90 ? color : 'transparent',
        borderBottomColor: angle >= 180 ? color : 'transparent',
        borderLeftColor: angle >= 270 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      {children}
    </View>
  );
}

export default function FinancialsScreen({ navigation }) {
  const months = useMemo(() => getLast6Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(months[0].val);
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [pending, setPending] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async (month) => {
    try {
      const params = month ? { month } : {};
      const res = await getVendorFinancials(params);
      setSummary(res?.summary || null);
      setBreakdown(res?.expenseBreakdown || []);
      setPending(res?.pendingBookings || []);
      setBookings(res?.bookings || []);
    } catch (err) {
      showAlert('error', 'Load Failed', 'Could not load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { setLoading(true); fetchData(selectedMonth); }, [selectedMonth, fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(selectedMonth); };

  const handleBookingPress = (b) => {
    const screen = BOOKING_DETAIL_SCREEN[b.serviceType];
    if (screen) navigation.navigate(screen, { bookingId: b.id });
    else showAlert('info', 'Not Available', 'Detail view for this booking type is not available yet.');
  };

  const selectedLabel = months.find(m => m.val === selectedMonth)?.full || 'All Time';
  const healthPct = summary
    ? Math.max(0, Math.min(100, summary.totalRevenue > 0
        ? Math.round((summary.netEarnings / summary.totalRevenue) * 100) : 0))
    : 0;
  const collectedPct = summary && summary.totalRevenue > 0
    ? Math.round((summary.totalCollected / summary.totalRevenue) * 100) : 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Static header — stays fixed while content below scrolls */}
      <SafeAreaView edges={['top']} style={s.staticHeader}>
        <View style={s.heroNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.heroNavTitle}>Financials</Text>
          <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
            <Icon name="refresh-cw" size={17} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {/* ══════════════════════════════════════════
            HERO HEADER — gradient with big net number
        ══════════════════════════════════════════ */}
        <LinearGradient colors={G.hero} style={s.hero}>
          <AnimatedOrb style={s.deco1} />
          <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
          <View style={{ paddingTop: 12 }}>
            {/* Month label */}
            <Text style={s.heroPeriod}>{selectedLabel}</Text>

            {/* BIG net earnings number */}
            <View style={s.heroNetRow}>
              <View>
                <Text style={s.heroNetLabel}>Net Earnings</Text>
                {loading && !refreshing ? (
                  <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ marginTop: 8 }} />
                ) : (
                  <Text style={[
                    s.heroNetValue,
                    summary && summary.netEarnings < 0 && { color: '#FCA5A5' },
                  ]}>
                    {summary
                      ? `${summary.netEarnings >= 0 ? '+' : ''}₹${fmt(summary.netEarnings)}`
                      : '₹—'}
                  </Text>
                )}
                <Text style={s.heroNetFormula}>Collected − Expenses</Text>
              </View>
              {summary && (
                <View style={s.heroHealthWrap}>
                  <RingProgress
                    pct={healthPct}
                    size={72}
                    stroke={7}
                    color={healthPct >= 50 ? C.g400 : '#FCA5A5'}
                    bg="rgba(255,255,255,0.12)"
                  >
                    <Text style={s.heroHealthPct}>{healthPct}%</Text>
                  </RingProgress>
                  <Text style={s.heroHealthLbl}>Margin</Text>
                </View>
              )}
            </View>

            {/* 3-metric strip */}
            {summary && (
              <View style={s.heroMetrics}>
                <View style={s.heroMetric}>
                  <Text style={s.heroMetricVal}>₹{fmt(summary.totalRevenue)}</Text>
                  <Text style={s.heroMetricLbl}>Revenue</Text>
                </View>
                <View style={s.heroMetricDiv} />
                <View style={s.heroMetric}>
                  <Text style={s.heroMetricVal}>₹{fmt(summary.totalCollected)}</Text>
                  <Text style={s.heroMetricLbl}>Collected</Text>
                </View>
                <View style={s.heroMetricDiv} />
                <View style={s.heroMetric}>
                  <Text style={[s.heroMetricVal, { color: '#FCA5A5' }]}>₹{fmt(summary.totalExpenses)}</Text>
                  <Text style={s.heroMetricLbl}>Expenses</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ══════════════════════════
            MONTH SELECTOR TABS — sticky just below the static header
        ══════════════════════════ */}
        <View style={s.monthStickyWrap}>
          <View style={s.monthWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.monthScroll}>
              <TouchableOpacity
                style={[s.monthTab, !selectedMonth && s.monthTabActive]}
                onPress={() => setSelectedMonth('')}
              >
                <Text style={[s.monthTabTxt, !selectedMonth && s.monthTabTxtActive]}>All</Text>
              </TouchableOpacity>
              {months.map(m => (
                <TouchableOpacity
                  key={m.val}
                  style={[s.monthTab, selectedMonth === m.val && s.monthTabActive]}
                  onPress={() => setSelectedMonth(m.val)}
                >
                  <Text style={[s.monthTabTxt, selectedMonth === m.val && s.monthTabTxtActive]}>
                    {m.short}
                  </Text>
                  <Text style={[s.monthTabYear, selectedMonth === m.val && { color: C.g700 }]}>
                    '{m.year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={s.body}>
          {loading && !refreshing ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color={C.g600} />
              <Text style={s.loadingTxt}>Loading financials…</Text>
            </View>
          ) : summary ? (
            <>
              {/* ══════════════════════════════════════
                  COLLECTION PROGRESS CARD
              ══════════════════════════════════════ */}
              <View style={s.card}>
                <View style={s.cardTitleRow}>
                  <LinearGradient colors={[C.g700, C.g500]} style={s.cardTitleIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <Icon name="activity" size={14} color="#fff" />
                  </LinearGradient>
                  <Text style={s.cardTitle}>Collection Status</Text>
                  <Text style={s.cardBadge}>{summary.bookingCount} bookings</Text>
                </View>

                {/* Revenue vs Collected segmented bar */}
                <View style={s.segBarWrap}>
                  <View style={s.segBar}>
                    <View style={[s.segFill, { width: `${collectedPct}%`, backgroundColor: C.g500 }]} />
                    {summary.totalPending > 0 && (
                      <View style={[s.segFill, {
                        width: `${100 - collectedPct}%`,
                        backgroundColor: C.amber + '60',
                      }]} />
                    )}
                  </View>
                  <View style={s.segLegend}>
                    <View style={s.segLegendItem}>
                      <View style={[s.segDot, { backgroundColor: C.g500 }]} />
                      <Text style={s.segLegendTxt}>Collected {collectedPct}%</Text>
                    </View>
                    {summary.totalPending > 0 && (
                      <View style={s.segLegendItem}>
                        <View style={[s.segDot, { backgroundColor: C.amber }]} />
                        <Text style={s.segLegendTxt}>Pending {100 - collectedPct}%</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 4 metric tiles */}
                <View style={s.metricTiles}>
                  <View style={[s.metricTile, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                    <Text style={[s.metricTileVal, { color: C.g700 }]}>₹{fmt(summary.totalRevenue)}</Text>
                    <Text style={s.metricTileLbl}>Revenue</Text>
                  </View>
                  <View style={[s.metricTile, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                    <Text style={[s.metricTileVal, { color: C.g600 }]}>₹{fmt(summary.totalCollected)}</Text>
                    <Text style={s.metricTileLbl}>Collected</Text>
                  </View>
                  <View style={[s.metricTile, { backgroundColor: C.amberBg, borderColor: '#FDE68A' }]}>
                    <Text style={[s.metricTileVal, { color: C.amber }]}>₹{fmt(summary.totalPending)}</Text>
                    <Text style={s.metricTileLbl}>Pending</Text>
                  </View>
                  <View style={[s.metricTile, { backgroundColor: C.redBg, borderColor: '#FECACA' }]}>
                    <Text style={[s.metricTileVal, { color: C.red }]}>₹{fmt(summary.totalExpenses)}</Text>
                    <Text style={s.metricTileLbl}>Expenses</Text>
                  </View>
                </View>
              </View>

              {/* ══════════════════════════════════════
                  EXPENSE BREAKDOWN — visual bars
              ══════════════════════════════════════ */}
              {breakdown.length > 0 && (
                <View style={s.card}>
                  <View style={s.cardTitleRow}>
                    <LinearGradient colors={['#EF4444', '#F97316']} style={s.cardTitleIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
                      <Icon name="pie-chart" size={14} color="#fff" />
                    </LinearGradient>
                    <Text style={s.cardTitle}>Expense Breakdown</Text>
                    <Text style={s.cardBadge}>₹{fmt(summary.totalExpenses)}</Text>
                  </View>

                  {breakdown.map((item, idx) => {
                    const cat = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
                    const pct = summary.totalExpenses > 0
                      ? Math.round((item.amount / summary.totalExpenses) * 100) : 0;
                    return (
                      <View key={item.category} style={[s.expRow, idx < breakdown.length - 1 && { marginBottom: 16 }]}>
                        {/* Icon + label */}
                        <View style={s.expLeft}>
                          <View style={[s.expIcon, { backgroundColor: cat.bg }]}>
                            <MaterialCommunityIcons name={cat.icon} size={15} color={cat.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Text style={s.expName}>{cat.label}</Text>
                              <Text style={[s.expAmt, { color: cat.color }]}>₹{fmt(item.amount)}</Text>
                            </View>
                            {/* Thick bar */}
                            <View style={s.expBarTrack}>
                              <View style={s.expBarFillWrap}>
                                <LinearGradient
                                  colors={[cat.color, cat.color + 'AA']}
                                  style={[s.expBarFill, { width: `${Math.max(pct, 4)}%` }]}
                                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                />
                              </View>
                              <Text style={[s.expPctLabel, { color: cat.color }]}>{pct}%</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ══════════════════════════════════════
                  PENDING PAYMENTS
              ══════════════════════════════════════ */}
              {pending.length > 0 && (
                <View style={s.card}>
                  <View style={s.cardTitleRow}>
                    <LinearGradient colors={[C.amber, '#F97316']} style={s.cardTitleIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
                      <Icon name="clock" size={14} color="#fff" />
                    </LinearGradient>
                    <Text style={s.cardTitle}>Pending Payments</Text>
                    <View style={s.urgentBadge}>
                      <Text style={s.urgentBadgeTxt}>{pending.length} due</Text>
                    </View>
                  </View>

                  {pending.map((b, idx) => {
                    const svc = SERVICE_META[b.serviceType] || SERVICE_META.general;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[s.pendingCard, idx < pending.length - 1 && { marginBottom: 10 }]}
                        onPress={() => handleBookingPress(b)}
                        activeOpacity={0.8}
                      >
                        <View style={[s.pendingAccent, { backgroundColor: C.amber }]} />
                        <View style={[s.pendingSvcWrap, { backgroundColor: svc.color + '18' }]}>
                          <MaterialCommunityIcons name={svc.icon} size={18} color={svc.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pendingName} numberOfLines={1}>{b.customerName}</Text>
                          <Text style={s.pendingMeta}>{b.bookingNumber} · {svc.label}</Text>
                        </View>
                        <View style={s.pendingAmtBox}>
                          <Text style={s.pendingAmtVal}>₹{fmt(b.balanceDue)}</Text>
                          <Text style={s.pendingAmtLbl}>pending</Text>
                        </View>
                        <Icon name="chevron-right" size={15} color={C.muted} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ══════════════════════════════════════
                  BOOKING-WISE P&L
              ══════════════════════════════════════ */}
              {bookings.length > 0 && (
                <View style={s.card}>
                  <View style={s.cardTitleRow}>
                    <LinearGradient colors={[C.g700, C.g500]} style={s.cardTitleIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
                      <Icon name="bar-chart-2" size={14} color="#fff" />
                    </LinearGradient>
                    <Text style={s.cardTitle}>Booking P&L</Text>
                  </View>

                  {bookings.map((b, idx) => {
                    const svc = SERVICE_META[b.serviceType] || SERVICE_META.general;
                    const net = b.netEarnings;
                    const isProfit = net >= 0;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[s.plCard, idx < bookings.length - 1 && { marginBottom: 10 }]}
                        onPress={() => handleBookingPress(b)}
                        activeOpacity={0.8}
                      >
                        {/* Top row */}
                        <View style={s.plTop}>
                          <View style={[s.plSvcWrap, { backgroundColor: svc.color + '18' }]}>
                            <MaterialCommunityIcons name={svc.icon} size={16} color={svc.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.plName} numberOfLines={1}>{b.customerName}</Text>
                            <Text style={s.plMeta}>{b.bookingNumber} · {svc.label}</Text>
                          </View>
                          <View style={[s.plNetPill, { backgroundColor: isProfit ? C.g100 : C.redBg }]}>
                            <Icon
                              name={isProfit ? 'trending-up' : 'trending-down'}
                              size={11}
                              color={isProfit ? C.g700 : C.red}
                            />
                            <Text style={[s.plNetTxt, { color: isProfit ? C.g700 : C.red }]}>
                              {isProfit ? '+' : ''}₹{fmt(net)}
                            </Text>
                          </View>
                        </View>

                        {/* Mini financial bar */}
                        <View style={s.plBarWrap}>
                          <View style={s.plBarTrack}>
                            {b.paidAmount > 0 && (
                              <View style={[s.plBarSeg, {
                                flex: b.paidAmount,
                                backgroundColor: C.g500,
                                borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
                              }]} />
                            )}
                            {b.expenses > 0 && (
                              <View style={[s.plBarSeg, {
                                flex: b.expenses,
                                backgroundColor: C.red + 'AA',
                                borderTopRightRadius: 4, borderBottomRightRadius: 4,
                              }]} />
                            )}
                          </View>
                          <View style={s.plBarLegend}>
                            <View style={s.plBarLegendItem}>
                              <View style={[s.plBarDot, { backgroundColor: C.g500 }]} />
                              <Text style={s.plBarLegendTxt}>₹{fmt(b.paidAmount)} earned</Text>
                            </View>
                            {b.expenses > 0 && (
                              <View style={s.plBarLegendItem}>
                                <View style={[s.plBarDot, { backgroundColor: C.red }]} />
                                <Text style={s.plBarLegendTxt}>₹{fmt(b.expenses)} spent</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* All paid */}
              {pending.length === 0 && summary.bookingCount > 0 && (
                <LinearGradient colors={[C.g800, C.g700]} style={s.allPaidBanner} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <View style={s.allPaidIconWrap}>
                    <Icon name="check-circle" size={22} color="#fff" />
                  </View>
                  <View>
                    <Text style={s.allPaidTitle}>All Payments Collected!</Text>
                    <Text style={s.allPaidSub}>No pending dues for this period</Text>
                  </View>
                </LinearGradient>
              )}

              {/* No bookings */}
              {summary.bookingCount === 0 && (
                <View style={s.emptyWrap}>
                  <LinearGradient colors={[C.g100, C.g50]} style={s.emptyIconWrap}>
                    <Icon name="calendar" size={34} color={C.g600} />
                  </LinearGradient>
                  <Text style={s.emptyTitle}>No bookings this period</Text>
                  <Text style={s.emptyMeta}>Select a different month to see data</Text>
                </View>
              )}
            </>
          ) : null}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Static header (stays fixed above the scroll) ── */
  staticHeader: { backgroundColor: C.g900 },

  /* ── Hero header ── */
  hero: { paddingBottom: 24, overflow: 'hidden' },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  heroNavTitle: { flex: 1, fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  refreshBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  heroPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600', paddingHorizontal: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },

  heroNetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  heroNetLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 4 },
  heroNetValue: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '900', color: C.g400, letterSpacing: -1 },
  heroNetFormula: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  heroHealthWrap: { alignItems: 'center', gap: 6 },
  heroHealthPct: { fontSize: 13, fontWeight: '800', color: '#fff' },
  heroHealthLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  heroMetrics: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 4 },
  heroMetric: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  heroMetricVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  heroMetricLbl: { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  heroMetricDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },

  /* ── Body ── */
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 14 },

  /* ── Month tabs (sticky) ── */
  monthStickyWrap: { backgroundColor: C.bg, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 },
  monthWrap: { backgroundColor: C.surface, borderRadius: rs(18), borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  monthScroll: { paddingHorizontal: 10, paddingVertical: 10, gap: 6 },
  monthTab: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.bg },
  monthTabActive: { backgroundColor: C.g700 },
  monthTabTxt: { fontSize: 13, fontWeight: '700', color: C.subtext },
  monthTabTxtActive: { color: '#fff' },
  monthTabYear: { fontSize: 10, color: C.muted, marginTop: 1 },

  loadingWrap: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 13, color: C.muted },

  /* ── Cards ── */
  card: {
    backgroundColor: C.surface, borderRadius: rs(20), padding: 18,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  cardTitleIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  cardBadge: { fontSize: 11, fontWeight: '700', color: C.muted, backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: C.border },

  /* ── Collection status ── */
  segBarWrap: { marginBottom: 16 },
  segBar: { height: 10, borderRadius: 8, backgroundColor: C.bg, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  segFill: { height: '100%' },
  segLegend: { flexDirection: 'row', gap: 16 },
  segLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  segDot: { width: 8, height: 8, borderRadius: 4 },
  segLegendTxt: { fontSize: 11, color: C.subtext, fontWeight: '600' },

  metricTiles: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metricTile: { width: '47.5%', borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center' },
  metricTileVal: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text },
  metricTileLbl: { fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },

  /* ── Expense breakdown ── */
  expRow: {},
  expLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  expIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  expName: { fontSize: 13, fontWeight: '600', color: C.text },
  expAmt: { fontSize: 13, fontWeight: '700' },
  expBarTrack: { flexDirection: 'row', alignItems: 'center' },
  expBarFillWrap: { flex: 1, height: 9, backgroundColor: C.bg, borderRadius: 6, overflow: 'hidden' },
  expBarFill: { height: 9, borderRadius: 6, minWidth: 12 },
  expPctLabel: { fontSize: 10, fontWeight: '700', marginLeft: 6, width: 30, textAlign: 'right' },

  /* ── Pending cards ── */
  urgentBadge: { backgroundColor: C.amberBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
  urgentBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.amber },

  pendingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A' + '80',
    overflow: 'hidden',
  },
  pendingAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  pendingSvcWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pendingName: { fontSize: 14, fontWeight: '700', color: C.text },
  pendingMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  pendingAmtBox: { alignItems: 'flex-end' },
  pendingAmtVal: { fontSize: 15, fontWeight: '800', color: C.amber },
  pendingAmtLbl: { fontSize: 9, color: C.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },

  /* ── P&L cards ── */
  plCard: {
    backgroundColor: C.bg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  plTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  plSvcWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  plName: { fontSize: 14, fontWeight: '700', color: C.text },
  plMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  plNetPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  plNetTxt: { fontSize: 12, fontWeight: '800' },

  plBarWrap: {},
  plBarTrack: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', backgroundColor: C.border, marginBottom: 8 },
  plBarSeg: { height: '100%' },
  plBarLegend: { flexDirection: 'row', gap: 14 },
  plBarLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  plBarDot: { width: 7, height: 7, borderRadius: 3.5 },
  plBarLegendTxt: { fontSize: 11, color: C.subtext, fontWeight: '600' },

  /* ── All paid ── */
  allPaidBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 18 },
  allPaidIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  allPaidTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },
  allPaidSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  /* ── Empty ── */
  emptyWrap: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.subtext },
  emptyMeta: { fontSize: 13, color: C.muted },
});

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorFinancials } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#3B82F6', green: '#10B981',
  orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', emerald: '#059669',
  indigo: '#6366F1', violet: '#7C3AED',
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

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    months.push({ val, label });
  }
  return months;
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

  // Alert
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
      console.error('[Financials] Error:', err);
      showAlert('error', 'Load Failed', 'Could not load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData(selectedMonth);
  }, [selectedMonth, fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(selectedMonth); };

  // Loading state
  if (loading && !refreshing) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Financials</Text>
          <Text style={s.headerSub}>Direct Bookings - Earnings & Expenses</Text>
        </View>
      </View>
      <View style={s.centered}><ActivityIndicator size="large" color={C.violet} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Financials</Text>
          <Text style={s.headerSub}>Direct Bookings - Earnings & Expenses</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <Icon name="refresh-cw" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.violet]} />}
      >
        {/* Month Filter */}
        <View style={s.filterCard}>
          <Text style={s.filterLabel}>FILTER BY MONTH</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.monthRow}>
            <TouchableOpacity
              style={[s.monthChip, !selectedMonth && s.monthChipActive]}
              onPress={() => setSelectedMonth('')}
            >
              <Text style={[s.monthChipText, !selectedMonth && s.monthChipTextActive]}>All Time</Text>
            </TouchableOpacity>
            {months.map(m => (
              <TouchableOpacity
                key={m.val}
                style={[s.monthChip, selectedMonth === m.val && s.monthChipActive]}
                onPress={() => setSelectedMonth(m.val)}
              >
                <Text style={[s.monthChipText, selectedMonth === m.val && s.monthChipTextActive]}>
                  {m.label.split(' ')[0].substring(0, 3)} '{m.label.split(' ')[1]?.slice(-2)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {summary ? (
          <>
            {/* Summary Cards - 2x2 grid */}
            <View style={s.summaryGrid}>
              <View style={s.summaryCard}>
                <View style={[s.summaryIconWrap, { backgroundColor: '#EDE9FE' }]}>
                  <Icon name="trending-up" size={16} color={C.violet} />
                </View>
                <Text style={s.summaryLabel}>Total Revenue</Text>
                <Text style={s.summaryValue}>{'\u20B9'}{fmt(summary.totalRevenue)}</Text>
                <Text style={s.summaryMeta}>{summary.bookingCount} bookings</Text>
              </View>
              <View style={s.summaryCard}>
                <View style={[s.summaryIconWrap, { backgroundColor: '#D1FAE5' }]}>
                  <Icon name="check-circle" size={16} color={C.emerald} />
                </View>
                <Text style={s.summaryLabel}>Collected</Text>
                <Text style={[s.summaryValue, { color: C.emerald }]}>{'\u20B9'}{fmt(summary.totalCollected)}</Text>
                <Text style={s.summaryMeta}>Cash in hand</Text>
              </View>
              <View style={s.summaryCard}>
                <View style={[s.summaryIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="clock" size={16} color={C.orange} />
                </View>
                <Text style={s.summaryLabel}>Pending Dues</Text>
                <Text style={[s.summaryValue, { color: C.orange }]}>{'\u20B9'}{fmt(summary.totalPending)}</Text>
                <Text style={s.summaryMeta}>{pending.length} bookings</Text>
              </View>
              <View style={s.summaryCard}>
                <View style={[s.summaryIconWrap, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="minus-circle" size={16} color={C.red} />
                </View>
                <Text style={s.summaryLabel}>Total Expenses</Text>
                <Text style={[s.summaryValue, { color: C.red }]}>{'\u20B9'}{fmt(summary.totalExpenses)}</Text>
                <Text style={s.summaryMeta}>{summary.expenseCount} entries</Text>
              </View>
            </View>

            {/* Net Earnings Banner */}
            <View style={[
              s.netBanner,
              { backgroundColor: summary.netEarnings >= 0 ? '#ECFDF5' : '#FEF2F2',
                borderColor: summary.netEarnings >= 0 ? '#A7F3D0' : '#FECACA' },
            ]}>
              <View>
                <Text style={s.netLabel}>Net Earnings</Text>
                <Text style={s.netFormula}>Collected {'\u2212'} Expenses</Text>
              </View>
              <View style={s.netRight}>
                <Icon
                  name={summary.netEarnings >= 0 ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={summary.netEarnings >= 0 ? C.emerald : C.red}
                />
                <Text style={[
                  s.netValue,
                  { color: summary.netEarnings >= 0 ? C.emerald : C.red },
                ]}>
                  {summary.netEarnings >= 0 ? '+' : ''}{'\u20B9'}{fmt(summary.netEarnings)}
                </Text>
              </View>
            </View>

            {/* Expense Breakdown */}
            {breakdown.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>EXPENSE BREAKDOWN</Text>
                {breakdown.map(item => {
                  const cat = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
                  const pct = summary.totalExpenses > 0
                    ? Math.round((item.amount / summary.totalExpenses) * 100) : 0;
                  return (
                    <View key={item.category} style={s.breakdownItem}>
                      <View style={s.breakdownTop}>
                        <View style={s.breakdownLeft}>
                          <View style={[s.catIcon, { backgroundColor: cat.bg }]}>
                            <MaterialCommunityIcons name={cat.icon} size={16} color={cat.color} />
                          </View>
                          <Text style={s.catName}>{cat.label}</Text>
                        </View>
                        <View style={s.breakdownRight}>
                          <Text style={s.catAmount}>{'\u20B9'}{fmt(item.amount)}</Text>
                          <Text style={s.catPct}>{pct}%</Text>
                        </View>
                      </View>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Pending Payments */}
            {pending.length > 0 && (
              <View style={s.card}>
                <View style={s.pendingHeader}>
                  <Text style={s.cardLabel}>PENDING PAYMENTS</Text>
                  <View style={s.pendingBadge}>
                    <Text style={s.pendingBadgeText}>{pending.length} due</Text>
                  </View>
                </View>
                {pending.map((b, idx) => {
                  const svc = SERVICE_META[b.serviceType] || SERVICE_META.general;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[s.pendingRow, idx < pending.length - 1 && s.pendingRowBorder]}
                      onPress={() => navigation.navigate('DirectBookingDetail', { bookingId: b.id })}
                      activeOpacity={0.7}
                    >
                      <View style={[s.pendingSvcIcon, { backgroundColor: svc.color + '15' }]}>
                        <MaterialCommunityIcons name={svc.icon} size={18} color={svc.color} />
                      </View>
                      <View style={s.pendingInfo}>
                        <Text style={s.pendingName} numberOfLines={1}>{b.customerName}</Text>
                        <Text style={s.pendingMeta}>
                          {b.bookingNumber}  {'\u00B7'}  {svc.label}
                        </Text>
                      </View>
                      <View style={s.pendingAmountWrap}>
                        <Text style={s.pendingAmount}>{'\u20B9'}{fmt(b.balanceDue)}</Text>
                        <Text style={s.pendingDueLabel}>due</Text>
                      </View>
                      <Icon name="chevron-right" size={16} color={C.muted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Booking-wise P&L */}
            {bookings.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>BOOKING-WISE P&L</Text>
                {bookings.map((b, idx) => {
                  const svc = SERVICE_META[b.serviceType] || SERVICE_META.general;
                  const hasExpense = b.expenses > 0;
                  const net = b.netEarnings;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[s.bookingRow, idx < bookings.length - 1 && s.bookingRowBorder]}
                      onPress={() => navigation.navigate('DirectBookingDetail', { bookingId: b.id })}
                      activeOpacity={0.7}
                    >
                      <View style={[s.bookingSvcIcon, { backgroundColor: svc.color + '15' }]}>
                        <MaterialCommunityIcons name={svc.icon} size={16} color={svc.color} />
                      </View>
                      <View style={s.bookingInfo}>
                        <Text style={s.bookingName} numberOfLines={1}>{b.customerName}</Text>
                        <Text style={s.bookingMeta}>{b.bookingNumber}  {'\u00B7'}  {svc.label}</Text>
                        <View style={s.bookingFinRow}>
                          <View style={s.bookingFinItem}>
                            <Text style={s.bookingFinLabel}>Earned</Text>
                            <Text style={[s.bookingFinVal, { color: C.emerald }]}>{'\u20B9'}{fmt(b.paidAmount)}</Text>
                          </View>
                          {hasExpense && (
                            <View style={s.bookingFinItem}>
                              <Text style={s.bookingFinLabel}>Spent</Text>
                              <Text style={[s.bookingFinVal, { color: C.red }]}>-{'\u20B9'}{fmt(b.expenses)}</Text>
                            </View>
                          )}
                          <View style={s.bookingFinItem}>
                            <Text style={s.bookingFinLabel}>Net</Text>
                            <Text style={[s.bookingFinVal, { color: net >= 0 ? C.emerald : C.red, fontWeight: '800' }]}>
                              {net >= 0 ? '+' : ''}{'\u20B9'}{fmt(net)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Icon name="chevron-right" size={16} color={C.muted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* All payments collected message */}
            {pending.length === 0 && summary.bookingCount > 0 && (
              <View style={s.allPaidBanner}>
                <Icon name="check-circle" size={18} color={C.emerald} />
                <Text style={s.allPaidText}>All payments collected for this period!</Text>
              </View>
            )}

            {/* No bookings message */}
            {summary.bookingCount === 0 && (
              <View style={s.emptyBanner}>
                <Icon name="info" size={18} color={C.muted} />
                <Text style={s.emptyBannerText}>No bookings found for this period.</Text>
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 30 }} />
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.violet,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { padding: 16, gap: 14 },

  // Month filter
  filterCard: {
    backgroundColor: C.surface, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border,
  },
  filterLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 10 },
  monthRow: { gap: 8 },
  monthChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: 'transparent',
  },
  monthChipActive: { backgroundColor: '#EDE9FE', borderColor: C.violet },
  monthChipText: { fontSize: 12, fontWeight: '600', color: C.subtext },
  monthChipTextActive: { color: C.violet, fontWeight: '700' },

  // Summary grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48.5%', backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  summaryIconWrap: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 4 },
  summaryMeta: { fontSize: 11, color: C.muted, marginTop: 2 },

  // Net earnings banner
  netBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, borderWidth: 1,
  },
  netLabel: { fontSize: 11, fontWeight: '700', color: C.subtext, textTransform: 'uppercase', letterSpacing: 0.5 },
  netFormula: { fontSize: 11, color: C.muted, marginTop: 2 },
  netRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netValue: { fontSize: 26, fontWeight: '800' },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 14 },

  // Expense breakdown
  breakdownItem: { marginBottom: 14 },
  breakdownTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 13, fontWeight: '600', color: C.text },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catAmount: { fontSize: 13, fontWeight: '700', color: C.text },
  catPct: { fontSize: 11, color: C.muted },
  barTrack: { height: 5, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

  // Pending payments
  pendingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  pendingBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: C.orange },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  pendingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pendingSvcIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pendingInfo: { flex: 1 },
  pendingName: { fontSize: 14, fontWeight: '600', color: C.text },
  pendingMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  pendingAmountWrap: { alignItems: 'flex-end', marginRight: 4 },
  pendingAmount: { fontSize: 14, fontWeight: '700', color: C.orange },
  pendingDueLabel: { fontSize: 9, color: C.muted, marginTop: 1 },

  // Booking-wise P&L
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  bookingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  bookingSvcIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 13, fontWeight: '600', color: C.text },
  bookingMeta: { fontSize: 10, color: C.muted, marginTop: 1 },
  bookingFinRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  bookingFinItem: {},
  bookingFinLabel: { fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  bookingFinVal: { fontSize: 12, fontWeight: '700', marginTop: 1 },

  // All paid banner
  allPaidBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ECFDF5', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  allPaidText: { fontSize: 13, fontWeight: '600', color: C.emerald, flex: 1 },

  // Empty banner
  emptyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
  },
  emptyBannerText: { fontSize: 13, color: C.muted, flex: 1 },
});

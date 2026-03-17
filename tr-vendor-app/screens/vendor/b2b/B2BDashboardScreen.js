import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getB2BStats, getB2BMyQuotes } from '../../api/client';

const { width: W } = Dimensions.get('window');

const C = {
  brand: '#6366F1', brandLight: '#EEF2FF', brandDark: '#4338CA',
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0',
  green: '#10B981', greenL: '#ECFDF5',
  orange: '#F59E0B', orangeL: '#FFFBEB',
  blue: '#3B82F6', blueL: '#EFF6FF',
  red: '#EF4444', redL: '#FEF2F2',
  purple: '#8B5CF6', purpleL: '#F5F3FF',
};

const QUOTE_STATUS = {
  SUBMITTED: { label: 'Submitted', color: C.orange },
  UNDER_REVIEW: { label: 'Under Review', color: C.blue },
  CONFIRMED: { label: 'Confirmed', color: C.green },
  REJECTED: { label: 'Rejected', color: C.red },
  WITHDRAWN: { label: 'Withdrawn', color: C.muted },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ openBookings: 0, myQuotes: 0, activeTrips: 0 });
  const [recentQuotes, setRecentQuotes] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, quotesRes] = await Promise.all([
        getB2BStats(),
        getB2BMyQuotes(null, { limit: 5 }),
      ]);
      setStats(statsData);
      setRecentQuotes(quotesRes.quotes || []);
    } catch (e) {
      console.error('B2B Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const statCards = [
    { label: 'Open Bookings', value: stats.openBookings, icon: 'inbox', color: C.blue, bg: C.blueL, route: 'B2BOpenBookings' },
    { label: 'My Quotes', value: stats.myQuotes, icon: 'file-text', color: C.purple, bg: C.purpleL, route: 'B2BMyQuotes' },
    { label: 'Active Trips', value: stats.activeTrips, icon: 'truck', color: C.green, bg: C.greenL, route: 'B2BTrips' },
  ];

  const quickNav = [
    { label: 'Open\nBookings', icon: 'inbox', color: C.blue, bg: C.blueL, route: 'B2BOpenBookings' },
    { label: 'My\nQuotes', icon: 'file-text', color: C.purple, bg: C.purpleL, route: 'B2BMyQuotes' },
    { label: 'Trips', icon: 'truck', color: C.green, bg: C.greenL, route: 'B2BTrips' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.brand} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>B2B Module</Text>
          <Text style={s.headerSub}>Corporate Bookings & Quotes</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={s.statsRow}>
          {statCards.map((sc, i) => (
            <TouchableOpacity key={i} style={s.statCard} onPress={() => navigation.navigate(sc.route)} activeOpacity={0.7}>
              <View style={[s.statIcon, { backgroundColor: sc.bg }]}>
                <Icon name={sc.icon} size={20} color={sc.color} />
              </View>
              <Text style={s.statValue}>{sc.value}</Text>
              <Text style={s.statLabel}>{sc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Navigation */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {quickNav.map((q, i) => (
            <TouchableOpacity key={i} style={s.quickCard} onPress={() => navigation.navigate(q.route)} activeOpacity={0.7}>
              <View style={[s.quickIcon, { backgroundColor: q.bg }]}>
                <Icon name={q.icon} size={24} color={q.color} />
              </View>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Quotes */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Quotes</Text>
          {recentQuotes.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('B2BMyQuotes')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentQuotes.length === 0 ? (
          <View style={s.emptyCard}>
            <Icon name="file-text" size={40} color={C.muted} />
            <Text style={s.emptyText}>No quotes yet</Text>
            <Text style={s.emptySubtext}>Browse open bookings to submit your first quote</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('B2BOpenBookings')}>
              <Text style={s.emptyBtnText}>Browse Open Bookings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentQuotes.map((quote, i) => {
            const sc = QUOTE_STATUS[quote.status] || { label: quote.status, color: C.muted };
            return (
              <TouchableOpacity
                key={quote.id || i}
                style={s.quoteCard}
                onPress={() => navigation.navigate('B2BQuoteDetail', { quoteId: quote.id })}
                activeOpacity={0.7}
              >
                <View style={s.quoteTop}>
                  <Text style={s.quoteNum}>#{quote.quoteNumber}</Text>
                  <View style={[s.badge, { backgroundColor: sc.color + '20' }]}>
                    <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>
                {quote.booking && (
                  <View style={s.quoteBody}>
                    <Text style={s.quoteCompany} numberOfLines={1}>
                      {quote.booking.companyName || 'N/A'}
                    </Text>
                    <Text style={s.quoteMeta}>
                      {quote.booking.serviceType} · {quote.vehicleCount || quote.quoteVehicles?.length || 0} vehicles
                    </Text>
                    <Text style={s.quoteDate}>{fmt(quote.createdAt)}</Text>
                  </View>
                )}
                <View style={s.quoteFooter}>
                  <Text style={s.quotePrice}>₹{(quote.totalPrice || 0).toLocaleString('en-IN')}</Text>
                  <Icon name="chevron-right" size={18} color={C.brand} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.brand, paddingHorizontal: 16, paddingVertical: 16, paddingTop: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  scroll: { flex: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.subtext, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
  viewAll: { color: C.brand, fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  quickCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 16, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  quickIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, color: C.text, fontWeight: '600', textAlign: 'center' },
  emptyCard: {
    marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 14, padding: 30,
    alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: C.subtext, marginTop: 4, textAlign: 'center' },
  emptyBtn: { marginTop: 16, backgroundColor: C.brand, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  quoteCard: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  quoteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteNum: { fontSize: 14, fontWeight: '700', color: C.brand },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  quoteBody: { marginTop: 8 },
  quoteCompany: { fontSize: 14, fontWeight: '600', color: C.text },
  quoteMeta: { fontSize: 12, color: C.subtext, marginTop: 2 },
  quoteDate: { fontSize: 11, color: C.muted, marginTop: 2 },
  quoteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  quotePrice: { fontSize: 16, fontWeight: '700', color: C.text },
});

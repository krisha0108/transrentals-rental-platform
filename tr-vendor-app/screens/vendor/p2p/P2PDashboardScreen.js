import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getP2PStats, getP2PMyPostings, getP2PTransactions } from '../../api/client';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', sub: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B',
  red: '#EF4444', emerald: '#059669', indigo: '#6366F1',
};

const STATUS_COLORS = {
  ACTIVE: { bg: '#D1FAE5', text: '#065F46' },
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  CONFIRMED: { bg: '#DBEAFE', text: '#1E40AF' },
  IN_PROGRESS: { bg: '#E0E7FF', text: '#3730A3' },
  COMPLETED: { bg: '#D1FAE5', text: '#065F46' },
  CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function P2PDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
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

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header navigation={navigation} />
      <View style={s.center}><ActivityIndicator size="large" color={C.brand} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}>

        {/* Stats Cards */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { borderLeftColor: C.brand }]}>
            <MCI name="currency-inr" size={20} color={C.brand} />
            <Text style={s.statVal}>{stats?.totalEarnings ? `₹${Number(stats.totalEarnings).toLocaleString('en-IN')}` : '₹0'}</Text>
            <Text style={s.statLabel}>Total Earnings</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: C.blue }]}>
            <MCI name="handshake-outline" size={20} color={C.blue} />
            <Text style={s.statVal}>{stats?.completedTransactions || stats?.completedDeals || 0}</Text>
            <Text style={s.statLabel}>Completed Deals</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: C.amber }]}>
            <MCI name="post-outline" size={20} color={C.amber} />
            <Text style={s.statVal}>{stats?.activePostings || 0}</Text>
            <Text style={s.statLabel}>Active Postings</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: C.purple }]}>
            <MCI name="star-outline" size={20} color={C.purple} />
            <Text style={s.statVal}>{(stats?.averageRating || stats?.rating) ? Number(stats.averageRating || stats.rating).toFixed(1) : '-'}</Text>
            <Text style={s.statLabel}>P2P Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            { label: 'Post Vehicle', icon: 'truck', color: C.emerald, screen: 'PostVehicleScreen' },
            { label: 'Share Booking', icon: 'share-2', color: C.purple, screen: 'PostBookingScreen', feather: true },
            { label: 'Find Vehicles', icon: 'magnify', color: C.blue, screen: 'BrowseVehiclesScreen' },
            { label: 'Find Bookings', icon: 'text-box-search-outline', color: C.amber, screen: 'BrowseBookingsScreen' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={() => navigation.navigate(a.screen)}>
              <View style={[s.actionIcon, { backgroundColor: a.color + '15' }]}>
                {a.feather
                  ? <Icon name={a.icon} size={22} color={a.color} />
                  : <MCI name={a.icon} size={22} color={a.color} />
                }
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Manage */}
        <Text style={s.sectionTitle}>Manage</Text>
        <View style={s.manageRow}>
          <TouchableOpacity style={s.manageCard} onPress={() => navigation.navigate('MyPostingsScreen')}>
            <MCI name="format-list-bulleted" size={22} color={C.indigo} />
            <Text style={s.manageLabel}>My Postings</Text>
            <Icon name="chevron-right" size={16} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.manageCard} onPress={() => navigation.navigate('P2PActivityScreen')}>
            <MCI name="swap-horizontal" size={22} color={C.brand} />
            <Text style={s.manageLabel}>Activity</Text>
            <Icon name="chevron-right" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        {recentTx.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentTx.map(tx => {
              const stc = STATUS_COLORS[tx.tripStatus] || STATUS_COLORS.PENDING;
              return (
                <View key={tx.id} style={s.txCard}>
                  <View style={s.txRow}>
                    <Text style={s.txNum}>{tx.transactionNumber || 'TXN'}</Text>
                    <View style={[s.txBadge, { backgroundColor: stc.bg }]}>
                      <Text style={[s.txBadgeText, { color: stc.text }]}>{tx.tripStatus?.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <Text style={s.txRoute}>{tx.fromCity || '-'} → {tx.toCity || '-'}</Text>
                  <View style={s.txRow}>
                    <Text style={s.txMuted}>{tx.vehicleName || '-'}</Text>
                    <Text style={s.txAmount}>₹{Number(tx.agreedAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Active Postings */}
        {activePostings.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Active Postings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyPostingsScreen')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {activePostings.map(p => (
              <View key={p.id} style={s.postCard}>
                <View style={s.txRow}>
                  <View style={[s.typeBadge, { backgroundColor: p._type === 'vehicle' ? '#DBEAFE' : '#F3E8FF' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: p._type === 'vehicle' ? C.blue : C.purple }}>
                      {p._type === 'vehicle' ? 'VEHICLE' : 'BOOKING'}
                    </Text>
                  </View>
                  <Text style={s.postNum}>{p.postingNumber}</Text>
                </View>
                <Text style={s.txRoute}>{p.fromCity || '-'} → {p.toCity || '-'}</Text>
                <Text style={s.txMuted}>{p.vehicleName || p.vehicleRequired || '-'}</Text>
              </View>
            ))}
          </>
        )}

        {/* How it Works */}
        <Text style={s.sectionTitle}>How P2P Works</Text>
        <View style={s.howRow}>
          {[
            { step: '1', label: 'Post', icon: 'plus-circle', desc: 'Share vehicle or booking' },
            { step: '2', label: 'Connect', icon: 'users', desc: 'Other vendors respond' },
            { step: '3', label: 'Execute', icon: 'truck', desc: 'Complete the trip' },
            { step: '4', label: 'Earn', icon: 'dollar-sign', desc: 'Get paid securely' },
          ].map(h => (
            <View key={h.step} style={s.howCard}>
              <View style={s.howStep}><Text style={s.howStepText}>{h.step}</Text></View>
              <Icon name={h.icon} size={18} color={C.brand} />
              <Text style={s.howLabel}>{h.label}</Text>
              <Text style={s.howDesc}>{h.desc}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ navigation }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Icon name="arrow-left" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>P2P Marketplace</Text>
        <Text style={s.headerSub}>Share vehicles & bookings with vendors</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.brand },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  scroll: { padding: 16, paddingTop: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%', backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, gap: 4,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: 13, color: C.brand, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard: {
    width: '48%', backgroundColor: C.surface, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: C.border, gap: 8,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: C.text },

  manageRow: { gap: 10, marginBottom: 20 },
  manageCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  manageLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },

  txCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8, gap: 6,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txNum: { fontSize: 12, fontWeight: '700', color: C.text, fontFamily: 'monospace' },
  txBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  txBadgeText: { fontSize: 9, fontWeight: '700' },
  txRoute: { fontSize: 13, color: C.sub },
  txMuted: { fontSize: 12, color: C.muted },
  txAmount: { fontSize: 14, fontWeight: '700', color: C.brand },

  postCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8, gap: 6,
  },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  postNum: { fontSize: 12, fontWeight: '600', color: C.muted, fontFamily: 'monospace' },

  howRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  howCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 4 },
  howStep: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  howStepText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  howLabel: { fontSize: 11, fontWeight: '700', color: C.text },
  howDesc: { fontSize: 9, color: C.muted, textAlign: 'center' },
});

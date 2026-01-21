/**
 * LuxuryHomeScreen.js - Luxury Cars service home page
 * All options: Quote Requests, My Quotes, Bookings, Direct Requests, Open Requests, Earnings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../../lib/api';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';
const SERVICE_COLOR = '#FF6B35';
const SERVICE_TYPE = 'luxury';
const SERVICE_NAME = 'Luxury Cars';
const SERVICE_ICON = 'car-sport';

export default function LuxuryHomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    quoteRequests: 0,
    myQuotes: 0,
    bookings: 0,
    activeTrips: 0,
    directRequests: 0,
    openRequests: 0,
    earnings: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('vendor');
      if (!vendorData) return;
      const vendor = JSON.parse(vendorData);

      const [quoteRes, bookingRes, earningsRes] = await Promise.all([
        api.get('/vendor/quote-requests', {
          params: { vendorId: vendor.id, serviceType: SERVICE_TYPE, status: 'PENDING' }
        }).catch(() => ({ data: { total: 0 } })),
        api.get(`/vendor/${SERVICE_TYPE}-bookings`).catch(() => ({ data: { bookings: [] } })),
        api.get('/vendor/earnings', {
          params: { vendorId: vendor.id, serviceType: SERVICE_TYPE }
        }).catch(() => ({ data: { total: 0 } })),
      ]);

      const bookings = bookingRes.data?.bookings || [];
      setStats({
        quoteRequests: quoteRes.data?.total || quoteRes.data?.requests?.length || 0,
        myQuotes: 0,
        bookings: bookings.length || bookingRes.data?.total || 0,
        activeTrips: bookings.filter(b => b.status === 'IN_PROGRESS').length,
        directRequests: bookings.filter(b => b.assignmentType === 'DIRECT').length,
        openRequests: bookings.filter(b => b.assignmentType === 'BROADCAST' && b.status === 'PENDING').length,
        earnings: earningsRes.data?.total || 0,
      });
    } catch (error) {
      console.log('Error fetching bike stats:', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const MenuCard = ({ title, subtitle, icon, iconType = 'feather', onPress, badge, color }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, { backgroundColor: color || GREEN }]}>
        {iconType === 'material' ? (
          <MaterialCommunityIcons name={icon} size={22} color="#fff" />
        ) : iconType === 'ionicons' ? (
          <Ionicons name={icon} size={22} color="#fff" />
        ) : (
          <Icon name={icon} size={22} color="#fff" />
        )}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      <Icon name="chevron-right" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.headerIcon, { backgroundColor: SERVICE_COLOR }]}>
            <MaterialCommunityIcons name={SERVICE_ICON} size={20} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{SERVICE_NAME}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.bookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.activeTrips}</Text>
            <Text style={styles.statLabel}>Active Trips</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: GREEN }]}>{formatCurrency(stats.earnings)}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quote Requests Section */}
        <SectionHeader title="Quotes" />
        <MenuCard
          title="Quote Requests"
          subtitle="New requests from customers"
          icon="inbox"
          onPress={() => navigation.navigate('LuxuryQuoteRequests')}
          badge={stats.quoteRequests}
          color="#F59E0B"
        />
        <MenuCard
          title="My Quotes"
          subtitle="Quotes you've sent"
          icon="send"
          onPress={() => navigation.navigate('LuxuryMyQuotes')}
          badge={stats.myQuotes}
          color="#3B82F6"
        />

        {/* Bookings Section */}
        <SectionHeader title="Bookings" />
        <MenuCard
          title="All Bookings"
          subtitle="View and manage all bookings"
          icon="calendar"
          onPress={() => navigation.navigate('LuxuryBookings', {
            serviceType: SERVICE_TYPE,
            serviceName: SERVICE_NAME,
            serviceIcon: SERVICE_ICON
          })}
          badge={stats.bookings}
          color={GREEN}
        />
        {/* TODO: Direct Requests and Open Requests - Coming Soon */}
        {/* <MenuCard
          title="Direct Requests"
          subtitle="Requests assigned to you"
          icon="target"
          onPress={() => navigation.navigate('LuxuryBookings', {
            serviceType: SERVICE_TYPE,
            serviceName: SERVICE_NAME,
            serviceIcon: SERVICE_ICON,
            filter: 'direct'
          })}
          badge={stats.directRequests}
          color="#8B5CF6"
        />
        <MenuCard
          title="Open Requests"
          subtitle="Available requests to accept"
          icon="radio"
          onPress={() => navigation.navigate('LuxuryBookings', {
            serviceType: SERVICE_TYPE,
            serviceName: SERVICE_NAME,
            serviceIcon: SERVICE_ICON,
            filter: 'open'
          })}
          badge={stats.openRequests}
          color="#06B6D4"
        /> */}

        {/* Tools Section */}
        <SectionHeader title="Tools" />
        <MenuCard
          title="Quote Templates"
          subtitle="Manage your quote templates"
          icon="file-text"
          onPress={() => navigation.navigate('LuxuryTemplates')}
          color="#A855F7"
        />

        {/* Earnings Section */}
        <SectionHeader title="Earnings" />
        <MenuCard
          title="View Earnings"
          subtitle="Revenue & payment details"
          icon="trending-up"
          onPress={() => navigation.navigate('EarningsScreen', { serviceType: SERVICE_TYPE, serviceName: SERVICE_NAME })}
          color="#22C55E"
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },

  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});

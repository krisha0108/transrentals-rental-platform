/**
 * CarRentalHomeScreen.js - Car Rental (Chauffeur) service home page
 * Options: Bookings, Earnings (No quotes - direct booking model)
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
const SERVICE_COLOR = '#10B981';
const SERVICE_TYPE = 'car';
const SERVICE_NAME = 'Car Rental';
const SERVICE_ICON = 'car';

export default function CarRentalHomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    bookings: 0,
    activeTrips: 0,
    completedToday: 0,
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

      const [bookingRes, earningsRes] = await Promise.all([
        api.get(`/vendor/${SERVICE_TYPE}-bookings`).catch(() => ({ data: { bookings: [] } })),
        api.get('/vendor/earnings', {
          params: { vendorId: vendor.id, serviceType: SERVICE_TYPE }
        }).catch(() => ({ data: { total: 0 } })),
      ]);

      const bookings = bookingRes.data?.bookings || [];
      const today = new Date().toDateString();
      setStats({
        bookings: bookings.length || bookingRes.data?.total || 0,
        activeTrips: bookings.filter(b => b.status === 'IN_PROGRESS').length,
        completedToday: bookings.filter(b => b.status === 'COMPLETED' && new Date(b.completedAt).toDateString() === today).length,
        earnings: earningsRes.data?.total || 0,
      });
    } catch (error) {
      console.log('Error fetching car rental stats:', error.message);
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Car Rental uses real-time pricing. Bookings are assigned directly by admin.
          </Text>
        </View>

        {/* Bookings Section */}
        <SectionHeader title="Bookings" />
        <MenuCard
          title="All Bookings"
          subtitle="View and manage all bookings"
          icon="calendar"
          onPress={() => navigation.navigate('CarRentalBookings', {
            serviceType: SERVICE_TYPE,
            serviceName: SERVICE_NAME,
            serviceIcon: SERVICE_ICON
          })}
          badge={stats.bookings}
          color={GREEN}
        />
        {/* <MenuCard
          title="Active Trips"
          subtitle="Currently ongoing trips"
          icon="navigation"
          iconType="ionicons"
          onPress={() => navigation.navigate('CarRentalBookings', {
            serviceType: SERVICE_TYPE,
            serviceName: SERVICE_NAME,
            serviceIcon: SERVICE_ICON,
            filter: 'active'
          })}
          badge={stats.activeTrips}
          color="#F59E0B"
        /> */}
        <MenuCard
          title="Completed Today"
          subtitle="Trips completed today"
          icon="checkmark-circle"
          iconType="ionicons"
          onPress={() => navigation.navigate('CarRentalCompletedToday', {
            serviceType: SERVICE_TYPE,
            serviceName: SERVICE_NAME,
            serviceIcon: SERVICE_ICON
          })}
          badge={stats.completedToday}
          color="#8B5CF6"
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

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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

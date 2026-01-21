/**
 * ServiceHomeScreen.js - Service-specific home page with all options
 * Similar to web sidebar structure for each service
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
import api from '../../../lib/api';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

// Service configurations with all menu options
const SERVICE_CONFIG = {
  bike: {
    id: 'SVC_1',
    name: 'Bike Rentals',
    icon: 'motorbike',
    iconType: 'material',
    color: '#FF6B35',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: true,
    hasOpenRequests: true,
    hasTemplates: false,
    hasEarnings: true,
  },
  'self-drive': {
    id: 'SVC_2',
    name: 'Self-Drive Cars',
    icon: 'car-side',
    iconType: 'material',
    color: '#3B82F6',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: true,
    hasOpenRequests: true,
    hasTemplates: false,
    hasEarnings: true,
  },
  'car-rental': {
    id: 'SVC_5',
    name: 'Car Rental',
    icon: 'car',
    iconType: 'material',
    color: '#10B981',
    hasQuoteRequests: false,
    hasMyQuotes: false,
    hasBookings: true,
    hasDirectRequests: false,
    hasOpenRequests: false,
    hasTemplates: false,
    hasEarnings: true,
  },
  luxury: {
    id: 'SVC_8',
    name: 'Luxury Cars',
    icon: 'car-sports',
    iconType: 'material',
    color: '#8B5CF6',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: false,
    hasOpenRequests: false,
    hasTemplates: true,
    hasEarnings: true,
  },
  bus: {
    id: 'SVC_3',
    name: 'Bus & Tempo',
    icon: 'bus',
    iconType: 'material',
    color: '#F59E0B',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: false,
    hasOpenRequests: false,
    hasTemplates: true,
    hasEarnings: true,
  },
  truck: {
    id: 'SVC_4',
    name: 'Transporter',
    icon: 'truck-delivery',
    iconType: 'material',
    color: '#EF4444',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: false,
    hasOpenRequests: false,
    hasTemplates: true,
    hasEarnings: true,
  },
  packers: {
    id: 'SVC_6',
    name: 'Packers & Movers',
    icon: 'package-variant',
    iconType: 'material',
    color: '#06B6D4',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: false,
    hasOpenRequests: false,
    hasTemplates: true,
    hasEarnings: true,
  },
  equipment: {
    id: 'SVC_7',
    name: 'Equipment Rental',
    icon: 'hammer-wrench',
    iconType: 'material',
    color: '#84CC16',
    hasQuoteRequests: true,
    hasMyQuotes: true,
    hasBookings: true,
    hasDirectRequests: false,
    hasOpenRequests: false,
    hasTemplates: true,
    hasEarnings: true,
  },
};

export default function ServiceHomeScreen({ route, navigation }) {
  const { serviceType } = route.params;
  const config = SERVICE_CONFIG[serviceType] || SERVICE_CONFIG.bike;

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    quoteRequests: 0,
    myQuotes: 0,
    bookings: 0,
    activeTrips: 0,
    templates: 0,
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

      // Fetch stats for this service
      const [quoteRes, bookingRes, templateRes, earningsRes] = await Promise.all([
        api.get('/vendor/quote-requests', { params: { vendorId: vendor.id, serviceType, status: 'PENDING' } }).catch(() => ({ data: { requests: [] } })),
        api.get('/vendor/bookings', { params: { vendorId: vendor.id, serviceType } }).catch(() => ({ data: { bookings: [] } })),
        api.get('/vendor/templates', { params: { vendorId: vendor.id, serviceType } }).catch(() => ({ data: { templates: [] } })),
        api.get('/vendor/earnings', { params: { vendorId: vendor.id, serviceType } }).catch(() => ({ data: { total: 0 } })),
      ]);

      setStats({
        quoteRequests: quoteRes.data?.requests?.length || quoteRes.data?.total || 0,
        myQuotes: 0, // Will be set from my quotes API
        bookings: bookingRes.data?.bookings?.length || bookingRes.data?.total || 0,
        activeTrips: bookingRes.data?.bookings?.filter(b => b.status === 'IN_PROGRESS')?.length || 0,
        templates: templateRes.data?.templates?.length || 0,
        earnings: earningsRes.data?.total || 0,
      });
    } catch (error) {
      console.log('Error fetching service stats:', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const renderIcon = (iconName, iconType, size = 24, color = '#fff') => {
    if (iconType === 'material') {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    } else if (iconType === 'ionicons') {
      return <Ionicons name={iconName} size={size} color={color} />;
    }
    return <Icon name={iconName} size={size} color={color} />;
  };

  const MenuCard = ({ title, subtitle, icon, iconType = 'feather', onPress, badge, color }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, { backgroundColor: color || GREEN }]}>
        {renderIcon(icon, iconType, 22, '#fff')}
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
          <View style={[styles.headerIcon, { backgroundColor: config.color }]}>
            {renderIcon(config.icon, config.iconType, 20, '#fff')}
          </View>
          <Text style={styles.headerTitle}>{config.name}</Text>
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
            <Text style={[styles.statValue, { color: GREEN }]}>
              {stats.earnings > 0 ? `₹${(stats.earnings / 1000).toFixed(1)}K` : '₹0'}
            </Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quote Requests Section */}
        {(config.hasQuoteRequests || config.hasMyQuotes) && (
          <>
            <SectionHeader title="Quotes" />
            {config.hasQuoteRequests && (
              <MenuCard
                title="Quote Requests"
                subtitle="New requests from customers"
                icon="inbox"
                onPress={() => navigation.navigate('QuoteRequestsScreen', { serviceType, serviceName: config.name })}
                badge={stats.quoteRequests}
                color="#F59E0B"
              />
            )}
            {config.hasMyQuotes && (
              <MenuCard
                title="My Quotes"
                subtitle="Quotes you've sent"
                icon="send"
                onPress={() => navigation.navigate('MyQuotesScreen', { serviceType, serviceName: config.name })}
                badge={stats.myQuotes}
                color="#3B82F6"
              />
            )}
          </>
        )}

        {/* Bookings Section */}
        <SectionHeader title="Bookings" />
        <MenuCard
          title="All Bookings"
          subtitle="View and manage all bookings"
          icon="calendar"
          onPress={() => navigation.navigate('BookingsListScreen', { serviceType, serviceName: config.name, serviceIcon: config.icon })}
          badge={stats.bookings}
          color={GREEN}
        />

        {config.hasDirectRequests && (
          <MenuCard
            title="Direct Requests"
            subtitle="Requests assigned to you"
            icon="target"
            iconType="feather"
            onPress={() => navigation.navigate('BookingsListScreen', { serviceType, serviceName: config.name, serviceIcon: config.icon, filter: 'direct' })}
            color="#8B5CF6"
          />
        )}

        {config.hasOpenRequests && (
          <MenuCard
            title="Open Requests"
            subtitle="Available requests to accept"
            icon="radio"
            iconType="feather"
            onPress={() => navigation.navigate('BookingsListScreen', { serviceType, serviceName: config.name, serviceIcon: config.icon, filter: 'open' })}
            color="#06B6D4"
          />
        )}

        {/* Templates Section */}
        {config.hasTemplates && (
          <>
            <SectionHeader title="Templates" />
            <MenuCard
              title="My Templates"
              subtitle="Manage your pricing templates"
              icon="file-text"
              onPress={() => navigation.navigate('TemplatesListScreen', { serviceType, serviceName: config.name })}
              badge={stats.templates}
              color="#EC4899"
            />
            <MenuCard
              title="Create Template"
              subtitle="Add new pricing template"
              icon="plus-circle"
              onPress={() => {
                // Navigate to service-specific template creation
                const templateScreens = {
                  bus: 'CreateBusTemplateScreen',
                  truck: 'CreateTruckTemplateScreen',
                  equipment: 'CreateEquipmentTemplateScreen',
                  luxury: 'CreateLuxuryTemplateScreen',
                  packers: 'CreatePackersTemplateScreen',
                };
                const screen = templateScreens[serviceType];
                if (screen) {
                  navigation.navigate(screen);
                }
              }}
              color="#10B981"
            />
          </>
        )}

        {/* Earnings Section */}
        {config.hasEarnings && (
          <>
            <SectionHeader title="Earnings" />
            <MenuCard
              title="View Earnings"
              subtitle="Revenue & payment details"
              icon="trending-up"
              onPress={() => navigation.navigate('EarningsScreen', { serviceType, serviceName: config.name })}
              color="#22C55E"
            />
          </>
        )}

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

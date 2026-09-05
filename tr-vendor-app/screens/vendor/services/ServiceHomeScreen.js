/**
 * ServiceHomeScreen.js - Service-specific home with premium gradient header
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBookingsByService } from '../../api/client';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#EF4444',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  cyan: '#0891B2', cyanL: '#ECFEFF',
  pink: '#DB2777', pinkL: '#FDF2F8',
};

const SERVICE_CONFIG = {
  bike: {
    id: 'SVC_1', name: 'Bike Rentals',
    icon: 'motorbike', iconType: 'material', color: '#FF6B35',
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: true, hasOpenRequests: true, hasTemplates: false, hasEarnings: true,
  },
  'self-drive': {
    id: 'SVC_2', name: 'Self-Drive Cars',
    icon: 'car-side', iconType: 'material', color: C.blue,
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: true, hasOpenRequests: true, hasTemplates: false, hasEarnings: true,
  },
  'car-rental': {
    id: 'SVC_5', name: 'Car Rental',
    icon: 'car', iconType: 'material', color: C.g600,
    hasQuoteRequests: false, hasMyQuotes: false, hasBookings: true,
    hasDirectRequests: false, hasOpenRequests: false, hasTemplates: false, hasEarnings: true,
  },
  luxury: {
    id: 'SVC_8', name: 'Luxury Cars',
    icon: 'car-sports', iconType: 'material', color: C.purple,
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: false, hasOpenRequests: false, hasTemplates: true, hasEarnings: true,
  },
  bus: {
    id: 'SVC_3', name: 'Bus & Tempo',
    icon: 'bus', iconType: 'material', color: C.amber,
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: false, hasOpenRequests: false, hasTemplates: true, hasEarnings: true,
  },
  truck: {
    id: 'SVC_4', name: 'Transporter',
    icon: 'truck-delivery', iconType: 'material', color: C.red,
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: false, hasOpenRequests: false, hasTemplates: true, hasEarnings: true,
  },
  packers: {
    id: 'SVC_6', name: 'Packers & Movers',
    icon: 'package-variant', iconType: 'material', color: C.cyan,
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: false, hasOpenRequests: false, hasTemplates: true, hasEarnings: true,
  },
  equipment: {
    id: 'SVC_7', name: 'Equipment Rental',
    icon: 'hammer-wrench', iconType: 'material', color: '#84CC16',
    hasQuoteRequests: true, hasMyQuotes: true, hasBookings: true,
    hasDirectRequests: false, hasOpenRequests: false, hasTemplates: true, hasEarnings: true,
  },
};

const MENU_ITEMS = {
  quotes: [
    {
      key: 'quoteRequests', title: 'Quote Requests', sub: 'New requests from customers',
      icon: 'inbox', iconType: 'feather', color: C.amber, bg: C.amberL,
      screen: 'QuoteRequestsScreen', condition: 'hasQuoteRequests', badgeKey: 'quoteRequests',
    },
    {
      key: 'myQuotes', title: 'My Quotes', sub: 'Quotes you have sent',
      icon: 'send', iconType: 'feather', color: C.blue, bg: C.blueL,
      screen: 'MyQuotesScreen', condition: 'hasMyQuotes', badgeKey: 'myQuotes',
    },
  ],
  bookings: [
    {
      key: 'allBookings', title: 'All Bookings', sub: 'View and manage all bookings',
      icon: 'calendar-outline', iconType: 'ionicons', color: C.g700, bg: C.g50,
      screen: 'BookingsListScreen', condition: null, badgeKey: 'bookings',
    },
    {
      key: 'directRequests', title: 'Direct Requests', sub: 'Requests assigned to you',
      icon: 'target', iconType: 'feather', color: C.purple, bg: C.purpleL,
      screen: 'BookingsListScreen', condition: 'hasDirectRequests', filter: 'direct',
    },
    {
      key: 'openRequests', title: 'Open Requests', sub: 'Available requests to accept',
      icon: 'radio', iconType: 'feather', color: C.cyan, bg: C.cyanL,
      screen: 'BookingsListScreen', condition: 'hasOpenRequests', filter: 'open',
    },
  ],
  templates: [
    {
      key: 'myTemplates', title: 'My Templates', sub: 'Manage your pricing templates',
      icon: 'file-text', iconType: 'feather', color: C.pink, bg: C.pinkL,
      screen: 'TemplatesListScreen', condition: 'hasTemplates', badgeKey: 'templates',
    },
    {
      key: 'createTemplate', title: 'Create Template', sub: 'Add new pricing template',
      icon: 'plus-circle', iconType: 'feather', color: C.g600, bg: C.g50,
      action: 'createTemplate', condition: 'hasTemplates',
    },
  ],
  earnings: [
    {
      key: 'earnings', title: 'View Earnings', sub: 'Revenue & payment details',
      icon: 'trending-up', iconType: 'feather', color: C.g700, bg: C.g50,
      screen: 'EarningsScreen', condition: 'hasEarnings',
    },
  ],
};

export default function ServiceHomeScreen({ route, navigation }) {
  const { serviceType } = route.params;
  const config = SERVICE_CONFIG[serviceType] || SERVICE_CONFIG.bike;

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ quoteRequests: 0, myQuotes: 0, bookings: 0, activeTrips: 0, templates: 0, earnings: 0 });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await getBookingsByService(serviceType, { limit: 200 }).catch(() => ({ bookings: [] }));
      const bookings = res?.bookings || [];
      const totalBookings = bookings.filter(b =>
        ['ACCEPTED','CONFIRMED','IN_PROGRESS','COMPLETED','READY_FOR_PICKUP'].includes(b.status)
      ).length;
      const earnings = bookings.filter(b => b.status === 'COMPLETED')
        .reduce((s, b) => s + (b.grandTotal || b.totalAmount || 0), 0);
      const openRequests = bookings.filter(b =>
        ['PENDING','PENDING_VENDOR','BROADCASTED'].includes(b.status)
      ).length;
      setStats({
        quoteRequests: openRequests, myQuotes: 0,
        bookings: totalBookings,
        activeTrips: bookings.filter(b => b.status === 'IN_PROGRESS').length,
        templates: 0, earnings,
      });
    } catch (e) {
      console.error('ServiceHome stats error:', e.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const renderServiceIcon = (iconName, iconType, size = 24, color = '#fff') => {
    if (iconType === 'material') return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    if (iconType === 'ionicons') return <Ionicons name={iconName} size={size} color={color} />;
    return <Icon name={iconName} size={size} color={color} />;
  };

  const renderMenuIcon = (iconName, iconType, size = 20, color = '#fff') => {
    if (iconType === 'ionicons') return <Ionicons name={iconName} size={size} color={color} />;
    if (iconType === 'feather') return <Icon name={iconName} size={size} color={color} />;
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  };

  const handleMenuPress = (item) => {
    if (item.action === 'createTemplate') {
      const templateScreens = {
        bus: 'CreateBusTemplateScreen', truck: 'CreateTruckTemplateScreen',
        equipment: 'CreateEquipmentTemplateScreen', luxury: 'CreateLuxuryTemplateScreen',
        packers: 'CreatePackersTemplateScreen',
      };
      const screen = templateScreens[serviceType];
      if (screen) navigation.navigate(screen);
      return;
    }
    if (item.screen) {
      const params = { serviceType, serviceName: config.name, serviceIcon: config.icon };
      if (item.filter) params.filter = item.filter;
      navigation.navigate(item.screen, params);
    }
  };

  const formatEarnings = (e) => e > 0 ? `₹${(e / 1000).toFixed(1)}K` : '₹0';

  const renderSection = (sectionKey, label) => {
    const items = MENU_ITEMS[sectionKey].filter(item =>
      item.condition === null || config[item.condition]
    );
    if (items.length === 0) return null;

    return (
      <View key={sectionKey}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <View style={styles.menuCard}>
          {items.map((item, i) => {
            const badge = item.badgeKey ? stats[item.badgeKey] : 0;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuRow, i < items.length - 1 && styles.menuBorder]}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                  {renderMenuIcon(item.icon, item.iconType, 20, item.color)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                {badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                  </View>
                )}
                <View style={styles.menuArrow}>
                  <Icon name="chevron-right" size={16} color={C.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HEADER ── */}
      <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={styles.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.heroIconWrap, { backgroundColor: config.color + '22', borderColor: config.color + '55' }]}>
              {renderServiceIcon(config.icon, config.iconType, 32, '#fff')}
            </View>
            <Text style={styles.heroTitle}>{config.name}</Text>
            <Text style={styles.heroSub}>Manage bookings, quotes & earnings</Text>
          </View>

          {/* Stats Strip */}
          <View style={styles.statsStrip}>
            {[
              { value: stats.bookings,    label: 'Bookings',  color: C.g400 },
              { value: stats.activeTrips, label: 'Active',    color: '#FCD34D' },
              { value: formatEarnings(stats.earnings), label: 'Earnings', color: '#A5B4FC' },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && styles.statDivider]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} />}
      >
        {(config.hasQuoteRequests || config.hasMyQuotes) && renderSection('quotes', 'Quotes')}
        {renderSection('bookings', 'Bookings')}
        {config.hasTemplates && renderSection('templates', 'Templates')}
        {config.hasEarnings && renderSection('earnings', 'Earnings')}

        {/* Open Requests Badge (if applicable) */}
        {stats.quoteRequests > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconBox}>
              <Ionicons name="notifications" size={18} color={C.amber} />
            </View>
            <Text style={styles.alertText}>
              You have <Text style={{ fontWeight: '800', color: C.amber }}>{stats.quoteRequests}</Text> open request{stats.quoteRequests > 1 ? 's' : ''} waiting for your response.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGrad: { paddingHorizontal: 16, paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },

  scroll: { padding: 16 },
  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: C.sub,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 8, marginLeft: 2,
  },

  menuCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconBox: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  menuSub: { fontSize: 13, color: C.sub, marginTop: 1 },
  menuArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    backgroundColor: C.red, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.amberL, borderRadius: 14,
    padding: 14, gap: 12, marginTop: 8,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  alertIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  alertText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 19 },
});

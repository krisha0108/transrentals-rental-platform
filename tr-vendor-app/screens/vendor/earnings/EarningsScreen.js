import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, getVendorEarningsDebug } from '../../api/client';

const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  brand: '#10B981',
  brandLight: '#D1FAE5',
  blue: '#3B82F6',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  emerald: '#10B981',
  cyan: '#06B6D4',
  pink: '#EC4899',
  indigo: '#6366F1',
  yellow: '#F59E0B',
};

const SERVICE_CONFIG = {
  bike: { icon: 'bike', color: C.blue, label: 'Bike' },
  'self-drive': { icon: 'car', color: C.emerald, label: 'Self Drive' },
  'car-rental': { icon: 'car-side', color: C.red, label: 'Car Rental' },
  bus: { icon: 'bus', color: C.orange, label: 'Bus' },
  truck: { icon: 'truck', color: C.purple, label: 'Truck' },
  packers: { icon: 'package-variant', color: C.cyan, label: 'Packers' },
  equipment: { icon: 'crane', color: C.pink, label: 'Equipment' },
  luxury: { icon: 'car-sports', color: C.indigo, label: 'Luxury' },
};

export default function EarningsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState('all');
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0,
    pendingPayout: 0,
  });
  const [bookingsData, setBookingsData] = useState({
    total: 0,
    completed: 0,
    active: 0,
    today: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);

  const fetchEarnings = useCallback(async (showFilterLoader = false) => {
    try {
      if (showFilterLoader) {
        setFilterLoading(true);
      }

      console.log('[Earnings Screen] Fetching earnings with filter:', selectedService);

      try {
        await getVendorEarningsDebug();
      } catch (debugError) {
        console.log('[Earnings Screen] Debug call failed:', debugError);
      }

      const params = selectedService !== 'all' ? `?service=${selectedService}` : '';
      const response = await apiGet(`/vendor/earnings${params}`);

      if (response.data?.success) {
        setEarnings(response.data.earnings || {});
        setBookingsData(response.data.bookings || {});
        setServiceBreakdown(response.data.serviceBreakdown || []);
        setBookingsList(response.data.bookingsList || []);
      }
    } catch (error) {
      console.log('[Earnings Screen] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFilterLoading(false);
    }
  }, [selectedService]);

  useEffect(() => {
    if (loading) {
      fetchEarnings(false);
    } else {
      fetchEarnings(true);
    }
  }, [selectedService]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings(false);
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const formatCurrency = (amount) => {
    return `${Math.round(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getServiceConfig = (service) => {
    return SERVICE_CONFIG[service] || { icon: 'briefcase', color: C.muted, label: 'Service' };
  };

  const renderFilterChip = (item) => {
    const isSelected = selectedService === item.service;
    const config = getServiceConfig(item.service);

    return (
      <TouchableOpacity
        key={item.service}
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: config.color, borderColor: config.color },
        ]}
        onPress={() => setSelectedService(item.service)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={16}
          color={isSelected ? '#FFF' : config.color}
        />
        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
          {config.label}
        </Text>
        <View style={[styles.chipBadge, isSelected && styles.chipBadgeActive]}>
          <Text style={[styles.chipBadgeText, isSelected && styles.chipBadgeTextActive]}>
            {item.bookings}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBookingCard = ({ item }) => {
    const config = getServiceConfig(item.service);
    const isCompleted = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to booking details if needed
        }}
      >
        {/* Header with Service Icon & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.serviceIconBox, { backgroundColor: config.color + '15' }]}>
              <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
              <Text style={styles.serviceLabel}>{config.label}</Text>
            </View>
          </View>
          <View style={[styles.statusChip, isCompleted ? styles.statusCompleted : styles.statusActive]}>
            <View style={[styles.statusDot, isCompleted ? styles.dotCompleted : styles.dotActive]} />
            <Text style={[styles.statusText, isCompleted ? styles.statusTextCompleted : styles.statusTextActive]}>
              {isCompleted ? 'Completed' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Booking Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Icon name="user" size={14} color={C.muted} />
            <Text style={styles.detailText} numberOfLines={1}>{item.customerName || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="map-pin" size={14} color={C.muted} />
            <Text style={styles.detailText} numberOfLines={1}>{item.location || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={14} color={C.muted} />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
        </View>

        {/* Amount & Actions Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Booking Amount</Text>
            <Text style={[styles.amountValue, { color: config.color }]}>
              ₹{formatCurrency(item.amount)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonCircle} />
        <View style={{ flex: 1 }}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
        </View>
      </View>
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '80%' }]} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 8 }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Earnings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bookings List with Sticky Header */}
      {filterLoading ? (
        <View style={styles.container}>
          <View style={styles.stickySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>This Month's Earnings</Text>
                  <Text style={styles.summaryAmount}>₹{formatCurrency(earnings.thisMonth)}</Text>
                  {earnings.growth !== 0 && (
                    <View style={styles.growthRow}>
                      <Icon
                        name={earnings.growth >= 0 ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={earnings.growth >= 0 ? C.brand : C.red}
                      />
                      <Text style={[styles.growthText, { color: earnings.growth >= 0 ? C.brand : C.red }]}>
                        {earnings.growth >= 0 ? '+' : ''}{earnings.growth.toFixed(1)}% from last month
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{formatCurrency(earnings.today)}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{bookingsData.completed}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{bookingsData.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
            </View>

            {serviceBreakdown.length > 0 && (
              <View style={styles.filtersContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScroll}
                >
                  <TouchableOpacity
                    style={[styles.filterChip, selectedService === 'all' && styles.filterChipAll]}
                    onPress={() => setSelectedService('all')}
                  >
                    <Icon name="grid" size={16} color={selectedService === 'all' ? '#FFF' : C.text} />
                    <Text style={[styles.chipText, selectedService === 'all' && styles.chipTextActive]}>
                      All Services
                    </Text>
                    <View style={[styles.chipBadge, selectedService === 'all' && styles.chipBadgeActive]}>
                      <Text style={[styles.chipBadgeText, selectedService === 'all' && styles.chipBadgeTextActive]}>
                        {bookingsData.total}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {serviceBreakdown.map(renderFilterChip)}
                </ScrollView>
              </View>
            )}
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentPadding}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i}>{renderSkeletonCard()}</View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <FlatList
          data={bookingsList}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />
          }
          ListHeaderComponent={
            <>
              {/* Sticky Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>This Month's Earnings</Text>
                    <Text style={styles.summaryAmount}>₹{formatCurrency(earnings.thisMonth)}</Text>
                    {earnings.growth !== 0 && (
                      <View style={styles.growthRow}>
                        <Icon
                          name={earnings.growth >= 0 ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={earnings.growth >= 0 ? C.brand : C.red}
                        />
                        <Text style={[styles.growthText, { color: earnings.growth >= 0 ? C.brand : C.red }]}>
                          {earnings.growth >= 0 ? '+' : ''}{earnings.growth.toFixed(1)}% from last month
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>₹{formatCurrency(earnings.today)}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{bookingsData.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{bookingsData.active}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                  </View>
                </View>
              </View>

              {/* Filter Chips */}
              {serviceBreakdown.length > 0 && (
                <View style={styles.filtersContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScroll}
                  >
                    <TouchableOpacity
                      style={[styles.filterChip, selectedService === 'all' && styles.filterChipAll]}
                      onPress={() => setSelectedService('all')}
                    >
                      <Icon name="grid" size={16} color={selectedService === 'all' ? '#FFF' : C.text} />
                      <Text style={[styles.chipText, selectedService === 'all' && styles.chipTextActive]}>
                        All Services
                      </Text>
                      <View style={[styles.chipBadge, selectedService === 'all' && styles.chipBadgeActive]}>
                        <Text style={[styles.chipBadgeText, selectedService === 'all' && styles.chipBadgeTextActive]}>
                          {bookingsData.total}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {serviceBreakdown.map(renderFilterChip)}
                  </ScrollView>
                </View>
              )}

              {/* Section Header */}
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedService === 'all'
                    ? 'All Bookings'
                    : `${getServiceConfig(selectedService).label} Bookings`
                  }
                </Text>
                <Text style={styles.bookingsCount}>{bookingsList.length}</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="inbox" size={48} color={C.muted} />
              </View>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                {selectedService === 'all'
                  ? 'You don\'t have any bookings yet'
                  : 'No bookings found for this service'
                }
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  stickySection: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: C.brand,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 6,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  filtersContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.bg,
  },
  filtersScroll: {
    gap: 8,
  },
  contentPadding: {
    padding: 16,
  },
  flatListContent: {
    paddingBottom: 100, // Extra padding for bottom navigation bar
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  filterChipAll: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
  },
  chipBadgeTextActive: {
    color: '#FFFFFF',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  bookingsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: C.muted,
  },
  bookingCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  serviceLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusCompleted: {
    backgroundColor: C.brandLight,
  },
  statusActive: {
    backgroundColor: '#FEF3C7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCompleted: {
    backgroundColor: C.brand,
  },
  dotActive: {
    backgroundColor: C.orange,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusTextCompleted: {
    color: C.brand,
  },
  statusTextActive: {
    color: C.orange,
  },
  detailsGrid: {
    gap: 10,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.bg,
  },
  skeletonBody: {
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: C.bg,
    borderRadius: 7,
  },
});

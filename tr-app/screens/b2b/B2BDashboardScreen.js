import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions, Platform, Modal,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { b2bService } from '../services';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

const SERVICE_FILTERS = [
  { value: 'all', label: 'All Services', icon: 'layers', color: '#6366F1', bg: '#EEF2FF' },
  { value: 'car', label: 'Car', icon: 'truck', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'bus', label: 'Bus', icon: 'navigation', color: '#F59E0B', bg: '#FFFBEB' },
  { value: 'self-drive', label: 'Self-Drive', icon: 'key', color: '#10B981', bg: '#ECFDF5' },
  { value: 'luxury', label: 'Luxury', icon: 'star', color: '#A855F7', bg: '#FAF5FF' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses', icon: 'grid', color: '#6366F1' },
  { value: 'OPEN_FOR_QUOTES', label: 'Open for Quotes', icon: 'send', color: '#F59E0B' },
  { value: 'QUOTES_RECEIVED', label: 'Quotes Received', icon: 'message-square', color: '#3B82F6' },
  { value: 'SUPER_QUOTE_SENT', label: 'Quote Sent', icon: 'mail', color: '#8B5CF6' },
  { value: 'CONFIRMED', label: 'Confirmed', icon: 'check-square', color: '#10B981' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: 'play-circle', color: '#F97316' },
  { value: 'COMPLETED', label: 'Completed', icon: 'check-circle', color: '#22C55E' },
  { value: 'CANCELLED', label: 'Cancelled', icon: 'x-circle', color: '#EF4444' },
];

const STATUS_COLORS = {
  OPEN_FOR_QUOTES: '#F59E0B',
  QUOTES_RECEIVED: '#3B82F6',
  SUPER_QUOTE_SENT: '#8B5CF6',
  CONFIRMED: '#10B981',
  TRIPS_CREATED: '#06B6D4',
  IN_PROGRESS: '#F97316',
  COMPLETED: '#22C55E',
  INVOICED: '#6366F1',
  PAID: '#059669',
  CANCELLED: '#EF4444',
};

export default function B2BDashboardScreen({ navigation }) {
  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [b2bStatus, setB2bStatus] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pending: 0 });
  const [customer, setCustomer] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  // temp selections inside modal before applying
  const [tempService, setTempService] = useState('all');
  const [tempStatus, setTempStatus] = useState('all');

  const activeFilterCount = (serviceFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const loadData = useCallback(async () => {
    try {
      const custData = await AsyncStorage.getItem('customer');
      if (custData) setCustomer(JSON.parse(custData));

      const bookingParams = { limit: 5 };
      if (serviceFilter !== 'all') bookingParams.serviceType = serviceFilter;
      if (statusFilter !== 'all') bookingParams.status = statusFilter;

      const [statusRes, bookingsRes] = await Promise.all([
        b2bService.getB2BStatus(),
        b2bService.getBookings(bookingParams),
      ]);

      if (statusRes) setB2bStatus(statusRes);

      const list = bookingsRes?.bookings || [];
      setBookings(list);

      const active = list.filter(b => ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status)).length;
      const completed = list.filter(b => ['COMPLETED', 'INVOICED', 'PAID'].includes(b.status)).length;
      const pending = list.filter(b => b.status === 'SUPER_QUOTE_SENT').length;
      setStats({ total: bookingsRes?.total || list.length, active, completed, pending });
    } catch (err) {
      console.log('B2B Dashboard error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serviceFilter, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const openFilterModal = () => {
    setTempService(serviceFilter);
    setTempStatus(statusFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    if (tempService !== serviceFilter || tempStatus !== statusFilter) {
      setServiceFilter(tempService);
      setStatusFilter(tempStatus);
      setLoading(true);
    }
  };

  const clearFilters = () => {
    setTempService('all');
    setTempStatus('all');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatStatus = (status) => status?.replace(/_/g, ' ') || '';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading B2B Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if B2B not approved
  if (b2bStatus && b2bStatus.b2bStatus !== 'APPROVED') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={scale(22)} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>B2B Dashboard</Text>
          <View style={{ width: scale(22) }} />
        </View>
        <View style={styles.pendingContainer}>
          <Icon name="clock" size={scale(60)} color="#F59E0B" />
          <Text style={styles.pendingTitle}>Approval Pending</Text>
          <Text style={styles.pendingText}>
            Your B2B account is under review. You'll be notified once approved by our admin team.
          </Text>
          {b2bStatus.b2bStatus === 'REJECTED' && (
            <View style={[styles.infoBox, { backgroundColor: '#FEF2F2' }]}>
              <Icon name="x-circle" size={scale(16)} color="#EF4444" />
              <Text style={[styles.infoText, { color: '#EF4444' }]}>
                Your application was rejected. Please contact support.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const activeServiceLabel = SERVICE_FILTERS.find(s => s.value === serviceFilter)?.label;
  const activeStatusLabel = STATUS_FILTERS.find(s => s.value === statusFilter)?.label;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with Customer Info */}
      <View style={styles.dashHeader}>
        <View style={styles.dashHeaderTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.dashBackBtn}>
            <Icon name="arrow-left" size={scale(20)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.dashHeaderActions}>
            {/* Filter Button */}
            <TouchableOpacity onPress={openFilterModal} style={styles.dashFilterBtn}>
              <Icon name="sliders" size={scale(17)} color="#fff" />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          
          </View>
        </View>
        <View style={styles.dashHeaderInfo}>
          <View style={styles.dashAvatar}>
            <Icon name="briefcase" size={scale(24)} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dashName}>{customer?.name || 'Welcome'}</Text>
            <Text style={styles.dashCompany}>{b2bStatus?.companyName || customer?.companyName || 'Company'}</Text>
            <View style={styles.dashBadgeRow}>
              <View style={styles.dashApprovedBadge}>
                <Icon name="check-circle" size={scale(10)} color="#fff" />
                <Text style={styles.dashApprovedText}>Approved</Text>
              </View>
              {(b2bStatus?.businessType) && (
                <View style={styles.dashTypeBadge}>
                  <Text style={styles.dashTypeText}>{b2bStatus.businessType}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Active Filter Tags (below header, only when filters active) */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFilterBar}>
          <Icon name="filter" size={scale(13)} color="#22C55E" />
          {serviceFilter !== 'all' && (
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>{activeServiceLabel}</Text>
              <TouchableOpacity onPress={() => { setServiceFilter('all'); setLoading(true); }}>
                <Icon name="x" size={scale(12)} color="#22C55E" />
              </TouchableOpacity>
            </View>
          )}
          {statusFilter !== 'all' && (
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>{activeStatusLabel}</Text>
              <TouchableOpacity onPress={() => { setStatusFilter('all'); setLoading(true); }}>
                <Icon name="x" size={scale(12)} color="#22C55E" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => { setServiceFilter('all'); setStatusFilter('all'); setLoading(true); }}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#22C55E']} />}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: stats.total, icon: 'layers', color: '#3B82F6' },
            { label: 'Active', value: stats.active, icon: 'activity', color: '#F59E0B' },
            { label: 'Done', value: stats.completed, icon: 'check-circle', color: '#22C55E' },
            { label: 'Action', value: stats.pending, icon: 'alert-circle', color: '#EF4444' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Icon name={s.icon} size={scale(18)} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('B2BBookingsList')}>
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="list" size={scale(20)} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>All Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('B2BInvoices')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Icon name="file-text" size={scale(20)} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Invoices</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Actions Alert */}
        {stats.pending > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('B2BBookingsList', { filterStatus: 'SUPER_QUOTE_SENT' })}
          >
            <Icon name="bell" size={scale(20)} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.alertTitle}>{stats.pending} Quote(s) Awaiting Approval</Text>
              <Text style={styles.alertSub}>Tap to review and accept super quotes</Text>
            </View>
            <Icon name="chevron-right" size={scale(18)} color="#999" />
          </TouchableOpacity>
        )}

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('B2BBookingsList', { filterService: serviceFilter, filterStatus: statusFilter !== 'all' ? statusFilter : undefined })}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {bookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="inbox" size={scale(40)} color="#ccc" />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.emptyBtnText}>Create First Booking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.slice(0, 5).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('B2BBookingDetail', { bookingId: booking.id })}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[booking.status] || '#999') + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] || '#999' }]}>
                      {formatStatus(booking.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailRow}>
                    <Icon name="truck" size={scale(14)} color="#666" />
                    <Text style={styles.bookingDetailText}>
                      {booking.serviceType} - {booking.vehiclesRequired} vehicle(s)
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Icon name="map-pin" size={scale(14)} color="#666" />
                    <Text style={styles.bookingDetailText} numberOfLines={1}>
                      {booking.pickupLocation} {booking.dropLocation ? `→ ${booking.dropLocation}` : ''}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Icon name="calendar" size={scale(14)} color="#666" />
                    <Text style={styles.bookingDetailText}>{formatDate(booking.scheduledDate)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ====== FILTER BOTTOM SHEET MODAL ====== */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
          <View style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Bookings</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.modalClearText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(10) }}>
              {/* ---- Service Type ---- */}
              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <Icon name="truck" size={scale(16)} color="#1A1A2E" />
                  <Text style={styles.filterGroupTitle}>Service Type</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {SERVICE_FILTERS.map((sf) => {
                    const isActive = tempService === sf.value;
                    return (
                      <TouchableOpacity
                        key={sf.value}
                        activeOpacity={0.7}
                        style={[
                          styles.filterOption,
                          isActive && { backgroundColor: sf.color, borderColor: sf.color },
                        ]}
                        onPress={() => setTempService(sf.value)}
                      >
                        <View style={[styles.filterOptionIcon, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : sf.bg }]}>
                          <Icon name={sf.icon} size={scale(15)} color={isActive ? '#fff' : sf.color} />
                        </View>
                        <Text style={[styles.filterOptionLabel, isActive && { color: '#fff' }]}>{sf.label}</Text>
                        {isActive && (
                          <View style={styles.filterCheck}>
                            <Icon name="check" size={scale(10)} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ---- Booking Status ---- */}
              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <Icon name="activity" size={scale(16)} color="#1A1A2E" />
                  <Text style={styles.filterGroupTitle}>Booking Status</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {STATUS_FILTERS.map((sf) => {
                    const isActive = tempStatus === sf.value;
                    return (
                      <TouchableOpacity
                        key={sf.value}
                        activeOpacity={0.7}
                        style={[
                          styles.filterOption,
                          isActive && { backgroundColor: sf.color, borderColor: sf.color },
                        ]}
                        onPress={() => setTempStatus(sf.value)}
                      >
                        <View style={[styles.filterOptionIcon, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : sf.color + '15' }]}>
                          <Icon name={sf.icon} size={scale(15)} color={isActive ? '#fff' : sf.color} />
                        </View>
                        <Text style={[styles.filterOptionLabel, isActive && { color: '#fff' }]}>{sf.label}</Text>
                        {isActive && (
                          <View style={styles.filterCheck}>
                            <Icon name="check" size={scale(10)} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.8}>
                <Icon name="check-circle" size={scale(18)} color="#fff" />
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: scale(10), color: '#666', fontSize: scale(14) },
  dashHeader: {
    backgroundColor: '#1A1A2E',
    paddingTop: scale(8),
    paddingBottom: scale(20),
    paddingHorizontal: scale(16),
    borderBottomLeftRadius: scale(15),
    borderBottomRightRadius: scale(15),
  },
  dashHeaderTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(16),
  },
  dashHeaderActions: {
    flexDirection: 'row', alignItems: 'center', gap: scale(10),
  },
  dashBackBtn: {
    width: scale(36), height: scale(36), borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  dashFilterBtn: {
    width: scale(36), height: scale(36), borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -scale(3), right: -scale(3),
    width: scale(18), height: scale(18), borderRadius: scale(9),
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1A1A2E',
  },
  filterBadgeText: { fontSize: scale(9), color: '#fff', fontWeight: '800' },
  dashAddBtn: {
    width: scale(36), height: scale(36), borderRadius: scale(18),
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  dashHeaderInfo: { flexDirection: 'row', alignItems: 'center' },
  dashAvatar: {
    width: scale(52), height: scale(52), borderRadius: scale(26),
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginRight: scale(14),
  },
  dashName: { fontSize: scale(18), fontWeight: '800', color: '#fff' },
  dashCompany: { fontSize: scale(13), color: 'rgba(255,255,255,0.7)', marginTop: scale(2) },
  dashBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: scale(6), gap: scale(6) },
  dashApprovedBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E',
    paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10), gap: scale(4),
  },
  dashApprovedText: { fontSize: scale(9), color: '#fff', fontWeight: '700' },
  dashTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10),
  },
  dashTypeText: { fontSize: scale(9), color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  // Active filter tags bar
  activeFilterBar: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
    paddingHorizontal: scale(16), paddingVertical: scale(10),
    backgroundColor: '#F0FFF4', borderBottomWidth: 1, borderBottomColor: '#D1FAE5',
  },
  activeTag: {
    flexDirection: 'row', alignItems: 'center', gap: scale(4),
    backgroundColor: '#fff', paddingHorizontal: scale(10), paddingVertical: scale(5),
    borderRadius: scale(16), borderWidth: 1, borderColor: '#22C55E',
  },
  activeTagText: { fontSize: scale(11), fontWeight: '600', color: '#22C55E' },
  clearAllText: { fontSize: scale(11), fontWeight: '700', color: '#EF4444', marginLeft: 'auto' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(18), fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { paddingBottom: scale(100) },
  statsRow: { flexDirection: 'row', paddingHorizontal: scale(12), marginTop: scale(10), marginBottom: scale(8) },
  statCard: {
    flex: 1, backgroundColor: '#fff', marginHorizontal: scale(4), borderRadius: scale(12),
    padding: scale(12), alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  statValue: { fontSize: scale(20), fontWeight: '800', color: '#1A1A1A', marginTop: scale(4) },
  statLabel: { fontSize: scale(10), color: '#999', marginTop: scale(2), fontWeight: '500' },
  section: { paddingHorizontal: scale(16), marginTop: scale(16) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) },
  sectionTitle: { fontSize: scale(16), fontWeight: '700', color: '#1A1A1A', marginBottom: scale(12) },
  viewAll: { fontSize: scale(13), color: '#22C55E', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: scale(10) },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: scale(14), padding: scale(14),
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  actionIcon: {
    width: scale(44), height: scale(44), borderRadius: scale(12),
    alignItems: 'center', justifyContent: 'center', marginBottom: scale(8),
  },
  actionText: { fontSize: scale(12), fontWeight: '600', color: '#333' },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
    marginHorizontal: scale(16), marginTop: scale(16), borderRadius: scale(14),
    padding: scale(14), borderWidth: 1, borderColor: '#FDE68A',
  },
  alertTitle: { fontSize: scale(13), fontWeight: '700', color: '#92400E' },
  alertSub: { fontSize: scale(11), color: '#B45309', marginTop: scale(2) },
  bookingCard: {
    backgroundColor: '#fff', borderRadius: scale(14), padding: scale(14),
    marginBottom: scale(10), elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(10) },
  bookingNumber: { fontSize: scale(14), fontWeight: '700', color: '#1A1A1A' },
  statusBadge: { paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(20) },
  statusText: { fontSize: scale(10), fontWeight: '700', textTransform: 'uppercase' },
  bookingDetails: { gap: scale(6) },
  bookingDetailRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  bookingDetailText: { fontSize: scale(12), color: '#666', flex: 1 },
  emptyCard: { alignItems: 'center', paddingVertical: scale(30) },
  emptyText: { fontSize: scale(14), color: '#999', marginTop: scale(10) },
  emptyBtn: { marginTop: scale(14), backgroundColor: '#22C55E', paddingHorizontal: scale(20), paddingVertical: scale(10), borderRadius: scale(10) },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: scale(13) },
  pendingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(30) },
  pendingTitle: { fontSize: scale(22), fontWeight: '700', color: '#1A1A1A', marginTop: scale(16) },
  pendingText: { fontSize: scale(14), color: '#666', textAlign: 'center', marginTop: scale(8), lineHeight: scale(22) },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#FEF2F2', borderRadius: scale(10),
    padding: scale(12), marginTop: scale(16), gap: scale(8),
  },
  infoText: { fontSize: scale(12), flex: 1, lineHeight: scale(18) },

  // ====== Filter Modal Styles ======
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(24), borderTopRightRadius: scale(24),
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? scale(30) : scale(16),
  },
  modalHandle: {
    width: scale(40), height: scale(4), borderRadius: scale(2),
    backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: scale(10), marginBottom: scale(6),
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(20), paddingVertical: scale(14),
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: scale(18), fontWeight: '800', color: '#1A1A2E' },
  modalClearText: { fontSize: scale(13), fontWeight: '600', color: '#EF4444' },
  filterGroup: {
    paddingHorizontal: scale(20), marginTop: scale(18),
  },
  filterGroupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(12),
  },
  filterGroupTitle: {
    fontSize: scale(14), fontWeight: '700', color: '#1A1A2E',
  },
  filterOptionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: scale(8),
  },
  filterOption: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
    paddingHorizontal: scale(12), paddingVertical: scale(10),
    borderRadius: scale(12), backgroundColor: '#F9FAFB',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterOptionIcon: {
    width: scale(30), height: scale(30), borderRadius: scale(8),
    alignItems: 'center', justifyContent: 'center',
  },
  filterOptionLabel: {
    fontSize: scale(12), fontWeight: '600', color: '#444',
  },
  filterCheck: {
    width: scale(18), height: scale(18), borderRadius: scale(9),
    backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center',
    marginLeft: scale(2),
  },
  modalFooter: {
    paddingHorizontal: scale(20), paddingTop: scale(12),
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8),
    backgroundColor: '#22C55E', paddingVertical: scale(15), borderRadius: scale(14),
  },
  applyBtnText: { fontSize: scale(15), fontWeight: '700', color: '#fff' },
});

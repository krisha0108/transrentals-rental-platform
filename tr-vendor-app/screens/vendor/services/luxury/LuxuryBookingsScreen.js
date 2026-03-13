import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation,
  Platform, UIManager, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8', blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB', red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED', indigo: '#4F46E5', indigoL: '#EEF2FF',
  teal: '#0D9488', tealL: '#F0FDFA', pink: '#DB2777', pinkL: '#FDF2F8',
  cyan: '#0891B2', cyanL: '#ECFEFF',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { label: 'Payment Pending',   color: C.amber  },
  PAYMENT_VERIFIED: { label: 'Payment Verified',  color: C.g600   },
  BROADCASTED:      { label: 'Open',              color: C.blue   },
  PENDING_VENDOR:   { label: 'Pending',           color: C.amber  },
  ACCEPTED:         { label: 'Accepted',          color: C.g600   },
  CONFIRMED:        { label: 'Confirmed',         color: C.g600   },
  READY_FOR_PICKUP: { label: 'Ready for Pickup',  color: C.cyan   },
  IN_PROGRESS:      { label: 'In Progress',       color: C.indigo },
  COMPLETED:        { label: 'Completed',         color: C.g700   },
  CANCELLED:        { label: 'Cancelled',         color: C.red    },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const ERow = ({ iconName, label, value }) => (
  <View style={styles.eRow}>
    <View style={styles.eIconWrap}>
      <Icon name={iconName} size={12} color={C.sub} />
    </View>
    <Text style={styles.eLabel}>{label}</Text>
    <Text style={styles.eVal}>{value}</Text>
  </View>
);

export default function LuxuryBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter,  setShowDateFilter]  = useState(false);
  const [selectedFilter,  setSelectedFilter]  = useState('active');
  const [expandedId,      setExpandedId]      = useState(null);

  const {
    data: allBookings, loading, refreshing, hasMore,
    loadMore, refresh, initialLoad, applyDateFilter, dateFilter,
  } = useInfiniteScroll(getBookings, { service: 'luxury', type: filter });

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const bookings = selectedFilter === 'completed'
    ? allBookings.filter(b => b.status === 'COMPLETED')
    : allBookings.filter(b => b.status !== 'COMPLETED');

  const activeCount    = allBookings.filter(b => b.status !== 'COMPLETED').length;
  const completedCount = allBookings.filter(b => b.status === 'COMPLETED').length;

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label: item.status, color: C.muted };
    const isExpanded = expandedId === item.id;

    const handlePress = () => {
      if (item.type === 'quote_request' || item.type === 'quoted') {
        navigation.navigate('LuxuryQuoteRequestDetail', { requestId: item.id });
      } else {
        navigation.navigate('LuxuryBookingDetail', { bookingId: item.id, serviceType: 'luxury' });
      }
    };

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <Text style={styles.bookingNum}>#{item.bookingNumber}</Text>
              {item.totalDays && (
                <View style={styles.daysChip}>
                  <Text style={styles.daysChipText}>{item.totalDays}d rental</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${sc.color}18` }]}>
              <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: C.g50 }]}>
                <Icon name="user" size={13} color={C.g700} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>{item.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: C.blueL }]}>
                <Icon name="map-pin" size={13} color={C.blue} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.locationName || item.pickupCity || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: C.amberL }]}>
                <Icon name="calendar" size={13} color={C.amber} />
              </View>
              <Text style={styles.infoText}>
                {fmt(item.pickupDate)}
                {item.pickupTime ? `  ${item.pickupTime.slice(0, 5)}` : ''}
              </Text>
            </View>
            {item.vehicleName && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: C.g50 }]}>
                  <MaterialCommunityIcons name="car-sports" size={13} color={C.g700} />
                </View>
                <Text style={[styles.infoText, { fontWeight: '600' }]} numberOfLines={1}>
                  {item.vehicleName}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.amtLabel}>Total Amount</Text>
              <Text style={styles.amtValue}>
                ₹{(item.grandTotal || item.totalAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => toggleExpand(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.expandCircle, isExpanded && styles.expandCircleActive]}>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={isExpanded ? '#fff' : C.sub}
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.arrowCircle}>
                <Icon name="arrow-right" size={14} color={C.g700} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandDivider} />
            {item.vehicleBrand && (
              <ERow iconName="zap" label="Brand" value={item.vehicleBrand} />
            )}
            {item.pickupAddress && (
              <ERow iconName="map-pin" label="Pickup Addr." value={item.pickupAddress} />
            )}
            {item.dropDate && (
              <ERow
                iconName="calendar"
                label="Drop Date"
                value={`${fmt(item.dropDate)}${item.dropTime ? `  ${item.dropTime.slice(0, 5)}` : ''}`}
              />
            )}
            {item.securityDeposit > 0 && (
              <ERow
                iconName="shield"
                label="Security Dep."
                value={`₹${(item.securityDeposit || 0).toLocaleString('en-IN')}`}
              />
            )}
            {item.dailyRate && (
              <ERow iconName="tag" label="Daily Rate" value={`₹${item.dailyRate}/day`} />
            )}
            {item.customerNotes && (
              <View style={[styles.eRow, { alignItems: 'flex-start' }]}>
                <View style={styles.eIconWrap}>
                  <Icon name="file-text" size={12} color={C.sub} />
                </View>
                <Text style={styles.eLabel}>Notes</Text>
                <Text style={[styles.eVal, { flex: 1 }]}>{item.customerNotes}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={handlePress}
            >
              <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
              <Icon name="arrow-right" size={14} color={C.g700} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Luxury Bookings</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDateFilter(true)} style={styles.filterBtn}>
          <Icon name="calendar" size={20} color="#fff" />
          {dateFilter.start && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabBar}>
        {[
          { key: 'active',    label: 'Active',    count: activeCount,    icon: 'activity'      },
          { key: 'completed', label: 'Completed', count: completedCount, icon: 'check-circle'  },
        ].map(tab => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setSelectedFilter(tab.key)}
            >
              <Icon name={tab.icon} size={14} color={isActive ? '#fff' : C.muted} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && allBookings.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.g600} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.g600]} />
          }
          ListFooterComponent={
            loading && hasMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={C.g600} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons name="car-sports" size={44} color={C.g400} />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedFilter === 'completed' ? 'No completed bookings' : 'No active bookings'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'completed'
                  ? 'Completed rides will appear here'
                  : 'Your current luxury car bookings will appear here'}
              </Text>
            </View>
          }
        />
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApply={(st, e, t) => applyDateFilter(st, e, t)}
        currentStartDate={dateFilter.start}
        currentEndDate={dateFilter.end}
        currentFilterType={dateFilter.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.g400,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    paddingHorizontal: 16, paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
  },
  tabPillActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabLabel:       { fontSize: 13, fontWeight: '600', color: C.muted },
  tabLabelActive: { color: '#fff' },
  tabBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: C.card,
    justifyContent: 'center', alignItems: 'center',
  },
  tabBadgeActive:    { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:      { fontSize: 11, fontWeight: '700', color: C.g700 },
  tabBadgeTextActive:{ color: '#fff' },

  listContent: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
  },
  cardTopLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bookingNum:   { fontSize: 15, fontWeight: '700', color: C.text },
  daysChip: {
    backgroundColor: C.g50, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: C.g100,
  },
  daysChipText: { fontSize: 11, color: C.g700, fontWeight: '600' },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  cardBody: { paddingHorizontal: 14, gap: 8, paddingBottom: 10 },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIconWrap: {
    width: 26, height: 26, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  amtLabel: { fontSize: 11, color: C.muted, marginBottom: 2 },
  amtValue: { fontSize: 17, fontWeight: '800', color: C.g700 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandBtn: {},
  expandCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  expandCircleActive: { backgroundColor: C.g700, borderColor: C.g700 },
  arrowCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },

  expandedSection: { paddingHorizontal: 14, paddingBottom: 14, backgroundColor: '#FAFCFF' },
  expandDivider:   { height: 1, backgroundColor: C.border, marginBottom: 12 },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  eIconWrap: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  eLabel: { fontSize: 12, color: C.muted, width: 80 },
  eVal:   { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  viewDetailsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  viewDetailsBtnText: { fontSize: 13, fontWeight: '700', color: C.g700 },

  emptyState:    { alignItems: 'center', paddingVertical: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center' },
});

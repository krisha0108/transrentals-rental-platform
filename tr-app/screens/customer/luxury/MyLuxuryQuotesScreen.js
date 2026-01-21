import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api';

// Light Mode Colors
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const BG = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E5E7EB';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  QUOTES_RECEIVED: '#3B82F6',
  ACCEPTED: '#10B981',
  BOOKING_CONFIRMED: '#10B981',
  EXPIRED: '#EF4444',
  CANCELLED: '#EF4444',
};

const TRIP_TYPE_ICONS = {
  local: 'city',
  outstation: 'road-variant',
  airport: 'airplane',
};

export default function MyLuxuryQuotesScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadCustomerAndFetch();
    }, [])
  );

  const loadCustomerAndFetch = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const customer = JSON.parse(data);
        setCustomerData(customer);
        await fetchQuoteRequests(customer);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      setLoading(false);
    }
  };

  const fetchQuoteRequests = async (customer) => {
    try {
      const response = await api.get('/customer/luxury-quote-requests', {
        params: {
          customer_id: customer?.id,
          email: customer?.email,
          phone: customer?.phone,
        },
      });

      if (response.data.success) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching luxury quote requests:', error);
      Alert.alert('Error', 'Failed to load quote requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (customerData) {
      fetchQuoteRequests(customerData);
    } else {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ');
  };

  const renderRequestCard = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || TEXT_SECONDARY;
    const tripIcon = TRIP_TYPE_ICONS[item.tripType] || 'car-luxury';
    const hasQuotes = item.totalQuotesReceived > 0;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => navigation.navigate('LuxuryQuoteDetail', { requestId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardGradient}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={tripIcon} size={24} color={AMBER} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.requestNumber}>{item.requestNumber}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            {hasQuotes && (
              <View style={styles.quotesBadge}>
                <MaterialCommunityIcons name="email-multiple" size={16} color={AMBER} />
                <Text style={styles.quotesCount}>{item.totalQuotesReceived}</Text>
              </View>
            )}
          </View>

          {/* Vehicle Category */}
          <View style={styles.categoryRow}>
            <MaterialCommunityIcons name="crown" size={16} color={AMBER} />
            <Text style={styles.categoryText}>{item.vehicleCategoryName || item.vehicleCategory}</Text>
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routeItem}>
              <Ionicons name="location" size={16} color={TEXT_SECONDARY} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.pickupCity}
              </Text>
            </View>
            {item.dropCity && (
              <>
                <Ionicons name="arrow-forward" size={14} color={TEXT_SECONDARY} />
                <View style={styles.routeItem}>
                  <Ionicons name="location" size={16} color={TEXT_SECONDARY} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {item.dropCity}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Trip Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color={TEXT_SECONDARY} />
              <Text style={styles.detailText}>{formatDate(item.pickupDate)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={TEXT_SECONDARY} />
              <Text style={styles.detailText}>{item.pickupTime}</Text>
            </View>
            {item.tripDays > 1 && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar-range" size={14} color={TEXT_SECONDARY} />
                <Text style={styles.detailText}>{item.tripDays} Days</Text>
              </View>
            )}
          </View>

          {/* Occasion */}
          {item.occasion && (
            <View style={styles.occasionBadge}>
              <Text style={styles.occasionText}>{item.occasion.toUpperCase()}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>
              {hasQuotes ? 'Tap to view quotes' : 'Waiting for vendor quotes'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={AMBER} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="crown-outline" size={80} color={TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No Quote Requests</Text>
      <Text style={styles.emptyText}>
        You haven't requested any luxury car rental quotes yet
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('LuxuryCarRental')}
      >
        <LinearGradient
          colors={[AMBER, AMBER_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtnGradient}
        >
          <MaterialCommunityIcons name="plus" size={20} color={BG} />
          <Text style={styles.emptyBtnText}>Request a Quote</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Luxury Quotes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="crown" size={22} color={AMBER} />
          <Text style={styles.headerTitle}>My Luxury Quotes</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('LuxuryCarRental')}
          style={styles.addBtn}
        >
          <MaterialCommunityIcons name="plus" size={24} color={AMBER} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {requests.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{requests.length}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {requests.filter((r) => r.status === 'PENDING').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {requests.reduce((sum, r) => sum + (r.totalQuotesReceived || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Quotes Received</Text>
          </View>
        </View>
      )}

      {/* Requests List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AMBER]}
            tintColor={AMBER}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: AMBER,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AMBER + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  requestNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quotesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AMBER + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  quotesCount: {
    fontSize: 13,
    fontWeight: '700',
    color: AMBER,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: AMBER,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  routeText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  occasionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AMBER + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  occasionText: {
    fontSize: 10,
    fontWeight: '700',
    color: AMBER,
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyBtn: {
    marginTop: 24,
    borderRadius: 999,
    overflow: 'hidden',
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: BG,
  },
});

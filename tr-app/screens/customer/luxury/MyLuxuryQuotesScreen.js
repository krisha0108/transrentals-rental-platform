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
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

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

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }
      return () => {
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF', true);
        }
      };
    }, [])
  );

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
              <MaterialCommunityIcons name={tripIcon} size={wp('5.5%')} color={TEAL_MID} />
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
                <MaterialCommunityIcons name="email-multiple" size={wp('3.8%')} color={TEAL_MID} />
                <Text style={styles.quotesCount}>{item.totalQuotesReceived}</Text>
              </View>
            )}
          </View>

          {/* Vehicle Category */}
          <View style={styles.categoryRow}>
            <MaterialCommunityIcons name="crown" size={wp('3.8%')} color={TEAL_MID} />
            <Text style={styles.categoryText}>{item.vehicleCategoryName || item.vehicleCategory}</Text>
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routeItem}>
              <Ionicons name="location" size={wp('3.8%')} color={TEAL} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.pickupCity}
              </Text>
            </View>
            {item.dropCity && (
              <>
                <Ionicons name="arrow-forward" size={wp('3.5%')} color={TEXT_MUTED} />
                <View style={styles.routeItem}>
                  <Ionicons name="location" size={wp('3.8%')} color="#EF4444" />
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
              <Ionicons name="calendar-outline" size={wp('3.3%')} color={TEXT_MUTED} />
              <Text style={styles.detailText}>{formatDate(item.pickupDate)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={wp('3.3%')} color={TEXT_MUTED} />
              <Text style={styles.detailText}>{item.pickupTime}</Text>
            </View>
            {item.tripDays > 1 && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar-range" size={wp('3.3%')} color={TEXT_MUTED} />
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
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEAL} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="crown-outline" size={wp('12%')} color={TEAL_MID} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Quote Requests</Text>
      <Text style={styles.emptyText}>
        You haven't requested any luxury car rental quotes yet
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('LuxuryCarRental')}
      >
        <LinearGradient
          colors={[TEAL_MID, '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtnGradient}
        >
          <MaterialCommunityIcons name="plus" size={wp('4.5%')} color="#FFF" />
          <Text style={styles.emptyBtnText}>Request a Quote</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
          <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Luxury Quotes</Text>
            <View style={{ width: wp('9%') }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="crown" size={wp('5%')} color={TEAL_LIGHT} />
              <Text style={styles.headerTitle}>My Luxury Quotes</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('LuxuryCarRental')}
            style={styles.headerActionBtn}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Glass Card */}
        {requests.length > 0 && (
          <View style={styles.glassCard}>
            <View style={styles.statsGlassRow}>
              <View style={styles.statGlassItem}>
                <Text style={styles.statGlassValue}>{requests.length}</Text>
                <Text style={styles.statGlassLabel}>Total</Text>
              </View>
              <View style={styles.statGlassDivider} />
              <View style={styles.statGlassItem}>
                <Text style={styles.statGlassValue}>
                  {requests.filter((r) => r.status === 'PENDING').length}
                </Text>
                <Text style={styles.statGlassLabel}>Pending</Text>
              </View>
              <View style={styles.statGlassDivider} />
              <View style={styles.statGlassItem}>
                <Text style={styles.statGlassValue}>
                  {requests.reduce((sum, r) => sum + (r.totalQuotesReceived || 0), 0)}
                </Text>
                <Text style={styles.statGlassLabel}>Quotes</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

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
            colors={[TEAL]}
            tintColor={TEAL}
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

  // Gradient Header
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: hp('2%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerActionBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Glass stats card
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statsGlassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statGlassItem: {
    flex: 1,
    alignItems: 'center',
  },
  statGlassValue: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statGlassLabel: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: hp('0.3%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statGlassDivider: {
    width: 1,
    height: hp('4%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  // List
  listContent: {
    padding: wp('4%'),
    paddingBottom: hp('12%'),
  },

  // Request Card
  requestCard: {
    marginBottom: hp('1.5%'),
    borderRadius: wp('4%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  cardGradient: {
    padding: wp('4%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  iconContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  cardHeaderInfo: {
    flex: 1,
  },
  requestNumber: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  statusDot: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    borderRadius: wp('0.75%'),
  },
  statusText: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quotesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('3%'),
    gap: wp('1%'),
  },
  quotesCount: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: wp('2%'),
  },
  categoryText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: wp('2%'),
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp('1%'),
  },
  routeText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    flex: 1,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
    marginBottom: hp('1.2%'),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  detailText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  occasionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.4%'),
    borderRadius: 999,
    marginBottom: hp('1.2%'),
  },
  occasionText: {
    fontSize: wp('2.5%'),
    fontWeight: '700',
    color: TEAL_MID,
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp('10%'),
    paddingHorizontal: wp('8%'),
  },
  emptyIconCircle: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  emptyText: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    maxWidth: wp('75%'),
    lineHeight: wp('5%'),
  },
  emptyBtn: {
    marginTop: hp('3%'),
    borderRadius: 999,
    overflow: 'hidden',
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.6%'),
    gap: wp('2%'),
  },
  emptyBtnText: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

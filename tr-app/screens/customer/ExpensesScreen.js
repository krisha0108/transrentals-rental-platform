import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../api';
import { BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../theme';

/* ── Color Palette ───────────────────────── */
const INDIGO_DEEP   = '#1E1B4B';
const INDIGO_MID    = '#312E81';
const INDIGO        = '#4338CA';
const EMERALD       = '#10B981';
const EMERALD_DARK  = '#059669';
const CARD_BORDER   = '#F0F2F5';

const SERVICE_META = {
  bike:         { icon: 'bicycle',      color: '#3B82F6', bg: '#EFF6FF'  },
  car:          { icon: 'car-sport',    color: '#8B5CF6', bg: '#F5F3FF'  },
  bus:          { icon: 'bus',          color: '#F59E0B', bg: '#FFFBEB'  },
  truck:        { icon: 'cube',         color: '#EF4444', bg: '#FEF2F2'  },
  equipment:    { icon: 'construct',    color: '#06B6D4', bg: '#ECFEFF'  },
  packers:      { icon: 'archive',      color: '#EC4899', bg: '#FDF2F8'  },
  luxury:       { icon: 'diamond',      color: '#D97706', bg: '#FFFBEB'  },
  chauffeur:    { icon: 'person',       color: '#7C3AED', bg: '#F5F3FF'  },
  'self-drive': { icon: 'key',          color: '#0EA5E9', bg: '#F0F9FF'  },
};

/* ── Helpers ───────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'N/A';
  const day = d.getDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = d.getHours() % 12 || 12;
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${mins} ${ampm}`;
};

const SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 6 },
});

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 3 },
});

/* ── Animated Transaction Card ───────────────────────── */
const TransactionCard = ({ item, index, onPress }) => {
  const meta = SERVICE_META[item.service_type] || { icon: 'swap-horizontal', color: INDIGO, bg: '#EEF2FF' };
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.txnCard, { borderLeftColor: meta.color, borderLeftWidth: 3 }]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.txnIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        <View style={styles.txnInfo}>
          <View style={styles.txnTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txnService} numberOfLines={1}>
                {item.source_name || 'Payment'}
              </Text>
              <Text style={styles.txnBookingNum} numberOfLines={1}>
                {item.booking_number ? `#${item.booking_number}` : 'Advance Payment'}
              </Text>
            </View>
            <Text style={styles.txnAmount}>
              {'\u20B9'}{parseFloat(item.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.txnBottomRow}>
            <View style={styles.txnMeta}>
              <Text style={styles.txnVendor} numberOfLines={1}>
                {item.vendor?.name || 'N/A'}
              </Text>
              <View style={styles.txnDot} />
              <Text style={styles.txnDate}>{formatDate(item.payment_date || item.created_at)}</Text>
            </View>

            <View style={styles.txnStatusRow}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                style={styles.statusPill}
              >
                <Ionicons name="checkmark-circle" size={12} color={EMERALD_DARK} />
                <Text style={styles.statusPillText}>Paid</Text>
              </LinearGradient>
              <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} style={{ marginLeft: 6 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ── Shimmer Skeleton Card ───────────────────────── */
const SkeletonCard = () => (
  <View style={styles.shimmerCard}>
    <View style={styles.shimmerRow}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        visible={false}
        autoRun
        style={styles.shimmerIcon}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          visible={false}
          autoRun
          style={styles.shimmerLineShort}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          visible={false}
          autoRun
          style={styles.shimmerLineLong}
        />
      </View>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        visible={false}
        autoRun
        style={styles.shimmerPrice}
      />
    </View>
    <View style={styles.shimmerBottom}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        visible={false}
        autoRun
        style={styles.shimmerLineMedium}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        visible={false}
        autoRun
        style={styles.shimmerBadge}
      />
    </View>
  </View>
);

/* ── Main Screen ───────────────────────── */
export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  // StatusBar sirf is screen pe indigo, leave karne pe green restore
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(INDIGO_DEEP, true);
      }
      // Cleanup: jab screen se bahar jaayein toh green wapas karo
      return () => {
        StatusBar.setBarStyle('light-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#0A6B3F', true);
        }
      };
    }, [])
  );

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = expenses.filter(item => {
        const vendorMatch = item.vendor?.name?.toLowerCase().includes(query);
        const sourceMatch = item.source_name?.toLowerCase().includes(query);
        const descriptionMatch = item.description?.toLowerCase().includes(query);
        const priceMatch = item.amount?.toString().includes(query) ||
                           `\u20B9${item.amount}`.includes(query);
        const quotationIdMatch = item.quotation_id?.toString().includes(query);
        const bookingIdMatch = item.booking_id?.toString().includes(query);
        const serviceMatch = item.service_name?.toLowerCase().includes(query) ||
                             item.service_type?.toLowerCase().includes(query);
        const locationMatch = item.location_name?.toLowerCase().includes(query) ||
                              item.location?.toLowerCase().includes(query);
        const destinationMatch = item.destination?.toLowerCase().includes(query);

        return vendorMatch || sourceMatch || descriptionMatch ||
               priceMatch || quotationIdMatch || bookingIdMatch ||
               serviceMatch || locationMatch || destinationMatch;
      });
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [searchQuery, expenses]);

  const fetchExpenses = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customer_id");
      console.log('customer_id:', customerId);
      if (!customerId) {
        console.log('No customer ID found.');
        return;
      }
      const res = await api.get(`/customer/expenses`, {
        params: { customer_id: customerId }
      });
      console.log('API response data:', res.data);

      if (res.data.expenses && res.data.expenses.length > 0) {
        console.log('Available fields in first expense:', Object.keys(res.data.expenses[0]));
      }

      if (res.data.status) {
        const sortedExpenses = res.data.expenses.sort((a, b) => {
          const dateA = new Date(a.payment_date || a.created_at || a.date);
          const dateB = new Date(b.payment_date || b.created_at || b.date);
          return dateB - dateA;
        });
        setExpenses(sortedExpenses);
        setFilteredExpenses(sortedExpenses);
      } else {
        console.log('Error:', res.data.message);
      }
    } catch (error) {
      console.log('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchExpenses();
    setRefreshing(false);
  };

  const totalExpenses = expenses.reduce((total, item) => total + parseFloat(item.amount || 0), 0);

  const handlePaymentCardClick = (item) => {
    if (!item.booking_id || !item.service_type) {
      console.log('No booking ID or service type found for this payment');
      alert('Booking details not available for this payment');
      return;
    }

    const screenMapping = {
      'bike': 'BikeBookingDetail',
      'self-drive': 'SelfDriveBookingDetail',
      'luxury': 'LuxuryBookingDetail',
      'truck': 'TruckBookingDetail',
      'equipment': 'EquipmentBookingDetail',
      'packers': 'PackersBookingDetail',
      'bus': 'BusBookingDetail',
    };

    const screen = screenMapping[item.service_type];
    if (screen) {
      navigation.navigate(screen, { bookingId: item.booking_id });
    } else {
      console.log('Unknown service type:', item.service_type);
      alert('Unable to open booking details');
    }
  };

  /* ── Render ───────────────────────── */
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={INDIGO_DEEP} />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[INDIGO_DEEP, INDIGO_MID, INDIGO]}
        style={styles.headerGrad}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSub}>Your transactions</Text>
          </View>
          <View style={{ width: 30 }} />
        </View>

        {/* ── Glass Summary Card ── */}
        {!loading && expenses.length > 0 && (
          <View style={styles.glassCard}>
            <View style={styles.glassStat}>
              <View style={styles.glassIconWrap}>
                <Ionicons name="wallet" size={16} color={INDIGO} />
              </View>
              <View>
                <Text style={styles.glassLabel}>Total Spent</Text>
                <Text style={styles.glassValue}>
                  {'\u20B9'}{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
            <View style={styles.glassDivider} />
            <View style={styles.glassStat}>
              <View style={styles.glassIconWrap}>
                <Ionicons name="receipt" size={16} color={INDIGO} />
              </View>
              <View>
                <Text style={styles.glassLabel}>Transactions</Text>
                <Text style={styles.glassValue}>{expenses.length}</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Search Bar ── */}
        {!loading && expenses.length > 0 && (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search payments..."
              placeholderTextColor={TEXT_MUTED}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ── Transaction List ── */}
        <FlatList
          data={loading ? Array(5).fill({}) : filteredExpenses}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) =>
            loading ? (
              <SkeletonCard key={index} />
            ) : (
              <TransactionCard
                item={item}
                index={index}
                onPress={handlePaymentCardClick}
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={INDIGO}
              colors={[INDIGO]}
            />
          }
          ListHeaderComponent={
            <>
              {/* No search results */}
              {!loading && searchQuery && filteredExpenses.length === 0 && (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconBg}>
                    <Ionicons name="search" size={32} color={INDIGO} />
                  </View>
                  <Text style={styles.emptyTitle}>No Results</Text>
                  <Text style={styles.emptyDesc}>
                    No payments found for "{searchQuery}"
                  </Text>
                </View>
              )}

              {/* Empty state — no transactions at all */}
              {!loading && expenses.length === 0 && !searchQuery && (
                <View style={styles.emptyWrap}>
                  <LinearGradient
                    colors={['#EEF2FF', '#E0E7FF']}
                    style={styles.emptyIconGrad}
                  >
                    <Image
                      source={require('../../assets/NoPayment.png')}
                      style={styles.emptyImage}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                  <Text style={styles.emptyDesc}>
                    Your payment history will appear here{'\n'}once you complete a booking.
                  </Text>
                </View>
              )}

              {/* Section header */}
              {!loading && filteredExpenses.length > 0 && (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Recent Payments</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{filteredExpenses.length}</Text>
                  </View>
                </View>
              )}
            </>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: INDIGO_DEEP,
  },
  body: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Header */
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: wp('5%'),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: wp('4%'),
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 2,
  },

  /* Glass Summary Card */
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: wp('3.5%'),
    paddingHorizontal: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassLabel: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  glassValue: {
    fontSize: wp('4.2%'),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  glassDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: wp('3%'),
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: -wp('3%'),
    marginBottom: wp('3%'),
    borderRadius: 14,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: Platform.OS === 'ios' ? wp('2.8%') : wp('1%'),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW,
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    marginLeft: 8,
    paddingVertical: Platform.OS === 'ios' ? 0 : 6,
  },

  /* List */
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('12%'),
    paddingTop: wp('1%'),
  },

  /* Section Header */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: wp('3%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  countBadge: {
    backgroundColor: INDIGO,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Transaction Card */
  txnCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: wp('3.5%'),
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...SHADOW_SM,
  },
  txnIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  txnInfo: {
    flex: 1,
  },
  txnTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txnService: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  txnBookingNum: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
    marginTop: 2,
  },
  txnAmount: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: EMERALD_DARK,
    marginLeft: 8,
  },
  txnBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txnMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txnVendor: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    fontWeight: '500',
    maxWidth: wp('22%'),
  },
  txnDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: TEXT_MUTED,
    marginHorizontal: 6,
  },
  txnDate: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
  },
  txnStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  statusPillText: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
    color: EMERALD_DARK,
  },

  /* Shimmer Skeleton */
  shimmerCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: wp('3.5%'),
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW_SM,
  },
  shimmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shimmerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
  },
  shimmerLineShort: {
    width: wp('28%'),
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
  },
  shimmerLineLong: {
    width: wp('38%'),
    height: 12,
    borderRadius: 6,
  },
  shimmerPrice: {
    width: wp('16%'),
    height: 20,
    borderRadius: 10,
  },
  shimmerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  shimmerLineMedium: {
    width: wp('40%'),
    height: 10,
    borderRadius: 5,
  },
  shimmerBadge: {
    width: wp('14%'),
    height: 22,
    borderRadius: 8,
  },

  /* Empty / No Results */
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: hp('6%'),
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconGrad: {
    width: wp('50%'),
    height: wp('50%'),
    borderRadius: wp('8%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  emptyImage: {
    width: wp('40%'),
    height: wp('40%'),
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  emptyDesc: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: wp('4.5%'),
  },
});

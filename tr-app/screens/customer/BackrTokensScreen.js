// BackrTokensScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl,
  Animated, Easing, Image, TouchableOpacity, Alert, ActivityIndicator,
  Platform, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../api';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../theme';

const BACKR_COIN_IMG = require('../../assets/backr-coin.png');

/* ── Color Palette ───────────────────────── */
const EMERALD       = '#10B981';
const EMERALD_DARK  = '#059669';
const EMERALD_DEEP  = '#065F46';
const GOLD          = '#F59E0B';
const GOLD_DARK     = '#D97706';
const GOLD_LIGHT    = '#FEF3C7';
const CARD_BORDER   = '#F0F2F5';

const SERVICE_META = {
  bike:       { icon: 'bicycle',          color: '#3B82F6', bg: '#EFF6FF'  },
  car:        { icon: 'car-sport',        color: '#8B5CF6', bg: '#F5F3FF'  },
  bus:        { icon: 'bus',              color: '#F59E0B', bg: '#FFFBEB'  },
  truck:      { icon: 'cube',            color: '#EF4444', bg: '#FEF2F2'  },
  equipment:  { icon: 'construct',       color: '#06B6D4', bg: '#ECFEFF'  },
  packers:    { icon: 'archive',         color: '#EC4899', bg: '#FDF2F8'  },
  luxury:     { icon: 'diamond',         color: '#D97706', bg: '#FFFBEB'  },
  chauffeur:  { icon: 'person',          color: '#7C3AED', bg: '#F5F3FF'  },
  'self-drive': { icon: 'key',           color: '#0EA5E9', bg: '#F0F9FF'  },
};

/* ── Animated Backr Coin ───────────────────────── */
const Coin = ({ size = wp('24%') }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Y-axis 3D spin
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
    // Gentle float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: size * 1.3 }}>
      {/* Outer glow ring */}
      <Animated.View style={{
        position: 'absolute', width: size * 1.35, height: size * 1.35, borderRadius: size * 0.7,
        backgroundColor: GOLD, opacity: glowOpacity, transform: [{ scale: glowScale }],
      }} />
      {/* Coin */}
      <Animated.View style={{ transform: [{ rotateY }, { translateY: bounce }] }}>
        <Image
          source={BACKR_COIN_IMG}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

/* ── Date Formatter ───────────────────────── */
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = d.getHours() % 12 || 12;
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${mins} ${ampm}`;
};

/* ── Transaction Row ───────────────────────── */
const TransactionItem = ({ item, index, onPress }) => {
  const meta = SERVICE_META[item.serviceType] || { icon: 'swap-horizontal', color: EMERALD, bg: '#ECFDF5' };
  const label = item.serviceType
    ? item.serviceType.charAt(0).toUpperCase() + item.serviceType.slice(1).replace('-', ' ')
    : 'Booking';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.txnCard}
        activeOpacity={0.7}
        onPress={() => onPress?.(item)}
      >
        <View style={[styles.txnIcon, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnService}>{label} Booking</Text>
          {item.bookingNumber ? <Text style={styles.txnBookingNum}>#{item.bookingNumber}</Text> : null}
          <Text style={styles.txnDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.txnRight}>
          <LinearGradient
            colors={item.type === 'CREDIT' ? ['#ECFDF5', '#D1FAE5'] : ['#FEF2F2', '#FECACA']}
            style={styles.txnBadge}
          >
            <Text style={[styles.txnAmount, { color: item.type === 'CREDIT' ? EMERALD_DARK : '#DC2626' }]}>
              {item.type === 'CREDIT' ? '+' : '-'}{item.amount}
            </Text>
          </LinearGradient>
          <Text style={styles.txnTokens}>tokens</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ── Skeleton Loader ───────────────────────── */
const SkeletonLoader = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  const Bar = ({ w, h = 14, mt = 0 }) => (
    <Animated.View style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: '#E5E7EB', opacity, marginTop: mt }} />
  );

  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonHero}>
        <Bar w={wp('22%')} h={wp('22%')} />
        <Bar w={wp('30%')} h={32} mt={16} />
        <Bar w={wp('20%')} h={14} mt={8} />
      </View>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <Bar w={38} h={38} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Bar w={wp('30%')} h={14} />
            <Bar w={wp('20%')} h={12} mt={6} />
          </View>
          <Bar w={wp('15%')} h={24} />
        </View>
      ))}
    </View>
  );
};

/* ── Main Screen ───────────────────────── */
export default function BackrTokensScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [earned, setEarned] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const navigation = useNavigation();

  // Hero entrance animations
  const heroScale = useRef(new Animated.Value(0.8)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const bannerSlide = useRef(new Animated.Value(40)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const animateEntrance = () => {
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(bannerSlide, { toValue: 0, duration: 500, delay: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  };

  const bootstrap = async () => {
    try {
      const raw = await AsyncStorage.getItem('customer');
      if (!raw) throw new Error('No customer');
      const customer = JSON.parse(raw);
      setCustomerId(customer.id);
      await fetchData(customer.id, false);
    } catch (e) {
      console.log('bootstrap error:', e);
      Alert.alert('Error', 'Could not load customer.');
      setLoading(false);
    }
  };

  const fetchData = async (cid, silent = true) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get('/backr', { params: { customer_id: cid } });
      setEarned(data?.tokens?.earned_tokens ?? 0);
      setRemaining(data?.tokens?.remaining_tokens ?? 0);
      setTransactions(data?.transactions ?? []);
      if (!silent) setTimeout(animateEntrance, 100);
    } catch (e) {
      console.log('GET /api/backr error:', e?.response?.data || e.message);
      Alert.alert('Error', 'Failed to load Backr data.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { bootstrap(); }, []);

  const onRefresh = () => {
    if (!customerId) return;
    setRefreshing(true);
    fetchData(customerId, true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={EMERALD_DEEP} />
        <LinearGradient colors={[EMERALD_DEEP, EMERALD_DARK]} style={styles.headerGrad}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Backr Tokens</Text>
          <View style={{ width: 30 }} />
        </LinearGradient>
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  const handleBookingPress = (item) => {
    if (!item.bookingId || !item.serviceType) return;

    const screenMapping = {
      'bike': 'BikeBookingDetail',
      'self-drive': 'SelfDriveBookingDetail',
      'luxury': 'LuxuryBookingDetail',
      'truck': 'TruckBookingDetail',
      'equipment': 'EquipmentBookingDetail',
      'packers': 'PackersBookingDetail',
      'bus': 'BusBookingDetail',
      'car': 'BookingDetail',
      'chauffeur': 'BookingDetail',
    };

    const screen = screenMapping[item.serviceType];
    if (screen) {
      if (item.serviceType === 'car' || item.serviceType === 'chauffeur') {
        navigation.navigate(screen, { bookingId: item.bookingId, bookingType: 'car' });
      } else {
        navigation.navigate(screen, { bookingId: item.bookingId });
      }
    }
  };

  const bookingsCount = transactions.filter(t => t.type === 'CREDIT').length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={EMERALD_DEEP} />

      {/* ── Header ── */}
      <LinearGradient colors={[EMERALD_DEEP, EMERALD_DARK]} style={styles.headerGrad}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backr Tokens</Text>
        <View style={{ width: 30 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EMERALD} colors={[EMERALD]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Balance Card ── */}
        <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={[EMERALD_DEEP, '#047857', EMERALD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative circles */}
            <View style={[styles.heroCircle, { top: -30, right: -30, width: 120, height: 120 }]} />
            <View style={[styles.heroCircle, { bottom: -20, left: -20, width: 80, height: 80 }]} />

            <Coin />

            <Text style={styles.heroBalance}>{remaining}</Text>
            <Text style={styles.heroLabel}>Backr Tokens</Text>

            {/* Stats Row */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <View style={styles.heroStatIcon}>
                  <Icon name="trending-up" size={14} color={EMERALD} />
                </View>
                <View>
                  <Text style={styles.heroStatVal}>{earned}</Text>
                  <Text style={styles.heroStatLbl}>Total Earned</Text>
                </View>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <View style={styles.heroStatIcon}>
                  <Icon name="receipt" size={14} color={GOLD} />
                </View>
                <View>
                  <Text style={styles.heroStatVal}>{bookingsCount}</Text>
                  <Text style={styles.heroStatLbl}>Bookings</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 10% Banner ── */}
        <Animated.View style={{ opacity: bannerOpacity, transform: [{ translateY: bannerSlide }] }}>
          <LinearGradient
            colors={[GOLD_LIGHT, '#FFF7ED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <LinearGradient
              colors={[GOLD, GOLD_DARK]}
              style={styles.bannerBadge}
            >
              <Text style={styles.bannerBadgeText}>10%</Text>
            </LinearGradient>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Earn on every booking!</Text>
              <Text style={styles.bannerDesc}>
                You automatically earn 10% of your booking amount as Backr tokens on every completed trip.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Recent Earnings ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {transactions.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{transactions.length}</Text>
            </View>
          )}
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <LinearGradient
              colors={['#F0FDF4', '#ECFDF5']}
              style={styles.emptyIcon}
            >
              <Icon name="wallet-outline" size={32} color={EMERALD} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptyDesc}>
              Complete your first booking and earn{'\n'}10% back as Backr tokens!
            </Text>
          </View>
        ) : (
          <View style={styles.txnList}>
            {transactions.map((txn, idx) => (
              <TransactionItem key={txn.id} item={txn} index={idx} onPress={handleBookingPress} />
            ))}
          </View>
        )}

        <View style={{ height: hp('4%') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────── */
const SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 6 },
});

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: wp('4%'), paddingTop: wp('4%') },

  // Header
  headerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: wp('6%'),
    paddingTop: wp('8%'),
    paddingBottom: wp('6%'),
    alignItems: 'center',
    marginBottom: wp('4%'),
    overflow: 'hidden',
    ...SHADOW,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroBalance: {
    fontSize: wp('12%'),
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: wp('3%'),
    letterSpacing: 1,
  },
  heroLabel: {
    fontSize: wp('3.5%'),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('5%'),
    width: '100%',
  },
  heroStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatVal: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLbl: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 1,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: wp('3%'),
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: wp('4%'),
    marginBottom: wp('5%'),
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...SHADOW_SM,
  },
  bannerBadge: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3.5%'),
    ...Platform.select({
      ios: { shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  bannerBadgeText: {
    fontSize: wp('5%'),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: wp('3%'),
    color: '#A16207',
    lineHeight: wp('4.2%'),
  },

  // Section Header
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
    backgroundColor: EMERALD,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: hp('5%'),
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW_SM,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: wp('4%'),
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

  // Transactions
  txnList: {
    gap: 10,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    padding: wp('3.5%'),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW_SM,
  },
  txnIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnInfo: { flex: 1 },
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
  txnDate: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  txnAmount: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
  },
  txnTokens: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    marginTop: 3,
    fontWeight: '500',
  },

  // Skeleton
  skeletonWrap: {
    padding: wp('4%'),
  },
  skeletonHero: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 24,
    paddingVertical: hp('4%'),
    marginBottom: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    padding: wp('3.5%'),
    marginBottom: 10,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Feather';
import { getBookings } from '../../../api/client';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald600, g400: T.emerald,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  red: T.red, redL: T.redLight,
  blue: T.blue, blueL: T.blueLight,
  glassBorder: T.glassBorder,
};

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.skCard, { opacity: anim }]}>
      <View style={styles.skRow}>
        <View style={[styles.skBox, { width: 90, height: 16 }]} />
        <View style={[styles.skBox, { width: 70, height: 22, borderRadius: 11 }]} />
      </View>
      <View style={[styles.skBox, { width: '80%', height: 13, marginTop: 12 }]} />
      <View style={[styles.skBox, { width: '60%', height: 13, marginTop: 8 }]} />
      <View style={[styles.skBox, { width: '70%', height: 13, marginTop: 8 }]} />
      <View style={[styles.skBox, { width: '45%', height: 18, marginTop: 14 }]} />
    </Animated.View>
  );
}

/* ── Illustrated empty state ──────────────────────────────────────────── */
const EmptyState = () => (
  <View style={styles.emptyCardWrap}>
    <View style={styles.emptyArt}>
      <View style={styles.emptyArtCardBack} />
      <View style={styles.emptyArtCard}>
        <Ionicons name="checkmark-circle-outline" size={rs(40)} color={C.g400} />
      </View>
      <View style={styles.emptyArtDot} />
      <View style={styles.emptyArtTag}>
        <Text style={styles.emptyArtTagTxt}>DONE</Text>
      </View>
    </View>

    <Text style={styles.emptyTitle}>No Trips Completed Today</Text>
    <Text style={styles.emptyBody}>
      Completed trips will appear here when they are finished
    </Text>
  </View>
);

export default function CarRentalCompletedTodayScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await getBookings('car', null);
      if (response.success) {
        const allBookings = response.bookings || [];
        const today = new Date().toDateString();

        const completedToday = allBookings.filter(booking => {
          if (booking.status !== 'COMPLETED') return false;
          const completedDate = booking.tripEndedAt || booking.updatedAt;
          if (!completedDate) return false;
          return new Date(completedDate).toDateString() === today;
        });

        completedToday.sort((a, b) => {
          const dateA = new Date(a.tripEndedAt || a.updatedAt);
          const dateB = new Date(b.tripEndedAt || b.updatedAt);
          return dateB - dateA;
        });

        setBookings(completedToday);
      }
    } catch (error) {
      console.error('Failed to fetch completed bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  /* ── Booking card ──────────────────────────────────────────────────────── */
  const renderBooking = ({ item }) => {
    const completedTime = formatTime(item.tripEndedAt || item.updatedAt);
    const pickupDate = formatDate(item.pickupDate);
    const dropDate = formatDate(item.dropDate || item.returnDate);

    return (
      <View style={styles.card}>
        {/* Tonal accent rail — stretches to the card's full height */}
        <LinearGradient
          colors={[C.g600, C.g800]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.cardRail}
        />

        <TouchableOpacity
          style={styles.cardInner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CarRentalBookingDetail', {
            bookingId: item.id,
            serviceType: 'car',
          })}
        >
          {/* Top stripe: icon box + booking number + completed time */}
          <View style={styles.cardTopStripe}>
            <LinearGradient colors={[C.g600, C.g700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
              <Ionicons name="car-sport" size={rs(13)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.cardTopLeft}>
                <Text style={styles.bookingNum} numberOfLines={1}>#{item.bookingNumber}</Text>
                <View style={styles.completedChip}>
                  <Ionicons name="checkmark-circle" size={10} color={C.g700} />
                  <Text style={styles.completedChipText}>Completed</Text>
                </View>
              </View>
            </View>
            <View style={styles.timeBox}>
              <Icon name="clock" size={10} color={C.g700} />
              <Text style={styles.timeBoxText}>{completedTime}</Text>
            </View>
          </View>

          {/* Primary name */}
          <Text style={styles.cardName} numberOfLines={1}>{item.customerName}</Text>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.locationBox}>
              <View style={[styles.locationDot, { backgroundColor: C.g500 }]} />
              <Text style={styles.locationText} numberOfLines={1}>{item.pickupCity}</Text>
            </View>
            <Icon name="arrow-right" size={12} color={C.muted} />
            <View style={styles.locationBox}>
              <View style={[styles.locationDot, { backgroundColor: C.red }]} />
              <Text style={styles.locationText} numberOfLines={1}>{item.dropCity || 'Local'}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={10} color={C.muted} />
              <Text style={styles.metaText}>{pickupDate} - {dropDate}</Text>
            </View>
            {!!item.driverName && (
              <View style={styles.metaItem}>
                <Ionicons name="person" size={10} color={C.muted} />
                <Text style={[styles.metaText, { fontWeight: '700' }]} numberOfLines={1}>
                  {item.driverName}
                </Text>
              </View>
            )}
          </View>

          {/* Footer: amount + chevron */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.amtLabel}>Total Amount</Text>
              <Text style={styles.amtValue}>₹{item.grandTotal || item.totalAmount}</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Icon name="arrow-right" size={12} color={C.g700} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  /* ── Render ── */
  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Hero header */}
      <LinearGradient colors={G.hero} style={styles.header}>
        <AnimatedOrb style={styles.orbA} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

          <Text style={styles.headerEyebrow}>CAR RENTALS</Text>
          <Text style={styles.bigTitle}>Completed Today</Text>
          <Text style={styles.bigSub}>
            {bookings.length} trip{bookings.length !== 1 ? 's' : ''} completed
          </Text>

          <View style={{ height: rs(28) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating date card — tucks into the hero's bottom curve */}
      <View style={styles.dateBarWrap}>
        <View style={styles.dateCard}>
          <View style={styles.dateIconBox}>
            <Ionicons name="calendar-outline" size={16} color={C.g700} />
          </View>
          <Text style={styles.dateCardText}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
          }
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  skeletonWrap: { padding: 16, gap: 12 },
  skCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  skRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skBox: { backgroundColor: '#E2E8F0', borderRadius: 8, height: 14 },

  /* Hero header */
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerSafe: { paddingHorizontal: 16 },
  orbA: {
    position: 'absolute', top: -46, right: -30, width: 150, height: 150,
    borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbB: {
    position: 'absolute', bottom: -40, left: -34, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.045)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(4), marginBottom: rs(10) },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerEyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1.2, fontFamily: DISPLAY, marginBottom: 2 },
  bigTitle: { fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
  bigSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: '600', marginTop: 4, fontFamily: DISPLAY },

  /* Floating date card */
  dateBarWrap: { marginHorizontal: 16, marginTop: -rs(24), marginBottom: rs(14) },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: rs(15),
    paddingHorizontal: 14, height: rs(46),
    borderWidth: 1, borderColor: C.glassBorder,
    ...cardShadow,
  },
  dateIconBox: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  dateCardText: { fontSize: 13, fontWeight: '700', color: C.text, fontFamily: DISPLAY },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardRail: { width: 3 },
  cardInner: { flex: 1, padding: 11, minWidth: 0 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconBox: {
    width: rs(26), height: rs(26), borderRadius: rs(8),
    justifyContent: 'center', alignItems: 'center',
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookingNum: { fontSize: 12.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  completedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.g50, paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 7, borderWidth: 1, borderColor: C.g100,
  },
  completedChipText: { fontSize: 10, color: C.g700, fontWeight: '600' },
  timeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: C.g100,
  },
  timeBoxText: { fontSize: 10.5, fontWeight: '700', color: C.g700 },

  cardName: { fontSize: 14.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY, marginBottom: 6 },

  routeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    backgroundColor: C.bg, borderRadius: 10,
    marginBottom: 7,
  },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  locationDot: { width: 7, height: 7, borderRadius: 3.5 },
  locationText: { fontSize: 11.5, fontWeight: '500', color: C.text, flex: 1 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 7 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10.5, color: C.sub, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 9,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  amtLabel: { fontSize: 10, color: C.muted, marginBottom: 1 },
  amtValue: { fontSize: 15, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  arrowCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Elaborate empty state */
  emptyCardWrap: {
    alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: 20, paddingVertical: rs(30),
    marginTop: rs(10),
  },
  emptyArt: {
    width: rs(140), height: rs(112), marginBottom: rs(16),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(12), right: rs(20),
    width: rs(88), height: rs(64), borderRadius: rs(14),
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(88), height: rs(78), borderRadius: rs(16),
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(4), right: rs(16),
    width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: C.g400,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(8), left: rs(4),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g50,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontSize: 8.5, fontWeight: '700', color: C.g700, letterSpacing: 0.6, fontFamily: DISPLAY },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, fontFamily: DISPLAY, textAlign: 'center' },
  emptyBody: {
    fontSize: 13, color: C.muted, textAlign: 'center',
    lineHeight: 19, maxWidth: rs(260),
  },
});

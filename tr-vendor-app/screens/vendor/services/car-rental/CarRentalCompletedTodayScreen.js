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

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  red: '#DC2626', redL: '#FEF2F2',
  blue: '#2563EB', blueL: '#EFF6FF',
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

  const renderBooking = ({ item }) => {
    const completedTime = formatTime(item.tripEndedAt || item.updatedAt);
    const pickupDate = formatDate(item.pickupDate);
    const dropDate = formatDate(item.dropDate || item.returnDate);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CarRentalBookingDetail', {
          bookingId: item.id,
          serviceType: 'car',
        })}
        activeOpacity={0.7}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={C.g600} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          </View>
          <View style={styles.timeBox}>
            <Icon name="clock" size={12} color={C.g700} />
            <Text style={styles.completedTime}>{completedTime}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Customer info */}
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={18} color={C.muted} />
            <Text style={styles.infoText}>{item.customerName}</Text>
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.locationBox}>
              <View style={[styles.locationDot, { backgroundColor: C.g500 }]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.pickupCity}
              </Text>
            </View>
            <Icon name="arrow-right" size={14} color={C.muted} />
            <View style={styles.locationBox}>
              <View style={[styles.locationDot, { backgroundColor: C.red }]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.dropCity || 'Local'}
              </Text>
            </View>
          </View>

          {/* Trip Duration */}
          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color={C.muted} />
            <Text style={styles.infoText}>
              {pickupDate} - {dropDate}
            </Text>
          </View>

          {/* Driver info (if available) */}
          {item.driverName && (
            <View style={styles.driverBox}>
              <Ionicons name="person" size={14} color={C.g700} />
              <Text style={styles.driverText}>Driver: {item.driverName}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Footer - Amount */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>₹{item.grandTotal || item.totalAmount}</Text>
            </View>
            <View style={styles.chevronBox}>
              <Ionicons name="chevron-forward" size={18} color={C.g600} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      {/* Gradient Header */}
      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        {/* Top row */}
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconRow}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerTitle}>Completed Today</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {bookings.length} trip{bookings.length !== 1 ? 's' : ''} completed
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Green date banner */}
      <View style={styles.dateBanner}>
        <Ionicons name="calendar-outline" size={16} color={C.g700} />
        <Text style={styles.dateBannerText}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="checkmark-circle-outline" size={44} color={C.g400} />
              </View>
              <Text style={styles.emptyTitle}>No Trips Completed Today</Text>
              <Text style={styles.emptyText}>
                Completed trips will appear here when they are finished
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  skeletonWrap: { padding: 16, gap: 12 },
  skCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  skRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skBox: { backgroundColor: '#E2E8F0', borderRadius: 8, height: 14 },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 8,
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    right: 10,
  },
  decCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  /* Date banner */
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.g50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.g100,
  },
  dateBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.g800,
  },

  /* List */
  list: { padding: 16, gap: 12, backgroundColor: C.bg },

  /* Card */
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bookingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: C.g50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.g100,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.g700,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.g50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.g100,
  },
  completedTime: {
    fontSize: 12,
    fontWeight: '600',
    color: C.g700,
  },

  cardBody: { gap: 10 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: C.text,
    flex: 1,
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
    borderRadius: 10,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    flex: 1,
  },

  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.g50,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.g100,
  },
  driverText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.g700,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: C.g700,
  },
  chevronBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Empty */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.g100,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

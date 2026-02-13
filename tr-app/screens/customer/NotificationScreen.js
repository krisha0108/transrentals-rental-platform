import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notifee from '@notifee/react-native';
import { Alert } from 'react-native';
import { notificationService } from '../services';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const scaleWidth = (size) => (SCREEN_WIDTH / 375) * size;
const scaleHeight = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scaleWidth(size) - size) * factor;

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // animations (common for list)
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const fetchNotifications = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      // console.log('[NotificationScreen] Fetching notifications...');
      const response = await notificationService.getNotifications();
      // console.log('[NotificationScreen] API Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        const notifs = response.notifications || [];
        // console.log(`[NotificationScreen] Loaded ${notifs.length} notifications`);
        // console.log(`[NotificationScreen] Unread count: ${notifs.filter(n => !n.is_read).length}`);

        setNotifications(notifs);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // console.log('[NotificationScreen] API returned success: false');
      }
    } catch (error) {
      // console.log('[NotificationScreen] Failed to load notifications:', error);
      // console.log('[NotificationScreen] Error details:', error.message);
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    notifee.setBadgeCount(0);
  }, []);

  const onRefresh = () => {
    fetchNotifications(true);
  };

  

  // // Simple Skeleton
  // const SimpleSkeleton = () => (
  //   <SafeAreaView style={styles.container}>
  //     <View style={styles.MainHeader}>
  //       <View style={styles.header}>
  //         <TouchableOpacity onPress={() => navigation.goBack()}>
  //           <Ionicons name="arrow-back" size={scaleWidth(26)} color="#000000ff" />
  //         </TouchableOpacity>
  //         <Text style={styles.headerText}>Notifications</Text>
  //       </View>
  //     </View>

   const Header = () => (
    <View style={styles.headerBar}>
    <Pressable
      onPress={() => navigation.goBack()}
      style={styles.left}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <View style={styles.backButtonCircle}>
        <Ionicons name="chevron-back" size={scaleWidth(20)} color="#111827" />
      </View>
    </Pressable>

    <View style={styles.center}>
      <Text numberOfLines={1} style={styles.headerTitle}>Notifications</Text>
    </View>

    {/* Right placeholder to keep title perfectly centered */}
    <View style={styles.right} />
  </View>
  );
  // Simple Skeleton - AB SAME HEADER USE KARENGE
  const SimpleSkeleton = () => (
    <SafeAreaView style={styles.container}>
      {/* YAHAN BHI SAME HEADER USE KARO */}
      <Header />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scaleHeight(90) }}
      >
        <View style={styles.notificationContainer}>
          {[...Array(6)].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonTexts}>
                  <View style={[styles.skeletonLine, { width: '70%' }]} />
                  <View style={[styles.skeletonLine, { width: '90%' }]} />
                </View>
              </View>
              <View style={styles.skeletonContent}>
                <View style={[styles.skeletonLine, { width: '100%' }]} />
                <View style={[styles.skeletonLine, { width: '95%' }]} />
                <View style={[styles.skeletonLine, { width: '60%' }]} />
              </View>
              <View style={styles.skeletonFooter}>
                <View style={[styles.skeletonLine, { width: '30%', height: scaleHeight(12) }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading && !refreshing) {
    return <SimpleSkeleton />;
  }

  // ⬇⬇⬇ CHANGED THIS PART ONLY
  const NotificationItem = ({ item, index }) => {
    const cardAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.spring(cardAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);


const handlePress = async () => {
  try {
    // Mark notification as read first
    // console.log(`[NotificationScreen] Marking notification ${item.id} as read`);
    await notificationService.markAsRead(item.id);

    // Update local state to reflect read status
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === item.id ? { ...n, is_read: true } : n
      )
    );

    // Determine service type from title (temporary until DB has serviceType)
    const title = (item.title || '').toLowerCase();
    const body = (item.body || '').toLowerCase();
    let serviceType = item.service_type;

    if (!serviceType || serviceType === 'general') {
      if (title.includes('bike') || title.includes('🏍') || body.includes('bike')) serviceType = 'bike';
      else if (title.includes('self-drive') || title.includes('self drive') || body.includes('self-drive')) serviceType = 'self-drive';
      else if (title.includes('luxury') || title.includes('💎') || body.includes('luxury')) serviceType = 'luxury';
      else if (title.includes('bus') || title.includes('🚌') || body.includes('bus')) serviceType = 'bus';
      else if (title.includes('truck') || title.includes('🚚') || body.includes('truck')) serviceType = 'truck';
      else if (title.includes('equipment') || title.includes('🏗') || body.includes('equipment')) serviceType = 'equipment';
      else if (title.includes('packers') || title.includes('movers') || title.includes('📦') || body.includes('packers') || body.includes('movers')) serviceType = 'packers';
      else if (title.includes('chauffeur') || title.includes('driver') || title.includes('👨‍✈️') || body.includes('chauffeur') || body.includes('driver assigned')) serviceType = 'chauffeur-service';
      else if (title.includes('car') || title.includes('🚗') || body.includes('car rental')) serviceType = 'car';
      else {
        // Can't determine - go to MyBookings
        // console.log('[NotificationScreen] Cannot determine service type, going to MyBookings');
        navigation.navigate('MyBookings');
        return;
      }
    }

    // Determine if it's a quote request or booking
    const isQuoteRequest = item.type === 'quote' || (item.quote_id && !item.booking_id);
    const itemId = isQuoteRequest ? item.quote_id : item.booking_id;

    // Validate ID
    if (!itemId || itemId === 'null' || itemId.length < 10 || itemId.endsWith('-')) {
      // console.log('[NotificationScreen] Invalid ID:', itemId);
      navigation.navigate('MyBookings');
      return;
    }

    // console.log(`[NotificationScreen] Service: ${serviceType}, IsQuote: ${isQuoteRequest}, ID: ${itemId}`);

    // Navigate using same logic as MyBookingsScreen.handleBookingPress
    if (serviceType === 'self-drive') {
      navigation.navigate(isQuoteRequest ? 'SelfDriveQuoteRequestDetail' : 'SelfDriveBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'bike') {
      navigation.navigate(isQuoteRequest ? 'BikeQuoteRequestDetail' : 'BikeBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'luxury') {
      navigation.navigate(isQuoteRequest ? 'LuxuryQuoteDetail' : 'LuxuryBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'bus') {
      navigation.navigate(isQuoteRequest ? 'BusQuoteRequestDetail' : 'BusBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'truck') {
      navigation.navigate(isQuoteRequest ? 'TruckQuoteRequestDetail' : 'TruckBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'packers') {
      navigation.navigate(isQuoteRequest ? 'PackersQuoteRequestDetail' : 'PackersBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'equipment') {
      navigation.navigate(isQuoteRequest ? 'EquipmentQuoteRequestDetail' : 'EquipmentBookingDetail',
        isQuoteRequest ? { requestId: itemId } : { bookingId: itemId });
    } else if (serviceType === 'chauffeur-service' || serviceType === 'car') {
      // Handle chauffeur service (car rental with driver) bookings
      navigation.navigate('BookingDetail', { bookingId: itemId, bookingType: 'car' });
    } else {
      navigation.navigate('MyBookings');
    }

  } catch (error) {
    // console.log('[NotificationScreen] Error:', error);
    navigation.navigate('MyBookings');
  }
};

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Animated.View
          style={[
            styles.notificationCard,
            !item.is_read && styles.unreadNotificationCard, // Add unread styling
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                {
                  translateX: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_WIDTH, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.cardHeader, !item.is_read && styles.unreadCardHeader]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, !item.is_read && styles.unreadIconContainer]}>
                <MaterialIcons name="notifications" size={scaleWidth(18)} color="#FFFFFF" />
              </View>
              <Text style={styles.notificationTitle}>{item.title}</Text>
            </View>
            {/* Unread indicator dot */}
            {!item.is_read && (
              <View style={styles.unreadDot} />
            )}
          </View>

          {/* Dashed Divider */}
          <View style={styles.dashedDivider} />

          {/* Card Content */}
          <View style={styles.cardContent}>
            <Text style={styles.notificationBody}>{item.body}</Text>

            {/* Show Booking ID */}
            {/* {item.booking_id && (
              <View style={styles.bookingIdContainer}>
                <Text style={styles.bookingIdLabel}>Booking ID:</Text>
                <Text style={styles.bookingIdValue}>#{item.booking_id}</Text>
              </View>
            )} */}

            {/* Show Quote ID (optional) */}
            {/* {item.quote_id && (
              <View style={[styles.bookingIdContainer, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                <Text style={[styles.bookingIdLabel, { color: '#1D4ED8' }]}>Quote ID:</Text>
                <Text style={[styles.bookingIdValue, { color: '#1D4ED8' }]}>#{item.quote_id}</Text>
              </View>
            )} */}

            {item.image && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.notificationImage} resizeMode="cover" />
              </View>
            )}
          </View>

          {/* Footer with Time */}
          <View style={styles.cardFooter}>
            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={scaleWidth(14)} color="#065F46" />
              <Text style={styles.timeText}>{item.relative_time}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  // ⬆⬆⬆ END CHANGE

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.MainHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={scaleWidth(24)} color="#2c2e2eff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Notifications</Text>
        </View>
      </View> */}
      <Header />

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scaleHeight(90) }}
      >
        <View style={styles.notificationContainer}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off" size={scaleWidth(64)} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up!{'\n'}
                We'll notify you when something new arrives.
              </Text>
            </View>
          ) : (
            notifications.map((item, index) => (
              <NotificationItem key={item.id} item={item} index={index} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F7', marginTop: 40 },
   headerContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // softer
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Bar row
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10, // tighter than before
    minHeight: scaleHeight(64),
  },

  // Left/Right fixed width slots so title stays centered
  left: {
    width: scaleWidth(44),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  right: {
    width: scaleWidth(44),
  },

  // Center title
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back button chip
  backButtonCircle: {
    width: scaleWidth(35),
    height: scaleWidth(35),
    borderRadius: scaleWidth(10),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Title styling
  headerTitle: {
    color: '#111827',
    fontSize: scaleWidth(18),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrollView: { flex: 1, backgroundColor: '#F9F7F7' },
  notificationContainer: { padding: scaleWidth(8) },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(8),
    marginHorizontal: scaleWidth(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleWidth(8),
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scaleWidth(10),
    paddingBottom: scaleHeight(6),
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: scaleWidth(8),
    borderTopRightRadius: scaleWidth(8),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(8),
    backgroundColor: '#065F46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(10),
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.2,
    shadowRadius: scaleWidth(4),
    elevation: 2,
  },
  notificationTitle: { fontSize: moderateScale(14), fontWeight: '700', color: '#1A1A1A', flex: 1 },
  dashedDivider: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', marginHorizontal: scaleWidth(10) },
  cardContent: { padding: scaleWidth(10), paddingTop: scaleHeight(6) },
  notificationBody: {
    fontSize: moderateScale(12),
    color: '#4B5563',
    lineHeight: scaleHeight(18),
    fontWeight: '500',
    marginBottom: scaleHeight(8),
  },
  imageContainer: { borderRadius: scaleWidth(8), overflow: 'hidden', marginTop: scaleHeight(6) },
  notificationImage: { width: '100%', height: scaleHeight(140), borderRadius: scaleWidth(8) },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: scaleWidth(10),
    paddingTop: scaleHeight(4),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: scaleWidth(4),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeText: { fontSize: moderateScale(11), color: '#065F46', fontWeight: '600', marginLeft: scaleWidth(4) },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: scaleHeight(60), paddingHorizontal: scaleWidth(20) },
  emptyIconContainer: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    borderRadius: scaleWidth(50),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: moderateScale(18), fontWeight: '700', color: '#374151', marginBottom: scaleHeight(8), textAlign: 'center' },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: scaleHeight(18),
    fontWeight: '400',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(12),
    marginHorizontal: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(10) },
  skeletonIcon: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(8),
    backgroundColor: '#E5E7EB',
    marginRight: scaleWidth(10),
  },
  skeletonTexts: { flex: 1, gap: scaleHeight(6) },
  skeletonContent: { marginBottom: scaleHeight(10), gap: scaleHeight(6) },
  skeletonFooter: { alignItems: 'flex-end' },
  skeletonLine: {
    height: scaleHeight(10),
    borderRadius: scaleWidth(4),
    backgroundColor: '#E5E7EB',
    marginBottom: scaleHeight(4),
  },
  bookingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(6),
    backgroundColor: '#F0FDF4',
    borderRadius: scaleWidth(6),
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignSelf: 'flex-start',
  },
  bookingIdLabel: { fontSize: moderateScale(11), fontWeight: '600', color: '#166534', marginRight: scaleWidth(4) },
  bookingIdValue: { fontSize: moderateScale(12), fontWeight: '700', color: '#065F46' },

  // Unread notification styles
  unreadNotificationCard: {
    borderWidth: 2,
    borderColor: '#10B981', // Green border for unread
    backgroundColor: '#F0FDF4', // Light green background
  },
  unreadCardHeader: {
    backgroundColor: '#ECFDF5', // Slightly darker green for header
  },
  unreadIconContainer: {
    backgroundColor: '#10B981', // Brighter green for unread
  },
  unreadDot: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: '#10B981',
    marginLeft: scaleWidth(8),
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default NotificationScreen;

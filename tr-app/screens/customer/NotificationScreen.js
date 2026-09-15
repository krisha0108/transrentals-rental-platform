import React, { useEffect, useState, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notifee from '@notifee/react-native';
import { Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { notificationService } from '../services';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'chats', label: 'Chats' },
  { key: 'offers', label: 'Offers' },
];

// Buckets a notification into one of the filter tabs above, reusing the
// same type/title signals handlePress already relies on for navigation.
const getNotifCategory = (item) => {
  const title = (item.title || '').toLowerCase();
  const body = (item.body || '').toLowerCase();
  const notifType = (item.type || '').toUpperCase();

  if (notifType === 'CHAT' || notifType === 'GROUP_CHAT' || title.includes('message')) {
    return 'chats';
  }
  if (
    notifType === 'PROMO' || notifType === 'OFFER' || notifType === 'MARKETING' ||
    title.includes('offer') || title.includes('discount') || title.includes('% off') ||
    body.includes('offer') || body.includes('discount') || body.includes('% off')
  ) {
    return 'offers';
  }
  return 'bookings';
};

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigation = useNavigation();

  // animations (common for list)
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  /* -- StatusBar management -- */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, [])
  );

  const fetchNotifications = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await notificationService.getNotifications();

      if (response.success) {
        const notifs = response.notifications || [];

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
      }
    } catch (error) {
      // silently handle
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

  /* -- Mark all as read -- */
  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;
      // Update UI immediately
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      // Mark as read on server
      await Promise.all(unreadIds.map(id => notificationService.markAsRead(id)));
      // Refresh from server to ensure sync
      fetchNotifications(true);
    } catch (error) {
      // silently handle
    }
  };

  /* -- Gradient Header Component -- */
  const Header = () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return (
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={[TEAL_DEEP, TEAL_MID, '#047857']}
          style={styles.headerGrad}
        >
          {/* Decorative circles */}
          <View style={[styles.decoCircle, { top: -hp('3%'), right: -wp('5%'), width: wp('25%'), height: wp('25%') }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -hp('2%'), left: -wp('4%'), width: wp('15%'), height: wp('15%') }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { top: hp('1%'), left: wp('30%'), width: wp('10%'), height: wp('10%'), opacity: 0.04 }]} pointerEvents="none" />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            {/* Mark all read button in header */}
            {unreadCount > 0 && !loading ? (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerActionBtn}>
                <Ionicons name="checkmark-done" size={wp('4.5%')} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerActionPlaceholder} />
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  /* -- Skeleton Loading -- */
  const SimpleSkeleton = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={[TEAL_DEEP, TEAL_MID, '#047857']}
          style={styles.headerGrad}
        >
          <View style={[styles.decoCircle, { top: -hp('3%'), right: -wp('5%'), width: wp('25%'), height: wp('25%') }]} pointerEvents="none" />
          <View style={[styles.decoCircle, { bottom: -hp('2%'), left: -wp('4%'), width: wp('15%'), height: wp('15%') }]} pointerEvents="none" />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerActionPlaceholder} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp('12%') }}
      >
        <View style={styles.notificationContainer}>
          {[...Array(6)].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonAccent} />
              <View style={styles.skeletonInner}>
                <View style={styles.skeletonHeaderRow}>
                  <View style={styles.skeletonIcon} />
                  <View style={styles.skeletonTexts}>
                    <View style={[styles.skeletonLine, { width: '65%', height: hp('1.2%') }]} />
                    <View style={[styles.skeletonLine, { width: '90%', height: hp('1%') }]} />
                  </View>
                </View>
                <View style={styles.skeletonContent}>
                  <View style={[styles.skeletonLine, { width: '100%', height: hp('1%') }]} />
                  <View style={[styles.skeletonLine, { width: '85%', height: hp('1%') }]} />
                  <View style={[styles.skeletonLine, { width: '50%', height: hp('1%') }]} />
                </View>
                <View style={styles.skeletonFooter}>
                  <View style={[styles.skeletonLine, { width: '28%', height: hp('1%') }]} />
                </View>
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

  // Notification Item Component
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
    await notificationService.markAsRead(item.id);

    // Update local state to reflect read status
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === item.id ? { ...n, is_read: true } : n
      )
    );

    const title = (item.title || '').toLowerCase();
    const body = (item.body || '').toLowerCase();
    const notifType = (item.type || '').toUpperCase();
    let serviceType = item.service_type;

    // ── Wander Group notifications ──────────────────────────────────
    if (['GROUP_CHAT', 'GROUP_JOIN', 'GROUP_SUBMITTED', 'GROUP_RESPOND'].includes(notifType)) {
      const groupCode = item.booking_id;
      if (groupCode) {
        navigation.navigate('WanderGroupDetail', {
          groupCode,
          initialTab: notifType === 'GROUP_CHAT' ? 'chat' : 'trips',
        });
      } else {
        // Old notification without groupCode — go to group list
        navigation.navigate('WanderGroup');
      }
      return;
    }

    // ── Wander quote notification (vendor responded) ─────────────────
    if (notifType === 'WANDER_QUOTE' || (notifType === 'QUOTE' && item.service_type === 'wander') ||
        title.includes('quote received') || title.includes('new quote')) {
      // booking_id holds wander_quote_requests.id (set in new notifications)
      // quote_id holds wander_quotes.id — wrong for navigation, skip it
      const requestId = item.booking_id;
      if (requestId) {
        navigation.navigate('WanderQuoteDetail', { requestId });
      } else {
        // Old notification without requestId — go to quotes list
        navigation.navigate('MyWanderBookings');
      }
      return;
    }

    // ── Regular chat notification ────────────────────────────────────
    if (notifType === 'CHAT' || title.includes('new message')) {
      const chatBookingId = item.booking_id;
      if (chatBookingId && chatBookingId !== 'null' && chatBookingId.length >= 10) {
        navigation.navigate('BookingChat', {
          bookingId: chatBookingId,
          bookingType: item.service_type || '',
        });
      } else {
        navigation.navigate('CustomerDashboard', { screen: 'Chat' });
      }
      return;
    }

    // ── B2B notification ─────────────────────────────────────────────
    const isB2BNotif = notifType.startsWith('B2B_')
      || title.includes('b2b') || body.includes('b2b');

    if (isB2BNotif) {
      const bookingId = item.booking_id;
      if (bookingId && bookingId !== 'null' && bookingId.length >= 10) {
        navigation.navigate('B2BBookingDetail', { bookingId });
      } else {
        navigation.navigate('B2BDashboard');
      }
      return;
    }

    // Normalize service type names from API
    const serviceTypeNormalize = {
      'packers-and-movers': 'packers',
      'truck-rental': 'truck',
      'bus-rental': 'bus',
      'equipment-rental': 'equipment',
      'luxury-car-rental': 'luxury',
      'chauffeur-service': 'chauffeur-service',
      'self-drive': 'self-drive',
      'bike-rental': 'bike',
    };
    if (serviceType && serviceTypeNormalize[serviceType]) {
      serviceType = serviceTypeNormalize[serviceType];
    }

    if (!serviceType || serviceType === 'general') {
      if (title.includes('bike') || title.includes('\u{1F3CD}') || body.includes('bike')) serviceType = 'bike';
      else if (title.includes('self-drive') || title.includes('self drive') || body.includes('self-drive')) serviceType = 'self-drive';
      else if (title.includes('luxury') || title.includes('\u{1F48E}') || body.includes('luxury')) serviceType = 'luxury';
      else if (title.includes('bus') || title.includes('\u{1F68C}') || body.includes('bus')) serviceType = 'bus';
      else if (title.includes('truck') || title.includes('\u{1F69A}') || body.includes('truck')) serviceType = 'truck';
      else if (title.includes('equipment') || title.includes('\u{1F3D7}') || body.includes('equipment')) serviceType = 'equipment';
      else if (title.includes('packers') || title.includes('movers') || title.includes('\u{1F4E6}') || body.includes('packers') || body.includes('movers')) serviceType = 'packers';
      else if (title.includes('chauffeur') || title.includes('driver') || title.includes('\u{1F468}\u200D\u2708\uFE0F') || body.includes('chauffeur') || body.includes('driver assigned')) serviceType = 'chauffeur-service';
      else if (title.includes('car') || title.includes('\u{1F697}') || body.includes('car rental')) serviceType = 'car';
      else {
        navigation.navigate('MyBookings');
        return;
      }
    }

    // Determine if it's a quote request or booking
    const isQuoteRequest = item.type === 'quote' || (item.quote_id && !item.booking_id);
    const itemId = isQuoteRequest ? item.quote_id : item.booking_id;

    // Validate ID
    if (!itemId || itemId === 'null' || itemId.length < 10 || itemId.endsWith('-')) {
      navigation.navigate('MyBookings');
      return;
    }

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
      navigation.navigate('BookingDetail', { bookingId: itemId, bookingType: 'car' });
    } else {
      navigation.navigate('MyBookings');
    }

  } catch (error) {
    navigation.navigate('MyBookings');
  }
};

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Animated.View
          style={[
            styles.notifRow,
            !item.is_read && styles.notifRowUnread,
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
          <View style={[styles.notifIconCircle, !item.is_read && styles.notifIconCircleUnread]}>
            <MaterialIcons
              name={item.is_read ? 'notifications-none' : 'notifications-active'}
              size={wp('4.2%')}
              color={!item.is_read ? '#FFF' : TEAL_MID}
            />
          </View>

          <View style={styles.notifRowBody}>
            <Text style={[styles.notifRowTitle, !item.is_read && styles.notifRowTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notifRowText} numberOfLines={1}>{item.body}</Text>

            {item.image && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.notificationImage} resizeMode="cover" />
              </View>
            )}
          </View>

          <View style={styles.notifRowTrailing}>
            <Text style={styles.notifRowTime}>{item.relative_time}</Text>
            {!item.is_read && <View style={styles.notifUnreadDot} />}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => getNotifCategory(n) === activeFilter);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* Header */}
      <Header />

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[styles.filterTab, active && styles.filterTabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TEAL]}
            tintColor={TEAL}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp('12%') }}
      >
        <View style={styles.notificationContainer}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[TEAL_LIGHT, '#A7F3D0']}
                style={styles.emptyIconGradient}
              >
                <View style={styles.emptyIconInner}>
                  <Ionicons name="notifications-off-outline" size={wp('10%')} color={TEAL} />
                </View>
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all' ? 'No notifications yet' : `No ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()} yet`}
              </Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up!{'\n'}
                We'll notify you when something new arrives.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item, index) => (
              <NotificationItem key={item.id} item={item} index={index} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* -- Container -- */
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* -- Header Gradient Wrapper -- */
  headerWrapper: {
    overflow: 'hidden',
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    ...SHADOW_MD,
  },
  headerGrad: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('1%'),
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  headerActionBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionPlaceholder: {
    width: wp('10%'),
    height: wp('10%'),
  },

  /* -- Filter Tabs -- */
  filterTabsRow: {
    flexDirection: 'row',
    gap: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('1%'),
  },
  filterTab: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('5%'),
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  filterTabText: {
    fontSize: wp('3.1%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  filterTabTextActive: {
    color: '#FFF',
  },

  /* -- ScrollView & Container -- */
  scrollView: {
    flex: 1,
    backgroundColor: BG,
  },
  notificationContainer: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('0.5%'),
  },

  /* -- Notification Row (compact list, no card chrome) -- */
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('1%'),
    gap: wp('3%'),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notifRowUnread: {
    borderLeftWidth: wp('1%'),
    borderLeftColor: TEAL,
  },
  notifIconCircle: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifIconCircleUnread: {
    backgroundColor: TEAL,
  },
  notifRowBody: {
    flex: 1,
  },
  notifRowTitle: {
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  notifRowTitleUnread: {
    fontWeight: '700',
    color: TEAL_DEEP,
  },
  notifRowText: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.15%'),
  },
  notifRowTrailing: {
    alignItems: 'flex-end',
    gap: hp('0.5%'),
    flexShrink: 0,
  },
  notifRowTime: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
  },
  notifUnreadDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: TEAL,
  },
  imageContainer: {
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
    marginTop: hp('0.7%'),
  },
  notificationImage: {
    width: '100%',
    height: hp('9%'),
    borderRadius: wp('2.5%'),
  },

  /* -- Empty State -- */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('10%'),
    paddingHorizontal: wp('8%'),
  },
  emptyIconGradient: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconInner: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('2.5%'),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: wp('3.3%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: wp('5.2%'),
    fontWeight: '400',
    marginTop: hp('1%'),
    paddingHorizontal: wp('6%'),
  },

  /* -- Skeleton Loading -- */
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  skeletonAccent: {
    width: wp('1.2%'),
    backgroundColor: TEAL_LIGHT,
    borderTopLeftRadius: wp('4%'),
    borderBottomLeftRadius: wp('4%'),
  },
  skeletonInner: {
    flex: 1,
    padding: wp('3.5%'),
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  skeletonIcon: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('4.75%'),
    backgroundColor: TEAL_LIGHT,
    marginRight: wp('2.5%'),
  },
  skeletonTexts: {
    flex: 1,
    gap: hp('0.6%'),
  },
  skeletonContent: {
    marginBottom: hp('1.2%'),
    gap: hp('0.6%'),
  },
  skeletonFooter: {
    alignItems: 'flex-end',
  },
  skeletonLine: {
    height: hp('1%'),
    borderRadius: wp('1.5%'),
    backgroundColor: '#E5E7EB',
  },
});

export default NotificationScreen;

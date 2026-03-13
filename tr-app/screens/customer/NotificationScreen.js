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

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    const notifType = (item.type || '').toLowerCase();
    let serviceType = item.service_type;

    // Check if this is a chat notification
    if (notifType === 'chat' || title.includes('new message')) {
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

    // Check if this is a B2B notification
    const isB2BNotif = notifType.startsWith('b2b_')
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
            styles.notificationCard,
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
          {/* Left accent bar for unread */}
          {!item.is_read && <View style={styles.cardAccent} />}

          <View style={styles.cardInner}>
            {/* Card Header */}
            <View style={[styles.cardHeader, !item.is_read && styles.unreadCardHeader]}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconCircle, !item.is_read && styles.unreadIconCircle]}>
                  <MaterialIcons
                    name={item.is_read ? 'notifications-none' : 'notifications-active'}
                    size={wp('4.5%')}
                    color={!item.is_read ? '#FFF' : TEAL_MID}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </View>
              {/* Unread indicator dot */}
              {!item.is_read && (
                <View style={styles.unreadDot} />
              )}
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={[styles.notificationBody, item.is_read && styles.readBody]}>{item.body}</Text>

              {item.image && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.notificationImage} resizeMode="cover" />
                </View>
              )}
            </View>

            {/* Footer with Time */}
            <View style={styles.cardFooter}>
              <View style={styles.timeContainer}>
                <MaterialIcons name="access-time" size={wp('3.2%')} color={TEXT_MUTED} />
                <Text style={styles.timeText}>{item.relative_time}</Text>
              </View>
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tap to view</Text>
                <Ionicons name="chevron-forward" size={wp('3%')} color={TEAL} />
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* Header */}
      <Header />

      {/* Unread summary pill */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <View style={styles.unreadSummaryRow}>
          <View style={styles.unreadSummaryPill}>
            <View style={styles.unreadSummaryDot} />
            <Text style={styles.unreadSummaryText}>
              {notifications.filter(n => !n.is_read).length} unread notification{notifications.filter(n => !n.is_read).length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

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
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[TEAL_LIGHT, '#A7F3D0']}
                style={styles.emptyIconGradient}
              >
                <View style={styles.emptyIconInner}>
                  <Ionicons name="notifications-off-outline" size={wp('10%')} color={TEAL} />
                </View>
              </LinearGradient>
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

  /* -- Unread Summary Pill -- */
  unreadSummaryRow: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('0.5%'),
  },
  unreadSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('5%'),
    alignSelf: 'flex-start',
    gap: wp('2%'),
  },
  unreadSummaryDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: TEAL,
  },
  unreadSummaryText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEAL_DEEP,
  },

  /* -- ScrollView & Container -- */
  scrollView: {
    flex: 1,
    backgroundColor: BG,
  },
  notificationContainer: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1%'),
  },

  /* -- Notification Card -- */
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  cardAccent: {
    width: wp('1.2%'),
    backgroundColor: TEAL,
    borderTopLeftRadius: wp('4%'),
    borderBottomLeftRadius: wp('4%'),
  },
  cardInner: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadCardHeader: {
    backgroundColor: '#ECFDF5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp('2.5%'),
  },
  iconCircle: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('4.75%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIconCircle: {
    backgroundColor: TEAL,
    ...Platform.select({
      ios: {
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  notificationTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    lineHeight: wp('5%'),
  },
  unreadTitle: {
    fontWeight: '700',
    color: TEAL_DEEP,
  },
  unreadDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: TEAL,
    marginLeft: wp('2%'),
    ...Platform.select({
      ios: {
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },

  /* -- Card Content -- */
  cardContent: {
    paddingHorizontal: wp('3.5%'),
    paddingTop: hp('1.2%'),
    paddingBottom: hp('0.5%'),
  },
  notificationBody: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
    fontWeight: '500',
    marginBottom: hp('0.8%'),
  },
  readBody: {
    color: TEXT_MUTED,
  },
  imageContainer: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    marginTop: hp('0.8%'),
  },
  notificationImage: {
    width: '100%',
    height: hp('18%'),
    borderRadius: wp('3%'),
  },

  /* -- Card Footer -- */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.2%'),
  },
  timeText: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
  },
  tapHintText: {
    fontSize: wp('2.8%'),
    color: TEAL,
    fontWeight: '600',
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

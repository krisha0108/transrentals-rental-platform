import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  ScrollView,
  RefreshControl,
  Platform,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { IMAGE_BASE_URL } from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../../theme';
import { useTravelAgent } from '../../../utils/isTravelAgent';

const CARD_BORDER  = '#F0F2F5';

/* ── Shadows ───────────────────────── */
const SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 6 },
});
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 3 },
});

/* ── Quick Action Item ───────────────────────── */
const QuickAction = ({ icon, label, bgColor, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = 200 + index * 80;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.actionIconWrap, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ── Menu Item ───────────────────────── */
const MenuItem = ({ icon, iconBg, title, subtitle, onPress, isLast, isLogout }) => (
  <TouchableOpacity
    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={styles.menuLeft}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuTitle, isLogout && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.menuSub}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} />
  </TouchableOpacity>
);

/* ── Main Screen ───────────────────────── */
const SettingScreen = ({ navigation }) => {
  const currentVersion = DeviceInfo.getVersion();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Phase 7 — Travel-Agent detection for Company Bookings entry card
  const { isTravelAgent, customer: taCustomer } = useTravelAgent();
  const agencyName = taCustomer?.agencyName || taCustomer?.linkedTravelAgentName || '';

  // Entrance animations
  const profileSlide = useRef(new Animated.Value(30)).current;
  const profileFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(profileSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      Animated.timing(profileFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.timing(contentFade, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }).start();
  };

  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('light');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const customerData = await AsyncStorage.getItem('customer');
      if (customerData) {
        setCustomer(JSON.parse(customerData));
      }
    } catch (error) {
      console.log('Error refreshing customer data:', error);
    }
    setRefreshing(false);
  };

  const handleShareApp = async () => {
    const firstName = customer?.name ? customer.name.split(' ')[0] : '';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.transrentals.customer';

    const shareMessage =
`${firstName ? `Hey! ${firstName} here. ` : ''}I've been using *TransRentals* for all my vehicle rental needs and it's amazing!

🚗 Car Rentals with Driver
🏍️ Bike Rentals
🚛 Truck & Tempo Hire
🚌 Bus Rentals
🏎️ Self-Drive Cars
🏠 Packers & Movers
🔧 Equipment Rentals

✅ Best prices with multiple vendor quotes
✅ Real-time booking tracking
✅ Secure payments

Download now and make your next ride hassle-free!
👉 ${playStoreUrl}`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'TransRentals - Vehicle Rentals Made Easy',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      const customerData = await AsyncStorage.getItem('customer');
      if (customerData) {
        setCustomer(JSON.parse(customerData));
      }
      setTimeout(animateEntrance, 100);
    };
    fetchCustomerData();
    GoogleSignin.configure({
      webClientId: '365663447950-o996ep372bp2ejippsphe3ktjpen221e.apps.googleusercontent.com',
    });
  }, []);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CustomerDashboard');
    }
  };

  const handleLogout = async () => {
    try {
      const user = await GoogleSignin.getCurrentUser();
      if (user) {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      }
      await AsyncStorage.multiRemove(['customer', 'customer_id', 'token']);
      navigation.replace('Login');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const imageUrl = customer?.image
    ? `${IMAGE_BASE_URL}/profile_images/${customer.image}`
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        style={styles.headerGrad}
      >
        {/* Decorative circles */}
        <View style={[styles.decoCircle, { top: -40, right: -30, width: 120, height: 120 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -20, left: -20, width: 80, height: 80 }]} pointerEvents="none" />

        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={styles.headerRow}>
            <View style={{ width: 34 }} />
            <Text style={styles.headerTitle}>My Account</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ── Profile Card (Glass) ── */}
        <Animated.View style={{ opacity: profileFade, transform: [{ translateY: profileSlide }] }}>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={[TEAL_LIGHT, '#A7F3D0']}
                    style={styles.avatarPlaceholder}
                  >
                    <Ionicons name="person" size={30} color={TEAL_MID} />
                  </LinearGradient>
                )}
                <TouchableOpacity
                  style={styles.editBadge}
                  onPress={() => navigation.navigate('EditProfileScreen')}
                >
                  <Ionicons name="camera" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {String(customer?.name || 'No Name')}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {String(customer?.email || 'Email not submitted')}
                </Text>
                {customer?.phone ? (
                  <Text style={styles.userPhone} numberOfLines={1}>
                    {String(customer.phone)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.profileActions}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                style={styles.verifiedPill}
              >
                <Ionicons name="shield-checkmark" size={13} color={TEAL_MID} />
                <Text style={styles.verifiedText}>Verified</Text>
              </LinearGradient>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => navigation.navigate('EditProfileScreen')}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={14} color={TEAL} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} colors={[TEAL]} />
        }
      >
        <Animated.View style={{ opacity: contentFade }}>
          {/* ── Quick Actions ── */}
          <View style={styles.quickActions}>
            <QuickAction
              index={0}
              label="Backr Coin"
              bgColor="#FEF3C7"
              icon={<Image source={require('../../../assets/backerCoin2.png')} style={styles.actionImg} />}
              onPress={() => navigation.navigate('BackrTokensScreen')}
            />
            <QuickAction
              index={1}
              label="Helpdesk"
              bgColor="#DBEAFE"
              icon={<Image source={require('../../../assets/helpdesk.png')} style={styles.actionImg} />}
              onPress={() => navigation.navigate('HelpdeskScreen')}
            />
            <QuickAction
              index={2}
              label="Payments"
              bgColor="#EDE9FE"
              icon={<Image source={require('../../../assets/payments.png')} style={styles.actionImg} />}
              onPress={() => navigation.navigate('ExpensesScreen')}
            />
            <QuickAction
              index={3}
              label="Bookings"
              bgColor="#FCE7F3"
              icon={<Image source={require('../../../assets/mybooking.png')} style={styles.actionImg} />}
              onPress={() => navigation.navigate('MyBookings')}
            />
          </View>

          {/* Phase 7 — Travel Agent: dedicated Company Bookings entry. Only renders for TA shadow customers. */}
          {isTravelAgent && (
            <TouchableOpacity
              style={styles.taBanner}
              onPress={() => navigation.navigate('B2BBookingsList')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4F46E5', '#059669']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.taBannerInner}
              >
                <View style={styles.taBannerIcon}>
                  <Ionicons name="briefcase" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.taBannerTitle} numberOfLines={1}>
                    Company Bookings
                  </Text>
                  <Text style={styles.taBannerSub} numberOfLines={1}>
                    {agencyName ? `${agencyName} · B2B requests & quotes` : 'B2B requests & quotes from manager'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── Connect With Us ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect With Us</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialCard}
                activeOpacity={0.7}
                onPress={() => Linking.openURL('http://instagram.com/transrentals_in/')}
              >
                <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.socialIconBg}>
                  <Image source={require('../../../assets/insta.png')} style={styles.socialIcon} />
                </LinearGradient>
                <Text style={styles.socialLabel}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialCard}
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://www.facebook.com/Transrentalsindia/')}
              >
                <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.socialIconBg}>
                  <Image source={require('../../../assets/facebook.png')} style={styles.socialIcon} />
                </LinearGradient>
                <Text style={styles.socialLabel}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialCard}
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://www.linkedin.com/company/transrentals/')}
              >
                <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.socialIconBg}>
                  <Image source={require('../../../assets/linkedin.png')} style={styles.socialIcon} />
                </LinearGradient>
                <Text style={styles.socialLabel}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Settings Menu ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.menuCard}>
              <MenuItem
                icon={<Image source={require('../../../assets/shareApp.png')} style={styles.menuImg} />}
                iconBg="#E7F0FE"
                title="Share App"
                subtitle="Invite friends to TransRentals"
                onPress={handleShareApp}
              />
              <MenuItem
                icon={<Image source={require('../../../assets/AboutUss.png')} style={styles.menuImg} />}
                iconBg="#E0F4FC"
                title="About Us"
                subtitle="Learn more about TransRentals"
                onPress={() => navigation.navigate('AboutUsScreen')}
              />
              <MenuItem
                icon={<Ionicons name="call-outline" size={20} color="#3B82F6" />}
                iconBg="#DBEAFE"
                title="Contact Us"
                subtitle="+91 9737965551"
                onPress={() => navigation.navigate('AboutUsScreen')}
              />
              <MenuItem
                icon={<Image source={require('../../../assets/LogOut.png')} style={styles.menuImg} />}
                iconBg="#FEE2E2"
                title="Log Out"
                subtitle="Sign out of your account"
                onPress={handleLogout}
                isLast
                isLogout
              />
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Image
              source={require('../../../assets/LogoGreySc.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={styles.footerVersion}>Version {currentVersion}</Text>
            <Text style={styles.footerCopy}>{'\u00A9'} 2024 TransRentals</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Styles ───────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TEAL_DEEP,
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingBottom: hp('4%'),
  },

  /* Header */
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? 8 : 8,
    paddingBottom: wp('5%'),
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
    marginBottom: wp('4%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp('3%'),
  },
  avatarWrap: {
    position: 'relative',
    marginRight: wp('3.5%'),
  },
  avatar: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: TEAL_DEEP,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  userPhone: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginTop: 2,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  verifiedText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 3,
  },
  editProfileText: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  /* Quick Actions */
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: wp('3%'),
    paddingTop: wp('4%'),
    paddingBottom: wp('2%'),
    gap: 4,
  },

  // Phase 7 — TA banner: sits between Quick Actions and Connect With Us.
  taBanner: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    marginBottom: hp('0.5%'),
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  taBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    gap: wp('3%'),
  },
  taBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taBannerTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  taBannerSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('1%'),
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW_SM,
  },
  actionIconWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionImg: {
    width: 24,
    height: 24,
  },
  actionLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },

  /* Sections */
  section: {
    paddingHorizontal: wp('4%'),
    marginTop: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: wp('3%'),
    letterSpacing: 0.2,
  },

  /* Social */
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: wp('3.5%'),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW_SM,
  },
  socialIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  socialLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  /* Menu */
  menuCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: wp('3.5%'),
    paddingHorizontal: wp('4%'),
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuImg: {
    width: 20,
    height: 20,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
    marginTop: wp('4%'),
  },
  footerLogo: {
    width: 90,
    height: 32,
    marginBottom: 10,
    opacity: 0.4,
  },
  footerVersion: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginBottom: 3,
  },
  footerCopy: {
    fontSize: wp('2.5%'),
    color: '#D1D5DB',
  },
});

export default SettingScreen;

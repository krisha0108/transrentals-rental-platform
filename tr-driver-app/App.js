import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

export const navigationRef = createNavigationContainerRef();

import { AuthProvider } from './contexts/AuthContext';
import { updateDriverFcmToken } from './screens/api/client';

// Auth Screens
import SplashScreen from './screens/auth/SplashScreen';
import OnboardingScreen from './screens/auth/OnboardingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from './screens/dashboard/DashboardScreen';
import AvailableBookingsScreen from './screens/bookings/AvailableBookingsScreen';
import MyBookingsScreen from './screens/bookings/MyBookingsScreen';
import BookingDetailScreen from './screens/bookings/BookingDetailScreen';
import AssignVehicleScreen from './screens/bookings/AssignVehicleScreen';
import ActiveTripScreen from './screens/bookings/ActiveTripScreen';
import FleetListScreen from './screens/fleet/FleetListScreen';
import AddVehicleScreen from './screens/fleet/AddVehicleScreen';
import VehicleDetailScreen from './screens/fleet/VehicleDetailScreen';
import EditVehicleScreen from './screens/fleet/EditVehicleScreen';
import AddMaintenanceScreen from './screens/fleet/AddMaintenanceScreen';
import EarningsScreen from './screens/earnings/EarningsScreen';
import TripHistoryScreen from './screens/earnings/TripHistoryScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import EditProfileScreen from './screens/profile/EditProfileScreen';
import NotificationsScreen from './screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const BRAND = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  bg: '#F0F4F8',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  subText: '#94A3B8',
};

const TAB_CONFIG = [
  { name: 'Dashboard', label: 'Home',     icon: 'home',      iconOff: 'home-outline'       },
  { name: 'Bookings',  label: 'Bookings', icon: 'car',       iconOff: 'car-outline'         },
  { name: 'Fleet',     label: 'Fleet',    icon: 'car-sport', iconOff: 'car-sport-outline'   },
  { name: 'Earnings',  label: 'Earnings', icon: 'wallet',    iconOff: 'wallet-outline'      },
  { name: 'Profile',   label: 'Profile',  icon: 'person',    iconOff: 'person-outline'      },
];

// ─── Custom Tab Bar ────────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  // One animated value per tab for the scale pop effect
  const scales = useRef(TAB_CONFIG.map(() => new Animated.Value(1))).current;

  function handlePress(index, route, isFocused) {
    // Pop animation
    Animated.sequence([
      Animated.timing(scales[index], { toValue: 0.82, duration: 90, useNativeDriver: true }),
      Animated.spring(scales[index], { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 }),
    ]).start();

    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }

  // Bottom padding: gesture nav → insets.bottom (usually 16–24px), button nav → small fixed pad
  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View style={[tabStyles.wrapper, { paddingBottom: bottomPad }]}>
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const cfg = TAB_CONFIG.find(t => t.name === route.name) || TAB_CONFIG[0];
          const isFocused = state.index === index;

          return (
            <Animated.View
              key={route.key}
              style={[tabStyles.tabWrap, { transform: [{ scale: scales[index] }] }]}
            >
              <TouchableOpacity
                style={tabStyles.tab}
                onPress={() => handlePress(index, route, isFocused)}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={cfg.label}
              >
                {isFocused ? (
                  // Active: icon pill on top + label below
                  <View style={tabStyles.activeWrap}>
                    <View style={tabStyles.activePill}>
                      <Ionicons name={cfg.icon} size={20} color="#fff" />
                    </View>
                    <Text style={tabStyles.activeLabel} numberOfLines={1}>{cfg.label}</Text>
                  </View>
                ) : (
                  // Inactive: icon + label stacked
                  <View style={tabStyles.inactiveWrap}>
                    <Ionicons name={cfg.iconOff} size={22} color={BRAND.subText} />
                    <Text style={tabStyles.inactiveLabel} numberOfLines={1}>{cfg.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: BRAND.card,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  tabWrap: {
    flex: 1,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  // Active state
  activeWrap: {
    alignItems: 'center',
    gap: 4,
  },
  activePill: {
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND.primary,
    letterSpacing: 0.2,
  },
  // Inactive state
  inactiveWrap: {
    alignItems: 'center',
    gap: 3,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: BRAND.subText,
  },
});

function BottomTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} />
      <Tab.Screen name="Fleet" component={FleetListScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* Splash is always first — it decides where to go */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Auth flow */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Main app */}
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="AvailableBookings" component={AvailableBookingsScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="AssignVehicle" component={AssignVehicleScreen} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />
      <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} />
      <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

// Navigate to Bookings tab when a notification is tapped
function navigateToBookings() {
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', { screen: 'Bookings' });
    }
  } catch {}
}

async function setupNotificationChannel() {
  try {
    await notifee.createChannel({
      id: 'driver_default',
      name: 'Driver Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  } catch (e) {
    console.log('Notifee channel setup failed:', e);
  }
}

export default function App() {
  useEffect(() => {
    let unsubForeground = () => {};
    let unsubNotifee = () => {};

    async function setupFCM() {
      try {
        await setupNotificationChannel();

        // FCM background handler — display notification when app is in background
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          try {
            const { title, body } = remoteMessage.notification || {};
            if (title) {
              await notifee.displayNotification({
                title,
                body: body || '',
                android: { channelId: 'driver_default', smallIcon: 'ic_notification', pressAction: { id: 'default' } },
              });
            }
          } catch {}
        });

        // FCM foreground handler — display notification when app is open
        unsubForeground = messaging().onMessage(async (remoteMessage) => {
          try {
            const { title, body } = remoteMessage.notification || {};
            if (title) {
              await notifee.displayNotification({
                title,
                body: body || '',
                android: { channelId: 'driver_default', smallIcon: 'ic_notification', pressAction: { id: 'default' } },
              });
            }
          } catch {}
        });

        // Notifee foreground event — handle tapping notification while app is open
        unsubNotifee = notifee.onForegroundEvent(({ type }) => {
          if (type === EventType.PRESS) {
            navigateToBookings();
          }
        });

        // App opened from background by tapping an FCM notification
        messaging().onNotificationOpenedApp(() => {
          navigateToBookings();
        });

        // App opened from killed state by tapping an FCM notification
        messaging().getInitialNotification().then(remoteMessage => {
          if (remoteMessage) {
            // Delay to allow navigation to be ready
            setTimeout(() => navigateToBookings(), 1000);
          }
        });

      } catch (e) {
        console.log('Firebase not configured:', e.message);
      }
    }

    setupFCM();

    return () => {
      unsubForeground();
      unsubNotifee();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8FB' },
});

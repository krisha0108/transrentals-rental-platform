
// import React from 'react';
// import { SafeAreaView, Text, TouchableOpacity,ImageBackground, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';  // Import useNavigation for navigation
// import FastImage from 'react-native-fast-image';
// export default function BookingConfirmationScreen() {
//   const navigation = useNavigation(); // Get the navigation prop
//   // Function to navigate to the Dashboard
//   const navigateToDashboard = () => {
//     navigation.navigate('CustomerDashboard'); // Navigate to the Customer Dashboard
//   };
//   return (
//     <SafeAreaView style={styles.container}>
//        <FastImage
//         source={require('../../assets/bookingConfirmmm.gif')}  // local gif file
//         style={styles.background}
//         resizeMode={FastImage.resizeMode.contain}
//       >
//         <TouchableOpacity style={styles.dashboardButton} onPress={navigateToDashboard}>
//           <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
//         </TouchableOpacity>
//       </FastImage>
//     </SafeAreaView>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//    background: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//    margin: 20,
//   },
//   text: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   dashboardButton: {
//     position: 'absolute',
//     backgroundColor: '#09B368',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//     marginTop: 20,
//     bottom: 100,
//   },
//   dashboardButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG = '#F5F5F7';
const GREEN = '#09B368';

export default function BookingConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // params coming from booking screens
  const bookingId = route?.params?.booking_id || 'TRX-24835';

  // these can come from different booking screens
  const rawServiceName = route?.params?.service_name;     // e.g. "Luxury Car"
  const serviceType    = route?.params?.service_type;     // e.g. "car", "bike"
  const shiftingType   = route?.params?.shifting_type;    // e.g. "Home", "Office", "Vehicle"
  const vehicleType    = route?.params?.vehicle_type;     // e.g. "SUV", "Sedan"

  // 1) figure out FINAL NAME
  // priority: explicit service_name → shifting_type → vehicle_type → fallback
  let finalServiceName =
    rawServiceName ||
    shiftingType ||
    vehicleType ||
    'Packers & Movers';

  // normalize a bit
  const lower = finalServiceName.toLowerCase();

  // 2) pick icon based on service
  const getIconForService = () => {
    // packers / movers
    if (lower.includes('packer') || lower.includes('mover') || lower.includes('shift')) {
      return 'cube-outline';
    }
    // cars
    if (lower.includes('car') || lower.includes('sedan') || lower.includes('hatch') || serviceType === 'car') {
      return 'car-outline';
    }
    // bikes
    if (lower.includes('bike') || serviceType === 'bike') {
      return 'bicycle-outline';
    }
    // trucks / tempo
    if (lower.includes('truck') || lower.includes('tempo') || lower.includes('pickup')) {
      return 'trailers-outline';
    }
    // buses
    if (lower.includes('bus')) {
      return 'bus-outline';
    }
    // equipment
    if (lower.includes('equipment') || lower.includes('jcb') || lower.includes('crane')) {
      return 'construct-outline';
    }
    // office shifting
    if (lower.includes('office')) {
      return 'briefcase-outline';
    }
    // default
    return 'cube-outline';
  };

  const finalIcon = getIconForService();

  // animations
  const sheetY = useRef(new Animated.Value(120)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const bgFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1 → pulse
    Animated.timing(pulse, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      // 2 → card + buttons + glow together (faster)
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          damping: 12,
          stiffness: 120,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bgFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [pulse, sheetY, btnFade, bgFade]);

  const scaleCircle = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const bgOpacity = bgFade.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  const goDashboard = () => navigation.navigate('CustomerDashboard');
  const goBookings = () => navigation.navigate('MyBookings');

  return (
    <SafeAreaView style={styles.safe}>
      {/* soft bg burst */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgBurst,
          {
            opacity: bgOpacity,
            transform: [{ scale: 1.15 }],
          },
        ]}
      />

      {/* top close */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goDashboard} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* success icon */}
        <View style={styles.centerWrap}>
          <Animated.View
            style={[
              styles.successOuter,
              {
                transform: [{ scale: scaleCircle }],
              },
            ]}
          >
            <View style={styles.successInner}>
              <Ionicons name="checkmark" size={30} color="#fff" />
            </View>
          </Animated.View>
          <Text style={styles.title}>Booking created 🎉</Text>
          <Text style={styles.sub}>
            Vendors near your location will now start sending quotes. You can compare and confirm.
          </Text>
        </View>

        {/* slide-up card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name={finalIcon} size={13} color="#055F3B" />
              {/* dynamic service name */}
              <Text style={styles.badgeText}>Your Booking</Text>
            </View>
            <Text style={styles.badgeRight}>ID: {bookingId}</Text>
          </View>

          <Text style={styles.cardTitle}>What happens next?</Text>
          <Text style={styles.cardSub}>
            We notify verified TransRentals vendors. You pick the best quote.
          </Text>

          {/* timeline */}
          <View style={styles.timeline}>
            {/* 1 */}
            <View style={styles.stepRow}>
              <View style={[styles.dot, styles.dotDone]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Request received</Text>
                <Text style={styles.stepSub}>We’ve sent it to nearby vendors</Text>
              </View>
            </View>
            <View style={styles.stepLine} />

            {/* 2 */}
            <View style={styles.stepRow}>
              <View style={[styles.dot, styles.dotActive]}>
                <Text style={styles.dotText}>2</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Vendors send quotes</Text>
                <Text style={styles.stepSub}>Expect price + vehicle/load details</Text>
              </View>
            </View>
            <View style={styles.stepLine} />

            {/* 3 */}
            <View style={styles.stepRow}>
              <View style={[styles.dot, styles.dotMuted]}>
                <Text style={styles.dotTextMuted}>3</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>You confirm & pay</Text>
                <Text style={styles.stepSub}>We lock the trip/shift for you</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* actions */}
        <Animated.View
          style={[
            styles.actions,
            {
              opacity: btnFade,
              transform: [
                {
                  translateY: btnFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={styles.primaryBtn} onPress={goDashboard} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Go to dashboard</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={goBookings} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={16} color="#0F172A" />
            <Text style={styles.secondaryText}>View my bookings</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* footer note */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
          <Text style={styles.footerText}>
            Tip: respond to vendor calls quickly to secure the slot.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  bgBurst: {
    position: 'absolute',
    top: -140,
    alignSelf: 'center',
    width: 340,
    height: 340,
    backgroundColor: 'rgba(9,179,104,0.12)',
    borderRadius: 999,
  },
  topBar: {
    height: 44,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  centerWrap: {
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 22,
  },
  successOuter: {
    width: 124,
    height: 124,
    borderRadius: 999,
    backgroundColor: 'rgba(9,179,104,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successInner: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sub: {
    marginTop: 4,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(9,179,104,0.09)',
    borderColor: 'rgba(9,179,104,0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
  },
  badgeText: {
    color: '#055F3B',
    fontSize: 12.5,
    fontWeight: '600',
  },
  badgeRight: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 2,
  },
  timeline: {
    marginTop: 14,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: {
    backgroundColor: GREEN,
  },
  dotActive: {
    backgroundColor: 'rgba(9,179,104,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(9,179,104,0.4)',
  },
  dotMuted: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  dotText: {
    color: '#055F3B',
    fontWeight: '600',
    fontSize: 13,
  },
  dotTextMuted: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  stepSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  stepLine: {
    width: 1.4,
    height: 14,
    backgroundColor: 'rgba(148,163,184,0.26)',
    marginLeft: 14,
    marginVertical: 3,
  },
  actions: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 11,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  secondaryText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    padding:5,
  },
  footerText: {
    fontSize: 11.5,
    color: '#94A3B8',
    flex: 1,
  },
});

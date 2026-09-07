import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput, RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getB2BTripDetail, b2bDriverAction, b2bVerifyOtp } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: T.oceanLight, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight, amberDark: shade(T.amber, -15),
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight, blueDark: shade(T.blue, -15),
  purple: T.purple, purpleBg: T.tintPlum, purpleDark: shade(T.purple, -15),
  // No dedicated "cyan" tone in the shared Elevate palette (only 5 tones:
  // emerald/ocean/amber/plum/rose) — oceanLight is the closest distinct-from-
  // "blue" hue and never renders alongside g300 (completed-only) in practice.
  cyan: T.oceanLight, cyanBg: T.tintOcean, cyanDark: shade(T.oceanLight, -15),
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending', color: C.amber, bg: C.amberBg, textColor: '#92400E',
    icon: 'clock', heroIcon: 'timer-sand',
  },
  DRIVER_ARRIVED: {
    label: 'Driver Arrived', color: C.cyan, bg: C.cyanBg, textColor: '#155E75',
    icon: 'map-pin', heroIcon: 'map-marker-check',
  },
  STARTED: {
    label: 'Trip Started', color: C.blue, bg: C.blueBg, textColor: '#1E40AF',
    icon: 'play-circle', heroIcon: 'play-circle-outline',
  },
  COMPLETED: {
    label: 'Completed', color: C.g600, bg: C.g50, textColor: '#065F46',
    icon: 'check-circle', heroIcon: 'check-circle-outline',
  },
  CANCELLED: {
    label: 'Cancelled', color: C.red, bg: C.redBg, textColor: '#7F1D1D',
    icon: 'x-circle', heroIcon: 'close-circle-outline',
  },
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '--';

export default function B2BTripDetailScreen({ navigation, route }) {
  const { tripCode } = route.params;
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '', actions: null });

  const showAlert = (type, title, message, actions) =>
    setAlert({ visible: true, type, title, message, actions: actions || null });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(C.g950);
    }, [])
  );

  const fetchTrip = useCallback(async () => {
    try {
      const res = await getB2BTripDetail(tripCode);
      setTrip(res.trip || res);
    } catch (e) {
      console.error('Failed to fetch trip:', e);
    } finally {
      setLoading(false);
    }
  }, [tripCode]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrip();
    }, [fetchTrip])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrip();
    setRefreshing(false);
  }, [fetchTrip]);

  const handleDriverAction = (action, confirmTitle, confirmMsg) => {
    showAlert('warning', confirmTitle, confirmMsg, [
      { label: 'Cancel', onPress: hideAlert, variant: 'ghost' },
      {
        label: 'Confirm', variant: 'primary',
        onPress: async () => {
          hideAlert();
          try {
            setActionLoading(true);
            await b2bDriverAction(tripCode, action);
            showAlert('success', 'Done!', 'Action completed successfully.', [
              { label: 'OK', onPress: () => { hideAlert(); fetchTrip(); }, variant: 'primary' },
            ]);
          } catch (e) {
            showAlert('error', 'Failed', e?.response?.data?.error || 'Action failed. Please try again.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      showAlert('warning', 'Invalid OTP', 'Please enter a valid 4-digit OTP.');
      return;
    }
    try {
      setActionLoading(true);
      await b2bVerifyOtp(tripCode, otp);
      setOtp('');
      showAlert('success', 'Trip Started!', 'OTP verified successfully. The trip has begun.', [
        { label: 'OK', onPress: () => { hideAlert(); fetchTrip(); }, variant: 'primary' },
      ]);
    } catch (e) {
      showAlert('error', 'OTP Failed', e?.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendOtp = () => {
    handleDriverAction('resend_otp', 'Resend OTP', 'Resend the OTP to the customer?');
  };

  const Header = ({ tripCode: tc }) => (
    <LinearGradient colors={G.hero} style={s.header}>
      <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Icon name="arrow-left" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>Trip Detail</Text>
        {tc && <Text style={s.headerSub}>{tc}</Text>}
      </View>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header tripCode={tripCode} />
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero banner skeleton */}
          <View style={[s.heroBanner, { borderColor: C.border }]}>
            <Bone w={56} h={56} r={28} />
            <View style={{ flex: 1 }}>
              <Bone w={110} h={17} style={{ marginBottom: 6 }} />
              <Bone w={90} h={13} />
            </View>
          </View>

          {/* Trip Information skeleton */}
          <View style={s.card}>
            <Bone w={140} h={12} style={{ marginBottom: 14 }} />
            {[0, 1, 2].map((i) => (
              <View key={i} style={s.infoRow}>
                <Bone w={36} h={36} r={10} />
                <View style={{ flex: 1 }}>
                  <Bone w={60} h={10} style={{ marginBottom: 5 }} />
                  <Bone w={130} h={14} />
                </View>
              </View>
            ))}
          </View>

          {/* Route skeleton */}
          <View style={s.card}>
            <Bone w={70} h={12} style={{ marginBottom: 14 }} />
            {[0, 1].map((i) => (
              <View key={i} style={s.routeBlock}>
                <Bone w={12} h={12} r={6} />
                <View style={s.routeTextWrap}>
                  <Bone w={50} h={10} style={{ marginBottom: 5 }} />
                  <Bone w={160} h={14} />
                </View>
              </View>
            ))}
          </View>

          {/* Trip Progress skeleton */}
          <View style={s.card}>
            <Bone w={110} h={12} style={{ marginBottom: 14 }} />
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={s.timelineItem}>
                <View style={s.timelineLeft}>
                  <Bone w={30} h={30} r={15} />
                  {i < 3 && <View style={[s.timelineLine, { backgroundColor: C.border }]} />}
                </View>
                <View style={s.timelineContent}>
                  <Bone w={110} h={13} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header tripCode={tripCode} />
        <View style={s.loadingWrap}>
          <MCI name="road-variant" size={52} color={C.muted} />
          <Text style={s.emptyTitle}>Trip not found</Text>
          <Text style={s.emptySub}>This trip may not exist or was removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_CONFIG[trip.status] || {
    label: trip.status, color: C.muted, bg: '#F1F5F9', textColor: C.sub,
    icon: 'help-circle', heroIcon: 'help-circle-outline',
  };

  const booking = trip.booking;
  const pickup = trip.pickupLocation || booking?.pickupLocation || '';
  const drop = trip.dropLocation || booking?.dropLocation || '';
  const isSelfDrive = (booking?.serviceType || '').toLowerCase().replace(/\s/g, '-') === 'self-drive';

  const timelineSteps = [
    {
      label: 'Trip Created',
      done: true,
      time: fmtDateTime(trip.createdAt),
      icon: 'plus-circle-outline',
    },
    {
      label: 'Driver Arrived',
      done: ['DRIVER_ARRIVED', 'STARTED', 'COMPLETED'].includes(trip.status),
      time: trip.driverArrivedAt ? fmtDateTime(trip.driverArrivedAt) : null,
      icon: 'map-marker-check-outline',
    },
    {
      label: 'Trip Started',
      done: ['STARTED', 'COMPLETED'].includes(trip.status),
      time: trip.startedAt ? fmtDateTime(trip.startedAt) : null,
      icon: 'play-circle-outline',
    },
    {
      label: 'Trip Completed',
      done: trip.status === 'COMPLETED',
      time: trip.completedAt ? fmtDateTime(trip.completedAt) : null,
      icon: 'check-circle-outline',
    },
  ];

  const showOtpInHero =
    trip.otp && ['PENDING', 'DRIVER_ARRIVED'].includes(trip.status);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header tripCode={trip.tripCode} />

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero Banner */}
        <View style={[s.heroBanner, { backgroundColor: sc.bg, borderColor: sc.color + '40' }]}>
          <View style={[s.heroIconBox, { backgroundColor: sc.color + '22' }]}>
            <MCI name={sc.heroIcon} size={32} color={sc.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.heroStatus, { color: sc.textColor }]}>{sc.label}</Text>
            <Text style={s.heroTripCode}>{trip.tripCode}</Text>
          </View>
          {showOtpInHero && (
            <View style={s.otpHeroBox}>
              <Text style={s.otpHeroLabel}>OTP</Text>
              <Text style={[s.otpHeroValue, { color: sc.color }]}>{trip.otp}</Text>
            </View>
          )}
        </View>

        {/* Card 1: Trip Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Trip Information</Text>

          {/* Vehicle row */}
          <View style={s.infoRow}>
            <View style={[s.infoIcon, { backgroundColor: C.g50 }]}>
              <MCI name="truck-outline" size={18} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Vehicle</Text>
              <Text style={s.infoValue}>
                {trip.vehicleName || 'N/A'}{trip.vehicleNumber ? ` · ${trip.vehicleNumber}` : ''}
              </Text>
            </View>
            {booking?.serviceType && (
              <View style={[s.serviceChip, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                <Text style={[s.serviceChipText, { color: C.g700 }]}>{booking.serviceType}</Text>
              </View>
            )}
          </View>

          {/* Driver row */}
          <View style={s.infoRow}>
            <View style={[s.infoIcon, { backgroundColor: C.blueBg }]}>
              <MCI name="account-outline" size={18} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Driver</Text>
              <Text style={s.infoValue}>{trip.driverName || 'N/A'}</Text>
              {trip.driverPhone && (
                <Text style={s.infoSub}>{trip.driverPhone}</Text>
              )}
            </View>
            {trip.driverPhone && (
              <TouchableOpacity
                style={s.callBtn}
                onPress={() => Linking.openURL(`tel:${trip.driverPhone}`)}
              >
                <Icon name="phone" size={15} color={C.g700} />
                <Text style={s.callBtnText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Passenger count */}
          {trip.passengerCount > 0 && (
            <View style={s.infoRow}>
              <View style={[s.infoIcon, { backgroundColor: C.purpleBg }]}>
                <MCI name="account-group-outline" size={18} color={C.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Passengers</Text>
                <Text style={s.infoValue}>{trip.passengerCount}</Text>
              </View>
            </View>
          )}

          {/* Scheduled date */}
          <View style={s.infoRow}>
            <View style={[s.infoIcon, { backgroundColor: C.amberBg }]}>
              <Icon name="calendar" size={16} color={C.amberDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Scheduled</Text>
              <Text style={s.infoValue}>
                {fmtDate(trip.scheduledDate)}{trip.scheduledTime ? ` · ${trip.scheduledTime}` : ''}
              </Text>
            </View>
          </View>

          {/* Booking ID only — customer details hidden from vendor */}
          {booking && (
            <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
              <View style={[s.infoIcon, { backgroundColor: C.bg }]}>
                <MCI name="file-document-outline" size={18} color={C.sub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Booking ID</Text>
                <Text style={s.infoValue}>#{booking.bookingNumber || booking.id?.slice(0, 8)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Card 2: Route */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Route</Text>

          <View style={s.routeBlock}>
            <View style={s.routePin}>
              <View style={[s.routePinDot, { backgroundColor: C.g500 }]} />
              <View style={s.routeConnector} />
            </View>
            <View style={s.routeTextWrap}>
              <Text style={s.routeTypeLabel}>Pickup</Text>
              <Text style={s.routeAddress}>{pickup || 'Not specified'}</Text>
            </View>
          </View>

          <View style={s.routeBlock}>
            <View style={s.routePin}>
              <View style={[s.routePinDot, { backgroundColor: C.red }]} />
            </View>
            <View style={s.routeTextWrap}>
              <Text style={s.routeTypeLabel}>Drop</Text>
              <Text style={s.routeAddress}>{drop || 'Not specified'}</Text>
            </View>
          </View>

          {booking?.tripType && (
            <View style={s.tripTypeBadge}>
              <Icon name="repeat" size={12} color={C.sub} />
              <Text style={s.tripTypeBadgeText}>{booking.tripType}</Text>
            </View>
          )}
        </View>

        {/* Card 3: Trip Timeline */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Trip Progress</Text>
          {timelineSteps.map((step, i) => (
            <View key={i} style={s.timelineItem}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, step.done ? s.timelineDotDone : s.timelineDotPending]}>
                  <MCI name={step.icon} size={14} color={step.done ? '#fff' : C.muted} />
                </View>
                {i < timelineSteps.length - 1 && (
                  <View style={[s.timelineLine, { backgroundColor: step.done ? C.g400 : C.border }]} />
                )}
              </View>
              <View style={s.timelineContent}>
                <Text style={[s.timelineLabel, !step.done && s.timelineLabelMuted]}>
                  {step.label}
                </Text>
                {step.time && (
                  <Text style={s.timelineTime}>{step.time}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Card 4: Driver Actions — only for self-drive */}
        {isSelfDrive && trip.status === 'PENDING' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Driver Actions</Text>
            <View style={[s.infoBanner, { backgroundColor: C.amberBg, borderColor: C.amber + '60' }]}>
              <Icon name="info" size={16} color={C.amberDark} />
              <Text style={[s.infoBannerText, { color: C.amberDark }]}>
                Head to the pickup location and mark arrived when you reach the customer.
              </Text>
            </View>
            <TouchableOpacity
              style={s.bigActionBtn}
              onPress={() => handleDriverAction('arrive', 'Mark Arrived', 'Confirm that the driver has arrived at the pickup location?')}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[C.cyanDark, C.cyan]} style={s.bigActionBtnGrad}>
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MCI name="map-marker-check-outline" size={22} color="#fff" />
                    <Text style={s.bigActionBtnText}>Mark Driver Arrived</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isSelfDrive && trip.status === 'DRIVER_ARRIVED' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Verify OTP to Start Trip</Text>
            <View style={[s.infoBanner, { backgroundColor: C.cyanBg, borderColor: C.cyan + '60' }]}>
              <Icon name="info" size={16} color={C.cyanDark} />
              <Text style={[s.infoBannerText, { color: C.cyanDark }]}>
                Ask the customer for their OTP from the trip link.
              </Text>
            </View>
            <TextInput
              style={s.otpInput}
              placeholder="0000"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
            />
            <View style={s.otpActions}>
              <TouchableOpacity
                style={s.resendBtn}
                onPress={handleResendOtp}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Icon name="refresh-cw" size={15} color={C.sub} />
                <Text style={s.resendBtnText}>Resend OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.verifyBtn}
                onPress={handleVerifyOtp}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[C.blueDark, C.blue]} style={s.verifyBtnGrad}>
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={17} color="#fff" />
                      <Text style={s.verifyBtnText}>Verify & Start Trip</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isSelfDrive && trip.status === 'STARTED' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Trip in Progress</Text>
            <View style={[s.infoBanner, { backgroundColor: C.blueBg, borderColor: C.blue + '60' }]}>
              <Icon name="info" size={16} color={C.blueDark} />
              <Text style={[s.infoBannerText, { color: C.blueDark }]}>
                Trip in progress{trip.startedAt ? ` — started at ${fmtDateTime(trip.startedAt)}` : ''}.
              </Text>
            </View>
            <TouchableOpacity
              style={s.bigActionBtn}
              onPress={() => handleDriverAction('end_trip', 'End Trip', 'Mark this trip as completed?')}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[C.purpleDark, C.purple]} style={s.bigActionBtnGrad}>
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="check-circle" size={22} color="#fff" />
                    <Text style={s.bigActionBtnText}>End Trip</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Car rental: read-only info for active trips */}
        {!isSelfDrive && ['PENDING', 'DRIVER_ARRIVED', 'STARTED'].includes(trip.status) && (
          <View style={s.card}>
            <View style={[s.infoBanner, { backgroundColor: C.blueBg, borderColor: C.blue + '60', marginBottom: 0 }]}>
              <Icon name="info" size={16} color={C.blueDark} />
              <Text style={[s.infoBannerText, { color: C.blueDark }]}>
                The driver manages this trip via the trip link shared with the employee. Status updates will reflect here automatically.
              </Text>
            </View>
          </View>
        )}

        {trip.status === 'COMPLETED' && (
          <View style={[s.card, s.completedCard]}>
            <View style={s.completedIconRow}>
              <View style={s.completedIconBox}>
                <MCI name="check-circle" size={36} color={C.g600} />
              </View>
            </View>
            <Text style={s.completedTitle}>Trip Completed</Text>
            {trip.completedAt && (
              <Text style={s.completedTime}>{fmtDateTime(trip.completedAt)}</Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontFamily: 'monospace' },

  // Loading / Empty
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center' },

  scroll: { flex: 1 },

  // Hero Banner
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginTop: 16,
    padding: 16, borderRadius: rs(16), borderWidth: 1,
  },
  heroIconBox: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  heroStatus: { fontSize: 18, fontWeight: '800', fontFamily: DISPLAY },
  heroTripCode: { fontSize: 14, color: C.sub, fontFamily: 'monospace', marginTop: 2 },
  otpHeroBox: { alignItems: 'center' },
  otpHeroLabel: { fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  otpHeroValue: { fontSize: 28, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 4, marginTop: 2 },

  // Cards
  card: {
    backgroundColor: C.surface, borderRadius: rs(16), borderWidth: 1, borderColor: C.border,
    marginHorizontal: 16, marginTop: 12, padding: 16,
    ...cardShadow,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14,
  },

  // Info rows (card 1)
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 1 },
  infoSub: { fontSize: 13, color: C.sub, marginTop: 1 },
  serviceChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  serviceChipText: { fontSize: 12, fontWeight: '700' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.g100,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: C.g700 },

  // Route (card 2)
  routeBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  routePin: { alignItems: 'center', width: 18, paddingTop: 4 },
  routePinDot: { width: 12, height: 12, borderRadius: 6 },
  routeConnector: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4, minHeight: 24 },
  routeTextWrap: { flex: 1, paddingBottom: 12 },
  routeTypeLabel: { fontSize: 12, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  routeAddress: { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  tripTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  tripTypeBadgeText: { fontSize: 13, color: C.sub, fontWeight: '500' },

  // Timeline (card 3)
  timelineItem: { flexDirection: 'row', minHeight: 52 },
  timelineLeft: { alignItems: 'center', width: 34 },
  timelineDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  timelineDotDone: { backgroundColor: C.g600 },
  timelineDotPending: { backgroundColor: C.border },
  timelineLine: { width: 2, flex: 1, marginVertical: 3, borderRadius: 1 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16, justifyContent: 'center' },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  timelineLabelMuted: { color: C.muted },
  timelineTime: { fontSize: 12, color: C.muted, marginTop: 3 },

  // Action sections
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 16,
  },
  infoBannerText: { fontSize: 14, lineHeight: 18, flex: 1, fontWeight: '500' },

  bigActionBtn: { borderRadius: 14, overflow: 'hidden' },
  bigActionBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16,
  },
  bigActionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // OTP section
  otpInput: {
    backgroundColor: C.bg, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 20,
    fontSize: 32, fontWeight: '800', color: C.text,
    borderWidth: 2, borderColor: C.cyan,
    textAlign: 'center', letterSpacing: 12,
    marginBottom: 14,
    fontFamily: 'monospace',
  },
  otpActions: { flexDirection: 'row', gap: 10 },
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  resendBtnText: { fontSize: 14, fontWeight: '600', color: C.sub },
  verifyBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  verifyBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13,
  },
  verifyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Completed card
  completedCard: { alignItems: 'center', paddingVertical: 28, borderColor: C.g300, backgroundColor: C.g50 },
  completedIconRow: { marginBottom: 10 },
  completedIconBox: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.g100, borderWidth: 2, borderColor: C.g300,
    justifyContent: 'center', alignItems: 'center',
  },
  completedTitle: { fontSize: 20, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  completedTime: { fontSize: 14, color: C.g600, marginTop: 4 },
});

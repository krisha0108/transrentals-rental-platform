import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Animated, Linking, Modal,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { startTrip, completeTrip, requestOtp, startTransit, startUnloading, startPackingLoading, startUnpacking, startUse, schedulePickup, confirmReturn, b2bMarkArrival, b2bEndTrip } from '../api/client';
import moment from 'moment';

const SCREEN_W = Dimensions.get('window').width;

const C = {
  primary: '#16A34A', primaryDark: '#15803D', primaryDeep: '#064E3B',
  primaryLight: '#DCFCE7', primaryMid: '#ECFDF5',
  bg: '#F0F4F8', card: '#FFFFFF', border: '#E2EAF4',
  text: '#0F172A', sub: '#64748B',
  danger: '#EF4444', blue: '#3B82F6',
};

// ─── Elapsed Timer ─────────────────────────────────────────────────────────────
function ElapsedTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    function tick() {
      if (!startedAt) return;
      const diff = Date.now() - new Date(startedAt).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
          : `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <Text style={styles.timerText}>{elapsed}</Text>;
}

// ─── OTP Box ───────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, maxDigits = 6 }) {
  const digits = (value + '      ').slice(0, maxDigits).split('');
  const inputRef = useRef(null);
  return (
    <TouchableOpacity style={styles.otpContainer} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, maxDigits))}
        keyboardType="numeric"
        maxLength={maxDigits}
        autoComplete="one-time-code"
      />
      <View style={styles.otpBoxRow}>
        {digits.slice(0, maxDigits).map((d, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <View key={i} style={[styles.otpBox, filled && styles.otpBoxFilled, active && styles.otpBoxActive]}>
              <Text style={[styles.otpDigit, !filled && { opacity: 0 }]}>{filled ? d : '0'}</Text>
              {active && <View style={styles.otpCursor} />}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = C.primary, bg = C.primaryMid }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ActiveTripScreen({ route, navigation }) {
  const { booking } = route.params;
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(!!booking.hasOtp);
  const [actualKm, setActualKm]   = useState('');
  const [toll, setToll]           = useState('');
  const [parking, setParking]     = useState('');
  const [showComplete, setShowComplete] = useState(false);

  const isInProgress = booking.status === 'IN_PROGRESS';

  // Pulse animation
  const pulse = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isInProgress) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 1,   duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [isInProgress]);

  async function handleStartTrip() {
    const otpDigits = booking.source === 'b2b' ? 4 : 6;
    if (otp.length !== otpDigits) {
      Alert.alert('Invalid OTP', `Please enter the ${otpDigits}-digit OTP provided by the customer`);
      return;
    }
    setLoading(true);
    try {
      const res = await startTrip(booking.id, otp, booking.source || 'chauffeur');
      if (res.data.success) {
        // B2B trips use 'STARTED' status, all others use 'IN_PROGRESS'
        const nextStatus = booking.source === 'b2b' ? 'STARTED' : 'IN_PROGRESS';
        navigation.replace('ActiveTrip', {
          booking: { ...booking, status: nextStatus, tripStartedAt: new Date() },
        });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start trip. Check the OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    setSendingOtp(true);
    try {
      const res = await requestOtp(booking.id, booking.source || 'chauffeur');
      if (res.data.success) {
        setOtpSent(true);
        Alert.alert('OTP Sent!', 'OTP has been sent to the customer\'s phone. Ask them to share it with you.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  // ── Truck handlers ──────────────────────────────────────────────────────────
  async function handleStartLoading() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit loading OTP'); return; }
    setLoading(true);
    try {
      const res = await startTrip(booking.id, otp, 'truck');
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'LOADING', loadingStartedAt: new Date() } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleStartTransit() {
    setLoading(true);
    try {
      const res = await startTransit(booking.id);
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'IN_TRANSIT' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start transit');
    } finally { setLoading(false); }
  }

  async function handleStartUnloading() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit delivery OTP'); return; }
    setLoading(true);
    try {
      const res = await startUnloading(booking.id, otp);
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'UNLOADING' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleCompleteDelivery() {
    setLoading(true);
    try {
      const res = await completeTrip(booking.id, {}, 'truck');
      if (res.data.success) {
        navigation.navigate('BookingDetail', { booking: { ...booking, status: 'COMPLETED' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to complete delivery');
    } finally { setLoading(false); }
  }

  // ── Packers handlers ─────────────────────────────────────────────────────────
  async function handleStartPacking() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit packing OTP'); return; }
    setLoading(true);
    try {
      const res = await startTrip(booking.id, otp, 'packers');
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'PACKING', packingStartedAt: new Date() } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleStartPackingLoading() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit loading OTP'); return; }
    setLoading(true);
    try {
      const res = await startPackingLoading(booking.id, otp);
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'LOADING', loadingStartedAt: new Date() } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleStartPackersTransit() {
    setLoading(true);
    try {
      const res = await startTransit(booking.id, 'packers');
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'IN_TRANSIT' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start transit');
    } finally { setLoading(false); }
  }

  async function handleStartPackersUnloading() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit delivery OTP'); return; }
    setLoading(true);
    try {
      const res = await startUnloading(booking.id, otp, 'packers');
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'UNLOADING' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleStartUnpacking() {
    setLoading(true);
    try {
      const res = await startUnpacking(booking.id);
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'UNPACKING' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start unpacking');
    } finally { setLoading(false); }
  }

  async function handleCompleteJob() {
    setLoading(true);
    try {
      const res = await completeTrip(booking.id, {}, 'packers');
      if (res.data.success) {
        navigation.navigate('BookingDetail', { booking: { ...booking, status: 'COMPLETED' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to complete job');
    } finally { setLoading(false); }
  }

  // ── Equipment handlers ───────────────────────────────────────────────────────
  async function handleDeliverEquipment() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit delivery OTP'); return; }
    setLoading(true);
    try {
      const res = await startTrip(booking.id, otp, 'equipment');
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'DELIVERED', deliveredAt: new Date() } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleStartUse() {
    setLoading(true);
    try {
      const res = await startUse(booking.id);
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'IN_USE', inUseFrom: new Date() } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to mark equipment in use');
    } finally { setLoading(false); }
  }

  async function handleSchedulePickup() {
    setLoading(true);
    try {
      const res = await schedulePickup(booking.id);
      if (res.data.success) {
        setOtpSent(true);
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'PICKUP_SCHEDULED', hasOtp: true } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to schedule pickup');
    } finally { setLoading(false); }
  }

  async function handleConfirmReturn() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit return OTP'); return; }
    setLoading(true);
    try {
      const res = await confirmReturn(booking.id, otp);
      if (res.data.success) {
        navigation.replace('ActiveTrip', { booking: { ...booking, status: 'RETURNED', returnedAt: new Date() } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleCompleteRental() {
    setLoading(true);
    try {
      const res = await completeTrip(booking.id, {}, 'equipment');
      if (res.data.success) {
        navigation.navigate('BookingDetail', { booking: { ...booking, status: 'COMPLETED' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to complete rental');
    } finally { setLoading(false); }
  }

  // ── B2B handlers ─────────────────────────────────────────────────────────────
  async function handleB2bEndTrip() {
    setLoading(true);
    try {
      const res = await b2bEndTrip(booking.id);
      if (res.data.success) {
        navigation.navigate('BookingDetail', { booking: { ...booking, status: 'COMPLETED' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to end trip');
    } finally { setLoading(false); }
  }

  async function confirmComplete() {
    setShowComplete(false);
    setLoading(true);
    try {
      const res = await completeTrip(booking.id, {
        actualKm:       actualKm || null,
        tollCharges:    toll     || null,
        parkingCharges: parking  || null,
      }, booking.source || 'chauffeur');
      if (res.data.success) {
        navigation.navigate('BookingDetail', { booking: { ...booking, status: 'COMPLETED' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to complete trip');
    } finally {
      setLoading(false);
    }
  }

  function callCustomer() {
    if (booking.customerPhone) Linking.openURL(`tel:${booking.customerPhone}`);
  }

  const pickupDisplay  = booking.pickupAddress  || booking.pickupCity  || '—';
  const dropDisplay    = booking.dropAddress    || booking.dropCity    || null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Hero ── */}
      <LinearGradient
        colors={['#043927', '#065F46', '#16A34A']}
        style={styles.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Nav */}
        <View style={styles.heroBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {booking.source === 'truck'
                ? booking.status === 'LOADING' ? 'Loading In Progress'
                  : booking.status === 'IN_TRANSIT' ? 'In Transit'
                  : booking.status === 'UNLOADING' ? 'Unloading'
                  : 'Start Loading'
                : booking.source === 'packers'
                ? booking.status === 'PACKING' ? 'Packing In Progress'
                  : booking.status === 'LOADING' ? 'Loading In Progress'
                  : booking.status === 'IN_TRANSIT' ? 'In Transit'
                  : booking.status === 'UNLOADING' ? 'Unloading'
                  : booking.status === 'UNPACKING' ? 'Unpacking'
                  : 'Start Packing'
                : booking.source === 'equipment'
                ? booking.status === 'DELIVERED' ? 'Equipment Delivered'
                  : booking.status === 'IN_USE' ? 'Equipment In Use'
                  : booking.status === 'PICKUP_SCHEDULED' ? 'Pickup Scheduled'
                  : booking.status === 'RETURNED' ? 'Equipment Returned'
                  : 'Deliver Equipment'
                : booking.source === 'b2b'
                ? booking.status === 'STARTED' ? 'B2B Trip In Progress'
                  : booking.status === 'DRIVER_ARRIVED' ? 'Enter Customer OTP'
                  : 'B2B Trip — Send OTP'
                : isInProgress ? 'Trip In Progress' : 'Start Trip'}
            </Text>
            <Text style={styles.heroSub}>{booking.bookingNumber}</Text>
          </View>
          {isInProgress ? (
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveRing, { transform: [{ scale: ringPulse }] }]} />
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.readyBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#86EFAC" />
              <Text style={styles.readyText}>Ready</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={styles.heroRouteCard}>
          <View style={styles.heroRouteRow}>
            <View style={[styles.routeDot, { backgroundColor: '#4ADE80' }]} />
            <Text style={styles.heroRouteText} numberOfLines={1}>{pickupDisplay}</Text>
          </View>
          {dropDisplay && (
            <>
              <View style={styles.routeConnector} />
              <View style={styles.heroRouteRow}>
                <View style={[styles.routeDot, { backgroundColor: '#FCA5A5', borderRadius: 2 }]} />
                <Text style={styles.heroRouteText} numberOfLines={1}>{dropDisplay}</Text>
              </View>
            </>
          )}
        </View>

        {/* Timer / pickup info row */}
        {isInProgress && booking.tripStartedAt ? (
          <View style={styles.heroFootRow}>
            <Ionicons name="timer-outline" size={13} color="rgba(255,255,255,0.65)" />
            <Text style={styles.heroFootLabel}>Running for </Text>
            <ElapsedTimer startedAt={booking.tripStartedAt} />
          </View>
        ) : (
          <View style={styles.heroFootRow}>
            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.65)" />
            <Text style={styles.heroFootLabel}>
              {booking.pickupDate ? moment(booking.pickupDate).format('DD MMM YYYY') : '—'}
              {booking.pickupTime ? `  ·  ${booking.pickupTime}` : ''}
            </Text>
          </View>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Stats Row ── */}
        {isInProgress && (
          <View style={styles.statsRow}>
            <StatCard icon="timer-outline" label="Started" value={moment(booking.tripStartedAt).format('h:mm A')} />
            {booking.estimatedDistance > 0 && (
              <StatCard icon="speedometer-outline" label="Est. Km" value={`${booking.estimatedDistance} km`} />
            )}
            {(booking.earnings ?? booking.driverBatta) > 0 && (
              <StatCard icon="wallet-outline" label="Batta" value={`₹${(booking.earnings ?? booking.driverBatta).toLocaleString('en-IN')}`} />
            )}
          </View>
        )}

        {/* ── Customer Card ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Ionicons name="person" size={22} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{booking.customerName || '—'}</Text>
                {booking.customerPhone ? (
                  <Text style={styles.customerPhone}>{booking.customerPhone}</Text>
                ) : null}
              </View>
              {booking.customerPhone ? (
                <TouchableOpacity style={styles.callBtn} onPress={callCustomer} activeOpacity={0.8}>
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {(booking.vehicleModel || booking.vehicleNumber) ? (
              <View style={styles.vehicleChip}>
                <Ionicons name="car-sport-outline" size={14} color={C.primary} />
                <Text style={styles.vehicleChipText}>
                  {[booking.vehicleModel, booking.vehicleNumber].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── TRUCK MULTI-PHASE UI ── */}
        {booking.source === 'truck' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {booking.status === 'VEHICLE_ASSIGNED' ? 'Step 1: Start Loading'
                : booking.status === 'LOADING' ? 'Step 2: Loading Complete?'
                : booking.status === 'IN_TRANSIT' ? 'Step 3: Arrived at Destination?'
                : 'Step 4: Complete Delivery'}
            </Text>
            <View style={styles.card}>

              {/* VEHICLE_ASSIGNED: Send Loading OTP → Enter OTP → Start Loading */}
              {booking.status === 'VEHICLE_ASSIGNED' && (
                !otpSent ? (
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <View style={[styles.otpInfoIcon, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="send" size={20} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpInfoTitle}>Send Loading OTP</Text>
                        <Text style={styles.otpInfoSub}>When you arrive and are ready to load goods, send the OTP to the customer for verification.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#4F46E5' }, sendingOtp && { opacity: 0.6 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                      activeOpacity={0.85}
                    >
                      {sendingOtp ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="notifications" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Send Loading OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[styles.otpInfoBanner, { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                      <Text style={[styles.otpInfoSub, { color: '#4F46E5', marginLeft: 6 }]}>Loading OTP sent. Ask customer to share the 6-digit OTP.</Text>
                    </View>
                    <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                    <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={14} color={C.sub} />
                      <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#4F46E5' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                      onPress={handleStartLoading}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="cube" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Start Loading</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* LOADING: Loading complete → start transit */}
              {booking.status === 'LOADING' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#F5F3FF' }]}>
                      <Ionicons name="navigate" size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Loading Complete?</Text>
                      <Text style={styles.otpInfoSub}>Once all goods are loaded, tap below to start transit to the destination.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }, loading && { opacity: 0.6 }]}
                    onPress={handleStartTransit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="navigate-circle" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Loading Complete — Start Transit</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* IN_TRANSIT: Send Delivery OTP → Enter OTP → Start Unloading */}
              {booking.status === 'IN_TRANSIT' && (
                !otpSent ? (
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <View style={[styles.otpInfoIcon, { backgroundColor: '#FFF7ED' }]}>
                        <Ionicons name="send" size={20} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpInfoTitle}>Send Delivery OTP</Text>
                        <Text style={styles.otpInfoSub}>When you arrive at the delivery location, send the delivery OTP to the customer.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, sendingOtp && { opacity: 0.6 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                      activeOpacity={0.85}
                    >
                      {sendingOtp ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="notifications" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Send Delivery OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[styles.otpInfoBanner, { backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#EA580C" />
                      <Text style={[styles.otpInfoSub, { color: '#EA580C', marginLeft: 6 }]}>Delivery OTP sent. Ask customer to share the 6-digit OTP.</Text>
                    </View>
                    <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                    <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={14} color={C.sub} />
                      <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                      onPress={handleStartUnloading}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="package" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Start Unloading</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* UNLOADING: Complete Delivery */}
              {booking.status === 'UNLOADING' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="checkmark-done-circle" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Complete Delivery</Text>
                      <Text style={styles.otpInfoSub}>Once all goods are unloaded and delivered, mark the delivery as complete.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: C.primary }, loading && { opacity: 0.6 }]}
                    onPress={handleCompleteDelivery}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Mark Delivery Complete</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>
        )}

        {/* ── PACKERS MULTI-PHASE UI ── */}
        {booking.source === 'packers' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {booking.status === 'TEAM_ASSIGNED' ? 'Step 1: Start Packing'
                : booking.status === 'PACKING' ? 'Step 2: Packing Complete?'
                : booking.status === 'LOADING' ? 'Step 3: Loading Complete?'
                : booking.status === 'IN_TRANSIT' ? 'Step 4: Arrived at Destination?'
                : booking.status === 'UNLOADING' ? 'Step 5: Unloading Complete?'
                : 'Step 6: Complete Job'}
            </Text>
            <View style={styles.card}>

              {/* TEAM_ASSIGNED: Send Packing OTP → Enter OTP → Start Packing */}
              {booking.status === 'TEAM_ASSIGNED' && (
                !otpSent ? (
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <View style={[styles.otpInfoIcon, { backgroundColor: '#FDF4FF' }]}>
                        <Ionicons name="send" size={20} color="#9333EA" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpInfoTitle}>Send Packing OTP</Text>
                        <Text style={styles.otpInfoSub}>When you arrive at the customer's location, send the OTP to them for verification before starting to pack.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#9333EA' }, sendingOtp && { opacity: 0.6 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                      activeOpacity={0.85}
                    >
                      {sendingOtp ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="notifications" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Send Packing OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[styles.otpInfoBanner, { backgroundColor: '#FDF4FF', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#9333EA" />
                      <Text style={[styles.otpInfoSub, { color: '#9333EA', marginLeft: 6 }]}>Packing OTP sent. Ask customer to share the 6-digit OTP.</Text>
                    </View>
                    <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                    <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={14} color={C.sub} />
                      <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#9333EA' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                      onPress={handleStartPacking}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="archive" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Start Packing</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* PACKING: Send Loading OTP → Enter OTP → Start Loading */}
              {booking.status === 'PACKING' && (
                !otpSent ? (
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <View style={[styles.otpInfoIcon, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="send" size={20} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpInfoTitle}>Send Loading OTP</Text>
                        <Text style={styles.otpInfoSub}>Once packing is done, send the loading OTP to the customer for verification before loading the goods.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#4F46E5' }, sendingOtp && { opacity: 0.6 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                      activeOpacity={0.85}
                    >
                      {sendingOtp ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="notifications" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Send Loading OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[styles.otpInfoBanner, { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                      <Text style={[styles.otpInfoSub, { color: '#4F46E5', marginLeft: 6 }]}>Loading OTP sent. Ask customer to share the 6-digit OTP.</Text>
                    </View>
                    <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                    <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={14} color={C.sub} />
                      <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#4F46E5' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                      onPress={handleStartPackingLoading}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="cube" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Start Loading</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* LOADING: Start Transit (no OTP) */}
              {booking.status === 'LOADING' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#F5F3FF' }]}>
                      <Ionicons name="navigate" size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Loading Complete?</Text>
                      <Text style={styles.otpInfoSub}>Once all goods are loaded, tap below to start transit to the destination address.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }, loading && { opacity: 0.6 }]}
                    onPress={handleStartPackersTransit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="navigate-circle" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Loading Complete — Start Transit</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* IN_TRANSIT: Send Delivery OTP → Enter OTP → Start Unloading */}
              {booking.status === 'IN_TRANSIT' && (
                !otpSent ? (
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <View style={[styles.otpInfoIcon, { backgroundColor: '#FFF7ED' }]}>
                        <Ionicons name="send" size={20} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpInfoTitle}>Send Delivery OTP</Text>
                        <Text style={styles.otpInfoSub}>When you arrive at the destination, send the delivery OTP to the customer for verification.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, sendingOtp && { opacity: 0.6 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                      activeOpacity={0.85}
                    >
                      {sendingOtp ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="notifications" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Send Delivery OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[styles.otpInfoBanner, { backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#EA580C" />
                      <Text style={[styles.otpInfoSub, { color: '#EA580C', marginLeft: 6 }]}>Delivery OTP sent. Ask customer to share the 6-digit OTP.</Text>
                    </View>
                    <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                    <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={14} color={C.sub} />
                      <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                      onPress={handleStartPackersUnloading}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="package" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Start Unloading</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* UNLOADING: Start Unpacking (no OTP) */}
              {booking.status === 'UNLOADING' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="construct" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Unloading Complete?</Text>
                      <Text style={styles.otpInfoSub}>Once goods are unloaded, tap below to begin unpacking and arranging at the destination.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: C.primaryDark }, loading && { opacity: 0.6 }]}
                    onPress={handleStartUnpacking}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="grid" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Unloading Complete — Start Unpacking</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* UNPACKING: Complete Job */}
              {booking.status === 'UNPACKING' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="checkmark-done-circle" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Complete the Job</Text>
                      <Text style={styles.otpInfoSub}>Once all items are unpacked and arranged, mark the job as complete.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: C.primary }, loading && { opacity: 0.6 }]}
                    onPress={handleCompleteJob}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Mark Job Complete</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>
        )}

        {/* ── EQUIPMENT MULTI-PHASE UI ── */}
        {booking.source === 'equipment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {booking.status === 'CONFIRMED' ? 'Step 1: Deliver Equipment'
                : booking.status === 'DELIVERED' ? 'Step 2: Start Equipment Use'
                : booking.status === 'IN_USE' ? 'Step 3: Schedule Pickup'
                : booking.status === 'PICKUP_SCHEDULED' ? 'Step 4: Confirm Return'
                : 'Step 5: Complete Rental'}
            </Text>
            <View style={styles.card}>

              {/* CONFIRMED: Send Delivery OTP → Enter OTP → Mark Delivered */}
              {booking.status === 'CONFIRMED' && (
                !otpSent ? (
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <View style={[styles.otpInfoIcon, { backgroundColor: '#FFF7ED' }]}>
                        <Ionicons name="send" size={20} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpInfoTitle}>Send Delivery OTP</Text>
                        <Text style={styles.otpInfoSub}>When you arrive with the equipment, send the OTP to the customer for verification before handing over.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, sendingOtp && { opacity: 0.6 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                      activeOpacity={0.85}
                    >
                      {sendingOtp ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="notifications" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Send Delivery OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[styles.otpInfoBanner, { backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#EA580C" />
                      <Text style={[styles.otpInfoSub, { color: '#EA580C', marginLeft: 6 }]}>Delivery OTP sent. Ask customer to share the 6-digit OTP.</Text>
                    </View>
                    <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                    <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={14} color={C.sub} />
                      <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                      onPress={handleDeliverEquipment}
                      disabled={loading || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <><Ionicons name="cube" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Confirm Delivery</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* DELIVERED: Mark In Use (no OTP) */}
              {booking.status === 'DELIVERED' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#EEF2FF' }]}>
                      <Ionicons name="construct" size={20} color="#4F46E5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Equipment Delivered</Text>
                      <Text style={styles.otpInfoSub}>Once the customer starts using the equipment, tap below to mark it as in use.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: '#4F46E5' }, loading && { opacity: 0.6 }]}
                    onPress={handleStartUse}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="play-circle" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Mark Equipment In Use</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* IN_USE: Schedule Pickup (generates return OTP automatically) */}
              {booking.status === 'IN_USE' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#F5F3FF' }]}>
                      <Ionicons name="calendar" size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Schedule Equipment Pickup</Text>
                      <Text style={styles.otpInfoSub}>When ready to pick up the equipment, tap below. A return OTP will be sent to the customer automatically.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }, loading && { opacity: 0.6 }]}
                    onPress={handleSchedulePickup}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="car" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Schedule Pickup & Send Return OTP</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* PICKUP_SCHEDULED: Enter Return OTP → Confirm Return */}
              {booking.status === 'PICKUP_SCHEDULED' && (
                <View>
                  <View style={[styles.otpInfoBanner, { backgroundColor: '#FDF4FF', borderRadius: 10, padding: 10, marginBottom: 12 }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#9333EA" />
                    <Text style={[styles.otpInfoSub, { color: '#9333EA', marginLeft: 6 }]}>Return OTP sent to customer. Ask them to share the 6-digit OTP to confirm pickup.</Text>
                  </View>
                  <OtpInput value={otp} onChange={setOtp} maxDigits={6} />
                  <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp} disabled={sendingOtp} activeOpacity={0.7}>
                    <Ionicons name="refresh" size={14} color={C.sub} />
                    <Text style={styles.resendBtnText}>{sendingOtp ? 'Resending...' : 'Resend Return OTP'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: '#9333EA' }, (loading || otp.length < 6) && { opacity: 0.5 }]}
                    onPress={handleConfirmReturn}
                    disabled={loading || otp.length < 6}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Confirm Return</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* RETURNED: Complete Rental */}
              {booking.status === 'RETURNED' && (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="checkmark-done-circle" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Equipment Returned</Text>
                      <Text style={styles.otpInfoSub}>Equipment has been picked up. Mark the rental as complete to finish this booking.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: C.primary }, loading && { opacity: 0.6 }]}
                    onPress={handleCompleteRental}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="flag" size={20} color="#fff" /><Text style={styles.primaryBtnText}>Complete Rental</Text></>
                    )}
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>
        )}

        {/* ── B2B End Trip (STARTED status) ── */}
        {booking.source === 'b2b' && booking.status === 'STARTED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 2: End Trip</Text>
            <View style={styles.card}>
              <View style={styles.otpInfoBanner}>
                <View style={[styles.otpInfoIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-done-circle" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.otpInfoTitle}>Trip In Progress</Text>
                  <Text style={styles.otpInfoSub}>Trip has started. Tap End Trip when you reach the destination.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: C.primaryDeep }, loading && { opacity: 0.6 }]}
                onPress={handleB2bEndTrip}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <><Ionicons name="flag" size={20} color="#fff" /><Text style={styles.primaryBtnText}>End Trip</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── OTP Entry (chauffeur/bus/luxury/b2b) ── */}
        {!isInProgress && booking.status !== 'STARTED' && !['truck', 'packers', 'equipment'].includes(booking.source) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verify Customer OTP</Text>
            <View style={styles.card}>

              {/* Step 1: Send OTP to customer (if not yet sent) */}
              {!otpSent ? (
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={[styles.otpInfoIcon, { backgroundColor: '#FFF7ED' }]}>
                      <Ionicons name="send" size={20} color="#EA580C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Send OTP to Customer</Text>
                      <Text style={styles.otpInfoSub}>First, send the OTP to the customer's phone. They will receive it as a notification and can share it with you.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: '#EA580C' }, sendingOtp && { opacity: 0.6 }]}
                    onPress={handleRequestOtp}
                    disabled={sendingOtp}
                    activeOpacity={0.85}
                  >
                    {sendingOtp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="notifications" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>Send OTP to Customer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Step 2: OTP sent — enter OTP from customer */
                <View>
                  <View style={styles.otpInfoBanner}>
                    <View style={styles.otpInfoIcon}>
                      <Ionicons name="shield-checkmark" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpInfoTitle}>Enter the {booking.source === 'b2b' ? '4' : '6'}-digit OTP</Text>
                      <Text style={styles.otpInfoSub}>Ask the customer for the OTP sent to their phone. This confirms you're with the right customer.</Text>
                    </View>
                  </View>

                  <OtpInput value={otp} onChange={setOtp} maxDigits={booking.source === 'b2b' ? 4 : 6} />

                  {/* Resend option */}
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleRequestOtp}
                    disabled={sendingOtp}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={14} color={C.sub} />
                    <Text style={styles.resendBtnText}>
                      {sendingOtp ? 'Resending...' : 'Resend OTP to Customer'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, (loading || otp.length < (booking.source === 'b2b' ? 4 : 6)) && { opacity: 0.5 }]}
                    onPress={handleStartTrip}
                    disabled={loading || otp.length < (booking.source === 'b2b' ? 4 : 6)}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>Start Trip</Text>
                        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Complete Trip ── */}
        {isInProgress && !['truck', 'packers', 'equipment', 'b2b'].includes(booking.source) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            <View style={styles.card}>
              <Text style={styles.fieldGroupSub}>Record final details (all optional)</Text>

              <InputField
                icon="speedometer-outline"
                label="Actual KM Travelled"
                placeholder="e.g. 120"
                value={actualKm}
                onChange={setActualKm}
                suffix="km"
                keyboardType="numeric"
              />
              <InputField
                icon="receipt-outline"
                label="Toll Charges"
                placeholder="0.00"
                value={toll}
                onChange={setToll}
                prefix="₹"
                keyboardType="numeric"
              />
              <InputField
                icon="car-outline"
                label="Parking Charges"
                placeholder="0.00"
                value={parking}
                onChange={setParking}
                prefix="₹"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: C.primaryDeep }, loading && { opacity: 0.65 }]}
                onPress={() => setShowComplete(true)}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Mark Trip as Completed</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Complete Confirmation Modal ── */}
      <Modal visible={showComplete} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconWrap}>
              <Ionicons name="flag" size={30} color={C.primary} />
            </View>
            <Text style={styles.modalTitle}>Complete Trip?</Text>
            <Text style={styles.modalDesc}>
              This will mark the trip for <Text style={{ fontWeight: '700', color: C.text }}>{booking.customerName || 'customer'}</Text> as completed.
            </Text>
            {(actualKm || toll || parking) ? (
              <View style={styles.modalSummaryBox}>
                {actualKm ? <View style={styles.modalSummaryRow}><Ionicons name="speedometer-outline" size={13} color={C.sub} /><Text style={styles.modalSummaryText}>Distance: {actualKm} km</Text></View> : null}
                {toll     ? <View style={styles.modalSummaryRow}><Ionicons name="receipt-outline"     size={13} color={C.sub} /><Text style={styles.modalSummaryText}>Toll: ₹{toll}</Text></View> : null}
                {parking  ? <View style={styles.modalSummaryRow}><Ionicons name="car-outline"         size={13} color={C.sub} /><Text style={styles.modalSummaryText}>Parking: ₹{parking}</Text></View> : null}
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowComplete(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmComplete}>
                <Ionicons name="checkmark-circle" size={17} color="#fff" />
                <Text style={styles.modalConfirmText}>Complete Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Input Field ───────────────────────────────────────────────────────────────
function InputField({ icon, label, placeholder, value, onChange, prefix, suffix, keyboardType }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={13} color={C.sub} />
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      <View style={styles.fieldInput}>
        {prefix ? <Text style={styles.fieldAffix}>{prefix}</Text> : null}
        <TextInput
          style={styles.fieldTextInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType || 'default'}
          placeholderTextColor="#CBD5E1"
        />
        {suffix ? <Text style={styles.fieldAffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Hero
  hero:        { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  heroBar:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  heroBack:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroTitle:   { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub:     { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, position: 'relative' },
  liveRing:    { position: 'absolute', left: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(74,222,128,0.35)' },
  liveDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  liveText:    { fontSize: 11, fontWeight: '800', color: '#4ADE80', letterSpacing: 1 },

  readyBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  readyText:   { fontSize: 11, fontWeight: '700', color: '#86EFAC' },

  heroRouteCard:   { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 12, marginBottom: 10, gap: 6 },
  heroRouteRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot:        { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  routeConnector:  { height: 14, width: 1.5, backgroundColor: 'rgba(255,255,255,0.25)', marginLeft: 3.5 },
  heroRouteText:   { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', flex: 1 },

  heroFootRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroFootLabel:{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  timerText:    { fontSize: 12, color: '#fff', fontWeight: '800' },

  // Stats
  statsRow:     { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 16 },
  statCard:     { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  statIcon:     { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statValue:    { fontSize: 14, fontWeight: '800' },
  statLabel:    { fontSize: 10, color: C.sub, fontWeight: '600' },

  // Sections
  section:      { paddingHorizontal: 14, marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  card:         { backgroundColor: C.card, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },

  // Customer
  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  customerAvatar:{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  customerName:  { fontSize: 15, fontWeight: '800', color: C.text },
  customerPhone: { fontSize: 13, color: C.sub, marginTop: 2 },
  callBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  callBtnText:   { fontSize: 13, color: '#fff', fontWeight: '700' },
  vehicleChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMid, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  vehicleChipText:{ fontSize: 12, color: C.primaryDark, fontWeight: '600' },

  // OTP
  otpInfoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, marginBottom: 20 },
  otpInfoIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  otpInfoTitle:  { fontSize: 13, fontWeight: '800', color: C.primaryDeep },
  otpInfoSub:    { fontSize: 11, color: C.primaryDark, marginTop: 3, lineHeight: 16 },
  resendBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10, marginBottom: 4 },
  resendBtnText: { fontSize: 12, color: C.sub, fontWeight: '600' },

  otpContainer:  { alignItems: 'center', marginBottom: 20 },
  hiddenInput:   { position: 'absolute', opacity: 0, height: 0, width: 0 },
  otpBoxRow:     { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'nowrap' },
  otpBox:        { width: Math.min(44, Math.floor((SCREEN_W - 96) / 6)), height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  otpBoxFilled:  { borderColor: C.primary, backgroundColor: C.primaryLight },
  otpBoxActive:  { borderColor: C.primary, backgroundColor: '#fff', shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  otpDigit:      { fontSize: 20, fontWeight: '900', color: C.text },
  otpCursor:     { position: 'absolute', bottom: 10, width: 18, height: 2.5, backgroundColor: C.primary, borderRadius: 2 },

  // CTA Button
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, minHeight: 52, paddingVertical: 10, paddingHorizontal: 14, marginTop: 6, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800', flexShrink: 1, textAlign: 'center' },

  // Complete form
  fieldGroupSub: { fontSize: 12, color: C.sub, marginBottom: 14, lineHeight: 17 },
  field:          { marginBottom: 12 },
  fieldLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  fieldLabelText: { fontSize: 12, fontWeight: '700', color: C.text },
  fieldInput:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 11, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12, height: 46 },
  fieldAffix:     { fontSize: 14, color: C.sub, fontWeight: '600', marginHorizontal: 4 },
  fieldTextInput: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },

  // Complete Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, alignItems: 'center' },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 20 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
  modalDesc:     { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  modalSummaryBox:  { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, gap: 6, marginBottom: 16 },
  modalSummaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalSummaryText: { fontSize: 13, color: C.text, fontWeight: '600' },
  modalActions:  { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel:   { flex: 1, height: 50, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  modalCancelText:  { fontSize: 15, fontWeight: '700', color: C.sub },
  modalConfirm:  { flex: 2, height: 50, borderRadius: 13, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

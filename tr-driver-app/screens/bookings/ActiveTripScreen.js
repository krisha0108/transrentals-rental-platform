import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Animated, Linking, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { startTrip, completeTrip } from '../api/client';
import moment from 'moment';

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
function OtpInput({ value, onChange }) {
  const digits = (value + '      ').slice(0, 6).split('');
  const inputRef = useRef(null);
  return (
    <TouchableOpacity style={styles.otpContainer} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="numeric"
        maxLength={6}
        autoComplete="one-time-code"
      />
      <View style={styles.otpBoxRow}>
        {digits.map((d, i) => {
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
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP provided by the customer');
      return;
    }
    setLoading(true);
    try {
      const res = await startTrip(booking.id, otp);
      if (res.data.success) {
        navigation.replace('ActiveTrip', {
          booking: { ...booking, status: 'IN_PROGRESS', tripStartedAt: new Date() },
        });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start trip. Check the OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmComplete() {
    setShowComplete(false);
    setLoading(true);
    try {
      const res = await completeTrip(booking.id, {
        actualKm:       actualKm || null,
        tollCharges:    toll     || null,
        parkingCharges: parking  || null,
      });
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
              {isInProgress ? 'Trip In Progress' : 'Start Trip'}
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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

        {/* ── OTP Entry (DRIVER_ASSIGNED) ── */}
        {!isInProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verify Customer OTP</Text>
            <View style={styles.card}>
              <View style={styles.otpInfoBanner}>
                <View style={styles.otpInfoIcon}>
                  <Ionicons name="shield-checkmark" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.otpInfoTitle}>Enter the 6-digit OTP</Text>
                  <Text style={styles.otpInfoSub}>Ask the customer for the OTP sent to their phone. This confirms you're with the right customer.</Text>
                </View>
              </View>

              <OtpInput value={otp} onChange={setOtp} />

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || otp.length < 6) && { opacity: 0.5 }]}
                onPress={handleStartTrip}
                disabled={loading || otp.length < 6}
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
          </View>
        )}

        {/* ── Complete Trip ── */}
        {isInProgress && (
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
  otpInfoIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  otpInfoTitle:  { fontSize: 13, fontWeight: '800', color: C.primaryDeep },
  otpInfoSub:    { fontSize: 11, color: C.primaryDark, marginTop: 3, lineHeight: 16 },

  otpContainer:  { alignItems: 'center', marginBottom: 20 },
  hiddenInput:   { position: 'absolute', opacity: 0, height: 0, width: 0 },
  otpBoxRow:     { flexDirection: 'row', gap: 9 },
  otpBox:        { width: 44, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  otpBoxFilled:  { borderColor: C.primary, backgroundColor: C.primaryLight },
  otpBoxActive:  { borderColor: C.primary, backgroundColor: '#fff', shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  otpDigit:      { fontSize: 22, fontWeight: '900', color: C.text },
  otpCursor:     { position: 'absolute', bottom: 10, width: 20, height: 2.5, backgroundColor: C.primary, borderRadius: 2 },

  // CTA Button
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, height: 52, marginTop: 6, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnText:{ color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },

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

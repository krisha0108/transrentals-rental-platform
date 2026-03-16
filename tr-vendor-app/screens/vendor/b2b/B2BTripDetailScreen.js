import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getB2BTripDetail, b2bDriverAction, b2bVerifyOtp } from '../../api/client';
import { showError, showSuccess, showConfirm } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#6366F1',
  green: '#10B981', greenL: '#ECFDF5', orange: '#F59E0B', orangeL: '#FFFBEB',
  red: '#EF4444', redL: '#FEF2F2', blue: '#3B82F6', blueL: '#EFF6FF', purple: '#8B5CF6', cyan: '#0891B2',
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: C.orange, bg: C.orangeL },
  DRIVER_ARRIVED: { label: 'Driver Arrived', color: C.cyan, bg: '#ECFEFF' },
  STARTED: { label: 'Trip Started', color: C.blue, bg: C.blueL },
  COMPLETED: { label: 'Completed', color: C.green, bg: C.greenL },
  CANCELLED: { label: 'Cancelled', color: C.red, bg: C.redL },
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BTripDetailScreen({ navigation, route }) {
  const { tripCode } = route.params;
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrip();
    setRefreshing(false);
  }, [fetchTrip]);

  const handleAction = async (action, confirmMsg) => {
    showConfirm('Confirm', confirmMsg, async () => {
      try {
        setActionLoading(true);
        await b2bDriverAction(tripCode, action);
        showSuccess('Action completed successfully');
        fetchTrip();
      } catch (e) {
        showError(e.response?.data?.error || 'Action failed');
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      showError('Please enter a valid 4-digit OTP');
      return;
    }
    try {
      setActionLoading(true);
      await b2bVerifyOtp(tripCode, otp);
      showSuccess('OTP verified! Trip started.');
      setOtp('');
      fetchTrip();
    } catch (e) {
      showError(e.response?.data?.error || 'OTP verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.brand} /></View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color={C.text} /></TouchableOpacity>
          <Text style={s.headerTitle}>Trip Detail</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loadingWrap}>
          <Icon name="alert-circle" size={48} color={C.muted} />
          <Text style={{ fontSize: 16, color: C.muted, marginTop: 12 }}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_CONFIG[trip.status] || { label: trip.status, color: C.muted, bg: '#F1F5F9' };

  // Timeline steps
  const timelineSteps = [
    { label: 'Trip Created', done: true, time: fmt(trip.createdAt), icon: 'plus-circle' },
    { label: 'Driver Arrived', done: ['DRIVER_ARRIVED', 'STARTED', 'COMPLETED'].includes(trip.status), time: trip.driverArrivedAt ? fmt(trip.driverArrivedAt) : null, icon: 'map-pin' },
    { label: 'Trip Started', done: ['STARTED', 'COMPLETED'].includes(trip.status), time: trip.startedAt ? fmt(trip.startedAt) : null, icon: 'play-circle' },
    { label: 'Trip Completed', done: trip.status === 'COMPLETED', time: trip.completedAt ? fmt(trip.completedAt) : null, icon: 'check-circle' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Trip Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[s.statusBanner, { backgroundColor: sc.bg }]}>
          <View style={[s.statusIconWrap, { backgroundColor: sc.color }]}>
            <Icon name={trip.status === 'COMPLETED' ? 'check' : trip.status === 'STARTED' ? 'play' : 'truck'} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: sc.color }]}>{sc.label}</Text>
            <Text style={s.statusCode}>{trip.tripCode}</Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Trip Information</Text>
          <View style={s.infoCard}>
            <InfoRow icon="truck" label="Vehicle" value={`${trip.vehicleName || 'N/A'} ${trip.vehicleNumber ? `(${trip.vehicleNumber})` : ''}`} />
            <InfoRow icon="user" label="Driver" value={`${trip.driverName || 'N/A'} ${trip.driverPhone ? `· ${trip.driverPhone}` : ''}`} />
            <InfoRow icon="map-pin" label="Pickup" value={trip.pickupLocation || trip.booking?.pickupLocation || 'N/A'} />
            <InfoRow icon="flag" label="Drop" value={trip.dropLocation || trip.booking?.dropLocation || 'N/A'} />
            <InfoRow icon="calendar" label="Scheduled" value={`${fmtDate(trip.scheduledDate)}${trip.scheduledTime ? ` · ${trip.scheduledTime}` : ''}`} />
          </View>
        </View>

        {/* Booking Info */}
        {trip.booking && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Booking</Text>
            <View style={s.infoCard}>
              <InfoRow icon="hash" label="Booking #" value={trip.booking.bookingNumber} />
              <InfoRow icon="briefcase" label="Company" value={trip.booking.companyName || 'N/A'} />
              <InfoRow icon="layers" label="Service" value={trip.booking.serviceType || 'N/A'} />
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Trip Progress</Text>
          <View style={s.timeline}>
            {timelineSteps.map((step, i) => (
              <View key={i} style={s.timelineItem}>
                <View style={s.timelineLeft}>
                  <View style={[s.timelineDot, { backgroundColor: step.done ? C.green : C.border }]}>
                    <Icon name={step.icon} size={14} color={step.done ? '#fff' : C.muted} />
                  </View>
                  {i < timelineSteps.length - 1 && (
                    <View style={[s.timelineLine, { backgroundColor: step.done ? C.green : C.border }]} />
                  )}
                </View>
                <View style={s.timelineContent}>
                  <Text style={[s.timelineLabel, !step.done && { color: C.muted }]}>{step.label}</Text>
                  {step.time && <Text style={s.timelineTime}>{step.time}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Driver Actions */}
        {trip.status === 'PENDING' && (
          <View style={s.section}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.cyan }]}
              onPress={() => handleAction('arrive', 'Mark driver as arrived at pickup?')}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Icon name="map-pin" size={18} color="#fff" />
                  <Text style={s.actionBtnText}>Mark Arrived</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {trip.status === 'DRIVER_ARRIVED' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Verify OTP to Start Trip</Text>
            <View style={s.otpCard}>
              {trip.otp && (
                <View style={s.otpDisplay}>
                  <Text style={s.otpLabel}>OTP sent to customer</Text>
                  <Text style={s.otpValue}>{trip.otp}</Text>
                </View>
              )}
              <TextInput
                style={s.otpInput}
                placeholder="Enter 4-digit OTP"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                maxLength={4}
                value={otp}
                onChangeText={setOtp}
              />
              <View style={s.otpActions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: C.brand, flex: 1 }]}
                  onPress={handleVerifyOtp}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Icon name="check-circle" size={18} color="#fff" />
                      <Text style={s.actionBtnText}>Verify & Start</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: C.orange, flex: 0.5 }]}
                  onPress={() => handleAction('resend_otp', 'Resend OTP to customer?')}
                  disabled={actionLoading}
                >
                  <Icon name="refresh-cw" size={16} color="#fff" />
                  <Text style={s.actionBtnText}>Resend</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {trip.status === 'STARTED' && (
          <View style={s.section}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.green }]}
              onPress={() => handleAction('end_trip', 'Mark this trip as completed?')}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Icon name="check-circle" size={18} color="#fff" />
                  <Text style={s.actionBtnText}>End Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <Icon name={icon} size={14} color={C.muted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  scroll: { flex: 1 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14 },
  statusIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  statusCode: { fontSize: 13, color: C.subtext, marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  infoCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: 12, color: C.muted, width: 80 },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  timeline: { backgroundColor: C.surface, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  timelineItem: { flexDirection: 'row', minHeight: 50 },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  timelineLine: { width: 2, flex: 1, marginVertical: 2 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  timelineTime: { fontSize: 11, color: C.muted, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  otpCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  otpDisplay: { alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  otpLabel: { fontSize: 12, color: C.muted },
  otpValue: { fontSize: 32, fontWeight: '800', color: C.brand, letterSpacing: 8, marginTop: 4 },
  otpInput: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: C.text, borderWidth: 1, borderColor: C.border, textAlign: 'center', letterSpacing: 4 },
  otpActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});

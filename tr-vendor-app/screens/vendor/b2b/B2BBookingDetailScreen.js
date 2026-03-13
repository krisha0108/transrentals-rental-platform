import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getB2BOpenBookings, submitB2BQuote } from '../../api/client';
import { showError, showSuccess, showConfirm } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#6366F1',
  green: '#10B981', greenL: '#ECFDF5', orange: '#F59E0B', orangeL: '#FFFBEB',
  red: '#EF4444', redL: '#FEF2F2', blue: '#3B82F6', blueL: '#EFF6FF', purple: '#8B5CF6',
};

const STATUS_CONFIG = {
  OPEN_FOR_QUOTES: { label: 'Open', color: C.green },
  QUOTES_RECEIVED: { label: 'Quotes Received', color: C.blue },
  VENDOR_ASSIGNED: { label: 'Assigned', color: C.purple },
  CONFIRMED: { label: 'Confirmed', color: '#059669' },
  IN_PROGRESS: { label: 'In Progress', color: C.purple },
  COMPLETED: { label: 'Completed', color: '#059669' },
  CANCELLED: { label: 'Cancelled', color: C.red },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BBookingDetailScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Quote form state
  const [totalPrice, setTotalPrice] = useState('');
  const [notes, setNotes] = useState('');

  const fetchBooking = useCallback(async () => {
    try {
      const res = await getB2BOpenBookings(null, { limit: 100 });
      const found = (res.bookings || []).find(b => b.id === bookingId);
      if (found) setBooking(found);
    } catch (e) {
      console.error('Failed to fetch booking detail:', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const hasQuoted = booking?.vendorQuotes?.length > 0;
  const vendorQuote = booking?.vendorQuotes?.[0];
  const isOpen = ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED'].includes(booking?.status);

  const handleSubmitQuote = async () => {
    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      showError('Please enter a valid total price');
      return;
    }

    showConfirm(
      'Submit Quote',
      `Are you sure you want to submit a quote for ₹${parseFloat(totalPrice).toLocaleString('en-IN')}?`,
      async () => {
        try {
          setSubmitting(true);
          await submitB2BQuote({
            bookingId,
            vehicles: [],
            totalPrice: parseFloat(totalPrice),
            notes,
          });
          showSuccess('Quote submitted successfully!');
          fetchBooking();
        } catch (e) {
          showError(e.response?.data?.error || 'Failed to submit quote');
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.brand} /></View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color={C.text} /></TouchableOpacity>
          <Text style={s.headerTitle}>Booking Detail</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loadingWrap}>
          <Icon name="alert-circle" size={48} color={C.muted} />
          <Text style={{ fontSize: 16, color: C.muted, marginTop: 12 }}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_CONFIG[booking.status] || { label: booking.status, color: C.muted };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Booking Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Header */}
        <View style={s.bookingHeader}>
          <View style={s.bookingHeaderTop}>
            <Text style={s.bookingNum}>#{booking.bookingNumber}</Text>
            <View style={[s.badge, { backgroundColor: sc.color + '20' }]}>
              <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <Text style={s.companyName}>{booking.companyName || booking.customer?.companyName || booking.customer?.name || 'N/A'}</Text>
        </View>

        {/* Booking Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Booking Details</Text>
          <View style={s.infoCard}>
            <InfoRow icon="layers" label="Service Type" value={booking.serviceType || 'N/A'} />
            <InfoRow icon="truck" label="Vehicles Needed" value={`${booking.vehiclesRequired || 0}`} />
            <InfoRow icon="navigation" label="Trip Type" value={booking.tripType || 'N/A'} />
            <InfoRow icon="map-pin" label="Pickup" value={booking.pickupLocation || 'N/A'} />
            <InfoRow icon="flag" label="Drop" value={booking.dropLocation || 'N/A'} />
            <InfoRow icon="calendar" label="Scheduled Date" value={fmt(booking.scheduledDate)} />
            {booking.scheduledTime && <InfoRow icon="clock" label="Time" value={booking.scheduledTime} />}
            {booking.notes && <InfoRow icon="file-text" label="Notes" value={booking.notes} />}
          </View>
        </View>

        {/* Vendor's Quote Summary (if already quoted) */}
        {hasQuoted && vendorQuote && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your Quote</Text>
            <View style={[s.infoCard, { borderLeftWidth: 3, borderLeftColor: C.brand }]}>
              <InfoRow icon="hash" label="Quote #" value={vendorQuote.quoteNumber || vendorQuote.id?.slice(0, 8)} />
              <InfoRow icon="check-circle" label="Status" value={vendorQuote.status} />
              {vendorQuote.vehicleCount && <InfoRow icon="truck" label="Vehicles" value={`${vendorQuote.vehicleCount}`} />}
              <InfoRow icon="dollar-sign" label="Total Price" value={`₹${(vendorQuote.totalPrice || 0).toLocaleString('en-IN')}`} highlight />
              <TouchableOpacity
                style={s.viewQuoteBtn}
                onPress={() => navigation.navigate('B2BQuoteDetail', { quoteId: vendorQuote.id })}
              >
                <Text style={s.viewQuoteBtnText}>View Full Quote</Text>
                <Icon name="arrow-right" size={14} color={C.brand} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quote Submission Form (if open and not quoted) */}
        {isOpen && !hasQuoted && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Submit Quote</Text>
            <View style={s.formCard}>
              <Text style={s.formLabel}>Total Price (₹)</Text>
              <TextInput
                style={s.input}
                placeholder="Enter total price"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                value={totalPrice}
                onChangeText={setTotalPrice}
              />

              <Text style={s.formLabel}>Notes (optional)</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="Add any notes about your quote..."
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                style={[s.submitBtn, submitting && s.submitBtnDisabled]}
                onPress={handleSubmitQuote}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="send" size={18} color="#fff" />
                    <Text style={s.submitBtnText}>Submit Quote</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, highlight }) {
  return (
    <View style={s.infoRow}>
      <Icon name={icon} size={14} color={C.muted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, highlight && { color: C.brand, fontWeight: '700', fontSize: 16 }]} numberOfLines={2}>{value}</Text>
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
  bookingHeader: { backgroundColor: C.brand, padding: 20, paddingTop: 16 },
  bookingHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingNum: { fontSize: 16, fontWeight: '700', color: '#fff' },
  companyName: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  infoCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: 12, color: C.muted, width: 100 },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  viewQuoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, backgroundColor: C.brand + '10', borderRadius: 10 },
  viewQuoteBtnText: { fontSize: 14, fontWeight: '600', color: C.brand },
  formCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  formLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brand, borderRadius: 12, paddingVertical: 14, marginTop: 20 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

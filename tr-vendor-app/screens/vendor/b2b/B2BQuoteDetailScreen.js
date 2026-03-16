import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getB2BMyQuotes } from '../../api/client';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#6366F1',
  green: '#10B981', greenL: '#ECFDF5', orange: '#F59E0B', orangeL: '#FFFBEB',
  red: '#EF4444', redL: '#FEF2F2', blue: '#3B82F6', blueL: '#EFF6FF', purple: '#8B5CF6',
};

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', color: C.orange, bg: C.orangeL, icon: 'clock' },
  UNDER_REVIEW: { label: 'Under Review', color: C.blue, bg: C.blueL, icon: 'eye' },
  CONFIRMED: { label: 'Confirmed', color: C.green, bg: C.greenL, icon: 'check-circle' },
  REJECTED: { label: 'Rejected', color: C.red, bg: C.redL, icon: 'x-circle' },
  WITHDRAWN: { label: 'Withdrawn', color: C.muted, bg: '#F1F5F9', icon: 'minus-circle' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

export default function B2BQuoteDetailScreen({ navigation, route }) {
  const { quoteId } = route.params;
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await getB2BMyQuotes(null, { limit: 100 });
      const found = (res.quotes || []).find(q => q.id === quoteId);
      if (found) setQuote(found);
    } catch (e) {
      console.error('Failed to fetch quote:', e);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuote();
    setRefreshing(false);
  }, [fetchQuote]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.brand} /></View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color={C.text} /></TouchableOpacity>
          <Text style={s.headerTitle}>Quote Detail</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loadingWrap}>
          <Icon name="alert-circle" size={48} color={C.muted} />
          <Text style={{ fontSize: 16, color: C.muted, marginTop: 12 }}>Quote not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_CONFIG[quote.status] || { label: quote.status, color: C.muted, bg: '#F1F5F9', icon: 'help-circle' };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Quote Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[s.statusBanner, { backgroundColor: sc.bg }]}>
          <Icon name={sc.icon} size={24} color={sc.color} />
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: sc.color }]}>{sc.label}</Text>
            <Text style={s.statusNum}>Quote #{quote.quoteNumber}</Text>
          </View>
          <Text style={[s.statusPrice, { color: sc.color }]}>₹{(quote.totalPrice || 0).toLocaleString('en-IN')}</Text>
        </View>

        {/* Booking Reference */}
        {quote.booking && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Booking Reference</Text>
            <View style={s.infoCard}>
              <InfoRow icon="hash" label="Booking #" value={quote.booking.bookingNumber} />
              <InfoRow icon="briefcase" label="Company" value={quote.booking.companyName || 'N/A'} />
              <InfoRow icon="layers" label="Service" value={quote.booking.serviceType || 'N/A'} />
              <InfoRow icon="map-pin" label="Pickup" value={quote.booking.pickupLocation || 'N/A'} />
              <InfoRow icon="flag" label="Drop" value={quote.booking.dropLocation || 'N/A'} />
              <InfoRow icon="calendar" label="Date" value={fmt(quote.booking.scheduledDate)} />
            </View>
          </View>
        )}

        {/* Vehicles & Drivers */}
        {quote.quoteVehicles?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Vehicles & Drivers ({quote.quoteVehicles.length})</Text>
            {quote.quoteVehicles.map((qv, i) => (
              <View key={qv.id || i} style={s.vehicleCard}>
                <View style={s.vehicleHeader}>
                  <Icon name="truck" size={16} color={C.brand} />
                  <Text style={s.vehicleName}>
                    {qv.vehicle?.vehicle_models?.name || qv.vehicle?.vehicleName || qv.vehicleName || `Vehicle ${i + 1}`}
                  </Text>
                </View>
                {qv.vehicle?.registrationNumber && (
                  <Text style={s.vehicleReg}>{qv.vehicle.registrationNumber}</Text>
                )}
                {qv.driver && (
                  <View style={s.driverRow}>
                    <Icon name="user" size={13} color={C.muted} />
                    <Text style={s.driverText}>{qv.driver.name} · {qv.driver.phone}</Text>
                  </View>
                )}
                {qv.basePrice > 0 && (
                  <View style={s.pricingRow}>
                    <Text style={s.pricingLabel}>Base Price</Text>
                    <Text style={s.pricingValue}>₹{qv.basePrice.toLocaleString('en-IN')}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Pricing Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pricing</Text>
          <View style={s.infoCard}>
            <InfoRow icon="dollar-sign" label="Total Price" value={`₹${(quote.totalPrice || 0).toLocaleString('en-IN')}`} highlight />
            <InfoRow icon="truck" label="Vehicles" value={`${quote.vehicleCount || quote.quoteVehicles?.length || 0}`} />
            {quote.pricePerVehicle > 0 && <InfoRow icon="tag" label="Per Vehicle" value={`₹${quote.pricePerVehicle.toLocaleString('en-IN')}`} />}
            <InfoRow icon="calendar" label="Submitted" value={fmt(quote.createdAt)} />
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notes</Text>
            <View style={s.infoCard}>
              <Text style={s.notesText}>{quote.notes}</Text>
            </View>
          </View>
        )}

        {/* View Trips (if confirmed) */}
        {quote.status === 'CONFIRMED' && (
          <View style={s.section}>
            <TouchableOpacity style={s.tripsBtn} onPress={() => navigation.navigate('B2BTrips')}>
              <Icon name="truck" size={20} color="#fff" />
              <Text style={s.tripsBtnText}>View Trips</Text>
            </TouchableOpacity>
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
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14 },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  statusNum: { fontSize: 12, color: C.subtext, marginTop: 2 },
  statusPrice: { fontSize: 20, fontWeight: '800' },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  infoCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: 12, color: C.muted, width: 90 },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  vehicleCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, borderLeftWidth: 3, borderLeftColor: C.brand },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleName: { fontSize: 14, fontWeight: '600', color: C.text },
  vehicleReg: { fontSize: 12, color: C.subtext, marginLeft: 24, marginTop: 2 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: 24 },
  driverText: { fontSize: 12, color: C.subtext },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  pricingLabel: { fontSize: 12, color: C.muted },
  pricingValue: { fontSize: 13, fontWeight: '600', color: C.text },
  notesText: { fontSize: 14, color: C.subtext, lineHeight: 20 },
  tripsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brand, borderRadius: 12, paddingVertical: 14 },
  tripsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

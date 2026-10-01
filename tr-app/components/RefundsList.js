import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../screens/api';
import RefundStatusCard from './RefundStatusCard';

// Every refund raised for the signed-in customer's cancelled bookings, newest
// first, each with its live status card — the app version of the website
// dashboard's refunds list. Renders nothing when there are none.

const SERVICE_LABELS = {
  car_bookings: 'Self Drive',
  bike_bookings: 'Bike Rental',
  bus_bookings: 'Bus & Tempo',
  truck_bookings: 'Truck',
  packers_bookings: 'Packers & Movers',
  luxury_bookings: 'Luxury Car',
  equipment_bookings: 'Equipment Rental',
  chauffeur_bookings: 'Car with Driver',
};

export default function RefundsList({ refreshKey, style }) {
  const [refunds, setRefunds] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const customerId = await AsyncStorage.getItem('customer_id');
        if (!customerId) return;
        const res = await api.get('/customer/refunds', { params: { customer_id: customerId } });
        if (alive) setRefunds(Array.isArray(res.data?.refunds) ? res.data.refunds : []);
      } catch {
        // No refunds panel is better than an error here.
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  if (refunds.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Refunds</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{refunds.length}</Text></View>
      </View>
      {refunds.map((r) => (
        <View key={`${r.source}-${r.bookingId}`} style={styles.item}>
          <Text style={styles.meta}>
            {SERVICE_LABELS[r.source] || r.serviceType || 'Booking'}
            {r.bookingNumber ? `  ·  #${r.bookingNumber}` : ''}
            {r.raisedAt ? `  ·  ${new Date(r.raisedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </Text>
          <RefundStatusCard source={r.source} bookingId={r.bookingId} refreshKey={refreshKey} style={styles.card} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: '#111827' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  item: { marginTop: 10 },
  meta: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  card: { marginHorizontal: 0, marginTop: 4 },
});

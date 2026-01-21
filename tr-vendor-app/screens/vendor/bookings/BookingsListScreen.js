import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

export default function BookingsListScreen({ navigation }) {
  const services = [
    { id: 'bike', name: 'Bike Rental', icon: 'motorbike', color: '#EF4444', screen: 'BikeBookings' },
    { id: 'car', name: 'Car Rental', icon: 'car', color: '#10B981', screen: 'CarRentalBookings' },
    { id: 'bus', name: 'Bus Rental', icon: 'bus', color: '#3B82F6', screen: 'BusBookings' },
    { id: 'truck', name: 'Truck Rental', icon: 'truck-delivery', color: '#F59E0B', screen: 'TruckBookings' },
    { id: 'luxury', name: 'Luxury Car', icon: 'car-sports', color: '#8B5CF6', screen: 'LuxuryBookings' },
    { id: 'packers', name: 'Packers & Movers', icon: 'package-variant', color: '#EC4899', screen: 'PackersBookings' },
    { id: 'equipment', name: 'Equipment Rental', icon: 'hammer-wrench', color: '#F97316', screen: 'EquipmentBookings' },
    { id: 'self-drive', name: 'Self Drive', icon: 'car-side', color: '#06B6D4', screen: 'SelfDriveBookings' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Bookings</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Select a service to view bookings</Text>
        
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceCard, { borderLeftColor: service.color }]}
            onPress={() => navigation.navigate(service.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: service.color }]}>
              <MaterialCommunityIcons name={service.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK,
  },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom navigation bar
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
  },
});

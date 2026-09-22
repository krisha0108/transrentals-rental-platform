import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Alert } from '../../components/ui/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFleet, deleteVehicle } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6',
};

function docStatus(expiry) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days <= 0)  return { label: 'Expired',     color: C.danger,  bg: '#FEF2F2', urgent: true };
  if (days <= 7)  return { label: `${days}d`,     color: C.danger,  bg: '#FEF2F2', urgent: true };
  if (days <= 30) return { label: `${days}d`,     color: C.warn,    bg: '#FFFBEB', urgent: false };
  if (days <= 60) return { label: `${days}d`,     color: '#D97706', bg: '#FEF9C3', urgent: false };
  return null;
}

function VehicleCard({ item, onPress, onDelete }) {
  const ins  = docStatus(item.insuranceExpiry);
  const rc   = docStatus(item.rcExpiry);
  const fit  = docStatus(item.fitnessExpiry);
  const per  = docStatus(item.permitExpiry);

  const warnings = [
    ins  && { name: 'Insurance', ...ins },
    rc   && { name: 'RC',        ...rc },
    fit  && { name: 'Fitness',   ...fit },
    per  && { name: 'Permit',    ...per },
  ].filter(Boolean);

  const hasUrgent = warnings.some(w => w.urgent);
  const hasWarn   = !hasUrgent && warnings.length > 0;

  const accentColor = !item.isActive ? C.sub
    : hasUrgent ? C.danger
    : hasWarn   ? C.warn
    : C.primary;

  const chips = [
    item.category        && { icon: 'car-sport-outline',    label: item.category },
    item.fuelType        && { icon: 'flash-outline',         label: item.fuelType },
    item.seatingCapacity && { icon: 'people-outline',        label: `${item.seatingCapacity} seats` },
    item.color           && { icon: 'color-palette-outline', label: item.color },
    item.year            && { icon: 'calendar-outline',      label: String(item.year) },
  ].filter(Boolean);

  return (
    <TouchableOpacity
      style={[styles.card, !item.isActive && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.cardInner}>
        {/* Row 1: icon + name + reg + actions */}
        <View style={styles.cardTop}>
          <View style={[styles.carIcon, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name="car" size={22} color={accentColor} />
          </View>

          <View style={{ flex: 1, marginLeft: 11 }}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {item.make} {item.model}
            </Text>
            <View style={styles.regRow}>
              <View style={styles.regPlate}>
                <Text style={styles.regText}>{item.registrationNo || 'No Reg.'}</Text>
              </View>
              {!item.isActive && (
                <View style={styles.inactivePill}>
                  <Text style={styles.inactivePillText}>Inactive</Text>
                </View>
              )}
              {item.isVendorVehicle && (
                <View style={styles.vendorPill}>
                  <Ionicons name="business-outline" size={9} color="#0369A1" />
                  <Text style={styles.vendorPillText}>Vendor</Text>
                </View>
              )}
            </View>
          </View>

          {!item.isVendorVehicle && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={C.danger} />
            </TouchableOpacity>
          )}
        </View>

        {/* Row 2: meta chips */}
        {chips.length > 0 && (
          <View style={styles.chipsRow}>
            {chips.map((c, i) => (
              <View key={i} style={styles.chip}>
                <Ionicons name={c.icon} size={10} color={C.sub} />
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Row 3: doc warnings */}
        {warnings.length > 0 && (
          <View style={styles.warningsRow}>
            {warnings.map((w, i) => (
              <View key={i} style={[styles.warnBadge, { backgroundColor: w.bg }]}>
                <Ionicons
                  name={w.urgent ? 'warning' : 'alert-circle-outline'}
                  size={10}
                  color={w.color}
                />
                <Text style={[styles.warnText, { color: w.color }]}>
                  {w.name} · {w.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Row 4: service info */}
        {item.nextServiceDate && (
          <View style={styles.serviceRow}>
            <Ionicons name="construct-outline" size={11} color={C.sub} />
            <Text style={styles.serviceText}>
              Next service: {moment(item.nextServiceDate).format('DD MMM YYYY')}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerHint}>Tap to view details</Text>
          <View style={styles.footerArrow}>
            <Ionicons name="chevron-forward" size={13} color={accentColor} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FleetListScreen({ navigation }) {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getFleet();
      setVehicles(res.data.vehicles || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function confirmDelete(vehicle) {
    Alert.alert(
      'Delete Vehicle',
      `Remove ${vehicle.make} ${vehicle.model} from your fleet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteVehicle(vehicle.id);
            setVehicles(v => v.filter(x => x.id !== vehicle.id));
          } catch {
            Alert.alert('Error', 'Failed to delete vehicle');
          }
        }},
      ]
    );
  }

  const active   = vehicles.filter(v => v.isActive).length;
  const inactive = vehicles.filter(v => !v.isActive).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <LinearGradient
        colors={['#043927', '#065F46', '#16A34A']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>My Fleet</Text>
          {vehicles.length > 0 && (
            <Text style={styles.headerSub}>
              {active} active{inactive > 0 ? ` · ${inactive} inactive` : ''}
            </Text>
          )}
        </View>
        {vehicles.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{vehicles.length}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddVehicle')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Vehicle</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <VehicleCard
              item={item}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
              onDelete={() => confirmDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="car-outline" size={42} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptySub}>Add your first vehicle to start accepting bookings</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddVehicle')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={17} color="#fff" />
                <Text style={styles.emptyBtnText}>Add First Vehicle</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10 },
  headerLabel:   { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  countPill:     { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 5 },
  countPillText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 },
  addBtnText:    { color: '#fff', fontSize: 12, fontWeight: '700' },

  list: { padding: 14, gap: 11 },

  // Card
  card:        { backgroundColor: C.card, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardInactive:{ opacity: 0.6 },
  accentBar:   { width: 4, flexShrink: 0 },
  cardInner:   { flex: 1, padding: 13 },

  cardTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  carIcon:     { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  vehicleName: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 4 },
  regRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  regPlate:    { backgroundColor: '#F1F5F9', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  regText:     { fontSize: 11, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  inactivePill:{ backgroundColor: '#FEF2F2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  inactivePillText: { fontSize: 9, color: C.danger, fontWeight: '800' },
  vendorPill:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  vendorPillText: { fontSize: 9, color: '#0369A1', fontWeight: '800' },
  deleteBtn:   { padding: 5 },

  chipsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  chipText:  { fontSize: 10, color: C.sub, fontWeight: '500' },

  warningsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  warnBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  warnText:    { fontSize: 10, fontWeight: '700' },

  serviceRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  serviceText: { fontSize: 11, color: C.sub },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9, borderTopWidth: 1, borderTopColor: C.border },
  footerHint:  { fontSize: 11, color: C.sub },
  footerArrow: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  // Empty
  empty:      { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyIcon:  { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  emptySub:   { fontSize: 13, color: C.sub, textAlign: 'center', maxWidth: 240 },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

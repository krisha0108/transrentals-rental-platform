import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { assignVehicle, getFleet } from '../api/client';

const BRAND = {
  primary: '#16A34A', primaryDark: '#15803D', primaryLight: '#DCFCE7',
  accent: '#F59E0B',
  bg: '#F0F4F8', card: '#FFFFFF',
  border: '#E2E8F0', text: '#0F172A', subText: '#64748B',
  success: '#10B981', danger: '#EF4444',
};

function FuelBadge({ type }) {
  const map = {
    petrol: { color: '#F97316', bg: '#FFF7ED', icon: 'flame' },
    diesel: { color: '#3B82F6', bg: '#EFF6FF', icon: 'water' },
    cng: { color: '#10B981', bg: '#ECFDF5', icon: 'leaf' },
    electric: { color: '#8B5CF6', bg: '#F5F3FF', icon: 'flash' },
  };
  const key = (type || '').toLowerCase();
  const cfg = map[key] || { color: BRAND.subText, bg: '#F8FAFC', icon: 'ellipse' };
  return (
    <View style={[fuelStyles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={10} color={cfg.color} />
      <Text style={[fuelStyles.text, { color: cfg.color }]}>{type || 'N/A'}</Text>
    </View>
  );
}
const fuelStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});

export default function AssignVehicleScreen({ route, navigation }) {
  const { booking } = route.params;
  const [fleet, setFleet] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [manualVehicleNo, setManualVehicleNo] = useState('');
  const [manualVehicleModel, setManualVehicleModel] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getFleet(true)
      .then(res => setFleet(res.data.vehicles?.filter(v => v.isActive !== false) || []))
      .catch(() => {})
      .finally(() => setLoadingFleet(false));
  }, []);

  const selectedVehicle = fleet.find(v => v.id === selectedVehicleId);

  function onPressAssign() {
    if (!useManual && !selectedVehicleId) {
      Alert.alert('Select Vehicle', 'Please select a vehicle from your fleet or switch to manual entry.');
      return;
    }
    if (useManual && !manualVehicleNo.trim()) {
      Alert.alert('Required', 'Please enter the vehicle registration number.');
      return;
    }
    setShowConfirm(true);
  }

  async function confirmAssign() {
    setShowConfirm(false);
    setLoading(true);
    try {
      const data = useManual
        ? { vehicleNumber: manualVehicleNo.trim().toUpperCase(), vehicleModel: manualVehicleModel.trim() }
        : { vehicleId: selectedVehicleId };

      const res = await assignVehicle(booking.id, data);
      if (res.data.success) {
        navigation.navigate('BookingDetail', { booking: { ...booking, status: 'DRIVER_ASSIGNED' } });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to assign vehicle');
    } finally {
      setLoading(false);
    }
  }

  const confirmLabel = useManual
    ? manualVehicleNo.trim().toUpperCase() || 'Manual Entry'
    : selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={BRAND.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Assign Vehicle</Text>
          <Text style={styles.headerSub}>{booking.bookingNumber}</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 2/3</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="navigate" size={20} color={BRAND.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Trip Route</Text>
              <Text style={styles.summaryRoute} numberOfLines={1}>
                {booking.pickupCity || 'Pickup'}{booking.dropCity ? ` → ${booking.dropCity}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={BRAND.subText} />
              <Text style={styles.metaText}>
                {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </Text>
            </View>
            {booking.pickupTime ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={BRAND.subText} />
                <Text style={styles.metaText}>{booking.pickupTime}</Text>
              </View>
            ) : null}
            {booking.carCategoryName ? (
              <View style={styles.metaItem}>
                <Ionicons name="car-sport-outline" size={13} color={BRAND.subText} />
                <Text style={styles.metaText}>{booking.carCategoryName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Section heading */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Choose Vehicle</Text>
          <Text style={styles.sectionSub}>Select from fleet or enter manually</Text>
        </View>

        {/* Mode tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, !useManual && styles.tabActive]}
            onPress={() => setUseManual(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="car" size={17} color={!useManual ? '#fff' : BRAND.subText} />
            <Text style={[styles.tabText, !useManual && styles.tabTextActive]}>My Fleet</Text>
            {fleet.length > 0 && !useManual && (
              <View style={styles.tabCount}>
                <Text style={styles.tabCountText}>{fleet.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, useManual && styles.tabActive]}
            onPress={() => setUseManual(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={17} color={useManual ? '#fff' : BRAND.subText} />
            <Text style={[styles.tabText, useManual && styles.tabTextActive]}>Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* ── Fleet List ── */}
        {!useManual && (
          <View style={styles.section}>
            {loadingFleet ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={BRAND.primary} size="large" />
                <Text style={styles.loadingText}>Loading your vehicles...</Text>
              </View>
            ) : fleet.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="car-outline" size={36} color={BRAND.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Vehicles Found</Text>
                <Text style={styles.emptyDesc}>You haven't added any vehicles yet. Use manual entry to proceed.</Text>
                <TouchableOpacity style={styles.switchBtn} onPress={() => setUseManual(true)}>
                  <Ionicons name="create-outline" size={15} color={BRAND.primary} />
                  <Text style={styles.switchBtnText}>Switch to Manual Entry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              fleet.map(v => {
                const selected = selectedVehicleId === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                    onPress={() => setSelectedVehicleId(v.id)}
                    activeOpacity={0.85}
                  >
                    {/* Selection indicator */}
                    <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>

                    {/* Vehicle icon */}
                    <View style={[styles.vehicleIconBox, selected && { backgroundColor: BRAND.primaryLight }]}>
                      <Ionicons name="car-sport" size={26} color={selected ? BRAND.primary : '#94A3B8'} />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vehicleName, selected && { color: BRAND.primaryDark }]}>
                        {v.make} {v.model}
                      </Text>
                      <View style={styles.vehicleRegRow}>
                        <View style={styles.regPlate}>
                          <Text style={styles.regText}>{v.registrationNo || 'No Reg.'}</Text>
                        </View>
                        {v.fuelType && <FuelBadge type={v.fuelType} />}
                      </View>
                      {(v.category || v.seatingCapacity) ? (
                        <View style={styles.vehicleChips}>
                          {v.category && (
                            <View style={styles.chip}>
                              <Text style={styles.chipText}>{v.category}</Text>
                            </View>
                          )}
                          {v.seatingCapacity && (
                            <View style={styles.chip}>
                              <Ionicons name="people-outline" size={10} color={BRAND.subText} />
                              <Text style={styles.chipText}>{v.seatingCapacity} seats</Text>
                            </View>
                          )}
                          {v.year && (
                            <View style={styles.chip}>
                              <Text style={styles.chipText}>{v.year}</Text>
                            </View>
                          )}
                        </View>
                      ) : null}
                    </View>

                    {selected && (
                      <Ionicons name="checkmark-circle" size={24} color={BRAND.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ── Manual Entry ── */}
        {useManual && (
          <View style={styles.section}>
            <View style={styles.manualCard}>
              <View style={styles.manualHeader}>
                <Ionicons name="document-text-outline" size={18} color={BRAND.primary} />
                <Text style={styles.manualHeaderText}>Vehicle Details</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registration Number <Text style={{ color: BRAND.danger }}>*</Text></Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="id-card-outline" size={17} color={BRAND.subText} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MH 12 AB 1234"
                    value={manualVehicleNo}
                    onChangeText={setManualVehicleNo}
                    autoCapitalize="characters"
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Model <Text style={styles.optionalTag}>(optional)</Text></Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="car-outline" size={17} color={BRAND.subText} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Maruti Swift Dzire"
                    value={manualVehicleModel}
                    onChangeText={setManualVehicleModel}
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
              </View>

              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={15} color={BRAND.accent} />
                <Text style={styles.infoNoteText}>
                  The registration number will be shared with the customer as the assigned vehicle.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {(selectedVehicleId || (useManual && manualVehicleNo.trim())) ? (
          <View style={styles.footerSelectedInfo}>
            <Ionicons name="car-sport" size={15} color={BRAND.primary} />
            <Text style={styles.footerSelectedText} numberOfLines={1}>
              {useManual ? manualVehicleNo.trim().toUpperCase() : `${selectedVehicle?.make} ${selectedVehicle?.model}`}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.assignBtn, loading && { opacity: 0.65 }]}
          onPress={onPressAssign}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.assignBtnText}>Confirm & Assign Vehicle</Text>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalIconWrap}>
              <Ionicons name="car-sport" size={32} color={BRAND.primary} />
            </View>
            <Text style={styles.modalTitle}>Confirm Assignment</Text>
            <Text style={styles.modalDesc}>
              You are assigning <Text style={{ fontWeight: '700', color: BRAND.text }}>{confirmLabel}</Text> to booking <Text style={{ fontWeight: '700', color: BRAND.primary }}>{booking.bookingNumber}</Text>.
            </Text>
            <Text style={styles.modalNote}>
              An OTP will be generated and the customer will be notified.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmAssign}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Assign Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1, borderBottomColor: BRAND.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: BRAND.text },
  headerSub: { fontSize: 12, color: BRAND.subText, fontWeight: '500', marginTop: 1 },
  stepBadge: { backgroundColor: BRAND.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepText: { fontSize: 11, fontWeight: '700', color: BRAND.primary },

  scroll: { flex: 1 },

  // Summary Card
  summaryCard: {
    margin: 16, marginBottom: 0,
    backgroundColor: BRAND.card,
    borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
    borderWidth: 1, borderColor: BRAND.border,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  summaryIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: BRAND.primaryLight, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: BRAND.subText, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRoute: { fontSize: 16, fontWeight: '800', color: BRAND.text, marginTop: 2 },
  summaryDivider: { height: 1, backgroundColor: BRAND.border, marginHorizontal: 16 },
  summaryMeta: { flexDirection: 'row', gap: 16, padding: 12, paddingHorizontal: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: BRAND.subText, fontWeight: '500' },

  // Section heading
  sectionHead: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: BRAND.text },
  sectionSub: { fontSize: 12, color: BRAND.subText, marginTop: 2 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: BRAND.border,
    backgroundColor: BRAND.card,
  },
  tabActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: BRAND.subText },
  tabTextActive: { color: '#fff' },
  tabCount: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  section: { paddingHorizontal: 16 },

  // Loading / Empty
  loadingBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 14, color: BRAND.subText, fontWeight: '500' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: BRAND.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: BRAND.text },
  emptyDesc: { fontSize: 13, color: BRAND.subText, textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: BRAND.primary, backgroundColor: BRAND.primaryLight },
  switchBtnText: { fontSize: 13, fontWeight: '700', color: BRAND.primary },

  // Vehicle card
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BRAND.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  vehicleCardSelected: { borderColor: BRAND.primary, backgroundColor: '#F0FDF4' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BRAND.border, justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: BRAND.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.primary },
  vehicleIconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '800', color: BRAND.text },
  vehicleRegRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  regPlate: { backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  regText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  vehicleChips: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  chipText: { fontSize: 10, fontWeight: '600', color: BRAND.subText },

  // Manual entry
  manualCard: {
    backgroundColor: BRAND.card, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: BRAND.border,
  },
  manualHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  manualHeaderText: { fontSize: 15, fontWeight: '800', color: BRAND.text },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: BRAND.text, marginBottom: 7 },
  optionalTag: { fontSize: 11, color: BRAND.subText, fontWeight: '500' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: BRAND.border,
    height: 48, paddingRight: 12,
  },
  inputIcon: { width: 44, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: BRAND.text },
  infoNote: { flexDirection: 'row', gap: 8, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A', alignItems: 'flex-start', marginTop: 4 },
  infoNoteText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17, fontWeight: '500' },

  // Footer
  footer: {
    padding: 16, paddingBottom: 20,
    backgroundColor: BRAND.card,
    borderTopWidth: 1, borderTopColor: BRAND.border,
    gap: 10,
  },
  footerSelectedInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: BRAND.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  footerSelectedText: { flex: 1, fontSize: 12, fontWeight: '700', color: BRAND.primaryDark },
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BRAND.primary, borderRadius: 14, height: 54,
    shadowColor: BRAND.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  assignBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Confirm Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: BRAND.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, alignItems: 'center',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BRAND.border, marginBottom: 20 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: BRAND.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: BRAND.text, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: BRAND.subText, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  modalNote: { fontSize: 12, color: BRAND.subText, textAlign: 'center', lineHeight: 18, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, width: '100%', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, height: 50, borderRadius: 13, borderWidth: 1.5, borderColor: BRAND.border, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: BRAND.subText },
  modalConfirm: { flex: 2, height: 50, borderRadius: 13, backgroundColor: BRAND.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

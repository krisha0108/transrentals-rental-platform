import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  updateVehicle, uploadVehiclePhoto, deleteVehiclePhoto, getBaseURL,
  getVehicle, deleteFuelLog, deleteIncident, deleteMaintenanceLog,
} from '../api/client';
import moment from 'moment';

const BRAND = {
  primary: '#16A34A', bg: '#F0F4F8', card: '#FFFFFF',
  border: '#E2EAF4', text: '#0F172A', subText: '#64748B',
};

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const PHOTO_SLOTS = [
  { key: 'photoFront',     type: 'front',     label: 'Front' },
  { key: 'photoBack',      type: 'back',      label: 'Back' },
  { key: 'photoLeftSide',  type: 'leftSide',  label: 'Left Side' },
  { key: 'photoRightSide', type: 'rightSide', label: 'Right Side' },
  { key: 'photoInterior',  type: 'interior',  label: 'Interior' },
];

function DocPhotoRow({ label, url, type, onPress, uploading, baseURL }) {
  const fullUrl = url ? (url.startsWith('http') ? url : `${baseURL}${url}`) : null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      {fullUrl ? (
        <Image source={{ uri: fullUrl }} style={{ width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2EAF4' }} resizeMode="cover" />
      ) : null}
      <TouchableOpacity
        onPress={() => onPress(type)}
        disabled={!!uploading}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#F0FDF4', opacity: uploading === type ? 0.5 : 1 }}
      >
        {uploading === type
          ? <ActivityIndicator size="small" color="#16A34A" />
          : <Ionicons name="camera-outline" size={15} color="#16A34A" />
        }
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#16A34A' }}>{url ? `Replace ${label}` : `Upload ${label}`}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function InputBox(props) {
  return <TextInput style={styles.input} placeholderTextColor={BRAND.subText} {...props} />;
}

function formatDate(d) {
  if (!d) return 'Select date';
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
}

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export default function EditVehicleScreen({ route, navigation }) {
  const { vehicleId, vehicle: v } = route.params;
  const isVendorVehicle = !!(v.isVendorVehicle || v.staffId);

  const [loading, setLoading] = useState(false);
  const [make, setMake] = useState(v.make || '');
  const [model, setModel] = useState(v.model || '');
  const [year, setYear] = useState(v.year ? String(v.year) : '');
  const [regNo, setRegNo] = useState(v.registrationNo || '');
  const [color, setColor] = useState(v.color || '');
  const [category, setCategory] = useState(v.category || '');
  const [seats, setSeats] = useState(v.seatingCapacity ? String(v.seatingCapacity) : '');
  const [fuel, setFuel] = useState(v.fuelType || '');
  const [odometer, setOdometer] = useState(v.currentOdometer ? String(v.currentOdometer) : '');
  const [insuranceNumber, setInsuranceNumber] = useState(v.insuranceNumber || '');
  const [rcNumber, setRcNumber] = useState(v.rcNumber || '');

  const [insuranceExp, setInsuranceExp] = useState(toDate(v.insuranceExpiry));
  const [rcExp, setRcExp] = useState(toDate(v.rcExpiry));
  const [fitnessExp, setFitnessExp] = useState(toDate(v.fitnessExpiry));
  const [permitExp, setPermitExp] = useState(toDate(v.permitExpiry));
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [docPhotos, setDocPhotos] = useState({
    insurance: v.insuranceDocument || null,
    rc:        v.rcDocument        || null,
    fitness:   v.fitnessDocument   || null,
    permit:    v.permitDocument    || null,
  });
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [vehiclePhotos, setVehiclePhotos] = useState({
    photoFront:     v.photoFront     || null,
    photoBack:      v.photoBack      || null,
    photoLeftSide:  v.photoLeftSide  || null,
    photoRightSide: v.photoRightSide || null,
    photoInterior:  v.photoInterior  || null,
  });
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [baseURL, setBaseURL] = useState('');

  const [maintenanceLogs, setMaintenanceLogs] = useState(v.maintenance_logs || []);
  const [fuelLogs, setFuelLogs] = useState(v.fuel_logs || []);
  const [incidents, setIncidents] = useState(v.incidents || []);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => { getBaseURL().then(b => setBaseURL(b)); }, []);

  useFocusEffect(useCallback(() => {
    async function reloadLogs() {
      setLogsLoading(true);
      try {
        const res = await getVehicle(vehicleId);
        if (res.data?.vehicle) {
          const vd = res.data.vehicle;
          setMaintenanceLogs(vd.maintenance_logs || []);
          setFuelLogs(vd.fuel_logs || []);
          setIncidents(vd.incidents || []);
        }
      } catch {}
      setLogsLoading(false);
    }
    reloadLogs();
  }, [vehicleId]));

  async function handleDeleteFuelLog(logId) {
    Alert.alert('Delete Entry', 'Remove this fuel log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteFuelLog(vehicleId, logId);
          setFuelLogs(prev => prev.filter(l => l.id !== logId));
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  }

  async function handleDeleteIncident(incidentId) {
    Alert.alert('Delete Incident', 'Remove this incident report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteIncident(vehicleId, incidentId);
          setIncidents(prev => prev.filter(i => i.id !== incidentId));
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  }

  const dateFields = { insuranceExp, rcExp, fitnessExp, permitExp };
  const setDateFields = { insuranceExp: setInsuranceExp, rcExp: setRcExp, fitnessExp: setFitnessExp, permitExp: setPermitExp };

  async function pickVehiclePhoto(slotType, fieldKey) {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingSlot(slotType);
    try {
      const res = await uploadVehiclePhoto(vehicleId, asset.uri, asset.fileName || 'photo.jpg', asset.type || 'image/jpeg', slotType);
      if (res.data.success) setVehiclePhotos(p => ({ ...p, [fieldKey]: res.data.url }));
      else Alert.alert('Error', res.data.error || 'Upload failed');
    } catch (err) {
      Alert.alert('Upload Failed', err?.response?.data?.error || err?.message || 'Failed to upload photo');
    }
    setUploadingSlot(null);
  }

  async function removeVehiclePhoto(slotType, fieldKey) {
    Alert.alert('Remove Photo', 'Delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteVehiclePhoto(vehicleId, null, slotType);
          setVehiclePhotos(p => ({ ...p, [fieldKey]: null }));
        } catch { Alert.alert('Error', 'Failed to remove photo'); }
      }},
    ]);
  }

  async function pickDocPhoto(type) {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingDoc(type);
    try {
      const res = await uploadVehiclePhoto(vehicleId, asset.uri, asset.fileName || 'doc.jpg', asset.type || 'image/jpeg', type);
      if (res.data.success) setDocPhotos(p => ({ ...p, [type]: res.data.url }));
      else Alert.alert('Error', res.data.error || 'Upload failed');
    } catch (err) {
      Alert.alert('Upload Failed', err?.response?.data?.error || err?.message || 'Failed to upload photo');
    }
    setUploadingDoc(null);
  }

  async function handleSave() {
    if (!make.trim() || !model.trim()) {
      Alert.alert('Required', 'Make and model are required');
      return;
    }
    setLoading(true);
    try {
      const res = await updateVehicle(vehicleId, {
        make: make.trim(),
        model: model.trim(),
        year: year || null,
        registrationNo: regNo.trim() || null,
        color: color || null,
        category: category || null,
        seatingCapacity: seats || null,
        fuelType: fuel || null,
        currentOdometer: odometer || null,
        insuranceNumber: insuranceNumber || null,
        insuranceExpiry: insuranceExp?.toISOString() || null,
        rcNumber: rcNumber || null,
        rcExpiry: rcExp?.toISOString() || null,
        fitnessExpiry: fitnessExp?.toISOString() || null,
        permitExpiry: permitExp?.toISOString() || null,
      });
      if (res.data.success) {
        Alert.alert('Saved!', 'Vehicle details updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={['#1E3A5F', '#1D4ED8', '#3B82F6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Edit Vehicle</Text>
            <Text style={styles.headerSub}>{v.make} {v.model}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Vehicle Details */}
          <View style={styles.card}>
            <View style={[styles.sectionHeader, { backgroundColor: '#EFF6FF' }]}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="car-outline" size={15} color="#2563EB" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#1D40AF' }]}>Vehicle Details</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Make / Brand *">
                    <InputBox placeholder="Maruti, Hyundai..." value={make} onChangeText={setMake} />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Model *">
                    <InputBox placeholder="Swift, Innova..." value={model} onChangeText={setModel} />
                  </Field>
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Year">
                    <InputBox placeholder="2020" value={year} onChangeText={setYear} keyboardType="numeric" maxLength={4} />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Color">
                    <InputBox placeholder="White, Black..." value={color} onChangeText={setColor} />
                  </Field>
                </View>
              </View>

              <Field label="Registration Number">
                <InputBox placeholder="MH12AB1234" value={regNo} onChangeText={t => setRegNo(t.toUpperCase())} autoCapitalize="characters" />
              </Field>

              <Field label="Category">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                        <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </Field>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Seating Capacity">
                    <InputBox placeholder="5" value={seats} onChangeText={setSeats} keyboardType="numeric" maxLength={2} />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Odometer (km)">
                    <InputBox placeholder="45000" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
                  </Field>
                </View>
              </View>

              <Field label="Fuel Type">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {FUEL_TYPES.map(f => (
                      <TouchableOpacity key={f} style={[styles.chip, fuel === f && styles.chipActive]} onPress={() => setFuel(f)}>
                        <Text style={[styles.chipText, fuel === f && styles.chipTextActive]}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </Field>
            </View>
          </View>

          {/* Documents */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <View style={[styles.sectionHeader, { backgroundColor: '#EEF2FF' }]}>
              <View style={[styles.sectionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="document-text-outline" size={15} color="#4F46E5" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#3730A3' }]}>Documents</Text>
            </View>
            <View style={styles.cardBody}>
              <Field label="Insurance Number">
                <InputBox placeholder="INS-XXXX" value={insuranceNumber} onChangeText={setInsuranceNumber} />
              </Field>
              <Field label="Insurance Expiry">
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('insuranceExp')}>
                  <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                  <Text style={[styles.dateBtnText, insuranceExp && { color: BRAND.text }]}>{formatDate(insuranceExp)}</Text>
                </TouchableOpacity>
              </Field>
              <DocPhotoRow label="Insurance Photo" url={docPhotos.insurance} type="insurance" onPress={pickDocPhoto} uploading={uploadingDoc} baseURL={baseURL} />

              <Field label="RC Number">
                <InputBox placeholder="RC-XXXX" value={rcNumber} onChangeText={setRcNumber} />
              </Field>
              <Field label="RC Expiry">
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('rcExp')}>
                  <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                  <Text style={[styles.dateBtnText, rcExp && { color: BRAND.text }]}>{formatDate(rcExp)}</Text>
                </TouchableOpacity>
              </Field>
              <DocPhotoRow label="RC Photo" url={docPhotos.rc} type="rc" onPress={pickDocPhoto} uploading={uploadingDoc} baseURL={baseURL} />

              <Field label="Fitness Certificate Expiry">
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('fitnessExp')}>
                  <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                  <Text style={[styles.dateBtnText, fitnessExp && { color: BRAND.text }]}>{formatDate(fitnessExp)}</Text>
                </TouchableOpacity>
              </Field>
              <DocPhotoRow label="Fitness Photo" url={docPhotos.fitness} type="fitness" onPress={pickDocPhoto} uploading={uploadingDoc} baseURL={baseURL} />

              <Field label="Permit Expiry">
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('permitExp')}>
                  <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                  <Text style={[styles.dateBtnText, permitExp && { color: BRAND.text }]}>{formatDate(permitExp)}</Text>
                </TouchableOpacity>
              </Field>
              <DocPhotoRow label="Permit Photo" url={docPhotos.permit} type="permit" onPress={pickDocPhoto} uploading={uploadingDoc} baseURL={baseURL} />
            </View>
          </View>

          {/* Vehicle Photos */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <View style={[styles.sectionHeader, { backgroundColor: '#FDF4FF' }]}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="camera-outline" size={15} color="#9333EA" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#7E22CE' }]}>Vehicle Photos</Text>
              <Text style={{ fontSize: 11, color: BRAND.subText, fontWeight: '500', marginLeft: 4 }}>Optional</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.photoGrid}>
                {PHOTO_SLOTS.map(slot => {
                  const rawUrl = vehiclePhotos[slot.key];
                  const url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${baseURL}${rawUrl}`) : null;
                  const isUploading = uploadingSlot === slot.type;
                  return (
                    <View key={slot.key} style={styles.photoSlotWrap}>
                      <TouchableOpacity
                        style={[styles.photoSlot, url && styles.photoSlotFilled]}
                        onPress={() => !url && pickVehiclePhoto(slot.type, slot.key)}
                        activeOpacity={0.8}
                      >
                        {isUploading ? (
                          <ActivityIndicator size="small" color={BRAND.primary} />
                        ) : url ? (
                          <>
                            <Image source={{ uri: url }} style={styles.photoImg} resizeMode="cover" />
                            <TouchableOpacity style={styles.photoRemove} onPress={() => removeVehiclePhoto(slot.type, slot.key)}>
                              <Ionicons name="close" size={11} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoReplace} onPress={() => pickVehiclePhoto(slot.type, slot.key)}>
                              <Ionicons name="camera" size={11} color="#fff" />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <Ionicons name="camera-outline" size={22} color={BRAND.subText} />
                            <Text style={styles.photoSlotHint}>Tap to add</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.photoSlotLabel}>{slot.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Maintenance Logs */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <View style={[styles.sectionHeader, { backgroundColor: '#FFFBEB' }]}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="build-outline" size={15} color="#D97706" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#B45309' }]}>Maintenance Logs</Text>
              {logsLoading && <ActivityIndicator size="small" color="#F59E0B" style={{ marginLeft: 8 }} />}
              <View style={{ flex: 1 }} />
              {!isVendorVehicle && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddMaintenance', { vehicleId })}
                  style={[styles.logAddBtn, { backgroundColor: '#F59E0B' }]}
                >
                  <Ionicons name="add" size={13} color="#fff" />
                  <Text style={styles.logAddBtnText}>Add Log</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.cardBody}>
              {maintenanceLogs.length === 0 ? (
                <Text style={styles.emptyText}>No maintenance logs yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {maintenanceLogs.map(log => (
                    <View key={log.id} style={[styles.logCard, { borderLeftColor: '#F59E0B' }]}>
                      <View style={styles.logTopRow}>
                        <View style={[styles.logBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.logBadgeText, { color: '#D97706' }]}>{log.type}</Text>
                        </View>
                        <View style={styles.logActionRow}>
                          <Text style={styles.logDateText}>{fmtDate(log.date)}</Text>
                          {!isVendorVehicle && (
                            <>
                              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddMaintenance', { vehicleId, log })}>
                                <Ionicons name="pencil-outline" size={14} color="#D97706" />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Delete', 'Delete this log?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: async () => {
                                  try {
                                    await deleteMaintenanceLog(vehicleId, log.id);
                                    setMaintenanceLogs(prev => prev.filter(l => l.id !== log.id));
                                  } catch { Alert.alert('Error', 'Failed to delete'); }
                                }},
                              ])}>
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                      {log.description ? <Text style={styles.logDesc}>{log.description}</Text> : null}
                      <Text style={styles.logMetaText}>{fmtDate(log.date)}{log.cost ? `  ·  ₹${log.cost}` : ''}{log.odometer ? `  ·  ${log.odometer} km` : ''}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Fuel Logs */}
          {!isVendorVehicle && (
            <View style={[styles.card, { marginTop: 14 }]}>
              <View style={[styles.sectionHeader, { backgroundColor: '#FFF7ED' }]}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="water-outline" size={15} color="#EA580C" />
                </View>
                <Text style={[styles.sectionTitle, { color: '#C2410C' }]}>Fuel Logs</Text>
                {logsLoading && <ActivityIndicator size="small" color="#EA580C" style={{ marginLeft: 8 }} />}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddFuel', { vehicleId })}
                  style={[styles.logAddBtn, { backgroundColor: '#EA580C' }]}
                >
                  <Ionicons name="add" size={13} color="#fff" />
                  <Text style={styles.logAddBtnText}>Add Log</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardBody}>
                {fuelLogs.length === 0 ? (
                  <Text style={styles.emptyText}>No fuel logs yet.</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {fuelLogs.map(log => (
                      <View key={log.id} style={[styles.logCard, { borderLeftColor: '#EA580C' }]}>
                        <View style={styles.logTopRow}>
                          <View style={[styles.logBadge, { backgroundColor: '#FFEDD5' }]}>
                            <Text style={[styles.logBadgeText, { color: '#EA580C' }]}>{log.fuelType || 'Fuel'} — {log.liters ? `${log.liters}L` : ''}</Text>
                          </View>
                          <View style={styles.logActionRow}>
                            <Text style={styles.logDateText}>{fmtDate(log.date)}</Text>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddFuel', { vehicleId, log })}>
                              <Ionicons name="pencil-outline" size={14} color="#EA580C" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteFuelLog(log.id)}>
                              <Ionicons name="trash-outline" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {log.station ? <Text style={styles.logDesc}>{log.station}</Text> : null}
                        <Text style={styles.logMetaText}>{fmtDate(log.date)}{log.totalCost ? `  ·  ₹${log.totalCost}` : ''}{log.odometer ? `  ·  ${log.odometer} km` : ''}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Incidents */}
          {!isVendorVehicle && (
            <View style={[styles.card, { marginTop: 14 }]}>
              <View style={[styles.sectionHeader, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="warning-outline" size={15} color="#EF4444" />
                </View>
                <Text style={[styles.sectionTitle, { color: '#B91C1C' }]}>Incidents</Text>
                {logsLoading && <ActivityIndicator size="small" color="#EF4444" style={{ marginLeft: 8 }} />}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddIncident', { vehicleId })}
                  style={[styles.logAddBtn, { backgroundColor: '#EF4444' }]}
                >
                  <Ionicons name="add" size={13} color="#fff" />
                  <Text style={styles.logAddBtnText}>Report</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardBody}>
                {incidents.length === 0 ? (
                  <Text style={styles.emptyText}>No incidents reported.</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {incidents.map(inc => {
                      const sevColor = inc.severity === 'HIGH' ? '#DC2626' : inc.severity === 'MEDIUM' ? '#D97706' : '#16A34A';
                      const sevBg    = inc.severity === 'HIGH' ? '#FEF2F2' : inc.severity === 'MEDIUM' ? '#FFFBEB' : '#F0FDF4';
                      return (
                        <View key={inc.id} style={[styles.logCard, { borderLeftColor: sevColor }]}>
                          <View style={styles.logTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={[styles.logBadge, { backgroundColor: sevBg }]}>
                                <Text style={[styles.logBadgeText, { color: sevColor }]}>{inc.type}</Text>
                              </View>
                              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: sevColor + '20' }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: sevColor }}>{inc.severity}</Text>
                              </View>
                            </View>
                            <View style={styles.logActionRow}>
                              <Text style={styles.logDateText}>{fmtDate(inc.date)}</Text>
                              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddIncident', { vehicleId, log: inc })}>
                                <Ionicons name="pencil-outline" size={14} color={sevColor} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteIncident(inc.id)}>
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          {inc.description ? <Text style={styles.logDesc}>{inc.description}</Text> : null}
                          <Text style={styles.logMetaText}>{fmtDate(inc.date)}{inc.repairCost ? `  ·  ₹${inc.repairCost}` : ''}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveBtnWrap, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#065F46', '#16A34A']} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={dateFields[showDatePicker] || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDatePicker(null);
            if (d) setDateFields[showDatePicker](d);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: BRAND.bg },
  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  headerNav:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 2 },

  content:    { padding: 16 },

  card:       { backgroundColor: BRAND.card, borderRadius: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  sectionIcon:{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardBody:   { padding: 14 },

  row:        { flexDirection: 'row', gap: 12 },
  field:      { marginBottom: 14 },
  label:      { fontSize: 12, fontWeight: '700', color: BRAND.text, marginBottom: 6, letterSpacing: 0.2 },
  input:      { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12, height: 46, fontSize: 14, color: BRAND.text },
  chipRow:    { flexDirection: 'row', gap: 8 },
  chip:       { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BRAND.border, backgroundColor: BRAND.bg },
  chipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  chipText:   { fontSize: 12, fontWeight: '600', color: BRAND.subText },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  dateBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12, height: 46 },
  dateBtnText:{ fontSize: 14, color: BRAND.subText },

  photoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlotWrap:  { alignItems: 'center', gap: 5, width: '30%' },
  photoSlot:      { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: BRAND.bg, borderWidth: 1.5, borderColor: BRAND.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoSlotFilled:{ borderStyle: 'solid', borderColor: 'transparent' },
  photoImg:       { width: '100%', height: '100%' },
  photoSlotHint:  { fontSize: 10, color: BRAND.subText, marginTop: 4, fontWeight: '500' },
  photoSlotLabel: { fontSize: 11, color: BRAND.subText, fontWeight: '600', textAlign: 'center' },
  photoRemove:    { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  photoReplace:   { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },

  logAddBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  logAddBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  logCard:       { backgroundColor: BRAND.bg, borderRadius: 10, padding: 11, borderLeftWidth: 3, gap: 4 },
  logTopRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logActionRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:       { padding: 3 },
  logBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  logBadgeText:  { fontSize: 11, fontWeight: '800' },
  logDateText:   { fontSize: 11, color: BRAND.subText, fontWeight: '600' },
  logDesc:       { fontSize: 12, color: BRAND.subText, lineHeight: 17 },
  logMetaText:   { fontSize: 11, color: BRAND.subText },

  emptyText:  { fontSize: 13, color: BRAND.subText, textAlign: 'center', paddingVertical: 10 },

  saveBtnWrap:  { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  saveBtnText:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});

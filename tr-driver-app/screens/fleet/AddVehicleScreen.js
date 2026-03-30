import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { addVehicle, uploadVehiclePhoto } from '../api/client';

const BRAND = {
  primary: '#16A34A', bg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', text: '#1E293B', subText: '#64748B',
};

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const PHOTO_SLOTS = [
  { key: 'front',     label: 'Front' },
  { key: 'back',      label: 'Back' },
  { key: 'leftSide',  label: 'Left Side' },
  { key: 'rightSide', label: 'Right Side' },
  { key: 'interior',  label: 'Interior' },
];

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function InputBox({ ...props }) {
  return <TextInput style={styles.input} placeholderTextColor={BRAND.subText} {...props} />;
}

function formatDate(d) {
  if (!d) return 'Select date';
  return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
}

export default function AddVehicleScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [make, setMake]         = useState('');
  const [model, setModel]       = useState('');
  const [year, setYear]         = useState('');
  const [regNo, setRegNo]       = useState('');
  const [color, setColor]       = useState('');
  const [category, setCategory] = useState('');
  const [seats, setSeats]       = useState('');
  const [fuel, setFuel]         = useState('');
  const [odometer, setOdometer] = useState('');

  const [insuranceExp, setInsuranceExp] = useState(null);
  const [rcExp, setRcExp]               = useState(null);
  const [fitnessExp, setFitnessExp]     = useState(null);
  const [permitExp, setPermitExp]       = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null);

  // Photos: { front: { uri, name, type }, ... }
  const [photos, setPhotos] = useState({});

  const dateFields = { insuranceExp, rcExp, fitnessExp, permitExp };
  const setDateFields = { insuranceExp: setInsuranceExp, rcExp: setRcExp, fitnessExp: setFitnessExp, permitExp: setPermitExp };

  async function pickPhoto(slotKey) {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPhotos(p => ({ ...p, [slotKey]: { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.type || 'image/jpeg' } }));
  }

  function removePhoto(slotKey) {
    setPhotos(p => { const n = { ...p }; delete n[slotKey]; return n; });
  }

  async function handleAdd() {
    if (!make.trim() || !model.trim()) {
      Alert.alert('Required', 'Make and model are required');
      return;
    }
    setLoading(true);
    try {
      const res = await addVehicle({
        make: make.trim(), model: model.trim(),
        year: year || null, registrationNo: regNo.trim() || null,
        color: color || null, category: category || null,
        seatingCapacity: seats || null, fuelType: fuel || null,
        insuranceExpiry: insuranceExp?.toISOString() || null,
        rcExpiry: rcExp?.toISOString() || null,
        fitnessExpiry: fitnessExp?.toISOString() || null,
        permitExpiry: permitExp?.toISOString() || null,
        currentOdometer: odometer || null,
      });

      if (res.data.success) {
        const vehicleId = res.data.vehicle.id;

        // Upload photos if any selected
        const photoEntries = Object.entries(photos);
        for (const [slotKey, photo] of photoEntries) {
          try {
            await uploadVehiclePhoto(vehicleId, photo.uri, photo.name, photo.type, slotKey);
          } catch {}
        }

        Alert.alert('Vehicle Added!', 'Your vehicle has been added to your fleet.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={BRAND.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Vehicle</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Vehicle Details */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={16} color={BRAND.primary} />
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Make / Brand *">
                  <InputBox placeholder="Maruti, Hyundai..." value={make} onChangeText={setMake} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Model *">
                  <InputBox placeholder="Swift Dzire, Innova..." value={model} onChangeText={setModel} />
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
              <InputBox placeholder="MH12AB1234" value={regNo} onChangeText={setRegNo} autoCapitalize="characters" />
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

            <Field label="Current Odometer (km)">
              <InputBox placeholder="e.g. 45000" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
            </Field>
          </View>

          {/* Document Expiry */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={BRAND.primary} />
              <Text style={styles.sectionTitle}>Document Expiry Dates</Text>
            </View>
            {[
              { field: 'insuranceExp', label: 'Insurance Expiry' },
              { field: 'rcExp', label: 'RC Expiry' },
              { field: 'fitnessExp', label: 'Fitness Certificate Expiry' },
              { field: 'permitExp', label: 'Permit Expiry' },
            ].map(({ field, label }) => (
              <Field key={field} label={label}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(field)}>
                  <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                  <Text style={[styles.dateBtnText, dateFields[field] && { color: BRAND.text }]}>
                    {formatDate(dateFields[field])}
                  </Text>
                </TouchableOpacity>
              </Field>
            ))}
          </View>

          {/* Vehicle Photos */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="camera-outline" size={16} color="#9333EA" />
              <Text style={[styles.sectionTitle, { color: '#9333EA' }]}>Vehicle Photos</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            <View style={styles.photoGrid}>
              {PHOTO_SLOTS.map(slot => {
                const photo = photos[slot.key];
                return (
                  <View key={slot.key} style={styles.photoSlotWrap}>
                    <TouchableOpacity
                      style={[styles.photoSlot, photo && styles.photoSlotFilled]}
                      onPress={() => photo ? null : pickPhoto(slot.key)}
                      activeOpacity={0.8}
                    >
                      {photo ? (
                        <>
                          <Image source={{ uri: photo.uri }} style={styles.photoImg} resizeMode="cover" />
                          <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(slot.key)}>
                            <Ionicons name="close" size={11} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.photoReplace} onPress={() => pickPhoto(slot.key)}>
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

          <TouchableOpacity
            style={[styles.addBtn, loading && { opacity: 0.7 }]}
            onPress={handleAdd}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Vehicle to Fleet</Text>
                </>
            }
          </TouchableOpacity>

          <View style={{ height: 32 }} />
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
  safe: { flex: 1, backgroundColor: BRAND.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: BRAND.card, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: BRAND.text },
  content: { padding: 16 },
  card: { backgroundColor: BRAND.card, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: BRAND.primary, flex: 1 },
  optionalTag: { fontSize: 11, color: BRAND.subText, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: BRAND.text, marginBottom: 6 },
  input: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12, height: 44, fontSize: 14, color: BRAND.text },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.bg },
  chipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: BRAND.subText },
  chipTextActive: { color: '#fff' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12, height: 44 },
  dateBtnText: { fontSize: 14, color: BRAND.subText },

  // Photo slots
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlotWrap: { alignItems: 'center', gap: 5, width: '30%' },
  photoSlot: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: BRAND.bg, borderWidth: 1.5, borderColor: BRAND.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoSlotFilled: { borderStyle: 'solid', borderColor: 'transparent' },
  photoImg: { width: '100%', height: '100%' },
  photoSlotHint: { fontSize: 10, color: BRAND.subText, marginTop: 4, fontWeight: '500' },
  photoSlotLabel: { fontSize: 11, color: BRAND.subText, fontWeight: '600', textAlign: 'center' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  photoReplace: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BRAND.primary, borderRadius: 14, height: 52, marginTop: 16 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

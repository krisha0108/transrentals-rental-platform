import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateVehicle, uploadVehiclePhoto } from '../api/client';

const BRAND = {
  primary: '#16A34A', bg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', text: '#1E293B', subText: '#64748B',
};

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

function DocPhotoRow({ label, url, type, onPress, uploading }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }} resizeMode="cover" />
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

export default function EditVehicleScreen({ route, navigation }) {
  const { vehicleId, vehicle: v } = route.params;

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
    rc: v.rcDocument || null,
    fitness: v.fitnessDocument || null,
    permit: v.permitDocument || null,
  });
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const dateFields = { insuranceExp, rcExp, fitnessExp, permitExp };
  const setDateFields = { insuranceExp: setInsuranceExp, rcExp: setRcExp, fitnessExp: setFitnessExp, permitExp: setPermitExp };

  async function pickDocPhoto(type) {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingDoc(type);
    try {
      const res = await uploadVehiclePhoto(vehicleId, asset.uri, asset.fileName || 'doc.jpg', asset.type || 'image/jpeg', type);
      if (res.data.success) setDocPhotos(p => ({ ...p, [type]: res.data.url }));
    } catch {
      Alert.alert('Error', 'Failed to upload photo');
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={BRAND.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Vehicle</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={BRAND.primary} />
              <Text style={styles.sectionTitle}>Documents</Text>
            </View>

            <Field label="Insurance Number">
              <InputBox placeholder="INS-XXXX" value={insuranceNumber} onChangeText={setInsuranceNumber} />
            </Field>
            <Field label="Insurance Expiry">
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('insuranceExp')}>
                <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                <Text style={[styles.dateBtnText, insuranceExp && { color: BRAND.text }]}>{formatDate(insuranceExp)}</Text>
              </TouchableOpacity>
            </Field>
            <DocPhotoRow label="Insurance Photo" url={docPhotos.insurance} type="insurance" onPress={pickDocPhoto} uploading={uploadingDoc} />

            <Field label="RC Number">
              <InputBox placeholder="RC-XXXX" value={rcNumber} onChangeText={setRcNumber} />
            </Field>
            <Field label="RC Expiry">
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('rcExp')}>
                <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                <Text style={[styles.dateBtnText, rcExp && { color: BRAND.text }]}>{formatDate(rcExp)}</Text>
              </TouchableOpacity>
            </Field>
            <DocPhotoRow label="RC Photo" url={docPhotos.rc} type="rc" onPress={pickDocPhoto} uploading={uploadingDoc} />

            <Field label="Fitness Certificate Expiry">
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('fitnessExp')}>
                <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                <Text style={[styles.dateBtnText, fitnessExp && { color: BRAND.text }]}>{formatDate(fitnessExp)}</Text>
              </TouchableOpacity>
            </Field>
            <DocPhotoRow label="Fitness Photo" url={docPhotos.fitness} type="fitness" onPress={pickDocPhoto} uploading={uploadingDoc} />

            <Field label="Permit Expiry">
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('permitExp')}>
                <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
                <Text style={[styles.dateBtnText, permitExp && { color: BRAND.text }]}>{formatDate(permitExp)}</Text>
              </TouchableOpacity>
            </Field>
            <DocPhotoRow label="Permit Photo" url={docPhotos.permit} type="permit" onPress={pickDocPhoto} uploading={uploadingDoc} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: BRAND.primary },
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
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BRAND.primary, borderRadius: 14, height: 52, marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

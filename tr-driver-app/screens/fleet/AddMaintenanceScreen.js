import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addMaintenanceLog } from '../api/client';

const BRAND = {
  primary: '#16A34A', bg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', text: '#1E293B', subText: '#64748B',
};

const TYPES = ['SERVICE', 'REPAIR', 'FUEL', 'INSURANCE', 'TIRE', 'BATTERY', 'OIL_CHANGE', 'OTHER'];

export default function AddMaintenanceScreen({ route, navigation }) {
  const { vehicleId } = route.params;
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [odometer, setOdometer] = useState('');
  const [nextDue, setNextDue] = useState(null);
  const [showNextDue, setShowNextDue] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatDate(d) {
    return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
  }

  async function handleAdd() {
    if (!type) { Alert.alert('Required', 'Please select a log type'); return; }
    setLoading(true);
    try {
      const res = await addMaintenanceLog(vehicleId, {
        type,
        description: description || null,
        cost: cost || null,
        date: date.toISOString(),
        odometer: odometer || null,
        nextDueDate: nextDue?.toISOString() || null,
      });
      if (res.data.success) {
        Alert.alert('Log Added!', '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add log');
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
        <Text style={styles.headerTitle}>Add Maintenance Log</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Type *</Text>
            <View style={styles.typeGrid}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, type === t && styles.typeChipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeChipText, type === t && { color: '#fff' }]}>
                    {t.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Date *</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDate(true)}>
              <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
              <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="What was done..."
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor={BRAND.subText}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Cost (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="numeric"
                  placeholderTextColor={BRAND.subText}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Odometer (km)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 45000"
                  value={odometer}
                  onChangeText={setOdometer}
                  keyboardType="numeric"
                  placeholderTextColor={BRAND.subText}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Next Due Date</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowNextDue(true)}>
              <Ionicons name="calendar-outline" size={16} color={BRAND.subText} />
              <Text style={[styles.dateBtnText, nextDue && { color: BRAND.text }]}>
                {nextDue ? formatDate(nextDue) : 'Select (optional)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addBtn, loading && { opacity: 0.7 }]}
              onPress={handleAdd}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add Log</Text>
                </>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(e, d) => { setShowDate(false); if (d) setDate(d); }}
        />
      )}
      {showNextDue && (
        <DateTimePicker
          value={nextDue || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(e, d) => { setShowNextDue(false); if (d) setNextDue(d); }}
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
  card: { backgroundColor: BRAND.card, borderRadius: 14, padding: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: BRAND.text, marginBottom: 8, marginTop: 14 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.bg },
  typeChipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  typeChipText: { fontSize: 12, fontWeight: '600', color: BRAND.subText },
  row: { flexDirection: 'row', gap: 12 },
  input: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12, height: 44, fontSize: 14, color: BRAND.text },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12, height: 44 },
  dateBtnText: { fontSize: 14, color: BRAND.subText },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BRAND.primary, borderRadius: 12, height: 50, marginTop: 20 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

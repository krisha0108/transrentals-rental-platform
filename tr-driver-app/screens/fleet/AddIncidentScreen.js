import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addIncident } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', danger: '#EF4444', warn: '#F59E0B',
};

function Field({ label, icon, iconBg, iconColor, children }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <View style={[styles.fieldIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const INCIDENT_TYPES = ['Accident', 'Breakdown', 'Theft', 'Damage', 'Traffic Violation', 'Other'];
const SEVERITY_OPTIONS = [
  { value: 'LOW',    label: 'Low',    color: '#16A34A', bg: '#F0FDF4' },
  { value: 'MEDIUM', label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
  { value: 'HIGH',   label: 'High',   color: '#DC2626', bg: '#FEF2F2' },
];
const STATUS_OPTIONS = [
  { value: 'PENDING',    label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED',   label: 'Resolved' },
];

export default function AddIncidentScreen({ route, navigation }) {
  const { vehicleId } = route.params;

  const [date, setDate]               = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType]               = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity]       = useState('MEDIUM');
  const [repairCost, setRepairCost]   = useState('');
  const [repairStatus, setRepairStatus] = useState('PENDING');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);

  async function handleSave() {
    if (!type) {
      Alert.alert('Required', 'Please select an incident type.');
      return;
    }
    setSaving(true);
    try {
      await addIncident(vehicleId, {
        date: date.toISOString(),
        type,
        description: description || null,
        severity,
        repairCost: repairCost || null,
        repairStatus,
        notes: notes || null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save incident');
    }
    setSaving(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={['#7C1C1C', '#B91C1C', '#EF4444']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>

          {/* Date */}
          <Field label="Date" icon="calendar-outline" iconBg="#EFF6FF" iconColor="#3B82F6">
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{moment(date).format('DD MMM YYYY')}</Text>
              <Ionicons name="chevron-down" size={14} color={C.sub} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
              />
            )}
          </Field>

          {/* Incident Type */}
          <Field label="Incident Type *" icon="warning-outline" iconBg="#FEF2F2" iconColor={C.danger}>
            <View style={styles.chipRow}>
              {INCIDENT_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipActiveRed]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextRed]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Severity */}
          <Field label="Severity" icon="thermometer-outline" iconBg="#FFFBEB" iconColor={C.warn}>
            <View style={styles.chipRow}>
              {SEVERITY_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.chip, severity === s.value && { backgroundColor: s.bg, borderColor: s.color }]}
                  onPress={() => setSeverity(s.value)}
                >
                  <Text style={[styles.chipText, severity === s.value && { color: s.color, fontWeight: '700' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Description */}
          <Field label="Description" icon="document-text-outline" iconBg="#F5F3FF" iconColor="#7C3AED">
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="What happened?"
              placeholderTextColor={C.sub}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </Field>

          {/* Repair Cost */}
          <Field label="Repair Cost (₹)" icon="cash-outline" iconBg="#F0FDF4" iconColor={C.primary}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000"
              placeholderTextColor={C.sub}
              keyboardType="decimal-pad"
              value={repairCost}
              onChangeText={setRepairCost}
            />
          </Field>

          {/* Repair Status */}
          <Field label="Repair Status" icon="construct-outline" iconBg="#FFF7ED" iconColor="#EA580C">
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.chip, repairStatus === s.value && styles.chipActive]}
                  onPress={() => setRepairStatus(s.value)}
                >
                  <Text style={[styles.chipText, repairStatus === s.value && styles.chipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Notes */}
          <Field label="Notes" icon="create-outline" iconBg="#F1F5F9" iconColor={C.sub}>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Additional notes..."
              placeholderTextColor={C.sub}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </Field>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={['#991B1B', '#EF4444']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Incident Report</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },

  scroll: { flex: 1 },
  body:   { padding: 16, gap: 12 },

  field:     { backgroundColor: C.card, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldIcon: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  fieldLabel:{ fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.4 },

  input:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: C.text, fontWeight: '600' },
  inputText:  { fontSize: 14, color: C.text, fontWeight: '600' },
  inputMulti: { height: 72, alignItems: 'flex-start', paddingTop: 10, textAlignVertical: 'top' },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  chipActive: { backgroundColor: '#F0FDF4', borderColor: C.primary },
  chipActiveRed: { backgroundColor: '#FEF2F2', borderColor: C.danger },
  chipText:   { fontSize: 13, color: C.sub, fontWeight: '600' },
  chipTextActive: { color: C.primary, fontWeight: '700' },
  chipTextRed:    { color: C.danger,   fontWeight: '700' },

  saveBtn:     { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

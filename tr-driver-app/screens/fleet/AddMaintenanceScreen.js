import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addMaintenanceLog, updateMaintenanceLog } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#7C3AED', dark: '#4C1D95', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6',
};

const TYPES = ['SERVICE', 'REPAIR', 'FUEL', 'INSURANCE', 'TIRE', 'BATTERY', 'OIL_CHANGE', 'OTHER'];

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

export default function AddMaintenanceScreen({ route, navigation }) {
  const { vehicleId, log } = route.params;
  const isEdit = !!log;

  const [type, setType] = useState(log?.type || '');
  const [description, setDescription] = useState(log?.description || '');
  const [cost, setCost] = useState(log?.cost ? String(log.cost) : '');
  const [date, setDate] = useState(log?.date ? new Date(log.date) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [odometer, setOdometer] = useState(log?.odometer ? String(log.odometer) : '');
  const [nextDue, setNextDue] = useState(log?.nextDueDate ? new Date(log.nextDueDate) : null);
  const [showNextDue, setShowNextDue] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatDate(d) {
    return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
  }

  async function handleAdd() {
    if (!type) { Alert.alert('Required', 'Please select a log type'); return; }
    setLoading(true);
    try {
      const payload = {
        type,
        description: description || null,
        cost: cost || null,
        date: date.toISOString(),
        odometer: odometer || null,
        nextDueDate: nextDue?.toISOString() || null,
      };
      if (isEdit) {
        await updateMaintenanceLog(vehicleId, log.id, payload);
        Alert.alert('Updated!', '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        const res = await addMaintenanceLog(vehicleId, payload);
        if (res.data.success) {
          Alert.alert('Log Added!', '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        }
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save log');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={['#4C1D95', '#6D28D9', '#7C3AED']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Maintenance Log' : 'Add Maintenance Log'}</Text>
            <Text style={styles.headerSub}>Vehicle #{vehicleId}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Type */}
          <Field label="Log Type *" icon="build-outline" iconBg="#FEF3C7" iconColor="#D97706">
            <View style={styles.typeGrid}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, type === t && styles.typeChipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                    {t.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Date */}
          <Field label="Date *" icon="calendar-outline" iconBg="#EFF6FF" iconColor={C.blue}>
            <TouchableOpacity style={styles.inputRow} onPress={() => setShowDate(true)}>
              <Text style={[styles.inputText, { color: C.text }]}>{formatDate(date)}</Text>
              <Ionicons name="chevron-down" size={14} color={C.sub} />
            </TouchableOpacity>
            {showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e, d) => { setShowDate(false); if (d) setDate(d); }}
              />
            )}
          </Field>

          {/* Description */}
          <Field label="Description" icon="document-text-outline" iconBg="#F5F3FF" iconColor="#7C3AED">
            <TextInput
              style={[styles.inputRow, styles.inputMulti]}
              placeholder="What was done..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor={C.sub}
              textAlignVertical="top"
            />
          </Field>

          {/* Cost */}
          <Field label="Cost (₹)" icon="cash-outline" iconBg="#F0FDF4" iconColor={C.success}>
            <TextInput
              style={styles.inputRow}
              placeholder="0"
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
              placeholderTextColor={C.sub}
            />
          </Field>

          {/* Odometer */}
          <Field label="Odometer (km)" icon="speedometer-outline" iconBg="#EFF6FF" iconColor={C.blue}>
            <TextInput
              style={styles.inputRow}
              placeholder="e.g. 45000"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="numeric"
              placeholderTextColor={C.sub}
            />
          </Field>

          {/* Next Due Date */}
          <Field label="Next Due Date (optional)" icon="calendar-outline" iconBg="#FFFBEB" iconColor={C.warn}>
            <TouchableOpacity style={styles.inputRow} onPress={() => setShowNextDue(true)}>
              <Text style={[styles.inputText, nextDue ? { color: C.text } : { color: C.sub }]}>
                {nextDue ? formatDate(nextDue) : 'Select (optional)'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={C.sub} />
            </TouchableOpacity>
            {showNextDue && (
              <DateTimePicker
                value={nextDue || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(e, d) => { setShowNextDue(false); if (d) setNextDue(d); }}
              />
            )}
          </Field>

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveBtnWrap, loading && { opacity: 0.7 }]} onPress={handleAdd} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#4C1D95', '#7C3AED']} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Log'}</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22 },
  headerNav:  { flexDirection: 'row', alignItems: 'center' },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 2 },

  content:    { padding: 16, gap: 12 },

  field:      { backgroundColor: C.card, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldHead:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  fieldIcon:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5 },

  typeGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:   { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  typeChipActive:    { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  typeChipText:      { fontSize: 12, fontWeight: '600', color: C.sub },
  typeChipTextActive:{ fontSize: 12, fontWeight: '700', color: '#fff' },

  inputRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: C.text, fontWeight: '600' },
  inputText:  { fontSize: 14, fontWeight: '600' },
  inputMulti: { height: 80, alignItems: 'flex-start', paddingTop: 10, textAlignVertical: 'top' },

  saveBtnWrap:  { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  saveBtnText:  { fontSize: 15, fontWeight: '800', color: '#fff' },
});

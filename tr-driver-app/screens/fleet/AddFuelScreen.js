import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Alert } from '../../components/ui/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppDatePicker from '../../components/ui/AppDatePicker';
import { addFuelLog, updateFuelLog } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', danger: '#EF4444',
};

function Field({ label, icon, iconBg, iconColor, children, badge }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <View style={[styles.fieldIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
        {badge ? (
          <View style={styles.autoBadge}>
            <Ionicons name="flash" size={9} color="#16A34A" />
            <Text style={styles.autoBadgeText}>Auto</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export default function AddFuelScreen({ route, navigation }) {
  const { vehicleId, log } = route.params;
  const isEdit = !!log;

  const [date, setDate]               = useState(log?.date ? new Date(log.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [liters, setLiters]           = useState(log?.liters ? String(log.liters) : '');
  const [pricePerLiter, setPricePerLiter] = useState(log?.pricePerLiter ? String(log.pricePerLiter) : '');
  const [totalAmount, setTotalAmount] = useState(log?.totalCost ? String(log.totalCost) : '');
  const [autoCalced, setAutoCalced]   = useState(false);
  const [odometer, setOdometer]       = useState(log?.odometer ? String(log.odometer) : '');
  const [fuelStation, setFuelStation] = useState(log?.station || '');
  const [fuelType, setFuelType]       = useState(log?.fuelType || '');
  const [notes, setNotes]             = useState(log?.notes || '');
  const [saving, setSaving]           = useState(false);

  // Auto-calculate total when liters + pricePerLiter change
  function onLitersChange(v) {
    setLiters(v);
    if (v && pricePerLiter) {
      const t = (parseFloat(v) * parseFloat(pricePerLiter)).toFixed(2);
      if (!isNaN(t)) { setTotalAmount(t); setAutoCalced(true); }
    } else {
      setAutoCalced(false);
    }
  }

  function onPriceChange(v) {
    setPricePerLiter(v);
    if (liters && v) {
      const t = (parseFloat(liters) * parseFloat(v)).toFixed(2);
      if (!isNaN(t)) { setTotalAmount(t); setAutoCalced(true); }
    } else {
      setAutoCalced(false);
    }
  }

  function onTotalChange(v) {
    setTotalAmount(v);
    setAutoCalced(false);
  }

  async function handleSave() {
    if (!liters || !totalAmount) {
      Alert.alert('Required', 'Liters and total amount are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: date.toISOString(),
        liters,
        pricePerLiter: pricePerLiter || null,
        totalCost: totalAmount,
        odometer: odometer || null,
        station: fuelStation || null,
        fuelType: fuelType || null,
        notes: notes || null,
      };
      if (isEdit) {
        await updateFuelLog(vehicleId, log.id, payload);
      } else {
        await addFuelLog(vehicleId, { ...payload, totalAmount });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save fuel log');
    }
    setSaving(false);
  }

  const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'LPG'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Fuel Log' : 'Add Fuel Log'}</Text>
            <Text style={styles.headerSub}>Vehicle #{vehicleId}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>

          {/* Date */}
          <Field label="Date" icon="calendar-outline" iconBg="#EFF6FF" iconColor="#3B82F6">
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{moment(date).format('DD MMM YYYY')}</Text>
              <Ionicons name="chevron-down" size={14} color={C.sub} />
            </TouchableOpacity>
            <AppDatePicker
              visible={showDatePicker}
              value={date}
              title="Fuel Date"
              maximumDate={new Date()}
              onCancel={() => setShowDatePicker(false)}
              onConfirm={(d) => { setShowDatePicker(false); if (d) setDate(d); }}
            />
          </Field>

          {/* Liters */}
          <Field label="Liters *" icon="water-outline" iconBg="#F0FDF4" iconColor={C.primary}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 30"
              placeholderTextColor={C.sub}
              keyboardType="decimal-pad"
              value={liters}
              onChangeText={onLitersChange}
            />
          </Field>

          {/* Price per liter */}
          <Field label="Price per Liter" icon="pricetag-outline" iconBg="#FFFBEB" iconColor="#D97706">
            <TextInput
              style={styles.input}
              placeholder="e.g. 96.50"
              placeholderTextColor={C.sub}
              keyboardType="decimal-pad"
              value={pricePerLiter}
              onChangeText={onPriceChange}
            />
          </Field>

          {/* Total Amount */}
          <Field label="Total Amount (₹) *" icon="cash-outline" iconBg="#F0FDF4" iconColor={C.primary} badge={autoCalced}>
            <TextInput
              style={[styles.input, autoCalced && styles.inputAutoCalced]}
              placeholder="e.g. 2895"
              placeholderTextColor={C.sub}
              keyboardType="decimal-pad"
              value={totalAmount}
              onChangeText={onTotalChange}
            />
          </Field>

          {/* Odometer */}
          <Field label="Odometer Reading (km)" icon="speedometer-outline" iconBg="#EFF6FF" iconColor="#3B82F6">
            <TextInput
              style={styles.input}
              placeholder="e.g. 45230"
              placeholderTextColor={C.sub}
              keyboardType="number-pad"
              value={odometer}
              onChangeText={setOdometer}
            />
          </Field>

          {/* Fuel Type */}
          <Field label="Fuel Type" icon="flash-outline" iconBg="#FDF4FF" iconColor="#9333EA">
            <View style={styles.chipRow}>
              {FUEL_TYPES.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, fuelType === f && styles.chipActive]}
                  onPress={() => setFuelType(fuelType === f ? '' : f)}
                >
                  <Text style={[styles.chipText, fuelType === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Fuel Station */}
          <Field label="Fuel Station" icon="location-outline" iconBg="#FFF7ED" iconColor="#EA580C">
            <TextInput
              style={styles.input}
              placeholder="e.g. HP Petrol Pump, Main Road"
              placeholderTextColor={C.sub}
              value={fuelStation}
              onChangeText={setFuelStation}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes" icon="create-outline" iconBg="#F1F5F9" iconColor={C.sub}>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Optional notes..."
              placeholderTextColor={C.sub}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </Field>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={['#065F46', '#16A34A']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Save Fuel Log'}</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22 },
  headerNav:  { flexDirection: 'row', alignItems: 'center' },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 2 },

  scroll: { flex: 1 },
  body:   { padding: 16, gap: 12 },

  field:     { backgroundColor: C.card, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  fieldIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  fieldLabel:{ fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5 },

  autoBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6, backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  autoBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },

  input:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, color: C.text, fontWeight: '600', borderWidth: 1, borderColor: C.border },
  inputText:     { fontSize: 14, color: C.text, fontWeight: '600' },
  inputMulti:    { height: 80, alignItems: 'flex-start', paddingTop: 11, textAlignVertical: 'top' },
  inputAutoCalced: { borderColor: '#16A34A', borderWidth: 1.5, backgroundColor: '#F0FDF4' },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  chipActive: { backgroundColor: '#F0FDF4', borderColor: C.primary },
  chipText:   { fontSize: 13, color: C.sub, fontWeight: '600' },
  chipTextActive: { color: C.primary, fontWeight: '700' },

  saveBtn:     { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

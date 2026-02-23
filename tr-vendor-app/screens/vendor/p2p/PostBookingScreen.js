import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createP2PBooking } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', sub: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B', red: '#EF4444',
};

const TRUCK_VEHICLES = ['Mini Truck', 'LCV', '14ft', '17ft', '19ft', '22ft', '32ft'];
const CAR_VEHICLES = ['Sedan', 'SUV', 'Luxury', 'Tempo Traveller'];
const REASONS = ['No Vehicle Available', 'Vehicle Under Maintenance', 'Overbooked', 'Route Not Covered', 'Other'];
const URGENCY_OPTIONS = [
  { value: 'HIGH', label: 'High', desc: 'Needs partner ASAP', color: C.red, bg: '#FEE2E2' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Within a day', color: C.amber, bg: '#FEF3C7' },
  { value: 'LOW', label: 'Low', desc: 'Flexible timeline', color: C.brand, bg: '#D1FAE5' },
];

function fmtDate(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtTime(d) { return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

export default function PostBookingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: [] });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: [{ label: 'OK', variant: 'primary', onPress: () => hideAlert() }] });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  // Form state
  const [serviceType, setServiceType] = useState('truck');
  const [vehicleRequired, setVehicleRequired] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  // Date
  const [tripDate, setTripDate] = useState(null);
  const [tripTime, setTripTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Truck-specific
  const [goodsType, setGoodsType] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [needInsurance, setNeedInsurance] = useState(false);
  const [needLabour, setNeedLabour] = useState(false);
  const [labourCount, setLabourCount] = useState('');

  // Car-specific
  const [passengers, setPassengers] = useState('');

  // Budget & Commission
  const [customerBudget, setCustomerBudget] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('10');

  // Urgency & Reason
  const [urgency, setUrgency] = useState('MEDIUM');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const budget = Number(customerBudget) || 0;
  const commPct = Number(commissionPercent) || 0;
  const commissionAmount = Math.round(budget * commPct / 100);
  const partnerEarning = budget - commissionAmount;
  const platformFee = Math.round(partnerEarning * 0.05);

  const vehicleOptions = serviceType === 'truck' ? TRUCK_VEHICLES : CAR_VEHICLES;

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setTripDate(selectedDate);
    if (Platform.OS === 'ios') setShowDatePicker(false);
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;
    setTripTime(selectedTime);
    if (Platform.OS === 'ios') setShowTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!fromCity.trim()) return showAlert('warning', 'Missing Info', 'From City is required.');
    if (!tripDate) return showAlert('warning', 'Missing Info', 'Trip date is required.');
    if (!customerBudget.trim() || budget <= 0) return showAlert('warning', 'Invalid Budget', 'Please enter a valid customer budget.');

    setLoading(true);
    try {
      const data = {
        serviceType,
        bookingType: 'One Way',
        vehicleRequired: vehicleRequired || undefined,
        fromCity: fromCity.trim(),
        toCity: toCity.trim() || undefined,
        tripDate: tripDate.toISOString(),
        tripTime: tripTime ? `${String(tripTime.getHours()).padStart(2, '0')}:${String(tripTime.getMinutes()).padStart(2, '0')}` : undefined,
        passengers: serviceType === 'car' && passengers.trim() ? Number(passengers) : undefined,
        goodsType: serviceType === 'truck' && goodsType.trim() ? goodsType.trim() : undefined,
        estimatedWeight: serviceType === 'truck' && estimatedWeight.trim() ? Number(estimatedWeight) : undefined,
        needInsurance: serviceType === 'truck' ? needInsurance : undefined,
        needLabour: serviceType === 'truck' ? needLabour : undefined,
        labourCount: serviceType === 'truck' && needLabour && labourCount.trim() ? Number(labourCount) : undefined,
        customerBudget: budget,
        commission: commissionAmount,
        partnerEarning,
        urgency,
        reason: reason || undefined,
        notes: notes.trim() || undefined,
      };

      await createP2PBooking(data);
      setAlert({
        visible: true, type: 'success', title: 'Booking Shared!',
        message: 'Your booking has been posted to the P2P marketplace.',
        actions: [{ label: 'Done', variant: 'primary', onPress: () => { hideAlert(); navigation.navigate('MyPostingsScreen', { initialTab: 'bookings' }); } }],
      });
    } catch (err) {
      showAlert('error', 'Failed to Post', err?.response?.data?.error || err?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Share Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Service Type */}
          <View style={s.section}>
            <SectionHead icon="truck-fast-outline" color={C.purple} bg="#F3E8FF" title="Service Type" />
            <View style={s.chipRow}>
              {[{ value: 'truck', label: 'Truck', icon: 'truck' }, { value: 'car', label: 'Car', icon: 'car' }].map(opt => {
                const active = serviceType === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.typeChip, active && s.typeChipActive]} onPress={() => { setServiceType(opt.value); setVehicleRequired(''); }}>
                    <MCI name={opt.icon} size={20} color={active ? C.purple : C.muted} />
                    <Text style={[s.typeChipText, active && { color: C.purple }]}>{opt.label}</Text>
                    {active && <View style={[s.chipDot, { backgroundColor: C.purple }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Vehicle Required */}
          <View style={s.section}>
            <SectionHead icon="car-cog" color={C.blue} bg="#DBEAFE" title="Vehicle Required" />
            <View style={s.chipGrid}>
              {vehicleOptions.map(v => {
                const active = vehicleRequired === v;
                return (
                  <TouchableOpacity key={v} style={[s.optionChip, active && s.optionChipActive]} onPress={() => setVehicleRequired(active ? '' : v)}>
                    <Text style={[s.optionChipText, active && s.optionChipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Route & Date */}
          <View style={s.section}>
            <SectionHead icon="map-pin" color={C.brand} bg="#D1FAE5" title="Route & Schedule" feather />
            <View style={s.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>From City *</Text>
                <TextInput style={s.input} placeholder="e.g. Mumbai" placeholderTextColor={C.muted} value={fromCity} onChangeText={setFromCity} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>To City</Text>
                <TextInput style={s.input} placeholder="e.g. Delhi" placeholderTextColor={C.muted} value={toCity} onChangeText={setToCity} />
              </View>
            </View>

            <View style={[s.rowFields, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Trip Date *</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Icon name="calendar" size={16} color={C.muted} />
                  <Text style={[s.dateBtnText, tripDate && { color: C.text }]}>{tripDate ? fmtDate(tripDate) : 'Select date'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Trip Time</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowTimePicker(true)}>
                  <Icon name="clock" size={16} color={C.muted} />
                  <Text style={[s.dateBtnText, tripTime && { color: C.text }]}>{tripTime ? fmtTime(tripTime) : 'Optional'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Truck-specific: Goods & Requirements */}
          {serviceType === 'truck' && (
            <View style={s.section}>
              <SectionHead icon="package-variant" color={C.amber} bg="#FEF3C7" title="Goods Details" />
              <Text style={s.fieldLabel}>Goods Type</Text>
              <TextInput style={s.input} placeholder="e.g. Furniture, Electronics" placeholderTextColor={C.muted} value={goodsType} onChangeText={setGoodsType} />

              <Text style={[s.fieldLabel, { marginTop: 12 }]}>Estimated Weight (kg)</Text>
              <TextInput style={s.input} placeholder="e.g. 5000" placeholderTextColor={C.muted} value={estimatedWeight} onChangeText={setEstimatedWeight} keyboardType="number-pad" />

              <View style={[s.switchRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Need Insurance</Text>
                  <Text style={s.switchSub}>Transit insurance for goods</Text>
                </View>
                <Switch value={needInsurance} onValueChange={setNeedInsurance} trackColor={{ false: C.border, true: C.brand + '55' }} thumbColor={needInsurance ? C.brand : '#f4f4f5'} />
              </View>

              <View style={[s.switchRow, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Need Labour</Text>
                  <Text style={s.switchSub}>Loading / unloading help</Text>
                </View>
                <Switch value={needLabour} onValueChange={setNeedLabour} trackColor={{ false: C.border, true: C.brand + '55' }} thumbColor={needLabour ? C.brand : '#f4f4f5'} />
              </View>
              {needLabour && (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.fieldLabel}>Number of Labourers</Text>
                  <TextInput style={s.input} placeholder="e.g. 2" placeholderTextColor={C.muted} value={labourCount} onChangeText={setLabourCount} keyboardType="number-pad" />
                </View>
              )}
            </View>
          )}

          {/* Car-specific: Passengers */}
          {serviceType === 'car' && (
            <View style={s.section}>
              <SectionHead icon="account-group" color={C.blue} bg="#DBEAFE" title="Passenger Details" />
              <Text style={s.fieldLabel}>Number of Passengers</Text>
              <TextInput style={s.input} placeholder="e.g. 4" placeholderTextColor={C.muted} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />
            </View>
          )}

          {/* Budget & Commission */}
          <View style={s.section}>
            <SectionHead icon="currency-inr" color={C.amber} bg="#FEF3C7" title="Budget & Commission" />
            <Text style={s.fieldLabel}>Customer Budget *</Text>
            <View style={s.priceRow}>
              <View style={s.pricePrefix}><Text style={s.pricePrefixText}>{'\u20B9'}</Text></View>
              <TextInput style={[s.input, s.priceInput]} placeholder="0" placeholderTextColor={C.muted} value={customerBudget} onChangeText={setCustomerBudget} keyboardType="number-pad" />
            </View>

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Your Commission (%)</Text>
            <View style={s.rowFields}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="10" placeholderTextColor={C.muted} value={commissionPercent} onChangeText={setCommissionPercent} keyboardType="number-pad" />
              <View style={[s.commBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.brand }}>{'\u20B9'}{commissionAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Earnings Preview */}
            {budget > 0 && (
              <View style={s.previewCard}>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Customer Budget</Text>
                  <Text style={s.previewValue}>{'\u20B9'}{budget.toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Your Commission ({commPct}%)</Text>
                  <Text style={[s.previewValue, { color: C.brand }]}>{'\u20B9'}{commissionAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.previewDivider} />
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Partner Earning</Text>
                  <Text style={s.previewValue}>{'\u20B9'}{partnerEarning.toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.previewRow}>
                  <Text style={[s.previewLabel, { fontSize: 11 }]}>Platform Fee (5%)</Text>
                  <Text style={[s.previewValue, { fontSize: 11, color: C.muted }]}>-{'\u20B9'}{platformFee.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Urgency */}
          <View style={s.section}>
            <SectionHead icon="alert-circle" color={C.red} bg="#FEE2E2" title="Urgency" feather />
            <View style={s.chipRow}>
              {URGENCY_OPTIONS.map(opt => {
                const active = urgency === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.urgencyChip, { borderColor: active ? opt.color : C.border, backgroundColor: active ? opt.bg : C.surface }]} onPress={() => setUrgency(opt.value)}>
                    <Text style={[s.urgencyLabel, { color: active ? opt.color : C.muted }]}>{opt.label}</Text>
                    <Text style={[s.urgencyDesc, { color: active ? opt.color : C.muted }]}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reason */}
          <View style={s.section}>
            <SectionHead icon="help-circle" color={C.blue} bg="#DBEAFE" title="Reason for Sharing" feather />
            <View style={s.chipGrid}>
              {REASONS.map(r => {
                const active = reason === r;
                return (
                  <TouchableOpacity key={r} style={[s.optionChip, active && s.optionChipActive]} onPress={() => setReason(active ? '' : r)}>
                    <Text style={[s.optionChipText, active && s.optionChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={s.section}>
            <SectionHead icon="file-text" color={C.sub} bg="#F1F5F9" title="Additional Notes" feather />
            <TextInput style={[s.input, s.textArea]} placeholder="Any special requirements, route details, or remarks..." placeholderTextColor={C.muted} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
          </View>

          {/* Submit */}
          <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : (
              <><Icon name="share-2" size={20} color="#fff" /><Text style={s.submitBtnText}>Share Booking</Text></>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={tripDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={new Date()} onChange={onDateChange} />
      )}
      {showTimePicker && (
        <DateTimePicker value={tripTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
      )}

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} actions={alert.actions} />
    </SafeAreaView>
  );
}

function SectionHead({ icon, color, bg, title, feather }) {
  const IC = feather ? Icon : MCI;
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, { backgroundColor: bg }]}><IC name={icon} size={16} color={color} /></View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.purple },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scroll: { padding: 16, gap: 14 },

  section: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },

  chipRow: { flexDirection: 'row', gap: 10 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface },
  typeChipActive: { borderColor: C.purple, backgroundColor: '#F3E8FF' },
  typeChipText: { fontSize: 14, fontWeight: '700', color: C.muted },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.purple },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface },
  optionChipActive: { borderColor: C.purple, backgroundColor: '#F3E8FF' },
  optionChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  optionChipTextActive: { color: C.purple },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  textArea: { height: 90, textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: 12, marginTop: 4 },

  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  dateBtnText: { fontSize: 14, color: C.muted },

  priceRow: { flexDirection: 'row', alignItems: 'stretch' },
  pricePrefix: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 14, borderRightWidth: 0 },
  pricePrefixText: { fontSize: 16, fontWeight: '700', color: C.sub },
  priceInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

  commBadge: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.brand + '33' },

  previewCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginTop: 14, gap: 8, borderWidth: 1, borderColor: C.border },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { fontSize: 13, color: C.sub },
  previewValue: { fontSize: 14, fontWeight: '700', color: C.text },
  previewDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  switchSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  urgencyChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2, gap: 4 },
  urgencyLabel: { fontSize: 14, fontWeight: '700' },
  urgencyDesc: { fontSize: 10 },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.purple, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: C.border, marginTop: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
});

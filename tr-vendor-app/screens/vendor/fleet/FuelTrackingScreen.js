import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFleetFuel, addFleetFuel } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#F59E0B', green: '#10B981',
  orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Other'];
const PAY_MODES = ['Cash', 'UPI', 'Card', 'Fleet Card', 'Credit', 'Other'];

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'; }

export default function FuelTrackingScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('records');

  // Add modal
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vendorFleetId: '', fuelDate: new Date(), fuelType: 'Petrol', quantity: '', pricePerUnit: '', odometerReading: '', fuelStation: '', paymentMode: 'Cash', notes: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async () => {
    try {
      const res = await getFleetFuel();
      setVehicles(res?.vehicles || []);
      setRecords(res?.fuelRecords || []);
      setSummary(res?.summary || {});
    } catch (err) {
      showAlert('error', 'Load Failed', 'Could not load fuel data');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAdd = () => {
    setForm({ vendorFleetId: vehicles[0]?.id || '', fuelDate: new Date(), fuelType: 'Petrol', quantity: '', pricePerUnit: '', odometerReading: '', fuelStation: '', paymentMode: 'Cash', notes: '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorFleetId) return showAlert('warning', 'Required', 'Select a vehicle');
    if (!form.quantity || !form.pricePerUnit) return showAlert('warning', 'Required', 'Quantity and price are required');
    setSaving(true);
    try {
      const qty = parseFloat(form.quantity);
      const ppu = parseFloat(form.pricePerUnit);
      await addFleetFuel({
        vendorFleetId: form.vendorFleetId,
        fuelDate: form.fuelDate.toISOString(),
        fuelType: form.fuelType,
        quantity: qty,
        pricePerUnit: ppu,
        totalCost: qty * ppu,
        odometerReading: form.odometerReading || null,
        fuelStation: form.fuelStation || null,
        paymentMode: form.paymentMode,
        notes: form.notes || null,
      });
      setModal(false);
      showAlert('success', 'Added!', 'Fuel record saved');
      fetchData();
    } catch (err) {
      showAlert('error', 'Failed', 'Could not save fuel record');
    } finally { setSaving(false); }
  };

  const totalCost = form.quantity && form.pricePerUnit ? (parseFloat(form.quantity) * parseFloat(form.pricePerUnit)).toFixed(2) : '0';

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color="#fff" /></TouchableOpacity><Text style={s.headerTitle}>Fuel Tracking</Text></View>
      <View style={s.centered}><ActivityIndicator size="large" color={C.brand} /></View>
    </SafeAreaView>
  );

  // Group fuel by vehicle
  const vehicleFuel = vehicles.map(v => {
    const vRecords = records.filter(r => r.vehicleId === v.id);
    const spent = vRecords.reduce((s, r) => s + r.totalCost, 0);
    return { ...v, records: vRecords.length, spent };
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Fuel Tracking</Text>
          <Text style={s.headerSub}>Monitor fuel expenses</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={s.addBtn}><Icon name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label: 'Total Spent', value: `\u20B9${fmt(summary.totalSpent)}`, color: '#fff' },
          { label: 'Liters', value: fmt(summary.totalLiters), color: '#fff' },
          { label: 'Avg/L', value: `\u20B9${summary.avgPerLiter?.toFixed(1) || 0}`, color: '#fff' },
          { label: 'Records', value: summary.recordsCount || 0, color: '#fff' },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'records' && s.tabActive]} onPress={() => setTab('records')}>
          <Text style={[s.tabText, tab === 'records' && s.tabTextActive]}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'vehicles' && s.tabActive]} onPress={() => setTab('vehicles')}>
          <Text style={[s.tabText, tab === 'vehicles' && s.tabTextActive]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}>
        {tab === 'records' ? (
          records.length > 0 ? records.map(r => (
            <View key={r.id} style={s.recordCard}>
              <View style={s.recordTop}>
                <View style={[s.fuelIcon, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="gas-station" size={18} color={C.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recordVehicle} numberOfLines={1}>{r.vehicleName}</Text>
                  <Text style={s.recordMeta}>{fmtDate(r.fuelDate)}  ·  {r.fuelType || 'Fuel'}  ·  {r.paymentMode || '-'}</Text>
                </View>
                <Text style={s.recordCost}>{'\u20B9'}{fmt(r.totalCost)}</Text>
              </View>
              <View style={s.recordDetails}>
                <View style={s.recordDetail}><Text style={s.detailLabel}>Qty</Text><Text style={s.detailVal}>{r.quantity}L</Text></View>
                <View style={s.recordDetail}><Text style={s.detailLabel}>Rate</Text><Text style={s.detailVal}>{'\u20B9'}{r.pricePerUnit}/L</Text></View>
                {r.odometerReading ? <View style={s.recordDetail}><Text style={s.detailLabel}>ODO</Text><Text style={s.detailVal}>{r.odometerReading} km</Text></View> : null}
                {r.fuelStation ? <View style={s.recordDetail}><Text style={s.detailLabel}>Station</Text><Text style={s.detailVal}>{r.fuelStation}</Text></View> : null}
              </View>
              {r.notes ? <Text style={s.recordNotes}>{r.notes}</Text> : null}
            </View>
          )) : (
            <View style={s.emptyState}><MaterialCommunityIcons name="gas-station" size={36} color={C.muted} /><Text style={s.emptyTitle}>No fuel records</Text><Text style={s.emptyMsg}>Tap + to add your first fuel entry</Text></View>
          )
        ) : (
          vehicleFuel.map(v => (
            <View key={v.id} style={s.recordCard}>
              <View style={s.recordTop}>
                <View style={[s.fuelIcon, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="car" size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recordVehicle}>{v.vehicleName}</Text>
                  <Text style={s.recordMeta}>{v.registrationNumber || 'No Reg'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.recordCost}>{'\u20B9'}{fmt(v.spent)}</Text>
                  <Text style={s.recordMeta}>{v.records} entries</Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add Fuel Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView style={s.modalScroll} contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Fuel Entry</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Icon name="x" size={20} color={C.muted} /></TouchableOpacity>
            </View>

            <Text style={s.formLabel}>VEHICLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {vehicles.map(v => (
                <TouchableOpacity key={v.id} style={[s.chipBtn, form.vendorFleetId === v.id && s.chipActive]} onPress={() => setForm(f => ({ ...f, vendorFleetId: v.id }))}>
                  <Text style={[s.chipText, form.vendorFleetId === v.id && s.chipTextActive]} numberOfLines={1}>{v.vehicleName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.formLabel}>DATE</Text>
            <TouchableOpacity style={s.dateInput} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={16} color={C.muted} /><Text style={s.dateText}>{form.fuelDate.toLocaleDateString('en-IN')}</Text>
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={form.fuelDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, fuelDate: d })); }} />}

            <Text style={s.formLabel}>FUEL TYPE</Text>
            <View style={s.chipsRow}>
              {FUEL_TYPES.map(ft => (
                <TouchableOpacity key={ft} style={[s.chipBtn, form.fuelType === ft && s.chipActive]} onPress={() => setForm(f => ({ ...f, fuelType: ft }))}>
                  <Text style={[s.chipText, form.fuelType === ft && s.chipTextActive]}>{ft}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.row2}>
              <View style={s.halfField}><Text style={s.formLabel}>QUANTITY (L)</Text><TextInput style={s.textInput} keyboardType="numeric" value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} placeholder="0" placeholderTextColor={C.muted} /></View>
              <View style={s.halfField}><Text style={s.formLabel}>PRICE/LITRE</Text><TextInput style={s.textInput} keyboardType="numeric" value={form.pricePerUnit} onChangeText={v => setForm(f => ({ ...f, pricePerUnit: v }))} placeholder="0" placeholderTextColor={C.muted} /></View>
            </View>

            <View style={s.totalBox}><Text style={s.totalLabel}>Total Cost</Text><Text style={s.totalVal}>{'\u20B9'}{totalCost}</Text></View>

            <Text style={s.formLabel}>ODOMETER (KM)</Text>
            <TextInput style={s.textInput} keyboardType="numeric" value={form.odometerReading} onChangeText={v => setForm(f => ({ ...f, odometerReading: v }))} placeholder="Optional" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>PAYMENT MODE</Text>
            <View style={s.chipsRow}>
              {PAY_MODES.map(pm => (
                <TouchableOpacity key={pm} style={[s.chipBtn, form.paymentMode === pm && s.chipActive]} onPress={() => setForm(f => ({ ...f, paymentMode: pm }))}>
                  <Text style={[s.chipText, form.paymentMode === pm && s.chipTextActive]}>{pm}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.formLabel}>FUEL STATION</Text>
            <TextInput style={s.textInput} value={form.fuelStation} onChangeText={v => setForm(f => ({ ...f, fuelStation: v }))} placeholder="Optional" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>NOTES</Text>
            <TextInput style={[s.textInput, { height: 60, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" placeholderTextColor={C.muted} multiline />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="check" size={18} color="#fff" /><Text style={s.saveBtnText}>Save Entry</Text></>}
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#B45309' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#B45309', paddingBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: C.bg },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  tabActive: { backgroundColor: '#B45309' },
  tabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  tabTextActive: { color: '#fff' },

  scroll: { padding: 16, gap: 10 },
  recordCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  recordTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fuelIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recordVehicle: { fontSize: 13, fontWeight: '700', color: C.text },
  recordMeta: { fontSize: 10, color: C.muted, marginTop: 1 },
  recordCost: { fontSize: 15, fontWeight: '800', color: C.orange },
  recordDetails: { flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  recordDetail: {},
  detailLabel: { fontSize: 9, color: C.muted, textTransform: 'uppercase' },
  detailVal: { fontSize: 12, fontWeight: '600', color: C.text, marginTop: 1 },
  recordNotes: { fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 8 },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyMsg: { fontSize: 13, color: C.muted, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalScroll: { marginTop: 60, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },

  formLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#FEF3C7', borderColor: C.orange },
  chipText: { fontSize: 12, color: C.subtext },
  chipTextActive: { color: '#B45309', fontWeight: '700' },

  row2: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dateText: { fontSize: 14, color: C.text },

  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 12 },
  totalLabel: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  totalVal: { fontSize: 18, fontWeight: '800', color: '#92400E' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#B45309', paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

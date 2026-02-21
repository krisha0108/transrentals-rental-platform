import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFleetService, addFleetService } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', green: '#10B981', emerald: '#059669',
  orange: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
};

const SERVICE_TYPES = [
  'Oil Change', 'Air Filter', 'Brake Pads', 'Tyre Rotation', 'Tyre Replacement',
  'Coolant Change', 'Transmission Fluid', 'Battery Replacement', 'AC Service',
  'Full Service', 'Wheel Alignment', 'Clutch Repair', 'Engine Repair', 'Body Work', 'Other',
];

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }

export default function ServiceMaintenanceScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('history');

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vendorFleetId: '', serviceType: 'Oil Change', serviceDate: new Date(), description: '', odometerReading: '', cost: '', serviceProvider: '', notes: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async () => {
    try {
      const res = await getFleetService();
      setVehicles(res?.vehicles || []);
      setRecords(res?.maintenanceRecords || []);
      setSummary(res?.summary || {});
    } catch (err) {
      showAlert('error', 'Load Failed', 'Could not load service data');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAdd = () => {
    setForm({ vendorFleetId: vehicles[0]?.id || '', serviceType: 'Oil Change', serviceDate: new Date(), description: '', odometerReading: '', cost: '', serviceProvider: '', notes: '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorFleetId) return showAlert('warning', 'Required', 'Select a vehicle');
    if (!form.cost) return showAlert('warning', 'Required', 'Cost is required');
    setSaving(true);
    try {
      await addFleetService({
        vendorFleetId: form.vendorFleetId,
        serviceType: form.serviceType,
        serviceDate: form.serviceDate.toISOString(),
        description: form.description || null,
        odometerReading: form.odometerReading || null,
        cost: parseFloat(form.cost),
        serviceProvider: form.serviceProvider || null,
        notes: form.notes || null,
      });
      setModal(false);
      showAlert('success', 'Recorded!', 'Service record saved');
      fetchData();
    } catch (err) {
      showAlert('error', 'Failed', 'Could not save service record');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color="#fff" /></TouchableOpacity><Text style={s.headerTitle}>Service & Maintenance</Text></View>
      <View style={s.centered}><ActivityIndicator size="large" color={C.emerald} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Service & Maintenance</Text>
          <Text style={s.headerSub}>Track servicing & repairs</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={s.addBtn}><Icon name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {[
          { label: 'Vehicles', value: summary.totalVehicles || 0 },
          { label: 'Records', value: summary.totalRecords || 0 },
          { label: 'Total Spent', value: `\u20B9${fmt(summary.totalSpent)}` },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={s.statVal}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'history' && s.tabActive]} onPress={() => setTab('history')}><Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>History</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'vehicles' && s.tabActive]} onPress={() => setTab('vehicles')}><Text style={[s.tabText, tab === 'vehicles' && s.tabTextActive]}>Vehicles</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.emerald]} />}>
        {tab === 'history' ? (
          records.length > 0 ? records.map(r => (
            <View key={r.id} style={s.recCard}>
              <View style={s.recTop}>
                <View style={[s.recIcon, { backgroundColor: '#D1FAE5' }]}>
                  <MaterialCommunityIcons name="wrench" size={18} color={C.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recType}>{r.serviceType}</Text>
                  <Text style={s.recVehicle}>{r.vehicleName}  ·  {fmtDate(r.serviceDate)}</Text>
                </View>
                <Text style={s.recCost}>{'\u20B9'}{fmt(r.cost)}</Text>
              </View>
              <View style={s.recDetails}>
                {r.serviceProvider ? <View style={s.recDetail}><Text style={s.detailLabel}>Provider</Text><Text style={s.detailVal}>{r.serviceProvider}</Text></View> : null}
                {r.odometerReading ? <View style={s.recDetail}><Text style={s.detailLabel}>ODO</Text><Text style={s.detailVal}>{r.odometerReading} km</Text></View> : null}
              </View>
              {r.description ? <Text style={s.recDesc}>{r.description}</Text> : null}
              {r.notes ? <Text style={s.recNotes}>{r.notes}</Text> : null}
            </View>
          )) : (
            <View style={s.emptyState}><MaterialCommunityIcons name="wrench" size={36} color={C.muted} /><Text style={s.emptyTitle}>No service records</Text><Text style={s.emptyMsg}>Tap + to record a service</Text></View>
          )
        ) : (
          vehicles.map(v => (
            <View key={v.id} style={s.recCard}>
              <View style={s.recTop}>
                <View style={[s.recIcon, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="car" size={18} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recType}>{v.vehicleName}</Text>
                  <Text style={s.recVehicle}>{v.registrationNumber || 'No Reg'}  ·  {v.service || ''}</Text>
                </View>
              </View>
              <View style={s.vehicleServiceInfo}>
                <View style={s.vsiItem}>
                  <Text style={s.vsiLabel}>Last Service</Text>
                  <Text style={s.vsiVal}>{v.lastServiceDate ? fmtDate(v.lastServiceDate) : 'Never'}</Text>
                </View>
                <View style={s.vsiItem}>
                  <Text style={s.vsiLabel}>Fitness Valid</Text>
                  <Text style={[s.vsiVal, v.fitnessValidity && new Date(v.fitnessValidity) < new Date() ? { color: C.red } : {}]}>
                    {v.fitnessValidity ? fmtDate(v.fitnessValidity) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Record Service Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView style={s.modalScroll} contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Record Service</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Icon name="x" size={20} color={C.muted} /></TouchableOpacity>
            </View>

            <Text style={s.formLabel}>VEHICLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {vehicles.map(v => (
                <TouchableOpacity key={v.id} style={[s.chipBtn, form.vendorFleetId === v.id && s.chipActive]} onPress={() => setForm(f => ({ ...f, vendorFleetId: v.id }))}>
                  <Text style={[s.chipText, form.vendorFleetId === v.id && s.chipTextActive]} numberOfLines={1}>{v.vehicleName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.formLabel}>SERVICE TYPE</Text>
            <View style={s.chipsRow}>
              {SERVICE_TYPES.map(st => (
                <TouchableOpacity key={st} style={[s.chipBtn, form.serviceType === st && s.chipActive]} onPress={() => setForm(f => ({ ...f, serviceType: st }))}>
                  <Text style={[s.chipText, form.serviceType === st && s.chipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.formLabel}>DATE</Text>
            <TouchableOpacity style={s.dateInput} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={16} color={C.muted} /><Text style={s.dateText}>{form.serviceDate.toLocaleDateString('en-IN')}</Text>
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={form.serviceDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, serviceDate: d })); }} />}

            <Text style={s.formLabel}>COST *</Text>
            <TextInput style={s.textInput} keyboardType="numeric" value={form.cost} onChangeText={v => setForm(f => ({ ...f, cost: v }))} placeholder="Amount in rupees" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>SERVICE PROVIDER</Text>
            <TextInput style={s.textInput} value={form.serviceProvider} onChangeText={v => setForm(f => ({ ...f, serviceProvider: v }))} placeholder="Mechanic / Workshop name" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>ODOMETER (KM)</Text>
            <TextInput style={s.textInput} keyboardType="numeric" value={form.odometerReading} onChangeText={v => setForm(f => ({ ...f, odometerReading: v }))} placeholder="Optional" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>DESCRIPTION</Text>
            <TextInput style={[s.textInput, { height: 60, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="What was done?" placeholderTextColor={C.muted} multiline />

            <Text style={s.formLabel}>NOTES</Text>
            <TextInput style={[s.textInput, { height: 60, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" placeholderTextColor={C.muted} multiline />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="check" size={18} color="#fff" /><Text style={s.saveBtnText}>Save Record</Text></>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.emerald },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.emerald, paddingBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  tabActive: { backgroundColor: C.emerald },
  tabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  tabTextActive: { color: '#fff' },

  scroll: { padding: 16, gap: 10 },
  recCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  recTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recType: { fontSize: 14, fontWeight: '700', color: C.text },
  recVehicle: { fontSize: 11, color: C.muted, marginTop: 1 },
  recCost: { fontSize: 15, fontWeight: '800', color: C.emerald },
  recDetails: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  recDetail: {},
  detailLabel: { fontSize: 9, color: C.muted, textTransform: 'uppercase' },
  detailVal: { fontSize: 12, fontWeight: '600', color: C.text, marginTop: 1 },
  recDesc: { fontSize: 12, color: C.subtext, marginTop: 8 },
  recNotes: { fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 },

  vehicleServiceInfo: { flexDirection: 'row', gap: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  vsiItem: {},
  vsiLabel: { fontSize: 9, color: C.muted, textTransform: 'uppercase' },
  vsiVal: { fontSize: 12, fontWeight: '600', color: C.text, marginTop: 1 },

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
  chipActive: { backgroundColor: '#D1FAE5', borderColor: C.emerald },
  chipText: { fontSize: 12, color: C.subtext },
  chipTextActive: { color: '#065F46', fontWeight: '700' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dateText: { fontSize: 14, color: C.text },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.emerald, paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

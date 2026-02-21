import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFleetIncidents, addFleetIncident } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', red: '#EF4444', orange: '#F59E0B',
  green: '#10B981', blue: '#3B82F6', purple: '#8B5CF6',
};

const INCIDENT_TYPES = [
  { key: 'accident', label: 'Accident', icon: 'car-crash' },
  { key: 'breakdown', label: 'Breakdown', icon: 'engine-off' },
  { key: 'flat_tyre', label: 'Flat Tyre', icon: 'tire' },
  { key: 'engine_failure', label: 'Engine Failure', icon: 'engine' },
  { key: 'electrical', label: 'Electrical', icon: 'lightning-bolt' },
  { key: 'theft', label: 'Theft', icon: 'lock-alert' },
  { key: 'vandalism', label: 'Vandalism', icon: 'hammer' },
  { key: 'weather', label: 'Weather', icon: 'weather-pouring' },
  { key: 'road_damage', label: 'Road Damage', icon: 'road' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const SEVERITY_CFG = {
  MINOR:    { label: 'Minor',    color: '#10B981', bg: '#D1FAE5' },
  MODERATE: { label: 'Moderate', color: '#F59E0B', bg: '#FEF3C7' },
  MAJOR:    { label: 'Major',    color: '#EF4444', bg: '#FEE2E2' },
  CRITICAL: { label: 'Critical', color: '#991B1B', bg: '#FEE2E2' },
};

const STATUS_CFG = {
  OPEN:     { label: 'Open',     color: '#EF4444', bg: '#FEE2E2' },
  RESOLVED: { label: 'Resolved', color: '#10B981', bg: '#D1FAE5' },
};

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }

export default function IncidentsScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('incidents');

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vendorFleetId: '', incidentDate: new Date(), incidentType: 'accident', severity: 'MINOR', location: '', description: '', estimatedCost: '', notes: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async () => {
    try {
      const res = await getFleetIncidents();
      setVehicles(res?.vehicles || []);
      setIncidents(res?.incidents || []);
      setSummary(res?.summary || {});
    } catch (err) {
      showAlert('error', 'Load Failed', 'Could not load incidents');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAdd = () => {
    setForm({ vendorFleetId: vehicles[0]?.id || '', incidentDate: new Date(), incidentType: 'accident', severity: 'MINOR', location: '', description: '', estimatedCost: '', notes: '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorFleetId) return showAlert('warning', 'Required', 'Select a vehicle');
    if (!form.description.trim()) return showAlert('warning', 'Required', 'Description is required');
    setSaving(true);
    try {
      await addFleetIncident({
        vendorFleetId: form.vendorFleetId,
        incidentDate: form.incidentDate.toISOString(),
        incidentType: form.incidentType,
        severity: form.severity,
        location: form.location || null,
        description: form.description,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
        notes: form.notes || null,
      });
      setModal(false);
      showAlert('success', 'Reported!', 'Incident reported successfully');
      fetchData();
    } catch (err) {
      showAlert('error', 'Failed', 'Could not report incident');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color="#fff" /></TouchableOpacity><Text style={s.headerTitle}>Incidents</Text></View>
      <View style={s.centered}><ActivityIndicator size="large" color={C.red} /></View>
    </SafeAreaView>
  );

  const vehicleIncidents = vehicles.map(v => {
    const vInc = incidents.filter(i => i.vehicleId === v.id);
    return { ...v, count: vInc.length, openCount: vInc.filter(i => i.status === 'OPEN').length };
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Incidents</Text>
          <Text style={s.headerSub}>Report & track vehicle incidents</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={s.addBtn}><Icon name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {[
          { label: 'Total', value: summary.total || 0 },
          { label: 'Open', value: summary.open || 0 },
          { label: 'Resolved', value: summary.resolved || 0 },
          { label: 'Est. Cost', value: `\u20B9${fmt(summary.totalCost)}` },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={s.statVal}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'incidents' && s.tabActive]} onPress={() => setTab('incidents')}><Text style={[s.tabText, tab === 'incidents' && s.tabTextActive]}>All Incidents</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'vehicles' && s.tabActive]} onPress={() => setTab('vehicles')}><Text style={[s.tabText, tab === 'vehicles' && s.tabTextActive]}>Vehicles</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.red]} />}>
        {tab === 'incidents' ? (
          incidents.length > 0 ? incidents.map(inc => {
            const sev = SEVERITY_CFG[inc.severity] || SEVERITY_CFG.MINOR;
            const st = STATUS_CFG[inc.status] || STATUS_CFG.OPEN;
            const typeInfo = INCIDENT_TYPES.find(t => t.key === inc.incidentType) || INCIDENT_TYPES[9];
            return (
              <View key={inc.id} style={s.incCard}>
                <View style={s.incTop}>
                  <View style={[s.incIcon, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name={typeInfo.icon} size={18} color={C.red} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.incType}>{typeInfo.label}</Text>
                    <Text style={s.incVehicle}>{inc.vehicleName}  ·  {fmtDate(inc.incidentDate)}</Text>
                  </View>
                  <View style={[s.sevBadge, { backgroundColor: sev.bg }]}>
                    <Text style={[s.sevText, { color: sev.color }]}>{sev.label}</Text>
                  </View>
                </View>
                <Text style={s.incDesc}>{inc.description}</Text>
                <View style={s.incBottom}>
                  <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                    <View style={[s.statusDot, { backgroundColor: st.color }]} />
                    <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  {inc.location ? <Text style={s.incLocation}>{inc.location}</Text> : null}
                  {inc.estimatedCost ? <Text style={s.incCost}>{'\u20B9'}{fmt(inc.estimatedCost)}</Text> : null}
                </View>
              </View>
            );
          }) : (
            <View style={s.emptyState}><MaterialCommunityIcons name="shield-check" size={36} color={C.green} /><Text style={s.emptyTitle}>No incidents reported</Text><Text style={s.emptyMsg}>All clear! Tap + to report an incident</Text></View>
          )
        ) : (
          vehicleIncidents.map(v => (
            <View key={v.id} style={s.incCard}>
              <View style={s.incTop}>
                <View style={[s.incIcon, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="car" size={18} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.incType}>{v.vehicleName}</Text>
                  <Text style={s.incVehicle}>{v.registrationNumber || 'No Reg'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.incCost}>{v.count} incidents</Text>
                  {v.openCount > 0 && <Text style={[s.incLocation, { color: C.red }]}>{v.openCount} open</Text>}
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Report Incident Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView style={s.modalScroll} contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Report Incident</Text>
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

            <Text style={s.formLabel}>INCIDENT TYPE</Text>
            <View style={s.chipsRow}>
              {INCIDENT_TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[s.chipBtn, form.incidentType === t.key && s.chipActive]} onPress={() => setForm(f => ({ ...f, incidentType: t.key }))}>
                  <Text style={[s.chipText, form.incidentType === t.key && s.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.formLabel}>DATE</Text>
            <TouchableOpacity style={s.dateInput} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={16} color={C.muted} /><Text style={s.dateText}>{form.incidentDate.toLocaleDateString('en-IN')}</Text>
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={form.incidentDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, incidentDate: d })); }} />}

            <Text style={s.formLabel}>SEVERITY</Text>
            <View style={s.chipsRow}>
              {Object.entries(SEVERITY_CFG).map(([key, cfg]) => (
                <TouchableOpacity key={key} style={[s.chipBtn, form.severity === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]} onPress={() => setForm(f => ({ ...f, severity: key }))}>
                  <Text style={[s.chipText, form.severity === key && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.formLabel}>DESCRIPTION *</Text>
            <TextInput style={[s.textInput, { height: 80, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Describe what happened..." placeholderTextColor={C.muted} multiline />

            <Text style={s.formLabel}>LOCATION</Text>
            <TextInput style={s.textInput} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} placeholder="Where did it happen?" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>ESTIMATED COST</Text>
            <TextInput style={s.textInput} keyboardType="numeric" value={form.estimatedCost} onChangeText={v => setForm(f => ({ ...f, estimatedCost: v }))} placeholder="Optional" placeholderTextColor={C.muted} />

            <Text style={s.formLabel}>NOTES</Text>
            <TextInput style={[s.textInput, { height: 60, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" placeholderTextColor={C.muted} multiline />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="alert-triangle" size={18} color="#fff" /><Text style={s.saveBtnText}>Report Incident</Text></>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#B91C1C' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#B91C1C', paddingBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  tabActive: { backgroundColor: '#B91C1C' },
  tabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  tabTextActive: { color: '#fff' },

  scroll: { padding: 16, gap: 10 },
  incCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  incTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  incIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  incType: { fontSize: 14, fontWeight: '700', color: C.text },
  incVehicle: { fontSize: 11, color: C.muted, marginTop: 1 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sevText: { fontSize: 10, fontWeight: '700' },
  incDesc: { fontSize: 12, color: C.subtext, marginTop: 8, lineHeight: 18 },
  incBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  incLocation: { fontSize: 11, color: C.muted },
  incCost: { fontSize: 12, fontWeight: '700', color: C.red, marginLeft: 'auto' },

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
  chipActive: { backgroundColor: '#FEE2E2', borderColor: C.red },
  chipText: { fontSize: 12, color: C.subtext },
  chipTextActive: { color: '#991B1B', fontWeight: '700' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dateText: { fontSize: 14, color: C.text },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#B91C1C', paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFleetDocuments, uploadFleetDocument } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#3B82F6', green: '#10B981',
  orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', emerald: '#059669',
};

const DOC_CFG = {
  INSURANCE:  { label: 'Insurance',     icon: 'shield-check',    color: '#3B82F6', bg: '#DBEAFE', needsValidity: true, providerLabel: 'Provider' },
  FITNESS:    { label: 'Fitness Cert',   icon: 'certificate',     color: '#10B981', bg: '#D1FAE5', needsValidity: true, providerLabel: null },
  PERMIT:     { label: 'Permit',         icon: 'card-account-details', color: '#8B5CF6', bg: '#F3E8FF', needsValidity: false, providerLabel: 'Permit Type' },
  RC:         { label: 'RC',             icon: 'file-document',   color: '#F59E0B', bg: '#FEF3C7', needsValidity: false, providerLabel: 'Reg. Number' },
};

const STATUS_CFG = {
  VALID:        { label: 'Valid',   color: '#10B981', bg: '#D1FAE5' },
  EXPIRED:      { label: 'Expired', color: '#EF4444', bg: '#FEE2E2' },
  NOT_UPLOADED: { label: 'Missing', color: '#94A3B8', bg: '#F1F5F9' },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }

export default function FleetDocumentsScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({ total: 0, valid: 0, expired: 0, missing: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal
  const [modal, setModal] = useState(false);
  const [selVehicle, setSelVehicle] = useState(null);
  const [selDocType, setSelDocType] = useState('INSURANCE');
  const [validity, setValidity] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [provider, setProvider] = useState('');
  const [saving, setSaving] = useState(false);

  // Alert
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async () => {
    try {
      const res = await getFleetDocuments();
      setVehicles(res?.vehicles || []);
      setSummary(res?.summary || { total: 0, valid: 0, expired: 0, missing: 0 });
    } catch (err) {
      showAlert('error', 'Load Failed', 'Could not load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAddModal = (vehicle, docType) => {
    setSelVehicle(vehicle);
    setSelDocType(docType);
    setValidity(new Date());
    setProvider('');
    setModal(true);
  };

  const handleSave = async () => {
    const cfg = DOC_CFG[selDocType];
    if (cfg.needsValidity && !validity) return showAlert('warning', 'Required', 'Please select validity date');
    if (cfg.providerLabel && !provider.trim()) return showAlert('warning', 'Required', `Please enter ${cfg.providerLabel}`);

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('vendorFleetId', selVehicle.id);
      formData.append('documentType', selDocType);
      if (cfg.needsValidity) formData.append('validity', validity.toISOString());
      if (provider.trim()) formData.append('provider', provider.trim());

      await uploadFleetDocument(formData);
      setModal(false);
      showAlert('success', 'Saved!', 'Document updated successfully');
      fetchData();
    } catch (err) {
      showAlert('error', 'Failed', 'Could not save document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Vehicle Documents</Text>
      </View>
      <View style={s.centered}><ActivityIndicator size="large" color={C.brand} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Vehicle Documents</Text>
          <Text style={s.headerSub}>Insurance, Fitness, Permit & RC</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <Icon name="refresh-cw" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label: 'Total', value: summary.total, color: C.brand },
          { label: 'Valid', value: summary.valid, color: C.green },
          { label: 'Expired', value: summary.expired, color: C.red },
          { label: 'Missing', value: summary.missing, color: C.muted },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}
      >
        {vehicles.map(vehicle => (
          <View key={vehicle.id} style={s.card}>
            <View style={s.vehicleHeader}>
              <View style={[s.vehicleIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="car" size={18} color={C.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.vehicleName} numberOfLines={1}>{vehicle.vehicleName}</Text>
                <Text style={s.vehicleReg}>{vehicle.registrationNumber || 'No Reg.'}</Text>
              </View>
            </View>

            <View style={s.docsGrid}>
              {vehicle.documents.map(doc => {
                const cfg = DOC_CFG[doc.type];
                const st = STATUS_CFG[doc.status];
                return (
                  <TouchableOpacity
                    key={doc.type}
                    style={s.docItem}
                    onPress={() => openAddModal(vehicle, doc.type)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.docIconWrap, { backgroundColor: cfg.bg }]}>
                      <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <Text style={s.docLabel}>{cfg.label}</Text>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <View style={[s.statusDot, { backgroundColor: st.color }]} />
                      <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    {doc.validity && (
                      <Text style={s.docValidity}>{fmtDate(doc.validity)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {vehicles.length === 0 && (
          <View style={s.emptyState}>
            <Icon name="file-text" size={36} color={C.muted} />
            <Text style={s.emptyTitle}>No active vehicles</Text>
            <Text style={s.emptyMsg}>Add vehicles to manage their documents</Text>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add/Update Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Update {DOC_CFG[selDocType]?.label}</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Icon name="x" size={20} color={C.muted} /></TouchableOpacity>
            </View>

            <Text style={s.modalVehicle}>{selVehicle?.vehicleName}</Text>

            {/* Doc Type Selector */}
            <Text style={s.formLabel}>DOCUMENT TYPE</Text>
            <View style={s.docTypeRow}>
              {Object.entries(DOC_CFG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.docTypeChip, selDocType === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                  onPress={() => { setSelDocType(key); setProvider(''); }}
                >
                  <Text style={[s.docTypeText, selDocType === key && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {DOC_CFG[selDocType]?.needsValidity && (
              <>
                <Text style={s.formLabel}>VALID UNTIL</Text>
                <TouchableOpacity style={s.dateInput} onPress={() => setShowDatePicker(true)}>
                  <Icon name="calendar" size={16} color={C.muted} />
                  <Text style={s.dateText}>{validity.toLocaleDateString('en-IN')}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={validity}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(_, d) => { setShowDatePicker(false); if (d) setValidity(d); }}
                  />
                )}
              </>
            )}

            {DOC_CFG[selDocType]?.providerLabel && (
              <>
                <Text style={s.formLabel}>{DOC_CFG[selDocType].providerLabel.toUpperCase()}</Text>
                <TextInput
                  style={s.textInput}
                  value={provider}
                  onChangeText={setProvider}
                  placeholder={`Enter ${DOC_CFG[selDocType].providerLabel}`}
                  placeholderTextColor={C.muted}
                />
              </>
            )}

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Icon name="check" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Save Document</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.brand },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.brand, paddingBottom: 18 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  scroll: { padding: 16, gap: 12 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  vehicleIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  vehicleName: { fontSize: 14, fontWeight: '700', color: C.text },
  vehicleReg: { fontSize: 11, color: C.muted, marginTop: 1, fontFamily: 'monospace' },

  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docItem: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  docIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  docLabel: { fontSize: 11, fontWeight: '600', color: C.text, marginBottom: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  docValidity: { fontSize: 9, color: C.muted, marginTop: 3 },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyMsg: { fontSize: 13, color: C.muted, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalVehicle: { fontSize: 13, color: C.muted, marginBottom: 16 },

  formLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  docTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docTypeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: 'transparent' },
  docTypeText: { fontSize: 12, color: C.subtext },

  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dateText: { fontSize: 14, color: C.text },

  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brand, paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

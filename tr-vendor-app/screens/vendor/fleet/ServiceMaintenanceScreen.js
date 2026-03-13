import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFleetService, addFleetService } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  red: '#DC2626',
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
  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('history');

  const [modal, setModal] = useState(false);
  const [showVehicleDrop, setShowVehicleDrop] = useState(false);
  const [form, setForm] = useState({
    vendorFleetId: '', serviceType: 'Oil Change', serviceDate: new Date(),
    description: '', odometerReading: '', cost: '', serviceProvider: '', notes: '',
  });
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
  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#022C22');
  }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAdd = () => {
    setForm({ vendorFleetId: vehicles[0]?.id || '', serviceType: 'Oil Change', serviceDate: new Date(), description: '', odometerReading: '', cost: '', serviceProvider: '', notes: '' });
    setShowVehicleDrop(false);
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
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
        <View style={st.heroTopSimple}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={st.heroTitle}>Service & Maintenance</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>
      <View style={st.centered}><ActivityIndicator size="large" color={C.g600} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
        <View style={[st.deco, { width: 180, height: 180, top: -70, right: -50, opacity: 0.07 }]} />
        <View style={[st.deco, { width: 80,  height: 80,  top: 10,  right: 110, opacity: 0.04 }]} />

        <View style={st.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={st.heroMid}>
            <View style={st.heroBadge}>
              <MaterialCommunityIcons name="wrench-outline" size={12} color={C.g400} />
              <Text style={st.heroBadgeTxt}>Fleet Management</Text>
            </View>
            <Text style={st.heroTitle}>Service & Maintenance</Text>
            <Text style={st.heroSub}>Track servicing & repairs</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={st.addBtn}>
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={st.statsRow}>
          {[
            { label: 'Vehicles',    value: summary.totalVehicles || 0,      color: '#93C5FD' },
            { label: 'Records',     value: summary.totalRecords || 0,       color: C.g400 },
            { label: 'Total Spent', value: `₹${fmt(summary.totalSpent)}`,  color: '#FCD34D' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={st.statDiv} />}
              <View style={st.statBox}>
                <Text style={[st.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={st.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {/* ── TABS ── */}
      <View style={st.tabRow}>
        <TouchableOpacity style={[st.tab, tab === 'history' && st.tabActive]} onPress={() => setTab('history')}>
          <Text style={[st.tabTxt, tab === 'history' && st.tabTxtActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tab, tab === 'vehicles' && st.tabActive]} onPress={() => setTab('vehicles')}>
          <Text style={[st.tabTxt, tab === 'vehicles' && st.tabTxtActive]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={st.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {tab === 'history' ? (
          records.length > 0 ? records.map(r => (
            <View key={r.id} style={st.card}>
              <View style={st.cardTop}>
                <LinearGradient colors={[C.g800, C.g600]} style={st.cardIcon}>
                  <MaterialCommunityIcons name="wrench" size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardPrimary}>{r.serviceType}</Text>
                  <Text style={st.cardMeta}>{r.vehicleName} · {fmtDate(r.serviceDate)}</Text>
                </View>
                <Text style={[st.cardCost, { color: C.g700 }]}>₹{fmt(r.cost)}</Text>
              </View>
              {(r.serviceProvider || r.odometerReading) && (
                <View style={st.cardDetails}>
                  {r.serviceProvider && <View style={st.detailItem}><Text style={st.detailLbl}>PROVIDER</Text><Text style={st.detailVal}>{r.serviceProvider}</Text></View>}
                  {r.odometerReading && <View style={st.detailItem}><Text style={st.detailLbl}>ODO</Text><Text style={st.detailVal}>{r.odometerReading} km</Text></View>}
                </View>
              )}
              {r.description && <Text style={st.cardDesc}>{r.description}</Text>}
              {r.notes && <Text style={st.cardNote}>{r.notes}</Text>}
            </View>
          )) : (
            <View style={st.empty}>
              <View style={st.emptyIcon}><MaterialCommunityIcons name="wrench" size={32} color={C.muted} /></View>
              <Text style={st.emptyTitle}>No service records</Text>
              <Text style={st.emptyMsg}>Tap + to record a service</Text>
            </View>
          )
        ) : (
          vehicles.map(v => (
            <View key={v.id} style={st.card}>
              <View style={st.cardTop}>
                <LinearGradient colors={[C.g800, C.g600]} style={st.cardIcon}>
                  <MaterialCommunityIcons name="car" size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardPrimary}>{v.vehicleName}</Text>
                  <Text style={st.cardMeta}>{v.registrationNumber || 'No Reg'} · {v.service || ''}</Text>
                </View>
              </View>
              <View style={st.vehicleInfo}>
                <View style={st.vInfoItem}>
                  <Text style={st.detailLbl}>LAST SERVICE</Text>
                  <Text style={st.detailVal}>{v.lastServiceDate ? fmtDate(v.lastServiceDate) : 'Never'}</Text>
                </View>
                <View style={st.vInfoItem}>
                  <Text style={st.detailLbl}>FITNESS VALID</Text>
                  <Text style={[st.detailVal, v.fitnessValidity && new Date(v.fitnessValidity) < new Date() ? { color: C.red } : {}]}>
                    {v.fitnessValidity ? fmtDate(v.fitnessValidity) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── RECORD SERVICE MODAL ── */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor={C.g900} />
          <ScrollView style={st.modalSheet} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">

            {/* Modal hero */}
            <LinearGradient colors={[C.g900, C.g800]} style={st.modalHero}>
              <View style={st.modalHeroRow}>
                <View style={st.modalHeroBadge}>
                  <MaterialCommunityIcons name="wrench" size={20} color={C.g400} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.modalHeroTitle}>Record Service</Text>
                  <Text style={st.modalHeroSub}>Log a maintenance or repair entry</Text>
                </View>
                <TouchableOpacity style={st.modalCloseBtn} onPress={() => setModal(false)}>
                  <Icon name="x" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={st.modalBody}>

              {/* Vehicle Dropdown */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Select Vehicle <Text style={st.reqTag}>*</Text></Text>
                {(() => {
                  const sel = vehicles.find(v => v.id === form.vendorFleetId);
                  return (
                    <>
                      <TouchableOpacity
                        style={[st.vDropTrigger, showVehicleDrop && st.vDropTriggerOpen]}
                        onPress={() => setShowVehicleDrop(p => !p)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={[C.g800, C.g600]} style={st.vDropIconBox}>
                          <MaterialCommunityIcons name="car" size={15} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          {sel ? (
                            <>
                              <Text style={st.vDropName} numberOfLines={1}>{sel.vehicleName}</Text>
                              <Text style={st.vDropReg}>{sel.registrationNumber || 'No Reg No.'}</Text>
                            </>
                          ) : (
                            <Text style={st.vDropPlaceholder}>Select a vehicle...</Text>
                          )}
                        </View>
                        <MaterialCommunityIcons
                          name={showVehicleDrop ? 'chevron-up' : 'chevron-down'}
                          size={20} color={C.muted}
                        />
                      </TouchableOpacity>
                      {showVehicleDrop && (
                        <ScrollView style={st.vDropList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                          {vehicles.map((v, idx) => (
                            <TouchableOpacity
                              key={v.id}
                              style={[
                                st.vDropItem,
                                form.vendorFleetId === v.id && st.vDropItemActive,
                                idx === vehicles.length - 1 && { borderBottomWidth: 0 },
                              ]}
                              onPress={() => { setForm(f => ({ ...f, vendorFleetId: v.id })); setShowVehicleDrop(false); }}
                              activeOpacity={0.7}
                            >
                              <View style={[st.vDropItemIcon, form.vendorFleetId === v.id && { backgroundColor: C.g50 }]}>
                                <MaterialCommunityIcons name="car" size={16} color={form.vendorFleetId === v.id ? C.g700 : C.muted} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[st.vDropItemName, form.vendorFleetId === v.id && { color: C.g700 }]} numberOfLines={1}>{v.vehicleName}</Text>
                                <Text style={st.vDropItemReg}>{v.registrationNumber || 'No Reg No.'}</Text>
                              </View>
                              {form.vendorFleetId === v.id && (
                                <MaterialCommunityIcons name="check-circle" size={18} color={C.g600} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </>
                  );
                })()}
              </View>

              {/* Service Type */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Service Type</Text>
                <View style={st.typeGrid}>
                  {SERVICE_TYPES.map(stype => {
                    const active = form.serviceType === stype;
                    return (
                      <TouchableOpacity
                        key={stype}
                        style={[st.typeChip, active && st.typeChipActive]}
                        onPress={() => setForm(f => ({ ...f, serviceType: stype }))}
                        activeOpacity={0.75}
                      >
                        <Text style={[st.typeChipTxt, active && st.typeChipTxtActive]}>{stype}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Service Date</Text>
                <TouchableOpacity style={st.inputRow} onPress={() => setShowDatePicker(true)}>
                  <View style={st.inputIconBox}><Icon name="calendar" size={15} color={C.g700} /></View>
                  <Text style={st.inputRowTxt}>{form.serviceDate.toLocaleDateString('en-IN')}</Text>
                  <Icon name="chevron-right" size={15} color={C.muted} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={form.serviceDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, serviceDate: d })); }} />
                )}
              </View>

              {/* Cost */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Cost <Text style={st.reqTag}>*</Text></Text>
                <View style={st.inputBox}>
                  <View style={st.inputPfx}><Text style={st.inputPfxTxt}>₹</Text></View>
                  <TextInput style={st.inputField} keyboardType="numeric" value={form.cost} onChangeText={v => setForm(f => ({ ...f, cost: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                </View>
              </View>

              {/* Service Provider */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Service Provider <Text style={st.optTag}>(Optional)</Text></Text>
                <View style={st.inputBox}>
                  <View style={st.inputPfx}><MaterialCommunityIcons name="store-outline" size={15} color={C.g700} /></View>
                  <TextInput style={st.inputField} value={form.serviceProvider} onChangeText={v => setForm(f => ({ ...f, serviceProvider: v }))} placeholder="Mechanic / Workshop name" placeholderTextColor={C.muted} />
                </View>
              </View>

              {/* Odometer */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Odometer Reading <Text style={st.optTag}>(Optional)</Text></Text>
                <View style={st.inputBox}>
                  <View style={st.inputPfx}><MaterialCommunityIcons name="speedometer" size={14} color={C.g700} /></View>
                  <TextInput style={st.inputField} keyboardType="numeric" value={form.odometerReading} onChangeText={v => setForm(f => ({ ...f, odometerReading: v }))} placeholder="km reading" placeholderTextColor={C.muted} />
                </View>
              </View>

              {/* Description */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Description <Text style={st.optTag}>(Optional)</Text></Text>
                <TextInput style={st.textArea} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="What was done?" placeholderTextColor={C.muted} multiline />
              </View>

              {/* Notes */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Notes <Text style={st.optTag}>(Optional)</Text></Text>
                <TextInput style={st.notesInput} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Any additional notes..." placeholderTextColor={C.muted} multiline />
              </View>

              {/* Save */}
              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient colors={[C.g800, C.g600]} style={[st.saveBtn, saving && { opacity: 0.6 }]}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                    <><Icon name="check" size={18} color="#fff" /><Text style={st.saveBtnTxt}>Save Service Record</Text></>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, overflow: 'hidden' },
  heroLoading: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  heroTopSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  heroMid: { flex: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.g400 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 4 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statDiv:  { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 18, fontWeight: '800', marginBottom: 3 },
  statLabel:{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.4 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab:       { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabTxt:    { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTxtActive: { color: '#fff' },

  scroll: { padding: 16, gap: 10, paddingBottom: 100 },

  card:     { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardPrimary: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  cardMeta:    { fontSize: 11, color: C.muted },
  cardCost:    { fontSize: 16, fontWeight: '800' },
  cardDetails: { flexDirection: 'row', gap: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, flexWrap: 'wrap' },
  detailItem:  {},
  detailLbl:   { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  detailVal:   { fontSize: 13, fontWeight: '700', color: C.text, marginTop: 2 },
  cardDesc:    { fontSize: 13, color: C.sub, marginTop: 10 },
  cardNote:    { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 4 },
  vehicleInfo: { flexDirection: 'row', gap: 24, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  vInfoItem:   {},

  empty:     { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyTitle:{ fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },
  emptyMsg:  { fontSize: 13, color: C.muted, textAlign: 'center' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: C.bg },
  modalSheet:   { flex: 1 },

  /* Modal hero */
  modalHero:      { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  modalHeroRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  modalHeroBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalHeroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  modalHeroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  modalCloseBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  /* Modal body */
  modalBody:        { padding: 20 },
  formSection:      { marginBottom: 20 },
  formSectionTitle: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  reqTag: { color: C.red, fontWeight: '800' },
  optTag: { fontWeight: '500', color: C.muted, textTransform: 'none', letterSpacing: 0 },

  /* Vehicle dropdown */
  vDropTrigger: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 11 },
  vDropTriggerOpen: { borderColor: C.g600, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  vDropIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  vDropName: { fontSize: 14, fontWeight: '700', color: C.text },
  vDropReg: { fontSize: 11, color: C.muted, marginTop: 1, fontFamily: 'monospace' },
  vDropPlaceholder: { fontSize: 14, color: C.muted },
  vDropList: { backgroundColor: C.card, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.g600, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden', maxHeight: 200 },
  vDropItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  vDropItemActive: { backgroundColor: C.g50 },
  vDropItemIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  vDropItemName: { fontSize: 13, fontWeight: '700', color: C.text },
  vDropItemReg: { fontSize: 11, color: C.muted, marginTop: 1, fontFamily: 'monospace' },

  /* Service type chips */
  typeGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:        { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  typeChipActive:  { backgroundColor: C.g50, borderColor: C.g500 },
  typeChipTxt:     { fontSize: 12, fontWeight: '700', color: C.muted },
  typeChipTxtActive: { color: C.g700 },

  /* Date input row */
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  inputIconBox:{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  inputRowTxt: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },

  /* Input box with prefix */
  inputBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, overflow: 'hidden' },
  inputPfx:    { width: 44, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border },
  inputPfxTxt: { fontSize: 13, fontWeight: '800', color: C.g700 },
  inputField:  { flex: 1, paddingHorizontal: 13, fontSize: 14, color: C.text, height: 48 },

  /* Text areas */
  textArea:   { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, height: 80, textAlignVertical: 'top' },
  notesInput: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, height: 72, textAlignVertical: 'top' },

  /* Save */
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  saveBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

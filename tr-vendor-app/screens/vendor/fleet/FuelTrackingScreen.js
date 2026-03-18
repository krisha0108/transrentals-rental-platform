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
import { getFleetFuel, addFleetFuel } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB', amberD: '#92400E',
  red: '#DC2626',
};

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Other'];
const PAY_MODES  = ['Cash', 'UPI', 'Card', 'Fleet Card', 'Credit', 'Other'];

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'; }

export default function FuelTrackingScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('records');

  const [modal, setModal] = useState(false);
  const [showVehicleDrop, setShowVehicleDrop] = useState(false);
  const [form, setForm] = useState({
    vendorFleetId: '', fuelDate: new Date(), fuelType: 'Petrol',
    quantity: '', pricePerUnit: '', odometerReading: '',
    fuelStation: '', paymentMode: 'Cash', notes: '',
  });
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
  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#022C22');
  }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAdd = () => {
    setForm({ vendorFleetId: vehicles[0]?.id || '', fuelDate: new Date(), fuelType: 'Petrol', quantity: '', pricePerUnit: '', odometerReading: '', fuelStation: '', paymentMode: 'Cash', notes: '' });
    setShowVehicleDrop(false);
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

  const totalCost = form.quantity && form.pricePerUnit
    ? (parseFloat(form.quantity) * parseFloat(form.pricePerUnit)).toFixed(2)
    : '0';

  const vehicleFuel = vehicles.map(v => {
    const vRecords = records.filter(r => r.vehicleId === v.id);
    const spent = vRecords.reduce((s, r) => s + r.totalCost, 0);
    return { ...v, records: vRecords.length, spent };
  });

  if (loading) return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
        <View style={st.heroTopSimple}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={st.heroTitle}>Fuel Tracking</Text>
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
              <MaterialCommunityIcons name="gas-station" size={12} color={C.g400} />
              <Text style={st.heroBadgeTxt}>Fleet Management</Text>
            </View>
            <Text style={st.heroTitle}>Fuel Tracking</Text>
            <Text style={st.heroSub}>Monitor fuel expenses</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={st.addBtn}>
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={st.statsRow}>
          {[
            { label: 'Total Spent', value: `₹${fmt(summary.totalSpent)}`, color: '#FCD34D' },
            { label: 'Liters',      value: fmt(summary.totalLiters),       color: C.g400 },
            { label: 'Avg/L',       value: `₹${summary.avgPerLiter?.toFixed(1) || 0}`, color: '#fff' },
            { label: 'Records',     value: summary.recordsCount || 0,      color: '#93C5FD' },
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
        <TouchableOpacity style={[st.tab, tab === 'records' && st.tabActive]} onPress={() => setTab('records')}>
          <Text style={[st.tabTxt, tab === 'records' && st.tabTxtActive]}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tab, tab === 'vehicles' && st.tabActive]} onPress={() => setTab('vehicles')}>
          <Text style={[st.tabTxt, tab === 'vehicles' && st.tabTxtActive]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={st.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {tab === 'records' ? (
          records.length > 0 ? records.map(r => (
            <View key={r.id} style={st.card}>
              <View style={st.cardTop}>
                <View style={[st.cardIcon, { backgroundColor: C.amberL }]}>
                  <MaterialCommunityIcons name="gas-station" size={20} color={C.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardPrimary} numberOfLines={1}>{r.vehicleName}</Text>
                  <Text style={st.cardMeta}>{fmtDate(r.fuelDate)} · {r.fuelType || 'Fuel'} · {r.paymentMode || '-'}</Text>
                </View>
                <Text style={[st.cardCost, { color: C.amber }]}>₹{fmt(r.totalCost)}</Text>
              </View>
              <View style={st.cardDetails}>
                <View style={st.detailItem}><Text style={st.detailLbl}>QTY</Text><Text style={st.detailVal}>{r.quantity}L</Text></View>
                <View style={st.detailItem}><Text style={st.detailLbl}>RATE</Text><Text style={st.detailVal}>₹{r.pricePerUnit}/L</Text></View>
                {r.odometerReading ? <View style={st.detailItem}><Text style={st.detailLbl}>ODO</Text><Text style={st.detailVal}>{r.odometerReading} km</Text></View> : null}
                {r.fuelStation ? <View style={st.detailItem}><Text style={st.detailLbl}>STATION</Text><Text style={st.detailVal}>{r.fuelStation}</Text></View> : null}
              </View>
              {r.notes ? <Text style={st.cardNote}>{r.notes}</Text> : null}
            </View>
          )) : (
            <View style={st.empty}>
              <View style={st.emptyIcon}><MaterialCommunityIcons name="gas-station" size={32} color={C.muted} /></View>
              <Text style={st.emptyTitle}>No fuel records</Text>
              <Text style={st.emptyMsg}>Tap + to add your first fuel entry</Text>
            </View>
          )
        ) : (
            vehicleFuel.map(v => (
            <View key={v.id} style={st.vFuelCard}>
              <View style={st.vFuelLeft}>
                <View style={st.vFuelIconBox}>
                  <MaterialCommunityIcons name="car" size={22} color={C.amber} />
                </View>
              </View>
              <View style={st.vFuelMeta}>
                <Text style={st.vFuelName} numberOfLines={1}>{v.vehicleName}</Text>
                <Text style={st.vFuelReg}>{v.registrationNumber || 'No Reg No.'}</Text>
                <View style={st.vFuelRow}>
                  <View style={st.vFuelTag}>
                    <MaterialCommunityIcons name="gas-station" size={10} color={C.amber} />
                    <Text style={st.vFuelTagTxt}>{v.records} {v.records === 1 ? 'entry' : 'entries'}</Text>
                  </View>
                </View>
              </View>
              <View style={st.vFuelCostBox}>
                <Text style={st.vFuelCostLabel}>Total Spent</Text>
                <Text style={st.vFuelCost}>₹{fmt(v.spent)}</Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── ADD FUEL MODAL ── */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <ScrollView style={st.modalSheet} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
            <View style={st.modalHandle} />

            {/* Modal hero */}
            <LinearGradient colors={[C.g900, C.g800]} style={st.modalHero}>
              <View style={st.modalHeroRow}>
                <View style={st.modalHeroBadge}>
                  <MaterialCommunityIcons name="gas-station" size={20} color={C.g400} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.modalHeroTitle}>Add Fuel Entry</Text>
                  <Text style={st.modalHeroSub}>Log fuel expense for your vehicle</Text>
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

              {/* Date */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Fuel Date</Text>
                <TouchableOpacity style={st.inputRow} onPress={() => setShowDatePicker(true)}>
                  <View style={st.inputIconBox}><Icon name="calendar" size={15} color={C.g700} /></View>
                  <Text style={st.inputRowTxt}>{form.fuelDate.toLocaleDateString('en-IN')}</Text>
                  <Icon name="chevron-right" size={15} color={C.muted} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={form.fuelDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, fuelDate: d })); }} />
                )}
              </View>

              {/* Fuel type */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Fuel Type</Text>
                <View style={st.chipsWrap}>
                  {FUEL_TYPES.map(ft => {
                    const ic = ft === 'Petrol' ? 'gas-station' : ft === 'Diesel' ? 'barrel' : ft === 'CNG' ? 'molecule-co2' : ft === 'Electric' ? 'lightning-bolt' : 'dots-horizontal';
                    const active = form.fuelType === ft;
                    return (
                      <TouchableOpacity key={ft} style={[st.selChip, active && st.selChipActive]} onPress={() => setForm(f => ({ ...f, fuelType: ft }))}>
                        <MaterialCommunityIcons name={ic} size={12} color={active ? C.amberD : C.muted} />
                        <Text style={[st.selChipTxt, active && st.selChipTxtActive]}>{ft}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Quantity + Price */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Fuel Details</Text>
                <View style={st.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.inputLabel}>Quantity (Litres)</Text>
                    <View style={st.inputBox}>
                      <View style={st.inputPfx}><Text style={st.inputPfxTxt}>L</Text></View>
                      <TextInput style={st.inputField} keyboardType="numeric" value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.inputLabel}>Price / Litre</Text>
                    <View style={st.inputBox}>
                      <View style={st.inputPfx}><Text style={st.inputPfxTxt}>₹</Text></View>
                      <TextInput style={st.inputField} keyboardType="numeric" value={form.pricePerUnit} onChangeText={v => setForm(f => ({ ...f, pricePerUnit: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Total cost card */}
              <LinearGradient colors={[C.amber, '#F59E0B']} style={st.totalCard}>
                <View>
                  <Text style={st.totalCardLabel}>Total Cost</Text>
                  <Text style={st.totalCardSub}>{form.quantity || '0'}L × ₹{form.pricePerUnit || '0'}/L</Text>
                </View>
                <Text style={st.totalCardVal}>₹{totalCost}</Text>
              </LinearGradient>

              {/* Odometer */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Odometer <Text style={st.optTag}>(Optional)</Text></Text>
                <View style={st.inputBox}>
                  <View style={st.inputPfx}><MaterialCommunityIcons name="speedometer" size={14} color={C.g700} /></View>
                  <TextInput style={st.inputField} keyboardType="numeric" value={form.odometerReading} onChangeText={v => setForm(f => ({ ...f, odometerReading: v }))} placeholder="km reading" placeholderTextColor={C.muted} />
                </View>
              </View>

              {/* Payment mode */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Payment Mode</Text>
                <View style={st.chipsWrap}>
                  {PAY_MODES.map(pm => {
                    const active = form.paymentMode === pm;
                    return (
                      <TouchableOpacity key={pm} style={[st.selChip, active && st.selChipActive]} onPress={() => setForm(f => ({ ...f, paymentMode: pm }))}>
                        <Text style={[st.selChipTxt, active && st.selChipTxtActive]}>{pm}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Fuel station */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Fuel Station <Text style={st.optTag}>(Optional)</Text></Text>
                <View style={st.inputBox}>
                  <View style={st.inputPfx}><Icon name="map-pin" size={14} color={C.g700} /></View>
                  <TextInput style={st.inputField} value={form.fuelStation} onChangeText={v => setForm(f => ({ ...f, fuelStation: v }))} placeholder="Station name" placeholderTextColor={C.muted} />
                </View>
              </View>

              {/* Notes */}
              <View style={st.formSection}>
                <Text style={st.formSectionTitle}>Notes <Text style={st.optTag}>(Optional)</Text></Text>
                <TextInput style={st.notesInput} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Add a note..." placeholderTextColor={C.muted} multiline />
              </View>

              {/* Save */}
              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient colors={[C.g800, C.g600]} style={[st.saveBtn, saving && { opacity: 0.6 }]}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                    <><Icon name="check" size={18} color="#fff" /><Text style={st.saveBtnTxt}>Save Fuel Entry</Text></>
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
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 4 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statDiv:  { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  statLabel:{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.4 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab:       { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabTxt:    { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTxtActive: { color: '#fff' },

  scroll: { padding: 16, gap: 10, paddingBottom: 100 },

  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon:    { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardIconGrad:{ width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardPrimary: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  cardMeta:    { fontSize: 11, color: C.muted },
  cardCost:    { fontSize: 16, fontWeight: '800' },
  cardDetails: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, flexWrap: 'wrap' },
  detailItem:  {},
  detailLbl:   { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  detailVal:   { fontSize: 13, fontWeight: '700', color: C.text, marginTop: 2 },
  cardNote:    { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 8 },

  empty:     { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyTitle:{ fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },
  emptyMsg:  { fontSize: 13, color: C.muted, textAlign: 'center' },

  /* Vehicle fuel cards */
  vFuelCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, borderColor: C.border, borderLeftColor: C.amber, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  vFuelLeft: {},
  vFuelIconBox: { width: 48, height: 48, borderRadius: 13, backgroundColor: C.amberL, justifyContent: 'center', alignItems: 'center' },
  vFuelMeta: { flex: 1, gap: 3 },
  vFuelName: { fontSize: 14, fontWeight: '800', color: C.text },
  vFuelReg:  { fontSize: 12, color: C.sub, fontWeight: '600' },
  vFuelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vFuelTag:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.amberL, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  vFuelTagTxt: { fontSize: 10, fontWeight: '700', color: C.amberD },
  vFuelCostBox: { alignItems: 'flex-end' },
  vFuelCostLabel: { fontSize: 10, fontWeight: '600', color: C.muted, marginBottom: 2 },
  vFuelCost: { fontSize: 17, fontWeight: '900', color: C.amber },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:   { flex: 1, backgroundColor: C.bg },
  modalHandle:  { height: 0 },

  /* Modal hero */
  modalHero: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  modalHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  modalHeroBadge: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalHeroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  modalHeroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  modalCloseBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  /* Modal body */
  modalBody: { padding: 20, gap: 0 },
  formSection: { marginBottom: 20 },
  formSectionTitle: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  optTag: { fontWeight: '500', color: C.muted, textTransform: 'none', letterSpacing: 0 },

  reqTag: { color: C.red, fontWeight: '800' },
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

  /* Date input row */
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  inputIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  inputRowTxt: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },

  /* Select chips (fuel type, payment) */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  selChipActive: { backgroundColor: C.amberL, borderColor: C.amber },
  selChipTxt: { fontSize: 12, fontWeight: '700', color: C.muted },
  selChipTxtActive: { color: C.amberD },

  /* Input box with prefix */
  row2: { flexDirection: 'row', gap: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: C.sub, marginBottom: 7 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, overflow: 'hidden' },
  inputPfx: { width: 44, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border },
  inputPfxTxt: { fontSize: 13, fontWeight: '800', color: C.g700 },
  inputField: { flex: 1, paddingHorizontal: 13, fontSize: 14, color: C.text, height: 48 },

  /* Total cost gradient card */
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 4 },
  totalCardLabel: { fontSize: 13, fontWeight: '700', color: '#fff', opacity: 0.9 },
  totalCardSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  totalCardVal:   { fontSize: 26, fontWeight: '900', color: '#fff' },

  /* Notes */
  notesInput: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, height: 72, textAlignVertical: 'top' },

  /* Save button */
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 4 },
  saveBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

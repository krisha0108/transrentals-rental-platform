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
import { SC as T, G, TONES, rs, rf, GUT, shade, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight, amberD: T.amber,
  blue: T.blue, red: T.red,
  glassBorder: T.glassBorder, scrim: T.scrim,
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
    StatusBar.setBackgroundColor(C.g900);
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

  const renderRecordCard = (r) => {
    const railColors = [C.amber, shade(C.amber, -22)];
    return (
      <View key={r.id} style={[styles.card, cardShadow]}>
        <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cardRail} />
        <View style={styles.cardInner}>
          <View style={styles.cardTopStripe}>
            <View style={styles.recIconBox}>
              <MaterialCommunityIcons name="gas-station" size={rs(16)} color={C.amber} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardPrimary} numberOfLines={1}>{r.vehicleName}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{fmtDate(r.fuelDate)} · {r.fuelType || 'Fuel'} · {r.paymentMode || '-'}</Text>
            </View>
            <Text style={styles.cardCost}>₹{fmt(r.totalCost)}</Text>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailItem}><Text style={styles.detailLbl}>QTY</Text><Text style={styles.detailVal}>{r.quantity}L</Text></View>
            <View style={styles.detailItem}><Text style={styles.detailLbl}>RATE</Text><Text style={styles.detailVal}>₹{r.pricePerUnit}/L</Text></View>
            {r.odometerReading ? <View style={styles.detailItem}><Text style={styles.detailLbl}>ODO</Text><Text style={styles.detailVal}>{r.odometerReading} km</Text></View> : null}
            {r.fuelStation ? <View style={styles.detailItem}><Text style={styles.detailLbl}>STATION</Text><Text style={styles.detailVal} numberOfLines={1}>{r.fuelStation}</Text></View> : null}
          </View>

          {r.notes ? <Text style={styles.cardNote}>{r.notes}</Text> : null}
        </View>
      </View>
    );
  };

  const renderVehicleCard = (v) => (
    <View key={v.id} style={[styles.vCard, cardShadow]}>
      <LinearGradient colors={TONES.emerald.grad} style={styles.vCardIconBox}>
        <MaterialCommunityIcons name="car" size={rs(20)} color="#fff" />
      </LinearGradient>
      <View style={styles.vCardMeta}>
        <Text style={styles.vCardName} numberOfLines={1}>{v.vehicleName}</Text>
        <Text style={styles.vCardReg} numberOfLines={1}>{v.registrationNumber || 'No Reg No.'}</Text>
        <View style={styles.vCardTag}>
          <MaterialCommunityIcons name="gas-station" size={rs(10)} color={C.amber} />
          <Text style={styles.vCardTagTxt}>{v.records} {v.records === 1 ? 'entry' : 'entries'}</Text>
        </View>
      </View>
      <View style={styles.vCardCostBox}>
        <Text style={styles.vCardCostLabel}>Total Spent</Text>
        <Text style={styles.vCardCostVal}>₹{fmt(v.spent)}</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyCardWrap}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtCardBack} />
        <View style={styles.emptyArtCard}>
          <MaterialCommunityIcons name="gas-station" size={rs(36)} color={C.g500} />
        </View>
        <View style={styles.emptyArtDot} />
        <View style={styles.emptyArtTag}><Text style={styles.emptyArtTagTxt}>NO DATA</Text></View>
      </View>
      <Text style={styles.emptyTitle}>No Fuel Records</Text>
      <Text style={styles.emptySubtitle}>Tap the + button above to log your first fuel entry</Text>
    </View>
  );

  if (loading) return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={G.hero} style={styles.headerGradLoading}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.loadTitle}>Fuel Tracking</Text>
            <View style={{ width: rs(40) }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
      <View style={styles.centered}><ActivityIndicator size="large" color={C.g600} /></View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ── */}
      <LinearGradient colors={G.hero} style={styles.headerGrad}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={openAdd} style={styles.addCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="plus" size={rs(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="gas-station" size={rs(12)} color={C.g400} />
            <Text style={styles.heroBadgeTxt}>Fleet Management</Text>
          </View>
          <Text style={styles.bigTitle}>Fuel Tracking</Text>
          <Text style={styles.bigSub}>Monitor fuel expenses across your fleet.</Text>

          {/* spacer so the floating summary card can tuck into the curve */}
          <View style={{ height: rs(28) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating summary — tucks into the hero's bottom curve */}
      <View style={styles.summaryWrap}>
        <View style={[styles.summaryCard, cardShadow]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>SPENT</Text>
            <Text style={[styles.summaryValue, { color: C.amber }]} numberOfLines={1}>₹{fmt(summary.totalSpent)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>LITERS</Text>
            <Text style={[styles.summaryValue, { color: C.g600 }]} numberOfLines={1}>{fmt(summary.totalLiters)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>AVG/L</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>₹{summary.avgPerLiter?.toFixed(1) || 0}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>RECORDS</Text>
            <Text style={[styles.summaryValue, { color: C.blue }]} numberOfLines={1}>{summary.recordsCount || 0}</Text>
          </View>
        </View>
      </View>

      {/* Fixed tab pills — kept OUTSIDE the ScrollView so switching tabs
          doesn't reset scroll position. */}
      <View style={styles.filtersFixed}>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'records' && styles.tabPillActive]}
          onPress={() => setTab('records')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="receipt-text-outline" size={rs(14)} color={tab === 'records' ? '#fff' : C.sub} />
          <Text style={[styles.tabPillTxt, tab === 'records' && styles.tabPillTxtActive]}>Records</Text>
          <View style={[styles.tabPillCount, tab === 'records' && styles.tabPillCountActive]}>
            <Text style={[styles.tabPillCountTxt, tab === 'records' && styles.tabPillCountTxtActive]}>{records.length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'vehicles' && styles.tabPillActive]}
          onPress={() => setTab('vehicles')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="car-multiple" size={rs(14)} color={tab === 'vehicles' ? '#fff' : C.sub} />
          <Text style={[styles.tabPillTxt, tab === 'vehicles' && styles.tabPillTxtActive]}>Vehicles</Text>
          <View style={[styles.tabPillCount, tab === 'vehicles' && styles.tabPillCountActive]}>
            <Text style={[styles.tabPillCountTxt, tab === 'vehicles' && styles.tabPillCountTxtActive]}>{vehicles.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {tab === 'records' ? (
          records.length > 0 ? records.map(r => renderRecordCard(r)) : renderEmpty()
        ) : (
          vehicleFuel.map(v => renderVehicleCard(v))
        )}
        <View style={{ height: rs(80) }} />
      </ScrollView>

      {/* ── ADD FUEL MODAL ── */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>

            <ScrollView contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              {/* Modal hero */}
              <LinearGradient colors={[C.g900, C.g800]} style={styles.modalHero}>
                <View style={styles.modalHeroRow}>
                  <View style={styles.modalHeroBadge}>
                    <MaterialCommunityIcons name="gas-station" size={rs(20)} color={C.g400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeroTitle}>Add Fuel Entry</Text>
                    <Text style={styles.modalHeroSub}>Log fuel expense for your vehicle</Text>
                  </View>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModal(false)}>
                    <Icon name="x" size={rs(16)} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={styles.modalBody}>

                {/* Vehicle Dropdown */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Select Vehicle <Text style={styles.reqTag}>*</Text></Text>
                  {(() => {
                    const sel = vehicles.find(v => v.id === form.vendorFleetId);
                    return (
                      <>
                        <TouchableOpacity
                          style={[styles.vDropTrigger, showVehicleDrop && styles.vDropTriggerOpen]}
                          onPress={() => setShowVehicleDrop(p => !p)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient colors={[C.g800, C.g600]} style={styles.vDropIconBox}>
                            <MaterialCommunityIcons name="car" size={rs(15)} color="#fff" />
                          </LinearGradient>
                          <View style={{ flex: 1 }}>
                            {sel ? (
                              <>
                                <Text style={styles.vDropName} numberOfLines={1}>{sel.vehicleName}</Text>
                                <Text style={styles.vDropReg}>{sel.registrationNumber || 'No Reg No.'}</Text>
                              </>
                            ) : (
                              <Text style={styles.vDropPlaceholder}>Select a vehicle...</Text>
                            )}
                          </View>
                          <MaterialCommunityIcons
                            name={showVehicleDrop ? 'chevron-up' : 'chevron-down'}
                            size={rs(20)} color={C.muted}
                          />
                        </TouchableOpacity>
                        {showVehicleDrop && (
                          <ScrollView style={styles.vDropList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                            {vehicles.map((v, idx) => (
                              <TouchableOpacity
                                key={v.id}
                                style={[
                                  styles.vDropItem,
                                  form.vendorFleetId === v.id && styles.vDropItemActive,
                                  idx === vehicles.length - 1 && { borderBottomWidth: 0 },
                                ]}
                                onPress={() => { setForm(f => ({ ...f, vendorFleetId: v.id })); setShowVehicleDrop(false); }}
                                activeOpacity={0.7}
                              >
                                <View style={[styles.vDropItemIcon, form.vendorFleetId === v.id && { backgroundColor: C.g50 }]}>
                                  <MaterialCommunityIcons name="car" size={rs(16)} color={form.vendorFleetId === v.id ? C.g700 : C.muted} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.vDropItemName, form.vendorFleetId === v.id && { color: C.g700 }]} numberOfLines={1}>{v.vehicleName}</Text>
                                  <Text style={styles.vDropItemReg}>{v.registrationNumber || 'No Reg No.'}</Text>
                                </View>
                                {form.vendorFleetId === v.id && (
                                  <MaterialCommunityIcons name="check-circle" size={rs(18)} color={C.g600} />
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
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Fuel Date</Text>
                  <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                    <View style={styles.inputIconBox}><Icon name="calendar" size={rs(15)} color={C.g700} /></View>
                    <Text style={styles.inputRowTxt}>{form.fuelDate.toLocaleDateString('en-IN')}</Text>
                    <Icon name="chevron-right" size={rs(15)} color={C.muted} />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker value={form.fuelDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, fuelDate: d })); }} />
                  )}
                </View>

                {/* Fuel type */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Fuel Type</Text>
                  <View style={styles.chipsWrap}>
                    {FUEL_TYPES.map(ft => {
                      const ic = ft === 'Petrol' ? 'gas-station' : ft === 'Diesel' ? 'barrel' : ft === 'CNG' ? 'molecule-co2' : ft === 'Electric' ? 'lightning-bolt' : 'dots-horizontal';
                      const active = form.fuelType === ft;
                      return (
                        <TouchableOpacity key={ft} style={[styles.selChip, active && styles.selChipActive]} onPress={() => setForm(f => ({ ...f, fuelType: ft }))}>
                          <MaterialCommunityIcons name={ic} size={rs(12)} color={active ? C.amberD : C.muted} />
                          <Text style={[styles.selChipTxt, active && styles.selChipTxtActive]}>{ft}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Quantity + Price */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Fuel Details</Text>
                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Quantity (Litres)</Text>
                      <View style={styles.inputBox}>
                        <View style={styles.inputPfx}><Text style={styles.inputPfxTxt}>L</Text></View>
                        <TextInput style={styles.inputField} keyboardType="numeric" value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Price / Litre</Text>
                      <View style={styles.inputBox}>
                        <View style={styles.inputPfx}><Text style={styles.inputPfxTxt}>₹</Text></View>
                        <TextInput style={styles.inputField} keyboardType="numeric" value={form.pricePerUnit} onChangeText={v => setForm(f => ({ ...f, pricePerUnit: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Total cost card */}
                <LinearGradient colors={[C.amber, shade(C.amber, 18)]} style={styles.totalCard}>
                  <View>
                    <Text style={styles.totalCardLabel}>Total Cost</Text>
                    <Text style={styles.totalCardSub}>{form.quantity || '0'}L × ₹{form.pricePerUnit || '0'}/L</Text>
                  </View>
                  <Text style={styles.totalCardVal}>₹{totalCost}</Text>
                </LinearGradient>

                {/* Odometer */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Odometer <Text style={styles.optTag}>(Optional)</Text></Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputPfx}><MaterialCommunityIcons name="speedometer" size={rs(14)} color={C.g700} /></View>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={form.odometerReading} onChangeText={v => setForm(f => ({ ...f, odometerReading: v }))} placeholder="km reading" placeholderTextColor={C.muted} />
                  </View>
                </View>

                {/* Payment mode */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Payment Mode</Text>
                  <View style={styles.chipsWrap}>
                    {PAY_MODES.map(pm => {
                      const active = form.paymentMode === pm;
                      return (
                        <TouchableOpacity key={pm} style={[styles.selChip, active && styles.selChipActive]} onPress={() => setForm(f => ({ ...f, paymentMode: pm }))}>
                          <Text style={[styles.selChipTxt, active && styles.selChipTxtActive]}>{pm}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Fuel station */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Fuel Station <Text style={styles.optTag}>(Optional)</Text></Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputPfx}><Icon name="map-pin" size={rs(14)} color={C.g700} /></View>
                    <TextInput style={styles.inputField} value={form.fuelStation} onChangeText={v => setForm(f => ({ ...f, fuelStation: v }))} placeholder="Station name" placeholderTextColor={C.muted} />
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Notes <Text style={styles.optTag}>(Optional)</Text></Text>
                  <TextInput style={styles.notesInput} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Add a note..." placeholderTextColor={C.muted} multiline />
                </View>

                {/* Save */}
                <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  <LinearGradient colors={[C.g800, C.g600]} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                      <><Icon name="check" size={rs(18)} color="#fff" /><Text style={styles.saveBtnTxt}>Save Fuel Entry</Text></>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Hero header ──
  headerGrad: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(4),
  },
  headerGradLoading: { paddingBottom: rs(14) },
  orbA: {
    position: 'absolute', top: -rs(50), right: -rs(30),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(4), marginBottom: rs(10) },
  backCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  addCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: '#fff' },

  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start',
    paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 999, marginBottom: rs(6),
  },
  heroBadgeTxt: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: '700', color: C.g400, letterSpacing: 0.4 },
  bigTitle: { fontFamily: DISPLAY, fontSize: rf(25), color: '#fff', letterSpacing: 0.2, fontWeight: '800' },
  bigSub:   { fontFamily: DISPLAY, fontSize: rf(12.5), color: 'rgba(255,255,255,0.68)', fontWeight: '600', marginTop: rs(3) },

  // Floating summary card — tucks into the hero's bottom curve.
  summaryWrap: { marginHorizontal: GUT, marginTop: -rs(24) },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(18),
    paddingHorizontal: rs(10), paddingVertical: rs(13),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  summaryItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  summaryLabel: { fontFamily: DISPLAY, fontSize: rf(8.5), color: C.muted, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: rs(3) },
  summaryValue: { fontFamily: DISPLAY, fontSize: rf(14), color: C.text, fontWeight: '800' },
  summaryDivider: { width: 1, height: rs(28), backgroundColor: C.border },

  // Fixed tab pills
  filtersFixed: { flexDirection: 'row', paddingHorizontal: GUT, paddingVertical: rs(10), gap: rs(8) },
  tabPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    paddingVertical: rs(9), borderRadius: rs(12),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabPillActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabPillTxt: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: '700', color: C.sub },
  tabPillTxtActive: { color: '#fff' },
  tabPillCount: {
    backgroundColor: C.border, borderRadius: rs(8),
    paddingHorizontal: rs(6), paddingVertical: rs(1), minWidth: rs(20), alignItems: 'center',
  },
  tabPillCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  tabPillCountTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '700', color: C.sub },
  tabPillCountTxtActive: { color: '#fff' },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(2), paddingBottom: rs(100), gap: rs(10) },

  // ── Record card (accent rail) ──
  card: {
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.glassBorder,
    marginBottom: rs(10), overflow: 'hidden', flexDirection: 'row',
  },
  cardRail: { width: rs(4) },
  cardInner: { flex: 1, padding: rs(12), minWidth: 0 },
  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  recIconBox: {
    width: rs(38), height: rs(38), borderRadius: rs(11),
    backgroundColor: T.amberLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardPrimary: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: '700', color: C.text, marginBottom: rs(2) },
  cardMeta:    { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted },
  cardCost:    { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: C.amber },
  cardDetails: {
    flexDirection: 'row', gap: rs(16), marginTop: rs(10), paddingTop: rs(10),
    borderTopWidth: 1, borderTopColor: '#F1F5F9', flexWrap: 'wrap',
  },
  detailItem: { minWidth: 0 },
  detailLbl:  { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal:  { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: '700', color: C.text, marginTop: rs(2) },
  cardNote:   { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.muted, fontStyle: 'italic', marginTop: rs(8) },

  // ── Empty state (illustrated) ──
  emptyCardWrap: {
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: rs(20), paddingVertical: rs(28), alignItems: 'center', marginTop: rs(6),
  },
  emptyArt: {
    width: rs(150), height: rs(120), marginBottom: rs(18),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(14), right: rs(24),
    width: rs(96), height: rs(70), borderRadius: rs(14),
    backgroundColor: T.amberLight, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(96), height: rs(84), borderRadius: rs(16),
    backgroundColor: C.g50, borderWidth: 1, borderColor: T.amberLight,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(6), right: rs(20),
    width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.amber,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(10), left: rs(6),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: T.amberLight,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: C.amberD, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: C.text, marginBottom: rs(6), textAlign: 'center' },
  emptySubtitle: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.muted, textAlign: 'center', lineHeight: rf(19), fontWeight: '600', maxWidth: rs(260) },

  // ── Vehicle fuel cards ──
  vCard: {
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.glassBorder,
    flexDirection: 'row', alignItems: 'center',
    padding: rs(12), gap: rs(12), marginBottom: rs(10),
  },
  vCardIconBox: { width: rs(46), height: rs(46), borderRadius: rs(13), justifyContent: 'center', alignItems: 'center' },
  vCardMeta: { flex: 1, minWidth: 0, gap: rs(3) },
  vCardName: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: '800', color: C.text },
  vCardReg:  { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, fontWeight: '600' },
  vCardTag:  {
    flexDirection: 'row', alignItems: 'center', gap: rs(4), alignSelf: 'flex-start',
    backgroundColor: T.amberLight, paddingHorizontal: rs(7), paddingVertical: rs(3), borderRadius: rs(7),
  },
  vCardTagTxt: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: '700', color: C.amberD },
  vCardCostBox: { alignItems: 'flex-end' },
  vCardCostLabel: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: '600', color: C.muted, marginBottom: rs(2) },
  vCardCostVal: { fontFamily: DISPLAY, fontSize: rf(16.5), fontWeight: '900', color: C.amber },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.bg, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '92%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10), backgroundColor: C.bg },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },

  // Modal hero
  modalHero: { paddingHorizontal: rs(20), paddingTop: rs(14), paddingBottom: rs(20) },
  modalHeroRow: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  modalHeroBadge: { width: rs(46), height: rs(46), borderRadius: rs(14), backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalHeroTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '800', color: '#fff', marginBottom: rs(2) },
  modalHeroSub:   { fontFamily: DISPLAY, fontSize: rf(12), color: 'rgba(255,255,255,0.6)' },
  modalCloseBtn:  { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  // Modal body
  modalBody: { padding: rs(20) },
  formSection: { marginBottom: rs(20) },
  formSectionTitle: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '800', color: C.muted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: rs(10) },
  optTag: { fontWeight: '500', color: C.muted, textTransform: 'none', letterSpacing: 0 },
  reqTag: { color: C.red, fontWeight: '800' },

  // Vehicle dropdown
  vDropTrigger: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1.5, borderColor: C.border, paddingHorizontal: rs(12), paddingVertical: rs(11) },
  vDropTriggerOpen: { borderColor: C.g600, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  vDropIconBox: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center' },
  vDropName: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', color: C.text },
  vDropReg: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, marginTop: rs(1) },
  vDropPlaceholder: { fontFamily: DISPLAY, fontSize: rf(14), color: C.muted },
  vDropList: { backgroundColor: C.card, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.g600, borderBottomLeftRadius: rs(14), borderBottomRightRadius: rs(14), overflow: 'hidden', maxHeight: rs(200) },
  vDropItem: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingHorizontal: rs(12), paddingVertical: rs(12), borderBottomWidth: 1, borderBottomColor: C.border },
  vDropItemActive: { backgroundColor: C.g50 },
  vDropItemIcon: { width: rs(34), height: rs(34), borderRadius: rs(9), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  vDropItemName: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: '700', color: C.text },
  vDropItemReg: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, marginTop: rs(1) },

  // Date input row
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), paddingHorizontal: rs(14), paddingVertical: rs(13) },
  inputIconBox: { width: rs(28), height: rs(28), borderRadius: rs(8), backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  inputRowTxt: { flex: 1, fontFamily: DISPLAY, fontSize: rf(14), color: C.text, fontWeight: '600' },

  // Select chips (fuel type, payment)
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  selChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(13), paddingVertical: rs(8), borderRadius: rs(12), backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  selChipActive: { backgroundColor: T.amberLight, borderColor: C.amber },
  selChipTxt: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: '700', color: C.muted },
  selChipTxtActive: { color: C.amberD },

  // Input box with prefix
  row2: { flexDirection: 'row', gap: rs(10) },
  inputLabel: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '700', color: C.sub, marginBottom: rs(7) },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), overflow: 'hidden' },
  inputPfx: { width: rs(44), height: rs(48), justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border },
  inputPfxTxt: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: '800', color: C.g700 },
  inputField: { flex: 1, paddingHorizontal: rs(13), fontSize: rf(14), color: C.text, height: rs(48) },

  // Total cost gradient card
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: rs(16), paddingHorizontal: rs(18), paddingVertical: rs(16), marginBottom: rs(4) },
  totalCardLabel: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: '700', color: '#fff', opacity: 0.9 },
  totalCardSub:   { fontFamily: DISPLAY, fontSize: rf(11), color: 'rgba(255,255,255,0.7)', marginTop: rs(2) },
  totalCardVal:   { fontFamily: DISPLAY, fontSize: rf(26), fontWeight: '900', color: '#fff' },

  // Notes
  notesInput: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), padding: rs(14), fontSize: rf(14), color: C.text, height: rs(72), textAlignVertical: 'top' },

  // Save button
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(16), borderRadius: rs(16), marginTop: rs(4) },
  saveBtnTxt: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: '#fff' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, StatusBar,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFleetService, addFleetService } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, TONES, rs, rf, GUT, shade, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  red: T.red, blue: T.blue, gold: T.gold,
  glassBorder: T.glassBorder, scrim: T.scrim,
};

const SERVICE_TYPES = [
  'Oil Change', 'Air Filter', 'Brake Pads', 'Tyre Rotation', 'Tyre Replacement',
  'Coolant Change', 'Transmission Fluid', 'Battery Replacement', 'AC Service',
  'Full Service', 'Wheel Alignment', 'Clutch Repair', 'Engine Repair', 'Body Work', 'Other',
];

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

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
    StatusBar.setBackgroundColor(C.g900);
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

  const renderRecordCard = (r) => {
    const railColors = TONES.emerald.grad;
    return (
      <View key={r.id} style={[styles.card, cardShadow]}>
        <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cardRail} />
        <View style={styles.cardInner}>
          <View style={styles.cardTopStripe}>
            <LinearGradient colors={[C.g800, C.g600]} style={styles.recIconBox}>
              <MaterialCommunityIcons name="wrench" size={rs(16)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardPrimary} numberOfLines={1}>{r.serviceType}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{r.vehicleName} · {fmtDate(r.serviceDate)}</Text>
            </View>
            <Text style={styles.cardCost}>₹{fmt(r.cost)}</Text>
          </View>

          {(r.serviceProvider || r.odometerReading) && (
            <View style={styles.cardDetails}>
              {r.serviceProvider && <View style={styles.detailItem}><Text style={styles.detailLbl}>PROVIDER</Text><Text style={styles.detailVal} numberOfLines={1}>{r.serviceProvider}</Text></View>}
              {r.odometerReading && <View style={styles.detailItem}><Text style={styles.detailLbl}>ODO</Text><Text style={styles.detailVal}>{r.odometerReading} km</Text></View>}
            </View>
          )}
          {r.description ? <Text style={styles.cardDesc}>{r.description}</Text> : null}
          {r.notes ? <Text style={styles.cardNote}>{r.notes}</Text> : null}
        </View>
      </View>
    );
  };

  const renderVehicleCard = (v) => {
    const overdue = v.fitnessValidity && new Date(v.fitnessValidity) < new Date();
    return (
      <View key={v.id} style={[styles.vCard, cardShadow]}>
        <LinearGradient colors={TONES.emerald.grad} style={styles.vCardIconBox}>
          <MaterialCommunityIcons name="car" size={rs(20)} color="#fff" />
        </LinearGradient>
        <View style={styles.vCardMeta}>
          <Text style={styles.vCardName} numberOfLines={1}>{v.vehicleName}</Text>
          <Text style={styles.vCardReg} numberOfLines={1}>{v.registrationNumber || 'No Reg'} · {v.service || ''}</Text>
          <View style={styles.vehicleInfo}>
            <View style={styles.vInfoItem}>
              <Text style={styles.detailLbl}>LAST SERVICE</Text>
              <Text style={styles.detailVal}>{v.lastServiceDate ? fmtDate(v.lastServiceDate) : 'Never'}</Text>
            </View>
            <View style={styles.vInfoItem}>
              <Text style={styles.detailLbl}>FITNESS VALID</Text>
              <Text style={[styles.detailVal, overdue ? { color: C.red } : {}]}>
                {v.fitnessValidity ? fmtDate(v.fitnessValidity) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyCardWrap}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtCardBack} />
        <View style={styles.emptyArtCard}>
          <MaterialCommunityIcons name="wrench" size={rs(36)} color={C.g500} />
        </View>
        <View style={styles.emptyArtDot} />
        <View style={styles.emptyArtTag}><Text style={styles.emptyArtTagTxt}>NO DATA</Text></View>
      </View>
      <Text style={styles.emptyTitle}>No service records</Text>
      <Text style={styles.emptySubtitle}>Tap + to record a service</Text>
    </View>
  );

  if (loading) return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={G.hero} style={styles.headerGrad}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="wrench-outline" size={rs(11)} color={C.g400} />
                <Text style={styles.heroBadgeTxt}>Fleet Management</Text>
              </View>
              <Text style={styles.headerTitle}>Service & Maintenance</Text>
            </View>
            <TouchableOpacity onPress={openAdd} style={styles.addCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="plus" size={rs(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.summaryWrap}>
        <View style={[styles.summaryCard, cardShadow]}>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.summaryDivider} />}
              <View style={styles.summaryItem}>
                <Bone w={36} h={8} style={{ marginBottom: 5 }} />
                <Bone w={40} h={13} />
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.scroll}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.card, cardShadow]}>
            <View style={[styles.cardRail, { backgroundColor: '#DDE4EE' }]} />
            <View style={styles.cardInner}>
              <View style={styles.cardTopStripe}>
                <Bone w={rs(38)} h={rs(38)} r={rs(11)} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Bone w={120} h={13} style={{ marginBottom: 6 }} />
                  <Bone w={150} h={10} />
                </View>
                <Bone w={60} h={15} />
              </View>
              <View style={styles.cardDetails}>
                <Bone w={70} h={11} />
                <Bone w={50} h={11} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ── */}
      <LinearGradient colors={G.hero} style={styles.headerGrad}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="wrench-outline" size={rs(11)} color={C.g400} />
                <Text style={styles.heroBadgeTxt}>Fleet Management</Text>
              </View>
              <Text style={styles.headerTitle}>Service & Maintenance</Text>
            </View>
            <TouchableOpacity onPress={openAdd} style={styles.addCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="plus" size={rs(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Floating summary — tucks into the hero's bottom curve */}
      <View style={styles.summaryWrap}>
        <View style={[styles.summaryCard, cardShadow]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>VEHICLES</Text>
            <Text style={[styles.summaryValue, { color: C.blue }]} numberOfLines={1}>{summary.totalVehicles || 0}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>RECORDS</Text>
            <Text style={[styles.summaryValue, { color: C.g600 }]} numberOfLines={1}>{summary.totalRecords || 0}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
            <Text style={[styles.summaryValue, { color: C.gold }]} numberOfLines={1}>₹{fmt(summary.totalSpent)}</Text>
          </View>
        </View>
      </View>

      {/* Fixed tab pills — kept OUTSIDE the ScrollView so switching tabs
          doesn't reset scroll position. */}
      <View style={styles.filtersFixed}>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'history' && styles.tabPillActive]}
          onPress={() => setTab('history')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="receipt-text-outline" size={rs(14)} color={tab === 'history' ? '#fff' : C.sub} />
          <Text style={[styles.tabPillTxt, tab === 'history' && styles.tabPillTxtActive]}>History</Text>
          <View style={[styles.tabPillCount, tab === 'history' && styles.tabPillCountActive]}>
            <Text style={[styles.tabPillCountTxt, tab === 'history' && styles.tabPillCountTxtActive]}>{records.length}</Text>
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
        {tab === 'history' ? (
          records.length > 0 ? records.map(r => renderRecordCard(r)) : renderEmpty()
        ) : (
          vehicles.map(v => renderVehicleCard(v))
        )}
        <View style={{ height: rs(80) }} />
      </ScrollView>

      {/* ── RECORD SERVICE MODAL ── */}
      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>

            <ScrollView contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              {/* Modal hero */}
              <LinearGradient colors={[C.g900, C.g800]} style={styles.modalHero}>
                <View style={styles.modalHeroRow}>
                  <View style={styles.modalHeroBadge}>
                    <MaterialCommunityIcons name="wrench" size={rs(20)} color={C.g400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeroTitle}>Record Service</Text>
                    <Text style={styles.modalHeroSub}>Log a maintenance or repair entry</Text>
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

                {/* Service Type */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Service Type</Text>
                  <View style={styles.chipsWrap}>
                    {SERVICE_TYPES.map(stype => {
                      const active = form.serviceType === stype;
                      return (
                        <TouchableOpacity
                          key={stype}
                          style={[styles.selChip, active && styles.selChipActive]}
                          onPress={() => setForm(f => ({ ...f, serviceType: stype }))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.selChipTxt, active && styles.selChipTxtActive]}>{stype}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Service Date</Text>
                  <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                    <View style={styles.inputIconBox}><Icon name="calendar" size={rs(15)} color={C.g700} /></View>
                    <Text style={styles.inputRowTxt}>{form.serviceDate.toLocaleDateString('en-IN')}</Text>
                    <Icon name="chevron-right" size={rs(15)} color={C.muted} />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker value={form.serviceDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, serviceDate: d })); }} />
                  )}
                </View>

                {/* Cost */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Cost <Text style={styles.reqTag}>*</Text></Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputPfx}><Text style={styles.inputPfxTxt}>₹</Text></View>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={form.cost} onChangeText={v => setForm(f => ({ ...f, cost: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                  </View>
                </View>

                {/* Service Provider */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Service Provider <Text style={styles.optTag}>(Optional)</Text></Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputPfx}><MaterialCommunityIcons name="store-outline" size={rs(15)} color={C.g700} /></View>
                    <TextInput style={styles.inputField} value={form.serviceProvider} onChangeText={v => setForm(f => ({ ...f, serviceProvider: v }))} placeholder="Mechanic / Workshop name" placeholderTextColor={C.muted} />
                  </View>
                </View>

                {/* Odometer */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Odometer Reading <Text style={styles.optTag}>(Optional)</Text></Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputPfx}><MaterialCommunityIcons name="speedometer" size={rs(14)} color={C.g700} /></View>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={form.odometerReading} onChangeText={v => setForm(f => ({ ...f, odometerReading: v }))} placeholder="km reading" placeholderTextColor={C.muted} />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Description <Text style={styles.optTag}>(Optional)</Text></Text>
                  <TextInput style={styles.textArea} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="What was done?" placeholderTextColor={C.muted} multiline />
                </View>

                {/* Notes */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Notes <Text style={styles.optTag}>(Optional)</Text></Text>
                  <TextInput style={styles.notesInput} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Any additional notes..." placeholderTextColor={C.muted} multiline />
                </View>

                {/* Save */}
                <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  <LinearGradient colors={[C.g800, C.g600]} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                      <><Icon name="check" size={rs(18)} color="#fff" /><Text style={styles.saveBtnTxt}>Save Service Record</Text></>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },

  // ── Hero header ──
  headerGrad: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(10) },
  titleWrap: { alignItems: 'center', justifyContent: 'center', minHeight: rs(38) },
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

  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center',
    paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 999, marginBottom: rs(4),
  },
  heroBadgeTxt: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: '700', color: C.g400, letterSpacing: 0.4 },
  headerTitle: { fontFamily: DISPLAY, fontSize: rf(19), color: '#fff', letterSpacing: -0.2, fontWeight: '800' },

  // Floating summary card — tucks into the hero's bottom curve.
  summaryWrap: { marginHorizontal: GUT, marginTop: rs(14) },
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
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardPrimary: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: '700', color: C.text, marginBottom: rs(2) },
  cardMeta:    { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted },
  cardCost:    { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: C.g700 },
  cardDetails: {
    flexDirection: 'row', gap: rs(16), marginTop: rs(10), paddingTop: rs(10),
    borderTopWidth: 1, borderTopColor: '#F1F5F9', flexWrap: 'wrap',
  },
  detailItem: { minWidth: 0 },
  detailLbl:  { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal:  { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: '700', color: C.text, marginTop: rs(2) },
  cardDesc:   { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.sub, marginTop: rs(9) },
  cardNote:   { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.muted, fontStyle: 'italic', marginTop: rs(4) },

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
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(96), height: rs(84), borderRadius: rs(16),
    backgroundColor: '#F1F6F3', borderWidth: 1, borderColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(6), right: rs(20),
    width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.g500,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(10), left: rs(6),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g50,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: C.g700, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: C.text, marginBottom: rs(6), textAlign: 'center' },
  emptySubtitle: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.muted, textAlign: 'center', lineHeight: rf(19), fontWeight: '600', maxWidth: rs(260) },

  // ── Vehicle cards ──
  vCard: {
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.glassBorder,
    flexDirection: 'row', alignItems: 'flex-start',
    padding: rs(12), gap: rs(12), marginBottom: rs(10),
  },
  vCardIconBox: { width: rs(46), height: rs(46), borderRadius: rs(13), justifyContent: 'center', alignItems: 'center' },
  vCardMeta: { flex: 1, minWidth: 0 },
  vCardName: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: '800', color: C.text },
  vCardReg:  { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, fontWeight: '600', marginTop: rs(2) },
  vehicleInfo: {
    flexDirection: 'row', gap: rs(24), marginTop: rs(10), paddingTop: rs(10),
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  vInfoItem: {},

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

  // Service type chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  selChip: { paddingHorizontal: rs(13), paddingVertical: rs(8), borderRadius: rs(12), backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  selChipActive: { backgroundColor: C.g50, borderColor: C.g500 },
  selChipTxt: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: '700', color: C.muted },
  selChipTxtActive: { color: C.g700 },

  // Input box with prefix
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), overflow: 'hidden' },
  inputPfx: { width: rs(44), height: rs(48), justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border },
  inputPfxTxt: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: '800', color: C.g700 },
  inputField: { flex: 1, paddingHorizontal: rs(13), fontSize: rf(14), color: C.text, height: rs(48) },

  // Text areas
  textArea:   { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), padding: rs(14), fontSize: rf(14), color: C.text, height: rs(80), textAlignVertical: 'top' },
  notesInput: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), padding: rs(14), fontSize: rf(14), color: C.text, height: rs(72), textAlignVertical: 'top' },

  // Save button
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(16), borderRadius: rs(16), marginTop: rs(4) },
  saveBtnTxt: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: '#fff' },
});

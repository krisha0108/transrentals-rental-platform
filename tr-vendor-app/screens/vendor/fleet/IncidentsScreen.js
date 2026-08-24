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
import { getFleetIncidents, addFleetIncident } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, TONES, rs, rf, GUT, cardShadow, shade, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
// Follows the same construction AddVehicleScreen.js / FleetDocumentsScreen.js
// (this folder) use.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  red: T.red, redL: T.redLight,
  amber: T.amber, amberL: T.amberLight,
};

const INCIDENT_TYPES = [
  { key: 'accident',       label: 'Accident',       icon: 'car-off' },
  { key: 'breakdown',      label: 'Breakdown',      icon: 'engine-off' },
  { key: 'flat_tyre',      label: 'Flat Tyre',      icon: 'tire' },
  { key: 'engine_failure', label: 'Engine Failure', icon: 'engine' },
  { key: 'electrical',     label: 'Electrical',     icon: 'lightning-bolt' },
  { key: 'theft',          label: 'Theft',          icon: 'lock-alert' },
  { key: 'vandalism',      label: 'Vandalism',      icon: 'hammer' },
  { key: 'weather',        label: 'Weather',        icon: 'weather-pouring' },
  { key: 'road_damage',    label: 'Road Damage',    icon: 'road' },
  { key: 'other',          label: 'Other',          icon: 'dots-horizontal' },
];

const SEVERITY_CFG = {
  MINOR:    { label: 'Minor',    color: C.g600, bg: C.g100 },
  MODERATE: { label: 'Moderate', color: C.amber, bg: C.amberL },
  MAJOR:    { label: 'Major',    color: C.red,  bg: C.redL },
  CRITICAL: { label: 'Critical', color: shade(C.red, -25), bg: C.redL },
};

const STATUS_CFG = {
  OPEN:     { label: 'Open',     color: C.red,  bg: C.redL },
  RESOLVED: { label: 'Resolved', color: C.g600, bg: C.g100 },
};

function fmt(n) { return Math.round(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }

export default function IncidentsScreen({ navigation }) {
  const [vehicles, setVehicles]   = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('incidents');

  const [modal, setModal] = useState(false);
  const [showVehicleDrop, setShowVehicleDrop] = useState(false);
  const [form, setForm] = useState({
    vendorFleetId: '', incidentDate: new Date(), incidentType: 'accident',
    severity: 'MINOR', location: '', description: '', estimatedCost: '', notes: '',
  });
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
  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#022C22');
  }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openAdd = () => {
    setForm({ vendorFleetId: vehicles[0]?.id || '', incidentDate: new Date(), incidentType: 'accident', severity: 'MINOR', location: '', description: '', estimatedCost: '', notes: '' });
    setShowVehicleDrop(false);
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

  const vehicleIncidents = vehicles.map(v => {
    const vInc = incidents.filter(i => i.vehicleId === v.id);
    return { ...v, count: vInc.length, openCount: vInc.filter(i => i.status === 'OPEN').length };
  });

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={G.hero} style={s.heroLoading}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle}>
          <Icon name="arrow-left" size={rs(20)} color="#fff" />
        </TouchableOpacity>
        <Text style={s.loadTitle}>Incidents</Text>
      </LinearGradient>
      <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
    </SafeAreaView>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={G.hero} style={s.headerGrad}>
        <AnimatedOrb style={s.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={s.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={s.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={openAdd} style={s.addCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="plus" size={rs(19)} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="alert-circle-outline" size={rs(12)} color={C.g400} />
            <Text style={s.heroBadgeText}>FLEET MANAGEMENT</Text>
          </View>
          <Text style={s.bigTitle}>Incidents</Text>
          <Text style={s.bigSub}>Report &amp; track vehicle incidents</Text>

          {/* spacer so the floating summary card can tuck into the curve */}
          <View style={{ height: rs(28) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating summary — tucks into the hero's bottom curve */}
      <View style={s.summaryWrap}>
        <View style={[s.summaryCard, cardShadow]}>
          {[
            { label: 'Total',     value: summary.total || 0,           color: C.text },
            { label: 'Open',      value: summary.open || 0,            color: C.red },
            { label: 'Resolved',  value: summary.resolved || 0,        color: C.g600 },
            { label: 'Est. Cost', value: `₹${fmt(summary.totalCost)}`, color: C.amber },
          ].map((st, i) => (
            <React.Fragment key={st.label}>
              {i > 0 && <View style={s.summaryDivider} />}
              <View style={s.summaryItem}>
                <Text style={[s.summaryValue, { color: st.color }]} numberOfLines={1}>{st.value}</Text>
                <Text style={s.summaryLabel}>{st.label.toUpperCase()}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Fixed segmented tabs — kept OUTSIDE the ScrollView so switching
          view doesn't reset scroll position. */}
      <View style={s.tabsFixed}>
        <TouchableOpacity style={[s.tab, tab === 'incidents' && s.tabActive]} onPress={() => setTab('incidents')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="alert-circle-outline" size={rs(14)} color={tab === 'incidents' ? '#fff' : C.muted} />
          <Text style={[s.tabTxt, tab === 'incidents' && s.tabTxtActive]}>All Incidents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'vehicles' && s.tabActive]} onPress={() => setTab('vehicles')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="car" size={rs(14)} color={tab === 'vehicles' ? '#fff' : C.muted} />
          <Text style={[s.tabTxt, tab === 'vehicles' && s.tabTxtActive]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {tab === 'incidents' ? (
          incidents.length > 0 ? incidents.map(inc => {
            const sev      = SEVERITY_CFG[inc.severity] || SEVERITY_CFG.MINOR;
            const stat     = STATUS_CFG[inc.status]    || STATUS_CFG.OPEN;
            const typeInfo = INCIDENT_TYPES.find(t => t.key === inc.incidentType) || INCIDENT_TYPES[9];
            const railColors = [sev.color, shade(sev.color, -18)];
            return (
              <View key={inc.id} style={[s.card, cardShadow]}>
                {/* Accent rail tinted by severity */}
                <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.cardRail} />

                <View style={s.cardInner}>
                  <View style={s.cardTop}>
                    <View style={s.cardIcon}>
                      <MaterialCommunityIcons name={typeInfo.icon} size={rs(19)} color={C.red} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.cardPrimary} numberOfLines={1}>{typeInfo.label}</Text>
                      <Text style={s.cardMeta} numberOfLines={1}>{inc.vehicleName} · {fmtDate(inc.incidentDate)}</Text>
                    </View>
                    <View style={[s.sevBadge, { backgroundColor: sev.bg }]}>
                      <Text style={[s.sevTxt, { color: sev.color }]}>{sev.label}</Text>
                    </View>
                  </View>

                  <Text style={s.incDesc}>{inc.description}</Text>

                  <View style={s.cardBottom}>
                    <View style={[s.statusBadge, { backgroundColor: stat.bg }]}>
                      <View style={[s.statusDot, { backgroundColor: stat.color }]} />
                      <Text style={[s.statusTxt, { color: stat.color }]}>{stat.label}</Text>
                    </View>
                    {inc.location ? <Text style={s.incLocation} numberOfLines={1}>{inc.location}</Text> : null}
                    {inc.estimatedCost ? <Text style={[s.cardCost, { marginLeft: 'auto' }]}>₹{fmt(inc.estimatedCost)}</Text> : null}
                  </View>
                </View>
              </View>
            );
          }) : (
            <View style={[s.empty, s.emptyCardWrap]}>
              <View style={s.emptyArt}>
                <View style={s.emptyArtCardBack} />
                <View style={s.emptyArtCard}>
                  <MaterialCommunityIcons name="shield-check" size={rs(34)} color={C.g500} />
                </View>
                <View style={s.emptyArtDot} />
                <View style={s.emptyArtTag}>
                  <Text style={s.emptyArtTagTxt}>ALL CLEAR</Text>
                </View>
              </View>
              <Text style={s.emptyTitle}>No incidents reported</Text>
              <Text style={s.emptyMsg}>All clear! Tap + to report an incident</Text>
            </View>
          )
        ) : (
          vehicleIncidents.map(v => {
            const railColors = v.openCount > 0 ? [C.red, shade(C.red, -18)] : TONES.emerald.grad;
            return (
              <View key={v.id} style={[s.card, cardShadow]}>
                <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.cardRail} />
                <View style={s.cardInner}>
                  <View style={s.cardTop}>
                    <LinearGradient colors={G.emerald} style={s.cardIconGrad}>
                      <MaterialCommunityIcons name="car" size={rs(19)} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.cardPrimary} numberOfLines={1}>{v.vehicleName}</Text>
                      <Text style={s.cardMeta} numberOfLines={1}>{v.registrationNumber || 'No Reg'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.vCountTxt}>{v.count} incidents</Text>
                      {v.openCount > 0 && <Text style={s.vOpenTxt}>{v.openCount} open</Text>}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: rs(90) }} />
      </ScrollView>

      {/* ── REPORT INCIDENT MODAL ── */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.sheetHandleWrap}><View style={s.sheetHandle} /></View>

            <ScrollView contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              <View style={s.modalHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.modalTitle}>Report Incident</Text>
                  <Text style={s.modalSub}>Log a vehicle incident or breakdown</Text>
                </View>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModal(false)}>
                  <Icon name="x" size={rs(18)} color={C.sub} />
                </TouchableOpacity>
              </View>

              <View style={s.modalBody}>

                {/* Vehicle Dropdown */}
                <Text style={s.formLabel}>SELECT VEHICLE <Text style={s.reqTag}>*</Text></Text>
                {(() => {
                  const sel = vehicles.find(v => v.id === form.vendorFleetId);
                  return (
                    <>
                      <TouchableOpacity
                        style={[s.vDropTrigger, showVehicleDrop && s.vDropTriggerOpen]}
                        onPress={() => setShowVehicleDrop(p => !p)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={G.emerald} style={s.vDropIconBox}>
                          <MaterialCommunityIcons name="car" size={rs(15)} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          {sel ? (
                            <>
                              <Text style={s.vDropName} numberOfLines={1}>{sel.vehicleName}</Text>
                              <Text style={s.vDropReg}>{sel.registrationNumber || 'No Reg No.'}</Text>
                            </>
                          ) : (
                            <Text style={s.vDropPlaceholder}>Select a vehicle...</Text>
                          )}
                        </View>
                        <MaterialCommunityIcons
                          name={showVehicleDrop ? 'chevron-up' : 'chevron-down'}
                          size={rs(20)} color={C.muted}
                        />
                      </TouchableOpacity>
                      {showVehicleDrop && (
                        <ScrollView style={s.vDropList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                          {vehicles.map((v, idx) => (
                            <TouchableOpacity
                              key={v.id}
                              style={[
                                s.vDropItem,
                                form.vendorFleetId === v.id && s.vDropItemActive,
                                idx === vehicles.length - 1 && { borderBottomWidth: 0 },
                              ]}
                              onPress={() => { setForm(f => ({ ...f, vendorFleetId: v.id })); setShowVehicleDrop(false); }}
                              activeOpacity={0.7}
                            >
                              <View style={[s.vDropItemIcon, form.vendorFleetId === v.id && { backgroundColor: C.g50 }]}>
                                <MaterialCommunityIcons name="car" size={rs(16)} color={form.vendorFleetId === v.id ? C.g700 : C.muted} />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={[s.vDropItemName, form.vendorFleetId === v.id && { color: C.g700 }]} numberOfLines={1}>{v.vehicleName}</Text>
                                <Text style={s.vDropItemReg}>{v.registrationNumber || 'No Reg No.'}</Text>
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

                {/* Incident Type */}
                <Text style={s.formLabel}>INCIDENT TYPE</Text>
                <View style={s.typeGrid}>
                  {INCIDENT_TYPES.map(t => {
                    const active = form.incidentType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[s.typeChip, active && s.typeChipActive]}
                        onPress={() => setForm(f => ({ ...f, incidentType: t.key }))}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons name={t.icon} size={rs(14)} color={active ? C.red : C.muted} />
                        <Text style={[s.typeChipTxt, active && s.typeChipTxtActive]}>{t.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Date */}
                <Text style={s.formLabel}>INCIDENT DATE</Text>
                <TouchableOpacity style={s.inputRow} onPress={() => setShowDatePicker(true)}>
                  <View style={s.inputIconBox}><Icon name="calendar" size={rs(15)} color={C.g700} /></View>
                  <Text style={s.inputRowTxt}>{form.incidentDate.toLocaleDateString('en-IN')}</Text>
                  <Icon name="chevron-right" size={rs(15)} color={C.muted} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={form.incidentDate} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, incidentDate: d })); }} />
                )}

                {/* Severity */}
                <Text style={s.formLabel}>SEVERITY LEVEL</Text>
                <View style={s.sevRow}>
                  {Object.entries(SEVERITY_CFG).map(([key, cfg]) => {
                    const active = form.severity === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[s.sevChip, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                        onPress={() => setForm(f => ({ ...f, severity: key }))}
                        activeOpacity={0.75}
                      >
                        <View style={[s.sevDot, { backgroundColor: cfg.color }]} />
                        <Text style={[s.sevChipTxt, active && { color: cfg.color, fontWeight: '800' }]}>{cfg.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Description */}
                <Text style={s.formLabel}>DESCRIPTION <Text style={s.reqTag}>*</Text></Text>
                <TextInput
                  style={s.textArea}
                  value={form.description}
                  onChangeText={v => setForm(f => ({ ...f, description: v }))}
                  placeholder="Describe what happened in detail..."
                  placeholderTextColor={C.muted}
                  multiline
                />

                {/* Location */}
                <Text style={s.formLabel}>LOCATION <Text style={s.optTag}>(Optional)</Text></Text>
                <View style={s.inputBox}>
                  <View style={s.inputPfx}><Icon name="map-pin" size={rs(14)} color={C.g700} /></View>
                  <TextInput style={s.inputField} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} placeholder="Where did it happen?" placeholderTextColor={C.muted} />
                </View>

                {/* Estimated Cost */}
                <Text style={s.formLabel}>ESTIMATED COST <Text style={s.optTag}>(Optional)</Text></Text>
                <View style={s.inputBox}>
                  <View style={s.inputPfx}><Text style={s.inputPfxTxt}>₹</Text></View>
                  <TextInput style={s.inputField} keyboardType="numeric" value={form.estimatedCost} onChangeText={v => setForm(f => ({ ...f, estimatedCost: v }))} placeholder="0.00" placeholderTextColor={C.muted} />
                </View>

                {/* Notes */}
                <Text style={s.formLabel}>NOTES <Text style={s.optTag}>(Optional)</Text></Text>
                <TextInput style={s.notesInput} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Any additional notes..." placeholderTextColor={C.muted} multiline />

                {/* Save */}
                <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85} style={s.saveBtn}>
                  <LinearGradient colors={G.emerald} style={[s.saveBtnInner, saving && { opacity: 0.6 }]}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                      <><MaterialCommunityIcons name="alert-circle" size={rs(18)} color="#fff" /><Text style={s.saveBtnTxt}>Report Incident</Text></>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Loading hero
  heroLoading: { paddingHorizontal: GUT, paddingTop: rs(14), paddingBottom: rs(14), flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  loadTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '800', color: '#fff' },

  // ── Hero header ──
  headerGrad: { overflow: 'hidden', borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26) },
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
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  addCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) },
  heroBadgeText: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '700', color: C.g400, letterSpacing: 1 },
  bigTitle: { fontFamily: DISPLAY, fontSize: rf(26), color: '#fff', letterSpacing: 0.2, fontWeight: '700' },
  bigSub: { fontFamily: DISPLAY, fontSize: rf(12.5), color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: rs(4) },

  // Floating summary card
  summaryWrap: { marginHorizontal: GUT, marginTop: -rs(24) },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(18),
    paddingHorizontal: rs(8), paddingVertical: rs(13),
    borderWidth: 1, borderColor: T.glassBorder,
  },
  summaryItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  summaryLabel: { fontFamily: DISPLAY, fontSize: rf(8), color: C.muted, fontWeight: 'bold', letterSpacing: 0.5, marginTop: rs(2) },
  summaryValue: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800' },
  summaryDivider: { width: 1, height: rs(28), backgroundColor: C.border },

  // Fixed segmented tabs
  tabsFixed: { flexDirection: 'row', paddingHorizontal: GUT, paddingTop: rs(14), paddingBottom: rs(10), gap: rs(8) },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    paddingVertical: rs(10), borderRadius: rs(12),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabActive: { backgroundColor: C.g700, borderColor: C.g700 },
  tabTxt: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: '600', color: C.muted },
  tabTxtActive: { color: '#fff', fontWeight: '700' },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(4), gap: rs(10) },

  // ── Card ──
  card: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: T.glassBorder,
    marginBottom: rs(10), overflow: 'hidden', flexDirection: 'row',
  },
  cardRail: { width: rs(4) },
  cardInner: { flex: 1, padding: rs(14), minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  cardIcon: { width: rs(44), height: rs(44), borderRadius: rs(13), backgroundColor: C.redL, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardIconGrad: { width: rs(44), height: rs(44), borderRadius: rs(13), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardPrimary: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', color: C.text, marginBottom: rs(2) },
  cardMeta: { fontSize: rf(11), color: C.muted },
  cardCost: { fontSize: rf(14), fontWeight: '800', color: C.red },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(12), paddingTop: rs(12), borderTopWidth: 1, borderTopColor: C.border },
  incDesc: { fontSize: rf(13), color: C.sub, marginTop: rs(10), lineHeight: rf(19) },
  incLocation: { fontSize: rf(12), color: C.muted, flexShrink: 1 },
  sevBadge: { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(10) },
  sevTxt: { fontSize: rf(11), fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(8) },
  statusDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  statusTxt: { fontSize: rf(11), fontWeight: '700' },

  // Vehicles tab
  vCountTxt: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '800', color: C.text },
  vOpenTxt: { fontSize: rf(11), color: C.red, marginTop: rs(2), fontWeight: '600' },

  // ── Empty state ──
  empty: { alignItems: 'center', paddingVertical: rs(30) },
  emptyCardWrap: {
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: T.glassBorder,
    paddingHorizontal: rs(20), marginTop: rs(4), marginBottom: rs(12),
  },
  emptyArt: { width: rs(150), height: rs(120), marginBottom: rs(18), alignItems: 'center', justifyContent: 'center' },
  emptyArtCardBack: {
    position: 'absolute', top: rs(14), right: rs(24),
    width: rs(96), height: rs(70), borderRadius: rs(14),
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(96), height: rs(84), borderRadius: rs(16),
    backgroundColor: '#F1F6F3', borderWidth: 1, borderColor: C.g100,
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
    borderWidth: 1, borderColor: C.g100, transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: C.g700, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '700', color: C.text, textAlign: 'center' },
  emptyMsg: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.muted, textAlign: 'center', marginTop: rs(6), fontWeight: '600' },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '90%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: rs(20), paddingTop: rs(12), paddingBottom: rs(14), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '800', color: C.text },
  modalSub: { fontSize: rf(12), color: C.muted, marginTop: rs(2) },
  modalCloseBtn: { width: rs(34), height: rs(34), borderRadius: rs(10), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: rs(20), paddingBottom: rs(34) },

  formLabel: { fontSize: rf(10.5), fontWeight: '800', color: C.muted, letterSpacing: 0.8, marginBottom: rs(8), marginTop: rs(16) },
  reqTag: { color: C.red, fontWeight: '800' },
  optTag: { fontWeight: '500', color: C.muted, letterSpacing: 0 },

  // Vehicle dropdown
  vDropTrigger: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1.5, borderColor: C.border, paddingHorizontal: rs(12), paddingVertical: rs(11) },
  vDropTriggerOpen: { borderColor: C.g600, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  vDropIconBox: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center' },
  vDropName: { fontSize: rf(14), fontWeight: '700', color: C.text },
  vDropReg: { fontSize: rf(11), color: C.muted, marginTop: rs(1), fontFamily: 'monospace' },
  vDropPlaceholder: { fontSize: rf(14), color: C.muted },
  vDropList: { backgroundColor: C.card, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.g600, borderBottomLeftRadius: rs(14), borderBottomRightRadius: rs(14), overflow: 'hidden', maxHeight: rs(200) },
  vDropItem: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingHorizontal: rs(12), paddingVertical: rs(12), borderBottomWidth: 1, borderBottomColor: C.border },
  vDropItemActive: { backgroundColor: C.g50 },
  vDropItemIcon: { width: rs(34), height: rs(34), borderRadius: rs(9), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  vDropItemName: { fontSize: rf(13), fontWeight: '700', color: C.text },
  vDropItemReg: { fontSize: rf(11), color: C.muted, marginTop: rs(1), fontFamily: 'monospace' },

  // Incident type chips
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(11), paddingVertical: rs(8), borderRadius: rs(12), backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  typeChipActive: { backgroundColor: C.redL, borderColor: C.red },
  typeChipTxt: { fontSize: rf(12), fontWeight: '700', color: C.muted },
  typeChipTxtActive: { color: C.red },

  // Date input row
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), paddingHorizontal: rs(14), paddingVertical: rs(13) },
  inputIconBox: { width: rs(28), height: rs(28), borderRadius: rs(8), backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  inputRowTxt: { flex: 1, fontSize: rf(14), color: C.text, fontWeight: '600' },

  // Severity chips
  sevRow: { flexDirection: 'row', gap: rs(8) },
  sevChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), paddingVertical: rs(10), borderRadius: rs(12), backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  sevDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  sevChipTxt: { fontSize: rf(12), fontWeight: '700', color: C.muted },

  // Input box with prefix
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), overflow: 'hidden' },
  inputPfx: { width: rs(44), height: rs(48), justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border },
  inputPfxTxt: { fontSize: rf(13), fontWeight: '800', color: C.g700 },
  inputField: { flex: 1, paddingHorizontal: rs(13), fontSize: rf(14), color: C.text, height: rs(48) },

  // Text areas
  textArea: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), padding: rs(14), fontSize: rf(14), color: C.text, height: rs(90), textAlignVertical: 'top' },
  notesInput: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), padding: rs(14), fontSize: rf(14), color: C.text, height: rs(72), textAlignVertical: 'top' },

  // Save
  saveBtn: { marginTop: rs(22), borderRadius: rs(16), overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(16) },
  saveBtnTxt: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: '#fff' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getTemplateById, createTemplate, updateTemplate } from '../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../services/alertService';

const C = { bg: '#F7FAFC', surface: '#FFFFFF', text: '#0F172A', muted: '#6B7280', border: '#E5E7EB', brand: '#22C55E', blue: '#2563EB', red: '#EF4444', purple: '#8B5CF6', gold: '#D4AF37' };

const CATEGORIES = [
  { key: 'luxury_sedan', label: 'Luxury Sedan' }, { key: 'luxury_suv', label: 'Luxury SUV' },
  { key: 'premium_sedan', label: 'Premium Sedan' }, { key: 'premium_suv', label: 'Premium SUV' },
  { key: 'vintage', label: 'Vintage' }, { key: 'sports', label: 'Sports Car' }, { key: 'limousine', label: 'Limousine' },
];

const TRIP_TYPES = ['local', 'outstation', 'airport'];
const OCCASIONS = ['wedding', 'corporate', 'personal', 'airport', 'anniversary', 'birthday', 'photoshoot'];

const DEFAULT_INCLUSIONS = ['Professional chauffeur', 'Fuel charges', 'Premium interiors', 'Air conditioning', 'Complimentary water'];
const DEFAULT_EXCLUSIONS = ['Parking & toll charges', 'Extra hours charges', 'Out of city permits', 'Decoration charges'];

export default function CreateLuxuryTemplateScreen({ route, navigation }) {
  const { templateId, serviceType = 'luxury' } = route.params || {};
  const isEditing = !!templateId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [chauffeurCharges, setChauffeurCharges] = useState('');
  const [decorationCharges, setDecorationCharges] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [perHourRate, setPerHourRate] = useState('');
  const [includedKm, setIncludedKm] = useState('');
  const [includedHours, setIncludedHours] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [extraHourRate, setExtraHourRate] = useState('');
  const [selectedTripTypes, setSelectedTripTypes] = useState([]);
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [termsConditions, setTermsConditions] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => { if (isEditing) fetchTemplate(); }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await getTemplateById(serviceType, templateId);
      const t = response?.template;
      if (t) {
        setName(t.name || ''); setCategory(t.category || '');
        setBaseAmount(t.baseAmount?.toString() || ''); setChauffeurCharges(t.chauffeurCharges?.toString() || ''); setDecorationCharges(t.decorationCharges?.toString() || '');
        setPerKmRate(t.perKmRate?.toString() || ''); setPerHourRate(t.perHourRate?.toString() || '');
        setIncludedKm(t.includedKm?.toString() || ''); setIncludedHours(t.includedHours?.toString() || '');
        setExtraKmRate(t.extraKmRate?.toString() || ''); setExtraHourRate(t.extraHourRate?.toString() || '');
        setSelectedTripTypes(t.tripTypes || []); setSelectedOccasions(t.occasions || []);
        setInclusions(t.inclusions || []); setExclusions(t.exclusions || []); setTermsConditions(t.termsConditions || []);
        setIsActive(t.isActive ?? true);
      }
    } catch { showError('Failed to load template'); } finally { setLoading(false); }
  };

  const toggle = (arr, setArr, item) => setArr(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]);
  const addItem = (setter, val, clear) => { if (val.trim()) { setter(prev => [...prev, val.trim()]); clear(''); } };
  const removeItem = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) { showError('Template name is required'); return; }
    if (!category) { showError('Please select a category'); return; }
    if (!baseAmount) { showError('Base amount is required'); return; }

    setSaving(true);
    try {
      const data = {
        name: name.trim(), category, baseAmount: parseInt(baseAmount),
        chauffeurCharges: chauffeurCharges ? parseInt(chauffeurCharges) : 0,
        decorationCharges: decorationCharges ? parseInt(decorationCharges) : 0,
        perKmRate: perKmRate ? parseInt(perKmRate) : null,
        perHourRate: perHourRate ? parseInt(perHourRate) : null,
        includedKm: includedKm ? parseInt(includedKm) : null,
        includedHours: includedHours ? parseInt(includedHours) : null,
        extraKmRate: extraKmRate ? parseInt(extraKmRate) : null,
        extraHourRate: extraHourRate ? parseInt(extraHourRate) : null,
        tripTypes: selectedTripTypes, occasions: selectedOccasions,
        inclusions, exclusions, termsConditions, isActive,
      };
      if (isEditing) { await updateTemplate(serviceType, templateId, data); showSuccess('Template updated'); }
      else { await createTemplate(serviceType, data); showSuccess('Template created'); }
      navigation.goBack();
    } catch { showError('Failed to save template'); } finally { setSaving(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={20} color={C.text} /></TouchableOpacity><Text style={s.headerTitle}>{isEditing ? 'Edit' : 'Create'} Template</Text><View style={{ width: 36 }} /></View><View style={s.loaderContainer}><ActivityIndicator size="large" color={C.purple} /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={20} color={C.text} /></TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Edit' : 'New'} Luxury Template</Text>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Basic Information</Text>
            <View style={s.inputGroup}><Text style={s.label}>Template Name *</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g., Wedding Premium Package" placeholderTextColor={C.muted} /></View>
            <View style={s.inputGroup}><Text style={s.label}>Vehicle Category *</Text>
              <View style={s.chipGrid}>{CATEGORIES.map(c => (<TouchableOpacity key={c.key} style={[s.chip, category === c.key && s.chipSelected]} onPress={() => setCategory(c.key)}><Text style={[s.chipText, category === c.key && s.chipTextSelected]}>{c.label}</Text></TouchableOpacity>))}</View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Pricing *</Text>
            <View style={s.rateRow}>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Base Amount *</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={baseAmount} onChangeText={setBaseAmount} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Chauffeur</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={chauffeurCharges} onChangeText={setChauffeurCharges} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Decoration</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={decorationCharges} onChangeText={setDecorationCharges} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
            </View>
            <View style={s.rateRow}>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Per KM Rate</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={perKmRate} onChangeText={setPerKmRate} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Per Hour Rate</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={perHourRate} onChangeText={setPerHourRate} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
            </View>
            <View style={s.rateRow}>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Included KM</Text><TextInput style={s.input} value={includedKm} onChangeText={setIncludedKm} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Included Hours</Text><TextInput style={s.input} value={includedHours} onChangeText={setIncludedHours} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View>
            </View>
            <View style={s.rateRow}>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Extra KM Rate</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={extraKmRate} onChangeText={setExtraKmRate} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Extra Hour Rate</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={extraHourRate} onChangeText={setExtraHourRate} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Trip Types</Text>
            <View style={s.chipGrid}>{TRIP_TYPES.map(type => (<TouchableOpacity key={type} style={[s.chip, selectedTripTypes.includes(type) && s.chipSelected]} onPress={() => toggle(selectedTripTypes, setSelectedTripTypes, type)}><Text style={[s.chipText, selectedTripTypes.includes(type) && s.chipTextSelected]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text></TouchableOpacity>))}</View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Occasions</Text>
            <View style={s.chipGrid}>{OCCASIONS.map(occ => (<TouchableOpacity key={occ} style={[s.chip, selectedOccasions.includes(occ) && s.chipSelected]} onPress={() => toggle(selectedOccasions, setSelectedOccasions, occ)}><Text style={[s.chipText, selectedOccasions.includes(occ) && s.chipTextSelected]}>{occ.charAt(0).toUpperCase() + occ.slice(1)}</Text></TouchableOpacity>))}</View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>Inclusions</Text><TouchableOpacity onPress={() => setInclusions(prev => [...prev, ...DEFAULT_INCLUSIONS.filter(i => !prev.includes(i))])}><Text style={s.addDefaultText}>+ Add Defaults</Text></TouchableOpacity></View>
            <View style={s.addItemRow}><TextInput style={[s.input, { flex: 1 }]} value={newInclusion} onChangeText={setNewInclusion} placeholder="Add inclusion..." placeholderTextColor={C.muted} onSubmitEditing={() => addItem(setInclusions, newInclusion, setNewInclusion)} /><TouchableOpacity style={s.addItemBtn} onPress={() => addItem(setInclusions, newInclusion, setNewInclusion)}><Icon name="plus" size={18} color="#fff" /></TouchableOpacity></View>
            <View style={s.itemsList}>{inclusions.map((item, i) => (<View key={i} style={s.itemChip}><Icon name="check-circle" size={14} color={C.brand} /><Text style={s.itemText}>{item}</Text><TouchableOpacity onPress={() => removeItem(setInclusions, i)}><Icon name="x" size={14} color={C.muted} /></TouchableOpacity></View>))}</View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>Exclusions</Text><TouchableOpacity onPress={() => setExclusions(prev => [...prev, ...DEFAULT_EXCLUSIONS.filter(i => !prev.includes(i))])}><Text style={s.addDefaultText}>+ Add Defaults</Text></TouchableOpacity></View>
            <View style={s.addItemRow}><TextInput style={[s.input, { flex: 1 }]} value={newExclusion} onChangeText={setNewExclusion} placeholder="Add exclusion..." placeholderTextColor={C.muted} onSubmitEditing={() => addItem(setExclusions, newExclusion, setNewExclusion)} /><TouchableOpacity style={[s.addItemBtn, { backgroundColor: C.red }]} onPress={() => addItem(setExclusions, newExclusion, setNewExclusion)}><Icon name="plus" size={18} color="#fff" /></TouchableOpacity></View>
            <View style={s.itemsList}>{exclusions.map((item, i) => (<View key={i} style={[s.itemChip, { backgroundColor: '#FEE2E2' }]}><Icon name="x-circle" size={14} color={C.red} /><Text style={s.itemText}>{item}</Text><TouchableOpacity onPress={() => removeItem(setExclusions, i)}><Icon name="x" size={14} color={C.muted} /></TouchableOpacity></View>))}</View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Terms & Conditions</Text>
            <View style={s.addItemRow}><TextInput style={[s.input, { flex: 1 }]} value={newTerm} onChangeText={setNewTerm} placeholder="Add term..." placeholderTextColor={C.muted} onSubmitEditing={() => addItem(setTermsConditions, newTerm, setNewTerm)} /><TouchableOpacity style={[s.addItemBtn, { backgroundColor: C.blue }]} onPress={() => addItem(setTermsConditions, newTerm, setNewTerm)}><Icon name="plus" size={18} color="#fff" /></TouchableOpacity></View>
            <View style={s.itemsList}>{termsConditions.map((item, i) => (<View key={i} style={[s.itemChip, { backgroundColor: '#DBEAFE' }]}><Icon name="info" size={14} color={C.blue} /><Text style={s.itemText}>{item}</Text><TouchableOpacity onPress={() => removeItem(setTermsConditions, i)}><Icon name="x" size={14} color={C.muted} /></TouchableOpacity></View>))}</View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Settings</Text>
            <TouchableOpacity style={s.toggleRow} onPress={() => setIsActive(!isActive)}><View><Text style={s.toggleLabel}>Active</Text><Text style={s.toggleDesc}>Template can be used for quotes</Text></View><View style={[s.toggle, isActive && s.toggleActive]}><View style={[s.toggleThumb, isActive && s.toggleThumbActive]} /></View></TouchableOpacity>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  saveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 }, scrollContent: { padding: 16 },
  section: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  addDefaultText: { fontSize: 14, color: C.blue, fontWeight: '600' },
  inputGroup: { marginBottom: 16 }, label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  input: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipSelected: { backgroundColor: C.purple, borderColor: C.purple },
  chipText: { fontSize: 14, color: C.text, fontWeight: '500' }, chipTextSelected: { color: '#fff' },
  rateRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  currencyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  currencySymbol: { fontSize: 14, fontWeight: '600', color: C.muted, marginRight: 4 },
  currencyField: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },
  addItemRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addItemBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  itemsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
  itemText: { fontSize: 14, color: C.text },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: C.text }, toggleDesc: { fontSize: 13, color: C.muted, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: C.border, padding: 2 },
  toggleActive: { backgroundColor: C.brand }, toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
});

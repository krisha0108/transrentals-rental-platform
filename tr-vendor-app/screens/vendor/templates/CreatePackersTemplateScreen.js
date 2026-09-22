import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getTemplateById, createTemplate, updateTemplate } from '../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../services/alertService';

const C = { bg: '#F7FAFC', surface: '#FFFFFF', text: '#0F172A', muted: '#6B7280', border: '#E5E7EB', brand: '#22C55E', blue: '#2563EB', red: '#EF4444', teal: '#14B8A6' };

const CATEGORIES = [
  { key: 'home', label: 'Home Shifting' },
  { key: 'office', label: 'Office Shifting' },
  { key: 'local', label: 'Local Moving' },
  { key: 'intercity', label: 'Intercity Moving' },
  { key: 'vehicle', label: 'Vehicle Transport' },
];

const SHIFTING_TYPES = [
  '1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Studio', 'Villa', 'Bungalow',
  'Small Office', 'Medium Office', 'Large Office', 'Showroom', 'Warehouse',
  'Few Items', 'Single Room', 'Full House',
];

const DEFAULT_INCLUSIONS = ['Packing material', 'Loading & unloading', 'Transportation', 'Basic insurance', 'Unpacking at destination'];
const DEFAULT_EXCLUSIONS = ['Fragile items special packing', 'Dismantling charges', 'Storage charges', 'Staircase/lift charges'];

export default function CreatePackersTemplateScreen({ route, navigation }) {
  const { templateId, serviceType = 'packers' } = route.params || {};
  const isEditing = !!templateId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedShiftingTypes, setSelectedShiftingTypes] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [termsConditions, setTermsConditions] = useState([]);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => { if (isEditing) fetchTemplate(); }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await getTemplateById(serviceType, templateId);
      const t = response?.template;
      if (t) {
        setName(t.name || ''); setCategory(t.category || ''); setDescription(t.description || '');
        setSelectedShiftingTypes(t.shiftingTypes ? JSON.parse(t.shiftingTypes) : []);
        setInclusions(t.inclusions || []); setExclusions(t.exclusions || []); setTermsConditions(t.termsConditions || []);
        setBaseRateHint(t.baseRateHint?.toString() || '');
        setIsActive(t.isActive ?? true); setIsDefault(t.isDefault ?? false);
      }
    } catch { showError('Failed to load template'); } finally { setLoading(false); }
  };

  const toggle = (arr, setArr, item) => setArr(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]);
  const addItem = (setter, val, clear) => { if (val.trim()) { setter(prev => [...prev, val.trim()]); clear(''); } };
  const removeItem = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) { showError('Template name is required'); return; }
    if (!category) { showError('Please select a category'); return; }
    if (inclusions.length === 0) { showError('At least one inclusion is required'); return; }

    setSaving(true);
    try {
      const data = {
        name: name.trim(), category, description: description.trim() || null,
        shiftingTypes: selectedShiftingTypes.length > 0 ? JSON.stringify(selectedShiftingTypes) : null,
        inclusions, exclusions, termsConditions,
        baseRateHint: baseRateHint ? parseFloat(baseRateHint) : null,
        isActive, isDefault,
      };
      if (isEditing) { await updateTemplate(serviceType, templateId, data); showSuccess('Template updated'); }
      else { await createTemplate(serviceType, data); showSuccess('Template created'); }
      navigation.goBack();
    } catch { showError('Failed to save template'); } finally { setSaving(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={20} color={C.text} /></TouchableOpacity><Text style={s.headerTitle}>{isEditing ? 'Edit' : 'Create'} Template</Text><View style={{ width: 36 }} /></View><View style={s.loaderContainer}><ActivityIndicator size="large" color={C.teal} /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={20} color={C.text} /></TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Edit' : 'New'} Packers Template</Text>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Basic Information</Text>
            <View style={s.inputGroup}><Text style={s.label}>Template Name *</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g., Home Shifting Standard" placeholderTextColor={C.muted} /></View>
            <View style={s.inputGroup}><Text style={s.label}>Category *</Text>
              <View style={s.chipGrid}>{CATEGORIES.map(c => (<TouchableOpacity key={c.key} style={[s.chip, category === c.key && s.chipSelected]} onPress={() => setCategory(c.key)}><Text style={[s.chipText, category === c.key && s.chipTextSelected]}>{c.label}</Text></TouchableOpacity>))}</View>
            </View>
            <View style={s.inputGroup}><Text style={s.label}>Description</Text><TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your template..." placeholderTextColor={C.muted} multiline numberOfLines={3} /></View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Shifting Types</Text>
            <View style={s.chipGrid}>{SHIFTING_TYPES.map(type => (<TouchableOpacity key={type} style={[s.chip, selectedShiftingTypes.includes(type) && s.chipSelected]} onPress={() => toggle(selectedShiftingTypes, setSelectedShiftingTypes, type)}><Text style={[s.chipText, selectedShiftingTypes.includes(type) && s.chipTextSelected]}>{type}</Text></TouchableOpacity>))}</View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Pricing</Text>
            <View style={s.inputGroup}><Text style={s.label}>Base Rate Hint</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={baseRateHint} onChangeText={setBaseRateHint} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>Inclusions *</Text><TouchableOpacity onPress={() => setInclusions(prev => [...prev, ...DEFAULT_INCLUSIONS.filter(i => !prev.includes(i))])}><Text style={s.addDefaultText}>+ Add Defaults</Text></TouchableOpacity></View>
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
            <TouchableOpacity style={s.toggleRow} onPress={() => setIsDefault(!isDefault)}><View><Text style={s.toggleLabel}>Set as Default</Text><Text style={s.toggleDesc}>Use this template by default</Text></View><View style={[s.toggle, isDefault && s.toggleActive]}><View style={[s.toggleThumb, isDefault && s.toggleThumbActive]} /></View></TouchableOpacity>
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
  saveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 }, scrollContent: { padding: 16 },
  section: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  addDefaultText: { fontSize: 14, color: C.blue, fontWeight: '600' },
  inputGroup: { marginBottom: 16 }, label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  input: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipSelected: { backgroundColor: C.teal, borderColor: C.teal },
  chipText: { fontSize: 14, color: C.text, fontWeight: '500' }, chipTextSelected: { color: '#fff' },
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

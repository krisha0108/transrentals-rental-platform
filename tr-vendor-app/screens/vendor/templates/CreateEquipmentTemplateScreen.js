import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getTemplateById, createTemplate, updateTemplate } from '../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../services/alertService';

const C = { bg: '#F7FAFC', surface: '#FFFFFF', text: '#0F172A', muted: '#6B7280', border: '#E5E7EB', brand: '#22C55E', blue: '#2563EB', red: '#EF4444', purple: '#6366F1' };

const CATEGORIES = [
  { key: 'daily', label: 'Daily Rental' },
  { key: 'weekly', label: 'Weekly Rental' },
  { key: 'monthly', label: 'Monthly Rental' },
  { key: 'project', label: 'Project Based' },
];

const EQUIPMENT_TYPES = [
  'Crane', 'Excavator', 'JCB', 'Loader', 'Bulldozer', 'Road Roller', 'Generator', 'Compressor', 'Forklift', 'Concrete Mixer', 'Dumper', 'Hydra', 'Tower Crane', 'Piling Machine', 'Drilling Machine',
];

const DEFAULT_INCLUSIONS = ['Operator charges', 'Fuel charges', 'Basic maintenance', 'Insurance coverage', 'Delivery to site'];
const DEFAULT_EXCLUSIONS = ['Standby charges', 'Extra hours charges', 'Transport for relocation', 'Major repairs'];

export default function CreateEquipmentTemplateScreen({ route, navigation }) {
  const { templateId, serviceType = 'equipment' } = route.params || {};
  const isEditing = !!templateId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [termsConditions, setTermsConditions] = useState([]);
  const [dailyRateHint, setDailyRateHint] = useState('');
  const [weeklyRateHint, setWeeklyRateHint] = useState('');
  const [monthlyRateHint, setMonthlyRateHint] = useState('');
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
        setSelectedEquipmentTypes(t.equipmentTypes ? JSON.parse(t.equipmentTypes) : []);
        setInclusions(t.inclusions || []); setExclusions(t.exclusions || []); setTermsConditions(t.termsConditions || []);
        setDailyRateHint(t.dailyRateHint?.toString() || ''); setWeeklyRateHint(t.weeklyRateHint?.toString() || ''); setMonthlyRateHint(t.monthlyRateHint?.toString() || '');
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
        equipmentTypes: selectedEquipmentTypes.length > 0 ? JSON.stringify(selectedEquipmentTypes) : null,
        inclusions, exclusions, termsConditions,
        dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
        weeklyRateHint: weeklyRateHint ? parseFloat(weeklyRateHint) : null,
        monthlyRateHint: monthlyRateHint ? parseFloat(monthlyRateHint) : null,
        isActive, isDefault,
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
        <Text style={s.headerTitle}>{isEditing ? 'Edit' : 'New'} Equipment Template</Text>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Basic Information</Text>
            <View style={s.inputGroup}><Text style={s.label}>Template Name *</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g., Heavy Equipment Daily" placeholderTextColor={C.muted} /></View>
            <View style={s.inputGroup}><Text style={s.label}>Category *</Text>
              <View style={s.chipGrid}>{CATEGORIES.map(c => (<TouchableOpacity key={c.key} style={[s.chip, category === c.key && s.chipSelected]} onPress={() => setCategory(c.key)}><Text style={[s.chipText, category === c.key && s.chipTextSelected]}>{c.label}</Text></TouchableOpacity>))}</View>
            </View>
            <View style={s.inputGroup}><Text style={s.label}>Description</Text><TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your template..." placeholderTextColor={C.muted} multiline numberOfLines={3} /></View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Equipment Types</Text>
            <View style={s.chipGrid}>{EQUIPMENT_TYPES.map(type => (<TouchableOpacity key={type} style={[s.chip, selectedEquipmentTypes.includes(type) && s.chipSelected]} onPress={() => toggle(selectedEquipmentTypes, setSelectedEquipmentTypes, type)}><Text style={[s.chipText, selectedEquipmentTypes.includes(type) && s.chipTextSelected]}>{type}</Text></TouchableOpacity>))}</View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Rate Hints</Text>
            <View style={s.rateRow}>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Daily</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={dailyRateHint} onChangeText={setDailyRateHint} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Weekly</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={weeklyRateHint} onChangeText={setWeeklyRateHint} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
              <View style={[s.inputGroup, { flex: 1 }]}><Text style={s.label}>Monthly</Text><View style={s.currencyInput}><Text style={s.currencySymbol}>₹</Text><TextInput style={s.currencyField} value={monthlyRateHint} onChangeText={setMonthlyRateHint} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" /></View></View>
            </View>
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
  saveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 }, scrollContent: { padding: 16 },
  section: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  addDefaultText: { fontSize: 13, color: C.blue, fontWeight: '600' },
  inputGroup: { marginBottom: 16 }, label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  input: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipSelected: { backgroundColor: C.purple, borderColor: C.purple },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' }, chipTextSelected: { color: '#fff' },
  rateRow: { flexDirection: 'row', gap: 12 },
  currencyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  currencySymbol: { fontSize: 14, fontWeight: '600', color: C.muted, marginRight: 4 },
  currencyField: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },
  addItemRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addItemBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  itemsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
  itemText: { fontSize: 13, color: C.text },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: C.text }, toggleDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: C.border, padding: 2 },
  toggleActive: { backgroundColor: C.brand }, toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
});

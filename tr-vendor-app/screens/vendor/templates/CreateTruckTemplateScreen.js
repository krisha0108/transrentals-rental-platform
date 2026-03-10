import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getTemplateById, createTemplate, updateTemplate } from '../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  red: '#EF4444',
};

const CATEGORIES = [
  { key: 'full-load', label: 'Full Load' },
  { key: 'part-load', label: 'Part Load' },
  { key: 'container', label: 'Container' },
  { key: 'open', label: 'Open Body' },
  { key: 'closed', label: 'Closed Body' },
];

const TRUCK_TYPES = [
  'Tata Ace (750 kg)',
  '8ft Pickup (1.5 ton)',
  'Eicher 14ft (3-4 ton)',
  'Tata 407 (2.5 ton)',
  'Tata 709 (4-5 ton)',
  'Tata 1109 (8-9 ton)',
  '20ft Container (15-20 ton)',
  '32ft Container (20-25 ton)',
  'Trailer (25-40 ton)',
  'Flatbed Truck',
  'Refrigerated Truck',
];

const DEFAULT_INCLUSIONS = [
  'Loading/unloading assistance',
  'Fuel charges',
  'Driver charges',
  'Toll charges',
  'Insurance coverage',
];

const DEFAULT_EXCLUSIONS = [
  'Packaging material',
  'Detention charges after 4 hours',
  'Entry permit for restricted zones',
  'Multiple pickup/delivery points',
];

export default function CreateTruckTemplateScreen({ route, navigation }) {
  const { templateId, serviceType = 'truck' } = route.params || {};
  const isEditing = !!templateId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTruckTypes, setSelectedTruckTypes] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [termsConditions, setTermsConditions] = useState([]);
  const [ratePerKm, setRatePerKm] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    if (isEditing) fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await getTemplateById(serviceType, templateId);
      const template = response?.template;
      if (template) {
        setName(template.name || '');
        setCategory(template.category || '');
        setDescription(template.description || '');
        setSelectedTruckTypes(template.truckTypes ? JSON.parse(template.truckTypes) : []);
        setInclusions(template.inclusions || []);
        setExclusions(template.exclusions || []);
        setTermsConditions(template.termsConditions || []);
        setRatePerKm(template.ratePerKm?.toString() || '');
        setIsActive(template.isActive ?? true);
        setIsDefault(template.isDefault ?? false);
      }
    } catch (error) {
      showError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const toggleTruckType = (type) => {
    setSelectedTruckTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const addItem = (setter, value, clearSetter) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      clearSetter('');
    }
  };

  const removeItem = (setter, index) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!name.trim()) {
      showError('Template name is required');
      return false;
    }
    if (!category) {
      showError('Please select a category');
      return false;
    }
    if (inclusions.length === 0) {
      showError('At least one inclusion is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        truckTypes: selectedTruckTypes.length > 0 ? JSON.stringify(selectedTruckTypes) : null,
        inclusions,
        exclusions,
        termsConditions,
        ratePerKm: ratePerKm ? parseFloat(ratePerKm) : null,
        isActive,
        isDefault,
      };

      if (isEditing) {
        await updateTemplate(serviceType, templateId, data);
        showSuccess('Template updated');
      } else {
        await createTemplate(serviceType, data);
        showSuccess('Template created');
      }
      navigation.goBack();
    } catch (error) {
      showError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'Create'} Template</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.red} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'New'} Truck Template</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Template Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Full Load Inter-city" placeholderTextColor={C.muted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.chipGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat.key} style={[styles.chip, category === cat.key && styles.chipSelected]} onPress={() => setCategory(cat.key)}>
                    <Text style={[styles.chipText, category === cat.key && styles.chipTextSelected]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your template..." placeholderTextColor={C.muted} multiline numberOfLines={3} />
            </View>
          </View>

          {/* Truck Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Truck Types</Text>
            <View style={styles.chipGrid}>
              {TRUCK_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[styles.chip, selectedTruckTypes.includes(type) && styles.chipSelected]} onPress={() => toggleTruckType(type)}>
                  <Text style={[styles.chipText, selectedTruckTypes.includes(type) && styles.chipTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rate */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rate Per KM</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput style={styles.currencyField} value={ratePerKm} onChangeText={setRatePerKm} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" />
              </View>
            </View>
          </View>

          {/* Inclusions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inclusions *</Text>
              <TouchableOpacity onPress={() => setInclusions(prev => [...prev, ...DEFAULT_INCLUSIONS.filter(i => !prev.includes(i))])}>
                <Text style={styles.addDefaultText}>+ Add Defaults</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addItemRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={newInclusion} onChangeText={setNewInclusion} placeholder="Add inclusion..." placeholderTextColor={C.muted} onSubmitEditing={() => addItem(setInclusions, newInclusion, setNewInclusion)} />
              <TouchableOpacity style={styles.addItemBtn} onPress={() => addItem(setInclusions, newInclusion, setNewInclusion)}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.itemsList}>
              {inclusions.map((item, index) => (
                <View key={index} style={styles.itemChip}>
                  <Icon name="check-circle" size={14} color={C.brand} />
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItem(setInclusions, index)}><Icon name="x" size={14} color={C.muted} /></TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Exclusions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exclusions</Text>
              <TouchableOpacity onPress={() => setExclusions(prev => [...prev, ...DEFAULT_EXCLUSIONS.filter(i => !prev.includes(i))])}>
                <Text style={styles.addDefaultText}>+ Add Defaults</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addItemRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={newExclusion} onChangeText={setNewExclusion} placeholder="Add exclusion..." placeholderTextColor={C.muted} onSubmitEditing={() => addItem(setExclusions, newExclusion, setNewExclusion)} />
              <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: C.red }]} onPress={() => addItem(setExclusions, newExclusion, setNewExclusion)}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.itemsList}>
              {exclusions.map((item, index) => (
                <View key={index} style={[styles.itemChip, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="x-circle" size={14} color={C.red} />
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItem(setExclusions, index)}><Icon name="x" size={14} color={C.muted} /></TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <View style={styles.addItemRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={newTerm} onChangeText={setNewTerm} placeholder="Add term..." placeholderTextColor={C.muted} onSubmitEditing={() => addItem(setTermsConditions, newTerm, setNewTerm)} />
              <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: C.blue }]} onPress={() => addItem(setTermsConditions, newTerm, setNewTerm)}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.itemsList}>
              {termsConditions.map((item, index) => (
                <View key={index} style={[styles.itemChip, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="info" size={14} color={C.blue} />
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItem(setTermsConditions, index)}><Icon name="x" size={14} color={C.muted} /></TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setIsActive(!isActive)}>
              <View>
                <Text style={styles.toggleLabel}>Active</Text>
                <Text style={styles.toggleDesc}>Template can be used for quotes</Text>
              </View>
              <View style={[styles.toggle, isActive && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setIsDefault(!isDefault)}>
              <View>
                <Text style={styles.toggleLabel}>Set as Default</Text>
                <Text style={styles.toggleDesc}>Use this template by default</Text>
              </View>
              <View style={[styles.toggle, isDefault && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isDefault && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  saveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  section: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  addDefaultText: { fontSize: 13, color: C.blue, fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  input: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipSelected: { backgroundColor: C.red, borderColor: C.red },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  currencyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  currencySymbol: { fontSize: 14, fontWeight: '600', color: C.muted, marginRight: 4 },
  currencyField: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },
  addItemRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addItemBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  itemsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
  itemText: { fontSize: 13, color: C.text },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  toggleDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: C.border, padding: 2 },
  toggleActive: { backgroundColor: C.brand },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
});

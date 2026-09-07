import React, { useState, useEffect, useCallback } from 'react';
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
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  pink: '#EC4899',
};

const CATEGORIES = [
  { key: 'local', label: 'Local' },
  { key: 'outstation', label: 'Outstation' },
  { key: 'wedding', label: 'Wedding' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'pilgrimage', label: 'Pilgrimage' },
];

const VEHICLE_TYPES = [
  'Mini Bus (12-15 seater)',
  'Tempo Traveller (17 seater)',
  'Tempo Traveller (26 seater)',
  'Bus (32 seater)',
  'Bus (35 seater)',
  'Bus (41 seater)',
  'Bus (45 seater)',
  'Bus (49 seater)',
  'Volvo Bus (45 seater)',
  'AC Coach',
  'Non-AC Coach',
];

const DEFAULT_INCLUSIONS = [
  'Driver allowance',
  'Fuel charges',
  'Toll charges',
  'State tax & permits',
  'Night halt charges',
];

const DEFAULT_EXCLUSIONS = [
  'Parking charges',
  'Entry fees at monuments',
  'Personal expenses',
  'Tips to driver',
];

export default function CreateBusTemplateScreen({ route, navigation }) {
  const { templateId, serviceType = 'bus' } = route.params || {};
  const isEditing = !!templateId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [termsConditions, setTermsConditions] = useState([]);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [perKmRateHint, setPerKmRateHint] = useState('');
  const [perDayRateHint, setPerDayRateHint] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Input fields for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  // Fetch template data if editing
  useEffect(() => {
    if (isEditing) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await getTemplateById(serviceType, templateId);
      const template = response?.template;
      if (template) {
        setName(template.name || '');
        setCategory(template.category || '');
        setDescription(template.description || '');
        setSelectedVehicleTypes(
          template.vehicleTypes ? JSON.parse(template.vehicleTypes) : []
        );
        setInclusions(template.inclusions || []);
        setExclusions(template.exclusions || []);
        setTermsConditions(template.termsConditions || []);
        setBaseRateHint(template.baseRateHint?.toString() || '');
        setPerKmRateHint(template.perKmRateHint?.toString() || '');
        setPerDayRateHint(template.perDayRateHint?.toString() || '');
        setIsActive(template.isActive ?? true);
        setIsDefault(template.isDefault ?? false);
      }
    } catch (error) {
      console.log('Error fetching template:', error);
      showError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const toggleVehicleType = (type) => {
    setSelectedVehicleTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions(prev => [...prev, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const removeInclusion = (index) => {
    setInclusions(prev => prev.filter((_, i) => i !== index));
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions(prev => [...prev, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const removeExclusion = (index) => {
    setExclusions(prev => prev.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    if (newTerm.trim()) {
      setTermsConditions(prev => [...prev, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const removeTerm = (index) => {
    setTermsConditions(prev => prev.filter((_, i) => i !== index));
  };

  const addDefaultInclusions = () => {
    setInclusions(prev => {
      const newItems = DEFAULT_INCLUSIONS.filter(item => !prev.includes(item));
      return [...prev, ...newItems];
    });
  };

  const addDefaultExclusions = () => {
    setExclusions(prev => {
      const newItems = DEFAULT_EXCLUSIONS.filter(item => !prev.includes(item));
      return [...prev, ...newItems];
    });
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
      const templateData = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        vehicleTypes: selectedVehicleTypes.length > 0 ? JSON.stringify(selectedVehicleTypes) : null,
        inclusions,
        exclusions,
        termsConditions,
        baseRateHint: baseRateHint ? parseFloat(baseRateHint) : null,
        perKmRateHint: perKmRateHint ? parseFloat(perKmRateHint) : null,
        perDayRateHint: perDayRateHint ? parseFloat(perDayRateHint) : null,
        isActive,
        isDefault,
      };

      if (isEditing) {
        await updateTemplate(serviceType, templateId, templateData);
        showSuccess('Template updated successfully');
      } else {
        await createTemplate(serviceType, templateData);
        showSuccess('Template created successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error saving template:', error);
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
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Template' : 'Create Template'}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.pink} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Bus Template' : 'New Bus Template'}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="check" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Template Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Outstation Premium Package"
                placeholderTextColor={C.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.chipGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.chip,
                      category === cat.key && styles.chipSelected,
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === cat.key && styles.chipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your template..."
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Vehicle Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Types</Text>
            <View style={styles.chipGrid}>
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    selectedVehicleTypes.includes(type) && styles.chipSelected,
                  ]}
                  onPress={() => toggleVehicleType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedVehicleTypes.includes(type) && styles.chipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rate Hints */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Hints</Text>
            <Text style={styles.sectionSubtitle}>
              Set approximate rates to help you create quotes faster
            </Text>

            <View style={styles.rateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Base Rate</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.currencyField}
                    value={baseRateHint}
                    onChangeText={setBaseRateHint}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Per KM Rate</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.currencyField}
                    value={perKmRateHint}
                    onChangeText={setPerKmRateHint}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Per Day Rate</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.currencyField}
                    value={perDayRateHint}
                    onChangeText={setPerDayRateHint}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Inclusions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inclusions *</Text>
              <TouchableOpacity onPress={addDefaultInclusions}>
                <Text style={styles.addDefaultText}>+ Add Defaults</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newInclusion}
                onChangeText={setNewInclusion}
                placeholder="Add inclusion..."
                placeholderTextColor={C.muted}
                onSubmitEditing={addInclusion}
              />
              <TouchableOpacity style={styles.addItemBtn} onPress={addInclusion}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.itemsList}>
              {inclusions.map((item, index) => (
                <View key={index} style={styles.itemChip}>
                  <Icon name="check-circle" size={14} color={C.brand} />
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeInclusion(index)}>
                    <Icon name="x" size={14} color={C.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Exclusions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exclusions</Text>
              <TouchableOpacity onPress={addDefaultExclusions}>
                <Text style={styles.addDefaultText}>+ Add Defaults</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newExclusion}
                onChangeText={setNewExclusion}
                placeholder="Add exclusion..."
                placeholderTextColor={C.muted}
                onSubmitEditing={addExclusion}
              />
              <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: C.red }]} onPress={addExclusion}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.itemsList}>
              {exclusions.map((item, index) => (
                <View key={index} style={[styles.itemChip, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="x-circle" size={14} color={C.red} />
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeExclusion(index)}>
                    <Icon name="x" size={14} color={C.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newTerm}
                onChangeText={setNewTerm}
                placeholder="Add term..."
                placeholderTextColor={C.muted}
                onSubmitEditing={addTerm}
              />
              <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: C.blue }]} onPress={addTerm}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.itemsList}>
              {termsConditions.map((item, index) => (
                <View key={index} style={[styles.itemChip, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="info" size={14} color={C.blue} />
                  <Text style={styles.itemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeTerm(index)}>
                    <Icon name="x" size={14} color={C.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsActive(!isActive)}
            >
              <View>
                <Text style={styles.toggleLabel}>Active</Text>
                <Text style={styles.toggleDesc}>Template can be used for quotes</Text>
              </View>
              <View style={[styles.toggle, isActive && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsDefault(!isDefault)}
            >
              <View>
                <Text style={styles.toggleLabel}>Set as Default</Text>
                <Text style={styles.toggleDesc}>Use this template by default for {category || 'this category'}</Text>
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
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: C.muted,
    marginTop: -8,
    marginBottom: 12,
  },
  addDefaultText: {
    fontSize: 14,
    color: C.blue,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipSelected: {
    backgroundColor: C.pink,
    borderColor: C.pink,
  },
  chipText: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  rateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: C.muted,
    marginRight: 4,
  },
  currencyField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addItemBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  itemText: {
    fontSize: 14,
    color: C.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  toggleDesc: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: C.brand,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});

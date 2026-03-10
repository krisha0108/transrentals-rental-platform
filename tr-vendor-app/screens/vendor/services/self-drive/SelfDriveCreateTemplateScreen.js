import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createTemplate } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../../services/alertService';

const SERVICE_COLOR = '#3B82F6'; // Blue for self-drive
const GREEN = '#09B368';
const DARK = '#0F172A';
const BG = '#F5F5F7';

const SELF_DRIVE_CATEGORIES = [
  { id: 'hatchback', name: 'Hatchback', icon: 'car-hatchback' },
  { id: 'sedan', name: 'Sedan', icon: 'car-sedan' },
  { id: 'suv', name: 'SUV', icon: 'car-estate' },
  { id: 'muv', name: 'MUV', icon: 'van-utility' },
  { id: 'compact-suv', name: 'Compact SUV', icon: 'car-sports' },
  { id: 'luxury', name: 'Luxury', icon: 'car-sports' },
];

const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Hatchback Daily Rental',
    category: 'hatchback',
    description: 'Perfect for city commute and short trips',
    inclusions: [
      'Free delivery & pickup within city',
      'Comprehensive insurance',
      '120 km/day limit',
      '24x7 roadside assistance',
    ],
    exclusions: [
      'Fuel charges',
      'Toll & parking charges',
      'State permit charges (if applicable)',
      'Extra km charges apply',
    ],
    terms: [
      'Valid driving license mandatory',
      'Security deposit refunded within 7 days',
      'Car must be returned with same fuel level',
      'Late return charges: ₹200/hour',
    ],
    dailyRateHint: 1200,
    kmLimitPerDay: 120,
    extraKmRateHint: 10,
    securityDepositHint: 3000,
  },
  {
    name: 'SUV Weekend Package',
    category: 'suv',
    description: 'Ideal for weekend getaways and family trips',
    inclusions: [
      'Free pickup/drop within 10km',
      'Zero depreciation insurance',
      '300 km/day limit',
      'GPS navigation included',
      '24x7 support',
    ],
    exclusions: [
      'Fuel charges',
      'Inter-state travel charges',
      'Toll, parking & permit fees',
      'Driver charges (if needed)',
    ],
    terms: [
      'Minimum 2 days booking required',
      'Valid license with 2+ years experience',
      'Advance booking recommended',
      'Cancellation: 24 hours notice required',
    ],
    dailyRateHint: 3500,
    kmLimitPerDay: 300,
    extraKmRateHint: 15,
    securityDepositHint: 8000,
  },
  {
    name: 'Luxury Sedan Premium',
    category: 'luxury',
    description: 'Premium experience for business and special occasions',
    inclusions: [
      'Complimentary airport pickup/drop',
      'Full insurance coverage',
      'Unlimited km (within city)',
      'Premium fuel included for 1st tank',
      'Concierge support',
    ],
    exclusions: [
      'Inter-city travel charges extra',
      'Additional driver charges',
      'Toll & parking fees',
    ],
    terms: [
      'Valid license with 3+ years experience',
      'Verification & KYC mandatory',
      'Premium deposit required',
      'Late charges: ₹500/hour',
    ],
    dailyRateHint: 6000,
    kmLimitPerDay: 150,
    extraKmRateHint: 25,
    securityDepositHint: 15000,
  },
];

const SelfDriveCreateTemplateScreen = ({ navigation }) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('hatchback');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState([]);
  const [newInclusion, setNewInclusion] = useState('');
  const [exclusions, setExclusions] = useState([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [kmLimit, setKmLimit] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSuggestion = (suggestion) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setDescription(suggestion.description);
    setInclusions(suggestion.inclusions);
    setExclusions(suggestion.exclusions);
    setTerms(suggestion.terms);
    setDailyRate(suggestion.dailyRateHint.toString());
    setKmLimit(suggestion.kmLimitPerDay.toString());
    setExtraKmRate(suggestion.extraKmRateHint.toString());
    setSecurityDeposit(suggestion.securityDepositHint.toString());
    setShowSuggestions(false);
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const removeInclusion = (index) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const removeExclusion = (index) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    if (newTerm.trim()) {
      setTerms([...terms, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const removeTerm = (index) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      showError('Please enter a template name');
      return;
    }

    try {
      setIsSubmitting(true);

      const templateData = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        inclusions,
        exclusions,
        termsConditions: terms,
        dailyRateHint: dailyRate ? parseFloat(dailyRate) : null,
        kmLimitPerDay: kmLimit ? parseInt(kmLimit) : null,
        extraKmRateHint: extraKmRate ? parseFloat(extraKmRate) : null,
        securityDepositHint: securityDeposit ? parseFloat(securityDeposit) : null,
        isDefault,
        isActive: true,
      };

      await createTemplate('self-drive', templateData);

      showSuccess('Template created successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Failed to create template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={DARK} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Template</Text>
            <Text style={styles.headerSubtitle}>Self-Drive Quote Template</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Saving...</Text>
            ) : (
              <>
                <Icon name="check" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Start Suggestions */}
          {showSuggestions && (
            <View style={styles.suggestionsCard}>
              <View style={styles.suggestionsHeader}>
                <View style={styles.suggestionsHeaderLeft}>
                  <Icon name="zap" size={20} color="#F59E0B" />
                  <Text style={styles.suggestionsTitle}>Quick Start</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                  <Icon name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.suggestionsSubtitle}>
                Choose a pre-built template to get started quickly
              </Text>
              {TEMPLATE_SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => loadSuggestion(suggestion)}
                >
                  <MaterialCommunityIcons
                    name={
                      SELF_DRIVE_CATEGORIES.find((c) => c.id === suggestion.category)?.icon ||
                      'car'
                    }
                    size={24}
                    color={SERVICE_COLOR}
                  />
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Template Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Hatchback Daily Rental"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.categoryGrid}>
                {SELF_DRIVE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      category === cat.id && styles.categoryOptionActive,
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={20}
                      color={category === cat.id ? '#FFF' : SERVICE_COLOR}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat.id && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of this template"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Rate Hints */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Hints (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              These values will auto-fill when using this template
            </Text>

            <View style={styles.rateGrid}>
              <View style={styles.rateInput}>
                <Text style={styles.label}>Daily Rate (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={dailyRate}
                  onChangeText={setDailyRate}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.rateInput}>
                <Text style={styles.label}>KM/Day</Text>
                <TextInput
                  style={styles.input}
                  value={kmLimit}
                  onChangeText={setKmLimit}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.rateGrid}>
              <View style={styles.rateInput}>
                <Text style={styles.label}>Extra KM (₹/km)</Text>
                <TextInput
                  style={styles.input}
                  value={extraKmRate}
                  onChangeText={setExtraKmRate}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.rateInput}>
                <Text style={styles.label}>Security Deposit (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={securityDeposit}
                  onChangeText={setSecurityDeposit}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Inclusions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inclusions</Text>
            <Text style={styles.sectionSubtitle}>What's included in the package</Text>

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newInclusion}
                onChangeText={setNewInclusion}
                placeholder="Add inclusion..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addInclusion}
              />
              <TouchableOpacity style={styles.addItemButton} onPress={addInclusion}>
                <Icon name="plus" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {inclusions.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="check-circle" size={16} color={GREEN} />
                <Text style={styles.listItemText}>{item}</Text>
                <TouchableOpacity onPress={() => removeInclusion(index)}>
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Exclusions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Text style={styles.sectionSubtitle}>What's not included</Text>

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newExclusion}
                onChangeText={setNewExclusion}
                placeholder="Add exclusion..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addExclusion}
              />
              <TouchableOpacity style={styles.addItemButton} onPress={addExclusion}>
                <Icon name="plus" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {exclusions.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="x-circle" size={16} color="#EF4444" />
                <Text style={styles.listItemText}>{item}</Text>
                <TouchableOpacity onPress={() => removeExclusion(index)}>
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Terms & Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.sectionSubtitle}>Important rental policies</Text>

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newTerm}
                onChangeText={setNewTerm}
                placeholder="Add term/condition..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addTerm}
              />
              <TouchableOpacity style={styles.addItemButton} onPress={addTerm}>
                <Icon name="plus" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {terms.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="info" size={16} color={SERVICE_COLOR} />
                <Text style={styles.listItemText}>{item}</Text>
                <TouchableOpacity onPress={() => removeTerm(index)}>
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Default Template */}
          <View style={styles.section}>
            <View style={styles.defaultToggle}>
              <View style={styles.defaultToggleInfo}>
                <Text style={styles.defaultToggleTitle}>Set as Default Template</Text>
                <Text style={styles.defaultToggleSubtitle}>
                  Auto-select this template when creating quotes
                </Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: '#E2E8F0', true: SERVICE_COLOR + '40' }}
                thumbColor={isDefault ? SERVICE_COLOR : '#F1F5F9'}
              />
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SERVICE_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  suggestionsCard: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suggestionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  suggestionsSubtitle: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SERVICE_COLOR,
    backgroundColor: '#FFF',
    gap: 6,
  },
  categoryOptionActive: {
    backgroundColor: SERVICE_COLOR,
    borderColor: SERVICE_COLOR,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: SERVICE_COLOR,
  },
  categoryOptionTextActive: {
    color: '#FFF',
  },
  rateGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rateInput: {
    flex: 1,
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: DARK,
  },
  addItemButton: {
    backgroundColor: SERVICE_COLOR,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultToggleInfo: {
    flex: 1,
  },
  defaultToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  defaultToggleSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  bottomPadding: {
    height: 24,
  },
});

export default SelfDriveCreateTemplateScreen;

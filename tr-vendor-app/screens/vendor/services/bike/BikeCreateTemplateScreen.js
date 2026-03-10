/**
 * BikeCreateTemplateScreen.js - Create new bike rental quote template
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { createTemplate } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../services/alertService';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';
const SERVICE_COLOR = '#FF6B35';

const BIKE_CATEGORIES = [
  { id: 'commuter', name: 'Commuter' },
  { id: 'sports', name: 'Sports' },
  { id: 'touring', name: 'Touring' },
  { id: 'cruiser', name: 'Cruiser' },
  { id: 'scooter', name: 'Scooter' },
  { id: 'electric', name: 'Electric' },
];

const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Daily Commute Bike',
    category: 'commuter',
    description: 'Perfect for daily office commute and city travel',
    inclusions: ['Bike with 2 helmets', 'Valid insurance & registration', 'Free pickup & drop at your location', '24x7 roadside assistance', 'No hidden charges'],
    exclusions: ['Fuel charges', 'Traffic challans/fines', 'Helmet replacement if damaged', 'Any modifications to bike'],
    terms: ['Valid 2-wheeler license required', 'Original Aadhaar card required', 'Security deposit: ₹1,000 refundable', 'Rental period: 24 hours from pickup', 'Late return charges: ₹50/hour', 'Monthly packages available at discounted rates'],
    dailyRateHint: 300,
    weeklyRateHint: 1800,
    monthlyRateHint: 6000,
    securityDepositHint: 1000,
  },
  {
    name: 'Weekend Sports Bike',
    category: 'sports',
    description: 'High-performance bikes for weekend adventures',
    inclusions: ['Sports bike with 2 premium helmets', 'Comprehensive insurance coverage', '24x7 roadside assistance', 'Free bike wash on return', 'Riding gloves included', 'GPS tracker for safety'],
    exclusions: ['Fuel charges', 'Racing or stunt activities', 'Traffic challans/fines', 'Damage due to negligence', 'Riding gear (except helmets)'],
    terms: ['Valid 2-wheeler license (2+ years old) required', 'Original Aadhaar & PAN card required', 'Security deposit: ₹5,000 refundable', 'Age: 23-50 years only', 'No racing or stunt riding allowed', 'Late return charges: ₹200/hour', 'Weekend packages: Friday to Monday'],
    dailyRateHint: 1500,
    weeklyRateHint: 9000,
    monthlyRateHint: 30000,
    securityDepositHint: 5000,
  },
  {
    name: 'Scooty/Scooter Rental',
    category: 'scooter',
    description: 'Easy-to-ride scooters for everyone',
    inclusions: ['Scooty with 2 helmets', 'Valid insurance & registration', 'Easy pickup & drop', '24x7 support', 'Storage box included'],
    exclusions: ['Fuel charges', 'Traffic challans/fines', 'Helmet replacement if lost', 'Long distance travel'],
    terms: ['Valid 2-wheeler license required', 'Original ID proof required', 'Security deposit: ₹500 refundable', 'City limits only', 'Late return charges: ₹30/hour', 'Student discounts available'],
    dailyRateHint: 250,
    weeklyRateHint: 1500,
    monthlyRateHint: 5000,
    securityDepositHint: 500,
  },
];

export default function BikeCreateTemplateScreen({ navigation }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const loadSuggestion = (suggestion) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setDescription(suggestion.description);
    setInclusions(suggestion.inclusions);
    setExclusions(suggestion.exclusions);
    setTerms(suggestion.terms);
    setDailyRate(suggestion.dailyRateHint.toString());
    setWeeklyRate(suggestion.weeklyRateHint.toString());
    setMonthlyRate(suggestion.monthlyRateHint.toString());
    setSecurityDeposit(suggestion.securityDepositHint.toString());
    setShowSuggestions(false);
  };

  const addInclusion = () => {
    if (newInclusion.trim() && !inclusions.includes(newInclusion.trim())) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const removeInclusion = (item) => {
    setInclusions(inclusions.filter((i) => i !== item));
  };

  const addExclusion = () => {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const removeExclusion = (item) => {
    setExclusions(exclusions.filter((i) => i !== item));
  };

  const addTerm = () => {
    if (newTerm.trim() && !terms.includes(newTerm.trim())) {
      setTerms([...terms, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const removeTerm = (item) => {
    setTerms(terms.filter((i) => i !== item));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category) {
      showError('Please enter template name and select category');
      return;
    }

    if (inclusions.length === 0) {
      showError('Please add at least one inclusion');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTemplate('bike', {
        name: name.trim(),
        category,
        description: description.trim() || null,
        inclusions,
        exclusions,
        termsConditions: terms,
        dailyRateHint: dailyRate ? parseFloat(dailyRate) : null,
        weeklyRateHint: weeklyRate ? parseFloat(weeklyRate) : null,
        monthlyRateHint: monthlyRate ? parseFloat(monthlyRate) : null,
        securityDepositHint: securityDeposit ? parseFloat(securityDeposit) : null,
        isDefault,
        isActive: true,
      });

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Create Bike Template</Text>
          <Text style={styles.headerSubtitle}>Quick quotes made easy</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Start Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsBox}>
            <View style={styles.suggestionsHeader}>
              <Icon name="lightbulb" size={20} color={SERVICE_COLOR} />
              <Text style={styles.suggestionsTitle}>Quick Start - Choose a Template</Text>
            </View>
            <Text style={styles.suggestionsSubtitle}>Load a pre-built template and customize as needed</Text>
            {TEMPLATE_SUGGESTIONS.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionCard}
                onPress={() => loadSuggestion(suggestion)}
              >
                <Text style={styles.suggestionName}>{suggestion.name}</Text>
                <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setShowSuggestions(false)}
            >
              <Text style={styles.skipButtonText}>Or Start from Scratch</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Template Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Standard Commuter Bike"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {BIKE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brief description of this template..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Rate Hints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Hints (Optional)</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Daily Rate (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 300"
                value={dailyRate}
                onChangeText={setDailyRate}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Weekly Rate (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1800"
                value={weeklyRate}
                onChangeText={setWeeklyRate}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Monthly Rate (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 6000"
                value={monthlyRate}
                onChangeText={setMonthlyRate}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Security Deposit (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1000"
                value={securityDeposit}
                onChangeText={setSecurityDeposit}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Inclusions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="check-circle" size={16} color={GREEN} /> Inclusions *
          </Text>
          <View style={styles.addItemRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Add inclusion..."
              value={newInclusion}
              onChangeText={setNewInclusion}
            />
            <TouchableOpacity style={styles.addButton} onPress={addInclusion}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {inclusions.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Icon name="check" size={16} color={GREEN} />
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeInclusion(item)}>
                <Icon name="x" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Exclusions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="x-circle" size={16} color="#EF4444" /> Exclusions
          </Text>
          <View style={styles.addItemRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Add exclusion..."
              value={newExclusion}
              onChangeText={setNewExclusion}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: '#EF4444' }]} onPress={addExclusion}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {exclusions.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Icon name="x" size={16} color="#EF4444" />
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeExclusion(item)}>
                <Icon name="x" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <View style={styles.addItemRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Add term..."
              value={newTerm}
              onChangeText={setNewTerm}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTerm}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {terms.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listItemNumber}>{idx + 1}.</Text>
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeTerm(item)}>
                <Icon name="x" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
              {isDefault && <Icon name="check" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Set as default template for this category</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Icon name="save" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Template'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  suggestionsBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginLeft: 8,
  },
  suggestionsSubtitle: {
    fontSize: 13,
    color: '#EA580C',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: SERVICE_COLOR,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: DARK,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: SERVICE_COLOR,
    borderColor: SERVICE_COLOR,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 13,
    color: DARK,
    marginLeft: 8,
  },
  listItemNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: SERVICE_COLOR,
    marginRight: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: SERVICE_COLOR,
    borderColor: SERVICE_COLOR,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: DARK,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: SERVICE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

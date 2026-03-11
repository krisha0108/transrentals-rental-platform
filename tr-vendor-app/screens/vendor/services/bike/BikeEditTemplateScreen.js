/**
 * BikeEditTemplateScreen.js - Edit existing bike rental quote template
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getTemplateById, updateTemplate } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../../services/alertService';

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

export default function BikeEditTemplateScreen({ navigation, route }) {
  const { templateId } = route.params;
  const [loading, setLoading] = useState(true);
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

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const template = await getTemplateById('bike', templateId);
      setName(template.name);
      setCategory(template.category);
      setDescription(template.description || '');
      setInclusions(template.inclusions || []);
      setExclusions(template.exclusions || []);
      setTerms(template.termsConditions || []);
      setDailyRate(template.dailyRateHint ? template.dailyRateHint.toString() : '');
      setWeeklyRate(template.weeklyRateHint ? template.weeklyRateHint.toString() : '');
      setMonthlyRate(template.monthlyRateHint ? template.monthlyRateHint.toString() : '');
      setSecurityDeposit(template.securityDepositHint ? template.securityDepositHint.toString() : '');
      setIsDefault(template.isDefault || false);
    } catch (error) {
      showError('Failed to load template');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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
      await updateTemplate('bike', templateId, {
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
      });

      showSuccess('Template updated successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      console.error('Error updating template:', error);
      showError('Failed to update template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SERVICE_COLOR} />
          <Text style={styles.loadingText}>Loading template...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Template</Text>
          <Text style={styles.headerSubtitle}>Update template details</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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

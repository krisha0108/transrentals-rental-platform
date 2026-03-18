/**
 * TruckEditTemplateScreen.js - Edit existing truck service quote template
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTemplateById, updateTemplate } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';

const { width: W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

const TRUCK_CATEGORIES = [
  { id: 'mini', name: 'Mini Truck', icon: 'truck' },
  { id: 'light', name: 'Light Truck', icon: 'truck-delivery' },
  { id: 'medium', name: 'Medium Truck', icon: 'truck-delivery' },
  { id: 'heavy', name: 'Heavy Truck', icon: 'truck' },
  { id: 'container', name: 'Container', icon: 'truck-cargo-container' },
  { id: 'tipper', name: 'Tipper', icon: 'dump-truck' },
];

export default function TruckEditTemplateScreen({ navigation, route }) {
  const { templateId } = route.params;
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
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

  useEffect(() => { loadTemplate(); }, []);

  const loadTemplate = async () => {
    try {
      const t = await getTemplateById('truck', templateId);
      setTemplateName(t.name);
      setName(t.name);
      setCategory(t.category);
      setDescription(t.description || '');
      setInclusions(t.inclusions || []);
      setExclusions(t.exclusions || []);
      setTerms(t.termsConditions || []);
      setDailyRate(t.dailyRateHint ? t.dailyRateHint.toString() : '');
      setWeeklyRate(t.weeklyRateHint ? t.weeklyRateHint.toString() : '');
      setMonthlyRate(t.monthlyRateHint ? t.monthlyRateHint.toString() : '');
      setSecurityDeposit(t.securityDepositHint ? t.securityDepositHint.toString() : '');
      setIsDefault(t.isDefault || false);
    } catch {
      showError('Failed to load template');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const addItem = (val, list, setList, setVal) => {
    const v = val.trim();
    if (v && !list.includes(v)) { setList([...list, v]); setVal(''); }
  };

  const removeItem = (item, list, setList) => setList(list.filter(i => i !== item));

  const handleSubmit = async () => {
    if (!name.trim() || !category) { showError('Please enter template name and select category'); return; }
    if (inclusions.length === 0) { showError('Please add at least one inclusion'); return; }

    setIsSubmitting(true);
    try {
      await updateTemplate('truck', templateId, {
        name: name.trim(), category,
        description: description.trim() || null,
        inclusions, exclusions,
        termsConditions: terms,
        dailyRateHint: dailyRate ? parseFloat(dailyRate) : null,
        weeklyRateHint: weeklyRate ? parseFloat(weeklyRate) : null,
        monthlyRateHint: monthlyRate ? parseFloat(monthlyRate) : null,
        securityDepositHint: securityDeposit ? parseFloat(securityDeposit) : null,
        isDefault,
      });
      showSuccess('Template updated!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch {
      showError('Failed to update template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionCard = ({ icon, iconColor, iconBg, title, children }) => (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <View style={[s.sectionIconBox, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={16} color={iconColor} />
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.hero}>
          <View style={s.heroRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>Edit Template</Text>
              <Text style={s.heroSub}>Loading template data...</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={s.loadingWrap}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={C.g600} />
            <Text style={s.loadingText}>Loading template...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Hero Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.hero}>
        <View style={[s.deco, { width: 160, height: 160, top: -50, right: -30, opacity: 0.07 }]} />
        <View style={[s.deco, { width: 70, height: 70, top: 15, right: 80, opacity: 0.05 }]} />
        <View style={s.heroRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={s.editBadgeRow}>
              <View style={s.editBadge}>
                <Icon name="edit-2" size={11} color={C.g400} />
                <Text style={s.editBadgeText}>Editing</Text>
              </View>
            </View>
            <Text style={s.heroTitle} numberOfLines={1}>{templateName}</Text>
            <Text style={s.heroSub}>Update template details</Text>
          </View>
          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color={C.g400} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <SectionCard icon="info" iconColor={C.indigo} iconBg={C.indigoL} title="Basic Information">
          <Text style={s.label}>Template Name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Mini Truck City Delivery"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={s.label}>Category *</Text>
          <View style={s.catGrid}>
            {TRUCK_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, category === cat.id && s.catChipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={13}
                  color={category === cat.id ? '#fff' : C.sub}
                />
                <Text style={[s.catChipText, category === cat.id && s.catChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Description <Text style={s.optional}>(optional)</Text></Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Brief description of this template..."
            placeholderTextColor={C.muted}
            value={description}
            onChangeText={setDescription}
            multiline numberOfLines={3}
          />
        </SectionCard>

        {/* Rate Hints */}
        <SectionCard icon="tag" iconColor={C.amber} iconBg={C.amberL} title="Rate Hints">
          <Text style={s.sectionNote}>These are hints only — actual rates set while quoting</Text>
          <View style={s.rateGrid}>
            {[
              { label: 'Daily Rate (₹)', val: dailyRate, set: setDailyRate, ph: '2000' },
              { label: 'Weekly Rate (₹)', val: weeklyRate, set: setWeeklyRate, ph: '12000' },
              { label: 'Monthly Rate (₹)', val: monthlyRate, set: setMonthlyRate, ph: '45000' },
              { label: 'Security Deposit (₹)', val: securityDeposit, set: setSecurityDeposit, ph: '5000' },
            ].map((f, i) => (
              <View key={i} style={s.rateField}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  placeholder={f.ph}
                  placeholderTextColor={C.muted}
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Inclusions */}
        <SectionCard icon="check-circle" iconColor={C.g600} iconBg={C.g50} title="Inclusions *">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              placeholder="Add inclusion item..."
              placeholderTextColor={C.muted}
              value={newInclusion}
              onChangeText={setNewInclusion}
              onSubmitEditing={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: C.g600 }]}
              onPress={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {inclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.g50, borderColor: C.g400 + '40' }]}>
              <View style={s.listDot}>
                <Icon name="check" size={11} color="#fff" />
              </View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, inclusions, setInclusions)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {inclusions.length === 0 && <Text style={s.emptyHint}>No inclusions added yet</Text>}
        </SectionCard>

        {/* Exclusions */}
        <SectionCard icon="x-circle" iconColor={C.red} iconBg={C.redL} title="Exclusions">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              placeholder="Add exclusion item..."
              placeholderTextColor={C.muted}
              value={newExclusion}
              onChangeText={setNewExclusion}
              onSubmitEditing={() => addItem(newExclusion, exclusions, setExclusions, setNewExclusion)}
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: C.red }]}
              onPress={() => addItem(newExclusion, exclusions, setExclusions, setNewExclusion)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {exclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.redL, borderColor: C.red + '30' }]}>
              <View style={[s.listDot, { backgroundColor: C.red }]}>
                <Icon name="x" size={11} color="#fff" />
              </View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, exclusions, setExclusions)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {exclusions.length === 0 && <Text style={s.emptyHint}>No exclusions added yet</Text>}
        </SectionCard>

        {/* Terms */}
        <SectionCard icon="file-text" iconColor={C.indigo} iconBg={C.indigoL} title="Terms & Conditions">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              placeholder="Add a term or condition..."
              placeholderTextColor={C.muted}
              value={newTerm}
              onChangeText={setNewTerm}
              onSubmitEditing={() => addItem(newTerm, terms, setTerms, setNewTerm)}
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: C.indigo }]}
              onPress={() => addItem(newTerm, terms, setTerms, setNewTerm)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {terms.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.indigoL, borderColor: C.indigo + '30' }]}>
              <View style={s.termNumBox}>
                <Text style={s.termNumText}>{i + 1}</Text>
              </View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, terms, setTerms)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {terms.length === 0 && <Text style={s.emptyHint}>No terms added yet</Text>}
        </SectionCard>

        {/* Settings */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.checkRow}
            onPress={() => setIsDefault(!isDefault)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, isDefault && s.checkboxOn]}>
              {isDefault && <Icon name="check" size={13} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.checkLabel}>Set as default template</Text>
              <Text style={s.checkSub}>Auto-selected when creating quotes for this category</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Icon name="save" size={18} color="#fff" />
          <Text style={s.submitBtnText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  hero: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editBadgeRow: { marginBottom: 3 },
  editBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editBadgeText: { fontSize: 10, fontWeight: '700', color: C.g400 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBadge: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.g400 + '50',
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: '500' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  section: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconBox: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  sectionNote: { fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 17 },

  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 7 },
  optional: { fontWeight: '400', color: C.muted },

  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.text, backgroundColor: C.bg, marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: C.bg,
    borderWidth: 1.5, borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.g700, borderColor: C.g700 },
  catChipText: { fontSize: 13, fontWeight: '600', color: C.sub },
  catChipTextActive: { color: '#fff' },

  rateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  rateField: { width: '50%', paddingRight: 8 },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  addInput: { flex: 1, marginBottom: 0 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 10, marginBottom: 7, borderWidth: 1,
  },
  listDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.g600, justifyContent: 'center', alignItems: 'center',
  },
  listItemText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },
  removeBtn: { padding: 4 },
  termNumBox: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: C.indigo,
    justifyContent: 'center', alignItems: 'center',
  },
  termNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  emptyHint: { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 8 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  checkboxOn: { backgroundColor: C.g700, borderColor: C.g700 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  checkSub: { fontSize: 12, color: C.muted },

  footer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, gap: 12,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
  submitBtn: {
    flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.g700, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

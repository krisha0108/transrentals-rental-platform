/**
 * SelfDriveCreateTemplateScreen.js - Create new self-drive quote template
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Switch, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createTemplate } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';

const { width: W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#047857',
  g500: '#059669', g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  green: '#059669', greenL: '#ECFDF5',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

const SELF_DRIVE_CATEGORIES = [
  { id: 'hatchback',   name: 'Hatchback',   icon: 'car-hatchback' },
  { id: 'sedan',       name: 'Sedan',       icon: 'car-sedan'     },
  { id: 'suv',         name: 'SUV',         icon: 'car-estate'    },
  { id: 'muv',         name: 'MUV',         icon: 'van-utility'   },
  { id: 'compact-suv', name: 'Compact SUV', icon: 'car-sports'    },
  { id: 'luxury',      name: 'Luxury',      icon: 'car-sports'    },
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
    ],
    terms: [
      'Valid driving license mandatory',
      'Security deposit refunded within 7 days',
      'Car must be returned with same fuel level',
      'Late return charges: ₹200/hour',
    ],
    dailyRate: '1200', kmLimit: '120', extraKmRate: '10', securityDeposit: '3000',
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
    ],
    exclusions: [
      'Fuel charges',
      'Inter-state travel charges',
      'Toll, parking & permit fees',
    ],
    terms: [
      'Minimum 2 days booking required',
      'Valid license with 2+ years experience',
      'Cancellation: 24 hours notice required',
    ],
    dailyRate: '3500', kmLimit: '300', extraKmRate: '15', securityDeposit: '8000',
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
    ],
    exclusions: [
      'Inter-city travel charges extra',
      'Additional driver charges',
      'Toll & parking fees',
    ],
    terms: [
      'Valid license with 3+ years experience',
      'Verification & KYC mandatory',
      'Late charges: ₹500/hour',
    ],
    dailyRate: '6000', kmLimit: '150', extraKmRate: '25', securityDeposit: '15000',
  },
];

const catIcon = (id) => {
  const cat = SELF_DRIVE_CATEGORIES.find(c => c.id === id);
  return cat ? cat.icon : 'car';
};

export default function SelfDriveCreateTemplateScreen({ navigation }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [dailyRate, setDailyRate] = useState('');
  const [kmLimit, setKmLimit] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const loadSuggestion = (sg) => {
    setName(sg.name); setCategory(sg.category); setDescription(sg.description);
    setInclusions(sg.inclusions); setExclusions(sg.exclusions); setTerms(sg.terms);
    setDailyRate(sg.dailyRate); setKmLimit(sg.kmLimit);
    setExtraKmRate(sg.extraKmRate); setSecurityDeposit(sg.securityDeposit);
    setShowSuggestions(false);
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
      await createTemplate('self-drive', {
        name: name.trim(), category,
        description: description.trim() || null,
        inclusions, exclusions,
        termsConditions: terms,
        dailyRateHint:       dailyRate       ? parseFloat(dailyRate)       : null,
        kmLimitPerDay:       kmLimit         ? parseInt(kmLimit)           : null,
        extraKmRateHint:     extraKmRate     ? parseFloat(extraKmRate)     : null,
        securityDepositHint: securityDeposit ? parseFloat(securityDeposit) : null,
        isDefault, isActive: true,
      });
      showSuccess('Template created!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      showError('Failed to create template. Please try again.');
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
            <Text style={s.heroTitle}>New Template</Text>
            <Text style={s.heroSub}>Create a reusable self-drive quote template</Text>
          </View>
          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="car" size={20} color={C.g400} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Quick Start */}
        {showSuggestions && (
          <View style={s.quickBox}>
            <LinearGradient colors={[C.g50, '#fff']} style={s.quickHeader}>
              <View style={s.quickIconBox}>
                <Ionicons name="flash" size={18} color={C.g700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.quickTitle}>Quick Start Templates</Text>
                <Text style={s.quickSub}>Load a pre-built template and customize</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSuggestions(false)} style={s.quickSkip}>
                <Text style={s.quickSkipText}>Skip</Text>
              </TouchableOpacity>
            </LinearGradient>

            {TEMPLATE_SUGGESTIONS.map((sg, i) => (
              <TouchableOpacity key={i} style={s.sgCard} onPress={() => loadSuggestion(sg)} activeOpacity={0.7}>
                <View style={s.sgIconBox}>
                  <MaterialCommunityIcons name={catIcon(sg.category)} size={18} color={C.g700} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sgName}>{sg.name}</Text>
                  <Text style={s.sgDesc} numberOfLines={1}>{sg.description}</Text>
                </View>
                <View style={s.sgRate}>
                  <Text style={s.sgRateText}>₹{sg.dailyRate}/day</Text>
                </View>
                <Icon name="chevron-right" size={16} color={C.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Basic Info */}
        <SectionCard icon="info" iconColor={C.indigo} iconBg={C.indigoL} title="Basic Information">
          <Text style={s.label}>Template Name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Hatchback Daily Rental"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={s.label}>Category *</Text>
          <View style={s.catGrid}>
            {SELF_DRIVE_CATEGORIES.map(cat => (
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
        <SectionCard icon="tag" iconColor={C.g700} iconBg={C.g50} title="Rate Hints">
          <Text style={s.sectionNote}>These are hints only — actual rates set while quoting</Text>
          <View style={s.rateGrid}>
            {[
              { label: 'Daily Rate (₹)',       val: dailyRate,       set: setDailyRate,       ph: '1200', numeric: true },
              { label: 'KM Limit/Day',         val: kmLimit,         set: setKmLimit,         ph: '120',  numeric: true },
              { label: 'Extra KM Rate (₹/km)', val: extraKmRate,     set: setExtraKmRate,     ph: '10',   numeric: true },
              { label: 'Security Deposit (₹)', val: securityDeposit, set: setSecurityDeposit, ph: '3000', numeric: true },
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
        <SectionCard icon="check-circle" iconColor={C.green} iconBg={C.greenL} title="Inclusions *">
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
              style={[s.addBtn, { backgroundColor: C.green }]}
              onPress={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {inclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.greenL, borderColor: C.green + '40' }]}>
              <View style={[s.listDot, { backgroundColor: C.green }]}>
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
          <Text style={s.submitBtnText}>{isSubmitting ? 'Creating...' : 'Create Template'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
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
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Quick Start
  quickBox: {
    backgroundColor: C.card, borderRadius: 18, marginBottom: 14,
    borderWidth: 1, borderColor: C.g100, overflow: 'hidden',
  },
  quickHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  quickIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  quickSub: { fontSize: 12, color: C.sub, marginTop: 2 },
  quickSkip: { paddingHorizontal: 10, paddingVertical: 6 },
  quickSkipText: { fontSize: 13, fontWeight: '600', color: C.g700 },
  sgCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  sgIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
  },
  sgName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  sgDesc: { fontSize: 12, color: C.sub },
  sgRate: {
    backgroundColor: C.g50, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: C.g100,
  },
  sgRateText: { fontSize: 11, fontWeight: '700', color: C.g700 },

  // Section
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
    padding: 10, borderRadius: 10, marginBottom: 7,
    borderWidth: 1,
  },
  listDot: {
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
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

  // Footer
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

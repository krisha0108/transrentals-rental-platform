/**
 * LuxuryCreateTemplateScreen.js - Create new luxury car service quote template
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Dimensions,
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
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

const LUXURY_CATEGORIES = [
  { id: 'luxury_sedan', name: 'Luxury Sedan',  icon: 'car-sports' },
  { id: 'luxury_suv',   name: 'Luxury SUV',    icon: 'car-sports' },
  { id: 'premium_sedan',name: 'Premium Sedan', icon: 'car-convertible' },
  { id: 'premium_suv',  name: 'Premium SUV',   icon: 'car-side' },
  { id: 'vintage',      name: 'Vintage Car',   icon: 'car-clock' },
  { id: 'sports',       name: 'Sports Car',    icon: 'car-sports' },
  { id: 'limousine',    name: 'Limousine',     icon: 'car-limousine' },
  { id: 'convertible',  name: 'Convertible',   icon: 'car-convertible' },
];

const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Luxury Sedan Wedding',
    category: 'luxury_sedan',
    description: 'Premium sedan for weddings and special occasions',
    inclusions: ['Professional chauffeur', 'Luxury sedan with full AC', 'Floral decoration', 'Complimentary water', 'Premium insurance'],
    exclusions: ['Toll charges', 'Parking fees', 'Night charges', 'Extra hours beyond package'],
    terms: ['Advance payment required', 'Cancellation policy applies', 'Chauffeur allowance included', 'Fuel costs included'],
    baseRateHint: 8000, extraKmRateHint: 25, kmLimitHint: 200, securityDepositHint: 10000,
  },
  {
    name: 'Luxury SUV Corporate',
    category: 'luxury_suv',
    description: 'Luxury SUV for corporate travel and airport transfers',
    inclusions: ['Professional chauffeur', 'Luxury SUV with AC', 'In-car WiFi', 'Bottled water & refreshments', 'GPS tracking'],
    exclusions: ['Toll & parking charges', 'Night surcharge', 'State tax/permit', 'Extra KM beyond limit'],
    terms: ['Booking subject to availability', '50% advance required', 'Extra hours: ₹800/hour', 'Extra KM: ₹25/km'],
    baseRateHint: 12000, extraKmRateHint: 25, kmLimitHint: 300, securityDepositHint: 15000,
  },
  {
    name: 'Limousine Premium',
    category: 'limousine',
    description: 'Stretch limousine for grand occasions',
    inclusions: ['Stretch limousine with chauffeur', 'Mini bar setup', 'Mood lighting', 'Premium sound system', 'Valid permits & insurance'],
    exclusions: ['Toll charges', 'Parking fees', 'Entry tax', 'Waiting charges beyond 15 min'],
    terms: ['100% advance for limousine', 'Non-refundable deposit', 'Route must be pre-approved', 'Cancellation: 48hr notice required'],
    baseRateHint: 25000, extraKmRateHint: 50, kmLimitHint: 150, securityDepositHint: 25000,
  },
];

export default function LuxuryCreateTemplateScreen({ navigation }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [baseRate, setBaseRate] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('');
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
    setBaseRate(sg.baseRateHint.toString()); setExtraKmRate(sg.extraKmRateHint.toString());
    setKmLimitPerDay(sg.kmLimitHint.toString()); setSecurityDeposit(sg.securityDepositHint.toString());
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
      await createTemplate('luxury', {
        name: name.trim(), category,
        description: description.trim() || null,
        inclusions, exclusions, termsConditions: terms,
        baseRateHint: baseRate ? parseFloat(baseRate) : null,
        extraKmRateHint: extraKmRate ? parseFloat(extraKmRate) : null,
        kmLimitHint: kmLimitPerDay ? parseInt(kmLimitPerDay) : null,
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

      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.hero}>
        <View style={[s.deco, { width: 160, height: 160, top: -50, right: -30, opacity: 0.07 }]} />
        <View style={[s.deco, { width: 70, height: 70, top: 15, right: 80, opacity: 0.05 }]} />
        <View style={s.heroRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>New Template</Text>
            <Text style={s.heroSub}>Luxury Cars — create a reusable quote template</Text>
          </View>
          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="car-sports" size={20} color={C.amber} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {showSuggestions && (
          <View style={s.quickBox}>
            <LinearGradient colors={[C.amberL, '#fff']} style={s.quickHeader}>
              <View style={s.quickIconBox}>
                <Ionicons name="flash" size={18} color={C.amber} />
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
                  <MaterialCommunityIcons name="car-sports" size={18} color={C.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sgName}>{sg.name}</Text>
                  <Text style={s.sgDesc} numberOfLines={1}>{sg.description}</Text>
                </View>
                <View style={s.sgRate}>
                  <Text style={s.sgRateText}>₹{sg.baseRateHint}/day</Text>
                </View>
                <Icon name="chevron-right" size={16} color={C.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <SectionCard icon="info" iconColor={C.indigo} iconBg={C.indigoL} title="Basic Information">
          <Text style={s.label}>Template Name *</Text>
          <TextInput
            style={s.input} placeholder="e.g., Luxury Sedan Wedding Package"
            placeholderTextColor={C.muted} value={name} onChangeText={setName}
          />
          <Text style={s.label}>Category *</Text>
          <View style={s.catGrid}>
            {LUXURY_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, category === cat.id && s.catChipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <MaterialCommunityIcons name={cat.icon} size={13} color={category === cat.id ? '#fff' : C.sub} />
                <Text style={[s.catChipText, category === cat.id && s.catChipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Description <Text style={s.optional}>(optional)</Text></Text>
          <TextInput
            style={[s.input, s.textArea]} placeholder="Brief description of this template..."
            placeholderTextColor={C.muted} value={description} onChangeText={setDescription}
            multiline numberOfLines={3}
          />
        </SectionCard>

        <SectionCard icon="tag" iconColor={C.amber} iconBg={C.amberL} title="Rate Hints">
          <Text style={s.sectionNote}>These are hints only — actual rates set while quoting</Text>
          <View style={s.rateGrid}>
            {[
              { label: 'Base Rate (₹/day)', val: baseRate, set: setBaseRate, ph: '8000' },
              { label: 'Extra KM Rate (₹/km)', val: extraKmRate, set: setExtraKmRate, ph: '25' },
              { label: 'KM Limit per Day', val: kmLimitPerDay, set: setKmLimitPerDay, ph: '200' },
              { label: 'Security Deposit (₹)', val: securityDeposit, set: setSecurityDeposit, ph: '10000' },
            ].map((f, i) => (
              <View key={i} style={s.rateField}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input} placeholder={f.ph} placeholderTextColor={C.muted}
                  value={f.val} onChangeText={f.set} keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard icon="check-circle" iconColor={C.g600} iconBg={C.g50} title="Inclusions *">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]} placeholder="Add inclusion item..."
              placeholderTextColor={C.muted} value={newInclusion} onChangeText={setNewInclusion}
              onSubmitEditing={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}
            />
            <TouchableOpacity style={[s.addBtn, { backgroundColor: C.g600 }]}
              onPress={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {inclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.g50, borderColor: C.g400 + '40' }]}>
              <View style={s.listDot}><Icon name="check" size={11} color="#fff" /></View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, inclusions, setInclusions)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {inclusions.length === 0 && <Text style={s.emptyHint}>No inclusions added yet</Text>}
        </SectionCard>

        <SectionCard icon="x-circle" iconColor={C.red} iconBg={C.redL} title="Exclusions">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]} placeholder="Add exclusion item..."
              placeholderTextColor={C.muted} value={newExclusion} onChangeText={setNewExclusion}
              onSubmitEditing={() => addItem(newExclusion, exclusions, setExclusions, setNewExclusion)}
            />
            <TouchableOpacity style={[s.addBtn, { backgroundColor: C.red }]}
              onPress={() => addItem(newExclusion, exclusions, setExclusions, setNewExclusion)}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {exclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.redL, borderColor: C.red + '30' }]}>
              <View style={[s.listDot, { backgroundColor: C.red }]}><Icon name="x" size={11} color="#fff" /></View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, exclusions, setExclusions)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {exclusions.length === 0 && <Text style={s.emptyHint}>No exclusions added yet</Text>}
        </SectionCard>

        <SectionCard icon="file-text" iconColor={C.indigo} iconBg={C.indigoL} title="Terms & Conditions">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]} placeholder="Add a term or condition..."
              placeholderTextColor={C.muted} value={newTerm} onChangeText={setNewTerm}
              onSubmitEditing={() => addItem(newTerm, terms, setTerms, setNewTerm)}
            />
            <TouchableOpacity style={[s.addBtn, { backgroundColor: C.indigo }]}
              onPress={() => addItem(newTerm, terms, setTerms, setNewTerm)}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {terms.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.indigoL, borderColor: C.indigo + '30' }]}>
              <View style={s.termNumBox}><Text style={s.termNumText}>{i + 1}</Text></View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, terms, setTerms)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {terms.length === 0 && <Text style={s.emptyHint}>No terms added yet</Text>}
        </SectionCard>

        <View style={s.section}>
          <TouchableOpacity style={s.checkRow} onPress={() => setIsDefault(!isDefault)} activeOpacity={0.7}>
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

      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSubmit} disabled={isSubmitting}
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
  hero: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroBadge: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.amber + '50' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  quickBox: { backgroundColor: C.card, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: C.amber + '40', overflow: 'hidden' },
  quickHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  quickIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.amber + '40' },
  quickTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  quickSub: { fontSize: 12, color: C.sub, marginTop: 2 },
  quickSkip: { paddingHorizontal: 10, paddingVertical: 6 },
  quickSkipText: { fontSize: 13, fontWeight: '600', color: C.amber },
  sgCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.border },
  sgIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.amberL, justifyContent: 'center', alignItems: 'center' },
  sgName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  sgDesc: { fontSize: 12, color: C.sub },
  sgRate: { backgroundColor: C.amberL, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: C.amber + '30' },
  sgRateText: { fontSize: 11, fontWeight: '700', color: C.amber },
  section: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconBox: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  sectionNote: { fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 17 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 7 },
  optional: { fontWeight: '400', color: C.muted },
  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, backgroundColor: C.bg, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  catChipActive: { backgroundColor: C.g700, borderColor: C.g700 },
  catChipText: { fontSize: 12, fontWeight: '600', color: C.sub },
  catChipTextActive: { color: '#fff' },
  rateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  rateField: { width: '50%', paddingRight: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  addInput: { flex: 1, marginBottom: 0 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, marginBottom: 7, borderWidth: 1 },
  listDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.g600, justifyContent: 'center', alignItems: 'center' },
  listItemText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },
  removeBtn: { padding: 4 },
  termNumBox: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.indigo, justifyContent: 'center', alignItems: 'center' },
  termNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  emptyHint: { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  checkboxOn: { backgroundColor: C.g700, borderColor: C.g700 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  checkSub: { fontSize: 12, color: C.muted },
  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
  submitBtn: { flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: 14, backgroundColor: C.g700, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

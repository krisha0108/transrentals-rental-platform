import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, submitQuote, getTemplates } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
};

const DEFAULT_INCLUSIONS = [
  'Professional packing team',
  'Quality packing materials',
  'Loading & unloading services',
  'Transportation in covered vehicle',
  'Unpacking at destination',
  'Basic transit insurance',
];

const DEFAULT_EXCLUSIONS = [
  'Toll & parking charges',
  'Goods above ₹50,000 need separate insurance',
  'Disassembly/reassembly of furniture',
  'Storage charges',
  'Weekend/holiday surcharge',
];

const DEFAULT_TERMS = [
  'Advance payment required as per quote',
  'Fragile items must be declared',
  'Customer must be present during packing/unpacking',
  'Transit time subject to road conditions',
  'Insurance claim within 7 days of delivery',
  'Company not liable for items not mentioned in inventory',
];

export default function PackersSendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [packingCharges, setPackingCharges] = useState('');
  const [loadingCharges, setLoadingCharges] = useState('');
  const [transportCharges, setTransportCharges] = useState('');
  const [unloadingCharges, setUnloadingCharges] = useState('');
  const [unpackingCharges, setUnpackingCharges] = useState('');
  const [packingMaterialCharges, setPackingMaterialCharges] = useState('');
  const [insuranceCharges, setInsuranceCharges] = useState('');
  const [storageCharges, setStorageCharges] = useState('');
  const [miscCharges, setMiscCharges] = useState('');
  const [advancePercent, setAdvancePercent] = useState('40');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('3');

  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editList, setEditList] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestData, templatesData] = await Promise.all([
        getQuoteRequestById('packers', requestId),
        getTemplates('packers').catch(() => ({ templates: [] })),
      ]);
      setRequest(requestData.request || requestData);
      const activeTemplates = (templatesData.templates || []).filter((t) => t.isActive !== false);
      setTemplates(activeTemplates);
      const defaultTemplate = activeTemplates.find((t) => t.isDefault);
      if (defaultTemplate) handleTemplateSelection(defaultTemplate.id);
    } catch (error) {
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setInclusions([...DEFAULT_INCLUSIONS]);
      setExclusions([...DEFAULT_EXCLUSIONS]);
      setTermsConditions([...DEFAULT_TERMS]);
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (template.inclusions && Array.isArray(template.inclusions)) setInclusions([...template.inclusions]);
      if (template.exclusions && Array.isArray(template.exclusions)) setExclusions([...template.exclusions]);
      if (template.termsConditions && Array.isArray(template.termsConditions)) setTermsConditions([...template.termsConditions]);
      if (template.baseRateHint) setTransportCharges(template.baseRateHint.toString());
    }
  };

  const openEditModal = (type) => {
    setEditType(type);
    if (type === 'inclusions') setEditList([...inclusions]);
    else if (type === 'exclusions') setEditList([...exclusions]);
    else if (type === 'terms') setEditList([...termsConditions]);
    setEditModalVisible(true);
  };

  const saveEditModal = () => {
    if (editType === 'inclusions') setInclusions([...editList]);
    else if (editType === 'exclusions') setExclusions([...editList]);
    else if (editType === 'terms') setTermsConditions([...editList]);
    setEditModalVisible(false);
    setEditList([]);
    setNewItemText('');
  };

  const addItemToList = () => {
    if (newItemText.trim() && !editList.includes(newItemText.trim())) {
      setEditList([...editList, newItemText.trim()]);
      setNewItemText('');
    }
  };

  const removeItemFromList = (item) => setEditList(editList.filter((i) => i !== item));

  const calculateTotal = () => {
    return [packingCharges, loadingCharges, transportCharges, unloadingCharges, unpackingCharges,
      packingMaterialCharges, insuranceCharges, storageCharges, miscCharges]
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  };

  const calculateAdvance = () => {
    const total = calculateTotal();
    return Math.round((total * (parseInt(advancePercent) || 40)) / 100);
  };

  const handleSubmit = async () => {
    const total = calculateTotal();
    if (total <= 0) { showError('Please enter at least one charge amount'); return; }
    try {
      setSubmitting(true);
      await submitQuote('packers', {
        requestId,
        packingCharges: parseFloat(packingCharges) || 0,
        loadingCharges: parseFloat(loadingCharges) || 0,
        transportCharges: parseFloat(transportCharges) || 0,
        unloadingCharges: parseFloat(unloadingCharges) || 0,
        unpackingCharges: parseFloat(unpackingCharges) || 0,
        materialCharges: parseFloat(packingMaterialCharges) || parseFloat(miscCharges) || 0,
        storageCharges: parseFloat(storageCharges) || 0,
        insuranceCharges: parseFloat(insuranceCharges) || 0,
        gstAmount: 0,
        teamSize: 3,
        estimatedDays: 1,
        vehicleType: '',
        vehicleCount: 1,
        fleetVehicleId: null,
        packingMaterials: null,
        inclusions, exclusions, termsConditions,
        notes: notes || null,
        validityDays: parseInt(validityDays) || 7,
      });
      showSuccess('Quote sent successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Send Quote</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={s.centeredTxt}>Loading...</Text>
        </View>
      </View>
    );
  }

  const total = calculateTotal();
  const advance = calculateAdvance();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={[C.g900, '#064E3B', C.g700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroMin}>
        <View style={s.deco1} /><View style={s.deco2} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Send Quote — Packers</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Request Summary */}
        <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIcon, { backgroundColor: C.card }]}>
              <MaterialCommunityIcons name="truck-delivery" size={16} color={C.g600} />
            </View>
            <Text style={[s.cardTitle, { color: C.g700 }]}>Request Summary</Text>
          </View>
          {request?.customerName && <View style={s.infoRow}><Text style={s.infoLabel}>Customer</Text><Text style={s.infoValue}>{request.customerName}</Text></View>}
          {request?.pickupCity && <View style={s.infoRow}><Text style={s.infoLabel}>From</Text><Text style={s.infoValue}>{request.pickupCity}</Text></View>}
          {request?.dropCity && <View style={s.infoRow}><Text style={s.infoLabel}>To</Text><Text style={s.infoValue}>{request.dropCity}</Text></View>}
          {request?.movingDate && <View style={s.infoRow}><Text style={s.infoLabel}>Moving Date</Text><Text style={s.infoValue}>{new Date(request.movingDate).toLocaleDateString('en-IN')}</Text></View>}
          {request?.propertyType && <View style={s.infoRow}><Text style={s.infoLabel}>Property</Text><Text style={s.infoValue}>{request.propertyType}</Text></View>}
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.blueL }]}>
                <Icon name="file-text" size={16} color={C.blue} />
              </View>
              <Text style={s.cardTitle}>Use Template</Text>
            </View>
            <Text style={[s.hint, { marginBottom: 12 }]}>Select a template to auto-fill pricing, inclusions, and terms</Text>
            <CustomDropdown
              label="Select Template (Optional)"
              value={selectedTemplateId}
              items={[
                { label: '-- No Template --', value: '' },
                ...templates.map((t) => ({ label: `${t.name}${t.isDefault ? ' (Default)' : ''}`, value: t.id })),
              ]}
              onValueChange={handleTemplateSelection}
              placeholder="-- No Template --"
            />
            {selectedTemplateId && (
              <View style={s.templateApplied}>
                <Icon name="check-circle" size={15} color={C.g600} />
                <Text style={s.templateAppliedTxt}>Template applied — inclusions, exclusions & terms loaded</Text>
              </View>
            )}
          </View>
        )}

        {/* Price Breakdown */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
              <Ionicons name="receipt-outline" size={16} color={C.g600} />
            </View>
            <Text style={s.cardTitle}>Price Breakdown</Text>
          </View>

          {[
            { label: 'Packing Charges (₹)', state: packingCharges, setter: setPackingCharges, ph: 'e.g., 3000' },
            { label: 'Loading Charges (₹)', state: loadingCharges, setter: setLoadingCharges, ph: 'e.g., 2000' },
            { label: 'Transport Charges (₹)', state: transportCharges, setter: setTransportCharges, ph: 'e.g., 8000' },
            { label: 'Unloading Charges (₹)', state: unloadingCharges, setter: setUnloadingCharges, ph: 'e.g., 2000' },
            { label: 'Unpacking Charges (₹)', state: unpackingCharges, setter: setUnpackingCharges, ph: 'e.g., 1500' },
            { label: 'Packing Material Charges (₹)', state: packingMaterialCharges, setter: setPackingMaterialCharges, ph: 'e.g., 2500' },
            { label: 'Insurance Charges (₹)', state: insuranceCharges, setter: setInsuranceCharges, ph: 'e.g., 500' },
            { label: 'Storage Charges (₹)', state: storageCharges, setter: setStorageCharges, ph: 'e.g., 0' },
            { label: 'Miscellaneous Charges (₹)', state: miscCharges, setter: setMiscCharges, ph: 'e.g., 1000' },
          ].map((field) => (
            <View key={field.label}>
              <Text style={s.inputLabel}>{field.label}</Text>
              <TextInput
                style={s.input}
                value={field.state}
                onChangeText={field.setter}
                placeholder={field.ph}
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </View>
          ))}

          <CustomDropdown
            label="Advance Payment Required"
            value={advancePercent}
            items={[
              { label: '30%', value: '30' },
              { label: '40%', value: '40' },
              { label: '50%', value: '50' },
              { label: '100%', value: '100' },
            ]}
            onValueChange={setAdvancePercent}
            placeholder="Select advance %"
          />
        </View>

        {/* Quote Summary */}
        {total > 0 && (
          <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.card }]}>
                <Ionicons name="calculator-outline" size={16} color={C.g600} />
              </View>
              <Text style={[s.cardTitle, { color: C.g700 }]}>Quote Summary</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Total Amount</Text>
              <Text style={[s.infoValue, { color: C.g700, fontSize: 18 }]}>₹{total.toFixed(0)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { fontWeight: '700', color: C.text }]}>Advance ({advancePercent}%)</Text>
              <Text style={[s.infoValue, { color: C.g600 }]}>₹{advance.toFixed(0)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Balance on delivery</Text>
              <Text style={s.infoValue}>₹{(total - advance).toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* Inclusions */}
        <View style={s.card}>
          <View style={s.cardTitleRowSpaced}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check-circle" size={16} color="#16A34A" />
              </View>
              <Text style={s.cardTitle}>Inclusions ({inclusions.length})</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('inclusions')}>
              <Icon name="edit-2" size={18} color={C.g600} />
            </TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check" size={12} color="#16A34A" />
                <Text style={[s.chipTxt, { color: '#166534' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={s.card}>
          <View style={s.cardTitleRowSpaced}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.redL }]}>
                <Icon name="x-circle" size={16} color={C.red} />
              </View>
              <Text style={s.cardTitle}>Exclusions ({exclusions.length})</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('exclusions')}>
              <Icon name="edit-2" size={18} color={C.g600} />
            </TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: C.redL }]}>
                <Icon name="x" size={12} color={C.red} />
                <Text style={[s.chipTxt, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={s.card}>
          <View style={s.cardTitleRowSpaced}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.blueL }]}>
                <Icon name="file-text" size={16} color={C.blue} />
              </View>
              <Text style={s.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('terms')}>
              <Icon name="edit-2" size={18} color={C.g600} />
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={s.termRow}>
              <Text style={s.termNum}>{idx + 1}.</Text>
              <Text style={s.termTxt}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Additional Info */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIcon, { backgroundColor: C.bg }]}>
              <Icon name="info" size={16} color={C.muted} />
            </View>
            <Text style={s.cardTitle}>Additional Information</Text>
          </View>
          <Text style={s.inputLabel}>Notes for Customer</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={s.inputLabel}>Quote Valid For (Days)</Text>
          <TextInput
            style={s.input}
            value={validityDays}
            onChangeText={setValidityDays}
            placeholder="3"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Icon name="send" size={18} color="#fff" />
              <Text style={s.submitBtnTxt}>Send Quote{total > 0 ? ` (₹${total.toFixed(0)})` : ''}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300, paddingHorizontal: 20 }}>
              {editList.map((item, idx) => (
                <View key={idx} style={s.modalItem}>
                  <Text style={s.modalItemTxt}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}>
                    <Icon name="trash-2" size={18} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={s.modalAddRow}>
              <TextInput
                style={s.modalInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Add new item..."
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity style={s.modalAddBtn} onPress={addItemToList}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.modalSaveBtn} onPress={saveEditModal}>
              <Text style={s.modalSaveBtnTxt}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centeredTxt: { fontSize: 15, color: C.muted },

  heroMin: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(52,211,153,0.08)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.06)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitleRowSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },

  hint: { fontSize: 13, color: C.muted },
  templateApplied: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.g50, borderRadius: 10, padding: 12, marginTop: 12 },
  templateAppliedTxt: { fontSize: 13, color: C.g700, fontWeight: '600', flex: 1 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text },
  textArea: { height: 80 },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipTxt: { fontSize: 12, fontWeight: '600' },

  termRow: { flexDirection: 'row', marginBottom: 8 },
  termNum: { fontSize: 13, fontWeight: '700', color: C.g600, marginRight: 8, width: 18 },
  termTxt: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 20 },

  footer: {
    padding: 16, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12,
  },
  submitBtn: { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12 },
  submitBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: C.bg, borderRadius: 10, marginBottom: 8 },
  modalItemTxt: { flex: 1, fontSize: 14, color: C.text },
  modalAddRow: { flexDirection: 'row', gap: 10, margin: 20 },
  modalInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text },
  modalAddBtn: { backgroundColor: C.g600, width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn: { backgroundColor: C.g600, marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSaveBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

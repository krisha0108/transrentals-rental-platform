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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, submitQuote, getTemplates } from '../../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#FF6B35',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
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

  // Form state - Packers specific
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

  // Inclusions/Exclusions/Terms
  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editList, setEditList] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestData, templatesData] = await Promise.all([
        getQuoteRequestById('packers', requestId),
        getTemplates('packers').catch(() => ({ templates: [] })),
      ]);
      setRequest(requestData.request || requestData);

      // Set active templates
      const activeTemplates = (templatesData.templates || []).filter((t) => t.isActive !== false);
      setTemplates(activeTemplates);

      // Auto-select default template if exists
      const defaultTemplate = activeTemplates.find((t) => t.isDefault);
      if (defaultTemplate) {
        handleTemplateSelection(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
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
      if (template.inclusions && Array.isArray(template.inclusions)) {
        setInclusions([...template.inclusions]);
      }
      if (template.exclusions && Array.isArray(template.exclusions)) {
        setExclusions([...template.exclusions]);
      }
      if (template.termsConditions && Array.isArray(template.termsConditions)) {
        setTermsConditions([...template.termsConditions]);
      }
      if (template.baseRateHint) {
        setTransportCharges(template.baseRateHint.toString());
      }
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

  const removeItemFromList = (item) => {
    setEditList(editList.filter((i) => i !== item));
  };

  const calculateTotal = () => {
    const charges = [
      packingCharges,
      loadingCharges,
      transportCharges,
      unloadingCharges,
      unpackingCharges,
      packingMaterialCharges,
      insuranceCharges,
      storageCharges,
      miscCharges,
    ];
    return charges.reduce((sum, charge) => sum + (parseFloat(charge) || 0), 0);
  };

  const calculateAdvance = () => {
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 40;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    const total = calculateTotal();
    if (total <= 0) {
      Alert.alert('Error', 'Please enter at least one charge amount');
      return;
    }

    try {
      setSubmitting(true);
      // Match web app's exact field structure
      await submitQuote('packers', {
        requestId: requestId,
        packingCharges: parseFloat(packingCharges) || 0,
        loadingCharges: parseFloat(loadingCharges) || 0,
        transportCharges: parseFloat(transportCharges) || 0,
        unloadingCharges: parseFloat(unloadingCharges) || 0,
        unpackingCharges: parseFloat(unpackingCharges) || 0,
        materialCharges: parseFloat(packingMaterialCharges) || parseFloat(miscCharges) || 0,
        storageCharges: parseFloat(storageCharges) || 0,
        insuranceCharges: parseFloat(insuranceCharges) || 0,
        gstAmount: 0, // Can be added to form later if needed
        teamSize: 3, // Default team size, can be added to form later
        estimatedDays: 1, // Default days, can be added to form later
        vehicleType: '', // Can be added to form later
        vehicleCount: 1, // Default count
        fleetVehicleId: null,
        packingMaterials: null,
        inclusions,
        exclusions,
        termsConditions,
        notes: notes || null,
        validityDays: parseInt(validityDays) || 7,
      });
      Alert.alert('Success', 'Quote sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error submitting quote:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const total = calculateTotal();
  const advance = calculateAdvance();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Quote - Packers & Movers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Request Summary */}
        <View style={[styles.card, { backgroundColor: '#FFF4ED', borderColor: '#FFE4CC' }]}>
          <Text style={[styles.cardTitle, { color: '#C2410C' }]}>Request Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{request?.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{request?.pickupCity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>To:</Text>
            <Text style={styles.value}>{request?.dropCity}</Text>
          </View>
          {request?.movingDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Moving Date:</Text>
              <Text style={styles.value}>{new Date(request.movingDate).toLocaleDateString()}</Text>
            </View>
          )}
          {request?.propertyType && (
            <View style={styles.row}>
              <Text style={styles.label}>Property:</Text>
              <Text style={styles.value}>{request?.propertyType}</Text>
            </View>
          )}
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Use Template</Text>
              <Icon name="file-text" size={18} color={C.blue} />
            </View>
            <Text style={[styles.label, { marginBottom: 12 }]}>
              Select a template to auto-fill pricing, inclusions, and terms
            </Text>

            <CustomDropdown
              label="Select Template (Optional)"
              value={selectedTemplateId}
              items={[
                { label: '-- No Template --', value: '' },
                ...templates.map((template) => ({
                  label: `${template.name}${template.isDefault ? ' (Default)' : ''}`,
                  value: template.id,
                })),
              ]}
              onValueChange={handleTemplateSelection}
              placeholder="-- No Template --"
            />

            {selectedTemplateId && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: '#D1FAE5', borderRadius: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="check-circle" size={16} color="#059669" />
                  <Text style={{ fontSize: 13, color: '#059669', fontWeight: '600' }}>
                    Template applied - Inclusions, Exclusions & Terms loaded
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Pricing Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>

          <Text style={styles.inputLabel}>Packing Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={packingCharges}
            onChangeText={setPackingCharges}
            placeholder="e.g., 3000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Loading Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={loadingCharges}
            onChangeText={setLoadingCharges}
            placeholder="e.g., 2000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Transport Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={transportCharges}
            onChangeText={setTransportCharges}
            placeholder="e.g., 8000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Unloading Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={unloadingCharges}
            onChangeText={setUnloadingCharges}
            placeholder="e.g., 2000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Unpacking Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={unpackingCharges}
            onChangeText={setUnpackingCharges}
            placeholder="e.g., 1500"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Packing Material Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={packingMaterialCharges}
            onChangeText={setPackingMaterialCharges}
            placeholder="e.g., 2500"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Insurance Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={insuranceCharges}
            onChangeText={setInsuranceCharges}
            placeholder="e.g., 500"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Storage Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={storageCharges}
            onChangeText={setStorageCharges}
            placeholder="e.g., 0 (if applicable)"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Miscellaneous Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={miscCharges}
            onChangeText={setMiscCharges}
            placeholder="e.g., 1000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

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
          <View style={[styles.card, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Text style={[styles.cardTitle, { color: '#0369A1' }]}>Quote Summary</Text>
            <View style={styles.row}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>₹{total.toFixed(0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Advance ({advancePercent}%)</Text>
              <Text style={styles.totalValue}>₹{advance.toFixed(0)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Balance on delivery</Text>
              <Text style={styles.value}>₹{(total - advance).toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* Inclusions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Inclusions ({inclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('inclusions')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#D1FAE5' }]}>
                <Icon name="check-circle" size={14} color="#059669" />
                <Text style={[styles.chipText, { color: '#059669' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Exclusions ({exclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('exclusions')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="x-circle" size={14} color="#DC2626" />
                <Text style={[styles.chipText, { color: '#DC2626' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('terms')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={styles.termRow}>
              <Text style={styles.termNumber}>{idx + 1}.</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Additional Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Information</Text>

          <Text style={styles.inputLabel}>Notes for Customer</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Quote Valid For (Days)</Text>
          <TextInput
            style={styles.input}
            value={validityDays}
            onChangeText={setValidityDays}
            placeholder="3"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                Send Quote{total > 0 ? ` (₹${total.toFixed(0)})` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}>
                    <Icon name="trash-2" size={18} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalAddSection}>
              <TextInput
                style={styles.modalInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Add new item..."
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity style={styles.modalAddBtn} onPress={addItemToList}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEditModal}>
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: C.muted,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  textArea: {
    height: 80,
  },
  summaryLabel: {
    fontSize: 14,
    color: C.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.brand,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  termNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: C.brand,
    marginRight: 8,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },
  footer: {
    padding: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  submitBtn: {
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: C.bg,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalItemText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },
  modalAddSection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  modalAddBtn: {
    backgroundColor: C.brand,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtn: {
    backgroundColor: C.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

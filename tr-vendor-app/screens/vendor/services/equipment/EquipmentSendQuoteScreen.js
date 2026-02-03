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
import { getQuoteRequestById, getFleetVehicles, submitQuote, getTemplates } from '../../../api/client';

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
  'Equipment in working condition',
  'Trained operator (if required)',
  'Basic safety equipment',
  'Maintenance during rental period',
  'Delivery & pickup included',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel/diesel charges',
  'Operator accommodation & meals',
  'Damage due to misuse',
  'Breakdown beyond 2 hours',
  'Transportation beyond local area',
];

const DEFAULT_TERMS = [
  'Advance payment required as per quote',
  'Security deposit refundable after inspection',
  'Equipment must be used by trained personnel only',
  'Minimum rental: 8 hours/day',
  'Breakdown/downtime: proportionate refund',
  'Late return charges apply',
];

const EQUIPMENT_CATEGORIES = [
  { id: '1', name: 'Cranes' },
  { id: '2', name: 'Earthmoving Equipment' },
  { id: '3', name: 'Material Handling' },
  { id: '4', name: 'Concrete Equipment' },
  { id: '5', name: 'Road Construction' },
  { id: '6', name: 'Power & HVAC' },
  { id: '7', name: 'Lifting Equipment' },
  { id: '8', name: 'Other Equipment' },
];

export default function EquipmentSendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Form state
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [deliveryCharges, setDeliveryCharges] = useState('');
  const [operatorCharges, setOperatorCharges] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('2');

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
      const [requestData, fleetsData, templatesData] = await Promise.all([
        getQuoteRequestById('equipment', requestId),
        getFleetVehicles(),
        getTemplates('equipment').catch(() => ({ templates: [] })),
      ]);
      setRequest(requestData.request || requestData);

      // Filter equipment fleet - support both singular and plural
      const equipmentFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter(
        (v) => {
          const service = v.services || v.service;
          return (
            service?.slug === 'equipment-rental' ||
            service?.name?.toLowerCase().includes('equipment')
          );
        }
      );
      setFleetVehicles(equipmentFleet);

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
      // Set inclusions, exclusions, terms
      if (template.inclusions && Array.isArray(template.inclusions)) {
        setInclusions([...template.inclusions]);
      }
      if (template.exclusions && Array.isArray(template.exclusions)) {
        setExclusions([...template.exclusions]);
      }
      if (template.termsConditions && Array.isArray(template.termsConditions)) {
        setTermsConditions([...template.termsConditions]);
      }

      // Auto-fill rates from template
      if (template.dailyRateHint || template.baseRateHint) {
        setDailyRate((template.dailyRateHint || template.baseRateHint).toString());
      }
      if (template.weeklyRateHint) {
        setWeeklyRate(template.weeklyRateHint.toString());
      }
      if (template.monthlyRateHint) {
        setMonthlyRate(template.monthlyRateHint.toString());
      }
      if (template.deliveryChargesHint) {
        setDeliveryCharges(template.deliveryChargesHint.toString());
      }
      if (template.operatorChargesHint) {
        setOperatorCharges(template.operatorChargesHint.toString());
      }
      if (template.securityDepositHint) {
        setSecurityDeposit(template.securityDepositHint.toString());
      }
      if (template.advancePercentHint) {
        setAdvancePercent(template.advancePercentHint.toString());
      }
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) {
      setEquipmentName('');
      setEquipmentModel('');
      setEquipmentCategory('');
      return;
    }

    const selectedEquip = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedEquip) {
      let brandName = '';
      let modelName = '';
      let categoryName = '';
      let categoryId = '';

      // Check if vehicle has model (using ID field)
      if (selectedEquip.vehicleModelId && selectedEquip.vehicle_models) {
        modelName = selectedEquip.vehicle_models.name || '';
        // Get brand from the model's brand relation
        if (selectedEquip.vehicle_models.brands) {
          brandName = selectedEquip.vehicle_models.brands.name || '';
        }
      }

      // Check if vehicle has direct brand
      if (selectedEquip.brandId && selectedEquip.brands) {
        brandName = selectedEquip.brands.name || '';
      }

      // Check if vehicle has category
      if (selectedEquip.vehicleCategoryId && selectedEquip.chauffeur_vehicle_categories) {
        categoryName = selectedEquip.chauffeur_vehicle_categories.name || '';
        categoryId = selectedEquip.chauffeur_vehicle_categories.id || '';
      }

      // Combine brand and model for equipment name
      const fullName = brandName && modelName ? `${brandName} ${modelName}` : brandName || modelName || categoryName || '';

      setEquipmentName(fullName);
      // Use registration number for model/make field
      setEquipmentModel(selectedEquip.registrationNumber || '');
      setEquipmentCategory(categoryId || selectedEquip.vehicleCategoryId || '');
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
    const rate = parseFloat(dailyRate) || 0;
    const days = request?.rentalDays || request?.durationDays || request?.totalDays || 1;
    const opCharges = parseFloat(operatorCharges) || 0;
    const delCharges = parseFloat(deliveryCharges) || 0;
    return (rate + opCharges) * days + delCharges;
  };

  const calculateAdvance = () => {
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    if (!equipmentName) {
      Alert.alert('Error', 'Please enter equipment name or select from fleet');
      return;
    }
    if (!equipmentCategory) {
      Alert.alert('Error', 'Please select equipment category');
      return;
    }
    if (!dailyRate || parseFloat(dailyRate) <= 0) {
      Alert.alert('Error', 'Please enter daily rate');
      return;
    }

    try {
      setSubmitting(true);
      // Match web app's exact field structure
      await submitQuote('equipment', {
        requestId: requestId,
        templateId: selectedTemplateId || null,
        fleetId: selectedFleetId || null,
        equipmentCategory: equipmentCategory,
        equipmentName: equipmentName,
        equipmentModel: equipmentModel || null,
        quantity: request?.quantity || 1,
        dailyRate: parseFloat(dailyRate) || 0,
        weeklyRate: parseFloat(weeklyRate) || 0,
        monthlyRate: parseFloat(monthlyRate) || 0,
        deliveryCharges: parseFloat(deliveryCharges) || 0,
        operatorCharges: parseFloat(operatorCharges) || 0,
        securityDeposit: parseFloat(securityDeposit) || 0,
        rentalStartDate: request?.startDate || null,
        rentalEndDate: request?.endDate || null,
        rentalDays: request?.durationDays || request?.rentalDays || 1,
        totalAmount: calculateTotal(),
        advanceAmount: calculateAdvance(),
        advancePercent: parseInt(advancePercent) || 30,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
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
        <Text style={styles.headerTitle}>Send Quote - Equipment</Text>
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
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{request?.locationName || request?.city}</Text>
          </View>
          {request?.equipmentType && (
            <View style={styles.row}>
              <Text style={styles.label}>Equipment Type:</Text>
              <Text style={styles.value}>{request?.equipmentType}</Text>
            </View>
          )}
          {request?.durationDays && (
            <View style={styles.row}>
              <Text style={styles.label}>Duration:</Text>
              <Text style={styles.value}>{request?.durationDays} days</Text>
            </View>
          )}
          {request?.durationHours && (
            <View style={styles.row}>
              <Text style={styles.label}>Hours:</Text>
              <Text style={styles.value}>{request?.durationHours} hours</Text>
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
                    Template applied - Rates, Inclusions, Exclusions & Terms loaded
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Equipment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Equipment Details</Text>

          <CustomDropdown
            label="Select from Fleet (Optional)"
            value={selectedFleetId}
            items={[
              { label: '-- Manual Entry --', value: '' },
              ...fleetVehicles.map((equipment) => {
                const name = equipment.vehicleModel?.name || equipment.vehicleCategory?.name || 'Equipment';
                const regNo = equipment.registrationNumber || '';
                return {
                  label: regNo ? `${name} (${regNo})` : name,
                  value: equipment.id,
                };
              }),
            ]}
            onValueChange={handleFleetSelection}
            placeholder="-- Manual Entry --"
            searchable={fleetVehicles.length > 5}
          />

          <Text style={styles.inputLabel}>Equipment Name *</Text>
          <TextInput
            style={styles.input}
            value={equipmentName}
            onChangeText={setEquipmentName}
            placeholder="e.g., Mobile Crane 20 Ton"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
          />

          <Text style={styles.inputLabel}>Equipment Registration Number</Text>
          <TextInput
            style={styles.input}
            value={equipmentModel}
            onChangeText={setEquipmentModel}
            placeholder="e.g., GJ87YH6534"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
            autoCapitalize="characters"
          />

          <CustomDropdown
            label="Equipment Category *"
            value={equipmentCategory}
            items={EQUIPMENT_CATEGORIES.map((cat) => ({ label: cat.name, value: cat.id }))}
            onValueChange={setEquipmentCategory}
            placeholder="Select category"
          />
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing Details</Text>

          <Text style={styles.inputLabel}>Daily Rate (₹/day) *</Text>
          <TextInput
            style={styles.input}
            value={dailyRate}
            onChangeText={setDailyRate}
            placeholder="e.g., 5000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Weekly Rate (₹/week)</Text>
          <TextInput
            style={styles.input}
            value={weeklyRate}
            onChangeText={setWeeklyRate}
            placeholder="e.g., 30000 (optional)"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Monthly Rate (₹/month)</Text>
          <TextInput
            style={styles.input}
            value={monthlyRate}
            onChangeText={setMonthlyRate}
            placeholder="e.g., 100000 (optional)"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Delivery Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={deliveryCharges}
            onChangeText={setDeliveryCharges}
            placeholder="e.g., 2000 (if delivery required)"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Operator Charges (₹/day)</Text>
          <TextInput
            style={styles.input}
            value={operatorCharges}
            onChangeText={setOperatorCharges}
            placeholder="e.g., 1500 (if operator required)"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
          <TextInput
            style={styles.input}
            value={securityDeposit}
            onChangeText={setSecurityDeposit}
            placeholder="e.g., 20000"
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
              <Text style={styles.summaryLabel}>Total</Text>
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
            {securityDeposit && parseFloat(securityDeposit) > 0 && (
              <View style={[styles.row, { marginTop: 8 }]}>
                <Text style={styles.label}>Security Deposit (Refundable)</Text>
                <Text style={styles.value}>₹{parseFloat(securityDeposit).toFixed(0)}</Text>
              </View>
            )}
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
            placeholder="2"
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

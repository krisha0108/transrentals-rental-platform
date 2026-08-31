import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, getFleetVehicles, submitQuote, getTemplates } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';
import AppEvents, { EVT_QUOTE_SENT } from '../../../../utils/AppEvents';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  red: T.red, redL: T.redLight,
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
  { id: '1', name: 'Cranes' }, { id: '2', name: 'Earthmoving Equipment' },
  { id: '3', name: 'Material Handling' }, { id: '4', name: 'Concrete Equipment' },
  { id: '5', name: 'Road Construction' }, { id: '6', name: 'Power & HVAC' },
  { id: '7', name: 'Lifting Equipment' }, { id: '8', name: 'Other Equipment' },
];

export default function EquipmentSendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

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

  const [advanceMode, setAdvanceMode] = useState('percent'); // 'percent' | 'manual'
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [validityMode, setValidityMode] = useState('days'); // 'days' | 'custom'
  const [customValidDate, setCustomValidDate] = useState(null);
  const [customValidTime, setCustomValidTime] = useState({ hours: 23, minutes: 59 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      const [requestData, fleetsData, templatesData] = await Promise.all([
        getQuoteRequestById('equipment', requestId),
        getFleetVehicles(),
        getTemplates('equipment').catch(() => ({ templates: [] })),
      ]);
      setRequest(requestData.request || requestData);

      const equipmentFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter((v) => {
        const service = v.services || v.service;
        return service?.slug === 'equipment-rental' || service?.name?.toLowerCase().includes('equipment');
      });
      setFleetVehicles(equipmentFleet);

      const activeTemplates = (templatesData.templates || []).filter((t) => t.isActive !== false);
      setTemplates(activeTemplates);

      const defaultTemplate = activeTemplates.find((t) => t.isDefault);
      if (defaultTemplate) handleTemplateSelection(defaultTemplate.id, activeTemplates);
    } catch (error) {
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelection = (templateId, templatesList) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setInclusions([...DEFAULT_INCLUSIONS]);
      setExclusions([...DEFAULT_EXCLUSIONS]);
      setTermsConditions([...DEFAULT_TERMS]);
      return;
    }
    const list = templatesList || templates;
    const template = list.find((t) => t.id === templateId);
    if (template) {
      if (Array.isArray(template.inclusions)) setInclusions([...template.inclusions]);
      if (Array.isArray(template.exclusions)) setExclusions([...template.exclusions]);
      if (Array.isArray(template.termsConditions)) setTermsConditions([...template.termsConditions]);
      if (template.dailyRateHint || template.baseRateHint) setDailyRate((template.dailyRateHint || template.baseRateHint).toString());
      if (template.weeklyRateHint) setWeeklyRate(template.weeklyRateHint.toString());
      if (template.monthlyRateHint) setMonthlyRate(template.monthlyRateHint.toString());
      if (template.deliveryChargesHint) setDeliveryCharges(template.deliveryChargesHint.toString());
      if (template.operatorChargesHint) setOperatorCharges(template.operatorChargesHint.toString());
      if (template.securityDepositHint) setSecurityDeposit(template.securityDepositHint.toString());
      if (template.advancePercentHint) setAdvancePercent(template.advancePercentHint.toString());
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) { setEquipmentName(''); setEquipmentModel(''); setEquipmentCategory(''); return; }
    const selectedEquip = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedEquip) {
      let brandName = '';
      let modelName = '';
      let categoryId = '';
      if (selectedEquip.vehicleModelId && selectedEquip.vehicle_models) {
        modelName = selectedEquip.vehicle_models.name || '';
        if (selectedEquip.vehicle_models.brands) brandName = selectedEquip.vehicle_models.brands.name || '';
      }
      if (selectedEquip.brandId && selectedEquip.brands) brandName = selectedEquip.brands.name || '';
      if (selectedEquip.vehicleCategoryId && selectedEquip.chauffeur_vehicle_categories) {
        categoryId = selectedEquip.chauffeur_vehicle_categories.id || '';
      }
      const fullName = brandName && modelName ? `${brandName} ${modelName}` : brandName || modelName || '';
      setEquipmentName(fullName);
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

  const removeItemFromList = (item) => setEditList(editList.filter((i) => i !== item));

  const calculateTotal = () => {
    const rate = parseFloat(dailyRate) || 0;
    const days = request?.rentalDays || request?.durationDays || request?.totalDays || 1;
    const opCharges = parseFloat(operatorCharges) || 0;
    const delCharges = parseFloat(deliveryCharges) || 0;
    return (rate + opCharges) * days + delCharges;
  };

  const calculateAdvance = () => {
    if (advanceMode === 'manual') return parseFloat(customAdvanceAmount) || 0;
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    if (!equipmentName) { showError('Please enter equipment name or select from fleet'); return; }
    if (!equipmentCategory) { showError('Please select equipment category'); return; }
    if (!dailyRate || parseFloat(dailyRate) <= 0) { showError('Please enter daily rate'); return; }

    try {
      setSubmitting(true);
      await submitQuote('equipment', {
        requestId,
        templateId: selectedTemplateId || null,
        fleetId: selectedFleetId || null,
        equipmentCategory,
        equipmentName,
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
        advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 30) : 0,
        customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
        validityDays: validityMode === 'days' ? (parseInt(validityDays) || 3) : undefined,
        customValidTill: validityMode === 'custom' && customValidDate ? (() => { const d = new Date(customValidDate); d.setHours(customValidTime.hours, customValidTime.minutes, 0, 0); return d.toISOString(); })() : undefined,
      });
      AppEvents.emit(EVT_QUOTE_SENT, { serviceType: 'equipment' });
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
        <LinearGradient colors={G.hero} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={s.heroTitle}>Send Quote</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
      </View>
    );
  }

  const total = calculateTotal();
  const advance = calculateAdvance();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={s.heroTitle}>Send Quote</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={s.heroSub}>Equipment Rental</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Request Summary */}
        <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
          <Text style={[s.cardTitle, { color: C.g800 }]}>Request Summary</Text>
          {request?.customerName && <SummaryRow label="Customer" value={request.customerName} />}
          {(request?.locationName || request?.city || request?.deliveryCity) && (
            <SummaryRow label="Location" value={request?.locationName || request?.city || request?.deliveryCity} />
          )}
          {request?.equipmentType && <SummaryRow label="Equipment Type" value={request.equipmentType} />}
          {(request?.durationDays || request?.rentalDays) && (
            <SummaryRow label="Duration" value={`${request.durationDays || request.rentalDays} days`} />
          )}
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Use Template</Text>
              <Icon name="file-text" size={16} color={C.blue} />
            </View>
            <CustomDropdown
              label="Select Template (Optional)"
              value={selectedTemplateId}
              items={[
                { label: '-- No Template --', value: '' },
                ...templates.map((t) => ({ label: `${t.name}${t.isDefault ? ' (Default)' : ''}`, value: t.id })),
              ]}
              onValueChange={(val) => handleTemplateSelection(val)}
              placeholder="-- No Template --"
            />
            {selectedTemplateId && (
              <View style={s.templateApplied}>
                <Icon name="check-circle" size={14} color={C.g600} />
                <Text style={s.templateAppliedTxt}>Template applied — Rates, Inclusions & Terms loaded</Text>
              </View>
            )}
          </View>
        )}

        {/* Equipment Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Equipment Details</Text>
          <CustomDropdown
            label="Select from Fleet (Optional)"
            value={selectedFleetId}
            items={[
              { label: '-- Manual Entry --', value: '' },
              ...fleetVehicles.map((eq) => {
                const name = eq.vehicleModel?.name || eq.vehicleCategory?.name || 'Equipment';
                const reg = eq.registrationNumber || '';
                return { label: reg ? `${name} (${reg})` : name, value: eq.id };
              }),
            ]}
            onValueChange={handleFleetSelection}
            placeholder="-- Manual Entry --"
            searchable={fleetVehicles.length > 5}
          />

          <Text style={s.inputLabel}>Equipment Name *</Text>
          <TextInput style={s.input} value={equipmentName} onChangeText={setEquipmentName} placeholder="e.g., Mobile Crane 20 Ton" placeholderTextColor={C.muted} editable={!selectedFleetId} />

          <Text style={s.inputLabel}>Registration Number</Text>
          <TextInput style={s.input} value={equipmentModel} onChangeText={setEquipmentModel} placeholder="e.g., GJ87YH6534" placeholderTextColor={C.muted} editable={!selectedFleetId} autoCapitalize="characters" />

          <CustomDropdown
            label="Equipment Category *"
            value={equipmentCategory}
            items={EQUIPMENT_CATEGORIES.map((cat) => ({ label: cat.name, value: cat.id }))}
            onValueChange={setEquipmentCategory}
            placeholder="Select category"
          />
        </View>

        {/* Pricing */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Pricing Details</Text>

          <Text style={s.inputLabel}>Daily Rate (₹/day) *</Text>
          <TextInput style={s.input} value={dailyRate} onChangeText={setDailyRate} placeholder="e.g., 5000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Weekly Rate (₹/week)</Text>
          <TextInput style={s.input} value={weeklyRate} onChangeText={setWeeklyRate} placeholder="e.g., 30000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Monthly Rate (₹/month)</Text>
          <TextInput style={s.input} value={monthlyRate} onChangeText={setMonthlyRate} placeholder="e.g., 100000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Delivery Charges (₹)</Text>
          <TextInput style={s.input} value={deliveryCharges} onChangeText={setDeliveryCharges} placeholder="e.g., 2000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Operator Charges (₹/day)</Text>
          <TextInput style={s.input} value={operatorCharges} onChangeText={setOperatorCharges} placeholder="e.g., 1500" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Security Deposit (₹)</Text>
          <TextInput style={s.input} value={securityDeposit} onChangeText={setSecurityDeposit} placeholder="e.g., 20000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Advance Payment Required</Text>
          <View style={s.modeToggleRow}>
            <TouchableOpacity
              style={[s.modeToggleBtn, advanceMode === 'percent' && s.modeToggleBtnActive]}
              onPress={() => setAdvanceMode('percent')}
            >
              <Text style={[s.modeToggleBtnText, advanceMode === 'percent' && s.modeToggleBtnTextActive]}>% Percent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeToggleBtn, advanceMode === 'manual' && s.modeToggleBtnActive]}
              onPress={() => setAdvanceMode('manual')}
            >
              <Text style={[s.modeToggleBtnText, advanceMode === 'manual' && s.modeToggleBtnTextActive]}>₹ Manual</Text>
            </TouchableOpacity>
          </View>
          {advanceMode === 'percent' ? (
            <CustomDropdown
              label=""
              value={advancePercent}
              items={[
                { label: '20%', value: '20' },
                { label: '25%', value: '25' },
                { label: '30%', value: '30' },
                { label: '40%', value: '40' },
                { label: '50%', value: '50' },
                { label: '100%', value: '100' },
              ]}
              onValueChange={setAdvancePercent}
              placeholder="Select advance %"
            />
          ) : (
            <TextInput
              style={s.input}
              value={customAdvanceAmount}
              onChangeText={setCustomAdvanceAmount}
              placeholder="Enter advance amount (₹)"
              keyboardType="decimal-pad"
              placeholderTextColor={C.muted}
            />
          )}
        </View>

        {/* Quote Summary */}
        {total > 0 && (
          <View style={[s.card, { backgroundColor: C.blueL, borderColor: '#BAE6FD' }]}>
            <Text style={[s.cardTitle, { color: C.blue }]}>Quote Summary</Text>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Total Amount</Text><Text style={s.summaryValue}>₹{total.toFixed(0)}</Text></View>
            <View style={s.divider} />
            <View style={s.summaryRow}><Text style={[s.summaryLabel, { fontWeight: '700', color: C.text }]}>Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Fixed)'}</Text><Text style={[s.summaryValue, { fontSize: 18, color: C.blue }]}>₹{advance.toFixed(0)}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Balance on delivery</Text><Text style={s.summaryValue}>₹{(total - advance).toFixed(0)}</Text></View>
            {parseFloat(securityDeposit) > 0 && (
              <View style={s.summaryRow}><Text style={s.summaryLabel}>Security Deposit (Refundable)</Text><Text style={s.summaryValue}>₹{parseFloat(securityDeposit).toFixed(0)}</Text></View>
            )}
          </View>
        )}

        {/* Inclusions */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Inclusions ({inclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('inclusions')}><Icon name="edit-2" size={16} color={C.g600} /></TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: C.g50 }]}>
                <Icon name="check-circle" size={12} color={C.g600} />
                <Text style={[s.chipText, { color: C.g700 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Exclusions ({exclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('exclusions')}><Icon name="edit-2" size={16} color={C.g600} /></TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: C.redL }]}>
                <Icon name="x-circle" size={12} color={C.red} />
                <Text style={[s.chipText, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('terms')}><Icon name="edit-2" size={16} color={C.g600} /></TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={s.termRow}>
              <Text style={s.termNum}>{idx + 1}.</Text>
              <Text style={s.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Additional */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Additional Information</Text>
          <Text style={s.inputLabel}>Notes for Customer</Text>
          <TextInput style={[s.input, s.textArea]} value={notes} onChangeText={setNotes} placeholder="Any special notes..." placeholderTextColor={C.muted} multiline numberOfLines={3} textAlignVertical="top" />
          <Text style={s.inputLabel}>Quote Valid For <Text style={{ color: C.red }}>*</Text></Text>
          <View style={s.modeToggleRow}>
            <TouchableOpacity
              style={[s.modeToggleBtn, validityMode === 'days' && s.modeToggleBtnActive]}
              onPress={() => setValidityMode('days')}
            >
              <Text style={[s.modeToggleBtnText, validityMode === 'days' && s.modeToggleBtnTextActive]}>Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeToggleBtn, validityMode === 'custom' && s.modeToggleBtnActive]}
              onPress={() => setValidityMode('custom')}
            >
              <Text style={[s.modeToggleBtnText, validityMode === 'custom' && s.modeToggleBtnTextActive]}>Custom Date</Text>
            </TouchableOpacity>
          </View>
          {validityMode === 'days' ? (
            <CustomDropdown
              label=""
              value={validityDays}
              items={[
                { label: '1 day', value: '1' },
                { label: '2 days', value: '2' },
                { label: '3 days', value: '3' },
                { label: '5 days', value: '5' },
                { label: '7 days', value: '7' },
              ]}
              onValueChange={(v) => setValidityDays(v)}
              placeholder="Select validity"
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[s.datePicker, { flex: 1 }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar" size={16} color={C.sub} />
                <Text style={[s.datePickerText, !customValidDate && { color: C.muted }]}>
                  {customValidDate
                    ? customValidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.datePicker, { flex: 0.7 }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="clock" size={16} color={C.sub} />
                <Text style={s.datePickerText}>
                  {String(customValidTime.hours).padStart(2, '0')}:{String(customValidTime.minutes).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
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

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => { setCustomValidDate(date); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={(date) => { setCustomValidTime({ hours: date.getHours(), minutes: date.getMinutes() }); setShowTimePicker(false); }}
        onCancel={() => setShowTimePicker(false)}
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}><Icon name="x" size={22} color={C.text} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {editList.map((item, idx) => (
                <View key={idx} style={s.modalItem}>
                  <Text style={s.modalItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}><Icon name="trash-2" size={16} color={C.red} /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={s.modalAddRow}>
              <TextInput style={s.modalInput} value={newItemText} onChangeText={setNewItemText} placeholder="Add new item..." placeholderTextColor={C.muted} />
              <TouchableOpacity style={s.modalAddBtn} onPress={addItemToList}><Icon name="plus" size={18} color="#fff" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={s.modalSaveBtn} onPress={saveEditModal}>
              <Text style={s.modalSaveTxt}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text style={{ fontSize: 13, color: C.sub }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero: {
    paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden',
    borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20),
  },
  heroMin: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 20 },

  card: { backgroundColor: C.card, borderRadius: rs(16), padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, ...cardShadow },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },

  templateApplied: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 10, backgroundColor: C.g50, borderRadius: 8 },
  templateAppliedTxt: { fontSize: 12, color: C.g700, fontWeight: '600', flex: 1 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text },
  textArea: { height: 80 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: C.sub },
  summaryValue: { fontSize: 14, fontWeight: '700', color: C.text },
  divider: { height: 1, backgroundColor: '#BAE6FD', marginVertical: 8 },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  chipText: { fontSize: 11, fontWeight: '600' },

  termRow: { flexDirection: 'row', marginBottom: 8 },
  termNum: { fontSize: 13, fontWeight: '700', color: C.g600, marginRight: 6, width: 18 },
  termText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },

  footer: { padding: 16, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, ...cardShadow },
  submitBtn: { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: rs(12) },
  submitBtnTxt: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20), padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: C.bg, borderRadius: 8, marginBottom: 8 },
  modalItemText: { flex: 1, fontSize: 14, color: C.text },
  modalAddRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  modalInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, fontSize: 14, color: C.text },
  modalAddBtn: { backgroundColor: C.g600, width: 46, height: 46, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn: { backgroundColor: C.g600, paddingVertical: 14, borderRadius: rs(12), alignItems: 'center' },
  modalSaveTxt: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },

  modeToggleRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  modeToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: C.card },
  modeToggleBtnActive: { backgroundColor: C.g600 },
  modeToggleBtnText: { fontSize: 13, fontWeight: '600', color: C.sub },
  modeToggleBtnTextActive: { color: '#fff' },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.card, marginBottom: 12 },
  datePickerText: { flex: 1, fontSize: 14, color: C.text },
});

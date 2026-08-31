import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../../../../components/CustomDropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
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
  purple: T.purple, purpleL: T.purpleLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  orange: T.orange, orangeL: T.orangeL,
};

const DEFAULT_INCLUSIONS = [
  'Professional driver with experience',
  'Fully air-conditioned bus',
  'Valid commercial insurance',
  'Basic maintenance during rental',
  'Driver accommodation & meals included',
  'Toll tax included (as per route)',
];

const DEFAULT_EXCLUSIONS = [
  'Parking charges',
  'State tax/permit',
  'Entry tickets/sightseeing charges',
  'Extra hours beyond package',
  'Night halt charges for driver',
];

const DEFAULT_TERMS = [
  'Advance payment required as per quote',
  'Cancellation charges apply as per policy',
  'Driver duty: 10 hours/day or 250 km/day',
  'Extra hours: ₹300-500/hour',
  'Extra KM charges as quoted',
  'Passenger count must not exceed seating capacity',
];

export default function BusSendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request,    setRequest]    = useState(null);
  const [fleetVehicles, setFleetVehicles]     = useState([]);
  const [templates,     setTemplates]         = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName,     setVehicleName]     = useState('');
  const [vehicleNumber,   setVehicleNumber]   = useState('');
  const [baseRate,        setBaseRate]        = useState('');
  const [driverAllowance, setDriverAllowance] = useState('');
  const [tollCharges,     setTollCharges]     = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [advancePercent,  setAdvancePercent]  = useState('40');
  const [notes,           setNotes]           = useState('');
  const [validityDays,    setValidityDays]    = useState('2');

  const [advanceMode, setAdvanceMode] = useState('percent'); // 'percent' | 'manual'
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [validityMode, setValidityMode] = useState('days'); // 'days' | 'custom'
  const [customValidDate, setCustomValidDate] = useState(null);
  const [customValidTime, setCustomValidTime] = useState({ hours: 23, minutes: 59 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [inclusions,        setInclusions]        = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions,        setExclusions]        = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions,   setTermsConditions]   = useState([...DEFAULT_TERMS]);
  const [editModalVisible,  setEditModalVisible]  = useState(false);
  const [editType,          setEditType]          = useState(null);
  const [editList,          setEditList]          = useState([]);
  const [newItemText,       setNewItemText]       = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestData, fleetsData, templatesData] = await Promise.all([
        getQuoteRequestById('bus', requestId),
        getFleetVehicles(),
        getTemplates('bus').catch(() => ({ templates: [] })),
      ]);
      setRequest(requestData.request || requestData);

      const busFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter(
        (v) => v.services?.slug === 'bus-rental' || v.services?.name?.toLowerCase().includes('bus')
      );
      setFleetVehicles(busFleet);

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
      if (template.inclusions?.length)      setInclusions([...template.inclusions]);
      if (template.exclusions?.length)      setExclusions([...template.exclusions]);
      if (template.termsConditions?.length) setTermsConditions([...template.termsConditions]);
      if (template.baseRateHint)            setBaseRate(template.baseRateHint.toString());
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) { setVehicleName(''); setVehicleNumber(''); return; }
    const selectedVehicle = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedVehicle) {
      let displayName = '';
      if (selectedVehicle.vehicle_models) {
        const brandName = selectedVehicle.vehicle_models.brands?.name || '';
        displayName = brandName
          ? `${brandName} ${selectedVehicle.vehicle_models.name}`
          : selectedVehicle.vehicle_models.name;
      } else if (selectedVehicle.brands && selectedVehicle.chauffeur_vehicle_categories) {
        displayName = `${selectedVehicle.brands.name} ${selectedVehicle.chauffeur_vehicle_categories.name}`;
      } else if (selectedVehicle.chauffeur_vehicle_categories) {
        displayName = selectedVehicle.chauffeur_vehicle_categories.name;
      }
      setVehicleName(displayName);
      setVehicleNumber(selectedVehicle.registrationNumber || '');
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
    return (parseFloat(baseRate) || 0)
      + (parseFloat(driverAllowance) || 0)
      + (parseFloat(tollCharges) || 0)
      + (parseFloat(additionalCharges) || 0);
  };

  const calculateAdvance = () => {
    if (advanceMode === 'manual') return parseFloat(customAdvanceAmount) || 0;
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 40;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    if (!vehicleName) { showError('Please enter vehicle name/model or select from fleet'); return; }
    if (!baseRate || parseFloat(baseRate) <= 0) { showError('Please enter valid base rate'); return; }
    try {
      setSubmitting(true);
      await submitQuote('bus', {
        requestId:        requestId,
        templateId:       selectedTemplateId || null,
        fleetId:          selectedFleetId || null,
        vehicleCategory:  request?.vehicleCategory || null,
        vehicleName:      vehicleName,
        vehicleNumber:    vehicleNumber || null,
        seats:            request?.passengerCount || 17,
        baseAmount:       parseFloat(baseRate) || 0,
        driverAllowance:  parseFloat(driverAllowance) || 0,
        tollEstimate:     parseFloat(tollCharges) || 0,
        parkingEstimate:  parseFloat(additionalCharges) || 0,
        advanceAmount:    calculateAdvance(),
        advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 40) : 0,
        customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage:    notes || null,
        validityDays: validityMode === 'days' ? parseInt(validityDays) : undefined,
        customValidTill: validityMode === 'custom' && customValidDate ? (() => { const d = new Date(customValidDate); d.setHours(customValidTime.hours, customValidTime.minutes, 0, 0); return d.toISOString(); })() : undefined,
      });
      AppEvents.emit(EVT_QUOTE_SENT, { serviceType: 'bus' });
      showSuccess('Quote sent successfully!', 'Success', {
        actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }],
      });
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar backgroundColor={C.g900} barStyle="light-content" />
        <LinearGradient colors={G.hero} style={styles.gradientHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWhite}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleWhite}>Send Quote</Text>
            <Text style={styles.headerSubtitleWhite}>Bus & Tempo</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={styles.loadingText}>Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = calculateTotal();
  const advance = calculateAdvance();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={C.g900} barStyle="light-content" />

      <LinearGradient colors={G.hero} style={styles.gradientHeader}>
        <AnimatedOrb style={styles.deco1} />
        <AnimatedOrb style={styles.deco2} delay={1200} dx={-10} dy={8} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWhite}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleWhite}>Send Quote</Text>
          <Text style={styles.headerSubtitleWhite}>Bus & Tempo</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >

        {/* Request Summary */}
        <View style={[styles.card, { backgroundColor: C.amberL, borderColor: '#FDE68A', marginTop: 20 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#FDE68A' }]}>
              <MaterialCommunityIcons name="bus" size={18} color={C.amber} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: C.orange }]}>Request Summary</Text>
              <Text style={[styles.cardSubtitle, { color: '#92400E' }]}>Customer's requirement</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryCellLabel}>Customer</Text>
              <Text style={styles.summaryCellValue}>{request?.customerName}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryCellLabel}>Pickup</Text>
              <Text style={styles.summaryCellValue}>{request?.pickupCity || request?.locationName || 'N/A'}</Text>
            </View>
            {request?.pickupDate ? (
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Pickup Date</Text>
                <Text style={styles.summaryCellValue}>{new Date(request.pickupDate).toLocaleDateString()}</Text>
              </View>
            ) : null}
            {request?.passengerCount ? (
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Passengers</Text>
                <Text style={styles.summaryCellValue}>{request.passengerCount}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.orangeL, borderColor: '#FED7AA' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#FED7AA' }]}>
                <Icon name="zap" size={18} color={C.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: C.orange }]}>Quick Fill with Template</Text>
                <Text style={[styles.cardSubtitle, { color: '#7C2D12' }]}>Auto-fill rates, inclusions & terms</Text>
              </View>
            </View>
            <CustomDropdown
              label=""
              value={selectedTemplateId}
              items={[
                { label: '-- Select a template (optional) --', value: '' },
                ...templates.map((template) => ({
                  label: template.name + (template.description ? ` - ${template.description}` : ''),
                  value: template.id,
                })),
              ]}
              onValueChange={handleTemplateSelection}
              placeholder="-- Select a template (optional) --"
              searchable={templates.length > 5}
            />
          </View>
        )}

        {/* Vehicle Details */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="bus" size={18} color={C.g600} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Vehicle Details</Text>
              <Text style={styles.cardSubtitle}>Select from fleet or enter manually</Text>
            </View>
          </View>

          <CustomDropdown
            label="Select from Fleet (Optional)"
            value={selectedFleetId}
            items={[
              { label: '-- Manual Entry --', value: '' },
              ...fleetVehicles.map((vehicle) => {
                let displayName = '';
                if (vehicle.vehicle_models) {
                  displayName = vehicle.vehicle_models.brands?.name
                    ? `${vehicle.vehicle_models.brands.name} ${vehicle.vehicle_models.name}`
                    : vehicle.vehicle_models.name;
                } else if (vehicle.brands && vehicle.chauffeur_vehicle_categories) {
                  displayName = `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories.name}`;
                } else if (vehicle.chauffeur_vehicle_categories) {
                  displayName = vehicle.chauffeur_vehicle_categories.name;
                }
                const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                return { label: `${displayName}${regNum}`, value: vehicle.id };
              }),
            ]}
            onValueChange={handleFleetSelection}
            placeholder="-- Manual Entry --"
            searchable={fleetVehicles.length > 5}
          />

          <Text style={styles.inputLabel}>Vehicle Name/Model <Text style={{ color: C.red }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={(text) => { setVehicleName(text); setSelectedFleetId(''); }}
            placeholder="e.g., Force Traveller 17 Seater"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={(text) => { setVehicleNumber(text.toUpperCase()); setSelectedFleetId(''); }}
            placeholder="e.g., DL 01 AB 1234"
            placeholderTextColor={C.muted}
          />
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <Ionicons name="wallet-outline" size={18} color={C.g600} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Pricing Details</Text>
              <Text style={styles.cardSubtitle}>Set your competitive rates</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Base Rate (₹) <Text style={{ color: C.red }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={baseRate}
            onChangeText={setBaseRate}
            placeholder="15000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Driver Allowance (if separate) (₹)</Text>
          <TextInput
            style={styles.input}
            value={driverAllowance}
            onChangeText={setDriverAllowance}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Toll Charges (if separate) (₹)</Text>
          <TextInput
            style={styles.input}
            value={tollCharges}
            onChangeText={setTollCharges}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Additional Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={additionalCharges}
            onChangeText={setAdditionalCharges}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Advance Payment Required</Text>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, advanceMode === 'percent' && styles.modeToggleBtnActive]}
              onPress={() => setAdvanceMode('percent')}
            >
              <Text style={[styles.modeToggleBtnText, advanceMode === 'percent' && styles.modeToggleBtnTextActive]}>% Percent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, advanceMode === 'manual' && styles.modeToggleBtnActive]}
              onPress={() => setAdvanceMode('manual')}
            >
              <Text style={[styles.modeToggleBtnText, advanceMode === 'manual' && styles.modeToggleBtnTextActive]}>₹ Manual</Text>
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
              style={styles.input}
              value={customAdvanceAmount}
              onChangeText={setCustomAdvanceAmount}
              placeholder="Enter advance amount (₹)"
              keyboardType="decimal-pad"
              placeholderTextColor={C.muted}
            />
          )}

          <Text style={styles.inputLabel}>Quote Valid For <Text style={{ color: C.red }}>*</Text></Text>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, validityMode === 'days' && styles.modeToggleBtnActive]}
              onPress={() => setValidityMode('days')}
            >
              <Text style={[styles.modeToggleBtnText, validityMode === 'days' && styles.modeToggleBtnTextActive]}>Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, validityMode === 'custom' && styles.modeToggleBtnActive]}
              onPress={() => setValidityMode('custom')}
            >
              <Text style={[styles.modeToggleBtnText, validityMode === 'custom' && styles.modeToggleBtnTextActive]}>Custom Date</Text>
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
              onValueChange={(v) => { setValidityDays(v); }}
              placeholder="Select validity"
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.datePicker, { flex: 1 }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar" size={16} color={C.sub} />
                <Text style={[styles.datePickerText, !customValidDate && { color: C.muted }]}>
                  {customValidDate
                    ? customValidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePicker, { flex: 0.7 }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="clock" size={16} color={C.sub} />
                <Text style={styles.datePickerText}>
                  {String(customValidTime.hours).padStart(2, '0')}:{String(customValidTime.minutes).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quote Summary */}
        {total > 0 && (
          <View style={[styles.card, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calculator-outline" size={18} color={C.blue} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: C.blue }]}>Quote Summary</Text>
                <Text style={[styles.cardSubtitle, { color: '#1E40AF' }]}>Calculated breakdown</Text>
              </View>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Base Rate</Text>
              <Text style={styles.summaryLineValue}>₹{parseFloat(baseRate || 0).toFixed(0)}</Text>
            </View>
            {parseFloat(driverAllowance || 0) > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Driver Allowance</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(driverAllowance).toFixed(0)}</Text>
              </View>
            )}
            {parseFloat(tollCharges || 0) > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Toll Charges</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(tollCharges).toFixed(0)}</Text>
              </View>
            )}
            {parseFloat(additionalCharges || 0) > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Additional Charges</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(additionalCharges).toFixed(0)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLineLabel, { fontWeight: '700', color: C.text }]}>
                Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Fixed)'}
              </Text>
              <Text style={[styles.summaryLineValue, { color: C.blue, fontSize: 17, fontWeight: '800' }]}>
                ₹{advance.toFixed(0)}
              </Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Balance on pickup</Text>
              <Text style={styles.summaryLineValue}>₹{(total - advance).toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* Inclusions */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <Icon name="check-circle" size={18} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Inclusions ({inclusions.length})</Text>
              <Text style={styles.cardSubtitle}>What's included in the quote</Text>
            </View>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: C.g50 }]}
              onPress={() => openEditModal('inclusions')}
            >
              <Icon name="edit-2" size={13} color={C.g700} />
              <Text style={[styles.editChipText, { color: C.g700 }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                <Icon name="check-circle" size={13} color={C.g600} />
                <Text style={[styles.chipText, { color: C.g700 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.redL }]}>
              <Icon name="x-circle" size={18} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Exclusions ({exclusions.length})</Text>
              <Text style={styles.cardSubtitle}>What's not covered</Text>
            </View>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: C.redL }]}
              onPress={() => openEditModal('exclusions')}
            >
              <Icon name="edit-2" size={13} color={C.red} />
              <Text style={[styles.editChipText, { color: C.red }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                <Icon name="x-circle" size={13} color={C.red} />
                <Text style={[styles.chipText, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.purpleL }]}>
              <Ionicons name="document-text-outline" size={18} color={C.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
              <Text style={styles.cardSubtitle}>Service policies</Text>
            </View>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: C.purpleL }]}
              onPress={() => openEditModal('terms')}
            >
              <Icon name="edit-2" size={13} color={C.purple} />
              <Text style={[styles.editChipText, { color: C.purple }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={styles.termRow}>
              <View style={[styles.termBullet, { backgroundColor: C.purpleL }]}>
                <Text style={[styles.termNumber, { color: C.purple }]}>{idx + 1}</Text>
              </View>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.bg }]}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={C.sub} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Additional Information</Text>
              <Text style={styles.cardSubtitle}>Notes & validity</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Notes for Customer</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes or conditions..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
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
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>
                Send Quote {total > 0 ? `• ₹${total.toFixed(0)}` : ''}
              </Text>
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
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {editType === 'inclusions' && <Icon name="check-circle" size={20} color={C.g600} style={{ marginRight: 8 }} />}
                {editType === 'exclusions' && <Icon name="x-circle" size={20} color={C.red} style={{ marginRight: 8 }} />}
                {editType === 'terms' && <Ionicons name="document-text-outline" size={20} color={C.purple} style={{ marginRight: 8 }} />}
                <Text style={styles.modalTitle}>
                  Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {editList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <View style={styles.modalItemIndexWrap}>
                    <Text style={styles.modalItemIndex}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => removeItemFromList(item)}>
                    <Icon name="trash-2" size={16} color={C.red} />
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
                onSubmitEditing={addItemToList}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.modalAddBtn} onPress={addItemToList}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEditModal}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  gradientHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden',
    borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20),
  },
  deco1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -30,
  },
  deco2: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)', top: 10, right: 90,
  },
  backBtnWhite: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:        { alignItems: 'center', flex: 1 },
  headerTitleWhite:    { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSubtitleWhite: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.sub },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardIconWrap:  { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:     { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  cardSubtitle:  { fontSize: 12, color: C.muted, marginTop: 1 },

  summaryGrid:      { gap: 10 },
  summaryCell:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryCellLabel: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  summaryCellValue: { fontSize: 13, fontWeight: '700', color: C.text, maxWidth: '60%', textAlign: 'right' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 7, marginTop: 12 },
  input: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: C.text,
  },
  textArea: { height: 88, textAlignVertical: 'top' },

  summaryLine:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLineLabel: { fontSize: 14, color: C.sub },
  summaryLineValue: { fontSize: 14, fontWeight: '600', color: C.text },
  summaryDivider:   { height: 1, backgroundColor: '#BFDBFE', marginVertical: 10 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  chipText:  { fontSize: 12, fontWeight: '600' },
  editChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  editChipText: { fontSize: 12, fontWeight: '700' },

  termRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  termBullet: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  termNumber: { fontSize: 11, fontWeight: '800' },
  termText:   { flex: 1, fontSize: 13, color: C.sub, lineHeight: 20 },

  footer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  submitBtn: {
    backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: rs(14),
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    paddingHorizontal: 20, paddingBottom: 32, maxHeight: '82%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle:    { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  modalBody:     { maxHeight: 280, marginBottom: 8 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: C.bg, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  modalItemIndexWrap: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center' },
  modalItemIndex:     { fontSize: 11, fontWeight: '800', color: C.sub },
  modalItemText:      { flex: 1, fontSize: 13, color: C.text },
  modalDeleteBtn:     { width: 30, height: 30, borderRadius: 8, backgroundColor: C.redL, justifyContent: 'center', alignItems: 'center' },
  modalAddSection:    { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 14 },
  modalInput: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: C.text,
  },
  modalAddBtn:     { width: 48, height: 48, borderRadius: 10, backgroundColor: C.g600, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn:    { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: rs(14) },
  modalSaveBtnText:{ fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  modeToggleRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  modeToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: C.card },
  modeToggleBtnActive: { backgroundColor: C.g600 },
  modeToggleBtnText: { fontSize: 13, fontWeight: '600', color: C.sub },
  modeToggleBtnTextActive: { color: '#fff' },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.card, marginBottom: 12 },
  datePickerText: { flex: 1, fontSize: 14, color: C.text },
});

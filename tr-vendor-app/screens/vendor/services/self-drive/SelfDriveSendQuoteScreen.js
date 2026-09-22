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
  StatusBar,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, getFleetVehicles, submitQuote, getTemplates, getTemplateById } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../../services/alertService';
import AppEvents, { EVT_QUOTE_SENT } from '../../../../utils/AppEvents';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g50: T.tintEmerald, g100: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border, text: T.ink, sub: T.text, muted: T.subText,
  green: T.emerald600, greenL: T.tintEmerald,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  blue: T.blue, blueL: T.blueLight,
  purple: T.purple, purpleL: T.purpleLight,
  orange: T.orange, orangeL: T.orangeL,
};

const DEFAULT_INCLUSIONS = [
  'Fully sanitized vehicle',
  'Valid insurance coverage',
  'Basic maintenance during rental',
  'Roadside assistance',
  '24/7 customer support',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Toll charges',
  'State tax/permit (if applicable)',
  'Traffic challans/fines',
  'Damage due to misuse',
];

const DEFAULT_TERMS = [
  'Valid driving license required (minimum 1 year old)',
  'Security deposit refundable after inspection',
  'Late return charges: ₹500/hour or ₹2000/day',
  'Vehicle must be returned in clean condition',
  'No smoking/drinking in vehicle',
];

export default function SelfDriveSendQuoteScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Form state
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('12');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('3');
  const [unlimitedKm, setUnlimitedKm] = useState(false);
  const [advanceMode, setAdvanceMode] = useState('percent'); // 'percent' | 'manual'
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [validityMode, setValidityMode] = useState('days'); // 'days' | 'custom'
  const [customValidDate, setCustomValidDate] = useState(null);
  const [customValidTime, setCustomValidTime] = useState({ hours: 23, minutes: 59 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Focus state for inputs
  const [focusedInput, setFocusedInput] = useState(null);

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
        getQuoteRequestById('self-drive', requestId),
        getFleetVehicles(),
        getTemplates('self-drive', { isActive: true }),
      ]);
      setRequest(requestData.request || requestData);

      // Filter self-drive fleet
      const selfDriveFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter(
        (v) =>
          v.services?.slug === 'self-drive-car-rental' ||
          v.services?.name?.toLowerCase().includes('self-drive') ||
          v.services?.name?.toLowerCase().includes('self drive')
      );
      console.log('[SelfDrive] Total fleet:', fleetsData.fleet?.length || 0, 'Filtered:', selfDriveFleet.length);
      setFleetVehicles(selfDriveFleet);

      // Handle templates data - ensure it's an array
      console.log('[SelfDrive Send Quote] Templates data:', templatesData);
      if (Array.isArray(templatesData)) {
        setTemplates(templatesData);
      } else if (templatesData && Array.isArray(templatesData.templates)) {
        setTemplates(templatesData.templates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTemplates([]); // Ensure templates is always an array
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) {
      setVehicleName('');
      setVehicleBrand('');
      setRegistrationNumber('');
      return;
    }

    const selectedVehicle = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedVehicle) {
      let vName = '';
      let vBrand = '';
      if (selectedVehicle.vehicle_models) {
        vName = selectedVehicle.vehicle_models.name;
        vBrand = selectedVehicle.vehicle_models.brands?.name || '';
      } else if (selectedVehicle.chauffeur_vehicle_categories) {
        vName = selectedVehicle.chauffeur_vehicle_categories.name;
      }
      if (selectedVehicle.brands) {
        vBrand = selectedVehicle.brands.name;
      }

      setVehicleName(vName);
      setVehicleBrand(vBrand);
      setRegistrationNumber(selectedVehicle.registrationNumber || '');
    }
  };

  const handleTemplateSelection = async (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    try {
      const template = await getTemplateById('self-drive', templateId);

      // Auto-fill form fields from template
      if (template.dailyRateHint) {
        // Template has daily rate hint, calculate total from it
        const days = request?.totalDays || 1;
        const estimatedTotal = template.dailyRateHint * days;
        setTotalPrice(estimatedTotal.toString());
      }
      if (template.kmLimitPerDay) setKmLimitPerDay(template.kmLimitPerDay.toString());
      if (template.extraKmRateHint) setExtraKmRate(template.extraKmRateHint.toString());
      if (template.securityDepositHint) setSecurityDeposit(template.securityDepositHint.toString());
      if (template.inclusions && template.inclusions.length > 0) setInclusions([...template.inclusions]);
      if (template.exclusions && template.exclusions.length > 0) setExclusions([...template.exclusions]);
      if (template.termsConditions && template.termsConditions.length > 0) setTermsConditions([...template.termsConditions]);

      showSuccess('Template applied successfully!');
    } catch (error) {
      console.error('Error loading template:', error);
      showError('Failed to load template details');
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

  const calculateDailyRate = () => {
    const total = parseFloat(totalPrice) || 0;
    const days = request?.totalDays || 1;
    return total / days;
  };

  const calculateAdvance = () => {
    if (advanceMode === 'manual') return parseFloat(customAdvanceAmount) || 0;
    const total = parseFloat(totalPrice) || 0;
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    if (!vehicleName) {
      showError('Please enter vehicle name or select from fleet');
      return;
    }
    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      showError('Please enter valid total price');
      return;
    }

    try {
      setSubmitting(true);
      const calculatedDailyRate = calculateDailyRate();
      await submitQuote('self-drive', {
        requestId: requestId,
        vendorFleetId: selectedFleetId || null,
        vehicleName: vehicleName,
        vehicleBrand: vehicleBrand || null,
        vehicleCategory: request?.vehicleCategory || null,
        registrationNumber: registrationNumber || null,
        dailyRate: calculatedDailyRate,
        totalPrice: parseFloat(totalPrice),
        securityDeposit: parseFloat(securityDeposit) || 0,
        kmLimitPerDay: unlimitedKm ? 0 : (parseInt(kmLimitPerDay) || null),
        unlimitedKm: unlimitedKm,
        extraKmCharge: unlimitedKm ? null : (parseFloat(extraKmRate) || null),
        advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 30) : 0,
        customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
        validityDays: validityMode === 'days' ? parseInt(validityDays) : undefined,
        customValidTill: validityMode === 'custom' && customValidDate ? (() => { const d = new Date(customValidDate); d.setHours(customValidTime.hours, customValidTime.minutes, 0, 0); return d.toISOString(); })() : undefined,
      });
      AppEvents.emit(EVT_QUOTE_SENT, { serviceType: 'self-drive' });
      showSuccess('Quote sent successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      console.error('Error submitting quote:', error);
      showError(error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left','right']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.header}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.headerIconRow}>
                <Ionicons name="send-outline" size={18} color={C.g400} style={{ marginRight: 7 }} />
                <Text style={styles.headerTitle}>Send Quote</Text>
              </View>
              <Text style={styles.headerSubtitle}>Self Drive</Text>
            </View>

            <View style={{ width: 44 }} />
          </SafeAreaView>
        </LinearGradient>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}>
          {/* Request Summary skeleton */}
          <View style={[styles.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Bone w={30} h={30} r={8} />
                <Bone w={140} h={13} r={4} style={{ marginLeft: 10 }} />
              </View>
            </View>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Bone w={26} h={26} r={8} style={{ backgroundColor: '#FFFFFF', marginRight: 10 }} />
                <Bone w={72} h={11} r={4} />
                <Bone w={100} h={11} r={4} style={{ marginLeft: 12 }} />
              </View>
            ))}
          </View>

          {/* Template card skeleton */}
          <View style={[styles.card, { backgroundColor: C.blueL, borderColor: '#93C5FD' }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Bone w={30} h={30} r={8} style={{ backgroundColor: '#DBEAFE' }} />
                <Bone w={160} h={13} r={4} style={{ marginLeft: 10 }} />
              </View>
            </View>
            <Bone w="90%" h={10} r={4} style={{ marginBottom: 6 }} />
            <Bone w="60%" h={10} r={4} style={{ marginBottom: 12 }} />
            <Bone w="100%" h={44} r={10} />
          </View>

          {/* Vehicle Details card skeleton */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Bone w={30} h={30} r={8} />
                <Bone w={140} h={13} r={4} style={{ marginLeft: 10 }} />
              </View>
            </View>
            <Bone w={150} h={10} r={4} style={{ marginBottom: 8 }} />
            <Bone w="100%" h={44} r={10} style={{ marginBottom: 16 }} />
            <Bone w={100} h={10} r={4} style={{ marginBottom: 8 }} />
            <Bone w="100%" h={44} r={10} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const total = parseFloat(totalPrice) || 0;
  const advance = calculateAdvance();
  const dailyRate = calculateDailyRate();

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Header */}
      <LinearGradient colors={G.hero} style={styles.header}>
        {/* Decorative circles */}
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerIconRow}>
              <Ionicons name="send-outline" size={18} color={C.g400} style={{ marginRight: 7 }} />
              <Text style={styles.headerTitle}>Send Quote</Text>
            </View>
            <Text style={styles.headerSubtitle}>Self Drive</Text>
          </View>

          <View style={{ width: 44 }} />
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}>

        {/* Request Summary Card */}
        <View style={[styles.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="document-text-outline" size={16} color={C.g800} />
              </View>
              <Text style={[styles.cardTitle, { color: C.g800 }]}>Request Summary</Text>
            </View>
          </View>

          <SummaryRow icon="person-outline" label="Customer" value={request?.customerName} />
          <SummaryRow icon="location-outline" label="Location" value={request?.locationName} />
          <SummaryRow icon="time-outline" label="Duration" value={`${request?.totalDays} days`} />
          <SummaryRow
            icon="calendar-outline"
            label="Dates"
            value={`${new Date(request?.pickupDate).toLocaleDateString()} - ${new Date(request?.dropDate).toLocaleDateString()}`}
            isLast
          />
        </View>

        {/* Template Selector Card */}
        {templates.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.blueL, borderColor: '#93C5FD' }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="flash-outline" size={16} color={C.g800} />
                </View>
                <Text style={[styles.cardTitle, { color: C.g800 }]}>Quick Fill with Template</Text>
              </View>
            </View>
            <Text style={[styles.templateDesc, { color: C.g700 }]}>
              Load a saved template to auto-fill rates, inclusions, exclusions &amp; terms
            </Text>
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

        {/* Vehicle Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: C.g50 }]}>
                <Ionicons name="car-outline" size={16} color={C.g700} />
              </View>
              <Text style={styles.cardTitle}>Vehicle Details</Text>
            </View>
          </View>

          <CustomDropdown
            label="Select from Fleet (Optional)"
            value={selectedFleetId}
            items={[
              { label: '-- Manual Entry --', value: '' },
              ...fleetVehicles.map((vehicle) => ({
                label: `${vehicle.vehicleModel?.name || vehicle.vehicleCategory?.name || 'Vehicle'} ${
                  vehicle.registrationNumber ? `(${vehicle.registrationNumber})` : ''
                }`,
                value: vehicle.id,
              })),
            ]}
            onValueChange={handleFleetSelection}
            placeholder="-- Manual Entry --"
            searchable={fleetVehicles.length > 5}
          />

          <View style={styles.sectionDivider} />

          <Text style={styles.inputLabel}>Vehicle Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, focusedInput === 'vehicleName' && styles.inputFocused]}
            value={vehicleName}
            onChangeText={setVehicleName}
            placeholder="e.g., Maruti Swift Dzire"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
            onFocus={() => setFocusedInput('vehicleName')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={[styles.input, focusedInput === 'vehicleBrand' && styles.inputFocused]}
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
            placeholder="e.g., Maruti Suzuki"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
            onFocus={() => setFocusedInput('vehicleBrand')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.inputLabel}>Registration Number</Text>
          <TextInput
            style={[styles.input, focusedInput === 'regNumber' && styles.inputFocused]}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="e.g., DL 01 AB 1234"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
            onFocus={() => setFocusedInput('regNumber')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        {/* Pricing Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: C.g50 }]}>
                <Ionicons name="cash-outline" size={16} color={C.g700} />
              </View>
              <Text style={styles.cardTitle}>Pricing Details</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Total Price <Text style={styles.required}>*</Text></Text>
          <View style={[styles.inputWithPrefix, focusedInput === 'totalPrice' && styles.inputFocused]}>
            <View style={styles.inputPrefix}>
              <Text style={styles.prefixText}>₹</Text>
            </View>
            <TextInput
              style={styles.inputInner}
              value={totalPrice}
              onChangeText={setTotalPrice}
              placeholder={`e.g., ${(request?.totalDays || 1) * 2500} (for ${request?.totalDays || 1} days)`}
              keyboardType="decimal-pad"
              placeholderTextColor={C.muted}
              onFocus={() => setFocusedInput('totalPrice')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
          <View style={[styles.inputWithPrefix, focusedInput === 'secDeposit' && styles.inputFocused]}>
            <View style={styles.inputPrefix}>
              <Text style={styles.prefixText}>₹</Text>
            </View>
            <TextInput
              style={styles.inputInner}
              value={securityDeposit}
              onChangeText={setSecurityDeposit}
              placeholder="e.g., 5000"
              keyboardType="decimal-pad"
              placeholderTextColor={C.muted}
              onFocus={() => setFocusedInput('secDeposit')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.sectionDivider} />

          <Text style={styles.inputLabel}>KM Limit per Day</Text>
          <View style={styles.kmRow}>
            <TextInput
              style={[styles.input, styles.kmInput, unlimitedKm && { backgroundColor: C.bg, color: C.muted }]}
              value={unlimitedKm ? '' : kmLimitPerDay}
              onChangeText={setKmLimitPerDay}
              placeholder="e.g., 200"
              keyboardType="number-pad"
              placeholderTextColor={C.muted}
              editable={!unlimitedKm}
            />
            <TouchableOpacity
              style={[styles.unlimitedBtn, unlimitedKm && { backgroundColor: C.orangeL, borderColor: C.orange }]}
              onPress={() => setUnlimitedKm(!unlimitedKm)}
            >
              <Ionicons name="flash-outline" size={14} color={unlimitedKm ? C.orange : C.muted} />
              <Text style={[styles.unlimitedBtnText, unlimitedKm && { color: C.orange }]}>Unlimited</Text>
            </TouchableOpacity>
          </View>

          {!unlimitedKm && (
            <>
              <Text style={styles.inputLabel}>Extra KM Rate (₹/km)</Text>
              <TextInput
                style={styles.input}
                value={extraKmRate}
                onChangeText={setExtraKmRate}
                placeholder="e.g., 12"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </>
          )}

          <View style={styles.sectionDivider} />

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
              onValueChange={(v) => setValidityDays(v)}
              placeholder="Select validity"
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.datePicker, { flex: 1 }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={C.sub} />
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
                <Ionicons name="time-outline" size={16} color={C.sub} />
                <Text style={styles.datePickerText}>
                  {String(customValidTime.hours).padStart(2, '0')}:{String(customValidTime.minutes).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quote Summary Card */}
        {totalPrice && parseFloat(totalPrice) > 0 && (
          <View style={[styles.card, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="calculator-outline" size={16} color={C.g800} />
                </View>
                <Text style={[styles.cardTitle, { color: C.g800 }]}>Quote Summary</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Daily Rate</Text>
              <Text style={styles.summaryValue}>₹{dailyRate.toFixed(0)}/day</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Total Price ({request?.totalDays} days)</Text>
              <Text style={styles.summaryValueBold}>₹{total.toFixed(0)}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: C.g700 }]}>Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Fixed)'}</Text>
              <Text style={[styles.summaryValue, { color: C.g700, fontWeight: '700' }]}>₹{advance.toFixed(0)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Balance on pickup</Text>
              <Text style={styles.summaryValue}>₹{(total - advance).toFixed(0)}</Text>
            </View>

            {securityDeposit && parseFloat(securityDeposit) > 0 && (
              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={styles.summaryLabel}>Security Deposit (Refundable)</Text>
                <Text style={styles.summaryValue}>₹{parseFloat(securityDeposit).toFixed(0)}</Text>
              </View>
            )}

            {!unlimitedKm && kmLimitPerDay ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>KM Limit</Text>
                <Text style={styles.summaryValue}>{kmLimitPerDay} km/day</Text>
              </View>
            ) : unlimitedKm ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>KM Limit</Text>
                <Text style={styles.summaryValue}>Unlimited</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Inclusions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: C.greenL }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={C.green} />
              </View>
              <Text style={styles.cardTitle}>Inclusions</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{inclusions.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('inclusions')}>
              <Ionicons name="pencil-outline" size={15} color={C.g700} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: C.greenL, borderColor: '#A7F3D0' }]}>
                <Ionicons name="checkmark-circle" size={13} color={C.green} />
                <Text style={[styles.chipText, { color: C.green }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: C.redL }]}>
                <Ionicons name="close-circle-outline" size={16} color={C.red} />
              </View>
              <Text style={styles.cardTitle}>Exclusions</Text>
              <View style={[styles.countBadge, { backgroundColor: C.redL }]}>
                <Text style={[styles.countBadgeText, { color: C.red }]}>{exclusions.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('exclusions')}>
              <Ionicons name="pencil-outline" size={15} color={C.g700} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                <Ionicons name="close-circle" size={13} color={C.red} />
                <Text style={[styles.chipText, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: C.g50 }]}>
                <Ionicons name="document-outline" size={16} color={C.g700} />
              </View>
              <Text style={styles.cardTitle}>Terms &amp; Conditions</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{termsConditions.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('terms')}>
              <Ionicons name="pencil-outline" size={15} color={C.g700} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={styles.termRow}>
              <View style={styles.termNumberBox}>
                <Text style={styles.termNumber}>{idx + 1}</Text>
              </View>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Additional Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: C.g50 }]}>
                <Ionicons name="information-circle-outline" size={16} color={C.g700} />
              </View>
              <Text style={styles.cardTitle}>Additional Information</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Notes for Customer</Text>
          <TextInput
            style={[styles.input, styles.textArea, focusedInput === 'notes' && styles.inputFocused]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => setFocusedInput('notes')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                Send Quote (₹{total.toFixed(0)})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

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
          behavior="padding"
          style={{ flex: 1 }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {editList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)} style={styles.modalDeleteBtn}>
                    <Ionicons name="trash-outline" size={17} color={C.red} />
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
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEditModal}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Small helper component for summary rows
function SummaryRow({ icon, label, value, isLast }) {
  return (
    <View style={[summaryRowStyles.row, isLast && { marginBottom: 0 }]}>
      <View style={summaryRowStyles.iconBox}>
        <Ionicons name={icon} size={14} color={C.g700} />
      </View>
      <Text style={summaryRowStyles.label}>{label}</Text>
      <Text style={summaryRowStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const summaryRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 14,
    color: C.sub,
    width: 72,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
    position: 'relative',
    borderBottomLeftRadius: rs(20),
    borderBottomRightRadius: rs(20),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: DISPLAY,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontWeight: '500',
  },

  // Scroll content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: rs(14),
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontFamily: DISPLAY,
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  templateDesc: {
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 18,
    marginLeft: 40,
    marginTop: -6,
  },

  // Count badge
  countBadge: {
    backgroundColor: C.g50,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.g700,
  },

  // Edit button
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g100,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.g700,
  },

  // Section divider
  sectionDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },

  // Input label
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.sub,
    marginBottom: 7,
    marginTop: 10,
  },
  required: {
    color: C.red,
  },

  // Input
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },
  inputFocused: {
    borderColor: C.g700,
    backgroundColor: '#F8FCFF',
  },
  textArea: {
    height: 85,
    paddingTop: 11,
  },

  // Input with prefix
  inputWithPrefix: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputPrefix: {
    paddingHorizontal: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: C.border,
    backgroundColor: C.g50,
    minWidth: 42,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.g700,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },

  // Two column layout
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  twoColItem: {
    flex: 1,
  },

  // Quote summary rows
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: C.sub,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: C.g900,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: C.g100,
    marginVertical: 10,
  },

  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Terms
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  termNumberBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  termNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: C.g700,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: C.sub,
    lineHeight: 19,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  submitBtn: {
    backgroundColor: C.g700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
    borderRadius: rs(12),
    ...cardShadow,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: DISPLAY,
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: T.scrim,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.card,
    borderTopLeftRadius: rs(22),
    borderTopRightRadius: rs(22),
    padding: 20,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    fontFamily: DISPLAY,
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 13,
    backgroundColor: C.bg,
    borderRadius: 10,
    marginBottom: 8,
  },
  modalItemText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    marginRight: 10,
    lineHeight: 19,
  },
  modalDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.redL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddSection: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  modalInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },
  modalAddBtn: {
    backgroundColor: C.g700,
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtn: {
    backgroundColor: C.g700,
    paddingVertical: 14,
    borderRadius: rs(12),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontFamily: DISPLAY,
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  kmInput: { flex: 1, marginBottom: 0 },
  unlimitedBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  unlimitedBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
  modeToggleRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  modeToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: C.card },
  modeToggleBtnActive: { backgroundColor: C.g600 },
  modeToggleBtnText: { fontSize: 14, fontWeight: '600', color: C.sub },
  modeToggleBtnTextActive: { color: '#fff' },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.card, marginBottom: 12 },
  datePickerText: { flex: 1, fontSize: 14, color: C.text },
});

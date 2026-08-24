import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Platform,
  KeyboardAvoidingView, Modal, FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createP2PVehicle, updateP2PVehicle, getVendorFleet, getStaffDrivers } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald, g300: T.oceanLight,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText,
  border: T.border, borderMed: '#CBD5E1',
  amber: T.amber, amberBg: T.amberLight,
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight, blueDark: '#1D4ED8',
  purple: T.purple, purpleBg: T.tintPlum,
  teal: T.ocean, tealBg: T.tintOcean,
};

const BODY_TYPES = ['Open', 'Closed', 'Container', 'Flatbed', 'Tanker'];
const CAR_CATEGORIES = ['Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury', 'Tempo Traveller'];
const GOODS_OPTIONS = ['General', 'Food', 'Chemicals', 'Electronics', 'Furniture', 'Construction'];

function fmtDate(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtTime(d) { return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

function getFleetVehicleName(v) {
  if (v.vehicle_models?.brands?.name && v.vehicle_models?.name) {
    return `${v.vehicle_models.brands.name} ${v.vehicle_models.name}`;
  }
  if (v.brands?.name && v.chauffeur_vehicle_categories?.name) {
    return `${v.brands.name} ${v.chauffeur_vehicle_categories.name}`;
  }
  if (v.brands?.name && v.vehicle_models?.name) {
    return `${v.brands.name} ${v.vehicle_models.name}`;
  }
  if (v.brands?.name) return v.brands.name;
  if (v.vehicle_models?.name) return v.vehicle_models.name;
  if (v.chauffeur_vehicle_categories?.name) return v.chauffeur_vehicle_categories.name;
  return v.name || v.vehicleName || 'Vehicle';
}

const BODY_TYPE_ICONS = {
  Open: 'truck',
  Closed: 'package-variant-closed',
  Container: 'train-car-container',
  Flatbed: 'truck-flatbed',
  Tanker: 'tanker-truck',
};

const GOODS_ICONS = {
  General: 'package-variant',
  Food: 'food-apple',
  Chemicals: 'flask',
  Electronics: 'chip',
  Furniture: 'sofa',
  Construction: 'hammer-wrench',
};

export default function PostVehicleScreen({ navigation, route }) {
  const editData = route?.params?.editData || null;
  const isEditing = !!editData;
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: [] });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: [{ label: 'OK', variant: 'primary', onPress: () => hideAlert() }] });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  const [serviceType, setServiceType] = useState('truck');
  const [vehicleSource, setVehicleSource] = useState('fleet');
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetDropdownOpen, setFleetDropdownOpen] = useState(false);
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('');

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  const [departureDate, setDepartureDate] = useState(null);
  const [departureTime, setDepartureTime] = useState(null);
  const [arrivalDate, setArrivalDate] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(null);

  const [fullLoadPrice, setFullLoadPrice] = useState('');
  const [partLoadEnabled, setPartLoadEnabled] = useState(false);
  const [partLoadPrice, setPartLoadPrice] = useState('');

  const [capacity, setCapacity] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [driverIncluded, setDriverIncluded] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [staffDrivers, setStaffDrivers] = useState([]);
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [fuelIncluded, setFuelIncluded] = useState(false);
  const [labourAvailable, setLabourAvailable] = useState(false);
  const [labourCount, setLabourCount] = useState('');
  const [goodsAccepted, setGoodsAccepted] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [fleetRes, driverRes] = await Promise.all([
          getVendorFleet({ limit: 100 }).catch(() => ({})),
          getStaffDrivers().catch(() => ({})),
        ]);
        const vehicles = fleetRes?.vehicles || fleetRes?.fleet || [];
        setFleetVehicles(Array.isArray(vehicles) ? vehicles : []);
        setStaffDrivers(driverRes?.drivers || []);
      } catch (e) {
        console.log('[PostVehicle] Fetch error:', e);
        setFleetVehicles([]);
        setStaffDrivers([]);
      } finally { setFleetLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (vehicleSource === 'fleet' && selectedFleetId) {
      const v = fleetVehicles.find(f => String(f.id) === String(selectedFleetId));
      if (v) {
        setVehicleName(getFleetVehicleName(v));
        setVehicleNumber(v.registrationNumber || '');
      }
    }
  }, [selectedFleetId, vehicleSource, fleetVehicles]);

  // Pre-populate form when editing
  useEffect(() => {
    if (!editData) return;
    setServiceType(editData.serviceType || 'truck');
    setVehicleSource('manual');
    setVehicleName(editData.vehicleName || '');
    setVehicleNumber(editData.vehicleNumber || '');
    setVehicleCategory(editData.vehicleCategory || '');
    setFromCity(editData.fromCity || '');
    setToCity(editData.toCity || '');
    if (editData.departureDate) setDepartureDate(new Date(editData.departureDate));
    if (editData.departureTime) {
      const [h, m] = editData.departureTime.split(':').map(Number);
      const t = new Date(); t.setHours(h, m, 0, 0); setDepartureTime(t);
    }
    if (editData.arrivalDate) setArrivalDate(new Date(editData.arrivalDate));
    if (editData.arrivalTime) {
      const [h, m] = editData.arrivalTime.split(':').map(Number);
      const t = new Date(); t.setHours(h, m, 0, 0); setArrivalTime(t);
    }
    setFullLoadPrice(editData.priceFullLoad ? String(editData.priceFullLoad) : '');
    setPartLoadEnabled(!!editData.acceptsPartLoad);
    setPartLoadPrice(editData.pricePartLoad ? String(editData.pricePartLoad) : '');
    setCapacity(editData.capacity || '');
    setBodyType(editData.bodyType || '');
    setDriverIncluded(editData.driverIncluded !== undefined ? editData.driverIncluded : true);
    setDriverName(editData.driverName || '');
    setDriverPhone(editData.driverPhone || '');
    setFuelIncluded(!!editData.fuelIncluded);
    setLabourAvailable(!!editData.labourAvailable);
    setLabourCount(editData.labourCount ? String(editData.labourCount) : '');
    setGoodsAccepted(Array.isArray(editData.goodsAccepted) ? editData.goodsAccepted : []);
    setNotes(editData.notes || '');
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(null);
    if (event.type === 'dismissed' || !selectedDate) return;
    if (showDatePicker === 'departure') setDepartureDate(selectedDate);
    else if (showDatePicker === 'arrival') setArrivalDate(selectedDate);
    if (Platform.OS === 'ios') setShowDatePicker(null);
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(null);
    if (event.type === 'dismissed' || !selectedTime) return;
    if (showTimePicker === 'departure') setDepartureTime(selectedTime);
    else if (showTimePicker === 'arrival') setArrivalTime(selectedTime);
    if (Platform.OS === 'ios') setShowTimePicker(null);
  };

  const toggleGoods = (g) => {
    setGoodsAccepted(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSubmit = async () => {
    if (vehicleSource === 'manual' && !vehicleName.trim()) return showAlert('warning', 'Missing Info', 'Vehicle name is required.');
    if (vehicleSource === 'fleet' && !selectedFleetId) return showAlert('warning', 'Missing Info', 'Please select a vehicle from your fleet.');
    if (!fromCity.trim()) return showAlert('warning', 'Missing Info', 'From City is required.');
    if (!toCity.trim()) return showAlert('warning', 'Missing Info', 'To City is required.');
    if (!departureDate) return showAlert('warning', 'Missing Info', 'Departure date is required.');
    if (!fullLoadPrice.trim() || isNaN(Number(fullLoadPrice)) || Number(fullLoadPrice) <= 0) return showAlert('warning', 'Invalid Price', 'Please enter a valid full load price.');

    setLoading(true);
    try {
      let departureDT = new Date(departureDate);
      if (departureTime) departureDT.setHours(departureTime.getHours(), departureTime.getMinutes(), 0, 0);

      let arrivalDT = null;
      if (arrivalDate) {
        arrivalDT = new Date(arrivalDate);
        if (arrivalTime) arrivalDT.setHours(arrivalTime.getHours(), arrivalTime.getMinutes(), 0, 0);
      }

      const data = {
        serviceType,
        vehicleName: vehicleName.trim(),
        vehicleNumber: vehicleNumber.trim() || undefined,
        vehicleCategory: vehicleCategory || undefined,
        vehicleId: vehicleSource === 'fleet' && selectedFleetId ? String(selectedFleetId) : undefined,
        fromCity: fromCity.trim(),
        toCity: toCity.trim(),
        departureDate: departureDT.toISOString(),
        departureTime: departureTime ? `${String(departureTime.getHours()).padStart(2, '0')}:${String(departureTime.getMinutes()).padStart(2, '0')}` : undefined,
        arrivalDate: arrivalDT ? arrivalDT.toISOString() : undefined,
        arrivalTime: arrivalTime ? `${String(arrivalTime.getHours()).padStart(2, '0')}:${String(arrivalTime.getMinutes()).padStart(2, '0')}` : undefined,
        priceFullLoad: Number(fullLoadPrice),
        pricePartLoad: partLoadEnabled && partLoadPrice.trim() ? Number(partLoadPrice) : undefined,
        acceptsPartLoad: partLoadEnabled,
        availableSpace: partLoadEnabled ? undefined : undefined,
        capacity: capacity.trim() || undefined,
        bodyType: serviceType === 'truck' && bodyType ? bodyType : undefined,
        driverIncluded,
        driverName: driverIncluded && driverName.trim() ? driverName.trim() : undefined,
        driverPhone: driverIncluded && driverPhone.trim() ? driverPhone.trim() : undefined,
        fuelIncluded,
        labourAvailable: serviceType === 'truck' ? labourAvailable : undefined,
        labourCount: serviceType === 'truck' && labourAvailable && labourCount.trim() ? Number(labourCount) : undefined,
        goodsAccepted: serviceType === 'truck' && goodsAccepted.length > 0 ? goodsAccepted : undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditing) {
        await updateP2PVehicle(editData.id, data);
      } else {
        await createP2PVehicle(data);
      }
      setAlert({
        visible: true, type: 'success', title: isEditing ? 'Vehicle Updated!' : 'Vehicle Posted!',
        message: isEditing ? 'Your vehicle posting has been updated.' : 'Your vehicle has been posted to the P2P marketplace.',
        actions: [{ label: 'Done', variant: 'primary', onPress: () => { hideAlert(); navigation.navigate('MyPostingsScreen', { initialTab: 'vehicles' }); } }],
      });
    } catch (err) {
      showAlert('error', 'Failed to Post', err?.response?.data?.error || err?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      {/* ── HEADER ── */}
      <LinearGradient colors={G.hero} style={s.headerGradient}>
        {/* Decorative orbs */}
        <AnimatedOrb style={s.decCircle1} />
        <AnimatedOrb style={s.decCircle2} delay={1200} dx={-10} dy={8} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerInner}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <View style={s.headerIconCircle}>
                <MCI name="truck-fast" size={24} color={C.g400} />
              </View>
              <Text style={s.headerTitle}>{isEditing ? 'Edit Vehicle' : 'Post Vehicle'}</Text>
              <Text style={s.headerSub}>{isEditing ? 'Update your vehicle posting' : 'Share your idle vehicle on P2P'}</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── STEP 1: SERVICE TYPE ── */}
          <SectionCard
            step={1}
            stepColor={[C.g700, C.g500]}
            title="Service Type"
            subtitle="What are you sharing?"
          >
            <View style={s.serviceTypeRow}>
              {/* Truck card */}
              <TouchableOpacity
                style={[s.serviceCard, serviceType === 'truck' && s.serviceCardActiveTruck]}
                onPress={() => setServiceType('truck')}
                activeOpacity={0.8}
              >
                {serviceType === 'truck' && <View style={s.serviceCheckBadge} />}
                <MCI name="truck" size={32} color={serviceType === 'truck' ? C.g700 : C.muted} />
                <Text style={[s.serviceCardLabel, serviceType === 'truck' && { color: C.g800 }]}>Truck</Text>
                <Text style={[s.serviceCardSub, serviceType === 'truck' && { color: C.g600 }]}>Freight & logistics</Text>
              </TouchableOpacity>

              {/* Car card */}
              <TouchableOpacity
                style={[s.serviceCard, serviceType === 'car' && s.serviceCardActiveCar]}
                onPress={() => setServiceType('car')}
                activeOpacity={0.8}
              >
                {serviceType === 'car' && <View style={[s.serviceCheckBadge, { backgroundColor: C.purple }]} />}
                <MCI name="car-side" size={32} color={serviceType === 'car' ? C.purple : C.muted} />
                <Text style={[s.serviceCardLabel, serviceType === 'car' && { color: '#5B21B6' }]}>Car</Text>
                <Text style={[s.serviceCardSub, serviceType === 'car' && { color: C.purple }]}>Rides & transfers</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ── STEP 2: VEHICLE SELECTION ── */}
          <SectionCard
            step={2}
            stepColor={[C.blueDark, C.blue]}
            title="Your Vehicle"
            subtitle="Select from fleet or enter manually"
          >
            {/* Source toggle tabs */}
            <View style={s.sourceToggleWrap}>
              {[{ value: 'fleet', label: 'From Fleet' }, { value: 'manual', label: 'Manual Entry' }].map(opt => {
                const active = vehicleSource === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.sourceTab, active && s.sourceTabActive]}
                    onPress={() => { setVehicleSource(opt.value); setSelectedFleetId(''); setVehicleName(''); setVehicleNumber(''); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.sourceTabText, active && s.sourceTabTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {vehicleSource === 'fleet' ? (
              <View style={{ marginTop: 16 }}>
                {fleetLoading ? (
                  <ActivityIndicator size="small" color={C.g500} style={{ marginVertical: 16 }} />
                ) : fleetVehicles.length === 0 ? (
                  <View style={s.emptyFleetBox}>
                    <MCI name="car-off" size={28} color={C.muted} />
                    <Text style={s.emptyFleetText}>No vehicles in your fleet.</Text>
                    <TouchableOpacity onPress={() => setVehicleSource('manual')}>
                      <Text style={s.emptyFleetLink}>Enter manually instead</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[s.dropdownTrigger, selectedFleetId && s.dropdownTriggerActive]}
                      onPress={() => setFleetDropdownOpen(true)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.dropdownIconBox, selectedFleetId && { backgroundColor: C.g100 }]}>
                        <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={18} color={selectedFleetId ? C.g600 : C.muted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {selectedFleetId ? (
                          <>
                            <Text style={s.dropdownVal} numberOfLines={1}>{vehicleName || 'Selected'}</Text>
                            {vehicleNumber ? <Text style={s.dropdownValSub}>{vehicleNumber}</Text> : null}
                          </>
                        ) : (
                          <Text style={s.dropdownPlaceholder}>Tap to select vehicle</Text>
                        )}
                      </View>
                      <Icon name="chevron-down" size={18} color={selectedFleetId ? C.g600 : C.muted} />
                    </TouchableOpacity>

                    {selectedFleetId && (
                      <View style={s.selectedBadge}>
                        <View style={s.selectedBadgeIconBox}>
                          <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={20} color={C.g600} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.selectedBadgeName}>{vehicleName || 'Vehicle'}</Text>
                          {vehicleNumber ? <Text style={s.selectedBadgeNum}>{vehicleNumber}</Text> : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => { setSelectedFleetId(''); setVehicleName(''); setVehicleNumber(''); }}
                          style={s.selectedBadgeClear}
                        >
                          <Icon name="x" size={14} color={C.muted} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            ) : (
              <View style={{ marginTop: 16, gap: 12 }}>
                <FieldCard
                  iconName="car-info"
                  iconColor={C.blue}
                  iconBg={C.blueBg}
                  label="Vehicle Name *"
                  placeholder="e.g. Tata Ace, Innova Crysta"
                  value={vehicleName}
                  onChangeText={setVehicleName}
                />
                <FieldCard
                  iconName="card-text"
                  iconColor={C.blue}
                  iconBg={C.blueBg}
                  label="Vehicle Number"
                  placeholder="e.g. MH-04-AB-1234"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {/* Car category chips */}
            {serviceType === 'car' && (
              <View style={{ marginTop: 16 }}>
                <Text style={s.subLabel}>Vehicle Category</Text>
                <View style={s.chipGrid}>
                  {CAR_CATEGORIES.map(cat => {
                    const active = vehicleCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[s.chipPill, active && s.chipPillActive]}
                        onPress={() => setVehicleCategory(active ? '' : cat)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.chipPillText, active && s.chipPillTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </SectionCard>

          {/* ── STEP 3: ROUTE ── */}
          <SectionCard
            step={3}
            stepColor={['#6D28D9', C.purple]}
            title="Route"
            subtitle="Where is the vehicle going?"
          >
            {/* Boarding-pass style route card */}
            <View style={s.routeCard}>
              {/* FROM */}
              <View style={s.routeHalf}>
                <View style={s.routeDotRow}>
                  <View style={[s.routeDot, { backgroundColor: C.g500 }]} />
                  <Text style={s.routeHalfLabel}>FROM CITY</Text>
                </View>
                <TextInput
                  style={s.routeInput}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={C.muted}
                  value={fromCity}
                  onChangeText={setFromCity}
                />
              </View>

              {/* Dashed divider with arrow */}
              <View style={s.routeDividerWrap}>
                <View style={s.routeDivider} />
                <View style={s.routeArrowCircle}>
                  <MCI name="arrow-down" size={14} color={C.g600} />
                </View>
              </View>

              {/* TO */}
              <View style={s.routeHalf}>
                <View style={s.routeDotRow}>
                  <View style={[s.routeDot, { backgroundColor: C.red }]} />
                  <Text style={s.routeHalfLabel}>TO CITY</Text>
                </View>
                <TextInput
                  style={s.routeInput}
                  placeholder="e.g. Delhi"
                  placeholderTextColor={C.muted}
                  value={toCity}
                  onChangeText={setToCity}
                />
              </View>
            </View>

            {/* Date / Time grid 2x2 */}
            <View style={{ marginTop: 16, gap: 10 }}>
              <View style={s.dateGrid}>
                <TouchableOpacity
                  style={[s.dateTile, departureDate && s.dateTileActive]}
                  onPress={() => setShowDatePicker('departure')}
                  activeOpacity={0.8}
                >
                  <Text style={s.dateTileLabel}>DEPARTURE DATE *</Text>
                  <View style={s.dateTileRow}>
                    <Icon name="calendar" size={16} color={departureDate ? C.g600 : C.muted} />
                    <Text style={[s.dateTileValue, !departureDate && s.dateTilePlaceholder]}>
                      {departureDate ? fmtDate(departureDate) : 'Select date'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.dateTile, departureTime && s.dateTileActive]}
                  onPress={() => setShowTimePicker('departure')}
                  activeOpacity={0.8}
                >
                  <Text style={s.dateTileLabel}>DEPARTURE TIME</Text>
                  <View style={s.dateTileRow}>
                    <Icon name="clock" size={16} color={departureTime ? C.g600 : C.muted} />
                    <Text style={[s.dateTileValue, !departureTime && s.dateTilePlaceholder]}>
                      {departureTime ? fmtTime(departureTime) : 'Set time'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={s.dateGrid}>
                <TouchableOpacity
                  style={[s.dateTile, arrivalDate && s.dateTileActive]}
                  onPress={() => setShowDatePicker('arrival')}
                  activeOpacity={0.8}
                >
                  <Text style={s.dateTileLabel}>ARRIVAL DATE</Text>
                  <View style={s.dateTileRow}>
                    <Icon name="calendar" size={16} color={arrivalDate ? C.g600 : C.muted} />
                    <Text style={[s.dateTileValue, !arrivalDate && s.dateTilePlaceholder]}>
                      {arrivalDate ? fmtDate(arrivalDate) : 'Optional'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.dateTile, arrivalTime && s.dateTileActive]}
                  onPress={() => setShowTimePicker('arrival')}
                  activeOpacity={0.8}
                >
                  <Text style={s.dateTileLabel}>ARRIVAL TIME</Text>
                  <View style={s.dateTileRow}>
                    <Icon name="clock" size={16} color={arrivalTime ? C.g600 : C.muted} />
                    <Text style={[s.dateTileValue, !arrivalTime && s.dateTilePlaceholder]}>
                      {arrivalTime ? fmtTime(arrivalTime) : 'Optional'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </SectionCard>

          {/* ── STEP 4: PRICING ── */}
          <SectionCard
            step={4}
            stepColor={['#B45309', C.amber]}
            title="Pricing"
            subtitle="Set your rates"
          >
            {/* Dark price display card */}
            <LinearGradient colors={[C.g800, C.g700]} style={s.priceDisplayCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.priceDisplayLabel}>
                {serviceType === 'car' ? 'TRIP PRICE *' : 'FULL LOAD PRICE *'}
              </Text>
              <View style={s.priceDisplayRow}>
                <Text style={s.priceDisplaySymbol}>₹</Text>
                <TextInput
                  style={s.priceDisplayInput}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={fullLoadPrice}
                  onChangeText={setFullLoadPrice}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={s.priceDisplaySub}>
                {serviceType === 'car' ? 'per trip' : 'per full load'}
              </Text>
            </LinearGradient>

            {/* Part load toggle (truck only) */}
            {serviceType === 'truck' && (
              <View style={{ marginTop: 14, gap: 10 }}>
                <ToggleCard
                  iconName="package-variant-closed"
                  iconColor={C.amber}
                  iconBg={C.amberBg}
                  label="Part Load Available"
                  sub="Allow partial cargo bookings"
                  value={partLoadEnabled}
                  onValueChange={setPartLoadEnabled}
                  active={partLoadEnabled}
                  activeColor={C.amber}
                />

                {partLoadEnabled && (
                  <LinearGradient colors={['#FFFBEB', '#FEF3C7']} style={s.partLoadPriceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.partLoadPriceLabel}>PART LOAD PRICE</Text>
                    <View style={s.partLoadPriceRow}>
                      <Text style={s.partLoadPriceSymbol}>₹</Text>
                      <TextInput
                        style={s.partLoadPriceInput}
                        placeholder="0"
                        placeholderTextColor={C.muted}
                        value={partLoadPrice}
                        onChangeText={setPartLoadPrice}
                        keyboardType="number-pad"
                      />
                    </View>
                  </LinearGradient>
                )}
              </View>
            )}
          </SectionCard>

          {/* ── STEP 5: VEHICLE DETAILS ── */}
          <SectionCard
            step={5}
            stepColor={['#0F766E', C.teal]}
            title="Vehicle Details"
            subtitle="Specs & features"
          >
            {/* Capacity field */}
            <FieldCard
              iconName={serviceType === 'truck' ? 'weight' : 'seat-passenger'}
              iconColor={C.teal}
              iconBg={C.tealBg}
              label={serviceType === 'truck' ? 'Capacity (Tonnage)' : 'Seating Capacity'}
              placeholder={serviceType === 'truck' ? 'e.g. 9 (in tonnes)' : 'e.g. 5'}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />

            {/* Body type chips (truck only) */}
            {serviceType === 'truck' && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.subLabel}>Body Type</Text>
                <View style={s.chipGrid}>
                  {BODY_TYPES.map(bt => {
                    const active = bodyType === bt;
                    return (
                      <TouchableOpacity
                        key={bt}
                        style={[s.bodyTypeChip, active && s.bodyTypeChipActive]}
                        onPress={() => setBodyType(active ? '' : bt)}
                        activeOpacity={0.8}
                      >
                        {active ? (
                          <LinearGradient colors={[C.g700, C.g500]} style={s.bodyTypeChipGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <MCI name={BODY_TYPE_ICONS[bt] || 'truck'} size={14} color="#fff" />
                            <Text style={s.bodyTypeChipTextActive}>{bt}</Text>
                          </LinearGradient>
                        ) : (
                          <View style={s.bodyTypeChipInner}>
                            <MCI name={BODY_TYPE_ICONS[bt] || 'truck'} size={14} color={C.muted} />
                            <Text style={s.bodyTypeChipText}>{bt}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Driver toggle */}
            <View style={{ marginTop: 16 }}>
              <ToggleCard
                iconName="steering"
                iconColor={C.g700}
                iconBg={C.g50}
                label="Driver Included"
                sub="Vehicle comes with a driver"
                value={driverIncluded}
                onValueChange={setDriverIncluded}
                active={driverIncluded}
                activeColor={C.g600}
              />
            </View>

            {driverIncluded && (
              <View style={{ marginTop: 12, gap: 12 }}>
                {staffDrivers.length > 0 && (
                  <>
                    <Text style={s.subLabel}>Select from Staff</Text>
                    <TouchableOpacity
                      style={[s.dropdownTrigger, driverName && s.dropdownTriggerActive]}
                      onPress={() => setDriverDropdownOpen(true)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.dropdownIconBox, driverName && { backgroundColor: C.g100 }]}>
                        <MCI name="account" size={18} color={driverName ? C.g600 : C.muted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {driverName ? (
                          <>
                            <Text style={s.dropdownVal}>{driverName}</Text>
                            {driverPhone ? <Text style={s.dropdownValSub}>{driverPhone}</Text> : null}
                          </>
                        ) : (
                          <Text style={s.dropdownPlaceholder}>Tap to select driver</Text>
                        )}
                      </View>
                      <Icon name="chevron-down" size={18} color={driverName ? C.g600 : C.muted} />
                    </TouchableOpacity>
                  </>
                )}

                <View style={s.twoFieldRow}>
                  <View style={{ flex: 1 }}>
                    <FieldCard
                      iconName="account"
                      iconColor={C.g700}
                      iconBg={C.g50}
                      label="Driver Name"
                      placeholder="Enter name"
                      value={driverName}
                      onChangeText={setDriverName}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldCard
                      iconName="phone"
                      iconColor={C.g700}
                      iconBg={C.g50}
                      label="Driver Phone"
                      placeholder="Enter phone"
                      value={driverPhone}
                      onChangeText={setDriverPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Fuel toggle */}
            <View style={{ marginTop: 12 }}>
              <ToggleCard
                iconName="gas-station"
                iconColor={C.amber}
                iconBg={C.amberBg}
                label="Fuel Included"
                sub="Fuel cost covered in price"
                value={fuelIncluded}
                onValueChange={setFuelIncluded}
                active={fuelIncluded}
                activeColor={C.amber}
              />
            </View>

            {/* Truck-specific: Labour & Goods */}
            {serviceType === 'truck' && (
              <>
                <View style={{ marginTop: 12 }}>
                  <ToggleCard
                    iconName="account-hard-hat"
                    iconColor={C.blue}
                    iconBg={C.blueBg}
                    label="Labour Available"
                    sub="Loading / unloading labour"
                    value={labourAvailable}
                    onValueChange={setLabourAvailable}
                    active={labourAvailable}
                    activeColor={C.blue}
                  />
                </View>

                {labourAvailable && (
                  <View style={{ marginTop: 10 }}>
                    <FieldCard
                      iconName="account-group"
                      iconColor={C.blue}
                      iconBg={C.blueBg}
                      label="Number of Labourers"
                      placeholder="e.g. 2"
                      value={labourCount}
                      onChangeText={setLabourCount}
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <View style={{ marginTop: 14 }}>
                  <Text style={s.subLabel}>Goods Accepted</Text>
                  <View style={s.chipGrid}>
                    {GOODS_OPTIONS.map(g => {
                      const active = goodsAccepted.includes(g);
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[s.goodsChip, active && s.goodsChipActive]}
                          onPress={() => toggleGoods(g)}
                          activeOpacity={0.8}
                        >
                          <MCI name={GOODS_ICONS[g] || 'package'} size={14} color={active ? '#fff' : C.muted} />
                          <Text style={[s.goodsChipText, active && s.goodsChipTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </SectionCard>

          {/* ── NOTES ── */}
          <SectionCard
            step={6}
            stepColor={[C.g700, C.g400]}
            title="Additional Notes"
            subtitle="Optional remarks & instructions"
          >
            <View style={s.notesCard}>
              <MCI name="note-text" size={20} color={C.muted} style={{ marginBottom: 8 }} />
              <TextInput
                style={s.notesInput}
                placeholder="Any special instructions, route details, or remarks..."
                placeholderTextColor={C.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>
          </SectionCard>

          {/* ── SUBMIT ── */}
          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={loading ? { opacity: 0.6 } : {}}>
            <LinearGradient
              colors={G.emerald}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitBtn}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MCI name="truck-fast" size={20} color="#fff" />
                  <Text style={s.submitBtnText}>Post Vehicle</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── DATE / TIME PICKERS ── */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'departure' ? departureDate || new Date() : arrivalDate || departureDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={showDatePicker === 'arrival' && departureDate ? departureDate : new Date()}
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'departure' ? departureTime || new Date() : arrivalTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      {/* ── FLEET MODAL ── */}
      <Modal visible={fleetDropdownOpen} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setFleetDropdownOpen(false)}>
          <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
            <LinearGradient colors={[T.forestDark, T.forest]} style={s.modalGradHeader}>
              <View style={s.modalHandle} />
              <View style={s.modalHeaderRow}>
                <View style={s.modalHeaderIconBox}>
                  <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={18} color="#fff" />
                </View>
                <Text style={s.modalTitle}>Select Vehicle</Text>
                <TouchableOpacity onPress={() => setFleetDropdownOpen(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={s.modalSub}>{fleetVehicles.length} vehicles in your fleet</Text>
            </LinearGradient>
            <FlatList
              data={fleetVehicles}
              keyExtractor={item => String(item.id)}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 16, paddingTop: 10 }}
              renderItem={({ item: v }) => {
                const id = String(v.id);
                const active = selectedFleetId === id;
                const name = getFleetVehicleName(v);
                const reg = v.registrationNumber || '';
                const category = v.chauffeur_vehicle_categories?.name || v.vehicle_models?.chauffeur_vehicle_categories?.name || '';
                return (
                  <TouchableOpacity
                    style={[s.modalListItem, active && s.modalListItemActive]}
                    onPress={() => { setSelectedFleetId(id); setFleetDropdownOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={[s.modalListIconBox, active && { backgroundColor: C.g100 }]}>
                      <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={22} color={active ? C.g600 : C.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.modalListName, active && { color: C.g700 }]} numberOfLines={1}>{name}</Text>
                      {!!reg && <Text style={s.modalListReg}>{reg}</Text>}
                      {!!category && <Text style={s.modalListCat}>{category}</Text>}
                    </View>
                    {active && <Icon name="check-circle" size={20} color={C.g500} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={s.modalEmpty}>No vehicles found</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── DRIVER MODAL ── */}
      <Modal visible={driverDropdownOpen} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setDriverDropdownOpen(false)}>
          <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
            <LinearGradient colors={[T.forestDark, T.forest]} style={s.modalGradHeader}>
              <View style={s.modalHandle} />
              <View style={s.modalHeaderRow}>
                <View style={s.modalHeaderIconBox}>
                  <MCI name="account-tie" size={18} color="#fff" />
                </View>
                <Text style={s.modalTitle}>Select Driver</Text>
                <TouchableOpacity onPress={() => setDriverDropdownOpen(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={s.modalSub}>{staffDrivers.length} drivers available</Text>
            </LinearGradient>
            <FlatList
              data={staffDrivers}
              keyExtractor={item => String(item.id)}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 16, paddingTop: 10 }}
              renderItem={({ item: d }) => {
                const active = driverName === (d.name || '');
                return (
                  <TouchableOpacity
                    style={[s.modalListItem, active && s.modalListItemActive]}
                    onPress={() => {
                      setDriverName(d.name || '');
                      setDriverPhone(d.phone || '');
                      setDriverDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[s.modalListIconBox, active && { backgroundColor: C.g100 }]}>
                      <MCI name="account" size={20} color={active ? C.g600 : C.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.modalListName, active && { color: C.g700 }]}>{d.name || 'Driver'}</Text>
                      {!!d.phone && <Text style={s.modalListReg}>{d.phone}</Text>}
                    </View>
                    {active && <Icon name="check-circle" size={20} color={C.g500} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={s.modalEmpty}>No drivers found</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} actions={alert.actions} />
    </View>
  );
}

/* ─────────────────────────────────────────
   SECTION CARD COMPONENT
───────────────────────────────────────── */
function SectionCard({ step, stepColor, title, subtitle, children }) {
  return (
    <View style={s.sectionCard}>
      {/* Section header bar */}
      <View style={s.sectionHeaderBar}>
        <LinearGradient colors={stepColor || [C.g700, C.g500]} style={s.stepCircle}>
          <Text style={s.stepNumber}>{step}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {/* Content */}
      <View style={s.sectionContent}>
        {children}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────
   FIELD CARD COMPONENT
───────────────────────────────────────── */
function FieldCard({ iconName, iconColor, iconBg, label, placeholder, value, onChangeText, keyboardType, autoCapitalize }) {
  return (
    <View style={s.fieldCard}>
      <View style={[s.fieldIconBox, { backgroundColor: iconBg || C.g50 }]}>
        <MCI name={iconName} size={18} color={iconColor || C.g600} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.fieldCardLabel}>{label}</Text>
        <TextInput
          style={s.fieldCardInput}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
        />
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────
   TOGGLE ROW CARD COMPONENT
───────────────────────────────────────── */
function ToggleCard({ iconName, iconColor, iconBg, label, sub, value, onValueChange, active, activeColor }) {
  return (
    <View style={[s.toggleCard, active && { borderColor: activeColor || C.g600 }]}>
      <View style={[s.toggleCardIconBox, { backgroundColor: active ? (iconBg || C.g50) : '#F1F5F9' }]}>
        <MCI name={iconName} size={18} color={active ? (iconColor || C.g600) : C.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleCardLabel}>{label}</Text>
        <Text style={s.toggleCardSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.borderMed, true: activeColor || C.g500 }}
        thumbColor={value ? '#fff' : '#f4f4f5'}
      />
    </View>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  headerGradient: { paddingBottom: 20, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  decCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -50,
  },
  decCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.045)', bottom: -40, left: -30,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.2 },

  /* Scroll */
  scroll: { padding: 16, gap: 16 },

  /* Section Card */
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumber: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  sectionSubtitle: { fontSize: 11, color: C.muted, marginTop: 1 },
  sectionContent: { padding: 16 },

  /* Service Type */
  serviceTypeRow: { flexDirection: 'row', gap: 12 },
  serviceCard: {
    flex: 1, paddingVertical: 20, borderRadius: rs(16), borderWidth: 2,
    borderColor: C.border, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    position: 'relative', overflow: 'hidden',
  },
  serviceCardActiveTruck: { borderColor: C.g600, backgroundColor: C.g50 },
  serviceCardActiveCar: { borderColor: C.purple, backgroundColor: C.purpleBg },
  serviceCheckBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.g500,
  },
  serviceCardLabel: { fontSize: 15, fontWeight: '700', color: C.muted },
  serviceCardSub: { fontSize: 11, color: C.muted },

  /* Source toggle */
  sourceToggleWrap: {
    flexDirection: 'row', backgroundColor: '#F1F5F9',
    borderRadius: 14, padding: 4, gap: 4,
  },
  sourceTab: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
  },
  sourceTabActive: { backgroundColor: C.g700 },
  sourceTabText: { fontSize: 13, fontWeight: '700', color: C.muted },
  sourceTabTextActive: { color: '#fff' },

  /* Empty fleet */
  emptyFleetBox: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyFleetText: { fontSize: 13, color: C.muted },
  emptyFleetLink: { fontSize: 13, color: C.g500, fontWeight: '700', marginTop: 4 },

  /* Dropdown trigger */
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: rs(14), borderWidth: 1.5, borderColor: C.border,
    backgroundColor: '#F8FAFC',
  },
  dropdownTriggerActive: { borderColor: C.g500, backgroundColor: C.g50 },
  dropdownIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  dropdownVal: { fontSize: 14, fontWeight: '700', color: C.text },
  dropdownValSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  dropdownPlaceholder: { fontSize: 14, color: C.muted },

  /* Selected badge */
  selectedBadge: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: rs(14), borderWidth: 2, borderColor: C.g400,
    backgroundColor: C.g50,
  },
  selectedBadgeIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center',
  },
  selectedBadgeName: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  selectedBadgeNum: { fontSize: 12, color: C.blue, fontFamily: 'monospace', marginTop: 2 },
  selectedBadgeClear: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },

  /* Sub label */
  subLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  /* Chip grid */
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipPill: {
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  chipPillActive: { borderColor: C.g600, backgroundColor: C.g50 },
  chipPillText: { fontSize: 12, fontWeight: '600', color: C.muted },
  chipPillTextActive: { color: C.g700 },

  /* Route card */
  routeCard: {
    borderRadius: rs(16), borderWidth: 1.5, borderColor: C.borderMed,
    backgroundColor: '#F8FAFC', overflow: 'hidden',
  },
  routeHalf: { padding: 16 },
  routeDotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeHalfLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  routeInput: {
    fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: C.text,
    paddingVertical: 4, padding: 0,
  },
  routeDividerWrap: { position: 'relative', height: 1 },
  routeDivider: {
    borderStyle: 'dashed', borderColor: C.borderMed,
    borderTopWidth: 1, marginHorizontal: 16,
  },
  routeArrowCircle: {
    position: 'absolute', top: -12, alignSelf: 'center',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Date tiles */
  dateGrid: { flexDirection: 'row', gap: 10 },
  dateTile: {
    flex: 1, backgroundColor: C.surface, borderRadius: rs(14), padding: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  dateTileActive: { borderColor: C.g400, backgroundColor: C.g50 },
  dateTileLabel: {
    fontSize: 9, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  dateTileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTileValue: { fontSize: 13, fontWeight: '700', color: C.text, flex: 1 },
  dateTilePlaceholder: { color: C.muted, fontWeight: '400' },

  /* Price display card */
  priceDisplayCard: {
    borderRadius: rs(16), padding: 20,
    alignItems: 'flex-start',
  },
  priceDisplayLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  priceDisplayRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, width: '100%' },
  priceDisplaySymbol: { fontSize: 18, fontWeight: '700', color: C.g300, marginBottom: 6 },
  priceDisplayInput: {
    fontFamily: DISPLAY, flex: 1, fontSize: 36, fontWeight: '900', color: '#fff',
    padding: 0, textAlign: 'right',
  },
  priceDisplaySub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },

  /* Part load price mini card */
  partLoadPriceCard: {
    borderRadius: rs(14), padding: 16,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  partLoadPriceLabel: {
    fontSize: 10, fontWeight: '700', color: '#92400E',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  partLoadPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partLoadPriceSymbol: { fontSize: 16, fontWeight: '700', color: C.amber },
  partLoadPriceInput: {
    flex: 1, fontSize: 20, fontWeight: '700', color: C.text,
    padding: 0,
  },

  /* Field card */
  fieldCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, padding: 14,
  },
  fieldIconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldCardLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
  },
  fieldCardInput: {
    fontSize: 15, fontWeight: '600', color: C.text,
    padding: 0,
  },

  /* Two field row */
  twoFieldRow: { flexDirection: 'row', gap: 10 },

  /* Body type chips */
  bodyTypeChip: {
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    overflow: 'hidden',
  },
  bodyTypeChipActive: { borderColor: C.g500 },
  bodyTypeChipGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  bodyTypeChipInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 12,
    backgroundColor: C.surface,
  },
  bodyTypeChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  bodyTypeChipTextActive: { fontSize: 12, fontWeight: '700', color: '#fff' },

  /* Toggle card */
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, padding: 14,
  },
  toggleCardIconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  toggleCardLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  toggleCardSub: { fontSize: 11, color: C.muted, marginTop: 1 },

  /* Goods chips */
  goodsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface,
  },
  goodsChipActive: { borderColor: C.g600, backgroundColor: C.g700 },
  goodsChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  goodsChipTextActive: { color: '#fff' },

  /* Notes */
  notesCard: {
    backgroundColor: '#F8FAFC', borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, padding: 14,
  },
  notesInput: {
    fontSize: 14, color: C.text, height: 90,
    textAlignVertical: 'top', padding: 0,
  },

  /* Submit / Cancel */
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: rs(18), marginTop: 8,
    ...cardShadow,
  },
  submitBtnText: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: C.muted },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden', maxHeight: '65%',
  },
  modalGradHeader: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 18 },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center', marginBottom: 14,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalHeaderIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff', flex: 1 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  modalListItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: rs(14), borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
    marginBottom: 8, marginHorizontal: 14,
  },
  modalListItemActive: {
    borderColor: C.g500, backgroundColor: C.g50, borderWidth: 2,
  },
  modalListIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  modalListName: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  modalListReg: { fontSize: 12, color: C.blue, fontFamily: 'monospace', marginTop: 2 },
  modalListCat: { fontSize: 11, color: C.muted, marginTop: 1 },
  modalEmpty: { textAlign: 'center', color: C.muted, padding: 24, fontSize: 14 },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { createDirectBooking } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex, mirroring the mapping
// convention already used in DirectBookingsScreen.js / DirectBookingDetailScreen.js.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: shade(T.emerald, 20), g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, subtext: T.text, muted: T.subText, border: T.border,
  blue: T.blue, indigo: T.indigo, purple: T.purple,
  amber: T.amber, orange: T.orange, red: T.red, teal: T.ocean,
};

/* ─── Static data ─── */

const SERVICE_TYPES = [
  { value: 'car-with-driver', label: 'Car w/ Driver', icon: 'car',             color: C.blue   },
  { value: 'self-drive',      label: 'Self-Drive',    icon: 'car-side',        color: C.purple },
  { value: 'bike',            label: 'Bike',          icon: 'motorbike',       color: C.amber  },
  { value: 'bus',             label: 'Bus & Tempo',   icon: 'bus',             color: C.teal   },
  { value: 'luxury',          label: 'Luxury Car',    icon: 'car-sports',      color: '#EAB308'},
  { value: 'transporter',     label: 'Transporter',   icon: 'truck',           color: C.orange },
  { value: 'packers-movers',  label: 'Packers',       icon: 'package-variant', color: C.indigo },
  { value: 'equipment',       label: 'Equipment',     icon: 'wrench',          color: C.red    },
  { value: 'general',         label: 'General',       icon: 'clipboard-text',  color: C.muted  },
];

const VEHICLE_OPTIONS = {
  bike:              ['Activa', 'Royal Enfield', 'KTM', 'Pulsar', 'Apache', 'Splendor', 'Other'],
  bus:               ['12 Seater Tempo', '17 Seater Tempo', '20 Seater Tempo', '26 Seater Bus', '32 Seater Bus', '45 Seater Bus', 'Other'],
  'car-with-driver': ['Sedan', 'SUV', 'Hatchback', 'Innova', 'Fortuner', 'Ertiga', 'Other'],
  'self-drive':      ['Hatchback', 'Sedan', 'SUV', 'Creta', 'Seltos', 'Other'],
  luxury:            ['BMW', 'Mercedes', 'Audi', 'Range Rover', 'Jaguar', 'Other'],
  transporter:       ['Tata Ace', 'Tata 407', 'Canter 17ft', 'Truck 9MT', 'Truck 16MT', 'Other'],
  'packers-movers':  ['Small Move (1BHK)', 'Medium Move (2BHK)', 'Large Move (3BHK+)', 'Office Relocation', 'Other'],
  equipment:         ['JCB / Excavator', 'Crane', 'Hydra Crane', 'Generator', 'Concrete Mixer', 'Other'],
  general:           [],
};

const CAR_TRIP_TYPES   = ['Local (within city)', 'Outstation - One Way', 'Outstation - Round Trip', 'Airport Pickup', 'Airport Drop'];
const BUS_TRIP_TYPES   = ['Local / Sightseeing', 'Outstation Trip', 'Wedding', 'Pilgrimage / Religious', 'Corporate / Office', 'School / College'];
const LUXURY_OCCASIONS = ['Wedding', 'Corporate Event', 'Birthday', 'Anniversary', 'Photoshoot', 'Airport Transfer', 'Other'];
const MOVE_SIZES       = ['1 BHK', '2 BHK', '3 BHK', '3+ BHK / Villa', 'Office / Commercial'];
const GOODS_TYPES      = ['Household Goods', 'Furniture & Wood', 'Electronics', 'Vehicles/Automobiles', 'Building Materials', 'Agricultural Produce', 'Industrial Goods', 'Fragile / Delicate', 'Other'];
const EQUIP_DURATIONS  = ['1 to 5 Days', '6 to 15 Days', '16 to 30 Days', 'More than 30 Days'];
const TRUCK_TYPES      = ['Tata Ace (0.75MT)', 'Tata 407 (2.5MT)', 'Canter 17ft', 'Truck 9MT', 'Truck 16MT', 'Truck 20MT', 'Truck 25MT', 'Semi Low Bed Trailer', 'LCV'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ─── Component ─── */

export default function AddDirectBookingScreen({ navigation }) {
  const [saving, setSaving] = useState(false);
  const [showPickupDate, setShowPickupDate] = useState(false);
  const [showReturnDate, setShowReturnDate] = useState(false);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: null });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: null });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    serviceType: 'car-with-driver', vehicleType: '',
    pickupDate: null, returnDate: null,
    pickupLocation: '', dropLocation: '',
    notes: '',
    tripType: '', passengerCount: '', helmetCount: '',
    occasion: '', licenseNumber: '', pickupTime: '',
    useType: '', goodsType: '', goodsWeight: '', weightUnit: 'KG',
    moveSize: '', packingRequired: '', floorInfo: '',
    equipDuration: '', equipUnits: '',
    truckType: '',
    totalAmount: '', paymentStatus: 'pending', paymentMode: '', paidAmount: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const changeService = (svc) => {
    setForm(p => ({
      ...p, serviceType: svc, vehicleType: '',
      tripType: '', passengerCount: '', helmetCount: '',
      occasion: '', licenseNumber: '', pickupTime: '',
      useType: '', goodsType: '', goodsWeight: '', weightUnit: 'KG',
      moveSize: '', packingRequired: '', floorInfo: '',
      equipDuration: '', equipUnits: '', truckType: '',
    }));
  };

  const vehicles = VEHICLE_OPTIONS[form.serviceType] || [];

  const buildNotes = () => {
    const extras = [];
    if (form.tripType)        extras.push(`Trip type: ${form.tripType}`);
    if (form.pickupTime)      extras.push(`Pickup time: ${form.pickupTime}`);
    if (form.passengerCount)  extras.push(`Passengers: ${form.passengerCount}`);
    if (form.helmetCount)     extras.push(`Helmets: ${form.helmetCount}`);
    if (form.occasion)        extras.push(`Occasion: ${form.occasion}`);
    if (form.licenseNumber)   extras.push(`License: ${form.licenseNumber}`);
    if (form.useType)         extras.push(`Use Type: ${form.useType}`);
    if (form.truckType)       extras.push(`Truck: ${form.truckType}`);
    if (form.goodsType)       extras.push(`Goods: ${form.goodsType}`);
    if (form.goodsWeight)     extras.push(`Weight: ${form.goodsWeight} ${form.weightUnit}`);
    if (form.moveSize)        extras.push(`Move size: ${form.moveSize}`);
    if (form.packingRequired) extras.push(`Packing: ${form.packingRequired}`);
    if (form.floorInfo)       extras.push(`Floor info: ${form.floorInfo}`);
    if (form.equipDuration)   extras.push(`Duration: ${form.equipDuration}`);
    if (form.equipUnits)      extras.push(`Units: ${form.equipUnits}`);
    return [form.notes, ...extras].filter(Boolean).join('\n');
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim()) return showAlert('warning', 'Missing Info', 'Customer name is required');
    if (form.customerPhone.replace(/\D/g, '').length < 10) return showAlert('warning', 'Invalid Phone', 'Enter a valid 10-digit phone number');

    setSaving(true);
    try {
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        serviceType: form.serviceType,
        vehicleType: form.vehicleType || form.truckType,
        pickupDate: form.pickupDate ? form.pickupDate.toISOString() : undefined,
        returnDate: form.returnDate ? form.returnDate.toISOString() : undefined,
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        notes: buildNotes(),
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        paymentStatus: form.paymentStatus,
        paymentMode: form.paymentMode || undefined,
        paidAmount: form.paidAmount ? Number(form.paidAmount) : undefined,
      };

      const res = await createDirectBooking(payload);
      const bookingId = res?.booking?.id || res?.id;
      setAlert({
        visible: true, type: 'success', title: 'Booking Created!',
        message: 'Your direct booking has been saved successfully.',
        actions: [{
          label: 'View Booking', variant: 'primary',
          onPress: () => {
            hideAlert();
            if (bookingId) navigation.replace('DirectBookingDetail', { bookingId });
            else navigation.goBack();
          },
        }],
      });
    } catch (err) {
      showAlert('error', 'Failed', err?.response?.data?.error || err?.message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render helpers ─── */

  const renderChips = (options, selectedValue, onSelect, cols = 2) => (
    <View style={s.chipGrid}>
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = selectedValue === val;
        return (
          <TouchableOpacity
            key={val}
            style={[s.chip, active && s.chipActive, { width: cols === 3 ? '31%' : '48%' }]}
            onPress={() => onSelect(active ? '' : val)}
          >
            <Text style={[s.chipTxt, active && s.chipTxtActive]} numberOfLines={2}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderServiceFields = () => {
    const svc = form.serviceType;

    if (svc === 'car-with-driver') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Trip Type</Text>
        {renderChips(CAR_TRIP_TYPES, form.tripType, v => set('tripType', v))}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Pickup Time</Text>
        <TextInput style={s.input} placeholder="e.g. 06:00 AM" placeholderTextColor={C.muted} value={form.pickupTime} onChangeText={v => set('pickupTime', v)} />
      </View>
    );

    if (svc === 'self-drive') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Pickup Time</Text>
        <TextInput style={s.input} placeholder="e.g. 10:00 AM" placeholderTextColor={C.muted} value={form.pickupTime} onChangeText={v => set('pickupTime', v)} />
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>License Number (optional)</Text>
        <TextInput style={s.input} placeholder="DL-XXXX-XXXXXXXX" placeholderTextColor={C.muted} value={form.licenseNumber} onChangeText={v => set('licenseNumber', v)} />
      </View>
    );

    if (svc === 'bike') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Pickup Time</Text>
        <TextInput style={s.input} placeholder="e.g. 09:00 AM" placeholderTextColor={C.muted} value={form.pickupTime} onChangeText={v => set('pickupTime', v)} />
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Helmets Required</Text>
        {renderChips(['No helmet', '1 Helmet', '2 Helmets'], form.helmetCount, v => set('helmetCount', v), 3)}
      </View>
    );

    if (svc === 'bus') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Trip Type</Text>
        {renderChips(BUS_TRIP_TYPES, form.tripType, v => set('tripType', v))}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>No. of Passengers</Text>
        <TextInput style={s.input} placeholder="e.g. 20" placeholderTextColor={C.muted} value={form.passengerCount} onChangeText={v => set('passengerCount', v)} keyboardType="number-pad" />
      </View>
    );

    if (svc === 'luxury') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Occasion</Text>
        {renderChips(LUXURY_OCCASIONS, form.occasion, v => set('occasion', v))}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Pickup Time</Text>
        <TextInput style={s.input} placeholder="e.g. 07:00 PM" placeholderTextColor={C.muted} value={form.pickupTime} onChangeText={v => set('pickupTime', v)} />
      </View>
    );

    if (svc === 'transporter') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Use Type</Text>
        <View style={s.toggleRow}>
          {['Personal', 'Commercial'].map(opt => (
            <TouchableOpacity key={opt} style={[s.toggle, form.useType === opt && s.toggleActive]} onPress={() => set('useType', opt)}>
              <Text style={[s.toggleTxt, form.useType === opt && s.toggleTxtActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Truck Type</Text>
        {renderChips(TRUCK_TYPES, form.truckType, v => set('truckType', v))}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Goods Type</Text>
        {renderChips(GOODS_TYPES, form.goodsType, v => set('goodsType', v), 3)}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Approx. Weight (optional)</Text>
        <View style={s.weightRow}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="e.g. 500" placeholderTextColor={C.muted} value={form.goodsWeight} onChangeText={v => set('goodsWeight', v)} keyboardType="number-pad" />
          <View style={s.unitToggle}>
            {['KG', 'TON'].map(u => (
              <TouchableOpacity key={u} style={[s.unitBtn, form.weightUnit === u && s.unitBtnActive]} onPress={() => set('weightUnit', u)}>
                <Text style={[s.unitBtnTxt, form.weightUnit === u && s.unitBtnTxtActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );

    if (svc === 'packers-movers') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Move Size</Text>
        {renderChips(MOVE_SIZES, form.moveSize, v => set('moveSize', v))}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Packing Required?</Text>
        <View style={s.toggleRow}>
          {['Yes', 'No', 'Partial'].map(opt => (
            <TouchableOpacity key={opt} style={[s.toggle, form.packingRequired === opt && s.toggleActive, { flex: 1 }]} onPress={() => set('packingRequired', opt)}>
              <Text style={[s.toggleTxt, form.packingRequired === opt && s.toggleTxtActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Floor / Lift Info (optional)</Text>
        <TextInput style={s.input} placeholder="e.g. 3rd floor, no lift" placeholderTextColor={C.muted} value={form.floorInfo} onChangeText={v => set('floorInfo', v)} />
      </View>
    );

    if (svc === 'equipment') return (
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Equipment Type</Text>
        {renderChips(
          ['JCB / Excavator', 'Grove Crane', 'Hydra Crane', 'Tower Crane', 'Bulldozer', 'Dumper', 'Loader', 'Generator', 'Concrete Mixer', 'Other'],
          form.vehicleType, v => set('vehicleType', v),
        )}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Rental Duration</Text>
        {renderChips(EQUIP_DURATIONS, form.equipDuration, v => set('equipDuration', v))}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>No. of Units (optional)</Text>
        <TextInput style={s.input} placeholder="e.g. 2" placeholderTextColor={C.muted} value={form.equipUnits} onChangeText={v => set('equipUnits', v)} keyboardType="number-pad" />
      </View>
    );

    return null;
  };

  const svcMeta = SERVICE_TYPES.find(sv => sv.value === form.serviceType) || SERVICE_TYPES[0];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ── */}
      <LinearGradient colors={G.hero} style={s.hero}>
        <AnimatedOrb style={s.orbA} />
        <AnimatedOrb style={s.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={s.heroSafe}>
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.heroIconChip}>
              <MaterialCommunityIcons name="book-plus" size={20} color="#fff" />
            </View>
          </View>

          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="book-plus" size={12} color={C.g400} />
            <Text style={s.heroBadgeTxt}>MANUAL ENTRY</Text>
          </View>
          <Text style={s.heroTitle}>Add Direct Booking</Text>
          <Text style={s.heroSub}>Manual walk-in entry</Text>

          <View style={{ height: rs(18) }} />
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* 1. Service Type */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.g100 }]}>
                <MaterialCommunityIcons name="car-multiple" size={16} color={C.g700} />
              </View>
              <Text style={s.sectionTitle}>Service Type</Text>
            </View>
            <View style={s.serviceGrid}>
              {SERVICE_TYPES.map(svc => {
                const active = form.serviceType === svc.value;
                return (
                  <TouchableOpacity
                    key={svc.value}
                    style={[s.svcCard, active && { borderColor: svc.color, backgroundColor: svc.color + '12' }]}
                    onPress={() => changeService(svc.value)}
                  >
                    <MaterialCommunityIcons name={svc.icon} size={22} color={active ? svc.color : C.muted} />
                    <Text style={[s.svcCardLabel, active && { color: svc.color }]}>{svc.label}</Text>
                    {active && <View style={[s.activeDot, { backgroundColor: svc.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {vehicles.length > 0 && form.serviceType !== 'transporter' && form.serviceType !== 'equipment' && (
              <View style={{ marginTop: 16 }}>
                <Text style={s.fieldLabel}>Vehicle (optional)</Text>
                {renderChips(vehicles, form.vehicleType, v => set('vehicleType', v), 3)}
              </View>
            )}
          </View>

          {/* 2. Service-specific fields */}
          {form.serviceType !== 'general' && (
            <View style={[s.section, { borderColor: svcMeta.color + '50', borderWidth: 1.5 }]}>
              <View style={s.sectionHead}>
                <View style={[s.sectionIcon, { backgroundColor: svcMeta.color + '18' }]}>
                  <MaterialCommunityIcons name={svcMeta.icon} size={16} color={svcMeta.color} />
                </View>
                <Text style={s.sectionTitle}>{svcMeta.label} Details</Text>
              </View>
              {renderServiceFields()}
            </View>
          )}

          {/* 3. Customer Details */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Icon name="user" size={15} color={C.indigo} />
              </View>
              <Text style={s.sectionTitle}>Customer Details</Text>
            </View>

            <Text style={s.fieldLabel}>Full Name *</Text>
            <TextInput
              style={s.input}
              placeholder="Customer full name"
              placeholderTextColor={C.muted}
              value={form.customerName}
              onChangeText={v => set('customerName', v)}
            />

            <View style={s.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Phone *</Text>
                <TextInput
                  style={s.input}
                  placeholder="10-digit mobile"
                  placeholderTextColor={C.muted}
                  value={form.customerPhone}
                  onChangeText={v => set('customerPhone', v)}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Email (optional)</Text>
                <TextInput
                  style={s.input}
                  placeholder="email@example.com"
                  placeholderTextColor={C.muted}
                  value={form.customerEmail}
                  onChangeText={v => set('customerEmail', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* 4. Schedule & Location */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.g100 }]}>
                <Icon name="map-pin" size={15} color={C.g700} />
              </View>
              <Text style={s.sectionTitle}>Schedule & Location</Text>
            </View>

            <View style={s.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>{form.serviceType === 'equipment' ? 'Start Date' : 'Pickup Date'}</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowPickupDate(true)}>
                  <Icon name="calendar" size={16} color={C.g600} />
                  <Text style={[s.dateBtnTxt, form.pickupDate && { color: C.text }]}>
                    {form.pickupDate ? fmtDate(form.pickupDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>
                  {form.serviceType === 'packers-movers' ? 'Move-in Date' : form.serviceType === 'equipment' ? 'End Date' : 'Return Date'}
                </Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowReturnDate(true)}>
                  <Icon name="calendar" size={16} color={C.g600} />
                  <Text style={[s.dateBtnTxt, form.returnDate && { color: C.text }]}>
                    {form.returnDate ? fmtDate(form.returnDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {form.serviceType !== 'equipment' && (
              <>
                <Text style={s.fieldLabel}>
                  {form.serviceType === 'packers-movers' ? 'Current Address (Pickup)' : 'Pickup Location'}
                </Text>
                <TextInput
                  style={s.input}
                  placeholder={form.serviceType === 'packers-movers' ? 'Current home / office address' : 'Pickup address or area'}
                  placeholderTextColor={C.muted}
                  value={form.pickupLocation}
                  onChangeText={v => set('pickupLocation', v)}
                />
              </>
            )}

            {['car-with-driver', 'self-drive', 'bike', 'bus', 'luxury', 'transporter', 'packers-movers'].includes(form.serviceType) && (
              <>
                <Text style={s.fieldLabel}>
                  {form.serviceType === 'packers-movers' ? 'New Address (Drop)' : 'Drop Location'} (optional)
                </Text>
                <TextInput
                  style={s.input}
                  placeholder={form.serviceType === 'packers-movers' ? 'New home / office address' : 'Drop address'}
                  placeholderTextColor={C.muted}
                  value={form.dropLocation}
                  onChangeText={v => set('dropLocation', v)}
                />
              </>
            )}

            <Text style={s.fieldLabel}>Additional Notes (optional)</Text>
            <TextInput
              style={[s.input, { height: 72, textAlignVertical: 'top' }]}
              multiline
              placeholder="Any special requirements or remarks..."
              placeholderTextColor={C.muted}
              value={form.notes}
              onChangeText={v => set('notes', v)}
            />
          </View>

          {/* 5. Payment */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="credit-card" size={15} color={C.amber} />
              </View>
              <Text style={s.sectionTitle}>Payment</Text>
            </View>

            <Text style={s.fieldLabel}>Total Amount (₹)</Text>
            <TextInput
              style={s.input}
              placeholder="0"
              placeholderTextColor={C.muted}
              value={form.totalAmount}
              onChangeText={v => set('totalAmount', v)}
              keyboardType="number-pad"
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Payment Status</Text>
            <View style={s.payStatusRow}>
              {[
                { value: 'pending',   label: 'Pending',  color: C.amber  },
                { value: 'partial',   label: 'Advance',  color: C.orange },
                { value: 'collected', label: 'Paid',     color: C.g600   },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.payStatusBtn, form.paymentStatus === opt.value && { backgroundColor: opt.color + '15', borderColor: opt.color }]}
                  onPress={() => set('paymentStatus', opt.value)}
                >
                  {form.paymentStatus === opt.value && <Icon name="check-circle" size={14} color={opt.color} />}
                  <Text style={[s.payStatusTxt, form.paymentStatus === opt.value && { color: opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(form.paymentStatus === 'collected' || form.paymentStatus === 'partial') && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.fieldLabel}>{form.paymentStatus === 'partial' ? 'Advance Collected (₹)' : 'Amount Collected (₹)'}</Text>
                <TextInput
                  style={s.input}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  value={form.paidAmount}
                  onChangeText={v => set('paidAmount', v)}
                  keyboardType="number-pad"
                />
                <Text style={[s.fieldLabel, { marginTop: 14 }]}>Payment Mode</Text>
                {renderChips(
                  [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }, { value: 'bank_transfer', label: 'Bank Transfer' }],
                  form.paymentMode, v => set('paymentMode', v),
                )}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity style={[s.submitWrap, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={G.emerald} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#fff" />
                  <Text style={s.submitBtnTxt}>Save Booking</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date pickers */}
      <DateTimePickerModal
        isVisible={showPickupDate}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => { set('pickupDate', date); setShowPickupDate(false); }}
        onCancel={() => setShowPickupDate(false)}
      />
      <DateTimePickerModal
        isVisible={showReturnDate}
        mode="date"
        minimumDate={form.pickupDate || new Date()}
        onConfirm={(date) => { set('returnDate', date); setShowReturnDate(false); }}
        onCancel={() => setShowReturnDate(false)}
      />

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Hero header ── */
  hero: {
    paddingHorizontal: 16, paddingBottom: rs(18), overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  heroSafe: {},
  orbA: {
    position: 'absolute', top: -50, right: -34, width: 170, height: 170,
    borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbB: {
    position: 'absolute', bottom: -34, left: -30, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.045)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(4), marginBottom: rs(14) },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroIconChip: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8,
  },
  heroBadgeTxt: { fontSize: 10.5, fontWeight: '700', color: C.g400, fontFamily: DISPLAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 3, letterSpacing: -0.4 },
  heroSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: '600', fontFamily: DISPLAY },

  scroll: { padding: 16, gap: 14 },

  /* Sections */
  section: { backgroundColor: C.surface, borderRadius: rs(16), padding: 16, borderWidth: 1, borderColor: C.border, ...cardShadow },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '800', color: C.text },

  /* Service grid */
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  svcCard: { width: '31%', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  svcCardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textAlign: 'center' },
  activeDot: { width: 6, height: 6, borderRadius: 3 },

  /* Fields */
  fieldGroup: {},
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text },
  rowFields: { flexDirection: 'row', gap: 10, marginTop: 4 },

  /* Chips */
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center' },
  chipActive: { borderColor: C.g500, backgroundColor: C.g50 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: C.subtext, textAlign: 'center' },
  chipTxtActive: { color: C.g700, fontWeight: '800' },

  /* Toggle */
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  toggleActive: { borderColor: C.g500, backgroundColor: C.g50 },
  toggleTxt: { fontSize: 13, fontWeight: '700', color: C.subtext },
  toggleTxtActive: { color: C.g700 },

  /* Weight */
  weightRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  unitToggle: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: C.border },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 11, backgroundColor: C.bg },
  unitBtnActive: { backgroundColor: C.g700 },
  unitBtnTxt: { fontSize: 13, fontWeight: '700', color: C.subtext },
  unitBtnTxtActive: { color: '#fff' },

  /* Date */
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  dateBtnTxt: { fontSize: 14, color: C.muted },

  /* Payment */
  payStatusRow: { flexDirection: 'row', gap: 8 },
  payStatusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  payStatusTxt: { fontSize: 12, fontWeight: '700', color: C.subtext },

  /* Submit */
  submitWrap: { borderRadius: rs(14), overflow: 'hidden', marginTop: 8 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitBtnTxt: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  cancelBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: rs(14), borderWidth: 1.5, borderColor: C.border, marginTop: 8 },
  cancelBtnTxt: { fontSize: 14, fontWeight: '600', color: C.muted },
});

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StatusBar,
  Modal, FlatList, RefreshControl,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getB2BOpenBookings, submitB2BQuote, getVendorFleet, getStaffDrivers, getB2BTrips, getTemplates, getTemplateById, b2bDriverAction, b2bVerifyOtp } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, shade, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g300: T.oceanLight, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight, amberDark: shade(T.amber, -15),
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight,
  purple: T.purple, purpleBg: T.tintPlum,
};

const BOOKING_STATUS_CONFIG = {
  OPEN_FOR_QUOTES:  { label: 'Open for Quotes', bg: C.g50,     text: C.g700,    dot: C.g500 },
  QUOTES_RECEIVED:  { label: 'Quotes Received', bg: C.blueBg,  text: '#1E40AF', dot: C.blue },
  CONFIRMED:        { label: 'Confirmed',        bg: C.g100,    text: '#065F46', dot: C.g500 },
  IN_PROGRESS:      { label: 'In Progress',      bg: C.purpleBg,text: '#5B21B6', dot: C.purple },
  COMPLETED:        { label: 'Completed',        bg: C.g100,    text: '#065F46', dot: C.g700 },
  CANCELLED:        { label: 'Cancelled',        bg: C.redBg,   text: '#991B1B', dot: C.red },
};

const SERVICE_ICONS = {
  'car': 'car', 'bus': 'bus', 'truck': 'truck', 'bike': 'motorbike',
  'equipment': 'excavator', 'packers': 'package-variant-closed',
  'luxury': 'car-sports', 'chauffeur': 'steering', 'self-drive': 'car-key', 'self_drive': 'car-key',
};

const DEFAULT_INCLUSIONS_REGULAR = [
  'Professional driver', 'Vehicle with AC', 'Valid insurance & registration',
  'Fuel included as per package', '24x7 roadside assistance',
];
const DEFAULT_EXCLUSIONS_REGULAR = [
  'Toll charges', 'Parking charges', 'State tax / border charges',
  'Night charges (after 10 PM)', 'Extra km / extra hour charges',
];
const DEFAULT_INCLUSIONS_SD = [
  'Vehicle with full tank', 'Valid insurance & registration',
  'Basic maintenance during rental', '24x7 roadside assistance', 'No hidden charges',
];
const DEFAULT_EXCLUSIONS_SD = [
  'Fuel charges', 'Traffic challans/fines', 'Toll charges',
  'Damage due to negligence', 'Any unauthorized usage',
];
const DEFAULT_TERMS_REGULAR = [
  'Cancellation must be 24 hours before pickup',
  'Driver bata (food allowance) to be borne by customer',
  'Waiting charges apply after 45 minutes',
  'Route and stops as per booking only',
  'Payment to be settled before trip ends',
];
const DEFAULT_TERMS_SD = [
  'Valid driving license (2+ years old) required',
  'Original Aadhaar card required',
  'Security deposit refundable after inspection',
  'No inter-state travel without prior approval',
  'Late return charges: ₹200/hour after 2 hours grace',
];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';
const fmtPrice = (n) => (n || 0).toLocaleString('en-IN');
const toNum = (s) => { const n = parseFloat(s); return isNaN(n) ? 0 : n; };

// Which pricing fields to show based on tripType
function getPricingFields(tripType) {
  const t = (tripType || '').toUpperCase();
  if (t === 'HOURLY' || t === 'LOCAL') {
    return ['basePrice', 'perHourRate', 'perKmRate', 'driverAllowance', 'nightCharges', 'extraHourCharge'];
  }
  if (t === 'ROUND_TRIP' || t === 'OUTSTATION') {
    return ['basePrice', 'perKmRate', 'perDayRate', 'driverAllowance', 'nightCharges', 'extraKmCharge'];
  }
  // ONE_WAY + default
  return ['basePrice', 'perKmRate', 'driverAllowance', 'nightCharges'];
}

const PRICING_LABELS = {
  basePrice: 'Base Price (₹)',
  perKmRate: 'Per KM Rate (₹)',
  perHourRate: 'Per Hour Rate (₹)',
  perDayRate: 'Per Day Rate (₹)',
  driverAllowance: 'Driver Allowance (₹)',
  nightCharges: 'Night Charges (₹)',
  extraKmCharge: 'Extra KM Charge (₹)',
  extraHourCharge: 'Extra Hour Charge (₹)',
};

const ADVANCE_OPTIONS = ['20', '25', '30', '40', '50'];

const TRIP_STATUS_CONFIG = {
  PENDING:       { label: 'Pending',        bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  DRIVER_ARRIVED:{ label: 'Driver Arrived', bg: '#ECFEFF', text: '#155E75', dot: '#06B6D4' },
  STARTED:       { label: 'In Progress',    bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  COMPLETED:     { label: 'Completed',      bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  CANCELLED:     { label: 'Cancelled',      bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
};

// Helper: small info row
function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <Icon name={icon} size={13} color={C.muted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoVal}>{value}</Text>
    </View>
  );
}

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Helper: two-column grid item
function GridItem({ icon, label, value }) {
  return (
    <View style={s.gridItem}>
      <Icon name={icon} size={13} color={C.muted} />
      <Text style={s.gridLabel}>{label}</Text>
      <Text style={s.gridVal}>{value}</Text>
    </View>
  );
}

export default function B2BBookingDetailScreen({ navigation, route }) {
  const { bookingId, booking: passedBooking, isFreshQuote } = route.params || {};

  // Core
  const [booking, setBooking] = useState(passedBooking || null);
  const [loading, setLoading] = useState(!passedBooking);
  const [submitting, setSubmitting] = useState(false);

  // Fleet & drivers
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [staffDrivers, setStaffDrivers] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(false);

  // Selected vehicles
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  // ── Non-self-drive global pricing ──────────────────────────────
  const [pricing, setPricing] = useState({
    basePrice: '', perKmRate: '', perHourRate: '', perDayRate: '',
    driverAllowance: '', nightCharges: '', extraKmCharge: '', extraHourCharge: '',
  });
  const updatePricing = (key, val) => setPricing(p => ({ ...p, [key]: val }));

  // ── Self-drive pricing ──────────────────────────────────────────
  const [sdCommonPrice, setSdCommonPrice] = useState(''); // price per vehicle for full rental (common)
  const [sdPricing, setSdPricing] = useState({
    securityDeposit: '', kmLimitPerDay: '200', extraKmRate: '10',
    deliveryCharges: '', pickupCharges: '', advancePercent: '25', validityDays: '3',
  });
  const updateSd = (key, val) => setSdPricing(p => ({ ...p, [key]: val }));

  // ── Inclusions / Exclusions ────────────────────────────────────
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [vendorMessage, setVendorMessage] = useState('');

  // ── Templates (self-drive) ─────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);   // applying a template
  const [templatesListLoading, setTemplatesListLoading] = useState(false); // fetching list

  // ── Modals ─────────────────────────────────────────────────────
  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(null);
  const [fleetSearch, setFleetSearch] = useState('');

  // Trips (shown after quote is confirmed)
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tripActionLoading, setTripActionLoading] = useState({});
  const [tripOtps, setTripOtps] = useState({});

  // Alert
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });
  const showAlert = (type, title, message, actions) => setAlert({ visible: true, type, title, message, actions });
  const closeAlert = () => setAlert(p => ({ ...p, visible: false }));

  // ── Fetch booking ───────────────────────────────────────────────
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await getB2BOpenBookings(null, { bookingId });
      const found = (res.bookings || []).find(b => b.id === bookingId);
      if (found) setBooking(found);
    } catch (e) {
      console.error('Failed to fetch booking:', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const fetchTrips = useCallback(async (bid) => {
    if (!bid) return;
    try {
      const res = await getB2BTrips(null, { booking_id: bid });
      setTrips(res.trips || []);
    } catch (e) { console.error('Failed to fetch trips:', e); }
  }, []);

  const handleTripAction = (tripCode, action, confirmTitle, confirmMsg) => {
    showAlert('warning', confirmTitle, confirmMsg, [
      { label: 'Cancel', onPress: closeAlert, variant: 'ghost' },
      {
        label: 'Confirm', variant: 'primary',
        onPress: async () => {
          closeAlert();
          setTripActionLoading(p => ({ ...p, [tripCode]: true }));
          try {
            await b2bDriverAction(tripCode, action);
            await fetchTrips(booking?.id);
          } catch (e) {
            showAlert('error', 'Failed', e?.response?.data?.error || 'Action failed.');
          } finally {
            setTripActionLoading(p => ({ ...p, [tripCode]: false }));
          }
        },
      },
    ]);
  };

  const handleVerifyTripOtp = async (tripCode) => {
    const otp = tripOtps[tripCode] || '';
    if (!otp || otp.length < 4) {
      showAlert('warning', 'Invalid OTP', 'Please enter a valid 4-digit OTP.');
      return;
    }
    setTripActionLoading(p => ({ ...p, [tripCode]: true }));
    try {
      await b2bVerifyOtp(tripCode, otp);
      setTripOtps(p => ({ ...p, [tripCode]: '' }));
      await fetchTrips(booking?.id);
    } catch (e) {
      showAlert('error', 'OTP Failed', e?.response?.data?.error || 'Invalid OTP.');
    } finally {
      setTripActionLoading(p => ({ ...p, [tripCode]: false }));
    }
  };

  const fetchFleetAndDrivers = useCallback(async () => {
    setLoadingFleet(true);
    try {
      const [fleetRes, driverRes] = await Promise.all([
        getVendorFleet({}),
        getStaffDrivers(),
      ]);
      setFleetVehicles(Array.isArray(fleetRes) ? fleetRes : (fleetRes?.fleet || fleetRes?.vehicles || fleetRes?.data || []));
      setStaffDrivers(Array.isArray(driverRes) ? driverRes : (driverRes?.drivers || driverRes?.staff || driverRes?.data || []));
    } catch (e) {
      console.error('Failed to fetch fleet/drivers:', e);
    } finally {
      setLoadingFleet(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesListLoading(true);
    try {
      const res = await getTemplates('self-drive', { isActive: true });
      const list = Array.isArray(res) ? res : (res?.templates || []);
      setTemplates(list);
    } catch (e) {
      console.error('Failed to fetch templates:', e);
    } finally {
      setTemplatesListLoading(false);
    }
  }, []);

  const handleApplyTemplate = async (templateId) => {
    setTemplateLoading(true);
    try {
      const tpl = await getTemplateById('self-drive', templateId);
      if (tpl.kmLimitPerDay)       updateSd('kmLimitPerDay', String(tpl.kmLimitPerDay));
      if (tpl.extraKmRateHint)     updateSd('extraKmRate', String(tpl.extraKmRateHint));
      if (tpl.securityDepositHint) updateSd('securityDeposit', String(tpl.securityDepositHint));
      if (tpl.dailyRateHint) {
        setSdCommonPrice(String(Math.round(tpl.dailyRateHint * rentalDays)));
      }
      if (tpl.inclusions?.length)       setInclusions([...tpl.inclusions]);
      if (tpl.exclusions?.length)       setExclusions([...tpl.exclusions]);
      if (tpl.termsConditions?.length)  setTerms([...tpl.termsConditions]);
      setTemplateModalOpen(false);
      showAlert('success', 'Template Applied', `"${tpl.name}" has been applied to your quote.`);
    } catch (e) {
      console.error('Failed to apply template:', e);
      showAlert('error', 'Failed', 'Could not load template. Please try again.');
    } finally {
      setTemplateLoading(false);
    }
  };

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g950);
    fetchBooking(); // always fetch fresh — passedBooking is just initial state
    fetchFleetAndDrivers();
    return () => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor(C.bg);
    };
  }, [fetchBooking, fetchFleetAndDrivers]);

  // Fetch self-drive templates once booking is available and it's self-drive.
  // Deliberately keyed on booking?.id (not the whole `booking` object) so a
  // pull-to-refresh that returns a new booking reference with the same id
  // doesn't re-trigger this fetch.
  useEffect(() => {
    if (booking && isServiceSelfDrive(booking.serviceType)) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id, fetchTemplates]);

  // Set default inclusions/exclusions once booking is loaded.
  // Deliberately keyed on booking?.id — see note above.
  useEffect(() => {
    if (!booking) return;
    const sd = isServiceSelfDrive(booking.serviceType);
    setInclusions(sd ? [...DEFAULT_INCLUSIONS_SD] : [...DEFAULT_INCLUSIONS_REGULAR]);
    setExclusions(sd ? [...DEFAULT_EXCLUSIONS_SD] : [...DEFAULT_EXCLUSIONS_REGULAR]);
    setTerms(sd ? [...DEFAULT_TERMS_SD] : [...DEFAULT_TERMS_REGULAR]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  // Fetch trips whenever booking is available (trips may exist after quote confirmed)
  useEffect(() => {
    if (!booking?.id) return;
    getB2BTrips(null, { booking_id: booking.id })
      .then(res => setTrips(res.trips || []))
      .catch(e => console.error('Failed to fetch trips:', e));
  }, [booking?.id]);

  // ── Derived ─────────────────────────────────────────────────────
  const isServiceSelfDrive = (st) => {
    const s = (st || '').toLowerCase();
    return s === 'self-drive' || s === 'self_drive' || s.includes('self');
  };
  const isSelfDrive = booking ? isServiceSelfDrive(booking.serviceType) : false;
  const alreadyQuoted = !isFreshQuote && !!(booking?.vendorQuotes?.length > 0 || booking?.alreadyQuoted);
  const existingQuote = !isFreshQuote ? (booking?.vendorQuotes?.[0] || null) : null;
  const isOpenForQuotes = ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED'].includes(booking?.status);
  const tripType = (booking?.tripType || 'ONE_WAY').toUpperCase();
  const pricingFields = getPricingFields(tripType);
  const sdDetails = booking?.selfDriveDetails || {};
  const rentalDays = sdDetails.rentalDays || 1;
  const needsDelivery = sdDetails.deliveryPreference && sdDetails.deliveryPreference !== 'SELF_PICKUP';

  // ── Fleet filtering by service type ────────────────────────────
  const getFleetKeywords = (serviceType) => {
    const s = (serviceType || '').toLowerCase();
    if (s.includes('self')) return ['self-drive', 'self_drive', 'selfdrive'];
    if (s === 'bus') return ['bus'];
    if (s === 'truck') return ['truck'];
    if (s === 'bike') return ['bike'];
    if (s === 'equipment') return ['equipment'];
    if (s === 'packers') return ['packers', 'movers'];
    if (s === 'luxury') return ['luxury'];
    return ['car', 'chauffeur', 'rental']; // car/chauffeur/default
  };

  const filteredFleet = fleetVehicles.filter(v => {
    // Apply search
    if (fleetSearch.trim()) {
      const q = fleetSearch.toLowerCase();
      const name = (v.vehicleName || v.name || v.model || '').toLowerCase();
      const plate = (v.registrationNumber || v.vehicleNumber || '').toLowerCase();
      if (!name.includes(q) && !plate.includes(q)) return false;
    }
    // Service type filter
    if (booking?.serviceType) {
      const keywords = getFleetKeywords(booking.serviceType);
      const slug = (v.services?.slug || v.serviceSlug || v.serviceCategory || v.category || '').toLowerCase();
      // If no slug info, show all
      if (slug) {
        return keywords.some(kw => slug.includes(kw));
      }
    }
    return true;
  });

  // ── Price calculations ──────────────────────────────────────────
  const regularPricePerVehicle = toNum(pricing.basePrice) + toNum(pricing.driverAllowance);
  const getVehicleTotal = (v) => {
    if (v.useCustomPrice) {
      return toNum(v.cPricing?.basePrice) + toNum(v.cPricing?.driverAllowance);
    }
    return toNum(pricing.basePrice) + toNum(pricing.driverAllowance);
  };
  const regularTotal = selectedVehicles.reduce((sum, v) => sum + getVehicleTotal(v), 0);

  const sdCommonPriceNum = toNum(sdCommonPrice);
  const sdVehiclesTotal = selectedVehicles.reduce((sum, v) => {
    return sum + (toNum(v.pricePerVehicle) || sdCommonPriceNum);
  }, 0);
  const sdDelivery = needsDelivery ? toNum(sdPricing.deliveryCharges) : 0;
  const sdPickup = needsDelivery ? toNum(sdPricing.pickupCharges) : 0;
  const sdVehicleCount = selectedVehicles.length;
  const sdTotal = sdVehiclesTotal + (sdDelivery + sdPickup) * sdVehicleCount;
  const sdAdvanceAmount = Math.round(sdTotal * (toNum(sdPricing.advancePercent) / 100));

  const totalPrice = isSelfDrive ? sdTotal : regularTotal;

  // ── Vehicle handlers ────────────────────────────────────────────
  const handleAddVehicle = (vehicle) => {
    const maxVehicles = booking?.vehiclesRequired || 0;
    if (maxVehicles > 0 && selectedVehicles.length >= maxVehicles) {
      setFleetModalOpen(false);
      showAlert('warning', 'Vehicle Limit Reached',
        `This booking requires only ${maxVehicles} vehicle${maxVehicles > 1 ? 's' : ''}. You cannot add more.`);
      return;
    }
    const base = {
      fleetVehicleId: vehicle.id,
      vehicleName: [vehicle.brands?.name || vehicle.vehicle_models?.brands?.name, vehicle.vehicle_models?.name || vehicle.vehicleName || vehicle.name].filter(Boolean).join(' ') || vehicle.vehicleName || '',
      vehicleNumber: vehicle.registrationNumber || vehicle.vehicleNumber || vehicle.plateNumber || '',
    };
    if (isSelfDrive) {
      setSelectedVehicles(p => [...p, { ...base, pricePerVehicle: '' }]);
    } else {
      setSelectedVehicles(p => [...p, { ...base, driverId: null, driverName: '', driverPhone: '', useCustomPrice: false, cPricing: { basePrice: '', perKmRate: '', perHourRate: '', perDayRate: '', driverAllowance: '', nightCharges: '', extraKmCharge: '', extraHourCharge: '' } }]);
    }
    setFleetModalOpen(false);
    setFleetSearch('');
  };

  const handleRemoveVehicle = (idx) => {
    setSelectedVehicles(p => p.filter((_, i) => i !== idx));
  };

  const handleOpenDriverModal = (idx) => {
    setActiveVehicleIndex(idx);
    setDriverModalOpen(true);
  };

  const handleAssignDriver = (driver) => {
    if (activeVehicleIndex === null) return;
    setSelectedVehicles(p => {
      const updated = [...p];
      if (driver === null) {
        updated[activeVehicleIndex] = { ...updated[activeVehicleIndex], driverId: null, driverName: '', driverPhone: '' };
      } else {
        updated[activeVehicleIndex] = {
          ...updated[activeVehicleIndex],
          driverId: driver.id,
          driverName: driver.name || driver.staffName || '',
          driverPhone: driver.phone || driver.mobileNumber || '',
        };
      }
      return updated;
    });
    setDriverModalOpen(false);
    setActiveVehicleIndex(null);
  };

  const updateSdVehiclePrice = (idx, val) => {
    setSelectedVehicles(p => { const u = [...p]; u[idx] = { ...u[idx], pricePerVehicle: val }; return u; });
  };

  const toggleVehicleCustomPrice = (idx) => {
    setSelectedVehicles(p => {
      const u = [...p];
      u[idx] = { ...u[idx], useCustomPrice: !u[idx].useCustomPrice };
      return u;
    });
  };

  const updateVehicleCPricingField = (idx, field, val) => {
    setSelectedVehicles(p => {
      const u = [...p];
      u[idx] = { ...u[idx], cPricing: { ...u[idx].cPricing, [field]: val } };
      return u;
    });
  };

  // ── Inclusions / Exclusions handlers ───────────────────────────
  const addInclusion = () => {
    const v = newInclusion.trim();
    if (!v) return;
    setInclusions(p => [...p, v]);
    setNewInclusion('');
  };
  const removeInclusion = (idx) => setInclusions(p => p.filter((_, i) => i !== idx));
  const addExclusion = () => {
    const v = newExclusion.trim();
    if (!v) return;
    setExclusions(p => [...p, v]);
    setNewExclusion('');
  };
  const removeExclusion = (idx) => setExclusions(p => p.filter((_, i) => i !== idx));
  const addTerm = () => {
    const v = newTerm.trim();
    if (!v) return;
    setTerms(p => [...p, v]);
    setNewTerm('');
  };
  const removeTerm = (idx) => setTerms(p => p.filter((_, i) => i !== idx));

  // ── Validation ──────────────────────────────────────────────────
  const validateQuote = () => {
    if (selectedVehicles.length === 0) {
      showAlert('warning', 'Add Vehicles', 'Please add at least one vehicle to your quote.');
      return false;
    }
    if (!isSelfDrive) {
      if (!toNum(pricing.basePrice)) {
        showAlert('warning', 'Enter Base Price', 'Please enter a base price for the vehicles.');
        return false;
      }
      const missingDriver = selectedVehicles.find(v => !v.driverId);
      if (missingDriver) {
        showAlert('warning', 'Driver Required', `Please assign a driver to "${missingDriver.vehicleName || 'each vehicle'}". Driver is mandatory for this service type.`);
        return false;
      }
    } else {
      if (!toNum(sdCommonPrice)) {
        showAlert('warning', 'Enter Price', 'Please enter a price per vehicle in Self-Drive Pricing Details.');
        return false;
      }
      if (!toNum(sdPricing.securityDeposit)) {
        showAlert('warning', 'Security Deposit', 'Please enter a security deposit amount.');
        return false;
      }
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmitQuote = () => {
    if (!validateQuote()) return;
    showAlert('info', 'Submit Quote',
      `Submit quote for ₹${fmtPrice(totalPrice)} with ${selectedVehicles.length} vehicle(s)?`,
      [
        { label: 'Cancel', variant: 'ghost', onPress: closeAlert },
        { label: 'Submit', variant: 'primary', onPress: async () => { closeAlert(); await doSubmitQuote(); } },
      ]
    );
  };

  const doSubmitQuote = async () => {
    setSubmitting(true);
    try {
      let payload;

      if (isSelfDrive) {
        const advPct = parseFloat(sdPricing.advancePercent) || 25;
        const notesObj = {
          isSelfDriveQuote: true,
          rentalDays,
          dailyRate: Math.round(sdCommonPriceNum / rentalDays),
          pricePerVehicle: sdCommonPriceNum,
          securityDeposit: toNum(sdPricing.securityDeposit),
          kmLimitPerDay: toNum(sdPricing.kmLimitPerDay) || 200,
          extraKmRate: toNum(sdPricing.extraKmRate) || 10,
          deliveryCharges: sdDelivery,   // per vehicle amount
          pickupCharges: sdPickup,       // per vehicle amount
          advancePercent: advPct,
          advanceAmount: sdAdvanceAmount,
          validityDays: parseInt(sdPricing.validityDays) || 3,
          inclusions,
          exclusions,
          termsConditions: terms,
          vendorMessage: vendorMessage || null,
        };
        payload = {
          bookingId: booking.id,
          vehicles: selectedVehicles.map(v => ({
            vendorFleetId: v.fleetVehicleId,
            driverStaffId: null,
          })),
          pricePerVehicle: sdCommonPriceNum,
          totalPrice: sdTotal,
          vehiclePricing: selectedVehicles.map(v => ({
            vendorFleetId: v.fleetVehicleId,
            basePrice: toNum(v.pricePerVehicle) || sdCommonPriceNum,
          })),
          notes: JSON.stringify(notesObj),
        };
      } else {
        const notesObj = {
          isCarRentalQuote: true,
          serviceType: booking.serviceType,
          tripType: booking.tripType,
          pricePerVehicle: regularPricePerVehicle,
          basePrice: toNum(pricing.basePrice),
          perKmRate: toNum(pricing.perKmRate),
          perHourRate: toNum(pricing.perHourRate),
          perDayRate: toNum(pricing.perDayRate),
          driverAllowance: toNum(pricing.driverAllowance),
          nightCharges: toNum(pricing.nightCharges),
          extraKmCharge: toNum(pricing.extraKmCharge),
          extraHourCharge: toNum(pricing.extraHourCharge),
          inclusions,
          exclusions,
          termsConditions: terms,
          vendorMessage: vendorMessage || null,
        };
        payload = {
          bookingId: booking.id,
          vehicles: selectedVehicles.map(v => ({
            vendorFleetId: v.fleetVehicleId,
            driverStaffId: v.driverId || undefined,
          })),
          pricePerVehicle: regularPricePerVehicle,
          totalPrice: regularTotal,
          vehiclePricing: selectedVehicles.map(v => ({
            vendorFleetId: v.fleetVehicleId,
            basePrice: v.useCustomPrice ? toNum(v.cPricing?.basePrice) : toNum(pricing.basePrice),
            perKmRate: v.useCustomPrice ? toNum(v.cPricing?.perKmRate) : toNum(pricing.perKmRate),
            perHourRate: v.useCustomPrice ? toNum(v.cPricing?.perHourRate) : toNum(pricing.perHourRate),
            perDayRate: v.useCustomPrice ? toNum(v.cPricing?.perDayRate) : toNum(pricing.perDayRate),
            driverAllowance: v.useCustomPrice ? toNum(v.cPricing?.driverAllowance) : toNum(pricing.driverAllowance),
            nightCharges: v.useCustomPrice ? toNum(v.cPricing?.nightCharges) : toNum(pricing.nightCharges),
            extraKmCharge: v.useCustomPrice ? toNum(v.cPricing?.extraKmCharge) : toNum(pricing.extraKmCharge),
            extraHourCharge: v.useCustomPrice ? toNum(v.cPricing?.extraHourCharge) : toNum(pricing.extraHourCharge),
          })),
          notes: JSON.stringify(notesObj),
        };
      }

      await submitB2BQuote(payload);
      showAlert('success', 'Quote Submitted!',
        'Your quote has been submitted successfully. You will be notified once reviewed.',
        [{ label: 'OK', variant: 'primary', onPress: () => { closeAlert(); navigation.goBack(); } }]
      );
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to submit quote. Please try again.';
      showAlert('error', 'Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Not found ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        <LinearGradient colors={G.hero} style={s.header}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={s.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Icon name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={s.headerCenter}><Text style={s.headerTitle}>Booking Detail</Text></View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Booking Info skeleton */}
          <View style={s.card}>
            <View style={s.bookingTopRow}>
              <Bone w={40} h={40} r={12} />
              <View style={{ flex: 1 }}>
                <Bone w={110} h={14} style={{ marginBottom: 5 }} />
                <Bone w={80} h={11} />
              </View>
              <Bone w={80} h={22} r={8} />
            </View>
            <View style={s.routeRow}>
              <Bone w={8} h={8} r={4} />
              <View style={{ flex: 1 }} />
              <Bone w={8} h={8} r={4} />
            </View>
            <View style={s.infoGrid}>
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} w={90} h={26} r={8} />
              ))}
            </View>
          </View>

          {/* Pricing / quote skeleton */}
          <View style={s.card}>
            <Bone w={140} h={13} style={{ marginBottom: 12 }} />
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Bone w={110} h={12} />
                <Bone w={70} h={13} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        <LinearGradient colors={G.hero} style={s.header}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={s.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Icon name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={s.headerCenter}><Text style={s.headerTitle}>Booking Detail</Text></View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.loadingWrap}>
          <MCI name="file-alert-outline" size={56} color={C.muted} />
          <Text style={s.emptyTitle}>Booking not found</Text>
          <Text style={s.emptySub}>This booking may no longer be available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bsc = BOOKING_STATUS_CONFIG[booking.status] || { label: booking.status, bg: C.bg, text: C.sub, dot: C.muted };
  const serviceKey = (booking.serviceType || '').toLowerCase().replace(/\s/g, '-');
  const mciIcon = SERVICE_ICONS[serviceKey] || 'car';

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      {/* ── Template Selection Modal ── */}
      <Modal
        visible={templateModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setTemplateModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.templateModal}>
            <View style={s.templateModalHeader}>
              <View>
                <Text style={s.templateModalTitle}>Quick Fill with Template</Text>
                <Text style={s.templateModalSub}>Select a template to auto-fill pricing &amp; terms</Text>
              </View>
              <TouchableOpacity onPress={() => setTemplateModalOpen(false)} style={s.templateModalClose}>
                <Icon name="x" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>
            {templatesListLoading ? (
              <View style={s.templateLoadingWrap}>
                <ActivityIndicator color={C.g600} size="small" />
                <Text style={s.templateLoadingText}>Loading templates...</Text>
              </View>
            ) : templateLoading ? (
              <View style={s.templateLoadingWrap}>
                <ActivityIndicator color={C.g600} size="small" />
                <Text style={s.templateLoadingText}>Applying template...</Text>
              </View>
            ) : (
              <FlatList
                data={templates}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.templateItem}
                    onPress={() => handleApplyTemplate(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={s.templateItemLeft}>
                      <View style={s.templateIconBox}>
                        <MCI name="car-key" size={20} color={C.purple} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.templateItemName} numberOfLines={1}>{item.name}</Text>
                        <View style={s.templateItemMeta}>
                          {item.category ? (
                            <View style={s.templateCatChip}>
                              <Text style={s.templateCatText}>{item.category}</Text>
                            </View>
                          ) : null}
                          {item.dailyRateHint ? (
                            <Text style={s.templateMetaText}>₹{fmtPrice(item.dailyRateHint)}/day</Text>
                          ) : null}
                          {item.kmLimitPerDay ? (
                            <Text style={s.templateMetaText}>{item.kmLimitPerDay} km/day</Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={16} color={C.muted} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={s.templateEmpty}>
                    <MCI name="file-document-outline" size={40} color={C.muted} />
                    <Text style={s.templateEmptyText}>No templates found</Text>
                    <Text style={s.templateEmptySub}>Create templates in Self-Drive settings</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible} type={alert.type} title={alert.title}
        message={alert.message} actions={alert.actions} onClose={closeAlert}
      />

      {/* Header */}
      <LinearGradient colors={G.hero} style={s.header}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>{alreadyQuoted ? 'Booking Detail' : 'Submit Quote'}</Text>
              {booking.bookingNumber ? <Text style={s.headerSub}>#{booking.bookingNumber}</Text> : null}
            </View>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => navigation.navigate('ChatScreen', { bookingId: booking.id, customerName: 'B2B Manager', bookingNumber: booking.bookingNumber, serviceType: booking.serviceType })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="message-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}>

          {/* ── Booking Info Card ───────────────────────────────── */}
          <View style={s.card}>
            <View style={s.bookingTopRow}>
              <View style={s.serviceIconWrap}>
                <MCI name={mciIcon} size={22} color={C.g700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.serviceTypeText}>{booking.serviceType || 'B2B Booking'}</Text>
                <Text style={s.bookingNumText}>#{booking.bookingNumber || booking.id?.slice(0, 8)}</Text>
              </View>
              <View style={[s.statusChip, { backgroundColor: bsc.bg }]}>
                <View style={[s.statusDot, { backgroundColor: bsc.dot }]} />
                <Text style={[s.statusChipText, { color: bsc.text }]}>{bsc.label}</Text>
              </View>
            </View>

{/* Customer details hidden from vendor intentionally */}

            {(booking.pickupLocation || booking.dropLocation) ? (
              <View style={s.routeRow}>
                <View style={s.routeDotGreen} />
                <View style={s.routeLine} />
                <View style={[s.routeDot, { backgroundColor: C.red }]} />
                <Text style={s.routeFrom} numberOfLines={1}>
                  {booking.pickupLocation || '—'}
                </Text>
                <Text style={s.routeArrow}>→</Text>
                <Text style={s.routeTo} numberOfLines={1}>
                  {booking.dropLocation || booking.pickupLocation || '—'}
                </Text>
              </View>
            ) : null}

            <View style={s.infoGrid}>
              {booking.vehiclesRequired ? <GridItem icon="truck" label="Vehicles" value={`${booking.vehiclesRequired}`} /> : null}
              {booking.vehicleCategory ? <GridItem icon="tag" label="Vehicle Category" value={booking.vehicleCategory} /> : null}
              {booking.tripType ? <GridItem icon="navigation" label="Trip Type" value={booking.tripType} /> : null}
              {booking.passengerCount ? <GridItem icon="users" label="Pax" value={`${booking.passengerCount}`} /> : null}
              {booking.scheduledDate ? (
                <GridItem icon="calendar" label="Date" value={`${fmt(booking.scheduledDate)}${booking.scheduledTime ? ' ' + booking.scheduledTime : ''}`} />
              ) : null}
              {isSelfDrive && rentalDays ? <GridItem icon="clock" label="Rental Days" value={`${rentalDays} days`} /> : null}
            </View>

            {booking.notes ? (
              <View style={s.notesBox}>
                <Icon name="file-text" size={13} color={C.muted} />
                <Text style={s.notesText}>{booking.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* ── Already Quoted ──────────────────────────────────── */}
          {alreadyQuoted && existingQuote ? (() => {
            const qsc = { SUBMITTED: { label: 'Submitted', bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' }, UNDER_REVIEW: { label: 'Under Review', bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' }, CONFIRMED: { label: 'Confirmed', bg: '#D1FAE5', text: '#065F46', dot: '#10B981' }, REJECTED: { label: 'Rejected', bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' }, WITHDRAWN: { label: 'Withdrawn', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' } };
            const qs = qsc[existingQuote.status] || { label: existingQuote.status, bg: '#F1F5F9', text: C.sub, dot: C.muted };
            const parsedNotes = (() => { try { return existingQuote.notes ? (typeof existingQuote.notes === 'string' ? JSON.parse(existingQuote.notes) : existingQuote.notes) : null; } catch { return null; } })();
            const isSdQuote = parsedNotes?.isSelfDriveQuote === true;
            const isCarRentalQuote = parsedNotes?.isCarRentalQuote === true;
            return (
              <View style={s.quotedCard}>
                {/* Header */}
                <View style={s.quotedHeader}>
                  <View style={s.quotedIconWrap}>
                    <Icon name="check-circle" size={22} color={C.g700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.quotedTitle}>Your Quote</Text>
                    <Text style={s.quotedSub}>#{existingQuote.quoteNumber || existingQuote.id?.slice(0, 8)}</Text>
                  </View>
                  <View style={[s.qStatusChip, { backgroundColor: qs.bg }]}>
                    <View style={[s.qStatusDot, { backgroundColor: qs.dot }]} />
                    <Text style={[s.qStatusText, { color: qs.text }]}>{qs.label}</Text>
                  </View>
                </View>

                {/* Total */}
                <View style={s.quotedTotalRow}>
                  <Text style={s.quotedTotalLabel}>Total Quote Value</Text>
                  <Text style={s.quotedTotalVal}>₹{fmtPrice(existingQuote.totalPrice)}</Text>
                </View>

                {/* Self-drive pricing breakdown */}
                {isSdQuote && parsedNotes ? (
                  <View style={s.qDetailSection}>
                    <Text style={s.qDetailTitle}>Self-Drive Pricing</Text>
                    {[
                      { label: 'Daily Rate', value: parsedNotes.dailyRate ? `₹${fmtPrice(parsedNotes.dailyRate)}/day` : null },
                      { label: 'Security Deposit', value: parsedNotes.securityDeposit ? `₹${fmtPrice(parsedNotes.securityDeposit)}` : null },
                      { label: 'KM Limit', value: parsedNotes.kmLimitPerDay ? `${parsedNotes.kmLimitPerDay} km/day · ₹${parsedNotes.extraKmRate || 10}/km extra` : null },
                      { label: 'Advance', value: parsedNotes.advancePercent ? `${parsedNotes.advancePercent}% (₹${fmtPrice(parsedNotes.advanceAmount)})` : null },
                      { label: 'Delivery', value: parsedNotes.deliveryCharges ? `₹${fmtPrice(parsedNotes.deliveryCharges)}` : null },
                      { label: 'Pickup', value: parsedNotes.pickupCharges ? `₹${fmtPrice(parsedNotes.pickupCharges)}` : null },
                    ].filter(r => r.value).map((r, i) => (
                      <View key={i} style={s.qRow}>
                        <Text style={s.qRowLabel}>{r.label}</Text>
                        <Text style={s.qRowVal}>{r.value}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Car/Bus/Luxury pricing breakdown */}
                {isCarRentalQuote && parsedNotes ? (
                  <View style={s.qDetailSection}>
                    <Text style={s.qDetailTitle}>Pricing</Text>
                    {[
                      { label: 'Base Price', value: parsedNotes.basePrice },
                      { label: 'Per KM', value: parsedNotes.perKmRate },
                      { label: 'Per Hour', value: parsedNotes.perHourRate },
                      { label: 'Per Day', value: parsedNotes.perDayRate },
                      { label: 'Driver Allowance', value: parsedNotes.driverAllowance },
                      { label: 'Night Charges', value: parsedNotes.nightCharges },
                      { label: 'Extra KM', value: parsedNotes.extraKmCharge },
                      { label: 'Extra Hour', value: parsedNotes.extraHourCharge },
                    ].filter(r => r.value).map((r, i) => (
                      <View key={i} style={s.qRow}>
                        <Text style={s.qRowLabel}>{r.label}</Text>
                        <Text style={s.qRowVal}>₹{fmtPrice(r.value)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Inclusions */}
                {parsedNotes?.inclusions?.length ? (
                  <View style={s.qDetailSection}>
                    <Text style={s.qDetailTitle}>Inclusions</Text>
                    <View style={s.pillWrap}>
                      {parsedNotes.inclusions.map((inc, i) => (
                        <View key={i} style={s.greenPill}><Text style={s.greenPillText}>{inc}</Text></View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Exclusions */}
                {parsedNotes?.exclusions?.length ? (
                  <View style={s.qDetailSection}>
                    <Text style={s.qDetailTitle}>Exclusions</Text>
                    <View style={s.pillWrap}>
                      {parsedNotes.exclusions.map((exc, i) => (
                        <View key={i} style={s.redPill}><Text style={s.redPillText}>{exc}</Text></View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Terms */}
                {parsedNotes?.terms?.length ? (
                  <View style={s.qDetailSection}>
                    <Text style={s.qDetailTitle}>Terms & Conditions</Text>
                    {parsedNotes.terms.map((t, i) => (
                      <Text key={i} style={s.qTermText}>• {t}</Text>
                    ))}
                  </View>
                ) : null}

                {/* Vendor message */}
                {parsedNotes?.vendorMessage ? (
                  <View style={s.qDetailSection}>
                    <Text style={s.qDetailTitle}>Your Note</Text>
                    <Text style={s.qNoteText}>{parsedNotes.vendorMessage}</Text>
                  </View>
                ) : null}
              </View>
            );
          })() : null}

          {/* ── My Trips (shown after quote confirmed) ─────────── */}
          {trips.length > 0 ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>My Trips ({trips.length})</Text>
              {trips.map((trip, i) => {
                const ts = TRIP_STATUS_CONFIG[trip.status] || { label: trip.status, bg: C.bg, text: C.sub, dot: C.muted };
                return (
                  <View key={trip.tripCode || i} style={[s.tripCard, i > 0 && { marginTop: 10 }]}>
                    <View style={s.tripTopRow}>
                      <Text style={s.tripCodeText}>{trip.tripCode}</Text>
                      <View style={[s.tripStatusPill, { backgroundColor: ts.bg }]}>
                        <View style={[s.tripStatusDot, { backgroundColor: ts.dot }]} />
                        <Text style={[s.tripStatusText, { color: ts.text }]}>{ts.label}</Text>
                      </View>
                    </View>
                    {(trip.vehicleName || trip.vehicleNumber) ? (
                      <View style={s.tripInfoRow}>
                        <MCI name="truck-outline" size={13} color={C.muted} />
                        <Text style={s.tripInfoText} numberOfLines={1}>
                          {trip.vehicleName}{trip.vehicleNumber ? ` · ${trip.vehicleNumber}` : ''}
                        </Text>
                      </View>
                    ) : null}
                    {!isSelfDrive && trip.driverName ? (
                      <View style={s.tripInfoRow}>
                        <MCI name="account-outline" size={13} color={C.muted} />
                        <Text style={s.tripInfoText}>{trip.driverName}</Text>
                      </View>
                    ) : null}
                    {trip.scheduledDate ? (
                      <View style={s.tripInfoRow}>
                        <Icon name="calendar" size={13} color={C.muted} />
                        <Text style={s.tripInfoText}>
                          {fmt(trip.scheduledDate)}{trip.scheduledTime ? ` · ${trip.scheduledTime}` : ''}
                        </Text>
                      </View>
                    ) : null}
                    {trip.status === 'PENDING' ? (
                      <View style={s.tripStatusHint}>
                        <MCI name="clock-outline" size={13} color={C.amberDark} />
                        <Text style={s.tripStatusHintText}>Waiting for driver to arrive</Text>
                      </View>
                    ) : null}

                    {/* Self-drive trip actions */}
                    {isSelfDrive && trip.status === 'PENDING' ? (
                      <TouchableOpacity
                        style={s.tripActionBtn}
                        onPress={() => handleTripAction(trip.tripCode, 'arrive', 'Mark Arrived', 'Confirm driver has arrived at pickup location?')}
                        disabled={!!tripActionLoading[trip.tripCode]}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#0891B2', '#06B6D4']} style={s.tripActionGrad}>
                          {tripActionLoading[trip.tripCode]
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <><MCI name="map-marker-check-outline" size={16} color="#fff" /><Text style={s.tripActionText}>Mark Driver Arrived</Text></>}
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}

                    {isSelfDrive && trip.status === 'DRIVER_ARRIVED' ? (
                      <View style={s.otpSection}>
                        <TextInput
                          style={s.tripOtpInput}
                          placeholder="Enter OTP"
                          placeholderTextColor={C.muted}
                          keyboardType="numeric"
                          maxLength={4}
                          value={tripOtps[trip.tripCode] || ''}
                          onChangeText={v => setTripOtps(p => ({ ...p, [trip.tripCode]: v }))}
                        />
                        <TouchableOpacity
                          style={s.tripActionBtn}
                          onPress={() => handleVerifyTripOtp(trip.tripCode)}
                          disabled={!!tripActionLoading[trip.tripCode]}
                          activeOpacity={0.85}
                        >
                          <LinearGradient colors={['#1D4ED8', '#3B82F6']} style={s.tripActionGrad}>
                            {tripActionLoading[trip.tripCode]
                              ? <ActivityIndicator color="#fff" size="small" />
                              : <><Icon name="check-circle" size={15} color="#fff" /><Text style={s.tripActionText}>Verify OTP & Start Trip</Text></>}
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleTripAction(trip.tripCode, 'resend_otp', 'Resend OTP', 'Resend OTP to customer?')}
                          style={s.resendOtpBtn} activeOpacity={0.7}
                        >
                          <Icon name="refresh-cw" size={12} color={C.sub} />
                          <Text style={s.resendOtpText}>Resend OTP</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {isSelfDrive && trip.status === 'STARTED' ? (
                      <TouchableOpacity
                        style={s.tripActionBtn}
                        onPress={() => handleTripAction(trip.tripCode, 'end_trip', 'End Trip', 'Mark this trip as completed?')}
                        disabled={!!tripActionLoading[trip.tripCode]}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#6D28D9', '#8B5CF6']} style={s.tripActionGrad}>
                          {tripActionLoading[trip.tripCode]
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <><Icon name="check-circle" size={16} color="#fff" /><Text style={s.tripActionText}>End Trip</Text></>}
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ── Quote Form ──────────────────────────────────────── */}
          {isOpenForQuotes && !alreadyQuoted ? (
            <>
              {/* Hint */}
              {booking.vehiclesRequired ? (
                <View style={s.hintBanner}>
                  <MCI name="information-outline" size={16} color={C.blue} />
                  <Text style={s.hintText}>
                    This booking requires {booking.vehiclesRequired} vehicle{booking.vehiclesRequired > 1 ? 's' : ''}
                    {isSelfDrive ? ` (${rentalDays} day rental)` : ''}
                  </Text>
                </View>
              ) : null}

              {/* ══ NON-SELF-DRIVE: Global Pricing ══ */}
              {!isSelfDrive ? (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Pricing Details</Text>
                  <Text style={s.cardSub}>
                    These rates apply to all vehicles. You can override per-vehicle below.
                  </Text>
                  <View style={s.pricingGrid}>
                    {pricingFields.map(field => (
                      <View key={field} style={s.pricingField}>
                        <Text style={s.pricingLabel}>{PRICING_LABELS[field]}</Text>
                        <View style={s.pricingInputRow}>
                          <Text style={s.pricingPrefix}>₹</Text>
                          <TextInput
                            style={s.pricingInput}
                            placeholder="0"
                            placeholderTextColor={C.muted}
                            keyboardType="numeric"
                            value={pricing[field]}
                            onChangeText={val => updatePricing(field, val)}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                  {regularPricePerVehicle > 0 ? (
                    <View style={s.priceHintRow}>
                      <MCI name="calculator" size={14} color={C.sub} />
                      <Text style={s.priceHintText}>
                        Est. per vehicle: ₹{fmtPrice(regularPricePerVehicle)} (base + driver allowance)
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* ══ SELF-DRIVE: SD Details ══ */}
              {isSelfDrive ? (
                <View style={s.card}>
                  <View style={s.sdCardTitleRow}>
                    <Text style={s.cardTitle}>Self-Drive Pricing Details</Text>
                    <TouchableOpacity
                      style={s.templateBtn}
                      onPress={() => { fetchTemplates(); setTemplateModalOpen(true); }}
                      activeOpacity={0.8}
                    >
                      <MCI name="lightning-bolt" size={14} color={C.purple} />
                      <Text style={s.templateBtnText}>Quick Fill</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.pricingGrid}>
                    {/* Price per vehicle — common for all */}
                    <View style={[s.pricingField, { width: '100%' }]}>
                      <Text style={s.pricingLabel}>
                        Price per vehicle ({rentalDays} day{rentalDays > 1 ? 's' : ''}) *
                      </Text>
                      <View style={s.pricingInputRow}>
                        <Text style={s.pricingPrefix}>₹</Text>
                        <TextInput
                          style={s.pricingInput}
                          placeholder={`e.g. ${rentalDays * 1500}`}
                          placeholderTextColor={C.muted}
                          keyboardType="numeric"
                          value={sdCommonPrice}
                          onChangeText={setSdCommonPrice}
                        />
                      </View>
                      {toNum(sdCommonPrice) > 0 && rentalDays > 1 ? (
                        <Text style={s.sdDailyRate}>
                          ₹{fmtPrice(Math.round(toNum(sdCommonPrice) / rentalDays))}/day × {rentalDays} days
                        </Text>
                      ) : null}
                    </View>
                    <View style={s.pricingField}>
                      <Text style={s.pricingLabel}>Security Deposit (₹) *</Text>
                      <View style={s.pricingInputRow}>
                        <Text style={s.pricingPrefix}>₹</Text>
                        <TextInput
                          style={s.pricingInput}
                          placeholder="5000"
                          placeholderTextColor={C.muted}
                          keyboardType="numeric"
                          value={sdPricing.securityDeposit}
                          onChangeText={v => updateSd('securityDeposit', v)}
                        />
                      </View>
                    </View>
                    <View style={s.pricingField}>
                      <Text style={s.pricingLabel}>KM Limit / Day</Text>
                      <View style={s.pricingInputRow}>
                        <Text style={s.pricingPrefix}>km</Text>
                        <TextInput
                          style={s.pricingInput}
                          placeholder="200"
                          placeholderTextColor={C.muted}
                          keyboardType="numeric"
                          value={sdPricing.kmLimitPerDay}
                          onChangeText={v => updateSd('kmLimitPerDay', v)}
                        />
                      </View>
                    </View>
                    <View style={s.pricingField}>
                      <Text style={s.pricingLabel}>Extra KM Rate (₹)</Text>
                      <View style={s.pricingInputRow}>
                        <Text style={s.pricingPrefix}>₹</Text>
                        <TextInput
                          style={s.pricingInput}
                          placeholder="10"
                          placeholderTextColor={C.muted}
                          keyboardType="numeric"
                          value={sdPricing.extraKmRate}
                          onChangeText={v => updateSd('extraKmRate', v)}
                        />
                      </View>
                    </View>
                    {needsDelivery ? (
                      <>
                        <View style={s.pricingField}>
                          <Text style={s.pricingLabel}>Delivery Charges (₹)</Text>
                          <View style={s.pricingInputRow}>
                            <Text style={s.pricingPrefix}>₹</Text>
                            <TextInput
                              style={s.pricingInput}
                              placeholder="0"
                              placeholderTextColor={C.muted}
                              keyboardType="numeric"
                              value={sdPricing.deliveryCharges}
                              onChangeText={v => updateSd('deliveryCharges', v)}
                            />
                          </View>
                        </View>
                        <View style={s.pricingField}>
                          <Text style={s.pricingLabel}>Pickup Charges (₹)</Text>
                          <View style={s.pricingInputRow}>
                            <Text style={s.pricingPrefix}>₹</Text>
                            <TextInput
                              style={s.pricingInput}
                              placeholder="0"
                              placeholderTextColor={C.muted}
                              keyboardType="numeric"
                              value={sdPricing.pickupCharges}
                              onChangeText={v => updateSd('pickupCharges', v)}
                            />
                          </View>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {/* Advance % */}
                  <Text style={[s.pricingLabel, { marginTop: 12, marginBottom: 6 }]}>Advance Payment %</Text>
                  <View style={s.advanceRow}>
                    {ADVANCE_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.advanceChip, sdPricing.advancePercent === opt && s.advanceChipActive]}
                        onPress={() => updateSd('advancePercent', opt)}
                      >
                        <Text style={[s.advanceChipText, sdPricing.advancePercent === opt && s.advanceChipTextActive]}>
                          {opt}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Validity */}
                  <Text style={[s.pricingLabel, { marginTop: 12, marginBottom: 6 }]}>Quote Valid For (days)</Text>
                  <View style={s.advanceRow}>
                    {['1', '2', '3', '5', '7'].map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.advanceChip, sdPricing.validityDays === opt && s.advanceChipActive]}
                        onPress={() => updateSd('validityDays', opt)}
                      >
                        <Text style={[s.advanceChipText, sdPricing.validityDays === opt && s.advanceChipTextActive]}>
                          {opt}d
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* ══ Vehicle Selection ══ */}
              <View style={s.card}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.cardTitle}>
                    {isSelfDrive ? 'Select Vehicles' : 'Assign Vehicles & Drivers'}
                  </Text>
                  <TouchableOpacity style={s.addVehicleBtn} onPress={() => setFleetModalOpen(true)} activeOpacity={0.8}>
                    <Icon name="plus" size={14} color="#fff" />
                    <Text style={s.addVehicleBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {loadingFleet ? (
                  <View style={s.miniLoading}>
                    <ActivityIndicator size="small" color={C.g600} />
                    <Text style={s.miniLoadingText}>Loading fleet...</Text>
                  </View>
                ) : selectedVehicles.length === 0 ? (
                  <View style={s.noVehiclesPlaceholder}>
                    <MCI name="car-off" size={36} color={C.muted} />
                    <Text style={s.noVehiclesText}>No vehicles added yet</Text>
                    <Text style={s.noVehiclesSub}>Tap Add to pick from your fleet</Text>
                  </View>
                ) : (
                  selectedVehicles.map((sv, idx) => (
                    <View key={`sv-${idx}`} style={[s.vehicleCard, idx > 0 && { marginTop: 10 }]}>
                      <View style={s.vehicleCardHeader}>
                        <View style={s.vehicleIconWrap}>
                          <MCI name={mciIcon} size={16} color={C.g700} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.vehicleCardName} numberOfLines={1}>{sv.vehicleName || 'Vehicle'}</Text>
                          {sv.vehicleNumber ? <Text style={s.vehicleCardPlate}>{sv.vehicleNumber}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveVehicle(idx)} style={s.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <MCI name="trash-can-outline" size={18} color={C.red} />
                        </TouchableOpacity>
                      </View>

                      {/* Self-drive: per-vehicle custom price override */}
                      {isSelfDrive ? (
                        <View style={s.vehiclePriceRow}>
                          <Text style={s.vehiclePriceLabel}>
                            Custom price (optional — overrides common price)
                          </Text>
                          <View style={s.pricingInputRow}>
                            <Text style={s.pricingPrefix}>₹</Text>
                            <TextInput
                              style={s.pricingInput}
                              placeholder={sdCommonPrice ? `Common: ₹${sdCommonPrice}` : 'Leave blank to use common price'}
                              placeholderTextColor={C.muted}
                              keyboardType="numeric"
                              value={sv.pricePerVehicle}
                              onChangeText={val => updateSdVehiclePrice(idx, val)}
                            />
                          </View>
                          {!sv.pricePerVehicle && sdCommonPriceNum > 0 ? (
                            <Text style={s.sdDailyRate}>
                              Using common price: ₹{fmtPrice(sdCommonPriceNum)}
                            </Text>
                          ) : toNum(sv.pricePerVehicle) > 0 && rentalDays > 1 ? (
                            <Text style={s.sdDailyRate}>
                              ₹{fmtPrice(Math.round(toNum(sv.pricePerVehicle) / rentalDays))}/day × {rentalDays} days
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <>
                          {/* Driver assignment */}
                          <TouchableOpacity style={s.driverRow} onPress={() => handleOpenDriverModal(idx)} activeOpacity={0.75}>
                            <View style={s.driverAvatarSmall}>
                              <Icon name="user" size={12} color={sv.driverId ? C.g700 : C.muted} />
                            </View>
                            <Text style={[s.driverRowText, !sv.driverId && s.driverRowEmpty]}>
                              {sv.driverName || 'Tap to assign driver'}
                            </Text>
                            <Text style={s.changeDriverText}>{sv.driverId ? 'Change' : 'Assign'}</Text>
                          </TouchableOpacity>

                          {/* Custom price toggle */}
                          <TouchableOpacity style={s.customPriceToggle} onPress={() => toggleVehicleCustomPrice(idx)}>
                            <View style={[s.toggleBox, sv.useCustomPrice && s.toggleBoxActive]}>
                              {sv.useCustomPrice ? <Icon name="check" size={10} color="#fff" /> : null}
                            </View>
                            <Text style={s.customPriceLabel}>
                              {sv.useCustomPrice ? 'Using custom pricing ↓' : 'Set custom pricing for this vehicle'}
                            </Text>
                          </TouchableOpacity>

                          {sv.useCustomPrice ? (
                            <View style={[s.pricingGrid, { marginTop: 8 }]}>
                              {pricingFields.map(field => (
                                <View key={field} style={s.pricingField}>
                                  <Text style={s.pricingLabel}>{PRICING_LABELS[field]}</Text>
                                  <View style={s.pricingInputRow}>
                                    <Text style={s.pricingPrefix}>₹</Text>
                                    <TextInput
                                      style={s.pricingInput}
                                      placeholder="0"
                                      placeholderTextColor={C.muted}
                                      keyboardType="numeric"
                                      value={sv.cPricing?.[field] || ''}
                                      onChangeText={val => updateVehicleCPricingField(idx, field, val)}
                                    />
                                  </View>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </>
                      )}
                    </View>
                  ))
                )}
              </View>

              {/* ══ Inclusions ══ */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Inclusions</Text>
                {inclusions.map((item, idx) => (
                  <View key={idx} style={s.listItemRow}>
                    <View style={s.listBullet} />
                    <Text style={s.listItemText} numberOfLines={2}>{item}</Text>
                    <TouchableOpacity onPress={() => removeInclusion(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="x" size={14} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={s.addItemRow}>
                  <TextInput
                    style={s.addItemInput}
                    placeholder="Add inclusion..."
                    placeholderTextColor={C.muted}
                    value={newInclusion}
                    onChangeText={setNewInclusion}
                    onSubmitEditing={addInclusion}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.addItemBtn} onPress={addInclusion}>
                    <Icon name="plus" size={14} color={C.g700} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ══ Exclusions ══ */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Exclusions</Text>
                {exclusions.map((item, idx) => (
                  <View key={idx} style={s.listItemRow}>
                    <View style={[s.listBullet, { backgroundColor: C.red }]} />
                    <Text style={s.listItemText} numberOfLines={2}>{item}</Text>
                    <TouchableOpacity onPress={() => removeExclusion(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="x" size={14} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={s.addItemRow}>
                  <TextInput
                    style={s.addItemInput}
                    placeholder="Add exclusion..."
                    placeholderTextColor={C.muted}
                    value={newExclusion}
                    onChangeText={setNewExclusion}
                    onSubmitEditing={addExclusion}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.addItemBtn} onPress={addExclusion}>
                    <Icon name="plus" size={14} color={C.g700} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ══ Terms & Conditions ══ */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Terms & Conditions</Text>
                {terms.map((item, idx) => (
                  <View key={idx} style={s.listItemRow}>
                    <Text style={s.termsNum}>{idx + 1}.</Text>
                    <Text style={s.listItemText} numberOfLines={3}>{item}</Text>
                    <TouchableOpacity onPress={() => removeTerm(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="x" size={14} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={s.addItemRow}>
                  <TextInput
                    style={s.addItemInput}
                    placeholder="Add term..."
                    placeholderTextColor={C.muted}
                    value={newTerm}
                    onChangeText={setNewTerm}
                    onSubmitEditing={addTerm}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.addItemBtn} onPress={addTerm}>
                    <Icon name="plus" size={14} color={C.g700} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ══ Vendor Message ══ */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Message / Notes</Text>
                <TextInput
                  style={s.notesInput}
                  placeholder="Any special conditions or message for the manager..."
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={3}
                  value={vendorMessage}
                  onChangeText={setVendorMessage}
                  textAlignVertical="top"
                />
              </View>

              {/* ══ Quote Summary ══ */}
              {selectedVehicles.length > 0 ? (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Grand Total</Text>

                  {isSelfDrive ? (
                    <>
                      {/* Base price per vehicle */}
                      <View style={s.summaryRow}>
                        <Text style={s.summaryLabel}>
                          Base price / vehicle{rentalDays > 1 ? ` (${rentalDays} days)` : ''}
                        </Text>
                        <Text style={s.summaryVal}>₹{fmtPrice(sdCommonPriceNum)}</Text>
                      </View>

                      {/* Delivery + Pickup per vehicle (if any) */}
                      {(sdDelivery > 0 || sdPickup > 0) ? (
                        <View style={s.summaryRow}>
                          <Text style={s.summaryLabel}>Delivery + Pickup / vehicle</Text>
                          <Text style={s.summaryVal}>₹{fmtPrice(sdDelivery + sdPickup)}</Text>
                        </View>
                      ) : null}

                      {/* × vehicles */}
                      {sdVehicleCount > 1 ? (
                        <View style={s.summaryRow}>
                          <Text style={[s.summaryLabel, { color: C.sub }]}>× {sdVehicleCount} vehicles</Text>
                          <Text style={[s.summaryVal, { color: C.sub }]}></Text>
                        </View>
                      ) : null}

                      <View style={s.summaryDivider} />

                      {/* Grand Total */}
                      <View style={s.summaryTotalBox}>
                        <Text style={s.summaryTotalBoxLabel}>Grand Total</Text>
                        <Text style={s.summaryTotalVal}>₹{fmtPrice(sdTotal)}</Text>
                      </View>

                      {/* Advance */}
                      {sdAdvanceAmount > 0 ? (
                        <View style={[s.summaryRow, { marginTop: 6 }]}>
                          <Text style={[s.summaryLabel, { color: C.amber }]}>
                            Advance ({sdPricing.advancePercent}%)
                          </Text>
                          <Text style={[s.summaryVal, { color: C.amber, fontWeight: '700' }]}>
                            ₹{fmtPrice(sdAdvanceAmount)}
                          </Text>
                        </View>
                      ) : null}

                      {/* Security Deposit */}
                      {toNum(sdPricing.securityDeposit) > 0 ? (
                        <View style={s.summaryRow}>
                          <Text style={s.summaryLabel}>Security Deposit (refundable)</Text>
                          <Text style={s.summaryVal}>₹{fmtPrice(toNum(sdPricing.securityDeposit))}</Text>
                        </View>
                      ) : null}

                      {/* KM info */}
                      <View style={s.summaryKmRow}>
                        <MCI name="speedometer" size={13} color={C.muted} />
                        <Text style={s.summaryKmText}>
                          KM Limit: {sdPricing.kmLimitPerDay || 200} km/day  ·  Extra KM: ₹{sdPricing.extraKmRate || 10}/km
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Non-SD: per-vehicle rows */}
                      {selectedVehicles.map((v, i) => (
                        <View key={i} style={s.summaryVehicleRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.summaryVehicleName} numberOfLines={1}>
                              {v.vehicleName || `Vehicle ${i + 1}`}
                              {v.vehicleNumber ? ` (${v.vehicleNumber})` : ''}
                            </Text>
                            {v.driverName ? (
                              <Text style={s.summaryDriverName}>Driver: {v.driverName}</Text>
                            ) : null}
                          </View>
                          <Text style={s.summaryVehiclePrice}>₹{fmtPrice(getVehicleTotal(v))}</Text>
                        </View>
                      ))}
                      <View style={s.summaryDivider} />
                      <View style={s.summaryTotalBox}>
                        <Text style={s.summaryTotalBoxLabel}>
                          Grand Total ({selectedVehicles.length} vehicle{selectedVehicles.length > 1 ? 's' : ''})
                        </Text>
                        <Text style={s.summaryTotalVal}>₹{fmtPrice(totalPrice)}</Text>
                      </View>
                    </>
                  )}
                </View>
              ) : null}

              {/* ══ Submit Button ══ */}
              <TouchableOpacity
                onPress={handleSubmitQuote}
                disabled={submitting || selectedVehicles.length === 0}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={submitting || selectedVehicles.length === 0 ? ['#9CA3AF', '#9CA3AF'] : [C.g700, C.g800]}
                  style={s.submitBtn}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="send" size={18} color="#fff" />
                      <Text style={s.submitBtnText}>
                        Submit Quote{totalPrice > 0 ? ` — ₹${fmtPrice(totalPrice)}` : ''}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : null}

          {!isOpenForQuotes && !alreadyQuoted ? (
            <View style={s.closedCard}>
              <MCI name="lock-outline" size={32} color={C.muted} />
              <Text style={s.closedTitle}>Quotes Closed</Text>
              <Text style={s.closedSub}>This booking is no longer accepting new quotes</Text>
            </View>
          ) : null}

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Fleet Modal ──────────────────────────────────────────── */}
      <Modal visible={fleetModalOpen} animationType="slide" transparent
        onRequestClose={() => { setFleetModalOpen(false); setFleetSearch(''); }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1}
          onPress={() => { setFleetModalOpen(false); setFleetSearch(''); }} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Vehicle</Text>
            <TouchableOpacity onPress={() => { setFleetModalOpen(false); setFleetSearch(''); }}>
              <Icon name="x" size={22} color={C.text} />
            </TouchableOpacity>
          </View>
          <View style={s.searchRow}>
            <Icon name="search" size={16} color={C.muted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search vehicles..."
              placeholderTextColor={C.muted}
              value={fleetSearch}
              onChangeText={setFleetSearch}
              autoCapitalize="none"
            />
          </View>
          {filteredFleet.length === 0 ? (
            <View style={s.modalEmpty}>
              <MCI name="car-off" size={40} color={C.muted} />
              <Text style={s.modalEmptyText}>
                {fleetVehicles.length === 0 ? 'No fleet vehicles found' : 'No vehicles match your search'}
              </Text>
              {fleetVehicles.length > 0 && booking?.serviceType ? (
                <Text style={[s.modalEmptyText, { fontSize: 13, marginTop: 4 }]}>
                  Showing vehicles for: {booking.serviceType}
                </Text>
              ) : null}
            </View>
          ) : (
            <FlatList
              data={filteredFleet}
              keyExtractor={v => v.id}
              contentContainerStyle={s.modalList}
              renderItem={({ item: vehicle }) => {
                const alreadySelected = selectedVehicles.some(sv => sv.fleetVehicleId === vehicle.id);
                return (
                  <TouchableOpacity
                    style={[s.fleetItem, alreadySelected && s.fleetItemSelected]}
                    onPress={() => !alreadySelected && handleAddVehicle(vehicle)}
                    activeOpacity={alreadySelected ? 1 : 0.8}
                  >
                    <View style={[s.fleetItemIcon, alreadySelected && { backgroundColor: C.g100 }]}>
                      <MCI name={mciIcon} size={18} color={alreadySelected ? C.g700 : C.sub} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.fleetItemName, alreadySelected && { color: C.g700 }]} numberOfLines={1}>
                        {[vehicle.brands?.name || vehicle.vehicle_models?.brands?.name, vehicle.vehicle_models?.name || vehicle.vehicleName || vehicle.name].filter(Boolean).join(' ') || vehicle.vehicleName || 'Vehicle'}
                      </Text>
                      <Text style={s.fleetItemPlate} numberOfLines={1}>
                        {[vehicle.registrationNumber, vehicle.fuelType, vehicle.transmission].filter(Boolean).join(' | ') || 'No plate'}
                      </Text>
                    </View>
                    {alreadySelected ? (
                      <Icon name="check-circle" size={18} color={C.g700} />
                    ) : (
                      <Icon name="plus-circle" size={18} color={C.g600} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Driver Modal ─────────────────────────────────────────── */}
      <Modal visible={driverModalOpen} animationType="slide" transparent
        onRequestClose={() => setDriverModalOpen(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setDriverModalOpen(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Assign Driver</Text>
            <TouchableOpacity onPress={() => setDriverModalOpen(false)}>
              <Icon name="x" size={22} color={C.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: null, name: 'No Driver', phone: '' }, ...staffDrivers]}
            keyExtractor={(d, i) => d?.id || `none-${i}`}
            contentContainerStyle={s.modalList}
            renderItem={({ item: driver }) => (
              <TouchableOpacity style={s.fleetItem} onPress={() => handleAssignDriver(driver.id === null ? null : driver)} activeOpacity={0.8}>
                <View style={s.fleetItemIcon}>
                  <Icon name="user" size={18} color={driver.id ? C.sub : C.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fleetItemName}>{driver.name || driver.staffName || 'Unknown'}</Text>
                  {driver.phone ? <Text style={s.fleetItemPlate}>{driver.phone}</Text> : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    paddingBottom: 12, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: DISPLAY },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 1 },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 60 },

  /* Card */
  card: {
    backgroundColor: C.surface, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 12,
    ...cardShadow,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4, fontFamily: DISPLAY },
  cardSub: { fontSize: 13, color: C.sub, marginBottom: 12 },

  /* Loading */
  /* Trip cards (inside booking detail) */
  tripCard: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    borderWidth: 1, borderColor: C.border, padding: 12,
  },
  tripTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  tripCodeText: { fontSize: 14, fontWeight: '800', color: C.text, fontVariant: ['tabular-nums'] },
  tripStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  tripStatusDot: { width: 6, height: 6, borderRadius: 3 },
  tripStatusText: { fontSize: 12, fontWeight: '700' },
  tripInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  tripInfoText: { fontSize: 13, color: C.sub, flex: 1 },
  tripStatusHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FEF3C7' },
  tripStatusHintText: { fontSize: 13, color: C.amberDark, fontWeight: '500' },
  tripActionBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  tripActionGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11 },
  tripActionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  otpSection: { marginTop: 10, gap: 8 },
  tripOtpInput: {
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: '#06B6D4',
    paddingVertical: 10, paddingHorizontal: 14, fontSize: 22, fontWeight: '800',
    color: C.text, textAlign: 'center', letterSpacing: 8, fontFamily: 'monospace',
  },
  resendOtpBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', paddingVertical: 4 },
  resendOtpText: { fontSize: 13, color: C.sub, fontWeight: '500' },
  manageTripBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 8, paddingVertical: 8, borderRadius: 10,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  manageTripBtnText: { fontSize: 14, fontWeight: '700', color: C.g700 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 12, fontFamily: DISPLAY },
  emptySub: { fontSize: 14, color: C.sub, marginTop: 4, textAlign: 'center' },

  /* Booking Info */
  bookingTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  serviceIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g300,
    justifyContent: 'center', alignItems: 'center',
  },
  serviceTypeText: { fontSize: 15, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  bookingNumText: { fontSize: 13, color: C.muted, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 12, fontWeight: '700' },

  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  companyText: { flex: 1, fontSize: 14, color: C.sub },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10 },
  routeDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 1, height: 14, backgroundColor: C.border },
  routeFrom: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
  routeArrow: { fontSize: 13, color: C.muted },
  routeTo: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'right' },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  gridLabel: { fontSize: 12, color: C.muted },
  gridVal: { fontSize: 13, fontWeight: '600', color: C.text, marginLeft: 2 },

  notesBox: { flexDirection: 'row', gap: 6, backgroundColor: C.amberBg, borderRadius: 8, padding: 10, marginTop: 10 },
  notesText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },

  /* Info rows */
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  infoLabel: { fontSize: 13, color: C.muted, flex: 1 },
  infoVal: { fontSize: 14, fontWeight: '600', color: C.text },

  /* Already Quoted */
  quotedCard: {
    backgroundColor: C.g50, borderRadius: rs(16), borderWidth: 1, borderColor: C.g300,
    padding: 16, marginBottom: 12,
  },
  quotedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  quotedIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center',
  },
  quotedTitle: { fontSize: 15, fontWeight: '700', color: C.g700, fontFamily: DISPLAY },
  quotedSub: { fontSize: 13, color: C.g600 },
  quotedBody: { gap: 4 },
  quotedTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  quotedTotalLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  quotedTotalVal: { fontSize: 20, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  qStatusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  qStatusDot: { width: 6, height: 6, borderRadius: 3 },
  qStatusText: { fontSize: 12, fontWeight: '700' },
  qDetailSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.g100 },
  qDetailTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  qRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  qRowLabel: { fontSize: 14, color: C.sub },
  qRowVal: { fontSize: 14, fontWeight: '600', color: C.text },
  qTermText: { fontSize: 13, color: C.sub, marginBottom: 3, lineHeight: 18 },
  qNoteText: { fontSize: 14, color: C.sub, fontStyle: 'italic' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  greenPill: { backgroundColor: C.g50, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.g100 },
  greenPillText: { fontSize: 12, color: C.g700, fontWeight: '500' },
  redPill: { backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FECACA' },
  redPillText: { fontSize: 12, color: '#DC2626', fontWeight: '500' },

  /* Hint */
  hintBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.blueBg, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE',
    padding: 12, marginBottom: 12,
  },
  hintText: { flex: 1, fontSize: 14, color: '#1E40AF', fontWeight: '500' },

  /* Pricing */
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pricingField: { width: '47%' },
  pricingLabel: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 4 },
  pricingInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.bg, overflow: 'hidden' },
  pricingPrefix: { paddingHorizontal: 8, fontSize: 14, color: C.sub, fontWeight: '600', backgroundColor: '#F1F5F9', alignSelf: 'stretch', textAlignVertical: 'center', paddingVertical: 9 },
  pricingInput: { flex: 1, paddingHorizontal: 8, paddingVertical: 9, fontSize: 14, color: C.text },
  priceHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  priceHintText: { fontSize: 13, color: C.sub },

  /* Advance chips */
  advanceRow: { flexDirection: 'row', gap: 8 },
  advanceChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  advanceChipActive: { borderColor: C.g700, backgroundColor: C.g50 },
  advanceChipText: { fontSize: 14, fontWeight: '600', color: C.sub },
  advanceChipTextActive: { color: C.g700 },

  /* Section header */
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  addVehicleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.g700, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  addVehicleBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  /* Vehicle card */
  miniLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  miniLoadingText: { fontSize: 14, color: C.sub },
  noVehiclesPlaceholder: { alignItems: 'center', paddingVertical: 24 },
  noVehiclesText: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 8 },
  noVehiclesSub: { fontSize: 13, color: C.muted, marginTop: 4 },

  vehicleCard: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12 },
  vehicleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  vehicleIconWrap: { width: 36, height: 36, borderRadius: 9, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g300, justifyContent: 'center', alignItems: 'center' },
  vehicleCardName: { fontSize: 14, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  vehicleCardPlate: { fontSize: 12, color: C.muted, marginTop: 1 },
  removeBtn: { padding: 4 },

  vehiclePriceRow: { gap: 6 },
  vehiclePriceLabel: { fontSize: 13, color: C.sub, fontWeight: '600' },
  sdDailyRate: { fontSize: 12, color: C.g600, marginTop: 4, fontStyle: 'italic' },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  driverAvatarSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  driverRowText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  driverRowEmpty: { color: C.muted, fontWeight: '400' },
  changeDriverText: { fontSize: 13, color: C.g600, fontWeight: '600' },

  customPriceToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  toggleBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  toggleBoxActive: { borderColor: C.g700, backgroundColor: C.g700 },
  customPriceLabel: { fontSize: 13, color: C.sub },

  /* Inclusions / Exclusions */
  listItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  listBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.g500 },
  listItemText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 18 },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 8, paddingTop: 8 },
  addItemInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 6 },
  addItemBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g300, justifyContent: 'center', alignItems: 'center' },

  /* Notes input */
  notesInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10,
    fontSize: 14, color: C.text, minHeight: 80, backgroundColor: C.bg,
  },

  /* Summary */
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: C.sub },
  summaryVal: { fontSize: 14, fontWeight: '600', color: C.text },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  summaryTotalVal: { fontSize: 22, fontWeight: '800', color: C.g700, fontFamily: DISPLAY },
  summaryVehicleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: C.bg, paddingHorizontal: 10, marginBottom: 6 },
  summaryVehicleName: { fontSize: 14, fontWeight: '600', color: C.text },
  summaryDriverName: { fontSize: 12, color: C.muted, marginTop: 1 },
  summaryVehiclePrice: { fontSize: 14, fontWeight: '700', color: C.text, marginLeft: 8, fontFamily: DISPLAY },
  summaryTotalBox: { backgroundColor: C.g50, borderRadius: 10, borderWidth: 1, borderColor: C.g300, padding: 12 },
  summaryTotalBoxLabel: { fontSize: 13, color: C.g600, marginBottom: 2 },
  termsNum: { fontSize: 14, fontWeight: '700', color: C.g700, minWidth: 18 },

  /* Submit */
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: rs(14), paddingVertical: 15 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: DISPLAY },

  /* Closed */
  closedCard: {
    alignItems: 'center', padding: 32,
    backgroundColor: C.surface, borderRadius: rs(16), borderWidth: 1, borderColor: C.border,
    marginBottom: 12,
  },
  closedTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 10, fontFamily: DISPLAY },
  closedSub: { fontSize: 14, color: C.sub, marginTop: 4, textAlign: 'center' },

  /* Modals */
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: T.scrim },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '80%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  modalList: { paddingHorizontal: 12, paddingBottom: 40 },
  modalEmpty: { alignItems: 'center', padding: 32 },
  modalEmptyText: { fontSize: 14, color: C.muted, marginTop: 8, textAlign: 'center' },
  fleetItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 4 },
  fleetItemSelected: { backgroundColor: C.g50 },
  fleetItemIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  fleetItemName: { fontSize: 14, fontWeight: '600', color: C.text, fontFamily: DISPLAY },
  fleetItemPlate: { fontSize: 13, color: C.muted, marginTop: 1 },

  /* Grand total KM row */
  summaryKmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  summaryKmText: { fontSize: 13, color: C.muted, flex: 1 },

  /* Self-drive template */
  sdCardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  templateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.purpleBg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.purple + '40',
  },
  templateBtnText: { fontSize: 13, fontWeight: '700', color: C.purple },

  /* Template modal */
  modalOverlay: {
    flex: 1, backgroundColor: T.scrim,
    justifyContent: 'flex-end',
  },
  templateModal: {
    backgroundColor: C.surface, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '75%',
  },
  templateModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  templateModalTitle: { fontSize: 17, fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  templateModalSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  templateModalClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
  },
  templateLoadingWrap: { alignItems: 'center', padding: 40, gap: 10 },
  templateLoadingText: { fontSize: 14, color: C.sub },
  templateItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderRadius: rs(14), padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  templateItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.purpleBg, justifyContent: 'center', alignItems: 'center',
  },
  templateItemName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 5, fontFamily: DISPLAY },
  templateItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  templateCatChip: {
    backgroundColor: C.g50, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.g100,
  },
  templateCatText: { fontSize: 11, fontWeight: '700', color: C.g700 },
  templateMetaText: { fontSize: 12, color: C.muted },
  templateEmpty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  templateEmptyText: { fontSize: 15, fontWeight: '600', color: C.text, fontFamily: DISPLAY },
  templateEmptySub: { fontSize: 13, color: C.sub },
});

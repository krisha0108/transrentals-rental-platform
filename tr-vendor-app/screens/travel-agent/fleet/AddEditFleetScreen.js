// screens/travel-agent/fleet/AddEditFleetScreen.js
// REDESIGNED (v2) — premium emerald Add/Edit Vehicle form. Progress-ring header,
// self-contained rounded section cards with animated expand, unified pill inputs.
// Cover image + 4 document uploads (RC, Insurance, Fitness, Permit) with optional
// validity dates. Maps to POST /api/travel-agent/fleet or PATCH .../[id].
// NOTE: This is a UI-only redesign — all form state, handlers, payload shape and
// API calls are unchanged from the previous version.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, LayoutAnimation, UIManager, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  createTravelAgentFleetVehicle,
  updateTravelAgentFleetVehicle,
  deleteTravelAgentFleetVehicle,
  FLEET_VEHICLE_TYPE,
  FLEET_FUEL_TYPE,
  FLEET_TRANSMISSION,
} from "../../api/travelAgentClient";
import ImagePickerField from "../_shared/ImagePickerField";
import { DISPLAY } from "../_shared/typography";
import { SC as C, C as T, G } from "../_shared/theme";

// Enable smooth expand/collapse on Android (presentational only).
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
function animate() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
  );
}

// Circular completion ring for the header (SVG). Purely presentational.
function ProgressRing({ pct }) {
  // size drives the inner clearance: usable space is `size - 2*stroke`, and the
  // % label is centred in it. At 48 the label sat ~4px off the stroke; 56 opens
  // that to ~8px so it never looks stuck to the ring, even at "100%".
  const size = 56, stroke = 4.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const offset = circ * (1 - clamped / 100);
  // Outer wrapper adds breathing room around the circle so it isn't tight
  // against the header text on one side and the 16px screen margin on the
  // other. The wrapper (60px) is still shorter than the header's 66px text
  // column, so this costs no extra header height.
  return (
    <View style={styles.ringWrap}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={GOLD} strokeWidth={stroke} fill="none"
            strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
            strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <Text style={styles.ringPct}>{clamped}%</Text>
      </View>
    </View>
  );
}

// ── Premium "Deep Emerald + Champagne" palette ──────────────────────────────
// Chrome (header, primary, surfaces) uses a richer, deeper emerald with warm
// neutrals; a champagne-gold accent is reserved for the progress ring & subtle
// highlights. Per-type icon colours (blue/purple/amber…) stay semantic so the
// form still reads the same language as FleetListScreen.
// Local key names are kept so no JSX changes are needed — only the VALUES now
// come from the shared Elevate theme. NOTE: blue / emerald600 / purple / red are
// used with hex-alpha suffixes (e.g. `${C.blue}18`), so they must stay 6-digit
// hex — every theme value mapped onto them is.
// Champagne-gold — hero accent for the completion ring & fine highlights.
const GOLD = "#E4C066";
// Warm cream fill inside inputs / tiles — matched to the Add Property screen.
const FILL = "#FBF8F1";
// Deep header gradient (near-black → deep emerald).
const HEADER_GRAD = G.hero;

// Per-type icon + color (mirrors FleetListScreen so the user sees the same
// language across list and form).
const VEHICLE_TYPE_META = {
  SEDAN:           { icon: "car-sport",    color: C.blue,        label: "Sedan" },
  SUV:             { icon: "car",          color: "#C4703A",     label: "SUV" },
  MUV:             { icon: "car",          color: C.purple,      label: "MUV" },
  HATCHBACK:       { icon: "car-sport",    color: "#3FA79A",     label: "Hatch" },
  TEMPO_TRAVELLER: { icon: "bus",          color: C.amber,       label: "Tempo" },
  MINI_BUS:        { icon: "bus",          color: C.emerald600,  label: "Mini bus" },
  BUS:             { icon: "bus",          color: "#C65772",     label: "Bus" },
  LUXURY_CAR:      { icon: "diamond",      color: "#8A6DD4",     label: "Luxury" },
  BIKE:            { icon: "bicycle",      color: C.red,         label: "Bike" },
  SCOOTER:         { icon: "bicycle",      color: "#4A9DBE",     label: "Scooter" },
  CAMPER_VAN:      { icon: "trail-sign",   color: C.emerald600,  label: "Camper" },
  OTHER:           { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const FUEL_META = {
  PETROL: { icon: "flame", color: "#C4703A" },
  DIESEL: { icon: "flame", color: C.subText },
  CNG:    { icon: "leaf",  color: C.emerald600 },
  LPG:    { icon: "leaf",  color: C.emerald500 },
  EV:     { icon: "flash", color: C.amber },
  HYBRID: { icon: "swap-horizontal", color: C.blue },
  OTHER:  { icon: "ellipsis-horizontal", color: C.subText },
};

function isoOrNull(v) {
  try { return v ? new Date(v).toISOString() : null; } catch { return null; }
}
// amenities / galleryImages are stored as JSON-string arrays (LongText).
function parseArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
}
const AMENITY_PRESETS = [
  "AC", "Music System", "GPS", "First-Aid Kit", "Charging Ports",
  "Recliner Seats", "WiFi", "Water Bottles", "Curtains", "Reading Lights",
  "Pushback Seats", "LED TV",
];
function formatDate(iso) {
  try {
    return iso
      ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "";
  } catch { return ""; }
}
function daysUntil(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso) - Date.now()) / 86400000);
}

export default function AddEditFleetScreen({ navigation, route }) {
  const existing = route?.params?.vehicle || null;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState(() => ({
    vehicleName: existing?.vehicleName || "",
    vehicleType: existing?.vehicleType || "SEDAN",
    brand: existing?.brand || "",
    model: existing?.model || "",
    registrationNumber: existing?.registrationNumber || "",
    yearOfManufacture: existing?.yearOfManufacture ? String(existing.yearOfManufacture) : "",
    color: existing?.color || "",
    fuelType: existing?.fuelType || "PETROL",
    transmission: existing?.transmission || "MANUAL",
    seatingCapacity: existing?.seatingCapacity ? String(existing.seatingCapacity) : "",
    luggageCapacity: existing?.luggageCapacity ? String(existing.luggageCapacity) : "",
    chauffeurIncluded: existing?.chauffeurIncluded !== false,
    chauffeurName: existing?.chauffeurName || "",
    chauffeurPhone: existing?.chauffeurPhone || "",
    chauffeurLanguages: existing?.chauffeurLanguages || "",
    baseLocation: existing?.baseLocation || "",
    ratePerDay: existing?.ratePerDay ? String(existing.ratePerDay) : "",
    ratePerKm: existing?.ratePerKm ? String(existing.ratePerKm) : "",
    minimumBookingHours: existing?.minimumBookingHours ? String(existing.minimumBookingHours) : "",
    amenities: parseArr(existing?.amenities),
    description: existing?.description || "",
    coverImage: existing?.coverImage || null,
    galleryImages: parseArr(existing?.galleryImages),
    permitType: existing?.permitType || "",
    rcImage: existing?.rcImage || null,
    insuranceImage: existing?.insuranceImage || null,
    fitnessImage: existing?.fitnessImage || null,
    permitImage: existing?.permitImage || null,
    insuranceProvider: existing?.insuranceProvider || "",
    insuranceValidity: existing?.insuranceValidity || null,
    fitnessValidity: existing?.fitnessValidity || null,
    isActive: existing?.isActive !== false,
  }));
  const [saving, setSaving] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [customAmenity, setCustomAmenity] = useState("");
  const [expanded, setExpanded] = useState({
    images: true, vehicle: true, specs: false, chauffeur: false, pricing: false, extras: false, documents: false,
  });

  // Gentle looping float for the header's decorative bubbles (presentational).
  const blobA = useRef(new Animated.Value(0)).current;
  const blobB = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = (val, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    const a = loop(blobA, 4200);
    const b = loop(blobB, 5600);
    a.start();
    b.start();
    return () => { a.stop(); b.stop(); };
  }, [blobA, blobB]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (a) =>
    setForm((p) => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
    }));
  const addCustomAmenity = () => {
    const a = customAmenity.trim();
    if (!a) return;
    setForm((p) => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities : [...p.amenities, a] }));
    setCustomAmenity("");
  };
  const canSave = form.vehicleName.trim().length >= 2 && !saving;
  const typeMeta = VEHICLE_TYPE_META[form.vehicleType] || VEHICLE_TYPE_META.OTHER;

  const completedSections = useMemo(() => {
    let c = 0;
    if (form.coverImage) c++;
    if (form.vehicleName.trim() && form.brand.trim()) c++;
    if (form.seatingCapacity) c++;
    if (form.ratePerDay || form.ratePerKm) c++;
    if (form.rcImage || form.insuranceImage) c++;
    return c;
  }, [form]);

  const docCount = [form.rcImage, form.insuranceImage, form.fitnessImage, form.permitImage].filter(Boolean).length;
  const pct = Math.round((completedSections / 5) * 100);

  // Per-section "has meaningful data" flags — drive the green check badges on
  // each section header. Presentational only (no effect on the payload).
  const done = {
    images: !!form.coverImage,
    vehicle: !!(form.vehicleName.trim() && form.brand.trim()),
    specs: !!form.seatingCapacity,
    chauffeur: !form.chauffeurIncluded || !!form.chauffeurName.trim(),
    pricing: !!(form.ratePerDay || form.ratePerKm),
    extras: !!(form.amenities.length || form.galleryImages.length),
    documents: docCount > 0,
  };

  const save = async () => {
    if (!form.vehicleName.trim()) return Alert.alert("Required", "Vehicle name is required.");
    const payload = {
      vehicleName: form.vehicleName.trim(),
      vehicleType: form.vehicleType,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      registrationNumber: form.registrationNumber.trim().toUpperCase() || null,
      yearOfManufacture: form.yearOfManufacture ? Number(form.yearOfManufacture) : null,
      color: form.color.trim() || null,
      fuelType: form.fuelType,
      transmission: form.transmission,
      seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : null,
      luggageCapacity: form.luggageCapacity ? Number(form.luggageCapacity) : null,
      chauffeurIncluded: form.chauffeurIncluded,
      chauffeurName: form.chauffeurName.trim() || null,
      chauffeurPhone: form.chauffeurPhone.trim() || null,
      chauffeurLanguages: form.chauffeurLanguages.trim() || null,
      baseLocation: form.baseLocation.trim() || null,
      ratePerDay: form.ratePerDay ? Number(form.ratePerDay) : null,
      ratePerKm: form.ratePerKm ? Number(form.ratePerKm) : null,
      minimumBookingHours: form.minimumBookingHours ? Number(form.minimumBookingHours) : null,
      amenities: form.amenities.length ? JSON.stringify(form.amenities) : null,
      description: form.description.trim() || null,
      coverImage: form.coverImage || null,
      galleryImages: form.galleryImages.length ? JSON.stringify(form.galleryImages) : null,
      rcImage: form.rcImage || null,
      insuranceImage: form.insuranceImage || null,
      fitnessImage: form.fitnessImage || null,
      permitImage: form.permitImage || null,
      permitType: form.permitType.trim() || null,
      insuranceProvider: form.insuranceProvider.trim() || null,
      insuranceValidity: isoOrNull(form.insuranceValidity),
      fitnessValidity: isoOrNull(form.fitnessValidity),
      isActive: form.isActive,
    };
    try {
      setSaving(true);
      if (isEdit) await updateTravelAgentFleetVehicle(existing.id, payload);
      else await createTravelAgentFleetVehicle(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!isEdit) return;
    Alert.alert("Delete vehicle?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteTravelAgentFleetVehicle(existing.id); navigation.goBack(); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  // Toggle a section open/closed with a smooth layout animation.
  const toggleSection = (key) => {
    animate();
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={T.forestDark} />

      {/* ===== Gradient header with circular progress ring ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        {/* faint animated decorative bubbles for depth */}
        <Animated.View
          pointerEvents="none"
          style={[styles.headerBlobA, {
            transform: [
              { translateY: blobA.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
              { translateX: blobA.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              { scale: blobA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
            ],
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.headerBlobB, {
            transform: [
              { translateY: blobB.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
              { translateX: blobB.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
              { scale: blobB.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
            ],
          }]}
        />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {/* Single row: close · text column · ring — the compact original shape.
              The text column is a plain flex child, so the eyebrow, title and
              badge row stack one under the other sharing its left edge with no
              magic margins. Everything sits on one band, so the header stays
              short: its height is just the text column's. */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>{isEdit ? "EDITING VEHICLE" : "NEW VEHICLE"}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {isEdit ? "Edit Vehicle" : "Add Vehicle"}
              </Text>
              <View style={styles.headerBadgeRow}>
                <View style={styles.typePill}>
                  <Ionicons name={typeMeta.icon} size={11} color="#fff" />
                  <Text style={styles.typePillText}>{typeMeta.label}</Text>
                </View>
                <Text style={styles.headerSub}>{completedSections} of 5 sections</Text>
              </View>
            </View>

            <ProgressRing pct={pct} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ===== Cover image ===== */}
          <Section
            icon="image" color={C.purple}
            label="Cover image"
            sub={form.coverImage ? "Image uploaded ✓" : "No image yet"}
            step={1} done={done.images}
            open={expanded.images}
            onToggle={() => toggleSection("images")}
          >
            <ImagePickerField
              label="Vehicle photo"
              value={form.coverImage}
              onChange={(v) => update("coverImage", v)}
              folder="fleet"
              helperText="Customers see this on vehicle cards."
            />
          </Section>

          {/* ===== Vehicle details (with visual type picker) ===== */}
          <Section
            icon="car" color={C.emerald600}
            label="Vehicle details"
            sub={
              form.vehicleName
                ? `${form.vehicleName.slice(0, 30)}${form.vehicleName.length > 30 ? "…" : ""}`
                : "Name, brand, registration"
            }
            step={2} done={done.vehicle}
            open={expanded.vehicle}
            onToggle={() => toggleSection("vehicle")}
          >
            <Field label="Vehicle name *">
              <TextInput
                style={styles.input}
                placeholder="e.g. Innova Crysta - Black"
                placeholderTextColor="#A3B3C2"
                value={form.vehicleName}
                onChangeText={(v) => update("vehicleName", v)}
              />
            </Field>

            {/* Visual type picker — 3 cols */}
            <Field label="Vehicle type">
              <View style={styles.typeGrid}>
                {FLEET_VEHICLE_TYPE.map((t) => {
                  const meta = VEHICLE_TYPE_META[t] || VEHICLE_TYPE_META.OTHER;
                  const active = form.vehicleType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeTile,
                        active && { backgroundColor: `${meta.color}12`, borderColor: meta.color },
                      ]}
                      onPress={() => update("vehicleType", t)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.typeIconWrap,
                          { backgroundColor: active ? meta.color : `${meta.color}18` },
                        ]}
                      >
                        <Ionicons name={meta.icon} size={16} color={active ? "#fff" : meta.color} />
                      </View>
                      <Text style={[styles.typeLabel, active && { color: meta.color, fontWeight: "bold" }]}>
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <View style={styles.row2}>
              <Field label="Brand" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Toyota"
                  placeholderTextColor="#A3B3C2"
                  value={form.brand}
                  onChangeText={(v) => update("brand", v)}
                />
              </Field>
              <Field label="Model" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Innova"
                  placeholderTextColor="#A3B3C2"
                  value={form.model}
                  onChangeText={(v) => update("model", v)}
                />
              </Field>
            </View>

            <View style={styles.row2}>
              <Field label="Registration" style={{ flex: 1 }}>
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}18` }]}>
                    <Ionicons name="card" size={15} color={C.blue} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.iconInputField, { textTransform: "uppercase", letterSpacing: 0.6 }]}
                    placeholder="MH12AB1234"
                    placeholderTextColor="#A3B3C2"
                    autoCapitalize="characters"
                    value={form.registrationNumber}
                    onChangeText={(v) => update("registrationNumber", v.toUpperCase())}
                  />
                </View>
              </Field>
              <Field label="Year" style={{ flex: 1 }}>
                <NumberInput
                  value={form.yearOfManufacture}
                  placeholder="2022"
                  onChange={(v) => update("yearOfManufacture", v)}
                  icon="calendar" color={C.amber}
                  maxLength={4}
                />
              </Field>
            </View>

            <Field label="Color" style={{ marginBottom: 2 }}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Pearl White"
                placeholderTextColor="#A3B3C2"
                value={form.color}
                onChangeText={(v) => update("color", v)}
              />
            </Field>
          </Section>

          {/* ===== Specs (fuel / transmission / capacity) ===== */}
          <Section
            icon="cog" color={C.amber}
            label="Specs"
            sub={
              form.seatingCapacity
                ? `${form.seatingCapacity} seats · ${form.fuelType} · ${form.transmission}`
                : "Fuel, transmission, capacity"
            }
            step={3} done={done.specs}
            open={expanded.specs}
            onToggle={() => toggleSection("specs")}
          >
            <Field label="Fuel type">
              <View style={styles.specRow}>
                {FLEET_FUEL_TYPE.map((f) => {
                  const meta = FUEL_META[f] || FUEL_META.OTHER;
                  const active = form.fuelType === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.specChip,
                        active && { backgroundColor: `${meta.color}14`, borderColor: meta.color },
                      ]}
                      onPress={() => update("fuelType", f)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={meta.icon} size={13} color={active ? meta.color : C.subText} />
                      <Text style={[styles.specChipText, active && { color: meta.color, fontWeight: "bold" }]}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <Field label="Transmission">
              <View style={styles.transRow}>
                {FLEET_TRANSMISSION.map((t) => {
                  const active = form.transmission === t;
                  const color = t === "MANUAL" ? C.blue : C.purple;
                  const icon = t === "MANUAL" ? "options" : "sync";
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.transBtn,
                        active && { backgroundColor: `${color}14`, borderColor: color },
                      ]}
                      onPress={() => update("transmission", t)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={icon} size={16} color={active ? color : C.subText} />
                      <Text style={[styles.transText, active && { color, fontWeight: "bold" }]}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <View style={[styles.row2, { marginBottom: 2 }]}>
              <Field label="Seating" style={{ flex: 1, marginBottom: 0 }}>
                <NumberInput
                  value={form.seatingCapacity}
                  placeholder="7"
                  onChange={(v) => update("seatingCapacity", v)}
                  icon="people" color={C.emerald600}
                  suffix="seats"
                />
              </Field>
              <Field label="Luggage" style={{ flex: 1, marginBottom: 0 }}>
                <NumberInput
                  value={form.luggageCapacity}
                  placeholder="4"
                  onChange={(v) => update("luggageCapacity", v)}
                  icon="briefcase" color={C.purple}
                  suffix="bags"
                />
              </Field>
            </View>
          </Section>

          {/* ===== Chauffeur ===== */}
          <Section
            icon="person" color={C.blue}
            label="Chauffeur"
            sub={
              form.chauffeurIncluded
                ? form.chauffeurName
                  ? `${form.chauffeurName}${form.chauffeurPhone ? ` · ${form.chauffeurPhone}` : ""}`
                  : "Included · add driver details"
                : "Self-drive only"
            }
            step={4} done={done.chauffeur}
            open={expanded.chauffeur}
            onToggle={() => toggleSection("chauffeur")}
          >
            {/* Chauffeur included toggle */}
            <TouchableOpacity
              style={[
                styles.toggleCard,
                form.chauffeurIncluded && { borderColor: C.emerald600, backgroundColor: C.emerald50 },
              ]}
              onPress={() => update("chauffeurIncluded", !form.chauffeurIncluded)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.toggleIcon,
                  form.chauffeurIncluded ? { backgroundColor: C.emerald600 } : { backgroundColor: "#E2E8F0" },
                ]}
              >
                <Ionicons
                  name={form.chauffeurIncluded ? "checkmark" : "close"}
                  size={16}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, form.chauffeurIncluded && { color: C.emerald700 }]}>
                  Chauffeur included
                </Text>
                <Text style={styles.toggleSub}>
                  {form.chauffeurIncluded
                    ? "Driver provided with this vehicle"
                    : "Customer drives themselves"}
                </Text>
              </View>
            </TouchableOpacity>

            {form.chauffeurIncluded && (
              <>
                <Field label="Chauffeur name" style={{ marginTop: 14 }}>
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}18` }]}>
                      <Ionicons name="person" size={15} color={C.blue} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.iconInputField]}
                      placeholder="Driver's full name"
                      placeholderTextColor="#A3B3C2"
                      value={form.chauffeurName}
                      onChangeText={(v) => update("chauffeurName", v)}
                    />
                  </View>
                </Field>
                <Field label="Chauffeur phone">
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}18` }]}>
                      <Ionicons name="call" size={15} color={C.emerald600} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.iconInputField]}
                      placeholder="10-digit phone"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={form.chauffeurPhone}
                      onChangeText={(v) => update("chauffeurPhone", v.replace(/\D/g, ""))}
                    />
                  </View>
                </Field>
                <Field label="Languages spoken" style={{ marginBottom: 2 }}>
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.purple}18` }]}>
                      <Ionicons name="chatbubbles" size={15} color={C.purple} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.iconInputField]}
                      placeholder="e.g. Hindi, English, Marathi"
                      placeholderTextColor="#A3B3C2"
                      value={form.chauffeurLanguages}
                      onChangeText={(v) => update("chauffeurLanguages", v)}
                    />
                  </View>
                </Field>
              </>
            )}
          </Section>

          {/* ===== Pricing & location ===== */}
          <Section
            icon="cash" color={C.emerald600}
            label="Pricing & location"
            sub={
              form.ratePerDay || form.ratePerKm
                ? `${form.ratePerDay ? `₹${form.ratePerDay}/day` : ""}${form.ratePerDay && form.ratePerKm ? " · " : ""}${form.ratePerKm ? `₹${form.ratePerKm}/km` : ""}`
                : "Daily & per-km rates"
            }
            step={5} done={done.pricing}
            open={expanded.pricing}
            onToggle={() => toggleSection("pricing")}
          >
            <Field label="Base location">
              <View style={styles.iconInputWrap}>
                <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}18` }]}>
                  <Ionicons name="location" size={15} color={C.red} />
                </View>
                <TextInput
                  style={[styles.input, styles.iconInputField]}
                  placeholder="City where this vehicle operates"
                  placeholderTextColor="#A3B3C2"
                  value={form.baseLocation}
                  onChangeText={(v) => update("baseLocation", v)}
                />
              </View>
            </Field>

            <View style={styles.row2}>
              <Field label="Per day" style={{ flex: 1 }}>
                <View style={styles.prefixInputWrap}>
                  <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                  <TextInput
                    style={[styles.input, styles.prefixInput]}
                    placeholder="2500"
                    placeholderTextColor="#A3B3C2"
                    keyboardType="number-pad"
                    value={form.ratePerDay}
                    onChangeText={(v) => update("ratePerDay", v.replace(/[^\d.]/g, ""))}
                  />
                </View>
              </Field>
              <Field label="Per km" style={{ flex: 1 }}>
                <View style={styles.prefixInputWrap}>
                  <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                  <TextInput
                    style={[styles.input, styles.prefixInput]}
                    placeholder="12"
                    placeholderTextColor="#A3B3C2"
                    keyboardType="number-pad"
                    value={form.ratePerKm}
                    onChangeText={(v) => update("ratePerKm", v.replace(/[^\d.]/g, ""))}
                  />
                </View>
              </Field>
            </View>

            <Field label="Minimum booking">
              <NumberInput
                value={form.minimumBookingHours}
                placeholder="e.g. 4"
                onChange={(v) => update("minimumBookingHours", v)}
                icon="time" color={C.blue}
                suffix="hours"
                maxLength={3}
              />
            </Field>

            <Field label="Description" style={{ marginBottom: 2 }}>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="What customers should know — package details, restrictions…"
                placeholderTextColor="#A3B3C2"
                value={form.description}
                onChangeText={(v) => update("description", v)}
                multiline numberOfLines={3} textAlignVertical="top"
              />
            </Field>
          </Section>

          {/* ===== Amenities & gallery ===== */}
          <Section
            icon="sparkles" color={C.amber}
            label="Amenities & photos"
            sub={`${form.amenities.length} amenities · ${form.galleryImages.length} photos`}
            step={6} done={done.extras}
            open={expanded.extras}
            onToggle={() => toggleSection("extras")}
          >
            <Field label="Amenities">
              <View style={styles.amenityWrap}>
                {AMENITY_PRESETS.map((a) => {
                  const active = form.amenities.includes(a);
                  return (
                    <TouchableOpacity
                      key={a}
                      style={[styles.amenityChip, active && styles.amenityChipActive]}
                      onPress={() => toggleAmenity(a)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={active ? "checkmark-circle" : "add-circle-outline"} size={13} color={active ? C.emerald600 : C.subText} />
                      <Text style={[styles.amenityChipText, active && { color: C.emerald700, fontWeight: "bold" }]}>{a}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* custom amenities not in the preset list */}
              {form.amenities.filter((a) => !AMENITY_PRESETS.includes(a)).map((a) => (
                <View key={a} style={[styles.amenityChip, styles.amenityChipActive, { alignSelf: "flex-start", marginTop: 6 }]}>
                  <Text style={[styles.amenityChipText, { color: C.emerald700, fontWeight: "bold" }]}>{a}</Text>
                  <TouchableOpacity onPress={() => toggleAmenity(a)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="close" size={13} color={C.emerald700} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.amenityAddRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Add custom amenity"
                  placeholderTextColor="#A3B3C2"
                  value={customAmenity}
                  onChangeText={setCustomAmenity}
                  onSubmitEditing={addCustomAmenity}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.amenityAddBtn} onPress={addCustomAmenity} activeOpacity={0.85}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </Field>

            <Field label="Gallery photos" helper="Up to 8 photos shown on the vehicle page." style={{ marginBottom: 2 }}>
              <ImagePickerField
                multi
                value={form.galleryImages}
                onChange={(v) => update("galleryImages", v)}
                folder="fleet"
                max={8}
              />
            </Field>
          </Section>

          {/* ===== Documents ===== */}
          <Section
            icon="document-attach" color={C.purple}
            label="Documents"
            sub={`${docCount}/4 uploaded`}
            step={7} done={done.documents}
            open={expanded.documents}
            onToggle={() => toggleSection("documents")}
          >
            <DocCard
              icon="card" color={C.blue}
              title="RC (Registration Certificate)"
              hint="Front of RC book / smart card"
              value={form.rcImage}
              onChange={(v) => update("rcImage", v)}
            />
            <DocCard
              icon="shield-checkmark" color={C.emerald600}
              title="Insurance"
              hint={
                form.insuranceValidity
                  ? `Valid till ${formatDate(form.insuranceValidity)} · ${insExpiryLabel(form.insuranceValidity)}`
                  : "Insurance policy document"
              }
              value={form.insuranceImage}
              onChange={(v) => update("insuranceImage", v)}
              expiryStatus={insExpiryStatus(form.insuranceValidity)}
            >
              <View style={styles.row2}>
                <Field label="Provider" style={{ flex: 1, marginBottom: 0 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. ICICI Lombard"
                    placeholderTextColor="#A3B3C2"
                    value={form.insuranceProvider}
                    onChangeText={(v) => update("insuranceProvider", v)}
                  />
                </Field>
                <Field label="Valid till" style={{ flex: 1, marginBottom: 0 }}>
                  <DateBtn
                    value={formatDate(form.insuranceValidity)}
                    onPress={() => setPickerType("insuranceValidity")}
                    onClear={form.insuranceValidity ? () => update("insuranceValidity", null) : null}
                  />
                </Field>
              </View>
            </DocCard>
            <DocCard
              icon="checkmark-done-circle" color={C.amber}
              title="Fitness certificate"
              hint={
                form.fitnessValidity
                  ? `Valid till ${formatDate(form.fitnessValidity)} · ${insExpiryLabel(form.fitnessValidity)}`
                  : "Vehicle fitness document"
              }
              value={form.fitnessImage}
              onChange={(v) => update("fitnessImage", v)}
              expiryStatus={insExpiryStatus(form.fitnessValidity)}
            >
              <Field label="Valid till" style={{ marginBottom: 0 }}>
                <DateBtn
                  value={formatDate(form.fitnessValidity)}
                  onPress={() => setPickerType("fitnessValidity")}
                  onClear={form.fitnessValidity ? () => update("fitnessValidity", null) : null}
                />
              </Field>
            </DocCard>
            <DocCard
              icon="ribbon" color={C.red}
              title="Commercial permit"
              hint="Required for tourist/commercial use"
              value={form.permitImage}
              onChange={(v) => update("permitImage", v)}
              last
            >
              <Field label="Permit type" style={{ marginBottom: 0 }}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. All India Tourist Permit"
                  placeholderTextColor="#A3B3C2"
                  value={form.permitType}
                  onChangeText={(v) => update("permitType", v)}
                />
              </Field>
            </DocCard>
          </Section>

          {/* ===== Active toggle ===== */}
          <TouchableOpacity
            style={[
              styles.toggleCard,
              { marginHorizontal: 16, marginTop: 12 },
              form.isActive && { borderColor: C.emerald600, backgroundColor: C.emerald50 },
            ]}
            onPress={() => update("isActive", !form.isActive)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.toggleIcon,
                form.isActive ? { backgroundColor: C.emerald600 } : { backgroundColor: "#E2E8F0" },
              ]}
            >
              <Ionicons name={form.isActive ? "checkmark" : "close"} size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, form.isActive && { color: C.emerald700 }]}>
                Active & bookable
              </Text>
              <Text style={styles.toggleSub}>
                {form.isActive
                  ? "Vehicle appears in calendar and bookings"
                  : "Hidden — won't show in lists or quotes"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ===== Danger zone (edit only) ===== */}
          {isEdit && (
            <TouchableOpacity style={styles.dangerCard} onPress={onDelete} activeOpacity={0.85}>
              <View style={styles.dangerIcon}>
                <Ionicons name="trash" size={16} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerTitle}>Delete vehicle</Text>
                <Text style={styles.dangerSub}>Permanently remove — this cannot be undone</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.red} />
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Sticky save bar (gradient) ===== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.publishBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.publishBtnInner}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={19} color="#fff" />
                <Text style={styles.publishBtnText}>
                  {isEdit ? "Save Changes" : "Add vehicle"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date picker */}
      <DateTimePickerModal
        isVisible={!!pickerType}
        mode="date"
        date={pickerType && form[pickerType] ? new Date(form[pickerType]) : new Date()}
        onConfirm={(d) => { if (pickerType) update(pickerType, d.toISOString()); setPickerType(null); }}
        onCancel={() => setPickerType(null)}
      />
    </View>
  );
}

/* ───────── Helpers for insurance/fitness expiry status ───────── */
function insExpiryLabel(iso) {
  const days = daysUntil(iso);
  if (days === null) return "";
  if (days < 0) return `expired ${Math.abs(days)}d ago`;
  if (days < 30) return `${days}d left`;
  return "valid";
}
function insExpiryStatus(iso) {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days < 0) return "expired";
  if (days < 30) return "expiring";
  return "ok";
}

/* ───────── Sub-components ───────── */

// A self-contained rounded section card: tappable header + (when open) an
// animated body separated by a hairline divider.
function Section({ icon, color, label, sub, open, onToggle, step, done, children }) {
  return (
    <View style={[styles.section, open && [styles.sectionOpen, { borderColor: `${color}40` }]]}>
      <TouchableOpacity style={styles.sectionHead} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.sectionIconWrap}>
          <View style={[styles.sectionIcon, { backgroundColor: `${color}16` }, open && { backgroundColor: color }]}>
            <Ionicons name={icon} size={18} color={open ? "#fff" : color} />
          </View>
          {done && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sectionLabel}>{label}</Text>
          {!!sub && <Text style={styles.sectionSub} numberOfLines={1}>{sub}</Text>}
        </View>
        <View style={[styles.chevWrap, open && { backgroundColor: `${color}14` }]}>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={open ? color : C.subText} />
        </View>
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function Field({ label, helper, children, style }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

function NumberInput({ value, placeholder, onChange, icon, color, suffix, maxLength }) {
  return (
    <View style={styles.iconInputWrap}>
      <View style={[styles.iconInputIcon, { backgroundColor: `${color || C.emerald600}18` }]}>
        <Ionicons name={icon || "ellipse"} size={15} color={color || C.emerald600} />
      </View>
      <TextInput
        style={[styles.input, styles.iconInputField]}
        placeholder={placeholder}
        placeholderTextColor="#A3B3C2"
        keyboardType="number-pad"
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, ""))}
        maxLength={maxLength}
      />
      {!!suffix && (
        <View style={styles.suffixBox}>
          <Text style={styles.suffixText}>{suffix}</Text>
        </View>
      )}
    </View>
  );
}

function DateBtn({ value, onPress, onClear }) {
  return (
    <View style={styles.dateBtnWrap}>
      <TouchableOpacity style={styles.dateBtn} onPress={onPress} activeOpacity={0.7}>
        <Ionicons name="calendar" size={14} color={C.emerald600} />
        <Text style={[styles.dateBtnText, !value && { color: "#A3B3C2", fontWeight: "600" }]}>
          {value || "Pick date"}
        </Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={C.subText} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={C.subText} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// Each document gets its own bordered card with status pill (uploaded /
// expiring / expired) and optional inner fields (e.g. insurance provider).
function DocCard({ icon, color, title, hint, value, onChange, expiryStatus, children, last }) {
  const statusColor =
    expiryStatus === "expired" ? C.red :
    expiryStatus === "expiring" ? C.amber :
    expiryStatus === "ok" ? C.emerald600 : null;

  return (
    <View style={[styles.docCard, last && { marginBottom: 0 }, value && { borderColor: color, backgroundColor: `${color}0A` }]}>
      <View style={styles.docHead}>
        <View style={[styles.docIconWrap, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.docTitle, { color }]}>{title}</Text>
          <Text style={styles.docHint} numberOfLines={1}>{hint}</Text>
        </View>
        {value ? (
          statusColor ? (
            <View style={[styles.docStatusPill, { backgroundColor: `${statusColor}1A` }]}>
              <Ionicons
                name={expiryStatus === "expired" ? "alert" : expiryStatus === "expiring" ? "alert-circle" : "checkmark-circle"}
                size={11}
                color={statusColor}
              />
              <Text style={[styles.docStatusText, { color: statusColor }]}>
                {expiryStatus === "expired" ? "EXPIRED" : expiryStatus === "expiring" ? "EXPIRING" : "OK"}
              </Text>
            </View>
          ) : (
            <View style={[styles.docStatusPill, { backgroundColor: C.emerald50 }]}>
              <Ionicons name="checkmark" size={11} color={C.emerald600} />
              <Text style={[styles.docStatusText, { color: C.emerald600 }]}>UPLOADED</Text>
            </View>
          )
        ) : null}
      </View>
      <View style={{ marginTop: 12 }}>
        <ImagePickerField value={value} onChange={onChange} folder="fleet-docs" />
      </View>
      {!!children && <View style={{ marginTop: 12 }}>{children}</View>}
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: "hidden" },
  headerBlobA: {
    position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerBlobB: {
    position: "absolute", top: 30, left: -60, width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(228,192,102,0.06)",
  },
  // One band. Height = the text column's height, since the 34px button and the
  // 48px ring are both shorter than it and just centre against it.
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 16, gap: 10 },
  // No marginLeft / marginTop hacks — flex does the alignment, so the three
  // texts share one left edge and stack cleanly.
  headerTitleBlock: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  headerCircleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  // Explicit lineHeights + includeFontPadding:false give the three stacked texts
  // a predictable rhythm; without the latter Android adds its own leading and
  // the gaps drift apart from what the margins say.
  headerEyebrow: {
    fontFamily: DISPLAY, color: GOLD, fontSize: 9.5, fontWeight: "bold",
    letterSpacing: 1.4, textTransform: "uppercase",
    lineHeight: 12, includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: 20, fontWeight: "bold", color: "#fff",
    letterSpacing: 0.2, lineHeight: 23, marginTop: 3, includeFontPadding: false,
  },
  headerBadgeRow: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    gap: 7, marginTop: 9,
  },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  typePillText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold",
    letterSpacing: 0.3, includeFontPadding: false,
  },
  // Sized to match the pill's text so the two sit as siblings on one line
  // (it was 11.5 against the pill's 10.5, which read as a mismatch).
  headerSub: {
    fontFamily: DISPLAY, color: "rgba(255,255,255,0.72)", fontSize: 10,
    fontWeight: "bold", includeFontPadding: false,
  },
  // 5 (not 6) so the 56px ring + padding lands at exactly 66px — the same as the
  // header's text column, keeping the header at 98px instead of growing it.
  ringWrap: { padding: 5, alignItems: "center", justifyContent: "center" },
  // 13.5 rather than 15 so "100%" clears the 4.5px stroke on both sides
  // (inner diameter is only 39px).
  ringPct: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 13.5, fontWeight: "bold",
    letterSpacing: 0.2, includeFontPadding: false,
  },

  scroll: { paddingTop: 10, paddingBottom: 24 },

  // Section card
  section: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#0A2A21", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 2 },
    }),
  },
  sectionOpen: {
    ...Platform.select({
      ios: { shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
      android: { elevation: 5 },
    }),
  },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 13, padding: 15 },
  sectionIconWrap: { width: 42, height: 42 },
  sectionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  doneBadge: {
    position: "absolute", top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.emerald500, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.card,
  },
  sectionEyebrow: {
    fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold",
    letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 3, opacity: 0.9,
  },
  sectionLabel: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", color: C.ink, letterSpacing: 0.2 },
  sectionSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, marginTop: 3, fontWeight: "600" },
  chevWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  sectionBody: { borderTopWidth: 1, borderTopColor: C.border, padding: 16, paddingTop: 15 },

  // Field
  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 7, letterSpacing: 0.2 },
  helper: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 5, fontWeight: "600" },
  input: {
    fontFamily: DISPLAY,
    backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 15, paddingVertical: 13, fontSize: 14.5, color: C.ink, minHeight: 52,
  },
  inputMultiline: { minHeight: 96, paddingTop: 13 },
  row2: { flexDirection: "row", gap: 12 },

  // Visual type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeTile: {
    width: "31.5%",
    paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 14, backgroundColor: FILL,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", gap: 7,
  },
  typeIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontFamily: DISPLAY, fontSize: 11, color: C.text, fontWeight: "bold", textAlign: "center" },

  // Spec chip row (fuel) — compact, uniform pills that pack neatly
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border },
  specChipText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.2 },

  // Transmission row
  transRow: { flexDirection: "row", gap: 10 },
  transBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, borderRadius: 12, backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border },
  transText: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, fontWeight: "bold" },

  // ₹ prefix input (unified pill)
  prefixInputWrap: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, overflow: "hidden",
  },
  prefixBox: { paddingHorizontal: 16, justifyContent: "center", backgroundColor: C.emerald50 },
  prefixText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 16 },
  prefixInput: { flex: 1, borderWidth: 0, backgroundColor: "transparent", borderRadius: 0 },

  // Icon-prefix input (unified pill: leading tinted icon chip + borderless field)
  iconInputWrap: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, overflow: "hidden",
  },
  iconInputIcon: { width: 48, justifyContent: "center", alignItems: "center" },
  iconInputField: { flex: 1, borderWidth: 0, backgroundColor: "transparent", borderRadius: 0 },
  suffixBox: {
    paddingHorizontal: 14, justifyContent: "center",
    backgroundColor: "transparent", borderLeftWidth: 1, borderLeftColor: C.border,
  },
  suffixText: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, fontWeight: "bold" },

  // Toggle card (chauffeur included / active)
  // Unselected state is plain white; the emerald fill is applied inline only
  // when the toggle is on. (Was FILL / #FBF8F1, which read as a cream tint.)
  toggleCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  toggleIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  toggleTitle: { fontFamily: DISPLAY, fontSize: 14, color: C.text, fontWeight: "bold" },
  toggleSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },

  // Date button
  dateBtnWrap: { flex: 1 },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 12, height: 52,
  },
  dateBtnText: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, fontWeight: "bold" },

  // Document card
  docCard: {
    padding: 14, borderRadius: 16,
    backgroundColor: "#F8FAFB", borderWidth: 1.5, borderColor: C.border,
    marginBottom: 12,
  },
  docHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  docIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  docTitle: { fontFamily: DISPLAY, fontSize: 13, fontWeight: "bold", letterSpacing: 0.2 },
  docHint: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 2 },
  docStatusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  docStatusText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4 },

  // Amenities — compact, uniform tags that pack neatly across rows
  amenityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border },
  amenityChipActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  amenityChipText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.2 },
  amenityAddRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  amenityAddBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },

  // Danger zone
  dangerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: 12,
    padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.redLight, backgroundColor: "#FEF4F4",
  },
  dangerIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.redLight, alignItems: "center", justifyContent: "center" },
  dangerTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.red },
  dangerSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },

  // Bottom save bar
  bottomBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#0A2A21", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 16 },
    }),
  },
  publishBtnWrap: {
    flex: 1, borderRadius: 16, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  publishBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15.5, letterSpacing: 0.3 },
});

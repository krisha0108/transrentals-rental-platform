// screens/travel-agent/fleet/AddEditFleetScreen.js
// REDESIGNED — emerald-themed Add/Edit Vehicle form. Cover image + 4 document
// uploads (RC, Insurance, Fitness, Permit) with optional validity dates.
// Maps to POST /api/travel-agent/fleet or PATCH .../[id].
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
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

const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald500: "#10B981",
  emerald50: "#ECFDF5",
  ink: "#0F172A",
  text: "#334155",
  subText: "#64748B",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6EDF5",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  red: "#EF4444",
  redLight: "#FEE2E2",
  green: "#10B981",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
};

// Per-type icon + color (mirrors FleetListScreen so the user sees the same
// language across list and form).
const VEHICLE_TYPE_META = {
  SEDAN:           { icon: "car-sport",    color: C.blue,        label: "Sedan" },
  SUV:             { icon: "car",          color: "#F97316",     label: "SUV" },
  MUV:             { icon: "car",          color: C.purple,      label: "MUV" },
  HATCHBACK:       { icon: "car-sport",    color: "#06B6D4",     label: "Hatch" },
  TEMPO_TRAVELLER: { icon: "bus",          color: C.amber,       label: "Tempo" },
  MINI_BUS:        { icon: "bus",          color: C.emerald600,  label: "Mini bus" },
  BUS:             { icon: "bus",          color: "#EC4899",     label: "Bus" },
  LUXURY_CAR:      { icon: "diamond",      color: "#A855F7",     label: "Luxury" },
  BIKE:            { icon: "bicycle",      color: C.red,         label: "Bike" },
  SCOOTER:         { icon: "bicycle",      color: "#0EA5E9",     label: "Scooter" },
  CAMPER_VAN:      { icon: "trail-sign",   color: C.emerald600,  label: "Camper" },
  OTHER:           { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const FUEL_META = {
  PETROL: { icon: "flame", color: "#F97316" },
  DIESEL: { icon: "flame", color: "#64748B" },
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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</Text>
              <Text style={styles.headerSub}>
                {completedSections}/5 sections · {typeMeta.label}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.headerSaveBtn, !canSave && { opacity: 0.5 }]}
              onPress={save}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={C.emerald700} />
              ) : (
                <Text style={styles.headerSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Mini progress dots */}
          <View style={styles.progressRow}>
            {["Image", "Vehicle", "Specs", "Pricing", "Docs"].map((label, i) => (
              <View key={label} style={styles.progressItem}>
                <View style={[styles.progressDot, i < completedSections && styles.progressDotDone]}>
                  {i < completedSections && <Ionicons name="checkmark" size={9} color={C.emerald700} />}
                </View>
                <Text style={styles.progressLabel} numberOfLines={1}>{label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ===== Cover image ===== */}
          <SectionToggle
            icon="image" color={C.purple}
            label="Cover image"
            sub={form.coverImage ? "Image uploaded ✓" : "No image yet"}
            open={expanded.images}
            onToggle={() => setExpanded((s) => ({ ...s, images: !s.images }))}
          />
          {expanded.images && (
            <Card>
              <ImagePickerField
                label="Vehicle photo"
                value={form.coverImage}
                onChange={(v) => update("coverImage", v)}
                folder="fleet"
                helperText="Customers see this on vehicle cards."
              />
            </Card>
          )}

          {/* ===== Vehicle details (with visual type picker) ===== */}
          <SectionToggle
            icon="car" color={C.emerald600}
            label="Vehicle details"
            sub={
              form.vehicleName
                ? `${form.vehicleName.slice(0, 30)}${form.vehicleName.length > 30 ? "…" : ""}`
                : "Name, brand, registration"
            }
            open={expanded.vehicle}
            onToggle={() => setExpanded((s) => ({ ...s, vehicle: !s.vehicle }))}
          />
          {expanded.vehicle && (
            <Card>
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
                          active && { backgroundColor: `${meta.color}1A`, borderColor: meta.color },
                        ]}
                        onPress={() => update("vehicleType", t)}
                        activeOpacity={0.85}
                      >
                        <View
                          style={[
                            styles.typeIconWrap,
                            { backgroundColor: active ? meta.color : `${meta.color}22` },
                          ]}
                        >
                          <Ionicons name={meta.icon} size={15} color={active ? "#fff" : meta.color} />
                        </View>
                        <Text style={[styles.typeLabel, active && { color: meta.color, fontWeight: "800" }]}>
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
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}22` }]}>
                      <Ionicons name="card" size={14} color={C.blue} />
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

              <Field label="Color">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pearl White"
                  placeholderTextColor="#A3B3C2"
                  value={form.color}
                  onChangeText={(v) => update("color", v)}
                />
              </Field>
            </Card>
          )}

          {/* ===== Specs (fuel / transmission / capacity) ===== */}
          <SectionToggle
            icon="cog" color={C.amber}
            label="Specs"
            sub={
              form.seatingCapacity
                ? `${form.seatingCapacity} seats · ${form.fuelType} · ${form.transmission}`
                : "Fuel, transmission, capacity"
            }
            open={expanded.specs}
            onToggle={() => setExpanded((s) => ({ ...s, specs: !s.specs }))}
          />
          {expanded.specs && (
            <Card>
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
                          active && { backgroundColor: `${meta.color}1A`, borderColor: meta.color },
                        ]}
                        onPress={() => update("fuelType", f)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name={meta.icon} size={13} color={active ? meta.color : C.subText} />
                        <Text style={[styles.specChipText, active && { color: meta.color, fontWeight: "800" }]}>
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
                          active && { backgroundColor: `${color}1A`, borderColor: color },
                        ]}
                        onPress={() => update("transmission", t)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name={icon} size={16} color={active ? color : C.subText} />
                        <Text style={[styles.transText, active && { color, fontWeight: "800" }]}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>

              <View style={styles.row2}>
                <Field label="Seating" style={{ flex: 1 }}>
                  <NumberInput
                    value={form.seatingCapacity}
                    placeholder="7"
                    onChange={(v) => update("seatingCapacity", v)}
                    icon="people" color={C.emerald600}
                    suffix="seats"
                  />
                </Field>
                <Field label="Luggage" style={{ flex: 1 }}>
                  <NumberInput
                    value={form.luggageCapacity}
                    placeholder="4"
                    onChange={(v) => update("luggageCapacity", v)}
                    icon="briefcase" color={C.purple}
                    suffix="bags"
                  />
                </Field>
              </View>
            </Card>
          )}

          {/* ===== Chauffeur ===== */}
          <SectionToggle
            icon="person" color={C.blue}
            label="Chauffeur"
            sub={
              form.chauffeurIncluded
                ? form.chauffeurName
                  ? `${form.chauffeurName}${form.chauffeurPhone ? ` · ${form.chauffeurPhone}` : ""}`
                  : "Included · add driver details"
                : "Self-drive only"
            }
            open={expanded.chauffeur}
            onToggle={() => setExpanded((s) => ({ ...s, chauffeur: !s.chauffeur }))}
          />
          {expanded.chauffeur && (
            <Card>
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
                      <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}22` }]}>
                        <Ionicons name="person" size={14} color={C.blue} />
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
                      <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}22` }]}>
                        <Ionicons name="call" size={14} color={C.emerald600} />
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
                  <Field label="Languages spoken">
                    <View style={styles.iconInputWrap}>
                      <View style={[styles.iconInputIcon, { backgroundColor: `${C.purple}22` }]}>
                        <Ionicons name="chatbubbles" size={14} color={C.purple} />
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
            </Card>
          )}

          {/* ===== Pricing & location ===== */}
          <SectionToggle
            icon="cash" color={C.emerald600}
            label="Pricing & location"
            sub={
              form.ratePerDay || form.ratePerKm
                ? `${form.ratePerDay ? `₹${form.ratePerDay}/day` : ""}${form.ratePerDay && form.ratePerKm ? " · " : ""}${form.ratePerKm ? `₹${form.ratePerKm}/km` : ""}`
                : "Daily & per-km rates"
            }
            open={expanded.pricing}
            onToggle={() => setExpanded((s) => ({ ...s, pricing: !s.pricing }))}
          />
          {expanded.pricing && (
            <Card>
              <Field label="Base location">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}22` }]}>
                    <Ionicons name="location" size={14} color={C.red} />
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

              <Field label="Description">
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="What customers should know — package details, restrictions…"
                  placeholderTextColor="#A3B3C2"
                  value={form.description}
                  onChangeText={(v) => update("description", v)}
                  multiline numberOfLines={3} textAlignVertical="top"
                />
              </Field>
            </Card>
          )}

          {/* ===== Amenities & gallery ===== */}
          <SectionToggle
            icon="sparkles" color={C.amber}
            label="Amenities & photos"
            sub={`${form.amenities.length} amenities · ${form.galleryImages.length} photos`}
            open={expanded.extras}
            onToggle={() => setExpanded((s) => ({ ...s, extras: !s.extras }))}
          />
          {expanded.extras && (
            <Card>
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
                        <Text style={[styles.amenityChipText, active && { color: C.emerald700, fontWeight: "800" }]}>{a}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* custom amenities not in the preset list */}
                {form.amenities.filter((a) => !AMENITY_PRESETS.includes(a)).map((a) => (
                  <View key={a} style={[styles.amenityChip, styles.amenityChipActive, { alignSelf: "flex-start", marginTop: 6 }]}>
                    <Text style={[styles.amenityChipText, { color: C.emerald700, fontWeight: "800" }]}>{a}</Text>
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

              <Field label="Gallery photos" helper="Up to 8 photos shown on the vehicle page.">
                <ImagePickerField
                  multi
                  value={form.galleryImages}
                  onChange={(v) => update("galleryImages", v)}
                  folder="fleet"
                  max={8}
                />
              </Field>
            </Card>
          )}

          {/* ===== Documents ===== */}
          <SectionToggle
            icon="document-attach" color={C.purple}
            label="Documents"
            sub={`${docCount}/4 uploaded`}
            open={expanded.documents}
            onToggle={() => setExpanded((s) => ({ ...s, documents: !s.documents }))}
          />
          {expanded.documents && (
            <Card>
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
            </Card>
          )}

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
            <SectionToggle
              icon="alert-circle" color={C.red}
              label="Danger zone"
              sub="Delete this vehicle permanently"
              open={false}
              onToggle={onDelete}
              showChevron={false}
              actionIcon="trash"
              actionColor={C.red}
            />
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
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.publishBtnInner}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
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

function Card({ children }) { return <View style={styles.card}>{children}</View>; }

function Field({ label, helper, children, style }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

function SectionToggle({ icon, color, label, sub, open, onToggle, showChevron = true, actionIcon, actionColor }) {
  return (
    <TouchableOpacity style={styles.sectionToggle} onPress={onToggle} activeOpacity={0.85}>
      <View style={[styles.sectionToggleIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.sectionToggleText, { color }]}>{label}</Text>
        {!!sub && <Text style={styles.sectionToggleSub} numberOfLines={1}>{sub}</Text>}
      </View>
      {showChevron ? (
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={color} />
      ) : (
        <Ionicons name={actionIcon || "chevron-forward"} size={18} color={actionColor || color} />
      )}
    </TouchableOpacity>
  );
}

function NumberInput({ value, placeholder, onChange, icon, color, suffix, maxLength }) {
  return (
    <View style={styles.iconInputWrap}>
      <View style={[styles.iconInputIcon, { backgroundColor: `${color || C.emerald600}22` }]}>
        <Ionicons name={icon || "ellipse"} size={14} color={color || C.emerald600} />
      </View>
      <TextInput
        style={[
          styles.input,
          styles.iconInputField,
          suffix && { borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
        ]}
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
function DocCard({ icon, color, title, hint, value, onChange, expiryStatus, children }) {
  const statusColor =
    expiryStatus === "expired" ? C.red :
    expiryStatus === "expiring" ? C.amber :
    expiryStatus === "ok" ? C.emerald600 : null;

  return (
    <View style={[styles.docCard, value && { borderColor: color }]}>
      <View style={styles.docHead}>
        <View style={[styles.docIconWrap, { backgroundColor: `${color}1A` }]}>
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
      <View style={{ marginTop: 10 }}>
        <ImagePickerField value={value} onChange={onChange} folder="fleet-docs" />
      </View>
      {!!children && <View style={{ marginTop: 10 }}>{children}</View>}
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, minWidth: 60, alignItems: "center" },
  headerSaveText: { color: C.emerald700, fontWeight: "800", fontSize: 13 },

  // Progress dots
  progressRow: { flexDirection: "row", marginTop: 12, paddingHorizontal: 4 },
  progressItem: { flex: 1, alignItems: "center", gap: 4 },
  progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  progressDotDone: { backgroundColor: "#fff", borderColor: "#fff" },
  progressLabel: { fontSize: 9.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", letterSpacing: 0.3 },

  scroll: { paddingTop: 4, paddingBottom: 24 },

  // Section toggle
  sectionToggle: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  sectionToggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionToggleText: { fontSize: 13.5, fontWeight: "800", letterSpacing: 0.3 },
  sectionToggleSub: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },

  // Card
  card: {
    marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginTop: -1,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },

  // Field
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 },
  helper: { fontSize: 11, color: C.subText, marginTop: 4, fontWeight: "600" },
  input: {
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },
  inputMultiline: { minHeight: 80, paddingTop: 10 },
  row2: { flexDirection: "row", gap: 10 },

  // Visual type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeTile: {
    width: "31%",
    paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 12, backgroundColor: "#FAFBFC",
    borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", gap: 6,
  },
  typeIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontSize: 11, color: C.text, fontWeight: "700", textAlign: "center" },

  // Spec chip row (fuel)
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  specChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border },
  specChipText: { fontSize: 11.5, color: C.subText, fontWeight: "700" },

  // Transmission row
  transRow: { flexDirection: "row", gap: 8 },
  transBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border },
  transText: { fontSize: 12.5, color: C.subText, fontWeight: "700" },

  // ₹ prefix input
  prefixInputWrap: { flexDirection: "row", alignItems: "stretch" },
  prefixBox: {
    paddingHorizontal: 14, justifyContent: "center", backgroundColor: C.emerald50,
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
    borderWidth: 1, borderRightWidth: 0, borderColor: C.border,
  },
  prefixText: { color: C.emerald700, fontWeight: "800", fontSize: 16 },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },

  // Icon-prefix input
  iconInputWrap: { flexDirection: "row", alignItems: "stretch" },
  iconInputIcon: {
    width: 44, justifyContent: "center", alignItems: "center",
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
    borderWidth: 1, borderRightWidth: 0, borderColor: C.border,
  },
  iconInputField: {
    flex: 1, borderLeftWidth: 0,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
  },
  suffixBox: {
    paddingHorizontal: 12, justifyContent: "center", backgroundColor: "#FAFBFC",
    borderTopRightRadius: 10, borderBottomRightRadius: 10,
    borderWidth: 1, borderLeftWidth: 0, borderColor: C.border,
  },
  suffixText: { fontSize: 12, color: C.subText, fontWeight: "700" },

  // Toggle card (chauffeur included / active)
  toggleCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  toggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toggleTitle: { fontSize: 14, color: C.text, fontWeight: "800" },
  toggleSub: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },

  // Date button
  dateBtnWrap: { flex: 1 },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  dateBtnText: { flex: 1, fontSize: 13.5, color: C.ink, fontWeight: "700" },

  // Document card
  docCard: {
    padding: 12, borderRadius: 12,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
    marginBottom: 10,
  },
  docHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  docIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  docTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  docHint: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 2 },
  docStatusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  docStatusText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.4 },

  // Amenities
  amenityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  amenityChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border },
  amenityChipActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  amenityChipText: { fontSize: 11.5, color: C.subText, fontWeight: "700" },
  amenityAddRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  amenityAddBtn: { width: 46, height: 46, borderRadius: 10, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },

  // Bottom save bar
  bottomBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  publishBtnWrap: {
    flex: 1, borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});

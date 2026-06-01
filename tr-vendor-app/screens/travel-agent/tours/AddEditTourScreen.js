// screens/travel-agent/tours/AddEditTourScreen.js
// REDESIGNED — emerald-themed Add/Edit Tour form.
//
// Maps to POST /api/travel-agent/tours and PUT /api/travel-agent/tours/[id].
// Uses PUT on edit so backend auto-flips isPublic based on status.
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  createTravelAgentTour,
  replaceTravelAgentTour, // PUT — auto-flips isPublic based on status
  deleteTravelAgentTour,
  listTravelAgentCategories,
  searchTravelAgentLocations,
  listTravelAgentFleet,
  TOUR_STATUS,
  TOUR_PRICE_TYPE,
  TOUR_CANCELLATION_POLICY,
} from "../../api/travelAgentClient";
import ImagePickerField from "../_shared/ImagePickerField";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_DRAFT_KEY = "ta_tour_draft_v1"; // #6d — only used for new (un-saved) tours

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

const PRICE_TYPE_META = {
  PER_PERSON: { label: "Per person", icon: "person", color: C.blue },
  PER_GROUP:  { label: "Per group",  icon: "people", color: C.purple },
  ON_REQUEST: { label: "On request", icon: "chatbubble-ellipses", color: C.amber },
};
const CANCEL_META = {
  FLEXIBLE: { label: "Flexible", color: C.green, bg: "#D1FAE5",   desc: "Free up to 24h before" },
  MODERATE: { label: "Moderate", color: C.amber, bg: C.amberLight, desc: "Partial refund window" },
  STRICT:   { label: "Strict",   color: C.red,   bg: C.redLight,   desc: "Limited / no refund" },
};

// Parse any of: array, JSON string, or null
function toArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

export default function AddEditTourScreen({ navigation, route }) {
  const existing = route?.params?.tour || null;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState(() => ({
    title: existing?.title || "",
    destination: existing?.destination || "",
    shortDescription: existing?.shortDescription || "",
    description: existing?.description || "",
    durationDays: existing?.durationDays ? String(existing.durationDays) : "",
    durationNights: existing?.durationNights ? String(existing.durationNights) : "",
    priceType: existing?.priceType || "PER_PERSON",
    basePrice: existing?.basePrice ? String(existing.basePrice) : "",
    cancellationPolicy: existing?.cancellationPolicy || "MODERATE",
    cancellationNotes: existing?.cancellationNotes || "",
    advanceNoticeHours: existing?.advanceNoticeHours ? String(existing.advanceNoticeHours) : "24",
    status: existing?.status || "DRAFT",
    coverImage: existing?.coverImage || null,
    galleryImages: toArr(existing?.galleryImages),
    highlights: toArr(existing?.highlights),
    inclusions: toArr(existing?.inclusions),
    exclusions: toArr(existing?.exclusions),
    itinerary: toArr(existing?.itinerary),
    // Phase 9 / D
    categoryId: existing?.categoryId || null,
    categoryName: existing?.category || "",
    subCategoryId: existing?.subCategoryId || null,
    mainLocationId: existing?.mainLocationId || null,
    customPlaces: toArr(existing?.customPlaces).map((p) => (typeof p === "string" ? p : p?.name)).filter(Boolean),
    vehicleIds: toArr(existing?.vehicleIds),
    meetingPoint: existing?.meetingPoint || "",
    // #6a — pickup areas (multi-tag). Seed from existing meetingPoint if present.
    pickupAreas: toArr(existing?.pickupAreas).length
      ? toArr(existing?.pickupAreas).map((p) => (typeof p === "string" ? p : p?.name)).filter(Boolean)
      : (existing?.meetingPoint ? String(existing.meetingPoint).split(",").map((s) => s.trim()).filter(Boolean) : []),
    priceTiers: toArr(existing?.priceTiers),
    requireAdvancePayment: !!existing?.requireAdvancePayment,
    advancePaymentType: existing?.advancePaymentType || "PERCENTAGE",
    advancePaymentValue: existing?.advancePaymentValue != null ? String(existing.advancePaymentValue) : "",
    tourStartDate: existing?.tourStartDate || null,
    tourEndDate: existing?.tourEndDate || null,
    termsConditions: existing?.termsConditions || "", // #2
  }));
  const createMode = route?.params?.createMode === "QUICK" ? "QUICK" : "DETAILED"; // #6c

  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({ images: true, basics: true, catloc: false, content: false, vehicles: false, advanced: false });

  // D1/D2/D5 data
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [fleet, setFleet] = useState([]);
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState([]);
  const [locSearching, setLocSearching] = useState(false);
  const [datePicker, setDatePicker] = useState(null); // 'tourStartDate' | 'tourEndDate'
  const [draftReady, setDraftReady] = useState(isEdit); // gate autosave until restore-check done

  // #6d — restore an unsaved draft (new tours only). Edits never autosave so we
  // don't clobber a live tour with a half-finished edit.
  useEffect(() => {
    if (isEdit) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TOUR_DRAFT_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && (saved.title || saved.destination || (saved.itinerary || []).length)) {
            Alert.alert(
              "Restore draft?",
              "You have an unsaved tour draft. Continue editing it?",
              [
                { text: "Discard", style: "destructive", onPress: async () => { await AsyncStorage.removeItem(TOUR_DRAFT_KEY); setDraftReady(true); } },
                { text: "Restore", onPress: () => { setForm((f) => ({ ...f, ...saved })); setDraftReady(true); } },
              ],
              { cancelable: false },
            );
            return;
          }
        }
      } catch {}
      setDraftReady(true);
    })();
  }, [isEdit]);

  // #6d — debounced autosave of the in-progress draft.
  useEffect(() => {
    if (isEdit || !draftReady) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(TOUR_DRAFT_KEY, JSON.stringify(form)).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [form, isEdit, draftReady]);

  // Load categories + fleet once for the pickers.
  useEffect(() => {
    (async () => {
      try { setCategories(await listTravelAgentCategories()); } catch {}
      try { const d = await listTravelAgentFleet({ isActive: true }); setFleet(d?.fleets || d?.fleet || []); } catch {}
    })();
  }, []);

  // Debounced location search.
  useEffect(() => {
    const q = locQuery.trim();
    if (q.length < 2) { setLocResults([]); return; }
    let alive = true;
    setLocSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchTravelAgentLocations(q);
        if (alive) setLocResults(Array.isArray(r) ? r : r?.locations || []);
      } catch { if (alive) setLocResults([]); }
      finally { if (alive) setLocSearching(false); }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [locQuery]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canSave = form.title.trim().length >= 2 && !saving;
  const toggleVehicle = (id) =>
    setForm((p) => ({
      ...p,
      vehicleIds: p.vehicleIds.includes(id) ? p.vehicleIds.filter((x) => x !== id) : [...p.vehicleIds, id],
    }));
  const fmtD = (iso) => {
    try { return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""; }
    catch { return ""; }
  };

  const completedSections = useMemo(() => {
    let c = 0;
    if (form.coverImage) c++;
    if (form.title.trim() && form.destination.trim()) c++;
    if (form.description.trim() || form.highlights.length > 0 || form.itinerary.length > 0) c++;
    if (form.basePrice || form.priceType === "ON_REQUEST") c++;
    return c;
  }, [form]);

  const save = async ({ publish = false } = {}) => {
    if (!form.title.trim()) return Alert.alert("Required", "Title is required.");
    const resolvedStatus = publish ? "ACTIVE" : "DRAFT";

    // Shape fields to match the web editor so customer-facing pages render
    // identically regardless of which platform created the tour.
    const days = form.durationDays ? Number(form.durationDays) : 1;
    const nights = form.durationNights ? Number(form.durationNights) : 0;
    const durationLabel =
      `${days} Day${days !== 1 ? "s" : ""}` + (nights ? ` ${nights} Night${nights !== 1 ? "s" : ""}` : "");
    // Group tiers: web shape is { groupSize, price }.
    const groupTiers = (form.priceType === "PER_GROUP" ? form.priceTiers : [])
      .filter((t) => t && t.price)
      .map((t) => ({ groupSize: String(t.groupSize ?? ""), price: Number(t.price) }));
    const tierMin = groupTiers.length ? Math.min(...groupTiers.map((t) => t.price)) : null;
    const startingPrice =
      form.priceType === "PER_GROUP" ? tierMin : (form.basePrice ? Number(form.basePrice) : null);

    const payload = {
      title: form.title.trim(),
      destination: form.destination.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      description: form.description.trim() || null,
      duration: durationLabel,
      durationDays: days,
      durationNights: nights,
      priceType: form.priceType,
      basePrice: form.basePrice ? Number(form.basePrice) : null,
      startingPrice,
      cancellationPolicy: form.cancellationPolicy,
      cancellationNotes: form.cancellationNotes.trim() || null,
      advanceNoticeHours: form.advanceNoticeHours ? Number(form.advanceNoticeHours) : 24,
      coverImage: form.coverImage || null,
      galleryImages: form.galleryImages,
      highlights: form.highlights,
      inclusions: form.inclusions,
      exclusions: form.exclusions,
      itinerary: form.itinerary,
      // Phase 9 / D — backend auto-stringifies array fields (priceTiers, customPlaces, vehicleIds)
      categoryId: form.categoryId || null,
      subCategoryId: form.subCategoryId || null,
      category: form.categoryName || null,
      mainLocationId: form.mainLocationId || null,
      customPlaces: form.customPlaces.map((p) => ({ name: p })),
      vehicleIds: form.vehicleIds,
      // #6a — derive meetingPoint + pickupType from pickup areas (web parity)
      pickupAreas: form.pickupAreas,
      pickupType: form.pickupAreas.length ? "HOTEL_PICKUP" : "FIXED_POINT",
      meetingPoint: form.pickupAreas.length ? form.pickupAreas.join(", ") : (form.meetingPoint.trim() || null),
      priceTiers: groupTiers,
      requireAdvancePayment: form.requireAdvancePayment,
      advancePaymentType: form.requireAdvancePayment ? form.advancePaymentType : null,
      advancePaymentValue: form.requireAdvancePayment && form.advancePaymentValue ? Number(form.advancePaymentValue) : null,
      tourStartDate: form.tourStartDate || null,
      tourEndDate: form.tourEndDate || null,
      termsConditions: form.termsConditions.trim() || null, // #2
      createMode, // #6c
      status: resolvedStatus,
      ...(publish ? { publish: true } : {}),
    };

    try {
      setSaving(true);
      if (isEdit) await replaceTravelAgentTour(existing.id, payload);
      else await createTravelAgentTour(payload);
      if (!isEdit) { try { await AsyncStorage.removeItem(TOUR_DRAFT_KEY); } catch {} } // #6d
      update("status", resolvedStatus);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save tour");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!isEdit) return;
    Alert.alert("Delete tour?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteTravelAgentTour(existing.id); navigation.goBack(); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Gradient header */}
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
              <Text style={styles.headerTitle}>{isEdit ? "Edit Tour" : "Create New Tour"}</Text>
              <Text style={styles.headerSub}>
                {completedSections}/4 sections complete · {form.status}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.headerSaveBtn, !canSave && { opacity: 0.5 }]}
              onPress={() => save({ publish: false })}
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
            {["Images", "Basics", "Content", "Pricing"].map((label, i) => (
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

          {/* ===== Images ===== */}
          <SectionToggle
            icon="image"
            color={C.purple}
            label="Images"
            sub={`${form.coverImage ? "Cover ✓" : "No cover"} · ${form.galleryImages.length} gallery`}
            open={expanded.images}
            onToggle={() => setExpanded((s) => ({ ...s, images: !s.images }))}
          />
          {expanded.images && (
            <Card>
              <ImagePickerField
                label="Cover image"
                value={form.coverImage}
                onChange={(v) => update("coverImage", v)}
                folder="tours"
                helperText="Main image shown on tour cards & previews."
              />
              <ImagePickerField
                label="Gallery (up to 8)"
                multi
                max={8}
                value={form.galleryImages}
                onChange={(v) => update("galleryImages", v)}
                folder="tours"
              />
            </Card>
          )}

          {/* ===== Basics ===== */}
          <SectionToggle
            icon="information-circle"
            color={C.emerald600}
            label="Basics"
            sub={form.title ? `${form.title.slice(0, 30)}${form.title.length > 30 ? "…" : ""}` : "Title + location + price"}
            open={expanded.basics}
            onToggle={() => setExpanded((s) => ({ ...s, basics: !s.basics }))}
          />
          {expanded.basics && (
            <Card>
              <Field label="Title *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Manali 4N5D Honeymoon Package"
                  placeholderTextColor="#A3B3C2"
                  value={form.title}
                  onChangeText={(v) => update("title", v)}
                />
              </Field>
              <Field label="Destination">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Manali, Kullu"
                  placeholderTextColor="#A3B3C2"
                  value={form.destination}
                  onChangeText={(v) => update("destination", v)}
                />
              </Field>
              <Field label="Short description" helper={`${form.shortDescription.length}/120 — shown on cards`}>
                <TextInput
                  style={styles.input}
                  placeholder="One-line teaser"
                  placeholderTextColor="#A3B3C2"
                  value={form.shortDescription}
                  onChangeText={(v) => update("shortDescription", v)}
                  maxLength={120}
                />
              </Field>

              <View style={styles.row2}>
                <Field label="Days" style={{ flex: 1 }}>
                  <NumberInput value={form.durationDays} placeholder="4" onChange={(v) => update("durationDays", v)} icon="sunny" color={C.amber} />
                </Field>
                <Field label="Nights" style={{ flex: 1 }}>
                  <NumberInput value={form.durationNights} placeholder="3" onChange={(v) => update("durationNights", v)} icon="moon" color={C.purple} />
                </Field>
              </View>

              <Field label="Price type">
                <View style={styles.priceTypeRow}>
                  {TOUR_PRICE_TYPE.map((pt) => {
                    const meta = PRICE_TYPE_META[pt];
                    const active = form.priceType === pt;
                    return (
                      <TouchableOpacity
                        key={pt}
                        style={[
                          styles.priceTypeBtn,
                          active && { backgroundColor: `${meta.color}22`, borderColor: meta.color },
                        ]}
                        onPress={() => update("priceType", pt)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name={meta.icon} size={16} color={active ? meta.color : C.subText} />
                        <Text
                          style={[
                            styles.priceTypeText,
                            active && { color: meta.color, fontWeight: "800" },
                          ]}
                        >
                          {meta.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>

              {form.priceType !== "ON_REQUEST" && (
                <Field label="Base price">
                  <View style={styles.prefixInputWrap}>
                    <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                    <TextInput
                      style={[styles.input, styles.prefixInput]}
                      placeholder="12500"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="number-pad"
                      value={form.basePrice}
                      onChangeText={(v) => update("basePrice", v.replace(/[^\d.]/g, ""))}
                    />
                  </View>
                </Field>
              )}

              {form.priceType === "PER_GROUP" && (
                <PriceTierEditor tiers={form.priceTiers} onChange={(v) => update("priceTiers", v)} />
              )}
            </Card>
          )}

          {/* ===== Category & location (D1/D2) ===== */}
          <SectionToggle
            icon="pricetags" color={C.blue}
            label="Category & location"
            sub={form.categoryName || (form.mainLocationId ? form.destination : "Tag a category & main location")}
            open={expanded.catloc}
            onToggle={() => setExpanded((s) => ({ ...s, catloc: !s.catloc }))}
          />
          {expanded.catloc && (
            <Card>
              <Field label="Category">
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryModal(true)} activeOpacity={0.85}>
                  <Ionicons name="pricetag" size={15} color={C.blue} />
                  <Text style={[styles.pickerBtnText, !form.categoryName && { color: "#A3B3C2" }]} numberOfLines={1}>
                    {form.categoryName || "Select a category"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={C.subText} />
                </TouchableOpacity>
              </Field>

              <Field label="Main location" helper="Links the tour to a city/area for discovery.">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}22` }]}>
                    <Ionicons name="location" size={14} color={C.red} />
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                    placeholder={form.destination ? `Current: ${form.destination}` : "Type a city / area…"}
                    placeholderTextColor="#A3B3C2"
                    value={locQuery}
                    onChangeText={setLocQuery}
                  />
                </View>
                {locSearching && <Text style={styles.helper}>Searching…</Text>}
                {locResults.length > 0 && (
                  <View style={styles.locResults}>
                    {locResults.map((l) => (
                      <TouchableOpacity
                        key={l.id}
                        style={styles.locRow}
                        onPress={() => {
                          update("mainLocationId", l.id);
                          update("destination", l.name);
                          setLocQuery("");
                          setLocResults([]);
                        }}
                      >
                        <Ionicons name="location-outline" size={14} color={C.subText} />
                        <Text style={styles.locName} numberOfLines={1}>{l.name}</Text>
                        {!!l.type && <Text style={styles.locType}>{l.type}</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {!!form.mainLocationId && (
                  <View style={styles.locSelected}>
                    <Ionicons name="checkmark-circle" size={13} color={C.emerald600} />
                    <Text style={styles.locSelectedText}>Linked: {form.destination}</Text>
                    <TouchableOpacity onPress={() => update("mainLocationId", null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close-circle" size={14} color={C.subText} />
                    </TouchableOpacity>
                  </View>
                )}
              </Field>

              <TagListEditor
                label="Pickup areas / points"
                accentColor={C.red}
                icon="navigate"
                placeholder="e.g. Mall Road hotels, Bus stand"
                items={form.pickupAreas}
                onChange={(v) => update("pickupAreas", v)}
              />
            </Card>
          )}

          {/* ===== Content ===== */}
          <SectionToggle
            icon="document-text"
            color={C.blue}
            label="Content"
            sub={`${form.highlights.length}H · ${form.inclusions.length}I · ${form.exclusions.length}E · ${form.itinerary.length} days`}
            open={expanded.content}
            onToggle={() => setExpanded((s) => ({ ...s, content: !s.content }))}
          />
          {expanded.content && (
            <Card>
              <Field label="Full description">
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Detailed tour description…"
                  placeholderTextColor="#A3B3C2"
                  value={form.description}
                  onChangeText={(v) => update("description", v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Field>

              <TagListEditor
                label="Highlights"
                accentColor={C.amber}
                icon="star"
                placeholder="e.g. Rohtang Pass excursion"
                items={form.highlights}
                onChange={(v) => update("highlights", v)}
              />
              <TagListEditor
                label="Inclusions"
                accentColor={C.emerald600}
                icon="checkmark-circle"
                placeholder="e.g. Daily breakfast & dinner"
                items={form.inclusions}
                onChange={(v) => update("inclusions", v)}
              />
              <TagListEditor
                label="Exclusions"
                accentColor={C.red}
                icon="close-circle"
                placeholder="e.g. Personal expenses"
                items={form.exclusions}
                onChange={(v) => update("exclusions", v)}
              />
              <TagListEditor
                label="Places covered"
                accentColor={C.blue}
                icon="pin"
                placeholder="e.g. Solang Valley, Hadimba Temple"
                items={form.customPlaces}
                onChange={(v) => update("customPlaces", v)}
              />

              <ItineraryEditor items={form.itinerary} onChange={(v) => update("itinerary", v)} />
            </Card>
          )}

          {/* ===== Vehicles (D5) ===== */}
          <SectionToggle
            icon="car-sport" color={C.emerald600}
            label="Vehicles"
            sub={form.vehicleIds.length ? `${form.vehicleIds.length} attached` : "Attach fleet vehicles (optional)"}
            open={expanded.vehicles}
            onToggle={() => setExpanded((s) => ({ ...s, vehicles: !s.vehicles }))}
          />
          {expanded.vehicles && (
            <Card>
              {fleet.length === 0 ? (
                <Text style={styles.helper}>No vehicles in your fleet yet. Add them under Fleet.</Text>
              ) : (
                fleet.map((v) => {
                  const sel = form.vehicleIds.includes(v.id);
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vehSelRow, sel && styles.vehSelRowActive]}
                      onPress={() => toggleVehicle(v.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={sel ? "checkbox" : "square-outline"} size={20} color={sel ? C.emerald600 : C.subText} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.vehSelName} numberOfLines={1}>{v.vehicleName || "Vehicle"}</Text>
                        <Text style={styles.vehSelSub} numberOfLines={1}>
                          {[v.registrationNumber, v.seatingCapacity ? `${v.seatingCapacity} seats` : null].filter(Boolean).join(" · ") || v.vehicleType}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </Card>
          )}

          {/* ===== Advanced ===== */}
          <SectionToggle
            icon="settings"
            color={C.amber}
            label="Advanced"
            sub={`${form.cancellationPolicy} cancellation · ${form.advanceNoticeHours}h notice`}
            open={expanded.advanced}
            onToggle={() => setExpanded((s) => ({ ...s, advanced: !s.advanced }))}
          />
          {expanded.advanced && (
            <Card>
              <Field label="Cancellation policy">
                <View style={styles.cancelRow}>
                  {TOUR_CANCELLATION_POLICY.map((p) => {
                    const meta = CANCEL_META[p];
                    const active = form.cancellationPolicy === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.cancelBtn,
                          active && { backgroundColor: meta.bg, borderColor: meta.color },
                        ]}
                        onPress={() => update("cancellationPolicy", p)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.cancelLabel, active && { color: meta.color, fontWeight: "800" }]}>
                          {meta.label}
                        </Text>
                        <Text style={[styles.cancelDesc, active && { color: meta.color, opacity: 0.85 }]} numberOfLines={2}>
                          {meta.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="Cancellation notes">
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Refund timeline, exceptions…"
                  placeholderTextColor="#A3B3C2"
                  value={form.cancellationNotes}
                  onChangeText={(v) => update("cancellationNotes", v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Field>
              <Field label="Terms & conditions">
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Inclusions, exclusions, booking terms…"
                  placeholderTextColor="#A3B3C2"
                  value={form.termsConditions}
                  onChangeText={(v) => update("termsConditions", v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Field>
              <Field label="Advance notice required">
                <NumberInput
                  value={form.advanceNoticeHours}
                  placeholder="24"
                  onChange={(v) => update("advanceNoticeHours", v)}
                  icon="time"
                  color={C.blue}
                  suffix="hrs"
                />
              </Field>

              {/* Advance payment (D6) */}
              <Field label="Advance payment">
                <TouchableOpacity
                  style={[styles.checkRow, form.requireAdvancePayment && styles.checkRowActive]}
                  onPress={() => update("requireAdvancePayment", !form.requireAdvancePayment)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={form.requireAdvancePayment ? "checkbox" : "square-outline"} size={20} color={form.requireAdvancePayment ? C.emerald600 : C.subText} />
                  <Text style={[styles.checkRowText, form.requireAdvancePayment && { color: C.emerald700 }]}>
                    Collect an advance to confirm booking
                  </Text>
                </TouchableOpacity>
              </Field>
              {form.requireAdvancePayment && (
                <View style={styles.row2}>
                  <Field label="Type" style={{ flex: 1 }}>
                    <View style={styles.segRow}>
                      {[["PERCENTAGE", "%"], ["FIXED", "₹"]].map(([t, sym]) => (
                        <TouchableOpacity key={t} style={[styles.segBtn, form.advancePaymentType === t && styles.segBtnActive]} onPress={() => update("advancePaymentType", t)}>
                          <Text style={[styles.segText, form.advancePaymentType === t && styles.segTextActive]}>{sym}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Field>
                  <Field label="Value" style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder={form.advancePaymentType === "PERCENTAGE" ? "e.g. 30" : "e.g. 5000"}
                      placeholderTextColor="#A3B3C2"
                      value={form.advancePaymentValue}
                      onChangeText={(v) => update("advancePaymentValue", v.replace(/[^0-9]/g, ""))}
                    />
                  </Field>
                </View>
              )}

              {/* Fixed tour dates (D6) */}
              <View style={styles.row2}>
                <Field label="Fixed start (optional)" style={{ flex: 1 }}>
                  <DateBtn value={fmtD(form.tourStartDate)} onPress={() => setDatePicker("tourStartDate")} onClear={form.tourStartDate ? () => update("tourStartDate", null) : null} />
                </Field>
                <Field label="Fixed end (optional)" style={{ flex: 1 }}>
                  <DateBtn value={fmtD(form.tourEndDate)} onPress={() => setDatePicker("tourEndDate")} onClear={form.tourEndDate ? () => update("tourEndDate", null) : null} />
                </Field>
              </View>
            </Card>
          )}

          {/* ===== Delete (edit mode only) ===== */}
          {isEdit && (
            <>
              <SectionToggle
                icon="alert-circle"
                color={C.red}
                label="Danger zone"
                sub="Delete this tour permanently"
                open={false}
                onToggle={onDelete}
                showChevron={false}
                actionIcon="trash"
                actionColor={C.red}
              />
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky dual-action bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.draftBtn, !canSave && { opacity: 0.4 }]}
          onPress={() => save({ publish: false })}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Ionicons name="save-outline" size={16} color={C.emerald600} />
          <Text style={styles.draftBtnText}>Save as draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={() => save({ publish: true })}
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
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.publishBtnText}>Publish Tour</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Category picker modal (D1) */}
      <CategoryModal
        visible={showCategoryModal}
        categories={categories}
        selectedId={form.categoryId}
        onClose={() => setShowCategoryModal(false)}
        onSelect={(cat, sub) => {
          update("categoryId", sub ? cat.id : cat.id);
          update("subCategoryId", sub ? sub.id : null);
          update("categoryName", sub ? `${cat.name} · ${sub.name}` : cat.name);
          setShowCategoryModal(false);
        }}
      />

      {/* Fixed-date picker (D6) */}
      <DateTimePickerModal
        isVisible={!!datePicker}
        mode="date"
        date={datePicker && form[datePicker] ? new Date(form[datePicker]) : new Date()}
        onConfirm={(d) => { if (datePicker) update(datePicker, d.toISOString()); setDatePicker(null); }}
        onCancel={() => setDatePicker(null)}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function CategoryModal({ visible, categories, selectedId, onClose, onSelect }) {
  if (!visible) return null;
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select category</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 460 }}>
          {(!categories || categories.length === 0) ? (
            <Text style={styles.helper}>No categories available.</Text>
          ) : (
            categories.map((cat) => (
              <View key={cat.id} style={{ marginBottom: 6 }}>
                <TouchableOpacity
                  style={[styles.catRow, cat.id === selectedId && styles.catRowActive]}
                  onPress={() => onSelect(cat, null)}
                >
                  <Ionicons name="pricetag" size={15} color={C.blue} />
                  <Text style={styles.catRowText}>{cat.name}</Text>
                  {cat.id === selectedId && <Ionicons name="checkmark-circle" size={18} color={C.emerald600} />}
                </TouchableOpacity>
                {Array.isArray(cat.subCategories) && cat.subCategories.map((sub) => (
                  <TouchableOpacity key={sub.id} style={styles.subCatRow} onPress={() => onSelect(cat, sub)}>
                    <Ionicons name="return-down-forward" size={13} color={C.subText} />
                    <Text style={styles.subCatText}>{sub.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function DateBtn({ value, onPress, onClear }) {
  return (
    <TouchableOpacity style={styles.dateBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="calendar" size={14} color={C.emerald600} />
      <Text style={[styles.dateBtnText, !value && { color: "#A3B3C2", fontWeight: "600" }]}>{value || "Pick date"}</Text>
      {onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color={C.subText} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-down" size={14} color={C.subText} />
      )}
    </TouchableOpacity>
  );
}

function PriceTierEditor({ tiers, onChange }) {
  const add = () => onChange([...(tiers || []), { groupSize: "", price: "" }]);
  const upd = (i, k, v) => {
    const next = tiers.slice();
    next[i] = { ...next[i], [k]: v.replace(/[^0-9]/g, "") };
    onChange(next);
  };
  const remove = (i) => { const next = tiers.slice(); next.splice(i, 1); onChange(next); };
  return (
    <View style={styles.field}>
      <View style={styles.tagHeader}>
        <Ionicons name="people" size={13} color={C.purple} />
        <Text style={[styles.fieldLabel, { color: C.purple, marginBottom: 0 }]}>Group price tiers</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={add} style={styles.addDayBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.addDayText}>Add tier</Text>
        </TouchableOpacity>
      </View>
      {(!tiers || tiers.length === 0) ? (
        <Text style={styles.helper}>Add tiers like 2 persons → ₹X, 4 persons → ₹Y.</Text>
      ) : (
        tiers.map((t, i) => (
          <View key={i} style={styles.tierRow}>
            <TextInput style={[styles.input, styles.tierInput]} placeholder="Pax" placeholderTextColor="#A3B3C2" keyboardType="number-pad" value={String(t.groupSize ?? "")} onChangeText={(v) => upd(i, "groupSize", v)} />
            <Text style={styles.tierDash}>persons →</Text>
            <TextInput style={[styles.input, styles.tierPrice]} placeholder="₹ price" placeholderTextColor="#A3B3C2" keyboardType="number-pad" value={String(t.price ?? "")} onChangeText={(v) => upd(i, "price", v)} />
            <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={C.red} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

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
        <Text style={[styles.sectionToggleText, { color: color }]}>{label}</Text>
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

function NumberInput({ value, placeholder, onChange, icon, color, suffix }) {
  return (
    <View style={styles.iconInputWrap}>
      <View style={[styles.iconInputIcon, { backgroundColor: `${color || C.emerald600}22` }]}>
        <Ionicons name={icon || "ellipse"} size={14} color={color || C.emerald600} />
      </View>
      <TextInput
        style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRightWidth: suffix ? 0 : 1, borderTopRightRadius: suffix ? 0 : 10, borderBottomRightRadius: suffix ? 0 : 10 }]}
        placeholder={placeholder}
        placeholderTextColor="#A3B3C2"
        keyboardType="number-pad"
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, ""))}
      />
      {!!suffix && (
        <View style={styles.suffixBox}>
          <Text style={styles.suffixText}>{suffix}</Text>
        </View>
      )}
    </View>
  );
}

function TagListEditor({ label, accentColor, icon, placeholder, items, onChange }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...(items || []), t]);
    setDraft("");
  };
  const removeAt = (idx) => {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  };
  return (
    <View style={styles.field}>
      <View style={styles.tagHeader}>
        <Ionicons name={icon} size={13} color={accentColor} />
        <Text style={[styles.fieldLabel, { color: accentColor, marginBottom: 0 }]}>{label}</Text>
        {items?.length > 0 && (
          <View style={[styles.tagCountBadge, { backgroundColor: `${accentColor}22` }]}>
            <Text style={[styles.tagCountText, { color: accentColor }]}>{items.length}</Text>
          </View>
        )}
      </View>
      <View style={styles.tagInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="#A3B3C2"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.tagAddBtn, { backgroundColor: accentColor }]}
          onPress={add}
          disabled={!draft.trim()}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {items?.length > 0 && (
        <View style={styles.chipsWrap}>
          {items.map((t, i) => (
            <View key={`${t}-${i}`} style={[styles.tag, { borderColor: `${accentColor}55` }]}>
              <Text style={styles.tagText} numberOfLines={1}>{t}</Text>
              <TouchableOpacity onPress={() => removeAt(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={14} color={C.subText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const DAY_EMOJIS = ["📍", "🏔️", "🏞️", "🛕", "🏖️", "🍽️", "🚗", "🚌", "🏕️", "⛰️", "🌄", "🎒", "✈️", "🏨"];

function ItineraryEditor({ items, onChange }) {
  const add = () => {
    const day = (items?.length || 0) + 1;
    onChange([...(items || []), { day, title: "", description: "", emoji: "📍", activities: [] }]);
  };
  const update = (idx, k, v) => {
    const next = items.slice();
    next[idx] = { ...next[idx], [k]: v };
    onChange(next);
  };
  const remove = (idx) => {
    const next = items.slice();
    next.splice(idx, 1);
    next.forEach((it, i) => (it.day = i + 1));
    onChange(next);
  };
  // #6b — reorder days; keep the `day` number sequential after a swap
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    next.forEach((it, i) => (it.day = i + 1));
    onChange(next);
  };
  const addActivity = (idx, text) => {
    const t = String(text || "").trim();
    if (!t) return;
    const cur = items[idx].activities || [];
    if (cur.includes(t)) return;
    update(idx, "activities", [...cur, t]);
  };
  const removeActivity = (idx, ai) => {
    const cur = (items[idx].activities || []).slice();
    cur.splice(ai, 1);
    update(idx, "activities", cur);
  };
  return (
    <View style={styles.field}>
      <View style={styles.tagHeader}>
        <Ionicons name="map" size={13} color={C.purple} />
        <Text style={[styles.fieldLabel, { color: C.purple, marginBottom: 0 }]}>Itinerary</Text>
        {items?.length > 0 && (
          <View style={[styles.tagCountBadge, { backgroundColor: C.purpleLight }]}>
            <Text style={[styles.tagCountText, { color: C.purple }]}>{items.length} days</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={add} style={styles.addDayBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.addDayText}>Add day</Text>
        </TouchableOpacity>
      </View>
      {(!items || items.length === 0) ? (
        <Text style={styles.helper}>Tap "Add day" to outline the daily plan.</Text>
      ) : (
        items.map((it, i) => (
          <View key={i} style={styles.dayRow}>
            <LinearGradient
              colors={[C.emerald500, C.emerald600]}
              style={styles.dayBadge}
            >
              <Text style={styles.dayBadgeText}>{it.day || i + 1}</Text>
            </LinearGradient>
            <View style={styles.dayContent}>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayLabel}>Day {it.day || i + 1}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={{ marginRight: 10, opacity: i === 0 ? 0.3 : 1 }}>
                  <Ionicons name="arrow-up" size={16} color={C.purple} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => move(i, 1)} disabled={i === items.length - 1} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={{ marginRight: 10, opacity: i === items.length - 1 ? 0.3 : 1 }}>
                  <Ionicons name="arrow-down" size={16} color={C.purple} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={15} color={C.red} />
                </TouchableOpacity>
              </View>
              {/* #6b — emoji picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                {DAY_EMOJIS.map((em) => {
                  const sel = (it.emoji || "📍") === em;
                  return (
                    <TouchableOpacity
                      key={em}
                      onPress={() => update(i, "emoji", em)}
                      style={[styles.emojiChip, sel && styles.emojiChipSel]}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 16 }}>{em}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TextInput
                style={[styles.input, { marginBottom: 6 }]}
                placeholder="Time (e.g. 09:00 AM) — optional"
                placeholderTextColor="#A3B3C2"
                value={it.time || ""}
                onChangeText={(v) => update(i, "time", v)}
              />
              <TextInput
                style={[styles.input, { marginBottom: 6 }]}
                placeholder="Title (e.g. Arrival in Manali)"
                placeholderTextColor="#A3B3C2"
                value={it.title || ""}
                onChangeText={(v) => update(i, "title", v)}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="What happens this day…"
                placeholderTextColor="#A3B3C2"
                value={it.description || ""}
                onChangeText={(v) => update(i, "description", v)}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
              {/* #6b — per-day activities */}
              {(it.activities || []).length > 0 && (
                <View style={styles.activityWrap}>
                  {(it.activities || []).map((a, ai) => (
                    <View key={ai} style={styles.activityChip}>
                      <Text style={styles.activityChipText}>{a}</Text>
                      <TouchableOpacity onPress={() => removeActivity(i, ai)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close" size={13} color={C.purple} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <ActivityAdder onAdd={(t) => addActivity(i, t)} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function ActivityAdder({ onAdd }) {
  const [text, setText] = useState("");
  const commit = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };
  return (
    <View style={styles.activityAddRow}>
      <TextInput
        style={[styles.input, { flex: 1, marginBottom: 0 }]}
        placeholder="Add activity (e.g. Cable car ride)"
        placeholderTextColor="#A3B3C2"
        value={text}
        onChangeText={setText}
        onSubmitEditing={commit}
        returnKeyType="done"
      />
      <TouchableOpacity onPress={commit} style={styles.activityAddBtn} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color="#fff" />
      </TouchableOpacity>
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

  // Section toggle (collapsible card header)
  sectionToggle: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  sectionToggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionToggleText: { fontSize: 13.5, fontWeight: "800", letterSpacing: 0.3 },
  sectionToggleSub: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },

  // Card (form sections)
  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginTop: -1, borderTopLeftRadius: 0, borderTopRightRadius: 0 },

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

  // Prefix input
  prefixInputWrap: { flexDirection: "row", alignItems: "stretch" },
  prefixBox: { paddingHorizontal: 14, justifyContent: "center", backgroundColor: C.emerald50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  prefixText: { color: C.emerald700, fontWeight: "800", fontSize: 16 },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },

  // Icon-prefixed number input
  iconInputWrap: { flexDirection: "row", alignItems: "stretch" },
  iconInputIcon: { width: 44, justifyContent: "center", alignItems: "center", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  suffixBox: { paddingHorizontal: 12, justifyContent: "center", backgroundColor: "#FAFBFC", borderTopRightRadius: 10, borderBottomRightRadius: 10, borderWidth: 1, borderLeftWidth: 0, borderColor: C.border },
  suffixText: { fontSize: 12, color: C.subText, fontWeight: "700" },

  // Price type selector
  priceTypeRow: { flexDirection: "row", gap: 6 },
  priceTypeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
  },
  priceTypeText: { fontSize: 11.5, color: C.subText, fontWeight: "700" },

  // Cancellation policy
  cancelRow: { flexDirection: "row", gap: 6 },
  cancelBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border, minHeight: 70 },
  cancelLabel: { fontSize: 12.5, color: C.subText, fontWeight: "800", letterSpacing: 0.3, marginBottom: 4 },
  cancelDesc: { fontSize: 10.5, color: C.subText, fontWeight: "600", lineHeight: 14 },

  // Tag list
  tagHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tagCountBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tagCountText: { fontSize: 10.5, fontWeight: "800" },
  tagInputRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  tagAddBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FAFBFC", borderWidth: 1 },
  tagText: { fontSize: 12, color: C.text, fontWeight: "600", maxWidth: 180 },

  // Itinerary day rows
  addDayBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.purple },
  addDayText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  dayRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  dayBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 4 },
  dayBadgeText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  dayContent: { flex: 1, backgroundColor: "#FAFBFC", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  dayHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dayLabel: { fontSize: 12, fontWeight: "800", color: C.purple, letterSpacing: 0.3 },
  // #6b — itinerary emoji + activities
  emojiChip: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  emojiChipSel: { borderColor: C.purple, backgroundColor: C.purpleLight, borderWidth: 2 },
  activityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  activityChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.purpleLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  activityChipText: { fontSize: 11.5, fontWeight: "700", color: C.purple },
  activityAddRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  activityAddBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.purple, alignItems: "center", justifyContent: "center" },

  // Bottom bar with dual actions
  bottomBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  draftBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: C.emerald50, borderWidth: 1.5, borderColor: C.emerald600 },
  draftBtnText: { color: C.emerald600, fontWeight: "800", fontSize: 13.5 },
  publishBtnWrap: { flex: 1, borderRadius: 12, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },

  // Category & location (D1/D2)
  pickerBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  pickerBtnText: { flex: 1, fontSize: 14, color: C.ink, fontWeight: "700" },
  locResults: { marginTop: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: "hidden" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  locName: { flex: 1, fontSize: 13.5, color: C.ink, fontWeight: "700" },
  locType: { fontSize: 10, color: C.subText, fontWeight: "700", textTransform: "uppercase", backgroundColor: "#F1F5F9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  locSelected: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: C.emerald50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  locSelectedText: { flex: 1, fontSize: 12.5, color: C.emerald700, fontWeight: "700" },

  // Vehicles (D5)
  vehSelRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: "#FAFBFC", marginBottom: 8 },
  vehSelRowActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  vehSelName: { fontSize: 14, color: C.ink, fontWeight: "800" },
  vehSelSub: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },

  // Advance payment (D6)
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC" },
  checkRowActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  checkRowText: { flex: 1, fontSize: 13, color: C.text, fontWeight: "700" },
  segRow: { flexDirection: "row", gap: 8 },
  segBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", backgroundColor: "#FAFBFC" },
  segBtnActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  segText: { fontSize: 14, fontWeight: "800", color: C.subText },
  segTextActive: { color: C.emerald700 },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, height: 46 },
  dateBtnText: { flex: 1, fontSize: 13, color: C.ink, fontWeight: "700" },

  // Price tiers (D4)
  tierRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tierInput: { width: 56, textAlign: "center", paddingHorizontal: 6, minHeight: 42 },
  tierDash: { fontSize: 12, color: C.subText, fontWeight: "700" },
  tierPrice: { flex: 1, minHeight: 42 },

  // Category modal (D1)
  modalOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, paddingTop: 16, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#F8FAFC" },
  catRowActive: { backgroundColor: C.emerald50 },
  catRowText: { flex: 1, fontSize: 14, color: C.ink, fontWeight: "800" },
  subCatRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, paddingHorizontal: 12, marginLeft: 18 },
  subCatText: { fontSize: 13, color: C.text, fontWeight: "600" },
});

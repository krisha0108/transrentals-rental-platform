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
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  createTravelAgentTour,
  replaceTravelAgentTour, // PUT — auto-flips isPublic based on status
  deleteTravelAgentTour,
  getTravelAgentProfile, // for the KYC-document gate before creating tours
  generateTourDescription, // AI: short description from title
  listTravelAgentCategories,
  searchTravelAgentLocations,
  listTravelAgentFleet,
  TOUR_STATUS,
  TOUR_PRICE_TYPE,
  TOUR_CANCELLATION_POLICY,
} from "../../api/travelAgentClient";
import ImagePickerField from "../_shared/ImagePickerField";
import RemoteImage from "../_shared/RemoteImage"; // resolves relative /uploads URLs
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DISPLAY } from "../_shared/typography";
import { SC as C, SHEET_RADIUS } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";
import SheetHandle from "../_shared/SheetHandle";

const TOUR_DRAFT_KEY = "ta_tour_draft_v1"; // #6d — only used for new (un-saved) tours


const PRICE_TYPE_META = {
  PER_PERSON: { label: "Per person", icon: "person", color: C.blue },
  PER_GROUP:  { label: "Per group",  icon: "people", color: C.purple },
  ON_REQUEST: { label: "On request", icon: "chatbubble-ellipses", color: C.amber },
};
const CANCEL_META = {
  FLEXIBLE: { label: "Flexible", color: C.green, bg: "#DDEBE2",   desc: "Free up to 24h before" },
  MODERATE: { label: "Moderate", color: C.amber, bg: C.amberLight, desc: "Partial refund window" },
  STRICT:   { label: "Strict",   color: C.red,   bg: C.redLight,   desc: "Limited / no refund" },
};

// #6c — Quick-add duration presets (mirrors the web quick-add page).
const DURATION_OPTIONS = [
  "Half Day (4-5 hrs)", "Full Day (8-10 hrs)", "2 Days 1 Night",
  "3 Days 2 Nights", "4 Days 3 Nights", "5 Days 4 Nights",
  "6 Days 5 Nights", "7 Days 6 Nights", "Custom",
];

// Detailed-add step wizard — mirrors the web /travel-agent/tours/add flow.
const DETAIL_STEPS = [
  { title: "Category & Title",     sub: "Pick a category and name your tour",   icon: "pricetag" },
  { title: "Location & Places",    sub: "Where does this tour go?",              icon: "location" },
  { title: "Overview",             sub: "Describe it, set duration & highlights", icon: "document-text" },
  { title: "Itinerary",            sub: "Add time-based stops & breaks",          icon: "map" },
  { title: "Pricing & Vehicle",    sub: "Price, vehicles & booking policies",     icon: "cash" },
  { title: "Inclusions & Images",  sub: "What's included, excluded + photos",     icon: "images" },
];

// Itinerary stop emojis (mirrors the web builder).
const STOP_EMOJIS = ["🏖", "🏰", "⛪", "🌅", "🍽", "🌊", "🏝", "🌙", "🚗", "🎭", "🛕", "🏔", "🦁", "🌿", "🎪", "📍"];

// Preset inclusions / exclusions (mirror the web detailed add page).
const COMMON_INCLUSIONS = [
  "Hotel Pickup & Drop", "AC Vehicle", "Professional Driver",
  "Breakfast", "Lunch", "Dinner", "Hotel Stay",
  "Tour Guide", "Entry Tickets", "Fuel Charges",
  "Toll Charges", "Parking Charges", "Bottled Water",
];
const COMMON_EXCLUSIONS = [
  "Entry Tickets (if any)", "Water Sports Activities",
  "Lunch & Personal Expenses", "Club Entry Fees",
  "Tips & Gratuities", "Travel Insurance",
  "Camera Fees", "Alcohol", "Room Service",
];

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
    isFixedDate: !!(existing?.tourStartDate || existing?.tourEndDate),
    termsConditions: existing?.termsConditions || "", // #2
    // #6c — quick-add duration preset (web parity)
    quickDuration: existing?.duration || "",
    quickCustomDuration: "",
  }));
  // #6c — create mode. QUICK = essentials only, DETAILED = full form. If the screen
  // is opened without an explicit mode (e.g. dashboard "Add Tour" or empty-state add),
  // we ask the user via an in-screen chooser before revealing the form.
  const initialMode =
    route?.params?.createMode === "QUICK" ? "QUICK"
    : route?.params?.createMode === "DETAILED" ? "DETAILED"
    : null;
  const [mode, setMode] = useState(isEdit ? "DETAILED" : initialMode);
  const [showModeChooser, setShowModeChooser] = useState(!isEdit && initialMode === null);
  const [showDocGate, setShowDocGate] = useState(false); // KYC gate modal
  const [showPreview, setShowPreview] = useState(false); // live tour preview modal
  const [detailStep, setDetailStep] = useState(1); // detailed-mode wizard step (1-6)
  const [aiLoading, setAiLoading] = useState(false); // AI short-description generation
  const [aiQuickLoading, setAiQuickLoading] = useState(false); // AI quick-tour description
  const [descSelection, setDescSelection] = useState({ start: 0, end: 0 });
  const isQuick = mode === "QUICK";

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

  // AI: write the short description from the current title (+ destination/duration).
  const handleAiDescription = async () => {
    if (!form.title.trim()) {
      return Alert.alert("Add a title first", "AI uses the tour title to write the description.");
    }
    try {
      setAiLoading(true);
      const dur = form.quickDuration === "Custom" ? form.quickCustomDuration : form.quickDuration;
      const res = await generateTourDescription({
        title: form.title.trim(),
        destination: form.destination || "",
        duration: dur || "",
      });
      if (res?.description) update("shortDescription", String(res.description).slice(0, 120));
    } catch (e) {
      Alert.alert("AI write failed", e?.response?.data?.error || e?.message || "Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Quick tour: insert bullet/list prefix at cursor position
  const insertDescFormat = (prefix) => {
    const text = form.description;
    const { start, end } = descSelection;
    const isLineStart = start === 0 || text[start - 1] === "\n";
    const toInsert = isLineStart ? prefix : "\n" + prefix;
    update("description", text.slice(0, start) + toInsert + text.slice(end));
  };

  // AI: write the quick-tour description from title + destination + duration + price
  const handleQuickAiDescription = async () => {
    if (!form.title.trim()) {
      return Alert.alert("Add a title first", "AI uses the tour title to write the description.");
    }
    try {
      setAiQuickLoading(true);
      const dur = form.quickDuration === "Custom" ? form.quickCustomDuration : form.quickDuration;
      const res = await generateTourDescription({
        title: form.title.trim(),
        destination: form.destination || "",
        duration: dur || "",
        basePrice: form.basePrice || "",
        mode: "full",
      });
      if (res?.description) update("description", res.description);
    } catch (e) {
      Alert.alert("AI write failed", e?.response?.data?.error || e?.message || "Please try again.");
    } finally {
      setAiQuickLoading(false);
    }
  };

  const save = async ({ publish = false } = {}) => {
    if (saving) return;
    if (!form.title.trim()) return Alert.alert("Required", "Title is required.");

    // KYC gate (new tours only): a travel agent must SUBMIT their documents before
    // they can add tours. We check the live status — DOCUMENTS_PENDING / PENDING means
    // the required KYC doc (Address Proof) hasn't been uploaded yet.
    if (!isEdit) {
      setSaving(true);
      let docsPending = false;
      try {
        const profile = await getTravelAgentProfile();
        docsPending = ["DOCUMENTS_PENDING", "PENDING"].includes(profile?.status);
      } catch { /* offline / fetch failed — don't hard-block, let the save proceed */ }
      if (docsPending) {
        setSaving(false);
        setShowDocGate(true); // show the custom KYC gate modal
        return;
      }
      // docs OK — reset saving so validation early-returns below don't leave the
      // buttons stuck disabled. The save branches set saving=true again themselves.
      setSaving(false);
    }

    const resolvedStatus = publish ? "ACTIVE" : "DRAFT";

    // #6c — Quick mode: mirror the web quick-add validation + payload exactly.
    if (isQuick) {
      const finalDuration = form.quickDuration === "Custom"
        ? form.quickCustomDuration.trim()
        : form.quickDuration;
      if (!form.categoryId) return Alert.alert("Required", "Please select a category.");
      if (publish && !form.mainLocationId) return Alert.alert("Required", "Main location is required to publish.");
      if (publish && !finalDuration) return Alert.alert("Required", "Duration is required to publish.");

      const quickPayload = {
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        category: form.categoryName || null,
        title: form.title.trim(),
        mainLocationId: form.mainLocationId || null,
        destination: form.destination?.trim() || null,
        duration: finalDuration || null,
        description: form.description.trim() || null,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        startingPrice: form.basePrice ? Number(form.basePrice) : null,
        priceType: form.basePrice ? "PER_PERSON" : "ON_REQUEST",
        coverImage: form.coverImage || form.galleryImages[0] || null,
        galleryImages: form.galleryImages,
        images: form.coverImage ? [form.coverImage, ...form.galleryImages] : form.galleryImages,
        createMode: "QUICK",
        status: resolvedStatus,
        ...(publish ? { publish: true } : {}),
      };
      try {
        setSaving(true);
        await createTravelAgentTour(quickPayload);
        try { await AsyncStorage.removeItem(TOUR_DRAFT_KEY); } catch {}
        navigation.navigate("TATours"); // land on the tours list (web parity)
      } catch (e) {
        Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save tour");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Shape fields to match the web editor so customer-facing pages render
    // identically regardless of which platform created the tour.
    // Duration: prefer the preset dropdown (web parity). Parse days/nights from it
    // for the backend fields; fall back to the legacy day/night inputs.
    const presetDuration = form.quickDuration === "Custom" ? form.quickCustomDuration.trim() : form.quickDuration;
    const pdDays = presetDuration ? Number((presetDuration.match(/(\d+)\s*Day/i) || [])[1] || 0) : 0;
    const pdNights = presetDuration ? Number((presetDuration.match(/(\d+)\s*Night/i) || [])[1] || 0) : 0;
    const days = pdDays || (form.durationDays ? Number(form.durationDays) : 1);
    const nights = pdNights || (form.durationNights ? Number(form.durationNights) : 0);
    const durationLabel = presetDuration ||
      (`${days} Day${days !== 1 ? "s" : ""}` + (nights ? ` ${nights} Night${nights !== 1 ? "s" : ""}` : ""));
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
      itinerary: form.itinerary.map((s) => ({
        ...s,
        title: s.type === "break" ? (s.breakNote || s.title || "Break") : s.title,
        activities: (s.activities || []).filter((a) => a && String(a).trim()),
      })),
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
      tourStartDate: form.isFixedDate ? (form.tourStartDate || null) : null,
      tourEndDate: form.isFixedDate ? (form.tourEndDate || null) : null,
      termsConditions: form.termsConditions.trim() || null, // #2
      createMode: mode || "DETAILED", // #6c
      status: resolvedStatus,
      ...(publish ? { publish: true } : {}),
    };

    try {
      setSaving(true);
      if (isEdit) await replaceTravelAgentTour(existing.id, payload);
      else await createTravelAgentTour(payload);
      if (!isEdit) { try { await AsyncStorage.removeItem(TOUR_DRAFT_KEY); } catch {} } // #6d
      update("status", resolvedStatus);
      // New tour → go to the tours list (web parity); edit → return to where we came from.
      if (isEdit) navigation.goBack();
      else navigation.navigate("TATours");
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

  // ---- Live preview values (how a traveller will see the tour) ----
  const previewImages = (form.coverImage
    ? [form.coverImage, ...form.galleryImages.filter((u) => u !== form.coverImage)]
    : form.galleryImages
  ).filter(Boolean);
  const previewDuration =
    (form.quickDuration === "Custom" ? form.quickCustomDuration : form.quickDuration) ||
    [
      form.durationDays && `${form.durationDays} Day${Number(form.durationDays) !== 1 ? "s" : ""}`,
      form.durationNights && `${form.durationNights} Night${Number(form.durationNights) !== 1 ? "s" : ""}`,
    ].filter(Boolean).join(" ");
  const previewPrice =
    form.priceType === "ON_REQUEST" || !form.basePrice
      ? "On request"
      : `₹${form.basePrice}${form.priceType === "PER_GROUP" ? " / group" : " / person"}`;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* Gradient header */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 20 }}>
          {/* Actions row */}
          <View style={styles.headerActionsRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setShowPreview(true)} style={styles.iconBtn}>
              <Ionicons name="eye-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerSaveBtn, !canSave && { opacity: 0.5 }]}
              onPress={() => save({ publish: false })}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={C.emerald700} />
              ) : (
                <Text style={styles.headerSaveText}>Save Draft</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Title block — own line, not cramped with the actions */}
          <Text style={styles.headerTitleBig} numberOfLines={1}>{isEdit ? "Edit Tour" : "Create New Tour"}</Text>
          <Text style={styles.headerSub}>
            {isQuick ? "Quick add · essentials" : `Step ${detailStep} of 6`} · {form.status}
          </Text>

          {/* Mini progress dots — replaced by the detailed step wizard indicator */}
          {false && (
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
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* behavior on Android too, not just iOS.
          MainActivity calls enableEdgeToEdge(), and with edge-to-edge the
          window stops honouring android:windowSoftInputMode="adjustResize" —
          verified on device: the frame stays [0,0][1080,2400] whether the IME
          is up or not. Nothing shrinks, so the ScrollView never gains anything
          to scroll and the focused field stays under the keyboard. Passing
          undefined here left Android with no keyboard handling at all. */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Quick-mode banner — switch to detailed anytime */}
          {isQuick && (
            <TouchableOpacity style={styles.quickBanner} onPress={() => setMode("DETAILED")} activeOpacity={0.85}>
              <Ionicons name="flash" size={16} color={C.amber} />
              <Text style={styles.quickBannerText}>Quick mode — only the essentials. </Text>
              <Text style={styles.quickBannerLink}>Add full details ›</Text>
            </TouchableOpacity>
          )}

          {/* ========================= QUICK MODE FORM ========================= */}
          {/* Mirrors the web /travel-agent/tours/add/quick page: category grid,    */}
          {/* title, DB location search, duration preset, base price, desc, images. */}
          {isQuick && (
          <>
            {/* Category (required) — grid from DB */}
            <SectionToggle icon="pricetags" color={C.emerald600} label="Category *" sub={form.categoryName || "Choose a tour category"} open showChevron={false} onToggle={() => {}} />
            <Card attached>
              {categories.length === 0 ? (
                <Text style={styles.helper}>Loading categories…</Text>
              ) : (
                <View style={styles.catGrid}>
                  {categories.map((cat) => {
                    const active = form.categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catTile, active && styles.catTileActive]}
                        onPress={() => {
                          update("categoryId", cat.id);
                          update("subCategoryId", null);
                          update("categoryName", cat.name);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.catTileIcon, active && styles.catTileIconActive]}>
                          <Text style={styles.catTileEmoji}>{cat.icon || "🏷️"}</Text>
                        </View>
                        <Text
                          style={[styles.catTileText, active && styles.catTileTextActive]}
                          numberOfLines={2}
                        >
                          {cat.name}
                        </Text>
                        {active && (
                          <View style={styles.catTileCheck}>
                            <Ionicons name="checkmark" size={11} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>

            {/* Tour details: title, location, duration, price */}
            <SectionToggle icon="information-circle" color={C.emerald600} label="Tour details" sub="Title, location, duration & price" open showChevron={false} onToggle={() => {}} />
            <Card attached>
              <Field label="Tour title *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Goa 3-day beach getaway"
                  placeholderTextColor="#9AA79E"
                  value={form.title}
                  onChangeText={(v) => update("title", v)}
                  maxLength={120}
                />
              </Field>

              {/* Main location — DB search (same source as web) */}
              <Field label="Main location" helper="Search & link a city/area from your database.">
                {form.mainLocationId ? (
                  <View style={styles.locSelected}>
                    <Ionicons name="checkmark-circle" size={14} color={C.emerald600} />
                    <Text style={styles.locSelectedText}>Linked: {form.destination}</Text>
                    <TouchableOpacity
                      onPress={() => { update("mainLocationId", null); update("destination", ""); }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close-circle" size={16} color={C.subText} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.iconInputWrap}>
                      <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}18` }]}>
                        <Ionicons name="search" size={14} color={C.emerald600} />
                      </View>
                      <TextInput
                        style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                        placeholder="Search city or location…"
                        placeholderTextColor="#9AA79E"
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
                  </>
                )}
              </Field>

              {/* Duration preset (web parity) */}
              <Field label="Duration">
                <View style={styles.durWrap}>
                  {DURATION_OPTIONS.map((d) => {
                    const active = form.quickDuration === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.durChip, active && styles.durChipActive]}
                        onPress={() => update("quickDuration", d)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.durChipText, active && styles.durChipTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {form.quickDuration === "Custom" && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder="e.g. 10 Days 9 Nights"
                    placeholderTextColor="#9AA79E"
                    value={form.quickCustomDuration}
                    onChangeText={(v) => update("quickCustomDuration", v)}
                  />
                )}
              </Field>

              {/* Base price */}
              <Field label="Base price" helper="Per person · leave blank for “On request”.">
                <View style={styles.prefixInputWrap}>
                  <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                  <TextInput
                    style={[styles.input, styles.prefixInput]}
                    placeholder="0"
                    placeholderTextColor="#9AA79E"
                    keyboardType="number-pad"
                    value={form.basePrice}
                    onChangeText={(v) => update("basePrice", v.replace(/[^\d.]/g, ""))}
                  />
                </View>
              </Field>
            </Card>

            {/* Description */}
            <SectionToggle icon="document-text" color={C.emerald600} label="Description" sub="Short overview (optional)" open showChevron={false} onToggle={() => {}} />
            <Card attached>
              <Field label="Description">
                {/* Formatting toolbar */}
                <View style={styles.fmtToolbar}>
                  {[
                    { label: "•  Bullet", insert: "• " },
                    { label: "1.  List", insert: "1. " },
                    { label: "✓  Check", insert: "✓ " },
                    { label: "—  Dash", insert: "— " },
                  ].map(({ label, insert }) => (
                    <TouchableOpacity key={label} style={styles.fmtBtn} onPress={() => insertDescFormat(insert)} activeOpacity={0.7}>
                      <Text style={styles.fmtBtnText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* AI-powered TextArea */}
                <View style={styles.aiInputWrap}>
                  <TextInput
                    style={[styles.input, styles.inputMultilineRich, { flex: 1, paddingRight: 48, marginBottom: 0 }]}
                    placeholder="Describe the tour for travellers…"
                    placeholderTextColor="#9AA79E"
                    value={form.description}
                    onChangeText={(v) => update("description", v)}
                    onSelectionChange={(e) => setDescSelection(e.nativeEvent.selection)}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    onPress={handleQuickAiDescription}
                    disabled={aiQuickLoading}
                    style={[styles.aiInlineBtn, { top: 8, bottom: "auto" }]}
                    activeOpacity={0.85}
                  >
                    {aiQuickLoading
                      ? <ActivityIndicator size="small" color={C.emerald600} />
                      : <Ionicons name="sparkles" size={18} color={C.emerald600} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleQuickAiDescription} disabled={aiQuickLoading} style={styles.aiHintRow} activeOpacity={0.7}>
                  <Ionicons name="sparkles" size={12} color={C.emerald600} />
                  <Text style={styles.aiHintText}>{aiQuickLoading ? "Writing…" : "Write with AI from the title"}</Text>
                </TouchableOpacity>
              </Field>
            </Card>

            {/* Images */}
            <SectionToggle icon="image" color={C.gold} label="Images" sub={`${form.coverImage ? "Cover ✓" : "No cover"} · ${form.galleryImages.length} gallery`} open showChevron={false} onToggle={() => {}} />
            <Card attached>
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
          </>
          )}

          {/* ===================== DETAILED MODE SECTIONS ===================== */}
          {!isQuick && (
          <>
          {/* ===== Step indicator ===== */}
          <View style={styles.stepperRow}>
            {DETAIL_STEPS.map((s, i) => {
              const n = i + 1;
              const done = detailStep > n;
              const current = detailStep === n;
              return (
                <React.Fragment key={s.title}>
                  {i > 0 && <View style={[styles.stepperLine, detailStep >= n && styles.stepperLineDone]} />}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setDetailStep(n)}
                    style={[styles.stepperDot, current && styles.stepperDotCurrent, done && styles.stepperDotDone]}
                  >
                    {done
                      ? <Ionicons name="checkmark" size={15} color="#fff" />
                      : <Text style={[styles.stepperNum, current && { color: "#fff" }]}>{n}</Text>}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>

          {/* Step header — icon + title + subtitle */}
          <View style={styles.stepHead}>
            <View style={styles.stepHeadIcon}>
              <Ionicons name={DETAIL_STEPS[detailStep - 1].icon} size={20} color={C.emerald600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepHeadTitle}>{DETAIL_STEPS[detailStep - 1].title}</Text>
              <Text style={styles.stepHeadSub}>Step {detailStep} of 6 · {DETAIL_STEPS[detailStep - 1].sub}</Text>
            </View>
          </View>

          {/* ===== STEP 1 — Category & Title ===== */}
          {detailStep === 1 && (
            <Card>
              <Field label="Category *">
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryModal(true)} activeOpacity={0.85}>
                  <Ionicons name="pricetag" size={15} color={C.blue} />
                  <Text style={[styles.pickerBtnText, !form.categoryName && { color: "#9AA79E" }]} numberOfLines={1}>
                    {form.categoryName || "Select a category"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={C.subText} />
                </TouchableOpacity>
              </Field>
              <Field label="Title *">
                <TextInput style={styles.input} placeholder="e.g. Manali 4N5D Honeymoon Package" placeholderTextColor="#9AA79E" value={form.title} onChangeText={(v) => update("title", v)} />
              </Field>
              <Field label="Short description" helper={`${form.shortDescription.length}/120 — shown on cards`}>
                <View style={styles.aiInputWrap}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, paddingRight: 44 }]}
                    placeholder="One-line teaser"
                    placeholderTextColor="#9AA79E"
                    value={form.shortDescription}
                    onChangeText={(v) => update("shortDescription", v)}
                    maxLength={120}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={handleAiDescription}
                    disabled={aiLoading}
                    style={styles.aiInlineBtn}
                    activeOpacity={0.85}
                  >
                    {aiLoading
                      ? <ActivityIndicator size="small" color={C.purple} />
                      : <Ionicons name="sparkles" size={18} color={C.purple} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleAiDescription} disabled={aiLoading} style={styles.aiHintRow} activeOpacity={0.7}>
                  <Ionicons name="sparkles" size={12} color={C.purple} />
                  <Text style={styles.aiHintText}>{aiLoading ? "Writing…" : "Write with AI from the title"}</Text>
                </TouchableOpacity>
              </Field>
            </Card>
          )}

          {/* ===== STEP 2 — Location & Places ===== */}
          {detailStep === 2 && (
            <Card>
              <Field label="Main location" helper="Search & link a city/area from your database.">
                {form.mainLocationId ? (
                  <View style={styles.locSelected}>
                    <Ionicons name="checkmark-circle" size={14} color={C.emerald600} />
                    <Text style={styles.locSelectedText}>Linked: {form.destination}</Text>
                    <TouchableOpacity onPress={() => { update("mainLocationId", null); update("destination", ""); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close-circle" size={16} color={C.subText} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.iconInputWrap}>
                      <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}18` }]}>
                        <Ionicons name="search" size={14} color={C.emerald600} />
                      </View>
                      <TextInput
                        style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                        placeholder="Search city or location…"
                        placeholderTextColor="#9AA79E"
                        value={locQuery}
                        onChangeText={setLocQuery}
                      />
                    </View>
                    {locSearching && <Text style={styles.helper}>Searching…</Text>}
                    {locResults.length > 0 && (
                      <View style={styles.locResults}>
                        {locResults.map((l) => (
                          <TouchableOpacity key={l.id} style={styles.locRow} onPress={() => { update("mainLocationId", l.id); update("destination", l.name); setLocQuery(""); setLocResults([]); }}>
                            <Ionicons name="location-outline" size={14} color={C.subText} />
                            <Text style={styles.locName} numberOfLines={1}>{l.name}</Text>
                            {!!l.type && <Text style={styles.locType}>{l.type}</Text>}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </Field>
              <TagListEditor label="Places covered" accentColor={C.blue} icon="pin" placeholder="e.g. Solang Valley, Hadimba Temple" items={form.customPlaces} onChange={(v) => update("customPlaces", v)} />
              <TagListEditor label="Pickup areas / points" accentColor={C.red} icon="navigate" placeholder="e.g. Mall Road hotels, Bus stand" items={form.pickupAreas} onChange={(v) => update("pickupAreas", v)} />
            </Card>
          )}

          {/* ===== STEP 3 — Overview ===== */}
          {detailStep === 3 && (
            <Card>
              <Field label="Full description">
                <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Detailed tour description…" placeholderTextColor="#9AA79E" value={form.description} onChangeText={(v) => update("description", v)} multiline numberOfLines={4} textAlignVertical="top" />
              </Field>
              {/* Duration — preset dropdown (web parity) */}
              <Field label="Duration">
                <View style={styles.durWrap}>
                  {DURATION_OPTIONS.map((d) => {
                    const active = form.quickDuration === d;
                    return (
                      <TouchableOpacity key={d} style={[styles.durChip, active && styles.durChipActive]} onPress={() => update("quickDuration", d)} activeOpacity={0.85}>
                        <Text style={[styles.durChipText, active && styles.durChipTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {form.quickDuration === "Custom" && (
                  <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="e.g. 10 Days 9 Nights" placeholderTextColor="#9AA79E" value={form.quickCustomDuration} onChangeText={(v) => update("quickCustomDuration", v)} />
                )}
              </Field>

              <TagListEditor label="Highlights" accentColor={C.amber} icon="star" placeholder="e.g. Rohtang Pass excursion" items={form.highlights} onChange={(v) => update("highlights", v)} />

              {/* Fixed tour dates — toggle (web parity) */}
              <Field label="Fixed tour dates">
                <TouchableOpacity
                  style={[styles.checkRow, form.isFixedDate && styles.checkRowActive]}
                  onPress={() => {
                    const next = !form.isFixedDate;
                    update("isFixedDate", next);
                    if (!next) { update("tourStartDate", null); update("tourEndDate", null); }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={form.isFixedDate ? "checkbox" : "square-outline"} size={20} color={form.isFixedDate ? C.emerald600 : C.subText} />
                  <Text style={[styles.checkRowText, form.isFixedDate && { color: C.emerald700 }]}>
                    This tour only runs between specific dates
                  </Text>
                </TouchableOpacity>
              </Field>
              {form.isFixedDate && (
                <View style={styles.row2}>
                  <Field label="Start date" style={{ flex: 1 }}>
                    <DateBtn value={fmtD(form.tourStartDate)} onPress={() => setDatePicker("tourStartDate")} onClear={form.tourStartDate ? () => update("tourStartDate", null) : null} />
                  </Field>
                  <Field label="End date" style={{ flex: 1 }}>
                    <DateBtn value={fmtD(form.tourEndDate)} onPress={() => setDatePicker("tourEndDate")} onClear={form.tourEndDate ? () => update("tourEndDate", null) : null} />
                  </Field>
                </View>
              )}
            </Card>
          )}

          {/* ===== STEP 4 — Itinerary ===== */}
          {detailStep === 4 && (
            <Card>
              <ItineraryEditor items={form.itinerary} onChange={(v) => update("itinerary", v)} />
            </Card>
          )}

          {/* ===== STEP 5 — Pricing & Vehicle ===== */}
          {detailStep === 5 && (
            <Card>
              <Field label="Pricing type">
                <View style={styles.priceTypeRow}>
                  {TOUR_PRICE_TYPE.map((pt) => {
                    const meta = PRICE_TYPE_META[pt];
                    const active = form.priceType === pt;
                    return (
                      <TouchableOpacity key={pt} style={[styles.priceTypeBtn, active && { backgroundColor: `${meta.color}18`, borderColor: meta.color }]} onPress={() => update("priceType", pt)} activeOpacity={0.85}>
                        <Ionicons name={meta.icon} size={19} color={active ? meta.color : C.subText} />
                        <Text style={[styles.priceTypeText, active && { color: meta.color, fontWeight: "bold" }]}>{meta.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              {form.priceType !== "ON_REQUEST" && (
                <Field label="Base price">
                  <View style={styles.prefixInputWrap}>
                    <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                    <TextInput style={[styles.input, styles.prefixInput]} placeholder="12500" placeholderTextColor="#9AA79E" keyboardType="number-pad" value={form.basePrice} onChangeText={(v) => update("basePrice", v.replace(/[^\d.]/g, ""))} />
                  </View>
                </Field>
              )}
              {form.priceType === "PER_GROUP" && (
                <PriceTierEditor tiers={form.priceTiers} onChange={(v) => update("priceTiers", v)} />
              )}

              <Field label="Vehicles (optional)">
                {fleet.length === 0 ? (
                  <Text style={styles.helper}>No vehicles in your fleet yet. Add them under Fleet.</Text>
                ) : (
                  fleet.map((v) => {
                    const sel = form.vehicleIds.includes(v.id);
                    return (
                      <TouchableOpacity key={v.id} style={[styles.vehSelRow, sel && styles.vehSelRowActive]} onPress={() => toggleVehicle(v.id)} activeOpacity={0.85}>
                        <Ionicons name={sel ? "checkbox" : "square-outline"} size={20} color={sel ? C.emerald600 : C.subText} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.vehSelName} numberOfLines={1}>{v.vehicleName || "Vehicle"}</Text>
                          <Text style={styles.vehSelSub} numberOfLines={1}>{[v.registrationNumber, v.seatingCapacity ? `${v.seatingCapacity} seats` : null].filter(Boolean).join(" · ") || v.vehicleType}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </Field>

              <Field label="Advance notice required">
                <NumberInput value={form.advanceNoticeHours} placeholder="24" onChange={(v) => update("advanceNoticeHours", v)} icon="time" color={C.blue} suffix="hrs" />
              </Field>

              <Field label="Cancellation policy">
                <View style={styles.cancelRow}>
                  {TOUR_CANCELLATION_POLICY.map((p) => {
                    const meta = CANCEL_META[p];
                    const active = form.cancellationPolicy === p;
                    return (
                      <TouchableOpacity key={p} style={[styles.cancelBtn, active && { backgroundColor: meta.bg, borderColor: meta.color }]} onPress={() => update("cancellationPolicy", p)} activeOpacity={0.85}>
                        <Text style={[styles.cancelLabel, active && { color: meta.color, fontWeight: "bold" }]}>{meta.label}</Text>
                        <Text style={[styles.cancelDesc, active && { color: meta.color, opacity: 0.85 }]} numberOfLines={2}>{meta.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="Cancellation notes">
                <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Refund timeline, exceptions…" placeholderTextColor="#9AA79E" value={form.cancellationNotes} onChangeText={(v) => update("cancellationNotes", v)} multiline numberOfLines={3} textAlignVertical="top" />
              </Field>

              <Field label="Advance payment">
                <TouchableOpacity style={[styles.checkRow, form.requireAdvancePayment && styles.checkRowActive]} onPress={() => update("requireAdvancePayment", !form.requireAdvancePayment)} activeOpacity={0.85}>
                  <Ionicons name={form.requireAdvancePayment ? "checkbox" : "square-outline"} size={20} color={form.requireAdvancePayment ? C.emerald600 : C.subText} />
                  <Text style={[styles.checkRowText, form.requireAdvancePayment && { color: C.emerald700 }]}>Collect an advance to confirm booking</Text>
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
                    <TextInput style={styles.input} keyboardType="number-pad" placeholder={form.advancePaymentType === "PERCENTAGE" ? "e.g. 30" : "e.g. 5000"} placeholderTextColor="#9AA79E" value={form.advancePaymentValue} onChangeText={(v) => update("advancePaymentValue", v.replace(/[^0-9]/g, ""))} />
                  </Field>
                </View>
              )}
            </Card>
          )}

          {/* ===== STEP 6 — Inclusions & Images ===== */}
          {detailStep === 6 && (
            <Card>
              <PresetTagEditor label="Tour Includes" icon="checkmark-circle" accentColor={C.emerald600} presets={COMMON_INCLUSIONS} items={form.inclusions} onChange={(v) => update("inclusions", v)} placeholder="Type custom inclusion & add" />
              <PresetTagEditor label="Tour Excludes" icon="close-circle" accentColor={C.red} presets={COMMON_EXCLUSIONS} items={form.exclusions} onChange={(v) => update("exclusions", v)} placeholder="Type custom exclusion & add" />
              <ImagePickerField label="Cover image" value={form.coverImage} onChange={(v) => update("coverImage", v)} folder="tours" helperText="Main image shown on tour cards & previews." />
              <ImagePickerField label="Gallery (up to 8)" multi max={8} value={form.galleryImages} onChange={(v) => update("galleryImages", v)} folder="tours" />
              <Field label="Terms & conditions">
                <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Inclusions, exclusions, booking terms…" placeholderTextColor="#9AA79E" value={form.termsConditions} onChangeText={(v) => update("termsConditions", v)} multiline numberOfLines={4} textAlignVertical="top" />
              </Field>
            </Card>
          )}
          </>
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

      {/* Sticky action bar — wizard nav in detailed mode, save/publish otherwise */}
      <View style={styles.bottomBar}>
        {/* Back (detailed steps 2-6) */}
        {!isQuick && detailStep > 1 && (
          <TouchableOpacity style={styles.draftBtn} onPress={() => setDetailStep((s) => Math.max(1, s - 1))} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={16} color={C.emerald600} />
            <Text style={styles.draftBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Save as draft (quick mode) */}
        {isQuick && (
          <TouchableOpacity
            style={[styles.draftBtn, !canSave && { opacity: 0.4 }]}
            onPress={() => save({ publish: false })}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons name="save-outline" size={16} color={C.emerald600} />
            <Text style={styles.draftBtnText}>Save draft</Text>
          </TouchableOpacity>
        )}

        {/* Next (detailed steps 1-5) OR Publish (last step / quick) */}
        {!isQuick && detailStep < 6 ? (
          <TouchableOpacity style={styles.publishBtnWrap} onPress={() => setDetailStep((s) => Math.min(6, s + 1))} activeOpacity={0.9}>
            <LinearGradient colors={[C.emerald600, C.emerald700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.publishBtnInner}>
              <Text style={styles.publishBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.publishBtnWrap, !canSave && { opacity: 0.5 }]}
            onPress={() => save({ publish: true })}
            disabled={!canSave}
            activeOpacity={0.9}
          >
            <LinearGradient colors={[C.emerald600, C.emerald700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.publishBtnInner}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.publishBtnText}>Publish Tour</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
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

      {/* Live tour preview — how a traveller will see this tour */}
      {showPreview && (
        <View style={styles.previewOverlay}>
          <View style={styles.previewSheet}>
            <SheetHandle />
            <View style={styles.previewHeader}>
              <View style={styles.previewEyeChip}>
                <Ionicons name="eye" size={13} color={C.emerald600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.previewHeaderTitle}>Preview</Text>
                <Text style={styles.previewHeaderSub}>Traveller's view</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewClose} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {/* Cover hero — carries the category badge and image count, like
                  the real tour card. Title stays in the body below it. */}
              <View style={styles.previewCoverWrap}>
                {previewImages.length > 0 ? (
                  <RemoteImage source={{ uri: previewImages[0] }} style={styles.previewCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.previewCover, styles.previewCoverEmpty]}>
                    <Ionicons name="image-outline" size={34} color={C.subText} />
                    <Text style={styles.previewEmptyText}>No cover image</Text>
                  </View>
                )}

                {previewImages.length > 0 && (
                  <LinearGradient
                    colors={["rgba(11,32,25,0.34)", "rgba(11,32,25,0)", "rgba(11,32,25,0.12)"]}
                    locations={[0, 0.42, 1]}
                    style={styles.previewCoverScrim}
                    pointerEvents="none"
                  />
                )}

                {!!form.categoryName && (
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText} numberOfLines={1}>{form.categoryName}</Text>
                  </View>
                )}

                {previewImages.length > 1 && (
                  <View style={styles.previewCountPill}>
                    <Ionicons name="images" size={11} color="#fff" />
                    <Text style={styles.previewCountText}>{previewImages.length}</Text>
                  </View>
                )}
              </View>

              <View style={styles.previewBody}>
                <Text style={styles.previewTitle}>{form.title || "Untitled tour"}</Text>

                {/* Meta as tinted pills rather than loose icon + text */}
                {(!!form.destination || !!previewDuration) && (
                  <View style={styles.previewMetaRow}>
                    {!!form.destination && (
                      <View style={styles.previewMeta}>
                        <Ionicons name="location" size={12} color={C.emerald600} />
                        <Text style={styles.previewMetaText} numberOfLines={1}>{form.destination}</Text>
                      </View>
                    )}
                    {!!previewDuration && (
                      <View style={styles.previewMeta}>
                        <Ionicons name="time" size={12} color={C.emerald600} />
                        <Text style={styles.previewMetaText} numberOfLines={1}>{previewDuration}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Price plate — the one hard number, given its own container */}
                <View style={styles.previewPriceCard}>
                  <Text style={styles.previewPriceLabel}>Starting from</Text>
                  <Text style={styles.previewPrice} numberOfLines={1}>{previewPrice}</Text>
                </View>

                {!!form.description && (
                  <>
                    <PreviewSection icon="document-text" label="About this tour" />
                    <Text style={styles.previewDesc}>{form.description}</Text>
                  </>
                )}

                {previewImages.length > 1 && (
                  <>
                    <PreviewSection icon="images" label="Gallery" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {previewImages.slice(1).map((uri, i) => (
                        <RemoteImage key={i} source={{ uri }} style={styles.previewThumb} resizeMode="cover" />
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.previewFooter}>
              <Ionicons name="eye-outline" size={14} color={C.emerald600} />
              <Text style={styles.previewFooterText}>This is how travellers will see your tour.</Text>
            </View>
          </View>
        </View>
      )}

      {/* KYC document gate — shown when a TA tries to add a tour before submitting docs */}
      {showDocGate && (
        <View style={styles.gateOverlay}>
          <View style={styles.gateCard}>
            <View style={styles.gateIconWrap}>
              <Ionicons name="document-text" size={32} color={C.amber} />
              <View style={styles.gateLockBadge}>
                <Ionicons name="lock-closed" size={11} color="#fff" />
              </View>
            </View>

            <Text style={styles.gateTitle}>Complete your documents first</Text>
            <Text style={styles.gateMsg}>
              Upload your KYC document (Address Proof) to start adding tours. It only takes a minute.
            </Text>

            <View style={styles.gateStepsRow}>
              <View style={styles.gateStep}>
                <View style={styles.gateStepDotDone}><Ionicons name="checkmark" size={11} color="#fff" /></View>
                <Text style={styles.gateStepText}>Account created</Text>
              </View>
              <View style={styles.gateStepLine} />
              <View style={styles.gateStep}>
                <View style={styles.gateStepDotCurrent}><Text style={styles.gateStepDotNum}>2</Text></View>
                <Text style={[styles.gateStepText, { color: C.ink, fontWeight: "bold" }]}>Upload document</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.gatePrimary}
              activeOpacity={0.9}
              onPress={() => { setShowDocGate(false); navigation.navigate("TADocuments"); }}
            >
              <LinearGradient
                colors={[C.emerald600, C.emerald700]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gatePrimaryInner}
              >
                <Ionicons name="cloud-upload" size={17} color="#fff" />
                <Text style={styles.gatePrimaryText}>Upload document</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gateSecondary} onPress={() => setShowDocGate(false)}>
              <Text style={styles.gateSecondaryText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* #6c — Quick vs Detailed chooser (when opened without a pre-selected mode) */}
      {showModeChooser && (
        <View style={styles.chooserOverlay}>
          <View style={styles.chooserCard}>
            <SheetHandle />
            <Text style={styles.chooserTitle}>How do you want to add this tour?</Text>
            <Text style={styles.chooserSub}>You can switch modes anytime.</Text>

            <TouchableOpacity
              style={styles.chooserOpt}
              activeOpacity={0.85}
              onPress={() => { setMode("QUICK"); setShowModeChooser(false); }}
            >
              <View style={[styles.chooserIcon, { backgroundColor: C.amberLight }]}>
                <Ionicons name="flash" size={20} color={C.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chooserOptTitle}>Quick Add</Text>
                <Text style={styles.chooserOptDesc}>Title, price & cover image — publish in seconds.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.subText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chooserOpt}
              activeOpacity={0.85}
              onPress={() => { setMode("DETAILED"); setShowModeChooser(false); }}
            >
              <View style={[styles.chooserIcon, { backgroundColor: C.emerald50 }]}>
                <Ionicons name="list" size={20} color={C.emerald600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chooserOptTitle}>Detailed Add</Text>
                <Text style={styles.chooserOptDesc}>Full form — itinerary, inclusions, vehicles & more.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.chooserCancel} onPress={() => navigation.goBack()}>
              <Text style={styles.chooserCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
      <Text style={[styles.dateBtnText, !value && { color: "#9AA79E", fontWeight: "600" }]}>{value || "Pick date"}</Text>
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
            <TextInput style={[styles.input, styles.tierInput]} placeholder="Pax" placeholderTextColor="#9AA79E" keyboardType="number-pad" value={String(t.groupSize ?? "")} onChangeText={(v) => upd(i, "groupSize", v)} />
            <Text style={styles.tierDash}>persons →</Text>
            <TextInput style={[styles.input, styles.tierPrice]} placeholder="₹ price" placeholderTextColor="#9AA79E" keyboardType="number-pad" value={String(t.price ?? "")} onChangeText={(v) => upd(i, "price", v)} />
            <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={C.red} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

// Editorial section header inside the preview sheet — icon chip + ink title +
// a hairline to the edge. Replaces the old grey uppercase micro-label.
function PreviewSection({ icon, label }) {
  return (
    <View style={styles.previewSectionHeader}>
      <View style={styles.previewSectionIcon}>
        <Ionicons name={icon} size={12} color={C.emerald600} />
      </View>
      <Text style={styles.previewSectionLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.previewSectionRule} />
    </View>
  );
}

// `attached` = this card sits directly under a SectionToggle and continues it.
// Six of the ten cards stand on their own (the detailed-mode steps), so the
// joined look has to be opt-in or those would render with a cut-off top edge.
function Card({ children, attached }) {
  return <View style={[styles.card, attached && styles.cardAttached]}>{children}</View>;
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

function SectionToggle({ icon, color, label, sub, open, onToggle, showChevron = true, actionIcon, actionColor }) {
  return (
    <TouchableOpacity style={styles.sectionToggle} onPress={onToggle} activeOpacity={0.85}>
      <View style={[styles.sectionToggleIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sectionToggleText}>{label}</Text>
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
        placeholderTextColor="#9AA79E"
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

// Preset-chip selector + custom add (mirrors the web inclusions/exclusions UI).
function PresetTagEditor({ label, icon, accentColor, presets, items, onChange, placeholder }) {
  const [text, setText] = useState("");
  const list = items || [];
  const toggle = (p) => onChange(list.includes(p) ? list.filter((x) => x !== p) : [...list, p]);
  const remove = (p) => onChange(list.filter((x) => x !== p));
  const addCustom = () => {
    const t = text.trim();
    setText("");
    if (!t || list.includes(t)) return;
    onChange([...list, t]);
  };
  return (
    <View style={styles.field}>
      <View style={styles.tagHeader}>
        <Ionicons name={icon} size={13} color={accentColor} />
        <Text style={[styles.fieldLabel, { color: accentColor, marginBottom: 0 }]}>{label}</Text>
        {list.length > 0 && (
          <View style={[styles.tagCountBadge, { backgroundColor: `${accentColor}1A` }]}>
            <Text style={[styles.tagCountText, { color: accentColor }]}>{list.length}</Text>
          </View>
        )}
      </View>

      {/* Preset chips — tap to toggle */}
      <View style={styles.presetWrap}>
        {presets.map((p) => {
          const active = list.includes(p);
          return (
            <TouchableOpacity
              key={p}
              onPress={() => toggle(p)}
              activeOpacity={0.8}
              style={[styles.presetChip, active && { borderColor: accentColor, backgroundColor: `${accentColor}14` }]}
            >
              {active && <Ionicons name="checkmark" size={12} color={accentColor} />}
              <Text style={[styles.presetChipText, active && { color: accentColor, fontWeight: "bold" }]}>{p}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom add */}
      <View style={styles.presetAddRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder={placeholder}
          placeholderTextColor="#9AA79E"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addCustom} style={[styles.presetAddBtn, { backgroundColor: accentColor }]} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Selected items — removable */}
      {list.length > 0 && (
        <View style={styles.selectedWrap}>
          {list.map((p) => (
            <View key={p} style={[styles.selectedChip, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}55` }]}>
              <Text style={[styles.selectedChipText, { color: accentColor }]} numberOfLines={1}>{p}</Text>
              <TouchableOpacity onPress={() => remove(p)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={13} color={accentColor} />
              </TouchableOpacity>
            </View>
          ))}
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
          placeholderTextColor="#9AA79E"
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
  const [emojiOpen, setEmojiOpen] = useState(null);
  const list = items || [];

  const addStop = () => onChange([...list, { id: Date.now(), type: "stop", emoji: "📍", time: "", title: "", description: "", activities: [""], timeSpent: "" }]);
  const addBreak = () => onChange([...list, { id: Date.now() + 1, type: "break", emoji: "☕", time: "", title: "Break", breakNote: "", description: "", activities: [], timeSpent: "" }]);
  const updateStop = (idx, k, v) => {
    const next = list.slice();
    next[idx] = { ...next[idx], [k]: v };
    onChange(next);
  };
  const removeStop = (idx) => {
    const next = list.slice();
    next.splice(idx, 1);
    onChange(next);
  };
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp;
    onChange(next);
  };
  const addActivity = (idx) => updateStop(idx, "activities", [...(list[idx].activities || []), ""]);
  const updateActivity = (idx, ai, v) => {
    const cur = (list[idx].activities || []).slice();
    cur[ai] = v;
    updateStop(idx, "activities", cur);
  };
  const removeActivity = (idx, ai) => {
    const cur = (list[idx].activities || []).slice();
    cur.splice(ai, 1);
    updateStop(idx, "activities", cur);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.itinHint}>Add time-based stops — use ↑ ↓ to reorder.</Text>

      {list.map((it, i) => {
        const isBreak = it.type === "break";
        return (
          <View key={it.id || i} style={[styles.itinCard, isBreak && styles.itinCardBreak]}>
            {isBreak ? (
              <>
                {/* ===== Break — clean header + body ===== */}
                <View style={styles.itinBreakHead}>
                  <View style={styles.itinBreakIcon}><Ionicons name="cafe" size={15} color={C.emerald600} /></View>
                  <View style={styles.itinBreakBadge}><Text style={styles.itinBreakBadgeText}>BREAK</Text></View>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} style={[styles.itinActBtn, { opacity: i === 0 ? 0.3 : 1 }]}>
                    <Ionicons name="arrow-up" size={16} color={C.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => move(i, 1)} disabled={i === list.length - 1} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} style={[styles.itinActBtn, { opacity: i === list.length - 1 ? 0.3 : 1 }]}>
                    <Ionicons name="arrow-down" size={16} color={C.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeStop(i)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} style={styles.itinActBtn}>
                    <Ionicons name="trash-outline" size={15} color={C.red} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itinBreakBody}>
                  <TextInput
                    style={[styles.input, { marginBottom: 0 }]}
                    placeholder="Break note (e.g. Lunch, Tea break)"
                    placeholderTextColor="#9AA79E"
                    value={it.breakNote || ""}
                    onChangeText={(v) => updateStop(i, "breakNote", v)}
                  />
                  <View style={styles.itinDurRow}>
                    <View style={styles.itinDurIcon}><Ionicons name="time-outline" size={15} color={C.emerald600} /></View>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Duration (e.g. 45 minutes)"
                      placeholderTextColor="#9AA79E"
                      value={it.timeSpent || ""}
                      onChangeText={(v) => updateStop(i, "timeSpent", v)}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* ===== Stop ===== */}
                <View style={[styles.itinHeadRow, styles.itinHeadRowStop]}>
                  <TouchableOpacity onPress={() => setEmojiOpen(emojiOpen === i ? null : i)} style={styles.itinEmojiBtn} activeOpacity={0.8}>
                    <Text style={{ fontSize: 20 }}>{it.emoji || "📍"}</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.itinTimeInput} placeholder="Time" placeholderTextColor="#9AA79E" value={it.time || ""} onChangeText={(v) => updateStop(i, "time", v)} />
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Stop name (e.g. Fort Aguada)"
                    placeholderTextColor="#9AA79E"
                    value={it.title || ""}
                    onChangeText={(v) => updateStop(i, "title", v)}
                  />
                  <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} style={{ opacity: i === 0 ? 0.3 : 1, marginLeft: 6 }}>
                    <Ionicons name="arrow-up" size={16} color={C.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => move(i, 1)} disabled={i === list.length - 1} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} style={{ opacity: i === list.length - 1 ? 0.3 : 1, marginLeft: 6 }}>
                    <Ionicons name="arrow-down" size={16} color={C.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeStop(i)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} style={{ marginLeft: 6 }}>
                    <Ionicons name="trash-outline" size={15} color={C.red} />
                  </TouchableOpacity>
                </View>

                {emojiOpen === i && (
                  <View style={styles.itinEmojiPalette}>
                    {STOP_EMOJIS.map((em) => (
                      <TouchableOpacity key={em} onPress={() => { updateStop(i, "emoji", em); setEmojiOpen(null); }} style={styles.itinEmojiOpt} activeOpacity={0.8}>
                        <Text style={{ fontSize: 18 }}>{em}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={{ padding: 12, gap: 8 }}>
                  <TextInput style={[styles.input, styles.inputMultiline, { marginBottom: 0 }]} placeholder="Description of this stop…" placeholderTextColor="#9AA79E" value={it.description || ""} onChangeText={(v) => updateStop(i, "description", v)} multiline numberOfLines={2} textAlignVertical="top" />
                  <Text style={styles.itinSubLabel}>Activities / Highlights at this stop</Text>
                  {(it.activities || []).map((act, ai) => (
                    <View key={ai} style={styles.itinActRow}>
                      <Text style={styles.itinBullet}>•</Text>
                      <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="e.g. Lighthouse viewpoint" placeholderTextColor="#9AA79E" value={act} onChangeText={(v) => updateActivity(i, ai, v)} />
                      {(it.activities || []).length > 1 && (
                        <TouchableOpacity onPress={() => removeActivity(i, ai)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="close" size={15} color={C.subText} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity onPress={() => addActivity(i)} style={styles.itinAddAct} activeOpacity={0.8}>
                    <Ionicons name="add" size={14} color={C.emerald600} />
                    <Text style={styles.itinAddActText}>Add activity</Text>
                  </TouchableOpacity>
                  <View style={styles.itinTimeSpentRow}>
                    <Ionicons name="time-outline" size={15} color={C.subText} />
                    <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Time spent (e.g. 45 minutes)" placeholderTextColor="#9AA79E" value={it.timeSpent || ""} onChangeText={(v) => updateStop(i, "timeSpent", v)} />
                  </View>
                </View>
              </>
            )}
          </View>
        );
      })}

      {list.length === 0 && <Text style={styles.helper}>Add stops and breaks to outline the tour timeline.</Text>}

      <View style={styles.itinAddRow}>
        <TouchableOpacity onPress={addStop} style={styles.itinAddBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={16} color={C.emerald600} />
          <Text style={styles.itinAddBtnText}>Add Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={addBreak} style={styles.itinAddBtn} activeOpacity={0.85}>
          <Ionicons name="cafe" size={15} color={C.emerald600} />
          <Text style={styles.itinAddBtnText}>Add Break</Text>
        </TouchableOpacity>
      </View>
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
        placeholderTextColor="#9AA79E"
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
  headerGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -50, right: -40, width: 180, height: 180,
    borderRadius: 90, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 10, left: -55, width: 140, height: 140,
    borderRadius: 70, backgroundColor: "rgba(46,158,119,0.13)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  headerActionsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: DISPLAY, fontSize: 21, fontWeight: "bold", color: "#fff", letterSpacing: -0.3 },
  headerTitleBig: { fontFamily: DISPLAY, fontSize: 25, fontWeight: "bold", color: "#fff", letterSpacing: -0.5, marginTop: 10, marginLeft: 2 },
  headerSub: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 4, marginLeft: 2 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, minWidth: 48, alignItems: "center" },
  headerSaveText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 11.5 },
  // Hero header (reference-style)
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  hCircleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  heroKicker: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: "rgba(255,255,255,0.7)", letterSpacing: 2, marginTop: 18 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 30, fontWeight: "bold", color: "#fff", letterSpacing: -0.6, marginTop: 4 },
  heroSubtitle: { fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: "600", marginTop: 4 },

  // Progress dots
  progressRow: { flexDirection: "row", marginTop: 12, paddingHorizontal: 4 },
  progressItem: { flex: 1, alignItems: "center", gap: 4 },
  progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  progressDotDone: { backgroundColor: "#fff", borderColor: "#fff" },
  progressLabel: { fontFamily: DISPLAY, fontSize: 9.5, color: "rgba(255,255,255,0.85)", fontWeight: "bold", letterSpacing: 0.3 },

  scroll: { paddingTop: 4, paddingBottom: 24 },

  // Section toggle (collapsible card header)
  // Section header + card were two separate bordered, shadowed boxes joined
  // with marginTop:-1. That overlapped their hairlines into a doubled seam and
  // let the header cast its shadow onto the card right below it, so a section
  // read as two stacked boxes with a scar between them, not one panel.
  //
  // The header now rounds only its top, keeps its bottom border as the single
  // divider, and carries no shadow — the card under it lifts the whole block.
  sectionToggle: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: 14, paddingHorizontal: 15, paddingVertical: 14,
    backgroundColor: C.card,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 1, borderColor: C.border,
  },
  sectionToggleIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  // Ink, not the accent colour. The chip already carries the colour; colouring
  // the title too made every header shout at the same volume as its content.
  sectionToggleText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink, letterSpacing: -0.2 },
  sectionToggleSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, marginTop: 3, fontWeight: "600" },

  // Card (form sections)
  // Standalone card (the detailed-mode steps): rounded all round, own border.
  card: {
    marginHorizontal: 16, backgroundColor: C.card, borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: C.border, marginTop: 14,
    shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2,
  },
  // Attached card: continues the header above it, so no top edge of its own
  // and no gap — the header's bottom border is the divider between them.
  cardAttached: {
    marginTop: 0,
    borderTopWidth: 0,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },

  // Field
  field: { marginBottom: 14 },
  fieldLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 6 },
  helper: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 4, fontWeight: "600" },
  input: {
    fontFamily: DISPLAY,
    backgroundColor: "#F1F2EF", borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, color: C.ink, minHeight: 48,
  },
  inputMultiline: { minHeight: 80, paddingTop: 10 },

  row2: { flexDirection: "row", gap: 10 },

  // Prefix input
  prefixInputWrap: { flexDirection: "row", alignItems: "stretch" },
  prefixBox: { paddingHorizontal: 14, justifyContent: "center", backgroundColor: C.emerald50, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  prefixText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 16 },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },

  // Icon-prefixed number input
  iconInputWrap: { flexDirection: "row", alignItems: "stretch" },
  iconInputIcon: { width: 44, justifyContent: "center", alignItems: "center", borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  suffixBox: { paddingHorizontal: 12, justifyContent: "center", backgroundColor: "#F1F2EF", borderTopRightRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderLeftWidth: 0, borderColor: C.border },
  suffixText: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, fontWeight: "bold" },

  // Price type selector
  priceTypeRow: { flexDirection: "row", gap: 8 },
  priceTypeBtn: {
    flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, paddingHorizontal: 4, borderRadius: 14,
    backgroundColor: "#F1F2EF", borderWidth: 1.5, borderColor: C.border,
  },
  priceTypeText: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, fontWeight: "bold", textAlign: "center" },

  // Cancellation policy
  cancelRow: { flexDirection: "row", gap: 6 },
  cancelBtn: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: "#F1F2EF", borderWidth: 1.5, borderColor: C.border, minHeight: 70 },
  cancelLabel: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.3, marginBottom: 4 },
  cancelDesc: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "600", lineHeight: 14 },

  // Tag list
  tagHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tagCountBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tagCountText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold" },
  tagInputRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  tagAddBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#F1F2EF", borderWidth: 1 },
  tagText: { fontFamily: DISPLAY, fontSize: 12, color: C.text, fontWeight: "600", maxWidth: 180 },

  // Itinerary day rows
  addDayBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.purple },
  addDayText: { fontFamily: DISPLAY, color: "#fff", fontSize: 11, fontWeight: "bold" },
  dayRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  dayBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 4 },
  dayBadgeText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },
  dayContent: { flex: 1, backgroundColor: "#F1F2EF", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border },
  dayHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dayLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.purple, letterSpacing: 0.3 },
  // #6b — itinerary emoji + activities
  emojiChip: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  emojiChipSel: { borderColor: C.purple, backgroundColor: C.purpleLight, borderWidth: 2 },
  activityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  activityChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.purpleLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  activityChipText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: C.purple },
  activityAddRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  activityAddBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.purple, alignItems: "center", justifyContent: "center" },

  // Bottom bar with dual actions
  bottomBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  draftBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: C.emerald50, borderWidth: 1.5, borderColor: C.emerald600 },
  draftBtnText: { fontFamily: DISPLAY, color: C.emerald600, fontWeight: "bold", fontSize: 13.5 },
  publishBtnWrap: { flex: 1, borderRadius: 12, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  publishBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13.5 },

  // Category & location (D1/D2)
  pickerBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F2EF", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  pickerBtnText: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.ink, fontWeight: "bold" },
  locResults: { marginTop: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: "hidden" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.tintSand },
  locName: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, fontWeight: "bold" },
  locType: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold", textTransform: "uppercase", backgroundColor: C.tintSand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  locSelected: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: C.emerald50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  locSelectedText: { fontFamily: DISPLAY, flex: 1, fontSize: 12.5, color: C.emerald700, fontWeight: "bold" },

  // Vehicles (D5)
  vehSelRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: "#F1F2EF", marginBottom: 8 },
  vehSelRowActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  vehSelName: { fontFamily: DISPLAY, fontSize: 14, color: C.ink, fontWeight: "bold" },
  vehSelSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },

  // Advance payment (D6)
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: "#F1F2EF" },
  checkRowActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  checkRowText: { fontFamily: DISPLAY, flex: 1, fontSize: 13, color: C.text, fontWeight: "bold" },
  segRow: { flexDirection: "row", gap: 8 },
  segBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: "center", backgroundColor: "#F1F2EF" },
  segBtnActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  segText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.subText },
  segTextActive: { color: C.emerald700 },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F2EF", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, height: 46 },
  dateBtnText: { fontFamily: DISPLAY, flex: 1, fontSize: 13, color: C.ink, fontWeight: "bold" },

  // Price tiers (D4)
  tierRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tierInput: { width: 56, textAlign: "center", paddingHorizontal: 6, minHeight: 42 },
  tierDash: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, fontWeight: "bold" },
  tierPrice: { flex: 1, minHeight: 42 },

  // Category modal (D1)
  modalOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: C.scrim, justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, paddingTop: 16, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#F1F2EF" },
  catRowActive: { backgroundColor: C.emerald50 },
  catRowText: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.ink, fontWeight: "bold" },
  subCatRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, paddingHorizontal: 12, marginLeft: 18 },
  subCatText: { fontFamily: DISPLAY, fontSize: 13, color: C.text, fontWeight: "600" },

  // #6c — quick-mode banner
  quickBanner: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 3,
    backgroundColor: C.amberLight, borderWidth: 1, borderColor: "#E4CE97",
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    marginHorizontal: 16, marginTop: 6, marginBottom: 14,
  },
  quickBannerText: { fontFamily: DISPLAY, fontSize: 13, color: "#8A6420", fontWeight: "600", lineHeight: 19 },
  quickBannerLink: { fontFamily: DISPLAY, fontSize: 13, color: C.emerald700, fontWeight: "bold", lineHeight: 19 },

  // #6c — quick-mode category grid
  // Category picker.
  //
  // These were inline chips (row + wrap, width driven by the label). Category
  // names run long — "Adventure & Trekking", "Honeymoon Packages" — so a chip
  // filled most of the row and the next one wrapped under it: a ragged
  // one-per-line list that read as a stack, not a set of choices.
  //
  // Fixed two-column tiles instead. Percentage widths with space-between, so
  // the columns stay even on any screen without pixel arithmetic, and a long
  // name wraps inside its own tile instead of pushing the grid around.
  catGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  catTile: {
    width: "48.5%",
    marginBottom: 10,
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    alignItems: "center",
    minHeight: 88,
  },
  // 1.5 rather than a colour swap alone — on the tinted fill a 1dp emerald
  // hairline barely registers as "selected".
  catTileActive: {
    borderWidth: 1.5, borderColor: C.emerald500, backgroundColor: C.emerald50,
  },
  catTileIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.tintSand,
    alignItems: "center", justifyContent: "center",
    marginBottom: 7,
  },
  catTileIconActive: { backgroundColor: "#fff" },
  catTileEmoji: { fontSize: 17, includeFontPadding: false },
  catTileText: {
    fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.ink,
    textAlign: "center", lineHeight: 17,
  },
  catTileTextActive: { color: C.emerald700 },
  catTileCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.emerald600,
    alignItems: "center", justifyContent: "center",
  },

  // #6c — quick-mode duration chips
  durWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durChip: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: "#F1F2EF",
  },
  durChipActive: { borderColor: C.emerald500, backgroundColor: C.emerald50 },
  durChipText: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.text },
  durChipTextActive: { color: C.emerald700 },

  // ===== Quick Add — reference layout =====
  qSecHead: { marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  qSecTitle: { fontFamily: DISPLAY, fontSize: 19, fontWeight: "bold", color: C.ink, letterSpacing: -0.2 },
  qSecSub: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 2, fontWeight: "500" },
  qCatRow: { paddingHorizontal: 16, gap: 9, flexDirection: "row", paddingBottom: 4, paddingRight: 24 },
  qCatChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: "#fff",
    shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  qCatChipActive: { borderColor: C.emerald600, backgroundColor: C.emerald600 },
  qCatChipIcon: { fontSize: 15 },
  qCatChipText: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.text, maxWidth: 150 },
  qCatChipTextActive: { color: "#fff" },

  qCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  qCardTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, letterSpacing: -0.2 },
  qCardSub: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, marginTop: 2, fontWeight: "500" },

  qFieldRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  qBadge: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  qBadgeTxt: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold" },
  qInput: {
    flex: 1, fontFamily: DISPLAY,
    backgroundColor: "#F1F2EF", borderWidth: 1, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 15, paddingVertical: 13, fontSize: 14, color: C.ink, minHeight: 48,
  },
  qLocLinked: { flexDirection: "row", alignItems: "center", gap: 6 },

  qDurHead: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 },
  qDurTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  qDurSub: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, marginTop: 1, fontWeight: "500" },
  qDurGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 10, marginLeft: 52 },

  qPriceWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#F1F2EF", borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 15, minHeight: 48,
  },
  qPriceInput: { flex: 1, fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink, paddingVertical: 12 },
  qPriceSuffix: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.subText, letterSpacing: 0.5 },

  // Detailed-mode step wizard
  stepperRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 6, marginBottom: 16 },
  stepperDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "#E2DBCC",
    alignItems: "center", justifyContent: "center",
  },
  stepperDotCurrent: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.emerald600,
    borderWidth: 3, borderColor: C.emerald50,
    shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  stepperDotDone: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  stepperNum: { fontFamily: DISPLAY, fontSize: 13, fontWeight: "bold", color: C.subText },
  stepperLine: { flex: 1, height: 2.5, backgroundColor: "#E2DBCC", borderRadius: 2, marginHorizontal: 3 },
  stepperLineDone: { backgroundColor: C.emerald600 },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 14, marginTop: 2 },
  stepHeadIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: C.emerald50,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#DDEBE2",
  },
  stepHeadTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, letterSpacing: -0.2 },
  stepHeadSub: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, marginTop: 2, fontWeight: "500" },

  // Quick tour description formatting toolbar
  fmtToolbar: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  fmtBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: "#F1F2EF" },
  fmtBtnText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.ink },
  inputMultilineRich: { fontFamily: DISPLAY, minHeight: 200, paddingTop: 12, paddingBottom: 12, fontSize: 14, lineHeight: 22 },

  // AI "write with AI" affordance on the short description
  aiInputWrap: { flexDirection: "row", alignItems: "flex-start" },
  aiInlineBtn: {
    position: "absolute", right: 6, top: 0, bottom: 0, width: 38,
    alignItems: "center", justifyContent: "center",
  },
  aiHintRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  aiHintText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.emerald600 },

  // Itinerary (time-based stops + breaks)
  itinHint: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, marginBottom: 10, fontWeight: "600" },
  itinCard: { borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: "#fff", marginBottom: 10, overflow: "hidden" },
  itinCardBreak: { borderColor: "#CADFD1", backgroundColor: C.emerald50 },
  itinHeadRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 10 },
  itinHeadRowStop: { backgroundColor: "#F1F2EF", borderBottomWidth: 1, borderBottomColor: C.border },
  itinEmojiBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  itinBreakIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#DDEBE2", alignItems: "center", justifyContent: "center" },
  itinTimeInput: { fontFamily: DISPLAY, width: 78, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 8, height: 40, fontSize: 13, color: C.ink, backgroundColor: "#fff" },
  itinBreakBadge: { backgroundColor: "#DDEBE2", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  itinBreakBadgeText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", color: C.emerald700, letterSpacing: 0.6 },
  // Break — clean header + body
  itinBreakHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 9 },
  itinBreakBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 9 },
  itinDurRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itinDurIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DDEBE2", alignItems: "center", justifyContent: "center" },
  itinActBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  itinEmojiPalette: { flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 10, backgroundColor: "#F1F2EF", borderBottomWidth: 1, borderBottomColor: C.border },
  itinEmojiOpt: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  itinSubLabel: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: C.subText, marginTop: 2 },
  itinActRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itinBullet: { fontFamily: DISPLAY, fontSize: 16, color: C.subText, fontWeight: "bold" },
  itinAddAct: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4 },
  itinAddActText: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.emerald600 },
  itinTimeSpentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itinAddRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  itinAddBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: "#CADFD1", borderStyle: "dashed", backgroundColor: C.emerald50,
  },
  itinAddBtnText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: "bold", color: C.emerald700 },

  // Preset tag editor (inclusions / exclusions)
  presetWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 },
  presetChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: "#fff",
  },
  presetChipText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "600", color: C.subText },
  presetAddRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  presetAddBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  selectedChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, maxWidth: "100%",
  },
  selectedChipText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", flexShrink: 1 },

  // #6c — Quick/Detailed chooser overlay
  chooserOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end",
  },
  chooserCard: {
    backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28,
  },
  chooserHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: C.border, marginBottom: 14 },
  chooserTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: "bold", color: C.ink },
  chooserSub: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 4, marginBottom: 16 },
  chooserOpt: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F1F2EF", borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  chooserIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chooserOptTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink },
  chooserOptDesc: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, marginTop: 2, lineHeight: 16 },
  chooserCancel: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  chooserCancelText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.subText },

  // KYC document gate modal
  gateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.6)", alignItems: "center", justifyContent: "center", padding: 26,
  },
  gateCard: {
    width: "100%", maxWidth: 360, backgroundColor: C.card, borderRadius: 22,
    paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  gateIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.amberLight,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  gateLockBadge: {
    position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.amber, alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: C.card,
  },
  gateTitle: { fontFamily: DISPLAY, fontSize: 18.5, fontWeight: "bold", color: C.ink, textAlign: "center" },
  gateMsg: { fontFamily: DISPLAY, fontSize: 13.5, color: C.subText, textAlign: "center", marginTop: 8, lineHeight: 20 },

  gateStepsRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 4, paddingHorizontal: 4 },
  gateStep: { alignItems: "center", gap: 5, width: 92 },
  gateStepDotDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },
  gateStepDotCurrent: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.amber, alignItems: "center", justifyContent: "center" },
  gateStepDotNum: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 12 },
  gateStepText: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600", textAlign: "center" },
  gateStepLine: { flex: 1, height: 2, backgroundColor: C.border, marginBottom: 18, marginHorizontal: 2 },

  gatePrimary: {
    width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 18,
    shadowColor: C.emerald600, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  gatePrimaryInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52 },
  gatePrimaryText: { fontFamily: DISPLAY, color: "#fff", fontSize: 15.5, fontWeight: "bold" },
  gateSecondary: { width: "100%", alignItems: "center", paddingVertical: 13, marginTop: 2 },
  gateSecondaryText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.subText },

  // Live preview modal
  previewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  previewSheet: {
    backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: "92%", overflow: "hidden",
  },
  previewHandle: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#D8D0C0", marginTop: 8, marginBottom: 4,
  },
  previewHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  previewEyeChip: {
    width: 28, height: 28, borderRadius: 10, backgroundColor: C.emerald50,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(28,107,82,0.14)",
  },
  previewHeaderTitle: {
    fontFamily: DISPLAY, fontSize: 16.5, fontWeight: "bold", color: C.ink,
    includeFontPadding: false,
  },
  previewHeaderSub: {
    fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.subText,
    letterSpacing: 0.4, marginTop: 1, includeFontPadding: false,
  },
  previewClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.tintSand,
    alignItems: "center", justifyContent: "center",
  },

  // Cover hero — badge + image count sit on the photo, title stays in the body.
  previewCoverWrap: { position: "relative" },
  previewCover: { width: "100%", height: 190, backgroundColor: "#EDE7DB" },
  previewCoverScrim: { ...StyleSheet.absoluteFillObject },
  previewCoverEmpty: { alignItems: "center", justifyContent: "center", gap: 6 },
  previewEmptyText: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, fontWeight: "600" },
  previewBadge: {
    position: "absolute", top: 11, left: 12, maxWidth: "60%",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10, height: 24, justifyContent: "center", borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.22)",
  },
  previewBadgeText: {
    fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.emerald700,
    letterSpacing: 0.5, textTransform: "uppercase", includeFontPadding: false,
  },
  previewCountPill: {
    position: "absolute", top: 11, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, height: 24, borderRadius: 999,
    backgroundColor: "rgba(11,32,25,0.55)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  previewCountText: {
    fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: "#fff",
    includeFontPadding: false,
  },

  previewBody: { padding: 16 },
  previewTitle: {
    fontFamily: DISPLAY, fontSize: 21, fontWeight: "bold", color: C.ink,
    letterSpacing: -0.3, lineHeight: 26, includeFontPadding: false,
  },
  // Meta as tinted pills — the old version was loose icon + text.
  previewMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  previewMeta: {
    flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "100%",
    paddingHorizontal: 9, height: 26, borderRadius: 999,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "rgba(28,107,82,0.18)",
  },
  previewMetaText: {
    fontFamily: DISPLAY, fontSize: 11.5, color: C.emerald700, fontWeight: "bold",
    flexShrink: 1, includeFontPadding: false,
  },

  // Price plate — the one hard number, in its own emerald container.
  previewPriceCard: {
    marginTop: 14, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 14,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "rgba(28,107,82,0.2)",
  },
  previewPriceLabel: {
    fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", color: C.subText,
    letterSpacing: 0.8, textTransform: "uppercase", includeFontPadding: false,
  },
  previewPrice: {
    fontFamily: DISPLAY, fontSize: 21, fontWeight: "bold", color: C.emerald700,
    marginTop: 3, includeFontPadding: false,
  },

  // Editorial section header
  previewSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 9 },
  previewSectionIcon: {
    width: 26, height: 26, borderRadius: 9, backgroundColor: C.emerald50,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(28,107,82,0.12)",
  },
  previewSectionLabel: {
    fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink,
    flexShrink: 1, includeFontPadding: false,
  },
  previewSectionRule: { flex: 1, height: 1, backgroundColor: C.border, marginLeft: 2 },

  previewDesc: { fontFamily: DISPLAY, fontSize: 14, color: C.text, lineHeight: 21 },
  previewThumb: {
    width: 96, height: 96, borderRadius: 14, backgroundColor: "#EDE7DB",
    borderWidth: 1, borderColor: C.border,
  },
  previewFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.emerald50,
  },
  previewFooterText: {
    fontFamily: DISPLAY, fontSize: 12, color: C.emerald700, fontWeight: "bold",
    includeFontPadding: false,
  },
});

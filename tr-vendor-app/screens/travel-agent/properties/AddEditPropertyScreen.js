// screens/travel-agent/properties/AddEditPropertyScreen.js
// REDESIGNED (v2) — premium "Deep Emerald + Champagne" Add/Edit Property form.
// Circular progress-ring header, animated bubbles, self-contained section cards
// with completion badges, unified pill inputs.
// NOTE: UI-only redesign — all form state, handlers, payload shape and API
// calls are unchanged from the previous version.
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Animated, Easing, LayoutAnimation, UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import {
  createTravelAgentProperty,
  updateTravelAgentProperty,
  deleteTravelAgentProperty,
  PROPERTY_TYPE,
} from "../../api/travelAgentClient";
import ImagePickerField from "../_shared/ImagePickerField";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
function animate() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
  );
}

const GOLD = C.gold;               // champagne accent (matches header orb)
const FILL = "#FBF8F1";               // warm cream input fill
// Canonical Elevate hero gradient (was #0B211A — one shade off the dashboard).
const HEADER_GRAD = ["#0F2A22", "#16382E", "#1C6B52"];

const TYPE_META = {
  RESORT:      { icon: "umbrella",            color: "#C4703A", label: "Resort" },
  HOTEL:       { icon: "business",            color: C.blue,    label: "Hotel" },
  HOMESTAY:    { icon: "home",                color: C.emerald600, label: "Homestay" },
  APARTMENT:   { icon: "grid",               color: C.purple,  label: "Apartment" },
  VILLA:       { icon: "diamond",             color: "#B0567A", label: "Villa" },
  GUEST_HOUSE: { icon: "people",              color: C.amber,   label: "Guest house" },
  HOSTEL:      { icon: "bed",                 color: "#2C6E8C", label: "Hostel" },
  ROOMS:       { icon: "bed-outline",         color: C.subText, label: "Rooms" },
  OTHER:       { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const AMENITY_GROUPS = [
  {
    id: "essentials", label: "Essentials",
    items: [
      { id: "wifi",       label: "Free WiFi" },
      { id: "ac",         label: "Air Conditioning" },
      { id: "heating",    label: "Heating" },
      { id: "hot_water",  label: "Hot Water" },
      { id: "tv",         label: "Television" },
      { id: "washer",     label: "Washing Machine" },
      { id: "iron",       label: "Iron & Board" },
      { id: "hair_dryer", label: "Hair Dryer" },
    ],
  },
  {
    id: "facilities", label: "Facilities",
    items: [
      { id: "pool",            label: "Swimming Pool" },
      { id: "gym",             label: "Gym / Fitness" },
      { id: "restaurant",      label: "Restaurant" },
      { id: "spa",             label: "Spa & Wellness" },
      { id: "rooftop",         label: "Rooftop" },
      { id: "garden",          label: "Garden / Lawn" },
      { id: "conference_room", label: "Conference Room" },
      { id: "lounge",          label: "Lounge Area" },
    ],
  },
  {
    id: "parking", label: "Parking & Access",
    items: [
      { id: "free_parking", label: "Free Parking" },
      { id: "paid_parking", label: "Paid Parking" },
      { id: "elevator",     label: "Elevator / Lift" },
      { id: "wheelchair",   label: "Wheelchair Access" },
      { id: "24h_checkin",  label: "24/7 Check-in" },
      { id: "ev_charger",   label: "EV Charging" },
    ],
  },
  {
    id: "safety", label: "Safety & Security",
    items: [
      { id: "cctv",             label: "CCTV" },
      { id: "fire_extinguisher", label: "Fire Extinguisher" },
      { id: "first_aid",        label: "First Aid Kit" },
      { id: "security_guard",   label: "Security Guard" },
      { id: "smoke_alarm",      label: "Smoke Alarm" },
      { id: "safe_locker",      label: "In-room Safe" },
    ],
  },
  {
    id: "food", label: "Food & Kitchen",
    items: [
      { id: "breakfast",  label: "Breakfast Available" },
      { id: "all_meals",  label: "All Meals" },
      { id: "minibar",    label: "Minibar" },
      { id: "coffee_tea", label: "Tea / Coffee Maker" },
      { id: "microwave",  label: "Microwave" },
      { id: "fridge",     label: "Refrigerator" },
      { id: "kitchen",    label: "Shared Kitchen" },
    ],
  },
  {
    id: "outdoor", label: "Outdoor & Recreation",
    items: [
      { id: "bonfire",       label: "Bonfire Area" },
      { id: "bbq",           label: "BBQ / Grill" },
      { id: "adventure",     label: "Adventure Activities" },
      { id: "kids_play",     label: "Children's Play Area" },
      { id: "cycling",       label: "Cycling" },
      { id: "beach_access",  label: "Beach Access" },
    ],
  },
];

const CANCELLATION_POLICIES = [
  { value: "FLEXIBLE",       label: "Flexible",        desc: "Free cancel up to 24h before" },
  { value: "MODERATE",       label: "Moderate",        desc: "Free cancel up to 5 days before" },
  { value: "STRICT",         label: "Strict",          desc: "50% refund 7+ days before" },
  { value: "NON_REFUNDABLE", label: "Non-Refundable",  desc: "No refunds on cancellation" },
];

function toArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

// Circular completion ring for the header (SVG). Purely presentational.
function ProgressRing({ pct }) {
  const size = 54, stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const offset = circ * (1 - clamped / 100);
  return (
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
  );
}

export default function AddEditPropertyScreen({ navigation, route }) {
  const existing = route?.params?.property || null;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState(() => ({
    name:               existing?.name || "",
    propertyType:       existing?.propertyType || "RESORT",
    description:        existing?.description || "",
    highlights:         existing?.highlights || "",
    address:            existing?.address || "",
    city:               existing?.city || "",
    state:              existing?.state || "",
    pincode:            existing?.pincode || "",
    landmark:           existing?.landmark || "",
    latitude:           existing?.latitude != null ? String(existing.latitude) : "",
    longitude:          existing?.longitude != null ? String(existing.longitude) : "",
    totalRooms:         existing?.totalRooms ? String(existing.totalRooms) : "",
    bedroomsCount:      existing?.bedroomsCount ? String(existing.bedroomsCount) : "",
    bathroomsCount:     existing?.bathroomsCount ? String(existing.bathroomsCount) : "",
    maxGuests:          existing?.maxGuests ? String(existing.maxGuests) : "",
    startingPrice:      existing?.startingPrice ? String(existing.startingPrice) : "",
    minNights:          existing?.minNights ? String(existing.minNights) : "1",
    maxNights:          existing?.maxNights ? String(existing.maxNights) : "",
    cancellationPolicy: existing?.cancellationPolicy || "",
    amenityIds:         toArr(existing?.amenities).filter((a) => !a.startsWith("custom:")),
    customAmenities:    toArr(existing?.amenities).filter((a) => a.startsWith("custom:")).map((a) => a.replace(/^custom:/, "")),
    inclusions:         existing?.inclusions || "",
    exclusions:         existing?.exclusions || "",
    rules:              existing?.rules || "",
    checkInTime:        existing?.checkInTime || "14:00",
    checkOutTime:       existing?.checkOutTime || "11:00",
    coverImage:         existing?.coverImage || null,
    galleryImages:      toArr(existing?.galleryImages),
    isActive:           existing?.isActive !== false,
    isPublic:           !!existing?.isPublic,
  }));

  const [saving, setSaving] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [expanded, setExpanded] = useState({
    images: true, basics: true, location: false,
    capacity: false, amenities: false, content: false, policies: false,
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (id) =>
    setForm((p) => ({
      ...p,
      amenityIds: p.amenityIds.includes(id)
        ? p.amenityIds.filter((a) => a !== id)
        : [...p.amenityIds, id],
    }));

  const addCustomAmenity = () => {
    const val = customAmenityInput.trim();
    if (!val) return;
    if (form.customAmenities.includes(val)) { setCustomAmenityInput(""); return; }
    setForm((p) => ({ ...p, customAmenities: [...p.customAmenities, val] }));
    setCustomAmenityInput("");
  };

  const removeCustomAmenity = (val) =>
    setForm((p) => ({ ...p, customAmenities: p.customAmenities.filter((a) => a !== val) }));

  const canSave = form.name.trim().length >= 2 && !saving;
  const typeMeta = TYPE_META[form.propertyType] || TYPE_META.OTHER;

  const completedSections = useMemo(() => {
    let c = 0;
    if (form.coverImage) c++;
    if (form.name.trim() && form.propertyType) c++;
    if (form.city.trim() || form.address.trim()) c++;
    if (form.totalRooms || form.startingPrice) c++;
    if (form.amenityIds.length > 0 || form.customAmenities.length > 0) c++;
    return c;
  }, [form]);

  const pct = Math.round((completedSections / 5) * 100);

  // Per-section "has meaningful data" flags — drive the green check badges.
  // Presentational only (no effect on the payload).
  const done = {
    images: !!form.coverImage,
    basics: !!form.name.trim(),
    location: !!(form.city.trim() || form.address.trim()),
    capacity: !!(form.totalRooms || form.startingPrice),
    amenities: (form.amenityIds.length + form.customAmenities.length) > 0,
    content: !!(form.inclusions.trim() || form.exclusions.trim() || form.rules.trim()),
    policies: !!form.cancellationPolicy,
  };

  const save = async () => {
    if (!form.name.trim()) return Alert.alert("Required", "Property name is required.");
    const payload = {
      name:               form.name.trim(),
      propertyType:       form.propertyType,
      description:        form.description.trim() || null,
      highlights:         form.highlights.trim() || null,
      address:            form.address.trim() || null,
      city:               form.city.trim() || null,
      state:              form.state.trim() || null,
      pincode:            form.pincode.trim() || null,
      landmark:           form.landmark.trim() || null,
      latitude:           form.latitude ? Number(form.latitude) : null,
      longitude:          form.longitude ? Number(form.longitude) : null,
      totalRooms:         form.totalRooms ? Number(form.totalRooms) : 1,
      bedroomsCount:      form.bedroomsCount ? Number(form.bedroomsCount) : null,
      bathroomsCount:     form.bathroomsCount ? Number(form.bathroomsCount) : null,
      maxGuests:          form.maxGuests ? Number(form.maxGuests) : null,
      startingPrice:      form.startingPrice ? Number(form.startingPrice) : null,
      minNights:          form.minNights ? Number(form.minNights) : 1,
      maxNights:          form.maxNights ? Number(form.maxNights) : null,
      cancellationPolicy: form.cancellationPolicy || null,
      amenities:          (form.amenityIds.length > 0 || form.customAmenities.length > 0)
        ? JSON.stringify([...form.amenityIds, ...form.customAmenities.map((a) => `custom:${a}`)])
        : null,
      inclusions:         form.inclusions.trim() || null,
      exclusions:         form.exclusions.trim() || null,
      rules:              form.rules.trim() || null,
      checkInTime:        form.checkInTime || null,
      checkOutTime:       form.checkOutTime || null,
      coverImage:         form.coverImage || null,
      galleryImages:      form.galleryImages?.length ? JSON.stringify(form.galleryImages) : null,
      isActive:           form.isActive,
      isPublic:           form.isPublic,
    };
    try {
      setSaving(true);
      if (isEdit) await updateTravelAgentProperty(existing.id, payload);
      else await createTravelAgentProperty(payload);
      if (isEdit) navigation.goBack();
      else navigation.navigate("TAProperties");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!isEdit) return;
    Alert.alert("Delete property?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteTravelAgentProperty(existing.id); navigation.goBack(); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  const tog = (key) => { animate(); setExpanded((s) => ({ ...s, [key]: !s[key] })); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_GRAD[0]} />

      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {/* Top row — close · eyebrow · ring */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerEyebrow}>{isEdit ? "EDITING PROPERTY" : "NEW PROPERTY"}</Text>
            <ProgressRing pct={pct} />
          </View>

          {/* Title block — flush under eyebrow */}
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>{isEdit ? "Edit Property" : "Add Property"}</Text>
            <View style={styles.headerBadgeRow}>
              <View style={styles.typePill}>
                <Ionicons name={typeMeta.icon} size={11} color="#fff" />
                <Text style={styles.typePillText}>{typeMeta.label}</Text>
              </View>
              <Text style={styles.headerSub}>{completedSections} of 5 sections</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── PHOTOS ── */}
          <Section icon="image" color={C.purple} label="Photos"
            sub={`${form.coverImage ? "Cover ✓" : "No cover"} · ${form.galleryImages.length} gallery`}
            done={done.images} open={expanded.images} onToggle={() => tog("images")}>
            <ImagePickerField label="Cover photo" value={form.coverImage}
              onChange={(v) => update("coverImage", v)} folder="properties"
              helperText="Main photo shown on property cards." />
            <ImagePickerField label="Gallery (up to 20)" multi max={20}
              value={form.galleryImages} onChange={(v) => update("galleryImages", v)} folder="properties" />
          </Section>

          {/* ── BASICS ── */}
          <Section icon="business" color={C.emerald600} label="Listing Basics"
            sub={form.name ? form.name.slice(0, 32) : "Name · type · description"}
            done={done.basics} open={expanded.basics} onToggle={() => tog("basics")}>
            <Field label="Property name *">
              <TextInput style={styles.input} placeholder="e.g. Sunrise Beach Resort"
                placeholderTextColor="#A99F8D" value={form.name}
                onChangeText={(v) => update("name", v)} />
            </Field>

            <Field label="Property type">
              <View style={styles.typeGrid}>
                {PROPERTY_TYPE.map((t) => {
                  const meta = TYPE_META[t] || TYPE_META.OTHER;
                  const active = form.propertyType === t;
                  return (
                    <TouchableOpacity key={t}
                      style={[styles.typeTile, active && { backgroundColor: `${meta.color}14`, borderColor: meta.color }]}
                      onPress={() => update("propertyType", t)} activeOpacity={0.85}>
                      <View style={[styles.typeIconWrap, { backgroundColor: active ? meta.color : `${meta.color}18` }]}>
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

            <Field label="Description">
              <TextInput style={[styles.input, styles.inputMultiline]}
                placeholder="What makes this property special — ambiance, location, experience…"
                placeholderTextColor="#A99F8D" value={form.description}
                onChangeText={(v) => update("description", v)}
                multiline numberOfLines={4} textAlignVertical="top" />
            </Field>

            <Field label="Key highlights" helper="One per line — shown as bullet points">
              <TextInput style={[styles.input, styles.inputMultiline]}
                placeholder={"Stunning sea-facing rooms\nPrivate beach access\n10 min from airport"}
                placeholderTextColor="#A99F8D" value={form.highlights}
                onChangeText={(v) => update("highlights", v)}
                multiline numberOfLines={3} textAlignVertical="top" />
            </Field>
          </Section>

          {/* ── LOCATION ── */}
          <Section icon="location" color={C.blue} label="Location"
            sub={form.city ? `${form.city}${form.state ? `, ${form.state}` : ""}` : "Address · city · landmark"}
            done={done.location} open={expanded.location} onToggle={() => tog("location")}>
            <Field label="Street address">
              <TextInput style={[styles.input, styles.inputMultiline]}
                placeholder="Building, street, area"
                placeholderTextColor="#A99F8D" value={form.address}
                onChangeText={(v) => update("address", v)}
                multiline numberOfLines={2} textAlignVertical="top" />
            </Field>
            <View style={styles.row2}>
              <Field label="City" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="City"
                  placeholderTextColor="#A99F8D" value={form.city}
                  onChangeText={(v) => update("city", v)} />
              </Field>
              <Field label="State" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="State"
                  placeholderTextColor="#A99F8D" value={form.state}
                  onChangeText={(v) => update("state", v)} />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Pincode" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="6-digit pincode"
                  placeholderTextColor="#A99F8D" keyboardType="number-pad" maxLength={6}
                  value={form.pincode} onChangeText={(v) => update("pincode", v.replace(/\D/g, ""))} />
              </Field>
              <Field label="Nearby landmark" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="e.g. Near Baga Beach"
                  placeholderTextColor="#A99F8D" value={form.landmark}
                  onChangeText={(v) => update("landmark", v)} />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Latitude (optional)" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="e.g. 15.5527"
                  placeholderTextColor="#A99F8D" keyboardType="numbers-and-punctuation"
                  value={form.latitude} onChangeText={(v) => update("latitude", v.replace(/[^0-9.\-]/g, ""))} />
              </Field>
              <Field label="Longitude (optional)" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="e.g. 73.7771"
                  placeholderTextColor="#A99F8D" keyboardType="numbers-and-punctuation"
                  value={form.longitude} onChangeText={(v) => update("longitude", v.replace(/[^0-9.\-]/g, ""))} />
              </Field>
            </View>
          </Section>

          {/* ── CAPACITY & PRICING ── */}
          <Section icon="bed" color={C.amber} label="Capacity & Pricing"
            sub={[form.totalRooms && `${form.totalRooms} rooms`, form.startingPrice && `₹${form.startingPrice}/night`].filter(Boolean).join(" · ") || "Rooms · guests · price · stay"}
            done={done.capacity} open={expanded.capacity} onToggle={() => tog("capacity")}>
            <View style={styles.row2}>
              <Field label="Total rooms *" style={{ flex: 1 }}>
                <NumberInput value={form.totalRooms} placeholder="12"
                  onChange={(v) => update("totalRooms", v)} icon="bed" color={C.amber} />
              </Field>
              <Field label="Bedrooms" style={{ flex: 1 }}>
                <NumberInput value={form.bedroomsCount} placeholder="2"
                  onChange={(v) => update("bedroomsCount", v)} icon="bed-outline" color={C.blue} />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Bathrooms" style={{ flex: 1 }}>
                <NumberInput value={form.bathroomsCount} placeholder="2"
                  onChange={(v) => update("bathroomsCount", v)} icon="water" color={C.teal} />
              </Field>
              <Field label="Max guests" style={{ flex: 1 }}>
                <NumberInput value={form.maxGuests} placeholder="6"
                  onChange={(v) => update("maxGuests", v)} icon="people" color={C.purple} />
              </Field>
            </View>
            <Field label="Starting price (₹ / night)">
              <View style={styles.prefixInputWrap}>
                <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                <TextInput style={[styles.input, styles.prefixInput]} placeholder="3500"
                  placeholderTextColor="#A99F8D" keyboardType="number-pad"
                  value={form.startingPrice}
                  onChangeText={(v) => update("startingPrice", v.replace(/[^\d.]/g, ""))} />
              </View>
            </Field>
            <View style={styles.row2}>
              <Field label="Min nights" style={{ flex: 1 }}>
                <NumberInput value={form.minNights} placeholder="1"
                  onChange={(v) => update("minNights", v)} icon="moon" color={C.emerald600} />
              </Field>
              <Field label="Max nights" style={{ flex: 1 }}>
                <NumberInput value={form.maxNights} placeholder="No limit"
                  onChange={(v) => update("maxNights", v)} icon="moon-outline" color={C.subText} />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Check-in" style={{ flex: 1 }}>
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}18` }]}>
                    <Ionicons name="log-in" size={15} color={C.emerald600} />
                  </View>
                  <TextInput style={[styles.input, styles.iconInputField]} placeholder="14:00"
                    placeholderTextColor="#A99F8D" value={form.checkInTime}
                    onChangeText={(v) => update("checkInTime", v)} />
                </View>
              </Field>
              <Field label="Check-out" style={{ flex: 1 }}>
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}18` }]}>
                    <Ionicons name="log-out" size={15} color={C.red} />
                  </View>
                  <TextInput style={[styles.input, styles.iconInputField]} placeholder="11:00"
                    placeholderTextColor="#A99F8D" value={form.checkOutTime}
                    onChangeText={(v) => update("checkOutTime", v)} />
                </View>
              </Field>
            </View>
          </Section>

          {/* ── AMENITIES ── */}
          <Section icon="star" color={C.teal} label="Amenities"
            sub={(form.amenityIds.length + form.customAmenities.length) > 0 ? `${form.amenityIds.length + form.customAmenities.length} selected` : "WiFi · Pool · AC · Parking…"}
            done={done.amenities} open={expanded.amenities} onToggle={() => tog("amenities")}>
            {AMENITY_GROUPS.map((group) => (
              <View key={group.id} style={styles.amenityGroup}>
                <Text style={styles.amenityGroupLabel}>{group.label}</Text>
                <View style={styles.amenityGrid}>
                  {group.items.map((item) => {
                    const selected = form.amenityIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.amenityChip, selected && styles.amenityChipActive]}
                        onPress={() => toggleAmenity(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.amenityCheckbox, selected && styles.amenityCheckboxActive]}>
                          {selected && <Ionicons name="checkmark" size={10} color="#fff" />}
                        </View>
                        <Text style={[styles.amenityChipText, selected && styles.amenityChipTextActive]} numberOfLines={1}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            {/* Custom amenity input */}
            <View style={styles.customAmenitySection}>
              <Text style={styles.amenityGroupLabel}>Add Custom Amenity</Text>
              <View style={styles.customAmenityRow}>
                <TextInput
                  style={[styles.input, styles.customAmenityInput]}
                  placeholder="e.g. Bonfire area, Telescope…"
                  placeholderTextColor="#A99F8D"
                  value={customAmenityInput}
                  onChangeText={setCustomAmenityInput}
                  onSubmitEditing={addCustomAmenity}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.customAmenityAddBtn, !customAmenityInput.trim() && { opacity: 0.4 }]}
                  onPress={addCustomAmenity}
                  disabled={!customAmenityInput.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {form.customAmenities.length > 0 && (
                <View style={styles.customTagsRow}>
                  {form.customAmenities.map((a) => (
                    <View key={a} style={styles.customTag}>
                      <Text style={styles.customTagText}>{a}</Text>
                      <TouchableOpacity onPress={() => removeCustomAmenity(a)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close" size={13} color={C.emerald700} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {(form.amenityIds.length + form.customAmenities.length) > 0 && (
              <View style={styles.amenityCountRow}>
                <Ionicons name="checkmark-circle" size={14} color={C.emerald600} />
                <Text style={styles.amenityCount}>
                  {form.amenityIds.length + form.customAmenities.length} amenit{(form.amenityIds.length + form.customAmenities.length) === 1 ? "y" : "ies"} selected
                </Text>
              </View>
            )}
          </Section>

          {/* ── INCLUSIONS / EXCLUSIONS / RULES ── */}
          <Section icon="list" color={C.purple} label="Inclusions & Rules"
            sub={`${countLines(form.inclusions)}I · ${countLines(form.exclusions)}E · ${countLines(form.rules)}R`}
            done={done.content} open={expanded.content} onToggle={() => tog("content")}>
            <LinesField label="Inclusions" icon="checkmark-circle" color={C.emerald600}
              placeholder={"Daily breakfast\nWelcome drink\nAll taxes"}
              value={form.inclusions} onChange={(v) => update("inclusions", v)} />
            <LinesField label="Exclusions" icon="close-circle" color={C.red}
              placeholder={"Lunch & dinner\nPersonal expenses"}
              value={form.exclusions} onChange={(v) => update("exclusions", v)} />
            <LinesField label="House rules" icon="shield-checkmark" color={C.blue}
              placeholder={"No smoking inside\nNo pets\nQuiet hours 10 PM – 7 AM"}
              value={form.rules} onChange={(v) => update("rules", v)} />
          </Section>

          {/* ── CANCELLATION POLICY ── */}
          <Section icon="shield" color={C.amber} label="Cancellation Policy"
            sub={form.cancellationPolicy
              ? CANCELLATION_POLICIES.find((c) => c.value === form.cancellationPolicy)?.label || ""
              : "Select cancellation terms"}
            done={done.policies} open={expanded.policies} onToggle={() => tog("policies")}>
            <Field label="Select a policy">
              <View style={styles.policyGrid}>
                {CANCELLATION_POLICIES.map((cp) => {
                  const active = form.cancellationPolicy === cp.value;
                  return (
                    <TouchableOpacity key={cp.value}
                      style={[styles.policyCard, active && styles.policyCardActive]}
                      onPress={() => update("cancellationPolicy", active ? "" : cp.value)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.policyTitle, active && styles.policyTitleActive]}>
                        {cp.label}
                      </Text>
                      <Text style={styles.policyDesc} numberOfLines={2}>{cp.desc}</Text>
                      {active && (
                        <View style={styles.policyCheck}>
                          <Ionicons name="checkmark-circle" size={16} color={C.emerald600} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>
          </Section>

          {/* Active + Publish toggles */}
          <View style={styles.togglesRow}>
            <TouchableOpacity
              style={[styles.toggleCard, form.isActive && { borderColor: C.emerald600, backgroundColor: C.emerald50 }]}
              onPress={() => update("isActive", !form.isActive)} activeOpacity={0.85}
            >
              <View style={[styles.toggleIconWrap, { backgroundColor: form.isActive ? C.emerald600 : C.border }]}>
                <Ionicons name={form.isActive ? "checkmark" : "close"} size={16} color="#fff" />
              </View>
              <Text style={[styles.toggleTitle, form.isActive && { color: C.emerald700 }]}>Active</Text>
              <Text style={styles.toggleSub}>
                {form.isActive ? "Listing is live" : "Hidden"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleCard, form.isPublic && { borderColor: C.purple, backgroundColor: C.purpleLight }]}
              onPress={() => update("isPublic", !form.isPublic)} activeOpacity={0.85}
            >
              <View style={[styles.toggleIconWrap, { backgroundColor: form.isPublic ? C.purple : C.border }]}>
                <Ionicons name={form.isPublic ? "globe" : "globe-outline"} size={16} color="#fff" />
              </View>
              <Text style={[styles.toggleTitle, form.isPublic && { color: C.purple }]}>
                {form.isPublic ? "Published" : "Unpublished"}
              </Text>
              <Text style={styles.toggleSub}>
                {form.isPublic ? "Visible publicly" : "Draft only"}
              </Text>
            </TouchableOpacity>
          </View>

          {isEdit && (
            <TouchableOpacity style={styles.dangerCard} onPress={onDelete} activeOpacity={0.85}>
              <View style={styles.dangerIcon}>
                <Ionicons name="trash" size={16} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerTitle}>Delete property</Text>
                <Text style={styles.dangerSub}>Permanently remove — this cannot be undone</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.red} />
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.publishBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save} disabled={!canSave} activeOpacity={0.9}>
          <LinearGradient colors={[C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.publishBtnInner}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.publishBtnText}>{isEdit ? "Save Changes" : "Create Property"}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Sub-components ── */

// Self-contained rounded section card: tappable header + (when open) an
// animated body separated by a hairline divider.
function Section({ icon, color, label, sub, open, onToggle, done, children }) {
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

function NumberInput({ value, placeholder, onChange, icon, color }) {
  return (
    <View style={styles.iconInputWrap}>
      <View style={[styles.iconInputIcon, { backgroundColor: `${color || C.emerald600}18` }]}>
        <Ionicons name={icon || "ellipse"} size={15} color={color || C.emerald600} />
      </View>
      <TextInput
        style={[styles.input, styles.iconInputField]}
        placeholder={placeholder} placeholderTextColor="#A99F8D"
        keyboardType="number-pad" value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, ""))} />
    </View>
  );
}

function LinesField({ label, icon, color, placeholder, value, onChange }) {
  const count = countLines(value);
  return (
    <View style={styles.field}>
      <View style={styles.linesHeader}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={[styles.fieldLabel, { color, marginBottom: 0 }]}>{label}</Text>
        {count > 0 && (
          <View style={[styles.linesCountBadge, { backgroundColor: `${color}22` }]}>
            <Text style={[styles.linesCountText, { color }]}>{count}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={styles.linesHint}>One per line</Text>
      </View>
      <TextInput style={[styles.input, styles.inputMultiline]}
        placeholder={placeholder} placeholderTextColor="#A99F8D"
        value={value} onChangeText={onChange}
        multiline numberOfLines={4} textAlignVertical="top" />
    </View>
  );
}

function countLines(s) {
  if (!s) return 0;
  return s.split("\n").filter((l) => l.trim()).length;
}

const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: "hidden", position: "relative" },
  orbA: {
    position: "absolute", top: -44, right: -28,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", bottom: -36, left: -32,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(46,158,119,0.14)",
  },
  headerTopRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  headerCircleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  headerEyebrow: {
    flex: 1, marginLeft: 12, alignSelf: "center",
    fontFamily: DISPLAY, color: GOLD, fontSize: 10, fontWeight: "bold",
    letterSpacing: 1.8, textTransform: "uppercase",
  },
  // marginLeft = close btn width (40) + gap (12) → title lines up under eyebrow
  headerTitleBlock: { marginTop: -15, marginLeft: 52 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: "bold", color: "#fff", letterSpacing: 0.2, lineHeight: 23 },
  headerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
  },
  typePillText: { fontFamily: DISPLAY, color: "#fff", fontSize: 10.5, fontWeight: "bold", letterSpacing: 0.3 },
  headerSub: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.72)", fontSize: 11.5, fontWeight: "600" },
  ringPct: { fontFamily: DISPLAY, color: "#fff", fontSize: 11, fontWeight: "bold", letterSpacing: 0 },

  scroll: { paddingTop: 8, paddingBottom: 24 },

  // Section card
  section: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#2A2216", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
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
  sectionLabel: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", color: C.ink, letterSpacing: 0.2 },
  sectionSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, marginTop: 3, fontWeight: "600" },
  chevWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  sectionBody: { borderTopWidth: 1, borderTopColor: C.border, padding: 16, paddingTop: 15 },

  // Field
  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 7 },
  helper: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 5, fontWeight: "600" },
  input: { fontFamily: DISPLAY, backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14.5, color: C.ink, minHeight: 52 },
  inputMultiline: { minHeight: 96, paddingTop: 13 },
  row2: { flexDirection: "row", gap: 12 },

  // Type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeTile: { width: "31.5%", paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border, alignItems: "center", gap: 7 },
  typeIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontFamily: DISPLAY, fontSize: 11, color: C.text, fontWeight: "bold", textAlign: "center" },

  // ₹ prefix input (unified pill)
  prefixInputWrap: { flexDirection: "row", alignItems: "stretch", backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, overflow: "hidden" },
  prefixBox: { paddingHorizontal: 16, justifyContent: "center", backgroundColor: C.emerald50 },
  prefixText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 16 },
  prefixInput: { flex: 1, borderWidth: 0, backgroundColor: "transparent", borderRadius: 0 },

  // Icon-prefix input (unified pill)
  iconInputWrap: { flexDirection: "row", alignItems: "stretch", backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, overflow: "hidden" },
  iconInputIcon: { width: 48, justifyContent: "center", alignItems: "center" },
  iconInputField: { flex: 1, borderWidth: 0, backgroundColor: "transparent", borderRadius: 0 },

  // Amenity checkbox grid
  amenityGroup: { marginBottom: 16 },
  amenityGroupLabel: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.subText, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 9 },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: FILL },
  amenityChipActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  amenityCheckbox: { width: 15, height: 15, borderRadius: 4, borderWidth: 1.5, borderColor: "#C9C1B2", alignItems: "center", justifyContent: "center" },
  amenityCheckboxActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  amenityChipText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.text, fontWeight: "600" },
  amenityChipTextActive: { color: C.emerald700, fontWeight: "bold" },
  amenityCountRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  amenityCount: { fontFamily: DISPLAY, fontSize: 12, color: C.emerald700, fontWeight: "bold" },

  customAmenitySection: { marginTop: 6, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  customAmenityRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  customAmenityInput: { flex: 1, minHeight: 50 },
  customAmenityAddBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },
  customTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  customTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald600 },
  customTagText: { fontFamily: DISPLAY, fontSize: 12, color: C.emerald700, fontWeight: "bold" },

  // Cancellation policy cards
  policyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  policyCard: { width: "47.5%", padding: 13, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: FILL },
  policyCardActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  policyTitle: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.ink, marginBottom: 4 },
  policyTitleActive: { color: C.emerald700 },
  policyDesc: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, lineHeight: 14 },
  policyCheck: { position: "absolute", top: 9, right: 9 },

  linesHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 9 },
  linesCountBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  linesCountText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold" },
  linesHint: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "600", fontStyle: "italic" },

  // Toggles
  togglesRow: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 14 },
  toggleCard: { flex: 1, alignItems: "center", gap: 6, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  toggleIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  toggleTitle: { fontFamily: DISPLAY, fontSize: 13, color: C.text, fontWeight: "bold", textAlign: "center" },
  toggleSub: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "600", textAlign: "center" },

  // Danger zone
  dangerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: 14,
    padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.redLight, backgroundColor: "#FBF1EF",
  },
  dangerIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.redLight, alignItems: "center", justifyContent: "center" },
  dangerTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.red },
  dangerSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },

  // Bottom save bar
  bottomBar: {
    flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 26 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#2A2216", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 16 },
    }),
  },
  publishBtnWrap: { flex: 1, borderRadius: 16, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  publishBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15, letterSpacing: 0.3 },
});

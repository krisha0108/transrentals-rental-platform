// screens/travel-agent/properties/AddEditPropertyScreen.js
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  createTravelAgentProperty,
  updateTravelAgentProperty,
  deleteTravelAgentProperty,
  PROPERTY_TYPE,
} from "../../api/travelAgentClient";
import ImagePickerField from "../_shared/ImagePickerField";

const C = {
  emerald600: "#059669", emerald700: "#047857", emerald500: "#10B981",
  emerald50: "#ECFDF5", ink: "#0F172A", text: "#334155", subText: "#64748B",
  bg: "#F6F8FB", card: "#FFFFFF", border: "#E6EDF5",
  blue: "#3B82F6", blueLight: "#EFF6FF",
  red: "#EF4444", redLight: "#FEE2E2",
  green: "#10B981", amber: "#F59E0B", amberLight: "#FEF3C7",
  purple: "#8B5CF6", purpleLight: "#EDE9FE", teal: "#0D9488",
};

const TYPE_META = {
  RESORT:      { icon: "umbrella",            color: "#F97316", label: "Resort" },
  HOTEL:       { icon: "business",            color: C.blue,    label: "Hotel" },
  HOMESTAY:    { icon: "home",                color: C.emerald600, label: "Homestay" },
  APARTMENT:   { icon: "grid",               color: C.purple,  label: "Apartment" },
  VILLA:       { icon: "diamond",             color: "#EC4899", label: "Villa" },
  GUEST_HOUSE: { icon: "people",              color: C.amber,   label: "Guest house" },
  HOSTEL:      { icon: "bed",                 color: "#06B6D4", label: "Hostel" },
  ROOMS:       { icon: "bed-outline",         color: "#64748B", label: "Rooms" },
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

  const tog = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

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
              <Text style={styles.headerTitle}>{isEdit ? "Edit Property" : "Add Property"}</Text>
              <Text style={styles.headerSub}>
                {completedSections}/5 sections · {typeMeta.label}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.headerSaveBtn, !canSave && { opacity: 0.5 }]}
              onPress={save} disabled={!canSave}
            >
              {saving ? <ActivityIndicator size="small" color={C.emerald700} />
                : <Text style={styles.headerSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {["Photos", "Basics", "Location", "Capacity", "Amenities"].map((label, i) => (
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

          {/* ── PHOTOS ── */}
          <SectionToggle icon="image" color={C.purple} label="Photos"
            sub={`${form.coverImage ? "Cover ✓" : "No cover"} · ${form.galleryImages.length} gallery`}
            open={expanded.images} onToggle={() => tog("images")} />
          {expanded.images && (
            <Card>
              <ImagePickerField label="Cover photo" value={form.coverImage}
                onChange={(v) => update("coverImage", v)} folder="properties"
                helperText="Main photo shown on property cards." />
              <ImagePickerField label="Gallery (up to 8)" multi max={8}
                value={form.galleryImages} onChange={(v) => update("galleryImages", v)} folder="properties" />
            </Card>
          )}

          {/* ── BASICS ── */}
          <SectionToggle icon="business" color={C.emerald600} label="Listing Basics"
            sub={form.name ? form.name.slice(0, 32) : "Name · type · description"}
            open={expanded.basics} onToggle={() => tog("basics")} />
          {expanded.basics && (
            <Card>
              <Field label="Property name *">
                <TextInput style={styles.input} placeholder="e.g. Sunrise Beach Resort"
                  placeholderTextColor="#A3B3C2" value={form.name}
                  onChangeText={(v) => update("name", v)} />
              </Field>

              <Field label="Property type">
                <View style={styles.typeGrid}>
                  {PROPERTY_TYPE.map((t) => {
                    const meta = TYPE_META[t] || TYPE_META.OTHER;
                    const active = form.propertyType === t;
                    return (
                      <TouchableOpacity key={t}
                        style={[styles.typeTile, active && { backgroundColor: `${meta.color}1A`, borderColor: meta.color }]}
                        onPress={() => update("propertyType", t)} activeOpacity={0.85}>
                        <View style={[styles.typeIconWrap, { backgroundColor: active ? meta.color : `${meta.color}22` }]}>
                          <Ionicons name={meta.icon} size={16} color={active ? "#fff" : meta.color} />
                        </View>
                        <Text style={[styles.typeLabel, active && { color: meta.color, fontWeight: "800" }]}>
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
                  placeholderTextColor="#A3B3C2" value={form.description}
                  onChangeText={(v) => update("description", v)}
                  multiline numberOfLines={4} textAlignVertical="top" />
              </Field>

              <Field label="Key highlights" helper="One per line — shown as bullet points">
                <TextInput style={[styles.input, styles.inputMultiline]}
                  placeholder={"Stunning sea-facing rooms\nPrivate beach access\n10 min from airport"}
                  placeholderTextColor="#A3B3C2" value={form.highlights}
                  onChangeText={(v) => update("highlights", v)}
                  multiline numberOfLines={3} textAlignVertical="top" />
              </Field>
            </Card>
          )}

          {/* ── LOCATION ── */}
          <SectionToggle icon="location" color={C.blue} label="Location"
            sub={form.city ? `${form.city}${form.state ? `, ${form.state}` : ""}` : "Address · city · landmark"}
            open={expanded.location} onToggle={() => tog("location")} />
          {expanded.location && (
            <Card>
              <Field label="Street address">
                <TextInput style={[styles.input, styles.inputMultiline]}
                  placeholder="Building, street, area"
                  placeholderTextColor="#A3B3C2" value={form.address}
                  onChangeText={(v) => update("address", v)}
                  multiline numberOfLines={2} textAlignVertical="top" />
              </Field>
              <View style={styles.row2}>
                <Field label="City" style={{ flex: 1 }}>
                  <TextInput style={styles.input} placeholder="City"
                    placeholderTextColor="#A3B3C2" value={form.city}
                    onChangeText={(v) => update("city", v)} />
                </Field>
                <Field label="State" style={{ flex: 1 }}>
                  <TextInput style={styles.input} placeholder="State"
                    placeholderTextColor="#A3B3C2" value={form.state}
                    onChangeText={(v) => update("state", v)} />
                </Field>
              </View>
              <View style={styles.row2}>
                <Field label="Pincode" style={{ flex: 1 }}>
                  <TextInput style={styles.input} placeholder="6-digit pincode"
                    placeholderTextColor="#A3B3C2" keyboardType="number-pad" maxLength={6}
                    value={form.pincode} onChangeText={(v) => update("pincode", v.replace(/\D/g, ""))} />
                </Field>
                <Field label="Nearby landmark" style={{ flex: 1 }}>
                  <TextInput style={styles.input} placeholder="e.g. Near Baga Beach"
                    placeholderTextColor="#A3B3C2" value={form.landmark}
                    onChangeText={(v) => update("landmark", v)} />
                </Field>
              </View>
            </Card>
          )}

          {/* ── CAPACITY & PRICING ── */}
          <SectionToggle icon="bed" color={C.amber} label="Capacity & Pricing"
            sub={[form.totalRooms && `${form.totalRooms} rooms`, form.startingPrice && `₹${form.startingPrice}/night`].filter(Boolean).join(" · ") || "Rooms · guests · price · stay"}
            open={expanded.capacity} onToggle={() => tog("capacity")} />
          {expanded.capacity && (
            <Card>
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
                    placeholderTextColor="#A3B3C2" keyboardType="number-pad"
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
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}22` }]}>
                      <Ionicons name="log-in" size={14} color={C.emerald600} />
                    </View>
                    <TextInput style={[styles.input, styles.iconInputField]} placeholder="14:00"
                      placeholderTextColor="#A3B3C2" value={form.checkInTime}
                      onChangeText={(v) => update("checkInTime", v)} />
                  </View>
                </Field>
                <Field label="Check-out" style={{ flex: 1 }}>
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}22` }]}>
                      <Ionicons name="log-out" size={14} color={C.red} />
                    </View>
                    <TextInput style={[styles.input, styles.iconInputField]} placeholder="11:00"
                      placeholderTextColor="#A3B3C2" value={form.checkOutTime}
                      onChangeText={(v) => update("checkOutTime", v)} />
                  </View>
                </Field>
              </View>
            </Card>
          )}

          {/* ── AMENITIES ── */}
          <SectionToggle icon="star" color={C.teal} label="Amenities"
            sub={(form.amenityIds.length + form.customAmenities.length) > 0 ? `${form.amenityIds.length + form.customAmenities.length} selected` : "WiFi · Pool · AC · Parking…"}
            open={expanded.amenities} onToggle={() => tog("amenities")} />
          {expanded.amenities && (
            <Card>
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
                    placeholderTextColor="#A3B3C2"
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
            </Card>
          )}

          {/* ── INCLUSIONS / EXCLUSIONS / RULES ── */}
          <SectionToggle icon="list" color={C.purple} label="Inclusions & Rules"
            sub={`${countLines(form.inclusions)}I · ${countLines(form.exclusions)}E · ${countLines(form.rules)}R`}
            open={expanded.content} onToggle={() => tog("content")} />
          {expanded.content && (
            <Card>
              <LinesField label="Inclusions" icon="checkmark-circle" color={C.emerald600}
                placeholder={"Daily breakfast\nWelcome drink\nAll taxes"}
                value={form.inclusions} onChange={(v) => update("inclusions", v)} />
              <LinesField label="Exclusions" icon="close-circle" color={C.red}
                placeholder={"Lunch & dinner\nPersonal expenses"}
                value={form.exclusions} onChange={(v) => update("exclusions", v)} />
              <LinesField label="House rules" icon="shield-checkmark" color={C.blue}
                placeholder={"No smoking inside\nNo pets\nQuiet hours 10 PM – 7 AM"}
                value={form.rules} onChange={(v) => update("rules", v)} />
            </Card>
          )}

          {/* ── CANCELLATION POLICY ── */}
          <SectionToggle icon="shield" color={C.amber} label="Cancellation Policy"
            sub={form.cancellationPolicy
              ? CANCELLATION_POLICIES.find((c) => c.value === form.cancellationPolicy)?.label || ""
              : "Select cancellation terms"}
            open={expanded.policies} onToggle={() => tog("policies")} />
          {expanded.policies && (
            <Card>
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
            </Card>
          )}

          {/* Active + Publish toggles */}
          <View style={styles.togglesRow}>
            <TouchableOpacity
              style={[styles.toggleCard, form.isActive && { borderColor: C.emerald600, backgroundColor: C.emerald50 }]}
              onPress={() => update("isActive", !form.isActive)} activeOpacity={0.85}
            >
              <View style={[styles.toggleIconWrap, { backgroundColor: form.isActive ? C.emerald600 : "#E2E8F0" }]}>
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
              <View style={[styles.toggleIconWrap, { backgroundColor: form.isPublic ? C.purple : "#E2E8F0" }]}>
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
            <SectionToggle icon="alert-circle" color={C.red} label="Danger zone"
              sub="Delete this property permanently"
              open={false} onToggle={onDelete} showChevron={false}
              actionIcon="trash" actionColor={C.red} />
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.publishBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save} disabled={!canSave} activeOpacity={0.9}>
          <LinearGradient colors={[C.emerald600, C.emerald700]}
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
      {showChevron
        ? <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={color} />
        : <Ionicons name={actionIcon || "chevron-forward"} size={18} color={actionColor || color} />}
    </TouchableOpacity>
  );
}

function NumberInput({ value, placeholder, onChange, icon, color }) {
  return (
    <View style={styles.iconInputWrap}>
      <View style={[styles.iconInputIcon, { backgroundColor: `${color || C.emerald600}22` }]}>
        <Ionicons name={icon || "ellipse"} size={14} color={color || C.emerald600} />
      </View>
      <TextInput
        style={[styles.input, styles.iconInputField]}
        placeholder={placeholder} placeholderTextColor="#A3B3C2"
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
        placeholder={placeholder} placeholderTextColor="#A3B3C2"
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
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, minWidth: 60, alignItems: "center" },
  headerSaveText: { color: C.emerald700, fontWeight: "800", fontSize: 13 },

  progressRow: { flexDirection: "row", marginTop: 12, paddingHorizontal: 4 },
  progressItem: { flex: 1, alignItems: "center", gap: 4 },
  progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  progressDotDone: { backgroundColor: "#fff", borderColor: "#fff" },
  progressLabel: { fontSize: 9, color: "rgba(255,255,255,0.85)", fontWeight: "700", letterSpacing: 0.2 },

  scroll: { paddingTop: 4, paddingBottom: 24 },

  sectionToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  sectionToggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionToggleText: { fontSize: 13.5, fontWeight: "800", letterSpacing: 0.3 },
  sectionToggleSub: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },

  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginTop: -1, borderTopLeftRadius: 0, borderTopRightRadius: 0 },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 },
  helper: { fontSize: 11, color: C.subText, marginTop: 4, fontWeight: "600" },
  input: { backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46 },
  inputMultiline: { minHeight: 90, paddingTop: 10 },
  row2: { flexDirection: "row", gap: 10 },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeTile: { width: "31%", paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border, alignItems: "center", gap: 6 },
  typeIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontSize: 11, color: C.text, fontWeight: "700", textAlign: "center" },

  prefixInputWrap: { flexDirection: "row", alignItems: "stretch" },
  prefixBox: { paddingHorizontal: 14, justifyContent: "center", backgroundColor: C.emerald50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  prefixText: { color: C.emerald700, fontWeight: "800", fontSize: 16 },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },

  iconInputWrap: { flexDirection: "row", alignItems: "stretch" },
  iconInputIcon: { width: 44, justifyContent: "center", alignItems: "center", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  iconInputField: { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

  // Amenity checkbox grid
  amenityGroup: { marginBottom: 14 },
  amenityGroupLabel: { fontSize: 11, fontWeight: "800", color: C.subText, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  amenityChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: "#FAFBFC" },
  amenityChipActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  amenityCheckbox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  amenityCheckboxActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  amenityChipText: { fontSize: 11.5, color: C.text, fontWeight: "600" },
  amenityChipTextActive: { color: C.emerald700, fontWeight: "800" },
  amenityCountRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  amenityCount: { fontSize: 12, color: C.emerald700, fontWeight: "700" },

  customAmenitySection: { marginTop: 6, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  customAmenityRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  customAmenityInput: { flex: 1, minHeight: 44 },
  customAmenityAddBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },
  customTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  customTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald600 },
  customTagText: { fontSize: 12, color: C.emerald700, fontWeight: "700" },

  // Cancellation policy cards
  policyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  policyCard: { width: "48%", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC" },
  policyCardActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  policyTitle: { fontSize: 12.5, fontWeight: "800", color: C.ink, marginBottom: 4 },
  policyTitleActive: { color: C.emerald700 },
  policyDesc: { fontSize: 10.5, color: C.subText, lineHeight: 14 },
  policyCheck: { position: "absolute", top: 8, right: 8 },

  linesHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  linesCountBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  linesCountText: { fontSize: 10.5, fontWeight: "800" },
  linesHint: { fontSize: 10, color: C.subText, fontWeight: "600", fontStyle: "italic" },

  togglesRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 12 },
  toggleCard: { flex: 1, alignItems: "center", gap: 6, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  toggleIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  toggleTitle: { fontSize: 13, color: C.text, fontWeight: "800", textAlign: "center" },
  toggleSub: { fontSize: 10.5, color: C.subText, fontWeight: "600", textAlign: "center" },

  bottomBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 24 : 12, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  publishBtnWrap: { flex: 1, borderRadius: 12, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});

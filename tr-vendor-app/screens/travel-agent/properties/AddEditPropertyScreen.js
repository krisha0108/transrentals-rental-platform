// screens/travel-agent/properties/AddEditPropertyScreen.js
// REDESIGNED — emerald-themed Add/Edit Property form.
//
// Maps to POST /api/travel-agent/properties or PATCH .../[id].
// galleryImages MUST be JSON-stringified before send (backend column is String?).
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

// Per-type colour + icon for the visual property-type picker tiles.
const TYPE_META = {
  RESORT:      { icon: "umbrella",     color: "#F97316", label: "Resort" },
  HOTEL:       { icon: "business",     color: C.blue,    label: "Hotel" },
  HOMESTAY:    { icon: "home",         color: C.emerald600, label: "Homestay" },
  APARTMENT:   { icon: "grid",         color: C.purple,  label: "Apartment" },
  VILLA:       { icon: "diamond",      color: "#EC4899", label: "Villa" },
  GUEST_HOUSE: { icon: "people",       color: C.amber,   label: "Guest house" },
  HOSTEL:      { icon: "bed",          color: "#06B6D4", label: "Hostel" },
  ROOMS:       { icon: "bed-outline",  color: "#64748B", label: "Rooms" },
  OTHER:       { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

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
    name: existing?.name || "",
    propertyType: existing?.propertyType || "RESORT",
    description: existing?.description || "",
    address: existing?.address || "",
    city: existing?.city || "",
    state: existing?.state || "",
    pincode: existing?.pincode || "",
    totalRooms: existing?.totalRooms ? String(existing.totalRooms) : "",
    startingPrice: existing?.startingPrice ? String(existing.startingPrice) : "",
    amenities: existing?.amenities || "",
    inclusions: existing?.inclusions || "",
    exclusions: existing?.exclusions || "",
    rules: existing?.rules || "",
    checkInTime: existing?.checkInTime || "14:00",
    checkOutTime: existing?.checkOutTime || "11:00",
    coverImage: existing?.coverImage || null,
    galleryImages: toArr(existing?.galleryImages),
    isActive: existing?.isActive !== false,
  }));

  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({
    images: true, basics: true, address: false, rooms: false, content: false,
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canSave = form.name.trim().length >= 2 && !saving;
  const typeMeta = TYPE_META[form.propertyType] || TYPE_META.OTHER;

  // Live completion ratio shown in header.
  const completedSections = useMemo(() => {
    let c = 0;
    if (form.coverImage) c++;
    if (form.name.trim() && form.propertyType) c++;
    if (form.city.trim() || form.address.trim()) c++;
    if (form.totalRooms || form.startingPrice) c++;
    return c;
  }, [form]);

  const save = async () => {
    if (!form.name.trim()) return Alert.alert("Required", "Property name is required.");
    const payload = {
      name: form.name.trim(),
      propertyType: form.propertyType,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pincode: form.pincode.trim() || null,
      totalRooms: form.totalRooms ? Number(form.totalRooms) : 1,
      startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
      amenities: form.amenities.trim() || null,
      inclusions: form.inclusions.trim() || null,
      exclusions: form.exclusions.trim() || null,
      rules: form.rules.trim() || null,
      checkInTime: form.checkInTime || null,
      checkOutTime: form.checkOutTime || null,
      coverImage: form.coverImage || null,
      // Backend column is String? (LongText) — must stringify the array,
      // otherwise Prisma rejects with "Invalid prisma.travel_agent_properties.create()".
      galleryImages: form.galleryImages?.length ? JSON.stringify(form.galleryImages) : null,
      isActive: form.isActive,
    };
    try {
      setSaving(true);
      if (isEdit) await updateTravelAgentProperty(existing.id, payload);
      else await createTravelAgentProperty(payload);
      navigation.goBack();
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
              <Text style={styles.headerTitle}>{isEdit ? "Edit Property" : "Add New Property"}</Text>
              <Text style={styles.headerSub}>
                {completedSections}/4 sections complete · {typeMeta.label}
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
            {["Images", "Basics", "Address", "Rooms"].map((label, i) => (
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
            icon="image" color={C.purple}
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
                folder="properties"
                helperText="Main image shown on property cards."
              />
              <ImagePickerField
                label="Gallery (up to 8)"
                multi max={8}
                value={form.galleryImages}
                onChange={(v) => update("galleryImages", v)}
                folder="properties"
              />
            </Card>
          )}

          {/* ===== Basics (with visual type picker) ===== */}
          <SectionToggle
            icon="business" color={C.emerald600}
            label="Basics"
            sub={form.name ? `${form.name.slice(0, 30)}${form.name.length > 30 ? "…" : ""}` : "Name + type + description"}
            open={expanded.basics}
            onToggle={() => setExpanded((s) => ({ ...s, basics: !s.basics }))}
          />
          {expanded.basics && (
            <Card>
              <Field label="Property name *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hilltop Resort Manali"
                  placeholderTextColor="#A3B3C2"
                  value={form.name}
                  onChangeText={(v) => update("name", v)}
                />
              </Field>

              {/* Visual type picker — 3 per row, color-themed when active */}
              <Field label="Property type">
                <View style={styles.typeGrid}>
                  {PROPERTY_TYPE.map((t) => {
                    const meta = TYPE_META[t] || TYPE_META.OTHER;
                    const active = form.propertyType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeTile,
                          active && { backgroundColor: `${meta.color}1A`, borderColor: meta.color },
                        ]}
                        onPress={() => update("propertyType", t)}
                        activeOpacity={0.85}
                      >
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
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="What makes this property special…"
                  placeholderTextColor="#A3B3C2"
                  value={form.description}
                  onChangeText={(v) => update("description", v)}
                  multiline numberOfLines={4} textAlignVertical="top"
                />
              </Field>
            </Card>
          )}

          {/* ===== Address ===== */}
          <SectionToggle
            icon="location" color={C.blue}
            label="Address"
            sub={
              form.city
                ? `${form.city}${form.state ? `, ${form.state}` : ""}`
                : "Street, city, state, pincode"
            }
            open={expanded.address}
            onToggle={() => setExpanded((s) => ({ ...s, address: !s.address }))}
          />
          {expanded.address && (
            <Card>
              <Field label="Street address">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}22` }]}>
                    <Ionicons name="navigate" size={14} color={C.blue} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.iconInputField]}
                    placeholder="Building, street, area"
                    placeholderTextColor="#A3B3C2"
                    value={form.address}
                    onChangeText={(v) => update("address", v)}
                  />
                </View>
              </Field>
              <View style={styles.row2}>
                <Field label="City" style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#A3B3C2"
                    value={form.city}
                    onChangeText={(v) => update("city", v)}
                  />
                </Field>
                <Field label="State" style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#A3B3C2"
                    value={form.state}
                    onChangeText={(v) => update("state", v)}
                  />
                </Field>
              </View>
              <Field label="Pincode">
                <TextInput
                  style={styles.input}
                  placeholder="6-digit pincode"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={form.pincode}
                  onChangeText={(v) => update("pincode", v.replace(/\D/g, ""))}
                />
              </Field>
            </Card>
          )}

          {/* ===== Rooms & pricing ===== */}
          <SectionToggle
            icon="bed" color={C.amber}
            label="Rooms & pricing"
            sub={
              form.totalRooms || form.startingPrice
                ? `${form.totalRooms || "—"} rooms · ${form.startingPrice ? `₹${form.startingPrice}` : "—"}/night`
                : "Rooms count + nightly rate + timings"
            }
            open={expanded.rooms}
            onToggle={() => setExpanded((s) => ({ ...s, rooms: !s.rooms }))}
          />
          {expanded.rooms && (
            <Card>
              <View style={styles.row2}>
                <Field label="Total rooms" style={{ flex: 1 }}>
                  <NumberInput
                    value={form.totalRooms}
                    placeholder="12"
                    onChange={(v) => update("totalRooms", v)}
                    icon="bed" color={C.amber}
                  />
                </Field>
                <Field label="Starting price" style={{ flex: 1 }}>
                  <View style={styles.prefixInputWrap}>
                    <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                    <TextInput
                      style={[styles.input, styles.prefixInput]}
                      placeholder="3500"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="number-pad"
                      value={form.startingPrice}
                      onChangeText={(v) => update("startingPrice", v.replace(/[^\d.]/g, ""))}
                    />
                  </View>
                </Field>
              </View>

              <View style={styles.row2}>
                <Field label="Check-in" style={{ flex: 1 }}>
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}22` }]}>
                      <Ionicons name="log-in" size={14} color={C.emerald600} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.iconInputField]}
                      placeholder="14:00"
                      placeholderTextColor="#A3B3C2"
                      value={form.checkInTime}
                      onChangeText={(v) => update("checkInTime", v)}
                    />
                  </View>
                </Field>
                <Field label="Check-out" style={{ flex: 1 }}>
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}22` }]}>
                      <Ionicons name="log-out" size={14} color={C.red} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.iconInputField]}
                      placeholder="11:00"
                      placeholderTextColor="#A3B3C2"
                      value={form.checkOutTime}
                      onChangeText={(v) => update("checkOutTime", v)}
                    />
                  </View>
                </Field>
              </View>
            </Card>
          )}

          {/* ===== Amenities & rules ===== */}
          <SectionToggle
            icon="list" color={C.purple}
            label="Amenities & rules"
            sub={`${countLines(form.amenities)}A · ${countLines(form.inclusions)}I · ${countLines(form.exclusions)}E · ${countLines(form.rules)}R`}
            open={expanded.content}
            onToggle={() => setExpanded((s) => ({ ...s, content: !s.content }))}
          />
          {expanded.content && (
            <Card>
              <LinesField
                label="Amenities" icon="star" color={C.amber}
                placeholder={"Free WiFi\nSwimming Pool\nParking"}
                value={form.amenities}
                onChange={(v) => update("amenities", v)}
              />
              <LinesField
                label="Inclusions" icon="checkmark-circle" color={C.emerald600}
                placeholder={"Breakfast\nWelcome drink"}
                value={form.inclusions}
                onChange={(v) => update("inclusions", v)}
              />
              <LinesField
                label="Exclusions" icon="close-circle" color={C.red}
                placeholder={"Personal expenses"}
                value={form.exclusions}
                onChange={(v) => update("exclusions", v)}
              />
              <LinesField
                label="House rules" icon="alert" color={C.blue}
                placeholder={"No smoking\nNo pets"}
                value={form.rules}
                onChange={(v) => update("rules", v)}
              />
            </Card>
          )}

          {/* ===== Active toggle ===== */}
          <TouchableOpacity
            style={[
              styles.activeRow,
              form.isActive && { borderColor: C.emerald600, backgroundColor: C.emerald50 },
            ]}
            onPress={() => update("isActive", !form.isActive)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.activeIconWrap,
                form.isActive
                  ? { backgroundColor: C.emerald600 }
                  : { backgroundColor: "#E2E8F0" },
              ]}
            >
              <Ionicons
                name={form.isActive ? "checkmark" : "close"}
                size={16}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeText, form.isActive && { color: C.emerald700 }]}>
                Active listing
              </Text>
              <Text style={styles.activeSub}>
                {form.isActive
                  ? "Visible on your dashboard and bookings"
                  : "Hidden — won't appear in lists or quotes"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ===== Danger zone (edit only) ===== */}
          {isEdit && (
            <SectionToggle
              icon="alert-circle" color={C.red}
              label="Danger zone"
              sub="Delete this property permanently"
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

      {/* ===== Sticky bottom Save bar (gradient) ===== */}
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
                  {isEdit ? "Save Changes" : "Create property"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
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

function NumberInput({ value, placeholder, onChange, icon, color, suffix }) {
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
      />
      {!!suffix && (
        <View style={styles.suffixBox}>
          <Text style={styles.suffixText}>{suffix}</Text>
        </View>
      )}
    </View>
  );
}

// Multiline text field with colored label (one item per line UX).
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
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#A3B3C2"
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}

function countLines(s) {
  if (!s) return 0;
  return s.split("\n").filter((l) => l.trim()).length;
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

  // Card (the open form section)
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
  inputMultiline: { minHeight: 90, paddingTop: 10 },
  row2: { flexDirection: "row", gap: 10 },

  // Visual property-type grid (3 cols)
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

  // Prefix (₹) input
  prefixInputWrap: { flexDirection: "row", alignItems: "stretch" },
  prefixBox: {
    paddingHorizontal: 14, justifyContent: "center", backgroundColor: C.emerald50,
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
    borderWidth: 1, borderRightWidth: 0, borderColor: C.border,
  },
  prefixText: { color: C.emerald700, fontWeight: "800", fontSize: 16 },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },

  // Icon-prefixed input
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

  // Lines field (amenities/inclusions/etc.)
  linesHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  linesCountBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  linesCountText: { fontSize: 10.5, fontWeight: "800" },
  linesHint: { fontSize: 10, color: C.subText, fontWeight: "600", fontStyle: "italic" },

  // Active toggle row
  activeRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: 12, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card,
  },
  activeIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activeText: { fontSize: 14, color: C.text, fontWeight: "800" },
  activeSub: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },

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

// screens/travel-agent/capture-links/AddEditCaptureLinkScreen.js
// REDESIGNED — emerald-themed Add/Edit Capture Link form.
// Backend auto-generates the slug on create; we surface the resolved slug
// on edit (plus a live preview of where the title goes).
//
// POST  /api/travel-agent/capture-links
// PATCH /api/travel-agent/capture-links/[id]
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Share, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  createTravelAgentCaptureLink,
  updateTravelAgentCaptureLink,
  getCaptureLinkPublicUrl,
  CAPTURE_TRIP_TYPES,
} from "../../api/travelAgentClient";

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
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
};

// Each trip-type tile gets an icon, color, and a customer-friendly label.
const TRIP_TYPE_META = {
  ONE_WAY:       { icon: "arrow-forward", color: C.blue,       label: "One-way",      hint: "Single drop transfer" },
  ROUND_TRIP:    { icon: "swap-horizontal", color: C.purple,   label: "Round-trip",   hint: "Two-way travel" },
  TOUR_PACKAGE:  { icon: "map",           color: C.emerald600, label: "Tour package", hint: "Full itinerary" },
  ACCOMMODATION: { icon: "bed",           color: C.amber,      label: "Stay only",    hint: "Hotel/villa booking" },
  MULTI_CITY:    { icon: "compass",       color: "#EC4899",    label: "Multi-city",   hint: "Multiple destinations" },
};

export default function AddEditCaptureLinkScreen({ navigation, route }) {
  const existing = route?.params?.link || null;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    defaultTripType: existing?.defaultTripType || "",
    isActive: existing?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canSave = form.title.trim().length >= 2 && !saving;
  const selectedTripMeta = form.defaultTripType ? TRIP_TYPE_META[form.defaultTripType] : null;

  // Live slug preview from title (mirrors backend's slugify roughly).
  const previewSlug = useMemo(() => {
    if (existing?.slug) return existing.slug;
    const t = form.title.trim().toLowerCase();
    if (!t) return "your-link-slug";
    return t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  }, [form.title, existing?.slug]);

  const save = async () => {
    if (!form.title.trim()) return Alert.alert("Required", "Title is required.");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      defaultTripType: form.defaultTripType || null,
      ...(isEdit ? { isActive: form.isActive } : {}),
    };
    try {
      setSaving(true);
      if (isEdit) await updateTravelAgentCaptureLink(existing.id, payload);
      else await createTravelAgentCaptureLink(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onCopy = async () => {
    if (!isEdit) return;
    try {
      const url = await getCaptureLinkPublicUrl(existing.slug);
      Clipboard.setString(url);
      Alert.alert("Copied", "Public URL copied to clipboard.");
    } catch {
      Alert.alert("Error", "Could not copy URL");
    }
  };
  const onShare = async () => {
    if (!isEdit) return;
    try {
      const url = await getCaptureLinkPublicUrl(existing.slug);
      await Share.share({ message: `${existing.title}\n${url}`, url });
    } catch {}
  };
  const onOpenPublic = async () => {
    if (!isEdit) return;
    try {
      const url = await getCaptureLinkPublicUrl(existing.slug);
      Linking.openURL(url);
    } catch {}
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
              <Text style={styles.headerTitle}>
                {isEdit ? "Edit Capture Link" : "New Capture Link"}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {isEdit
                  ? `${existing.totalSubmissions || 0} submissions · ${existing.leadsGenerated || 0} leads`
                  : "Public form that auto-creates leads"}
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
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ===== How-it-works intro card ===== */}
          <View style={styles.introCard}>
            <View style={styles.introIconWrap}>
              <Ionicons name="bulb" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>How it works</Text>
              <Text style={styles.introBody}>
                Share this form's link with customers (WhatsApp / social / email). Each submission lands as a lead in your CRM automatically.
              </Text>
            </View>
          </View>

          {/* ===== Form details section ===== */}
          <SectionLabel icon="document-text" color={C.emerald600} label="Form details" />
          <View style={styles.card}>
            <Field label="Title *">
              <TextInput
                style={styles.input}
                placeholder="e.g. Monsoon Tour Enquiry"
                placeholderTextColor="#A3B3C2"
                value={form.title}
                onChangeText={(v) => update("title", v)}
              />
            </Field>
            <Field
              label="Description"
              helper="Shown to customers on the form page."
            >
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="What you offer, who it's for, any specifics…"
                placeholderTextColor="#A3B3C2"
                value={form.description}
                onChangeText={(v) => update("description", v)}
                multiline numberOfLines={4} textAlignVertical="top"
              />
            </Field>
          </View>

          {/* ===== Trip type section (visual tiles) ===== */}
          <SectionLabel
            icon="map" color={C.purple}
            label="Default trip type"
            optional
          />
          <View style={styles.card}>
            <Text style={styles.helperTop}>
              Pre-fills the trip type on the form (customer can still change it).
            </Text>
            <View style={styles.tripGrid}>
              {/* "None" option first */}
              <TouchableOpacity
                style={[
                  styles.tripTile,
                  !form.defaultTripType && { backgroundColor: "#F1F5F9", borderColor: C.subText },
                ]}
                onPress={() => update("defaultTripType", "")}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.tripIconWrap,
                  !form.defaultTripType
                    ? { backgroundColor: C.subText }
                    : { backgroundColor: "#E2E8F0" },
                ]}>
                  <Ionicons
                    name="remove-circle-outline"
                    size={16}
                    color={!form.defaultTripType ? "#fff" : C.subText}
                  />
                </View>
                <Text style={[
                  styles.tripLabel,
                  !form.defaultTripType && { color: C.text, fontWeight: "800" },
                ]}>
                  No default
                </Text>
                <Text style={styles.tripHint} numberOfLines={1}>Let customer choose</Text>
              </TouchableOpacity>

              {CAPTURE_TRIP_TYPES.map((t) => {
                const meta = TRIP_TYPE_META[t] || { icon: "ellipsis-horizontal", color: C.subText, label: t, hint: "" };
                const active = form.defaultTripType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tripTile,
                      active && { backgroundColor: `${meta.color}1A`, borderColor: meta.color },
                    ]}
                    onPress={() => update("defaultTripType", t)}
                    activeOpacity={0.85}
                  >
                    <View style={[
                      styles.tripIconWrap,
                      { backgroundColor: active ? meta.color : `${meta.color}22` },
                    ]}>
                      <Ionicons name={meta.icon} size={16} color={active ? "#fff" : meta.color} />
                    </View>
                    <Text style={[
                      styles.tripLabel,
                      active && { color: meta.color, fontWeight: "800" },
                    ]}>
                      {meta.label}
                    </Text>
                    <Text style={styles.tripHint} numberOfLines={1}>{meta.hint}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ===== Public URL / Live preview section ===== */}
          <SectionLabel
            icon="link" color={C.blue}
            label={isEdit ? "Public URL" : "Live preview"}
          />
          <View style={styles.card}>
            {/* URL chip */}
            <View style={styles.urlChip}>
              <View style={styles.urlChipIcon}>
                <Ionicons name="link" size={13} color={C.emerald600} />
              </View>
              <Text style={styles.urlChipText} numberOfLines={1}>
                /travel-agent/lead/{previewSlug}
              </Text>
              {!isEdit && (
                <View style={styles.urlChipPreviewBadge}>
                  <Text style={styles.urlChipPreviewText}>PREVIEW</Text>
                </View>
              )}
            </View>

            {!isEdit && (
              <Text style={styles.urlHelper}>
                Backend will generate the final slug when you create the link. Edit the title to change this preview.
              </Text>
            )}

            {/* Edit-mode: share/copy/open actions */}
            {isEdit && (
              <View style={styles.urlActionsRow}>
                <TouchableOpacity
                  style={styles.urlShareBtnWrap}
                  onPress={onShare}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.emerald600, C.emerald700]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.urlShareBtnInner}
                  >
                    <Ionicons name="share-social" size={14} color="#fff" />
                    <Text style={styles.urlShareText}>Share</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.urlActionBtn} onPress={onCopy} activeOpacity={0.85}>
                  <Ionicons name="copy-outline" size={14} color={C.blue} />
                  <Text style={[styles.urlActionText, { color: C.blue }]}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.urlActionBtn} onPress={onOpenPublic} activeOpacity={0.85}>
                  <Ionicons name="open-outline" size={14} color={C.emerald700} />
                  <Text style={[styles.urlActionText, { color: C.emerald700 }]}>Preview</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mini live preview — how the customer-facing card looks */}
            <View style={styles.cardPreview}>
              <Text style={styles.cardPreviewLabel}>HOW CUSTOMERS WILL SEE IT</Text>
              <View style={styles.cardPreviewBox}>
                <View style={styles.cardPreviewHeader}>
                  {selectedTripMeta && (
                    <View style={[styles.cardPreviewPill, { backgroundColor: `${selectedTripMeta.color}1A` }]}>
                      <Ionicons name={selectedTripMeta.icon} size={10} color={selectedTripMeta.color} />
                      <Text style={[styles.cardPreviewPillText, { color: selectedTripMeta.color }]}>
                        {selectedTripMeta.label}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardPreviewTitle} numberOfLines={2}>
                  {form.title.trim() || "Your form title appears here"}
                </Text>
                {!!form.description.trim() && (
                  <Text style={styles.cardPreviewDesc} numberOfLines={3}>
                    {form.description.trim()}
                  </Text>
                )}
                <View style={styles.cardPreviewFields}>
                  <View style={styles.cardPreviewField} />
                  <View style={styles.cardPreviewField} />
                  <View style={[styles.cardPreviewField, { width: "60%" }]} />
                  <View style={styles.cardPreviewCta}>
                    <Text style={styles.cardPreviewCtaText}>Submit enquiry</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ===== Active toggle (edit mode only) ===== */}
          {isEdit && (
            <>
              <SectionLabel icon="power" color={C.emerald600} label="Status" />
              <TouchableOpacity
                style={[
                  styles.statusCard,
                  form.isActive
                    ? { borderColor: C.emerald600, backgroundColor: C.emerald50 }
                    : { borderColor: C.border, backgroundColor: C.card },
                ]}
                onPress={() => update("isActive", !form.isActive)}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.statusIconWrap,
                  form.isActive ? { backgroundColor: C.emerald600 } : { backgroundColor: "#E2E8F0" },
                ]}>
                  <Ionicons
                    name={form.isActive ? "checkmark" : "close"}
                    size={18}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.statusTitleRow}>
                    <Text style={[
                      styles.statusTitle,
                      { color: form.isActive ? C.emerald700 : C.text },
                    ]}>
                      {form.isActive ? "Active — accepting submissions" : "Paused — 404 to visitors"}
                    </Text>
                  </View>
                  <Text style={styles.statusHint}>
                    {form.isActive
                      ? "Anyone with the link can submit; existing leads stay."
                      : "Form returns 404 to anyone trying to submit."}
                  </Text>
                </View>
                {/* Visual switch */}
                <View style={[
                  styles.toggleTrack,
                  form.isActive && { backgroundColor: C.emerald600 },
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    form.isActive && { transform: [{ translateX: 16 }] },
                  ]} />
                </View>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Sticky bottom save bar ===== */}
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
                  {isEdit ? "Update link" : "Create link"}
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

function SectionLabel({ icon, color, label, optional }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
      {optional && <Text style={styles.optionalTag}>Optional</Text>}
    </View>
  );
}

function Field({ label, helper, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, minWidth: 60, alignItems: "center" },
  headerSaveText: { color: C.emerald700, fontWeight: "800", fontSize: 13 },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },

  // Intro card
  introCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
    marginBottom: 14,
  },
  introIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 13, fontWeight: "800", color: C.emerald700, marginBottom: 3 },
  introBody: { fontSize: 12, color: C.text, lineHeight: 17, fontWeight: "500" },

  // Section label (above each card)
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, marginBottom: 8 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionLabelText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
  optionalTag: { fontSize: 10, color: C.subText, fontWeight: "700", marginLeft: 4, fontStyle: "italic" },

  // Card
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 14 },

  // Field
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 },
  helper: { fontSize: 11, color: C.subText, marginTop: 4, fontWeight: "600" },
  helperTop: { fontSize: 11.5, color: C.subText, marginBottom: 10, fontWeight: "600", lineHeight: 16 },
  input: {
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },
  inputMultiline: { minHeight: 90, paddingTop: 10 },

  // Trip type grid
  tripGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tripTile: {
    width: "47.5%",
    padding: 12, borderRadius: 12,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
    gap: 6,
  },
  tripIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  tripLabel: { fontSize: 12.5, color: C.text, fontWeight: "700" },
  tripHint: { fontSize: 10.5, color: C.subText, fontWeight: "500" },

  // URL chip
  urlChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 10,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
  },
  urlChipIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  urlChipText: { color: C.emerald700, fontSize: 12, fontWeight: "800", flex: 1, fontFamily: "monospace" },
  urlChipPreviewBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.amber },
  urlChipPreviewText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  urlHelper: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 6, lineHeight: 16, fontStyle: "italic" },

  // URL action row (edit mode)
  urlActionsRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  urlShareBtnWrap: { flex: 2, borderRadius: 10, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  urlShareBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9 },
  urlShareText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  urlActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 9, borderRadius: 10, backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border },
  urlActionText: { fontSize: 11.5, fontWeight: "800" },

  // Live mini preview card
  cardPreview: { marginTop: 16 },
  cardPreviewLabel: { fontSize: 10, color: C.subText, fontWeight: "800", letterSpacing: 0.6, marginBottom: 8 },
  cardPreviewBox: {
    padding: 14, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardPreviewHeader: { marginBottom: 6 },
  cardPreviewPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  cardPreviewPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  cardPreviewTitle: { fontSize: 15, fontWeight: "800", color: C.ink, marginBottom: 5 },
  cardPreviewDesc: { fontSize: 12, color: C.subText, lineHeight: 17, marginBottom: 10 },
  cardPreviewFields: { gap: 6 },
  cardPreviewField: { height: 32, backgroundColor: "#F1F5F9", borderRadius: 6 },
  cardPreviewCta: { marginTop: 6, backgroundColor: C.emerald600, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
  cardPreviewCtaText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Status (active) card
  statusCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, marginBottom: 14,
  },
  statusIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statusTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusTitle: { fontSize: 13.5, fontWeight: "800" },
  statusHint: { fontSize: 11.5, color: C.subText, marginTop: 3, fontWeight: "600", lineHeight: 15 },

  // Toggle switch
  toggleTrack: { width: 36, height: 20, borderRadius: 10, backgroundColor: "#E2E8F0", padding: 2, justifyContent: "center" },
  toggleThumb: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },

  // Bottom save bar
  bottomBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  publishBtnWrap: {
    flex: 1, borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});

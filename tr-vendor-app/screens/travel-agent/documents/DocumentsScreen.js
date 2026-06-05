// screens/travel-agent/documents/DocumentsScreen.js
// REDESIGNED — emerald-themed KYC documents screen.
// Same screen serves the post-register onboarding flow (route name
// "TravelAgentDocuments") AND the "More → Documents" entry ("TADocuments").
// In onboarding mode, "Skip for now" lives at the TOP-RIGHT of the header
// (user requested).
//
// Backend: GET / POST (multipart) / DELETE on /api/travel-agent/documents.
// Required: GST_CERTIFICATE, PAN_CARD, ADDRESS_PROOF. Backend auto-promotes
// status to UNDER_REVIEW once all 3 are uploaded.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Linking,
  StatusBar, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary } from "react-native-image-picker";
import { pick, types as docTypes } from "@react-native-documents/picker";
import {
  listTravelAgentDocuments,
  uploadTravelAgentDocument,
  deleteTravelAgentDocument,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
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
  purpleLight: "#EDE9FE",
};

// Per-type meta: icon (Ionicons), accent color, hint text. `required` flag is
// the source of truth for which docs the backend enforces.
const DOC_META = {
  GST_CERTIFICATE:      { label: "GST Certificate",     icon: "receipt",          color: C.emerald600, required: true,  hint: "Download from gst.gov.in" },
  PAN_CARD:             { label: "PAN Card",            icon: "card",             color: C.blue,       required: true,  hint: "Front side, clearly visible" },
  ADDRESS_PROOF:        { label: "Address Proof",       icon: "home",             color: C.amber,      required: true,  hint: "Aadhaar / Electricity / Rental" },
  AGENCY_REGISTRATION:  { label: "Agency Registration", icon: "business",         color: C.purple,     required: false, hint: "Shop & Establishment / Partnership" },
  IATA_CERTIFICATE:     { label: "IATA Certificate",    icon: "airplane",         color: "#06B6D4",    required: false, hint: "If applicable" },
  TRAVEL_AGENT_LICENSE: { label: "Travel Agent License", icon: "ribbon",          color: "#EC4899",    required: false, hint: "State-issued license" },
  CANCELLED_CHEQUE:     { label: "Cancelled Cheque",    icon: "wallet",           color: "#F97316",    required: false, hint: "For bank verification" },
  OWNER_AADHAAR:        { label: "Owner Aadhaar",       icon: "person",           color: C.emerald600, required: false, hint: "Aadhaar of agency owner" },
  OWNER_PAN:            { label: "Owner PAN",           icon: "card",             color: C.blue,       required: false, hint: "Personal PAN of owner" },
  BANK_DETAILS:         { label: "Bank Statement",      icon: "wallet",           color: C.amber,      required: false, hint: "Recent bank statement" },
  OTHER:                { label: "Other Document",      icon: "document-attach",  color: C.subText,    required: false, hint: "Any additional document" },
};

const STATUS_META = {
  PENDING:  { label: "UNDER REVIEW", bg: C.amberLight,  fg: "#A16207",      icon: "hourglass" },
  VERIFIED: { label: "VERIFIED",     bg: C.emerald50,    fg: C.emerald700,   icon: "checkmark-circle" },
  REJECTED: { label: "REJECTED",     bg: C.redLight,     fg: "#B91C1C",      icon: "alert-circle" },
};

function isPdfUrl(url) {
  return typeof url === "string" && /\.pdf(\?|$)/i.test(url);
}

export default function DocumentsScreen({ navigation, route }) {
  // "TravelAgentDocuments" = post-register onboarding entry, no back stack.
  // "TADocuments" = More → Documents from the dashboard, has back stack.
  const isOnboardingMode = route?.name === "TravelAgentDocuments";

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadFor, setUploadFor] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTravelAgentDocuments();
      setDocs(data.documents || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load documents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  // Map type → latest non-rejected doc (else latest doc of any status).
  const byType = useMemo(() => {
    const m = {};
    for (const d of docs) {
      const existing = m[d.documentType];
      if (!existing) m[d.documentType] = d;
      else if (existing.status === "REJECTED" && d.status !== "REJECTED") m[d.documentType] = d;
      else if (new Date(d.updatedAt || d.createdAt) > new Date(existing.updatedAt || existing.createdAt))
        m[d.documentType] = d;
    }
    return m;
  }, [docs]);

  const verifiedRequired = REQUIRED_DOCUMENT_TYPES.filter((t) => byType[t]?.status === "VERIFIED").length;
  const uploadedRequired = REQUIRED_DOCUMENT_TYPES.filter((t) => byType[t] && byType[t].status !== "REJECTED").length;
  const requiredDone = verifiedRequired === REQUIRED_DOCUMENT_TYPES.length;
  const totalUploaded = docs.length;

  const requiredTypes = DOCUMENT_TYPES.filter((t) => DOC_META[t]?.required);
  const optionalTypes = DOCUMENT_TYPES.filter((t) => !DOC_META[t]?.required);

  const onDelete = (doc) => {
    if (doc.status === "VERIFIED") {
      Alert.alert("Cannot delete", "Verified documents cannot be deleted. Contact support if needed.");
      return;
    }
    Alert.alert("Remove document?", "You will need to upload again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try { await deleteTravelAgentDocument(doc.id); load(); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  const onView = (doc) => {
    if (!doc?.documentUrl) return;
    Linking.openURL(doc.documentUrl).catch(() => {
      Alert.alert("Cannot open", "Document URL could not be opened.");
    });
  };

  const onSkipToDashboard = () => {
    navigation.reset({ index: 0, routes: [{ name: "TravelAgentDashboard" }] });
  };

  const progressPct = Math.round((verifiedRequired / REQUIRED_DOCUMENT_TYPES.length) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient hero header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 40 }}>
          <View style={styles.headerRow}>
            {navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              // Onboarding entry — no back stack. Logout option so user isn't trapped.
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Logout?", "You can come back to upload documents later.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Logout", style: "destructive",
                      onPress: () => navigation.reset({ index: 0, routes: [{ name: "VendorLoginScreen" }] }),
                    },
                  ])
                }
                style={styles.iconBtn}
              >
                <Ionicons name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Documents</Text>
              <Text style={styles.headerSub}>
                {requiredDone
                  ? "All required docs verified"
                  : `${verifiedRequired}/${REQUIRED_DOCUMENT_TYPES.length} required verified`}
              </Text>
            </View>

            {/* Skip button — top-right in onboarding mode (user-requested placement) */}
            {isOnboardingMode && (
              <TouchableOpacity
                style={styles.skipPillTop}
                onPress={onSkipToDashboard}
                activeOpacity={0.85}
              >
                <Text style={styles.skipPillTopText}>
                  {requiredDone ? "Continue →" : "Skip →"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress block inside hero */}
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressTopRow}>
              <View>
                <Text style={styles.heroProgressLabel}>KYC PROGRESS</Text>
                <Text style={styles.heroProgressValue}>{progressPct}%</Text>
              </View>
              {requiredDone ? (
                <View style={styles.heroProgressBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#fff" />
                  <Text style={styles.heroProgressBadgeText}>VERIFIED</Text>
                </View>
              ) : (
                <View style={[styles.heroProgressBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Ionicons name="hourglass" size={13} color="#fff" />
                  <Text style={styles.heroProgressBadgeText}>
                    {uploadedRequired === 0
                      ? "NOT STARTED"
                      : verifiedRequired < REQUIRED_DOCUMENT_TYPES.length
                      ? "IN REVIEW"
                      : "ALMOST THERE"}
                  </Text>
                </View>
              )}
            </View>
            {/* Big progress bar */}
            <View style={styles.heroBarTrack}>
              <View
                style={[
                  styles.heroBarFill,
                  { width: `${progressPct}%` },
                ]}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating stats card ===== */}
      <View style={styles.statsCard}>
        <StatCell
          value={`${verifiedRequired}/${REQUIRED_DOCUMENT_TYPES.length}`}
          label="Required"
          icon="alert-circle"
          color={requiredDone ? C.emerald600 : C.red}
        />
        <View style={styles.statDivider} />
        <StatCell
          value={totalUploaded}
          label="Uploaded"
          icon="cloud-upload"
          color={C.blue}
        />
        <View style={styles.statDivider} />
        <StatCell
          value={docs.filter((d) => d.status === "VERIFIED").length}
          label="Verified"
          icon="checkmark-done"
          color={C.emerald600}
        />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
        >
          {/* Success banner (only when everything is done) */}
          {requiredDone && (
            <View style={styles.doneBanner}>
              <View style={styles.doneIconWrap}>
                <Ionicons name="checkmark-done-circle" size={22} color={C.emerald700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doneTitle}>You're all set! 🎉</Text>
                <Text style={styles.doneBody}>
                  All required documents are verified — your account is active.
                </Text>
              </View>
            </View>
          )}

          {/* ===== Required section ===== */}
          <SectionLabel
            icon="alert-circle" color={C.red}
            label="Required"
            badge={`${uploadedRequired}/${REQUIRED_DOCUMENT_TYPES.length}`}
            badgeColor={requiredDone ? C.emerald600 : C.red}
          />
          {requiredTypes.map((type) => (
            <DocCard
              key={type}
              type={type}
              doc={byType[type]}
              onUpload={() => setUploadFor(type)}
              onView={() => onView(byType[type])}
              onDelete={() => onDelete(byType[type])}
            />
          ))}

          {/* ===== Optional section ===== */}
          <SectionLabel
            icon="add-circle" color={C.blue}
            label="Optional"
            hint="Speeds up verification & unlocks higher limits"
          />
          {optionalTypes.map((type) => (
            <DocCard
              key={type}
              type={type}
              doc={byType[type]}
              onUpload={() => setUploadFor(type)}
              onView={() => onView(byType[type])}
              onDelete={() => onDelete(byType[type])}
            />
          ))}

          <View style={{ height: 28 }} />
        </ScrollView>
      )}

      <UploadModal
        type={uploadFor}
        onClose={() => setUploadFor(null)}
        onUploaded={() => { setUploadFor(null); load(); }}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatCell({ value, label, icon, color }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SectionLabel({ icon, color, label, badge, badgeColor, hint }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={13} color={color} />
        </View>
        <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
        {!!badge && (
          <View style={[styles.sectionLabelBadge, { backgroundColor: `${badgeColor || color}1A` }]}>
            <Text style={[styles.sectionLabelBadgeText, { color: badgeColor || color }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      {!!hint && <Text style={styles.sectionLabelHint}>{hint}</Text>}
    </View>
  );
}

function DocCard({ type, doc, onUpload, onView, onDelete }) {
  const meta = DOC_META[type] || { label: type, icon: "document", color: C.subText, hint: "" };
  const status = doc?.status;
  const sMeta = status ? STATUS_META[status] : null;
  const isRejected = status === "REJECTED";
  const isVerified = status === "VERIFIED";
  const isPending = status === "PENDING";

  // Card border color reflects status: emerald=verified, red=rejected, amber=pending, otherwise neutral.
  const borderColor =
    isVerified ? C.emerald600 :
    isRejected ? C.red :
    isPending ? C.amber : C.border;
  const stripeColor =
    isVerified ? C.emerald600 :
    isRejected ? C.red :
    isPending ? C.amber : meta.color;

  return (
    <View
      style={[
        styles.docCard,
        { borderColor },
        isVerified && { backgroundColor: C.emerald50 },
        isRejected && { backgroundColor: "#FEF7F7" },
      ]}
    >
      {/* Left status stripe */}
      <View style={[styles.docCardStripe, { backgroundColor: stripeColor }]} />

      <View style={styles.docCardBody}>
        {/* Header: icon tile + label + hint + status pill */}
        <View style={styles.docHeader}>
          <View style={[styles.docIconWrap, { backgroundColor: `${meta.color}1A` }]}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.docLabelRow}>
              <Text style={styles.docLabel}>{meta.label}</Text>
              {meta.required && !doc && (
                <View style={styles.requiredDot}>
                  <Text style={styles.requiredDotText}>REQUIRED</Text>
                </View>
              )}
            </View>
            <Text style={styles.docHint}>{meta.hint}</Text>
          </View>
        </View>

        {/* Status pill (full width when present) */}
        {sMeta && (
          <View style={[styles.statusPill, { backgroundColor: sMeta.bg }]}>
            <Ionicons name={sMeta.icon} size={11} color={sMeta.fg} />
            <Text style={[styles.statusText, { color: sMeta.fg }]}>{sMeta.label}</Text>
          </View>
        )}

        {/* Doc number */}
        {!!doc?.documentNumber && (
          <View style={styles.docNumberRow}>
            <Ionicons name="key-outline" size={11} color={C.subText} />
            <Text style={styles.docNumber}>{doc.documentNumber}</Text>
          </View>
        )}

        {/* Rejection reason */}
        {isRejected && !!doc?.rejectionReason && (
          <View style={styles.rejectBox}>
            <Ionicons name="alert-circle" size={13} color={C.red} />
            <Text style={styles.rejectText} numberOfLines={3}>
              {doc.rejectionReason}
            </Text>
          </View>
        )}

        {/* Actions */}
        {!doc ? (
          <TouchableOpacity
            style={styles.uploadBtnWrap}
            onPress={onUpload}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.uploadBtnInner}
            >
              <Ionicons name="cloud-upload" size={15} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.blueLight, borderColor: "#BFDBFE" }]}
              onPress={onView}
              activeOpacity={0.85}
            >
              <Ionicons name="eye" size={13} color={C.blue} />
              <Text style={[styles.actionText, { color: C.blue }]}>View</Text>
            </TouchableOpacity>
            {!isVerified && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: C.amberLight, borderColor: "#FDE68A" }]}
                onPress={onUpload}
                activeOpacity={0.85}
              >
                <Ionicons name={isRejected ? "refresh" : "swap-horizontal"} size={13} color={C.amber} />
                <Text style={[styles.actionText, { color: C.amber }]}>
                  {isRejected ? "Re-upload" : "Replace"}
                </Text>
              </TouchableOpacity>
            )}
            {!isVerified && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: C.redLight, borderColor: "#FCA5A5" }]}
                onPress={onDelete}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={13} color={C.red} />
                <Text style={[styles.actionText, { color: C.red }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

/* ───────── Upload modal ───────── */

function UploadModal({ type, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [docNumber, setDocNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const meta = type ? DOC_META[type] || {} : {};

  const reset = () => { setFile(null); setDocNumber(""); setUploading(false); };

  const pickImage = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: "photo", quality: 0.9 });
      if (res.didCancel || !res.assets?.[0]) return;
      const a = res.assets[0];
      setFile({
        uri: a.uri,
        name: a.fileName || `${type.toLowerCase()}-${Date.now()}.jpg`,
        type: a.type || "image/jpeg",
        size: a.fileSize,
      });
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const [picked] = await pick({ type: [docTypes.images, docTypes.pdf] });
      if (!picked) return;
      setFile({
        uri: picked.uri,
        name: picked.name || `${type.toLowerCase()}-${Date.now()}`,
        type: picked.type || "application/octet-stream",
        size: picked.size,
      });
    } catch (e) {
      if (e?.code === "OPERATION_CANCELED") return;
      Alert.alert("Error", e?.message || "Could not pick file");
    }
  };

  const upload = async () => {
    if (!file) return Alert.alert("Required", "Pick a file first.");
    if (file.size && file.size > 10 * 1024 * 1024) {
      return Alert.alert("Too large", "Max file size is 10 MB.");
    }
    try {
      setUploading(true);
      await uploadTravelAgentDocument(file, type, docNumber.trim() || undefined);
      reset();
      onUploaded();
    } catch (e) {
      Alert.alert("Upload failed", e?.response?.data?.error || e?.message || "Try again.");
    } finally {
      setUploading(false);
    }
  };

  const close = () => { reset(); onClose(); };

  if (!type) return null;

  return (
    <Modal visible={!!type} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Gradient header */}
          <LinearGradient
            colors={["#022C22", "#064E3B", "#047857"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Ionicons name={meta.icon || "cloud-upload"} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Upload Document</Text>
                <Text style={styles.modalHint} numberOfLines={1}>{meta.hint}</Text>
              </View>
              <TouchableOpacity onPress={close} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ padding: 14 }}>
            {/* Picked file preview OR pick options */}
            {file ? (
              <View style={styles.filePreview}>
                {file.type?.startsWith("image/") ? (
                  <Image source={{ uri: file.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewPdf}>
                    <Ionicons name="document-text" size={28} color={C.red} />
                    <Text style={styles.previewPdfText}>PDF</Text>
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  {file.size && (
                    <Text style={styles.fileSize}>{(file.size / 1024).toFixed(0)} KB</Text>
                  )}
                  <View style={styles.fileOkRow}>
                    <Ionicons name="checkmark-circle" size={11} color={C.emerald600} />
                    <Text style={styles.fileOkText}>Ready to upload</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setFile(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={22} color={C.red} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickRow}>
                <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.85}>
                  <View style={[styles.pickIconWrap, { backgroundColor: `${C.blue}1A` }]}>
                    <Ionicons name="image" size={22} color={C.blue} />
                  </View>
                  <Text style={styles.pickBtnLabel}>From gallery</Text>
                  <Text style={styles.pickBtnHint}>JPG / PNG / WebP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickBtn} onPress={pickDocument} activeOpacity={0.85}>
                  <View style={[styles.pickIconWrap, { backgroundColor: `${C.red}1A` }]}>
                    <Ionicons name="document-text" size={22} color={C.red} />
                  </View>
                  <Text style={styles.pickBtnLabel}>From files</Text>
                  <Text style={styles.pickBtnHint}>PDF or image</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Document number input */}
            <Text style={styles.fieldLabel}>Document number (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder={
                type === "GST_CERTIFICATE" ? "GSTIN" :
                type === "PAN_CARD" ? "PAN (AAAAA0000A)" :
                "ID number"
              }
              placeholderTextColor="#A3B3C2"
              value={docNumber}
              onChangeText={setDocNumber}
              autoCapitalize="characters"
            />
            <Text style={styles.formatHint}>JPG / PNG / WebP / PDF · max 10 MB</Text>

            {/* Upload button */}
            <TouchableOpacity
              style={[styles.uploadCtaWrap, (!file || uploading) && { opacity: 0.5 }]}
              onPress={upload}
              disabled={!file || uploading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[C.emerald600, C.emerald700]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.uploadCtaInner}
              >
                {uploading ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="cloud-upload" size={17} color="#fff" />
                    <Text style={styles.uploadCtaText}>Upload</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },

  // Skip pill — top-right of header (user requested this placement)
  skipPillTop: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#fff",
  },
  skipPillTopText: { color: C.emerald700, fontWeight: "800", fontSize: 12.5 },

  // Hero progress block
  heroProgress: { marginTop: 16, paddingHorizontal: 4 },
  heroProgressTopRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 },
  heroProgressLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: "800", letterSpacing: 0.8 },
  heroProgressValue: { fontSize: 28, color: "#fff", fontWeight: "900", marginTop: 2, letterSpacing: -0.5 },
  heroProgressBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.25)" },
  heroProgressBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  heroBarTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  heroBarFill: { height: "100%", borderRadius: 4, backgroundColor: "#fff" },

  // Floating stats card
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1, justifyContent: "center", minWidth: 0 },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 15, fontWeight: "900" },
  statLabel: { fontSize: 10, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },

  // Done banner
  doneBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
    marginBottom: 14,
  },
  doneIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 14, fontWeight: "800", color: C.emerald700 },
  doneBody: { fontSize: 12, color: C.text, fontWeight: "500", marginTop: 2, lineHeight: 16 },

  // Section label
  sectionLabelWrap: { marginTop: 14, marginBottom: 10 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionLabelText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
  sectionLabelBadge: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sectionLabelBadgeText: { fontSize: 11, fontWeight: "900" },
  sectionLabelHint: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 4, marginLeft: 32, fontStyle: "italic" },

  // Doc card
  docCard: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: 14, marginBottom: 10, overflow: "hidden",
    borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  docCardStripe: { width: 4 },
  docCardBody: { flex: 1, padding: 12 },

  docHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  docIconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  docLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  docLabel: { fontSize: 14, fontWeight: "800", color: C.ink, flex: 0 },
  docHint: { fontSize: 11.5, color: C.subText, marginTop: 2, fontWeight: "600" },
  requiredDot: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.redLight },
  requiredDotText: { fontSize: 9, fontWeight: "900", color: C.red, letterSpacing: 0.4 },

  statusPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginBottom: 6 },
  statusText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },

  docNumberRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  docNumber: { fontSize: 11.5, color: C.text, fontWeight: "700", letterSpacing: 0.5, fontFamily: "monospace" },

  rejectBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    padding: 10, borderRadius: 10,
    backgroundColor: C.redLight, borderLeftWidth: 3, borderLeftColor: C.red,
    marginBottom: 8,
  },
  rejectText: { color: C.red, fontSize: 11.5, flex: 1, fontWeight: "600", lineHeight: 16 },

  uploadBtnWrap: {
    marginTop: 6, borderRadius: 10, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  uploadBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11 },
  uploadBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  actionsRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionText: { fontSize: 11.5, fontWeight: "800" },

  // Upload modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
    maxHeight: "88%",
  },
  modalHeaderGrad: { paddingHorizontal: 16, paddingVertical: 16 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  modalHint: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  pickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  pickBtn: {
    flex: 1, alignItems: "center", gap: 8, paddingVertical: 18, paddingHorizontal: 8,
    borderRadius: 14, backgroundColor: "#FAFBFC",
    borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed",
  },
  pickIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pickBtnLabel: { fontSize: 13, fontWeight: "800", color: C.ink },
  pickBtnHint: { fontSize: 10.5, color: C.subText, fontWeight: "600" },

  filePreview: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
    marginBottom: 14,
  },
  previewImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F1F5F9" },
  previewPdf: { width: 56, height: 56, borderRadius: 10, backgroundColor: C.redLight, alignItems: "center", justifyContent: "center" },
  previewPdfText: { fontSize: 9, color: C.red, fontWeight: "900", marginTop: 2, letterSpacing: 0.5 },
  fileName: { fontSize: 13, fontWeight: "800", color: C.ink },
  fileSize: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },
  fileOkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  fileOkText: { fontSize: 10.5, color: C.emerald600, fontWeight: "800" },

  fieldLabel: { fontSize: 12, color: C.text, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
    letterSpacing: 0.5, fontFamily: "monospace",
  },
  formatHint: { fontSize: 11, color: C.subText, textAlign: "center", marginTop: 10, fontStyle: "italic", fontWeight: "600" },

  uploadCtaWrap: {
    marginTop: 14, borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  uploadCtaInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  uploadCtaText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});

// screens/travel-agent/documents/DocumentsScreen.js
// REDESIGNED (v2) — "Elevate" luxury-travel visual language, matching
// TravelAgentDashboardScreen / LeadsListScreen / GetStartedScreen.
//
// ⚠️ UI ONLY. All behaviour is preserved exactly:
//   • Same screen serves BOTH the post-register onboarding flow (route name
//     "TravelAgentDocuments", no back stack) AND "More → Documents"
//     ("TADocuments"). `isOnboardingMode` still drives the top-right
//     Skip/Continue pill, and the header still falls back to a Logout action
//     when there's no back stack so the user is never trapped.
//   • Same GET / POST (multipart) / DELETE on /api/travel-agent/documents.
//   • Required: ADDRESS_PROOF only (GST & PAN optional). Backend auto-promotes
//     status to UNDER_REVIEW once the required doc(s) are uploaded.
//   • Same byType resolution, same counters, same upload modal + validation.
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
import { DISPLAY } from "../_shared/typography";
import AnimatedOrb from "../_shared/AnimatedOrb";
import RemoteImage from "../_shared/RemoteImage";
import { C, G, TONES, rs, rf, GUT, alpha, cardShadow, rowShadow } from "../_shared/theme";
import {
  listTravelAgentDocuments,
  uploadTravelAgentDocument,
  deleteTravelAgentDocument,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
} from "../../api/travelAgentClient";

// Per-type meta: icon (Ionicons), accent tone, hint text. `required` is the
// source of truth for which docs the backend enforces.
const DOC_META = {
  ADDRESS_PROOF:        { label: "Address Proof",        icon: "home",            tone: "amber",   required: true,  hint: "Aadhaar / Electricity / Rental" },
  GST_CERTIFICATE:      { label: "GST Certificate",      icon: "receipt",         tone: "emerald", required: false, hint: "Download from gst.gov.in" },
  PAN_CARD:             { label: "PAN Card",             icon: "card",            tone: "ocean",   required: false, hint: "Front side, clearly visible" },
  AGENCY_REGISTRATION:  { label: "Agency Registration",  icon: "business",        tone: "plum",    required: false, hint: "Shop & Establishment / Partnership" },
  IATA_CERTIFICATE:     { label: "IATA Certificate",     icon: "airplane",        tone: "ocean",   required: false, hint: "If applicable" },
  TRAVEL_AGENT_LICENSE: { label: "Travel Agent License", icon: "ribbon",          tone: "rose",    required: false, hint: "State-issued license" },
  CANCELLED_CHEQUE:     { label: "Cancelled Cheque",     icon: "wallet",          tone: "amber",   required: false, hint: "For bank verification" },
  OWNER_AADHAAR:        { label: "Owner Aadhaar",        icon: "person",          tone: "emerald", required: false, hint: "Aadhaar of agency owner" },
  OWNER_PAN:            { label: "Owner PAN",            icon: "card",            tone: "ocean",   required: false, hint: "Personal PAN of owner" },
  BANK_DETAILS:         { label: "Bank Statement",       icon: "wallet",          tone: "amber",   required: false, hint: "Recent bank statement" },
  OTHER:                { label: "Other Document",       icon: "document-attach", tone: "plum",    required: false, hint: "Any additional document" },
};

const STATUS_META = {
  PENDING:  { label: "UNDER REVIEW", bg: C.tintGold,    fg: "#9A6B16",    accent: C.gold,        icon: "hourglass" },
  VERIFIED: { label: "VERIFIED",     bg: C.tintEmerald, fg: C.emeraldDeep, accent: C.emeraldDeep, icon: "checkmark-circle" },
  REJECTED: { label: "REJECTED",     bg: C.redL,        fg: C.red,        accent: C.red,         icon: "alert-circle" },
};

// Hero ↔ stats-card spacing. The card is pulled up by STATS_OVERLAP so it
// tucks into the hero's rounded bottom; HERO_TAIL is the padding under the
// progress rail. Visible gap = HERO_TAIL + hero paddingBottom(8) − overlap.
const HERO_TAIL = rs(30);
const STATS_OVERLAP = rs(20);

/** PDFs can't be previewed by <Image> — they get a styled tile instead. */
function isPdfUrl(url) {
  return typeof url === "string" && /\.pdf(\?|$)/i.test(url);
}

/** Short, human date for the card meta line — "3 Mar 2026". */
function fmtDocDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
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

  const onLogout = () =>
    Alert.alert("Logout?", "You can come back to upload documents later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: () => navigation.reset({ index: 0, routes: [{ name: "VendorLoginScreen" }] }),
      },
    ]);

  const progressPct = Math.round((verifiedRequired / REQUIRED_DOCUMENT_TYPES.length) * 100);

  const stageLabel = requiredDone
    ? "VERIFIED"
    : uploadedRequired === 0
    ? "NOT STARTED"
    : verifiedRequired < REQUIRED_DOCUMENT_TYPES.length
    ? "IN REVIEW"
    : "ALMOST THERE";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ── Hero ── */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
          <View style={styles.heroTop}>
            {navigation.canGoBack() ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.circleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={rs(19)} color="#fff" />
              </TouchableOpacity>
            ) : (
              // Onboarding entry — no back stack. Logout so the user isn't trapped.
              <TouchableOpacity
                onPress={onLogout}
                style={styles.circleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="log-out-outline" size={rs(19)} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }} />

            {/* Skip / Continue — top-right in onboarding mode */}
            {isOnboardingMode && (
              <TouchableOpacity
                style={styles.skipPill}
                onPress={onSkipToDashboard}
                activeOpacity={0.85}
              >
                <Text style={styles.skipPillText}>
                  {requiredDone ? "Continue" : "Skip"}
                </Text>
                <Ionicons name="arrow-forward" size={rs(12)} color={C.emeraldDeep} />
              </TouchableOpacity>
            )}
          </View>

          {/* Title block */}
          <View style={styles.heroTitleCol}>
            <Text style={styles.heroTitle} numberOfLines={1}>Documents</Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {requiredDone
                ? "All required docs verified"
                : `${verifiedRequired}/${REQUIRED_DOCUMENT_TYPES.length} required verified`}
            </Text>
          </View>

          {/* Pills sit directly under the sub line. Both share a fixed height
              so they read as one row. The "%" is a NESTED <Text> — RN
              baseline-aligns nested text automatically, which two sibling
              <Text>s with different lineHeights cannot do. */}
          <View style={styles.heroPillRow}>
            <View style={styles.heroPctPill}>
              <Text style={styles.heroPct}>
                {progressPct}
                <Text style={styles.heroPctSign}>%</Text>
              </Text>
              <Text style={styles.heroPctCaption}>COMPLETE</Text>
            </View>

            <View
              style={[
                styles.heroStageChip,
                requiredDone
                  ? { backgroundColor: "#fff" }
                  : { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
              ]}
            >
              <Ionicons
                name={requiredDone ? "checkmark-circle" : "hourglass"}
                size={rs(11)}
                color={requiredDone ? C.emeraldDeep : "#fff"}
              />
              <Text
                style={[
                  styles.heroStageText,
                  { color: requiredDone ? C.emeraldDeep : "#fff" },
                ]}
              >
                {stageLabel}
              </Text>
            </View>
          </View>

          {/* Full-width rail */}
          <View style={styles.heroBarTrack}>
            <LinearGradient
              colors={requiredDone ? G.emerald : G.gold}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.heroBarFill, { width: `${progressPct}%` }]}
            />
          </View>

          {/* Breathing room under the rail. The stats card below is pulled up
              by STATS_OVERLAP to tuck into the hero's curve, so the visible
              gap is (this + hero paddingBottom − STATS_OVERLAP). */}
          <View style={{ height: HERO_TAIL }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Stats card tucked into the hero curve ── */}
      <View style={styles.statsWrap}>
        <View style={[styles.statsCard, cardShadow]}>
          <StatCell
            value={`${verifiedRequired}/${REQUIRED_DOCUMENT_TYPES.length}`}
            label="Required"
            icon="alert-circle"
            tone={requiredDone ? "emerald" : "rose"}
          />
          <View style={styles.statDivider} />
          <StatCell value={totalUploaded} label="Uploaded" icon="cloud-upload" tone="ocean" />
          <View style={styles.statDivider} />
          <StatCell
            value={docs.filter((d) => d.status === "VERIFIED").length}
            label="Verified"
            icon="checkmark-done"
            tone="emerald"
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={rs(16)} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emeraldDeep} />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emeraldDeep}
              colors={[C.emeraldDeep]}
            />
          }
        >
          {/* Success banner (only when everything is done) */}
          {requiredDone && (
            <View style={styles.doneBanner}>
              <View style={styles.doneIconWrap}>
                <Ionicons name="checkmark-done-circle" size={rs(21)} color={C.emeraldDeep} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.doneTitle}>You're all set</Text>
                <Text style={styles.doneBody}>
                  All required documents are verified — your account is active.
                </Text>
              </View>
            </View>
          )}

          {/* ===== Required ===== */}
          <SectionLabel
            icon="alert-circle"
            tone={requiredDone ? "emerald" : "rose"}
            label="Required"
            badge={`${uploadedRequired}/${REQUIRED_DOCUMENT_TYPES.length}`}
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

          {/* ===== Optional ===== */}
          <SectionLabel
            icon="add-circle"
            tone="ocean"
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

          <View style={{ height: rs(28) }} />
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

function StatCell({ value, label, icon, tone }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: t.tint }]}>
        <Ionicons name={icon} size={rs(14)} color={t.ink} />
      </View>
      <View style={styles.statTextCol}>
        <Text style={[styles.statValue, { color: t.ink }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

function SectionLabel({ icon, tone, label, badge, hint }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionLabelIcon, { backgroundColor: t.tint }]}>
          <Ionicons name={icon} size={rs(13)} color={t.ink} />
        </View>
        <Text style={[styles.sectionLabelText, { color: t.ink }]}>{label}</Text>
        {!!badge && (
          <View style={[styles.sectionLabelBadge, { backgroundColor: t.tint }]}>
            <Text style={[styles.sectionLabelBadgeText, { color: t.ink }]}>{badge}</Text>
          </View>
        )}
      </View>
      {!!hint && <Text style={styles.sectionLabelHint}>{hint}</Text>}
    </View>
  );
}

function DocCard({ type, doc, onUpload, onView, onDelete }) {
  const meta = DOC_META[type] || { label: type, icon: "document", tone: "emerald", hint: "" };
  const tone = TONES[meta.tone] || TONES.emerald;
  const status = doc?.status;
  const sMeta = status ? STATUS_META[status] : null;
  const isRejected = status === "REJECTED";
  const isVerified = status === "VERIFIED";
  const isPdf = isPdfUrl(doc?.documentUrl);

  // ── Empty slot ── the whole row is tappable, styled as a dashed drop-zone
  // rather than a card with a big button bolted on the bottom.
  if (!doc) {
    // Icon and its dashed border share one accent — red on the required slot,
    // the doc type's own tone on every optional one. Border is that colour at
    // 30% so it reads as a tint of the icon. The card itself stays white.
    const slotAccent = meta.required ? C.red : tone.ink;
    return (
      <TouchableOpacity
        style={styles.emptyCard}
        onPress={onUpload}
        activeOpacity={0.75}
      >
        <View style={[styles.emptyThumb, { borderColor: alpha(slotAccent, 0.3) }]}>
          <Ionicons name={meta.icon} size={rs(21)} color={slotAccent} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.docLabelRow}>
            <Text style={styles.docLabel} numberOfLines={1}>{meta.label}</Text>
            {meta.required && (
              <View style={styles.requiredDot}>
                <Text style={styles.requiredDotText}>REQUIRED</Text>
              </View>
            )}
          </View>
          <Text style={styles.docHint} numberOfLines={1}>{meta.hint}</Text>
          <View style={styles.emptyCta}>
            <Ionicons name="cloud-upload-outline" size={rs(12)} color={C.emeraldDeep} />
            <Text style={styles.emptyCtaText}>Tap to upload</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={rs(17)} color={C.muted} />
      </TouchableOpacity>
    );
  }

  // ── Filled card ──
  const accent = sMeta ? sMeta.accent : tone.ink;

  return (
    <View
      style={[
        styles.docCard,
        rowShadow,
        isVerified && { borderColor: "rgba(28,107,82,0.22)" },
        isRejected && { borderColor: "rgba(192,69,59,0.26)" },
      ]}
    >
      {/* Status accent rail across the top */}
      <View style={[styles.docTopRail, { backgroundColor: accent }]} />

      <View style={styles.docBody}>
        <View style={styles.docRow}>
          {/* Thumbnail — real preview for images, styled tile for PDFs */}
          <TouchableOpacity onPress={onView} activeOpacity={0.85} style={styles.thumbWrap}>
            {isPdf ? (
              <View style={[styles.thumb, styles.thumbPdf]}>
                <Ionicons name="document-text" size={rs(24)} color={C.red} />
                <Text style={styles.thumbPdfText}>PDF</Text>
              </View>
            ) : (
              <View style={styles.thumb}>
                <RemoteImage
                  source={{ uri: doc.documentUrl }}
                  style={styles.thumbImg}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Corner status badge floating on the thumbnail */}
            <View style={[styles.thumbBadge, { backgroundColor: accent }]}>
              <Ionicons name={sMeta?.icon || "time"} size={rs(10)} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Meta column */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.docLabelRow}>
              <Text style={styles.docLabel} numberOfLines={1}>{meta.label}</Text>
            </View>

            {sMeta && (
              <View style={[styles.statusPill, { backgroundColor: sMeta.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: sMeta.accent }]} />
                <Text style={[styles.statusText, { color: sMeta.fg }]}>{sMeta.label}</Text>
              </View>
            )}

            {/* Doc number */}
            {!!doc.documentNumber && (
              <View style={styles.metaLine}>
                <Ionicons name="key-outline" size={rs(11)} color={C.muted} />
                <Text style={styles.metaText} numberOfLines={1}>{doc.documentNumber}</Text>
              </View>
            )}

            {/* Date line — verified date wins over upload date */}
            <View style={styles.metaLine}>
              <Ionicons
                name={isVerified ? "shield-checkmark-outline" : "time-outline"}
                size={rs(11)}
                color={C.muted}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {isVerified && doc.verifiedAt
                  ? `Verified ${fmtDocDate(doc.verifiedAt)}`
                  : `Uploaded ${fmtDocDate(doc.createdAt || doc.updatedAt)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Rejection reason */}
        {isRejected && !!doc.rejectionReason && (
          <View style={styles.rejectBox}>
            <Ionicons name="alert-circle" size={rs(13)} color={C.red} />
            <Text style={styles.rejectText} numberOfLines={3}>
              {doc.rejectionReason}
            </Text>
          </View>
        )}

        {/* Actions — primary "View" pill + icon-only secondary buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={onView} activeOpacity={0.85}>
            <Ionicons name="eye-outline" size={rs(14)} color={C.emeraldDeep} />
            <Text style={styles.viewBtnText}>View document</Text>
          </TouchableOpacity>

          {!isVerified && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: C.tintGold }]}
              onPress={onUpload}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isRejected ? "refresh" : "swap-horizontal"}
                size={rs(15)}
                color={TONES.amber.ink}
              />
            </TouchableOpacity>
          )}

          {!isVerified && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: C.redL }]}
              onPress={onDelete}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={rs(15)} color={C.red} />
            </TouchableOpacity>
          )}
        </View>
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
  const tone = TONES[meta.tone] || TONES.emerald;

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
            colors={G.hero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.modalHeaderRow}>
              <LinearGradient
                colors={tone.grad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.modalHeaderIcon}
              >
                <Ionicons name={meta.icon || "cloud-upload"} size={rs(20)} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {meta.label || "Upload Document"}
                </Text>
                <Text style={styles.modalHint} numberOfLines={1}>{meta.hint}</Text>
              </View>
              <TouchableOpacity onPress={close} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={rs(21)} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={{ maxHeight: rs(540) }} contentContainerStyle={{ padding: rs(16) }}>
            {/* Picked file preview OR pick options */}
            {file ? (
              <View style={styles.filePreview}>
                {file.type?.startsWith("image/") ? (
                  <Image source={{ uri: file.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewPdf}>
                    <Ionicons name="document-text" size={rs(26)} color={C.red} />
                    <Text style={styles.previewPdfText}>PDF</Text>
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  {file.size && (
                    <Text style={styles.fileSize}>{(file.size / 1024).toFixed(0)} KB</Text>
                  )}
                  <View style={styles.fileOkRow}>
                    <Ionicons name="checkmark-circle" size={rs(11)} color={C.emeraldDeep} />
                    <Text style={styles.fileOkText}>Ready to upload</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setFile(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={rs(22)} color={C.red} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickRow}>
                <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.85}>
                  <View style={[styles.pickIconWrap, { backgroundColor: C.tintOcean }]}>
                    <Ionicons name="image" size={rs(21)} color={TONES.ocean.ink} />
                  </View>
                  <Text style={styles.pickBtnLabel}>From gallery</Text>
                  <Text style={styles.pickBtnHint}>JPG / PNG / WebP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickBtn} onPress={pickDocument} activeOpacity={0.85}>
                  <View style={[styles.pickIconWrap, { backgroundColor: C.tintGold }]}>
                    <Ionicons name="document-text" size={rs(21)} color={TONES.amber.ink} />
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
              placeholderTextColor={C.muted}
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
                colors={G.emerald}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.uploadCtaInner}
              >
                {uploading ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="cloud-upload" size={rs(17)} color="#fff" />
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
  // ── Hero ──
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -rs(60), right: -rs(40),
    width: rs(190), height: rs(190), borderRadius: rs(95),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -rs(70), left: -rs(50),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  heroTop: { flexDirection: "row", alignItems: "center", paddingTop: rs(6) },
  circleBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  // Height pinned to the back button's so the two sit on the same optical line.
  skipPill: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(5), height: rs(38),
    paddingHorizontal: rs(15), borderRadius: 999,
    backgroundColor: "#fff",
  },
  skipPillText: {
    fontFamily: DISPLAY, color: C.emeraldDeep, fontWeight: "bold",
    fontSize: rf(12.5), lineHeight: rf(16),
  },
  // Title block, then a pill row, then a full-width rail. Explicit lineHeights
  // keep the vertical rhythm predictable across the serif metrics.
  heroTitleCol: { marginTop: rs(12) },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(21), lineHeight: rf(26),
    color: "#fff", letterSpacing: 0.2,
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    color: "rgba(255,255,255,0.65)", fontWeight: "bold", marginTop: rs(3),
  },

  // Both pills share HERO_PILL_H so they sit on one clean line.
  heroPillRow: {
    flexDirection: "row", alignItems: "center",
    flexWrap: "wrap", gap: rs(8), marginTop: rs(11),
  },
  heroPctPill: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    height: rs(28), paddingHorizontal: rs(11), borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  heroPct: {
    fontFamily: DISPLAY, fontSize: rf(14), lineHeight: rf(18),
    color: "#fff", letterSpacing: -0.2,
  },
  // Nested inside heroPct — inherits the family, only overrides size/colour.
  heroPctSign: { fontSize: rf(10), color: "rgba(255,255,255,0.65)" },
  heroPctCaption: {
    fontFamily: DISPLAY, fontSize: rf(8.5), lineHeight: rf(12),
    color: "rgba(255,255,255,0.55)", fontWeight: "bold", letterSpacing: 0.8,
  },

  heroStageChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(4), height: rs(28), paddingHorizontal: rs(10), borderRadius: 999,
  },
  heroStageText: {
    fontFamily: DISPLAY, fontSize: rf(9.5), lineHeight: rf(13),
    fontWeight: "bold", letterSpacing: 0.5,
  },

  heroBarTrack: {
    height: rs(7), backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: rs(4), overflow: "hidden", marginTop: rs(12),
  },
  heroBarFill: { height: "100%", borderRadius: rs(4) },

  // ── Stats card ──
  statsWrap: { marginHorizontal: GUT, marginTop: -STATS_OVERLAP },
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, borderRadius: rs(18),
    paddingVertical: rs(13), paddingHorizontal: rs(8),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  // Stays a compact row (keeps the card short), but the text column has a
  // fixed minWidth so every cell is the same width — otherwise the icons
  // drift left/right as the value text ("1/1" vs "3") changes width.
  statCell: {
    flex: 1, minWidth: 0,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: rs(8),
  },
  statIcon: {
    width: rs(28), height: rs(28), borderRadius: rs(10),
    alignItems: "center", justifyContent: "center",
  },
  statTextCol: { minWidth: rs(48), flexShrink: 1 },
  statValue: {
    fontFamily: DISPLAY, fontSize: rf(15), lineHeight: rf(19), fontWeight: "bold",
  },
  statLabel: {
    fontFamily: DISPLAY, fontSize: rf(9.5), lineHeight: rf(13),
    color: C.muted, fontWeight: "bold", letterSpacing: 0.4,
  },
  statDivider: { width: 1, height: rs(28), backgroundColor: C.border },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginHorizontal: GUT, marginTop: rs(12), padding: rs(11),
    backgroundColor: C.redL, borderRadius: rs(12),
    borderWidth: 1, borderColor: "rgba(192,69,59,0.22)",
  },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12.5), flex: 1, fontWeight: "600" },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: rf(12.5) },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: rs(12) },
  loadingText: { fontFamily: DISPLAY, fontSize: rf(13), color: C.muted, fontWeight: "600" },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(18), paddingBottom: rs(24) },

  // ── Done banner ──
  doneBanner: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    padding: rs(14), borderRadius: rs(16),
    backgroundColor: C.tintEmerald, borderWidth: 1, borderColor: "rgba(28,107,82,0.18)",
    marginBottom: rs(14),
  },
  doneIconWrap: {
    width: rs(40), height: rs(40), borderRadius: rs(13),
    backgroundColor: "rgba(28,107,82,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold", color: C.emeraldDeep },
  doneBody: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub,
    fontWeight: "600", marginTop: rs(2), lineHeight: rf(16),
  },

  // ── Section label ──
  sectionLabelWrap: { marginTop: rs(14), marginBottom: rs(11) },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: rs(7) },
  sectionLabelIcon: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center",
  },
  sectionLabelText: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(11.5), fontWeight: "bold",
    letterSpacing: 0.6, textTransform: "uppercase",
  },
  sectionLabelBadge: { paddingHorizontal: rs(9), paddingVertical: rs(3), borderRadius: 999 },
  sectionLabelBadgeText: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold" },
  sectionLabelHint: {
    fontFamily: DISPLAY, fontSize: rf(11), color: C.muted,
    fontWeight: "600", marginTop: rs(4), marginLeft: rs(33), fontStyle: "italic",
  },

  // ── Empty slot (no doc uploaded yet) ──
  emptyCard: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    backgroundColor: C.card, borderRadius: rs(16), marginBottom: rs(10),
    paddingVertical: rs(13), paddingHorizontal: rs(13),
    borderWidth: 1, borderColor: C.border, borderStyle: "dashed",
  },
  emptyThumb: {
    width: rs(52), height: rs(52), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.ivory, borderWidth: 1.5, borderStyle: "dashed",
  },
  emptyCta: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: rs(6) },
  emptyCtaText: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.emeraldDeep,
    fontWeight: "bold", letterSpacing: 0.2,
  },

  // ── Filled doc card ──
  docCard: {
    backgroundColor: C.card, borderRadius: rs(16), marginBottom: rs(10),
    overflow: "hidden", borderWidth: 1, borderColor: C.border,
  },
  docTopRail: { height: rs(3), width: "100%" },
  docBody: { padding: rs(13) },
  docRow: { flexDirection: "row", alignItems: "flex-start", gap: rs(12) },

  // Thumbnail
  thumbWrap: { position: "relative" },
  thumb: {
    width: rs(64), height: rs(64), borderRadius: rs(14),
    backgroundColor: C.ivory, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbPdf: { backgroundColor: C.redL, borderColor: "rgba(192,69,59,0.2)" },
  thumbPdfText: {
    fontFamily: DISPLAY, fontSize: rf(8.5), color: C.red,
    fontWeight: "bold", marginTop: rs(2), letterSpacing: 0.6,
  },
  thumbBadge: {
    position: "absolute", right: -rs(4), bottom: -rs(4),
    width: rs(21), height: rs(21), borderRadius: rs(11),
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.card,
  },

  docLabelRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  docLabel: {
    fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold",
    color: C.ink, flexShrink: 1,
  },
  docHint: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, marginTop: rs(2), fontWeight: "600" },
  requiredDot: {
    paddingHorizontal: rs(6), paddingVertical: rs(2),
    borderRadius: rs(5), backgroundColor: C.redL,
  },
  requiredDotText: {
    fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: "bold",
    color: C.red, letterSpacing: 0.4,
  },

  statusPill: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: 999, marginTop: rs(5),
  },
  statusDot: { width: rs(5), height: rs(5), borderRadius: rs(3) },
  statusText: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold", letterSpacing: 0.4 },

  metaLine: { flexDirection: "row", alignItems: "center", gap: rs(5), marginTop: rs(5) },
  metaText: {
    fontFamily: DISPLAY, fontSize: rf(11), color: C.sub,
    fontWeight: "600", letterSpacing: 0.2, flexShrink: 1,
  },

  rejectBox: {
    flexDirection: "row", alignItems: "flex-start", gap: rs(6),
    padding: rs(10), borderRadius: rs(11),
    backgroundColor: "rgba(192,69,59,0.08)",
    borderLeftWidth: rs(3), borderLeftColor: C.red,
    marginTop: rs(11),
  },
  rejectText: {
    fontFamily: DISPLAY, color: C.red, fontSize: rf(11.5),
    flex: 1, fontWeight: "600", lineHeight: rf(16),
  },

  // Actions — wide primary + compact icon buttons
  actionsRow: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginTop: rs(12), paddingTop: rs(11),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  viewBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(6), paddingVertical: rs(10), borderRadius: rs(11),
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.16)",
  },
  viewBtnText: {
    fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.emeraldDeep,
  },
  iconBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },

  // ── Upload modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(11,51,39,0.55)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: rs(26), borderTopRightRadius: rs(26),
    paddingBottom: Platform.OS === "ios" ? rs(24) : rs(12),
    overflow: "hidden",
    maxHeight: "88%",
  },
  modalHeaderGrad: { paddingHorizontal: rs(16), paddingVertical: rs(16) },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: rs(12) },
  modalHeaderIcon: {
    width: rs(42), height: rs(42), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "bold", color: "#fff" },
  modalHint: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: "rgba(255,255,255,0.7)",
    fontWeight: "600", marginTop: rs(2),
  },
  modalCloseBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },

  pickRow: { flexDirection: "row", gap: rs(10), marginBottom: rs(14) },
  pickBtn: {
    flex: 1, alignItems: "center", gap: rs(7),
    paddingVertical: rs(18), paddingHorizontal: rs(8),
    borderRadius: rs(16), backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed",
  },
  pickIconWrap: {
    width: rs(44), height: rs(44), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center",
  },
  pickBtnLabel: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.ink },
  pickBtnHint: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted, fontWeight: "600" },

  filePreview: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    padding: rs(12), borderRadius: rs(14),
    backgroundColor: C.tintEmerald, borderWidth: 1, borderColor: "rgba(28,107,82,0.18)",
    marginBottom: rs(14),
  },
  previewImage: { width: rs(56), height: rs(56), borderRadius: rs(12), backgroundColor: C.sand },
  previewPdf: {
    width: rs(56), height: rs(56), borderRadius: rs(12), backgroundColor: C.redL,
    alignItems: "center", justifyContent: "center",
  },
  previewPdfText: {
    fontFamily: DISPLAY, fontSize: rf(9), color: C.red,
    fontWeight: "bold", marginTop: rs(2), letterSpacing: 0.5,
  },
  fileName: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.ink },
  fileSize: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, marginTop: rs(2), fontWeight: "600" },
  fileOkRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: rs(4) },
  fileOkText: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.emeraldDeep, fontWeight: "bold" },

  fieldLabel: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub,
    fontWeight: "bold", marginBottom: rs(6), marginTop: rs(4),
    letterSpacing: 0.4, textTransform: "uppercase",
  },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: rs(12),
    paddingHorizontal: rs(13), paddingVertical: rs(11), fontSize: rf(14),
    color: C.ink, minHeight: rs(48), letterSpacing: 0.5, fontFamily: DISPLAY,
  },
  formatHint: {
    fontFamily: DISPLAY, fontSize: rf(11), color: C.muted,
    textAlign: "center", marginTop: rs(10), fontStyle: "italic", fontWeight: "600",
  },

  uploadCtaWrap: { marginTop: rs(14), borderRadius: rs(14), overflow: "hidden" },
  uploadCtaInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(8), paddingVertical: rs(14),
  },
  uploadCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(14.5) },
});

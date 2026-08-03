// screens/travel-agent/profile/AgencyProfileScreen.js
// REDESIGNED — emerald-themed Agency Profile.
//
// GET /api/travel-agent/profile  → full agent record
// PUT /api/travel-agent/profile  → update editable fields
//
// Email + phone are intentionally read-only — changing them needs the separate
// verification flow (forgot-password / re-register), same as web.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, RefreshControl, Modal, Share, Linking, StatusBar,
  Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import { DISPLAY } from "../_shared/typography";
import {
  getTravelAgentProfile,
  updateTravelAgentProfile,
  getBaseURL,
  updateCachedTravelAgent,
} from "../../api/travelAgentClient";
import { SC as C } from "../_shared/theme";


const AGENCY_TYPES = [
  "Solo Travel Agent",
  "Travel Agency",
  "Corporate / In-house Travel Desk",
  "DMC (Destination Management Co.)",
  "OTA (Online Travel Agency)",
  "Tour Operator",
  "Other",
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh",
];

const STATUS_META = {
  APPROVED:          { bg: C.emerald50,  fg: C.emerald700, label: "Verified",      icon: "checkmark-circle" },
  PENDING:           { bg: C.amberLight, fg: "#8A6420",    label: "Pending",       icon: "time" },
  DOCUMENTS_PENDING: { bg: C.amberLight, fg: "#8A6420",    label: "Docs pending",  icon: "document-attach" },
  UNDER_REVIEW:      { bg: C.blueLight,  fg: "#1E4E86",    label: "Under review",  icon: "hourglass" },
  REJECTED:          { bg: C.redLight,   fg: "#9E362E",    label: "Rejected",      icon: "close-circle" },
  SUSPENDED:         { bg: C.redLight,   fg: "#9E362E",    label: "Suspended",     icon: "ban" },
};

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// Slowly drifting/pulsing decorative orb for the hero — gentle ambient motion.
function AnimatedOrb({ style, delay = 0, dx = 14, dy = 12 }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 5200, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  return (
    <Animated.View pointerEvents="none" style={[style, { transform: [{ translateX }, { translateY }, { scale }] }]} />
  );
}

export default function AgencyProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [showAgencyTypeModal, setShowAgencyTypeModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [expanded, setExpanded] = useState({
    agency: true, tax: false, address: false,
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getTravelAgentProfile();
      const p = data.travelAgent || data.profile || data.agent || data;
      setProfile(p);
      setForm({
        agencyName: p.agencyName || "",
        agencyType: p.agencyType || "",
        ownerName: p.ownerName || "",
        gstNumber: p.gstNumber || "",
        panNumber: p.panNumber || "",
        address: p.address || "",
        city: p.city || "",
        state: p.state || "",
        pincode: p.pincode || "",
        website: p.website || "",
        description: p.description || "",
      });
      if (p.slug) {
        const baseURL = await getBaseURL();
        // Public agency profile lives at /agent/{slug} (NOT /travel-agent/* which
        // is the dashboard). Must match src/app/agent/[slug]/page.tsx.
        setShareUrl(`${baseURL}/agent/${encodeURIComponent(p.slug)}`);
      } else {
        setShareUrl(null);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };
  const update = (k, v) => setForm((p) => (p ? { ...p, [k]: v } : p));

  // Completion ratio for header chips.
  const completion = useMemo(() => {
    if (!form) return 0;
    let c = 0;
    if (form.agencyName.trim()) c++;
    if (form.ownerName.trim()) c++;
    if (form.agencyType) c++;
    if (form.city.trim() && form.state) c++;
    if (form.gstNumber.trim() || form.panNumber.trim()) c++;
    return c;
  }, [form]);

  const save = async () => {
    if (!form?.agencyName?.trim()) return Alert.alert("Required", "Agency name is required.");
    const payload = {
      agencyName: form.agencyName.trim(),
      agencyType: form.agencyType || null,
      ownerName: form.ownerName.trim(),
      gstNumber: form.gstNumber.trim().toUpperCase() || null,
      panNumber: form.panNumber.trim().toUpperCase() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      pincode: form.pincode.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
    };
    try {
      setSaving(true);
      const data = await updateTravelAgentProfile(payload);
      const updated = data.travelAgent || data.profile || data.agent || data;
      setProfile((prev) => ({ ...prev, ...updated }));
      await updateCachedTravelAgent({
        agencyName: payload.agencyName,
        ownerName: payload.ownerName,
        city: payload.city,
        state: payload.state,
      });
      Alert.alert("Saved", "Your profile was updated.");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onCopyUrl = () => {
    if (!shareUrl) return;
    Clipboard.setString(shareUrl);
    Alert.alert("Copied", "Public profile URL copied.");
  };
  const onShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await Share.share({
        message: `Check out my travel agency on TransRentals:\n${shareUrl}\n\n— ${profile?.agencyName || ""}`,
      });
    } catch {}
  };
  const onOpenUrl = () => shareUrl && Linking.openURL(shareUrl).catch(() => {});
  const onOpenWebsite = () => {
    const w = form?.website?.trim();
    if (!w) return;
    const url = w.startsWith("http") ? w : `https://${w}`;
    Linking.openURL(url).catch(() => {});
  };

  // ===== Loading state =====
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <LinearGradient
          colors={["#0F2A22", "#16382E", "#1C6B52"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerGradSimple}
        >
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
            <View style={styles.headerRowSimple}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitleSimple}>Agency Profile</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    );
  }

  if (!profile || !form) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <LinearGradient
          colors={["#0F2A22", "#16382E", "#1C6B52"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerGradSimple}
        >
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
            <View style={styles.headerRowSimple}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitleSimple}>Agency Profile</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.notFoundWrap}>
          <View style={styles.notFoundIconWrap}>
            <Ionicons name="alert-circle" size={42} color={C.red} />
          </View>
          <Text style={styles.notFoundTitle}>Profile not loaded</Text>
          {!!error && <Text style={styles.notFoundBody}>{error}</Text>}
          <TouchableOpacity style={styles.backCta} onPress={load} activeOpacity={0.9}>
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.backCtaInner}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.backCtaText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusMeta = STATUS_META[profile.status] || STATUS_META.PENDING;
  const isApproved = profile.status === "APPROVED";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* ===== Compact gradient header (horizontal: avatar | info) ===== */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 38 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Agency Profile</Text>
            <TouchableOpacity
              style={[styles.headerSaveBtn, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={C.emerald700} />
              ) : (
                <Text style={styles.headerSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Horizontal hero body — avatar on left, name + pills on right */}
          <View style={styles.heroBody}>
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={["#FFFFFF", "#F1ECE0"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {initials(form.agencyName || profile.agencyName)}
                </Text>
              </LinearGradient>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.displayName} numberOfLines={1}>
                {form.agencyName || profile.agencyName || "Your Agency"}
              </Text>
              {!!form.ownerName && (
                <Text style={styles.ownerName} numberOfLines={1}>{form.ownerName}</Text>
              )}
              {/* Status + completion pills (compact, inline) */}
              <View style={styles.metaRow}>
                <View style={[styles.statusPill, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
                  <Ionicons name={statusMeta.icon} size={10} color="#fff" />
                  <Text style={styles.statusPillText}>{statusMeta.label.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: "#fff" }]}>
                  <Ionicons name="checkmark-done" size={10} color={C.emerald700} />
                  <Text style={[styles.statusPillText, { color: C.emerald700 }]}>
                    {completion}/5
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating status action card (when not approved) ===== */}
      {!isApproved && (
        <TouchableOpacity
          style={styles.actionableStatusCard}
          onPress={() => navigation.navigate("TADocuments")}
          activeOpacity={0.9}
        >
          <View style={[styles.actionableStatusIcon, { backgroundColor: statusMeta.bg }]}>
            <Ionicons name={statusMeta.icon} size={18} color={statusMeta.fg} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.actionableStatusTitle}>
              {profile.status === "DOCUMENTS_PENDING"
                ? "Upload your KYC docs"
                : profile.status === "PENDING"
                ? "Profile pending review"
                : profile.status === "UNDER_REVIEW"
                ? "Docs under review"
                : profile.status === "REJECTED"
                ? "Profile rejected — review feedback"
                : "Account suspended"}
            </Text>
            <Text style={styles.actionableStatusSub}>
              {profile.status === "DOCUMENTS_PENDING"
                ? "Tap to upload GST, PAN, address proof"
                : profile.status === "REJECTED" || profile.status === "SUSPENDED"
                ? "Contact support for next steps"
                : "We'll notify you when verified"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={statusMeta.fg} />
        </TouchableOpacity>
      )}

      {/* ===== Approved → floating public profile share card ===== */}
      {isApproved && shareUrl && (
        <View style={styles.shareCard}>
          <View style={styles.shareTopRow}>
            <View style={styles.shareIconWrap}>
              <Ionicons name="globe" size={13} color={C.emerald600} />
            </View>
            <Text style={styles.shareLabel}>PUBLIC PROFILE</Text>
            <View style={styles.shareLiveDot}>
              <View style={styles.shareLiveDotInner} />
              <Text style={styles.shareLiveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.shareUrl} numberOfLines={1}>{shareUrl}</Text>
          <View style={styles.shareActionsRow}>
            <TouchableOpacity
              style={styles.shareActionPrimaryWrap}
              onPress={onShareUrl}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[C.emerald600, C.emerald700]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.shareActionPrimaryInner}
              >
                <Ionicons name="share-social" size={13} color="#fff" />
                <Text style={styles.shareActionPrimaryText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareActionLight} onPress={onCopyUrl} activeOpacity={0.85}>
              <Ionicons name="copy-outline" size={13} color={C.blue} />
              <Text style={[styles.shareActionLightText, { color: C.blue }]}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareActionLight} onPress={onOpenUrl} activeOpacity={0.85}>
              <Ionicons name="open-outline" size={13} color={C.emerald700} />
              <Text style={[styles.shareActionLightText, { color: C.emerald700 }]}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
        >
          {/* ===== Read-only account (email + phone) ===== */}
          <SectionLabel icon="lock-closed" color={C.subText} label="Account" hint="Locked — change via support" />
          <View style={styles.card}>
            <ReadOnlyField icon="mail" color={C.blue} label="Email" value={profile.email} />
            <ReadOnlyField icon="call" color={C.emerald600} label="Phone" value={profile.phone} />
          </View>

          {/* ===== Agency basics ===== */}
          <SectionToggle
            icon="business" color={C.emerald600}
            label="Agency info"
            sub={
              form.agencyName
                ? `${form.agencyName.slice(0, 32)}${form.agencyName.length > 32 ? "…" : ""}`
                : "Name, type, owner, description"
            }
            open={expanded.agency}
            onToggle={() => setExpanded((s) => ({ ...s, agency: !s.agency }))}
          />
          {expanded.agency && (
            <Card>
              <Field label="Agency name *">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}22` }]}>
                    <Ionicons name="business" size={14} color={C.emerald600} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.iconInputField]}
                    placeholder="Your Agency Name"
                    placeholderTextColor="#9AA79E"
                    value={form.agencyName}
                    onChangeText={(v) => update("agencyName", v)}
                  />
                </View>
              </Field>
              <Field label="Agency type">
                <PickerBtn
                  icon="briefcase"
                  iconColor={C.purple}
                  value={form.agencyType || "Select agency type"}
                  placeholder={!form.agencyType}
                  onPress={() => setShowAgencyTypeModal(true)}
                  onClear={form.agencyType ? () => update("agencyType", "") : null}
                />
              </Field>
              <Field label="Owner / contact name">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.purple}22` }]}>
                    <Ionicons name="person" size={14} color={C.purple} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.iconInputField]}
                    placeholder="Owner full name"
                    placeholderTextColor="#9AA79E"
                    value={form.ownerName}
                    onChangeText={(v) => update("ownerName", v)}
                  />
                </View>
              </Field>
              <Field
                label="Description (about you)"
                helper={`${(form.description || "").length}/500 characters`}
              >
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="What makes your agency special — services, regions, USP…"
                  placeholderTextColor="#9AA79E"
                  value={form.description}
                  onChangeText={(v) => update("description", v)}
                  multiline numberOfLines={4} textAlignVertical="top"
                  maxLength={500}
                />
              </Field>
              <Field label="Website (optional)">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}22` }]}>
                    <Ionicons name="globe" size={14} color={C.blue} />
                  </View>
                  <TextInput
                    style={[
                      styles.input, styles.iconInputField,
                      !!form.website?.trim() && { paddingRight: 44 },
                    ]}
                    placeholder="https://your-site.com"
                    placeholderTextColor="#9AA79E"
                    autoCapitalize="none"
                    keyboardType="url"
                    value={form.website}
                    onChangeText={(v) => update("website", v.trim())}
                  />
                  {!!form.website?.trim() && (
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={onOpenWebsite}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="open-outline" size={16} color={C.blue} />
                    </TouchableOpacity>
                  )}
                </View>
              </Field>
            </Card>
          )}

          {/* ===== Tax info ===== */}
          <SectionToggle
            icon="document-text" color={C.amber}
            label="Tax info"
            sub={
              form.gstNumber || form.panNumber
                ? `${form.gstNumber ? "GST ✓" : "—"} · ${form.panNumber ? "PAN ✓" : "—"}`
                : "GST + PAN numbers"
            }
            open={expanded.tax}
            onToggle={() => setExpanded((s) => ({ ...s, tax: !s.tax }))}
          />
          {expanded.tax && (
            <Card>
              <Field label="GST Number" helper="15-character GSTIN">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.amber}22` }]}>
                    <Ionicons name="receipt" size={14} color={C.amber} />
                  </View>
                  <TextInput
                    style={[
                      styles.input, styles.iconInputField,
                      { textTransform: "uppercase", letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
                    ]}
                    placeholder="22AAAAA0000A1Z5"
                    placeholderTextColor="#9AA79E"
                    maxLength={15}
                    autoCapitalize="characters"
                    value={form.gstNumber}
                    onChangeText={(v) => update("gstNumber", v.toUpperCase())}
                  />
                </View>
              </Field>
              <Field label="PAN Number" helper="10-character PAN">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}22` }]}>
                    <Ionicons name="card" size={14} color={C.blue} />
                  </View>
                  <TextInput
                    style={[
                      styles.input, styles.iconInputField,
                      { textTransform: "uppercase", letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
                    ]}
                    placeholder="AAAAA0000A"
                    placeholderTextColor="#9AA79E"
                    maxLength={10}
                    autoCapitalize="characters"
                    value={form.panNumber}
                    onChangeText={(v) => update("panNumber", v.toUpperCase())}
                  />
                </View>
              </Field>
            </Card>
          )}

          {/* ===== Business address ===== */}
          <SectionToggle
            icon="location" color={C.blue}
            label="Business address"
            sub={
              form.city
                ? `${form.city}${form.state ? `, ${form.state}` : ""}${form.pincode ? ` · ${form.pincode}` : ""}`
                : "Street, city, state, pincode"
            }
            open={expanded.address}
            onToggle={() => setExpanded((s) => ({ ...s, address: !s.address }))}
          />
          {expanded.address && (
            <Card>
              <Field label="Street address">
                <View style={styles.iconInputWrap}>
                  <View style={[styles.iconInputIcon, { backgroundColor: `${C.red}22` }]}>
                    <Ionicons name="navigate" size={14} color={C.red} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.iconInputField, { minHeight: 70, paddingTop: 12 }]}
                    placeholder="Building, street, area"
                    placeholderTextColor="#9AA79E"
                    multiline numberOfLines={2} textAlignVertical="top"
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
                    placeholderTextColor="#9AA79E"
                    value={form.city}
                    onChangeText={(v) => update("city", v)}
                  />
                </Field>
                <Field label="Pincode" style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit"
                    placeholderTextColor="#9AA79E"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={form.pincode}
                    onChangeText={(v) => update("pincode", v.replace(/\D/g, ""))}
                  />
                </Field>
              </View>
              <Field label="State">
                <PickerBtn
                  icon="flag"
                  iconColor={C.emerald600}
                  value={form.state || "Select state"}
                  placeholder={!form.state}
                  onPress={() => setShowStateModal(true)}
                  onClear={form.state ? () => update("state", "") : null}
                />
              </Field>
            </Card>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Sticky bottom save bar ===== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.publishBtnWrap, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
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
                <Text style={styles.publishBtnText}>Save changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <PickerModal
        visible={showAgencyTypeModal}
        title="Agency type"
        subtitle="What best describes your business?"
        options={AGENCY_TYPES}
        selected={form.agencyType}
        onClose={() => setShowAgencyTypeModal(false)}
        onSelect={(v) => { update("agencyType", v); setShowAgencyTypeModal(false); }}
      />
      <PickerModal
        visible={showStateModal}
        title="State"
        subtitle="Where is your business registered?"
        options={STATES}
        selected={form.state}
        onClose={() => setShowStateModal(false)}
        onSelect={(v) => { update("state", v); setShowStateModal(false); }}
      />
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

function SectionLabel({ icon, color, label, hint }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={12} color={color} />
        </View>
        <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
      </View>
      {!!hint && <Text style={styles.sectionLabelHint}>{hint}</Text>}
    </View>
  );
}

function SectionToggle({ icon, color, label, sub, open, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.sectionToggle, open && styles.sectionToggleOpen]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={[styles.sectionToggleIcon, { backgroundColor: `${color}1F` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.sectionToggleText, { color }]}>{label}</Text>
        {!!sub && <Text style={styles.sectionToggleSub} numberOfLines={1}>{sub}</Text>}
      </View>
      <View style={[styles.sectionToggleChev, { backgroundColor: `${color}14` }]}>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={15} color={color} />
      </View>
    </TouchableOpacity>
  );
}

function ReadOnlyField({ icon, color, label, value }) {
  const canCopy = !!value;
  const onCopy = () => {
    if (!canCopy) return;
    Clipboard.setString(value);
    Alert.alert("Copied", `${label} copied to clipboard.`);
  };
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readonlyBox}>
        {/* Tinted icon tile — full row height, rounded only on the left. */}
        <View style={[styles.readonlyIcon, { backgroundColor: `${color}1A` }]}>
          <Ionicons name={icon} size={15} color={color} />
        </View>
        <Text style={styles.readonlyText} numberOfLines={1}>{value || "—"}</Text>
        {canCopy ? (
          <TouchableOpacity
            onPress={onCopy}
            style={styles.copyBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="copy-outline" size={15} color={C.subText} />
          </TouchableOpacity>
        ) : (
          <View style={styles.lockWrap}>
            <Ionicons name="lock-closed" size={12} color={C.subText} />
          </View>
        )}
      </View>
    </View>
  );
}

function PickerBtn({ icon, iconColor, value, placeholder, onPress, onClear }) {
  return (
    <View style={styles.iconInputWrap}>
      {icon && (
        <View style={[styles.iconInputIcon, { backgroundColor: `${iconColor || C.emerald600}22` }]}>
          <Ionicons name={icon} size={14} color={iconColor || C.emerald600} />
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.pickerBtn,
          icon && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.pickerText, placeholder && { color: "#9AA79E", fontWeight: "600" }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={C.subText} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={C.subText} />
        )}
      </TouchableOpacity>
    </View>
  );
}

function PickerModal({ visible, title, subtitle, options, selected, onClose, onSelect }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Gradient header */}
          <LinearGradient
            colors={["#0F2A22", "#16382E", "#1C6B52"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="list" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>{title}</Text>
                {!!subtitle && <Text style={styles.modalSub}>{subtitle}</Text>}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ padding: 14 }}>
            {options.map((opt) => {
              const active = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalItem,
                    active && { backgroundColor: C.emerald50, borderColor: C.emerald600 },
                  ]}
                  onPress={() => onSelect(opt)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.modalItemRadio,
                    active && { backgroundColor: C.emerald600, borderColor: C.emerald600 },
                  ]}>
                    {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[
                    styles.modalItemText,
                    active && { color: C.emerald700, fontWeight: "bold" },
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Simple header (loading / error)
  headerGradSimple: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRowSimple: { flexDirection: "row", alignItems: "center", paddingTop: 4, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitleSimple: { fontFamily: DISPLAY, flex: 1, fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "left", marginLeft: 4 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },

  notFoundWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.redLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  notFoundTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, marginTop: 6 },
  notFoundBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19 },
  backCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  backCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  backCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },

  // Hero
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
  headerTitle: { fontFamily: DISPLAY, flex: 1, fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "left", marginLeft: 4 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, minWidth: 44, alignItems: "center" },
  headerSaveText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 12.5 },

  // Horizontal hero — avatar on left, info on right (compact).
  heroBody: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8, paddingHorizontal: 4 },
  avatarRing: {
    width: 62, height: 62, borderRadius: 18,
    padding: 2, borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  avatar: { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 20, letterSpacing: 0.5 },
  displayName: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: "#fff", letterSpacing: -0.2 },
  ownerName: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2, fontWeight: "600" },

  metaRow: { flexDirection: "row", gap: 5, marginTop: 6, flexWrap: "wrap" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4 },

  // Actionable status card (not approved)
  actionableStatusCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: -20,
    padding: 14, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  actionableStatusIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionableStatusTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  actionableStatusSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },

  // Approved → share card
  shareCard: {
    marginHorizontal: 16, marginTop: -20,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  shareTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  shareIconWrap: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  shareLabel: { fontFamily: DISPLAY, fontSize: 10.5, color: C.emerald700, fontWeight: "bold", letterSpacing: 0.6, flex: 1 },
  shareLiveDot: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald600 },
  shareLiveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.emerald600 },
  shareLiveText: { fontFamily: DISPLAY, fontSize: 9.5, color: C.emerald700, fontWeight: "bold", letterSpacing: 0.5 },
  shareUrl: { fontSize: 12.5, color: C.text, fontWeight: "bold", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginBottom: 10 },
  shareActionsRow: { flexDirection: "row", gap: 6 },
  shareActionPrimaryWrap: { flex: 2, borderRadius: 10, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  shareActionPrimaryInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10 },
  shareActionPrimaryText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 12.5 },
  shareActionLight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: "#FBF8F1", borderWidth: 1, borderColor: C.border },
  shareActionLightText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold" },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },

  // Section label (read-only Account)
  sectionLabelWrap: { marginTop: 6, marginBottom: 10 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabelIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabelText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase" },
  sectionLabelHint: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 4, marginLeft: 30, fontStyle: "italic" },

  // Section toggle (collapsible card header)
  sectionToggle: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 14, paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  // When expanded, flatten the bottom so it reads as one unit with the card below.
  sectionToggleOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  sectionToggleIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionToggleText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", letterSpacing: 0.3 },
  sectionToggleSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, marginTop: 2, fontWeight: "600" },
  sectionToggleChev: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginTop: -1,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },

  // Field
  field: { marginBottom: 14 },
  fieldLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 6 },
  helper: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 4, fontWeight: "600", fontStyle: "italic" },
  input: {
    fontFamily: DISPLAY,
    backgroundColor: "#FBF8F1", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },
  inputMultiline: { minHeight: 100, paddingTop: 10 },
  row2: { flexDirection: "row", gap: 10 },

  // Icon-prefix input
  iconInputWrap: { flexDirection: "row", alignItems: "stretch", position: "relative" },
  iconInputIcon: {
    width: 44, justifyContent: "center", alignItems: "center",
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
    borderWidth: 1, borderRightWidth: 0, borderColor: C.border,
  },
  iconInputField: {
    flex: 1, borderLeftWidth: 0,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
  },
  eyeBtn: { position: "absolute", right: 0, top: 0, bottom: 0, width: 40, alignItems: "center", justifyContent: "center" },

  // Read-only field
  readonlyBox: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: "#FBF8F1", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    minHeight: 48, overflow: "hidden",
  },
  // Full-height tinted icon tile (left side of row)
  readonlyIcon: {
    width: 44, alignItems: "center", justifyContent: "center",
  },
  readonlyText: {
    fontFamily: DISPLAY,
    flex: 1, fontSize: 14, color: C.ink, fontWeight: "bold",
    paddingHorizontal: 12, alignSelf: "center",
  },
  copyBtn: { width: 44, alignItems: "center", justifyContent: "center" },
  lockWrap: { width: 44, alignItems: "center", justifyContent: "center" },

  // Picker button
  pickerBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FBF8F1", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, height: 46,
  },
  pickerText: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.ink, fontWeight: "bold" },

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
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12 },
  publishBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13.5 },

  // Picker modal (gradient header)
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden", maxHeight: "85%",
  },
  modalHeaderGrad: { paddingHorizontal: 16, paddingVertical: 16 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: "#fff" },
  modalSub: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  modalItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FBF8F1",
  },
  modalItemRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  modalItemText: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.text, fontWeight: "bold" },
});

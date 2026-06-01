// screens/travel-agent/social/CreatePostScreen.js
// REDESIGNED — emerald-themed compose-post screen.
// POST /api/social/posts  body: { content, categoryId?, images? }
//
// Author preview at top + textarea + category chips + image picker + live
// post preview. Categories with `isSOS: true` flip the entire UI to red.
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  createSocialPost,
  listSocialCategories,
  getCurrentTravelAgent,
} from "../../api/travelAgentClient";
import ImagePickerField from "../_shared/ImagePickerField";
import RemoteImage from "../_shared/RemoteImage";

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

const MAX_CHARS = 2000;
const WARN_AT = MAX_CHARS - 200;

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function shade(hex, pct) {
  const f = parseInt(hex.slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  const R = f >> 16, G = (f >> 8) & 0xff, B = f & 0xff;
  return (
    "#" +
    (0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    ).toString(16).slice(1)
  );
}

export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [posting, setPosting] = useState(false);
  const [agent, setAgent] = useState(null);

  // Load categories + current agent (for author preview).
  useEffect(() => {
    (async () => {
      try {
        const data = await listSocialCategories();
        const list = Array.isArray(data) ? data : data?.categories || [];
        setCategories(list);
      } catch (e) {
        console.log("[CreatePost] categories load failed:", e?.message);
      }
    })();
    (async () => {
      try {
        const ta = await getCurrentTravelAgent();
        if (ta) setAgent(ta);
      } catch {}
    })();
  }, []);

  const canSubmit = content.trim().length >= 2 && !posting;
  const charsLeft = MAX_CHARS - content.length;
  const overLimit = content.length > MAX_CHARS;
  const showWarn = content.length >= WARN_AT;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const isSOS = !!selectedCategory?.isSOS;

  const submit = async () => {
    const text = content.trim();
    if (!text) return Alert.alert("Required", "Write something to post.");
    try {
      setPosting(true);
      await createSocialPost({
        content: text,
        categoryId: categoryId || undefined,
        images: images.length ? images : undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  // SOS mode flips the hero/Post button to red — visually loud.
  const heroColors = isSOS
    ? ["#DC2626", "#B91C1C"]
    : [C.emerald700, C.emerald600];
  const accent = isSOS ? C.red : C.emerald600;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={heroColors[0]} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={heroColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (content.trim().length > 0 || images.length > 0) {
                  Alert.alert(
                    "Discard post?",
                    "Your draft will be lost.",
                    [
                      { text: "Keep editing", style: "cancel" },
                      { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
                    ]
                  );
                } else {
                  navigation.goBack();
                }
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isSOS ? "SOS Post" : "Create Post"}
              </Text>
              <Text style={styles.headerSub}>
                {isSOS
                  ? "Marked urgent — partners will be notified"
                  : "Share with your vendor + agent network"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={submit}
              disabled={!canSubmit}
              style={[styles.postBtn, !canSubmit && { opacity: 0.55 }]}
              activeOpacity={0.85}
            >
              {posting ? (
                <ActivityIndicator size="small" color={isSOS ? C.red : C.emerald700} />
              ) : (
                <Text style={[styles.postBtnText, isSOS && { color: C.red }]}>
                  {isSOS ? "Post SOS" : "Post"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== Author preview row ===== */}
          <View style={styles.authorRow}>
            {agent?.logo ? (
              <RemoteImage source={{ uri: agent.logo }} style={styles.authorAvatar} />
            ) : (
              <LinearGradient
                colors={[C.blue, "#1D4ED8"]}
                style={styles.authorAvatar}
              >
                <Text style={styles.authorAvatarText}>
                  {initials(agent?.agencyName || agent?.ownerName || "Y")}
                </Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.authorName} numberOfLines={1}>
                {agent?.agencyName || agent?.ownerName || "You"}
              </Text>
              <View style={styles.authorMetaRow}>
                <View style={styles.authorTypePill}>
                  <Ionicons name="airplane" size={9} color={C.blue} />
                  <Text style={styles.authorTypePillText}>Agent</Text>
                </View>
                <Text style={styles.authorMeta}>·</Text>
                <Ionicons name="globe" size={10} color={C.subText} />
                <Text style={styles.authorMeta}>Public to network</Text>
              </View>
            </View>
          </View>

          {/* ===== Textarea ===== */}
          <View style={[styles.contentCard, isSOS && { borderColor: C.red, backgroundColor: "#FEF7F7" }]}>
            <TextInput
              style={styles.contentInput}
              placeholder={
                isSOS
                  ? "What do you need urgently? Be specific — location, dates, requirement."
                  : "Share an update, an offer, an SOS, a question…"
              }
              placeholderTextColor="#A3B3C2"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={MAX_CHARS}
              autoFocus
              textAlignVertical="top"
            />
            {/* Char counter (floats bottom-right) */}
            <View
              style={[
                styles.counter,
                overLimit && { backgroundColor: C.redLight, borderColor: "#FCA5A5" },
                showWarn && !overLimit && { backgroundColor: C.amberLight, borderColor: "#FDE68A" },
              ]}
            >
              <Text
                style={[
                  styles.counterText,
                  overLimit && { color: C.red },
                  showWarn && !overLimit && { color: "#A16207" },
                ]}
              >
                {charsLeft}
              </Text>
            </View>
          </View>

          {/* ===== Category chips ===== */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: `${accent}1A` }]}>
                  <Ionicons name="pricetag" size={13} color={accent} />
                </View>
                <Text style={[styles.sectionLabel, { color: accent }]}>CATEGORY</Text>
                {selectedCategory && (
                  <TouchableOpacity onPress={() => setCategoryId(null)}>
                    <Text style={styles.clearLink}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionHint}>
                {isSOS
                  ? "🚨 SOS category will boost visibility & notify partners."
                  : "Helps partners find your post. Tap one or leave blank."}
              </Text>

              {/* Chip grid */}
              <View style={styles.chipsWrap}>
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  const sos = !!c.isSOS;
                  const chipColor = sos ? C.red : (active ? C.emerald600 : C.text);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        active && sos && { backgroundColor: C.redLight, borderColor: C.red },
                        active && !sos && { backgroundColor: C.emerald50, borderColor: C.emerald600 },
                      ]}
                      onPress={() => setCategoryId(active ? null : c.id)}
                      activeOpacity={0.85}
                    >
                      {sos && (
                        <Ionicons
                          name="alert-circle"
                          size={11}
                          color={active ? C.red : "#DC2626"}
                        />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          active && { fontWeight: "900", color: chipColor },
                          sos && !active && { color: C.red, fontWeight: "800" },
                        ]}
                      >
                        {c.name}
                      </Text>
                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={chipColor}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ===== Images ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${C.purple}1A` }]}>
                <Ionicons name="images" size={13} color={C.purple} />
              </View>
              <Text style={[styles.sectionLabel, { color: C.purple }]}>IMAGES</Text>
              <View style={styles.imgCountBadge}>
                <Text style={styles.imgCountText}>{images.length}/4</Text>
              </View>
            </View>
            <Text style={styles.sectionHint}>
              Photos make posts more engaging. Up to 4 images.
            </Text>
            <View style={{ marginTop: 8 }}>
              <ImagePickerField
                multi
                max={4}
                value={images}
                onChange={setImages}
                folder="social-posts"
              />
            </View>
          </View>

          {/* ===== Tips card ===== */}
          {!content.trim() && (
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={15} color={C.amber} />
                <Text style={styles.tipsTitle}>Tips for great posts</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>Be specific about what you need or offer</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>Add location and dates if relevant</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>Pick an SOS category for urgent help requests</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>Add photos — they double engagement</Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Sticky bottom post bar ===== */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomMeta}>
          {selectedCategory && (
            <View style={[
              styles.bottomCatPill,
              isSOS && { backgroundColor: C.redLight, borderColor: "#FCA5A5" },
            ]}>
              <Ionicons
                name={isSOS ? "alert-circle" : "pricetag"}
                size={10}
                color={isSOS ? C.red : C.emerald600}
              />
              <Text style={[styles.bottomCatText, isSOS && { color: C.red }]}>
                {selectedCategory.name}
              </Text>
            </View>
          )}
          {images.length > 0 && (
            <View style={styles.bottomCatPill}>
              <Ionicons name="images" size={10} color={C.purple} />
              <Text style={[styles.bottomCatText, { color: C.purple }]}>
                {images.length} {images.length === 1 ? "image" : "images"}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.publishBtnWrap, !canSubmit && { opacity: 0.5 }]}
          onPress={submit}
          disabled={!canSubmit}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isSOS ? ["#DC2626", "#B91C1C"] : [C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.publishBtnInner}
          >
            {posting ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons
                  name={isSOS ? "alert-circle" : "send"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.publishBtnText}>
                  {isSOS ? "Post SOS" : "Post"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },
  postBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, minWidth: 70, alignItems: "center" },
  postBtnText: { color: C.emerald700, fontWeight: "900", fontSize: 13, letterSpacing: 0.3 },

  scroll: { padding: 14, paddingTop: 12 },

  // Author preview
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  authorAvatarText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  authorName: { fontSize: 14, fontWeight: "800", color: C.ink },
  authorMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  authorTypePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: C.blueLight },
  authorTypePillText: { fontSize: 9.5, color: C.blue, fontWeight: "800" },
  authorMeta: { fontSize: 11, color: C.subText, fontWeight: "600" },

  // Content card
  contentCard: {
    position: "relative",
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    padding: 14, minHeight: 160,
  },
  contentInput: {
    fontSize: 16, color: C.ink, minHeight: 130,
    paddingVertical: 0, lineHeight: 22,
  },
  counter: {
    position: "absolute", bottom: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border,
  },
  counterText: { fontSize: 10.5, color: C.subText, fontWeight: "800" },

  // Section
  section: { marginTop: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sectionIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 11.5, fontWeight: "900", letterSpacing: 0.5, flex: 1 },
  sectionHint: { fontSize: 11, color: C.subText, fontWeight: "600", marginBottom: 10, marginLeft: 30 },
  clearLink: { fontSize: 11.5, color: C.red, fontWeight: "800" },
  imgCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.purpleLight ?? C.emerald50 },
  imgCountText: { fontSize: 10.5, fontWeight: "900", color: C.purple },

  // Category chips
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
  },
  chipText: { fontSize: 12, color: C.text, fontWeight: "700" },

  // Tips card
  tipsCard: {
    marginTop: 18, padding: 14, borderRadius: 14,
    backgroundColor: C.amberLight, borderWidth: 1, borderColor: "#FDE68A",
  },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tipsTitle: { fontSize: 13, fontWeight: "800", color: "#A16207" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 6 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber, marginTop: 6 },
  tipText: { flex: 1, fontSize: 12, color: C.text, fontWeight: "500", lineHeight: 17 },

  // Sticky bottom bar
  bottomBar: {
    paddingHorizontal: 14, paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  bottomMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8, minHeight: 22 },
  bottomCatPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
  },
  bottomCatText: { fontSize: 10.5, fontWeight: "800", color: C.emerald700 },

  publishBtnWrap: {
    borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});

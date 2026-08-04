// screens/travel-agent/social/CreatePostScreen.js
// REDESIGNED (v2) — premium "Deep Emerald + Champagne" compose-post screen.
// Animated header bubbles, warm-cream surfaces, self-contained cards.
// POST /api/social/posts  body: { content, categoryId?, images? }
//
// Author preview + textarea + category chips + image picker + tips.
// Categories with `isSOS: true` flip the entire UI to red.
// NOTE: UI-only redesign — all state, effects, submit logic and API calls
// are unchanged from the previous version.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Animated, Easing,
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
import { DISPLAY } from "../_shared/typography";
import { SC as C, C as T, G, TONES } from "../_shared/theme";

// ── Premium "Deep Emerald + Champagne" palette (matches the Fleet screen) ──
// Values now come from the shared Elevate theme; key names unchanged so no JSX
// edits were needed. Only the emerald family, inks and header gradient drifted.
// NOTE: `purple` is used with a hex-alpha suffix (`${C.purple}16`), so it must
// stay 6-digit hex — T.plumLight is.
const GOLD = "#E4C066";                 // champagne accent
const FILL = "#FBF8F1";                 // warm cream input fill
const HEADER_GRAD = G.hero;
const SOS_GRAD = ["#B3261E", "#7A0F12"];

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

export default function CreatePostScreen({ navigation, route }) {
  const preSelectSOS = !!route?.params?.isSOS;
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
        // Pre-select first SOS category if launched via SOS shortcut
        if (preSelectSOS) {
          const first = list.find((c) => c.isSOS);
          if (first) setCategoryId(first.id);
        }
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
  }, [preSelectSOS]);

  // Gentle looping float for the header's decorative bubbles (presentational).
  const blobA = useRef(new Animated.Value(0)).current;
  const blobB = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = (val, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    const a = loop(blobA, 4200);
    const b = loop(blobB, 5600);
    a.start();
    b.start();
    return () => { a.stop(); b.stop(); };
  }, [blobA, blobB]);

  const canSubmit = content.trim().length >= 2 && !!categoryId && !posting;
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
  const heroColors = isSOS ? SOS_GRAD : HEADER_GRAD;
  const accent = isSOS ? C.red : C.emerald600;
  const eyebrowColor = isSOS ? "#FFD9D9" : GOLD;

  const requestClose = () => {
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
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={heroColors[0]} />

      {/* ===== Gradient header with animated bubbles ===== */}
      <LinearGradient
        colors={heroColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.headerBlobA, {
            transform: [
              { translateY: blobA.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
              { translateX: blobA.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              { scale: blobA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
            ],
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.headerBlobB, {
            transform: [
              { translateY: blobB.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
              { translateX: blobB.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
              { scale: blobB.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
            ],
          }]}
        />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 11 }}>
          {/* One row: close · text column · Post button. The text column is a
              plain flex child, so the eyebrow, title and subtitle share its
              left edge automatically — the old version faked that with
              marginLeft:52 and pulled the title up with marginTop:-9. */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={requestClose} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={21} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleBlock}>
              <Text style={[styles.headerEyebrow, { color: eyebrowColor }]}>
                {isSOS ? "SOS ALERT" : "COMPOSE"}
              </Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {isSOS ? "SOS Post" : "Create Post"}
              </Text>
              <Text style={styles.headerSub} numberOfLines={2}>
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
          {/* ===== Author preview card ===== */}
          <View style={styles.authorCard}>
            {agent?.logo ? (
              <RemoteImage source={{ uri: agent.logo }} style={styles.authorAvatar} />
            ) : (
              <LinearGradient
                colors={[C.emerald500, C.emerald700]}
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
          <View style={[styles.contentCard, isSOS && { borderColor: C.red, backgroundColor: "#FEF6F5" }]}>
            <TextInput
              style={styles.contentInput}
              placeholder={
                isSOS
                  ? "What do you need urgently? Be specific — location, dates, requirement."
                  : "Share an update, an offer, an SOS, a question…"
              }
              placeholderTextColor="#B4AE9F"
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
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: `${accent}16` }]}>
                  <Ionicons name="pricetag" size={16} color={accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardLabel}>Category</Text>
                  <Text style={styles.cardHint} numberOfLines={1}>
                    {isSOS ? "Boosts visibility & notifies partners" : "Helps partners find your post"}
                  </Text>
                </View>
                {selectedCategory && (
                  <TouchableOpacity onPress={() => setCategoryId(null)} style={styles.clearBtn}>
                    <Text style={styles.clearLink}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

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
                        <Ionicons name="alert-circle" size={12} color={C.red} />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          active && { fontWeight: "bold", color: chipColor },
                          sos && !active && { color: C.red, fontWeight: "bold" },
                        ]}
                      >
                        {c.name}
                      </Text>
                      {/* No checkmark added on select — appending an icon made
                          the chip wider, so tapping one reflowed the whole
                          wrapped grid. The fill, border and bold text already
                          say it's selected. */}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ===== Images ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: `${C.purple}16` }]}>
                <Ionicons name="images" size={16} color={C.purple} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardLabel}>Images</Text>
                <Text style={styles.cardHint} numberOfLines={1}>
                  Photos make posts more engaging
                </Text>
              </View>
              {/* Turns emerald once all 4 slots are used, so "full" is obvious
                  without reading the numbers. */}
              <View style={[styles.imgCountBadge, images.length >= 4 && { backgroundColor: C.emerald50 }]}>
                <Text style={[styles.imgCountText, images.length >= 4 && { color: C.emerald700 }]}>
                  {images.length}/4
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 4 }}>
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
                <View style={styles.tipsIcon}>
                  <Ionicons name="bulb" size={15} color="#B45309" />
                </View>
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
            <View style={[styles.bottomCatPill, { backgroundColor: C.purpleLight, borderColor: "#DDD6FE" }]}>
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
            colors={isSOS ? SOS_GRAD : [C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.publishBtnInner}
          >
            {posting ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons
                  name={isSOS ? "alert-circle" : "send"}
                  size={17}
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
  headerGrad: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: "hidden" },
  headerBlobA: {
    position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerBlobB: {
    position: "absolute", top: 30, left: -60, width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(228,192,102,0.06)",
  },
  // Three columns; gap does the spacing, no magic margins.
  headerRow: { flexDirection: "row", alignItems: "flex-start", paddingTop: 12, gap: 12 },
  headerCircleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerEyebrow: {
    fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold",
    letterSpacing: 1.4, textTransform: "uppercase",
    lineHeight: 12, includeFontPadding: false,
  },
  // marginLeft = close btn width (40) + gap (12) → title lines up under eyebrow
  headerTitleBlock: { flex: 1, minWidth: 0, paddingTop: 1 },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: 20, fontWeight: "bold", color: "#fff",
    letterSpacing: 0.2, lineHeight: 24, marginTop: 3, includeFontPadding: false,
  },
  headerSub: {
    fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.72)",
    fontWeight: "600", lineHeight: 15, marginTop: 3, includeFontPadding: false,
  },
  // alignSelf centres it against the three-line text column instead of the
  // marginTop:8 nudge it used to need.
  postBtn: {
    backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, minWidth: 58, alignItems: "center", alignSelf: "center",
  },
  postBtnText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 12, letterSpacing: 0.3 },

  scroll: { padding: 16, paddingTop: 14 },

  // Author preview card
  authorCard: {
    flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 12,
    ...Platform.select({
      ios: { shadowColor: "#0A2A21", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 1 },
    }),
  },
  authorAvatar: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  authorAvatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14 },
  authorName: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: C.ink },
  authorMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  authorTypePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: C.blueLight },
  authorTypePillText: { fontFamily: DISPLAY, fontSize: 9.5, color: C.blue, fontWeight: "bold" },
  authorMeta: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600" },

  // Content card
  contentCard: {
    position: "relative",
    marginTop: 14,
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border,
    padding: 16, minHeight: 172,
    ...Platform.select({
      ios: { shadowColor: "#0A2A21", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 1 },
    }),
  },
  contentInput: {
    fontFamily: DISPLAY,
    fontSize: 16, color: C.ink, minHeight: 138,
    paddingVertical: 0, lineHeight: 23,
  },
  counter: {
    position: "absolute", bottom: 10, right: 10,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999,
    backgroundColor: FILL, borderWidth: 1, borderColor: C.border,
  },
  counterText: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "bold" },

  // Section card
  card: {
    marginTop: 14,
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#0A2A21", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 1 },
    }),
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 13 },
  cardIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: C.ink, letterSpacing: 0.2, includeFontPadding: false },
  cardHint: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2, includeFontPadding: false },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.redLight },
  clearLink: { fontFamily: DISPLAY, fontSize: 11.5, color: C.red, fontWeight: "bold" },
  imgCountBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: C.purpleLight },
  imgCountText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.purple, includeFontPadding: false, fontVariant: ["tabular-nums"] },

  // Category chips — rounded-rect tags
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, rowGap: 8 },
  // Pill shape matches the chip language used across the social module. The
  // border is always 1.5 so selecting one never shifts the grid.
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: FILL, borderWidth: 1.5, borderColor: "transparent",
  },
  chipText: { fontFamily: DISPLAY, fontSize: 12.5, color: C.text, fontWeight: "bold", letterSpacing: 0.2, includeFontPadding: false },

  // Tips card
  tipsCard: {
    marginTop: 14, padding: 16, borderRadius: 18,
    backgroundColor: "#FDF6E3", borderWidth: 1, borderColor: "#F1E4BC",
  },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  tipsIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#FBEFC8", alignItems: "center", justifyContent: "center" },
  tipsTitle: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: "#8A5A0B" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 7 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginTop: 6 },
  tipText: { fontFamily: DISPLAY, flex: 1, fontSize: 12.5, color: C.text, fontWeight: "500", lineHeight: 18 },

  // Sticky bottom bar
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#0A2A21", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 16 },
    }),
  },
  bottomMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10, minHeight: 22 },
  bottomCatPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#BFE3D5",
  },
  bottomCatText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.emerald700 },

  publishBtnWrap: {
    borderRadius: 16, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  publishBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15, letterSpacing: 0.3 },
});

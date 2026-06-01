// screens/travel-agent/social/SocialProfileScreen.js
// REDESIGNED — emerald-themed social profile view.
//
// GET /api/social/profile/{type}/{id} → { profile, posts }
// Route params:
//   - { type, id }   → view someone else's profile (or own by id)
//   - { me: true }   → view own profile (resolves type+id from cached TA)
//
// "Message" button (when !isMe) opens-or-creates a social conversation.
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, FlatList, Alert, StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  getSocialProfile,
  getOrCreateSocialConversation,
  getCurrentTravelAgent,
} from "../../api/travelAgentClient";
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
  purpleLight: "#EDE9FE",
};

const TYPE_META = {
  vendor: { color: C.purple, icon: "storefront", label: "Vendor" },
  agent:  { color: C.blue,   icon: "airplane",   label: "Travel Agent" },
};

const SCREEN_W = Dimensions.get("window").width;

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function fmtRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
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

export default function SocialProfileScreen({ navigation, route }) {
  const wantMe = route?.params?.me === true;
  const [type, setType] = useState(route?.params?.type || null);
  const [id, setId] = useState(route?.params?.id || null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);

  // Resolve me → (agent, agentId)
  useEffect(() => {
    if (!wantMe) return;
    (async () => {
      try {
        const ta = await getCurrentTravelAgent();
        if (ta?.id) { setType("agent"); setId(ta.id); }
      } catch {}
    })();
  }, [wantMe]);

  const load = useCallback(async () => {
    if (!type || !id) return;
    setError(null);
    try {
      const data = await getSocialProfile(type, id);
      setProfile(data.profile || null);
      setPosts(data.posts || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, id]);

  useEffect(() => { if (type && id) load(); }, [type, id, load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const onMessage = async () => {
    if (!type || !id || openingChat) return;
    try {
      setOpeningChat(true);
      const { conversationId } = await getOrCreateSocialConversation(type, id);
      if (!conversationId) throw new Error("No conversation id returned");
      navigation.navigate("TASocialChat", {
        id: conversationId,
        other: {
          type, id,
          displayName: profile?.displayName,
          name: profile?.ownerName,
          logo: profile?.logo,
          city: profile?.city,
        },
      });
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Could not open chat");
    } finally {
      setOpeningChat(false);
    }
  };

  // ===== Loading state =====
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />
        <LinearGradient
          colors={["#022C22", "#064E3B", "#047857"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerGradSimple}
        >
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
            <View style={styles.headerRowSimple}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitleSimple}>Profile</Text>
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

  // ===== Not found state =====
  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />
        <LinearGradient
          colors={["#022C22", "#064E3B", "#047857"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerGradSimple}
        >
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
            <View style={styles.headerRowSimple}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitleSimple}>Profile</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.notFoundWrap}>
          <View style={styles.notFoundIconWrap}>
            <Ionicons name="alert-circle" size={42} color={C.red} />
          </View>
          <Text style={styles.notFoundTitle}>Profile not found</Text>
          {!!error && <Text style={styles.notFoundBody}>{error}</Text>}
          <TouchableOpacity
            style={styles.backCta}
            onPress={() => navigation.goBack()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.backCtaInner}
            >
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.backCtaText}>Go back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const typeMeta = TYPE_META[profile.type] || TYPE_META.agent;
  const isMe = !!profile.isMe;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        ListHeaderComponent={
          <ProfileHeader
            profile={profile}
            typeMeta={typeMeta}
            isMe={isMe}
            openingChat={openingChat}
            onBack={() => navigation.goBack()}
            onMessage={onMessage}
            onEdit={() => navigation.navigate("TAProfile")}
          />
        }
        renderItem={({ item, index }) => (
          <PostThumb
            post={item}
            index={index}
            onPress={() => navigation.navigate("TASocialFeed")}
          />
        )}
        contentContainerStyle={
          posts.length === 0
            ? { flexGrow: 1, paddingBottom: 24 }
            : { paddingBottom: 24 }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.emerald600}
            colors={[C.emerald600]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <View style={styles.emptyPostsIcon}>
              <Ionicons name="images-outline" size={32} color={C.emerald600} />
            </View>
            <Text style={styles.emptyPostsTitle}>No posts yet</Text>
            <Text style={styles.emptyPostsSub}>
              {isMe
                ? "Tap the create button in the feed to share your first post."
                : `${profile.displayName || "This user"} hasn't shared anything yet.`}
            </Text>
            {isMe && (
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate("TACreatePost")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[C.emerald600, C.emerald700]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaInner}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.emptyCtaText}>Create post</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

/* ───────── Profile header ───────── */

function ProfileHeader({ profile, typeMeta, isMe, openingChat, onBack, onMessage, onEdit }) {
  const memberSince = profile.createdAt ? fmtRelative(profile.createdAt) : null;

  return (
    <View>
      {/* ===== Gradient hero ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {profile.displayName || profile.ownerName || "Profile"}
            </Text>
            {isMe ? (
              <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
                <Ionicons name="create-outline" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Avatar + bio block */}
          <View style={styles.heroBody}>
            {/* Avatar with type-color ring */}
            <View style={[styles.avatarRing, { borderColor: shade(typeMeta.color, 30) }]}>
              {profile.logo ? (
                <RemoteImage source={{ uri: profile.logo }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[typeMeta.color, shade(typeMeta.color, -15)]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {initials(profile.displayName || profile.ownerName)}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Name + owner subtitle */}
            <Text style={styles.displayName} numberOfLines={2}>
              {profile.displayName || profile.ownerName || "Profile"}
            </Text>
            {!!profile.ownerName && profile.ownerName !== profile.displayName && (
              <Text style={styles.ownerName}>{profile.ownerName}</Text>
            )}

            {/* Type + location pills */}
            <View style={styles.metaRow}>
              <View style={styles.typePill}>
                <Ionicons name={typeMeta.icon} size={11} color="#fff" />
                <Text style={styles.typePillText}>{typeMeta.label}</Text>
              </View>
              {!!profile.city && (
                <View style={styles.locationPill}>
                  <Ionicons name="location" size={11} color="#fff" />
                  <Text style={styles.locationText}>
                    {profile.city}{profile.state ? `, ${profile.state}` : ""}
                  </Text>
                </View>
              )}
              {isMe && (
                <View style={styles.youPill}>
                  <Ionicons name="person" size={10} color={C.emerald700} />
                  <Text style={styles.youText}>You</Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating stats card ===== */}
      <View style={styles.statsCard}>
        <StatCell value={profile.postsCount || 0} label="Posts" icon="images" color={C.emerald600} />
        <View style={styles.statDivider} />
        <StatCell
          value={memberSince || "—"}
          label="Member since"
          icon="calendar"
          color={C.blue}
          isText
        />
        <View style={styles.statDivider} />
        <StatCell
          value={typeMeta.label.split(" ")[0]}
          label="Type"
          icon={typeMeta.icon}
          color={typeMeta.color}
          isText
        />
      </View>

      {/* ===== About / description ===== */}
      {!!profile.description && (
        <View style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <View style={styles.aboutIconWrap}>
              <Ionicons name="information-circle" size={14} color={C.emerald600} />
            </View>
            <Text style={styles.aboutLabel}>ABOUT</Text>
          </View>
          <Text style={styles.description}>{profile.description}</Text>
        </View>
      )}

      {/* ===== Primary action (Message or Edit) ===== */}
      <View style={styles.actionsWrap}>
        {isMe ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            activeOpacity={0.85}
          >
            <Ionicons name="create" size={16} color={C.emerald700} />
            <Text style={styles.editBtnText}>Edit profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.messageBtnWrap, openingChat && { opacity: 0.7 }]}
            onPress={onMessage}
            disabled={openingChat}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.messageBtnInner}
            >
              {openingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#fff" />
                  <Text style={styles.messageBtnText}>Message</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ===== Posts grid header ===== */}
      <View style={styles.gridHeader}>
        <View style={styles.gridHeaderIcon}>
          <Ionicons name="grid" size={13} color={C.emerald600} />
        </View>
        <Text style={styles.gridTitle}>POSTS</Text>
        {(profile.postsCount > 0) && (
          <View style={styles.gridCountBadge}>
            <Text style={styles.gridCountText}>{profile.postsCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatCell({ value, label, icon, color, isText }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[styles.statValue, { color, fontSize: isText ? 12 : 18 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

// Pleasant text-placeholder gradients cycled for posts without images.
const PLACEHOLDER_GRADIENTS = [
  ["#A7F3D0", "#6EE7B7"], // emerald
  ["#DBEAFE", "#93C5FD"], // blue
  ["#FCE7F3", "#F9A8D4"], // pink
  ["#FEF3C7", "#FCD34D"], // amber
  ["#EDE9FE", "#C4B5FD"], // purple
  ["#CFFAFE", "#67E8F9"], // cyan
];

function PostThumb({ post, index, onPress }) {
  const img = Array.isArray(post.images) ? post.images[0] : post.image;
  const grad = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
  const isSOS = !!post.category?.isSOS;
  const isMulti = Array.isArray(post.images) && post.images.length > 1;

  return (
    <TouchableOpacity style={styles.thumb} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.thumbImageWrap}>
        {img ? (
          <RemoteImage source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.thumbImage, styles.thumbPlaceholder]}
          >
            <Text style={styles.thumbText} numberOfLines={4}>
              {post.content || "—"}
            </Text>
          </LinearGradient>
        )}

        {/* SOS overlay */}
        {isSOS && (
          <View style={styles.sosOverlay}>
            <Ionicons name="alert-circle" size={11} color="#fff" />
            <Text style={styles.sosOverlayText}>SOS</Text>
          </View>
        )}

        {/* Multi-image badge */}
        {isMulti && !isSOS && (
          <View style={styles.multiOverlay}>
            <Ionicons name="images" size={10} color="#fff" />
          </View>
        )}

        {/* Engagement strip on hover-equivalent (always shown on mobile) */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <View style={styles.engageOverlay}>
            {post.likesCount > 0 && (
              <View style={styles.engageItem}>
                <Ionicons name="heart" size={10} color="#fff" />
                <Text style={styles.engageText}>{post.likesCount}</Text>
              </View>
            )}
            {post.commentsCount > 0 && (
              <View style={styles.engageItem}>
                <Ionicons name="chatbubble" size={10} color="#fff" />
                <Text style={styles.engageText}>{post.commentsCount}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Simple header (loading / not found)
  headerGradSimple: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRowSimple: { flexDirection: "row", alignItems: "center", paddingTop: 4, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitleSimple: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  notFoundWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.redLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  notFoundTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  notFoundBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19 },
  backCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  backCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  backCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Hero
  heroGrad: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 50 },
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  topBarTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: "#fff", textAlign: "center" },

  heroBody: { alignItems: "center", paddingTop: 12, paddingHorizontal: 8 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 30,
    padding: 3, borderWidth: 3,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  avatar: { width: 90, height: 90, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 32, letterSpacing: 0.5 },

  displayName: { fontSize: 22, fontWeight: "900", color: "#fff", textAlign: "center", marginTop: 14, letterSpacing: -0.3 },
  ownerName: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "600" },

  metaRow: { flexDirection: "row", gap: 6, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)" },
  typePillText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)" },
  locationText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  youPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: "#fff" },
  youText: { fontSize: 11, color: C.emerald700, fontWeight: "900", letterSpacing: 0.3 },

  // Floating stats card
  statsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -28,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7, justifyContent: "center", minWidth: 0, paddingHorizontal: 4 },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontWeight: "900" },
  statLabel: { fontSize: 9.5, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.2 },
  statDivider: { width: 1, height: 32, backgroundColor: C.border },

  // About card
  aboutCard: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  aboutHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  aboutIconWrap: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  aboutLabel: { fontSize: 11, color: C.emerald700, fontWeight: "900", letterSpacing: 0.6 },
  description: { fontSize: 13.5, color: C.text, lineHeight: 20, fontWeight: "500" },

  // Primary action button
  actionsWrap: { paddingHorizontal: 16, marginTop: 14 },
  editBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.emerald50, borderWidth: 1.5, borderColor: C.emerald600,
  },
  editBtnText: { color: C.emerald700, fontWeight: "800", fontSize: 14 },
  messageBtnWrap: {
    borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  messageBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  messageBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Grid header
  gridHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 22, marginBottom: 10, paddingHorizontal: 16,
  },
  gridHeaderIcon: { width: 26, height: 26, borderRadius: 9, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  gridTitle: { fontSize: 12, fontWeight: "900", color: C.emerald700, letterSpacing: 0.5, flex: 1 },
  gridCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.emerald50 },
  gridCountText: { fontSize: 11, color: C.emerald700, fontWeight: "900" },

  // Post thumbs (3-col grid)
  thumb: { flex: 1 / 3, aspectRatio: 1, padding: 2 },
  thumbImageWrap: { flex: 1, position: "relative", borderRadius: 8, overflow: "hidden" },
  thumbImage: { flex: 1, backgroundColor: "#F1F5F9" },
  thumbPlaceholder: { padding: 8, justifyContent: "center", alignItems: "center" },
  thumbText: { fontSize: 10.5, color: C.text, textAlign: "center", lineHeight: 14, fontWeight: "600" },

  sosOverlay: {
    position: "absolute", top: 5, left: 5,
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: "rgba(239,68,68,0.95)",
  },
  sosOverlayText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },

  multiOverlay: {
    position: "absolute", top: 5, right: 5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },

  engageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 8,
    paddingVertical: 4, paddingHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  engageItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  engageText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  // Empty posts
  emptyPosts: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyPostsIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyPostsTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyPostsSub: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 18 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

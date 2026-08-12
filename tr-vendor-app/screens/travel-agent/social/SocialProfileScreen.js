// screens/travel-agent/social/SocialProfileScreen.js
// REDESIGNED — emerald-themed social profile view.
//
// GET /api/social/profile/{type}/{id} → { profile, posts }
// Route params:
//   - { type, id }   → view someone else's profile (or own by id)
//   - { me: true }   → view own profile (resolves type+id from cached TA)
//
// "Message" button (when !isMe) opens-or-creates a social conversation.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, FlatList, Alert, StatusBar,
  Dimensions, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  getSocialProfile,
  getOrCreateSocialConversation,
  getCurrentTravelAgent,
  toggleSocialPostLike,
  toggleSocialPostSave,
  deleteSocialPost,
  listTravelAgentTours,
} from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C, G, TONES } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";
// Reusing the feed's own post card + its menu/comments/share sheets — own-
// profile posts get the exact same like/save/delete affordances the feed
// has, instead of a plain read-only thumbnail grid with nowhere to tap into.
import { PostCard, PostMenuSheet, CommentsSheet, ShareInChatModal } from "./SocialFeedScreen";

// Warm "Elevate" palette — same keys, repainted to match the feed and the rest
// of the Travel Agent module. The old set was cool slate (#F6F8FB ground).
// Values now come from the shared Elevate theme; key names unchanged so no JSX
// edits were needed. Only the emerald family, inks and header gradient drifted.
const FILL = "#FBF8F1";
const HEADER_GRAD = G.hero;

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
// Slowly drifting/pulsing decorative bubble for the header — same gentle motion
// as the Fleet, Tours and Agency Profile headers. useNativeDriver keeps it off
// the JS thread, and the loop is stopped on unmount.
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

  // Post-card actions on the own-profile full-card list (viewer's own agent
  // id — distinct from `id` above, which is whichever profile is being
  // viewed and may belong to someone else).
  const [viewerAgentId, setViewerAgentId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [menuPost, setMenuPost] = useState(null);
  const [commentsPost, setCommentsPost] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const ta = await getCurrentTravelAgent();
        if (ta?.id) setViewerAgentId(ta.id);
      } catch {}
    })();
  }, []);

  // Own-profile Posts/Tours tabs — mirrors web's minimal Tours tab (a stat +
  // CTA into the real Tours section, not a duplicate listing here).
  const [activeTab, setActiveTab] = useState("posts");
  const [toursCount, setToursCount] = useState(0);
  useEffect(() => {
    if (!viewerAgentId) return;
    (async () => {
      try {
        const data = await listTravelAgentTours({});
        setToursCount(Array.isArray(data?.tours) ? data.tours.length : 0);
      } catch {}
    })();
  }, [viewerAgentId]);

  const onToggleLike = async (post) => {
    const wasLiked = !!post.likedByMe;
    setPosts((prev) => prev.map((p) =>
      p.id === post.id
        ? { ...p, likedByMe: !wasLiked, likesCount: (p.likesCount || 0) + (wasLiked ? -1 : 1) }
        : p
    ));
    try { await toggleSocialPostLike(post.id); }
    catch {
      setPosts((prev) => prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: wasLiked, likesCount: (p.likesCount || 0) + (wasLiked ? 1 : -1) }
          : p
      ));
    }
  };

  const onToggleSave = async (post) => {
    const wasSaved = !!post.savedByMe;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, savedByMe: !wasSaved } : p)));
    try { await toggleSocialPostSave(post.id); }
    catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, savedByMe: wasSaved } : p)));
    }
  };

  const onDeletePost = (post) => {
    setMenuPost(null);
    Alert.alert(
      "Delete post?",
      "This will permanently remove the post and all its comments. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            const snapshot = posts;
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
            try { await deleteSocialPost(post.id); }
            catch (e) {
              setPosts(snapshot);
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Could not delete post");
            }
          },
        },
      ]
    );
  };

  const onCopyLink = (post) => {
    setMenuPost(null);
    const url = `https://transrentals.in/travel-agent/social/post/${post.id}`;
    Clipboard.setString(url);
    Alert.alert("Copied", "Post link copied to clipboard.");
  };

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
          colors={HEADER_GRAD}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerGradSimple}
        >
          {/* Same orbs as the loaded header — without them the bar sat flat
              while the screen loaded and then popped into motion. */}
          <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
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
          colors={HEADER_GRAD}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerGradSimple}
        >
          {/* Same orbs as the loaded header — without them the bar sat flat
              while the screen loaded and then popped into motion. */}
          <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
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
        // RN's FlatList can't change numColumns on a live instance — the key
        // forces a remount when switching between the own-profile full-card
        // list (1 col) and another agent's read-only thumbnail grid (3 col).
        key={isMe ? "cards" : "grid"}
        data={isMe && activeTab === "tours" ? [] : posts}
        keyExtractor={(p) => p.id}
        numColumns={isMe ? 1 : 3}
        ListHeaderComponent={
          <ProfileHeader
            profile={profile}
            typeMeta={typeMeta}
            isMe={isMe}
            openingChat={openingChat}
            onBack={() => navigation.goBack()}
            onMessage={onMessage}
            onEdit={() => navigation.navigate("TAProfile")}
            postsCount={posts.length}
            toursCount={toursCount}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onGoToTours={() => navigation.navigate("TATours")}
          />
        }
        renderItem={({ item, index }) =>
          isMe ? (
            <PostCard
              post={item}
              currentAgentId={viewerAgentId}
              onAuthorPress={() => {}}
              onLike={() => onToggleLike(item)}
              onSave={() => onToggleSave(item)}
              onShare={() => setSharePost(item)}
              onComments={() => setCommentsPost(item)}
              onMenu={() => setMenuPost(item)}
            />
          ) : (
            <PostThumb
              post={item}
              index={index}
              onPress={() => navigation.navigate("TASocialFeed")}
            />
          )
        }
        contentContainerStyle={
          posts.length === 0
            ? { flexGrow: 1, paddingBottom: 24 }
            : isMe
              ? { paddingHorizontal: 12, paddingBottom: 24 }
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
          isMe && activeTab === "tours" ? null : (
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
          )
        }
      />

      {isMe && (
        <>
          <ShareInChatModal post={sharePost} onClose={() => setSharePost(null)} />
          <PostMenuSheet
            post={menuPost}
            currentAgentId={viewerAgentId}
            onClose={() => setMenuPost(null)}
            onDelete={onDeletePost}
            onShare={(post) => setSharePost(post)}
            onShareImage={(post) => setSharePost(post)}
            onSave={onToggleSave}
            onCopyLink={onCopyLink}
          />
          <CommentsSheet
            post={commentsPost}
            currentAgentId={viewerAgentId}
            onClose={() => setCommentsPost(null)}
            onCountChange={(postId, delta) => {
              setPosts((prev) => prev.map((p) =>
                p.id === postId
                  ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) + delta) }
                  : p
              ));
            }}
          />
        </>
      )}
    </View>
  );
}

/* ───────── Profile header ───────── */

function ProfileHeader({
  profile, typeMeta, isMe, openingChat, onBack, onMessage, onEdit,
  postsCount = 0, toursCount = 0, activeTab = "posts", onTabChange, onGoToTours,
}) {
  const memberSince = profile.createdAt ? fmtRelative(profile.createdAt) : null;

  return (
    <View>
      {/* ===== Gradient hero ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroGrad}
      >
        {/* Opposite drift directions + a 900ms offset so the two bubbles never
            move in lockstep. */}
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 14 }}>
          {/* Top bar */}
          {/* Title sits left, right after the back button — same as the Agency
              Profile header, not centred between the two buttons. */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle} numberOfLines={1}>Profile</Text>
            {isMe ? (
              <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
                <Ionicons name="create-outline" size={21} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Horizontal hero body — avatar on the left, name + pills stacked on
              the right, all sharing one left edge. */}
          <View style={styles.heroBody}>
            <View style={styles.avatarRing}>
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

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.displayName} numberOfLines={1}>
                {profile.displayName || profile.ownerName || "Profile"}
              </Text>
              {!!profile.ownerName && profile.ownerName !== profile.displayName && (
                <Text style={styles.ownerName} numberOfLines={1}>{profile.ownerName}</Text>
              )}

              {/* Row 1 — type (+ "You" when it's your own profile) */}
              <View style={styles.metaRow}>
                <View style={styles.typePill}>
                  <Ionicons name={typeMeta.icon} size={10} color="#fff" />
                  <Text style={styles.typePillText}>{typeMeta.label}</Text>
                </View>
                {isMe && (
                  <View style={styles.youPill}>
                    <Ionicons name="person" size={10} color={C.emerald700} />
                    <Text style={styles.youText}>You</Text>
                  </View>
                )}
              </View>

              {/* Row 2 — location sits on its own line under the type pill.
                  alignSelf keeps the pill hugging its text instead of stretching
                  to the full width of the info column. */}
              {!!profile.city && (
                <View style={[styles.locationPill, styles.locationPillBelow]}>
                  <Ionicons name="location" size={10} color="#fff" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {profile.city}{profile.state ? `, ${profile.state}` : ""}
                  </Text>
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
        {/* "Joined" reads correctly with a relative value — the label was
            "Member since", so it rendered as "Member since · 2mo ago". */}
        <StatCell
          value={memberSince || "—"}
          label="Joined"
          icon="calendar"
          color={C.blue}
          isText
        />
        <View style={styles.statDivider} />
        {/* Full label — .split(" ")[0] was cutting "Travel Agent" down to a
            bare "Travel", which read as a truncation bug. It fits at 11.5px. */}
        <StatCell
          value={typeMeta.label}
          label="Type"
          icon={typeMeta.icon}
          color={typeMeta.color}
          isText
        />
        {isMe && (
          <>
            <View style={styles.statDivider} />
            <StatCell value={toursCount} label="Tours" icon="compass" color={C.amber} />
          </>
        )}
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

      {/* ===== Posts / Tours tabs (own profile only) ===== */}
      {isMe && (
        <View style={styles.tabsCard}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "posts" && styles.tabBtnActive]}
            onPress={() => onTabChange && onTabChange("posts")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, activeTab === "posts" && styles.tabBtnTextActive]}>
              Posts ({postsCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "tours" && styles.tabBtnActive]}
            onPress={() => onTabChange && onTabChange("tours")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, activeTab === "tours" && styles.tabBtnTextActive]}>
              Tours ({toursCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ===== Tours tab — minimal stat + CTA into the real Tours section,
          not a duplicate listing here (mirrors web's own-profile page). ===== */}
      {isMe && activeTab === "tours" ? (
        <View style={styles.toursCard}>
          <View style={styles.toursIconWrap}>
            <Ionicons name="compass" size={26} color={C.emerald600} />
          </View>
          <Text style={styles.toursTitle}>
            {toursCount > 0 ? `${toursCount} tour${toursCount > 1 ? "s" : ""} listed` : "No tours yet"}
          </Text>
          <Text style={styles.toursSub}>Manage your tour listings from the Tours section.</Text>
          <TouchableOpacity style={styles.toursCta} onPress={onGoToTours} activeOpacity={0.9}>
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.toursCtaInner}
            >
              <Ionicons name="compass" size={16} color="#fff" />
              <Text style={styles.toursCtaText}>Go to My Tours</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        /* ===== Posts grid header ===== */
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
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

// Stacked and centred. The previous version put the icon beside the text and
// centred the whole group, so cells with wider values ("Travel" vs "12" vs
// "today") pushed their icon to a different x — nothing lined up across the
// three columns. A fixed lineHeight on the value keeps the labels on one line
// even though the values render at two different sizes.
function StatCell({ value, label, icon, color, isText }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text
        style={[styles.statValue, { color, fontSize: isText ? 11.5 : 17 }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Text-placeholder gradients cycled for posts without images. Warm, low-chroma
// tints drawn from the module palette — the previous set was the old bright
// cool one (#6EE7B7 / #93C5FD / #67E8F9) and stood out against the ivory ground.
const PLACEHOLDER_GRADIENTS = [
  ["#E9F5F0", "#CBE3DA"], // emerald tint
  ["#F6EEDB", "#E8D8B4"], // gold / sand
  ["#E6EFF4", "#C9DCE6"], // ocean
  ["#EFE9FA", "#DBD0F0"], // plum
  ["#FBE9E7", "#F1D0CA"], // rose
  ["#F1ECE0", "#E1D6C0"], // parchment
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

        {/* Engagement counts — a soft scrim fading up from the bottom edge
            instead of a solid dark bar, which sat like a block across every
            thumbnail. Counts hug the bottom-left. */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.62)"]}
            style={styles.engageOverlay}
            pointerEvents="none"
          >
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
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Simple header (loading / not found)
  // Loading / not-found headers mirror the real hero's top bar exactly (same
  // radius, same 36px glass button, same gold eyebrow) so the header doesn't
  // visibly change shape the moment the profile finishes loading.
  // overflow, like headerGrad — the orbs sit outside the bar's box and would
  // otherwise spill over the content below it.
  headerGradSimple: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
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
  heroGrad: {
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    // gap to the stats card = paddingBottom + its negative marginTop.
    // 42 + (-16) = 26dp. Both were larger (52 / -26) for the same 26dp gap —
    // shrinking the pair keeps the gap but makes the gradient 10dp shorter.
    paddingBottom: 42, overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -46, right: -32, width: 175, height: 175,
    borderRadius: 88, backgroundColor: "rgba(228,192,102,0.10)",
  },
  orbB: {
    position: "absolute", bottom: 10, left: -40, width: 145, height: 145,
    borderRadius: 73, backgroundColor: "rgba(23,166,124,0.14)",
  },
  // Matches AgencyProfileScreen's header exactly: plain 40px icon buttons and a
  // left-aligned 18px title that takes the remaining width.
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  topBarTitle: {
    fontFamily: DISPLAY, flex: 1, fontSize: 18, fontWeight: "bold",
    color: "#fff", textAlign: "left", marginLeft: 4,
  },

  // Horizontal: avatar | info column.
  heroBody: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 6, paddingHorizontal: 4 },
  // Gold ring instead of a type-tinted one — the type is already stated by the
  // pill below, and gold ties the hero to the rest of the module.
  avatarRing: {
    width: 58, height: 58, borderRadius: 17,
    padding: 2, borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  avatar: { width: 50, height: 50, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 19, letterSpacing: 0.5 },

  // Left-aligned stack beside the avatar — name, owner, pills.
  displayName: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: "#fff" },
  ownerName: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2, fontWeight: "600" },

  metaRow: { flexDirection: "row", gap: 5, rowGap: 5, marginTop: 6, flexWrap: "wrap" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  typePillText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4 },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)", flexShrink: 1 },
  locationPillBelow: { alignSelf: "flex-start", marginTop: 5 },
  locationText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4, flexShrink: 1 },
  youPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "#fff" },
  youText: { fontFamily: DISPLAY, color: C.emerald700, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4 },

  // Floating stats card — stacked cells so icons/values/labels each share a line
  statsCard: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -16, zIndex: 2,
    borderRadius: 18, paddingVertical: 13, paddingHorizontal: 4,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  statCell: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 4 },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  statValue: {
    fontFamily: DISPLAY, fontWeight: "bold", lineHeight: 20,
    textAlign: "center", includeFontPadding: false,
  },
  statLabel: {
    fontFamily: DISPLAY, fontSize: 8.5, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.4, textTransform: "uppercase", lineHeight: 11,
    marginTop: 2, textAlign: "center", includeFontPadding: false,
  },
  statDivider: { width: 1, height: 46, alignSelf: "center", backgroundColor: C.border },

  // About card
  aboutCard: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  aboutHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  aboutIconWrap: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  aboutLabel: { fontFamily: DISPLAY, fontSize: 10, color: C.emerald700, fontWeight: "bold", letterSpacing: 0.8, includeFontPadding: false },
  description: { fontFamily: DISPLAY, fontSize: 13.5, color: C.text, lineHeight: 21, fontWeight: "500" },

  // Primary action button
  actionsWrap: { paddingHorizontal: 16, marginTop: 14 },
  editBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.emerald50, borderWidth: 1.5, borderColor: C.emerald600,
  },
  editBtnText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 14 },
  messageBtnWrap: {
    borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  messageBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  messageBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Posts / Tours tabs
  tabsCard: {
    flexDirection: "row", gap: 6,
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.card, borderRadius: 14, padding: 5,
    borderWidth: 1, borderColor: C.border,
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: C.emerald600 },
  tabBtnText: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.subText },
  tabBtnTextActive: { color: "#fff" },

  // Tours tab — minimal stat + CTA card
  toursCard: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    alignItems: "center", paddingVertical: 30, paddingHorizontal: 20,
  },
  toursIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  toursTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink },
  toursSub: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, marginTop: 6, textAlign: "center", lineHeight: 18 },
  toursCta: { marginTop: 16, borderRadius: 12, overflow: "hidden" },
  toursCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  toursCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },

  // Grid header
  gridHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 20, marginBottom: 8, paddingHorizontal: 16,
  },
  gridHeaderIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  gridTitle: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.emerald700, letterSpacing: 0.8, flex: 1, includeFontPadding: false },
  gridCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.emerald50 },
  gridCountText: { fontFamily: DISPLAY, fontSize: 10.5, color: C.emerald700, fontWeight: "bold", includeFontPadding: false },

  // Post thumbs (3-col grid) — 3px padding gives a 6px gutter between tiles and
  // a 3px margin at the screen edges, so the grid reads as tiles rather than a
  // seamless mosaic. Matches the rounded language of the cards above it.
  thumb: { flex: 1 / 3, aspectRatio: 1, padding: 3 },
  thumbImageWrap: {
    flex: 1, position: "relative", borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: C.border, backgroundColor: FILL,
  },
  thumbImage: { flex: 1, backgroundColor: FILL },
  thumbPlaceholder: { padding: 9, justifyContent: "center", alignItems: "center" },
  thumbText: {
    fontFamily: DISPLAY, fontSize: 10.5, color: C.ink, textAlign: "center",
    lineHeight: 14, fontWeight: "bold", includeFontPadding: false,
  },

  sosOverlay: {
    position: "absolute", top: 5, left: 5,
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: "rgba(192,69,59,0.95)",
  },
  sosOverlayText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9, fontWeight: "bold", letterSpacing: 0.4 },

  multiOverlay: {
    position: "absolute", top: 5, right: 5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },

  // Scrim, not a bar: fixed height fading in from transparent at the top.
  engageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 34,
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 7, paddingBottom: 6,
  },
  engageItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  engageText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold",
    includeFontPadding: false, fontVariant: ["tabular-nums"],
  },

  // Empty posts
  emptyPosts: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyPostsIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyPostsTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink, marginTop: 6 },
  emptyPostsSub: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 18 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },
});

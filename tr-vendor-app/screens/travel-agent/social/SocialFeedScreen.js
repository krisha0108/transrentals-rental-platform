// screens/travel-agent/social/SocialFeedScreen.js
// REDESIGNED — emerald-themed cross-type social feed.
// Vendors + agents share this network. Backend stores posts polymorphically
// and returns the actor inline.
//
// GET  /api/social/posts            → { posts, nextCursor }
// GET  /api/social/posts?type=sos|saved|my
// POST /api/social/posts/[id]/like  → { liked, likesCount }
// POST /api/social/posts/[id]/save  → { saved }
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Modal, Alert,
  StatusBar, Platform, TextInput, KeyboardAvoidingView, Linking,
  Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import { captureRef } from "react-native-view-shot";
import RNShare from "react-native-share";
import {
  listSocialPosts,
  listSocialCategories,
  toggleSocialPostLike,
  toggleSocialPostSave,
  listSocialConversations,
  sendSocialMessage,
  deleteSocialPost,
  getCurrentTravelAgent,
  listSocialPostComments,
  addSocialPostComment,
  deleteSocialPostComment,
} from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C, C as T, G, TONES } from "../_shared/theme";

// Warm "Elevate" palette — same keys as before, repainted to match the rest of
// the Travel Agent module (dashboard / fleet / tours). The old set was cool
// slate (#F6F8FB ground, #64748B greys), which is what made this screen read as
// a different, older product.
// Local key names are kept so no JSX changes are needed — only the VALUES now
const GOLD = "#E4C066";
const FILL = "#FBF8F1";
const HEADER_GRAD = G.hero;

const TYPE_META = {
  vendor: { icon: "storefront", color: C.purple, label: "Vendor" },
  agent:  { icon: "airplane",   color: C.blue,   label: "Agent" },
};

const FEED_TABS = [
  { key: "feed",  label: "All",   icon: "globe",     color: C.emerald600 },
  { key: "sos",   label: "SOS",   icon: "alert-circle", color: C.red },
  { key: "my",    label: "Mine",  icon: "person",    color: C.purple },
  { key: "saved", label: "Saved", icon: "bookmark",  color: C.amber },
];

function fmtRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  if (m < 10080) return `${Math.round(m / 1440)}d`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// Normalize post author across backend shapes:
//   - post.author = already-projected SocialActor
//   - post.vendor / post.agent  = relation include
function getAuthor(post) {
  let raw = null;
  if (post.author) raw = { ...post.author };
  else if (post.vendor) raw = { type: "vendor", ...post.vendor };
  else if (post.agent) raw = { type: "agent", ...post.agent };
  if (!raw) return null;
  raw.displayName =
    raw.displayName || raw.businessName || raw.agencyName || raw.name || raw.ownerName || "Partner";
  return raw;
}

export default function SocialFeedScreen({ navigation, route }) {
  const initialTab =
    route?.params?.initialTab && FEED_TABS.some((t) => t.key === route.params.initialTab)
      ? route.params.initialTab
      : "feed";
  const [tab, setTab] = useState(initialTab);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [menuPost, setMenuPost] = useState(null);    // post whose 3-dot menu is open
  const [commentsPost, setCommentsPost] = useState(null); // post whose comments sheet is open
  const [currentAgentId, setCurrentAgentId] = useState(null);
  // Category filter (feed tab only)
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  // #9 — feed curation (feed tab only)
  const [feedView, setFeedView] = useState("all"); // 'all' | 'general' (non-SOS only)
  const [showFlagged, setShowFlagged] = useState(false); // show short/low-quality SOS
  const [showOldSos, setShowOldSos] = useState(false); // show SOS older than 7 days
  const [feedSearch, setFeedSearch] = useState(""); // free-text search (content / author / category)
  useEffect(() => {
    (async () => {
      try {
        const d = await listSocialCategories();
        const list = Array.isArray(d) ? d : (d?.categories || []);
        setCategories(list.filter((c) => c?.isActive !== false));
      } catch {}
    })();
  }, []);
  // E6 — SOS stories (strip + full-screen viewer)
  const [sosStories, setSosStories] = useState([]);
  const [storyIndex, setStoryIndex] = useState(null); // open viewer at this index (null = closed)

  const loadSos = useCallback(async () => {
    try {
      const data = await listSocialPosts({ type: "sos" });
      setSosStories(data.posts || []);
    } catch {
      // non-fatal — strip just stays empty
    }
  }, []);
  useEffect(() => { loadSos(); }, [loadSos]);

  // Deduped authors for the story strip (one bubble per author, opens at first post).
  const sosAuthors = useMemo(() => {
    const seen = new Set();
    const out = [];
    sosStories.forEach((p, i) => {
      const a = getAuthor(p) || {};
      const key = a.id ? `${a.type}:${a.id}` : `x${i}`;
      if (!seen.has(key)) { seen.add(key); out.push({ author: a, firstIndex: i }); }
    });
    return out;
  }, [sosStories]);

  // E6 — WhatsApp image-card share (captures a hidden branded card → PNG → RNShare)
  const shareCardRef = useRef(null);
  const [shareCardPost, setShareCardPost] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const shareAsImage = useCallback((post) => {
    if (capturing || !post) return;
    setShareCardPost(post);
  }, [capturing]);

  useEffect(() => {
    if (!shareCardPost) return;
    let cancelled = false;
    (async () => {
      setCapturing(true);
      try {
        // Let the off-screen card mount + lay out before capturing.
        await new Promise((r) => setTimeout(r, 350));
        if (cancelled || !shareCardRef.current) return;
        const uri = await captureRef(shareCardRef, { format: "png", quality: 0.95, result: "tmpfile" });
        const a = getAuthor(shareCardPost) || {};
        const sos = !!shareCardPost.category?.isSOS;
        const caption =
          `${sos ? "*SOS* from " : ""}*${authorName(a)}*${sos ? "" : " on TransRentals Travel Network"}:\n\n` +
          `${shareCardPost.content}\n\n— via TransRentals`;
        await RNShare.open({
          url: uri.startsWith("file://") ? uri : "file://" + uri,
          type: "image/png",
          message: caption,
          failOnCancel: false,
        }).catch(() => {});
      } catch (e) {
        Alert.alert("Share failed", "Could not generate the image card.");
      } finally {
        if (!cancelled) { setCapturing(false); setShareCardPost(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [shareCardPost]);

  // Resolve the logged-in TA once so we can mark own posts (mirrors web's
  // `isOwner = author.type === 'agent' && author.id === currentAgentId`).
  useEffect(() => {
    (async () => {
      try {
        const ta = await getCurrentTravelAgent();
        if (ta?.id) setCurrentAgentId(ta.id);
      } catch {}
    })();
  }, []);

  const fetchPage = useCallback(
    async ({ cursor, append } = {}) => {
      try {
        if (!append) setError(null);
        const params = {};
        if (cursor) params.cursor = cursor;
        if (tab !== "feed") params.type = tab;
        if (tab === "feed" && categoryFilter) params.categoryId = categoryFilter;
        const data = await listSocialPosts(params);
        const list = data.posts || [];
        setPosts((prev) => (append ? [...prev, ...list] : list));
        setNextCursor(data.nextCursor || null);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Failed to load feed");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [tab, categoryFilter]
  );

  useEffect(() => { setLoading(true); fetchPage(); }, [fetchPage]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchPage());
    return unsub;
  }, [navigation, fetchPage]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchPage(), loadSos()]); };
  const onEndReached = () => {
    if (loadingMore || loading || !nextCursor) return;
    setLoadingMore(true);
    fetchPage({ cursor: nextCursor, append: true });
  };

  const onToggleLike = async (post) => {
    const wasLiked = !!post.likedByMe;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !wasLiked, likesCount: (p.likesCount || 0) + (wasLiked ? -1 : 1) }
          : p
      )
    );
    try { await toggleSocialPostLike(post.id); }
    catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: wasLiked, likesCount: (p.likesCount || 0) + (wasLiked ? 1 : -1) }
            : p
        )
      );
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

  const onShare = (post) => setSharePost(post);

  // Delete with confirmation + optimistic removal from list.
  const onDelete = (post) => {
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

  // Copy post link (web equivalent path).
  const onCopyLink = (post) => {
    setMenuPost(null);
    const url = `https://transrentals.in/travel-agent/social/post/${post.id}`;
    Clipboard.setString(url);
    Alert.alert("Copied", "Post link copied to clipboard.");
  };

  const openAuthor = (author) => {
    if (!author?.type || !author?.id) return;
    navigation.navigate("TASocialProfile", { type: author.type, id: author.id });
  };

  // #9 — feed curation: General-only, hide short/old SOS (feed tab only).
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const isSosPost = (p) => !!p.category?.isSOS;
  const isOldSos = (p) => isSosPost(p) && (Date.now() - new Date(p.createdAt).getTime()) > SEVEN_DAYS;
  // Free-text search across content, author name and category (all tabs).
  const sq = feedSearch.trim().toLowerCase();
  const matchesSearch = (p) => {
    if (!sq) return true;
    const a = getAuthor(p) || {};
    const hay = [p.content, authorName(a), a.city, p.category?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(sq);
  };
  const displayPosts = (tab === "feed"
    ? posts.filter((p) => {
        if (feedView === "general" && isSosPost(p)) return false;
        if (isSosPost(p) && !showFlagged && (p.content || "").trim().length < 10) return false;
        if (!showOldSos && isOldSos(p)) return false;
        return true;
      })
    : posts
  ).filter(matchesSearch);
  const hiddenOldSosCount = tab === "feed" && !showOldSos && feedView !== "general"
    ? posts.filter(isOldSos).length
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View pointerEvents="none" style={styles.orbA} />
        <View pointerEvents="none" style={styles.orbB} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={21} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>PARTNER NETWORK</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>Social</Text>
            </View>
            {/* Compact icon actions — the old labelled SOS + Messages buttons
                ate so much width that "Vendor + Agent network" wrapped to two
                lines on a 6" phone. */}
            <TouchableOpacity
              onPress={() => navigation.navigate("TACreatePost", { isSOS: true })}
              style={styles.sosBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Post an SOS request"
            >
              <Ionicons name="alert-circle" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("TASocialMessages")}
              style={styles.msgBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open messages"
            >
              <Ionicons name="paper-plane" size={16} color={C.emerald700} />
            </TouchableOpacity>
          </View>

          {/* Search lives inside the header now — that removes one of the three
              full-width bands that used to stack under it. */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.75)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts, people, category…"
              placeholderTextColor="rgba(255,255,255,0.62)"
              value={feedSearch}
              onChangeText={setFeedSearch}
              returnKeyType="search"
              selectionColor="#fff"
            />
            {!!feedSearch && (
              <TouchableOpacity
                onPress={() => setFeedSearch("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={styles.searchClear}
              >
                <Ionicons name="close" size={13} color={T.forestDark} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Main tabs — segmented pill control =====
          Labels only. The old version put an icon beside each label and centred
          the pair, so with "All" / "SOS" / "Mine" / "Saved" all being different
          widths the four icons sat at four different offsets and nothing lined
          up. Equal-width segments with a single centred label align exactly. */}
      <View style={styles.tabsBar}>
        {FEED_TABS.map((t) => {
          const active = tab === t.key;
          const hasSOS = t.key === "sos" && sosAuthors.length > 0;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tab,
                active && { backgroundColor: `${t.color}16`, borderColor: t.color },
              ]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[styles.tabText, active && { color: t.color }]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
              {hasSOS && <View style={styles.tabDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ===== Category + view filter chips (feed tab only) ===== */}
      {tab === "feed" && (
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRowContent}>
            {/* View filter: All posts vs General only */}
            <TouchableOpacity
              style={[styles.filterChip, feedView === "all" && styles.filterChipActive]}
              onPress={() => { setFeedView("all"); setCategoryFilter(null); }}
            >
              <Ionicons name="apps" size={12} color={feedView === "all" && !categoryFilter ? C.emerald700 : C.subText} />
              <Text style={[styles.filterChipText, feedView === "all" && !categoryFilter && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, feedView === "general" && styles.filterChipActive]}
              onPress={() => { setFeedView("general"); setCategoryFilter(null); }}
            >
              {/* Label only — the `feedView` value stays "general". It was also
                  labelled "General", which collided with a backend category
                  literally named "general" sitting a few chips to the right. */}
              <Ionicons name="newspaper" size={12} color={feedView === "general" ? C.emerald700 : C.subText} />
              <Text style={[styles.filterChipText, feedView === "general" && styles.filterChipTextActive]}>Non-SOS</Text>
            </TouchableOpacity>
            {/* Category chips — no separator here any more. It added its own
                4px margins on both sides, so the gap around it came to 23px
                against the 7px between every other chip, which read as uneven
                spacing. The chips' own icons already distinguish view filters
                (apps / newspaper) from categories (pricetag / alert). */}
            {categories.map((c) => {
              const active = categoryFilter === c.id;
              const chipColor = c.isSOS ? C.red : C.emerald700;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, active && { backgroundColor: `${chipColor}15`, borderColor: chipColor }]}
                  onPress={() => { setCategoryFilter(active ? null : c.id); setFeedView("all"); }}
                >
                  <Ionicons name={c.isSOS ? "alert-circle" : "pricetag"} size={12} color={active ? chipColor : C.subText} />
                  <Text style={[styles.filterChipText, active && { color: chipColor, fontWeight: "bold" }]} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
            {/* Old SOS toggle */}
            {hiddenOldSosCount > 0 && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setShowOldSos(v => !v)}>
                <Ionicons name="time" size={12} color={C.subText} />
                <Text style={styles.filterChipText}>{showOldSos ? "Hide old" : `+${hiddenOldSosCount} old`}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage()}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading feed…</Text>
        </View>
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentAgentId={currentAgentId}
              onAuthorPress={() => openAuthor(getAuthor(item))}
              onLike={() => onToggleLike(item)}
              onSave={() => onToggleSave(item)}
              onShare={() => onShare(item)}
              onComments={() => setCommentsPost(item)}
              onMenu={() => setMenuPost(item)}
            />
          )}
          contentContainerStyle={displayPosts.length === 0 ? styles.emptyWrap : styles.listContent}
          ListHeaderComponent={
            tab === "feed" && sosAuthors.length > 0 ? (
              <View style={styles.storyStrip}>
                <View style={styles.storyStripHeader}>
                  <Ionicons name="alert-circle" size={13} color={C.red} />
                  <Text style={styles.storyStripTitle}>SOS · Urgent</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 2 }}>
                  {sosAuthors.map((s, i) => {
                    const a = s.author || {};
                    const nm = authorName(a);
                    return (
                      <TouchableOpacity key={i} style={styles.storyItem} onPress={() => setStoryIndex(s.firstIndex)} activeOpacity={0.85}>
                        <View style={styles.storyRing}>
                          <View style={styles.storyRingInner}>
                            {a.logo ? (
                              <RemoteImage source={{ uri: a.logo }} style={styles.storyAvatar} />
                            ) : (
                              <View style={[styles.storyAvatar, styles.storyAvatarFallback]}>
                                <Text style={styles.storyInitials}>{initialsOf(nm)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.storyName} numberOfLines={1}>{nm}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoad}>
                <ActivityIndicator size="small" color={C.emerald600} />
                <Text style={styles.footerLoadText}>Loading more…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name={
                    tab === "saved" ? "bookmark-outline" :
                    tab === "my" ? "person-outline" :
                    tab === "sos" ? "alert-circle-outline" :
                    "newspaper-outline"
                  }
                  size={42}
                  color={C.emerald600}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {sq ? "No matching posts" :
                 tab === "saved" ? "Nothing saved yet" :
                 tab === "my" ? "You haven't posted yet" :
                 tab === "sos" ? "No SOS posts" :
                 "No posts yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {sq
                  ? `Nothing matches "${feedSearch.trim()}". Try a different search.`
                  : tab === "saved"
                  ? "Tap the bookmark on any post to save it for later."
                  : tab === "my"
                  ? "Share an update, ask for help, or post an SOS request."
                  : tab === "sos"
                  ? "Urgent help requests from partners will appear here."
                  : "Be the first to post in this network."}
              </Text>
              {(tab === "feed" || tab === "my") && (
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
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyCtaText}>Create post</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* ===== Floating create FAB =====
          The SOS FAB that used to sit above this one is gone — posting an SOS
          is still one tap away from the red button in the header, and two
          stacked FABs were covering the feed. */}
      <View style={styles.fabGroup}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("TACreatePost")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="create" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ShareInChatModal post={sharePost} onClose={() => setSharePost(null)} />

      <PostMenuSheet
        post={menuPost}
        currentAgentId={currentAgentId}
        onClose={() => setMenuPost(null)}
        onDelete={onDelete}
        onShare={onShare}
        onShareImage={shareAsImage}
        onSave={onToggleSave}
        onCopyLink={onCopyLink}
      />

      <CommentsSheet
        post={commentsPost}
        currentAgentId={currentAgentId}
        onClose={() => setCommentsPost(null)}
        onCountChange={(postId, delta) => {
          // Keep the feed card's comment count in sync as user adds/removes.
          setPosts((prev) => prev.map((p) =>
            p.id === postId
              ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) + delta) }
              : p
          ));
        }}
      />

      {/* E6 — SOS story viewer */}
      {storyIndex !== null && (
        <StoryViewer
          stories={sosStories}
          startIndex={storyIndex}
          onClose={() => setStoryIndex(null)}
          onOpenProfile={(author) => { setStoryIndex(null); openAuthor(author); }}
          onShareImage={(p) => shareAsImage(p)}
        />
      )}

      {/* E6 — hidden branded card captured for WhatsApp image share */}
      {!!shareCardPost && (() => {
        const a = getAuthor(shareCardPost) || {};
        const sos = !!shareCardPost.category?.isSOS;
        return (
          <View style={styles.captureHost} pointerEvents="none">
            <View ref={shareCardRef} collapsable={false} style={styles.shareCard}>
              <LinearGradient
                colors={sos ? ["#5C1F1A", "#8A2F27"] : [T.forestDark, T.emeraldDeep]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.shareCardHeader}
              >
                <View style={styles.shareCardAvatar}>
                  <Text style={styles.shareCardInitials}>{initialsOf(authorName(a))}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.shareCardName} numberOfLines={1}>{authorName(a)}</Text>
                  <Text style={styles.shareCardCat} numberOfLines={1}>
                    {sos ? "🚨 SOS · Urgent" : (shareCardPost.category?.name || "Travel Network")}
                  </Text>
                </View>
              </LinearGradient>
              <View style={styles.shareCardBody}>
                <Text style={styles.shareCardContent}>{shareCardPost.content}</Text>
              </View>
              <View style={styles.shareCardFooter}>
                <Text style={styles.shareCardBrand}>TransRentals Travel Network</Text>
                <Text style={styles.shareCardUrl}>transrentals.in</Text>
              </View>
            </View>
          </View>
        );
      })()}

      {capturing && (
        <View style={styles.captureOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.captureText}>Preparing image…</Text>
        </View>
      )}
    </View>
  );
}

/* ───────── SOS story helpers + viewer (E6) ───────── */

function authorName(a) {
  return a?.displayName || a?.businessName || a?.agencyName || a?.ownerName || a?.name || "Someone";
}
function initialsOf(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
function storyTimeAgo(iso) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

function StoryViewer({ stories, startIndex, onClose, onOpenProfile, onShareImage }) {
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const post = stories[idx];
  const author = post ? (getAuthor(post) || {}) : {};

  const goNext = useCallback(() => {
    setIdx((i) => {
      if (i < stories.length - 1) return i + 1;
      onClose();
      return i;
    });
  }, [stories.length, onClose]);
  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  // Auto-advance the current story (~5s), pausing on long-press.
  useEffect(() => {
    setProgress(0);
    if (paused) return;
    const DURATION = 5000, STEP = 60;
    const t = setInterval(() => {
      setProgress((p) => {
        const np = p + (STEP / DURATION) * 100;
        if (np >= 100) { clearInterval(t); goNext(); return 100; }
        return np;
      });
    }, STEP);
    return () => clearInterval(t);
  }, [idx, paused, goNext]);

  if (!post) return null;

  const shareWa = () => {
    if (onShareImage) { onShareImage(post); return; }
    // Fallback: plain-text WhatsApp share if image capture isn't wired.
    const t = `*SOS* from ${authorName(author)}:\n\n${post.content}\n\n— via TransRentals`;
    const enc = encodeURIComponent(t);
    Linking.openURL(`whatsapp://send?text=${enc}`).catch(() =>
      Linking.openURL(`https://wa.me/?text=${enc}`).catch(() => {})
    );
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={sv.overlay}>
        <View style={sv.card}>
          {/* Progress bars (one per story) */}
          <View style={sv.progressRow}>
            {stories.map((_, i) => (
              <View key={i} style={sv.progressTrack}>
                <View style={[sv.progressFill, { width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }]} />
              </View>
            ))}
          </View>

          {/* Author header */}
          <View style={sv.header}>
            <View style={sv.ring}>
              {author.logo ? (
                <RemoteImage source={{ uri: author.logo }} style={sv.avatar} />
              ) : (
                <View style={[sv.avatar, sv.avatarFallback]}><Text style={sv.avatarInitials}>{initialsOf(authorName(author))}</Text></View>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={sv.name} numberOfLines={1}>{authorName(author)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {!!author.city && <Text style={sv.metaText}>{author.city}</Text>}
                <Text style={sv.metaText}>{storyTimeAgo(post.createdAt)}</Text>
                {stories.length > 1 && <Text style={sv.metaText}>· {idx + 1}/{stories.length}</Text>}
              </View>
            </View>
            <View style={sv.sosTag}><Ionicons name="alert-circle" size={11} color="#E7B5AF" /><Text style={sv.sosTagText}>SOS</Text></View>
            <TouchableOpacity onPress={onClose} style={sv.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={sv.body}>
            <Text style={sv.content}>{post.content}</Text>
          </View>

          {/* Actions */}
          <View style={sv.actions}>
            <TouchableOpacity style={[sv.actBtn, { backgroundColor: "#22C55E" }]} onPress={shareWa} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={sv.actBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[sv.actBtn, sv.actBtnGhost]} onPress={() => onOpenProfile(author)} activeOpacity={0.85}>
              <Ionicons name="person" size={16} color="#fff" />
              <Text style={sv.actBtnText}>Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Tap zones (prev / next), long-press pauses */}
          <TouchableOpacity
            style={[sv.tapZone, { left: 0 }]} activeOpacity={1}
            onPress={goPrev}
            onLongPress={() => setPaused(true)} onPressOut={() => setPaused(false)} delayLongPress={150}
          />
          <TouchableOpacity
            style={[sv.tapZone, { right: 0 }]} activeOpacity={1}
            onPress={goNext}
            onLongPress={() => setPaused(true)} onPressOut={() => setPaused(false)} delayLongPress={150}
          />
        </View>
      </View>
    </Modal>
  );
}

const sv = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  card: { width: "100%", maxWidth: 440, height: "86%", borderRadius: 20, overflow: "hidden", backgroundColor: "#1a1640" },
  progressRow: { flexDirection: "row", gap: 4, paddingHorizontal: 12, paddingTop: 12, zIndex: 5 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, zIndex: 5 },
  ring: { padding: 2, borderRadius: 22, backgroundColor: "#C0453B" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#0f0c29" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14 },
  name: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14 },
  metaText: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "600" },
  sosTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(239,68,68,0.2)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  sosTagText: { fontFamily: DISPLAY, color: "#E7B5AF", fontSize: 10, fontWeight: "bold" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 20, zIndex: 5 },
  content: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.95)", fontSize: 17, lineHeight: 26, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10, padding: 14, zIndex: 5 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  actBtnGhost: { backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  actBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13.5 },
  // Tap zones sit BELOW header/actions (lower zIndex) so buttons still work.
  tapZone: { position: "absolute", top: 70, bottom: 80, width: "38%", zIndex: 1 },
});

/* ───────── Sub-components ───────── */

// Decide if the post is owned by the logged-in TA (mirrors web behaviour).
function isPostMine(post, currentAgentId) {
  const author = getAuthor(post);
  if (!author || !currentAgentId) return false;
  return author.type === "agent" && author.id === currentAgentId;
}

function PostCard({ post, currentAgentId, onAuthorPress, onLike, onSave, onShare, onComments, onMenu }) {
  const author = getAuthor(post) || {};
  const typeMeta = TYPE_META[author.type] || TYPE_META.agent;
  const liked = !!post.likedByMe;
  const saved = !!post.savedByMe;
  const isSOS = !!post.category?.isSOS;
  const isMine = isPostMine(post, currentAgentId);
  const images = Array.isArray(post.images) ? post.images : (post.image ? [post.image] : []);

  return (
    // SOS posts get a red-bordered card so the urgency reads before you even
    // reach the banner — same `isSOS` flag, styling only.
    <View style={[styles.card, isSOS && styles.cardSOS]}>
      {/* SOS banner (only for SOS posts) */}
      {isSOS && (
        <LinearGradient
          colors={[C.red, "#8E332B"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.sosStripe}
        >
          <View style={styles.sosStripeIcon}>
            <Ionicons name="alert" size={11} color={C.red} />
          </View>
          {/* No chevron — the banner isn't pressable, so an arrow here promised
              an action that doesn't exist. */}
          <Text style={styles.sosStripeText}>SOS · URGENT</Text>
          <View style={{ flex: 1 }} />
          {/* Age matters on an SOS — surface it in the banner instead of making
              the reader hunt for it in the meta line below. */}
          <View style={styles.sosTimePill}>
            <SosPulse />
            <Text style={styles.sosTimeText}>{fmtRelative(post.createdAt)}</Text>
          </View>
        </LinearGradient>
      )}

      <View style={styles.cardBody}>
        {/* Author row */}
        <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress} activeOpacity={0.85}>
          {author.logo ? (
            <RemoteImage source={{ uri: author.logo }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[typeMeta.color, shade(typeMeta.color, -15)]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials(author.displayName || author.name)}</Text>
            </LinearGradient>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.authorTopLine}>
              <Text style={styles.authorName} numberOfLines={1}>
                {author.displayName || author.name || "Someone"}
              </Text>
              <View style={[styles.typePill, { backgroundColor: `${typeMeta.color}1A` }]}>
                <Ionicons name={typeMeta.icon} size={10} color={typeMeta.color} />
                <Text style={[styles.typePillText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
              </View>
            </View>
            {/* City · time · category all on one meta line. The category used
                to sit on a row of its own below the author block, spending a
                full line on one small chip. */}
            <View style={styles.authorMetaRow}>
              {!!author.city && (
                <>
                  <Ionicons name="location" size={10} color={C.subText} />
                  <Text style={styles.authorMeta} numberOfLines={1}>{author.city}</Text>
                  <View style={styles.metaDot} />
                </>
              )}
              <Text style={styles.authorMeta}>{fmtRelative(post.createdAt)}</Text>
              {!!post.category?.name && (
                <>
                  <View style={styles.metaDot} />
                  <View style={[
                    styles.categoryPill,
                    isSOS ? { backgroundColor: C.redLight } : {},
                  ]}>
                    <Ionicons
                      name={isSOS ? "alert-circle" : "pricetag"}
                      size={9}
                      color={isSOS ? C.red : C.emerald600}
                    />
                    <Text
                      style={[styles.categoryText, isSOS ? { color: C.red } : {}]}
                      numberOfLines={1}
                    >
                      {post.category.name}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onMenu}
            style={styles.menuDotBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={C.subText} />
            {isMine && <View style={styles.menuDotMineMark} />}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Content */}
        {!!post.content && <Text style={styles.content}>{post.content}</Text>}

        {/* Images — full-bleed. Negative margins cancel the body padding so the
            photo runs edge to edge like a real feed; the card's overflow:hidden
            keeps the corners clean. */}
        {images.length > 0 && (
          <View style={[styles.imageWrap, isSOS && styles.imageWrapSOS]}>
            <RemoteImage source={{ uri: images[0] }} style={styles.contentImage} resizeMode="cover" />
            {images.length > 1 && (
              <View style={styles.imageCountBadge}>
                <Ionicons name="images" size={11} color="#fff" />
                <Text style={styles.imageCountText}>+{images.length - 1}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions — counts now sit next to their own icon, which removes the
            separate "N likes / N comments" strip and its divider. Same two
            fields rendered, one row instead of two. */}
        <View style={styles.actionsRow}>
          <ActionBtn
            icon={liked ? "heart" : "heart-outline"}
            count={post.likesCount}
            color={liked ? C.red : C.subText}
            onPress={onLike}
            a11y={liked ? "Unlike post" : "Like post"}
          />
          <ActionBtn
            icon="chatbubble-outline"
            count={post.commentsCount}
            color={C.subText}
            onPress={onComments}
            a11y="View comments"
          />
          <ActionBtn
            icon={saved ? "bookmark" : "bookmark-outline"}
            color={saved ? C.amber : C.subText}
            onPress={onSave}
            a11y={saved ? "Remove from saved" : "Save post"}
          />
          <View style={{ flex: 1 }} />
          <ActionBtn
            icon="share-social-outline"
            color={C.emerald600}
            onPress={onShare}
            a11y="Share post"
          />
        </View>
      </View>

      {/* Red rail down the left edge — keeps the card reading as urgent even
          once the banner has scrolled off the top of the screen. Rendered last
          so it paints OVER the full-bleed image; putting it before the body let
          the photo cut the rail in half. */}
      {isSOS && <View style={styles.sosRail} pointerEvents="none" />}
    </View>
  );
}

// Slowly pulsing dot on the SOS banner — a live "still open" cue. Native-driven
// (opacity + scale only), so it costs nothing even with several SOS cards on
// screen at once.
function SosPulse() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  return <Animated.View style={[styles.sosPulseDot, { opacity, transform: [{ scale }] }]} />;
}

function ActionBtn({ icon, count, color, onPress, a11y }) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <Ionicons name={icon} size={19} color={color} />
      {count > 0 && <Text style={[styles.actionCount, { color }]}>{count}</Text>}
    </TouchableOpacity>
  );
}

/**
 * 3-dot post menu (bottom sheet). Different actions for own vs others' posts.
 *  - Own post   → Share / Save / Copy link / Delete
 *  - Other post → Share / Save / Copy link
 * (Report removed for now — backend has no report endpoint yet.)
 */
function PostMenuSheet({ post, currentAgentId, onClose, onDelete, onShare, onShareImage, onSave, onCopyLink }) {
  if (!post) return null;
  const isMine = isPostMine(post, currentAgentId);
  const saved = !!post.savedByMe;
  const author = getAuthor(post) || {};

  const items = [
    {
      key: "share",
      icon: "share-social",
      color: C.emerald600,
      label: "Share in chat",
      hint: "Forward to a conversation",
      onPress: () => { onClose(); onShare(post); },
    },
    {
      key: "shareImg",
      icon: "logo-whatsapp",
      color: "#22C55E",
      label: "Share to other app",
      hint: "Send a branded card to WhatsApp",
      onPress: () => { onClose(); onShareImage?.(post); },
    },
    {
      key: "save",
      icon: saved ? "bookmark" : "bookmark-outline",
      color: C.amber,
      label: saved ? "Unsave post" : "Save post",
      hint: saved ? "Remove from your saved list" : "Add to your saved list",
      onPress: () => { onClose(); onSave(post); },
    },
    {
      key: "copy",
      icon: "link",
      color: C.blue,
      label: "Copy link",
      hint: "Share post URL anywhere",
      onPress: () => onCopyLink(post),
    },
    // Delete is owner-only. No backend "report" endpoint exists yet, so
    // non-own posts stop at the 3 actions above.
    ...(isMine
      ? [{
          key: "delete",
          icon: "trash",
          color: C.red,
          label: "Delete post",
          hint: "Remove permanently",
          danger: true,
          onPress: () => onDelete(post),
        }]
      : []),
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.menuBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.menuSheet}>
          {/* Drag handle */}
          <View style={styles.menuHandle} />

          {/* Post header */}
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderIcon}>
              <Ionicons name="newspaper" size={15} color={C.emerald600} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuHeaderName} numberOfLines={1}>
                {author.displayName || author.name || "Post"}
              </Text>
              <Text style={styles.menuHeaderSub} numberOfLines={1}>
                {isMine ? "Your post" : "Post by another partner"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.menuCloseBtn}>
              <Ionicons name="close" size={20} color={C.subText} />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12 }}>
            {items.map((it) => (
              <TouchableOpacity
                key={it.key}
                style={[
                  styles.menuRow,
                  it.danger && { borderColor: `${it.color}40`, backgroundColor: `${it.color}0A` },
                ]}
                onPress={it.onPress}
                activeOpacity={0.85}
              >
                <View style={[styles.menuRowIcon, { backgroundColor: `${it.color}1A` }]}>
                  <Ionicons name={it.icon} size={16} color={it.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.menuRowLabel,
                      it.danger && { color: it.color },
                    ]}
                  >
                    {it.label}
                  </Text>
                  <Text style={styles.menuRowHint}>{it.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.subText} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Comments bottom sheet. Loads `/social/posts/[id]/comment`, lets the user
 * post a new comment (optimistic) and delete their own comments. Updates the
 * parent's `commentsCount` via `onCountChange` so the feed card stays in sync.
 */
function CommentsSheet({ post, currentAgentId, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const listRef = React.useRef(null);

  // Load comments whenever a new post is opened.
  useEffect(() => {
    if (!post) {
      setComments([]); setDraft(""); setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    listSocialPostComments(post.id)
      .then((d) => setComments(d?.comments || []))
      .catch((e) =>
        setError(e?.response?.data?.error || e?.message || "Failed to load comments")
      )
      .finally(() => setLoading(false));
  }, [post]);

  if (!post) return null;

  // Comment ownership matches post ownership rule (agent + my id).
  const isCommentMine = (c) => {
    const a = c.author || c.actor || {};
    if (!currentAgentId) return false;
    return a.type === "agent" && a.id === currentAgentId;
  };
  const commentAuthorName = (c) => {
    const a = c.author || c.actor || {};
    return a.displayName || a.businessName || a.agencyName || a.name || a.ownerName || "Someone";
  };
  const commentAuthorType = (c) => (c.author || c.actor || {}).type || "agent";

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const optimistic = {
      id: `pending-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      author: { type: "agent", id: currentAgentId, displayName: "You" },
      __pending: true,
    };
    setComments((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      const res = await addSocialPostComment(post.id, text);
      const real = res?.comment;
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? { ...real, __justAdded: true } : c))
      );
      onCountChange?.(post.id, +1);
      // Scroll to bottom so user sees their new comment.
      requestAnimationFrame(() => {
        try { listRef.current?.scrollToEnd({ animated: true }); } catch {}
      });
    } catch (e) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setDraft(text);
      Alert.alert("Send failed", e?.response?.data?.error || e?.message || "Try again.");
    } finally {
      setSending(false);
    }
  };

  const onDeleteComment = (comment) => {
    Alert.alert("Delete comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setDeletingId(comment.id);
          const snapshot = comments;
          setComments((prev) => prev.filter((c) => c.id !== comment.id));
          try {
            await deleteSocialPostComment(post.id, comment.id);
            onCountChange?.(post.id, -1);
          } catch (e) {
            setComments(snapshot);
            Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to delete");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.commentsBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={styles.commentsSheet}
        >
          {/* Drag handle */}
          <View style={styles.menuHandle} />

          {/* Header */}
          <View style={styles.commentsHeader}>
            <View style={styles.commentsHeaderIcon}>
              <Ionicons name="chatbubbles" size={16} color={C.emerald600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <Text style={styles.commentsSub}>
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.menuCloseBtn}>
              <Ionicons name="close" size={20} color={C.subText} />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={C.emerald600} />
              <Text style={styles.loadingText}>Loading comments…</Text>
            </View>
          ) : error ? (
            <View style={styles.commentsErrorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={comments}
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                comments.length === 0
                  ? { flexGrow: 1, justifyContent: "center", padding: 24 }
                  : { padding: 14, paddingBottom: 24 }
              }
              ListEmptyComponent={
                <View style={styles.commentsEmpty}>
                  <View style={styles.commentsEmptyIcon}>
                    <Ionicons name="chatbubble-outline" size={28} color={C.emerald600} />
                  </View>
                  <Text style={styles.commentsEmptyTitle}>No comments yet</Text>
                  <Text style={styles.commentsEmptySub}>
                    Be the first to share your thoughts.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const mine = isCommentMine(item);
                const name = commentAuthorName(item);
                const tMeta = TYPE_META[commentAuthorType(item)] || TYPE_META.agent;
                const pending = item.__pending;
                return (
                  <View style={[styles.commentRow, pending && { opacity: 0.6 }]}>
                    <LinearGradient
                      colors={[tMeta.color, shade(tMeta.color, -15)]}
                      style={styles.commentAvatar}
                    >
                      <Text style={styles.commentAvatarText}>{initials(name)}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.commentBubble}>
                        <View style={styles.commentTopRow}>
                          <Text style={styles.commentName} numberOfLines={1}>{name}</Text>
                          <View style={[styles.commentTypePill, { backgroundColor: `${tMeta.color}1A` }]}>
                            <Ionicons name={tMeta.icon} size={8} color={tMeta.color} />
                            <Text style={[styles.commentTypeText, { color: tMeta.color }]}>
                              {tMeta.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.commentContent}>{item.content}</Text>
                      </View>
                      <View style={styles.commentFooter}>
                        <Text style={styles.commentTime}>
                          {pending ? "Sending…" : fmtRelative(item.createdAt)}
                        </Text>
                        {mine && !pending && (
                          <TouchableOpacity
                            onPress={() => onDeleteComment(item)}
                            disabled={deletingId === item.id}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            {deletingId === item.id ? (
                              <ActivityIndicator size="small" color={C.red} />
                            ) : (
                              <Text style={styles.commentDeleteBtn}>Delete</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Input bar */}
          <View style={styles.commentsInputBar}>
            <TextInput
              style={styles.commentsInput}
              placeholder="Add a comment…"
              placeholderTextColor="#A3B3C2"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.commentsSendWrap,
                (!draft.trim() || sending) && { opacity: 0.5 },
              ]}
              onPress={send}
              disabled={!draft.trim() || sending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[C.emerald500, C.emerald700]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.commentsSendInner}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/**
 * "Share in Chat" modal — REDESIGNED. Mirrors web behaviour.
 * Lists user's social conversations; tap one to forward post as
 * `post_card` JSON message.
 */
function ShareInChatModal({ post, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [sentId, setSentId] = useState(null);

  useEffect(() => {
    if (!post) return;
    setSentId(null);
    setSendingId(null);
    setLoading(true);
    listSocialConversations()
      .then((d) => setConversations(d.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [post]);

  const shareToChat = async (convId) => {
    if (sendingId || sentId) return;
    setSendingId(convId);
    const author = getAuthor(post) || {};
    const payload = JSON.stringify({
      __type: "post_card",
      postId: post.id,
      vendorName: author.displayName || author.name || "Partner",
      ownerName: author.ownerName || null,
      category: post.category?.name || null,
      isSOS: !!post.category?.isSOS,
      content: post.content || "",
    });
    try {
      await sendSocialMessage(convId, payload);
      setSentId(convId);
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Could not share");
      setSendingId(null);
    }
  };

  if (!post) return null;
  const author = getAuthor(post) || {};

  return (
    <Modal visible={!!post} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Gradient header */}
          <LinearGradient
            colors={HEADER_GRAD}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="paper-plane" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Share in chat</Text>
                <Text style={styles.modalSub}>Forward this post to a conversation</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Post preview */}
          <View style={styles.modalPreview}>
            <View style={styles.modalPreviewIcon}>
              <Ionicons name="document-text" size={14} color={C.emerald600} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.modalPreviewName} numberOfLines={1}>
                {author.displayName || author.name || "Post"}
              </Text>
              <Text style={styles.modalPreviewContent} numberOfLines={2}>
                {post.content || (post.category?.name ? `(${post.category.name})` : "(no content)")}
              </Text>
            </View>
          </View>

          {/* Conversations */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={C.emerald600} />
              <Text style={styles.loadingText}>Loading chats…</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.modalEmpty}>
              <View style={styles.modalEmptyIconWrap}>
                <Ionicons name="chatbubble-outline" size={32} color={C.emerald600} />
              </View>
              <Text style={styles.modalEmptyTitle}>No conversations yet</Text>
              <Text style={styles.modalEmptySub}>Start a chat from a partner's profile first.</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ padding: 14, paddingTop: 6 }}>
              <Text style={styles.modalListLabel}>YOUR CHATS</Text>
              {conversations.map((conv) => {
                const rawOther = conv.other || {};
                const otherName =
                  rawOther.displayName ||
                  rawOther.businessName ||
                  rawOther.agencyName ||
                  rawOther.name ||
                  rawOther.ownerName ||
                  "Someone";
                const typeMeta = TYPE_META[rawOther.type] || TYPE_META.agent;
                const sending = sendingId === conv.id;
                const sent = sentId === conv.id;
                const disabled = !!sendingId || !!sentId;

                return (
                  <TouchableOpacity
                    key={conv.id}
                    style={[
                      styles.convRow,
                      sent && { borderColor: C.emerald600, backgroundColor: C.emerald50 },
                      disabled && !sending && !sent && { opacity: 0.5 },
                    ]}
                    onPress={() => shareToChat(conv.id)}
                    disabled={disabled}
                    activeOpacity={0.85}
                  >
                    {rawOther.logo ? (
                      <RemoteImage source={{ uri: rawOther.logo }} style={styles.convAvatar} />
                    ) : (
                      <LinearGradient
                        colors={[typeMeta.color, shade(typeMeta.color, -15)]}
                        style={styles.convAvatar}
                      >
                        <Text style={styles.convAvatarText}>{initials(otherName)}</Text>
                      </LinearGradient>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.convNameRow}>
                        <Text style={styles.convName} numberOfLines={1}>{otherName}</Text>
                        <View style={[styles.convTypePill, { backgroundColor: `${typeMeta.color}1A` }]}>
                          <Text style={[styles.convTypePillText, { color: typeMeta.color }]}>
                            {typeMeta.label}
                          </Text>
                        </View>
                      </View>
                      {!!rawOther.city && (
                        <Text style={styles.convSub} numberOfLines={1}>
                          📍 {rawOther.city}
                        </Text>
                      )}
                    </View>
                    {sent ? (
                      <View style={styles.sentBadge}>
                        <Ionicons name="checkmark-circle" size={13} color="#fff" />
                        <Text style={styles.sentBadgeText}>SENT</Text>
                      </View>
                    ) : sending ? (
                      <ActivityIndicator size="small" color={C.emerald600} />
                    ) : (
                      <View style={styles.sendIconBtn}>
                        <Ionicons name="send" size={14} color={C.emerald600} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Helpers ───────── */
function shade(hex, pct) {
  const f = parseInt(hex.slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0xff;
  const B = f & 0xff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: {
    paddingBottom: 12, overflow: "hidden",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  orbA: {
    position: "absolute", top: -44, right: -30, width: 170, height: 170,
    borderRadius: 85, backgroundColor: "rgba(228,192,102,0.10)",
  },
  orbB: {
    position: "absolute", bottom: -40, left: -36, width: 140, height: 140,
    borderRadius: 70, backgroundColor: "rgba(23,166,124,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 10, gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerEyebrow: {
    fontFamily: DISPLAY, fontSize: 9, color: GOLD, fontWeight: "bold",
    letterSpacing: 1.4, includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: 21, fontWeight: "bold", color: "#fff",
    lineHeight: 25, marginTop: 2, includeFontPadding: false,
  },

  // Icon-only actions — labels removed so the title never wraps.
  sosBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.red,
  },
  msgBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
  },

  // ── Main tabs — underline style ───────────────────────────────────────────
  tabsBar: {
    flexDirection: "row", gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  // Transparent border always present so selecting a tab never reflows the row.
  tab: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 7, borderRadius: 10,
    backgroundColor: FILL,
    borderWidth: 1, borderColor: "transparent",
  },
  tabText: {
    fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold",
    color: C.subText, letterSpacing: 0.2, includeFontPadding: false,
  },
  // Sits inside the pill's top-right corner instead of floating outside it,
  // where it used to get clipped.
  tabDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.red,
    position: "absolute", top: 5, right: 6,
  },

  // ── Search — now sits inside the gradient header ─────────────────────────
  // Pill shape and a touch more fill/border than before — at 0.16/0.20 the
  // field almost dissolved into the gradient. 44px is also a proper touch target.
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 9,
    marginTop: 13, paddingLeft: 14, paddingRight: 6, height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.19)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.26)",
  },
  // padding:0 + a fixed-height parent leaves Android text sitting high; the
  // two vertical-centring props put it back on the middle line.
  searchInput: {
    fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: "#fff",
    padding: 0, fontWeight: "600",
    includeFontPadding: false, textAlignVertical: "center",
  },
  // Solid knob rather than a faint outline glyph — it was the same translucent
  // white as the placeholder, so it read as decoration instead of a button.
  searchClear: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Category filter chips ────────────────────────────────────────────────
  // Sits on the page ground, not on white. The tab bar above is already a white
  // band; making this one white too produced two stacked white strips with a
  // rule between them. Ivory here separates "which tab" from "filter within it".
  filterRow: {
    backgroundColor: C.bg,
    paddingTop: 10, paddingBottom: 8,
  },
  filterRowContent: { paddingHorizontal: 12, gap: 7, flexDirection: "row", alignItems: "center" },
  // Fully rounded, so they read as chips against the square-cornered tab pills.
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  filterChipText: {
    fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "bold",
    maxWidth: 130, includeFontPadding: false,
  },
  filterChipTextActive: { color: C.emerald700, fontWeight: "bold" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 6, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { padding: 14, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // SOS story strip (E6)
  storyStrip: { marginBottom: 12, paddingVertical: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  storyStripHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  storyStripTitle: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: C.red, letterSpacing: 0.5 },
  storyItem: { alignItems: "center", width: 64 },
  storyRing: { padding: 2.5, borderRadius: 33, backgroundColor: C.red },
  storyRingInner: { padding: 2, borderRadius: 30, backgroundColor: C.card },
  storyAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: FILL },
  storyAvatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: C.redLight },
  storyInitials: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 16 },
  storyName: { fontFamily: DISPLAY, fontSize: 10.5, color: C.text, fontWeight: "bold", marginTop: 5, maxWidth: 62, textAlign: "center" },

  // WhatsApp image-card capture (E6) — host sits off-screen but laid out.
  captureHost: { position: "absolute", left: -9999, top: 0, width: 340 },
  shareCard: { width: 340, backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden" },
  shareCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  shareCardAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  shareCardInitials: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 18 },
  shareCardName: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 16 },
  shareCardCat: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.9)", fontWeight: "bold", fontSize: 12, marginTop: 2 },
  shareCardBody: { paddingHorizontal: 18, paddingVertical: 20 },
  shareCardContent: { fontFamily: DISPLAY, color: "#0F172A", fontSize: 16, lineHeight: 24, fontWeight: "600" },
  shareCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  shareCardBrand: { fontFamily: DISPLAY, color: C.emerald700, fontSize: 12, fontWeight: "bold" },
  shareCardUrl: { fontFamily: DISPLAY, color: C.subText, fontSize: 11, fontWeight: "bold" },
  captureOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", gap: 10 },
  captureText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, marginTop: 6 },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },

  footerLoad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  footerLoadText: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, fontWeight: "600" },

  // Post card
  card: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 12, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  // A faint warm-red wash across the whole card, not just the banner strip.
  // Against the ivory page ground this reads as urgent even once the banner has
  // scrolled past the top of the screen.
  cardSOS: {
    backgroundColor: "#FEF9F8",
    borderColor: "#E4B0A8",
    shadowColor: C.red, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
  },
  // Left-aligned band with a white icon chip — reads as a proper banner rather
  // than a thin centred rule.
  sosStripe: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingVertical: 7, paddingHorizontal: 11,
  },
  sosStripeIcon: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  sosStripeText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold",
    letterSpacing: 1.1, includeFontPadding: false,
  },
  // Age pill on the right of the banner + its pulsing "still live" dot.
  sosTimePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, height: 20, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  sosPulseDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#fff" },
  sosTimeText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold",
    letterSpacing: 0.3, includeFontPadding: false,
  },
  // Full-height red rail on the card's left edge. Body padding stays 11 all
  // round so the full-bleed image maths (marginHorizontal: -11) still line up;
  // the rail simply overlays that 3.5px strip.
  sosRail: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: 3.5,
    backgroundColor: C.red,
  },
  cardBody: { padding: 11 },

  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 7 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 },
  // flexShrink (not flex:1) so a long name yields space to the type pill rather
  // than squeezing it to nothing.
  authorTopLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: {
    fontFamily: DISPLAY, flexShrink: 1, fontSize: 14.5, fontWeight: "bold",
    color: C.ink, lineHeight: 18, includeFontPadding: false,
  },
  typePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  typePillText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.3, includeFontPadding: false },
  authorMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  authorMeta: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "600", flexShrink: 1, includeFontPadding: false },
  // Geometric dot instead of a serif "·" glyph — the typographic middot sits
  // above the optical centre of the line, so the separators looked misaligned
  // against the icons and pills either side of them.
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C4CFC9" },

  // Now an inline chip inside the meta line — small, flat, no border.
  categoryPill: {
    flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 1,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: C.emerald50,
  },
  categoryText: {
    fontFamily: DISPLAY, fontSize: 9.5, color: C.emerald700, fontWeight: "bold",
    letterSpacing: 0.2, includeFontPadding: false, flexShrink: 1,
  },

  // The post body is the card's primary content, so it takes ink rather than
  // the softer body grey the meta line uses.
  content: {
    fontFamily: DISPLAY, fontSize: 14.5, color: C.ink,
    lineHeight: 21, marginBottom: 9, includeFontPadding: false,
  },

  // Negative margins cancel cardBody's 12px padding so the photo is full-bleed.
  // Square corners because the card already clips them.
  // Hairlines top and bottom so the full-bleed photo reads as a deliberate band.
  // Without them it ran straight into the card's side border — barely noticeable
  // on a normal card's grey hairline, but obvious against an SOS card's red one.
  imageWrap: {
    position: "relative", marginHorizontal: -11, marginBottom: 9,
    overflow: "hidden",
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border,
  },
  // On an SOS card the grey hairlines read as a foreign element against the
  // warm-red card; tint them to match the card's own border.
  imageWrapSOS: { borderColor: "#E4B0A8" },
  // The image is by far the largest block in a post card, so it's the only lever
  // that moves the total meaningfully. 150 ≈ 2.4:1 against the ~360px full-bleed
  // width. (Was 260 ≈ 4:3, then 200 ≈ 16:9, then 180 ≈ 2:1.)
  contentImage: { width: "100%", height: 150, backgroundColor: FILL },
  imageCountBadge: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 999, backgroundColor: "rgba(4,20,15,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  imageCountText: { fontFamily: DISPLAY, color: "#fff", fontSize: 10.5, fontWeight: "bold", includeFontPadding: false, fontVariant: ["tabular-nums"] },

  // Actions — icon-forward with inline counts. Like/comment/save group at the
  // left, share pushed right by a spacer. Hairline rule separates them from the
  // content now that the engagement strip (which used to do that) is gone.
  actionsRow: {
    flexDirection: "row", alignItems: "center", gap: 2,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 1,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10,
  },
  actionCount: {
    fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold",
    includeFontPadding: false, fontVariant: ["tabular-nums"],
  },

  // 3-dot menu button on each post (with mine marker)
  menuDotBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", position: "relative" },
  // Marks your own posts (the 3-dot menu then offers Delete). Ringed in card
  // white so it stays visible against the button on either background.
  menuDotMineMark: {
    position: "absolute", top: 5, right: 5,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.emerald600,
    borderWidth: 1.5, borderColor: C.card,
  },

  // Post-menu bottom sheet
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
  },
  menuHandle: {
    alignSelf: "center", marginTop: 8,
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  menuHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  menuHeaderIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  menuHeaderName: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  menuHeaderSub: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 2 },
  menuCloseBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: FILL, alignItems: "center", justifyContent: "center" },

  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: C.border, backgroundColor: "#FAFBFC",
  },
  menuRowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuRowLabel: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  menuRowHint: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 2 },

  // Comments bottom sheet
  commentsBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  commentsSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    maxHeight: "88%",
  },
  commentsHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  commentsHeaderIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  commentsTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink },
  commentsSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "bold", marginTop: 2 },
  commentsErrorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },

  commentsEmpty: { alignItems: "center", padding: 16 },
  commentsEmptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  commentsEmptyTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink, marginTop: 4 },
  commentsEmptySub: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, marginTop: 6, textAlign: "center" },

  // Comment row
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  commentAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  commentAvatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 12, letterSpacing: 0.3 },
  commentBubble: {
    backgroundColor: "#FAFBFC", borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: C.border,
  },
  commentTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  commentName: { fontFamily: DISPLAY, flex: 1, fontSize: 12.5, fontWeight: "bold", color: C.ink },
  commentTypePill: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999 },
  commentTypeText: { fontFamily: DISPLAY, fontSize: 8.5, fontWeight: "bold", letterSpacing: 0.3 },
  commentContent: { fontFamily: DISPLAY, fontSize: 13, color: C.text, lineHeight: 18 },
  commentFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, paddingHorizontal: 4 },
  commentTime: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "bold" },
  commentDeleteBtn: { fontFamily: DISPLAY, fontSize: 11, color: C.red, fontWeight: "bold" },

  // Input bar
  commentsInputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  commentsInput: {
    fontFamily: DISPLAY,
    flex: 1, fontSize: 14, color: C.ink,
    backgroundColor: "#FAFBFC", borderRadius: 20,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10,
    minHeight: 42, maxHeight: 110,
    borderWidth: 1, borderColor: C.border,
  },
  commentsSendWrap: {
    width: 42, height: 42, borderRadius: 21, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  commentsSendInner: { flex: 1, alignItems: "center", justifyContent: "center" },

  // FAB
  fabGroup: { position: "absolute", right: 18, bottom: 22, flexDirection: "column", alignItems: "center", gap: 10 },
  fab: {
    width: 58, height: 58, borderRadius: 29, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Share-in-Chat modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
    maxHeight: "85%",
  },
  modalHeaderGrad: { paddingHorizontal: 16, paddingVertical: 16 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: "#fff" },
  modalSub: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  modalPreview: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    marginHorizontal: 14, marginTop: 14, padding: 12,
    borderRadius: 12, backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: "#A7F3D0",
  },
  modalPreviewIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  modalPreviewName: { fontFamily: DISPLAY, fontSize: 12, color: C.emerald700, fontWeight: "bold" },
  modalPreviewContent: { fontFamily: DISPLAY, fontSize: 12.5, color: C.text, marginTop: 4, lineHeight: 17 },

  modalListLabel: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold", letterSpacing: 0.6, marginBottom: 8, marginTop: 8 },

  modalEmpty: { padding: 32, alignItems: "center" },
  modalEmptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modalEmptyTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink, marginTop: 6 },
  modalEmptySub: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, marginTop: 4, textAlign: "center", lineHeight: 17 },

  convRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC",
    marginBottom: 6,
  },
  convAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  convAvatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },
  convNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  convName: { fontFamily: DISPLAY, flex: 1, fontSize: 14, fontWeight: "bold", color: C.ink },
  convTypePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  convTypePillText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.3 },
  convSub: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },
  sendIconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  sentBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: C.emerald600 },
  sentBadgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
});

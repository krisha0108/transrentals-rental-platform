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
  pink: "#EC4899",
};

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
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Social</Text>
              <Text style={styles.headerSub}>Vendor + Agent network</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("TACreatePost", { isSOS: true })}
              style={styles.sosBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="alert-circle" size={14} color="#fff" />
              <Text style={styles.sosBtnText}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("TASocialMessages")}
              style={styles.msgBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="paper-plane" size={15} color={C.emerald700} />
              <Text style={styles.msgBtnText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Main tabs — full-width underline style ===== */}
      <View style={styles.tabsBar}>
        {FEED_TABS.map((t) => {
          const active = tab === t.key;
          const hasSOS = t.key === "sos" && sosAuthors.length > 0;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <View style={styles.tabInner}>
                <Ionicons name={t.icon} size={15} color={active ? t.color : C.subText} />
                <Text style={[styles.tabText, active && { color: t.color }]}>{t.label}</Text>
                {hasSOS && <View style={styles.tabDot} />}
              </View>
              {active && <View style={[styles.tabUnderline, { backgroundColor: t.color }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ===== Search bar ===== */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={15} color={C.subText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, people, category…"
          placeholderTextColor="#9CA8B4"
          value={feedSearch}
          onChangeText={setFeedSearch}
          returnKeyType="search"
        />
        {!!feedSearch && (
          <TouchableOpacity onPress={() => setFeedSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={15} color={C.subText} />
          </TouchableOpacity>
        )}
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
              <Ionicons name="apps" size={11} color={feedView === "all" && !categoryFilter ? C.emerald700 : C.subText} />
              <Text style={[styles.filterChipText, feedView === "all" && !categoryFilter && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, feedView === "general" && styles.filterChipActive]}
              onPress={() => { setFeedView("general"); setCategoryFilter(null); }}
            >
              <Ionicons name="newspaper" size={11} color={feedView === "general" ? C.emerald700 : C.subText} />
              <Text style={[styles.filterChipText, feedView === "general" && styles.filterChipTextActive]}>General</Text>
            </TouchableOpacity>
            {/* Separator */}
            <View style={styles.filterSep} />
            {/* Category chips */}
            {categories.map((c) => {
              const active = categoryFilter === c.id;
              const chipColor = c.isSOS ? C.red : C.emerald700;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, active && { backgroundColor: `${chipColor}15`, borderColor: chipColor }]}
                  onPress={() => { setCategoryFilter(active ? null : c.id); setFeedView("all"); }}
                >
                  <Ionicons name={c.isSOS ? "alert-circle" : "pricetag"} size={11} color={active ? chipColor : C.subText} />
                  <Text style={[styles.filterChipText, active && { color: chipColor, fontWeight: "800" }]} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
            {/* Old SOS toggle */}
            {hiddenOldSosCount > 0 && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setShowOldSos(v => !v)}>
                <Ionicons name="time" size={11} color={C.subText} />
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

      {/* ===== Floating FABs (SOS + General) ===== */}
      <View style={styles.fabGroup}>
        <TouchableOpacity
          style={styles.fabSOS}
          onPress={() => navigation.navigate("TACreatePost", { isSOS: true })}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#DC2626", "#991B1B"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <Text style={styles.fabSOSLabel}>SOS</Text>
          </LinearGradient>
        </TouchableOpacity>
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
                colors={sos ? ["#7F1D1D", "#B91C1C"] : ["#022C22", "#047857"]}
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
            <View style={sv.sosTag}><Ionicons name="alert-circle" size={11} color="#FCA5A5" /><Text style={sv.sosTagText}>SOS</Text></View>
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
  ring: { padding: 2, borderRadius: 22, backgroundColor: "#EF4444" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#0f0c29" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#fff", fontWeight: "800", fontSize: 14 },
  name: { color: "#fff", fontWeight: "800", fontSize: 14 },
  metaText: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "600" },
  sosTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(239,68,68,0.2)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  sosTagText: { color: "#FCA5A5", fontSize: 10, fontWeight: "900" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 20, zIndex: 5 },
  content: { color: "rgba(255,255,255,0.95)", fontSize: 17, lineHeight: 26, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10, padding: 14, zIndex: 5 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  actBtnGhost: { backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  actBtnText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
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
    <View style={styles.card}>
      {/* SOS top stripe (only for SOS posts) */}
      {isSOS && (
        <LinearGradient
          colors={[C.red, "#DC2626"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.sosStripe}
        >
          <Ionicons name="alert" size={11} color="#fff" />
          <Text style={styles.sosStripeText}>SOS · URGENT</Text>
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
            <View style={styles.authorMetaRow}>
              {!!author.city && (
                <>
                  <Ionicons name="location" size={11} color={C.subText} />
                  <Text style={styles.authorMeta} numberOfLines={1}>{author.city}</Text>
                  <Text style={styles.authorMetaDot}>·</Text>
                </>
              )}
              <Ionicons name="time" size={11} color={C.subText} />
              <Text style={styles.authorMeta}>{fmtRelative(post.createdAt)}</Text>
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

        {/* Category pill (above content) */}
        {!!post.category?.name && (
          <View style={[
            styles.categoryPill,
            isSOS ? { backgroundColor: C.redLight, borderColor: "#FCA5A5" } : {},
          ]}>
            <Ionicons
              name={isSOS ? "alert-circle" : "pricetag"}
              size={11}
              color={isSOS ? C.red : C.emerald600}
            />
            <Text style={[
              styles.categoryText,
              isSOS ? { color: C.red } : {},
            ]}>
              {post.category.name}
            </Text>
          </View>
        )}

        {/* Content */}
        {!!post.content && <Text style={styles.content}>{post.content}</Text>}

        {/* Images */}
        {images.length > 0 && (
          <View style={styles.imageWrap}>
            <RemoteImage source={{ uri: images[0] }} style={styles.contentImage} resizeMode="cover" />
            {images.length > 1 && (
              <View style={styles.imageCountBadge}>
                <Ionicons name="images" size={11} color="#fff" />
                <Text style={styles.imageCountText}>+{images.length - 1}</Text>
              </View>
            )}
          </View>
        )}

        {/* Engagement counts row (subtle, above actions) */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <View style={styles.engageRow}>
            {post.likesCount > 0 && (
              <View style={styles.engageItem}>
                <View style={styles.likeBubble}>
                  <Ionicons name="heart" size={9} color="#fff" />
                </View>
                <Text style={styles.engageText}>
                  {post.likesCount} {post.likesCount > 1 ? "likes" : "like"}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {post.commentsCount > 0 && (
              <Text style={styles.engageText}>
                {post.commentsCount} {post.commentsCount > 1 ? "comments" : "comment"}
              </Text>
            )}
          </View>
        )}

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <ActionBtn
            icon={liked ? "heart" : "heart-outline"}
            label={liked ? "Liked" : "Like"}
            color={liked ? C.red : C.subText}
            bg={liked ? C.redLight : "transparent"}
            onPress={onLike}
          />
          <ActionBtn
            icon="chatbubble-outline"
            label="Comment"
            color={C.subText}
            onPress={onComments}
          />
          <ActionBtn
            icon={saved ? "bookmark" : "bookmark-outline"}
            label={saved ? "Saved" : "Save"}
            color={saved ? C.amber : C.subText}
            bg={saved ? C.amberLight : "transparent"}
            onPress={onSave}
          />
          <ActionBtn
            icon="share-social-outline"
            label="Share"
            color={C.emerald600}
            onPress={onShare}
          />
        </View>
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, color, bg, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, bg && { backgroundColor: bg }]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
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
            colors={["#022C22", "#064E3B", "#047857"]}
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
  headerGrad: { paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  sosBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.red, marginRight: 6,
  },
  sosBtnText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  msgBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#fff",
  },
  msgBtnText: { color: C.emerald700, fontWeight: "800", fontSize: 12 },

  // ── Main tabs — underline style (Instagram-like) ──────────────────────────
  tabsBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: { flex: 1, alignItems: "center", paddingTop: 10, paddingBottom: 0 },
  tabInner: { flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 10 },
  tabText: { fontSize: 12, fontWeight: "700", color: C.subText },
  tabUnderline: { height: 2.5, borderRadius: 2, width: "80%", marginTop: 0 },
  tabDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.red,
    position: "absolute", top: -1, right: -8,
  },

  // ── Search bar ──────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 12, marginVertical: 8,
    paddingHorizontal: 12, height: 38,
    borderRadius: 10, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.ink, padding: 0 },

  // ── Combined filter row (feed tab only) ────────────────────────────────
  filterRow: {
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 6,
  },
  filterRowContent: { paddingHorizontal: 12, gap: 6, flexDirection: "row", alignItems: "center" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  filterChipText: { fontSize: 11.5, color: C.subText, fontWeight: "700", maxWidth: 120 },
  filterChipTextActive: { color: C.emerald700, fontWeight: "800" },
  filterSep: { width: 1, height: 18, backgroundColor: C.border, marginHorizontal: 2 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 6, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { padding: 14, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // SOS story strip (E6)
  storyStrip: { marginBottom: 12, paddingVertical: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  storyStripHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  storyStripTitle: { fontSize: 11, fontWeight: "900", color: C.red, letterSpacing: 0.5 },
  storyItem: { alignItems: "center", width: 64 },
  storyRing: { padding: 2.5, borderRadius: 33, backgroundColor: "#EF4444" },
  storyRingInner: { padding: 2, borderRadius: 30, backgroundColor: C.card },
  storyAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EEF2F6" },
  storyAvatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#FEE2E2" },
  storyInitials: { color: C.red, fontWeight: "800", fontSize: 16 },
  storyName: { fontSize: 10.5, color: C.text, fontWeight: "700", marginTop: 5, maxWidth: 62, textAlign: "center" },

  // WhatsApp image-card capture (E6) — host sits off-screen but laid out.
  captureHost: { position: "absolute", left: -9999, top: 0, width: 340 },
  shareCard: { width: 340, backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden" },
  shareCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  shareCardAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  shareCardInitials: { color: "#fff", fontWeight: "900", fontSize: 18 },
  shareCardName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  shareCardCat: { color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 12, marginTop: 2 },
  shareCardBody: { paddingHorizontal: 18, paddingVertical: 20 },
  shareCardContent: { color: "#0F172A", fontSize: 16, lineHeight: 24, fontWeight: "600" },
  shareCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#EEF2F6" },
  shareCardBrand: { color: C.emerald700, fontSize: 12, fontWeight: "800" },
  shareCardUrl: { color: C.subText, fontSize: 11, fontWeight: "700" },
  captureOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", gap: 10 },
  captureText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  footerLoad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  footerLoadText: { fontSize: 12, color: C.subText, fontWeight: "600" },

  // Post card
  card: {
    backgroundColor: C.card, borderRadius: 14, marginBottom: 12, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sosStripe: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 5,
  },
  sosStripeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  cardBody: { padding: 12 },

  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 0.5 },
  authorTopLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { flex: 1, fontSize: 14, fontWeight: "800", color: C.ink },
  typePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  typePillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  authorMetaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  authorMeta: { fontSize: 11, color: C.subText, fontWeight: "600", flexShrink: 1 },
  authorMetaDot: { fontSize: 11, color: C.subText, fontWeight: "800" },

  categoryPill: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
    marginBottom: 8,
  },
  categoryText: { fontSize: 11, color: C.emerald700, fontWeight: "800", letterSpacing: 0.3 },

  content: { fontSize: 14, color: C.text, lineHeight: 20, marginBottom: 10 },

  imageWrap: { position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden" },
  contentImage: { width: "100%", height: 240, backgroundColor: "#F1F5F9" },
  imageCountBadge: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.7)" },
  imageCountText: { color: "#fff", fontSize: 10.5, fontWeight: "800" },

  // Engagement counts row
  engageRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  engageItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeBubble: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  engageText: { fontSize: 11, color: C.subText, fontWeight: "700" },

  // Actions
  actionsRow: { flexDirection: "row", gap: 6 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 9, borderRadius: 10,
  },
  actionText: { fontSize: 11.5, fontWeight: "800" },

  // 3-dot menu button on each post (with mine marker)
  menuDotBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", position: "relative" },
  menuDotMineMark: {
    position: "absolute", top: 6, right: 6,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.emerald600,
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
  menuHeaderName: { fontSize: 14, fontWeight: "800", color: C.ink },
  menuHeaderSub: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 2 },
  menuCloseBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },

  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: C.border, backgroundColor: "#FAFBFC",
  },
  menuRowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuRowLabel: { fontSize: 14, fontWeight: "800", color: C.ink },
  menuRowHint: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 2 },

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
  commentsTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  commentsSub: { fontSize: 11.5, color: C.subText, fontWeight: "700", marginTop: 2 },
  commentsErrorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },

  commentsEmpty: { alignItems: "center", padding: 16 },
  commentsEmptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  commentsEmptyTitle: { fontSize: 15, fontWeight: "800", color: C.ink, marginTop: 4 },
  commentsEmptySub: { fontSize: 12, color: C.subText, marginTop: 6, textAlign: "center" },

  // Comment row
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  commentAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  commentAvatarText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 0.3 },
  commentBubble: {
    backgroundColor: "#FAFBFC", borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: C.border,
  },
  commentTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  commentName: { flex: 1, fontSize: 12.5, fontWeight: "800", color: C.ink },
  commentTypePill: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999 },
  commentTypeText: { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.3 },
  commentContent: { fontSize: 13, color: C.text, lineHeight: 18 },
  commentFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, paddingHorizontal: 4 },
  commentTime: { fontSize: 10.5, color: C.subText, fontWeight: "700" },
  commentDeleteBtn: { fontSize: 11, color: C.red, fontWeight: "800" },

  // Input bar
  commentsInputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  commentsInput: {
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
  fabSOS: {
    width: 52, height: 52, borderRadius: 26, overflow: "hidden",
    shadowColor: C.red, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabSOSLabel: { color: "#fff", fontWeight: "900", fontSize: 10, marginTop: 1 },
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
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  modalSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  modalPreview: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    marginHorizontal: 14, marginTop: 14, padding: 12,
    borderRadius: 12, backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: "#A7F3D0",
  },
  modalPreviewIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  modalPreviewName: { fontSize: 12, color: C.emerald700, fontWeight: "800" },
  modalPreviewContent: { fontSize: 12.5, color: C.text, marginTop: 4, lineHeight: 17 },

  modalListLabel: { fontSize: 10, color: C.subText, fontWeight: "800", letterSpacing: 0.6, marginBottom: 8, marginTop: 8 },

  modalEmpty: { padding: 32, alignItems: "center" },
  modalEmptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modalEmptyTitle: { fontSize: 15, fontWeight: "800", color: C.ink, marginTop: 6 },
  modalEmptySub: { fontSize: 12, color: C.subText, marginTop: 4, textAlign: "center", lineHeight: 17 },

  convRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC",
    marginBottom: 6,
  },
  convAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  convAvatarText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  convNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  convName: { flex: 1, fontSize: 14, fontWeight: "800", color: C.ink },
  convTypePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  convTypePillText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.3 },
  convSub: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },
  sendIconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  sentBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: C.emerald600 },
  sentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
});

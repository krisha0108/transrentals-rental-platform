import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  PanResponder,
  Image,
  StatusBar,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import LG from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNShare from 'react-native-share';
import RNFS from 'react-native-fs';
import { Svg, Rect, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  getSocialFeed,
  getSocialSOS,
  getSocialSaved,
  getSocialCategories,
  toggleLike,
  toggleSave,
  deleteSocialPost,
  toggleFollow,
  getComments,
  addComment,
  getConversations,
  sendMessage,
} from '../../api/socialApi';
import { getFullImageURL } from '../../api/client';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Local hex-named palette this screen already used everywhere below — same
// key names, now pointed at the shared "Elevate" theme tokens instead of
// hardcoded hex. Renamed G -> C so it doesn't collide with the theme's own
// `G` gradients export, mirroring the rename CreatePostScreen.js just used.
const C = {
  bg: T.bg, surface: T.card, text: T.ink, muted: T.subText,
  border: T.border, violet: T.emerald600, violetL: T.tintEmerald,
  red: T.red, redL: T.redLight, green: T.emerald600, greenL: T.tintEmerald,
  orange: T.orange, orangeL: T.orangeL, amber: T.amber, amberL: T.tintGold,
  g950: T.forestDark, g900: T.forest, g800: T.emeraldDeep, g600: T.emerald600,
};

const AVATAR_COLORS = [T.emerald, T.ocean, T.gold, T.rose, T.indigo, T.orange, T.emeraldDeep];
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Normalize API posts — backend returns likedByMe/savedByMe, UI uses isLiked/isSaved
const normalizePosts = (posts) =>
  posts.map((p) => ({ ...p, isLiked: !!(p.likedByMe ?? p.isLiked), isSaved: !!(p.savedByMe ?? p.isSaved) }));

// ── Post Card SVG (matches web canvas design, 800x480) ────────────────
// Word-wrap helper for SVG text (no measureText in RN — use char estimate)
function wrapText(text, maxChars = 62) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length >= 7) { lines[lines.length - 1] += '...'; break; }
    } else {
      line = test;
    }
  }
  if (line && lines.length < 7) lines.push(line);
  return lines;
}

const PostCardSVG = React.forwardRef(({ post }, ref) => {
  if (!post) return null;
  const isSOS = post.category?.isSOS || post.category?.name?.toLowerCase() === 'sos';
  const accent1 = isSOS ? C.red : C.violet;
  const accent2 = isSOS ? '#8E332B' : T.forestDark;
  const bgTint = isSOS ? T.redLight : T.tintEmerald;
  const catBg = isSOS ? T.redLight : T.tintEmerald;
  const catColor = isSOS ? C.red : C.violet;

  const vendorName = post.vendor?.businessName || 'Vendor';
  const ownerName = post.vendor?.ownerName || '';
  const category = (isSOS ? '⚡ ' : '') + (post.category?.name || 'General');
  const catW = Math.min(category.length * 8 + 24, 200);
  const contentLines = wrapText(post.content || '', 62);

  return (
    <Svg ref={ref} width={800} height={480}>
      <Defs>
        <LinearGradient id="topBar" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={accent1} />
          <Stop offset="1" stopColor={accent2} />
        </LinearGradient>
      </Defs>
      {/* White card bg */}
      <Rect x={0} y={0} width={800} height={480} fill="#ffffff" />
      {/* Bg tint */}
      <Rect x={0} y={10} width={800} height={470} fill={bgTint} />
      {/* Top gradient bar */}
      <Rect x={0} y={0} width={800} height={10} fill="url(#topBar)" />

      {/* Avatar circle */}
      <Circle cx={52} cy={72} r={28} fill={accent1} />
      <SvgText x={52} y={78} fontSize={22} fontWeight="bold" fill="#ffffff" textAnchor="middle">
        {vendorName.charAt(0).toUpperCase()}
      </SvgText>

      {/* Vendor name */}
      <SvgText x={92} y={64} fontSize={22} fontWeight="bold" fill="#111827">{vendorName}</SvgText>
      {/* Owner name */}
      {ownerName ? <SvgText x={92} y={85} fontSize={15} fill="#6b7280">{ownerName}</SvgText> : null}

      {/* Category pill */}
      <Rect x={92} y={95} width={catW} height={24} rx={12} fill={catBg} />
      <SvgText x={104} y={112} fontSize={13} fontWeight="bold" fill={catColor}>{category}</SvgText>

      {/* Divider */}
      <Line x1={40} y1={136} x2={760} y2={136} stroke="#e5e7eb" strokeWidth={1} />

      {/* Content text */}
      {contentLines.map((line, i) => (
        <SvgText key={i} x={40} y={168 + i * 30} fontSize={18} fill="#1f2937">{line}</SvgText>
      ))}

      {/* Footer bar */}
      <Rect x={0} y={436} width={800} height={44} fill="#f9fafb" />
      <Line x1={0} y1={436} x2={800} y2={436} stroke="#e5e7eb" strokeWidth={1} />
      <SvgText x={40} y={465} fontSize={14} fontWeight="bold" fill={accent1}>TransRentals</SvgText>
      <SvgText x={135} y={465} fontSize={13} fill="#9ca3af">Vendor Network</SvgText>
    </Svg>
  );
});

// ── SOS Story Progress Bar (animated, pauseable) ─────────────────────
function StoryProgressBar({ count, current, duration, storyKey, paused }) {
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const currentValRef = useRef(0);
  const remainingRef = useRef(duration);

  // Track current value for pause/resume
  useEffect(() => {
    const id = progress.addListener(({ value }) => { currentValRef.current = value; });
    return () => progress.removeListener(id);
  }, []);

  // Reset and start on story change
  useEffect(() => {
    if (animRef.current) animRef.current.stop();
    progress.setValue(0);
    currentValRef.current = 0;
    remainingRef.current = duration;
    animRef.current = Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false });
    animRef.current.start();
    return () => { if (animRef.current) animRef.current.stop(); };
  }, [storyKey]);

  // Pause / resume
  useEffect(() => {
    if (paused) {
      if (animRef.current) animRef.current.stop();
      remainingRef.current = duration * (1 - currentValRef.current);
    } else {
      if (animRef.current) animRef.current.stop();
      animRef.current = Animated.timing(progress, {
        toValue: 1, duration: remainingRef.current, useNativeDriver: false,
      });
      animRef.current.start();
    }
  }, [paused]);

  return (
    <View style={styles.progressBarRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.progressSegment}>
          {i < current ? (
            <View style={[styles.progressFill, { width: '100%' }]} />
          ) : i === current ? (
            <Animated.View style={[styles.progressFill, {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── Avatar Circle ─────────────────────────────────────────────────────
function AvatarCircle({ name, logo, size = 40, style }) {
  const [imgErr, setImgErr] = useState(false);
  const letter = name?.charAt(0)?.toUpperCase() || '?';
  const bg = getAvatarColor(name);
  const [uri, setUri] = useState(null);

  useEffect(() => {
    if (logo) {
      getFullImageURL(logo).then(setUri);
    } else {
      setUri(null);
    }
  }, [logo]);

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {logo && uri && !imgErr ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{letter}</Text>
      )}
    </View>
  );
}

// ── Post images (resolves async getFullImageURL into state) ───────────
function PostImageThumb({ url, style }) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    let alive = true;
    getFullImageURL(url).then((u) => { if (alive) setUri(u); });
    return () => { alive = false; };
  }, [url]);
  return <Image source={uri ? { uri } : undefined} style={style} resizeMode="cover" />;
}

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function SkeletonPost() {
  return (
    <View style={styles.postCard}>
      <Bone w={rs(34)} h={rs(34)} r={rs(17)} style={styles.postAvatar} />
      <View style={styles.postBody}>
        <View style={styles.postLine1}>
          <Bone w={rs(110)} h={rs(13)} />
          <Bone w={rs(70)} h={rs(11)} style={{ marginLeft: rs(8) }} />
        </View>
        <Bone w="90%" h={rs(13)} style={{ marginTop: rs(8) }} />
        <Bone w="60%" h={rs(13)} style={{ marginTop: rs(6), marginBottom: rs(9) }} />
        <View style={styles.actionBar}>
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} w={rs(24)} h={rs(14)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function PostImages({ images }) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const single = images.length === 1;
  return (
    <View style={[postImageStyles.grid, single && { flexDirection: 'column' }]}>
      {images.map((url, i) => (
        <PostImageThumb
          key={i}
          url={url}
          style={[
            postImageStyles.img,
            single ? postImageStyles.imgSingle : postImageStyles.imgMulti,
            images.length === 3 && i === 0 ? postImageStyles.imgWide : null,
          ]}
        />
      ))}
    </View>
  );
}

const postImageStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(5), overflow: 'hidden', borderRadius: rs(14), borderWidth: 1, borderColor: T.tintBorder },
  img: { backgroundColor: T.tintBorder },
  imgSingle: { width: '100%', height: rs(170) },
  imgMulti: { width: '49%', height: rs(105) },
  imgWide: { width: '100%', height: rs(120) },
});

export default function SocialFeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [tab, setTab] = useState('feed'); // 'feed' | 'saved'
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [sosPosts, setSosPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [savedCursor, setSavedCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Share card
  const [shareCardPost, setShareCardPost] = useState(null);
  const [sharingCard, setSharingCard] = useState(false);
  const svgCardRef = useRef(null);

  // SOS story viewer
  const [storyVisible, setStoryVisible] = useState(false);
  const [storyGroupIdx, setStoryGroupIdx] = useState(0);
  const [storyPostIdx, setStoryPostIdx] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);
  const storyTimerRef = useRef(null);
  const storyTimerStartRef = useRef(null);
  const storyRemainingRef = useRef(15000);

  // Comment modal (feed)
  const [commentPost, setCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [commentKbHeight, setCommentKbHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvt = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setCommentKbHeight(e.endCoordinates?.height || 0));
    const hideSub = Keyboard.addListener(hideEvt, () => setCommentKbHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Story inline comment input
  const [storyCommentText, setStoryCommentText] = useState('');
  const [storySendingComment, setStorySendingComment] = useState(false);
  const storyCommentInputRef = useRef(null);

  // Three-dot menu
  const [menuPost, setMenuPost] = useState(null);

  // Share-to-chat modal
  const [shareToChatPost, setShareToChatPost] = useState(null);
  const [shareConversations, setShareConversations] = useState([]);
  const [shareConvLoading, setShareConvLoading] = useState(false);
  const [sendingToChat, setSendingToChat] = useState(null); // conversationId being sent to

  useEffect(() => {
    AsyncStorage.getItem('vendor_id').then((id) => setCurrentVendorId(id));
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getSocialCategories();
      setCategories(res?.data?.categories || res?.categories || []);
    } catch (e) {
      console.log('[Social] categories error', e);
    }
  }, []);

  const fetchSOS = useCallback(async () => {
    try {
      const res = await getSocialSOS();
      setSosPosts(res?.data?.posts || res?.posts || []);
    } catch (e) {
      console.log('[Social] SOS error', e);
    }
  }, []);

  const fetchFeed = useCallback(async (reset = true) => {
    try {
      const c = reset ? null : cursor;
      const res = await getSocialFeed(c, activeCategoryId);
      const newPosts = normalizePosts(res?.data?.posts || res?.posts || []);
      const nextCursor = res?.data?.nextCursor || res?.nextCursor || null;
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (e) {
      console.log('[Social] feed error', e);
    }
  }, [cursor, activeCategoryId]);

  const fetchSaved = useCallback(async (reset = true) => {
    try {
      const c = reset ? null : savedCursor;
      const res = await getSocialSaved(c);
      const newPosts = normalizePosts(res?.data?.posts || res?.posts || []);
      const nextCursor = res?.data?.nextCursor || res?.nextCursor || null;
      if (reset) {
        setSavedPosts(newPosts);
      } else {
        setSavedPosts((prev) => [...prev, ...newPosts]);
      }
      setSavedCursor(nextCursor);
    } catch (e) {
      console.log('[Social] saved error', e);
    }
  }, [savedCursor]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchSOS(), fetchFeed(true)]);
    setLoading(false);
  }, [fetchCategories, fetchSOS, fetchFeed]);

  // Group SOS posts by vendor — one circle per vendor
  const sosGroups = useMemo(() => {
    const map = new Map();
    for (const p of sosPosts) {
      const key = p.vendorId ?? p.vendor?.id;
      if (!key) continue;
      if (!map.has(key)) map.set(key, { vendor: p.vendor, posts: [] });
      map.get(key).posts.push(p);
    }
    return Array.from(map.values());
  }, [sosPosts]);

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(C.g950);
  }, []));

  useEffect(() => { initialLoad(); }, []);
  useEffect(() => { if (!loading) fetchFeed(true); }, [activeCategoryId]);
  useEffect(() => { if (shareCardPost && sharingCard) doShareCapture(); }, [shareCardPost, sharingCard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSOS(), tab === 'feed' ? fetchFeed(true) : fetchSaved(true)]);
    setRefreshing(false);
  }, [tab, fetchFeed, fetchSaved, fetchSOS]);

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchFeed(false);
    setLoadingMore(false);
  };

  // Tab switch
  const switchTab = async (t) => {
    setTab(t);
    if (t === 'saved' && savedPosts.length === 0) {
      setLoading(true);
      await fetchSaved(true);
      setLoading(false);
    }
  };

  // ── Story viewer ─────────────────────────────────────────────────────
  const openStory = (groupIndex) => {
    setStoryGroupIdx(groupIndex);
    setStoryPostIdx(0);
    setStoryPaused(false);
    setStoryCommentText('');
    storyRemainingRef.current = 15000;
    setStoryVisible(true);
  };

  const STORY_DURATION = 15000;

  const advanceStory = useCallback(() => {
    const currentGroup = sosGroups[storyGroupIdx];
    const totalPosts = currentGroup?.posts.length || 1;
    if (storyPostIdx < totalPosts - 1) {
      setStoryPostIdx((i) => i + 1);
    } else if (storyGroupIdx < sosGroups.length - 1) {
      setStoryGroupIdx((g) => g + 1);
      setStoryPostIdx(0);
    } else {
      setStoryVisible(false);
    }
  }, [storyGroupIdx, storyPostIdx, sosGroups]);

  // Start/reset timer when story changes
  useEffect(() => {
    if (!storyVisible || storyPaused) return;
    clearTimeout(storyTimerRef.current);
    storyRemainingRef.current = STORY_DURATION;
    storyTimerStartRef.current = Date.now();
    storyTimerRef.current = setTimeout(advanceStory, STORY_DURATION);
    return () => clearTimeout(storyTimerRef.current);
  }, [storyVisible, storyGroupIdx, storyPostIdx]);

  // Pause / resume timer
  useEffect(() => {
    if (!storyVisible) return;
    if (storyPaused) {
      clearTimeout(storyTimerRef.current);
      const elapsed = Date.now() - (storyTimerStartRef.current || Date.now());
      storyRemainingRef.current = Math.max(0, storyRemainingRef.current - elapsed);
    } else {
      storyTimerStartRef.current = Date.now();
      storyTimerRef.current = setTimeout(advanceStory, storyRemainingRef.current);
    }
    return () => clearTimeout(storyTimerRef.current);
  }, [storyPaused]);

  const storyPrev = () => {
    clearTimeout(storyTimerRef.current);
    storyRemainingRef.current = STORY_DURATION;
    setStoryPaused(false);
    if (storyPostIdx > 0) {
      setStoryPostIdx((i) => i - 1);
    } else if (storyGroupIdx > 0) {
      const prevGroup = sosGroups[storyGroupIdx - 1];
      setStoryGroupIdx((g) => g - 1);
      setStoryPostIdx(prevGroup.posts.length - 1);
    }
  };

  const storyNext = () => {
    clearTimeout(storyTimerRef.current);
    storyRemainingRef.current = STORY_DURATION;
    setStoryPaused(false);
    advanceStory();
  };

  // Ref to hold latest story state for PanResponder (avoids stale closures)
  const storyStateRef = useRef({ groupIdx: 0, totalGroups: 0 });
  useEffect(() => {
    storyStateRef.current = { groupIdx: storyGroupIdx, totalGroups: sosGroups.length };
  }, [storyGroupIdx, sosGroups]);

  const storyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        const { groupIdx, totalGroups } = storyStateRef.current;
        if (gs.dx < -50) {
          clearTimeout(storyTimerRef.current);
          if (groupIdx < totalGroups - 1) {
            setStoryGroupIdx(groupIdx + 1);
            setStoryPostIdx(0);
          } else {
            setStoryVisible(false);
          }
        } else if (gs.dx > 50) {
          clearTimeout(storyTimerRef.current);
          if (groupIdx > 0) {
            setStoryGroupIdx(groupIdx - 1);
            setStoryPostIdx(0);
          }
        }
      },
    })
  ).current;

  // FAB — keep navigation ref fresh so PanResponder closure never goes stale
  const fabNavRef = useRef(null);
  fabNavRef.current = navigation;

  const fabPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gs) => {
        // swipe-up OR tap
        if (gs.dy < -20 || (Math.abs(gs.dx) < 12 && Math.abs(gs.dy) < 12)) {
          fabNavRef.current?.navigate('CreatePostScreen');
        }
      },
    })
  ).current;

  // Screen swipe-left → open Messages
  const screenNavRef = useRef(null);
  screenNavRef.current = navigation;

  const screenPanResponder = useRef(
    PanResponder.create({
      // Only claim horizontal swipes where dx dominates
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) {
          screenNavRef.current?.navigate('SocialMessagesScreen');
        }
      },
    })
  ).current;

  // ── Actions ───────────────────────────────────────────────────────────
  const toggleLikeLocal = (list, postId) =>
    list.map((p) => p.id === postId
      ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? (p.likesCount || 1) - 1 : (p.likesCount || 0) + 1 }
      : p
    );

  const handleLike = async (postId) => {
    setPosts((prev) => toggleLikeLocal(prev, postId));
    setSavedPosts((prev) => toggleLikeLocal(prev, postId));
    setSosPosts((prev) => toggleLikeLocal(prev, postId));
    try { await toggleLike(postId); } catch (e) { console.log('[Social] like error', e); }
  };

  const handleSave = async (postId) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    try { await toggleSave(postId); } catch (e) { console.log('[Social] save error', e); }
  };

  const handleFollow = async (vendorId) => {
    setMenuPost(null);
    try {
      await toggleFollow(vendorId);
      Alert.alert('Done', 'Follow status updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not update follow status.');
    }
  };

  const handleDelete = (postId) => {
    setMenuPost(null);
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteSocialPost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (e) {
            Alert.alert('Error', 'Could not delete post.');
          }
        },
      },
    ]);
  };

  // Share to internal chat — open vendor list modal
  const handleShareToChat = async (post) => {
    setShareToChatPost(post);
    setShareConvLoading(true);
    try {
      const res = await getConversations();
      setShareConversations(res?.data?.conversations || res?.conversations || []);
    } catch (e) {
      Alert.alert('Error', 'Could not load conversations.');
    } finally {
      setShareConvLoading(false);
    }
  };

  const handleSendToConversation = async (conversationId) => {
    if (!shareToChatPost || sendingToChat) return;
    setSendingToChat(conversationId);
    const post = shareToChatPost;
    try {
      const cardPayload = JSON.stringify({
        __type: 'post_card',
        postId: post.id,
        vendorName: post.vendor?.businessName || 'Vendor',
        category: post.category?.name || '',
        content: post.content,
      });
      await sendMessage(conversationId, cardPayload);
      setShareToChatPost(null);
      Alert.alert('Sent!', 'Post shared to chat.');
    } catch (e) {
      Alert.alert('Error', 'Could not send post.');
    } finally {
      setSendingToChat(null);
    }
  };

  // External share — set both states so overlay+SVG render first, then capture
  const handleShare = (post) => {
    if (sharingCard) return;
    setSharingCard(true);   // show overlay immediately (SVG renders inside it)
    setShareCardPost(post);
  };

  const doShareCapture = useCallback(async () => {
    if (!shareCardPost) return;
    try {
      // Wait for overlay + SVG to fully render and rasterize on GPU
      await new Promise((resolve) => setTimeout(resolve, 450));
      if (!svgCardRef.current) throw new Error('SVG ref not ready');

      svgCardRef.current.toDataURL(async (base64) => {
        try {
          const path = `${RNFS.CachesDirectoryPath}/post_card_${Date.now()}.png`;
          await RNFS.writeFile(path, base64, 'base64');
          const vendorName = shareCardPost.vendor?.businessName || 'Vendor';
          const caption =
            `📢 *${vendorName}* on Vendor Network\n\n` +
            `${shareCardPost.content}\n\n` +
            `📲 Join the Vendor Network — Download TransRentals Vendor App:\n` +
            `🌐 https://transrentals.in`;
          await RNShare.open({
            url: 'file://' + path,
            type: 'image/png',
            message: caption,
            failOnCancel: false,
          });
        } catch (e) {
          console.log('[Social] share file error', e);
        } finally {
          setSharingCard(false);
          setShareCardPost(null);
        }
      });
    } catch (e) {
      console.log('[Social] share capture error', e);
      setSharingCard(false);
      setShareCardPost(null);
    }
  }, [shareCardPost]);

  // ── Comments ──────────────────────────────────────────────────────────
  const openComments = async (post) => {
    // pause story if open
    if (storyVisible) setStoryPaused(true);
    setCommentPost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await getComments(post.id);
      setComments(res?.data?.comments || res?.comments || []);
    } catch (e) {
      console.log('[Social] comments error', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentPost(null);
    if (storyVisible) setStoryPaused(false);
  };

  const handleStoryComment = async (postId) => {
    const text = storyCommentText.trim();
    if (!text || storySendingComment) return;
    setStoryCommentText('');
    storyCommentInputRef.current?.blur();
    setStorySendingComment(true);
    try {
      await addComment(postId, text);
      setSosPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      ));
    } catch (e) {
      Alert.alert('Error', 'Could not send comment.');
      setStoryCommentText(text);
    } finally {
      setStorySendingComment(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentPost) return;
    const text = commentText.trim();
    setCommentText('');
    setSendingComment(true);
    try {
      const res = await addComment(commentPost.id, text);
      const newComment = res?.data?.comment || res?.comment;
      if (newComment) setComments((prev) => [...prev, newComment]);
      // update count in all lists
      const incCount = (list) => list.map((p) =>
        p.id === commentPost.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      );
      setPosts(incCount);
      setSosPosts(incCount);
    } catch (e) {
      Alert.alert('Error', 'Could not add comment.');
    } finally {
      setSendingComment(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────
  const renderCategoryBadge = (post) => {
    const isSOS = post.category?.name?.toLowerCase() === 'sos' || post.type === 'sos';
    return (
      <View style={[styles.catBadge, { backgroundColor: isSOS ? C.redL : C.violetL }]}>
        <Text style={[styles.catBadgeText, { color: isSOS ? C.red : C.violet }]}>
          {isSOS ? '🚨 SOS' : post.category?.name || 'General'}
        </Text>
      </View>
    );
  };

  const renderPost = ({ item }) => {
    const isSOS = item.category?.name?.toLowerCase() === 'sos' || item.type === 'sos';
    const isOwn = String(item.vendorId) === String(currentVendorId);
    const catBg = isSOS ? C.redL : C.greenL;
    const catText = isSOS ? C.red : C.green;

    return (
      <View style={styles.postCard}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => navigation.navigate('SocialProfileScreen', { vendorId: item.vendorId })}
        >
          <AvatarCircle name={item.vendor?.businessName} logo={item.vendor?.logo} size={rs(34)} style={styles.postAvatar} />
        </TouchableOpacity>

        <View style={styles.postBody}>
          {/* Line 1 — name · time, category tag + menu pushed right, Twitter-style */}
          <View style={styles.postLine1}>
            <Text style={styles.postVendorName} numberOfLines={1}>
              {item.vendor?.businessName || 'Unknown Vendor'}
            </Text>
            <Text style={styles.postMeta} numberOfLines={1}>
              · {item.vendor?.city ? `${item.vendor.city} · ` : ''}{formatTimeAgo(item.createdAt)}
            </Text>
            <View style={styles.postLine1Right}>
              <View style={[styles.catBadge, { backgroundColor: catBg }]}>
                {isSOS && <Icon name="alert-circle" size={rs(9)} color={catText} style={{ marginRight: rs(3) }} />}
                <Text style={[styles.catBadgeText, { color: catText }]}>
                  {isSOS ? 'SOS' : (item.category?.name || 'General')}
                </Text>
              </View>
              <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuPost(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="more-vertical" size={rs(16)} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {!!item.content && <Text style={styles.postContent}>{item.content}</Text>}

          {/* Images — compact, rounded, inline within the text column */}
          <PostImages images={item.images} />

          {/* Icon row — compact icon + count pairs, Twitter-style */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionPair} onPress={() => openComments(item)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <MCI name="comment-outline" size={rs(15)} color={C.muted} />
              {item.commentsCount > 0 && <Text style={styles.actionCount}>{item.commentsCount}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPair} onPress={() => handleLike(item.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <MCI name={item.isLiked ? 'heart' : 'heart-outline'} size={rs(15)} color={item.isLiked ? C.red : C.muted} />
              {item.likesCount > 0 && <Text style={[styles.actionCount, item.isLiked && { color: C.red }]}>{item.likesCount}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPair} onPress={() => handleShareToChat(item)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Icon name="send" size={rs(14)} color={C.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPair} onPress={() => handleShare(item)} disabled={sharingCard} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Icon name="share-2" size={rs(14)} color={sharingCard ? C.border : C.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionPair, { marginLeft: 'auto' }]} onPress={() => handleSave(item.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <MCI name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={rs(15)} color={item.isSaved ? C.green : C.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const displayPosts = tab === 'feed' ? posts : savedPosts;

  // ── Main Render ───────────────────────────────────────────────────────
  return (
    <View style={styles.safe} {...screenPanResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} translucent={false} />
      {/* Header */}
      <LG colors={G.hero} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Icon name="trending-up" size={rs(18)} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Vendor Network</Text>
              <Text style={styles.headerSub}>Connect · Share · Grow</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerMsgBtn}
            onPress={() => navigation.navigate('SocialMessagesScreen')}
            activeOpacity={0.8}
          >
            <Icon name="message-circle" size={rs(20)} color="#fff" />
          </TouchableOpacity>
        </View>
      </LG>

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.violet} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* SOS Strip — one circle per vendor */}
            {sosGroups.length > 0 && (
              <View style={styles.sosStrip}>
                <View style={styles.sosStripHeader}>
                  <View style={styles.sosStripIconWrap}>
                    <Icon name="alert-circle" size={rs(14)} color={C.red} />
                  </View>
                  <Text style={styles.sosStripLabel}>Urgent SOS</Text>
                  <Text style={styles.sosStripCount}>{sosPosts.length} post{sosPosts.length !== 1 ? 's' : ''}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sosScrollContent}>
                  {sosGroups.map((group, index) => (
                    <TouchableOpacity key={group.vendor?.id || index} style={styles.sosCircleWrap} onPress={() => openStory(index)} activeOpacity={0.8}>
                      <View style={styles.sosCircleBorder}>
                        <AvatarCircle name={group.vendor?.businessName} logo={group.vendor?.logo} size={rs(52)} />
                      </View>
                      <Text style={styles.sosCircleName} numberOfLines={1}>
                        {group.vendor?.businessName?.split(' ')[0] || 'SOS'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Tabs */}
            <View style={styles.tabsRow}>
              {['feed', 'saved'].map((t) => (
                <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => switchTab(t)} activeOpacity={0.8}>
                  <Icon name={t === 'feed' ? 'rss' : 'bookmark'} size={rs(14)} color={tab === t ? C.green : C.muted} />
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'feed' ? 'Feed' : 'Saved'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category chips — only for feed tab */}
            {tab === 'feed' && categories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContentOuter} contentContainerStyle={styles.chipsContent}>
                <TouchableOpacity
                  style={[styles.chip, !activeCategoryId && styles.chipActive]}
                  onPress={() => setActiveCategoryId(null)}
                >
                  <Text numberOfLines={1} style={[styles.chipText, !activeCategoryId && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, activeCategoryId === cat.id && styles.chipActive]}
                    onPress={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
                  >
                    <Text numberOfLines={1} style={[styles.chipText, activeCategoryId === cat.id && styles.chipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        }
        ListFooterComponent={
          loading ? null : hasMore && tab === 'feed' ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore} activeOpacity={0.85}>
              {loadingMore
                ? <ActivityIndicator color={C.violet} size="small" />
                : <Text style={styles.loadMoreText}>Load more posts</Text>}
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <>
              <SkeletonPost />
              <SkeletonPost />
              <SkeletonPost />
              <SkeletonPost />
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Icon name={tab === 'saved' ? 'bookmark' : 'rss'} size={rs(40)} color={C.violet} />
              </View>
              <Text style={styles.emptyTitle}>{tab === 'saved' ? 'No saved posts' : 'No posts yet'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'saved' ? 'Bookmark posts to see them here.' : 'Be the first to post something!'}
              </Text>
            </View>
          )
        }
      />

      {/* Sharing overlay — SVG renders here (on-screen) so GPU rasterizes it */}
      {sharingCard && (
        <View style={styles.sharingOverlay} pointerEvents="box-none">
          {/* SVG is inside overlay so it's on-screen for toDataURL capture */}
          <View style={styles.svgCaptureContainer} collapsable={false}>
            <PostCardSVG ref={svgCardRef} post={shareCardPost} />
          </View>
          {/* Spinner on top */}
          <View style={styles.sharingSpinner} pointerEvents="none">
            <ActivityIndicator color={C.violet} size="large" />
            <Text style={styles.sharingText}>Generating card…</Text>
          </View>
        </View>
      )}

      {/* ── Floating New Post Button (tap or swipe-up) ─────────────────── */}
      <View style={styles.floatingNewPostBtn} {...fabPanResponder.panHandlers}>
        <LG colors={G.emerald} style={styles.floatingNewPostBtnInner}>
          <Icon name="plus" size={rs(26)} color="#fff" />
        </LG>
      </View>

      {/* ── SOS Story Viewer Modal ─────────────────────────────────────── */}
      <Modal visible={storyVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setStoryVisible(false)}>
        <KeyboardAvoidingView style={styles.storyOverlay} behavior="padding">
          {sosGroups[storyGroupIdx]?.posts[storyPostIdx] && (() => {
            const currentPost = sosGroups[storyGroupIdx].posts[storyPostIdx];
            const currentGroup = sosGroups[storyGroupIdx];
            const storyKey = `${storyGroupIdx}_${storyPostIdx}`;
            return (
              <>
                {/* Story canvas — fills all space above bottom bar */}
                <View style={{ flex: 1 }} {...storyPanResponder.panHandlers}>
                  {/* Tap zones: press-and-hold = pause, tap = next/prev */}
                  <View style={styles.storyTapZones} pointerEvents="box-none">
                    <TouchableOpacity
                      style={styles.storyTapLeft}
                      onPress={storyPrev}
                      onLongPress={() => setStoryPaused(true)}
                      onPressOut={() => setStoryPaused(false)}
                      activeOpacity={1}
                      delayLongPress={150}
                    />
                    <TouchableOpacity
                      style={styles.storyTapRight}
                      onPress={storyNext}
                      onLongPress={() => setStoryPaused(true)}
                      onPressOut={() => setStoryPaused(false)}
                      activeOpacity={1}
                      delayLongPress={150}
                    />
                  </View>

                  {/* Pause indicator */}
                  {storyPaused && (
                    <View style={styles.storyPausedOverlay} pointerEvents="none">
                      <Icon name="pause" size={rs(40)} color="rgba(255,255,255,0.7)" />
                    </View>
                  )}

                  {/* Top bar: progress + header */}
                  <View style={styles.storyTopBar}>
                    <StoryProgressBar
                      count={currentGroup.posts.length}
                      current={storyPostIdx}
                      duration={15000}
                      storyKey={storyKey}
                      paused={storyPaused}
                    />
                    <View style={styles.storyHeaderRow}>
                      {/* Vendor avatar + name — tap to view profile */}
                      <TouchableOpacity
                        style={styles.storySenderRow}
                        onPress={() => {
                          setStoryVisible(false);
                          navigation.navigate('SocialProfileScreen', { vendorId: currentPost.vendorId });
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.storyAvatarBorder}>
                          <AvatarCircle name={currentPost.vendor?.businessName} logo={currentPost.vendor?.logo} size={rs(36)} />
                        </View>
                        <View style={styles.storyHeaderInfo}>
                          <Text style={styles.storyVendorName} numberOfLines={1}>
                            {currentPost.vendor?.businessName || 'Vendor'}
                          </Text>
                          <Text style={styles.storyMeta}>
                            {formatTimeAgo(currentPost.createdAt)}
                            {sosGroups.length > 1 ? `  ·  ${storyGroupIdx + 1}/${sosGroups.length}` : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.storyCloseBtn} onPress={() => setStoryVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Icon name="x" size={rs(22)} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.storyContent}>
                    <View style={styles.storySOSBadge}>
                      <Icon name="alert-circle" size={rs(14)} color="#fff" />
                      <Text style={styles.storySOSBadgeText}>SOS · URGENT</Text>
                    </View>
                    <Text style={styles.storyText}>{currentPost.content}</Text>
                    {currentPost.vendor?.city ? (
                      <View style={styles.storyLocationRow}>
                        <Icon name="map-pin" size={rs(13)} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.storyLocationText}>{currentPost.vendor.city}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Gradient fade at bottom of canvas */}
                  <LG colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.storyBottomGradient} pointerEvents="none" />
                </View>

                {/* Bottom bar — in normal flow so KAV pushes it above keyboard */}
                <View style={styles.storyBottomBar}>
                  {/* Comment input row — first */}
                  <View style={styles.storyCommentRow}>
                    <TextInput
                      ref={storyCommentInputRef}
                      style={styles.storyCommentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="rgba(255,255,255,0.55)"
                      value={storyCommentText}
                      onChangeText={setStoryCommentText}
                      onFocus={() => setStoryPaused(true)}
                      onBlur={() => { if (!storyCommentText.trim()) setStoryPaused(false); }}
                      returnKeyType="send"
                      onSubmitEditing={() => handleStoryComment(currentPost.id)}
                      blurOnSubmit={false}
                    />
                    <TouchableOpacity
                      style={[styles.storyCommentSend, (!storyCommentText.trim() || storySendingComment) && { opacity: 0.35 }]}
                      onPress={() => handleStoryComment(currentPost.id)}
                      disabled={!storyCommentText.trim() || storySendingComment}
                    >
                      {storySendingComment
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Icon name="send" size={rs(18)} color="#fff" />}
                    </TouchableOpacity>
                  </View>

                  {/* Like button — second */}
                  <TouchableOpacity
                    style={styles.storyLikeBtn}
                    onPress={() => handleLike(currentPost.id)}
                  >
                    <MCI
                      name={currentPost.isLiked ? 'heart' : 'heart-outline'}
                      size={rs(28)}
                      color={currentPost.isLiked ? '#FF4D4D' : '#fff'}
                    />
                    {currentPost.likesCount > 0 && (
                      <Text style={[styles.storyActionCount, currentPost.isLiked && { color: '#FF4D4D' }]}>
                        {currentPost.likesCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Three-dot Menu Modal ───────────────────────────────────────── */}
      <Modal visible={!!menuPost} transparent animationType="fade" onRequestClose={() => setMenuPost(null)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuPost(null)}>
          <View style={styles.menuSheet}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
            {menuPost && String(menuPost.vendorId) !== String(currentVendorId) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => handleFollow(menuPost.vendorId)} activeOpacity={0.85}>
                <View style={[styles.menuItemIcon, { backgroundColor: C.violetL }]}>
                  <Icon name="user-plus" size={rs(16)} color={C.violet} />
                </View>
                <Text style={styles.menuItemText}>Follow / Unfollow</Text>
              </TouchableOpacity>
            )}
            {menuPost && String(menuPost.vendorId) !== String(currentVendorId) && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() => {
                  setMenuPost(null);
                  navigation.navigate('SocialProfileScreen', { vendorId: menuPost.vendorId });
                }}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: T.tintBorder }]}>
                  <Icon name="user" size={rs(16)} color={C.muted} />
                </View>
                <Text style={styles.menuItemText}>View Profile</Text>
              </TouchableOpacity>
            )}
            {menuPost && String(menuPost.vendorId) === String(currentVendorId) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(menuPost.id)} activeOpacity={0.85}>
                <View style={[styles.menuItemIcon, { backgroundColor: C.redL }]}>
                  <Icon name="trash-2" size={rs(16)} color={C.red} />
                </View>
                <Text style={[styles.menuItemText, { color: C.red }]}>Delete Post</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuPost(null)} activeOpacity={0.85}>
              <View style={[styles.menuItemIcon, { backgroundColor: T.tintBorder }]}>
                <Icon name="x" size={rs(16)} color={C.muted} />
              </View>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Share to Chat Modal ────────────────────────────────────────── */}
      <Modal visible={!!shareToChatPost} transparent animationType="slide" onRequestClose={() => setShareToChatPost(null)}>
        <View style={styles.commentOverlay}>
          <TouchableOpacity style={styles.commentBackdrop} onPress={() => setShareToChatPost(null)} />
          <View style={styles.commentSheet}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
            <View style={styles.commentSheetHeader}>
              <View style={styles.commentSheetHeaderIcon}>
                <Icon name="send" size={rs(15)} color={C.violet} />
              </View>
              <Text style={styles.commentSheetTitle}>Share to Chat</Text>
              <TouchableOpacity onPress={() => setShareToChatPost(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={rs(20)} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Post preview */}
            {shareToChatPost && (
              <View style={styles.shareChatPreview}>
                <Text style={styles.shareChatPreviewName} numberOfLines={1}>
                  {shareToChatPost.vendor?.businessName}
                </Text>
                <Text style={styles.shareChatPreviewContent} numberOfLines={2}>
                  {shareToChatPost.content}
                </Text>
              </View>
            )}

            {shareConvLoading ? (
              <View style={styles.commentsList}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.shareChatConvItem}>
                    <Bone w={rs(40)} h={rs(40)} r={rs(20)} />
                    <View style={{ flex: 1 }}>
                      <Bone w={rs(110)} h={rs(13)} style={{ marginBottom: rs(6) }} />
                      <Bone w={rs(80)} h={rs(11)} />
                    </View>
                  </View>
                ))}
              </View>
            ) : shareConversations.length === 0 ? (
              <View style={styles.commentEmpty}>
                <Icon name="message-circle" size={rs(36)} color={C.border} />
                <Text style={styles.commentEmptyText}>No conversations yet</Text>
                <Text style={[styles.commentEmptyText, { fontSize: rs(12), marginTop: rs(4) }]}>
                  Start a chat first from the Messages screen
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                {shareConversations.map((conv) => {
                  const vendor = conv.other || {};
                  const isSending = sendingToChat === conv.id;
                  return (
                    <TouchableOpacity
                      key={conv.id}
                      style={styles.shareChatConvItem}
                      onPress={() => handleSendToConversation(conv.id)}
                      disabled={!!sendingToChat}
                      activeOpacity={0.75}
                    >
                      <AvatarCircle name={vendor.businessName} logo={vendor.logo} size={rs(40)} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shareChatConvName} numberOfLines={1}>{vendor.businessName || 'Vendor'}</Text>
                        {vendor.ownerName && <Text style={styles.shareChatConvOwner} numberOfLines={1}>{vendor.ownerName}</Text>}
                      </View>
                      {isSending
                        ? <ActivityIndicator size="small" color={C.violet} />
                        : <Icon name="send" size={rs(16)} color={C.violet} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Comment Modal ──────────────────────────────────────────────── */}
      <Modal visible={!!commentPost} transparent animationType="slide" onRequestClose={() => closeComments()}>
        <View style={[styles.commentOverlay, { paddingBottom: commentKbHeight }]}>
          <TouchableOpacity style={styles.commentBackdrop} onPress={() => closeComments()} />
          <View style={styles.commentSheet}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
            <View style={styles.commentSheetHeader}>
              <View style={styles.commentSheetHeaderIcon}>
                <Icon name="message-circle" size={rs(15)} color={C.violet} />
              </View>
              <Text style={styles.commentSheetTitle}>Comments</Text>
              <TouchableOpacity onPress={() => closeComments()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={rs(20)} color={C.muted} />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <View style={styles.commentsList}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.commentItem}>
                    <Bone w={rs(32)} h={rs(32)} r={rs(16)} />
                    <View style={styles.commentBody}>
                      <Bone w={rs(90)} h={rs(12)} style={{ marginBottom: rs(6) }} />
                      <Bone w="80%" h={rs(12)} style={{ marginBottom: rs(6) }} />
                      <Bone w={rs(50)} h={rs(10)} />
                    </View>
                  </View>
                ))}
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.commentEmpty}>
                <Icon name="message-circle" size={rs(36)} color={C.border} />
                <Text style={styles.commentEmptyText}>No comments yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <AvatarCircle name={c.vendor?.businessName || c.author?.businessName} logo={c.vendor?.logo || c.author?.logo} size={rs(32)} />
                    <View style={styles.commentBody}>
                      <Text style={styles.commentAuthor}>{c.vendor?.businessName || c.author?.businessName || 'Vendor'}</Text>
                      <Text style={styles.commentText}>{c.content}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Write a comment..."
                placeholderTextColor={C.muted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, (!commentText.trim() || sendingComment) && styles.commentSendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || sendingComment}
                activeOpacity={0.85}
              >
                {sendingComment
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="send" size={rs(16)} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header — hero gradient with rounded bottom corners + ambient orbs
  header: {
    paddingHorizontal: rs(16), paddingBottom: rs(14),
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  headerIconWrap: {
    width: rs(36), height: rs(36), borderRadius: rs(11), backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: rs(18), fontWeight: 'bold', color: '#fff', letterSpacing: 0.2,
    includeFontPadding: false,
  },
  headerSub: { fontFamily: DISPLAY, fontSize: rs(11), color: 'rgba(255,255,255,0.65)', marginTop: rs(1), includeFontPadding: false },
  headerMsgBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },

  // SOS Strip
  sosStrip: {
    backgroundColor: C.surface, paddingTop: rs(12), paddingBottom: rs(12),
    borderWidth: 1, borderColor: C.border, marginBottom: rs(4),
    borderLeftWidth: 3, borderLeftColor: C.red,
    marginHorizontal: rs(12), marginTop: rs(12), borderRadius: rs(16),
    ...cardShadow,
  },
  sosStripHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(12), marginBottom: rs(10), gap: rs(6) },
  sosStripIconWrap: { width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.redL, alignItems: 'center', justifyContent: 'center' },
  sosStripLabel: { fontFamily: DISPLAY, fontSize: rs(12.5), fontWeight: 'bold', color: C.red, flex: 1 },
  sosStripCount: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted, fontWeight: '600' },
  sosScrollContent: { paddingHorizontal: rs(10), gap: rs(12) },
  sosCircleWrap: { alignItems: 'center', width: rs(64) },
  sosCircleBorder: { padding: rs(2.5), borderRadius: rs(32), borderWidth: 2.5, borderColor: C.red, marginBottom: rs(5) },
  sosCircleName: { fontFamily: DISPLAY, fontSize: rs(10.5), color: C.text, fontWeight: '600', textAlign: 'center' },
  sosPostCountBadge: {
    position: 'absolute', top: -rs(4), right: -rs(4),
    backgroundColor: C.red, borderRadius: rs(8), minWidth: rs(16), height: rs(16),
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(3),
    borderWidth: 1.5, borderColor: C.surface,
  },
  sosPostCountText: { fontFamily: DISPLAY, fontSize: rs(9), color: '#fff', fontWeight: 'bold' },

  // Floating New Post button
  floatingNewPostBtn: {
    position: 'absolute', bottom: rs(24), right: rs(20),
    width: rs(58), height: rs(58), borderRadius: rs(29),
    ...cardShadow,
    zIndex: 50,
  },
  floatingNewPostBtnInner: {
    flex: 1, borderRadius: rs(29), alignItems: 'center', justifyContent: 'center',
  },

  // Tabs — segmented pill row
  tabsRow: {
    flexDirection: 'row', backgroundColor: C.surface,
    marginHorizontal: rs(12), marginTop: rs(12),
    borderRadius: rs(14), padding: rs(4), gap: rs(4),
    borderWidth: 1, borderColor: C.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: rs(9), borderRadius: rs(10),
  },
  tabActive: { backgroundColor: C.greenL },
  tabText: { fontFamily: DISPLAY, fontSize: rs(13), fontWeight: '700', color: C.muted },
  tabTextActive: { color: C.green },

  // Category chips
  chipsContentOuter: { flexGrow: 0, flexShrink: 0, height: 58 },
  chipsContent: { paddingHorizontal: rs(12), paddingVertical: rs(10), gap: rs(8), alignItems: 'center' },
  chip: {
    paddingHorizontal: rs(14), paddingVertical: rs(7), borderRadius: rs(20),
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.greenL, borderColor: C.green },
  chipText: { fontFamily: DISPLAY, fontSize: rs(12.5), fontWeight: '600', color: C.muted },
  chipTextActive: { color: C.green },

  // Post card
  listContent: { paddingBottom: rs(110) },
  // Twitter/X-compact: flat timeline row, avatar left + text column right, hairline divider
  postCard: {
    flexDirection: 'row', gap: rs(10),
    backgroundColor: C.surface, paddingHorizontal: rs(14), paddingVertical: rs(12),
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  postAvatar: { marginTop: rs(2) },
  postBody: { flex: 1, minWidth: 0 },
  postLine1: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  postVendorName: { fontFamily: DISPLAY, fontSize: rs(13), fontWeight: 'bold', color: C.text, includeFontPadding: false },
  postMeta: { fontFamily: DISPLAY, fontSize: rs(12), color: C.muted, marginLeft: rs(4) },
  postLine1Right: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginLeft: 'auto', paddingLeft: rs(8) },
  menuBtn: { padding: rs(2) },
  catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(7), paddingVertical: rs(2.5), borderRadius: rs(20) },
  catBadgeText: { fontFamily: DISPLAY, fontSize: rs(9), fontWeight: 'bold' },
  postContent: { fontFamily: DISPLAY, fontSize: rs(13), color: C.text, lineHeight: rs(19), marginTop: rs(3), marginBottom: rs(8) },
  actionBar: { flexDirection: 'row', alignItems: 'center', marginTop: rs(9), gap: rs(26) },
  actionPair: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  actionCount: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted, fontWeight: '700' },

  // Load more / empty
  loadMoreBtn: { margin: rs(16), padding: rs(13), alignItems: 'center', backgroundColor: C.violetL, borderRadius: rs(14) },
  loadMoreText: { fontFamily: DISPLAY, color: C.violet, fontWeight: 'bold', fontSize: rs(13) },
  emptyWrap: { alignItems: 'center', paddingVertical: rs(60), paddingHorizontal: rs(40) },
  emptyIconWrap: {
    width: rs(76), height: rs(76), borderRadius: rs(38), backgroundColor: C.violetL,
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(14),
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rs(17), fontWeight: 'bold', color: C.text, marginBottom: rs(6) },
  emptyText: { fontFamily: DISPLAY, fontSize: rs(13), color: C.muted, textAlign: 'center', lineHeight: rs(19) },

  // Story overlay
  storyOverlay: { flex: 1, backgroundColor: '#000' },
  storyTapZones: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', zIndex: 5 },
  storyTapLeft: { flex: 1 },
  storyTapRight: { flex: 1 },

  // Story top bar
  storyTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    paddingTop: rs(52), paddingHorizontal: rs(10), paddingBottom: rs(8),
  },
  progressBarRow: { flexDirection: 'row', gap: rs(3), marginBottom: rs(12) },
  progressSegment: {
    flex: 1, height: rs(3), borderRadius: rs(2), backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: rs(2) },
  storyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storySenderRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 },
  storyAvatarBorder: { borderRadius: rs(22), borderWidth: 2, borderColor: C.red, padding: rs(2) },
  storyHeaderInfo: { flex: 1 },
  storyVendorName: { fontFamily: DISPLAY, fontSize: rs(15), fontWeight: 'bold', color: '#fff' },
  storyMeta: { fontFamily: DISPLAY, fontSize: rs(11), color: 'rgba(255,255,255,0.6)', marginTop: rs(1) },
  storyCloseBtn: { padding: rs(6), zIndex: 30 },

  // Story content
  storyContent: { flex: 1, justifyContent: 'center', paddingHorizontal: rs(24), paddingTop: rs(140), paddingBottom: rs(20) },
  storySOSBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6), alignSelf: 'flex-start',
    backgroundColor: C.red, paddingHorizontal: rs(12), paddingVertical: rs(5),
    borderRadius: rs(20), marginBottom: rs(20),
  },
  storySOSBadgeText: { fontFamily: DISPLAY, color: '#fff', fontWeight: 'bold', fontSize: rs(11), letterSpacing: 1 },
  storyText: { fontFamily: DISPLAY, fontSize: rs(21), color: '#fff', lineHeight: rs(32), fontWeight: '600' },
  storyLocationRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginTop: rs(16) },
  storyLocationText: { fontFamily: DISPLAY, fontSize: rs(13), color: 'rgba(255,255,255,0.6)' },

  // Story pause overlay
  storyPausedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15,
    alignItems: 'center', justifyContent: 'center',
  },

  storyBottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: rs(140), zIndex: 19,
  },

  // Story bottom bar — Instagram style (normal flow, KAV pushes above keyboard)
  storyBottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), paddingVertical: rs(12), gap: rs(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  storyLikeBtn: {
    alignItems: 'center', justifyContent: 'center', gap: rs(3), paddingHorizontal: rs(4),
  },
  storyActionCount: { fontFamily: DISPLAY, color: '#fff', fontSize: rs(12), fontWeight: 'bold', textAlign: 'center' },
  storyCommentRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: rs(24), borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: rs(14), paddingVertical: rs(2),
  },
  storyCommentInput: {
    flex: 1, fontFamily: DISPLAY, color: '#fff', fontSize: rs(14), paddingVertical: rs(9), paddingRight: rs(4),
  },
  storyCommentSend: { paddingLeft: rs(8), paddingVertical: rs(6) },

  // Bottom-sheet grab handle (shared by menu / share / comment sheets)
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },

  // Menu modal
  menuOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    paddingBottom: rs(32), overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: rs(14), paddingHorizontal: rs(20), paddingVertical: rs(14), borderBottomWidth: 1, borderBottomColor: C.border },
  menuItemIcon: { width: rs(34), height: rs(34), borderRadius: rs(11), alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontFamily: DISPLAY, fontSize: rs(14.5), fontWeight: '600', color: C.text },

  // Comment / share-to-chat sheet
  commentOverlay: { flex: 1, justifyContent: 'flex-end' },
  commentBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: T.scrim },
  commentSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: SCREEN_H * 0.72, paddingBottom: rs(16), overflow: 'hidden',
  },
  commentSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingHorizontal: rs(18), paddingVertical: rs(12), borderBottomWidth: 1, borderBottomColor: C.border },
  commentSheetHeaderIcon: { width: rs(30), height: rs(30), borderRadius: rs(10), backgroundColor: C.violetL, alignItems: 'center', justifyContent: 'center' },
  commentSheetTitle: { flex: 1, fontFamily: DISPLAY, fontSize: rs(15.5), fontWeight: 'bold', color: C.text },
  commentEmpty: { alignItems: 'center', paddingVertical: rs(32) },
  commentEmptyText: { fontFamily: DISPLAY, fontSize: rs(13.5), color: C.muted, marginTop: rs(8) },
  commentsList: { flexGrow: 0, maxHeight: SCREEN_H * 0.45, paddingHorizontal: rs(16), paddingTop: rs(8) },
  commentItem: { flexDirection: 'row', gap: rs(10), marginBottom: rs(14) },
  commentBody: { flex: 1 },
  commentAuthor: { fontFamily: DISPLAY, fontSize: rs(12.5), fontWeight: 'bold', color: C.text, marginBottom: rs(2) },
  commentText: { fontFamily: DISPLAY, fontSize: rs(13.5), color: C.text, lineHeight: rs(19) },
  commentTime: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted, marginTop: rs(3) },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(10), paddingHorizontal: rs(16), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: C.border, marginTop: rs(4) },
  commentTextInput: {
    flex: 1, backgroundColor: T.field, borderRadius: rs(14), paddingHorizontal: rs(14), paddingVertical: rs(10),
    fontFamily: DISPLAY, fontSize: rs(13.5), color: C.text, maxHeight: rs(80), borderWidth: 1, borderColor: C.border,
  },
  commentSendBtn: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  commentSendBtnDisabled: { backgroundColor: C.border },

  // Share to chat
  shareChatPreview: {
    marginHorizontal: rs(16), marginTop: rs(12), marginBottom: rs(12), padding: rs(12),
    backgroundColor: C.violetL, borderRadius: rs(12), borderLeftWidth: 3, borderLeftColor: C.violet,
  },
  shareChatPreviewName: { fontFamily: DISPLAY, fontSize: rs(12), fontWeight: 'bold', color: C.violet, marginBottom: rs(4) },
  shareChatPreviewContent: { fontFamily: DISPLAY, fontSize: rs(13), color: C.text, lineHeight: rs(18) },
  shareChatConvItem: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    paddingHorizontal: rs(16), paddingVertical: rs(12),
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  shareChatAvatar: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  shareChatAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: rs(16) },
  shareChatConvName: { fontFamily: DISPLAY, fontSize: rs(14), fontWeight: 'bold', color: C.text },
  shareChatConvOwner: { fontFamily: DISPLAY, fontSize: rs(12), color: C.muted, marginTop: rs(1) },

  // Share card generating overlay
  sharingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: T.scrim, zIndex: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  // SVG must be on-screen (not at -9999) for GPU rasterization
  svgCaptureContainer: {
    position: 'absolute', top: 0, left: 0, opacity: 0,
    width: 800, height: 480, overflow: 'hidden',
  },
  sharingSpinner: {
    backgroundColor: C.surface, borderRadius: rs(18), padding: rs(28),
    alignItems: 'center', gap: rs(12),
    ...cardShadow,
  },
  sharingText: { fontFamily: DISPLAY, fontSize: rs(13.5), fontWeight: '600', color: C.text },
});

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
  KeyboardAvoidingView,
} from 'react-native';
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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const G = {
  bg: '#F8FAFC', surface: '#FFFFFF', text: '#1E293B', muted: '#64748B',
  border: '#E2E8F0', violet: '#059669', violetL: '#ECFDF5',
  red: '#EF4444', redL: '#FEF2F2', green: '#059669', greenL: '#ECFDF5',
  orange: '#F97316', orangeL: '#FFF7ED', amber: '#D97706', amberL: '#FFFBEB',
  g950: '#011B14', g900: '#022C22', g800: '#064E3B', g600: '#059669',
};

const AVATAR_COLORS = ['#059669', '#DC2626', '#16A34A', '#F97316', '#0891B2', '#DB2777', '#D97706'];
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
  const accent1 = isSOS ? '#ef4444' : '#059669';
  const accent2 = isSOS ? '#f97316' : '#047857';
  const bgTint = isSOS ? '#fff7f7' : '#f0fdf4';
  const catBg = isSOS ? '#fee2e2' : '#d1fae5';
  const catColor = isSOS ? '#dc2626' : '#059669';

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
          onError={() => setImgErr(true)}
        />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{letter}</Text>
      )}
    </View>
  );
}

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
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(G.g950);
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
      <View style={[styles.catBadge, { backgroundColor: isSOS ? G.redL : G.violetL }]}>
        <Text style={[styles.catBadgeText, { color: isSOS ? G.red : G.violet }]}>
          {isSOS ? '🚨 SOS' : post.category?.name || 'General'}
        </Text>
      </View>
    );
  };

  const renderPost = ({ item }) => {
    const isSOS = item.category?.name?.toLowerCase() === 'sos' || item.type === 'sos';
    const isOwn = String(item.vendorId) === String(currentVendorId);
    const accentColor = isSOS ? G.red : G.green;
    const catBg = isSOS ? '#FEF2F2' : '#ECFDF5';
    const catText = isSOS ? G.red : G.green;

    return (
      <View style={styles.postCard}>
        {/* Colored left accent bar */}
        <View style={[styles.postAccentBar, { backgroundColor: accentColor }]} />

        <View style={styles.postInner}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <TouchableOpacity
              style={styles.postVendorRow}
              onPress={() => navigation.navigate('SocialProfileScreen', { vendorId: item.vendorId })}
              activeOpacity={0.75}
            >
              <AvatarCircle name={item.vendor?.businessName} logo={item.vendor?.logo} size={42} />
              <View style={styles.postVendorInfo}>
                <Text style={styles.postVendorName} numberOfLines={1}>
                  {item.vendor?.businessName || 'Unknown Vendor'}
                </Text>
                <Text style={styles.postMeta} numberOfLines={1}>
                  {item.vendor?.city ? `${item.vendor.city} · ` : ''}{formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.postHeaderRight}>
              <View style={[styles.catBadge, { backgroundColor: catBg }]}>
                {isSOS && <Icon name="alert-circle" size={10} color={catText} style={{ marginRight: 3 }} />}
                <Text style={[styles.catBadgeText, { color: catText }]}>
                  {isSOS ? 'SOS' : (item.category?.name || 'General')}
                </Text>
              </View>
              <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuPost(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="more-vertical" size={18} color={G.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.postContent}>{item.content}</Text>

          {/* Action bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={[styles.actionBtn, item.isLiked && styles.actionBtnLiked]} onPress={() => handleLike(item.id)}>
              <MCI name={item.isLiked ? 'heart' : 'heart-outline'} size={17} color={item.isLiked ? G.red : G.muted} />
              <Text style={[styles.actionLabel, item.isLiked && { color: G.red }]}>
                {item.likesCount > 0 ? item.likesCount : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
              <MCI name="comment-outline" size={17} color={G.muted} />
              <Text style={styles.actionLabel}>{item.commentsCount > 0 ? item.commentsCount : 'Comment'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, item.isSaved && styles.actionBtnSaved]} onPress={() => handleSave(item.id)}>
              <MCI name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={17} color={item.isSaved ? G.green : G.muted} />
              <Text style={[styles.actionLabel, item.isSaved && { color: G.green }]}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnShare} onPress={() => handleShareToChat(item)}>
              <Icon name="send" size={15} color={G.green} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnShare} onPress={() => handleShare(item)} disabled={sharingCard}>
              <Icon name="share-2" size={15} color={sharingCard ? G.border : G.muted} />
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
      <StatusBar barStyle="light-content" backgroundColor={G.g950} translucent={false} />
      {/* Header */}
      <LG colors={[G.g950, G.g900, G.g800]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Icon name="trending-up" size={18} color="#fff" />
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
          <Icon name="message-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </LG>

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.violet} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* SOS Strip — one circle per vendor */}
            {sosGroups.length > 0 && (
              <View style={styles.sosStrip}>
                <View style={styles.sosStripHeader}>
                  <View style={styles.sosStripIconWrap}>
                    <Icon name="alert-circle" size={14} color={G.red} />
                  </View>
                  <Text style={styles.sosStripLabel}>Urgent SOS</Text>
                  <Text style={styles.sosStripCount}>{sosPosts.length} post{sosPosts.length !== 1 ? 's' : ''}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sosScrollContent}>
                  {sosGroups.map((group, index) => (
                    <TouchableOpacity key={group.vendor?.id || index} style={styles.sosCircleWrap} onPress={() => openStory(index)} activeOpacity={0.8}>
                      <View style={styles.sosCircleBorder}>
                        <AvatarCircle name={group.vendor?.businessName} logo={group.vendor?.logo} size={52} />
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
                <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => switchTab(t)}>
                  <Icon name={t === 'feed' ? 'rss' : 'bookmark'} size={14} color={tab === t ? G.green : G.muted} />
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'feed' ? 'Feed' : 'Saved'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category chips — only for feed tab */}
            {tab === 'feed' && categories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
                <TouchableOpacity
                  style={[styles.chip, !activeCategoryId && styles.chipActive]}
                  onPress={() => setActiveCategoryId(null)}
                >
                  <Text style={[styles.chipText, !activeCategoryId && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, activeCategoryId === cat.id && styles.chipActive]}
                    onPress={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
                  >
                    <Text style={[styles.chipText, activeCategoryId === cat.id && styles.chipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={G.violet} style={{ margin: 24 }} />
          ) : hasMore && tab === 'feed' ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore}>
              {loadingMore
                ? <ActivityIndicator color={G.violet} size="small" />
                : <Text style={styles.loadMoreText}>Load more posts</Text>}
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Icon name={tab === 'saved' ? 'bookmark' : 'rss'} size={48} color={G.border} />
              <Text style={styles.emptyTitle}>{tab === 'saved' ? 'No saved posts' : 'No posts yet'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'saved' ? 'Bookmark posts to see them here.' : 'Be the first to post something!'}
              </Text>
            </View>
          ) : null
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
            <ActivityIndicator color={G.violet} size="large" />
            <Text style={styles.sharingText}>Generating card…</Text>
          </View>
        </View>
      )}

      {/* ── Floating New Post Button (tap or swipe-up) ─────────────────── */}
      <View style={styles.floatingNewPostBtn} {...fabPanResponder.panHandlers}>
        <Icon name="plus" size={26} color="#fff" />
      </View>

      {/* ── SOS Story Viewer Modal ─────────────────────────────────────── */}
      <Modal visible={storyVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setStoryVisible(false)}>
        <KeyboardAvoidingView style={styles.storyOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                      <Icon name="pause" size={40} color="rgba(255,255,255,0.7)" />
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
                          <AvatarCircle name={currentPost.vendor?.businessName} logo={currentPost.vendor?.logo} size={36} />
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
                        <Icon name="x" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.storyContent}>
                    <View style={styles.storySOSBadge}>
                      <Icon name="alert-circle" size={14} color="#fff" />
                      <Text style={styles.storySOSBadgeText}>SOS · URGENT</Text>
                    </View>
                    <Text style={styles.storyText}>{currentPost.content}</Text>
                    {currentPost.vendor?.city ? (
                      <View style={styles.storyLocationRow}>
                        <Icon name="map-pin" size={13} color="rgba(255,255,255,0.6)" />
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
                        : <Icon name="send" size={18} color="#fff" />}
                    </TouchableOpacity>
                  </View>

                  {/* Like button — second */}
                  <TouchableOpacity
                    style={styles.storyLikeBtn}
                    onPress={() => handleLike(currentPost.id)}
                  >
                    <MCI
                      name={currentPost.isLiked ? 'heart' : 'heart-outline'}
                      size={28}
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
            <View style={styles.menuHandle} />
            {menuPost && String(menuPost.vendorId) !== String(currentVendorId) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => handleFollow(menuPost.vendorId)}>
                <Icon name="user-plus" size={18} color={G.violet} />
                <Text style={styles.menuItemText}>Follow / Unfollow</Text>
              </TouchableOpacity>
            )}
            {menuPost && String(menuPost.vendorId) !== String(currentVendorId) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuPost(null);
                  navigation.navigate('SocialProfileScreen', { vendorId: menuPost.vendorId });
                }}
              >
                <Icon name="user" size={18} color={G.muted} />
                <Text style={styles.menuItemText}>View Profile</Text>
              </TouchableOpacity>
            )}
            {menuPost && String(menuPost.vendorId) === String(currentVendorId) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(menuPost.id)}>
                <Icon name="trash-2" size={18} color={G.red} />
                <Text style={[styles.menuItemText, { color: G.red }]}>Delete Post</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuPost(null)}>
              <Icon name="x" size={18} color={G.muted} />
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
            <View style={styles.commentSheetHandle} />
            <View style={styles.commentSheetHeader}>
              <Text style={styles.commentSheetTitle}>Share to Chat</Text>
              <TouchableOpacity onPress={() => setShareToChatPost(null)}>
                <Icon name="x" size={20} color={G.muted} />
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
              <ActivityIndicator color={G.violet} style={{ margin: 24 }} />
            ) : shareConversations.length === 0 ? (
              <View style={styles.commentEmpty}>
                <Icon name="message-circle" size={36} color={G.border} />
                <Text style={styles.commentEmptyText}>No conversations yet</Text>
                <Text style={[styles.commentEmptyText, { fontSize: 12, marginTop: 4 }]}>
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
                      <AvatarCircle name={vendor.businessName} logo={vendor.logo} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shareChatConvName} numberOfLines={1}>{vendor.businessName || 'Vendor'}</Text>
                        {vendor.ownerName && <Text style={styles.shareChatConvOwner} numberOfLines={1}>{vendor.ownerName}</Text>}
                      </View>
                      {isSending
                        ? <ActivityIndicator size="small" color={G.violet} />
                        : <Icon name="send" size={16} color={G.violet} />}
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
        <View style={styles.commentOverlay}>
          <TouchableOpacity style={styles.commentBackdrop} onPress={() => closeComments()} />
          <View style={styles.commentSheet}>
            <View style={styles.commentSheetHandle} />
            <View style={styles.commentSheetHeader}>
              <Text style={styles.commentSheetTitle}>Comments</Text>
              <TouchableOpacity onPress={() => closeComments()}>
                <Icon name="x" size={20} color={G.muted} />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={G.violet} style={{ margin: 24 }} />
            ) : comments.length === 0 ? (
              <View style={styles.commentEmpty}>
                <Icon name="message-circle" size={36} color={G.border} />
                <Text style={styles.commentEmptyText}>No comments yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <AvatarCircle name={c.vendor?.businessName || c.author?.businessName} logo={c.vendor?.logo || c.author?.logo} size={32} />
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
                placeholderTextColor={G.muted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, (!commentText.trim() || sendingComment) && styles.commentSendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || sendingComment}
              >
                {sendingComment
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="send" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: G.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  headerMsgBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },

  // SOS Strip
  sosStrip: {
    backgroundColor: G.surface, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: G.border, marginBottom: 4,
    borderLeftWidth: 3, borderLeftColor: G.red,
    marginHorizontal: 12, marginTop: 8, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  sosStripHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10, gap: 6 },
  sosStripIconWrap: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  sosStripLabel: { fontSize: 12, fontWeight: '700', color: G.red, flex: 1 },
  sosStripCount: { fontSize: 11, color: G.muted, fontWeight: '500' },
  sosScrollContent: { paddingHorizontal: 10, gap: 12 },
  sosCircleWrap: { alignItems: 'center', width: 62 },
  sosCircleBorder: { padding: 2.5, borderRadius: 32, borderWidth: 2.5, borderColor: G.red, marginBottom: 5 },
  sosCircleName: { fontSize: 10, color: G.text, fontWeight: '600', textAlign: 'center' },
  sosPostCountBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: G.red, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: G.surface,
  },
  sosPostCountText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  // Floating New Post button
  floatingNewPostBtn: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: G.g950,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 6, elevation: 8,
    zIndex: 50,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row', backgroundColor: G.surface,
    borderBottomWidth: 1, borderBottomColor: G.border,
    marginTop: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: G.green },
  tabText: { fontSize: 14, fontWeight: '600', color: G.muted },
  tabTextActive: { color: G.green },

  // Category chips
  chipsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: G.surface, borderWidth: 1, borderColor: G.border,
  },
  chipActive: { backgroundColor: G.greenL, borderColor: G.green },
  chipText: { fontSize: 13, fontWeight: '600', color: G.muted },
  chipTextActive: { color: G.green },

  // Post card
  listContent: { paddingBottom: 100 },
  postCard: {
    backgroundColor: G.surface, marginHorizontal: 12, marginVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: G.border, overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  postAccentBar: { width: 4 },
  postInner: { flex: 1, padding: 14 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  postVendorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  postVendorInfo: { flex: 1 },
  postVendorName: { fontSize: 14, fontWeight: '700', color: G.text },
  postMeta: { fontSize: 11, color: G.muted, marginTop: 2 },
  postHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  menuBtn: { padding: 2 },
  catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  catBadgeText: { fontSize: 10, fontWeight: '700' },
  postContent: { fontSize: 14, color: G.text, lineHeight: 22, marginBottom: 14 },
  actionBar: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: G.border, paddingTop: 10, gap: 6 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
    backgroundColor: G.bg, flex: 1, justifyContent: 'center',
  },
  actionBtnLiked: { backgroundColor: '#FEF2F2' },
  actionBtnSaved: { backgroundColor: G.greenL },
  actionBtnShare: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: G.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, color: G.muted, fontWeight: '600' },
  actionCount: { fontSize: 12, color: G.muted, fontWeight: '600' },

  // Load more / empty
  loadMoreBtn: { margin: 16, padding: 12, alignItems: 'center', backgroundColor: G.violetL, borderRadius: 10 },
  loadMoreText: { color: G.violet, fontWeight: '700', fontSize: 13 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: G.text, marginTop: 12, marginBottom: 6 },
  emptyText: { fontSize: 14, color: G.muted, textAlign: 'center', lineHeight: 20 },

  // Story overlay
  storyOverlay: { flex: 1, backgroundColor: '#000' },
  storyTapZones: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', zIndex: 5 },
  storyTapLeft: { flex: 1 },
  storyTapRight: { flex: 1 },

  // Story top bar
  storyTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    paddingTop: 52, paddingHorizontal: 10, paddingBottom: 8,
  },
  progressBarRow: { flexDirection: 'row', gap: 3, marginBottom: 12 },
  progressSegment: {
    flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  storyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storySenderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  storyAvatarBorder: { borderRadius: 22, borderWidth: 2, borderColor: G.red, padding: 2 },
  storyHeaderInfo: { flex: 1 },
  storyVendorName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  storyMeta: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  storyCloseBtn: { padding: 6, zIndex: 30 },

  // Story content
  storyContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 140, paddingBottom: 20 },
  storySOSBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: G.red, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginBottom: 20,
  },
  storySOSBadgeText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  storyText: { fontSize: 22, color: '#fff', lineHeight: 34, fontWeight: '500' },
  storyLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  storyLocationText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  // Story pause overlay
  storyPausedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15,
    alignItems: 'center', justifyContent: 'center',
  },

  storyBottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, zIndex: 19,
  },

  // Story bottom bar — Instagram style (normal flow, KAV pushes above keyboard)
  storyBottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  storyLikeBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4,
  },
  storyActionCount: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  storyCommentRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 14, paddingVertical: 2,
  },
  storyCommentInput: {
    flex: 1, color: '#fff', fontSize: 14, paddingVertical: 9, paddingRight: 4,
  },
  storyCommentSend: { paddingLeft: 8, paddingVertical: 6 },

  // Menu modal
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: G.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  menuHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: G.border, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: G.border },
  menuItemText: { fontSize: 15, fontWeight: '600', color: G.text },

  // Comment modal
  commentOverlay: { flex: 1, justifyContent: 'flex-end' },
  commentBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  commentSheet: { backgroundColor: G.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: SCREEN_H * 0.72, paddingBottom: 16 },
  commentSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: G.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  commentSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: G.border },
  commentSheetTitle: { fontSize: 16, fontWeight: '700', color: G.text },
  commentEmpty: { alignItems: 'center', paddingVertical: 32 },
  commentEmptyText: { fontSize: 14, color: G.muted, marginTop: 8 },
  commentsList: { flexGrow: 0, maxHeight: SCREEN_H * 0.45, paddingHorizontal: 16, paddingTop: 8 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: G.text, marginBottom: 2 },
  commentText: { fontSize: 14, color: G.text, lineHeight: 19 },
  commentTime: { fontSize: 11, color: G.muted, marginTop: 3 },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: G.border, marginTop: 4 },
  commentTextInput: {
    flex: 1, backgroundColor: G.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: G.text, maxHeight: 80, borderWidth: 1, borderColor: G.border,
  },
  commentSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: G.green, alignItems: 'center', justifyContent: 'center' },
  commentSendBtnDisabled: { backgroundColor: G.border },

  // Share to chat
  shareChatPreview: {
    marginHorizontal: 16, marginBottom: 12, padding: 12,
    backgroundColor: G.violetL, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: G.violet,
  },
  shareChatPreviewName: { fontSize: 12, fontWeight: '700', color: G.violet, marginBottom: 4 },
  shareChatPreviewContent: { fontSize: 13, color: G.text, lineHeight: 18 },
  shareChatConvItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: G.border,
  },
  shareChatAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareChatAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  shareChatConvName: { fontSize: 14, fontWeight: '700', color: G.text },
  shareChatConvOwner: { fontSize: 12, color: G.muted, marginTop: 1 },

  // Share card generating overlay
  sharingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  // SVG must be on-screen (not at -9999) for GPU rasterization
  svgCaptureContainer: {
    position: 'absolute', top: 0, left: 0, opacity: 0,
    width: 800, height: 480, overflow: 'hidden',
  },
  sharingSpinner: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  sharingText: { fontSize: 14, fontWeight: '600', color: G.text },
});

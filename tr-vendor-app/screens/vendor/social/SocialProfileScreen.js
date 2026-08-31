import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Dimensions,
  Image, StatusBar, Platform, Modal, Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSocialProfile, toggleLike, toggleSave, toggleFollow, getOrCreateConversation,
} from '../../api/socialApi';
import { getFullImageURL } from '../../api/client';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Same key names this screen already used everywhere below — only the values
// now come from the shared "Elevate" theme instead of hardcoded hex, mirroring
// the mapping convention used in CreatePostScreen.js.
const C = {
  g950: T.forestDark, g900: T.forest, g800: T.emeraldDeep, g700: T.emerald700,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald, g100: T.emerald50, g50: T.emerald50,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  red: T.red, redL: T.redLight,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  purple: T.plum, purpleL: T.tintPlum,
  orange: T.orange, orangeL: T.orangeL,
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

function AvatarCircle({ name, logo, size = 40 }) {
  const [imgErr, setImgErr] = useState(false);
  const letter = name?.charAt(0)?.toUpperCase() || '?';
  const bg = getAvatarColor(name);
  const [uri, setUri] = useState(null);
  useEffect(() => {
    if (logo) getFullImageURL(logo).then(setUri);
    else setUri(null);
  }, [logo]);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {logo && uri && !imgErr
        ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" onError={() => setImgErr(true)} />
        : <Text style={{ color: '#fff', fontFamily: DISPLAY, fontWeight: '800', fontSize: size * 0.38 }}>{letter}</Text>}
    </View>
  );
}

const STORY_DURATION = 15000;

// ── Story Progress Bar ──────────────────────────────────────────────────
function StoryProgressBar({ count, current, storyKey, paused }) {
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const currentValRef = useRef(0);
  const remainingRef = useRef(STORY_DURATION);

  useEffect(() => {
    const id = progress.addListener(({ value }) => { currentValRef.current = value; });
    return () => progress.removeListener(id);
  }, []);

  useEffect(() => {
    if (animRef.current) animRef.current.stop();
    progress.setValue(0);
    currentValRef.current = 0;
    remainingRef.current = STORY_DURATION;
    animRef.current = Animated.timing(progress, { toValue: 1, duration: STORY_DURATION, useNativeDriver: false });
    animRef.current.start();
    return () => { if (animRef.current) animRef.current.stop(); };
  }, [storyKey]);

  useEffect(() => {
    if (paused) {
      if (animRef.current) animRef.current.stop();
      remainingRef.current = STORY_DURATION * (1 - currentValRef.current);
    } else {
      if (animRef.current) animRef.current.stop();
      animRef.current = Animated.timing(progress, { toValue: 1, duration: remainingRef.current, useNativeDriver: false });
      animRef.current.start();
    }
  }, [paused]);

  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={sst.seg}>
          {i < current
            ? <View style={[sst.fill, { width: '100%' }]} />
            : i === current
              ? <Animated.View style={[sst.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              : null}
        </View>
      ))}
    </View>
  );
}

const sst = StyleSheet.create({
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
});

const FUEL_ICONS = { petrol: 'droplet', diesel: 'droplet', electric: 'zap', hybrid: 'battery-charging', cng: 'wind' };
const FLEET_COLORS = [
  { color: C.g700, bg: C.g50 },
  { color: C.blue, bg: C.blueL },
  { color: C.amber, bg: C.amberL },
  { color: C.purple, bg: C.purpleL },
  { color: C.orange, bg: C.orangeL },
];

export default function SocialProfileScreen({ route, navigation }) {
  const { vendorId } = route.params || {};
  const insets = useSafeAreaInsets();
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('posts');
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // SOS story viewer
  const [storyVisible, setStoryVisible] = useState(false);
  const [storyIdx, setStoryIdx] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);
  const storyTimerRef = useRef(null);
  const storyTimerStartRef = useRef(null);
  const storyRemainingRef = useRef(STORY_DURATION);

  useEffect(() => {
    AsyncStorage.getItem('vendor_id').then((id) => setCurrentVendorId(id));
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!vendorId) return;
    try {
      const res = await getSocialProfile(vendorId);
      const data = res?.data || res;
      setProfile(data?.vendor || data?.profile || data);
      setPosts(data?.posts || []);
      setFleet(data?.fleet || data?.vehicles || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(C.g950);
  }, []));

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const isOwnProfile = String(vendorId) === String(currentVendorId);
  const sosPosts = posts.filter((p) => p.category?.name?.toLowerCase() === 'sos' || p.type === 'sos');

  // ── Story timer ───────────────────────────────────────────────────────
  const advanceStory = useCallback(() => {
    if (storyIdx < sosPosts.length - 1) setStoryIdx((i) => i + 1);
    else setStoryVisible(false);
  }, [storyIdx, sosPosts.length]);

  useEffect(() => {
    if (!storyVisible || storyPaused) return;
    clearTimeout(storyTimerRef.current);
    storyRemainingRef.current = STORY_DURATION;
    storyTimerStartRef.current = Date.now();
    storyTimerRef.current = setTimeout(advanceStory, STORY_DURATION);
    return () => clearTimeout(storyTimerRef.current);
  }, [storyVisible, storyIdx]);

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

  const openSosStory = () => {
    if (!sosPosts.length) return;
    setStoryIdx(0);
    setStoryPaused(false);
    storyRemainingRef.current = STORY_DURATION;
    setStoryVisible(true);
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await toggleFollow(vendorId);
      setProfile((prev) => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? (prev.followersCount || 1) - 1 : (prev.followersCount || 0) + 1,
      } : prev);
    } catch {
      Alert.alert('Error', 'Could not update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    setMessagingLoading(true);
    try {
      const res = await getOrCreateConversation(vendorId);
      const convId = res?.data?.conversationId || res?.conversationId || res?.data?.conversation?.id || res?.data?.id;
      navigation.navigate('SocialChatScreen', { conversationId: convId, otherVendor: profile });
    } catch {
      Alert.alert('Error', 'Could not open conversation.');
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? (p.likesCount || 1) - 1 : (p.likesCount || 0) + 1 }
        : p
    ));
    try { await toggleLike(postId); } catch {}
  };

  const handleSave = async (postId) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
    try { await toggleSave(postId); } catch {}
  };

  // ── Post card ─────────────────────────────────────────────────────────
  const renderPost = ({ item }) => {
    const isSOS = item.category?.name?.toLowerCase() === 'sos' || item.type === 'sos';
    const accent = isSOS ? C.red : C.g600;
    return (
      <View style={st.postCard}>
        <View style={[st.postAccent, { backgroundColor: accent }]} />
        <View style={st.postBody}>
          <View style={st.postHeader}>
            <View style={[st.catPill, { backgroundColor: isSOS ? C.redL : C.g50 }]}>
              {isSOS && <Icon name="alert-circle" size={10} color={C.red} style={{ marginRight: 3 }} />}
              <Text style={[st.catPillText, { color: isSOS ? C.red : C.g600 }]}>
                {isSOS ? 'SOS' : (item.category?.name || 'General')}
              </Text>
            </View>
            <Text style={st.postTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
          <Text style={st.postContent}>{item.content}</Text>
          <View style={st.postFooter}>
            <TouchableOpacity style={st.postAction} onPress={() => handleLike(item.id)}>
              <MCI name={item.isLiked ? 'heart' : 'heart-outline'} size={16} color={item.isLiked ? C.red : C.muted} />
              <Text style={[st.postActionText, item.isLiked && { color: C.red }]}>
                {item.likesCount > 0 ? item.likesCount : 'Like'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.postAction} onPress={() => handleSave(item.id)}>
              <MCI name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={16} color={item.isSaved ? C.g600 : C.muted} />
              <Text style={[st.postActionText, item.isSaved && { color: C.g600 }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.postAction}>
              <MCI name="comment-outline" size={16} color={C.muted} />
              <Text style={st.postActionText}>{item.commentsCount > 0 ? item.commentsCount : 'Comment'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ── Fleet card ────────────────────────────────────────────────────────
  const renderFleetCard = ({ item, index }) => {
    const brandName = item.vehicle_models?.brands?.name || item.brands?.name || '';
    const modelName = item.vehicle_models?.name || item.chauffeur_vehicle_categories?.name || 'Vehicle';
    const vehicleName = brandName ? `${brandName} ${modelName}` : modelName;
    const fuelType = item.vehicle_models?.fuelType || item.fuelType || '';
    const year = item.year || item.modelYear || '';
    const regNo = item.registrationNumber || '';
    const clr = FLEET_COLORS[index % FLEET_COLORS.length];
    return (
      <View style={st.fleetCard}>
        <View style={[st.fleetIconBox, { backgroundColor: clr.bg }]}>
          <MCI name="car-side" size={22} color={clr.color} />
        </View>
        <Text style={st.fleetName} numberOfLines={2}>{vehicleName}</Text>
        {(fuelType || year) ? (
          <View style={st.fleetMeta}>
            {fuelType ? (
              <View style={st.fleetMetaItem}>
                <Icon name={FUEL_ICONS[fuelType?.toLowerCase()] || 'droplet'} size={10} color={C.muted} />
                <Text style={st.fleetMetaText}>{fuelType}</Text>
              </View>
            ) : null}
            {year ? (
              <View style={st.fleetMetaItem}>
                <Icon name="calendar" size={10} color={C.muted} />
                <Text style={st.fleetMetaText}>{year}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {regNo ? (
          <View style={st.fleetRegPill}>
            <Text style={st.fleetRegText}>{regNo}</Text>
          </View>
        ) : null}
        {item.status ? (
          <View style={[st.fleetStatusPill, item.status === 'active' ? st.fleetStatusActive : st.fleetStatusInactive]}>
            <View style={[st.fleetStatusDot, { backgroundColor: item.status === 'active' ? C.g600 : C.muted }]} />
            <Text style={[st.fleetStatusText, { color: item.status === 'active' ? C.g600 : C.muted }]}>
              {item.status}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={st.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g950} translucent={false} />
        <LinearGradient colors={G.hero} style={[st.loadingHero, { paddingTop: insets.top + rs(10) }]}>
          <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />
          <TouchableOpacity style={st.backBtnGlass} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={st.loadingBody}>
          <ActivityIndicator color={C.g600} size="large" />
          <Text style={st.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  // ── Header component ──────────────────────────────────────────────────
  const Header = () => (
    <>
      {/* Hero gradient */}
      <LinearGradient colors={G.hero} style={[st.hero, { paddingTop: insets.top + rs(10) }]}>
        <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />

        {/* Top bar */}
        <View style={st.topBar}>
          <TouchableOpacity style={st.backBtnGlass} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={st.topBarTitle} numberOfLines={1}>Profile</Text>
          <View style={st.topBarSpacer} />
        </View>

        {/* Avatar + name inside gradient */}
        <View style={st.heroContent}>
          <TouchableOpacity
            style={st.avatarRing}
            onPress={isOwnProfile && sosPosts.length > 0 ? openSosStory : undefined}
            activeOpacity={isOwnProfile && sosPosts.length > 0 ? 0.8 : 1}
          >
            <AvatarCircle name={profile?.businessName} logo={profile?.logo} size={rs(68)} />
            {isOwnProfile && sosPosts.length > 0 && (
              <View style={st.sosRingDot} />
            )}
          </TouchableOpacity>
          <View style={st.heroInfo}>
            <Text style={st.heroName} numberOfLines={1}>{profile?.businessName || 'Vendor'}</Text>
            {profile?.ownerName ? <Text style={st.heroOwner} numberOfLines={1}>{profile.ownerName}</Text> : null}
            {profile?.city ? (
              <View style={st.heroLocationPill}>
                <Icon name="map-pin" size={10} color="#fff" />
                <Text style={st.heroLocationText} numberOfLines={1}>{profile.city}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action buttons (non-own profile) */}
        {!isOwnProfile && (
          <View style={st.heroActions}>
            <TouchableOpacity
              style={[st.followBtn, profile?.isFollowing && st.followBtnActive]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={profile?.isFollowing ? C.g600 : '#fff'} />
                : <>
                    <Icon name={profile?.isFollowing ? 'user-check' : 'user-plus'} size={14} color={profile?.isFollowing ? C.g600 : '#fff'} />
                    <Text style={[st.followBtnText, profile?.isFollowing && st.followBtnTextActive]}>
                      {profile?.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </>}
            </TouchableOpacity>
            <TouchableOpacity style={st.msgBtn} onPress={handleMessage} disabled={messagingLoading} activeOpacity={0.85}>
              {messagingLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Icon name="message-circle" size={14} color="#fff" />
                    <Text style={st.msgBtnText}>Message</Text>
                  </>}
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Floating stats card — overlaps the hero */}
      <View style={st.statsRow}>
        {[
          { icon: 'post-outline', value: posts.length, label: 'Posts', color: C.g700, bg: C.g50 },
          { icon: 'account-multiple-outline', value: profile?.followersCount ?? 0, label: 'Followers', color: C.blue, bg: C.blueL },
          { icon: 'account-check-outline', value: profile?.followingCount ?? 0, label: 'Following', color: C.purple, bg: C.purpleL },
          { icon: 'car-multiple', value: fleet.length, label: 'Fleet', color: C.amber, bg: C.amberL },
        ].map((s, i) => (
          <View key={s.label} style={[st.statCell, i > 0 && st.statCellDivider]}>
            <View style={[st.statIconBox, { backgroundColor: s.bg }]}>
              <MCI name={s.icon} size={16} color={s.color} />
            </View>
            <Text style={st.statValue}>{s.value}</Text>
            <Text style={st.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Bio (if any) */}
      {profile?.bio ? (
        <View style={st.bioCard}>
          <View style={st.bioHeader}>
            <View style={st.bioIconBox}>
              <Icon name="info" size={12} color={C.g700} />
            </View>
            <Text style={st.bioLabel}>ABOUT</Text>
          </View>
          <Text style={st.bioText}>{profile.bio}</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View style={st.tabsRow}>
        {[
          { key: 'posts', icon: 'view-grid-outline', label: 'Posts', count: posts.length },
          { key: 'fleet', icon: 'car-multiple', label: 'Fleet', count: fleet.length },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[st.tab, tab === t.key && st.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.85}
          >
            <MCI name={t.icon} size={15} color={tab === t.key ? '#fff' : C.muted} />
            <Text style={[st.tabText, tab === t.key && st.tabTextActive]}>{t.label} ({t.count})</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <View style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} translucent={false} />
      <FlatList
        data={tab === 'posts' ? posts : fleet}
        keyExtractor={(item) => String(item.id)}
        renderItem={tab === 'posts' ? renderPost : renderFleetCard}
        numColumns={tab === 'fleet' ? 2 : 1}
        key={tab}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tab === 'fleet' ? st.fleetGrid : st.list}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          <View style={st.emptyWrap}>
            <View style={st.emptyIconBox}>
              <MCI name={tab === 'fleet' ? 'car-multiple' : 'post-outline'} size={32} color={C.g600} />
            </View>
            <Text style={st.emptyTitle}>No {tab === 'fleet' ? 'fleet' : 'posts'} yet</Text>
          </View>
        }
      />

      {/* ── SOS Story Viewer ──────────────────────────────────────────── */}
      {(() => {
        const post = sosPosts[storyIdx];
        return (
          <Modal visible={storyVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setStoryVisible(false)}>
            <View style={st.storyBg}>
              {post && (
                <>
                  {/* Tap zones — left = prev, right = next/close */}
                  <View style={st.storyTaps} pointerEvents="box-none">
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => storyIdx > 0 ? setStoryIdx((i) => i - 1) : null}
                      onLongPress={() => setStoryPaused(true)}
                      onPressOut={() => setStoryPaused(false)}
                      activeOpacity={1} delayLongPress={150}
                    />
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => storyIdx < sosPosts.length - 1 ? setStoryIdx((i) => i + 1) : setStoryVisible(false)}
                      onLongPress={() => setStoryPaused(true)}
                      onPressOut={() => setStoryPaused(false)}
                      activeOpacity={1} delayLongPress={150}
                    />
                  </View>

                  {/* Pause icon */}
                  {storyPaused && (
                    <View style={st.storyPauseIcon} pointerEvents="none">
                      <Icon name="pause" size={44} color="rgba(255,255,255,0.7)" />
                    </View>
                  )}

                  {/* Top bar: progress + header */}
                  <View style={[st.storyTopBar, { paddingTop: insets.top + rs(10) }]}>
                    <StoryProgressBar
                      count={sosPosts.length}
                      current={storyIdx}
                      storyKey={String(storyIdx)}
                      paused={storyPaused}
                    />
                    <View style={st.storyHeaderRow}>
                      <View style={st.storySender}>
                        <View style={st.storyAvatarRing}>
                          <AvatarCircle name={profile?.businessName} logo={profile?.logo} size={36} />
                        </View>
                        <View>
                          <Text style={st.storyVendorName} numberOfLines={1}>{profile?.businessName || 'My SOS'}</Text>
                          <Text style={st.storyMeta}>
                            {formatTimeAgo(post.createdAt)}
                            {sosPosts.length > 1 ? `  ·  ${storyIdx + 1}/${sosPosts.length}` : ''}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => setStoryVisible(false)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                        <Icon name="x" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={st.storyContent}>
                    <View style={st.storySOSBadge}>
                      <Icon name="alert-circle" size={14} color="#fff" />
                      <Text style={st.storySOSText}>SOS · URGENT</Text>
                    </View>
                    <Text style={st.storyText}>{post.content}</Text>
                    {profile?.city ? (
                      <View style={st.storyCity}>
                        <Icon name="map-pin" size={13} color="rgba(255,255,255,0.55)" />
                        <Text style={st.storyCityText}>{profile.city}</Text>
                      </View>
                    ) : null}
                    <View style={st.storyStats}>
                      <View style={st.storyStat}>
                        <MCI name="heart" size={15} color="rgba(255,255,255,0.75)" />
                        <Text style={st.storyStatText}>{post.likesCount || 0} likes</Text>
                      </View>
                      <View style={st.storyStat}>
                        <MCI name="comment-outline" size={15} color="rgba(255,255,255,0.75)" />
                        <Text style={st.storyStatText}>{post.commentsCount || 0} comments</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom gradient */}
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={st.storyGrad} pointerEvents="none" />
                </>
              )}
            </View>
          </Modal>
        );
      })()}
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Loading
  loadingHero: { paddingHorizontal: rs(16), paddingBottom: rs(20), borderBottomLeftRadius: rs(28), borderBottomRightRadius: rs(28), overflow: 'hidden' },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12) },
  loadingText: { fontFamily: DISPLAY, fontSize: rs(14), color: C.muted, fontWeight: '600' },

  // Ambient orbs
  orbA: {
    position: 'absolute', top: -rs(46), right: -rs(32), width: rs(175), height: rs(175),
    borderRadius: rs(88), backgroundColor: 'rgba(228,192,102,0.10)',
  },
  orbB: {
    position: 'absolute', bottom: rs(10), left: -rs(40), width: rs(145), height: rs(145),
    borderRadius: rs(73), backgroundColor: 'rgba(23,166,124,0.14)',
  },

  // Glass back button
  backBtnGlass: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: { paddingHorizontal: rs(16), paddingBottom: rs(20), borderBottomLeftRadius: rs(28), borderBottomRightRadius: rs(28), overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(18) },
  topBarTitle: {
    fontFamily: DISPLAY, flex: 1, fontSize: rs(17), fontWeight: 'bold',
    color: '#fff', textAlign: 'left', marginLeft: rs(10),
  },
  topBarSpacer: { width: rs(36) },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: rs(14), marginBottom: rs(16) },
  avatarRing: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: rs(40), padding: 2,
  },
  heroInfo: { flex: 1 },
  heroName: { fontFamily: DISPLAY, fontSize: rs(19), fontWeight: 'bold', color: '#fff', marginBottom: rs(2) },
  heroOwner: { fontFamily: DISPLAY, fontSize: rs(12.5), color: 'rgba(255,255,255,0.7)', marginBottom: rs(6), fontWeight: '600' },
  heroLocationPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4), alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderRadius: rs(999),
  },
  heroLocationText: { fontFamily: DISPLAY, fontSize: rs(10.5), color: '#fff', fontWeight: '700' },

  // Action buttons
  heroActions: { flexDirection: 'row', gap: rs(10) },
  followBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    backgroundColor: C.g600, paddingVertical: rs(11), borderRadius: rs(12),
  },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  followBtnText: { fontFamily: DISPLAY, color: '#fff', fontWeight: 'bold', fontSize: rs(13) },
  followBtnTextActive: { color: '#fff' },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: rs(11), borderRadius: rs(12),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  msgBtnText: { fontFamily: DISPLAY, color: '#fff', fontWeight: 'bold', fontSize: rs(13) },

  // Floating stats card — overlaps the hero via negative margin
  statsRow: {
    flexDirection: 'row', backgroundColor: C.card,
    marginHorizontal: rs(14), marginTop: -rs(18), zIndex: 2,
    borderRadius: rs(16), paddingVertical: rs(13),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statCell: { flex: 1, alignItems: 'center', gap: rs(3) },
  statCellDivider: { borderLeftWidth: 1, borderLeftColor: C.border },
  statIconBox: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(2),
  },
  statValue: { fontFamily: DISPLAY, fontSize: rs(16), fontWeight: 'bold', color: C.text },
  statLabel: { fontFamily: DISPLAY, fontSize: rs(9.5), color: C.muted, fontWeight: '700', letterSpacing: 0.3 },

  // Bio
  bioCard: {
    backgroundColor: C.card, marginHorizontal: rs(14), marginTop: rs(12),
    borderRadius: rs(16), padding: rs(14),
    borderWidth: 1, borderColor: C.border,
  },
  bioHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(8) },
  bioIconBox: { width: rs(22), height: rs(22), borderRadius: rs(7), backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  bioLabel: { fontFamily: DISPLAY, fontSize: rs(9.5), color: C.g700, fontWeight: 'bold', letterSpacing: 0.8 },
  bioText: { fontFamily: DISPLAY, fontSize: rs(13.5), color: C.text, lineHeight: rs(20), fontWeight: '500' },

  // Tabs
  tabsRow: {
    flexDirection: 'row', gap: rs(6), backgroundColor: C.card,
    marginHorizontal: rs(14), marginTop: rs(12), marginBottom: rs(6),
    borderRadius: rs(14), padding: rs(5), borderWidth: 1, borderColor: C.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: rs(10), borderRadius: rs(10),
  },
  tabActive: { backgroundColor: C.g600 },
  tabText: { fontFamily: DISPLAY, fontSize: rs(12.5), fontWeight: 'bold', color: C.muted },
  tabTextActive: { color: '#fff' },

  // Post card
  list: { paddingBottom: rs(100) },
  postCard: {
    flexDirection: 'row', backgroundColor: C.card,
    marginHorizontal: rs(14), marginVertical: rs(5),
    borderRadius: rs(16), borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  postAccent: { width: rs(4) },
  postBody: { flex: 1, padding: rs(14) },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(9) },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(9), paddingVertical: rs(3), borderRadius: rs(8) },
  catPillText: { fontFamily: DISPLAY, fontSize: rs(10), fontWeight: 'bold' },
  postTime: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted, fontWeight: '600' },
  postContent: { fontFamily: DISPLAY, fontSize: rs(14), color: C.text, lineHeight: rs(21), marginBottom: rs(11), fontWeight: '500' },
  postFooter: { flexDirection: 'row', gap: rs(16), borderTopWidth: 1, borderTopColor: C.border, paddingTop: rs(10) },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  postActionText: { fontFamily: DISPLAY, fontSize: rs(12), color: C.muted, fontWeight: '600' },

  // Fleet grid
  fleetGrid: { paddingBottom: rs(100) },
  fleetCard: {
    flex: 1, margin: rs(5), backgroundColor: C.card, borderRadius: rs(16), padding: rs(15),
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
    ...cardShadow,
  },
  fleetIconBox: {
    width: rs(50), height: rs(50), borderRadius: rs(14), alignItems: 'center', justifyContent: 'center', marginBottom: rs(10),
  },
  fleetName: { fontFamily: DISPLAY, fontSize: rs(13), fontWeight: 'bold', color: C.text, textAlign: 'center', marginBottom: rs(6) },
  fleetMeta: { gap: rs(3), alignItems: 'center' },
  fleetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  fleetMetaText: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted, fontWeight: '600' },
  fleetRegPill: {
    marginTop: rs(7), backgroundColor: C.blueL,
    paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6),
  },
  fleetRegText: { fontFamily: DISPLAY, fontSize: rs(11), color: C.blue, fontWeight: 'bold' },
  fleetStatusPill: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(6), paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6) },
  fleetStatusActive: { backgroundColor: C.g50 },
  fleetStatusInactive: { backgroundColor: C.bg },
  fleetStatusDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  fleetStatusText: { fontFamily: DISPLAY, fontSize: rs(10), fontWeight: 'bold', textTransform: 'capitalize' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: rs(52) },
  emptyIconBox: {
    width: rs(68), height: rs(68), borderRadius: rs(34), backgroundColor: C.g50,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(12),
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rs(15), fontWeight: 'bold', color: C.muted },

  // SOS ring indicator on avatar
  sosRingDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: C.red,
    borderWidth: 2, borderColor: C.g900,
  },

  // Story viewer
  storyBg: { flex: 1, backgroundColor: '#000' },
  storyTaps: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row', zIndex: 5,
  },
  storyPauseIcon: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  storyTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    paddingHorizontal: rs(12), paddingBottom: rs(10),
  },
  storyHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: rs(12),
  },
  storySender: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 },
  storyAvatarRing: { borderRadius: rs(22), borderWidth: 2, borderColor: C.red, padding: 2 },
  storyVendorName: { fontFamily: DISPLAY, fontSize: rs(15), fontWeight: 'bold', color: '#fff' },
  storyMeta: { fontFamily: DISPLAY, fontSize: rs(11), color: 'rgba(255,255,255,0.6)', marginTop: rs(1), fontWeight: '600' },
  storyContent: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
    justifyContent: 'center', paddingHorizontal: rs(24), paddingTop: rs(130), paddingBottom: rs(40),
  },
  storySOSBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6), alignSelf: 'flex-start',
    backgroundColor: C.red, paddingHorizontal: rs(12), paddingVertical: rs(5),
    borderRadius: rs(20), marginBottom: rs(18),
  },
  storySOSText: { fontFamily: DISPLAY, color: '#fff', fontWeight: 'bold', fontSize: rs(11), letterSpacing: 1 },
  storyText: { fontFamily: DISPLAY, fontSize: rs(22), color: '#fff', lineHeight: rs(34), fontWeight: '600' },
  storyCity: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginTop: rs(16) },
  storyCityText: { fontFamily: DISPLAY, fontSize: rs(13), color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  storyStats: {
    flexDirection: 'row', gap: rs(18), marginTop: rs(22),
    paddingTop: rs(14), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  storyStat: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  storyStatText: { fontFamily: DISPLAY, color: 'rgba(255,255,255,0.75)', fontSize: rs(13), fontWeight: '600' },
  storyGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: rs(120), zIndex: 1,
  },
});

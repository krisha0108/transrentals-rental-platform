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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const C = {
  g950: '#011B14', g900: '#022C22', g800: '#064E3B', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0',
  text: '#1E293B', sub: '#475569', muted: '#64748B',
  red: '#EF4444', redL: '#FEF2F2',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
};

const AVATAR_COLORS = ['#059669','#DC2626','#16A34A','#F97316','#0891B2','#DB2777','#D97706'];
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
        ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setImgErr(true)} />
        : <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{letter}</Text>}
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
  { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#EA580C', bg: '#FFF7ED' },
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
        <LinearGradient colors={[C.g950, C.g900, C.g800]} style={[st.loadingHero, { paddingTop: insets.top + 10 }]}>
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
      <LinearGradient colors={[C.g950, C.g900, C.g800]} style={[st.hero, { paddingTop: insets.top + 10 }]}>
        {/* Back button */}
        <TouchableOpacity style={st.backBtnGlass} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Avatar + name inside gradient */}
        <View style={st.heroContent}>
          <TouchableOpacity
            style={st.avatarRing}
            onPress={isOwnProfile && sosPosts.length > 0 ? openSosStory : undefined}
            activeOpacity={isOwnProfile && sosPosts.length > 0 ? 0.8 : 1}
          >
            <AvatarCircle name={profile?.businessName} logo={profile?.logo} size={72} />
            {isOwnProfile && sosPosts.length > 0 && (
              <View style={st.sosRingDot} />
            )}
          </TouchableOpacity>
          <View style={st.heroInfo}>
            <Text style={st.heroName} numberOfLines={1}>{profile?.businessName || 'Vendor'}</Text>
            {profile?.ownerName ? <Text style={st.heroOwner} numberOfLines={1}>{profile.ownerName}</Text> : null}
            {profile?.city ? (
              <View style={st.heroLocation}>
                <Icon name="map-pin" size={12} color="rgba(255,255,255,0.55)" />
                <Text style={st.heroLocationText}>{profile.city}</Text>
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
            <TouchableOpacity style={st.msgBtn} onPress={handleMessage} disabled={messagingLoading}>
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

      {/* Bio (if any) */}
      {profile?.bio ? (
        <View style={st.bioCard}>
          <Text style={st.bioText}>{profile.bio}</Text>
        </View>
      ) : null}

      {/* Stats row */}
      <View style={st.statsRow}>
        {[
          { icon: 'post-outline', value: posts.length, label: 'Posts', color: C.g700, bg: C.g50 },
          { icon: 'account-multiple-outline', value: profile?.followersCount ?? 0, label: 'Followers', color: C.blue, bg: C.blueL },
          { icon: 'account-check-outline', value: profile?.followingCount ?? 0, label: 'Following', color: '#7C3AED', bg: '#F5F3FF' },
          { icon: 'car-multiple', value: fleet.length, label: 'Fleet', color: C.amber, bg: C.amberL },
        ].map((s, i) => (
          <View key={s.label} style={st.statCell}>
            <View style={[st.statIconBox, { backgroundColor: s.bg }]}>
              <MCI name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={st.statValue}>{s.value}</Text>
            <Text style={st.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={st.tabsRow}>
        {[
          { key: 'posts', icon: 'view-grid-outline', label: 'Posts' },
          { key: 'fleet', icon: 'car-multiple', label: 'Fleet' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[st.tab, tab === t.key && st.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <MCI name={t.icon} size={16} color={tab === t.key ? C.g600 : C.muted} />
            <Text style={[st.tabText, tab === t.key && st.tabTextActive]}>{t.label}</Text>
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
              <MCI name={tab === 'fleet' ? 'car-multiple' : 'post-outline'} size={32} color={C.muted} />
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
                  <View style={[st.storyTopBar, { paddingTop: insets.top + 10 }]}>
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
  loadingHero: { paddingHorizontal: 16, paddingBottom: 20 },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.muted },

  // Glass back button
  backBtnGlass: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },

  // Hero
  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarRing: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 40, padding: 2,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroOwner: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocationText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },

  // Action buttons
  heroActions: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.g600, paddingVertical: 10, borderRadius: 12,
  },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  followBtnTextActive: { color: '#fff' },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  msgBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Bio
  bioCard: {
    backgroundColor: C.card, marginHorizontal: 12, marginTop: 10,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  bioText: { fontSize: 14, color: C.text, lineHeight: 21 },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: C.card,
    marginHorizontal: 12, marginTop: 10, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  statCell: {
    flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4,
    borderRightWidth: 1, borderRightColor: C.border,
  },
  statIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },

  // Tabs
  tabsRow: {
    flexDirection: 'row', backgroundColor: C.card,
    marginHorizontal: 12, marginTop: 10, marginBottom: 6,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13,
  },
  tabActive: { backgroundColor: C.g50, borderBottomWidth: 2.5, borderBottomColor: C.g600 },
  tabText: { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.g600 },

  // Post card
  list: { paddingBottom: 100 },
  postCard: {
    flexDirection: 'row', backgroundColor: C.card,
    marginHorizontal: 12, marginVertical: 4,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  postAccent: { width: 4 },
  postBody: { flex: 1, padding: 13 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catPillText: { fontSize: 10, fontWeight: '700' },
  postTime: { fontSize: 11, color: C.muted },
  postContent: { fontSize: 14, color: C.text, lineHeight: 21, marginBottom: 10 },
  postFooter: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 9 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postActionText: { fontSize: 12, color: C.muted, fontWeight: '500' },

  // Fleet grid
  fleetGrid: { paddingBottom: 100 },
  fleetCard: {
    flex: 1, margin: 4, backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  fleetIconBox: {
    width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  fleetName: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 6 },
  fleetMeta: { gap: 3, alignItems: 'center' },
  fleetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fleetMetaText: { fontSize: 11, color: C.muted },
  fleetRegPill: {
    marginTop: 7, backgroundColor: '#EFF6FF',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  fleetRegText: { fontSize: 11, color: C.blue, fontWeight: '700' },
  fleetStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  fleetStatusActive: { backgroundColor: C.g50 },
  fleetStatusInactive: { backgroundColor: C.bg },
  fleetStatusDot: { width: 6, height: 6, borderRadius: 3 },
  fleetStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 52 },
  emptyIconBox: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.muted },

  // SOS ring indicator on avatar
  sosRingDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8, backgroundColor: C.red,
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
    paddingHorizontal: 12, paddingBottom: 10,
  },
  storyHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 12,
  },
  storySender: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  storyAvatarRing: { borderRadius: 22, borderWidth: 2, borderColor: C.red, padding: 2 },
  storyVendorName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  storyMeta: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  storyContent: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
    justifyContent: 'center', paddingHorizontal: 24, paddingTop: 130, paddingBottom: 40,
  },
  storySOSBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: C.red, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginBottom: 18,
  },
  storySOSText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  storyText: { fontSize: 22, color: '#fff', lineHeight: 34, fontWeight: '500' },
  storyCity: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  storyCityText: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  storyStats: {
    flexDirection: 'row', gap: 18, marginTop: 22,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  storyStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storyStatText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  storyGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, zIndex: 1,
  },
});

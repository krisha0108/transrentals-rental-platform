import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSocialProfile,
  toggleLike,
  toggleSave,
  toggleFollow,
  getOrCreateConversation,
} from '../../api/socialApi';

const { width: SCREEN_W } = Dimensions.get('window');

const G = {
  bg: '#F5F7FA', surface: '#FFFFFF', text: '#0A0F1E', muted: '#6B7280',
  border: '#E8EDF2', violet: '#7C3AED', violetL: '#F5F3FF',
  red: '#DC2626', redL: '#FEF2F2', green: '#16A34A', greenL: '#F0FDF4',
  orange: '#F97316', orangeL: '#FFF7ED', amber: '#D97706', amberL: '#FFFBEB',
};

const AVATAR_COLORS = ['#7C3AED', '#DC2626', '#16A34A', '#F97316', '#0891B2', '#DB2777', '#D97706'];
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const COVER_GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#DC2626', '#9333EA'], ['#16A34A', '#0891B2'],
  ['#F97316', '#D97706'], ['#DB2777', '#7C3AED'],
];

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

function AvatarCircle({ name, size = 40, style }) {
  const letter = name?.charAt(0)?.toUpperCase() || '?';
  const bg = getAvatarColor(name);
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{letter}</Text>
    </View>
  );
}

const FUEL_ICONS = { petrol: 'droplet', diesel: 'droplet', electric: 'zap', hybrid: 'battery-charging', cng: 'wind' };

export default function SocialProfileScreen({ route, navigation }) {
  const { vendorId } = route.params || {};
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('posts');
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
      console.log('[SocialProfile] error', e);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await toggleFollow(vendorId);
      setProfile((prev) => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? (prev.followersCount || 1) - 1 : (prev.followersCount || 0) + 1,
      } : prev);
    } catch (e) {
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
      // API returns { conversationId: '...' }
      const convId = res?.data?.conversationId || res?.conversationId || res?.data?.conversation?.id || res?.data?.id;
      navigation.navigate('SocialChatScreen', {
        conversationId: convId,
        otherVendor: profile,
      });
    } catch (e) {
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
    try { await toggleLike(postId); } catch (e) {}
  };

  const handleSave = async (postId) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
    try { await toggleSave(postId); } catch (e) {}
  };

  const isOwnProfile = String(vendorId) === String(currentVendorId);

  const coverColorPair = COVER_GRADIENTS[(profile?.businessName?.charCodeAt(0) || 0) % COVER_GRADIENTS.length];

  const StatItem = ({ value, label }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderPost = ({ item }) => {
    const isSOS = item.category?.name?.toLowerCase() === 'sos' || item.type === 'sos';
    return (
      <View style={[styles.postCard, isSOS && styles.postCardSOS]}>
        <View style={styles.postTopRow}>
          {item.category && (
            <View style={[styles.catBadge, { backgroundColor: isSOS ? G.redL : G.violetL }]}>
              <Text style={[styles.catBadgeText, { color: isSOS ? G.red : G.violet }]}>
                {isSOS ? '🚨 SOS' : item.category.name}
              </Text>
            </View>
          )}
          <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
            <Icon name="heart" size={16} color={item.isLiked ? G.red : G.muted} />
            {item.likesCount > 0 && <Text style={[styles.actionCount, item.isLiked && { color: G.red }]}>{item.likesCount}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(item.id)}>
            <Icon name="bookmark" size={16} color={item.isSaved ? G.violet : G.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="message-circle" size={16} color={G.muted} />
            {item.commentsCount > 0 && <Text style={styles.actionCount}>{item.commentsCount}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFleetCard = ({ item, index }) => {
    const brandName = item.vehicle_models?.brands?.name || item.brands?.name || '';
    const modelName = item.vehicle_models?.name || item.chauffeur_vehicle_categories?.name || 'Vehicle';
    const vehicleName = brandName ? `${brandName} ${modelName}` : modelName;
    const fuelType = item.vehicle_models?.fuelType || item.fuelType || '';
    const year = item.year || item.modelYear || '';
    const regNo = item.registrationNumber || '';

    return (
      <View style={styles.fleetCard}>
        <View style={[styles.fleetCardIcon, { backgroundColor: COVER_GRADIENTS[index % COVER_GRADIENTS.length][0] + '20' }]}>
          <Icon name="truck" size={22} color={COVER_GRADIENTS[index % COVER_GRADIENTS.length][0]} />
        </View>
        <Text style={styles.fleetVehicleName} numberOfLines={2}>{vehicleName}</Text>
        <View style={styles.fleetDetails}>
          {fuelType ? (
            <View style={styles.fleetDetailRow}>
              <Icon name={FUEL_ICONS[fuelType?.toLowerCase()] || 'droplet'} size={11} color={G.muted} />
              <Text style={styles.fleetDetailText}>{fuelType}</Text>
            </View>
          ) : null}
          {year ? (
            <View style={styles.fleetDetailRow}>
              <Icon name="calendar" size={11} color={G.muted} />
              <Text style={styles.fleetDetailText}>{year}</Text>
            </View>
          ) : null}
        </View>
        {regNo ? <Text style={styles.fleetRegNo}>{regNo}</Text> : null}
        {item.status && (
          <View style={[styles.fleetStatusBadge, item.status === 'active' ? styles.fleetStatusActive : styles.fleetStatusInactive]}>
            <Text style={[styles.fleetStatusText, item.status === 'active' ? { color: G.green } : { color: G.muted }]}>
              {item.status}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={G.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={G.violet} size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={tab === 'posts' ? posts : fleet}
        keyExtractor={(item) => item.id}
        renderItem={tab === 'posts' ? renderPost : renderFleetCard}
        numColumns={tab === 'fleet' ? 2 : 1}
        key={tab} // force re-render on tab switch to handle numColumns change
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.violet} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tab === 'fleet' ? styles.fleetGrid : styles.listContent}
        ListHeaderComponent={
          <>
            {/* Back button */}
            <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Cover */}
            <View style={[styles.cover, { backgroundColor: coverColorPair[0] }]}>
              <View style={[styles.coverOverlay, { backgroundColor: coverColorPair[1] + '55' }]} />
            </View>

            {/* Profile info */}
            <View style={styles.profileSection}>
              <View style={styles.avatarRow}>
                <AvatarCircle name={profile?.businessName} size={72} style={styles.profileAvatar} />
                {!isOwnProfile && (
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={[styles.followBtn, profile?.isFollowing && styles.followBtnActive]}
                      onPress={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading
                        ? <ActivityIndicator size="small" color={profile?.isFollowing ? G.violet : '#fff'} />
                        : <>
                            <Icon name={profile?.isFollowing ? 'user-check' : 'user-plus'} size={14} color={profile?.isFollowing ? G.violet : '#fff'} />
                            <Text style={[styles.followBtnText, profile?.isFollowing && styles.followBtnTextActive]}>
                              {profile?.isFollowing ? 'Following' : 'Follow'}
                            </Text>
                          </>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} disabled={messagingLoading}>
                      {messagingLoading
                        ? <ActivityIndicator size="small" color={G.violet} />
                        : <>
                            <Icon name="message-circle" size={14} color={G.violet} />
                            <Text style={styles.messageBtnText}>Message</Text>
                          </>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.businessName}>{profile?.businessName || 'Vendor'}</Text>
              {profile?.ownerName && <Text style={styles.ownerName}>{profile.ownerName}</Text>}
              {profile?.city && (
                <View style={styles.locationRow}>
                  <Icon name="map-pin" size={13} color={G.muted} />
                  <Text style={styles.locationText}>{profile.city}</Text>
                </View>
              )}
              {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

              {/* Stats */}
              <View style={styles.statsRow}>
                <StatItem value={posts.length} label="Posts" />
                <View style={styles.statDivider} />
                <StatItem value={profile?.followersCount} label="Followers" />
                <View style={styles.statDivider} />
                <StatItem value={profile?.followingCount} label="Following" />
                <View style={styles.statDivider} />
                <StatItem value={fleet.length} label="Fleets" />
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              {['posts', 'fleet'].map((t) => (
                <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                  <Icon name={t === 'posts' ? 'grid' : 'truck'} size={14} color={tab === t ? G.violet : G.muted} />
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'posts' ? 'Posts' : 'Fleet'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name={tab === 'fleet' ? 'truck' : 'grid'} size={44} color={G.border} />
            <Text style={styles.emptyTitle}>No {tab === 'fleet' ? 'fleet' : 'posts'} yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: G.bg },
  loadingHeader: { padding: 16 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: G.muted, fontSize: 14, marginTop: 12 },
  backBtn: { padding: 8 },
  backBtnAbsolute: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Cover
  cover: { height: 140, width: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject },

  // Profile section
  profileSection: { backgroundColor: G.surface, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: G.border },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 10 },
  profileAvatar: { borderWidth: 3, borderColor: G.surface },
  profileActions: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: G.violet, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  followBtnActive: { backgroundColor: G.violetL, borderWidth: 1, borderColor: G.violet },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  followBtnTextActive: { color: G.violet },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: G.violetL, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: G.violet,
  },
  messageBtnText: { color: G.violet, fontWeight: '700', fontSize: 13 },
  businessName: { fontSize: 20, fontWeight: '800', color: G.text, marginBottom: 2 },
  ownerName: { fontSize: 14, color: G.muted, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  locationText: { fontSize: 13, color: G.muted },
  bio: { fontSize: 14, color: G.text, lineHeight: 20, marginBottom: 10 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: G.bg,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: G.border, marginTop: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: G.text },
  statLabel: { fontSize: 11, color: G.muted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: G.border },

  // Tabs
  tabsRow: { flexDirection: 'row', backgroundColor: G.surface, borderBottomWidth: 1, borderBottomColor: G.border },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: G.violet },
  tabText: { fontSize: 14, fontWeight: '600', color: G.muted },
  tabTextActive: { color: G.violet },

  // Post list
  listContent: { paddingBottom: 100 },
  postCard: {
    backgroundColor: G.surface, marginHorizontal: 12, marginVertical: 5,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: G.border,
  },
  postCardSOS: { borderLeftWidth: 4, borderLeftColor: G.red },
  postTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: '700' },
  postTime: { fontSize: 11, color: G.muted },
  postContent: { fontSize: 14, color: G.text, lineHeight: 21, marginBottom: 10 },
  postActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: G.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 12, color: G.muted, fontWeight: '600' },

  // Fleet grid
  fleetGrid: { paddingBottom: 100 },
  fleetCard: {
    flex: 1, margin: 6, backgroundColor: G.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: G.border, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  fleetCardIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  fleetVehicleName: { fontSize: 13, fontWeight: '700', color: G.text, textAlign: 'center', marginBottom: 6 },
  fleetDetails: { gap: 3, alignItems: 'center' },
  fleetDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fleetDetailText: { fontSize: 11, color: G.muted },
  fleetRegNo: { fontSize: 11, color: '#2563EB', fontWeight: '600', marginTop: 6 },
  fleetStatusBadge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  fleetStatusActive: { backgroundColor: G.greenL },
  fleetStatusInactive: { backgroundColor: G.bg },
  fleetStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: G.muted, marginTop: 10 },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getConversations } from '../../api/socialApi';
import { getFullImageURL } from '../../api/client';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex,
// mirroring the mapping convention CreatePostScreen.js just used. Renamed
// from `G` to `C` so it doesn't collide with the theme's `G` gradients export.
const C = {
  g950: T.forestDark, g900: T.forest, g800: T.emeraldDeep,
  bg: T.bg, surface: T.card, text: T.ink, muted: T.subText,
  border: T.border, violet: T.emerald600, violetL: T.tintEmerald,
  red: T.red, redL: T.redLight, green: T.emerald600, greenL: T.tintEmerald,
  orange: T.orange, orangeL: T.orangeL, amber: T.amber, amberL: T.tintGold,
  g600: T.emerald600,
};

const AVATAR_COLORS = [T.emerald600, T.red, T.ocean, T.orange, T.plum, T.rose, T.gold];
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const parseLastMessage = (lastMessage) => {
  if (!lastMessage) return 'No messages yet';
  // API returns lastMessage as {content, createdAt, isMine} object
  const content = typeof lastMessage === 'object' ? lastMessage.content : lastMessage;
  if (!content) return 'No messages yet';
  try {
    const parsed = JSON.parse(content);
    if (parsed?.__type === 'post_card') return '📌 Shared a post';
  } catch {}
  return content;
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function AvatarCircle({ name, logo, size = 44 }) {
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
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {logo && uri && !imgErr ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size * 0.32 }}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{letter}</Text>
      )}
    </View>
  );
}

export default function SocialMessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const pollRef = useRef(null);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getConversations();
      setConversations(res?.data?.conversations || res?.conversations || []);
    } catch (e) {
      console.log('[SocialMessages] error', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(() => fetchConversations(true), 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = c.other?.businessName?.toLowerCase() || '';
    const owner = c.other?.ownerName?.toLowerCase() || '';
    return name.includes(q) || owner.includes(q);
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const renderConversation = ({ item }) => {
    const vendor = item.other || {};
    const isUnread = (item.unreadCount || 0) > 0;
    const preview = parseLastMessage(item.lastMessage);

    return (
      <TouchableOpacity
        style={[styles.convItem, isUnread && styles.convItemUnread]}
        onPress={() => navigation.navigate('SocialChatScreen', {
          conversationId: item.id,
          otherVendor: vendor,
        })}
        activeOpacity={0.75}
      >
        <View style={styles.avatarWrap}>
          <AvatarCircle name={vendor.businessName} logo={vendor.logo} size={50} />
          {isUnread && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadDotText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.convContent}>
          <View style={styles.convRow}>
            <Text style={[styles.convName, isUnread && styles.convNameUnread]} numberOfLines={1}>
              {vendor.businessName || 'Vendor'}
            </Text>
            <Text style={[styles.convTime, isUnread && styles.convTimeUnread]}>
              {formatTime(item.lastMessageAt || item.updatedAt)}
            </Text>
          </View>
          {vendor.ownerName && (
            <Text style={styles.convOwner} numberOfLines={1}>{vendor.ownerName}</Text>
          )}
          <Text style={[styles.convPreview, isUnread && styles.convPreviewUnread]} numberOfLines={1}>
            {preview}
          </Text>
        </View>

        <Icon name="chevron-right" size={16} color={isUnread ? C.violet : C.border} />
      </TouchableOpacity>
    );
  };

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(C.g950);
  }, []));

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} translucent={false} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={G.hero} style={styles.hero}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <View style={[styles.heroSafe, { paddingTop: insets.top + rs(10) }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>DIRECT MESSAGES</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>Messages</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
              </Text>
            </View>
            {totalUnread > 0 && (
              <View style={styles.totalUnreadBadge}>
                <Text style={styles.totalUnreadText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { setSearchOpen(v => !v); if (searchOpen) setSearch(''); }}
            >
              <Icon name={searchOpen ? 'x' : 'search'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {searchOpen && (
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={C.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="x-circle" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
          )}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.convItem}>
              <View style={styles.avatarWrap}>
                <Bone w={50} h={50} r={25} />
              </View>
              <View style={styles.convContent}>
                <View style={styles.convRow}>
                  <Bone w={120} h={13} />
                  <Bone w={40} h={10} />
                </View>
                <Bone w={90} h={11} style={{ marginTop: 6 }} />
                <Bone w={160} h={11} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCircle}>
            <Icon name="message-circle" size={44} color={C.violet} />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? 'No Results' : 'No Messages Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {search
              ? 'Try a different vendor name'
              : 'Visit a vendor profile and tap "Message" to start a conversation.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.violet} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(32) },

  // Hero header
  hero: { borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24), overflow: 'hidden' },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  heroSafe: { paddingHorizontal: rs(16), paddingBottom: rs(16) },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerEyebrow: {
    fontFamily: DISPLAY, fontSize: rs(9.5), fontWeight: 'bold', color: T.gold,
    letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: rs(19), fontWeight: 'bold', color: '#fff',
    letterSpacing: 0.2, marginTop: rs(2), includeFontPadding: false,
  },
  headerSub: { fontFamily: DISPLAY, fontSize: rs(11.5), color: 'rgba(255,255,255,0.8)', marginTop: rs(2), fontWeight: '600', includeFontPadding: false },
  totalUnreadBadge: {
    minWidth: rs(26), height: rs(26), borderRadius: rs(13), backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(6),
  },
  totalUnreadText: { fontFamily: DISPLAY, color: C.g900, fontSize: rs(11.5), fontWeight: 'bold' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: '#fff', marginTop: rs(14),
    paddingHorizontal: rs(14), height: rs(44),
    borderRadius: rs(14),
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: rs(14), color: C.text, padding: 0 },

  // List
  listContent: { paddingHorizontal: rs(14), paddingTop: rs(12), paddingBottom: rs(100) },

  // Conversation item
  convItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: rs(16), padding: rs(12), marginBottom: rs(8),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  convItemUnread: { backgroundColor: C.violetL, borderColor: C.green },
  avatarWrap: { position: 'relative', marginRight: rs(12) },
  unreadDot: {
    position: 'absolute', top: -rs(3), right: -rs(3),
    minWidth: rs(18), height: rs(18), borderRadius: rs(9), backgroundColor: C.violet,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(4),
    borderWidth: 2, borderColor: C.surface,
  },
  unreadDotText: { fontFamily: DISPLAY, fontSize: rs(9), fontWeight: 'bold', color: '#fff', includeFontPadding: false },
  convContent: { flex: 1, marginRight: rs(6) },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(1) },
  convName: { fontFamily: DISPLAY, fontSize: rs(14.5), fontWeight: 'bold', color: C.text, flex: 1, marginRight: rs(6), includeFontPadding: false },
  convNameUnread: { fontWeight: 'bold' },
  convTime: { fontFamily: DISPLAY, fontSize: rs(10.5), color: C.muted, fontWeight: '600', includeFontPadding: false },
  convTimeUnread: { color: C.violet, fontWeight: 'bold' },
  convOwner: { fontFamily: DISPLAY, fontSize: rs(11.5), color: C.muted, marginBottom: rs(2), fontWeight: '500' },
  convPreview: { fontFamily: DISPLAY, fontSize: rs(12.5), color: C.muted },
  convPreviewUnread: { color: C.text, fontWeight: 'bold' },

  // Empty
  emptyCircle: {
    width: rs(88), height: rs(88), borderRadius: rs(44), backgroundColor: C.violetL,
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(14),
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rs(18), fontWeight: 'bold', color: C.text, marginBottom: rs(6) },
  emptyText: { fontFamily: DISPLAY, fontSize: rs(13.5), color: C.muted, textAlign: 'center', lineHeight: rs(20), fontWeight: '500' },
});

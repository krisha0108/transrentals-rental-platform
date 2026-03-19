import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
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

const G = {
  bg: '#F8FAFC', surface: '#FFFFFF', text: '#1E293B', muted: '#64748B',
  border: '#E2E8F0', violet: '#059669', violetL: '#ECFDF5',
  red: '#EF4444', redL: '#FEF2F2', green: '#059669', greenL: '#ECFDF5',
  orange: '#F97316', orangeL: '#FFF7ED', amber: '#D97706', amberL: '#FFFBEB',
  g950: '#011B14', g900: '#022C22', g800: '#064E3B', g600: '#059669',
};

const AVATAR_COLORS = ['#059669', '#DC2626', '#16A34A', '#F97316', '#0891B2', '#DB2777', '#D97706'];
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
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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

export default function SocialMessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
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

        <Icon name="chevron-right" size={16} color={isUnread ? G.violet : G.border} />
      </TouchableOpacity>
    );
  };

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(G.g950);
  }, []));

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={G.g950} translucent={false} />
      {/* Header */}
      <LinearGradient colors={[G.g950, G.g900, G.g800]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSub}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
          </Text>
        </View>
        {totalUnread > 0 && (
          <View style={styles.totalUnreadBadge}>
            <Text style={styles.totalUnreadText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={G.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={G.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="x-circle" size={16} color={G.muted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={G.violet} size="large" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCircle}>
            <Icon name="message-circle" size={44} color={G.violet} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.violet} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: G.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { color: G.muted, fontSize: 14, marginTop: 10 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  totalUnreadBadge: {
    minWidth: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  totalUnreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: G.surface, marginHorizontal: 12, marginVertical: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: G.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: G.text, padding: 0 },

  // List
  listContent: { paddingHorizontal: 12, paddingBottom: 100 },

  // Conversation item
  convItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: G.surface,
    borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: G.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  convItemUnread: { backgroundColor: G.violetL, borderColor: '#6EE7B7', borderLeftWidth: 3, borderLeftColor: G.green },
  avatarWrap: { position: 'relative', marginRight: 12 },
  unreadDot: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: G.violet,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: G.surface,
  },
  unreadDotText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  convContent: { flex: 1, marginRight: 6 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 },
  convName: { fontSize: 15, fontWeight: '600', color: G.text, flex: 1, marginRight: 6 },
  convNameUnread: { fontWeight: '700' },
  convTime: { fontSize: 11, color: G.muted },
  convTimeUnread: { color: G.violet, fontWeight: '600' },
  convOwner: { fontSize: 12, color: G.muted, marginBottom: 2 },
  convPreview: { fontSize: 13, color: G.muted },
  convPreviewUnread: { color: G.text, fontWeight: '500' },

  // Empty
  emptyCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: G.violetL,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: G.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: G.muted, textAlign: 'center', lineHeight: 20 },
});

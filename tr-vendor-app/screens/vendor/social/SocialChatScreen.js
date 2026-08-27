import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessages, sendMessage } from '../../api/socialApi';
import { getFullImageURL } from '../../api/client';
import { SC as T, G, rs } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex,
// mirroring the mapping convention used in CreatePostScreen.js. Renamed from
// the original local `G` to `C` so it doesn't collide with the theme's `G`
// gradients export.
const C = {
  bg: T.bg, surface: T.card, text: T.ink, muted: T.subText,
  border: T.border, violet: T.emerald600, violetL: T.tintEmerald,
  red: T.red, redL: T.redLight, green: T.emerald600, greenL: T.tintEmerald,
  sentBg: T.tintEmerald, receivedBg: T.card,
  g950: T.forestDark, g900: T.forest, g800: T.emeraldDeep, g600: T.emerald600,
};

const AVATAR_COLORS = [T.emerald600, T.red, T.ocean, T.gold, T.oceanLight, T.rose, T.orange];
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today - msgDay) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
};

const isSameDateDay = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

function AvatarCircle({ name, logo, size = 36 }) {
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
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <Text style={{ fontFamily: DISPLAY, color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{letter}</Text>
      )}
    </View>
  );
}

// ── Post Card Message ─────────────────────────────────────────────────
function PostCardMessage({ data, isSent }) {
  const headerBg = isSent ? C.violet : C.g900;
  return (
    <View style={[styles.postCardMsg, { borderColor: headerBg + '40' }]}>
      <View style={[styles.postCardMsgHeader, { backgroundColor: headerBg }]}>
        <Text style={styles.postCardMsgVendor} numberOfLines={1}>
          {data.vendorName || 'Vendor'}
        </Text>
        {data.category && (
          <View style={styles.postCardMsgCat}>
            <Text style={styles.postCardMsgCatText}>{data.category}</Text>
          </View>
        )}
      </View>
      <Text style={styles.postCardMsgContent}>{data.content}</Text>
      <Text style={styles.postCardMsgFooter}>📌 Shared post</Text>
    </View>
  );
}

export default function SocialChatScreen({ route, navigation }) {
  const { conversationId, otherVendor } = route.params || {};
  const insets = useSafeAreaInsets();
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const pollRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('vendor_id').then((id) => setCurrentVendorId(id));
  }, []);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoading(true);
    try {
      const res = await getMessages(conversationId);
      const newMessages = res?.data?.messages || res?.messages || [];
      setMessages(newMessages);
      if (newMessages.length > 0) {
        const latestId = newMessages[newMessages.length - 1]?.id;
        if (!silent || latestId !== lastMessageIdRef.current) {
          lastMessageIdRef.current = latestId;
        }
      }
    } catch (e) {
      console.log('[SocialChat] fetch error', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setInputText('');

    // Optimistic update
    const optimisticId = `opt_${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      content: text,
      senderId: currentVendorId,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      readAt: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    setSending(true);
    try {
      const res = await sendMessage(conversationId, text);
      const sent = res?.data?.message || res?.message;
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? (sent || { ...m, isOptimistic: false }) : m));
    } catch (e) {
      Alert.alert('Error', 'Failed to send message.');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Build display list with date separators
  const displayItems = React.useMemo(() => {
    const items = [];
    messages.forEach((msg, i) => {
      const prev = messages[i - 1];
      if (!prev || !isSameDateDay(prev.createdAt, msg.createdAt)) {
        items.push({ type: 'dateSep', id: `sep_${msg.id}`, date: msg.createdAt });
      }
      items.push({ type: 'message', ...msg });
    });
    return items;
  }, [messages]);

  const parseContent = (content) => {
    const str = typeof content === 'string' ? content : String(content ?? '');
    try {
      const parsed = JSON.parse(str);
      if (parsed?.__type === 'post_card') return { isPostCard: true, data: parsed };
    } catch {}
    return { isPostCard: false, text: str };
  };

  const renderItem = ({ item }) => {
    if (item.type === 'dateSep') {
      return (
        <View style={styles.dateSepRow}>
          <View style={styles.dateSepLine} />
          <View style={styles.dateSepPill}>
            <Text style={styles.dateSepText}>{formatDateLabel(item.date)}</Text>
          </View>
          <View style={styles.dateSepLine} />
        </View>
      );
    }

    const isSent = String(item.senderId) === String(currentVendorId);
    const parsed = parseContent(item.content);
    const isRead = !!(item.isRead || item.readAt);
    const isOptimistic = !!item.isOptimistic;

    // Sent bubbles get a decorative gradient fill; received bubbles stay a
    // plain surface. Only the wrapper component is swapped — everything
    // inside it, including the meta row, is rendered exactly once.
    const BubbleWrapper = isSent ? LinearGradient : View;
    const bubbleWrapperProps = isSent
      ? { colors: [C.violet, C.g800], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
      : {};

    return (
      <View style={[styles.msgRow, isSent ? styles.msgRowSent : styles.msgRowReceived]}>
        {!isSent && <AvatarCircle name={otherVendor?.businessName} logo={otherVendor?.logo} size={28} />}
        <BubbleWrapper
          {...bubbleWrapperProps}
          style={[styles.msgBubble, isSent ? styles.msgBubbleSent : styles.msgBubbleReceived, isOptimistic && styles.msgBubbleOptimistic]}
        >
          {parsed.isPostCard ? (
            <PostCardMessage data={parsed.data} isSent={isSent} />
          ) : (
            <Text style={[styles.msgText, isSent && styles.msgTextSent]}>{parsed.text}</Text>
          )}
          <View style={styles.msgMeta}>
            <Text style={[styles.msgTime, isSent && styles.msgTimeSent]}>{formatTime(item.createdAt)}</Text>
            {isSent && (
              <Text style={[styles.msgRead, isRead && styles.msgReadDone]}>
                {isRead ? '✓✓' : isOptimistic ? '○' : '✓'}
              </Text>
            )}
          </View>
        </BubbleWrapper>
      </View>
    );
  };

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(C.g950);
  }, []));

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} translucent={false} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <LinearGradient colors={G.hero} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <AnimatedOrb style={styles.orbA} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerAvatarRing}>
              <AvatarCircle name={otherVendor?.businessName} logo={otherVendor?.logo} size={38} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>{otherVendor?.businessName || 'Vendor'}</Text>
              {otherVendor?.city && <Text style={styles.headerSub}>{otherVendor.city}</Text>}
            </View>
            <TouchableOpacity
              style={styles.headerProfileBtn}
              onPress={() => navigation.navigate('SocialProfileScreen', { vendorId: otherVendor?.id })}
            >
              <Icon name="user" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Messages */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.violet} size="large" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <View style={styles.emptyChatAvatarRing}>
                  <AvatarCircle name={otherVendor?.businessName} logo={otherVendor?.logo} size={64} />
                </View>
                <Text style={styles.emptyChatTitle}>{otherVendor?.businessName || 'Vendor'}</Text>
                <Text style={styles.emptyChatText}>Say hello! Start the conversation.</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={C.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxHeight={100}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={styles.sendBtnWrap}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={(!inputText.trim() || sending) ? [C.border, C.border] : [C.violet, C.g800]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.sendBtn}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Icon name="send" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: DISPLAY, color: C.muted, fontSize: rs(14), marginTop: rs(10), fontWeight: '600' },

  // Hero header
  hero: { borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24), overflow: 'hidden' },
  orbA: {
    position: 'absolute', top: -rs(50), right: -rs(34), width: rs(165), height: rs(165), borderRadius: rs(83),
    backgroundColor: 'rgba(228,192,102,0.10)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(40), left: -rs(38), width: rs(135), height: rs(135), borderRadius: rs(68),
    backgroundColor: 'rgba(23,166,124,0.14)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(12), paddingVertical: rs(12), paddingBottom: rs(16), gap: rs(10),
  },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarRing: {
    borderRadius: rs(23), padding: rs(2), borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontFamily: DISPLAY, fontSize: rs(16), fontWeight: 'bold', color: '#fff', includeFontPadding: false },
  headerSub: { fontFamily: DISPLAY, fontSize: rs(12), color: 'rgba(255,255,255,0.75)', marginTop: rs(2), fontWeight: '600', includeFontPadding: false },
  headerProfileBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Messages list
  msgList: { padding: rs(12), paddingBottom: rs(8) },

  // Date separator
  dateSepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: rs(12), gap: rs(8) },
  dateSepLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateSepPill: {
    paddingHorizontal: rs(11), paddingVertical: rs(4), borderRadius: rs(999),
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  dateSepText: { fontFamily: DISPLAY, fontSize: rs(9.5), color: C.muted, fontWeight: 'bold', letterSpacing: 0.5, textTransform: 'uppercase', includeFontPadding: false },

  // Message row
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: rs(6), gap: rs(6) },
  msgRowSent: { justifyContent: 'flex-end' },
  msgRowReceived: { justifyContent: 'flex-start' },
  msgBubble: {
    maxWidth: '78%', borderRadius: rs(18), paddingHorizontal: rs(13), paddingVertical: rs(9),
    shadowColor: T.shadow, shadowOffset: { width: 0, height: rs(2) }, shadowOpacity: 0.06, shadowRadius: rs(5), elevation: 1,
  },
  msgBubbleSent: { borderBottomRightRadius: rs(6) },
  msgBubbleReceived: { backgroundColor: C.receivedBg, borderBottomLeftRadius: rs(6), borderWidth: 1, borderColor: C.border },
  msgBubbleOptimistic: { opacity: 0.65 },
  msgText: { fontFamily: DISPLAY, fontSize: rs(14), color: C.text, lineHeight: rs(20), includeFontPadding: false },
  msgTextSent: { color: '#fff' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: rs(3), gap: rs(4) },
  msgTime: { fontFamily: DISPLAY, fontSize: rs(10), color: C.muted, fontWeight: '600', includeFontPadding: false },
  msgTimeSent: { color: 'rgba(255,255,255,0.8)' },
  msgRead: { fontSize: rs(11), color: 'rgba(255,255,255,0.8)' },
  msgReadDone: { color: '#fff' },

  // Post card message
  postCardMsg: { borderRadius: rs(12), borderWidth: 1, overflow: 'hidden', minWidth: rs(200), backgroundColor: C.surface },
  postCardMsgHeader: { paddingHorizontal: rs(10), paddingVertical: rs(6), flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  postCardMsgVendor: { flex: 1, fontFamily: DISPLAY, fontSize: rs(12), fontWeight: 'bold', color: '#fff', includeFontPadding: false },
  postCardMsgCat: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: rs(6) },
  postCardMsgCatText: { fontFamily: DISPLAY, fontSize: rs(10), color: '#fff', fontWeight: 'bold', includeFontPadding: false },
  postCardMsgContent: { fontFamily: DISPLAY, fontSize: rs(13), color: C.text, padding: rs(10), lineHeight: rs(18) },
  postCardMsgFooter: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted, paddingHorizontal: rs(10), paddingBottom: rs(8), fontWeight: '600' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: rs(10),
    backgroundColor: C.surface, paddingHorizontal: rs(12), paddingVertical: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  textInput: {
    flex: 1, fontFamily: DISPLAY, backgroundColor: T.field, borderRadius: rs(20), paddingHorizontal: rs(14), paddingVertical: rs(10),
    fontSize: rs(14), color: C.text, borderWidth: 1, borderColor: C.border, minHeight: rs(42),
  },
  sendBtnWrap: {
    width: rs(42), height: rs(42), borderRadius: rs(21), overflow: 'hidden',
    shadowColor: C.violet, shadowOpacity: 0.35, shadowRadius: rs(8), shadowOffset: { width: 0, height: rs(4) }, elevation: 3,
  },
  sendBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Empty chat
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: rs(80), paddingBottom: rs(40) },
  emptyChatAvatarRing: {
    borderRadius: rs(36), padding: rs(4), backgroundColor: C.violetL,
  },
  emptyChatTitle: { fontFamily: DISPLAY, fontSize: rs(18), fontWeight: 'bold', color: C.text, marginTop: rs(12), marginBottom: rs(4), includeFontPadding: false },
  emptyChatText: { fontFamily: DISPLAY, fontSize: rs(14), color: C.muted, fontWeight: '600' },
});

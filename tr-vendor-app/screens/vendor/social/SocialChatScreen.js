import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView,
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessages, sendMessage } from '../../api/socialApi';

const G = {
  bg: '#F5F7FA', surface: '#FFFFFF', text: '#0A0F1E', muted: '#6B7280',
  border: '#E8EDF2', violet: '#7C3AED', violetL: '#F5F3FF',
  red: '#DC2626', redL: '#FEF2F2', green: '#16A34A', greenL: '#F0FDF4',
  sentBg: '#D1FAE5', receivedBg: '#FFFFFF',
};

const AVATAR_COLORS = ['#7C3AED', '#DC2626', '#16A34A', '#F97316', '#0891B2', '#DB2777', '#D97706'];
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

function AvatarCircle({ name, size = 36 }) {
  const letter = name?.charAt(0)?.toUpperCase() || '?';
  const bg = getAvatarColor(name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{letter}</Text>
    </View>
  );
}

// ── Post Card Message ─────────────────────────────────────────────────
function PostCardMessage({ data, isSent }) {
  const headerBg = isSent ? '#16A34A' : '#7C3AED';
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
          <Text style={styles.dateSepText}>{formatDateLabel(item.date)}</Text>
          <View style={styles.dateSepLine} />
        </View>
      );
    }

    const isSent = String(item.senderId) === String(currentVendorId);
    const parsed = parseContent(item.content);
    const isRead = !!(item.isRead || item.readAt);
    const isOptimistic = !!item.isOptimistic;

    return (
      <View style={[styles.msgRow, isSent ? styles.msgRowSent : styles.msgRowReceived]}>
        {!isSent && <AvatarCircle name={otherVendor?.businessName} size={28} />}
        <View style={[styles.msgBubble, isSent ? styles.msgBubbleSent : styles.msgBubbleReceived, isOptimistic && styles.msgBubbleOptimistic]}>
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
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={G.text} />
          </TouchableOpacity>
          <AvatarCircle name={otherVendor?.businessName} size={38} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{otherVendor?.businessName || 'Vendor'}</Text>
            {otherVendor?.city && <Text style={styles.headerSub}>{otherVendor.city}</Text>}
          </View>
          <TouchableOpacity
            style={styles.headerProfileBtn}
            onPress={() => navigation.navigate('SocialProfileScreen', { vendorId: otherVendor?.id })}
          >
            <Icon name="user" size={18} color={G.violet} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={G.violet} size="large" />
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
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <AvatarCircle name={otherVendor?.businessName} size={64} />
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
            placeholderTextColor={G.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxHeight={100}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: G.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: G.muted, fontSize: 14, marginTop: 10 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.surface, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: G.border, gap: 10,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: G.text },
  headerSub: { fontSize: 12, color: G.muted },
  headerProfileBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: G.violetL,
    alignItems: 'center', justifyContent: 'center',
  },

  // Messages list
  msgList: { padding: 12, paddingBottom: 8 },

  // Date separator
  dateSepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: G.border },
  dateSepText: { fontSize: 11, color: G.muted, fontWeight: '600', paddingHorizontal: 4 },

  // Message row
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, gap: 6 },
  msgRowSent: { justifyContent: 'flex-end' },
  msgRowReceived: { justifyContent: 'flex-start' },
  msgBubble: {
    maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  msgBubbleSent: { backgroundColor: G.sentBg, borderBottomRightRadius: 4 },
  msgBubbleReceived: { backgroundColor: G.receivedBg, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: G.border },
  msgBubbleOptimistic: { opacity: 0.65 },
  msgText: { fontSize: 14, color: G.text, lineHeight: 20 },
  msgTextSent: { color: '#064E3B' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, gap: 4 },
  msgTime: { fontSize: 10, color: G.muted },
  msgTimeSent: { color: '#065F46' },
  msgRead: { fontSize: 11, color: G.muted },
  msgReadDone: { color: G.violet },

  // Post card message
  postCardMsg: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', minWidth: 200 },
  postCardMsgHeader: { paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  postCardMsgVendor: { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff' },
  postCardMsgCat: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  postCardMsgCatText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  postCardMsgContent: { fontSize: 13, color: G.text, padding: 10, lineHeight: 18 },
  postCardMsgFooter: { fontSize: 11, color: G.muted, paddingHorizontal: 10, paddingBottom: 8 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: G.surface, paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: G.border,
  },
  textInput: {
    flex: 1, backgroundColor: G.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: G.text, borderWidth: 1, borderColor: G.border, minHeight: 42,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: G.green,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: G.border },

  // Empty chat
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40 },
  emptyChatTitle: { fontSize: 18, fontWeight: '700', color: G.text, marginTop: 12, marginBottom: 4 },
  emptyChatText: { fontSize: 14, color: G.muted },
});

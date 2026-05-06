import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getDriverChatMessages, sendDriverChatMessage } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const C = {
  primary: '#16A34A', bg: '#F0F4F8', card: '#FFFFFF',
  border: '#E2EAF4', text: '#0F172A', sub: '#64748B',
};

const POLL_INTERVAL = 3000;

function MessageBubble({ msg, isDriver }) {
  const time = moment(msg.createdAt).format('h:mm A');

  return (
    <View style={[styles.bubbleWrap, isDriver ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isDriver && (
        <View style={styles.bubbleAvatar}>
          <Ionicons name="person" size={14} color={C.sub} />
        </View>
      )}
      <View style={[styles.bubble, isDriver ? styles.bubbleDriver : styles.bubbleCustomer]}>
        <Text style={[styles.bubbleText, isDriver ? styles.bubbleTextDriver : styles.bubbleTextCustomer]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, isDriver ? styles.bubbleTimeDriver : styles.bubbleTimeCustomer]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

function DateSeparator({ date }) {
  return (
    <View style={styles.dateSep}>
      <View style={styles.dateSepLine} />
      <Text style={styles.dateSepText}>{date}</Text>
      <View style={styles.dateSepLine} />
    </View>
  );
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = moment(msg.createdAt).format('MMMM D, YYYY');
    if (d !== lastDate) {
      groups.push({ type: 'date', date: d, id: `date-${d}` });
      lastDate = d;
    }
    groups.push({ ...msg, type: 'message' });
  }
  return groups;
}

export default function ChatScreen({ navigation, route }) {
  const { conversationId, customerName = 'Customer' } = route.params || {};
  const { driver } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [lastSince, setLastSince] = useState(null);

  const listRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const fetchMessages = useCallback(async (since = null) => {
    try {
      const res = await getDriverChatMessages(conversationId, since);
      if (res.data?.success) {
        const newMsgs = res.data.messages || [];
        if (since) {
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const fresh = newMsgs.filter(m => !existingIds.has(m.id));
              return fresh.length > 0 ? [...prev, ...fresh] : prev;
            });
          }
        } else {
          setMessages(newMsgs);
        }
        if (newMsgs.length > 0) {
          setLastSince(newMsgs[newMsgs.length - 1].createdAt);
        }
      }
    } catch {}
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages(null);
    pollRef.current = setInterval(() => {
      setLastSince(prev => {
        fetchMessages(prev);
        return prev;
      });
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setText('');
    setSending(true);
    Keyboard.dismiss();

    try {
      const res = await sendDriverChatMessage(conversationId, trimmed);
      if (res.data?.success) {
        const newMsg = res.data.message;
        setMessages(prev => [...prev, newMsg]);
        setLastSince(newMsg.createdAt);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
    setSending(false);
  };

  const grouped = groupByDate(messages);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{customerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.headerName}>{customerName}</Text>
              <Text style={styles.headerSub}>Customer</Text>
            </View>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={grouped}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (item.type === 'date') {
                return <DateSeparator date={item.date} />;
              }
              const isDriver = item.senderType === 'driver';
              return <MessageBubble msg={item} isDriver={isDriver} />;
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySub}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={C.sub}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#043927', paddingHorizontal: 16, paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 15, fontWeight: '800', color: C.primary },
  headerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Messages list
  msgList: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },

  // Date separator
  dateSep: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12,
  },
  dateSepLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateSepText: { fontSize: 11, color: C.sub, fontWeight: '600' },

  // Bubbles
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    marginRight: 6, marginBottom: 2,
  },
  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleCustomer: {
    backgroundColor: C.card, borderTopLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleDriver: {
    backgroundColor: C.primary, borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextCustomer: { color: C.text },
  bubbleTextDriver: { color: '#fff' },
  bubbleTime: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  bubbleTimeCustomer: { color: C.sub },
  bubbleTimeDriver: { color: 'rgba(255,255,255,0.7)' },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120,
    backgroundColor: '#F8FAFC', borderRadius: 21, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: C.text, lineHeight: 20,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },

  // Empty
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.sub },
});

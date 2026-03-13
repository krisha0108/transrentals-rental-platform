import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { b2bService } from '../services';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

export default function B2BChatScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  // Load vendor list
  const loadVendors = useCallback(async () => {
    try {
      const res = await b2bService.getChatVendors(bookingId);
      setVendors(res?.vendors || res?.conversations || []);
    } catch (err) {
      console.log('Chat vendors error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Load messages for selected vendor
  const loadMessages = useCallback(async () => {
    if (!selectedVendor) return;
    try {
      const res = await b2bService.getChatMessages(bookingId, selectedVendor.vendorId || selectedVendor.id);
      setMessages(res?.messages || []);
    } catch (err) {
      console.log('Chat messages error:', err.message);
    }
  }, [bookingId, selectedVendor]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  useEffect(() => {
    if (selectedVendor) {
      loadMessages();
      // Poll for new messages every 5 seconds
      pollRef.current = setInterval(loadMessages, 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [selectedVendor, loadMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await b2bService.sendChatMessage(bookingId, selectedVendor.vendorId || selectedVendor.id, newMessage.trim());
      setNewMessage('');
      loadMessages();
    } catch (err) {
      console.log('Send message error:', err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Vendor List View
  if (!selectedVendor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={scale(22)} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat with Vendors</Text>
          <View style={{ width: scale(22) }} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#22C55E" /></View>
        ) : vendors.length === 0 ? (
          <View style={styles.center}>
            <Icon name="message-circle" size={scale(50)} color="#ddd" />
            <Text style={styles.emptyText}>No vendors to chat with yet</Text>
            <Text style={styles.emptySubText}>Chat becomes available after vendors submit quotes</Text>
          </View>
        ) : (
          <FlatList
            data={vendors}
            keyExtractor={(item) => item.vendorId || item.id}
            contentContainerStyle={styles.vendorList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.vendorCard} onPress={() => setSelectedVendor(item)}>
                <View style={styles.vendorAvatar}>
                  <Icon name="user" size={scale(20)} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName}>{item.vendorName || item.name || 'Vendor'}</Text>
                  <Text style={styles.vendorLastMsg} numberOfLines={1}>
                    {item.lastMessage || 'Start chatting...'}
                  </Text>
                </View>
                {(item.unreadCount > 0 || item.customerUnread > 0) && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount || item.customerUnread}</Text>
                  </View>
                )}
                <Icon name="chevron-right" size={scale(18)} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Chat View
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setSelectedVendor(null)}>
          <Icon name="arrow-left" size={scale(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedVendor.vendorName || selectedVendor.name || 'Chat'}</Text>
        <View style={{ width: scale(22) }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCustomer = item.senderType === 'customer' || item.sender === 'customer';
            const showDate = index === 0 || formatDate(item.createdAt) !== formatDate(messages[index - 1]?.createdAt);
            return (
              <>
                {showDate && (
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                )}
                <View style={[styles.msgRow, isCustomer ? styles.msgRowRight : styles.msgRowLeft]}>
                  <View style={[styles.msgBubble, isCustomer ? styles.msgBubbleRight : styles.msgBubbleLeft]}>
                    <Text style={[styles.msgText, isCustomer ? styles.msgTextRight : styles.msgTextLeft]}>
                      {item.message || item.text}
                    </Text>
                    <Text style={[styles.msgTime, isCustomer ? styles.msgTimeRight : styles.msgTimeLeft]}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </>
            );
          }}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newMessage.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={scale(18)} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(20) },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + scale(10) : scale(14),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(17), fontWeight: '700', color: '#1A1A1A' },
  emptyText: { fontSize: scale(14), color: '#999', marginTop: scale(10) },
  emptySubText: { fontSize: scale(12), color: '#ccc', marginTop: scale(4), textAlign: 'center' },
  vendorList: { padding: scale(16) },
  vendorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: scale(14), padding: scale(14), marginBottom: scale(10),
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  vendorAvatar: {
    width: scale(44), height: scale(44), borderRadius: scale(22),
    backgroundColor: '#F0FFF4', alignItems: 'center', justifyContent: 'center', marginRight: scale(12),
  },
  vendorName: { fontSize: scale(14), fontWeight: '700', color: '#333' },
  vendorLastMsg: { fontSize: scale(12), color: '#999', marginTop: scale(2) },
  unreadBadge: {
    backgroundColor: '#22C55E', borderRadius: scale(10), minWidth: scale(20),
    height: scale(20), alignItems: 'center', justifyContent: 'center', marginRight: scale(8),
  },
  unreadText: { color: '#fff', fontSize: scale(10), fontWeight: '700' },
  messageList: { padding: scale(16), paddingBottom: scale(10), flexGrow: 1 },
  dateHeader: { alignItems: 'center', marginVertical: scale(10) },
  dateText: { fontSize: scale(11), color: '#999', backgroundColor: '#E5E7EB', paddingHorizontal: scale(12), paddingVertical: scale(4), borderRadius: scale(10) },
  msgRow: { marginBottom: scale(8) },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { alignItems: 'flex-start' },
  msgBubble: { maxWidth: '80%', padding: scale(10), borderRadius: scale(14) },
  msgBubbleRight: { backgroundColor: '#22C55E', borderBottomRightRadius: scale(4) },
  msgBubbleLeft: { backgroundColor: '#fff', borderBottomLeftRadius: scale(4), borderWidth: 1, borderColor: '#E9ECEF' },
  msgText: { fontSize: scale(14), lineHeight: scale(20) },
  msgTextRight: { color: '#fff' },
  msgTextLeft: { color: '#333' },
  msgTime: { fontSize: scale(10), marginTop: scale(4) },
  msgTimeRight: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  msgTimeLeft: { color: '#999' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: scale(10),
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  chatInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: scale(20),
    paddingHorizontal: scale(16), paddingVertical: scale(10),
    fontSize: scale(14), color: '#333', maxHeight: scale(100), marginRight: scale(8),
  },
  sendBtn: {
    width: scale(42), height: scale(42), borderRadius: scale(21),
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },
});

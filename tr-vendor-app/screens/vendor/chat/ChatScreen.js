import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getChatMessages, sendChatMessage } from '../../api/client';

const C = {
  bg: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
};

const BOOKING_DETAIL_SCREEN_MAP = {
  bike: 'BikeBookingDetail',
  car: 'CarRentalBookingDetail',
  chauffeur: 'CarRentalBookingDetail',
  'self-drive': 'SelfDriveBookingDetail',
  bus: 'BusBookingDetail',
  truck: 'TruckBookingDetail',
  luxury: 'LuxuryBookingDetail',
  packers: 'PackersBookingDetail',
  equipment: 'EquipmentBookingDetail',
};

export default function ChatScreen({ route, navigation }) {
  const { bookingId, customerName, bookingNumber, serviceType } = route.params || {};

  const handleViewBooking = () => {
    if (!bookingId || !serviceType) return;
    const screen = BOOKING_DETAIL_SCREEN_MAP[serviceType];
    if (screen) {
      navigation.navigate(screen, { bookingId });
    }
  };
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getChatMessages(bookingId);
      setMessages(response?.messages || []);
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistically add message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      senderType: 'vendor',
      createdAt: new Date().toISOString(),
      sending: true,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await sendChatMessage(bookingId, messageText);
      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.log('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderMessage = ({ item, index }) => {
    const isVendor = item.senderType === 'vendor';
    const showDateHeader =
      index === 0 ||
      formatDate(item.createdAt) !== formatDate(messages[index - 1]?.createdAt);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isVendor && styles.vendorRow]}>
          {!isVendor && (
            <View style={styles.customerAvatar}>
              <Icon name="user" size={14} color="#fff" />
            </View>
          )}
          <View style={[styles.messageBubble, isVendor ? styles.vendorBubble : styles.customerBubble]}>
            <Text style={[styles.messageText, isVendor && styles.vendorMessageText]}>
              {item.message}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isVendor && styles.vendorMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
              {item.sending && (
                <Icon name="clock" size={10} color={isVendor ? 'rgba(255,255,255,0.7)' : C.muted} style={{ marginLeft: 4 }} />
              )}
              {isVendor && !item.sending && (
                <Icon name="check" size={10} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
          {isVendor && (
            <View style={styles.vendorAvatar}>
              <Icon name="user-check" size={14} color="#fff" />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{customerName || 'Customer'}</Text>
            <Text style={styles.headerSubtitle}>Booking #{bookingNumber}</Text>
          </View>
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{customerName || 'Customer'}</Text>
          <Text style={styles.headerSubtitle}>Booking #{bookingNumber}</Text>
        </View>
        <TouchableOpacity style={styles.viewBookingBtn} onPress={handleViewBooking}>
          <Icon name="info" size={18} color={C.muted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="message-circle" size={40} color={C.muted} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          )}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={C.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  flex: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  viewBookingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  messagesContent: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 8,
    flexGrow: 1,
    backgroundColor: C.bg,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateHeaderText: {
    fontSize: 11,
    color: C.muted,
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  vendorRow: {
    justifyContent: 'flex-end',
  },
  customerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vendorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  vendorBubble: {
    backgroundColor: C.brand,
    borderBottomRightRadius: 2,
  },
  customerBubble: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  messageText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  vendorMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 9,
    color: C.muted,
  },
  vendorMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

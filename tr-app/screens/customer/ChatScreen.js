// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Pusher } from '@pusher/pusher-websocket-react-native';

// const pusher = Pusher.getInstance();

// export default function ChatScreen({ route }) {
//   const { bookingId, vendorId, vendorName } = route.params;
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const flatListRef = useRef();

//   useEffect(() => {
//     console.log('[ChatScreen] useEffect start');
//     fetchMessages();
//     setupPusher();

//     return () => {
//       console.log('[ChatScreen] Cleanup - unsubscribe and disconnect');
//       pusher.unsubscribe(`booking.${bookingId}`)
//         .then(() => console.log('[ChatScreen] Unsubscribed successfully'))
//         .catch(e => console.warn('[ChatScreen] Unsubscribe error:', e));
//       // Optionally keep connected for app lifetime, so no disconnect here
//     };
//   }, []);

//   const fetchMessages = async () => {
//     console.log('[fetchMessages] Fetching messages from API...');
//     try {
//       const token = await AsyncStorage.getItem('token');
//       console.log('[fetchMessages] Retrieved token:', token ? 'Exists' : 'Null');
//       const res = await axios.get(
//         `https://app.transrentals.in/api/customer/bookings/${bookingId}/chats/${vendorId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log('[fetchMessages] Response data count:', res.data.length);
//       setMessages(res.data);
//       // Scroll after messages set
//       setTimeout(() => {
//         console.log('[fetchMessages] Scrolling to bottom');
//         flatListRef.current?.scrollToEnd({ animated: true });
//       }, 100);
//     } catch (error) {
//       console.log('[fetchMessages] Error fetching messages:', error);
//     }
//   };

//   const setupPusher = async () => {
//     try {
//       console.log('[setupPusher] Initializing Pusher...');
//       await pusher.init({
//         apiKey: '59ceeade4d6ec7c7ec88',
//         cluster: 'ap2',
//         enableLogging: true,
//       });
//       console.log('[setupPusher] Connecting to Pusher...');
//       await pusher.connect();
//       console.log('[setupPusher] Connected to Pusher!');

//       const channel = await pusher.subscribe({
//         channelName: `booking.${bookingId}`,
//         onEvent: (event) => {
//           console.log('[Pusher] Raw event received:', event);

//           if (!event) {
//             console.warn('[Pusher] Received null/undefined event');
//             return;
//           }

//           if (event.event) {
//             console.log('[Pusher] Event name:', event.event);
//           }

//           let data = null;
//           if (typeof event === 'string') {
//             try {
//               data = JSON.parse(event);
//               console.log('[Pusher] Parsed event string JSON:', data);
//             } catch (e) {
//               console.log('[Pusher] Failed to parse event string:', e);
//               return;
//             }
//           } else if (event.data) {
//             try {
//               data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//               console.log('[Pusher] Parsed event.data JSON:', data);
//             } catch (e) {
//               console.log('[Pusher] Failed to parse event.data:', e);
//               return;
//             }
//           } else {
//             data = event;
//             console.log('[Pusher] Event data fallback:', data);
//           }

//           if (event.eventName === 'BookingChatMessageSent' && data && data.chat) {
//             console.log('[Pusher] Valid chat event, updating messages');
//             setMessages((prev) => {
//               // Prevent duplicates
//               if (prev.some(m => m.id === data.chat.id)) {
//                 return prev;
//               }
//               const newMessages = [...prev, data.chat];
//               console.log('[Pusher] Messages state updated:', newMessages.length);
//               return newMessages;
//             });
//             setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
//           } else {
//             console.warn('[Pusher] Ignored event or missing chat data:', event.event, data);
//           }
//         },
//       });
//       console.log('[setupPusher] Subscribed to channel:', channel.channelName);
//     } catch (error) {
//       console.log('[setupPusher] Pusher setup error:', error);
//     }
//   };

//   const sendMessage = async () => {
//     if (!input.trim()) {
//       console.log('[sendMessage] Empty input, ignoring send');
//       return;
//     }
//     console.log('[sendMessage] Sending message:', input);

//     try {
//       const token = await AsyncStorage.getItem('token');
//       const res = await axios.post(
//         `https://app.transrentals.in/api/customer/bookings/${bookingId}/chats/${vendorId}`,
//         { message: input },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log('[sendMessage] Message sent successfully, appending locally');
//       setMessages((prev) => {
//         if (prev.some(m => m.id === res.data.id)) {
//           return prev;
//         }
//         return [...prev, res.data];
//       });
//       setInput('');
//       flatListRef.current.scrollToEnd({ animated: true });
//     } catch (error) {
//       console.log('[sendMessage] Error sending message:', error);
//     }
//   };

//   const renderItem = ({ item }) => {
//     const isCustomer = item.sender_type === 'customer';
//     return (
//       <View
//         style={[
//           styles.messageContainer,
//           isCustomer ? styles.messageRight : styles.messageLeft,
//         ]}
//       >
//         <Text style={[styles.messageText, isCustomer ? styles.textWhite : styles.textBlack]}>
//           {item.message}
//         </Text>
//         <Text style={styles.messageTime}>
//           {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id.toString()}
//         contentContainerStyle={{ padding: 16 }}
//         onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
//         onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
//       />
//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder={`Message ${vendorName}`}
//           value={input}
//           onChangeText={setInput}
//           onSubmitEditing={sendMessage}
//           returnKeyType="send"
//         />
//         <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
//           <Text style={{ color: 'white' }}>Send</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   messageContainer: {
//     maxWidth: '70%',
//     marginBottom: 12,
//     padding: 10,
//     borderRadius: 10,
//   },
//   messageRight: {
//     backgroundColor: '#3B82F6',
//     alignSelf: 'flex-end',
//   },
//   messageLeft: {
//     backgroundColor: '#E5E7EB',
//     alignSelf: 'flex-start',
//   },
//   messageText: {
//     fontSize: 16,
//   },
//   textWhite: {
//     color: 'white',
//   },
//   textBlack: {
//     color: 'black',
//   },
//   messageTime: {
//     fontSize: 10,
//     marginTop: 4,
//     color: '#9CA3AF',
//     alignSelf: 'flex-end',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderColor: '#ddd',
//     backgroundColor: 'white',
//   },
//   input: {
//     flex: 1,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     fontSize: 16,
//   },
//   sendButton: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#3B82F6',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     marginLeft: 10,
//   },
// });

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated, Easing
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pusher } from '@pusher/pusher-websocket-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import api from '../api';


const pusher = Pusher.getInstance();

export default function ChatScreen({ route, navigation }) {
  const { bookingId, vendorId, vendorName, bookingstatus, bookinglocation, bookingdate, bookingtime,service_name  } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef();
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    console.log('[ChatScreen] useEffect start');
    fetchMessages();
    setupPusher();

    return () => {
      console.log('[ChatScreen] Cleanup - unsubscribe and disconnect');
      pusher.unsubscribe(`booking.${bookingId}`)
        .then(() => console.log('[ChatScreen] Unsubscribed successfully'))
        .catch(e => console.warn('[ChatScreen] Unsubscribe error:', e));
      // Optionally keep connected for app lifetime, so no disconnect here
    };
  }, []);
  const toggleBookingDetails = () => {
    const toValue = showDetails ? 0 : 1;
    setShowDetails(!showDetails);

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const dropdownHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 164], // adjust height as needed
  });

  const fetchMessages = async () => {
    setLoading(true);
    console.log('[fetchMessages] Fetching messages from API...');
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('[fetchMessages] Retrieved token:', token ? 'Exists' : 'Null');
      const res = await api.get(
        `/customer/bookings/${bookingId}/chats/${vendorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[fetchMessages] Response data count:', res.data.length);
      setMessages(res.data);
       // ✅ Mark vendor messages as read (Important)
    await api.post(
      `/customer/bookings/${bookingId}/vendor/${vendorId}/read-messages`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[fetchMessages] Unread messages marked as read');
      // Scroll after messages set
      setTimeout(() => {
        console.log('[fetchMessages] Scrolling to bottom');
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log('[fetchMessages] Error fetching messages:', error);
    } finally {
    setLoading(false); // ← Stop loading
  }
  };
const SkeletonBubble = ({ isRight, index }) => {
  // Use index to control variation: every 3rd bubble will be shorter
  const isShort = index % 3 === 0;

  const width = Math.floor(Math.random() * (240 - 140 + 1)) + 140; // width 140–240
  const height = isShort
    ? Math.floor(Math.random() * (25 - 20 + 1)) + 20   // small bubble: 20–25
    : Math.floor(Math.random() * (50 - 40 + 1)) + 40;  // large bubble: 40–50

  return (
    <View
      style={{
        alignSelf: isRight ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        maxWidth: '80%',
      }}
    >
      <ShimmerPlaceHolder
        style={{
          width,
          height,
          borderRadius: 16,
          backgroundColor: '#f0f0f0',
        }}
        shimmerStyle={{ borderRadius: 16 }}
        visible={false}
      />
    </View>
  );
};


  const setupPusher = async () => {
    try {
      console.log('[setupPusher] Initializing Pusher...');
      await pusher.init({
        apiKey: '59ceeade4d6ec7c7ec88',
        cluster: 'ap2',
        enableLogging: true,
      });
      console.log('[setupPusher] Connecting to Pusher...');
      await pusher.connect();
      console.log('[setupPusher] Connected to Pusher!');

      const channel = await pusher.subscribe({
        channelName: `booking.${bookingId}`,
        onEvent: (event) => {
          console.log('[Pusher] Raw event received:', event);

          if (!event) {
            console.warn('[Pusher] Received null/undefined event');
            return;
          }

          if (event.event) {
            console.log('[Pusher] Event name:', event.event);
          }

          let data = null;
          if (typeof event === 'string') {
            try {
              data = JSON.parse(event);
              console.log('[Pusher] Parsed event string JSON:', data);
            } catch (e) {
              console.log('[Pusher] Failed to parse event string:', e);
              return;
            }
          } else if (event.data) {
            try {
              data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              console.log('[Pusher] Parsed event.data JSON:', data);
            } catch (e) {
              console.log('[Pusher] Failed to parse event.data:', e);
              return;
            }
          } else {
            data = event;
            console.log('[Pusher] Event data fallback:', data);
          }

          if (event.eventName === 'BookingChatMessageSent' && data && data.chat) {
            console.log('[Pusher] Valid chat event, updating messages');
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some(m => m.id === data.chat.id)) {
                return prev;
              }
              const newMessages = [...prev, data.chat];
              console.log('[Pusher] Messages state updated:', newMessages.length);
              return newMessages;
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          } else {
            console.warn('[Pusher] Ignored event or missing chat data:', event.event, data);
          }
        },
      });
      console.log('[setupPusher] Subscribed to channel:', channel.channelName);
    } catch (error) {
      console.log('[setupPusher] Pusher setup error:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) {
      console.log('[sendMessage] Empty input, ignoring send');
      return;
    }
    console.log('[sendMessage] Sending message:', input);

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post(
        `/customer/bookings/${bookingId}/chats/${vendorId}`,
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[sendMessage] Message sent successfully, appending locally');
      setMessages((prev) => {
        if (prev.some(m => m.id === res.data.id)) {
          return prev;
        }
        return [...prev, res.data];
      });
      setInput('');
      flatListRef.current.scrollToEnd({ animated: true });
    } catch (error) {
      console.log('[sendMessage] Error sending message:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isCustomer = item.sender_type === 'customer';
    return (
      // <View
      //   style={[
      //     styles.messageContainer,
      //     isCustomer ? styles.messageRight : styles.messageLeft,
      //   ]}
      // >
      //   <Text style={[styles.messageText, isCustomer ? styles.textWhite : styles.textBlack]}>
      //     {item.message}
      //   </Text>
      //   <Text style={styles.messageTime}>
      //     {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      //   </Text>
      // </View>
      <View
        style={[
          styles.messageWrapper,
          isCustomer ? styles.alignRight : styles.alignLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isCustomer ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <Text style={[styles.messageText, isCustomer ? styles.textWhite : styles.textBlack]}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'rgb(249, 250, 251)', }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {vendorName?.charAt(0).toUpperCase() || 'V'}
            </Text>
          </View>
          <View>
            <Text style={styles.vendorName}>{vendorName}</Text>
            <Text style={styles.serviceName}>{service_name || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={toggleBookingDetails}>
          <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={24} color="#111" />
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.bookingDropdown, { height: dropdownHeight , borderBottomWidth:1, borderColor: 'rgb(243, 244, 246)',}]}>
        {showDetails && (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeaderRow}>
              <Text style={styles.bookingTitle}>Booking Details</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{bookingstatus || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="date-range" size={18} color="#6b7280" />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{bookingdate || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={18} color="#6b7280" />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{bookingtime || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-sharp" size={18} color="#6b7280" />
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{bookinglocation || 'N/A'}</Text>
            </View>
          </View>
        )}
      </Animated.View>


      {loading ? (
  <View style={{ padding: 16 , height: '82%' }}>
    {[...Array(8)].map((_, i) => (
      <SkeletonBubble key={i} isRight={i % 2 === 0} />
    ))}
  </View>
) : (
  <FlatList
    ref={flatListRef}
    data={messages}
    renderItem={renderItem}
    keyExtractor={(item) => item.id.toString()}
    contentContainerStyle={{ padding: 16 }}
    onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
    onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
  />
)}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendIconButton} onPress={sendMessage}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '70%',
    marginBottom: 12,
    padding: 10,

    borderRadius: 10,
  },
  messageRight: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
  },
  messageWrapper: {
    
    marginBottom: 10,
    maxWidth: '80%',
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  bubbleLeft: {
    backgroundColor: '#fff',
    borderWidth:1,
    borderColor:'rgb(229, 231, 235)',
    borderRadius:10,
  },
  bubbleRight: {
    backgroundColor: '#111827',
    borderRadius:10,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textWhite: {
    color: 'white',
  },
  textBlack: {
    color: '#111',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    elevation: 4,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  vendorName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#111827',
  },
  serviceName: {
    fontSize: 13,
    color: '#6B7280',
  },
  bookingDropdown: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  statusBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },

  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  detailLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1.5,
  },
  bookingCard: {
    backgroundColor: 'rgb(249, 250, 251)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgb(243, 244, 246)'
    // shadowColor: '#000',
    // shadowOpacity: 0.05,
    // shadowRadius: 6,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  bookingInfo: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  messageLeft: {
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  textWhite: {
    color: 'white',
  },
  textBlack: {
    color: 'black',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#111827',
  },

  sendIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

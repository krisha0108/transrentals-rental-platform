import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api';

const ChatDetailScreen = ({ route, navigation }) => {
  const { contactId, contactName, contactType } = route.params; // Get contact data from navigation params
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true); // Track loading state
  const [refreshing, setRefreshing] = useState(false);
const [isAtBottom, setIsAtBottom] = useState(false);
  const flatListRef = useRef();

  // Ensure contactName is valid before using it
  const contactInitial = contactName && contactName.length > 0 ? contactName.charAt(0).toUpperCase() : 'U'; // 'U' for Unknown

  // Fetch chat messages between the current user and the contact
  const fetchMessages = async () => {
    const token = await AsyncStorage.getItem('token');
    const customerId = await AsyncStorage.getItem('customer_id');

    if (!token) {
      console.log('No token found. Please log in again.');
      return navigation.replace('Login');
    }

    try {
      setLoading(true);
      const response = await api.get(`/chats/${contactId}/messages`);

      // console.log('Messages from backend:', response.data);  // Check if sender_name exists
      // Check if `contactName` or `sender_name` exists in the response
      // if (!contactName || !response.data.sender_name) {
      //   console.log('Contact Name or Sender Name is missing');
      // }
      setMessages(response.data);
      setLoading(false);
      // if (isAtBottom) {
      //   setTimeout(() => {
      //     flatListRef.current?.scrollToEnd({ animated: true });
      //   }, 100);
      // }

    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleScroll = (event) => {
  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
  
  const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

  // Show button only if user is scrolled UP more than 300 pixels
  const showButton = distanceFromBottom > 300;

  setIsAtBottom(!showButton); // true means near bottom (<=300), false means far from bottom (>300)
};

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages().finally(() => setRefreshing(false));
  };
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 1000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Send a new message
  const sendMessage = async () => {
    const token = await AsyncStorage.getItem('token');
    const customerId = await AsyncStorage.getItem('customer_id');
    const customer = await AsyncStorage.getItem('customer');
    console.log('customer data:', customer)

    if (!token) {
      console.log('No token found. Please log in again.');
      return navigation.replace('Login');
    }
    const receiver_type = 'vendor';
    try {
      const response = await api.post('/chat/send', {
        message: newMessage,
        receiver_id: contactId, // receiverId passed from navigation params
        receiver_type: receiver_type, // dynamically get the receiver type (customer or vendor)
      });

      console.log('Message sent successfully:', response.data);

      // Update state to show the new message in the chat
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message: newMessage,
          sender_name: customer.name, // Display "You" as sender
          sender_type: 'customer', // Assuming 'customer' is the sender type
          created_at: new Date().toISOString(), // Set the current time as the created_at
        },
      ]);

      setNewMessage('');  // Clear input field
      // Scroll after a small delay
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      // flatListRef.current.scrollToEnd(); // Scroll to the latest message
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error);
    }
  };



  return (
    <SafeAreaView>
    <View style={{ flex: 1, backgroundColor: 'white' }}>


      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        {/* Display receiver's profile image (first letter of their name) */}
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileImageText}>
            {contactInitial}  {/* Use the contactInitial that has a fallback */}
          </Text>
        </View>
<View style={styles.headercusname}>
        <Text style={styles.headerText}>{contactName || 'Unknown'}</Text>

        {/* Online status */}
        <Text style={styles.onlineStatus}>online</Text>
        </View>
      </View>
<View style={{ flex: 1, position: 'relative' }}>
      <FlatList
        onScroll={handleScroll}
        scrollEventThrottle={100}
        contentContainerStyle={{ paddingBottom: 5 }}
        ref={flatListRef}
        data={messages}
    showsVerticalScrollIndicator={true}
    persistentScrollbar={false}
        renderItem={({ item }) => {
          const senderInitial = item.sender_name ? item.sender_name.charAt(0).toUpperCase() : 'U'; // First letter of sender's name

          return (

            <View
              style={[
                styles.messageContainer,
                item.sender_type === 'customer' ? styles.sentMessage : styles.receivedMessage
              ]}
            >

              {/* Sender's profile image */}
              <View
                style={[
                  styles.messageProfileImage,
                  item.sender_type === 'customer' ? styles.profileLeft : styles.profileRight
                ]}
              >
                <Text style={styles.messageProfileImageText}>
                  {senderInitial}  {/* Use the sender's first letter */}
                </Text>
              </View>

              {/* Message content */}
              <View
                style={[
                  styles.messageContent,
                  item.sender_type === 'customer' ? styles.alignMessageRight : styles.alignMessageLeft
                ]}
              >
                <Text style={styles.messageText}>
                  {item.message}
                </Text>
                <Text style={styles.timeText}>
                  {new Date(item.created_at).toLocaleTimeString()}
                </Text>
              </View>
            </View>


          );
        }}
        keyExtractor={(item, index) => item.id ? item.id.toString() : `${index}-${item.created_at}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              {/* Add multiple skeleton message containers */}
              {[...Array(9)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.skeletonMessage,
                    index % 2 === 0 ? styles.alignLeft : styles.alignRight // Alternate left and right alignment
                  ]}
                >
                  <View style={styles.skeletoncontainerraw}>
                    <ShimmerPlaceholder style={styles.skeletonProfile} />
                    <View>
                      <ShimmerPlaceholder style={styles.skeletonText} />
                      <ShimmerPlaceholder style={styles.skeletonText} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
      />
      {!isAtBottom && (
    <TouchableOpacity
      style={styles.goToBottomButton}
      onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
    >
      <Ionicons name="chevron-down" size={24} color="white" />
    </TouchableOpacity>
  )}
</View>

      <View style={styles.inputContainer}>
        {/* <TouchableOpacity>
          <Ionicons name="mic" size={24} color="#22C55E" />
        </TouchableOpacity> */}
        <TextInput
          style={styles.input}
          placeholder="Write your message!"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        {/* <TouchableOpacity>
          <Ionicons name="attach" size={24} color="#22C55E" />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#F9F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 5,  // Adds shadow to the header
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#6B7280',  // Purple color for the profile image circle
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
   
  },
  profileImageText: {
    color: 'white',
    paddingLeft: 5,
    fontWeight: 'bold',
  },
  headercusname: {
  marginLeft: 8,
  width: '100%',
  flexDirection: 'column',
  justifyContent: 'flex-start', // align items at the top
  alignItems: 'flex-start',
},

headerText: {
  color: 'black',
  fontSize: 18,
  // flex: 1,    // remove this flex property
  lineHeight: 22,  // set line height close to font size
  marginBottom: 2, // small gap between name and online status
},

onlineStatus: {
  color: 'green',
  fontSize: 12,
  lineHeight: 14,
},

  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  messageProfileImage: {
    width: 40,
    height: 40,
    backgroundColor: '#6B7280',  // Profile image circle color
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,  // Default margin for left-side messages

  },
  messageProfileImageText: {
    color: '#fff',
    paddingLeft: 5,
    fontWeight: 'bold',
  },
  // Align message content for the sender (customer)
  sentMessage: {
    alignSelf: 'flex-end',  // Align message to the right for customer
  },
  // Align message content for the receiver
  receivedMessage: {
    alignSelf: 'flex-start',  // Align message to the left for vendor
  },
  messageContent: {
    maxWidth: '70%',
  },
  // Styling for customer (sender)
  alignMessageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#e1e1e1',  // Background color for customer messages
    padding: 10,
    borderRadius: 20,
    marginBottom: 5,
  },
  // Styling for vendor (receiver)
  alignMessageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',  // Background color for vendor messages
    padding: 10,
    borderRadius: 20,
    marginBottom: 5,
  },
  profileLeft: {
    marginRight: 10,
  },
  profileRight: {
    marginLeft: 10,
  },
  messageText: {
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#22C55E',
    padding: 10,
    borderRadius: 50,
  },
  skeletonContainer: {
    width: '100%',
    flexDirection: 'column',
    padding: 15,
  },
  skeletoncontainerraw: {
    flexDirection: 'row',  // This should be 'row' to align the profile image and text horizontally
    alignItems: 'center', // Ensure they are vertically aligned in the center
    marginBottom: 15,
    width: '100%',
  },
  skeletonMessage: {
    width: '65%', // Two messages per row
    marginBottom: 10,
  },
  skeletonProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 15,
  },
  skeletonText: {
    width: '80%',
    height: 10,
    marginBottom: 5,
    backgroundColor: '#e0e0e0',
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  goToBottomButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 25,
    elevation: 5, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

});

export default ChatDetailScreen;

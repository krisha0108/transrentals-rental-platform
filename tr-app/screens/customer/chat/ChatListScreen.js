import React, { useState, useEffect } from 'react';
import {StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api';
const ContactList = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);  // Track loading state
  
  // Fetch contacts
  const fetchContacts = async () => {
    const token = await AsyncStorage.getItem('token');
    console.log('Token from AsyncStorage:', token);
    const customerId = await AsyncStorage.getItem('customer_id');
  
    if (!token) {
      console.log('No token found. Please log in again.');
      return navigation.replace('Login');
    }
  
    try {
      setLoading(true);  // Set loading to true when fetching data
      const response = await api.get('/chats/contact-list', {
        params: { customer_id: customerId },
      });
  
      // console.log('Contacts from backend:', response.data);  // Log to verify the contact list
// Convert the object to an array
const contactsArray = Object.values(response.data);
// console.log('Converted contacts array:', contactsArray);

setContacts(contactsArray); // Set the contacts as an array
setLoading(false); 

    } catch (error) {
      if (error.response && error.response.status === 401) {
        // console.log('Unauthorized. Token expired or invalid.');
        // Redirect to login screen if the token is invalid
        navigation.replace('LoginScreen');
      } else {
        // console.error('Error fetching contacts:', error);
        setLoading(false);
      }
    }
  };
  const markMessagesAsRead = async (contactId, contactType) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('No token found. Please log in again.');
      navigation.replace('Login');
      return;
    }

    await api.post('/chat/mark-read', {
      receiver_id: contactId,
      receiver_type: 'vendor',
    });
    console.log(`Messages from contact ${contactId} marked as read.`);
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
  }
};
// Refresh handler
const onRefresh = () => {
  setRefreshing(true);
  fetchContacts().finally(() => setRefreshing(false));
};

  useEffect(() => {
    // console.log('Contacts:', contacts); // Log contacts array to verify its structure
    fetchContacts();
  }, []);

  const handleChatSelect = async (contactId, contactName, contactType) => {
  // Mark messages as read on server
  await markMessagesAsRead(contactId, contactType);

  // Then navigate to chat screen
  navigation.navigate('ChatDetail', {
    contactId,
    contactName,
    contactType,
  });
};

  
  // Helper function to get the first letter of the contact's name
  const getFirstLetter = (name) => name.charAt(0).toUpperCase();

  return (
    <SafeAreaView>
    <View style={{ flex: 1, backgroundColor: '#F9F7F7' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="chevron-back" size={20} color="#404040" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Messages</Text>
          <Text style={styles.subTitle}>Chat with your vendors</Text>
        </View>
      </View>

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats by vendor name..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

<FlatList
        data={Array.isArray(contacts) ? contacts
          .filter(contact => {
            // Only show chats where there's at least one message
            const hasMessages = contact.last_message || contact.last_message_time;
            // Also filter by search query
            const matchesSearch = contact.name && contact.name.toLowerCase().includes(search.toLowerCase());
            return hasMessages && matchesSearch;
          })
          : []}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.contactItem} onPress={() => handleChatSelect(item.id, item.name, item.type)}>
            <View style={styles.profileContainer}>
              {/* Profile Image (First Letter) */}
              <View style={styles.profileImage}>
                <Text style={styles.profileImageText}>{getFirstLetter(item.name)}</Text>
              </View>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message || 'No messages yet'}
              </Text>
            </View>
            <View style={styles.contactDetails}>
              {item.unread_count > 0 && (
                <View style={styles.unreadCountContainer}>
                  <Text style={styles.unreadCount}>{item.unread_count}</Text>
                </View>
              )}
              {item.last_message_time && (
                <Text style={styles.lastMessageTime}>
                  {new Date(item.last_message_time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            // Show skeleton view while loading
            <View>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.skeletonContainer}>
                  <ShimmerPlaceholder style={styles.skeletonProfile} />
                  <View style={styles.skeletonTextContainer}>
                    <ShimmerPlaceholder style={styles.skeletonText} />
                    <ShimmerPlaceholder style={styles.skeletonTextSmall} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            // Show empty state when no chats
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {search ? 'No Chats Found' : 'No Messages Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `No conversations found for "${search}"`
                  : 'Messages will appear here when you or a vendor sends a message.\nGo to your booking details to start a chat.'}
              </Text>
            </View>
          )
        }
      />
    </View>
        </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  header: {
    backgroundColor: '#F9F7F7',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  backButton: {
    marginRight: 8,
    marginTop: 5,
  },
  backButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 5,
  },
  headerText: {
    color: '#404040',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#404040',
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  profileContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 48,
    height: 48,
    backgroundColor: '#09B368',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  contactDetails: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadCountContainer: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
  },
  skeletonContainer: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  skeletonProfile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  skeletonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonText: {
    width: '60%',
    height: 12,
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonTextSmall: {
    width: '80%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#404040',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});



export default ContactList;

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import api, { IMAGE_BASE_URL } from '../../api';

const {width} = Dimensions.get('window');

const HelpDeskScreen = () => {
  const [heading, setHeading] = useState('');
  const [problem, setProblem] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const navigation = useNavigation();

  // Animation values
  const slideAnim = useState(new Animated.Value(300))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      const customerData = await AsyncStorage.getItem('customer');
      const customer = JSON.parse(customerData);
      const customerId = customer.id;

      const response = await api.get(
        `/customer/helpdesk/tickets?customer_id=${customerId}`,
      );
      console.log('Ticket response:', response.data);
      if (response.data.tickets) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

  const pickImage = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setImageUri(asset.uri);
        setImageFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'ticket_image.jpg',
        });
      }
    });
  };

  const handleRefresh = async () => {
    await fetchTickets();
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const customerData = await AsyncStorage.getItem('customer');
      const customer = JSON.parse(customerData);
      const customerId = customer.id;

      const formData = new FormData();
      formData.append('heading', heading);
      formData.append('problem', problem);
      formData.append('customer_id', customerId);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/customer/helpdesk/store', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.message === 'Ticket submitted successfully!') {
        Alert.alert('Success', 'Your ticket has been submitted');
        setHeading('');
        setProblem('');
        setImageUri(null);
        setImageFile(null);
        fetchTickets();
        setModalVisible(false);
      } else {
        Alert.alert('Error', 'Something went wrong!');
      }
    } catch (error) {
      console.error('Ticket submission error:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: { color: '#10B981', icon: 'time-outline' },
      pending: { color: '#F59E0B', icon: 'hourglass-outline' },
      closed: { color: '#6B7280', icon: 'checkmark-done' },
      resolved: { color: '#10B981', icon: 'checkmark-circle' },
      completed: { color: '#10B981', icon: 'checkmark-done' },
    };
    return configs[status?.toLowerCase()] || { color: '#95A5A6', icon: 'help-outline' };
  };

  const filteredTickets = tickets.filter(ticket => {
  if (activeTab === 'all') return true;
  if (activeTab === 'resolved') {
    return ticket.status?.toLowerCase() === 'resolved' || ticket.status?.toLowerCase() === 'completed';
  }
  return ticket.status?.toLowerCase() === activeTab;
});

  // Add image click handler
  const handleImagePress = (imageUrl) => {
    setSelectedImage(`${IMAGE_BASE_URL}/${imageUrl}`);
    setImageModalVisible(true);
  };

  const TicketBubble = ({ ticket }) => {
    const config = getStatusConfig(ticket.status);
    
    return (
      <View style={styles.bubbleCard}>
        <View style={styles.bubbleHeader}>
          <View style={[styles.bubbleIcon, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={16} color={config.color} />
          </View>
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleTitle}>{ticket.heading}</Text>
            <Text style={styles.bubbleDate}>
              {new Date(ticket.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={10} color="#FFFFFF" />
            <Text style={styles.statusPillText}>{ticket.status}</Text>
          </View>
        </View>
        
        <Text style={styles.bubbleDescription} numberOfLines={2}>
          {ticket.problem}
        </Text>

        {ticket.image && (
          <TouchableOpacity
            style={styles.bubbleImage}
            onPress={() => handleImagePress(ticket.image)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}/${ticket.image}` }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.imageBadge}>
              <Ionicons name="expand" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const TabButton = ({ tab, label, count }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}>
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
      <View style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
        <Text style={styles.tabCountText}>{count}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#065F46" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Help Center</Text>
            
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Tab Bar */}
      <View style={styles.tabContainer}>
        <TabButton tab="all" label="All" count={tickets.length} />
       
        <TabButton tab="pending" label="Pending" count={tickets.filter(t => t.status?.toLowerCase() === 'pending').length} />
        <TabButton tab="resolved" label="Resolved" count={tickets.filter(t => t.status?.toLowerCase() === 'resolved' || t.status?.toLowerCase() === 'completed').length} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#10B981']}
              tintColor="#10B981"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {filteredTickets.length === 0 ? (
            <View style={styles.creativeEmpty}>
              <View style={styles.emptyAnimation}>
                <Ionicons name="chatbubble-ellipses" size={32} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>No Tickets Found</Text>
              <Text style={styles.emptyDescription}>
                {activeTab === 'all' 
                  ? "You haven't created any support tickets yet"
                  : `No ${activeTab} tickets found`
                }
              </Text>
              <TouchableOpacity 
                style={styles.ctaButton}
                onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                <Text style={styles.ctaText}>Create First Ticket</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bubblesContainer}>
              {filteredTickets.map((ticket) => (
                <TicketBubble key={ticket.id} ticket={ticket} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Slide-up Modal */}
      <Modal visible={modalVisible} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <Animated.View style={[
            styles.modalSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="help-buoy" size={18} color="#065F46" />
                <Text style={styles.modalTitle}>New Support Request</Text>
              </View>
              <Text style={styles.modalSubtitle}>Tell us what you need help with</Text>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.Text}>Ticket Title</Text>
              <View style={styles.inputField}>
                <Ionicons name="chatbubble" size={16} color="#A0AEC0" style={styles.inputIcon} />
                
                <TextInput
                  style={styles.textInput}
                
                  placeholder="Ticket Title"
                  placeholderTextColor="#A0AEC0"
                  value={heading}
                  onChangeText={setHeading}
                />
              </View>
  <Text style={styles.Text}>Describe the isuues</Text>
              <View style={styles.inputField}>
                <Ionicons name="document-text" size={16} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor="#A0AEC0"
                  value={problem}
                  onChangeText={setProblem}
                  multiline
                  numberOfLines={4}
                />
              </View>
  <Text style={styles.Text}>Upload Photo</Text>
              <TouchableOpacity style={styles.uploadCard} onPress={pickImage}>
                {imageUri ? (
                  <View style={styles.uploadedImage}>
                    <Image source={{uri: imageUri}} style={styles.uploadPreview} />
                    <View style={styles.uploadSuccess}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload" size={24} color="#CBD5E0" />
                    <Text style={styles.uploadText}>Upload photo</Text>
                    <Text style={styles.uploadHint}>Optional</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitBtn, submitLoading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitLoading}>
                {submitLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#FFFFFF" />
                    <Text style={styles.submitText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalBackdrop}
            onPress={() => setImageModalVisible(false)}
          />
          <View style={styles.imageModalContent}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Image Preview</Text>
              <TouchableOpacity 
                onPress={() => setImageModalVisible(false)}
                style={styles.closeImageButton}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullSizeImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  // Header with Status
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    // marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  createBtn: {
    width: 38,
    height: 38,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Floating Tab Bar
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0AEC0',
    marginRight: 4,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A5568',
  },
  // Content Area
  content: {
    flex: 1,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Bubble Cards - No Shadow
  bubblesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bubbleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bubbleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bubbleContent: {
    flex: 1,
  },
  bubbleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  bubbleDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bubbleDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  bubbleImage: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  imageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  // Empty State
  creativeEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  emptyAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  handleBar: {
    width: 32,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalContent: {
    padding: 20,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 6,
    marginBottom: 2,
  },
  uploadHint: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  uploadedImage: {
    position: 'relative',
  },
  uploadPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  uploadSuccess: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#10B981',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    paddingHorizontal: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  // Image Preview Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  imageModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageModalContent: {
    margin: 20,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  imageModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeImageButton: {
    padding: 4,
  },
  fullSizeImage: {
    width: '100%',
    height: 400,
  },
  Text:{
    fontSize:14,
    color:'#4A5568',
    fontWeight:700,
    marginBottom:10,
  }
});

export default HelpDeskScreen;
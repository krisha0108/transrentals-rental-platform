import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import api, {IMAGE_BASE_URL} from '../../api';
import {
  TEAL_DEEP,
  TEAL_MID,
  TEAL,
  TEAL_LIGHT,
  BG,
  CARD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  SHADOW_SM,
  SHADOW_MD,
} from '../../../theme';

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
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDropdownOpen, setBookingDropdownOpen] = useState(false);
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '' });
  const navigation = useNavigation();

  // Animation values
  const slideAnim = useState(new Animated.Value(300))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  /* -- StatusBar management -- */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, []),
  );

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

  const fetchBookings = async () => {
    try {
      const customerData = await AsyncStorage.getItem('customer');
      const customer = JSON.parse(customerData);
      const id = customer.id;
      const ident = customer.phone || customer.email;
      // Fetch all status categories in parallel
      const statuses = ['Open', 'Confirmed', 'Ongoing', 'Completed', 'Dropped'];
      const results = await Promise.all(
        statuses.map(s =>
          api.get(`/customer/bookings?customer_id=${id}&identifier=${ident}&status=${s}`)
            .then(r => r.data.bookings || [])
            .catch(() => [])
        )
      );
      // Merge and deduplicate by id
      const allBookings = results.flat();
      const unique = [];
      const seen = new Set();
      for (const b of allBookings) {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          unique.push(b);
        }
      }
      setBookings(unique);
    } catch (e) {
      console.log('Bookings fetch error:', e.message);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchBookings();
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
      if (selectedBooking) {
        formData.append('booking_id', selectedBooking.booking_number);
        formData.append('booking_type', selectedBooking.service_type || '');
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/customer/helpdesk/store', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.message === 'Ticket submitted successfully!') {
        setHeading('');
        setProblem('');
        setImageUri(null);
        setImageFile(null);
        setSelectedBooking(null);
        fetchTickets();
        setModalVisible(false);
        setAlertModal({ visible: true, type: 'success', title: 'Ticket Submitted!', message: 'Your helpdesk ticket has been submitted successfully. We will get back to you soon.' });
      } else {
        setAlertModal({ visible: true, type: 'error', title: 'Error', message: 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setAlertModal({ visible: true, type: 'error', title: 'Error', message: error?.response?.data?.message || 'Failed to submit ticket. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusConfig = status => {
    const configs = {
      open: {color: TEAL, icon: 'time-outline'},
      pending: {color: '#F59E0B', icon: 'hourglass-outline'},
      closed: {color: '#EF4444', icon: 'close-circle'},
      resolved: {color: TEAL, icon: 'checkmark-circle'},
      completed: {color: TEAL, icon: 'checkmark-done'},
    };
    return (
      configs[status?.toLowerCase()] || {color: '#95A5A6', icon: 'help-outline'}
    );
  };

  const getBookingStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (['COMPLETED', 'CONFIRMED', 'ACCEPTED', 'PAYMENT_VERIFIED', 'BOOKING_CONFIRMED', 'QUOTE_ACCEPTED'].includes(s)) return TEAL;
    if (['PENDING', 'PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'QUOTES_RECEIVED'].includes(s)) return '#F59E0B';
    if (['IN_PROGRESS', 'IN_TRANSIT', 'LOADING', 'PACKING', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED'].includes(s)) return '#3B82F6';
    if (['CANCELLED', 'EXPIRED', 'DROPPED', 'REFUNDED'].includes(s)) return '#EF4444';
    return '#6B7280';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'resolved') {
      return (
        ticket.status?.toLowerCase() === 'resolved' ||
        ticket.status?.toLowerCase() === 'completed'
      );
    }
    return ticket.status?.toLowerCase() === activeTab;
  });

  // Build full image URL handling both "uploads/..." and bare paths
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    const cleanPath = imageUrl.startsWith('uploads/') ? imageUrl.replace('uploads/', '') : imageUrl;
    return `${IMAGE_BASE_URL}/${cleanPath}`;
  };

  // Add image click handler
  const handleImagePress = imageUrl => {
    setSelectedImage(getImageUrl(imageUrl));
    setImageModalVisible(true);
  };

  const TicketBubble = ({ticket}) => {
    const config = getStatusConfig(ticket.status);

    return (
      <View style={styles.bubbleCard}>
        {/* Left accent bar */}
        <View style={[styles.cardAccent, {backgroundColor: config.color}]} />
        <View style={styles.cardInner}>
          <View style={styles.bubbleHeader}>
            <View
              style={[
                styles.bubbleIcon,
                {backgroundColor: config.color + '18'},
              ]}>
              <Ionicons
                name={config.icon}
                size={wp('4.2%')}
                color={config.color}
              />
            </View>
            <View style={styles.bubbleContent}>
              <Text style={styles.bubbleTitle}>{ticket.heading}</Text>
              <Text style={styles.bubbleDate}>
                {new Date(ticket.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View
              style={[styles.statusPill, {backgroundColor: config.color + '18'}]}>
              <Ionicons
                name={config.icon}
                size={wp('2.5%')}
                color={config.color}
              />
              <Text style={[styles.statusPillText, {color: config.color}]}>
                {ticket.status?.toLowerCase() === 'closed' ? 'Cancelled' : ticket.status}
              </Text>
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
                source={{uri: getImageUrl(ticket.image)}}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.imageBadge}>
                <Ionicons name="expand" size={wp('2.5%')} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          {/* Admin Response */}
          {ticket.resolution && (
            <View style={styles.resolutionBox}>
              <View style={styles.resolutionHeader}>
                <Ionicons name="chatbubbles" size={wp('3.5%')} color={TEAL_MID} />
                <Text style={styles.resolutionLabel}>Admin Response</Text>
              </View>
              <Text style={styles.resolutionText}>{ticket.resolution}</Text>
              {ticket.resolvedAt && (
                <Text style={styles.resolutionDate}>
                  Resolved: {new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          )}

          {/* Ticket ID + Booking footer */}
          <View style={styles.ticketFooter}>
            <View style={styles.ticketIdRow}>
              <Ionicons
                name="pricetag-outline"
                size={wp('2.8%')}
                color={TEXT_MUTED}
              />
              <Text style={styles.ticketIdText}>#{ticket.ticket_no || ticket.id}</Text>
            </View>
            {ticket.booking_id && (
              <View style={styles.ticketIdRow}>
                <Ionicons name="car" size={wp('2.8%')} color={TEXT_MUTED} />
                <Text style={styles.ticketIdText}>{ticket.booking_id}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const TabButton = ({tab, label, count}) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}>
      <Text
        style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
      <View
        style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
        <Text
          style={[
            styles.tabCountText,
            activeTab === tab && styles.tabCountTextActive,
          ]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /* -- Loading Skeleton -- */
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />
        {/* Gradient Header */}
        <View style={styles.headerClip}>
          <LinearGradient
            colors={[TEAL_DEEP, TEAL_MID, '#047857']}
            style={styles.headerGrad}>
            <View
              style={[
                styles.decoCircle,
                {
                  top: -hp('3%'),
                  right: -wp('5%'),
                  width: wp('25%'),
                  height: wp('25%'),
                },
              ]}
              pointerEvents="none"
            />
            <View
              style={[
                styles.decoCircle,
                {
                  bottom: -hp('2%'),
                  left: -wp('4%'),
                  width: wp('15%'),
                  height: wp('15%'),
                },
              ]}
              pointerEvents="none"
            />
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}>
                <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Help Center</Text>
              <View style={styles.headerActionPlaceholder} />
            </View>
          </LinearGradient>
        </View>
        {/* Skeleton Cards */}
        <ScrollView
          style={{flex: 1, backgroundColor: BG}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: hp('12%')}}>
          <View style={styles.skeletonTabRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.skeletonTab} />
            ))}
          </View>
          <View style={styles.bubblesContainer}>
            {[...Array(5)].map((_, index) => (
              <View key={index} style={styles.skeletonCard}>
                <View style={styles.skeletonAccent} />
                <View style={styles.skeletonInner}>
                  <View style={styles.skeletonHeaderRow}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonTexts}>
                      <View
                        style={[
                          styles.skeletonLine,
                          {width: '65%', height: hp('1.2%')},
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLine,
                          {width: '40%', height: hp('1%')},
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.skeletonContentArea}>
                    <View
                      style={[
                        styles.skeletonLine,
                        {width: '100%', height: hp('1%')},
                      ]}
                    />
                    <View
                      style={[
                        styles.skeletonLine,
                        {width: '75%', height: hp('1%')},
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* Gradient Header */}
      <View style={styles.headerClip}>
        <LinearGradient
          colors={[TEAL_DEEP, TEAL_MID, '#047857']}
          style={styles.headerGrad}>
          {/* Decorative circles */}
          <View
            style={[
              styles.decoCircle,
              {
                top: -hp('3%'),
                right: -wp('5%'),
                width: wp('25%'),
                height: wp('25%'),
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.decoCircle,
              {
                bottom: -hp('2%'),
                left: -wp('4%'),
                width: wp('15%'),
                height: wp('15%'),
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.decoCircle,
              {
                top: hp('1%'),
                left: wp('30%'),
                width: wp('10%'),
                height: wp('10%'),
                opacity: 0.04,
              },
            ]}
            pointerEvents="none"
          />

          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}>
              <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help Center</Text>
            <TouchableOpacity
              style={styles.newTicketBtn}
              onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={wp('4.5%')} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Floating Tab Bar */}
      <View style={styles.tabContainer}>
        <TabButton tab="all" label="All" count={tickets.length} />
        <TabButton
          tab="pending"
          label="Pending"
          count={
            tickets.filter(t => t.status?.toLowerCase() === 'pending').length
          }
        />
        <TabButton
          tab="resolved"
          label="Resolved"
          count={
            tickets.filter(
              t =>
                t.status?.toLowerCase() === 'resolved' ||
                t.status?.toLowerCase() === 'completed',
            ).length
          }
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[TEAL]}
              tintColor={TEAL}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {filteredTickets.length === 0 ? (
            <View style={styles.creativeEmpty}>
              <LinearGradient
                colors={[TEAL_LIGHT, '#A7F3D0']}
                style={styles.emptyIconGradient}>
                <View style={styles.emptyIconInner}>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={wp('10%')}
                    color={TEAL}
                  />
                </View>
              </LinearGradient>
              <Text style={styles.emptyTitle}>No Tickets Found</Text>
              <Text style={styles.emptyDescription}>
                {activeTab === 'all'
                  ? "You haven't created any support tickets yet"
                  : `No ${activeTab} tickets found`}
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => setModalVisible(true)}>
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  style={styles.ctaGradient}>
                  <Ionicons
                    name="add-circle"
                    size={wp('3.8%')}
                    color="#FFFFFF"
                  />
                  <Text style={styles.ctaText}>Create First Ticket</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bubblesContainer}>
              {filteredTickets.map(ticket => (
                <TicketBubble key={ticket.id} ticket={ticket} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Slide-up Modal */}
      <Modal visible={modalVisible} transparent animationType="none">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.modalOverlay, {opacity: fadeAnim}]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <Animated.View
            style={[
              styles.modalSheet,
              {transform: [{translateY: slideAnim}]},
            ]}>
            {/* Gradient accent stripe */}
            <LinearGradient
              colors={[TEAL_DEEP, TEAL_MID, TEAL]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.modalAccentStripe}
            />

            {/* Handle Bar */}
            <View style={styles.handleBar} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconCircle}>
                  <Ionicons
                    name="help-buoy"
                    size={wp('4.5%')}
                    color={TEAL_MID}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>New Support Request</Text>
                  <Text style={styles.modalSubtitle}>
                    Tell us what you need help with
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={wp('4.5%')}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Ticket Title</Text>
              <View style={styles.inputField}>
                <Ionicons
                  name="chatbubble"
                  size={wp('4%')}
                  color={TEXT_MUTED}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ticket Title"
                  placeholderTextColor={TEXT_MUTED}
                  value={heading}
                  onChangeText={setHeading}
                />
              </View>

              <Text style={styles.fieldLabel}>Describe the issues</Text>
              <View style={styles.inputField}>
                <Ionicons
                  name="document-text"
                  size={wp('4%')}
                  color={TEXT_MUTED}
                  style={[styles.inputIcon, {alignSelf: 'flex-start', marginTop: hp('1.5%')}]}
                />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor={TEXT_MUTED}
                  value={problem}
                  onChangeText={setProblem}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Text style={styles.fieldLabel}>Related Booking (Optional)</Text>
              <TouchableOpacity
                style={styles.inputField}
                onPress={() => setBookingDropdownOpen(!bookingDropdownOpen)}>
                <Ionicons
                  name="document-text-outline"
                  size={wp('4%')}
                  color={TEXT_MUTED}
                  style={styles.inputIcon}
                />
                <Text style={[styles.textInput, {color: selectedBooking ? TEXT_PRIMARY : TEXT_MUTED, paddingVertical: hp('1.5%')}]}>
                  {selectedBooking
                    ? `${selectedBooking.booking_number} — ${selectedBooking.location_name || ''}${selectedBooking.destination ? ' → ' + selectedBooking.destination : ''}`
                    : 'Select a booking...'}
                </Text>
                <Ionicons
                  name={bookingDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={wp('4%')}
                  color={TEXT_MUTED}
                />
              </TouchableOpacity>
              {bookingDropdownOpen && (
                <View style={styles.bookingDropdown}>
                  <TouchableOpacity
                    style={styles.bookingDropdownItem}
                    onPress={() => { setSelectedBooking(null); setBookingDropdownOpen(false); }}>
                    <Text style={[styles.bookingItemText, {color: TEXT_MUTED}]}>None</Text>
                  </TouchableOpacity>
                  <ScrollView style={{maxHeight: hp('25%')}} nestedScrollEnabled>
                    {bookings.map(b => (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.bookingDropdownItem,
                          selectedBooking?.id === b.id && {backgroundColor: TEAL_LIGHT},
                        ]}
                        onPress={() => { setSelectedBooking(b); setBookingDropdownOpen(false); }}>
                        <View>
                          <Text style={styles.bookingItemTitle}>{b.booking_number}</Text>
                          <Text style={styles.bookingItemSub}>
                            {b.service_name} — {b.location_name || ''}{b.destination ? ' → ' + b.destination : ''}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, {backgroundColor: getBookingStatusColor(b.status) + '18'}]}>
                          <Text style={{fontSize: wp('2.2%'), color: getBookingStatusColor(b.status), fontWeight: '600'}}>
                            {b.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.fieldLabel}>Upload Photo</Text>
              <TouchableOpacity style={styles.uploadCard} onPress={pickImage}>
                {imageUri ? (
                  <View style={styles.uploadedImage}>
                    <Image
                      source={{uri: imageUri}}
                      style={styles.uploadPreview}
                    />
                    <View style={styles.uploadSuccess}>
                      <Ionicons
                        name="checkmark"
                        size={wp('3%')}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <View style={styles.uploadIconCircle}>
                      <Ionicons
                        name="cloud-upload"
                        size={wp('6%')}
                        color={TEAL}
                      />
                    </View>
                    <Text style={styles.uploadText}>Upload photo</Text>
                    <Text style={styles.uploadHint}>Optional</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitLoading && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitLoading}>
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  style={styles.submitGradient}>
                  {submitLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="send"
                        size={wp('3.8%')}
                        color="#FFFFFF"
                      />
                      <Text style={styles.submitText}>Submit Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalHeader}>
            <Text style={styles.imageModalTitle}>Image Preview</Text>
            <TouchableOpacity
              onPress={() => setImageModalVisible(false)}
              style={styles.closeImageButton}>
              <Ionicons name="close" size={wp('5%')} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.imageModalBody}
            onPress={() => setImageModalVisible(false)}
          >
            {selectedImage ? (
              <Image
                source={{uri: selectedImage}}
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
            ) : null}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={[styles.alertIconCircle, alertModal.type === 'success' ? styles.alertIconSuccess : styles.alertIconError]}>
              <Ionicons
                name={alertModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={wp('12%')}
                color={alertModal.type === 'success' ? TEAL : '#EF4444'}
              />
            </View>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity
              style={styles.alertBtn}
              activeOpacity={0.8}
              onPress={() => setAlertModal({ visible: false, type: '', title: '', message: '' })}
            >
              <LinearGradient
                colors={alertModal.type === 'success' ? [TEAL, '#059669'] : ['#EF4444', '#DC2626']}
                style={styles.alertBtnGradient}
              >
                <Text style={styles.alertBtnText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  /* -- Header Gradient Wrapper -- */
  headerClip: {
    overflow: 'hidden',
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    ...SHADOW_MD,
  },
  headerGrad: {
    paddingTop:
      Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('1%'),
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  newTicketBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionPlaceholder: {
    width: wp('10%'),
    height: wp('10%'),
  },

  /* -- Floating Tab Bar -- */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('3.5%'),
    padding: wp('1.2%'),
    ...SHADOW_SM,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1%'),
    borderRadius: wp('2.5%'),
    marginHorizontal: wp('0.5%'),
  },
  tabButtonActive: {
    backgroundColor: TEAL_MID,
  },
  tabText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_MUTED,
    marginRight: wp('1%'),
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: wp('1.8%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2%'),
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: wp('2.5%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  /* -- Content Area -- */
  content: {
    flex: 1,
    paddingTop: hp('1.5%'),
  },
  scrollContent: {
    paddingBottom: hp('4%'),
  },

  /* -- Ticket Cards -- */
  bubblesContainer: {
    paddingHorizontal: wp('4%'),
    gap: hp('1.5%'),
  },
  bubbleCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  cardAccent: {
    width: wp('1.2%'),
    borderTopLeftRadius: wp('4%'),
    borderBottomLeftRadius: wp('4%'),
  },
  cardInner: {
    flex: 1,
    padding: wp('3.5%'),
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  bubbleIcon: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2.5%'),
  },
  bubbleContent: {
    flex: 1,
  },
  bubbleTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  bubbleDate: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  bubbleDescription: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('5%'),
    marginBottom: hp('1%'),
  },
  bubbleImage: {
    position: 'relative',
    marginBottom: hp('1%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: hp('12%'),
    borderRadius: wp('3%'),
  },
  imageBadge: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('3%'),
    gap: wp('1%'),
  },
  statusPillText: {
    fontSize: wp('2.5%'),
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  resolutionBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: wp('2.5%'),
    padding: wp('3%'),
    marginTop: hp('0.8%'),
    borderLeftWidth: 3,
    borderLeftColor: TEAL_MID,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    marginBottom: hp('0.5%'),
  },
  resolutionLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEAL_MID,
  },
  resolutionText: {
    fontSize: wp('3%'),
    color: '#065F46',
    lineHeight: wp('4.5%'),
  },
  resolutionDate: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    marginTop: hp('0.5%'),
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: hp('0.8%'),
    marginTop: hp('0.5%'),
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  ticketIdText: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },

  /* -- Empty State -- */
  creativeEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('10%'),
    paddingHorizontal: wp('8%'),
  },
  emptyIconGradient: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconInner: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('2.5%'),
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: wp('3.3%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: wp('5.2%'),
    fontWeight: '400',
    marginTop: hp('1%'),
    marginBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
  },
  ctaButton: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    gap: wp('2%'),
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: wp('3.2%'),
  },

  /* -- Create Ticket Modal -- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    paddingBottom: hp('2.5%'),
    maxHeight: '85%',
    overflow: 'hidden',
    flexShrink: 1,
  },
  modalAccentStripe: {
    height: hp('0.5%'),
    width: '100%',
  },
  handleBar: {
    width: wp('8%'),
    height: hp('0.4%'),
    backgroundColor: '#E5E7EB',
    borderRadius: wp('1%'),
    alignSelf: 'center',
    marginTop: hp('1%'),
    marginBottom: hp('0.8%'),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    flex: 1,
  },
  modalIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modalSubtitle: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },
  modalCloseBtn: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flexShrink: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  fieldLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
    fontWeight: '700',
    marginBottom: hp('0.8%'),
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: wp('2.5%'),
  },
  textInput: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
  },
  textArea: {
    height: hp('10%'),
    textAlignVertical: 'top',
  },
  uploadCard: {
    borderWidth: 1.5,
    borderColor: TEAL_LIGHT,
    borderStyle: 'dashed',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
    backgroundColor: '#F0FDF4',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  uploadText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
    marginBottom: hp('0.2%'),
  },
  uploadHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
  },
  uploadedImage: {
    position: 'relative',
  },
  uploadPreview: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('3%'),
  },
  uploadSuccess: {
    position: 'absolute',
    top: -wp('1.5%'),
    right: -wp('1.5%'),
    backgroundColor: TEAL,
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('1%'),
    paddingBottom: hp('1.5%'),
  },
  submitBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    gap: wp('2%'),
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },

  /* -- Image Preview Modal -- */
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('5%'),
    paddingBottom: hp('1.5%'),
  },
  imageModalTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeImageButton: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
  },

  /* -- Skeleton Loading -- */
  skeletonTabRow: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  skeletonTab: {
    flex: 1,
    height: hp('4%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#E5E7EB',
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  skeletonAccent: {
    width: wp('1.2%'),
    backgroundColor: TEAL_LIGHT,
    borderTopLeftRadius: wp('4%'),
    borderBottomLeftRadius: wp('4%'),
  },
  skeletonInner: {
    flex: 1,
    padding: wp('3.5%'),
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  skeletonIcon: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
    marginRight: wp('2.5%'),
  },
  skeletonTexts: {
    flex: 1,
    gap: hp('0.6%'),
  },
  skeletonContentArea: {
    gap: hp('0.6%'),
  },
  skeletonLine: {
    height: hp('1%'),
    borderRadius: wp('1.5%'),
    backgroundColor: '#E5E7EB',
  },
  bookingDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: hp('0.5%'),
    marginBottom: hp('1%'),
    ...SHADOW_SM,
  },
  bookingDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bookingItemTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  bookingItemSub: {
    fontSize: wp('2.6%'),
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  bookingItemText: {
    fontSize: wp('3.2%'),
    fontWeight: '500',
  },
  // Custom Alert Modal
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: wp('5%'),
    paddingVertical: hp('3.5%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
    width: '100%',
  },
  alertIconCircle: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  alertIconSuccess: {
    backgroundColor: TEAL_LIGHT,
  },
  alertIconError: {
    backgroundColor: '#FEE2E2',
  },
  alertTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('2.5%'),
  },
  alertBtn: {
    width: '100%',
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  alertBtnGradient: {
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    borderRadius: wp('3%'),
  },
  alertBtnText: {
    color: '#FFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },
});

export default HelpDeskScreen;

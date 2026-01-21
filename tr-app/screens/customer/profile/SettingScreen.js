import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {Share} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import DeviceInfo from 'react-native-device-info';
import { IMAGE_BASE_URL } from '../../api';

const SettingScreen = ({navigation}) => {
  const currentVersion = DeviceInfo.getVersion();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const customerData = await AsyncStorage.getItem('customer');
      if (customerData) {
        const parsedCustomer = JSON.parse(customerData);
        setCustomer(parsedCustomer);
      }
    } catch (error) {
      console.log('Error refreshing customer data:', error);
    }
    setRefreshing(false);
  };

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message:
          'TransRentals - Your trusted vehicle rental service! Rent cars, bikes, trucks with ease. Visit https://play.google.com/store/apps/details?id=com.transrentals.app&pcampaignid=web_share  to download our app and get started!',
        url: 'https://transrentals.in/',
        title: 'TransRentals - Vehicle Rentals Made Easy',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type: ', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      alert('Error sharing app: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      const customerData = await AsyncStorage.getItem('customer');
      console.log('Customer Data:', customerData);
      if (customerData) {
        const parsedCustomer = JSON.parse(customerData);
        setCustomer(parsedCustomer);
      }
    };

    fetchCustomerData();
    GoogleSignin.configure({
      webClientId: '365663447950-o996ep372bp2ejippsphe3ktjpen221e.apps.googleusercontent.com',
    });
  }, []);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CustomerDashboard');
    }
  };

  const handleLogout = async () => {
    try {
      const user = await GoogleSignin.getCurrentUser();
      if (user) {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        console.log(':white_check_mark: Google user signed out');
      }
      await AsyncStorage.multiRemove(['customer', 'customer_id', 'token']);
      navigation.replace('Login');
    } catch (error) {
      console.log(':x: Logout error:', error);
    }
  };

  const imageUrl = customer?.image
    ? `${IMAGE_BASE_URL}/profile_images/${customer.image}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

        {/* Normal Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#2D3748" />
          </TouchableOpacity>
        </View>

        {/* Modern Profile Section - Redesigned */}
        <View style={styles.profileSection}>
          <View style={styles.profileBackground} />
          <View style={styles.profileContent}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrapper}>
                {imageUrl ? (
                  <Image source={{uri: imageUrl}} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={28} color="#4A5568" />
                  </View>
                )}
                    <TouchableOpacity 
    style={styles.editIconButton}
    onPress={() => navigation.navigate('EditProfileScreen')}>
    <Ionicons name="create" size={13} color="#FFFFFF" />
  </TouchableOpacity>
  
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {String(customer?.name || 'No Name')}
                </Text>
                <Text style={styles.userEmail}>
                  {String(customer?.email || 'Email not submitted')}
                </Text>
                {/* <View style={styles.memberBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                  <Text style={styles.memberText}>Premium Member</Text>
                </View> */}
                 <View style={styles.memberBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#09b97fff" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
              </View>
              
            </View>
       

      
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BackrTokensScreen')}>
            <View style={[styles.actionIcon, {backgroundColor: '#EBF8FF'}]}>
              <Image source={require('../../../assets/backerCoin2.png')} style={styles.actionImage} />
            </View>
            <Text style={styles.actionText}>Backr Coin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('HelpdeskScreen')}>
            <View style={[styles.actionIcon, {backgroundColor: '#F0FFF4'}]}>
              <Image source={require('../../../assets/helpdesk.png')} style={styles.actionImage} />
            </View>
            <Text style={styles.actionText}>Helpdesk</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ExpensesScreen')}>
            <View style={[styles.actionIcon, {backgroundColor: '#FFF5F5'}]}>
              <Image source={require('../../../assets/payments.png')} style={styles.actionImage} />
            </View>
            <Text style={styles.actionText}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyBookings')}>
            <View style={[styles.actionIcon, {backgroundColor: '#FAF5FF'}]}>
              <Image source={require('../../../assets/mybooking.png')} style={styles.actionImage} />
            </View>
            <Text style={styles.actionText}>Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* Social Links */}
        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialGrid}>
            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => Linking.openURL('http://instagram.com/transrentals_in/')}>
              <View style={styles.socialIconWrapper}>
                <Image source={require('../../../assets/insta.png')} style={styles.socialIcon} />
              </View>
              <Text style={styles.socialLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => Linking.openURL('https://www.facebook.com/Transrentalsindia/')}>
              <View style={styles.socialIconWrapper}>
                <Image source={require('../../../assets/facebook.png')} style={styles.socialIcon} />
              </View>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => Linking.openURL('https://www.linkedin.com/company/transrentals/')}>
              <View style={styles.socialIconWrapper}>
                <Image source={require('../../../assets/linkedin.png')} style={styles.socialIcon} />
              </View>
              <Text style={styles.socialLabel}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleShareApp}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrapper}>
                  <Image source={require('../../../assets/shareApp.png')} style={styles.menuIcon} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Share App</Text>
                  <Text style={styles.menuSubtitle}>Invite friends to TransRentals</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AboutUsScreen')}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrapper}>
                  <Image source={require('../../../assets/AboutUss.png')} style={styles.menuIcon} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>About Us</Text>
                  <Text style={styles.menuSubtitle}>Learn more about TransRentals</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconWrapper, {backgroundColor: '#FED7D7'}]}>
                  <Image source={require('../../../assets/LogOut.png')} style={styles.menuIcon} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, styles.logoutTitle]}>Log Out</Text>
                  <Text style={styles.menuSubtitle}>Sign out of your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Image
              source={require('../../../assets/LogoGreySc.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.version}>Version {currentVersion}</Text>
            <Text style={styles.copyright}>© 2024 TransRentals</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    position: 'relative',
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  profileBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
  },
  profileContent: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4fceaff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionImage: {
    width: 22,
    height: 22,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
  },
  socialSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  socialGrid: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 16,
  },
  socialCard: {
    flex: 1,
    alignItems: 'center',
  },
  socialIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    width: 20,
    height: 20,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  logoutTitle: {
    color: '#E53E3E',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#718096',
  },
  footer: {
    backgroundColor: '#1A202C',
    paddingVertical: 30,
  },
  footerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 35,
    marginBottom: 12,
    opacity: 0.7,
  },
  version: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#718096',
  },
});

export default SettingScreen;
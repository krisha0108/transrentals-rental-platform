import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import api, { IMAGE_BASE_URL } from '../../api';
import { profileService } from '../../services';

const EditProfileScreen = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCustomerData = async () => {
      const customerData = await AsyncStorage.getItem('customer');
      console.log("customer data", customerData);
      if (customerData) {
        const customer = JSON.parse(customerData);
        setCustomer(customer);
        setName(customer.name);
        setEmail(customer.email);
        if (customer.phone) {
          setPhone(customer.phone);
        }
        console.log("images",customer.image);

            if (customer.image) {
        const imageUrl = `${IMAGE_BASE_URL}/profile_images/${customer.image}`;
        console.log("Profile Image URL:", imageUrl);
        setProfileImage(imageUrl);
      }
      }
      setLoading(false);
    };

    fetchCustomerData();
  }, []);
  
  const handleSaveProfile = async () => {
    const formData = new FormData();
    formData.append('customer_id', customer.id);

    if (password.trim() !== '') {
      formData.append('password', password);
    }
 
    if (name !== customer.name) formData.append('name', name);
    if (email !== customer.email) formData.append('email', email);
    if (phone) formData.append('phone', phone);

    // Only upload image if it's a new local file (not an HTTP URL)
    if (profileImage && !profileImage.startsWith('http')) {
      const localUri = profileImage;
      const filename = localUri.split('/').pop();
      const type = `image/jpeg`;

      formData.append('image', {
        uri: localUri,
        type,
        name: filename,
      });
    }

    try {
      setLoading(true); 
      const token = await AsyncStorage.getItem('token'); 

      if (!token) {
        alert('Authorization token not found. Please log in again.');
        return;
      }

      const response = await api.post('/customer/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      try {
        const result = response.data;
        console.log('Parsed Response:', result);

        if (result.success) {
          alert(result.message);
          const updatedCustomer = { ...customer, name, email, phone: result.customer.phone,
             has_password: result.has_password, image: result.customer.image  };
          await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));
          setCustomer(updatedCustomer); 
          setName(updatedCustomer.name);
          setEmail(updatedCustomer.email);
          setPhone(updatedCustomer.phone);
          setProfileImage(`${IMAGE_BASE_URL}/profile_images/${updatedCustomer.image}`);
        } 
        else {
          alert('Failed to update profile');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        alert('The response is not in valid JSON format. Please try again later.');
      }

    } catch (error) {
      console.log(error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false); 
    }
  };

  const handleImagePick = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (response.didCancel) {
        console.log('Image picker canceled');
      } else if (response.errorCode) {
        console.log('Image picker error: ', response.errorMessage);
      } else {
        setProfileImage(response.assets[0].uri); 
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="small" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={20} color="#065F46" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={32} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity style={styles.editPhotoBtn} onPress={handleImagePick}>
              <Icon name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoText}>Update Photo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="person-outline" size={16} color="#6B7280" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={16} color="#6B7280" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Phone Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <Icon name="call-outline" size={16} color="#6B7280" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {customer?.has_password ? 'New Password' : 'Create Password'}
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={16} color="#6B7280" style={styles.fieldIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder={customer?.has_password ? 'Enter new password' : 'Create password'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={hidePassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setHidePassword(!hidePassword)} style={styles.eyeIcon}>
                <Icon name={hidePassword ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="checkmark" size={16} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
  headerRight: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  formSection: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
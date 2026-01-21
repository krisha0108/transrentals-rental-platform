import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
 import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileCheckModal = () => {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const storedCustomer = await AsyncStorage.getItem('customer');
        if (!storedCustomer) return;

        const customer = JSON.parse(storedCustomer);
        const isIncomplete = !customer?.name || !customer?.email || !customer?.phone || !customer?.password ;

        if (isIncomplete) {
          setTimeout(() => setVisible(true), 2000); // Show modal after 3 sec
        }
      } catch (error) {
        console.error('Profile check failed', error);
      }
    };

    checkProfile();
  }, []);

  const handleCompleteProfile = () => {
    setVisible(false);
    navigation.navigate('EditProfileScreen');
  };

  return (
    <SafeAreaView>
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* ❌ Close Icon */}
          <TouchableOpacity style={styles.closeIcon} onPress={() => setVisible(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.message}>Please complete your profile to make a booking.</Text>

          <TouchableOpacity style={styles.button} onPress={handleCompleteProfile}>
            <Text style={styles.buttonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
};

export default ProfileCheckModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    width: '85%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative'
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    zIndex: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555'
  },
  button: {
    backgroundColor: '#09B368',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

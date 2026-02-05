import React, {useState, useEffect, useRef} from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Same URL config as screens/api/client.js
const DEFAULT_PROD = "https://transrentals.in";
const DEFAULT_DEV_ANDROID = "http://192.168.29.68:3000";
const DEFAULT_DEV_IOS = "http://localhost:3000";

function getBaseURL() {
  if (__DEV__) {
    return Platform.OS === "android" ? DEFAULT_DEV_ANDROID : DEFAULT_DEV_IOS;
  }
  return DEFAULT_PROD;
}

const requiredFields = [
  'company_name',
  'company_email',
  'company_address',
  'company_phone_number',
  'date_of_birth',
  'gender',
];
const NotVerifiedModal = ({navigation}) => {
  const [visible, setVisible] = useState(false);
  const [vendorStatus, setVendorStatus] = useState(null);
  const [vendorRequest, setVendorRequest] = useState(null);
  const intervalRef = useRef(null);
  const [modalType, setModalType] = useState(null);
function areRequiredFieldsFilled(vendor) {
  for (let field of requiredFields) {
    if (
      !vendor[field] || // null, undefined, empty string
      (typeof vendor[field] === 'string' && vendor[field].trim() === '')
    ) {
      return false; // missing or empty field found
    }
  }
  return true; // all required fields filled
}

  const checkVendor = async () => {
  try {
    const vendorId = await AsyncStorage.getItem('vendor_id');
    if (!vendorId) return;

    const res = await axios.get(`${getBaseURL()}/api/vendor/vendor-profile/${vendorId}`);
    const vendor = res.data.vendor;
    const request = res.data.vendor_request;

    setVendorStatus(vendor.status);
    setVendorRequest(request);

    const filled = areRequiredFieldsFilled(vendor);

    if (!filled) {
      setVisible(true);
      setModalType('fillDetails');
      return;
    }

    if (vendor.status === 'pending') {
      setVisible(true);
      setModalType('waitingApproval');
      return;
    }

    if (vendor.status === 'approved') {
      if (!request) {
        setVisible(true);
        setModalType('sendRequest');
        return;
      }
      if (request.status === 'pending') {
        setVisible(true);
        setModalType('requestPending');
        return;
      }
      if (request.status === 'approved') {
        setVisible(false);
        setModalType(null);
        return;
      }
      if (request.status === 'rejected') {
        setVisible(true);
        setModalType('requestRejected');
        return;
      }
    }

    // Default fallback
    setVisible(false);
    setModalType(null);
  } catch (err) {
    console.error('Error checking vendor:', err);
  }
};
  useEffect(() => {
    checkVendor();
    intervalRef.current = setInterval(checkVendor, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => setVisible(false)}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        
{modalType === 'fillDetails' && (
  <>
    <Text style={styles.title}>Complete Your Company Details</Text>
    <Text style={styles.subtitle}>
      🚫 Please fill all the required company details to proceed.
    </Text>
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        setVisible(false);
        navigation.navigate('VendorDetailFormScreen');
      }}>
      <Text style={styles.buttonText}>Fill Details</Text>
    </TouchableOpacity>
  </>
)}

{modalType === 'waitingApproval' && (
  <>
    <Text style={styles.title}>Company Approval Pending</Text>
    <Text style={styles.subtitle}>
      ⏳ Your company details are submitted. Waiting for admin approval.
    </Text>
  </>
)}

{modalType === 'sendRequest' && (
  <>
    <Text style={styles.title}>Send Location & Service Request</Text>
    <Text style={styles.subtitle}>
      🚫 You have not sent a request for location and service yet.
    </Text>
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        setVisible(false);
        navigation.navigate('AddRequestBookingScreen');
      }}>
      <Text style={styles.buttonText}>Send Request</Text>
    </TouchableOpacity>
  </>
)}

{modalType === 'requestPending' && (
  <>
    <Text style={styles.title}>Request Pending</Text>
    <Text style={styles.subtitle}>
      ⏳ Your request for service/location is pending approval.
    </Text>
  </>
)}

{modalType === 'requestRejected' && (
  <>
    <Text style={styles.title}>Request Rejected</Text>
    <Text style={styles.subtitle}>
      🚫 Your request was rejected. Please update your details and try again.
    </Text>
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        setVisible(false);
        navigation.navigate('VendorRequestFormScreen');
      }}>
      <Text style={styles.buttonText}>Edit Request</Text>
    </TouchableOpacity>
  </>
)}
        </View>
      </View>
    </Modal>
  );
};
export default NotVerifiedModal;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#444',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 40,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
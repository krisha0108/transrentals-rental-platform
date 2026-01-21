// React Native Staff Module with Modal + Dynamic Roles + Card Design Updated

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.29.234:8000/api';

const StaffScreen = () => {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [toggleStatus, setToggleStatus] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    license_number: '',
    license_expiry_date: '',
    status: 'active',
  });

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_URL}/roles`);
      setRoles(res.data);
      setRole(res.data[0]);
    } catch (err) {
      Alert.alert('Error fetching roles');
    }
  };
  const handleToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    // Update local state for instant UI feedback
    setToggleStatus(prev => ({...prev, [id]: newStatus}));

    try {
      // Send API update to backend
      await axios.put(`${API_URL}/vendor/staff/update/${id}`, {
        status: newStatus,
      });
      // Optionally refresh staff list or handle errors
    } catch (error) {
      Alert.alert('Error updating status');
      // Revert toggle on error
      setToggleStatus(prev => ({...prev, [id]: currentStatus}));
    }
  };

  const fetchStaff = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('vendor');
      const vendor = JSON.parse(vendorData);
      const vendorId = vendor?.id;

      if (!vendorId) {
        Alert.alert('Error', 'Vendor not found. Please login again.');
        return;
      }

      const res = await axios.get(`${API_URL}/staff/vendor/${vendorId}`);
      setStaffList(res.data);
    } catch (err) {
      Alert.alert('Error fetching staff');
    }
  };

  const handleSubmit = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('vendor');
      const vendor = JSON.parse(vendorData);
      const vendorId = vendor?.id;

      if (!vendorId || !role) {
        Alert.alert('Error', 'Vendor or Role missing.');
        return;
      }

      const payload = {
        ...formData,
        vendor_id: vendorId,
        role_id: role.id,
        role_name: role.role_name,
      };

      if (role.role_name.toLowerCase() !== 'driver') {
        payload.license_number = null;
        payload.license_expiry_date = null;
      }

      await axios.post(`${API_URL}/staff/store`, payload);
      Alert.alert('Staff added');
      setFormVisible(false);
      fetchStaff();
    } catch (err) {
      Alert.alert('Error submitting form');
    }
  };

  const renderStaffItem = ({item, index}) => (
    <View style={styles.staffCard}>
      <View style={styles.staffHeader}>
        <View style={styles.numberCircle}>
          <Text style={styles.staffIndex}>{index + 1}</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
          <View style={styles.addressPhoneRow}>
            <Text
              style={styles.staffAddress}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.address}
            </Text>
          </View>
        </View>
        <View style={styles.roleBagdeContainer}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{item.role_name}</Text>
          </View>
          <Text style={styles.staffPhone}>{item.phone}</Text>
        </View>
      </View>
      {/* <View style={styles.staffRow}>
       
        <Text>{item.phone}</Text>
      </View> */}
      <View style={styles.separator} /> {/* Horizontal line below address */}
      {item.role_name.toLowerCase() === 'driver' && (
        <>
          <View style={styles.licenseStatusRow}>
            <View style={styles.licenseNumberBlock}>
              <Text style={styles.staffLabel}>
                License Number:{' '}
                <Text style={styles.licenseValue}>{item.license_number}</Text>
              </Text>
            </View>
            <View style={styles.statusBlock}>
              <Text style={styles.staffLabel}>Status</Text>
            </View>
          </View>

          <View style={styles.licenseYearStatusToggleRow}>
            <View style={styles.licenseYearBlock}>
              <Text style={styles.staffLabel}>
                License Year:{' '}
                <Text style={styles.licenseValue}>
                  {item.license_expiry_date}
                </Text>
              </Text>
            </View>
            <View style={styles.statusToggleBlock}>
              <Switch
                value={
                  toggleStatus[item.id]
                    ? toggleStatus[item.id] === 'active'
                    : item.status === 'active'
                }
                onValueChange={() =>
                  handleToggle(item.id, toggleStatus[item.id] || item.status)
                }
                trackColor={{false: '#ccc', true: 'green'}}
                thumbColor={
                  toggleStatus[item.id] === 'active' || item.status === 'active'
                    ? '#fff'
                    : '#f4f3f4'
                }
              />
            </View>
          </View>
        </>
      )}
      {item.role_name.toLowerCase() !== 'driver' && (
        <View style={styles.statusContainerSingle}>
          <Text style={styles.staffLabel}>Status</Text>
          <Switch
            value={
              toggleStatus[item.id]
                ? toggleStatus[item.id] === 'active'
                : item.status === 'active'
            }
            onValueChange={() =>
              handleToggle(item.id, toggleStatus[item.id] || item.status)
            }
            trackColor={{false: '#ccc', true: 'green'}}
            thumbColor={
              toggleStatus[item.id] === 'active' || item.status === 'active'
                ? '#fff'
                : '#f4f3f4'
            }
          />
        </View>
      )}
    </View>
  );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Staff</Text>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setFormVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Staff</Text>
      </TouchableOpacity>

      <Modal transparent visible={formVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.heading}>Add Staff</Text>
            <View style={styles.roleSelector}>
              {roles.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.roleBtn,
                    role?.id === r.id && styles.selectedRole,
                  ]}
                  onPress={() => setRole(r)}>
                  <Text style={styles.roleText}>{r.role_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#b9b9b9"
              onChangeText={text => setFormData({...formData, name: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#b9b9b9"
              onChangeText={text => setFormData({...formData, email: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#b9b9b9"
              onChangeText={text => setFormData({...formData, phone: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="#b9b9b9"
              onChangeText={text => setFormData({...formData, address: text})}
            />
            {role?.role_name.toLowerCase() === 'driver' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="License Number"
                  placeholderTextColor="#b9b9b9"
                  onChangeText={text =>
                    setFormData({...formData, license_number: text})
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Expiry Year"
                  placeholderTextColor="#b9b9b9"
                  onChangeText={text =>
                    setFormData({...formData, license_expiry_date: text})
                  }
                />
              </>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFormVisible(false)}>
              <Text style={{marginTop: 10, color: 'red', textAlign: 'center'}}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={staffList}
        keyExtractor={item => item.id.toString()}
        renderItem={renderStaffItem}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, backgroundColor: '#fff'},
  heading: {fontSize: 22, fontWeight: '600', marginBottom: 10},
  addBtn: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  addBtnText: {color: 'white'},
  roleSelector: {flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10},
  roleBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedRole: {backgroundColor: 'green'},
  roleText: {color: '#fff'},
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  submitBtn: {backgroundColor: 'green', padding: 12, borderRadius: 6},
  submitBtnText: {color: '#fff', textAlign: 'center'},
  staffCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  staffHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  staffIndex: {fontSize: 18, fontWeight: 'bold', width: 24},
  staffName: {fontWeight: 'bold', fontSize: 16},
  staffEmail: {fontSize: 13, color: '#555'},
  staffAddress: {
    flex: 1,
    fontSize: 13,
    color: '#777',
    marginRight: 10,
  },
  addressPhoneRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'space-between',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  phoneContainer: {
    width: 100,
    alignItems: 'flex-end',
  },
  staffPhone: {
    fontSize: 13,
    color: '#777',
    textAlign: 'right',
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  staffLabel: {fontWeight: '600', color: '#8b8b8b'},
  roleBadge: {
    backgroundColor: '#e1f9ea',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },

  roleBadgeText: {color: '#2e7d32', fontWeight: 'bold', fontSize: 14},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  separator: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginVertical: 10,
    alignSelf: 'stretch',
    marginHorizontal: 0,
  },
  licenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  licenseInfo: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 90,
  },
  statusContainerSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  numberCircle: {
    width: 30,
    height: 30,
    borderRadius: 14,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 30,
  },
  staffIndex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  licenseColumn: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 10,
  },
  licenseBlock: {
    marginBottom: 8,
  },
  staffLabel: {
    fontWeight: '600',
    color: '#000',
  },
  licenseValue: {
    fontWeight: 'normal',
    color: '#b9b9b9',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 90,
  },
  licenseStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  licenseNumberBlock: {
    flex: 1,
  },
  statusBlock: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  licenseYearStatusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  licenseYearBlock: {
    flex: 1,
  },
  statusToggleBlock: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  statusToggleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});

export default StaffScreen;

import React ,{useState,useEffect}from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import SpinAndWinModal from './SpinAndWinModal';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function EarnBackrTasksScreen() {
  const navigation = useNavigation();
const [spinOpen, setSpinOpen] = useState(false);
  const [customerId, setCustomerId] = useState(null);
const route = useRoute();
const openSpinModal = route?.params?.openSpinModal ?? false;
  // :jigsaw: Load Customer ID
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('customer');
      if (raw) {
        const customer = JSON.parse(raw);
        setCustomerId(customer?.id);
      }
    })();
  }, []);
  useEffect(() => {
  if (openSpinModal && customerId) {
    setSpinOpen(true);
  }
}, [openSpinModal, customerId]);
const tasks = [
  {
    id: 1,
    title: 'Complete a Booking',
    desc: 'Earn 50 Backr tokens for every booking you complete.',
    reward: 50,
    icon: 'car-outline',
    color: '#2563EB',
   action: () => navigation.navigate('CustomerDashboard'),
  },
  {
    id: 5,
    title: 'Complete Daily Spin Task',
    desc: 'Try your luck and win Backr coins! you can speen every 24 hours.',
    reward: 10,
    icon: 'gift-outline',
    color: '#EB2828',
 action: () => {
    if (customerId) {
      setSpinOpen(true);
    } else {
      Alert.alert('Please wait', 'Loading your profile. Try again in a second.');
    }
  },  }
];


  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Earn Backr</Text>
        <View style={{ width: 40 }} /> {/* spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tasks.map(task => (
          <View key={task.id} style={styles.taskCard}>
            <View style={[styles.iconWrap, { backgroundColor: task.color + '22' }]}>
              <Icon name={task.icon} size={26} color={task.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDesc}>{task.desc}</Text>
            </View>
            <TouchableOpacity style={styles.rewardBtn} onPress={task.action}>
              <Image
                source={{ uri: 'https://app.transrentals.in/assets/images/coin-back.png' }}
                style={{ width: 20, height: 20, marginRight: 4 }}
              />
              <Text style={styles.rewardText}>+{task.reward}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <SpinAndWinModal
        visible={spinOpen}
        onClose={() => setSpinOpen(false)}
        customerId={customerId}
        prizes={[5, 2, 10, 100, 50, 20, 15, 25]} // customize if needed
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2
  },
  backBtn: {
    padding: 6,
    borderRadius: 8
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  scroll: { padding: 16 },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  taskTitle: { fontWeight: '700', fontSize: 15, color: '#0f172a' },
  taskDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  rewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  rewardText: { color: '#16a34a', fontWeight: '700' }
});

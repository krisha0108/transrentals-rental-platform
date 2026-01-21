import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function VendorBottomNavigation() {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={80} style={StyleSheet.absoluteFill}>
        <Path
          fill="#ffffff"
          d={`M0 20 Q5 0, 20 0 H${width / 2 - 46}
              C${width / 2 - 30} 0, ${width / 2 - 30} 35, ${width / 2} 35
              C${width / 2 + 30} 35, ${width / 2 + 30} 0, ${width / 2 + 46} 0
              H${width - 20} Q${width - 5} 0, ${width} 20 V70 H0 Z`}
        />
      </Svg>

      <View style={styles.itemsContainer}>
        {/* Left icons */}
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.iconBlock}>
          <Image source={require('../assets/homes.png')} style={styles.iconImage} resizeMode='contain' />
          <Text style={styles.label}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.iconBlock}>
          <Image source={require('../assets/dashboard.png')} style={styles.iconImage} resizeMode='contain' />
          <Text style={styles.label}>Dashboard</Text>
        </TouchableOpacity>

        <View style={{ width: 65 }} />

        <TouchableOpacity onPress={() => navigation.navigate('PaymentScreen')} style={styles.iconBlock}>
          <Image source={require('../assets/payme.png')} style={styles.iconImage} resizeMode='contain' />
          <Text style={styles.label}>Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('BookingChatList')} style={styles.iconBlock}>
          <Image source={require('../assets/chated.png')} style={styles.iconImage} resizeMode='contain' />
          <Text style={styles.label}>Chat</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.fabCenter} onPress={() => navigation.navigate('OpenBookingScreen')}>
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <View style={styles.extraCion}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: -80, width, height: 150, alignItems: 'center' },
  itemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width,
    paddingHorizontal: 15,
    position: 'absolute',
    bottom: 95,
  },
  extraCion: { width: '100%', height: 100, position: 'absolute', bottom: -5, backgroundColor: '#fff' },
  iconBlock: { alignItems: 'center' },
  iconImage: { width: 22, height: 22 },
  label: { fontSize: 12, color: '#000', marginTop: 4 },
  fabCenter: {
    position: 'absolute', top: -20, width: 50, height: 50,
    borderRadius: 30, backgroundColor: '#09B368',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10, elevation: 5
  }
});

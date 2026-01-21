import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const BusBookingScreen = () => {
  const [selectedService, setSelectedService] = useState(null); // To keep track of selected service
  const navigation = useNavigation();
const handleOutstation = () => {
  setSelectedService('outstation'); // Set selected service to roundtrip
  navigation.navigate('OutstationScreen', { service: '1' }); // Pass trip_type as '3' (Roundtrip)
};
const handleLocal = () => {
  setSelectedService('local'); // Set selected service to oneway
  navigation.navigate('LocalScreen', { service: '2' }); // Pass trip_type as '1' (OneWay)
};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What service do you need?</Text>
      <View style={styles.gridContainer}>
        {/* Round Trip */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'outstation' && styles.selectedBox]}
          onPress={handleOutstation}
        >
          <Image
            source={require('../../../assets/outstation.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Outstation</Text>
        </TouchableOpacity>
        {/* Airport */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'local' && styles.selectedBox]}
          onPress={handleLocal}
        >
          <Image
            source={require('../../../assets/local.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Local</Text>
        </TouchableOpacity>
        {/* One Way */}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
  },
  optionBox: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F6F6F6', // Default background color (white if unselected)
    borderRadius: 10,
    marginBottom: 20,
    elevation: 5,
    justifyContent: 'center',
  },
  selectedBox: {
    borderWidth: 2,
    borderColor: '#09B368', // Green border on selection
    backgroundColor: '#D9FBE8', // Light green background when selected
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
export default BusBookingScreen;

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PackersMoversBookingScreen = () => {
  const [selectedService, setSelectedService] = useState(null); // To keep track of selected service
  const navigation = useNavigation();

const handleHome = () => {
  setSelectedService('Home'); // Set selected service to roundtrip
  navigation.navigate('HomeBookingScreen', { service: 'Home' }); // Pass trip_type as '3' (Home)
};

const handleOffice = () => {
  setSelectedService('Office'); // Set selected service to oneway
  navigation.navigate('OfficeBookingScreen', { service: 'Office' }); // Pass trip_type as '1' (Office)
};

const handleVehicle = () => {
  setSelectedService('Vehicle'); // Set selected service to airport
  navigation.navigate('VehicleBookingScreen', { service: 'Vehicle' }); // Pass trip_type as '2' (Vehicle)
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>What service do you need?</Text>
      
      <View style={styles.gridContainer}>
        {/* Round Trip */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'Home' && styles.selectedBox]} 
          onPress={handleHome}
        >
          <Image 
            source={require('../../../assets/clean-house.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>

        {/* Airport */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'Office' && styles.selectedBox]} 
          onPress={handleOffice}
        >
          <Image 
            source={require('../../../assets/location.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Office</Text>
        </TouchableOpacity>

        {/* One Way */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'Vehicle' && styles.selectedBox]} 
          onPress={handleVehicle}
        >
          <Image 
            source={require('../../../assets/motorcycle.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Vehicle</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f6f6f6', // Default background color (white if unselected)
    borderRadius: 10,
    marginBottom: 20,
    elevation: 5,
    justifyContent: 'center',
  },
  selectedBox: {
    borderWidth: 2,
    borderColor: '#09B368', // Green border on selection
    backgroundColor: '#d9fbe8', // Light green background when selected
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

export default PackersMoversBookingScreen;

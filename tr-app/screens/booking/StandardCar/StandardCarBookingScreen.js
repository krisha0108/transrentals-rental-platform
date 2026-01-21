import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const StandardCarBookingScreen = () => {
  const [selectedService, setSelectedService] = useState(null); // To keep track of selected service
  const navigation = useNavigation();

const handleRoundTrip = () => {
  setSelectedService('roundtrip'); // Set selected service to roundtrip
  navigation.navigate('RoundTripBookingScreen', { service: '3' }); // Pass trip_type as '3' (Roundtrip)
};

const handleOneWay = () => {
  setSelectedService('oneway'); // Set selected service to oneway
  navigation.navigate('OneWayBookingScreen', { service: '1' }); // Pass trip_type as '1' (OneWay)
};

const handleAirport = () => {
  setSelectedService('airport'); // Set selected service to airport
  navigation.navigate('AirportBookingScreen', { service: '2' }); // Pass trip_type as '2' (Airport)
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>What service do you need?</Text>
      
      <View style={styles.gridContainer}>
        {/* Round Trip */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'roundtrip' && styles.selectedBox]} 
          onPress={handleRoundTrip}
        >
          <Image 
            source={require('../../../assets/roundtrip.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Round Trip</Text>
        </TouchableOpacity>

        {/* Airport */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'airport' && styles.selectedBox]} 
          onPress={handleAirport}
        >
          <Image 
            source={require('../../../assets/airport.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Airport</Text>
        </TouchableOpacity>

        {/* One Way */}
        <TouchableOpacity
          style={[styles.optionBox, selectedService === 'oneway' && styles.selectedBox]} 
          onPress={handleOneWay}
        >
          <Image 
            source={require('../../../assets/oneway.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>One Way</Text>
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

export default StandardCarBookingScreen;

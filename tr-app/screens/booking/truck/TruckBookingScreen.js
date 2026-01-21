import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
const TruckBookingScreen = () => {
  const [selectedService, setSelectedService] = useState(null); // To keep track of selected service
  const navigation = useNavigation();
  const handlePersonal = () => {
    setSelectedService('Personal'); // Set selected service to roundtrip
    navigation.navigate('PersonalBookingScreen', {service: '3'}); // Pass trip_type as '3' (Roundtrip)
  };
  const handleCommercial = () => {
    setSelectedService('Commercial'); // Set selected service to oneway
    navigation.navigate('CommercialBookingScreen', {service: '1'}); // Pass trip_type as '1' (OneWay)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What service do you need?</Text>
      <View style={styles.gridContainer}>
        {/* Personal  */}
        <TouchableOpacity
          style={[
            styles.optionBox,
            selectedService === 'Personal' && styles.selectedBox,
          ]}
          onPress={handlePersonal}>
          <Image
            source={require('../../../assets/personal.png')} // Replace with your own path for the icon
            style={styles.iconimage}
          />
          <Text style={styles.buttonText}>Personal </Text>
        </TouchableOpacity>
        {/* Commercial */}
        <TouchableOpacity
          style={[
            styles.optionBox,
            selectedService === 'Commercial' && styles.selectedBox,
          ]}
          onPress={handleCommercial}>
          <Image
            source={require('../../../assets/commercial.png')} // Replace with your own path for the icon
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Commercial</Text>
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
    width: '80%',
    height: 50,
    marginBottom: 10,
  },
  iconimage: {
    width: '100%',
    height: 50,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
export default TruckBookingScreen;

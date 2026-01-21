import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
   Dimensions,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';;
 const { width } = Dimensions.get('window'); 

 const heroSlides = [
    { title: "Find the perfect vehicle for your needs", description: "TRY IT NOW!", image: require('../../assets/slide-2-hero.png') },
    { title: "Find the Perfect Vehicle for Your Needs", description: "Choose from our wide range of vehicles that suit your needs perfectly.", image: require('../../assets/p2p.png') },
    { title: "Quick Booking", description: "Book a vehicle in just a few taps and have it delivered to your doorstep.", image: require('../../assets/slide-3-hero.png') }
  ];

export default function MarketplaceScreen() {
   const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Top Row: Profile & Notification Dot */}
      <View style={styles.topRow}>
        <View style={styles.profilePicContainer}>
          <Image
            style={styles.profilePic}
            source={{ uri: 'https://placehold.co/30x30' }}
          />
        </View>
        <View style={styles.notificationDot} />
      </View>
   {/* Hero Section */}

        <View style={styles.heroContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heroScroll}>
            {heroSlides.map((slide, index) => (
              <View key={index} style={styles.heroSlide}>
              <View style={styles.Slidercontainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.heroTitle}>{slide.title}</Text>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.name}>{slide.description}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={slide.image}
                    style={styles.slideimage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
            ))}
          </ScrollView>
        </View>
      {/* Banner */}
      {/* <View style={styles.banner}>
        <Text style={styles.bannerText}>Find The Perfect Vehicle{"\n"}For Your Needs</Text>
        <TouchableOpacity style={styles.tryNowButton}>
          <Text style={styles.tryNowText}>TRY IT NOW!</Text>
        </TouchableOpacity>
        <Image
           source={require('../../assets/trynow.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View> */}

      {/* Marketplace Header */}
      <Text style={styles.marketplaceTitle}>Marketplace</Text>

      {/* Marketplace Grid */}
      <View style={styles.gridContainer}>
        {/* Each Item */}
        <View style={styles.gridRow}>
          <TouchableOpacity 
          style={styles.gridItem} 
          onPress={() => navigation.navigate('OpenBookingScreen')} // Your screen name
        >
          <Image
            source={require('../../assets/open.png')}
            style={styles.iconImage}
          />
          <Text style={styles.gridItemText}>Open</Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('MyQuoteScreen')}
          >
            <Image source={require('../../assets/myquote.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>My Quote</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('UpcomingScreen')}
          >
            <Image source={require('../../assets/upcoming.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>Upcoming</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridRow}>
           <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('OngoingScreen')}
          >
            <Image source={require('../../assets/ongoing.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>Ongoing</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('CompleteScreen')}
          >
            <Image source={require('../../assets/complete.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>Complete</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('SavedScreen')}
          >
            <Image source={require('../../assets/saved.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>Saved</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridRow}>
         <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('DropScreen')}
          >
            <Image source={require('../../assets/drop.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>Drop</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('P2PScreen')}
          >
            <Image source={require('../../assets/p2p2.png')} style={styles.iconImage} />
            <Text style={styles.gridItemText}>P2P</Text>
          </TouchableOpacity>
          <View style={styles.gridItemPlaceholder} />
        </View>
      </View>

     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 375,
    height: 812,
    backgroundColor: 'white',
    position: 'relative',
  },
  topRow: {
    position: 'absolute',
    left: 20,
    top: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 335,
    alignItems: 'center',
  },
  profilePicContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  profilePic: {
    width: 30,
    height: 30,
  },
  notificationDot: {
    width: 5,
    height: 5,
    backgroundColor: '#FF0000',
    borderRadius: 2.5,
    borderWidth: 0.5,
    borderColor: 'white',
  },
  banner: {
    position: 'absolute',
    top: 90,
    left: 20,
    width: 335,
    height: 120,
    backgroundColor: 'rgba(9,179,104,0.05)', // #09B3680C
    borderRadius: 5,
    paddingLeft: 6,
    paddingTop: 20,
  },
  bannerText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 18,
    color: 'black',
  },
  tryNowButton: {
    position: 'absolute',
    left: 6,
    bottom: 12,
    width: 94,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  tryNowText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    fontSize: 14,
    color: 'black',
    lineHeight: 16,
  },
  bannerImage: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    width: 120,
    height: 120,
  },
  marketplaceTitle: {
    position: 'absolute',
    left: 20,
    top: 230,
    fontFamily: 'Manrope',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 20,
    color: 'black',
  },
  gridContainer: {
    position: 'absolute',
    top: 270,
    left: 20,
    width: 335,
    height: 342,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#00000066',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: 80,
    height: 90,
    backgroundColor: 'rgba(205,223,225,0.3)', // #4CDFDFE1 with opacity
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemPlaceholder: {
    width: 80,
    height: 90,
    backgroundColor: 'transparent',
  },
  gridItemText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    width: 376,
    height: 96,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#00000066',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  tabItem: {
    width: 72,
    height: 78,
    backgroundColor: 'white',
    borderTopLeftRadius: 14,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  tabItemActive: {
    width: 72,
    height: 78,
    backgroundColor: 'white',
    borderTopRightRadius: 21,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  tabItemCenter: {
    width: 40,
    height: 40,
    position: 'relative',
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#09B368',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 30,
  },
  tabText: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    fontSize: 14,
    color: 'black',
  },
  tabTextActive: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    fontSize: 14,
    color: 'black',
    borderTopRightRadius: 21,
  },
   heroContainer: {
    padding: 10,
    marginTop: 20,
  },
  heroScroll: {
    marginBottom: 20,
  },
  heroSlide: {
    width: width - 20, // Slide width (take full screen width minus padding)
    marginRight: 5, // Space between slides
    alignItems: 'center',
  },
  Slidercontainer: {
    padding: 10,
    borderRadius: 8,
    shadowColor: '#00000010',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 5,
    backgroundColor: '#09B36810',
    width: '100%',
    height: 140,
    marginLeft: 10,
    position: 'relative',
    alignSelf: 'center',
    flexDirection: 'row', // Align text and image horizontally
    justifyContent: 'space-between', // Space between text and image container
  },
  textContainer: {
    width: '70%', // Adjust based on the desired text width
    justifyContent: 'center',
    paddingLeft: 10,
  },
  button: {
    marginTop: 10,
    width: 110,
    height: 26,
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: 'black',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    height: 1.93,
  },
  imageContainer: {
    width: '40%', // Adjust the width for the image container
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  slideimage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Makes sure the image fits within the container
  },
});

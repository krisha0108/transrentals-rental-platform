// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   Animated,
//   Platform,
//   Image,
// } from 'react-native';

// const { width } = Dimensions.get('window');

// const PALETTE = {
//   Primary: '#09B368',
//   Secondary: '#E4B343',
//   Background: '#F8FAF9',
//   TextDark: '#212121',
//   TextMuted: '#6C757D',
// };

// const slides = [
//   {
//     key: '1',
//     title: 'One Platform. Every Ride.',
//     subtitle: 'Your Journey Begins Here',
//     description: 'Book bikes, cars, buses, or trucks — all in one seamless app.',
//     image: require('../assets/slide1.jpg'),
//     visual: 'Map and Orbiting Vehicles',
//     ctaText: 'Next',
//   },
//   {
//     key: '2',
//     title: 'Get Instant Quotes',
//     subtitle: 'Compare & Book Instantly',
//     description: 'Compare vendors, pick the best deal, and confirm your ride in seconds.',
//     image: require('../assets/slide2.jpg'),
//     visual: 'Sliding Vendor Quotes',
//     ctaText: 'Next',
//   },
//   {
//     key: '3',
//     title: 'All Your Trips in One Place',
//     subtitle: 'Manage Trips Effortlessly',
//     description: 'Stay organized and track every booking with a single tap.',
//     image: require('../assets/slide3.jpg'),
//     visual: 'Calendar and Road Scene',
//     ctaText: 'Next',
//   },
//   {
//     key: '4',
//     title: 'Earn While You Ride',
//     subtitle: 'Earn Backr Coins',
//     description: 'Complete simple tasks, earn Backr Coins, and unlock exclusive offers.',
//     image: require('../assets/slide4.jpg'),
//     visual: 'Gold Coins and Wallet',
//     ctaText: 'Finish',
//   },
// ];

// const OnboardingScreen = ({ navigation }) => {
//   const scrollX = useRef(new Animated.Value(0)).current;
//   const slideRef = useRef(null);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // Animation values for button press
//   const buttonScale = useRef(new Animated.Value(1)).current;
//   const skipButtonOpacity = useRef(new Animated.Value(1)).current;

//   const handleNext = () => {
//     // Button press animation
//     Animated.sequence([
//       Animated.timing(buttonScale, {
//         toValue: 0.95,
//         duration: 200,  
//         useNativeDriver: true,
//       }),
//       Animated.timing(buttonScale, {
//         toValue: 1,
//         duration: 200,  
//         useNativeDriver: true,
//       }),
//     ]).start();

//     const nextIndex = currentIndex + 1;
//     if (nextIndex < slides.length) {
//       slideRef.current?.scrollToOffset({
//         offset: nextIndex * width,
//         animated: true,
//       });
//     } else {
//       // Animate out before navigation
//       Animated.timing(skipButtonOpacity, {
//         toValue: 0,
//         duration: 500,  
//         useNativeDriver: true,
//       }).start(() => {
//         navigation.replace('Login');
//       });
//     }
//   };

//   const handleSkip = () => {
//     // Skip button fade out animation
//     Animated.timing(skipButtonOpacity, {
//       toValue: 0,
//       duration: 500,  
//       useNativeDriver: true,
//     }).start(() => {
//       navigation.replace('Login');
//     });
//   };

//   const onMomentumEnd = (e) => {
//     const offsetX = e.nativeEvent.contentOffset.x;
//     const index = Math.round(offsetX / width);
//     setCurrentIndex(index);
//   };

//   const SlideImageVisual = ({ source }) => (
//     <View style={styles.visualContainers}>
//       <Image
//         source={source}
//         style={styles.image}
//         resizeMode="cover"
//       />
//     </View>
//   );

//   const RenderItem = ({ item, index }) => {
//     const inputRange = [
//       (index - 2) * width,  
//       index * width, 
//       (index + 2) * width   
//     ];

//     const textOpacity = scrollX.interpolate({
//       inputRange,
//       outputRange: [0, 1, 0],
//       extrapolate: 'clamp',
//     });

//     const textScale = scrollX.interpolate({
//       inputRange,
//       outputRange: [0.7, 1, 0.7],  
//       extrapolate: 'clamp',
//     });

//     const textTranslateY = scrollX.interpolate({
//       inputRange,
//       outputRange: [80, 0, 80],  
//       extrapolate: 'clamp',
//     });

//     const subtitleOpacity = scrollX.interpolate({
//       inputRange,
//       outputRange: [0, 1, 0],
//       extrapolate: 'clamp',
//     });

//     const subtitleTranslateY = scrollX.interpolate({
//       inputRange,
//       outputRange: [60, 0, 60],  
//       extrapolate: 'clamp',
//     });

//     const descriptionOpacity = scrollX.interpolate({
//       inputRange,
//       outputRange: [0, 1, 0],
//       extrapolate: 'clamp',
//     });

//     const descriptionTranslateY = scrollX.interpolate({
//       inputRange,
//       outputRange: [70, 0, 70], 
//       extrapolate: 'clamp',
//     });

//     // New animations added below
//     const titleRotate = scrollX.interpolate({
//       inputRange,
//       outputRange: ['-5deg', '0deg', '5deg'],
//       extrapolate: 'clamp',
//     });

//     const subtitleLetterSpacing = scrollX.interpolate({
//       inputRange,
//       outputRange: [0, 5, 0],
//       extrapolate: 'clamp',
//     });

//     const descriptionLineHeight = scrollX.interpolate({
//       inputRange,
//       outputRange: [20, 24, 20],
//       extrapolate: 'clamp',
//     });

//     const textShadow = scrollX.interpolate({
//       inputRange,
//       outputRange: [0, 3, 0],
//       extrapolate: 'clamp',
//     });

//     const bgColor = scrollX.interpolate({
//       inputRange: slides.map((_, i) => i * width),
//       outputRange: [
//         PALETTE.Background,
//         PALETTE.Background,
//         PALETTE.Background,
//         PALETTE.Background,
//       ],
//       extrapolate: 'clamp',
//     });

//     return (
//       <Animated.View style={[styles.slide, { backgroundColor: bgColor }]}>
//         <View style={styles.visualContainer}>
//           {item.image ? (
//             <SlideImageVisual source={item.image} />
//           ) : (
//             <View style={styles.visualPlaceholder}>
//               <Text style={styles.visualText}>{item.visual}</Text>
//             </View>
//           )}
//         </View>

//         <Animated.View
//           style={[
//             styles.textWrapper, 
//             { 
//               opacity: textOpacity, 
//               transform: [
//                 { scale: textScale },
//                 { translateY: textTranslateY }
//               ] 
//             }
//           ]}
//         >
//           <Animated.Text 
//             style={[
//               styles.subtitle, 
//               { 
//                 opacity: subtitleOpacity,
//                 transform: [{ translateY: subtitleTranslateY }],
//                 letterSpacing: subtitleLetterSpacing, // New animation
//               }
//             ]}
//           >
//             {item.subtitle}
//           </Animated.Text>
          
//           <Animated.Text 
//             style={[
//               styles.heading, 
//               { 
//                 opacity: textOpacity,
//                 transform: [
//                   { translateY: textTranslateY },
//                   { rotate: titleRotate } // New animation
//                 ],
//                 textShadowOffset: { width: 0, height: textShadow }, // New animation
//                 textShadowRadius: 2,
//                 textShadowColor: 'rgba(0, 0, 0, 0.1)',
//               }
//             ]}
//           >
//             {item.title}
//           </Animated.Text>
          
//           <Animated.Text 
//             style={[
//               styles.paragraph, 
//               { 
//                 opacity: descriptionOpacity,
//                 transform: [{ translateY: descriptionTranslateY }],
//                 lineHeight: descriptionLineHeight, // New animation
//               }
//             ]}
//           >
//             {item.description}
//           </Animated.Text>
//         </Animated.View>
//       </Animated.View>
//     );
//   };

//   const Pagination = () => (
//     <View style={styles.paginationContainer}>
//       {slides.map((_, index) => {
//         const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
//         const dotWidth = scrollX.interpolate({
//           inputRange,
//           outputRange: [8, 28, 8],
//           extrapolate: 'clamp',
//         });
//         const dotColor = scrollX.interpolate({
//           inputRange,
//           outputRange: [PALETTE.TextMuted, PALETTE.Primary, PALETTE.TextMuted],
//           extrapolate: 'clamp',
//         });
//         const dotScale = scrollX.interpolate({
//           inputRange,
//           outputRange: [0.9, 1.1, 0.9],
//           extrapolate: 'clamp',
//         });
//         return (
//           <Animated.View
//             key={index.toString()}
//             style={[
//               styles.dot, 
//               { 
//                 width: dotWidth, 
//                 backgroundColor: dotColor,
//                 transform: [{ scale: dotScale }]
//               }
//             ]}
//           />
//         );
//       })}
//     </View>
//   );

//   const isLastSlide = currentIndex === slides.length - 1;

//   return (
//     <View style={styles.container}>
//       {/* Skip Button with fixed positioning */}
//       <Animated.View 
//         style={[
//           styles.skipButtonContainer,
//           { opacity: skipButtonOpacity }
//         ]}
//       >
//         <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
//           <Text style={styles.skipText}>Skip</Text>
//         </TouchableOpacity>
//       </Animated.View>

//       <Animated.FlatList
//         ref={slideRef}
//         data={slides}
//         renderItem={({ item, index }) => <RenderItem item={item} index={index} />}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => item.key}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//           { useNativeDriver: false }
//         )}
//         onMomentumScrollEnd={onMomentumEnd}
//         scrollEventThrottle={16}
//       />

//       <View style={styles.controlArea}>
//         <Pagination />
//         <Animated.View
//           style={[
//             styles.nextButtonWrapper,
//             { 
//               backgroundColor: isLastSlide ? PALETTE.Secondary : PALETTE.Primary,
//               transform: [{ scale: buttonScale }]
//             },
//           ]}
//         >
//           <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//             <Text style={styles.nextButtonText}>
//               {slides[currentIndex].ctaText}
//             </Text>
//           </TouchableOpacity>
//         </Animated.View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: PALETTE.Background 
//   },
//   // Skip button container with absolute positioning
//   skipButtonContainer: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 70 : 10,
//     right: 20,
//     zIndex: 10,
//   },
//   skipButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.6)',
//     shadowColor: '#000',
//     shadowOpacity: 0.4,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 6,
//     elevation: 8,
//   },
//   skipText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   image: { 
//     width: '110%', 
//     height: '120%', 
//   },
//   slide: {
//     width,
//     flex: 1,
//     alignItems: 'center',
//     paddingTop: Platform.OS === 'ios' ? 70 : 30,
//   },
//   visualContainer: {
//     width: '100%',
//     height: '60%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//     marginTop:-50,
//   },
//   visualContainers: {
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//     padding: 15,
//     // borderRadius: 20,
//   },
//   visualPlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(9, 179, 104, 0.05)',
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   visualText: { color: PALETTE.TextMuted, fontSize: 12 },
//   textWrapper: {
//     width: width * 0.9,
//     height: '40%',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 40,
//   },
//   subtitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: PALETTE.Secondary,
//     letterSpacing: 1.5,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   heading: {
//     fontSize: 30,
//     fontWeight: '800',
//     color: PALETTE.TextDark,
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   paragraph: {
//     fontSize: 16,
//     color: PALETTE.TextMuted,
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   controlArea: {
//     position: 'absolute',
//     bottom: 50,
//     width,
//     paddingHorizontal: 30,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   paginationContainer: {
//     flexDirection: 'row',
//     gap: 8,
//     flex: 1,
//     justifyContent: 'flex-start',
//   },
//   dot: { height: 8, borderRadius: 4 },
//   nextButtonWrapper: {
//     borderRadius: 12,
//     elevation: 8,
//     shadowColor: PALETTE.Primary,
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.4,
//     shadowRadius: 10,
//     minWidth: 120,
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   nextButton: {
//     paddingVertical: 16,
//     paddingHorizontal: 35,
//     width: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
// });

// export default OnboardingScreen;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scaleWidth = (size) => (width / 375) * size; // 375 is base width (iPhone 6/7/8)
const scaleHeight = (size) => (height / 667) * size; // 667 is base height (iPhone 6/7/8)
const moderateScale = (size, factor = 0.5) => size + (scaleWidth(size) - size) * factor;

const PALETTE = {
  Primary: '#09B368',
  Secondary: '#E4B343',
  Background: '#F8FAF9',
  TextDark: '#212121',
  TextMuted: '#6C757D',
};

const slides = [
  {
    key: '1',
    title: 'One Platform. Every Ride.',
    subtitle: 'Your Journey Begins Here',
    description: 'Book bikes, cars, buses, or trucks — all in one seamless app.',
    image: require('../assets/slide1.jpg'),
    visual: 'Map and Orbiting Vehicles',
    ctaText: 'Next',
  },
  {
    key: '2',
    title: 'Get Instant Quotes',
    subtitle: 'Compare & Book Instantly',
    description: 'Compare vendors, pick the best deal, and confirm your ride in seconds.',
    image: require('../assets/slide2.jpg'),
    visual: 'Sliding Vendor Quotes',
    ctaText: 'Next',
  },
  {
    key: '3',
    title: 'All Your Trips in One Place',
    subtitle: 'Manage Trips Effortlessly',
    description: 'Stay organized and track every booking with a single tap.',
    image: require('../assets/slide3.jpg'),
    visual: 'Calendar and Road Scene',
    ctaText: 'Next',
  },
  {
    key: '4',
    title: 'Earn While You Ride',
    subtitle: 'Earn Backr Coins',
    description: 'Complete simple tasks, earn Backr Coins, and unlock exclusive offers.',
    image: require('../assets/slide4.png'),
    visual: 'Gold Coins and Wallet',
    ctaText: 'Finish',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation values for button press
  const buttonScale = useRef(new Animated.Value(1)).current;
  const skipButtonOpacity = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 200,  
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,  
        useNativeDriver: true,
      }),
    ]).start();

    const nextIndex = currentIndex + 1;
    if (nextIndex < slides.length) {
      slideRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
    } else {
      // Animate out before navigation
      Animated.timing(skipButtonOpacity, {
        toValue: 0,
        duration: 500,  
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('Login');
      });
    }
  };

  const handleSkip = () => {
    // Skip button fade out animation
    Animated.timing(skipButtonOpacity, {
      toValue: 0,
      duration: 500,  
      useNativeDriver: true,
    }).start(() => {
      navigation.replace('Login');
    });
  };

  const onMomentumEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const SlideImageVisual = ({ source }) => (
    <View style={styles.visualContainers}>
      <Image
        source={source}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );

  const RenderItem = ({ item, index }) => {
    const inputRange = [
      (index - 2) * width,  
      index * width, 
      (index + 2) * width   
    ];

    const textOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const textScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],  
      extrapolate: 'clamp',
    });

    const textTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [scaleHeight(80), 0, scaleHeight(80)],  
      extrapolate: 'clamp',
    });

    const subtitleOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const subtitleTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [scaleHeight(60), 0, scaleHeight(60)],  
      extrapolate: 'clamp',
    });

    const descriptionOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const descriptionTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [scaleHeight(70), 0, scaleHeight(70)], 
      extrapolate: 'clamp',
    });

    // New animations added below
    const titleRotate = scrollX.interpolate({
      inputRange,
      outputRange: ['-5deg', '0deg', '5deg'],
      extrapolate: 'clamp',
    });

    const subtitleLetterSpacing = scrollX.interpolate({
      inputRange,
      outputRange: [0, 5, 0],
      extrapolate: 'clamp',
    });

    const descriptionLineHeight = scrollX.interpolate({
      inputRange,
      outputRange: [scaleHeight(20), scaleHeight(24), scaleHeight(20)],
      extrapolate: 'clamp',
    });

    const textShadow = scrollX.interpolate({
      inputRange,
      outputRange: [0, 3, 0],
      extrapolate: 'clamp',
    });

    const bgColor = scrollX.interpolate({
      inputRange: slides.map((_, i) => i * width),
      outputRange: [
        PALETTE.Background,
        PALETTE.Background,
        PALETTE.Background,
        PALETTE.Background,
      ],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.slide, { backgroundColor: bgColor }]}>
        <View style={styles.visualContainer}>
          {item.image ? (
            <SlideImageVisual source={item.image} />
          ) : (
            <View style={styles.visualPlaceholder}>
              <Text style={styles.visualText}>{item.visual}</Text>
            </View>
          )}
        </View>

        <Animated.View
          style={[
            styles.textWrapper, 
            { 
              opacity: textOpacity, 
              transform: [
                { scale: textScale },
                { translateY: textTranslateY }
              ] 
            }
          ]}
        >
          <Animated.Text 
            style={[
              styles.subtitle, 
              { 
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
                letterSpacing: subtitleLetterSpacing, // New animation
              }
            ]}
          >
            {item.subtitle}
          </Animated.Text>
          
          <Animated.Text 
            style={[
              styles.heading, 
              { 
                opacity: textOpacity,
                transform: [
                  { translateY: textTranslateY },
                  { rotate: titleRotate } // New animation
                ],
                textShadowOffset: { width: 0, height: textShadow }, // New animation
                textShadowRadius: 2,
                textShadowColor: 'rgba(0, 0, 0, 0.1)',
              }
            ]}
          >
            {item.title}
          </Animated.Text>
          
          <Animated.Text 
            style={[
              styles.paragraph, 
              { 
                opacity: descriptionOpacity,
                transform: [{ translateY: descriptionTranslateY }],
                lineHeight: descriptionLineHeight, // New animation
              }
            ]}
          >
            {item.description}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const Pagination = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [scaleWidth(8), scaleWidth(28), scaleWidth(8)],
          extrapolate: 'clamp',
        });
        const dotColor = scrollX.interpolate({
          inputRange,
          outputRange: [PALETTE.TextMuted, PALETTE.Primary, PALETTE.TextMuted],
          extrapolate: 'clamp',
        });
        const dotScale = scrollX.interpolate({
          inputRange,
          outputRange: [0.9, 1.1, 0.9],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={index.toString()}
            style={[
              styles.dot, 
              { 
                width: dotWidth, 
                backgroundColor: dotColor,
                transform: [{ scale: dotScale }]
              }
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip Button with fixed positioning */}
      <Animated.View 
        style={[
          styles.skipButtonContainer,
          { opacity: skipButtonOpacity }
        ]}
      >
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.FlatList
        ref={slideRef}
        data={slides}
        renderItem={({ item, index }) => <RenderItem item={item} index={index} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      />

      <View style={styles.controlArea}>
        <Pagination />
        <Animated.View
          style={[
            styles.nextButtonWrapper,
            { 
              backgroundColor: isLastSlide ? PALETTE.Secondary : PALETTE.Primary,
              transform: [{ scale: buttonScale }]
            },
          ]}
        >
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {slides[currentIndex].ctaText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: PALETTE.Background 
  },
  // Skip button container with absolute positioning
  skipButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? scaleHeight(70) : scaleHeight(10),
    right: scaleWidth(20),
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowRadius: scaleWidth(6),
    elevation: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  image: { 
    width: '110%', 
    height: '120%', 
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? scaleHeight(70) : scaleHeight(30),
  },
  visualContainer: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: scaleHeight(-50),
  },
  visualContainers: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: scaleWidth(15),
  },
  visualPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(9, 179, 104, 0.05)',
    borderRadius: scaleWidth(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualText: { 
    color: PALETTE.TextMuted, 
    fontSize: moderateScale(12) 
  },
  textWrapper: {
    width: width * 0.9,
    height: '40%',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
  },
  subtitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: PALETTE.Secondary,
    letterSpacing: 1.5,
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  heading: {
    fontSize: moderateScale(30),
    fontWeight: '800',
    color: PALETTE.TextDark,
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  paragraph: {
    fontSize: moderateScale(16),
    color: PALETTE.TextMuted,
    textAlign: 'center',
    lineHeight: scaleHeight(24),
  },
  controlArea: {
    position: 'absolute',
    bottom: scaleHeight(50),
    width,
    paddingHorizontal: scaleWidth(30),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
    flex: 1,
    justifyContent: 'flex-start',
  },
  dot: { 
    height: scaleHeight(8), 
    borderRadius: scaleWidth(4),
        marginTop:20,

  },
  nextButtonWrapper: {
    borderRadius: scaleWidth(12),
    elevation: 8,
    shadowColor: PALETTE.Primary,
    shadowOffset: { width: 0, height: scaleHeight(6) },
    shadowOpacity: 0.4,
    shadowRadius: scaleWidth(10),
    minWidth: scaleWidth(120),
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  nextButton: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(35),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: { 
    color: '#fff', 
    fontSize: moderateScale(18), 
    fontWeight: '700' 
  },
});

export default OnboardingScreen;

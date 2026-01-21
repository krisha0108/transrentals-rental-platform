import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CARD_WIDTH = wp('50%');
const CARD_HEIGHT = wp('35%');
const GOLD = '#FFD700';
const BRAND_TEAL = '#09B368';
const baseImageURL = 'https://app.transrentals.in/storage/';
const FALLBACK_IMG = require('../assets/logp-1.png'); // 👈 your default

const VendorCard = ({ vendor }) => {
  const { name, service_name, profile_image } = vendor;

  // 👇 some APIs send `service_images`, some send `images`
  const rawImages =
    vendor?.service_images && vendor.service_images.length
      ? vendor.service_images
      : vendor?.images && vendor.images.length
      ? vendor.images
      : [];

  const anim = useRef(new Animated.Value(0)).current;
  const [brokenIndexes, setBrokenIndexes] = useState({});
  const [profileError, setProfileError] = useState(false);

  // normalize to urls or local
  const imageSources =
    rawImages.length > 0
      ? rawImages.map(img => {
          if (!img) return FALLBACK_IMG;
          // sometimes backend sends relative path
          if (typeof img === 'string') {
            const cleaned = img.replace(/^vendor_services\//, '');
            return img.startsWith('http')
              ? img
              : baseImageURL + cleaned;
          }
          return FALLBACK_IMG;
        })
      : [FALLBACK_IMG];

  const imageCount = imageSources.length;

  // auto slider
  useEffect(() => {
    if (imageCount > 1) {
      Animated.loop(
        Animated.timing(anim, {
          toValue: imageCount,
          duration: imageCount * 4000,
          useNativeDriver: false,
        })
      ).start();
    }
  }, [anim, imageCount]);

  // helper: return correct source, falling back if this index broke
  const getImageSource = (src, index) => {
    if (brokenIndexes[index]) {
      return FALLBACK_IMG;
    }
    // local require
    if (typeof src !== 'string') {
      return src;
    }
    return { uri: src };
  };

  let content;
  if (imageCount > 1) {
    const inputRange = Array.from({ length: imageCount }, (_, i) => i);
    const outputRange = inputRange.map(i => i * -CARD_WIDTH);
    const translateX = anim.interpolate({ inputRange, outputRange });

    content = (
      <Animated.View
        style={[
          styles.imageRow,
          { width: CARD_WIDTH * imageCount, transform: [{ translateX }] },
        ]}
      >
        {imageSources.map((img, i) => (
          <ImageBackground
            key={i}
            source={getImageSource(img, i)}
             style={brokenIndexes[i] ? styles.fallbackImage : styles.bgImage}
            imageStyle={{ borderRadius: 16 }}
              resizeMode={brokenIndexes[i] ? 'contain' : 'contain'}
            onError={() =>
              setBrokenIndexes(prev => ({ ...prev, [i]: true }))
            }
          />
        ))}
      </Animated.View>
    );
  } else {
    content = (
      <ImageBackground
        source={getImageSource(imageSources[0], 0)}
        style={styles.bgImage}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
        onError={() => setBrokenIndexes({ 0: true })}
      />
    );
  }

  const firstLetter = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageWrapper}>
        {content}

        <View style={styles.overlay}>
          {profile_image && !profileError ? (
            <Image
              source={{ uri: profile_image }}
              style={styles.profileImage}
              onError={() => setProfileError(true)}
            />
          ) : (
            <View style={styles.initialCircle}>
              <Text style={styles.initialText}>{firstLetter}</Text>
            </View>
          )}
          <Text style={styles.serviceName}>{service_name}</Text>
          <Text style={styles.vendorName}>{name}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: wp('4%'),
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageWrapper: { flex: 1 },
  imageRow: { flexDirection: 'row', height: '100%' },
  bgImage: {
    width: CARD_WIDTH,
    height: '100%',
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    bottom: wp('2.5%'),
    left: wp('3%'),
    right: wp('3%'),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingVertical: wp('2%'),
    paddingHorizontal: wp('3%'),
    alignItems: 'center',
  },
  profileImage: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    marginBottom: wp('1.5%'),
  },
  initialCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: BRAND_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp('1.5%'),
  },
  initialText: {
    color: 'white',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  serviceName: {
    color: GOLD,
    fontWeight: 'bold',
    fontSize: wp('3.6%'),
    marginBottom: wp('0.5%'),
  },
  vendorName: {
    color: '#fff',
    fontSize: wp('3.3%'),
  },
   fallbackImage: {
    width: CARD_WIDTH,
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center', // subtle gray background
    borderRadius: 16,
    resizeMode:"contain",
  },
});

export default VendorCard;

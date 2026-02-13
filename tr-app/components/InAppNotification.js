import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const InAppNotification = ({ notification, onPress, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in and fade in with spring animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 50,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds (reduced from 5)
    const timer = setTimeout(() => {
      dismissNotification();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  const handlePress = () => {
    dismissNotification();
    setTimeout(() => {
      onPress && onPress();
    }, 100);
  };

  // Function to render body with highlighted OTP
  const renderBodyWithOTP = () => {
    const body = notification.body || '';

    // Check if body contains OTP pattern (4 digits)
    const otpRegex = /(\d{4})/g;
    const parts = body.split(otpRegex);

    // If no OTP found, return normal text
    if (parts.length === 1) {
      return (
        <Text style={styles.body} numberOfLines={3}>
          {body}
        </Text>
      );
    }

    // Render with highlighted OTP
    return (
      <Text style={styles.body} numberOfLines={3}>
        {parts.map((part, index) => {
          // Check if this part is a 4-digit OTP
          if (part.match(/^\d{4}$/)) {
            return (
              <Text key={index} style={styles.otpHighlight}>
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.notificationCard, getCardBackgroundStyle(notification.type)]}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, getIconStyle(notification.type)]}>
            <Ionicons
              name={getIconName(notification.type)}
              size={32}
              color="#fff"
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {notification.title}
          </Text>
          {renderBodyWithOTP()}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissNotification}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={26} color="#888" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getIconName = (type) => {
  switch (type) {
    case 'payment':
      return 'card-outline';
    case 'quote':
      return 'document-text-outline';
    case 'booking':
      return 'calendar-outline';
    case 'chat':
      return 'chatbubble-outline';
    default:
      return 'notifications-outline';
  }
};

const getIconStyle = (type) => {
  switch (type) {
    case 'payment':
      return { backgroundColor: '#4CAF50' }; // Green
    case 'quote':
      return { backgroundColor: '#2196F3' }; // Blue
    case 'booking':
      return { backgroundColor: '#FF9800' }; // Orange
    case 'chat':
      return { backgroundColor: '#9C27B0' }; // Purple
    default:
      return { backgroundColor: '#607D8B' }; // Grey
  }
};

const getCardBackgroundStyle = (type) => {
  switch (type) {
    case 'payment':
      return { backgroundColor: '#F1F8F4', borderLeftColor: '#4CAF50' }; // Light green tint
    case 'quote':
      return { backgroundColor: '#EEF5FC', borderLeftColor: '#2196F3' }; // Light blue tint
    case 'booking':
      return { backgroundColor: '#FFF4E6', borderLeftColor: '#FF9800' }; // Light orange tint
    case 'chat':
      return { backgroundColor: '#F3E5F5', borderLeftColor: '#9C27B0' }; // Light purple tint
    default:
      return { backgroundColor: '#F5F5F5', borderLeftColor: '#607D8B' }; // Light grey tint
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 55,
    elevation: 10,
  },
  notificationCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderLeftWidth: 6,
    minHeight: 100,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontWeight: '400',
  },
  otpHighlight: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B35',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 2,
    marginHorizontal: 2,
  },
  closeButton: {
    padding: 6,
  },
});

export default InAppNotification;

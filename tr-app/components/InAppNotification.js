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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const InAppNotification = ({ notification, onPress, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in and fade in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 50, // Changed from 10 to 50 - shows below status bar
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      dismissNotification();
    }, 5000);

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
        style={styles.notificationCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, getIconStyle(notification.type)]}>
            <Ionicons
              name={getIconName(notification.type)}
              size={24}
              color="#fff"
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissNotification}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#666" />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 50, // Space below status bar
    elevation: 10,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});

export default InAppNotification;

import React, { createContext, useContext, useState } from 'react';
import InAppNotification from '../components/InAppNotification';

const NotificationContext = createContext();

export const useInAppNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useInAppNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, navigation }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (notificationData) => {
    setNotification(notificationData);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const handleNotificationPress = () => {
    if (!notification || !navigation) {
      hideNotification();
      return;
    }

    const { data, serviceType, bookingId, quoteId } = notification;

    // Parse service type
    let service = serviceType || data?.serviceType;
    const title = notification.title || '';

    // Fallback: detect from title if serviceType missing
    if (!service || service === 'general') {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('bike') || lowerTitle.includes('🏍')) service = 'bike';
      else if (lowerTitle.includes('bus') || lowerTitle.includes('🚌')) service = 'bus';
      else if (lowerTitle.includes('truck') || lowerTitle.includes('🚚')) service = 'truck';
      else if (lowerTitle.includes('equipment') || lowerTitle.includes('🏗')) service = 'equipment';
      else if (lowerTitle.includes('packers') || lowerTitle.includes('movers') || lowerTitle.includes('📦')) service = 'packers';
      else if (lowerTitle.includes('self-drive') || lowerTitle.includes('self drive')) service = 'self-drive';
      else if (lowerTitle.includes('luxury') || lowerTitle.includes('💎')) service = 'luxury';
      else if (lowerTitle.includes('chauffeur') || lowerTitle.includes('car') || lowerTitle.includes('🚗')) service = 'car';
    }

    // Determine if it's a quote or booking
    const itemId = quoteId || data?.quoteId || bookingId || data?.bookingId;
    const isQuote = !!(quoteId || data?.quoteId);

    console.log('[InApp Notification] Navigate:', { service, itemId, isQuote });

    // Navigate based on service type
    try {
      if (service === 'bike') {
        navigation.navigate(isQuote ? 'BikeQuoteRequestDetail' : 'BikeBookingDetail',
          isQuote ? { requestId: itemId } : { bookingId: itemId });
      } else if (service === 'bus') {
        navigation.navigate(isQuote ? 'BusQuoteRequestDetail' : 'BusBookingDetail',
          isQuote ? { requestId: itemId } : { bookingId: itemId });
      } else if (service === 'truck') {
        navigation.navigate(isQuote ? 'TruckQuoteRequestDetail' : 'TruckBookingDetail',
          isQuote ? { requestId: itemId } : { bookingId: itemId });
      } else if (service === 'equipment') {
        navigation.navigate(isQuote ? 'EquipmentQuoteRequestDetail' : 'EquipmentBookingDetail',
          isQuote ? { requestId: itemId } : { bookingId: itemId });
      } else if (service === 'packers') {
        navigation.navigate(isQuote ? 'PackersQuoteRequestDetail' : 'PackersBookingDetail',
          isQuote ? { requestId: itemId } : { bookingId: itemId });
      } else if (service === 'self-drive') {
        navigation.navigate(isQuote ? 'SelfDriveQuoteRequestDetail' : 'SelfDriveBookingDetailScreen',
          isQuote ? { requestId: itemId } : { bookingId: itemId });
      } else if (service === 'luxury') {
        navigation.navigate(isQuote ? 'LuxuryQuoteDetail' : 'LuxuryBookingDetail',
          isQuote ? { quoteId: itemId } : { bookingId: itemId });
      } else if (service === 'car') {
        navigation.navigate('BookingDetail', { bookingId: itemId });
      } else {
        // Fallback to MyBookings
        navigation.navigate('MyBookings');
      }
    } catch (error) {
      console.error('[InApp Notification] Navigation error:', error);
      navigation.navigate('MyBookings');
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <InAppNotification
          notification={notification}
          onPress={handleNotificationPress}
          onDismiss={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

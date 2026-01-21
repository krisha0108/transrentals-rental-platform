'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import {
  BookingNotification,
  BookingAcceptedData,
  PaymentReceivedData,
} from '@/lib/socket/types';

interface UseVendorBookingsOptions {
  vendorId: string;
  onNewBooking?: (booking: BookingNotification) => void;
  onBookingExpired?: (bookingId: string, reason: string) => void;
  onPaymentReceived?: (payment: PaymentReceivedData) => void;
  playSound?: boolean;
}

export function useVendorBookings({
  vendorId,
  onNewBooking,
  onBookingExpired,
  onPaymentReceived,
  playSound = true,
}: UseVendorBookingsOptions) {
  const [pendingBookings, setPendingBookings] = useState<BookingNotification[]>([]);
  const [lastNotification, setLastNotification] = useState<BookingNotification | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const {
    isConnected,
    connectionError,
    joinVendorRoom,
    leaveVendorRoom,
    on,
    off,
  } = useSocket();

  // Play notification sound with proper cleanup to prevent AbortError
  const playNotificationSound = useCallback(() => {
    if (!playSound) return;

    // If already playing, don't interrupt
    if (isPlayingRef.current) return;

    try {
      // Clean up previous audio instance if exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }

      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audioRef.current = audio;
      isPlayingRef.current = true;

      // Handle end of playback
      audio.onended = () => {
        isPlayingRef.current = false;
        audioRef.current = null;
      };

      // Handle errors
      audio.onerror = () => {
        isPlayingRef.current = false;
        audioRef.current = null;
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch((error) => {
            // Autoplay blocked or interrupted - handle gracefully
            isPlayingRef.current = false;
            audioRef.current = null;
            // Only log if not an abort error (user interaction issue)
            if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
              console.warn('Could not play notification sound:', error.message);
            }
          });
      }
    } catch (error) {
      isPlayingRef.current = false;
      console.warn('Could not play notification sound');
    }
  }, [playSound]);

  // Join vendor room when connected
  useEffect(() => {
    if (isConnected && vendorId) {
      joinVendorRoom(vendorId);
      console.log(`[VendorBookings] Joined room for vendor: ${vendorId}`);

      return () => {
        leaveVendorRoom(vendorId);
      };
    }
  }, [isConnected, vendorId, joinVendorRoom, leaveVendorRoom]);

  // Handle new booking
  useEffect(() => {
    const handleNewBooking = (booking: BookingNotification) => {
      console.log('[VendorBookings] New booking received:', booking);

      setPendingBookings((prev) => {
        // Avoid duplicates
        if (prev.some((b) => b.bookingId === booking.bookingId)) {
          return prev;
        }
        return [booking, ...prev];
      });

      setLastNotification(booking);
      playNotificationSound();
      onNewBooking?.(booking);
    };

    const unsubscribe = on('booking:new', handleNewBooking);
    return unsubscribe;
  }, [on, onNewBooking, playNotificationSound]);

  // Handle booking expired
  useEffect(() => {
    const handleBookingExpired = (data: { bookingId: string; reason: string }) => {
      console.log('[VendorBookings] Booking expired:', data);

      setPendingBookings((prev) =>
        prev.filter((b) => b.bookingId !== data.bookingId)
      );

      onBookingExpired?.(data.bookingId, data.reason);
    };

    const unsubscribe = on('booking:expired', handleBookingExpired);
    return unsubscribe;
  }, [on, onBookingExpired]);

  // Handle booking cancelled
  useEffect(() => {
    const handleBookingCancelled = (data: { bookingId: string; reason: string }) => {
      console.log('[VendorBookings] Booking cancelled:', data);

      setPendingBookings((prev) =>
        prev.filter((b) => b.bookingId !== data.bookingId)
      );
    };

    const unsubscribe = on('booking:cancelled', handleBookingCancelled);
    return unsubscribe;
  }, [on]);

  // Handle payment received
  useEffect(() => {
    const handlePaymentReceived = (payment: PaymentReceivedData) => {
      console.log('[VendorBookings] Payment received:', payment);
      playNotificationSound();
      onPaymentReceived?.(payment);
    };

    const unsubscribe = on('payment:received', handlePaymentReceived);
    return unsubscribe;
  }, [on, onPaymentReceived, playNotificationSound]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      isPlayingRef.current = false;
    };
  }, []);

  // Remove a booking from pending list (after accepting or ignoring)
  const removeBooking = useCallback((bookingId: string) => {
    setPendingBookings((prev) => prev.filter((b) => b.bookingId !== bookingId));
  }, []);

  // Clear last notification
  const clearLastNotification = useCallback(() => {
    setLastNotification(null);
  }, []);

  return {
    isConnected,
    connectionError,
    pendingBookings,
    lastNotification,
    removeBooking,
    clearLastNotification,
  };
}

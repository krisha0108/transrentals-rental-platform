'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  MapPin,
  Calendar,
  Bike,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingNotification } from '@/lib/socket/types';

interface NewBookingNotificationProps {
  booking: BookingNotification | null;
  onAccept: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export function NewBookingNotification({
  booking,
  onAccept,
  onDismiss,
  isVisible,
}: NewBookingNotificationProps) {
  if (!booking) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-0 animate-pulse bg-white/10" />
            </div>

            {/* Header */}
            <div className="relative p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="font-bold text-lg">New Booking!</p>
                    <p className="text-blue-100 text-sm">#{booking.bookingNumber}</p>
                  </div>
                </div>
                <button
                  onClick={onDismiss}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative p-4 text-white space-y-3">
              {/* Vehicle */}
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-blue-200" />
                <span className="font-medium">
                  {booking.brandName} {booking.vehicleModelName}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-200" />
                <span>{booking.locationName}</span>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span>
                  {formatDate(booking.pickupDate)} - {formatDate(booking.dropDate)}
                </span>
                <span className="text-blue-200">•</span>
                <span>{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
              </div>

              {/* Amount */}
              <div className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="text-blue-100">Estimated Amount</span>
                <span className="text-2xl font-bold">₹{booking.estimatedAmount.toLocaleString()}</span>
              </div>

              {/* Urgency */}
              <div className="flex items-center gap-2 text-yellow-300 text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>First vendor to accept wins!</span>
              </div>
            </div>

            {/* Actions */}
            <div className="relative p-4 bg-white/10">
              <Button
                onClick={onAccept}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-3"
              >
                Accept Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating notification badge for sidebar/header
export function BookingNotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
    >
      {count > 9 ? '9+' : count}
    </motion.span>
  );
}

// Socket.io Event Types for Real-Time Bike Booking System

// Booking data sent to vendors
export interface BookingNotification {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  vehicleModelId: string;
  vehicleModelName: string;
  brandName: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  estimatedAmount: number;
  createdAt: string;
}

// Booking accepted notification
export interface BookingAcceptedData {
  bookingId: string;
  bookingNumber: string;
  vendorId: string;
  vendorName: string;
  vendorPhone?: string;
  acceptedVehicleId: string;
  acceptedVehicleName: string;
  dailyRate: number;
  totalAmount: number;
  acceptedAt: string;
}

// Payment received notification
export interface PaymentReceivedData {
  bookingId: string;
  bookingNumber: string;
  amount: number;
  paymentId: string;
  paidAt: string;
}

// Server to Client Events
export interface ServerToClientEvents {
  'booking:new': (data: BookingNotification) => void;
  'booking:accepted': (data: BookingAcceptedData) => void;
  'booking:expired': (data: { bookingId: string; reason: string }) => void;
  'booking:cancelled': (data: { bookingId: string; reason: string }) => void;
  'payment:received': (data: PaymentReceivedData) => void;
  'error': (data: { message: string }) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
  'join:vendor': (vendorId: string) => void;
  'leave:vendor': (vendorId: string) => void;
  'join:booking': (bookingId: string) => void;
  'leave:booking': (bookingId: string) => void;
  'join:location': (locationId: string) => void;
  'leave:location': (locationId: string) => void;
}

// Inter-server Events (for scaling with multiple servers)
export interface InterServerEvents {
  ping: () => void;
}

// Socket Data (stored in socket instance)
export interface SocketData {
  vendorId?: string;
  userId?: string;
  role?: 'vendor' | 'customer' | 'admin';
}

// Room naming conventions
export const SOCKET_ROOMS = {
  vendor: (vendorId: string) => `vendor:${vendorId}`,
  booking: (bookingId: string) => `booking:${bookingId}`,
  location: (locationId: string) => `location:${locationId}`,
  allVendors: 'vendors:all',
} as const;

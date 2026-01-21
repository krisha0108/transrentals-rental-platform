import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Fetch all bookings for the logged-in vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Fetch bookings for this vendor from Setting (simulated for now)
    // In production, this would query actual booking records
    const settingKey = `vendor_bookings_${vendorId}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    // If no real bookings, return sample data for demonstration
    const bookings = setting?.value
      ? JSON.parse(setting.value as string)?.bookings || getSampleBookings()
      : getSampleBookings();

    return NextResponse.json({ bookings });
  } catch (error) {
    logger.error('Failed to fetch vendor bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// Sample bookings for demonstration
function getSampleBookings() {
  return [
    {
      id: 'BK001',
      bookingNumber: 'TR2024120001',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'rahul@example.com',
      vehicleType: 'SUV',
      vehicleName: 'Toyota Fortuner',
      pickupLocation: 'Delhi Airport T3',
      dropLocation: 'Gurgaon Cyber City',
      pickupDate: '2024-12-15',
      pickupTime: '10:00',
      dropDate: '2024-12-15',
      dropTime: '14:00',
      tripType: 'Airport Transfer',
      status: 'pending',
      amount: 3500,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'BK002',
      bookingNumber: 'TR2024120002',
      customerName: 'Priya Patel',
      customerPhone: '+91 87654 32109',
      customerEmail: 'priya@example.com',
      vehicleType: 'Sedan',
      vehicleName: 'Honda City',
      pickupLocation: 'Mumbai, Andheri',
      dropLocation: 'Pune',
      pickupDate: '2024-12-16',
      pickupTime: '06:00',
      dropDate: '2024-12-16',
      dropTime: '18:00',
      tripType: 'Outstation One-Way',
      status: 'pending',
      amount: 4500,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'BK003',
      bookingNumber: 'TR2024110045',
      customerName: 'Amit Kumar',
      customerPhone: '+91 76543 21098',
      customerEmail: 'amit@example.com',
      vehicleType: 'Hatchback',
      vehicleName: 'Maruti Swift',
      pickupLocation: 'Bangalore, Koramangala',
      dropLocation: 'Bangalore, Koramangala',
      pickupDate: '2024-12-10',
      pickupTime: '09:00',
      dropDate: '2024-12-12',
      dropTime: '21:00',
      tripType: 'Self-Drive',
      status: 'confirmed',
      amount: 2500,
      quotedAmount: 2800,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'BK004',
      bookingNumber: 'TR2024110032',
      customerName: 'Sneha Reddy',
      customerPhone: '+91 65432 10987',
      customerEmail: 'sneha@example.com',
      vehicleType: 'Luxury',
      vehicleName: 'Mercedes E-Class',
      pickupLocation: 'Hyderabad, Banjara Hills',
      dropLocation: 'Hyderabad, HITEC City',
      pickupDate: '2024-12-05',
      pickupTime: '08:00',
      dropDate: '2024-12-05',
      dropTime: '20:00',
      tripType: 'Chauffeur Service',
      status: 'completed',
      amount: 8000,
      quotedAmount: 8500,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
  ];
}

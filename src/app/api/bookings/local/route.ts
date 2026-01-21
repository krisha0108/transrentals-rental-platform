import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

const BOOKINGS_FILE = path.join(process.cwd(), 'local-bookings.json');

// Helper to read bookings from file
function readBookings(): any[] {
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('Error reading bookings file', error);
  }
  return [];
}

// Helper to write bookings to file
function writeBookings(bookings: any[]): void {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (error) {
    logger.error('Error writing bookings file', error);
  }
}

/**
 * Local Booking API - Saves to local JSON file
 * POST /api/bookings/local
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate a booking ID
    const bookingId = 'TR' + Date.now().toString().slice(-8);

    // Create booking object
    const booking = {
      id: bookingId,
      bookingType: body.bookingType || body.serviceType || 'general',
      status: 'PENDING',
      customerName: body.name || body.customerInfo?.name || 'Guest',
      customerEmail: body.email || body.customerInfo?.email || '',
      customerPhone: body.phone || body.customerInfo?.phone || '',
      bookingData: body,
      createdAt: new Date().toISOString(),
    };

    // Read existing bookings and add new one
    const bookings = readBookings();
    bookings.unshift(booking);
    writeBookings(bookings);

    console.log('Local booking saved:', bookingId);

    return NextResponse.json({
      success: true,
      message: 'Booking saved successfully!',
      booking_id: bookingId,
    });

  } catch (error) {
    logger.error('Local booking error', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save booking',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const bookings = readBookings();

    return NextResponse.json({
      success: true,
      bookings: bookings.slice(0, 50),
      total: bookings.length,
    });
  } catch (error) {
    logger.error('Fetch bookings error', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch bookings',
      },
      { status: 500 }
    );
  }
}

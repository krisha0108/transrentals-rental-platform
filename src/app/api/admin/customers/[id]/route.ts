import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const customer = await prisma.customers.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        pincode: true,
        gender: true,
        dateOfBirth: true,
        isB2B: true,
        isActive: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        totalSpent: true,
        lastLoginAt: true,
        createdAt: true,
        customer_wallet: { select: { balance: true } },
      },
    });

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const [
      bikeBookings, bikeQuotes,
      busBookings, busQuotes,
      carBookings,
      equipmentBookings, equipmentQuotes,
      luxuryBookings, luxuryQuotes,
      packersBookings, packersQuotes,
      selfDriveQuotes,
      truckBookings, truckQuotes,
      wanderBookings, wanderQuotes,
      tickets,
    ] = await Promise.all([
      prisma.bike_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, locationName: true, pickupDate: true, dropDate: true, pickupTime: true, totalAmount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bike_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, locationName: true, pickupDate: true, dropDate: true, pickupTime: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, pickupDate: true, returnDate: true, pickupTime: true, totalAmount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, pickupDate: true, returnDate: true, pickupTime: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.car_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, locationName: true, pickupDate: true, dropDate: true, pickupTime: true, grandTotal: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.equipment_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, deliveryCity: true, startDate: true, endDate: true, totalAmount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.equipment_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, deliveryCity: true, startDate: true, endDate: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.luxury_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, pickupDate: true, returnDate: true, pickupTime: true, grandTotal: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.luxury_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, pickupDate: true, returnDate: true, pickupTime: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.packers_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, scheduledDate: true, scheduledTime: true, totalAmount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.packers_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, preferredDate: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.self_drive_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, locationName: true, pickupDate: true, dropDate: true, pickupTime: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.truck_bookings.findMany({
        where: { customerId: id },
        select: { id: true, bookingNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, pickupDate: true, pickupTime: true, totalAmount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.truck_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, requestNumber: true, createdAt: true, status: true, pickupCity: true, dropCity: true, pickupDate: true, pickupTime: true, budgetMin: true, budgetMax: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wander_bookings.findMany({
        where: { customerId: id },
        select: { id: true, createdAt: true, status: true, travelDate: true, amount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wander_quote_requests.findMany({
        where: { customerId: id },
        select: { id: true, createdAt: true, status: true, pickupLocation: true, travelDate: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.helpdesk_tickets.findMany({
        where: { customerId: id },
        select: { id: true, createdAt: true, status: true, ticketNo: true, heading: true, priority: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const bookings = [
      ...bikeBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Bike Rental', serviceKey: 'bike', from: b.locationName || null, to: null, startDate: b.pickupDate, endDate: b.dropDate, startTime: b.pickupTime || null, amount: b.totalAmount || null })),
      ...busBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Bus', serviceKey: 'bus', from: b.pickupCity || null, to: b.dropCity || null, startDate: b.pickupDate, endDate: b.returnDate, startTime: b.pickupTime || null, amount: b.totalAmount || null })),
      ...carBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Car Rental', serviceKey: 'car', from: b.locationName || null, to: null, startDate: b.pickupDate, endDate: b.dropDate, startTime: b.pickupTime || null, amount: b.grandTotal || null })),
      ...equipmentBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Equipment', serviceKey: 'equipment', from: b.deliveryCity || null, to: null, startDate: b.startDate, endDate: b.endDate, startTime: null, amount: b.totalAmount || null })),
      ...luxuryBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Luxury', serviceKey: 'luxury', from: b.pickupCity || null, to: b.dropCity || null, startDate: b.pickupDate, endDate: b.returnDate, startTime: b.pickupTime || null, amount: b.grandTotal || null })),
      ...packersBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Packers & Movers', serviceKey: 'packers', from: b.pickupCity || null, to: b.dropCity || null, startDate: b.scheduledDate, endDate: null, startTime: b.scheduledTime || null, amount: b.totalAmount || null })),
      ...truckBookings.map(b => ({ id: b.id, displayId: b.bookingNumber, createdAt: b.createdAt, status: b.status, serviceType: 'Truck', serviceKey: 'truck', from: b.pickupCity || null, to: b.dropCity || null, startDate: b.pickupDate, endDate: null, startTime: b.pickupTime || null, amount: b.totalAmount || null })),
      ...wanderBookings.map(b => ({ id: b.id, displayId: null, createdAt: b.createdAt, status: b.status, serviceType: 'Wander (Tours)', serviceKey: 'wander', from: null, to: null, startDate: b.travelDate, endDate: null, startTime: null, amount: b.amount || null })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const quotes = [
      ...bikeQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Bike Rental', serviceKey: 'bike', from: q.locationName || null, to: null, startDate: q.pickupDate, endDate: q.dropDate, startTime: q.pickupTime || null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...busQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Bus', serviceKey: 'bus', from: q.pickupCity || null, to: q.dropCity || null, startDate: q.pickupDate, endDate: q.returnDate, startTime: q.pickupTime || null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...equipmentQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Equipment', serviceKey: 'equipment', from: q.deliveryCity || null, to: null, startDate: q.startDate, endDate: q.endDate, startTime: null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...luxuryQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Luxury', serviceKey: 'luxury', from: q.pickupCity || null, to: q.dropCity || null, startDate: q.pickupDate, endDate: q.returnDate, startTime: q.pickupTime || null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...packersQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Packers & Movers', serviceKey: 'packers', from: q.pickupCity || null, to: q.dropCity || null, startDate: q.preferredDate, endDate: null, startTime: null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...selfDriveQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Self Drive', serviceKey: 'self_drive', from: q.locationName || null, to: null, startDate: q.pickupDate, endDate: q.dropDate, startTime: q.pickupTime || null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...truckQuotes.map(q => ({ id: q.id, displayId: q.requestNumber, createdAt: q.createdAt, status: q.status, serviceType: 'Truck', serviceKey: 'truck', from: q.pickupCity || null, to: q.dropCity || null, startDate: q.pickupDate, endDate: null, startTime: q.pickupTime || null, budgetMin: q.budgetMin, budgetMax: q.budgetMax })),
      ...wanderQuotes.map(q => ({ id: q.id, displayId: null, createdAt: q.createdAt, status: q.status, serviceType: 'Wander (Tours)', serviceKey: 'wander', from: q.pickupLocation || null, to: null, startDate: q.travelDate, endDate: null, startTime: null, budgetMin: null, budgetMax: null })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ customer, bookings, quotes, tickets });
  } catch (error) {
    console.error('Admin customer detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

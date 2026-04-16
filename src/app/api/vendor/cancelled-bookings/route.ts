// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const CANCELLED_STATUSES = ['CANCELLED', 'REFUNDED', 'EXPIRED'];

/**
 * GET /api/vendor/cancelled-bookings?service=self-drive&page=1&limit=20&search=&startDate=&endDate=
 *
 * service values: bike-rentals | self-drive | car-rental | luxury | bus | packers | transporter | equipment
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service  = searchParams.get('service') || 'self-drive';
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip     = (page - 1) * limit;
    const search   = searchParams.get('search')?.trim() || '';
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    const vendorId = auth.vendorId;

    const searchFilter = search
      ? {
          OR: [
            { customerName:   { contains: search } },
            { customerPhone:  { contains: search } },
            { bookingNumber:  { contains: search } },
          ],
        }
      : {};

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.cancelledAt = {};
      if (startDate) dateFilter.cancelledAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.cancelledAt.lte = end;
      }
    }

    const vendorFilter = {
      OR: [
        { assignedVendorId: vendorId },
        { acceptedVendorId: vendorId },
      ],
    };

    const baseWhere = {
      status: { in: CANCELLED_STATUSES },
      ...vendorFilter,
      ...searchFilter,
      ...dateFilter,
    };

    let bookings: any[] = [];
    let total = 0;

    const commonSelect = {
      id: true, bookingNumber: true,
      customerName: true, customerPhone: true,
      status: true, cancelledAt: true, cancelledBy: true,
      cancellationReason: true, grandTotal: true,
      paidAmount: true, refundAmount: true, createdAt: true,
    };

    switch (service) {
      case 'bike-rentals': {
        const [rows, count] = await Promise.all([
          prisma.bike_bookings.findMany({
            where: {
              status: { in: CANCELLED_STATUSES },
              OR: [{ assignedVendorId: vendorId }, { acceptedVendorId: vendorId }],
              ...searchFilter, ...dateFilter,
            },
            select: {
              ...commonSelect,
              requestedVehicleName: true,
              pickupDate: true, dropDate: true, totalDays: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.bike_bookings.count({
            where: {
              status: { in: CANCELLED_STATUSES },
              OR: [{ assignedVendorId: vendorId }, { acceptedVendorId: vendorId }],
              ...searchFilter, ...dateFilter,
            },
          }),
        ]);
        bookings = rows.map((b) => ({ ...b, vehicleName: b.requestedVehicleName, detailHref: `/vendor/bike-rentals/bookings/${b.id}` }));
        total = count;
        break;
      }

      case 'self-drive': {
        const [rows, count] = await Promise.all([
          prisma.car_bookings.findMany({
            where: { ...baseWhere },
            select: {
              ...commonSelect,
              requestedVehicleName: true,
              pickupDate: true, dropDate: true, totalDays: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.car_bookings.count({ where: { ...baseWhere } }),
        ]);
        bookings = rows.map((b) => ({ ...b, vehicleName: b.requestedVehicleName, detailHref: `/vendor/self-drive/bookings/${b.id}` }));
        total = count;
        break;
      }

      case 'car-rental': {
        const carRentalWhere = {
          status: { in: CANCELLED_STATUSES },
          OR: [{ assignedVendorId: vendorId }, { acceptedVendorId: vendorId }],
          ...searchFilter, ...dateFilter,
        };
        const [rows, count] = await Promise.all([
          prisma.car_bookings.findMany({
            where: carRentalWhere,
            select: {
              ...commonSelect,
              requestedVehicleName: true,
              pickupDate: true, dropDate: true, totalDays: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.car_bookings.count({ where: carRentalWhere }),
        ]);
        bookings = rows.map((b) => ({ ...b, vehicleName: b.requestedVehicleName, detailHref: `/vendor/car-rental/bookings/${b.bookingNumber}` }));
        total = count;
        break;
      }

      case 'bus': {
        const busWhere = {
          status: { in: ['CANCELLED', 'DROPPED'] },
          vendorId: vendorId,
          ...searchFilter, ...dateFilter,
        };
        const [rows, count] = await Promise.all([
          prisma.bus_bookings.findMany({
            where: busWhere,
            select: {
              id: true, bookingNumber: true,
              customerName: true, customerPhone: true,
              status: true, cancelledAt: true, cancelledBy: true,
              cancellationReason: true, totalAmount: true,
              advancePaid: true, refundAmount: true, createdAt: true,
              vehicleName: true,
              pickupDate: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.bus_bookings.count({ where: busWhere }),
        ]);
        bookings = rows.map((b) => ({ ...b, grandTotal: b.totalAmount, paidAmount: b.advancePaid, vehicleName: b.vehicleName || 'Bus', detailHref: `/vendor/bus/bookings/${b.id}` }));
        total = count;
        break;
      }

      case 'packers': {
        const packersWhere = {
          status: { in: ['CANCELLED', 'DROPPED'] },
          vendorId: vendorId,
          ...searchFilter, ...dateFilter,
        };
        const [rows, count] = await Promise.all([
          prisma.packers_bookings.findMany({
            where: packersWhere,
            select: {
              id: true, bookingNumber: true,
              customerName: true, customerPhone: true,
              status: true, cancelledAt: true, cancelledBy: true,
              cancellationReason: true, totalAmount: true,
              advancePaid: true, refundAmount: true, createdAt: true,
              shiftingType: true,
              scheduledDate: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.packers_bookings.count({ where: packersWhere }),
        ]);
        bookings = rows.map((b) => ({
          ...b,
          grandTotal: b.totalAmount,
          paidAmount: b.advancePaid,
          vehicleName: b.shiftingType || 'Shifting Service',
          pickupDate: b.scheduledDate,
          dropDate: b.scheduledDate,
          totalDays: 1,
          detailHref: `/vendor/packers/bookings/${b.id}`,
        }));
        total = count;
        break;
      }

      case 'transporter': {
        const truckWhere = {
          status: { in: ['CANCELLED', 'DROPPED'] },
          vendorId: vendorId,
          ...searchFilter, ...dateFilter,
        };
        const [rows, count] = await Promise.all([
          prisma.truck_bookings.findMany({
            where: truckWhere,
            select: {
              id: true, bookingNumber: true,
              customerName: true, customerPhone: true,
              status: true, cancelledAt: true, cancelledBy: true,
              cancellationReason: true, totalAmount: true,
              advancePaid: true, refundAmount: true, createdAt: true,
              vehicleName: true,
              pickupDate: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.truck_bookings.count({ where: truckWhere }),
        ]);
        bookings = rows.map((b) => ({ ...b, grandTotal: b.totalAmount, paidAmount: b.advancePaid, vehicleName: b.vehicleName || 'Truck', totalDays: 1, detailHref: `/vendor/transporter/bookings/${b.id}` }));
        total = count;
        break;
      }

      case 'equipment': {
        const eqWhere = {
          status: { in: ['CANCELLED', 'DROPPED'] },
          vendorId: vendorId,
          ...searchFilter, ...dateFilter,
        };
        const [rows, count] = await Promise.all([
          prisma.equipment_bookings.findMany({
            where: eqWhere,
            select: {
              id: true, bookingNumber: true,
              customerName: true, customerPhone: true,
              status: true, cancelledAt: true, cancelledBy: true,
              cancellationReason: true, totalAmount: true,
              advancePaid: true, refundAmount: true, createdAt: true,
              equipmentName: true,
              startDate: true, endDate: true, totalDays: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.equipment_bookings.count({ where: eqWhere }),
        ]);
        bookings = rows.map((b) => ({ ...b, grandTotal: b.totalAmount, paidAmount: b.advancePaid, vehicleName: b.equipmentName || 'Equipment', pickupDate: b.startDate, dropDate: b.endDate, detailHref: `/vendor/equipment/bookings/${b.id}` }));
        total = count;
        break;
      }

      case 'luxury': {
        const luxWhere = {
          status: { in: ['CANCELLED', 'EXPIRED', 'DROPPED'] },
          OR: [{ assignedVendorId: vendorId }, { acceptedVendorId: vendorId }],
          ...searchFilter, ...dateFilter,
        };
        const [rows, count] = await Promise.all([
          prisma.luxury_bookings.findMany({
            where: luxWhere,
            select: {
              ...commonSelect,
              vehicleName: true,
              pickupDate: true, dropDate: true, totalDays: true,
            },
            orderBy: { cancelledAt: 'desc' },
            skip, take: limit,
          }),
          prisma.luxury_bookings.count({ where: luxWhere }),
        ]);
        bookings = rows.map((b) => ({ ...b, detailHref: `/vendor/luxury/bookings/${b.id}` }));
        total = count;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch cancelled bookings', error);
    return NextResponse.json({ error: 'Failed to fetch', details: error?.message }, { status: 500 });
  }
}

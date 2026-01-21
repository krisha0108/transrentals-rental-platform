// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Handle different service types
    switch (slug) {
      case 'packers-and-movers':
      case 'packers-movers': {
        const where: any = {};
        if (search) {
          where.OR = [
            { requestNumber: { contains: search } },
            { customerName: { contains: search } },
            { customerPhone: { contains: search } },
            { customerEmail: { contains: search } },
          ];
        }
        if (status && status !== 'ALL') {
          where.status = status;
        }

        const [requests, total] = await Promise.all([
          prisma.packers_quote_requests.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.packers_quote_requests.count({ where }),
        ]);

        return NextResponse.json({
          success: true,
          requests: requests.map((r) => ({
            id: r.id,
            requestNumber: r.requestNumber,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            customerEmail: r.customerEmail,
            serviceType: r.serviceType,
            shiftingType: r.shiftingType,
            pickupCity: r.pickupCity,
            pickupAddress: r.pickupAddress,
            dropCity: r.dropCity,
            dropAddress: r.dropAddress,
            preferredDate: r.preferredDate,
            status: r.status,
            totalQuotesReceived: r.totalQuotesReceived || 0,
            budgetMin: r.budgetMin,
            budgetMax: r.budgetMax,
            createdAt: r.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      case 'truck-rental':
      case 'truck-transport': {
        const where: any = {};
        if (search) {
          where.OR = [
            { requestNumber: { contains: search } },
            { customerName: { contains: search } },
            { customerPhone: { contains: search } },
            { customerEmail: { contains: search } },
          ];
        }
        if (status && status !== 'ALL') {
          where.status = status;
        }

        const [requests, total] = await Promise.all([
          prisma.truck_quote_requests.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.truck_quote_requests.count({ where }),
        ]);

        return NextResponse.json({
          success: true,
          requests: requests.map((r) => ({
            id: r.id,
            requestNumber: r.requestNumber,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            customerEmail: r.customerEmail,
            serviceType: r.goodsType || 'Truck Transport',
            pickupCity: r.pickupCity,
            pickupAddress: r.pickupAddress,
            dropCity: r.dropCity,
            dropAddress: r.dropAddress,
            preferredDate: r.pickupDate,
            status: r.status,
            totalQuotesReceived: r.totalQuotesReceived || 0,
            budgetMin: r.budgetMin,
            budgetMax: r.budgetMax,
            createdAt: r.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      case 'bus-rental':
      case 'bus-charter': {
        const where: any = {};
        if (search) {
          where.OR = [
            { requestNumber: { contains: search } },
            { customerName: { contains: search } },
            { customerPhone: { contains: search } },
            { customerEmail: { contains: search } },
          ];
        }
        if (status && status !== 'ALL') {
          where.status = status;
        }

        const [requests, total] = await Promise.all([
          prisma.bus_quote_requests.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.bus_quote_requests.count({ where }),
        ]);

        return NextResponse.json({
          success: true,
          requests: requests.map((r) => ({
            id: r.id,
            requestNumber: r.requestNumber,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            customerEmail: r.customerEmail,
            serviceType: r.tripType || 'Bus Rental',
            pickupCity: r.pickupCity,
            pickupAddress: r.pickupAddress,
            dropCity: r.dropCity || r.pickupCity,
            dropAddress: r.dropAddress,
            preferredDate: r.departureDate,
            status: r.status,
            totalQuotesReceived: r.totalQuotesReceived || 0,
            budgetMin: r.budgetMin,
            budgetMax: r.budgetMax,
            createdAt: r.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      case 'luxury-car-rental':
      case 'luxury': {
        const where: any = {};
        if (search) {
          where.OR = [
            { requestNumber: { contains: search } },
            { customerName: { contains: search } },
            { customerPhone: { contains: search } },
            { customerEmail: { contains: search } },
          ];
        }
        if (status && status !== 'ALL') {
          where.status = status;
        }

        const [requests, total] = await Promise.all([
          prisma.luxury_quote_requests.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.luxury_quote_requests.count({ where }),
        ]);

        return NextResponse.json({
          success: true,
          requests: requests.map((r) => ({
            id: r.id,
            requestNumber: r.requestNumber,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            customerEmail: r.customerEmail,
            serviceType: r.tripType || 'Luxury Rental',
            pickupCity: r.pickupCity,
            pickupAddress: r.pickupAddress,
            dropCity: r.dropCity || r.pickupCity,
            preferredDate: r.pickupDate,
            status: r.status,
            totalQuotesReceived: r.totalQuotesReceived || 0,
            budgetMin: r.budgetMin,
            budgetMax: r.budgetMax,
            createdAt: r.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      case 'equipment-rental': {
        const where: any = {};
        if (search) {
          where.OR = [
            { requestNumber: { contains: search } },
            { customerName: { contains: search } },
            { customerPhone: { contains: search } },
            { customerEmail: { contains: search } },
          ];
        }
        if (status && status !== 'ALL') {
          where.status = status;
        }

        const [requests, total] = await Promise.all([
          prisma.equipment_quote_requests.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.equipment_quote_requests.count({ where }),
        ]);

        return NextResponse.json({
          success: true,
          requests: requests.map((r) => ({
            id: r.id,
            requestNumber: r.requestNumber,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            customerEmail: r.customerEmail,
            serviceType: r.equipmentType || 'Equipment Rental',
            pickupCity: r.deliveryCity || 'N/A',
            pickupAddress: r.deliveryAddress,
            dropCity: r.deliveryCity || 'N/A',
            preferredDate: r.startDate,
            status: r.status,
            totalQuotesReceived: r.totalQuotesReceived || 0,
            budgetMin: r.budgetMin,
            budgetMax: r.budgetMax,
            createdAt: r.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      default:
        return NextResponse.json({
          success: true,
          requests: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          message: `Quote requests not available for service: ${slug}`,
        });
    }
  } catch (error: any) {
    logger.error('Failed to fetch quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote requests', details: error?.message },
      { status: 500 }
    );
  }
}

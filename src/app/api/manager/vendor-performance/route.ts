import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: true,
        manager_services: true,
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // Get vendors in manager's assigned locations
    const vendors = await prisma.vendors.findMany({
      where: {
        vendor_approved_locations: {
          some: {
            locationId: { in: assignedLocationIds },
          },
        },
      },
      select: {
        id: true,
        businessName: true,
        status: true,
      },
    });

    const vendorIds = vendors.map(v => v.id);

    // Quote tables to query
    const quoteTables = [
      'bike_quotes',
      'bus_quotes',
      'self_drive_quotes',
      'equipment_quotes',
      'luxury_quotes',
      'packers_quotes',
      'truck_quotes'
    ];

    // Aggregated data map
    const performanceData: Record<string, { totalQuotes: number; acceptedQuotes: number }> = {};
    vendorIds.forEach(id => {
      performanceData[id] = { totalQuotes: 0, acceptedQuotes: 0 };
    });

    // Query each quote table
    // Note: We use raw queries or multiple prisma calls. 
    // Since prisma doesn't support generic table names easily, we'll do it manually for each.
    
    const results = await Promise.all([
      // Bike
      prisma.bike_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.bike_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),
      
      // Bus
      prisma.bus_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.bus_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),

      // Self Drive (Car)
      prisma.self_drive_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.self_drive_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),

      // Equipment
      prisma.equipment_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.equipment_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),

      // Luxury
      prisma.luxury_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.luxury_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),

      // Packers
      prisma.packers_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.packers_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),

      // Truck
      prisma.truck_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true }
      }),
      prisma.truck_quotes.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, status: 'ACCEPTED' },
        _count: { id: true }
      }),
    ]);

    // Merge results
    // Results is an array of pairs (Total, Accepted) for each service
    for (let i = 0; i < results.length; i++) {
        const isAcceptedCount = i % 2 === 1;
        const serviceResults = results[i];
        
        serviceResults.forEach((res: any) => {
            if (performanceData[res.vendorId]) {
                if (isAcceptedCount) {
                    performanceData[res.vendorId].acceptedQuotes += res._count.id;
                } else {
                    performanceData[res.vendorId].totalQuotes += res._count.id;
                }
            }
        });
    }

    // Format response
    const data = vendors.map(v => {
      const perf = performanceData[v.id] || { totalQuotes: 0, acceptedQuotes: 0 };
      const acceptanceRate = perf.totalQuotes > 0 
        ? Math.round((perf.acceptedQuotes / perf.totalQuotes) * 100) 
        : 0;

      return {
        id: v.id,
        businessName: v.businessName,
        status: v.status,
        totalQuotes: perf.totalQuotes,
        acceptedQuotes: perf.acceptedQuotes,
        acceptanceRate: acceptanceRate
      };
    });

    // Sort by performance (acceptance rate desc, then total quotes desc)
    data.sort((a, b) => {
        if (b.acceptanceRate !== a.acceptanceRate) {
            return b.acceptanceRate - a.acceptanceRate;
        }
        return b.totalQuotes - a.totalQuotes;
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Error fetching vendor performance:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

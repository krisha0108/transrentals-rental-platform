import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { vendorId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { vendorId } = params;

        // Verify manager has access to this vendor
        const manager = await prisma.admin_users.findUnique({
            where: { id: session.user.id },
            include: {
                manager_locations: true,
            },
        });

        if (!manager || manager.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
        }

        const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

        // Check if vendor is in manager's locations
        const vendor = await prisma.vendors.findFirst({
            where: {
                id: vendorId,
                vendor_approved_locations: {
                    some: {
                        locationId: { in: assignedLocationIds },
                    },
                },
            },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found or access denied.' }, { status: 404 });
        }

        // Fetch quote stats (accepted/rejected) from all quote tables
        const quoteResults = await Promise.all([
            prisma.bike_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
            prisma.bus_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
            prisma.self_drive_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
            prisma.equipment_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
            prisma.luxury_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
            prisma.packers_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
            prisma.truck_quotes.groupBy({
                by: ['status'],
                where: { vendorId },
                _count: { id: true },
            }),
        ]);

        // Aggregate quote stats
        let totalQuotes = 0;
        let acceptedQuotes = 0;
        let rejectedQuotes = 0;
        const quotesByStatus: Record<string, number> = {};
        for (const serviceResults of quoteResults) {
            for (const row of serviceResults) {
                totalQuotes += row._count.id;
                if (row.status === 'ACCEPTED') acceptedQuotes += row._count.id;
                if (row.status === 'REJECTED') rejectedQuotes += row._count.id;
                quotesByStatus[row.status] = (quotesByStatus[row.status] || 0) + row._count.id;
            }
        }

        // Fetch bookings from all tables
        const [
            bike, bus, car, chauffeur, equipment, luxury, packers, truck, direct
        ] = await Promise.all([
            prisma.bike_bookings.findMany({ where: { acceptedVendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.bus_bookings.findMany({ where: { vendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.car_bookings.findMany({ where: { acceptedVendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.chauffeur_bookings.findMany({ where: { acceptedVendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.equipment_bookings.findMany({ where: { vendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.luxury_bookings.findMany({ where: { acceptedVendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.packers_bookings.findMany({ where: { vendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.truck_bookings.findMany({ where: { vendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
            prisma.vendor_direct_bookings.findMany({ where: { vendorId: vendorId }, orderBy: { createdAt: 'desc' } }),
        ]);

        // Normalize results
        const allBookings: any[] = [
            ...bike.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'BIKE',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.grandTotal || b.totalAmount,
                date: b.pickupDate,
                createdAt: b.createdAt,
                details: {
                    location: b.locationName,
                    vehicle: b.acceptedVehicleName || b.requestedVehicleName,
                    duration: `${b.totalDays} Days`,
                    pickup: `${new Date(b.pickupDate).toLocaleDateString()} ${b.pickupTime}`,
                    drop: `${new Date(b.dropDate).toLocaleDateString()} ${b.dropTime}`
                }
            })),
            ...bus.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'BUS',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.baseAmount + b.additionalCharges,
                date: b.pickupDate,
                createdAt: b.createdAt,
                details: {
                    from: b.pickupCity,
                    to: b.dropCity,
                    vehicle: b.vehicleName,
                    tripType: b.tripType,
                    pickup: `${new Date(b.pickupDate).toLocaleDateString()} ${b.pickupTime}`,
                    passengers: b.passengers
                }
            })),
            ...car.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'CAR',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.grandTotal,
                date: b.pickupDate,
                createdAt: b.createdAt,
                details: {
                    location: b.locationName,
                    vehicle: b.assignedVehicleName || b.requestedVehicleName,
                    duration: `${b.totalDays} Days`,
                    pickup: `${new Date(b.pickupDate).toLocaleDateString()} ${b.pickupTime}`
                }
            })),
            ...chauffeur.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'CHAUFFEUR',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.grandTotal,
                date: b.pickupDate,
                createdAt: b.createdAt,
                details: {
                    location: b.locationName,
                    trip: b.tripType,
                    car: b.carCategoryName,
                    pickup: `${new Date(b.pickupDate).toLocaleDateString()} ${b.pickupTime}`
                }
            })),
            ...equipment.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'EQUIPMENT',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.totalAmount,
                date: b.startDate,
                createdAt: b.createdAt,
                details: {
                    equipment: b.equipmentName,
                    category: b.equipmentCategory,
                    location: b.deliveryCity,
                    duration: `${b.rentalDays} Days`,
                    period: `${new Date(b.startDate).toLocaleDateString()} to ${new Date(b.endDate).toLocaleDateString()}`
                }
            })),
            ...luxury.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'LUXURY',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.grandTotal,
                date: b.pickupDate,
                createdAt: b.createdAt,
                details: {
                    location: b.locationName,
                    vehicle: `${b.vehicleBrand || ''} ${b.vehicleModel || b.carCategoryName || ''}`,
                    pickup: `${new Date(b.pickupDate).toLocaleDateString()} ${b.pickupTime}`
                }
            })),
            ...packers.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'PACKERS',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.totalAmount,
                date: b.scheduledDate,
                createdAt: b.createdAt,
                details: {
                    type: b.shiftingType,
                    from: b.pickupCity,
                    to: b.dropCity,
                    address: `${b.pickupAddress} -> ${b.dropAddress}`,
                    scheduled: `${new Date(b.scheduledDate).toLocaleDateString()} ${b.scheduledTime || ''}`
                }
            })),
            ...truck.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'TRUCK',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.totalAmount,
                date: b.pickupDate,
                createdAt: b.createdAt,
                details: {
                    vehicle: b.vehicleName,
                    type: b.goodsType,
                    from: b.pickupCity,
                    to: b.dropCity,
                    pickup: `${new Date(b.pickupDate).toLocaleDateString()} ${b.pickupTime}`
                }
            })),
            ...direct.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                serviceType: 'DIRECT',
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                status: b.status,
                amount: b.totalAmount || 0,
                date: b.pickupDate || b.createdAt,
                createdAt: b.createdAt,
                details: {
                    service: b.serviceType,
                    notes: b.notes
                }
            })),
        ];

        // Final sort by creation date
        allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Calculate total earnings from completed bookings
        const totalEarnings = allBookings
            .filter(b => b.status === 'COMPLETED')
            .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        // Count accepted & cancelled bookings
        const acceptedBookings = allBookings.filter(b =>
            ['ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
        ).length;
        const cancelledBookings = allBookings.filter(b => b.status === 'CANCELLED').length;

        return NextResponse.json({
            bookings: allBookings,
            vendorName: vendor.businessName,
            stats: {
                totalQuotes,
                acceptedQuotes,
                rejectedQuotes,
                totalBookings: allBookings.length,
                acceptedBookings,
                cancelledBookings,
                totalEarnings,
                quotesByStatus,
            },
        });
    } catch (error: any) {
        logger.error('Error fetching vendor bookings:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

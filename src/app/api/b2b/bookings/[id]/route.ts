// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Get single B2B booking detail with all quotes, trips
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const booking = await prisma.b2b_bookings.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, companyName: true }
        },
        vendorQuotes: {
          include: {
            vendor: {
              select: {
                id: true, businessName: true, ownerName: true, phone: true, email: true,
                rating: true, logo: true, address: true, city: true,
              }
            },
            quoteVehicles: {
              include: {
                vehicle: {
                  select: {
                    id: true, vehicleName: true, registrationNumber: true,
                    seatingCapacity: true, fuelType: true, transmission: true,
                    color: true, yearOfManufacture: true, images: true,
                    vehicleCondition: true,
                    brands: { select: { id: true, name: true, logo: true } },
                    chauffeur_vehicle_categories: { select: { id: true, name: true, seatingCapacity: true, acType: true, image: true } },
                    vehicle_models: { select: { name: true, sideImage: true, brands: { select: { name: true, logo: true } } } },
                    services: { select: { id: true, name: true, slug: true } },
                  }
                },
                driver: {
                  select: {
                    id: true, name: true, phone: true, profilePhoto: true,
                    licenseNumber: true, licenseExpiry: true, licenseType: true,
                    address: true, city: true,
                  }
                }
              },
              // Pricing fields are included automatically (basePrice, perKmRate, etc.)
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        superQuotes: {
          include: {
            items: {
              include: {
                vendorQuote: {
                  select: {
                    id: true, quoteNumber: true, vehicleCount: true,
                    pricePerVehicle: true, totalPrice: true, notes: true, status: true,
                    vendor: {
                      select: { id: true, businessName: true, ownerName: true, phone: true, city: true, rating: true }
                    },
                    quoteVehicles: {
                      select: {
                        id: true, vehicleName: true, vehicleNumber: true,
                        driverName: true, driverPhone: true,
                        basePrice: true, perKmRate: true, perHourRate: true, perDayRate: true,
                        driverAllowance: true, nightCharges: true, extraKmCharge: true, extraHourCharge: true,
                        vehicle: {
                          select: {
                            id: true, vehicleName: true, registrationNumber: true,
                            seatingCapacity: true, fuelType: true, transmission: true,
                            color: true, yearOfManufacture: true, images: true,
                            brands: { select: { name: true } },
                            vehicle_models: { select: { name: true, sideImage: true } },
                            chauffeur_vehicle_categories: { select: { name: true, acType: true, image: true } },
                          }
                        },
                        driver: {
                          select: { id: true, name: true, phone: true, profilePhoto: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        trips: {
          orderBy: { createdAt: 'asc' },
          include: {
            vendor: { select: { id: true, businessName: true } },
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'B2B booking not found' }, { status: 404 });
    }

    // Strip OTP from trips (should not be exposed in booking detail)
    const sanitizedTrips = booking.trips.map(({ otp, otpGeneratedAt, ...rest }: any) => rest);

    // Trip stats
    const tripStats = {
      total: booking.trips.length,
      pending: booking.trips.filter(t => t.status === 'PENDING').length,
      driverArrived: booking.trips.filter(t => t.status === 'DRIVER_ARRIVED').length,
      started: booking.trips.filter(t => t.status === 'STARTED').length,
      completed: booking.trips.filter(t => t.status === 'COMPLETED').length,
      cancelled: booking.trips.filter(t => t.status === 'CANCELLED' || t.status === 'VENDOR_CANCELLED').length,
    };

    return NextResponse.json({
      status: 'success',
      booking: { ...booking, trips: sanitizedTrips },
      tripStats,
    });
  } catch (error: any) {
    console.error('B2B Booking detail GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch B2B booking detail' }, { status: 500 });
  }
}

// PATCH - Update booking status (cancel, etc)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, reason, cancelledBy } = body;

    const booking = await prisma.b2b_bookings.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'B2B booking not found' }, { status: 404 });
    }

    if (action === 'cancel') {
      if (['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(booking.status)) {
        return NextResponse.json({ error: `Cannot cancel booking in ${booking.status} status` }, { status: 400 });
      }

      await prisma.b2b_bookings.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: cancelledBy || 'customer',
          cancellationReason: reason || null,
        },
      });

      // Cancel all pending trips
      await prisma.b2b_trips.updateMany({
        where: { bookingId: id, status: { in: ['PENDING', 'DRIVER_ARRIVED'] } },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: cancelledBy || 'customer' },
      });

      return NextResponse.json({ status: 'success', message: 'B2B booking cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('B2B Booking PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update B2B booking' }, { status: 500 });
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Helper function to parse inclusions/exclusions (handles both arrays and JSON strings)
const parseArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter(item => item && typeof item === 'string');
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'string') : [];
    } catch {
      // If not valid JSON, treat as comma-separated string
      return field.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * GET /api/quotation-detail/[id]
 * Backward-compatible endpoint for fetching quote details
 * Supports all quote types: bike, bus, truck, equipment, packers, self-drive, luxury
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Try to find the quote in different tables
    // Check bike quote requests
    const bikeQuote = await prisma.bike_quote_requests.findUnique({
      where: { id },
      include: {
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (bikeQuote) {
      const quotes = (bikeQuote.bike_quotes_bike_quotes_requestIdTobike_quote_requests || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        vehicleName: quote.vehicleName,
        totalAmount: quote.totalAmount,
        baseRate: quote.baseAmount,
        securityDeposit: quote.securityDeposit || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      // Get the first/best quote for display
      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: bikeQuote.id,
          requestNumber: bikeQuote.requestNumber,
          type: 'bike',
          customerName: bikeQuote.customerName,
          customerPhone: bikeQuote.customerPhone,
          customerEmail: bikeQuote.customerEmail,
          pickupLocation: bikeQuote.pickupLocation,
          dropLocation: bikeQuote.dropLocation,
          pickupDate: bikeQuote.pickupDate,
          returnDate: bikeQuote.returnDate,
          location_name: bikeQuote.pickupLocation || bikeQuote.locationName || 'N/A',
          status: bikeQuote.status,
          createdAt: bikeQuote.createdAt,
          // Add fields expected by ViewQuoteScreen
          service_name: firstQuote?.vehicleName || 'Bike Rental',
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          // Add inclusions, exclusions, terms for tabs
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: bikeQuote.pickupLocation || bikeQuote.locationName || 'N/A',
            destination: bikeQuote.dropLocation || 'N/A',
            journey_datetime: bikeQuote.pickupDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Check bus quote requests
    const busQuote = await prisma.bus_quote_requests.findUnique({
      where: { id },
      include: {
        bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (busQuote) {
      const quotes = (busQuote.bus_quotes_bus_quotes_requestIdTobus_quote_requests || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        vehicleName: quote.vehicleName,
        vehicleNumber: quote.vehicleNumber,
        seats: quote.seats,
        totalAmount: quote.totalAmount,
        baseRate: quote.baseAmount,
        driverAllowance: quote.driverAllowance || 0,
        tollCharges: quote.tollEstimate || 0,
        parkingCharges: quote.parkingEstimate || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: busQuote.id,
          requestNumber: busQuote.requestNumber,
          type: 'bus',
          customerName: busQuote.customerName,
          customerPhone: busQuote.customerPhone,
          customerEmail: busQuote.customerEmail,
          pickupCity: busQuote.pickupCity,
          pickupAddress: busQuote.pickupAddress,
          dropCity: busQuote.dropCity,
          dropAddress: busQuote.dropAddress,
          pickupDate: busQuote.pickupDate,
          returnDate: busQuote.returnDate,
          passengers: busQuote.passengers,
          location_name: busQuote.pickupCity || 'N/A',
          status: busQuote.status,
          createdAt: busQuote.createdAt,
          service_name: firstQuote?.vehicleName || 'Bus Rental',
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: busQuote.pickupCity || 'N/A',
            destination: busQuote.dropCity || 'N/A',
            journey_datetime: busQuote.pickupDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Check truck quote requests
    const truckQuote = await prisma.truck_quote_requests.findUnique({
      where: { id },
      include: {
        truck_quotes: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (truckQuote) {
      const quotes = (truckQuote.truck_quotes || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        vehicleName: quote.vehicleName,
        totalAmount: quote.totalAmount,
        baseRate: quote.baseAmount,
        loadingCharges: quote.loadingCharges || 0,
        unloadingCharges: quote.unloadingCharges || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: truckQuote.id,
          requestNumber: truckQuote.requestNumber,
          type: 'truck',
          customerName: truckQuote.customerName,
          customerPhone: truckQuote.customerPhone,
          customerEmail: truckQuote.customerEmail,
          pickupCity: truckQuote.pickupCity,
          pickupAddress: truckQuote.pickupAddress,
          dropCity: truckQuote.dropCity,
          dropAddress: truckQuote.dropAddress,
          pickupDate: truckQuote.pickupDate,
          goodsType: truckQuote.goodsType,
          estimatedWeight: truckQuote.estimatedWeight,
          vehicleCategory: truckQuote.vehicleCategory,
          location_name: truckQuote.pickupCity || 'N/A',
          status: truckQuote.status,
          createdAt: truckQuote.createdAt,
          service_name: firstQuote?.vehicleName || `Truck - ${truckQuote.vehicleCategory || 'Rental'}`,
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: truckQuote.pickupCity || 'N/A',
            destination: truckQuote.dropCity || 'N/A',
            journey_datetime: truckQuote.pickupDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Check equipment quote requests
    const equipmentQuote = await prisma.equipment_quote_requests.findUnique({
      where: { id },
      include: {
        equipment_quotes_equipment_quotes_requestIdToequipment_quote_requests: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (equipmentQuote) {
      const quotes = (equipmentQuote.equipment_quotes_equipment_quotes_requestIdToequipment_quote_requests || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        equipmentName: quote.equipmentName,
        totalAmount: quote.totalAmount,
        dailyRate: quote.dailyRate,
        securityDeposit: quote.securityDeposit || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: equipmentQuote.id,
          requestNumber: equipmentQuote.requestNumber,
          type: 'equipment',
          customerName: equipmentQuote.customerName,
          customerPhone: equipmentQuote.customerPhone,
          customerEmail: equipmentQuote.customerEmail,
          location: equipmentQuote.location,
          startDate: equipmentQuote.startDate,
          endDate: equipmentQuote.endDate,
          equipmentType: equipmentQuote.equipmentType,
          location_name: equipmentQuote.location || equipmentQuote.locationName || 'N/A',
          status: equipmentQuote.status,
          createdAt: equipmentQuote.createdAt,
          service_name: firstQuote?.equipmentName || 'Equipment Rental',
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: equipmentQuote.location || equipmentQuote.locationName || 'N/A',
            destination: 'On-site',
            journey_datetime: equipmentQuote.startDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Check packers quote requests
    const packersQuote = await prisma.packers_quote_requests.findUnique({
      where: { id },
      include: {
        packers_quotes_packers_quotes_requestIdTopackers_quote_requests: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (packersQuote) {
      const quotes = (packersQuote.packers_quotes_packers_quotes_requestIdTopackers_quote_requests || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        totalAmount: quote.totalAmount,
        packingCharges: quote.packingCharges || 0,
        loadingCharges: quote.loadingCharges || 0,
        transportCharges: quote.transportCharges || 0,
        unloadingCharges: quote.unloadingCharges || 0,
        unpackingCharges: quote.unpackingCharges || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: packersQuote.id,
          requestNumber: packersQuote.requestNumber,
          type: 'packers',
          customerName: packersQuote.customerName,
          customerPhone: packersQuote.customerPhone,
          customerEmail: packersQuote.customerEmail,
          pickupLocation: packersQuote.pickupLocation,
          dropLocation: packersQuote.dropLocation,
          shiftingDate: packersQuote.shiftingDate,
          shiftingType: packersQuote.shiftingType,
          location_name: packersQuote.pickupLocation || packersQuote.pickupCity || 'N/A',
          status: packersQuote.status,
          createdAt: packersQuote.createdAt,
          service_name: `Packers & Movers - ${packersQuote.shiftingType || 'Moving'}`,
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: packersQuote.pickupLocation || packersQuote.pickupCity || 'N/A',
            destination: packersQuote.dropLocation || 'N/A',
            journey_datetime: packersQuote.shiftingDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Check self-drive quote requests
    const selfDriveQuote = await prisma.self_drive_quote_requests.findUnique({
      where: { id },
      include: {
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (selfDriveQuote) {
      const quotes = (selfDriveQuote.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        vehicleName: quote.vehicleName,
        totalAmount: quote.totalAmount,
        dailyRate: quote.dailyRate,
        securityDeposit: quote.securityDeposit || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: selfDriveQuote.id,
          requestNumber: selfDriveQuote.requestNumber,
          type: 'self-drive',
          customerName: selfDriveQuote.customerName,
          customerPhone: selfDriveQuote.customerPhone,
          customerEmail: selfDriveQuote.customerEmail,
          pickupLocation: selfDriveQuote.pickupLocation,
          pickupDate: selfDriveQuote.pickupDate,
          returnDate: selfDriveQuote.returnDate,
          vehicleType: selfDriveQuote.vehicleType,
          location_name: selfDriveQuote.pickupLocation || selfDriveQuote.locationName || 'N/A',
          status: selfDriveQuote.status,
          createdAt: selfDriveQuote.createdAt,
          service_name: firstQuote?.vehicleName || 'Self-Drive Car',
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: selfDriveQuote.pickupLocation || selfDriveQuote.locationName || 'N/A',
            destination: 'Self-Drive',
            journey_datetime: selfDriveQuote.pickupDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Check luxury quote requests
    const luxuryQuote = await prisma.luxury_quote_requests.findUnique({
      where: { id },
      include: {
        luxury_quotes_luxury_quotes_requestIdToluxury_quote_requests: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (luxuryQuote) {
      const quotes = (luxuryQuote.luxury_quotes_luxury_quotes_requestIdToluxury_quote_requests || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        vehicleName: quote.vehicleName,
        totalAmount: quote.totalAmount,
        baseRate: quote.baseAmount,
        driverAllowance: quote.driverAllowance || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
      }));

      const firstQuote = quotes[0];

      return NextResponse.json({
        success: true,
        quotation: {
          id: luxuryQuote.id,
          requestNumber: luxuryQuote.requestNumber,
          type: 'luxury',
          customerName: luxuryQuote.customerName,
          customerPhone: luxuryQuote.customerPhone,
          customerEmail: luxuryQuote.customerEmail,
          pickupLocation: luxuryQuote.pickupLocation,
          dropLocation: luxuryQuote.dropLocation,
          pickupDate: luxuryQuote.pickupDate,
          vehicleCategory: luxuryQuote.vehicleCategory,
          location_name: luxuryQuote.pickupLocation || luxuryQuote.locationName || 'N/A',
          status: luxuryQuote.status,
          createdAt: luxuryQuote.createdAt,
          service_name: firstQuote?.vehicleName || 'Luxury Car',
          price: firstQuote?.totalAmount || 0,
          min_price: firstQuote?.totalAmount ? Math.round(firstQuote.totalAmount * 0.3) : 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.notes || '',
          booking: {
            location_name: luxuryQuote.pickupLocation || luxuryQuote.locationName || 'N/A',
            destination: luxuryQuote.dropLocation || 'N/A',
            journey_datetime: luxuryQuote.pickupDate || null,
          },
        },
        quotes: quotes,
        service_images: [],
      });
    }

    // Quote not found in any table
    return NextResponse.json(
      { success: false, error: 'Quote not found' },
      { status: 404 }
    );
  } catch (error) {
    logger.error('Error fetching quotation detail', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotation details' },
      { status: 500 }
    );
  }
}

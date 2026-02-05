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

// Helper function to parse vehicle images from quotes or fleet
const parseVehicleImages = (vehicleImages: any, fleetImages: any): string[] => {
  // Helper function to extract images from various formats
  const extractImages = (data: any): string[] => {
    if (!data) return [];

    // If it's a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        const parsed = data === 'null' ? null : JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'string');
        } else if (parsed && typeof parsed === 'object') {
          // Handle object format like {front: "...", back: "...", ...}
          return Object.values(parsed).filter(item => item && typeof item === 'string') as string[];
        }
      } catch {
        // If not valid JSON, try as comma-separated string
        const imgArray = data.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (imgArray.length > 0) return imgArray;
      }
    }

    // If it's already an array
    if (Array.isArray(data)) {
      return data.filter(item => item && typeof item === 'string');
    }

    // If it's already an object
    if (data && typeof data === 'object') {
      return Object.values(data).filter(item => item && typeof item === 'string') as string[];
    }

    return [];
  };

  // First try to get images from the quote's vehicleImages field
  const quotImages = extractImages(vehicleImages);
  if (quotImages.length > 0) return quotImages;

  // If no images from quote, try fleet images
  const flImages = extractImages(fleetImages);
  if (flImages.length > 0) return flImages;

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
            vendor_fleets: {
              select: {
                images: true,
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
        vehicleImages: parseVehicleImages(quote.vehicleImages, quote.vendor_fleets?.images),
      }));

      // Get the first/best quote for display
      const firstQuote = quotes[0];

      // Use already parsed vehicle images from first quote
      const vehicleImages = firstQuote?.vehicleImages || [];

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
          base_amount: firstQuote?.baseRate || 0,
          security_deposit: firstQuote?.securityDeposit || 0,
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
        service_images: vehicleImages,
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
        vehicleImages: quote.vehicleImages,
      }));

      const firstQuote = quotes[0];

      // Parse vehicle images from quote
      const vehicleImages = parseVehicleImages(firstQuote?.vehicleImages, null);

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
          base_amount: firstQuote?.baseRate || 0,
          driver_allowance: firstQuote?.driverAllowance || 0,
          toll_charges: firstQuote?.tollCharges || 0,
          parking_charges: firstQuote?.parkingCharges || 0,
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
        service_images: [], // No images for bus rental
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
          base_amount: firstQuote?.baseRate || 0,
          loading_charges: firstQuote?.loadingCharges || 0,
          unloading_charges: firstQuote?.unloadingCharges || 0,
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
        equipment_quotes: {
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
        locations: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (equipmentQuote) {
      const quotes = (equipmentQuote.equipment_quotes || []).map((quote) => ({
        id: quote.id,
        vendorId: quote.vendorId,
        vendorName: quote.vendors?.businessName || 'Vendor',
        vendorRating: quote.vendors?.rating || 0,
        equipmentName: quote.equipmentName,
        totalAmount: quote.totalAmount,
        dailyRate: quote.dailyRate,
        weeklyRate: quote.weeklyRate,
        monthlyRate: quote.monthlyRate,
        baseAmount: quote.baseAmount || 0,
        operatorCharges: quote.operatorCharges || 0,
        deliveryCharges: quote.deliveryCharges || 0,
        pickupCharges: quote.pickupCharges || 0,
        installationCharges: quote.installationCharges || 0,
        fuelCharges: quote.fuelCharges || 0,
        gstAmount: quote.gstAmount || 0,
        securityDeposit: quote.securityDeposit || 0,
        inclusions: parseArrayField(quote.inclusions),
        exclusions: parseArrayField(quote.exclusions),
        notes: quote.vendorMessage,
        validUntil: quote.validTill,
        status: quote.status,
        createdAt: quote.createdAt,
        equipmentImages: quote.equipmentImages,
      }));

      const firstQuote = quotes[0];

      // Parse equipment images
      const equipmentImages = parseVehicleImages(firstQuote?.equipmentImages, null);

      return NextResponse.json({
        success: true,
        quotation: {
          id: equipmentQuote.id,
          requestNumber: equipmentQuote.requestNumber,
          type: 'equipment',
          customerName: equipmentQuote.customerName,
          customerPhone: equipmentQuote.customerPhone,
          customerEmail: equipmentQuote.customerEmail,
          location: equipmentQuote.deliveryCity,
          startDate: equipmentQuote.startDate,
          endDate: equipmentQuote.endDate,
          equipmentType: equipmentQuote.equipmentType,
          location_name: equipmentQuote.locations?.name || equipmentQuote.deliveryCity || 'N/A',
          status: equipmentQuote.status,
          createdAt: equipmentQuote.createdAt,
          service_name: firstQuote?.equipmentName || 'Equipment Rental',
          price: firstQuote?.totalAmount || 0,
          daily_rate: firstQuote?.dailyRate || 0,
          weekly_rate: firstQuote?.weeklyRate || 0,
          monthly_rate: firstQuote?.monthlyRate || 0,
          base_amount: firstQuote?.baseAmount || 0,
          operator_charges: firstQuote?.operatorCharges || 0,
          delivery_charges: firstQuote?.deliveryCharges || 0,
          pickup_charges: firstQuote?.pickupCharges || 0,
          installation_charges: firstQuote?.installationCharges || 0,
          fuel_charges: firstQuote?.fuelCharges || 0,
          gst_amount: firstQuote?.gstAmount || 0,
          security_deposit: firstQuote?.securityDeposit || 0,
          rental_days: equipmentQuote.rentalDays || 0,
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
            location_name: equipmentQuote.locations?.name || equipmentQuote.deliveryCity || 'N/A',
            destination: equipmentQuote.deliveryAddress || 'On-site',
            journey_datetime: equipmentQuote.startDate || null,
          },
        },
        quotes: quotes,
        service_images: equipmentImages,
      });
    }

    // Check packers quote requests
    const packersQuote = await prisma.packers_quote_requests.findUnique({
      where: { id },
      include: {
        packers_quotes: {
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
      const quotes = (packersQuote.packers_quotes || []).map((quote) => ({
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
          // Price breakdown
          packing_charges: firstQuote?.packingCharges || 0,
          loading_charges: firstQuote?.loadingCharges || 0,
          transport_charges: firstQuote?.transportCharges || 0,
          unloading_charges: firstQuote?.unloadingCharges || 0,
          unpacking_charges: firstQuote?.unpackingCharges || 0,
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
            destination: packersQuote.dropLocation || packersQuote.dropCity || 'To be decided',
            journey_datetime: packersQuote.shiftingDate || packersQuote.preferredDate || packersQuote.createdAt,
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
            vendor_fleets: {
              select: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (selfDriveQuote) {
      const quotes = (selfDriveQuote.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests || [])
        .map((quote) => {
          // Parse images for this quote
          const parsedImages = parseVehicleImages(quote.vehicleImages, quote.vendor_fleets?.images);

          return {
            id: quote.id,
            vendorId: quote.vendorId,
            vendorName: quote.vendors?.businessName || 'Vendor',
            vendorRating: quote.vendors?.rating || 0,
            vehicleName: quote.vehicleName,
            vehicleType: quote.vehicleType,
            vehicleBrand: quote.vehicleBrand,
            vehicleCategory: quote.vehicleCategory,
            vehicleYear: quote.vehicleYear,
            registrationNumber: quote.registrationNumber,
            transmission: quote.transmission,
            fuelType: quote.fuelType,
            seats: quote.seats,
            vehicleFeatures: parseArrayField(quote.vehicleFeatures),
            baseAmount: quote.baseAmount || 0,
            dailyRate: quote.dailyRate || 0,
            securityDeposit: quote.securityDeposit || 0,
            extraKmRate: quote.extraKmRate || 0,
            kmLimitPerDay: quote.kmLimitPerDay || 0,
            pickupCharges: quote.pickupCharges || 0,
            deliveryCharges: quote.deliveryCharges || 0,
            platformFee: quote.platformFee || 0,
            gstAmount: quote.gstAmount || 0,
            totalAmount: quote.grandTotal || 0,
            grandTotal: quote.grandTotal || 0,
            advanceAmount: quote.advanceAmount || 0,
            advancePercent: quote.advancePercent || 30,
            inclusions: parseArrayField(quote.inclusions),
            exclusions: parseArrayField(quote.exclusions),
            notes: quote.termsConditions || quote.vendorMessage || '',
            termsConditions: quote.termsConditions,
            validUntil: quote.validTill,
            status: quote.status,
            createdAt: quote.createdAt,
            vehicleImages: parsedImages,
          };
        })
        .sort((a, b) => (a.grandTotal || 0) - (b.grandTotal || 0)); // Sort by price, cheapest first

      const firstQuote = quotes[0];

      // Use first quote's images for service_images
      const vehicleImages = firstQuote?.vehicleImages || [];

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
          price: firstQuote?.grandTotal || firstQuote?.totalAmount || 0,
          base_price: firstQuote?.baseAmount || 0,
          daily_rate: firstQuote?.dailyRate || 0,
          security_deposit: firstQuote?.securityDeposit || 0,
          extra_km_rate: firstQuote?.extraKmRate || 0,
          km_limit_per_day: firstQuote?.kmLimitPerDay || 0,
          pickup_charges: firstQuote?.pickupCharges || 0,
          delivery_charges: firstQuote?.deliveryCharges || 0,
          platform_fee: firstQuote?.platformFee || 0,
          gst_amount: firstQuote?.gstAmount || 0,
          min_price: firstQuote?.advanceAmount || 0,
          vendor: firstQuote?.vendorId ? {
            id: firstQuote.vendorId,
            name: firstQuote.vendorName,
            rating: firstQuote.vendorRating,
          } : null,
          included: firstQuote?.inclusions?.length > 0 ? firstQuote.inclusions.join(', ') : '',
          not_included: firstQuote?.exclusions?.length > 0 ? firstQuote.exclusions.join(', ') : '',
          terms: firstQuote?.termsConditions || firstQuote?.notes || '',
          vehicle_details: {
            name: firstQuote?.vehicleName,
            type: firstQuote?.vehicleType,
            brand: firstQuote?.vehicleBrand,
            category: firstQuote?.vehicleCategory,
            year: firstQuote?.vehicleYear,
            registration: firstQuote?.registrationNumber,
            transmission: firstQuote?.transmission,
            fuel_type: firstQuote?.fuelType,
            seats: firstQuote?.seats,
            features: firstQuote?.vehicleFeatures || [],
          },
          booking: {
            location_name: selfDriveQuote.pickupLocation || selfDriveQuote.locationName || 'N/A',
            destination: 'Self-Drive',
            journey_datetime: selfDriveQuote.pickupDate || null,
          },
        },
        quotes: quotes,
        service_images: vehicleImages,
      });
    }

    // Check luxury quote requests
    const luxuryQuote = await prisma.luxury_quote_requests.findUnique({
      where: { id },
      include: {
        luxury_quotes: {
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                phone: true,
              },
            },
            vendor_fleets: {
              select: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (luxuryQuote) {
      const quotes = (luxuryQuote.luxury_quotes || []).map((quote) => ({
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
        vehicleImages: parseVehicleImages(quote.vehicleImages, quote.vendor_fleets?.images),
      }));

      const firstQuote = quotes[0];

      // Use already parsed vehicle images from first quote
      const vehicleImages = firstQuote?.vehicleImages || [];

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
          base_amount: firstQuote?.baseRate || 0,
          driver_allowance: firstQuote?.driverAllowance || 0,
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
        service_images: vehicleImages,
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

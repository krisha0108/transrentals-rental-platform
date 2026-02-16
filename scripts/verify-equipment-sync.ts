
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const serviceSlug = 'equipment-rental';
    const locationSlug = 'chandigarh';

    console.log(`\nChecking sync for Service: ${serviceSlug}, Location: ${locationSlug}`);

    const service = await prisma.services.findUnique({
        where: { slug: serviceSlug }
    });

    if (!service) {
        console.error('Service not found');
        return;
    }

    const location = await prisma.locations.findUnique({
        where: { slug: locationSlug }
    });

    if (!location) {
        console.error('Location not found');
        return;
    }

    console.log(`Service ID: ${service.id}`);
    console.log(`Location ID: ${location.id}`);

    const vehicles = await prisma.vehicle_models.findMany({
        where: {
            serviceId: service.id,
            isActive: true,
            vehicle_model_locations: {
                some: {
                    locationId: location.id,
                    isActive: true
                }
            }
        },
        include: {
            brands: true,
            vehicle_model_locations: {
                where: { locationId: location.id }
            }
        }
    });

    console.log(`\nFound ${vehicles.length} equipment items assigned to ${locationSlug}`);

    vehicles.forEach(v => {
        console.log(`- ${v.name} (${v.slug})`);
        console.log(`  Price: ${v.vehicle_model_locations[0]?.basePricePerDay || v.basePricePerDay}`);
    });

    if (vehicles.length === 0) {
        console.log('\n--- ATTEMPTING TO ASSIGN AN EQUIPMENT ITEM FOR TESTING ---');
        // Find any equipment item and assign it to Chandigarh
        const anyVehicle = await prisma.vehicle_models.findFirst({
            where: { serviceId: service.id }
        });

        if (anyVehicle) {
            console.log(`Assigning ${anyVehicle.name} to ${locationSlug}...`);
            await prisma.vehicle_model_locations.upsert({
                where: {
                    vehicleModelId_locationId: {
                        vehicleModelId: anyVehicle.id,
                        locationId: location.id
                    }
                },
                create: {
                    id: 'test-eq-assignment-' + Date.now(),
                    vehicleModelId: anyVehicle.id,
                    locationId: location.id,
                    isActive: true,
                    basePricePerDay: 5500
                },
                update: {
                    isActive: true,
                    basePricePerDay: 5500
                }
            });
            console.log('Assignment completed. Run script again to verify.');
        } else {
            console.log('No equipment items found in database to assign.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

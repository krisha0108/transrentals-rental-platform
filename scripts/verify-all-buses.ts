
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const service = await prisma.services.findUnique({
        where: { slug: 'bus-rental' }
    });

    if (!service) {
        console.log('Bus Rental service not found');
        return;
    }

    const vehicles = await prisma.vehicle_models.findMany({
        where: { serviceId: service.id },
        include: {
            services_vehicle_models_subServiceIdToservices: true,
            chauffeur_vehicle_categories: true
        }
    });

    console.log(`\nFound ${vehicles.length} vehicles for Bus Rental\n`);
    vehicles.forEach(v => {
        console.log(`ID: ${v.id}`);
        console.log(`Name: ${v.name}`);
        console.log(`Slug: ${v.slug}`);
        console.log(`SubService (Primary Category): ${v.services_vehicle_models_subServiceIdToservices?.name || 'NULL'}`);
        console.log(`Chauffeur Category (Fallback): ${v.chauffeur_vehicle_categories?.name || 'NULL'}`);
        console.log(`BodyType (Second Fallback): ${v.bodyType || 'NULL'}`);
        console.log('-'.repeat(40));
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

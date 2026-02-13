
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

    console.log('--- Bus Rental Service ---');
    console.log(service);

    const subServices = await prisma.services.findMany({
        where: { parentId: service.id }
    });

    console.log('\n--- Sub Services ---');
    subServices.forEach(s => console.log(`${s.name} (${s.slug}) - ID: ${s.id}`));

    const vehicles = await prisma.vehicle_models.findMany({
        where: { serviceId: service.id },
        include: {
            services_vehicle_models_subServiceIdToservices: true,
            chauffeur_vehicle_categories: true
        }
    });

    console.log('\n--- Vehicles ---');
    vehicles.forEach(v => {
        console.log(`Vehicle: ${v.name}, subServiceId: ${v.subServiceId}, CategoryName: ${v.services_vehicle_models_subServiceIdToservices?.name || 'NULL'}`);
        console.log(`vehicleCategoryId: ${v.vehicleCategoryId}, ChauffeurCategoryName: ${v.chauffeur_vehicle_categories?.name || 'NULL'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

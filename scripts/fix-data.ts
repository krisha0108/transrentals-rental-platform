
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.chauffeur_vehicle_categories.updateMany({
        where: { name: 'wesefvsd' },
        data: {
            name: 'Luxury Bus',
            slug: 'luxury-bus'
        }
    });

    console.log(`Updated ${result.count} category records`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

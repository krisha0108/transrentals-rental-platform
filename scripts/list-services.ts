
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.services.findMany({
        orderBy: { name: 'asc' }
    });

    console.log('--- All Services ---');
    services.forEach(s => {
        console.log(`${s.name.padEnd(30)} | ${s.slug.padEnd(30)} | Parent: ${s.parentId || 'None'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

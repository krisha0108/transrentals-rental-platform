
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.service.findMany({
        select: { name: true, id: true, slug: true }
    });
    console.log('All Services:', services);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

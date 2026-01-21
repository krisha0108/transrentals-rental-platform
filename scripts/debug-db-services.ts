
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching services from Prisma DB...');
    try {
        const services = await prisma.service.findMany({ take: 5 });
        console.log('Found services:', services.length);
        if (services.length > 0) {
            console.log('First service:', JSON.stringify(services[0], null, 2));
            console.log('Service ID Type:', typeof services[0].id);
        } else {
            console.log('Service table is empty.');
        }
    } catch (error) {
        console.error('Error querying DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

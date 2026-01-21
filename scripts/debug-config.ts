
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Checking ServicePaymentConfig...');
    try {
        const configs = await prisma.servicePaymentConfig.findMany();
        console.log('Found configs:', configs.length);
        if (configs.length > 0) {
            console.log('Sample Config:', JSON.stringify(configs[0], null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

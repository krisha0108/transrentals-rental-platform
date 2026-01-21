import { prisma } from '../src/lib/db/prisma';

async function main() {
    const packages = await prisma.chauffeurLocalPackage.findMany({
        include: {
            location: true,
            vehicleCategory: true
        }
    });

    console.log('Total Local Packages:', packages.length);
    packages.forEach(pkg => {
        console.log(`Package: ${pkg.name}, City: ${pkg.location?.name || 'All'}, Category: ${pkg.vehicleCategory?.name}`);
    });

    const locations = await prisma.location.findMany({
        take: 10
    });
    console.log('Sample Locations:', locations.map(l => ({ id: l.id, name: l.name })));
}

main().catch(console.error);

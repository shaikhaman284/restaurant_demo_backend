import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Listing all restaurants...');
    const restaurants = await prisma.restaurant.findMany({
        include: {
            categories: true,
            tables: true
        }
    });

    restaurants.forEach(r => {
        console.log(`Restaurant: ${r.name} (ID: ${r.id})`);
        console.log(`- Categories: ${r.categories.length}`);
        console.log(`- Tables: ${r.tables.length}`);
        if (r.tables.length > 0) {
            console.log(`- Sample Table ID: ${r.tables[0].id}`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

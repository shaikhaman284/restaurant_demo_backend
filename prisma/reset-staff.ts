import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetStaff() {
    console.log('🔄 Resetting staff accounts...');

    // Delete all existing staff
    await prisma.staff.deleteMany({});
    console.log('✅ Deleted existing staff');

    // Get restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
        console.error('❌ No restaurant found!');
        return;
    }

    // Create staff with hashed passwords
    const staff = await Promise.all([
        prisma.staff.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Admin User',
                email: 'admin@fuelheadquarters.com',
                password: await bcrypt.hash('admin123', 10),
                role: 'ADMIN',
            },
        }),
        prisma.staff.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Manager User',
                email: 'manager@fuelheadquarters.com',
                password: await bcrypt.hash('manager123', 10),
                role: 'MANAGER',
            },
        }),
        prisma.staff.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Waiter User',
                email: 'waiter@fuelheadquarters.com',
                password: await bcrypt.hash('waiter123', 10),
                role: 'WAITER',
            },
        }),
        prisma.staff.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Cashier User',
                email: 'cashier@fuelheadquarters.com',
                password: await bcrypt.hash('cashier123', 10),
                role: 'CASHIER',
            },
        }),
        prisma.staff.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Kitchen User',
                email: 'kitchen@fuelheadquarters.com',
                password: await bcrypt.hash('kitchen123', 10),
                role: 'KITCHEN',
            },
        }),
    ]);

    console.log('✅ Created', staff.length, 'staff members');
    console.log('\nStaff accounts:');
    staff.forEach(s => {
        console.log(`  - ${s.email} (${s.role})`);
    });
}

resetStaff()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

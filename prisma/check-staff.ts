import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkStaff() {
    console.log('🔍 Checking staff accounts...\n');

    const staff = await prisma.staff.findMany({
        include: { restaurant: true },
    });

    console.log(`Found ${staff.length} staff members:\n`);

    for (const s of staff) {
        console.log(`Email: ${s.email}`);
        console.log(`Name: ${s.name}`);
        console.log(`Role: ${s.role}`);
        console.log(`Active: ${s.isActive}`);
        console.log(`Restaurant: ${s.restaurant.name}`);
        console.log(`Password Hash: ${s.password.substring(0, 20)}...`);

        // Test password
        const testPassword = s.email.includes('admin') ? 'admin123' :
            s.email.includes('manager') ? 'manager123' :
                s.email.includes('waiter') ? 'waiter123' :
                    s.email.includes('cashier') ? 'cashier123' : 'kitchen123';

        const isValid = await bcrypt.compare(testPassword, s.password);
        console.log(`Password "${testPassword}" valid: ${isValid}`);
        console.log('---');
    }
}

checkStaff()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { PrismaClient, DietaryType, StaffRole, TableStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { config } from '../src/config';

const prisma = new PrismaClient();

async function generateQRCode(restaurantId: string, tableId: string): Promise<string> {
    const url = `${config.frontendUrl}/order/${restaurantId}/${tableId}`;
    return await QRCode.toDataURL(url);
}

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Restaurant
    let restaurant = await prisma.restaurant.findFirst({
        where: { email: 'contact@fuelheadquarters.com' }
    });

    if (!restaurant) {
        restaurant = await prisma.restaurant.create({
            data: {
                name: 'Fuel Headquarters',
                logo: '/logo.png',
                gstNumber: '29ABCDE1234F1Z5',
                fssaiNumber: '12345678901234',
                address: '123 Main Street, Bangalore, Karnataka 560001',
                phone: '+91 9876543210',
                email: 'contact@fuelheadquarters.com',
            },
        });
        console.log('✅ Created restaurant:', restaurant.name);
    } else {
        console.log('ℹ️ Restaurant already exists:', restaurant.name);
    }

    // Create Staff Members
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const staffData = [
        { name: 'Admin User', email: 'admin@fuelheadquarters.com', role: StaffRole.ADMIN },
        { name: 'Manager User', email: 'manager@fuelheadquarters.com', role: StaffRole.MANAGER },
        { name: 'Waiter User', email: 'waiter@fuelheadquarters.com', role: StaffRole.WAITER },
        { name: 'Cashier User', email: 'cashier@fuelheadquarters.com', role: StaffRole.CASHIER },
        { name: 'Kitchen User', email: 'kitchen@fuelheadquarters.com', role: StaffRole.KITCHEN },
    ];

    for (const s of staffData) {
        await prisma.staff.upsert({
            where: { email: s.email },
            update: {},
            create: {
                restaurantId: restaurant.id,
                name: s.name,
                email: s.email,
                password: hashedPassword,
                role: s.role,
            },
        });
    }

    console.log('✅ Verified staff members');

    // Create Tables
    const tableNames = [
        // Numbered tables
        ...Array.from({ length: 20 }, (_, i) => `${i + 1}`),
        // Named tables
        'Mr. Maya', 'Mr. Anuj A.', 'Squaro FL.', 'SINGER', 'POLICE',
        // Area tables
        'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
        'PDR',
        'SMO1', 'SMO2', 'SMO3', 'SMO4', 'SMO5',
    ];

    for (const tableName of tableNames) {
        const qrCodeUrl = `${config.frontendUrl}/order/${restaurant.id}/placeholder-${tableName}`; // Placeholder, will update with ID

        // First ensure table exists
        const table = await prisma.table.upsert({
            where: {
                restaurantId_tableNumber: {
                    restaurantId: restaurant.id,
                    tableNumber: tableName,
                }
            },
            update: {},
            create: {
                restaurantId: restaurant.id,
                tableNumber: tableName,
                qrCode: `temp-${tableName}`, // Temporary unique
                capacity: Math.floor(Math.random() * 4) + 2,
                status: TableStatus.AVAILABLE,
            }
        });

        // Generate real QR
        const realUrl = `${config.frontendUrl}/order/${restaurant.id}/${table.id}`;
        const qrCode = await QRCode.toDataURL(realUrl);

        await prisma.table.update({
            where: { id: table.id },
            data: { qrCode }
        });
    }

    console.log('✅ Verified tables with QR codes');

    // Create Categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Chef Special',
                icon: '👨‍🍳',
                sortOrder: 1,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Triple Blend',
                icon: '🥤',
                sortOrder: 2,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Hot Chocolate',
                icon: '☕',
                sortOrder: 3,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Cold Brew & Mocktails',
                icon: '🍹',
                sortOrder: 4,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Hot Brownie',
                icon: '🍰',
                sortOrder: 5,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Pastas',
                icon: '🍝',
                sortOrder: 6,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Soups',
                icon: '🍲',
                sortOrder: 7,
            },
        }),
        prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Tandoor',
                icon: '🔥',
                sortOrder: 8,
            },
        }),
    ]);

    console.log('✅ Created', categories.length, 'categories');

    // Create Menu Items with Variations and Addons
    const menuItems = [
        // Chef Special
        {
            name: 'Peri Peri French Fries',
            categoryId: categories[0].id,
            price: 149,
            description: 'Crispy french fries tossed in spicy peri peri seasoning',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },
        {
            name: 'Tangy Paneer Pizza',
            categoryId: categories[0].id,
            price: 369,
            description: 'Wood-fired pizza with tangy paneer and special sauce',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Chicken Tikka Wrap',
            categoryId: categories[0].id,
            price: 249,
            description: 'Grilled chicken tikka wrapped in soft tortilla',
            dietary: DietaryType.NON_VEG,
            isCustomizable: false,
        },

        // Triple Blend
        {
            name: 'Classic Triple Blend Coffee',
            categoryId: categories[1].id,
            price: 179,
            description: 'Signature blend of three premium coffee beans',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Caramel Triple Blend',
            categoryId: categories[1].id,
            price: 199,
            description: 'Triple blend coffee with rich caramel flavor',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },

        // Hot Chocolate
        {
            name: 'Classic Hot Chocolate',
            categoryId: categories[2].id,
            price: 159,
            description: 'Rich and creamy hot chocolate',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Dark Chocolate Delight',
            categoryId: categories[2].id,
            price: 189,
            description: 'Intense dark chocolate with a hint of vanilla',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },

        // Cold Brew & Mocktails
        {
            name: 'Vanilla Cold Brew',
            categoryId: categories[3].id,
            price: 219,
            description: 'Smooth cold brew with vanilla essence',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Blue Lagoon Mocktail',
            categoryId: categories[3].id,
            price: 199,
            description: 'Refreshing blue curacao mocktail',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },
        {
            name: 'Virgin Mojito',
            categoryId: categories[3].id,
            price: 179,
            description: 'Classic mojito without alcohol',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },

        // Hot Brownie
        {
            name: 'Chocolate Fudge Brownie',
            categoryId: categories[4].id,
            price: 229,
            description: 'Warm chocolate brownie with vanilla ice cream',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Nutella Brownie',
            categoryId: categories[4].id,
            price: 249,
            description: 'Brownie loaded with Nutella and hazelnuts',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },

        // Pastas
        {
            name: 'Alfredo Pasta',
            categoryId: categories[5].id,
            price: 299,
            description: 'Creamy white sauce pasta with herbs',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Arrabbiata Pasta',
            categoryId: categories[5].id,
            price: 279,
            description: 'Spicy tomato-based pasta',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },
        {
            name: 'Chicken Pesto Pasta',
            categoryId: categories[5].id,
            price: 349,
            description: 'Pasta with basil pesto and grilled chicken',
            dietary: DietaryType.NON_VEG,
            isCustomizable: false,
        },

        // Soups
        {
            name: 'Tomato Soup',
            categoryId: categories[6].id,
            price: 129,
            description: 'Classic creamy tomato soup',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },
        {
            name: 'Sweet Corn Soup',
            categoryId: categories[6].id,
            price: 139,
            description: 'Thick sweet corn soup with vegetables',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },
        {
            name: 'Hot & Sour Soup',
            categoryId: categories[6].id,
            price: 149,
            description: 'Spicy and tangy Asian-style soup',
            dietary: DietaryType.VEG,
            isCustomizable: true,
        },

        // Tandoor
        {
            name: 'Paneer Tikka',
            categoryId: categories[7].id,
            price: 279,
            description: 'Marinated paneer grilled in tandoor',
            dietary: DietaryType.VEG,
            isCustomizable: false,
        },
        {
            name: 'Chicken Tikka',
            categoryId: categories[7].id,
            price: 329,
            description: 'Tender chicken pieces marinated and grilled',
            dietary: DietaryType.NON_VEG,
            isCustomizable: false,
        },
        {
            name: 'Tandoori Chicken',
            categoryId: categories[7].id,
            price: 399,
            description: 'Full chicken marinated in tandoori spices',
            dietary: DietaryType.NON_VEG,
            isCustomizable: true,
        },
    ];

    for (const item of menuItems) {
        const menuItem = await prisma.menuItem.create({
            data: {
                restaurantId: restaurant.id,
                ...item,
            },
        });

        // Add variations for customizable items
        if (item.isCustomizable) {
            await prisma.itemVariation.createMany({
                data: [
                    {
                        menuItemId: menuItem.id,
                        name: 'Regular',
                        price: item.price,
                    },
                    {
                        menuItemId: menuItem.id,
                        name: 'Large',
                        price: item.price + 50,
                    },
                ],
            });

            // Add addons for some items
            if (item.name.includes('Pizza') || item.name.includes('Pasta')) {
                await prisma.itemAddon.createMany({
                    data: [
                        {
                            menuItemId: menuItem.id,
                            name: 'Extra Cheese',
                            price: 30,
                        },
                        {
                            menuItemId: menuItem.id,
                            name: 'Olives',
                            price: 20,
                        },
                    ],
                });
            }

            if (item.name.includes('Coffee') || item.name.includes('Chocolate')) {
                await prisma.itemAddon.createMany({
                    data: [
                        {
                            menuItemId: menuItem.id,
                            name: 'Extra Shot',
                            price: 40,
                        },
                        {
                            menuItemId: menuItem.id,
                            name: 'Whipped Cream',
                            price: 25,
                        },
                    ],
                });
            }
        }
    }

    console.log('✅ Created', menuItems.length, 'menu items with variations and addons');

    console.log('🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

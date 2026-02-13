import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get Restaurant Analytics
export const getRestaurantAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId } = req.params;

        console.log('📊 Analytics request for restaurant:', restaurantId);

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('📅 Date range:', { today, tomorrow });

        // Get all orders from today
        const todaysOrders = await prisma.order.findMany({
            where: {
                restaurantId,
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        console.log('📦 Today\'s orders:', todaysOrders.length);

        // Get active (unpaid) orders
        const activeOrders = await prisma.order.findMany({
            where: {
                restaurantId,
                paymentStatus: 'UNPAID',
            },
        });

        console.log('🔄 Active orders:', activeOrders.length);

        // Get tables
        const tables = await prisma.table.findMany({
            where: { restaurantId },
        });

        console.log('🪑 Tables:', tables.length, 'Occupied:', tables.filter(t => t.status === 'OCCUPIED').length);

        // Calculate stats
        const paidOrders = todaysOrders.filter(o => o.paymentStatus === 'PAID');
        const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

        console.log('💰 Paid orders today:', paidOrders.length, 'Revenue:', revenue);

        const stats = {
            totalOrders: activeOrders.length,
            activeTables: tables.filter(t => t.status === 'OCCUPIED').length,
            todayRevenue: revenue,
            todayOrderCount: todaysOrders.length,
            todayPaidOrders: paidOrders.length,
        };

        console.log('📊 Final stats:', stats);

        res.json(stats);
    } catch (error) {
        console.error('❌ Analytics error:', error);
        throw error;
    }
};

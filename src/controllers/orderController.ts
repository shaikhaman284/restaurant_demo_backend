import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Place Order (Customer)
export const placeOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            restaurantId,
            tableId,
            customerId,
            items, // Array of { menuItemId, variationId?, quantity, addonIds?, specialInstructions? }
            specialInstructions,
        } = req.body;

        if (!restaurantId || !tableId || !customerId || !items || items.length === 0) {
            throw new AppError('Missing required fields', 400);
        }

        // Calculate totals
        let subtotal = 0;
        const orderItemsData = [];

        for (const item of items) {
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
                include: {
                    variations: true,
                    addons: true,
                },
            });

            if (!menuItem) {
                throw new AppError(`Menu item ${item.menuItemId} not found`, 404);
            }

            let itemPrice = menuItem.price;

            // Use variation price if specified
            if (item.variationId) {
                const variation = menuItem.variations.find(v => v.id === item.variationId);
                if (variation) {
                    itemPrice = variation.price;
                }
            }

            // Add addon prices
            if (item.addonIds && item.addonIds.length > 0) {
                for (const addonId of item.addonIds) {
                    const addon = menuItem.addons.find(a => a.id === addonId);
                    if (addon) {
                        itemPrice += addon.price;
                    }
                }
            }

            const totalItemPrice = itemPrice * item.quantity;
            subtotal += totalItemPrice;

            orderItemsData.push({
                menuItemId: item.menuItemId,
                variationId: item.variationId || null,
                quantity: item.quantity,
                price: itemPrice,
                addonIds: item.addonIds || [],
                specialInstructions: item.specialInstructions || null,
            });
        }

        // Calculate tax (18% GST)
        const tax = subtotal * 0.18;
        const total = subtotal + tax;

        // Generate order number
        const orderCount = await prisma.order.count();
        const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`;

        // Create order
        const order = await prisma.order.create({
            data: {
                restaurantId,
                tableId,
                customerId,
                orderNumber,
                subtotal,
                tax,
                total,
                specialInstructions,
                orderItems: {
                    create: orderItemsData,
                },
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                        variation: true,
                    },
                },
                customer: true,
                table: true,
            },
        });

        // Update table status
        await prisma.table.update({
            where: { id: tableId },
            data: {
                status: 'OCCUPIED',
                currentAmount: {
                    increment: total,
                },
            },
        });

        // Add items property for frontend compatibility
        const responseOrder = {
            ...order,
            items: order.orderItems,
            totalAmount: order.total,
            taxAmount: order.tax,
        };

        res.status(201).json(responseOrder);
    } catch (error) {
        next(error);
    }
};

// Get Order Details
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                        variation: true,
                    },
                },
                customer: true,
                table: true,
                kots: true,
            },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Add items property for frontend compatibility
        const responseOrder = {
            ...order,
            items: order.orderItems,
            totalAmount: order.total,
            taxAmount: order.tax,
        };

        res.json(responseOrder);
    } catch (error) {
        next(error);
    }
};

// Get Orders for Table
export const getTableOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { tableId } = req.params;

        const orders = await prisma.order.findMany({
            where: {
                tableId,
                paymentStatus: 'UNPAID',
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                        variation: true,
                    },
                },
                kots: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Add items property for frontend compatibility
        const responseOrders = orders.map(order => ({
            ...order,
            items: order.orderItems,
            totalAmount: order.total,
            taxAmount: order.tax,
        }));

        res.json(responseOrders);
    } catch (error) {
        next(error);
    }
};

// Get Active Orders for Restaurant
export const getActiveOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { restaurantId } = req.params;

        const orders = await prisma.order.findMany({
            where: {
                restaurantId,
                paymentStatus: 'UNPAID',
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                        variation: true,
                    },
                },
                customer: true,
                table: true,
                kots: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Add items property for frontend compatibility
        const responseOrders = orders.map(order => ({
            ...order,
            items: order.orderItems,
            totalAmount: order.total,
            taxAmount: order.tax,
        }));

        res.json(responseOrders);
    } catch (error) {
        next(error);
    }
};

// Update Order Status
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id },
            data: { status: status as OrderStatus },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
                customer: true,
                table: true,
            },
        });

        // Add items property for frontend compatibility
        const responseOrder = {
            ...order,
            items: order.orderItems,
            totalAmount: order.total,
            taxAmount: order.tax,
        };

        res.json(responseOrder);
    } catch (error) {
        next(error);
    }
};

// Get Order History (with filters)
export const getOrderHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { restaurantId } = req.params;
        const { status, paymentStatus, page = 1, limit = 10, startDate, endDate } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: any = {
            restaurantId,
        };

        // Filter by status if provided
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Filter by payment status if provided
        if (paymentStatus && paymentStatus !== 'ALL') {
            where.paymentStatus = paymentStatus;
        }

        // Filter by date range
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        // Get total count for pagination
        const total = await prisma.order.count({ where });

        // Get orders
        const orders = await prisma.order.findMany({
            where,
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                        variation: true,
                    },
                },
                customer: true,
                table: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        // Add items property for frontend compatibility
        const responseOrders = orders.map(order => ({
            ...order,
            items: order.orderItems,
            totalAmount: order.total,
            taxAmount: order.tax,
        }));

        res.json({
            data: responseOrders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

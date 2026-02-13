import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PaymentMethod } from '@prisma/client';

// Generate Bill for Table
export const generateBill = async (req: AuthRequest, res: Response) => {
    try {
        const { tableId } = req.body;

        if (!tableId) {
            throw new AppError('Table ID is required', 400);
        }

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
                customer: true,
                table: true,
            },
        });

        if (orders.length === 0) {
            throw new AppError('No unpaid orders found for this table', 404);
        }

        // Calculate totals
        const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
        const tax = orders.reduce((sum, order) => sum + order.tax, 0);
        const discount = orders.reduce((sum, order) => sum + order.discount, 0);
        const total = subtotal + tax - discount;

        const bill = {
            tableId,
            orders,
            subtotal,
            tax,
            discount,
            total,
            itemCount: orders.reduce((sum, order) => sum + order.orderItems.length, 0),
        };

        res.json(bill);
    } catch (error) {
        throw error;
    }
};

// Apply Discount to Order
export const applyDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, discount, reason } = req.body;

        if (!orderId || discount === undefined) {
            throw new AppError('Order ID and discount amount are required', 400);
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        const newTotal = order.subtotal + order.tax - discount;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                discount,
                total: newTotal,
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });

        res.json(updatedOrder);
    } catch (error) {
        throw error;
    }
};

// Process Payment
export const processPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, paymentMethod } = req.body;

        if (!orderId || !paymentMethod) {
            throw new AppError('Order ID and payment method are required', 400);
        }

        // Get the order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: true,
            },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.paymentStatus === 'PAID') {
            throw new AppError('Order already paid', 400);
        }

        // Update order to paid
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: 'PAID',
                paymentMethod: paymentMethod as PaymentMethod,
            },
        });

        // Check if there are any other unpaid orders for this table
        const unpaidOrders = await prisma.order.findMany({
            where: {
                tableId: order.tableId,
                paymentStatus: 'UNPAID',
            },
        });

        // If no more unpaid orders, reset table
        if (unpaidOrders.length === 0) {
            await prisma.table.update({
                where: { id: order.tableId },
                data: {
                    status: 'AVAILABLE',
                    currentAmount: 0,
                },
            });
        }

        res.json({
            message: 'Payment processed successfully',
            totalAmount: order.total,
        });
    } catch (error) {
        throw error;
    }
};

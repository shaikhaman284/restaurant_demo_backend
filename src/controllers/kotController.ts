import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { KOTStatus } from '@prisma/client';

// Generate KOT for Order
export const generateKOT = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            throw new AppError('Order ID is required', 400);
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                        variation: true,
                    },
                },
                table: true,
            },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Generate KOT number
        const kotCount = await prisma.kOT.count();
        const kotNumber = `KOT${String(kotCount + 1).padStart(6, '0')}`;

        const kot = await prisma.kOT.create({
            data: {
                orderId,
                kotNumber,
                status: 'PENDING',
            },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: true,
                                variation: true,
                            },
                        },
                        table: true,
                        customer: true,
                    },
                },
            },
        });

        res.status(201).json(kot);
    } catch (error) {
        throw error;
    }
};

// Get KOT Details
export const getKOT = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const kot = await prisma.kOT.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: true,
                                variation: true,
                            },
                        },
                        table: true,
                        customer: true,
                    },
                },
            },
        });

        if (!kot) {
            throw new AppError('KOT not found', 404);
        }

        res.json(kot);
    } catch (error) {
        throw error;
    }
};

// Get Active KOTs for Restaurant
export const getActiveKOTs = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId } = req.params;

        const kots = await prisma.kOT.findMany({
            where: {
                order: {
                    restaurantId,
                },
                status: {
                    in: ['PENDING', 'PRINTED', 'PREPARING'],
                },
            },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: true,
                                variation: true,
                            },
                        },
                        table: true,
                        customer: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(kots);
    } catch (error) {
        throw error;
    }
};

// Update KOT Status
export const updateKOTStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updateData: any = { status: status as KOTStatus };

        if (status === 'PRINTED' && !updateData.printedAt) {
            updateData.printedAt = new Date();
        }

        if (status === 'READY' || status === 'SERVED') {
            updateData.completedAt = new Date();
        }

        const kot = await prisma.kOT.update({
            where: { id },
            data: updateData,
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: true,
                            },
                        },
                        table: true,
                    },
                },
            },
        });

        // Update order status based on KOT status
        if (status === 'PREPARING') {
            await prisma.order.update({
                where: { id: kot.orderId },
                data: { status: 'PREPARING' },
            });
        } else if (status === 'READY') {
            await prisma.order.update({
                where: { id: kot.orderId },
                data: { status: 'READY' },
            });
        } else if (status === 'SERVED') {
            await prisma.order.update({
                where: { id: kot.orderId },
                data: { status: 'SERVED' },
            });
        }

        res.json(kot);
    } catch (error) {
        throw error;
    }
};

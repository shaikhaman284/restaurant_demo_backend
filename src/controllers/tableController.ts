import { Response } from 'express';
import QRCode from 'qrcode';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { TableStatus } from '@prisma/client';

// Get All Tables for Restaurant
export const getTables = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId } = req.params;

        const tables = await prisma.table.findMany({
            where: { restaurantId },
            orderBy: { tableNumber: 'asc' },
        });

        res.json(tables);
    } catch (error) {
        throw error;
    }
};

// Get Single Table
export const getTable = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const table = await prisma.table.findUnique({
            where: { id },
            include: {
                orders: {
                    where: {
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
                    },
                },
            },
        });

        if (!table) {
            throw new AppError('Table not found', 404);
        }

        res.json(table);
    } catch (error) {
        throw error;
    }
};

// Create Table
export const createTable = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId, tableNumber, capacity } = req.body;

        if (!restaurantId || !tableNumber) {
            throw new AppError('Restaurant ID and table number are required', 400);
        }

        // Create table first
        const table = await prisma.table.create({
            data: {
                restaurantId,
                tableNumber,
                capacity: capacity || 4,
                qrCode: '', // Temporary
            },
        });

        // Generate QR code
        const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order/${restaurantId}/${table.id}`;
        const qrCode = await QRCode.toDataURL(url);

        // Update table with QR code
        const updatedTable = await prisma.table.update({
            where: { id: table.id },
            data: { qrCode },
        });

        res.status(201).json(updatedTable);
    } catch (error) {
        throw error;
    }
};

// Update Table
export const updateTable = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const table = await prisma.table.update({
            where: { id },
            data,
        });

        res.json(table);
    } catch (error) {
        throw error;
    }
};

// Delete Table
export const deleteTable = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.table.delete({
            where: { id },
        });

        res.json({ message: 'Table deleted successfully' });
    } catch (error) {
        throw error;
    }
};

// Get Table QR Code
export const getTableQR = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const table = await prisma.table.findUnique({
            where: { id },
        });

        if (!table) {
            throw new AppError('Table not found', 404);
        }

        res.json({ qrCode: table.qrCode });
    } catch (error) {
        throw error;
    }
};

// Update Table Status
export const updateTableStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, currentAmount } = req.body;

        const table = await prisma.table.update({
            where: { id },
            data: {
                status: status as TableStatus,
                ...(currentAmount !== undefined && { currentAmount }),
            },
        });

        res.json(table);
    } catch (error) {
        throw error;
    }
};

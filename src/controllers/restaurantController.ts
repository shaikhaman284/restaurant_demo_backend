import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Get Restaurant Details
export const getRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
        });

        if (!restaurant) {
            throw new AppError('Restaurant not found', 404);
        }

        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

// Update Restaurant
export const updateRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const restaurant = await prisma.restaurant.update({
            where: { id },
            data,
        });

        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

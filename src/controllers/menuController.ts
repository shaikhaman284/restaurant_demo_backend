import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { DietaryType } from '@prisma/client';

// Get Full Menu for Customer
export const getCustomerMenu = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId } = req.params;
        const { dietary, search } = req.query;

        const categories = await prisma.category.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            include: {
                menuItems: {
                    where: {
                        isActive: true,
                        ...(dietary && { dietary: dietary as DietaryType }),
                        ...(search && {
                            OR: [
                                { name: { contains: search as string, mode: 'insensitive' } },
                                { description: { contains: search as string, mode: 'insensitive' } },
                            ],
                        }),
                    },
                    include: {
                        variations: {
                            where: { isActive: true },
                        },
                        addons: {
                            where: { isActive: true },
                        },
                    },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        res.json(categories);
    } catch (error) {
        throw error;
    }
};

// Get Categories
export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId } = req.query;

        const categories = await prisma.category.findMany({
            where: restaurantId ? { restaurantId: restaurantId as string } : {},
            orderBy: { sortOrder: 'asc' },
        });

        res.json(categories);
    } catch (error) {
        throw error;
    }
};

// Create Category
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId, name, icon, sortOrder } = req.body;

        const category = await prisma.category.create({
            data: {
                restaurantId,
                name,
                icon,
                sortOrder: sortOrder || 0,
            },
        });

        res.status(201).json(category);
    } catch (error) {
        throw error;
    }
};

// Update Category
export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const category = await prisma.category.update({
            where: { id },
            data,
        });

        res.json(category);
    } catch (error) {
        throw error;
    }
};

// Delete Category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.category.delete({
            where: { id },
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        throw error;
    }
};

// Get Menu Items
export const getMenuItems = async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId, categoryId, dietary } = req.query;

        const menuItems = await prisma.menuItem.findMany({
            where: {
                ...(restaurantId && { restaurantId: restaurantId as string }),
                ...(categoryId && { categoryId: categoryId as string }),
                ...(dietary && { dietary: dietary as DietaryType }),
            },
            include: {
                category: true,
                variations: {
                    where: { isActive: true },
                },
                addons: {
                    where: { isActive: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json(menuItems);
    } catch (error) {
        throw error;
    }
};

// Create Menu Item
export const createMenuItem = async (req: AuthRequest, res: Response) => {
    try {
        const {
            restaurantId,
            categoryId,
            name,
            shortCode,
            onlineDisplayName,
            description,
            price,
            image,
            dietary,
            isCustomizable,
            availableFor,
            variations,
            addons,
        } = req.body;

        const menuItem = await prisma.menuItem.create({
            data: {
                restaurantId,
                categoryId,
                name,
                shortCode,
                onlineDisplayName,
                description,
                price,
                image,
                dietary: dietary || 'VEG',
                isCustomizable: isCustomizable || false,
                availableFor: availableFor || ['DINE_IN', 'DELIVERY', 'PICKUP'],
            },
        });

        // Create variations if provided
        if (variations && variations.length > 0) {
            await prisma.itemVariation.createMany({
                data: variations.map((v: any) => ({
                    menuItemId: menuItem.id,
                    name: v.name,
                    price: v.price,
                })),
            });
        }

        // Create addons if provided
        if (addons && addons.length > 0) {
            await prisma.itemAddon.createMany({
                data: addons.map((a: any) => ({
                    menuItemId: menuItem.id,
                    name: a.name,
                    price: a.price,
                })),
            });
        }

        const fullMenuItem = await prisma.menuItem.findUnique({
            where: { id: menuItem.id },
            include: {
                variations: true,
                addons: true,
            },
        });

        res.status(201).json(fullMenuItem);
    } catch (error) {
        throw error;
    }
};

// Update Menu Item
export const updateMenuItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const menuItem = await prisma.menuItem.update({
            where: { id },
            data,
            include: {
                variations: true,
                addons: true,
            },
        });

        res.json(menuItem);
    } catch (error) {
        throw error;
    }
};

// Delete Menu Item
export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.menuItem.delete({
            where: { id },
        });

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        throw error;
    }
};

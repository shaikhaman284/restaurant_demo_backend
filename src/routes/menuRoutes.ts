import { Router } from 'express';
import {
    getCustomerMenu,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
} from '../controllers/menuController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public/Customer routes
router.get('/customer/:restaurantId', getCustomerMenu);

// Restaurant menu (for management) - returns categories with items
router.get('/restaurant/:restaurantId', getCustomerMenu);

// Category routes
router.get('/categories', authenticate, getCategories);
router.post('/categories', authenticate, authorize('ADMIN', 'MANAGER'), createCategory);
router.patch('/categories/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteCategory);

// Menu item routes
router.get('/items', authenticate, getMenuItems);
router.post('/items', authenticate, authorize('ADMIN', 'MANAGER'), createMenuItem);
router.patch('/items/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateMenuItem);
router.delete('/items/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteMenuItem);

export default router;

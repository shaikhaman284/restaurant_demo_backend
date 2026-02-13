import { Router } from 'express';
import {
    placeOrder,
    getOrder,
    getTableOrders,
    getActiveOrders,
    updateOrderStatus,
    getOrderHistory,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', placeOrder);
router.get('/:id', getOrder);
router.get('/table/:tableId', getTableOrders);
router.get('/restaurant/:restaurantId/active', authenticate, getActiveOrders);
router.get('/restaurant/:restaurantId/history', authenticate, getOrderHistory);
router.patch('/:id/status', authenticate, updateOrderStatus);

export default router;

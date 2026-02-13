import { Router } from 'express';
import {
    generateBill,
    applyDiscount,
    processPayment,
} from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/generate', authenticate, generateBill);
router.post('/discount', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), applyDiscount);
router.post('/payment', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), processPayment);

export default router;

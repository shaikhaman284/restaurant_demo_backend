import { Router } from 'express';
import {
    getTables,
    getTable,
    createTable,
    updateTable,
    deleteTable,
    getTableQR,
    updateTableStatus,
} from '../controllers/tableController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/restaurant/:restaurantId', authenticate, getTables);
router.get('/:id', authenticate, getTable);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createTable);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateTable);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTable);
router.get('/:id/qr', authenticate, getTableQR);
router.patch('/:id/status', authenticate, updateTableStatus);

export default router;

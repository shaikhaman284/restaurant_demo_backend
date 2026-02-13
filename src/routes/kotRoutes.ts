import { Router } from 'express';
import {
    generateKOT,
    getKOT,
    getActiveKOTs,
    updateKOTStatus,
} from '../controllers/kotController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, generateKOT);
router.get('/:id', authenticate, getKOT);
router.get('/restaurant/:restaurantId/active', authenticate, getActiveKOTs);
router.patch('/:id/status', authenticate, updateKOTStatus);

export default router;

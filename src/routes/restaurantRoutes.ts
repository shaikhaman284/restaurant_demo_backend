import { Router } from 'express';
import { getRestaurant, updateRestaurant } from '../controllers/restaurantController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/:id', getRestaurant);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateRestaurant);

export default router;

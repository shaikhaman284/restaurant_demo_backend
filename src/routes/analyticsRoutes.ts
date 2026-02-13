import { Router } from 'express';
import { getRestaurantAnalytics } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/restaurant/:restaurantId', authenticate, getRestaurantAnalytics);

export default router;

import { Router } from 'express';
import {
    staffLogin,
    requestOTP,
    verifyOTP,
    verifySession,
    customerLogout,
} from '../controllers/authController';

const router = Router();

// Staff Authentication
router.post('/staff/login', staffLogin);

// Customer Authentication
router.post('/customer/request-otp', requestOTP);
router.post('/customer/verify-otp', verifyOTP);
router.post('/customer/verify-session', verifySession);
router.post('/customer/logout', customerLogout);

export default router;

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { generateOTP, sendOTP } from '../utils/otp';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

// Staff Login
export const staffLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

        if (!email || !password) {
            throw new AppError('Email and password are required', 400);
        }

        const staff = await prisma.staff.findUnique({
            where: { email },
            include: { restaurant: true },
        });

        console.log('👤 Staff found:', staff ? `Yes (${staff.email})` : 'No');

        if (!staff) {
            throw new AppError('Invalid credentials', 401);
        }

        if (!staff.isActive) {
            throw new AppError('Account is inactive', 403);
        }

        const isPasswordValid = await bcrypt.compare(password, staff.password);
        console.log('🔑 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = generateToken({
            id: staff.id,
            email: staff.email,
            role: staff.role,
            restaurantId: staff.restaurantId,
        });

        res.json({
            token,
            user: {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
                restaurantId: staff.restaurantId,
                restaurant: {
                    id: staff.restaurant.id,
                    name: staff.restaurant.name,
                    logo: staff.restaurant.logo,
                },
            },
        });
    } catch (error) {
        throw error;
    }
};

// Request OTP for Customer
export const requestOTP = async (req: Request, res: Response) => {
    try {
        const { phone, name } = req.body;

        if (!phone || !name) {
            throw new AppError('Phone and name are required', 400);
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(phone)) {
            throw new AppError('Invalid phone number format. Use +91XXXXXXXXXX', 400);
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

        console.log('\n========================================');
        console.log('📱 OTP REQUEST RECEIVED');
        console.log('Phone:', phone);
        console.log('Name:', name);
        console.log('========================================\n');

        // Store OTP in database
        await prisma.oTP.create({
            data: {
                phone,
                code: otp,
                expiresAt,
            },
        });

        // Send OTP (logs to console in demo)
        await sendOTP(phone, otp);

        // Return OTP in response for demo/development purposes
        // In production, remove the otp field from response
        res.json({
            message: 'OTP sent successfully',
            expiresIn: config.otpExpiryMinutes,
            otp: otp, // DEMO ONLY - Remove in production
        });
    } catch (error) {
        throw error;
    }
};

// Verify OTP and Create Session
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { phone, name, otp, tableId } = req.body;

        if (!phone || !name || !otp || !tableId) {
            throw new AppError('Phone, name, OTP, and tableId are required', 400);
        }

        // Find valid OTP
        const otpRecord = await prisma.oTP.findFirst({
            where: {
                phone,
                code: otp,
                verified: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!otpRecord) {
            throw new AppError('Invalid or expired OTP', 401);
        }

        // Mark OTP as verified
        await prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { verified: true },
        });

        // Find or create customer
        let customer = await prisma.customer.findUnique({
            where: { phone },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name,
                    phone,
                },
            });
        } else {
            // Update name if changed
            customer = await prisma.customer.update({
                where: { id: customer.id },
                data: { name },
            });
        }

        // Create session
        const sessionToken = `session_${customer.id}_${Date.now()}`;
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

        const session = await prisma.session.create({
            data: {
                customerId: customer.id,
                tableId,
                sessionToken,
                expiresAt,
            },
        });

        res.json({
            sessionToken: session.sessionToken,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
            },
        });
    } catch (error) {
        throw error;
    }
};

// Verify Customer Session
export const verifySession = async (req: Request, res: Response) => {
    try {
        const { sessionToken } = req.body;

        if (!sessionToken) {
            throw new AppError('Session token is required', 400);
        }

        const session = await prisma.session.findUnique({
            where: { sessionToken },
            include: { customer: true },
        });

        if (!session) {
            throw new AppError('Invalid session', 401);
        }

        if (session.expiresAt < new Date()) {
            throw new AppError('Session expired', 401);
        }

        res.json({
            customer: {
                id: session.customer.id,
                name: session.customer.name,
                phone: session.customer.phone,
            },
            tableId: session.tableId,
        });
    } catch (error) {
        throw error;
    }
};

// Customer Logout
export const customerLogout = async (req: Request, res: Response) => {
    try {
        const { sessionToken } = req.body;

        if (sessionToken) {
            await prisma.session.deleteMany({
                where: { sessionToken },
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        throw error;
    }
};

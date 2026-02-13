import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
}

export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};

export const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
};

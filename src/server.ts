import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { connectRedis } from './config/redis';
import { initializeSocket, setSocketInstance } from './socket/socketHandlers';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import tableRoutes from './routes/tableRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import kotRoutes from './routes/kotRoutes';
import billingRoutes from './routes/billingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);
setSocketInstance(io);

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        config.frontendUrl, // Allow the deployed frontend
        'https://restaurant-demo-frontend-2qh7-neem2m1sw.vercel.app' // Hardcoded fallback just in case
    ],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kots', kotRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Connect to Redis (optional)
        await connectRedis();

        const port = Number(config.port);
        httpServer.listen(port, '0.0.0.0', () => {
            console.log('🚀 Server started successfully!');
            console.log(`📍 Server running on http://localhost:${config.port}`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
            console.log(`🔌 Socket.io ready for connections`);
            console.log(`\n✨ Restaurant QR Ordering System is ready!\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
});

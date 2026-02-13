import { createClient } from 'redis';
import { config } from './index';

const redisClient = createClient({
    url: config.redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.log('❌ Redis: Max retries exhausted. Giving up.');
                return new Error('Max retries exhausted');
            }
            return Math.min(retries * 50, 1000);
        }
    }
});

redisClient.on('error', (err) => {
    // Only log error if not a connection refused (to avoid spamming logs if Redis is missing)
    if (err.code !== 'ECONNREFUSED') {
        console.error('Redis Client Error:', err);
    }
});

redisClient.on('connect', () => console.log('✅ Redis connected'));

export const connectRedis = async () => {
    if (!config.redisUrl || config.redisUrl.includes('localhost')) {
        console.log('ℹ️  Redis URL not found or is localhost. Skipping production connection.');
        return;
    }
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
        console.log('⚠️  Continuing without Redis');
    }
};

export default redisClient;

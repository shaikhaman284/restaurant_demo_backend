import { createClient } from 'redis';
import { config } from './index';

const redisClient = createClient({
    url: config.redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
        console.log('⚠️  Continuing without Redis (sessions will be in-memory)');
    }
};

export default redisClient;

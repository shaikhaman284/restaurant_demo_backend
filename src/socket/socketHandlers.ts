import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';

export const initializeSocket = (httpServer: HTTPServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: config.frontendUrl,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log('🔌 Client connected:', socket.id);

        // Join restaurant room
        socket.on('join:restaurant', (restaurantId: string) => {
            socket.join(`restaurant:${restaurantId}`);
            console.log(`Client ${socket.id} joined restaurant:${restaurantId}`);
        });

        // Join table room
        socket.on('join:table', (tableId: string) => {
            socket.join(`table:${tableId}`);
            console.log(`Client ${socket.id} joined table:${tableId}`);
        });

        // Leave rooms
        socket.on('leave:restaurant', (restaurantId: string) => {
            socket.leave(`restaurant:${restaurantId}`);
        });

        socket.on('leave:table', (tableId: string) => {
            socket.leave(`table:${tableId}`);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected:', socket.id);
        });
    });

    return io;
};

// Export socket instance for use in controllers
let socketInstance: SocketIOServer | null = null;

export const setSocketInstance = (io: SocketIOServer) => {
    socketInstance = io;
};

export const getSocketInstance = (): SocketIOServer | null => {
    return socketInstance;
};

// Helper functions to emit events
export const emitNewOrder = (restaurantId: string, order: any) => {
    if (socketInstance) {
        socketInstance.to(`restaurant:${restaurantId}`).emit('order:new', order);
        console.log('📢 Emitted new order to restaurant:', restaurantId);
    }
};

export const emitOrderStatusUpdate = (tableId: string, order: any) => {
    if (socketInstance) {
        socketInstance.to(`table:${tableId}`).emit('order:status', order);
        console.log('📢 Emitted order status update to table:', tableId);
    }
};

export const emitTableStatusUpdate = (restaurantId: string, table: any) => {
    if (socketInstance) {
        socketInstance.to(`restaurant:${restaurantId}`).emit('table:status', table);
        console.log('📢 Emitted table status update to restaurant:', restaurantId);
    }
};

export const emitKOTStatusUpdate = (restaurantId: string, tableId: string, kot: any) => {
    if (socketInstance) {
        socketInstance.to(`restaurant:${restaurantId}`).emit('kot:status', kot);
        socketInstance.to(`table:${tableId}`).emit('kot:status', kot);
        console.log('📢 Emitted KOT status update');
    }
};

export const emitBillRequest = (restaurantId: string, data: any) => {
    if (socketInstance) {
        socketInstance.to(`restaurant:${restaurantId}`).emit('bill:request', data);
        console.log('📢 Emitted bill request to restaurant:', restaurantId);
    }
};

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  SOCKET_ROOMS,
} from './types';

// Typed Socket.io Server
export type TypedSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Global socket server instance
let io: TypedSocketServer | null = null;

// Initialize Socket.io server
export function initSocketServer(httpServer: HttpServer): TypedSocketServer {
  if (io) {
    console.log('[Socket.io] Server already initialized');
    return io;
  }

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Vendor joins their notification room
    socket.on('join:vendor', (vendorId) => {
      const room = SOCKET_ROOMS.vendor(vendorId);
      socket.join(room);
      socket.data.vendorId = vendorId;
      socket.data.role = 'vendor';
      console.log(`[Socket.io] Vendor ${vendorId} joined room: ${room}`);
    });

    // Vendor leaves their room
    socket.on('leave:vendor', (vendorId) => {
      const room = SOCKET_ROOMS.vendor(vendorId);
      socket.leave(room);
      console.log(`[Socket.io] Vendor ${vendorId} left room: ${room}`);
    });

    // Customer/Vendor joins a specific booking room
    socket.on('join:booking', (bookingId) => {
      const room = SOCKET_ROOMS.booking(bookingId);
      socket.join(room);
      console.log(`[Socket.io] Client joined booking room: ${room}`);
    });

    // Leave booking room
    socket.on('leave:booking', (bookingId) => {
      const room = SOCKET_ROOMS.booking(bookingId);
      socket.leave(room);
      console.log(`[Socket.io] Client left booking room: ${room}`);
    });

    // Join location room (for location-specific notifications)
    socket.on('join:location', (locationId) => {
      const room = SOCKET_ROOMS.location(locationId);
      socket.join(room);
      console.log(`[Socket.io] Client joined location room: ${room}`);
    });

    // Leave location room
    socket.on('leave:location', (locationId) => {
      const room = SOCKET_ROOMS.location(locationId);
      socket.leave(room);
      console.log(`[Socket.io] Client left location room: ${room}`);
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  console.log('[Socket.io] Server initialized successfully');
  return io;
}

// Get the socket server instance
export function getSocketServer(): TypedSocketServer | null {
  return io;
}

// Check if socket server is initialized
export function isSocketServerInitialized(): boolean {
  return io !== null;
}

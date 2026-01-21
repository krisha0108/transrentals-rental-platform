'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/lib/socket/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3, // Limit retries to avoid noise
      reconnectionDelay: 2000,
      timeout: 5000,           // Faster timeout for better UX
    }) as TypedSocket;

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Connected successfully to:', socketUrl);
      setIsConnected(true);
      setConnectionError(null);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      let friendlyMessage = error.message;

      if (error.message === 'xhr poll error' || error.message === 'timeout') {
        friendlyMessage = 'Socket server not reachable. Real-time features disabled. (Try running npm run dev:socket)';
      }

      console.warn('[Socket] Connection optimization:', friendlyMessage);
      setConnectionError(friendlyMessage);
      onError?.(error);

      // If we've hit the retry limit, stop trying to avoid console spam
      if (socket.active === false) {
        console.info('[Socket] Maximum reconnection attempts reached. Please check if the Custom Server (server.ts) is running.');
      }
    });

    (socket as any).on('reconnect_attempt', (attemptNum: number) => {
      console.log(`[Socket] Reconnection attempt ${attemptNum}...`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, onConnect, onDisconnect, onError]);

  // Join vendor room
  const joinVendorRoom = useCallback((vendorId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:vendor', vendorId);
    }
  }, []);

  // Leave vendor room
  const leaveVendorRoom = useCallback((vendorId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:vendor', vendorId);
    }
  }, []);

  // Join booking room
  const joinBookingRoom = useCallback((bookingId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:booking', bookingId);
    }
  }, []);

  // Leave booking room
  const leaveBookingRoom = useCallback((bookingId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:booking', bookingId);
    }
  }, []);

  // Join location room
  const joinLocationRoom = useCallback((locationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:location', locationId);
    }
  }, []);

  // Leave location room
  const leaveLocationRoom = useCallback((locationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:location', locationId);
    }
  }, []);

  // Subscribe to events
  const on = useCallback(<T extends (...args: any[]) => void>(
    event: keyof ServerToClientEvents,
    handler: T
  ) => {
    (socketRef.current as any)?.on(event, handler);
    return () => {
      (socketRef.current as any)?.off(event, handler);
    };
  }, []);

  // Unsubscribe from events
  const off = useCallback(<T extends (...args: any[]) => void>(
    event: keyof ServerToClientEvents,
    handler?: T
  ) => {
    if (handler) {
      (socketRef.current as any)?.off(event, handler);
    } else {
      (socketRef.current as any)?.off(event);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinVendorRoom,
    leaveVendorRoom,
    joinBookingRoom,
    leaveBookingRoom,
    joinLocationRoom,
    leaveLocationRoom,
    on,
    off,
  };
}

// Socket.io exports for easy importing
export * from './types';
export * from './emitters';
export { getSocketServer, isSocketServerInitialized } from './server';

// Get socket server from global (set by custom server.ts)
import { TypedSocketServer } from './server';

export function getIO(): TypedSocketServer | null {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io as TypedSocketServer;
  }
  return null;
}

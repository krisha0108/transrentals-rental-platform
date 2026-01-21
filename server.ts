import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './src/lib/socket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`[Server] Starting server in ${dev ? 'development' : 'production'} mode...`);
console.log(`[Server] Configuration: http://${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io on the HTTP server
  const io = initSocketServer(httpServer);

  // Store io in global for access in API routes
  (global as any).io = io;

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server initialized`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});

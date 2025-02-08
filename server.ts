import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { SocketManager } from './lib/websocket/WebSocketManager';
import { loadScheduledWorkflows, initializeScheduler } from './lib/scheduler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    await app.prepare();
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Initialize Socket.IO with CORS configuration
    const io = new Server(server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Initialize the SocketManager with the Socket.IO server
    const socketManager = SocketManager.getInstance();
    socketManager.setServer(io);
    console.log('Socket.IO server initialized successfully');

    // Load and initialize scheduled workflows
    const scheduledWorkflows = await loadScheduledWorkflows();
    console.log(`Initialized ${scheduledWorkflows.length} scheduled workflows`);
    initializeScheduler(scheduledWorkflows);

    server.listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

startServer(); 
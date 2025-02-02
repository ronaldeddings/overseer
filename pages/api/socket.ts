import { Server as IOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { SocketManager } from '@/lib/websocket/WebSocketManager';

interface ServerWithIO extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends Socket {
  server: ServerWithIO;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

let io: IOServer;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.status(200).end();
    return;
  }

  // Handle initial status check
  if (req.method === 'GET' && !req.url?.includes('socket.io')) {
    try {
      if (!res.socket.server.io) {
        console.log('Setting up Socket.IO server...');
        io = new IOServer(res.socket.server, {
          path: '/api/socket',
          addTrailingSlash: false,
          pingTimeout: 60000,
          pingInterval: 25000,
          cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Accept']
          },
          transports: ['websocket', 'polling'],
          connectTimeout: 45000
        });

        io.on('connection', (socket) => {
          const clientType = socket.handshake.headers.origin?.startsWith('chrome-extension://')
            ? 'extension'
            : 'web';
          
          console.log(`Client connected (${clientType}):`, socket.id);
          
          socket.on('message', (data) => {
            console.log(`Received message from client (${clientType}):`, data);
            socket.emit('message', data);
          });

          socket.on('disconnect', (reason) => {
            console.log(`Client disconnected (${clientType}):`, socket.id, reason);
          });

          socket.on('error', (error) => {
            console.error(`Socket error (${clientType}):`, error);
          });

          // Send initial connection acknowledgment
          socket.emit('message', JSON.stringify({
            type: 'TEST',
            id: 'server_init',
            data: 'Connection established'
          }));
        });

        SocketManager.getInstance().setServer(io);
        res.socket.server.io = io;
        console.log('Socket.IO server initialized successfully');
      }

      res.status(200).json({ status: 'Socket.IO server is running' });
      return;
    } catch (error) {
      console.error('Error setting up Socket.IO server:', error);
      res.status(500).json({ error: 'Failed to initialize Socket.IO server' });
      return;
    }
  }

  // Handle Socket.IO requests
  if (res.socket.server.io) {
    res.end();
    return;
  }

  res.status(400).json({ error: 'Socket.IO server not initialized' });
}

export const config = {
  api: {
    bodyParser: false
  }
}; 
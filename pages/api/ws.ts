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
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    io = new IOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    res.socket.server.io = io;

    // Initialize SocketManager with the IO server
    SocketManager.getInstance().setServer(io);
  }

  res.status(200).json({ status: 'Socket.IO server is running' });
}

export const config = {
  api: {
    bodyParser: false
  }
}; 
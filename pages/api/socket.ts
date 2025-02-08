import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { SocketManager } from '@/lib/websocket/WebSocketManager';

interface ServerWithIO extends HTTPServer {
  io?: SocketIOServer;
}

interface SocketWithIO extends Socket {
  server: ServerWithIO;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

let io: SocketIOServer;
let isInitialized = false;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return early if already initialized
    if (isInitialized) {
      res.status(200).json({ status: 'ok', message: 'Socket.IO server already running' });
      return;
    }

    // Mark as initialized
    isInitialized = true;

    // Return success
    res.status(200).json({ status: 'ok', message: 'Socket.IO server ready' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}; 
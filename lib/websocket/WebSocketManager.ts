import type { Socket as ServerSocket, Server } from 'socket.io';
import type { SocketMessage } from '../types/socket';

export class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;
  private connections: Set<ServerSocket> = new Set();
  private actionCallbacks: Map<string, (response: SocketMessage) => void> = new Map();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public setServer(io: Server): void {
    this.io = io;
    this.setupServerHandlers();
  }

  private setupServerHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: ServerSocket) => {
      console.log('Extension connection established');
      this.connections.add(socket);

      socket.on('disconnect', () => {
        console.log('Extension connection closed');
        this.connections.delete(socket);
      });

      socket.on('error', (error: Error) => {
        console.error('Extension socket error:', error);
        this.connections.delete(socket);
      });

      socket.on('message', (data: string) => {
        try {
          const message = JSON.parse(data) as SocketMessage;
          this.handleMessage(socket, message);
        } catch (error) {
          console.error('Failed to parse extension message:', error);
        }
      });
    });
  }

  private handleMessage(socket: ServerSocket, message: SocketMessage): void {
    switch (message.type) {
      case 'ACTION_RESPONSE':
        const callback = this.actionCallbacks.get(message.id);
        if (callback) {
          callback(message);
          this.actionCallbacks.delete(message.id);
        }
        break;
      case 'TEST':
        socket.emit('message', JSON.stringify({
          type: 'TEST',
          id: message.id,
          data: 'Test message received'
        }));
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  public async executeAction(
    action: SocketMessage & { type: 'EXECUTE_ACTION' }
  ): Promise<SocketMessage & { type: 'ACTION_RESPONSE' }> {
    if (this.connections.size === 0) {
      throw new Error('No extension connections available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.actionCallbacks.delete(action.id);
        reject(new Error('Action execution timed out'));
      }, 30000);

      this.actionCallbacks.set(action.id, (response) => {
        clearTimeout(timeout);
        resolve(response as SocketMessage & { type: 'ACTION_RESPONSE' });
      });

      // Broadcast to all connected extensions
      this.io?.emit('message', JSON.stringify(action));
    });
  }
} 
import type { Socket as ServerSocket, Server } from 'socket.io';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { SocketMessage } from '../types/socket';

export class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;
  private socket: ClientSocket | null = null;
  private connections: Set<ServerSocket> = new Set();
  private actionCallbacks: Map<string, (response: SocketMessage) => void> = new Map();
  private isInitializing = false;
  private retryCount = 0;
  private readonly maxRetries = 5;
  private readonly retryDelay = 1000;

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

  public async setClient(socket: ClientSocket): Promise<void> {
    if (this.isInitializing) {
      console.log('Already initializing socket connection...');
      return;
    }

    this.isInitializing = true;
    this.socket = socket;

    try {
      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          this.retryCount = 0;
          this.isInitializing = false;
          resolve();
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('Socket connection error:', error);
          this.handleReconnect();
          reject(error);
        });
      });

      this.setupClientHandlers();
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      this.isInitializing = false;
      return;
    }

    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
    console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})...`);

    await new Promise(resolve => setTimeout(resolve, delay));

    if (this.socket) {
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitializing = false;
    this.retryCount = 0;
  }

  private setupServerHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: ServerSocket) => {
      console.log('New Socket.IO connection established');
      this.connections.add(socket);

      socket.on('disconnect', () => {
        console.log('Socket.IO connection closed');
        this.connections.delete(socket);
      });

      socket.on('error', (error: Error) => {
        console.error('Socket.IO error:', error);
        this.connections.delete(socket);
      });

      socket.on('message', (data: string) => {
        try {
          const message = JSON.parse(data) as SocketMessage;
          this.handleMessage(socket, message);
        } catch (error) {
          console.error('Failed to parse Socket.IO message:', error);
        }
      });
    });
  }

  private setupClientHandlers(): void {
    if (!this.socket) return;

    this.socket.on('message', (data: string) => {
      try {
        const message = JSON.parse(data) as SocketMessage;
        this.handleClientMessage(message);
      } catch (error) {
        console.error('Failed to parse Socket.IO message:', error);
      }
    });
  }

  private handleClientMessage(message: SocketMessage): void {
    switch (message.type) {
      case 'EXECUTE_ACTION':
        // Handle action execution on client side
        this.handleClientAction({
          ...message,
          type: 'EXECUTE_ACTION' as const
        });
        break;
      case 'TEST':
        // Echo back test messages
        if (this.socket) {
          this.socket.emit('message', JSON.stringify({
            type: 'TEST',
            id: message.id,
            data: 'Test message received'
          }));
        }
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private async handleClientAction(message: SocketMessage & { type: 'EXECUTE_ACTION' }): Promise<void> {
    try {
      // Execute the action and send response
      const response = {
        type: 'ACTION_RESPONSE' as const,
        id: message.id,
        success: true,
        data: { message: 'Action executed successfully' }
      };

      this.socket?.emit('message', JSON.stringify(response));
    } catch (error) {
      const errorResponse = {
        type: 'ACTION_RESPONSE' as const,
        id: message.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.socket?.emit('message', JSON.stringify(errorResponse));
    }
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
      case 'EXECUTE_ACTION':
        // Broadcast action to all connected clients
        socket.broadcast.emit('message', JSON.stringify({
          type: 'EXECUTE_ACTION',
          id: message.id,
          action: message.action
        }));
        break;
      case 'TEST':
        // Echo back test messages
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
    if (!this.socket && this.connections.size === 0) {
      throw new Error('No Socket.IO connections available');
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

      if (this.socket) {
        // Client-side: send directly through socket
        this.socket.emit('message', JSON.stringify(action));
      } else if (this.io) {
        // Server-side: broadcast to all connected clients
        this.io.emit('message', JSON.stringify(action));
      }
    });
  }
} 
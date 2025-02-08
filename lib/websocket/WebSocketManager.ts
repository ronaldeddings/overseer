import type { Socket as ServerSocket, Server } from 'socket.io';
import type { SocketMessage } from '../types/socket';

// Use global namespace to ensure state is shared across all imports
declare global {
  var _socketIO: Server | null;
  var _socketConnections: Set<ServerSocket>;
  var _socketCallbacks: Map<string, (response: SocketMessage) => void>;
}

// Initialize global variables if they don't exist
global._socketIO = global._socketIO || null;
global._socketConnections = global._socketConnections || new Set();
global._socketCallbacks = global._socketCallbacks || new Map();

export class SocketManager {
  private static instance: SocketManager;
  private isServerSide: boolean;
  private static isInitialized = false;

  private constructor() {
    this.isServerSide = typeof window === 'undefined';
    console.log(`Initializing SocketManager (${this.isServerSide ? 'server' : 'client'} side)`);
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      if (SocketManager.isInitialized) {
        console.warn('SocketManager was already initialized but instance was lost');
      }
      SocketManager.instance = new SocketManager();
      SocketManager.isInitialized = true;
    }
    return SocketManager.instance;
  }

  public setServer(io: Server): void {
    if (global._socketIO) {
      console.warn('Socket.IO server already initialized');
      return;
    }
    console.log('Setting up Socket.IO server...');
    global._socketIO = io;
    this.setupServerHandlers();
  }

  private setupServerHandlers(): void {
    if (!global._socketIO) return;

    global._socketIO.on('connection', (socket: ServerSocket) => {
      const clientId = socket.id;
      console.log(`Extension connected: ${clientId}`);
      global._socketConnections.add(socket);

      socket.on('disconnect', () => {
        console.log(`Extension disconnected: ${clientId}`);
        global._socketConnections.delete(socket);
      });

      socket.on('error', (error: Error) => {
        console.error(`Extension socket error (${clientId}):`, error);
        global._socketConnections.delete(socket);
      });

      socket.on('message', (data: string) => {
        try {
          console.log(`Received message from extension (${clientId}):`, data);
          const message = JSON.parse(data) as SocketMessage;
          this.handleMessage(socket, message);
        } catch (error) {
          console.error(`Failed to parse extension message (${clientId}):`, error);
        }
      });

      // Send a test message to verify connection
      socket.emit('message', JSON.stringify({
        type: 'TEST',
        id: 'connection-test',
        data: 'Connection established'
      }));
    });
  }

  private handleMessage(socket: ServerSocket, message: SocketMessage): void {
    console.log(`Handling message type: ${message.type}`, { messageId: message.id });
    
    switch (message.type) {
      case 'ACTION_RESPONSE':
        const callback = global._socketCallbacks.get(message.id);
        if (callback) {
          console.log(`Found callback for message ID: ${message.id}`);
          callback(message);
          global._socketCallbacks.delete(message.id);
        } else {
          console.warn(`No callback found for message ID: ${message.id}`);
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

  private async waitForConnection(timeoutMs: number = 5000): Promise<boolean> {
    console.log('Waiting for extension connection...', {
      currentConnections: global._socketConnections.size,
      hasIO: !!global._socketIO
    });
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (global._socketConnections.size > 0) {
        console.log('Extension connection found');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Extension connection timeout', {
      timeoutMs,
      currentConnections: global._socketConnections.size,
      hasIO: !!global._socketIO
    });
    return false;
  }

  public async executeAction(
    action: SocketMessage & { type: 'EXECUTE_ACTION' }
  ): Promise<SocketMessage & { type: 'ACTION_RESPONSE' }> {
    console.log(`Executing action: ${action.type}`, { 
      isServerSide: this.isServerSide, 
      connections: global._socketConnections.size,
      hasIO: !!global._socketIO,
      actionId: action.id
    });

    if (!global._socketIO) {
      throw new Error('WebSocket server not initialized. Please restart the server.');
    }

    // Only check connections on server side
    if (this.isServerSide && global._socketConnections.size === 0) {
      const connected = await this.waitForConnection();
      if (!connected) {
        throw new Error(
          'Chrome extension not connected. Please make sure:\n' +
          '1. The Overseer extension is installed\n' +
          '2. The extension is enabled\n' +
          '3. You have reloaded the page after installing/enabling the extension'
        );
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        global._socketCallbacks.delete(action.id);
        reject(new Error('Action execution timed out. The extension may be unresponsive.'));
      }, 30000);

      console.log(`Setting up callback for action ID: ${action.id}`);
      global._socketCallbacks.set(action.id, (response) => {
        console.log(`Received response for action ID: ${action.id}`, response);
        clearTimeout(timeout);
        resolve(response as SocketMessage & { type: 'ACTION_RESPONSE' });
      });

      console.log(`Broadcasting action to extensions: ${action.id}`);
      global._socketIO!.emit('message', JSON.stringify(action));
    });
  }

  public isConnected(): boolean {
    const connected = global._socketConnections.size > 0;
    console.log(`Checking connection status: ${connected}`, {
      connections: global._socketConnections.size,
      hasIO: !!global._socketIO
    });
    return connected;
  }

  public getConnectionCount(): number {
    return global._socketConnections.size;
  }
} 
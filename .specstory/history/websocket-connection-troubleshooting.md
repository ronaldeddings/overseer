## SpecStory

## Websocket Connection Troubleshooting (2/2/2025, 10:57:18 AM)

_**User**_

Please review @README.md to get familiar with my project.... I'm having issues with my websocket from chrome extension to my server... It should establish a single websocket connection and there should be heartbeats sent to keep the connection open so that there aren't multple websocket connections... 

Pics are from the extension chrome devtools console

---

_**Assistant**_

I'll help you diagnose and fix the WebSocket connection issues. From the console logs and Chrome DevTools screenshots, I can see a few issues:

1. The WebSocket connection is repeatedly disconnecting and attempting to reconnect
2. There are multiple "WebSocket not ready" messages
3. The handshake messages are showing both 'connected' and 'disconnected' states

Let's analyze the current implementation and make improvements:

First, I'll check the WebSocket server implementation.

---

_**Assistant**_



---

_**Assistant**_



Let me check the WebSocket manager implementation as well.

---

_**Assistant**_



---

_**Assistant**_



After reviewing the code, I can identify several issues that are causing the WebSocket connection problems:

1. The server-side WebSocket implementation doesn't handle heartbeats
2. The client-side implementation in `background.ts` is sending handshake messages incorrectly
3. There's no proper connection state management on the server side

Let's fix these issues. First, I'll modify the WebSocket server implementation to handle heartbeats and improve connection management:

---

_**Assistant**_

```
import type { WebSocketMessage } from '../types/websocket';

// Dynamic import for WebSocket to avoid webpack issues
const WebSocket = require('ws');

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<any, { 
    workflowId?: string;
    lastHeartbeat: number;
  }>;
  private actionCallbacks: Map<string, (response: WebSocketMessage) => void>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_TIMEOUT = 35000; // 35 seconds (slightly longer than client's 30s)

  private constructor() {
    this.connections = new Map();
    this.actionCallbacks = new Map();
    this.startHeartbeatCheck();
  }

  private startHeartbeatCheck() {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Check for stale connections every 10 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [ws, data] of this.connections.entries()) {
        if (now - data.lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
          console.log('Connection timed out, closing...');
          ws.terminate();
          this.connections.delete(ws);
        }
      }
    }, 10000);
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public addConnection(ws: any): void {
    // Initialize connection with current timestamp
    this.connections.set(ws, {
      lastHeartbeat: Date.now()
    });
    
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data) as WebSocketMessage;
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Connection closed, cleaning up...');
      this.connections.delete(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      ws.terminate();
      this.connections.delete(ws);
    });

    // Send initial connection acknowledgment
    ws.send(JSON.stringify({
      type: 'HANDSHAKE',
      status: 'connected'
    }));
  }

  private handleMessage(ws: any, message: WebSocketMessage): void {
    // Update last heartbeat timestamp for any message received
    const connData = this.connections.get(ws);
    if (connData) {
      connData.lastHeartbeat = Date.now();
      this.connections.set(ws, connData);
    }

    switch (message.type) {
      case 'HANDSHAKE':
        console.log(`Extension ${message.status}`);
        // Send acknowledgment back
        ws.send(JSON.stringify({
          type: 'HANDSHAKE',
          status: 'connected'
        }));
        break;

      case 'ACTION_RESPONSE':
        if ('workflowId' in message && 'nodeId' in message) {
          const callbackKey = `${message.workflowId}:${message.nodeId}`;
          const callback = this.actionCallbacks.get(callbackKey);
          if (callback) {
            callback(message);
            this.actionCallbacks.delete(callbackKey);
          }
        }
        break;
    }
  }

  // ... rest of the class implementation ...
// ... existing code ...
```

---

_**Assistant**_



Now let's fix the client-side implementation in the Chrome extension's background script:

---

_**Assistant**_

```
import type { Message } from './types';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private isConnecting = false;
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private connectionCheckTimeout: number | null = null;

  constructor(private url: string = 'ws://localhost:3000/api/ws') {
    this.connect();
  }

  private async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      this.isConnecting = true;
      console.log('Attempting to connect to WebSocket server...');
      
      // Clear any existing intervals/timeouts
      this.stopHeartbeat();
      if (this.connectionCheckTimeout) {
        clearTimeout(this.connectionCheckTimeout);
      }
      
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('Connected to Overseer server');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Overseer server');
        this.isConnecting = false;
        this.ws = null;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data) as Message;
          
          if (message.type === 'HANDSHAKE') {
            // Server acknowledged our connection, no need to do anything
            console.log('Server acknowledged connection');
            return;
          }
          
          if (message.type === 'EXECUTE_ACTION') {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, message);
            } else {
              console.error('No active tab found');
              this.send({
                type: 'ACTION_RESPONSE',
                workflowId: message.workflowId,
                nodeId: message.nodeId,
                response: {
                  success: false,
                  error: 'No active tab found'
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to handle WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.stopHeartbeat();
      };

      // Set a timeout to check if we received a server acknowledgment
      this.connectionCheckTimeout = self.setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          console.log('Connection established but no server acknowledgment received, reconnecting...');
          this.ws.close();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval
    this.heartbeatInterval = self.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'HANDSHAKE',
          status: 'connected'
        });
      } else {
        this.stopHeartbeat();
        this.connect(); // Try to reconnect if connection is not open
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      self.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public send(message: Message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not ready, message not sent:', message);
      // If we're not connecting, try to reconnect
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }
}

// Initialize WebSocket connection
const wsClient = new WebSocketClient();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'ACTION_RESPONSE') {
    wsClient.send(message);
  }
  return true;
});
```

---

_**Assistant**_



I've made several improvements to both the server and client WebSocket implementations:

Server-side changes (WebSocketManager.ts):
1. Added proper heartbeat tracking with timestamps
2. Added a heartbeat check interval that closes stale connections
3. Added proper connection cleanup on errors and closures
4. Added server-side acknowledgment of connections
5. Added proper handling of heartbeat messages

Client-side changes (background.ts):
1. Removed the initial HTTP fetch (unnecessary and could cause issues)
2. Added connection acknowledgment timeout check
3. Improved heartbeat mechanism with proper cleanup
4. Improved reconnection logic
5. Added proper handling of server acknowledgments
6. Removed redundant handshake messages
7. Added automatic reconnection when heartbeat fails

These changes should resolve the issues you're seeing:
1. The connection will now be properly maintained with heartbeats every 30 seconds
2. Stale connections will be automatically cleaned up
3. The client will properly reconnect if the connection is lost
4. There will be only one active connection at a time
5. Both sides will properly acknowledge and maintain the connection

To test these changes:
1. Restart your Next.js server
2. Reload your Chrome extension
3. Check the Chrome DevTools console - you should see:
   - A single connection attempt
   - A successful connection message
   - Regular heartbeat messages every 30 seconds
   - No disconnection messages unless there's an actual network issue

If you still see any connection issues after implementing these changes, please let me know and I can help you troubleshoot further.

---

_**User**_

From extension 

Attempting to connect to WebSocket server...
background.js:26 WebSocket connection to 'ws://localhost:3000/api/ws' failed: Connection closed before receiving a handshake response
connect @ background.js:26
(anonymous) @ background.js:116
background.js:72 WebSocket error: Event {isTrusted: true, type: 'error', target: WebSocket, currentTarget: WebSocket, eventPhase: 2, …}
ws.onerror @ background.js:72
error
connect @ background.js:71
(anonymous) @ background.js:116
setTimeout
attemptReconnect @ background.js:116
ws.onclose @ background.js:38
background.js:34 Disconnected from Overseer server

---

_**Assistant**_

I notice that the connection is failing before receiving a handshake response. This typically happens when there's an issue with the WebSocket server setup or the connection upgrade process. Let me check the WebSocket server endpoint implementation.

---

_**Assistant**_



---

_**Assistant**_



I see the issue. The WebSocket server setup in `pages/api/ws.ts` has a problem with the upgrade handling. The current implementation attaches the upgrade handler to `req.socket.server` after the WebSocket server is created, but this is too late in the process. We need to handle the upgrade before the response ends.

Let's fix the WebSocket server implementation:

---

_**Assistant**_

```
import { NextApiRequest } from 'next';
import { Socket } from 'net';
import { WebSocketManager } from '@/lib/websocket/WebSocketManager';

// Dynamic import for WebSocket to avoid webpack issues
const WebSocket = require('ws');

interface UpgradeRequest extends NextApiRequest {
  socket: Socket & {
    server: any;
  };
}

// Store the WebSocket server instance
let wss: any = null;

const wsHandler = async (req: UpgradeRequest, res: any) => {
  // Set up WebSocket server if it doesn't exist
  if (!wss) {
    console.log('Setting up WebSocket server...');
    
    // Create WebSocket server instance
    wss = new WebSocket.Server({
      noServer: true,
    });

    // Handle new WebSocket connections
    wss.on('connection', (ws: any) => {
      console.log('New WebSocket connection established');
      WebSocketManager.getInstance().addConnection(ws);

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    // Handle upgrade of the connection
    const server = req.socket.server;
    server.removeAllListeners('upgrade');
    
    server.on('upgrade', (request: UpgradeRequest, socket: Socket, head: Buffer) => {
      // Skip HMR WebSocket connections
      if (request.url?.includes('/_next/webpack-hmr')) {
        return;
      }

      if (request.url === '/api/ws') {
        console.log('Handling WebSocket upgrade...');
        wss.handleUpgrade(request, socket, head, (ws: any) => {
          console.log('WebSocket upgrade successful');
          wss.emit('connection', ws, request);
        });
      }
    });
  }

  // For the initial HTTP request
  if (req.method === 'GET') {
    res.status(200).json({ status: 'WebSocket server is running' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default wsHandler;

// Disable body parsing, we'll handle the raw stream
export const config = {
  api: {
    bodyParser: false,
  },
};
```

---

_**Assistant**_



The key changes I made to fix the WebSocket server implementation:

1. Store the WebSocket server instance in a module-level variable to prevent multiple instances
2. Remove all existing upgrade listeners before adding a new one to prevent duplicate handlers
3. Add a URL check to ensure we only handle upgrades for our WebSocket endpoint
4. Properly handle the initial HTTP request with a proper response
5. Remove the WebSocket server instance from the request object to prevent issues with Next.js hot reloading

Now let's also fix the client-side implementation to better handle the initial connection:

---

_**Assistant**_

```
import type { Message } from './types';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private isConnecting = false;
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private connectionCheckTimeout: number | null = null;

  constructor(private url: string = 'ws://localhost:3000/api/ws') {
    this.connect();
  }

  private async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      this.isConnecting = true;
      console.log('Attempting to connect to WebSocket server...');
      
      // Clear any existing intervals/timeouts
      this.stopHeartbeat();
      if (this.connectionCheckTimeout) {
        clearTimeout(this.connectionCheckTimeout);
      }

      // First check if the server is running
      try {
        const response = await fetch(this.url.replace('ws://', 'http://'));
        if (!response.ok) {
          throw new Error('Server not ready');
        }
      } catch (error) {
        console.log('Server not ready, will retry...');
        this.isConnecting = false;
        this.attemptReconnect();
        return;
      }
      
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('Connected to Overseer server');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Send initial handshake
        this.send({
          type: 'HANDSHAKE',
          status: 'connected'
        });
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Overseer server');
        this.isConnecting = false;
        this.ws = null;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data) as Message;
          
          if (message.type === 'HANDSHAKE') {
            console.log('Server acknowledged connection');
            this.startHeartbeat();
            return;
          }
          
          if (message.type === 'EXECUTE_ACTION') {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, message);
            } else {
              console.error('No active tab found');
              this.send({
                type: 'ACTION_RESPONSE',
                workflowId: message.workflowId,
                nodeId: message.nodeId,
                response: {
                  success: false,
                  error: 'No active tab found'
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to handle WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.stopHeartbeat();
      };

      // Set a timeout to check if we received a server acknowledgment
      this.connectionCheckTimeout = self.setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          console.log('Connection established but no server acknowledgment received, reconnecting...');
          this.ws.close();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  // ... rest of the class implementation stays the same ...
```

---

_**Assistant**_



The key changes I made to the client implementation:

1. Added a server availability check before attempting WebSocket connection
2. Changed the connection sequence:
   - First establish WebSocket connection
   - Send initial handshake on connection
   - Only start heartbeat after receiving server acknowledgment
3. Improved error handling and retry logic

These changes should resolve the connection issues. The new flow is:

1. Client checks if server is available via HTTP
2. If server is available, establishes WebSocket connection
3. On successful connection, sends initial handshake
4. Server acknowledges handshake
5. Client starts heartbeat only after receiving acknowledgment
6. Connection is maintained with regular heartbeats

To test these changes:

1. Restart your Next.js server
2. Reload your Chrome extension
3. Check the Chrome DevTools console - you should see:
   ```
   Attempting to connect to WebSocket server...
   Connected to Overseer server
   Server acknowledged connection
   ```

If you're still seeing connection issues, please let me know what errors you're seeing in the console and I'll help you troubleshoot further.

---



---


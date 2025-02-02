import { io, Socket } from 'socket.io-client';
import type { SocketMessage, BrowserAction, ExecuteScriptDetails } from './types';

// Configuration
const DEFAULT_SERVER_URL = 'http://localhost:3000';

interface StorageConfig {
  serverUrl?: string;
}

class SocketClient {
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private url: string = DEFAULT_SERVER_URL;

  constructor() {
    console.log('Initializing Socket.IO client...');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadConfiguration();
      await this.connect();
    } catch (error) {
      console.error('Failed to initialize Socket.IO client:', error);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['serverUrl']) as StorageConfig;
      this.url = result.serverUrl || DEFAULT_SERVER_URL;
      console.log('Loaded server URL:', this.url);
    } catch (error) {
      console.warn('Failed to load configuration, using default:', error);
    }
  }

  public async setServerUrl(url: string): Promise<void> {
    try {
      await chrome.storage.local.set({ serverUrl: url });
      this.url = url;
      console.log('Server URL updated:', url);
      
      // Reconnect if already connected
      if (this.socket?.connected) {
        this.socket.disconnect();
        await this.connect();
      }
    } catch (error) {
      console.error('Failed to save server URL:', error);
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnecting || this.socket?.connected) {
      console.log('Already connected or connecting...');
      return;
    }

    this.isConnecting = true;
    console.log('Attempting to connect to Socket.IO server:', this.url);

    try {
      // First check if the Socket.IO server is running
      const response = await fetch(`${this.url}/api/socket`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Socket.IO server not ready: ${error.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Socket.IO server response:', data);

      this.socket = io(this.url, {
        path: '/api/socket',
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
        forceNew: true
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.isConnecting = false;
      this.handleReconnect();
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      // Send a test message to verify connection
      this.socket?.emit('message', JSON.stringify({
        type: 'TEST',
        id: 'test',
        message: 'Connection test'
      }));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('message', async (data: string) => {
      console.log('Received message:', data);
      try {
        const message = JSON.parse(data) as SocketMessage;
        if (message.type === 'EXECUTE_ACTION' && message.action) {
          await this.handleBrowserAction(message);
        }
      } catch (error) {
        console.error('Failed to handle Socket.IO message:', error);
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket.IO error:', error);
      this.handleReconnect();
    });
  }

  private async handleBrowserAction(message: SocketMessage): Promise<void> {
    if (!this.socket || !message.action) return;

    try {
      const result = await this.executeBrowserAction(message.action);
      this.socket.emit('message', JSON.stringify({
        type: 'ACTION_RESPONSE',
        id: message.id,
        workflowId: message.workflowId,
        nodeId: message.nodeId,
        result
      }));
    } catch (error) {
      this.socket.emit('message', JSON.stringify({
        type: 'ACTION_RESPONSE',
        id: message.id,
        workflowId: message.workflowId,
        nodeId: message.nodeId,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  private async executeBrowserAction(action: BrowserAction): Promise<any> {
    const tab = await this.getActiveTab();
    if (!tab.id) throw new Error('No active tab found');

    switch (action.type) {
      case 'click':
        return this.executeContentScript(tab.id, {
          code: `
            const element = document.querySelector('${action.selector}');
            if (!element) throw new Error('Element not found');
            element.click();
            true;
          `
        });

      case 'input':
        return this.executeContentScript(tab.id, {
          code: `
            const element = document.querySelector('${action.selector}');
            if (!element) throw new Error('Element not found');
            if (!(element instanceof HTMLInputElement)) throw new Error('Element is not an input');
            element.value = '${action.value || ''}';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            true;
          `
        });

      case 'scrape':
        return this.executeContentScript(tab.id, {
          code: `
            const element = document.querySelector('${action.selector}');
            if (!element) throw new Error('Element not found');
            element.textContent;
          `
        });

      case 'wait':
        return this.executeContentScript(tab.id, {
          code: `
            new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for element'));
              }, ${action.timeout || 5000});

              const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector('${action.selector}');
                if (element) {
                  clearTimeout(timeout);
                  obs.disconnect();
                  resolve(true);
                }
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true
              });

              // Check if element already exists
              const element = document.querySelector('${action.selector}');
              if (element) {
                clearTimeout(timeout);
                observer.disconnect();
                resolve(true);
              }
            });
          `
        });

      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  private async getActiveTab(): Promise<chrome.tabs.Tab> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');
    return tab;
  }

  private async executeContentScript(tabId: number, details: ExecuteScriptDetails): Promise<any> {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: new Function(details.code!) as () => void
    });
    return result.result;
  }

  private handleReconnect(): void {
    this.isConnecting = false;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public disconnect(): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }
}

// Initialize Socket.IO connection
const socketClient = new SocketClient();
socketClient.connect(); 
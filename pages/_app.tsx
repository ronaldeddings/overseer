import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/layout/navbar"
import { io } from 'socket.io-client'
import { SocketManager } from '@/lib/websocket/WebSocketManager'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const initSocketConnection = async () => {
      try {
        // Check if Socket.IO server is ready
        const serverCheck = await fetch('/api/socket', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!serverCheck.ok) {
          throw new Error('Socket.IO server not ready');
        }

        // Initialize Socket.IO client with improved options
        const socket = io({
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: false,
          withCredentials: true
        });

        // Set up event handlers before connecting
        socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
        });

        socket.on('connect', () => {
          console.log('Socket.IO connected successfully');
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
        });

        // Initialize the Socket Manager with the socket instance
        const manager = SocketManager.getInstance();
        await manager.setClient(socket);

        // Connect after setup
        socket.connect();

        console.log('Socket.IO connection initialized successfully');
      } catch (error) {
        console.error('Error initializing Socket.IO connection:', error);
      }
    };

    initSocketConnection();

    // Cleanup on unmount
    return () => {
      const manager = SocketManager.getInstance();
      manager.disconnect();
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Component {...pageProps} />
      </main>
      <Toaster />
    </>
  )
} 
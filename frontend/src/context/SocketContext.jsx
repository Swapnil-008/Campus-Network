import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('⚠️ No token found, skipping socket connection');
        return;
      }

      console.log('🔌 Attempting to connect to Socket.io...');

      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setConnectionError(null);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        setConnectionError(error.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      // Receive the full list of currently online users on connect
      newSocket.on('users:online-list', (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.close();
        socketRef.current = null;
      };
    } else {
      // Use ref to avoid stale closure
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};
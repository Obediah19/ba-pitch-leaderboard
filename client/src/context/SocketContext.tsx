import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sessionToken: string | null;
  saveSession: (token: string, roomCode: string, nickname: string, avatar: string) => void;
  clearSession: () => void;
  getStoredSession: () => { token: string | null; roomCode: string | null; nickname: string | null; avatar: string | null };
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('arena_player_token');
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // In dev Vite proxies /socket.io to backend :3001
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to Arena Gateway:', newSocket.id);
      setConnected(true);

      // Attempt automatic reconnect if previously joined a room
      const storedToken = localStorage.getItem('arena_player_token');
      const storedRoom = localStorage.getItem('arena_player_room');
      if (storedToken && storedRoom) {
        newSocket.emit('player:reconnect', {
          roomCode: storedRoom,
          sessionToken: storedToken,
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      setConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const saveSession = (token: string, roomCode: string, nickname: string, avatar: string) => {
    localStorage.setItem('arena_player_token', token);
    localStorage.setItem('arena_player_room', roomCode);
    localStorage.setItem('arena_player_nick', nickname);
    localStorage.setItem('arena_player_avatar', avatar);
    setSessionToken(token);
  };

  const clearSession = () => {
    localStorage.removeItem('arena_player_token');
    localStorage.removeItem('arena_player_room');
    localStorage.removeItem('arena_player_nick');
    localStorage.removeItem('arena_player_avatar');
    setSessionToken(null);
  };

  const getStoredSession = () => ({
    token: localStorage.getItem('arena_player_token'),
    roomCode: localStorage.getItem('arena_player_room'),
    nickname: localStorage.getItem('arena_player_nick'),
    avatar: localStorage.getItem('arena_player_avatar'),
  });

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        sessionToken,
        saveSession,
        clearSession,
        getStoredSession,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

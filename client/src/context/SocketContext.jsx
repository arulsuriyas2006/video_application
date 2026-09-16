import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeViewers, setActiveViewers] = useState([]);
  const activeRoomRef = useRef(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log(`[Socket] Connected to server: ${socketInstance.id}`);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
      setActiveViewers([]);
    });

    socketInstance.on('room_presence', (data) => {
      if (data && Array.isArray(data.users)) {
        setActiveViewers(data.users);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join a video review room with presence
  const joinVideoRoom = useCallback(
    (videoId, user) => {
      if (!socket || !videoId) return;
      activeRoomRef.current = videoId;
      socket.emit('join_video_review', {
        videoId,
        user: user
          ? {
              id: user._id || user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
            }
          : null,
      });
    },
    [socket]
  );

  // Leave a video review room
  const leaveVideoRoom = useCallback(
    (videoId) => {
      if (!socket || !videoId) return;
      socket.emit('leave_video_review', { videoId });
      if (activeRoomRef.current === videoId) {
        activeRoomRef.current = null;
        setActiveViewers([]);
      }
    },
    [socket]
  );

  // Broadcast live drawing stroke
  const emitDrawingStroke = useCallback(
    (videoId, shape) => {
      if (!socket || !videoId) return;
      socket.emit('drawing_stroke', { videoId, shape });
    },
    [socket]
  );

  // Broadcast canvas clear
  const emitDrawingClear = useCallback(
    (videoId) => {
      if (!socket || !videoId) return;
      socket.emit('drawing_clear', { videoId });
    },
    [socket]
  );

  // Broadcast co-watch playback sync
  const emitCowatchSync = useCallback(
    (videoId, action, timestamp, user) => {
      if (!socket || !videoId) return;
      socket.emit('cowatch_sync', {
        videoId,
        action,
        timestamp,
        user: user ? { name: user.name, id: user._id || user.id } : null,
      });
    },
    [socket]
  );

  const value = {
    socket,
    isConnected,
    activeViewers,
    joinVideoRoom,
    leaveVideoRoom,
    emitDrawingStroke,
    emitDrawingClear,
    emitCowatchSync,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

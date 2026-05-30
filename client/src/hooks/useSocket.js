import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import useAuth from './useAuth';

const useSocket = () => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      const s = socketService.connect(token);
      setSocket(s);
    }

    return () => {
      // Don't disconnect on unmount — keep socket alive while app is running
    };
  }, [isAuthenticated, token]);

  const emitTyping = useCallback((conversationId, isTyping) => {
    socketService.emitTyping(conversationId, isTyping);
  }, []);

  return {
    socket,
    emitTyping,
    socketService,
  };
};

export default useSocket;

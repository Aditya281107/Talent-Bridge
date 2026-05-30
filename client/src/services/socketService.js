import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

const socketService = {
  connect: (token) => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,

  onNewMessage: (callback) => {
    if (socket) {
      socket.on('new_message', callback);
    }
  },

  offNewMessage: (callback) => {
    if (socket) {
      socket.off('new_message', callback);
    }
  },

  onTyping: (callback) => {
    if (socket) {
      socket.on('user_typing', callback);
    }
  },

  offTyping: (callback) => {
    if (socket) {
      socket.off('user_typing', callback);
    }
  },

  emitTyping: (conversationId, isTyping) => {
    if (socket) {
      socket.emit('typing', { conversationId, isTyping });
    }
  },

  onMessagesRead: (callback) => {
    if (socket) {
      socket.on('messages_read', callback);
    }
  },

  offMessagesRead: (callback) => {
    if (socket) {
      socket.off('messages_read', callback);
    }
  },
};

export default socketService;

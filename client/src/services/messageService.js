import api from './api';

const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId, params = {}) =>
    api.get(`/messages/conversations/${conversationId}`, { params }),
  startConversation: (targetUserId, applicationId) =>
    api.post('/messages/conversations', { targetUserId, applicationId }),
  sendMessage: (conversationId, content, messageType = 'text', linkMetadata = null) =>
    api.post(`/messages/conversations/${conversationId}`, {
      content,
      messageType,
      linkMetadata,
    }),
  markAsRead: (conversationId) =>
    api.put(`/messages/conversations/${conversationId}/read`),
};

export default messageService;

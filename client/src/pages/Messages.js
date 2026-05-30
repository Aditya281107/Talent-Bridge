import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import messageService from '../services/messageService';
import './Messages.css';

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatConversationTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return formatTime(dateStr);
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Messages = () => {
  const { user } = useAuth();
  const { socketService } = useSocket();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', label: '', type: 'oa_link' });
  const [conversationSearch, setConversationSearch] = useState('');

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await messageService.getConversations();
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Auto-select conversation from navigation state
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === location.state.conversationId);
      if (conv) {
        setActiveConversation(conv);
      }
    }
  }, [location.state, conversations]);

  // Load messages when active conversation changes
  const activeConversationId = activeConversation?._id;
  useEffect(() => {
    if (!activeConversationId) return;

    let cancelled = false;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await messageService.getMessages(activeConversationId);
        if (!cancelled) {
          setMessages(res.data);
        }
        // Mark as read (fire and forget)
        messageService.markAsRead(activeConversationId).catch(() => {});
        if (!cancelled) {
          setConversations((prev) =>
            prev.map((c) =>
              c._id === activeConversationId ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };
    fetchMessages();

    return () => { cancelled = true; };
  }, [activeConversationId]);

  // Socket listeners
  useEffect(() => {
    const handleNewMessage = ({ message, conversationId }) => {
      // If it's the active conversation, add to messages
      if (activeConversation && conversationId === activeConversation._id) {
        setMessages((prev) => [...prev, message]);
        // Mark as read immediately
        messageService.markAsRead(conversationId).catch(() => {});
      }

      // Update conversation list
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage: {
                content: message.content,
                sender: message.sender._id,
                createdAt: message.createdAt,
              },
              unreadCount:
                activeConversation && conversationId === activeConversation._id
                  ? 0
                  : c.unreadCount + 1,
            };
          }
          return c;
        });
        // Sort by latest message
        return updated.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.updatedAt;
          const bTime = b.lastMessage?.createdAt || b.updatedAt;
          return new Date(bTime) - new Date(aTime);
        });
      });
    };

    const handleTyping = ({ conversationId, userName, isTyping }) => {
      if (activeConversation && conversationId === activeConversation._id) {
        setTypingUser(isTyping ? userName : null);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offTyping(handleTyping);
    };
  }, [activeConversation, socketService]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e) => {
      setMessageInput(e.target.value);

      if (activeConversation) {
        socketService.emitTyping(activeConversation._id, true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          socketService.emitTyping(activeConversation._id, false);
        }, 2000);
      }
    },
    [activeConversation, socketService]
  );

  // Send message
  const handleSend = async () => {
    if (!messageInput.trim() || !activeConversation || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const res = await messageService.sendMessage(activeConversation._id, content);
      setMessages((prev) => [...prev, res.data]);

      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? {
                ...c,
                lastMessage: {
                  content,
                  sender: user._id,
                  createdAt: new Date().toISOString(),
                },
              }
            : c
        )
      );

      // Stop typing
      socketService.emitTyping(activeConversation._id, false);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessageInput(content); // Restore on failure
    } finally {
      setSending(false);
      chatInputRef.current?.focus();
    }
  };

  // Send link message
  const handleSendLink = async () => {
    if (!linkForm.url.trim() || !activeConversation) return;

    setSending(true);
    try {
      const label = linkForm.label || linkForm.url;
      const linkTypeLabel = linkForm.type === 'oa_link' ? '📝 OA Link' :
                            linkForm.type === 'interview_link' ? '🎥 Interview Link' : '🔗 Link';
      const content = `${linkTypeLabel}: ${label}`;

      const res = await messageService.sendMessage(
        activeConversation._id,
        content,
        'link',
        {
          url: linkForm.url,
          label: linkForm.label || linkForm.url,
          type: linkForm.type,
        }
      );
      setMessages((prev) => [...prev, res.data]);

      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? {
                ...c,
                lastMessage: {
                  content,
                  sender: user._id,
                  createdAt: new Date().toISOString(),
                },
              }
            : c
        )
      );

      setShowLinkModal(false);
      setLinkForm({ url: '', label: '', type: 'oa_link' });
    } catch (err) {
      console.error('Failed to send link:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!conversationSearch) return true;
    const name = c.otherParticipant?.name?.toLowerCase() || '';
    const company = c.otherParticipant?.company?.toLowerCase() || '';
    const query = conversationSearch.toLowerCase();
    return name.includes(query) || company.includes(query);
  });

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="page messages-page">
      <div className="container">
        <div className="messages-container">
          {/* Conversations Panel */}
          <div className="conversations-panel">
            <div className="conversations-header">
              <h2>💬 Messages</h2>
              <div className="conversations-search">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="conversations-empty">
                  <div className="loader loader-sm" style={{ margin: '20px auto' }}></div>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`conversation-item ${
                      activeConversation?._id === conv._id ? 'active' : ''
                    }`}
                    onClick={() => setActiveConversation(conv)}
                  >
                    <div className="conversation-avatar">
                      {conv.otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">
                        <span>{conv.otherParticipant?.name}</span>
                        <span className="conversation-role">
                          {conv.otherParticipant?.role}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </div>
                    </div>
                    <div className="conversation-meta">
                      <span className="conversation-time">
                        {formatConversationTime(
                          conv.lastMessage?.createdAt || conv.updatedAt
                        )}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="conversation-unread">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="conversations-empty">
                  <div className="conversations-empty-icon">💬</div>
                  <p>No conversations yet</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Start one from a candidate or job page
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            {activeConversation ? (
              <>
                <div className="chat-header">
                  <div className="conversation-avatar">
                    {activeConversation.otherParticipant?.name
                      ?.charAt(0)
                      ?.toUpperCase() || '?'}
                  </div>
                  <div className="chat-header-info">
                    <div className="chat-header-name">
                      {activeConversation.otherParticipant?.name}
                    </div>
                    <div className="chat-header-status">
                      {typingUser ? (
                        <span className="chat-header-typing">typing...</span>
                      ) : (
                        <span>
                          {activeConversation.otherParticipant?.role === 'employer'
                            ? activeConversation.otherParticipant?.company || 'Employer'
                            : activeConversation.otherParticipant?.title || 'Job Seeker'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chat-messages">
                  {messagesLoading ? (
                    <div className="chat-empty">
                      <div className="loader"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    <>
                      {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <React.Fragment key={date}>
                          <div className="message-date-divider">{date}</div>
                          {msgs.map((msg) => {
                            const isSent =
                              msg.sender?._id === user?._id ||
                              msg.sender === user?._id;

                            if (msg.messageType === 'system') {
                              return (
                                <div key={msg._id} className="message-system">
                                  {msg.content}
                                </div>
                              );
                            }

                            return (
                              <div
                                key={msg._id}
                                className={`message-bubble-wrapper ${
                                  isSent ? 'sent' : 'received'
                                }`}
                              >
                                <div
                                  className={`message-bubble ${
                                    isSent ? 'sent' : 'received'
                                  }`}
                                >
                                  <div>{msg.content}</div>

                                  {msg.messageType === 'link' && msg.linkMetadata?.url && (
                                    <div className="message-link-card">
                                      <div className="message-link-label">
                                        {msg.linkMetadata.type === 'oa_link'
                                          ? '📝 Online Assessment'
                                          : msg.linkMetadata.type === 'interview_link'
                                          ? '🎥 Interview'
                                          : '🔗 Link'}
                                      </div>
                                      <a
                                        href={msg.linkMetadata.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="message-link-url"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {msg.linkMetadata.label || msg.linkMetadata.url}
                                      </a>
                                    </div>
                                  )}

                                  <div className="message-time">
                                    {formatTime(msg.createdAt)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="chat-empty">
                      <div className="chat-empty-icon">👋</div>
                      <div className="chat-empty-text">Start the conversation!</div>
                      <div className="chat-empty-hint">
                        Send a message or share an assessment link
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input-area">
                  <div className="chat-input-wrapper">
                    <textarea
                      ref={chatInputRef}
                      className="chat-input"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <div className="chat-actions">
                      <button
                        className="chat-link-btn"
                        onClick={() => setShowLinkModal(true)}
                        title="Share OA / Interview Link"
                      >
                        🔗
                      </button>
                      <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!messageInput.trim() || sending}
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="chat-empty">
                <div className="chat-empty-icon">💬</div>
                <div className="chat-empty-text">Select a conversation</div>
                <div className="chat-empty-hint">
                  Choose a conversation from the left panel to start chatting
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Link Modal */}
      {showLinkModal && (
        <div className="modal-backdrop" onClick={() => setShowLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔗 Share Link</h3>
              <button
                className="modal-close"
                onClick={() => setShowLinkModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="share-link-form">
              <div className="form-group">
                <label className="form-label">Link Type</label>
                <select
                  className="form-input"
                  value={linkForm.type}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="oa_link">📝 Online Assessment (OA)</option>
                  <option value="interview_link">🎥 Interview Link</option>
                  <option value="other">🔗 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={linkForm.url}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Label (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Round 1 Assessment"
                  value={linkForm.label}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSendLink}
                disabled={!linkForm.url.trim() || sending}
              >
                {sending ? 'Sending...' : 'Share Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;

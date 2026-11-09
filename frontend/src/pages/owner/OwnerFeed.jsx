import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Edit2, Trash2, Flag, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { feedApi } from '../../services/api/feedApi';
import { formatTimeAgo } from '../../utils/formatters';

export const OwnerFeed = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await feedApi.getMessages({ limit: 50 });
      // Reverse to chronological order for chat view
      setMessages((data?.items || []).reverse());
    } catch {
      toast.error('Failed to load feed messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    const unsubNew = socket.on('feed:message:new', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    });

    const unsubUpdated = socket.on('feed:message:updated', (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    });

    const unsubDeleted = socket.on('feed:message:deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    return () => {
      unsubNew();
      unsubUpdated();
      unsubDeleted();
    };
  }, [socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const messageText = content.trim();
    setContent('');
    try {
      await feedApi.sendMessage(messageText);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post message');
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return;
    try {
      await feedApi.editMessage(id, editContent.trim());
      setEditingId(null);
      setEditContent('');
      toast.success('Message updated');
    } catch {
      toast.error('Failed to update message');
    }
  };

  const handleDelete = async (id) => {
    try {
      await feedApi.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      setActiveMenuId(null);
      toast.success('Message removed');
    } catch {
      toast.error('Failed to remove message');
    }
  };

  const handleReport = async (id) => {
    const reason = prompt('Please describe why you are reporting this message:');
    if (!reason) return;
    try {
      await feedApi.reportMessage(id, reason);
      setActiveMenuId(null);
      toast.success('Report submitted to society administration');
    } catch {
      toast.error('Failed to report message');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Feed Top Header */}
      <div className="p-4 bg-bg-card border border-border-muted rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Society Community Feed</h3>
            <span className="text-[10px] text-text-secondary">Official WhatsApp-style society communication</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 bg-[#090C0F] border-x border-border-muted p-4 overflow-y-auto space-y-4">
        {loading ? (
          <Loader message="Loading feed..." />
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6 text-text-secondary text-xs">
            No messages posted yet. Start the conversation with your society neighbors!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user._id;
            const isEditing = editingId === msg._id;

            return (
              <div
                key={msg._id}
                className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Sender Title Bar */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-text-primary">
                    {isMe ? 'You' : msg.sender?.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                      msg.sender?.role === 'ADMIN'
                        ? 'bg-status-danger/15 text-status-danger border-status-danger/30'
                        : msg.sender?.role === 'SECURITY'
                        ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                        : 'bg-accent/10 text-accent border-accent/20'
                    }`}
                  >
                    {msg.sender?.role}
                  </span>
                  {msg.sender?.flat && (
                    <span className="text-[10px] text-text-secondary">
                      {msg.sender.flat.tower}-{msg.sender.flat.flatNumber}
                    </span>
                  )}
                </div>

                {/* Bubble Container */}
                <div
                  className={`relative group rounded-2xl p-3 text-xs leading-relaxed border ${
                    isMe
                      ? 'bg-accent/15 border-accent/30 text-text-primary rounded-tr-none'
                      : 'bg-bg-card border-border-muted text-text-primary rounded-tl-none'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2 min-w-[200px]">
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-bg-elevated border border-border-muted rounded-lg p-2 text-xs text-text-primary focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(msg._id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-line">{msg.content}</p>

                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-text-secondary">
                        {msg.isEdited && <span className="italic">(edited)</span>}
                        <span>{formatTimeAgo(msg.createdAt)}</span>

                        {/* Options button */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === msg._id ? null : msg._id)}
                            className="p-0.5 rounded hover:text-text-primary transition-colors"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>

                          {activeMenuId === msg._id && (
                            <div className="absolute right-0 mt-1 w-28 bg-bg-elevated border border-border-muted rounded-lg shadow-card py-1 z-30">
                              {isMe && (
                                <button
                                  onClick={() => {
                                    setEditingId(msg._id);
                                    setEditContent(msg.content);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-[#232B35] text-left"
                                >
                                  <Edit2 className="w-3 h-3 text-accent" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {(isMe || user?.role === 'ADMIN') && (
                                <button
                                  onClick={() => handleDelete(msg._id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-status-danger hover:bg-status-danger/10 text-left"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                              {!isMe && (
                                <button
                                  onClick={() => handleReport(msg._id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-status-warning hover:bg-status-warning/10 text-left"
                                >
                                  <Flag className="w-3 h-3" />
                                  <span>Report</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-bg-card border border-border-muted rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message to society feed..."
          maxLength={2000}
          className="flex-1 bg-bg-elevated border border-border-muted rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <Button type="submit" size="md" icon={Send} disabled={!content.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default OwnerFeed;

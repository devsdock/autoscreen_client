import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageCircle, Send, User } from 'lucide-react';
import * as chatService from '../../services/chatService';
import socketService from '../../services/socketService';
import useAuthStore from '../../store/useAuthStore';

const SupportChatPopup = ({ onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef(null);
    const { user } = useAuthStore();
    const [socket, setSocket] = useState(socketService.socket);

    useEffect(() => {
        if (socket) return;
        const interval = setInterval(() => {
            if (socketService.socket) {
                setSocket(socketService.socket);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [socket]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) { // Opening
            setUnreadCount(0);
        }
    };

    const loadConversation = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await chatService.getMyConversation();
            if (res.success && res.data) {
                setConversation(res.data);
                setMessages(res.data.messages || []);

                // Join Room handled by useEffect now

                // Mark read
                if (isOpen) {
                    chatService.markAsRead(res.data._id);
                    setUnreadCount(0);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, socket]);

    // Load conversation when opening to sync any missed messages
    useEffect(() => {
        if (isOpen && socket) {
            loadConversation();
        }
    }, [isOpen, socket, loadConversation]);

    // Handle Room Joining — join when we have a conversation, don't leave on close
    // (we stay in the chat room to receive messages even when popup is closed)
    useEffect(() => {
        if (socket && conversation?._id) {
            console.log('Customer joining chat room:', conversation._id);
            socket.emit('join-chat', conversation._id);
        }
    }, [socket, conversation?._id]);

    // Initial load for unread count
    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const res = await chatService.getUnreadCount();
                if (res.success) setUnreadCount(res.data.unreadCount);
            } catch (e) { }
        };
        fetchUnread();
    }, [user]);

    // Mark as read when popup opens
    useEffect(() => {
        if (isOpen) {
            if (conversation?._id) {
                chatService.markAsRead(conversation._id);
                setUnreadCount(0);
            }
        }
    }, [isOpen, conversation?._id]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        // Fetch unread count on socket connection to ensure sync
        chatService.getUnreadCount()
            .then(res => { if (res.success) setUnreadCount(res.data.unreadCount); })
            .catch(() => { });

        const handleNewMessage = (msg) => {
            // Check if message belongs to current conversation
            if (conversation && String(msg.conversationId) === String(conversation._id)) {
                setMessages(prev => {
                    if (prev.some(m => String(m._id) === String(msg._id))) return prev;
                    return [...prev, msg];
                });

                // If open, mark as read immediately
                if (isOpen) {
                    chatService.markAsRead(conversation._id);
                }
                // Don't increment locally — unread_count_update event will handle it
            }
        };

        // unread_count_update is the single source of truth for badge count
        const handleUnreadUpdate = () => {
            // Always fetch — when open we mark as read so API returns 0, when closed shows actual count
            chatService.getUnreadCount().then(res => {
                if (res.success) setUnreadCount(res.data.unreadCount);
            }).catch(() => { });
        };

        const handleMessageNotification = (data) => {
            // Fallback: add message if not already received via new_message
            if (data.message && conversation && String(data.message.conversationId) === String(conversation._id)) {
                setMessages(prev => {
                    if (prev.some(m => String(m._id) === String(data.message._id))) return prev;
                    return [...prev, data.message];
                });
                if (isOpen) {
                    chatService.markAsRead(conversation._id);
                }
            }
            // unread_count_update will handle the badge
        };

        const handleMessageRead = (data) => {
            if (conversation && String(data.conversationId) === String(conversation._id)) {
                // When admin reads our messages, clear our unread count
                setUnreadCount(0);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('unread_count_update', handleUnreadUpdate);
        socket.on('messages_read', handleMessageRead);
        socket.on('new-message-notification', handleMessageNotification);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('unread_count_update', handleUnreadUpdate);
            socket.off('new-message-notification', handleMessageNotification);
            socket.off('messages_read', handleMessageRead);
        };
    }, [socket, conversation, isOpen, user]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await chatService.sendMessage({
                content: inputValue,
                conversationId: conversation?._id
            });

            if (res.success) {
                setInputValue('');
                // Add sent message to UI immediately from response
                if (res.data?.message) {
                    setMessages(prev => {
                        if (prev.some(m => m._id === res.data.message._id)) return prev;
                        return [...prev, res.data.message];
                    });
                }

                // If it was a new conversation, reload to get ID and join room
                if (!conversation) {
                    loadConversation();
                } else if (res.data?.conversationId && socket) {
                    // Ensure we are in the chat room
                    socket.emit('join-chat', res.data.conversationId);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white dark:bg-slate-900 w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <User size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold">Support Team</h3>
                                <p className="text-xs text-blue-100">We usually reply instantly</p>
                            </div>
                        </div>
                        <button onClick={toggleOpen} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50">
                        {isLoading ? (
                            <div className="flex justify-center py-4 text-slate-400 text-sm">Loading history...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">How can we help you today?</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg, i) => {
                                    const currentUserId = String(user?._id || user?.id || '');
                                    const isMyMsg = currentUserId
                                        ? String(msg.sender?.userId) === currentUserId
                                        : msg.sender?.userType === 'customer';

                                    return (
                                        <div key={msg._id || i} className={`flex ${isMyMsg ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm 
                                                ${isMyMsg
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'}
                                            `}>
                                                <p className="break-words">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 opacity-70
                                                     ${isMyMsg ? 'text-blue-100' : 'text-slate-400'}
                                                   `}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-slate-100 dark:bg-slate-950 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isSending}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={toggleOpen}
                className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative"
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default SupportChatPopup;

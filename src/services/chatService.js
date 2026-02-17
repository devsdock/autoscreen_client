import api from './api';

export const getMyConversation = async () => {
    const response = await api({ method: 'GET', url: '/customer/chat/my-conversation' });
    return response;
};

export const sendMessage = async (data) => {
    // data = { content, conversationId }
    const response = await api({ method: 'POST', url: '/customer/chat/messages', data });
    return response;
};

export const markAsRead = async (conversationId) => {
    if (!conversationId) return;
    const response = await api({ method: 'POST', url: `/customer/chat/conversations/${conversationId}/read` });
    return response;
};

export const getUnreadCount = async () => {
    const response = await api({ method: 'GET', url: '/customer/chat/unread-count' });
    return response;
};

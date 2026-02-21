import api from './api';

const supportTicketService = {
    createTicket: async (formData) => {
        // The customer portal's api (request) interceptor already returns response.data
        const data = await api({
            method: 'POST',
            url: '/customer/support-tickets',
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
};

export default supportTicketService;

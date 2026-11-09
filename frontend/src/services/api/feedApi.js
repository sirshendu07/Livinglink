import axiosInstance from './axiosInstance';

export const feedApi = {
  getMessages: async (params = {}) => {
    const res = await axiosInstance.get('/feed', { params });
    return res.data?.data;
  },

  sendMessage: async (content) => {
    const res = await axiosInstance.post('/feed', { content });
    return res.data?.data?.message;
  },

  editMessage: async (id, content) => {
    const res = await axiosInstance.patch(`/feed/${id}`, { content });
    return res.data?.data?.message;
  },

  deleteMessage: async (id) => {
    const res = await axiosInstance.delete(`/feed/${id}`);
    return res.data;
  },

  reportMessage: async (id, reason) => {
    const res = await axiosInstance.post(`/feed/${id}/report`, { reason });
    return res.data;
  }
};
